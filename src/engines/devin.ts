import { nativeAdmission, admissionFailure, withAdmission } from './cli-admission.js'
import { cliDiagnostic, cliPreflightKey, redactCli, cliModel } from './cli-diagnostics.js'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { DEFAULT_ENGINE_IDLE_TIMEOUT_MS, runProcess } from './proc.js'
import { cancelledRun } from './run-control.js'
import type { PreflightCache } from '../preflight.js'
import { defaultCommitHash } from './commit-hash.js'
import { ensureNoMcpImport } from './devin-config-isolation.js'
import { WORKER_GUARDS } from './prompt-guard.js'
import { DevinRunError, devinEnv, runDevinModel } from './devin-runtime.js'

export interface DevinOpts {
  id?: string // 觀測用引擎識別；registry 以 tag 帶入區分多檔位，未設維持 'devin'
  command?: string // 預設 PATH 裸名 devin.exe；config command 可覆寫完整路徑，不硬編碼機器路徑（opencode 教訓）
  baseArgs?: string[]
  timeoutMs?: number
  pingTimeoutMs?: number
  idleTimeoutMs?: number
  cache: PreflightCache
  getCommitHash?: (cwd: string) => string | undefined
  env?: Record<string, string>
  model?: string // 舊路徑預設 swe-1.6；freeOnly 必須明確指定當次原生清單標為 Free 的 UID。
  profileDir: string // devin-serena-fix：preflight ping 隔離 cwd（<dataDir>/devin-profile，不需是 git repo）
  freeOnly?: boolean
}

const HANDOFF_GUARD = `全部在本機當前目錄操作；嚴禁呼叫 handoff/cloud/remote 相關工具或語意，不做雲端交接。`

/** M5 Task 9：Devin CLI 引擎（規格卡 .superpowers/sdd/devin-engine-research.md）。原生 .exe 本機
 * 執行；prompt 走 --prompt-file；`--permission-mode dangerous`（=Bypass）；`--model swe-1.6`
 * （歷史相容預設，不代表目前免費）；`--export <tmp>` 的 steps[] 解析是否有
 * exec 步驟含 git commit 當輔助訊號，真相來源仍是 commit hash 前進檢查＋silent-fail 防呆
 * （exit 0 無 export＝失敗）；無 USD 欄位 → costUsd 恆 0＋costUnknown:true；逾時全靠 runProcess
 * 外部 wall timer + 雙層樹斬。devin-serena-fix：run/preflight 前呼叫 `ensureNoMcpImport`
 * （devin-config-isolation.ts）關掉 cwd 的全域 MCP 匯入，devin 這輪不掛載 serena 等 MCP，
 * 源頭消除孤兒 + `.serena/` 污染；worktree.ts 的 `.git/info/exclude` 兜底殘留不進 commit。 */
export class DevinEngine implements Engine {
  readonly id: string
  private readonly command: string
  private readonly baseArgs: string[]
  private readonly timeoutMs: number
  private readonly pingTimeoutMs: number
  private readonly idleTimeoutMs: number
  private readonly cache: PreflightCache
  private readonly getCommitHash: (cwd: string) => string | undefined
  private readonly env?: Record<string, string>
  private readonly profileDir: string
  private readonly freeOnly: boolean

  constructor(opts: DevinOpts) {
    this.id = opts.id ?? 'devin'
    this.command = opts.command ?? 'devin.exe'
    // 真探針修正：`--prompt-file` 單獨帶只是把它當初始 prompt 丟進互動式 session（卡在 TUI 等
    // 下一句輸入，撞 wall timeout 才被樹斬）；必須疊 `-p/--print` 才是處理完即退出的非互動模式。
    const base = opts.baseArgs ?? ['-p', '--permission-mode', 'dangerous']
    this.baseArgs = [...base, '--model', opts.model ?? 'swe-1.6']
    this.timeoutMs = opts.timeoutMs ?? 15 * 60 * 1000
    this.pingTimeoutMs = opts.pingTimeoutMs ?? 90 * 1000
    this.idleTimeoutMs = opts.idleTimeoutMs ?? DEFAULT_ENGINE_IDLE_TIMEOUT_MS
    this.cache = opts.cache
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
    this.env = opts.env
    this.profileDir = opts.profileDir
    this.freeOnly = opts.freeOnly === true
  }

