import { lstatSync, mkdtempSync, readFileSync, rmSync, writeFileSync, type Stats } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { HerdrEngine } from '../src/engines/herdr.js'
import { checkHerdrResultFile, type HerdrExpectedBinding } from '../src/engines/herdr-result.js'
import { runProcess } from '../src/engines/proc.js'
import { PreflightCache } from '../src/preflight.js'

vi.mock('node:fs', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return { ...actual, lstatSync: vi.fn(actual.lstatSync) }
})
const actualFs = await vi.importActual<typeof import('node:fs')>('node:fs')
const roots: string[] = []
const base = 'a'.repeat(40)
const task = { id: 'receipt-channel', text: 'offline receipt channel', line: 1, status: 'open' as const }

afterEach(() => {
  vi.mocked(lstatSync).mockReset().mockImplementation(actualFs.lstatSync)
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'adng-herdr-channel-')); roots.push(dir)
  const launcher = join(dir, 'inert-launcher.ps1')
  writeFileSync(launcher, '# inert; never executed')
  writeFileSync(join(dir, '.adng-worktree'), '{}')
  const expected: HerdrExpectedBinding = {
    schemaVersion: 1, requestId: 'owned-request', executionId: 'owned-execution', repo: dir,
    taskId: task.id, baseCommit: base, session: 'herdr-autopilot', launcher, issuedAt: new Date().toISOString(),
  }
  const receipt = { ...expected, server: 'offline-server', pane: 'offline-pane', status: 'done' }
  return { dir, launcher, expected, receipt }
}

// Inert metadata seam, as in herdr-inspection.test.ts; Windows need not grant symlink creation privileges.
function linkedMetadata(file: string) {
  vi.mocked(lstatSync).mockImplementation(((path: string) => path === file
    ? { ...actualFs.lstatSync(file), isFile: () => false, isSymbolicLink: () => true } as Stats
    : actualFs.lstatSync(path)) as typeof lstatSync)
}

test('shared result checker rejects symlink metadata for otherwise correctly bound JSON', () => {
  const f = fixture(), path = join(f.dir, 'result.json')
  const bytes = JSON.stringify(f.receipt)
  writeFileSync(path, bytes); linkedMetadata(path)
  expect(checkHerdrResultFile(path, f.expected)).toMatchObject({ ok: false, kind: 'invalid' })
  expect(readFileSync(path, 'utf8')).toBe(bytes)
})

test('dispatch rejects a linked receipt without a host commit or a second prompt', async () => {
  const f = fixture(), commit = vi.fn(() => 'b'.repeat(40))
  const runner = vi.fn<typeof runProcess>(async opts => {
    const arg = (flag: string) => opts.args[opts.args.indexOf(flag) + 1]!
    const path = arg('-ResultFile')
    writeFileSync(path, JSON.stringify({ ...f.receipt, requestId: arg('-RequestId'), executionId: arg('-ExecutionId') }))
    linkedMetadata(path)
    return { exitCode: 0, stdout: 'AUTOPILOT_WAIT_OK', stderr: '', timedOut: false, durationMs: 1 }
  })
  const engine = new HerdrEngine({ command: f.launcher, cache: new PreflightCache(join(f.dir, 'cache.json')),
    dataDir: f.dir, runProcess: runner, getCommitHash: () => base, commitChanges: commit })
  const result = await engine.run({ task, projectPath: f.dir, executionId: 'owned-execution' })
  expect(result).toMatchObject({ ok: false, recoveryRequired: true })
  expect(result.failureReason).toContain('herdr-result-invalid')
  expect(commit).not.toHaveBeenCalled()
  expect(runner).toHaveBeenCalledTimes(1)
})

test('result metadata read errors fail closed without exposing filesystem diagnostics', () => {
  const f = fixture(), path = join(f.dir, 'result.json')
  writeFileSync(path, JSON.stringify(f.receipt))
  vi.mocked(lstatSync).mockImplementationOnce(() => { throw Object.assign(new Error('private filesystem diagnostic'), { code: 'EACCES' }) })
  const check = checkHerdrResultFile(path, f.expected)
  expect(check).toMatchObject({ ok: false, kind: 'invalid', reason: expect.stringMatching(/\S/) })
  expect(JSON.stringify(check)).not.toContain('private filesystem diagnostic')
})

// Real Node producer through the unchanged native runProcess and product adapter; no Herdr/provider is invoked.
test.each(['valid', 'missing', 'truncated', 'wrong-execution'] as const)(
  'native multi-chunk UTF-8 logs exceed both display buffers: %s receipt', async mode => {
    const f = fixture(), commit = vi.fn(() => 'b'.repeat(40))
    const producer = `
      const fs = require('node:fs');
      const [file, receipt, mode] = process.argv.slice(1);
      const write = (stream, bytes) => new Promise(resolve => stream.write(bytes, resolve));
      (async () => {
        for (const stream of [process.stdout, process.stderr]) {
          const utf8 = Buffer.from('終態');
          await write(stream, utf8.subarray(0, 1));
          await write(stream, utf8.subarray(1));
          for (let i = 0; i < 33; i++) await write(stream, 'x'.repeat(65536));
          await write(stream, '\\nAUTOPILOT_WAIT_OK\\n');
        }
        if (mode !== 'missing') fs.writeFileSync(file, mode === 'truncated' ? receipt.slice(0, -2) : receipt);
      })().catch(() => { process.exitCode = 1; });
    `
    let transport: Awaited<ReturnType<typeof runProcess>> | undefined
    const runner = vi.fn<typeof runProcess>(async opts => {
      const arg = (flag: string) => opts.args[opts.args.indexOf(flag) + 1]!
      const receipt = { ...f.receipt, requestId: arg('-RequestId'),
        executionId: mode === 'wrong-execution' ? 'other-execution' : arg('-ExecutionId') }
      transport = await runProcess({ command: process.execPath, args: ['-e', producer, arg('-ResultFile'), JSON.stringify(receipt), mode],
        cwd: opts.cwd, stdinText: '', timeoutMs: 10_000 })
      return transport
    })
    const engine = new HerdrEngine({ command: f.launcher, cache: new PreflightCache(join(f.dir, 'cache.json')),
      dataDir: f.dir, runProcess: runner, getCommitHash: () => base, commitChanges: commit })
    const result = await engine.run({ task, projectPath: f.dir, executionId: 'owned-execution' })
    expect(transport).toMatchObject({ exitCode: 0, timedOut: false })
    for (const output of [transport!.stdout, transport!.stderr]) {
      expect(output.startsWith('終態')).toBe(true)
      expect(output).toContain('[adng: output truncated]')
      expect(output.length).toBeLessThan(2_000_100)
      expect(output).not.toContain('AUTOPILOT_WAIT_OK')
    }
    expect(result.output.length).toBeLessThanOrEqual(2_000)
    expect(runner).toHaveBeenCalledTimes(1)
    if (mode === 'valid') {
      expect(result).toMatchObject({ ok: true, baseCommitHash: base, commitHash: 'b'.repeat(40) })
      expect(commit).toHaveBeenCalledTimes(1)
    } else {
      expect(result).toMatchObject({ ok: false, recoveryRequired: true })
      expect(result.failureReason).toContain(mode === 'missing' ? 'herdr-unsupported' : mode === 'truncated' ? 'herdr-result-invalid' : 'herdr-result-mismatch')
      expect(commit).not.toHaveBeenCalled()
    }
  },
)
