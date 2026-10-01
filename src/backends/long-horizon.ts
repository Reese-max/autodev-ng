/**
 * LongHorizonBackend — issue #55 的第一個 ExecutionBackend adapter。
 *
 * 迴圈拓撲（Plan → Act → Verify → Checkpoint/Recover → Repeat）：
 *   Manager   每輪用「原始目標＋已驗證進度＋失敗證據＋升級指導」重組的最小 context
 *             決定下一個 bounded step；不繼承任何 conversation 歷史。
 *   Executor  對單一有界步驟跑一次（預設走既有 Engine matrix）。
 *   Auditor   獨立機械驗收（verifyCommand + git SHA）；executor 的 ok/done 自報
 *             永遠只是證據，不推進 verifiedSteps。
 *
 * 持久化（<dataDir>/runs/<runId>/，實作在 store.ts）：goal.json、state.json（zod 驗證、
 * atomic 寫）、attempts.jsonl、checkpoints/<seq>.json、evidence/<round>-<outcome>.json、
 * metrics.json、interrupt.json（操作員 pause/abort 哨兵）、drive.lock（單一驅動鎖）。
 * process 中斷後 `resume` 只依賴落盤狀態重建，不需要原 conversation。
 *
 * 角色 adapter（roles.ts）：manager/executor/auditor/escalation 各自獨立可換。
 * 清單與量測（metrics.ts）：listRuns / summarizeRuns。
 */
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { llmFromConfig } from '../autopilot/llm.js'
import { detailSignature } from '../engines/signature-breaker.js'
import { writeJsonAtomic } from '../guardian/incident.js'
import { acquireLock, checkLockOwner, releaseLock } from '../lock.js'
import { quiet } from '../events.js'
import type { Config, EngineResolver } from '../types.js'
import {
  appendAttempt,
  initRunDir,
  readAttempts,
  readCheckpoints,
  readRunState,
  runDir,
  saveState,
  takeInterrupt,
  writeAttemptEvidence,
  writeCheckpoint,
  writeInterrupt,
} from './store.js'
import {
  defaultGitHead,
  deterministicManager,
  engineEscalation,
  engineExecutor,
  llmManager,
  mechanicalAuditor,
} from './roles.js'
import { driverAlive, listRuns, snapshotOf, summarizeRuns } from './metrics.js'
import {
  BackendGoalSchema,
  InterruptSchema,
  RunStateSchema,
  type Attempt,
  type AuditorFn,
  type AuditVerdict,
  type BackendContext,
  type BackendGoal,
  type BoundedStep,
  type EscalateFn,
  type EscalationResult,
  type ExecutionBackend,
  type ExecutorFn,
  type ExecutorOutput,
  type InterruptInstruction,
  type ManagerBundle,
  type ManagerFn,
  type ManagerResult,
  type RunEvidence,
  type RunHandle,
  type RunMetrics,
  type RunPhase,
  type RunState,
  type RunStatusSnapshot,
  type Usage,
} from './types.js'

export const LONG_HORIZON_ID = 'long-horizon'

// 對外 API surface：tests 與 cli 一律從 long-horizon.ts 匯入，子檔是實作細節。
export {
  runDir, runsRoot, readRunState, readAttempts, readCheckpoints,
} from './store.js'
export {
  deterministicManager, llmManager, engineExecutor, mechanicalAuditor, engineEscalation, defaultGitHead,
} from './roles.js'
export { listRuns, summarizeRuns, snapshotOf, driverAlive } from './metrics.js'
export type { BackendMetricsSummary } from './metrics.js'

const TERMINAL: ReadonlySet<RunPhase> = new Set(['complete', 'cancelled', 'failed'])

/** 高風險步驟關鍵字（issue #55 §8：部署、破壞性遷移、secrets/權限、major upgrade、大範圍 refactor）。 */
const HIGH_RISK_STEP_RE = /\b(deploy|deployment|production|prod release|migrat(?:e|ion)|secrets?|credentials?|permissions?|sudo|rm -rf|drop table|major upgrade|refactor)\b/i

export function classifyStepRisk(step: Pick<BoundedStep, 'text' | 'risk'>): 'low' | 'high' {
  if (step.risk === 'high') return 'high'
  return HIGH_RISK_STEP_RE.test(step.text) ? 'high' : 'low'
}

