/**
 * 路由狀態轉移純函式（隔離 / 試探 / 晉升）。
 *
 * 契約：
 * - 輸入輸出皆為不可變 RoutingState；永不原地修改。
 * - 不碰 I/O、DB、scheduler；時間全靠呼叫端注入 nowIso。
 * - untilTs 語意：隔離後「最早可試探」時刻（依連續隔離次數退避）。
 * - 仍在 isolated map 即未解除；試探成功才刪除該 key。
 */
import type { RoutingState } from './routing-state.js'

/** 首次隔離滿此時長後才允許單次試探。 */
export const ISOLATION_BEFORE_PROBE_MS = 24 * 60 * 60 * 1000
const MAX_ISOLATION_BEFORE_PROBE_MS = 7 * 24 * 60 * 60 * 1000

/** 晉升門檻：至少 4 筆樣本。 */
export const PROMOTE_MIN_SAMPLES = 4

/** 晉升門檻：成功率 ≥ 50%（含恰 50%）。 */
export const PROMOTE_MIN_SUCCESS_RATE = 0.5

function parseMs(iso: string): number | null {
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? ms : null
}

function isolationCount(state: RoutingState, tag: string): number {
  const count = state.isolationCounts?.[tag]
  if (typeof count !== 'number' || !Number.isFinite(count) || count < 0) return 0
  return Math.floor(count)
}

function reprobeIntervalMs(count: number): number {
  return Math.min(
    ISOLATION_BEFORE_PROBE_MS * 2 ** Math.max(0, count - 1),
    MAX_ISOLATION_BEFORE_PROBE_MS
  )
}

function cloneState(state: RoutingState, nowIso: string): RoutingState {
  return {
    version: state.version,
    updatedAt: nowIso,
    isolated: { ...state.isolated },
    isolationCounts: { ...state.isolationCounts },
    promoted: { ...state.promoted },
    probes: { ...state.probes },
  }
}

/** 是否仍列於隔離 map（未試探成功解除）。 */
export function isIsolated(state: RoutingState, tag: string): boolean {
  return Boolean(tag && state.isolated[tag])
}

/**
 * 首次隔離：tag 尚無 isolated entry 時寫入下一次試探時刻。
 * 同引擎連續隔離間隔依序為 24h → 48h → 96h，封頂 168h。
 * 已隔離則原樣回傳（不重設時鐘、不重複觸發）。
 */
export function applyFirstIsolation(
  state: RoutingState,
  tag: string,
  reason: string,
  nowIso: string
): RoutingState {
  if (!tag) return state
  if (state.isolated[tag]) return state
  const now = parseMs(nowIso)
  if (now === null) return state
  const next = cloneState(state, nowIso)
  const count = isolationCount(state, tag) + 1
  next.isolationCounts[tag] = count
  next.isolated[tag] = {
    untilTs: new Date(now + reprobeIntervalMs(count)).toISOString(),
    reason,
  }
  return next
}

/**
 * 隔離後滿目前退避間隔且本輪尚未試探 → 允許單次試探。
 * - untilTs 未到：不可試探
 * - 已有 probes[tag].lastTs 且 ≥ 本次隔離起算點：已用過單次額度
 */
export function isSingleProbeEligible(
  state: RoutingState,
  tag: string,
  nowIso: string
): boolean {
  if (!tag) return false
  const entry = state.isolated[tag]
  if (!entry) return false
  const now = parseMs(nowIso)
  const until = parseMs(entry.untilTs)
  if (now === null || until === null) return false
  if (now < until) return false

  const isolStart = until - reprobeIntervalMs(isolationCount(state, tag))
  const probe = state.probes[tag]
  if (!probe?.lastTs) return true
  const last = parseMs(probe.lastTs)
  if (last === null) return true
  // 本隔離窗內已試探過 → 不再給第二次
  return last < isolStart
}

/** 記錄單次試探（hits+1、lastTs=now）。不自動解除隔離。 */
export function recordProbeAttempt(
  state: RoutingState,
  tag: string,
  nowIso: string
): RoutingState {
  if (!tag) return state
  if (!isSingleProbeEligible(state, tag, nowIso)) return state
  const next = cloneState(state, nowIso)
  const prev = state.probes[tag]
  next.probes[tag] = {
    hits: (prev?.hits ?? 0) + 1,
    lastTs: nowIso,
  }
  return next
}

/** 試探成功 → 解除隔離、清掉 probe 計數，並將退避計數歸零。 */
export function applyProbeSuccess(
  state: RoutingState,
  tag: string,
  nowIso: string
): RoutingState {
  if (!tag || (!state.isolated[tag] && isolationCount(state, tag) === 0)) return state
  const next = cloneState(state, nowIso)
  delete next.isolated[tag]
  delete next.probes[tag]
  next.isolationCounts[tag] = 0
  return next
}

/**
 * 晉升邊界：sampleCount ≥ 4 且 successRate ≥ 0.5。
 * 恰 4 樣本、恰 50%（2/4）為通過邊界。
 */
export function shouldPromote(sampleCount: number, successRate: number): boolean {
  if (!Number.isFinite(sampleCount) || !Number.isFinite(successRate)) return false
  if (sampleCount < PROMOTE_MIN_SAMPLES) return false
  if (successRate < PROMOTE_MIN_SUCCESS_RATE) return false
  return true
}

/** 將 tag 寫入 promoted（不檢查門檻；門檻由 shouldPromote 判定）。 */
export function applyPromotion(
  state: RoutingState,
  tag: string,
  score: number,
  nowIso: string
): RoutingState {
  if (!tag) return state
  const next = cloneState(state, nowIso)
  next.promoted[tag] = {
    score: Number.isFinite(score) && score >= 0 ? Math.floor(score) : 0,
    promotedAt: nowIso,
  }
  return next
}
