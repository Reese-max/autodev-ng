import { afterEach, expect, test, vi } from 'vitest'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { HerdrEngine } from '../src/engines/herdr.js'
import { createExecutionObservation, readExecution } from '../src/engines/execution-observation.js'
import { PreflightCache } from '../src/preflight.js'
import type { runProcess } from '../src/engines/proc.js'

// Offline faults only: no launcher, provider, native stop or server is invoked.
const roots: string[] = []
afterEach(() => { vi.useRealTimers(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })
const task = { id: 'recovery-task', text: 'preserve the original writer', line: 1, status: 'open' as const }
const base = 'a'.repeat(40)
const timeout = { exitCode: 1, stdout: '', stderr: '', timedOut: true, durationMs: 1 }
function fixture(run?: typeof runProcess) {
  const root = mkdtempSync(join(tmpdir(), 'adng-herdr-recovery-')); roots.push(root)
  const launcher = join(root, 'launcher.ps1')
  writeFileSync(launcher, '# sentinel; never executed'); writeFileSync(join(root, '.adng-worktree'), '{}')
  const runner = vi.fn<typeof runProcess>(run ?? (async () => timeout)), commit = vi.fn<() => string | undefined>(() => 'b'.repeat(40))
  let head: string | undefined = base
  const engine = () => new HerdrEngine({ command: launcher, cache: new PreflightCache(join(root, 'cache.json')),
    dataDir: root, runProcess: runner, getCommitHash: () => head, commitChanges: commit })
  const job = { task, projectPath: root, executionId: 'original-execution' }
  return { root, job, runner, commit, engine, setHead: (sha: string | undefined) => { head = sha } }
}
const arg = (args: string[], flag: string) => args[args.indexOf(flag) + 1]!
function result(opts: Parameters<typeof runProcess>[0], patch: Record<string, unknown> = {}) {
  writeFileSync(arg(opts.args, '-ResultFile'), JSON.stringify({ schemaVersion: 1,
    requestId: arg(opts.args, '-RequestId'), executionId: arg(opts.args, '-ExecutionId'), repo: opts.cwd,
    taskId: task.id, baseCommit: base, server: 'old-server', session: 'herdr-autopilot', pane: 'reused-pane', status: 'done', ...patch }))
}
async function inspect(root: string) {
  const { reconcileHerdrExecution } = await import('../src/engines/herdr-recovery.js')
  return reconcileHerdrExecution(root, { executionId: 'original-execution' })
}

test('delivered prompt then timeout: a restarted controller preserves intent and never prompts twice', async () => {
  const f = fixture(async opts => { writeFileSync(join(opts.cwd, 'partial.txt'), 'original work'); return timeout })
  expect(await f.engine().run(f.job)).toMatchObject({ ok: false, recoveryRequired: true })
  const expected = join(f.root, 'herdr', 'adng-recovery-task-aaaaaaaa-original-execution.expected.json')
  const original = readFileSync(expected, 'utf8')
  expect(await f.engine().run(f.job)).toMatchObject({ ok: false, recoveryRequired: true })
  expect(f.runner).toHaveBeenCalledTimes(1)
  expect(readFileSync(expected, 'utf8')).toBe(original)
  expect(readFileSync(join(f.root, 'partial.txt'), 'utf8')).toBe('original work')
  expect(f.commit).not.toHaveBeenCalled()
})

test('concurrent controllers acquire only one durable dispatch intent', async () => {
  const f = fixture()
  await Promise.all([f.engine().run(f.job), f.engine().run(f.job)])
  expect(f.runner).toHaveBeenCalledTimes(1)
})

test('an existing execution cannot be resent under a different base SHA or task', async () => {
  const f = fixture()
  await f.engine().run(f.job); f.setHead('c'.repeat(40))
  expect(await f.engine().run({ ...f.job, task: { ...task, id: 'changed-task' } })).toMatchObject({ recoveryRequired: true })
  expect(f.runner).toHaveBeenCalledTimes(1)
})

test.each(['base', 'task'] as const)('legacy expected without inventory or dispatch fences a changed %s', async changed => {
  const f = fixture(); await f.engine().run(f.job)
  rmSync(join(f.root, 'herdr', 'dispatch'), { recursive: true })
  const expected = join(f.root, 'herdr', 'adng-recovery-task-aaaaaaaa-original-execution.expected.json')
  const bytes = readFileSync(expected, 'utf8')
  if (changed === 'base') f.setHead('c'.repeat(40))
  const job = changed === 'task' ? { ...f.job, task: { ...task, id: 'changed-task' } } : f.job
  expect(await f.engine().run(job)).toMatchObject({ recoveryRequired: true })
  expect(f.runner).toHaveBeenCalledTimes(1)
  expect(readFileSync(expected, 'utf8')).toBe(bytes)
  expect(readdirSync(join(f.root, 'herdr')).filter(name => name.endsWith('.expected.json'))).toHaveLength(1)
})

test.each(['marker', 'head'] as const)('existing dispatch stays quarantined when the worktree %s disappears', async missing => {
  const f = fixture(); await f.engine().run(f.job)
  if (missing === 'marker') rmSync(join(f.root, '.adng-worktree'))
  else f.setHead(undefined)
  expect(await f.engine().run(f.job)).toMatchObject({ recoveryRequired: true,
    backendRecovery: { state: 'unknown', backendStopConfirmed: false, redispatchAllowed: false } })
  expect(f.runner).toHaveBeenCalledTimes(1); expect(f.commit).not.toHaveBeenCalled()
})

test('completion before host receipt: restart only proposes validation, preserving SHA and never committing twice', async () => {
  const f = fixture(async opts => { result(opts); return timeout })
  const observer = createExecutionObservation({ dataDir: f.root, adapter: 'herdr', job: f.job })
  try {
    const first = await f.engine().run({ ...f.job, control: observer.control })
    expect(first).toMatchObject({ recoveryRequired: true, backendRecovery: { state: 'validation-required', backendStopConfirmed: false } })
    observer.finish('unconfirmed')
    const receipt = join(f.root, 'herdr', 'adng-recovery-task-aaaaaaaa-original-execution.result.json')
    const bytes = readFileSync(receipt, 'utf8')
    expect(await f.engine().run(f.job)).toMatchObject({ recoveryRequired: true })
    expect((await inspect(f.root)).recovery).toMatchObject({ state: 'validation-required', nextAction: 'verify-existing-result', redispatchAllowed: false })
    expect(JSON.parse(bytes).baseCommit).toBe(base)
    expect(readFileSync(receipt, 'utf8')).toBe(bytes)
    expect(f.runner).toHaveBeenCalledTimes(1); expect(f.commit).not.toHaveBeenCalled()
  } finally { observer.finish('unconfirmed') }
})

test('cancel and a replacement server/pane never authorize controlling the new occupant or releasing quarantine', async () => {
  const controller = new AbortController()
  const f = fixture(async opts => { result(opts, { server: 'replacement-server', pane: 'reused-pane' }); controller.abort(); return { ...timeout, aborted: true } })
  const first = await f.engine().run({ ...f.job, control: { signal: controller.signal } })
  expect(first).toMatchObject({ cancelled: true, recoveryRequired: true, backendRecovery: { state: 'unknown', backendStopConfirmed: false } })
  expect(await f.engine().run(f.job)).toMatchObject({ recoveryRequired: true })
  expect(f.runner).toHaveBeenCalledTimes(1); expect(f.commit).not.toHaveBeenCalled()
})

test('waiting-human survives an unconfirmed finish and controller restart with a distinct next action', async () => {
  const f = fixture(async opts => {
    opts.control?.onEvent?.({ type: 'output', stream: 'stdout', text: '{"type":"permission_request"}\n' })
    return timeout
  })
  const observer = createExecutionObservation({ dataDir: f.root, adapter: 'herdr', job: f.job })
  try {
    expect(await f.engine().run({ ...f.job, control: observer.control })).toMatchObject({
      recoveryRequired: true, backendRecovery: { state: 'waiting-human', nextAction: 'human-response-required' },
    })
    observer.finish('unconfirmed')
    expect(readExecution(f.root, f.job.executionId)).toMatchObject({ phase: 'unknown', backendRecovery: { state: 'waiting-human' } })
    expect((await inspect(f.root)).recovery).toMatchObject({ state: 'waiting-human', nextAction: 'human-response-required' })
    expect(f.runner).toHaveBeenCalledTimes(1); expect(observer.control.signal?.aborted).toBe(false)
  } finally { observer.finish('unconfirmed') }
})

test('long silence remains observation of the same request, with no automatic input or stop', async () => {
  vi.useFakeTimers()
  let release!: () => void
  const f = fixture(async () => { await new Promise<void>(resolve => { release = resolve }); return timeout })
  const observer = createExecutionObservation({ dataDir: f.root, adapter: 'herdr', job: f.job })
  const pending = f.engine().run({ ...f.job, control: observer.control })
  try {
    vi.setSystemTime(Date.now() + 3 * 60 * 60_000); observer.sample()
    expect((await inspect(f.root)).recovery).toMatchObject({ state: 'observing', nextAction: 'observe-same-request', backendStopConfirmed: false })
    expect(observer.control.signal?.aborted).toBe(false); expect(f.runner).toHaveBeenCalledTimes(1)
  } finally { release(); await pending; observer.finish('unconfirmed') }
})

test('unknown or corrupt dispatch evidence cannot be reclaimed or rewritten', async () => {
  const f = fixture(); await f.engine().run(f.job)
  const folder = join(f.root, 'herdr', 'dispatch')
  const file = join(folder, readdirSync(folder)[0]!)
  writeFileSync(file, '{interrupted intent')
  expect(await f.engine().run(f.job)).toMatchObject({ recoveryRequired: true, backendRecovery: { state: 'unknown' } })
  expect(readFileSync(file, 'utf8')).toBe('{interrupted intent'); expect(f.runner).toHaveBeenCalledTimes(1)
})

test.each(['corrupt', 'mismatched'] as const)('a done receipt cannot override a %s dispatch identity', async kind => {
  const f = fixture(async opts => { result(opts); return timeout }); await f.engine().run(f.job)
  const folder = join(f.root, 'herdr', 'dispatch'), file = join(folder, readdirSync(folder)[0]!)
  const bytes = kind === 'corrupt' ? '{interrupted intent' : JSON.stringify({ ...JSON.parse(readFileSync(file, 'utf8')), taskId: 'other-task' })
  writeFileSync(file, bytes)
  expect(await f.engine().run(f.job)).toMatchObject({ recoveryRequired: true,
    backendRecovery: { state: 'unknown', reason: 'dispatch-identity-unverified' } })
  expect(readFileSync(file, 'utf8')).toBe(bytes)
  expect(f.runner).toHaveBeenCalledTimes(1); expect(f.commit).not.toHaveBeenCalled()
})

test.each(['corrupt', 'conflicting', 'mismatched'] as const)('legacy %s expected evidence never creates a new trusted dispatch', async kind => {
  const f = fixture(async opts => { result(opts); return timeout }); await f.engine().run(f.job)
  rmSync(join(f.root, 'herdr', 'dispatch'), { recursive: true })
  const file = join(f.root, 'herdr', 'adng-recovery-task-aaaaaaaa-original-execution.expected.json')
  const expected = JSON.parse(readFileSync(file, 'utf8'))
  if (kind === 'conflicting') {
    const requestId = 'adng-recovery-task-cccccccc-original-execution'
    writeFileSync(join(f.root, 'herdr', `${requestId}.expected.json`), JSON.stringify({ ...expected, requestId, baseCommit: 'c'.repeat(40) }))
  } else writeFileSync(file, kind === 'corrupt' ? '{interrupted expected' : JSON.stringify({ ...expected, taskId: 'other-task' }))
  const bytes = readFileSync(file, 'utf8')
  for (let i = 0; i < 2; i++) expect(await f.engine().run(f.job)).toMatchObject({ recoveryRequired: true,
    backendRecovery: { state: 'unknown', reason: 'dispatch-identity-unverified' } })
  expect(readFileSync(file, 'utf8')).toBe(bytes)
  expect(readdirSync(join(f.root, 'herdr'))).not.toContain('dispatch')
  expect(f.runner).toHaveBeenCalledTimes(1); expect(f.commit).not.toHaveBeenCalled()
})

test('launcher transport exception after possible dispatch is a recoverable unknown, never a retry', async () => {
  const f = fixture(async () => { throw new Error('transport disconnected') })
  expect(await f.engine().run(f.job)).toMatchObject({ ok: false, recoveryRequired: true, backendRecovery: { state: 'unknown' } })
  expect(await f.engine().run(f.job)).toMatchObject({ recoveryRequired: true })
  expect(f.runner).toHaveBeenCalledTimes(1)
})

test.each(['throws', 'unchanged', 'missing'] as const)('host completion %s enters validation recovery before any no-commit nudge can be counted', async mode => {
  const f = fixture(async opts => { result(opts); return { ...timeout, exitCode: 0, timedOut: false } })
  f.commit.mockImplementation(() => { if (mode === 'throws') throw new Error('host write interrupted'); return mode === 'missing' ? undefined : base })
  expect(await f.engine().run(f.job)).toMatchObject({ ok: false, recoveryRequired: true,
    backendRecovery: { state: 'validation-required', nextAction: 'verify-existing-result' } })
  expect(f.runner).toHaveBeenCalledTimes(1); expect(f.commit).toHaveBeenCalledTimes(1)
})
