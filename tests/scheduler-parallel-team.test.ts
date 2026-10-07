import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { writeFile as writeFileAsync } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'

const receiptFailures = vi.hoisted(() => ({ terminal: false, recovery: false, terminalAttempts: 0 }))
vi.mock('../src/guardian/incident.js', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/guardian/incident.js')>()
  return { ...actual, writeJsonAtomic(file: string, value: unknown) {
    const phase = (value as { phase?: string })?.phase
    if (receiptFailures.terminal && phase === 'terminal') {
      receiptFailures.terminalAttempts++
      throw Object.assign(new Error('fixture terminal receipt disk full'), { code: 'ENOSPC' })
    }
    if (receiptFailures.recovery && phase === 'unknown')
      throw Object.assign(new Error('fixture recovery receipt disk full'), { code: 'ENOSPC' })
    actual.writeJsonAtomic(file, value)
  } }
})
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { TeamState } from '../src/engines/team-state.js'
import { cancelledRun } from '../src/engines/run-control.js'
import { executionInventoryFull, readExecution, readExecutions, type ExecutionInventory, type ExecutionSnapshot } from '../src/engines/execution-observation.js'
import { EventLog } from '../src/events.js'
import { runOnce, type Deps } from '../src/scheduler.js'
import { ConfigSchema, type Engine, type Job, type RunResult } from '../src/types.js'

const roots: string[] = []
afterEach(() => {
  receiptFailures.terminal = false; receiptFailures.recovery = false; receiptFailures.terminalAttempts = 0
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true })
}, 180_000)

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function fixture(lines: string, concurrency: number): { deps: Deps; repo: string; backlog: string; db: RunDb; team: TeamState } {
  const root = mkdtempSync(join(tmpdir(), 'adng-parallel-')), repo = join(root, 'repo')
  roots.push(root)
  execFileSync('git', ['init', '-b', 'main', repo], { stdio: 'ignore' })
  git(repo, ['config', 'user.email', 'adng-test@example.com'])
  git(repo, ['config', 'user.name', 'adng-test'])
  writeFileSync(join(repo, 'README.md'), '# parallel\n')
  git(repo, ['add', '.']); git(repo, ['commit', '-m', 'init'])
  const backlog = join(root, 'BACKLOG.md'), dataDir = join(root, 'data')
  writeFileSync(backlog, lines)
  const cfg = ConfigSchema.parse({
    projectPath: repo, backlogFile: backlog, dataDir, engine: 'mock', concurrency,
    defaultRisk: 'low', artifactContract: false, verifyCommand: `"${process.execPath}" -e "process.exit(0)"`,
    stopFile: join(root, '.adng.stop'), worktreesDir: join(root, 'worktrees'),
  })
  const db = new RunDb(join(root, 'run.db')), team = new TeamState(repo)
  return { repo, backlog, db, team, deps: { cfg, store: new BacklogStore(backlog), db, team, engines: {} as never, events: new EventLog(dataDir) } }
}

async function runUncertainStop(afterNudge: boolean): Promise<void> {
  const f = fixture('- [ ] cancelled writer\n', 1)
  let calls = 0, cwd = ''
  f.deps.engines = { resolve: () => ({ id: 'mock', preflight: async () => ({ ok: true, detail: 'fake' }), run: async job => {
    cwd = job.projectPath
    if (++calls === 1 && afterNudge) return { ok: false, costUsd: 0, output: '', failureReason: 'no-commit' }
    writeFileSync(join(cwd, 'checkpoint.txt'), 'keep me')
    return cancelledRun('signal 15')
  } }) }
  const task = f.deps.store.read()[0]!
  try {
    expect(await runOnce(f.deps)).toMatchObject({ kind: 'blocked', reason: 'team-state-quarantined' })
    expect(calls).toBe(afterNudge ? 2 : 1)
    expect(f.db.taskFailCount(task.id)).toBe(0)
    expect(readFileSync(join(cwd, 'checkpoint.txt'), 'utf8')).toBe('keep me')
    expect(f.team.snapshot().claims).toMatchObject([{ state: 'QUARANTINED' }])
    expect(f.team.claim({ executionId: 'another', task: { ...task, id: 'other-task' }, workerId: 'mock', reservedCostUsd: 0, spentUsd: 0, dailyHardUsd: 0, leaseMs: 1000 })).toMatchObject({ ok: false, reason: 'ownership-conflict' })
    expect(await runOnce(f.deps)).toBe('idle')
    expect(calls).toBe(afterNudge ? 2 : 1)
  } finally { f.db.close(); f.team.close() }
}

