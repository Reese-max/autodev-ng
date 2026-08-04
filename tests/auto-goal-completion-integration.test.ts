import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { AUTO_GOAL_MARKER } from '../src/autopilot/author.js'
import { BacklogStore, taskId } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { runOnce, type CycleResult, type Deps } from '../src/scheduler.js'
import type { Engine, Job, PreflightResult, RunResult } from '../src/types.js'
import { ConfigSchema } from '../src/types.js'

const roots: string[] = []
const dbs: RunDb[] = []
const TASK = '實作 auto-goal 完成閘測試功能'

afterEach(() => {
  while (dbs.length) dbs.pop()!.close()
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true, maxRetries: 5 })
})

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  }).trim()
}

class CommitEngine implements Engine {
  readonly id = 'mock'
  constructor(
    private readonly fileFor: (task: string) => string = () => 'feature.txt',
    private readonly reportedCommit: (head: string, base: string) => string = head => head,
  ) {}
  async preflight(): Promise<PreflightResult> { return { ok: true, detail: 'ready' } }
  async run(job: Job): Promise<RunResult> {
    const baseCommitHash = git(job.projectPath, ['rev-parse', 'HEAD'])
    const file = this.fileFor(job.task.text)
    writeFileSync(join(job.projectPath, file), '完成\n')
    git(job.projectPath, ['add', '--', file])
    git(job.projectPath, ['commit', '-m', 'feat: 完成 auto-goal 任務'])
    const head = git(job.projectPath, ['rev-parse', 'HEAD'])
    return {
      ok: true, output: `已完成 ${file}`, costUsd: 0,
      baseCommitHash, commitHash: this.reportedCommit(head, baseCommitHash),
    }
  }
}

interface FixtureOptions { tasks?: string[]; command?: string; evidenceFiles?: string[]; engine?: Engine }

function fixture(exitCode: number, options: FixtureOptions = {}): { deps: Deps; root: string; base: string; command: string } {
  const root = mkdtempSync(join(tmpdir(), 'adng-auto-goal-completion-'))
  roots.push(root)
  git(root, ['init', '-b', 'main'])
  git(root, ['config', 'user.email', 'adng-test@example.com'])
  git(root, ['config', 'user.name', 'adng-test'])
  git(root, ['config', 'core.autocrlf', 'false'])
  writeFileSync(join(root, '.gitignore'), 'BACKLOG.md\nGOAL.md\ndata/\nworktrees/\n')
  writeFileSync(join(root, 'README.md'), '# fixture\n')
  const backlogFile = join(root, 'BACKLOG.md')
  const tasks = options.tasks ?? [TASK]
  writeFileSync(backlogFile, tasks.map(task => `- [ ] ${task} <!-- adng:autopilot goal:g1 round:1 -->`).join('\n') + '\n')
  git(root, ['add', '--all'])
  git(root, ['commit', '-m', 'chore: init'])
  const base = git(root, ['rev-parse', 'HEAD'])
  const command = options.command ?? `"${process.execPath}" -e "process.exit(${exitCode})"`
  const goalFile = join(root, 'GOAL.md')
  const goal = [
    `${AUTO_GOAL_MARKER} problem:test -->`, '# GOAL', '', '完成 auto-goal gate 接線', '',
    '## 驗收', '', '```sh', command, '```', '',
  ]
  const evidenceFiles = options.evidenceFiles ?? ['feature.txt']
  if (evidenceFiles.length) goal.push('## 佐證檔案', ...evidenceFiles.map(file => `- ${file}`), '')
  writeFileSync(goalFile, goal.join('\n'))
  const cfg = ConfigSchema.parse({
    projectPath: root, backlogFile, goalFile, dataDir: join(root, 'data'),
    engine: 'mock', stopFile: join(root, '.adng.stop'), worktreesDir: join(root, 'worktrees'),
    verifyTimeoutMs: 10_000, artifactContract: false,
  })
  mkdirSync(cfg.dataDir, { recursive: true })
  const db = new RunDb(join(cfg.dataDir, 'run.db'))
  dbs.push(db)
  return {
    root, base, command,
    deps: {
      cfg, db, store: new BacklogStore(backlogFile), events: new EventLog(cfg.dataDir),
      engines: { resolve: () => options.engine ?? new CommitEngine() },
    },
  }
}

