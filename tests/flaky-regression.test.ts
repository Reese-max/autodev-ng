import { afterEach, expect, test, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { CI_ROUND_TIMEOUT_MS, aggregateRegressionShards, discoverRegressionManifest, partitionSpecs, runRegressionShard, validateRegressionRound, type RegressionManifest, type RegressionShardReceipt } from '../src/engines/regression-shards.js'
import {
  FIXED_CANDIDATE_SPECS,
  LOCKED_FLAKY_SPEC,
  flakyRegressionMain,
  keyFixtureStatus,
  regressionDiagnostic,
} from '../src/engines/flaky-regression.js'
import {
  DEFAULT_FIXED_CLOCK_ISO,
  FIXTURE_IO_TIMEOUT_MS,
} from '../src/engines/test-isolation.js'
import type { ProcResult } from '../src/engines/proc.js'

const result = (overrides: Partial<ProcResult> = {}): ProcResult => ({
  exitCode: 0,
  stdout: '',
  stderr: '',
  timedOut: false,
  durationMs: 123,
  ...overrides,
})

afterEach(() => vi.restoreAllMocks())

test('FIXED_CANDIDATE_SPECS 含二分鎖定與高頻兩條，且 LOCKED 別名一致', () => {
  expect(FIXED_CANDIDATE_SPECS).toHaveLength(3)
  expect(LOCKED_FLAKY_SPEC).toBe(FIXED_CANDIDATE_SPECS[0])
  expect(FIXED_CANDIDATE_SPECS[0]).toContain('只讀檢查')
  expect(FIXED_CANDIDATE_SPECS[1]).toContain('重啟前首次隔離')
  expect(FIXED_CANDIDATE_SPECS[2]).toContain('寫入隔離+晉升')
})

test('keyFixtureStatus：reuse-current 訊號 + 隔離契約期望值', () => {
  const status = keyFixtureStatus("AssertionError: expected 'reuse-current' to be 'context'")
  expect(status).toEqual({
    isolatedWorkspace: 'required',
    fixedClockIso: DEFAULT_FIXED_CLOCK_ISO,
    fixtureIoTimeoutMs: FIXTURE_IO_TIMEOUT_MS,
    cacheClearedBetweenTests: true,
    failureSignal: 'reuse-current',
  })
})

test('keyFixtureStatus：隔離漏判與 timeout 訊號', () => {
  expect(keyFixtureStatus("expected [] to include 'qwen'").failureSignal).toBe('isolation-miss')
  expect(keyFixtureStatus('Error: connect ETIMEDOUT').failureSignal).toBe('timeout')
  expect(keyFixtureStatus('').failureSignal).toBe('none')
})

test('以完整 dot suite 連續跑兩輪', async () => {
  const run = vi.fn(async () => result())
  vi.spyOn(console, 'log').mockImplementation(() => {})

  await expect(flakyRegressionMain('repo', run)).resolves.toBe(0)
  expect(run).toHaveBeenCalledTimes(2)
  expect(run).toHaveBeenNthCalledWith(1, {
    command: 'npx',
    args: ['vitest', 'run', '--reporter=dot', '--reporter=default'],
    cwd: 'repo',
    stdinText: '',
    timeoutMs: 20 * 60_000,
  })
  expect(run).toHaveBeenNthCalledWith(2, expect.objectContaining({
    command: 'npx',
    args: ['vitest', 'run', '--reporter=dot', '--reporter=default'],
  }))
})

test('首輪候選失敗仍完成第二輪，診斷含 spec／輪次／fixture 狀態', async () => {
  const failed = result({
    exitCode: 1,
    stdout: ` FAIL  ${LOCKED_FLAKY_SPEC}\nAssertionError: expected 'reuse-current' to be 'context'`,
  })
  const run = vi.fn()
    .mockResolvedValueOnce(failed)
    .mockResolvedValueOnce(result())
  vi.spyOn(console, 'log').mockImplementation(() => {})
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})

  await expect(flakyRegressionMain('repo', run)).resolves.toBe(1)
  expect(run).toHaveBeenCalledTimes(2)
  expect(error).toHaveBeenCalledOnce()
  expect(error).toHaveBeenCalledWith(regressionDiagnostic(1, failed), failed.stdout, failed.stderr)
  const line = error.mock.calls[0]![0] as string
  expect(line).toBe(regressionDiagnostic(1, failed))
  expect(line).toContain('round=1/2')
  expect(line).toContain(`spec=${JSON.stringify(LOCKED_FLAKY_SPEC)}`)
  expect(line).toContain('target=candidate')
  expect(line).toContain('"failureSignal":"reuse-current"')
  expect(line).toContain(`"fixedClockIso":"${DEFAULT_FIXED_CLOCK_ISO}"`)
  expect(line).toContain(`"fixtureIoTimeoutMs":${FIXTURE_IO_TIMEOUT_MS}`)
  expect(line).toContain('"isolatedWorkspace":"required"')
  expect(line).toContain('"cacheClearedBetweenTests":true')
  expect(line).toContain("expected 'reuse-current' to be 'context'")
})

