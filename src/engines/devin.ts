import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { runProcess } from '../proc.js'
import type { PreflightCache } from '../preflight.js'

export interface DevinOpts {
  id?: string // 觀測用引擎識別；registry 以 tag 帶入區分多檔位，未設維持 'devin'
  command?: string // 預設 PATH 裸名 devin.exe；config command 可覆寫完整路徑，不硬編碼機器路徑（opencode 教訓）
  baseArgs?: string[]
  timeoutMs?: number
  pingTimeoutMs?: number
  cache: PreflightCache
  getCommitHash?: (cwd: string) => string | undefined
  env?: Record<string, string>
  model?: string // 預設鎖 swe-1.6（credit_multiplier 0，官方保證真免費；不可用 adaptive，會燒配額）
}

const HANDOFF_GUARD = `全部在本機當前目錄操作；嚴禁呼叫 handoff/cloud/remote 相關工具或語意，不做雲端交接。`

/** M5 Task 9：Devin CLI 引擎（規格卡 .superpowers/sdd/devin-engine-research.md）。原生 .exe
 * 本機執行（非雲端 handoff，實測確認）；prompt 走 --prompt-file（stdin 未驗證，比照 grok）；
 * `--permission-mode dangerous`（=Bypass）；`--model swe-1.6`（鎖定，唯一官方保證 0 credit
 * multiplier 的模型）。一定加 `--export <tmp>`：export JSON（ATIF-v1.7）steps[] 解析是否有
 * exec 步驟含 git commit 當輔助訊號；真相來源仍是 commit hash 前進檢查，疊加 silent-fail
 * 防呆（仿 codex）：exit 0 但無 export＝失敗。無 USD 欄位 → costUsd 恆 0＋costUnknown:true
 * （devin tag 必須設 costPerRunUsd 0——非估計值，官方 0 credit multiplier 保證）。CLI 無內建
 * 逾時 → 完全依賴 runProcess 外部 wall timer + 雙層樹斬。副作用：cwd 可能被寫入 `.serena/`
 * 索引側目錄（devin 本機 exec 自動觸發 Serena）——沿用既有 worktree cleanup，不特殊處理。 */
export class DevinEngine implements Engine {
  readonly id: string
  private readonly command: string
  private readonly baseArgs: string[]
  private readonly timeoutMs: number
  private readonly pingTimeoutMs: number
  private readonly cache: PreflightCache
  private readonly getCommitHash: (cwd: string) => string | undefined
  private readonly env?: Record<string, string>

  constructor(opts: DevinOpts) {
    this.id = opts.id ?? 'devin'
    this.command = opts.command ?? 'devin.exe'
    // 真探針修正：`--prompt-file` 單獨帶只是把它當「初始 prompt」丟進互動式 session（真的卡在
    // TUI 等下一句輸入，撞 wall timeout 才被樹斬）；必須疊 `-p/--print` 才是處理完即退出的非
    // 互動模式（研究卡只驗過 `-p "<inline>"`，未驗過 `--prompt-file` 單獨行為，此為落地時修正）。
    const base = opts.baseArgs ?? ['-p', '--permission-mode', 'dangerous']
    this.baseArgs = [...base, '--model', opts.model ?? 'swe-1.6']
    this.timeoutMs = opts.timeoutMs ?? 15 * 60 * 1000
    this.pingTimeoutMs = opts.pingTimeoutMs ?? 90 * 1000
    this.cache = opts.cache
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
    this.env = opts.env
  }

  /** prompt／export 都走 tmp 檔（比照 grok 的 --prompt-file 做法）：prompt 寫入、export 讀出，
   * 兩者用後（同一 tmp 目錄）皆刪，不殘留 prompt 內容或任務結果側檔。 */
  private async runWithFiles(prompt: string, cwd: string, timeoutMs: number) {
    const dir = mkdtempSync(join(tmpdir(), 'adng-devin-'))
    const promptFile = join(dir, 'prompt.txt')
    const exportFile = join(dir, 'export.json')
    try {
      writeFileSync(promptFile, prompt.replace(/\r\n/g, '\n'), 'utf8') // Node utf8 不寫 BOM；CRLF 正規化為 LF
      const r = await runProcess({
        command: this.command, args: [...this.baseArgs, '--prompt-file', promptFile, '--export', exportFile],
        cwd, stdinText: '', timeoutMs, env: this.env
      })
      let exp: DevinExport | undefined
      try { exp = JSON.parse(readFileSync(exportFile, 'utf8')) as DevinExport } catch { /* 未產出/損毀 → undefined，交給 silent-fail 判定 */ }
      return { r, exp }
    } finally {
      try { rmSync(dir, { recursive: true, force: true }) } catch { /* tmp 刪失敗不反殺結果 */ }
    }
  }

