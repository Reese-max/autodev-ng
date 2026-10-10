import { createHash } from 'node:crypto'
import { afterEach, expect, test, vi } from 'vitest'
import {
  lstatSync, mkdirSync, mkdtempSync, opendirSync, readFileSync, readSync,
  readdirSync, renameSync, rmSync, writeFileSync, type Dir, type Stats,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inspectHerdrCompletion } from '../src/engines/herdr-inspection.js'
import { captureHerdrResultFile, HERDR_RESULT_MAX_BYTES } from '../src/engines/herdr-result.js'
import { captureExecutionReadonly, MAX_TRACKED_EXECUTION_FILES } from '../src/engines/execution-observation.js'
import { HerdrEngine } from '../src/engines/herdr.js'
import { PreflightCache } from '../src/preflight.js'
import type { runProcess } from '../src/engines/proc.js'

vi.mock('node:fs', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return { ...actual, lstatSync: vi.fn(actual.lstatSync), readSync: vi.fn(actual.readSync),
    opendirSync: vi.fn(actual.opendirSync), readdirSync: vi.fn(actual.readdirSync) }
})

const actualFs = await vi.importActual<typeof import('node:fs')>('node:fs')
const roots: string[] = []
const digest = (raw: Buffer | string) => createHash('sha256').update(raw).digest('hex')
const base = 'a'.repeat(40)

afterEach(() => {
  vi.restoreAllMocks()
  vi.mocked(lstatSync).mockReset().mockImplementation(actualFs.lstatSync)
  vi.mocked(readSync).mockReset().mockImplementation(actualFs.readSync)
  vi.mocked(opendirSync).mockReset().mockImplementation(actualFs.opendirSync)
  vi.mocked(readdirSync).mockReset().mockImplementation(actualFs.readdirSync)
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'adng-herdr-inspect-')); roots.push(root)
  const data = join(root, 'data'), project = join(root, 'worktree')
  mkdirSync(project)
  mkdirSync(join(data, 'executions', 'active'), { recursive: true })
  mkdirSync(join(data, 'herdr'))
  const executionId = 'fixture-execution', taskId = 'task-a'
  const requestId = `adng-${taskId}-${base.slice(0, 8)}-${executionId}`
  const snapshot = { version: 1, executionId, taskId, projectPath: project, adapter: 'herdr',
    hostPid: 123, hostStartedAt: 10, startedAt: 20, observedAt: 30, sequence: 0,
    phase: 'unknown', outputBytes: 0, unknownSamples: 0, degraded: false, cancelRequested: false,
    sessionId: 'independent-worker-thread' }
  const expected = { schemaVersion: 1 as const, requestId, executionId, taskId, repo: project, baseCommit: base,
    session: 'herdr-autopilot', launcher: join(root, 'owned-launcher.ps1'), issuedAt: '2000-01-01T00:00:00.000Z' }
  const result = { schemaVersion: 1, requestId, executionId, taskId, repo: project, baseCommit: base,
    session: expected.session, server: 'owned-server-1', pane: 'owned-pane-1', status: 'done',
    detail: 'ordinary producer detail not printed' }
  const snapshotFile = join(data, 'executions', 'active', executionId + '.json')
  const expectedFile = join(data, 'herdr', requestId + '.expected.json')
  const resultFile = join(data, 'herdr', requestId + '.result.json')
  writeFileSync(snapshotFile, JSON.stringify(snapshot))
  writeFileSync(expectedFile, JSON.stringify(expected))
  writeFileSync(resultFile, JSON.stringify(result))
  return { root, data, project, executionId, taskId, requestId, snapshot, expected, result, snapshotFile, expectedFile, resultFile }
}

function byteInventory(folder: string): Record<string, string> {
  const out: Record<string, string> = {}
  function visit(current: string, relative: string) {
    for (const entry of actualFs.readdirSync(current, { withFileTypes: true })) {
      const name = relative + entry.name, path = join(current, entry.name)
      out[name + (entry.isDirectory() ? '/' : '')] = entry.isDirectory() ? 'directory' : digest(actualFs.readFileSync(path))
      if (entry.isDirectory()) visit(path, name + '/')
    }
  }
  visit(folder, ''); return out
}

