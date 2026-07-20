/**
 * 重啟後一致性整合測試（pickReadyTask 路徑）。
 *
 * 模擬：寫入隔離 + 候補晉升狀態 → 進程重啟（重建路由上下文）→
 * 再走 loadIsolatedTagsForPick + pickCandidateTags，驗證：
 * 1. 候選延續原狀（隔離仍生效、晉升仍在 state）
 * 2. 試探時點（untilTs / probes.lastTs）不因重啟或再次套用隔離而重置
 * 3. engine-route-isolated 事件不重複派發
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  applyStatsIsolation,
  loadIsolatedTagsForPick,
  type ApplyStatsIsolationInput,
  type IsolationAppliedEvent,
} from '../src/engines/apply-stats-isolation.js'
import { ISOLATE_MIN_SAMPLES } from '../src/engines/isolation-policy.js'
import { pickCandidateTags } from '../src/engines/pick-candidates.js'
import { candidateEngines } from '../src/engines/rotation.js'
import { buildRoutingContext } from '../src/engines/routing-context.js'
import {
  REUSE_CURRENT,
  ROUTING_STATE_FILENAME,
  defaultRoutingState,
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
const BAD_QWEN_STATS = {
  kind: 'stats',
  days: ['2026-07-20', '2026-07-19', '2026-07-18'],
  sampleCount: 6,
  engines: [
    { engine: 'qwen', sampleCount: 6, ok: 1, fail: 5, successRate: 1 / 6 },
  ],
} satisfies RunStatsResult

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
  nowIso = NOW,
  overrides: Partial<ApplyStatsIsolationInput> = {}
): { isolatedTags: string[]; candidateTags: string[] } {
  const isolatedTags = loadIsolatedTagsForPick(
    { dataDir, rotation: ROT, nowIso, offsetHours: 0, ...overrides },
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

type LoadStateFn = NonNullable<ApplyStatsIsolationInput['loadStateFn']>

function rebuildAndPick(dataDir: string, loadStateFn?: LoadStateFn) {
  const rebuilt = buildRoutingContext(
    { dataDir, engineRotation: ROT, nowIso: NOW },
    {
      recentRunStats: () => BAD_QWEN_STATS,
      ...(loadStateFn ? { loadRoutingState: loadStateFn } : {}),
    }
  )
  const saveState = vi.fn(() => true)
  const events: IsolationAppliedEvent[] = []
  const picked = pickLikeReadyTask(dataDir, '00000000', events, NOW, {
    statsFn: () => BAD_QWEN_STATS,
    saveStateFn: saveState,
    ...(loadStateFn ? { loadStateFn } : {}),
  })
  return { rebuilt, picked, saveState, events }
}

function expectLegacyFallback(result: ReturnType<typeof rebuildAndPick>): void {
  expect(result.rebuilt.kind).toBe('reuse-current')
  expect(result.picked).toEqual({
    isolatedTags: [],
    candidateTags: candidateEngines(ROT, DEFAULT_ENGINE, { id: '00000000' }, 0),
  })
  expect(result.events).toEqual([])
  expect(result.saveState).not.toHaveBeenCalled()
}

describe('狀態重建入口守門', () => {
  test('重建：延續既有派工且不重置試探時間', () => {
    const dir = tmpDir()
    try {
      seedPreRestartState(dir)
      const file = join(dir, ROUTING_STATE_FILENAME)
      const before = readFileSync(file, 'utf8')
      const result = rebuildAndPick(dir)

      expect(result.rebuilt.kind).toBe('context')
      expect(result.picked).toEqual({ isolatedTags: ['qwen'], candidateTags: ['codex', 'opencode'] })
      expect(result.events).toEqual([])
      expect(result.saveState).not.toHaveBeenCalled()
      expect(readFileSync(file, 'utf8')).toBe(before)
      expect(loadRoutingState(dir).state.probes.qwen?.lastTs).toBe(PROBE_LAST_TS)
      expect(loadRoutingState(dir).state.isolated.qwen?.untilTs).toBe(UNTIL_TS)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('讀檔失敗：回原派工且不覆寫既有試探時間', () => {
    const dir = tmpDir()
    try {
      seedPreRestartState(dir)
      const file = join(dir, ROUTING_STATE_FILENAME)
      const before = readFileSync(file, 'utf8')
      const unreadable = vi.fn(() => ({
        kind: 'reuse-current' as const,
        decision: REUSE_CURRENT,
        reason: 'unreadable' as const,
        state: defaultRoutingState(NOW),
      }))
      const result = rebuildAndPick(dir, unreadable)

      expectLegacyFallback(result)
      expect(readFileSync(file, 'utf8')).toBe(before)
      expect(JSON.parse(before).isolated.qwen.untilTs).toBe(UNTIL_TS)
      expect(JSON.parse(before).probes.qwen.lastTs).toBe(PROBE_LAST_TS)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('版本不符：回原派工且不覆寫舊版試探時間', () => {
    const dir = tmpDir()
    try {
      const prior = seedPreRestartState(dir)
      const file = join(dir, ROUTING_STATE_FILENAME)
      const before = JSON.stringify({ version: 99, previousState: prior })
      writeFileSync(file, before)
      expect(loadRoutingState(dir, { nowIso: NOW })).toMatchObject({
        kind: 'reuse-current',
        reason: 'unsupported-version',
      })
      const result = rebuildAndPick(dir)

      expectLegacyFallback(result)
      expect(readFileSync(file, 'utf8')).toBe(before)
      expect(JSON.parse(before).previousState.isolated.qwen.untilTs).toBe(UNTIL_TS)
      expect(JSON.parse(before).previousState.probes.qwen.lastTs).toBe(PROBE_LAST_TS)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('內容損壞：回原派工且不覆寫殘存試探時間', () => {
    const dir = tmpDir()
    try {
      const file = join(dir, ROUTING_STATE_FILENAME)
      const before = `{"version":1,"isolated":{"qwen":{"untilTs":"${UNTIL_TS}"}},"probes":{"qwen":{"hits":1,"lastTs":"${PROBE_LAST_TS}"}}`
      writeFileSync(file, before)
      expect(loadRoutingState(dir, { nowIso: NOW })).toMatchObject({
        kind: 'reuse-current',
        reason: 'corrupt',
      })
      const result = rebuildAndPick(dir)

      expectLegacyFallback(result)
      expect(readFileSync(file, 'utf8')).toBe(before)
      expect(before).toContain(UNTIL_TS)
      expect(before).toContain(PROBE_LAST_TS)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('只讀檢查：第二次重建不重初始化快取與事件計數，試探/常駐候選不重置', () => {
    // 純讀 buildRoutingContext：暖快取後刪 run.db，第二次仍命中快取且 probes/promoted 原封。
    const dir = tmpDir()
    try {
      seedPreRestartState(dir)
      seedBadQwen(dir, 6, 1)
      const file = join(dir, ROUTING_STATE_FILENAME)
      const before = readFileSync(file, 'utf8')
      const dbFile = join(dir, 'run.db')

      const first = buildRoutingContext({
        dataDir: dir,
        engineRotation: ROT,
        nowIso: NOW,
        offsetHours: 0,
      })
      expect(first.kind).toBe('context')
      if (first.kind !== 'context') throw new Error('expected context')
      expect(first.context.stats.kind).toBe('stats')
      expect(first.context.state.probes.qwen).toEqual({ hits: 1, lastTs: PROBE_LAST_TS })
      expect(first.context.state.promoted.codex).toEqual({ score: 4, promotedAt: PROMOTED_AT })
      expect(first.context.state.isolated.qwen?.untilTs).toBe(UNTIL_TS)
      const firstStats = first.context.stats

      // 刪除 run.db：若第二次呼叫重初始化快取，會落入 reuse-current 而非延續 stats
      rmSync(dbFile, { force: true })

      const second = buildRoutingContext({
        dataDir: dir,
        engineRotation: ROT,
        nowIso: NOW,
        offsetHours: 0,
      })
      expect(second.kind).toBe('context')
      if (second.kind !== 'context') throw new Error('expected context')

      // 快取未重初始化：無 run.db 仍回同一 stats
      expect(second.context.stats).toEqual(firstStats)
      // 事件計數（probes.hits）與試探時點不重置
      expect(second.context.state.probes.qwen).toEqual({ hits: 1, lastTs: PROBE_LAST_TS })
      // 常駐候選標記（promoted）不重置
      expect(second.context.state.promoted.codex).toEqual({ score: 4, promotedAt: PROMOTED_AT })
      expect(second.context.state.isolated.qwen?.untilTs).toBe(UNTIL_TS)
      // 入口為只讀：狀態檔位元組級不變
      expect(readFileSync(file, 'utf8')).toBe(before)
      expect(isSingleProbeEligible(second.context.state, 'qwen', NOW)).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

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