/** 失敗指紋：<類別>:<detail 首行 80 字（沿用 signature-breaker 的 detailSignature 慣例）>。 */
export function failureFingerprint(kind: 'exec' | 'verify' | 'infra' | 'claim' | 'manager', detail: string): string {
  return `${kind}:${detailSignature(detail) || 'empty-detail'}`
}

export interface LongHorizonDeps {
  dataDir: string
  executor: ExecutorFn
  manager?: ManagerFn
  auditor?: AuditorFn
  escalate?: EscalateFn
  /** 外部停止哨兵（預設檢查 cfg.stopFile）；回 true → 下一輪邊界 park 成 interrupted。 */
  stopped?: () => boolean
  gitHead?: (cwd: string) => string | undefined
  events?: { append(type: string, data: Record<string, unknown>): void }
  now?: () => number
  maxRounds?: number
  maxSameFingerprint?: number
}

export class LongHorizonBackend implements ExecutionBackend {
  readonly id = LONG_HORIZON_ID
  private readonly deps: Required<Pick<LongHorizonDeps, 'dataDir' | 'executor' | 'manager' | 'auditor' | 'stopped' | 'gitHead' | 'now'>> & Pick<LongHorizonDeps, 'escalate' | 'events'>
  private readonly maxRounds: number
  private readonly maxSameFingerprint: number

  constructor(deps: LongHorizonDeps) {
    const gitHead = deps.gitHead ?? defaultGitHead
    this.deps = {
      dataDir: deps.dataDir,
      executor: deps.executor,
      manager: deps.manager ?? deterministicManager(),
      auditor: deps.auditor ?? mechanicalAuditor({ gitHead }),
      stopped: deps.stopped ?? (() => false),
      gitHead,
      now: deps.now ?? (() => Date.now()),
      escalate: deps.escalate,
      events: deps.events,
    }
    this.maxRounds = deps.maxRounds ?? 10
    this.maxSameFingerprint = deps.maxSameFingerprint ?? 3
  }

  private dir(runId: string): string {
    return runDir(this.deps.dataDir, runId)
  }

  private emit(type: string, data: Record<string, unknown>): void {
    quiet(() => this.deps.events?.append(`run.${type}`, data))
  }

  async start(goal: BackendGoal, context: BackendContext): Promise<RunHandle> {
    const parsed = BackendGoalSchema.parse(goal)
    const runId = context.runId ?? `run-${randomUUID()}`
    const dir = initRunDir(this.deps.dataDir, runId)
    const at = new Date(this.deps.now()).toISOString()
    const baseHead = this.deps.gitHead(context.cwd)
    const state = RunStateSchema.parse({
      version: 1, backend: this.id, runId, goal: parsed, cwd: context.cwd,
      phase: 'running', phaseDetail: '', rounds: 0,
      maxRounds: context.maxRounds ?? this.maxRounds,
      verifiedSteps: [], failures: {}, directives: [],
      metrics: { startedAt: at },
      ...(baseHead ? { baseHead, lastHead: baseHead } : {}),
      createdAt: at, updatedAt: at,
    })
    writeJsonAtomic(join(dir, 'goal.json'), parsed)
    saveState(dir, state, this.deps.now())
    this.emit('started', { runId, objective: parsed.objective.slice(0, 200), issue: parsed.issue })
    const done = this.drive(runId, { resumed: false, control: context.control })
    return { runId, done }
  }

  async resume(runId: string): Promise<RunHandle> {
    const state = readRunState(this.deps.dataDir, runId)
    if (TERMINAL.has(state.phase)) throw new Error(`run ${runId} 已終結（${state.phase}），不可 resume`)
    const done = this.drive(runId, { resumed: true })
    return { runId, done }
  }

  async status(runId: string): Promise<RunStatusSnapshot> {
    const dir = this.dir(runId)
    return snapshotOf(readRunState(this.deps.dataDir, runId), driverAlive(dir))
  }

