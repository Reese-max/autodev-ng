import { runProcess } from './proc.js'

export type VerifyStatus = 'pass' | 'fail' | 'skip'
export interface VerifyOutcome { status: VerifyStatus; detail: string }

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
  if (r.exitCode === null && r.stdout === '' && r.stderr === '') return { status: 'skip', detail: 'verify infra failure（spawn 全空）' }
  return { status: 'fail', detail: (r.stderr + '\n' + r.stdout).trim().slice(-1000) }
}

/** 拆 shell-like token，尊重雙引號（verifyCommand 來自使用者 config，可信）。 */
function tokenize(cmd: string): string[] {
  const out: string[] = []
  const re = /"([^"]*)"|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(cmd)) !== null) out.push(m[1] ?? m[2]!)
  return out
}
