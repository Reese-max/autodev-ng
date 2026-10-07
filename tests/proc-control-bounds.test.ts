import { afterEach, expect, test, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import type { ChildProcess } from 'node:child_process'
import { killTree, runProcessControl, parseWindowsProcessSnapshot, type KillTreeDeps } from '../src/engines/proc.js'
import { flakyRegressionMain } from '../src/engines/flaky-regression.js'

afterEach(() => vi.restoreAllMocks())

async function observedSettlement(pending: Promise<unknown>, milliseconds = 200): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      pending.then(() => true),
      new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), milliseconds) }),
    ])
  } finally { if (timer) clearTimeout(timer) }
}

const boundedDeps = (extra: Record<string, unknown> = {}): KillTreeDeps => ({
  platform: 'win32', taskkill: async () => {}, wait: async () => {},
  listProcesses: async () => [], isAlive: () => false, kill: () => {},
  controlTimeoutMs: 30, cleanupTimeoutMs: 80,
  ...extra,
} as KillTreeDeps)

test('hung taskkill dependency cannot hold cleanup settlement indefinitely', async () => {
  const pending = killTree(4242, { command: 'controlled', deps: boundedDeps({ taskkill: () => new Promise<void>(() => {}) }) })
  expect(await observedSettlement(pending)).toBe(true)
  expect(await pending).toMatchObject({ status: 'unknown' })
})

test('hung CIM dependency is UNKNOWN rather than an empty complete process inventory', async () => {
  const pending = killTree(4242, { command: 'controlled', deps: boundedDeps({ listProcesses: () => new Promise(() => {}) }) })
  expect(await observedSettlement(pending)).toBe(true)
  expect(await pending).toMatchObject({ status: 'unknown' })
})

test('outer cleanup deadline prevents late helper completion from resuming PID operations', async () => {
  let release!: () => void
  const helper = new Promise<void>(resolve => { release = resolve })
  const listProcesses = vi.fn(async () => []), kill = vi.fn()
  const pending = killTree(4242, { command: 'controlled', deps: boundedDeps({
    taskkill: () => helper, controlTimeoutMs: 100, cleanupTimeoutMs: 20, listProcesses, kill,
  }) })
  try {
    expect(await observedSettlement(pending)).toBe(true)
    expect(await pending).toMatchObject({ status: 'unknown' })
  } finally { release() }
  await new Promise(resolve => setTimeout(resolve, 20))
  expect(listProcesses).not.toHaveBeenCalled()
  expect(kill).not.toHaveBeenCalled()
})

test('unknown timed-out cleanup does not authorize a second full-suite child', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const run = vi.fn(async () => ({ exitCode: 0, stdout: '', stderr: '', timedOut: true,
    durationMs: 123, cleanup: { status: 'unknown' as const, reasonCodes: ['CONTROL_TIMEOUT'], remainingPids: [4242], rootClosed: false } }))
  expect(await flakyRegressionMain('controlled', run)).toBe(1)
  expect(run).toHaveBeenCalledTimes(1)
})

test('aborted child does not authorize a successor even if close supplies exit zero', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const run = vi.fn(async () => ({ exitCode: 0, stdout: '', stderr: '', timedOut: false, aborted: true, durationMs: 123 }))
  expect(await flakyRegressionMain('controlled', run)).toBe(1)
  expect(run).toHaveBeenCalledTimes(1)
})

// These helper seams model missing callbacks/late callbacks, not kernel reaping.
const fakeControlChild = (): ChildProcess => {
  const child = new EventEmitter() as ChildProcess
  Object.assign(child, { pid: 33333, stdin: new PassThrough(), stdout: new PassThrough(), stderr: new PassThrough(),
    kill: vi.fn(() => false), unref: vi.fn() })
  return child
}

test('never-callback helper settles UNKNOWN and releases only its owned handles', async () => {
  const child = fakeControlChild()
  const pending = runProcessControl({ command: 'controlled', args: [], timeoutMs: 20, execute: () => child })
  ;(child.stdout as PassThrough).write('READY\n'); (child.stderr as PassThrough).write('raw helper diagnostic\n')
  expect(await pending).toMatchObject({ status: 'unknown', reasonCodes: ['CONTROL_TIMEOUT'], stdout: 'READY\n', stderr: 'raw helper diagnostic\n', pid: 33333 })
  expect(child.kill).toHaveBeenCalledWith('SIGKILL')
  expect(child.unref).toHaveBeenCalledOnce()
  expect(child.stdout!.destroyed).toBe(true)
  expect(child.stderr!.destroyed).toBe(true)
})

