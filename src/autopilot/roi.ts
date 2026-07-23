import Database from 'better-sqlite3'
import { existsSync, readFileSync } from 'node:fs'
import { parseBacklog } from '../backlog.js'
import { quiet, type EventLog } from '../events.js'
import { ProblemsLedger, type ProblemRow } from './ledger.js'

export interface GoalAttemptStats { attemptsTotal: number; successCount: number }

const ROI_SUMMARY_MAX = 1500

/** 近期已收案 goal 的 lens 級史實；任何讀取/schema 問題皆回空字串，不影響 discovery。 */
export function readRecentGoalRoiSummary(dbFile: string): string {
  if (!existsSync(dbFile)) return ''
  let ledger: ProblemsLedger | undefined
  try {
    ledger = new ProblemsLedger(dbFile)
    return summarizeRecentGoalRoi(ledger.listRecentCompleted())
  } catch {
    return ''
  } finally {
    try { ledger?.close() } catch { /* fail-open */ }
  }
}

function summarizeRecentGoalRoi(rows: ProblemRow[]): string {
  const byLens = new Map<string, {
    goals: number; value: number; attempts: number; successes: number; unknownAttempts: number
    durationMs: number; unknownDuration: number; achieved: number; noProgress: number; stuck: number
  }>()
  for (const row of rows) {
    const lens = row.lens.replace(/\s+/g, ' ').slice(0, 40) || '(未標)'
    const stats = byLens.get(lens) ?? {
      goals: 0, value: 0, attempts: 0, successes: 0, unknownAttempts: 0,
      durationMs: 0, unknownDuration: 0, achieved: 0, noProgress: 0, stuck: 0
    }
    stats.goals++; stats.value += row.value
    if (row.attemptsTotal === undefined || row.successCount === undefined) stats.unknownAttempts++
    else { stats.attempts += row.attemptsTotal; stats.successes += row.successCount }
    const duration = Date.parse(row.endedAt ?? '') - Date.parse(row.startedAt ?? '')
    if (Number.isFinite(duration) && duration >= 0) stats.durationMs += duration
    else stats.unknownDuration++
    if (row.goalResults === 'achieved') stats.achieved++
    else if (row.goalResults === 'no-progress') stats.noProgress++
    else if (row.goalResults === 'stuck') stats.stuck++
    byLens.set(lens, stats)
  }

  const lines: string[] = []
  for (const [lens, s] of byLens) {
    const unknownAttempts = s.unknownAttempts ? `；${s.unknownAttempts} goal 未知` : ''
    const duration = `${(s.durationMs / 3_600_000).toFixed(1)}h${s.unknownDuration ? `（${s.unknownDuration} goal 未知）` : ''}`
    const line = `- ${lens}：${s.goals} goals｜預估 value avg ${(s.value / s.goals).toFixed(1)}｜實際成本 ${s.attempts} attempts（${s.successes} 成功${unknownAttempts}）、${duration}｜結果 achieved ${s.achieved}/no-progress ${s.noProgress}/stuck ${s.stuck}`
    if ([...lines, line].join('\n').length > ROI_SUMMARY_MAX) break
    lines.push(line)
  }
  return lines.join('\n')
}

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
