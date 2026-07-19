import { rmSync, writeFileSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { RunDb } from '../src/db.js'
import { clearRunStatsCache, recentRunStats, REUSE_CURRENT } from '../src/engines/run-stats.js'

function dbPath(): string {
  return join(mkdtempSync(join(tmpdir(), 'adng-run-stats-')), 'run.db')
}

afterEach(() => {
  clearRunStatsCache()
  vi.restoreAllMocks()
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
  const f = dbPath()
  const db = new RunDb(f)
  db.record({ taskId: 'a', ok: true, costUsd: 1, detail: '', engine: 'qwen', ts: '2026-07-19T01:00:00.000Z' })
  db.close()

  const first = recentRunStats(f, { nowIso: '2026-07-19T12:00:00.000Z', cacheTtlMs: 60_000 })
  rmSync(f)
  const second = recentRunStats(f, { nowIso: '2026-07-19T12:00:00.000Z', cacheTtlMs: 60_000 })
  expect(second).toEqual(first)
})

test('查詢超時守門：有舊快取就回舊值，沒有快取才沿用現狀', () => {
  const f = dbPath()
  const db = new RunDb(f)
  db.record({ taskId: 'a', ok: true, costUsd: 1, detail: '', engine: 'qwen', ts: '2026-07-19T01:00:00.000Z' })
  db.close()

  const cached = recentRunStats(f, { nowIso: '2026-07-19T12:00:00.000Z' })
  vi.spyOn(Date, 'now')
    .mockReturnValueOnce(1000)
    .mockReturnValueOnce(1000)
    .mockReturnValueOnce(1100)
  const timedOut = recentRunStats(f, { nowIso: '2026-07-19T12:00:00.000Z', timeoutMs: 50, cacheTtlMs: 0 })
  expect(timedOut).toEqual(cached)

  clearRunStatsCache()
  vi.restoreAllMocks()
  vi.spyOn(Date, 'now')
    .mockReturnValueOnce(2000)
    .mockReturnValueOnce(2000)
    .mockReturnValueOnce(2100)
  const noCache = recentRunStats(f, { nowIso: '2026-07-19T12:00:00.000Z', timeoutMs: 50, cacheTtlMs: 0 })
  expect(noCache).toEqual({ kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'timeout' })
})

test('舊 schema 或壞檔查詢失敗時沿用現狀', () => {
  const f = dbPath()
  writeFileSync(f, 'not sqlite')
  const result = recentRunStats(f, { nowIso: '2026-07-19T12:00:00.000Z' })
  expect(result).toEqual({ kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'query-failed' })
})
