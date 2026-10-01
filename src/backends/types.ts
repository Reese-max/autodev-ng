import { z } from 'zod'
import type { RunControl } from '../engines/run-control.js'

/**
 * 可插拔長時程執行後端契約（issue #55）。
 *
 * `ExecutionBackend` 把「單一目標如何長時間、可恢復、可驗證地執行到完成」抽象成
 * 五個動詞；autodev-ng 的 scheduler/github intake 只面對此介面，未來可接
 * LongHorizon 以外的 backend（Claude Code / Codex / OpenCode harness …）。
 * 介面刻意不暴露 conversation 歷史：每輪 executor 只拿到後端重組的最小 context。
 */

export const RUN_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/

/** run 層狀態；attempt 層結果（VERIFIED_PROGRESS / REJECTED_ATTEMPT / …）見 AttemptSchema。 */
export const RUN_PHASES = ['running', 'interrupted', 'cancelled', 'needs-approval', 'blocked', 'complete', 'failed'] as const
export type RunPhase = (typeof RUN_PHASES)[number]

/** attempt 層結果：verified 才會推進 verifiedSteps；rejected/blocked 只能成為證據。 */
export const ATTEMPT_OUTCOMES = ['verified', 'rejected', 'blocked', 'needs-approval'] as const
export type AttemptOutcome = (typeof ATTEMPT_OUTCOMES)[number]

export const BackendGoalSchema = z.object({
  objective: z.string().min(1),
  verifyCommand: z.string().optional(),
  issue: z.object({ repo: z.string().min(1), number: z.number().int().positive() }).strict().optional(),
}).strict()
export type BackendGoal = z.infer<typeof BackendGoalSchema>

/** Manager 每輪產出的單一有界步驟；risk:'high' 或命中高風險關鍵字會進 approval gate。 */
export const BoundedStepSchema = z.object({
  text: z.string().min(1).max(8000),
  risk: z.enum(['low', 'high']).optional(),
  verifyCommand: z.string().optional(),
}).strict()
export type BoundedStep = z.infer<typeof BoundedStepSchema>

export interface BackendContext {
  /** Executor 實際操作的 repo 工作目錄（pilot：host checkout，CLI-only）。 */
  cwd: string
  /** 呼叫方指定 run id；未設由後端產生。須符合 RUN_ID_RE。 */
  runId?: string
  /** 覆寫設定檔的輪數上限。 */
  maxRounds?: number
  control?: RunControl
}

export const InterruptSchema = z.object({
  kind: z.enum(['pause', 'abort', 'approve']),
  by: z.string().max(120).optional(),
  note: z.string().max(4000).optional(),
  /** 寫入 interrupt.json 時的時間戳（後端附加的中繼資料）。 */
  at: z.string().optional(),
}).strict()
export type InterruptInstruction = z.infer<typeof InterruptSchema>

/** 三個角色各自回報的資源用量（token／成本），全部併入 run metrics 供 A/B 比較。 */
export const UsageSchema = z.object({
  tokensIn: z.number().int().nonnegative().optional(),
  tokensOut: z.number().int().nonnegative().optional(),
  costUsd: z.number().nonnegative().optional(),
  costUnknown: z.boolean().optional(),
}).strict()
export type Usage = z.infer<typeof UsageSchema>

export const VerifiedStepSchema = z.object({
  round: z.number().int().positive(),
  step: z.string(),
  at: z.string(),
  gitSha: z.string().optional(),
  verifyStatus: z.enum(['pass', 'fail', 'skip', 'blocked']).optional(),
  detail: z.string().max(2000),
}).strict()
export type VerifiedStep = z.infer<typeof VerifiedStepSchema>

export const FailureRecordSchema = z.object({
  count: z.number().int().positive(),
  detail: z.string().max(2000),
  lastAt: z.string(),
  /** 同一指紋最多升級一次；再次撞頂即 blocked，不會無限 herdr/council 燒錢。 */
  escalated: z.boolean(),
}).strict()
export type FailureRecord = z.infer<typeof FailureRecordSchema>

