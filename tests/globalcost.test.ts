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
    engine TEXT NOT NULL DEFAULT ''
  )`)
  for (const r of rows) {
    db.prepare('INSERT INTO attempts (task_id, ts, ok, cost_usd, detail, engine) VALUES (?,?,?,?,?,?)')
      .run('t', r.ts, 1, r.cost, '', r.engine)
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

  test('壞鄰居跳過：壞 JSON／缺 run.db 都不影響加總、不 throw', () => {
    const a = writeCfg('a'); seedDb(join(root, 'data/a'), [{ ts: '2026-07-14T01:00:00Z', cost: 2, engine: 'claude' }])
    writeFileSync(join(root, 'configs', 'broken.json'), '{{{')
    writeCfg('nodb')  // 有 config 沒 db
    expect(globalBilledToday(a, '2026-07-14T03:00:00Z')).toBe(2)
  })

  test('整體故障回 0（fail-open）：configs 目錄不存在', () => {
    expect(globalBilledToday(join(root, 'nowhere', 'x.json'), '2026-07-14T03:00:00Z')).toBe(0)
  })
})
