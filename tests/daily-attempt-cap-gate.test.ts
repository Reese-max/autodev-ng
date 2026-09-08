import { describe, expect, test, vi } from 'vitest'
import {
  dailyAttemptCapsFromEngines,
  defaultDailyAttemptCapGate,
  loadDailyAttemptCapContext,
  loadTodayAttemptCounts,
  todayCountsFromSummary,
} from '../src/engines/daily-attempt-cap-gate.js'
import type { TodayAttemptsSummary } from '../src/engines/today-attempts.js'

function caps(entries: [string, number][]): Map<string, number> {
  return new Map(entries)
}

function counts(entries: [string, number][]): Map<string, number> {
  return new Map(entries)
}

describe('defaultDailyAttemptCapGate', () => {
  test('無 caps → 原清單（向後相容）', () => {
    expect(defaultDailyAttemptCapGate(['a', 'b'], new Map(), counts([['a', 99]]))).toEqual([
      'a',
      'b',
    ])
  })

  test('今日 attempts 未達 cap → 保留', () => {
    expect(
      defaultDailyAttemptCapGate(
        ['a', 'b'],
        caps([['a', 3]]),
        counts([['a', 2]]),
      ),
    ).toEqual(['a', 'b'])
  })

  test('今日 attempts 已達 cap → 視為不可用並輪替下一候選', () => {
    expect(
      defaultDailyAttemptCapGate(
        ['a', 'b', 'c'],
        caps([
          ['a', 2],
          ['b', 5],
        ]),
        counts([
          ['a', 2],
          ['b', 1],
          ['c', 100],
        ]),
      ),
    ).toEqual(['b', 'c']) // a 達 cap 跳過；c 無 cap 不限
  })

  test('attempts 超過 cap 亦跳過', () => {
    expect(
      defaultDailyAttemptCapGate(['x', 'y'], caps([['x', 1]]), counts([['x', 5]])),
    ).toEqual(['y'])
  })

  test('counts 缺該 tag → 視為 0（未達 cap）', () => {
    expect(
      defaultDailyAttemptCapGate(['a'], caps([['a', 1]]), new Map()),
    ).toEqual(['a'])
  })

  test('全部達 cap → 延後派工', () => {
    expect(
      defaultDailyAttemptCapGate(
        ['a', 'b'],
        caps([
          ['a', 1],
          ['b', 1],
        ]),
        counts([
          ['a', 1],
          ['b', 9],
        ]),
      ),
    ).toEqual([])
  })

  test('空候選 → 空陣列', () => {
    expect(defaultDailyAttemptCapGate([], caps([['a', 1]]), counts([['a', 1]]))).toEqual([])
  })
})

describe('dailyAttemptCapsFromEngines', () => {
  test('只收集正整數 cap；未設略過', () => {
    expect(
      [...dailyAttemptCapsFromEngines({
        free: { dailyAttemptCap: 12 },
        paid: {},
        bad: { dailyAttemptCap: undefined },
      }).entries()],
    ).toEqual([['free', 12]])
  })

  test('engines 未設 → 空 map', () => {
    expect(dailyAttemptCapsFromEngines(undefined).size).toBe(0)
  })
})

describe('todayCountsFromSummary', () => {
  test('轉 tag → attempts', () => {
    expect(
      [...todayCountsFromSummary({
        engines: [
          { engine: 'qwen', attempts: 2, ok: 1 },
          { engine: 'codex', attempts: 1, ok: 0 },
        ],
      }).entries()],
    ).toEqual([
      ['qwen', 2],
      ['codex', 1],
    ])
  })
})

describe('loadTodayAttemptCounts', () => {
  test('summaryFn 拋錯 → 空 map fail-open', () => {
    const result = loadTodayAttemptCounts('any.db', {
      summaryFn: () => {
        throw new Error('db wedge')
      },
    })
    expect(result.size).toBe(0)
  })

  test('空 dbFile → 空 map', () => {
    expect(loadTodayAttemptCounts('').size).toBe(0)
  })

  test('正常 summary → 計數', () => {
    const summary: TodayAttemptsSummary = {
      day: '2026-07-21',
      engines: [{ engine: 'qwen', attempts: 3, ok: 1 }],
      totalAttempts: 3,
      totalOk: 1,
    }
    expect([...loadTodayAttemptCounts('x.db', { summaryFn: () => summary }).entries()]).toEqual([
      ['qwen', 3],
    ])
  })
})

describe('loadDailyAttemptCapContext', () => {
  test('無任何 dailyAttemptCap → 不讀 db、counts 空', () => {
    const summaryFn = vi.fn(() => {
      throw new Error('should not call')
    })
    const ctx = loadDailyAttemptCapContext(
      { a: { adapter: 'mock' } as { dailyAttemptCap?: number } },
      '/tmp/nope',
      { summaryFn },
    )
    expect(ctx.dailyAttemptCaps.size).toBe(0)
    expect(ctx.todayAttemptCounts.size).toBe(0)
    expect(summaryFn).not.toHaveBeenCalled()
  })

  test('有 cap 且 helper 失敗 → 禁止有上限的引擎派工', () => {
    const ctx = loadDailyAttemptCapContext(
      { free: { dailyAttemptCap: 2 } },
      '/tmp/nope',
      {
        summaryFn: () => {
          throw new Error('read fail')
        },
      },
    )
    expect([...ctx.dailyAttemptCaps.entries()]).toEqual([['free', 2]])
    expect(ctx.todayAttemptCounts.get('free')).toBe(Infinity)
    // 未知次數不能當成零；無上限引擎仍可用
    expect(
      defaultDailyAttemptCapGate(
        ['free', 'paid'],
        ctx.dailyAttemptCaps,
        ctx.todayAttemptCounts,
      ),
    ).toEqual(['paid'])
  })

  test('有 cap 且今日達額 → 輪替下一檔', () => {
    const ctx = loadDailyAttemptCapContext(
      {
        free: { dailyAttemptCap: 2 },
        paid: { dailyAttemptCap: 10 },
      },
      '/tmp/x',
      {
        summaryFn: () => ({
          day: '2026-07-21',
          engines: [
            { engine: 'free', attempts: 2, ok: 0 },
            { engine: 'paid', attempts: 1, ok: 1 },
          ],
          totalAttempts: 3,
          totalOk: 1,
        }),
      },
    )
    expect(
      defaultDailyAttemptCapGate(
        ['free', 'paid'],
        ctx.dailyAttemptCaps,
        ctx.todayAttemptCounts,
      ),
    ).toEqual(['paid'])
  })
})
