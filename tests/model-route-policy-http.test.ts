import { afterAll, expect, test } from 'vitest'
import { execFile, spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import http from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { callAgent, type LlmOpts } from '../src/autopilot/llm.js'
import { parseReviewVerdict } from '../src/engines/review-gate.js'
import { breakerKey, readBreaker, RoutePolicySchema, type RouteCandidate, type RoutePolicy } from '../src/engines/model-route-policy.js'

// The restart lane executes this checkout's compiled production modules. Build first;
// a missing runtime is a failing prerequisite rather than a skipped acceptance check.
const runtimeModuleUrl = (path: string): string => new URL(`../dist/${path}`, import.meta.url).href

// Issue #51 的驗收需要真實的 loopback HTTP 行為：URL 組裝、認證標頭、redirect 拒絕、
// 逾時與跨行程重啟後仍有效的冷卻。tests/regressions/github-51.test.cjs 覆蓋同一組情境，
// 但只在 windows-latest 的 CI 步驟執行；這支檔案讓預設 suite（任何平台）也跑同一組驗收。

interface Hit { url: string; auth?: string; body: string }
interface Endpoint { hits: Hit[]; url: string }

const servers: http.Server[] = []
const dirs: string[] = []

const okBody = (model: string, content: string, usage: Record<string, unknown> = {}): string =>
  JSON.stringify({ model, choices: [{ message: { content } }], usage: { total_tokens: 7, ...usage } })
const send = (res: http.ServerResponse, status: number, body: string, headers: Record<string, string> = {}): void => {
  res.writeHead(status, { 'content-type': 'application/json', ...headers })
  res.end(body)
}
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

async function makeEndpoint(handler: (req: http.IncomingMessage, res: http.ServerResponse) => void | Promise<void>): Promise<Endpoint> {
  const hits: Hit[] = []
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = []
    req.on('data', chunk => chunks.push(chunk as Buffer))
    req.on('end', () => {
      hits.push({ url: req.url ?? '', auth: req.headers.authorization, body: Buffer.concat(chunks).toString('utf8') })
      Promise.resolve(handler(req, res)).catch(() => { if (!res.writableEnded) send(res, 500, '{}') })
    })
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve())
  })
  servers.push(server)
  return { hits, url: `http://127.0.0.1:${(server.address() as { port: number }).port}/v1` }
}

const tmpDataDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-route-http-'))
  dirs.push(dir)
  return dir
}

const receipts = (dataDir: string): Record<string, unknown>[] =>
  readFileSync(join(dataDir, 'route-calls.jsonl'), 'utf8').trim().split('\n')
    .map(line => JSON.parse(line) as Record<string, unknown>)

const candidates = (endpoints: Endpoint[], ids: string[]): RouteCandidate[] =>
  endpoints.map((endpoint, index) => ({
    id: ids[index] ?? `c${index}`, url: endpoint.url, model: `m-${ids[index] ?? index}`,
    apiKey: `k-secret-${ids[index] ?? index}`, credentialRef: `cred-${ids[index] ?? index}`,
  }))

/** 走正式 schema：預設值（maxAttempts 3、cooldownMs、probeLeaseMs）與 config 解析時一致。 */
const route = (routeId: string, list: RouteCandidate[], extra: Record<string, unknown> = {}): RoutePolicy =>
  RoutePolicySchema.parse({ enabled: true, routeId, policyVersion: '1', candidates: list, ...extra })

/** 某個候選目前的熔斷狀態；CLOSED 不寫檔，回 undefined。 */
function breakerState(dataDir: string, endpoint: Endpoint, id: string): string | undefined {
  const kind = readBreaker(dataDir, breakerKey({ url: endpoint.url, model: `m-${id}`, apiKey: `k-secret-${id}`, credentialRef: `cred-${id}` })).kind
  return kind === 'closed' ? undefined : kind === 'open' ? 'OPEN' : kind.toUpperCase()
}

/** 等冷卻到期為止，依產品自己寫下的 retryAt 判定，不用固定 sleep——固定 sleep 在慢機器上會
 *  提前放行、在快機器上只是白等，兩種都會讓這條規格的行為隨機器速度漂移。
 *  候選沒在冷卻中就直接出錯，而不是當成「已經可以探測」——否則呼叫端會拿到一個空洞的通過。 */
async function waitForCooldown(dataDir: string, endpoint: Endpoint, id: string, ceilingMs = 30_000): Promise<void> {
  const key = breakerKey({ url: endpoint.url, model: `m-${id}`, apiKey: `k-secret-${id}`, credentialRef: `cred-${id}` })
  const deadline = Date.now() + ceilingMs
  for (;;) {
    const snapshot = readBreaker(dataDir, key)
    if (snapshot.kind === 'open' && snapshot.retryAt <= Date.now()) return
    if (snapshot.kind !== 'open') throw new Error(`expected ${id} to be in cooldown, saw ${snapshot.kind}`)
    if (Date.now() > deadline) throw new Error(`cooldown did not expire within ${ceilingMs}ms (retryAt=${snapshot.retryAt})`)
    await sleep(Math.min(20, Math.max(1, snapshot.retryAt - Date.now())))
  }
}

