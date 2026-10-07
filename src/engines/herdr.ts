import { unknownAdmission } from './cli-admission.js'
import { cliDiagnostic, cliPreflightKey, redactCli } from './cli-diagnostics.js'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import type { PreflightCache } from '../preflight.js'
import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { commitCodexWorktree } from './codex.js'
import { defaultCommitHash } from './commit-hash.js'
import {
  checkHerdrResultFile, clearHerdrResult, herdrResultPath, writeHerdrExpected,
  type HerdrExpectedBinding,
} from './herdr-result.js'
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
  /** 預期綁定與結果契約檔保存位置；未設時落 tmpdir（測試／直建用途）。 */
  dataDir?: string
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
  private readonly resultsDir: string
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
    this.resultsDir = opts.dataDir ? join(opts.dataDir, 'herdr') : join(tmpdir(), 'adng-herdr-results')
    this.runner = opts.runProcess ?? runProcess
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
    this.commitChanges = opts.commitChanges ?? commitCodexWorktree
  }

  async preflight(): Promise<PreflightResult> {
    const key = this.cacheKey()
    const admission = unknownAdmission('herdr', undefined)
    const cached = this.cache.get(key)
    if (cached) return { ...cached, admission }
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
        result = r.exitCode === 0 && !r.timedOut && status.running === true && status.compatible === true
          ? { ok: true, detail: `Herdr compatible protocol=${status.protocol ?? '?'}` }
          : { ok: false, detail: `Herdr 未就緒或不相容（exit=${r.exitCode} protocol=${status.protocol ?? '?'}）` }
      } catch (err) {
        result = { ok: false, detail: redactCli(String(err), { ...process.env }, [this.sessionName, this.provider]).slice(0, 700) }
      }
    }
    this.cache.set(key, result)
    return { ...result, admission, detail: result.detail + "; quota=unknown; model=unknown (launcher health only)" }
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
    // request 綁定精確 execution：新 attempt＝新 ID；同一 execution 重查沿用原 ID（issue #32）。
    // 同一 execution 的 run() 不可並發（scheduler 每任務序列化）；結果檔路徑按 requestId 唯一。
    const executionId = job.executionId ?? randomUUID()
    const requestId = `adng-${safeId(job.task.id)}-${before.slice(0, 8)}-${safeId(executionId)}`
    const resultPath = herdrResultPath(this.resultsDir, requestId)
    const expected: HerdrExpectedBinding = {
      schemaVersion: 1, requestId, executionId, repo: resolve(job.projectPath),
      taskId: job.task.id, baseCommit: before, session: this.sessionName,
      launcher: this.command, issuedAt: new Date().toISOString(),
    }
    try {
      writeHerdrExpected(this.resultsDir, expected) // 送件前保存預期綁定
      clearHerdrResult(resultPath) // 同 request 的舊回執檔不得被當成本次結果
    } catch (err) {
      return failure(`herdr-result-store：無法保存預期綁定 ${String(err).replace(/\s+/g, ' ').slice(0, 200)}`)
    }
    const r = await this.runner({
      command: 'pwsh.exe', cwd: job.projectPath, stdinText: '', timeoutMs: this.timeoutMs, control: job.control,
      args: [
        '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', this.command,
        '-ProjectPath', job.projectPath, '-Goal', goal, '-Mode', 'Auto',
        '-BudgetPolicy', this.provider === 'Pi' ? 'CostAware' : 'GPTOnly', '-Provider', this.provider,
        '-FastGate', 'git diff --check', ...(this.fullGate ? ['-FullGate', this.fullGate] : []),
        '-TimeoutMs', String(this.timeoutMs), '-MaxRounds', '1',
        '-RequestId', requestId, '-ExecutionId', executionId, '-ResultFile', resultPath,
        '-SessionName', this.sessionName, '-AllowLocalCommit:$false', '-Canary:$false',
        '-Wait', '-WaitTimeoutMs', String(this.timeoutMs),
      ],
    })
    const output = tail(`${r.stdout}\n${r.stderr}`.trim())
    if (r.aborted || job.control?.signal?.aborted) return cancelledRun(output)
    if (r.timedOut) return { ...failure('timeout', output), recoveryRequired: true }
    if (r.exitCode !== 0) return { ...failure(`herdr-blocked：exit ${r.exitCode} ${cliDiagnostic(r, undefined, [this.sessionName, this.provider]).slice(0, 700)}`, output), recoveryRequired: true }
    // 完成終態只信 launcher 寫回的結果契約檔；stdout 是人讀日誌，marker 字串或截斷都不算回執。
    const receipt = checkHerdrResultFile(resultPath, expected)
    if (!receipt.ok) {
      const reason = receipt.kind === 'missing'
        ? 'herdr-unsupported：launcher 未回傳結果契約 v1（Start-Herdr-Autopilot.ps1 須支援 -ResultFile 寫回；不再接受 stdout 字串成功）'
        : `herdr-${receipt.kind === 'unsupported' ? 'unsupported' : `result-${receipt.kind}`}：${receipt.reason}`
      return { ...failure(reason, output), recoveryRequired: true }
    }
    if (receipt.result.status === 'failed') {
      const detail = redactCli(receipt.result.detail ?? 'launcher 回報失敗', { ...process.env }, [this.sessionName, this.provider]).slice(0, 200)
      return failure(`herdr-failed：${detail}`, output)
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

  private cacheKey(): string { return cliPreflightKey(this.command, [this.sessionName, this.provider]) }
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
