/**
 * 路由狀態一致性檢查器（啟動用）。
 *
 * 交叉比對 run.db 近窗聚合、engineRotation 與 dataDir 狀態檔。
 * 契約：
 * - 無資料 / 未設 rotation / 讀取失敗 → skipped，維持原派工路徑
 * - 明顯不一致 → 只回 warnings（警告標記），永不改寫狀態、永不改派工
 * - I/O 可注入、可超時（沿用 recentRunStats）；任何例外 fail-open
 */
import { join } from 'node:path'
import {
  ISOLATE_MIN_SAMPLES,
  ISOLATE_MAX_SUCCESS_RATE,
  shouldIsolateEngine,
} from './isolation-policy.js'
import { activeIsolatedTags } from './quarantine-gate.js'
import { REUSE_CURRENT } from './routing-decision.js'
import {
  loadRoutingState,
  shouldApplyRoutingState,
  type LoadRoutingStateResult,
  type RoutingState,
} from './routing-state.js'
import {
  recentRunStats,
  type EngineRunStats,
  type RunStatsOptions,
  type RunStatsResult,
} from './run-stats.js'

export { REUSE_CURRENT }

/** 明顯不一致的警告代碼（僅標記，不觸發派工變更）。 */
export type RoutingConsistencyWarningCode =
  | 'isolated-outside-rotation'
  | 'promoted-in-rotation'
  | 'probe-without-isolation'
  | 'isolated-and-promoted'
  | 'healthy-but-isolated'
  | 'promoted-should-isolate'

export interface RoutingConsistencyWarning {
  code: RoutingConsistencyWarningCode
  engine: string
  detail: string
}

export type RoutingConsistencyResult =
  | {
      kind: 'ok'
      maintainOriginalPath: true
      decision: typeof REUSE_CURRENT
      warnings: []
    }
  | {
      kind: 'warnings'
      maintainOriginalPath: true
      decision: typeof REUSE_CURRENT
      warnings: RoutingConsistencyWarning[]
    }
  | {
      kind: 'skipped'
      maintainOriginalPath: true
      decision: typeof REUSE_CURRENT
      warnings: []
      reason: string
    }

export interface RoutingConsistencyInput {
  dataDir: string
  engineRotation?: readonly string[]
  nowIso?: string
  offsetHours?: number
  dbFile?: string
  timeoutMs?: number
  /** 測試注入 */
  statsFn?: (dbFile: string, opts?: RunStatsOptions) => RunStatsResult
  loadStateFn?: (dataDir: string, opts?: { nowIso?: string }) => LoadRoutingStateResult
}

function ok(): Extract<RoutingConsistencyResult, { kind: 'ok' }> {
  return {
    kind: 'ok',
    maintainOriginalPath: true,
    decision: REUSE_CURRENT,
    warnings: [],
  }
}

function skipped(reason: string): Extract<RoutingConsistencyResult, { kind: 'skipped' }> {
  return {
    kind: 'skipped',
    maintainOriginalPath: true,
    decision: REUSE_CURRENT,
    warnings: [],
    reason,
  }
}

function withWarnings(
  warnings: RoutingConsistencyWarning[]
): RoutingConsistencyResult {
  if (warnings.length === 0) return ok()
  return {
    kind: 'warnings',
    maintainOriginalPath: true,
    decision: REUSE_CURRENT,
    warnings,
  }
}

function warn(
  code: RoutingConsistencyWarningCode,
  engine: string,
  detail: string
): RoutingConsistencyWarning {
  return { code, engine, detail }
}

function statsByEngine(engines: readonly EngineRunStats[]): Map<string, EngineRunStats> {
  const map = new Map<string, EngineRunStats>()
  for (const row of engines) {
    if (row.engine) map.set(row.engine, row)
  }
  return map
}

/**
 * 純交叉比對：rotation × state ×（可選）run.db 聚合。
 * 不碰 I/O；呼叫端負責注入已讀取的資料。
 */
