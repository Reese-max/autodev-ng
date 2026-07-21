import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import Database from 'better-sqlite3'
import { RunDb } from '../src/db.js'
import { accountEngineQuotaByUtcDay } from '../src/engines/engine-quota-accounting.js'

const NOW = '2026-07-21T12:00:00.000Z'

function dbPath(): string {
  return join(mkdtempSync(join(tmpdir(), 'adng-eqa-')), 'run.db')
}

describe('accountEngineQuotaByUtcDay', () => {
  test('跨 UTC 日界：只計今日半開區間，排除昨／明日', () => {
    const f = dbPath()
    const db = new RunDb(f)
    for (const [taskId, engine, ok, ts] of [
      // 昨日終點前（不含）
      ['y-end', 'free', true, '2026-07-20T23:59:59.999Z'],
      // 今日起點（含）
      ['t0', 'free', true, '2026-07-21T00:00:00.000Z'],
      ['t1', 'free', false, '2026-07-21T08:00:00.000Z'],
      ['t2', 'paid', true, '2026-07-21T23:59:59.999Z'],
      // 今日終點（不含）＝明日 00:00Z
      ['m0', 'paid', true, '2026-07-22T00:00:00.000Z'],
    ] as const) {
      db.record({ taskId, engine, ok, ts, costUsd: 0, detail: '' })
    }
    db.close()

    expect(accountEngineQuotaByUtcDay(f, { nowIso: NOW })).toEqual({
      free: { n: 2, ok: 1 },
      paid: { n: 1, ok: 1 },
    })
  })

  test('成功判定：ok 只累加成功列；失敗列計入 n 但不計 ok', () => {
    const f = dbPath()
    const db = new RunDb(f)
    db.record({
      taskId: 'ok1',
      engine: 'qwen',
      ok: true,
      ts: '2026-07-21T01:00:00.000Z',
      costUsd: 0,
      detail: '',
    })
    db.record({
      taskId: 'fail1',
      engine: 'qwen',
      ok: false,
      ts: '2026-07-21T02:00:00.000Z',
      costUsd: 0,
      detail: '',
    })
    db.record({
      taskId: 'ok2',
      engine: 'qwen',
      ok: true,
      ts: '2026-07-21T03:00:00.000Z',
      costUsd: 0,
      detail: '',
    })
    db.record({
      taskId: 'fail2',
      engine: 'codex',
      ok: false,
      ts: '2026-07-21T04:00:00.000Z',
      costUsd: 0,
      detail: '',
    })
    db.close()

    const stats = accountEngineQuotaByUtcDay(f, { nowIso: NOW })
    expect(stats).toEqual({
      qwen: { n: 3, ok: 2 },
      codex: { n: 1, ok: 0 },
    })
    // 明確守門：成功數不可超過 attempts
    for (const cell of Object.values(stats)) {
      expect(cell.ok).toBeLessThanOrEqual(cell.n)
    }
  })

  test('資料庫讀取失敗 → fail-open 回空統計 {}', () => {
    const dir = mkdtempSync(join(tmpdir(), 'adng-eqa-fail-'))
    // 缺檔
    expect(
      accountEngineQuotaByUtcDay(join(dir, 'missing.db'), { nowIso: NOW }),
    ).toEqual({})
    // 空路徑
    expect(accountEngineQuotaByUtcDay('', { nowIso: NOW })).toEqual({})
    // 壞檔
    const bad = join(dir, 'run.db')
    writeFileSync(bad, 'not sqlite')
    expect(accountEngineQuotaByUtcDay(bad, { nowIso: NOW })).toEqual({})
    // 舊 schema 無 engine 欄
    const old = join(dir, 'old.db')
    const db = new Database(old)
    db.exec(`CREATE TABLE attempts(
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      ts TEXT NOT NULL,
      ok INTEGER NOT NULL,
      cost_usd REAL NOT NULL,
      detail TEXT NOT NULL
    )`)
    db.prepare(
      'INSERT INTO attempts(task_id, ts, ok, cost_usd, detail) VALUES (?,?,?,?,?)',
    ).run('t1', '2026-07-21T01:00:00.000Z', 1, 0, '')
    db.close()
    expect(accountEngineQuotaByUtcDay(old, { nowIso: NOW })).toEqual({})
  })
})
