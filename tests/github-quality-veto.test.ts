import { afterEach, expect, test, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GithubConfigSchema, eligible, type Issue } from '../src/github/config.js'
import { issueQualityVeto } from '../src/github/intake-quality.js'
import type { GithubClient } from '../src/github/client.js'
import { runGithub, publishIssue } from '../src/github/runner.js'
import { fingerprint, readState, saveState, type IssueState } from '../src/github/state.js'

const dirs: string[] = []
afterEach(() => { vi.restoreAllMocks(); dirs.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })) })
const metadata = (lines: string) => `\`\`\`yaml\nissue_quality_version: 2\n${lines}\n\`\`\``
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'adng-quality-veto-')); dirs.push(dir)
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: join(dir, 'source.json'), dataDir: dir, engine: 'writer', enabled: true, publish: true })
  writeFileSync(cfg.sourceConfig, '{}')
  const issue: Issue = { number: 7, title: 'Fix addition', body: 'ordinary human request', state: 'open', user: { login: 'owner' }, labels: [{ name: 'autodev' }] }
  const client: GithubClient = { list: async () => [issue], issue: async () => issue, findPr: async () => undefined, findLinkedPr: async () => undefined, createPr: vi.fn(async () => { throw new Error('unexpected publication') }) }
  const state: IssueState = { repo: cfg.repo, base: cfg.base, issue: structuredClone(issue), fingerprint: fingerprint(issue), status: 'queued', runs: 0, nextRunAt: 0 }
  return { cfg, issue, client, state }
}

test.each([null, 'autodev'])('veto stops product intake without spending attempts (label=%s)', async label => {
  const { cfg, issue, client } = fixture(); cfg.label = label
  issue.body = metadata('kind: RESEARCH\ntriage: NEEDS_EVIDENCE\nauto_implementation: false')
  const execute = vi.fn(), warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
  expect(await runGithub(cfg, { client, execute })).toBe('idle')
  expect(execute).not.toHaveBeenCalled(); expect(readState(cfg, 7)).toBeUndefined()
  expect(warning).toHaveBeenCalledWith('github-intake rejected Issue #7: issue-quality-auto-implementation-denied')
})

test.each([
  ['auto_implementation: false\nkind: BUG\ntriage: READY', 'auto-implementation-denied'],
  ['auto_implementation: true\nkind: RESEARCH\ntriage: READY', 'research-requires-review'],
  ['auto_implementation: true\nkind: BUG\ntriage: NEEDS_REVIEW', 'not-ready'],
  ['auto_implementation: true\nkind: BUG\ntriage: NEEDS_EVIDENCE', 'not-ready'],
  ['auto_implementation: false\nauto_implementation: true', 'malformed-metadata'],
  ['auto_implementation: !!bool true', 'malformed-metadata'],
  ['auto_implementation: perhaps', 'invalid-implementation-flag'],
])('bounded metadata rejects %s', (lines, reason) => {
  expect(issueQualityVeto(metadata(lines))).toBe(`issue-quality-${reason}`)
})

test('duplicate, malformed, unsupported and oversized metadata fail closed', () => {
  const ready = metadata('auto_implementation: true\nkind: BUG\ntriage: READY')
  expect(issueQualityVeto(ready + '\n' + ready)).toBe('issue-quality-ambiguous-blocks')
  expect(issueQualityVeto(ready.slice(0, -3))).toBe('issue-quality-malformed-block')
  expect(issueQualityVeto(ready + '\n' + ready.slice(0, -3))).toBe('issue-quality-malformed-block')
  expect(issueQualityVeto(ready.replace('issue_quality_version', 'ISSUE_QUALITY_VERSION'))).toBe('issue-quality-malformed-metadata')
  expect(issueQualityVeto(ready.replace('version: 2', 'version: 3'))).toBe('issue-quality-unsupported-version')
  expect(issueQualityVeto(metadata('note: ' + 'x'.repeat(4096)))).toBe('issue-quality-metadata-too-long')
  expect(issueQualityVeto('x'.repeat(64_001))).toBe('issue-quality-input-too-long')
})

test('READY/true never grants author, label, report or opt-out approval; ordinary Issues remain compatible', () => {
  const { cfg, issue } = fixture()
  expect(eligible(issue, cfg)).toBe(true)
  issue.body = metadata('auto_implementation: true\nkind: BUG\ntriage: READY')
  expect(eligible(issue, cfg)).toBe(true)
  expect(eligible({ ...issue, user: { login: 'stranger' } }, cfg)).toBe(false)
  expect(eligible({ ...issue, labels: [] }, cfg)).toBe(false)
  expect(eligible({ ...issue, labels: [{ name: 'NO-AUTOFIX' }, { name: 'autodev' }] }, cfg)).toBe(false)
  expect(eligible({ ...issue, labels: [{ name: 'autodev-reported' }, { name: 'autodev' }] }, cfg)).toBe(false)
})

test('withdrawal of quality approval cancels already queued work and blocks publication', async () => {
  const { cfg, issue, state, client } = fixture(); saveState(cfg, state)
  issue.body = metadata('auto_implementation: false\nkind: BUG\ntriage: NEEDS_REVIEW')
  const execute = vi.fn(), push = vi.fn()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  expect(await runGithub(cfg, { client, execute })).toBe('cancelled')
  expect(readState(cfg, 7)).toMatchObject({ runs: 0, status: 'cancelled' })
  expect(execute).not.toHaveBeenCalled()
  await expect(publishIssue(cfg, state, client, vi.fn(), push)).rejects.toThrow('approval')
  expect(push).not.toHaveBeenCalled(); expect(client.createPr).not.toHaveBeenCalled()
})
