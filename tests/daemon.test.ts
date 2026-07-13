import { expect, test, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// M10.0 Task 5：daemon idle 分支呼叫 maybeRunPerpetual——整檔 mock，預設 resolve false
// （等同 cfg.perpetual 未開時真實閘門的觀察行為），既有 idle 相關測試不受影響；
// 三個新案例（下方 M10.0 區塊）用 mockResolvedValueOnce/mockRejectedValueOnce 覆蓋單次呼叫。
const maybeRunPerpetualMock = vi.hoisted(() => vi.fn(async (): Promise<boolean> => false))
// 終審 finding 1：perpetualDigestLine 也整檔 mock（預設回 null，等同既有 fail-open 觀察行為，
// 不改變既有測試——之前這個 import 在本檔根本沒被 mock 到值，daemon.ts 呼叫時直接 undefined
// 炸 TypeError，被呼叫端自己的 try/catch 吞成 null，效果剛好一樣）。案例 5 靠這個 mock 的
// 呼叫次數斷言 daemon.ts 呼叫點是否有先看 cfg.perpetual 這個 gate——真實函式的行為
// （空台帳回 null）已在 tests/autopilot-perpetual.test.ts 涵蓋，這裡只驗 call-site 邏輯。
const perpetualDigestLineMock = vi.hoisted(() => vi.fn((): string | null => null))
vi.mock('../src/autopilot/perpetual.js', () => ({ maybeRunPerpetual: maybeRunPerpetualMock, perpetualDigestLine: perpetualDigestLineMock }))

import { runDaemon, yesterdayLocal, baseAlertMessage, type DaemonOpts, type Notifier } from '../src/daemon.js'
import type { CycleResult, Deps } from '../src/scheduler.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { ConfigSchema, type Disposition, type Task } from '../src/types.js'
import { acquireLock } from '../src/lock.js'
import { shouldSendDigest } from '../src/digest.js'

/** 獨立於 src/daemon.ts 實作的 UTC 日期算法（用 setUTCDate 而非 ms 相減），
 * 避免測試與生產碼共用同一套算法而失去回歸保護力。offset=-1 即「昨天」。 */
function utcDay(offsetDays: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

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
  // Windows 全域 core.autocrlf=true 會讓 checkout 內容 LF→CRLF 而被 git 視為 modified，
  // 干擾 `git worktree remove`（非 --force）；臨時 repo 內 local 覆寫避免依賴全域設定。
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# adng test repo\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore' })
}

function deps(engine: MockEngine, backlogMd = '- [ ] 任務一\n'): Deps {
  const dir = mkdtempSync(join(tmpdir(), 'adng-daemon-'))
  initGitRepo(dir)
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, backlogMd)
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engine: 'mock', stopFile: join(dir, '.adng.stop'),
    worktreesDir: join(dir, 'worktrees'), // 絕對路徑，絕不落在真專案目錄（鐵律 #6）
    // 本檔既有測試（utcDay 輔助函式、digest 昨日/今日斷言）全部鎖定純 UTC 日界線語意；
    // ConfigSchema 預設 timezoneOffsetHours=8 會讓日界線在 UTC 16:00 前後偏移、隨執行時刻變動
    // 而 flaky，這裡明確釘住 offset=0 保持既有語意（相容性錨點——M4 Task 3）。
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

test('② runOnce throw → 不死、runonce-crash 事件每輪都記、告警走冷卻閘（同 key 只送 1 則）、指數退避後繼續下一輪', async () => {
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
  // ——冷卻閘只影響「送不送告警」，不影響退避節奏本身。
  expect(sleepCalls).toEqual([2000, 4000, 8000])

  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events.match(/"type":"runonce-crash"/g)).toHaveLength(3)

  // 修 2（daemon-crash 納冷卻閘）：3 輪同 key，6h 冷卻窗內只送第 1 則，後兩則被抑制吞掉。
  const crashAlerts = notifier.sent.filter(t => t.includes('runOnce 崩潰'))
  expect(crashAlerts).toHaveLength(1)
})

