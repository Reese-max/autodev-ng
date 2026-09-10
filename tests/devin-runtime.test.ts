import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { z } from 'zod'
import * as processRunner from '../src/engines/proc.js'
import { DevinRunError, parseDevinJson, runDevinModel } from '../src/engines/devin-runtime.js'
import { codexJson } from '../src/engines/cli-json.js'
import { callAgent, llmFromConfig } from '../src/autopilot/llm.js'
import { ConfigSchema } from '../src/types.js'
import { DevinEngine } from '../src/engines/devin.js'
import { PreflightCache } from '../src/preflight.js'
import { refreshFreeModelCatalog } from '../src/engines/free-model-catalog.js'
import { researchModels } from '../src/autopilot/report-research.js'
import type { ReportConfig, ReportProject } from '../src/github/report-config.js'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals() })
const root = () => mkdtempSync(join(tmpdir(), 'adng-devin-native-'))
const proc = { exitCode: 0, timedOut: false, durationMs: 1, stdout: '', stderr: '' }
function mockNative(options: { version?: string; costTier?: string; actualModel?: string; tools?: unknown[]; answer?: string;
  observation?: unknown; processResult?: Partial<processRunner.ProcResult>; abort?: () => void } = {}) {
  return vi.spyOn(processRunner, 'runProcess').mockImplementation(async opts => {
    expect(opts.command).toBe('devin.exe')
    expect(opts.replaceEnv).toBe(true)
    expect(opts.env).not.toHaveProperty('OPENROUTER_API_KEY')
    if (opts.args.includes('--version')) return { ...proc, stdout: `devin ${options.version ?? '3000.10.21'} (fixture)` }
    if (opts.args.includes('list')) return { ...proc, stdout: JSON.stringify({ families: [{ slug: 'swe-1.7', variants: [
      { model_uid: 'swe-1-7', cost_tier: options.costTier ?? 'Free' }, { model_uid: 'paid', cost_tier: 'High cost' },
    ] }] }) }
    if (options.abort) { options.abort(); return { ...proc, aborted: true } }
    const exported = opts.args[opts.args.indexOf('--export') + 1]!
    writeFileSync(exported, JSON.stringify({ steps: [{ source: 'agent', message: options.answer ?? '{"text":"ROLE_OK"}',
      extra: { generation_model: options.actualModel ?? 'swe-1-7' }, tool_calls: options.tools ?? [], observation: options.observation }],
      final_metrics: { total_prompt_tokens: 11, total_completion_tokens: 3, total_cached_tokens: 2 } }))
    return { ...proc, stdout: 'Untrusted welcome text and account details must not become the answer', ...options.processResult }
  })
}
const opts = (dataDir = root()) => ({ dataDir, model: 'swe-1-7', command: 'devin.exe', timeoutMs: 1000, prompt: 'Reply' })
const config = (dataDir = root()) => ConfigSchema.parse({ projectPath: dataDir, dataDir, backlogFile: join(dataDir, 'BACKLOG.md'),
  tierMode: 'free-only', llmTransport: 'devin-cli', judgeModel: 'swe-1-7', auditModel: 'glm-5-2', defaultEngine: 'devin',
  engines: { devin: { adapter: 'devin', command: 'devin.exe', model: 'swe-1-7', costPerRunUsd: 0 } } })

