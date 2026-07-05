import { existsSync } from 'node:fs'
import type { BacklogStore } from './backlog.js'
import type { RunDb } from './db.js'
import type { EventLog } from './events.js'
import type { Config, Engine } from './types.js'

export interface Deps {
  cfg: Config
  store: BacklogStore
  db: RunDb
  engine: Engine
  events: EventLog
}

export type CycleResult =
  | 'stopped' | 'cost-hard-stop' | 'idle' | 'done'
  | 'failed' | 'blocked' | 'preflight-failed' | 'engine-error'

export async function runOnce({ cfg, store, db, engine, events }: Deps): Promise<CycleResult> {
  if (existsSync(cfg.stopFile)) {
    events.heartbeat({ state: 'stopped', todayCostUsd: todayCost(db) })
    return 'stopped'
  }

  const spent = todayCost(db)
  if (spent >= cfg.dailyHardUsd) {
    events.appendOnce('cost-hard-stop', { spent })
    events.heartbeat({ state: 'cost-stopped', todayCostUsd: spent })
    return 'cost-hard-stop'
  }
  if (spent >= cfg.dailySoftUsd) events.appendOnce('cost-soft-warn', { spent })

  const task = store.nextTask()
  if (!task) {
    events.appendOnce('idle', { note: 'backlog 空，等使用者補任務' })
    events.heartbeat({ state: 'idle', todayCostUsd: spent })
    return 'idle'
  }

  events.heartbeat({ state: 'running', currentTask: task.text, todayCostUsd: spent })

  const pf = await engine.preflight()
  if (!pf.ok) {
    events.append('preflight-failed', { engine: engine.id, detail: pf.detail })
    return 'preflight-failed'
  }

  let result: CycleResult
  try {
    const res = await engine.run({ task, projectPath: cfg.projectPath })
    db.record({ taskId: task.id, ok: res.ok, costUsd: res.costUsd, detail: res.failureReason ?? res.commitHash ?? '' })
    if (res.ok) {
      store.report(task.id, { kind: 'done', commitHash: res.commitHash ?? 'unknown' })
      events.append('task-done', { task: task.text, cost: res.costUsd, commit: res.commitHash })
      return 'done'
    }
    events.append('task-failed', { task: task.text, reason: res.failureReason })
    result = 'failed'
  } catch (err) {
    db.record({ taskId: task.id, ok: false, costUsd: 0, detail: String(err) })
    events.append('engine-error', { task: task.text, error: String(err) })
    result = 'engine-error'
  }

  if (db.failCount(task.id) >= cfg.maxAttempts) {
    store.report(task.id, { kind: 'blocked', reason: `連敗 ${cfg.maxAttempts} 次，人工介入` })
    events.append('task-blocked', { task: task.text })
    return 'blocked'
  }
  return result
}

function todayCost(db: RunDb): number {
  return db.costSince(new Date().toISOString().slice(0, 10))
}