test('②b 冷卻閘：連續 5 次崩潰觸發暫停——daemon-crash 與 daemon-crash-pause 各自 key 互不干擾、皆只送 1 則', async () => {
  class ThrowingStore extends BacklogStore {
    nextTask(): never {
      throw new Error('backlog 讀取炸裂（模擬 I/O 故障）')
    }
  }
  const d = deps(new MockEngine())
  const throwingStore = new ThrowingStore(d.cfg.backlogFile)
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  // 6 輪：前 4 輪指數退避、第 5 輪觸發連續崩潰暫停（sleep CRASH_PAUSE_MS 並歸零計數）、
  // 第 6 輪 consecutiveCrashes 重新從 1 起算。
  const result = await runDaemon(baseOpts({ ...d, store: throwingStore }, notifier, sleepCalls, { maxCycles: 6, cooldownMs: 1000 }))

  expect(result).toBe('max-cycles')
  expect(sleepCalls).toEqual([2000, 4000, 8000, 16000, 30 * 60 * 1000, 2000])

  // daemon-crash 冷卻閘：6 輪全部同 key，只送 1 則。
  const crashAlerts = notifier.sent.filter(t => t.includes('runOnce 崩潰'))
  expect(crashAlerts).toHaveLength(1)

  // daemon-crash-pause 是獨立 key，在這 6 輪內只觸發過 1 次（第 5 輪），本就只送 1 則；
  // 用來確認冷卻閘去重不會誤傷「暫停機制本身」——暫停照樣在第 5 輪發生（見上面 sleepCalls）。
  const pauseAlerts = notifier.sent.filter(t => t.includes('連續崩潰暫停'))
  expect(pauseAlerts).toHaveLength(1)
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
  // 真 git worktree I/O，24/7 機器負載下 5s 不夠（非產品 bug）→ 針對性 timeout 20s
}, 20000)

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

test('⑥ stop 檔已存在（runOnce 首輪即回 stopped）+ 當日 digest 未發 → runDaemon 回 stopped 且摘要已發且 stamp 已標記', async () => {
  const d = deps(new MockEngine(), '# 空 backlog\n')
  writeFileSync(d.cfg.stopFile, '') // stop 檔存在，首輪 runOnce 即回 stopped
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { lockDir: join(d.cfg.dataDir, '..', 'lock') }))

  expect(result).toBe('stopped')

  // 摘要應該被發送過一次（且含「通道自檢」字樣）
  const digestSends = notifier.sent.filter(t => t.includes('adng 每日摘要'))
  expect(digestSends).toHaveLength(1)
  expect(digestSends[0]).toContain('adng 通道自檢 OK')

  // stamp 已標記（已不再 shouldSendDigest）
  const today = new Date().toISOString().slice(0, 10)
  expect(shouldSendDigest(d.cfg.dataDir, today)).toBe(false)
})

test('⑦ 紅線 4 報告窗：events.jsonl 含昨日 verify-alert → 今日輪首送出的摘要含正確 N 且顯示昨日日期', async () => {
  const d = deps(new MockEngine(), '# 空 backlog\n') // 直接 idle，快速觸發 digest 檢查
  const yesterday = utcDay(-1)
  writeFileSync(join(d.cfg.dataDir, 'events.jsonl'), [
    JSON.stringify({ type: 'verify-alert', detail: 'verify-skip: x', ts: `${yesterday}T23:30:00.000Z` }),
    JSON.stringify({ type: 'verify-alert', detail: 'verify-skip: x', ts: `${yesterday}T10:00:00.000Z` }),
  ].join('\n') + '\n')
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 2 }))

  expect(result).toBe('max-cycles')
  const digestSends = notifier.sent.filter(t => t.includes('adng 每日摘要'))
  expect(digestSends).toHaveLength(1)
  expect(digestSends[0]).toContain(yesterday)
  expect(digestSends[0]).toContain('verify 略過 2 次')
})

