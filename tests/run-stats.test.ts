import { rmSync, writeFileSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { RunDb } from '../src/db.js'
import { clearRunStatsCache, recentRunStats, REUSE_CURRENT } from '../src/engines/run-stats.js'

function dbPath(): string {
  return join(mkdtempSync(join(tmpdir(), 'adng-run-stats-')), 'run.db')
}

function seed(records: Array<{ taskId: string; ok: boolean; engine: string; ts: string }>): string {
  const f = dbPath()
  const db = new RunDb(f)
  for (const r of records) {
    db.record({ taskId: r.taskId, ok: r.ok, costUsd: 0.1, detail: '', engine: r.engine, ts: r.ts })
  }
  db.close()
  return f
}

function boundaryStats(f: string, nowIso: string, offsetHours: number) {
  const nowMs = Date.parse(nowIso)
  return recentRunStats(f, {
    nowIso, nowMs: () => nowMs, offsetHours, windowDays: 3, timeoutMs: 5_000,
  })
}

afterEach(() => {
  clearRunStatsCache()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

test('缺 run.db 時直接回沿用現狀', () => {
  const result = recentRunStats(join(mkdtempSync(join(tmpdir(), 'adng-run-stats-')), 'missing.db'), {
    nowIso: '2026-07-19T12:00:00.000Z',
  })
  expect(result).toEqual({ kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'missing-run-db' })
})

test('聚合近 3 日樣本數、成功率，排除窗口外資料', () => {
  const f = dbPath()
  const db = new RunDb(f)
  db.record({ taskId: 'a', ok: true, costUsd: 1, detail: '', engine: 'qwen', ts: '2026-07-19T01:00:00.000Z' })
  db.record({ taskId: 'b', ok: false, costUsd: 1, detail: '', engine: 'qwen', ts: '2026-07-18T01:00:00.000Z' })
  db.record({ taskId: 'c', ok: true, costUsd: 1, detail: '', engine: 'codex', ts: '2026-07-17T01:00:00.000Z' })
  db.record({ taskId: 'd', ok: true, costUsd: 1, detail: '', engine: 'qwen', ts: '2026-07-16T23:59:59.999Z' })
  db.close()

  const result = recentRunStats(f, { nowIso: '2026-07-19T12:00:00.000Z', offsetHours: 0 })
  expect(result.kind).toBe('stats')
  if (result.kind !== 'stats') throw new Error('expected stats')
  expect(result.days).toEqual(['2026-07-19', '2026-07-18', '2026-07-17'])
  expect(result.sampleCount).toBe(3)
  expect(result.engines).toEqual([
    { engine: 'qwen', sampleCount: 2, ok: 1, fail: 1, successRate: 0.5 },
    { engine: 'codex', sampleCount: 1, ok: 1, fail: 0, successRate: 1 },
  ])
})

test('樣本數不足時不輸出排序依據，直接沿用現狀', () => {
  const f = dbPath()
  const db = new RunDb(f)
  db.record({ taskId: 'a', ok: true, costUsd: 1, detail: '', engine: 'qwen', ts: '2026-07-19T01:00:00.000Z' })
  db.close()

  const result = recentRunStats(f, { nowIso: '2026-07-19T12:00:00.000Z', minSamples: 2 })
  expect(result).toEqual({ kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'insufficient-samples' })
})

test('快取命中時不重新讀檔，避免同步查詢拖住主流程', () => {
  // 固定 nowMs + 寬逾時：全套高負載下避免 50ms fail-open 讓 first/second 變成不同 reason 的 reuse-current
  const nowIso = '2026-07-19T12:00:00.000Z'
  const nowMs = Date.parse(nowIso)
  const f = dbPath()
  const db = new RunDb(f)
  db.record({ taskId: 'a', ok: true, costUsd: 1, detail: '', engine: 'qwen', ts: '2026-07-19T01:00:00.000Z' })
  db.close()

  clearRunStatsCache()
  const first = recentRunStats(f, {
    nowIso,
    nowMs: () => nowMs,
    timeoutMs: 5_000,
    cacheTtlMs: 60_000,
  })
  expect(first.kind).toBe('stats')
  rmSync(f)
  const second = recentRunStats(f, {
    nowIso,
    nowMs: () => nowMs,
    timeoutMs: 5_000,
    cacheTtlMs: 60_000,
  })
  expect(second).toEqual(first)
})

test('查詢超時守門：有舊快取就回舊值，沒有快取才沿用現狀', () => {
  const nowMs = Date.parse('2026-07-19T12:00:00.000Z')
  vi.useFakeTimers()
  vi.setSystemTime(nowMs)
  const f = dbPath()
  const db = new RunDb(f)
  db.record({ taskId: 'a', ok: true, costUsd: 1, detail: '', engine: 'qwen', ts: '2026-07-19T01:00:00.000Z' })
  db.close()

  const cached = recentRunStats(f, { nowIso: '2026-07-19T12:00:00.000Z' })
  vi.advanceTimersByTime(1)
  let reads = 0
  const timeoutClock = vi.fn(() => {
    if (++reads === 3) vi.advanceTimersByTime(51)
    return Date.now()
  })
  const timedOut = recentRunStats(f, {
    nowIso: '2026-07-19T12:00:00.000Z',
    nowMs: timeoutClock,
    timeoutMs: 50,
    cacheTtlMs: 0,
  })
  expect(timedOut).toEqual(cached)
  expect(timeoutClock).toHaveBeenCalledTimes(3)
  expect(Date.now()).toBe(nowMs + 52)

  clearRunStatsCache()
  vi.setSystemTime(nowMs)
  reads = 0
  const noCache = recentRunStats(f, {
    nowIso: '2026-07-19T12:00:00.000Z',
    nowMs: timeoutClock,
    timeoutMs: 50,
    cacheTtlMs: 0,
  })
  expect(noCache).toEqual({ kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'timeout' })
  expect(timeoutClock).toHaveBeenCalledTimes(6)
  expect(Date.now()).toBe(nowMs + 51)
})

test('舊 schema 或壞檔查詢失敗時沿用現狀', () => {
  const f = dbPath()
  writeFileSync(f, 'not sqlite')
  const result = recentRunStats(f, { nowIso: '2026-07-19T12:00:00.000Z' })
  expect(result).toEqual({ kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'query-failed' })
})

/**
 * 近 3 日時間窗邊界：半開區間 [最舊日本地 00:00, 今日本地次日 00:00)。
 * UTC offset=0 時恰為 72 小時；offset≠0 時仍為 3 個本地曆日（UTC 起迄平移）。
 * 覆蓋：跨日、缺中間日、剛好落在 72h/日界線上的樣本數與成功率。
 */
describe('run.db 近三日統計時間窗邊界', () => {
  test('跨日：offset+8 時 UTC 午夜附近依本地日界納入／排除', () => {
    // now 2026-07-19T12:00Z +8h → 本地 07-19 20:00 → 近 3 本地日 19/18/17
    // 窗：[2026-07-16T16:00:00.000Z, 2026-07-19T16:00:00.000Z)
    const f = seed([
      // 窗外：本地 07-16 最後一毫秒
      { taskId: 'before', ok: true, engine: 'qwen', ts: '2026-07-16T15:59:59.999Z' },
      // 窗起點（含）：本地 07-17 00:00
      { taskId: 'start', ok: false, engine: 'qwen', ts: '2026-07-16T16:00:00.000Z' },
      // 本地日跨日：UTC 16:00 才進本地 07-19；15:59 仍屬本地 07-18
      { taskId: 'local-18-end', ok: true, engine: 'codex', ts: '2026-07-18T15:59:59.999Z' },
      { taskId: 'local-19-start', ok: true, engine: 'codex', ts: '2026-07-18T16:00:00.000Z' },
      // 窗終點（不含）：本地 07-20 00:00
      { taskId: 'end', ok: true, engine: 'qwen', ts: '2026-07-19T16:00:00.000Z' },
    ])

    const result = boundaryStats(f, '2026-07-19T12:00:00.000Z', 8)
    expect(result.kind).toBe('stats')
    if (result.kind !== 'stats') throw new Error('expected stats')
    expect(result.days).toEqual(['2026-07-19', '2026-07-18', '2026-07-17'])
    // before/end 排除 → 僅 start + local-18-end + local-19-start
    expect(result.sampleCount).toBe(3)
    expect(result.engines).toEqual([
      { engine: 'codex', sampleCount: 2, ok: 2, fail: 0, successRate: 1 },
      { engine: 'qwen', sampleCount: 1, ok: 0, fail: 1, successRate: 0 },
    ])
  })

  test('缺少部分日期：中間日無資料仍只計實際樣本，成功率不因缺日被稀釋', () => {
    // 窗 20/19/18；只在 20 與 18 有資料，19 全空
    const f = seed([
      { taskId: 'd20-ok', ok: true, engine: 'qwen', ts: '2026-07-20T08:00:00.000Z' },
      { taskId: 'd20-fail', ok: false, engine: 'qwen', ts: '2026-07-20T09:00:00.000Z' },
      { taskId: 'd18-ok', ok: true, engine: 'qwen', ts: '2026-07-18T10:00:00.000Z' },
      { taskId: 'd18-fail', ok: false, engine: 'codex', ts: '2026-07-18T11:00:00.000Z' },
      // 窗外（17）不應計入
      { taskId: 'd17-out', ok: true, engine: 'qwen', ts: '2026-07-17T23:00:00.000Z' },
    ])

    const result = boundaryStats(f, '2026-07-20T12:00:00.000Z', 0)
    expect(result.kind).toBe('stats')
    if (result.kind !== 'stats') throw new Error('expected stats')
    expect(result.days).toEqual(['2026-07-20', '2026-07-19', '2026-07-18'])
    expect(result.sampleCount).toBe(4)
    // qwen: 2 ok + 1 fail = 3；成功率 2/3，不得被「缺 07-19」當成額外 fail
    expect(result.engines).toEqual([
      { engine: 'qwen', sampleCount: 3, ok: 2, fail: 1, successRate: 2 / 3 },
      { engine: 'codex', sampleCount: 1, ok: 0, fail: 1, successRate: 0 },
    ])
  })

  test('72 小時邊界：半開區間 [start, end) 剛好落點不誤算樣本與成功率', () => {
    // offset=0、近 3 日 = 恰好 72h：[2026-07-18T00:00:00.000Z, 2026-07-21T00:00:00.000Z)
    const f = seed([
      { taskId: 't-1ms', ok: true, engine: 'qwen', ts: '2026-07-17T23:59:59.999Z' }, // 窗外
      { taskId: 't0', ok: false, engine: 'qwen', ts: '2026-07-18T00:00:00.000Z' }, // 起點含
      { taskId: 'mid-ok', ok: true, engine: 'qwen', ts: '2026-07-19T12:00:00.000Z' },
      { taskId: 'mid-fail', ok: false, engine: 'codex', ts: '2026-07-20T00:00:00.000Z' },
      { taskId: 't72-1ms', ok: true, engine: 'codex', ts: '2026-07-20T23:59:59.999Z' }, // 終點前含
      { taskId: 't72', ok: true, engine: 'qwen', ts: '2026-07-21T00:00:00.000Z' }, // 終點不含
    ])

    const result = boundaryStats(f, '2026-07-20T12:00:00.000Z', 0)
    expect(result.kind).toBe('stats')
    if (result.kind !== 'stats') throw new Error('expected stats')
    expect(result.days).toEqual(['2026-07-20', '2026-07-19', '2026-07-18'])
    // 納入：t0, mid-ok, mid-fail, t72-1ms（4）；排除 t-1ms 與 t72
    expect(result.sampleCount).toBe(4)
    expect(result.engines).toEqual([
      { engine: 'codex', sampleCount: 2, ok: 1, fail: 1, successRate: 0.5 },
      { engine: 'qwen', sampleCount: 2, ok: 1, fail: 1, successRate: 0.5 },
    ])
  })

  test('72 小時邊界 + 僅邊界點：起點成功、終點排除 → 樣本 1、成功率 100%', () => {
    const f = seed([
      { taskId: 'at-start', ok: true, engine: 'qwen', ts: '2026-07-18T00:00:00.000Z' },
      { taskId: 'at-end', ok: false, engine: 'qwen', ts: '2026-07-21T00:00:00.000Z' },
    ])
    const result = boundaryStats(f, '2026-07-20T12:00:00.000Z', 0)
    expect(result.kind).toBe('stats')
    if (result.kind !== 'stats') throw new Error('expected stats')
    expect(result.sampleCount).toBe(1)
    expect(result.engines).toEqual([
      { engine: 'qwen', sampleCount: 1, ok: 1, fail: 0, successRate: 1 },
    ])
  })

  test('跨日缺中間日且邊界同時出現：聚合不把窗外 fail 算進成功率', () => {
    // offset+8；窗 [07-16T16:00Z, 07-19T16:00Z)；本地 18 無資料
    const f = seed([
      { taskId: 'out-fail', ok: false, engine: 'qwen', ts: '2026-07-16T15:59:59.999Z' },
      { taskId: 'in-start-ok', ok: true, engine: 'qwen', ts: '2026-07-16T16:00:00.000Z' },
      { taskId: 'in-day19-fail', ok: false, engine: 'qwen', ts: '2026-07-19T15:00:00.000Z' },
      { taskId: 'out-end-ok', ok: true, engine: 'qwen', ts: '2026-07-19T16:00:00.000Z' },
    ])
    const result = boundaryStats(f, '2026-07-19T12:00:00.000Z', 8)
    expect(result.kind).toBe('stats')
    if (result.kind !== 'stats') throw new Error('expected stats')
    expect(result.days).toEqual(['2026-07-19', '2026-07-18', '2026-07-17'])
    // 僅 in-start-ok + in-day19-fail；窗外 fail/ok 不影響
    expect(result.sampleCount).toBe(2)
    expect(result.engines).toEqual([
      { engine: 'qwen', sampleCount: 2, ok: 1, fail: 1, successRate: 0.5 },
    ])
  })
})
