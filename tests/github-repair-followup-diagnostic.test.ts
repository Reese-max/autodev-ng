import Database from 'better-sqlite3'
import { afterEach, expect, test, vi } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildFollowupDiagnostic, readFirstFailedAttempt, writeFollowupDiagnostic } from './helpers/github-repair-followup-diagnostic.js'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

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
      detail: `verify rejected: regression-fail: command failed at ${fixtureRoot}\\private\\file; token=ghp_fixture42`,
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
  expect(serialized).not.toContain('ghp_fixture42')
  expect(serialized).toContain('[FIXTURE_PATH]')
  expect(serialized).toContain('[REDACTED]')
})

test('Issue 16 diagnostic marks a generic failed result as unknown without inventing an inner gate', () => {
  const diagnostic = buildFollowupDiagnostic({ after: { status: 'blocked', runs: 2, detail: 'failed' }, attemptLookup: 'no-failed-attempt' })
  expect(diagnostic.firstFailingGate).toMatchObject({ gate: 'unknown', subreason: 'The stored result did not retain an inner gate reason.' })
})

test.each([
  ['Repair revision baseline does not preserve the previously verified fix', 'repair.revision-baseline'],
  ['verify-fail: FAIL quality comparison in a regression test', 'verification.kernel'],
  ['verify-blocked: command not found', 'verification.kernel'],
  ['judge-mismatch: regression claim is unsupported', 'verification.kernel'],
  ['review-reject: regression evidence is missing', 'verification.independent-review'],
  ['review-blocked: quality reviewer unavailable', 'verification.independent-review'],
  ['regression-fail: Error: Regression must pass: FAIL quality comparison', 'verification.regression'],
  ['regression-fail: Error: Project acceptance failed; inspect candidate output', 'verification.acceptance'],
  ['regression-fail: Error: Acceptance changed the tested source', 'verification.acceptance'],
  ['regression-fail: Error: Quality gate failed', 'verification.quality'],
  ['unrecognized worker output mentions regression quality', 'unknown'],
])('Issue 16 diagnostic classifies the producer reason %s', (detail, gate) => {
  expect(buildFollowupDiagnostic({ after: { status: 'blocked', runs: 2, detail } }).firstFailingGate.gate).toBe(gate)
})

test.each([
  ['{"api_key":"fixture json credential"}', 'fixture json credential'],
  ['{"password":"fixture private password"}', 'fixture private password'],
  ['Authorization: Bearer fixture.bearer.credential', 'fixture.bearer.credential'],
  ['Authorization: Basic Zml4dHVyZTpjcmVkZW50aWFs', 'Zml4dHVyZTpjcmVkZW50aWFs'],
  ['cannot open "C:\\Users\\Jane Doe\\private\\file.json"', 'Doe\\private\\file.json'],
  ['cannot open C:\\Users\\Jane Doe\\private\\file.json', 'Doe\\private\\file.json'],
  ["cannot open '/usr/local/private/fixture.json'", '/usr/local/private/fixture.json'],
  ['cannot open /usr/local/private files/fixture.json', 'files/fixture.json'],
])('Issue 16 artifact and log omit private text from %s', (detail, privateText) => {
  const directory = mkdtempSync(join(tmpdir(), 'autodev-issue16-private-'))
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    const file = writeFollowupDiagnostic({ after: { status: 'blocked', runs: 2, detail } }, directory)
    const escapedPrivateText = JSON.stringify(privateText).slice(1, -1)
    expect(readFileSync(file, 'utf8')).not.toContain(escapedPrivateText)
    expect(String(log.mock.calls[0]?.[0])).not.toContain(escapedPrivateText)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('Issue 16 diagnostic redacts credential values inherited by verifier processes', () => {
  const credential = 'fixture-env-credential'
  vi.stubEnv('AUTODEV_TEST_API_KEY', credential)
  const diagnostic = buildFollowupDiagnostic({ after: { status: 'blocked', runs: 2, detail: 'verify-fail: ' + credential } })
  expect(JSON.stringify(diagnostic)).not.toContain(credential)
})

test('Issue 16 artifact reads the earliest failed synthetic attempt and writes only the redacted JSON record', () => {
  const directory = mkdtempSync(join(tmpdir(), 'autodev-issue16-diagnostic-'))
  const dbFile = join(directory, 'run.db')
  const fixturePath = 'C:\\Users\\runner\\Temp\\synthetic-repo'
  vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    const db = new Database(dbFile)
    db.exec('CREATE TABLE attempts (seq INTEGER PRIMARY KEY, task_id TEXT NOT NULL, ok INTEGER NOT NULL, detail TEXT NOT NULL, failure_class TEXT NOT NULL)')
    const insert = db.prepare('INSERT INTO attempts VALUES (?, ?, ?, ?, ?)')
    insert.run(1, 'follow-up', 1, 'b'.repeat(40), '')
    insert.run(2, 'another-task', 1, 'c'.repeat(40), '')
    insert.run(3, 'follow-up', 0, 'verify rejected: regression-fail: ' + fixturePath + '\\file; token=ghp_fixture42', 'task')
    insert.run(4, 'follow-up', 1, 'd'.repeat(40), '')
    insert.run(5, 'follow-up', 0, 'later failure', 'task')
    db.close()

    const captured = readFirstFailedAttempt(dbFile)
    expect(captured.lookup).toBe('found')
    expect(captured.attempt).toMatchObject({ sequence: 3, failureClass: 'task' })
    const artifactFile = writeFollowupDiagnostic({ attempt: captured.attempt, attemptLookup: captured.lookup,
      fixtureRoot: fixturePath, before: { status: 'queued', runs: 1, revision: { round: 1, baseCommit: 'a'.repeat(40), feedback: 'synthetic', key: 'synthetic' } },
      after: { status: 'blocked', runs: 2, detail: 'failed' } }, directory)
    const artifactText = readFileSync(artifactFile, 'utf8')
    const artifact = JSON.parse(artifactText)
    expect(artifact.firstFailingGate).toMatchObject({ gate: 'verification.regression', attemptSequence: 3 })
    expect(artifact.commits.candidate).toBe('b'.repeat(40))
    expect(artifactText).not.toContain(fixturePath)
    expect(artifactText).not.toContain('ghp_fixture42')
    expect(artifactText).toContain('[FIXTURE_PATH]')
    const secondFile = writeFollowupDiagnostic({ after: { status: 'blocked', runs: 3, detail: 'failed' } }, directory)
    expect(secondFile).not.toBe(artifactFile)
    expect(readFileSync(artifactFile, 'utf8')).toBe(artifactText)
    expect(JSON.parse(readFileSync(secondFile, 'utf8')).runNumber.after).toBe(3)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
