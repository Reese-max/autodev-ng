import { createHash } from 'node:crypto'
import { afterEach, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { hostname, tmpdir } from 'node:os'
import { join } from 'node:path'
import { GithubConfigSchema, type GithubConfig, type Issue } from '../src/github/config.js'
import { assertPublishable, executeIssue, git, runtimeConfig } from '../src/github/job.js'
import { branchFor, fingerprint, readState, runDir, saveState, type IssueState } from '../src/github/state.js'
import { assembleConfig } from '../src/cli/assemble.js'
import { HerdrEngine } from '../src/engines/herdr.js'
import { PreflightCache } from '../src/preflight.js'
import { KernelVerifier } from '../src/engines/kernel-verifier.js'
import { RunDb } from '../src/db.js'
import { publishIssue, runGithub } from '../src/github/runner.js'
import type { GithubClient } from '../src/github/client.js'
import { herdrIntakeRuntimeHash } from '../src/github/herdr-admission.js'
import { attemptAccounting } from '../src/engines/attempt-accounting.js'

// Emulate only OS admission for the offline injected launcher; production has no platform override.
const native = vi.hoisted(() => ({ platform: 'win32' }))
vi.mock('node:os', async original => ({ ...await original<typeof import('node:os')>(), platform: () => native.platform }))
const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
function fixture() {
  native.platform = 'win32'
  const root = mkdtempSync(join(tmpdir(), 'adng-herdr-opt-in-')); roots.push(root)
  const sourceConfig = join(root, 'source.json'), evidenceFile = join(root, 'accepted-canary.json'), command = join(root, 'launcher.ps1')
  writeFileSync(command, '# launcher fixture; no backend started')
  const source = { projectPath: root, dataDir: root, backlogFile: 'unused', globalDailyHardUsd: 5,
    engines: { writer: { adapter: 'herdr', command, provider: 'Codex', model: 'approved-model', costPerRunUsd: 0.1, timeoutMs: 10_000 } },
    defaultEngine: 'writer', verifyCommand: 'node --version', reviewEngine: 'independent-reviewer' }
  writeFileSync(sourceConfig, JSON.stringify(source))
  const evidence = { schema: 'herdr-github-intake-acceptance/v1', repo: 'owner/project', engine: 'writer', provider: 'Codex', model: 'approved-model',
    sourceConfigSha256: hash(readFileSync(sourceConfig)), launcherSha256: hash(readFileSync(command)),
    runtimeSha256: herdrIntakeRuntimeHash(), host: hostname(),
    herdrVersion: 'fixture-herdr-1', backendVersion: 'fixture-backend-1', platform: 'win32',
    verifiedAt: new Date(Date.now() - 1000).toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString(),
    contracts: { exactReceipt: 1, singleDispatchRecovery: 1, backendReadiness: 1 },
    checks: { exactBinding: 'PASS', backendStopped: 'PASS', hostCommit: 'PASS', regression: 'PASS', independentReview: 'PASS', draftPr: 'PASS' },
    readiness: { login: 'available', model: 'verified', quota: 'available' },
    canary: { issue: 1, snapshot: 'a'.repeat(64), executionId: 'fixture-execution', commit: 'b'.repeat(40),
      draftPr: 'https://github.com/owner/project/pull/2', ciRun: 'https://github.com/owner/project/actions/runs/3' } }
  const pin = () => { writeFileSync(evidenceFile, JSON.stringify(evidence)); return hash(readFileSync(evidenceFile)) }
  const cfg = { ...GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], engine: 'writer', template: true,
    sourceConfig, dataDir: join(root, 'issues'), verifyCommand: 'node --version' }),
    herdrIntake: { enabled: true, evidenceFile, evidenceSha256: pin() } } as GithubConfig
  const issue: Issue = { number: 35, title: 'Fix addition', body: 'Approved bug fix', state: 'open', user: { login: 'owner' }, labels: [{ name: 'autodev' }, { name: 'bug' }] }
  const state: IssueState = { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'queued', runs: 0, nextRunAt: 0 }
  return { root, cfg, state, evidence, source, pin, sourceConfig }
}

test('trusted opt-in admits only a pinned compatible accepted backend while preserving host gates', () => {
  const f = fixture(), runtime = runtimeConfig(f.cfg, f.state)
  expect(runtime.engines.writer?.adapter).toBe('herdr')
  expect(runtime.concurrency).toBe(1)
  expect(runtime.maxAttempts).toBe(f.cfg.maxRuns)
  expect(runtime.extraDirective).toContain('Do not push, create PRs')
  expect(GithubConfigSchema.parse(f.cfg)).toMatchObject({ herdrIntake: { enabled: true } })
})

test('admission binds the exact source configuration, provider, model and launcher', () => {
  const f = fixture()
  expect(runtimeConfig(f.cfg, f.state).defaultEngine).toBe('writer')
  f.source.engines.writer.provider = 'Pi'
  writeFileSync(f.sourceConfig, JSON.stringify(f.source))
  expect(() => runtimeConfig(f.cfg, f.state)).toThrow(/source configuration|backend identity/)
})

