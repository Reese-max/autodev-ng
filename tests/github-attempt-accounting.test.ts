import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import Database from 'better-sqlite3'
import { assembleConfig } from '../src/cli/assemble.js'
import { BacklogStore } from '../src/backlog.js'
import { MockEngine } from '../src/engines/mock.js'
import { KernelVerifier } from '../src/engines/kernel-verifier.js'
import { TeamState } from '../src/engines/team-state.js'
import { savePendingReview } from '../src/engines/pending-review.js'
import { executionFile, executionHistoryFile, readExecution } from '../src/engines/execution-observation.js'
import { prepareWorktree } from '../src/worktree.js'
import { GithubConfigSchema, type Issue } from '../src/github/config.js'
import type { GithubClient } from '../src/github/client.js'
import { executeIssue, git, issueTask, runtimeConfig } from '../src/github/job.js'
import { runGithub, runGithubOutcome } from '../src/github/runner.js'
import { recoverIssue, type repairDoctor } from '../src/github/operations.js'
import { branchFor, fingerprint, readState, runDir, saveState, type IssueState } from '../src/github/state.js'
import * as stateModule from '../src/github/state.js'
import type { Engine, RunResult } from '../src/types.js'

const roots: string[] = []
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Provider dispatch forbidden in local accounting fixture') }))
})
afterEach(() => {
  vi.restoreAllMocks(); vi.unstubAllGlobals()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function fixture(opts: { dailyHardUsd?: number; spent?: number; runs?: number; maxRuns?: number; directoryAlias?: boolean } = {}) {
  const storageRoot = mkdtempSync(join(tmpdir(), 'adng-gh49-')); roots.push(storageRoot)
  let root = storageRoot
  if (opts.directoryAlias) {
    const actual = join(storageRoot, 'actual'), alias = join(storageRoot, 'alias')
    mkdirSync(actual); symlinkSync(actual, alias, process.platform === 'win32' ? 'junction' : 'dir')
    root = alias
  }
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: join(root, 'source.json'),
    dataDir: join(root, 'gh'), engine: 'writer', enabled: true, publish: false, label: null, retryMs: 60_000,
    maxRuns: opts.maxRuns ?? 3, verifyCommand: `"${process.execPath}" check.cjs` })
  const issue: Issue = { number: 7, title: 'Fix addition', body: 'add(2, 3) must return 5', state: 'open', user: { login: 'owner' }, labels: [] }
  const cwd = join(cfg.dataDir, 'issue-7', 'repo'); mkdirSync(cwd, { recursive: true })
  git(cwd, ['init', '-b', branchFor(7)])
  git(cwd, ['config', 'user.name', 'Test']); git(cwd, ['config', 'user.email', 'test@example.invalid'])
  git(cwd, ['config', 'core.autocrlf', 'false']); git(cwd, ['remote', 'add', 'origin', 'https://github.com/owner/project.git'])
  writeFileSync(join(cwd, 'add.cjs'), 'module.exports = (a, b) => a - b\n')
  writeFileSync(join(cwd, 'check.cjs'), "require('node:assert/strict').equal(require('./add.cjs')(2, 3), 5)\n")
  git(cwd, ['add', '.']); git(cwd, ['commit', '-m', 'initial failing case'])
  const baseSha = git(cwd, ['rev-parse', 'HEAD'])
  const state: IssueState = { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'queued',
    runs: opts.runs ?? 0, nextRunAt: 0, baseSha }
  saveState(cfg, state)
  writeFileSync(cfg.sourceConfig, JSON.stringify({ projectPath: cwd, backlogFile: 'unused', dataDir: join(root, 'source-data'),
    dailyHardUsd: opts.dailyHardUsd ?? 0, engines: { writer: { adapter: 'opencode', model: 'fixture' } },
    defaultEngine: 'writer', reviewEngine: 'fixture-reviewer', supplyRetryCooldownMs: 60_000 }))
  const runtime = runtimeConfig(cfg, state)
  writeFileSync(runtime.backlogFile, '')
  const store = new BacklogStore(runtime.backlogFile); store.append(issueTask(state), { goalId: 'github-7', round: 1 })
  if (opts.spent) {
    const app = assembleConfig(runtime, cfg.sourceConfig)
    app.deps.db.record({ taskId: 'previous', ok: true, costUsd: opts.spent, detail: 'Existing provider receipt', engine: 'writer' })
    app.deps.db.close(); app.deps.team?.close()
  }
  const client: GithubClient = { list: vi.fn(async () => [issue]), issue: vi.fn(async () => issue),
    findPr: vi.fn(async () => undefined), findLinkedPr: vi.fn(async () => undefined),
    createPr: vi.fn(async () => { throw new Error('Publication forbidden in local accounting fixture') }) }
  let lastResult: Awaited<ReturnType<typeof executeIssue>> | undefined
  function executor(engine: Engine, configure?: (app: ReturnType<typeof assembleConfig>) => void) {
    return async (c: typeof cfg, s: IssueState) => {
      lastResult = await executeIssue(c, s, (runtime, cfgPath) => {
        const app = assembleConfig(runtime, cfgPath)
        app.deps.engines = { resolve: () => engine }
        app.deps.verifier = new KernelVerifier({ cfg: runtime, reviewRun: async () => 'REVIEW: PASS' })
        configure?.(app)
        return app
      })
      return lastResult
    }
  }
  return { root, cfg, issue, cwd, runtime, store, state, client, executor, result: () => lastResult }
}
function due(f: ReturnType<typeof fixture>) {
  const state = readState(f.cfg, 7)!; state.nextRunAt = 0; saveState(f.cfg, state)
}
function ledger(f: ReturnType<typeof fixture>) {
  const file = join(runDir(f.cfg, readState(f.cfg, 7)!), 'run.db')
  if (!existsSync(file)) return []
  const db = new Database(file, { readonly: true })
  try { return db.prepare('SELECT task_id, ok, cost_usd, detail, accounting_json FROM attempts ORDER BY seq').all() }
  finally { db.close() }
}

