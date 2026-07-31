import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { DEFAULT_ENGINE_IDLE_TIMEOUT_MS, runProcess } from './proc.js'
import type { PreflightCache } from '../preflight.js'
import { defaultCommitHash } from './commit-hash.js'
import { WORKER_GUARDS } from './prompt-guard.js'

export interface CodexOpts {
  /** 觀測用引擎識別；registry 以 tag 帶入區分多檔位，未設維持 'codex'。 */
  id?: string
  command?: string
  /** run 用 args。預設顯式帶 bypass 旗標，不依賴 ~/.codex/config.toml 的全域設定。 */
  baseArgs?: string[]
  /** preflight 用 args。預設 read-only＋ephemeral：探針唯讀、不落 session（規格卡 ping 形式）。 */
  pingArgs?: string[]
  timeoutMs?: number
  pingTimeoutMs?: number
  idleTimeoutMs?: number
  cache: PreflightCache
  getCommitHash?: (cwd: string) => string | undefined
  env?: Record<string, string>
  /** 指定 --model 旗標（未設用 CLI 預設 gpt-5.5）。 */
  model?: string
  /** reasoning effort（-c model_reasoning_effort=<值>）；只注入 run 的 baseArgs，ping 不燒推理。 */
  effort?: string
}

/** M5 Task 3：codex exec 引擎（規格卡 m5-cli-engines-research.md 卡 1）。
 * 輸出為 JSONL 事件流；codex 有已知「exit 0 但 silent-fail」前科（openai/codex#19945 等），
 * 成功硬證據＝解析出 turn.completed＋非空 agent_message＋commit hash 前進，缺一即失敗。
 * JSONL 無 USD 欄位 → 所有路徑 costUsd 恆 0＋costUnknown:true（與 claude-cli 真值路徑不同：
 * scheduler 對 costPerRunUsd 有設的引擎成功失敗一律入帳固定估計值，本值只是佔位）。 */
export class CodexEngine implements Engine {
  readonly id: string
  private readonly command: string
  private readonly baseArgs: string[]
  private readonly pingArgs: string[]
  private readonly timeoutMs: number
  private readonly pingTimeoutMs: number
  private readonly idleTimeoutMs: number
  private readonly cache: PreflightCache
  private readonly getCommitHash: (cwd: string) => string | undefined
  private readonly env?: Record<string, string>

  constructor(opts: CodexOpts) {
    this.id = opts.id ?? 'codex'
    this.command = opts.command ?? 'codex'
    const modelArgs = opts.model ? ['--model', opts.model] : []
    const effortArgs = opts.effort ? ['-c', `model_reasoning_effort=${opts.effort}`] : []
    this.baseArgs = [...(opts.baseArgs ?? ['exec', '--json', '--dangerously-bypass-approvals-and-sandbox']), ...modelArgs, ...effortArgs]
    this.pingArgs = [...(opts.pingArgs ?? ['exec', '--json', '-s', 'read-only', '--ephemeral', '--skip-git-repo-check']), ...modelArgs]
    this.timeoutMs = opts.timeoutMs ?? 15 * 60 * 1000
    this.pingTimeoutMs = opts.pingTimeoutMs ?? 180 * 1000 // skills 冷載入＋忙機器實測可超過 90s
    this.idleTimeoutMs = opts.idleTimeoutMs ?? DEFAULT_ENGINE_IDLE_TIMEOUT_MS
    this.cache = opts.cache
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
    this.env = opts.env
  }

  /** 真探針（codex 走 ChatGPT 訂閱額度，prompt 保持極小）；好壞結果都 cache，防連環重打。 */
  async preflight(): Promise<PreflightResult> {
    const cached = this.cache.get(this.command)
    if (cached) return cached
    let result: PreflightResult
    try {
      const r = await runProcess({
        command: this.command, args: this.pingArgs, cwd: process.cwd(),
        stdinText: 'Reply with exactly: PONG', timeoutMs: this.pingTimeoutMs, env: this.env
      })
      const p = parseJsonl(r.stdout)
      result = p.turnCompleted && p.message.includes('PONG')
        ? { ok: true, detail: `PONG ${r.durationMs}ms` }
        : { ok: false, detail: r.timedOut ? 'ping timeout' : `no PONG/turn.completed (exit ${r.exitCode}) ${r.stderr.slice(0, 120)}` }
    } catch (err) {
      result = { ok: false, detail: String(err).slice(0, 200) }
    }
    this.cache.set(this.command, result)
    return result
  }

