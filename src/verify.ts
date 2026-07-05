import { runProcess, type ProcResult } from './proc.js'

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
 * - win32 中文系統下，cmd.exe 的「不是內部或外部命令」訊息常因系統 codepage（如 Big5）非 UTF-8，
 *   被當作 utf8 解碼腰斬成亂碼（含 U+FFFD replacement char）；退而求其次以「訊息以引號包住的
 *   指令名開頭 + 含亂碼」判斷，不受語系/codepage 影響。
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
  if (r.exitCode === 1 && /^'[^']+'/.test(r.stderr) && /�/.test(r.stderr)) {
    return 'verify infra failure（command-not-found, mangled locale message）'
  }
  return undefined
}

/** 拆 shell-like token，尊重雙引號（verifyCommand 來自使用者 config，可信）。 */
function tokenize(cmd: string): string[] {
  const out: string[] = []
  const re = /"([^"]*)"|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(cmd)) !== null) out.push(m[1] ?? m[2]!)
  return out
}
