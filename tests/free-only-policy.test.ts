import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { z } from 'zod'
import { callAgent, llmFromConfig } from '../src/autopilot/llm.js'
import { codexJson } from '../src/engines/cli-json.js'
import { makeEngineRegistry } from '../src/engines/registry.js'
import { FREE_MODEL_CATALOG, FREE_MODEL_URL, retryAt } from '../src/engines/free-model-policy.js'
import { reviewDiff, runReviewGate } from '../src/engines/review-gate.js'
import { ConfigSchema } from '../src/types.js'
import { researchModels } from '../src/autopilot/report-research.js'
import { reviewRepair } from '../src/github/repair.js'
import { reflectOnFailure } from '../src/learn/reflect.js'
import * as proc from '../src/engines/proc.js'
import { OpencodeEngine } from '../src/engines/opencode.js'
import { PreflightCache } from '../src/preflight.js'
import { evaluate } from '../src/autopilot/evaluator.js'
import { runGoalSession } from '../src/autopilot/orchestrator.js'
import { reviewRetryDelay } from '../src/engines/pending-review.js'
import { BacklogStore } from '../src/backlog.js'
import { EventLog } from '../src/events.js'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
const model = 'test/planner:free', reviewer = 'test/reviewer:free'
const options = () => ({ tierMode: 'free-only' as const, dataDir: mkdtempSync(join(tmpdir(), 'adng-free-model-')), url: FREE_MODEL_URL, model, apiKey: 'test-credential', timeoutMs: 3000 })
function catalog(pricing: unknown = { prompt: '0', completion: '0' }) {
  return new Response(JSON.stringify({ data: [model, reviewer].map(id => ({ id, pricing })) }))
}

test.each([
  { model: 'gpt-6-astra' }, { model: 'test/planner' }, { url: 'http://localhost:4000/v1' },
  { url: 'https://openrouter.ai.attacker.test/api/v1' }, { url: `${FREE_MODEL_URL}?model=paid` },
])('unverified model/endpoint sends no network request: %j', async change => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
  const spawn = vi.spyOn(proc, 'runProcess')
  const result = await callAgent({ ...options(), transport: 'cli', ...change }, 'Plan')
  expect(result.error).toContain('free-policy')
  expect(fetch).not.toHaveBeenCalled(); expect(spawn).not.toHaveBeenCalled()
})

test.each([undefined, { prompt: '0' }, { prompt: '0', completion: '0.01' }, { prompt: '', completion: '0' },
  { prompt: '0', completion: '0', request: '0.01' }, { prompt: '0', completion: '0', image: null }])('missing/paid price blocks POST: %j', async pricing => {
  const fetch = vi.fn(async () => new Response(JSON.stringify({ data: [{ id: model, pricing }] }))); vi.stubGlobal('fetch', fetch)
  expect((await callAgent(options(), 'Plan')).error).toContain('pricing')
  expect(fetch.mock.calls).toHaveLength(1)
})

test('CLI policy and direct structured callers use the verified text-only free endpoint with no paid fallback', async () => {
  const opts = options(), spawn = vi.spyOn(proc, 'runProcess')
  const fetch = vi.fn(async (url, init) => {
    if (url === FREE_MODEL_CATALOG) return catalog()
    const body = JSON.parse(String(init?.body))
    expect(body).toMatchObject({ model, provider: { allow_fallbacks: false, max_price: { prompt: 0, completion: 0 } } })
    expect(body).not.toHaveProperty('tools'); expect(body).not.toHaveProperty('models'); expect(init?.redirect).toBe('error')
    return new Response(JSON.stringify({ model: 'test/planner', choices: [{ message: { content: '{"ok":true}' } }], usage: { total_tokens: 9, cost: 0 } }))
  }) as typeof globalThis.fetch
  vi.stubGlobal('fetch', fetch)
  expect(await callAgent({ ...opts, transport: 'cli' }, 'Plan')).toMatchObject({ actualModel: 'test/planner', totalTokens: 9 })
  expect(await codexJson({ ...opts, effort: 'low' }, z.object({ ok: z.boolean() }), 'Research')).toEqual({ ok: true })
  expect(spawn).not.toHaveBeenCalled()
  const evidence = readFileSync(join(opts.dataDir, 'free-model-calls.jsonl'), 'utf8')
  expect(evidence).toContain('checkedAt'); expect(evidence).toContain('actualModel'); expect(evidence).not.toContain(opts.apiKey)
})

