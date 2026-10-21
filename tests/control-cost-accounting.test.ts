import { afterEach, expect, test, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BacklogStore } from '../src/backlog.js'
import { RunDb, localDay } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine, type MockStep } from '../src/engines/mock.js'
import { combineRuns, costWithUnknownTurnEstimates } from '../src/engines/no-commit-nudge.js'
import { ControlStore } from '../src/engines/steering.js'
import { runOnce, type Deps } from '../src/scheduler.js'
import { ConfigSchema, type Job, type RunResult } from '../src/types.js'

const fixtures: { root: string; db: RunDb }[] = []
afterEach(() => {
  for (const { root, db } of fixtures.splice(0)) {
    try { db.close() } finally { rmSync(root, { recursive: true, force: true }) }
  }
})

function fixture(script: (enqueue: (job: Job, instruction: string) => void) => MockStep[]) {
  const root = mkdtempSync(join(tmpdir(), 'adng-control-cost-'))
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, stdio: 'ignore', timeout: 5_000, windowsHide: true })
  git('init', '-b', 'main'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
  git('config', 'core.autocrlf', 'false')
  writeFileSync(join(root, 'README.md'), '# Accounting fixture\n'); git('add', '.'); git('commit', '-m', 'initial fixture')
  const backlogFile = join(root, 'BACKLOG.md'); writeFileSync(backlogFile, '- [ ] Preserve every dispatched turn charge\n')
  const cfg = ConfigSchema.parse({ projectPath: root, backlogFile, dataDir: join(root, 'data'), defaultEngine: 'mock',
    engines: { mock: { adapter: 'mock', executionMode: 'observed' } }, timezoneOffsetHours: 0,
    stopFile: join(root, '.stop'), worktreesDir: join(root, 'worktrees'), failureCostEstimateUsd: 1, dailyHardUsd: 100 })
  const db = new RunDb(join(root, 'run.db')); fixtures.push({ root, db })
  const enqueue = (job: Job, instruction: string) => {
    expect(new ControlStore(cfg.dataDir).submit({ project: root, executionId: job.executionId!, mode: 'QUEUE',
      instruction, issuer: 'fixture', channel: 'test' }).ok).toBe(true)
  }
  const engine = new MockEngine(script(enqueue))
  const deps: Deps = { cfg, db, store: new BacklogStore(backlogFile), events: new EventLog(cfg.dataDir), engines: { resolve: () => engine } }
  return { deps, engine, day: () => localDay(new Date().toISOString(), 0) }
}

const failedTurns: [string, MockStep, number][] = [
  ['throws', { throw: 'queued transport unavailable' }, 6],
  ['has no reported cost', { ok: false, reason: 'queued timeout', costUsd: 0, costUnknown: true }, 6],
  ['reports less than its estimate', { ok: false, reason: 'queued timeout', costUsd: 0.4, costUnknown: true }, 6],
  ['reports more than its estimate', { ok: false, reason: 'queued timeout', costUsd: 2, costUnknown: true }, 7],
]

test.each(failedTurns)('two known turns plus a queued turn that %s retain prior spend and its own estimate', async (_label, failed, expected) => {
  const f = fixture(enqueue => [
    { ok: true, costUsd: 2, beforeResult: job => { enqueue(job, 'first follow-up') } },
    { ok: true, costUsd: 3, beforeResult: job => { enqueue(job, 'second follow-up') } },
    failed,
  ])
  expect(await runOnce(f.deps)).toBe('failed')
  expect(f.engine.calls).toHaveLength(3)
  expect(f.deps.db.billedCostForLocalDay(f.day(), 0, [])).toBe(expected)
  expect(f.deps.db.accountingForDay(f.day())).toMatchObject({ attempts: 1, estimatedUsd: expected, unknownCost: 0 })
})

test.each([0, 0.4, 2])('a single unknown result with reported cost %s keeps the existing floor', async costUsd => {
  const f = fixture(() => [{ ok: false, reason: 'timeout', costUsd, costUnknown: true }])
  expect(await runOnce(f.deps)).toBe('failed')
  expect(f.engine.calls).toHaveLength(1)
  expect(f.deps.db.billedCostForLocalDay(f.day(), 0, [])).toBe(Math.max(costUsd, 1))
})

