import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { runProcess, type ProcResult } from './proc.js'
import { formatVerifyFailureDetail } from './verify-detail.js'

export type VerifyStatus = 'pass' | 'fail' | 'skip' | 'blocked'

/** 每一步的執行證據；未執行的步驟明確標記，不冒充成功。 */
export interface VerifyStepResult {
  step: number
  command: string
  executed: boolean
  exitCode?: number | null
  timedOut?: boolean
  skipped?: 'after-failure' | 'after-timeout' | 'rejected'
}

export interface VerifyOutcome {
  status: VerifyStatus
  detail: string
  executed?: boolean
  exitCode?: number | null
  steps?: VerifyStepResult[]
}

/** 步驟清單的顯示/傳遞形：陣列以 && 銜接（語意即序接 fail-fast）。 */
export function verifyCommandText(command: string | readonly string[] | undefined): string | undefined {
  return typeof command === 'string' || command === undefined ? command : command.join(' && ')
}

const COMMAND_NOT_FOUND_RE = /not recognized|不是內部或外部命令|command not found/i

export async function runVerify(opts: { command: string | readonly string[] | undefined; cwd: string; timeoutMs: number; env?: Record<string, string> }): Promise<VerifyOutcome> {
  const raw = typeof opts.command === 'string' ? [opts.command] : [...(opts.command ?? [])]
  const declared = raw.map((s, i): VerifyStepResult => ({ step: i + 1, command: s, executed: false, skipped: 'rejected' }))
  if (raw.length === 0 || raw.every(s => s.trim() === '')) return { status: 'skip', detail: 'no verifyCommand configured', executed: false, exitCode: null }

  // #48：先把整組命令解析成步驟清單——`&&` 是唯一支援的串接（序接 fail-fast，
  // 與 shell 語意一致）；其他 shell 元字元在任何一步執行前明確拒絕，
  // 不默默只跑第一步。空步驟／殘缺鏈同樣先拒絕。
  const steps: string[] = []
  for (const part of raw) {
    const split = splitSteps(part)
    if (!split.ok) return { status: 'blocked', detail: split.detail, executed: false, exitCode: null, steps: declared }
    steps.push(...split.steps)
  }
  const stepTokens: string[][] = []
  for (const s of steps) {
    const tokens = tokenize(s)
    if (!tokens[0]) return { status: 'blocked', detail: `unparseable verifyCommand（step: ${s.slice(0, 80)}）`, executed: false, exitCode: null, steps: declared }
    stepTokens.push(tokens)
  }

  const results: VerifyStepResult[] = []
  const t0 = Date.now()
  let last: ProcResult | undefined
  for (let i = 0; i < steps.length; i++) {
    const prefix = steps.length > 1 ? `step ${i + 1}/${steps.length}: ` : ''
    const [command, ...args] = stepTokens[i]!
    if (!commandExists(command!)) {
      // 本步是失敗本身（非被跳過）：executed:false 但不帶 skipped 標記
      results.push({ step: i + 1, command: steps[i]!, executed: false })
      markSkipped(results, steps, i + 1, 'after-failure')
      return { status: 'blocked', detail: `${prefix}verify infra failure（command-not-found: ${command}，探測法）`, executed: results.some(s => s.executed), exitCode: last?.exitCode ?? null, steps: results }
    }
    const remaining = opts.timeoutMs - (Date.now() - t0)
    if (remaining <= 0) {
      markSkipped(results, steps, i, 'after-timeout')
      return { status: 'blocked', detail: `${prefix}verify timeout ${opts.timeoutMs}ms`, executed: results.some(s => s.executed), exitCode: last?.exitCode ?? null, steps: results }
    }
    let r: ProcResult
    try { r = await runProcess({ command: command!, args, cwd: opts.cwd, stdinText: '', timeoutMs: remaining, env: opts.env }) }
    catch (err) {
      results.push({ step: i + 1, command: steps[i]!, executed: false })
      markSkipped(results, steps, i + 1, 'after-failure')
      return { status: 'blocked', detail: `${prefix}verify infra failure（spawn exception: ${String(err).slice(0, 300)}）`, executed: results.some(s => s.executed), exitCode: last?.exitCode ?? null, steps: results }
    }
    last = r
    results.push({ step: i + 1, command: steps[i]!, executed: true, exitCode: r.exitCode, ...(r.timedOut ? { timedOut: true } : {}) })
    if (r.timedOut) {
      markSkipped(results, steps, i + 1, 'after-timeout')
      return { status: 'blocked', detail: `${prefix}verify timeout ${opts.timeoutMs}ms`, executed: true, exitCode: r.exitCode, steps: results }
    }
    if (r.exitCode === 0) continue
    markSkipped(results, steps, i + 1, 'after-failure')
    const notFoundDetail = commandNotFoundDetail(r)
    if (notFoundDetail) return { status: 'blocked', detail: `${prefix}${notFoundDetail}`, executed: true, exitCode: r.exitCode, steps: results }
    if (r.exitCode === null && r.stdout === '' && r.stderr === '') return { status: 'blocked', detail: `${prefix}verify infra failure（spawn 全空）`, executed: true, exitCode: r.exitCode, steps: results }
    return { status: 'fail', detail: `${prefix}${formatVerifyFailureDetail(r.stderr, r.stdout).slice(0, 1000)}`, executed: true, exitCode: r.exitCode, steps: results }
  }
  return { status: 'pass', detail: `ok ${Date.now() - t0}ms`, executed: true, exitCode: 0, steps: results }
}

/** 把未執行的後續步驟補進證據列——executed:false，絕不冒充。 */
function markSkipped(results: VerifyStepResult[], steps: string[], from: number, skipped: VerifyStepResult['skipped']): void {
  for (let i = from; i < steps.length; i++) results.push({ step: i + 1, command: steps[i]!, executed: false, skipped })
}

/**
 * 切出 `&&` 序接步驟；引號（"..."）內的內容原樣保留不當指令。
 * 其他 shell 元字元（||、;、|、>、<、&、`、$(、換行）一律拒絕——
 * 它們的語意不是序接 fail-fast，靜默吞掉會重製 #48 的假通過。
 * 引號模型刻意極簡：只認 " 成對切換、無 \" 轉義、單引號不當引號——
 * 與既有 tokenizer 一致，歧義輸入走拒絕而非猜測。
 */
export function splitSteps(cmd: string): { ok: true; steps: string[] } | { ok: false; detail: string } {
  const steps: string[] = []
  let cur = '', inQuote = false
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i]!
    if (ch === '"') { inQuote = !inQuote; cur += ch; continue }
    if (inQuote) { cur += ch; continue }
    if (ch === '&' && cmd[i + 1] === '&') { steps.push(cur); cur = ''; i++; continue }
    if ('|;><&`\n\r'.includes(ch) || (ch === '$' && cmd[i + 1] === '(')) {
      return { ok: false, detail: `verify infra failure（unsupported shell syntax ${JSON.stringify(ch === '$' ? '$(' : ch)}——只支援 && 序接；多步驟請用陣列設定）` }
    }
    cur += ch
  }
  if (inQuote) return { ok: false, detail: 'verify infra failure（unterminated quote in verifyCommand）' }
  steps.push(cur)
  if (steps.some(s => s.trim() === '')) return { ok: false, detail: 'verify infra failure（empty step in && chain）' }
  return { ok: true, steps }
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
