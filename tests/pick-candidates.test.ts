import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  defaultCandidateTailEnhancer,
  defaultQuarantineGate,
  loadActiveIsolatedTags,
  pickCandidateTags,
} from '../src/engines/pick-candidates.js'
import { ROUTING_STATE_VERSION } from '../src/engines/routing-state.js'

const ROT = ['a', 'b', 'c']
const NOW = '2026-07-20T12:00:00.000Z'

describe('defaultQuarantineGate', () => {
  test('無隔離 → 原清單', () => {
    expect(defaultQuarantineGate(['a', 'b'], new Set())).toEqual(['a', 'b'])
  })

  test('有健康候選時過濾隔離檔位', () => {
    expect(defaultQuarantineGate(['a', 'b', 'c'], new Set(['b']))).toEqual(['a', 'c'])
  })

  test('全部隔離 → fail-open 回原清單', () => {
    expect(defaultQuarantineGate(['a', 'b'], new Set(['a', 'b', 'x']))).toEqual(['a', 'b'])
  })
})

describe('defaultCandidateTailEnhancer', () => {
  test('空 subscription → 原清單', () => {
    expect(defaultCandidateTailEnhancer(['a', 'b'], [])).toEqual(['a', 'b'])
  })

  test('subscription 白名單與既有輪替重疊 → 保留輪替優先序且每項唯一', () => {
    expect(defaultCandidateTailEnhancer(['a', 'b', 'c'], ['c', 'spark', 'a', 'b'])).toEqual([
      'a',
      'b',
      'c',
      'spark',
    ])
  })

  test('多個候補同時符合 → 依白名單順序補尾且重複候補只留首次', () => {
    expect(defaultCandidateTailEnhancer(['a'], ['terra', 'spark', 'terra', 'nova', 'spark'])).toEqual([
      'a',
      'terra',
      'spark',
      'nova',
    ])
  })

  test('略過空字串 subscription tag', () => {
    expect(defaultCandidateTailEnhancer(['a'], ['', 'spark'])).toEqual(['a', 'spark'])
  })
})