test('repeated actual-file inspection is zero-write and emits only correlated-v1 evidence', () => {
  const f = fixture(), before = byteInventory(f.root)
  const run = vi.spyOn(HerdrEngine.prototype, 'run').mockRejectedValue(new Error('dispatch must not occur'))
  const preflight = vi.spyOn(HerdrEngine.prototype, 'preflight').mockRejectedValue(new Error('preflight must not occur'))
  const first = inspectHerdrCompletion(f.data, { executionId: f.executionId })
  expect(first).toMatchObject({ status: 'correlated-v1-done', readonly: true, dispatched: false,
    hostCommitted: false, trustedTerminal: false, trustedServerPaneOccupant: 'UNVERIFIED',
    deadlineOrExpiry: 'UNVERIFIED', deliveryVerified: false,
    evidence: { resultSha256: digest(readFileSync(f.resultFile)) } })
  expect(inspectHerdrCompletion(f.data, { executionId: f.executionId, requestId: f.requestId })).toEqual(first)
  expect(byteInventory(f.root)).toEqual(before)
  expect(run).not.toHaveBeenCalled(); expect(preflight).not.toHaveBeenCalled()
  expect(JSON.stringify(first)).not.toContain(f.result.detail)
  expect(JSON.stringify(first)).not.toContain(f.expected.launcher)
  expect(JSON.stringify(first)).not.toContain(f.result.server)
})

test('failed v1 is a correlation fact and never a trusted or delivered task', () => {
  const f = fixture(); writeFileSync(f.resultFile, JSON.stringify({ ...f.result, status: 'failed' }))
  expect(inspectHerdrCompletion(f.data, { executionId: f.executionId })).toMatchObject({ status: 'correlated-v1-failed', trustedTerminal: false, deliveryVerified: false })
})

test('missing result remains unknown, without resending or creating missing files', () => {
  const f = fixture(); rmSync(f.resultFile)
  const before = byteInventory(f.root)
  expect(inspectHerdrCompletion(f.data, { executionId: f.executionId })).toMatchObject({ status: 'missing', reason: 'result-missing-or-unsupported' })
  expect(byteInventory(f.root)).toEqual(before)
})

test('untracked bounded execution does not create a data directory or inventory lock', () => {
  const f = fixture(), absent = join(f.root, 'absent-data'), before = byteInventory(f.root)
  expect(inspectHerdrCompletion(absent, { executionId: f.executionId })).toMatchObject({ status: 'untracked', reason: 'execution-missing' })
  expect(byteInventory(f.root)).toEqual(before)
})

test.each(['active', 'history', 'legacy'] as const)('existing %s snapshot is read without migration or archive', location => {
  const f = fixture()
  if (location !== 'active') {
    const path = location === 'history' ? join(f.data, 'executions', 'history', f.executionId + '.json') : join(f.data, 'executions', f.executionId + '.json')
    if (location === 'history') mkdirSync(join(f.data, 'executions', 'history'))
    writeFileSync(path, readFileSync(f.snapshotFile)); rmSync(f.snapshotFile)
  }
  const before = byteInventory(f.root)
  expect(captureExecutionReadonly(f.data, f.executionId)).toMatchObject({ ok: true, location })
  expect(inspectHerdrCompletion(f.data, { executionId: f.executionId }).status).toBe('correlated-v1-done')
  expect(byteInventory(f.root)).toEqual(before)
})

test('duplicate active/history or active/legacy identity is denied without repairing it', () => {
  for (const location of ['history', 'legacy']) {
    const f = fixture(), path = location === 'history' ? join(f.data, 'executions', 'history', f.executionId + '.json') : join(f.data, 'executions', f.executionId + '.json')
    if (location === 'history') mkdirSync(join(f.data, 'executions', 'history'))
    writeFileSync(path, readFileSync(f.snapshotFile)); const before = byteInventory(f.root)
    expect(inspectHerdrCompletion(f.data, { executionId: f.executionId })).toMatchObject({ status: 'conflict', reason: 'execution-conflict' })
    expect(byteInventory(f.root)).toEqual(before)
  }
})

