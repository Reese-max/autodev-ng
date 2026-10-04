import { afterEach, expect, test, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GithubConfigSchema, type Issue } from '../src/github/config.js'
import { GithubReadError, type GithubClient } from '../src/github/client.js'
import { runGithub, publishIssue } from '../src/github/runner.js'
import { fingerprint, readState, saveState, type IssueState } from '../src/github/state.js'
const dirs: string[] = [], commit = 'a'.repeat(40)
afterEach(() => { vi.restoreAllMocks(); dirs.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })) })
function fixture(error: Error = new GithubReadError(503)) {
  const dir = mkdtempSync(join(tmpdir(), 'adng-checkpoint-')); dirs.push(dir)
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: join(dir, 'source.json'), dataDir: dir, engine: 'writer', enabled: true, publish: true })
  writeFileSync(cfg.sourceConfig, '{}')
  const issue: Issue = { number: 7, title: 'Fix addition', body: '2 + 3 should be 5', state: 'open', user: { login: 'owner' }, labels: [{ name: 'autodev' }] }
  let reads = 0
  const client: GithubClient = { list: vi.fn(async () => [issue]), issue: vi.fn(async () => { if (++reads === 3) throw error; return issue }), findPr: async () => undefined, findLinkedPr: async () => undefined, createPr: vi.fn(async () => { throw new Error('unexpected publish') }) }
  const execute = vi.fn(async () => ({ done: true, commit, detail: 'local verification passed' }))
  const publish = vi.fn(async (_cfg, state: IssueState) => { state.status = 'published'; state.pr = 'https://github.com/owner/project/pull/8' })
  return { cfg, issue, client, execute, publish }
}
function makeDue(cfg: ReturnType<typeof fixture>['cfg']) {
  const state = readState(cfg, 7)!; state.nextRunAt = 0; saveState(cfg, state)
}
test('post-execution read failure persists candidate and receipts, then only rechecks on restart', async () => {
  const f = fixture()
  expect(await runGithub(f.cfg, f)).toBe('7: queued')
  expect(readState(f.cfg, 7)).toMatchObject({ commit, runs: 1, status: 'queued', candidateCheck: { attempts: 1, phase: 'issue-read', receiptRefs: ['evidence', `regression-${commit}.json`] } })
  expect(f.publish).not.toHaveBeenCalled()
  expect(await runGithub(f.cfg, f)).toBe('idle')
  makeDue(f.cfg); vi.mocked(f.client.list).mockClear()
  expect(await runGithub(f.cfg, f)).toBe('7: published')
  expect(f.execute).toHaveBeenCalledTimes(1); expect(f.publish).toHaveBeenCalledTimes(1)
  expect(f.client.list).not.toHaveBeenCalled()
  expect(readState(f.cfg, 7)).toMatchObject({ runs: 1, commit, status: 'published' })
  expect(readState(f.cfg, 7)!.candidateCheck).toBeUndefined()
})
test('checkpoint is saved before the failing remote call and may not be published directly', async () => {
  const f = fixture(); let reads = 0
  f.client.issue = async () => {
    if (++reads === 3) {
      const saved = readState(f.cfg, 7)!
      expect(saved).toMatchObject({ commit, runs: 1, status: 'queued', candidateCheck: { attempts: 0 } })
      await expect(publishIssue(f.cfg, saved, f.client, vi.fn(), vi.fn())).rejects.toThrow('awaiting external recheck')
      throw new GithubReadError(503)
    }
    return f.issue
  }
  expect(await runGithub(f.cfg, f)).toBe('7: queued')
})
test('older ready state upgrades to a read checkpoint without resetting writer counts', async () => {
  const f = fixture()
  saveState(f.cfg, { repo: f.cfg.repo, base: f.cfg.base, issue: f.issue, fingerprint: fingerprint(f.issue), status: 'ready', commit, runs: 2, nextRunAt: 0 })
  f.client.issue = async () => { throw new GithubReadError(503) }
  expect(await runGithub(f.cfg, f)).toBe('7: queued')
  expect(readState(f.cfg, 7)).toMatchObject({ commit, runs: 2, candidateCheck: { attempts: 1, phase: 'publication-read' } })
  expect(f.execute).not.toHaveBeenCalled(); expect(f.publish).not.toHaveBeenCalled()
})
test('repeated failures have finite controller retries without repeated writer accounting', async () => {
  const f = fixture(); await runGithub(f.cfg, f)
  f.client.issue = async () => { throw new GithubReadError(429) }
  for (let attempts = 2; attempts <= 5; attempts++) {
    makeDue(f.cfg); await runGithub(f.cfg, f)
    expect(readState(f.cfg, 7)).toMatchObject({ runs: 1, commit, candidateCheck: { attempts } })
  }
  expect(readState(f.cfg, 7)).toMatchObject({ status: 'blocked', detail: expect.stringContaining('candidate-read-retry-exhausted') })
  makeDue(f.cfg); expect(await runGithub(f.cfg, f)).toBe('idle')
  expect(f.execute).toHaveBeenCalledTimes(1); expect(f.publish).not.toHaveBeenCalled()
})
test('Retry-After/reset is respected and excessive cooldown hands off', async () => {
  const future = Date.now() + 6 * 60 * 60_000, f = fixture(new GithubReadError(429, future))
  await runGithub(f.cfg, f)
  expect(readState(f.cfg, 7)!.nextRunAt).toBeGreaterThanOrEqual(future)
  const excessive = fixture(new GithubReadError(429, Date.now() + 25 * 60 * 60_000))
  await runGithub(excessive.cfg, excessive)
  expect(readState(excessive.cfg, 7)!.status).toBe('blocked')
})
test.each([new Error('HTTP 503 in an unstructured message'), new GithubReadError(401), new GithubReadError(403)])('unknown/permanent errors remain quarantined: %s', async error => {
  const f = fixture(error); await runGithub(f.cfg, f)
  expect(readState(f.cfg, 7)).toMatchObject({ status: 'blocked', runs: 1, commit })
  makeDue(f.cfg); await runGithub(f.cfg, f)
  expect(f.execute).toHaveBeenCalledTimes(1); expect(f.publish).not.toHaveBeenCalled()
})
test.each(['label', 'fingerprint', 'enabled', 'publish', 'policy', 'stop'])('recovery rechecks withdrawal: %s', async mode => {
  const f = fixture(); await runGithub(f.cfg, f); makeDue(f.cfg)
  if (mode === 'label') f.issue.labels = []
  if (mode === 'fingerprint') f.issue.body = 'changed requirement'
  if (mode === 'enabled') f.cfg.enabled = false
  if (mode === 'publish') f.cfg.publish = false
  if (mode === 'stop') writeFileSync(join(f.cfg.dataDir, '.adng.stop'), '')
  await runGithub(f.cfg, { ...f, policyCheck: () => mode !== 'policy' })
  expect(f.publish).not.toHaveBeenCalled()
  expect(f.execute).toHaveBeenCalledTimes(1)
  expect(readState(f.cfg, 7)).toMatchObject({ runs: 1, commit })
})
test('publication rechecks the original matching PR and quarantines head drift', async () => {
  const f = fixture(); f.client.issue = async () => f.issue
  const push = vi.fn(), pr = { number: 8, html_url: 'https://github.com/owner/project/pull/8', state: 'open' as const, head: { sha: commit, ref: 'autodev/issue-7' }, base: { ref: f.cfg.base } }
  let lookups = 0
  f.client.findPr = async () => {
    if (++lookups === 1) return undefined
    if (lookups === 2) throw new GithubReadError(503)
    return pr
  }
  const publish = (_cfg: typeof f.cfg, state: IssueState, client: GithubClient) => publishIssue(_cfg, state, client, vi.fn(), push)
  expect(await runGithub(f.cfg, { ...f, publish })).toBe('7: queued')
  expect(readState(f.cfg, 7)!.candidateCheck).toMatchObject({ phase: 'publication-read', attempts: 1 })
  makeDue(f.cfg)
  expect(await runGithub(f.cfg, { ...f, publish })).toBe('7: published')
  expect(push).not.toHaveBeenCalled(); expect(f.client.createPr).not.toHaveBeenCalled(); expect(f.execute).toHaveBeenCalledTimes(1)
  const drift = fixture(); await runGithub(drift.cfg, drift); makeDue(drift.cfg)
  drift.client.findPr = async () => ({ ...pr, head: { ...pr.head, sha: 'b'.repeat(40) } })
  expect(await runGithub(drift.cfg, { ...drift, publish })).toBe('7: blocked')
  expect(drift.execute).toHaveBeenCalledTimes(1); expect(push).not.toHaveBeenCalled()
})

