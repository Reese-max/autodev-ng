import type Database from 'better-sqlite3'
import type { RunResult } from '../types.js'

export interface AccountingSnapshot {
  version: 1
  stage?: 'execution' | 'validation'
  model: string | null
  requestedModel: string | null
  costSource: 'provider-reported' | 'configured-estimate' | 'failure-estimate' | 'unknown'
  billing: 'subscription' | 'metered'
  usageKnown: boolean
  cacheKnown: boolean
  shadow: { usd: number; version: string; source: string; modelBasis: 'reported' | 'requested'; input: number; output: number; cached: number } | null
}

// Frozen historical reference values, NOT current provider prices or realized savings.
// Unknown/dynamic models are deliberately unpriced; never match on an engine alias.
const REFERENCE: Record<string, [number, number, number]> = {
  'gpt-5.6-sol': [5, 30, 0.5], 'gpt-5.6-terra': [2.5, 15, 0.25], 'gpt-5.6-luna': [1, 6, 0.1],
}
const count = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0

export function attemptAccounting(result: RunResult, config: { model?: string; subscription?: boolean; costPerRunUsd?: number }, failureEstimated = false): AccountingSnapshot {
  const usageKnown = count(result.tokensIn) && count(result.tokensOut)
  const cacheKnown = count(result.tokensCached) && usageKnown && result.tokensCached <= result.tokensIn!
  const model = result.actualModel ?? null, requestedModel = config.model ?? null
  const rate = REFERENCE[(model ?? requestedModel ?? '').replace(/^openai\//, '')]
  return {
    version: 1, model, requestedModel, usageKnown, cacheKnown,
    costSource: config.costPerRunUsd !== undefined ? 'configured-estimate' : failureEstimated ? 'failure-estimate' : result.costUnknown ? 'unknown' : 'provider-reported',
    billing: config.subscription ? 'subscription' : 'metered',
    shadow: rate && usageKnown && cacheKnown ? {
      usd: ((result.tokensIn! - result.tokensCached!) * rate[0] + result.tokensOut! * rate[1] + result.tokensCached! * rate[2]) / 1e6,
      version: 'legacy-reference-2026-07-29-v1', source: 'repository historical reference; not a verified current tariff',
      modelBasis: model ? 'reported' : 'requested', input: rate[0], output: rate[1], cached: rate[2],
    } : null,
  }
}

export function migrateAccounting(db: Database.Database): void {
  if (!(db.prepare('PRAGMA table_info(attempts)').all() as { name: string }[]).some(c => c.name.toLowerCase() === 'accounting_json')) {
    try { db.exec('ALTER TABLE attempts ADD COLUMN accounting_json TEXT') }
    catch (e) { if (!String(e).includes('duplicate column')) throw e }
  }
}

/** New rows retain their original billing classification when configuration changes. */
export function billedSnapshotCost(db: Database.Database, start: string, end: string, subscriptions: string[]): number {
  const columns = db.prepare('PRAGMA table_info(attempts)').all() as { name: string }[]
  const snapshot = columns.some(c => c.name.toLowerCase() === 'accounting_json') ? 'accounting_json AS accounting_json' : 'NULL AS accounting_json'
  const engine = columns.some(c => c.name.toLowerCase() === 'engine') ? 'engine AS engine' : "'' AS engine"
  const rows = db.prepare(`SELECT cost_usd, ${engine}, ${snapshot} FROM attempts WHERE ts >= ? AND ts < ?`).all(start, end) as { cost_usd: number; engine: string; accounting_json: string | null }[]
  let total = 0
  for (const row of rows) {
    const a = row.accounting_json ? JSON.parse(row.accounting_json) as AccountingSnapshot : null
    if (a?.stage === 'validation') continue
    if (a?.version === 1 && ['subscription', 'metered'].includes(a.billing) ? a.billing === 'subscription' : subscriptions.includes(row.engine)) continue
    if (!Number.isFinite(row.cost_usd) || row.cost_usd < 0) throw new Error('Invalid recorded cost')
    total += row.cost_usd
  }
  return total
}

export function accountingSummary(db: Database.Database, start: string, end: string) {
  const total = { attempts: 0, usageKnown: 0, priced: 0, legacy: 0, unknownCost: 0, reportedUsd: 0, estimatedUsd: 0, nominalUsd: 0, shadowUsd: 0 }
  const rows = db.prepare('SELECT cost_usd, accounting_json FROM attempts WHERE ts >= ? AND ts < ?').all(start, end) as { cost_usd: number; accounting_json: string | null }[]
  for (const row of rows) {
    let a: AccountingSnapshot | undefined
    try { a = row.accounting_json ? JSON.parse(row.accounting_json) as AccountingSnapshot : undefined } catch { /* unknown historical evidence */ }
    if (a?.stage === 'validation') continue
    total.attempts++
    if (!a || a.version !== 1) { total.legacy++; total.unknownCost++; continue }
    if (a.usageKnown) total.usageKnown++
    if (a.shadow && Number.isFinite(a.shadow.usd) && a.shadow.usd >= 0) { total.priced++; total.shadowUsd += a.shadow.usd }
    if (a.costSource === 'unknown') total.unknownCost++
    else if (a.billing === 'subscription') total.nominalUsd += row.cost_usd
    else if (a.costSource === 'provider-reported') total.reportedUsd += row.cost_usd
    else if (['configured-estimate', 'failure-estimate'].includes(a.costSource)) total.estimatedUsd += row.cost_usd
    else total.unknownCost++
  }
  return total
}

export function accountingLines(a: ReturnType<typeof accountingSummary>): string[] {
  return [
    `帳務來源：供應商回報 $${a.reportedUsd.toFixed(4)}｜估算 $${a.estimatedUsd.toFixed(4)}｜訂閱名義 $${a.nominalUsd.toFixed(4)}｜成本未知 ${a.unknownCost} 筆`,
    `用量覆蓋：${a.usageKnown}/${a.attempts} 筆；歷史來源未知 ${a.legacy} 筆`,
    `影子帳：${a.priced ? '$' + a.shadowUsd.toFixed(2) : '未知'}（${a.priced}/${a.attempts} 筆可估；其餘未知）。歷史費率參考估值，非實付或節省金額`,
  ]
}
