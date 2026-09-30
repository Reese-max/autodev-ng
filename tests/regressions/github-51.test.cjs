'use strict'
// Regression for Reese-max/autodev-ng#51:
// The general HTTP branch of callAgent() previously used a single url/model with no bounded
// fallback: a transient 429/503 returned `HTTP <status>` and the logical call simply failed,
// with no durable circuit breaker, no candidate evidence, and no retry ownership boundary.
//
// This test exercises the real compiled modules (dist/autopilot/llm.js and
// dist/engines/model-route-policy.js — build first) against real local node:http servers:
// no external model, account or network is used. It must pass on the fixed implementation
// and fail an assertion on the original implementation (which ignores `route` and only calls
// the primary URL once, so `result.text` is '' instead of the fallback body's content).
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } = require('node:fs')
const http = require('node:http')
const { tmpdir } = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const ROOT = path.join(__dirname, '..', '..')
const LLM_JS = path.join(ROOT, 'dist', 'autopilot', 'llm.js')
const ROUTE_JS = path.join(ROOT, 'dist', 'engines', 'model-route-policy.js')

let callAgent
const servers = []
const dirs = []

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server.address().port))
  })
}

/** A real HTTP fixture: records hits (url, auth header, body) and replies per handler. */
async function makeEndpoint(handler) {
  const hits = []
  const server = http.createServer((req, res) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => {
      hits.push({ url: req.url, auth: req.headers.authorization, body: Buffer.concat(chunks).toString('utf8') })
      Promise.resolve(handler(req, res)).catch(() => { if (!res.writableEnded) { res.writeHead(500); res.end('{}') } })
    })
  })
  const port = await listen(server)
  servers.push(server)
  return { hits, url: `http://127.0.0.1:${port}/v1`, close: () => new Promise(r => server.close(r)) }
}

const okBody = (model, content, extra = {}) => JSON.stringify({
  model, choices: [{ message: { content } }], usage: { total_tokens: 7, ...extra },
})
const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'content-type': 'application/json', ...headers })
  res.end(body)
}
const tmpDataDir = () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'adng-gh51-'))
  dirs.push(dir)
  return dir
}
const sleep = ms => new Promise(r => setTimeout(r, ms))

before(async () => {
  if (!existsSync(LLM_JS)) throw new Error(`Build the project first (npm run build): missing ${LLM_JS}`)
  callAgent = (await import(pathToFileURL(LLM_JS).href)).callAgent
})

after(() => {
  for (const server of servers) { try { server.close() } catch { /* best effort */ } }
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true, maxRetries: 5 })
})

test('transient 429 with Retry-After falls back once to the next authorized candidate', async () => {
  const a = await makeEndpoint((req, res) => send(res, 429, '{}', { 'retry-after': '120' }))
  const b = await makeEndpoint((req, res) => send(res, 200, okBody('b-actual-model', 'B-OK')))
  const dataDir = tmpDataDir()
  const out = await callAgent({
    url: a.url, model: 'alias-primary', apiKey: 'k-unused-single-path', dataDir,
    route: {
      enabled: true, routeId: 'gh51-main', policyVersion: '1',
      candidates: [
        { id: 'a', url: a.url, model: 'm-a', apiKey: 'k-secret-a', credentialRef: 'cred-a' },
        { id: 'b', url: b.url, model: 'm-b', apiKey: 'k-secret-b', credentialRef: 'cred-b' },
      ],
    },
  }, 'prompt')
  assert.equal(out.text, 'B-OK', 'logical call must be served by candidate B after A returns 429')
  assert.equal(a.hits.length, 1, 'A is attempted exactly once per logical call')
  assert.equal(b.hits.length, 1, 'B is attempted exactly once per logical call')
  assert.equal(out.actualModel, 'b-actual-model', 'receipt-grade actual model must come from the upstream response')
  assert.equal(a.hits[0].auth, 'Bearer k-secret-a')
  assert.equal(b.hits[0].auth, 'Bearer k-secret-b', 'each candidate uses only its own fixed credential')
  assert.equal(out.error, undefined)
  assert.equal(out.retryAt, undefined, 'successful logical call does not masquerade as a wait')
  const sent = JSON.parse(b.hits[0].body)
  assert.equal(sent.model, 'm-b', 'the candidate model is sent, not the route alias')
})

