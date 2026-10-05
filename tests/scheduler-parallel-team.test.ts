import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { TeamState } from '../src/engines/team-state.js'
import { cancelledRun } from '../src/engines/run-control.js'
import { readExecutions } from '../src/engines/execution-observation.js'
import { EventLog } from '../src/events.js'
import { runOnce, type Deps } from '../src/scheduler.js'
import { ConfigSchema, type Engine, type Job, type RunResult } from '../src/types.js'

const roots: string[] = []
afterEach(() => { while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true }) })

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

test.each([false, true])('uncertain stop (after nudge=%s) keeps ownership and never retries or charges a task failure', async (afterNudge) => {
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
})

class BarrierEngine implements Engine {
  readonly id = 'parallel-engine'
  active = 0
  maxActive = 0
  private entered = 0
  private release!: () => void
  private readonly gate = new Promise<void>(resolve => { this.release = resolve })
  constructor(private readonly outsideScope = false) {}
  async preflight() { return { ok: true, detail: 'ok' } }
  async run(job: Job): Promise<RunResult> {
    const before = git(job.projectPath, ['rev-parse', 'HEAD'])
    this.active++; this.entered++; this.maxActive = Math.max(this.maxActive, this.active)
    if (this.entered === 2 || this.outsideScope) this.release()
    await this.gate
    const name = this.outsideScope ? 'outside.txt' : (job.task.text.includes('A') ? 'a.txt' : 'b.txt')
    writeFileSync(join(job.projectPath, name), `${job.task.text}\n`)
    git(job.projectPath, ['add', name]); git(job.projectPath, ['commit', '-m', `feat: ${job.task.text}`])
    this.active--
    return { ok: true, output: `created ${name}`, costUsd: 0, baseCommitHash: before, commitHash: git(job.projectPath, ['rev-parse', 'HEAD']) }
  }
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
  try {
  f.deps.cfg.engines[f.deps.cfg.defaultEngine]!.executionMode = 'observed'
  const engine = new BarrierEngine(true)
  f.deps.engines = { resolve: () => engine }
  f.deps.verifier = { check: async job => {
    expect(readExecutions(f.deps.cfg.dataDir).records).toMatchObject([{ executionId: job.executionId, phase: 'running' }])
    return { pass: true, alerts: [] }
  } }
    expect(await runOnce(f.deps)).toBe('done')
    expect(readExecutions(f.deps.cfg.dataDir)).toMatchObject({ protected: false, records: [{ phase: 'terminal', outcome: 'completed' }] })
  } finally { f.db.close(); f.team.close() }
})

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
})

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
})

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
})