test('an already blocked backlog refunds only the new unused reservation and stops polling', async () => {
  const f = fixture({ runs: 1 }), engine = new MockEngine()
  f.store.report(f.store.read()[0]!.id, { kind: 'blocked', reason: 'Previously denied admission' })
  const backlog = readFileSync(f.runtime.backlogFile, 'utf8')
  const execute = vi.fn(f.executor(engine))
  expect(await runGithub(f.cfg, { client: f.client, execute })).toBe('7: blocked')
  expect(readState(f.cfg, 7)!.runs).toBe(1)
  expect(engine.calls).toHaveLength(0)
  expect(readFileSync(f.runtime.backlogFile, 'utf8')).toBe(backlog)
  due(f); expect(await runGithub(f.cfg, { client: f.client, execute })).toBe('idle')
  expect(execute).toHaveBeenCalledTimes(1)
})

test('real engine admission block is terminal without spending a writer attempt', async () => {
  const f = fixture(), engine = new MockEngine()
  const execute = vi.fn(f.executor(engine, app => {
    app.deps.engines = { resolve: () => { throw new Error('Fixture adapter unavailable') } }
  }))
  expect(await runGithub(f.cfg, { client: f.client, execute })).toBe('7: blocked')
  expect(f.result()?.attempted).toBe(false)
  expect(f.store.read()[0]!.status).toBe('blocked')
  expect(readState(f.cfg, 7)).toMatchObject({ status: 'blocked', runs: 0 })
  expect(engine.calls).toHaveLength(0)
  due(f); expect(await runGithub(f.cfg, { client: f.client, execute })).toBe('idle')
  expect(execute).toHaveBeenCalledTimes(1)
})

test('preflight wait persists backoff and reason across restart, then stops finite controller retries', async () => {
  const f = fixture({ runs: 1 }), engine = new MockEngine([], { ok: false, detail: 'Unavailable fixture' })
  const preflight = vi.spyOn(engine, 'preflight'), execute = f.executor(engine)
  const start = Date.now(); const clock = vi.spyOn(Date, 'now').mockReturnValue(start)
  for (let count = 1; count <= 5; count++) {
    const before = Date.now()
    expect(await runGithub(f.cfg, { client: f.client, execute })).toBe(`7: ${count === 5 ? 'blocked' : 'queued'}`)
    const state = readState(f.cfg, 7)!
    expect(state).toMatchObject({ runs: 1, controlRuns: count, controlReason: 'preflight-failed' })
    expect(state.nextRunAt).toBe(before + f.cfg.retryMs * 2 ** (count - 1))
    expect(state.history!.at(-1)).toMatchObject({ controlRuns: count, controlReason: 'preflight-failed' })
    if (count < 5) {
      expect(await runGithub(f.cfg, { client: f.client, execute: f.executor(engine) })).toBe('idle')
      expect(preflight).toHaveBeenCalledTimes(count)
      clock.mockReturnValue(state.nextRunAt + 1)
    }
  }
  due(f); expect(await runGithub(f.cfg, { client: f.client, execute })).toBe('idle')
  expect(preflight).toHaveBeenCalledTimes(5); expect(engine.calls).toHaveLength(0)
  expect(readState(f.cfg, 7)!.detail).toContain('control-retry-exhausted')
})