export const PendingApprovalSchema = z.object({
  step: BoundedStepSchema,
  reason: z.string().max(2000),
  requestedAt: z.string(),
  approved: z.object({ by: z.string(), note: z.string().optional(), at: z.string() }).strict().optional(),
}).strict()
export type PendingApproval = z.infer<typeof PendingApprovalSchema>

/** Manager 的輸入永遠是後端重組的最小 context——原始目標＋已驗證狀態＋失敗證據＋升級指導。 */
export interface ManagerBundle {
  goal: BackendGoal
  round: number
  verifiedSteps: VerifiedStep[]
  failures: (FailureRecord & { fingerprint: string })[]
  directives: string[]
}

export type ManagerPlan =
  | { kind: 'step'; step: BoundedStep }
  | { kind: 'done' }
  | { kind: 'blocked'; reason: string }

export interface ManagerResult { plan: ManagerPlan; usage?: Usage }
export type ManagerFn = (bundle: ManagerBundle) => Promise<ManagerResult>

export interface ExecutorRequest {
  runId: string
  round: number
  step: BoundedStep
  /** 後端逐輪新組的有界 prompt；executor 不得收到 conversation 歷史。 */
  prompt: string
  cwd: string
  control?: RunControl
}
export interface ExecutorOutput {
  ok: boolean
  output: string
  costUsd: number
  costUnknown?: boolean
  tokensIn?: number
  tokensOut?: number
  tokensCached?: number
  commitHash?: string
  failureReason?: string
  cancelled?: boolean
}
export type ExecutorFn = (req: ExecutorRequest) => Promise<ExecutorOutput>

export interface AuditRequest {
  runId: string
  goal: BackendGoal
  round: number
  step: BoundedStep
  /** Executor 自報結果——是證據不是完工證明；auditor 不得因 ok=true 直接採信。 */
  exec: ExecutorOutput
  cwd: string
  /** true＝稽核 manager 的 done 宣告（無 executor 輸出可參考）。 */
  claim: boolean
}
export interface AuditVerdict {
  outcome: 'verified' | 'rejected' | 'blocked'
  detail: string
  gitSha?: string
  verifyStatus?: 'pass' | 'fail' | 'skip' | 'blocked'
  /** goal 層級 verifyCommand 通過 → 整個 run 可判定 complete。 */
  goalAchieved?: boolean
  usage?: Usage
}
export type AuditorFn = (req: AuditRequest) => Promise<AuditVerdict>

/** 失敗指紋撞頂時的外部升級（herdr/council/人）；非每輪固定成本。 */
export interface EscalationRequest {
  runId: string
  goal: BackendGoal
  fingerprint: string
  count: number
  lastDetail: string
  failures: (FailureRecord & { fingerprint: string })[]
  cwd: string
}
export type EscalationResult =
  | { action: 'resume'; directive: string; usage?: Usage }
  | { action: 'blocked'; reason: string; usage?: Usage }
export type EscalateFn = (req: EscalationRequest) => Promise<EscalationResult>

export const RunMetricsSchema = z.object({
  startedAt: z.string(),
  endedAt: z.string().optional(),
  /** 進入 parked 狀態（needs-approval/interrupted/blocked…）的時間戳，用來累計 blockedMs。 */
  parkedAt: z.string().optional(),
  activeMs: z.number().nonnegative().default(0),
  blockedMs: z.number().nonnegative().default(0),
  resumes: z.number().int().nonnegative().default(0),
  recoverySuccesses: z.number().int().nonnegative().default(0),
  verifiedSteps: z.number().int().nonnegative().default(0),
  rejectedAttempts: z.number().int().nonnegative().default(0),
  escalations: z.number().int().nonnegative().default(0),
  interventions: z.number().int().nonnegative().default(0),
  /** executor/manager 自報完成但 auditor 拒收的次數（false-completion 量測）。 */
  falseCompletionClaims: z.number().int().nonnegative().default(0),
  tokensIn: z.number().int().nonnegative().default(0),
  tokensOut: z.number().int().nonnegative().default(0),
  costUsd: z.number().nonnegative().default(0),
  costUnknown: z.boolean().default(false),
}).strict()
export type RunMetrics = z.infer<typeof RunMetricsSchema>

