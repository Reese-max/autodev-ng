import { createHash } from 'node:crypto'
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, opendirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync, type Dir, type Dirent } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { writeJsonAtomic } from '../guardian/incident.js'
import type { Job } from '../types.js'
import { observeRun, type RunControl, type RunEvent } from './run-control.js'

export const OBSERVATION_INTERVAL_MS = 60_000
export const UNKNOWN_SAMPLES_BEFORE_DIAGNOSIS = 5
export const MAX_ACTIVE_EXECUTIONS = 10_000
export const MAX_TRACKED_EXECUTION_FILES = 20_000
const MAX_LEGACY_DIRECTORY_ENTRIES = MAX_TRACKED_EXECUTION_FILES * 2 + 32
const MAX_RECEIPT_BYTES = 16_384
const SAFE_ID = /^[A-Za-z0-9_-]{1,100}$/
const PROCESS_STARTED_AT = Date.now() - process.uptime() * 1000
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
export type ExecutionInventory = { records: ExecutionSnapshot[]; errors: string[]; protected: boolean; diagnosisDue: boolean; capacityExceeded: boolean }

type MigrationMarker = { version: 1; migratedAt: number; quarantined: string[] }

function executionRoot(dataDir: string): string { return join(dataDir, 'executions') }
function executionActiveDir(dataDir: string): string { return join(executionRoot(dataDir), 'active') }
function executionHistoryDir(dataDir: string): string { return join(executionRoot(dataDir), 'history') }
function executionQuarantineDir(dataDir: string): string { return join(executionRoot(dataDir), 'quarantine') }
function migrationMarkerFile(dataDir: string): string { return join(executionRoot(dataDir), 'inventory-migration.json') }
function cancelFile(dataDir: string, id: string): string { return executionFile(dataDir, id).replace(/\.json$/, '.cancel.json') }

function isReceiptName(name: string): boolean {
  return name.endsWith('.json') && !name.endsWith('.cancel.json') && name !== 'inventory-migration.json'
}
function isCancelName(name: string): boolean { return name.endsWith('.cancel.json') }

function boundedEntries(folder: string, limit: number): { entries: Dirent[]; overflow: boolean } {
  let directory: Dir
  try { directory = opendirSync(folder) } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { entries: [], overflow: false }
    throw error
  }
  const entries: Dirent[] = []
  try {
    for (let count = 0; count <= limit; count++) {
      const entry = directory.readSync()
      if (!entry) return { entries, overflow: false }
      entries.push(entry)
    }
    return { entries, overflow: true }
  } finally { directory.closeSync() }
}

function processIsAlive(pid: number): boolean {
  try { process.kill(pid, 0); return true } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH'
  }
}

function staleInventoryLock(lockFile: string): boolean {
  let stat
  try { stat = statSync(lockFile) } catch { return false }
  try {
    const owner = JSON.parse(readFileSync(lockFile, 'utf8')) as { pid?: unknown; processStartedAt?: unknown }
    if (typeof owner.pid !== 'number' || !Number.isInteger(owner.pid) || typeof owner.processStartedAt !== 'number' || !Number.isFinite(owner.processStartedAt))
      return Date.now() - stat.mtimeMs > 60_000
    const pid = owner.pid as number
    if (pid === process.pid) return Math.abs(owner.processStartedAt - PROCESS_STARTED_AT) > 2_000
    return !processIsAlive(pid)
  } catch { return Date.now() - stat.mtimeMs > 60_000 }
}

function withInventoryLock<T>(dataDir: string, action: () => T): T {
  const root = executionRoot(dataDir), lockFile = join(root, '.inventory.lock')
  mkdirSync(root, { recursive: true })
  let descriptor: number | undefined
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      descriptor = openSync(lockFile, 'wx')
      writeFileSync(descriptor, JSON.stringify({ pid: process.pid, processStartedAt: PROCESS_STARTED_AT, acquiredAt: Date.now() }))
      break
    } catch (error) {
      if (descriptor !== undefined) {
        try { closeSync(descriptor) } catch { /* best effort after failed lock initialization */ }
        descriptor = undefined
        try { unlinkSync(lockFile) } catch { /* lock owner will report unknown below */ }
      }
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST' || attempt > 0 || !staleInventoryLock(lockFile))
        throw new Error('execution inventory update is in progress or its owner is unknown')
      unlinkSync(lockFile)
    }
  }
  if (descriptor === undefined) throw new Error('execution inventory lock could not be acquired')
  try { return action() } finally {
    closeSync(descriptor)
    unlinkSync(lockFile)
  }
}