test('actual local budget denial preserves billing and writer counts, then resumes in remaining budget', async () => {
  const f = fixture({ runs: 1, dailyHardUsd: 1, spent: 2 }), engine = new MockEngine([{ ok: false, reason: 'Fixture capability failure', costUsd: 0.4 }])
  const originalLedger = ledger(f), execute = f.executor(engine)
  expect(await runGithub(f.cfg, { client: f.client, execute })).toBe('7: queued')
  expect(f.result()?.attempted).toBe(false); expect(engine.calls).toHaveLength(0)
  expect(readState(f.cfg, 7)).toMatchObject({ runs: 1, controlRuns: 1, controlReason: 'cost-hard-stop' })
  expect(ledger(f)).toEqual(originalLedger)
  const source = JSON.parse(readFileSync(f.cfg.sourceConfig, 'utf8')); source.dailyHardUsd = 10
  writeFileSync(f.cfg.sourceConfig, JSON.stringify(source)); due(f)
  await runGithub(f.cfg, { client: f.client, execute })
  expect(engine.calls).toHaveLength(1)
  expect(readState(f.cfg, 7)).toMatchObject({ runs: 2, controlRuns: 0 })
  expect(ledger(f).slice(0, originalLedger.length)).toEqual(originalLedger)
  expect(ledger(f)).toHaveLength(originalLedger.length + 1)
})

test('actual conflicting claim delays a zero-writer cycle while preserving the existing cost reservation', async () => {
  const f = fixture(), engine = new MockEngine(), team = new TeamState(f.cwd)
  try {
    const held = team.claim({ executionId: 'held-fixture', task: f.store.read()[0]!, workerId: 'other', reservedCostUsd: 2,
      spentUsd: 0, dailyHardUsd: 10, leaseMs: 60_000 })
    expect(held.ok).toBe(true)
    const before = team.snapshot()
    expect(await runGithub(f.cfg, { client: f.client, execute: f.executor(engine) })).toBe('7: queued')
    expect(f.result()?.attempted).toBe(false); expect(engine.calls).toHaveLength(0)
    expect(readState(f.cfg, 7)).toMatchObject({ runs: 0, controlRuns: 1, controlReason: 'deferred' })
    expect(team.snapshot()).toEqual(before)
  } finally { team.close() }
})

test('a real pending review can become terminal without restarting or recharging its writer', async () => {
  const f = fixture({ runs: 1 }), engine = new MockEngine()
  const task = f.store.read()[0]!, wt = prepareWorktree(f.cwd, f.runtime.worktreesDir, task.id, f.runtime)
  writeFileSync(join(wt.cwd, 'add.cjs'), 'module.exports = (a, b) => a + b\n')
  git(wt.cwd, ['add', '.']); git(wt.cwd, ['commit', '-m', 'preserved candidate'])
  const candidate = git(wt.cwd, ['rev-parse', 'HEAD'])
  const result: RunResult = { ok: true, output: 'preserved writer result', costUsd: 0.7, commitHash: candidate, baseCommitHash: wt.baseHead }
  savePendingReview(f.runtime, task, wt, result, 'writer', 'Fixture review wait', Date.now() - 1)
  const app = assembleConfig(f.runtime, f.cfg.sourceConfig)
  app.deps.db.record({ taskId: task.id, ok: true, costUsd: result.costUsd, detail: 'Existing synthetic writer charge', engine: 'writer' })
  app.deps.db.close(); app.deps.team?.close()
  const before = ledger(f)
  const execute = f.executor(engine, app => {
    app.deps.verifier = new KernelVerifier({ cfg: app.deps.cfg, reviewRun: async () => { throw new Error('Fixture reviewer unavailable') } })
  })
  expect(await runGithub(f.cfg, { client: f.client, execute })).toBe('7: blocked')
  expect(f.result()?.attempted).toBe(false); expect(f.result()?.verificationAttempted).toBe(true)
  expect(engine.calls).toHaveLength(0); expect(readState(f.cfg, 7)!.runs).toBe(1)
  expect(f.store.read()[0]!.status).toBe('blocked')
  const after = ledger(f)
  expect(after.slice(0, before.length)).toEqual(before)
  expect(after.slice(before.length)).toHaveLength(1)
  expect(JSON.parse((after.at(-1) as { accounting_json: string }).accounting_json)).toMatchObject({ stage: 'validation', costSource: 'unknown' })
  expect(git(wt.cwd, ['rev-parse', 'HEAD'])).toBe(candidate)
})

