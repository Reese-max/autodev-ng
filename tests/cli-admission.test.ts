import { afterEach, expect, test, vi } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import * as rpc from '../src/engines/cli-rpc.js'
import * as admission from '../src/engines/cli-admission.js'
import * as proc from '../src/engines/proc.js'
import { cliDiagnostic, cliPreflightKey } from '../src/engines/cli-diagnostics.js'
import { ClaudeCliEngine } from '../src/engines/claude-cli.js'
import { CodexEngine } from '../src/engines/codex.js'
import { CopilotEngine } from '../src/engines/copilot.js'
import { GrokEngine } from '../src/engines/grok.js'
import { QwenEngine } from '../src/engines/qwen.js'
import { DevinEngine } from '../src/engines/devin.js'
import { OpencodeEngine } from '../src/engines/opencode.js'
import { AgyEngine } from '../src/engines/agy.js'
import { HerdrEngine } from '../src/engines/herdr.js'
import { PreflightCache } from '../src/preflight.js'
import { createExecutionObservation, executionFile } from '../src/engines/execution-observation.js'
import { codexJson } from '../src/engines/cli-json.js'
import { z } from 'zod'

const roots: string[] = []
afterEach(() => { vi.restoreAllMocks(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })
const temp = () => { const root = mkdtempSync(join(tmpdir(), 'adng-cli-evidence-')); roots.push(root); return root }
const reply = (stdout: string, exitCode = 0, stderr = ''): proc.ProcResult => ({ stdout, stderr, exitCode, timedOut: false, durationMs: 1 })
const quotaError = JSON.stringify({ type: 'error', code: 'insufficient_quota', message: 'QUOTA_DIAGNOSTIC', resetsAt: 1900000000 })

test('structured error survives noisy stdout/stderr and credentials do not enter the 2KB receipt', () => {
  const secret = 'synthetic-private-value'
  const result = cliDiagnostic({ stdout: quotaError + '\n' + 'noise'.repeat(2000), stderr: 'Authorization: Bearer ' + secret + '\n' + 'tail'.repeat(2000) }, { API_KEY: secret })
  expect(result).toContain('insufficient_quota')
  expect(result).toContain('QUOTA_DIAGNOSTIC')
  expect(result).toContain('1900000000')
  expect(result).toContain('[stdout]')
  expect(result).toContain('[stderr]')
  expect(result.length).toBeLessThanOrEqual(2000)
  expect(cliDiagnostic({ stdout: JSON.stringify({ type: 'error', message: secret, api_key: secret }), stderr: 'Bearer ' + secret }, { API_KEY: secret })).not.toContain(secret)
})

test('PONG keys bind model, endpoint and auth; never expose the secret', () => {
  const key = (model = 'one', endpoint = 'http://127.0.0.1:9/v1', token = 'synthetic-secret') =>
    cliPreflightKey('fixture', ['--model', model], { OPENAI_BASE_URL: endpoint, OPENAI_API_KEY: token })
  expect(new Set([key(), key('two'), key('one', 'http://127.0.0.1:10/v1'), key('one', undefined, 'other-secret')]).size).toBe(4)
  expect(key()).not.toContain('synthetic-secret')
  const root = temp(), identity = () => cliPreflightKey('fixture', [], { CODEX_HOME: root }, 'codex'), before = identity()
  writeFileSync(join(root, 'auth.json'), '{"fixture":"changed identity"}')
  expect(identity()).not.toBe(before)
})

test('native quota: unknown is not zero, independent Codex buckets, premium 0x exemption and paid overage blocked', () => {
  expect(admission.codexQuota({ rateLimits: { primary: null } }).state).toBe('unknown')
  expect(admission.codexQuota({ rateLimitsByLimitId: { codex: { primary: { usedPercent: 25 } }, other: { primary: { usedPercent: 100 } } } }).state).toBe('available')
  expect(admission.codexQuota({ rateLimits: { primary: { usedPercent: 100 }, credits: { hasCredits: true } } }).state).toBe('exhausted')
  const snapshots = { quotaSnapshots: { chat: { isUnlimitedEntitlement: true }, premium_interactions: { remainingPercentage: 0, usageAllowedWithExhaustedQuota: true } } }
  expect(admission.copilotQuota(snapshots).state).toBe('exhausted')
  expect(admission.copilotQuota(snapshots, { billing: { multiplier: 0 } }).state).toBe('available')
  expect(admission.copilotQuota({ quotaSnapshots: { chat: { remainingPercentage: null } } }).state).toBe('unknown')
  expect(admission.claudeQuota(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { status: 'allowed_warning', isUsingOverage: true } }))?.state).toBe('exhausted')
})

