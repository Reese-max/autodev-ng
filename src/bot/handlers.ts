import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { progressLines } from './progress.js'
import type { Config } from '../types.js'
import type { BacklogStore } from '../backlog.js'
import { localDay, type RunDb } from '../db.js'
import { yesterdayLocal } from '../engines/daemon-alerts.js'
import type { LlmOpts } from '../autopilot/llm.js'
import type { EventLog } from '../events.js'
import { isSilenced } from './silence.js'
import { doPause, doResume, doSilence, doTask, doAsk, doGoal } from './actions.js'
import { subscriptionTags } from '../scheduler.js'
import { ProblemsLedger } from '../autopilot/ledger.js'

export interface BotDeps {
  cfg: Config
  store: BacklogStore
  db: RunDb
  llm: LlmOpts
  cfgPath: string // /goal run 需要轉傳給 spawn 的 autopilot run.js --config 參數
  // M9.4 fast-follow #2：長壽 EventLog 實例（doAsk 用），避免每呼叫 new EventLog()
  // 造成 O(n) 全檔讀行數。與 autopilot Deps.events 同款單例慣例（見 src/cli.ts assemble()）。
  events: EventLog
}

// Discord 單訊息上限鏡像 src/notify.ts:82（同一份截斷邏輯，避免兩處漂移）。
const MAX_LEN = 1900

function truncate(text: string): string {
  if (text.length <= MAX_LEN) return text
  return [...text].slice(0, MAX_LEN).join('') + '…[truncated]'
}

export interface CmdResult { ok: boolean; text: string }

interface Heartbeat {
  ts: string
  state: string
  currentTask?: string
  todayCostUsd: number
}

/** 讀 ${dataDir}/heartbeat.json。缺檔/損壞/欄位不符一律回 null，不炸（鏡像 src/cli.ts readHeartbeat）。 */
function readHeartbeat(dataDir: string): Heartbeat | null {
  try {
    const file = join(dataDir, 'heartbeat.json')
    if (!existsSync(file)) return null
    const raw = JSON.parse(readFileSync(file, 'utf8')) as unknown
    if (typeof raw !== 'object' || raw === null) return null
    const r = raw as Record<string, unknown>
    if (typeof r.ts !== 'string' || typeof r.state !== 'string' || typeof r.todayCostUsd !== 'number') return null
    return {
      ts: r.ts, state: r.state, todayCostUsd: r.todayCostUsd,
      currentTask: typeof r.currentTask === 'string' ? r.currentTask : undefined
    }
  } catch {
    return null
  }
}

/** 讀 ${dataDir}/daemon.lock/pid.json 判活，鏡像 src/lock.ts checkLockOwner 的 process.kill(pid,0) 慣例。
 * 缺檔/損壞/pid 非法一律回 false（此處只是狀態展示，寧可低估不誤報）。 */
function isDaemonAlive(dataDir: string): boolean {
  try {
    const file = join(dataDir, 'daemon.lock', 'pid.json')
    if (!existsSync(file)) return false
    const raw = JSON.parse(readFileSync(file, 'utf8')) as { pid?: unknown }
    if (typeof raw.pid !== 'number' || !Number.isInteger(raw.pid) || raw.pid <= 0) return false
    try {
      process.kill(raw.pid, 0)
      return true
    } catch (err) {
      return (err as NodeJS.ErrnoException).code !== 'ESRCH'
    }
  } catch {
    return false
  }
}

async function cmdStatus(d: BotDeps): Promise<CmdResult> {
  try {
    const hb = readHeartbeat(d.cfg.dataDir)
    const lines: string[] = ['adng 狀態']
    lines.push(hb
      ? `heartbeat：${hb.ts}｜state=${hb.state}${hb.currentTask ? `｜任務=${hb.currentTask}` : ''}｜今日成本 $${hb.todayCostUsd.toFixed(4)}`
      : '尚無 heartbeat 紀錄（daemon 未跑過或剛啟動）')
    lines.push(`daemon 進程：${isDaemonAlive(d.cfg.dataDir) ? '存活' : '未偵測到'}`)
    lines.push(...progressLines(d.cfg, d.db, d.store))
    if (existsSync(d.cfg.stopFile)) lines.push('已暫停')
    if (isSilenced(d.cfg.dataDir)) lines.push('靜音中')
    return { ok: true, text: lines.join('\n') }
  } catch {
    return { ok: false, text: '狀態查詢失敗，請稍後再試' }
  }
}

async function cmdCost(d: BotDeps): Promise<CmdResult> {
  try {
    const off = d.cfg.timezoneOffsetHours
    const today = localDay(new Date().toISOString(), off)
    const yesterday = yesterdayLocal(today)
    const tags = subscriptionTags(d.cfg)
    const stats = d.db.dayStats(today, off, tags)
    // M9.9 終審：昨日行同走雙數字——同一則訊息內今日雙數字、昨日名義大數會誤導，
    // 且與 digest 報同一天（昨日）的語意須一致。
    const yStats = d.db.dayStats(yesterday, off, tags)
    return {
      ok: true, text: [
        'adng 成本',
        `今日成本：真金 $${stats.billedUsd.toFixed(4)}｜訂閱名義 $${(stats.costUsd - stats.billedUsd).toFixed(4)}（成功 ${stats.ok}／失敗 ${stats.fail}）`,
        `昨日：真金 $${yStats.billedUsd.toFixed(4)}｜訂閱名義 $${(yStats.costUsd - yStats.billedUsd).toFixed(4)}`
      ].join('\n')
    }
  } catch {
    return { ok: false, text: '成本查詢失敗，請稍後再試' }
  }
}

