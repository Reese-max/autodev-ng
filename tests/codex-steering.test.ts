import { afterEach, expect, test } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runCodexSession } from '../src/engines/codex-session.js'
import { CodexEngine } from '../src/engines/codex.js'
import { PreflightCache } from '../src/preflight.js'
import { createExecutionObservation } from '../src/engines/execution-observation.js'
import { ControlStore } from '../src/engines/steering.js'
import { EvidenceStore } from '../src/engines/evidence-chain.js'
import type { RunEvent } from '../src/engines/run-control.js'

const fixtures: { dir: string; observation: ReturnType<typeof createExecutionObservation> }[] = []
afterEach(() => {
  for (const { dir, observation } of fixtures.splice(0)) {
    observation.finish('completed')
    rmSync(dir, { recursive: true, force: true })
  }
})

async function run(mode = 'ok') {
  const dir = mkdtempSync(join(tmpdir(), 'adng-native-steer-'))
  const observation = createExecutionObservation({ dataDir: dir, adapter: 'codex', job: {
    executionId: 'execution-11', projectPath: dir, task: { id: 'task-11', text: 'fixture task', line: 0, status: 'open' },
  } })
  fixtures.push({ dir, observation })
  const controls = new ControlStore(dir)
  const events: RunEvent[] = []
  const controller = new AbortController()
  let envelopeId = ''
  const result = await runCodexSession({
    command: process.execPath, args: [fileURLToPath(new URL('./fixtures/codex-steering-server.mjs', import.meta.url))],
    cwd: dir, prompt: 'original fixture instruction', model: 'fixture-model', timeoutMs: 5000,
    env: { ...process.env, ADNG_STEERING_CASE: mode } as Record<string, string>,
    control: { ...observation.control, signal: controller.signal, steer: controls.steerPort('execution-11'), onEvent(event) {
      events.push(event)
      observation.control.onEvent?.(event)
      if (mode === 'cancel' && event.type === 'output' && event.text.includes('awaiting-native-ack')) controller.abort()
      if (event.type === 'steer-ready' && event.supported && !['no-control', 'failed', 'interrupted'].includes(mode)) {
        const reply = controls.submit({ project: 'fixture', executionId: 'execution-11', mode: 'STEER',
          instruction: 'correct the plan', issuer: 'operator', channel: 'cli' })
        expect(reply.envelope.disposition).toBe('PENDING')
        envelopeId = reply.envelope.id
      }
    } },
  })
  return { dir, result, controls, events, envelopeId }
}

test('native STEER waits for tool completion and exact turn acknowledgement before STEERED', async () => {
  const { result, controls, envelopeId } = await run()
  expect(result).toMatchObject({ exitCode: 0, timedOut: false })
  expect(result.stdout).toContain('steered: correct the plan')
  expect(result.stdout).toContain('"input_tokens":12')
  const envelope = controls.list().resolved.find(env => env.id === envelopeId)
  expect(envelope).toMatchObject({ disposition: 'STEERED', requestedMode: 'STEER', executionId: 'execution-11' })
  expect(envelope?.detail).toContain('native-thread-11/native-turn-11')
})

test.each(['wrong-ack', 'disconnect', 'reject'])('native %s never produces a successful steering receipt', async mode => {
  const { controls, envelopeId } = await run(mode)
  const envelope = controls.list().resolved.find(env => env.id === envelopeId)
  expect(envelope?.disposition).toBe(mode === 'reject' ? 'NOT_DELIVERED' : 'DELIVERY_UNKNOWN')
})

test('a possibly applied STEER without acknowledgement blocks candidate evidence', async () => {
  const { dir, result } = await run('wrong-ack')
  expect(result.stdout).toContain('steered: correct the plan')
  expect(() => new EvidenceStore(dir).record({ executionId: 'execution-11',
    task: { id: 'task-11', text: 'fixture', line: 0, status: 'open' }, risk: 'low', writerIdentity: 'codex',
    verification: { candidateCommit: 'a'.repeat(40), ci: { status: 'pass', executed: true, exitCode: 0, detail: 'fixture' },
      reviewer: { status: 'pass', detail: 'fixture' } } })).toThrow(/unconfirmed/i)
})

test('an unrelated native terminal notification cannot finish the bound execution', async () => {
  const { result } = await run('no-control')
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain('original task')
  expect(result.stdout).toContain('"type":"turn.completed"')
})

test.each(['failed', 'interrupted'])('native %s never normalizes into a completed turn', async mode => {
  const { result } = await run(mode)
  expect(result.stdout).toContain('"type":"turn.failed"')
  expect(result.stdout).not.toContain('"type":"turn.completed"')
})

test('cancelling while a native acknowledgement is missing closes the transport without replay', async () => {
  const { result, controls, envelopeId } = await run('cancel')
  expect(result.aborted).toBe(true)
  expect(controls.list().pending).toEqual([])
  expect(controls.list().resolved.find(env => env.id === envelopeId)?.disposition).toBe('DELIVERY_UNKNOWN')
})

test.each(['unsafe-policy', 'unsafe-network', 'unsafe-roots', 'wrong-cwd'])('native %s is rejected before a generation starts', async mode => {
  const { result, events } = await run(mode)
  expect(result.exitCode).not.toBe(0)
  expect(events.some(event => event.type === 'steer-ready' && event.supported)).toBe(false)
  expect(result.stdout).not.toContain('"type":"turn.started"')
})

test('the Codex adapter routes an observed managed job through the native session and keeps commit checks', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-native-adapter-'))
  const job = { executionId: 'execution-11', projectPath: dir,
    task: { id: 'task-11', text: 'fixture task', line: 0, status: 'open' as const } }
  const observation = createExecutionObservation({ dataDir: dir, adapter: 'codex', job })
  fixtures.push({ dir, observation })
  let commits = 0
  const args = [fileURLToPath(new URL('./fixtures/codex-steering-server.mjs', import.meta.url))]
  const engine = new CodexEngine({ command: process.execPath, baseArgs: args, appServerArgs: args,
    homeDir: join(dir, 'home'), cache: new PreflightCache(join(dir, 'preflight.json')), timeoutMs: 3000,
    env: { ADNG_STEERING_CASE: 'no-control' }, getCommitHash: () => commits++ ? 'bbb' : 'aaa' })
  const result = await engine.run({ ...job, control: { ...observation.control, steer: new ControlStore(dir).steerPort(job.executionId) } })
  expect(result).toMatchObject({ ok: true, commitHash: 'bbb', baseCommitHash: 'aaa', costUnknown: true, tokensIn: 12 })
})
