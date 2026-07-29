/**
 * 快照式回歸：`engineRotation` 未設、以及 `run.db` 無有效資料時，
 * 現況多層管線輸出必須與「舊路徑」完全一致——
 * defaultEngine 候選、不寫隔離狀態、不派 engine-route-isolated、事件不重複。
 *
 * 舊路徑定義（向後相容硬線）：
 * - 未設 / 空 rotation → candidateEngines = [defaultEngine]
 * - 無有效戰績 → 隔離管線 fail-open，isolatedTags = []，候選等同 rotation 旋轉序
 * - 上述任一情況皆不得隱性改寫狀態檔或額外派事件
 */
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import {
  applyStatsIsolation,
  loadIsolatedTagsForPick,
  type IsolationAppliedEvent,
} from '../src/engines/apply-stats-isolation.js'
import { pickCandidateTags } from '../src/engines/pick-candidates.js'
import { candidateEngines } from '../src/engines/rotation.js'
import { buildRoutingContext, routingContextUnavailable } from '../src/engines/routing-context.js'
import { REUSE_CURRENT } from '../src/engines/routing-decision.js'
import { isolationIdle } from '../src/engines/routing-exits.js'
import {
  ROUTING_STATE_FILENAME,
  loadRoutingState,
} from '../src/engines/routing-state.js'
import {
  clearRunStatsCache,
} from '../src/engines/run-stats.js'
import {
  FIXTURE_IO_TIMEOUT_MS,
  createIsolatedRecentRunStats,
} from '../src/engines/test-isolation.js'
import { RunDb } from '../src/db.js'

const NOW = '2026-07-20T12:00:00.000Z'
const DEFAULT_ENGINE = 'claude'
const ROT = ['qwen', 'codex', 'opencode'] as const
const TASK = { id: '00000000' } as const
const FAIL_COUNT = 0
const fixtureStats = createIsolatedRecentRunStats({
  nowIso: NOW,
  nowMs: Date.parse(NOW),
  timeoutMs: FIXTURE_IO_TIMEOUT_MS,
})

/** 凍結舊路徑輸出——逐欄位比對，禁止半對半錯。 */
const LEGACY = {
  noRotationCandidates: [DEFAULT_ENGINE],
  // 與 routing-exits 單一出口對齊，避免 LEGACY 手抄另一套 shape
  noRotationIsolation: isolationIdle('reuse-current', [], 'no-rotation'),
  noRotationContext: routingContextUnavailable(),
  missingRunDbStats: {
    kind: 'reuse-current' as const,
    decision: REUSE_CURRENT,
    reason: 'missing-run-db',
  },
  insufficientStats: {
    kind: 'reuse-current' as const,
    decision: REUSE_CURRENT,
    reason: 'insufficient-samples',
  },
  queryFailedStats: {
    kind: 'reuse-current' as const,
    decision: REUSE_CURRENT,
    reason: 'query-failed',
  },
  emptyIsolated: [] as string[],
  emptyEvents: [] as IsolationAppliedEvent[],
} as const

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'adng-legacy-snap-'))
}

afterEach(() => {
  clearRunStatsCache()
})

