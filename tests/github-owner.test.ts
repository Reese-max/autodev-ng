import { expect, test, vi } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { OwnerConfigSchema, ownedRepos, repoConfig, runOwner } from '../src/github/owner.js'
import { detectVerification } from '../src/github/job.js'
import { runGithub } from '../src/github/runner.js'

test('owner discovery covers private repos, isolates paths and executes at most one Issue per tick', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-owner-test-'))
  const cfg = OwnerConfigSchema.parse({ owner: 'owner', authors: ['owner'], sourceConfig: 'source.json', dataDir: root, engine: 'writer', enabled: true, publish: true })
  const row = (name: string, more = {}) => ({ full_name: name, owner: { login: name.split('/')[0] }, default_branch: 'master',
    archived: false, disabled: false, has_issues: true, permissions: { push: true }, ...more })
  const repos = ownedRepos('owner', [[row('owner/CON', { private: true }), row('other/foreign')], [row('owner/second'), row('owner/off', { has_issues: false })]])
  expect(repos).toHaveLength(3)
  const child = repoConfig(cfg, repos[0]!)
  expect(child.base).toBe('master'); expect(child.template).toBe(true)
  expect(child.dataDir).not.toBe(repoConfig(cfg, repos[1]!).dataDir)
  expect(child.stopFile).toBe(join(root, '.adng.stop'))
  const custom = repoConfig({ ...cfg, projects: { 'owner/CON': 'custom.json' } }, repos[0]!)
  expect(custom.sourceConfig).toBe('custom.json'); expect(custom.template).toBe(false)
  const verified = repoConfig({ ...cfg, verifyCommands: { 'OWNER/CON': 'python -m unittest discover -s tests -v' } }, repos[0]!)
  expect(verified.verifyCommand).toBe('python -m unittest discover -s tests -v')
  expect(repoConfig({ ...cfg, verifyCommands: { 'owner/CON': 'python -m unittest' } }, repos[1]!).verifyCommand).toBeUndefined()
  expect(() => OwnerConfigSchema.parse({ ...cfg, verifyCommands: { 'owner/CON': ' ' } })).toThrow()
  const run = vi.fn<typeof runGithub>(async (_c, o) => o?.syncOnly ? 'synced' : '1: published')
  const result = await runOwner(cfg, false, () => repos, run)
  expect(result.status).toBe('ok')
  expect(run.mock.calls.filter(([, o]) => !o?.syncOnly)).toHaveLength(1)
  expect(run).toHaveBeenCalledTimes(2)
  const failure = vi.fn<typeof runGithub>(async () => { throw new Error('network failed') })
  expect((await runOwner(cfg, true, () => repos, failure)).status).toBe('error')
  expect(failure).toHaveBeenCalledTimes(2)
  writeFileSync(join(root, '.adng.stop'), 'pause')
  const execute = vi.fn()
  expect(await runGithub(child, { execute })).toBe('paused'); expect(execute).not.toHaveBeenCalled()
})

test('verification never inherits another project command or treats unsupported stacks as passing', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-owner-verify-'))
  expect(() => detectVerification(root)).toThrow('verification contract')
  writeFileSync(join(root, 'package-lock.json'), '{}')
  writeFileSync(join(root, 'package.json'), JSON.stringify({ scripts: { test: 'echo "Error: no test specified" && exit 1' } }))
  expect(() => detectVerification(root)).toThrow('verification contract')
  writeFileSync(join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --test', build: 'tsc' } }))
  expect(detectVerification(root)).toBe('npm ci --no-audit --no-fund && npm test && npm run build')
})
