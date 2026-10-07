import { afterEach, expect, test, vi } from 'vitest'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, truncateSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const failures = vi.hoisted(() => ({ marker: false, archive: false, recovery: false }))
vi.mock('../src/guardian/incident.js', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/guardian/incident.js')>()
  return { ...actual, writeJsonAtomic(file: string, value: unknown) {
    if (failures.marker && file.endsWith('inventory-migration.json'))
      throw Object.assign(new Error('fixture disk full'), { code: 'ENOSPC' })
    if (failures.recovery && (value as { phase?: string })?.phase === 'unknown')
      throw Object.assign(new Error('fixture recovery full'), { code: 'ENOSPC' })
    actual.writeJsonAtomic(file, value)
  } }
})
vi.mock('node:fs', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return { ...actual, renameSync(source: string, target: string) {
    if (failures.archive && target.includes(`${join('executions', 'history')}`))
      throw Object.assign(new Error('fixture archive full'), { code: 'ENOSPC' })
    actual.renameSync(source, target)
  } }
})

import { createExecutionObservation, executionFile, executionHistoryFile, readExecution, readExecutions, type ExecutionSnapshot } from '../src/engines/execution-observation.js'

const roots: string[] = []
afterEach(() => {
  failures.marker = false; failures.archive = false; failures.recovery = false
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'adng-inventory-recovery-'))
  roots.push(root); mkdirSync(join(root, 'executions'), { recursive: true })
  return root
}
function terminal(executionId: string): ExecutionSnapshot {
  return { version: 1, executionId, taskId: 'old-task', adapter: 'mock', projectPath: 'fixture',
    hostPid: 1, hostStartedAt: 1, startedAt: 1, observedAt: 1, sequence: 1, phase: 'terminal',
    outputBytes: 0, unknownSamples: 0, degraded: false, cancelRequested: false,
    exit: { code: 0, reason: 'exit' }, outcome: 'completed' }
}

test('a schema-valid terminal receipt with a mismatched filename ID stays corrupt and protected after migration and restore', () => {
  const root = fixture(), filenameId = 'identity-a', embeddedId = 'identity-b'
  const bytes = JSON.stringify(terminal(embeddedId))
  writeFileSync(join(root, 'executions', filenameId + '.json'), bytes)
  for (const attempt of [1, 2]) {
    const inventory = readExecutions(root)
    expect(inventory).toMatchObject({ protected: true, capacityExceeded: false, records: [] })
    expect(inventory.errors).toContain('invalid execution record: ' + filenameId + '.json')
    expect(readFileSync(executionFile(root, filenameId), 'utf8'), 'migration attempt ' + attempt).toBe(bytes)
    expect(existsSync(executionHistoryFile(root, filenameId))).toBe(false)
    expect(existsSync(executionHistoryFile(root, embeddedId))).toBe(false)
    expect(() => readExecution(root, filenameId)).toThrow('identity mismatch')
    expect(readExecution(root, embeddedId)).toBeUndefined()
  }
  const restored = fixture()
  cpSync(join(root, 'executions'), join(restored, 'executions'), { recursive: true })
  expect(readExecutions(restored)).toMatchObject({ protected: true, records: [] })
  expect(readFileSync(executionFile(restored, filenameId), 'utf8')).toBe(bytes)
  expect(() => readExecution(restored, filenameId)).toThrow('identity mismatch')
})

test('quarantined identity survives a failed migration marker, subsequent reads, and isolated backup restore', () => {
  const root = fixture(), original = '{corrupt identity must remain protected'
  writeFileSync(join(root, 'executions', 'invalid.identity.json'), original)
  failures.marker = true
  expect(readExecutions(root)).toMatchObject({ protected: true, capacityExceeded: false })
  expect(existsSync(join(root, 'executions', 'invalid.identity.json'))).toBe(false)
  const quarantine = join(root, 'executions', 'quarantine')
  expect(readdirSync(quarantine)).toHaveLength(1)
  expect(readFileSync(join(quarantine, readdirSync(quarantine)[0]!), 'utf8')).toBe(original)
  failures.marker = false
  expect(readExecutions(root)).toMatchObject({ protected: true, capacityExceeded: false })
  expect(readExecutions(root).errors.join(' ')).toContain('quarantined execution data')
  const restored = fixture()
  cpSync(join(root, 'executions'), join(restored, 'executions'), { recursive: true })
  expect(readExecutions(restored)).toMatchObject({ protected: true, capacityExceeded: false })
  const restoredQuarantine = join(restored, 'executions', 'quarantine')
  expect(readFileSync(join(restoredQuarantine, readdirSync(restoredQuarantine)[0]!), 'utf8')).toBe(original)
})

test('archive ENOSPC preserves the exact legacy receipt and migration retries after storage recovery', () => {
  const root = fixture(), record = terminal('disk-full'), content = JSON.stringify(record)
  const legacy = join(root, 'executions', 'disk-full.json')
  writeFileSync(legacy, content)
  failures.archive = true
  expect(readExecutions(root)).toMatchObject({ protected: true, capacityExceeded: false })
  expect(readFileSync(legacy, 'utf8')).toBe(content)
  expect(existsSync(executionHistoryFile(root, record.executionId))).toBe(false)
  failures.archive = false
  expect(readExecutions(root)).toMatchObject({ protected: false, records: [], errors: [] })
  expect(readFileSync(executionHistoryFile(root, record.executionId), 'utf8')).toBe(content)
  expect(readExecution(root, record.executionId)).toEqual(record)
})

