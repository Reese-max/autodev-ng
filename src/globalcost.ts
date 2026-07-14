import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { localDay, localDayUtcRange } from './db.js'

/** M10.5 全域日頂查帳：掃 cfgPath 同目錄全部 *.json，逐專案唯讀開 run.db 加總「今日真金」。
 * 各專案用自己的 timezoneOffsetHours 算日窗、自己的 subscription 引擎清單排除（spec §3.4）。
 * 單檔任何失敗（壞 JSON/缺 dataDir/缺 db）跳過該檔——寧可低估不擋工作（fail-open）。
 * 禁用 RunDb 建構子（有建表副作用）——一律 new Database(file, { readonly: true })。 */
export function globalBilledToday(cfgPath: string, nowIso: string): number {
  let total = 0
  try {
    const dir = dirname(resolve(cfgPath))
    for (const f of readdirSync(dir).filter(n => n.endsWith('.json')).sort()) {
      try {
        const raw = JSON.parse(readFileSync(join(dir, f), 'utf8')) as Record<string, unknown>
        if (typeof raw.dataDir !== 'string') continue
        const dbFile = join(resolve(dir, raw.dataDir), 'run.db')
        if (!existsSync(dbFile)) continue
        const offset = typeof raw.timezoneOffsetHours === 'number' ? raw.timezoneOffsetHours : 0
        const subscriptionEngines = Object.entries((raw.engines ?? {}) as Record<string, { subscription?: boolean }>)
          .filter(([, e]) => e?.subscription).map(([tag]) => tag)
        const day = localDay(nowIso, offset)
        const db = new Database(dbFile, { readonly: true })
        try {
          // 逐字鏡像 db.ts RunDb.billedCostForLocalDay（:93）：訂閱引擎排除、engine 空欄算真金。
          if (subscriptionEngines.length === 0) {
            const { startIso, endIso } = localDayUtcRange(day, offset)
            const row = db.prepare(
              'SELECT COALESCE(SUM(cost_usd),0) AS c FROM attempts WHERE ts >= ? AND ts < ?'
            ).get(startIso, endIso) as { c: number }
            total += row.c
          } else {
            const { startIso, endIso } = localDayUtcRange(day, offset)
            const ph = subscriptionEngines.map(() => '?').join(',')
            const row = db.prepare(
              `SELECT COALESCE(SUM(cost_usd),0) AS c FROM attempts WHERE ts >= ? AND ts < ? AND engine NOT IN (${ph})`
            ).get(startIso, endIso, ...subscriptionEngines) as { c: number }
            total += row.c
          }
        } finally {
          db.close()
        }
      } catch { /* 壞鄰居跳過（fail-open：寧可低估） */ }
    }
  } catch { return 0 }
  return total
}
