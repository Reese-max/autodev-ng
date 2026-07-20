/**
 * 路由單一出口 helper 最小回歸：
 * - 上下文回退 shape 固定
 * - isolationIdle 必帶空 newlyIsolated（不派事件）
 * - finalizeIsolationForPick 是唯一事件派發出口
 */
import { expect, test, vi } from 'vitest'
import { REUSE_CURRENT } from '../src/engines/routing-decision.js'
import {
  dispatchRoutingEvent,
  dispatchIsolationEvents,
  finalizeIsolationForPick,
  isolationIdle,
  parseRoutingEventPayload,
  ROUTING_EVENT_SCHEMA_VERSION,
  ROUTING_EVENT_TYPES,
  routingContextUnavailable,
  type RoutingEventType,
} from '../src/engines/routing-exits.js'
import { buildRoutingContext, routingContextUnavailable as contextFallback } from '../src/engines/routing-context.js'

const EVENT = {
  schemaVersion: ROUTING_EVENT_SCHEMA_VERSION,
  engine: 'qwen',
  reason: 'near-3d-low',
  sampleCount: 6,
  successRate: 0.1,
  untilTs: '2026-07-21T00:00:00.000Z',
} as const

const PROBE_EVENT = {
  schemaVersion: ROUTING_EVENT_SCHEMA_VERSION,
  engine: 'qwen',
  hits: 1,
  lastTs: '2026-07-21T00:00:00.000Z',
} as const

const PROMOTION_EVENT = {
  schemaVersion: ROUTING_EVENT_SCHEMA_VERSION,
  engine: 'codex',
  score: 2,
  promotedAt: '2026-07-21T00:00:00.000Z',
} as const

const ROUTING_EVENTS = [
  [ROUTING_EVENT_TYPES.isolated, EVENT],
  [ROUTING_EVENT_TYPES.probe, PROBE_EVENT],
  [ROUTING_EVENT_TYPES.promoted, PROMOTION_EVENT],
] as const

test('routingContextUnavailable：固定 reuse-current / unavailable', () => {
  expect(routingContextUnavailable()).toEqual({
    kind: 'reuse-current',
    decision: REUSE_CURRENT,
    reason: 'unavailable',
  })
  // 自 routing-context 再 export 的必須是同一出口
  expect(contextFallback()).toEqual(routingContextUnavailable())
})

test('buildRoutingContext 所有失敗分支皆等於 routingContextUnavailable()', () => {
  const expected = routingContextUnavailable()
  const noRotation = buildRoutingContext({ dataDir: 'D:/x' })
  const badStats = buildRoutingContext(
    { dataDir: 'D:/x', engineRotation: ['codex'] },
    {
      recentRunStats: () => ({ kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'missing-run-db' }),
      loadRoutingState: () => ({
        kind: 'state',
        source: 'file',
        state: {
          version: 1,
          updatedAt: '2026-07-20T00:00:00.000Z',
          isolated: {},
          promoted: {},
          probes: {},
        },
      }),
    }
  )
  const threw = buildRoutingContext(
    { dataDir: 'D:/x', engineRotation: ['codex'] },
    {
      recentRunStats: () => {
        throw new Error('io')
      },
    }
  )
  expect([noRotation, badStats, threw]).toEqual([expected, expected, expected])
})

test('isolationIdle：reuse-current / unchanged 皆保證 newlyIsolated 為空', () => {
  const reuse = isolationIdle('reuse-current', ['qwen'], 'no-rotation')
  const unchanged = isolationIdle('unchanged', ['codex'], 'already-isolated')
  expect(reuse).toEqual({
    kind: 'reuse-current',
    newlyIsolated: [],
    activeIsolatedTags: ['qwen'],
    reason: 'no-rotation',
  })
  expect(unchanged).toEqual({
    kind: 'unchanged',
    newlyIsolated: [],
    activeIsolatedTags: ['codex'],
    reason: 'already-isolated',
  })
  // 回傳為新陣列，避免呼叫端 mutation 污染
  const tags = ['a']
  const r = isolationIdle('reuse-current', tags, 'x')
  tags.push('b')
  expect(r.activeIsolatedTags).toEqual(['a'])
})

