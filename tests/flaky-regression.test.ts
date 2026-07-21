import { afterEach, expect, test, vi } from 'vitest'
import {
  LOCKED_FLAKY_SPEC,
  flakyRegressionMain,
  regressionDiagnostic,
} from '../src/engines/flaky-regression.js'
import type { ProcResult } from '../src/proc.js'

const result = (overrides: Partial<ProcResult> = {}): ProcResult => ({
  exitCode: 0,
  stdout: '',
  stderr: '',
  timedOut: false,
  durationMs: 123,
  ...overrides,
})

afterEach(() => vi.restoreAllMocks())

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

test('首輪失敗仍完成第二輪，並只輸出鎖定 spec 的單行診斷', async () => {
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
  expect(error).toHaveBeenCalledWith(regressionDiagnostic(1, failed))
  expect(error.mock.calls[0]![0]).toContain('target=locked')
  expect(error.mock.calls[0]![0]).toContain("expected 'reuse-current' to be 'context'")
})