  async interrupt(runId: string, instruction: InterruptInstruction): Promise<RunStatusSnapshot> {
    const instr = InterruptSchema.parse(instruction)
    const dir = this.dir(runId)
    const state = readRunState(this.deps.dataDir, runId)
    const at = new Date(this.deps.now()).toISOString()
    if (instr.kind === 'approve') {
      if (state.phase !== 'needs-approval' || !state.pendingApproval || state.pendingApproval.approved) {
        throw new Error(`run ${runId} 沒有待核可步驟（phase=${state.phase}）`)
      }
      state.pendingApproval.approved = { by: instr.by ?? 'operator', ...(instr.note ? { note: instr.note } : {}), at }
      state.metrics.interventions++
      saveState(dir, state, this.deps.now())
      this.emit('approved', { runId, step: state.pendingApproval.step.text.slice(0, 200), by: instr.by ?? 'operator' })
      return snapshotOf(state, driverAlive(dir))
    }
    // pause / abort：鎖存在且主人非 dead → 可能有 live driver → 只落 interrupt.json，
    // 由迴圈在輪邊界套用（含計 interventions）；否則直接改狀態，不殘留哨兵檔
    // （殘留會在下一次 resume 被 takeInterrupt 誤食，把 resume 又停回 interrupted）。
    if (existsSync(join(dir, 'drive.lock')) && checkLockOwner(join(dir, 'drive.lock')) !== 'dead') {
      writeInterrupt(dir, instr, at)
      return snapshotOf(state, true)
    }
    if (!TERMINAL.has(state.phase)) {
      state.metrics.interventions++
      state.phase = instr.kind === 'abort' ? 'cancelled' : 'interrupted'
      state.phaseDetail = (instr.note ?? (instr.kind === 'abort' ? 'operator abort' : 'operator pause')).slice(0, 4000)
      if (instr.kind === 'abort') {
        state.metrics.endedAt = at
        state.metrics.parkedAt = undefined
      } else {
        state.metrics.parkedAt = at
      }
      saveState(dir, state, this.deps.now())
      this.emit(instr.kind === 'abort' ? 'aborted' : 'interrupted', { runId, by: instr.by })
    }
    return snapshotOf(readRunState(this.deps.dataDir, runId), driverAlive(dir))
  }

  async collectEvidence(runId: string): Promise<RunEvidence> {
    const dir = this.dir(runId)
    return { state: readRunState(this.deps.dataDir, runId), attempts: readAttempts(dir), checkpoints: readCheckpoints(dir) }
  }

  private bundle(state: RunState): ManagerBundle {
    return {
      goal: state.goal,
      round: state.rounds + 1,
      verifiedSteps: state.verifiedSteps,
      failures: Object.entries(state.failures).map(([fingerprint, f]) => ({ fingerprint, ...f })),
      directives: state.directives,
    }
  }

  private prompt(state: RunState, step: BoundedStep): string {
    const failures = Object.entries(state.failures)
    return [
      '# 原始目標',
      state.goal.objective,
      '',
      '# 已驗證進度（Auditor 機械驗收通過才算數）',
      ...(state.verifiedSteps.length
        ? state.verifiedSteps.map(s => `- round ${s.round}: ${s.step}（sha=${s.gitSha ?? 'n/a'} verify=${s.verifyStatus ?? 'n/a'}）`)
        : ['（無）']),
      '',
      '# 失敗證據（相同根因不得原樣重試）',
      ...(failures.length ? failures.map(([fp, f]) => `- ${fp} ×${f.count}：${f.detail}`) : ['（無）']),
      '',
      '# 升級指導',
      ...(state.directives.length ? state.directives.map(d => `- ${d}`) : ['（無）']),
      '',
      '# 本輪有界步驟（僅執行此步，勿擴大範圍；完成後由獨立 Auditor 驗收）',
      step.text,
    ].join('\n')
  }

  private applyUsage(metrics: RunMetrics, usage?: Usage): void {
    if (!usage) return
    metrics.tokensIn += usage.tokensIn ?? 0
    metrics.tokensOut += usage.tokensOut ?? 0
    metrics.costUsd += usage.costUsd ?? 0
    if (usage.costUnknown) metrics.costUnknown = true
  }

