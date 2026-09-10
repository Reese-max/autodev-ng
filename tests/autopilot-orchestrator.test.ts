import { describe, test, expect } from 'vitest'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { runGoalSession, type OrchestratorDeps } from '../src/autopilot/orchestrator.js'
import { BacklogStore, parseBacklog, taskId } from '../src/backlog.js'
import type { Goal } from '../src/autopilot/goal.js'
import { EventLog } from '../src/events.js'

function base(goal: Goal, overrides: Partial<OrchestratorDeps>): OrchestratorDeps {
  const dir = mkdtempSync(join(tmpdir(), 'adng-orch-'))
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, '')
  const store = new BacklogStore(backlogFile)
  return {
    goalId: 'g1', goal, cwd: dir,
    kernelDeps: {
      store,
      cfg: { backlogFile },
      events: new EventLog(dir),
    } as unknown as OrchestratorDeps['kernelDeps'],
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

  // 2026-07-30 實證回歸鎖：GOAL 背景含「急救已完成」措辭，planner 口頭 ACHIEVED 而驗收檔不存在，
  // 仍被記 achieved。planner 的 ACHIEVED 必須過 evalFn 機械驗收，紅燈不採信。
  test('planner 口頭 ACHIEVED 但機械驗收紅 → 不採信，達上限轉 no-progress', async () => {
    let evals = 0
    const out = await runGoalSession(base({ objective: 'o', noProgressLimit: 2 }, {
      planFn: async () => ({ kind: 'achieved' }),
      evalFn: async () => { evals++; return { achieved: false, score: 0, detail: 'verify exit=1' } }
    }))
    expect(out.kind).toBe('no-progress')
    expect(evals).toBe(2) // 每次口頭 ACHIEVED 都被強制驗證，而非首輪直接採信
  })

  test('planner 口頭 ACHIEVED、驗收第二輪轉綠 → 該輪才記 achieved', async () => {
    let evals = 0
    const out = await runGoalSession(base({ objective: 'o', noProgressLimit: 5 }, {
      planFn: async () => ({ kind: 'achieved' }),
      evalFn: async () => { evals++; return { achieved: evals >= 2, score: evals, detail: '' } }
    }))
    expect(out).toMatchObject({ kind: 'achieved', rounds: 2 })
  })

  test('inner loop 不因 preflight-failed 無限緊迴圈：中止交還外層 no-progress 煞車', async () => {
    const out = await runGoalSession(base({ objective: 'o', noProgressLimit: 2 }, {
      planFn: async () => ({ kind: 'tasks', tasks: ['甲'] }),
      runOnceFn: async () => 'preflight-failed', // 任務永遠不被消耗，若不中止會無限重撿同一任務
      evalFn: async () => ({ achieved: false, score: 1, detail: '' }) // score 恆不升
    }))
    expect(out.kind).toBe('no-progress')
  })

  test('引擎供應 deferred：立即交還外層且保留 open 任務', async () => {
    const deps = base({ objective: 'o', noProgressLimit: 2 }, {
      planFn: async () => ({ kind: 'tasks', tasks: ['等待供應的任務'] }),
      runOnceFn: async () => 'deferred',
    })
    const out = await runGoalSession(deps)
    expect(out).toMatchObject({ kind: 'stuck', retryable: true, rounds: 1 })
    expect(deps.kernelDeps.store.nextTask()?.text).toBe('等待供應的任務')
  })

  test('free-only 預檢缺額度不消耗 no-progress，也不進入 evaluator', async () => {
    const deps = base({ objective: 'o', noProgressLimit: 1 }, {
      planFn: async () => ({ kind: 'tasks', tasks: ['等待免費 worker'] }), runOnceFn: async () => 'preflight-failed',
      evalFn: async () => { throw new Error('Supply wait must precede evaluation') },
    })
    deps.kernelDeps.cfg.tierMode = 'free-only'
    expect(await runGoalSession(deps)).toMatchObject({ kind: 'stuck', retryable: true, rounds: 1 })
    expect(deps.kernelDeps.store.nextTask()?.status).toBe('open')
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

  test('首次命中 blocked：舊行 superseded 對照新 ID，重開文字逐字帶拒收根因', async () => {
    const deps = base({ objective: 'o', noProgressLimit: 1 }, {})
    const oldText = '修正主分支衝突'
    const reason = 'merge-conflict：主分支已前進 > 舊基線'
    writeFileSync(join(deps.cwd, 'BACKLOG.md'), `- [ ] [engine:agy] ${oldText} <!-- adng:autopilot goal:g0 round:1 --> <!-- adng:blocked reason=${JSON.stringify(reason)} -->\n`)
    deps.planFn = async () => ({ kind: 'tasks', tasks: [oldText, '同批其他候選'] })
    deps.evalFn = async () => ({ achieved: true, score: 1, detail: '' })

    expect((await runGoalSession(deps)).kind).toBe('achieved')

    const md = readFileSync(join(deps.cwd, 'BACKLOG.md'), 'utf8')
    const reopened = parseBacklog(md).find(task => task.text.startsWith(`${oldText}（既有實況：`))!
    expect(reopened.id).toBe(taskId(reopened.text))
    expect(reopened.status).toBe('open')
    expect(reopened.engineTag).toBe('agy')
    expect(reopened.text).toContain(`adng:blocked reason=${JSON.stringify(reason)}`)
    expect(md).toContain(`<!-- adng:superseded by:${reopened.id} -->`)
    expect(md).toContain(`id:${reopened.id} reopen-from:${taskId(oldText)}`)
    expect(md).toContain('- [ ] 同批其他候選')
  })

  test('重開任務再 blocked：append exhausted 事件並跳過它，仍追加同批其他候選', async () => {
    const deps = base({ objective: 'o', noProgressLimit: 1 }, {})
    const oldText = '修正重複失敗'
    writeFileSync(join(deps.cwd, 'BACKLOG.md'), `- [ ] ${oldText} <!-- adng:blocked reason="第一次失敗" -->\n`)
    deps.planFn = async () => ({ kind: 'tasks', tasks: [oldText] })
    deps.evalFn = async () => ({ achieved: true, score: 1, detail: '' })
    await runGoalSession(deps)

    const reopened = deps.kernelDeps.store.read().find(task => task.text.startsWith(`${oldText}（既有實況：`))!
    deps.kernelDeps.store.report(reopened.id, { kind: 'blocked', reason: '修復仍失敗' })
    deps.planFn = async () => ({ kind: 'tasks', tasks: [reopened.text, '額度耗盡後的下一候選'] })

    expect((await runGoalSession(deps)).kind).toBe('achieved')
    const md = readFileSync(join(deps.cwd, 'BACKLOG.md'), 'utf8')
    expect(md).toContain('- [ ] 額度耗盡後的下一候選')
    expect(md.match(/adng:superseded/g)).toHaveLength(1)
    const events = readFileSync(join(deps.cwd, 'events.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line))
    expect(events).toContainEqual(expect.objectContaining({
      type: 'blocked-reopen-exhausted',
      existingStatus: 'blocked',
      reopenHistory: 'reopened',
      taskId: reopened.id,
    }))
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
