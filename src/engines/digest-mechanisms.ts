import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { localDay, localDayUtcRange } from '../db.js'
import { digestNoCommitCapAdviceLines } from './no-commit-cap-advice.js'

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_DAYS = 7
const EVENT_METRICS = [
  { type: 'merge-rebased', label: 'merge-rebased' },
  { type: 'author-northstar-reject', label: 'author-northstar-reject' },
  { type: 'engine-route-isolated', label: 'engine-route-isolated（含簽名熔斷）' },
  // judge 升級觀測（2026-07-28 terra xhigh）：SKIP 大增＝timeout 不夠或端點故障，判官形同虛設。
  { type: 'verify-alert', label: 'judge-skip（逾時/故障放行）', detailPrefix: 'judge-skip' },
] as const

interface DigestWindow {
  startMs: number
  endMs: number
  startIso: string
  endIso: string
  days: string[]
  offsetHours: number
}

function digestWindow(isoDayUtc: string, offsetHours: number): DigestWindow | null {
  const dayMs = Date.parse(`${isoDayUtc}T00:00:00.000Z`)
  if (!Number.isFinite(dayMs) || !Number.isFinite(offsetHours)) return null
  if (new Date(dayMs).toISOString().slice(0, 10) !== isoDayUtc) return null
  try {
    const endIso = localDayUtcRange(isoDayUtc, offsetHours).endIso
    const endMs = Date.parse(endIso)
    const startMs = endMs - WINDOW_DAYS * DAY_MS
    return {
      startMs,
      endMs,
      startIso: new Date(startMs).toISOString(),
      endIso,
      days: Array.from({ length: WINDOW_DAYS }, (_, i) =>
        new Date(dayMs - (WINDOW_DAYS - 1 - i) * DAY_MS).toISOString().slice(0, 10)),
      offsetHours,
    }
  } catch {
    return null
  }
}

/** 單一事件指標獨立讀取；缺檔或讀取失敗回 null，壞行只跳過該行。
 * detailPrefix 有值時再要求 event.detail 以其起頭（verify-alert 類事件靠 detail 前綴分型）。 */
function countRecentEvent(dataDir: string, type: string, window: DigestWindow, detailPrefix?: string): number | null {
  try {
    const file = join(dataDir, 'events.jsonl')
    if (!existsSync(file)) return null
    let count = 0
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (!line) continue
      try {
        const event = JSON.parse(line) as Record<string, unknown>
        const tsMs = typeof event.ts === 'string' ? Date.parse(event.ts) : Number.NaN
        if (event.type !== type || !Number.isFinite(tsMs) || tsMs < window.startMs || tsMs >= window.endMs) continue
        if (detailPrefix && !(typeof event.detail === 'string' && event.detail.startsWith(detailPrefix))) continue
        count++
      } catch { /* 壞行不影響其他事件或指標 */ }
    }
    return count
  } catch {
    return null
  }
}

interface DailyCount { day: string; count: number }

/** run.db 近七個本地日、detail 由指定前綴起頭的失敗趨勢；來源異常時獨立省略。
 * timeout 與 judge-mismatch（judge 升級成效觀測）共用。 */
function failureTrendByPrefix(dataDir: string, window: DigestWindow, prefix: string): DailyCount[] | null {
  const file = join(dataDir, 'run.db')
  if (!existsSync(file)) return null
  let db: Database.Database | undefined
  try {
    db = new Database(file, { readonly: true, fileMustExist: true, timeout: 50 })
    const rows = db.prepare(
      `SELECT ts FROM attempts WHERE ok = 0 AND substr(detail, 1, ${prefix.length}) = ? AND ts >= ? AND ts < ?`
    ).all(prefix, window.startIso, window.endIso) as Array<{ ts: unknown }>
    const counts = new Map(window.days.map(day => [day, 0]))
    for (const row of rows) {
      if (typeof row.ts !== 'string') continue
      const tsMs = Date.parse(row.ts)
      if (!Number.isFinite(tsMs) || tsMs < window.startMs || tsMs >= window.endMs) continue
      const day = localDay(row.ts, window.offsetHours)
      if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1)
    }
    return window.days.map(day => ({ day, count: counts.get(day) ?? 0 }))
  } catch {
    return null
  } finally {
    try { db?.close() } catch { /* fail-open */ }
  }
}

/**
 * 每日 digest 的機制成效段。任一來源失敗只省略自身統計；全數為零時整段省略。
 * ponytail: events 最多 20k 行且每日只組一次；逐指標掃描換取真正獨立 fail-open，
 * 若觀測事件型別明顯增加，再改成單次解析與逐欄容錯。
 */
export function digestMechanismLines(dataDir: string, isoDayUtc: string, offsetHours: number): string[] {
  const window = digestWindow(isoDayUtc, offsetHours)
  if (!window) return []
  const events = EVENT_METRICS.map(metric => ({
    ...metric,
    count: countRecentEvent(dataDir, metric.type, window, 'detailPrefix' in metric ? metric.detailPrefix : undefined),
  }))
  const timeoutTrend = failureTrendByPrefix(dataDir, window, 'timeout')
  const judgeTrend = failureTrendByPrefix(dataDir, window, 'judge-mismatch')
  const capAdvice = digestNoCommitCapAdviceLines(dataDir, isoDayUtc, offsetHours)
  const anyTrend = timeoutTrend?.some(day => day.count > 0) || judgeTrend?.some(day => day.count > 0)
  if (!events.some(metric => (metric.count ?? 0) > 0) && !anyTrend) return capAdvice

  // digest 可讀性（2026-07-28）：零值指標與全零趨勢是噪音——只列非零，讀者看到的每行都有資訊。
  const lines = ['機制成效（近 7 日）：']
  for (const metric of events) {
    if (metric.count !== null && metric.count > 0) lines.push(`  ${metric.label}：${metric.count} 次`)
  }
  if (timeoutTrend?.some(d => d.count > 0)) {
    lines.push(`  run.db timeout 類失敗趨勢：${timeoutTrend.map(({ day, count }) => `${day.slice(5)} ${count}`).join('｜')}`)
  }
  if (judgeTrend?.some(d => d.count > 0)) {
    lines.push(`  judge-mismatch 攔截趨勢：${judgeTrend.map(({ day, count }) => `${day.slice(5)} ${count}`).join('｜')}`)
  }
  return [...lines, ...capAdvice]
}
