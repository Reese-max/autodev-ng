import { existsSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { localDayUtcRange } from '../db.js'

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_DAYS = 7
const MIN_ATTEMPTS = 5
const NO_COMMIT_RATE_THRESHOLD = 0.3

interface NoCommitCapAdvice {
  engine: string
  attempts: number
  noCommit: number
}

/** 近七個完整本地日的高 no-commit 引擎；缺檔、舊 schema 或查詢失敗皆省略。 */
function readNoCommitCapAdvice(dbFile: string, isoDayUtc: string, offsetHours: number): NoCommitCapAdvice[] {
  if (!existsSync(dbFile)) return []
  let db: Database.Database | undefined
  try {
    const endIso = localDayUtcRange(isoDayUtc, offsetHours).endIso
    const startIso = new Date(Date.parse(endIso) - WINDOW_DAYS * DAY_MS).toISOString()
    db = new Database(dbFile, { readonly: true, fileMustExist: true, timeout: 50 })
    return db.prepare(`
      SELECT engine,
             COUNT(*) AS attempts,
             SUM(CASE WHEN ok = 0 AND instr(detail, 'no-commit') > 0 THEN 1 ELSE 0 END) AS noCommit
        FROM attempts
       WHERE ts >= ? AND ts < ? AND typeof(engine) = 'text' AND engine != ''
       GROUP BY engine
      HAVING COUNT(*) >= ?
         AND SUM(CASE WHEN ok = 0 AND instr(detail, 'no-commit') > 0 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) > ?
       ORDER BY noCommit * 1.0 / attempts DESC, attempts DESC, engine ASC
    `).all(startIso, endIso, MIN_ATTEMPTS, NO_COMMIT_RATE_THRESHOLD) as NoCommitCapAdvice[]
  } catch {
    return []
  } finally {
    try { db?.close() } catch { /* fail-open */ }
  }
}

/** 零命中回空陣列；只產生調降建議，不修改 dailyAttemptCap。 */
export function digestNoCommitCapAdviceLines(dataDir: string, isoDayUtc: string, offsetHours: number): string[] {
  return readNoCommitCapAdvice(join(dataDir, 'run.db'), isoDayUtc, offsetHours).map(({ engine, attempts, noCommit }) =>
    `⚠ 引擎 ${engine} 近 7 日 no-commit：${noCommit}/${attempts}（${Math.round(noCommit / attempts * 100)}%），建議調降 dailyAttemptCap`)
}
