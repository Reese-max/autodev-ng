import { describe, test, expect } from 'vitest'
import { plan } from '../src/autopilot/planner.js'
import type { Goal } from '../src/autopilot/goal.js'
import type { LlmOpts } from '../src/autopilot/llm.js'

const goal: Goal = { objective: '拉高覆蓋率', noProgressLimit: 3 }
function llmReturning(content: string): LlmOpts {
  const fetchFn = (async () => ({ ok: true, status: 200,
    json: async () => ({ choices: [{ message: { content } }] }) })) as unknown as typeof fetch
  return { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn }
}

describe('planner.plan', () => {
  test('TASKS → 逐行任務清單', async () => {
    const r = await plan(llmReturning('TASKS\n補 foo 的測試\n補 bar 的測試'), { goal, repoSummary: '', history: [] })
    expect(r).toEqual({ kind: 'tasks', tasks: ['補 foo 的測試', '補 bar 的測試'] })
  })
  test('ACHIEVED → achieved', async () => {
    expect(await plan(llmReturning('ACHIEVED'), { goal, repoSummary: '', history: [] }))
      .toEqual({ kind: 'achieved' })
  })
  test('STUCK → stuck + 理由', async () => {
    expect(await plan(llmReturning('STUCK: 缺乏測試框架'), { goal, repoSummary: '', history: [] }))
      .toEqual({ kind: 'stuck', reason: '缺乏測試框架' })
  })
  test('LLM 空回應（fail-open）→ stuck', async () => {
    const r = await plan({ model: 'm', apiKey: 'k' }, { goal, repoSummary: '', history: [] })
    expect(r).toEqual({ kind: 'stuck', reason: 'planner 無回應' })
  })
  test('TASKS 去空行去重', async () => {
    const r = await plan(llmReturning('TASKS\n甲\n\n甲\n乙'), { goal, repoSummary: '', history: [] })
    expect(r).toEqual({ kind: 'tasks', tasks: ['甲', '乙'] })
  })
  test('TASKS 標記剝除不吃任務開頭數字（3D 列印外殼 / 2024 年度報告需完整保留）', async () => {
    const r = await plan(
      llmReturning('TASKS\n3D 列印外殼\n2024 年度報告'),
      { goal, repoSummary: '', history: [] }
    )
    expect(r).toEqual({ kind: 'tasks', tasks: ['3D 列印外殼', '2024 年度報告'] })
  })
  test('TASKS 真正的清單標記（- / 數字.）仍正確剝除', async () => {
    const r = await plan(
      llmReturning('TASKS\n- 甲\n1. 乙'),
      { goal, repoSummary: '', history: [] }
    )
    expect(r).toEqual({ kind: 'tasks', tasks: ['甲', '乙'] })
  })
})