test('marker ENOSPC after archival preserves receipts through restart and backup restore without replacing active data', () => {
  const root = fixture(), archived = terminal('completed'), active = { ...terminal('running'), phase: 'running' as const, outcome: undefined, exit: undefined }
  const original = JSON.stringify(archived), activeOriginal = JSON.stringify(active)
  writeFileSync(join(root, 'executions', 'completed.json'), original)
  writeFileSync(join(root, 'executions', 'running.json'), activeOriginal)
  failures.marker = true
  expect(readExecutions(root).protected).toBe(true)
  expect(readFileSync(executionHistoryFile(root, archived.executionId), 'utf8')).toBe(original)
  expect(readFileSync(executionFile(root, active.executionId), 'utf8')).toBe(activeOriginal)
  failures.marker = false
  expect(readExecutions(root)).toMatchObject({ protected: true, errors: [], records: [{ executionId: 'running' }] })
  const restored = fixture()
  cpSync(join(root, 'executions'), join(restored, 'executions'), { recursive: true })
  expect(readExecution(restored, archived.executionId)).toEqual(archived)
  expect(readFileSync(executionFile(restored, active.executionId), 'utf8')).toBe(activeOriginal)
  expect(readExecutions(restored)).toMatchObject({ protected: true, records: [{ phase: 'running' }] })
})

test('observer archive ENOSPC retains an unconfirmed active receipt after a fresh inventory read', () => {
  const root = fixture(), observer = createExecutionObservation({ dataDir: root, adapter: 'mock',
    job: { executionId: 'observer-full', projectPath: root, task: { id: 'new-task', text: 'fixture', line: 0, status: 'open' } } })
  observer.control.onEvent?.({ type: 'exit', code: 0, reason: 'exit' })
  failures.archive = true
  observer.finish('completed')
  expect(observer.snapshot()).toMatchObject({ phase: 'unknown', degraded: true, outcome: 'unconfirmed' })
  failures.archive = false
  expect(readExecutions(root)).toMatchObject({ protected: true, records: [{ executionId: 'observer-full', phase: 'unknown' }] })
  expect(existsSync(executionHistoryFile(root, 'observer-full'))).toBe(false)
})

test('combined archive and recovery-write ENOSPC keeps a durable protection fence after storage returns', () => {
  const root = fixture(), observer = createExecutionObservation({ dataDir: root, adapter: 'mock',
    job: { executionId: 'double-full', projectPath: root, task: { id: 'new-task', text: 'fixture', line: 0, status: 'open' } } })
  observer.control.onEvent?.({ type: 'exit', code: 0, reason: 'exit' })
  failures.archive = true; failures.recovery = true
  observer.finish('completed')
  expect(observer.recoveryRequired).toBe(true)
  failures.archive = false; failures.recovery = false
  expect(readExecutions(root)).toMatchObject({ protected: true, capacityExceeded: false })
  expect(existsSync(executionFile(root, 'double-full'))).toBe(true)
  expect(existsSync(executionHistoryFile(root, 'double-full'))).toBe(false)
  expect(existsSync(join(root, 'executions', '.inventory.lock'))).toBe(true)
})

test.each([
  { degraded: true }, { outcome: 'unconfirmed' as const }, { exit: undefined },
])('retained terminal evidence is an explicit inventory error: %j', evidence => {
  const root = fixture()
  writeFileSync(join(root, 'executions', 'uncertain.json'), JSON.stringify({ ...terminal('uncertain'), ...evidence }))
  expect(readExecutions(root)).toMatchObject({ protected: true, capacityExceeded: false, records: [{ executionId: 'uncertain' }] })
  expect(readExecutions(root).errors.join(' ')).toContain('terminal execution state is unconfirmed')
})

test('oversized migration metadata fails closed without altering receipts', () => {
  const root = fixture(), record = terminal('marker-bound'), bytes = JSON.stringify(record)
  const file = join(root, 'executions', 'marker-bound.json'), marker = join(root, 'executions', 'inventory-migration.json')
  writeFileSync(file, bytes); writeFileSync(marker, '{}'); truncateSync(marker, 16 * 1024 * 1024)
  expect(readExecutions(root)).toMatchObject({ protected: true, capacityExceeded: false })
  expect(readExecutions(root).errors).toContain('execution inventory migration marker is invalid')
  expect(readFileSync(file, 'utf8')).toBe(bytes)
  expect(existsSync(executionHistoryFile(root, record.executionId))).toBe(false)
})

test('restored duplicate identities preserve both receipts and reject lookup instead of overwriting the active result', () => {
  const root = fixture(), id = 'restored-collision', legacy = terminal(id), active = { ...legacy, phase: 'running' as const, exit: undefined, outcome: undefined }
  mkdirSync(join(root, 'executions', 'active'))
  writeFileSync(executionFile(root, id), JSON.stringify(active))
  writeFileSync(join(root, 'executions', id + '.json'), JSON.stringify(legacy))
  expect(readExecutions(root)).toMatchObject({ protected: true, records: [{ executionId: id, phase: 'running' }] })
  expect(readExecutions(root).errors).toContain('execution identity exists in active and history: ' + id)
  expect(readFileSync(executionFile(root, id), 'utf8')).toBe(JSON.stringify(active))
  expect(readFileSync(executionHistoryFile(root, id), 'utf8')).toBe(JSON.stringify(legacy))
  expect(() => readExecution(root, id)).toThrow('both active and history')
})
