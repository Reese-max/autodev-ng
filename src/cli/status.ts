import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { BacklogStore } from '../backlog.js'
import { isEnoent, withAssembled } from './assemble.js'
import { readExecutions } from '../engines/execution-observation.js'
import { ControlStore } from '../engines/steering.js'

export interface HeartbeatSnapshot {
  ts: string
  state: string
  currentTask?: string
  todayCostUsd: number
}

export interface BacklogCounts { open: number; blocked: number; superseded: number; done: number }

export interface StatusInput {
  heartbeat: HeartbeatSnapshot | null
  dailySoftUsd: number
  dailyHardUsd: number
  backlog: BacklogCounts
  backlogError?: string
  dlqCount: number
  lastDigestDay?: string
  /** Issue #11：active 執行的 taskId/executionId 與待處理控制信封數；無資料時不佔行。 */
  activeExecutions?: { taskId: string; executionId: string }[]
  pendingControls?: number
}

function formatCostLimit(value: number): string {
  return value === 0 ? '無上限' : `$${value.toFixed(2)}`
}

export function formatStatus(input: StatusInput): string {
  if (!input.heartbeat) return 'daemon 未跑過（heartbeat.json 不存在）'

  const hb = input.heartbeat
  const taskLine = hb.currentTask ? `｜currentTask=${hb.currentTask}` : ''
  const backlogLine = input.backlogError
    ? `backlog：${input.backlogError}`
    : `backlog：open=${input.backlog.open}｜blocked=${input.backlog.blocked}｜superseded=${input.backlog.superseded}｜done=${input.backlog.done}`
  return [
    'adng status',
    `heartbeat：${hb.ts}｜state=${hb.state}${taskLine}`,
    `今日成本：$${hb.todayCostUsd.toFixed(4)}（軟頂 ${formatCostLimit(input.dailySoftUsd)} / 硬頂 ${formatCostLimit(input.dailyHardUsd)}）`,
    backlogLine,
    `DLQ 積壓：${input.dlqCount} 筆`,
    `最後 digest 日期：${input.lastDigestDay ?? '尚未發送過'}`,
    // Issue #11：列出 active taskId/executionId 讓 operator 知道 /steer、/enqueue 要指哪個目標。
    ...(input.activeExecutions?.length
      ? [`執行中：${input.activeExecutions.slice(0, 5).map(e => `${e.taskId}/${e.executionId.slice(0, 8)}`).join('、')}${input.activeExecutions.length > 5 ? ` 等 ${input.activeExecutions.length} 項` : ''}`]
      : []),
    ...(input.pendingControls ? [`控制信封：${input.pendingControls} 筆待處理（adng execution controls 查看）`] : []),
  ].join('\n')
}

function readHeartbeat(dataDir: string): HeartbeatSnapshot | null {
  const file = join(dataDir, 'heartbeat.json')
  if (!existsSync(file)) return null
  try {
    const raw: unknown = JSON.parse(readFileSync(file, 'utf8'))
    if (typeof raw !== 'object' || raw === null) return null
    const r = raw as Record<string, unknown>
    if (typeof r.ts !== 'string' || typeof r.state !== 'string' || typeof r.todayCostUsd !== 'number') return null
    return {
      ts: r.ts,
      state: r.state,
      currentTask: typeof r.currentTask === 'string' ? r.currentTask : undefined,
      todayCostUsd: r.todayCostUsd,
    }
  } catch {
    return null
  }
}

function countDlqLines(dataDir: string): number {
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

function readLastDigestDay(dataDir: string): string | undefined {
  const file = join(dataDir, 'digest-stamp.json')
  if (!existsSync(file)) return undefined
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'))
    if (typeof parsed !== 'object' || parsed === null) return undefined
    const value = (parsed as Record<string, unknown>).lastSentDay
    return typeof value === 'string' ? value : undefined
  } catch {
    return undefined
  }
}

function backlogCounts(store: BacklogStore): BacklogCounts {
  const tasks = store.read()
  return {
    open: tasks.filter(task => task.status === 'open').length,
    blocked: tasks.filter(task => task.status === 'blocked').length,
    superseded: tasks.filter(task => task.status === 'superseded').length,
    done: tasks.filter(task => task.status === 'done').length,
  }
}

const EMPTY_BACKLOG_COUNTS: BacklogCounts = { open: 0, blocked: 0, superseded: 0, done: 0 }

function safeBacklogCounts(store: BacklogStore, backlogFile: string): { counts: BacklogCounts; error?: string } {
  try {
    return { counts: backlogCounts(store) }
  } catch (err) {
    if (isEnoent(err)) return { counts: EMPTY_BACKLOG_COUNTS, error: `backlog 檔不存在: ${backlogFile}` }
    throw err
  }
}

export async function cmdStatus(cfgPath: string): Promise<void> {
  await withAssembled(cfgPath, async ({ deps }) => {
    const heartbeat = readHeartbeat(deps.cfg.dataDir)
    if (!heartbeat) {
      console.log('daemon 未跑過')
      return
    }
    const { counts, error: backlogError } = safeBacklogCounts(deps.store, deps.cfg.backlogFile)
    // Issue #11：觀測面（executions/控制信封）故障不反殺 status 主輸出。
    let activeExecutions: StatusInput['activeExecutions'], pendingControls = 0
    try {
      activeExecutions = readExecutions(deps.cfg.dataDir).records
        .filter(r => r.phase !== 'terminal').map(r => ({ taskId: r.taskId, executionId: r.executionId }))
      pendingControls = new ControlStore(deps.cfg.dataDir).list().pending.length
    } catch { activeExecutions = undefined }
    console.log(formatStatus({
      heartbeat,
      dailySoftUsd: deps.cfg.dailySoftUsd,
      dailyHardUsd: deps.cfg.dailyHardUsd,
      backlog: counts,
      backlogError,
      dlqCount: countDlqLines(deps.cfg.dataDir),
      lastDigestDay: readLastDigestDay(deps.cfg.dataDir),
      activeExecutions, pendingControls,
    }))
  })
}
