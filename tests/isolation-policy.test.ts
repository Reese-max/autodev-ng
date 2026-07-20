import { describe, expect, test } from 'vitest'
import {
  ISOLATE_MAX_SUCCESS_RATE,
  ISOLATE_MIN_SAMPLES,
  ISOLATE_WINDOW_DAYS,
  isolationReason,
  selectEnginesToIsolate,
  shouldIsolateEngine,
} from '../src/engines/isolation-policy.js'
import type { EngineRunStats } from '../src/engines/run-stats.js'

describe('shouldIsolateEngine', () => {
  test('樣本≥6 且成功率<30% → 隔離', () => {
    expect(shouldIsolateEngine(6, 0.29)).toBe(true)
    expect(shouldIsolateEngine(10, 0)).toBe(true)
    expect(shouldIsolateEngine(6, 0.166)).toBe(true)
  })

  test('恰 30% 或更高 → 不隔離', () => {
    expect(shouldIsolateEngine(6, ISOLATE_MAX_SUCCESS_RATE)).toBe(false)
    expect(shouldIsolateEngine(6, 0.5)).toBe(false)
    expect(shouldIsolateEngine(100, 1)).toBe(false)
  })

  test('樣本不足 6 → 不隔離（即使成功率 0）', () => {
    expect(shouldIsolateEngine(5, 0)).toBe(false)
    expect(shouldIsolateEngine(0, 0)).toBe(false)
    expect(shouldIsolateEngine(ISOLATE_MIN_SAMPLES - 1, 0.1)).toBe(false)
  })

  test('非有限數字 → 不隔離', () => {
    expect(shouldIsolateEngine(Number.NaN, 0)).toBe(false)
    expect(shouldIsolateEngine(10, Number.POSITIVE_INFINITY)).toBe(false)
  })
})

describe('isolationReason', () => {
  test('含近3日、樣本數與成功率', () => {
    const r = isolationReason(8, 0.125)
    expect(r).toContain(`近${ISOLATE_WINDOW_DAYS}日`)
    expect(r).toContain('樣本8')
    expect(r).toContain('12.5%')
    expect(r).toContain('<30%')
  })
})

describe('selectEnginesToIsolate', () => {
  const rows: EngineRunStats[] = [
    { engine: 'qwen', sampleCount: 8, ok: 1, fail: 7, successRate: 0.125 },
    { engine: 'codex', sampleCount: 6, ok: 2, fail: 4, successRate: 1 / 3 },
    { engine: 'opencode', sampleCount: 10, ok: 5, fail: 5, successRate: 0.5 },
    { engine: 'agy', sampleCount: 3, ok: 0, fail: 3, successRate: 0 },
  ]

  test('無 rotation → 空清單（維持原路徑）', () => {
    expect(selectEnginesToIsolate(rows, undefined)).toEqual([])
    expect(selectEnginesToIsolate(rows, [])).toEqual([])
  })

  test('只挑 rotation 內且達門檻者', () => {
    const got = selectEnginesToIsolate(rows, ['qwen', 'codex', 'opencode', 'agy'])
    expect(got.map(g => g.engine)).toEqual(['qwen'])
    expect(got[0]!.sampleCount).toBe(8)
    expect(got[0]!.successRate).toBe(0.125)
    expect(got[0]!.reason).toContain('樣本8')
  })

  test('不在 rotation 的爛戰績不隔離', () => {
    expect(selectEnginesToIsolate(rows, ['codex', 'opencode'])).toEqual([])
  })

  test('codex 恰 ~33% 不隔離', () => {
    const got = selectEnginesToIsolate(
      [{ engine: 'codex', sampleCount: 6, ok: 2, fail: 4, successRate: 2 / 6 }],
      ['codex']
    )
    // 2/6 ≈ 0.333 > 0.3
    expect(got).toEqual([])
  })
})
