import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { BacklogStore, taskId } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { MockEngine } from '../src/engines/mock.js'
import { EventLog } from '../src/events.js'
import { runOnce, type Deps } from '../src/scheduler.js'
import { ConfigSchema } from '../src/types.js'
import { mergeBack, prepareWorktree } from '../src/worktree.js'

const roots: string[] = []
const dbs: RunDb[] = []
const TASK = '任務一'
const NODE = process.execPath

afterEach(() => {
  while (dbs.length) dbs.pop()!.close()
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true })
})

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

function commitFile(cwd: string, name: string, content: string, message: string): void {
  writeFileSync(join(cwd, name), content)
  git(cwd, ['add', '--all'])
  git(cwd, ['commit', '-m', message])
}

function verifyCommand(exitCode: 0 | 1): string {
  return `"${NODE}" -e "process.exit(${exitCode})"`
}

function makeGoal(command: string): string {
  return `# GOAL\n\n測試 rebase 後驗收\n\n## 驗收\n\n\`\`\`sh\n${command}\n\`\`\`\n`
}

function fixture(goalCommand: string, globalCommand: string, conflict = false): { deps: Deps; root: string } {
  const root = mkdtempSync(join(process.cwd(), '.tmp-merge-rebase-'))
  roots.push(root)
  git(root, ['init', '-b', 'main'])
  git(root, ['config', 'user.email', 'adng-test@example.com'])
  git(root, ['config', 'user.name', 'adng-test'])
  const goalFile = join(root, 'GOAL.md')
  writeFileSync(join(root, '.gitignore'), 'run.db*\ndata/\nworktrees/\n')
  writeFileSync(join(root, 'README.md'), '# test\n')
  writeFileSync(goalFile, makeGoal(goalCommand))
  const backlogFile = join(root, 'BACKLOG.md')
  writeFileSync(backlogFile, `- [ ] ${TASK}\n`)
  git(root, ['add', '--all'])
  git(root, ['commit', '-m', 'chore: init'])

  let projectPath = ''
  const engine = new MockEngine([{
    ok: true,
    beforeResult: job => {
      commitFile(job.projectPath, conflict ? 'same.txt' : 'feature.txt', 'engine\n', 'feat: 任務完成')
      commitFile(projectPath, conflict ? 'same.txt' : 'third-party.txt', 'main\n', 'chore: 第三方推進')
      return git(job.projectPath, ['rev-parse', 'HEAD'])
    },
  }])
  const cfg = ConfigSchema.parse({
    projectPath: root,
    backlogFile,
    goalFile,
    dataDir: join(root, 'data'),
    engine: 'mock',
    verifyCommand: globalCommand,
    verifyTimeoutMs: 20_000,
    artifactContract: false,
    stopFile: join(root, '.adng.stop'),
    worktreesDir: join(root, 'worktrees'),
  })
  projectPath = cfg.projectPath
  const db = new RunDb(join(root, 'run.db'))
  dbs.push(db)
  return {
    root,
    deps: {
      cfg,
      store: new BacklogStore(backlogFile),
      db,
      engines: { resolve: () => engine },
      events: new EventLog(cfg.dataDir),
    },
  }
}

test('rebase 後只跑專案 verifyCommand；GOAL 整體紅燈不在子任務層阻擋合併', async () => {
  const { deps, root } = fixture(verifyCommand(1), verifyCommand(0))

  const result = await runOnce(deps)
  expect(result).toBe('done')
  expect(readFileSync(join(root, 'feature.txt'), 'utf8').replace(/\r\n/g, '\n')).toBe('engine\n')
  expect(existsSync(join(deps.cfg.worktreesDir, taskId(TASK)))).toBe(false)
  const events = readFileSync(join(deps.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('"type":"rebase-attempted"')
  expect(events).toContain('"type":"merge-rebased"')
})

test('rebase 後專案 verifyCommand 紅燈 → blocked，main 不前進且 rebased 分支完整保留', async () => {
  const { deps, root } = fixture(verifyCommand(0), verifyCommand(1))

  const result = await runOnce(deps)
  expect(result).toEqual({
    kind: 'blocked', taskId: taskId(TASK), taskText: TASK, reason: 'merge-conflict',
  })
  expect(existsSync(join(root, 'feature.txt'))).toBe(false)
  const worktreePath = join(deps.cfg.worktreesDir, taskId(TASK))
  expect(existsSync(worktreePath)).toBe(true)
  expect(readFileSync(join(worktreePath, 'feature.txt'), 'utf8').replace(/\r\n/g, '\n')).toBe('engine\n')
  expect(git(root, ['branch', '--list', `adng/${taskId(TASK)}`])).toContain(`adng/${taskId(TASK)}`)
  const events = readFileSync(join(deps.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('"stage":"verify"')
})

test('rebase 本身衝突 → blocked，原始 worktree commit 與分支保留', async () => {
  const { deps, root } = fixture(verifyCommand(0), verifyCommand(0), true)

  expect(await runOnce(deps)).toEqual({
    kind: 'blocked', taskId: taskId(TASK), taskText: TASK, reason: 'merge-conflict',
  })
  const worktreePath = join(deps.cfg.worktreesDir, taskId(TASK))
  expect(readFileSync(join(root, 'same.txt'), 'utf8')).toBe('main\n')
  expect(readFileSync(join(worktreePath, 'same.txt'), 'utf8').replace(/\r\n/g, '\n')).toBe('engine\n')
  expect(git(root, ['branch', '--list', `adng/${taskId(TASK)}`])).toContain(`adng/${taskId(TASK)}`)
  const events = readFileSync(join(deps.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('"stage":"rebase"')
})

test('重試合併前主線再次前進 → allowRebase:false 阻止第二次補救', () => {
  const { deps } = fixture(verifyCommand(0), verifyCommand(0))
  const wt = prepareWorktree(deps.cfg.projectPath, deps.cfg.worktreesDir, taskId(TASK), deps.cfg)
  commitFile(wt.cwd, 'feature.txt', 'engine\n', 'feat: 任務完成')
  commitFile(deps.cfg.projectPath, 'third-party.txt', 'main\n', 'chore: 第三方推進')

  const first = mergeBack(deps.cfg.projectPath, wt.branch, wt.baseBranch, wt.baseHead, wt.cwd, {
    ...deps.cfg,
    deferAfterRebase: true,
  })
  expect(first).toMatchObject({ merged: false, rebased: true, rebaseAttempted: true, failureStage: 'verify' })

  commitFile(deps.cfg.projectPath, 'later.txt', 'later\n', 'chore: 後續推進')
  const second = mergeBack(deps.cfg.projectPath, wt.branch, wt.baseBranch, wt.baseHead, wt.cwd, {
    ...deps.cfg,
    allowRebase: false,
    rebaseAttempted: true,
  })
  expect(second).toMatchObject({ merged: false, reason: 'merge-conflict', rebaseAttempted: true, failureStage: 'merge' })
})
