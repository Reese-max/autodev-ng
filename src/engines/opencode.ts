import { unknownAdmission, withAdmission } from './cli-admission.js'
import { cliDiagnostic, cliPreflightKey, redactCli, cliModel } from './cli-diagnostics.js'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { DEFAULT_ENGINE_IDLE_TIMEOUT_MS, runProcess } from './proc.js'
import { cancelledRun } from './run-control.js'
import type { PreflightCache } from '../preflight.js'
import { defaultCommitHash } from './commit-hash.js'
import { WORKER_GUARDS } from './prompt-guard.js'
import { admitFreeModel, FREE_MODEL_URL, freeModelId, freeModelReceipt, FreeModelUnavailable, quarantineFreeModel } from './free-model-policy.js'
import { randomUUID } from 'node:crypto'

export interface OpencodeOpts {
  id?: string
  command?: string // 預設 PATH 裸名 opencode.exe；npm 全域常只有 .cmd shim 在 PATH（真 exe 在 node_modules 深處）→ 解析失敗時 preflight detail 會指引以 config engines.<tag>.command 指定完整路徑
  model?: string // provider/model（預設 zen/big-pickle）。免費陣容輪替快，preflight 必驗三元組
  variant?: string // provider-specific reasoning effort（opencode run --variant；例如 GLM-5.2 max）
  baseArgs?: string[]; timeoutMs?: number; pingTimeoutMs?: number; idleTimeoutMs?: number
  cache: PreflightCache; getCommitHash?: (cwd: string) => string | undefined
  /** 透傳 runProcess；zen apiKey 以 OPENCODE_ZEN_KEY 傳入（profile 內寫 {env:...} 引用，key 不落地）。 */
  env?: Record<string, string>
  /** XDG 隔離 profile 根（<dataDir>/opencode-profile，gitignored）。 */
  profileDir: string
  freeOnly?: boolean; policyDataDir?: string
}

/** M5 Task 8：opencode zen 引擎（規格卡 .superpowers/sdd/m5-opencode-research.md）。
 * stdout＝NDJSON 事件流；錯誤在 stdout 不在 stderr（與 claude-cli 相反；stderr 僅 spawn 失敗/樹斬/原生崩潰有料，非空才附加）。
 * costUsd＝Σ step_finish.part.cost 為可信真值（免費模型回 0 是真 0）——非 timeout/exit≠0 路徑不設 costUnknown。
 * XDG 雙變數全隔離（唯一殘留：~/.claude/skills 掃描關不掉）；session/snapshot 堆積實錘（主 data
 * dir 曾至 780MB、snapshot 佔 716MB）→ 每次 exec 後保守只刪 snapshot 子目錄，session db 留供除錯。 */
export class OpencodeEngine implements Engine {
  readonly id: string
  private readonly command: string; private readonly args: string[]; private readonly model: string
  private readonly timeoutMs: number; private readonly pingTimeoutMs: number; private readonly idleTimeoutMs: number
  private readonly cache: PreflightCache; private readonly env?: Record<string, string>
  private readonly getCommitHash: (cwd: string) => string | undefined
  private readonly profileDir: string
  private readonly freeOnly: boolean; private readonly policyDataDir?: string

  constructor(opts: OpencodeOpts) {
    this.id = opts.id ?? 'opencode'
    this.command = opts.command ?? 'opencode.exe'
    this.model = opts.model ?? 'zen/big-pickle'
    this.freeOnly = opts.freeOnly === true; this.policyDataDir = opts.policyDataDir
    if (this.freeOnly && (!this.model.startsWith('openrouter/') || opts.baseArgs)) throw new Error('free-policy: explicit openrouter/provider/model:free and controlled CLI arguments required')
    if (this.freeOnly) freeModelId(this.model)
    this.args = [...(opts.baseArgs ?? ['run', '--format', 'json', '--pure', '--dangerously-skip-permissions']), ...(opts.variant ? ['--variant', opts.variant] : []), '-m', this.model]
    if (this.freeOnly) this.args = ['run', '--format', 'json', '--pure', '--auto', '--title', 'AutoDev free worker', ...(opts.variant ? ['--variant', opts.variant] : []), '-m', this.model]
    this.timeoutMs = opts.timeoutMs ?? 15 * 60 * 1000; this.pingTimeoutMs = opts.pingTimeoutMs ?? 90 * 1000
    this.idleTimeoutMs = opts.idleTimeoutMs ?? DEFAULT_ENGINE_IDLE_TIMEOUT_MS
    this.cache = opts.cache; this.env = opts.env; this.profileDir = opts.profileDir
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
  }