test.each(['off', 'missing', 'unpinned', 'expired', 'future', 'long-lived', 'provider', 'model', 'launcher', 'runtime', 'host', 'platform', 'repo', 'capability', 'readiness', 'review', 'pr-repository', 'no-bug', 'no-autofix', 'author', 'closed', 'repair', 'free-claim'])('trusted opt-in fails closed for %s', mode => {
  const f = fixture()
  if (mode === 'off') f.cfg.herdrIntake!.enabled = false
  if (mode === 'missing') rmSync(f.cfg.herdrIntake!.evidenceFile)
  if (mode === 'unpinned') writeFileSync(f.cfg.herdrIntake!.evidenceFile, '{}')
  if (mode === 'expired') f.evidence.expiresAt = new Date(Date.now() - 1).toISOString()
  if (mode === 'future') f.evidence.verifiedAt = new Date(Date.now() + 1000).toISOString()
  if (mode === 'long-lived') f.evidence.expiresAt = new Date(Date.now() + 86_400_001).toISOString()
  if (mode === 'provider') f.evidence.provider = 'Pi'
  if (mode === 'model') f.evidence.model = 'other-model'
  if (mode === 'launcher') writeFileSync(f.source.engines.writer.command, '# changed')
  if (mode === 'runtime') f.evidence.runtimeSha256 = 'f'.repeat(64)
  if (mode === 'host') f.evidence.host = 'another-host'
  if (mode === 'platform') native.platform = 'linux'
  if (mode === 'repo') f.evidence.repo = 'other/project'
  if (mode === 'capability') f.evidence.contracts.exactReceipt = 0
  if (mode === 'readiness') f.evidence.readiness.login = 'unknown'
  if (mode === 'review') f.evidence.checks.independentReview = 'NOT_RUN'
  if (mode === 'pr-repository') f.evidence.canary.draftPr = 'https://github.com/other/project/pull/2'
  if (mode === 'no-bug') f.state.issue.labels = [{ name: 'autodev' }]
  if (mode === 'no-autofix') f.state.issue.labels.push({ name: 'no-autofix' })
  if (mode === 'author') f.state.issue.user.login = 'untrusted'
  if (mode === 'closed') f.state.issue.state = 'closed'
  if (mode === 'repair') f.cfg.repair = { reportConfig: 'unused', probeIds: ['probe'], prepareCommand: 'unused' }
  if (mode === 'free-claim') { Object.assign(f.source.engines.writer, { requireVerifiedFree: true }); writeFileSync(f.sourceConfig, JSON.stringify(f.source)) }
  if (!['missing', 'unpinned'].includes(mode)) f.cfg.herdrIntake!.evidenceSha256 = f.pin()
  expect(() => runtimeConfig(f.cfg, f.state)).toThrow()
  expect(f.state.runs).toBe(0)
})