test('高頻候選 spec 失敗時優先標 target=candidate 並帶 fixture', () => {
  const highFreq = FIXED_CANDIDATE_SPECS[1]!
  const failed = result({
    exitCode: 1,
    stdout: [
      ` FAIL  tests/unrelated.test.ts > other`,
      `Error: boom`,
      ` FAIL  ${highFreq}`,
      `AssertionError: expected [] to include 'qwen'`,
    ].join('\n'),
  })
  const line = regressionDiagnostic(2, failed)
  expect(line).toContain('round=2/2')
  expect(line).toContain(`spec=${JSON.stringify(highFreq)}`)
  expect(line).toContain('target=candidate')
  expect(line).toContain('"failureSignal":"isolation-miss"')
})

test('非候選失敗標 target=other；行程級失敗標 process', () => {
  const other = result({
    exitCode: 1,
    stdout: ' FAIL  tests/foo.test.ts > bar\nError: nope',
  })
  expect(regressionDiagnostic(1, other)).toContain('target=other')
  expect(regressionDiagnostic(1, other)).toContain('spec="tests/foo.test.ts > bar"')

  const processFail = result({
    exitCode: null,
    timedOut: true,
    stderr: 'vitest hung after suite',
  })
  const line = regressionDiagnostic(2, processFail)
  expect(line).toContain('target=process')
  expect(line).toContain('spec="(process)"')
  expect(line).toContain('timedOut=true')
  expect(line).toContain('fixture=')
})

test('兩輪皆失敗各自輸出診斷', async () => {
  const a = result({
    exitCode: 1,
    stdout: ` FAIL  ${FIXED_CANDIDATE_SPECS[2]}\nAssertionError: expected 'reuse-current' to be 'context'`,
  })
  const b = result({
    exitCode: 1,
    stdout: ' FAIL  tests/other.test.ts > x\nError: z',
  })
  const run = vi.fn()
    .mockResolvedValueOnce(a)
    .mockResolvedValueOnce(b)
  vi.spyOn(console, 'log').mockImplementation(() => {})
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})

  await expect(flakyRegressionMain('repo', run)).resolves.toBe(1)
  expect(error).toHaveBeenCalledTimes(2)
  expect(error.mock.calls[0]![0]).toContain('round=1/2')
  expect(error.mock.calls[0]![0]).toContain('target=candidate')
  expect(error.mock.calls[1]![0]).toContain('round=2/2')
  expect(error.mock.calls[1]![0]).toContain('target=other')
})

test('行程診斷保留實際耗時、有界預算與 timeout 原因', () => {
  const timedOut = result({
    exitCode: 1,
    timedOut: true,
    timeoutReason: 'wall',
    durationMs: 1_202_345,
  })
  const line = regressionDiagnostic(1, timedOut)
  expect(line).toContain('durationMs=1202345')
  expect(line).toContain('timeoutMs=1200000')
  expect(line).toContain('timeoutReason="wall"')
  expect(regressionDiagnostic(2, result({ timeoutReason: 'idle' }))).toContain('timeoutReason="idle"')
  expect(regressionDiagnostic(2, result())).toContain('timeoutReason=null')
})

test('每輪維持 20 分鐘有界預算，exit 0 但 timedOut 仍失敗且完成第二輪', async () => {
  const timedOut = result({
    exitCode: 0,
    timedOut: true,
    timeoutReason: 'wall',
    durationMs: 1_200_010,
    cleanup: { status: 'confirmed', reasonCodes: [], remainingPids: [], rootClosed: true },
  })
  const run = vi.fn()
    .mockResolvedValueOnce(timedOut)
    .mockResolvedValueOnce(result())
  vi.spyOn(console, 'log').mockImplementation(() => {})
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})

  await expect(flakyRegressionMain('repo', run)).resolves.toBe(1)
  expect(run).toHaveBeenCalledTimes(2)
  for (const [options] of run.mock.calls) {
    expect(options.timeoutMs).toBe(20 * 60_000)
    expect(options.args).toEqual(['vitest', 'run', '--reporter=dot', '--reporter=default'])
  }
  expect(error).toHaveBeenCalledOnce()
  expect(error).toHaveBeenCalledWith(regressionDiagnostic(1, timedOut), timedOut.stdout, timedOut.stderr)
  expect(error.mock.calls[0]![0]).toContain('exit=0 timedOut=true')
})

