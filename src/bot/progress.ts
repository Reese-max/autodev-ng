/** /status 進度段（2026-07-27）：今日戰績＋最近完成任務＋blocked 積壓。
 * 全部唯讀 fail-open——任何來源讀失敗只省略該行，不反殺 status 查詢。 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { BacklogStore } from '../backlog.js'
import { localDay, type RunDb } from '../db.js'
import type { Config } from '../types.js'

const TAIL_BYTES = 64 * 1024
const RECENT_DONE_MAX = 3

/** events.jsonl 尾段撈最近 task-done 的任務文字（新→舊）。 */
export function recentDoneTasks(dataDir: string, max = RECENT_DONE_MAX): string[] {
  try {
    const raw = readFileSync(join(dataDir, 'events.jsonl'), 'utf8')
    const lines = raw.slice(-TAIL_BYTES).split(/\r?\n/).filter(Boolean)
    const done: string[] = []
    for (let i = lines.length - 1; i >= 0 && done.length < max; i--) {
      try {
        const e = JSON.parse(lines[i]!) as { type?: string; task?: string }
        if (e.type === 'task-done' && e.task) done.push(e.task)
      } catch { /* 尾段截斷的半行跳過 */ }
    }
    return done
  } catch {
    return []
  }
}

/** 組 /status 的進度行；無資料的段落安靜省略。 */
export function progressLines(cfg: Config, db: RunDb, store: BacklogStore): string[] {
  const lines: string[] = []
  try {
    const day = localDay(new Date().toISOString(), cfg.timezoneOffsetHours)
    const s = db.dayStats(day, cfg.timezoneOffsetHours)
    if (s.ok > 0 || s.fail > 0) lines.push(`今日戰績：完成 ${s.ok}／失敗 ${s.fail}`)
  } catch { /* fail-open */ }
  try {
    const done = recentDoneTasks(cfg.dataDir)
    if (done.length > 0) {
      lines.push('最近完成：')
      for (const t of done) lines.push(`  ✅ ${t.slice(0, 70)}`)
    }
  } catch { /* fail-open */ }
  try {
    const blocked = store.read().filter(t => t.status === 'blocked').length
    if (blocked > 0) lines.push(`⚠ blocked 積壓 ${blocked} 筆（/backlog 看明細）`)
  } catch { /* fail-open */ }
  return lines
}
