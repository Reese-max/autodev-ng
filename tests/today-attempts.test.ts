import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'
import Database from 'better-sqlite3'
import { RunDb } from '../src/db.js'
import { todayAttemptsSummary } from '../src/engines/today-attempts.js'

function dbPath(): string {
  return join(mkdtempSync(join(tmpdir(), 'adng-today-attempts-')), 'run.db')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('todayAttemptsSummary', () => {
  test('缺 run.db → fail-open 空摘要，不擋派工', () => {
    const dir = mkdtempSync(join(tmpdir(), 'adng-today-attempts-'))
    const result = todayAttemptsSummary(join(dir, 'missing.db'), {
      nowIso: '2026-07-21T12:00:00.000Z',
    })
    expect(result).toEqual({
      day: '2026-07-21',
      engines: [],
      totalAttempts: 0,
      totalOk: 0,
    })
  })

  test('空路徑或未設定 → 空摘要', () => {
    expect(todayAttemptsSummary('', { nowIso: '2026-07-21T01:00:00.000Z' })).toEqual({
      day: '2026-07-21',
      engines: [],
      totalAttempts: 0,
      totalOk: 0,
    })
  })

  test('壞檔 / 非 sqlite → fail-open 空摘要', () => {
    const f = dbPath()
    writeFileSync(f, 'not sqlite')
    expect(todayAttemptsSummary(f, { nowIso: '2026-07-21T12:00:00.000Z' })).toEqual({
      day: '2026-07-21',
      engines: [],
      totalAttempts: 0,
      totalOk: 0,
    })
  })

  test('缺 attempts 表 → 空摘要', () => {
    const f = dbPath()
    const db = new Database(f)
    db.exec('CREATE TABLE other(x INTEGER)')
    db.close()
    expect(todayAttemptsSummary(f, { nowIso: '2026-07-21T12:00:00.000Z' })).toEqual({
      day: '2026-07-21',
      engines: [],
      totalAttempts: 0,
      totalOk: 0,
    })
  })

  test('舊 schema 無 engine 欄 → 空摘要（fail-open）', () => {
    const f = dbPath()
    const db = new Database(f)
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
    expect(todayAttemptsSummary(f, { nowIso: '2026-07-21T12:00:00.000Z' })).toEqual({
      day: '2026-07-21',
      engines: [],
      totalAttempts: 0,
      totalOk: 0,
    })
  })

  test('UTC 日界：只計今日各引擎 attempts 與成功數，排除昨／明', () => {
    const f = dbPath()
    const db = new RunDb(f)
    // 昨日終點前（不含今日）
    db.record({
      taskId: 'y-end',
      ok: true,
      costUsd: 0,
      detail: '',
      engine: 'qwen',
      ts: '2026-07-20T23:59:59.999Z',
    })
    // 今日起點（含）
    db.record({
      taskId: 't0',
      ok: true,
      costUsd: 0,
      detail: '',
      engine: 'qwen',
      ts: '2026-07-21T00:00:00.000Z',
    })
    db.record({
      taskId: 't1',
      ok: false,
      costUsd: 0,
      detail: '',
      engine: 'qwen',
      ts: '2026-07-21T08:00:00.000Z',
    })
    db.record({
      taskId: 't2',
      ok: true,
      costUsd: 0,
      detail: '',
      engine: 'codex',
      ts: '2026-07-21T12:00:00.000Z',
    })
    // 今日終點（不含）＝明日 00:00Z
    db.record({
      taskId: 'm0',
      ok: true,
      costUsd: 0,
      detail: '',
      engine: 'codex',
      ts: '2026-07-22T00:00:00.000Z',
    })
    db.close()

    const result = todayAttemptsSummary(f, { nowIso: '2026-07-21T15:30:00.000Z' })
    expect(result.day).toBe('2026-07-21')
    expect(result.totalAttempts).toBe(3)
    expect(result.totalOk).toBe(2)
    expect(result.engines).toEqual([
      { engine: 'qwen', attempts: 2, ok: 1 },
      { engine: 'codex', attempts: 1, ok: 1 },
    ])
  })

  test('engine 空字串歸為 (未標)', () => {
    const f = dbPath()
    const db = new RunDb(f)
    db.record({
      taskId: 'a',
      ok: true,
      costUsd: 0,
      detail: '',
      engine: '',
      ts: '2026-07-21T03:00:00.000Z',
    })
    db.record({
      taskId: 'b',
      ok: false,
      costUsd: 0,
      detail: '',
      engine: '',
      ts: '2026-07-21T04:00:00.000Z',
    })
    db.close()
    const result = todayAttemptsSummary(f, { nowIso: '2026-07-21T12:00:00.000Z' })
    expect(result).toEqual({
      day: '2026-07-21',
      engines: [{ engine: '(未標)', attempts: 2, ok: 1 }],
      totalAttempts: 2,
      totalOk: 1,
    })
  })

  test('今日無資料 → 空 engines 但 day 正確（非 fail-open 語意，而是真的零）', () => {
    const f = dbPath()
    const db = new RunDb(f)
    db.record({
      taskId: 'old',
      ok: true,
      costUsd: 0,
      detail: '',
      engine: 'qwen',
      ts: '2026-07-20T12:00:00.000Z',
    })
    db.close()
    expect(todayAttemptsSummary(f, { nowIso: '2026-07-21T00:00:00.000Z' })).toEqual({
      day: '2026-07-21',
      engines: [],
      totalAttempts: 0,
      totalOk: 0,
    })
  })

  test('查詢超時 → fail-open 空摘要', () => {
    const f = dbPath()
    const db = new RunDb(f)
    db.record({
      taskId: 'a',
      ok: true,
      costUsd: 0,
      detail: '',
      engine: 'qwen',
      ts: '2026-07-21T01:00:00.000Z',
    })
    db.close()

    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1000) // started
      .mockReturnValueOnce(1100) // first timedOut check after open
    const result = todayAttemptsSummary(f, {
      nowIso: '2026-07-21T12:00:00.000Z',
      timeoutMs: 50,
    })
    expect(result).toEqual({
      day: '2026-07-21',
      engines: [],
      totalAttempts: 0,
      totalOk: 0,
    })
  })
})