test('兩輪成功仍保留各自完整 stdout 與 stderr 供檔案耗時與 suite 摘要核對', async () => {
  const first = result({ stdout: '✓ tests/first.test.ts (2 tests) 10ms\nTest Files 1 passed (1)\nDuration 0.20s', stderr: 'first warning' })
  const second = result({ stdout: '✓ tests/second.test.ts (3 tests) 12ms\nTest Files 1 passed (1)\nDuration 0.25s', stderr: 'second warning' })
  const run = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second)
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})

  await expect(flakyRegressionMain('repo', run)).resolves.toBe(0)
  expect(run).toHaveBeenCalledTimes(2)
  expect(log).toHaveBeenCalledWith(first.stdout)
  expect(log).toHaveBeenCalledWith(second.stdout)
  expect(error).toHaveBeenCalledWith(first.stderr)
  expect(error).toHaveBeenCalledWith(second.stderr)
  expect(log.mock.calls[0]![0]).toContain('round=1/2 ok')
  expect(log.mock.calls[2]![0]).toContain('round=2/2 ok')
})

// Windows CI partitions must preserve the complete unfiltered suite and both rounds.
const fixtureDirs: string[] = []
afterEach(() => { for (const dir of fixtureDirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const manifest = (count = 260): RegressionManifest => ({ head: 'a'.repeat(40), tree: 'b'.repeat(40),
  files: Array.from({ length: count }, (_, i) => ({ path: `tests/spec-${String(i).padStart(3, '0')}.test.ts`, blob: 'c'.repeat(40) })) })
function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), 'adng-ci-shard-')); fixtureDirs.push(cwd)
  mkdirSync(join(cwd, 'tests'))
  for (let i = 0; i < 6; i++) writeFileSync(join(cwd, `tests/spec-${i}.test.ts`), `// reviewed ${i}\n`)
  const git = (...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim()
  git('init', '-q'); git('config', 'user.name', 'Synthetic CI'); git('config', 'user.email', 'ci@example.invalid')
  git('add', 'tests'); git('commit', '-qm', 'synthetic reviewed manifest')
  return { cwd, head: git('rev-parse', 'HEAD'), files: Array.from({ length: 6 }, (_, i) => `tests/spec-${i}.test.ts`) }
}
function frameworkReport(cwd: string, paths: string[], pending = false) {
  return { success: true, numFailedTests: 0, numFailedTestSuites: 0, numTotalTests: paths.length,
    testResults: paths.map((path, i) => ({ name: resolve(cwd, path), status: pending && i === 0 ? 'pending' : 'passed',
      assertionResults: [{ status: pending && i === 0 ? 'pending' : 'passed' }] })) }
}
function receipts(m = manifest(6)): RegressionShardReceipt[] {
  return [1, 2, 3].map(shard => {
    const selected = partitionSpecs(m, shard)
    return { schema: 'adng.windows-regression-shard/v1', platform: 'win32', runId: 'run-1', attempt: 2, shard, total: 3,
      manifest: m, manifestHash: hash(m), selected, complete: true, failures: [],
      rounds: [1, 2].map(round => validateRegressionRound(process.cwd(), frameworkReport(process.cwd(), selected, shard === 1), selected, round, 10)) }
  })
}
function fakeFramework(f: ReturnType<typeof fixture>, behavior: (opts: Parameters<typeof import('../src/engines/proc.js').runProcess>[0], round: number) => Partial<ProcResult> | 'missing' = () => ({})) {
  let round = 0
  return vi.fn(async (opts: Parameters<typeof import('../src/engines/proc.js').runProcess>[0]): Promise<ProcResult> => {
    if (opts.args?.includes('list')) return result({ stdout: JSON.stringify(f.files.map(file => ({ file: join(f.cwd, file) }))) })
    round++
    const special = behavior(opts, round)
    if (special !== 'missing') {
      const raw = opts.args!.find(a => a.startsWith('--outputFile.json='))!.slice('--outputFile.json='.length)
      const selected = opts.args!.filter(a => a.endsWith('.test.ts'))
      writeFileSync(raw, JSON.stringify(frameworkReport(f.cwd, selected)))
    }
    return result(special === 'missing' ? { stdout: 'PASS all selected specs' } : special)
  })
}