test.each(['Fixture capability failure', 'Fixture attempt timeout'])('started %s spends the finite writer cap and preserves cost evidence', async reason => {
  const f = fixture({ maxRuns: 3 }), engine = new MockEngine(Array.from({ length: 3 }, () => ({ ok: false as const, reason, costUsd: 0.4, costUnknown: true })))
  const execute = f.executor(engine), clock = vi.spyOn(Date, 'now').mockReturnValue(Date.now())
  for (let runs = 1; runs <= 3; runs++) {
    expect(await runGithub(f.cfg, { client: f.client, execute })).toBe(`7: ${runs === 3 ? 'blocked' : 'queued'}`)
    expect(readState(f.cfg, 7)).toMatchObject({ runs, controlRuns: 0 })
    expect(f.result()?.attempted).toBe(true)
    expect(engine.calls).toHaveLength(runs)
    clock.mockReturnValue(readState(f.cfg, 7)!.nextRunAt + 60_001)
  }
  expect(await runGithub(f.cfg, { client: f.client, execute })).toBe('idle')
  expect(engine.calls).toHaveLength(3)
  expect(ledger(f)).toHaveLength(3)
  for (const row of ledger(f) as { accounting_json: string; cost_usd: number }[]) {
    expect(JSON.parse(row.accounting_json).costSource).toBe('failure-estimate')
    expect(row.cost_usd).toBeGreaterThan(0) // Existing uncertainty estimate is never zeroed/refunded.
  }
})

function unknownReceipt(f: ReturnType<typeof fixture>) {
  const folder = join(runDir(f.cfg, f.state), 'executions'); mkdirSync(folder, { recursive: true })
  const file = join(folder, 'previous-fixture.json')
  writeFileSync(file, JSON.stringify({ version: 1, executionId: 'previous-fixture', taskId: f.store.read()[0]!.id,
    adapter: 'opencode', projectPath: f.cwd, hostPid: process.pid, hostStartedAt: Date.now(), startedAt: Date.now(), observedAt: Date.now(),
    sequence: 0, phase: 'unknown', outputBytes: 0, unknownSamples: 1, degraded: true, cancelRequested: false }))
  return file
}

test('a prior unresolved reservation survives refunding only the proven unstarted new loop', async () => {
  const f = fixture({ runs: 1 }), engine = new MockEngine(), file = unknownReceipt(f)
  const original = readFileSync(file, 'utf8'), execute = vi.fn(f.executor(engine))
  const outcome = await runGithubOutcome(f.cfg, { client: f.client, execute })
  expect(outcome).toMatchObject({ disposition: 'blocked', attempted: false, recoveryRequired: true })
  expect(readState(f.cfg, 7)).toMatchObject({ runs: 1, status: 'blocked' })
  expect(f.result()).toMatchObject({ startState: 'not-started', attempted: false, priorExecutionUnknown: true, recoveryRequired: true })
  expect(engine.calls).toHaveLength(0)
  expect(readFileSync(executionFile(runDir(f.cfg, f.state), 'previous-fixture'), 'utf8')).toBe(original)
  expect(readExecution(runDir(f.cfg, f.state), 'previous-fixture')).toEqual(JSON.parse(original))
  expect(existsSync(file)).toBe(false)
  expect(existsSync(executionHistoryFile(runDir(f.cfg, f.state), 'previous-fixture'))).toBe(false)
  expect(await runGithub(f.cfg, { client: f.client, execute })).toBe('idle')
  expect(execute).toHaveBeenCalledTimes(1)
})

test.each(['lost transport', 'caller cancellation'])('a real local worker with %s retains its claim and reservation', async mode => {
  const f = fixture()
  const source = JSON.parse(readFileSync(f.cfg.sourceConfig, 'utf8')); source.engines.writer.executionMode = 'observed'
  writeFileSync(f.cfg.sourceConfig, JSON.stringify(source))
  let child: ReturnType<typeof spawn> | undefined
  const run = vi.fn(async (job: Parameters<Engine['run']>[0]): Promise<RunResult> => {
    child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)'], { stdio: 'ignore', windowsHide: true })
    await new Promise<void>((resolve, reject) => { child!.once('spawn', resolve); child!.once('error', reject) })
    job.control?.onEvent?.({ type: 'spawn', pid: child.pid!, startedAt: Date.now() })
    if (mode === 'lost transport') throw new Error('Synthetic local transport disconnected after actual spawn')
    job.control?.onEvent?.({ type: 'cancel-requested' })
    return { ok: false, output: '', costUsd: 0, costUnknown: true, cancelled: true, recoveryRequired: true, failureReason: 'cancel-requested' }
  })
  const engine: Engine = { id: 'writer', preflight: async () => ({ ok: true, detail: 'Offline fixture' }), run }
  try {
    const outcome = await runGithubOutcome(f.cfg, { client: f.client, execute: f.executor(engine) })
    expect(outcome).toMatchObject({ disposition: 'blocked', attempted: true, recoveryRequired: true })
    expect(readState(f.cfg, 7)).toMatchObject({ status: 'blocked', runs: 1 })
    expect(f.result()?.startState).toBe('unknown'); expect(run).toHaveBeenCalledTimes(1)
    const team = new TeamState(f.cwd)
    try {
      expect(team.snapshot().claims).toHaveLength(1)
      expect(team.snapshot().claims[0]).toMatchObject({ active: 1, state: 'QUARANTINED' })
      const db = new Database(team.path, { readonly: true })
      try { expect((db.prepare('SELECT reserved_cost_usd FROM team_claims WHERE active=1').get() as { reserved_cost_usd: number }).reserved_cost_usd).toBeGreaterThan(0) }
      finally { db.close() }
    } finally { team.close() }
  } finally {
    // Only this actual synthetic Node child is cleaned up. The product has no
    // verified backend stop receipt and must retain its fence regardless.
    if (child && child.exitCode === null && child.signalCode === null) {
      const closed = new Promise<void>(resolve => child!.once('close', () => resolve()))
      child.kill(); await closed
    }
  }
})

