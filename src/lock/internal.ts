import { rmSync, lstatSync, renameSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

/** lock.ts 與 reclaim.ts 共用的內部機制；不屬於公開 API（外部模組只應 import ../lock.js）。 */

export interface PidInfo {
  pid: number
  startedAt: string
  token?: string
}

type ProcessStartTimeReader = (pid: number) => string

/** process.kill(pid, 0) 不拋=活、EPERM=活（無權限但存在）、ESRCH=死。其餘未知例外 fail-safe 視為活著（不誤搶）。 */
export function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return (err as NodeJS.ErrnoException).code !== 'ESRCH'
  }
}

/** Windows 會重用 PID；若目前程序的啟動時間晚於鎖建立時間，它不可能是原持鎖者。 */
function windowsProcessStartTime(pid: number): string {
  return execFileSync('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    `(Get-Process -Id ${pid} -ErrorAction Stop).StartTime.ToUniversalTime().ToString('o')`,
  ], { encoding: 'utf8', timeout: 5_000, windowsHide: true })
}

export function isReusedWindowsPid(pid: number, lockStartedAt: string, readProcessStartTime: ProcessStartTimeReader = windowsProcessStartTime): boolean {
  if (process.platform !== 'win32') return false
  const lockStartedAtMs = Date.parse(lockStartedAt)
  if (!Number.isFinite(lockStartedAtMs)) return false

  try {
    const processStartedAtMs = Date.parse(readProcessStartTime(pid).trim())
    return Number.isFinite(processStartedAtMs) && processStartedAtMs > lockStartedAtMs + 5_000
  } catch {
    // ponytail: Windows-only identity check; fail-safe as alive if the probe is unavailable.
    return false
  }
}

/** Return null for a missing lock directory and reject unsafe leaf paths without following them. */
export function safeLockDirStat(dir: string): ReturnType<typeof lstatSync> | null {
  let stat: ReturnType<typeof lstatSync>
  try {
    stat = lstatSync(dir)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
  if (stat.isSymbolicLink()) {
    const error = new Error(`Lock path must not be a symlink or junction: ${dir}`) as NodeJS.ErrnoException
    error.code = 'ERR_UNSAFE_LOCK_PATH'
    throw error
  }
  if (!stat.isDirectory()) {
    const error = new Error(`Lock path is not a directory: ${dir}`) as NodeJS.ErrnoException
    error.code = 'ENOTDIR'
    throw error
  }
  return stat
}

function requireSafeLockDir(dir: string): void {
  if (safeLockDirStat(dir)) return
  const error = new Error(`Lock directory does not exist: ${dir}`) as NodeJS.ErrnoException
  error.code = 'ENOENT'
  throw error
}

/** 讀取 dir/pid.json；缺失/損壞/pid 非正整數一律回 null（驗活是盡力而為，不 rethrow）。 */
export function readPidFile(dir: string): PidInfo | null {
  if (!safeLockDirStat(dir)) return null
  let raw: string
  try {
    raw = readFileSync(join(dir, 'pid.json'), 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PidInfo> | null
    if (!parsed || typeof parsed !== 'object') return null
    const pid = parsed.pid
    if (typeof pid !== 'number' || !Number.isInteger(pid) || pid <= 0) return null
    return { pid, startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : '', token: typeof parsed.token === 'string' ? parsed.token : undefined }
  } catch {
    // Malformed JSON retains the legacy unknown/mtime fallback; filesystem errors above propagate.
    return null
  }
}

/** pid.json 持有者是否仍活著（含 Windows PID 重用複活檢查）。 */
export function ownerAlive(info: PidInfo, readProcessStartTime?: ProcessStartTimeReader): boolean {
  return isPidAlive(info.pid) && !(info.startedAt && isReusedWindowsPid(info.pid, info.startedAt, readProcessStartTime))
}

/** 讀 dir/pid.json 判定鎖主人是否存活。缺失/損壞/pid 非正整數一律回 'unknown'（fallback 舊 mtime 邏輯）。 */
export function checkLockOwner(dir: string): 'alive' | 'dead' | 'unknown' {
  const info = readPidFile(dir)
  if (!info) return 'unknown'
  return ownerAlive(info) ? 'alive' : 'dead'
}

/** 世代指紋：新格式用 token；舊格式（無 token）退回 pid+startedAt 以相容既有磁碟上的鎖。 */
export function generationOf(info: PidInfo): string {
  return info.token ?? `legacy:${info.pid}:${info.startedAt}`
}

/** dir 年齡；ENOENT（檢查前已被清走）回 null 交由呼叫端讓步。 */
export function dirAgeMs(dir: string): number | null {
  const stat = safeLockDirStat(dir)
  return stat ? Date.now() - stat.mtimeMs : null
}

export function writeFileAtomic(file: string, content: string): void {
  const tmp = `${file}.tmp-${process.pid}-${randomUUID()}`
  writeFileSync(tmp, content)
  renameSync(tmp, file)
}

/** 比照 events.ts heartbeat 的 tmp+rename 原子寫慣例，記錄目前持鎖者身分供下次驗活與世代比對。 */
export function writeOwnPidFile(dir: string, token: string, startedAt = new Date().toISOString()): void {
  requireSafeLockDir(dir)
  writeFileAtomic(join(dir, 'pid.json'), JSON.stringify({ pid: process.pid, startedAt, token }))
}

/** 判定「dir 裡沒有已提交世代」才可刪：有 pid.json（別人的世代）或 recovery-required 標記都拒絕。
 *  我們失敗的寫入只會留下 pid.json.tmp-* 孤兒或空目錄，不會出現已提交的 pid.json。 */
export function removeIfUnclaimed(dir: string): void {
  try {
    if (!safeLockDirStat(dir)) return
    const entries = readdirSync(dir)
    if (entries.includes('pid.json') || entries.includes('recovery-required.json')) return
    if (!safeLockDirStat(dir)) return
    rmSync(dir, { recursive: true, force: true })
  } catch {
    // 目錄已消失或不可讀：保守不動。
  }
}

/** writeOwnPidFile 失敗（ENOSPC/EIO 等）時，剛建立的 dir 已是「無 pid.json、無主」的幽靈鎖，
 *  會擋住後續所有 acquire（含自己重試）長達 staleMs。此處補償刪除該 dir 再 rethrow 原錯；
 *  但只在 dir 仍未被他人提交世代時刪——盲 rm 可能刪掉在空窗內搶佔成功的新世代。 */
export function writeOwnPidFileOrCleanup(dir: string, token: string, startedAt?: string): void {
  try {
    writeOwnPidFile(dir, token, startedAt)
  } catch (err) {
    removeIfUnclaimed(dir)
    throw err
  }
}
