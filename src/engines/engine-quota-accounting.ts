/**
 * 引擎額度記帳：從 run.db.attempts 依 UTC 日界聚合各引擎 { n, ok }。
 *
 * 契約：
 * - 日界固定 UTC（半開區間 [day 00:00Z, next 00:00Z)）
 * - n = 該日 attempts 次數；ok = 成功次數（ok=1）
 * - 缺檔 / 舊 schema / 查詢失敗 / 例外 → fail-open 回空統計 {}，不擋派工
 */
import {
  todayAttemptsSummary,
  type TodayAttemptsOptions,
} from './today-attempts.js'

/** 單引擎今日額度記帳儲存格。 */
export interface EngineQuotaCell {
  n: number
  ok: number
}

/** engine tag → { n, ok }（僅含有 attempts 的引擎）。 */
export type EngineQuotaAccounting = Record<string, EngineQuotaCell>

/**
 * 讀 run.db.attempts，依 UTC 日界彙總各引擎 { n, ok }。
 * 讀取失敗一律回 {}（fail-open）。
 */
export function accountEngineQuotaByUtcDay(
  dbFile: string,
  opts: TodayAttemptsOptions = {},
): EngineQuotaAccounting {
  try {
    const summary = todayAttemptsSummary(dbFile, opts)
    const out: EngineQuotaAccounting = {}
    for (const row of summary.engines ?? []) {
      if (!row?.engine) continue
      out[row.engine] = {
        n: Number(row.attempts) || 0,
        ok: Number(row.ok) || 0,
      }
    }
    return out
  } catch {
    return {}
  }
}
