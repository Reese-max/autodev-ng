/**
 * 臨時 dataDir 端到端 smoke：
 * pickReadyTask 決策 → 事件計數 → 狀態匯總，作為回歸最小可重現入口。
 */
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import type { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import type { EventLog } from '../src/events.js'
import { ISOLATE_MIN_SAMPLES } from '../src/engines/isolation-policy.js'
import {
  buildPickReadySmokeReport,
  countTrackedEvents,
  runPickReadySmoke,
} from '../src/engines/pick-ready-smoke.js'
import type {
  PickReadyTaskDecisionTrace,
  TrackedDecisionEvent,
} from '../src/engines/pick-ready-decision-tracker.js'
import { clearRunStatsCache, REUSE_CURRENT } from '../src/engines/run-stats.js'
import { pickReadyTask, type Deps } from '../src/scheduler.js'
import { ConfigSchema, type Engine, type Task } from '../src/types.js'

const roots: string[] = []
const TASK: Task = { id: '00000000', text: 'smoke 決策測試', line: 0, status: 'open' }
const NOW = '2026-07-20T12:00:00.000Z'

afterEach(() => {
  clearRunStatsCache()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

// ── 單元：純計數 / 報告組裝 ──────────────────────────────────────────

test('countTrackedEvents：依 type 與 status 計數', () => {
  const events: TrackedDecisionEvent[] = [
    { method: 'append', type: 'engine-route-isolated', data: { engine: 'qwen' }, status: 'sent' },
    { method: 'appendOnce', type: 'preflight-failed', data: { engine: 'qwen' }, status: 'sent' },
    { method: 'appendOnce', type: 'preflight-failed', data: { engine: 'qwen' }, status: 'skipped' },
  ]
  expect(countTrackedEvents(events)).toEqual({
    total: 3,
    byType: { 'engine-route-isolated': 1, 'preflight-failed': 2 },
    byStatus: { sent: 2, skipped: 1 },
  })
})

test('countTrackedEvents：空列表回 total=0', () => {
  expect(countTrackedEvents([])).toEqual({ total: 0, byType: {}, byStatus: {} })
})

test('buildPickReadySmokeReport：凍結決策指紋、事件計數與狀態匯總', () => {
  const events: TrackedDecisionEvent[] = [
    { method: 'append', type: 'engine-route-isolated', data: { engine: 'qwen' }, status: 'sent' },
  ]
  const trace = {
    result: { engineTag: 'codex', fixedCost: 0 },
    branchResult: 'picked:codex:fixed=0',
    events,
    stateWrites: [{ target: 'routing-state', status: 'created' }],
    fingerprint: '{"branch":"picked:codex:fixed=0"}',
  } as PickReadyTaskDecisionTrace<{ engineTag: string; fixedCost: number }>
  const status = {
    observedAt: NOW,
    maintainOriginalPath: true,
    decision: REUSE_CURRENT,
    stateLoad: { kind: 'state' as const, source: 'file' as const },
    isolatedEngines: [{ engine: 'qwen', reason: 'bad', nextProbeAt: '2026-07-21T12:00:00.000Z' }],
    standbyEngines: [],
    recentStats: { kind: 'reuse-current' as const, decision: REUSE_CURRENT, reason: 'missing-run-db' },
  }

  const report = buildPickReadySmokeReport({ trace, status })
  expect(Object.isFrozen(report)).toBe(true)
  expect(report.decision).toEqual({
    branchResult: 'picked:codex:fixed=0',
    fingerprint: '{"branch":"picked:codex:fixed=0"}',
  })
  expect(report.eventCounts).toEqual({
    total: 1,
    byType: { 'engine-route-isolated': 1 },
    byStatus: { sent: 1 },
  })
  expect(report.stateWrites).toEqual([{ target: 'routing-state', status: 'created' }])
  expect(report.status.isolatedEngines).toHaveLength(1)
  expect(report.status.isolatedEngines[0]?.engine).toBe('qwen')
})

// ── 端到端 smoke（臨時 dataDir） ─────────────────────────────────────

function smokeFixture(options: {
  rotation?: readonly string[]
  failedQwenRuns?: number
} = {}): {
  root: string
  dataDir: string
  deps: Pick<Deps, 'cfg' | 'store' | 'db' | 'events' | 'engines'>
} {
  const root = mkdtempSync(join(process.cwd(), '.pick-ready-smoke-'))
  roots.push(root)
  const dataDir = join(root, 'state')
  mkdirSync(dataDir, { recursive: true })

  const rotation = options.rotation ?? ['qwen', 'codex']
  const tags = new Set(['qwen', ...rotation])
  const engines = Object.fromEntries([...tags].map(tag => [tag, {
    adapter: 'mock' as const,
    costPerRunUsd: 0,
  }]))
  const cfg = ConfigSchema.parse({
    projectPath: root,
    backlogFile: join(root, 'BACKLOG.md'),
    dataDir,
    defaultEngine: 'qwen',
    engineRotation: [...rotation],
    engines,
  })

  const failed = options.failedQwenRuns ?? 0
  if (failed > 0) {
    const stats = new RunDb(join(dataDir, 'run.db'))
    try {
      for (let i = 0; i < failed; i++) {
        stats.record({
          taskId: `failed-${i}`,
          ok: false,
          costUsd: 0,
          detail: 'smoke-fixture',
          engine: 'qwen',
        })
      }
    } finally {
      stats.close()
    }
  }

  const engineByTag = new Map([...tags].map(tag => [tag, {
    id: tag,
    async preflight() {
      return { ok: true, detail: 'ready' }
    },
    async run() {
      return { ok: true, output: '', costUsd: 0 }
    },
  } satisfies Engine]))

  return {
    root,
    dataDir,
    deps: {
      cfg,
      store: { report: vi.fn() } as unknown as BacklogStore,
      db: { failCount: () => 0 } as unknown as RunDb,
      events: {
        append: vi.fn(),
        appendOnce: vi.fn(() => true),
      } as unknown as EventLog,
      engines: {
        resolve(tag: string) {
          const engine = engineByTag.get(tag)
          if (!engine) throw new Error(`smoke fixture engine missing: ${tag}`)
          return engine
        },
      },
    },
  }
}

test('E2E smoke：臨時 dataDir 串起決策、事件計數與狀態匯總', async () => {
  const f = smokeFixture({
    rotation: ['qwen', 'codex'],
    failedQwenRuns: ISOLATE_MIN_SAMPLES,
  })
  expect(existsSync(join(f.dataDir, 'run.db'))).toBe(true)

  const report = await runPickReadySmoke(
    f.deps,
    deps => pickReadyTask(deps, [TASK]),
  )

  // 決策：qwen 被隔離 → 選 codex
  expect(report.decision.branchResult).toBe('picked:codex:fixed=0')
  expect(report.decision.fingerprint.length).toBeGreaterThan(0)

  // 事件計數：至少一則 engine-route-isolated
  expect(report.eventCounts.total).toBeGreaterThanOrEqual(1)
  expect(report.eventCounts.byType['engine-route-isolated']).toBe(1)
  expect(report.eventCounts.byStatus.sent).toBeGreaterThanOrEqual(1)

  // 狀態寫入：routing-state 新建
  expect(report.stateWrites).toContainEqual({ target: 'routing-state', status: 'created' })

  // 狀態匯總：qwen 在隔離清單、近三日樣本可讀
  expect(report.status.observedAt).toEqual(expect.any(String))
  expect(report.status.isolatedEngines.map(e => e.engine)).toContain('qwen')
  expect(report.status.standbyEngines).toEqual(expect.any(Array))
  expect(report.status.recentStats.kind === 'stats' || report.status.recentStats.kind === 'reuse-current').toBe(true)
  if (report.status.recentStats.kind === 'stats') {
    expect(report.status.recentStats.sampleCount).toBeGreaterThanOrEqual(ISOLATE_MIN_SAMPLES)
  }
})

test('E2E smoke：無戰績時沿用現狀、事件計數為 0、匯總仍可輸出', async () => {
  const f = smokeFixture({ rotation: ['qwen'], failedQwenRuns: 0 })

  const report = await runPickReadySmoke(
    f.deps,
    deps => pickReadyTask(deps, [TASK]),
  )

  expect(report.decision.branchResult).toBe('picked:qwen:fixed=0')
  expect(report.eventCounts.total).toBe(0)
  expect(report.eventCounts.byType).toEqual({})
  expect(report.status.isolatedEngines).toEqual([])
  expect(report.status.observedAt).toEqual(expect.any(String))
  expect(report.status.recentStats).toBeDefined()
})
