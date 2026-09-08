/**
 * 日 attempts 額度閘（daily attempt cap gate）。
 *
 * 用途：候選引擎今日 attempts 已達 engines.<tag>.dailyAttemptCap 時視為不可用，
 * 從清單移除以輪替下一候選。
 * 契約：
 * - 未設 cap 的引擎不限
 * - 未設 cap 不限；計數不可讀時保留沒有上限的引擎
 * - 全部被 cap 濾光 → 空清單，等待下一日
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

/** 達上限就不可派工；讀取異常時僅保留沒有設定上限的引擎。 */
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
    return kept
  } catch {
    return candidates.filter(tag => !caps.has(tag))
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
 * 診斷預設回空 map；strict 守門模式保留讀取失敗。
 */
export function loadTodayAttemptCounts(
  dbFile: string,
  opts: LoadTodayAttemptCountsOptions = {},
): Map<string, number> {
  try {
    if (!dbFile) { if (opts.strict) throw new Error('Daily attempt database missing'); return new Map() }
    const { summaryFn, ...summaryOpts } = opts
    const summary = (summaryFn ?? todayAttemptsSummary)(dbFile, summaryOpts)
    return todayCountsFromSummary(summary)
  } catch (error) {
    if (opts.strict) throw error
    return new Map()
  }
}

/**
 * 派工用：一次組裝 caps + 今日 counts。
 * 讀取失敗時 capped 引擎計數視為 Infinity，不能把未知當作零。
 */
export function loadDailyAttemptCapContext(
  engines: Record<string, { dailyAttemptCap?: number }> | undefined,
  dataDir: string,
  opts: LoadTodayAttemptCountsOptions & { dbFile?: string } = {},
): {
  dailyAttemptCaps: Map<string, number>
  todayAttemptCounts: Map<string, number>
} {
  const dailyAttemptCaps = dailyAttemptCapsFromEngines(engines)
  try {
    if (dailyAttemptCaps.size === 0) {
      return { dailyAttemptCaps, todayAttemptCounts: new Map() }
    }
    const dbFile = opts.dbFile ?? (dataDir ? join(dataDir, 'run.db') : '')
    const todayAttemptCounts = loadTodayAttemptCounts(dbFile, { ...opts, strict: true })
    return { dailyAttemptCaps, todayAttemptCounts }
  } catch {
    return { dailyAttemptCaps, todayAttemptCounts: new Map([...dailyAttemptCaps.keys()].map(tag => [tag, Infinity])) }
  }
}
