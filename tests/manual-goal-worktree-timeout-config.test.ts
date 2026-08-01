import { afterEach, expect, test, vi } from 'vitest'
import { basename, dirname, join } from 'node:path'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

const childProcessMock = vi.hoisted(() => ({ execFileSync: vi.fn() }))

vi.mock('node:child_process', async importOriginal => ({
  ...await importOriginal<typeof import('node:child_process')>(),
  execFileSync: childProcessMock.execFileSync,
}))

import { applyDedupReopen } from '../src/autopilot/dedup-reopen.js'
import { BacklogStore, parseBacklog, taskId } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { runOnce, type Deps } from '../src/scheduler.js'
import { ConfigSchema } from '../src/types.js'
import { prepareWorktree } from '../src/worktree.js'

const TEMP_PREFIX = '.tmp-manual-goal-worktree-timeout-'
const tempDirs: string[] = []

afterEach(() => {
  childProcessMock.execFileSync.mockReset()
  while (tempDirs.length) {
    const dir = tempDirs.pop()!
    if (dirname(dir) !== process.cwd() || !basename(dir).startsWith(TEMP_PREFIX)) {
      throw new Error(`拒絕清理 repo 外路徑：${dir}`)
    }
    rmSync(dir, { recursive: true, force: true, maxRetries: 3 })
  }
})

function tempDir(): string {
  const dir = mkdtempSync(join(process.cwd(), TEMP_PREFIX))
  tempDirs.push(dir)
  return dir
}

function config(root: string, extra: Record<string, unknown> = {}) {
  return ConfigSchema.parse({
    projectPath: root,
    backlogFile: join(root, 'BACKLOG.md'),
    dataDir: join(root, 'data'),
    stopFile: join(root, '.adng.stop'),
    worktreesDir: join(root, 'worktrees'),
    engine: 'mock',
    ...extra,
  })
}

function fakeGit(timeoutOnAdd = false): void {
  childProcessMock.execFileSync.mockImplementation((_command: string, args: string[], options: { cwd?: string }) => {
    if (args[0] === 'worktree' && args[1] === 'add') {
      if (timeoutOnAdd) throw Object.assign(new Error('spawnSync git ETIMEDOUT'), { code: 'ETIMEDOUT' })
      mkdirSync(args[4]!, { recursive: true })
    }
    if (args[0] === 'symbolic-ref') {
      return options.cwd?.includes(`${join('worktrees', '')}`)
        ? `adng/${basename(options.cwd)}\n`
        : 'main\n'
    }
    if (args[0] === 'rev-parse') return args[1] === '--git-dir' ? '.git\n' : 'base-head\n'
    return ''
  })
}

function timeoutFor(predicate: (args: string[]) => boolean): number | undefined {
  const call = childProcessMock.execFileSync.mock.calls.find(([, args]) => predicate(args as string[]))
  return (call?.[2] as { timeout?: number } | undefined)?.timeout
}

test('worktree timeout config：未設定沿用 10s／30s 預設', () => {
  const root = tempDir()
  const cfg = config(root)
  fakeGit()

  prepareWorktree(cfg.projectPath, cfg.worktreesDir, 'default000', cfg)

  expect(cfg.gitTimeoutMs).toBe(10_000)
  expect(cfg.worktreeAddTimeoutMs).toBe(30_000)
  expect(timeoutFor(args => args[0] === 'rev-parse' && args[1] === '--git-dir')).toBe(10_000)
  expect(timeoutFor(args => args[0] === 'worktree' && args[1] === 'add')).toBe(30_000)
})

test('worktree timeout config：覆寫值實際傳入 execFileSync', () => {
  const root = tempDir()
  const cfg = config(root, { gitTimeoutMs: 45_000, worktreeAddTimeoutMs: 180_000 })
  fakeGit()

  prepareWorktree(cfg.projectPath, cfg.worktreesDir, 'override000', cfg)

  expect(timeoutFor(args => args[0] === 'rev-parse' && args[1] === '--git-dir')).toBe(45_000)
  expect(timeoutFor(args => args[0] === 'worktree' && args[1] === 'add')).toBe(180_000)
  expect(timeoutFor(args => args[0] === 'status' && args[1] === '--porcelain')).toBe(180_000)
})

test('worktree timeout config：ETIMEDOUT 保留實際毫秒與失敗指令', () => {
  const root = tempDir()
  const cfg = config(root, { worktreeAddTimeoutMs: 75_000 })
  fakeGit(true)

  let caught: unknown
  try {
    prepareWorktree(cfg.projectPath, cfg.worktreesDir, 'timeout000', cfg)
  } catch (err) {
    caught = err
  }

  expect(caught).toBeInstanceOf(Error)
  expect((caught as Error).message).toContain('git worktree add')
  expect((caught as Error).message).toContain('75000ms')
  expect((caught as NodeJS.ErrnoException).code).toBe('worktree-timeout')
})

test('worktree timeout config：infra 前綴可被 blocked reason 解析並重開', async () => {
  const root = tempDir()
  const cfg = config(root, { worktreeAddTimeoutMs: 75_000 })
  writeFileSync(cfg.backlogFile, '- [ ] 大型 repo 任務\n')
  fakeGit(true)
  const db = new RunDb(join(root, 'run.db'))
  try {
    const deps: Deps = {
      cfg,
      store: new BacklogStore(cfg.backlogFile),
      db,
      events: new EventLog(cfg.dataDir),
      engines: {
        resolve: () => ({
          id: 'mock',
          preflight: async () => ({ ok: true, detail: 'ok' }),
          run: async () => ({ ok: true, output: '', costUsd: 0 }),
        }),
      },
    }

    await expect(runOnce(deps)).resolves.toMatchObject({
      kind: 'blocked', taskId: taskId('大型 repo 任務'), reason: 'infra:worktree-timeout',
    })
    const blocked = readFileSync(cfg.backlogFile, 'utf8')
    expect(blocked).toContain('adng:blocked reason="infra:worktree-timeout')

    const result = applyDedupReopen(cfg.backlogFile, parseBacklog(blocked)[0]!, { goalId: 'timeout', round: 1 })
    expect(result.decision).toEqual({ kind: 'reopen', reason: 'first-blocked' })
    expect(result.reopened?.text).toContain('adng:blocked reason="infra:worktree-timeout')
  } finally {
    db.close()
  }
})
