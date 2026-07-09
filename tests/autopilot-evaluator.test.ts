import { describe, test, expect } from 'vitest'
import { evaluate } from '../src/autopilot/evaluator.js'
import type { Goal } from '../src/autopilot/goal.js'

const withVerify: Goal = { objective: 'o', verifyCommand: 'npm run verify', noProgressLimit: 3 }
const noVerify: Goal = { objective: 'o', noProgressLimit: 3 }
const llm = { model: 'm', apiKey: 'k' } // url 省略：callAgent fail-open 回 ''

describe('evaluate', () => {
  test('可量測優先：verify exit 0 → achieved，score=通過項數', async () => {
    const s = await evaluate({ llm, runVerify: () => ({ exitCode: 0, passed: 42 }) }, withVerify, '/tmp')
    expect(s.achieved).toBe(true)
    expect(s.score).toBe(42)
  })
  test('verify 非零 exit → 未達成，score 仍記通過項數（供進展比較）', async () => {
    const s = await evaluate({ llm, runVerify: () => ({ exitCode: 1, passed: 30 }) }, withVerify, '/tmp')
    expect(s.achieved).toBe(false)
    expect(s.score).toBe(30)
  })
  test('無 verifyCommand + agent 空回應（fail-open）→ 未達成 score 0', async () => {
    const s = await evaluate({ llm }, noVerify, '/tmp')
    expect(s.achieved).toBe(false)
    expect(s.score).toBe(0)
  })
  test('無 verifyCommand + agent 回 ACHIEVED → achieved', async () => {
    const fetchFn = (async () => ({ ok: true, status: 200,
      json: async () => ({ choices: [{ message: { content: 'ACHIEVED 已完成' } }] }) })) as unknown as typeof fetch
    const s = await evaluate({ llm: { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn } }, noVerify, '/tmp')
    expect(s.achieved).toBe(true)
  })
})
