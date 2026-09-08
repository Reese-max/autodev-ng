import { test, expect } from 'vitest'
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import Database from 'better-sqlite3'
import { RunDb } from '../src/db.js'
import { attemptAccounting, accountingLines } from '../src/engines/attempt-accounting.js'
import { globalCostReport, globalBilledToday } from '../src/globalcost.js'

test('unknown usage is not zero; aliases never choose a model; invalid cache is unpriced', () => {
  const r = { ok: true, output: '', costUsd: 0, costUnknown: true }
  expect(attemptAccounting(r, {})).toMatchObject({ model: null, requestedModel: null, usageKnown: false, costSource: 'unknown', shadow: null })
  expect(attemptAccounting({ ...r, tokensIn: 0, tokensOut: 0, tokensCached: 0 }, { model: 'gpt-5.6-luna' })).toMatchObject({ usageKnown: true, shadow: { usd: 0 } })
  for (const n of [-1, NaN, Infinity, 1.5, 101]) expect(attemptAccounting({ ...r, tokensIn: 100, tokensOut: 2, tokensCached: n }, { model: 'gpt-5.6-luna' }).shadow).toBeNull()
  expect(attemptAccounting({ ...r, actualModel: 'dynamic/unknown', tokensIn: 100, tokensOut: 2, tokensCached: 0 }, { model: 'gpt-5.6-luna' }).shadow).toBeNull()
})

test('snapshots survive reopen; legacy rows remain unknown; validation does not duplicate usage', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-accounting-')), file = join(root, 'run.db'), ts = '2026-09-08T01:00:00Z'
  try {
    const old = new Database(file)
    old.exec("CREATE TABLE attempts(seq INTEGER PRIMARY KEY, task_id TEXT, ts TEXT, ok INTEGER, cost_usd REAL, detail TEXT)")
    old.prepare('INSERT INTO attempts VALUES (1,?,?,?,?,?)').run('legacy', ts, 1, 12, 'original evidence')
    old.close()
    let db = new RunDb(file)
    const a = attemptAccounting({ ok: true, output: '', costUsd: 0, costUnknown: true, tokensIn: 1_000_000, tokensOut: 100_000, tokensCached: 950_000 }, { model: 'gpt-5.6-sol', subscription: true, costPerRunUsd: 0 })
    expect(a.shadow?.usd).toBeCloseTo(3.725)
    const record = { taskId: 'new', ok: true, costUsd: 0, detail: '', ts, accounting: a }
    db.record(record)
    db.record({ ...record, taskId: 'validation', accounting: { ...a, stage: 'validation' } })
    db.record({ ...record, taskId: 'missing', accounting: attemptAccounting({ ok: true, output: '', costUsd: 0, costUnknown: true }, {}) })
    // Later configuration changes cannot relabel an already recorded subscription.
    db.record({ ...record, taskId: 'nominal', costUsd: 10, accounting: { ...a, shadow: null } })
    expect(db.billedCostForLocalDay('2026-09-08', 0, [])).toBe(12)
    db.close(); db = new RunDb(file)
    expect(db.accountingForDay('2026-09-08')).toMatchObject({ attempts: 4, usageKnown: 2, priced: 1, legacy: 1, unknownCost: 2, shadowUsd: 3.725, nominalUsd: 10 })
    expect(accountingLines(db.accountingForDay('2026-09-08')).join('\n')).toContain('非實付或節省金額')
    db.close()
    const raw = new Database(file, { readonly: true })
    expect(raw.prepare('SELECT detail, accounting_json FROM attempts WHERE seq=1').get()).toEqual({ detail: 'original evidence', accounting_json: null })
    expect(JSON.parse((raw.prepare('SELECT accounting_json FROM attempts WHERE task_id=?').get('new') as { accounting_json: string }).accounting_json)).toEqual(a)
    raw.close()
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('global inventory deduplicates databases and blocks conflicting policy, unknown cost and missing evidence', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-cost-scope-')), cfg = join(root, 'a.json'), now = '2026-09-08T01:00:00Z'
  try {
    mkdirSync(join(root, 'data'))
    const config = { dataDir: './data', timezoneOffsetHours: 8 }
    writeFileSync(cfg, JSON.stringify(config)); writeFileSync(join(root, 'alias.json'), JSON.stringify(config))
    let db = new RunDb(join(root, 'data/run.db'))
    db.record({ taskId: 'a', ok: true, costUsd: 2, detail: '', ts: now, accounting: attemptAccounting({ ok: true, output: '', costUsd: 2 }, {}) }); db.close()
    expect(globalCostReport(cfg, now)).toMatchObject({ complete: true, bookedUsd: 2, databases: 1 })
    writeFileSync(join(root, 'alias.json'), JSON.stringify({ ...config, timezoneOffsetHours: 0 }))
    expect(() => globalBilledToday(cfg, now)).toThrow('conflicting')
    writeFileSync(join(root, 'alias.json'), JSON.stringify(config))
    db = new RunDb(join(root, 'data/run.db'))
    db.record({ taskId: 'unknown', ok: true, costUsd: 0, detail: '', ts: now }); db.close()
    expect(globalCostReport(cfg, now)).toMatchObject({ complete: false, bookedUsd: 2 })
    writeFileSync(join(root, 'missing.json'), JSON.stringify({ dataDir: './absent' }))
    expect(() => globalBilledToday(cfg, now)).toThrow('incomplete')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