test('dispatchIsolationEvents：空陣列或不傳 onIsolated 都不呼叫', () => {
  const onIsolated = vi.fn()
  dispatchIsolationEvents([], onIsolated)
  dispatchIsolationEvents([EVENT])
  expect(onIsolated).not.toHaveBeenCalled()
})

test('dispatchIsolationEvents：onIsolated 拋錯 fail-open 且仍繼續後續事件', () => {
  const seen: string[] = []
  dispatchIsolationEvents(
    [EVENT, { ...EVENT, engine: 'codex' }],
    ev => {
      seen.push(ev.engine)
      if (ev.engine === 'qwen') throw new Error('boom')
    }
  )
  expect(seen).toEqual(['qwen', 'codex'])
})

test('三類路由事件固定為 schema v1，完整 payload 才通過', () => {
  for (const [type, payload] of ROUTING_EVENTS) {
    expect(parseRoutingEventPayload(type, payload)).toEqual(payload)
    for (const missing of Object.keys(payload)) {
      const incomplete = Object.fromEntries(Object.entries(payload).filter(([field]) => field !== missing))
      expect(parseRoutingEventPayload(type, incomplete)).toBeUndefined()
    }
  }
  expect(parseRoutingEventPayload(ROUTING_EVENT_TYPES.probe, {
    ...PROBE_EVENT,
    schemaVersion: 2,
  })).toBeUndefined()
  expect(parseRoutingEventPayload(ROUTING_EVENT_TYPES.promoted, {
    ...PROMOTION_EVENT,
    extra: true,
  })).toBeUndefined()
})

test('dispatchRoutingEvent：拒收不完整 payload 且 consumer 失敗不外拋', () => {
  const onEvent = vi.fn()
  expect(dispatchRoutingEvent(ROUTING_EVENT_TYPES.probe, { engine: 'qwen' }, onEvent)).toBe(false)
  expect(dispatchRoutingEvent('engine-route-unknown' as RoutingEventType, EVENT, onEvent)).toBe(false)
  expect(onEvent).not.toHaveBeenCalled()
  expect(dispatchRoutingEvent(ROUTING_EVENT_TYPES.probe, PROBE_EVENT, () => {
    throw new Error('event sink failed')
  })).toBe(false)
})

test('finalizeIsolationForPick：不完整事件拒收且不阻斷後續完整事件', () => {
  const onIsolated = vi.fn()
  const { reason: _missing, ...incomplete } = EVENT
  expect(finalizeIsolationForPick({
    newlyIsolated: [incomplete, { ...EVENT, engine: 'codex' }],
    activeIsolatedTags: ['qwen'],
  }, onIsolated)).toEqual(['qwen'])
  expect(onIsolated).toHaveBeenCalledOnce()
  expect(onIsolated).toHaveBeenCalledWith({ ...EVENT, engine: 'codex' })
})

test('finalizeIsolationForPick：唯一完成出口——有 newlyIsolated 才派事件並回 tags', () => {
  const onIsolated = vi.fn()
  const tags = finalizeIsolationForPick(
    { newlyIsolated: [EVENT], activeIsolatedTags: ['qwen'] },
    onIsolated
  )
  expect(tags).toEqual(['qwen'])
  expect(onIsolated).toHaveBeenCalledOnce()
  expect(onIsolated).toHaveBeenCalledWith(EVENT)

  const idle = isolationIdle('reuse-current', [], 'state-write-failed')
  const onIdle = vi.fn()
  expect(finalizeIsolationForPick(idle, onIdle)).toEqual([])
  expect(onIdle).not.toHaveBeenCalled()
})