  /** 真探針（swe-1.6 官方 0 credit multiplier，成本可控）；好壞結果都 cache，防連環重打。 */
  async preflight(): Promise<PreflightResult> {
    const cached = this.cache.get(this.command)
    if (cached) return cached
    let result: PreflightResult
    try {
      const { r } = await this.runWithFiles('Reply with exactly: PONG', process.cwd(), this.pingTimeoutMs)
      result = r.stdout.includes('PONG')
        ? { ok: true, detail: `PONG ${r.durationMs}ms` }
        : { ok: false, detail: r.timedOut ? 'ping timeout' : `no PONG (exit ${r.exitCode}) ${r.stderr.slice(0, 120)}` }
    } catch (err) { result = { ok: false, detail: String(err).slice(0, 200) } }
    this.cache.set(this.command, result)
    return result
  }

  async run(job: Job): Promise<RunResult> {
    const prompt = [
      `你是自動開發工人。完成以下這一項任務。`, HANDOFF_GUARD,
      `改動完成後必須自己執行 git add -A 與 git commit（conventional commit，zh-TW）；`,
      `沒有 commit 的工作會被整輪作廢、視為失敗。`,
      `嚴禁超出任務範圍、嚴禁動 BACKLOG.md、嚴禁自行新增任務。`,
      `任務：${job.directive ?? job.task.text}`
    ].join('\n')

    const before = this.getCommitHash(job.projectPath)
    const { r, exp } = await this.runWithFiles(prompt, job.projectPath, this.timeoutMs)

    if (r.timedOut) return { ok: false, output: tailErr(r), costUsd: 0, costUnknown: true, failureReason: 'timeout' }
    if (r.exitCode !== 0) {
      return { ok: false, output: tailErr(r), costUsd: 0, costUnknown: true, failureReason: `exit ${r.exitCode}: ${r.stderr.slice(0, 200)}` }
    }
    // silent-fail 防呆：exit 0 但無 export JSON（未產出/損毀）＝失敗，不可只信 exit code／純文字 stdout。
    if (!exp) return { ok: false, output: tailErr(r), costUsd: 0, costUnknown: true, failureReason: 'silent-fail：exit 0 但無 export JSON（≠ 成功）' }

    const output = tail(`${r.stdout}\n${usageLine(exp)}`)
    const after = this.getCommitHash(job.projectPath)
    if (after === undefined || after === before) {
      const hint = hasExecCommit(exp) ? '' : '；export 亦無 exec git commit 步驟'
      return { ok: false, output, costUsd: 0, costUnknown: true, failureReason: `no-commit(phantom completion?)${hint}` }
    }
    return { ok: true, output, costUsd: 0, costUnknown: true, commitHash: after, baseCommitHash: before }
  }
}

interface DevinToolCall { function_name?: string; arguments?: { command?: string } }
interface DevinStep { tool_calls?: DevinToolCall[] }
interface DevinExport {
  steps?: DevinStep[]
  final_metrics?: { total_prompt_tokens?: number; total_completion_tokens?: number; total_cached_tokens?: number; total_steps?: number }
}

/** export.json steps[].tool_calls[] 找 function_name==='exec' 且 arguments.command 含
 * 'git commit'（輔助訊號；真相來源仍是 commit hash 前進檢查）。導出供測試。 */
export function hasExecCommit(exp: DevinExport): boolean {
  const calls = (exp.steps ?? []).flatMap(s => s.tool_calls ?? [])
  return calls.some(tc => tc.function_name === 'exec' && typeof tc.arguments?.command === 'string' && tc.arguments.command.includes('git commit'))
}

function usageLine(exp: DevinExport): string {
  const m = exp.final_metrics ?? {}
  return `[tokens in=${m.total_prompt_tokens ?? '?'} out=${m.total_completion_tokens ?? '?'} cached=${m.total_cached_tokens ?? '?'} steps=${m.total_steps ?? '?'}]`
}

/** 失敗路徑：stdout 為主（規格卡：-p 的 stdout 是純文字確認訊息），stderr 非空才附加
 * （鐵律 #7：不吞 stderr，比照 opencode 的 tailErr 做法）。 */
function tailErr(r: { stdout: string; stderr: string }): string {
  return tail(r.stdout + (r.stderr.trim() === '' ? '' : '\n[stderr]\n' + r.stderr))
}

function tail(s: string, n = 2000): string { return s.length > n ? s.slice(-n) : s }

function defaultCommitHash(cwd: string): string | undefined {
  try { return execFileSync('git', ['-C', cwd, 'rev-parse', 'HEAD'], { encoding: 'utf8', timeout: 10_000 }).trim() } catch { return undefined }
}