test('close without callback remains UNKNOWN and late success cannot change it', async () => {
  const child = fakeControlChild()
  let callback!: (error: Error | null, stdout: string, stderr: string) => void
  const pending = runProcessControl({ command: 'controlled', args: [], timeoutMs: 20,
    execute: (_command, _args, cb) => { callback = cb; return child } })
  child.emit('close', 0)
  const result = await pending
  callback(null, 'late complete inventory', '')
  expect(result).toMatchObject({ status: 'unknown', reasonCodes: ['CONTROL_TIMEOUT'], stdout: '' })
})

test('outer-generation cancellation releases a held helper and rejects late callback success', async () => {
  const child = fakeControlChild(), controller = new AbortController()
  let callback!: (error: Error | null, stdout: string, stderr: string) => void
  const pending = runProcessControl({ command: 'controlled', args: [], timeoutMs: 100,
    signal: controller.signal, execute: (_command, _args, cb) => { callback = cb; return child } })
  controller.abort()
  const result = await pending
  callback(null, 'late', '')
  expect(result).toMatchObject({ status: 'unknown', reasonCodes: ['CONTROL_CANCELLED'], stdout: '' })
  expect(child.unref).toHaveBeenCalledOnce()
})

test('an already cancelled generation never starts a helper', async () => {
  const controller = new AbortController(); controller.abort()
  const execute = vi.fn(() => fakeControlChild())
  expect(await runProcessControl({ command: 'controlled', args: [], signal: controller.signal, execute }))
    .toMatchObject({ status: 'unknown', reasonCodes: ['CONTROL_CANCELLED'] })
  expect(execute).not.toHaveBeenCalled()
})

test('synchronous execution errors cannot become a complete inventory', async () => {
  expect(await runProcessControl({ command: 'controlled', args: [], execute: () => { throw new Error('controlled refusal') } }))
    .toMatchObject({ status: 'unknown', reasonCodes: ['CONTROL_ERROR'] })
})

const processRow = (ProcessId: number, ParentProcessId = 0) => ({ ProcessId, ParentProcessId, CommandLine: null, Name: 'controlled.exe' })

test('native inventory admits legitimate System Idle PID zero while target PID must be positive', async () => {
  expect(parseWindowsProcessSnapshot(JSON.stringify([processRow(0), processRow(4242)])))
    .toMatchObject({ status: 'complete', processes: [{ pid: 0 }, { pid: 4242 }] })
  const taskkill = vi.fn(async () => {}), kill = vi.fn()
  for (const pid of [0, -1, NaN, 1.5]) {
    expect(await killTree(pid, { command: 'controlled', deps: boundedDeps({ taskkill, kill }) }))
      .toMatchObject({ status: 'unknown', reasonCodes: ['PID_UNAVAILABLE'] })
  }
  expect(taskkill).not.toHaveBeenCalled(); expect(kill).not.toHaveBeenCalled()
})

test.each(['', '[]', '{}', 'not json', 'null', JSON.stringify([processRow(4242), processRow(4242)]),
  JSON.stringify([processRow(4242), { ProcessId: 4243 }]), JSON.stringify(processRow(-1)),
  JSON.stringify({ ...processRow(4242), ParentProcessId: '0' }),
  JSON.stringify({ ...processRow(4242), CommandLine: 4 }),
])('empty, duplicate, partial or malformed CIM is UNKNOWN: %s', input => {
  expect(parseWindowsProcessSnapshot(input)).toMatchObject({ status: 'unknown', processes: [] })
})

test('permission error in liveness is UNKNOWN rather than proof of death', async () => {
  const report = await killTree(4242, { command: 'controlled', deps: boundedDeps({
    listProcesses: async () => [{ pid: 4242, command: 'controlled' }],
    isAlive: () => { throw Object.assign(new Error('permission'), { code: 'EPERM' }) },
  }) })
  expect(report).toMatchObject({ status: 'unknown', remainingPids: [4242] })
  expect(report.reasonCodes).toContain('PID_LIVENESS_UNKNOWN')
})

