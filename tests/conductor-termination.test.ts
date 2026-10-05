import { afterEach, describe, expect, test } from 'vitest'
import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Engine, Job, RunResult } from '../src/types.js'
import { runConductorTask } from '../src/conductor/conductor.js'
import { TaskEnvelopeSchema } from '../src/conductor/envelope.js'
import { TaskLedger } from '../src/conductor/ledger.js'

const roots: string[] = []
const children: { child: ChildProcess; closed: Promise<void> }[] = []
afterEach(async () => {
  for (const { child, closed } of children.splice(0)) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    await closed
  }
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function repo(): string {
  const root = mkdtempSync(join(tmpdir(), 'adng-conductor-stop-'))
  roots.push(root)
  execFileSync('git', ['init', '-b', 'main'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'fixture'], { cwd: root })
  execFileSync('git', ['config', 'user.email', 'fixture@example.test'], { cwd: root })
  writeFileSync(join(root, 'README.md'), 'fixture\n')
  execFileSync('git', ['add', '.'], { cwd: root })
  execFileSync('git', ['commit', '-m', 'fixture'], { cwd: root, stdio: 'ignore' })
  return root
}

function envelope(task_id = 'timeout-task') {
  return TaskEnvelopeSchema.parse({ task_id, phase: 'implementation', goal: 'write output', scope: 'src only', worker: 'fixture',
    files_allowed_to_change: ['src/'], acceptance_criteria: ['output exists'], tests: ['git rev-parse HEAD'],
    budget: { timeout_ms: 30 }, max_retries: 1 })
}

function lateWriter(root: string) {
  const child = spawn(process.execPath, ['-e', `
    const { mkdirSync, writeFileSync } = require('node:fs');
    const { execFileSync } = require('node:child_process');
    const { join } = require('node:path');
    const root = process.argv[1];
    process.on('message', () => {
      mkdirSync(join(root, 'src'), { recursive: true });
      writeFileSync(join(root, 'src', 'late.txt'), 'late writer\\n');
      execFileSync('git', ['add', 'src/late.txt'], { cwd: root });
      execFileSync('git', ['commit', '-m', 'late writer'], { cwd: root, stdio: 'ignore' });
      process.exit(0);
    });
    process.send('ready');
  `, root], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] })
  const ready = new Promise<void>((resolve, reject) => { child.once('message', () => resolve()); child.once('error', reject) })
  const closed = new Promise<void>(resolve => child.once('close', () => resolve()))
  children.push({ child, closed })
  return { child, ready, closed }
}

const failed = (): RunResult => ({ ok: false, output: '', costUsd: 0, costUnknown: true, failureReason: 'cancelled' })

