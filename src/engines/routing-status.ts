#!/usr/bin/env node
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ISOLATE_WINDOW_DAYS } from './isolation-policy.js'
import { loadRoutingCheckInput } from './routing-check.js'
import { activeIsolatedTags } from './quarantine-gate.js'
import { REUSE_CURRENT } from './routing-decision.js'
import {
  loadRoutingState,
  type LoadRoutingStateResult,
} from './routing-state.js'
import {
  recentRunStats,
  type RunStatsOptions,
  type RunStatsResult,
} from './run-stats.js'

export { REUSE_CURRENT }

export interface RoutingStatusInput {
  dataDir: string
  nowIso?: string
  offsetHours?: number
}

/** 狀態檔載入摘要；缺檔／損毀時 kind 為 reuse-current。 */
export type RoutingStatusStateLoad =
  | { kind: 'state'; source: 'file' }
  | { kind: 'reuse-current'; reason: string }

export interface RoutingStatusReport {
  observedAt: string
  /**
   * 狀態檔或 run.db 不可用時為 true。
   * 匯總入口本身不改派工；此旗標標示「應對應維持原路徑」。
   */
  maintainOriginalPath: boolean
  decision: typeof REUSE_CURRENT | 'status'
  stateLoad: RoutingStatusStateLoad
  isolatedEngines: Array<{
    engine: string
    reason: string
    nextProbeAt: string
  }>
  standbyEngines: Array<{
    engine: string
    score: number
    promotedAt: string
  }>
  recentStats: RunStatsResult
}

export interface RoutingStatusReaders {
  loadRoutingState?: (dataDir: string, opts: { nowIso?: string }) => LoadRoutingStateResult
  recentRunStats?: (dbFile: string, opts: RunStatsOptions) => RunStatsResult
}

function stateLoadFrom(loaded: LoadRoutingStateResult): RoutingStatusStateLoad {
  if (loaded.kind === 'state') return { kind: 'state', source: loaded.source }
  return { kind: 'reuse-current', reason: loaded.reason }
}

/** 唯讀匯總路由狀態；不套用隔離、不寫狀態，也不參與 pickReadyTask。 */
export function readRoutingStatus(
  input: RoutingStatusInput,
  readers: RoutingStatusReaders = {},
): RoutingStatusReport {
  const observedAt = input.nowIso ?? new Date().toISOString()
  // 缺檔／損毀由 loadRoutingState / recentRunStats fail-open，此處不拋錯、不寫 dataDir。
  const loaded = (readers.loadRoutingState ?? loadRoutingState)(input.dataDir, {
    nowIso: observedAt,
  })
  const state = loaded.state
  const active = new Set(activeIsolatedTags(state.isolated, observedAt))
  const recent = (readers.recentRunStats ?? recentRunStats)(join(input.dataDir, 'run.db'), {
    nowIso: observedAt,
    offsetHours: input.offsetHours,
    windowDays: ISOLATE_WINDOW_DAYS,
  })
  const stateLoad = stateLoadFrom(loaded)
  const maintainOriginalPath =
    stateLoad.kind === 'reuse-current' || recent.kind === 'reuse-current'

  return {
    observedAt,
    maintainOriginalPath,
    decision: maintainOriginalPath ? REUSE_CURRENT : 'status',
    stateLoad,
    isolatedEngines: Object.entries(state.isolated)
      .filter(([engine]) => active.has(engine))
      .map(([engine, entry]) => ({
        engine,
        reason: entry.reason,
        nextProbeAt: entry.untilTs,
      }))
      .sort((a, b) => a.nextProbeAt.localeCompare(b.nextProbeAt) || a.engine.localeCompare(b.engine)),
    standbyEngines: Object.entries(state.promoted)
      .map(([engine, entry]) => ({ engine, ...entry }))
      .sort((a, b) => a.engine.localeCompare(b.engine)),
    recentStats: recent,
  }
}

/** 沿用 routing-check 的 config 解析與相對 dataDir 展開。 */
export function loadRoutingStatusInput(configPath: string): RoutingStatusInput {
  const { dataDir, offsetHours } = loadRoutingCheckInput(configPath)
  return { dataDir, offsetHours }
}

export function routingStatusMain(argv: readonly string[]): number {
  const configIndex = argv.indexOf('--config')
  const configPath = configIndex >= 0 ? argv[configIndex + 1] : undefined
  if (!configPath) throw new Error('用法：npm run routing-status -- --config <path>')
  console.log(JSON.stringify(readRoutingStatus(loadRoutingStatusInput(configPath)), null, 2))
  return 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    process.exitCode = routingStatusMain(process.argv.slice(2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