afterAll(async () => {
  for (const server of servers) { try { await new Promise<void>(resolve => { server.close(() => resolve()) }) } catch { /* best effort */ } }
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true, maxRetries: 5 })
})

test('429 with Retry-After falls back exactly once and attributes the actual model', async () => {
  const a = await makeEndpoint((_req, res) => send(res, 429, '{}', { 'retry-after': '120' }))
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('b-actual-model', 'B-OK')))
  const out = await callAgent({
    url: a.url, model: 'alias-primary', apiKey: 'k-single-path', dataDir: tmpDataDir(),
    route: route('http-fallback', candidates([a, b], ['a', 'b'])),
  }, 'prompt')
  expect(out.text).toBe('B-OK')
  expect(out.actualModel).toBe('b-actual-model')
  expect(out.error).toBeUndefined()
  expect(a.hits).toHaveLength(1)
  expect(b.hits).toHaveLength(1)
  const firstHit = a.hits[0]!, secondHit = b.hits[0]!
  expect(firstHit.auth).toBe('Bearer k-secret-a')
  expect(secondHit.auth).toBe('Bearer k-secret-b')
  expect(JSON.parse(secondHit.body).model).toBe('m-b')
  expect(secondHit.url).toBe('/v1/chat/completions')
})

test('a redirect never carries the credential to the redirect target', async () => {
  const leak = await makeEndpoint((_req, res) => send(res, 200, okBody('leaked', 'LEAKED')))
  const a = await makeEndpoint((_req, res) => { res.writeHead(302, { location: `${leak.url}/chat/completions` }); res.end() })
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('b-actual-model', 'B-OK')))
  const out = await callAgent({
    url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir: tmpDataDir(),
    route: route('http-redirect', candidates([a, b], ['a', 'b'])),
  }, 'prompt')
  expect(leak.hits).toHaveLength(0)
  expect(out.text).toBe('B-OK')
  expect(out.error).toBeUndefined()
})

test('an attempt timeout may fall back but keeps the timed-out attempt cost unknown', async () => {
  const hanging = await makeEndpoint(() => { /* never answers: the per-attempt timeout must fire */ })
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('b-actual-model', 'B-OK')))
  const dataDir = tmpDataDir()
  const out = await callAgent({
    url: hanging.url, model: 'alias', apiKey: 'k-single-path', dataDir,
    route: route('http-timeout', candidates([hanging, b], ['a', 'b']), { perAttemptTimeoutMs: 150 }),
  }, 'prompt')
  expect(out.text).toBe('B-OK')
  expect(hanging.hits).toHaveLength(1)
  expect(receipts(dataDir).find(line => line.candidateId === 'a' && line.phase === 'attempt-failed'))
    .toMatchObject({ failureClass: 'attempt-timeout', cost: 'unknown' })
})

test('maxAttempts caps the switch chain even when more candidates remain', async () => {
  const down = () => makeEndpoint((_req, res) => send(res, 503, '{}', { 'retry-after': '30' }))
  const [a, b, c, d] = [await down(), await down(), await down(), await down()]
  const out = await callAgent({
    url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir: tmpDataDir(),
    route: route('http-cap', candidates([a, b, c, d], ['a', 'b', 'c', 'd']), { maxAttempts: 2 }),
  }, 'prompt')
  expect(out.text).toBe('')
  expect(out.error).toMatch(/unavailable/)
  // 上限 2（含首次）：第三個候選完全不該被碰過——否則 maxAttempts 只是候選耗盡的同義詞。
  expect(a.hits).toHaveLength(1)
  expect(b.hits).toHaveLength(1)
  expect(c.hits).toHaveLength(0)
  expect(d.hits).toHaveLength(0)
})

test('all candidates unavailable reports the earliest retryAt across differing Retry-After values', async () => {
  const dataDir = tmpDataDir()
  const down = (retryAfter: string) => makeEndpoint((_req, res) => send(res, 503, '{}', { 'retry-after': retryAfter }))
  const [x, y, z] = [await down('300'), await down('45'), await down('120')]
  const out = await callAgent({
    url: x.url, model: 'alias', apiKey: 'k-single-path', dataDir,
    route: route('http-down', candidates([x, y, z], ['x', 'y', 'z']), { maxAttempts: 3 }),
  }, 'prompt')
  expect(out.text).toBe('')
  expect(out.error).toMatch(/unavailable/)
  expect(x.hits.length + y.hits.length + z.hits.length).toBe(3)
  // 三個冷卻各不相同；回報的必須是最早可重試的那個，不是最後一個也不是任一個。
  // 以 receipt 裡各 attempt 的 retryAt 取最小值比對，不綁牆上時鐘，慢機器上也不會假紅。
  const attemptRetryAts = receipts(dataDir)
    .filter(line => line.phase === 'attempt-failed')
    .map(line => Number(line.retryAt))
  expect(attemptRetryAts).toHaveLength(3)
  expect(new Set(attemptRetryAts).size).toBe(3)
  expect(out.retryAt).toBe(Math.min(...attemptRetryAts))
  expect(out.retryAt).toBeLessThan(Math.max(...attemptRetryAts))
  expect(receipts(dataDir).find(line => line.phase === 'blocked')).toMatchObject({ failureClass: 'unavailable', attempts: 3 })
})

