import Database from 'better-sqlite3'
import { createHash } from 'node:crypto'

/** M10.0 問題台帳：discovery 結果的持久記憶（去重＋狀態機）。對 run.db 自開第二條連線
 * （WAL 併存安全；寫入者只有 daemon 進程內的外環——單寫者紀律），不動 kernel db.ts。
 * 台帳是記憶不是閘門：呼叫端一律 fail-open，寫入失敗降級為失憶，不得擋工作。 */

export interface ProblemCandidate { title: string; lens: string; value: number }
export interface ProblemRoi {
  goalResults?: string; attemptsTotal?: number; successCount?: number
  startedAt?: string; endedAt?: string
}
export interface ProblemRow {
  fingerprint: string; title: string; lens: string; value: number
  status: 'open' | 'in-progress' | 'fixed' | 'deferred' | 'rejected'
  goalId: string; firstSeen: string; lastSeen: string; note: string
  goalResults?: string; attemptsTotal?: number; successCount?: number
  startedAt?: string; endedAt?: string
}

const ROI_COLUMNS = [
  ['goal_results', 'TEXT'], ['attempts_total', 'INTEGER'], ['success_count', 'INTEGER'],
  ['started_at', 'TEXT'], ['ended_at', 'TEXT']
] as const
const ROI_SELECT = ',goal_results,attempts_total,success_count,started_at,ended_at'

/** 指紋＝NFKC 正規化→小寫→剝除空白與標點後 sha1 前 16 hex。lens 不入指紋——
 * 同一問題換鏡頭再現仍算同案（spec §3.3）。 */
export function problemFingerprint(title: string): string {
  const norm = title.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '')
  return createHash('sha1').update(norm).digest('hex').slice(0, 16)
}

export class ProblemsLedger {
  private db?: Database.Database
  private hasRoiColumns = false
  private ioFailed = false
  constructor(dbFile: string) {
    try {
      this.db = new Database(dbFile)
      this.db.pragma('journal_mode = WAL')
      this.db.exec(`CREATE TABLE IF NOT EXISTS problems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fingerprint TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        lens TEXT NOT NULL DEFAULT '',
        value INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'open',
        goal_id TEXT NOT NULL DEFAULT '',
        first_seen TEXT NOT NULL,
        last_seen TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        goal_results TEXT,
        attempts_total INTEGER,
        success_count INTEGER,
        started_at TEXT,
        ended_at TEXT
      )`)
      this.hasRoiColumns = this.migrateRoiColumns()
    } catch {
      this.ioFailed = true
      try { this.db?.close() } catch { /* fail-open */ }
      this.db = undefined
    }
  }

  upsertSeen(c: ProblemCandidate, nowIso: string): { isNew: boolean; row: ProblemRow } {
    const fp = problemFingerprint(c.title)
    const fallback = { fingerprint: fp, ...c, status: 'open' as const, goalId: '', firstSeen: nowIso, lastSeen: nowIso, note: '' }
    return this.safe({ isNew: false, row: fallback }, db => {
      const existing = this.get(fp)
      if (existing) {
        db.prepare(`UPDATE problems SET last_seen=?, value=? WHERE fingerprint=?`).run(nowIso, c.value, fp)
        return { isNew: false, row: this.get(fp) ?? existing }
      }
      db.prepare(`INSERT INTO problems (fingerprint,title,lens,value,status,first_seen,last_seen)
        VALUES (?,?,?,?, 'open', ?, ?)`).run(fp, c.title, c.lens, c.value, nowIso, nowIso)
      return { isNew: true, row: this.get(fp) ?? fallback }
    })
  }

  setStatus(fingerprint: string, status: ProblemRow['status'], note: string, goalId = ''): void {
    this.safe(undefined, db => db.prepare(`UPDATE problems SET status=?, note=?, goal_id=CASE WHEN ?='' THEN goal_id ELSE ? END WHERE fingerprint=?`)
      .run(status, note, goalId, goalId, fingerprint))
  }

  setRoi(fingerprint: string, roi: ProblemRoi): boolean {
    if (!this.hasRoiColumns) return false
    const fields = [
      ['goal_results', roi.goalResults], ['attempts_total', roi.attemptsTotal], ['success_count', roi.successCount],
      ['started_at', roi.startedAt], ['ended_at', roi.endedAt]
    ].filter(([, value]) => value !== undefined) as [string, string | number][]
    if (fields.length === 0) return true
    return this.safe(false, db => db.prepare(`UPDATE problems SET ${fields.map(([name]) => `${name}=?`).join(',')} WHERE fingerprint=?`)
      .run(...fields.map(([, value]) => value), fingerprint).changes > 0)
  }

