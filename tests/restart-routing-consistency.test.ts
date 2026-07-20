/**
 * 重啟後一致性整合測試（pickReadyTask 路徑）。
 *
 * 模擬：寫入隔離 + 候補晉升狀態 → 進程重啟（重建路由上下文）→
 * 再走 loadIsolatedTagsForPick + pickCandidateTags，驗證：
 * 1. 候選延續原狀（隔離仍生效、晉升仍在 state）
 * 2. 試探時點（untilTs / probes.lastTs）不因重啟或再次套用隔離而重置
 * 3. engine-route-isolated 事件不重複派發
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import {
  applyStatsIsolation,
  loadIsolatedTagsForPick,
  type IsolationAppliedEvent,
} from '../src/engines/apply-stats-isolation.js'
import { ISOLATE_MIN_SAMPLES } from '../src/engines/isolation-policy.js'
import { pickCandidateTags } from '../src/engines/pick-candidates.js'
import { buildRoutingContext } from '../src/engines/routing-context.js'
import {
  loadRoutingState,
  saveRoutingState,
  type RoutingState,
} from '../src/engines/routing-state.js'
import {
  ISOLATION_BEFORE_PROBE_MS,
  isSingleProbeEligible,
} from '../src/engines/routing-transition.js'
import { clearRunStatsCache, type RunStatsResult } from '../src/engines/run-stats.js'
import { RunDb } from '../src/db.js'

const NOW = '2026-07-20T12:00:00.000Z'
const NOW_MS = Date.parse(NOW)
const ROT = ['qwen', 'codex', 'opencode']
const DEFAULT_ENGINE = 'claude'

/** 隔離窗內（尚未到 untilTs）的固定時刻，避免測試依賴「當下」。 */
const UNTIL_TS = new Date(NOW_MS + ISOLATION_BEFORE_PROBE_MS).toISOString()
/** 本隔離窗內已用過的試探時點（不可再試探、也不可被重啟清掉）。 */
const PROBE_LAST_TS = new Date(NOW_MS - 60 * 60 * 1000).toISOString()
const PROMOTED_AT = '2026-07-18T08:00:00.000Z'

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'adng-restart-consist-'))
}

afterEach(() => {
  clearRunStatsCache()
})

/** 近 3 日 qwen 壞戰績（達隔離門檻），供 loadIsolatedTagsForPick 再評估。 */
function seedBadQwen(dir: string, n = ISOLATE_MIN_SAMPLES, okCount = 1): void {
  const db = new RunDb(join(dir, 'run.db'))
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
  db.record({
    taskId: 'good',
    ok: true,
    costUsd: 0.1,
    detail: '',
    engine: 'codex',
    ts: '2026-07-20T01:00:00.000Z',
  })
  db.close()
}

function seedPreRestartState(dir: string): RoutingState {
  const state: RoutingState = {
    version: 1,
    updatedAt: NOW,
    isolated: {
      qwen: { untilTs: UNTIL_TS, reason: 'prior-isolation-window' },
    },
    promoted: {
      codex: { score: 4, promotedAt: PROMOTED_AT },
    },
    probes: {
      qwen: { hits: 1, lastTs: PROBE_LAST_TS },
    },
  }
  expect(saveRoutingState(dir, state, { nowIso: NOW })).toBe(true)
  return state
}

/** 鏡像 scheduler.pickReadyTask：隔離標籤 → 候選清單；事件收集器模擬 engine-route-isolated。 */
function pickLikeReadyTask(
  dataDir: string,
  taskId: string,
  events: IsolationAppliedEvent[],
  nowIso = NOW
): { isolatedTags: string[]; candidateTags: string[] } {
  const isolatedTags = loadIsolatedTagsForPick(
    { dataDir, rotation: ROT, nowIso, offsetHours: 0 },
    ev => {
      events.push(ev)
    }
  )
  const candidateTags = pickCandidateTags({
    rotation: ROT,
    defaultEngine: DEFAULT_ENGINE,
    task: { id: taskId },
    failCount: 0,
    isolatedTags,
    subscriptionTags: [],
  })
  return { isolatedTags, candidateTags }
}

