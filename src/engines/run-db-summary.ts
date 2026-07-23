import Database from 'better-sqlite3'

export interface RunDbEngineSummary {
  engine: string
  attempts: number
  successRate: number
  topFailure: { detail: string; count: number } | null
}

/** 以 UTC 日界彙總今天與前六日；任何缺檔、查詢或資料格式問題皆回空摘要。 */
export function runDbSevenDaySummary(dbFile: string, nowIso = new Date().toISOString()): RunDbEngineSummary[] {
  let db: Database.Database | undefined
  try {
    const nowMs = Date.parse(nowIso)
    if (!Number.isFinite(nowMs)) return []
    const end = new Date(nowMs)
    end.setUTCHours(24, 0, 0, 0)
    const endIso = end.toISOString()
    const startIso = new Date(end.getTime() - 7 * 24 * 3600_000).toISOString()

    db = new Database(dbFile, { readonly: true, fileMustExist: true, timeout: 50 })
    const rows = db.prepare(`
      WITH scoped AS (
        SELECT COALESCE(NULLIF(engine, ''), '(未標)') AS engine,
               ok,
               trim(detail) AS detail,
               CASE WHEN typeof(ts) = 'text'
                          AND typeof(ok) = 'integer' AND ok IN (0, 1)
                          AND typeof(detail) = 'text'
                          AND (engine IS NULL OR typeof(engine) = 'text')
                    THEN 1 ELSE 0 END AS valid
          FROM attempts
         WHERE ts >= ? AND ts < ?
      ), engine_stats AS (
        SELECT engine,
               COUNT(*) AS attempts,
               SUM(CASE WHEN ok = 1 THEN 1 ELSE 0 END) AS successes,
               MIN(valid) AS valid
          FROM scoped
         GROUP BY engine
      ), failure_counts AS (
        SELECT engine, detail, COUNT(*) AS failure_count
          FROM scoped
         WHERE ok = 0 AND detail != ''
         GROUP BY engine, detail
      ), ranked_failures AS (
        SELECT engine, detail, failure_count,
               ROW_NUMBER() OVER (PARTITION BY engine ORDER BY failure_count DESC, detail ASC) AS rank
          FROM failure_counts
      )
      SELECT stats.engine, stats.attempts, stats.successes, stats.valid,
             failures.detail AS failureDetail, failures.failure_count AS failureCount
        FROM engine_stats stats
        LEFT JOIN ranked_failures failures ON failures.engine = stats.engine AND failures.rank = 1
       ORDER BY stats.attempts DESC, stats.engine ASC
    `).all(startIso, endIso) as Array<{
      engine: unknown
      attempts: unknown
      successes: unknown
      valid: unknown
      failureDetail: unknown
      failureCount: unknown
    }>

    if (rows.some(row =>
      typeof row.engine !== 'string'
      || !Number.isSafeInteger(row.attempts) || (row.attempts as number) <= 0
      || !Number.isSafeInteger(row.successes) || (row.successes as number) < 0 || (row.successes as number) > (row.attempts as number)
      || row.valid !== 1
      || (row.failureDetail !== null && typeof row.failureDetail !== 'string')
      || (row.failureCount !== null && (!Number.isSafeInteger(row.failureCount) || (row.failureCount as number) <= 0))
    )) return []

    return rows.map(row => ({
      engine: row.engine as string,
      attempts: row.attempts as number,
      successRate: (row.successes as number) / (row.attempts as number),
      topFailure: row.failureDetail === null
        ? null
        : { detail: row.failureDetail as string, count: row.failureCount as number },
    }))
  } catch {
    return []
  } finally {
    try { db?.close() } catch { /* fail-open */ }
  }
}