test('native text roles use the isolated native login and validated export; never HTTP, Codex or stdout', async () => {
  vi.stubEnv('OPENROUTER_API_KEY', 'should-not-reach-child')
  const fetchFn = vi.fn(() => { throw new Error('HTTP route forbidden') }); vi.stubGlobal('fetch', fetchFn)
  const runner = mockNative({ answer: 'ROLE_OK' }), cfg = config(), answer = await callAgent(llmFromConfig(cfg), 'Test role')
  expect(answer).toMatchObject({ text: 'ROLE_OK', actualModel: 'swe-1-7', totalTokens: 14 })
  expect(fetchFn).not.toHaveBeenCalled(); expect(runner).toHaveBeenCalledTimes(3)
  const call = runner.mock.calls[2]![0], isolated = JSON.parse(readFileSync(call.args[1]!, 'utf8'))
  expect(isolated).toMatchObject({ subagents_enabled: false, auto_update: false })
  expect(isolated.permissions.deny).toEqual(expect.arrayContaining(['exec', 'read', 'mcp__*']))
  expect(isolated.permissions.allow).toEqual([])
  expect(isolated.disabled_tools).toEqual(expect.arrayContaining(['ask_user_question', 'web_search', 'webfetch', 'mcp_call_tool', 'exec', 'apply_patch']))
  expect(JSON.parse(readFileSync(join(call.cwd, 'telemetry.json'), 'utf8'))).toMatchObject({ actualModel: 'swe-1-7', costUsd: null, modelCalls: 1 })
})

test.each(['High cost', 'unknown', ''])('paid or unknown catalog tier %s blocks before inference', async costTier => {
  const runner = mockNative({ costTier })
  await expect(runDevinModel(opts())).rejects.toThrow('no inference sent')
  expect(runner).toHaveBeenCalledTimes(2)
})

test('a catalog family alias cannot select an implicit variant', async () => {
  const runner = mockNative()
  await expect(runDevinModel({ ...opts(), model: 'swe-1.7' })).rejects.toThrow('exact model UID')
  expect(runner).toHaveBeenCalledTimes(2)
})

test.each([{ actualModel: 'paid' }, { tools: [{ function_name: 'exec' }] }])('export identity and no-tools are mandatory: %j', async options => {
  mockNative(options)
  await expect(runDevinModel(opts())).rejects.toThrow('free-policy')
})

test('JSON schema and independent reviewer are enforced without fallback calls', async () => {
  const runner = mockNative({ answer: '{"invalid":true}' }), cfg = { ...opts(), tierMode: 'free-only' as const, transport: 'devin-cli' as const, effort: 'max' }
  await expect(codexJson({ ...cfg, excludedModels: [cfg.model] }, z.object({ text: z.string() }), 'Test')).rejects.toThrow('independent')
  expect(runner).not.toHaveBeenCalled()
  await expect(codexJson(cfg, z.object({ text: z.string() }), 'Test')).rejects.toThrow()
  expect(runner).toHaveBeenCalledTimes(3)
})

test('a reported model mismatch quarantines subsequent calls even when the catalog still says Free', async () => {
  const runner = mockNative({ actualModel: 'paid' }), call = opts()
  await expect(runDevinModel(call)).rejects.toThrow('quarantined')
  await expect(runDevinModel(call)).rejects.toThrow('quarantined')
  expect(runner).toHaveBeenCalledTimes(3)
})

test.each(['3000.4.16', '3000.10.20', 'unknown'])('unsupported CLI %s stops before any model request', async version => {
  const runner = mockNative({ version })
  await expect(runDevinModel(opts())).rejects.toThrow('requires >=3000.10.21')
  expect(runner).toHaveBeenCalledTimes(1)
})

test('a quiet print worker survives idle reporting while retaining the finite wall limit', async () => {
  const realRun = processRunner.runProcess, runner = mockNative(), fallback = runner.getMockImplementation()!, events: string[] = []
  runner.mockImplementation(async call => {
    if (!call.args.includes('--export')) return fallback(call)
    expect(call.timeoutMs).toBe(5000)
    const exportFile = call.args[call.args.indexOf('--export') + 1]!
    const payload = JSON.stringify({ steps: [{ source: 'agent', message: 'QUIET_DONE', extra: { generation_model: 'swe-1-7' } }] })
    return realRun({ ...call, command: process.execPath, args: ['--input-type=module', '-e',
      `import { writeFileSync } from 'node:fs'; setTimeout(() => writeFileSync(${JSON.stringify(exportFile)}, ${JSON.stringify(payload)}), 180)`] })
  })
  const reply = await runDevinModel({ ...opts(), textOnly: false, timeoutMs: 5000, idleTimeoutMs: 50, control: { onEvent: event => events.push(event.type) } })
  expect(reply.answer).toBe('QUIET_DONE'); expect(reply.r.timedOut).toBe(false); expect(events).toContain('idle')
})