test('⑧ 紅線 4 報告窗：db 有昨日 attempts（ok/fail）→ 今日輪首摘要的完成/失敗計數計入昨日數字', async () => {
  const d = deps(new MockEngine(), '# 空 backlog\n')
  const yesterday = utcDay(-1)
  d.db.record({ taskId: 'y1', ok: true, costUsd: 1.5, detail: '', ts: `${yesterday}T08:00:00.000Z` })
  d.db.record({ taskId: 'y2', ok: false, costUsd: 0.5, detail: 'x', ts: `${yesterday}T09:00:00.000Z` })
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 2 }))

  expect(result).toBe('max-cycles')
  const digestSends = notifier.sent.filter(t => t.includes('adng 每日摘要'))
  expect(digestSends).toHaveLength(1)
  expect(digestSends[0]).toContain(yesterday)
  expect(digestSends[0]).toContain('完成 1 筆')
  expect(digestSends[0]).toContain('失敗 1 筆')
})

test('⑨ 冷卻閘（HIGH-2）：連續 3 輪 cost-hard-stop 只送 1 則告警', async () => {
  const d = deps(new MockEngine())
  d.db.record({ taskId: 'z', ok: true, costUsd: 999, detail: 'burn' })
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 3 }))

  expect(result).toBe('max-cycles')
  const alerts = notifier.sent.filter(t => t.includes('cost-hard-stop'))
  expect(alerts).toHaveLength(1)
})

test('⑩ 冷卻閘：冷卻窗（6h）已過的持久化紀錄 → 再送且文案含抑制計數', async () => {
  const d = deps(new MockEngine())
  d.db.record({ taskId: 'z', ok: true, costUsd: 999, detail: 'burn' })
  const sevenHoursAgo = Date.now() - 7 * 60 * 60 * 1000
  writeFileSync(join(d.cfg.dataDir, 'alert-cooldown.json'), JSON.stringify({
    'cost-hard-stop': { lastSentMs: sevenHoursAgo, suppressedCount: 3 }
  }))
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 1 }))

  expect(result).toBe('max-cycles')
  const alerts = notifier.sent.filter(t => t.includes('cost-hard-stop'))
  expect(alerts).toHaveLength(1)
  expect(alerts[0]).toContain('冷卻期間抑制 3 則')
})

test('⑪ 冷卻閘：兩個不同任務各自 blocked → 各送一則告警（key 各自獨立）', async () => {
  const backlog = '- [ ] 任務甲\n- [ ] 任務乙\n'
  const engine = new MockEngine([
    { ok: false, reason: 'x' }, { ok: false, reason: 'x' }, // 任務甲連敗 2 次 → blocked
    { ok: false, reason: 'x' }, { ok: false, reason: 'x' }, // 任務乙連敗 2 次 → blocked
  ])
  const d = deps(engine, backlog)
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 4 }))

  expect(result).toBe('max-cycles')
  const blockedAlerts = notifier.sent.filter(t => t.includes('blocked'))
  expect(blockedAlerts).toHaveLength(2)
  expect(blockedAlerts[0]).toContain('任務甲')
  expect(blockedAlerts[1]).toContain('任務乙')
})

