import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { cancelledRun } from './run-control.js'

// beforeResult 回傳字串時視為 baseCommitHash（M4 Task 6 修復輪 MEDIUM 2）：測試在鉤子內於
// engine「弄髒」worktree 之前先 rev-parse HEAD 拿到 base，回傳後由 run() 塞進 RunResult，
// 供 verifier 的 rollback 鏈路（tryRollback 依賴 res.baseCommitHash）有真值可用；不回傳
// （void）維持既有行為不變。
export type MockStep =
  | { ok: true; costUsd?: number; beforeResult?: (job: Job) => string | void; steerWaitMs?: number }
  | { ok: false; reason: string; costUsd?: number; costUnknown?: boolean; output?: string; beforeResult?: (job: Job) => string | void; steerWaitMs?: number }
  | { throw: string }

export class MockEngine implements Engine {
  readonly id = 'mock'
  readonly calls: Job[] = []
  /** Issue #11：經 control.steer port 實際取走的 in-flight 指示（供測試斷言真送達）。 */
  readonly steeredInstructions: string[] = []
  private readonly script: MockStep[]
  private readonly preflightResult: PreflightResult

  constructor(script: MockStep[] = [], preflightResult?: PreflightResult) {
    this.script = [...script]
    this.preflightResult = preflightResult ?? { ok: true, detail: 'mock always ready' }
  }

  async preflight(): Promise<PreflightResult> {
    return this.preflightResult
  }

  /** 取走目前所有 pending STEER；steerWaitMs>0 時於安全點（本 run 內）有界等待新指示。 */
  private async collectSteering(job: Job, waitMs: number): Promise<void> {
    const port = job.control?.steer
    if (!port) return
    const deadline = Date.now() + Math.max(0, waitMs)
    for (;;) {
      const instruction = port.poll()
      if (instruction !== undefined) { this.steeredInstructions.push(instruction); continue }
      if (Date.now() >= deadline) return
      await new Promise(resolve => setTimeout(resolve, 5))
    }
  }

  async run(job: Job): Promise<RunResult> {
    if (job.control?.signal?.aborted) return cancelledRun()
    this.calls.push(job)
    const step = this.script.shift() ?? { ok: true as const }
    if ('throw' in step) throw new Error(step.throw)
    await this.collectSteering(job, 'steerWaitMs' in step ? (step.steerWaitMs ?? 0) : 0)
    // 測試劇本注入鉤子（M4 Task 6）：worktree 場景需要在 job.projectPath（此時是 worktree cwd）
    // 內產生真 git commit 才能驗證 mergeBack ff-only 全鏈路，最小改動加這個鉤子而非新增機制。
    const hookReturn = step.beforeResult?.(job)
    const baseCommitHash = typeof hookReturn === 'string' ? hookReturn : undefined
    if (step.ok) {
      return { ok: true, output: 'mock done', costUsd: step.costUsd ?? 0.01, commitHash: 'mock0000', baseCommitHash }
    }
    return {
      ok: false, output: step.output ?? 'mock fail', costUsd: step.costUsd ?? 0.01,
      failureReason: step.reason, costUnknown: step.costUnknown, baseCommitHash
    }
  }
}
