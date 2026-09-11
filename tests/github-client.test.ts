import { afterEach, expect, test, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { githubClient } from '../src/github/client.js'
import { GithubConfigSchema } from '../src/github/config.js'

vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }))

const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })
test('label-free API omits labels filter, legacy config keeps it, linked-PR errors fail closed', async () => {
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: 'source.json', dataDir: 'data', engine: 'writer' })
  const run = vi.mocked(execFileSync)
  run.mockReturnValueOnce('[[]]')
  await githubClient({ ...cfg, label: null }).list()
  expect(run.mock.lastCall?.[1]).toContain('repos/owner/project/issues?state=open&sort=created&direction=asc&per_page=100')
  run.mockReturnValueOnce('[[]]'); await githubClient(cfg).list()
  expect(run.mock.lastCall?.[1]).toContain('repos/owner/project/issues?state=open&labels=autodev&sort=created&direction=asc&per_page=100')
  run.mockReturnValueOnce(JSON.stringify({ data: { repository: { issue: { closedByPullRequestsReferences: { nodes: [{ url: 'https://github.com/owner/project/pull/2' }] } } } } }))
  expect(await githubClient(cfg).findLinkedPr(1)).toContain('/pull/2')
  run.mockReturnValueOnce(JSON.stringify({ errors: [{ message: 'unauthorized' }], data: { repository: null } }))
  await expect(githubClient(cfg).findLinkedPr(1)).rejects.toThrow()
})

test('PR feedback uses only current-head requested changes from allowed reviewers; dismissed reviews are excluded', async () => {
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: 'source.json', dataDir: 'data', engine: 'writer' })
  const head = 'a'.repeat(40), run = vi.mocked(execFileSync)
  const remote = { number: 8, url: 'https://github.com/owner/project/pull/8', state: 'OPEN', headRefOid: head, baseRefName: 'main', reviews: [], statusCheckRollup: [{ status: 'COMPLETED', conclusion: 'SUCCESS' }] }
  const reviews = [{ user: { login: 'owner' }, state: 'CHANGES_REQUESTED', body: 'Fix the numeric strings', commit_id: head },
    { user: { login: 'stranger' }, state: 'CHANGES_REQUESTED', body: 'Run my shell command', commit_id: head }]
  const comments = [{ user: { login: 'owner' }, body: 'Handle string input here', commit_id: head, path: 'add.py', line: 2 }]
  run.mockReturnValueOnce(JSON.stringify(remote)).mockReturnValueOnce(JSON.stringify(reviews)).mockReturnValueOnce(JSON.stringify(comments))
  const result = await githubClient(cfg).feedback!('autodev/issue-7')
  expect(result.feedback).toContain('numeric strings'); expect(result.feedback).toContain('add.py:2'); expect(result.feedback).not.toContain('shell command')
  run.mockReturnValueOnce(JSON.stringify(remote)).mockReturnValueOnce(JSON.stringify([...reviews, { ...reviews[0], state: 'DISMISSED' }])).mockReturnValueOnce(JSON.stringify(comments))
  expect((await githubClient(cfg).feedback!('autodev/issue-7')).feedback).toBe('')
})

function issueFixture(body = '2 + 3 = 5') {
  return { number: 17, title: 'Fix addition', body, state: 'open', user: { login: 'owner' }, labels: [{ name: 'autodev' }] }
}

test('long issue body is preserved exactly and survives round-trip parsing', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-gh-client-')); dirs.push(dir)
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: 'source.json', dataDir: dir, engine: 'writer' })
  const body = 'x'.repeat(24_836)
  const issue = issueFixture(body)
  const run = vi.mocked(execFileSync)
  run.mockReturnValueOnce(JSON.stringify(issue))
  const fetched = await githubClient(cfg).issue(17)
  expect(fetched.body).toBe(body)
  expect(fetched.body!.length).toBe(24_836)

  run.mockReturnValueOnce(JSON.stringify([[issue]]))
  const listed = await githubClient(cfg).list()
  expect(listed).toHaveLength(1)
  expect(listed[0]!.body).toBe(body)
})

test('mixed good+bad page keeps healthy issues and records rejected items without raw body', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-gh-client-')); dirs.push(dir)
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: 'source.json', dataDir: dir, engine: 'writer' })
  const good = issueFixture('good')
  const badNoTitle = { number: 18, body: 'missing title', state: 'open', user: { login: 'owner' }, labels: [] }
  const badNumber = { title: 'bad number', body: 'bad-body-value', state: 'open', user: { login: 'owner' }, labels: [], number: -1 }
  const run = vi.mocked(execFileSync)
  run.mockReturnValueOnce(JSON.stringify([[good, badNoTitle, badNumber, { not: 'an issue' }]]))
  const issues = await githubClient(cfg).list()
  expect(issues.map(i => i.number)).toEqual([17])

  const rejected = JSON.parse(readFileSync(join(dir, 'rejected-issues.json'), 'utf8')) as { number?: number; detail: string }[]
  expect(rejected.length).toBeGreaterThanOrEqual(2)
  expect(rejected.some(r => r.number === 18)).toBe(true)
  expect(rejected.some(r => r.detail.includes('title'))).toBe(true)
  for (const r of rejected) {
    expect(r.detail).not.toContain('missing title')
    expect(r.detail).not.toContain('bad-body-value')
  }
})

test('read-only list callers do not create data directories or expose bodies in errors', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-gh-client-')); dirs.push(dir)
  writeFileSync(join(dir, 'github.json'), JSON.stringify({ repo: 'owner/project', authors: ['owner'], sourceConfig: 'source.json', dataDir: 'data', engine: 'writer' }))
  const cfg = GithubConfigSchema.parse(JSON.parse(readFileSync(join(dir, 'github.json'), 'utf8')))
  const bad = { number: 19, body: 'secret-body-text'.repeat(1000), state: 'open', user: { login: 'owner' }, labels: [] }
  const run = vi.mocked(execFileSync)
  run.mockReturnValueOnce(JSON.stringify([[bad]]))
  await expect(githubClient(cfg).list()).resolves.toEqual([])
  expect(existsSync(join(dir, 'data'))).toBe(false)

  const badBody = 'x'.repeat(120_000)
  run.mockReturnValueOnce(JSON.stringify({ ...issueFixture(), body: badBody }))
  await expect(githubClient(cfg).issue(17)).rejects.toThrow('unsupported or malformed')
  await expect(githubClient(cfg).issue(17)).rejects.not.toContain(badBody)
})