test('CI partition covers every sorted Git spec exactly once: 87/87/86, no built-in shard discovery', () => {
  const m = manifest(), partitions = [1, 2, 3].map(shard => partitionSpecs(m, shard))
  expect(partitions.map(p => p.length)).toEqual([87, 87, 86])
  expect(partitions.flat().sort()).toEqual(m.files.map(f => f.path))
  expect(new Set(partitions.flat()).size).toBe(260)
  expect(() => partitionSpecs({ ...m, files: [...m.files].reverse() }, 1)).toThrow()
  expect(() => partitionSpecs({ ...m, files: [m.files[0]!, ...m.files] }, 1)).toThrow()
  for (const shard of [0, 4, 1.5, NaN]) expect(() => partitionSpecs(m, shard)).toThrow()
})

test('actual temporary Git checkout creates two exact-file structured rounds at the unchanged bound', async () => {
  const f = fixture(), run = fakeFramework(f), dir = join(f.cwd, 'reports')
  vi.spyOn(console, 'log').mockImplementation(() => {})
  const options = { shard: 1, expectedHead: f.head, reportDir: dir, runId: 'local', attempt: 1 }
  await expect(runRegressionShard(f.cwd, options, run)).resolves.toBe(0)
  expect(run).toHaveBeenCalledTimes(3)
  expect(run.mock.calls[0]![0].args).toEqual(['vitest', 'list', '--filesOnly', '--json'])
  const receipt = JSON.parse(readFileSync(join(dir, 'shard-1.receipt.json'), 'utf8'))
  expect(receipt.complete).toBe(true); expect(receipt.rounds.map((r: { round: number }) => r.round)).toEqual([1, 2])
  expect(receipt.selected).toEqual(['tests/spec-0.test.ts', 'tests/spec-3.test.ts'])
  expect(receipt.manifest.files.every((s: { blob: string }) => /^[a-f0-9]{40}$/.test(s.blob))).toBe(true)
  for (const [opts] of run.mock.calls.slice(1)) {
    expect(opts.timeoutMs).toBe(CI_ROUND_TIMEOUT_MS); expect(opts.timeoutMs).toBe(1_200_000)
    expect(opts.args).toEqual(['vitest', 'run', ...receipt.selected.map((p: string) => resolve(f.cwd, p)), '--maxWorkers=1',
      '--reporter=dot', '--reporter=default', '--reporter=json', expect.stringContaining('--outputFile.json=')])
  }
  await expect(runRegressionShard(f.cwd, options, run)).rejects.toThrow('Stale shard receipt')
})

test('CI discovery refuses dirty, untracked, wrong-head or duplicate evidence before launching rounds', async () => {
  const f = fixture(), run = fakeFramework(f)
  await expect(discoverRegressionManifest(f.cwd, 'd'.repeat(40), run)).rejects.toThrow('head changed')
  writeFileSync(join(f.cwd, 'tests/spec-0.test.ts'), '// changed')
  await expect(discoverRegressionManifest(f.cwd, f.head, run)).rejects.toThrow()
  expect(run).not.toHaveBeenCalled()
  execFileSync('git', ['checkout', '--', 'tests'], { cwd: f.cwd, windowsHide: true })
  writeFileSync(join(f.cwd, 'tests/new.test.ts'), '// unreviewed')
  await expect(discoverRegressionManifest(f.cwd, f.head, run)).rejects.toThrow('Unreviewed spec')
  rmSync(join(f.cwd, 'tests/new.test.ts'))
  const duplicate = vi.fn(async () => result({ stdout: JSON.stringify([0, 0, 1].map(i => ({ file: join(f.cwd, f.files[i]!) }))) }))
  await expect(discoverRegressionManifest(f.cwd, f.head, duplicate)).rejects.toThrow('Duplicate')
  const omitted = vi.fn(async () => result({ stdout: JSON.stringify(f.files.slice(0, 3).map(file => ({ file: join(f.cwd, file) }))) }))
  await expect(discoverRegressionManifest(f.cwd, f.head, omitted)).rejects.toThrow('Full discovery omits')
})

