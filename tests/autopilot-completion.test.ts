import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { ConfigSchema, type Engine } from '../src/types.js'
import { pendingReviewFile } from '../src/engines/pending-review.js'
import type { Deps } from '../src/scheduler.js'
import { runGoalSession } from '../src/autopilot/orchestrator.js'
import { verifyAndSupplement } from '../src/autopilot/supplement.js'
import { discoverProblems } from '../src/autopilot/discover.js'
import { runGoalWithDeps } from '../src/autopilot/session.js'

vi.mock('../src/autopilot/git-workspace.js', () => ({ inspectGitWorkspace: () => ({ ok: true }) }))
vi.mock('../src/autopilot/orchestrator.js', () => ({ runGoalSession: vi.fn() }))
vi.mock('../src/autopilot/supplement.js', () => ({ verifyAndSupplement: vi.fn() }))
vi.mock('../src/autopilot/discover.js', () => ({ discoverProblems: vi.fn() }))
vi.mock('../src/scheduler.js', () => ({ runOnce: vi.fn(async () => 'failed'), finalizeRunOnceHeartbeat: vi.fn() }))
const dirs: string[] = []
const databases: RunDb[] = []
afterEach(() => {
  vi.resetAllMocks()
  for (const db of databases.splice(0)) db.close()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

// 型別契約守門：`store` 是 `Deps` 的必填依賴——缺它的 partial 物件不得被當成 `Deps`。
// #15 的 fixture 用 `as unknown as Deps` 繞過了這個編譯期檢查，runtime 才在
// deps.store.read() 崩掉。`as unknown as` 之外的省略（少寫一個 key）一律由
// `npm run typecheck`（含 tests/）擋下，所以 fixture 必須用真實實作、不得再靠 cast。
type PartialWithoutStoreIsNotDeps = Omit<Deps, 'store'> extends Deps ? false : true
// @ts-expect-error 缺 store 的 partial 物件不是 Deps（`store` 一旦變選填，這行就會編譯失敗）
const storeIsRequired: PartialWithoutStoreIsNotDeps = false

function setup(verify = true) {
  const dir = mkdtempSync(join(tmpdir(), 'adng-completion-')); dirs.push(dir)
  const dataDir = join(dir, 'data'); mkdirSync(dataDir)
  const goalFile = join(dir, 'GOAL.md'); writeFileSync(goalFile, '# GOAL\nbounded goal\n' + (verify ? '\n## 驗收\n```sh\nnode -e "process.exit(0)"\n```\n' : ''))
  const cfg = ConfigSchema.parse({ projectPath: dir, dataDir, backlogFile: join(dataDir, 'BACKLOG.md'), goalFile, stopFile: join(dir, 'stop'),
    defaultEngine: 'astra', engines: { astra: { adapter: 'codex', model: 'gpt-6-astra', costPerRunUsd: 0 } },
    llmTransport: 'cli', judgeModel: 'gpt-6-astra', auditModel: 'gpt-5.6-sol' })
  // 真實 store/db/events（不 force-cast partial 物件）：runGoalWithDeps 會在決定是否跑
  // discovery 前讀 deps.store.read()，stub/cast 讓「未驗證≠achieved」的完成安全斷言
  // 在 fixture 就先崩掉，測不到真正的分支。
  writeFileSync(cfg.backlogFile, '')
  const db = new RunDb(':memory:'); databases.push(db)
  const engine: Engine = { id: 'astra', preflight: async () => ({ ok: true, detail: 'completion fixture' }),
    run: async () => ({ ok: false, output: '', costUsd: 0 }) }
  const reflect = vi.fn(async () => {})
  const deps: Deps = {
    cfg,
    store: new BacklogStore(cfg.backlogFile),
    db,
    engines: { resolve: () => engine },
    lessons: { inject: () => '', reflect },
    events: new EventLog(dataDir),
  }
  return { cfg, deps, reflect, notifier: { send: vi.fn(async () => true) } }
}

test('無機械驗收與同模型自審均在派工前拒絕', async () => {
  const a = setup(false)
  expect(await runGoalWithDeps(a.deps, a.notifier, a.cfg)).toMatchObject({ outcome: { kind: 'stuck', rounds: 0 } })
  const b = setup(); b.cfg.auditModel = b.cfg.judgeModel
  expect(await runGoalWithDeps(b.deps, b.notifier, b.cfg)).toMatchObject({ outcome: { kind: 'stuck', rounds: 0 } })
  expect(runGoalSession).not.toHaveBeenCalled()
})

test.each(['reject', 'exception'])('補充審查 %s 不得保留 achieved，最終稽核與回傳一致', async mode => {
  const a = setup()
  vi.mocked(runGoalSession).mockResolvedValue({ kind: 'achieved', rounds: 1 })
  if (mode === 'exception') vi.mocked(verifyAndSupplement).mockRejectedValue(new Error('audit unavailable'))
  else vi.mocked(verifyAndSupplement).mockResolvedValue({ clean: false, rounds: 1, supplemented: 0, residualGaps: ['missing check'] })
  expect(await runGoalWithDeps(a.deps, a.notifier, a.cfg)).toMatchObject({ outcome: { kind: 'stuck' } })
  const log = readdirSync(a.cfg.dataDir).find(name => /^goal-.*jsonl$/.test(name))!
  const outcomes = readFileSync(join(a.cfg.dataDir, log), 'utf8').trim().split('\n').map(line => JSON.parse(line)).filter(row => row.outcome)
  expect(outcomes.map(row => row.outcome.kind)).toEqual(['stuck'])
})

test('自主派工與補足派工都觸發既有反思，反思故障不改寫結果', async () => {
  const a = setup(); a.reflect.mockRejectedValue(new Error('learning unavailable'))
  vi.mocked(runGoalSession).mockImplementation(async input => { await input.runOnceFn(a.deps); return { kind: 'achieved', rounds: 1 } })
  vi.mocked(verifyAndSupplement).mockImplementation(async input => { await input.runOnceFn(); return { clean: true, rounds: 1, supplemented: 1, residualGaps: [] } })
  expect(await runGoalWithDeps(a.deps, a.notifier, a.cfg)).toMatchObject({ outcome: { kind: 'achieved' } })
  expect(a.reflect).toHaveBeenCalledTimes(2)
})

test('完成安全 fixture 的 Deps 必須由真實實作組成，不得退回 stub', () => {
  const a = setup()
  expect(a.deps.store).toBeInstanceOf(BacklogStore)
  expect(a.deps.db).toBeInstanceOf(RunDb)
  expect(a.deps.events).toBeInstanceOf(EventLog)
  expect(a.deps.store.read()).toEqual([])
})

test('有待審任務時跳過 discovery，GOAL session 仍照常執行', async () => {
  const a = setup()
  a.cfg.surveyCommand = 'survey fixture'
  writeFileSync(a.cfg.backlogFile, '- [ ] 等審查的任務\n')
  const task = a.deps.store.read()[0]!
  mkdirSync(join(a.cfg.dataDir, 'pending-review'))
  writeFileSync(pendingReviewFile(a.cfg, task), JSON.stringify({ phase: 'review' }))
  vi.mocked(runGoalSession).mockResolvedValue({ kind: 'no-progress', rounds: 1 })

  const result = await runGoalWithDeps(a.deps, a.notifier, a.cfg)

  expect(discoverProblems).not.toHaveBeenCalled()
  expect(runGoalSession).toHaveBeenCalledTimes(1)
  expect(result).toMatchObject({ outcome: { kind: 'no-progress', rounds: 1 } })
})

test('沒有待審任務時 discovery 照跑——證明上一則的跳過不是空轉', async () => {
  const a = setup()
  a.cfg.surveyCommand = 'survey fixture'
  vi.mocked(discoverProblems).mockResolvedValue({ survey: '', ranked: [] })
  vi.mocked(runGoalSession).mockResolvedValue({ kind: 'no-progress', rounds: 1 })

  await runGoalWithDeps(a.deps, a.notifier, a.cfg)

  expect(discoverProblems).toHaveBeenCalledTimes(1)
  expect(runGoalSession).toHaveBeenCalledTimes(1)
})
