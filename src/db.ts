import Database from 'better-sqlite3'

export interface AttemptRecord {
  taskId: string
  ok: boolean
  costUsd: number
  detail: string
  ts?: string
}

export class RunDb {
  private readonly db: Database.Database

  constructor(file: string) {
    this.db = new Database(file)
    this.db.pragma('journal_mode = WAL')
    this.db.exec(`CREATE TABLE IF NOT EXISTS attempts(
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      ts TEXT NOT NULL,
      ok INTEGER NOT NULL,
      cost_usd REAL NOT NULL,
      detail TEXT NOT NULL
    )`)
  }

  record(r: AttemptRecord): void {
    this.db.prepare(
      'INSERT INTO attempts(task_id, ts, ok, cost_usd, detail) VALUES (?,?,?,?,?)'
    ).run(r.taskId, r.ts ?? new Date().toISOString(), r.ok ? 1 : 0, r.costUsd, r.detail)
  }

  failCount(taskId: string): number {
    const row = this.db.prepare(
      'SELECT COUNT(*) AS n FROM attempts WHERE task_id=? AND ok=0'
    ).get(taskId) as { n: number }
    return row.n
  }

  costSince(isoDayUtc: string): number {
    const row = this.db.prepare(
      "SELECT COALESCE(SUM(cost_usd),0) AS c FROM attempts WHERE substr(ts,1,19) >= ? || 'T00:00:00'"
    ).get(isoDayUtc) as { c: number }
    return row.c
  }

  /** 每日必達摘要用（M3b）：以 substr(ts,1,10) 取日期前綴比對，天然避開毫秒時戳陷阱
   *（不像 costSince 用字串比較邊界，這裡是純前綴相等，'2026-07-05T00:00:00.000Z'
   * 與 '2026-07-05T23:59:59Z' 的 substr(ts,1,10) 都等於 '2026-07-05'）。 */
  dayStats(isoDayUtc: string): { ok: number; fail: number; costUsd: number } {
    const row = this.db.prepare(
      "SELECT COALESCE(SUM(ok),0) AS ok, COALESCE(SUM(1-ok),0) AS fail, COALESCE(SUM(cost_usd),0) AS cost FROM attempts WHERE substr(ts,1,10)=?"
    ).get(isoDayUtc) as { ok: number; fail: number; cost: number }
    return { ok: row.ok, fail: row.fail, costUsd: row.cost }
  }

  close(): void { this.db.close() }
}
