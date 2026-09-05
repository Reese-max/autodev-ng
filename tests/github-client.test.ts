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
