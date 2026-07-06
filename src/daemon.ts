import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { acquireLock, releaseLock } from './lock.js'
import { localDay } from './db.js'
import { buildDigest, markDigestSent, shouldSendDigest } from './digest.js'
import { runOnce, type Deps, type CycleResult } from './scheduler.js'

export interface Notifier {
  send(text: string): Promise<boolean>
}

export interface DaemonOpts {
  deps: Deps
  notifier: Notifier
  lockDir: string
  cooldownMs: number
  idleSleepMs: number
  /** 供測試注入：立即 resolve 並記錄呼叫。生產環境不傳，走真實 setTimeout。 */
  sleepFn?: (ms: number) => Promise<void>
  /** 供測試注入：限制主迴圈跑幾輪就停（供測試不掛在 while(true) 上）。生產不設。 */
  maxCycles?: number
}

export type DaemonResult = 'lock-busy' | 'stopped' | 'max-cycles'

const MAX_BACKOFF_MS = 10 * 60 * 1000
const CONSECUTIVE_CRASH_PAUSE_THRESHOLD = 5
const CRASH_PAUSE_MS = 30 * 60 * 1000

function defaultSleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** M4 Task 3：本地日字串（取代舊版純 UTC 切割）。offsetHours=0 時與舊行為完全一致（相容性錨點）。 */
function todayLocal(offsetHours: number): string {
  return localDay(new Date().toISOString(), offsetHours)
}

/** 本地日字串減一天（紅線 4 報告窗：digest 要報「已完結的前一天」，不能報「今天才剛開始的幾分鐘」）。
 * 用 Date UTC 運算（減 86400000ms 再取 ISO 前 10 碼）避開時區與月/年界字串拼接的陷阱。
 * 純日曆日減一天，跟 offset 無關（day 本身已經是依 offset 算出的本地日曆日字串——重命名自
 * 舊版 yesterdayUtc，行為不變，僅語意從「UTC 日」改為「本地日」，M4 Task 3）。 */
