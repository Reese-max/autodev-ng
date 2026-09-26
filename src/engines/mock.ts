import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { cancelledRun } from './run-control.js'

// beforeResult 回傳字串時視為 baseCommitHash（M4 Task 6 修復輪 MEDIUM 2）：測試在鉤子內於
// engine「弄髒」worktree 之前先 rev-parse HEAD 拿到 base，回傳後由 run() 塞進 RunResult，
// 供 verifier 的 rollback 鏈路（tryRollback 依賴 res.baseCommitHash）有真值可用；不回傳
// （void）維持既有行為不變。
export type MockStep =
  | { ok: true; costUsd?: number; beforeResult?: (job: Job) => string | void }
  | { ok: false; reason: string; costUsd?: number; costUnknown?: boolean; output?: string; beforeResult?: (job: Job) => string | void }
  | { throw: string }

export class MockEngine implements Engine {
  readonly id = 'mock'
  readonly calls: Job[] = []
  private readonly script: MockStep[]
  private readonly preflightResult: PreflightResult

  constructor(script: MockStep[] = [], preflightResult?: PreflightResult) {
    this.script = [...script]
    this.preflightResult = preflightResult ?? { ok: true, detail: 'mock always ready' }
  }

  async preflight(): Promise<PreflightResult> {
    return this.preflightResult
  }

  async run(job: Job): Promise<RunResult> {
    if (job.control?.signal?.aborted) return cancelledRun()
    this.calls.push(job)
    const step = this.script.shift() ?? { ok: true as const }
    if ('throw' in step) throw new Error(step.throw)
    // 測試劇本注入鉤子（M4 Task 6）：worktree 場景需要在 job.projectPath（此時是 worktree cwd）
    // 內產生真 git commit 才能驗證 mergeBack ff-only 全鏈路，最小改動加這個鉤子而非新增機制。
    const hookReturn = step.beforeResult?.(job)
    const baseCommitHash = typeof hookReturn === 'string' ? hookReturn : undefined
    // Issue #11：mock 宣告 controls.inFlightSteer=true——在 turn 的 safe boundary
    // （此處為產生結果前）主動取 host 信箱；take 到即 ack（STEERED）。
    const steered: string[] = []
    const notes: string[] = []
    for (let i = 0; i < 4; i++) {
      const s = job.control?.steer?.take()
      if (!s) break
      steered.push(s.envelopeId)
      notes.push(`[steered:${s.envelopeId.slice(0, 8)}] ${s.instruction}`)
    }
    if (step.ok) {
      return { ok: true, output: ['mock done', ...notes].join(' '), costUsd: step.costUsd ?? 0.01, commitHash: 'mock0000', baseCommitHash, ...(steered.length ? { appliedSteers: steered } : {}) }
    }
    return {
      ok: false, output: [step.output ?? 'mock fail', ...notes].join(' '), costUsd: step.costUsd ?? 0.01,
      failureReason: step.reason, costUnknown: step.costUnknown, baseCommitHash,
      ...(steered.length ? { appliedSteers: steered } : {})
    }
  }
}