describe('Conductor timeout writer termination', () => {
  test('an abort-ignoring real child cannot overlap a retry, resume, or another task', async () => {
    const root = repo()
    let writer: ReturnType<typeof lateWriter> | undefined
    let calls = 0
    const engine: Engine = { id: 'child', async preflight() { return { ok: true, detail: 'ready' } },
      async run() { calls++; writer = lateWriter(root); await writer.closed; return failed() } }
    const first = await runConductorTask(envelope(), { projectPath: root, resolveWorker: () => engine })
    expect(first.status).toBe('escalated')
    expect(first.reason).toContain('termination-unconfirmed')
    expect(calls).toBe(1)
    const fence = JSON.parse(readFileSync(join(root, '.autodev', 'worker-quarantine.json'), 'utf8'))
    expect(fence.executionId).toBeTruthy()
    for (const taskId of ['timeout-task', 'new-task']) {
      const next = await runConductorTask(envelope(taskId), { projectPath: root, resolveWorker: () => engine })
      expect(next.status).toBe('blocked')
    }
    await writer!.ready
    writer!.child.send('late commit')
    await writer!.closed
    expect(existsSync(join(root, 'src', 'late.txt'))).toBe(true)
    expect(calls).toBe(1)
    expect(existsSync(join(root, '.autodev', 'worker-quarantine.json'))).toBe(true)
    expect((await runConductorTask(envelope(), { projectPath: root, resolveWorker: () => engine })).status).toBe('blocked')
  })

  test('confirmed child termination and unchanged repo allow exactly one retry', async () => {
    const root = repo()
    let writer: ReturnType<typeof lateWriter> | undefined
    let calls = 0
    const engine: Engine = { id: 'child', async preflight() { return { ok: true, detail: 'ready' } },
      async run() {
        if (++calls === 1) { writer = lateWriter(root); await writer.closed; return failed() }
        mkdirSync(join(root, 'src'))
        writeFileSync(join(root, 'src', 'output.txt'), 'safe retry\n')
        execFileSync('git', ['add', 'src/output.txt'], { cwd: root })
        execFileSync('git', ['commit', '-m', 'retry'], { cwd: root, stdio: 'ignore' })
        return { ok: true, output: '', costUsd: 0 }
      } }
    const result = await runConductorTask(envelope(), { projectPath: root, resolveWorker: () => engine,
      async cancelWorker(_engine, job) { writer!.child.kill('SIGKILL'); await writer!.closed; return { executionId: job.executionId!, terminated: true } } })
    expect(result.status).toBe('done')
    expect(calls).toBe(2)
    expect(existsSync(join(root, 'src', 'late.txt'))).toBe(false)
    expect(existsSync(join(root, '.autodev', 'worker-quarantine.json'))).toBe(false)
  })

  test('a late commit before a valid termination receipt blocks retry', async () => {
    const root = repo()
    let writer: ReturnType<typeof lateWriter> | undefined
    let calls = 0
    const engine: Engine = { id: 'child', async preflight() { return { ok: true, detail: 'ready' } },
      async run() { calls++; writer = lateWriter(root); await writer.closed; return failed() } }
    const result = await runConductorTask(envelope(), { projectPath: root, resolveWorker: () => engine,
      terminationTimeoutMs: 5_000,
      async cancelWorker(_engine, job) { await writer!.ready; writer!.child.send('late commit'); await writer!.closed; return { executionId: job.executionId!, terminated: true } } })
    expect(result.status).toBe('blocked')
    expect(result.reason).toContain('late-mutation')
    expect(calls).toBe(1)
    expect(existsSync(join(root, 'src', 'late.txt'))).toBe(true)
    expect(existsSync(join(root, '.autodev', 'worker-quarantine.json'))).toBe(true)
    expect((await runConductorTask(envelope(), { projectPath: root, resolveWorker: () => engine })).status).toBe('blocked')
  })

  test('a recoveryRequired terminal result cannot release the writer fence', async () => {
    const root = repo()
    let calls = 0
    const engine: Engine = { id: 'fixture', async preflight() { return { ok: true, detail: 'ready' } },
      async run() { calls++; return { ...failed(), recoveryRequired: true } } }
    const result = await runConductorTask(envelope(), { projectPath: root, resolveWorker: () => engine })
    expect(result.reason).toContain('termination-unconfirmed')
    expect(calls).toBe(1)
    expect((await runConductorTask(envelope('another-task'), { projectPath: root, resolveWorker: () => engine })).status).toBe('blocked')
  })

  test('deleting the state projection or changing stateDir cannot release a live child', async () => {
    const root = repo()
    let writer: ReturnType<typeof lateWriter> | undefined
    let calls = 0
    const engine: Engine = { id: 'child', async preflight() { return { ok: true, detail: 'ready' } },
      async run() { calls++; writer = lateWriter(root); rmSync(join(root, '.autodev', 'worker-quarantine.json')); await writer.closed; return failed() } }
    const first = await runConductorTask(envelope(), { projectPath: root, resolveWorker: () => engine, terminationTimeoutMs: 20 })
    expect(first.status).toBe('escalated')
    expect(existsSync(join(root, '.git', 'adng-conductor-worker-quarantine.json'))).toBe(true)
    for (const stateDir of [join(root, '.autodev'), join(root, 'alternate-state')]) {
      expect((await runConductorTask(envelope('new-task'), { projectPath: root, stateDir, resolveWorker: () => engine })).status).toBe('blocked')
    }
    expect(calls).toBe(1)
  })

  test('a thrown run with a still-live child never starts another writer', async () => {
    const root = repo()
    let calls = 0
    const engine: Engine = { id: 'child', async preflight() { return { ok: true, detail: 'ready' } },
      async run() { calls++; lateWriter(root); throw new Error('transport lost after dispatch') } }
    const result = await runConductorTask(envelope(), { projectPath: root, resolveWorker: () => engine })
    expect(result.reason).toContain('termination-unconfirmed')
    expect(calls).toBe(1)
    expect(existsSync(join(root, '.git', 'adng-conductor-worker-quarantine.json'))).toBe(true)
    expect((await runConductorTask(envelope('new-task'), { projectPath: root, resolveWorker: () => engine })).status).toBe('blocked')
  })

  test('a legacy open attempt or unconfirmed timeout blocks different-task dispatch', async () => {
    for (const failure_class of [undefined, 'task-timeout', 'worker-crash']) {
      const root = repo()
      const ledger = new TaskLedger(join(root, '.autodev'))
      ledger.append({ type: 'attempt', task_id: 'older-task', attempt: 1, worker: 'fixture', preexisting_dirty: 0, ts: '2026-10-01T00:00:00Z' })
      if (failure_class) {
        ledger.append({ type: 'attempt-result', task_id: 'older-task', attempt: 1, worker: 'fixture', ok: false, failure_class, ts: '2026-10-01T00:01:00Z' })
        ledger.append({ type: 'task-finished', task_id: 'older-task', status: 'escalated', attempts: 1, ts: '2026-10-01T00:01:00Z' })
      }
      let calls = 0
      const engine: Engine = { id: 'fixture', async preflight() { return { ok: true, detail: 'ready' } }, async run() { calls++; return failed() } }
      const result = await runConductorTask(envelope('new-task'), { projectPath: root, resolveWorker: () => engine })
      expect(result.status).toBe('blocked')
      expect(calls).toBe(0)
      expect(existsSync(join(root, '.git', 'adng-conductor-worker-quarantine.json'))).toBe(true)
    }
  })

  test('a later clean legacy retry does not erase the earlier unconfirmed timeout', async () => {
    const root = repo()
    const ledger = new TaskLedger(join(root, '.autodev'))
    for (const attempt of [1, 2]) {
      ledger.append({ type: 'attempt', task_id: 'older-task', attempt, worker: 'fixture', preexisting_dirty: 0, ts: '2026-10-01T00:00:00Z' })
      ledger.append({ type: 'attempt-result', task_id: 'older-task', attempt, worker: 'fixture', ok: attempt === 2, failure_class: attempt === 1 ? 'task-timeout' : undefined, ts: '2026-10-01T00:01:00Z' })
    }
    ledger.append({ type: 'task-finished', task_id: 'older-task', status: 'done', attempts: 2, ts: '2026-10-01T00:01:00Z' })
    let calls = 0
    const engine: Engine = { id: 'fixture', async preflight() { return { ok: true, detail: 'ready' } }, async run() { calls++; return failed() } }
    expect((await runConductorTask(envelope('new-task'), { projectPath: root, resolveWorker: () => engine })).status).toBe('blocked')
    expect(calls).toBe(0)
    const fence = JSON.parse(readFileSync(join(root, '.git', 'adng-conductor-worker-quarantine.json'), 'utf8'))
    expect(fence.taskId).toBe('older-task')
    expect(fence.attempt).toBe(1)
  })

  test.each(['wrong-id', 'unconfirmed', 'hung', 'unsettled-run'] as const)('%s cancellation stays bounded and quarantined', async mode => {
    const root = repo()
    let finishRun: (() => void) | undefined
    const engine: Engine = { id: 'fixture', async preflight() { return { ok: true, detail: 'ready' } },
      async run(job: Job) { await new Promise<void>(resolve => { finishRun = resolve; if (mode !== 'unsettled-run') job.control!.signal!.addEventListener('abort', () => resolve(), { once: true }) }); return failed() } }
    const result = await runConductorTask(envelope(), { projectPath: root, resolveWorker: () => engine, terminationTimeoutMs: 20,
      async cancelWorker(_engine, job) {
        if (mode === 'hung') return new Promise(() => {})
        return { executionId: mode === 'wrong-id' ? 'other-execution' : job.executionId!, terminated: mode !== 'unconfirmed' }
      } })
    expect(result.status).toBe('escalated')
    expect(result.attempts).toBe(1)
    expect(existsSync(join(root, '.autodev', 'worker-quarantine.json'))).toBe(true)
    finishRun?.()
  })
})