test('⑫ 冷卻閘：同一任務重複轉 blocked（report 未落地）→ 第 2 次起被去重吞掉', async () => {
  class NeverPersistBlockedStore extends BacklogStore {
    report(id: string, d: Disposition): void {
      if (d.kind === 'blocked') return // 模擬「持久化失敗但不 throw」：backlog 仍是 open，下輪重新撿到同任務
      super.report(id, d)
    }
  }
  const engine = new MockEngine([
    { ok: false, reason: 'x' }, { ok: false, reason: 'x' },
    { ok: false, reason: 'x' }, { ok: false, reason: 'x' },
  ])
  const d = deps(engine)
  const neverPersistStore = new NeverPersistBlockedStore(d.cfg.backlogFile)
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts({ ...d, store: neverPersistStore }, notifier, sleepCalls, { maxCycles: 4 }))

  expect(result).toBe('max-cycles')
  const blockedAlerts = notifier.sent.filter(t => t.includes('blocked'))
  expect(blockedAlerts).toHaveLength(1) // 第 2~4 次同任務（同 key）blocked 被冷卻閘吞掉
})

test('⑬ 冷卻閘：alert-cooldown.json 損壞 → fail-open 照發不炸 daemon（鐵律 #4）', async () => {
  const d = deps(new MockEngine())
  d.db.record({ taskId: 'z', ok: true, costUsd: 999, detail: 'burn' })
  writeFileSync(join(d.cfg.dataDir, 'alert-cooldown.json'), '{not json')
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 1 }))

  expect(result).toBe('max-cycles')
  const alerts = notifier.sent.filter(t => t.includes('cost-hard-stop'))
  expect(alerts).toHaveLength(1) // 損壞視同無冷卻表 → 正常照發
})

test('⑭ 冷卻閘不影響 digest：系統告警在冷卻中被吞，每日摘要仍照常送達（鐵律 #6）', async () => {
  const d = deps(new MockEngine())
  d.db.record({ taskId: 'z', ok: true, costUsd: 999, detail: 'burn' })
  writeFileSync(join(d.cfg.dataDir, 'alert-cooldown.json'), JSON.stringify({
    'cost-hard-stop': { lastSentMs: Date.now(), suppressedCount: 0 }
  }))
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 1 }))

  expect(result).toBe('max-cycles')
  const alerts = notifier.sent.filter(t => t.includes('cost-hard-stop'))
  expect(alerts).toHaveLength(0) // 冷卻中被吞
  const digestSends = notifier.sent.filter(t => t.includes('adng 每日摘要'))
  expect(digestSends).toHaveLength(1) // digest 完全不受冷卻表影響，照常送
})

test('⑮ 冷卻閘（修 1）：lock-busy 連續兩次啟動在冷卻窗內只送 1 則，7h 後第三次再送並帶抑制計數', async () => {
  const d = deps(new MockEngine())
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []
  const lockDir = join(d.cfg.dataDir, '..', 'lock')
  expect(acquireLock(lockDir)).toBe(true) // 外部持鎖，模擬已有 instance 在跑（lock 全程不釋放）

  const r1 = await runDaemon(baseOpts(d, notifier, sleepCalls, { lockDir }))
  expect(r1).toBe('lock-busy')

  const r2 = await runDaemon(baseOpts(d, notifier, sleepCalls, { lockDir }))
  expect(r2).toBe('lock-busy')

  const lockBusyAlerts = notifier.sent.filter(t => /lock|佔用/.test(t))
  expect(lockBusyAlerts).toHaveLength(1) // 第二次 respawn 在 6h 冷卻窗內被吞（Task 9 每 15 分撞鎖情境）

  // 模擬 7h 後：直接改冷卻表 lastSentMs（鏡像既有測試⑩手法）
  const cooldownFile = join(d.cfg.dataDir, 'alert-cooldown.json')
  const table = JSON.parse(readFileSync(cooldownFile, 'utf8'))
  table['lock-busy'].lastSentMs = Date.now() - 7 * 60 * 60 * 1000
  writeFileSync(cooldownFile, JSON.stringify(table))

  const r3 = await runDaemon(baseOpts(d, notifier, sleepCalls, { lockDir }))
  expect(r3).toBe('lock-busy')

  const lockBusyAlertsAfter = notifier.sent.filter(t => /lock|佔用/.test(t))
  expect(lockBusyAlertsAfter).toHaveLength(2)
  expect(lockBusyAlertsAfter[1]).toContain('冷卻期間抑制')
})

