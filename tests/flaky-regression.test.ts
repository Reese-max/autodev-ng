import { afterEach, expect, test, vi } from 'vitest'
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
    args: ['vitest', 'run', '--reporter=dot'],
    cwd: 'repo',
    stdinText: '',
    timeoutMs: 15 * 60_000,
  })
  expect(run).toHaveBeenNthCalledWith(2, expect.objectContaining({
    command: 'npx',
    args: ['vitest', 'run', '--reporter=dot'],
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
