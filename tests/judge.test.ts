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

test('diff 截 200 行', async () => {
  let sent = ''
  const spy = (async (_u: unknown, init?: RequestInit) => {
    sent = String(init?.body)
    return new Response(JSON.stringify({ choices: [{ message: { content: 'MATCH' } }] }), { status: 200 })
  }) as typeof fetch
  const bigDiff = Array.from({ length: 500 }, (_, i) => `line${i}`).join('\n')
  await judgeCommit({ ...base, fetchFn: spy }, 'c', bigDiff)
  expect(sent).toContain('line199')
  expect(sent).not.toContain('line300')
})
