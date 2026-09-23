import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import {
  dirAgeMs, generationOf, ownerAlive,
  readPidFile, writeOwnPidFileOrCleanup, type LockHooks, type PidInfo,
} from './lock/internal.js'
import { reclaimLockDir } from './lock/reclaim.js'

export type { LockHooks } from './lock/internal.js'

/** Windows 無 flock：mkdir 是唯一可靠的原子互斥（舊系統實證）。
 *  回傳持有權 token（寫入 pid.json），供 releaseLock 驗證世代；失敗回 null。 */
export function acquireLock(dir: string, staleMs = 30 * 60 * 1000, hooks?: LockHooks): string | null {
  const token = randomUUID()
  try {
    mkdirSync(dir, { recursive: false })
    writeOwnPidFileOrCleanup(dir, token)
    return token
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err

    // An uncertain backend survives its local owner; elapsed time cannot release it.
    if (existsSync(join(dir, 'recovery-required.json'))) return null

    // (1) pid.json 指向存活進程 → 直接讓步，不看 mtime（修「假 stale」：長任務不更新 mtime 被誤搶）。
    const observed = readPidFile(dir)
    const owner = observed ? (ownerAlive(observed) ? 'alive' : 'dead') : 'unknown'
    if (owner === 'alive') return null

    // (3) pid.json 缺失/損壞 → fallback 既有 mtime 年齡判定（staleMs 語意保留）。
    if (owner === 'unknown') {
      const age = dirAgeMs(dir)
      if (age === null) return null // ENOENT：鎖目錄在檢查 age 前已被清走（正常讓步）
      if (age <= staleMs) return null
    }
    // owner === 'dead'：不等 staleMs，立即進入搶奪流程（修「假 fresh」：崩潰後 30 分內鎖佔著茅坑）。

    return reclaimLockDir(dir, observed, staleMs, { token }, hooks) ? token : null
  }
}

/** 世代驗證釋放：只有 dir/pid.json 仍記錄同一世代（token 或舊格式 legacy:pid:startedAt 指紋）才刪除；
 *  舊 token、錯誤持有者、重複 release 一律 no-op——新世代鎖不會被過期觀察刪掉。
 *  活持有者存在期間沒有任何路徑能替換 dir（回收需觀察到死亡），因此 check→rm 無 TOCTOU。 */
export function releaseLock(dir: string, token?: string | null): void {
  if (!token) return
  const now = readPidFile(dir)
  if (!now || generationOf(now) !== token) return // 舊格式鎖用 legacy:pid:startedAt 指紋釋放
  rmSync(dir, { recursive: true, force: true })
}

/** 監督者／守護行程專用：只在持有者確定死亡（或過期無主）時移除鎖目錄，自己不成為持有者。
 *  活鎖、recovery-required、未知新鮮狀態一律不動。回傳是否實際移除。 */
export function releaseDeadLock(dir: string, staleMs = 30 * 60 * 1000): boolean {
  try {
    if (!existsSync(dir)) return false
    if (existsSync(join(dir, 'recovery-required.json'))) return false
    const observed = readPidFile(dir)
    const owner = observed ? (ownerAlive(observed) ? 'alive' : 'dead') : 'unknown'
    if (owner === 'alive') return false
    if (owner === 'unknown') {
      const age = dirAgeMs(dir)
      if (age === null) return false
      if (age <= staleMs) return false
    }
    return reclaimLockDir(dir, observed, staleMs, null)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw err
  }
}
