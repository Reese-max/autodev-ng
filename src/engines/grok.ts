import { unknownAdmission, withAdmission } from './cli-admission.js'
import { cliDiagnostic, cliPreflightKey, redactCli, cliModel, cliEvents, cliError } from './cli-diagnostics.js'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { DEFAULT_ENGINE_IDLE_TIMEOUT_MS, runProcess } from './proc.js'
import { cancelledRun } from './run-control.js'
import type { PreflightCache } from '../preflight.js'
import { defaultCommitHash } from './commit-hash.js'
import { WORKER_GUARDS } from './prompt-guard.js'

export interface GrokOpts {
  id?: string // 觀測用引擎識別；registry 以 tag 帶入區分多檔位，未設維持 'grok'
  command?: string
  baseArgs?: string[]
  timeoutMs?: number
  pingTimeoutMs?: number
  idleTimeoutMs?: number
  cache: PreflightCache
  getCommitHash?: (cwd: string) => string | undefined
  env?: Record<string, string>
  model?: string // -m 指定（如 grok-build）；未設用 CLI 預設 grok-composer-2.5-fast
}

/** 規格卡實錄的例行 telemetry stderr 雜訊（cli-chat-proxy.grok.com/v1/traces ExportError
 * timeout）——不可當失敗訊號；失敗附 stderr 前先逐行濾掉。 */
const TELEMETRY_RE = /cli-chat-proxy\.grok\.com|ExportError|telemetry/i

/** M5 Task 7：xAI grok CLI 引擎（規格卡 m5-cli-engines-research.md 卡 4）。
 * 單一 JSON 輸出 {text, stopReason, ...}，**無 usage/cost 欄位** → costUsd 恆 0＋
 * costUnknown:true，scheduler 記 config costPerRunUsd。prompt 走 --prompt-file tmp 檔
 * （stdin 餵法未驗證，規格卡指定檔案路線）。`grok models` 謊報未登入 → preflight 必真跑
 * 最小推理探針。原生 .exe → 預設 command 'grok.exe'（proc resolveSpawnTarget 直呼不經 cmd）。 */
export class GrokEngine implements Engine {
  readonly id: string
  private readonly command: string
  private readonly baseArgs: string[]
  private readonly timeoutMs: number
  private readonly pingTimeoutMs: number
  private readonly idleTimeoutMs: number
  private readonly cache: PreflightCache
  private readonly getCommitHash: (cwd: string) => string | undefined
  private readonly env?: Record<string, string>

  constructor(opts: GrokOpts) {
    this.id = opts.id ?? 'grok'
    this.command = opts.command ?? 'grok.exe'
    // 真探針實錄：`-p/--single` 是帶值旗標，裸帶會 exit 2；`--prompt-file` 本身即
    // single-turn headless 入口（取代 -p），故 baseArgs 不含 -p。
    const base = opts.baseArgs ?? ['--output-format', 'streaming-json', '--permission-mode', 'bypassPermissions']
    this.baseArgs = opts.model ? [...base, '-m', opts.model] : base
    this.timeoutMs = opts.timeoutMs ?? 15 * 60 * 1000
    this.pingTimeoutMs = opts.pingTimeoutMs ?? 120 * 1000 // config 掛 MCP servers 會拖慢冷啟（規格卡）
    this.idleTimeoutMs = opts.idleTimeoutMs ?? DEFAULT_ENGINE_IDLE_TIMEOUT_MS
    this.cache = opts.cache
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
    this.env = opts.env
  }

  /** prompt 寫 tmp 檔（UTF-8 無 BOM、LF）走 --prompt-file；用後即刪（刪失敗不炸）。 */
  private async runWithPromptFile(prompt: string, cwd: string, timeoutMs: number, idleTimeoutMs?: number, control?: Job['control']) {
    const dir = mkdtempSync(join(tmpdir(), 'adng-grok-'))
    const file = join(dir, 'prompt.txt')
    let retainFiles = false
    try {
      writeFileSync(file, prompt.replace(/\r\n/g, '\n'), 'utf8') // Node utf8 不寫 BOM；CRLF 正規化為 LF
      const result = await runProcess({
        command: this.command, args: [...this.baseArgs, '--prompt-file', file],
        cwd, stdinText: '', timeoutMs, ...(idleTimeoutMs === undefined ? {} : { idleTimeoutMs }), env: this.env, control
      })
      retainFiles = !!(result.aborted || result.timedOut || control?.signal?.aborted)
      return result
    } finally {
      if (!retainFiles) try { rmSync(dir, { recursive: true, force: true }) } catch { /* tmp 刪失敗不反殺結果 */ }
    }
  }

  /** 真探針 preflight：`grok models` 謊報未登入（規格卡矛盾實錄）→ 唯一可信訊號是最小推理
   * 真的回話。好壞結果都 cache，防對死引擎連環重打。 */
  private cacheKey(): string { return cliPreflightKey(this.command, this.baseArgs, this.env, 'grok') }

  async preflight(): Promise<PreflightResult> {
    const admission = unknownAdmission('grok', cliModel(this.baseArgs))
    const cached = this.cache.get(this.cacheKey())
    if (cached) return withAdmission(cached, admission, true)
    let result: PreflightResult
    try {
      const r = await this.runWithPromptFile('Reply with exactly: PONG', process.cwd(), this.pingTimeoutMs)
      const parsed = parseResultJson(r.stdout)
      result = r.exitCode === 0 && !r.timedOut && parsed && complete(parsed) && String(parsed.text ?? '').trim() === 'PONG'
        ? { ok: true, detail: `PONG ${r.durationMs}ms` }
        : { ok: false, detail: r.timedOut ? 'ping timeout' : `no PONG (exit ${r.exitCode}) ${cliDiagnostic({ stdout: r.stdout, stderr: filterTelemetry(r.stderr) }, this.env, this.baseArgs).slice(0, 700)}` }
    } catch (err) {
      result = { ok: false, detail: redactCli(String(err), { ...process.env, ...this.env }, this.baseArgs).slice(0, 700) }
    }
    this.cache.set(this.cacheKey(), result)
    return withAdmission(result, admission)
  }

