import { afterEach, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createExecutionObservation, executionFile, executionHistoryFile, readExecution, readExecutions, requestExecutionCancel } from '../src/engines/execution-observation.js'
import { ENGINE_CAPABILITIES, assertExecutionMode } from '../src/engines/capabilities.js'
import { EngineConfigSchema } from '../src/types.js'

const roots: string[] = []
afterEach(() => { vi.useRealTimers(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'adng-observe-')); roots.push(root)
  const observer = createExecutionObservation({ dataDir: root, adapter: 'codex', supervised: true,
    job: { executionId: 'fixture-execution', projectPath: root, task: { id: 'ab12cd34', text: 'fixture', line: 0, status: 'open' } } })
  return { root, observer, file: executionFile(root, 'fixture-execution') }
}
function terminalReceipt(executionId: string) {
  return { version: 1, executionId, taskId: 'task-' + executionId, adapter: 'codex', projectPath: 'fixture',
    hostPid: 1, hostStartedAt: 1, startedAt: 1, observedAt: 1, sequence: 1, phase: 'terminal',
    outputBytes: 0, unknownSamples: 0, degraded: false, cancelRequested: false,
    exit: { code: 0, reason: 'exit' }, outcome: 'completed' }
}
test('bounded streaming handles split Unicode, repeated output and old time thresholds without stopping work', async () => {
  vi.useFakeTimers()
  const f = fixture()
  f.observer.control.onEvent!({ type: 'spawn', pid: process.pid, startedAt: Date.now() })
  const event = JSON.stringify({ type: 'item.completed', item: { type: 'command_execution', id: 'one', output: '測試通過 private-secret' } }) + '\n'
  f.observer.control.onEvent!({ type: 'output', stream: 'stdout', text: event.slice(0, 35) })
  f.observer.control.onEvent!({ type: 'output', stream: 'stdout', text: event.slice(35) })
  const progress = f.observer.snapshot().lastProgressAt
  expect(progress).toBeTypeOf('number')
  await vi.advanceTimersByTimeAsync(4 * 60_000)
  expect(readExecutions(f.root).diagnosisDue).toBe(false)
  f.observer.control.onEvent!({ type: 'output', stream: 'stdout', text: event })
  await vi.advanceTimersByTimeAsync(3 * 60 * 60_000)
  expect(f.observer.snapshot().lastProgressAt).toBe(progress)
  expect(readExecutions(f.root)).toMatchObject({ protected: true, diagnosisDue: true })
  expect(f.observer.control.signal!.aborted).toBe(false)
  expect(readFileSync(f.file, 'utf8')).not.toContain('private-secret')
  f.observer.control.onEvent!({ type: 'exit', code: 0, reason: 'exit' })
  f.observer.finish('completed')
  expect(readExecutions(f.root)).toMatchObject({ protected: false, records: [], capacityExceeded: false })
  expect(readExecution(f.root, 'fixture-execution')).toMatchObject({ phase: 'terminal', outcome: 'completed' })
})
test('oversized or invalid observations remain bounded, preserve the worker, and fail closed for later admission', () => {
  const f = fixture()
  f.observer.control.onEvent!({ type: 'output', stream: 'stderr', text: 'x'.repeat(100_000) + '\nnull\n' })
  f.observer.control.onEvent!({ type: 'output', stream: 'stdout', text: '{"type":"thread.started","thread_id":"session-1"}\n' })
  expect(f.observer.snapshot()).toMatchObject({ degraded: true, sessionId: 'session-1' })
  expect(f.observer.control.signal!.aborted).toBe(false)
  f.observer.finish('completed')
  expect(readExecutions(f.root)).toMatchObject({ protected: true, diagnosisDue: true })
  expect(readFileSync(f.file).length).toBeLessThan(2000)
  writeFileSync(f.file, '{broken')
  expect(readExecutions(f.root)).toMatchObject({ protected: true, diagnosisDue: true })
})
test('manual cancel is bound to execution and host identity, and keeps an unconfirmed receipt', () => {
  const f = fixture(), request = f.file.replace(/\.json$/, '.cancel.json')
  writeFileSync(request, JSON.stringify({ executionId: 'fixture-execution', hostPid: process.pid, hostStartedAt: 0 }))
  f.observer.sample(); expect(f.observer.control.signal!.aborted).toBe(false)
  requestExecutionCancel(f.root, 'fixture-execution')
  f.observer.sample(); expect(f.observer.control.signal!.aborted).toBe(true)
  f.observer.finish('failed')
  expect(readExecutions(f.root).records[0]).toMatchObject({ phase: 'unknown', outcome: 'unconfirmed', cancelRequested: true })
  expect(() => requestExecutionCancel(f.root, '../outside')).toThrow()
})