  /** 真探針（zen 免費）驗 (CLI, model, 端點) 三元組——同時擋 CLI 壞掉與免費模型下架
   * （下架實測 2-3s exit 1＋stdout 出 ProviderModelNotFoundError）。cache key 含 model：換模即重驗。 */
  private cacheKey(): string { return cliPreflightKey(this.command, [...this.args, this.profileDir], { ...this.env, ...this.ensureProfile() }, 'opencode') }

  async preflight(): Promise<PreflightResult> {
    if (this.freeOnly) try { await this.admit() } catch (err) { return { ok: false, detail: String(err) } }
    const key = this.cacheKey()
    const admission = unknownAdmission('opencode', cliModel(this.args))
    const cached = this.cache.get(key)
    if (cached) return withAdmission(cached, admission, true)
    let result: PreflightResult
    try {
      const r = await this.exec('Reply with exactly: PONG', this.profileDir, this.pingTimeoutMs)
      const p = parseNdjson(r.stdout)
      const why = cliDiagnostic(r, this.env, this.args).slice(0, 700) || `exit ${r.exitCode} 零輸出`
      result = r.exitCode === 0 && !r.timedOut && p.errors.length === 0 && p.steps > 0 && p.text.trim() === 'PONG'
        ? { ok: true, detail: `PONG ${r.durationMs}ms model=${this.model}` }
        : { ok: false, detail: r.timedOut ? 'ping timeout' : `model ${this.model} 探針失敗（免費模型可能已下架/輪替）：${why}${why.includes('ENOENT') ? '；opencode.exe 不在 PATH——請在 config engines.<tag>.command 指定完整路徑' : ''}` }
    } catch (err) {
      result = { ok: false, detail: redactCli(String(err), { ...process.env, ...this.env }, this.args).slice(0, 700) }
    }
    this.cache.set(key, result)
    return withAdmission(result, admission)
  }

  invalidatePreflight(): void { this.cache.set(this.cacheKey(), { ok: false, detail: 'run-failed：下輪重探' }, 0) } // ts=0＝寫入即過期

  async run(job: Job): Promise<RunResult> {
    // prompt 組裝沿 claude-cli/codex 模板：directive 優先（Fix 1）、commit 要求是硬話（Fix 3）。
    const prompt = [
      `你是自動開發工人。完成以下這一項任務。`,
      WORKER_GUARDS,
      `改動完成後必須自己執行 git add -A 與 git commit（conventional commit，zh-TW）；`,
      `沒有 commit 的工作會被整輪作廢、視為失敗。`,
      `嚴禁超出任務範圍、嚴禁動 BACKLOG.md、嚴禁自行新增任務。`,
      `任務：${job.directive ?? job.task.text}`
    ].join('\n')
    const before = this.getCommitHash(job.projectPath)
    const r = await this.exec(prompt, job.projectPath, this.timeoutMs, this.idleTimeoutMs, job.control)
    const p = parseNdjson(r.stdout)
    if (r.aborted || job.control?.signal?.aborted) return cancelledRun(cliDiagnostic(r, this.env, this.args))
    if (r.timedOut) return { ok: false, output: cliDiagnostic(r, this.env, this.args), costUsd: 0, costUnknown: true, failureReason: 'timeout' }
    if (r.exitCode !== 0 || p.errors.length > 0) {
      return { ok: false, output: cliDiagnostic(r, this.env, this.args), costUsd: 0, costUnknown: true,
        failureReason: `exit ${r.exitCode}: ${cliDiagnostic(r, this.env, this.args).slice(0, 700)}` }
    }
    if (p.steps === 0 || p.text.trim() === '') {
      // exit 0 但零文字輸出＝失敗（規格卡 E11 真實案例）；costUsd 取已解析 cost 總和，仍是真值
      return { ok: false, output: cliDiagnostic(r, this.env, this.args), costUsd: p.cost, failureReason: 'empty-output：exit 0 但無 text/step_finish（≠ 成功）' }
    }
    const output = tail(p.text)
    // 事件欄位優先；零值時退 parseTokensLine 文字行（雙保險，皆無＝undefined 不入帳）
    // opencode 的 tokens.input 不含 cache read（實測 cached≈19×in）→ 統一為 codex 語意「in＝總輸入含 cached」
    const fromLine = parseTokensLine(r.stdout)
    const tokensIn = p.tokIn + p.tokCached > 0 ? p.tokIn + p.tokCached : fromLine.tokensIn
    const tokensOut = p.tokOut > 0 ? p.tokOut : fromLine.tokensOut
    const tokensCached = p.tokCached > 0 ? p.tokCached : undefined
    const after = this.getCommitHash(job.projectPath)
    if (after === undefined || after === before) {
      return { ok: false, output, costUsd: p.cost, failureReason: 'no-commit(phantom completion?)', tokensIn, tokensOut, tokensCached }
    }
    return { ok: true, output, costUsd: p.cost, commitHash: after, baseCommitHash: before, tokensIn, tokensOut, tokensCached }
  }

