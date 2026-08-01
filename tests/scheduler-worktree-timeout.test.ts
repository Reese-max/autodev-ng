import { afterEach, expect, test, vi } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const worktreeMock = vi.hoisted(() => ({ prepareWorktree: vi.fn() }))

vi.mock('../src/worktree.js', async importOriginal => ({
  ...await importOriginal<typeof import('../src/worktree.js')>(),
  prepareWorktree: worktreeMock.prepareWorktree,
}))

import { BacklogStore, taskId } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { runOnce, type Deps } from '../src/scheduler.js'
import { ConfigSchema } from '../src/types.js'

const tempDirs: string[] = []
const dbs: RunDb[] = []

afterEach(() => {
  worktreeMock.prepareWorktree.mockReset()
  while (dbs.length) dbs.pop()!.close()
  while (tempDirs.length) rmSync(tempDirs.pop()!, { recursive: true, force: true })
})

function testDeps(): { deps: Deps; backlogFile: string } {
  const root = mkdtempSync(join(process.cwd(), '.tmp-scheduler-worktree-timeout-'))
  tempDirs.push(root)
  const backlogFile = join(root, 'BACKLOG.md')
  const dataDir = join(root, 'data')
  writeFileSync(backlogFile, '- [ ] 大型 repo 任務\n')
  const cfg = ConfigSchema.parse({
    projectPath: root,
    backlogFile,
    dataDir,
    stopFile: join(root, '.adng.stop'),
    worktreesDir: join(root, 'worktrees'),
    engine: 'mock',
    worktreeAddTimeoutMs: 75_000,
  })
  const db = new RunDb(join(root, 'run.db'))
  dbs.push(db)
  return {
    backlogFile,
    deps: {
      cfg,
      store: new BacklogStore(backlogFile),
      db,
      engines: { resolve: () => new MockEngine([{ ok: true }]) },
      events: new EventLog(dataDir),
    },
  }
}

function timeoutError(code: string): Error {
  return Object.assign(new Error(`spawnSync git ${code}`), { code })
}

test.each(['ETIMEDOUT', 'ETIME', 'worktree-timeout'])('worktree 逾時 errno %s → infra:worktree-timeout 並帶 config detail', async code => {
  const { deps, backlogFile } = testDeps()
  worktreeMock.prepareWorktree.mockImplementation(() => { throw timeoutError(code) })

  await expect(runOnce(deps)).resolves.toEqual({
    kind: 'blocked', taskId: taskId('大型 repo 任務'), taskText: '大型 repo 任務', reason: 'infra:worktree-timeout',
  })
  const blocked = readFileSync(backlogFile, 'utf8')
  expect(blocked).toContain('逾時 75000ms')
  expect(blocked).toContain('worktreeAddTimeoutMs')
})

test('非逾時 worktree prepare error 仍歸 not-a-git-repo', async () => {
  const { deps } = testDeps()
  worktreeMock.prepareWorktree.mockImplementation(() => { throw new Error('不是 git 專案') })

  await expect(runOnce(deps)).resolves.toMatchObject({
    kind: 'blocked', reason: 'not-a-git-repo',
  })
})