test('an HTTP 200 with an unusable body is not treated as a completed call', async () => {
  const empty = await makeEndpoint((_req, res) => send(res, 200, JSON.stringify({ choices: [] })))
  const spare = await makeEndpoint((_req, res) => send(res, 200, okBody('b-actual-model', 'B-OK')))
  const dataDir = tmpDataDir()
  const out = await callAgent({
    url: empty.url, model: 'alias', apiKey: 'k-single-path', dataDir,
    route: route('http-bad-body', candidates([empty, spare], ['empty', 'spare'])),
  }, 'prompt')
  expect(out.text).toBe('')
  expect(out.error).toMatch(/empty model response/)
  expect(empty.hits).toHaveLength(1)
  expect(spare.hits).toHaveLength(0)
  expect(receipts(dataDir).map(line => [line.phase, line.failureClass])).toEqual([['blocked', 'invalid-response']])
  expect(receipts(dataDir).some(line => line.phase === 'completed')).toBe(false)
})

test('a permanent failure class never issues a fallback request', async () => {
  const a = await makeEndpoint((_req, res) => send(res, 401, '{}'))
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('b-actual-model', 'B-OK')))
  const out = await callAgent({
    url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir: tmpDataDir(),
    route: route('http-auth', candidates([a, b], ['a', 'b'])),
  }, 'prompt')
  expect(out.text).toBe('')
  expect(out.error).toMatch(/401/)
  expect(a.hits).toHaveLength(1)
  expect(b.hits).toHaveLength(0)
})

test('a cooldown survives a real process restart', async () => {
  expect(existsSync(new URL('../dist/autopilot/llm.js', import.meta.url))).toBe(true)
  const a = await makeEndpoint((_req, res) => send(res, 429, '{}', { 'retry-after': '120' }))
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('b-actual-model', 'B-OK')))
  const opts: LlmOpts = {
    url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir: tmpDataDir(),
    route: route('http-restart', candidates([a, b], ['a', 'b'])),
  }
  expect((await callAgent(opts, 'p')).text).toBe('B-OK')
  expect((await callAgent(opts, 'p')).text).toBe('B-OK')
  expect(a.hits).toHaveLength(1)

  const script = `import { callAgent } from ${JSON.stringify(runtimeModuleUrl('autopilot/llm.js'))}\n` +
    `const result = await callAgent(${JSON.stringify(opts)}, 'p')\nprocess.stdout.write(JSON.stringify(result))`
  // The pending execFile keeps this process alive so the fixture can still serve the child.
  const { stdout } = await promisify(execFile)(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', timeout: 30_000 })
  expect(JSON.parse(stdout).text).toBe('B-OK')
  expect(a.hits).toHaveLength(1)
  expect(b.hits).toHaveLength(3)
}, 60_000)

test('only one caller holds the HALF_OPEN probe lease after a cooldown expires', async () => {
  let recovering = false
  const a = await makeEndpoint(async (_req, res) => {
    if (!recovering) return send(res, 429, '{}')
    await sleep(250)
    send(res, 200, okBody('a-actual-model', 'A-OK'))
  })
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('b-actual-model', 'B-OK')))
  const dataDir = tmpDataDir()
  const opts: LlmOpts = {
    url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir,
    route: route('http-probe', candidates([a, b], ['a', 'b']), { cooldownMs: 150 }),
  }
  expect((await callAgent(opts, 'p')).text).toBe('B-OK')
  expect(breakerState(dataDir, a, 'a')).toBe('OPEN')
  await waitForCooldown(dataDir, a, 'a')
  recovering = true
  const [first, second] = await Promise.all([callAgent(opts, 'p'), callAgent(opts, 'p')])
  expect(a.hits).toHaveLength(2)
  const probed = [first.actualModel, second.actualModel].filter(model => model === 'a-actual-model')
  const fallback = [first.actualModel, second.actualModel].filter(model => model === 'b-actual-model')
  expect(probed).toHaveLength(1)
  expect(fallback).toHaveLength(1)
  // 探測成功必須清掉熔斷狀態檔（CLOSED），否則下一輪會繼續把它當冷卻中的候選。
  expect(breakerState(dataDir, a, 'a')).toBeUndefined()
})

test('caller abort and an expired total deadline issue no further request', async () => {
  const a = await makeEndpoint((_req, res) => send(res, 200, okBody('a-actual-model', 'A-OK')))
  const dataDir = tmpDataDir()
  const aborted = new AbortController()
  aborted.abort()
  const cancelled = await callAgent({
    url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir, signal: aborted.signal,
    route: route('http-cancel', candidates([a], ['a'])),
  }, 'p')
  expect(cancelled.text).toBe('')
  expect(cancelled.error).toMatch(/cancelled/i)
  expect(a.hits).toHaveLength(0)

  const slow = await makeEndpoint(async (_req, res) => { await sleep(150); send(res, 200, okBody('slow', 'SLOW-OK')) })
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('b-actual-model', 'B-OK')))
  const expired = await callAgent({
    url: slow.url, model: 'alias', apiKey: 'k-single-path', dataDir,
    route: route('http-deadline', candidates([slow, b], ['slow', 'b']), { totalDeadlineMs: 60 }),
  }, 'p')
  expect(expired.text).toBe('')
  expect(expired.error).toMatch(/deadline/i)
  expect(b.hits).toHaveLength(0)
})