function archiveable(record: ExecutionSnapshot): boolean {
  return record.phase === 'terminal' && (record.outcome === 'completed' || record.outcome === 'failed') &&
    record.exit?.reason === 'exit' && !record.cancelRequested && !record.degraded
}

function moveWithoutOverwrite(source: string, target: string): void {
  if (existsSync(target)) throw new Error('destination already contains an execution record')
  renameSync(source, target)
}

function quarantinePath(dataDir: string, name: string): string {
  const suffix = createHash('sha256').update(name).digest('hex').slice(0, 16)
  return join(executionQuarantineDir(dataDir), suffix + '-' + name.slice(-160))
}

function ensureLegacyLayout(dataDir: string, nowMs: number): { errors: string[]; capacityExceeded: boolean } {
  const root = executionRoot(dataDir), markerFile = migrationMarkerFile(dataDir)
  mkdirSync(root, { recursive: true })
  mkdirSync(executionActiveDir(dataDir), { recursive: true })
  mkdirSync(executionHistoryDir(dataDir), { recursive: true })
  mkdirSync(executionQuarantineDir(dataDir), { recursive: true })
  let marker: MigrationMarker | undefined
  if (existsSync(markerFile)) {
    try {
      const parsed = JSON.parse(readFileSync(markerFile, 'utf8')) as Partial<MigrationMarker>
      if (parsed.version !== 1 || typeof parsed.migratedAt !== 'number' || !Array.isArray(parsed.quarantined) ||
        parsed.quarantined.length > MAX_LEGACY_DIRECTORY_ENTRIES || parsed.quarantined.some(name => typeof name !== 'string'))
        throw new Error('invalid migration marker')
      marker = { version: 1, migratedAt: parsed.migratedAt, quarantined: parsed.quarantined as string[] }
    } catch { return { errors: ['execution inventory migration marker is invalid'], capacityExceeded: false } }
  }
  const bounded = boundedEntries(root, MAX_LEGACY_DIRECTORY_ENTRIES)
  if (bounded.overflow) return { errors: ['legacy execution directory exceeds the bounded migration scan'], capacityExceeded: true }
  const rootFiles = bounded.entries.filter(entry => entry.isFile() || entry.isSymbolicLink() || isReceiptName(entry.name) || isCancelName(entry.name)).map(entry => entry.name)
  const rootEntries = new Map(bounded.entries.map(entry => [entry.name, entry]))
  const legacyReceipts = rootFiles.filter(name => isReceiptName(name))
  const legacyCancels = rootFiles.filter(name => isCancelName(name))
  const unexpected = bounded.entries.filter(entry => !entry.isDirectory() && entry.name !== 'inventory-migration.json' && entry.name !== '.inventory.lock' &&
    !isReceiptName(entry.name) && !isCancelName(entry.name)).map(entry => entry.name)
  if (legacyReceipts.length > MAX_TRACKED_EXECUTION_FILES || legacyCancels.length > MAX_TRACKED_EXECUTION_FILES)
    return { errors: ['legacy execution directory exceeds the bounded migration file limit'], capacityExceeded: true }
  const errors: string[] = unexpected.length ? ['unexpected files remain in the legacy execution directory'] : []
  let capacityExceeded = false
  const quarantined = [...(marker?.quarantined ?? [])]
  if (legacyReceipts.length || legacyCancels.length || !marker) {
    const cancelNames = new Set(legacyCancels)
    const receiptNames = new Set(legacyReceipts)
    let migrationFailed = false
    for (const name of legacyReceipts.sort()) {
      const source = join(root, name), id = name.slice(0, -'.json'.length)
      const sourceEntry = rootEntries.get(name)
      if (sourceEntry?.isSymbolicLink()) {
        try {
          moveWithoutOverwrite(source, quarantinePath(dataDir, name)); quarantined.push(name)
          const sidecar = id + '.cancel.json'
          if (cancelNames.has(sidecar)) { moveWithoutOverwrite(join(root, sidecar), quarantinePath(dataDir, sidecar)); quarantined.push(sidecar) }
        } catch { errors.push('legacy symbolic execution record could not be preserved'); migrationFailed = true }
        continue
      }
      if (!sourceEntry?.isFile()) { errors.push('legacy execution entry is not a regular file'); migrationFailed = true; continue }
      if (!SAFE_ID.test(id)) {
        try {
          moveWithoutOverwrite(source, quarantinePath(dataDir, name)); quarantined.push(name)
          const sidecar = id + '.cancel.json'
          if (cancelNames.has(sidecar)) { moveWithoutOverwrite(join(root, sidecar), quarantinePath(dataDir, sidecar)); quarantined.push(sidecar) }
        } catch { errors.push('legacy execution record could not be preserved'); migrationFailed = true }
        continue
      }
      const sidecarName = id + '.cancel.json', hasCancel = cancelNames.has(sidecarName)
      const sidecarEntry = rootEntries.get(sidecarName)
      if (hasCancel && !sidecarEntry?.isFile() && !sidecarEntry?.isSymbolicLink()) {
        errors.push('legacy cancellation entry is not a regular file'); migrationFailed = true; continue
      }
      let snapshot: ExecutionSnapshot | undefined
      try {
        if (statSync(source).size > MAX_RECEIPT_BYTES) throw new Error('oversized record')
        snapshot = SnapshotSchema.parse(JSON.parse(readFileSync(source, 'utf8')))
        if (snapshot.executionId !== id) throw new Error('identity mismatch')
      } catch { /* Keep validly named but corrupt records in active storage for direct review. */ }
      const destination = snapshot && archiveable(snapshot) && !hasCancel
        ? join(executionHistoryDir(dataDir), id + '.json') : executionFile(dataDir, id)
      try {
        moveWithoutOverwrite(source, destination)
        if (hasCancel && sidecarEntry?.isSymbolicLink()) {
          moveWithoutOverwrite(join(root, sidecarName), quarantinePath(dataDir, sidecarName)); quarantined.push(sidecarName)
        } else if (hasCancel) moveWithoutOverwrite(join(root, sidecarName), cancelFile(dataDir, id))
      } catch { errors.push('legacy execution record could not be preserved'); migrationFailed = true }
    }
    for (const name of legacyCancels.sort()) {
      if (!name.endsWith('.cancel.json')) continue
      const id = name.slice(0, -'.cancel.json'.length)
      if (receiptNames.has(id + '.json')) continue
      try { moveWithoutOverwrite(join(root, name), quarantinePath(dataDir, name)); quarantined.push(name) }
      catch { errors.push('orphan cancellation request could not be preserved'); migrationFailed = true }
    }
    if (!migrationFailed) {
      try { writeJsonAtomic(markerFile, { version: 1, migratedAt: marker?.migratedAt ?? nowMs, quarantined } satisfies MigrationMarker) }
      catch { errors.push('execution inventory migration marker could not be written'); migrationFailed = true }
    }
    if (migrationFailed) return { errors, capacityExceeded }
    marker = { version: 1, migratedAt: marker?.migratedAt ?? nowMs, quarantined }
  }
  if (marker?.quarantined.length) errors.push('quarantined execution data requires review (' + marker.quarantined.length + ' files)')
  return { errors, capacityExceeded }
}

