import { mkdirSync, rmSync, statSync, renameSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

interface PidInfo {
  pid: number
  startedAt: string
}

/** process.kill(pid, 0) 不拋=活、EPERM=活（無權限但存在）、ESRCH=死。其餘未知例外 fail-safe 視為活著（不誤搶）。 */
function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return (err as NodeJS.ErrnoException).code !== 'ESRCH'
  }
}

/** Windows 會重用 PID；若目前程序的啟動時間晚於鎖建立時間，它不可能是原持鎖者。 */
function isReusedWindowsPid(pid: number, lockStartedAt: string): boolean {
  if (process.platform !== 'win32') return false
  const lockStartedAtMs = Date.parse(lockStartedAt)
  if (!Number.isFinite(lockStartedAtMs)) return false

  try {
    const raw = execFileSync('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `(Get-Process -Id ${pid} -ErrorAction Stop).StartTime.ToUniversalTime().ToString('o')`,
    ], { encoding: 'utf8', timeout: 5_000, windowsHide: true })
    const processStartedAtMs = Date.parse(raw.trim())
    return Number.isFinite(processStartedAtMs) && processStartedAtMs > lockStartedAtMs + 5_000
  } catch {
    // ponytail: Windows-only identity check; fail-safe as alive if the probe is unavailable.
    return false
  }
}

/** 讀 dir/pid.json 判定鎖主人是否存活。缺失/損壞/pid 非正整數一律回 'unknown'（fallback 舊 mtime 邏輯），
 *  讀取過程任何例外皆視為「損壞」（驗活是盡力而為，不 rethrow）。 */
function checkLockOwner(dir: string): 'alive' | 'dead' | 'unknown' {
  try {
    const parsed = JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8')) as Partial<PidInfo>
    const pid = parsed.pid
    if (typeof pid !== 'number' || !Number.isInteger(pid) || pid <= 0) return 'unknown'
    if (!isPidAlive(pid)) return 'dead'
    if (typeof parsed.startedAt === 'string' && isReusedWindowsPid(pid, parsed.startedAt)) return 'dead'
    return 'alive'
  } catch {
    return 'unknown'
  }
}

function writeFileAtomic(file: string, content: string): void {
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`
  writeFileSync(tmp, content)
  renameSync(tmp, file)
}

/** 比照 events.ts heartbeat 的 tmp+rename 原子寫慣例，記錄目前持鎖者身分供下次驗活。 */
function writeOwnPidFile(dir: string): void {
  writeFileAtomic(join(dir, 'pid.json'), JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }))
}

/** writeOwnPidFile 失敗（ENOSPC/EIO 等）時，剛建立的 dir 已是「無 pid.json、無主」的幽靈鎖，
 *  會擋住後續所有 acquire（含自己重試）長達 staleMs。此處補償刪除該 dir 再 rethrow 原錯；
 *  rmSync 本身若又失敗，吞掉（避免二次故障掩蓋原始錯誤），仍以原錯為準浮出。 */
function writeOwnPidFileOrCleanup(dir: string): void {
  try {
    writeOwnPidFile(dir)
  } catch (err) {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      // 二次故障：吞掉，原始錯誤才是需要浮出的訊號。
    }
    throw err
  }
}

/** Windows 無 flock：mkdir 是唯一可靠的原子互斥（舊系統實證）。 */
export function acquireLock(dir: string, staleMs = 30 * 60 * 1000): boolean {
  try {
    mkdirSync(dir, { recursive: false })
    writeOwnPidFileOrCleanup(dir)
    return true
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err

    // (1) pid.json 指向存活進程 → 直接讓步，不看 mtime（修「假 stale」：長任務不更新 mtime 被誤搶）。
    const owner = checkLockOwner(dir)
    if (owner === 'alive') return false

    // (3) pid.json 缺失/損壞 → fallback 既有 mtime 年齡判定（staleMs 語意保留）。
    if (owner === 'unknown') {
      let age: number
      try {
        age = Date.now() - statSync(dir).mtimeMs
      } catch (statErr) {
        // ENOENT：鎖目錄在檢查 age 前已被清走（正常讓步）。其他 code 為 infra 故障，須浮出。
        if ((statErr as NodeJS.ErrnoException).code !== 'ENOENT') throw statErr
        return false
      }
      if (age <= staleMs) return false
    }
    // owner === 'dead'：不等 staleMs，立即進入以下搶奪流程（修「假 fresh」：崩潰後 30 分內鎖佔著茅坑）。

    // rename 為原子操作：同一路徑只有一個 process 能搶到，輸家直接讓步。
    const stolen = `${dir}.stale-${process.pid}-${Date.now()}`
    try {
      renameSync(dir, stolen)
    } catch (renameErr) {
      // ENOENT：競爭者已搶先 rename 走，正常讓步。其他 code（EPERM/EBUSY 等）為 infra 故障，須浮出。
      if ((renameErr as NodeJS.ErrnoException).code !== 'ENOENT') throw renameErr
      return false
    }
    rmSync(stolen, { recursive: true, force: true })
    try {
      mkdirSync(dir, { recursive: false })
    } catch (mkdirErr) {
      // EEXIST：rename 贏家仍可能撞上第三方剛建立的新鎖，讓步。其他 code 為 infra 故障，須浮出。
      if ((mkdirErr as NodeJS.ErrnoException).code !== 'EEXIST') throw mkdirErr
      return false
    }
    writeOwnPidFileOrCleanup(dir)
    return true
  }
}

export function releaseLock(dir: string): void {
  rmSync(dir, { recursive: true, force: true })
}
