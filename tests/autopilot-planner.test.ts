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

  function capturingLlm(): [LlmOpts, () => string] {
    let captured = ''
    const fetchFn = (async (_url: string, init: { body: string }) => {
      captured = (JSON.parse(init.body) as { messages: Array<{ content: string }> }).messages[0]!.content
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'ACHIEVED' } }] }) }
    }) as unknown as typeof fetch
    return [{ url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn }, () => captured]
  }

  test('lessonsText 有值 → 傳給 llm 的 prompt 包含教訓文字', async () => {
    const [llm, getPrompt] = capturingLlm()
    await plan(llm, { goal, repoSummary: '', history: [], lessonsText: '# Learnings\n- L001 [2026-07-10] 教訓內容' })
    expect(getPrompt()).toContain('L001 [2026-07-10] 教訓內容')
  })

  test('lessonsText 未設 → prompt 與空字串時位元級相同（現狀不變）', async () => {
    const [llmA, getA] = capturingLlm()
    await plan(llmA, { goal, repoSummary: '', history: [] })
    const [llmB, getB] = capturingLlm()
    await plan(llmB, { goal, repoSummary: '', history: [], lessonsText: '' })
    expect(getA()).toBe(getB())
    expect(getA()).not.toContain('Learnings')
  })
})
