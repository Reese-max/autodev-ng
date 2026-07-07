import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { localDay, type RunDb } from './db.js'

export interface BuildDigestOpts {
  db: RunDb
  dataDir: string
  isoDayUtc: string
  /** M4 Task 3：本地日界線 offset（小時）。預設 0（UTC，等價舊行為，相容性錨點）；
   * 呼叫端（daemon checkAndSendDigest）一律帶入 cfg.timezoneOffsetHours。 */
  offsetHours?: number
}

function dlqPath(dataDir: string): string {
  return join(dataDir, 'notify-dlq.jsonl')
}

/** DLQ 積壓行數。缺檔＝0；容錯讀檔（權限/競態問題時仍回 0，不讓摘要炸掉——鐵律 #6：摘要本身就是通道自檢，自己不能先倒）。 */
function countDlqLines(dataDir: string): number {
  const file = dlqPath(dataDir)
  if (!existsSync(file)) return 0
  try {
    const content = readFileSync(file, 'utf8')
    if (content.trim() === '') return 0
    return content.split(/\r?\n/).filter(line => line.length > 0).length
  } catch {
    return 0
  }
}

function eventsPath(dataDir: string): string {
  return join(dataDir, 'events.jsonl')
}

/** verify-alert 分計結果（M4 Task 4）：verifySkip=安全網未啟用（verify-skip 前綴）；
 * other=驗證鏈其他告警（judge-skipped/judge-skip/rollback-failed/rollback-exception/verifier-exception 等，
 * 依 detail 前綴分流，非 verify-skip 一律歸此類——覆蓋所有既有與未來新增的告警前綴，不必逐一列舉維護）。 */
interface VerifyAlertCounts { verifySkip: number; other: number }

/** 當日 verify-alert 事件分計（紅線 4：verify skip 若不落 digest，config 打錯字時安全網靜默關閉沒人知道）。
 * 缺檔＝{0,0}；容錯讀檔/逐行解析（同 countDlqLines：摘要本身就是通道自檢，自己不能先倒——鐵律 #6）。
 * 日界線改用 localDay(ts, offsetHours)===isoDayUtc（M4 Task 3）：offsetHours=0 時與舊版
 * ts.slice(0,10) 前綴比對完全等價（相容性錨點），offsetHours≠0 時依本地日曆日歸類。 */
function countVerifyAlertsToday(dataDir: string, isoDayUtc: string, offsetHours: number): VerifyAlertCounts {
  const zero: VerifyAlertCounts = { verifySkip: 0, other: 0 }
  const file = eventsPath(dataDir)
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
          if (typeof detail === 'string' && detail.startsWith('verify-skip:')) {
            counts.verifySkip++
          } else {
            counts.other++
          }
        }
      } catch {
        // 壞行跳過，不讓整份摘要因為單一壞行炸掉
      }
    }
    return counts
  } catch {
    return zero
  }
}

/** 每日必達摘要（鐵律 #6）：即使今天零任務、零成本，也要產出一份文字證明通道還活著。 */
export function buildDigest(opts: BuildDigestOpts): string {
  const { db, dataDir, isoDayUtc } = opts
  const offsetHours = opts.offsetHours ?? 0
  const stats = db.dayStats(isoDayUtc, offsetHours)
  const dlqCount = countDlqLines(dataDir)
  const { verifySkip, other } = countVerifyAlertsToday(dataDir, isoDayUtc, offsetHours)
  const lines = [
    `adng 每日摘要 ${isoDayUtc}`,
    `完成 ${stats.ok} 筆／失敗 ${stats.fail} 筆`,
    `今日成本：$${stats.costUsd.toFixed(4)}`,
    `DLQ 積壓：${dlqCount} 筆`,
  ]
  // N=0 不印，避免雜訊；N>0 才浮出（鐵律 #4：fail-open-with-alert，不能只落 events.jsonl 沒人看）。
  if (verifySkip > 0) {
    lines.push(`⚠ 本日 verify 略過 ${verifySkip} 次（安全網未啟用，請檢查 verifyCommand）`)
  }
  if (other > 0) {
    lines.push(`⚠ 本日驗證鏈其他告警 ${other} 次（詳見 events.jsonl）`)
  }
  lines.push(`adng 通道自檢 OK`)
  return lines.join('\n')
}

interface DigestStamp {
  lastSentDay?: string
}

function stampPath(dataDir: string): string {
  return join(dataDir, 'digest-stamp.json')
}

/** 損壞（缺檔/非法 JSON/欄位型別不符）一律視為「尚未發送過」——寧可多發一次，不可漏發（鐵律 #6）。 */
function loadStamp(dataDir: string): DigestStamp {
  const file = stampPath(dataDir)
  if (!existsSync(file)) return {}
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'))
    if (typeof parsed !== 'object' || parsed === null) return {}
    const lastSentDay = (parsed as Record<string, unknown>).lastSentDay
    return typeof lastSentDay === 'string' ? { lastSentDay } : {}
  } catch {
    return {}
  }
}

export function shouldSendDigest(dataDir: string, isoDayUtc: string): boolean {
  return loadStamp(dataDir).lastSentDay !== isoDayUtc
}

/** tmp+rename 原子寫入，避免與同時讀取 stamp 的行程撞見半寫檔案。 */
export function markDigestSent(dataDir: string, isoDayUtc: string): void {
  const file = stampPath(dataDir)
  const tmp = `${file}.tmp`
  writeFileSync(tmp, JSON.stringify({ lastSentDay: isoDayUtc }))
  renameSync(tmp, file)
}