test('caller cancellation before admission records no writer and never runs preflight', async () => {
  const f = fixture(), engine = new MockEngine(), preflight = vi.spyOn(engine, 'preflight')
  const controller = new AbortController(); controller.abort()
  expect(await runGithub(f.cfg, { client: f.client, execute: f.executor(engine, app => { app.deps.runControl = { signal: controller.signal } }) })).toBe('7: queued')
  expect(readState(f.cfg, 7)).toMatchObject({ runs: 0, controlRuns: 1, controlReason: 'stopped' })
  expect(engine.calls).toHaveLength(0); expect(preflight).not.toHaveBeenCalled()
  expect(ledger(f)).toHaveLength(0)
})

test('controller-only history changes append evidence while keeping original rows identical', () => {
  const f = fixture({ runs: 1 }), original = readState(f.cfg, 7)!, before = JSON.stringify(original.history)
  original.controlRuns = 1; original.controlReason = 'preflight-failed'; saveState(f.cfg, original)
  const first = readState(f.cfg, 7)!
  expect(JSON.stringify(first.history!.slice(0, original.history!.length - 1))).toBe(before)
  const firstLength = first.history!.length
  first.controlRuns = 2; saveState(f.cfg, first)
  const after = readState(f.cfg, 7)!
  expect(after.history!.at(-1)).toMatchObject({ status: 'queued', runs: 1, controlRuns: 2, controlReason: 'preflight-failed' })
  expect(after.history!.length).toBe(firstLength + 1)
})

function offlineDoctor() {
  // Injection explicitly admits only this synthetic environment, never a real
  // provider/account/host. recoverIssue still executes all its actual gates.
  return vi.fn(async () => ({ ready: true, sandbox: { detail: 'Synthetic offline environment only' } } as Awaited<ReturnType<typeof repairDoctor>>))
}

test('explicit recovery resets only controller state and uses the remaining lifetime writer budget', async () => {
  const f = fixture({ runs: 1, spent: 0.7 }), waiting = new MockEngine([], { ok: false, detail: 'Unavailable fixture' })
  const execute = f.executor(waiting), clock = vi.spyOn(Date, 'now').mockReturnValue(Date.now())
  for (let n = 0; n < 5; n++) { await runGithub(f.cfg, { client: f.client, execute }); clock.mockReturnValue(readState(f.cfg, 7)!.nextRunAt + 1) }
  const held = readState(f.cfg, 7)!, history = JSON.stringify(held.history), before = ledger(f), file = join(f.root, 'github.json')
  expect(held).toMatchObject({ status: 'blocked', runs: 1, controlRuns: 5 })
  writeFileSync(file, JSON.stringify(f.cfg))
  const doctor = offlineDoctor(), recovered = await recoverIssue(file, 7, 'Restore the synthetic local fixture after controller exhaustion', false, { client: f.client, doctor })
  expect(recovered).toMatchObject({ status: 'queued', runs: 1, controlRuns: 0 })
  expect(recovered.controlReason).toBeUndefined(); expect(doctor).toHaveBeenCalledTimes(1)
  expect(JSON.stringify(recovered.history!.slice(0, held.history!.length))).toBe(history)
  expect(ledger(f)).toEqual(before)
  const engine = new MockEngine([{ ok: false, reason: 'Fixture capability failure', costUnknown: true }])
  await runGithub(f.cfg, { client: f.client, execute: f.executor(engine) })
  expect(engine.calls).toHaveLength(1); expect(readState(f.cfg, 7)!.runs).toBe(2)
})

