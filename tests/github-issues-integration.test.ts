import { expect, test, vi } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assembleConfig } from '../src/cli/assemble.js'
import { MockEngine } from '../src/engines/mock.js'
import { KernelVerifier } from '../src/engines/kernel-verifier.js'
import { GithubConfigSchema, type Issue } from '../src/github/config.js'
import { command, type GithubClient } from '../src/github/client.js'
import { assertPublishable, executeIssue, git } from '../src/github/job.js'
import { branchFor, fingerprint, readState, saveState, type IssueState } from '../src/github/state.js'
import { publishIssue, runGithub } from '../src/github/runner.js'
import { acceptDelivery, recoverIssue } from '../src/github/operations.js'
import * as github from '../src/github/client.js'

test('三次真實驗收紅燈後，runner 接續一次替代方案並通過原始紅綠回歸', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-gh-alternative-'))
  try {
    const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: join(root, 'source.json'), dataDir: root,
      engine: 'writer', enabled: true, publish: false, label: null, verifyCommand: `"${process.execPath}" check.cjs` })
    const issue: Issue = { number: 8, title: 'Fix addition', body: 'add(2, 3) must return 5', state: 'open', user: { login: 'owner' }, labels: [] }
    const cwd = join(root, 'issue-8', 'repo'); mkdirSync(cwd, { recursive: true })
    git(cwd, ['init', '-b', branchFor(8)])
    git(cwd, ['config', 'user.name', 'Test']); git(cwd, ['config', 'user.email', 'test@example.invalid'])
    git(cwd, ['config', 'core.autocrlf', 'false'])
    git(cwd, ['remote', 'add', 'origin', 'https://github.com/owner/project.git'])
    writeFileSync(join(cwd, 'add.cjs'), 'module.exports = (a, b) => a - b\n')
    writeFileSync(join(cwd, 'check.cjs'), "require('node:assert/strict').equal(require('./add.cjs')(2, 3), 5)\n")
    git(cwd, ['add', '.']); git(cwd, ['commit', '-m', 'initial failing case'])
    const initial = git(cwd, ['rev-parse', 'HEAD'])
    saveState(cfg, { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'queued', runs: 0, nextRunAt: 0, baseSha: initial })
    writeFileSync(cfg.sourceConfig, JSON.stringify({ projectPath: cwd, backlogFile: 'unused', dataDir: 'unused', alternativeRetry: true,
      engines: { writer: { adapter: 'opencode', model: 'fixture' } }, defaultEngine: 'writer', reviewEngine: 'fixture-reviewer' }))
    const engine = new MockEngine(Array.from({ length: 4 }, (_, index) => ({ ok: true as const, beforeResult(job) {
      const base = git(job.projectPath, ['rev-parse', 'HEAD'])
      expect(job.directive?.includes('二次解決：')).toBe(index === 3)
      writeFileSync(join(job.projectPath, 'add.cjs'), `module.exports = (a, b) => a ${index === 3 ? '+' : '-'} b // attempt ${index + 1}\n`)
      if (index === 3) {
        expect(job.directive).toContain('先建立子問題清單')
        expect(job.directive).toContain('重新執行原始完整驗收')
        mkdirSync(join(job.projectPath, 'tests/regressions'), { recursive: true })
        writeFileSync(join(job.projectPath, 'tests/regressions/github-8.test.cjs'), "require('node:test')('addition', () => require('node:assert/strict').equal(require('../../add.cjs')(2, 3), 5))\n")
      }
      git(job.projectPath, ['add', '.']); git(job.projectPath, ['commit', '-m', `attempt ${index + 1}`])
      return base
    } })))
    const client: GithubClient = { list: async () => [issue], issue: async () => issue, findPr: async () => undefined,
      findLinkedPr: async () => undefined, createPr: async () => { throw new Error('publication forbidden') } }
    const execute: typeof executeIssue = (c, s) => executeIssue(c, s, runtime => {
      const app = assembleConfig(runtime)
      app.deps.engines = { resolve: () => engine }
      app.deps.verifier = new KernelVerifier({ cfg: runtime, reviewRun: async () => 'REVIEW: PASS' })
      return app
    })
    for (let i = 1; i <= 3; i++) {
      expect(await runGithub(cfg, { client, execute })).toBe('8: queued')
      const state = readState(cfg, 8)!
      expect(state.runs).toBe(i)
      expect(Boolean(state.alternativeRetryPending)).toBe(i === 3)
      expect(git(cwd, ['rev-parse', 'HEAD'])).toBe(initial)
      state.nextRunAt = 0; saveState(cfg, state)
    }
    expect(await runGithub(cfg, { client, execute })).toBe('8: ready')
    const final = readState(cfg, 8)!
    expect(final.runs).toBe(4); expect(final.commit).not.toBe(initial)
    assertPublishable(cfg, final)
    expect(command(process.execPath, ['check.cjs'], cwd)).toBe('')
    expect(await runGithub(cfg, { client, execute })).toBe('idle')
    expect(engine.calls).toHaveLength(4)
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 60_000)

