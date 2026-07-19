import { randomBytes } from 'node:crypto'
import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { runProcess } from '../proc.js'
import type { PreflightCache } from '../preflight.js'
import { defaultCommitHash } from './commit-hash.js'
import { WORKER_GUARDS } from './prompt-guard.js'

/** Windows 路徑 → WSL /mnt 路徑：`D:\a b\c` → `/mnt/d/a b/c`。小寫碟符、反斜線轉正斜線、空格
 * 原樣保留（argv 直傳不經 shell 毋須跳脫）、尾斜線剝除；非「碟符:」開頭視為已是 POSIX。導出供測試。 */
export function toWslPath(p: string): string {
  const m = /^([A-Za-z]):[\\/](.*)$/.exec(p)
  if (!m) return p.replace(/\\/g, '/')
  const rest = m[2]!.replace(/\\/g, '/').replace(/\/+$/, '')
  return rest === '' ? `/mnt/${m[1]!.toLowerCase()}` : `/mnt/${m[1]!.toLowerCase()}/${rest}`
}

/** 超時補刀指令（跨界樹斬）：runProcess 的 taskkill 只斬得到 Windows 側 wsl.exe relay（本次
 * spawn 的 stdio 管道 client，非 OpenAB 常駐後端），Linux 側 agy 可能淪為孤兒——以本次 run 專屬
 * marker 精準 pkill。絕不放寬 pattern（如 pkill agy 全部）、絕不殺 wsl.exe 系統進程。導出供測試。 */
export function buildKillArgs(distro: string, marker: string): string[] {
  return ['-d', distro, '-u', 'root', '--', 'pkill', '-f', marker]
}

export interface AgyOpts {
  id?: string
  command?: string // 預設 wsl.exe；測試代換為 process.execPath 跑 fake script（配 argvPrefix）
  argvPrefix?: string[] // 測試用：插在 wsl 參數前（fake script 路徑）。生產不設
  distro?: string; agyBin?: string; model?: string
  timeoutMs?: number; pingTimeoutMs?: number
  cache: PreflightCache
  getCommitHash?: (cwd: string) => string | undefined
}

/** agy（Google Antigravity CLI，WSL 內）adapter。規格卡（m5-cli-engines-research.md 卡 6）：
 * spawn wsl.exe --cd 直達 /usr/local/bin/agy（勿經 bash wrapper——非 .exe 會被 resolveSpawnTarget
 * 包 cmd.exe /c，cmd 不懂 shebang 直接死）。輸出純文字無 usage/cost → no-commit 檢查是唯一成功
 * 硬證據，costUnknown 恆真（scheduler 依 config costPerRunUsd=0 記帳）。 */
export class AgyEngine implements Engine {
  readonly id: string
  private readonly command: string
  private readonly argvPrefix: string[]
  private readonly distro: string
  private readonly agyBin: string
  private readonly model?: string
  private readonly timeoutMs: number
  private readonly pingTimeoutMs: number
  private readonly cache: PreflightCache
  private readonly getCommitHash: (cwd: string) => string | undefined

  constructor(opts: AgyOpts) {
    this.id = opts.id ?? 'agy'
    this.command = opts.command ?? 'wsl.exe'
    this.argvPrefix = opts.argvPrefix ?? []
    this.distro = opts.distro ?? 'Ubuntu'
    this.agyBin = opts.agyBin ?? '/usr/local/bin/agy'
    this.model = opts.model
    this.timeoutMs = opts.timeoutMs ?? 15 * 60 * 1000
    this.pingTimeoutMs = opts.pingTimeoutMs ?? 120 * 1000 // WSL 跨界＋冷啟，比 claude-cli 再寬
    this.cache = opts.cache
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
  }
  private wslArgs(winCwd: string, agyTail: string[]): string[] {
    return [...this.argvPrefix, '--cd', toWslPath(winCwd), '-d', this.distro, '-u', 'root', '--', this.agyBin, ...agyTail]
  }

  /** agy 旗標（1.1.4 實測契約 2026-07-19）：全域旗標必在 -p 之前（-p 後的旗標被吞、權限直接
   * auto-deny）；prompt 必為 -p 的參數——print 模式不讀 stdin（舊規格卡的 stdin 餵法已失效，
   * 當時 positional 只放 marker，實測 agy 會把 marker 當 prompt 拿去自主研究）。prompt 含 run-id
   * marker → 進 Linux 側 cmdline，超時補刀 pkill -f 咬得到。--print-timeout 預設僅 5m → 明確設為
   * 略短於 wall timeout 讓 agy 自己先退場；地板 1s。 */
  private agyFlags(budgetMs: number, prompt: string): string[] {
    const flags = ['--dangerously-skip-permissions', '--print-timeout', `${Math.max(1, Math.floor(budgetMs / 1000))}s`]
    if (this.model !== undefined) flags.push('--model', this.model)
    flags.push('-p', prompt)
    return flags
  }

