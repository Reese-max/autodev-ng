import { afterEach, expect, test, vi } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
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

const roots: string[] = []
const dbs: RunDb[] = []

afterEach(() => {
  worktreeMock.prepareWorktree.mockReset()
  while (dbs.length) dbs.pop()!.close()
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true })
})

function testDeps(engine: MockEngine): Deps {
  const root = mkdtempSync(join(tmpdir(), 'adng-worktree-dispatch-'))
  roots.push(root)
  const backlogFile = join(root, 'BACKLOG.md')
  const dataDir = join(root, 'data')
  writeFileSync(backlogFile, '- [ ] 穿透防護任務\n')
  const cfg = ConfigSchema.parse({
    projectPath: root, backlogFile, dataDir, stopFile: join(root, '.adng.stop'),
    worktreesDir: join(root, 'worktrees'), engine: 'mock',
  })
  const db = new RunDb(join(root, 'run.db'))
  dbs.push(db)
  return { cfg, store: new BacklogStore(backlogFile), db, engines: { resolve: () => engine }, events: new EventLog(dataDir) }
}

test('worktree-invalid：記事件並拒絕派工，不重試或呼叫引擎', async () => {
  const engine = new MockEngine([{ ok: true }])
  const deps = testDeps(engine)
  worktreeMock.prepareWorktree.mockImplementation(() => {
    throw Object.assign(new Error('Git 根目錄不等於目標 worktree'), { code: 'worktree-invalid' })
  })

  await expect(runOnce(deps)).resolves.toEqual({
    kind: 'blocked', taskId: taskId('穿透防護任務'), taskText: '穿透防護任務', reason: 'worktree-invalid',
  })
  expect(worktreeMock.prepareWorktree).toHaveBeenCalledTimes(1)
  expect(engine.calls).toHaveLength(0)
  expect(readFileSync(join(deps.cfg.dataDir, 'events.jsonl'), 'utf8')).toContain('"type":"worktree-invalid"')
})