/** 鏡像 pickReadyTask：隔離 → 候選 + 事件收集（不碰 daemon）。 */
function pipelineSnapshot(input: {
  dataDir: string
  rotation: readonly string[] | undefined
  taskId?: string
  failCount?: number
  subscriptionTags?: readonly string[]
}): {
  candidateEngines: string[]
  pickCandidateTags: string[]
  isolation: ReturnType<typeof applyStatsIsolation>
  isolatedTags: string[]
  events: IsolationAppliedEvent[]
  context: ReturnType<typeof buildRoutingContext>
  stateFileExists: boolean
  stateLoadKind: string
} {
  const task = { id: input.taskId ?? TASK.id }
  const failCount = input.failCount ?? FAIL_COUNT
  const rotation = input.rotation === undefined ? undefined : [...input.rotation]
  const events: IsolationAppliedEvent[] = []

  const base = candidateEngines(rotation, DEFAULT_ENGINE, task, failCount)
  const isolation = applyStatsIsolation({
    dataDir: input.dataDir,
    rotation,
    nowIso: NOW,
    offsetHours: 0,
    timeoutMs: FIXTURE_IO_TIMEOUT_MS,
    statsFn: fixtureStats,
  })
  const isolatedTags = loadIsolatedTagsForPick(
    {
      dataDir: input.dataDir,
      rotation,
      nowIso: NOW,
      offsetHours: 0,
      timeoutMs: FIXTURE_IO_TIMEOUT_MS,
      statsFn: fixtureStats,
    },
    ev => {
      events.push(ev)
    }
  )
  const tags = pickCandidateTags({
    rotation,
    defaultEngine: DEFAULT_ENGINE,
    task,
    failCount,
    isolatedTags,
    subscriptionTags: input.subscriptionTags ? [...input.subscriptionTags] : [],
  })
  const context = buildRoutingContext(
    {
      dataDir: input.dataDir,
      engineRotation: rotation,
      nowIso: NOW,
      offsetHours: 0,
    },
    { recentRunStats: fixtureStats }
  )
  const stateFile = join(input.dataDir, ROUTING_STATE_FILENAME)
  const loaded = loadRoutingState(input.dataDir, { nowIso: NOW })

  return {
    candidateEngines: base,
    pickCandidateTags: tags,
    isolation,
    isolatedTags,
    events,
    context,
    stateFileExists: existsSync(stateFile),
    stateLoadKind: loaded.kind,
  }
}

