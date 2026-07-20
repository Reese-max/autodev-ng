import { join } from 'node:path'
import { REUSE_CURRENT } from './routing-decision.js'
import {
  recentRunStats,
  type EngineRunStats,
  type RecentRunStats,
  type RunStatsOptions,
  type RunStatsResult,
} from './run-stats.js'
import {
  loadRoutingState,
  type LoadRoutingStateResult,
  type RoutingState,
} from './routing-state.js'

export { REUSE_CURRENT }

/** 可供後續純路由決策使用的完整輸入；建構失敗時絕不回傳半成品。 */
export interface RoutingContext {
  engineRotation: string[]
  stats: RecentRunStats
  state: RoutingState
}

export type RoutingContextResult =
  | { kind: 'context'; context: RoutingContext }
  | { kind: 'reuse-current'; decision: typeof REUSE_CURRENT; reason: 'unavailable' }

export interface RoutingContextInput {
  dataDir: string
  engineRotation?: readonly string[]
  nowIso?: string
  offsetHours?: number
}

/** I/O 邊界可注入，讓路由決策測試不必建立 SQLite 或狀態檔。 */
export interface RoutingContextReaders {
  recentRunStats?: (dbFile: string, opts: RunStatsOptions) => RunStatsResult
  loadRoutingState?: (dataDir: string, opts: { nowIso?: string }) => LoadRoutingStateResult
}

function fallback(): RoutingContextResult {
  return { kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'unavailable' }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isEngineStats(value: unknown): value is EngineRunStats {
  if (!isPlainObject(value)) return false
  return typeof value.engine === 'string'
    && value.engine.length > 0
    && isNonNegativeInt(value.sampleCount)
    && isNonNegativeInt(value.ok)
    && isNonNegativeInt(value.fail)
    && value.ok + value.fail === value.sampleCount
    && typeof value.successRate === 'number'
    && Number.isFinite(value.successRate)
    && value.successRate >= 0
    && value.successRate <= 1
}

function hasStatsFields(value: RunStatsResult): value is RecentRunStats {
  return value.kind === 'stats'
    && Array.isArray(value.days)
    && value.days.length === 3
    && value.days.every(day => typeof day === 'string' && day.length > 0)
    && isNonNegativeInt(value.sampleCount)
    && value.sampleCount > 0
    && Array.isArray(value.engines)
    && value.engines.length > 0
    && value.engines.every(isEngineStats)
    && value.engines.reduce((sum, engine) => sum + engine.sampleCount, 0) === value.sampleCount
}

function hasStateFields(value: LoadRoutingStateResult): value is Extract<LoadRoutingStateResult, { kind: 'state' }> {
  if (value.kind !== 'state') return false
  const state = value.state
  return state.version === 1
    && typeof state.updatedAt === 'string'
    && isPlainObject(state.isolated)
    && isPlainObject(state.promoted)
    && isPlainObject(state.probes)
}

/**
 * 將現有 rotation、近三日 run.db 戰績與 dataDir 狀態檔組成一路由上下文。
 * 無 rotation、無戰績、讀檔損壞、欄位缺失或任何 I/O 例外皆收斂至同一 fallback，
 * 呼叫端因此只需沿用既有 candidateEngines() 路徑。
 */
export function buildRoutingContext(
  input: RoutingContextInput,
  readers: RoutingContextReaders = {}
): RoutingContextResult {
  const rotation = input.engineRotation
  if (!Array.isArray(rotation) || rotation.length === 0 || rotation.some(tag => typeof tag !== 'string' || tag.length === 0)) {
    return fallback()
  }

  const nowIso = input.nowIso ?? new Date().toISOString()
  const readStats = readers.recentRunStats ?? recentRunStats
  const readState = readers.loadRoutingState ?? loadRoutingState
  try {
    const stats = readStats(join(input.dataDir, 'run.db'), {
      nowIso,
      offsetHours: input.offsetHours,
      windowDays: 3,
    })
    const state = readState(input.dataDir, { nowIso })
    if (!hasStatsFields(stats) || !hasStateFields(state)) return fallback()
    return { kind: 'context', context: { engineRotation: [...rotation], stats, state: state.state } }
  } catch {
    return fallback()
  }
}
