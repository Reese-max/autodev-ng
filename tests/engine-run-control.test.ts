import { afterEach, expect, test, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PreflightCache } from '../src/preflight.js'
import { EngineConfigSchema, type Engine, type Task } from '../src/types.js'
import { ClaudeCliEngine } from '../src/engines/claude-cli.js'
import { CodexEngine } from '../src/engines/codex.js'
import { AgyEngine } from '../src/engines/agy.js'
import { CopilotEngine } from '../src/engines/copilot.js'
import { QwenEngine } from '../src/engines/qwen.js'
import { GrokEngine } from '../src/engines/grok.js'
import { OpencodeEngine } from '../src/engines/opencode.js'
import { DevinEngine } from '../src/engines/devin.js'
import { HerdrEngine } from '../src/engines/herdr.js'
import { FreebuffEngine } from '../src/engines/freebuff.js'
import { runProcess } from '../src/engines/proc.js'
import type { RunEvent } from '../src/engines/run-control.js'
import { createExecutionObservation, readExecutions } from '../src/engines/execution-observation.js'

const fixtures = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')
const roots: string[] = []
afterEach(() => { vi.unstubAllEnvs(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })
const adapters = ['claude-cli', 'codex', 'agy', 'copilot', 'qwen', 'grok', 'opencode', 'devin', 'herdr', 'freebuff'] as const
test('control contract covers every real schema adapter', () => {
  expect([...adapters].sort()).toEqual(EngineConfigSchema.shape.adapter.options.filter(a => a !== 'mock').sort())
})
test.each(adapters.flatMap(adapter => (['spawn', 'exit'] as const).map(at => [adapter, at] as const)))('%s cancellation at %s keeps an uncertain result out of completion', async (adapter, at) => {
  const root = mkdtempSync(join(tmpdir(), 'adng-control-')); roots.push(root)
  const fake = join(root, 'hang.cjs'); writeFileSync(fake, at === 'spawn' ? 'process.stdin.resume(); setInterval(() => {}, 1000)\n' : 'process.stdin.resume()\n')
  const getCommitHash = vi.fn(() => 'abc123'), commitChanges = vi.fn(() => 'forbidden')
  const opts = { command: process.execPath, baseArgs: [fake], cache: new PreflightCache(join(root, 'cache.json')), timeoutMs: 2000, getCommitHash }
  let engine: Engine
  switch (adapter) {
    case 'claude-cli': engine = new ClaudeCliEngine(opts); break
    case 'codex': engine = new CodexEngine({ ...opts, homeDir: join(root, 'codex'), useUserLogin: false, commitChanges }); break
    case 'agy':
      vi.stubEnv('FAKE_MODE', at === 'spawn' ? 'hang' : 'ok'); vi.stubEnv('FAKE_WSL_LOG', '')
      engine = new AgyEngine({ ...opts, argvPrefix: [join(fixtures, 'fake-wsl.mjs')] }); break
    case 'copilot': engine = new CopilotEngine(opts); break
    case 'qwen': engine = new QwenEngine(opts); break
    case 'grok': engine = new GrokEngine(opts); break
    case 'opencode': engine = new OpencodeEngine({ ...opts, profileDir: join(root, 'opencode') }); break
    case 'devin': engine = new DevinEngine({ ...opts, profileDir: join(root, 'devin') }); break
    case 'herdr':
      writeFileSync(join(root, '.adng-worktree'), 'fixture')
      engine = new HerdrEngine({ ...opts, commitChanges, runProcess: options => {
        expect(options.args).toContain('-RequestId')
        return runProcess({ ...options, command: process.execPath, args: [fake] })
      } }); break
    case 'freebuff': engine = new FreebuffEngine({ ...opts, baseArgs: [join(fixtures, 'fake-freebuff.mjs'), at === 'spawn' ? 'hang' : 'ok'], lockDir: join(root, 'session.lock') }); break
  }
  const controller = new AbortController(), events: RunEvent[] = []
  const task: Task = { id: 'ab12cd34', text: 'cancel fixture', status: 'open', line: 0 }
  const job = { task, projectPath: root, executionId: 'control-test', control: {
    signal: controller.signal, onEvent: event => { events.push(event); if (event.type === at) controller.abort() },
  } } satisfies import('../src/types.js').Job
  const observation = createExecutionObservation({ dataDir: root, adapter, job })
  const result = await engine.run({ ...job, control: observation.control })
  observation.finish('failed')
  expect(result).toMatchObject({ ok: false, cancelled: true, recoveryRequired: true, costUnknown: true })
  if (at === 'spawn') expect(events.map(event => event.type)).toContain('cancel-requested')
  expect(events.at(-1)).toMatchObject({ type: 'exit', reason: at === 'spawn' ? 'cancelled' : 'exit' })
  expect(getCommitHash).toHaveBeenCalledTimes(1)
  expect(commitChanges).not.toHaveBeenCalled()
  expect(readExecutions(root).records).toMatchObject([{ adapter, phase: 'unknown', outcome: 'unconfirmed' }])
}, 20_000)
