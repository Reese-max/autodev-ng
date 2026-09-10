import { reviewRetryDelay } from './engines/pending-review.js'
import { refreshFreeModelCatalog } from './engines/free-model-catalog.js'
import { existsSync } from 'node:fs'
import { fenceUsurped, releaseLockIfOwned } from './engines/daemon-fence.js'
import { freemem, totalmem } from 'node:os'
import { acquireLock, releaseLock } from './lock.js'
import { buildDigest, markDigestSent, shouldSendDigest } from './digest.js'
import { runOnce, subscriptionTags, type Deps, type CycleResult } from './scheduler.js'
import { consumeRestartSentinel } from './autopilot/restart-sentinel.js'
import { quiet } from './events.js'
import { maybeRunPerpetual, perpetualDigestLine } from './autopilot/perpetual.js'
import { baseAlertMessage, cooldownKeyFor, isAlertableResult, loadCooldownTable, safeSend, sendCooldownAlert, todayLocal, yesterdayLocal } from './engines/daemon-alerts.js'
import { cleanupRoutingState } from './engines/routing-state-cleanup.js'
import { recordWorktreeGc } from './engines/worktree-gc.js'
import { checkRoutingStateConsistency } from './engines/routing-state-consistency.js'
import { maybeRunWeeklyReviewCalibration, reviewCalibrationDir } from './engines/review-calibration.js'

export { baseAlertMessage, yesterdayLocal } from './engines/daemon-alerts.js'
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

export type DaemonResult = 'lock-busy' | 'stopped' | 'max-cycles' | 'config-gone' | 'restart-requested' | 'usurped'

const OOM_FREE_RATIO = 0.15
const MAX_BACKOFF_MS = 10 * 60 * 1000
const CONSECUTIVE_CRASH_PAUSE_THRESHOLD = 5
const CRASH_PAUSE_MS = 30 * 60 * 1000

function defaultSleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
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

  let blockedTasks: string[] = []
  try { blockedTasks = deps.store.read().filter(t => t.status === 'blocked').map(t => t.text) } catch { /* fail-open：讀失敗省略該段 */ }
  try { await maybeRunWeeklyReviewCalibration({ cfg: deps.cfg }) } catch { /* 校準故障不可阻斷每日 digest */ }

  let text: string
  try {
    text = buildDigest({ db: deps.db, dataDir, isoDayUtc: yesterdayLocal(day), offsetHours, subscriptionEngines: subscriptionTags(deps.cfg), perpetualLine, engines: deps.cfg.engines, blockedTasks, reviewCalibrationDir: reviewCalibrationDir() })
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

      // §9 圍籬：被取代（pid.json 屬他人）＝一輪內自我了斷（詳 engines/daemon-fence.ts）。
      if (fenceUsurped(lockDir, process.pid, deps.events)) return 'usurped'

      // 每輪迴圈開頭檢查每日摘要（鐵律 #6）——stop 當天也必達
      await checkAndSendDigest(deps, notifier)

      // M10.5：多專案退場——config 檔被移除＝該專案退役，daemon 優雅自退（≤一輪生效；擺在 digest 之後：退役當輪到期的每日摘要仍必達，鐵律 #6）。
      if (opts.cfgPath && !existsSync(opts.cfgPath)) {
        quiet(() => deps.events.append('daemon-config-gone', { cfgPath: opts.cfgPath }))
        return 'config-gone'
      }

      // restart.request 哨兵（見 autopilot/restart-sentinel.ts）：cycle 邊界檢查優雅重啟，attempt 進行中不中斷。
      if (consumeRestartSentinel(deps.cfg.dataDir, deps.events, opts.unlinkFn)) return 'restart-requested'
      try { await refreshFreeModelCatalog(deps.cfg, notifier) } catch { await alert('free-catalog-state', '免費模型清單狀態無法讀寫；保留現場，實際呼叫仍須即時驗價。') }
      quiet(() => recordWorktreeGc(deps.cfg, deps.events))

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
        await alert(cooldownKeyFor(result), baseAlertMessage(result, deps.cfg))
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
          if (acted) { await sleep(deps.cfg.tierMode === 'free-only' ? reviewRetryDelay(deps.cfg, cooldownMs) : cooldownMs); continue }
          await alert('idle', 'daemon 提醒:backlog 已耗盡,請補任務')
        }
        await sleep(idleSleepMs)
      } else {
        await sleep(result === 'deferred' ? reviewRetryDelay(deps.cfg) : deps.cfg.tierMode === 'free-only' ? reviewRetryDelay(deps.cfg, cooldownMs, result === 'done') : cooldownMs)
      }
    }
  } finally {
    releaseLockIfOwned(lockDir, process.pid, releaseLock)
  }
}
