import { expect, test, beforeEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runOnce, type Deps } from '../src/scheduler.js'
import { BacklogStore, taskId } from '../src/backlog.js'
import type { Disposition } from '../src/types.js'
import { RunDb, localDay, type AttemptRecord } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { ConfigSchema } from '../src/types.js'

/** db.record 呼叫的窺視殼——鏡像既有 ThrowingReportStore 手法：繼承真實 RunDb，
 * 覆寫 record 時先攔一份參數快照再照跑 super（維持真實 sqlite 落地行為不變）。 */
class RecordSpyDb extends RunDb {
  readonly records: AttemptRecord[] = []
  record(r: AttemptRecord): void {
    this.records.push(r)
    super.record(r)
  }
}

let dir: string
function deps(engine: MockEngine, backlogMd = '- [ ] 任務一\n'): Deps {
  dir = mkdtempSync(join(tmpdir(), 'adng-sch-'))
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, backlogMd)
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engine: 'mock', stopFile: join(dir, '.adng.stop')
  })
  return { cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(dir, 'run.db')), engine, events: new EventLog(cfg.dataDir) }
}

test('happy path：done + backlog 打勾 + 記帳', async () => {
  const d = deps(new MockEngine([{ ok: true, costUsd: 0.3 }]))
  expect(await runOnce(d)).toBe('done')
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('- [x] 任務一')
  expect(d.db.costForLocalDay(localDay(new Date().toISOString(), 0), 0)).toBeCloseTo(0.3)
})

test('敗第 1 次留 open；敗第 2 次 blocked（鐵律：不無限重試）', async () => {
  const e = new MockEngine([{ ok: false, reason: 'x' }, { ok: false, reason: 'x' }])
  const d = deps(e)
  expect(await runOnce(d)).toBe('failed')
  expect(d.store.nextTask()).not.toBeNull() // 還是 open
  expect(await runOnce(d)).toEqual({ kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一' })
  expect(d.store.nextTask()).toBeNull() // blocked 不再撿
})

test('backlog 空 → idle，且 idle 事件 24h 去重', async () => {
  const d = deps(new MockEngine(), '# 空\n')
  expect(await runOnce(d)).toBe('idle')
  expect(await runOnce(d)).toBe('idle')
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events.match(/"type":"idle"/g)).toHaveLength(1)
})

test('stop 檔優先於一切', async () => {
  const e = new MockEngine()
  const d = deps(e)
  writeFileSync(d.cfg.stopFile, '')
  expect(await runOnce(d)).toBe('stopped')
  expect(e.calls).toHaveLength(0)
})

test('成本硬停：超過 dailyHardUsd 不再派工', async () => {
  const e = new MockEngine()
  const d = deps(e)
  d.db.record({ taskId: 'z', ok: true, costUsd: 999, detail: 'burn' })
  expect(await runOnce(d)).toBe('cost-hard-stop')
  expect(e.calls).toHaveLength(0)
})

test('engine 丟例外：計一次失敗、不打勾、回 engine-error', async () => {
  const d = deps(new MockEngine([{ throw: 'ECONNRESET' }]))
  expect(await runOnce(d)).toBe('engine-error')
  expect(d.db.failCount(d.store.nextTask()!.id)).toBe(1)
})

test('preflight 失敗：回 preflight-failed，engine.run 零呼叫，事件 24h 去重', async () => {
  const e = new MockEngine([{ ok: true }], { ok: false, detail: 'engine 尚未就緒' })
  const d = deps(e)
  expect(await runOnce(d)).toBe('preflight-failed')
  expect(await runOnce(d)).toBe('preflight-failed')
  expect(e.calls).toHaveLength(0)
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events.match(/"type":"preflight-failed"/g)).toHaveLength(1)
})

test('engine 成功但 store.report 拋錯：仍回 done、db 只記一筆 ok（無假失敗）、events 含 report-failed', async () => {
  const d = deps(new MockEngine([{ ok: true, costUsd: 0.2 }]))

  class ThrowingReportStore extends BacklogStore {
    report(_id: string, _d: Disposition): void {
      throw new Error('模擬 store.report 下游 I/O 故障（如磁碟權限錯誤）')
    }
  }
  const throwingStore = new ThrowingReportStore(d.cfg.backlogFile)

  const result = await runOnce({ ...d, store: throwingStore })
  expect(result).toBe('done')

  // db 只記一筆「ok」紀錄，沒有因為下游 report 失敗而被誤記成假失敗
  const task = d.store.nextTask()
  expect(task).not.toBeNull()
  expect(d.db.failCount(task!.id)).toBe(0)
  expect(d.db.costForLocalDay(localDay(new Date().toISOString(), 0), 0)).toBeCloseTo(0.2)

  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('"type":"report-failed"')
  expect(events).toContain('"willRepick":true')

  // 已知殘留風險：backlog 沒打勾（下一輪會重新撿到這個「已完成」任務）
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('- [ ] 任務一')
})

