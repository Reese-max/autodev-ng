import type { Engine, Job, PreflightResult, RunResult } from '../types.js'

export type MockStep =
  | { ok: true; costUsd?: number }
  | { ok: false; reason: string; costUsd?: number }
  | { throw: string }

export class MockEngine implements Engine {
  readonly id = 'mock'
  readonly calls: Job[] = []
  private readonly script: MockStep[]

  constructor(script: MockStep[] = []) {
    this.script = [...script]
  }

  async preflight(): Promise<PreflightResult> {
    return { ok: true, detail: 'mock always ready' }
  }

  async run(job: Job): Promise<RunResult> {
    this.calls.push(job)
    const step = this.script.shift() ?? { ok: true as const }
    if ('throw' in step) throw new Error(step.throw)
    if (step.ok) {
      return { ok: true, output: 'mock done', costUsd: step.costUsd ?? 0.01, commitHash: 'mock0000' }
    }
    return { ok: false, output: 'mock fail', costUsd: step.costUsd ?? 0.01, failureReason: step.reason }
  }
}