test('⑯ 冷卻閘（修 3）：兩個不同 task.id 但任務文字前 40 字相同 → key 各自獨立、各發一則 blocked 告警', async () => {
  const prefix = 'A'.repeat(40)
  const backlog = `- [ ] ${prefix}-第一個任務\n- [ ] ${prefix}-第二個任務\n`
  const engine = new MockEngine([
    { ok: false, reason: 'x' }, { ok: false, reason: 'x' }, // 第一個任務連敗 2 次 → blocked
    { ok: false, reason: 'x' }, { ok: false, reason: 'x' }, // 第二個任務連敗 2 次 → blocked
  ])
  const d = deps(engine, backlog)
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 4 }))

  expect(result).toBe('max-cycles')
  // 舊版 key = `blocked:<文字前 40 字>` 會讓這兩個任務撞出同一個 key，第二則被冷卻閘誤吞；
  // 改用 task.id 後兩者 key 不同，各自獨立發送。
  const blockedAlerts = notifier.sent.filter(t => t.includes('blocked'))
  expect(blockedAlerts).toHaveLength(2)
  expect(blockedAlerts[0]).toContain('第一個任務')
  expect(blockedAlerts[1]).toContain('第二個任務')
})

test('MEDIUM 1 修復：baseAlertMessage 依 blocked reason 各出對應人話文案（不再全部印「連敗達上限」）', () => {
  const blocked = (reason: 'max-attempts' | 'not-a-git-repo' | 'merge-conflict' | 'branch-switched'): CycleResult =>
    ({ kind: 'blocked', taskId: 't1', taskText: '某任務', reason })

  expect(baseAlertMessage(blocked('max-attempts'))).toContain('連敗達上限')
  expect(baseAlertMessage(blocked('not-a-git-repo'))).toContain('worktree 建立失敗')
  expect(baseAlertMessage(blocked('merge-conflict'))).toContain('無法自動合併')
  expect(baseAlertMessage(blocked('branch-switched'))).toContain('分支已切換或處於 detached HEAD')

  // 三個新原因都不該被誤植成舊版的「連敗達上限」文案
  expect(baseAlertMessage(blocked('not-a-git-repo'))).not.toContain('連敗達上限')
  expect(baseAlertMessage(blocked('merge-conflict'))).not.toContain('連敗達上限')
  expect(baseAlertMessage(blocked('branch-switched'))).not.toContain('連敗達上限')
})

// ---------------------------------------------------------------------------
// M4 Task 8（soak 前測試補強）：ledger 標記的三個 gap——
// (a) 連續崩潰暫停跨越兩輪：暫停時長每次都完整 30 分，pause 告警走冷卻閘只送一次；
// (b) acquireLock throw（EPERM/ENOENT 類 infra 故障，非 lock-busy）→ 告警＋rethrow 炸給排程器；
// (c) 崩潰計數在一次成功 cycle 後歸零（退避從 2^1 重新起算，不誤觸暫停門檻）。
// ---------------------------------------------------------------------------

