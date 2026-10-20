import { afterEach, expect, test, vi } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const terminalWrite = vi.hoisted(() => ({ run: undefined as (() => void) | undefined }))
vi.mock('../src/guardian/incident.js', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/guardian/incident.js')>()
  return { ...actual, writeJsonAtomic(file: string, value: unknown) {
    actual.writeJsonAtomic(file, value)
    if (value && typeof value === 'object' && (value as { phase?: unknown }).phase === 'terminal') terminalWrite.run?.()
  } }
})

import { createExecutionObservation, executionFile, readExecution, readExecutions } from '../src/engines/execution-observation.js'
import { withInventoryLock } from '../src/engines/inventory-lock.js'

const roots: string[] = []
afterEach(() => { terminalWrite.run = undefined; for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

test('terminal persist and archive stay locked against a reentrant inventory reader', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-terminal-lock-race-'))
  roots.push(root)
  const executionId = 'terminal-race'
  const observer = createExecutionObservation({ dataDir: root, adapter: 'codex', supervised: true,
    job: { executionId, projectPath: root, task: { id: 'terminal-race-task', text: 'finish safely', line: 0, status: 'open' } } })
  let interleaved: ReturnType<typeof readExecutions> | undefined
  terminalWrite.run = () => { interleaved = readExecutions(root) }
  observer.control.onEvent?.({ type: 'exit', code: 0, reason: 'exit' })

  observer.finish('completed')
  terminalWrite.run = undefined

  expect(interleaved).toMatchObject({ protected: true, errors: ['execution inventory unavailable'] })
  expect(existsSync(executionFile(root, executionId))).toBe(false)
  expect(readExecutions(root)).toMatchObject({ protected: false, records: [], errors: [], capacityExceeded: false })
  expect(readExecution(root, executionId)).toMatchObject({ phase: 'terminal', outcome: 'completed' })
})

test('ordinary observation persistence waits for inventory ownership without degrading the backend', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-observer-write-contention-'))
  roots.push(root)
  const observer = createExecutionObservation({ dataDir: root, adapter: 'mock',
    job: { executionId: 'write-race', projectPath: root, task: { id: 'write-race-task', text: 'fixture', line: 0, status: 'open' } } })
  const file = executionFile(root, 'write-race'), original = readFileSync(file, 'utf8')
  withInventoryLock(root, () => {
    observer.control.onEvent?.({ type: 'spawn', pid: process.pid, startedAt: 2 })
    observer.sample()
    expect(readFileSync(file, 'utf8')).toBe(original)
    expect(observer.snapshot()).toMatchObject({ degraded: false, worker: { pid: process.pid } })
    expect(readExecutions(root)).toMatchObject({ protected: true, diagnosisDue: true, updateInProgress: true })
  })
  observer.sample()
  expect(readExecution(root, 'write-race')).toMatchObject({ degraded: false, worker: { pid: process.pid } })
  observer.control.onEvent?.({ type: 'exit', code: 0, reason: 'exit' })
  observer.finish('completed')
  expect(observer.recoveryRequired).toBe(false)
})

test('fresh owner initialization is protected contention but stale malformed ownership stays a recovery error', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-inventory-owner-initialization-'))
  roots.push(root); mkdirSync(join(root, 'executions'))
  const lock = join(root, 'executions', '.inventory.lock')
  writeFileSync(lock, '')
  expect(readExecutions(root)).toMatchObject({ protected: true, diagnosisDue: true, updateInProgress: true })
  utimesSync(lock, new Date(0), new Date(0))
  const stale = readExecutions(root)
  expect(stale).toMatchObject({ protected: true, diagnosisDue: true, errors: ['execution inventory unavailable'] })
  expect(stale.updateInProgress).toBeUndefined()
  expect(readFileSync(lock, 'utf8')).toBe('')
})

test('an abandoned atomic temporary receipt remains explicit protected evidence', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-abandoned-receipt-write-'))
  roots.push(root)
  expect(readExecutions(root).errors).toEqual([])
  mkdirSync(join(root, 'executions', 'active'), { recursive: true })
  const temporary = executionFile(root, 'crashed') + '.tmp', bytes = '{interrupted receipt'
  writeFileSync(temporary, bytes)
  const inventory = readExecutions(root)
  expect(inventory).toMatchObject({ protected: true, diagnosisDue: true })
  expect(inventory.updateInProgress).toBeUndefined()
  expect(inventory.errors).toContain('unexpected files remain in the active execution directory')
  expect(readFileSync(temporary, 'utf8')).toBe(bytes)
})
