import { expect, test } from 'vitest'
import {
  AutoGoalCompletionEvidenceSchema,
  evaluateAutoGoalCompletionGate,
  type AutoGoalCompletionEvidence,
} from '../src/engines/auto-goal-completion-gate.js'

const acceptance = {
  command: 'npm run test -- tests/target.test.ts',
  executed: true,
  exitCode: 0,
  output: '1 passed',
}

function evidence(overrides: Record<string, unknown> = {}): AutoGoalCompletionEvidence {
  return {
    expectedChanges: ['src/engines/target.ts'],
    baseCommitHash: '1111111',
    commitHash: '2222222',
    baseCommitValid: true,
    commitValid: true,
    acceptance,
    headCommitHash: '2222222',
    changedFiles: ['src/engines/target.ts', 'tests/target.test.ts'],
    diff: 'diff --git a/src/engines/target.ts b/src/engines/target.ts\n+change',
    evidence: {
      baseCommitHash: '1111111',
      commitHash: '2222222',
      headCommitHash: '2222222',
      acceptance,
      changedFiles: ['src/engines/target.ts', 'tests/target.test.ts'],
    },
    ...overrides,
  }
}

test('schema 明確要求完整 Git、驗收、diff 與 evidence 欄位', () => {
  expect(AutoGoalCompletionEvidenceSchema.safeParse(evidence()).success).toBe(true)
  expect(evaluateAutoGoalCompletionGate({})).toEqual({ ok: false, reason: 'evidence-missing' })
})

test('完整且彼此一致的證據才允許完成', () => {
  expect(evaluateAutoGoalCompletionGate(evidence())).toEqual({ ok: true })
})

test.each([
  ['缺 base commit', { baseCommitHash: undefined }, 'base-commit-missing'],
  ['缺候選 commit', { commitHash: undefined }, 'commit-missing'],
  ['base 不是有效 commit', { baseCommitValid: false }, 'base-commit-invalid'],
  ['候選不是有效 commit', { commitValid: false }, 'commit-invalid'],
  ['候選不在 HEAD', { headCommitHash: '3333333' }, 'head-commit-mismatch'],
  ['diff 為空', { diff: '' }, 'empty-diff'],
  ['沒有變更檔', { changedFiles: [] }, 'empty-diff'],
  ['缺預期變更', { changedFiles: ['tests/target.test.ts'] }, 'missing-expected-change:src/engines/target.ts'],
  ['驗收未執行', { acceptance: { ...acceptance, executed: false } }, 'acceptance-not-run'],
  ['驗收失敗', { acceptance: { ...acceptance, exitCode: 1 } }, 'acceptance-failed:exit=1'],
  ['缺 evidence', { evidence: undefined }, 'evidence-missing'],
  ['evidence commit 不一致', { evidence: { ...evidence().evidence, commitHash: '3333333' } }, 'evidence-commit-mismatch'],
  ['evidence 測試結果不一致', { evidence: { ...evidence().evidence, acceptance: { ...acceptance, output: 'different' } } }, 'evidence-test-result-mismatch'],
  ['evidence 變更檔不一致', { evidence: { ...evidence().evidence, changedFiles: ['src/other.ts'] } }, 'evidence-changed-files-mismatch'],
] as const)('%s → fail-closed（%s）', (_label, override, reason) => {
  expect(evaluateAutoGoalCompletionGate(evidence(override))).toEqual({ ok: false, reason })
})

test('schema／evidence 欄位型別錯誤也拒絕，不以部分證據放行', () => {
  expect(evaluateAutoGoalCompletionGate({ ...evidence(), evidence: { commitHash: '2222222' } })).toEqual({
    ok: false,
    reason: 'evidence-base-commit-missing',
  })
})
