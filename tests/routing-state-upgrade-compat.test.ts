/**
 * 狀態檔升級相容：舊欄位名稱 / 缺新欄 / 混合舊新格式。
 * 契約：讀取後安全回填或 reuse-current，且不影響 candidateEngines 原派工結果。
 */
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  REUSE_CURRENT,
  ROUTING_STATE_FILENAME,
  defaultRoutingState,
  hasReadableRoutingMaps,
  loadRoutingState,
  normalizeRoutingState,
  shouldApplyRoutingState,
} from '../src/engines/routing-state.js'
import { candidateEngines } from '../src/engines/rotation.js'

const NOW = '2026-07-20T12:00:00.000Z'
const ROTATION = ['claude', 'codex', 'qwen'] as const
const TASK = { id: 'deadbeef' }

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'adng-rs-upgrade-'))
}

function writeState(dir: string, body: unknown): void {
  writeFileSync(join(dir, ROUTING_STATE_FILENAME), JSON.stringify(body))
}

/** 固定派工快照：狀態讀取不得改變此結果。 */
function dispatchSnapshot(): string[] {
  return candidateEngines([...ROTATION], 'claude', TASK, 0)
}

describe('狀態檔升級相容：舊版 JSON 欄位名稱', () => {
  test('頂層 isolation / promotions / probe + updated_at → 對應新版 map', () => {
    const raw = {
      version: 1,
      updated_at: '2026-07-18T00:00:00.000Z',
      isolation: { qwen: { untilTs: '2026-07-21T00:00:00.000Z', reason: 'old-name' } },
      promotions: { codex: { score: 2, promotedAt: '2026-07-17T00:00:00.000Z' } },
      probe: { opencode: { hits: 1, lastTs: '2026-07-18T01:00:00.000Z' } },
    }
    const state = normalizeRoutingState(raw, NOW)
    expect(state).toEqual({
      version: 1,
      updatedAt: '2026-07-18T00:00:00.000Z',
      isolated: { qwen: { untilTs: '2026-07-21T00:00:00.000Z', reason: 'old-name' } },
      isolationCounts: {},
      promoted: { codex: { score: 2, promotedAt: '2026-07-17T00:00:00.000Z' } },
      probes: { opencode: { hits: 1, lastTs: '2026-07-18T01:00:00.000Z' } },
    })
    expect(hasReadableRoutingMaps(raw)).toBe(true)
  })

  test('entry 內 until_ts / promoted_at / last_ts 舊 snake_case 可讀', () => {
    const state = normalizeRoutingState(
      {
        isolation: { a: { until_ts: 'U', reason: 'r' } },
        promotions: { b: { score: 4, promoted_at: 'P' } },
        probe: { c: { hits: 3, last_ts: 'L' } },
      },
      NOW
    )
    expect(state?.isolated.a).toEqual({ untilTs: 'U', reason: 'r' })
    expect(state?.promoted.b).toEqual({ score: 4, promotedAt: 'P' })
    expect(state?.probes.c).toEqual({ hits: 3, lastTs: 'L' })
  })

  test('loadRoutingState 舊欄位檔 → kind:state 且 shouldApply=true', () => {
    const dir = tmpDir()
    writeState(dir, {
      updated_at: '2026-07-10T00:00:00.000Z',
      isolation: { qwen: { until_ts: '2099-01-01T00:00:00.000Z', reason: 'legacy' } },
    })
    const result = loadRoutingState(dir, { nowIso: NOW })
    expect(result.kind).toBe('state')
    if (result.kind !== 'state') throw new Error('expected state')
    expect(result.state.version).toBe(1)
    expect(result.state.updatedAt).toBe('2026-07-10T00:00:00.000Z')
    expect(result.state.isolated.qwen).toEqual({
      untilTs: '2099-01-01T00:00:00.000Z',
      reason: 'legacy',
    })
    expect(result.state.promoted).toEqual({})
    expect(result.state.probes).toEqual({})
    expect(result.state.isolationCounts).toEqual({})
    expect(shouldApplyRoutingState(result)).toBe(true)
  })
})

describe('狀態檔升級相容：缺少新版欄位', () => {
  test('僅部分 map、無 version / updatedAt / probes → 補齊預設', () => {
    const dir = tmpDir()
    writeState(dir, {
      isolated: { x: { untilTs: 't', reason: 'r' } },
    })
    const result = loadRoutingState(dir, { nowIso: NOW })
    expect(result.kind).toBe('state')
    if (result.kind !== 'state') throw new Error('expected state')
    expect(result.state).toEqual({
      version: 1,
      updatedAt: NOW,
      isolated: { x: { untilTs: 't', reason: 'r' } },
      isolationCounts: {},
      promoted: {},
      probes: {},
    })
  })

  test('空物件 → 全預設 v1，仍 usable（kind:state）', () => {
    const dir = tmpDir()
    writeState(dir, {})
    const result = loadRoutingState(dir, { nowIso: NOW })
    expect(result.kind).toBe('state')
    if (result.kind !== 'state') throw new Error('expected state')
    expect(result.state).toEqual(defaultRoutingState(NOW))
  })

  test('entry 缺 untilTs / score / hits → 安全空字串或 0', () => {
    const state = normalizeRoutingState(
      {
        version: 1,
        isolated: { a: { reason: 'only-reason' } },
        promoted: { b: {} },
        probes: { c: {} },
      },
      NOW
    )
    expect(state?.isolated.a).toEqual({ untilTs: '', reason: 'only-reason' })
    expect(state?.promoted.b).toEqual({ score: 0, promotedAt: '' })
    expect(state?.probes.c).toEqual({ hits: 0, lastTs: '' })
  })
})

