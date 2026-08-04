import { z } from 'zod'

const COMMIT_HASH = /^[0-9a-f]{4,64}$/i
const CommitHashSchema = z.string().regex(COMMIT_HASH)
const RepoPathSchema = z.string().trim().min(1)

export const AutoGoalAcceptanceSchema = z.object({
  command: z.string().trim().min(1),
  executed: z.boolean(),
  exitCode: z.number().int().nullable(),
  output: z.string(),
}).strict()

const ReportedEvidenceSchema = z.object({
  expectedChanges: z.array(RepoPathSchema),
  baseCommitHash: CommitHashSchema,
  commitHash: CommitHashSchema,
  headCommitHash: CommitHashSchema,
  acceptance: AutoGoalAcceptanceSchema,
  changedFiles: z.array(RepoPathSchema),
  resultSummary: z.string().trim().min(1),
  timestamp: z.string().datetime({ offset: true }),
}).strict()

export const AutoGoalCompletionEvidenceSchema = z.object({
  expectedChanges: z.array(RepoPathSchema),
  baseCommitHash: CommitHashSchema,
  commitHash: CommitHashSchema,
  baseCommitValid: z.boolean(),
  commitValid: z.boolean(),
  acceptance: AutoGoalAcceptanceSchema,
  headCommitHash: CommitHashSchema,
  changedFiles: z.array(RepoPathSchema),
  diff: z.string(),
  resultSummary: z.string().trim().min(1),
  timestamp: z.string().datetime({ offset: true }),
  evidence: ReportedEvidenceSchema,
}).strict()

export type AutoGoalCompletionEvidence = z.infer<typeof AutoGoalCompletionEvidenceSchema>

export type AutoGoalCompletionGateResult =
  | { ok: true }
  | { ok: false; reason: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function has(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key) && value[key] !== undefined
}

function schemaReason(input: unknown, error: z.ZodError): string {
  if (!isRecord(input)) return 'evidence-missing'
  if (!has(input, 'evidence')) return 'evidence-missing'
  const issue = error.issues[0]
  const [first, second] = issue?.path ?? []
  if (first === 'baseCommitHash') return has(input, 'baseCommitHash') ? 'base-commit-invalid' : 'base-commit-missing'
  if (first === 'commitHash') return has(input, 'commitHash') ? 'commit-invalid' : 'commit-missing'
  if (first === 'baseCommitValid') return 'base-commit-validity-missing'
  if (first === 'commitValid') return 'commit-validity-missing'
  if (first === 'headCommitHash') return has(input, 'headCommitHash') ? 'head-commit-invalid' : 'head-commit-missing'
  if (first === 'expectedChanges') return 'expected-changes-missing'
  if (first === 'acceptance') return 'acceptance-not-run'
  if (first === 'changedFiles') return 'changed-files-missing'
  if (first === 'diff') return 'diff-missing'
  if (first === 'resultSummary') return 'result-summary-missing'
  if (first === 'timestamp') return 'timestamp-invalid'
  if (first === 'evidence') {
    if (second === 'expectedChanges') return 'evidence-expected-changes-missing'
    if (second === 'baseCommitHash') return 'evidence-base-commit-missing'
    if (second === 'commitHash') return 'evidence-commit-missing'
    if (second === 'headCommitHash') return 'evidence-head-missing'
    if (second === 'acceptance') return 'evidence-test-result-missing'
    if (second === 'changedFiles') return 'evidence-changed-files-missing'
    if (second === 'resultSummary') return 'evidence-result-summary-missing'
    if (second === 'timestamp') return 'evidence-timestamp-missing'
  }
  return `evidence-schema-invalid:${(issue?.path ?? []).join('.') || 'root'}`
}

function normalizePath(path: string): string {
  return path.trim().replace(/\\/g, '/').replace(/^(?:\.\/)+/, '')
}

function sameFiles(left: readonly string[], right: readonly string[]): boolean {
  const normalizedLeft = left.map(normalizePath)
  const normalizedRight = right.map(normalizePath)
  return normalizedLeft.length === new Set(normalizedLeft).size
    && normalizedRight.length === new Set(normalizedRight).size
    && normalizedLeft.length === normalizedRight.length
    && normalizedLeft.every(path => normalizedRight.includes(path))
}

function sameAcceptance(left: AutoGoalAcceptance, right: AutoGoalAcceptance): boolean {
  return left.command === right.command
    && left.executed === right.executed
    && left.exitCode === right.exitCode
    && left.output === right.output
}

type AutoGoalAcceptance = z.infer<typeof AutoGoalAcceptanceSchema>

/**
 * 只接受完整、可稽核的 auto-goal 完成證據；Git validity 由呼叫端以實際 Git 查詢填入。
 *
 * baseCommitValid／commitValid 必須來自 `git rev-parse --verify` 類的實際結果，
 * 不以 hash 字串格式冒充 commit 存在性。
 */
export function evaluateAutoGoalCompletionGate(input: unknown): AutoGoalCompletionGateResult {
  const parsed = AutoGoalCompletionEvidenceSchema.safeParse(input)
  if (!parsed.success) return { ok: false, reason: schemaReason(input, parsed.error) }

  const value = parsed.data
  if (!value.baseCommitValid) return { ok: false, reason: 'base-commit-invalid' }
  if (!value.commitValid) return { ok: false, reason: 'commit-invalid' }
  if (value.commitHash !== value.headCommitHash) return { ok: false, reason: 'head-commit-mismatch' }
  if (!value.diff.trim() || value.changedFiles.length === 0) return { ok: false, reason: 'empty-diff' }

  for (const expected of value.expectedChanges) {
    if (!value.changedFiles.map(normalizePath).includes(normalizePath(expected))) {
      return { ok: false, reason: `missing-expected-change:${normalizePath(expected)}` }
    }
  }

  if (!value.acceptance.executed) return { ok: false, reason: 'acceptance-not-run' }
  if (value.acceptance.exitCode === null) return { ok: false, reason: 'acceptance-exit-code-missing' }
  if (value.acceptance.exitCode !== 0) {
    return { ok: false, reason: `acceptance-failed:exit=${value.acceptance.exitCode}` }
  }

  const reported = value.evidence
  if (reported.baseCommitHash !== value.baseCommitHash) return { ok: false, reason: 'evidence-base-commit-mismatch' }
  if (reported.commitHash !== value.commitHash) return { ok: false, reason: 'evidence-commit-mismatch' }
  if (reported.headCommitHash !== value.headCommitHash) return { ok: false, reason: 'evidence-head-mismatch' }
  if (!sameFiles(reported.expectedChanges, value.expectedChanges)) {
    return { ok: false, reason: 'evidence-expected-changes-mismatch' }
  }
  if (!sameAcceptance(reported.acceptance, value.acceptance)) {
    return { ok: false, reason: 'evidence-test-result-mismatch' }
  }
  if (!sameFiles(reported.changedFiles, value.changedFiles)) {
    return { ok: false, reason: 'evidence-changed-files-mismatch' }
  }
  if (reported.resultSummary !== value.resultSummary) return { ok: false, reason: 'evidence-result-summary-mismatch' }
  if (reported.timestamp !== value.timestamp) return { ok: false, reason: 'evidence-timestamp-mismatch' }

  return { ok: true }
}