  /** prompt／export 都走 tmp 檔（比照 grok 做法）：用後（同一 tmp 目錄）皆刪，不殘留內容或側檔。 */
  private async runWithFiles(prompt: string, cwd: string, timeoutMs: number, idleTimeoutMs?: number, control?: Job['control']) {
    if (this.freeOnly) {
      const reply = await runDevinModel({ dataDir: this.profileDir, command: this.command, model: cliModel(this.baseArgs)!, prompt,
        cwd: idleTimeoutMs === undefined ? undefined : cwd, textOnly: idleTimeoutMs === undefined, timeoutMs, idleTimeoutMs, control })
      return { r: { ...reply.r, stdout: reply.answer }, exp: { final_metrics: { total_prompt_tokens: reply.tokensIn, total_completion_tokens: reply.tokensOut, total_cached_tokens: reply.tokensCached } } as DevinExport, actualModel: reply.actualModel }
    }
    const dir = mkdtempSync(join(tmpdir(), 'adng-devin-'))
    const promptFile = join(dir, 'prompt.txt')
    const exportFile = join(dir, 'export.json')
    let retainFiles = false
    try {
      writeFileSync(promptFile, prompt.replace(/\r\n/g, '\n'), 'utf8') // Node utf8 不寫 BOM；CRLF 正規化為 LF
      const r = await runProcess({
        command: this.command, args: [...this.baseArgs, '--prompt-file', promptFile, '--export', exportFile],
        cwd, stdinText: '', timeoutMs, ...(idleTimeoutMs === undefined ? {} : { idleTimeoutMs }), env: this.env, control
      })
      retainFiles = !!(r.aborted || r.timedOut || control?.signal?.aborted)
      let exp: DevinExport | undefined
      try { exp = JSON.parse(readFileSync(exportFile, 'utf8')) as DevinExport } catch { /* 未產出/損毀 → undefined，交給 silent-fail 判定 */ }
      return { r, exp, actualModel: undefined }
    } finally {
      if (!retainFiles) try { rmSync(dir, { recursive: true, force: true }) } catch { /* tmp 刪失敗不反殺結果 */ }
    }
  }

  /** 先查帳戶模型清單；最小 PONG 好壞結果都 cache，不推測信用額度。 */
  private cacheKey(): string { return cliPreflightKey(this.command, [...this.baseArgs, this.profileDir, String(this.freeOnly)], this.env, 'devin') }

  async preflight(): Promise<PreflightResult> {
    const admission = await nativeAdmission('devin', { command: this.command, args: this.baseArgs, env: this.freeOnly ? devinEnv() : this.env, replaceEnv: this.freeOnly, model: cliModel(this.baseArgs), timeoutMs: Math.min(this.pingTimeoutMs, 30_000) })
    const blocked = admissionFailure(admission)
    if (blocked) return blocked
    if (this.freeOnly && (admission.model.listedId !== cliModel(this.baseArgs) || admission.model.costTier !== 'Free')) return { ok: false, admission, detail: 'free-policy: Devin model is not an exact variant marked Free' }
    const cached = this.cache.get(this.cacheKey())
    if (cached) return withAdmission(cached, admission, true)
    let result: PreflightResult
    try {
      if (!this.freeOnly) ensureNoMcpImport(this.profileDir) // Strict native mode owns its isolated config.
      const { r, exp } = await this.runWithFiles('Reply with exactly: PONG', this.profileDir, this.pingTimeoutMs)
      result = r.exitCode === 0 && !r.timedOut && exp && /^PONG\r?$/m.test(r.stdout)
        ? { ok: true, detail: `PONG ${r.durationMs}ms` }
        : { ok: false, detail: r.timedOut ? 'ping timeout' : `no PONG (exit ${r.exitCode}) ${cliDiagnostic(r, this.env, this.baseArgs).slice(0, 700)}` }
    } catch (err) { result = { ok: false, detail: redactCli(String(err), { ...process.env, ...this.env }, this.baseArgs).slice(0, 700) } }
    this.cache.set(this.cacheKey(), result)
    return withAdmission(result, admission)
  }

  invalidatePreflight(): void { this.cache.set(this.cacheKey(), { ok: false, detail: 'run-failed：下輪重探' }, 0) } // ts=0＝寫入即過期

