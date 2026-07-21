/**
 * digest 觀測計數（DLQ 行數、verify-alert 分計）。
 * 自 kernel digest.ts 外移以守 kernel 行數預算；語意不變、fail-open。
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { localDay } from '../db.js'

/** DLQ 積壓行數。缺檔／讀失敗＝0（鐵律 #6：摘要自己不能先倒）。 */
export function countDlqLines(dataDir: string): number {
  const file = join(dataDir, 'notify-dlq.jsonl')
  if (!existsSync(file)) return 0
  try {
    const content = readFileSync(file, 'utf8')
    if (content.trim() === '') return 0
    return content.split(/\r?\n/).filter(line => line.length > 0).length
  } catch {
    return 0
  }
}

export interface VerifyAlertCounts { verifySkip: number; other: number }

/**
 * 當日 verify-alert 分計：verify-skip 前綴 → verifySkip，其餘 → other。
 * 日界：localDay(ts, offsetHours)===isoDayUtc；缺檔／壞行 fail-open。
 */
export function countVerifyAlertsToday(
  dataDir: string,
  isoDayUtc: string,
  offsetHours: number,
): VerifyAlertCounts {
  const zero: VerifyAlertCounts = { verifySkip: 0, other: 0 }
  const file = join(dataDir, 'events.jsonl')
  if (!existsSync(file)) return zero
  try {
    const content = readFileSync(file, 'utf8')
    if (content.trim() === '') return zero
    const counts: VerifyAlertCounts = { verifySkip: 0, other: 0 }
    for (const line of content.split(/\r?\n/)) {
      if (line.length === 0) continue
      try {
        const parsed = JSON.parse(line) as Record<string, unknown>
        const ts = parsed.ts
        const detail = parsed.detail
        if (parsed.type === 'verify-alert' && typeof ts === 'string' && localDay(ts, offsetHours) === isoDayUtc) {
          if (typeof detail === 'string' && detail.startsWith('verify-skip:')) counts.verifySkip++
          else counts.other++
        }
      } catch { /* 壞行跳過 */ }
    }
    return counts
  } catch {
    return zero
  }
}
