import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { isSilenced } from '../bot/silence.js'
import { localDay } from '../db.js'
import type { BlockedReason, CycleResult } from '../scheduler.js'
import { quiet, type EventLog } from '../events.js'

/** daemon 告警面的純輔助與冷卻閘；主迴圈只負責決定何時呼叫。 */

/** M4 Task 3：本地日字串（取代舊版純 UTC 切割）。offsetHours=0 時與舊行為完全一致（相容性錨點）。 */
export function todayLocal(offsetHours: number): string {
  return localDay(new Date().toISOString(), offsetHours)
}

/** 本地日字串減一天；day 已是依 offset 算出的本地日曆日。 */
export function yesterdayLocal(day: string): string {
  return new Date(new Date(`${day}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10)
}

export async function safeSend(notifier: { send(text: string): Promise<boolean> }, text: string): Promise<boolean> {
  try {
    return await notifier.send(text)
  } catch {
    return false
  }
}

const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000
interface CooldownEntry { lastSentMs: number; suppressedCount: number }
type CooldownTable = Record<string, CooldownEntry>

function cooldownFilePath(dataDir: string): string {
  return join(dataDir, 'alert-cooldown.json')
}

export function loadCooldownTable(dataDir: string): CooldownTable {
  try {
    const raw: unknown = JSON.parse(readFileSync(cooldownFilePath(dataDir), 'utf8'))
    if (typeof raw !== 'object' || raw === null) return {}
    return raw as CooldownTable
  } catch {
    return {}
  }
}

function saveCooldownTable(dataDir: string, table: CooldownTable): void {
  const file = cooldownFilePath(dataDir)
  const tmp = `${file}.tmp`
  writeFileSync(tmp, JSON.stringify(table))
  renameSync(tmp, file)
}

export function cooldownKeyFor(result: CycleResult): string {
  if (typeof result === 'object') return `blocked:${result.taskId}`
  return result
}

export function isAlertableResult(result: CycleResult): boolean {
  return typeof result === 'object' || result === 'cost-hard-stop' || result === 'preflight-failed' || result === 'deferred'
}

function blockedReasonText(reason: BlockedReason, detail?: string): string {
  switch (reason) {
    case 'max-attempts': return '連敗達上限，需人工介入'
    case 'not-a-git-repo': return 'worktree 建立失敗（非 git 專案或主 repo 狀態異常），需人工介入'
    case 'merge-conflict': return '主分支已前進導致無法自動合併，需人工介入合併'
    case 'completion-gate': return detail ?? 'auto-goal completion gate 拒絕，成果分支已保留'
    case 'verification-infra': return detail ?? '必要測試無法執行，成果未合回，需修復驗證環境'
    case 'review-unavailable': return detail ?? '必要 Reviewer 無法完成審查，成果未合回'
    case 'release-approval': return detail ?? '發布核可缺失或與候選 commit 不符，成果未合回'
    case 'ownership-drift': return detail ?? '實際變更超出核發 ownership，成果未合回'
    case 'merge-queue-recovery': return detail ?? '持久化 merge queue 無法安全復原，成果分支已保留'
    case 'team-state-quarantined': return detail ?? '前次執行租約過期且狀態不明，已隔離避免覆寫成果'
    case 'dirty-worktree': return detail ?? '主工作目錄有未提交變更檔阻擋合併，需先提交或移至分支保存'
    case 'branch-switched': return '主 repo 分支已切換或處於 detached HEAD，成果未合回，需人工介入合併'
    case 'engine-not-allowed': return '任務指定引擎不在本專案 engines 白名單（或引擎無法建立），需人工修 tag 或 config'
    case 'worktree-locked': return 'worktree 殘留目錄被佔用無法清理（前次中斷進程未放手）'
    case 'worktree-invalid': return 'worktree checkout 未落地（空目錄/tracked 檔缺失），已拒絕派工，需人工檢查 git 狀態'
    case 'infra:worktree-timeout': return 'worktree Git 操作逾時（基礎設施容量問題，非引擎能力不足）'
    case 'infra:engine-external-termination': return '引擎子進程遭外部終止（基礎設施問題，非引擎能力不足）'
  }
}

export function baseAlertMessage(result: CycleResult): string {
  if (typeof result === 'object') {
    return `daemon 告警：任務 blocked（${blockedReasonText(result.reason, result.alertDetail)}）——任務：${[...result.taskText].slice(0, 80).join('')}`
  }
  switch (result) {
    case 'cost-hard-stop': return 'daemon 告警：cost-hard-stop——今日成本已達硬停上限，暫停派工'
    case 'preflight-failed': return 'daemon 告警：preflight-failed——engine 尚未就緒'
    case 'deferred': return 'daemon 告警：deferred——目前引擎供應已耗盡，任務保持 open，待冷卻後重試'
    default: return `daemon 告警：${result}`
  }
}

export async function sendCooldownAlert(
  notifier: { send(text: string): Promise<boolean> }, dataDir: string, table: CooldownTable,
  events: EventLog, key: string, message: string,
): Promise<void> {
  if (isSilenced(dataDir)) { quiet(() => events.append('alert-silenced', { key })); return }
  const now = Date.now()
  const entry = table[key]
  if (entry && now - entry.lastSentMs < ALERT_COOLDOWN_MS) {
    entry.suppressedCount++
    quiet(() => saveCooldownTable(dataDir, table))
    return
  }
  const suppressed = entry?.suppressedCount ?? 0
  const suffix = suppressed > 0 ? `（冷卻期間抑制 ${suppressed} 則）` : ''
  if (!await safeSend(notifier, message + suffix)) return
  table[key] = { lastSentMs: now, suppressedCount: 0 }
  quiet(() => saveCooldownTable(dataDir, table))
}
