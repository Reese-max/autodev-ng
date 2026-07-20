import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import type { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import type { EventLog } from '../src/events.js'
import { trackPickReadyTaskDecision } from '../src/engines/pick-ready-decision-tracker.js'
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
  rotation?: string[]
  subscriptions?: string[]
  preflight?: Record<string, boolean>
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
    engineRotation: options.rotation,
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

test('隔離分支：同一指紋涵蓋結果、事件與路由狀態寫入', async () => {
  const f = fixture({ rotation: ['qwen', 'codex'] })
  mkdirSync(f.dataDir, { recursive: true })
  const stats = new RunDb(join(f.dataDir, 'run.db'))
  for (let i = 0; i < 6; i++) {
    stats.record({
      taskId: `failed-${i}`,
      ok: false,
      costUsd: 0,
      detail: 'fixture',
      engine: 'qwen',
    })
  }
  stats.close()

  const trace = await trackPickReadyTaskDecision(
    f.deps,
    deps => pickReadyTask(deps, [TASK])
  )

  expect(trace.branchResult).toBe('picked:codex:fixed=0')
  expect(trace.events).toEqual([
    expect.objectContaining({ method: 'append', type: 'engine-route-isolated', status: 'sent' }),
  ])
  expect(trace.stateWrites).toEqual([{ target: 'routing-state', status: 'created' }])
  expect(trace.fingerprint).toBe(JSON.stringify({
    branch: 'picked:codex:fixed=0',
    events: [['append', 'engine-route-isolated', 'qwen', 'sent']],
    stateWrites: [['routing-state', 'created']],
  }))
})

test('候補分支：appendOnce 與挑選結果可直接比對', async () => {
  const f = fixture({ subscriptions: ['spark'], preflight: { qwen: false } })
  const trace = await trackPickReadyTaskDecision(
    f.deps,
    deps => pickReadyTask(deps, [TASK])
  )

  expect(trace.fingerprint).toBe(JSON.stringify({
    branch: 'picked:spark:fixed=0',
    events: [['appendOnce', 'preflight-failed', 'qwen', 'sent']],
    stateWrites: [],
  }))
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