export const RunStateSchema = z.object({
  version: z.literal(1),
  backend: z.string().min(1),
  runId: z.string().regex(RUN_ID_RE),
  goal: BackendGoalSchema,
  cwd: z.string().min(1),
  phase: z.enum(RUN_PHASES),
  phaseDetail: z.string().max(4000),
  rounds: z.number().int().nonnegative(),
  maxRounds: z.number().int().positive(),
  verifiedSteps: z.array(VerifiedStepSchema).max(1000),
  /** 失敗指紋 → 累計次數與最近細節；同一指紋不得無限重試。 */
  failures: z.record(z.string(), FailureRecordSchema),
  /** 連續相同指紋計數（撞頂才升級/阻斷；verified 或換指紋會重置）。 */
  consecutive: z.object({ fingerprint: z.string(), count: z.number().int().positive() }).strict().optional(),
  /** 升級返回的指導，逐輪餵給 manager/executor context。 */
  directives: z.array(z.string()).max(50),
  pendingApproval: PendingApprovalSchema.optional(),
  baseHead: z.string().optional(),
  lastHead: z.string().optional(),
  /** resume 後第一個 verified attempt 落地時轉 recoverySuccesses。 */
  awaitingRecoveryProof: z.boolean().optional(),
  metrics: RunMetricsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
}).strict()
export type RunState = z.infer<typeof RunStateSchema>

export const AttemptSchema = z.object({
  at: z.string(),
  round: z.number().int().positive(),
  step: z.string().max(8000),
  outcome: z.enum(ATTEMPT_OUTCOMES),
  detail: z.string().max(4000),
  fingerprint: z.string().optional(),
  gitSha: z.string().optional(),
  verifyStatus: z.enum(['pass', 'fail', 'skip', 'blocked']).optional(),
  executorOk: z.boolean().optional(),
  claim: z.boolean().optional(),
  costUsd: z.number().optional(),
  tokensIn: z.number().optional(),
  tokensOut: z.number().optional(),
}).strict()
export type Attempt = z.infer<typeof AttemptSchema>

export const CheckpointSchema = z.object({
  version: z.literal(1),
  runId: z.string().regex(RUN_ID_RE),
  seq: z.number().int().positive(),
  round: z.number().int().positive(),
  at: z.string(),
  step: z.string().max(8000),
  gitSha: z.string().optional(),
  commitHash: z.string().optional(),
  verifyStatus: z.enum(['pass', 'fail', 'skip', 'blocked']).optional(),
  verifyDetail: z.string().max(2000),
}).strict()
export type Checkpoint = z.infer<typeof CheckpointSchema>

export interface RunStatusSnapshot {
  runId: string
  backend: string
  phase: RunPhase
  detail: string
  rounds: number
  maxRounds: number
  verifiedSteps: number
  rejectedAttempts: number
  pendingApproval?: { step: string; reason: string; approved: boolean }
  /** drive.lock 持有者的 liveness（status 用）；無驅動時 false。 */
  driverAlive: boolean
  updatedAt: string
}

export interface RunEvidence {
  state: RunState
  attempts: Attempt[]
  checkpoints: Checkpoint[]
}

export interface RunHandle {
  runId: string
  /** 收斂到 terminal／parked 相位即 resolve；不 reject（內部錯誤落成 phase:'failed'）。 */
  done: Promise<RunStatusSnapshot>
}

/** 可插拔長時程執行後端。第一個 adapter：LongHorizonBackend（Manager→Executor→Auditor）。 */
export interface ExecutionBackend {
  readonly id: string
  start(goal: BackendGoal, context: BackendContext): Promise<RunHandle>
  resume(runId: string): Promise<RunHandle>
  status(runId: string): Promise<RunStatusSnapshot>
  interrupt(runId: string, instruction: InterruptInstruction): Promise<RunStatusSnapshot>
  collectEvidence(runId: string): Promise<RunEvidence>
}