test('two current expected requests fail closed; no newest-issuedAt or selector override', () => {
  const f = fixture(), secondRequest = `adng-${f.taskId}-bbbbbbbb-${f.executionId}`
  writeFileSync(join(f.data, 'herdr', secondRequest + '.expected.json'), JSON.stringify({ ...f.expected, requestId: secondRequest, baseCommit: 'b'.repeat(40), issuedAt: '2026-10-09T00:00:00.000Z' }))
  const before = byteInventory(f.root)
  expect(inspectHerdrCompletion(f.data, { executionId: f.executionId, requestId: f.requestId })).toMatchObject({ status: 'conflict', reason: 'expected-conflict' })
  expect(byteInventory(f.root)).toEqual(before)
})

test('caller selector cannot substitute another stored request', () => {
  const f = fixture(), before = byteInventory(f.root)
  expect(inspectHerdrCompletion(f.data, { executionId: f.executionId, requestId: 'different-request' })).toMatchObject({ status: 'mismatch', reason: 'request-selector-mismatch' })
  expect(byteInventory(f.root)).toEqual(before)
})

test('snapshot adapter/identity/schema and stored expected bindings are checked independently', () => {
  const cases = [
    { snapshot: { adapter: 'mock' }, expectedStatus: 'mismatch' },
    { snapshot: { executionId: 'another-execution' }, expectedStatus: 'invalid' },
    { snapshot: { sequence: -1 }, expectedStatus: 'invalid' },
    { expected: { executionId: 'another-execution' }, expectedStatus: 'mismatch' },
    { expected: { taskId: 'another-task' }, expectedStatus: 'mismatch' },
    { expected: { repo: 'another-owned-project' }, expectedStatus: 'mismatch' },
    { expected: { requestId: 'another-request' }, expectedStatus: 'mismatch' },
    { expected: { session: null }, expectedStatus: 'invalid' },
    { expected: { schemaVersion: 2 }, expectedStatus: 'unsupported' },
  ]
  for (const c of cases) {
    const f = fixture()
    writeFileSync(f.snapshotFile, JSON.stringify({ ...f.snapshot, ...c.snapshot }))
    writeFileSync(f.expectedFile, JSON.stringify({ ...f.expected, ...c.expected }))
    expect(inspectHerdrCompletion(f.data, { executionId: f.executionId }).status).toBe(c.expectedStatus)
  }
})

test('strict v1 rejects mismatched fields, malformed records and unsupported versions without raw detail', () => {
  for (const patch of [{ executionId: 'different' }, { requestId: 'different' }, { repo: 'different' },
    { taskId: 'different' }, { baseCommit: 'b'.repeat(40) }, { session: 'different' }, { candidateCommit: 'b'.repeat(40) }]) {
    const f = fixture(); writeFileSync(f.resultFile, JSON.stringify({ ...f.result, ...patch }))
    expect(inspectHerdrCompletion(f.data, { executionId: f.executionId })).toMatchObject({ status: 'mismatch', reason: 'result-mismatch' })
  }
  for (const [raw, status] of [['{', 'invalid'], ['[]', 'invalid'], [JSON.stringify({ schemaVersion: 2 }), 'unsupported']]) {
    const f = fixture(); writeFileSync(f.resultFile, raw!)
    expect(inspectHerdrCompletion(f.data, { executionId: f.executionId }).status).toBe(status)
  }
})

test('snapshot, expected and result byte caps are retained without unbounded reads', () => {
  for (const kind of ['snapshot', 'expected', 'result']) {
    const f = fixture(), path = kind === 'snapshot' ? f.snapshotFile : kind === 'expected' ? f.expectedFile : f.resultFile
    writeFileSync(path, 'x'.repeat(kind === 'snapshot' ? 16_385 : HERDR_RESULT_MAX_BYTES + 1))
    expect(inspectHerdrCompletion(f.data, { executionId: f.executionId }).status).toBe('invalid')
  }
})

