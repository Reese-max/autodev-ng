import { describe, expect, test } from 'vitest'
import {
  ISOLATION_BEFORE_PROBE_MS,
  PROMOTE_MIN_SAMPLES,
  PROMOTE_MIN_SUCCESS_RATE,
  applyFirstIsolation,
  applyProbeSuccess,
  applyPromotion,
  isIsolated,
  isSingleProbeEligible,
  recordProbeAttempt,
  shouldPromote,
} from '../src/engines/routing-transition.js'
import { ROUTING_STATE_VERSION, defaultRoutingState } from '../src/engines/routing-state.js'

const T0 = '2026-07-20T00:00:00.000Z'
const T0_MS = Date.parse(T0)
const AFTER_23H = new Date(T0_MS + ISOLATION_BEFORE_PROBE_MS - 1).toISOString()
const AT_24H = new Date(T0_MS + ISOLATION_BEFORE_PROBE_MS).toISOString()
const AFTER_24H = new Date(T0_MS + ISOLATION_BEFORE_PROBE_MS + 60_000).toISOString()

function empty(now = T0) {
  return defaultRoutingState(now)
}

function readyForNextIsolation(state: ReturnType<typeof defaultRoutingState>) {
  return { ...state, isolated: {}, probes: {} }
}

describe('首次隔離', () => {
  test('空狀態首次隔離 → 寫入 isolated，untilTs = now + 24h', () => {
    const next = applyFirstIsolation(empty(), 'qwen', 'fail-streak', T0)
    expect(isIsolated(next, 'qwen')).toBe(true)
    expect(next.isolated.qwen).toEqual({
      untilTs: AT_24H,
      reason: 'fail-streak',
    })
    expect(next.updatedAt).toBe(T0)
    expect(next.version).toBe(ROUTING_STATE_VERSION)
  })

  test('連續第 2/3 次隔離的試探間隔翻倍', () => {
    const first = applyFirstIsolation(empty(), 'qwen', 'first', T0)
    const second = applyFirstIsolation(readyForNextIsolation(first), 'qwen', 'second', AT_24H)
    const thirdStart = second.isolated.qwen!.untilTs
    const third = applyFirstIsolation(readyForNextIsolation(second), 'qwen', 'third', thirdStart)

    expect(second.isolationCounts.qwen).toBe(2)
    expect(second.isolated.qwen?.untilTs).toBe(
      new Date(Date.parse(AT_24H) + 2 * ISOLATION_BEFORE_PROBE_MS).toISOString()
    )
    expect(third.isolationCounts.qwen).toBe(3)
    expect(third.isolated.qwen?.untilTs).toBe(
      new Date(Date.parse(thirdStart) + 4 * ISOLATION_BEFORE_PROBE_MS).toISOString()
    )
  })

  test('第 4 次起試探間隔封頂 168h', () => {
    const fourth = applyFirstIsolation(
      { ...empty(), isolationCounts: { qwen: 3 } },
      'qwen',
      'fourth',
      T0
    )
    const fifth = applyFirstIsolation(
      readyForNextIsolation(fourth),
      'qwen',
      'fifth',
      fourth.isolated.qwen!.untilTs
    )

    expect(fourth.isolated.qwen?.untilTs).toBe(
      new Date(T0_MS + 7 * ISOLATION_BEFORE_PROBE_MS).toISOString()
    )
    expect(fifth.isolationCounts.qwen).toBe(5)
    expect(fifth.isolated.qwen?.untilTs).toBe(
      new Date(Date.parse(fourth.isolated.qwen!.untilTs) + 7 * ISOLATION_BEFORE_PROBE_MS).toISOString()
    )
  })

  test('已隔離不再重設（非首次）', () => {
    const first = applyFirstIsolation(empty(), 'qwen', 'a', T0)
    const second = applyFirstIsolation(first, 'qwen', 'b', AFTER_24H)
    expect(second.isolated.qwen).toEqual(first.isolated.qwen)
    expect(second).toBe(first) // 無變更時保持同一參考
  })

  test('不突變輸入', () => {
    const base = empty()
    const next = applyFirstIsolation(base, 'qwen', 'r', T0)
    expect(base.isolated).toEqual({})
    expect(next.isolated).not.toBe(base.isolated)
  })
})

