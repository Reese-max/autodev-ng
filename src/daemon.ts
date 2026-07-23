import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { freemem, totalmem } from 'node:os'
import { join } from 'node:path'
import { acquireLock, releaseLock } from './lock.js'
import { localDay } from './db.js'
import { buildDigest, markDigestSent, shouldSendDigest } from './digest.js'
import { runOnce, subscriptionTags, type Deps, type CycleResult, type BlockedReason } from './scheduler.js'
import { consumeRestartSentinel } from './autopilot/restart-sentinel.js'
import { isSilenced } from './bot/silence.js'
import { quiet, type EventLog } from './events.js'
import { maybeRunPerpetual, perpetualDigestLine } from './autopilot/perpetual.js'
import { cleanupRoutingState } from './engines/routing-state-cleanup.js'
import { checkRoutingStateConsistency } from './engines/routing-state-consistency.js'

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
  /** 供測試注入：可用記憶體比例。生產預設 os.freemem()/os.totalmem()。 */
  memFreeRatioFn?: () => number
  /** M10.5：config 檔絕對路徑。有設時每輪自查檔案是否仍存在，消失→優雅退出（多專案退場語意）。測試可不設（跳過檢查）。 */
  cfgPath?: string
  /** 供測試注入：restart.request 哨兵刪除。生產不傳，走真實 unlinkSync。 */
  unlinkFn?: (path: string) => void
}

export type DaemonResult = 'lock-busy' | 'stopped' | 'max-cycles' | 'config-gone' | 'restart-requested'

const OOM_FREE_RATIO = 0.15
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

/** MEDIUM 1 修復：blocked 告警文案曾對所有原因統一印「連敗達上限」，但非 git 專案／
 * merge-conflict／branch-switched 都不是連敗，含糊文案會誤導人工介入的方向。 */
function blockedReasonText(reason: BlockedReason): string {
  switch (reason) {
    case 'max-attempts': return '連敗達上限，需人工介入'
    case 'not-a-git-repo': return 'worktree 建立失敗（非 git 專案或主 repo 狀態異常），需人工介入'
    case 'merge-conflict': return '主分支已前進導致無法自動合併，需人工介入合併'
    case 'branch-switched': return '主 repo 分支已切換或處於 detached HEAD，成果未合回，需人工介入合併'
    // M5 Task 1：任務 tag 不在本專案 engines 白名單，或引擎無法建立（adapter 未實作／env 缺）
    case 'engine-not-allowed': return '任務指定引擎不在本專案 engines 白名單（或引擎無法建立），需人工修 tag 或 config'
    // Task 2：worktree 殘留鎖定失敗獨立文案，不誤植 not-a-git-repo 的「非 git 專案」字樣。
    case 'worktree-locked': return 'worktree 殘留目錄被佔用無法清理（前次中斷進程未放手）'
    // 2026-07-16 事故：checkout 未落地的空/半套 worktree——派工前被 assertWorktreeCheckout 擋下。
    case 'worktree-invalid': return 'worktree checkout 未落地（空目錄/tracked 檔缺失），已拒絕派工，需人工檢查 git 狀態'
  }
}