test('cooldown persists across in-process calls and a real process restart', async () => {
  const a = await makeEndpoint((req, res) => send(res, 429, '{}', { 'retry-after': '120' }))
  const b = await makeEndpoint((req, res) => send(res, 200, okBody('b-actual-model', 'B-OK')))
  const dataDir = tmpDataDir()
  const opts = {
    url: a.url, model: 'alias-primary', apiKey: 'k-unused', dataDir,
    route: {
      enabled: true, routeId: 'gh51-persist', policyVersion: '1',
      candidates: [
        { id: 'a', url: a.url, model: 'm-a', apiKey: 'k-a', credentialRef: 'cred-a' },
        { id: 'b', url: b.url, model: 'm-b', apiKey: 'k-b', credentialRef: 'cred-b' },
      ],
    },
  }
  const first = await callAgent(opts, 'p')
  assert.equal(first.text, 'B-OK')
  assert.equal(a.hits.length, 1)
  const second = await callAgent(opts, 'p')
  assert.equal(second.text, 'B-OK')
  assert.equal(a.hits.length, 1, 'candidate A must be skipped while its cooldown is unexpired')
  // A real process restart must not erase the unexpired cooldown.
  const script = `import { callAgent } from ${JSON.stringify(pathToFileURL(LLM_JS).href)}\n` +
    `const r = await callAgent(${JSON.stringify(opts)}, 'p')\nprocess.stdout.write(JSON.stringify(r))`
  // Async exec keeps this process's event loop alive so its HTTP fixture can serve the child.
  const { stdout } = await promisify(execFile)(process.execPath, ['--input-type=module', '-e', script], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 })
  const third = JSON.parse(stdout)
  assert.equal(third.text, 'B-OK')
  assert.equal(a.hits.length, 1, 'after restart candidate A is still cooling and must not be retried')
  assert.equal(b.hits.length, 3)
})

test('all candidates unavailable: bounded stop within attempt cap, no busy loop, explicit retryAt', async () => {
  const mk = () => makeEndpoint((req, res) => send(res, 503, '{}', { 'retry-after': '60' }))
  const [x, y, z] = [await mk(), await mk(), await mk()]
  const dataDir = tmpDataDir()
  const out = await callAgent({
    url: x.url, model: 'alias', apiKey: 'k', dataDir,
    route: {
      enabled: true, routeId: 'gh51-down', policyVersion: '1', maxAttempts: 3,
      candidates: [
        { id: 'x', url: x.url, model: 'm-x', apiKey: 'k-x', credentialRef: 'cx' },
        { id: 'y', url: y.url, model: 'm-y', apiKey: 'k-y', credentialRef: 'cy' },
        { id: 'z', url: z.url, model: 'm-z', apiKey: 'k-z', credentialRef: 'cz' },
      ],
    },
  }, 'p')
  assert.equal(out.text, '')
  assert.ok(out.error && /unavailable|HTTP 503/.test(out.error), `expected explicit failure, got: ${out.error}`)
  assert.equal(x.hits.length + y.hits.length + z.hits.length, 3, 'each candidate is attempted at most once; no amplification')
  assert.ok(Number.isFinite(out.retryAt) && out.retryAt > Date.now(), 'earliest known retryAt must be reported')
})

