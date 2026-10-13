import { randomUUID } from 'node:crypto'
import Database from 'better-sqlite3'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { IssueState } from '../../src/github/state.js'

type StateSlice = Pick<IssueState, 'status' | 'runs'> & Partial<Pick<IssueState, 'commit' | 'detail' | 'revision'>>
type FailureAttempt = { sequence: number; failureClass: string; detail: string }

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
    const row = db.prepare('SELECT seq AS sequence, failure_class AS failureClass, detail FROM attempts WHERE ok=0 ORDER BY seq ASC LIMIT 1')
      .get() as FailureAttempt | undefined
    return row ? { attempt: row, lookup: 'found' as const } : { attempt: null, lookup: 'no-failed-attempt' as const }
  } catch {
    return { attempt: null, lookup: 'read-error' as const }
  } finally { db?.close() }
}

const commit = (value: string | undefined) => value && /^[a-f0-9]{40,64}$/i.test(value) ? value : null

export function redactDiagnosticText(value: string | undefined, fixtureRoot?: string): string | null {
  if (!value) return null
  let text = value.replace(/\s+/g, ' ').trim()
  if (fixtureRoot) {
    for (const root of [fixtureRoot, fixtureRoot.replaceAll('\\', '/')]) {
      if (root) text = text.replaceAll(root, '[FIXTURE_PATH]')
    }
  }
  text = text
    .replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,})\b/gi, '[REDACTED]')
    .replace(/\b([A-Z0-9_]*(?:TOKEN|SECRET|API[_-]?KEY|PASSWORD)[A-Z0-9_]*)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .replace(/\b[A-Za-z]:[\\/][^\s"'<>]+/g, '[LOCAL_PATH]')
    .replace(/\\\\[^\\\s]+\\[^\\\s]+(?:\\[^\s"'<>]*)?/g, '[LOCAL_PATH]')
    .replace(/(^|[\s=(])\/(?:Users|home|tmp|private|workspace|runner|var|opt|mnt|agent|build)\/[^\s"'<>]*/gi, '$1[LOCAL_PATH]')
  return text.slice(0, 800)
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
  const value = safeDetail.toLowerCase()
  if (value.includes('original reported probe')) return { gate: 'repair.original-probe', subreason: safeDetail }
  if (value.includes('repair baseline')) return { gate: 'repair.revision-baseline', subreason: safeDetail }
  if (value.includes('repair setup') || value.includes('repair cli preflight')) return { gate: 'repair.setup-or-preflight', subreason: safeDetail }
  if (value.includes('project acceptance') || value.includes('acceptance failed')) return { gate: 'verification.acceptance', subreason: safeDetail }
  if (value.includes('quality')) return { gate: 'verification.quality', subreason: safeDetail }
  if (value.includes('regression')) return { gate: 'verification.regression', subreason: safeDetail }
  if (value.includes('independent review') || value.includes('review rejected')) return { gate: 'verification.independent-review', subreason: safeDetail }
  if (value.includes('verify 拒收') || value.includes('verify rejected')) return { gate: 'verification.kernel', subreason: safeDetail }
  if (value.includes('no-commit')) return { gate: 'worker.commit', subreason: safeDetail }
  if (value.includes('ownership-drift')) return { gate: 'ownership', subreason: safeDetail }
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
      candidate: commit(input.candidateCommit),
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
