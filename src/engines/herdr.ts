import { admissionFailure, unknownAdmission } from './cli-admission.js'
import { cliDiagnostic, cliPreflightKey, redactCli } from './cli-diagnostics.js'
import { applyBackendStatus, launcherDigest, parseHerdrStatus, quotaHoldUntil } from './herdr-readiness.js'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { PreflightCache } from '../preflight.js'
import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { commitCodexWorktree } from './codex.js'
import { defaultCommitHash } from './commit-hash.js'
import { runProcess, type ProcResult } from './proc.js'
import { cancelledRun } from './run-control.js'

interface HerdrOpts {
  id?: string
  /** Start-Herdr-Autopilot.ps1 的完整路徑。 */
  command: string
  cache: PreflightCache
  verifyCommand?: string
  timeoutMs?: number
  pingTimeoutMs?: number
  sessionName?: string
  provider?: 'Codex' | 'Pi'
  /** 設定指定的 backend 模型（requested）；與 status 回報比對，不傳未驗證的 launcher 旗標。 */
  model?: string
  /** status 探針 transient 失敗的額外重試次數（預設 2＝最多 3 次；確定的否定回答不重試）。 */
  statusRetries?: number
  /** 退避基數毫秒（預設 250，逐次加倍）。 */
  statusRetryDelayMs?: number
  runProcess?: typeof runProcess
  getCommitHash?: typeof defaultCommitHash
  commitChanges?: typeof commitCodexWorktree
}

/** AutoDev 保留排程、worktree、commit 與驗收權；Herdr 只執行單次受控 Agent 工作。 */
export class HerdrEngine implements Engine {
  readonly id: string
  private readonly command: string
  private readonly cache: PreflightCache
  private readonly fullGate?: string
  private readonly timeoutMs: number
  private readonly pingTimeoutMs: number
  private readonly sessionName: string
  private readonly provider: 'Codex' | 'Pi'
  private readonly model?: string
  private readonly statusRetries: number
  private readonly statusRetryDelayMs: number
  private readonly runner: typeof runProcess
  private readonly getCommitHash: typeof defaultCommitHash
  private readonly commitChanges: typeof commitCodexWorktree

  constructor(opts: HerdrOpts) {
    this.id = opts.id ?? 'herdr'
    this.command = opts.command
    this.cache = opts.cache
    this.fullGate = opts.verifyCommand?.trim() || undefined
    this.timeoutMs = opts.timeoutMs ?? 60 * 60_000
    this.pingTimeoutMs = opts.pingTimeoutMs ?? 15_000
    this.sessionName = opts.sessionName ?? 'herdr-autopilot'
    this.provider = opts.provider ?? 'Codex'
    this.model = opts.model?.trim() || undefined
    this.statusRetries = Math.min(4, Math.max(0, opts.statusRetries ?? 2))
    this.statusRetryDelayMs = Math.min(5_000, Math.max(0, opts.statusRetryDelayMs ?? 250))
    this.runner = opts.runProcess ?? runProcess
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
    this.commitChanges = opts.commitChanges ?? commitCodexWorktree
  }

  /**
   * server／auth／model／quota 分開驗證（issue #34）：server ok 不代表整條執行路徑可用。
   * 觀測只用唯讀 `status server --json`；無可靠欄位→unknown（不猜、不視為已驗證）。
   * 故障分類：transient 才有界退避重試；auth missing 等人工；quota exhausted 依 reset 或有界冷卻；
   * model unavailable 回報設定問題。全程不送同意、不登出、不改寫憑證、不自動切付費模型。
   */
  async preflight(): Promise<PreflightResult> {
    const key = this.cacheKey()
    const cached = this.cache.get(key)
    if (cached) return cached // 命中即整份觀測（含原 checkedAt），不刷新證據時間
    const admission = unknownAdmission('herdr', this.model)
    admission.backend = this.backendBase()
    let result: PreflightResult
    if (!existsSync(this.command)) {
      result = { ok: false, detail: `找不到 Herdr launcher：${this.command}` }
    } else {
      const probe = await this.probeStatus()
      if ('detail' in probe) {
        result = { ok: false, detail: probe.detail }
      } else {
        const { r, status } = probe
        applyBackendStatus(admission, status, { ...this.backendBase(), model: this.model })
        const hold = quotaHoldUntil(admission)
        const serverOk = r.exitCode === 0 && !r.timedOut && status.running === true && status.compatible === true
        if (!serverOk) {
          result = { ok: false, detail: `Herdr 未就緒或不相容（exit=${r.exitCode} protocol=${String(status.protocol ?? '?')}）` }
        } else {
          // 設了 model 但 backend 無法證實＝設定期望未被驗證，不得放行（unknown 不冒充可用）。
          const unverified = this.model !== undefined && admission.model.state === 'unknown'
            ? { ok: false as const, detail: `model unverified: requested ${this.model}；backend status 無可靠模型欄位` }
            : undefined
          const blocked = admissionFailure(admission) ?? unverified
          const guidance = admission.auth?.state === 'missing' ? '；等待人工登入——不自動送出同意、不登出或改寫憑證'
            : admission.quota.state === 'exhausted' ? (hold !== undefined ? `；${new Date(hold).toISOString()} 後再查` : '；bounded cooldown 後再查')
            : '；設定問題——不自動切換或改派模型'
          result = blocked ? { ok: false, detail: blocked.detail + guidance }
            : { ok: true, detail: `Herdr compatible protocol=${String(status.protocol ?? '?')}` }
        }
      }
    }
    result = { ...result, admission, detail: `${result.detail}; auth=${admission.auth?.state ?? 'unknown'}; model=${admission.model.state}; quota=${admission.quota.state}` }
    const hold = quotaHoldUntil(admission)
    if (hold !== undefined) this.cache.setUntil(key, result, hold)
    else this.cache.set(key, result)
    return result
  }