test('⑰ 連續崩潰暫停 ×2：10 輪全崩 → 第 5、10 輪各暫停完整 30 分（機制不受冷卻閘影響），pause 告警只送 1 則', async () => {
  class ThrowingStore extends BacklogStore {
    nextTask(): never {
      throw new Error('backlog 讀取炸裂（模擬 I/O 故障）')
    }
  }
  const d = deps(new MockEngine())
  const throwingStore = new ThrowingStore(d.cfg.backlogFile)
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts({ ...d, store: throwingStore }, notifier, sleepCalls, { maxCycles: 10, cooldownMs: 1000 }))

  expect(result).toBe('max-cycles')
  // 兩個完整週期：4 輪指數退避 → 第 5 輪暫停 30 分並歸零 → 再 4 輪退避 → 第 10 輪再次暫停 30 分。
  // 暫停「時長」與「觸發」每次照常發生——冷卻閘只管告警，不得吞掉暫停機制本身。
  const PAUSE = 30 * 60 * 1000
  expect(sleepCalls).toEqual([2000, 4000, 8000, 16000, PAUSE, 2000, 4000, 8000, 16000, PAUSE])

  // daemon-crash-pause key 的冷卻閘：第 10 輪的第二次暫停在 6h 冷卻窗內，告警被抑制——只送第 1 則。
  const pauseAlerts = notifier.sent.filter(t => t.includes('連續崩潰暫停'))
  expect(pauseAlerts).toHaveLength(1)
  expect(pauseAlerts[0]).toContain('30 分鐘')

  // daemon-crash key 亦各自獨立去重：10 輪同 key 只送 1 則。
  const crashAlerts = notifier.sent.filter(t => t.includes('runOnce 崩潰'))
  expect(crashAlerts).toHaveLength(1)
})

test('⑱ acquireLock throw（infra 故障，非 lock-busy）→ 告警走冷卻閘（key daemon-acquire-throw）並原樣 rethrow 炸給排程器，runOnce 完全不執行；重複啟動撞同一故障不洗版', async () => {
  const engine = new MockEngine([{ ok: true }])
  const d = deps(engine)
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []
  // lockDir 的父目錄不存在：mkdirSync(recursive:false) 拋 ENOENT（非 EEXIST）→
  // acquireLock 依錯誤分類原樣 rethrow（同 tests/lock-errors.test.ts 驗證的 EPERM/EBUSY 類語意）。
  const lockDir = join(d.cfg.dataDir, '..', 'no-such-parent', 'sub', 'lock')

  await expect(runDaemon(baseOpts(d, notifier, sleepCalls, { lockDir }))).rejects.toThrow(/ENOENT/)

  expect(engine.calls).toHaveLength(0) // 主迴圈完全沒起跑
  expect(sleepCalls).toHaveLength(0)
  expect(notifier.sent).toHaveLength(1) // 第一次照發
  expect(notifier.sent[0]).toContain('daemon 無法啟動')
  expect(notifier.sent[0]).toContain('acquireLock')

  // M5 Task 2：模擬 respawn 排程（run-once/daemon 語意）短時間內再啟動、撞同一 infra 故障——
  // rethrow 行為不變（照樣炸給排程器，不可假活），但告警在 6h 冷卻窗內被抑制，不得送第二則
  // （冷卻表落地於 dataDir/alert-cooldown.json，跨進程重啟仍有效）。
  await expect(runDaemon(baseOpts(d, notifier, sleepCalls, { lockDir }))).rejects.toThrow(/ENOENT/)
  expect(engine.calls).toHaveLength(0)
  expect(notifier.sent).toHaveLength(1) // 冷卻閘抑制，總數仍 1
})

