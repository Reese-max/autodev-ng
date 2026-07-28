import { readFileSync } from 'node:fs'
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

test('round 1／2 追蹤證據鎖定唯一候選與完整失敗上下文', () => {
  const report = JSON.parse(
    readFileSync(new URL('../docs/flaky-runs.json', import.meta.url), 'utf8')
  ) as { runs: FlakyRun[] }
  const rounds = report.runs.filter(run => run.round === 1 || run.round === 2)
  const candidate = 'tests/worktree.test.ts > prepareWorktree：殘留目錄被鎖住(前次中斷進程未退)時上拋且不砍分支——成果分支與 HEAD 完好保留；解鎖後重試自癒成功（2a929ec9 產線事故回歸測試）'

  expect(rounds.map(run => ({
    round: run.round,
    durationMs: run.durationMs,
    exitCode: run.exitCode,
    failureCount: run.failures.length,
  }))).toEqual([
    { round: 1, durationMs: 223_341, exitCode: 0, failureCount: 0 },
    { round: 2, durationMs: 269_917, exitCode: 1, failureCount: 1 },
  ])
  expect(rounds[1]!.failures[0]).toEqual({
    order: 1,
    spec: candidate,
    message: 'Error: waitForWriteLockState: C:\\Users\\ADMINI~1\\AppData\\Local\\Temp\\adng-wt-lmvMea\\worktrees\\abc12345\\result.txt 在 10000ms 內未達到 locked=true',
  })
  expect(summarizeFailures(rounds)).toEqual([{
    spec: candidate,
    failedRounds: [2],
    failureRate: 0.5,
    classification: 'intermittent',
  }])
})
