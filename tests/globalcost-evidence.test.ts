import { afterEach, expect, test } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { globalBilledToday, globalCostReport } from '../src/globalcost.js'

const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })
const now = '2026-09-29T02:00:00.000Z'
function seed(dir: string, cost: number, accounting: string | null = JSON.stringify({ version: 1, costSource: 'provider-reported' })) {
  mkdirSync(dir, { recursive: true })
  const db = new Database(join(dir, 'run.db'))
  db.exec('CREATE TABLE attempts(ts TEXT NOT NULL, engine TEXT NOT NULL, cost_usd REAL NOT NULL, accounting_json TEXT)')
  db.prepare('INSERT INTO attempts VALUES(?,?,?,?)').run(now, 'meter', cost, accounting)
  db.close()
}
function fixture(sourceName = 'source.json') {
  const root = mkdtempSync(join(tmpdir(), 'adng-accounting-evidence-')); roots.push(root)
  const configDir = join(root, 'configs'); mkdirSync(configDir)
  seed(join(root, 'source-data'), 20); seed(join(root, 'sibling-data'), 0)
  const source = join(configDir, sourceName)
  writeFileSync(source, JSON.stringify({ dataDir: '../source-data', timezoneOffsetHours: 8 }))
  const sibling = join(configDir, 'sibling.json')
  writeFileSync(sibling, JSON.stringify({ dataDir: '../sibling-data', timezoneOffsetHours: 8 }))
  return { root, source, sibling }
}

test('missing explicit config cannot be replaced by readable sibling databases', () => {
  const f = fixture(); rmSync(f.source)
  expect(globalCostReport(f.source, now).complete).toBe(false)
  expect(() => globalBilledToday(f.source, now)).toThrow('incomplete')
})

test.each(['active.example.json', 'active.conf'])('explicit source %s is always in the accounting inventory', name => {
  const f = fixture(name)
  expect(globalCostReport(f.source, now)).toMatchObject({ complete: true, bookedUsd: 20, databases: 2 })
})

test.each(['false', 1, null])('invalid subscription %s cannot waive unknown metered spend', subscription => {
  const f = fixture()
  rmSync(join(f.root, 'sibling-data'), { recursive: true, force: true })
  seed(join(f.root, 'sibling-data'), 999, null)
  writeFileSync(f.sibling, JSON.stringify({ dataDir: '../sibling-data', engines: { meter: { subscription } } }))
  expect(globalCostReport(f.source, now).complete).toBe(false)
})

test.each([-13, 0.5, 15])('invalid explicit scope offset %s cannot silently move its billing window', offset => {
  const f = fixture(); const dir = join(f.root, 'issues'); mkdirSync(dir)
  seed(join(dir, 'issue-9'), 30)
  expect(globalCostReport(f.source, now, [{ dir, offset, subscriptions: [] }]).complete).toBe(false)
})

test('empty subscription tag cannot relabel unknown historical engine rows', () => {
  const f = fixture(); const dir = join(f.root, 'issues'); mkdirSync(dir)
  seed(join(dir, 'issue-9'), 30)
  expect(globalCostReport(f.source, now, [{ dir, offset: 8, subscriptions: [''] }]).complete).toBe(false)
})

test('each database uses its own half-open local-day boundaries, including exact midnight', () => {
  const f = fixture()
  const configure = (file: string, dataDir: string, offset: number) => writeFileSync(file, JSON.stringify({ dataDir, timezoneOffsetHours: offset }))
  configure(f.source, '../source-data', 14); configure(f.sibling, '../sibling-data', -12)
  const replace = (dir: string, start: string, end: string, admitted: number[]) => {
    const db = new Database(join(dir, 'run.db')); db.exec('DELETE FROM attempts')
    const write = db.prepare('INSERT INTO attempts VALUES(?,?,?,?)')
    for (const [ts, cost] of [
      [new Date(Date.parse(start) - 1).toISOString(), 1000], [start, admitted[0]!],
      [new Date(Date.parse(end) - 1).toISOString(), admitted[1]!], [end, 1000],
    ] as const) write.run(ts, 'meter', cost, JSON.stringify({ version: 1, costSource: 'provider-reported' }))
    db.close()
  }
  replace(join(f.root, 'source-data'), '2026-09-28T10:00:00.000Z', '2026-09-29T10:00:00.000Z', [1, 2])
  replace(join(f.root, 'sibling-data'), '2026-09-28T12:00:00.000Z', '2026-09-29T12:00:00.000Z', [4, 5])
  expect(globalCostReport(f.source, now)).toMatchObject({ complete: true, bookedUsd: 12, databases: 2 })
})

test.each([
  { version: 1, costSource: 'provider-reported', billing: 'invalid' },
  { version: 999, costSource: 'unknown', billing: 'metered', stage: 'validation' },
])('malformed receipt %j cannot waive a recorded cost', receipt => {
  const f = fixture()
  rmSync(join(f.root, 'sibling-data'), { recursive: true, force: true })
  seed(join(f.root, 'sibling-data'), 999, JSON.stringify(receipt))
  writeFileSync(f.sibling, JSON.stringify({ dataDir: '../sibling-data', engines: { meter: { subscription: true } } }))
  expect(globalCostReport(f.source, now).complete).toBe(false)
})

test('empty present receipt cannot take the legacy subscription exemption', () => {
  const f = fixture()
  rmSync(join(f.root, 'sibling-data'), { recursive: true, force: true })
  seed(join(f.root, 'sibling-data'), 999, '')
  writeFileSync(f.sibling, JSON.stringify({ dataDir: '../sibling-data', engines: { meter: { subscription: true } } }))
  expect(globalCostReport(f.source, now).complete).toBe(false)
})

test.each(['issue', 'repo', 'revisions', 'revision'] as const)('unexpected %s directory links cannot hide billed databases', kind => {
  const f = fixture(), scope = join(f.root, 'scope'), linked = join(f.root, 'linked')
  mkdirSync(scope); mkdirSync(linked)
  if (kind === 'issue') { seed(linked, 999); symlinkSync(linked, join(scope, 'issue-9'), 'junction') }
  if (kind === 'repo') { seed(join(linked, 'issue-9'), 999); symlinkSync(linked, join(scope, 'repo-9'), 'junction') }
  if (kind === 'revisions') { mkdirSync(join(scope, 'issue-9')); seed(join(linked, '2'), 999); symlinkSync(linked, join(scope, 'issue-9', 'revisions'), 'junction') }
  if (kind === 'revision') { mkdirSync(join(scope, 'issue-9', 'revisions'), { recursive: true }); seed(linked, 999); symlinkSync(linked, join(scope, 'issue-9', 'revisions', '2'), 'junction') }
  expect(globalCostReport(f.source, now, [{ dir: scope, offset: 8, subscriptions: [] }]).complete).toBe(false)
})

test('a dangling run.db link is incomplete evidence, not an empty Issue', () => {
  const f = fixture(), scope = join(f.root, 'scope'), linked = join(f.root, 'linked')
  mkdirSync(join(scope, 'issue-9'), { recursive: true }); mkdirSync(linked)
  symlinkSync(linked, join(scope, 'issue-9', 'run.db'), 'junction'); rmSync(linked, { recursive: true })
  expect(globalCostReport(f.source, now, [{ dir: scope, offset: 8, subscriptions: [] }]).complete).toBe(false)
})
