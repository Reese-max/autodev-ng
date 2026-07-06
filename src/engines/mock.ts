import type { Engine, Job, PreflightResult, RunResult } from '../types.js'

export type MockStep =
  | { ok: true; costUsd?: number; beforeResult?: (job: Job) => void }
  | { ok: false; reason: string; costUsd?: number; costUnknown?: boolean; beforeResult?: (job: Job) => void }
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
    this.calls.push(job)
    const step = this.script.shift() ?? { ok: true as const }
    if ('throw' in step) throw new Error(step.throw)
    // 測試劇本注入鉤子（M4 Task 6）：worktree 場景需要在 job.projectPath（此時是 worktree cwd）
    // 內產生真 git commit 才能驗證 mergeBack ff-only 全鏈路，最小改動加這個鉤子而非新增機制。
    step.beforeResult?.(job)
    if (step.ok) {
      return { ok: true, output: 'mock done', costUsd: step.costUsd ?? 0.01, commitHash: 'mock0000' }
    }
    return {
      ok: false, output: 'mock fail', costUsd: step.costUsd ?? 0.01,
      failureReason: step.reason, costUnknown: step.costUnknown
    }
  }
}
