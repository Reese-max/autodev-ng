import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { parseBacklog } from '../backlog.js'
import { quiet, type EventLog } from '../events.js'
import type { ProblemsLedger } from './ledger.js'

export interface GoalAttemptStats { attemptsTotal: number; successCount: number }

function goalTaskIds(backlog: string, goalId: string): string[] {
  const ids = backlog.split(/\r?\n/).flatMap(line => {
    const marker = /<!--\s*adng:autopilot\b[^>]*\bgoal:([^\s>]+)/.exec(line)
    return marker?.[1] === goalId ? parseBacklog(line).map(task => task.id) : []
  })
  return [...new Set(ids)]
}

/** 只計該 goal 標記的 task，並用 goal 存活窗排除同 taskId 的歷史 attempts。 */
export function collectGoalAttemptStats(
  dbFile: string, backlogFile: string, goalId: string, startedAt: string, endedAt: string
): GoalAttemptStats | null {
  let db: Database.Database | undefined
  try {
    db = new Database(dbFile, { readonly: true, fileMustExist: true })
    const ids = goalTaskIds(readFileSync(backlogFile, 'utf8'), goalId)
    if (ids.length === 0) return { attemptsTotal: 0, successCount: 0 }
    const row = db.prepare(`SELECT COUNT(*) attemptsTotal, COALESCE(SUM(ok),0) successCount
      FROM attempts WHERE task_id IN (${ids.map(() => '?').join(',')}) AND ts>=? AND ts<=?`)
      .get(...ids, startedAt, endedAt) as GoalAttemptStats
    return row
  } catch {
    return null
  } finally {
    try { db?.close() } catch { /* fail-open */ }
  }
}

export function settleProblemRoi(input: {
  ledger: ProblemsLedger; events: EventLog; dbFile: string; backlogFile: string
  fingerprint: string; goalId: string; result: 'achieved' | 'no-progress' | 'stuck'
  startedAt: string; endedAt: string
}): void {
  const { ledger, events, dbFile, backlogFile, fingerprint, goalId, result, startedAt, endedAt } = input
  const stats = collectGoalAttemptStats(dbFile, backlogFile, goalId, startedAt, endedAt)
  if (!stats) quiet(() => events.append('perpetual-roi-stats-failed', { fingerprint, goalId }))
  try {
    if (ledger.setRoi(fingerprint, { goalResults: result, startedAt, endedAt, ...(stats ?? {}) })) return
  } catch { /* fail-open，統一記錄於下方 */ }
  quiet(() => events.append('perpetual-roi-write-failed', { fingerprint, goalId }))
}