test.each(['snapshot', 'expected', 'result'] as const)('%s symlink/nonregular metadata is refused before following it (inert metadata fixture)', async kind => {
  const f = fixture(), file = kind === 'snapshot' ? f.snapshotFile : kind === 'expected' ? f.expectedFile : f.resultFile
  vi.mocked(lstatSync).mockImplementation(((path: string) => path === file
    ? { ...actualFs.lstatSync(file), isFile: () => false, isSymbolicLink: () => true } as Stats
    : actualFs.lstatSync(path)) as typeof lstatSync)
  expect(inspectHerdrCompletion(f.data, { executionId: f.executionId }).status).toBe('invalid')
})

test('expected enumeration stops at the inherited cap using the iterator, not readdir arrays', () => {
  const f = fixture(); let reads = 0; const closed = vi.fn()
  vi.mocked(opendirSync).mockImplementationOnce(() => ({ readSync: () => { reads++; return { name: 'unrelated-file', isFile: () => true } }, closeSync: closed } as unknown as Dir))
  vi.mocked(readdirSync).mockClear()
  expect(inspectHerdrCompletion(f.data, { executionId: f.executionId })).toMatchObject({ status: 'unavailable', reason: 'store-capacity' })
  expect(reads).toBe(MAX_TRACKED_EXECUTION_FILES + 1); expect(closed).toHaveBeenCalledTimes(1)
  expect(readdirSync).not.toHaveBeenCalled()
})

function changeAfterThirdRead(change: () => void) {
  let reads = 0
  vi.mocked(readSync).mockImplementation(((fd: number, buffer: Buffer, offset: number, length: number, position: number | null) => {
    const n = actualFs.readSync(fd, buffer, offset, length, position)
    if (++reads === 3) change()
    return n
  }) as typeof readSync)
}

test('snapshot hash/location change after result capture denies the unstable observation', () => {
  const f = fixture()
  changeAfterThirdRead(() => writeFileSync(f.snapshotFile, JSON.stringify({ ...f.snapshot, sequence: 1 })))
  expect(inspectHerdrCompletion(f.data, { executionId: f.executionId })).toMatchObject({ status: 'changing', reason: 'selection-changed' })
})

test('identical confirmed terminal snapshot archived after capture changes selected location', () => {
  const f = fixture()
  writeFileSync(f.snapshotFile, JSON.stringify({ ...f.snapshot, phase: 'terminal', outcome: 'completed', exit: { code: 0, reason: 'exit' } }))
  changeAfterThirdRead(() => {
    mkdirSync(join(f.data, 'executions', 'history'))
    renameSync(f.snapshotFile, join(f.data, 'executions', 'history', f.executionId + '.json'))
  })
  expect(inspectHerdrCompletion(f.data, { executionId: f.executionId })).toMatchObject({ status: 'changing', reason: 'selection-changed' })
})

test.each(['hash', 'second-selection'])('expected %s change after result capture denies observation', kind => {
  const f = fixture()
  changeAfterThirdRead(() => {
    if (kind === 'hash') writeFileSync(f.expectedFile, JSON.stringify({ ...f.expected, issuedAt: '2001-01-01T00:00:00.000Z' }))
    else {
      const requestId = `adng-${f.taskId}-bbbbbbbb-${f.executionId}`
      writeFileSync(join(f.data, 'herdr', requestId + '.expected.json'), JSON.stringify({ ...f.expected, requestId, baseCommit: 'b'.repeat(40) }))
    }
  })
  expect(inspectHerdrCompletion(f.data, { executionId: f.executionId })).toMatchObject({ status: 'changing', reason: 'selection-changed' })
})