describe('pickCandidateTags 單一入口', () => {
  test('無隔離、無 subscription → 等同 candidateEngines 旋轉序', () => {
    expect(
      pickCandidateTags({
        rotation: ROT,
        defaultEngine: 'claude',
        task: { id: '00000000' },
        failCount: 0,
      })
    ).toEqual(['a', 'b', 'c'])
  })

  test('隔離後跳過派工（有健康候選）', () => {
    expect(
      pickCandidateTags({
        rotation: ROT,
        defaultEngine: 'claude',
        task: { id: '00000000' },
        failCount: 0,
        isolatedTags: ['a'],
      })
    ).toEqual(['b', 'c'])
  })

  test('subscription 候補補進尾端', () => {
    expect(
      pickCandidateTags({
        rotation: ROT,
        defaultEngine: 'claude',
        task: { id: '00000000' },
        failCount: 0,
        subscriptionTags: ['spark', 'b'],
      })
    ).toEqual(['a', 'b', 'c', 'spark'])
  })

  test('隔離 + subscription 管線：先濾隔離再補尾', () => {
    expect(
      pickCandidateTags({
        rotation: ROT,
        defaultEngine: 'claude',
        task: { id: '00000000' },
        failCount: 0,
        isolatedTags: ['a', 'c'],
        subscriptionTags: ['spark'],
      })
    ).toEqual(['b', 'spark'])
  })

  test('全部隔離 fail-open 後仍可補 subscription 尾端', () => {
    expect(
      pickCandidateTags({
        rotation: ROT,
        defaultEngine: 'claude',
        task: { id: '00000000' },
        failCount: 0,
        isolatedTags: ['a', 'b', 'c'],
        subscriptionTags: ['spark'],
      })
    ).toEqual(['a', 'b', 'c', 'spark'])
  })

  test('顯式 engineTag：過隔離閘、不補 subscription 尾端', () => {
    expect(
      pickCandidateTags({
        rotation: ROT,
        defaultEngine: 'claude',
        task: { id: '00000000', engineTag: 'x' },
        failCount: 0,
        isolatedTags: ['x'],
        subscriptionTags: ['spark'],
      })
    ).toEqual(['x']) // 單一候選全隔離 → fail-open 保留
    expect(
      pickCandidateTags({
        rotation: ROT,
        defaultEngine: 'claude',
        task: { id: '00000000', engineTag: 'x' },
        failCount: 0,
        subscriptionTags: ['spark'],
      })
    ).toEqual(['x'])
  })

  test('hooks 可替換 quarantine gate 與 candidate-tail enhancer', () => {
    const tags = pickCandidateTags(
      {
        rotation: ROT,
        defaultEngine: 'claude',
        task: { id: '00000000' },
        failCount: 0,
        isolatedTags: ['a'],
        subscriptionTags: ['spark'],
      },
      {
        quarantineGate: (c) => c.filter(t => t !== 'b'),
        candidateTailEnhancer: (c) => [...c, 'hook-tail'],
      }
    )
    // base [a,b,c] → hook gate 去 b → [a,c] → hook tail
    expect(tags).toEqual(['a', 'c', 'hook-tail'])
  })

  test('未設 rotation → defaultEngine 路徑（向後相容）', () => {
    expect(
      pickCandidateTags({
        rotation: undefined,
        defaultEngine: 'claude',
        task: { id: '00000000' },
        failCount: 3,
        subscriptionTags: ['spark'],
      })
    ).toEqual(['claude', 'spark'])
  })

  test('向後相容：未設 engineRotation 或 run.db 無可用資料時，完整候選輸出維持現況', () => {
    // run.db 各路由讀取器的 fail-open 輸出：無隔離、無額度計數、無加權戰績。
    const fallback = {
      defaultEngine: 'claude',
      task: { id: '00000001' },
      failCount: 0,
      isolatedTags: [],
      subscriptionTags: ['spark'],
      dailyAttemptCaps: new Map<string, number>(),
      todayAttemptCounts: new Map<string, number>(),
      zeroCostTags: new Set<string>(),
    }

    expect({
      noRotation: pickCandidateTags({
        ...fallback,
        rotation: undefined,
        engineStats: [{ engine: 'a', n: 10, ok: 10 }],
      }),
      noUsableRunStats: pickCandidateTags({
        ...fallback,
        rotation: ROT,
        engineStats: [],
      }),
    }).toEqual({
      noRotation: ['claude', 'spark'],
      noUsableRunStats: ['b', 'c', 'a', 'spark'],
    })
  })

  test('日額度：達 cap 的候選跳過並輪替下一檔', () => {
    expect(
      pickCandidateTags({
        rotation: ROT,
        defaultEngine: 'claude',
        task: { id: '00000000' },
        failCount: 0,
        dailyAttemptCaps: new Map([
          ['a', 1],
          ['b', 5],
        ]),
        todayAttemptCounts: new Map([
          ['a', 1],
          ['b', 0],
        ]),
      })
    ).toEqual(['b', 'c'])
  })

  test('日額度：helper/counts 空 → 不攔截（fail-open 原路徑）', () => {
    expect(
      pickCandidateTags({
        rotation: ROT,
        defaultEngine: 'claude',
        task: { id: '00000000' },
        failCount: 0,
        dailyAttemptCaps: new Map([['a', 1]]),
        todayAttemptCounts: new Map(),
      })
    ).toEqual(['a', 'b', 'c'])
  })

  test('日額度：未傳 caps → 向後相容原路徑', () => {
    expect(
      pickCandidateTags({
        rotation: ROT,
        defaultEngine: 'claude',
        task: { id: '00000000' },
        failCount: 0,
        todayAttemptCounts: new Map([['a', 99]]),
      })
    ).toEqual(['a', 'b', 'c'])
  })

  test('日額度在 subscription 補尾之後套用（達 cap 的尾端也跳過）', () => {
    expect(
      pickCandidateTags({
        rotation: ROT,
        defaultEngine: 'claude',
        task: { id: '00000000' },
        failCount: 0,
        subscriptionTags: ['spark'],
        dailyAttemptCaps: new Map([
          ['a', 1],
          ['spark', 1],
        ]),
        todayAttemptCounts: new Map([
          ['a', 1],
          ['spark', 1],
        ]),
      })
    ).toEqual(['b', 'c']) // a、spark 達 cap；b/c 無 cap
  })

  test('日額度：全部達 cap → fail-open 保留清單', () => {
    expect(
      pickCandidateTags({
        rotation: ['a', 'b'],
        defaultEngine: 'claude',
        task: { id: '00000000' },
        failCount: 0,
        dailyAttemptCaps: new Map([
          ['a', 1],
          ['b', 1],
        ]),
        todayAttemptCounts: new Map([
          ['a', 1],
          ['b', 1],
        ]),
      })
    ).toEqual(['a', 'b'])
  })

  test('hooks 可替換 dailyAttemptCapGate', () => {
    const tags = pickCandidateTags(
      {
        rotation: ROT,
        defaultEngine: 'claude',
        task: { id: '00000000' },
        failCount: 0,
        dailyAttemptCaps: new Map([['a', 1]]),
        todayAttemptCounts: new Map([['a', 1]]),
      },
      {
        dailyAttemptCapGate: (c) => c.filter(t => t !== 'c'),
      }
    )
    expect(tags).toEqual(['a', 'b'])
  })
})

