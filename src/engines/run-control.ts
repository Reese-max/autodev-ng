import type { RunResult } from '../types.js'

/** Worker observations are evidence, never instructions or proof of task completion. */
export type RunEvent =
  | { type: 'spawn'; pid: number; startedAt: number }
  | { type: 'output'; stream: 'stdout' | 'stderr'; text: string }
  | { type: 'idle' }
  | { type: 'cancel-requested' }
  | { type: 'exit'; code: number | null; reason: 'exit' | 'wall' | 'idle' | 'cancelled' }

/** Issue #11：宿主→worker 的 in-flight 指示通道。adapter 只在自己認定的安全點呼叫 poll()；
 *  取到指示即算送達（STEERED）。未接線的 adapter 看不到此 port——不支援即 fail closed。 */
export interface SteerPort {
  poll(): string | undefined
}

export interface RunControl {
  signal?: AbortSignal
  onEvent?: (event: RunEvent) => void
  /** Report silence for supervised workers; local operations retain their own timeout. */
  idleAction?: 'report'
  steer?: SteerPort
}

export function observeRun(control: RunControl | undefined, event: RunEvent): void {
  try { control?.onEvent?.(event) } catch { /* Observer failure must not kill the worker. */ }
}

/** Stopping a transport is not proof that a provider's background work has stopped. */
export function cancelledRun(output = ''): RunResult {
  return { ok: false, output: output.slice(-2000), costUsd: 0, costUnknown: true,
    failureReason: 'cancel-requested: backend stop requires verification', cancelled: true, recoveryRequired: true }
}