  async run(job: Job): Promise<RunResult> {
    const prompt = [
      `你是自動開發工人。完成以下這一項任務。`, HANDOFF_GUARD, WORKER_GUARDS,
      `改動完成後必須自己執行 git add -A 與 git commit（conventional commit，zh-TW）；`,
      `沒有 commit 的工作會被整輪作廢、視為失敗。`,
      `嚴禁超出任務範圍、嚴禁動 BACKLOG.md、嚴禁自行新增任務。`,
      `任務：${job.directive ?? job.task.text}`
    ].join('\n')

    if (!this.freeOnly) ensureNoMcpImport(job.projectPath) // Strict native mode owns its isolated config.
    const before = this.getCommitHash(job.projectPath)
    let result: Awaited<ReturnType<DevinEngine['runWithFiles']>>
    try { result = await this.runWithFiles(prompt, job.projectPath, this.timeoutMs, this.idleTimeoutMs, job.control) }
    catch (error) {
      if (job.control?.signal?.aborted || (error instanceof DevinRunError && error.result.aborted)) return cancelledRun()
      if (error instanceof DevinRunError) return { ok: false, output: error.message, costUsd: 0, costUnknown: true, failureReason: error.reason }
      throw error
    }
    const { r, exp, actualModel } = result

    if (r.aborted || job.control?.signal?.aborted) return cancelledRun(cliDiagnostic(r, this.env, this.baseArgs))
    if (r.timedOut) return { ok: false, output: cliDiagnostic(r, this.env, this.baseArgs), costUsd: 0, costUnknown: true, failureReason: 'timeout' }
    if (r.exitCode !== 0) {
      return { ok: false, output: cliDiagnostic(r, this.env, this.baseArgs), costUsd: 0, costUnknown: true, failureReason: `exit ${r.exitCode}: ${cliDiagnostic(r, this.env, this.baseArgs).slice(0, 700)}` }
    }
    // silent-fail 防呆：exit 0 但無 export JSON（未產出/損毀）＝失敗，不可只信 exit code／純文字 stdout。
    if (!exp) return { ok: false, output: cliDiagnostic(r, this.env, this.baseArgs), costUsd: 0, costUnknown: true, failureReason: 'silent-fail：exit 0 但無 export JSON（≠ 成功）' }

    const output = tail(`${r.stdout}\n${usageLine(exp)}`)
    const tokensIn = exp.final_metrics?.total_prompt_tokens
    const tokensOut = exp.final_metrics?.total_completion_tokens
    const tokensCached = exp.final_metrics?.total_cached_tokens
    const after = this.getCommitHash(job.projectPath)
    if (after === undefined || after === before) {
      const hint = hasExecCommit(exp) ? '' : '；export 亦無 exec git commit 步驟'
      return { ok: false, output, costUsd: 0, costUnknown: true, failureReason: `no-commit(phantom completion?)${hint}`, tokensIn, tokensOut, tokensCached }
    }
    return { ok: true, output, costUsd: 0, costUnknown: true, commitHash: after, baseCommitHash: before, tokensIn, tokensOut, tokensCached, ...(actualModel ? { actualModel } : {}) }
  }
}

interface DevinToolCall { function_name?: string; arguments?: { command?: string } }
interface DevinStep { tool_calls?: DevinToolCall[] }
interface DevinExport { steps?: DevinStep[]; final_metrics?: { total_prompt_tokens?: number; total_completion_tokens?: number; total_cached_tokens?: number; total_steps?: number } }

/** export.json steps[].tool_calls[] 找 function_name==='exec' 且 command 含 'git commit'（輔助訊號；真相來源仍是 commit hash 前進檢查）。導出供測試。 */
export function hasExecCommit(exp: DevinExport): boolean {
  const calls = (exp.steps ?? []).flatMap(s => s.tool_calls ?? [])
  return calls.some(tc => tc.function_name === 'exec' && typeof tc.arguments?.command === 'string' && tc.arguments.command.includes('git commit'))
}

function usageLine(exp: DevinExport): string {
  const m = exp.final_metrics ?? {}
  return `[tokens in=${m.total_prompt_tokens ?? '?'} out=${m.total_completion_tokens ?? '?'} cached=${m.total_cached_tokens ?? '?'} steps=${m.total_steps ?? '?'}]`
}


function tail(s: string, n = 2000): string { return s.length > n ? s.slice(-n) : s }
