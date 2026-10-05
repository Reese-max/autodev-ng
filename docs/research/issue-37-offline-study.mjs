/** Bounded RESEARCH replay. Import the disabled historical implementation only.
 * It creates disposable synthetic repositories and synthetic external approvals.
 * It does not enable production config, dispatch a provider or publish anything.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GithubConfigSchema, loadGithubConfig } from '../../dist/github/config.js'
import { assertFixtureCandidate, fixtureApproval } from '../../dist/github/fixture-maintenance.js'
import { runtimeConfig } from '../../dist/github/job.js'
import { branchFor, fingerprint } from '../../dist/github/state.js'
import { verifyRegression } from '../../dist/github/regression.js'

const roots = []
const hash = value => createHash('sha256').update(value).digest('hex')
const file = 'tests/fixture.test.cjs'
const assertion = 'assert.equal(store.read()[0], 2)'
const base = `const { test } = require('node:test'); const assert = require('node:assert/strict');\nconst store = {};\ntest('original safety assertion', () => { ${assertion}; console.log('ORIGINAL_ASSERTION_REACHED'); });\n`
const approved = base.replace('const store = {};', 'const store = { read: () => [2] };')
const fullVerifyCommand = `"${process.execPath}" --test --test-reporter=tap`
const results = []
function git(cwd, args) {
  const p = spawnSync('git', ['-c', `safe.directory=${cwd}`, ...args], { cwd, encoding: 'utf8', timeout: 10000,
    env: { ...process.env, GIT_AUTHOR_DATE: '2026-10-05T00:00:00Z', GIT_COMMITTER_DATE: '2026-10-05T00:00:00Z' } })
  if (p.status !== 0) throw new Error(`synthetic git command failed ${args[0]}: ${p.stderr}`)
  return p.stdout.trim()
}
function runFull(cwd) {
  const p = spawnSync(process.execPath, ['--test', '--test-reporter=tap'], { cwd, encoding: 'utf8', timeout: 10000 })
  assert.equal(p.error, undefined)
  return { command: fullVerifyCommand, exit_code: p.status,
    original_assertion_position_marker_emitted: /^# ORIGINAL_ASSERTION_REACHED$/m.test(p.stdout),
    second_original_assertion_position_marker_emitted: /^# SECOND_ORIGINAL_ASSERTION_REACHED$/m.test(p.stdout),
    stdout_sha256: hash(p.stdout), stderr_sha256: hash(p.stderr),
    missing_fixture_read: (p.stdout + p.stderr).includes('store.read is not a function') }
}
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'adng37-study-')); roots.push(root)
  const dataDir = join(root, 'data'), cwd = join(dataDir, 'issue-37', 'repo')
  mkdirSync(join(cwd, 'tests'), { recursive: true })
  git(cwd, ['init', '-b', branchFor(37)]); git(cwd, ['config', 'user.name', 'Synthetic Research'])
  git(cwd, ['config', 'user.email', 'research@example.invalid']); git(cwd, ['config', 'core.autocrlf', 'false']); git(cwd, ['remote', 'add', 'origin', 'https://github.com/owner/project.git'])
  writeFileSync(join(cwd, file), base)
  writeFileSync(join(cwd, 'tests/product.test.cjs'), "require('node:test')('second original safety', () => { require('node:assert/strict').equal(2 + 3, 5); console.log('SECOND_ORIGINAL_ASSERTION_REACHED'); });\n")
  writeFileSync(join(cwd, 'product.cjs'), 'module.exports = 5;\n')
  git(cwd, ['add', '.']); git(cwd, ['commit', '-qm', 'base fixture missing read'])
  const baseSha = git(cwd, ['rev-parse', 'HEAD'])
  const issue = { number: 37, title: 'Synthetic missing fixture dependency', body: 'Preserve original safety assertion', state: 'open', user: { login: 'owner' }, labels: [] }
  const state = { repo: 'owner/project', base: 'main', issue, fingerprint: fingerprint(issue), status: 'queued', runs: 0, nextRunAt: 0, baseSha }
  const sourceConfig = join(root, 'source.json'), config = join(root, 'operator.json')
  writeFileSync(sourceConfig, JSON.stringify({ projectPath: cwd, dataDir: join(root, 'source-data'), worktreesDir: join(root, 'source-worktrees'), backlogFile: 'unused', engines: { writer: { adapter: 'opencode', model: 'synthetic' } }, defaultEngine: 'writer', verifyCommand: fullVerifyCommand, reviewEngine: 'synthetic-reviewer', judgeModel: 'synthetic-judge', artifactContract: false, maxAttempts: 1 }))
  const raw = { repo: state.repo, authors: ['owner'], sourceConfig, dataDir, engine: 'writer', enabled: false, publish: false,
    fixtureMaintenance: { kind: 'approved-fixture-v1', repo: state.repo, issue: issue.number, fingerprint: state.fingerprint, baseCommit: baseSha, file, approvedContent: approved, approvedSha256: hash(approved), protectedAssertions: [assertion], fullVerifyCommand } }
  writeFileSync(config, JSON.stringify(raw))
  const cfg = loadGithubConfig(config)
  assert.equal(cfg.enabled, false); assert.equal(cfg.publish, false)
  assert.equal(fixtureApproval(cfg, state).fullVerifyCommand, fullVerifyCommand)
  const baseline = runFull(cwd)
  assert.equal(baseline.exit_code, 1); assert.equal(baseline.original_assertion_position_marker_emitted, false)
  assert.equal(baseline.missing_fixture_read, true); assert.equal(baseline.second_original_assertion_position_marker_emitted, true)
  function candidate(mode) {
    if (mode === 'delete') rmSync(join(cwd, file))
    else writeFileSync(join(cwd, file), mode === 'skip' ? approved.replace("test('original", "test.skip('original") : mode === 'expected' ? approved.replace(assertion, 'assert.equal(0, 0)') : approved)
    if (mode === 'product') writeFileSync(join(cwd, 'product.cjs'), 'module.exports = 0;\n')
    if (['workflow', 'untracked-workflow'].includes(mode)) {
      mkdirSync(join(cwd, '.github/workflows'), { recursive: true })
      writeFileSync(join(cwd, '.github/workflows/bypass.yml'), 'continue-on-error: true\n')
    }
    git(cwd, ['add', '-A', 'tests'])
    if (mode === 'product') git(cwd, ['add', 'product.cjs'])
    if (mode === 'workflow') git(cwd, ['add', '.github'])
    git(cwd, ['commit', '-qm', `synthetic candidate ${mode}`])
    state.commit = git(cwd, ['rev-parse', 'HEAD'])
    return state.commit
  }
  return { root, cwd, cfg, raw, config, state, baseline, candidate }
}
function record(f, id, family, expectation, actual, reason, ci) {
  assert.equal(actual, expectation, id)
  results.push({ id, family, expected_decision: expectation, actual_decision: actual, rejection_reason: reason || null,
    base_sha: f.state.baseSha, candidate_sha: f.state.commit, baseline: f.baseline, candidate_full_command: ci, protected_assertion_literal_preserved: existsSync(join(f.cwd, file)) && readFileSync(join(f.cwd, file), 'utf8').includes(assertion),
    frozen_command: fullVerifyCommand, approved_fixture_sha256: hash(approved),
    approval_outside_repo_run_worktrees: !f.config.startsWith(f.cwd) && !f.config.startsWith(f.cfg.dataDir),
    production_enabled: false, production_publish: false })
}
try {
  for (const mode of ['approved', 'delete', 'skip', 'expected', 'product', 'workflow', 'untracked-workflow']) {
    const f = fixture(), commit = f.candidate(mode), ci = runFull(f.cwd)
    let accepted = false, reason
    try { assertFixtureCandidate(f.cfg, f.state, f.cwd, commit); accepted = true } catch (error) { reason = String(error) }
    if (mode === 'approved') {
      assert.equal(ci.exit_code, 0); assert.equal(ci.original_assertion_position_marker_emitted, true); assert.equal(ci.second_original_assertion_position_marker_emitted, true)
      assert.equal(runtimeConfig(f.cfg, f.state).verifyCommand, fullVerifyCommand)
    }
    record(f, mode, mode === 'approved' ? 'missing-fixture-dependency' : ['delete', 'skip', 'expected'].includes(mode) ? 'false-test-fix' : 'unapproved-product-or-workflow', mode === 'approved' ? 'ALLOW_EXACT_APPROVED_FIXTURE' : 'REJECT', accepted ? 'ALLOW_EXACT_APPROVED_FIXTURE' : 'REJECT', reason, ci)
  }
  {
    const f = fixture(); f.candidate('approved')
    mkdirSync(join(f.cwd, 'tests/regressions'))
    writeFileSync(join(f.cwd, 'tests/regressions/github-37.test.cjs'), "require('node:test')('additive regression', () => require('node:assert/strict').equal(require('../../product.cjs'), 5));\n")
    git(f.cwd, ['add', 'tests/regressions']); git(f.cwd, ['commit', '-qm', 'additive regression cannot authorize existing-test edit'])
    f.state.commit = git(f.cwd, ['rev-parse', 'HEAD'])
    const ordinary = GithubConfigSchema.parse({ ...f.raw, fixtureMaintenance: undefined })
    assert.ok(runtimeConfig(ordinary, f.state).extraDirective.includes('Do not change existing tests.'))
    let rejected = false, reason
    try { await verifyRegression(ordinary, f.state, f.cwd, f.state.commit, 10000) } catch (error) { rejected = true; reason = String(error) }
    assert.ok(reason.includes('Existing tests must not be modified'))
    record(f, 'unchanged-bugfix-refusal', 'missing-fixture-dependency', 'REJECT', rejected ? 'REJECT' : 'ALLOW', reason, runFull(f.cwd))
  }
  for (const mode of ['issue-self-approval', 'weaken-full-command']) {
    const f = fixture(); f.candidate('approved')
    let rejected = false, reason
    try {
      if (mode === 'issue-self-approval') {
        f.state.issue.body = JSON.stringify(f.raw.fixtureMaintenance)
        runtimeConfig(GithubConfigSchema.parse(f.raw), f.state)
      } else {
        writeFileSync(f.config, JSON.stringify({ ...f.raw, verifyCommand: 'node -e "process.exit(0)"' }))
        runtimeConfig(loadGithubConfig(f.config), f.state)
      }
    } catch (error) { rejected = true; reason = String(error) }
    record(f, mode, 'untrusted-authority', 'REJECT', rejected ? 'REJECT' : 'ALLOW', reason, runFull(f.cwd))
  }
  const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
  const receipt = { schema_version: 1, generated_at: new Date().toISOString(), research_issue: 37, decision: 'NARROW',
    implementation_source_pin: '2f158364edf41f2f9e323d1967a05f741683ddb2', implementation_tree: 'c953c51cb9991acca066433311e0ec972b085091',
    original_source_parent: 'f5892611c856502b8a0a754250689e5ac101c390', current_main_observed: 'a2378aa6fea3605f596e3ee264adbb2eb04c9010',
    script_sha256: hash(readFileSync(fileURLToPath(import.meta.url))), node: process.version, command: 'node docs/research/issue-37-offline-study.mjs',
    source_heads: git(repo, ['rev-parse', 'HEAD']), frozen_original_verification: fullVerifyCommand, case_count: results.length,
    cases: results, no_provider_requests: true, no_production_configuration: true, no_auto_enable: true, no_remote_effects: true,
    scope: 'Actual imported disabled historical guard/source, synthetic repositories and simulated external operator allowlist. Green full commands alone do not authorize edits; 9 negative decisions remain rejected. No current-main integration, operator production approval, independent human review, general semantic weakening detector or host adoption is claimed.' }
  const output = process.argv[2] || join(repo, 'docs/research/issue-37-offline-study-results.json')
  writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n')
  console.log(`NARROW ${results.length} cases; expected=actual all; one exact fixture allowed, nine rejected; output=${output}`)
} finally { for (const root of roots) if (existsSync(root)) rmSync(root, { recursive: true, force: true }) }