export function analyzeRoutingConsistency(
  rotation: readonly string[],
  state: RoutingState,
  statsEngines: readonly EngineRunStats[] | null,
  nowIso: string
): RoutingConsistencyWarning[] {
  const rot = new Set(rotation.filter(Boolean))
  if (rot.size === 0) return []

  const warnings: RoutingConsistencyWarning[] = []
  const activeIsolated = new Set(activeIsolatedTags(state.isolated, nowIso))
  const promotedTags = Object.keys(state.promoted).filter(Boolean)
  const probeTags = Object.keys(state.probes).filter(Boolean)

  for (const tag of activeIsolated) {
    if (!rot.has(tag)) {
      warnings.push(warn(
        'isolated-outside-rotation',
        tag,
        `隔離中的 ${tag} 不在 engineRotation，狀態與輪替清單不一致`
      ))
    }
  }

  for (const tag of promotedTags) {
    if (rot.has(tag)) {
      warnings.push(warn(
        'promoted-in-rotation',
        tag,
        `晉升候選 ${tag} 已在正式 rotation，狀態與輪替清單重疊`
      ))
    }
  }

  for (const tag of probeTags) {
    if (!activeIsolated.has(tag) && !Object.hasOwn(state.isolated, tag)) {
      warnings.push(warn(
        'probe-without-isolation',
        tag,
        `試探紀錄 ${tag} 無對應隔離條目，狀態交叉不一致`
      ))
    }
  }

  for (const tag of activeIsolated) {
    if (Object.hasOwn(state.promoted, tag)) {
      warnings.push(warn(
        'isolated-and-promoted',
        tag,
        `${tag} 同時存在隔離與晉升條目，狀態自相矛盾`
      ))
    }
  }

  if (!statsEngines || statsEngines.length === 0) return warnings

  const byEngine = statsByEngine(statsEngines)

  for (const tag of activeIsolated) {
    if (!rot.has(tag)) continue
    const row = byEngine.get(tag)
    if (!row) continue
    // 樣本充足且明顯未達隔離門檻 → 狀態與戰績交叉不一致
    if (
      row.sampleCount >= ISOLATE_MIN_SAMPLES
      && row.successRate >= ISOLATE_MAX_SUCCESS_RATE
    ) {
      warnings.push(warn(
        'healthy-but-isolated',
        tag,
        `隔離中的 ${tag} 近窗成功率 ${(row.successRate * 100).toFixed(1)}%（樣本 ${row.sampleCount}）已過隔離門檻`
      ))
    }
  }

  for (const tag of promotedTags) {
    const row = byEngine.get(tag)
    if (!row) continue
    if (shouldIsolateEngine(row.sampleCount, row.successRate)) {
      warnings.push(warn(
        'promoted-should-isolate',
        tag,
        `晉升中的 ${tag} 近窗戰績達隔離門檻（樣本 ${row.sampleCount}、成功率 ${(row.successRate * 100).toFixed(1)}%）`
      ))
    }
  }

  return warnings
}

/**
 * 啟動時一致性檢查：讀 run.db + 狀態檔，與 engineRotation 交叉比對。
 * 永遠 maintainOriginalPath；僅回警告標記，不寫檔、不改派工。
 */
export function checkRoutingStateConsistency(
  input: RoutingConsistencyInput
): RoutingConsistencyResult {
  try {
    const dataDir = input.dataDir
    if (!dataDir) return skipped('missing-data-dir')

    const rotation = input.engineRotation
    if (!Array.isArray(rotation) || rotation.length === 0) {
      return skipped('no-rotation')
    }
    if (rotation.some(t => typeof t !== 'string' || t.length === 0)) {
      return skipped('invalid-rotation')
    }

    const nowIso = input.nowIso ?? new Date().toISOString()
    const loadFn = input.loadStateFn ?? ((dir, opts) => loadRoutingState(dir, opts))
    const loaded = loadFn(dataDir, { nowIso })
    if (!shouldApplyRoutingState(loaded)) {
      const reason = loaded.kind === 'reuse-current' ? loaded.reason : 'state-unavailable'
      // 缺檔＝尚無狀態可對，屬正常；其他不可用一律 skip 維持原路徑
      return skipped(reason === 'missing' ? 'no-state-file' : `state-${reason}`)
    }

    const statsFn = input.statsFn ?? recentRunStats
    const dbFile = input.dbFile ?? join(dataDir, 'run.db')
    let statsEngines: EngineRunStats[] | null = null
    try {
      const stats = statsFn(dbFile, {
        nowIso,
        offsetHours: input.offsetHours ?? 0,
        windowDays: 3,
        timeoutMs: input.timeoutMs ?? 50,
        minSamples: 1,
      })
      if (stats.kind === 'stats') statsEngines = stats.engines
      // stats 不可用時仍做 state×rotation 結構交叉（fail-open，不整段 skip）
    } catch {
      statsEngines = null
    }

    return withWarnings(
      analyzeRoutingConsistency([...rotation], loaded.state, statsEngines, nowIso)
    )
  } catch {
    return skipped('unexpected-error')
  }
}