test('reviewer role blocks an alias-only gateway and quarantines an excluded identity', async () => {
  const aliasOnly = await makeEndpoint((_req, res) => send(res, 200, okBody('combo-alias', 'REVIEW: PASS')))
  const writer = await makeEndpoint((_req, res) => send(res, 200, okBody('writer-model', 'REVIEW: PASS')))
  const independent = await makeEndpoint((_req, res) => send(res, 200, okBody('reviewer-model', 'REVIEW: PASS')))
  const dataDir = tmpDataDir()
  const review = (list: RouteCandidate[]): LlmOpts => ({
    url: String(list[0]!.url), model: 'combo-alias', apiKey: 'k-single-path', dataDir, role: 'review',
    requireActualModel: true, excludedModels: ['writer-model'],
    route: route('http-review', list),
  })
  const gatewayBlocked = await callAgent(review([{
    id: 'gw', url: aliasOnly.url, model: 'combo-alias', apiKey: 'k-secret-gw', credentialRef: 'cred-gw', gateway: true,
  }]), 'p')
  expect(gatewayBlocked.text).toBe('')
  expect(gatewayBlocked.error).toMatch(/actual model unknown/i)
  expect(receipts(dataDir).find(line => line.candidateId === 'gw'))
    .toMatchObject({ phase: 'blocked', failureClass: 'identity-unknown', upstreamAttempts: 'unknown' })

  const writerCall = await callAgent(review(candidates([writer], ['w'])), 'p')
  expect(writerCall.text).toBe('')
  expect(writerCall.error).toMatch(/excluded/i)

  writer.hits.length = 0
  const fallback = await callAgent(review(candidates([writer, independent], ['w', 'c'])), 'p')
  expect(writer.hits).toHaveLength(0)
  expect(fallback.text).toBe('REVIEW: PASS')
  const states = readdirSync(join(dataDir, 'route-breakers')).filter(file => file.endsWith('.json'))
    .map(file => JSON.parse(readFileSync(join(dataDir, 'route-breakers', file), 'utf8')) as { state?: string })
  expect(states.some(state => state.state === 'QUARANTINED')).toBe(true)
})

test('route disabled keeps the existing single-path semantics', async () => {
  const a = await makeEndpoint((_req, res) => send(res, 429, '{}'))
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('b-actual-model', 'B-OK')))
  const out = await callAgent({
    url: a.url, model: 'm-a', apiKey: 'k-single-path', dataDir: tmpDataDir(),
    route: route('http-off', candidates([b], ['b']), { enabled: false }),
  }, 'p')
  expect(out.text).toBe('')
  expect(out.error).toBe('HTTP 429')
  expect(a.hits).toHaveLength(1)
  expect(b.hits).toHaveLength(0)
})

test('free-only rejects a loopback route endpoint before any model request', async () => {
  const a = await makeEndpoint((_req, res) => send(res, 200, okBody('x', 'X-OK')))
  const out = await callAgent({
    tierMode: 'free-only', url: a.url, model: 'openrouter/vendor/m:free', apiKey: 'k-single-path', dataDir: tmpDataDir(),
    route: route('http-free', [{ id: 'a', url: a.url, model: 'vendor/m:free', apiKey: 'k-a' }]),
  }, 'p')
  expect(out.text).toBe('')
  expect(out.error).toMatch(/unverified endpoint/)
  expect(a.hits).toHaveLength(0)
})

test('receipts attribute every attempt without leaking credentials or prompt bodies', async () => {
  const a = await makeEndpoint((_req, res) => send(res, 429, '{}'))
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('b-actual-model', 'B-OK')))
  const dataDir = tmpDataDir()
  const out = await callAgent({
    url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir, callId: 'http-receipt-call',
    route: route('http-receipt', candidates([a, b], ['a', 'b']), { policyVersion: '7' }),
  }, 'prompt-with-sensitive-content')
  expect(out.text).toBe('B-OK')
  const raw = readFileSync(join(dataDir, 'route-calls.jsonl'), 'utf8')
  expect(raw).not.toContain('k-secret')
  expect(raw).not.toContain('prompt-with-sensitive-content')
  expect(raw).not.toMatch(/authorization/i)
  expect(receipts(dataDir).find(line => line.candidateId === 'a' && line.phase === 'attempt-failed'))
    .toMatchObject({ callId: 'http-receipt-call', routeId: 'http-receipt', policyVersion: '7', failureClass: 'transient-http' })
  expect(receipts(dataDir).find(line => line.candidateId === 'b' && line.phase === 'completed'))
    .toMatchObject({ actualModel: 'b-actual-model', actualModelSource: 'upstream-reported', attempts: 2 })
})

