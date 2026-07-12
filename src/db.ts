import Database from 'better-sqlite3'

export interface AttemptRecord {
  taskId: string
  ok: boolean
  costUsd: number
  detail: string
  ts?: string
  engine?: string
}

/** M4 Task 3（成本記帳本地日界線）：純函數，把一個 UTC ISO 時戳依 offsetHours 平移後取
 * 日期前綴，得到這個時戳落在哪個「本地日曆日」。offsetHours=0 與純 UTC 日期切割完全等價
 * （相容性錨點）。offsetHours 為正（如台灣 +8）時，UTC 傍晚以後的時戳會落在本地的「明日」。 */
export function localDay(tsIso: string, offsetHours: number): string {
  return new Date(Date.parse(tsIso) + offsetHours * 3600_000).toISOString().slice(0, 10)
}

/** 本地日曆日對應的 UTC 起迄範圍（半開區間 [startIso, endIso)）：offsetHours=0 時就是該 UTC 日
 * 00:00:00.000Z ~ 次日 00:00:00.000Z，與舊版 substr 字串比較行為完全一致（相容性錨點）。 */
export function localDayUtcRange(day: string, offsetHours: number): { startIso: string; endIso: string } {
  const startMs = Date.parse(`${day}T00:00:00.000Z`) - offsetHours * 3600_000
  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(startMs + 24 * 3600_000).toISOString(),
  }
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
    // M9.9 分離帳 migration：舊庫補 engine 欄（冪等；空值＝歷史列，billed 端 fail-safe 算真金）。
    // try/catch 防雙進程首開競態：兩進程同時通過 PRAGMA 檢查、都跑 ALTER，輸家拋
    // duplicate column name——欄位已在，吞掉即等價冪等；其他錯誤照拋（不掩蓋真故障）。
    const cols = this.db.prepare(`PRAGMA table_info(attempts)`).all() as { name: string }[]
    if (!cols.some(c => c.name === 'engine')) {
      try {
        this.db.exec(`ALTER TABLE attempts ADD COLUMN engine TEXT NOT NULL DEFAULT ''`)
      } catch (err) {
        if (!String(err).includes('duplicate column')) throw err
      }
    }
  }

  record(r: AttemptRecord): void {
    this.db.prepare(
      'INSERT INTO attempts(task_id, ts, ok, cost_usd, detail, engine) VALUES (?,?,?,?,?,?)'
    ).run(r.taskId, r.ts ?? new Date().toISOString(), r.ok ? 1 : 0, r.costUsd, r.detail, r.engine ?? '')
  }

  /** 取 rowid（seq）最大一筆最近嘗試紀錄；空庫回 null。ok 欄位鏡像既有 record() 寫入慣例
   * （SQLite 存整數 0/1），讀出後轉回 boolean 供呼叫端使用。 */
  lastAttempt(): AttemptRecord | null {
    const row = this.db.prepare(
      'SELECT task_id, ts, ok, cost_usd, detail, engine FROM attempts ORDER BY seq DESC LIMIT 1'
    ).get() as { task_id: string; ts: string; ok: number; cost_usd: number; detail: string; engine: string } | undefined
    if (!row) return null
    return { taskId: row.task_id, ts: row.ts, ok: row.ok === 1, costUsd: row.cost_usd, detail: row.detail, engine: row.engine }
  }

  failCount(taskId: string): number {
    const row = this.db.prepare(
      'SELECT COUNT(*) AS n FROM attempts WHERE task_id=? AND ok=0'
    ).get(taskId) as { n: number }
    return row.n
  }

  /** 本地日累計成本（M4 Task 3：取代舊 costSince 的 substr 字串比較+開放式「since」語意）。
   * offsetHours 預設 0（UTC，等價舊行為）；正式呼叫端（scheduler todayCost）一律帶入
   * cfg.timezoneOffsetHours。SQL 改半開區間範圍查詢（ts >= startIso AND ts < endIso），
   * 淘汰 substr(ts,1,19) >= ? || 'T00:00:00' 的字串比較與其隱含的無上界「since」語意。 */
  costForLocalDay(day: string, offsetHours = 0): number {
    const { startIso, endIso } = localDayUtcRange(day, offsetHours)
    const row = this.db.prepare(
      'SELECT COALESCE(SUM(cost_usd),0) AS c FROM attempts WHERE ts >= ? AND ts < ?'
    ).get(startIso, endIso) as { c: number }
    return row.c
  }

  /** M9.9：真金帳（踩日頂用）。排除訂閱引擎；engine 空（歷史列）或未知一律計入
   * （fail-safe 寧誤煞不漏煞）。清單空時＝costForLocalDay 同值。 */
  billedCostForLocalDay(day: string, offsetHours = 0, subscriptionEngines: string[] = []): number {
    if (subscriptionEngines.length === 0) return this.costForLocalDay(day, offsetHours)
    const { startIso, endIso } = localDayUtcRange(day, offsetHours)
    const ph = subscriptionEngines.map(() => '?').join(',')
    const row = this.db.prepare(
      `SELECT COALESCE(SUM(cost_usd),0) AS c FROM attempts WHERE ts >= ? AND ts < ? AND engine NOT IN (${ph})`
    ).get(startIso, endIso, ...subscriptionEngines) as { c: number }
    return row.c
  }

  /** 每日必達摘要用（M3b）＋本地日界線（M4 Task 3）：offsetHours 預設 0（UTC，等價舊行為）。
   * 改半開區間範圍查詢，淘汰 substr(ts,1,10) 前綴比對——原理相同（只算落在該日曆日的記錄），
   * 差別是現在日曆日依 offsetHours 而非死板的 UTC 切割。
   * M9.9：加第三參數 subscriptionEngines，回傳補 billedUsd（真金帳）；預設空陣列向後相容
   * （既有呼叫端不改也能編譯，billedUsd===costUsd）。 */
  dayStats(day: string, offsetHours = 0, subscriptionEngines: string[] = []): { ok: number; fail: number; costUsd: number; billedUsd: number } {
    const { startIso, endIso } = localDayUtcRange(day, offsetHours)
    const row = this.db.prepare(
      'SELECT COALESCE(SUM(ok),0) AS ok, COALESCE(SUM(1-ok),0) AS fail, COALESCE(SUM(cost_usd),0) AS cost FROM attempts WHERE ts >= ? AND ts < ?'
    ).get(startIso, endIso) as { ok: number; fail: number; cost: number }
    const billedUsd = this.billedCostForLocalDay(day, offsetHours, subscriptionEngines)
    return { ok: row.ok, fail: row.fail, costUsd: row.cost, billedUsd }
  }

  close(): void { this.db.close() }
}
