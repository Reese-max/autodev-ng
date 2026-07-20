/** 清除不再影響路由的持久狀態；缺檔、損壞或寫入失敗一律 fail-open。 */
import {
  loadRoutingState,
  saveRoutingState,
  type RoutingState,
} from './routing-state.js'

/** 晉升與試探紀錄最多保留 30 日；固定值避免新增一個不必要的 config 維度。 */
export const ROUTING_STATE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

export interface RoutingStateCleanupOptions {
  nowIso?: string
  retentionMs?: number
}

/**
 * 移除已到期隔離、已進正式 rotation 的候選，以及孤兒／過期試探與晉升紀錄。
 * 無可清項目時保留原參考，讓呼叫端避免無意義寫檔。
 */
export function pruneRoutingState(
  state: RoutingState,
  rotationTags: readonly string[],
  nowIso: string,
  retentionMs = ROUTING_STATE_RETENTION_MS
): RoutingState {
  const now = Date.parse(nowIso)
  if (!Number.isFinite(now) || !Number.isFinite(retentionMs) || retentionMs < 0) return state

  const cutoff = now - retentionMs
  const rotation = new Set(rotationTags.filter(Boolean))
  const isolated = Object.fromEntries(
    Object.entries(state.isolated).filter(([, entry]) => Date.parse(entry.untilTs) > now)
  )
  const promoted = Object.fromEntries(
    Object.entries(state.promoted).filter(([tag, entry]) =>
      !rotation.has(tag) && Date.parse(entry.promotedAt) >= cutoff
    )
  )
  const probes = Object.fromEntries(
    Object.entries(state.probes).filter(([tag, entry]) =>
      Object.hasOwn(isolated, tag) && Date.parse(entry.lastTs) >= cutoff
    )
  )

  if (
    Object.keys(isolated).length === Object.keys(state.isolated).length
    && Object.keys(promoted).length === Object.keys(state.promoted).length
    && Object.keys(probes).length === Object.keys(state.probes).length
  ) return state

  return { ...state, updatedAt: nowIso, isolated, promoted, probes }
}

/** 讀取並原子清理 dataDir 狀態；僅在確有刪除且寫入成功時回 true。 */
export function cleanupRoutingState(
  dataDir: string,
  rotationTags: readonly string[] = [],
  opts: RoutingStateCleanupOptions = {}
): boolean {
  if (!dataDir) return false
  const nowIso = opts.nowIso ?? new Date().toISOString()
  try {
    const loaded = loadRoutingState(dataDir, { nowIso })
    if (loaded.kind !== 'state') return false
    const next = pruneRoutingState(
      loaded.state,
      rotationTags,
      nowIso,
      opts.retentionMs ?? ROUTING_STATE_RETENTION_MS
    )
    return next !== loaded.state && saveRoutingState(dataDir, next, { nowIso })
  } catch {
    return false
  }
}