  async preflight(): Promise<PreflightResult> {
    const key = `${this.distro}:${this.agyBin}`
    const cached = this.cache.get(key)
    if (cached) return cached
    let result: PreflightResult
    try {
      const r = await runProcess({
        command: this.command, args: this.wslArgs(process.cwd(), this.agyFlags(this.pingTimeoutMs - 10_000, 'Reply with exactly: PONG')),
        cwd: process.cwd(), stdinText: '', timeoutMs: this.pingTimeoutMs
      })
      result = r.stdout.includes('PONG')
        ? { ok: true, detail: `PONG ${r.durationMs}ms` }
        : { ok: false, detail: r.timedOut ? 'ping timeout' : `no PONG (exit ${r.exitCode}) ${r.stderr.slice(0, 120)}` }
    } catch (err) {
      result = { ok: false, detail: String(err).slice(0, 200) }
    }
    this.cache.set(key, result) // 壞結果也 cache：避免對死引擎連環重打
    return result
  }

  invalidatePreflight(): void { this.cache.set(`${this.distro}:${this.agyBin}`, { ok: false, detail: 'run-failed：下輪重探' }, 0) } // ts=0＝寫入即過期

  async run(job: Job): Promise<RunResult> {
    // marker 進 pkill -f pattern（killByMarker）：taskId=hex 的隱性契約改顯性白名單驗證（defense-in-depth）
    if (!/^[0-9a-f]+$/i.test(job.task.id)) throw new Error(`task.id 非 hex，拒組 pkill marker：${job.task.id.slice(0, 40)}`)
    const marker = `adng-run-${job.task.id}-${randomBytes(4).toString('hex')}`
    const prompt = [
      `你是自動開發工人。完成以下這一項任務。`,
      WORKER_GUARDS,
      `改動完成後必須自己執行 git add -A 與 git commit（conventional commit，zh-TW）；`,
      `沒有 commit 的工作會被整輪作廢、視為失敗。`,
      `嚴禁超出任務範圍、嚴禁動 BACKLOG.md、嚴禁自行新增任務。只在目前工作目錄（git repo）內作業。`,
      `任務：${job.directive ?? job.task.text}`,
      `（run-id：${marker}，僅供系統識別，忽略即可）`
    ].join('\n')

    // prompt 走 argv（1.1.4 不讀 stdin）→ 受 Windows CreateProcess 32767 字元上限約束；超限 fail-fast
    // 給明確原因，不讓 wsl.exe 以難懂的 spawn 錯誤炸出來。
    if (prompt.length > 28_000) {
      return { ok: false, output: '', costUsd: 0, costUnknown: true, failureReason: `prompt ${prompt.length} 字超過 agy argv 上限（1.1.4 不讀 stdin）` }
    }
    const before = this.getCommitHash(job.projectPath)
    // --add-dir 必帶（真探針實證）：agy print 模式不把 cwd 當 workspace，缺它會跑去自家 scratch 自嗨。
    const r = await runProcess({
      command: this.command,
      args: this.wslArgs(job.projectPath, ['--add-dir', toWslPath(job.projectPath), ...this.agyFlags(this.timeoutMs - 30_000, prompt)]),
      cwd: job.projectPath, stdinText: '', timeoutMs: this.timeoutMs
    })

    if (r.timedOut) {
      await this.killByMarker(marker) // 跨界補刀：Linux 側孤兒以 run-id 精準收屍
      return { ok: false, output: tail(r.stderr || r.stdout), costUsd: 0, costUnknown: true, failureReason: 'timeout' }
    }
    if (r.exitCode !== 0) {
      return { ok: false, output: tail(r.stderr), costUsd: 0, costUnknown: true, failureReason: `exit ${r.exitCode}: ${r.stderr.slice(0, 200)}` }
    }
    if (r.stdout.trim() === '') {
      return { ok: false, output: tail(r.stderr), costUsd: 0, costUnknown: true, failureReason: 'empty output（exit 0 零輸出 ≠ 成功，踩雷 §13）' }
    }
    // 純文字輸出：exit 0＋輸出非空只是軟證據，commit hash 前進才是唯一硬證據（規格卡結論）。
    const after = this.getCommitHash(job.projectPath)
    if (after === undefined || after === before) {
      return { ok: false, output: tail(r.stdout), costUsd: 0, costUnknown: true, failureReason: 'no-commit(phantom completion?)' }
    }
    return { ok: true, output: tail(r.stdout), costUsd: 0, costUnknown: true, commitHash: after, baseCommitHash: before }
  }

  private async killByMarker(marker: string): Promise<void> {
    try {
      await runProcess({
        command: this.command, args: [...this.argvPrefix, ...buildKillArgs(this.distro, marker)],
        cwd: process.cwd(), stdinText: '', timeoutMs: 15_000
      })
    } catch { /* 盡力而為：agy 可能已因 --print-timeout 自行退場（pkill exit 1＝無匹配） */ }
  }
}

function tail(s: string, n = 2000): string { return s.length > n ? s.slice(-n) : s }