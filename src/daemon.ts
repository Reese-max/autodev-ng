import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { acquireLock, releaseLock } from './lock.js'
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

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
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

/** blocked 事件本身不帶任務文字，runOnce 內在派工當下已把 currentTask 寫進 heartbeat.json
 * （scheduler.ts 的 'running' heartbeat），blocked 是同一輪任務失敗轉出，heartbeat 尚未被
 * 覆寫，讀出來的 currentTask 正是剛被 blocked 的那個任務。讀檔/解析任何故障一律回 undefined，
 * 不可讓告警文案組裝反殺主迴圈。 */
function readHeartbeatCurrentTask(dataDir: string): string | undefined {
  try {
    const raw: unknown = JSON.parse(readFileSync(join(dataDir, 'heartbeat.json'), 'utf8'))
    if (typeof raw !== 'object' || raw === null) return undefined
    const currentTask = (raw as Record<string, unknown>).currentTask
    return typeof currentTask === 'string' ? currentTask : undefined
  } catch {
    return undefined
  }
}

function alertMessageFor(result: CycleResult, dataDir: string): string {
  switch (result) {
    case 'blocked': {
      const task = readHeartbeatCurrentTask(dataDir) ?? ''
      return `daemon 告警：任務 blocked（連敗達上限，需人工介入）——任務：${[...task].slice(0, 80).join('')}`
    }
    case 'cost-hard-stop':
      return 'daemon 告警：cost-hard-stop——今日成本已達硬停上限，暫停派工'
    case 'preflight-failed':
      return 'daemon 告警：preflight-failed——engine 尚未就緒'
    default:
      return `daemon 告警：${result}`
  }
}

/** 每輪必檢：每日必達摘要（鐵律 #6）。送達（notifier.send 回 true）才落 stamp；
 * 送失敗（回 false）stamp 不落，下一輪 shouldSendDigest 仍為 true，自動重送。
 * digest 建置/讀寫 stamp 任何故障都吞掉——通知面故障不可中斷主迴圈。 */
async function checkAndSendDigest(deps: Deps, notifier: Notifier): Promise<void> {
  const dataDir = deps.cfg.dataDir
  const day = todayUtc()

  let due: boolean
  try {
    due = shouldSendDigest(dataDir, day)
  } catch {
    return
  }
  if (!due) return

  let text: string
  try {
    text = buildDigest({ db: deps.db, dataDir, isoDayUtc: day })
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
 */
export async function runDaemon(opts: DaemonOpts): Promise<DaemonResult> {
  const { deps, notifier, lockDir, cooldownMs, idleSleepMs, maxCycles } = opts
  const sleep = opts.sleepFn ?? defaultSleep

  let locked: boolean
  try {
    locked = acquireLock(lockDir)
  } catch (err) {
    await safeSend(notifier, `daemon 無法啟動：acquireLock 拋出 infra 故障——${String(err)}`)
    throw err
  }

  if (!locked) {
    await safeSend(notifier, 'daemon 啟動失敗：lock 被佔用（single-flight，可能已有 instance 在跑）')
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
        await safeSend(notifier, `daemon 告警：runOnce 崩潰（連續第 ${consecutiveCrashes} 次）——${String(err)}`)

        if (consecutiveCrashes >= CONSECUTIVE_CRASH_PAUSE_THRESHOLD) {
          await safeSend(notifier, 'daemon 告警：連續崩潰暫停——已連續崩潰 5 次，暫停 30 分鐘後重試')
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

      if (result === 'blocked' || result === 'cost-hard-stop' || result === 'preflight-failed') {
        await safeSend(notifier, alertMessageFor(result, deps.cfg.dataDir))
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
