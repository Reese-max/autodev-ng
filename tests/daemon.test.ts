import { expect, test } from 'vitest'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runDaemon, type DaemonOpts, type Notifier } from '../src/daemon.js'
import type { Deps } from '../src/scheduler.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { ConfigSchema } from '../src/types.js'
import { acquireLock } from '../src/lock.js'
import { shouldSendDigest } from '../src/digest.js'

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

function deps(engine: MockEngine, backlogMd = '- [ ] 任務一\n'): Deps {
  const dir = mkdtempSync(join(tmpdir(), 'adng-daemon-'))
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, backlogMd)
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engine: 'mock', stopFile: join(dir, '.adng.stop')
  })
  return { cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(dir, 'run.db')), engine, events: new EventLog(cfg.dataDir) }
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

test('① lock 被占 → lock-busy，告警一次，runOnce 完全不執行', async () => {
  const engine = new MockEngine([{ ok: true }])
  const d = deps(engine)
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []
  const lockDir = join(d.cfg.dataDir, '..', 'lock')
  expect(acquireLock(lockDir)).toBe(true) // 佔住鎖，模擬已有 instance 在跑

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { lockDir }))

  expect(result).toBe('lock-busy')
  expect(engine.calls).toHaveLength(0)
  expect(notifier.sent).toHaveLength(1)
  expect(notifier.sent[0]).toMatch(/lock|佔用/)
})

test('② runOnce throw → 不死、runonce-crash 事件、告警、指數退避後繼續下一輪', async () => {
  class ThrowingStore extends BacklogStore {
    nextTask(): never {
      throw new Error('backlog 讀取炸裂（模擬 I/O 故障）')
    }
  }
  const d = deps(new MockEngine())
  const throwingStore = new ThrowingStore(d.cfg.backlogFile)
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts({ ...d, store: throwingStore }, notifier, sleepCalls, { maxCycles: 3, cooldownMs: 1000 }))

  expect(result).toBe('max-cycles')
  // 3 輪皆 crash：指數退避 cooldownMs*2^1, *2^2, *2^3（皆未達 5 次連續崩潰暫停門檻）
  expect(sleepCalls).toEqual([2000, 4000, 8000])

  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events.match(/"type":"runonce-crash"/g)).toHaveLength(3)

  const crashAlerts = notifier.sent.filter(t => t.includes('runOnce 崩潰'))
  expect(crashAlerts).toHaveLength(3)
})

test('③ 一個任務成功、一個任務連敗轉 blocked，其餘輪跑到 idle：digest 一天只送一次、blocked 告警內容含任務文字', async () => {
  const backlog = '- [ ] 任務一：會成功\n- [ ] 任務二：會連敗變 blocked\n'
  const engine = new MockEngine([
    { ok: true, costUsd: 0.1 }, // 任務一 成功
    { ok: false, reason: 'x' }, // 任務二 第 1 次敗
    { ok: false, reason: 'x' }, // 任務二 第 2 次敗 → blocked（maxAttempts 預設 2）
  ])
  const d = deps(engine, backlog)
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  // cycle1: 任務一 done → cooldown
  // cycle2: 任務二 第1敗 → cooldown
  // cycle3: 任務二 第2敗 → blocked，告警
  // cycle4~6: idle（backlog 全部處理完）
  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 6 }))

  expect(result).toBe('max-cycles')

  const blockedAlerts = notifier.sent.filter(t => t.includes('blocked'))
  expect(blockedAlerts.length).toBeGreaterThanOrEqual(1)
  expect(blockedAlerts[0]).toContain('任務二')

  // digest：每輪都會檢查，但同一天只應該真的送達一次（多輪 idle 不重複灌）
  const digestSends = notifier.sent.filter(t => t.includes('adng 每日摘要'))
  expect(digestSends).toHaveLength(1)
})

test('④ stop 檔 → 回 stopped，且 lock 有被釋放（daemon 結束後可再次 acquire）', async () => {
  const d = deps(new MockEngine())
  writeFileSync(d.cfg.stopFile, '')
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []
  const lockDir = join(d.cfg.dataDir, '..', 'lock')

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { lockDir }))

  expect(result).toBe('stopped')
  expect(acquireLock(lockDir)).toBe(true) // 沒被釋放的話這裡會回 false
})

test('⑤ digest 送失敗（notifier 回 false）→ stamp 不落，下一輪繼續重送', async () => {
  const d = deps(new MockEngine(), '# 空 backlog\n') // 直接 idle，快速觸發 digest 檢查
  const notifier = new FakeNotifier(() => false) // 所有 send 一律「送失敗」
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 3 }))

  expect(result).toBe('max-cycles')
  const digestSends = notifier.sent.filter(t => t.includes('adng 每日摘要'))
  expect(digestSends.length).toBeGreaterThanOrEqual(2) // 送失敗沒被標記，下一輪又重試

  const today = new Date().toISOString().slice(0, 10)
  expect(shouldSendDigest(d.cfg.dataDir, today)).toBe(true) // stamp 始終沒落
})