test('uncertain stop (after nudge=false) keeps ownership and never retries or charges a task failure', () => runUncertainStop(false), 60_000)
test('uncertain stop (after nudge=true) keeps ownership and never retries or charges a task failure', () => runUncertainStop(true), 60_000)

class BarrierEngine implements Engine {
  readonly id = 'parallel-engine'
  preflightCalls = 0
  active = 0
  maxActive = 0
  private entered = 0
  private release!: () => void
  private readonly gate = new Promise<void>(resolve => { this.release = resolve })
  constructor(private readonly outsideScope = false, private readonly reportVerifiedExit = false) {}
  async preflight() { this.preflightCalls++; return { ok: true, detail: 'ok' } }
  async run(job: Job): Promise<RunResult> {
    const before = git(job.projectPath, ['rev-parse', 'HEAD'])
    this.active++; this.entered++; this.maxActive = Math.max(this.maxActive, this.active)
    if (this.entered === 2 || this.outsideScope) this.release()
    await this.gate
    const name = this.outsideScope ? 'outside.txt' : (job.task.text.includes('A') ? 'a.txt' : 'b.txt')
    writeFileSync(join(job.projectPath, name), `${job.task.text}\n`)
    git(job.projectPath, ['add', name]); git(job.projectPath, ['commit', '-m', `feat: ${job.task.text}`])
    this.active--
    if (this.reportVerifiedExit) job.control?.onEvent?.({ type: 'exit', code: 0, reason: 'exit' })
    return { ok: true, output: `created ${name}`, costUsd: 0, baseCommitHash: before, commitHash: git(job.projectPath, ['rev-parse', 'HEAD']) }
  }
}

class SingleAdmissionEngine implements Engine {
  readonly id = 'single-admission-engine'
  preflightCalls = 0
  runCalls = 0
  executionIds: string[] = []
  async preflight() { this.preflightCalls++; return { ok: true, detail: 'ok' } }
  async run(job: Job): Promise<RunResult> {
    this.runCalls++
    this.executionIds.push(job.executionId!)
    const baseCommitHash = git(job.projectPath, ['rev-parse', 'HEAD'])
    writeFileSync(join(job.projectPath, 'archive-admission.txt'), `${job.task.text}\n`)
    git(job.projectPath, ['add', 'archive-admission.txt'])
    git(job.projectPath, ['commit', '-m', 'feat: admit with archived history'])
    job.control?.onEvent?.({ type: 'exit', code: 0, reason: 'exit' })
    return { ok: true, output: 'admitted', costUsd: 0, baseCommitHash, commitHash: git(job.projectPath, ['rev-parse', 'HEAD']) }
  }
}

async function writeReceiptFixture(folder: string, count: number, makeRecord: (id: string) => unknown): Promise<void> {
  mkdirSync(folder, { recursive: true })
  const batchSize = 256
  for (let start = 0; start < count; start += batchSize) {
    const end = Math.min(start + batchSize, count)
    await Promise.all(Array.from({ length: end - start }, async (_, offset) => {
      const id = 'receipt-' + String(start + offset).padStart(5, '0')
      await writeFileAsync(join(folder, id + '.json'), JSON.stringify(makeRecord(id)))
    }))
  }
}

function activeReceipt(executionId: string, projectPath: string): ExecutionSnapshot {
  return { version: 1, executionId, taskId: 'old-task-' + executionId, adapter: 'codex', projectPath,
    hostPid: process.pid, hostStartedAt: 1, startedAt: 1, observedAt: 1, sequence: 0,
    phase: 'running', outputBytes: 0, unknownSamples: 0, degraded: false, cancelRequested: false }
}

function terminalReceipt(executionId: string, projectPath: string): ExecutionSnapshot {
  return { ...activeReceipt(executionId, projectPath), phase: 'terminal', exit: { code: 0, reason: 'exit' }, outcome: 'completed' }
}

