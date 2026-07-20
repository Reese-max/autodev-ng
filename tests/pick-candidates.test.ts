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

  test('subscription 未出現者補進尾端，已存在者不重複', () => {
    expect(defaultCandidateTailEnhancer(['a', 'b'], ['b', 'spark', 'a', 'terra'])).toEqual([
      'a',
      'b',
      'spark',
      'terra',
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