export function baseAlertMessage(result: CycleResult): string {
  if (typeof result === 'object') {
    return `daemon 告警：任務 blocked（${blockedReasonText(result.reason)}）——任務：${[...result.taskText].slice(0, 80).join('')}`
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
  notifier: Notifier, dataDir: string, table: CooldownTable, events: EventLog, key: string, message: string
): Promise<void> {
  // 靜音窗:告警靜默但留痕(舊系統 L076 教訓:一次性告警在靜音窗內曾永久消失、無紀錄)；digest 不走此路(鐵律 #6 不受影響)。
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
  // M10.0 Task 6：perpetualDigestLine 本身已 fail-open 回 null；這層 try/catch 是
  // import/呼叫層的雙保險（belt-and-suspenders），任何故障一律降級為 null（省略該段）。
  // 終審 finding 1：perpetual 未開（M9.9 回歸線）時完全不呼叫——避免每輪側效建 run.db 表。
  let perpetualLine: string | null = null
  try { perpetualLine = deps.cfg.perpetual ? perpetualDigestLine(dataDir) : null } catch { /* fail-open */ }

  let text: string
  try {
    text = buildDigest({ db: deps.db, dataDir, isoDayUtc: yesterdayLocal(day), offsetHours, subscriptionEngines: subscriptionTags(deps.cfg), perpetualLine, engines: deps.cfg.engines })
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
  const alert = (key: string, message: string) =>
    sendCooldownAlert(notifier, deps.cfg.dataDir, cooldownTable, deps.events, key, message)

  let locked: boolean
  try {
    locked = acquireLock(lockDir)
  } catch (err) {
    // M5 Task 2：告警納冷卻閘（key 固定 daemon-acquire-throw）——respawn 排程／run-once
    // 反覆重啟撞同一 infra 故障（EPERM 類）時不洗版通知頻道；rethrow 語意不變
    // （原樣炸給排程器看，不可假活）。
    await alert('daemon-acquire-throw', `daemon 無法啟動：acquireLock 拋出 infra 故障——${String(err)}`)
    throw err
  }

  if (!locked) {
    // lock-busy 進程隨即退出：sendCooldownAlert 內對冷卻表的落地寫入是同步呼叫，
    // return 之前已完成，不會漏寫（鏡像既有 saveCooldownTable 同步寫慣例）。
    await alert('lock-busy', 'daemon 啟動失敗：lock 被佔用（single-flight，可能已有 instance 在跑）')
    return 'lock-busy'
  }

  try {
    // 啟動時路由狀態一致性：只警告標記，不改派工（fail-open）
    quiet(() => { const r = checkRoutingStateConsistency({ dataDir: deps.cfg.dataDir, engineRotation: deps.cfg.engineRotation, offsetHours: deps.cfg.timezoneOffsetHours }); if (r.warnings.length) deps.events.append('engine-route-consistency-warn', { warnings: r.warnings }) })
    let cycles = 0
    let consecutiveCrashes = 0

    while (true) {
      if (maxCycles !== undefined && cycles >= maxCycles) return 'max-cycles'
      cycles++

      // 每輪迴圈開頭檢查每日摘要（鐵律 #6）——stop 當天也必達
      await checkAndSendDigest(deps, notifier)

      // M10.5：多專案退場——config 檔被移除＝該專案退役，daemon 優雅自退（≤一輪生效；擺在 digest 之後：退役當輪到期的每日摘要仍必達，鐵律 #6）。
      if (opts.cfgPath && !existsSync(opts.cfgPath)) {
        quiet(() => deps.events.append('daemon-config-gone', { cfgPath: opts.cfgPath }))
        return 'config-gone'
      }

      // restart.request 哨兵（見 autopilot/restart-sentinel.ts）：cycle 邊界檢查優雅重啟，attempt 進行中不中斷。
      if (consumeRestartSentinel(deps.cfg.dataDir, deps.events, opts.unlinkFn)) return 'restart-requested'

      // M7.5:OOM 閘——可用記憶體 <15% 跳過本輪派工(舊系統教訓:高壓下 spawn 只會雪崩)
      // stop 優先於 OOM 跳輪——否則低記憶體期間操作者停不下 daemon(全分支審查 IMPORTANT)
      const memFree = opts.memFreeRatioFn ?? (() => freemem() / totalmem())
      let memFreeRatio = 1 // memFreeRatioFn 故障 fail-open（鐵律 #4）：視同記憶體充足
      try { memFreeRatio = memFree() } catch { /* fail-open */ }
      if (memFreeRatio < OOM_FREE_RATIO && !existsSync(deps.cfg.stopFile)) {
        await alert('oom-gate', 'daemon 告警:記憶體可用 <15%,本輪跳過派工')
        await sleep(idleSleepMs)
        continue
      }

      let result: CycleResult
      try {
        result = await runOnce(deps)
      } catch (err) {
        consecutiveCrashes++
        quiet(() => deps.events.append('runonce-crash', { error: String(err), consecutiveCrashes }))
        await alert('daemon-crash', `daemon 告警：runOnce 崩潰（連續第 ${consecutiveCrashes} 次）——${String(err)}`)

        if (consecutiveCrashes >= CONSECUTIVE_CRASH_PAUSE_THRESHOLD) {
          await alert('daemon-crash-pause', 'daemon 告警：連續崩潰暫停——已連續崩潰 5 次，暫停 30 分鐘後重試')
          await sleep(CRASH_PAUSE_MS)
          consecutiveCrashes = 0
        } else {
          const backoff = Math.min(cooldownMs * 2 ** consecutiveCrashes, MAX_BACKOFF_MS)
          await sleep(backoff)
        }
        continue
      }

      consecutiveCrashes = 0
      quiet(() => cleanupRoutingState(deps.cfg.dataDir, [deps.cfg.defaultEngine, ...(deps.cfg.engineRotation ?? [])]))

      if (result === 'stopped') return 'stopped'

      if (isAlertableResult(result)) {
        await alert(cooldownKeyFor(result), baseAlertMessage(result))
      }

      // M7：失敗驅動 reflect——教訓面故障吞掉,絕不反殺主迴圈(鐵律 #4)
      if (deps.lessons && (result === 'failed' || typeof result === 'object')) {
        try { await deps.lessons.reflect(result) } catch { /* fail-open */ }
      }

      // M10.0：idle 分支接外環（perpetual opt-in+fail-open+sleep 語意）。
      // M7.5:idle 要任務通知(6h 冷卻=持續 idle 每 6h 至多提醒一次,不洗版)
      if (result === 'idle' || result === 'cost-hard-stop') {
        if (result === 'idle') {
          let acted = false
          try { acted = await maybeRunPerpetual(deps, notifier) } catch { /* fail-open：外環故障不反殺 daemon（鐵律 #4） */ }
          if (acted) { await sleep(cooldownMs); continue }   // session 已耗時，短冷卻即回輪
          await alert('idle', 'daemon 提醒:backlog 已耗盡,請補任務')
        }
        await sleep(idleSleepMs)
      } else {
        await sleep(cooldownMs)
      }
    }
  } finally {
    releaseLock(lockDir)
  }
}
