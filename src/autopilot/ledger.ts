import Database from 'better-sqlite3'
import { createHash } from 'node:crypto'

/** M10.0 問題台帳：discovery 結果的持久記憶（去重＋狀態機）。對 run.db 自開第二條連線
 * （WAL 併存安全；寫入者只有 daemon 進程內的外環——單寫者紀律），不動 kernel db.ts。
 * 台帳是記憶不是閘門：呼叫端一律 fail-open，寫入失敗降級為失憶，不得擋工作。 */

export interface ProblemCandidate { title: string; lens: string; value: number }
export interface ProblemRow {
  fingerprint: string; title: string; lens: string; value: number
  status: 'open' | 'in-progress' | 'fixed' | 'deferred' | 'rejected'
  goalId: string; firstSeen: string; lastSeen: string; note: string
}

/** 指紋＝NFKC 正規化→小寫→剝除空白與標點後 sha1 前 16 hex。lens 不入指紋——
 * 同一問題換鏡頭再現仍算同案（spec §3.3）。 */
export function problemFingerprint(title: string): string {
  const norm = title.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '')
  return createHash('sha1').update(norm).digest('hex').slice(0, 16)
}

export class ProblemsLedger {
  private db: Database.Database
  constructor(dbFile: string) {
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
      note TEXT NOT NULL DEFAULT ''
    )`)
  }

  upsertSeen(c: ProblemCandidate, nowIso: string): { isNew: boolean; row: ProblemRow } {
    const fp = problemFingerprint(c.title)
    const existing = this.get(fp)
    if (existing) {
      this.db.prepare(`UPDATE problems SET last_seen=?, value=? WHERE fingerprint=?`).run(nowIso, c.value, fp)
      return { isNew: false, row: this.get(fp)! }
    }
    this.db.prepare(`INSERT INTO problems (fingerprint,title,lens,value,status,first_seen,last_seen)
      VALUES (?,?,?,?, 'open', ?, ?)`).run(fp, c.title, c.lens, c.value, nowIso, nowIso)
    return { isNew: true, row: this.get(fp)! }
  }

  setStatus(fingerprint: string, status: ProblemRow['status'], note: string, goalId = ''): void {
    this.db.prepare(`UPDATE problems SET status=?, note=?, goal_id=CASE WHEN ?='' THEN goal_id ELSE ? END WHERE fingerprint=?`)
      .run(status, note, goalId, goalId, fingerprint)
  }

  listByStatus(status: ProblemRow['status'], limit = 50): ProblemRow[] {
    return (this.db.prepare(`SELECT fingerprint,title,lens,value,status,goal_id,first_seen,last_seen,note
      FROM problems WHERE status=? ORDER BY value DESC, id ASC LIMIT ?`).all(status, limit) as Record<string, unknown>[]).map(toRow)
  }

  counts(): Record<string, number> {
    const rows = this.db.prepare(`SELECT status, COUNT(*) n FROM problems GROUP BY status`).all() as { status: string; n: number }[]
    return Object.fromEntries(rows.map(r => [r.status, r.n]))
  }

  private get(fp: string): ProblemRow | undefined {
    const r = this.db.prepare(`SELECT fingerprint,title,lens,value,status,goal_id,first_seen,last_seen,note
      FROM problems WHERE fingerprint=?`).get(fp) as Record<string, unknown> | undefined
    return r ? toRow(r) : undefined
  }

  close(): void { this.db.close() }
}

function toRow(r: Record<string, unknown>): ProblemRow {
  return {
    fingerprint: r.fingerprint as string, title: r.title as string, lens: r.lens as string,
    value: r.value as number, status: r.status as ProblemRow['status'], goalId: r.goal_id as string,
    firstSeen: r.first_seen as string, lastSeen: r.last_seen as string, note: r.note as string
  }
}
