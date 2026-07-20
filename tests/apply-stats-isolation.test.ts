import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  applyStatsIsolation,
  loadIsolatedTagsForPick,
} from '../src/engines/apply-stats-isolation.js'
import {
  ISOLATE_MIN_SAMPLES,
  ISOLATE_WINDOW_DAYS,
} from '../src/engines/isolation-policy.js'
import { ROUTING_EVENT_SCHEMA_VERSION } from '../src/engines/routing-exits.js'
import {
  ROUTING_STATE_FILENAME,
  REUSE_CURRENT,
  loadRoutingState,
  saveRoutingState,
  defaultRoutingState,
} from '../src/engines/routing-state.js'
import { ISOLATION_BEFORE_PROBE_MS } from '../src/engines/routing-transition.js'
import { clearRunStatsCache, type RunStatsResult } from '../src/engines/run-stats.js'
import { RunDb } from '../src/db.js'

const NOW = '2026-07-20T12:00:00.000Z'
const ROT = ['qwen', 'codex', 'opencode']
const BAD_QWEN_STATS = {
  kind: 'stats',
  days: ['2026-07-20', '2026-07-19', '2026-07-18'],
  sampleCount: 6,
  engines: [
    { engine: 'qwen', sampleCount: 6, ok: 0, fail: 6, successRate: 0 },
  ],
} satisfies RunStatsResult

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'adng-iso-'))
}

afterEach(() => {
  clearRunStatsCache()
})

function seedBadQwen(dir: string, n = ISOLATE_MIN_SAMPLES, okCount = 1): string {
  const dbFile = join(dir, 'run.db')
  const db = new RunDb(dbFile)
  // 近 3 日：今日起算 2026-07-20 / 19 / 18
  for (let i = 0; i < n; i++) {
    const day = i < 2 ? '2026-07-20' : i < 4 ? '2026-07-19' : '2026-07-18'
    db.record({
      taskId: `t${i}`,
      ok: i < okCount,
      costUsd: 0.1,
      detail: '',
      engine: 'qwen',
      ts: `${day}T0${i % 9}:00:00.000Z`,
    })
  }
  // 健康引擎對照
  db.record({
    taskId: 'good',
    ok: true,
    costUsd: 0.1,
    detail: '',
    engine: 'codex',
    ts: '2026-07-20T01:00:00.000Z',
  })
  db.close()
  return dbFile
}