test('engine 連 throw 兩次 → 第二次回 blocked（補齊 engine-error → blocked 的 transition）', async () => {
  const d = deps(new MockEngine([{ throw: 'ECONNRESET' }, { throw: 'ECONNRESET' }]))
  expect(await runOnce(d)).toBe('engine-error')
  expect(d.store.nextTask()).not.toBeNull() // 還是 open
  expect(await runOnce(d)).toEqual({ kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一' })
  expect(d.store.nextTask()).toBeNull() // blocked 不再撿
})

test('preflight 失敗時 heartbeat 更新為 idle（不留 stale running）', async () => {
  const e = new MockEngine([], { ok: false, detail: 'auth dead' })
  const d = deps(e)
  expect(await runOnce(d)).toBe('preflight-failed')
  const hb = JSON.parse(readFileSync(join(d.cfg.dataDir, 'heartbeat.json'), 'utf8'))
  expect(hb.state).toBe('idle')
})

test('backlog 有重複任務時發 duplicate-tasks 事件（24h 去重）', async () => {
  const d = deps(new MockEngine(), '- [ ] 重複的\n- [ ] 重複的\n- [ ] 正常的\n')
  await runOnce(d)
  await runOnce(d)
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events.match(/"type":"duplicate-tasks"/g)).toHaveLength(1)
})

test('verifier 拒絕 → failed 計數、不打勾；達 maxAttempts 轉 blocked', async () => {
  const d = deps(new MockEngine([{ ok: true }, { ok: true }]))
  const rejecter = { check: async () => ({ pass: false, reason: 'verify-fail: 測試紅', alerts: [] }) }
  const dd = { ...d, verifier: rejecter }
  expect(await runOnce(dd)).toBe('failed')
  expect(d.store.nextTask()).not.toBeNull()
  expect(await runOnce(dd)).toEqual({ kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一' })
})

test('verifier throw → pass-with-alert（鐵律#4），任務照 done', async () => {
  const d = deps(new MockEngine([{ ok: true }]))
  const bomber = { check: async () => { throw new Error('verifier exploded') } }
  expect(await runOnce({ ...d, verifier: bomber })).toBe('done')
  const ev = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(ev).toContain('verify-alert')
})

test('失敗成本估計（M4 Task 3）：engine 回報 costUnknown（如 timeout）→ db 記 cfg.failureCostEstimateUsd 且 detail 帶 cost-estimated 標記', async () => {
  const e = new MockEngine([{ ok: false, reason: 'timeout', costUsd: 0, costUnknown: true }])
  const d = deps(e)
  const spyDb = new RecordSpyDb(join(dir, 'run-spy.db'))
  const result = await runOnce({ ...d, db: spyDb })
  expect(result).toBe('failed')
  expect(spyDb.records).toHaveLength(1)
  expect(spyDb.records[0]!.costUsd).toBeCloseTo(1) // ConfigSchema.failureCostEstimateUsd 預設 1
  expect(spyDb.records[0]!.detail).toContain('cost-estimated')
})

test('失敗成本估計：engine 回報真實 costUsd（非 costUnknown）→ 照記真值、detail 不帶 cost-estimated 標記', async () => {
  const e = new MockEngine([{ ok: false, reason: 'is_error: 真實失敗但有回報成本', costUsd: 0.42 }])
  const d = deps(e)
  const spyDb = new RecordSpyDb(join(dir, 'run-spy2.db'))
  expect(await runOnce({ ...d, db: spyDb })).toBe('failed')
  expect(spyDb.records).toHaveLength(1)
  expect(spyDb.records[0]!.costUsd).toBeCloseTo(0.42)
  expect(spyDb.records[0]!.detail).not.toContain('cost-estimated')
})

test('失敗成本估計：自訂 failureCostEstimateUsd（如 2.5）流動到 db 記帳', async () => {
  const e = new MockEngine([{ ok: false, reason: 'exit 1: boom', costUsd: 0, costUnknown: true }])
  const d = deps(e)
  const customCfg = { ...d.cfg, failureCostEstimateUsd: 2.5 }
  const spyDb = new RecordSpyDb(join(dir, 'run-spy3.db'))
  await runOnce({ ...d, cfg: customCfg, db: spyDb })
  expect(spyDb.records[0]!.costUsd).toBeCloseTo(2.5)
})
