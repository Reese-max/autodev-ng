import type { RunResult } from '../types.js'

/** Worker observations are evidence, never instructions or proof of task completion. */
export type RunEvent =
  | { type: 'spawn'; pid: number; startedAt: number }
  | { type: 'output'; stream: 'stdout' | 'stderr'; text: string }
  | { type: 'idle' }
  | { type: 'cancel-requested' }
  | { type: 'exit'; code: number | null; reason: 'exit' | 'wall' | 'idle' | 'cancelled' }
  | { type: 'steer-ready'; supported: boolean }

/** Issue #11：宿主→worker 的 in-flight 指示通道。測試 adapter 於安全點 poll；
 * 原生 transport claim 後依 engine acknowledgement 結案。不支援即 fail closed。 */
export interface SteerPort {
  poll(): string | undefined
  /** Native transports reserve once, then confirm the exact engine acknowledgement. */
  claim?(): { id: string; instruction: string; settle(disposition: 'STEERED' | 'NOT_DELIVERED' | 'DELIVERY_UNKNOWN', detail: string): void } | undefined
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
