import { unknownAdmission } from './cli-admission.js'
import { cliDiagnostic, cliPreflightKey, redactCli } from './cli-diagnostics.js'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { PreflightCache } from '../preflight.js'
import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { commitCodexWorktree } from './codex.js'
import { defaultCommitHash } from './commit-hash.js'
import {
  assertHerdrCostPolicy,
  classifyHerdrFailure,
  launcherFingerprint,
  observeHerdrBackend,
  summarizeHerdrReadiness,
} from './herdr-readiness.js'
import { runProcess } from './proc.js'
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
  /** 使用者指定的主力路徑模型（requested）；reported 只信執行回報，絕不推斷。 */
  model?: string
  /** 要求 verified-free 的設定不得放行 unknown 路徑（unknown ≠ confirmed-zero）。 */
  requireVerifiedFree?: boolean
  /** 備援必須事先列入允許清單；未設＝不備援，絕不自動切新付費模型。 */
  allowedFallbacks?: string[]
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
  private readonly requestedModel?: string
  private readonly requireVerifiedFree: boolean
  /** 事前備援白名單；未設＝單一路徑既有行為。一旦列出，連主力 provider 都必須在內，否則 fail-closed。 */
  private readonly allowedFallbacks?: string[]
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
    this.requestedModel = opts.model?.trim() || undefined
    this.requireVerifiedFree = opts.requireVerifiedFree ?? false
    this.allowedFallbacks = opts.allowedFallbacks
    this.runner = opts.runProcess ?? runProcess
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
    this.commitChanges = opts.commitChanges ?? commitCodexWorktree
  }

  async preflight(): Promise<PreflightResult> {
    const launcherHash = launcherFingerprint(this.command)
    const key = this.cacheKey(launcherHash)
    const admission = unknownAdmission('herdr', this.requestedModel)
    const cached = this.cache.get(key)
    if (cached) return this.gateVerifiedFree({ ...cached, admission })
    let result: PreflightResult
    if (!existsSync(this.command)) {
      result = { ok: false, detail: `找不到 Herdr launcher：${this.command}` }
    } else {
      try {
        const r = await this.runner({
          command: 'herdr.exe', args: ['--session', this.sessionName, 'status', 'server', '--json'],
          cwd: process.cwd(), stdinText: '', timeoutMs: this.pingTimeoutMs,
        })
        const status = JSON.parse(r.stdout) as { running?: boolean; compatible?: boolean; protocol?: unknown }
        const protocol = typeof status.protocol === 'number' && Number.isSafeInteger(status.protocol) && status.protocol >= 0 ? status.protocol : '?'
        result = r.exitCode === 0 && !r.timedOut && status.running === true && status.compatible === true
          ? { ok: true, detail: `Herdr compatible protocol=${protocol}` }
          : { ok: false, detail: `Herdr 未就緒或不相容（exit=${r.exitCode} protocol=${protocol}）` }
      } catch (err) {
        result = { ok: false, detail: redactCli(String(err), { ...process.env }, [this.sessionName, this.provider]).slice(0, 700) }
      }
    }
    const observation = observeHerdrBackend({
      server: result.ok ? 'ok' : 'unavailable', login: 'unknown', model: 'unknown', quota: 'unknown',
      provider: this.provider, requestedModel: this.requestedModel, launcherHash, source: 'launcher-health-only',
    })
    result = { ...result, detail: `${result.detail}; ${summarizeHerdrReadiness(observation)}; herdrVersion=unknown backendCliVersion=unknown (launcher health only)` }
    this.cache.set(key, result)
    return this.gateVerifiedFree({ ...result, admission })
  }

  /**
   * backend readiness 標記：server ok 只證明 launcher／server 健康，登入／模型／額度
   * 無可靠原生唯讀接口一律 unknown，絕不冒充全路徑已驗證。verified-free 設定擋 unknown。
   */
  private gateVerifiedFree(result: PreflightResult): PreflightResult {
    if (result.ok && this.requireVerifiedFree) {
      return { ...result, ok: false,
        detail: result.detail + '; herdr cost-unknown: verified-free required; unknown cost path blocked (unknown ≠ confirmed-zero)' }
    }
    return result
  }

  invalidatePreflight(): void {
    this.cache.set(this.cacheKey(), { ok: false, detail: 'run-failed：下輪重探' }, 0)
  }

  async run(job: Job): Promise<RunResult> {
    const before = this.getCommitHash(job.projectPath)
    if (!existsSync(join(job.projectPath, '.adng-worktree')) || before === undefined) {
      return failure('unsafe-worktree：Herdr 只接受 AutoDev 建立的有效 Git worktree')
    }
    try {
      // 本輪只走銷定的主力 provider；列出白名單後連主力都必須在內，否則 fail-closed（防偷切付費）。
      assertHerdrCostPolicy({ costUnknown: true, requireVerifiedFree: this.requireVerifiedFree,
        ...(this.allowedFallbacks ? { fallback: this.provider, allowlist: this.allowedFallbacks } : {}) })
    } catch (err) {
      return failure(`herdr-policy：${String(err instanceof Error ? err.message : err).slice(0, 200)}`)
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
    const output = tail(redactCli(`${r.stdout}\n${r.stderr}`.trim()))
    if (r.aborted || job.control?.signal?.aborted) return cancelledRun(output)
    // Issue #34：保留不同故障的處置建議，並失效 preflight 快取。
    // recovery 確認前仍隔離，不在這裡重試、冷卻後重派或切換付費路徑。
    if (r.timedOut) {
      const classified = classifyHerdrFailure(r)
      this.invalidatePreflight()
      return { ...failure(`herdr-${classified.failureClass}：timeout（${classified.advice.reason}）`, output), recoveryRequired: true }
    }
    if (r.exitCode !== 0) {
      const classified = classifyHerdrFailure({ exitCode: r.exitCode, stdout: r.stdout, stderr: r.stderr })
      this.invalidatePreflight()
      return { ...failure(`herdr-${classified.failureClass}：herdr-blocked：exit ${r.exitCode}（${classified.advice.reason}） ${cliDiagnostic(r, undefined, [this.sessionName, this.provider]).slice(0, 700)}`, output), recoveryRequired: true }
    }
    if (!r.stdout.includes('AUTOPILOT_WAIT_OK')) {
      const classified = classifyHerdrFailure({ exitCode: r.exitCode, stdout: r.stdout, stderr: r.stderr })
      this.invalidatePreflight()
      const reason = classified.failureClass === 'unknown'
        ? 'silent-fail：缺少 AUTOPILOT_WAIT_OK'
        : `herdr-${classified.failureClass}：silent-fail：缺少 AUTOPILOT_WAIT_OK（${classified.advice.reason}）`
      return { ...failure(reason, output), recoveryRequired: true }
    }

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

  private cacheKey(launcherHash = launcherFingerprint(this.command)): string {
    // 綁定 launcher、provider、requested model、session 及已知授權／設定上下文。
    // Herdr／底層 CLI runtime 與 Pi 授權檔身分仍未觀測。
    return cliPreflightKey(this.command,
      ['herdr-readiness-v1', this.sessionName, this.provider, this.requestedModel ?? '', launcherHash],
      undefined, this.provider === 'Codex' ? 'codex' : '')
  }
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
