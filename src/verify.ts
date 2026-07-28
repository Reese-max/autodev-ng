import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { runProcess, type ProcResult } from './engines/proc.js'

export type VerifyStatus = 'pass' | 'fail' | 'skip'
export interface VerifyOutcome { status: VerifyStatus; detail: string }

const COMMAND_NOT_FOUND_RE = /not recognized|不是內部或外部命令|command not found/i

/** 機械層驗證：跑專案自己的測試指令。timeout=skip+detail（慢測試不可誤殺，舊教訓）；infra 故障 fail-open。 */
export async function runVerify(opts: {
  command: string | undefined
  cwd: string
  timeoutMs: number
}): Promise<VerifyOutcome> {
  if (!opts.command || opts.command.trim() === '') return { status: 'skip', detail: 'no verifyCommand configured' }
  const tokens = tokenize(opts.command)
  const [command, ...args] = tokens
  if (!command) return { status: 'skip', detail: 'unparseable verifyCommand' }
  if (!commandExists(command)) {
    return { status: 'skip', detail: `verify infra failure（command-not-found: ${command}，探測法）` }
  }
  const r = await runProcess({ command, args, cwd: opts.cwd, stdinText: '', timeoutMs: opts.timeoutMs })
  if (r.timedOut) return { status: 'skip', detail: `verify timeout ${opts.timeoutMs}ms（不算 FAIL，需告警）` }
  if (r.exitCode === 0) return { status: 'pass', detail: `ok ${r.durationMs}ms` }
  const notFoundDetail = commandNotFoundDetail(r)
  if (notFoundDetail) return { status: 'skip', detail: notFoundDetail }
  if (r.exitCode === null && r.stdout === '' && r.stderr === '') return { status: 'skip', detail: 'verify infra failure（spawn 全空）' }
  return { status: 'fail', detail: (r.stderr + '\n' + r.stdout).trim().slice(-1000) }
}

/**
 * verify 指令設定打錯字/根本不存在，屬 infra 誤判，不可當測試 FAIL（紅線 4）。涵蓋：
 * - POSIX exit 127、win32 exit 9009：shell/runtime 明確回報「找不到指令」
 * - stderr/stdout 含 not-recognized 類訊息（英文或中文 Windows 訊息）
 * - exitCode null 且 stderr 含 'ENOENT' 或 'spawn' 錯誤：spawn 層直接找不到執行檔
 *
 * 這兩道只當第二道保險——主判斷已改成 runVerify 內 spawn 前的 commandExists() 事前探測，
 * 不再事後用「訊息長相」猜測，避免真測試失敗的 stderr（含引號開頭斷言 + 混入非 UTF-8 亂碼片段）
 * 被誤判成 command-not-found 而漏放真紅（fail-closed 紅線）。
 */
function commandNotFoundDetail(r: ProcResult): string | undefined {
  if (r.exitCode === 127 || r.exitCode === 9009) {
    return `verify infra failure（command-not-found, exit=${r.exitCode}）`
  }
  const text = r.stderr + '\n' + r.stdout
  if (COMMAND_NOT_FOUND_RE.test(text)) {
    return 'verify infra failure（command-not-found, message matched）'
  }
  if (r.exitCode === null && /ENOENT|spawn/i.test(r.stderr)) {
    return 'verify infra failure（command-not-found, spawn error）'
  }
  return undefined
}

const commandExistsCache = new Map<string, boolean>()

/**
 * spawn 前事前探測指令是否存在，取代事後對 stderr 訊息長相的猜測。
 * - 含路徑分隔符（/ 或 \）：直接 existsSync 檢查該路徑
 * - bare name：win32 用 `where`、其他平台用 shell 的 `command -v`（execFileSync，exit 非 0 = 不存在）
 * - 探測本身包 try/catch：若探測工具自身故障（如 spawn 失敗，非「探測到不存在」的正常非零結束），
 *   視為「存在」不阻擋，讓後續真跑決定（探測失敗不可誤傷真指令）。
 */
function commandExists(command: string): boolean {
  if (/[\\/]/.test(command)) return existsSync(command)
  const cached = commandExistsCache.get(command)
  if (cached !== undefined) return cached
  let exists: boolean
  try {
    if (process.platform === 'win32') {
      execFileSync('where', [command], { stdio: 'ignore', timeout: 5000, windowsHide: true })
    } else {
      execFileSync('/bin/sh', ['-c', 'command -v "$1"', '--', command], { stdio: 'ignore', timeout: 5000 })
    }
    exists = true
  } catch (e) {
    const status = (e as { status?: number | null }).status
    // 探測工具跑起來了、只是回報非零（真的找不到）；其他情況（探測工具自身 spawn 失敗等）不阻擋
    exists = typeof status !== 'number'
  }
  commandExistsCache.set(command, exists)
  return exists
}

/** 拆 shell-like token，尊重雙引號（verifyCommand 來自使用者 config，可信）。 */
function tokenize(cmd: string): string[] {
  const out: string[] = []
  const re = /"([^"]*)"|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(cmd)) !== null) out.push(m[1] ?? m[2]!)
  return out
}
