import { afterAll, expect, test } from 'vitest'
import { execFile } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import http from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { callAgent, type LlmOpts } from '../src/autopilot/llm.js'
import { breakerKey, readBreaker, RoutePolicySchema, type RouteCandidate, type RoutePolicy } from '../src/engines/model-route-policy.js'
import { ensureRuntimeBuilt, runtimeModuleUrl } from './helpers/runtime-build.js'

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
  expect(await ensureRuntimeBuilt()).toBe(true)
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
