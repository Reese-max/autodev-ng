import { execFileSync } from 'node:child_process'
import { strict as assert } from 'node:assert'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { firstMissingArtifact } from '../dist/engines/artifact-contract-git.js'
import { evaluateAutoGoalCompletionGate } from '../dist/engines/auto-goal-completion-gate.js'

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  }).trim()
}

function isCommit(cwd, hash) {
  try {
    git(cwd, ['cat-file', '-e', `${hash}^{commit}`])
    return true
  } catch {
    return false
  }
}

function createEvidence() {
  const cwd = mkdtempSync(join(tmpdir(), 'adng-auto-goal-gate-'))
  try {
    git(cwd, ['init', '-b', 'main'])
    git(cwd, ['config', 'user.email', 'adng-test@example.com'])
    git(cwd, ['config', 'user.name', 'adng-test'])
    writeFileSync(join(cwd, 'README.md'), '# fixture\n')
    git(cwd, ['add', '--all'])
    git(cwd, ['commit', '-m', 'chore: init'])
    const baseCommitHash = git(cwd, ['rev-parse', 'HEAD'])

    mkdirSync(join(cwd, 'src', 'engines'), { recursive: true })
    writeFileSync(join(cwd, 'src', 'engines', 'target.ts'), 'export const target = true\n')
    git(cwd, ['add', '--all'])
    git(cwd, ['commit', '-m', 'feat: add target'])
    const commitHash = git(cwd, ['rev-parse', 'HEAD'])
    const changedFiles = git(cwd, ['diff', '--name-only', '-z', `${baseCommitHash}..${commitHash}`, '--']).split('\0').filter(Boolean)
    const diff = git(cwd, ['diff', `${baseCommitHash}..${commitHash}`, '--'])
    const acceptance = {
      command: 'node --test tests/d13f95b2d9cc3d14-auto-goal-completion-gate.test.mjs',
      executed: true,
      exitCode: 0,
      output: '1 passed',
    }
    const evidence = {
      expectedChanges: ['src/engines/target.ts'],
      baseCommitHash,
      commitHash,
      baseCommitValid: isCommit(cwd, baseCommitHash),
      commitValid: isCommit(cwd, commitHash),
      acceptance,
      headCommitHash: commitHash,
      changedFiles,
      diff,
      resultSummary: 'pass: 1 passed',
      timestamp: '2026-08-04T10:00:00.000Z',
      evidence: {
        expectedChanges: ['src/engines/target.ts'], baseCommitHash, commitHash, headCommitHash: commitHash,
        acceptance, changedFiles, diff, resultSummary: 'pass: 1 passed', timestamp: '2026-08-04T10:00:00.000Z',
      },
    }
    return { cwd, baseCommitHash, commitHash, evidence }
  } catch (error) {
    rmSync(cwd, { recursive: true, force: true, maxRetries: 5 })
    throw error
  }
}

test('完成證據只接受真實 Git commit 的 diff，commit range 不會被當成交付物路徑', () => {
  const fixture = createEvidence()
  try {
    assert.equal(fixture.evidence.baseCommitValid, true)
    assert.equal(fixture.evidence.commitValid, true)
    assert.deepEqual(fixture.evidence.changedFiles, ['src/engines/target.ts'])
    assert.match(fixture.evidence.diff, /diff --git a\/src\/engines\/target\.ts/)
    assert.deepEqual(evaluateAutoGoalCompletionGate(fixture.evidence), { ok: true })
    assert.equal(
      firstMissingArtifact(fixture.cwd, `建立 \`${fixture.baseCommitHash}..${fixture.commitHash}\` 對帳。`, fixture.baseCommitHash, fixture.commitHash),
      undefined,
    )
  } finally {
    rmSync(fixture.cwd, { recursive: true, force: true, maxRetries: 5 })
  }
})

test('只有格式像 hash 的字串不會冒充有效 commit', () => {
  const fixture = createEvidence()
  try {
    const invalidCommit = 'f'.repeat(40)
    assert.equal(isCommit(fixture.cwd, invalidCommit), false)
    const evidence = {
      ...fixture.evidence,
      commitHash: invalidCommit,
      commitValid: isCommit(fixture.cwd, invalidCommit),
      headCommitHash: invalidCommit,
      evidence: { ...fixture.evidence.evidence, commitHash: invalidCommit, headCommitHash: invalidCommit },
    }
    assert.deepEqual(evaluateAutoGoalCompletionGate(evidence), { ok: false, reason: 'commit-invalid' })
  } finally {
    rmSync(fixture.cwd, { recursive: true, force: true, maxRetries: 5 })
  }
})