class StopAfterCommitEngine implements Engine {
  readonly id = 'stop-engine'
  calls = 0
  constructor(private readonly stopFile: string) {}
  async preflight() { return { ok: true, detail: 'ok' } }
  async run(job: Job): Promise<RunResult> {
    this.calls++
    const before = git(job.projectPath, ['rev-parse', 'HEAD'])
    writeFileSync(join(job.projectPath, 'paused.txt'), 'candidate\n')
    git(job.projectPath, ['add', 'paused.txt']); git(job.projectPath, ['commit', '-m', 'feat: paused candidate'])
    writeFileSync(this.stopFile, 'pause during worker')
    return { ok: true, output: 'candidate ready', costUsd: 0, baseCommitHash: before, commitHash: git(job.projectPath, ['rev-parse', 'HEAD']) }
  }
}

test('observed scheduler keeps its receipt through verification and closes it after the merged result', async () => {
  const f = fixture('- [ ] observed work\n', 1)
  let observedExecutionId = ''
  try {
  f.deps.cfg.engines[f.deps.cfg.defaultEngine]!.executionMode = 'observed'
  const engine = new BarrierEngine(true, true)
  f.deps.engines = { resolve: () => engine }
  f.deps.verifier = { check: async job => {
    observedExecutionId = job.executionId!
    expect(readExecutions(f.deps.cfg.dataDir).records).toMatchObject([{ executionId: job.executionId, phase: 'running' }])
    return { pass: true, alerts: [] }
  } }
    expect(await runOnce(f.deps)).toBe('done')
    expect(readExecutions(f.deps.cfg.dataDir)).toMatchObject({ protected: false, records: [], capacityExceeded: false })
    expect(readExecution(f.deps.cfg.dataDir, observedExecutionId)).toMatchObject({ phase: 'terminal', outcome: 'completed' })
  } finally { f.db.close(); f.team.close() }
}, 60_000)

test('finish-only receipt ENOSPC preserves the merged result, quarantines its claim and blocks the next task after storage recovers', async () => {
  const f = fixture('- [ ] merge before receipt storage failure\n', 1), engine = new SingleAdmissionEngine()
  let receiptFile = '', durableReceipt = ''
  f.deps.cfg.engines[f.deps.cfg.defaultEngine]!.executionMode = 'observed'
  f.deps.engines = { resolve: () => engine }
  f.deps.verifier = { check: async job => {
    receiptFile = join(f.deps.cfg.dataDir, 'executions', 'active', job.executionId! + '.json')
    durableReceipt = readFileSync(receiptFile, 'utf8')
    expect(JSON.parse(durableReceipt)).toMatchObject({ phase: 'validating', exit: { code: 0, reason: 'exit' }, degraded: false })
    receiptFailures.terminal = true; receiptFailures.recovery = true
    return { pass: true, alerts: [] }
  } }
  try {
    expect(await runOnce(f.deps)).toBe('done')
    expect(readFileSync(join(f.repo, 'archive-admission.txt'), 'utf8')).toContain('merge before receipt storage failure')
    expect(readFileSync(f.backlog, 'utf8')).toContain('- [x]')
    expect(receiptFailures.terminalAttempts).toBe(1)
    expect(engine.runCalls).toBe(1)
    const protectedTeam = f.team.snapshot()
    expect(protectedTeam.claims).toMatchObject([{ execution_id: engine.executionIds[0], active: 1, state: 'QUARANTINED' }])
    expect(protectedTeam.queue).toMatchObject([{ state: 'DONE' }])
    expect(readFileSync(receiptFile, 'utf8')).toBe(durableReceipt)
    expect(readdirSync(join(f.deps.cfg.dataDir, 'executions', 'history'))).toEqual([])
    expect(existsSync(join(f.deps.cfg.dataDir, 'executions', '.inventory.lock'))).toBe(true)
    expect(readExecutions(f.deps.cfg.dataDir)).toMatchObject({ protected: true, capacityExceeded: false })

    receiptFailures.terminal = false; receiptFailures.recovery = false
    writeFileSync(f.backlog, readFileSync(f.backlog, 'utf8') + '- [ ] fresh work after storage recovery\n')
    expect(await runOnce(f.deps)).toMatchObject({ kind: 'blocked', reason: 'team-state-quarantined' })
    expect(engine.preflightCalls).toBe(1)
    expect(engine.runCalls).toBe(1)
    expect(f.team.snapshot()).toEqual(protectedTeam)
    expect(readFileSync(receiptFile, 'utf8')).toBe(durableReceipt)
  } finally { f.db.close(); f.team.close() }
}, 60_000)