describe('狀態檔升級相容：混合舊新格式', () => {
  test('新舊頂層同在時新版鍵優先，舊別名不覆寫', () => {
    const state = normalizeRoutingState(
      {
        version: 1,
        updatedAt: 'new-ts',
        updated_at: 'old-ts',
        isolated: { keep: { untilTs: 'NEW', reason: 'new' } },
        isolation: { drop: { until_ts: 'OLD', reason: 'old' } },
        promoted: { p: { score: 9, promotedAt: 'N' } },
        promotions: { q: { score: 1, promoted_at: 'O' } },
        probes: { pr: { hits: 5, lastTs: 'N' } },
        probe: { junk: { hits: 1, last_ts: 'O' } },
      },
      NOW
    )
    expect(state?.updatedAt).toBe('new-ts')
    expect(state?.isolated).toEqual({ keep: { untilTs: 'NEW', reason: 'new' } })
    expect(state?.promoted).toEqual({ p: { score: 9, promotedAt: 'N' } })
    expect(state?.probes).toEqual({ pr: { hits: 5, lastTs: 'N' } })
  })

  test('同 entry 內 camel + snake 並存 → camel 優先', () => {
    const state = normalizeRoutingState(
      {
        isolated: {
          a: { untilTs: 'CAMEL', until_ts: 'SNAKE', reason: 'r' },
        },
        promoted: {
          b: { score: 2, promotedAt: 'CAMEL', promoted_at: 'SNAKE' },
        },
        probes: {
          c: { hits: 1, lastTs: 'CAMEL', last_ts: 'SNAKE' },
        },
      },
      NOW
    )
    expect(state).not.toBeNull()
    if (!state) throw new Error('expected state')
    expect(state.isolated.a?.untilTs).toBe('CAMEL')
    expect(state.promoted.b?.promotedAt).toBe('CAMEL')
    expect(state.probes.c?.lastTs).toBe('CAMEL')
  })

  test('未來 version + 舊別名 map 仍可降級讀取', () => {
    const dir = tmpDir()
    writeState(dir, {
      version: 9,
      isolation: { z: { until_ts: 'u', reason: 'future-legacy' } },
      extraFuture: { nested: true },
    })
    const result = loadRoutingState(dir, { nowIso: NOW })
    expect(result.kind).toBe('state')
    if (result.kind !== 'state') throw new Error('expected state')
    expect(result.state.version).toBe(1)
    expect(result.state.isolated.z).toEqual({ untilTs: 'u', reason: 'future-legacy' })
  })

  test('未來 version 且只有未知欄、無 map → unsupported-version 回退', () => {
    const dir = tmpDir()
    writeState(dir, { version: 99, legacyBlob: { a: 1 } })
    const result = loadRoutingState(dir, { nowIso: NOW })
    expect(result).toMatchObject({
      kind: 'reuse-current',
      decision: REUSE_CURRENT,
      reason: 'unsupported-version',
    })
    expect(shouldApplyRoutingState(result)).toBe(false)
  })
})

describe('狀態檔升級相容：不影響原派工結果', () => {
  test.each([
    ['缺檔', null],
    ['損壞', '{{{'],
    ['舊欄位完整', {
      isolation: { qwen: { until_ts: '2099-01-01T00:00:00.000Z', reason: 'x' } },
      promotions: { codex: { score: 1, promoted_at: NOW } },
    }],
    ['缺新欄', { isolated: { a: { untilTs: 't', reason: 'r' } } }],
    ['混合', {
      version: 1,
      updatedAt: NOW,
      isolation: { ignore: { until_ts: 'o', reason: 'o' } },
      isolated: { qwen: { untilTs: 'u', reason: 'r' } },
      probe: { p: { hits: 1, last_ts: NOW } },
    }],
    ['不支援版本', { version: 50, payload: {} }],
  ] as const)('%s：candidateEngines 快照不變', (_label, body) => {
    const before = dispatchSnapshot()
    const dir = tmpDir()
    if (body === null) {
      // 缺檔
    } else if (typeof body === 'string') {
      writeFileSync(join(dir, ROUTING_STATE_FILENAME), body)
    } else {
      writeState(dir, body)
    }
    const loaded = loadRoutingState(dir, { nowIso: NOW })
    // 無論 apply 與否，本模組不得改寫 rotation 純函式結果
    const after = dispatchSnapshot()
    expect(after).toEqual(before)
    expect(after).toEqual(candidateEngines([...ROTATION], 'claude', TASK, 0))
    // reuse-current 時明確不得套用
    if (loaded.kind === 'reuse-current') {
      expect(shouldApplyRoutingState(loaded)).toBe(false)
      expect(loaded.decision).toBe(REUSE_CURRENT)
    }
  })

  test('舊格式成功正規化後 shouldApply=true，但仍不改 candidateEngines 純結果', () => {
    const dir = tmpDir()
    writeState(dir, {
      isolation: { bad: { until_ts: '2099-01-01T00:00:00.000Z', reason: 'x' } },
    })
    const loaded = loadRoutingState(dir, { nowIso: NOW })
    expect(shouldApplyRoutingState(loaded)).toBe(true)
    expect(dispatchSnapshot()).toEqual(candidateEngines([...ROTATION], 'claude', TASK, 0))
  })
})
