/**
 * todayAttempts 觀測面轉換：
 * - heartbeat.json 的 `{ engine: { n, ok, cap? } }` 摘要
 * - digest「今日額度消耗」表文字
 *
 * 純轉換／格式化；I/O 委由 today-attempts / daily-attempt-cap-gate。
 * 缺資料、例外 → fail-open 空 map／空表，不擋主流程。
 */
import { join } from 'node:path'
import {
  dailyAttemptCapsFromEngines,
} from './daily-attempt-cap-gate.js'
import {
  todayAttemptsSummary,
  type TodayAttemptsOptions,
  type TodayAttemptsSummary,
} from './today-attempts.js'

/** heartbeat / digest 共用的單引擎今日 attempts 儲存格。 */
export interface TodayAttemptCell {
  n: number
  ok: number
  cap?: number
}

/** heartbeat.json 的 todayAttempts 形狀：engine → { n, ok, cap? }。 */
export type TodayAttemptsMap = Record<string, TodayAttemptCell>

export interface EngineAttemptRow {
  engine: string
  n: number
  ok: number
}

/**
 * 將引擎 attempts 列 + 可選 cap 表轉成 heartbeat 形狀。
 * - 有 attempts 的引擎一律入表
 * - 僅有 cap、n=0 的引擎也入表（便於看餘量）
 * - cap 未設 → 欄位省略（非寫 null）
 */
export function toTodayAttemptsMap(
  rows: readonly EngineAttemptRow[],
  caps?: ReadonlyMap<string, number>,
): TodayAttemptsMap {
  const out: TodayAttemptsMap = {}
  try {
    for (const row of rows ?? []) {
      if (!row?.engine) continue
      const n = Number(row.n) || 0
      const ok = Number(row.ok) || 0
      const cap = caps?.get(row.engine)
      out[row.engine] =
        cap !== undefined && Number.isFinite(cap) && cap > 0
          ? { n, ok, cap }
          : { n, ok }
    }
    if (caps) {
      for (const [tag, cap] of caps) {
        if (!tag || tag in out) continue
        if (typeof cap === 'number' && Number.isFinite(cap) && cap > 0) {
          out[tag] = { n: 0, ok: 0, cap }
        }
      }
    }
  } catch {
    return {}
  }
  return out
}

/** 由 todayAttemptsSummary 轉 heartbeat map（可附 cap）。 */
export function todayAttemptsMapFromSummary(
  summary: Pick<TodayAttemptsSummary, 'engines'> | null | undefined,
  caps?: ReadonlyMap<string, number>,
): TodayAttemptsMap {
  try {
    const rows: EngineAttemptRow[] = (summary?.engines ?? []).map(e => ({
      engine: e.engine,
      n: e.attempts,
      ok: e.ok,
    }))
    return toTodayAttemptsMap(rows, caps)
  } catch {
    return {}
  }
}

export interface LoadTodayAttemptsMapOptions extends TodayAttemptsOptions {
  dbFile?: string
  /** 測試注入 */
  summaryFn?: (dbFile: string, opts?: TodayAttemptsOptions) => TodayAttemptsSummary
}

/**
 * 讀 run.db 今日 attempts 並附上 dailyAttemptCap → heartbeat 用 map。
 * 缺檔／例外 → {}（fail-open）。
 */
export function loadTodayAttemptsMap(
  dataDir: string,
  engines?: Record<string, { dailyAttemptCap?: number }>,
  opts: LoadTodayAttemptsMapOptions = {},
): TodayAttemptsMap {
  try {
    const caps = dailyAttemptCapsFromEngines(engines)
    const dbFile = opts.dbFile ?? (dataDir ? join(dataDir, 'run.db') : '')
    if (!dbFile) {
      return toTodayAttemptsMap([], caps)
    }
    const { summaryFn, dbFile: _db, ...summaryOpts } = opts
    const summary = (summaryFn ?? todayAttemptsSummary)(dbFile, summaryOpts)
    return todayAttemptsMapFromSummary(summary, caps)
  } catch {
    return {}
  }
}

/** 餘量：有 cap → max(0, cap-n)；無 cap → null（格式化為 —）。 */
export function remainingQuota(n: number, cap: number | undefined): number | null {
  if (cap === undefined || !Number.isFinite(cap) || cap <= 0) return null
  return Math.max(0, cap - (Number(n) || 0))
}

/**
 * digest「今日額度消耗」表。無任何引擎列 → 空陣列（呼叫端不印段，避免零派工日雜訊）。
 * 有列時回傳含標題的多行字串。
 */
export function formatTodayQuotaTable(map: TodayAttemptsMap): string[] {
  try {
    const engines = Object.keys(map ?? {})
    if (engines.length === 0) return []

    // 次數 DESC，同次數引擎名 ASC（穩定）
    engines.sort((a, b) => {
      const dn = (map[b]?.n ?? 0) - (map[a]?.n ?? 0)
      return dn !== 0 ? dn : a.localeCompare(b)
    })

    const lines = ['今日額度消耗', '引擎｜次數｜成功｜cap｜餘量']
    for (const name of engines) {
      const cell = map[name]!
      const capStr = cell.cap !== undefined ? String(cell.cap) : '—'
      const rem = remainingQuota(cell.n, cell.cap)
      const remStr = rem === null ? '—' : String(rem)
      lines.push(`${name}｜${cell.n}｜${cell.ok}｜${capStr}｜${remStr}`)
    }
    return lines
  } catch {
    return []
  }
}

/**
 * digest 用：engineDayStats 列 + engines 設定 → 額度表行（含標題）。
 * 例外 / 無資料 → []。
 */
export function digestQuotaLines(
  engineStats: readonly EngineAttemptRow[],
  engines?: Record<string, { dailyAttemptCap?: number }>,
): string[] {
  try {
    const caps = dailyAttemptCapsFromEngines(engines)
    return formatTodayQuotaTable(toTodayAttemptsMap(engineStats, caps))
  } catch {
    return []
  }
}
