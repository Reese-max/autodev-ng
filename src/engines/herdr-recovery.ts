import { captureExecutionReadonly } from './execution-observation.js'
import { inspectHerdrCompletion } from './herdr-inspection.js'
import type { BackendRecovery } from './run-control.js'

/** Diagnostic decisions only: v1 has no trusted server epoch/occupant/stop proof. */
export function herdrRecoveryPlan(input: {
  completion?: 'done' | 'failed'; requestId?: string; phase?: string; lastEvent?: string
  cancelled?: boolean; identityMismatch?: boolean
}): BackendRecovery {
  const plan: BackendRecovery = { state: 'unknown', reason: 'backend-identity-unverified', nextAction: 'manual-recovery',
    backendStopConfirmed: false, redispatchAllowed: false, ...(input.requestId ? { requestId: input.requestId } : {}) }
  if (input.cancelled) return { ...plan, reason: 'cancellation-unverified' }
  if (input.identityMismatch) return { ...plan, reason: 'dispatch-identity-unverified' }
  if (input.completion === 'done') return { ...plan, state: 'validation-required', reason: 'completion-correlated', nextAction: 'verify-existing-result' }
  if (input.completion === 'failed') return { ...plan, reason: 'partial-result-unverified', nextAction: 'preserve-partial-and-review' }
  if (input.phase === 'waiting_input' || input.lastEvent === 'permission_request' || input.lastEvent === 'user_input_request')
    return { ...plan, state: 'waiting-human', reason: 'human-input-observed', nextAction: 'human-response-required' }
  if (input.phase === 'running') return { ...plan, state: 'observing', reason: 'activity-unverified', nextAction: 'observe-same-request' }
  return plan
}

/** Reuse #32 correlation; never dispatch, commit, cancel, unlock or change accounting. */
export function reconcileHerdrExecution(dataDir: string, target: { executionId: string; requestId?: string }) {
  const observation = inspectHerdrCompletion(dataDir, target)
  const captured = captureExecutionReadonly(dataDir, target.executionId)
  const record = captured.ok && captured.sha256 === observation.evidence?.snapshotSha256 ? captured.record : undefined
  const recovery = herdrRecoveryPlan({
    requestId: observation.requestId,
    completion: observation.status === 'correlated-v1-done' ? 'done' : observation.status === 'correlated-v1-failed' ? 'failed' : undefined,
    phase: record?.phase, lastEvent: record?.lastEvent, cancelled: record?.cancelRequested,
    identityMismatch: !record || !['correlated-v1-done', 'correlated-v1-failed', 'missing'].includes(observation.status),
  })
  return { ...observation, recovery }
}