  invalidatePreflight(): void { this.cache.set(this.command, { ok: false, detail: 'run-failed：下輪重探' }, 0) } // ts=0＝寫入即過期

  async run(job: Job): Promise<RunResult> {
    // prompt 組裝沿 claude-cli 模板：directive 優先（Fix 1）、commit 要求是硬話（Fix 3）。
    const prompt = [
      `你是自動開發工人。完成以下這一項任務。`,
      WORKER_GUARDS,
      `改動完成後必須自己執行 git add -A 與 git commit（conventional commit，zh-TW）；`,
      `沒有 commit 的工作會被整輪作廢、視為失敗。`,
      `嚴禁超出任務範圍、嚴禁動 BACKLOG.md、嚴禁自行新增任務。`,
      `任務：${job.directive ?? job.task.text}`
    ].join('\n')

    const before = this.getCommitHash(job.projectPath)
    const r = await runProcess({
      command: this.command, args: this.baseArgs, cwd: job.projectPath,
      stdinText: prompt, timeoutMs: this.timeoutMs, idleTimeoutMs: this.idleTimeoutMs, env: this.env
    })

    if (r.timedOut) return { ok: false, output: tail(r.stderr), costUsd: 0, costUnknown: true, failureReason: 'timeout' }
    if (r.exitCode !== 0) {
      return {
        ok: false, output: tail(r.stderr), costUsd: 0, costUnknown: true,
        failureReason: `exit ${r.exitCode}: ${r.stderr.slice(0, 200)}`
      }
    }

    const p = parseJsonl(r.stdout)
    // silent-fail 防呆（規格卡：codex exit 0 不可信）：無 turn.completed 或無最終訊息＝失敗。
    if (!p.turnCompleted || p.message.trim() === '') {
      return {
        ok: false, output: tail(r.stdout), costUsd: 0, costUnknown: true,
        failureReason: 'silent-fail：exit 0 但無 turn.completed 或零輸出（≠ 成功）'
      }
    }
    // tokens 僅記錄於 output/detail（不換算 USD——價目表變動快，估計值走 config costPerRunUsd）。
    const output = tail(`${p.message}\n${usageLine(p.usage)}`)
    const tokensIn = p.usage?.input_tokens
    const tokensOut = p.usage?.output_tokens
    const tokensCached = p.usage?.cached_input_tokens

    const after = this.getCommitHash(job.projectPath)
    if (after === undefined || after === before) {
      return { ok: false, output, costUsd: 0, costUnknown: true, failureReason: 'no-commit(phantom completion?)', tokensIn, tokensOut, tokensCached }
    }
    return { ok: true, output, costUsd: 0, costUnknown: true, commitHash: after, baseCommitHash: before, tokensIn, tokensOut, tokensCached }
  }
}

interface CodexUsage { input_tokens?: number; cached_input_tokens?: number; output_tokens?: number }
interface ParsedJsonl { turnCompleted: boolean; message: string; usage?: CodexUsage }

/** JSONL 逐行 parse：非 JSON 行靜默跳過；取最後一則 agent_message 與 turn.completed 的 usage。 */
function parseJsonl(stdout: string): ParsedJsonl {
  const out: ParsedJsonl = { turnCompleted: false, message: '' }
  for (const line of stdout.split(/\r?\n/)) {
    if (line.trim() === '') continue
    let obj: Record<string, unknown>
    try { obj = JSON.parse(line) as Record<string, unknown> } catch { continue }
    if (obj.type === 'turn.completed') {
      out.turnCompleted = true
      if (typeof obj.usage === 'object' && obj.usage !== null) out.usage = obj.usage as CodexUsage
    } else if (obj.type === 'item.completed') {
      const item = obj.item as Record<string, unknown> | undefined
      if (item?.type === 'agent_message' && typeof item.text === 'string') out.message = item.text
    }
  }
  return out
}

function usageLine(u?: CodexUsage): string {
  return u ? `[tokens in=${u.input_tokens ?? '?'} cached=${u.cached_input_tokens ?? '?'} out=${u.output_tokens ?? '?'}]` : '[usage 無]'
}

function tail(s: string, n = 2000): string {
  return s.length > n ? s.slice(-n) : s
}
