import { randomUUID } from 'node:crypto'
import Database from 'better-sqlite3'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { IssueState } from '../../src/github/state.js'
import { redactCli } from '../../src/engines/cli-diagnostics.js'

type StateSlice = Pick<IssueState, 'status' | 'runs'> & Partial<Pick<IssueState, 'commit' | 'detail' | 'revision'>>
type FailureAttempt = { sequence: number; failureClass: string; detail: string; candidateCommit?: string | null }

export interface FollowupDiagnosticInput {
  before?: StateSlice | null
  after?: StateSlice | null
  firstPublishedCommit?: string
  candidateCommit?: string
  attempt?: FailureAttempt | null
  attemptLookup?: 'found' | 'no-failed-attempt' | 'run-db-missing' | 'read-error'
  fixtureRoot?: string
}

export function readFirstFailedAttempt(file: string) {
  if (!existsSync(file)) return { attempt: null, lookup: 'run-db-missing' as const }
  let db: Database.Database | undefined
  try {
    db = new Database(file, { readonly: true, fileMustExist: true })
    const row = db.prepare(`SELECT seq AS sequence, failure_class AS failureClass, detail,
      (SELECT detail FROM attempts AS worker WHERE worker.task_id=failed.task_id AND worker.ok=1
        AND worker.seq<failed.seq ORDER BY worker.seq DESC LIMIT 1) AS candidateCommit
      FROM attempts AS failed WHERE ok=0 ORDER BY seq ASC LIMIT 1`)
      .get() as FailureAttempt | undefined
    return row ? { attempt: row, lookup: 'found' as const } : { attempt: null, lookup: 'no-failed-attempt' as const }
  } catch {
    return { attempt: null, lookup: 'read-error' as const }
  } finally { db?.close() }
}

const commit = (value: string | null | undefined) => value && /^[a-f0-9]{40,64}$/i.test(value) ? value : null

