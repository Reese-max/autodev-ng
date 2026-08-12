import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { AUTO_GOAL_MARKER } from '../src/autopilot/author.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { runOnce, type Deps } from '../src/scheduler.js'
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

test('GOAL 整體驗收不在子任務層執行：紅燈命令與缺少 evidence 都不會把子任務 blocked', async () => {
  const f = fixture(7, { evidenceFiles: ['expected.txt'], engine: new CommitEngine(() => 'other.txt') })
  const notify = vi.fn(async () => true)

  expect(await runOnce({ ...f.deps, taskTerminalNotify: notify })).toBe('done')
  expect(readFileSync(f.deps.cfg.backlogFile, 'utf8')).toContain('- [x]')
  expect(readFileSync(join(f.root, 'other.txt'), 'utf8')).toBe('完成\n')
  expect(git(f.root, ['rev-parse', 'HEAD'])).not.toBe(f.base)
  expect(events(f.root).some(event => event.type === 'auto-goal-completion-gate-rejected')).toBe(false)
  expect(events(f.root).find(event => event.type === 'task-done')).not.toHaveProperty('evidence')
  expect(notify).toHaveBeenCalledOnce()
})
