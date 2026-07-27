import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { RunDb } from './db.js'
import { countDlqLines, countVerifyAlertsToday } from './engines/digest-counts.js'
import { digestMechanismLines } from './engines/digest-mechanisms.js'
import { digestQuotaLines } from './engines/today-attempts-view.js'

export interface BuildDigestOpts {
  db: RunDb
  dataDir: string
  isoDayUtc: string
  /** M4 Task 3：本地日界線 offset（小時）。預設 0（UTC，等價舊行為，相容性錨點）；
   * 呼叫端（daemon checkAndSendDigest）一律帶入 cfg.timezoneOffsetHours。 */
  offsetHours?: number
  /** M9.9：訂閱制引擎 tag 清單（scheduler.subscriptionTags(cfg) 產出）。未傳＝視同無訂閱引擎
   * （billedUsd===costUsd，向後相容）。 */
  subscriptionEngines?: string[]
  /** M10.0 Task 6：perpetualDigestLine(dataDir) 產出的自主工程師台帳摘要行。
   * undefined/null＝整段省略（既有呼叫端不變、輸出逐位元組相同）；字串＝文末追加一行。 */
  perpetualLine?: string | null
  /** engines 設定（取 dailyAttemptCap）；未傳＝額度表不顯示 cap／餘量。 */
  engines?: Record<string, { dailyAttemptCap?: number }>
  /** blocked 任務文字清單；未傳/空＝整段省略。積壓需人工，只落 backlog 檔沒人看（鐵律 #4）。 */
  blockedTasks?: string[]
}

/** 每日必達摘要（鐵律 #6）：即使今天零任務、零成本，也要產出一份文字證明通道還活著。 */
export function buildDigest(opts: BuildDigestOpts): string {
  const { db, dataDir, isoDayUtc } = opts
  const offsetHours = opts.offsetHours ?? 0
  const stats = db.dayStats(isoDayUtc, offsetHours, opts.subscriptionEngines ?? [])
  const dlqCount = countDlqLines(dataDir)
  const { verifySkip, other } = countVerifyAlertsToday(dataDir, isoDayUtc, offsetHours)
  const engineStats = db.engineDayStats(isoDayUtc, offsetHours)
  const lines = [
    `adng 每日摘要 ${isoDayUtc}`,
    `完成 ${stats.ok} 筆／失敗 ${stats.fail} 筆`,
    `今日成本：真金 $${stats.billedUsd.toFixed(4)}｜訂閱名義 $${(stats.costUsd - stats.billedUsd).toFixed(4)}`,
    `DLQ 積壓：${dlqCount} 筆`,
  ]
  for (const e of engineStats) lines.push(`  引擎 ${e.engine}：${e.ok}/${e.n} 成，$${e.costUsd.toFixed(4)}`) // 每引擎戰績（路由決策依據）；零派工日自動省略
  lines.push(...digestQuotaLines(engineStats, opts.engines)) // 今日額度消耗表；無 attempts 且無 cap 時整段省略
  lines.push(...digestMechanismLines(dataDir, isoDayUtc, offsetHours))
  // N=0 不印，避免雜訊；N>0 才浮出（鐵律 #4：fail-open-with-alert，不能只落 events.jsonl 沒人看）。
  if (verifySkip > 0) {
    lines.push(`⚠ 本日 verify 略過 ${verifySkip} 次（安全網未啟用，請檢查 verifyCommand）`)
  }
  if (other > 0) {
    lines.push(`⚠ 本日驗證鏈其他告警 ${other} 次（詳見 events.jsonl）`)
  }
  const blockedTasks = opts.blockedTasks ?? []
  if (blockedTasks.length > 0) {
    lines.push(`⚠ blocked 積壓 ${blockedTasks.length} 筆（需人工重開或棄置）：`)
    for (const t of blockedTasks.slice(0, 5)) lines.push(`  - ${t.slice(0, 60)}`)
  }
  lines.push(`adng 通道自檢 OK`)
  if (opts.perpetualLine != null) lines.push(opts.perpetualLine)
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