function parseReceipt(file: string, id: string): ExecutionSnapshot {
  const info = lstatSync(file)
  if (!info.isFile() || info.size > MAX_RECEIPT_BYTES) throw new Error('oversized or non-regular record')
  const record = SnapshotSchema.parse(JSON.parse(readFileSync(file, 'utf8')))
  if (record.executionId !== id) throw new Error('identity mismatch')
  return record
}

function emptyInventory(errors: string[] = [], capacityExceeded = false): ExecutionInventory {
  return { records: [], errors, protected: errors.length > 0 || capacityExceeded, diagnosisDue: errors.length > 0 || capacityExceeded, capacityExceeded }
}

function readExecutionsUnlocked(dataDir: string, nowMs: number): ExecutionInventory {
  const migrated = ensureLegacyLayout(dataDir, nowMs), errors = [...migrated.errors]
  let capacityExceeded = migrated.capacityExceeded
  const activeDir = executionActiveDir(dataDir)
  let bounded: { entries: Dirent[]; overflow: boolean }
  try { bounded = boundedEntries(activeDir, MAX_LEGACY_DIRECTORY_ENTRIES) } catch { return emptyInventory([...errors, 'execution inventory unavailable'], capacityExceeded) }
  if (bounded.overflow) { errors.push('active execution directory exceeds the bounded scan'); capacityExceeded = true }
  const names = bounded.entries.filter(entry => isReceiptName(entry.name) || isCancelName(entry.name)).map(entry => entry.name)
  const activeEntries = new Map(bounded.entries.map(entry => [entry.name, entry]))
  const receiptNames = names.filter(isReceiptName), cancelNames = new Set(names.filter(isCancelName))
  const unexpectedEntries = bounded.entries.filter(entry => !isReceiptName(entry.name) && !isCancelName(entry.name))
  if (unexpectedEntries.length) errors.push('unexpected files remain in the active execution directory')
  if (receiptNames.length > MAX_TRACKED_EXECUTION_FILES) { errors.push('active execution directory exceeds the bounded record limit'); capacityExceeded = true }
  const records: ExecutionSnapshot[] = []
  let activeFiles = receiptNames.length
  for (const name of receiptNames.slice(0, MAX_TRACKED_EXECUTION_FILES)) {
    const id = name.slice(0, -'.json'.length)
    if (!SAFE_ID.test(id)) { errors.push('invalid execution record filename: ' + name.slice(0, 100)); continue }
    const file = join(activeDir, name), hasCancel = cancelNames.has(id + '.cancel.json')
    try {
      if (!activeEntries.get(name)?.isFile()) throw new Error('non-regular execution entry')
      const record = parseReceipt(file, id)
      if (archiveable(record) && !hasCancel) {
        try { moveWithoutOverwrite(file, join(executionHistoryDir(dataDir), id + '.json')); activeFiles-- }
        catch {
          if (records.length < MAX_ACTIVE_EXECUTIONS) records.push(record)
          else capacityExceeded = true
          errors.push('terminal execution record could not be archived: ' + id)
        }
      } else {
        if (records.length < MAX_ACTIVE_EXECUTIONS) records.push(record)
        if (hasCancel) errors.push('execution cancellation request remains pending: ' + id)
      }
    } catch { errors.push('invalid execution record: ' + name.slice(0, 110)) }
  }
  for (const name of cancelNames) {
    const id = name.slice(0, -'.cancel.json'.length)
    if (!SAFE_ID.test(id) || !receiptNames.includes(id + '.json')) errors.push('orphan cancellation request: ' + name.slice(0, 110))
  }
  if (activeFiles > MAX_ACTIVE_EXECUTIONS) { errors.push('active execution capacity exceeded (' + activeFiles + ' > ' + MAX_ACTIVE_EXECUTIONS + ')'); capacityExceeded = true }
  return { records, errors, protected: capacityExceeded || errors.length > 0 || records.length > 0,
    diagnosisDue: capacityExceeded || errors.length > 0 || records.some(record => record.phase === 'unknown' || record.phase === 'waiting_input' || record.degraded || record.unknownSamples >= UNKNOWN_SAMPLES_BEFORE_DIAGNOSIS || nowMs - record.observedAt >= OBSERVATION_INTERVAL_MS * UNKNOWN_SAMPLES_BEFORE_DIAGNOSIS),
    capacityExceeded }
}

