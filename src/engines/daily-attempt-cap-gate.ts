/**
 * 日 attempts 額度閘（daily attempt cap gate）。
 *
 * 用途：候選引擎今日 attempts 已達 engines.<tag>.dailyAttemptCap 時視為不可用，
 * 從清單移除以輪替下一候選。
 * 契約：
 * - 未設 cap 的引擎不限
 * - caps 空／未傳、counts 讀取失敗、helper 例外 → fail-open 回原清單
 * - 全部被 cap 濾光 → fail-open 回原清單（不把派工堵死）
 * 可替換：經 pickCandidateTags hooks.dailyAttemptCapGate 注入。
 */
import { join } from 'node:path'
import {
  todayAttemptsSummary,
  type TodayAttemptsOptions,
  type TodayAttemptsSummary,
} from './today-attempts.js'

export type DailyAttemptCapGate = (
  candidates: readonly string[],
  caps: ReadonlyMap<string, number>,
  todayCounts: ReadonlyMap<string, number>,
) => string[]

/** 預設閘：attempts >= cap 視為不可用；濾光或例外 → fail-open。 */
export const defaultDailyAttemptCapGate: DailyAttemptCapGate = (
  candidates,
  caps,
  todayCounts,
) => {
  try {
    if (candidates.length === 0) return []
    if (!caps || caps.size === 0) return [...candidates]
    const kept = candidates.filter(tag => {
      const cap = caps.get(tag)
      if (cap === undefined || !Number.isFinite(cap) || cap <= 0) return true
      const n = todayCounts?.get(tag) ?? 0
      return n < cap
    })
    return kept.length > 0 ? kept : [...candidates]
  } catch {
    return [...candidates]
  }
}

/** 從 engines 設定抽出 tag → dailyAttemptCap（僅正整數）。 */
export function dailyAttemptCapsFromEngines(
  engines: Record<string, { dailyAttemptCap?: number }> | undefined,
): Map<string, number> {
  const out = new Map<string, number>()
  if (!engines) return out
  for (const [tag, cfg] of Object.entries(engines)) {
    const cap = cfg?.dailyAttemptCap
    if (typeof cap === 'number' && Number.isInteger(cap) && cap > 0) {
      out.set(tag, cap)
    }
  }
  return out
}

/** 將 todayAttemptsSummary 轉為 tag → attempts。 */
export function todayCountsFromSummary(
  summary: Pick<TodayAttemptsSummary, 'engines'>,
): Map<string, number> {
  const out = new Map<string, number>()
  for (const e of summary.engines ?? []) {
    if (e?.engine) out.set(e.engine, e.attempts)
  }
  return out
}

export interface LoadTodayAttemptCountsOptions extends TodayAttemptsOptions {
  /** 測試注入；預設 todayAttemptsSummary */
  summaryFn?: (dbFile: string, opts?: TodayAttemptsOptions) => TodayAttemptsSummary
}

/**
 * 讀 run.db 今日 attempts 計數。
 * 缺檔／helper 失敗／例外 → 空 map（fail-open，不觸發日額度攔截）。
 */
export function loadTodayAttemptCounts(
  dbFile: string,
  opts: LoadTodayAttemptCountsOptions = {},
): Map<string, number> {
  try {
    if (!dbFile) return new Map()
    const { summaryFn, ...summaryOpts } = opts
    const summary = (summaryFn ?? todayAttemptsSummary)(dbFile, summaryOpts)
    return todayCountsFromSummary(summary)
  } catch {
    return new Map()
  }
}

/**
 * 派工用：一次組裝 caps + 今日 counts。
 * 無任何 cap、或讀取失敗 → counts 空、caps 可能仍有值但 gate 在 counts 全 0 時不攔截。
 * 最外層例外 → 兩者皆空（完全不攔截）。
 */
export function loadDailyAttemptCapContext(
  engines: Record<string, { dailyAttemptCap?: number }> | undefined,
  dataDir: string,
  opts: LoadTodayAttemptCountsOptions & { dbFile?: string } = {},
): {
  dailyAttemptCaps: Map<string, number>
  todayAttemptCounts: Map<string, number>
} {
  try {
    const dailyAttemptCaps = dailyAttemptCapsFromEngines(engines)
    if (dailyAttemptCaps.size === 0) {
      return { dailyAttemptCaps, todayAttemptCounts: new Map() }
    }
    const dbFile = opts.dbFile ?? (dataDir ? join(dataDir, 'run.db') : '')
    const todayAttemptCounts = loadTodayAttemptCounts(dbFile, opts)
    return { dailyAttemptCaps, todayAttemptCounts }
  } catch {
    return { dailyAttemptCaps: new Map(), todayAttemptCounts: new Map() }
  }
}
