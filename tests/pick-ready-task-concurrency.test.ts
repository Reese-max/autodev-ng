import { beforeEach, expect, test, vi } from 'vitest'
import type { BacklogStore } from '../src/backlog.js'
import type { RunDb } from '../src/db.js'
import type { EventLog } from '../src/events.js'
import { pickReadyTask, type Deps } from '../src/scheduler.js'
import { ConfigSchema, type Engine, type Task } from '../src/types.js'

const effects = vi.hoisted(() => ({
  calls: new Map<string, number>(),
  writes: new Map<string, number>(),
}))

vi.mock('../src/engines/apply-stats-isolation.js', () => ({
  loadIsolatedTagsForPick: vi.fn(async (
    input: { dataDir: string },
    onEvent?: (event: Record<string, unknown>) => void
  ) => {
    const key = input.dataDir
    effects.calls.set(key, (effects.calls.get(key) ?? 0) + 1)
    await Promise.resolve()
    effects.writes.set(key, (effects.writes.get(key) ?? 0) + 1)
    onEvent?.({
      engine: 'qwen',
      reason: key,
      sampleCount: 6,
      successRate: 0,
      untilTs: '2026-07-21T00:00:00.000Z',
    })
    return []
  }),
}))

const TASK: Task = {
  id: '00000000',
  text: '併發路由測試',
  line: 0,
  status: 'open',
}

function fixture(decision: string, rotation: string[] | null = ['qwen']): {
  deps: Pick<Deps, 'cfg' | 'store' | 'db' | 'events' | 'engines'>
  append: ReturnType<typeof vi.fn>
  preflight: ReturnType<typeof vi.fn>
} {
  const dataDir = `pick-ready-${decision}`
  const cfg = ConfigSchema.parse({
    projectPath: '.',
    backlogFile: 'unused.md',
    dataDir,
    engine: 'mock',
    defaultEngine: 'qwen',
    engineRotation: rotation ?? undefined,
    engines: { qwen: { adapter: 'mock' } },
  })
  const append = vi.fn()
  const preflight = vi.fn(async () => ({ ok: true, detail: '' }))
  const engine: Engine = {
    id: 'qwen',
    preflight,
    run: vi.fn(async () => ({ ok: true, output: '', costUsd: 0 })),
  }
  return {
    deps: {
      cfg,
      store: { report: vi.fn() } as unknown as BacklogStore,
      db: { failCount: () => 0 } as unknown as RunDb,
      events: { append, appendOnce: vi.fn() } as unknown as EventLog,
      engines: { resolve: () => engine },
    },
    append,
    preflight,
  }
}

beforeEach(() => {
  effects.calls.clear()
  effects.writes.clear()
})

test.each(['隔離', '試探', '晉升'])('%s：同輪多個 pickReadyTask 只寫狀態、派事件一次', async decision => {
  const { deps, append, preflight } = fixture(decision)
  const calls = Array.from({ length: 3 }, () => pickReadyTask(deps, [TASK]))
  const picked = await Promise.all(calls)

  expect(effects.calls.get(deps.cfg.dataDir)).toBe(1)
  expect(effects.writes.get(deps.cfg.dataDir)).toBe(1)
  expect(append).toHaveBeenCalledOnce()
  expect(picked.map(result => typeof result === 'object' && 'engineTag' in result ? result.engineTag : result))
    .toEqual(['qwen', 'qwen', 'qwen'])
  expect(preflight).toHaveBeenCalledTimes(3)

  await pickReadyTask(deps, [TASK])
  expect(effects.calls.get(deps.cfg.dataDir)).toBe(2)
  expect(effects.writes.get(deps.cfg.dataDir)).toBe(2)
  expect(append).toHaveBeenCalledTimes(2)
})

test('未設 engineRotation：不進戰績路由層，直接沿用 defaultEngine', async () => {
  const { deps, append, preflight } = fixture('no-rotation', null)

  const picked = await pickReadyTask(deps, [TASK])

  expect(effects.calls.has(deps.cfg.dataDir)).toBe(false)
  expect(effects.writes.has(deps.cfg.dataDir)).toBe(false)
  expect(append).not.toHaveBeenCalled()
  expect(preflight).toHaveBeenCalledOnce()
  expect(typeof picked === 'object' && 'engineTag' in picked ? picked.engineTag : picked).toBe('qwen')
})
