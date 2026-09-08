import { afterEach, expect, test } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { git } from '../src/github/job.js'
import { GithubConfigSchema } from '../src/github/config.js'
import type { IssueState } from '../src/github/state.js'
import { assertRegression, regressionFile, verifyRegression } from '../src/github/regression.js'

const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })
test.skipIf(process.platform !== 'win32')('single-repository watcher accepts absolute and relative data directories while disabled', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-watcher-')); dirs.push(root)
  for (const dataDir of [join(root, 'absolute'), 'relative']) {
    const file = join(root, 'config.json')
    writeFileSync(file, JSON.stringify({ repo: 'owner/repo', dataDir, enabled: false, retryMs: 60000 }))
    const run = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(import.meta.dirname, '../scripts/watch-github-owner.ps1'), '-Config', file, '-Mode', 'issues'], { encoding: 'utf8', windowsHide: true, timeout: 10_000 })
    expect(run.status, run.stderr).toBe(0)
  }
})
test.each(['valid', 'crlf', 'always-pass', 'missing-module', 'weakened-test'])('regression gate: %s', async mode => {
  const root = mkdtempSync(join(tmpdir(), 'adng-regression-')); dirs.push(root)
  const cwd = join(root, 'issue-9/repo'); mkdirSync(cwd, { recursive: true })
  git(cwd, ['init', '-b', 'main']); git(cwd, ['config', 'user.name', 'Test']); git(cwd, ['config', 'user.email', 'test@example.invalid'])
  git(cwd, ['config', 'core.autocrlf', mode === 'crlf' ? 'true' : 'false'])
  writeFileSync(join(cwd, 'add.cjs'), 'module.exports = (a,b) => a-b\n')
  writeFileSync(join(cwd, 'old.test.cjs'), '// preserve me\n')
  git(cwd, ['add', '.']); git(cwd, ['commit', '-qm', 'base'])
  const baseSha = git(cwd, ['rev-parse', 'HEAD'])
  const file = regressionFile(9); mkdirSync(join(cwd, 'tests/regressions'), { recursive: true })
  writeFileSync(join(cwd, file), mode === 'missing-module' ? "require('missing-fixture-module')\n" :
    `require('node:test')('addition', () => require('node:assert/strict').equal(${mode === 'always-pass' ? '5' : "require('../../add.cjs')(2,3)"}, 5))\n`)
  writeFileSync(join(cwd, 'add.cjs'), 'module.exports = (a,b) => a+b\n')
  if (mode === 'crlf') writeFileSync(join(cwd, file), readFileSync(join(cwd, file), 'utf8').replace(/\r?\n/g, '\r\n'))
  if (mode === 'weakened-test') writeFileSync(join(cwd, 'old.test.cjs'), '// changed\n')
  git(cwd, ['add', '.']); git(cwd, ['commit', '-qm', 'candidate'])
  const commit = git(cwd, ['rev-parse', 'HEAD'])
  const state = { baseSha, commit, issue: { number: 9 } } as IssueState
  const cfg = GithubConfigSchema.parse({ repo: 'owner/repo', sourceConfig: 'unused', dataDir: root, engine: 'unused', authors: ['owner'] })
  if (!['valid', 'crlf'].includes(mode)) { await expect(verifyRegression(cfg, state, cwd, commit, 10_000)).rejects.toThrow(); return }
  await verifyRegression(cfg, state, cwd, commit, 10_000); assertRegression(cfg, state, cwd)
  const path = join(root, 'issue-9', `regression-${commit}.json`), receipt = JSON.parse(readFileSync(path, 'utf8'))
  expect(receipt.red.exitCode).toBe(1); expect(receipt.green.exitCode).toBe(0)
  receipt.testHash = 'tampered'; writeFileSync(path, JSON.stringify(receipt))
  expect(() => assertRegression(cfg, state, cwd)).toThrow('exact regression')
})