test('an unbounded gateway under a hard cost cap is blocked before any request', async () => {
  const gateway = await makeEndpoint((_req, res) => send(res, 200, okBody('actual', 'SHOULD-NOT-DISPATCH', { cost: 0 })))
  const dataDir = tmpDataDir()
  const out = await callAgent({
    url: gateway.url, model: 'alias', apiKey: 'k-single-path', dataDir,
    route: route('http-hard-cap', [{ ...candidates([gateway], ['gw'])[0]!, gateway: true }], { maxCostUsd: 0 }),
  }, 'prompt')
  expect(out.text).toBe('')
  expect(out.error).toMatch(/cost.*(?:bound|unknown)/i)
  expect(gateway.hits).toHaveLength(0)
  expect(receipts(dataDir).some(line => line.phase === 'completed')).toBe(false)
  expect(receipts(dataDir).find(line => line.phase === 'blocked'))
    .toMatchObject({ failureClass: 'cost-unknown', attempts: 0, cost: 'unknown' })
})

test('a concurrent success cannot clear a durable identity quarantine', async () => {
  let releaseFirst!: () => void
  let firstHit!: () => void
  const firstStarted = new Promise<void>(resolve => { firstHit = resolve })
  const firstResponse = new Promise<void>(resolve => { releaseFirst = resolve })
  let requests = 0
  const a = await makeEndpoint(async (_req, res) => {
    requests++
    if (requests === 1) { firstHit(); await firstResponse; return send(res, 200, okBody('independent-model', 'REVIEW: PASS')) }
    send(res, 200, okBody('writer-model', 'REVIEW: PASS'))
  })
  const spare = await makeEndpoint((_req, res) => send(res, 200, okBody('independent-model', 'REVIEW: PASS')))
  const dataDir = tmpDataDir()
  const options: LlmOpts = {
    url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir, role: 'review',
    requireActualModel: true, excludedModels: ['writer-model'],
    route: route('http-quarantine-race', candidates([a], ['a'])),
  }
  const pending = callAgent(options, 'prompt')
  try {
    await firstStarted
    const violating = await callAgent(options, 'prompt')
    expect(violating.error).toMatch(/excluded/i)
    expect(breakerState(dataDir, a, 'a')).toBe('QUARANTINED')
    releaseFirst()
    const late = await pending
    expect(late.text).toBe('')
    expect(late.error).toMatch(/quarantin/i)
    expect(breakerState(dataDir, a, 'a')).toBe('QUARANTINED')
    const next = await callAgent({ ...options, route: route('http-quarantine-race', candidates([a, spare], ['a', 'spare'])) }, 'prompt')
    expect(a.hits).toHaveLength(2)
    expect(spare.hits).toHaveLength(1)
    expect(next.actualModel).toBe('independent-model')
    expect(receipts(dataDir).some(line => line.candidateId === 'a' && line.phase === 'completed')).toBe(false)
  } finally { releaseFirst(); await pending }
})

test('a live HALF_OPEN probe stays exclusive across processes after its stale window', async () => {
  expect(existsSync(new URL('../dist/autopilot/llm.js', import.meta.url))).toBe(true)
  let recovered = false
  let releaseProbe!: () => void
  let probeHit!: () => void
  const probeStarted = new Promise<void>(resolve => { probeHit = resolve })
  const probeResponse = new Promise<void>(resolve => { releaseProbe = resolve })
  let recoveredHits = 0
  const a = await makeEndpoint(async (_req, res) => {
    if (!recovered) return send(res, 429, '{}')
    recoveredHits++
    if (recoveredHits === 1) { probeHit(); await probeResponse }
    send(res, 200, okBody('a-actual', 'A-OK'))
  })
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('b-actual', 'B-OK')))
  const dataDir = tmpDataDir()
  const options: LlmOpts = {
    url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir,
    route: route('http-process-probe', candidates([a, b], ['a', 'b']), {
      cooldownMs: 50, probeLeaseMs: 30, perAttemptTimeoutMs: 15_000,
    }),
  }
  const prime = await callAgent(options, 'prompt')
  expect(prime.actualModel).toBe('b-actual')
  await waitForCooldown(dataDir, a, 'a')
  recovered = true
  const script = `import { callAgent } from ${JSON.stringify(runtimeModuleUrl('autopilot/llm.js'))}; process.stdout.write(JSON.stringify(await callAgent(${JSON.stringify(options)}, 'prompt')))`
  const child = () => promisify(execFile)(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', timeout: 30_000 })
  const first = child()
  try {
    await probeStarted
    // Intentionally cross the configured 30ms stale window while the first real
    // HTTP request and its process remain live; that must not authorize a new probe.
    await sleep(70)
    const second = JSON.parse((await child()).stdout) as { actualModel?: string; error?: string }
    expect(second.error).toBeUndefined()
    expect(second.actualModel).toBe('b-actual')
    expect(recoveredHits).toBe(1)
    expect(a.hits).toHaveLength(2)
    releaseProbe()
    const result = JSON.parse((await first).stdout) as { actualModel?: string; error?: string }
    expect(result.error).toBeUndefined()
    expect(result.actualModel).toBe('a-actual')
    expect(readBreaker(dataDir, breakerKey(candidates([a], ['a'])[0]!)).kind).toBe('closed')
  } finally { releaseProbe(); await first }
}, 60_000)

