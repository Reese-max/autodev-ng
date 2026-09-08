import { describe, test, expect, vi } from 'vitest'
import { parseAudit, verifyAndSupplement } from '../src/autopilot/supplement.js'
import type { Goal } from '../src/autopilot/goal.js'

const goalWithEvidence: Goal = { objective: 'o', noProgressLimit: 3, evidenceFiles: ['a.py'] }

// auditLlm：依呼叫次數依序回 responses（最後一個之後固定回最後一個）
const auditLlm = (responses: string[]) => {
  let i = 0
  return { url: 'http://x/v1', model: 'audit', apiKey: 'k',
    fetchFn: (async () => ({ ok: true, status: 200,
      json: async () => ({ choices: [{ message: { content: responses[Math.min(i++, responses.length - 1)] } }] }) })) as unknown as typeof fetch }
}
const base = { appendTask: () => {}, isAlive: () => true, readEvidence: () => 'x' }

describe('parseAudit', () => {
  test('CLEAN → clean 無任務', () => {
    const r = parseAudit('CLEAN')
    expect(r.clean).toBe(true); expect(r.gapTasks).toEqual([])
  })
  test('GAPS + 任務（含 - 前綴）→ 不 clean', () => {
    const r = parseAudit('GAPS\n補 A\n- 補 B')
    expect(r.clean).toBe(false); expect(r.gapTasks).toEqual(['補 A', '補 B'])
  })
  test('GAPS 但無任務 → 未通過', () => { expect(parseAudit('GAPS\n\n').clean).toBe(false) })
  test('亂格式（無標記）→ 未通過', () => { expect(parseAudit('我覺得還行').clean).toBe(false) })
  test('空回應 → 未通過', () => { expect(parseAudit('').clean).toBe(false) })
  test('GAPS: 冒號變體 → 仍解析', () => {
    const r = parseAudit('GAPS：\n補 A')
    expect(r.clean).toBe(false); expect(r.gapTasks).toEqual(['補 A'])
  })
  test('非契約回應不通過也不派工', () => {
    expect(parseAudit('GAPS 是我回報缺口的方式，這裡沒有\nCLEAN').clean).toBe(false)
    expect(parseAudit('分析後我認為\nGAPS\n補 X').clean).toBe(false) // GAPS 不在首個非空行 → 保守 clean
  })
})

describe('verifyAndSupplement', () => {
  test('驗收失敗不能被 CLEAN 覆蓋，也不再呼叫模型', async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: 'CLEAN' } }] })))
    const runOnce = vi.fn()
    const result = await verifyAndSupplement({ ...base, auditLlm: { url: 'http://fixture.invalid', model: 'audit', apiKey: '', fetchFn },
      runVerify: () => ({ exitCode: 1, passed: 0 }), runOnceFn: runOnce, supplementLimit: 2 },
      { ...goalWithEvidence, verifyCommand: 'failing-check' }, '/proj')
    expect(result.clean).toBe(false)
    expect(fetchFn).not.toHaveBeenCalled()
    expect(runOnce).not.toHaveBeenCalled()
  })
  test('audit 首輪 clean → 不補足', async () => {
    const runOnce = vi.fn()
    const r = await verifyAndSupplement({ ...base, auditLlm: auditLlm(['CLEAN']), runOnceFn: runOnce, supplementLimit: 2 }, goalWithEvidence, '/proj')
    expect(r.clean).toBe(true); expect(r.supplemented).toBe(0); expect(runOnce).not.toHaveBeenCalled()
  })
  test('audit 缺口→補足→再 audit clean → 收斂', async () => {
    const tasks: string[] = []; const runOnce = vi.fn()
    const r = await verifyAndSupplement({ ...base, appendTask: (t) => tasks.push(t),
      auditLlm: auditLlm(['GAPS\n補 header 斷言\n補 retry 測試', 'CLEAN']), runOnceFn: runOnce, supplementLimit: 3 }, goalWithEvidence, '/proj')
    expect(r.clean).toBe(true); expect(tasks).toEqual(['補 header 斷言', '補 retry 測試']); expect(runOnce).toHaveBeenCalledTimes(2)
  })
  test('audit 一直有缺口 → 撞 supplementLimit 停，residualGaps 記錄', async () => {
    const r = await verifyAndSupplement({ ...base, auditLlm: auditLlm(['GAPS\n補 X']), runOnceFn: vi.fn(), supplementLimit: 2 }, goalWithEvidence, '/proj')
    expect(r.clean).toBe(false); expect(r.rounds).toBe(2); expect(r.residualGaps).toContain('補 X')
  })
  test('audit LLM 故障 → 未通過，不生任務', async () => {
    const runOnce = vi.fn()
    const throwLlm = { url: 'http://x/v1', model: 'a', apiKey: 'k', fetchFn: (async () => { throw new Error('boom') }) as unknown as typeof fetch }
    const r = await verifyAndSupplement({ ...base, auditLlm: throwLlm, runOnceFn: runOnce, supplementLimit: 2 }, goalWithEvidence, '/proj')
    expect(r.clean).toBe(false); expect(runOnce).not.toHaveBeenCalled()
  })
  test('kill switch：isAlive false → 立即中止 rounds 0', async () => {
    const runOnce = vi.fn()
    const r = await verifyAndSupplement({ ...base, isAlive: () => false, auditLlm: auditLlm(['GAPS\n補 X']), runOnceFn: runOnce, supplementLimit: 2 }, goalWithEvidence, '/proj')
    expect(r.rounds).toBe(0); expect(runOnce).not.toHaveBeenCalled()
  })
  test('機械接地：runVerify 輸出進 audit prompt', async () => {
    let captured = ''
    const g: Goal = { objective: 'o', noProgressLimit: 3, evidenceFiles: ['a.py'], verifyCommand: 'pytest' }
    const llm = { url: 'http://x/v1', model: 'a', apiKey: 'k',
      fetchFn: (async (_u: unknown, init: { body: string }) => { captured = init.body; return { ok: true, status: 200,
        json: async () => ({ choices: [{ message: { content: 'CLEAN' } }] }) } }) as unknown as typeof fetch }
    await verifyAndSupplement({ ...base, auditLlm: llm, runVerify: () => ({ exitCode: 0, passed: 3, output: 'FAILMARKER' }),
      runOnceFn: vi.fn(), supplementLimit: 1 }, g, '/proj')
    expect(captured).toContain('FAILMARKER')
  })
})
