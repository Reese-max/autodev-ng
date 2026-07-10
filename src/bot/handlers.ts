import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Config } from '../types.js'
import type { BacklogStore } from '../backlog.js'
import { localDay, type RunDb } from '../db.js'
import { yesterdayLocal } from '../daemon.js'
import type { LlmOpts } from '../autopilot/llm.js'
import { isSilenced } from './silence.js'
import { doPause, doResume, doSilence, doTask, doAsk } from './actions.js'

export interface BotDeps {
  cfg: Config
  store: BacklogStore
  db: RunDb
  llm: LlmOpts
}

// Discord 單訊息上限鏡像 src/notify.ts:82（同一份截斷邏輯，避免兩處漂移）。
const MAX_LEN = 1900

function truncate(text: string): string {
  if (text.length <= MAX_LEN) return text
  return [...text].slice(0, MAX_LEN).join('') + '…[truncated]'
}

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

async function cmdStatus(d: BotDeps): Promise<string> {
  try {
    const hb = readHeartbeat(d.cfg.dataDir)
    const lines: string[] = ['adng 狀態']
    lines.push(hb
      ? `heartbeat：${hb.ts}｜state=${hb.state}${hb.currentTask ? `｜任務=${hb.currentTask}` : ''}｜今日成本 $${hb.todayCostUsd.toFixed(4)}`
      : '尚無 heartbeat 紀錄（daemon 未跑過或剛啟動）')
    lines.push(`daemon 進程：${isDaemonAlive(d.cfg.dataDir) ? '存活' : '未偵測到'}`)
    if (existsSync(d.cfg.stopFile)) lines.push('已暫停')
    if (isSilenced(d.cfg.dataDir)) lines.push('靜音中')
    return lines.join('\n')
  } catch {
    return '狀態查詢失敗，請稍後再試'
  }
}

async function cmdCost(d: BotDeps): Promise<string> {
  try {
    const off = d.cfg.timezoneOffsetHours
    const today = localDay(new Date().toISOString(), off)
    const yesterday = yesterdayLocal(today)
    const stats = d.db.dayStats(today, off)
    const yesterdayCost = d.db.costForLocalDay(yesterday, off)
    return [
      'adng 成本',
      `今日：$${stats.costUsd.toFixed(4)}（成功 ${stats.ok}／失敗 ${stats.fail}）`,
      `昨日：$${yesterdayCost.toFixed(4)}`
    ].join('\n')
  } catch {
    return '成本查詢失敗，請稍後再試'
  }
}

async function cmdBacklog(d: BotDeps): Promise<string> {
  try {
    const tasks = d.store.read()
    const open = tasks.filter(t => t.status === 'open')
    const done = tasks.filter(t => t.status === 'done')
    const blocked = tasks.filter(t => t.status === 'blocked')
    return [
      `adng backlog：open ${open.length}｜done ${done.length}｜blocked ${blocked.length}`,
      ...open.slice(0, 5).map(t => `- ${t.text}`)
    ].join('\n')
  } catch {
    return 'backlog 讀取失敗，請稍後再試'
  }
}

async function cmdLog(d: BotDeps): Promise<string> {
  try {
    const file = join(d.cfg.dataDir, 'events.jsonl')
    if (!existsSync(file)) return '尚無事件紀錄'
    const lines = readFileSync(file, 'utf8').split(/\r?\n/).filter(l => l.length > 0)
    const last = lines.slice(-10)
    if (last.length === 0) return '尚無事件紀錄'
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
    return ['adng 近期事件', ...summary].join('\n')
  } catch {
    return 'log 讀取失敗，請稍後再試'
  }
}

/** 統一入口：路由到查詢（本檔）與控制（actions.ts）handler。未知指令回人話，
 * 任何 handler 內部意外 throw 一律在此吞掉（鐵律：永不 throw、永不外洩 token）。 */
export async function handleCommand(name: string, arg: string, d: BotDeps): Promise<string> {
  try {
    switch (name) {
      case 'status': return truncate(await cmdStatus(d))
      case 'cost': return truncate(await cmdCost(d))
      case 'backlog': return truncate(await cmdBacklog(d))
      case 'log': return truncate(await cmdLog(d))
      case 'pause': return truncate(await doPause(d))
      case 'resume': return truncate(await doResume(d))
      case 'silence': return truncate(await doSilence(d, arg))
      case 'task': return truncate(await doTask(d, arg))
      case 'ask': return truncate(await doAsk(d, arg))
      default: return '未知指令'
    }
  } catch {
    return '指令執行失敗，請稍後再試'
  }
}