test('cooldown suppresses all remote reads, including fresh intake and PR observations', async () => {
  const f = fixture(); await runGithub(f.cfg, f)
  vi.mocked(f.client.list).mockClear(); vi.mocked(f.client.issue).mockClear()
  f.client.findPr = vi.fn(async () => undefined)
  expect(await runGithub(f.cfg, f)).toBe('idle')
  expect(f.client.list).not.toHaveBeenCalled(); expect(f.client.issue).not.toHaveBeenCalled(); expect(f.client.findPr).not.toHaveBeenCalled()
})

test.each(['source', 'acceptance', 'quality'])('restart quarantines changed original gate inputs: %s', async mode => {
  const f = fixture(); await runGithub(f.cfg, f); makeDue(f.cfg)
  if (mode === 'source') writeFileSync(f.cfg.sourceConfig, '{"changed":"policy"}')
  if (mode === 'acceptance') f.cfg.acceptance = { command: 'node', args: ['--version'] }
  if (mode === 'quality') f.cfg.quality = { required: ['unit'], unit: { command: 'node', args: ['--version'] } }
  expect(await runGithub(f.cfg, f)).toBe('7: blocked')
  expect(readState(f.cfg, 7)!.detail).toContain('candidate-policy-changed')
  expect(f.publish).not.toHaveBeenCalled(); expect(f.execute).toHaveBeenCalledTimes(1)
})