  /** 唯讀 status 探針：解析得出的回答（含否定）是確定證據；只有逾時／無法解析／spawn 失敗才退避重試。 */
  private async probeStatus(): Promise<{ r: ProcResult; status: Record<string, unknown> } | { detail: string }> {
    const args = ['--session', this.sessionName, 'status', 'server', '--json']
    let last = ''
    for (let i = 0; i <= this.statusRetries; i++) {
      if (i > 0) await new Promise(res => setTimeout(res, this.statusRetryDelayMs * 2 ** (i - 1)))
      try {
        const r = await this.runner({
          command: 'herdr.exe', args, cwd: process.cwd(), stdinText: '', timeoutMs: this.pingTimeoutMs,
        })
        const status = parseHerdrStatus(r.stdout)
        if (status) return { r, status }
        last = cliDiagnostic(r, undefined, args).slice(0, 400) || `exit=${r.exitCode} timedOut=${r.timedOut}`
      } catch (err) {
        last = redactCli(String(err), { ...process.env }, args).slice(0, 400)
      }
    }
    return { detail: `herdr status probe failed（transient，${this.statusRetries + 1} 次有界退避後仍失敗）：${last.slice(0, 500)}` }
  }

  invalidatePreflight(): void {
    this.cache.set(this.cacheKey(), { ok: false, detail: 'run-failed：下輪重探' }, 0)
  }

  async run(job: Job): Promise<RunResult> {
    const before = this.getCommitHash(job.projectPath)
    if (!existsSync(join(job.projectPath, '.adng-worktree')) || before === undefined) {
      return failure('unsafe-worktree：Herdr 只接受 AutoDev 建立的有效 Git worktree')
    }
    const goal = [
      job.directive ?? job.task.text,
      '',
      'AutoDev NG 是外層唯一控制者；只修改目前工作目錄，不要 git add、git commit、push、PR 或部署。',
      '完成後由 AutoDev 宿主提交，並再次執行正式驗收。',
    ].join('\n')
    const requestId = `adng-${safeId(job.task.id)}-${before.slice(0, 8)}`
    const r = await this.runner({
      command: 'pwsh.exe', cwd: job.projectPath, stdinText: '', timeoutMs: this.timeoutMs, control: job.control,
      args: [
        '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', this.command,
        '-ProjectPath', job.projectPath, '-Goal', goal, '-Mode', 'Auto',
        '-BudgetPolicy', this.provider === 'Pi' ? 'CostAware' : 'GPTOnly', '-Provider', this.provider,
        '-FastGate', 'git diff --check', ...(this.fullGate ? ['-FullGate', this.fullGate] : []),
        '-TimeoutMs', String(this.timeoutMs), '-MaxRounds', '1', '-RequestId', requestId,
        '-SessionName', this.sessionName, '-AllowLocalCommit:$false', '-Canary:$false',
        '-Wait', '-WaitTimeoutMs', String(this.timeoutMs),
      ],
    })
    const output = tail(`${r.stdout}\n${r.stderr}`.trim())
    if (r.aborted || job.control?.signal?.aborted) return cancelledRun(output)
    if (r.timedOut) return { ...failure('timeout', output), recoveryRequired: true }
    if (r.exitCode !== 0) return { ...failure(`herdr-blocked：exit ${r.exitCode} ${cliDiagnostic(r, undefined, [this.sessionName, this.provider]).slice(0, 700)}`, output), recoveryRequired: true }
    if (!r.stdout.includes('AUTOPILOT_WAIT_OK')) return { ...failure('silent-fail：缺少 AUTOPILOT_WAIT_OK', output), recoveryRequired: true }

    const agentHead = this.getCommitHash(job.projectPath)
    if (agentHead !== before) return failure('unexpected-commit：Herdr 越過 AutoDev 宿主提交邊界', output)
    let after: string | undefined
    try {
      after = this.commitChanges(job.projectPath, `chore(autodev): 完成 ${job.task.text.replace(/\s+/g, ' ').trim().slice(0, 60) || job.task.id}`)
    } catch (err) {
      return failure(`no-commit：宿主提交失敗 ${String(err).replace(/\s+/g, ' ').slice(0, 200)}`, output)
    }
    if (!after || after === before) return failure('no-commit(phantom completion?)', output)
    return { ok: true, output, costUsd: 0, costUnknown: true, baseCommitHash: before, commitHash: after }
  }

  private backendBase() {
    return { source: `herdr.exe --session ${this.sessionName} status server --json`, provider: this.provider, launcherSha256: launcherDigest(this.command) }
  }

  /** 快取綁定精確 runtime：session／provider／model＋launcher 檔案內容雜湊（變動即新 key→重探）。 */
  private cacheKey(): string { return cliPreflightKey(this.command, [this.sessionName, this.provider, this.model ?? '', launcherDigest(this.command)]) }
}

function safeId(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 40) || 'task'
}

function failure(failureReason: string, output = ''): RunResult {
  return { ok: false, output, costUsd: 0, costUnknown: true, failureReason }
}

function tail(value: string, length = 2000): string {
  return value.length > length ? value.slice(-length) : value
}