  listByStatus(status: ProblemRow['status'], limit = 50): ProblemRow[] {
    return this.safe([], db => (db.prepare(`SELECT fingerprint,title,lens,value,status,goal_id,first_seen,last_seen,note${this.hasRoiColumns ? ROI_SELECT : ''}
      FROM problems WHERE status=? ORDER BY value DESC, id ASC LIMIT ?`).all(status, limit) as Record<string, unknown>[]).map(toRow))
  }

  listRecentCompleted(limit = 20): ProblemRow[] {
    if (!this.hasRoiColumns) return []
    return this.safe([], db => (db.prepare(`SELECT fingerprint,title,lens,value,status,goal_id,first_seen,last_seen,note${ROI_SELECT}
      FROM problems WHERE goal_results IS NOT NULL AND ended_at IS NOT NULL ORDER BY ended_at DESC, id DESC LIMIT ?`)
      .all(limit) as Record<string, unknown>[]).map(toRow))
  }

  counts(): Record<string, number> {
    return this.safe({}, db => {
      const rows = db.prepare(`SELECT status, COUNT(*) n FROM problems GROUP BY status`).all() as { status: string; n: number }[]
      return Object.fromEntries(rows.map(r => [r.status, r.n]))
    })
  }

  get(fp: string): ProblemRow | undefined {
    return this.safe(undefined, db => {
      const r = db.prepare(`SELECT fingerprint,title,lens,value,status,goal_id,first_seen,last_seen,note${this.hasRoiColumns ? ROI_SELECT : ''}
        FROM problems WHERE fingerprint=?`).get(fp) as Record<string, unknown> | undefined
      return r ? toRow(r) : undefined
    })
  }

  findByGoalId(goalId: string): ProblemRow | undefined {
    return this.safe(undefined, db => {
      const r = db.prepare(`SELECT fingerprint,title,lens,value,status,goal_id,first_seen,last_seen,note${this.hasRoiColumns ? ROI_SELECT : ''}
        FROM problems WHERE goal_id=? ORDER BY id DESC LIMIT 1`).get(goalId) as Record<string, unknown> | undefined
      return r ? toRow(r) : undefined
    })
  }

  isOperational(): boolean { return this.db !== undefined && !this.ioFailed }

  private migrateRoiColumns(): boolean {
    try {
      const columns = this.problemColumns()
      this.db!.transaction(() => {
        for (const [name, type] of ROI_COLUMNS) if (!columns.has(name)) this.db!.exec(`ALTER TABLE problems ADD COLUMN ${name} ${type}`)
      })()
    } catch { /* 另一個連線可能已完成同一批可重入遷移，改以最終 schema 判定。 */ }
    try { return ROI_COLUMNS.every(([name]) => this.problemColumns().has(name)) } catch { return false }
  }

  private problemColumns(): Set<string> {
    return new Set((this.db!.prepare('PRAGMA table_info(problems)').all() as { name: string }[]).map(column => column.name))
  }

  private safe<T>(fallback: T, action: (db: Database.Database) => T): T {
    try { return this.db ? action(this.db) : fallback } catch { this.ioFailed = true; return fallback }
  }

  close(): void { this.safe(undefined, db => db.close()) }
}

function toRow(r: Record<string, unknown>): ProblemRow {
  const row: ProblemRow = {
    fingerprint: r.fingerprint as string, title: r.title as string, lens: r.lens as string,
    value: r.value as number, status: r.status as ProblemRow['status'], goalId: r.goal_id as string,
    firstSeen: r.first_seen as string, lastSeen: r.last_seen as string, note: r.note as string
  }
  if (typeof r.goal_results === 'string') row.goalResults = r.goal_results
  if (typeof r.attempts_total === 'number') row.attemptsTotal = r.attempts_total
  if (typeof r.success_count === 'number') row.successCount = r.success_count
  if (typeof r.started_at === 'string') row.startedAt = r.started_at
  if (typeof r.ended_at === 'string') row.endedAt = r.ended_at
  return row
}