test('Copilot SDK tool completion is progress, and replay is not new progress', () => {
  vi.useFakeTimers()
  const f = fixture(), text = JSON.stringify({ type: 'tool.execution_complete', id: 'event-one', data: { success: true } }) + '\n'
  f.observer.control.onEvent!({ type: 'output', stream: 'stdout', text })
  const progress = f.observer.snapshot().lastProgressAt
  expect(progress).toBeTypeOf('number')
  vi.advanceTimersByTime(1000)
  f.observer.control.onEvent!({ type: 'output', stream: 'stdout', text })
  expect(f.observer.snapshot().lastProgressAt).toBe(progress)
  f.observer.finish('completed')
})
test('observer write failure leaves the previous active receipt; no worker cancellation', () => {
  const f = fixture()
  mkdirSync(`${f.file}.tmp`)
  f.observer.sample()
  expect(f.observer.snapshot().degraded).toBe(true)
  expect(f.observer.control.signal!.aborted).toBe(false)
  expect(readExecutions(f.root).protected).toBe(true)
  f.observer.finish('completed')
})
test('legacy terminal history at 9,999 / 10,000 / 10,001 migrates out of bounded active inventory and remains addressable', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-history-boundary-')), folder = join(root, 'executions'), parked = join(root, 'parked')
  roots.push(root); mkdirSync(folder, { recursive: true }); mkdirSync(parked)
  for (let index = 0; index < 10_001; index++) {
    const id = 'legacy-' + index
    writeFileSync(join(folder, id + '.json'), JSON.stringify(terminalReceipt(id)))
  }
  for (const index of [9_999, 10_000])
    renameSync(join(folder, 'legacy-' + index + '.json'), join(parked, 'legacy-' + index + '.json'))

  for (const count of [9_999, 10_000, 10_001]) {
    if (count === 10_000) renameSync(join(parked, 'legacy-9999.json'), join(folder, 'legacy-9999.json'))
    if (count === 10_001) renameSync(join(parked, 'legacy-10000.json'), join(folder, 'legacy-10000.json'))
    const inventory = readExecutions(root)
    expect(inventory).toMatchObject({ protected: false, records: [], errors: [], capacityExceeded: false })
    expect(readdirSync(join(folder, 'history'))).toHaveLength(count)
    expect(readdirSync(join(folder, 'active'))).toHaveLength(0)
    expect(readExecution(root, 'legacy-' + (count - 1))).toMatchObject({ executionId: 'legacy-' + (count - 1), phase: 'terminal', outcome: 'completed' })
    expect(readFileSync(executionHistoryFile(root, 'legacy-0'), 'utf8')).toContain('"outcome":"completed"')
  }
}, 240_000)

