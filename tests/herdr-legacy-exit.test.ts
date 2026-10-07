import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { HerdrEngine } from '../src/engines/herdr.js'
import { PreflightCache } from '../src/preflight.js'
import type { runProcess } from '../src/engines/proc.js'

// Offline injected-runner regression; never starts PowerShell or a provider.
const diagnostic = (parameter: string) =>
  "Start-Herdr-Autopilot.ps1: A parameter cannot be found that matches parameter name '" + parameter + "'."
const cases: Array<{
  name: string; exitCode?: number | null; stdout?: string; stderr?: string
  timedOut?: boolean; aborted?: boolean; receipt?: 'valid' | 'invalid' | 'failed'
  want: string; recovery?: boolean; commit?: boolean
}> = [
  { name: 'legacy ExecutionId rejects with exit 1', exitCode: 1, stderr: diagnostic('ExecutionId'), want: 'herdr-unsupported' },
  { name: 'legacy ResultFile rejects with exit 1', exitCode: 1, stderr: diagnostic('ResultFile'), want: 'herdr-unsupported' },
  { name: 'ANSI error still diagnoses legacy', exitCode: 1, stderr: "\u001b[31m" + diagnostic('ExecutionId') + "\u001b[0m", want: 'herdr-unsupported' },
  { name: 'wrapped error still diagnoses legacy', exitCode: 1, stderr: "A parameter cannot be found that matches parameter name\n'ResultFile'.", want: 'herdr-unsupported' },
  { name: 'legacy exit 0 marker remains unsupported', exitCode: 0, stdout: 'AUTOPILOT_WAIT_OK request=old', want: 'herdr-unsupported' },
  { name: 'unrelated missing parameter is blocked', exitCode: 1, stderr: diagnostic('Other'), want: 'herdr-blocked' },
  { name: 'other parameter with ExecutionId in context stays blocked', exitCode: 1, stderr: diagnostic('Other') + '\nCall: -ExecutionId exec-current', want: 'herdr-blocked' },
  { name: 'normal crash without receipt remains blocked', exitCode: 1, stderr: 'git diff failed', want: 'herdr-blocked' },
  { name: 'spawn unavailable remains blocked', exitCode: null, stderr: 'Error: spawn pwsh.exe ENOENT', want: 'herdr-blocked' },
  { name: 'nonzero with valid receipt remains blocked', exitCode: 1, stderr: diagnostic('ExecutionId'), receipt: 'valid', want: 'herdr-blocked' },
  { name: 'nonzero with invalid receipt remains blocked', exitCode: 1, stderr: diagnostic('ExecutionId'), receipt: 'invalid', want: 'herdr-blocked' },
  { name: 'stdout prose alone does not diagnose legacy', exitCode: 1, stdout: diagnostic('ExecutionId'), want: 'herdr-blocked' },
  { name: 'timeout takes precedence over legacy diagnosis', exitCode: 1, timedOut: true, stderr: diagnostic('ExecutionId'), want: 'timeout' },
  { name: 'cancel takes precedence over legacy diagnosis', exitCode: 1, aborted: true, stderr: diagnostic('ExecutionId'), want: 'cancel-requested' },
  { name: 'valid exit 0 still succeeds', exitCode: 0, receipt: 'valid', want: 'ok', commit: true, recovery: false },
  { name: 'bound failed exit 0 stays terminal', exitCode: 0, receipt: 'failed', want: 'herdr-failed', recovery: false },
  { name: 'nonzero bound failed receipt remains blocked', exitCode: 1, receipt: 'failed', want: 'herdr-blocked' },
]
for (const c of cases) test(c.name, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-herdr-legacy-'))
  const launcher = join(dir, 'Start-Herdr-Autopilot.ps1')
  writeFileSync(launcher, '# fixture only; never executed')
  writeFileSync(join(dir, '.adng-worktree'), '{}')
  const task = { id: 't32', text: 'offline regression', line: 1, status: 'open' as const }
  const runner: typeof runProcess = vi.fn(async opts => {
    expect(opts.command).toBe('pwsh.exe')
    const arg = (flag: string): string => opts.args[opts.args.indexOf(flag) + 1]!
    if (c.receipt) {
      writeFileSync(arg('-ResultFile'), c.receipt === 'invalid' ? '{truncated' : JSON.stringify({
        schemaVersion: 1, requestId: arg('-RequestId'), executionId: arg('-ExecutionId'),
        repo: opts.cwd, taskId: task.id, baseCommit: 'a'.repeat(40),
        server: 'srv', session: 'herdr-autopilot', pane: 'pane',
        status: c.receipt === 'failed' ? 'failed' : 'done',
      }))
    }
    return {
      exitCode: c.exitCode === undefined ? 1 : c.exitCode,
      stdout: c.stdout ?? '', stderr: c.stderr ?? '',
      timedOut: c.timedOut ?? false, aborted: c.aborted ?? false, durationMs: 1,
    }
  })
  const commit = vi.fn(() => 'b'.repeat(40))
  const engine = new HerdrEngine({
    command: launcher, cache: new PreflightCache(join(dir, 'preflight.json')), dataDir: dir,
    runProcess: runner, getCommitHash: () => 'a'.repeat(40), commitChanges: commit,
  })
  const result = await engine.run({ task, projectPath: dir, executionId: 'exec-current' })
  expect(result.ok).toBe(c.commit ?? false)
  if (!result.ok) expect(result.failureReason).toContain(c.want)
  expect(result.recoveryRequired ?? false).toBe(c.recovery ?? true)
  expect(commit).toHaveBeenCalledTimes(c.commit ? 1 : 0)
  expect(runner).toHaveBeenCalledTimes(1)
})
