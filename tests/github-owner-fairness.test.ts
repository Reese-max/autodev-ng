import { afterEach, expect, test, vi } from 'vitest'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { OwnerConfigSchema, ownedRepos, repoConfig, runOwner } from '../src/github/owner.js'
import { runGithubOutcome, type RunOutcome } from '../src/github/runner.js'
import { GithubConfigSchema, type Issue } from '../src/github/config.js'
import { branchFor, fingerprint, readState, saveState, type IssueState } from '../src/github/state.js'
import type { GithubClient } from '../src/github/client.js'

const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

function ownerFixture() {
  const root = mkdtempSync(join(tmpdir(), 'adng-owner-fair-')); dirs.push(root)
  const cfg = OwnerConfigSchema.parse({ owner: 'owner', authors: ['owner'], sourceConfig: 'source.json', dataDir: root, engine: 'writer', enabled: true, publish: true, retryMs: 60_000 })
  const row = (name: string) => ({ full_name: name, owner: { login: 'owner' }, default_branch: 'main',
    archived: false, disabled: false, has_issues: true, permissions: { push: true } })
  const repos = ownedRepos('owner', [[row('owner/aaa'), row('owner/bbb'), row('owner/ccc')]])
  return { root, cfg, repos }
}

const attempted = (disposition = '1: published'): RunOutcome => ({ disposition, attempted: true })
const notAttempted = (disposition = 'blocked'): RunOutcome => ({ disposition, attempted: false })

test('dispatch cursor rotates the slot across aligned ticks and survives restart', async () => {
  const { cfg, repos } = ownerFixture()
  const dispatched: string[] = []
  const run = vi.fn(async (child: { repo: string }, o?: { syncOnly?: boolean }) => {
    if (o?.syncOnly) return { disposition: 'synced', attempted: false }
    dispatched.push(child.repo)
    return attempted()
  })
  // Three consecutive ticks with the same wall-clock alignment: a wall-clock
  // modulo start offset would starve B/C; the persisted cursor must not.
  for (let tick = 0; tick < 3; tick += 1) await runOwner(cfg, false, () => repos, run)
  expect(dispatched.sort()).toEqual(['owner/aaa', 'owner/bbb', 'owner/ccc'])
  // A fourth tick wraps around: after all three were attempted, oldest is A again.
  await runOwner(cfg, false, () => repos, run)
  expect(dispatched[3]).toBe('owner/aaa')
})

test('pre-dispatch blocked dispositions yield the slot to the next repo', async () => {
  const { cfg, repos } = ownerFixture()
  const run = vi.fn(async (child: { repo: string }, o?: { syncOnly?: boolean }) => {
    if (o?.syncOnly) return { disposition: 'synced', attempted: false }
    // repo aaa blocks before dispatch (e.g. existing PR); it must not consume the slot.
    return child.repo === 'owner/aaa' ? notAttempted('blocked') : attempted('2: published')
  })
  const report = await runOwner(cfg, false, () => repos, run)
  if (!('repositories' in report)) throw new Error('owner lock unexpectedly held')
  const calls = run.mock.calls.map(([child]) => (child as { repo: string }).repo)
  expect(calls).toEqual(['owner/aaa', 'owner/bbb', 'owner/ccc'])
  expect(report.repositories.find(r => r.repo === 'owner/bbb')?.attempted).toBe(true)
  expect(report.repositories.find(r => r.repo === 'owner/bbb')?.syncOnly).toBeUndefined()
  expect(report.repositories.find(r => r.repo === 'owner/ccc')?.syncOnly).toBe(true)
})

test('cursor file is versioned, survives reorder, and resets safely when corrupt', async () => {
  const { cfg, repos } = ownerFixture()
  const run = vi.fn(async (_c: unknown, o?: { syncOnly?: boolean }) =>
    o?.syncOnly ? { disposition: 'synced', attempted: false } : attempted())
  await runOwner(cfg, false, () => repos, run)
  const cursorPath = join(cfg.dataDir, 'dispatch-cursor.json')
  expect(existsSync(cursorPath)).toBe(true)
  const cursor = JSON.parse(readFileSync(cursorPath, 'utf8'))
  expect(cursor.version).toBe(1)
  expect(cursor.repos['owner/aaa'].attemptSeq).toBe(1)
  // Reordered discovery must still pick the least-recently attempted repo.
  const dispatched: string[] = []
  const track = vi.fn(async (child: { repo: string }, o?: { syncOnly?: boolean }) => {
    if (o?.syncOnly) return { disposition: 'synced', attempted: false }
    dispatched.push(child.repo); return attempted()
  })
  await runOwner(cfg, false, () => [repos[2]!, repos[0]!, repos[1]!], track)
  expect(dispatched).toEqual(['owner/bbb'])
  // Corrupt cursor must not crash or starve; it resets and keeps dispatching.
  writeFileSync(cursorPath, '{not json')
  dispatched.length = 0
  await runOwner(cfg, false, () => repos, track)
  expect(dispatched).toHaveLength(1)
})