test('⑲ 崩潰計數一次成功 cycle 後歸零：4 崩 → 1 成功 → 再崩 2 輪退避從 2^1 重起，不誤觸第 5 次暫停門檻', async () => {
  class FlakyStore extends BacklogStore {
    private calls = 0
    nextTask(): Task | null {
      this.calls++
      if (this.calls === 5) return super.nextTask() // 第 5 輪放行：正常派工成功
      throw new Error('backlog 讀取炸裂（模擬陣發性 I/O 故障）')
    }
  }
  const engine = new MockEngine([{ ok: true, costUsd: 0.1 }])
  const d = deps(engine)
  const flakyStore = new FlakyStore(d.cfg.backlogFile)
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts({ ...d, store: flakyStore }, notifier, sleepCalls, { maxCycles: 7, cooldownMs: 1000 }))

  expect(result).toBe('max-cycles')
  expect(engine.calls).toHaveLength(1) // 第 5 輪確實成功跑完一個任務

  // 前 4 崩：2^1..2^4 退避；第 5 輪成功 → sleep cooldownMs(1000) 且計數歸零；
  // 第 6、7 輪再崩：若計數未歸零，第 6 輪即是「連續第 5 次」會誤觸 30 分暫停——
  // 正確行為是退避從 2^1 重新起算。
  expect(sleepCalls).toEqual([2000, 4000, 8000, 16000, 1000, 2000, 4000])

  // events 帳面同步驗證：runonce-crash 的 consecutiveCrashes 序列 1,2,3,4 → 成功歸零 → 1,2
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  const crashSeq = events.split('\n').filter(l => l.includes('"type":"runonce-crash"'))
    .map(l => (JSON.parse(l) as { consecutiveCrashes: number }).consecutiveCrashes)
  expect(crashSeq).toEqual([1, 2, 3, 4, 1, 2])

  // 未觸發暫停：無 30 分 sleep（上面 toEqual 已保證），也不得出現 pause 告警
  const pauseAlerts = notifier.sent.filter(t => t.includes('連續崩潰暫停'))
  expect(pauseAlerts).toHaveLength(0)
})

// ---------------------------------------------------------------------------
// M10.0 Task 5：idle 分支接外環（maybeRunPerpetual，見上方整檔 vi.mock）
// ---------------------------------------------------------------------------

test('M10.0 案例 1：perpetual 未觸發（maybeRunPerpetual 回 false）→ idle 分支行為與現狀一致（idle alert 照發、sleep 收 idleSleepMs）', async () => {
  const d = deps(new MockEngine(), '# 空 backlog\n')
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 1 }))

  expect(result).toBe('max-cycles')
  expect(notifier.sent.some(t => t.includes('backlog 已耗盡'))).toBe(true)
  expect(sleepCalls).toEqual([5000]) // idleSleepMs（baseOpts 預設）
})

test('M10.0 案例 2：perpetual 觸發（maybeRunPerpetual 回 true）→ 該輪不發 idle alert，sleep 收 cooldownMs（非 idleSleepMs）', async () => {
  maybeRunPerpetualMock.mockResolvedValueOnce(true)
  const d = deps(new MockEngine(), '# 空 backlog\n')
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 1 }))

  expect(result).toBe('max-cycles')
  expect(notifier.sent.some(t => t.includes('backlog 已耗盡'))).toBe(false)
  expect(sleepCalls).toEqual([1000]) // cooldownMs（baseOpts 預設）
})

test('M10.0 案例 3：maybeRunPerpetual throw → daemon 不死（fail-open，鐵律 #4），照發 idle alert，迴圈繼續跑下一輪', async () => {
  maybeRunPerpetualMock.mockRejectedValueOnce(new Error('perpetual 炸裂（模擬外環故障）'))
  const d = deps(new MockEngine(), '# 空 backlog\n')
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 2 }))

  expect(result).toBe('max-cycles') // 兩輪都跑完，throw 沒有炸出主迴圈
  expect(notifier.sent.some(t => t.includes('backlog 已耗盡'))).toBe(true)
  expect(sleepCalls).toEqual([5000, 5000])
})

