import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import type { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import type { EventLog } from '../src/events.js'
import { trackPickReadyTaskDecision } from '../src/engines/pick-ready-decision-tracker.js'
import { defaultRoutingState, loadRoutingState, saveRoutingState } from '../src/engines/routing-state.js'
import { isSingleProbeEligible } from '../src/engines/routing-transition.js'
import { clearRunStatsCache } from '../src/engines/run-stats.js'
import { pickReadyTask, type Deps } from '../src/scheduler.js'
import { ConfigSchema, type Engine, type Task } from '../src/types.js'

const roots: string[] = []
const TASK: Task = { id: '00000000', text: '決策追蹤測試', line: 0, status: 'open' }

afterEach(() => {
  clearRunStatsCache()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function fixture(options: {
  rotation?: readonly string[]
  subscriptions?: readonly string[]
  preflight?: Readonly<Record<string, boolean>>
} = {}): {
  root: string
  dataDir: string
  deps: Pick<Deps, 'cfg' | 'store' | 'db' | 'events' | 'engines'>
} {
  const root = mkdtempSync(join(process.cwd(), '.pick-ready-trace-'))
  roots.push(root)
  const dataDir = join(root, 'state')
  const subscriptions = new Set(options.subscriptions ?? [])
  const tags = new Set(['qwen', ...(options.rotation ?? []), ...subscriptions])
  const engines = Object.fromEntries([...tags].map(tag => [tag, {
    adapter: 'mock' as const,
    costPerRunUsd: 0,
    ...(subscriptions.has(tag) ? { subscription: true } : {}),
  }]))
  const cfg = ConfigSchema.parse({
    projectPath: root,
    backlogFile: join(root, 'BACKLOG.md'),
    dataDir,
    defaultEngine: 'qwen',
    engineRotation: options.rotation ? [...options.rotation] : undefined,
    engines,
  })
  const engineByTag = new Map([...tags].map(tag => [tag, {
    id: tag,
    async preflight() {
      const ok = options.preflight?.[tag] ?? true
      return { ok, detail: ok ? 'ready' : 'unavailable' }
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
          if (!engine) throw new Error(`fixture engine missing: ${tag}`)
          return engine
        },
      },
    },
  }
}

interface RoutingScenario {
  name: '隔離命中' | '試探放行' | '候補補位' | '沿用現狀'
  engineRotation?: readonly string[]
  failedQwenRuns?: number
  probeReady?: boolean
  subscriptions?: readonly string[]
  preflight?: Readonly<Record<string, boolean>>
  expectedFingerprint: string
}

const ROUTING_SCENARIOS: readonly RoutingScenario[] = [
  {
    name: '隔離命中',
    engineRotation: ['qwen', 'codex'],
    failedQwenRuns: 6,
    expectedFingerprint: JSON.stringify({
      branch: 'picked:codex:fixed=0',
      events: [['append', 'engine-route-isolated', 'qwen', 'sent']],
      stateWrites: [['routing-state', 'created']],
    }),
  },
  {
    name: '試探放行',
    engineRotation: ['qwen', 'codex'],
    failedQwenRuns: 6,
    probeReady: true,
    expectedFingerprint: JSON.stringify({
      branch: 'picked:qwen:fixed=0',
      events: [],
      stateWrites: [],
    }),
  },
  {
    name: '候補補位',
    engineRotation: ['qwen'],
    subscriptions: ['spark'],
    preflight: { qwen: false },
    expectedFingerprint: JSON.stringify({
      branch: 'picked:spark:fixed=0',
      events: [['appendOnce', 'preflight-failed', 'qwen', 'sent']],
      stateWrites: [],
    }),
  },
  {
    name: '沿用現狀',
    expectedFingerprint: JSON.stringify({
      branch: 'picked:qwen:fixed=0',
      events: [],
      stateWrites: [],
    }),
  },
]

function routingScenarioFixture(scenario: RoutingScenario) {
  const base = fixture({
    rotation: scenario.engineRotation,
    subscriptions: scenario.subscriptions,
    preflight: scenario.preflight,
  })
  mkdirSync(base.dataDir, { recursive: true })
  const runDb = join(base.dataDir, 'run.db')
  const stats = new RunDb(runDb)
  try {
    for (let i = 0; i < (scenario.failedQwenRuns ?? 0); i++) {
      stats.record({ taskId: `failed-${i}`, ok: false, costUsd: 0, detail: 'fixture', engine: 'qwen' })
    }
  } finally {
    stats.close()
  }

  if (scenario.probeReady) {
    const nowIso = new Date().toISOString()
    const state = defaultRoutingState(nowIso)
    state.isolated.qwen = {
      untilTs: new Date(Date.parse(nowIso) - 1).toISOString(),
      reason: 'fixture-probe-ready',
    }
    if (!saveRoutingState(base.dataDir, state, { nowIso })) throw new Error('fixture routing state write failed')
  }
  return { ...base, engineRotation: scenario.engineRotation, runDb }
}

test.each(ROUTING_SCENARIOS)('$name：參數 fixture 可重現完整分支指紋', async scenario => {
  const f = routingScenarioFixture(scenario)
  expect(f.deps.cfg.engineRotation).toEqual(f.engineRotation)
  expect(f.runDb).toBe(join(f.dataDir, 'run.db'))
  expect(existsSync(f.runDb)).toBe(true)
  if (scenario.probeReady) {
    expect(isSingleProbeEligible(loadRoutingState(f.dataDir).state, 'qwen', new Date().toISOString())).toBe(true)
  }

  const trace = await trackPickReadyTaskDecision(
    f.deps,
    deps => pickReadyTask(deps, [TASK])
  )
  expect(trace.fingerprint).toBe(scenario.expectedFingerprint)
})

test('blocked 分支：攔截 backlog 狀態寫入但不改原回傳', async () => {
  const f = fixture()
  const task = { ...TASK, engineTag: 'missing' }
  const trace = await trackPickReadyTaskDecision(
    f.deps,
    deps => pickReadyTask(deps, [task])
  )

  expect(trace.result).toMatchObject({ kind: 'blocked', reason: 'engine-not-allowed' })
  expect(trace.stateWrites).toEqual([
    expect.objectContaining({ target: 'backlog', taskId: TASK.id, status: 'written' }),
  ])
  expect(trace.fingerprint).toBe(JSON.stringify({
    branch: 'blocked:engine-not-allowed',
    events: [['append', 'task-blocked', null, 'sent']],
    stateWrites: [['backlog', 'blocked', 'written']],
  }))
})
