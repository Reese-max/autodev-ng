import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { localDay, billedCostOnDb } from './db.js'
import { DEFAULT_TIMEZONE_OFFSET_HOURS } from './types.js'

/** M10.5 全域日頂查帳：掃 cfgPath 同目錄全部 *.json，逐專案唯讀開 run.db 加總「今日真金」。
 * 各專案用自己的 timezoneOffsetHours 算日窗、自己的 subscription 引擎清單排除（spec §3.4）。
 * 單檔任何失敗（壞 JSON/缺 dataDir/缺 db）跳過該檔——寧可低估不擋工作（fail-open）。
 * 禁用 RunDb 建構子（有建表副作用）——一律 new Database(file, { readonly: true })。
 * 真金 SQL 走 db.ts billedCostOnDb（單一真相源，不再在此鏡像）。 */
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
        const offset = typeof raw.timezoneOffsetHours === 'number' ? raw.timezoneOffsetHours : DEFAULT_TIMEZONE_OFFSET_HOURS
        const subscriptionEngines = Object.entries((raw.engines ?? {}) as Record<string, { subscription?: boolean }>)
          .filter(([, e]) => e?.subscription).map(([tag]) => tag)
        const day = localDay(nowIso, offset)
        const db = new Database(dbFile, { readonly: true })
        try {
          total += billedCostOnDb(db, day, offset, subscriptionEngines)
        } finally {
          db.close()
        }
      } catch {
        // 壞鄰居跳過（fail-open：寧可低估）。也涵蓋舊 schema 庫（attempts 無 engine 欄）配訂閱清單時
        // billedCostOnDb 的 `engine NOT IN (...)` 拋 no such column——該專案整筆漏出總帳（低估放行），
        // 方向與 spec §4 一致（全域頂是第二道防線，各專案日頂仍在）。
      }
    }
  } catch { return 0 }
  return total
}
