import { existsSync, mkdirSync, rmSync, renameSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import {
  checkLockOwner, dirAgeMs, generationOf, ownerAlive,
  readPidFile, writeOwnPidFileOrCleanup, type LockHooks, type PidInfo,
} from './internal.js'

const RECLAIM_MTX_SUFFIX = '.reclaim' // 互斥鎖放 dir 的 sibling（不進 dir 內部，避免污染 dir mtime 的年齡判定）
const RECLAIM_MTX_STALE_MS = 60_000 // 回收工作為毫秒級；互斥殘骸逾 60s 視為崩潰遺留可打破

/** `${dir}.reclaim` sibling 目錄即「回收互斥鎖」：mkdir 原子性保證同一時刻只有一個回收者。
 *  放 dir 外面是刻意的——建進 dir 會刷新 dir mtime，讓 stale 年齡複核永遠失效。
 *  回傳持有權 claim（供收尾驗明正身）；失敗回 null。
 *  打破殘骸必須用 capture-by-rename：先原子 rename 搬走，再驗證捕獲物仍是死世代才刪——
 *  盲 rm 會讓兩個打破者互刪互斥而雙雙進入臨界區（雙持有者事故，與本檔要修的是同一類）。 */
function acquireReclaimMtx(dir: string): string | null {
  const mtx = `${dir}${RECLAIM_MTX_SUFFIX}`
  const claim = `${process.pid}-${randomUUID()}`
  try {
    mkdirSync(mtx, { recursive: false })
    writeOwnPidFileOrCleanup(mtx, claim)
    return claim
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOENT') return null // 鎖目錄本身已被清走
    if (code !== 'EEXIST') throw err
  }

  // 互斥已存在：持有者活著→讓步；死亡或殘骸過期→打破後重試一次。
  const owner = checkLockOwner(mtx)
  if (owner === 'alive') return null
  if (owner === 'unknown') {
    const age = dirAgeMs(mtx)
    if (age === null || age <= RECLAIM_MTX_STALE_MS) return null
  }

  // capture：rename 是原子操作，同一時刻只有一個打破者能搬走該殘骸（輸家 ENOENT 讓步）。
  const captured = `${mtx}.dead-${process.pid}-${randomUUID()}`
  try {
    renameSync(mtx, captured)
  } catch {
    return null // 殘骸已被其他打破者搬走或持有者自行收尾——讓步，下輪再試
  }
  // 驗證捕獲物：若觀察→rename 之間殘骸已被換成活的新互斥，放回去讓步（絕不刪活互斥）。
  const verdict = checkLockOwner(captured)
  const capturable = verdict === 'dead'
    || (verdict === 'unknown' && (dirAgeMs(captured) ?? 0) > RECLAIM_MTX_STALE_MS)
  if (!capturable) {
    try { renameSync(captured, mtx) } catch { /* 路徑被第三方佔走：留捕獲目錄供檢查，不刪 */ }
    return null
  }
  rmSync(captured, { recursive: true, force: true })

  try {
    mkdirSync(mtx, { recursive: false })
    writeOwnPidFileOrCleanup(mtx, claim)
    return claim
  } catch (retryErr) {
    const retryCode = (retryErr as NodeJS.ErrnoException).code
    if (retryCode === 'EEXIST' || retryCode === 'ENOENT') return null // 另一個打破者贏了，或父目錄消失
    throw retryErr
  }
}

/** 捕獲目錄 stolen 是否仍是當初觀察到的死世代：世代指紋一致且沒有 recovery-required 標記。
 *  世代在複核→rename 之間被換掉時（互斥外的移除路徑：合法 token release、外力清除），
 *  捕獲物會是新世代——此時必須放回去，絕不能刪。 */
function capturedIsObservedGeneration(stolen: string, observed: PidInfo | null): boolean {
  if (existsSync(join(stolen, 'recovery-required.json'))) return false
  const captured = readPidFile(stolen)
  if (captured === null || observed === null) return captured === null && observed === null
  return generationOf(captured) === generationOf(observed)
}

/** 在回收互斥內搬走並刪除目標鎖目錄。take=null 只清除不接管（releaseDeadLock 用）。
 *  互斥持有期間 dir 仍可能被持死世代 token 的第三方 release 或外力移除——
 *  因此 rename 捕獲後必須再次驗證捕獲物世代，不符即放還。 */
export function reclaimLockDir(dir: string, observed: PidInfo | null, staleMs: number, take: { token: string } | null, hooks?: LockHooks): boolean {
  const claim = acquireReclaimMtx(dir)
  if (!claim) return false
  try {
    hooks?.insideReclaim?.()

    // 世代複核：pid.json 世代不符＝觀察後已有新世代建立 → 讓步，絕不搬走活鎖。
    const now = readPidFile(dir)
    if (now === null || observed === null) {
      if (now !== null || observed !== null) return false // 一側形態改變＝世代已動
      const age = dirAgeMs(dir) // 兩側皆無 pid.json：以 dir mtime 重新驗過期（檔案被補寫會刷新 mtime）
      if (age === null || age <= staleMs) return false
    } else {
      if (generationOf(now) !== generationOf(observed)) return false
      if (ownerAlive(now)) return false // 防禦性複活檢查
    }

    // rename 為原子操作；但複核→rename 之間 dir 可能已被換成新世代，捕獲後必須驗明正身。
    hooks?.beforeRename?.()
    const stolen = `${dir}.stale-${process.pid}-${randomUUID()}`
    try {
      renameSync(dir, stolen)
    } catch (renameErr) {
      if ((renameErr as NodeJS.ErrnoException).code !== 'ENOENT') throw renameErr
      return false
    }
    if (!capturedIsObservedGeneration(stolen, observed)) {
      // 捕獲到的是新世代或被標記 recovery-required：放回原路徑讓步。
      // 放還失敗（路徑又被佔）時保留 stolen 目錄供檢查——它是別人的世代，不刪。
      try { renameSync(stolen, dir) } catch { /* 路徑被佔：留 .stale- 殘骸供人工檢查 */ }
      return false
    }
    rmSync(stolen, { recursive: true, force: true })

    if (take) {
      try {
        mkdirSync(dir, { recursive: false })
      } catch (mkdirErr) {
        // EEXIST：路徑空窗被第三方新鎖佔走——它合法持有，讓步。
        if ((mkdirErr as NodeJS.ErrnoException).code !== 'EEXIST') throw mkdirErr
        return false
      }
      writeOwnPidFileOrCleanup(dir, take.token)
    }
    return true
  } finally {
    // 收尾只刪「仍是我們 claim 的」互斥；若互斥已被打破重建，留在原處的是新持有者的。
    try {
      const mtx = `${dir}${RECLAIM_MTX_SUFFIX}`
      if (readPidFile(mtx)?.token === claim) rmSync(mtx, { recursive: true, force: true })
    } catch {
      // 互斥目錄被外力清走：無殘骸可清，吞掉。
    }
  }
}