describe('隔離後滿 24 小時的單次試探', () => {
  test('未滿 24h → 不可試探', () => {
    const s = applyFirstIsolation(empty(), 'qwen', 'r', T0)
    expect(isSingleProbeEligible(s, 'qwen', AFTER_23H)).toBe(false)
    expect(recordProbeAttempt(s, 'qwen', AFTER_23H)).toBe(s)
  })

  test('恰滿 24h → 可單次試探一次', () => {
    const s = applyFirstIsolation(empty(), 'qwen', 'r', T0)
    expect(isSingleProbeEligible(s, 'qwen', AT_24H)).toBe(true)
    const probed = recordProbeAttempt(s, 'qwen', AT_24H)
    expect(probed.probes.qwen).toEqual({ hits: 1, lastTs: AT_24H })
    expect(isIsolated(probed, 'qwen')).toBe(true) // 試探本身不解除
  })

  test('同窗第二次試探被拒', () => {
    const s = applyFirstIsolation(empty(), 'qwen', 'r', T0)
    const once = recordProbeAttempt(s, 'qwen', AT_24H)
    expect(isSingleProbeEligible(once, 'qwen', AFTER_24H)).toBe(false)
    expect(recordProbeAttempt(once, 'qwen', AFTER_24H)).toBe(once)
  })

  test('未隔離 → 不可試探', () => {
    expect(isSingleProbeEligible(empty(), 'qwen', AFTER_24H)).toBe(false)
  })
})

describe('試探成功解除', () => {
  test('probe success 刪除 isolated 與 probes 該 tag', () => {
    const isolated = applyFirstIsolation(empty(), 'qwen', 'r', T0)
    const probed = recordProbeAttempt(isolated, 'qwen', AT_24H)
    const lifted = applyProbeSuccess(probed, 'qwen', AFTER_24H)
    expect(isIsolated(lifted, 'qwen')).toBe(false)
    expect(lifted.isolated).toEqual({})
    expect(lifted.probes).toEqual({})
    expect(lifted.isolationCounts.qwen).toBe(0)
    expect(lifted.updatedAt).toBe(AFTER_24H)
  })

  test('試探成功歸零，下一次隔離回到 24h', () => {
    const lifted = applyProbeSuccess(
      recordProbeAttempt(applyFirstIsolation(empty(), 'qwen', 'r', T0), 'qwen', AT_24H),
      'qwen',
      AFTER_24H
    )
    const again = applyFirstIsolation(lifted, 'qwen', 'again', AFTER_24H)
    expect(lifted.isolationCounts.qwen).toBe(0)
    expect(again.isolationCounts.qwen).toBe(1)
    expect(again.isolated.qwen?.reason).toBe('again')
    expect(again.isolated.qwen?.untilTs).toBe(
      new Date(Date.parse(AFTER_24H) + ISOLATION_BEFORE_PROBE_MS).toISOString()
    )
  })

  test('未隔離時 applyProbeSuccess 為 no-op', () => {
    const base = empty()
    expect(applyProbeSuccess(base, 'qwen', T0)).toBe(base)
  })

  test('已清理隔離但仍有回退計數時，成功試探仍會歸零', () => {
    const reset = applyProbeSuccess(
      { ...empty(), isolationCounts: { qwen: 2 } },
      'qwen',
      T0
    )
    expect(reset.isolationCounts.qwen).toBe(0)
  })
})

describe('4 樣本 50% 晉升邊界', () => {
  test('常數門檻', () => {
    expect(PROMOTE_MIN_SAMPLES).toBe(4)
    expect(PROMOTE_MIN_SUCCESS_RATE).toBe(0.5)
  })

  test('恰 4 樣本、恰 50% → 可晉升', () => {
    expect(shouldPromote(4, 0.5)).toBe(true)
    expect(shouldPromote(4, 2 / 4)).toBe(true)
  })

  test('4 樣本但低於 50% → 不可晉升', () => {
    expect(shouldPromote(4, 0.49)).toBe(false)
    expect(shouldPromote(4, 1 / 4)).toBe(false)
  })

  test('成功率 100% 但樣本不足 4 → 不可晉升', () => {
    expect(shouldPromote(3, 1)).toBe(false)
    expect(shouldPromote(0, 1)).toBe(false)
  })

  test('高於邊界仍可晉升', () => {
    expect(shouldPromote(4, 0.75)).toBe(true)
    expect(shouldPromote(10, 0.5)).toBe(true)
  })

  test('shouldPromote 通過後 applyPromotion 寫入 promoted', () => {
    const rate = 2 / 4
    expect(shouldPromote(4, rate)).toBe(true)
    const next = applyPromotion(empty(), 'codex', 2, T0)
    expect(next.promoted.codex).toEqual({ score: 2, promotedAt: T0 })
  })
})
