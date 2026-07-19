import { existsSync } from 'node:fs'
import Database from 'better-sqlite3'
import { localDay, localDayUtcRange } from '../db.js'

export const REUSE_CURRENT = '沿用現狀' as const

export interface EngineRunStats {
  engine: string
  sampleCount: number
  ok: number
  fail: number
  successRate: number
}

export interface RecentRunStats {
  kind: 'stats'
  days: string[]
  engines: EngineRunStats[]
  sampleCount: number
}

export interface ReuseCurrentRunStats {
  kind: 'reuse-current'
  decision: typeof REUSE_CURRENT
  reason: string
}

export type RunStatsResult = RecentRunStats | ReuseCurrentRunStats

export interface RunStatsOptions {
  nowIso?: string
  offsetHours?: number
  windowDays?: number
  timeoutMs?: number
  cacheTtlMs?: number
  minSamples?: number
}

interface CacheEntry {
  atMs: number
  result: RunStatsResult
}

const cache = new Map<string, CacheEntry>()

function reuse(reason: string): ReuseCurrentRunStats {
  return { kind: 'reuse-current', decision: REUSE_CURRENT, reason }
}

function dayList(nowIso: string, offsetHours: number, windowDays: number): string[] {
  const today = localDay(nowIso, offsetHours)
  const base = Date.parse(`${today}T00:00:00.000Z`)
  return Array.from({ length: windowDays }, (_v, i) => new Date(base - i * 24 * 3600_000).toISOString().slice(0, 10))
}

function cacheKey(dbFile: string, nowIso: string, offsetHours: number, windowDays: number, minSamples: number): string {
  return [dbFile, localDay(nowIso, offsetHours), offsetHours, windowDays, minSamples].join('|')
}

function freshCached(key: string, nowMs: number, ttlMs: number): RunStatsResult | undefined {
  const hit = cache.get(key)
  if (!hit) return undefined
  return nowMs - hit.atMs <= ttlMs ? hit.result : undefined
}

function timedOut(startMs: number, timeoutMs: number): boolean {
  return Date.now() - startMs > timeoutMs
}

export function clearRunStatsCache(): void {
  cache.clear()
}

/** 近 N 日 run.db 戰績摘要。任何缺檔、舊 schema、空樣本或超時都 fail-open 回「沿用現狀」。 */
export function recentRunStats(dbFile: string, opts: RunStatsOptions = {}): RunStatsResult {
  const nowIso = opts.nowIso ?? new Date().toISOString()
  const offsetHours = opts.offsetHours ?? 0
  const windowDays = opts.windowDays ?? 3
  const timeoutMs = opts.timeoutMs ?? 50
  const cacheTtlMs = opts.cacheTtlMs ?? 60_000
  const minSamples = opts.minSamples ?? 1
  const key = cacheKey(dbFile, nowIso, offsetHours, windowDays, minSamples)
  const nowMs = Date.now()
  const cached = freshCached(key, nowMs, cacheTtlMs)
  if (cached) return cached
  if (windowDays <= 0) return reuse('bad-window')
  if (!existsSync(dbFile)) return reuse('missing-run-db')

  const started = Date.now()
  let db: Database.Database | undefined
  try {
    db = new Database(dbFile, { readonly: true, fileMustExist: true, timeout: timeoutMs })
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='attempts'").get() as { name: string } | undefined
    if (!table) return reuse('missing-attempts')
    const cols = db.prepare('PRAGMA table_info(attempts)').all() as { name: string }[]
    if (!cols.some(c => c.name === 'engine')) return reuse('missing-engine-column')
    if (timedOut(started, timeoutMs)) return freshCached(key, nowMs, Number.POSITIVE_INFINITY) ?? reuse('timeout')

    const days = dayList(nowIso, offsetHours, windowDays)
    const ranges = days.map(day => localDayUtcRange(day, offsetHours))
    const startIso = ranges[ranges.length - 1]!.startIso
    const endIso = ranges[0]!.endIso
    const rows = db.prepare(
      "SELECT COALESCE(NULLIF(engine,''),'(未標)') AS engine, COUNT(*) AS n, COALESCE(SUM(ok),0) AS ok FROM attempts WHERE ts >= ? AND ts < ? GROUP BY 1 ORDER BY n DESC, engine ASC"
    ).all(startIso, endIso) as { engine: string; n: number; ok: number }[]
    if (timedOut(started, timeoutMs)) return freshCached(key, nowMs, Number.POSITIVE_INFINITY) ?? reuse('timeout')

    const sampleCount = rows.reduce((sum, row) => sum + row.n, 0)
    if (sampleCount < minSamples) return reuse('insufficient-samples')
    const result: RecentRunStats = {
      kind: 'stats',
      days,
      sampleCount,
      engines: rows.map(row => ({
        engine: row.engine,
        sampleCount: row.n,
        ok: row.ok,
        fail: row.n - row.ok,
        successRate: row.n === 0 ? 0 : row.ok / row.n,
      })),
    }
    cache.set(key, { atMs: nowMs, result })
    return result
  } catch {
    return freshCached(key, nowMs, Number.POSITIVE_INFINITY) ?? reuse('query-failed')
  } finally {
    try { db?.close() } catch { /* ignore close failure */ }
  }
}
