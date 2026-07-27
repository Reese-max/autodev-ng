/**
 * 錯誤簽名熔斷器（2026-07-27）：同引擎「連續 N 次相同失敗簽名」→ 隔離。
 *
 * 動機：7/18 codex PATH 斷線一天內同錯誤撞 37 次——統計隔離要 3 日視窗
 * 樣本 ≥6 且率 <30% 才動，環境級事故（每次同一句錯誤秒敗）應在第 N 次就停損。
 * 與統計隔離互補：簽名各異的「模型自身弱」不觸發本器，交給統計面。
 *
 * 設計：純 policy（selectBreakerTargets）＋ fail-open 查詢（loadRecentBreakerRows），
 * 由 applyStatsIsolation 併入既有 targets 管道——路由狀態、24h 試探、事件派發全沿用。
 * 隔離到期後單次試探：再敗一筆同簽名 leading run 立即重熔斷，成功則斷鏈復活。
 * ponytail: 不看失敗耗時（attempts 無 duration 欄）；簽名一致性已足以分離環境事故，
 * 若日後要「秒敗」精準判準，加 duration_ms 欄再收緊。
 */
import { existsSync } from 'node:fs'
import Database from 'better-sqlite3'
import type { IsolateTarget } from './isolation-policy.js'

/** 熔斷門檻：leading run 連續同簽名失敗 ≥ 5 次。 */
export const BREAKER_MIN_CONSECUTIVE = 5

/** 掃描視窗：近 N 筆 attempts（跨引擎共用一次查詢）。 */
export const BREAKER_SCAN_LIMIT = 120

export interface BreakerAttemptRow {
  engine: string
  ok: number
  detail: string
}

/** 失敗簽名：detail 首行 trim 後截 80 字。空簽名不參與熔斷。 */
export function detailSignature(detail: string): string {
  return (detail ?? '').split(/\r?\n/, 1)[0]!.trim().slice(0, 80)
}

/**
 * 對 rotation 內每個引擎算最新往回的 leading run：連續 ok=0 且簽名相同。
 * rows 契約：seq DESC（最新在前）。run ≥ minConsecutive → 熔斷 target。
 */
export function selectBreakerTargets(
  rows: readonly BreakerAttemptRow[],
  rotation: readonly string[],
  minConsecutive: number = BREAKER_MIN_CONSECUTIVE,
): IsolateTarget[] {
  const byEngine = new Map<string, BreakerAttemptRow[]>()
  for (const r of rows) {
    const list = byEngine.get(r.engine)
    if (list) list.push(r)
    else byEngine.set(r.engine, [r])
  }
  const targets: IsolateTarget[] = []
  for (const engine of new Set(rotation)) {
    const list = byEngine.get(engine)
    if (!list || list.length === 0) continue
    const head = list[0]!
    if (head.ok !== 0) continue
    const sig = detailSignature(head.detail)
    if (!sig) continue
    let run = 0
    for (const r of list) {
      if (r.ok === 0 && detailSignature(r.detail) === sig) run++
      else break
    }
    if (run < minConsecutive) continue
    targets.push({
      engine,
      sampleCount: run,
      ok: 0,
      fail: run,
      successRate: 0,
      reason: `簽名熔斷：連續${run}次相同失敗「${sig}」`,
    })
  }
  return targets
}

/** 讀近 limit 筆 attempts（seq DESC）；缺檔/讀失敗一律回 []（fail-open，不影響派工）。 */
export function loadRecentBreakerRows(
  dbFile: string,
  limit: number = BREAKER_SCAN_LIMIT,
): BreakerAttemptRow[] {
  try {
    if (!existsSync(dbFile)) return []
    const db = new Database(dbFile, { readonly: true })
    try {
      return db
        .prepare('select engine, ok, detail from attempts order by seq desc limit ?')
        .all(limit) as BreakerAttemptRow[]
    } finally {
      db.close()
    }
  } catch {
    return []
  }
}