describe('快照回歸：engineRotation 未設 → 舊路徑（defaultEngine）', () => {
  test.each([
    { label: 'undefined', rotation: undefined as readonly string[] | undefined },
    { label: '空陣列', rotation: [] as readonly string[] },
  ])('rotation=$label：候選/隔離/上下文/事件完整快照一致', ({ rotation }) => {
    const dir = tmpDir()
    try {
      // 即使目錄裡有「會達門檻」的假戰績，未設 rotation 也不得啟用隔離路徑
      const db = new RunDb(join(dir, 'run.db'))
      const days = ['2026-07-20', '2026-07-19', '2026-07-18']
      for (let i = 0; i < 6; i++) {
        db.record({
          taskId: `bad${i}`,
          ok: false,
          costUsd: 0.1,
          detail: '',
          engine: 'qwen',
          ts: `${days[i % 3]}T0${i}:00:00.000Z`,
        })
      }
      db.close()

      const snap = pipelineSnapshot({ dataDir: dir, rotation })

      // ── 候選層：等同舊 candidateEngines([defaultEngine]) ──
      expect(snap.candidateEngines).toEqual(LEGACY.noRotationCandidates)
      expect(snap.pickCandidateTags).toEqual(LEGACY.noRotationCandidates)

      // ── 隔離層：reuse-current / no-rotation，無新隔離 ──
      expect(snap.isolation).toEqual(LEGACY.noRotationIsolation)
      expect(snap.isolatedTags).toEqual(LEGACY.emptyIsolated)

      // ── 上下文：不讀戰績即可 fallback（與未設 rotation 契約）──
      expect(snap.context).toEqual(LEGACY.noRotationContext)

      // ── 副作用守門：不寫狀態、不派事件 ──
      expect(snap.stateFileExists).toBe(false)
      expect(snap.events).toEqual(LEGACY.emptyEvents)

      // ── 連跑兩次：事件仍為 0（禁止多發）──
      const again = pipelineSnapshot({ dataDir: dir, rotation })
      expect(again.events).toEqual(LEGACY.emptyEvents)
      expect(again.pickCandidateTags).toEqual(snap.pickCandidateTags)
      expect(again.isolation).toEqual(snap.isolation)
      expect(again.context).toEqual(snap.context)
      expect(existsSync(join(dir, ROUTING_STATE_FILENAME))).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('未設 rotation 時 failCount 不影響候選（舊路徑硬線）', () => {
    const dir = tmpDir()
    try {
      const a = pipelineSnapshot({ dataDir: dir, rotation: undefined, failCount: 0 })
      const b = pipelineSnapshot({ dataDir: dir, rotation: undefined, failCount: 9 })
      expect(a.pickCandidateTags).toEqual(LEGACY.noRotationCandidates)
      expect(b.pickCandidateTags).toEqual(LEGACY.noRotationCandidates)
      expect(a.events).toEqual(LEGACY.emptyEvents)
      expect(b.events).toEqual(LEGACY.emptyEvents)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('未設 rotation + subscription 尾端：僅補尾、不啟隔離', () => {
    const dir = tmpDir()
    try {
      const snap = pipelineSnapshot({
        dataDir: dir,
        rotation: undefined,
        subscriptionTags: ['codex-spark'],
      })
      // 舊路徑：defaultEngine 再補 subscription（pickCandidateTags 契約）
      expect(snap.candidateEngines).toEqual(LEGACY.noRotationCandidates)
      expect(snap.pickCandidateTags).toEqual([DEFAULT_ENGINE, 'codex-spark'])
      expect(snap.isolation).toEqual(LEGACY.noRotationIsolation)
      expect(snap.events).toEqual(LEGACY.emptyEvents)
      expect(snap.stateFileExists).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('快照回歸：run.db 無有效資料 → 舊路徑（rotation 旋轉序 + 無隔離）', () => {
  /** 有 rotation 時舊路徑候選＝純 candidateEngines 旋轉序 */
  const rotationOrder = candidateEngines([...ROT], DEFAULT_ENGINE, TASK, FAIL_COUNT)

  test('缺 run.db：stats/隔離/候選/事件完整快照', () => {
    const dir = tmpDir()
    try {
      const dbFile = join(dir, 'run.db')
      expect(existsSync(dbFile)).toBe(false)

      const stats = fixtureStats(dbFile, { nowIso: NOW, offsetHours: 0 })
      expect(stats).toEqual(LEGACY.missingRunDbStats)

      const snap = pipelineSnapshot({ dataDir: dir, rotation: ROT })

      // 候選等同舊旋轉序，不受隔離影響
      expect(snap.candidateEngines).toEqual(rotationOrder)
      expect(snap.pickCandidateTags).toEqual(rotationOrder)
      expect(snap.isolatedTags).toEqual(LEGACY.emptyIsolated)

      // 隔離 fail-open：reuse-current + missing-run-db
      expect(snap.isolation.kind).toBe('reuse-current')
      expect(snap.isolation.newlyIsolated).toEqual([])
      expect(snap.isolation.activeIsolatedTags).toEqual([])
      if (snap.isolation.kind === 'reuse-current') {
        expect(snap.isolation.reason).toBe('missing-run-db')
      }

      // 無有效 stats → 上下文 fallback（與舊路徑「不改候選」一致）
      expect(snap.context).toEqual(LEGACY.noRotationContext)

      expect(snap.stateFileExists).toBe(false)
      expect(snap.events).toEqual(LEGACY.emptyEvents)

      // 第二輪：仍無事件、候選不變
      const round2 = pipelineSnapshot({ dataDir: dir, rotation: ROT })
      expect(round2.events).toEqual(LEGACY.emptyEvents)
      expect(round2.pickCandidateTags).toEqual(snap.pickCandidateTags)
      expect(round2.isolation).toEqual(snap.isolation)
      expect(existsSync(join(dir, ROUTING_STATE_FILENAME))).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('run.db 存在但近窗 0 樣本（不足 minSamples）→ 沿用旋轉序', () => {
    const dir = tmpDir()
    try {
      // 建空表（RunDb 建檔即有 attempts schema，但無列）
      const db = new RunDb(join(dir, 'run.db'))
      db.close()

      const stats = fixtureStats(join(dir, 'run.db'), {
        nowIso: NOW,
        offsetHours: 0,
        minSamples: 1,
      })
      expect(stats).toEqual(LEGACY.insufficientStats)

      const snap = pipelineSnapshot({ dataDir: dir, rotation: ROT })
      expect(snap.candidateEngines).toEqual(rotationOrder)
      expect(snap.pickCandidateTags).toEqual(rotationOrder)
      expect(snap.isolatedTags).toEqual(LEGACY.emptyIsolated)
      expect(snap.isolation.kind).toBe('reuse-current')
      expect(snap.isolation.newlyIsolated).toEqual([])
      if (snap.isolation.kind === 'reuse-current') {
        expect(snap.isolation.reason).toBe('insufficient-samples')
      }
      expect(snap.context).toEqual(LEGACY.noRotationContext)
      expect(snap.stateFileExists).toBe(false)
      expect(snap.events).toEqual(LEGACY.emptyEvents)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('run.db 損壞（非 sqlite）→ query-failed，候選與舊旋轉序一致', () => {
    const dir = tmpDir()
    try {
      writeFileSync(join(dir, 'run.db'), 'not a sqlite file')
      const stats = fixtureStats(join(dir, 'run.db'), { nowIso: NOW, offsetHours: 0 })
      expect(stats).toEqual(LEGACY.queryFailedStats)

      const snap = pipelineSnapshot({ dataDir: dir, rotation: ROT })
      expect(snap.pickCandidateTags).toEqual(rotationOrder)
      expect(snap.isolatedTags).toEqual(LEGACY.emptyIsolated)
      expect(snap.isolation.kind).toBe('reuse-current')
      expect(snap.isolation.newlyIsolated).toEqual([])
      expect(snap.events).toEqual(LEGACY.emptyEvents)
      expect(snap.stateFileExists).toBe(false)
      expect(snap.context).toEqual(LEGACY.noRotationContext)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('僅窗口外樣本 → 近窗無效，等同無有效資料舊路徑', () => {
    const dir = tmpDir()
    try {
      const db = new RunDb(join(dir, 'run.db'))
      for (let i = 0; i < 10; i++) {
        db.record({
          taskId: `old${i}`,
          ok: false,
          costUsd: 0.1,
          detail: '',
          engine: 'qwen',
          ts: `2026-07-01T0${i % 9}:00:00.000Z`,
        })
      }
      db.close()

      const stats = fixtureStats(join(dir, 'run.db'), {
        nowIso: NOW,
        offsetHours: 0,
        windowDays: 3,
        minSamples: 1,
      })
      expect(stats).toEqual(LEGACY.insufficientStats)

      const snap = pipelineSnapshot({ dataDir: dir, rotation: ROT })
      expect(snap.pickCandidateTags).toEqual(rotationOrder)
      expect(snap.isolatedTags).toEqual(LEGACY.emptyIsolated)
      expect(snap.isolation.newlyIsolated).toEqual([])
      expect(snap.events).toEqual(LEGACY.emptyEvents)
      expect(snap.stateFileExists).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('有 rotation + 無有效 run.db：連跑三輪事件計數恆為 0', () => {
    const dir = tmpDir()
    try {
      const allEvents: IsolationAppliedEvent[] = []
      const candidates: string[][] = []
      for (let i = 0; i < 3; i++) {
        clearRunStatsCache()
        const snap = pipelineSnapshot({ dataDir: dir, rotation: ROT })
        allEvents.push(...snap.events)
        candidates.push(snap.pickCandidateTags)
      }
      expect(allEvents).toEqual([])
      expect(candidates).toEqual([rotationOrder, rotationOrder, rotationOrder])
      expect(existsSync(join(dir, ROUTING_STATE_FILENAME))).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('快照回歸：雙條件交叉（未設 rotation 且無 run.db）', () => {
  test('兩守門同時成立時仍收斂到 defaultEngine 舊路徑，零副作用', () => {
    const dir = tmpDir()
    try {
      expect(existsSync(join(dir, 'run.db'))).toBe(false)
      const snap = pipelineSnapshot({ dataDir: dir, rotation: undefined })

      expect({
        candidates: snap.pickCandidateTags,
        engines: snap.candidateEngines,
        isolation: snap.isolation,
        isolatedTags: snap.isolatedTags,
        events: snap.events,
        context: snap.context,
        stateFileExists: snap.stateFileExists,
      }).toEqual({
        candidates: LEGACY.noRotationCandidates,
        engines: LEGACY.noRotationCandidates,
        isolation: LEGACY.noRotationIsolation,
        isolatedTags: LEGACY.emptyIsolated,
        events: LEGACY.emptyEvents,
        context: LEGACY.noRotationContext,
        stateFileExists: false,
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
