import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { writeJsonAtomic } from '../guardian/incident.js'
import type { Job } from '../types.js'
import { observeRun, type RunControl, type RunEvent } from './run-control.js'

export const OBSERVATION_INTERVAL_MS = 60_000
export const UNKNOWN_SAMPLES_BEFORE_DIAGNOSIS = 5
const SAFE_ID = /^[A-Za-z0-9_-]{1,100}$/
const SnapshotSchema = z.object({
  version: z.literal(1), executionId: z.string().regex(SAFE_ID), taskId: z.string(), adapter: z.string(),
  projectPath: z.string(), hostPid: z.number().int().positive(), hostStartedAt: z.number().finite(),
  startedAt: z.number().finite(), observedAt: z.number().finite(), sequence: z.number().int().nonnegative(),
  phase: z.enum(['running', 'validating', 'waiting_input', 'unknown', 'terminal']),
  worker: z.object({ pid: z.number().int().positive(), startedAt: z.number().finite() }).optional(),
  sessionId: z.string().max(100).optional(), lastOutputAt: z.number().optional(), lastActivityAt: z.number().optional(),
  lastProgressAt: z.number().optional(), lastEvent: z.string().max(80).optional(),
  outputBytes: z.number().nonnegative(), unknownSamples: z.number().int().nonnegative(), degraded: z.boolean(),
  cancelRequested: z.boolean(), exit: z.object({ code: z.number().nullable(), reason: z.enum(['exit', 'wall', 'idle', 'cancelled']) }).optional(),
  outcome: z.enum(['completed', 'failed', 'unconfirmed']).optional(),
})
export type ExecutionSnapshot = z.infer<typeof SnapshotSchema>
export type ExecutionInventory = { records: ExecutionSnapshot[]; errors: string[]; protected: boolean; diagnosisDue: boolean }

export function executionFile(dataDir: string, id: string): string {
  if (!SAFE_ID.test(id)) throw new Error('Invalid execution ID')
  return join(dataDir, 'executions', `${id}.json`)
}

/** No stdout, prompt, commands, credentials or tool arguments are persisted. */
export function readExecutions(dataDir: string, nowMs = Date.now()): ExecutionInventory {
  const records: ExecutionSnapshot[] = [], errors: string[] = []
  try {
    const folder = join(dataDir, 'executions')
    if (!existsSync(folder)) return { records, errors, protected: false, diagnosisDue: false }
    // ponytail: bounded directory scan; add a host-owned index when 10,000 receipts are needed.
    const files = readdirSync(folder).filter(name => name.endsWith('.json') && !name.endsWith('.cancel.json'))
    if (files.length > 10_000) throw new Error('execution inventory exceeds 10000 receipts')
    for (const file of files) {
      try {
        if (statSync(join(folder, file)).size > 16_384) throw new Error('oversized record')
        const record = SnapshotSchema.parse(JSON.parse(readFileSync(join(folder, file), 'utf8')))
        if (file !== `${record.executionId}.json`) throw new Error('identity mismatch')
        records.push(record)
      } catch { errors.push(`invalid execution record: ${file.slice(0, 110)}`) }
    }
  } catch { errors.push('execution inventory unavailable') }
  const active = records.filter(record => record.phase !== 'terminal')
  return { records, errors, protected: active.length > 0 || errors.length > 0,
    diagnosisDue: errors.length > 0 || active.some(record => record.phase === 'unknown' || record.phase === 'waiting_input' || record.degraded || record.unknownSamples >= UNKNOWN_SAMPLES_BEFORE_DIAGNOSIS || nowMs - record.observedAt >= OBSERVATION_INTERVAL_MS * UNKNOWN_SAMPLES_BEFORE_DIAGNOSIS) }
}

export function requestExecutionCancel(dataDir: string, id: string): void {
  const record = readExecutions(dataDir).records.find(item => item.executionId === id)
  if (!record || record.phase === 'terminal') throw new Error('Execution is absent or already terminal')
  writeJsonAtomic(executionFile(dataDir, id).replace(/\.json$/, '.cancel.json'), {
    executionId: id, hostPid: record.hostPid, hostStartedAt: record.hostStartedAt, requestedAt: Date.now(),
  })
}

const PROGRESS_EVENTS = new Set(['item.completed:command_execution', 'item.completed:file_change', 'item.completed:mcp_tool_call', 'tool_result', 'tool_execution_complete', 'step_finish'])
const ACTIVITY_EVENTS = new Set(['thread.started', 'turn.started', 'turn.completed', 'turn.failed', 'item.started', 'item.completed', 'tool_use', 'tool_result', 'tool_execution_start', 'tool_execution_complete', 'step_start', 'step_finish', 'permission_request', 'user_input_request'])

