import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { DEFAULT_ENGINE_IDLE_TIMEOUT_MS, runProcess } from './proc.js'
import { cancelledRun } from './run-control.js'
import type { PreflightCache } from '../preflight.js'
import { defaultCommitHash } from './commit-hash.js'
import { WORKER_GUARDS } from './prompt-guard.js'

export interface CopilotOpts {
  id?: string // 觀測用引擎識別；registry 以 tag 帶入區分多檔位，未設維持 'copilot'
  command?: string
  baseArgs?: string[] // 預設 --output-format json＋--allow-all-tools（非互動必帶，規格卡卡 5）。model 旗標另組
  timeoutMs?: number
  pingTimeoutMs?: number
  idleTimeoutMs?: number
  cache: PreflightCache
  getCommitHash?: (cwd: string) => string | undefined
  env?: Record<string, string>
  model?: string // 未設鎖 gpt-5.4-mini（0x premium ≈ 免費；規格卡舊名 gpt-5-mini 在 CLI 1.0.68 已下架，2026-07-07 探針實證）
}

const PROMPT_MAX = 6000 // 規格卡：copilot prompt 只能 argv（無 stdin/prompt-file）→ 截長防 8191 上限
const LINE_MAX = 200_000 // encrypted blob 巨大行防禦：單行超過此長度不進 JSON.parse（防記憶體/CPU 尖峰）
const OUTPUT_CAP = 20_000_000 // result 尾事件在輸出最末端；blob 使輸出巨大，cap 太小會把 result 截掉

/** M5 Task 5：copilot CLI 引擎（規格卡 m5-cli-engines-research.md 卡 5）。
 * JSONL 事件流，尾事件 result 含 usage.premiumRequests/codeChanges（僅記錄於 output，不當金額）；
 * 無 USD 欄位 → costUsd 恆 0＋costUnknown:true，scheduler 記 config costPerRunUsd。
 * 冷啟實測 110s（六家最慢）→ pingTimeoutMs 預設 180s。成功硬證據＝result 事件＋commit 前進。 */
export class CopilotEngine implements Engine {
  readonly id: string
  private readonly command: string
  private readonly baseArgs: string[]
  private readonly timeoutMs: number
  private readonly pingTimeoutMs: number
  private readonly idleTimeoutMs: number
  private readonly cache: PreflightCache
  private readonly getCommitHash: (cwd: string) => string | undefined
  private readonly env?: Record<string, string>

  constructor(opts: CopilotOpts) {
    this.id = opts.id ?? 'copilot'
    this.command = opts.command ?? 'copilot'
    this.baseArgs = [...(opts.baseArgs ?? ['--output-format', 'json', '--allow-all-tools']), '--model', opts.model ?? 'gpt-5.4-mini']
    this.timeoutMs = opts.timeoutMs ?? 15 * 60 * 1000
    this.pingTimeoutMs = opts.pingTimeoutMs ?? 180 * 1000 // 冷啟 110s 實測 → 90s 級必假陰性
    this.idleTimeoutMs = opts.idleTimeoutMs ?? DEFAULT_ENGINE_IDLE_TIMEOUT_MS
    this.cache = opts.cache
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
    this.env = opts.env
  }

  /** 最小探針（gpt-5-mini 0x ≈ 免費）；好壞結果都 cache，防連環重打。 */
  async preflight(): Promise<PreflightResult> {
    const cached = this.cache.get(this.command)
    if (cached) return cached
    let result: PreflightResult
    try {
      const r = await runProcess({
        command: this.command, args: [...this.baseArgs, '-p', 'Reply with exactly: PONG'],
        cwd: process.cwd(), stdinText: '', timeoutMs: this.pingTimeoutMs, maxOutputChars: OUTPUT_CAP, env: this.env
      })
      result = parseJsonl(r.stdout).result && r.stdout.includes('PONG')
        ? { ok: true, detail: `PONG ${r.durationMs}ms` }
        : { ok: false, detail: r.timedOut ? 'ping timeout' : `no PONG/result (exit ${r.exitCode}) ${r.stderr.slice(0, 120)}` }
    } catch (err) {
      result = { ok: false, detail: String(err).slice(0, 200) }
    }
    this.cache.set(this.command, result)
    return result
  }

  invalidatePreflight(): void { this.cache.set(this.command, { ok: false, detail: 'run-failed：下輪重探' }, 0) } // ts=0＝寫入即過期

