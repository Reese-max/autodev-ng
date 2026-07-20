/**
 * pickReadyTask 戰績隔離接線：讀 run.db 近 3 日 → 達門檻則寫 dataDir 隔離狀態。
 *
 * 契約：
 * - 缺檔 / 無 rotation / 查詢失敗 / 超時 → fail-open，不改既有派工路徑
 * - I/O 失敗不拋；已隔離不再重設時鐘
 * - 回傳 newlyIsolated 供呼叫端派發 engine-route-isolated 事件
 */
import { join } from 'node:path'
import {
  ISOLATE_WINDOW_DAYS,
  selectEnginesToIsolate,
  type IsolateTarget,
} from './isolation-policy.js'
import { activeIsolatedTags } from './quarantine-gate.js'
import {
  defaultRoutingState,
  loadRoutingState,
  saveRoutingState,
  shouldApplyRoutingState,
  type RoutingState,
} from './routing-state.js'
import { applyFirstIsolation } from './routing-transition.js'
import {
  recentRunStats,
  type RunStatsOptions,
  type RunStatsResult,
} from './run-stats.js'

export interface IsolationAppliedEvent {
  engine: string
  reason: string
  sampleCount: number
  successRate: number
  untilTs: string
}

export type ApplyStatsIsolationResult =
  | {
      kind: 'applied'
      newlyIsolated: IsolationAppliedEvent[]
      activeIsolatedTags: string[]
    }
  | {
      kind: 'unchanged'
      newlyIsolated: []
      activeIsolatedTags: string[]
      reason?: string
    }
  | {
      kind: 'reuse-current'
      newlyIsolated: []
      activeIsolatedTags: string[]
      reason: string
    }

export interface ApplyStatsIsolationInput {
  dataDir: string
  /** 輪替清單；未設或空 → 不隔離（維持原路徑） */
  rotation?: readonly string[]
  nowIso?: string
  offsetHours?: number
  /** 預設 `<dataDir>/run.db` */
  dbFile?: string
  timeoutMs?: number
  /** 測試注入 */
  statsFn?: (dbFile: string, opts?: RunStatsOptions) => RunStatsResult
  loadStateFn?: (dataDir: string, opts?: { nowIso?: string }) => { state: RoutingState }
  saveStateFn?: (dataDir: string, state: RoutingState, opts?: { nowIso?: string }) => boolean
}

/** 讀既有隔離 tag；缺檔/損壞 → []（fail-open）。 */
function loadActiveTags(dataDir: string, nowIso: string): string[] {
  try {
    if (!dataDir) return []
    const loaded = loadRoutingState(dataDir, { nowIso })
    if (!shouldApplyRoutingState(loaded)) return []
    return activeIsolatedTags(loaded.state.isolated, nowIso)
  } catch {
    return []
  }
}

function emptyResult(
  kind: 'unchanged' | 'reuse-current',
  dataDir: string,
  nowIso: string,
  reason: string
): ApplyStatsIsolationResult {
  const tags = loadActiveTags(dataDir, nowIso)
  if (kind === 'reuse-current') {
    return { kind, newlyIsolated: [], activeIsolatedTags: tags, reason }
  }
  return { kind, newlyIsolated: [], activeIsolatedTags: tags, reason }
}

function applyTargets(
  state: RoutingState,
  targets: IsolateTarget[],
  nowIso: string
): { state: RoutingState; newlyIsolated: IsolationAppliedEvent[] } {
  let next = state
  const newlyIsolated: IsolationAppliedEvent[] = []
  for (const t of targets) {
    const before = next
    next = applyFirstIsolation(next, t.engine, t.reason, nowIso)
    const entry = next.isolated[t.engine]
    if (next !== before && entry) {
      newlyIsolated.push({
        engine: t.engine,
        reason: entry.reason,
        sampleCount: t.sampleCount,
        successRate: t.successRate,
        untilTs: entry.untilTs,
      })
    }
  }
  return { state: next, newlyIsolated }
}

/**
 * pickReadyTask 用：套用戰績隔離並回 active tags；可選 onIsolated 派事件（呼叫端包 quiet）。
 */
export function loadIsolatedTagsForPick(
  input: ApplyStatsIsolationInput,
  onIsolated?: (ev: IsolationAppliedEvent) => void
): string[] {
  const result = applyStatsIsolation(input)
  if (onIsolated) {
    for (const ev of result.newlyIsolated) {
      try { onIsolated(ev) } catch { /* fail-open */ }
    }
  }
  return result.activeIsolatedTags
}

/**
 * 讀近 3 日 run.db，對達門檻的輪替引擎寫入隔離狀態。
 * 永不拋錯；任何失敗回 reuse-current / unchanged。
 */
export function applyStatsIsolation(input: ApplyStatsIsolationInput): ApplyStatsIsolationResult {
  const nowIso = input.nowIso ?? new Date().toISOString()
  const dataDir = input.dataDir
  try {
    if (!dataDir) return emptyResult('reuse-current', dataDir ?? '', nowIso, 'missing-data-dir')
    if (!input.rotation || input.rotation.length === 0) {
      return emptyResult('reuse-current', dataDir, nowIso, 'no-rotation')
    }

    const dbFile = input.dbFile ?? join(dataDir, 'run.db')
    const statsFn = input.statsFn ?? recentRunStats
    const stats = statsFn(dbFile, {
      nowIso,
      offsetHours: input.offsetHours ?? 0,
      windowDays: ISOLATE_WINDOW_DAYS,
      timeoutMs: input.timeoutMs ?? 50,
      minSamples: 1,
    })

    if (stats.kind === 'reuse-current') {
      return emptyResult('reuse-current', dataDir, nowIso, stats.reason)
    }

    const targets = selectEnginesToIsolate(stats.engines, input.rotation)
    if (targets.length === 0) {
      return emptyResult('unchanged', dataDir, nowIso, 'no-targets')
    }

    const loadFn = input.loadStateFn ?? ((dir, opts) => loadRoutingState(dir, opts))
    const loaded = loadFn(dataDir, { nowIso })
    const base = loaded.state ?? defaultRoutingState(nowIso)
    const { state, newlyIsolated } = applyTargets(base, targets, nowIso)

    if (newlyIsolated.length === 0) {
      return {
        kind: 'unchanged',
        newlyIsolated: [],
        activeIsolatedTags: activeIsolatedTags(state.isolated, nowIso),
        reason: 'already-isolated',
      }
    }

    const saveFn = input.saveStateFn ?? saveRoutingState
    try {
      saveFn(dataDir, state, { nowIso })
    } catch {
      /* fail-open：本輪仍用記憶體隔離結果 */
    }

    return {
      kind: 'applied',
      newlyIsolated,
      activeIsolatedTags: activeIsolatedTags(state.isolated, nowIso),
    }
  } catch {
    return emptyResult('reuse-current', dataDir, nowIso, 'unexpected-error')
  }
}