export function redactDiagnosticText(value: string | undefined, fixtureRoot?: string): string | null {
  if (!value) return null
  let text = redactCli(value)
  if (fixtureRoot) {
    for (const root of [fixtureRoot, fixtureRoot.replaceAll('\\', '/')]) {
      if (root) text = text.replaceAll(root, '[FIXTURE_PATH]')
    }
  }
  // ponytail: unquoted paths consume the clause; use structured receipts if finer detail is needed.
  text = text
    .replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,})\b/gi, '[REDACTED]')
    .replace(/\b([A-Z0-9_]*(?:TOKEN|SECRET|API[_-]?KEY|PASSWORD)[A-Z0-9_]*)["']?\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;}]+)/gi, '$1=[REDACTED]')
    .replace(/(["'])(?:[A-Za-z]:[\\/]|\\\\|\/)[^\r\n"']*\1/g, '[LOCAL_PATH]')
    .replace(/\b[A-Za-z]:[\\/][^\r\n"'<>;,]+/g, '[LOCAL_PATH]')
    .replace(/\\\\[^\r\n"'<>;,]+/g, '[LOCAL_PATH]')
    .replace(/(^|[\s=(])\/(?!\/)[^\r\n"'<>;,]+/g, '$1[LOCAL_PATH]')
  return text.replace(/\s+/g, ' ').trim().slice(0, 800)
}

function stateSnapshot(state: StateSlice | null | undefined, fixtureRoot?: string) {
  if (!state) return null
  return {
    status: state.status,
    runNumber: state.runs,
    commit: commit(state.commit),
    detail: redactDiagnosticText(state.detail, fixtureRoot),
    revision: state.revision ? { round: state.revision.round, baseCommit: commit(state.revision.baseCommit) } : null,
  }
}

function gateFromDetail(detail: string | undefined, fixtureRoot?: string): { gate: string; subreason: string | null } {
  const safeDetail = redactDiagnosticText(detail, fixtureRoot)
  if (!safeDetail || ['failed', 'engine-error'].includes(safeDetail.toLowerCase()))
    return { gate: 'unknown', subreason: 'The stored result did not retain an inner gate reason.' }
  const value = detail!.trim().toLowerCase().replace(/^verify (?:拒收|rejected)[：:]\s*/, '')
  if (/^(?:verify-(?:fail|blocked)|judge-mismatch):/.test(value)) return { gate: 'verification.kernel', subreason: safeDetail }
  if (/^(?:review-(?:reject|blocked):|independent review|review rejected|free-policy:.*independent)/.test(value))
    return { gate: 'verification.independent-review', subreason: safeDetail }
  if (value.startsWith('original reported probe')) return { gate: 'repair.original-probe', subreason: safeDetail }
  if (/^repair (?:revision )?baseline/.test(value)) return { gate: 'repair.revision-baseline', subreason: safeDetail }
  if (/^repair (?:setup|cli preflight)/.test(value)) return { gate: 'repair.setup-or-preflight', subreason: safeDetail }
  // job.ts wraps regression, acceptance and quality exceptions in the same prefix.
  const inner = value.replace(/^regression-fail:\s*(?:error:\s*)?/, '')
  if (/^(?:project acceptance|acceptance (?:failed|changed))\b/.test(inner)) return { gate: 'verification.acceptance', subreason: safeDetail }
  if (/^quality(?: gate\b|-contract-)/.test(inner)) return { gate: 'verification.quality', subreason: safeDetail }
  if (/^regression\b/.test(value)) return { gate: 'verification.regression', subreason: safeDetail }
  if (/^verify (?:拒收|rejected)/.test(value)) return { gate: 'verification.kernel', subreason: safeDetail }
  if (value.startsWith('no-commit')) return { gate: 'worker.commit', subreason: safeDetail }
  if (value.startsWith('ownership-drift')) return { gate: 'ownership', subreason: safeDetail }
  return { gate: 'unknown', subreason: safeDetail }
}

export function buildFollowupDiagnostic(input: FollowupDiagnosticInput) {
  const rawReason = input.attempt?.detail ?? input.after?.detail
  const firstFailingGate = gateFromDetail(rawReason, input.fixtureRoot)
  return {
    schema: 'autodev-ng.github-repair-followup-diagnostic/v1',
    scenario: 'synthetic-same-pr-follow-up',
    runtime: { platform: process.platform, nodeMajor: process.versions.node.split('.')[0] },
    firstFailingGate: {
      ...firstFailingGate,
      source: input.attempt ? 'first-failed-run-db-attempt' : input.attemptLookup ?? 'runner-state-detail',
      failureClass: input.attempt?.failureClass ?? null,
      attemptSequence: input.attempt?.sequence ?? null,
    },
    commits: {
      firstPublished: commit(input.firstPublishedCommit),
      revisionBase: commit(input.before?.revision?.baseCommit ?? input.after?.revision?.baseCommit),
      candidate: commit(input.attempt?.candidateCommit ?? input.candidateCommit),
      persistedAfter: commit(input.after?.commit),
    },
    revisionRound: input.before?.revision?.round ?? input.after?.revision?.round ?? null,
    runNumber: { before: input.before?.runs ?? null, after: input.after?.runs ?? null },
    stateBefore: stateSnapshot(input.before, input.fixtureRoot),
    stateAfter: stateSnapshot(input.after, input.fixtureRoot),
  }
}

export function writeFollowupDiagnostic(input: FollowupDiagnosticInput, directory = process.env.AUTODEV_GH_REPAIR_DIAGNOSTIC_DIR || tmpdir()): string {
  mkdirSync(directory, { recursive: true })
  const file = join(directory, `autodev-ng-issue16-followup-${randomUUID()}.json`)
  const diagnostic = buildFollowupDiagnostic(input)
  writeFileSync(file, `${JSON.stringify(diagnostic, null, 2)}\n`, { flag: 'wx' })
  console.error(`[issue-16-follow-up-diagnostic] ${JSON.stringify(diagnostic)}`)
  return file
}