test('report distinguishes scan and dispatch timestamps per repo', async () => {
  const { cfg, repos } = ownerFixture()
  const run = vi.fn(async (_c: unknown, o?: { syncOnly?: boolean }) =>
    o?.syncOnly ? { disposition: 'synced', attempted: false } : attempted())
  const report = await runOwner(cfg, false, () => repos, run)
  if (!('repositories' in report)) throw new Error('owner lock unexpectedly held')
  for (const entry of report.repositories) {
    expect(typeof entry.lastScannedAt).toBe('string')
  }
  const first = report.repositories.find(r => r.attempted === true)
  expect(first).toBeDefined()
  expect(typeof first!.lastAttemptedAt).toBe('string')
  expect(report.repositories.filter(r => r.attempted !== true).every(r => r.lastAttemptedAt === undefined || r.lastAttemptedAt === null)).toBe(true)
})

function runnerFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'adng-runner-observe-')); dirs.push(dir)
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: join(dir, 'source.json'), dataDir: dir, engine: 'writer', enabled: true, retryMs: 60_000 })
  writeFileSync(cfg.sourceConfig, '{}')
  const issue: Issue = { number: 7, title: 'Fix addition', body: '2 + 3 should be 5', state: 'open', user: { login: 'owner' }, labels: [{ name: 'autodev' }] }
  const commit = 'a'.repeat(40)
  const published: IssueState = { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'published', runs: 1, nextRunAt: 0, commit, pr: 'https://github.com/owner/project/pull/7' }
  const client: GithubClient = {
    list: vi.fn(async () => [issue]),
    issue: vi.fn(async () => issue),
    findPr: vi.fn(async () => undefined),
    findLinkedPr: vi.fn(async () => undefined),
    createPr: vi.fn(),
    feedback: vi.fn(async () => ({ number: 7, url: published.pr!, head: commit, base: 'main', state: 'open' as const, checks: 'pass' as const, feedback: '' })),
  }
  return { dir, cfg, issue, client, published }
}

test('syncOnly repos still observe due published PRs within budget', async () => {
  const { cfg, client, published } = runnerFixture()
  saveState(cfg, published)
  const execute = vi.fn()
  const outcome = await runGithubOutcome(cfg, { client, syncOnly: true, execute })
  expect(outcome.disposition).toBe('synced')
  expect(outcome.attempted).toBe(false)
  expect(client.feedback).toHaveBeenCalledTimes(1)
  expect(readState(cfg, 7)!.lastObservedAt).toBeGreaterThan(0)
  expect(execute).not.toHaveBeenCalled()
})

test('observe budget bounds requests and continues fairly next tick', async () => {
  const { cfg, client, published, issue } = runnerFixture()
  saveState(cfg, published)
  const issue2 = { ...issue, number: 8 }
  saveState(cfg, { ...published, issue: issue2, fingerprint: fingerprint(issue2), pr: 'https://github.com/owner/project/pull/8' })
  const outcome = await runGithubOutcome(cfg, { client, syncOnly: true, observeBudget: 1 })
  expect(outcome.disposition).toBe('synced')
  expect(client.feedback).toHaveBeenCalledTimes(1)
})

test('a poisoned PR does not pin the front of the observe queue', async () => {
  const { cfg, client, published, issue } = runnerFixture()
  saveState(cfg, { ...published, lastObservedAt: 100 })
  const issue2 = { ...issue, number: 8 }
  const commit2 = 'b'.repeat(40)
  saveState(cfg, { ...published, issue: issue2, fingerprint: fingerprint(issue2),
    commit: commit2, pr: 'https://github.com/owner/project/pull/8', lastObservedAt: 200 })
  // Remote only ever reports PR 8's true shape: observing PR 7 throws on the
  // head/url mismatch *after* its remote call, which must still advance its
  // observation timestamp so the next tick reaches PR 8.
  client.feedback = vi.fn(async () => ({ number: 8,
    url: 'https://github.com/owner/project/pull/8', head: commit2, base: 'main',
    state: 'open' as const, checks: 'pass' as const, feedback: '' }))
  await runGithubOutcome(cfg, { client, syncOnly: true, observeBudget: 1 })
  await runGithubOutcome(cfg, { client, syncOnly: true, observeBudget: 1 })
  const branches = vi.mocked(client.feedback).mock.calls.map(([branch]) => branch)
  expect(branches).toEqual([branchFor(7), branchFor(8)])
  expect(readState(cfg, 8)!.lastObservedAt).toBeGreaterThan(200)
})

test('an execution that throws after invocation still consumes the slot', async () => {
  const { cfg, client, issue } = runnerFixture()
  saveState(cfg, { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'queued', runs: 0, nextRunAt: 0 })
  const outcome = await runGithubOutcome(cfg, { client,
    execute: vi.fn(async () => { throw new Error('post-work crash') }) })
  expect(outcome.attempted).toBe(true)
  expect(readState(cfg, 7)!.status).toBe('blocked')
})