async function cmdBacklog(d: BotDeps): Promise<CmdResult> {
  try {
    const tasks = d.store.read()
    const open = tasks.filter(t => t.status === 'open')
    const done = tasks.filter(t => t.status === 'done')
    const blocked = tasks.filter(t => t.status === 'blocked')
    const superseded = tasks.filter(t => t.status === 'superseded')
    return {
      ok: true, text: [
        `adng backlog：open ${open.length}｜done ${done.length}｜blocked ${blocked.length}｜superseded ${superseded.length}`,
        ...open.slice(0, 5).map(t => `- ${t.text}`)
      ].join('\n')
    }
  } catch {
    return { ok: false, text: 'backlog 讀取失敗，請稍後再試' }
  }
}

async function cmdLog(d: BotDeps): Promise<CmdResult> {
  try {
    const file = join(d.cfg.dataDir, 'events.jsonl')
    if (!existsSync(file)) return { ok: true, text: '尚無事件紀錄' }
    const lines = readFileSync(file, 'utf8').split(/\r?\n/).filter(l => l.length > 0)
    const last = lines.slice(-10)
    if (last.length === 0) return { ok: true, text: '尚無事件紀錄' }
    const summary = last.map(l => {
      try {
        const ev = JSON.parse(l) as Record<string, unknown>
        const ts = typeof ev.ts === 'string' ? ev.ts : '?'
        const type = typeof ev.type === 'string' ? ev.type : '?'
        return `${ts}｜${type}`
      } catch {
        return '（無法解析的一行）'
      }
    })
    return { ok: true, text: ['adng 近期事件', ...summary].join('\n') }
  } catch {
    return { ok: false, text: 'log 讀取失敗，請稍後再試' }
  }
}

/** 讀單一教訓檔，缺檔回 null（fail-open：不存在不算錯誤）。 */
function readLessonsFile(file: string): string | null {
  if (!existsSync(file)) return null
  const text = readFileSync(file, 'utf8').trim()
  return text.length > 0 ? text : null
}

/** /lessons：讀專案教訓(learningsFile，未設走 assemble 同款預設)＋全域教訓(globalLearningsFile，有設才讀)，
 * 兩層原文全輸出、都缺就回「教訓庫尚空」。缺檔/讀檔失敗一律人話（鏡像其餘 cmd* fail-open 慣例）。 */
async function cmdLessons(d: BotDeps): Promise<CmdResult> {
  try {
    const learningsFile = d.cfg.learningsFile ?? join(d.cfg.dataDir, 'learnings.md')
    const project = readLessonsFile(learningsFile)
    const global = d.cfg.globalLearningsFile ? readLessonsFile(d.cfg.globalLearningsFile) : null
    const parts: string[] = []
    if (project) parts.push(`【專案教訓】\n${project}`)
    if (global) parts.push(`【全域教訓】\n${global}`)
    // 教訓庫尚空不是錯誤——兩層皆缺屬合法狀態（查詢成功、資料為空），維持 ok:true。
    return { ok: true, text: parts.length > 0 ? parts.join('\n\n') : '教訓庫尚空' }
  } catch {
    return { ok: false, text: '教訓庫查詢失敗，請稍後再試' }
  }
}

/** /problems：對 dataDir/run.db 開唯讀 ProblemsLedger 連線，列 open top10（value DESC，
 * ledger.listByStatus 已排序）。每呼叫自開自關，不長駐（鏡像 perpetualDigestLine 慣例）；
 * 任何故障 fail-open 回人話，絕不炸 bot（M10.0 Task 6）。 */
async function cmdProblems(d: BotDeps): Promise<CmdResult> {
  let ledger: ProblemsLedger | undefined
  try {
    ledger = new ProblemsLedger(join(d.cfg.dataDir, 'run.db'))
    const open = ledger.listByStatus('open', 10)
    if (open.length === 0) return { ok: true, text: '目前無待處理問題' }
    return { ok: true, text: open.map(r => `v${r.value} [${r.lens}] ${r.title}`).join('\n') }
  } catch {
    return { ok: false, text: '問題台帳查詢失敗，請稍後再試' }
  } finally {
    try { ledger?.close() } catch { /* fail-open：關閉失敗不反殺 */ }
  }
}

/** 統一入口：路由到查詢（本檔）與控制（actions.ts）handler。未知指令回人話，
 * 任何 handler 內部意外 throw 一律在此吞掉（鐵律：永不 throw、永不外洩 token）。
 * 回傳結構化 {ok,text}：查詢類（status/cost/backlog/log/lessons）與控制類（actions.ts）
 * 皆據內部實際成敗回 ok（M9.4 fast-follow #3：查詢類 catch 到的內部錯誤現在也回 ok:false，
 * 讓 web 查詢面板故障可紅顯——「空資料但查詢成功」如教訓庫尚空不是錯誤，仍 ok:true）。 */
export async function handleCommand(name: string, arg: string, d: BotDeps): Promise<CmdResult> {
  const pass = (r: CmdResult): CmdResult => ({ ok: r.ok, text: truncate(r.text) })
  try {
    switch (name) {
      case 'status': return pass(await cmdStatus(d))
      case 'cost': return pass(await cmdCost(d))
      case 'backlog': return pass(await cmdBacklog(d))
      case 'log': return pass(await cmdLog(d))
      case 'lessons': return pass(await cmdLessons(d))
      case 'problems': return pass(await cmdProblems(d))
      case 'pause': return pass(await doPause(d))
      case 'resume': return pass(await doResume(d))
      case 'silence': return pass(await doSilence(d, arg))
      case 'task': return pass(await doTask(d, arg))
      case 'ask': return pass(await doAsk(d, arg))
      case 'goal': return pass(await doGoal(d, arg))
      default: return { ok: false, text: '未知指令' }
    }
  } catch {
    return { ok: false, text: '指令執行失敗，請稍後再試' }
  }
}