export function executionFile(dataDir: string, id: string): string {
  if (!SAFE_ID.test(id)) throw new Error('Invalid execution ID')
  return join(executionActiveDir(dataDir), id + '.json')
}

export function executionHistoryFile(dataDir: string, id: string): string {
  if (!SAFE_ID.test(id)) throw new Error('Invalid execution ID')
  return join(executionHistoryDir(dataDir), id + '.json')
}

/** No stdout, prompt, commands, credentials or tool arguments are persisted. */
export function readExecutions(dataDir: string, nowMs = Date.now()): ExecutionInventory {
  try { return withInventoryLock(dataDir, () => readExecutionsUnlocked(dataDir, nowMs)) }
  catch { return emptyInventory(['execution inventory unavailable']) }
}

/** Direct ID lookup includes both the bounded active directory and permanent history. */
export function readExecution(dataDir: string, id: string): ExecutionSnapshot | undefined {
  if (!SAFE_ID.test(id)) throw new Error('Invalid execution ID')
  return withInventoryLock(dataDir, () => {
    const active = executionFile(dataDir, id), history = executionHistoryFile(dataDir, id)
    if (existsSync(active) && existsSync(history)) throw new Error('Execution exists in both active and history storage')
    if (existsSync(active)) return parseReceipt(active, id)
    if (existsSync(history)) return parseReceipt(history, id)
    const legacy = join(executionRoot(dataDir), id + '.json')
    return existsSync(legacy) ? parseReceipt(legacy, id) : undefined
  })
}

export function requestExecutionCancel(dataDir: string, id: string): void {
  if (!SAFE_ID.test(id)) throw new Error('Invalid execution ID')
  withInventoryLock(dataDir, () => {
    const migration = ensureLegacyLayout(dataDir, Date.now())
    if (migration.capacityExceeded) throw new Error('Execution inventory capacity exceeded; cancellation state is unknown')
    if (migration.errors.length) throw new Error('Execution inventory state is unknown; cancellation is not safe')
    const file = executionFile(dataDir, id)
    if (!existsSync(file)) throw new Error('Execution is absent or already terminal')
    const record = parseReceipt(file, id)
    if (record.phase === 'terminal') throw new Error('Execution is absent or already terminal')
    writeJsonAtomic(cancelFile(dataDir, id), { executionId: id, hostPid: record.hostPid, hostStartedAt: record.hostStartedAt, requestedAt: Date.now() })
  })
}