test('explicit recovery refuses an unresolved execution without changing counters or history', async () => {
  const f = fixture({ runs: 1 }), file = join(f.root, 'github.json')
  const held = readState(f.cfg, 7)!; held.status = 'blocked'; held.controlRuns = 5; held.controlReason = 'preflight-failed'; saveState(f.cfg, held)
  const receipt = unknownReceipt(f), originalReceipt = readFileSync(receipt, 'utf8'), before = readState(f.cfg, 7)
  writeFileSync(file, JSON.stringify(f.cfg))
  const doctor = offlineDoctor()
  await expect(recoverIssue(file, 7, 'Do not discard the protected synthetic execution', false, { client: f.client, doctor })).rejects.toThrow('stop remains unconfirmed')
  expect(readState(f.cfg, 7)).toEqual(before); expect(doctor).not.toHaveBeenCalled()
  expect(readFileSync(executionFile(runDir(f.cfg, f.state), 'previous-fixture'), 'utf8')).toBe(originalReceipt)
  expect(readExecution(runDir(f.cfg, f.state), 'previous-fixture')).toEqual(JSON.parse(originalReceipt))
  expect(existsSync(receipt)).toBe(false)
  expect(existsSync(executionHistoryFile(runDir(f.cfg, f.state), 'previous-fixture'))).toBe(false)
})

test('atomic state persistence failure retains the on-disk reservation across restart without a second refund', async () => {
  const f = fixture(), engine = new MockEngine([], { ok: false, detail: 'Unavailable fixture' })
  const originalSave = stateModule.saveState; let refuse = false
  const persistence = vi.spyOn(stateModule, 'saveState').mockImplementation((cfg, state) => {
    if (refuse) throw new Error('Injected atomic state persistence failure')
    return originalSave(cfg, state)
  })
  const assembled = f.executor(engine), execute = vi.fn(async (cfg: typeof f.cfg, state: IssueState) => {
    const result = await assembled(cfg, state); refuse = true; return result
  })
  await expect(runGithub(f.cfg, { client: f.client, execute })).rejects.toThrow('persistence failure')
  expect(readState(f.cfg, 7)).toMatchObject({ status: 'running', runs: 1 })
  persistence.mockRestore()
  expect(await runGithub(f.cfg, { client: f.client, execute })).toBe('idle')
  expect(readState(f.cfg, 7)).toMatchObject({ status: 'blocked', runs: 1 })
  expect(execute).toHaveBeenCalledTimes(1); expect(engine.calls).toHaveLength(0)
})

test('actual successful writer verification consumes one attempt and clears only its previous wait state', async () => {
  const f = fixture({ runs: 1 }), queued = readState(f.cfg, 7)!
  queued.controlRuns = 3; queued.controlReason = 'preflight-failed'; saveState(f.cfg, queued)
  const engine = new MockEngine([{ ok: true, beforeResult(job) {
    const base = git(job.projectPath, ['rev-parse', 'HEAD'])
    writeFileSync(join(job.projectPath, 'add.cjs'), 'module.exports = (a, b) => a + b\n')
    mkdirSync(join(job.projectPath, 'tests/regressions'), { recursive: true })
    writeFileSync(join(job.projectPath, 'tests/regressions/github-7.test.cjs'), "require('node:test')('addition', () => require('node:assert/strict').equal(require('../../add.cjs')(2, 3), 5))\n")
    git(job.projectPath, ['add', '.']); git(job.projectPath, ['commit', '-m', 'fixture fix and genuine failing-to-passing regression'])
    return base
  } }])
  expect(await runGithub(f.cfg, { client: f.client, execute: f.executor(engine) })).toBe('7: ready')
  expect(engine.calls).toHaveLength(1)
  expect(readState(f.cfg, 7)).toMatchObject({ status: 'ready', runs: 2, controlRuns: 0 })
  expect(readState(f.cfg, 7)!.controlReason).toBeUndefined()
  expect(f.result()).toMatchObject({ done: true, attempted: true, startState: 'started', verificationAttempted: true })
  expect(git(f.cwd, ['rev-parse', 'HEAD'])).toBe(readState(f.cfg, 7)!.commit)
})