test('provider reset persists across callers; Reviewer cannot turn a quota error into approval', async () => {
  const opts = options(), future = Date.now() + 60_000
  const fetch = vi.fn(async (url) => url === FREE_MODEL_CATALOG ? catalog() : new Response('', { status: 429, headers: { 'retry-after': new Date(future).toUTCString() } }))
  vi.stubGlobal('fetch', fetch)
  const outcome = await runReviewGate(args => reviewDiff(opts, args.diff, args.taskText), { diff: 'diff', taskText: 'task' })
  expect(outcome).toMatchObject({ kind: 'skip', retryAt: Math.floor(future / 1000) * 1000 })
  expect((await callAgent({ ...opts, model: `openrouter/${opts.model}` }, 'Do not retry yet')).error).toContain('waiting')
  expect(fetch).toHaveBeenCalledTimes(2)
  expect(retryAt(new Headers({ 'retry-after': '4' }), 1000)).toBe(5000)
})

test('actual response identity must match the requested free model', async () => {
  vi.stubGlobal('fetch', vi.fn(async url => url === FREE_MODEL_CATALOG ? catalog() : new Response(JSON.stringify({ model: 'other/paid', choices: [{ message: { content: 'REVIEW: PASS' } }] }))))
  expect((await callAgent(options(), 'Review')).error).toContain('identity mismatch')
})

test('a concurrent quota response cannot clear a cost quarantine, including through model aliases', async () => {
  const opts = options(), reset = Date.now() + 60_000
  let finishQuota!: () => void, startedQuota!: () => void
  const quotaStarted = new Promise<void>(resolve => { startedQuota = resolve })
  const quotaWait = new Promise<void>(resolve => { finishQuota = resolve })
  const fetch = vi.fn(async (url, init) => {
    if (url === FREE_MODEL_CATALOG) return catalog()
    if (JSON.parse(String(init?.body)).messages[0].content === 'Quota') {
      startedQuota(); await quotaWait
      return new Response('', { status: 429, headers: { 'retry-after': '60' } })
    }
    return new Response(JSON.stringify({ model, choices: [{ message: { content: 'PASS' } }], usage: { cost: 0.01 } }))
  }) as typeof globalThis.fetch
  vi.stubGlobal('fetch', fetch)
  const quota = callAgent(opts, 'Quota'); await quotaStarted
  expect((await callAgent(opts, 'Cost mismatch')).error).toContain('nonzero cost')
  finishQuota(); await quota
  vi.spyOn(Date, 'now').mockReturnValue(reset + 60_000)
  expect((await callAgent({ ...opts, model: `openrouter/${opts.model}` }, 'Still blocked')).error).toContain('quarantined')
  expect(fetch).toHaveBeenCalledTimes(4)
})

test('transport timeout persists a cooldown without leaking the exception payload', async () => {
  const opts = options(), secretDetail = 'private provider payload'
  const fetch = vi.fn(async url => { if (url === FREE_MODEL_CATALOG) return catalog(); throw Object.assign(new Error(secretDetail), { name: 'TimeoutError' }) })
  vi.stubGlobal('fetch', fetch)
  expect((await callAgent(opts, 'Plan')).error).toContain('TimeoutError')
  expect((await callAgent(opts, 'Retry')).error).toContain('waiting')
  expect(fetch).toHaveBeenCalledTimes(2)
  expect(readFileSync(join(opts.dataDir, 'free-model-calls.jsonl'), 'utf8')).not.toContain(secretDetail)
})