test('in-memory production inventory with exactly 10,000 active receipts blocks admission before preflight, team claim, or worktree', async () => {
  const f = fixture('- [ ] keep pending at capacity\n', 1), engine = new BarrierEngine()
  f.deps.engines = { resolve: () => engine }
  try {
    const inventory: ExecutionInventory = {
      records: Array.from({ length: 10_000 }, (_, index) => activeReceipt('receipt-' + String(index).padStart(5, '0'), f.repo)),
      errors: ['active execution capacity reached (10000 >= 10000)'], protected: true, diagnosisDue: true,
      capacityExceeded: executionInventoryFull(10_000),
    }
    f.deps.executionInventory = () => inventory
    expect(inventory.records).toHaveLength(10_000)
    expect(inventory.capacityExceeded).toBe(true)
    expect(await runOnce(f.deps)).toMatchObject({ kind: 'blocked', reason: 'execution-inventory-capacity' })
    expect(engine.preflightCalls).toBe(0)
    expect(engine.maxActive).toBe(0)
    expect(f.team.snapshot().claims).toEqual([])
    expect(existsSync(f.deps.cfg.worktreesDir)).toBe(false)
  } finally { f.db.close(); f.team.close() }
})

test.each(['unknown', 'running same task', 'corrupt'])('legacy engine rereads a real %s receipt created during healthy preflight before claim or worktree', async state => {
  const f = fixture('- [ ] task awaiting healthy preflight\n', 1), engine = new SingleAdmissionEngine()
  const folder = join(f.deps.cfg.dataDir, 'executions'), id = 'preflight-race'
  const task = f.deps.store.read()[0]!
  const receipt = { ...activeReceipt(id, f.repo),
    phase: state === 'unknown' ? 'unknown' : 'running', taskId: state === 'running same task' ? task.id : 'other-task' }
  const bytes = state === 'corrupt' ? '{corrupt preflight receipt' : JSON.stringify(receipt)
  f.deps.cfg.engines[f.deps.cfg.defaultEngine]!.executionMode = 'bounded'
  f.deps.engines = { resolve: () => engine }
  engine.preflight = async () => {
    engine.preflightCalls++
    mkdirSync(folder, { recursive: true })
    writeFileSync(join(folder, id + '.json'), bytes)
    return { ok: true, detail: 'healthy mocked preflight' }
  }
  try {
    expect(f.deps.executionInventory).toBeUndefined()
    expect(await runOnce(f.deps)).toMatchObject({ kind: 'blocked', reason: 'team-state-quarantined' })
    expect(engine.preflightCalls).toBe(1)
    expect(engine.runCalls).toBe(0)
    expect(f.team.snapshot().claims).toEqual([])
    expect(f.db.taskFailCount(task.id)).toBe(0)
    expect(existsSync(f.deps.cfg.worktreesDir)).toBe(false)
    expect(readExecutions(f.deps.cfg.dataDir)).toMatchObject({ protected: true, capacityExceeded: false })
    expect(readFileSync(join(folder, 'active', id + '.json'), 'utf8')).toBe(bytes)
  } finally { f.db.close(); f.team.close() }
}, 60_000)

test('capacity reached during healthy preflight is rechecked before legacy engine claim or worktree', async () => {
  const f = fixture('- [ ] task awaiting capacity recheck\n', 1), engine = new SingleAdmissionEngine()
  let inventoryReads = 0
  const empty: ExecutionInventory = { records: [], errors: [], protected: false, diagnosisDue: false, capacityExceeded: false }
  const full: ExecutionInventory = {
    records: Array.from({ length: 10_000 }, (_, index) => activeReceipt('receipt-' + String(index).padStart(5, '0'), f.repo)),
    errors: ['active execution capacity reached (10000 >= 10000)'], protected: true, diagnosisDue: true,
    capacityExceeded: executionInventoryFull(10_000),
  }
  f.deps.cfg.engines[f.deps.cfg.defaultEngine]!.executionMode = 'bounded'
  f.deps.engines = { resolve: () => engine }
  f.deps.executionInventory = () => ++inventoryReads === 1 ? empty : full
  try {
    expect(await runOnce(f.deps)).toMatchObject({ kind: 'blocked', reason: 'execution-inventory-capacity' })
    expect(inventoryReads).toBe(2)
    expect(engine.preflightCalls).toBe(1)
    expect(engine.runCalls).toBe(0)
    expect(f.team.snapshot().claims).toEqual([])
    expect(existsSync(f.deps.cfg.worktreesDir)).toBe(false)
  } finally { f.db.close(); f.team.close() }
}, 60_000)

