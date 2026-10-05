import { afterEach, expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Engine, RunResult } from '../src/types.js'
import { runConductorTask } from '../src/conductor/conductor.js'
import { TaskLedger } from '../src/conductor/ledger.js'

const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

function fixture(result: Pick<RunResult, 'ok' | 'costUsd' | 'costUnknown'>) {
  const root = mkdtempSync(join(tmpdir(), 'adng-conductor-budget-'))
  roots.push(root)
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, stdio: 'ignore' })
  git('init', '-b', 'main'); git('config', 'user.name', 'fixture'); git('config', 'user.email', 'fixture@example.test')
  writeFileSync(join(root, 'README.md'), 'fixture\n'); git('add', '.'); git('commit', '-m', 'fixture')
  let calls = 0, verifications = 0
  const engine: Engine = { id: 'fixture', async preflight() { return { ok: true, detail: 'ready' } }, async run() {
    calls++
    mkdirSync(join(root, 'src'), { recursive: true })
    writeFileSync(join(root, 'src', 'output.txt'), `attempt ${calls}\n`)
    git('add', 'src/output.txt'); git('commit', '-m', `attempt ${calls}`)
    return { ...result, output: 'produced a real commit', failureReason: result.ok ? undefined : 'transient failure' }
  } }
  const envelope = { task_id: 'budget-task', phase: 'implementation', goal: 'write output', scope: 'src only', worker: 'fixture',
    files_allowed_to_change: ['src/'], acceptance_criteria: ['output exists'], tests: ['git rev-parse HEAD'],
    budget: { max_cost_usd: 0.5 }, max_retries: 2 }
  const deps = { projectPath: root, resolveWorker: () => engine, async runTest() {
    verifications++; return { status: 'pass' as const, detail: 'fixture verified', exitCode: 0 }
  } }
  return { root, envelope, deps, calls: () => calls, verifications: () => verifications }
}

test.each([
  { label: 'unknown placeholder zero', costUsd: 0, costUnknown: true },
  { label: 'NaN', costUsd: NaN, costUnknown: false },
  { label: 'negative', costUsd: -1, costUnknown: false },
  { label: 'infinite', costUsd: Infinity, costUnknown: false },
  { label: 'missing runtime value', costUsd: undefined as unknown as number, costUnknown: false },
  { label: 'null runtime value', costUsd: null as unknown as number, costUnknown: false },
  { label: 'string runtime value', costUsd: '0' as unknown as number, costUnknown: false },
  { label: 'boolean runtime value', costUsd: false as unknown as number, costUnknown: false },
])('hard cost guard never passes or retries with $label', async ({ costUsd, costUnknown }) => {
  const f = fixture({ ok: true, costUsd, costUnknown })
  const result = await runConductorTask(f.envelope, f.deps)
  expect(result.status).toBe('blocked')
  expect(result.reason).toContain('cost-unverified')
  expect(f.calls()).toBe(1)
  expect(f.verifications()).toBe(0)
  const record = new TaskLedger(join(f.root, '.autodev')).lastAttemptResult('budget-task')
  expect(record?.cost_usd).toBeUndefined()
  expect(readFileSync(join(f.root, '.autodev', 'runs', 'budget-task', 'worker-report.md'), 'utf8')).toContain('cost_usd: unknown')
})

test('unknown spend after a failed Worker does not buy an automatic retry', async () => {
  const f = fixture({ ok: false, costUsd: 0, costUnknown: true })
  const result = await runConductorTask(f.envelope, f.deps)
  expect(result.status).toBe('blocked')
  expect(result.reason).toContain('cost-unverified')
  expect(f.calls()).toBe(1)
})

