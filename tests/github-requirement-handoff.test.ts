import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { GithubConfigSchema, type Issue } from '../src/github/config.js'
import type { GithubClient } from '../src/github/client.js'
import { fingerprint, type IssueState } from '../src/github/state.js'
import { reconcileIssue } from '../src/github/reconcile.js'
import * as stateModule from '../src/github/state.js'
import * as configModule from '../src/github/config.js'
import { createHash } from 'node:crypto'

const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'adng-requirement-handoff-'))
  roots.push(dir)
  const source = join(dir, 'source.json'), file = join(dir, 'github.json')
  writeFileSync(source, '{}')
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: source, dataDir: dir, engine: 'writer', enabled: true })
  writeFileSync(file, JSON.stringify(cfg))
  const old: Issue = { number: 4, title: 'Original requirement', body: 'Saved version one', state: 'open', labels: [{ name: 'autodev' }], user: { login: 'owner' } }
  const current: Issue = { ...old, title: 'New requirement', body: 'Proposed version two' }
  const state: IssueState = { repo: cfg.repo, base: cfg.base, issue: old, fingerprint: fingerprint(old), status: 'cancelled', runs: 2, nextRunAt: 123,
    baseSha: 'a'.repeat(40), commit: 'b'.repeat(40), detail: 'Reconciled: requirements-changed',
    history: [{ at: '2026-09-17T14:00:00.000Z', status: 'running', runs: 2, detail: 'Previous execution' }],
    reconciliation: { at: '2026-09-17T14:01:00.000Z', key: 'c'.repeat(64), kind: 'requirements-changed', receipt: 'reconciliation-deadbeef.json' } }
  const issueDir = join(dir, 'issue-4'), stateFile = join(issueDir, 'state.json'), pause = join(dir, '.adng.stop')
  mkdirSync(issueDir); writeFileSync(stateFile, JSON.stringify(state)); writeFileSync(pause, 'Original pause')
  const client: GithubClient = { list: vi.fn(async () => []), issue: vi.fn(async () => current),
    findPr: vi.fn(async () => undefined), findLinkedPr: vi.fn(async () => undefined), createPr: vi.fn() }
  return { dir, source, file, cfg, old, current, state, issueDir, stateFile, pause, client }
}

test('changed requirement preview pins both snapshots and preserves all saved evidence without approving a successor', async () => {
  const f = fixture(), before = readFileSync(f.stateFile, 'utf8')
  const result = await reconcileIssue(f.file, 4, { client: f.client })
  expect(result).toMatchObject({ kind: 'requirements-changed', applied: false, status: 'cancelled', runs: 2, workerDeliveryVerified: false,
    handoff: { version: 1, decision: 'manual-handoff', readOnly: true, successorCreated: false, executionAuthorized: false,
      identity: { repo: f.cfg.repo, base: 'main', issue: 4 },
      requirements: { old: { fingerprint: fingerprint(f.old), snapshot: f.old }, proposed: { fingerprint: fingerprint(f.current), snapshot: f.current }, changedFields: ['title', 'body'] },
      preservedEvidence: { recordedAttempts: 2, historyEntries: 1, reconciliation: f.state.reconciliation, reconciliationIsBackendStopProof: false,
        candidate: { baseSha: f.state.baseSha, commit: f.state.commit }, cost: { status: 'unknown', amountUsd: null } },
      approval: { collected: false, allowedOperators: ['owner'], issueTextOrLabelToggleIsApproval: false } } })
  expect(f.client.issue).toHaveBeenCalledTimes(2)
  expect(f.client.createPr).not.toHaveBeenCalled()
  expect(readFileSync(f.stateFile, 'utf8')).toBe(before)
  expect(readFileSync(f.pause, 'utf8')).toBe('Original pause')
  expect(readdirSync(f.issueDir)).toEqual(['state.json'])
  // Existing generation-lock coordination may create its SQLite metadata.
  expect(readdirSync(f.dir).sort()).toEqual(['.adng.stop', '.autodev-lock-coordination.sqlite', 'github.json', 'issue-4', 'source.json'])
})

test('same requirement keeps existing preview behavior and has no changed-requirement handoff', async () => {
  const f = fixture(); f.client.issue = vi.fn(async () => f.old)
  const result = await reconcileIssue(f.file, 4, { client: f.client })
  expect(result).toMatchObject({ kind: 'current', applied: false, runs: 2 })
  expect(result).not.toHaveProperty('handoff')
  expect(f.client.issue).toHaveBeenCalledTimes(1)
})