test('nested gateway retries have one observable outer request instead of three times three', async () => {
  const upstream = await makeEndpoint((_req, res) => send(res, 503, '{}'))
  const gateway = () => makeEndpoint(async (_req, res) => {
    for (let i = 0; i < 3; i++) {
      await fetch(`${upstream.url}/chat/completions`, { method: 'POST', headers: { authorization: 'Bearer fictional-inner-key' }, body: '{}' })
    }
    send(res, 503, '{}')
  })
  const gateways = [await gateway(), await gateway(), await gateway()]
  const dataDir = tmpDataDir()
  const out = await callAgent({
    url: gateways[0]!.url, model: 'alias', apiKey: 'k-single-path', dataDir,
    route: route('http-nested', candidates(gateways, ['g1', 'g2', 'g3']).map(candidate => ({ ...candidate, gateway: true })), { maxAttempts: 3 }),
  }, 'prompt')
  expect(out.text).toBe('')
  expect(out.error).toMatch(/unavailable/i)
  expect(gateways.map(endpoint => endpoint.hits.length)).toEqual([1, 0, 0])
  expect(upstream.hits).toHaveLength(3)
  expect(receipts(dataDir).find(line => line.phase === 'attempt-failed'))
    .toMatchObject({ attempt: 1, outerAttemptLimit: 1, upstreamAttempts: 'unknown' })
  expect(receipts(dataDir).find(line => line.phase === 'blocked')).toMatchObject({ attempts: 1 })
})

test('incompatible roles, unresolved credentials and invalid policy stop before dispatch', async () => {
  const a = await makeEndpoint((_req, res) => send(res, 200, okBody('a-actual', 'A-OK')))
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('b-actual', 'B-OK')))
  const list = candidates([a, b], ['a', 'b'])
  const base: LlmOpts = { url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir: tmpDataDir() }
  const wrongRole = await callAgent({ ...base, role: 'review', route: route('http-role', list.map(candidate => ({ ...candidate, roles: ['judge'] }))) }, 'prompt')
  expect(wrongRole.error).toMatch(/no candidates for role review/i)
  const unresolved = await callAgent({ ...base, route: route('http-secret', [{ ...list[0]!, apiKey: '{env:FICTIONAL_UNRESOLVED_SECRET}' }, list[1]!]) }, 'prompt')
  expect(unresolved.error).toMatch(/credential.*unavailable/i)
  const invalid = await callAgent({ ...base, route: { ...route('http-invalid', list), maxAttempts: 4 } }, 'prompt')
  expect(invalid.error).toMatch(/maxAttempts/i)
  expect(a.hits).toHaveLength(0)
  expect(b.hits).toHaveLength(0)
})

test.each([403, 400, 404, 422])('permanent HTTP %i never retries another candidate', async status => {
  const a = await makeEndpoint((_req, res) => send(res, status, '{}'))
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('b-actual', 'B-OK')))
  const out = await callAgent({ url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir: tmpDataDir(), route: route(`http-permanent-${status}`, candidates([a, b], ['a', 'b'])) }, 'prompt')
  expect(out.text).toBe('')
  expect(out.error).toContain(`HTTP ${status}`)
  expect(a.hits).toHaveLength(1)
  expect(b.hits).toHaveLength(0)
})

test('a reviewer veto is returned to the review gate without shopping another model', async () => {
  const a = await makeEndpoint((_req, res) => send(res, 200, okBody('independent-model', 'REVIEW: REJECT\nnot correct')))
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('other-model', 'REVIEW: PASS')))
  const out = await callAgent({
    url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir: tmpDataDir(), role: 'review',
    requireActualModel: true, excludedModels: ['writer-model'], route: route('http-veto', candidates([a, b], ['a', 'b'])),
  }, 'prompt')
  expect(parseReviewVerdict(out.text).kind).toBe('reject')
  expect(a.hits).toHaveLength(1)
  expect(b.hits).toHaveLength(0)
})

test('caller cancellation during a real request never dispatches a fallback', async () => {
  let started!: () => void
  const requested = new Promise<void>(resolve => { started = resolve })
  const a = await makeEndpoint(() => { started() })
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('b-actual', 'B-OK')))
  const controller = new AbortController()
  const dataDir = tmpDataDir()
  const pending = callAgent({ url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir, signal: controller.signal, route: route('http-active-abort', candidates([a, b], ['a', 'b'])) }, 'prompt')
  await requested
  controller.abort()
  const out = await pending
  expect(out.text).toBe('')
  expect(out.error).toMatch(/cancelled/i)
  expect(a.hits).toHaveLength(1)
  expect(b.hits).toHaveLength(0)
  expect(receipts(dataDir).find(line => line.phase === 'blocked')).toMatchObject({ failureClass: 'cancelled' })
})

