/**
 * 臨時 dataDir 端到端 smoke：
 * pickReadyTask 決策 → 事件計數 → 狀態匯總，作為回歸最小可重現入口。
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import type { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { ISOLATE_MIN_SAMPLES } from '../src/engines/isolation-policy.js'
import {
  buildPickReadySmokeReport,
  countTrackedEvents,
  formatPickReadySmokeSummary,
  PICK_READY_SMOKE_REPORT_FILE,
  runPickReadySmoke,
  summarizePickReadySmoke,
  writePickReadySmokeReport,
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

// ── 單元：純計數 / 報告組裝 / 匯總輸出 ────────────────────────────────

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

function sampleReport() {
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
  return buildPickReadySmokeReport({ trace, status })
}

test('buildPickReadySmokeReport：凍結決策指紋、事件計數與狀態匯總', () => {
  const report = sampleReport()
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

test('summarizePickReadySmoke / formatPickReadySmokeSummary：穩定匯總輸出', () => {
  const report = sampleReport()
  const summary = summarizePickReadySmoke(report)
  expect(Object.isFrozen(summary)).toBe(true)
  expect(summary).toEqual({
    decision: 'picked:codex:fixed=0',
    fingerprint: '{"branch":"picked:codex:fixed=0"}',
    eventCounts: {
      total: 1,
      byType: { 'engine-route-isolated': 1 },
      byStatus: { sent: 1 },
    },
    stateWrites: ['routing-state:created'],
    routing: {
      maintainOriginalPath: true,
      decision: REUSE_CURRENT,
      isolated: ['qwen'],
      standby: [],
      recentStatsKind: 'reuse-current',
    },
  })
  // 不含 observedAt，兩次 format 字串完全一致
  const a = formatPickReadySmokeSummary(report)
  const b = formatPickReadySmokeSummary(report)
  expect(a).toBe(b)
  expect(a).toContain('"decision": "picked:codex:fixed=0"')
  expect(a).toContain('"engine-route-isolated": 1')
  expect(a).toContain('"isolated": [\n      "qwen"\n    ]')
  expect(a).not.toContain(NOW)
})

test('writePickReadySmokeReport：寫入臨時 dataDir', () => {
  const root = mkdtempSync(join(process.cwd(), '.pick-ready-smoke-'))
  roots.push(root)
  const dataDir = join(root, 'state')
  mkdirSync(dataDir, { recursive: true })
  const report = sampleReport()
  const file = writePickReadySmokeReport(dataDir, report)
  expect(file).toBe(join(dataDir, PICK_READY_SMOKE_REPORT_FILE))
  expect(existsSync(file)).toBe(true)
  expect(readFileSync(file, 'utf8')).toBe(formatPickReadySmokeSummary(report))
})

// ── 端到端 smoke（臨時 dataDir + 真實 EventLog） ─────────────────────

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
      // 真實 EventLog：事件落盤到臨時 dataDir，避免 mock 跳過 I/O 路徑
      events: new EventLog(dataDir),
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
    { writeReport: true },
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

  // 匯總輸出：穩定字串 + 落盤到臨時 dataDir
  const summaryText = formatPickReadySmokeSummary(report)
  expect(summaryText).toContain('"decision": "picked:codex:fixed=0"')
  expect(summaryText).toContain('"engine-route-isolated"')
  expect(summaryText).toContain('"qwen"')
  const reportFile = join(f.dataDir, PICK_READY_SMOKE_REPORT_FILE)
  expect(existsSync(reportFile)).toBe(true)
  expect(readFileSync(reportFile, 'utf8')).toBe(summaryText)

  // 真實 EventLog 已寫入 events.jsonl
  expect(existsSync(join(f.dataDir, 'events.jsonl'))).toBe(true)
  const eventsBody = readFileSync(join(f.dataDir, 'events.jsonl'), 'utf8')
  expect(eventsBody).toContain('engine-route-isolated')
})

test('E2E smoke：無戰績時沿用現狀、事件計數為 0、匯總仍可輸出', async () => {
  const f = smokeFixture({ rotation: ['qwen'], failedQwenRuns: 0 })

  const report = await runPickReadySmoke(
    f.deps,
    deps => pickReadyTask(deps, [TASK]),
    { writeReport: true },
  )

  expect(report.decision.branchResult).toBe('picked:qwen:fixed=0')
  expect(report.eventCounts.total).toBe(0)
  expect(report.eventCounts.byType).toEqual({})
  expect(report.status.isolatedEngines).toEqual([])
  expect(report.status.observedAt).toEqual(expect.any(String))
  expect(report.status.recentStats).toBeDefined()

  const summary = summarizePickReadySmoke(report)
  expect(summary.decision).toBe('picked:qwen:fixed=0')
  expect(summary.eventCounts.total).toBe(0)
  expect(summary.routing.isolated).toEqual([])
  expect(existsSync(join(f.dataDir, PICK_READY_SMOKE_REPORT_FILE))).toBe(true)
})
