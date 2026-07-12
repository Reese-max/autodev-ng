import { expect, test } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { RunDb, localDay, localDayUtcRange } from '../src/db.js'

function freshDb(): RunDb {
  return new RunDb(join(mkdtempSync(join(tmpdir(), 'adng-db-')), 'run.db'))
}

test('record + failCount 只數失敗', () => {
  const db = freshDb()
  db.record({ taskId: 'aaaa', ok: false, costUsd: 0.1, detail: 'boom' })
  db.record({ taskId: 'aaaa', ok: true, costUsd: 0.2, detail: 'fixed' })
  db.record({ taskId: 'bbbb', ok: false, costUsd: 0.1, detail: 'x' })
  expect(db.failCount('aaaa')).toBe(1)
  expect(db.failCount('bbbb')).toBe(1)
  db.close()
})

test('costForLocalDay 以 UTC 日界線累計（offset 預設 0，相容舊 costSince 行為）', () => {
  const db = freshDb()
  db.record({ taskId: 'a', ok: true, costUsd: 1.5, detail: '', ts: '2026-07-05T01:00:00Z' })
  db.record({ taskId: 'a', ok: true, costUsd: 2.0, detail: '', ts: '2026-07-05T23:00:00Z' })
  db.record({ taskId: 'a', ok: true, costUsd: 9.9, detail: '', ts: '2026-07-04T23:59:00Z' })
  expect(db.costForLocalDay('2026-07-05')).toBeCloseTo(3.5)
  db.close()
})

test('costForLocalDay 毫秒時戳邊界修正：00:00:00.000Z 納入、前一日 23:59:59.999Z 排除', () => {
  const db = freshDb()
  // 應納入：當日 00:00:00.000Z（毫秒記錄）
  db.record({ taskId: 'boundary-test', ok: true, costUsd: 1.0, detail: '', ts: '2026-07-05T00:00:00.000Z' })
  // 應排除：前一日 23:59:59.999Z
  db.record({ taskId: 'boundary-test', ok: true, costUsd: 9.9, detail: '', ts: '2026-07-04T23:59:59.999Z' })
  // 應納入：當日正常時戳
  db.record({ taskId: 'boundary-test', ok: true, costUsd: 2.5, detail: '', ts: '2026-07-05T12:00:00Z' })
  expect(db.costForLocalDay('2026-07-05')).toBeCloseTo(3.5)
  db.close()
})

test('costForLocalDay 改用範圍查詢後不再是「since」開放式語意：只算指定日曆日', () => {
  const db = freshDb()
  db.record({ taskId: 'x', ok: true, costUsd: 5.0, detail: '', ts: '2026-07-06T01:00:00Z' })
  // 舊 costSince('2026-07-05') 是開放式「since」會把 07-06 也算進去；新版範圍查詢不該把次日算進 07-05 這天
  expect(db.costForLocalDay('2026-07-05')).toBeCloseTo(0)
  expect(db.costForLocalDay('2026-07-06')).toBeCloseTo(5.0)
  db.close()
})

test('localDay：offset=8 時 UTC 22:00 落本地明日、UTC 10:00 落本地今日', () => {
  expect(localDay('2026-07-04T22:00:00Z', 8)).toBe('2026-07-05')
  expect(localDay('2026-07-05T10:00:00Z', 8)).toBe('2026-07-05')
})

test('localDay：offset=0 與純 UTC 日期切割等價（相容性錨點）', () => {
  expect(localDay('2026-07-05T00:00:00.000Z', 0)).toBe('2026-07-05')
  expect(localDay('2026-07-05T23:59:59.999Z', 0)).toBe('2026-07-05')
})

test('localDay：月界/年界正確位移', () => {
  expect(localDay('2026-02-28T20:00:00Z', 8)).toBe('2026-03-01')
  expect(localDay('2025-12-31T20:00:00Z', 8)).toBe('2026-01-01')
})

test('localDayUtcRange：offset=8 的本地日換算 UTC 起迄（前一日 16:00 起、當日 16:00 止）', () => {
  const { startIso, endIso } = localDayUtcRange('2026-07-05', 8)
  expect(startIso).toBe('2026-07-04T16:00:00.000Z')
  expect(endIso).toBe('2026-07-05T16:00:00.000Z')
})

test('localDayUtcRange：offset=0 起迄恰為該 UTC 日 00:00:00.000Z ~ 次日 00:00:00.000Z', () => {
  const { startIso, endIso } = localDayUtcRange('2026-07-05', 0)
  expect(startIso).toBe('2026-07-05T00:00:00.000Z')
  expect(endIso).toBe('2026-07-06T00:00:00.000Z')
})