test.each([{ evidenceFiles: undefined }, { evidenceFiles: ['evidence.md'] }])('quality evaluation quota waits instead of consuming no-progress budget: %j', async ({ evidenceFiles }) => {
  const opts = options(), backlogFile = join(opts.dataDir, 'BACKLOG.md'); writeFileSync(backlogFile, '')
  let available = false
  const fetch = vi.fn(async url => url === FREE_MODEL_CATALOG ? catalog() : available
    ? new Response(JSON.stringify({ model, choices: [{ message: { content: `${evidenceFiles ? 'SCORE: 10\n' : ''}ACHIEVED` } }] }))
    : new Response('', { status: 429, headers: { 'retry-after': '60' } }))
  vi.stubGlobal('fetch', fetch)
  const cfg = ConfigSchema.parse({ engine: 'mock', projectPath: opts.dataDir, dataDir: opts.dataDir, backlogFile, tierMode: 'free-only' })
  const goal = { objective: 'Quality goal', noProgressLimit: 1, evidenceFiles }, worker = vi.fn(async () => 'idle' as const)
  const run = () => runGoalSession({ goalId: 'quality', goal, cwd: opts.dataDir, isAlive: () => true,
    kernelDeps: { cfg, store: new BacklogStore(backlogFile), events: new EventLog(opts.dataDir) } as never,
    planFn: async () => ({ kind: 'achieved' }), runOnceFn: worker,
    evalFn: cwd => evaluate({ llm: opts, readEvidence: () => 'Evidence' }, goal, cwd) })
  expect(await run()).toMatchObject({ kind: 'stuck', retryable: true, rounds: 1 })
  const delay = reviewRetryDelay(cfg); expect(delay).toBeGreaterThan(0); expect(delay).toBeLessThanOrEqual(60_000)
  expect(await run()).toMatchObject({ kind: 'stuck', retryable: true }); expect(fetch).toHaveBeenCalledTimes(2)
  available = true; vi.spyOn(Date, 'now').mockReturnValue(Date.now() + delay + 1000)
  expect(await run()).toMatchObject({ kind: 'achieved' }); expect(worker).not.toHaveBeenCalled()
})

