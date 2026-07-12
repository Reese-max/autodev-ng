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

  // informed judge（品質類目標）：讀佐證檔內容餵 judge，回 0~10 分 + 達成與否
  const evGoal: Goal = { objective: 'o', noProgressLimit: 3, evidenceFiles: ['tests/a.py', 'lib/b.py'] }
  const judge = (content: string) => ({ url: 'http://x/v1', model: 'm', apiKey: 'k',
    fetchFn: (async () => ({ ok: true, status: 200,
      json: async () => ({ choices: [{ message: { content } }] }) })) as unknown as typeof fetch })

  test('informed：佐證檔讀入 + judge 回 SCORE 7 NOT-YET → score 7 未達成', async () => {
    const seen: string[] = []
    const s = await evaluate({ llm: judge('SCORE: 7\nNOT-YET\n缺口：header 沒驗'),
      readEvidence: (p) => { seen.push(p); return 'def f(): pass' } }, evGoal, '/proj')
    expect(s.score).toBe(7)
    expect(s.achieved).toBe(false)
    expect(seen.length).toBe(2) // 兩個佐證檔都讀了
  })
  test('informed：judge 回 SCORE 9 ACHIEVED → achieved', async () => {
    const s = await evaluate({ llm: judge('SCORE: 9\nACHIEVED\n斷言已完整'),
      readEvidence: () => 'x' }, evGoal, '/proj')
    expect(s.achieved).toBe(true)
    expect(s.score).toBe(9)
  })
  test('informed：ACHIEVED 與 NOT-YET 同時出現時保守判未達成', async () => {
    const s = await evaluate({ llm: judge('SCORE: 5\nNOT-YET\nheader 尚未 achieved'),
      readEvidence: () => 'x' }, evGoal, '/proj')
    expect(s.achieved).toBe(false)
  })
  test('informed：讀不到的佐證檔跳過（fail-open），仍能判定', async () => {
    const s = await evaluate({ llm: judge('SCORE: 4\nNOT-YET\n缺'),
      readEvidence: (p) => { if (p.includes('a.py')) throw new Error('ENOENT'); return 'ok' } }, evGoal, '/proj')
    expect(s.score).toBe(4) // 一個檔讀失敗不擋判定
  })
  test('informed：回應無 SCORE（亂格式）→ fail-open score 0', async () => {
    const s = await evaluate({ llm: judge('我覺得還不錯'), readEvidence: () => 'x' }, evGoal, '/proj')
    expect(s.score).toBe(0)
    expect(s.achieved).toBe(false)
  })
  test('informed：SCORE 超界（15）夾到 10', async () => {
    const s = await evaluate({ llm: judge('SCORE: 15\nACHIEVED\nok'), readEvidence: () => 'x' }, evGoal, '/proj')
    expect(s.score).toBe(10)
  })
  test('informed：judge 回 NOT ACHIEVED（空格無連字）→ 保守判未達成', async () => {
    const s = await evaluate({ llm: judge('SCORE: 3\nNOT ACHIEVED\nheader 沒驗'), readEvidence: () => 'x' }, evGoal, '/proj')
    expect(s.achieved).toBe(false)
  })
  test('informed：路徑逃出 cwd（../）被擋、不讀取（防穿越外洩）', async () => {
    const seen: string[] = []
    const g: Goal = { objective: 'o', noProgressLimit: 3, evidenceFiles: ['../../secret.env', 'lib/ok.py'] }
    await evaluate({ llm: judge('SCORE: 3\nNOT-YET\n缺'),
      readEvidence: (p) => { seen.push(p); return 'X' } }, g, '/proj')
    expect(seen.some(p => p.includes('secret'))).toBe(false) // 越界檔沒被讀
    expect(seen.some(p => p.includes('ok.py'))).toBe(true)   // 合法檔有讀
  })
  test('informed：超長佐證檔（>8000 字元）被截斷', async () => {
    let captured = ''
    const big = 'a'.repeat(9000)
    const g: Goal = { objective: 'o', noProgressLimit: 3, evidenceFiles: ['lib/big.py'] }
    const fetchFn = (async (_u: unknown, init: { body: string }) => { captured = init.body; return { ok: true, status: 200,
      json: async () => ({ choices: [{ message: { content: 'SCORE: 5\nNOT-YET\nx' } }] }) } }) as unknown as typeof fetch
    await evaluate({ llm: { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn }, readEvidence: () => big }, g, '/proj')
    expect(captured).toContain('…（截斷）') // prompt 內含截斷標註
    expect(captured).not.toContain('a'.repeat(8500)) // 未整段塞入
  })
  // 向後相容：無 evidenceFiles 的舊 goal 仍走舊路徑，score = achieved?1:0（非新 SCORE 解析）
  test('向後相容：無佐證檔 + agent 回 ACHIEVED（無 SCORE）→ score 1（舊語意）', async () => {
    const s = await evaluate({ llm: judge('ACHIEVED 已完成') }, noVerify, '/tmp')
    expect(s.achieved).toBe(true)
    expect(s.score).toBe(1)
  })
})
