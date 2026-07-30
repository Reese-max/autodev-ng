import { expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runDaemon, type DaemonOpts, type Notifier } from '../src/daemon.js'
import type { CycleResult, Deps, LessonsPort } from '../src/scheduler.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { ConfigSchema } from '../src/types.js'
import { LessonStore } from '../src/learn/store.js'
import { makeLessonsPort } from '../src/learn/reflect.js'
import type { LlmOpts } from '../src/autopilot/llm.js'
import { assemble } from '../src/cli.js'

// Task 4：daemon 失敗觸發 reflect + 端到端整合測試。
// 沿用 tests/daemon.test.ts 的 baseOpts()/FakeNotifier/fakeSleep/deps() 模式（同檔案不匯出，複製一份）。

/** 記錄呼叫、立即 resolve 的假 sleep——測試不用真的等待。 */
function fakeSleep(calls: number[]): (ms: number) => Promise<void> {
  return async (ms: number) => {
    calls.push(ms)
  }
}

/** 收集所有 send 過的文字；responder 可自訂回傳（模擬送達/送失敗）。 */
class FakeNotifier implements Notifier {
  readonly sent: string[] = []
  constructor(private readonly responder: (text: string) => boolean = () => true) {}
  async send(text: string): Promise<boolean> {
    this.sent.push(text)
    return this.responder(text)
  }
}

/** M4 Task 6：scheduler 對每個任務執行 prepareWorktree/mergeBack，projectPath 必須是真 git repo。 */
function initGitRepo(dir: string): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# adng test repo\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore' })
}

function deps(engine: MockEngine, backlogMd = '- [ ] 任務一\n', cfgOverrides: Record<string, unknown> = {}): Deps {
  const dir = mkdtempSync(join(tmpdir(), 'adng-learn-integ-'))
  initGitRepo(dir)
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, backlogMd)
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engine: 'mock', stopFile: join(dir, '.adng.stop'),
    worktreesDir: join(dir, 'worktrees'),
    timezoneOffsetHours: 0,
    ...cfgOverrides,
  })
  return { cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(dir, 'run.db')), engines: { resolve: () => engine }, events: new EventLog(cfg.dataDir) }
}

function baseOpts(d: Deps, notifier: Notifier, sleepCalls: number[], overrides: Partial<DaemonOpts> = {}): DaemonOpts {
  return {
    deps: d,
    notifier,
    lockDir: join(d.cfg.dataDir, '..', 'lock'),
    cooldownMs: 1000,
    idleSleepMs: 5000,
    sleepFn: fakeSleep(sleepCalls),
    maxCycles: 10,
    memFreeRatioFn: () => 1,
    ...overrides,
  }
}

/** 沿用 tests/learn-reflect.test.ts 的 fakeLlm helper：OpenAI-相容回應格式，固定回覆內容。 */
function fakeLlm(reply: string): LlmOpts {
  const fetchFn = (async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: reply } }] })
  })) as unknown as typeof fetch
  return { url: 'http://fake', model: 'm', apiKey: 'k', fetchFn }
}

test('① daemon 觸發：cycle 結果為 failed → deps.lessons.reflect 收到該結果', async () => {
  const engine = new MockEngine([{ ok: false, reason: 'x' }]) // maxAttempts 預設 2，1 次失敗 → 'failed'（未達 blocked）
  const d = deps(engine)
  const reflectCalls: CycleResult[] = []
  const lessons: LessonsPort = { inject: () => '', reflect: async (r) => { reflectCalls.push(r) } }
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts({ ...d, lessons }, notifier, sleepCalls, { maxCycles: 1 }))

  expect(result).toBe('max-cycles')
  expect(reflectCalls).toEqual(['failed'])
})

test('② lessons.reflect 拋錯不可反殺主迴圈（fail-open，鐵律 #4）', async () => {
  const engine = new MockEngine([{ ok: false, reason: 'x' }, { ok: false, reason: 'x' }])
  const d = deps(engine)
  const lessons: LessonsPort = { inject: () => '', reflect: async () => { throw new Error('boom') } }
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts({ ...d, lessons }, notifier, sleepCalls, { maxCycles: 2 }))

  expect(result).toBe('max-cycles') // 沒被 reflect 的 throw 反殺，daemon 正常跑完
})

test('③ 端到端閉環（本里程碑核心驗收）：cycle1 失敗長出教訓 L001 → cycle2 job.directive 含該教訓', async () => {
  const backlog = '- [ ] 任務一\n- [ ] 任務二\n'
  const engine = new MockEngine([
    { ok: false, reason: 'boom' }, // 任務一：maxAttempts=1，唯一一次嘗試即達上限 → blocked，釋出代表名額
    { ok: false, reason: 'boom' }, // 任務二：cycle2 派工——檢查 job.directive 是否含注入的教訓
  ])
  // maxAttempts=1：任務一失敗一次即轉 blocked（非 'failed'），backlog 代表名額才會在 cycle2 釋給任務二
  // （否則預設 maxAttempts=2 時任務一仍是 open，cycle2 會重派同一個任務一，任務二永遠撿不到）。
  const d = deps(engine, backlog, { maxAttempts: 1 })

  const lessonsFile = join(d.cfg.dataDir, 'learnings.md')
  const lessonStore = new LessonStore(lessonsFile)
  const lessons = makeLessonsPort({
    lessons: lessonStore, db: d.db, backlog: d.store,
    llm: fakeLlm('教訓X:先跑 baseline'), events: d.events
  })

  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts({ ...d, lessons }, notifier, sleepCalls, { maxCycles: 2 }))

  expect(result).toBe('max-cycles')

  // cycle1 結束後 learnings.md 應該已經長出 L001 教訓X
  const learnings = readFileSync(lessonsFile, 'utf8')
  expect(learnings).toContain('L001')
  expect(learnings).toContain('教訓X')

  // cycle2 的 engine.run 呼叫（第 2 筆）應該是任務二，且 directive 含教訓文字
  expect(engine.calls).toHaveLength(2)
  expect(engine.calls[1]!.task.text).toBe('任務二')
  expect(engine.calls[1]!.directive).toContain('教訓X')
})

// 上一審查 ⚠️ 收尾（計入本 task 範圍）：assemble() 接線斷言——確認 cli.ts 組裝出的
// deps.lessons 確實有掛（非 undefined），且空教訓庫時 inject() 回空字串。
// 寫法參考 tests/cli.test.ts 既有 assemble 測試（writeConfig + assemble + finally 關 db）。
test('④ assemble 接線：cfg 組裝出的 deps.lessons 已定義，空教訓庫 inject() 回空字串', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-assemble-lessons-'))
  const cfgPath = join(dir, 'config.json')
  writeFileSync(cfgPath, JSON.stringify({
    projectPath: './project', backlogFile: './project/BACKLOG.md', dataDir: './data',
    engine: 'mock',
  }))

  const { deps } = assemble(cfgPath)
  try {
    expect(deps.lessons).toBeDefined()
    expect(deps.lessons!.inject()).toBe('')
  } finally {
    deps.db.close()
  }
})
