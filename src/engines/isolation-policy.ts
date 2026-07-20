/**
 * 輪替引擎隔離門檻（純函式）。
 *
 * 契約：近 3 日樣本數 ≥ 6 且成功率 < 30% → 應隔離。
 * 僅評估 rotation 清單內的 tag；無 rotation / 樣本不足 → 不隔離。
 * 不碰 I/O。
 */
import type { EngineRunStats } from './run-stats.js'

/** 戰績視窗：近 3 個本地日（含今日）。 */
export const ISOLATE_WINDOW_DAYS = 3

/** 隔離門檻：至少 6 筆樣本。 */
export const ISOLATE_MIN_SAMPLES = 6

/** 隔離門檻：成功率嚴格 < 30%。恰 30% 不隔離。 */
export const ISOLATE_MAX_SUCCESS_RATE = 0.3

export interface IsolateTarget {
  engine: string
  sampleCount: number
  ok: number
  fail: number
  successRate: number
  reason: string
}

/** 單引擎是否達隔離門檻（樣本 ≥ 6 且成功率 < 0.3）。 */
export function shouldIsolateEngine(sampleCount: number, successRate: number): boolean {
  if (!Number.isFinite(sampleCount) || !Number.isFinite(successRate)) return false
  if (sampleCount < ISOLATE_MIN_SAMPLES) return false
  if (successRate >= ISOLATE_MAX_SUCCESS_RATE) return false
  return true
}

/** 可讀事由：寫入 IsolationEntry.reason 與事件。 */
export function isolationReason(sampleCount: number, successRate: number): string {
  const pct = (successRate * 100).toFixed(1)
  return `近${ISOLATE_WINDOW_DAYS}日樣本${sampleCount}成功率${pct}%<${ISOLATE_MAX_SUCCESS_RATE * 100}%`
}

/**
 * 從近窗引擎戰績挑出應隔離的輪替檔位。
 * @param rotationTags 未設或空 → 回 []（無輪替則不隔離，維持原路徑）
 */
export function selectEnginesToIsolate(
  engines: readonly EngineRunStats[],
  rotationTags?: readonly string[]
): IsolateTarget[] {
  if (!rotationTags || rotationTags.length === 0) return []
  const allow = new Set(rotationTags.filter(Boolean))
  if (allow.size === 0) return []

  const out: IsolateTarget[] = []
  for (const row of engines) {
    if (!row.engine || !allow.has(row.engine)) continue
    if (!shouldIsolateEngine(row.sampleCount, row.successRate)) continue
    out.push({
      engine: row.engine,
      sampleCount: row.sampleCount,
      ok: row.ok,
      fail: row.fail,
      successRate: row.successRate,
      reason: isolationReason(row.sampleCount, row.successRate),
    })
  }
  return out
}