test('legacy running, unknown, waiting-input, pending-cancel and corrupt receipts stay protected and are not archived', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-preserve-')), folder = join(root, 'executions')
  roots.push(root); mkdirSync(folder, { recursive: true })
  const running = { ...terminalReceipt('running-one'), phase: 'running', exit: undefined, outcome: undefined }
  const unknown = { ...terminalReceipt('unknown-one'), phase: 'unknown', outcome: 'unconfirmed' }
  const waiting = { ...terminalReceipt('waiting-one'), phase: 'waiting_input', exit: undefined, outcome: undefined }
  const pendingCancel = terminalReceipt('cancel-one')
  const degraded = { ...terminalReceipt('degraded-one'), degraded: true }
  const unverified = { ...terminalReceipt('unverified-one'), exit: undefined }
  writeFileSync(join(folder, 'running-one.json'), JSON.stringify(running))
  writeFileSync(join(folder, 'unknown-one.json'), JSON.stringify(unknown))
  writeFileSync(join(folder, 'waiting-one.json'), JSON.stringify(waiting))
  writeFileSync(join(folder, 'cancel-one.json'), JSON.stringify(pendingCancel))
  writeFileSync(join(folder, 'cancel-one.cancel.json'), JSON.stringify({ executionId: 'cancel-one', hostPid: 1, hostStartedAt: 1 }))
  writeFileSync(join(folder, 'degraded-one.json'), JSON.stringify(degraded))
  writeFileSync(join(folder, 'unverified-one.json'), JSON.stringify(unverified))
  writeFileSync(join(folder, 'corrupt-one.json'), '{broken')

  const inventory = readExecutions(root)
  expect(inventory).toMatchObject({ protected: true, capacityExceeded: false })
  expect(inventory.errors.join(' ')).toContain('cancellation request remains pending')
  expect(inventory.errors.join(' ')).toContain('invalid execution record')
  expect(inventory.records.map(record => record.executionId).sort()).toEqual(['cancel-one', 'degraded-one', 'running-one', 'unknown-one', 'unverified-one', 'waiting-one'])
  expect(readdirSync(join(folder, 'history'))).toHaveLength(0)
  expect(readFileSync(executionFile(root, 'corrupt-one'), 'utf8')).toBe('{broken')
})

test('history collision preserves the active receipt and marks its terminal state unconfirmed', () => {
  const f = fixture(), history = executionHistoryFile(f.root, 'fixture-execution')
  writeFileSync(history, 'pre-existing-history-must-not-be-overwritten')
  f.observer.control.onEvent!({ type: 'exit', code: 0, reason: 'exit' })
  f.observer.finish('completed')
  expect(f.observer.snapshot()).toMatchObject({ phase: 'unknown', outcome: 'unconfirmed', degraded: true })
  expect(readFileSync(history, 'utf8')).toBe('pre-existing-history-must-not-be-overwritten')
  expect(readExecutions(f.root)).toMatchObject({ protected: true, records: [{ executionId: 'fixture-execution', outcome: 'unconfirmed' }] })
  expect(() => readExecution(f.root, 'fixture-execution')).toThrow('both active and history')
})

test('capacity overflow is distinct from unknown and malformed execution state', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-capacity-')), folder = join(root, 'executions', 'active')
  roots.push(root); mkdirSync(folder, { recursive: true })
  for (let index = 0; index <= 10_000; index++) {
    const id = 'active-' + index
    const record = { ...terminalReceipt(id), phase: 'running', exit: undefined, outcome: undefined }
    writeFileSync(join(folder, id + '.json'), JSON.stringify(record))
  }
  const inventory = readExecutions(root)
  expect(inventory.capacityExceeded).toBe(true)
  expect(inventory.errors.some(error => error.includes('active execution capacity exceeded'))).toBe(true)
  expect(inventory.records.length).toBe(10_000)
  expect(inventory.protected).toBe(true)
}, 240_000)

test('capability manifest covers every schema adapter and never promotes unverified native unlimited support', () => {
  expect(Object.keys(ENGINE_CAPABILITIES).sort()).toEqual([...EngineConfigSchema.shape.adapter.options].sort())
  for (const adapter of EngineConfigSchema.shape.adapter.options) {
    if (adapter === 'mock') continue
    expect(EngineConfigSchema.safeParse({ adapter, executionMode: 'supervised', timeoutMs: 0, idleTimeoutMs: 60_000 }).success).toBe(false)
    expect(() => assertExecutionMode({ adapter, executionMode: 'supervised' })).toThrow('unverified')
  }
  expect(EngineConfigSchema.safeParse({ adapter: 'agy', timeoutMs: 0, idleTimeoutMs: 60_000 }).success).toBe(false)
})