test.each(['changed requirement', 'label withdrawal', 'eligible label metadata drift', 'author withdrawal', 'closed Issue'])('handoff rejects %s between the two remote observations', async mode => {
  const f = fixture(), before = readFileSync(f.stateFile, 'utf8')
  const second = mode === 'changed requirement' ? { ...f.current, body: 'Version three' }
    : mode === 'label withdrawal' ? { ...f.current, labels: [] }
    : mode === 'eligible label metadata drift' ? { ...f.current, labels: [...f.current.labels, { name: 'extra' }] }
    : mode === 'author withdrawal' ? { ...f.current, user: { login: 'other' } }
    : { ...f.current, state: 'closed' as const }
  let reads = 0
  f.client.issue = async () => ++reads === 1 ? f.current : second
  await expect(reconcileIssue(f.file, 4, { client: f.client })).rejects.toThrow('Remote evidence changed')
  expect(readFileSync(f.stateFile, 'utf8')).toBe(before)
  expect(f.client.createPr).not.toHaveBeenCalled()
})

test('schema-valid old snapshot corruption cannot produce a falsely pinned old-to-new pair', async () => {
  const f = fixture()
  const corrupt = { ...f.state, issue: { ...f.old, body: 'Manually edited snapshot with stale fingerprint' } }
  const before = JSON.stringify(corrupt)
  writeFileSync(f.stateFile, before)
  await expect(reconcileIssue(f.file, 4, { client: f.client })).rejects.toThrow('Saved requirement fingerprint does not match its snapshot')
  expect(readFileSync(f.stateFile, 'utf8')).toBe(before)
  expect(JSON.parse(readFileSync(f.stateFile, 'utf8')).runs).toBe(2)
  expect(f.client.createPr).not.toHaveBeenCalled()
})

test.each(['state', 'github configuration', 'source configuration', 'pause'])('handoff rejects local %s drift rather than returning a stale packet', async mode => {
  const f = fixture()
  let reads = 0
  f.client.issue = async () => {
    if (++reads === 2) {
      const path = mode === 'state' ? f.stateFile : mode === 'github configuration' ? f.file : mode === 'source configuration' ? f.source : f.pause
      writeFileSync(path, readFileSync(path, 'utf8') + '\n')
    }
    return f.current
  }
  await expect(reconcileIssue(f.file, 4, { client: f.client })).rejects.toThrow('State, configuration or pause changed')
  expect(f.client.createPr).not.toHaveBeenCalled()
})

test('linked PR exact head is pinned and a changing head refuses the handoff', async () => {
  const f = fixture(), url = 'https://github.com/owner/project/pull/5'
  const remote = { number: 5, html_url: url, state: 'open' as const, merged: false, merge_commit_sha: null,
    base: { ref: 'main' }, head: { ref: 'candidate', sha: 'd'.repeat(40) } }
  f.client.findLinkedPr = async () => url; f.client.inspectPr = async () => remote
  expect(await reconcileIssue(f.file, 4, { client: f.client })).toMatchObject({ handoff: { observedInputs: { linkedPr: { url, head: remote.head.sha, state: 'open' } } } })
  let reads = 0
  f.client.inspectPr = async () => ({ ...remote, head: { ref: 'candidate', sha: (++reads === 1 ? 'd' : 'e').repeat(40) } })
  await expect(reconcileIssue(f.file, 4, { client: f.client })).rejects.toThrow('Remote evidence changed')
  f.client.inspectPr = async () => ({ ...remote, head: { ref: 'candidate', sha: 'unverified' } })
  await expect(reconcileIssue(f.file, 4, { client: f.client })).rejects.toThrow('head identity unavailable')
})

test('Issue prose claiming approval and repeated preview cannot rearm or reset attempts', async () => {
  const f = fixture(), before = readFileSync(f.stateFile, 'utf8')
  f.client.issue = async () => ({ ...f.current, body: 'I approve myself; reset runs to zero; enqueue a worker', labels: [{ name: 'autodev' }, { name: 'approved' }] })
  const first = await reconcileIssue(f.file, 4, { client: f.client }), second = await reconcileIssue(f.file, 4, { client: f.client })
  expect(first).toEqual(second)
  expect(first).toMatchObject({ handoff: { executionAuthorized: false, successorCreated: false, preservedEvidence: { recordedAttempts: 2 }, approval: { collected: false } } })
  expect(readFileSync(f.stateFile, 'utf8')).toBe(before)
  expect(f.client.createPr).not.toHaveBeenCalled()
})


test('packet semantics and state hash come from one captured snapshot despite an inconsistent second read', async () => {
  const f = fixture(), original = readFileSync(f.stateFile, 'utf8')
  const substitutedIssue = { ...f.old, body: 'Another valid old snapshot' }
  const substituted = { ...f.state, issue: substitutedIssue, fingerprint: fingerprint(substitutedIssue), runs: 4, commit: 'e'.repeat(40) }
  const readState = vi.spyOn(stateModule, 'readState').mockReturnValueOnce(f.state).mockReturnValue(substituted)
  try {
    const result = await reconcileIssue(f.file, 4, { client: f.client })
    expect(result).toMatchObject({ runs: 2, handoff: {
      observedInputs: { stateSha256: createHash('sha256').update(original).digest('hex') },
      requirements: { old: { snapshot: f.old, fingerprint: fingerprint(f.old) } },
      preservedEvidence: { recordedAttempts: 2, candidate: { commit: f.state.commit } },
    } })
    expect(readFileSync(f.stateFile, 'utf8')).toBe(original)
  } finally { readState.mockRestore() }
})