  async run(job: Job): Promise<RunResult> {
    const before = this.getCommitHash(job.projectPath)
    const r = await runProcess({
      command: this.command, args: [...this.baseArgs, '-p', buildPrompt(job)],
      cwd: job.projectPath, stdinText: '', timeoutMs: this.timeoutMs, idleTimeoutMs: this.idleTimeoutMs, maxOutputChars: OUTPUT_CAP, env: this.env, control: job.control
    })

    if (r.aborted || job.control?.signal?.aborted) return cancelledRun(r.stderr)
    if (r.timedOut) return { ok: false, output: tail(r.stderr), costUsd: 0, costUnknown: true, failureReason: 'timeout' }
    if (r.exitCode !== 0) {
      return { ok: false, output: tail(r.stderr), costUsd: 0, costUnknown: true, failureReason: `exit ${r.exitCode}: ${r.stderr.slice(0, 200)}` }
    }

    const p = parseJsonl(r.stdout)
    // silent-fail 防呆（沿 codex 模式）：exit 0 但無 result 尾事件＝失敗（截斷/中途死都落這）。
    if (!p.result) {
      return { ok: false, output: tail(r.stdout), costUsd: 0, costUnknown: true, failureReason: 'silent-fail：exit 0 但無 result 尾事件（≠ 成功）' }
    }
    const output = tail(`${p.message}\n${usageLine(p.result)}`)
    // result 事件自帶 exitCode 欄位（規格卡）：雙重確認，非 0 視同失敗。
    if (typeof p.result.exitCode === 'number' && p.result.exitCode !== 0) {
      return { ok: false, output, costUsd: 0, costUnknown: true, failureReason: `result.exitCode ${p.result.exitCode}` }
    }

    const after = this.getCommitHash(job.projectPath)
    if (after === undefined || after === before) {
      return { ok: false, output, costUsd: 0, costUnknown: true, failureReason: 'no-commit(phantom completion?)' }
    }
    return { ok: true, output, costUsd: 0, costUnknown: true, commitHash: after, baseCommitHash: before }
  }
}

/** prompt 走 argv → 截長：保留任務文字開頭與硬性 commit 要求結尾，中段截（規格卡 8191 防呆）。 */
export function buildPrompt(job: Job): string {
  const head = `你是自動開發工人。完成以下這一項任務。\n任務：${job.directive ?? job.task.text}`
  const hard = [
    WORKER_GUARDS,
    `改動完成後必須自己執行 git add -A 與 git commit（conventional commit，zh-TW）；`,
    `沒有 commit 的工作會被整輪作廢、視為失敗。`,
    `嚴禁超出任務範圍、嚴禁動 BACKLOG.md、嚴禁自行新增任務。`
  ].join('\n')
  const full = `${head}\n${hard}`
  if (full.length <= PROMPT_MAX) return full
  const marker = '\n…[adng: prompt 截長]…\n'
  const cut = PROMPT_MAX - hard.length - marker.length
  const cc = head.charCodeAt(cut - 1) // 切點落在 surrogate pair 中間會產生落單 high surrogate → argv 亂碼（審查實測 d83d→U+FFFD）：高位落點退一位
  return `${head.slice(0, cc >= 0xd800 && cc <= 0xdbff ? cut - 1 : cut)}${marker}${hard}`
}

interface CopilotResult { exitCode?: number; premiumRequests?: number; codeChanges?: { linesAdded?: number; linesRemoved?: number; filesModified?: string[] } }
interface ParsedJsonl { result?: CopilotResult; message: string }

/** JSONL 逐行 parse：毒行（非 JSON/截斷殘行）靜默跳過；超長行（encrypted blob）不進 parse。 */
function parseJsonl(stdout: string): ParsedJsonl {
  const out: ParsedJsonl = { message: '' }
  for (const line of stdout.split(/\r?\n/)) {
    if (line.trim() === '' || line.length > LINE_MAX) continue
    let obj: Record<string, unknown>
    try { obj = JSON.parse(line) as Record<string, unknown> } catch { continue }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) continue
    const data = typeof obj.data === 'object' && obj.data !== null ? obj.data as Record<string, unknown> : obj
    if (obj.type === 'result') {
      const u = (typeof data.usage === 'object' && data.usage !== null ? data.usage : {}) as Record<string, unknown>
      out.result = {
        exitCode: typeof data.exitCode === 'number' ? data.exitCode : undefined,
        premiumRequests: typeof u.premiumRequests === 'number' ? u.premiumRequests : undefined,
        codeChanges: (typeof u.codeChanges === 'object' && u.codeChanges !== null ? u.codeChanges : undefined) as CopilotResult['codeChanges']
      }
    } else if (obj.type === 'assistant.message') {
      const t = data.text ?? data.content
      if (typeof t === 'string' && t.trim() !== '') out.message = t
    }
  }
  return out
}

function usageLine(r: CopilotResult): string {
  const c = r.codeChanges
  return `[premiumRequests=${r.premiumRequests ?? '?'} codeChanges=+${c?.linesAdded ?? '?'}/-${c?.linesRemoved ?? '?'} files=${c?.filesModified?.length ?? '?'}]`
}

function tail(s: string, n = 2000): string { return s.length > n ? s.slice(-n) : s }
