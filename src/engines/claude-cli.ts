import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { runProcess } from './proc.js'
import type { PreflightCache } from '../preflight.js'
import { defaultCommitHash } from './commit-hash.js'
import { WORKER_GUARDS } from './prompt-guard.js'

export interface ClaudeCliOpts {
  /** 觀測用引擎識別（events 的 preflight-failed 等）。M5 引擎矩陣下同一 adapter 可有多檔位
   * （claude/m3），registry 以 tag 帶入區分；未設維持 'claude-cli'。 */
  id?: string
  command?: string
  baseArgs?: string[]
  timeoutMs?: number
  pingTimeoutMs?: number
  cache: PreflightCache
  getCommitHash?: (cwd: string) => string | undefined
  /** M5 Task 1（m3 檔位）：附加環境變數，透傳 runProcess（如 ANTHROPIC_BASE_URL /
   * ANTHROPIC_AUTH_TOKEN 指向 MiniMax 相容端點）。值由 assemble 層展開 {env:VAR}，不落 log。 */
  env?: Record<string, string>
  /** 指定 --model 旗標（如 MiniMax-M3）。未設不加旗標，行為不變。 */
  model?: string
}

/** 第一顆真引擎。所有子進程細節交給 runProcess（鐵三角），本檔只管組 prompt 與解讀結果。 */
export class ClaudeCliEngine implements Engine {
  readonly id: string
  private readonly command: string
  private readonly baseArgs: string[]
  private readonly timeoutMs: number
  private readonly pingTimeoutMs: number
  private readonly cache: PreflightCache
  private readonly getCommitHash: (cwd: string) => string | undefined
  private readonly env?: Record<string, string>

  constructor(opts: ClaudeCliOpts) {
    this.id = opts.id ?? 'claude-cli'
    this.command = opts.command ?? 'claude'
    const base = opts.baseArgs ?? ['-p', '--output-format', 'json', '--dangerously-skip-permissions']
    this.baseArgs = opts.model ? [...base, '--model', opts.model] : base
    this.timeoutMs = opts.timeoutMs ?? 15 * 60 * 1000
    this.pingTimeoutMs = opts.pingTimeoutMs ?? 90 * 1000 // 舊教訓：cold start 可達 40s+
    this.cache = opts.cache
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
    this.env = opts.env
  }

  async preflight(): Promise<PreflightResult> {
    const cached = this.cache.get(this.command)
    if (cached) return cached
    let result: PreflightResult
    try {
      const r = await runProcess({
        command: this.command, args: this.baseArgs, cwd: process.cwd(),
        stdinText: 'Reply with exactly: PONG', timeoutMs: this.pingTimeoutMs, env: this.env
      })
      result = r.stdout.includes('PONG')
        ? { ok: true, detail: `PONG ${r.durationMs}ms` }
        : { ok: false, detail: r.timedOut ? 'ping timeout' : `no PONG (exit ${r.exitCode}) ${r.stderr.slice(0, 120)}` }
    } catch (err) {
      result = { ok: false, detail: String(err).slice(0, 200) }
    }
    this.cache.set(this.command, result) // 壞結果也 cache：避免對死引擎連環重打
    return result
  }

  invalidatePreflight(): void { this.cache.set(this.command, { ok: false, detail: 'run-failed：下輪重探' }, 0) } // ts=0＝寫入即過期

  async run(job: Job): Promise<RunResult> {
    // Fix 3（首跑實證）：模型會做完不 commit → 整輪 $10 白燒。commit 要求必須是硬話。
    // Fix 1：任務行吃 job.directive（scheduler 已把 task.text+extraDirective 組好），
    // 未設 directive 時 fallback task.text 不退化。
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
      stdinText: prompt, timeoutMs: this.timeoutMs, env: this.env
    })

    // M4 Task 3（真花錢前必修）：以下三種路徑 costUsd 記 0 只是「沒能力解出真值」的佔位，
    // 不代表真的沒花錢（CLI 進程極可能已實際呼叫並燒 token）——costUnknown:true 讓 scheduler
    // 記帳層知道該改記 cfg.failureCostEstimateUsd，而非把這個 0 當真值入帳。
    if (r.timedOut) return { ok: false, output: tail(r.stderr), costUsd: 0, costUnknown: true, failureReason: 'timeout' }
    if (r.exitCode !== 0) {
      return {
        ok: false, output: tail(r.stderr), costUsd: 0, costUnknown: true,
        failureReason: `exit ${r.exitCode}: ${r.stderr.slice(0, 200)}`
      }
    }

    const parsed = parseResultJson(r.stdout)
    if (!parsed) {
      return {
        ok: false, output: tail(r.stdout), costUsd: 0, costUnknown: true,
        failureReason: 'empty-or-unparseable output（exit 0 零輸出 ≠ 成功）'
      }
    }
    const costUsd = typeof parsed.total_cost_usd === 'number' ? parsed.total_cost_usd : 0
    if (parsed.is_error === true) {
      return { ok: false, output: tail(r.stdout), costUsd, failureReason: String(parsed.subtype ?? 'is_error') }
    }

    const after = this.getCommitHash(job.projectPath)
    if (after === undefined || after === before) {
      return { ok: false, output: tail(r.stdout), costUsd, failureReason: 'no-commit(phantom completion?)' }
    }
    return { ok: true, output: tail(r.stdout), costUsd, commitHash: after, baseCommitHash: before }
  }
}

function parseResultJson(stdout: string): Record<string, unknown> | null {
  const text = stdout.trim()
  if (text === '') return null
  // claude -p --output-format json 輸出單一 JSON 物件；防禦性取最後一個非空行
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '')
  for (let i = lines.length - 1; i >= 0; i--) {
    try { return JSON.parse(lines[i]!) as Record<string, unknown> } catch { /* 繼續往上找 */ }
  }
  return null
}

function tail(s: string, n = 2000): string {
  return s.length > n ? s.slice(-n) : s
}
