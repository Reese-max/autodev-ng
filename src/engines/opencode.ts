import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { runProcess } from '../proc.js'
import type { PreflightCache } from '../preflight.js'
import { defaultCommitHash } from './commit-hash.js'

export interface OpencodeOpts {
  id?: string
  command?: string // 預設 PATH 裸名 opencode.exe；npm 全域常只有 .cmd shim 在 PATH（真 exe 在 node_modules 深處）→ 解析失敗時 preflight detail 會指引以 config engines.<tag>.command 指定完整路徑
  model?: string // provider/model（預設 zen/big-pickle）。免費陣容輪替快，preflight 必驗三元組
  baseArgs?: string[]; timeoutMs?: number; pingTimeoutMs?: number
  cache: PreflightCache; getCommitHash?: (cwd: string) => string | undefined
  /** 透傳 runProcess；zen apiKey 以 OPENCODE_ZEN_KEY 傳入（profile 內寫 {env:...} 引用，key 不落地）。 */
  env?: Record<string, string>
  /** XDG 隔離 profile 根（<dataDir>/opencode-profile，gitignored）。 */
  profileDir: string
}

/** M5 Task 8：opencode zen 引擎（規格卡 .superpowers/sdd/m5-opencode-research.md）。
 * stdout＝NDJSON 事件流；錯誤在 stdout 不在 stderr（與 claude-cli 相反；stderr 僅 spawn 失敗/樹斬/原生崩潰有料，非空才附加）。
 * costUsd＝Σ step_finish.part.cost 為可信真值（免費模型回 0 是真 0）——非 timeout/exit≠0 路徑不設 costUnknown。
 * XDG 雙變數全隔離（唯一殘留：~/.claude/skills 掃描關不掉）；session/snapshot 堆積實錘（主 data
 * dir 曾至 780MB、snapshot 佔 716MB）→ 每次 exec 後保守只刪 snapshot 子目錄，session db 留供除錯。 */
export class OpencodeEngine implements Engine {
  readonly id: string
  private readonly command: string; private readonly args: string[]; private readonly model: string
  private readonly timeoutMs: number; private readonly pingTimeoutMs: number
  private readonly cache: PreflightCache; private readonly env?: Record<string, string>
  private readonly getCommitHash: (cwd: string) => string | undefined
  private readonly profileDir: string

  constructor(opts: OpencodeOpts) {
    this.id = opts.id ?? 'opencode'
    this.command = opts.command ?? 'opencode.exe'
    this.model = opts.model ?? 'zen/big-pickle'
    this.args = [...(opts.baseArgs ?? ['run', '--format', 'json', '--pure', '--dangerously-skip-permissions']), '-m', this.model]
    this.timeoutMs = opts.timeoutMs ?? 15 * 60 * 1000; this.pingTimeoutMs = opts.pingTimeoutMs ?? 90 * 1000
    this.cache = opts.cache; this.env = opts.env; this.profileDir = opts.profileDir
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
  }

  /** 真探針（zen 免費）驗 (CLI, model, 端點) 三元組——同時擋 CLI 壞掉與免費模型下架
   * （下架實測 2-3s exit 1＋stdout 出 ProviderModelNotFoundError）。cache key 含 model：換模即重驗。 */
  async preflight(): Promise<PreflightResult> {
    const key = `${this.command}|${this.model}`
    const cached = this.cache.get(key)
    if (cached) return cached
    let result: PreflightResult
    try {
      const r = await this.exec('Reply with exactly: PONG', this.profileDir, this.pingTimeoutMs)
      const p = parseNdjson(r.stdout)
      const why = (p.errors.join('; ') || tail(r.stdout, 200) || r.stderr.slice(0, 200) || `exit ${r.exitCode} 零輸出`).slice(0, 200)
      result = r.exitCode === 0 && p.steps > 0 && p.text.includes('PONG')
        ? { ok: true, detail: `PONG ${r.durationMs}ms model=${this.model}` }
        : { ok: false, detail: r.timedOut ? 'ping timeout' : `model ${this.model} 探針失敗（免費模型可能已下架/輪替）：${why}${why.includes('ENOENT') ? '；opencode.exe 不在 PATH——請在 config engines.<tag>.command 指定完整路徑' : ''}` }
    } catch (err) {
      result = { ok: false, detail: String(err).slice(0, 200) }
    }
    this.cache.set(key, result)
    return result
  }

