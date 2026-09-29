import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, expect, test } from 'vitest'
import { globalCostReport } from '../src/globalcost.js'
import { OwnerConfigSchema, ownedRepos, ownerBillingScopes, repoConfig } from '../src/github/owner.js'

const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

type BillingRow = { ts: string; cost: number; engine: string; accounting?: string | null }
function seedDb(dataDir: string, rows: BillingRow[] = []): void {
  mkdirSync(dataDir, { recursive: true })
  const db = new Database(join(dataDir, 'run.db'))
  db.exec(`CREATE TABLE attempts(
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    ts TEXT NOT NULL,
    ok INTEGER NOT NULL,
    cost_usd REAL NOT NULL,
    detail TEXT NOT NULL,
    engine TEXT NOT NULL DEFAULT '',
    accounting_json TEXT
  )`)
  for (const row of rows) db.prepare('INSERT INTO attempts (task_id, ts, ok, cost_usd, detail, engine, accounting_json) VALUES (?,?,?,?,?,?,?)')
    .run('task', row.ts, 1, row.cost, '', row.engine, row.accounting === undefined ? JSON.stringify({ version: 1, costSource: 'provider-reported' }) : row.accounting)
  db.close()
}

function setup() {
  const root = mkdtempSync(join(tmpdir(), 'adng-owner-budget-policy-')); dirs.push(root)
  const configDir = join(root, 'configs'), ownerDataDir = join(root, 'owner-data')
  mkdirSync(configDir, { recursive: true }); mkdirSync(ownerDataDir, { recursive: true })
  const currentConfig = join(configDir, 'current.json'), siblingConfig = join(configDir, 'sibling.json')
  const currentData = join(root, 'current-data'), siblingData = join(root, 'sibling-data')
  seedDb(currentData); seedDb(siblingData)
  const source = (dataDir: string, offset: number, writerSubscription: boolean) => ({
    projectPath: root, backlogFile: 'BACKLOG.md', dataDir, timezoneOffsetHours: offset,
    engines: { writer: { adapter: 'mock', subscription: writerSubscription }, meter: { adapter: 'mock' } }, defaultEngine: 'writer'
  })
  writeFileSync(currentConfig, JSON.stringify(source('../current-data', 14, true)))
  writeFileSync(siblingConfig, JSON.stringify(source('../sibling-data', -12, false)))
  const owner = OwnerConfigSchema.parse({ owner: 'owner', authors: ['owner'], sourceConfig: currentConfig, dataDir: ownerDataDir,
    engine: 'writer', enabled: true, publish: false, label: null, projects: { 'owner/sibling': siblingConfig } })
  const row = (name: string) => ({ full_name: name, owner: { login: 'owner' }, default_branch: 'main', archived: false,
    disabled: false, has_issues: true, permissions: { push: true } })
  const repos = ownedRepos('owner', [[row('owner/current'), row('owner/sibling')]])
  const currentDir = repoConfig(owner, repos[0]!).dataDir
  const siblingDir = repoConfig(owner, repos[1]!).dataDir
  seedDb(join(currentDir, 'issue-1'))
  seedDb(join(siblingDir, 'issue-2'), [
    { ts: '2026-09-28T13:00:00.000Z', cost: 20, engine: 'writer', accounting: null },
    { ts: '2026-09-28T11:00:00.000Z', cost: 40, engine: 'meter' },
  ])
  return { owner, repos, currentConfig, ownerDataDir }
}

test('owner scopes keep each repo timezone and subscription policy for its Issue databases', () => {
  const { owner, repos, currentConfig, ownerDataDir } = setup()
  const scopes = ownerBillingScopes(owner, repos, 'owner/current')
  expect(scopes.map(({ offset, subscriptions }) => ({ offset, subscriptions })).sort((a, b) => a.offset - b.offset)).toEqual([
    { offset: -12, subscriptions: [] }, { offset: 14, subscriptions: ['writer'] },
  ])

  const report = globalCostReport(currentConfig, '2026-09-29T02:00:00.000Z', scopes)
  expect(report.complete).toBe(false) // sibling legacy writer is not a subscription under its own policy, so unknown provenance fails closed
  expect(report.errors.join('; ')).toContain('unresolved metered cost provenance')
  expect(report.bookedUsd).toBe(20) // sibling local day excludes the 11:00Z meter row

  const oldSharedPolicy = globalCostReport(currentConfig, '2026-09-29T02:00:00.000Z', [
    { dir: ownerDataDir, offset: 14, subscriptions: ['writer'] },
  ])
  expect(oldSharedPolicy.complete).toBe(true) // wrongly treats sibling writer history as subscription spend
  expect(oldSharedPolicy.bookedUsd).toBe(40) // and uses the current repo's different local-day window
})

test('owner billing fails closed when historical repo attempts have no source policy', () => {
  const { owner, repos, ownerDataDir } = setup()
  const unknown = join(ownerDataDir, 'repo-unknown', 'issue-9')
  seedDb(unknown, [{ ts: '2026-09-29T00:00:00.000Z', cost: 5, engine: 'writer' }])
  expect(() => ownerBillingScopes(owner, repos, 'owner/current')).toThrow('Unmapped owner billing database')
  expect(existsSync(join(unknown, 'run.db'))).toBe(true)
})
