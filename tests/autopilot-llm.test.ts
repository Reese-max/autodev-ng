import { describe, test, expect } from 'vitest'
import { callAgent } from '../src/autopilot/llm.js'

function fakeFetch(content: string, ok = true, status = 200): typeof fetch {
  return (async () => ({
    ok, status,
    json: async () => ({ choices: [{ message: { content } }] })
  })) as unknown as typeof fetch
}

function fakeFetchWithUsage(content: string, totalTokens?: number): typeof fetch {
  return (async () => ({
    ok: true, status: 200,
    json: async () => ({
      choices: [{ message: { content } }],
      ...(totalTokens === undefined ? {} : { usage: { total_tokens: totalTokens } })
    })
  })) as unknown as typeof fetch
}

describe('callAgent', () => {
  test('回傳 model 的 message content', async () => {
    const out = await callAgent(
      { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn: fakeFetch('hello') }, 'p')
    expect(out.text).toBe('hello')
  })
  test('無 url → 空字串（fail-open）', async () => {
    expect((await callAgent({ model: 'm', apiKey: 'k' }, 'p')).text).toBe('')
  })
  test('http 非 2xx → 空字串（fail-open）', async () => {
    const out = await callAgent(
      { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn: fakeFetch('', false, 500) }, 'p')
    expect(out.text).toBe('')
  })
  test('fetch 例外 → 空字串（fail-open）', async () => {
    const throwing = (async () => { throw new Error('net') }) as unknown as typeof fetch
    const out = await callAgent(
      { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn: throwing }, 'p')
    expect(out.text).toBe('')
  })
  test('callAgent 回傳 text 與 usage total_tokens', async () => {
    const r = await callAgent(
      { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn: fakeFetchWithUsage('hi', 123) }, 'q')
    expect(r.text).toBe('hi')
    expect(r.totalTokens).toBe(123)
  })
  test('無 usage 欄位時 totalTokens 為 0', async () => {
    const r = await callAgent(
      { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn: fakeFetchWithUsage('hi') }, 'q')
    expect(r.text).toBe('hi')
    expect(r.totalTokens).toBe(0)
  })
})