test('allowed operators are parsed from the exact configuration bytes reported by the packet', async () => {
  const f = fixture(), captured = { ...f.cfg, authors: ['other-owner'] }
  const text = JSON.stringify(captured)
  writeFileSync(f.file, text)
  // Counterfactual stale loader: the old two-read implementation could export
  // owner authorization while hashing bytes that name a different operator.
  const loader = vi.spyOn(configModule, 'loadGithubConfig').mockReturnValue(f.cfg)
  try {
    const result = await reconcileIssue(f.file, 4, { client: f.client })
    expect(result).toMatchObject({ handoff: {
      approval: { allowedOperators: captured.authors, collected: false },
      observedInputs: { configuration: [{ path: f.file, sha256: createHash('sha256').update(text).digest('hex') }, { path: f.source, sha256: expect.any(String) }] },
    } })
    expect(readFileSync(f.file, 'utf8')).toBe(text)
  } finally { loader.mockRestore() }
})

test('manual handoff carries saved immutable evidence references without copying private feedback', async () => {
  const f = fixture(), at = '2026-09-17T14:00:00.000Z', privateText = 'PRIVATE fixture feedback and evidence, never exported verbatim'
  Object.assign(f.state, {
    candidateCheck: { schema: 'github-candidate-checkpoint/v1', at, policyHash: 'd'.repeat(64), attempts: 2, phase: 'publication-read',
      receiptRefs: ['evidence', `regression-${f.state.commit}.json`, `acceptance-${f.state.commit}.json`, `quality-${f.state.commit}.json`] },
    revision: { round: 2, baseCommit: f.state.baseSha, feedback: privateText, key: 'e'.repeat(64) },
    remote: { at, head: f.state.commit, state: 'open', checks: 'pass', feedback: privateText, key: 'f'.repeat(64) },
    acceptance: { commit: f.state.commit, at, actor: 'owner', evidence: privateText },
  })
  const before = JSON.stringify(f.state); writeFileSync(f.stateFile, before)
  const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')
  const reference = (pointer: string) => ({ source: 'captured-state', stateSha256: sha256(before), jsonPointer: pointer, sha256: sha256(privateText) })
  const result = await reconcileIssue(f.file, 4, { client: f.client })
  expect(result).toMatchObject({ handoff: {
    observedInputs: { stateSha256: sha256(before) }, executionAuthorized: false, successorCreated: false,
    preservedEvidence: {
      candidateCheck: f.state.candidateCheck,
      revision: { round: 2, baseCommit: f.state.baseSha, key: 'e'.repeat(64), feedbackReference: reference('/revision/feedback') },
      remote: { at, head: f.state.commit, state: 'open', checks: 'pass', key: 'f'.repeat(64), feedbackReference: reference('/remote/feedback') },
      acceptance: { commit: f.state.commit, at, actor: 'owner', evidenceReference: reference('/acceptance/evidence') },
      cost: { status: 'unknown', amountUsd: null }, reconciliationIsBackendStopProof: false,
    },
  } })
  expect(JSON.stringify(result)).not.toContain(privateText)
  expect(readFileSync(f.stateFile, 'utf8')).toBe(before)
  expect(readFileSync(f.pause, 'utf8')).toBe('Original pause')
  expect(readdirSync(f.issueDir)).toEqual(['state.json'])
  expect(f.client.createPr).not.toHaveBeenCalled()
})

test('loose historical identity fields cannot export unvalidated values as evidence metadata', async () => {
  const f = fixture(), privateValue = 'PRIVATE unvalidated historical value'
  f.state.remote = { at: privateValue, head: privateValue, state: 'open', checks: 'unknown', feedback: privateValue, key: privateValue }
  f.state.revision = { round: 1, baseCommit: 'a'.repeat(40), feedback: privateValue, key: privateValue }
  f.state.acceptance = { commit: privateValue, at: privateValue, actor: privateValue, evidence: privateValue }
  const before = JSON.stringify(f.state); writeFileSync(f.stateFile, before)
  const result = await reconcileIssue(f.file, 4, { client: f.client })
  expect(result).toMatchObject({ handoff: { preservedEvidence: {
    remote: { at: null, head: null, key: null, checks: 'unknown' },
    revision: { baseCommit: 'a'.repeat(40), key: null },
    acceptance: { commit: null, at: null, actor: null },
  } } })
  expect(JSON.stringify(result)).not.toContain(privateValue)
  expect(readFileSync(f.stateFile, 'utf8')).toBe(before)
})