function preservedCandidate(f: ReturnType<typeof fixture>, retryAt: number) {
  const task = f.store.read()[0]!, wt = prepareWorktree(f.cwd, f.runtime.worktreesDir, task.id, f.runtime)
  writeFileSync(join(wt.cwd, 'add.cjs'), 'module.exports = (a, b) => a + b\n')
  mkdirSync(join(wt.cwd, 'tests/regressions'), { recursive: true })
  writeFileSync(join(wt.cwd, 'tests/regressions/github-7.test.cjs'), "require('node:test')('addition', () => require('node:assert/strict').equal(require('../../add.cjs')(2, 3), 5))\n")
  git(wt.cwd, ['add', '.']); git(wt.cwd, ['commit', '-m', 'preserve fixture candidate'])
  const head = git(wt.cwd, ['rev-parse', 'HEAD'])
  const pending = savePendingReview(f.runtime, task, wt, { ok: true, output: 'preserved candidate', costUsd: 0.7,
    commitHash: head, baseCommitHash: wt.baseHead }, 'writer', 'Synthetic review wait', retryAt)
  const app = assembleConfig(f.runtime, f.cfg.sourceConfig)
  app.deps.db.record({ taskId: task.id, ok: true, costUsd: 0.7, detail: 'Existing synthetic writer charge', engine: 'writer' })
  app.deps.db.close(); app.deps.team?.close()
  return { wt, head, task, pending }
}

test('valid pending review respects its exact retryAt without another preflight or writer charge', async () => {
  const f = fixture({ runs: 3 }), now = Date.now(), clock = vi.spyOn(Date, 'now').mockReturnValue(now)
  preservedCandidate(f, now + 15_000)
  const before = ledger(f), engine = new MockEngine(), preflight = vi.spyOn(engine, 'preflight')
  expect(await runGithub(f.cfg, { client: f.client, execute: f.executor(engine) })).toBe('7: queued')
  expect(readState(f.cfg, 7)).toMatchObject({ runs: 3, controlRuns: 1, controlReason: 'deferred', nextRunAt: now + 15_000 })
  clock.mockReturnValue(now + 14_999)
  expect(await runGithub(f.cfg, { client: f.client, execute: f.executor(engine) })).toBe('idle')
  expect(preflight).not.toHaveBeenCalled(); expect(engine.calls).toHaveLength(0); expect(ledger(f)).toEqual(before)
})

test('explicit recovery at writer cap resumes only the validated pending review candidate', async () => {
  const f = fixture({ runs: 3 }), candidate = preservedCandidate(f, Date.now() - 1), engine = new MockEngine()
  const held = readState(f.cfg, 7)!; held.status = 'blocked'; held.controlRuns = 5; held.controlReason = 'deferred'; held.detail = 'control-retry-exhausted'
  saveState(f.cfg, held)
  const file = join(f.root, 'github.json'); writeFileSync(file, JSON.stringify(f.cfg))
  const before = ledger(f), doctor = offlineDoctor()
  const recovered = await recoverIssue(file, 7, 'Resume the exact synthetic pending review after controller hold', false, { client: f.client, doctor })
  expect(recovered).toMatchObject({ status: 'queued', runs: 3, controlRuns: 0 })
  expect(ledger(f)).toEqual(before); expect(git(candidate.wt.cwd, ['rev-parse', 'HEAD'])).toBe(candidate.head)
  expect(await runGithub(f.cfg, { client: f.client, execute: f.executor(engine) })).toBe('7: ready')
  expect(engine.calls).toHaveLength(0); expect(readState(f.cfg, 7)).toMatchObject({ runs: 3, commit: candidate.head, controlRuns: 0 })
  expect(f.result()).toMatchObject({ attempted: false, startState: 'not-started', done: true, verificationAttempted: true })
  expect(ledger(f)).toEqual(before)
})

test('pending review recovery recognizes a real canonical directory alias without restarting the writer', async () => {
  const f = fixture({ runs: 3, directoryAlias: true }), candidate = preservedCandidate(f, Date.now() - 1), engine = new MockEngine()
  const listed = git(f.cwd, ['worktree', 'list', '--porcelain']).split(/\r?\n/).filter(row => row.startsWith('worktree ')).map(row => row.slice(9))
  const canonicalCandidate = listed.find(path => realpathSync.native(path) === realpathSync.native(candidate.wt.cwd))!
  expect(canonicalCandidate).toBeDefined()
  expect(canonicalCandidate.replace(/\\/g, '/')).not.toBe(candidate.wt.cwd.replace(/\\/g, '/'))
  const held = readState(f.cfg, 7)!; held.status = 'blocked'; held.controlRuns = 5; held.controlReason = 'deferred'; held.detail = 'control-retry-exhausted'
  saveState(f.cfg, held)
  const file = join(f.root, 'github.json'); writeFileSync(file, JSON.stringify(f.cfg))
  const before = ledger(f), doctor = offlineDoctor()
  const recovered = await recoverIssue(file, 7, 'Resume the exact pending candidate through its canonical directory alias', false, { client: f.client, doctor })
  expect(recovered).toMatchObject({ status: 'queued', runs: 3, controlRuns: 0 })
  expect(doctor).toHaveBeenCalledTimes(1); expect(ledger(f)).toEqual(before)
  expect(git(candidate.wt.cwd, ['rev-parse', 'HEAD'])).toBe(candidate.head)
  expect(await runGithub(f.cfg, { client: f.client, execute: f.executor(engine) })).toBe('7: ready')
  expect(engine.calls).toHaveLength(0); expect(readState(f.cfg, 7)).toMatchObject({ runs: 3, commit: candidate.head, controlRuns: 0 })
  expect(f.result()).toMatchObject({ attempted: false, startState: 'not-started', done: true, verificationAttempted: true })
  expect(ledger(f)).toEqual(before)
})

