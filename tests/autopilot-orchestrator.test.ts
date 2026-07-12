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

  test('inner loop 不因 preflight-failed 無限緊迴圈：中止交還外層 no-progress 煞車', async () => {
    const out = await runGoalSession(base({ objective: 'o', noProgressLimit: 2 }, {
      planFn: async () => ({ kind: 'tasks', tasks: ['甲'] }),
      runOnceFn: async () => 'preflight-failed', // 任務永遠不被消耗，若不中止會無限重撿同一任務
      evalFn: async () => ({ achieved: false, score: 1, detail: '' }) // score 恆不升
    }))
    expect(out.kind).toBe('no-progress')
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

  test('append 去重：同 session 相同任務文字只 append 一次', async () => {
    const appended: string[] = []
    const deps = base({ objective: 'o', noProgressLimit: 2 }, {
      planFn: async () => ({ kind: 'tasks', tasks: ['重複任務甲'] }), // 每輪都回同一條
      evalFn: async () => ({ achieved: false, score: 1, detail: '' })  // 恆不進步 → 多輪
    })
    const realAppend = deps.kernelDeps.store.append.bind(deps.kernelDeps.store)
    deps.kernelDeps.store.append = (t: string, o: { goalId: string; round: number }) => { appended.push(t); realAppend(t, o) }
    const out = await runGoalSession(deps)
    expect(out.kind).toBe('no-progress')                 // 仍正常終止
    expect(appended.filter(t => t === '重複任務甲')).toHaveLength(1) // 只 append 一次
  })

  test('M9.7：discovered 有排序問題時 repoSummary 含問題清單', async () => {
    let seenSummary = ''
    const deps = {
      goalId: 'g', goal: { objective: 'o', noProgressLimit: 1 }, cwd: '/p', kernelDeps: {} as never, lessonsText: '',
      discovered: { survey: 'coverage 40%', ranked: [{ value: 9, title: 'api 斷言弱', lens: 'tests', rationale: '高頻' }] },
      planFn: async (input: { repoSummary: string }) => { seenSummary = input.repoSummary; return { kind: 'achieved' as const } },
      evalFn: async () => ({ achieved: true, score: 1, detail: '' }),
      runOnceFn: async () => 'done' as never, isAlive: () => true
    }
    await runGoalSession(deps as never)
    expect(seenSummary).toContain('coverage 40%')
    expect(seenSummary).toContain('api 斷言弱')
  })
  test('M9.7：無 discovered → repoSummary 維持 round N（向後相容）', async () => {
    let seenSummary = ''
    const deps = {
      goalId: 'g', goal: { objective: 'o', noProgressLimit: 1 }, cwd: '/p', kernelDeps: {} as never, lessonsText: '',
      planFn: async (input: { repoSummary: string }) => { seenSummary = input.repoSummary; return { kind: 'achieved' as const } },
      evalFn: async () => ({ achieved: true, score: 1, detail: '' }),
      runOnceFn: async () => 'done' as never, isAlive: () => true
    }
    await runGoalSession(deps as never)
    expect(seenSummary).toMatch(/round 1/)
  })
})
