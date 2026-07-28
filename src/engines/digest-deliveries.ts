import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { localDayUtcRange } from '../db.js'

/** digest「今日交付」段＋GOAL 狀態行（2026-07-28）：治北極星盤點的「產出不可見——
 * digest 全是計數，使用者要問才知道艦隊做了什麼」。全程 fail-open：任何讀取失敗回空。 */

const MAX_TITLES = 5
const TITLE_LEN = 48

/** 本地日內 events.jsonl 的 task-done 任務標題，前 5 筆＋「等 N 筆」；零筆或讀失敗回 []。 */
export function digestDeliveryLines(dataDir: string, isoDayUtc: string, offsetHours: number): string[] {
  try {
    const file = join(dataDir, 'events.jsonl')
    if (!existsSync(file)) return []
    const { startIso, endIso } = localDayUtcRange(isoDayUtc, offsetHours)
    const titles: string[] = []
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (!line) continue
      try {
        const e = JSON.parse(line) as { type?: unknown; ts?: unknown; task?: unknown }
        if (e.type !== 'task-done' || typeof e.ts !== 'string' || typeof e.task !== 'string') continue
        if (e.ts < startIso || e.ts >= endIso) continue
        titles.push(e.task.replace(/\s+/g, ' ').trim())
      } catch { /* 壞行跳過 */ }
    }
    if (titles.length === 0) return []
    const lines = [`今日交付 ${titles.length} 筆：`]
    for (const t of titles.slice(0, MAX_TITLES)) lines.push(`  ✓ ${t.slice(0, TITLE_LEN)}${t.length > TITLE_LEN ? '…' : ''}`)
    if (titles.length > MAX_TITLES) lines.push(`  …等共 ${titles.length} 筆`)
    return lines
  } catch {
    return []
  }
}

/** 當前 GOAL 一行（GOAL.md 首個非空、非標題行截 40 字）；缺檔/讀失敗回 null（整行省略）。 */
export function digestGoalLine(dataDir: string): string | null {
  try {
    const file = join(dataDir, 'GOAL.md')
    if (!existsSync(file)) return null
    const body = readFileSync(file, 'utf8').split(/\r?\n/).find(l => l.trim() && !l.trim().startsWith('#'))
    if (!body) return null
    const t = body.trim()
    return `當前 GOAL：${t.slice(0, 40)}${t.length > 40 ? '…' : ''}`
  } catch {
    return null
  }
}
