import { describe, test, expect } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  RoutePolicySchema, breakerKey, callRoutedAgent, classifyHttpStatus, isFallbackAllowed,
  quarantineRouteCandidate, readBreaker, routeRetryAt, type RouteCandidate, type RoutePolicy,
} from '../src/engines/model-route-policy.js'

const dataDir = () => mkdtempSync(join(tmpdir(), 'adng-route-'))

function policy(overrides: Partial<RoutePolicy> = {}, candidates: Partial<RouteCandidate>[] = [{}]): RoutePolicy {
  return RoutePolicySchema.parse({
    enabled: true, routeId: 'unit', policyVersion: '1',
    candidates: candidates.map((c, i) => ({ id: `c${i}`, url: `http://u${i}/v1`, model: `m${i}`, apiKey: `k${i}`, credentialRef: `cr${i}`, ...c })),
    ...overrides,
  })
}

const okFetch = (model: string, content = 'ok', extra: Record<string, unknown> = {}) =>
  (async () => new Response(JSON.stringify({
    model, choices: [{ message: { content } }], usage: { total_tokens: 5, ...extra },
  }), { status: 200 })) as unknown as typeof fetch

const statusFetch = (status: number, headers: Record<string, string> = {}) =>
  (async () => new Response('{}', { status, headers })) as unknown as typeof fetch

describe('RoutePolicySchema bounds', () => {
  test('enabled defaults false; maxAttempts defaults to 3', () => {
    const p = RoutePolicySchema.parse({ routeId: 'r', candidates: [{ id: 'a', url: 'http://x', model: 'm' }] })
    expect(p.enabled).toBe(false)
    expect(p.maxAttempts).toBe(3)
    expect(p.cooldownMs).toBe(60_000)
  })
  test('rejects maxAttempts > 3 and empty routeId', () => {
    expect(() => RoutePolicySchema.parse({ routeId: 'r', maxAttempts: 4, candidates: [{ id: 'a', url: 'u', model: 'm' }] })).toThrow()
    expect(() => RoutePolicySchema.parse({ routeId: '', candidates: [{ id: 'a', url: 'u', model: 'm' }] })).toThrow()
  })
})

describe('failure classification', () => {
  test('transient set is exactly 408/429/500/502/503/504', () => {
    for (const s of [408, 429, 500, 502, 503, 504]) expect(classifyHttpStatus(s)).toBe('transient-http')
    for (const s of [501, 505, 400, 404, 422]) expect(classifyHttpStatus(s)).toBe('invalid-request')
    for (const s of [401, 403]) expect(classifyHttpStatus(s)).toBe('auth')
  })
  test('only transient-http, transport and attempt-timeout may fall back', () => {
    for (const cls of ['transient-http', 'transport', 'attempt-timeout'] as const) expect(isFallbackAllowed(cls)).toBe(true)
    for (const cls of ['cancelled', 'deadline-exceeded', 'auth', 'invalid-request', 'invalid-response', 'credential-missing', 'identity-unknown', 'identity-violation', 'cost-unknown', 'cost-violation'] as const)
      expect(isFallbackAllowed(cls)).toBe(false)
  })
})

describe('routeRetryAt', () => {
  const headers = (h: Record<string, string>) => ({ get: (n: string) => h[n.toLowerCase()] ?? null })
  test('honors numeric Retry-After and HTTP dates', () => {
    const now = 1_000_000
    expect(routeRetryAt(headers({ 'retry-after': '30' }), now, 5_000)).toBe(now + 30_000)
    const date = new Date(now + 45_000).toUTCString()
    expect(routeRetryAt(headers({ 'retry-after': date }), now, 5_000)).toBe(now + 45_000)
  })
  test('missing, invalid or past values fall back to bounded cooldown', () => {
    const now = 1_000_000
    expect(routeRetryAt(headers({}), now, 5_000)).toBe(now + 5_000)
    expect(routeRetryAt(headers({ 'retry-after': 'garbage' }), now, 5_000)).toBe(now + 5_000)
    expect(routeRetryAt(headers({ 'retry-after': '0' }), now, 5_000)).toBe(now + 5_000)
  })
})