test('permanent failure classes never trigger fallback (401 auth, invalid request)', async () => {
  const a = await makeEndpoint((req, res) => send(res, 401, '{}'))
  const b = await makeEndpoint((req, res) => send(res, 200, okBody('b-actual', 'B-OK')))
  const dataDir = tmpDataDir()
  const out = await callAgent({
    url: a.url, model: 'alias', apiKey: 'k', dataDir,
    route: {
      enabled: true, routeId: 'gh51-auth', policyVersion: '1',
      candidates: [
        { id: 'a', url: a.url, model: 'm-a', apiKey: 'k-a', credentialRef: 'ca' },
        { id: 'b', url: b.url, model: 'm-b', apiKey: 'k-b', credentialRef: 'cb' },
      ],
    },
  }, 'p')
  assert.equal(out.text, '')
  assert.ok(out.error && /401/.test(out.error), `401 must surface as the call error, got: ${out.error}`)
  assert.equal(a.hits.length, 1)
  assert.equal(b.hits.length, 0, '401 must not trigger a fallback request')
})

test('reviewer role: gateway alias or writer-model identity yields BLOCKED, quarantine survives', async () => {
  const aliasOnly = await makeEndpoint((req, res) => send(res, 200, okBody('combo-alias', 'REVIEW: PASS')))
  const writer = await makeEndpoint((req, res) => send(res, 200, okBody('writer-model', 'REVIEW: PASS')))
  const clean = await makeEndpoint((req, res) => send(res, 200, okBody('reviewer-model', 'REVIEW: PASS')))
  const dataDir = tmpDataDir()
  const review = candidates => ({
    url: candidates[0].url, model: 'combo-alias', apiKey: 'k', dataDir, role: 'review',
    requireActualModel: true, excludedModels: ['writer-model'],
    route: { enabled: true, routeId: 'gh51-review', policyVersion: '1', candidates },
  })
  // Gateway echoing only the combo alias is not identity evidence.
  const gw = await callAgent(review([{ id: 'gw', url: aliasOnly.url, model: 'combo-alias', apiKey: 'k-g', credentialRef: 'cg', gateway: true }]), 'p')
  assert.equal(gw.text, '', `alias-only gateway must be BLOCKED for reviewer role, got: ${gw.text}`)
  assert.ok(/actual model unknown/i.test(gw.error ?? ''))
  // Upstream reporting the writer's own model is an identity violation: block + quarantine.
  const bad = await callAgent(review([{ id: 'w', url: writer.url, model: 'm-w', apiKey: 'k-w', credentialRef: 'cw' }]), 'p')
  assert.equal(bad.text, '', `writer identity must be BLOCKED, got: ${bad.text}`)
  assert.ok(/excluded/i.test(bad.error ?? ''))
  // Quarantine is durable: the same candidate is not re-dispatched even though it would now pass.
  writer.hits.length = 0
  const again = await callAgent(review([
    { id: 'w', url: writer.url, model: 'm-w', apiKey: 'k-w', credentialRef: 'cw' },
    { id: 'c', url: clean.url, model: 'm-c', apiKey: 'k-c', credentialRef: 'cc' },
  ]), 'p')
  assert.equal(writer.hits.length, 0, 'quarantined candidate must not be retried by timer or success race')
  assert.equal(again.text, 'REVIEW: PASS', 'clean independent candidate still serves the call')
  const breakerDir = path.join(dataDir, 'route-breakers')
  const states = readdirSync(breakerDir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(path.join(breakerDir, f), 'utf8')))
  assert.ok(states.some(s => s.state === 'QUARANTINED'), 'quarantine state must be persisted in dataDir')
})