  /** 確保隔離 profile 存在 → XDG 重導向 spawn → 事後保守清 snapshot（吞錯，不影響結果）。 */
  private async exec(stdinText: string, cwd: string, timeoutMs: number, idleTimeoutMs?: number, control?: Job['control']): ReturnType<typeof runProcess> {
    const policy = { dataDir: this.policyDataDir, model: this.model, callId: randomUUID() }
    if (this.freeOnly) { const proof = await this.admit(); freeModelReceipt(policy, { phase: 'cli-start', ...proof, modelCalls: 'native-managed' }) }
    const xdg = this.ensureProfile()
    const r = await runProcess({ command: this.command, args: this.args, cwd, stdinText, timeoutMs,
      ...(idleTimeoutMs === undefined ? {} : { idleTimeoutMs }),
      env: this.freeOnly ? { ...Object.fromEntries(Object.entries(process.env).filter(([key, value]) => value !== undefined && /^(path|systemroot|windir|comspec|temp|tmp|pathext|userprofile)$/i.test(key))),
        OPENROUTER_API_KEY: this.env?.OPENROUTER_API_KEY ?? '', ...xdg, OPENCODE_DISABLE_PROJECT_CONFIG: '1', OPENCODE_DISABLE_EXTERNAL_SKILLS: '1',
        OPENCODE_CONFIG_CONTENT: JSON.stringify(this.freeProfile()) } : { ...this.env, ...xdg }, replaceEnv: this.freeOnly, control })
    if (this.freeOnly) {
      const parsed = parseNdjson(r.stdout)
      freeModelReceipt(policy, { phase: 'cli-finished', requestedModel: this.model, actualModel: 'not reported by NDJSON', steps: parsed.steps,
        reportedCost: parsed.steps > 0 && parsed.costReports === parsed.steps ? parsed.cost : undefined, exitCode: r.exitCode, timedOut: r.timedOut })
      if (parsed.cost !== 0) { quarantineFreeModel(policy); throw new FreeModelUnavailable('CLI reported nonzero cost; inspect receipt before retry') }
    }
    if (!r.aborted && !r.timedOut && !control?.signal?.aborted) try { rmSync(join(xdg.XDG_DATA_HOME, 'opencode', 'snapshot'), { recursive: true, force: true }) } catch { /* 盡力而為 */ }
    return r
  }

  private admit() {
    if (!this.env?.OPENROUTER_API_KEY) throw new FreeModelUnavailable('worker OPENROUTER_API_KEY is unavailable')
    return admitFreeModel({ dataDir: this.policyDataDir, url: FREE_MODEL_URL, model: this.model })
  }
  private freeProfile() {
    return { model: this.model, small_model: this.model, enabled_providers: ['openrouter'], permission: { '*': 'allow', task: 'deny' },
      provider: { openrouter: { whitelist: [freeModelId(this.model)], options: { baseURL: FREE_MODEL_URL, apiKey: '{env:OPENROUTER_API_KEY}' } } } }
  }

