/**
 * 路由單一出口 helper 最小回歸：
 * - 上下文回退 shape 固定
 * - isolationIdle 必帶空 newlyIsolated（不派事件）
 * - finalizeIsolationForPick 是唯一事件派發出口
 */
import { expect, test, vi } from 'vitest'
import { REUSE_CURRENT } from '../src/engines/routing-decision.js'
import {
  dispatchIsolationEvents,
  finalizeIsolationForPick,
  isolationIdle,
  routingContextUnavailable,
} from '../src/engines/routing-exits.js'
import { buildRoutingContext, routingContextUnavailable as contextFallback } from '../src/engines/routing-context.js'

const EVENT = {
  engine: 'qwen',
  reason: 'near-3d-low',
  sampleCount: 6,
  successRate: 0.1,
  untilTs: '2026-07-21T00:00:00.000Z',
} as const

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