describe('loadActiveIsolatedTags', () => {
  test('缺檔 → 空陣列 fail-open', () => {
    const dir = mkdtempSync(join(tmpdir(), 'adng-iso-missing-'))
    expect(loadActiveIsolatedTags(dir, NOW)).toEqual([])
  })

  test('狀態檔有效隔離 → 只回仍在期內的 tag', () => {
    const dir = mkdtempSync(join(tmpdir(), 'adng-iso-active-'))
    writeFileSync(
      join(dir, 'engine-routing-state.json'),
      JSON.stringify({
        version: ROUTING_STATE_VERSION,
        updatedAt: NOW,
        isolated: {
          a: { untilTs: '2026-07-21T00:00:00.000Z', reason: 'probe-fail' },
          b: { untilTs: '2026-07-19T00:00:00.000Z', reason: 'expired' },
          c: { untilTs: '', reason: 'empty' },
        },
        promoted: {},
        probes: {},
      })
    )
    expect(loadActiveIsolatedTags(dir, NOW)).toEqual(['a'])
  })
})

describe('zeroCostTags 免費起跑', () => {
  test('新任務起點只落零成本檔位；未設 zeroCostTags 行為不變', () => {
    const rotation = ['free-a', 'paid-x', 'free-b']
    for (let i = 0; i < 12; i++) {
      const id = i.toString(16).padStart(8, '0')
      const tags = pickCandidateTags({
        rotation, defaultEngine: 'claude', task: { id }, failCount: 0,
        zeroCostTags: new Set(['free-a', 'free-b']),
      })
      expect(['free-a', 'free-b']).toContain(tags[0])
    }
    // 未設 → 原 hash 公式，id 00000001 起點落 paid-x（1 % 3 = 1）
    expect(pickCandidateTags({ rotation, defaultEngine: 'claude', task: { id: '00000001' }, failCount: 0 })[0]).toBe('paid-x')
  })

  test('zeroCostTags 與 rotation 無交集 → fail-open 走原公式', () => {
    const rotation = ['paid-x', 'paid-y']
    const tags = pickCandidateTags({
      rotation, defaultEngine: 'claude', task: { id: '00000001' }, failCount: 0,
      zeroCostTags: new Set(['free-a']),
    })
    expect(tags[0]).toBe('paid-y') // 1 % 2 = 1，原公式
  })
})