export function yesterdayLocal(day: string): string {
  return new Date(new Date(`${day}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10)
}

/** daemon 觀測/通知面自身故障絕不可反殺主迴圈——統一吞錯（鐵律 #4 精神，同 scheduler.ts 的 quiet）。 */
function quiet(fn: () => void): void {
  try {
    fn()
  } catch {
    // events 模組自身壞掉不該中斷 24/7 閉環
  }
}

/** notifier.send 依契約不該 throw（DiscordNotifier 內部已自吞），這裡再包一層防呆：
 * 萬一測試假 notifier 或未來實作違反契約 throw，也不可讓告警面反殺主迴圈。 */
async function safeSend(notifier: Notifier, text: string): Promise<boolean> {
  try {
    return await notifier.send(text)
  } catch {
    return false
  }
}

/** HIGH-2 告警冷卻去重：同 key 6h 內只送第一次，其後靜默累計抑制次數；冷卻結束後
 * 下一則帶抑制計數。硬編常數（不進 ConfigSchema——避免設定維度膨脹，鐵律 #8）。 */
const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000

interface CooldownEntry { lastSentMs: number; suppressedCount: number }
type CooldownTable = Record<string, CooldownEntry>

function cooldownFilePath(dataDir: string): string {
  return join(dataDir, 'alert-cooldown.json')
}

/** 冷卻表讀取：檔案缺失/損壞一律視同空表（容錯歸零照發——鐵律 #4，fail-open 不可反殺 daemon）。 */
function loadCooldownTable(dataDir: string): CooldownTable {
  try {
    const raw: unknown = JSON.parse(readFileSync(cooldownFilePath(dataDir), 'utf8'))
    if (typeof raw !== 'object' || raw === null) return {}
    return raw as CooldownTable
  } catch {
    return {}
  }
}

/** tmp+rename 原子寫，鏡像 events.ts appendOnce 風格。呼叫端一律包在 quiet() 內——
 * 落地失敗不可反殺主迴圈，頂多下次重啟冷卻表退回舊狀態（fail-open 方向安全）。 */
function saveCooldownTable(dataDir: string, table: CooldownTable): void {
  const file = cooldownFilePath(dataDir)
  const tmp = `${file}.tmp`
  writeFileSync(tmp, JSON.stringify(table))
  renameSync(tmp, file)
}

/** key 設計：系統級告警（cost-hard-stop/preflight-failed/lock-busy/daemon-crash/
 * daemon-crash-pause 等）key=固定字串本身；blocked → key=`blocked:<task.id>`
 * （修正：舊版用任務文字前 40 字，兩個長任務前 40 字相同會撞出同一個 key、互相吞
 * 告警——task.id 全域唯一，不會有這問題）。 */
function cooldownKeyFor(result: CycleResult): string {
  if (typeof result === 'object') return `blocked:${result.taskId}`
  return result
}

function isAlertableResult(result: CycleResult): boolean {
  return typeof result === 'object' || result === 'cost-hard-stop' || result === 'preflight-failed'
}

function baseAlertMessage(result: CycleResult): string {
  if (typeof result === 'object') {
    return `daemon 告警：任務 blocked（連敗達上限，需人工介入）——任務：${[...result.taskText].slice(0, 80).join('')}`
  }
  switch (result) {
    case 'cost-hard-stop':
      return 'daemon 告警：cost-hard-stop——今日成本已達硬停上限，暫停派工'
    case 'preflight-failed':
      return 'daemon 告警：preflight-failed——engine 尚未就緒'
    default:
      return `daemon 告警：${result}`
  }
}

/** 冷卻閘：同 key 冷卻窗（6h）內只送第一次，其後靜默累計 suppressedCount；冷卻窗過後
 * 下一則帶「（冷卻期間抑制 N 則）」。table 由呼叫端持有（記憶體 Map，daemon 運行期間
 * 全程共用同一份，避免每輪重新讀檔）；本函式只在有實際變動（抑制計數 +1／真的送出）
 * 時才落地寫檔，寫檔故障吞掉不炸（鐵律 #4）——不落地頂多下次重啟冷卻語意退回舊狀態，
 * 方向永遠是「fail-open 照發」而非「誤壓不發」。
 * digest 送出路徑（checkAndSendDigest）完全不經過這裡——每日必達（鐵律 #6）走自己的
 * stamp 機制，不受這裡任何冷卻狀態影響。
 * 接口採 key/message 而非 CycleResult：lock-busy、daemon-crash、daemon-crash-pause
 * 三種告警不是 runOnce 的 CycleResult，套不上 cooldownKeyFor/baseAlertMessage，改由
 * 呼叫端各自準備好 key 與文案（CycleResult 系告警則由呼叫點先呼叫
 * cooldownKeyFor(result)/baseAlertMessage(result) 算好再傳進來）。 */
async function sendCooldownAlert(
  notifier: Notifier, dataDir: string, table: CooldownTable, key: string, message: string
): Promise<void> {
  const now = Date.now()
  const entry = table[key]

  if (entry && now - entry.lastSentMs < ALERT_COOLDOWN_MS) {
    entry.suppressedCount++
    quiet(() => saveCooldownTable(dataDir, table))
    return
  }

  const suppressed = entry?.suppressedCount ?? 0
  const suffix = suppressed > 0 ? `（冷卻期間抑制 ${suppressed} 則）` : ''
  const sent = await safeSend(notifier, message + suffix)
  if (!sent) return // 沒送達：冷卻表不更新，維持「視同沒送過」語意，下一輪照樣可送

  table[key] = { lastSentMs: now, suppressedCount: 0 }
  quiet(() => saveCooldownTable(dataDir, table))
}

/** 每輪必檢：每日必達摘要（鐵律 #6）。送達（notifier.send 回 true）才落 stamp；
 * 送失敗（回 false）stamp 不落，下一輪 shouldSendDigest 仍為 true，自動重送。
 * digest 建置/讀寫 stamp 任何故障都吞掉——通知面故障不可中斷主迴圈。 */
async function checkAndSendDigest(deps: Deps, notifier: Notifier): Promise<void> {
  const dataDir = deps.cfg.dataDir
  const offsetHours = deps.cfg.timezoneOffsetHours
  const day = todayLocal(offsetHours)

  let due: boolean
  try {
    due = shouldSendDigest(dataDir, day)
  } catch {
    return
  }
  if (!due) return

  // stamp 判定仍用 today（重送/stop-day 語意不變）；實際聚合報「已完結的前一本地日」，
  // 否則今天輪首送出時 today 才過幾分鐘，ok/fail/cost/DLQ/verify-skip 全部趨近於 0（紅線 4）。
  let text: string
  try {
    text = buildDigest({ db: deps.db, dataDir, isoDayUtc: yesterdayLocal(day), offsetHours })
  } catch {
    return
  }

  const sent = await safeSend(notifier, text)
  if (!sent) return

  try {
    markDigestSent(dataDir, day)
  } catch {
    // stamp 沒落：下一輪 shouldSendDigest 仍判定要送，頂多重送一次，不違反鐵律 #6
  }
}

/**
 * 24/7 主迴圈（M3b 紅線 1 + 紅線 2 後半）。
 * - 紅線 1：每輪 runOnce 全包 try/catch，crash 不死、指數退避、連續 5 次暫停 30 分。
 * - 紅線 2 後半：acquireLock 接線——失敗（false）single-flight 讓步；throw（EPERM 類 infra 故障）
 *   炸給排程器看，不可假活。
 * - HIGH-2 補強：lock-busy／daemon-crash／daemon-crash-pause 三種告警也都走冷卻閘
 *   （key 各自獨立），避免 respawn 排程（Task 9，每 15 分嘗試）撞鎖或持續崩潰時
 *   把通知頻道洗爆。
 */
export async function runDaemon(opts: DaemonOpts): Promise<DaemonResult> {
  const { deps, notifier, lockDir, cooldownMs, idleSleepMs, maxCycles } = opts
  const sleep = opts.sleepFn ?? defaultSleep
  // 冷卻表：記憶體常駐 + 檔面持久化（daemon 重啟不歸零轟炸）；載入失敗已於
  // loadCooldownTable 內部容錯為空表（fail-open 照發，鐵律 #4）。
  // 挪到鎖檢查之前：lock-busy 告警也要吃得到冷卻閘。
  const cooldownTable = loadCooldownTable(deps.cfg.dataDir)

  let locked: boolean
  try {
    locked = acquireLock(lockDir)
  } catch (err) {
    await safeSend(notifier, `daemon 無法啟動：acquireLock 拋出 infra 故障——${String(err)}`)
    throw err
  }

  if (!locked) {
    // lock-busy 進程隨即退出：sendCooldownAlert 內對冷卻表的落地寫入是同步呼叫，
    // return 之前已完成，不會漏寫（鏡像既有 saveCooldownTable 同步寫慣例）。
    await sendCooldownAlert(
      notifier, deps.cfg.dataDir, cooldownTable,
      'lock-busy', 'daemon 啟動失敗：lock 被佔用（single-flight，可能已有 instance 在跑）'
    )
    return 'lock-busy'
  }

  try {
    let cycles = 0
    let consecutiveCrashes = 0

    while (true) {
      if (maxCycles !== undefined && cycles >= maxCycles) return 'max-cycles'
      cycles++

      // 每輪迴圈開頭檢查每日摘要（鐵律 #6）——stop 當天也必達
      await checkAndSendDigest(deps, notifier)

      let result: CycleResult
      try {
        result = await runOnce(deps)
      } catch (err) {
        consecutiveCrashes++
        quiet(() => deps.events.append('runonce-crash', { error: String(err), consecutiveCrashes }))
        await sendCooldownAlert(
          notifier, deps.cfg.dataDir, cooldownTable,
          'daemon-crash', `daemon 告警：runOnce 崩潰（連續第 ${consecutiveCrashes} 次）——${String(err)}`
        )

        if (consecutiveCrashes >= CONSECUTIVE_CRASH_PAUSE_THRESHOLD) {
          await sendCooldownAlert(
            notifier, deps.cfg.dataDir, cooldownTable,
            'daemon-crash-pause', 'daemon 告警：連續崩潰暫停——已連續崩潰 5 次，暫停 30 分鐘後重試'
          )
          await sleep(CRASH_PAUSE_MS)
          consecutiveCrashes = 0
        } else {
          const backoff = Math.min(cooldownMs * 2 ** consecutiveCrashes, MAX_BACKOFF_MS)
          await sleep(backoff)
        }
        continue
      }

      consecutiveCrashes = 0

      if (result === 'stopped') return 'stopped'

      if (isAlertableResult(result)) {
        await sendCooldownAlert(notifier, deps.cfg.dataDir, cooldownTable, cooldownKeyFor(result), baseAlertMessage(result))
      }

      if (result === 'idle' || result === 'cost-hard-stop') {
        await sleep(idleSleepMs)
      } else {
        await sleep(cooldownMs)
      }
    }
  } finally {
    releaseLock(lockDir)
  }
}
