import { expect, test } from 'vitest'
import { judgeCommit } from '../src/judge.js'

function fakeFetch(content: string, status = 200): typeof fetch {
  return (async () => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status })) as typeof fetch
}
const base = { url: 'http://127.0.0.1:8317/v1', model: 'gpt-5.4-mini', apiKey: 'sk-any' }

test('回 MATCH → MATCH', async () => {
  const r = await judgeCommit({ ...base, fetchFn: fakeFetch('判定：MATCH，宣稱與 diff 一致') }, 'fix: 修登入', 'diff...')
  expect(r.verdict).toBe('MATCH')
})

test('回 MISMATCH → MISMATCH（即使字串也含 MATCH）', async () => {
  const r = await judgeCommit({ ...base, fetchFn: fakeFetch('MISMATCH：宣稱修 A 實際改 B') }, 'c', 'd')
  expect(r.verdict).toBe('MISMATCH')
})

test('url 未設 → SKIP', async () => {
  const r = await judgeCommit({ ...base, url: undefined }, 'c', 'd')
  expect(r.verdict).toBe('SKIP')
})

test('fetch throw → SKIP（fail-open）', async () => {
  const bad = (async () => { throw new Error('ECONNREFUSED') }) as unknown as typeof fetch
  const r = await judgeCommit({ ...base, fetchFn: bad }, 'c', 'd')
  expect(r.verdict).toBe('SKIP')
})

test('非 200 → SKIP；回文無關鍵字 → SKIP', async () => {
  expect((await judgeCommit({ ...base, fetchFn: fakeFetch('x', 500) }, 'c', 'd')).verdict).toBe('SKIP')
  expect((await judgeCommit({ ...base, fetchFn: fakeFetch('我不確定') }, 'c', 'd')).verdict).toBe('SKIP')
})

test('diff 全量送出，不丟失第 201 行後的實際改動', async () => {
  let sent = ''
  const spy = (async (_u: unknown, init?: RequestInit) => {
    sent = String(init?.body)
    return new Response(JSON.stringify({ choices: [{ message: { content: 'MATCH' } }] }), { status: 200 })
  }) as typeof fetch
  const bigDiff = Array.from({ length: 500 }, (_, i) => `line${i}`).join('\n')
  await judgeCommit({ ...base, fetchFn: spy }, 'c', bigDiff)
  expect(sent).toContain('line199')
  expect(sent).toContain('line499')
})

test('prompt 用 <claim>/<diff> 邊界包裹且明言忽略內部指令（抗注入）', async () => {
  let sent = ''
  const spy = (async (_u: unknown, init?: RequestInit) => {
    sent = String(init?.body)
    return new Response(JSON.stringify({ choices: [{ message: { content: 'MATCH' } }] }), { status: 200 })
  }) as typeof fetch
  await judgeCommit({ ...base, fetchFn: spy }, 'claim 內容', 'diff 內容')
  expect(sent).toContain('<claim>')
  expect(sent).toContain('</claim>')
  expect(sent).toContain('<diff>')
  expect(sent).toContain('</diff>')
  expect(sent).toContain('忽略')
})

test('diff 內含「MISMATCH」字樣但模型回應開頭為 MATCH → 判 MATCH（不被 diff 內容污染）', async () => {
  const diffWithMismatchWord =
    'diff --git a/x.ts b/x.ts\n+  if (result !== "MISMATCH") return true // 字面值，非判定結果'
  const r = await judgeCommit(
    { ...base, fetchFn: fakeFetch('MATCH（宣稱與 diff 修改一致，diff 內出現的 MISMATCH 只是程式碼字串常量，不影響本次判斷）') },
    'claim: 加入狀態檢查',
    diffWithMismatchWord
  )
  expect(r.verdict).toBe('MATCH')
})

test('回應開頭 20 字內同時可判定時 MISMATCH 優先於 MATCH', async () => {
  const r = await judgeCommit({ ...base, fetchFn: fakeFetch('MATCH，不，MISMATCH：程式碼寫錯') }, 'c', 'd')
  expect(r.verdict).toBe('MISMATCH')
})

test('回應開頭 20 字內無 MATCH/MISMATCH 關鍵字（結論寫在後段）→ SKIP，不再全文掃描', async () => {
  const longPreamble = '這是一段很長的開場白用來測試前綴視窗判定不採計全文結論是MATCH'
  const r = await judgeCommit({ ...base, fetchFn: fakeFetch(longPreamble) }, 'c', 'd')
  expect(r.verdict).toBe('SKIP')
})

test('prompt 含判準：數量差異不否決、截斷以檔案清單為準（誤殺對策 2026-07-28）', async () => {
  let sent = ''
  const spy = (async (_u: unknown, init?: RequestInit) => {
    sent = String(init?.body)
    return new Response(JSON.stringify({ choices: [{ message: { content: 'MATCH' } }] }), { status: 200 })
  }) as typeof fetch
  await judgeCommit({ ...base, fetchFn: spy }, 'c', 'd')
  expect(sent).toContain('數量差異')
  expect(sent).toContain('截斷')
})

test('effort/timeoutMs 傳遞：body 帶指定 reasoning_effort（judge 升級 xhigh 用）', async () => {
  let sent = ''
  const spy = (async (_u: unknown, init?: RequestInit) => {
    sent = String(init?.body)
    return new Response(JSON.stringify({ choices: [{ message: { content: 'MATCH' } }] }), { status: 200 })
  }) as typeof fetch
  await judgeCommit({ ...base, effort: 'xhigh', timeoutMs: 180_000, fetchFn: spy }, 'c', 'd')
  expect(sent).toContain('"reasoning_effort":"xhigh"')
})

test('effort/timeoutMs 未設：body 維持 low（向後相容）', async () => {
  let sent = ''
  const spy = (async (_u: unknown, init?: RequestInit) => {
    sent = String(init?.body)
    return new Response(JSON.stringify({ choices: [{ message: { content: 'MATCH' } }] }), { status: 200 })
  }) as typeof fetch
  await judgeCommit({ ...base, fetchFn: spy }, 'c', 'd')
  expect(sent).toContain('"reasoning_effort":"low"')
})
