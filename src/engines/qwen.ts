import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { runProcess } from '../proc.js'
import type { PreflightCache } from '../preflight.js'
import { defaultCommitHash } from './commit-hash.js'
import { WORKER_GUARDS } from './prompt-guard.js'

export interface QwenOpts {
  id?: string // 觀測用引擎識別；registry 以 tag 帶入區分多檔位，未設維持 'qwen'
  command?: string
  baseArgs?: string[] // 預設 --yolo＋-o json＋--auth-type openai（規格卡卡 3 實測成功形式）
  baseUrl?: string // OpenAI 相容端點（本機 ProxyPilot 8317／Hermes 8318），--openai-base-url 顯式帶入
  apiKey?: string // --openai-api-key（值來自 config engines 段 env，可 {env:VAR}）；絕不進 output/failureReason
  model?: string; timeoutMs?: number; pingTimeoutMs?: number
  cache: PreflightCache; env?: Record<string, string>
  getCommitHash?: (cwd: string) => string | undefined
}

const LINE_MAX = 200_000 // 超長行不進 JSON.parse（沿 copilot 防禦）
/** M5 Task 6：qwen CLI 引擎（規格卡 m5-cli-engines-research.md 卡 3）。qwen-oauth 免費層 2026-04-15
 * 已停用；本 adapter 走 `--auth-type openai` 接本機 proxy（實測 ProxyPilot 8317＝燒 ChatGPT 訂閱）。
 * 輸出＝JSON 陣列 [init, assistant, result]，result 事件六家最接近 claude 模板；無 USD 欄位 →
 * costUsd 恆 0＋costUnknown:true，scheduler 記 config costPerRunUsd。prompt 走 stdin（.cmd shim 8191 argv 上限）。
 * 成本備註（規格卡實測）：每次任務背景 managed-auto-memory-extractor 額外多打 2 次 API（+15k tokens 級）；
 * 關閉旗標未查到（未驗證）→ costPerRunUsd 估計值須含此 overhead。
 * 成功硬證據＝result 事件（!is_error＋非空 result 文字）＋commit hash 前進，缺一即失敗。 */
export class QwenEngine implements Engine {
  readonly id: string
  private readonly command: string
  private readonly args: string[]
  private readonly timeoutMs: number
  private readonly pingTimeoutMs: number
  private readonly cache: PreflightCache
  private readonly getCommitHash: (cwd: string) => string | undefined
  private readonly env?: Record<string, string>

  constructor(opts: QwenOpts) {
    this.id = opts.id ?? 'qwen'
    this.command = opts.command ?? 'qwen'
    this.args = [...(opts.baseArgs ?? ['--yolo', '-o', 'json', '--auth-type', 'openai']),
      ...(opts.baseUrl ? ['--openai-base-url', opts.baseUrl] : []),
      ...(opts.apiKey ? ['--openai-api-key', opts.apiKey] : []), ...(opts.model ? ['-m', opts.model] : [])]
    this.timeoutMs = opts.timeoutMs ?? 15 * 60 * 1000
    this.pingTimeoutMs = opts.pingTimeoutMs ?? 90 * 1000
    this.cache = opts.cache
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
    this.env = opts.env
  }

  /** 真探針（燒被代理的訂閱額度，prompt 極小）；好壞結果都 cache，防連環重打。 */
  async preflight(): Promise<PreflightResult> {
    const cached = this.cache.get(this.command)
    if (cached) return cached
    let result: PreflightResult
    try {
      const r = await runProcess({
        command: this.command, args: this.args, cwd: process.cwd(),
        stdinText: 'Reply with exactly: PONG', timeoutMs: this.pingTimeoutMs, env: this.env
      })
      const p = parseResult(r.stdout)
      result = p && !p.isError && p.text.includes('PONG')
        ? { ok: true, detail: `PONG ${r.durationMs}ms` }
        : { ok: false, detail: r.timedOut ? 'ping timeout' : `no PONG/result (exit ${r.exitCode}) ${(p?.errorMessage ?? r.stderr).slice(0, 120)}` }
    } catch (err) { result = { ok: false, detail: String(err).slice(0, 200) } }
    this.cache.set(this.command, result)
    return result
  }

  invalidatePreflight(): void { this.cache.set(this.command, { ok: false, detail: 'run-failed：下輪重探' }, 0) } // ts=0＝寫入即過期

