import type { RunResult } from '../types.js'

/** Worker observations are evidence, never instructions or proof of task completion. */
export type RunEvent =
  | { type: 'spawn'; pid: number; startedAt: number }
  | { type: 'output'; stream: 'stdout' | 'stderr'; text: string }
  | { type: 'idle' }
  | { type: 'cancel-requested' }
  | { type: 'exit'; code: number | null; reason: 'exit' | 'wall' | 'idle' | 'cancelled' }

/** Issue #11：host 持有的 in-flight steer 信箱。adapter 在自己 turn 的 safe boundary
 * 主動 take()；take 到即視為 transport-level ack（receipt 記 STEERED）。只給宣告
 * controls.inFlightSteer=true 的 adapter 有意義的通道；其他 adapter 不讀它。 */
export interface SteerMailbox {
  take(): { envelopeId: string; instruction: string } | undefined
}

export interface RunControl {
  signal?: AbortSignal
  onEvent?: (event: RunEvent) => void
  /** Report silence for supervised workers; local operations retain their own timeout. */
  idleAction?: 'report'
  steer?: SteerMailbox
}

export function observeRun(control: RunControl | undefined, event: RunEvent): void {
  try { control?.onEvent?.(event) } catch { /* Observer failure must not kill the worker. */ }
}

/** Stopping a transport is not proof that a provider's background work has stopped. */
export function cancelledRun(output = ''): RunResult {
  return { ok: false, output: output.slice(-2000), costUsd: 0, costUnknown: true,
    failureReason: 'cancel-requested: backend stop requires verification', cancelled: true, recoveryRequired: true }
}