test('result digest is the same parsed bounded bytes, even if producer later changes the file', () => {
  const f = fixture(), parsedBytes = readFileSync(f.resultFile)
  changeAfterThirdRead(() => writeFileSync(f.resultFile, JSON.stringify({ ...f.result, status: 'failed' })))
  const pointInTime = inspectHerdrCompletion(f.data, { executionId: f.executionId })
  expect(pointInTime).toMatchObject({ status: 'correlated-v1-done', trustedTerminal: false,
    evidence: { resultSha256: digest(parsedBytes), resultBytes: parsedBytes.length } })
  expect(digest(readFileSync(f.resultFile))).not.toBe(pointInTime.evidence?.resultSha256)
  expect(inspectHerdrCompletion(f.data, { executionId: f.executionId })).toMatchObject({ status: 'correlated-v1-failed', trustedTerminal: false })
})

test('capture helper hashes exactly the existing checker bytes without rereading the path', () => {
  const f = fixture(), parsedBytes = readFileSync(f.resultFile)
  vi.mocked(readSync).mockImplementationOnce(((fd: number, buffer: Buffer, offset: number, length: number, position: number | null) => {
    const n = actualFs.readSync(fd, buffer, offset, length, position)
    writeFileSync(f.resultFile, JSON.stringify({ ...f.result, status: 'failed' })); return n
  }) as typeof readSync)
  const capture = captureHerdrResultFile(f.resultFile, f.expected)
  expect(capture).toMatchObject({ check: { ok: true, result: { status: 'done' } }, evidence: { sha256: digest(parsedBytes), bytes: parsedBytes.length } })
})

test('old issuedAt and different nonempty producer identities remain explicitly unverified', () => {
  const f = fixture()
  for (const producer of [{ server: 'owned-server-1', pane: 'owned-pane-1' }, { server: 'owned-server-2', pane: 'owned-pane-2' }]) {
    writeFileSync(f.resultFile, JSON.stringify({ ...f.result, ...producer }))
    expect(inspectHerdrCompletion(f.data, { executionId: f.executionId })).toMatchObject({ status: 'correlated-v1-done', trustedTerminal: false,
      trustedServerPaneOccupant: 'UNVERIFIED', deadlineOrExpiry: 'UNVERIFIED' })
  }
})

test.each(['fixture-execution', 'owned-long-' + 'a'.repeat(70)])('inspection locator matches unchanged actual run producer for %s', async executionId => {
  const f = fixture(), taskId = 'task/a:b'
  rmSync(f.snapshotFile); rmSync(f.expectedFile); rmSync(f.resultFile)
  writeFileSync(join(f.project, '.adng-worktree'), '{}')
  const commit = vi.fn(() => 'b'.repeat(40)), calls: Parameters<typeof runProcess>[0][] = []
  const runner: typeof runProcess = async opts => {
    calls.push(opts)
    const arg = (name: string) => opts.args[opts.args.indexOf(name) + 1]!
    writeFileSync(arg('-ResultFile'), JSON.stringify({ ...f.result, requestId: arg('-RequestId'), executionId: arg('-ExecutionId'), taskId, repo: opts.cwd }))
    return { exitCode: 0, stdout: '', stderr: '', timedOut: false, durationMs: 1 }
  }
  const engine = new HerdrEngine({ command: f.expected.launcher, cache: new PreflightCache(join(f.root, 'owned-cache.json')), dataDir: f.data,
    runProcess: runner, getCommitHash: () => base, commitChanges: commit })
  expect(await engine.run({ projectPath: f.project, task: { id: taskId, text: 'owned fixture', line: 1, status: 'open' }, executionId })).toMatchObject({ ok: true })
  writeFileSync(join(f.data, 'executions', 'active', executionId + '.json'), JSON.stringify({ ...f.snapshot, executionId, taskId }))
  const before = byteInventory(f.root)
  expect(inspectHerdrCompletion(f.data, { executionId }).status).toBe('correlated-v1-done')
  expect(calls).toHaveLength(1); expect(commit).toHaveBeenCalledTimes(1)
  expect(byteInventory(f.root)).toEqual(before)
})