test.each([9_999, 10_000, 10_001])('physical legacy history with %i terminal receipts admits work, survives restart and restores from a backup', async count => {
  const f = fixture('- [ ] work with a large legacy history\n', 1), engine = new SingleAdmissionEngine()
  const folder = join(f.deps.cfg.dataDir, 'executions'), history = join(folder, 'history')
  let db = f.db, team = f.team
  const restoredData = mkdtempSync(join(tmpdir(), 'adng-history-restore-'))
  roots.push(restoredData)
  f.deps.engines = { resolve: () => engine }
  f.deps.cfg.engines[f.deps.cfg.defaultEngine]!.executionMode = 'observed'
  try {
    await writeReceiptFixture(folder, count, id => {
      const sequence = Number(id.slice('receipt-'.length))
      return { ...terminalReceipt(id, f.repo), sequence, outputBytes: sequence,
        outcome: sequence % 2 === 0 ? 'completed' : 'failed', exit: { code: sequence % 2, reason: 'exit' } }
    })
    expect(existsSync(history)).toBe(false)
    const samples = [0, Math.floor(count / 2), count - 1].map(index => {
      const id = 'receipt-' + String(index).padStart(5, '0')
      return { id, bytes: readFileSync(join(folder, id + '.json'), 'utf8') }
    })
    const assertHistory = (dataDir: string, expectedCount: number): void => {
      const executions = join(dataDir, 'executions')
      expect(readExecutions(dataDir)).toEqual({ protected: false, diagnosisDue: false, records: [], errors: [], capacityExceeded: false })
      expect(readdirSync(join(executions, 'active'))).toEqual([])
      expect(readdirSync(join(executions, 'history'))).toHaveLength(expectedCount)
      for (const sample of samples) {
        expect(readExecution(dataDir, sample.id)).toEqual(JSON.parse(sample.bytes))
        expect(readFileSync(join(executions, 'history', sample.id + '.json'), 'utf8')).toBe(sample.bytes)
        expect(existsSync(join(executions, sample.id + '.json'))).toBe(false)
      }
    }
    // runOnce must discover and migrate the real legacy files through its production inventory reader.
    expect(f.deps.executionInventory).toBeUndefined()
    expect(await runOnce(f.deps)).toBe('done')
    expect(engine.preflightCalls).toBe(1)
    expect(engine.runCalls).toBe(1)
    assertHistory(f.deps.cfg.dataDir, count + 1)
    assertHistory(f.deps.cfg.dataDir, count + 1)
    expect(readExecution(f.deps.cfg.dataDir, engine.executionIds[0]!)).toMatchObject({ phase: 'terminal', outcome: 'completed' })

    // Reopen the scheduler's durable state as an isolated restart simulation and dispatch another task.
    db.close(); team.close()
    db = new RunDb(join(dirname(f.backlog), 'run.db')); team = new TeamState(f.repo)
    writeFileSync(f.backlog, '- [ ] work after isolated scheduler restart\n')
    const restarted = { ...f.deps, db, team, store: new BacklogStore(f.backlog) }
    assertHistory(restarted.cfg.dataDir, count + 1)
    expect(await runOnce(restarted)).toBe('done')
    expect(engine.preflightCalls).toBe(2)
    expect(engine.runCalls).toBe(2)
    assertHistory(restarted.cfg.dataDir, count + 2)

    cpSync(folder, join(restoredData, 'executions'), { recursive: true })
    assertHistory(restoredData, count + 2)
    assertHistory(restoredData, count + 2)
    for (const id of engine.executionIds)
      expect(readExecution(restoredData, id)).toEqual(readExecution(restarted.cfg.dataDir, id))
  } finally { db.close(); team.close() }
}, 300_000)