  private async drive(runId: string, opts: { resumed: boolean; control?: BackendContext['control'] }): Promise<RunStatusSnapshot> {
    const dir = this.dir(runId)
    const lockDir = join(dir, 'drive.lock')
    let acquired = false
    try { acquired = acquireLock(lockDir) } catch { acquired = false }
    if (!acquired) {
      return snapshotOf(readRunState(this.deps.dataDir, runId), driverAlive(dir))
    }
    try {
      const state = readRunState(this.deps.dataDir, runId)
      const now = () => this.deps.now()
      const iso = () => new Date(now()).toISOString()
      // parked 期間歸入 blockedMs（等待人工/外部，不算主動執行時間）。
      if (state.metrics.parkedAt) {
        const parked = Date.parse(state.metrics.parkedAt)
        if (Number.isFinite(parked)) state.metrics.blockedMs += Math.max(0, now() - parked)
        state.metrics.parkedAt = undefined
      }
      state.metrics.endedAt = undefined
      if (opts.resumed) {
        state.metrics.resumes++
        state.awaitingRecoveryProof = true
        this.emit('resumed', { runId, resumes: state.metrics.resumes })
      }
      state.phase = 'running'
      saveState(dir, state, now())

      const park = (phase: RunPhase, detail: string): RunStatusSnapshot => {
        state.phase = phase
        state.phaseDetail = detail.slice(0, 4000)
        // parkedAt 只給「可恢復的暫停」計 blockedMs；terminal 相位記 endedAt，
        // 否則 metrics.json 的 parkedMs／彙總 wallClockMs 會對終結 run 無限膨脹。
        if (TERMINAL.has(phase)) {
          state.metrics.endedAt = iso()
          state.metrics.parkedAt = undefined
        } else {
          state.metrics.parkedAt = iso()
        }
        saveState(dir, state, now())
        this.emit('phase', { runId, phase, detail: state.phaseDetail.slice(0, 300) })
        return snapshotOf(state, false)
      }

      for (;;) {
        // 1. 操作員中斷哨兵（pause/abort/approve-file）。
        const intr = takeInterrupt(dir)
        if (intr) {
          if (intr.kind === 'approve' && state.pendingApproval && !state.pendingApproval.approved) {
            state.pendingApproval.approved = { by: intr.by ?? 'operator', ...(intr.note ? { note: intr.note } : {}), at: iso() }
            state.metrics.interventions++
            saveState(dir, state, now())
            continue
          }
          if (intr.kind === 'approve') continue
          state.metrics.interventions++
          return park(intr.kind === 'abort' ? 'cancelled' : 'interrupted',
            intr.note ?? (intr.kind === 'abort' ? 'operator abort' : 'operator pause'))
        }
        // 2. 全域停止哨兵 / caller cancellation。
        if (this.deps.stopped() || opts.control?.signal?.aborted) {
          return park('interrupted', 'stop requested')
        }
        // 3. approval gate：有未核可步驟 → park（resume 由 interrupt(approve) 觸發）。
        if (state.pendingApproval && !state.pendingApproval.approved) {
          return park('needs-approval', state.pendingApproval.reason)
        }
        if (state.rounds >= state.maxRounds) {
          return park('blocked', `達到 maxRounds=${state.maxRounds} 上限`)
        }

        // 4. 取本輪 bounded step：已核可的 gated step 直接執行（approval 綁定原步驟，不重問 manager）。
        let step: BoundedStep | undefined
        let claimOnly = false
        let fromApproval = false
        if (state.pendingApproval?.approved) {
          step = state.pendingApproval.step
          state.pendingApproval = undefined
          fromApproval = true
        } else {
          let result: ManagerResult
          try {
            result = await this.deps.manager(this.bundle(state))
          } catch (err) {
            result = { plan: { kind: 'blocked', reason: `manager error: ${String(err).slice(0, 300)}` } }
          }
          this.applyUsage(state.metrics, result.usage)
          if (result.plan.kind === 'blocked') {
            return park('blocked', `manager：${result.plan.reason}`)
          }
          if (result.plan.kind === 'done') {
            claimOnly = true
          } else {
            step = result.plan.step
          }
        }

        // 5. 高風險步驟 → approval gate（issue §8；不因 long-running 繞過）。已核可步驟不重判。
        //    gating 本身不耗輪數——rounds 只在真正執行/稽核時遞增（attempt 記在下一輪號）。
        if (step && !claimOnly && !fromApproval && classifyStepRisk(step) === 'high') {
          state.pendingApproval = {
            step, reason: `高風險步驟需人工核可：${step.text.slice(0, 300)}`, requestedAt: iso(),
          }
          appendAttempt(dir, {
            at: iso(), round: state.rounds + 1, step: step.text, outcome: 'needs-approval',
            detail: state.pendingApproval.reason, gitSha: state.lastHead,
          })
          continue
        }

        state.rounds++
        const round = state.rounds

        // 6. claim 或 step：executor 只在新組的有界 prompt 上跑。
        let exec: ExecutorOutput = { ok: true, output: '', costUsd: 0 }
        if (!claimOnly && step) {
          try {
            exec = await this.deps.executor({
              runId, round, step, prompt: this.prompt(state, step), cwd: state.cwd,
              ...(opts.control ? { control: opts.control } : {}),
            })
          } catch (err) {
            exec = { ok: false, output: '', costUsd: 0, failureReason: `executor error: ${String(err).slice(0, 300)}` }
          }
          this.applyUsage(state.metrics, exec)
        }

        // 7. Auditor 獨立驗收；self-claim 永遠只是證據。
        let audit: AuditVerdict
        try {
          audit = await this.deps.auditor({
            runId, goal: state.goal, round,
            step: step ?? { text: '<completion-claim>' },
            exec, cwd: state.cwd, claim: claimOnly,
          })
        } catch (err) {
          audit = { outcome: 'blocked', detail: `auditor error: ${String(err).slice(0, 300)}` }
        }
        this.applyUsage(state.metrics, audit.usage)
        if (audit.gitSha) state.lastHead = audit.gitSha

        const attempt: Attempt = {
          at: iso(), round, step: step?.text ?? '<completion-claim>',
          outcome: audit.outcome === 'verified' ? 'verified' : audit.outcome,
          detail: audit.detail.slice(0, 4000),
          ...(audit.gitSha ? { gitSha: audit.gitSha } : {}),
          ...(audit.verifyStatus ? { verifyStatus: audit.verifyStatus } : {}),
          executorOk: exec.ok, claim: claimOnly,
          costUsd: exec.costUsd,
          ...(exec.tokensIn !== undefined ? { tokensIn: exec.tokensIn } : {}),
          ...(exec.tokensOut !== undefined ? { tokensOut: exec.tokensOut } : {}),
        }

        if (audit.outcome === 'verified') {
          appendAttempt(dir, { ...attempt, outcome: 'verified' })
          state.verifiedSteps.push({
            round, step: attempt.step, at: attempt.at,
            ...(audit.gitSha ? { gitSha: audit.gitSha } : {}),
            ...(audit.verifyStatus ? { verifyStatus: audit.verifyStatus } : {}),
            detail: audit.detail.slice(0, 2000),
          })
          state.metrics.verifiedSteps++
          state.consecutive = undefined
          writeCheckpoint(dir, {
            version: 1, runId, seq: state.verifiedSteps.length, round, at: attempt.at,
            step: attempt.step, ...(audit.gitSha ? { gitSha: audit.gitSha } : {}),
            ...(exec.commitHash ? { commitHash: exec.commitHash } : {}),
            ...(audit.verifyStatus ? { verifyStatus: audit.verifyStatus } : {}),
            verifyDetail: audit.detail.slice(0, 2000),
          })
          this.emit('checkpoint', { runId, round, gitSha: audit.gitSha, verifyStatus: audit.verifyStatus })
          if (state.awaitingRecoveryProof) {
            state.awaitingRecoveryProof = undefined
            state.metrics.recoverySuccesses++
          }
          if (audit.goalAchieved) {
            return park('complete', `目標驗收通過（round ${round}）：${audit.detail.slice(0, 300)}`)
          }
          saveState(dir, state, now())
          continue
        }

        // rejected / blocked → 證據化，不推進。
        state.metrics.rejectedAttempts++
        if (exec.ok || claimOnly) state.metrics.falseCompletionClaims++
        const kind = claimOnly ? 'claim'
          : !exec.ok ? 'exec'
          : audit.outcome === 'blocked' ? 'infra'
          : 'verify'
        const fp = failureFingerprint(kind, audit.detail)
        attempt.fingerprint = fp
        appendAttempt(dir, attempt)
        writeAttemptEvidence(dir, attempt, exec.output, audit.detail)
        const prev = state.failures[fp]
        state.failures[fp] = {
          count: (prev?.count ?? 0) + 1, detail: audit.detail.slice(0, 2000), lastAt: attempt.at,
          escalated: prev?.escalated ?? false,
        }
        state.consecutive = state.consecutive?.fingerprint === fp
          ? { fingerprint: fp, count: state.consecutive.count + 1 }
          : { fingerprint: fp, count: 1 }
        this.emit('attempt', { runId, round, outcome: attempt.outcome, fingerprint: fp })

        // 8. 同一指紋連續撞頂 → 升級（每指紋一次）或 blocked；不無限重試。
        if (state.consecutive.count >= this.maxSameFingerprint) {
          const record = state.failures[fp]!
          if (this.deps.escalate && !record.escalated) {
            record.escalated = true
            state.metrics.escalations++
            this.emit('escalated', { runId, fingerprint: fp, count: state.consecutive.count })
            let result: EscalationResult
            try {
              result = await this.deps.escalate({
                runId, goal: state.goal, fingerprint: fp, count: state.consecutive.count,
                lastDetail: audit.detail.slice(0, 2000), cwd: state.cwd,
                failures: Object.entries(state.failures).map(([fingerprint, f]) => ({ fingerprint, ...f })),
              })
            } catch (err) {
              result = { action: 'blocked', reason: `escalation error: ${String(err).slice(0, 300)}` }
            }
            this.applyUsage(state.metrics, result.usage)
            if (result.action === 'resume') {
              state.directives.push(result.directive)
              state.consecutive = undefined
              saveState(dir, state, now())
              continue
            }
            return park('blocked', `升級仍無法突破指紋 ${fp}：${result.reason}`)
          }
          return park('blocked', `失敗指紋 ${fp} 連續 ${state.consecutive.count} 次（上限 ${this.maxSameFingerprint}）`)
        }
        saveState(dir, state, now())
      }
    } catch (err) {
      try {
        const state = readRunState(this.deps.dataDir, runId)
        state.phase = 'failed'
        state.phaseDetail = `internal error: ${String(err).slice(0, 500)}`
        state.metrics.endedAt = new Date(this.deps.now()).toISOString()
        saveState(dir, state, this.deps.now())
        return snapshotOf(state, false)
      } catch {
        return {
          runId, backend: this.id, phase: 'failed', detail: `internal error: ${String(err).slice(0, 300)}`,
          rounds: 0, maxRounds: this.maxRounds, verifiedSteps: 0, rejectedAttempts: 0,
          driverAlive: false, updatedAt: new Date(this.deps.now()).toISOString(),
        }
      }
    } finally {
      if (acquired) releaseLock(lockDir)
    }
  }
}

