import { describe, test, expect } from 'vitest'
import { parseCandidates, parseRanked, discoverProblems } from '../src/autopilot/discover.js'
import type { Goal } from '../src/autopilot/goal.js'

describe('parseCandidates', () => {
  test('多行候選（全形｜分隔）', () => {
    const r = parseCandidates('tests', 'lib/api.py 無 call_args 斷言｜只驗呼叫不驗參數\nlib/io.py 缺錯誤路徑測試｜read_jsonl 檔案不存在分支未測')
    expect(r).toEqual([
      { lens: 'tests', title: 'lib/api.py 無 call_args 斷言', detail: '只驗呼叫不驗參數' },
      { lens: 'tests', title: 'lib/io.py 缺錯誤路徑測試', detail: 'read_jsonl 檔案不存在分支未測' }
    ])
  })
  test('半形 | 分隔也可', () => {
    expect(parseCandidates('perf', 'X 全掃無快取|每次 O(n)')[0]).toEqual({ lens: 'perf', title: 'X 全掃無快取', detail: '每次 O(n)' })
  })
  test('NONE → 空陣列', () => { expect(parseCandidates('security', 'NONE')).toEqual([]) })
  test('無分隔符行 → 整行為 title', () => { expect(parseCandidates('design', '模組職責糾纏')).toEqual([{ lens: 'design', title: '模組職責糾纏', detail: '' }]) })
  test('每鏡頭最多取 5 條（6 行輸入 → 5 條）', () => {
    const input = ['A｜a', 'B｜b', 'C｜c', 'D｜d', 'E｜e', 'F｜f'].join('\n')
    const r = parseCandidates('tests', input)
    expect(r).toHaveLength(5)
    expect(r.map(c => c.title)).toEqual(['A', 'B', 'C', 'D', 'E'])
  })
})

describe('parseRanked', () => {
  test('正常排序行', () => {
    const r = parseRanked('VALUE:9 | api.py 斷言弱 | tests | 高頻對外呼叫沒驗參數\nVALUE:4 | 命名不一致 | design | 影響小')
    expect(r).toEqual([
      { value: 9, title: 'api.py 斷言弱', lens: 'tests', rationale: '高頻對外呼叫沒驗參數' },
      { value: 4, title: '命名不一致', lens: 'design', rationale: '影響小' }
    ])
  })
  test('value 超界夾 0~10', () => { expect(parseRanked('VALUE:15 | X | perf | y')[0]!.value).toBe(10) })
  test('不符格式行跳過、全空 → 空陣列', () => {
    expect(parseRanked('我覺得都還好\n沒有明確問題')).toEqual([])
  })
})

const goal: Goal = { objective: '持續改善品質', noProgressLimit: 3, evidenceFiles: ['a.py'] }
// 依「呼叫序」回應：前 N 次是 finder（每鏡頭一次），最後一次是 critic
const seqLlm = (responses: string[]) => {
  let i = 0
  return { url: 'http://x/v1', model: 'm', apiKey: 'k',
    fetchFn: (async () => ({ ok: true, status: 200,
      json: async () => ({ choices: [{ message: { content: responses[Math.min(i++, responses.length - 1)] } }] }) })) as unknown as typeof fetch }
}

describe('discoverProblems', () => {
  test('survey→finder→critic 串接，回排序問題', async () => {
    const finder = seqLlm(['問題A｜理由a', 'NONE', 'NONE', 'NONE', 'NONE'])
    const critic = seqLlm(['VALUE:8 | 問題A | correctness | 高價值'])
    const r = await discoverProblems({ finderLlm: finder, criticLlm: critic,
      runSurvey: () => ({ output: 'coverage 40%' }), readEvidence: () => 'code', lenses: ['correctness', 'tests', 'perf', 'design', 'security'] }, goal, '/proj')
    expect(r.survey).toContain('coverage 40%')
    expect(r.ranked).toEqual([{ value: 8, title: '問題A', lens: 'correctness', rationale: '高價值' }])
  })
  test('critic 亂格式且候選非空 → fail-open 退回原始候選（value 5），不崩、不白費', async () => {
    const finder = seqLlm(['問題X｜y'])
    const critic = seqLlm(['我覺得都還好'])
    const r = await discoverProblems({ finderLlm: finder, criticLlm: critic,
      runSurvey: () => ({ output: 's' }), readEvidence: () => 'c', lenses: ['correctness'] }, goal, '/proj')
    expect(r.ranked).toEqual([{ title: '問題X', lens: 'correctness', value: 5, rationale: 'critic 未評，原始候選' }])
  })
  test('survey runSurvey throw → survey 空，仍能跑 finder/critic（fail-open）', async () => {
    const r = await discoverProblems({ finderLlm: seqLlm(['NONE']), criticLlm: seqLlm(['']),
      runSurvey: () => { throw new Error('survey boom') }, readEvidence: () => 'c', lenses: ['correctness'] }, goal, '/proj')
    expect(r.survey).toBe(''); expect(r.ranked).toEqual([])
  })
  test('finder throw 該鏡頭跳過，其餘鏡頭仍出候選', async () => {
    let n = 0
    const finder = { url: 'http://x/v1', model: 'm', apiKey: 'k',
      fetchFn: (async () => { n++; if (n === 1) throw new Error('finder boom'); return { ok: true, status: 200,
        json: async () => ({ choices: [{ message: { content: '問題B｜b' } }] }) } }) as unknown as typeof fetch }
    const critic = seqLlm(['VALUE:5 | 問題B | tests | ok'])
    const r = await discoverProblems({ finderLlm: finder, criticLlm: critic,
      runSurvey: () => ({ output: 's' }), readEvidence: () => 'c', lenses: ['correctness', 'tests'] }, goal, '/proj')
    expect(r.ranked[0]!.title).toBe('問題B')
  })
})