test('single retry owner: one HALF_OPEN probe lease; concurrent caller is not amplified', async () => {
  let aMode = 'limited'
  const a = await makeEndpoint(async (req, res) => {
    if (aMode === 'limited') return send(res, 429, '{}')
    await sleep(250) // probe window: the second caller must observe the held lease
    return send(res, 200, okBody('a-actual', 'A-OK'))
  })
  const b = await makeEndpoint((req, res) => send(res, 200, okBody('b-actual', 'B-OK')))
  const dataDir = tmpDataDir()
  const opts = {
    url: a.url, model: 'alias', apiKey: 'k', dataDir,
    route: {
      enabled: true, routeId: 'gh51-probe', policyVersion: '1', cooldownMs: 120,
      candidates: [
        { id: 'a', url: a.url, model: 'm-a', apiKey: 'k-a', credentialRef: 'ca' },
        { id: 'b', url: b.url, model: 'm-b', apiKey: 'k-b', credentialRef: 'cb' },
      ],
    },
  }
  const first = await callAgent(opts, 'p')
  assert.equal(first.text, 'B-OK')
  assert.equal(a.hits.length, 1)
  await sleep(200) // let A's bounded cooldown expire
  aMode = 'healthy'
  const [r1, r2] = await Promise.all([callAgent(opts, 'p'), callAgent(opts, 'p')])
  assert.equal(a.hits.length, 2, `expired cooldown allows exactly one probe, got ${a.hits.length} A hits`)
  const viaA = [r1, r2].filter(r => r.actualModel === 'a-actual')
  const viaB = [r1, r2].filter(r => r.actualModel === 'b-actual')
  assert.equal(viaA.length, 1, 'the probe holder is served by A')
  assert.equal(viaB.length, 1, 'the concurrent caller is bounded to B, not amplified into a second probe')
})

test('caller abort and total deadline never issue another request', async () => {
  const a = await makeEndpoint((req, res) => send(res, 200, okBody('a-actual', 'A-OK')))
  const dataDir = tmpDataDir()
  const route = { enabled: true, routeId: 'gh51-cancel', policyVersion: '1', candidates: [{ id: 'a', url: a.url, model: 'm-a', apiKey: 'k-a', credentialRef: 'ca' }] }
  const aborted = new AbortController(); aborted.abort()
  const cancelled = await callAgent({ url: a.url, model: 'alias', apiKey: 'k', dataDir, route, signal: aborted.signal }, 'p')
  assert.equal(cancelled.text, '')
  assert.ok(/cancelled/i.test(cancelled.error ?? ''))
  assert.equal(a.hits.length, 0, 'aborted caller must not dispatch')

  const slow = await makeEndpoint(async (req, res) => { await sleep(120); send(res, 200, okBody('s-actual', 'S-OK')) })
  const b2 = await makeEndpoint((req, res) => send(res, 200, okBody('b2-actual', 'B2-OK')))
  const out = await callAgent({
    url: slow.url, model: 'alias', apiKey: 'k', dataDir,
    route: {
      enabled: true, routeId: 'gh51-deadline', policyVersion: '1', totalDeadlineMs: 40,
      candidates: [
        { id: 's', url: slow.url, model: 'm-s', apiKey: 'k-s', credentialRef: 'cs' },
        { id: 'b2', url: b2.url, model: 'm-b2', apiKey: 'k-b2', credentialRef: 'cb2' },
      ],
    },
  }, 'p')
  assert.equal(out.text, '')
  assert.ok(/deadline/i.test(out.error ?? ''), `expired deadline must stop the call, got: ${out.error}`)
  assert.equal(b2.hits.length, 0, 'no request may be issued after the total deadline')
})

test('route disabled: existing single-path semantics are unchanged', async () => {
  const a = await makeEndpoint((req, res) => send(res, 429, '{}'))
  const b = await makeEndpoint((req, res) => send(res, 200, okBody('b-actual', 'B-OK')))
  const out = await callAgent({
    url: a.url, model: 'm-a', apiKey: 'k', dataDir: tmpDataDir(),
    route: { enabled: false, routeId: 'gh51-off', candidates: [{ id: 'b', url: b.url, model: 'm-b', apiKey: 'k-b' }] },
  }, 'p')
  assert.equal(out.text, '')
  assert.equal(out.error, 'HTTP 429')
  assert.equal(a.hits.length, 1)
  assert.equal(b.hits.length, 0)
})