// ---------- config factory ----------

export interface ExecutionBackendOverrides {
  executor?: ExecutorFn
  manager?: ManagerFn
  auditor?: AuditorFn
  escalate?: EscalateFn
  stopped?: () => boolean
  events?: { append(type: string, data: Record<string, unknown>): void }
  now?: () => number
}

/**
 * 由 Config 組出設定的 ExecutionBackend。
 * executionBackend.executorEngine／escalationEngine 引用 engines 白名單內的 tag（懶解析）；
 * managerModel／auditorModel 各自獨立（三角色不綁同一 provider）。
 */
export function makeExecutionBackend(cfg: Config, engines?: EngineResolver, overrides: ExecutionBackendOverrides = {}): ExecutionBackend {
  const ec = cfg.executionBackend
  if (ec && ec.adapter !== LONG_HORIZON_ID) throw new Error(`未知 executionBackend.adapter：${ec.adapter}`)
  const executorTag = ec?.executorEngine ?? cfg.defaultEngine
  const escalationTag = ec?.escalationEngine
  for (const [role, tag] of [['executorEngine', executorTag], ['escalationEngine', escalationTag]] as const) {
    if (tag && !(tag in cfg.engines)) throw new Error(`executionBackend.${role} 引用未知引擎：${tag}`)
  }
  const resolveTag = (tag: string) => () => {
    if (!engines) throw new Error('executionBackend 需要 engines resolver 才能執行步驟')
    return engines.resolve(tag)
  }
  return new LongHorizonBackend({
    dataDir: cfg.dataDir,
    executor: overrides.executor ?? engineExecutor(resolveTag(executorTag)),
    ...(overrides.manager ? { manager: overrides.manager } : ec?.managerModel ? { manager: llmManager(llmFromConfig(cfg, ec.managerModel)) } : {}),
    auditor: overrides.auditor ?? mechanicalAuditor({
      timeoutMs: cfg.verifyTimeoutMs,
      ...(ec?.auditorModel ? { llm: llmFromConfig(cfg, ec.auditorModel) } : {}),
    }),
    ...(overrides.escalate ? { escalate: overrides.escalate } : escalationTag ? { escalate: engineEscalation(resolveTag(escalationTag)) } : {}),
    stopped: overrides.stopped ?? (() => existsSync(cfg.stopFile)),
    ...(overrides.events ? { events: overrides.events } : {}),
    ...(overrides.now ? { now: overrides.now } : {}),
    ...(ec?.maxRounds !== undefined ? { maxRounds: ec.maxRounds } : {}),
    ...(ec?.maxSameFingerprint !== undefined ? { maxSameFingerprint: ec.maxSameFingerprint } : {}),
  })
}
