import { expect, test, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { eligible, GithubConfigSchema } from '../src/github/config.js'
import { describeIssueBatchCoverage, GITHUB_ISSUE_PAGE_LIMIT, githubClient } from '../src/github/client.js'
vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }))
test('label-free API omits labels filter, legacy config keeps it, linked-PR errors fail closed', async () => {
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: 'source.json', dataDir: 'data', engine: 'writer' })
  const run = vi.mocked(execFileSync)
  run.mockReturnValueOnce('[[]]')
  await githubClient({ ...cfg, label: null }).list()
  expect(run.mock.lastCall?.[1]).toContain('repos/owner/project/issues?state=open&sort=created&direction=asc&per_page=100&page=1')
  run.mockReturnValueOnce('[[]]'); await githubClient(cfg).list()
  expect(run.mock.lastCall?.[1]).toContain('repos/owner/project/issues?state=open&labels=autodev&sort=created&direction=asc&per_page=100&page=1')
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

test('Issue intake isolates bad rows, keeps the live 64000/null body contract, and redacts private content', async () => {
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: 'source.json', dataDir: 'data', engine: 'writer' })
  const row = (number: number, patch: Record<string, unknown> = {}) => ({ number, title: `Issue ${number}`, body: 'ok', state: 'open', user: { login: 'owner' }, labels: [{ name: 'autodev' }], ...patch })
  const rejectedBody = `PRIVATE_OVERSIZE_SECRET${'x'.repeat(64_001)}`
  const malformed = row(7, { title: '', body: 'PRIVATE_MALFORMED_SECRET' })
  const run = vi.mocked(execFileSync); run.mockReset()
  run.mockReturnValueOnce(JSON.stringify([
    row(1, { body: null }), row(2, { body: 'x'.repeat(20_000) }), row(3, { body: 'x'.repeat(20_001) }),
    row(4, { body: 'x'.repeat(25_431) }), row(5, { body: 'x'.repeat(64_000) }),
    row(6, { body: rejectedBody }), malformed,
    row(8, { user: { login: 'stranger' } }), row(9, { labels: [{ name: 'no-autofix' }] }),
    { ...row(10), pull_request: { url: 'https://github.com/owner/project/pull/10' } },
  ]))
  const batch = await githubClient(cfg).listBatch!()
  expect(batch.issues.map(issue => issue.number)).toEqual([1, 2, 3, 4, 5, 8, 9])
  expect(batch.issues.slice(0, 5).map(issue => issue.body?.length ?? null)).toEqual([null, 20_000, 20_001, 25_431, 64_000])
  expect(batch.issues.filter(issue => eligible(issue, cfg)).map(issue => issue.number)).toEqual([1, 2, 3, 4, 5])
  expect(batch.rejected).toEqual([
    { number: 6, field: 'body', reason: 'value exceeds the schema limit' },
    { number: 7, field: 'title', reason: 'value is below the schema minimum' },
  ])
  expect(batch.partial).toBe(true)
  expect(JSON.stringify({ batch, summary: describeIssueBatchCoverage(batch) })).not.toContain('PRIVATE_')
  const args = run.mock.lastCall?.[1] as string[]
  expect(args).toContain('repos/owner/project/issues?state=open&labels=autodev&sort=created&direction=asc&per_page=100&page=1')
  expect(args).not.toContain('--paginate')
})

test('Issue paging stops at a finite page budget and marks a full final page partial', async () => {
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: 'source.json', dataDir: 'data', engine: 'writer' })
  const page = Array.from({ length: 100 }, (_, index) => ({ number: index + 1, title: `Issue ${index + 1}`, body: null, state: 'open', user: { login: 'owner' }, labels: [{ name: 'autodev' }] }))
  const run = vi.mocked(execFileSync); run.mockReset(); run.mockReturnValue(JSON.stringify(page))
  const batch = await githubClient(cfg).listBatch!()
  expect(run).toHaveBeenCalledTimes(GITHUB_ISSUE_PAGE_LIMIT)
  expect(batch.pagesRead).toBe(GITHUB_ISSUE_PAGE_LIMIT)
  expect(batch.pageLimitReached).toBe(true)
  expect(batch.partial).toBe(true)
  expect(describeIssueBatchCoverage(batch)).toContain('more issues may remain')
})

test('whole-page transport failures stay distinct from isolated item rejection', async () => {
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: 'source.json', dataDir: 'data', engine: 'writer' })
  const run = vi.mocked(execFileSync); run.mockReset(); run.mockImplementationOnce(() => { throw new Error('transport detail') })
  await expect(githubClient(cfg).listBatch!()).rejects.toThrow('GitHub Issues request failed on page 1')
})
