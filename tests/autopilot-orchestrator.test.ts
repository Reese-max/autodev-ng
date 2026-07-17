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

  test('跨 session 去重：backlog 既有任務種進 history（含狀態）且同文任務不再 append', async () => {
    const deps = base({ objective: 'o', noProgressLimit: 1 }, {})
    // 直接寫 backlog 檔：一條 done、一條 blocked、一條 open（模擬前一個 session 留下的狀態）
    writeFileSync(join(deps.cwd, 'BACKLOG.md'), [
      '- [x] 已完成的舊任務 <!-- adng:autopilot goal:g1 round:1 --> <!-- adng:done abc123 -->',
      '- [ ] 已卡死的舊任務 <!-- adng:autopilot goal:g1 round:1 --> <!-- adng:blocked reason="連敗" -->',
      '- [ ] 還開著的舊任務 <!-- adng:autopilot goal:g1 round:2 -->',
      ''
    ].join('\n'))
    let seenHistory: string[] = []
    const appended: string[] = []
    deps.planFn = async (input) => {
      seenHistory = input.history
      // planner 不聽話重出既有同文任務 → appendedTexts 開場種子必須擋下 append
      return seenHistory.length ? { kind: 'tasks', tasks: ['已完成的舊任務', '全新任務'] } : { kind: 'achieved' }
    }
    deps.evalFn = async () => ({ achieved: true, score: 1, detail: '' })
    const realAppend = deps.kernelDeps.store.append.bind(deps.kernelDeps.store)
    deps.kernelDeps.store.append = (t: string, o: { goalId: string; round: number }) => { appended.push(t); realAppend(t, o) }
    await runGoalSession(deps)
    expect(seenHistory).toContain('既有任務(done): 已完成的舊任務')
    expect(seenHistory).toContain('既有任務(blocked): 已卡死的舊任務')
    expect(seenHistory).toContain('既有任務(open): 還開著的舊任務')
    expect(appended).toEqual(['全新任務']) // 同文舊任務被擋、新任務照常 append
  })

  test('M9.7：discovered 有排序問題時 repoSummary 含問題清單', async () => {
    let seenSummary = ''
    await runGoalSession(base({ objective: 'o', noProgressLimit: 1 }, {
      discovered: { survey: 'coverage 40%', ranked: [{ value: 9, title: 'api 斷言弱', lens: 'tests', rationale: '高頻' }] },
      planFn: async (input) => { seenSummary = input.repoSummary; return { kind: 'achieved' } }
    }))
    expect(seenSummary).toContain('coverage 40%')
    expect(seenSummary).toContain('api 斷言弱')
  })
  test('M9.7：無 discovered → repoSummary 維持 round N（向後相容）', async () => {
    let seenSummary = ''
    await runGoalSession(base({ objective: 'o', noProgressLimit: 1 }, {
      planFn: async (input) => { seenSummary = input.repoSummary; return { kind: 'achieved' } }
    }))
    expect(seenSummary).toMatch(/round 1/)
  })
})
