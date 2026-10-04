import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { basename, dirname, join, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { z } from 'zod'
import { localDay, localDayUtcRange, billedCostOnDb } from './db.js'
import { DEFAULT_TIMEZONE_OFFSET_HOURS, TimezoneOffsetHoursSchema } from './types.js'
import { issueBillingDbs, type ExtraBillingScope } from './globalcost/extra.js'

export { extraBillingScopes, issueBillingDbs, type ExtraBillingScope } from './globalcost/extra.js'

// Validate only the billing projection; do not resolve secrets or execute engines.
// Reuse the configured timezone rules, including its default, rather than drift.
const billingConfig = z.object({
  dataDir: z.string().min(1),
  timezoneOffsetHours: TimezoneOffsetHoursSchema.default(DEFAULT_TIMEZONE_OFFSET_HOURS),
  engines: z.record(z.string().min(1), z.object({ subscription: z.boolean().optional() })).default({}),
})
const billingScope = z.object({
  dir: z.string().min(1), offset: TimezoneOffsetHoursSchema,
  subscriptions: z.array(z.string().min(1)),
})
const accountingProjection = z.object({
  version: z.literal(1), stage: z.enum(['execution', 'validation']).optional(),
  billing: z.enum(['subscription', 'metered']).optional(),
  costSource: z.enum(['provider-reported', 'configured-estimate', 'failure-estimate', 'unknown']).optional(),
})

/** Read-only scope inventory. Missing/corrupt evidence is incomplete, never zero spend. */
export function globalCostReport(cfgPath: string, nowIso: string, extraScopes: ExtraBillingScope[] = [], sourceHash?: string) {
  const report = { bookedUsd: 0, complete: true, databases: 0, errors: [] as string[] }
  const seen = new Map<string, string>()
  const fail = (file: string, reason: string) => { report.complete = false; report.errors.push(`${file}: ${reason}`) }
  const billDb = (label: string, dbFile: string, offset: number, subscriptions: string[]) => {
    const identity = statSync(dbFile, { bigint: true }), key = `${identity.dev}:${identity.ino}`
    const policy = JSON.stringify({ offset, subscriptions })
    if (seen.has(key)) { if (seen.get(key) !== policy) fail(label, 'same database has conflicting billing policy'); return }
    seen.set(key, policy)
    const day = localDay(nowIso, offset), range = localDayUtcRange(day, offset)
    const db = new Database(dbFile, { readonly: true, fileMustExist: true })
    try {
      // Validate present receipts before billing/validation exemptions. Both
      // queries share one read transaction so a concurrent row cannot evade this.
      db.transaction(() => {
        const columns = db.prepare('PRAGMA table_info(attempts)').all() as { name: string }[]
        const hasSnapshot = columns.some(c => c.name.toLowerCase() === 'accounting_json')
        const rows = db.prepare(`SELECT engine, cost_usd, ${hasSnapshot ? 'accounting_json AS accounting_json' : 'NULL AS accounting_json'} FROM attempts WHERE ts >= ? AND ts < ?`).all(range.startIso, range.endIso) as { engine: string; cost_usd: number; accounting_json: string | null }[]
        const checked = rows.map(row => ({ row, a: row.accounting_json === null ? null : accountingProjection.parse(JSON.parse(row.accounting_json)) }))
        for (const { row, a } of checked) {
          if (!Number.isFinite(row.cost_usd) || row.cost_usd < 0) { fail(label, 'invalid recorded cost'); break }
          if (a?.stage === 'validation' || a?.billing === 'subscription' || (!a && subscriptions.includes(row.engine))) continue
          if (!a || !['provider-reported', 'configured-estimate', 'failure-estimate'].includes(a.costSource ?? '')) { fail(label, 'unresolved metered cost provenance'); break }
        }
        report.bookedUsd += billedCostOnDb(db, day, offset, subscriptions)
        report.databases++
      })()
    } finally { db.close() }
  }
  try {
    const source = resolve(cfgPath), dir = dirname(source)
    // The explicit authoritative config is always required, even with a custom
    // extension or example suffix. Readable siblings cannot replace a lost source.
    const files = new Set([basename(source), ...readdirSync(dir).filter(n => n.endsWith('.json') && !n.endsWith('.example.json'))])
    for (const f of [...files].sort()) {
      try {
        const content = readFileSync(join(dir, f))
        if (join(dir, f) === source && sourceHash !== undefined && createHash('sha256').update(content).digest('hex') !== sourceHash) throw new Error('source billing policy changed')
        const raw = billingConfig.parse(JSON.parse(content.toString('utf8')))
        const dbFile = realpathSync(join(resolve(dir, raw.dataDir), 'run.db'))
        const subscriptions = Object.entries(raw.engines).filter(([, e]) => e.subscription === true).map(([tag]) => tag).sort()
        billDb(f, dbFile, raw.timezoneOffsetHours, subscriptions)
      } catch { fail(f, 'unreadable or invalid accounting evidence') }
    }
  } catch { fail('scope', 'unreadable configuration directory') }
  for (const scope of extraScopes) {
    try {
      const checked = billingScope.parse(scope)
      for (const dbFile of issueBillingDbs(checked.dir)) billDb(dbFile, realpathSync(dbFile), checked.offset, checked.subscriptions)
    } catch { fail(scope.dir, 'unreadable or invalid accounting evidence') }
  }
  if (!report.databases) fail('scope', 'no readable databases')
  return report
}

/** Existing callers retain their numeric API, but must stop on incomplete accounting. */
export function globalBilledToday(cfgPath: string, nowIso: string, extraScopes?: ExtraBillingScope[], sourceHash?: string): number {
  const report = globalCostReport(cfgPath, nowIso, extraScopes, sourceHash)
  if (!report.complete) throw new Error(`Global accounting incomplete: ${report.errors.join('; ')}`)
  return report.bookedUsd
}
