import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { REUSE_CURRENT, buildRoutingContext, routingContextUnavailable } from '../src/engines/routing-context.js'
import { defaultRoutingState } from '../src/engines/routing-state.js'

const NOW = '2026-07-20T00:00:00.000Z'
const INPUT = { dataDir: 'D:/adng/data', engineRotation: ['codex', 'qwen'], nowIso: NOW, offsetHours: 8 }
const STATS = {
  kind: 'stats' as const,
  days: ['2026-07-20', '2026-07-19', '2026-07-18'],
  sampleCount: 2,
  engines: [
    { engine: 'codex', sampleCount: 2, ok: 1, fail: 1, successRate: 0.5 },
  ],
}
const STATE = defaultRoutingState(NOW)
/** 與單一出口 helper 對齊，禁止測試端手寫另一套 fallback shape。 */
const FALLBACK = routingContextUnavailable()

test('可注入讀取器會組合 rotation、近三日戰績與狀態檔', () => {
  const readStats = vi.fn(() => STATS)
  const readState = vi.fn(() => ({ kind: 'state' as const, state: STATE, source: 'file' as const }))

  expect(buildRoutingContext(INPUT, { recentRunStats: readStats, loadRoutingState: readState })).toEqual({
    kind: 'context',
    context: { engineRotation: ['codex', 'qwen'], stats: STATS, state: STATE },
  })
  expect(readStats).toHaveBeenCalledWith(join(INPUT.dataDir, 'run.db'), { nowIso: NOW, offsetHours: 8, windowDays: 3 })
  expect(readState).toHaveBeenCalledWith('D:/adng/data', { nowIso: NOW })
})

test('無資料、內容損壞與欄位缺失都回到同一個 fallback', () => {
  const noData = buildRoutingContext(INPUT, {
    recentRunStats: () => ({ kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'insufficient-samples' }),
    loadRoutingState: () => ({ kind: 'state', state: STATE, source: 'file' }),
  })
  const corrupt = buildRoutingContext(INPUT, {
    recentRunStats: () => STATS,
    loadRoutingState: () => ({ kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'corrupt', state: STATE }),
  })
  const missingField = buildRoutingContext(INPUT, {
    recentRunStats: () => STATS,
    loadRoutingState: () => ({
      kind: 'state',
      source: 'file',
      state: { version: 1, updatedAt: NOW, isolated: {}, promoted: {} },
    } as never),
  })

  expect([noData, corrupt, missingField]).toEqual([FALLBACK, FALLBACK, FALLBACK])
})

test('未設 engineRotation 時不讀 I/O，直接沿用既有路由', () => {
  const readStats = vi.fn(() => STATS)
  expect(buildRoutingContext({ dataDir: INPUT.dataDir }, { recentRunStats: readStats })).toEqual(FALLBACK)
  expect(readStats).not.toHaveBeenCalled()
})