test.each([
  'running same task', 'unknown different task', 'waiting_input same task', 'terminal cancellation sidecar',
  'corrupt receipt', 'unverified terminal same task', 'unverified terminal different task',
  'unconfirmed terminal different task', 'degraded terminal different task', 'duplicate restored identity',
])('mixed legacy history rejects %s while preserving receipts and existing claims', async state => {
  const meta = '<!-- adng:ownership {"write":["archive-admission.txt"],"resources":[],"risk":"low"} -->'
  const f = fixture(`- [ ] protected admission ${meta}\n`, 1), engine = new SingleAdmissionEngine()
  f.deps.engines = { resolve: () => engine }
  const folder = join(f.deps.cfg.dataDir, 'executions'), id = 'protected-existing-execution'
  const task = f.deps.store.read()[0]!
  const claim = f.team.claim({ executionId: 'protected-claim', workerId: 'mock', reservedCostUsd: 0,
    task: { ...task, id: 'other-owned-task', ownership: { write: ['protected.txt'], resources: [], risk: 'low' } },
    spentUsd: 0, dailyHardUsd: 0, leaseMs: 300_000 })
  expect(claim.ok).toBe(true)
  const claimsBefore = f.team.snapshot()
  try {
    await writeReceiptFixture(folder, 2, receiptId => terminalReceipt(receiptId, f.repo))
    let receipt: ExecutionSnapshot = { ...terminalReceipt(id, f.repo), taskId: task.id }
    if (state === 'running same task') receipt = { ...activeReceipt(id, f.repo), taskId: task.id }
    if (state === 'waiting_input same task') receipt = { ...activeReceipt(id, f.repo), taskId: task.id, phase: 'waiting_input' }
    if (state === 'unknown different task') receipt = { ...activeReceipt(id, f.repo), taskId: 'other-task', phase: 'unknown', outcome: 'unconfirmed' }
    if (state === 'duplicate restored identity') receipt = { ...activeReceipt(id, f.repo), taskId: 'other-task' }
    if (state.startsWith('unverified terminal')) receipt = { ...receipt, exit: undefined }
    if (state === 'unconfirmed terminal different task') receipt = { ...receipt, outcome: 'unconfirmed' }
    if (state === 'degraded terminal different task') receipt = { ...receipt, degraded: true }
    if (state.endsWith('different task')) receipt = { ...receipt, taskId: 'other-task' }
    const bytes = state === 'corrupt receipt' ? '{broken' : JSON.stringify(receipt)
    writeFileSync(join(folder, id + '.json'), bytes)
    const restoredBytes = JSON.stringify({ ...terminalReceipt(id, f.repo), taskId: 'restored-older-task', sequence: 99, outputBytes: 123 })
    if (state === 'duplicate restored identity') {
      mkdirSync(join(folder, 'history'), { recursive: true })
      writeFileSync(join(folder, 'history', id + '.json'), restoredBytes)
    }
    const cancelBytes = JSON.stringify({ executionId: id, hostPid: process.pid, hostStartedAt: 1, requestedAt: 1 })
    if (state === 'terminal cancellation sidecar') writeFileSync(join(folder, id + '.cancel.json'), cancelBytes)

    expect(f.deps.executionInventory).toBeUndefined()
    expect(await runOnce(f.deps)).toMatchObject({ kind: 'blocked', reason: 'team-state-quarantined' })
    expect(engine.runCalls).toBe(0)
    if (state !== 'running same task' && state !== 'waiting_input same task') expect(engine.preflightCalls).toBe(0)
    expect(f.db.taskFailCount(task.id)).toBe(0)
    expect(f.team.snapshot()).toEqual(claimsBefore)
    expect(existsSync(f.deps.cfg.worktreesDir)).toBe(false)
    expect(readExecutions(f.deps.cfg.dataDir)).toMatchObject({ protected: true, capacityExceeded: false })
    expect(readFileSync(join(folder, 'active', id + '.json'), 'utf8')).toBe(bytes)
    const historyNames = ['receipt-00000.json', 'receipt-00001.json']
    if (state === 'duplicate restored identity') historyNames.push(id + '.json')
    expect(readdirSync(join(folder, 'history')).sort()).toEqual(historyNames.sort())
    if (state === 'corrupt receipt') expect(() => readExecution(f.deps.cfg.dataDir, id)).toThrow()
    else if (state === 'duplicate restored identity') {
      expect(() => readExecution(f.deps.cfg.dataDir, id)).toThrow('both active and history')
      expect(readFileSync(join(folder, 'history', id + '.json'), 'utf8')).toBe(restoredBytes)
    }
    else expect(readExecution(f.deps.cfg.dataDir, id)).toEqual(JSON.parse(bytes))
    if (state === 'terminal cancellation sidecar') expect(readFileSync(join(folder, 'active', id + '.cancel.json'), 'utf8')).toBe(cancelBytes)
    expect(await runOnce(f.deps)).toBe('idle')
    expect(engine.runCalls).toBe(0)
    expect(f.team.snapshot()).toEqual(claimsBefore)
    if (claim.ok) expect(f.team.heartbeat('protected-claim', claim.token, 300_000)).toBe(true)
  } finally { f.db.close(); f.team.close() }
}, 60_000)

