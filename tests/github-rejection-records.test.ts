import { afterEach, expect, test, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { syncIssues, recordRejects } from '../src/github/runner.js'
import { githubClient } from '../src/github/client.js'
import { GithubConfigSchema } from '../src/github/config.js'
import { states } from '../src/github/state.js'
import { writeJsonAtomic } from '../src/guardian/incident.js'
import type { RejectedIssue } from '../src/github/client.js'

vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }))

vi.mock('node:fs', async (importOriginal) => {
  const actual: any = await importOriginal()
  return { ...actual, renameSync: vi.fn(actual.renameSync) }
})

vi.mock('../src/guardian/incident.js', async (importOriginal) => {
  const actual: any = await importOriginal()
  return { ...actual, writeJsonAtomic: vi.fn(actual.writeJsonAtomic) }
})

const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

function issueFixture(n = 17, body = '2 + 3 = 5') {
  return { number: n, title: 'Fix addition', body, state: 'open', user: { login: 'owner' }, labels: [{ name: 'autodev' }] }
}

test('syncIssues persists rejections, deduplicates repeated bad rows, and preserves healthy issues', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-reject-')); dirs.push(dir)
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: 'source.json', dataDir: dir, engine: 'writer' })
  const good = issueFixture(17, 'good body')
  const bad = { number: 18, body: 'bad', state: 'open', user: { login: 'owner' }, labels: [] }
  const run = vi.mocked(execFileSync)

  writeFileSync(join(dir, 'rejected-issues.json'), 'not-json{')

  run.mockReturnValueOnce(JSON.stringify([[good, bad, null, 99]]))
  await syncIssues(cfg, githubClient(cfg))

  const corruptBackups = readdirSync(dir).filter(f => f.startsWith('rejected-issues.json.corrupt.'))
  expect(corruptBackups.length).toBe(1)

  const issueStates = states(cfg)
  expect(issueStates).toHaveLength(1)
  expect(issueStates[0]!.issue.number).toBe(17)

  const rejectedPath = join(dir, 'rejected-issues.json')
  expect(existsSync(rejectedPath)).toBe(true)
  const first = JSON.parse(readFileSync(rejectedPath, 'utf8')) as { number?: number; detail: string; count: number }[]
  expect(first).toHaveLength(3)
  expect(first.find(r => r.number === 18)?.count).toBe(1)
  expect(first.some(r => r.detail === 'expected object, got null')).toBe(true)
  expect(first.some(r => r.detail === 'expected object, got number')).toBe(true)

  // Second sync with same malformed rows
  run.mockReturnValueOnce(JSON.stringify([[good, bad, null, 99]]))
  await syncIssues(cfg, githubClient(cfg))
  const second = JSON.parse(readFileSync(rejectedPath, 'utf8')) as { number?: number; detail: string; count: number }[]
  expect(second).toHaveLength(3)
  expect(second.find(r => r.number === 18)?.count).toBe(2)
  expect(second.find(r => r.detail === 'expected object, got null')?.count).toBe(2)
  expect(second.find(r => r.detail === 'expected object, got number')?.count).toBe(2)

  // Third sync with only healthy issues
  run.mockReturnValueOnce(JSON.stringify([[good]]))
  await syncIssues(cfg, githubClient(cfg))
  const third = JSON.parse(readFileSync(rejectedPath, 'utf8')) as { number?: number; detail: string; count: number }[]
  expect(third.find(r => r.number === 18)?.count).toBe(2)
  expect(third.find(r => r.detail === 'expected object, got number')?.count).toBe(2)
})

test('recordRejects treats malformed prior records as corrupt and backs them up', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-reject-shape-')); dirs.push(dir)
  writeFileSync(join(dir, 'rejected-issues.json'), JSON.stringify([null, { at: 1, detail: 2, count: 'x' }]))
  recordRejects(dir, [{ at: new Date().toISOString(), detail: 'x', page: 0, index: 0 }])
  const active = JSON.parse(readFileSync(join(dir, 'rejected-issues.json'), 'utf8')) as { detail: string }[]
  expect(active).toHaveLength(1)
  expect(active[0]!.detail).toBe('x')
  expect(readdirSync(dir).filter(f => f.startsWith('rejected-issues.json.corrupt.')).length).toBe(1)
})

test('recordRejects preserves corrupt original when backup rename fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-reject-backup-fail-')); dirs.push(dir)
  const original = 'not-json{'
  writeFileSync(join(dir, 'rejected-issues.json'), original)
  vi.mocked(renameSync).mockImplementationOnce(() => { throw new Error('EBUSY') })
  recordRejects(dir, [{ at: new Date().toISOString(), detail: 'x', page: 0, index: 0 }])
  expect(readFileSync(join(dir, 'rejected-issues.json'), 'utf8')).toBe(original)
  expect(readdirSync(dir).filter(f => f.startsWith('rejected-issues.json.corrupt.')).length).toBe(0)
})

test('recordRejects keeps active file untouched when overflow preservation fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-reject-overflow-fail-')); dirs.push(dir)
  const preseed = [{ at: new Date(0).toISOString(), detail: 'preseed', page: 0, index: 0, count: 1 }]
  writeFileSync(join(dir, 'rejected-issues.json'), JSON.stringify(preseed))
  const incoming: RejectedIssue[] = []
  for (let i = 0; i < 10001; i++) {
    incoming.push({ at: new Date(Date.now() - i).toISOString(), detail: `issue-${i}`, page: 0, index: i })
  }
  vi.mocked(writeJsonAtomic).mockImplementationOnce(() => { throw new Error('disk full') })
  recordRejects(dir, incoming)
  const active = JSON.parse(readFileSync(join(dir, 'rejected-issues.json'), 'utf8')) as unknown[]
  expect(active).toEqual(preseed)
})

test('recordRejects deduplicates repeated invalid rows and does not grow unbounded', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-reject-dedup-')); dirs.push(dir)
  const base: RejectedIssue = { at: new Date().toISOString(), detail: 'expected object, got null', page: 0, index: 0 }
  for (let i = 0; i < 100; i++) {
    recordRejects(dir, [{ ...base, at: new Date(Date.now() - i).toISOString() }])
  }
  const active = JSON.parse(readFileSync(join(dir, 'rejected-issues.json'), 'utf8')) as { count: number }[]
  expect(active).toHaveLength(1)
  expect(active[0]!.count).toBe(100)
})
