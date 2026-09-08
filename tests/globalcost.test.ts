import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { globalBilledToday } from '../src/globalcost.js'

// 建一個最小 attempts 表（欄位逐字抄 db.ts RunDb 建構子的 CREATE TABLE + engine 欄 migration）
function seedDb(dataDir: string, rows: { ts: string; cost: number; engine: string }[]): void {
  mkdirSync(dataDir, { recursive: true })
  const db = new Database(join(dataDir, 'run.db'))
  db.exec(`CREATE TABLE attempts(
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    ts TEXT NOT NULL,
    ok INTEGER NOT NULL,
    cost_usd REAL NOT NULL,
    detail TEXT NOT NULL,
    engine TEXT NOT NULL DEFAULT '', accounting_json TEXT
  )`)
  for (const r of rows) {
    db.prepare('INSERT INTO attempts (task_id, ts, ok, cost_usd, detail, engine, accounting_json) VALUES (?,?,?,?,?,?,?)')
      .run('t', r.ts, 1, r.cost, '', r.engine, JSON.stringify({version:1,costSource:'provider-reported'}))
  }
  db.close()
}

describe('globalBilledToday', () => {
  let root: string
  beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'adng-global-')); mkdirSync(join(root, 'configs')) })
  afterEach(() => { rmSync(root, { recursive: true, force: true }) })

  function writeCfg(name: string, extra: Record<string, unknown> = {}): string {
    const p = join(root, 'configs', `${name}.json`)
    writeFileSync(p, JSON.stringify({ dataDir: `../data/${name}`, timezoneOffsetHours: 8, ...extra }))
    return p
  }

  test('兩專案真金加總；訂閱引擎排除；昨日不計', () => {
    const a = writeCfg('a'); writeCfg('b', { engines: { spark: { adapter: 'codex', subscription: true } } })
    seedDb(join(root, 'data/a'), [
      { ts: '2026-07-14T01:00:00Z', cost: 3, engine: 'claude' },
      { ts: '2026-07-12T01:00:00Z', cost: 99, engine: 'claude' }])   // 昨日（+8 窗外）不計
    seedDb(join(root, 'data/b'), [
      { ts: '2026-07-14T01:00:00Z', cost: 5, engine: 'claude' },
      { ts: '2026-07-14T02:00:00Z', cost: 50, engine: 'spark' }])    // 訂閱不計
    expect(globalBilledToday(a, '2026-07-14T03:00:00Z')).toBe(8)
  })

  test('壞 JSON／缺 run.db 不得低估放行', () => {
    const a = writeCfg('a'); seedDb(join(root, 'data/a'), [{ ts: '2026-07-14T01:00:00Z', cost: 2, engine: 'claude' }])
    writeFileSync(join(root, 'configs', 'broken.json'), '{{{')
    writeCfg('nodb')  // 有 config 沒 db
    expect(() => globalBilledToday(a, '2026-07-14T03:00:00Z')).toThrow('incomplete')
  })

  test('configs 目錄不存在時回報不完整', () => {
    expect(() => globalBilledToday(join(root, 'nowhere', 'x.json'), '2026-07-14T03:00:00Z')).toThrow('incomplete')
  })

  test('engine 空欄（歷史列）在非空訂閱清單下仍計入真金（fail-safe）', () => {
    // 訂閱清單非空時走 `engine NOT IN (...)` 分支；engine='' 不屬訂閱清單 → NOT IN 為 TRUE → 計入。
    // 靠 attempts.engine 的 NOT NULL DEFAULT '' 落地此不變量（庫內不存在 NULL engine）。
    const a = writeCfg('a', { engines: { spark: { adapter: 'codex', subscription: true } } })
    seedDb(join(root, 'data/a'), [
      { ts: '2026-07-14T01:00:00Z', cost: 4, engine: '' },       // 歷史空欄 → 計入
      { ts: '2026-07-14T02:00:00Z', cost: 6, engine: 'claude' }, // 一般引擎 → 計入
      { ts: '2026-07-14T03:00:00Z', cost: 90, engine: 'spark' }]) // 訂閱 → 排除
    expect(globalBilledToday(a, '2026-07-14T05:00:00Z')).toBe(10)
  })

  test('config 缺 timezoneOffsetHours 時鏡像 Zod default(8)，不可低估為 0', () => {
    // 不寫 timezoneOffsetHours 欄位（模擬 prompt-autoresearch.json 實況）。
    const p = join(root, 'configs', 'notz.json')
    writeFileSync(p, JSON.stringify({ dataDir: '../data/notz' }))
    // ts 在 +8 日窗內（2026-07-14 01:30 本地、屬今日）、但在 UTC 日窗外（2026-07-13，屬昨日）。
    // 若 offset 誤取 0，會用 UTC 日窗把這筆算成「昨日」而漏計。
    seedDb(join(root, 'data/notz'), [{ ts: '2026-07-13T17:30:00Z', cost: 7, engine: 'claude' }])
    expect(globalBilledToday(p, '2026-07-14T03:00:00Z')).toBe(7)
  })
})