test.each(['valid', 'wrong-receipt', 'agent-commit', 'original-already-green', 'candidate-still-red', 'review-rejected', 'budget-exhausted', 'dirty-checkout', 'wrong-origin'])('real offline Herdr intake lifecycle enforces publication gates (%s)', async mode => {
  const f = fixture(), cfg = f.cfg
  cfg.enabled = true; cfg.publish = true
  const cwd = join(cfg.dataDir, 'issue-35/repo'); mkdirSync(cwd, { recursive: true })
  git(cwd, ['init', '-b', branchFor(35)]); git(cwd, ['config', 'user.name', 'Test']); git(cwd, ['config', 'user.email', 'test@example.invalid'])
  git(cwd, ['remote', 'add', 'origin', 'https://github.com/owner/project.git'])
  writeFileSync(join(cwd, 'add.cjs'), `module.exports = (a, b) => a ${mode === 'original-already-green' ? '+' : '-'} b\n`)
  writeFileSync(join(cwd, 'check.cjs'), "require('node:assert/strict').equal(require('./add.cjs')(2, 3), 5)\n")
  git(cwd, ['add', '.']); git(cwd, ['commit', '-m', 'initial failing code'])
  f.state.baseSha = git(cwd, ['rev-parse', 'HEAD']); saveState(cfg, f.state)
  const configs = join(f.root, 'configs'); mkdirSync(configs)
  cfg.sourceConfig = join(configs, 'source.json'); cfg.verifyCommand = `"${process.execPath}" check.cjs`
  f.source.projectPath = cwd; f.source.dataDir = join(f.root, 'accounting')
  mkdirSync(f.source.dataDir)
  const accounting = new RunDb(join(f.source.dataDir, 'run.db'))
  if (mode === 'budget-exhausted') accounting.record({ taskId: 'earlier', ok: true, costUsd: 5, detail: 'existing fleet spend', engine: 'writer', accounting: attemptAccounting({ ok: true, output: '', costUsd: 5 }, {}) })
  accounting.close()
  writeFileSync(cfg.sourceConfig, JSON.stringify(f.source))
  f.evidence.sourceConfigSha256 = hash(readFileSync(cfg.sourceConfig)); cfg.herdrIntake!.evidenceSha256 = f.pin()
  let dispatches = 0
  const execute: typeof executeIssue = (c, state) => executeIssue(c, state, (runtime, cfgPath) => {
    const app = assembleConfig(runtime, cfgPath)
    const engine = new HerdrEngine({ command: f.source.engines.writer.command, model: 'approved-model', dataDir: runtime.dataDir,
      cache: new PreflightCache(join(runtime.dataDir, 'preflight.json')), runProcess: async opts => {
        if (opts.command === 'herdr.exe') return { exitCode: 0, stdout: '{"running":true,"compatible":true,"protocol":20}', stderr: '', timedOut: false, durationMs: 1 }
        dispatches++
        const value = (flag: string) => opts.args[opts.args.indexOf(flag) + 1]!
        const expected = JSON.parse(readFileSync(join(runtime.dataDir, 'herdr', `${value('-RequestId')}.expected.json`), 'utf8'))
        expect(git(opts.cwd, ['rev-parse', 'HEAD'])).toBe(expected.baseCommit)
        expect(value('-Goal')).toContain('GitHub owner/project#35')
        expect(opts.args).toContain('-AllowLocalCommit:$false')
        writeFileSync(join(opts.cwd, 'add.cjs'), `module.exports = (a, b) => a ${mode === 'candidate-still-red' ? '-' : '+'} b\n`)
        mkdirSync(join(opts.cwd, 'tests/regressions'), { recursive: true })
        writeFileSync(join(opts.cwd, 'tests/regressions/github-35.test.cjs'), "require('node:test')('addition', () => require('node:assert/strict').equal(require('../../add.cjs')(2, 3), 5))\n")
        if (mode === 'agent-commit') { git(opts.cwd, ['add', '.']); git(opts.cwd, ['commit', '-m', 'forbidden agent commit']) }
        writeFileSync(value('-ResultFile'), JSON.stringify({ ...expected, ...(mode === 'wrong-receipt' ? { executionId: 'another-execution' } : {}), server: 'fixture-server', session: 'herdr-autopilot', pane: 'fixture-pane', status: 'done' }))
        opts.control?.onEvent?.({ type: 'exit', code: 0, reason: 'exit' })
        return { exitCode: 0, stdout: 'fixture transport only', stderr: '', timedOut: false, durationMs: 1 }
      } })
    app.deps.engines = { resolve: () => engine }
    app.deps.verifier = new KernelVerifier({ cfg: runtime, reviewRun: async () => mode === 'review-rejected' ? 'REVIEW: FAIL\nCandidate does not meet the requirement' : 'REVIEW: PASS' })
    return app
  })
  const client: GithubClient = { list: async () => [f.state.issue], issue: async () => f.state.issue, findPr: async () => undefined, findLinkedPr: async () => undefined,
    createPr: vi.fn(async (branch: string) => ({ number: 2, html_url: 'https://github.com/owner/project/pull/2', state: 'open' as const, head: { ref: branch, sha: git(cwd, ['rev-parse', 'HEAD']) }, base: { ref: 'main' } })) }
  const pushed = vi.fn(), publish: typeof publishIssue = (c, s, api) => publishIssue(c, s, api, assertPublishable, pushed)
  if (mode === 'dirty-checkout') writeFileSync(join(cwd, 'unowned.txt'), 'dirty')
  if (mode === 'wrong-origin') git(cwd, ['remote', 'set-url', 'origin', 'https://github.com/other/project.git'])
  const outcome = await runGithub(cfg, { client, execute, publish })
  if (mode !== 'valid') {
    expect(outcome).not.toBe('35: published')
    expect(readState(cfg, 35)!.status).not.toBe('published')
    expect(client.createPr).not.toHaveBeenCalled(); expect(pushed).not.toHaveBeenCalled()
    if (['budget-exhausted', 'dirty-checkout', 'wrong-origin'].includes(mode)) expect(dispatches).toBe(0)
    return
  }
  expect(outcome).toBe('35: published')
  const final = readState(cfg, 35)!
  expect(final.commit).not.toBe(f.state.baseSha); assertPublishable(cfg, final)
  const regression = JSON.parse(readFileSync(join(runDir(cfg, final), `regression-${final.commit}.json`), 'utf8'))
  expect(regression).toMatchObject({ red: { exitCode: 1 }, green: { exitCode: 0 } })
  expect(await runGithub(cfg, { client, execute, publish })).toBe('idle')
  expect(dispatches).toBe(1); expect(client.createPr).toHaveBeenCalledTimes(1); expect(pushed).toHaveBeenCalledTimes(1)
}, 90_000)