describe('applyStatsIsolation', () => {
  test('缺 run.db → reuse-current，不寫狀態檔', () => {
    const dir = tmpDir()
    try {
      const r = applyStatsIsolation({
        dataDir: dir,
        rotation: ROT,
        nowIso: NOW,
        offsetHours: 0,
      })
      expect(r.kind).toBe('reuse-current')
      expect(r.newlyIsolated).toEqual([])
      expect(existsSync(join(dir, ROUTING_STATE_FILENAME))).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('無 rotation → reuse-current（維持原路徑）', () => {
    const dir = tmpDir()
    try {
      seedBadQwen(dir)
      const r = applyStatsIsolation({
        dataDir: dir,
        rotation: undefined,
        nowIso: NOW,
        offsetHours: 0,
      })
      expect(r).toMatchObject({ kind: 'reuse-current', reason: 'no-rotation' })
      expect(existsSync(join(dir, ROUTING_STATE_FILENAME))).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('狀態檔損壞 → 標記不可用並保留原檔，不套用新隔離', () => {
    const dir = tmpDir()
    try {
      const file = join(dir, ROUTING_STATE_FILENAME)
      writeFileSync(file, '{"version":1,"isolated":')
      const r = applyStatsIsolation({
        dataDir: dir,
        rotation: ROT,
        nowIso: NOW,
        statsFn: () => BAD_QWEN_STATS,
      })
      expect(r).toMatchObject({
        kind: 'reuse-current',
        reason: 'state-corrupt',
        newlyIsolated: [],
        activeIsolatedTags: [],
      })
      expect(readFileSync(file, 'utf8')).toBe('{"version":1,"isolated":')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('原子寫入失敗 → 不回報隔離或派事件', () => {
    const dir = tmpDir()
    try {
      const saveState = vi.fn(() => false)
      const onIsolated = vi.fn()
      const tags = loadIsolatedTagsForPick(
        {
          dataDir: dir,
          rotation: ROT,
          nowIso: NOW,
          statsFn: () => BAD_QWEN_STATS,
          saveStateFn: saveState,
        },
        onIsolated
      )
      expect(tags).toEqual([])
      expect(saveState).toHaveBeenCalledOnce()
      expect(onIsolated).not.toHaveBeenCalled()
      expect(existsSync(join(dir, ROUTING_STATE_FILENAME))).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('樣本≥6 成功率<30% 的輪替引擎 → 寫入 dataDir 隔離狀態與事由', () => {
    const dir = tmpDir()
    try {
      seedBadQwen(dir, 6, 1) // 1/6 ≈ 16.7%
      const r = applyStatsIsolation({
        dataDir: dir,
        rotation: ROT,
        nowIso: NOW,
        offsetHours: 0,
      })
      expect(r.kind).toBe('applied')
      expect(r.newlyIsolated).toHaveLength(1)
      expect(r.newlyIsolated[0]).toMatchObject({
        schemaVersion: ROUTING_EVENT_SCHEMA_VERSION,
        engine: 'qwen',
        sampleCount: 6,
        successRate: 1 / 6,
      })
      expect(r.newlyIsolated[0]!.reason).toContain(`近${ISOLATE_WINDOW_DAYS}日`)
      expect(r.newlyIsolated[0]!.untilTs).toBe(
        new Date(Date.parse(NOW) + ISOLATION_BEFORE_PROBE_MS).toISOString()
      )
      expect(r.activeIsolatedTags).toContain('qwen')

      const loaded = loadRoutingState(dir, { nowIso: NOW })
      expect(loaded.kind).toBe('state')
      expect(loaded.state.isolated.qwen?.reason).toContain('樣本6')
      expect(loaded.state.isolated.qwen?.untilTs).toBe(r.newlyIsolated[0]!.untilTs)
      // 狀態檔確實落在 dataDir
      const raw = JSON.parse(readFileSync(join(dir, ROUTING_STATE_FILENAME), 'utf8')) as {
        isolated: Record<string, { reason: string }>
      }
      expect(raw.isolated.qwen!.reason).toContain('<30%')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('已隔離不再重設、newlyIsolated 為空', () => {
    const dir = tmpDir()
    try {
      seedBadQwen(dir, 8, 1)
      const first = applyStatsIsolation({
        dataDir: dir,
        rotation: ROT,
        nowIso: NOW,
        offsetHours: 0,
      })
      expect(first.kind).toBe('applied')
      clearRunStatsCache()
      const second = applyStatsIsolation({
        dataDir: dir,
        rotation: ROT,
        nowIso: NOW,
        offsetHours: 0,
      })
      expect(second.kind).toBe('unchanged')
      expect(second.newlyIsolated).toEqual([])
      expect(second.activeIsolatedTags).toContain('qwen')
      expect(loadRoutingState(dir).state.isolated.qwen?.untilTs).toBe(
        first.kind === 'applied' ? first.newlyIsolated[0]!.untilTs : ''
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('窗口外資料不計入：舊失敗不觸發隔離', () => {
    const dir = tmpDir()
    try {
      const dbFile = join(dir, 'run.db')
      const db = new RunDb(dbFile)
      for (let i = 0; i < 10; i++) {
        db.record({
          taskId: `old${i}`,
          ok: false,
          costUsd: 0.1,
          detail: '',
          engine: 'qwen',
          ts: `2026-07-10T0${i % 9}:00:00.000Z`, // 遠早於近 3 日
        })
      }
      db.close()
      const r = applyStatsIsolation({
        dataDir: dir,
        rotation: ROT,
        nowIso: NOW,
        offsetHours: 0,
      })
      // 近窗無樣本 → reuse 或 unchanged 皆可，但不得隔離
      expect(r.newlyIsolated).toEqual([])
      expect(r.activeIsolatedTags).not.toContain('qwen')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('statsFn 注入：可驗證只評估 rotation 門檻', () => {
    const dir = tmpDir()
    try {
      const stats: RunStatsResult = {
        kind: 'stats',
        days: ['2026-07-20', '2026-07-19', '2026-07-18'],
        sampleCount: 12,
        engines: [
          { engine: 'qwen', sampleCount: 6, ok: 1, fail: 5, successRate: 1 / 6 },
          { engine: 'stranger', sampleCount: 20, ok: 0, fail: 20, successRate: 0 },
        ],
      }
      const r = applyStatsIsolation({
        dataDir: dir,
        rotation: ['qwen'],
        nowIso: NOW,
        statsFn: () => stats,
      })
      expect(r.kind).toBe('applied')
      expect(r.newlyIsolated.map(e => e.engine)).toEqual(['qwen'])
      expect(r.activeIsolatedTags).toEqual(['qwen'])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('loadIsolatedTagsForPick：回 active tags 並對新隔離呼叫 onIsolated', () => {
    const dir = tmpDir()
    try {
      seedBadQwen(dir, 6, 1)
      const seen: string[] = []
      const tags = loadIsolatedTagsForPick(
        { dataDir: dir, rotation: ROT, nowIso: NOW, offsetHours: 0 },
        ev => { seen.push(ev.engine) }
      )
      expect(tags).toContain('qwen')
      expect(seen).toEqual(['qwen'])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('單一出口鉤子：同一隔離決策重複命中仍只寫一次、派一次事件', () => {
    const dir = tmpDir()
    try {
      const duplicatedStats: RunStatsResult = {
        ...BAD_QWEN_STATS,
        engines: [BAD_QWEN_STATS.engines[0]!, BAD_QWEN_STATS.engines[0]!],
      }
      const stats = vi.fn(() => duplicatedStats)
      const loadState = vi.fn(() => ({
        kind: 'reuse-current' as const,
        decision: REUSE_CURRENT,
        reason: 'missing' as const,
        state: defaultRoutingState(NOW),
      }))
      const effects: string[] = []
      const saveState = vi.fn(() => { effects.push('write'); return true })
      const onIsolated = vi.fn(() => { effects.push('event') })

      const tags = loadIsolatedTagsForPick(
        {
          dataDir: dir,
          rotation: ROT,
          nowIso: NOW,
          statsFn: stats,
          loadStateFn: loadState,
          saveStateFn: saveState,
        },
        onIsolated
      )

      expect(tags).toEqual(['qwen'])
      expect(stats).toHaveBeenCalledOnce()
      expect(loadState).toHaveBeenCalledOnce()
      expect(saveState).toHaveBeenCalledOnce()
      expect(onIsolated).toHaveBeenCalledOnce()
      expect(onIsolated).toHaveBeenCalledWith(expect.objectContaining({ engine: 'qwen' }))
      expect(effects).toEqual(['write', 'event'])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('既有隔離 + 新目標：合併寫入', () => {
    const dir = tmpDir()
    try {
      const base = defaultRoutingState(NOW)
      base.isolated.codex = {
        untilTs: new Date(Date.parse(NOW) + ISOLATION_BEFORE_PROBE_MS).toISOString(),
        reason: 'prior',
      }
      saveRoutingState(dir, base, { nowIso: NOW })
      const r = applyStatsIsolation({
        dataDir: dir,
        rotation: ['qwen', 'codex'],
        nowIso: NOW,
        statsFn: () => ({
          kind: 'stats',
          days: ['2026-07-20'],
          sampleCount: 6,
          engines: [
            { engine: 'qwen', sampleCount: 6, ok: 0, fail: 6, successRate: 0 },
          ],
        }),
      })
      expect(r.kind).toBe('applied')
      expect(r.newlyIsolated.map(e => e.engine)).toEqual(['qwen'])
      expect(r.activeIsolatedTags.sort()).toEqual(['codex', 'qwen'])
      const st = loadRoutingState(dir).state
      expect(st.isolated.codex?.reason).toBe('prior')
      expect(st.isolated.qwen?.reason).toContain('樣本6')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
