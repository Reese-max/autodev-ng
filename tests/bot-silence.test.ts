import { describe, test, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setSilence, clearSilence, isSilenced } from '../src/bot/silence.js'
import { runDaemon, type DaemonOpts, type Notifier } from '../src/daemon.js'
import type { Deps } from '../src/scheduler.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { ConfigSchema } from '../src/types.js'

function dir(): string { return mkdtempSync(join(tmpdir(), 'adng-silence-')) }

describe('setSilence/isSilenced/clearSilence', () => {
  test('setSilence 後 isSilenced true；過期(now 注入超過 untilIso) → false', () => {
    const d = dir()
    const now = new Date('2026-07-10T00:00:00.000Z')
    const untilIso = setSilence(d, 60, now)
    expect(untilIso).toBe('2026-07-10T01:00:00.000Z')
    expect(isSilenced(d, now)).toBe(true)
    // 窗內(59 分後)仍靜音
    expect(isSilenced(d, new Date('2026-07-10T00:59:00.000Z'))).toBe(true)
    // 過期(61 分後)
    expect(isSilenced(d, new Date('2026-07-10T01:01:00.000Z'))).toBe(false)
  })

  test('clearSilence 後 isSilenced false；缺檔不炸', () => {
    const d = dir()
    setSilence(d, 60)
    expect(isSilenced(d)).toBe(true)
    clearSilence(d)
    expect(isSilenced(d)).toBe(false)
    // 再次 clearSilence（已無檔）不可炸
    expect(() => clearSilence(d)).not.toThrow()
  })

  test('silence.json 缺檔 → false（未曾 setSilence 過的全新 dataDir）', () => {
    const d = dir()
    expect(isSilenced(d)).toBe(false)
  })

  test('silence.json 寫壞字串 → false 不炸（fail-open）', () => {
    const d = dir()
    writeFileSync(join(d, 'silence.json'), '{not json')
    expect(isSilenced(d)).toBe(false)
  })

  test('silence.json 內容合法 JSON 但 untilIso 非字串/非法日期 → false 不炸', () => {
    const d = dir()
    writeFileSync(join(d, 'silence.json'), JSON.stringify({ untilIso: 12345 }))
    expect(isSilenced(d)).toBe(false)
    writeFileSync(join(d, 'silence.json'), JSON.stringify({ untilIso: 'not-a-date' }))
    expect(isSilenced(d)).toBe(false)
  })
})

/** 記錄呼叫、立即 resolve 的假 sleep——測試不用真的等待。 */
function fakeSleep(calls: number[]): (ms: number) => Promise<void> {
  return async (ms: number) => {
    calls.push(ms)
  }
}

/** 收集所有 send 過的文字。 */
class FakeNotifier implements Notifier {
  readonly sent: string[] = []
  async send(text: string): Promise<boolean> {
    this.sent.push(text)
    return true
  }
}

/** M4 Task 6：scheduler 對每個任務執行 prepareWorktree/mergeBack，projectPath 必須是真 git repo。 */
function initGitRepo(d: string): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: d, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: d, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: d, stdio: 'ignore' })
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: d, stdio: 'ignore' })
  writeFileSync(join(d, 'README.md'), '# adng test repo\n')
  execFileSync('git', ['add', '.'], { cwd: d, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: d, stdio: 'ignore' })
}

function deps(engine: MockEngine, backlogMd = '# 空 backlog\n'): Deps {
  const d = mkdtempSync(join(tmpdir(), 'adng-daemon-silence-'))
  initGitRepo(d)
  const backlogFile = join(d, 'BACKLOG.md')
  writeFileSync(backlogFile, backlogMd)
  const cfg = ConfigSchema.parse({
    projectPath: d, backlogFile, dataDir: join(d, 'data'),
    engine: 'mock', stopFile: join(d, '.adng.stop'),
    worktreesDir: join(d, 'worktrees'),
    timezoneOffsetHours: 0
  })
  return { cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(d, 'run.db')), engines: { resolve: () => engine }, events: new EventLog(cfg.dataDir) }
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

describe('daemon 整合：silence 窗內告警靜默，digest 不受影響', () => {
  test('backlog 空 + setSilence(60) → runDaemon 兩輪，notifier 收不到 idle 告警；clearSilence 後重跑 → 收得到', async () => {
    const engine = new MockEngine([])
    const d = deps(engine)
    setSilence(d.cfg.dataDir, 60)
    const notifier = new FakeNotifier()
    const sleepCalls: number[] = []

    const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 2 }))

    expect(result).toBe('max-cycles')
    const idleAlerts = notifier.sent.filter(t => t.includes('backlog 已耗盡'))
    expect(idleAlerts).toHaveLength(0)

    clearSilence(d.cfg.dataDir)
    const notifier2 = new FakeNotifier()
    const sleepCalls2: number[] = []
    const result2 = await runDaemon(baseOpts(d, notifier2, sleepCalls2, { maxCycles: 2 }))

    expect(result2).toBe('max-cycles')
    const idleAlerts2 = notifier2.sent.filter(t => t.includes('backlog 已耗盡'))
    expect(idleAlerts2).toHaveLength(1)
  })

  test('silence 中告警被吞時，events.jsonl 留痕 alert-silenced（Fix 1：不可零痕跡消失）', async () => {
    const engine = new MockEngine([])
    const d = deps(engine)
    setSilence(d.cfg.dataDir, 60)
    const notifier = new FakeNotifier()
    const sleepCalls: number[] = []

    await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 2 }))

    const eventsRaw = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
    expect(eventsRaw).toContain('alert-silenced')
  })

  test('silence 中 digest 照送(鐵律 #6：digest 不經 sendCooldownAlert，天然不受影響)', async () => {
    const engine = new MockEngine([])
    const d = deps(engine)
    setSilence(d.cfg.dataDir, 60)
    const notifier = new FakeNotifier()
    const sleepCalls: number[] = []

    const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 1 }))

    expect(result).toBe('max-cycles')
    const digestSends = notifier.sent.filter(t => t.includes('每日摘要'))
    expect(digestSends).toHaveLength(1)
  })
})
