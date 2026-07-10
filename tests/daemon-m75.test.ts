import { expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runDaemon, type DaemonOpts, type Notifier } from '../src/daemon.js'
import type { Deps } from '../src/scheduler.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { ConfigSchema } from '../src/types.js'

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

function deps(engine: MockEngine, backlogMd = '- [ ] 任務一\n'): Deps {
  const dir = mkdtempSync(join(tmpdir(), 'adng-daemon-m75-'))
  initGitRepo(dir)
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, backlogMd)
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engine: 'mock', stopFile: join(dir, '.adng.stop'),
    worktreesDir: join(dir, 'worktrees'),
    timezoneOffsetHours: 0
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
    ...overrides,
  }
}

test('M7.5 ① OOM 閘：memFreeRatioFn: () => 0.10（10% 可用）+ maxCycles=2 → engine 從未被呼叫、notifier 收到 oom-gate 告警（6h 冷卻:兩輪只發一次）、sleep 收到 idleSleepMs', async () => {
  const engine = new MockEngine([{ ok: true }])
  const d = deps(engine)
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, {
    memFreeRatioFn: () => 0.10,
    maxCycles: 2
  }))

  expect(result).toBe('max-cycles')
  // engine 從未被呼叫（被 OOM 閘攔截了）
  expect(engine.calls).toHaveLength(0)
  // 兩輪皆觸發 OOM，但冷卻閘只送第一則
  // 'oom-gate' 只是冷卻 key,不在告警文案裡,原斷言條件半邊死;只留實際文案字串
  const oomAlerts = notifier.sent.filter(t => t.includes('記憶體可用'))
  expect(oomAlerts).toHaveLength(1)
  // 兩輪都 sleep idleSleepMs（5000）
  expect(sleepCalls).toEqual([5000, 5000])
})

test('M7.5 ② 正常記憶體：memFreeRatioFn: () => 0.50（50% 可用）→ 正常派工（engine 有被呼叫）', async () => {
  const engine = new MockEngine([{ ok: true }])
  const d = deps(engine)
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, {
    memFreeRatioFn: () => 0.50,
    maxCycles: 1
  }))

  expect(result).toBe('max-cycles')
  // engine 被呼叫（未被 OOM 閘攔截）
  expect(engine.calls).toHaveLength(1)
  // 無 oom-gate 告警（只驗實際文案字串,'oom-gate' 只是冷卻 key 不會出現在文案）
  const oomAlerts = notifier.sent.filter(t => t.includes('記憶體可用'))
  expect(oomAlerts).toHaveLength(0)
  // 派工成功後 sleep cooldownMs（1000）
  expect(sleepCalls).toEqual([1000])
})

test('M7.5 ③ idle 要任務通知：backlog 空 → result idle → notifier 收到「backlog 已耗盡」;連兩輪 idle 只發一次（冷卻）', async () => {
  const engine = new MockEngine([]) // 空 backlog，派工直接 idle
  const d = deps(engine, '# 空 backlog\n')
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, {
    maxCycles: 2
  }))

  expect(result).toBe('max-cycles')
  // 兩輪皆 idle，但冷卻閘只發一次
  const idleAlerts = notifier.sent.filter(t => t.includes('idle') || t.includes('backlog 已耗盡'))
  expect(idleAlerts).toHaveLength(1)
  expect(idleAlerts[0]).toContain('backlog 已耗盡')
  // 兩輪都 sleep idleSleepMs（5000）
  expect(sleepCalls).toEqual([5000, 5000])
})

test('M7.5 ④ stopFile 優先於 OOM 跳輪：memFreeRatioFn 回 0.10（低記憶體）且 stopFile 已存在 → runDaemon 回 stopped（非 max-cycles）、engine 從未被呼叫', async () => {
  const engine = new MockEngine([{ ok: true }])
  const d = deps(engine)
  writeFileSync(d.cfg.stopFile, '')
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, {
    memFreeRatioFn: () => 0.10,
    maxCycles: 10
  }))

  expect(result).toBe('stopped')
  expect(engine.calls).toHaveLength(0)
})

test('M7.5 ⑤ memFreeRatioFn fail-open：memFreeRatioFn throw → 不炸主迴圈，視同記憶體充足正常派工（engine 有被呼叫）', async () => {
  const engine = new MockEngine([{ ok: true }])
  const d = deps(engine)
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, {
    memFreeRatioFn: () => { throw new Error('boom') },
    maxCycles: 1
  }))

  expect(result).toBe('max-cycles')
  expect(engine.calls).toHaveLength(1)
})
