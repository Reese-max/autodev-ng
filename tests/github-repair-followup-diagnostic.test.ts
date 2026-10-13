import Database from 'better-sqlite3'
import { afterEach, expect, test, vi } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildFollowupDiagnostic, readFirstFailedAttempt, writeFollowupDiagnostic } from './helpers/github-repair-followup-diagnostic.js'

afterEach(() => vi.restoreAllMocks())

test('Issue 16 diagnostic retains the first synthetic failing gate and redacts private paths and tokens', () => {
  const fixtureRoot = 'C:\\Users\\runner\\AppData\\Local\\Temp\\adng-repair-fixture'
  const diagnostic = buildFollowupDiagnostic({
    fixtureRoot,
    firstPublishedCommit: 'a'.repeat(40),
    candidateCommit: 'b'.repeat(40),
    attemptLookup: 'found',
    attempt: {
      sequence: 3,
      failureClass: 'task',
      detail: `verify rejected: regression-fail: command failed at ${fixtureRoot}\\private\\file; token=ghp_1234567890abcdefghijklmno`,
    },
    before: { status: 'queued', runs: 1, commit: 'a'.repeat(40), revision: { round: 1, baseCommit: 'a'.repeat(40), feedback: 'synthetic', key: 'synthetic' } },
    after: { status: 'blocked', runs: 2, commit: 'a'.repeat(40), detail: 'failed', revision: { round: 1, baseCommit: 'a'.repeat(40), feedback: 'synthetic', key: 'synthetic' } },
  })
  const serialized = JSON.stringify(diagnostic)
  expect(diagnostic.firstFailingGate).toMatchObject({ gate: 'verification.regression', source: 'first-failed-run-db-attempt', failureClass: 'task', attemptSequence: 3 })
  expect(diagnostic.revisionRound).toBe(1)
  expect(diagnostic.runNumber).toEqual({ before: 1, after: 2 })
  expect(diagnostic.stateBefore).toMatchObject({ status: 'queued', runNumber: 1 })
  expect(diagnostic.stateAfter).toMatchObject({ status: 'blocked', runNumber: 2 })
  expect(serialized).not.toContain('C:\\Users\\runner')
  expect(serialized).not.toContain('ghp_1234567890')
  expect(serialized).toContain('[FIXTURE_PATH]')
  expect(serialized).toContain('[REDACTED]')
})

test('Issue 16 diagnostic marks a generic failed result as unknown without inventing an inner gate', () => {
  const diagnostic = buildFollowupDiagnostic({ after: { status: 'blocked', runs: 2, detail: 'failed' }, attemptLookup: 'no-failed-attempt' })
  expect(diagnostic.firstFailingGate).toMatchObject({ gate: 'unknown', subreason: 'The stored result did not retain an inner gate reason.' })
})

test('Issue 16 artifact reads the earliest failed synthetic attempt and writes only the redacted JSON record', () => {
  const directory = mkdtempSync(join(tmpdir(), 'autodev-issue16-diagnostic-'))
  const dbFile = join(directory, 'run.db')
  const fixturePath = 'C:\\Users\\runner\\Temp\\synthetic-repo'
  vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    const db = new Database(dbFile)
    db.exec(`CREATE TABLE attempts (seq INTEGER PRIMARY KEY, ok INTEGER NOT NULL, detail TEXT NOT NULL, failure_class TEXT NOT NULL);
      INSERT INTO attempts VALUES (1, 1, 'worker succeeded', '');
      INSERT INTO attempts VALUES (2, 0, 'verify rejected: regression-fail: ${fixturePath}\\file; token=ghp_1234567890abcdefghijklmno', 'task');
      INSERT INTO attempts VALUES (3, 0, 'later failure', 'task');`)
    db.close()

    const captured = readFirstFailedAttempt(dbFile)
    expect(captured.lookup).toBe('found')
    expect(captured.attempt).toMatchObject({ sequence: 2, failureClass: 'task' })
    const artifactFile = writeFollowupDiagnostic({ attempt: captured.attempt, attemptLookup: captured.lookup,
      fixtureRoot: fixturePath, before: { status: 'queued', runs: 1, revision: { round: 1, baseCommit: 'a'.repeat(40), feedback: 'synthetic', key: 'synthetic' } },
      after: { status: 'blocked', runs: 2, detail: 'failed' } }, directory)
    const artifactText = readFileSync(artifactFile, 'utf8')
    const artifact = JSON.parse(artifactText)
    expect(artifact.firstFailingGate).toMatchObject({ gate: 'verification.regression', attemptSequence: 2 })
    expect(artifactText).not.toContain(fixturePath)
    expect(artifactText).not.toContain('ghp_1234567890')
    expect(artifactText).toContain('[FIXTURE_PATH]')
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