test('free-only still rejects non-OpenRouter endpoints before any model request', async () => {
  const a = await makeEndpoint((req, res) => send(res, 200, okBody('x', 'X-OK')))
  const out = await callAgent({
    tierMode: 'free-only', url: a.url, model: 'openrouter/vendor/m:free', apiKey: 'k', dataDir: tmpDataDir(),
    route: { enabled: true, routeId: 'gh51-free', candidates: [{ id: 'a', url: a.url, model: 'vendor/m:free', apiKey: 'k-a' }] },
  }, 'p')
  assert.equal(out.text, '')
  assert.ok(/unverified endpoint|free-policy/.test(out.error ?? ''), `free-only must reject localhost route, got: ${out.error}`)
  assert.equal(a.hits.length, 0, 'no request may be sent before free-policy verification')
})

test('receipts attribute attempts without leaking secrets or prompt bodies', async () => {
  const a = await makeEndpoint((req, res) => send(res, 429, '{}'))
  const b = await makeEndpoint((req, res) => send(res, 200, okBody('b-actual', 'B-OK')))
  const dataDir = tmpDataDir()
  const out = await callAgent({
    url: a.url, model: 'alias', apiKey: 'k-single', dataDir, callId: 'gh51-receipt-call',
    route: {
      enabled: true, routeId: 'gh51-receipt', policyVersion: '7',
      candidates: [
        { id: 'a', url: a.url, model: 'm-a', apiKey: 'k-secret-aaaa', credentialRef: 'ca' },
        { id: 'b', url: b.url, model: 'm-b', apiKey: 'k-secret-bbbb', credentialRef: 'cb' },
      ],
    },
  }, 'prompt-with-sensitive-content')
  assert.equal(out.text, 'B-OK')
  const receiptFile = path.join(dataDir, 'route-calls.jsonl')
  assert.ok(existsSync(receiptFile), 'route receipt must be persisted in dataDir')
  const raw = readFileSync(receiptFile, 'utf8')
  assert.ok(!raw.includes('k-secret'), `receipt must not contain credential values: ${raw}`)
  assert.ok(!raw.includes('prompt-with-sensitive-content'), 'receipt must not contain the prompt body')
  assert.ok(!/authorization/i.test(raw), 'receipt must not contain auth headers')
  const lines = raw.trim().split('\n').map(l => JSON.parse(l))
  const failed = lines.find(l => l.phase === 'attempt-failed' && l.candidateId === 'a')
  const done = lines.find(l => l.phase === 'completed' && l.candidateId === 'b')
  assert.ok(failed, 'the transient failure attempt must be recorded')
  assert.equal(failed.failureClass, 'transient-http')
  assert.equal(failed.callId, 'gh51-receipt-call')
  assert.ok(done, 'the completing attempt must be recorded')
  assert.equal(done.actualModel, 'b-actual')
  assert.equal(done.actualModelSource, 'upstream-reported')
  assert.equal(done.policyVersion, '7')
  assert.ok(!('apiKey' in done) && !('apiKey' in failed), 'credential values never appear in receipt fields')
})

test('route policy module exposes the contract surface (schema, classifier, breaker key)', async () => {
  const mod = await import(pathToFileURL(ROUTE_JS).href)
  assert.equal(typeof mod.callRoutedAgent, 'function')
  assert.equal(typeof mod.RoutePolicySchema, 'object')
  assert.equal(mod.classifyHttpStatus(429), 'transient-http')
  assert.equal(mod.classifyHttpStatus(401), 'auth')
  assert.equal(mod.isFallbackAllowed('auth'), false)
  assert.equal(mod.isFallbackAllowed('attempt-timeout'), true)
  const key = mod.breakerKey({ url: 'http://x/v1', model: 'm', apiKey: 'k-secret-aaaa', credentialRef: 'cred' })
  assert.ok(/^[a-f0-9]{24}$/.test(key), 'breaker key is a non-secret hash')
})
