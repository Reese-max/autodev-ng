/**
 * 路由狀態一致性檢查器：run.db × engineRotation × dataDir 狀態檔交叉。
 * 守門：無資料維持原路徑；不一致只警告、不改派工、不寫檔。
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  analyzeRoutingConsistency,
  checkRoutingStateConsistency,
  REUSE_CURRENT,
} from '../src/engines/routing-state-consistency.js'
import {
  ROUTING_STATE_FILENAME,
  defaultRoutingState,
  loadRoutingState,
  saveRoutingState,
  type RoutingState,
} from '../src/engines/routing-state.js'
import { ISOLATE_MIN_SAMPLES } from '../src/engines/isolation-policy.js'
import { clearRunStatsCache, type RunStatsResult } from '../src/engines/run-stats.js'
import { RunDb } from '../src/db.js'

const NOW = '2026-07-20T12:00:00.000Z'
const NOW_MS = Date.parse(NOW)
const ROT = ['qwen', 'codex', 'opencode']
const UNTIL = new Date(NOW_MS + 24 * 3600_000).toISOString()

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'adng-consist-'))
}

afterEach(() => {
  clearRunStatsCache()
})

function baseState(partial: Partial<RoutingState> = {}): RoutingState {
  return {
    ...defaultRoutingState(NOW),
    ...partial,
    isolated: partial.isolated ?? {},
    promoted: partial.promoted ?? {},
    probes: partial.probes ?? {},
  }
}

function expectMaintainPath(r: { maintainOriginalPath: true; decision: typeof REUSE_CURRENT }): void {
  expect(r.maintainOriginalPath).toBe(true)
  expect(r.decision).toBe(REUSE_CURRENT)
}

describe('analyzeRoutingConsistency（純交叉）', () => {
  test('三者一致 → 無警告', () => {
    const state = baseState({
      isolated: { qwen: { untilTs: UNTIL, reason: 'bad' } },
      probes: { qwen: { hits: 0, lastTs: '' } },
    })
    const stats = [
      { engine: 'qwen', sampleCount: 6, ok: 0, fail: 6, successRate: 0 },
      { engine: 'codex', sampleCount: 4, ok: 4, fail: 0, successRate: 1 },
    ]
    expect(analyzeRoutingConsistency(ROT, state, stats, NOW)).toEqual([])
  })

  test('隔離 tag 不在 rotation', () => {
    const state = baseState({
      isolated: { rogue: { untilTs: UNTIL, reason: 'x' } },
    })
    const w = analyzeRoutingConsistency(ROT, state, null, NOW)
    expect(w).toEqual([
      expect.objectContaining({ code: 'isolated-outside-rotation', engine: 'rogue' }),
    ])
  })

  test('晉升 tag 已在 rotation', () => {
    const state = baseState({
      promoted: { codex: { score: 4, promotedAt: NOW } },
    })
    const w = analyzeRoutingConsistency(ROT, state, null, NOW)
    expect(w).toEqual([
      expect.objectContaining({ code: 'promoted-in-rotation', engine: 'codex' }),
    ])
  })

  test('試探無隔離條目', () => {
    const state = baseState({
      probes: { qwen: { hits: 1, lastTs: NOW } },
    })
    const w = analyzeRoutingConsistency(ROT, state, null, NOW)
    expect(w).toEqual([
      expect.objectContaining({ code: 'probe-without-isolation', engine: 'qwen' }),
    ])
  })

  test('同 tag 隔離且晉升', () => {
    const state = baseState({
      isolated: { qwen: { untilTs: UNTIL, reason: 'x' } },
      promoted: { qwen: { score: 2, promotedAt: NOW } },
    })
    const w = analyzeRoutingConsistency(ROT, state, null, NOW)
    expect(w.map(x => x.code)).toContain('isolated-and-promoted')
  })

  test('隔離中但戰績健康 → healthy-but-isolated', () => {
    const state = baseState({
      isolated: { qwen: { untilTs: UNTIL, reason: 'stale' } },
    })
    const stats = [
      { engine: 'qwen', sampleCount: 6, ok: 5, fail: 1, successRate: 5 / 6 },
    ]
    const w = analyzeRoutingConsistency(ROT, state, stats, NOW)
    expect(w).toEqual([
      expect.objectContaining({ code: 'healthy-but-isolated', engine: 'qwen' }),
    ])
  })

  test('晉升中但達隔離門檻 → promoted-should-isolate', () => {
    const state = baseState({
      promoted: { outsider: { score: 4, promotedAt: NOW } },
    })
    const stats = [
      { engine: 'outsider', sampleCount: 6, ok: 0, fail: 6, successRate: 0 },
    ]
    const w = analyzeRoutingConsistency(ROT, state, stats, NOW)
    expect(w).toEqual([
      expect.objectContaining({ code: 'promoted-should-isolate', engine: 'outsider' }),
    ])
  })

  test('空 rotation → 無警告（呼叫端應 skip）', () => {
    const state = baseState({
      isolated: { qwen: { untilTs: UNTIL, reason: 'x' } },
    })
    expect(analyzeRoutingConsistency([], state, null, NOW)).toEqual([])
  })

  test('過期隔離不計入 active（不報 outside-rotation）', () => {
    const state = baseState({
      isolated: { rogue: { untilTs: '2026-07-19T00:00:00.000Z', reason: 'expired' } },
    })
    expect(analyzeRoutingConsistency(ROT, state, null, NOW)).toEqual([])
  })
})

describe('checkRoutingStateConsistency（I/O + 守門）', () => {
  test('缺 dataDir / 無 rotation → skipped 且維持原路徑', () => {
    const a = checkRoutingStateConsistency({ dataDir: '', engineRotation: ROT, nowIso: NOW })
    const b = checkRoutingStateConsistency({ dataDir: '/tmp/x', engineRotation: [], nowIso: NOW })
    const c = checkRoutingStateConsistency({ dataDir: '/tmp/x', nowIso: NOW })
    for (const r of [a, b, c]) {
      expect(r.kind).toBe('skipped')
      expectMaintainPath(r)
      expect(r.warnings).toEqual([])
    }
    expect(a).toMatchObject({ reason: 'missing-data-dir' })
    expect(b).toMatchObject({ reason: 'no-rotation' })
    expect(c).toMatchObject({ reason: 'no-rotation' })
  })

  test('缺狀態檔 → skipped no-state-file，不寫檔', () => {
    const dir = tmpDir()
    try {
      const r = checkRoutingStateConsistency({
        dataDir: dir,
        engineRotation: ROT,
        nowIso: NOW,
      })
      expect(r).toMatchObject({ kind: 'skipped', reason: 'no-state-file' })
      expectMaintainPath(r)
      expect(loadRoutingState(dir, { nowIso: NOW }).kind).toBe('reuse-current')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('狀態損壞 → skipped 維持原路徑且不覆寫', () => {
    const dir = tmpDir()
    try {
      const file = join(dir, ROUTING_STATE_FILENAME)
      const before = '{not-json'
      writeFileSync(file, before)
      const r = checkRoutingStateConsistency({
        dataDir: dir,
        engineRotation: ROT,
        nowIso: NOW,
      })
      expect(r.kind).toBe('skipped')
      expectMaintainPath(r)
      expect(readFileSync(file, 'utf8')).toBe(before)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('一致狀態 + 戰績 → ok，不改狀態檔', () => {
    const dir = tmpDir()
    try {
      const state = baseState({
        isolated: { qwen: { untilTs: UNTIL, reason: 'bad' } },
      })
      expect(saveRoutingState(dir, state, { nowIso: NOW })).toBe(true)
      const before = readFileSync(join(dir, ROUTING_STATE_FILENAME), 'utf8')
      const badStats: RunStatsResult = {
        kind: 'stats',
        days: ['2026-07-20', '2026-07-19', '2026-07-18'],
        sampleCount: 6,
        engines: [
          { engine: 'qwen', sampleCount: 6, ok: 0, fail: 6, successRate: 0 },
        ],
      }
      const r = checkRoutingStateConsistency({
        dataDir: dir,
        engineRotation: ROT,
        nowIso: NOW,
        statsFn: () => badStats,
      })
      expect(r.kind).toBe('ok')
      expectMaintainPath(r)
      expect(r.warnings).toEqual([])
      expect(readFileSync(join(dir, ROUTING_STATE_FILENAME), 'utf8')).toBe(before)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('明顯不一致 → warnings 標記 + maintainOriginalPath，狀態檔位元組不變', () => {
    const dir = tmpDir()
    try {
      const state = baseState({
        isolated: {
          qwen: { untilTs: UNTIL, reason: 'stale' },
          rogue: { untilTs: UNTIL, reason: 'orphan' },
        },
        promoted: {
          codex: { score: 3, promotedAt: NOW },
          qwen: { score: 1, promotedAt: NOW },
        },
        probes: {
          orphanProbe: { hits: 2, lastTs: NOW },
        },
      })
      expect(saveRoutingState(dir, state, { nowIso: NOW })).toBe(true)
      const before = readFileSync(join(dir, ROUTING_STATE_FILENAME), 'utf8')
      const healthyStats: RunStatsResult = {
        kind: 'stats',
        days: ['2026-07-20', '2026-07-19', '2026-07-18'],
        sampleCount: 6,
        engines: [
          { engine: 'qwen', sampleCount: 6, ok: 6, fail: 0, successRate: 1 },
        ],
      }
      const r = checkRoutingStateConsistency({
        dataDir: dir,
        engineRotation: ROT,
        nowIso: NOW,
        statsFn: () => healthyStats,
      })
      expect(r.kind).toBe('warnings')
      expectMaintainPath(r)
      const codes = new Set(r.warnings.map(w => w.code))
      expect(codes.has('isolated-outside-rotation')).toBe(true)
      expect(codes.has('promoted-in-rotation')).toBe(true)
      expect(codes.has('probe-without-isolation')).toBe(true)
      expect(codes.has('isolated-and-promoted')).toBe(true)
      expect(codes.has('healthy-but-isolated')).toBe(true)
      expect(readFileSync(join(dir, ROUTING_STATE_FILENAME), 'utf8')).toBe(before)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('stats 失敗仍做 state×rotation 交叉，維持原路徑', () => {
    const dir = tmpDir()
    try {
      const state = baseState({
        promoted: { codex: { score: 2, promotedAt: NOW } },
      })
      expect(saveRoutingState(dir, state, { nowIso: NOW })).toBe(true)
      const r = checkRoutingStateConsistency({
        dataDir: dir,
        engineRotation: ROT,
        nowIso: NOW,
        statsFn: () => ({ kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'timeout' }),
      })
      expect(r.kind).toBe('warnings')
      expectMaintainPath(r)
      expect(r.warnings).toEqual([
        expect.objectContaining({ code: 'promoted-in-rotation', engine: 'codex' }),
      ])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('loadState / stats 拋錯 → fail-open skipped 或仍不改派工', () => {
    const boom = checkRoutingStateConsistency({
      dataDir: 'D:/x',
      engineRotation: ROT,
      nowIso: NOW,
      loadStateFn: () => {
        throw new Error('disk')
      },
    })
    expect(boom.kind).toBe('skipped')
    expectMaintainPath(boom)

    const dir = tmpDir()
    try {
      expect(saveRoutingState(dir, baseState({
        promoted: { codex: { score: 1, promotedAt: NOW } },
      }), { nowIso: NOW })).toBe(true)
      const r = checkRoutingStateConsistency({
        dataDir: dir,
        engineRotation: ROT,
        nowIso: NOW,
        statsFn: () => {
          throw new Error('db-lock')
        },
      })
      // stats 例外 → 仍交叉 state
      expect(r.kind).toBe('warnings')
      expectMaintainPath(r)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('真實 run.db 戰績：健康引擎卻隔離 → 警告且不寫狀態', () => {
    const dir = tmpDir()
    try {
      const db = new RunDb(join(dir, 'run.db'))
      for (let i = 0; i < ISOLATE_MIN_SAMPLES; i++) {
        const day = i < 2 ? '2026-07-20' : i < 4 ? '2026-07-19' : '2026-07-18'
        db.record({
          taskId: `t${i}`,
          ok: true,
          costUsd: 0.1,
          detail: '',
          engine: 'qwen',
          ts: `${day}T0${i % 9}:00:00.000Z`,
        })
      }
      db.close()
      const state = baseState({
        isolated: { qwen: { untilTs: UNTIL, reason: 'stale-isolation' } },
      })
      expect(saveRoutingState(dir, state, { nowIso: NOW })).toBe(true)
      const before = readFileSync(join(dir, ROUTING_STATE_FILENAME), 'utf8')
      const r = checkRoutingStateConsistency({
        dataDir: dir,
        engineRotation: ROT,
        nowIso: NOW,
        offsetHours: 0,
      })
      expect(r.kind).toBe('warnings')
      expectMaintainPath(r)
      expect(r.warnings.some(w => w.code === 'healthy-but-isolated' && w.engine === 'qwen')).toBe(true)
      expect(readFileSync(join(dir, ROUTING_STATE_FILENAME), 'utf8')).toBe(before)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('非法 rotation 元素 → skipped invalid-rotation', () => {
    const r = checkRoutingStateConsistency({
      dataDir: '/tmp/x',
      engineRotation: ['ok', ''] as string[],
      nowIso: NOW,
    })
    expect(r).toMatchObject({ kind: 'skipped', reason: 'invalid-rotation' })
    expectMaintainPath(r)
  })

  test('saveState 路徑不存在：檢查器永不呼叫寫入', () => {
    const saveSpy = vi.fn()
    const dir = tmpDir()
    try {
      expect(saveRoutingState(dir, baseState({
        isolated: { rogue: { untilTs: UNTIL, reason: 'x' } },
      }), { nowIso: NOW })).toBe(true)
      const r = checkRoutingStateConsistency({
        dataDir: dir,
        engineRotation: ROT,
        nowIso: NOW,
        statsFn: () => ({ kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'missing-run-db' }),
      })
      expect(r.kind).toBe('warnings')
      expect(saveSpy).not.toHaveBeenCalled()
      // 無寫入 API 暴露於 input；確認檔案未被改寫為空預設
      const loaded = loadRoutingState(dir, { nowIso: NOW })
      expect(loaded.kind).toBe('state')
      expect(loaded.state.isolated.rogue?.reason).toBe('x')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
