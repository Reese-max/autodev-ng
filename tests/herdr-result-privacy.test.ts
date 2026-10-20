import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { HerdrEngine } from '../src/engines/herdr.js'
import { parseHerdrResult } from '../src/engines/herdr-result.js'
import { runProcess } from '../src/engines/proc.js'
import { PreflightCache } from '../src/preflight.js'

// Synthetic, not a credential. It is shorter than the old 20-character echo cap,
// so an absence assertion cannot pass just because the old reason truncated it.
const BAIT = 'sk-fixture-bait-42'
const BASE = 'a'.repeat(40)
const COMMIT = 'b'.repeat(40)
const task = { id: 'privacy-fixture', text: 'owned inert fixture', line: 1, status: 'open' as const }
const roots: string[] = []

afterEach(() => {
  for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true })
})

const validResult = {
  schemaVersion: 1, requestId: 'owned-request', executionId: 'owned-execution',
  repo: 'owned-repo', taskId: task.id, baseCommit: BASE,
  server: 'owned-server', session: 'herdr-autopilot', pane: 'owned-pane', status: 'done',
}

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'adng-herdr-privacy-'))
  roots.push(dir)
  const launcher = join(dir, 'Start-Herdr-Autopilot.ps1')
  writeFileSync(launcher, '# inert sentinel; injected runner never executes this file')
  writeFileSync(join(dir, '.adng-worktree'), '{}')
  return { dir, launcher, cache: new PreflightCache(join(dir, 'preflight.json')) }
}

function argAfter(args: string[], flag: string): string {
  const index = args.indexOf(flag)
  if (index < 0 || args[index + 1] === undefined) throw new Error(`missing owned fixture argument ${flag}`)
  return args[index + 1]!
}

function contractRunner(patch: Record<string, unknown>) {
  const calls: Parameters<typeof runProcess>[0][] = []
  const runner: typeof runProcess = async opts => {
    calls.push(opts)
    writeFileSync(argAfter(opts.args, '-ResultFile'), JSON.stringify({
      ...validResult,
      requestId: argAfter(opts.args, '-RequestId'),
      executionId: argAfter(opts.args, '-ExecutionId'),
      repo: opts.cwd,
      ...patch,
    }))
    return { exitCode: 0, stdout: '', stderr: '', timedOut: false, durationMs: 1 }
  }
  return { calls, runner }
}

test('parser rejects unsupported schema without echoing the untrusted schema value', () => {
  expect(BAIT.length).toBeLessThanOrEqual(20)
  const result = parseHerdrResult(JSON.stringify({ ...validResult, schemaVersion: BAIT }))
  expect(result).toMatchObject({ ok: false, kind: 'unsupported' })
  if (result.ok) throw new Error('unsupported schema was accepted')
  expect(result.reason).not.toContain(BAIT)
  expect(result.reason).toBe('結果契約版本不受支援')
})

test('parser rejects unknown status without echoing the untrusted status value', () => {
  expect(BAIT.length).toBeLessThanOrEqual(20)
  const result = parseHerdrResult(JSON.stringify({ ...validResult, status: BAIT }))
  expect(result).toMatchObject({ ok: false, kind: 'invalid' })
  if (result.ok) throw new Error('unknown status was accepted')
  expect(result.reason).not.toContain(BAIT)
  expect(result.reason).toBe('結果 status 非契約值')
})

test('adapter public failureReason rejects a bound unsupported schema without echoing it', async () => {
  const { dir, launcher, cache } = fixture()
  const commit = vi.fn((_path: string, _message: string) => COMMIT)
  const { calls, runner } = contractRunner({ schemaVersion: BAIT })
  const engine = new HerdrEngine({ command: launcher, cache, dataDir: dir, runProcess: runner, getCommitHash: () => BASE, commitChanges: commit })
  const result = await engine.run({ task, projectPath: dir, executionId: 'owned-schema' })

  expect(calls).toHaveLength(1)
  const receipt = JSON.parse(readFileSync(argAfter(calls[0]!.args, '-ResultFile'), 'utf8'))
  expect(receipt.schemaVersion).toBe(BAIT)
  expect(receipt.executionId).toBe('owned-schema')
  expect(result).toMatchObject({ ok: false, recoveryRequired: true })
  expect(commit).not.toHaveBeenCalled()
  expect(result.failureReason).not.toContain(BAIT)
  expect(result.failureReason).toBe('herdr-unsupported：結果契約版本不受支援')
})

test('adapter public failureReason rejects a bound unknown status without echoing it', async () => {
  const { dir, launcher, cache } = fixture()
  const commit = vi.fn((_path: string, _message: string) => COMMIT)
  const { calls, runner } = contractRunner({ status: BAIT })
  const engine = new HerdrEngine({ command: launcher, cache, dataDir: dir, runProcess: runner, getCommitHash: () => BASE, commitChanges: commit })
  const result = await engine.run({ task, projectPath: dir, executionId: 'owned-status' })

  expect(calls).toHaveLength(1)
  const receipt = JSON.parse(readFileSync(argAfter(calls[0]!.args, '-ResultFile'), 'utf8'))
  expect(receipt.status).toBe(BAIT)
  expect(receipt.executionId).toBe('owned-status')
  expect(result).toMatchObject({ ok: false, recoveryRequired: true })
  expect(commit).not.toHaveBeenCalled()
  expect(result.failureReason).not.toContain(BAIT)
  expect(result.failureReason).toBe('herdr-result-invalid：結果 status 非契約值')
})

test('valid done and failed parser contracts preserve their fields and additive data', () => {
  for (const status of ['done', 'failed'] as const) {
    const contract = { ...validResult, status, detail: 'owned legitimate detail', extra: { retained: true } }
    expect(parseHerdrResult(JSON.stringify(contract))).toEqual({ ok: true, result: contract })
  }
})

test('valid bound adapter completion still transfers one host commit', async () => {
  const { dir, launcher, cache } = fixture()
  const commit = vi.fn((_path: string, _message: string) => COMMIT)
  const { calls, runner } = contractRunner({})
  const engine = new HerdrEngine({ command: launcher, cache, dataDir: dir, runProcess: runner, getCommitHash: () => BASE, commitChanges: commit })
  const result = await engine.run({ task, projectPath: dir, executionId: 'owned-valid' })

  expect(calls).toHaveLength(1)
  expect(result).toMatchObject({ ok: true, baseCommitHash: BASE, commitHash: COMMIT })
  expect(result.recoveryRequired).toBeUndefined()
  expect(commit).toHaveBeenCalledTimes(1)
  expect(commit.mock.calls[0]?.[0]).toBe(dir)
})
