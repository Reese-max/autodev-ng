import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { HerdrEngine } from '../src/engines/herdr.js'
import { PreflightCache } from '../src/preflight.js'
import { runProcess } from '../src/engines/proc.js'

// Offline injected-runner regression; never starts PowerShell or a provider.
const diagnostic = (parameter: string) =>
  "Start-Herdr-Autopilot.ps1: A parameter cannot be found that matches parameter name '" + parameter + "'."
// Reported HP native -File errors, pwsh 7.6.6 / zh-TW / CP950; no FQErrorId in stderr.
// Byte fixtures are reconstructed from those exact decoded messages and reported code page,
// then replayed through production UTF-8 decoding. This is not a local PowerShell execution.
const hpUnicode = {
  ExecutionId: "Start-Herdr-Autopilot-legacy-execution.ps1: 找不到符合參數名稱 'ExecutionId' 的參數。\r\n",
  ResultFile: "Start-Herdr-Autopilot-legacy-resultfile.ps1: 找不到符合參數名稱 'ResultFile' 的參數。\r\n",
}
const hpCP950Hex = {
  ExecutionId: '53746172742d48657264722d4175746f70696c6f742d6c65676163792d657865637574696f6e2e7073313a20a7e4a4a3a8ecb2c5a658b0d1bcc6a657bad92027457865637574696f6e49642720aabab0d1bcc6a1430d0a',
  ResultFile: '53746172742d48657264722d4175746f70696c6f742d6c65676163792d726573756c7466696c652e7073313a20a7e4a4a3a8ecb2c5a658b0d1bcc6a657bad92027526573756c7446696c652720aabab0d1bcc6a1430d0a',
}
const hpDecoded = {
  ExecutionId: Buffer.from(hpCP950Hex.ExecutionId, 'hex').toString('utf8'),
  ResultFile: Buffer.from(hpCP950Hex.ResultFile, 'hex').toString('utf8'),
}
const cases: Array<{
  name: string; exitCode?: number | null; stdout?: string; stderr?: string
  timedOut?: boolean; aborted?: boolean; receipt?: 'valid' | 'invalid' | 'failed'; rawStderrHex?: string
  want: string; recovery?: boolean; commit?: boolean
}> = [
  { name: 'legacy ExecutionId rejects with exit 1', exitCode: 1, stderr: diagnostic('ExecutionId'), want: 'herdr-unsupported' },
  { name: 'legacy ResultFile rejects with exit 1', exitCode: 1, stderr: diagnostic('ResultFile'), want: 'herdr-unsupported' },
  { name: 'HP UTF-8 zh-TW ExecutionId rejection', stderr: hpUnicode.ExecutionId, want: 'herdr-unsupported' },
  { name: 'HP UTF-8 zh-TW ResultFile rejection', stderr: hpUnicode.ResultFile, want: 'herdr-unsupported' },
  { name: 'HP CP950 decoded as UTF-8 ExecutionId rejection', stderr: hpDecoded.ExecutionId, want: 'herdr-unsupported' },
  { name: 'HP CP950 decoded as UTF-8 ResultFile rejection', stderr: hpDecoded.ResultFile, want: 'herdr-unsupported' },
  { name: 'real Node child replays CP950 ExecutionId bytes', rawStderrHex: hpCP950Hex.ExecutionId, want: 'herdr-unsupported' },
  { name: 'real Node child replays CP950 ResultFile bytes', rawStderrHex: hpCP950Hex.ResultFile, want: 'herdr-unsupported' },
  { name: 'zh-TW Other parameter plus new flag context remains blocked', stderr: hpUnicode.ExecutionId.replace("'ExecutionId'", "'Other'") + "Call: -ExecutionId 'ExecutionId' -ResultFile 'ResultFile'", want: 'herdr-blocked' },
  { name: 'CP950 Other parameter plus new flag context remains blocked', stderr: hpDecoded.ExecutionId.replace("'ExecutionId'", "'Other'") + "Call: -ExecutionId 'ExecutionId' -ResultFile 'ResultFile'", want: 'herdr-blocked' },
  { name: 'FQErrorId for Other plus target context remains blocked', stderr: hpUnicode.ExecutionId.replace("'ExecutionId'", "'Other'") + "FullyQualifiedErrorId: NamedParameterNotFound,Start-Herdr-Autopilot.ps1\nContext: 'ExecutionId' 'ResultFile'", want: 'herdr-blocked' },
  { name: 'zh-TW stdout alone remains blocked', stdout: hpUnicode.ExecutionId, want: 'herdr-blocked' },
  { name: 'zh-TW nonzero with valid receipt remains blocked', stderr: hpUnicode.ExecutionId, receipt: 'valid', want: 'herdr-blocked' },
  { name: 'CP950 nonzero with invalid receipt remains blocked', stderr: hpDecoded.ResultFile, receipt: 'invalid', want: 'herdr-blocked' },
  { name: 'zh-TW timeout takes precedence', stderr: hpUnicode.ResultFile, timedOut: true, want: 'timeout' },
  { name: 'CP950 cancel takes precedence', stderr: hpDecoded.ExecutionId, aborted: true, want: 'cancel-requested' },
  { name: 'unrelated crash quoting new parameter names remains blocked', stderr: "Execution failed while writing 'ExecutionId' and 'ResultFile'", want: 'herdr-blocked' },
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
    if (c.rawStderrHex) {
      // Exercise real production pipe decoding, deliberately substituting only a Node fixture child.
      // One-byte writes cover split multibyte sequences; no PowerShell/backend/provider is started.
      const program = "const bytes=Buffer.from('" + c.rawStderrHex + "','hex'); (async()=>{ for (const byte of bytes) { process.stderr.write(Buffer.from([byte])); await new Promise(r=>setTimeout(r,2)); } process.exitCode=1; })();"
      const r = await runProcess({ ...opts, command: process.execPath, args: ['-e', program], timeoutMs: 30_000 })
      expect(r.stderr).toBe(Buffer.from(c.rawStderrHex, 'hex').toString('utf8'))
      expect(r.stdout).toBe('')
      return r
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