test('waiting for the probe coordinator cannot dispatch after the total deadline', async () => {
  let recovered = false
  const a = await makeEndpoint((_req, res) => send(res, recovered ? 200 : 429, recovered ? okBody('a-actual', 'A-OK') : '{}'))
  const dataDir = tmpDataDir()
  const policy = route('http-lock-deadline', candidates([a], ['a']), { maxAttempts: 1, cooldownMs: 30, perAttemptTimeoutMs: 2000 })
  const options: LlmOpts = { url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir, route: policy }
  expect((await callAgent(options, 'prime')).error).toMatch(/unavailable/i)
  await waitForCooldown(dataDir, a, 'a')
  recovered = true
  const database = join(dataDir, 'route-breakers', '.autodev-lock-coordination.sqlite')
  const script = `import Database from 'better-sqlite3'; const db = new Database(${JSON.stringify(database)}); db.exec('BEGIN IMMEDIATE'); process.stdout.write('HELD\\n'); setTimeout(() => { db.exec('ROLLBACK'); db.close() }, 150)`
  const holder = spawn(process.execPath, ['--input-type=module', '-e', script], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] })
  let errors = ''
  holder.stderr.on('data', chunk => { errors += String(chunk) })
  const finished = new Promise<void>((resolve, reject) => {
    holder.once('error', reject)
    holder.once('exit', code => code === 0 ? resolve() : reject(new Error(`coordinator fixture exited ${code}: ${errors}`)))
  })
  try {
    await new Promise<void>((resolve, reject) => {
      let output = ''
      holder.stdout.on('data', chunk => { output += String(chunk); if (output.includes('HELD\n')) resolve() })
      holder.once('error', reject)
      holder.once('exit', () => { if (!output.includes('HELD\n')) reject(new Error(`coordinator fixture never held its lock: ${errors}`)) })
    })
    const out = await callAgent({ ...options, route: { ...policy, totalDeadlineMs: 40 } }, 'prompt')
    expect(out.text).toBe('')
    expect(out.error).toMatch(/deadline/i)
    expect(a.hits).toHaveLength(1)
    expect(receipts(dataDir).at(-1)).toMatchObject({ phase: 'blocked', failureClass: 'deadline-exceeded', attempts: 0 })
    expect(existsSync(join(dataDir, 'route-breakers', `${breakerKey(candidates([a], ['a'])[0]!)}.probe`))).toBe(false)
  } finally { await finished }
})

test.each([
  { name: 'null', payload: null },
  { name: 'array', payload: [] },
  { name: 'object-shaped choices', payload: { model: 'a-actual', choices: { 0: { message: { content: 'FICTIONAL_INVALID_RESPONSE' } } } } },
  { name: 'non-object message', payload: { choices: [{ message: 'not an object' }] } },
  { name: 'array-shaped usage', payload: { choices: [{ message: { content: 'FICTIONAL_INVALID_RESPONSE' } }], usage: [] } },
  { name: 'non-string model', payload: { model: { private: 'FICTIONAL_PRIVATE_SCHEMA' }, choices: [{ message: { content: 'FICTIONAL_INVALID_RESPONSE' } }] } },
  { name: 'invalid token count', payload: { choices: [{ message: { content: 'FICTIONAL_INVALID_RESPONSE' } }], usage: { total_tokens: -1 } } },
  { name: 'negative cost', payload: { choices: [{ message: { content: 'FICTIONAL_INVALID_RESPONSE' } }], usage: { cost: -1 } } },
])('malformed $name response releases its HALF_OPEN generation without fallback', async ({ payload }) => {
  let mode: 'limited' | 'malformed' | 'healthy' = 'limited'
  const a = await makeEndpoint((_req, res) => {
    if (mode === 'limited') return send(res, 429, '{}')
    send(res, 200, mode === 'malformed' ? JSON.stringify(payload) : okBody('a-actual', 'A-OK'))
  })
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('b-actual', 'B-OK')))
  const dataDir = tmpDataDir()
  const options: LlmOpts = { url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir, route: route('http-malformed-probe', candidates([a, b], ['a', 'b']), { cooldownMs: 30 }) }
  expect((await callAgent(options, 'prime')).actualModel).toBe('b-actual')
  await waitForCooldown(dataDir, a, 'a')
  mode = 'malformed'
  const invalid = await callAgent(options, 'prompt')
  expect(invalid.text).toBe('')
  expect(b.hits).toHaveLength(1)
  expect(existsSync(join(dataDir, 'route-breakers', `${breakerKey(candidates([a], ['a'])[0]!)}.probe`))).toBe(false)
  expect(receipts(dataDir).at(-1)).toMatchObject({ phase: 'blocked', failureClass: 'invalid-response' })
  mode = 'healthy'
  const recovered = await callAgent(options, 'prompt')
  expect(recovered.actualModel).toBe('a-actual')
  expect(a.hits).toHaveLength(3)
  expect(b.hits).toHaveLength(1)
})

test('transport diagnostics never persist arbitrary exception secrets', async () => {
  const privateValues = ['SYNTHETIC_TRANSPORT_SECRET_123', 'SYNTHETIC_QUERY_SECRET_123', 'SYNTHETIC_PRIVATE_PROMPT_123', 'Authorization: Bearer', 'SYNTHETIC_PROVIDER_BODY_123']
  const a = await makeEndpoint((_req, res) => send(res, 200, okBody('a-actual', 'A-OK')))
  const dataDir = tmpDataDir()
  const out = await callAgent({
    url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir,
    route: route('http-private-error', [{ id: 'a', url: `${a.url}?token=${privateValues[1]}`, model: 'm-a', apiKey: privateValues[0], credentialRef: 'cred-a' }]),
    fetchFn: (async () => { throw new Error(privateValues.join(' | ')) }) as typeof fetch,
  }, privateValues[2]!)
  expect(out.text).toBe('')
  expect(out.error).toContain('transport error')
  expect(a.hits).toHaveLength(0)
  const persisted = readFileSync(join(dataDir, 'route-calls.jsonl'), 'utf8') + readFileSync(join(dataDir, 'route-breakers', `${breakerKey({ url: `${a.url}?token=${privateValues[1]}`, model: 'm-a', apiKey: privateValues[0], credentialRef: 'cred-a' })}.json`), 'utf8')
  for (const value of privateValues) { expect(persisted).not.toContain(value); expect(out.error).not.toContain(value) }
})