test('ESRCH confirms that PID absence without claiming historical tree absence', async () => {
  expect(await killTree(4242, { command: 'controlled', deps: boundedDeps({
    listProcesses: async () => [{ pid: 4242, command: 'controlled' }],
    isAlive: () => { throw Object.assign(new Error('absent'), { code: 'ESRCH' }) },
  }) })).toMatchObject({ status: 'unknown', reasonCodes: ['WINDOWS_DESCENDANT_HISTORY_UNCERTAIN'], remainingPids: [] })
})

test('surviving descendant has explicit UNKNOWN result and retained PID/event', async () => {
  const events = { append: vi.fn() }
  const report = await killTree(4242, { command: 'controlled', events, deps: boundedDeps({
    listProcesses: async () => [{ pid: 44445, parentPid: 4242, command: 'orphan' }],
    isAlive: (pid: number) => pid === 44445,
  }) })
  expect(report).toMatchObject({ status: 'unknown', remainingPids: [44445] })
  expect(events.append).toHaveBeenCalledWith('proc-zombie', { pid: 44445, command: 'orphan' })
})

test('observed root exit before close cannot authorize taskkill of a recycled numeric PID', async () => {
  const taskkill = vi.fn(async () => {}), kill = vi.fn()
  const report = await killTree(4242, { command: 'controlled', isRootExited: () => true, deps: boundedDeps({
    taskkill, kill, listProcesses: async () => [{ pid: 4242, command: 'new unrelated process' }], isAlive: () => true,
  }) })
  expect(report).toMatchObject({ status: 'unknown', reasonCodes: ['ROOT_PID_REUSED_OR_STALE_SNAPSHOT'] })
  expect(taskkill).not.toHaveBeenCalled(); expect(kill).not.toHaveBeenCalled()
})

test('root exit between enumeration and signaling refuses the numeric root kill', async () => {
  let exited = false
  const kill = vi.fn()
  const report = await killTree(4242, { command: 'controlled', isRootExited: () => exited, deps: boundedDeps({
    listProcesses: async () => [{ pid: 4242, command: 'controlled' }],
    isAlive: () => { exited = true; return true }, kill,
  }) })
  expect(report).toMatchObject({ status: 'unknown', reasonCodes: ['ROOT_EXITED_DURING_CLEANUP'] })
  expect(kill).not.toHaveBeenCalled()
})

test('unconfirmed spawn/process failure cannot authorize the next suite child', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const run = vi.fn(async () => ({ exitCode: null, stdout: '', stderr: 'spawn error', timedOut: false, durationMs: 1 }))
  expect(await flakyRegressionMain('controlled', run)).toBe(1)
  expect(run).toHaveBeenCalledTimes(1)
})


test.each([
  { status: 'confirmed' as const, rootClosed: false, remainingPids: [], reasonCodes: [] },
  { status: 'confirmed' as const, rootClosed: true, remainingPids: [4242], reasonCodes: [] },
  { status: 'confirmed' as const, rootClosed: true, remainingPids: [], reasonCodes: ['uncertain'] },
  { status: 'confirmed' as const, rootClosed: true, remainingPids: [], reasonCodes: [], unconfirmedControlPids: [33333] },
])('a contradictory confirmed cleanup label cannot authorize success or successor: %j', async cleanup => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  for (const timedOut of [false, true]) {
    const run = vi.fn(async () => ({ exitCode: 0, stdout: '', stderr: '', timedOut, durationMs: 1, cleanup }))
    expect(await flakyRegressionMain('controlled', run)).toBe(1)
    expect(run).toHaveBeenCalledTimes(1)
  }
})


test('a live orphan with a missing intermediate ancestor cannot become complete-tree certification', async () => {
  const report = await killTree(4242, { command: 'original-root', deps: boundedDeps({
    listProcesses: async () => [{ pid: 44445, parentPid: 4343, command: 'original-grandchild' }],
    isAlive: (pid: number) => pid === 44445,
  }) })
  expect(report).toMatchObject({ status: 'unknown', reasonCodes: ['WINDOWS_DESCENDANT_HISTORY_UNCERTAIN'] })
})


test('inventory PID zero cannot become a child signal target even in malformed ancestry', async () => {
  const kill = vi.fn()
  const report = await killTree(4242, { command: 'controlled', deps: boundedDeps({
    listProcesses: async () => [{ pid: 0, parentPid: 4242, command: 'malformed-idle-parent' }],
    isAlive: (pid: number) => pid === 0, kill,
  }) })
  expect(report.status).toBe('unknown')
  expect(report.reasonCodes).toContain('DESCENDANT_PID_INVALID')
  expect(kill).not.toHaveBeenCalled()
})
