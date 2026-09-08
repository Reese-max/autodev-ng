import { expect, test, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { githubClient } from '../src/github/client.js'
import { GithubConfigSchema } from '../src/github/config.js'
vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }))
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