  async run(job: Job): Promise<RunResult> {
    // prompt 組裝沿 codex/claude-cli 模板：directive 優先、commit 要求是硬話。
    const prompt = [`你是自動開發工人。完成以下這一項任務。`,
      WORKER_GUARDS,
      `改動完成後必須自己執行 git add -A 與 git commit（conventional commit，zh-TW）；`,
      `沒有 commit 的工作會被整輪作廢、視為失敗。`,
      `嚴禁超出任務範圍、嚴禁動 BACKLOG.md、嚴禁自行新增任務。`,
      `任務：${job.directive ?? job.task.text}`].join('\n')

    const before = this.getCommitHash(job.projectPath)
    const r = await runProcess({
      command: this.command, args: this.args, cwd: job.projectPath,
      stdinText: prompt, timeoutMs: this.timeoutMs, env: this.env
    })

    if (r.timedOut) return { ok: false, output: tail(r.stderr), costUsd: 0, costUnknown: true, failureReason: 'timeout' }
    const p = parseResult(r.stdout)
    const fail = (failureReason: string, output = tail(r.stdout)): RunResult => ({ ok: false, output, costUsd: 0, costUnknown: true, failureReason })
    // 規格卡：失敗時錯誤仍走 stdout 的 result 事件（is_error＋error.message），優先取其人話。
    if (r.exitCode !== 0) return fail(`exit ${r.exitCode}: ${(p?.errorMessage ?? r.stderr).slice(0, 200)}`, tail(r.stdout === '' ? r.stderr : r.stdout))
    // silent-fail 防呆（沿 codex 模式）：exit 0 但無 result 事件或零輸出＝失敗（截斷/中途死都落這）。
    if (!p) return fail('silent-fail：exit 0 但無 result 事件（≠ 成功）')
    if (p.isError) return fail(`result is_error（subtype=${p.subtype ?? '?'}）：${(p.errorMessage ?? '').slice(0, 200)}`)
    if (p.text.trim() === '') return fail('silent-fail：exit 0 但 result 零輸出（≠ 成功）')
    // tokens／per-model stats 僅記錄於 output 尾（不換算 USD——估計值走 config costPerRunUsd）。
    const output = tail(`${p.text}\n${usageLine(p)}`)

    const after = this.getCommitHash(job.projectPath)
    if (after === undefined || after === before) return fail('no-commit(phantom completion?)', output)
    return { ok: true, output, costUsd: 0, costUnknown: true, commitHash: after, baseCommitHash: before }
  }
}

interface QwenResult { subtype?: string; isError: boolean; text: string; errorMessage?: string; usage?: Record<string, unknown>; models?: Record<string, unknown> }

/** qwen -o json＝整包 JSON 陣列 [init, assistant, result]；整包 parse 失敗時 fallback 逐行
 * parse（物件或陣列皆收；毒行＝非 JSON／截斷殘行／超長行靜默跳過）。取最後一則 result 事件。 */
function parseResult(stdout: string): QwenResult | undefined {
  const events: unknown[] = []; const t = stdout.trim()
  try { const w: unknown = JSON.parse(t); events.push(...(Array.isArray(w) ? w : [w])) } catch {
    for (const line of t.split(/\r?\n/)) {
      if (line.trim() === '' || line.length > LINE_MAX) continue
      try { const o: unknown = JSON.parse(line); events.push(...(Array.isArray(o) ? o : [o])) } catch { continue }
    }
  }
  let res: QwenResult | undefined
  for (const ev of events) {
    if (typeof ev !== 'object' || ev === null || (ev as Record<string, unknown>).type !== 'result') continue
    const e = ev as Record<string, unknown>
    const err = (typeof e.error === 'object' && e.error !== null ? e.error : {}) as Record<string, unknown>
    const stats = (typeof e.stats === 'object' && e.stats !== null ? e.stats : {}) as Record<string, unknown>
    res = {
      subtype: typeof e.subtype === 'string' ? e.subtype : undefined,
      isError: e.is_error === true,
      text: typeof e.result === 'string' ? e.result : '',
      errorMessage: typeof err.message === 'string' ? err.message : undefined,
      usage: (typeof e.usage === 'object' && e.usage !== null ? e.usage : undefined) as Record<string, unknown> | undefined,
      models: (typeof stats.models === 'object' && stats.models !== null ? stats.models : undefined) as Record<string, unknown> | undefined
    }
  }
  return res
}

/** stats.models 每模型請求數：真探針實測 shape 為 {api:{totalRequests}}；另容 {requests} 平面形。 */
function reqOf(v: unknown): string {
  const m = (typeof v === 'object' && v !== null ? v : {}) as Record<string, unknown>
  const api = (typeof m.api === 'object' && m.api !== null ? m.api : {}) as Record<string, unknown>
  const r = typeof m.requests === 'number' ? m.requests : api.totalRequests
  return typeof r === 'number' ? String(r) : '?'
}

function usageLine(p: QwenResult): string {
  const u = p.usage ?? {}
  const n = (k: string): string => (typeof u[k] === 'number' ? String(u[k]) : '?')
  const models = Object.entries(p.models ?? {}).map(([name, v]) => `${name}:req=${reqOf(v)}`).join(' ')
  return `[tokens in=${n('input_tokens')} out=${n('output_tokens')} total=${n('total_tokens')}${models ? ` | models ${models}` : ''}]`
}

function tail(s: string, n = 2000): string { return s.length > n ? s.slice(-n) : s }