  async run(job: Job): Promise<RunResult> {
    // prompt 組裝沿 claude-cli/codex 模板：directive 優先（Fix 1）、commit 要求是硬話（Fix 3）。
    const prompt = [
      `你是自動開發工人。完成以下這一項任務。`,
      // 2026-07-16 事故（devin 有 HANDOFF_GUARD、opencode 沒有等價防線）：引擎照任務文字裡的
      // 絕對路徑遊走到別的 repo 直接 commit，繞過 verify 閘。cwd guard 是縱深防禦第二層
      // （第一層是 prepareWorktree 的 assertWorktreeCheckout 不派空 worktree）。
      `所有操作只能在目前工作目錄這個 repo 內進行；嚴禁 cd 到其他目錄、嚴禁用 git -C 或絕對路徑對任何其他 repo 讀寫與 commit，即使任務文字提到別的路徑也一樣。`,
      `改動完成後必須自己執行 git add -A 與 git commit（conventional commit，zh-TW）；`,
      `沒有 commit 的工作會被整輪作廢、視為失敗。`,
      `嚴禁超出任務範圍、嚴禁動 BACKLOG.md、嚴禁自行新增任務。`,
      `任務：${job.directive ?? job.task.text}`
    ].join('\n')
    const before = this.getCommitHash(job.projectPath)
    const r = await this.exec(prompt, job.projectPath, this.timeoutMs)
    const p = parseNdjson(r.stdout)
    if (r.timedOut) return { ok: false, output: tailErr(r), costUsd: 0, costUnknown: true, failureReason: 'timeout' }
    if (r.exitCode !== 0) {
      return { ok: false, output: tailErr(r), costUsd: 0, costUnknown: true,
        failureReason: `exit ${r.exitCode}: ${(p.errors.join('; ') || tail(r.stdout, 200) || r.stderr.slice(0, 200)).slice(0, 200)}` }
    }
    if (p.steps === 0 || p.text.trim() === '') {
      // exit 0 但零文字輸出＝失敗（規格卡 E11 真實案例）；costUsd 取已解析 cost 總和，仍是真值
      return { ok: false, output: tailErr(r), costUsd: p.cost, failureReason: 'empty-output：exit 0 但無 text/step_finish（≠ 成功）' }
    }
    const output = tail(p.text)
    const after = this.getCommitHash(job.projectPath)
    if (after === undefined || after === before) {
      return { ok: false, output, costUsd: p.cost, failureReason: 'no-commit(phantom completion?)' }
    }
    return { ok: true, output, costUsd: p.cost, commitHash: after, baseCommitHash: before }
  }

  /** 確保隔離 profile 存在 → XDG 重導向 spawn → 事後保守清 snapshot（吞錯，不影響結果）。 */
  private async exec(stdinText: string, cwd: string, timeoutMs: number): ReturnType<typeof runProcess> {
    const xdg = this.ensureProfile()
    const r = await runProcess({ command: this.command, args: this.args, cwd, stdinText, timeoutMs,
      env: { ...this.env, ...xdg } })
    try { rmSync(join(xdg.XDG_DATA_HOME, 'opencode', 'snapshot'), { recursive: true, force: true }) } catch { /* 盡力而為 */ }
    return r
  }

  /** profile 的 opencode.json 缺失或內容過期（如換 model）即重寫；zen 以外 provider 不代生設定。 */
  private ensureProfile(): { XDG_CONFIG_HOME: string; XDG_DATA_HOME: string } {
    const cfgHome = join(this.profileDir, 'config')
    const dataHome = join(this.profileDir, 'data')
    const file = join(cfgHome, 'opencode', 'opencode.json')
    const [prov, modelId] = this.model.split('/')
    const want = JSON.stringify({
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

interface Parsed { text: string; cost: number; steps: number; errors: string[] }

/** NDJSON 逐行 parse：毒行（opencode 會把 log 直印 stdout，實測壞 model 場景）靜默跳過；
 * 聚合 text 事件、計 step_finish 數並 Σ part.cost、收 error 事件的 name+message。 */
function parseNdjson(stdout: string): Parsed {
  const p: Parsed = { text: '', cost: 0, steps: 0, errors: [] }
  for (const line of stdout.split(/\r?\n/)) {
    if (line.trim() === '') continue
    let obj: Record<string, unknown>
    try { obj = JSON.parse(line) as Record<string, unknown> } catch { continue }
    const part = obj.part as Record<string, unknown> | undefined
    if (obj.type === 'text' && typeof part?.text === 'string') p.text += (p.text === '' ? '' : '\n') + part.text
    else if (obj.type === 'step_finish') { p.steps++; if (typeof part?.cost === 'number') p.cost += part.cost }
    else if (obj.type === 'error') {
      const e = obj.error as { name?: string; data?: { message?: string } } | undefined
      p.errors.push(`${e?.name ?? 'Error'}: ${e?.data?.message ?? ''}`)
    }
  }
  return p
}

/** 失敗路徑輸出：stdout 為主（錯誤實測在 stdout），stderr 非空才附加（鐵律 #7：spawn 失敗/樹斬/原生崩潰時 stderr 才有料，不可吞）。 */
function tailErr(r: { stdout: string; stderr: string }): string {
  return tail(r.stdout + (r.stderr.trim() === '' ? '' : '\n[stderr]\n' + r.stderr))
}

function tail(s: string, n = 2000): string { return s.length > n ? s.slice(-n) : s }