test('a thrown no-commit nudge adds its unknown turn estimate to the known initial charge', async () => {
  const f = fixture(() => [{ ok: false, reason: 'no-commit: fixture', costUsd: 2 }, { throw: 'nudge transport unavailable' }])
  expect(await runOnce(f.deps)).toBe('failed')
  expect(f.engine.calls).toHaveLength(2)
  expect(f.deps.db.billedCostForLocalDay(f.day(), 0, [])).toBe(3)
})

test.each([[false, 2, 6], [true, 0, 0]] as const)('fixed/subscription charges remain per dispatch: subscription=%s', async (subscription, costPerRunUsd, nominal) => {
  const f = fixture(enqueue => [
    { ok: true, costUsd: 2, beforeResult: job => { enqueue(job, 'first fixed follow-up') } },
    { ok: true, costUsd: 3, beforeResult: job => { enqueue(job, 'second fixed follow-up') } },
    { throw: 'queued transport unavailable' },
  ])
  Object.assign(f.deps.cfg.engines.mock!, { costPerRunUsd, subscription })
  expect(await runOnce(f.deps)).toBe('failed')
  expect(f.engine.calls).toHaveLength(3)
  expect(f.deps.db.billedCostForLocalDay(f.day(), 0, [])).toBe(subscription ? 0 : nominal)
  expect(f.deps.db.accountingForDay(f.day())).toMatchObject({ estimatedUsd: subscription ? 0 : nominal, nominalUsd: subscription ? nominal : 0 })
})

test('subscription unknown-turn estimates remain nominal and never become metered spend', async () => {
  const f = fixture(enqueue => [
    { ok: true, costUsd: 2, beforeResult: job => { enqueue(job, 'first nominal follow-up') } },
    { ok: true, costUsd: 3, beforeResult: job => { enqueue(job, 'second nominal follow-up') } },
    { throw: 'queued transport unavailable' },
  ])
  f.deps.cfg.engines.mock!.subscription = true
  expect(await runOnce(f.deps)).toBe('failed')
  expect(f.deps.db.billedCostForLocalDay(f.day(), 0, [])).toBe(0)
  expect(f.deps.db.accountingForDay(f.day())).toMatchObject({ nominalUsd: 6, estimatedUsd: 0 })
})

test('nested result combination retains each unknown turn floor without mutating earlier receipts', () => {
  const known: RunResult = { ok: true, output: 'known', costUsd: 2 }
  const partial: RunResult = { ok: false, output: 'partial', costUsd: 5, costUnknown: true }
  const missing: RunResult = { ok: false, output: 'missing', costUsd: 0, costUnknown: true }
  const first = combineRuns(known, partial), before = structuredClone(first)
  const combined = combineRuns(first, missing)
  expect(costWithUnknownTurnEstimates(combined, 1)).toBe(8)
  expect(costWithUnknownTurnEstimates(combineRuns(known, combineRuns(partial, missing)), 1)).toBe(8)
  expect(first).toEqual(before)
  expect(combined.costUsd).toBe(7) // Provider lower bounds stay distinct from the recorded estimate.
})

test('a successful final queued turn with unknown price adds its estimate to prior spend', async () => {
  const f = fixture(enqueue => [
    { ok: true, costUsd: 2, beforeResult: job => { enqueue(job, 'first successful follow-up') } },
    { ok: true, costUsd: 3, beforeResult: job => { enqueue(job, 'second successful follow-up') } },
    { ok: true, costUsd: 0, beforeResult: job => {
      writeFileSync(join(job.projectPath, 'README.md'), '# Completed accounting fixture\n')
      execFileSync('git', ['add', 'README.md'], { cwd: job.projectPath, timeout: 5_000, windowsHide: true })
      execFileSync('git', ['commit', '-m', 'complete fixture'], { cwd: job.projectPath, stdio: 'ignore', timeout: 5_000, windowsHide: true })
    } },
  ])
  const original = f.engine.run.bind(f.engine)
  const run = vi.spyOn(f.engine, 'run').mockImplementation(async job => {
    const result = await original(job)
    return f.engine.calls.length === 3 ? { ...result, costUnknown: true } : result
  })
  try {
    expect(await runOnce(f.deps)).toBe('done')
    expect(f.engine.calls).toHaveLength(3)
    expect(f.deps.db.billedCostForLocalDay(f.day(), 0, [])).toBe(6)
    expect(f.deps.db.accountingForDay(f.day())).toMatchObject({ attempts: 1, estimatedUsd: 6, reportedUsd: 0 })
  } finally { run.mockRestore() }
})
