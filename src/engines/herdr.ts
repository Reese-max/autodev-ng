import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { PreflightCache } from '../preflight.js'
import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { commitCodexWorktree } from './codex.js'
import { defaultCommitHash } from './commit-hash.js'
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
    this.runner = opts.runProcess ?? runProcess
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
    this.commitChanges = opts.commitChanges ?? commitCodexWorktree
  }

  async preflight(): Promise<PreflightResult> {
    const key = this.cacheKey()
    const cached = this.cache.get(key)
    if (cached) return cached
    let result: PreflightResult
    if (!existsSync(this.command)) {
      result = { ok: false, detail: `找不到 Herdr launcher：${this.command}` }
    } else {
      try {
        const r = await this.runner({
          command: 'herdr.exe', args: ['--session', this.sessionName, 'status', 'server', '--json'],
          cwd: process.cwd(), stdinText: '', timeoutMs: this.pingTimeoutMs,
        })
        const status = JSON.parse(r.stdout) as { running?: boolean; compatible?: boolean; protocol?: number }
        result = r.exitCode === 0 && status.running === true && status.compatible === true
          ? { ok: true, detail: `Herdr compatible protocol=${status.protocol ?? '?'}` }
          : { ok: false, detail: `Herdr 未就緒或不相容（exit=${r.exitCode} protocol=${status.protocol ?? '?'}）` }
      } catch (err) {
        result = { ok: false, detail: String(err).slice(0, 200) }
      }
    }
    this.cache.set(key, result)
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
    if (r.aborted) return cancelledRun(output)
    if (r.timedOut) return { ...failure('timeout', output), recoveryRequired: true }
    if (r.exitCode !== 0) return { ...failure(`herdr-blocked：exit ${r.exitCode} ${tail(r.stderr, 300)}`, output), recoveryRequired: true }
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

  private cacheKey(): string { return `${this.command}|${this.sessionName}` }
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