test.each(['dirty', 'head', 'model', 'context', 'path', 'unrelated-worktree'])('pending-review recovery retains all original fences: %s', async mode => {
  const f = fixture({ runs: 1 }), candidate = preservedCandidate(f, Date.now() - 1)
  const held = readState(f.cfg, 7)!; held.status = 'blocked'; held.controlRuns = 5; held.controlReason = 'deferred'; saveState(f.cfg, held)
  const file = join(f.root, 'github.json')
  if (mode === 'dirty' || mode === 'head') {
    writeFileSync(join(candidate.wt.cwd, 'unexpected.txt'), 'keep these unreviewed bytes')
    if (mode === 'head') { git(candidate.wt.cwd, ['add', '.']); git(candidate.wt.cwd, ['commit', '-m', 'unreviewed candidate drift']) }
  }
  if (mode === 'model') {
    const source = JSON.parse(readFileSync(f.cfg.sourceConfig, 'utf8')); source.engines.writer.model = 'changed-model'
    writeFileSync(f.cfg.sourceConfig, JSON.stringify(source))
  }
  if (mode === 'context') f.cfg.verifyCommand = 'node --version'
  if (mode === 'path') {
    const pendingFile = join(f.runtime.dataDir, 'pending-review', `${candidate.task.id}.json`)
    const pending = JSON.parse(readFileSync(pendingFile, 'utf8')); pending.wt.cwd = f.cwd
    writeFileSync(pendingFile, JSON.stringify(pending))
  }
  if (mode === 'unrelated-worktree') {
    const other = prepareWorktree(f.cwd, f.runtime.worktreesDir, 'abcdefff', f.runtime)
    writeFileSync(join(other.cwd, 'unreviewed.txt'), 'keep unrelated worktree')
    git(other.cwd, ['add', '.']); git(other.cwd, ['commit', '-m', 'unrelated change'])
  }
  writeFileSync(file, JSON.stringify(f.cfg))
  const before = readState(f.cfg, 7), doctor = offlineDoctor()
  await expect(recoverIssue(file, 7, 'Do not bypass pending candidate or unrelated worktree evidence', false, { client: f.client, doctor })).rejects.toThrow()
  expect(readState(f.cfg, 7)).toEqual(before); expect(doctor).not.toHaveBeenCalled()
})

test('cooling preflight refusal leaves another real issue eligible instead of starving its dispatch', async () => {
  const f = fixture(), otherIssue = { ...f.issue, number: 8 }, cwd = join(f.cfg.dataDir, 'issue-8', 'repo')
  mkdirSync(join(f.cfg.dataDir, 'issue-8'))
  git(f.cfg.dataDir, ['clone', '--no-hardlinks', '--', f.cwd, cwd])
  git(cwd, ['switch', '-c', branchFor(8)])
  git(cwd, ['remote', 'set-url', 'origin', 'https://github.com/owner/project.git'])
  saveState(f.cfg, { ...f.state, issue: otherIssue, fingerprint: fingerprint(otherIssue) })
  f.client.list = async () => [f.issue, otherIssue]; f.client.issue = async n => n === 7 ? f.issue : otherIssue
  const engine = new MockEngine([], { ok: false, detail: 'Unavailable fixture' }), assembled = f.executor(engine), calls: number[] = []
  const execute = async (cfg: typeof f.cfg, state: IssueState) => { calls.push(state.issue.number); return assembled(cfg, state) }
  vi.spyOn(Date, 'now').mockReturnValue(Date.now())
  expect(await runGithub(f.cfg, { client: f.client, execute })).toBe('7: queued')
  expect(await runGithub(f.cfg, { client: f.client, execute })).toBe('8: queued')
  expect(await runGithub(f.cfg, { client: f.client, execute })).toBe('idle')
  expect(calls).toEqual([7, 8]); expect(engine.calls).toHaveLength(0)
  expect(readState(f.cfg, 7)).toMatchObject({ runs: 0, controlRuns: 1 })
  expect(readState(f.cfg, 8)).toMatchObject({ runs: 0, controlRuns: 1 })
})