describe('重啟後一致性：隔離 / 候補晉升 / 試探時點 / 事件', () => {
  test('寫入隔離+晉升 → 重建上下文 → pick 延續原狀且不重設試探、不重派事件', () => {
    const dir = tmpDir()
    try {
      const prior = seedPreRestartState(dir)
      seedBadQwen(dir, 6, 1) // 重啟後仍會讀到達門檻戰績，但已隔離不得重設

      // ── 模擬進程重啟：重新 buildRoutingContext（讀 state + run.db）──
      const ctx = buildRoutingContext({
        dataDir: dir,
        engineRotation: ROT,
        nowIso: NOW,
        offsetHours: 0,
      })
      expect(ctx.kind).toBe('context')
      if (ctx.kind !== 'context') throw new Error('expected routing context')

      // 隔離 / 晉升 / 試探時點原封延續
      expect(ctx.context.state.isolated.qwen).toEqual(prior.isolated.qwen)
      expect(ctx.context.state.promoted.codex).toEqual(prior.promoted.codex)
      expect(ctx.context.state.probes.qwen).toEqual(prior.probes.qwen)

      // ── pickReadyTask 路徑：重啟後第一輪 ──
      const events: IsolationAppliedEvent[] = []
      // task id 固定起點 0 → rotation [qwen,codex,opencode] 再濾隔離
      const first = pickLikeReadyTask(dir, '00000000', events)
      expect(first.isolatedTags).toEqual(['qwen'])
      // 有健康候選 → 跳過隔離的 qwen（順序依 rotation 起點，不依賴 hash 漂移）
      expect(first.candidateTags).toEqual(['codex', 'opencode'])
      // 已隔離 → newlyIsolated 空 → 不派 engine-route-isolated
      expect(events).toEqual([])

      // 落盤後 untilTs / probe 仍未變
      const afterPick = loadRoutingState(dir, { nowIso: NOW })
      expect(afterPick.kind).toBe('state')
      expect(afterPick.state.isolated.qwen?.untilTs).toBe(UNTIL_TS)
      expect(afterPick.state.isolated.qwen?.reason).toBe('prior-isolation-window')
      expect(afterPick.state.probes.qwen).toEqual({ hits: 1, lastTs: PROBE_LAST_TS })
      expect(afterPick.state.promoted.codex).toEqual({ score: 4, promotedAt: PROMOTED_AT })

      // 窗內且已有 probe lastTs → 試探額度仍消耗中（重啟不可還原）
      expect(isSingleProbeEligible(afterPick.state, 'qwen', NOW)).toBe(false)

      // ── 再重建一次上下文 + 第二輪 pick：仍不重派事件 ──
      clearRunStatsCache()
      const ctx2 = buildRoutingContext({
        dataDir: dir,
        engineRotation: ROT,
        nowIso: NOW,
        offsetHours: 0,
      })
      expect(ctx2.kind).toBe('context')
      if (ctx2.kind !== 'context') throw new Error('expected routing context')
      expect(ctx2.context.state.probes.qwen?.lastTs).toBe(PROBE_LAST_TS)
      expect(ctx2.context.state.isolated.qwen?.untilTs).toBe(UNTIL_TS)

      const events2: IsolationAppliedEvent[] = []
      const second = pickLikeReadyTask(dir, '00000000', events2)
      expect(second.isolatedTags).toEqual(['qwen'])
      expect(second.candidateTags).toEqual(['codex', 'opencode'])
      expect(events2).toEqual([])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('重啟前首次隔離有事件；重啟後同條件只延續、untilTs 不變、事件不重複', () => {
    const dir = tmpDir()
    try {
      seedBadQwen(dir, 6, 1)

      const eventsRound1: IsolationAppliedEvent[] = []
      const before = pickLikeReadyTask(dir, 'aaaaaaaa', eventsRound1)
      expect(before.isolatedTags).toContain('qwen')
      expect(eventsRound1).toHaveLength(1)
      expect(eventsRound1[0]!.engine).toBe('qwen')
      const frozenUntil = eventsRound1[0]!.untilTs
      expect(frozenUntil).toBe(
        new Date(NOW_MS + ISOLATION_BEFORE_PROBE_MS).toISOString()
      )

      // 寫入候補晉升（模擬隔離後另有晉升寫入），再「重啟」
      const st = loadRoutingState(dir, { nowIso: NOW })
      expect(st.kind).toBe('state')
      const withPromo: RoutingState = {
        ...st.state,
        promoted: {
          ...st.state.promoted,
          codex: { score: 2, promotedAt: PROMOTED_AT },
        },
        // 模擬曾試探：重啟後 lastTs 必須保留
        probes: {
          ...st.state.probes,
          qwen: { hits: 1, lastTs: PROBE_LAST_TS },
        },
      }
      expect(saveRoutingState(dir, withPromo, { nowIso: NOW })).toBe(true)

      clearRunStatsCache()
      const rebuilt = buildRoutingContext({
        dataDir: dir,
        engineRotation: ROT,
        nowIso: NOW,
        offsetHours: 0,
      })
      expect(rebuilt.kind).toBe('context')
      if (rebuilt.kind !== 'context') throw new Error('expected context')
      expect(rebuilt.context.state.isolated.qwen?.untilTs).toBe(frozenUntil)
      expect(rebuilt.context.state.promoted.codex?.promotedAt).toBe(PROMOTED_AT)
      expect(rebuilt.context.state.probes.qwen?.lastTs).toBe(PROBE_LAST_TS)

      const eventsRound2: IsolationAppliedEvent[] = []
      const afterRestart = pickLikeReadyTask(dir, 'bbbbbbbb', eventsRound2)
      expect(afterRestart.isolatedTags).toContain('qwen')
      expect(afterRestart.candidateTags).not.toContain('qwen')
      expect(eventsRound2).toEqual([]) // 不重複派發

      // applyStatsIsolation 直接呼叫也應 unchanged + 不改 untilTs
      clearRunStatsCache()
      const reapply = applyStatsIsolation({
        dataDir: dir,
        rotation: ROT,
        nowIso: NOW,
        offsetHours: 0,
      })
      expect(reapply.kind).toBe('unchanged')
      expect(reapply.newlyIsolated).toEqual([])
      expect(loadRoutingState(dir).state.isolated.qwen?.untilTs).toBe(frozenUntil)
      expect(loadRoutingState(dir).state.probes.qwen?.lastTs).toBe(PROBE_LAST_TS)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('stats 注入路徑：重啟後有晉升+隔離時 pick 仍跳過隔離檔且無新事件', () => {
    const dir = tmpDir()
    try {
      seedPreRestartState(dir)
      const badStats: RunStatsResult = {
        kind: 'stats',
        days: ['2026-07-20', '2026-07-19', '2026-07-18'],
        sampleCount: 7,
        engines: [
          { engine: 'qwen', sampleCount: 6, ok: 1, fail: 5, successRate: 1 / 6 },
          { engine: 'codex', sampleCount: 1, ok: 1, fail: 0, successRate: 1 },
        ],
      }

      // 重建上下文用真實檔；隔離套用走注入 stats（避免 SQLite 依賴）
      const ctx = buildRoutingContext(
        { dataDir: dir, engineRotation: ROT, nowIso: NOW },
        {
          recentRunStats: () => badStats,
          loadRoutingState: (d, opts) => loadRoutingState(d, opts),
        }
      )
      expect(ctx.kind).toBe('context')
      if (ctx.kind !== 'context') throw new Error('expected context')
      expect(ctx.context.state.promoted.codex?.score).toBe(4)
      expect(ctx.context.state.probes.qwen?.lastTs).toBe(PROBE_LAST_TS)

      const seen: IsolationAppliedEvent[] = []
      const tags = loadIsolatedTagsForPick(
        {
          dataDir: dir,
          rotation: ROT,
          nowIso: NOW,
          statsFn: () => badStats,
        },
        ev => {
          seen.push(ev)
        }
      )
      expect(tags).toEqual(['qwen'])
      expect(seen).toEqual([])

      const candidates = pickCandidateTags({
        rotation: ROT,
        defaultEngine: DEFAULT_ENGINE,
        task: { id: 'cccccccc' },
        failCount: 0,
        isolatedTags: tags,
      })
      expect(candidates).toEqual(['codex', 'opencode'])

      // 試探時點仍凍結
      expect(loadRoutingState(dir).state.probes.qwen).toEqual({
        hits: 1,
        lastTs: PROBE_LAST_TS,
      })
      expect(loadRoutingState(dir).state.isolated.qwen?.untilTs).toBe(UNTIL_TS)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
