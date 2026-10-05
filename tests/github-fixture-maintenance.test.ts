import { afterEach, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as configExports from '../src/github/config.js'
import { GithubConfigSchema, loadGithubConfig, type Issue } from '../src/github/config.js'
import { fixtureHash } from '../src/github/fixture-profile.js'
import { assertFixtureCandidate, assertFixtureVerification, fixtureApproval, recordFixtureVerification } from '../src/github/fixture-maintenance.js'
import { assertPublishable, executeIssue, git, runtimeConfig } from '../src/github/job.js'
import { branchFor, fingerprint, runDir, type IssueState } from '../src/github/state.js'
import { command } from '../src/github/client.js'
import { assembleConfig } from '../src/cli/assemble.js'
import { KernelVerifier } from '../src/engines/kernel-verifier.js'
import type { Engine } from '../src/types.js'
import type { VerificationEvidence } from '../src/engines/evidence-chain.js'

const roots: string[] = []
afterEach(() => { vi.restoreAllMocks(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })
const file = 'tests/fixture.test.cjs'
const assertion = 'assert.equal(store.read()[0], 2)'
const base = `const { test } = require('node:test'); const assert = require('node:assert/strict');\nconst store = {};\ntest('original safety assertion', () => { ${assertion}; console.log('ORIGINAL_ASSERTION_REACHED'); });\n`
const approved = base.replace('const store = {};', 'const store = { read: () => [2] };')
function fixture(content = approved) {
  const root = mkdtempSync(join(tmpdir(), 'adng-fixture-profile-')); roots.push(root)
  const dataDir = join(root, 'data'), cwd = join(dataDir, 'issue-37', 'repo'); mkdirSync(join(cwd, 'tests'), { recursive: true })
  git(cwd, ['init', '-b', branchFor(37)]); git(cwd, ['config', 'user.name', 'Test']); git(cwd, ['config', 'user.email', 'test@example.invalid'])
  git(cwd, ['config', 'core.autocrlf', 'false']); git(cwd, ['remote', 'add', 'origin', 'https://github.com/owner/project.git'])
  writeFileSync(join(cwd, file), base)
  writeFileSync(join(cwd, 'tests/product.test.cjs'), "require('node:test')('product safety', () => require('node:assert/strict').equal(2 + 3, 5));\n")
  writeFileSync(join(cwd, 'product.cjs'), 'module.exports = 5;\n')
  git(cwd, ['add', '.']); git(cwd, ['commit', '-qm', 'base fixture missing read'])
  const baseSha = git(cwd, ['rev-parse', 'HEAD'])
  const issue: Issue = { number: 37, title: 'Repair missing fixture method', body: 'Preserve the original safety assertion', state: 'open', user: { login: 'owner' }, labels: [] }
  const state: IssueState = { repo: 'owner/project', base: 'main', issue, fingerprint: fingerprint(issue), status: 'queued', runs: 0, nextRunAt: 0, baseSha }
  const fullVerifyCommand = `"${process.execPath}" --test --test-reporter=tap`
  const sourceConfig = join(root, 'source.json'), config = join(root, 'operator.json')
  writeFileSync(sourceConfig, JSON.stringify({ projectPath: cwd, dataDir: join(root, 'source-data'), worktreesDir: join(root, 'source-worktrees'), backlogFile: 'unused',
    engines: { writer: { adapter: 'opencode', model: 'fixture-writer' } }, defaultEngine: 'writer', verifyCommand: fullVerifyCommand,
    reviewEngine: 'fixture-reviewer', judgeModel: 'fixture-judge', artifactContract: false, maxAttempts: 1 }))
  const raw = { repo: state.repo, authors: ['owner'], sourceConfig, dataDir, engine: 'writer', enabled: false, publish: false,
    fixtureMaintenance: { kind: 'approved-fixture-v1', repo: state.repo, issue: issue.number, fingerprint: state.fingerprint,
      baseCommit: baseSha, file, approvedContent: content, approvedSha256: fixtureHash(content), protectedAssertions: [assertion], fullVerifyCommand } }
  writeFileSync(config, JSON.stringify(raw))
  const cfg = loadGithubConfig(config)
  const candidate = (bytes = content, extra?: string, untracked = false) => {
    writeFileSync(join(cwd, file), bytes)
    if (extra) { mkdirSync(join(cwd, extra, '..'), { recursive: true }); writeFileSync(join(cwd, extra), 'unauthorized\n') }
    git(cwd, ['add', file]); if (extra && !untracked) git(cwd, ['add', extra]); git(cwd, ['commit', '-qm', 'fixture candidate'])
    state.commit = git(cwd, ['rev-parse', 'HEAD']); return state.commit
  }
  const evidence = (commit: string): VerificationEvidence => ({ candidateCommit: commit,
    ci: { status: 'pass', executed: true, exitCode: 0, command: fullVerifyCommand, detail: 'offline CI' },
    reviewer: { status: 'pass', identity: 'review:fixture-reviewer', detail: 'offline independent review' } })
  return { root, cwd, cfg, raw, config, sourceConfig, state, candidate, evidence }
}

test('only externally loaded operator config can authorize fixture bytes; ordinary BUGFIX stays unchanged', () => {
  const f = fixture()
  expect(configExports).not.toHaveProperty('registerFixtureConfig')
  expect(fixtureApproval(f.cfg, f.state)?.approvedContent).toBe(approved)
  expect(() => fixtureApproval(GithubConfigSchema.parse(f.raw), f.state)).toThrow('external operator')
  expect(() => fixtureApproval({ ...f.cfg }, f.state)).toThrow('external operator')
  const ordinary = GithubConfigSchema.parse({ ...f.raw, fixtureMaintenance: undefined })
  expect(runtimeConfig(ordinary, f.state).extraDirective).toContain('Do not change existing tests.')
  expect(runtimeConfig(f.cfg, f.state).verifyCommand).toBe(f.raw.fixtureMaintenance.fullVerifyCommand)
  expect(runtimeConfig(f.cfg, f.state).extraDirective).not.toContain('Add a self-contained regression')
})

test.each(['repo', 'data', 'worktree'])('repository/run controlled approval location is refused: %s', place => {
  const f = fixture()
  const dir = place === 'repo' ? f.cwd : place === 'data' ? f.cfg.dataDir : join(f.root, 'source-worktrees')
  mkdirSync(dir, { recursive: true }); const path = join(dir, 'operator.json'); writeFileSync(path, JSON.stringify(f.raw))
  expect(() => loadGithubConfig(path)).toThrow('external to repositories')
})
test.skipIf(process.platform === 'win32')('a symlink alias cannot disguise a repository approval file', () => {
  const f = fixture(), target = join(f.cwd, 'operator.json'), alias = join(f.root, 'external-alias.json')
  writeFileSync(target, JSON.stringify(f.raw)); symlinkSync(target, alias)
  expect(() => loadGithubConfig(alias)).toThrow('external to repositories')
})
test.skipIf(process.platform === 'win32').each(['delete', 'retarget'])('selected operator symlink continuity is required: %s', mode => {
  const f = fixture(), alias = join(f.root, 'operator-alias.json')
  symlinkSync(f.config, alias)
  const cfg = loadGithubConfig(alias)
  expect(fixtureApproval(cfg, f.state)?.approvedContent).toBe(approved)
  rmSync(alias)
  if (mode === 'retarget') {
    const other = join(f.root, 'other-operator.json'); writeFileSync(other, JSON.stringify(f.raw)); symlinkSync(other, alias)
  }
  expect(() => fixtureApproval(cfg, f.state)).toThrow()
})
test('omitting worktreesDir cannot authorize a config under its schema default', () => {
  const f = fixture(), source = JSON.parse(readFileSync(f.sourceConfig, 'utf8'))
  delete source.worktreesDir; writeFileSync(f.sourceConfig, JSON.stringify(source))
  const dir = join(f.root, 'worktrees'); mkdirSync(dir)
  const path = join(dir, 'operator.json'); writeFileSync(path, JSON.stringify(f.raw))
  expect(() => loadGithubConfig(path)).toThrow('external to repositories')
})
test('a source subdirectory cannot disguise approval in the enclosing Git repository', () => {
  const f = fixture(), source = JSON.parse(readFileSync(f.sourceConfig, 'utf8'))
  source.projectPath = join(f.cwd, 'tests'); writeFileSync(f.sourceConfig, JSON.stringify(source))
  const path = join(f.cwd, 'operator.json')
  writeFileSync(path, JSON.stringify({ ...f.raw, dataDir: join(f.root, 'other-data') }))
  expect(() => loadGithubConfig(path)).toThrow('external to repositories')
})
test.each(['bytes', 'delete', 'memory', 'config-object', 'source-bytes'])('approval drift after load fails closed: %s', mode => {
  const f = fixture()
  if (mode === 'bytes') writeFileSync(f.config, JSON.stringify(f.raw) + '\n')
  else if (mode === 'delete') rmSync(f.config)
  else if (mode === 'memory') f.cfg.fixtureMaintenance!.approvedContent += '\n'
  else if (mode === 'config-object') f.cfg.acceptance = { command: 'true', args: [] }
  else writeFileSync(f.sourceConfig, readFileSync(f.sourceConfig, 'utf8') + '\n')
  expect(() => runtimeConfig(f.cfg, f.state)).toThrow()
})
test('explicit helper profile argument cannot replace the external approval', () => {
  const f = fixture(), content = approved + '// unapproved\n', commit = f.candidate(content)
  const forged = { ...f.cfg.fixtureMaintenance!, approvedContent: content, approvedSha256: fixtureHash(content) }
  expect(() => assertFixtureCandidate(f.cfg, f.state, f.cwd, commit, forged)).toThrow('not the external operator approval')
})
test('approval getters return isolated copies and never mutable host provenance', () => {
  const f = fixture(), profile = fixtureApproval(f.cfg, f.state)!, digest = configExports.trustedFixtureDigest(f.cfg)
  profile.approvedContent += '// unapproved\n'; profile.protectedAssertions.push('unapproved assertion')
  expect(fixtureApproval(f.cfg, f.state)).toMatchObject({ approvedContent: approved, protectedAssertions: [assertion] })
  expect(configExports.trustedFixtureDigest(f.cfg)).toBe(digest)
  const commit = f.candidate()
  expect(() => assertFixtureCandidate(f.cfg, f.state, f.cwd, commit, profile)).toThrow('not the external operator approval')
})

test.each(['skip', 'expected', 'product', 'workflow', 'untracked-workflow'])('candidate drift is rejected: %s', mode => {
  const f = fixture()
  const bytes = mode === 'skip' ? approved.replace("test('original", "test.skip('original") : mode === 'expected' ? approved.replace(assertion, 'assert.equal(2, 2)') : approved
  const extra = mode === 'product' ? 'product.cjs' : mode.includes('workflow') ? '.github/workflows/ci.yml' : undefined
  const commit = f.candidate(bytes, extra, mode === 'untracked-workflow')
  expect(() => assertFixtureCandidate(f.cfg, f.state, f.cwd, commit)).toThrow()
})
test.each(['skip', 'expected'])('even operator byte approval cannot bypass the explicit protected assertion/new skip guard: %s', mode => {
  const content = mode === 'skip' ? approved.replace("test('original", "test.skip('original") : approved.replace(assertion, 'assert.equal(2, 2)')
  const f = fixture(content), commit = f.candidate()
  expect(() => assertFixtureCandidate(f.cfg, f.state, f.cwd, commit)).toThrow(mode === 'skip' ? 'skip/todo' : 'Protected')
})

test('Issue body profile forgery cannot opt into maintenance; different snapshot/base and revision cannot replay approval', () => {
  const f = fixture(), forged = GithubConfigSchema.parse({ ...f.raw, fixtureMaintenance: undefined })
  f.state.issue.body = JSON.stringify(f.raw.fixtureMaintenance)
  expect(fixtureApproval(forged, f.state)).toBeUndefined()
  expect(() => fixtureApproval(f.cfg, f.state)).toThrow('exact Issue snapshot')
  f.state.issue.body = 'Preserve the original safety assertion'
  expect(() => runtimeConfig(f.cfg, { ...f.state, baseSha: 'a'.repeat(40) })).toThrow('exact base')
  expect(() => fixtureApproval(f.cfg, { ...f.state, revision: { round: 1, baseCommit: f.state.baseSha!, feedback: 'change more', key: 'key' } })).toThrow('exact Issue snapshot')
  const weaker = { ...f.raw, verifyCommand: 'node -e "process.exit(0)"' }; writeFileSync(f.config, JSON.stringify(weaker))
  expect(() => runtimeConfig(loadGithubConfig(f.config), f.state)).toThrow('full verify command')
})

test.each(['ci-command', 'ci-not-run', 'reviewer', 'commit'])('fixture receipt refuses missing/wrong original gate evidence: %s', mode => {
  const f = fixture(), commit = f.candidate(), evidence = f.evidence(commit)
  if (mode === 'ci-command') evidence.ci.command = 'node -e "process.exit(0)"'
  if (mode === 'ci-not-run') evidence.ci.executed = false
  if (mode === 'reviewer') evidence.reviewer.status = 'skip'
  if (mode === 'commit') evidence.candidateCommit = 'a'.repeat(40)
  expect(() => recordFixtureVerification(f.cfg, f.state, f.cwd, commit, fixtureApproval(f.cfg, f.state)!, evidence)).toThrow('original full CI')
})

test('exact fixture receipt cannot be replayed onto another commit or approval-file version', () => {
  const f = fixture(), commit = f.candidate()
  recordFixtureVerification(f.cfg, f.state, f.cwd, commit, fixtureApproval(f.cfg, f.state)!, f.evidence(commit))
  assertFixtureVerification(f.cfg, f.state, f.cwd)
  git(f.cwd, ['commit', '--allow-empty', '-qm', 'different commit']); f.state.commit = git(f.cwd, ['rev-parse', 'HEAD'])
  const old = readFileSync(join(runDir(f.cfg, f.state), `fixture-maintenance-${commit}.json`))
  writeFileSync(join(runDir(f.cfg, f.state), `fixture-maintenance-${f.state.commit}.json`), old)
  expect(() => assertFixtureVerification(f.cfg, f.state, f.cwd)).toThrow('exact approved-fixture')
  git(f.cwd, ['reset', '--hard', commit]); f.state.commit = commit
  writeFileSync(f.config, JSON.stringify(f.raw) + '\n')
  expect(() => assertFixtureVerification(loadGithubConfig(f.config), f.state, f.cwd)).toThrow('exact approved-fixture')
})

test('actual runtime/scheduler/verifier preserves full CI, reaches original assertion and binds publication evidence', async () => {
  const f = fixture()
  expect(() => command(process.execPath, ['--test', '--test-reporter=tap'], f.cwd)).toThrow()
  const engine: Engine = { id: 'offline-writer', async preflight() { return { ok: true, detail: 'offline' } }, async run(job) {
    const baseCommitHash = git(job.projectPath, ['rev-parse', 'HEAD'])
    writeFileSync(join(job.projectPath, file), approved); git(job.projectPath, ['add', file]); git(job.projectPath, ['commit', '-qm', 'approved fixture'])
    return { ok: true, output: 'Added missing fixture method', costUsd: 0, actualModel: 'fixture-writer',
      baseCommitHash, commitHash: git(job.projectPath, ['rev-parse', 'HEAD']) }
  } }
  const review = vi.fn(async () => 'REVIEW: PASS')
  const result = await executeIssue(f.cfg, f.state, runtime => {
    expect(runtime.verifyCommand).toBe(f.raw.fixtureMaintenance.fullVerifyCommand)
    const app = assembleConfig(runtime); app.deps.engines = { resolve: () => engine }
    app.deps.verifier = new KernelVerifier({ cfg: runtime, reviewRun: review,
      judgeFetchFn: async () => new Response(JSON.stringify({ choices: [{ message: { content: 'MATCH' } }] })) })
    return app
  })
  expect(result.done, result.detail).toBe(true); expect(review).toHaveBeenCalledTimes(1)
  f.state.commit = result.commit
  assertPublishable(f.cfg, f.state)
  expect(command(process.execPath, ['--test', '--test-reporter=tap'], f.cwd)).toContain('ORIGINAL_ASSERTION_REACHED')
  const receipt = JSON.parse(readFileSync(join(runDir(f.cfg, f.state), `fixture-maintenance-${result.commit}.json`), 'utf8'))
  expect(receipt.evidence.ci).toMatchObject({ status: 'pass', executed: true, exitCode: 0, command: f.raw.fixtureMaintenance.fullVerifyCommand })
  writeFileSync(f.config, JSON.stringify(f.raw) + '\n')
  expect(() => assertPublishable(f.cfg, f.state)).toThrow('external operator')
}, 60_000)

test('actual verifier integration rejects an untracked workflow before original CI/review can run', async () => {
  const f = fixture(), check = vi.fn()
  const engine: Engine = { id: 'offline-writer', async preflight() { return { ok: true, detail: 'offline' } }, async run(job) {
    const baseCommitHash = git(job.projectPath, ['rev-parse', 'HEAD'])
    writeFileSync(join(job.projectPath, file), approved); git(job.projectPath, ['add', file]); git(job.projectPath, ['commit', '-qm', 'fixture'])
    mkdirSync(join(job.projectPath, '.github/workflows'), { recursive: true })
    writeFileSync(join(job.projectPath, '.github/workflows/bypass.yml'), 'continue-on-error: true\n')
    return { ok: true, output: 'fixture and workflow', costUsd: 0, baseCommitHash, commitHash: git(job.projectPath, ['rev-parse', 'HEAD']) }
  } }
  const result = await executeIssue(f.cfg, f.state, runtime => {
    const app = assembleConfig(runtime); app.deps.engines = { resolve: () => engine }
    app.deps.verifier = { check }; return app
  })
  expect(result.done).toBe(false); expect(check).not.toHaveBeenCalled()
  expect(() => assertPublishable(f.cfg, f.state)).toThrow()
}, 60_000)
