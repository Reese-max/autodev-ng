import { describe, test, expect } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { runGoalSession, type OrchestratorDeps } from '../src/autopilot/orchestrator.js'
import { BacklogStore } from '../src/backlog.js'
import type { Goal } from '../src/autopilot/goal.js'

function base(goal: Goal, overrides: Partial<OrchestratorDeps>): OrchestratorDeps {
  const dir = mkdtempSync(join(tmpdir(), 'adng-orch-'))
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, '')
  const store = new BacklogStore(backlogFile)
  return {
    goalId: 'g1', goal, cwd: dir,
    kernelDeps: { store } as unknown as OrchestratorDeps['kernelDeps'],
    planFn: async () => ({ kind: 'achieved' }),
    evalFn: async () => ({ achieved: true, score: 1, detail: '' }),
    runOnceFn: async () => 'idle',
    isAlive: () => true,
    ...overrides
  }
}

describe('runGoalSession', () => {
  test('planner 首輪 achieved → outcome achieved', async () => {
    const out = await runGoalSession(base({ objective: 'o', noProgressLimit: 3 }, {}))
    expect(out.kind).toBe('achieved')
  })

  test('evaluator 判 achieved → achieved（planner 出任務後）', async () => {
    let planned = false
    const out = await runGoalSession(base({ objective: 'o', noProgressLimit: 3 }, {
      planFn: async () => (planned ? { kind: 'achieved' } : (planned = true, { kind: 'tasks', tasks: ['甲'] })),
      evalFn: async () => ({ achieved: true, score: 5, detail: '' })
    }))
    expect(out.kind).toBe('achieved')
  })

  test('連續無進展達上限 → no-progress', async () => {
    const out = await runGoalSession(base({ objective: 'o', noProgressLimit: 2 }, {
      planFn: async () => ({ kind: 'tasks', tasks: ['甲'] }),
      evalFn: async () => ({ achieved: false, score: 1, detail: '' }) // score 恆不升
    }))
    expect(out.kind).toBe('no-progress')
  })

  test('kill switch：isAlive false → killed', async () => {
    const out = await runGoalSession(base({ objective: 'o', noProgressLimit: 3 }, {
      isAlive: () => false
    }))
    expect(out.kind).toBe('killed')
  })

  test('planner stuck → stuck', async () => {
    const out = await runGoalSession(base({ objective: 'o', noProgressLimit: 3 }, {
      planFn: async () => ({ kind: 'stuck', reason: '沒框架' })
    }))
    expect(out).toMatchObject({ kind: 'stuck', reason: '沒框架' })
  })

  test('tasks 有被 append 進 backlog（帶 autopilot 標記）', async () => {
    const captured: string[] = []
    let done = false
    const deps = base({ objective: 'o', noProgressLimit: 3 }, {
      planFn: async () => (done ? { kind: 'achieved' } : (done = true, { kind: 'tasks', tasks: ['寫測試'] })),
      evalFn: async () => ({ achieved: true, score: 9, detail: '' })
    })
    const realAppend = deps.kernelDeps.store.append.bind(deps.kernelDeps.store)
    deps.kernelDeps.store.append = (t: string, o: { goalId: string; round: number }) => { captured.push(t); realAppend(t, o) }
    await runGoalSession(deps)
    expect(captured).toContain('寫測試')
  })
})