test.each([false, true])('native RPC handles fragmented Unicode and closes its own child (framed=%s)', async framed => {
  const result = await rpc.withCliRpc({ command: process.execPath, args: [resolve('tests/fixtures/fake-cli-rpc.mjs'), ...(framed ? ['--framed'] : [])], framed, timeoutMs: 2000 },
    request => request('model/list')) as { text: string; pid: number }
  expect(result.text).toBe('測試')
  expect(() => process.kill(result.pid, 0)).toThrow()
})

test.each(['hang', 'bad-length'])('native metadata %s is bounded and does not hang preflight', async mode => {
  await expect(rpc.withCliRpc({ command: process.execPath, args: [resolve('tests/fixtures/fake-cli-rpc.mjs'), '--framed'],
    framed: true, env: { RPC_TEST_MODE: mode }, timeoutMs: 150 }, request => request('models.list'))).rejects.toThrow(mode === 'hang' ? 'timeout' : 'frame')
})

test('native catalog pagination uses metadata methods only; incomplete catalogs cannot reject a model', async () => {
  const calls: string[] = []
  let repeat = false
  vi.spyOn(rpc, 'withCliRpc').mockImplementation(async (_opts, read) => read(async (method, params) => {
    calls.push(method)
    if (method === 'initialize') return {}
    if (method === 'account/rateLimits/read') return { rateLimits: { primary: { usedPercent: 50 } } }
    return (params as { cursor?: string }).cursor
      ? { data: [{ id: 'requested' }], nextCursor: repeat ? 'page2' : null } : { data: [{ id: 'first' }], nextCursor: 'page2' }
  }, () => {}))
  const result = await admission.nativeAdmission('codex', { command: 'fixture', model: 'requested' })
  expect(result.model.state).toBe('listed')
  expect(calls).toEqual(['initialize', 'model/list', 'model/list', 'account/rateLimits/read'])
  repeat = true
  expect((await admission.nativeAdmission('codex', { command: 'fixture', model: 'requested' })).model.state).toBe('unknown')
})

test.each(['codex', 'copilot'] as const)('%s refreshes native quota before a cached PONG; unavailable models never invoke inference', async provider => {
  const root = temp(), cache = new PreflightCache(join(root, 'cache.json'))
  const info = admission.unknownAdmission(provider, 'fixture-model'); info.quota.state = 'available'; info.model.state = 'listed'
  const native = vi.spyOn(admission, 'nativeAdmission').mockResolvedValue(info)
  const run = vi.spyOn(proc, 'runProcess').mockResolvedValue(reply(provider === 'codex'
    ? '{"type":"item.completed","item":{"type":"agent_message","text":"PONG"}}\n{"type":"turn.completed"}'
    : '{"type":"assistant.message","data":{"content":"PONG"}}\n{"type":"result","exitCode":0}'))
  const engine = provider === 'codex' ? new CodexEngine({ cache, homeDir: root, model: 'fixture-model' }) : new CopilotEngine({ cache, model: 'fixture-model' })
  expect((await engine.preflight()).ok).toBe(true)
  native.mockResolvedValue({ ...info, quota: { state: 'exhausted', detail: 'fixture' } })
  expect((await engine.preflight()).ok).toBe(false)
  native.mockResolvedValue({ ...info, model: { state: 'unavailable', detail: 'fixture' } })
  expect((await engine.preflight()).ok).toBe(false)
  expect(run).toHaveBeenCalledTimes(1)
})

test.each(['claude', 'codex', 'copilot', 'grok', 'qwen', 'devin', 'opencode', 'agy', 'herdr'])('%s preserves stdout-only provider errors in the actual adapter', async provider => {
  const root = temp(), cache = new PreflightCache(join(root, 'cache.json'))
  const options = { command: 'fixture', cache, profileDir: root, homeDir: root, getCommitHash: () => 'before' }
  const runner = vi.spyOn(proc, 'runProcess').mockResolvedValue(reply(quotaError, 1, 'native stderr'))
  writeFileSync(join(root, '.adng-worktree'), 'fixture')
  const engines = { claude: () => new ClaudeCliEngine(options), codex: () => new CodexEngine(options), copilot: () => new CopilotEngine(options),
    grok: () => new GrokEngine(options), qwen: () => new QwenEngine(options), devin: () => new DevinEngine(options),
    opencode: () => new OpencodeEngine(options), agy: () => new AgyEngine(options), herdr: () => new HerdrEngine({ ...options, runProcess: runner }) }
  const result = await engines[provider as keyof typeof engines]().run({ projectPath: root, task: { id: 'ab12cd34', text: 'fixture', line: 0, status: 'open' } })
  expect(result.ok).toBe(false)
  expect(result.output).toContain('QUOTA_DIAGNOSTIC')
  expect(result.failureReason).toContain('insufficient_quota')
})