test('concurrency=2：兩個 disjoint ownership Engineer 真正重疊，merge queue 仍依序完成', async () => {
  const metaA = '<!-- adng:ownership {"write":["a.txt"],"resources":[],"risk":"low"} -->'
  const metaB = '<!-- adng:ownership {"write":["b.txt"],"resources":[],"risk":"low"} -->'
  const f = fixture(`- [ ] 任務 A ${metaA}\n- [ ] 任務 B ${metaB}\n`, 2)
  const engine = new BarrierEngine()
  f.deps.engines = { resolve: () => engine }
  try {
    expect(await runOnce(f.deps)).toBe('done')
    expect(engine.maxActive).toBe(2)
    expect(readFileSync(f.backlog, 'utf8').match(/- \[x\]/g)).toHaveLength(2)
    expect(readFileSync(join(f.repo, 'a.txt'), 'utf8')).toContain('任務 A')
    expect(readFileSync(join(f.repo, 'b.txt'), 'utf8')).toContain('任務 B')
    expect(f.team.snapshot().queue.map(q => q.state)).toEqual(['DONE', 'DONE'])
  } finally { f.db.close(); f.team.close() }
}, 120_000)

test('實際 diff 超出 ownership → BLOCKED，候選 worktree 保留且 main 不受污染', async () => {
  const meta = '<!-- adng:ownership {"write":["allowed.txt"],"resources":[],"risk":"low"} -->'
  const f = fixture(`- [ ] 越界任務 ${meta}\n`, 1)
  const engine = new BarrierEngine(true)
  f.deps.engines = { resolve: () => engine }
  try {
    expect(await runOnce(f.deps)).toMatchObject({ kind: 'blocked', reason: 'ownership-drift' })
    expect(() => readFileSync(join(f.repo, 'outside.txt'), 'utf8')).toThrow()
    expect(f.team.snapshot().queue).toEqual([])
  } finally { f.db.close(); f.team.close() }
}, 60_000)

test('tracked dirty main 在 Engine 前 BLOCKED，不先花模型成本', async () => {
  const f = fixture('- [ ] 不應執行\n', 1), engine = new BarrierEngine(true)
  f.deps.engines = { resolve: () => engine }
  writeFileSync(join(f.repo, 'README.md'), '# dirty\n')
  try {
    expect(await runOnce(f.deps)).toMatchObject({ kind: 'blocked', reason: 'dirty-worktree' })
    expect(engine.maxActive).toBe(0)
    expect(f.team.snapshot().claims).toEqual([])
  } finally { f.db.close(); f.team.close() }
})

test('worker 執行中出現 stop sentinel：不啟 Reviewer／不 merge，候選進 PAUSED_READY 並保留 worktree', async () => {
  const meta = '<!-- adng:ownership {"write":["paused.txt"],"resources":[],"risk":"low"} -->'
  const f = fixture(`- [ ] 可暫停任務 ${meta}\n`, 1), engine = new StopAfterCommitEngine(f.deps.cfg.stopFile)
  let reviews = 0
  f.deps.engines = { resolve: () => engine }
  f.deps.verifier = { check: async () => { reviews++; return { pass: true, alerts: [] } } }
  try {
    expect(await runOnce(f.deps)).toBe('stopped')
    expect(engine.calls).toBe(1)
    expect(reviews).toBe(0)
    expect(() => readFileSync(join(f.repo, 'paused.txt'), 'utf8')).toThrow()
    expect(readFileSync(f.backlog, 'utf8')).toContain('- [ ] 可暫停任務')
    expect(f.team.snapshot().queue).toMatchObject([{ state: 'PAUSED_READY' }])
    expect(await runOnce(f.deps)).toBe('stopped')
  } finally { f.db.close(); f.team.close() }
}, 60_000)