test('free worker isolates hidden models/credentials and checks fresh prices even with a cached PONG', async () => {
  const opts = options(); let price = '0', reportCost = true
  vi.stubGlobal('fetch', vi.fn(async () => catalog({ prompt: price, completion: '0' })))
  const spawn = vi.spyOn(proc, 'runProcess').mockImplementation(async args => {
    const profile = JSON.parse(args.env!.OPENCODE_CONFIG_CONTENT!)
    expect(args.replaceEnv).toBe(true); expect(args.env!.OPENCODE_DISABLE_PROJECT_CONFIG).toBe('1')
    expect(profile).toMatchObject({ model: `openrouter/${model}`, small_model: `openrouter/${model}`, enabled_providers: ['openrouter'],
      permission: { task: 'deny' }, provider: { openrouter: { whitelist: [model], options: { baseURL: FREE_MODEL_URL } } } })
    expect(args.args).toContain('--pure'); expect(args.args).toContain('--title')
    expect(args.env).not.toHaveProperty('OPENAI_API_KEY')
    return { stdout: '{"type":"text","part":{"text":"PONG"}}\n' + JSON.stringify({ type: 'step_finish', part: reportCost ? { cost: 0 } : {} }), stderr: '', exitCode: 0, timedOut: false, durationMs: 1 }
  })
  const engine = new OpencodeEngine({ model: `openrouter/${model}`, freeOnly: true, policyDataDir: opts.dataDir, profileDir: join(opts.dataDir, 'profile'),
    env: { OPENROUTER_API_KEY: opts.apiKey }, cache: new PreflightCache(join(opts.dataDir, 'cache.json')) })
  expect((await engine.preflight()).ok).toBe(true)
  price = '1'; expect((await engine.preflight()).ok).toBe(false)
  expect(spawn).toHaveBeenCalledTimes(1)
  price = '0'; reportCost = false; engine.invalidatePreflight()
  expect((await engine.preflight()).ok).toBe(true)
  const receipts = readFileSync(join(opts.dataDir, 'free-model-calls.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line)).filter(row => row.phase === 'cli-finished')
  expect(receipts[0].reportedCost).toBe(0); expect(receipts[1]).not.toHaveProperty('reportedCost')
})

test('source project policy reaches report research and structured repair review', async () => {
  const opts = options(), sourceConfig = join(opts.dataDir, 'source.json')
  const source = ConfigSchema.parse({ engine: 'mock', projectPath: '.', backlogFile: 'BACKLOG.md', dataDir: opts.dataDir,
    tierMode: 'free-only', llmTransport: 'cli', judgeUrl: FREE_MODEL_URL, judgeModel: model, auditModel: reviewer, judgeApiKey: opts.apiKey })
  expect(llmFromConfig(source)).toMatchObject({ tierMode: 'free-only' })
  writeFileSync(sourceConfig, JSON.stringify(source))
  const models = researchModels({ research: { model: 'paid/fallback' } } as never, { sourceConfig } as never)
  expect(models).toMatchObject({ model, reviewer, policy: { tierMode: 'free-only', url: FREE_MODEL_URL } })
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
  await expect(reviewRepair({ ...opts, model: 'paid/model', effort: 'low' }, { diff: 'diff', taskText: 'repair' })).rejects.toThrow('free-policy')
  expect(fetch).not.toHaveBeenCalled()
})

test.each(['codex', 'freebuff', 'devin', 'agy', 'grok', 'copilot', 'claude-cli', 'qwen'])('free-only blocks uncontrolled %s before preflight', adapter => {
  const opts = options(), cfg = ConfigSchema.parse({ projectPath: '.', backlogFile: 'BACKLOG.md', dataDir: opts.dataDir, tierMode: 'free-only',
    defaultEngine: 'oc-free-alias', engines: { 'oc-free-alias': { adapter, ...(adapter === 'freebuff' ? { timeoutMs: 60_000 } : { model: 'free' }), subscription: true, costPerRunUsd: 0 } } })
  expect(() => makeEngineRegistry(cfg).resolve('oc-free-alias')).toThrow('free-policy')
})

test('free-only lesson publication requires independent free review even over HTTP', async () => {
  const opts = options(), add = vi.fn(() => true)
  vi.stubGlobal('fetch', vi.fn(async (url, init) => url === FREE_MODEL_CATALOG ? catalog() : new Response(JSON.stringify({
    model: JSON.parse(String(init?.body)).model, choices: [{ message: { content: JSON.parse(String(init?.body)).model === model ? 'Check supplied evidence.' : 'REJECT' } }],
  }))))
  const deps = { llm: opts, reviewLlm: { ...opts, model: reviewer }, lessons: { add }, db: { lastFailureFor: () => null }, backlog: {} } as never
  await reflectOnFailure(deps, { kind: 'blocked', taskId: 'task', taskText: 'task', reason: 'verification-infra' })
  expect(add).not.toHaveBeenCalled()
})

// Issue #14 回歸：釘死 free-only admission 的接受/拒絕組合——只放行明確 openrouter/<provider>/<model>:free
// 且不允許呼叫端自帶 baseArgs；其餘 namespace/無 :free 後綴/缺 model 一律在建構期 fail-closed。
test.each([
  { name: 'admitted explicit free model', model: `openrouter/${model}`, ok: true },
  { name: 'non-free suffix', model: 'openrouter/test/planner', ok: false },
  { name: 'wrong provider namespace (opencode zen)', model: 'opencode/deepseek-v4-flash-free', ok: false },
  { name: 'wrong provider namespace (kilo)', model: 'kilo/kilo-auto/free', ok: false },
  { name: 'wrong provider namespace (nvidia)', model: 'nvidia/z-ai/glm-5.2', ok: false },
  { name: 'missing model falls back to non-admitted default', model: undefined, ok: false },
  { name: 'caller-controlled baseArgs rejected', model: `openrouter/${model}`, baseArgs: ['run', '-m', 'x'], ok: false },
])('free-only opencode admission: $name', ({ model: m, baseArgs, ok }) => {
  const opts = options()
  const make = () => new OpencodeEngine({ model: m, baseArgs, freeOnly: true, policyDataDir: opts.dataDir,
    profileDir: join(opts.dataDir, 'profile'), cache: new PreflightCache(join(opts.dataDir, 'cache.json')) })
  if (ok) expect(make).not.toThrow()
  else expect(make).toThrow('free-policy')
})

test('engine resolve failure names tag/adapter/model without secret material', () => {
  const opts = options()
  const cfg = ConfigSchema.parse({ projectPath: '.', backlogFile: 'BACKLOG.md', dataDir: opts.dataDir, tierMode: 'free-only',
    defaultEngine: 'oc-bad', engines: { 'oc-bad': { adapter: 'opencode', model: 'opencode/zen-free-thing', subscription: true, costPerRunUsd: 0 } } })
  try {
    makeEngineRegistry(cfg).resolve('oc-bad')
    expect.unreachable('resolve should have thrown')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    expect(msg).toContain('oc-bad'); expect(msg).toContain('opencode'); expect(msg).toContain('opencode/zen-free-thing'); expect(msg).toContain('free-policy')
  }
})