test('known over-budget spend stops before another Worker or verification', async () => {
  const f = fixture({ ok: true, costUsd: 9.99, costUnknown: false })
  const result = await runConductorTask(f.envelope, f.deps)
  expect(result.status).toBe('escalated')
  expect(result.reason).toContain('over-budget')
  expect(f.calls()).toBe(1)
  expect(f.verifications()).toBe(0)
  expect(new TaskLedger(join(f.root, '.autodev')).lastAttemptResult('budget-task')?.cost_usd).toBe(9.99)
})

test('a known cost breach on a failed Worker also forbids retry', async () => {
  const f = fixture({ ok: false, costUsd: 9.99, costUnknown: false })
  const result = await runConductorTask(f.envelope, f.deps)
  expect(result.status).toBe('escalated')
  expect(result.reason).toContain('over-budget')
  expect(f.calls()).toBe(1)
  expect(f.verifications()).toBe(0)
})

test('provider-reported finite zero remains a valid in-budget result', async () => {
  const f = fixture({ ok: true, costUsd: 0, costUnknown: false })
  const result = await runConductorTask(f.envelope, f.deps)
  expect(result.status).toBe('done')
  expect(f.calls()).toBe(1)
  expect(f.verifications()).toBe(1)
})

test.each([true, false])('a budget hold survives resume and an alternate stateDir (unknown=$0)', async costUnknown => {
  const f = fixture({ ok: true, costUsd: costUnknown ? 0 : 9.99, costUnknown })
  await runConductorTask(f.envelope, f.deps)
  const hold = join(f.root, '.git', 'adng-conductor-budget-hold-budget-task.json')
  expect(existsSync(hold)).toBe(true)
  for (const stateDir of [join(f.root, '.autodev'), join(f.root, 'alternate-state')]) {
    const resumed = await runConductorTask({ ...f.envelope, budget: {} }, { ...f.deps, stateDir })
    expect(resumed.status).toBe('blocked')
  }
  expect(f.calls()).toBe(1)
})

test('ordinary git clean cannot reset unknown spend or its task hold', async () => {
  const f = fixture({ ok: true, costUsd: 0, costUnknown: true })
  await runConductorTask(f.envelope, f.deps)
  execFileSync('git', ['clean', '-fdx'], { cwd: f.root, stdio: 'ignore' })
  expect(existsSync(join(f.root, '.autodev'))).toBe(false)
  expect((await runConductorTask({ ...f.envelope, budget: {} }, f.deps)).status).toBe('blocked')
  expect(f.calls()).toBe(1)
})

test('failure to save a budget hold retains the writer quarantine before retry', async () => {
  const f = fixture({ ok: true, costUsd: 0, costUnknown: true })
  const inner = f.deps.resolveWorker()
  const worker: Engine = { ...inner, async run(job) {
    const result = await inner.run(job)
    mkdirSync(join(f.root, '.git', 'adng-conductor-budget-hold-budget-task.json'))
    return result
  } }
  const result = await runConductorTask(f.envelope, { ...f.deps, resolveWorker: () => worker })
  expect(result.status).toBe('blocked')
  expect(result.reason).toContain('budget hold 無法保存')
  expect(existsSync(join(f.root, '.git', 'adng-conductor-worker-quarantine.json'))).toBe(true)
  expect((await runConductorTask({ ...f.envelope, task_id: 'another-task' }, f.deps)).status).toBe('blocked')
  expect(f.calls()).toBe(1)
  expect(f.verifications()).toBe(0)
})

test('a failed preflight never dispatches a Worker or creates a spend hold', async () => {
  const f = fixture({ ok: false, costUsd: 0, costUnknown: true })
  const worker: Engine = { ...f.deps.resolveWorker(), async preflight() { return { ok: false, detail: 'offline fixture unavailable' } } }
  const result = await runConductorTask(f.envelope, { ...f.deps, resolveWorker: () => worker })
  expect(result.status).toBe('escalated')
  expect(f.calls()).toBe(0)
  expect(existsSync(join(f.root, '.git', 'adng-conductor-budget-hold-budget-task.json'))).toBe(false)
})
