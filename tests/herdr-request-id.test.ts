import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { HerdrEngine } from '../src/engines/herdr.js'
import { executionFile } from '../src/engines/execution-observation.js'
import { PreflightCache } from '../src/preflight.js'
import type { runProcess } from '../src/engines/proc.js'

// Offline injected runner: this test never invokes a backend, launcher or provider.
const task = { id: 'offline-task', text: 'offline receipt binding', line: 1, status: 'open' as const }
const base = 'a'.repeat(40)
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'adng-herdr-request-'))
  const launcher = join(dir, 'Start-Herdr-Autopilot.ps1')
  writeFileSync(launcher, '# sentinel only; not executed')
  writeFileSync(join(dir, '.adng-worktree'), '{}')
  const calls: Array<{ request: string; execution: string; resultFile: string }> = []
  const commit = vi.fn(() => 'b'.repeat(40))
  let receiptPatch: Record<string, unknown> = {}
  const runner: typeof runProcess = async opts => {
    expect(opts.command).toBe('pwsh.exe')
    const arg = (flag: string): string => opts.args[opts.args.indexOf(flag) + 1]!
    const request = arg('-RequestId'), execution = arg('-ExecutionId'), resultFile = arg('-ResultFile')
    calls.push({ request, execution, resultFile })
    const expected = JSON.parse(readFileSync(join(dir, 'herdr', request + '.expected.json'), 'utf8'))
    expect(expected.executionId).toBe(execution) // Raw ID must survive filename encoding.
    expect(expected.requestId).toBe(request)
    writeFileSync(resultFile, JSON.stringify({
      schemaVersion: 1, requestId: request, executionId: execution,
      repo: opts.cwd, taskId: task.id, baseCommit: base,
      server: 'offline-server', session: 'herdr-autopilot', pane: 'offline-pane', status: 'done',
      ...receiptPatch,
    }))
    return { exitCode: 0, stdout: '', stderr: '', timedOut: false, durationMs: 1 }
  }
  const engine = new HerdrEngine({
    command: launcher, cache: new PreflightCache(join(dir, 'preflight.json')), dataDir: dir,
    runProcess: runner, getCommitHash: () => base, commitChanges: commit,
  })
  return { dir, calls, commit, engine, patchReceipt: (patch: Record<string, unknown>) => { receiptPatch = patch } }
}

const runId = 'run-12345678-1234-1234-1234-123456789abc'
const observedCases = [
  { name: 'distinct IDs sharing their first 40 characters', ids: ['x'.repeat(40) + '1', 'x'.repeat(40) + '2'] },
  { name: 'escalation ID suffixes emitted by the role adapter', ids: [runId + '-esc-3', runId + '-esc-5'] },
  { name: 'distinct 100-character observation-safe IDs', ids: ['x'.repeat(99) + '1', 'x'.repeat(99) + '2'] },
]
for (const c of observedCases) test('different valid executions have different requests: ' + c.name, async () => {
  const f = fixture()
  for (const executionId of c.ids) {
    expect(() => executionFile(f.dir, executionId)).not.toThrow()
    expect((await f.engine.run({ task, projectPath: f.dir, executionId })).ok).toBe(true)
  }
  expect(f.calls[0]!.request).not.toBe(f.calls[1]!.request)
  expect(f.calls[0]!.resultFile).not.toBe(f.calls[1]!.resultFile)
  expect(f.calls.map(c => c.execution)).toEqual(c.ids)
})

test('ordinary scheduler UUID retains the existing request format', async () => {
  const f = fixture(), executionId = '12345678-1234-1234-1234-123456789abc'
  expect((await f.engine.run({ task, projectPath: f.dir, executionId })).ok).toBe(true)
  expect(f.calls[0]!.request).toBe('adng-offline-task-aaaaaaaa-' + executionId)
})

test('long execution request encoding stays deterministic and filename-safe', async () => {
  const f = fixture(), executionId = runId + '-esc-3'
  for (let i = 0; i < 2; i++) await f.engine.run({ task, projectPath: f.dir, executionId })
  expect(f.calls[0]!.request).toBe(f.calls[1]!.request)
  expect(f.calls[0]!.request).toMatch(/^[A-Za-z0-9._-]+$/)
  expect(f.calls[0]!.request.length).toBeLessThan(100)
  // This checks ID stability, not read-only recheck / launch deduplication.
})

test('filename encoding does not weaken exact raw execution receipt rejection', async () => {
  const f = fixture(), executionId = runId + '-esc-5'
  f.patchReceipt({ executionId: runId + '-esc-3' })
  const r = await f.engine.run({ task, projectPath: f.dir, executionId })
  expect(r.failureReason).toContain('herdr-result-mismatch')
  expect(r.recoveryRequired).toBe(true)
  expect(f.commit).not.toHaveBeenCalled()
})

test('direct adapter compatibility: distinct unsafe raw IDs remain distinct', async () => {
  const f = fixture()
  for (const executionId of ['exec/a', 'exec:a']) {
    expect(() => executionFile(f.dir, executionId)).toThrow('Invalid execution ID')
    expect((await f.engine.run({ task, projectPath: f.dir, executionId })).ok).toBe(true)
  }
  expect(f.calls[0]!.request).not.toBe(f.calls[1]!.request)
  // These are outside observed execution's SAFE_ID contract; not a production-UUID incident.
})