test.each(['newline', 'trailing-newline', 'credential', 'embedded-credential', 'overlong'])('invalid %s model metadata cannot leak into receipts or pass review', async kind => {
  const key = 'SYNTHETIC_MODEL_SECRET_123'
  const marker = 'SYNTHETIC_PRIVATE_PROMPT_123'
  const reported = kind === 'newline' ? `model\n${key}\n${marker}\nAuthorization: Bearer\nSYNTHETIC_PROVIDER_BODY_123`
    : kind === 'trailing-newline' ? 'actual-model\n' : kind === 'credential' ? key : kind === 'embedded-credential' ? `vendor/${key}-model` : 'm'.repeat(257)
  const a = await makeEndpoint((_req, res) => send(res, 200, okBody(reported, 'REVIEW: PASS')))
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('independent-model', 'REVIEW: PASS')))
  const dataDir = tmpDataDir()
  const out = await callAgent({
    url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir, role: 'review', requireActualModel: true,
    route: route('http-private-model', [{ ...candidates([a], ['a'])[0]!, apiKey: key }, candidates([b], ['b'])[0]!]),
  }, marker)
  expect(out.text).toBe('')
  expect(out.error).toMatch(/invalid actual model metadata/i)
  expect(a.hits).toHaveLength(1)
  expect(b.hits).toHaveLength(0)
  const raw = readFileSync(join(dataDir, 'route-calls.jsonl'), 'utf8')
  for (const value of [key, marker, reported]) expect(raw).not.toContain(value)
  expect(receipts(dataDir).at(-1)).toMatchObject({ phase: 'blocked', failureClass: 'invalid-response' })
  expect(receipts(dataDir).some(line => line.phase === 'completed')).toBe(false)
})

test('identifier-shaped vendor model metadata remains upstream-reported', async () => {
  const model = 'vendor/model-v1.2:latest@rev-3'
  const a = await makeEndpoint((_req, res) => send(res, 200, okBody(model, 'identifier fixture only')))
  const dataDir = tmpDataDir()
  const out = await callAgent({ url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir, requireActualModel: true, route: route('http-model-format', candidates([a], ['a'])) }, 'prompt')
  expect(out.actualModel).toBe(model)
  expect(out.text).toBe('identifier fixture only')
  expect(receipts(dataDir).at(-1)).toMatchObject({ actualModel: model, actualModelSource: 'upstream-reported' })
})

test.each(['prompt', 'trimmed-prompt', 'endpoint'])('a known %s echo is invalid model metadata and releases its probe', async kind => {
  const marker = 'SYNTHETIC_PRIVATE_PROMPT_ECHO_123'
  const prompt = kind === 'trimmed-prompt' ? `  ${marker}\n` : marker
  let mode: 'limited' | 'invalid' | 'healthy' = 'limited'
  let reported = marker
  const a = await makeEndpoint((_req, res) => {
    if (mode === 'limited') return send(res, 429, '{}')
    send(res, 200, okBody(mode === 'invalid' ? reported : 'legitimate-model', 'REVIEW: PASS'))
  })
  if (kind === 'endpoint') reported = a.url
  const b = await makeEndpoint((_req, res) => send(res, 200, okBody('independent-model', 'REVIEW: PASS')))
  const dataDir = tmpDataDir()
  const options: LlmOpts = { url: a.url, model: 'alias', apiKey: 'k-single-path', dataDir, requireActualModel: true, role: 'review', route: route('http-known-echo', candidates([a, b], ['a', 'b']), { cooldownMs: 30 }) }
  expect((await callAgent(options, 'prime')).actualModel).toBe('independent-model')
  await waitForCooldown(dataDir, a, 'a')
  mode = 'invalid'
  const blocked = await callAgent(options, prompt)
  expect(blocked.text).toBe('')
  expect(blocked.error).toMatch(/invalid actual model metadata/i)
  expect(b.hits).toHaveLength(1)
  expect(existsSync(join(dataDir, 'route-breakers', `${breakerKey(candidates([a], ['a'])[0]!)}.probe`))).toBe(false)
  const raw = readFileSync(join(dataDir, 'route-calls.jsonl'), 'utf8')
  expect(raw).not.toContain(reported)
  expect(receipts(dataDir).at(-1)).toMatchObject({ phase: 'blocked', failureClass: 'invalid-response' })
  mode = 'healthy'
  expect((await callAgent(options, prompt)).actualModel).toBe('legitimate-model')
  expect(a.hits).toHaveLength(3)
  expect(b.hits).toHaveLength(1)
})
