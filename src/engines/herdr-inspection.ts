import { createHash } from 'node:crypto'
import { lstatSync, opendirSync, type Dir } from 'node:fs'
import { join } from 'node:path'
import {
  captureExecutionReadonly, MAX_TRACKED_EXECUTION_FILES,
  type ReadonlyExecutionCapture,
} from './execution-observation.js'
import {
  captureHerdrExpectedFile, captureHerdrResultFile, herdrResultPath, normalizeRepoPath,
  type HerdrExpectedCapture, type HerdrResultCapture,
} from './herdr-result.js'

type Status = 'untracked' | 'missing' | 'invalid' | 'unsupported' | 'mismatch' | 'conflict'
  | 'changing' | 'unavailable' | 'correlated-v1-done' | 'correlated-v1-failed'
type Reason = 'execution-missing' | 'execution-invalid' | 'execution-conflict' | 'execution-unavailable'
  | 'adapter-mismatch' | 'expected-missing' | 'expected-invalid' | 'expected-unsupported'
  | 'expected-unavailable' | 'expected-conflict' | 'expected-binding-mismatch' | 'request-selector-mismatch'
  | 'store-capacity' | 'selection-changed' | 'result-missing-or-unsupported' | 'result-invalid'
  | 'result-unsupported' | 'result-mismatch' | 'result-unavailable' | 'v1-correlated'

export interface HerdrCompletionObservation {
  schema: 'herdr-completion-observation-v1'
  readonly: true
  dispatched: false
  hostCommitted: false
  trustedTerminal: false
  trustedServerPaneOccupant: 'UNVERIFIED'
  deadlineOrExpiry: 'UNVERIFIED'
  deliveryVerified: false
  status: Status
  reason: Reason
  executionId?: string
  requestId?: string
  taskId?: string
  observationPhase?: string
  evidence?: { snapshotSha256: string; expectedSha256: string; resultSha256?: string; resultBytes?: number }
}

type Execution = Extract<ReadonlyExecutionCapture, { ok: true }>
type Expected = Extract<HerdrExpectedCapture, { ok: true }>
type Selection = { ok: true; filename: string; capture: Expected }
  | { ok: false; status: Status; reason: Reason }

function safeId(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 40) || 'task'
}

/** Mirrors unchanged Herdr.run naming; tests bind these names to the actual dispatch producer.
 * This derives a locator, never a result or a claimed server/pane authority. */
function executionKey(id: string): string {
  return safeId(id) === id ? id : createHash('sha256').update(id).digest('base64url')
}