describe('breaker state', () => {
  test('key is stable, non-secret and distinct per endpoint/credential/model', () => {
    const base = { url: 'http://x/v1/', model: 'm', apiKey: 'k1', credentialRef: 'r1' }
    expect(breakerKey(base)).toBe(breakerKey({ ...base, url: 'HTTP://X/v1' }))
    expect(breakerKey(base)).not.toBe(breakerKey({ ...base, model: 'm2' }))
    expect(breakerKey(base)).not.toBe(breakerKey({ ...base, credentialRef: 'r2' }))
    // credentialRef dominates; without it the apiKey fingerprint distinguishes credentials.
    expect(breakerKey(base)).toBe(breakerKey({ ...base, apiKey: 'k2' }))
    const anon = { url: 'http://x/v1', model: 'm' }
    expect(breakerKey({ ...anon, apiKey: 'k1' })).not.toBe(breakerKey({ ...anon, apiKey: 'k2' }))
    expect(breakerKey({ ...anon, apiKey: 'k1' })).not.toBe(breakerKey(anon))
    expect(breakerKey(base)).not.toContain('k1')
  })
  test('readBreaker maps absent/corrupt/quarantined files', () => {
    const dir = dataDir()
    try {
      expect(readBreaker(dir, 'k')).toEqual({ kind: 'closed' })
      mkdirSync(join(dir, 'route-breakers'), { recursive: true })
      writeFileSync(join(dir, 'route-breakers', 'k.json'), 'not json')
      expect(readBreaker(dir, 'k').kind).toBe('invalid')
      quarantineRouteCandidate(dir, 'q', 'identity-violation:x')
      expect(readBreaker(dir, 'q')).toEqual({ kind: 'quarantined', reason: 'identity-violation:x' })
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
})

describe('callRoutedAgent', () => {
  test('falls back only on transient classes and records receipts', async () => {
    const dir = dataDir()
    const seen: string[] = []
    const fetchFn = (async (url: unknown) => {
      seen.push(String(url))
      return String(url).includes('u0') ? new Response('{}', { status: 429, headers: { 'retry-after': '30' } })
        : new Response(JSON.stringify({ model: 'm1', choices: [{ message: { content: 'done' } }], usage: { total_tokens: 3 } }), { status: 200 })
    }) as unknown as typeof fetch
    try {
      const out = await callRoutedAgent({ route: policy({}, [{}, {}]), dataDir: dir, model: 'alias', fetchFn, callId: 'c1' }, 'p')
      expect(out).toMatchObject({ text: 'done', totalTokens: 3, actualModel: 'm1' })
      expect(seen).toEqual(['http://u0/v1/chat/completions', 'http://u1/v1/chat/completions'])
      const lines = readFileSync(join(dir, 'route-calls.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l))
      expect(lines.some((l: { phase?: string; failureClass?: string }) => l.phase === 'attempt-failed' && l.failureClass === 'transient-http')).toBe(true)
      expect(lines.some((l: { phase?: string }) => l.phase === 'completed')).toBe(true)
      // Second logical call: u0 is cooling (Retry-After 30s) and must be skipped.
      const again = await callRoutedAgent({ route: policy({}, [{}, {}]), dataDir: dir, model: 'alias', fetchFn }, 'p')
      expect(again.text).toBe('done')
      expect(seen.filter(u => u.includes('u0')).length).toBe(1)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })

  test('auth and invalid-request classes abort without fallback', async () => {
    const dir = dataDir()
    let calls = 0
    const fetchFn = (async () => { calls++; return new Response('{}', { status: 401 }) }) as unknown as typeof fetch
    try {
      const out = await callRoutedAgent({ route: policy({}, [{}, {}]), dataDir: dir, model: 'a', fetchFn }, 'p')
      expect(out.error).toContain('401')
      expect(calls).toBe(1)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })

  test('unresolved credential reference blocks before dispatch', async () => {
    const dir = dataDir()
    let calls = 0
    const fetchFn = (async () => { calls++; return new Response('{}', { status: 500 }) }) as unknown as typeof fetch
    try {
      const out = await callRoutedAgent({ route: policy({}, [{ apiKey: '{env:MISSING_SECRET_X}' }]), dataDir: dir, model: 'a', fetchFn }, 'p')
      expect(out.error).toMatch(/credential/i)
      expect(calls).toBe(0)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })

  test('requireActualModel blocks alias-only and excluded identities quarantine', async () => {
    const dir = dataDir()
    try {
      const noModel = await callRoutedAgent({
        route: policy({}, [{ gateway: true }]), dataDir: dir, model: 'alias', requireActualModel: true,
        fetchFn: (async () => new Response(JSON.stringify({ choices: [{ message: { content: 'x' } }] }), { status: 200 })) as unknown as typeof fetch,
      }, 'p')
      expect(noModel.error).toMatch(/actual model unknown/i)
      const bad = await callRoutedAgent({
        route: policy({}, [{}]), dataDir: dir, model: 'alias', requireActualModel: true, excludedModels: ['writer-x'],
        fetchFn: okFetch('writer-x'),
      }, 'p')
      expect(bad.error).toMatch(/excluded/i)
      expect(readBreaker(dir, breakerKey({ url: 'http://u0/v1', model: 'm0', apiKey: 'k0', credentialRef: 'cr0' })).kind).toBe('quarantined')
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })

  test('cost hard cap: unknown cost blocks, over-cap quarantines', async () => {
    const dir = dataDir()
    try {
      const unknown = await callRoutedAgent({
        route: policy({ maxCostUsd: 1 }, [{}]), dataDir: dir, model: 'a', fetchFn: okFetch('m0'),
      }, 'p')
      expect(unknown.error).toMatch(/cost unknown/i)
      const over = await callRoutedAgent({
        route: policy({ maxCostUsd: 0.01 }, [{ id: 'c9', url: 'http://u9/v1', model: 'm9', apiKey: 'k9', credentialRef: 'cr9' }]),
        dataDir: dir, model: 'a', fetchFn: okFetch('m9', 'ok', { cost: 0.5 }),
      }, 'p')
      expect(over.error).toMatch(/exceeds policy cap/i)
      expect(readBreaker(dir, breakerKey({ url: 'http://u9/v1', model: 'm9', apiKey: 'k9', credentialRef: 'cr9' })).kind).toBe('quarantined')
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })

  test('caller abort dispatches nothing; deadline stops before next request', async () => {
    const dir = dataDir()
    let calls = 0
    const fetchFn = (async () => { calls++; await new Promise(r => setTimeout(r, 60)); return new Response('{}', { status: 503 }) }) as unknown as typeof fetch
    try {
      const aborted = new AbortController(); aborted.abort()
      const out = await callRoutedAgent({ route: policy({}, [{}]), dataDir: dir, model: 'a', fetchFn, signal: aborted.signal }, 'p')
      expect(out.error).toMatch(/cancelled/i)
      expect(calls).toBe(0)
      const late = await callRoutedAgent({ route: policy({ totalDeadlineMs: 20 }, [{}, {}]), dataDir: dir, model: 'a', fetchFn }, 'p')
      expect(late.error).toMatch(/deadline/i)
      expect(calls).toBe(1)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })

  test('single probe lease: only one caller probes an expired cooldown', async () => {
    const dir = dataDir()
    let probeCalls = 0
    const slowOk = (async (url: unknown) => {
      if (!String(url).includes('u0')) return new Response(JSON.stringify({ model: 'm1', choices: [{ message: { content: 'b' } }] }), { status: 200 })
      probeCalls++
      await new Promise(r => setTimeout(r, 150))
      return new Response(JSON.stringify({ model: 'm0', choices: [{ message: { content: 'a' } }] }), { status: 200 })
    }) as unknown as typeof fetch
    try {
      const route = policy({ cooldownMs: 60 }, [{}, {}])
      const first = await callRoutedAgent({ route, dataDir: dir, model: 'a', fetchFn: statusFetch(429) }, 'p')
      expect(first.error).toBeTruthy()
      await new Promise(r => setTimeout(r, 90))
      const [r1, r2] = await Promise.all([
        callRoutedAgent({ route, dataDir: dir, model: 'a', fetchFn: slowOk }, 'p'),
        callRoutedAgent({ route, dataDir: dir, model: 'a', fetchFn: slowOk }, 'p'),
      ])
      expect(probeCalls).toBe(1)
      expect([r1.text, r2.text].sort()).toEqual(['a', 'b'])
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })

  test('route requires dataDir for durable breaker state', async () => {
    const out = await callRoutedAgent({ route: policy({}, [{}]), model: 'a', fetchFn: okFetch('m0') }, 'p')
    expect(out.error).toMatch(/dataDir/i)
    expect(existsSync('route-breakers')).toBe(false)
  })
})
