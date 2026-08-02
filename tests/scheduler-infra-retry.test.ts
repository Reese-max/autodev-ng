import { execFileSync } from 'node:child_process'
import { afterEach, expect, test, vi } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const worktreeMock = vi.hoisted(() => ({
  cleanupWorktree: vi.fn(), mergeBack: vi.fn(), prepareWorktree: vi.fn(),
}))
const infraRetryMock = vi.hoisted(() => ({ cleanupRetryWorktree: vi.fn() }))

vi.mock('../src/worktree.js', async importOriginal => ({
  ...await importOriginal<typeof import('../src/worktree.js')>(),
  cleanupWorktree: worktreeMock.cleanupWorktree,
  mergeBack: worktreeMock.mergeBack,
  prepareWorktree: worktreeMock.prepareWorktree,
}))
vi.mock('../src/engines/infra-retry.js', async importOriginal => ({
  ...await importOriginal<typeof import('../src/engines/infra-retry.js')>(),
  cleanupRetryWorktree: infraRetryMock.cleanupRetryWorktree,
}))

import { BacklogStore, taskId } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { MockEngine } from '../src/engines/mock.js'
import { EventLog } from '../src/events.js'
import { runOnce, type Deps } from '../src/scheduler.js'
import { ConfigSchema } from '../src/types.js'

const roots: string[] = []
const dbs: RunDb[] = []

afterEach(() => {
  infraRetryMock.cleanupRetryWorktree.mockReset()
  worktreeMock.cleanupWorktree.mockReset()
  worktreeMock.mergeBack.mockReset()
  worktreeMock.prepareWorktree.mockReset()
  while (dbs.length) dbs.pop()!.close()
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true })
})

function testDeps(engine: MockEngine, maxAttempts = 2): Deps {
  const root = mkdtempSync(join(process.cwd(), '.tmp-scheduler-infra-retry-'))
  roots.push(root)
  execFileSync('git', ['init', '-b', 'main'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: root, stdio: 'ignore' })
  writeFileSync(join(root, 'README.md'), '# test\n')
  execFileSync('git', ['add', '.'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: root, stdio: 'ignore' })
  const backlogFile = join(root, 'BACKLOG.md')
  writeFileSync(backlogFile, '- [ ] 任務一\n')
  const cfg = ConfigSchema.parse({
    projectPath: root, backlogFile, dataDir: join(root, 'data'), engine: 'mock',
    maxAttempts, stopFile: join(root, '.adng.stop'), worktreesDir: join(root, 'worktrees'),
  })
  const db = new RunDb(join(root, 'run.db'))
  dbs.push(db)
  return { cfg, store: new BacklogStore(backlogFile), db, engines: { resolve: () => engine }, events: new EventLog(cfg.dataDir) }
}

function handle(cwd: string) {
  return { cwd, branch: 'adng/retry-task', baseBranch: 'main', baseHead: 'base-before-retry' }
}

function infraError(code: string): Error {
  return Object.assign(new Error(`infrastructure ${code}`), { code })
}

test('(a) worktree 基建錯誤第一次只重試，不立即 blocked', async () => {
  const engine = new MockEngine([{ ok: true }])
  const d = testDeps(engine)
  worktreeMock.prepareWorktree.mockImplementationOnce(() => { throw infraError('worktree-timeout') })
    .mockReturnValue(handle(d.cfg.projectPath))
  worktreeMock.mergeBack.mockReturnValue({ merged: true, commitHash: 'retry-merged' })

  expect(await runOnce(d)).toBe('done')
  expect(worktreeMock.prepareWorktree).toHaveBeenCalledTimes(2)
  expect(infraRetryMock.cleanupRetryWorktree).toHaveBeenCalledWith(d.cfg.projectPath, d.cfg.worktreesDir, taskId('任務一'), d.cfg)
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).not.toContain('adng:blocked')
})

test('(b) 外部終止後重試成功，正常派工且 failCount 不增加', async () => {
  const engine = new MockEngine([{ ok: false, reason: 'exit 1073807364: terminated' }, { ok: true }])
  const d = testDeps(engine)
  worktreeMock.prepareWorktree.mockReturnValue(handle(d.cfg.projectPath))
  worktreeMock.mergeBack.mockReturnValue({ merged: true, commitHash: 'retry-merged' })

  expect(await runOnce(d)).toBe('done')
  expect(engine.calls).toHaveLength(2)
  expect(d.db.failCount(taskId('任務一'))).toBe(0)
  expect(infraRetryMock.cleanupRetryWorktree).toHaveBeenCalledTimes(1)
})

test('(c) 基建重試仍失敗才 blocked，reason 標記 retried=1', async () => {
  const engine = new MockEngine([{ ok: true }])
  const d = testDeps(engine)
  worktreeMock.prepareWorktree.mockImplementation(() => { throw infraError('worktree-timeout') })

  await expect(runOnce(d)).resolves.toEqual({
    kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一', reason: 'infra:worktree-timeout',
  })
  expect(worktreeMock.prepareWorktree).toHaveBeenCalledTimes(2)
  expect(d.db.failCount(taskId('任務一'))).toBe(0)
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('retried=1')
})

test('merge-conflict 首次失敗會清理後重派同一任務', async () => {
  const engine = new MockEngine([{ ok: true }, { ok: true }])
  const d = testDeps(engine)
  worktreeMock.prepareWorktree.mockReturnValue(handle(d.cfg.projectPath))
  worktreeMock.mergeBack.mockReturnValueOnce({ merged: false, reason: 'merge-conflict' }).mockReturnValueOnce({ merged: true, commitHash: 'retry-merged' })

  expect(await runOnce(d)).toBe('done')
  expect(engine.calls).toHaveLength(2)
  expect(infraRetryMock.cleanupRetryWorktree).toHaveBeenCalledTimes(1)
  expect(d.db.failCount(taskId('任務一'))).toBe(0)
})

test('dirty-worktree 直接 blocked，不重試，並保留告警所需的精確檔案資訊', async () => {
  const engine = new MockEngine([{ ok: true }])
  const d = testDeps(engine)
  worktreeMock.prepareWorktree.mockReturnValue(handle(d.cfg.projectPath))
  worktreeMock.mergeBack.mockReturnValue({
    merged: false, reason: 'dirty-worktree', dirtyFileCount: 2, dirtyFiles: ['README.md', 'src/worktree.ts'],
  })

  await expect(runOnce(d)).resolves.toEqual({
    kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一', reason: 'dirty-worktree',
    alertDetail: '主工作目錄有 2 個未提交變更檔阻擋合併，需先提交或移至分支保存；檔案：README.md、src/worktree.ts',
  })
  expect(engine.calls).toHaveLength(1)
  expect(infraRetryMock.cleanupRetryWorktree).not.toHaveBeenCalled()
})

test.each(['verify-fail: 測試紅', 'review-reject: 審查拒絕'])('(d) 引擎能力失敗 %s 仍計入 maxAttempts', async reason => {
  const engine = new MockEngine([{ ok: true }])
  const d = testDeps(engine, 1)
  worktreeMock.prepareWorktree.mockReturnValue(handle(d.cfg.projectPath))

  await expect(runOnce({ ...d, verifier: { check: async () => ({ pass: false, reason, alerts: [] }) } })).resolves.toEqual({
    kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一', reason: 'max-attempts',
  })
  expect(d.db.failCount(taskId('任務一'))).toBe(1)
  expect(infraRetryMock.cleanupRetryWorktree).not.toHaveBeenCalled()
})