const PROGRESS_EVENTS = new Set(['item.completed:command_execution', 'item.completed:file_change', 'item.completed:mcp_tool_call', 'tool_result', 'tool_execution_complete', 'tool.execution_complete', 'step_finish'])
const ACTIVITY_EVENTS = new Set(['thread.started', 'turn.started', 'turn.completed', 'turn.failed', 'item.started', 'item.completed', 'tool_use', 'tool_result', 'tool_execution_start', 'tool_execution_complete', 'tool.execution_start', 'tool.execution_complete', 'assistant.turn_start', 'assistant.turn_end', 'step_start', 'step_finish', 'permission_request', 'user_input_request'])

export function createExecutionObservation(args: { dataDir: string; job: Job; adapter: string; supervised?: boolean; intervalMs?: number }) {
  const id = args.job.executionId
  if (!id) throw new Error('Observed execution requires an execution ID')
  const file = executionFile(args.dataDir, id), cancellationFile = cancelFile(args.dataDir, id)
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
  withInventoryLock(args.dataDir, () => {
    const inventory = readExecutionsUnlocked(args.dataDir, Date.now())
    if (inventory.capacityExceeded) throw new Error('Execution inventory capacity exceeded; preserve active records')
    if (inventory.errors.length) throw new Error('Execution inventory is unavailable; preserve existing records')
    if (inventory.records.some(record => record.taskId === args.job.task.id || record.phase === 'unknown'))
      throw new Error('An existing execution requires backend-state review before this task can start')
    if (existsSync(file) || existsSync(executionHistoryFile(args.dataDir, id)))
      throw new Error('Execution identity already exists; preserve the previous receipt')
    if (inventory.records.length >= MAX_ACTIVE_EXECUTIONS)
      throw new Error('Execution inventory capacity exceeded; preserve active records')
    writeJsonAtomic(file, state)
  })
  const persist = () => {
    try { writeJsonAtomic(file, state); lastPersistedAt = Date.now() } catch { state.degraded = true }
  }
  const acceptObject = (value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return
    const event = value as Record<string, unknown>
    // Claude/Qwen Messages streams wrap tool use/results; only metadata reaches the receipt.
    if (event.type === 'assistant' || event.type === 'user') {
      const message = event.message as { content?: unknown[] } | undefined
      if (Array.isArray(message?.content)) for (const block of message.content.slice(0, 256)) {
        if (block && typeof block === 'object' && ['tool_use', 'tool_result'].includes(String((block as Record<string, unknown>).type))) {
          acceptObject({ ...block, session_id: event.session_id, uuid: event.uuid })
        }
      }
      return
    }
    if (event.type === 'stream_event') {
      const inner = event.event as { type?: string } | undefined
      if (inner?.type === 'content_block_start' || inner?.type === 'content_block_delta') {
        acceptObject({ type: 'item.started', stream: event.event, uuid: event.uuid })
      }
      return
    }
    if (event.type === 'tool_call' || event.type === 'tool_call_update') {
      acceptObject({ ...event, type: event.status === 'completed' || event.status === 'failed' ? 'tool_result' : 'tool_use' })
      return
    }
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
      if (existsSync(cancellationFile)) {
        const cancelInfo = lstatSync(cancellationFile)
        if (!cancelInfo.isFile() || cancelInfo.size >= 1024) throw new Error('invalid cancellation request')
        const request = JSON.parse(readFileSync(cancellationFile, 'utf8')) as Record<string, unknown>
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
      state.cancelRequested ||= signal.aborted
      state.outcome = this.recoveryRequired ? 'unconfirmed' : outcome
      state.phase = state.outcome === 'unconfirmed' ? 'unknown' : 'terminal'; persist()
      if (!archiveable(state) || state.degraded) return
      try {
        withInventoryLock(args.dataDir, () => {
          if (existsSync(cancellationFile)) {
            state.cancelRequested = true; state.outcome = 'unconfirmed'; state.phase = 'unknown'; persist()
            return
          }
          try { moveWithoutOverwrite(file, executionHistoryFile(args.dataDir, id)) }
          catch {
            state.degraded = true; state.outcome = 'unconfirmed'; state.phase = 'unknown'; persist()
          }
        })
      } catch {
        state.degraded = true; state.outcome = 'unconfirmed'; state.phase = 'unknown'; persist()
      }
    },
  }
}
