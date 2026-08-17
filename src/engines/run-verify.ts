import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { runProcess, type ProcResult } from './proc.js'
import { formatVerifyFailureDetail } from './verify-detail.js'

export type VerifyStatus = 'pass' | 'fail' | 'skip' | 'blocked'
export interface VerifyOutcome { status: VerifyStatus; detail: string; executed?: boolean; exitCode?: number | null }

const COMMAND_NOT_FOUND_RE = /not recognized|不是內部或外部命令|command not found/i
export async function runVerify(opts: { command: string | undefined; cwd: string; timeoutMs: number; env?: Record<string, string> }): Promise<VerifyOutcome> {
  if (!opts.command || opts.command.trim() === '') return { status: 'skip', detail: 'no verifyCommand configured', executed: false, exitCode: null }
  const [command, ...args] = tokenize(opts.command)
  if (!command) return { status: 'blocked', detail: 'unparseable verifyCommand', executed: false, exitCode: null }
  if (!commandExists(command)) return { status: 'blocked', detail: `verify infra failure（command-not-found: ${command}，探測法）`, executed: false, exitCode: null }
  let r: ProcResult
  try { r = await runProcess({ command, args, cwd: opts.cwd, stdinText: '', timeoutMs: opts.timeoutMs, env: opts.env }) }
  catch (err) { return { status: 'blocked', detail: `verify infra failure（spawn exception: ${String(err).slice(0, 300)}）`, executed: false, exitCode: null } }
  const execution = { executed: true, exitCode: r.exitCode }
  if (r.timedOut) return { status: 'blocked', detail: `verify timeout ${opts.timeoutMs}ms`, ...execution }
  if (r.exitCode === 0) return { status: 'pass', detail: `ok ${r.durationMs}ms`, ...execution }
  const notFoundDetail = commandNotFoundDetail(r)
  if (notFoundDetail) return { status: 'blocked', detail: notFoundDetail, ...execution }
  if (r.exitCode === null && r.stdout === '' && r.stderr === '') return { status: 'blocked', detail: 'verify infra failure（spawn 全空）', ...execution }
  return { status: 'fail', detail: formatVerifyFailureDetail(r.stderr, r.stdout).slice(0, 1000), ...execution }
}

function commandNotFoundDetail(r: ProcResult): string | undefined {
  if (r.exitCode === 127 || r.exitCode === 9009) return `verify infra failure（command-not-found, exit=${r.exitCode}）`
  const text = `${r.stderr}\n${r.stdout}`
  if (COMMAND_NOT_FOUND_RE.test(text)) return 'verify infra failure（command-not-found, message matched）'
  if (r.exitCode === null && /ENOENT|spawn/i.test(r.stderr)) return 'verify infra failure（command-not-found, spawn error）'
  return undefined
}

const commandExistsCache = new Map<string, boolean>()
function commandExists(command: string): boolean {
  if (/[\\/]/.test(command)) return existsSync(command)
  const cached = commandExistsCache.get(command)
  if (cached !== undefined) return cached
  let exists: boolean
  try {
    if (process.platform === 'win32') execFileSync('where', [command], { stdio: 'ignore', timeout: 5000, windowsHide: true })
    else execFileSync('/bin/sh', ['-c', 'command -v "$1"', '--', command], { stdio: 'ignore', timeout: 5000 })
    exists = true
  } catch (e) {
    const status = (e as { status?: number | null }).status
    exists = typeof status !== 'number'
  }
  commandExistsCache.set(command, exists)
  return exists
}

function tokenize(cmd: string): string[] {
  const out: string[] = [], re = /"([^"]*)"|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(cmd)) !== null) out.push(m[1] ?? m[2]!)
  return out
}