  invalidatePreflight(): void { this.cache.set(this.cacheKey(), { ok: false, detail: 'run-failed：下輪重探' }, 0) } // ts=0＝寫入即過期

  async run(job: Job): Promise<RunResult> {
    const prompt = [
      `你是自動開發工人。完成以下這一項任務。`,
      WORKER_GUARDS,
      `改動完成後必須自己執行 git add -A 與 git commit（conventional commit，zh-TW）；`,
      `沒有 commit 的工作會被整輪作廢、視為失敗。`,
      `嚴禁超出任務範圍、嚴禁動 BACKLOG.md、嚴禁自行新增任務。`,
      `任務：${job.directive ?? job.task.text}`
    ].join('\n')

    const before = this.getCommitHash(job.projectPath)
    const r = await this.runWithPromptFile(prompt, job.projectPath, this.timeoutMs, this.idleTimeoutMs, job.control)

    // 失敗路徑才附 stderr（先濾 telemetry 雜訊）；成功路徑不附（規格卡：stderr 有例行雜訊）。
    if (r.aborted || job.control?.signal?.aborted) return cancelledRun(cliDiagnostic({ stdout: r.stdout, stderr: filterTelemetry(r.stderr) }, this.env, this.baseArgs))
    if (r.timedOut) return { ok: false, output: cliDiagnostic({ stdout: r.stdout, stderr: filterTelemetry(r.stderr) }, this.env, this.baseArgs), costUsd: 0, costUnknown: true, failureReason: 'timeout' }
    if (r.exitCode !== 0) {
      const err = cliDiagnostic({ stdout: r.stdout, stderr: filterTelemetry(r.stderr) }, this.env, this.baseArgs)
      return { ok: false, output: tail(err), costUsd: 0, costUnknown: true, failureReason: `exit ${r.exitCode}: ${err.slice(0, 700)}` }
    }

    const parsed = parseResultJson(r.stdout)
    // silent-fail 防呆（規格卡探針 1 實錄：exit 0＋stdout 全空）：零輸出/不可解析＝失敗。
    if (!parsed) {
      return { ok: false, output: tail(r.stdout), costUsd: 0, costUnknown: true, failureReason: 'empty-or-unparseable output（exit 0 零輸出 ≠ 成功）' }
    }
    if (!complete(parsed)) return { ok: false, output: cliDiagnostic(r, this.env, this.baseArgs), costUsd: 0, costUnknown: true,
      failureReason: 'incomplete/error result: stopReason=' + String(parsed.stopReason ?? parsed.subtype ?? '?') + '; ' + cliDiagnostic(r, this.env, this.baseArgs).slice(0, 700) }
    const output = tail(typeof parsed.text === 'string' ? parsed.text : r.stdout)

    const after = this.getCommitHash(job.projectPath)
    if (after === undefined || after === before) {
      return { ok: false, output, costUsd: 0, costUnknown: true, failureReason: 'no-commit(phantom completion?)' }
    }
    return { ok: true, output, costUsd: 0, costUnknown: true, commitHash: after, baseCommitHash: before }
  }
}

/** 單一 JSON 物件，但真探針實錄：--output-format json 是 **pretty-printed 多行** JSON
 * （非單行）→ 由下往上找「從該行起到文末」可解析的尾段：容前綴毒行、兼容單行 JSON。導出供測試。 */
export function parseResultJson(stdout: string): Record<string, unknown> | null {
  const events = cliEvents(stdout)
  const terminal = events.slice().reverse().find(e => ['end', 'result', 'error'].includes(String(e.type)))
  if (terminal) return { ...terminal, text: terminal.type === 'end'
    ? events.filter(e => e.type === 'text' && typeof e.data === 'string').map(e => e.data).join('')
    : terminal.result ?? terminal.text }
  const lines = stdout.split(/\r?\n/)
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]!.trimStart().startsWith('{')) continue // 便宜前置檢查：非 { 開頭的雜訊行不進 join+parse（防大量尾隨雜訊 O(n²) 退化，審查實測 640KB→1.3s）
    const s = lines.slice(i).join('\n').trim()
    try {
      const v = JSON.parse(s) as unknown
      if (typeof v === 'object' && v !== null) return v as Record<string, unknown>
    } catch { /* 繼續往上找 */ }
  }
  return null
}

function complete(result: Record<string, unknown>): boolean {
  return !cliError(result) && (String(result.stopReason).replace(/_/g, '').toLowerCase() === 'endturn'
    || (result.type === 'result' && result.subtype === 'success'))
}

/** stderr 逐行濾掉已知 telemetry 樣式；全被濾光時回註記，不留空字串誤導「無錯誤訊息」。 */
function filterTelemetry(stderr: string): string {
  const kept = stderr.split(/\r?\n/).filter(l => l.trim() !== '' && !TELEMETRY_RE.test(l)).join('\n')
  if (kept === '' && stderr.trim() !== '') return '[adng: stderr 僅 telemetry 雜訊，已濾除]'
  return kept
}

function tail(s: string, n = 2000): string { return s.length > n ? s.slice(-n) : s }
