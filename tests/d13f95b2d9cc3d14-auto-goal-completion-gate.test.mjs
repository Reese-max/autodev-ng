import { expect, test } from 'vitest'
import { evaluateAutoGoalCompletionGate } from '../src/engines/auto-goal-completion-gate.js'

const acceptance = {
  command: 'npx vitest run tests/d13f95b2d9cc3d14-auto-goal-completion-gate.test.mjs',
  executed: true,
  exitCode: 0,
  output: '1 passed',
}
const diff = 'diff --git a/src/engines/target.ts b/src/engines/target.ts\n+export const target = true'

function validEvidence() {
  return {
    expectedChanges: ['src/engines/target.ts'],
    baseCommitHash: '1111111',
    commitHash: '2222222',
    baseCommitValid: true,
    commitValid: true,
    acceptance: { ...acceptance },
    headCommitHash: '2222222',
    changedFiles: ['src/engines/target.ts', 'tests/d13f95b2d9cc3d14-auto-goal-completion-gate.test.mjs'],
    diff,
    resultSummary: 'pass: 1 passed',
    timestamp: '2026-08-04T10:00:00.000Z',
    evidence: {
      expectedChanges: ['src/engines/target.ts'],
      baseCommitHash: '1111111',
      commitHash: '2222222',
      headCommitHash: '2222222',
      acceptance: { ...acceptance },
      changedFiles: ['src/engines/target.ts', 'tests/d13f95b2d9cc3d14-auto-goal-completion-gate.test.mjs'],
      diff,
      resultSummary: 'pass: 1 passed',
      timestamp: '2026-08-04T10:00:00.000Z',
    },
  }
}

function attemptCompletion(mutate = value => value) {
  const completionMarkers = []
  const successEvents = []
  const verdict = evaluateAutoGoalCompletionGate(mutate(validEvidence()))
  if (verdict.ok) {
    completionMarkers.push('adng:done')
    successEvents.push('task-done')
  }
  return { verdict, completionMarkers, successEvents }
}

const rejected = [
  ['no-commit', value => ({ ...value, commitHash: undefined }), 'commit-missing'],
  ['commit 不在 HEAD', value => ({ ...value, headCommitHash: '3333333' }), 'head-commit-mismatch'],
  ['空 commit', value => ({ ...value, changedFiles: [], diff: '' }), 'empty-diff'],
  ['commit 不含預期變更', value => ({ ...value, changedFiles: ['tests/other.test.ts'] }), 'missing-expected-change:src/engines/target.ts'],
  ['未跑專屬驗收', value => ({ ...value, acceptance: { ...value.acceptance, executed: false } }), 'acceptance-not-run'],
  ['專屬驗收失敗', value => ({ ...value, acceptance: { ...value.acceptance, exitCode: 1 } }), 'acceptance-failed:exit=1'],
  ['evidence 缺失', value => ({ ...value, evidence: undefined }), 'evidence-missing'],
  ['evidence commit 與實際不一致', value => ({ ...value, evidence: { ...value.evidence, commitHash: '3333333' } }), 'evidence-commit-mismatch'],
  ['evidence 測試與實際不一致', value => ({ ...value, evidence: { ...value.evidence, acceptance: { ...value.acceptance, output: '0 passed' } } }), 'evidence-test-result-mismatch'],
  ['evidence diff 與實際不一致', value => ({ ...value, evidence: { ...value.evidence, diff: `${value.diff}\n+wrong` } }), 'evidence-diff-mismatch'],
]

test.each(rejected)('%s：拒絕且不產生完成標記或成功事件', (_name, mutate, reason) => {
  expect(attemptCompletion(mutate)).toEqual({
    verdict: { ok: false, reason },
    completionMarkers: [],
    successEvents: [],
  })
})

test('唯一合法完成：預期變更、HEAD commit、專屬驗收與 evidence 全部完整一致', () => {
  expect(attemptCompletion()).toEqual({
    verdict: { ok: true },
    completionMarkers: ['adng:done'],
    successEvents: ['task-done'],
  })
})