test('Issue → real scheduler/worktree → failing-to-passing test → evidence → local push → one PR', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-gh-flow-'))
  try {
    const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: join(root, 'source.json'), dataDir: root, engine: 'writer', enabled: true, publish: true, label: null, verifyCommand: `"${process.execPath}" check.cjs` })
    const issue: Issue = { number: 1, title: 'Fix addition', body: 'add(2, 3) must return 5', state: 'open', user: { login: 'owner' }, labels: [] }
    const cwd = join(root, 'issue-1', 'repo'); mkdirSync(cwd, { recursive: true })
    git(cwd, ['init', '-b', branchFor(1)])
    git(cwd, ['config', 'user.name', 'Test']); git(cwd, ['config', 'user.email', 'test@example.invalid'])
    git(cwd, ['config', 'core.autocrlf', 'false'])
    git(cwd, ['remote', 'add', 'origin', 'https://github.com/owner/project.git'])
    writeFileSync(join(cwd, 'add.cjs'), 'module.exports = (a, b) => a - b\n')
    writeFileSync(join(cwd, 'check.cjs'), "require('node:assert/strict').equal(require('./add.cjs')(2, 3), 5)\n")
    git(cwd, ['add', '.']); git(cwd, ['commit', '-m', 'initial failing case'])
    const initialSha = git(cwd, ['rev-parse', 'HEAD'])
    expect(() => command(process.execPath, ['check.cjs'], cwd)).toThrow()
    const state: IssueState = { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'queued', runs: 0, nextRunAt: 0, baseSha: initialSha }
    saveState(cfg, state)
    writeFileSync(cfg.sourceConfig, JSON.stringify({ projectPath: cwd, backlogFile: 'unused', dataDir: 'unused',
      engines: { writer: { adapter: 'opencode', model: 'fixture' } }, defaultEngine: 'writer',
      verifyCommand: 'exit 97', reviewEngine: 'fixture-reviewer' }))
    let engine = new MockEngine([{ ok: true, beforeResult(job) {
      const base = git(job.projectPath, ['rev-parse', 'HEAD'])
      writeFileSync(join(job.projectPath, 'add.cjs'), 'module.exports = (a, b) => a + b\n')
      mkdirSync(join(job.projectPath, 'tests/regressions'), { recursive: true })
      writeFileSync(join(job.projectPath, 'tests/regressions/github-1.test.cjs'), "require('node:test')('addition', () => require('node:assert/strict').equal(require('../../add.cjs')(2, 3), 5))\n")
      git(job.projectPath, ['add', '.']); git(job.projectPath, ['commit', '-m', 'fix addition'])
      return base
    } }])
    const client: GithubClient = { list: async () => [issue], issue: async () => issue, findPr: vi.fn(async () => undefined), findLinkedPr: vi.fn(async () => undefined),
      createPr: vi.fn(async (branch: string, _title: string, body: string) => {
        expect(body).toContain('Closes #1')
        return { number: 2, html_url: 'https://github.com/owner/project/pull/2', state: 'open' as const, head: { ref: branch, sha: git(cwd, ['rev-parse', 'HEAD']) }, base: { ref: 'main' } }
      }) }
    const bare = join(root, 'remote.git'); mkdirSync(bare); git(bare, ['init', '--bare'])
    const execute: typeof executeIssue = (c, s) => executeIssue(c, s, runtime => {
      const app = assembleConfig(runtime)
      app.deps.engines = { resolve: () => engine }
      app.deps.verifier = new KernelVerifier({ cfg: runtime, reviewRun: async ({ diff }) => {
        expect(diff).toContain('a + b'); return 'REVIEW: PASS'
      } })
      return app
    })
    const publish: typeof publishIssue = (c, s, api) => publishIssue(c, s, api, assertPublishable,
      () => git(cwd, ['push', bare, `${s.commit}:refs/heads/${branchFor(1)}`]))
    expect(await runGithub(cfg, { client, execute, publish })).toBe('1: published')
    expect(readState(cfg, 1)!.commit).not.toBe(initialSha)
    expect(git(bare, ['rev-parse', `refs/heads/${branchFor(1)}`])).toBe(readState(cfg, 1)!.commit)
    expect(readFileSync(join(cwd, 'add.cjs'), 'utf8')).toContain('a + b')
    await runGithub(cfg, { client, execute, publish })
    expect(engine.calls).toHaveLength(1); expect(client.createPr).toHaveBeenCalledTimes(1)
    const first = readState(cfg, 1)!, firstCommit = first.commit!
    cfg.followup = true
    client.findPr = async () => ({ number: 2, html_url: first.pr!, state: 'open', head: { ref: branchFor(1), sha: git(bare, ['rev-parse', `refs/heads/${branchFor(1)}`]) }, base: { ref: 'main' } })
    client.feedback = async () => ({ number: 2, url: first.pr!, head: firstCommit, base: 'main', state: 'open', checks: 'pass', feedback: 'Handle numeric string inputs as addition too.' })
    expect(await runGithub(cfg, { client, execute, publish })).toBe('idle')
    const revision = readState(cfg, 1)!
    expect(revision.status).toBe('queued'); expect(revision.revision?.baseCommit).toBe(firstCommit)
    expect(revision.runs).toBe(1); revision.nextRunAt = 0; saveState(cfg, revision)
    engine = new MockEngine([{ ok: true, beforeResult(job) {
      const base = git(job.projectPath, ['rev-parse', 'HEAD'])
      git(job.projectPath, ['config', 'user.name', 'Test']); git(job.projectPath, ['config', 'user.email', 'test@example.invalid'])
      writeFileSync(join(job.projectPath, 'add.cjs'), 'module.exports = (a, b) => Number(a) + Number(b)\n')
      writeFileSync(join(job.projectPath, 'tests/regressions/github-1-r1.test.cjs'), "require('node:test')('numeric strings', () => require('node:assert/strict').equal(require('../../add.cjs')('2', '3'), 5))\n")
      git(job.projectPath, ['add', '.']); git(job.projectPath, ['commit', '-m', 'handle review feedback'])
      return base
    } }])
    const reviseExecute: typeof executeIssue = (c, s) => executeIssue(c, s, runtime => {
      const app = assembleConfig(runtime); app.deps.engines = { resolve: () => engine }
      app.deps.verifier = new KernelVerifier({ cfg: runtime, reviewRun: async () => 'REVIEW: PASS' }); return app
    })
    const revisePublish: typeof publishIssue = (c, s, api) => publishIssue(c, s, api, assertPublishable,
      () => git(join(root, 'issue-1/revisions/1/repo'), ['push', bare, `${s.commit}:refs/heads/${branchFor(1)}`]))
    expect(await runGithub(cfg, { client, execute: reviseExecute, publish: revisePublish })).toBe('1: published')
    expect(readState(cfg, 1)!.runs).toBe(2)
    expect(client.createPr).toHaveBeenCalledTimes(1)
    expect(git(cwd, ['rev-parse', 'HEAD'])).toBe(firstCommit)
    expect(git(bare, ['rev-parse', `refs/heads/${branchFor(1)}`])).toBe(readState(cfg, 1)!.commit)
    const current = readState(cfg, 1)!, configFile = join(root, 'github.json')
    writeFileSync(configFile, JSON.stringify(cfg))
    saveState(cfg, { ...current, status: 'blocked', detail: 'Interrupted after PR push' })
    const doctor = vi.fn().mockRejectedValue(new Error('Verified completed work must not rerun a model'))
    const recovered = await recoverIssue(configFile, 1, 'Recover confirmed PR push after host interruption', false, { client, doctor })
    expect(recovered.status).toBe('ready'); expect(doctor).not.toHaveBeenCalled()
    await revisePublish(cfg, recovered, client)
    let merged = false
    client.feedback = async () => ({ number: 2, url: current.pr!, head: current.commit!, base: 'main', state: merged ? 'merged' : 'open', checks: 'pass', feedback: '' })
    vi.spyOn(github, 'githubClient').mockReturnValue(client)
    const originalCommand = github.command
    vi.spyOn(github, 'command').mockImplementation((exe, args, cwd, input) => args.includes('user') && args.includes('.login') ? 'owner' : originalCommand(exe, args, cwd, input))
    await expect(acceptDelivery(configFile, 1, current.commit!, 'Verified both numeric and string inputs')).rejects.toThrow('Merge must be confirmed')
    merged = true
    await expect(acceptDelivery(configFile, 1, firstCommit, 'Verified both numeric and string inputs')).rejects.toThrow('candidate changed')
    await acceptDelivery(configFile, 1, current.commit!, 'Verified both numeric and string inputs')
    expect(readState(cfg, 1)!.acceptance?.commit).toBe(current.commit)
    expect(readState(cfg, 1)!.acceptance?.actor).toBe('owner')
    writeFileSync(join(cwd, 'unexpected.txt'), 'dirty')
    expect(() => assertPublishable(cfg, first)).toThrow('dirty')
  } finally { vi.restoreAllMocks(); rmSync(root, { recursive: true, force: true }) }
}, 90_000)