  /** profile 的 opencode.json 缺失或內容過期（如換 model）即重寫；zen 以外 provider 不代生設定。 */
  private ensureProfile(): { XDG_CONFIG_HOME: string; XDG_DATA_HOME: string } {
    const cfgHome = join(this.profileDir, 'config')
    const dataHome = join(this.profileDir, 'data')
    const file = join(cfgHome, 'opencode', 'opencode.json')
    const [prov, modelId] = this.model.split('/')
    const want = JSON.stringify(this.freeOnly ? this.freeProfile() : {
      $schema: 'https://opencode.ai/config.json', model: this.model, permission: 'allow',
      ...(prov === 'zen' && modelId ? { provider: { zen: { npm: '@ai-sdk/openai-compatible', name: 'OpenCode Zen (adng isolated)',
        // timeout 30s 實測撞牆：big-pickle 吃 3 萬 token 上下文時單請求逾 27s 即 UnknownError
        // 中斷整輪（2026-07-16 兩專案 task-failed 實錄）；放寬至 180s/60s 容納免費模型排隊延遲。
        options: { baseURL: 'https://opencode.ai/zen/v1', apiKey: '{env:OPENCODE_ZEN_KEY}', timeout: 180000, chunkTimeout: 60000 },
        models: { [modelId]: {} } } } } : {})
    }, null, 2)
    let cur: string | undefined; try { cur = readFileSync(file, 'utf8') } catch { /* 不存在＝重寫 */ }
    if (cur !== want) { mkdirSync(join(cfgHome, 'opencode'), { recursive: true }); mkdirSync(dataHome, { recursive: true }); writeFileSync(file, want) }
    return { XDG_CONFIG_HOME: cfgHome, XDG_DATA_HOME: dataHome }
  }
}

interface Parsed { text: string; cost: number; costReports: number; steps: number; errors: string[]; tokIn: number; tokOut: number; tokCached: number }

/** NDJSON 逐行 parse：毒行（opencode 會把 log 直印 stdout，實測壞 model 場景）靜默跳過；
 * 聚合 text 事件、計 step_finish 數並 Σ part.cost、收 error 事件的 name+message。 */
function parseNdjson(stdout: string): Parsed {
  const p: Parsed = { text: '', cost: 0, costReports: 0, steps: 0, errors: [], tokIn: 0, tokOut: 0, tokCached: 0 }
  for (const line of stdout.split(/\r?\n/)) {
    if (line.trim() === '') continue
    let obj: Record<string, unknown>
    try { obj = JSON.parse(line) as Record<string, unknown> } catch { continue }
    const part = obj.part as Record<string, unknown> | undefined
    if (obj.type === 'text' && typeof part?.text === 'string') p.text += (p.text === '' ? '' : '\n') + part.text
    else if (obj.type === 'step_finish') {
      p.steps++; if (typeof part?.cost === 'number') p.cost += part.cost
      if (typeof part?.cost === 'number' && Number.isFinite(part.cost) && part.cost >= 0) p.costReports++
      // token 聚合（2026-07-29）：opencode step_finish 的 part.tokens（input/output/cache.read）——
      // 文字行 'tokens in=' 實測不存在於 NDJSON stdout，事件欄位才是真源。
      const tok = part?.tokens as { input?: number; output?: number; cache?: { read?: number } } | undefined
      if (tok) { p.tokIn += tok.input ?? 0; p.tokOut += tok.output ?? 0; p.tokCached += tok.cache?.read ?? 0 }
    }
    else if (obj.type === 'error') {
      const e = obj.error as { name?: string; data?: { message?: string } } | undefined
      p.errors.push(`${e?.name ?? 'Error'}: ${e?.data?.message ?? ''}`)
    }
  }
  return p
}


function tail(s: string, n = 2000): string { return s.length > n ? s.slice(-n) : s }

/** CLI 原生 usage 行解析（如 'tokens in=409412 out=1778 total=…'）；取最後一次出現（多段對話取終值）。
 * 2026-07-29 修：原 regex 的 \d 曾被寫入時轉義吃掉成字面 d，27 輪 token 全漏記——抽成可測函數防回歸。 */
export function parseTokensLine(stdout: string): { tokensIn?: number; tokensOut?: number } {
  const m = [...stdout.matchAll(/tokens in=(\d+) out=(\d+)/g)].pop()
  return m ? { tokensIn: Number(m[1]), tokensOut: Number(m[2]) } : {}
}