function events(root: string): Array<Record<string, unknown>> {
  return readFileSync(join(root, 'data', 'events.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line) as Record<string, unknown>)
}

test('auto-goal 綠燈：專屬驗收與 Git evidence 先完成，唯一出口才寫 done／task-done／成功通知', async () => {
  const f = fixture(0)
  const notices: unknown[] = []
  const result = await runOnce({ ...f.deps, taskTerminalNotify: vi.fn(async notice => { notices.push(notice); return true }) })

  expect(result).toBe('done')
  expect(readFileSync(f.deps.cfg.backlogFile, 'utf8')).toContain('- [x]')
  expect(readFileSync(join(f.root, 'feature.txt'), 'utf8')).toBe('完成\n')
  expect(notices).toHaveLength(1)
  const done = events(f.root).find(event => event.type === 'task-done')!
  const evidence = done.evidence as Record<string, unknown>
  expect(evidence).toMatchObject({
    baseCommitHash: f.base,
    commitHash: git(f.root, ['rev-parse', 'HEAD']),
    headCommitHash: git(f.root, ['rev-parse', 'HEAD']),
    expectedChanges: ['feature.txt'],
    changedFiles: ['feature.txt'],
    acceptance: { command: f.command, executed: true, exitCode: 0 },
  })
  expect(String(evidence.resultSummary)).toMatch(/^pass: ok /)
  expect(Number.isNaN(Date.parse(String(evidence.timestamp)))).toBe(false)
})

test('auto-goal 紅燈：不 merge、不寫 done/task-done、不發成功通知，分支與成果帶 gate reason 保留', async () => {
  const f = fixture(7)
  const notify = vi.fn(async () => true)
  const result = await runOnce({ ...f.deps, taskTerminalNotify: notify })

  expect(result).toMatchObject({ kind: 'blocked', reason: 'completion-gate', alertDetail: 'completion-gate：acceptance-failed:exit=7' })
  expect(git(f.root, ['rev-parse', 'HEAD'])).toBe(f.base)
  expect(existsSync(join(f.root, 'feature.txt'))).toBe(false)
  expect(readFileSync(f.deps.cfg.backlogFile, 'utf8')).toContain('completion-gate：acceptance-failed:exit=7')
  const worktree = join(f.deps.cfg.worktreesDir, taskId(TASK))
  expect(readFileSync(join(worktree, 'feature.txt'), 'utf8')).toBe('完成\n')
  expect(git(f.root, ['branch', '--list', `adng/${taskId(TASK)}`])).toContain(`adng/${taskId(TASK)}`)
  expect(events(f.root).some(event => event.type === 'task-done')).toBe(false)
  expect(events(f.root)).toEqual(expect.arrayContaining([
    expect.objectContaining({ type: 'auto-goal-completion-gate-rejected', reason: 'acceptance-failed:exit=7' }),
    expect.objectContaining({ type: 'worktree-kept' }),
  ]))
  expect(notify).not.toHaveBeenCalled()
})

test('auto-goal Git 對帳：引擎回報的 commit 不是實際 HEAD 時 fail-closed', async () => {
  const engine = new CommitEngine(undefined, (_head, base) => base)
  const f = fixture(0, { engine })

  expect(await runOnce(f.deps)).toMatchObject({
    kind: 'blocked', reason: 'completion-gate', alertDetail: 'completion-gate：head-commit-mismatch',
  })
  expect(git(f.root, ['rev-parse', 'HEAD'])).toBe(f.base)
  expect(events(f.root).some(event => event.type === 'task-done')).toBe(false)
})

test('M1 auto-goal 閉環：3 任務混合 2 completed／1 gate blocked，最後回 idle', async () => {
  const tasks = ['任務A', '任務B', '任務C']
  const command = `"${process.execPath}" -e "process.exit(require('node:fs').existsSync('bad.txt') ? 7 : 0)"`
  const engine = new CommitEngine(task => task === '任務B' ? 'bad.txt' : `${task}.txt`)
  const f = fixture(0, { tasks, command, evidenceFiles: [], engine })

  const results: CycleResult[] = []
  for (let i = 0; i < 5; i++) results.push(await runOnce(f.deps))

  expect(results).toEqual([
    'done',
    { kind: 'blocked', taskId: taskId('任務B'), taskText: '任務B', reason: 'completion-gate', alertDetail: 'completion-gate：acceptance-failed:exit=7' },
    'done', 'idle', 'idle',
  ])
  const recorded = events(f.root)
  expect(recorded.filter(event => event.type === 'task-done')).toHaveLength(2)
  expect(recorded.filter(event => event.type === 'auto-goal-completion-gate-rejected')).toHaveLength(1)
  expect(JSON.parse(readFileSync(join(f.deps.cfg.dataDir, 'heartbeat.json'), 'utf8')).state).toBe('idle')
})