test('Claude rejects a PONG in an intermediate message or a rejected quota event', async () => {
  const root = temp()
  vi.spyOn(proc, 'runProcess').mockResolvedValue(reply('{"type":"assistant","message":{"content":[{"type":"text","text":"PONG"}]}}'))
  expect((await new ClaudeCliEngine({ cache: new PreflightCache(join(root, 'first.json')) }).preflight()).ok).toBe(false)
  vi.mocked(proc.runProcess).mockResolvedValue(reply('{"type":"result","result":"PONG"}\n{"type":"rate_limit_event","rate_limit_info":{"status":"rejected","resetsAt":1900000000}}'))
  expect(await new ClaudeCliEngine({ cache: new PreflightCache(join(root, 'second.json')) }).preflight()).toMatchObject({ ok: false, admission: { quota: { state: 'exhausted' } } })
})

test('Devin uses the account catalog including aliases, and rejects a retired model before PONG', async () => {
  const root = temp(), run = vi.spyOn(proc, 'runProcess').mockResolvedValue(reply(JSON.stringify({ families: [
    { slug: 'current-model', aliases: ['short-alias'], variants: [{ model_uid: 'current-model-high' }] },
  ] })))
  expect((await admission.nativeAdmission('devin', { command: 'fixture', model: 'short-alias' })).model.state).toBe('listed')
  run.mockClear()
  expect(await new DevinEngine({ command: 'fixture', model: 'retired', profileDir: root, cache: new PreflightCache(join(root, 'cache')) }).preflight())
    .toMatchObject({ ok: false, admission: { model: { state: 'unavailable' }, quota: { state: 'unknown' } } })
  expect(run).toHaveBeenCalledTimes(1)
  expect(run.mock.calls[0]![0].args).toEqual(['models', 'list', '--format', 'json'])
})

test('shared planning/review Codex helper blocks quota before inference and preserves turn.failed diagnostics', async () => {
  const root = temp(), cfg = { dataDir: root, model: 'fixture', effort: 'low', timeoutMs: 1000 }, schema = z.object({ text: z.string() })
  const info = admission.unknownAdmission('codex', cfg.model)
  const native = vi.spyOn(admission, 'nativeAdmission').mockResolvedValue({ ...info, quota: { state: 'exhausted', detail: 'fixture' } })
  const run = vi.spyOn(proc, 'runProcess').mockResolvedValue(reply('{"type":"turn.failed","error":{"code":"insufficient_quota","message":"QUOTA_DIAGNOSTIC"}}', 1))
  await expect(codexJson(cfg, schema, 'fixture')).rejects.toThrow('admission failed')
  expect(run).not.toHaveBeenCalled()
  native.mockResolvedValue(info)
  await expect(codexJson(cfg, schema, 'fixture')).rejects.toThrow('QUOTA_DIAGNOSTIC')
  expect(run).toHaveBeenCalledTimes(1)
})

test.each(['claude', 'qwen', 'grok'] as const)('%s tool progress arrives before the final response, without persisting tool contents', async provider => {
  const root = temp(), release = join(root, 'release'), cache = new PreflightCache(join(root, 'cache.json'))
  let markProgress!: () => void, settled = false, count = 0
  const progress = new Promise<void>(resolve => { markProgress = resolve })
  const job = { projectPath: root, executionId: 'stream-fixture', task: { id: 'ab12cd34', text: 'fixture', line: 0, status: 'open' as const } }
  const observer = createExecutionObservation({ dataDir: root, adapter: provider, job: { ...job, control: { onEvent(event) {
    if (event.type === 'output' && /tool_result|"status":"completed"/.test(event.text)) markProgress()
  } } } })
  const opts = { command: process.execPath, baseArgs: [resolve('tests/fixtures/fake-cli-stream.mjs'), provider, release],
    timeoutMs: 3000, cache, getCommitHash: () => count++ === 0 ? 'before' : 'after' }
  const engine = provider === 'claude' ? new ClaudeCliEngine(opts) : provider === 'qwen' ? new QwenEngine(opts) : new GrokEngine(opts)
  const running = engine.run({ ...job, control: observer.control }).then(result => { settled = true; return result })
  await progress
  try {
    expect(settled).toBe(false)
    expect(observer.snapshot().lastProgressAt).toBeTypeOf('number')
    expect(readFileSync(executionFile(root, job.executionId), 'utf8')).not.toContain('private-tool-content')
  } finally { writeFileSync(release, 'release'); const result = await running; observer.finish(result.ok ? 'completed' : 'failed') }
  expect((await running).ok).toBe(true)
})