export function createExecutionObservation(args: { dataDir: string; job: Job; adapter: string; supervised?: boolean; intervalMs?: number }) {
  const id = args.job.executionId
  if (!id) throw new Error('Observed execution requires an execution ID')
  const file = executionFile(args.dataDir, id), cancelFile = file.replace(/\.json$/, '.cancel.json')
  const controller = new AbortController(), intervalMs = args.intervalMs ?? OBSERVATION_INTERVAL_MS
  const parent = args.job.control
  const state: ExecutionSnapshot = {
    version: 1, executionId: id, taskId: args.job.task.id, adapter: args.adapter, projectPath: args.job.projectPath,
    hostPid: process.pid, hostStartedAt: Date.now() - process.uptime() * 1000,
    startedAt: Date.now(), observedAt: Date.now(), sequence: 0, phase: 'running', outputBytes: 0,
    unknownSamples: 0, degraded: false, cancelRequested: false,
  }
  const buffers = { stdout: '', stderr: '' }, dropping = { stdout: false, stderr: false }, recent = new Set<string>()
  let finished = false, lastPersistedAt = 0, structuredSequence = 0
  // Admission is fail-closed before starting a worker; subsequent I/O failures preserve it.
  if (existsSync(file)) throw new Error('Execution identity already exists; preserve the previous receipt')
  writeJsonAtomic(file, state)
  const persist = () => {
    try { writeJsonAtomic(file, state); lastPersistedAt = Date.now() } catch { state.degraded = true }
  }
  const acceptObject = (value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return
    const event = value as Record<string, unknown>
    if (typeof event.type !== 'string' || !ACTIVITY_EVENTS.has(event.type)) return
    const item = event.item as Record<string, unknown> | undefined
    const itemType = item && typeof item.type === 'string' ? item.type : ''
    const key = createHash('sha256').update(JSON.stringify(value)).digest('hex')
    if (recent.has(key)) return
    // ponytail: remember 256 fingerprints; native monotonic event IDs can replace this bounded dedupe window.
    recent.add(key); if (recent.size > 256) recent.delete(recent.values().next().value!)
    structuredSequence++
    state.lastActivityAt = Date.now(); state.lastEvent = event.type
    const progressType = `${event.type}:${itemType}`
    if (PROGRESS_EVENTS.has(event.type) || PROGRESS_EVENTS.has(progressType)) {
      state.lastProgressAt = Date.now(); state.unknownSamples = 0
      if (state.phase === 'waiting_input') state.phase = 'running'
    }
    if (event.type === 'permission_request' || event.type === 'user_input_request') state.phase = 'waiting_input'
    const session = event.thread_id ?? event.session_id
    if (typeof session === 'string' && SAFE_ID.test(session)) state.sessionId = session
  }
  const output = (stream: 'stdout' | 'stderr', text: string) => {
    state.outputBytes += Buffer.byteLength(text); state.lastOutputAt = Date.now()
    // Process each chunk without retaining an oversized JSON line or trusting log prose.
    for (const fragment of text.split(/(?<=\n)/)) {
      const newline = fragment.endsWith('\n')
      if (!dropping[stream]) buffers[stream] += fragment
      if (buffers[stream].length > 65_536) { buffers[stream] = ''; dropping[stream] = true; state.degraded = true }
      if (!newline) continue
      if (!dropping[stream]) {
        try {
          const value = JSON.parse(buffers[stream]) as unknown
          if (Array.isArray(value)) value.slice(0, 256).forEach(acceptObject); else acceptObject(value)
        } catch { /* Text or malformed JSON gives no progress evidence. */ }
      }
      buffers[stream] = ''; dropping[stream] = false
    }
  }
  const onEvent = (event: RunEvent) => {
    if (finished) return
    const previousStructuredSequence = structuredSequence
    state.sequence++; state.observedAt = Date.now()
    if (event.type === 'spawn') { state.worker = { pid: event.pid, startedAt: event.startedAt }; state.phase = 'running' }
    if (event.type === 'output') output(event.stream, event.text)
    if (event.type === 'cancel-requested') { state.cancelRequested = true; state.phase = 'unknown' }
    if (event.type === 'exit') { state.exit = { code: event.code, reason: event.reason }; state.phase = event.reason === 'exit' ? 'validating' : 'unknown' }
    if (event.type !== 'output' || structuredSequence !== previousStructuredSequence || Date.now() - lastPersistedAt >= 1000) persist()
    observeRun(parent, event)
  }
  const sample = () => {
    if (finished) return
    state.observedAt = Date.now()
    if (!state.lastProgressAt || Date.now() - state.lastProgressAt >= intervalMs) state.unknownSamples++
    else state.unknownSamples = 0
    try {
      if (existsSync(cancelFile) && statSync(cancelFile).size < 1024) {
        const request = JSON.parse(readFileSync(cancelFile, 'utf8')) as Record<string, unknown>
        if (request.executionId === id && request.hostPid === state.hostPid && request.hostStartedAt === state.hostStartedAt) {
          state.cancelRequested = true; state.phase = 'unknown'; controller.abort()
        }
      }
    } catch { state.degraded = true }
    persist()
  }
  const timer = setInterval(sample, intervalMs); timer.unref()
  const signal = parent?.signal ? AbortSignal.any([parent.signal, controller.signal]) : controller.signal
  const control: RunControl = { signal, onEvent, ...(args.supervised ? { idleAction: 'report' } : parent?.idleAction ? { idleAction: parent.idleAction } : {}) }
  return {
    control, snapshot: () => structuredClone(state), sample,
    get recoveryRequired() { return state.degraded || state.cancelRequested || signal.aborted || (!!state.exit && state.exit.reason !== 'exit') },
    finish(outcome: 'completed' | 'failed' | 'unconfirmed') {
      clearInterval(timer); finished = true; state.observedAt = Date.now(); state.sequence++
      state.outcome = this.recoveryRequired ? 'unconfirmed' : outcome
      state.phase = state.outcome === 'unconfirmed' ? 'unknown' : 'terminal'; persist()
    },
  }
}
