import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { localDay, localDayUtcRange, billedCostOnDb } from './db.js'
import { DEFAULT_TIMEZONE_OFFSET_HOURS } from './types.js'

/** Read-only scope inventory. Missing/corrupt evidence is incomplete, never zero spend. */
export function globalCostReport(cfgPath: string, nowIso: string) {
  const report = { bookedUsd: 0, complete: true, databases: 0, errors: [] as string[] }
  const seen = new Map<string, string>()
  const fail = (file: string, reason: string) => { report.complete = false; report.errors.push(`${file}: ${reason}`) }
  try {
    const dir = dirname(resolve(cfgPath))
    for (const f of readdirSync(dir).filter(n => n.endsWith('.json') && !n.endsWith('.example.json')).sort()) {
      try {
        const raw = JSON.parse(readFileSync(join(dir, f), 'utf8')) as Record<string, unknown>
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('invalid config')
        if (typeof raw.dataDir !== 'string') { fail(f, 'missing dataDir'); continue }
        const dbFile = realpathSync(join(resolve(dir, raw.dataDir), 'run.db'))
        const offset = raw.timezoneOffsetHours === undefined ? DEFAULT_TIMEZONE_OFFSET_HOURS : raw.timezoneOffsetHours
        if (typeof offset !== 'number' || !Number.isFinite(offset) || Math.abs(offset) > 14) throw new Error('invalid timezone')
        const subscriptions = Object.entries((raw.engines ?? {}) as Record<string, { subscription?: boolean }>).filter(([, e]) => e?.subscription).map(([tag]) => tag).sort()
        const identity = statSync(dbFile, { bigint: true }), key = `${identity.dev}:${identity.ino}`
        const policy = JSON.stringify({ offset, subscriptions })
        if (seen.has(key)) { if (seen.get(key) !== policy) fail(f, 'same database has conflicting billing policy'); continue }
        seen.set(key, policy)
        const day = localDay(nowIso, offset), range = localDayUtcRange(day, offset)
        const db = new Database(dbFile, { readonly: true, fileMustExist: true })
        try {
          report.bookedUsd += billedCostOnDb(db, day, offset, subscriptions)
          report.databases++
          const columns = db.prepare('PRAGMA table_info(attempts)').all() as { name: string }[]
          const hasSnapshot = columns.some(c => c.name.toLowerCase() === 'accounting_json')
          const rows = db.prepare(`SELECT engine, cost_usd, ${hasSnapshot ? 'accounting_json AS accounting_json' : 'NULL AS accounting_json'} FROM attempts WHERE ts >= ? AND ts < ?`).all(range.startIso, range.endIso) as { engine: string; cost_usd: number; accounting_json: string | null }[]
          for (const row of rows) {
            if (!Number.isFinite(row.cost_usd) || row.cost_usd < 0) { fail(f, 'invalid recorded cost'); break }
            const a = row.accounting_json ? JSON.parse(row.accounting_json) as { version?: number; costSource?: string; stage?: string; billing?: string } : null
            if (a?.stage === 'validation' || (a?.version === 1 && a.billing === 'subscription') || (!a && subscriptions.includes(row.engine))) continue
            if (a?.version !== 1 || !['provider-reported', 'configured-estimate', 'failure-estimate'].includes(a.costSource ?? '')) { fail(f, 'unresolved metered cost provenance'); break }
          }
        } finally { db.close() }
      } catch { fail(f, 'unreadable or invalid accounting evidence') }
    }
    if (!report.databases) fail('scope', 'no readable databases')
  } catch { fail('scope', 'unreadable configuration directory') }
  return report
}

/** Existing callers retain their numeric API, but must stop on incomplete accounting. */
export function globalBilledToday(cfgPath: string, nowIso: string): number {
  const report = globalCostReport(cfgPath, nowIso)
  if (!report.complete) throw new Error(`Global accounting incomplete: ${report.errors.join('; ')}`)
  return report.bookedUsd
}