function selectExpected(dataDir: string, execution: Execution): Selection {
  const root = join(dataDir, 'herdr')
  const prefix = `adng-${safeId(execution.record.taskId)}-`
  const suffix = `-${executionKey(execution.record.executionId)}.expected.json`
  let directory: Dir
  try {
    if (!lstatSync(root).isDirectory()) return { ok: false, status: 'invalid', reason: 'expected-invalid' }
    directory = opendirSync(root)
  } catch (error) {
    return { ok: false, status: (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'missing' : 'unavailable', reason: (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'expected-missing' : 'expected-unavailable' }
  }
  let selected: Extract<Selection, { ok: true }> | undefined
  try {
    // Read each entry through the iterator before enforcing the cap. Never allocate readdir arrays.
    for (let visited = 0; ; visited++) {
      const entry = directory.readSync()
      if (!entry) break
      if (visited >= MAX_TRACKED_EXECUTION_FILES) return { ok: false, status: 'unavailable', reason: 'store-capacity' }
      if (!entry.name.startsWith(prefix) || !entry.name.endsWith(suffix)) continue
      const base = entry.name.slice(prefix.length, -suffix.length)
      if (!/^[a-fA-F0-9]{8}$/.test(base)) continue
      if (!entry.isFile()) return { ok: false, status: 'invalid', reason: 'expected-invalid' }
      if (selected) return { ok: false, status: 'conflict', reason: 'expected-conflict' }
      const capture = captureHerdrExpectedFile(join(root, entry.name))
      if (!capture.ok) return { ok: false, status: capture.kind, reason: capture.kind === 'missing' ? 'expected-missing' : capture.kind === 'unsupported' ? 'expected-unsupported' : capture.kind === 'invalid' ? 'expected-invalid' : 'expected-unavailable' }
      const expected = capture.expected
      const requestId = `adng-${safeId(execution.record.taskId)}-${expected.baseCommit.slice(0, 8)}-${executionKey(execution.record.executionId)}`
      if (entry.name !== `${expected.requestId}.expected.json` || expected.requestId !== requestId
        || expected.executionId !== execution.record.executionId || expected.taskId !== execution.record.taskId
        || normalizeRepoPath(expected.repo) !== normalizeRepoPath(execution.record.projectPath))
        return { ok: false, status: 'mismatch', reason: 'expected-binding-mismatch' }
      selected = { ok: true, filename: entry.name, capture }
    }
    return selected ?? { ok: false, status: 'missing', reason: 'expected-missing' }
  } catch {
    return { ok: false, status: 'unavailable', reason: 'expected-unavailable' }
  } finally {
    try { directory.closeSync() } catch { return { ok: false, status: 'unavailable', reason: 'expected-unavailable' } }
  }
}

/** Host-owned correlation observation only. No constructors, locks, migrations, writes,
 * dispatch, continuation, cancellation, commits, acceptance or delivery are performed. */
export function inspectHerdrCompletion(dataDir: string, target: { executionId: string; requestId?: string }): HerdrCompletionObservation {
  const observation: HerdrCompletionObservation = {
    schema: 'herdr-completion-observation-v1', readonly: true, dispatched: false, hostCommitted: false,
    trustedTerminal: false, trustedServerPaneOccupant: 'UNVERIFIED', deadlineOrExpiry: 'UNVERIFIED',
    deliveryVerified: false, status: 'untracked', reason: 'execution-missing',
  }
  const deny = (status: Status, reason: Reason): HerdrCompletionObservation => ({ ...observation, status, reason })
  const execution = captureExecutionReadonly(dataDir, target.executionId)
  if (!execution.ok) return deny(execution.kind === 'missing' ? 'untracked' : execution.kind, execution.kind === 'missing' ? 'execution-missing' : execution.kind === 'invalid' ? 'execution-invalid' : execution.kind === 'conflict' ? 'execution-conflict' : 'execution-unavailable')
  observation.executionId = execution.record.executionId
  observation.taskId = execution.record.taskId
  observation.observationPhase = execution.record.phase
  if (execution.record.adapter !== 'herdr') return deny('mismatch', 'adapter-mismatch')
  const selected = selectExpected(dataDir, execution)
  if (!selected.ok) return deny(selected.status, selected.reason)
  const requestId = selected.capture.expected.requestId
  observation.requestId = requestId
  if (target.requestId !== undefined && target.requestId !== requestId) return deny('mismatch', 'request-selector-mismatch')
  let result: HerdrResultCapture
  try {
    result = captureHerdrResultFile(herdrResultPath(join(dataDir, 'herdr'), requestId), selected.capture.expected, true)
  } catch { return deny('unavailable', 'result-unavailable') }
  observation.evidence = { snapshotSha256: execution.sha256, expectedSha256: selected.capture.sha256,
    ...(result.evidence ? { resultSha256: result.evidence.sha256, resultBytes: result.evidence.bytes } : {}) }
  const recheckedExecution = captureExecutionReadonly(dataDir, target.executionId)
  if (!recheckedExecution.ok || recheckedExecution.location !== execution.location || recheckedExecution.sha256 !== execution.sha256)
    return deny('changing', 'selection-changed')
  const recheckedExpected = selectExpected(dataDir, recheckedExecution)
  if (!recheckedExpected.ok || recheckedExpected.filename !== selected.filename || recheckedExpected.capture.sha256 !== selected.capture.sha256)
    return deny('changing', 'selection-changed')
  if (!result.check.ok) return deny(result.check.kind, result.check.kind === 'missing' ? 'result-missing-or-unsupported' : result.check.kind === 'invalid' ? 'result-invalid' : result.check.kind === 'unsupported' ? 'result-unsupported' : 'result-mismatch')
  return deny(result.check.result.status === 'done' ? 'correlated-v1-done' : 'correlated-v1-failed', 'v1-correlated')
}
