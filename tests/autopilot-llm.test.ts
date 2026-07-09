import { describe, test, expect } from 'vitest'
import { callAgent } from '../src/autopilot/llm.js'

function fakeFetch(content: string, ok = true, status = 200): typeof fetch {
  return (async () => ({
    ok, status,
    json: async () => ({ choices: [{ message: { content } }] })
  })) as unknown as typeof fetch
}

describe('callAgent', () => {
  test('回傳 model 的 message content', async () => {
    const out = await callAgent(
      { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn: fakeFetch('hello') }, 'p')
    expect(out).toBe('hello')
  })
  test('無 url → 空字串（fail-open）', async () => {
    expect(await callAgent({ model: 'm', apiKey: 'k' }, 'p')).toBe('')
  })
  test('http 非 2xx → 空字串（fail-open）', async () => {
    const out = await callAgent(
      { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn: fakeFetch('', false, 500) }, 'p')
    expect(out).toBe('')
  })
  test('fetch 例外 → 空字串（fail-open）', async () => {
    const throwing = (async () => { throw new Error('net') }) as unknown as typeof fetch
    const out = await callAgent(
      { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn: throwing }, 'p')
    expect(out).toBe('')
  })
})