test.each(['missing', 'timeout', 'cleanup-unknown', 'null-exit', 'assertion-failed'] as const)('CI %s never authorizes complete receipts or an unsafe next child', async mode => {
  const f = fixture(), run = fakeFramework(f, () => mode === 'missing' ? 'missing' : mode === 'timeout' ? { timedOut: true } : mode === 'null-exit' ? { exitCode: null }
    : mode === 'cleanup-unknown' ? { cleanup: { status: 'unknown', reasonCodes: ['TASKKILL_CONTROL_ERROR'], remainingPids: [], rootClosed: true, unconfirmedControlPids: [42] } }
      : { exitCode: 1 }), dir = join(f.cwd, 'reports')
  vi.spyOn(console, 'error').mockImplementation(() => {})
  await expect(runRegressionShard(f.cwd, { shard: 2, expectedHead: f.head, reportDir: dir, runId: 'run', attempt: 1 }, run)).resolves.toBe(1)
  const receipt = JSON.parse(readFileSync(join(dir, 'shard-2.receipt.json'), 'utf8'))
  expect(receipt.complete).toBe(false); expect(receipt.rounds).toEqual([]); expect(receipt.failures.length).toBeGreaterThan(0)
  expect(run).toHaveBeenCalledTimes(['timeout', 'cleanup-unknown', 'null-exit'].includes(mode) ? 2 : 3)
})

test('structured reports reject omissions, duplicates, overmatching paths, failed assertions and forged PASS text', () => {
  const selected = ['tests/a.test.ts', 'tests/b.test.ts'], cwd = process.cwd()
  const good = frameworkReport(cwd, selected)
  expect(validateRegressionRound(cwd, good, selected, 1, 1).files).toHaveLength(2)
  const cases = [undefined, 'PASS', { ...good, success: false }, { ...good, numTotalTests: 3 },
    frameworkReport(cwd, selected.slice(0, 1)), frameworkReport(cwd, [selected[0]!, selected[0]!]),
    frameworkReport(cwd, [...selected, 'tests/extra.test.ts']), frameworkReport(cwd, ['../outside.test.ts', selected[1]!])]
  for (const report of cases) expect(() => validateRegressionRound(cwd, report, selected, 1, 1)).toThrow()
  const failed = structuredClone(good); failed.testResults[0]!.assertionResults[0]!.status = 'failed'
  expect(() => validateRegressionRound(cwd, failed, selected, 1, 1)).toThrow()
})

test('aggregate preserves inherited pending specs but requires all 3 shards and both exact-head rounds', () => {
  const m = manifest(6), inputs = receipts(m)
  expect(aggregateRegressionShards(m, inputs, 'run-1', 2)).toMatchObject({ success: true, platform: 'win32', specs: 6, rounds: 2, shards: 3 })
  expect(() => aggregateRegressionShards(m, inputs.slice(0, 2), 'run-1', 2)).toThrow()
  expect(() => aggregateRegressionShards(m, [...inputs, inputs[0]], 'run-1', 2)).toThrow()
  expect(() => aggregateRegressionShards(m, [inputs[0], inputs[0], inputs[2]], 'run-1', 2)).toThrow()
  const noExecuted = structuredClone(inputs)
  for (const r of noExecuted) for (const round of r.rounds) for (const file of round.files) { file.status = 'pending'; file.skipped = file.tests }
  expect(() => aggregateRegressionShards(m, noExecuted, 'run-1', 2)).toThrow('No executed')
})

test.each(['sha', 'tree', 'blob', 'manifestHash', 'platform', 'runId', 'attempt', 'selected', 'round', 'missingRound', 'failed', 'incomplete', 'omission', 'duplicate', 'skipDrift', 'countDrift', 'zeroTests'] as const)('aggregate rejects %s without weakening coverage', mode => {
  const m = manifest(6), inputs = structuredClone(receipts(m)), first = inputs[0]!
  if (mode === 'sha') first.manifest.head = 'd'.repeat(40)
  if (mode === 'tree') first.manifest.tree = 'd'.repeat(40)
  if (mode === 'blob') first.manifest.files[0]!.blob = 'd'.repeat(40)
  if (mode === 'manifestHash') first.manifestHash = 'd'.repeat(64)
  if (mode === 'platform') first.platform = 'linux'
  if (mode === 'runId') first.runId = 'other-run'
  if (mode === 'attempt') first.attempt = 1
  if (mode === 'selected') first.selected.reverse()
  if (mode === 'round') first.rounds[1]!.round = 1
  if (mode === 'missingRound') first.rounds.pop()
  if (mode === 'failed') first.failures.push('round-1:failed')
  if (mode === 'incomplete') first.complete = false
  if (mode === 'omission') first.rounds[0]!.files.pop()
  if (mode === 'duplicate') first.rounds[0]!.files[1] = first.rounds[0]!.files[0]!
  if (mode === 'skipDrift') first.rounds[1]!.files[0]!.skipped = 0
  if (mode === 'countDrift') first.rounds[1]!.files[0]!.tests++
  if (mode === 'zeroTests') for (const r of first.rounds) { r.files[1]!.tests = 0; r.files[1]!.skipped = 0 }
  expect(() => aggregateRegressionShards(m, inputs, 'run-1', 2)).toThrow()
})