// 終審 finding 1：perpetual:false（ConfigSchema 預設）時，checkAndSendDigest 呼叫點不得呼叫
// perpetualDigestLine——否則每日側效在 dataDir/run.db 建表，且對空台帳印出噪音行，破壞
// 「perpetual 未設時行為與 M9.9 byte-identical」的硬回歸線（spec §3.7 零噪音）。
// perpetualDigestLine 真實函式的「空台帳回 null」行為已在 tests/autopilot-perpetual.test.ts
// 的 perpetualDigestLine describe 區塊涵蓋；本檔測的是 daemon.ts 呼叫點本身的 cfg.perpetual
// gate 邏輯，用檔頭的 perpetualDigestLineMock 斷言呼叫次數（見檔頭 mock 說明）。
test('M10.0 案例 4：perpetual:false（預設）→ checkAndSendDigest 呼叫點完全不呼叫 perpetualDigestLine（回歸線 finding 1）', async () => {
  const d = deps(new MockEngine(), '# 空 backlog\n') // 直接 idle，快速觸發 digest 檢查
  expect(d.cfg.perpetual).toBe(false) // 確認測試前提：cfg 走 ConfigSchema 預設值
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []
  perpetualDigestLineMock.mockClear()

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 1 }))

  expect(result).toBe('max-cycles')
  const digestSends = notifier.sent.filter(t => t.includes('adng 每日摘要'))
  expect(digestSends).toHaveLength(1) // digest 仍每輪必送（鐵律 #6 不受影響）
  expect(perpetualDigestLineMock).not.toHaveBeenCalled() // 但 perpetual 未開時完全不呼叫
})

test('M10.0 案例 5：perpetual:true → checkAndSendDigest 呼叫點會呼叫 perpetualDigestLine，回傳值併入摘要文字', async () => {
  const d = deps(new MockEngine(), '# 空 backlog\n')
  d.cfg.perpetual = true
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []
  perpetualDigestLineMock.mockClear()
  perpetualDigestLineMock.mockReturnValueOnce('自主工程師台帳：open 1｜fixed 2｜deferred 0')

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 1 }))

  expect(result).toBe('max-cycles')
  expect(perpetualDigestLineMock).toHaveBeenCalledWith(d.cfg.dataDir)
  const digestSends = notifier.sent.filter(t => t.includes('adng 每日摘要'))
  expect(digestSends).toHaveLength(1)
  expect(digestSends[0]).toContain('自主工程師台帳：open 1｜fixed 2｜deferred 0')
})

// ---------------------------------------------------------------------------
// M10.5 Task 1：daemon config-gone 自退（多專案退場語意）
// ---------------------------------------------------------------------------

test('M10.5：config 檔消失 → 記 daemon-config-gone 事件並回 config-gone（多專案退場）', async () => {
  const d = deps(new MockEngine())
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []
  const cfgFile = join(d.cfg.dataDir, 'proj.json')
  writeFileSync(cfgFile, '{}')
  let cycle = 0

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, {
    cfgPath: cfgFile,
    maxCycles: 5,
    sleepFn: async () => { cycle++; if (cycle === 1) rmSync(cfgFile) },
  }))

  expect(result).toBe('config-gone')
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('"type":"daemon-config-gone"')
})

test('M10.5：cfgPath 未設 → 行為不變（回歸線）', async () => {
  const d = deps(new MockEngine(), '# 空 backlog\n')
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 3 }))

  expect(result).toBe('max-cycles')
})

test('yesterdayLocal：純函數月界/年界正確減一天（本地日曆日，位移邏輯與 offset 無關）', () => {
  expect(yesterdayLocal('2026-03-01')).toBe('2026-02-28')
  expect(yesterdayLocal('2026-01-01')).toBe('2025-12-31')
  expect(yesterdayLocal('2026-07-05')).toBe('2026-07-04')
})

test('M5 Task 1：baseAlertMessage 對 engine-not-allowed 出對應人話文案（daemon 告警文案 switch 同步）', () => {
  const msg = baseAlertMessage({ kind: 'blocked', taskId: 't9', taskText: '[engine:zen] 跑雜務', reason: 'engine-not-allowed' })
  expect(msg).toContain('白名單')
  expect(msg).toContain('daemon 告警')
})

test('Task 2：baseAlertMessage 對 worktree-locked 出對應人話文案，不誤植 not-a-git-repo 的文案', () => {
  const msg = baseAlertMessage({ kind: 'blocked', taskId: 't10', taskText: '整理 worktree', reason: 'worktree-locked' })
  expect(msg).toContain('daemon 告警')
  expect(msg).toContain('佔用')
  expect(msg).not.toContain('非 git 專案')
})
