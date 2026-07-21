/**
 * run.db 今日 attempts 聚合：以 UTC 日界彙總各引擎 attempts 次數與成功數。
 *
 * 契約：
 * - 日界固定 UTC（offsetHours=0），半開區間 [day 00:00Z, next 00:00Z)
 * - 缺檔 / 舊 schema / 查詢失敗 / 超時 → fail-open 回空摘要，不阻擋派工
 * - 不寫檔、不改派工狀態；呼叫端可選用結果做診斷或限流
 */
import { existsSync } from 'node:fs'
import Database from 'better-sqlite3'
import { localDay, localDayUtcRange } from '../db.js'

export interface EngineTodayAttempts {
  engine: string
  attempts: number
  ok: number
}

export interface TodayAttemptsSummary {
  /** UTC 曆日 YYYY-MM-DD */
  day: string
  engines: EngineTodayAttempts[]
  totalAttempts: number
  totalOk: number
}

export interface TodayAttemptsOptions {
  /** 預設 new Date().toISOString()；測試可注入 */
  nowIso?: string
  /** 同步查詢逾時毫秒；預設 50，超時 fail-open 空摘要 */
  timeoutMs?: number
}

const UTC_OFFSET = 0

function empty(day: string): TodayAttemptsSummary {
  return { day, engines: [], totalAttempts: 0, totalOk: 0 }
}

function timedOut(startMs: number, timeoutMs: number): boolean {
  return Date.now() - startMs > timeoutMs
}

/** 以 UTC 日界彙總「今日」各引擎 attempts／成功數；讀不到 run.db 時一律空摘要。 */
export function todayAttemptsSummary(
  dbFile: string,
  opts: TodayAttemptsOptions = {},
): TodayAttemptsSummary {
  const nowIso = opts.nowIso ?? new Date().toISOString()
  const timeoutMs = opts.timeoutMs ?? 50
  const day = localDay(nowIso, UTC_OFFSET)

  if (!dbFile || !existsSync(dbFile)) return empty(day)

  const started = Date.now()
  let db: Database.Database | undefined
  try {
    db = new Database(dbFile, { readonly: true, fileMustExist: true, timeout: timeoutMs })
    if (timedOut(started, timeoutMs)) return empty(day)

    const table = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='attempts'")
      .get() as { name: string } | undefined
    if (!table) return empty(day)

    const cols = db.prepare('PRAGMA table_info(attempts)').all() as { name: string }[]
    if (!cols.some(c => c.name === 'engine')) return empty(day)
    if (timedOut(started, timeoutMs)) return empty(day)

    const { startIso, endIso } = localDayUtcRange(day, UTC_OFFSET)
    const rows = db
      .prepare(
        "SELECT COALESCE(NULLIF(engine,''),'(未標)') AS engine, COUNT(*) AS n, COALESCE(SUM(ok),0) AS ok FROM attempts WHERE ts >= ? AND ts < ? GROUP BY 1 ORDER BY n DESC, engine ASC",
      )
      .all(startIso, endIso) as { engine: string; n: number; ok: number }[]

    if (timedOut(started, timeoutMs)) return empty(day)

    const engines: EngineTodayAttempts[] = rows.map(row => ({
      engine: row.engine,
      attempts: row.n,
      ok: row.ok,
    }))
    const totalAttempts = engines.reduce((sum, e) => sum + e.attempts, 0)
    const totalOk = engines.reduce((sum, e) => sum + e.ok, 0)
    return { day, engines, totalAttempts, totalOk }
  } catch {
    return empty(day)
  } finally {
    try {
      db?.close()
    } catch {
      /* ignore close failure */
    }
  }
}
