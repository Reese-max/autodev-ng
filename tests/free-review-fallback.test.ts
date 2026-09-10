import { mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { z } from 'zod'
import { callFreeModel, FREE_MODEL_CATALOG, FREE_MODEL_URL } from '../src/engines/free-model-policy.js'
import { reviewDiff, runReviewGate } from '../src/engines/review-gate.js'
import { codexJson } from '../src/engines/cli-json.js'
import { ConfigSchema } from '../src/types.js'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
const primary = 'test/primary:free', backup = 'test/backup:free', last = 'test/last:free'
function fixture() {
  const opts = { tierMode: 'free-only' as const, url: FREE_MODEL_URL, model: primary, fallbackModels: [backup, last],
    excludedModels: ['test/writer:free'], apiKey: 'test-credential', dataDir: mkdtempSync(join(tmpdir(), 'adng-review-pool-')), effort: 'low', timeoutMs: 1000 }
  const posts: string[] = []
  let pricing: unknown = { prompt: '0', completion: '0' }
  const response = (model: string, text = 'REVIEW: PASS') => new Response(JSON.stringify({ model, choices: [{ message: { content: text } }], usage: { cost: 0 } }))
  const request = vi.fn(async (model: string): Promise<Response> => response(model))
  const fetchFn = vi.fn(async (url, init) => {
    if (url === FREE_MODEL_CATALOG) return new Response(JSON.stringify({ data: [primary, backup, last].map(id => ({ id, pricing })) }))
    expect(url).toBe(`${FREE_MODEL_URL}/chat/completions`)
    expect(init?.redirect).toBe('error')
    expect(init?.headers).toMatchObject({ authorization: 'Bearer test-credential' })
    const body = JSON.parse(String(init?.body)); expect(body).not.toHaveProperty('tools')
    expect(body.provider).toEqual({ allow_fallbacks: false, max_price: { prompt: 0, completion: 0 } })
    posts.push(body.model)
    return request(body.model)
  }) as typeof fetch
  return { opts: { ...opts, fetchFn }, posts, request, response, setPricing: (value: unknown) => { pricing = value } }
}

test.each([429, 408, 503, 'timeout'])('transient %s selects one free backup and reports its actual identity', async failure => {
  const f = fixture()
  f.request.mockImplementationOnce(async () => {
    if (failure === 'timeout') throw Object.assign(new Error('private response body'), { name: 'TimeoutError' })
    return new Response('', { status: Number(failure), headers: { 'retry-after': '60' } })
  })
  const verdict = await runReviewGate(args => reviewDiff({ ...f.opts, onModel: args.onModel }, args.diff, args.taskText), { diff: 'diff', taskText: 'task' })
  expect(verdict).toMatchObject({ kind: 'pass', actualModel: backup }); expect(f.posts).toEqual([primary, backup])
  expect(readFileSync(join(f.opts.dataDir, 'free-model-calls.jsonl'), 'utf8')).not.toContain('private response body')
})

test.each(['REVIEW: REJECT broken implementation', '...'])('a returned verdict or malformed answer never shops for approval: %s', async answer => {
  const f = fixture(); f.request.mockImplementationOnce(async model => f.response(model, answer))
  const result = await runReviewGate(args => reviewDiff(f.opts, args.diff, args.taskText), { diff: 'diff', taskText: 'task' })
  expect(result.kind).toBe(answer.startsWith('REVIEW') ? 'reject' : 'skip'); expect(f.posts).toEqual([primary])
})

test.each([401, 402, 403, 400])('HTTP %s is terminal and does not try backups', async status => {
  const f = fixture(); f.request.mockResolvedValueOnce(new Response('', { status }))
  await expect(callFreeModel(f.opts, 'Review')).rejects.toMatchObject({ fallbackAllowed: false })
  expect(f.posts).toEqual([primary])
})

test.each(['price', 'identity', 'cost', 'json'])('a %s failure blocks instead of falling back', async kind => {
  const f = fixture()
  if (kind === 'price') f.setPricing({ prompt: '0.01', completion: '0' })
  if (kind === 'identity') f.request.mockResolvedValueOnce(f.response('paid/other'))
  if (kind === 'cost') f.request.mockResolvedValueOnce(new Response(JSON.stringify({ model: primary, usage: { cost: 0.01 } })))
  if (kind === 'json') f.request.mockResolvedValueOnce(new Response('invalid JSON'))
  await expect(callFreeModel(f.opts, 'Review')).rejects.toMatchObject({ fallbackAllowed: false })
  expect(f.posts).toEqual(kind === 'price' ? [] : [primary])
})

test('all reviewers wait with the earliest reset; a new invocation does not repeat network/model calls during cooldown', async () => {
  const f = fixture(), now = Date.now(); vi.spyOn(Date, 'now').mockReturnValue(now)
  f.request.mockImplementation(async model => new Response('', { status: 429, headers: { 'retry-after': model === backup ? '15' : '60' } }))
  await expect(callFreeModel(f.opts, 'Review')).rejects.toMatchObject({ retryAt: now + 15_000, fallbackAllowed: true })
  expect(f.posts).toEqual([primary, backup, last]); const networkCalls = vi.mocked(f.opts.fetchFn).mock.calls.length
  await expect(callFreeModel({ ...f.opts }, 'Same review after reopen')).rejects.toMatchObject({ retryAt: now + 15_000 })
  expect(f.opts.fetchFn).toHaveBeenCalledTimes(networkCalls)
  expect(readdirSync(f.opts.dataDir).filter(file => file.startsWith('free-model-wait-'))).toHaveLength(3)
})

test.each([['test/writer:free'], ['minimax/minimax-m3:free'], ['paid/model'], [backup, last, 'test/fourth:free']])('invalid fallback list sends no requests: %j', async (...models) => {
  const f = fixture()
  await expect(callFreeModel({ ...f.opts, fallbackModels: models }, 'Review')).rejects.toThrow('free-policy')
  expect(f.opts.fetchFn).not.toHaveBeenCalled()
})

test('structured review rejection and JSON schema failure also stop at the first available reviewer', async () => {
  for (const text of ['{"approved":false}', '{"wrong":true}']) {
    const f = fixture(); f.request.mockImplementationOnce(async model => f.response(model, text))
    const result = codexJson(f.opts, z.object({ approved: z.boolean() }).strict(), 'Review')
    if (text.includes('approved')) expect(await result).toEqual({ approved: false })
    else await expect(result).rejects.toThrow()
    expect(f.posts).toEqual([primary])
  }
  expect(ConfigSchema.safeParse({ projectPath: '.', freeReviewFallbacks: ['minimax/minimax-m3:free'] }).success).toBe(false)
})
