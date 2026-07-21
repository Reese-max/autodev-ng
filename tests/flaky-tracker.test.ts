import { expect, test } from 'vitest'
import {
  flakyConclusion,
  parseVitestFailures,
  summarizeFailures,
  type FlakyRun,
} from '../src/engines/flaky-tracker.js'

test('解析 dot reporter 的失敗順序、spec 與訊息', () => {
  const output = [
    '\u001b[31m FAIL \u001b[39m tests/daemon.test.ts > daemon > retries',
    'AssertionError: expected 2 to be 1',
    ' ❯ tests/daemon.test.ts:10:12',
    '',
    ' FAIL  tests/lock.test.ts > lock cleanup',
    'Error: lock remained',
  ].join('\n')

  expect(parseVitestFailures(output)).toEqual([
    { order: 1, spec: 'tests/daemon.test.ts > daemon > retries', message: 'AssertionError: expected 2 to be 1' },
    { order: 2, spec: 'tests/lock.test.ts > lock cleanup', message: 'Error: lock remained' },
  ])
})

test('聚合間歇與固定失敗，找出唯一不穩定測試', () => {
  const runs: FlakyRun[] = [
    {
      round: 1,
      startedAt: '2026-07-21T00:00:00.000Z',
      durationMs: 100,
      exitCode: 1,
      timedOut: false,
      failures: [
        { order: 1, spec: 'tests/daemon.test.ts > flaky', message: 'timeout' },
        { order: 2, spec: 'tests/lock.test.ts > broken', message: 'locked' },
      ],
    },
    {
      round: 2,
      startedAt: '2026-07-21T00:00:01.000Z',
      durationMs: 90,
      exitCode: 1,
      timedOut: false,
      failures: [{ order: 1, spec: 'tests/lock.test.ts > broken', message: 'locked' }],
    },
  ]

  const frequencies = summarizeFailures(runs)
  expect(frequencies).toEqual([
    {
      spec: 'tests/lock.test.ts > broken',
      failedRounds: [1, 2],
      failureRate: 1,
      classification: 'consistent',
    },
    {
      spec: 'tests/daemon.test.ts > flaky',
      failedRounds: [1],
      failureRate: 0.5,
      classification: 'intermittent',
    },
  ])
  expect(flakyConclusion(frequencies)).toBe('唯一不穩定測試：tests/daemon.test.ts > flaky（1 輪，失敗率 50.0%）。')
})