test('costForLocalDay：offset=8 時，本地日界線由 UTC 前一日 16:00 起算', () => {
  const db = freshDb()
  db.record({ taskId: 'a', ok: true, costUsd: 1.0, detail: '', ts: '2026-07-04T16:00:00.000Z' }) // 本地 07-05 00:00:00
  db.record({ taskId: 'a', ok: true, costUsd: 2.0, detail: '', ts: '2026-07-05T15:59:59.999Z' }) // 本地 07-05 23:59:59
  db.record({ taskId: 'a', ok: true, costUsd: 9.9, detail: '', ts: '2026-07-04T15:59:59.999Z' }) // 本地 07-04（前一本地日，排除）
  db.record({ taskId: 'a', ok: true, costUsd: 8.8, detail: '', ts: '2026-07-05T16:00:00.000Z' }) // 本地 07-06（次一本地日，排除）
  expect(db.costForLocalDay('2026-07-05', 8)).toBeCloseTo(3.0)
  db.close()
})

test('M9.9：migration 冪等——對既有庫開兩次 RunDb 不炸，engine 欄存在', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-db-'))
  const f = join(dir, 'run.db')
  new RunDb(f).close() // 第一次開＝建表
  const db = new RunDb(f) // 第二次開＝migration 重入，不應炸
  db.record({ taskId: 't1', ok: true, costUsd: 1, detail: '', engine: 'codex-spark' })
  expect(db.lastAttempt()!.engine).toBe('codex-spark')
  db.close()
})

test('M9.9 硬化：雙進程首開競態容錯——ALTER 撞 duplicate column 被吞，constructor 不炸', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-db-'))
  const f = join(dir, 'run.db')
  // 重現競態輸家的處境：「PRAGMA 檢查說欄位不在，ALTER 執行當下欄位卻已在」。
  // 用大寫 ENGINE 建欄——RunDb 的 PRAGMA 檢查嚴格比對小寫 'engine' 看不到它、照跑 ALTER；
  // SQLite 欄名不分大小寫，ALTER 拋 duplicate column name——與雙進程首開時輸家撞到的
  // 同一個錯，必須被吞掉（欄位已在＝等價冪等），constructor 不得炸。
  const raw = new Database(f)
  raw.exec(`CREATE TABLE attempts(
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL, ts TEXT NOT NULL, ok INTEGER NOT NULL,
    cost_usd REAL NOT NULL, detail TEXT NOT NULL, ENGINE TEXT NOT NULL DEFAULT '')`)
  raw.close()
  const db = new RunDb(f) // 不應炸（duplicate column 被吞＝等價冪等）
  // 讀寫仍要正常（SQLite 欄名不分大小寫，INSERT/WHERE 都打得到 ENGINE 欄；
  // 不用 lastAttempt 斷言——其結果鍵名跟隨表定義的大小寫，那是本合成觸發手法的
  // 人造痕跡，非 migration 容錯要驗的行為）
  db.record({ taskId: 't1', ok: true, costUsd: 1, detail: '', engine: 'codex-spark', ts: '2026-07-05T01:00:00Z' })
  expect(db.costForLocalDay('2026-07-05', 0)).toBeCloseTo(1)
  expect(db.billedCostForLocalDay('2026-07-05', 0, ['codex-spark'])).toBeCloseTo(0) // engine 值真的落了欄
  db.close()
})

test('M9.9：billedCostForLocalDay 排除訂閱引擎；空 engine 歷史列算真金（fail-safe）', () => {
  const db = freshDb()
  const ts = '2026-07-05T01:00:00Z'
  const day = '2026-07-05'
  db.record({ taskId: 'a', ok: true, costUsd: 5, detail: '', engine: 'claude', ts })
  db.record({ taskId: 'b', ok: true, costUsd: 3, detail: '', engine: 'codex-spark', ts })
  db.record({ taskId: 'c', ok: true, costUsd: 2, detail: '', ts }) // 無 engine＝歷史列
  expect(db.costForLocalDay(day, 0)).toBeCloseTo(10) // 名義總帳
  expect(db.billedCostForLocalDay(day, 0, ['codex-spark'])).toBeCloseTo(7) // 排除訂閱
  expect(db.billedCostForLocalDay(day, 0, [])).toBeCloseTo(10) // 清單空＝同名義
  const s = db.dayStats(day, 0, ['codex-spark'])
  expect(s.costUsd).toBeCloseTo(10)
  expect(s.billedUsd).toBeCloseTo(7)
  db.close()
})