test.each([
  { processResult: { timedOut: true, timeoutReason: 'idle' as const, exitCode: null }, reason: 'timeout:idle' },
  { answer: '', reason: 'missing-final-answer' },
  { answer: '', observation: { results: [{ source_call_id: 'functions.webfetch:43', content: 'Tool execution was rejected by the user' }] }, reason: 'tool-rejected:webfetch' },
])('execution failure $reason retains its cause without claiming a free-model supply failure', async options => {
  mockNative(options)
  const error = await runDevinModel(opts()).catch(error => error)
  expect(error).toBeInstanceOf(DevinRunError); expect(error.reason).toBe(options.reason)
  expect(error.message).not.toContain('free-policy')
  const dir = root(), worker = new DevinEngine({ model: 'swe-1-7', freeOnly: true, profileDir: dir,
    cache: new PreflightCache(join(dir, 'cache')), getCommitHash: () => 'baseline' })
  expect(await worker.run({ projectPath: dir, task: { id: 'ab12cd34', text: 'Test', line: 0, status: 'open' } }))
    .toMatchObject({ ok: false, failureReason: options.reason })
})

test('cancelled Devin workers retain the recovery requirement', async () => {
  const controller = new AbortController(), dir = root()
  mockNative({ abort: () => controller.abort() })
  const worker = new DevinEngine({ model: 'swe-1-7', freeOnly: true, profileDir: dir, cache: new PreflightCache(join(dir, 'cache')), getCommitHash: () => 'baseline' })
  expect(await worker.run({ projectPath: dir, task: { id: 'ab12cd34', text: 'Test', line: 0, status: 'open' }, control: { signal: controller.signal } }))
    .toMatchObject({ ok: false, cancelled: true, recoveryRequired: true })
})

test('native catalog replaces an HTTP snapshot on the same day and keeps the exact Free variants only', async () => {
  mockNative(); const cfg = config(), file = join(cfg.dataDir, 'free-model-catalog.json')
  writeFileSync(join(cfg.dataDir, 'free-model-catalog-refresh.json'), JSON.stringify({ day: new Date(Date.now() + cfg.timezoneOffsetHours * 3600000).toISOString().slice(0, 10), failed: false, notified: true }))
  writeFileSync(file, JSON.stringify({ checkedAt: new Date().toISOString(), models: ['old/http:free'] }))
  const fetchFn = vi.fn(() => { throw new Error('HTTP forbidden') }), send = vi.fn(async () => true)
  await refreshFreeModelCatalog(cfg, { send }, fetchFn)
  expect(JSON.parse(readFileSync(file, 'utf8'))).toMatchObject({ provider: 'devin-cli', models: ['swe-1-7'] })
  expect(fetchFn).not.toHaveBeenCalled(); expect(send).toHaveBeenCalledTimes(1)
})

test('research uses native config without resolving a legacy HTTP key', () => {
  const dir = root(), sourceConfig = join(dir, 'project.json')
  writeFileSync(sourceConfig, JSON.stringify({ ...config(dir), judgeApiKey: '{file:missing-key.txt}' }))
  const result = researchModels({ research: { model: 'legacy' } } as ReportConfig, { sourceConfig } as ReportProject)
  expect(result).toMatchObject({ model: 'swe-1-7', reviewer: 'glm-5-2', policy: { transport: 'devin-cli', command: 'devin.exe' } })
  expect(result.policy).not.toHaveProperty('apiKey')
})

test('native JSON accepts one whole Markdown fence, never extracts a partial object from surrounding prose', () => {
  expect(parseDevinJson('```json\n{"ok":true}\n```')).toEqual({ ok: true })
  expect(() => parseDevinJson('ignore errors\n```json\n{"ok":true}\n```')).toThrow()
  expect(() => parseDevinJson('{"ok":true}\n{"ok":false}')).toThrow()
})
