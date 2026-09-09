import { afterEach, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createExecutionObservation, executionFile, readExecutions, requestExecutionCancel } from '../src/engines/execution-observation.js'
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
  f.observer.finish('completed')
  expect(readExecutions(f.root).protected).toBe(false)
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
test('observer write failure leaves the previous active receipt; no worker cancellation', () => {
  const f = fixture()
  mkdirSync(`${f.file}.tmp`)
  f.observer.sample()
  expect(f.observer.snapshot().degraded).toBe(true)
  expect(f.observer.control.signal!.aborted).toBe(false)
  expect(readExecutions(f.root).protected).toBe(true)
  f.observer.finish('completed')
})
test('capability manifest covers every schema adapter and never promotes unverified native unlimited support', () => {
  expect(Object.keys(ENGINE_CAPABILITIES).sort()).toEqual([...EngineConfigSchema.shape.adapter.options].sort())
  for (const adapter of EngineConfigSchema.shape.adapter.options) {
    if (adapter === 'mock') continue
    expect(EngineConfigSchema.safeParse({ adapter, executionMode: 'supervised', timeoutMs: 0, idleTimeoutMs: 60_000 }).success).toBe(false)
    expect(() => assertExecutionMode({ adapter, executionMode: 'supervised' })).toThrow('unverified')
  }
  expect(EngineConfigSchema.safeParse({ adapter: 'agy', timeoutMs: 0, idleTimeoutMs: 60_000 }).success).toBe(false)
})
