import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { BacklogStore } from '../../src/backlog.js'
import { RunDb } from '../../src/db.js'
import { EventLog } from '../../src/events.js'
import { MockEngine } from '../../src/engines/mock.js'
import { sequentialReadyTasks } from '../../src/engines/free-only-split.js'
import { runOnce, type Deps } from '../../src/scheduler.js'
import { ConfigSchema, type Task } from '../../src/types.js'

const ACCEPTANCE = 'npm run typecheck'

function initRepo(dir: string): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# split test\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore' })
}

function fixture(backlog = '- [ ] 母任務：修復免費層失敗\n'): Deps {
  const dir = mkdtempSync(join(tmpdir(), 'adng-free-split-'))
  initRepo(dir)
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, backlog)
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'), worktreesDir: join(dir, 'worktrees'),
    stopFile: join(dir, '.adng.stop'), verifyCommand: ACCEPTANCE, judgeUrl: 'https://judge.test',
    tierMode: 'free-only', defaultEngine: 'agy', engineRotation: ['agy', 'devin'],
    engines: { agy: { adapter: 'mock', costPerRunUsd: 0 }, devin: { adapter: 'mock', costPerRunUsd: 0 } },
  })
  return {
    cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(dir, 'run.db')),
    engines: { resolve: () => new MockEngine([{ ok: false, reason: 'timeout' }, { ok: false, reason: 'timeout' }]) },
    events: new EventLog(cfg.dataDir),
  }
}

function judgeReply(pieces: unknown): void {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ pieces }) } }] }))))
}

afterEach(() => vi.unstubAllGlobals())

test('合法 judge 拆解：母片 superseded、血緣／順序與整合驗收完整保留', async () => {
  const d = fixture()
  judgeReply([
    { task: '先補最小重現', acceptance: 'npx vitest run tests/repro.test.ts' },
    { task: '修正共享邏輯', acceptance: 'npx vitest run tests/fix.test.ts' },
    { task: '整合驗收', acceptance: `npx vitest run tests/integration.test.ts && ${ACCEPTANCE}` },
  ])
  const engine = new MockEngine([{ ok: false, reason: 'timeout' }, { ok: false, reason: 'timeout' }])
  d.engines = { resolve: () => engine }

  expect(await runOnce(d)).toBe('failed')
  expect(await runOnce(d)).toBe('failed')

  const tasks = d.store.read(), parent = tasks[0]!, children = tasks.slice(1)
  expect(parent.status).toBe('blocked')
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('adng:superseded-by-split')
  expect(children.map(task => task.split)).toEqual([
    { parentId: parent.id, part: 1, depth: 1, shape: 'sequential' },
    { parentId: parent.id, part: 2, depth: 1, shape: 'sequential' },
    { parentId: parent.id, part: 3, depth: 1, shape: 'sequential' },
  ])
  expect(children.map(task => task.text)).toEqual(expect.arrayContaining([
    expect.stringContaining('npx vitest run tests/repro.test.ts'),
    expect.stringContaining('npx vitest run tests/fix.test.ts'),
    expect.stringContaining(ACCEPTANCE),
  ]))
})

test('非法 judge 輸出：末片漏母驗收時回退一般 blocked，不寫入半套子片', async () => {
  const d = fixture()
  judgeReply([{ task: '先修', acceptance: 'npx vitest run tests/unit.test.ts' }, { task: '整合', acceptance: 'npx vitest run tests/integration.test.ts' }])
  const engine = new MockEngine([{ ok: false, reason: 'timeout' }, { ok: false, reason: 'timeout' }])
  d.engines = { resolve: () => engine }

  expect(await runOnce(d)).toBe('failed')
  await expect(runOnce(d)).resolves.toMatchObject({ kind: 'blocked', reason: 'max-attempts' })
  expect(d.store.read()).toHaveLength(1)
  const backlog = readFileSync(d.cfg.backlogFile, 'utf8')
  expect(backlog).toContain('adng:blocked')
  expect(backlog).not.toContain('superseded-by-split')
})

test('拆解深度達二：再次達兩敗門檻時直接 blocked，judge 不得呼叫', async () => {
  const d = fixture('- [ ] 深度二子片 <!-- adng:split {"parentId":"deadbeef","part":1,"depth":2,"shape":"sequential"} -->\n')
  const fetchSpy = vi.fn(async () => new Response('unexpected'))
  vi.stubGlobal('fetch', fetchSpy)
  const engine = new MockEngine([{ ok: false, reason: 'timeout' }, { ok: false, reason: 'timeout' }])
  d.engines = { resolve: () => engine }

  expect(await runOnce(d)).toBe('failed')
  await expect(runOnce(d)).resolves.toMatchObject({ kind: 'blocked', reason: 'max-attempts' })
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('adng:blocked')
  expect(d.store.read()[0]!.split?.depth).toBe(2)
  expect(fetchSpy).not.toHaveBeenCalled()
})

test('sequential 片只放行最早未完成片，不會與後片併發候選', () => {
  const base = { id: 'abcdef12', text: '母', line: 0, status: 'open' as const }
  const first: Task = { ...base, id: 'part0001', split: { parentId: base.id, part: 1, depth: 1, shape: 'sequential' } }
  const second: Task = { ...base, id: 'part0002', split: { parentId: base.id, part: 2, depth: 1, shape: 'sequential' } }
  expect(sequentialReadyTasks([first, second]).map(task => task.id)).toEqual([first.id])
  expect(sequentialReadyTasks([{ ...first, status: 'done' }, second]).map(task => task.id)).toEqual([second.id])
  expect(sequentialReadyTasks([{ ...first, status: 'blocked' }, second])).toEqual([])
})
