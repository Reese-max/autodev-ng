import { afterEach, expect, test } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { formatStatus } from '../src/cli/status.js'
import { createExecutionObservation, executionFile } from '../src/engines/execution-observation.js'
import { ControlStore } from '../src/engines/steering.js'
import { EvidenceStore } from '../src/engines/evidence-chain.js'

const fixtures: { dir: string; observation: ReturnType<typeof createExecutionObservation> }[] = []
afterEach(() => {
  for (const { dir, observation } of fixtures.splice(0)) {
    observation.finish('completed')
    rmSync(dir, { recursive: true, force: true })
  }
})

function fixture(executionId = 'execution-11') {
  const dir = mkdtempSync(join(tmpdir(), 'adng-steering-safety-'))
  const observation = createExecutionObservation({ dataDir: dir, adapter: 'mock',
    job: { executionId, projectPath: dir, task: { id: 'task-11', text: 'fixture', line: 0, status: 'open' } } })
  fixtures.push({ dir, observation })
  const controls = new ControlStore(dir)
  const submit = (mode: 'STEER' | 'QUEUE', instruction = 'apply bounded correction') => controls.submit({
    project: 'fixture', executionId, mode, instruction, issuer: 'operator', channel: 'cli',
  })
  return { dir, controls, submit }
}

test('CLI status preserves colliding-prefix execution IDs that can be copied into exact controls', () => {
  const ids = ['12345678-1111-4111-8111-111111111111', '12345678-2222-4222-8222-222222222222']
  const text = formatStatus({
    heartbeat: { ts: new Date().toISOString(), state: 'running', todayCostUsd: 0 },
    dailySoftUsd: 40, dailyHardUsd: 100, backlog: { open: 1, blocked: 0, superseded: 0, done: 0 }, dlqCount: 0,
    activeExecutions: ids.map((executionId, i) => ({ executionId, taskId: `task-${i}` })), pendingControls: 2,
  })
  expect([...text.matchAll(/task-\d\/([A-Za-z0-9_-]+)/g)].map(match => match[1])).toEqual(ids)
})

test('an unresolved control transaction fences STEER delivery as well as QUEUE claims', () => {
  const { dir, controls, submit } = fixture()
  submit('STEER')
  const receipts = join(dir, 'controls', 'receipts')
  rmSync(receipts, { recursive: true })
  writeFileSync(receipts, 'deterministic receipt storage fault')
  expect(() => submit('QUEUE', 'must remain quarantined')).toThrow()
  rmSync(receipts)
  const restarted = new ControlStore(dir)
  expect(restarted.list().errors.some(error => error.includes('uncommitted'))).toBe(true)
  expect(restarted.claimQueue('execution-11', 'task-11')).toEqual([])
  expect(controls.takeInFlight('execution-11')).toBeUndefined()
})

test('restart resolves an orphaned claimed control as DELIVERY_UNKNOWN without replay', () => {
  const { dir, controls, submit } = fixture()
  const reply = submit('QUEUE')
  expect(controls.claimQueue('execution-11', 'task-11')).toHaveLength(1)
  const file = executionFile(dir, 'execution-11')
  const snapshot = JSON.parse(readFileSync(file, 'utf8'))
  writeFileSync(file, JSON.stringify({ ...snapshot, hostPid: 4_000_000 }))
  const restarted = new ControlStore(dir)
  expect(restarted.sweep()).toBe(1)
  expect(restarted.list().resolved.find(envelope => envelope.id === reply.envelope.id)?.disposition).toBe('DELIVERY_UNKNOWN')
  expect(restarted.peekQueue('execution-11')).toEqual([])
})

test('candidate evidence binds a delivered control to both immutable request and delivery receipts', () => {
  const { dir, controls, submit } = fixture()
  const reply = submit('QUEUE')
  controls.markDelivered(controls.claimQueue('execution-11', 'task-11'))
  const receipt = new EvidenceStore(dir).record({ executionId: 'execution-11',
    task: { id: 'task-11', text: 'fixture', line: 0, status: 'open' }, risk: 'low', writerIdentity: 'fixture',
    verification: { candidateCommit: 'a'.repeat(40), ci: { status: 'pass', executed: true, exitCode: 0, detail: 'fixture' }, reviewer: { status: 'pass', detail: 'fixture' } } })
  const bundle = JSON.parse(readFileSync(receipt.path, 'utf8'))
  expect(bundle.controls).toEqual([expect.objectContaining({ envelopeId: reply.envelope.id,
    instructionHash: reply.envelope.instructionHash, disposition: 'DELIVERED',
    requestReceiptHash: expect.stringMatching(/^[a-f0-9]{64}$/), deliveryReceiptHash: expect.stringMatching(/^[a-f0-9]{64}$/) })])
})
