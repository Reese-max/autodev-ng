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
    const engine = new MockEngine([{ ok: true, beforeResult(job) {
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
    writeFileSync(join(cwd, 'unexpected.txt'), 'dirty')
    expect(() => assertPublishable(cfg, readState(cfg, 1)!)).toThrow('dirty')
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 30_000)
