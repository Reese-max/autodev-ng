import { existsSync } from 'node:fs'
import type { BacklogStore } from './backlog.js'
import { localDay, type RunDb } from './db.js'
import type { EventLog } from './events.js'
import type { Config, Engine, Job, RunResult, Task } from './types.js'
import type { VerifierCheck } from './verifier.js'

export interface Deps {
  cfg: Config
  store: BacklogStore
  db: RunDb
  engine: Engine
  events: EventLog
  verifier?: { check(job: Job, res: RunResult): Promise<VerifierCheck> }
}

export type CycleResult =
  | 'stopped' | 'cost-hard-stop' | 'idle' | 'done'
  | 'failed' | 'preflight-failed' | 'engine-error'
  // blocked 攜帶任務文字回呼叫端：daemon 的 alertMessageFor 不再讀 heartbeat.currentTask
  // （解隱性耦合——heartbeat 是「目前跑到哪」的觀測面，blocked 的任務文字該由產生
  // blocked 的呼叫鏈直接帶回，不該繞去讀一個為了別的目的而存在的檔案）。
  // taskId 供 daemon 冷卻閘 key 使用（修正：舊版 key 用任務文字前 40 字，兩個長任務
  // 前 40 字相同會撞出同一個 key、互相吞告警；taskId 全域唯一不會有這問題）。
  | { kind: 'blocked'; taskId: string; taskText: string }

/** 觀測（events）故障絕不可反殺主迴圈——統一吞錯（鐵律 #4 精神）。 */
function quiet(fn: () => void): void {
  try {
    fn()
  } catch {
    // events 模組自身壞掉不該中斷閉環
  }
}

export async function runOnce({ cfg, store, db, engine, events, verifier }: Deps): Promise<CycleResult> {
  if (existsSync(cfg.stopFile)) {
    quiet(() => events.heartbeat({ state: 'stopped', todayCostUsd: todayCost(db, cfg.timezoneOffsetHours) }))
    return 'stopped'
  }

  const spent = todayCost(db, cfg.timezoneOffsetHours)
  if (spent >= cfg.dailyHardUsd) {
    quiet(() => events.appendOnce('cost-hard-stop', { spent }))
    quiet(() => events.heartbeat({ state: 'cost-stopped', todayCostUsd: spent }))
    return 'cost-hard-stop'
  }
  if (spent >= cfg.dailySoftUsd) quiet(() => events.appendOnce('cost-soft-warn', { spent }))

  const task = store.nextTask()
  if (!task) {
    quiet(() => events.appendOnce('idle', { note: 'backlog 空，等使用者補任務' }))
    quiet(() => events.heartbeat({ state: 'idle', todayCostUsd: spent }))
    return 'idle'
  }

  const dups = store.duplicateIds()
  if (dups.length > 0) quiet(() => events.appendOnce('duplicate-tasks', { ids: dups }))

  quiet(() => events.heartbeat({ state: 'running', currentTask: task.text, todayCostUsd: spent }))

  const pf = await engine.preflight()
  if (!pf.ok) {
    // appendOnce：preflight 持續故障（如引擎掛掉）不可無限灌 log
    quiet(() => events.appendOnce('preflight-failed', { engine: engine.id, detail: pf.detail }))
    quiet(() => events.heartbeat({ state: 'idle', todayCostUsd: spent }))
    return 'preflight-failed'
  }

  // try 只包 engine.run 本身：db.record／store.report／events 的下游 I/O 故障
  // 不該被誤判成「引擎錯誤」而污染 failCount。
  let res: RunResult
  try {
    res = await engine.run({ task, projectPath: cfg.projectPath })
  } catch (err) {
    db.record({ taskId: task.id, ok: false, costUsd: 0, detail: String(err) })
    quiet(() => events.append('engine-error', { task: task.text, error: String(err) }))
    return resolveFailure({ cfg, store, db, events }, task, 'engine-error')
  }

  // 引擎結果記帳：db 壞了是基礎設施故障，不該靜默，讓它浮出。
  // 失敗成本估計（M4 Task 3，真花錢前必修）：res.costUnknown===true 表示引擎沒能力回報真值
  // （timeout/exit≠0/輸出不可解析——已於 claude-cli.ts 標記），改記 cfg.failureCostEstimateUsd，
  // detail 帶 cost-estimated 標記供人工／digest 辨識這是估計值非真值。engine 正常解析出真值
  // （包含 is_error 但仍解出 JSON、真值恰好 0）時 costUnknown 不設，照記真值不套估計。
  const costEstimated = !res.ok && res.costUnknown === true
  const recordedCostUsd = costEstimated ? cfg.failureCostEstimateUsd : res.costUsd
  const baseDetail = res.failureReason ?? res.commitHash ?? ''
  const recordedDetail = costEstimated ? `${baseDetail} [cost-estimated]` : baseDetail
  db.record({ taskId: task.id, ok: res.ok, costUsd: recordedCostUsd, detail: recordedDetail })

  if (res.ok && verifier) {
    // verifier 本身故障（非 verify-fail / judge-mismatch 的明確拒絕）一律 pass-with-alert（鐵律 #4）：
    // infra 層的驗證閘壞掉不該反殺已經成功的任務。
    let vc: VerifierCheck
    try {
      vc = await verifier.check({ task, projectPath: cfg.projectPath }, res)
    } catch (err) {
      vc = { pass: true, alerts: [`verifier-exception: ${String(err)}`] }
    }
    for (const a of vc.alerts) quiet(() => events.append('verify-alert', { task: task.text, detail: a }))
    if (!vc.pass) {
      // 引擎那筆已記 ok:true+真實 cost（成本不可造假）；這裡多記一筆 ok:false 讓失敗計數靠這筆走。
      db.record({ taskId: task.id, ok: false, costUsd: 0, detail: vc.reason ?? 'verify rejected' })
      quiet(() => events.append('task-verify-failed', { task: task.text, reason: vc.reason }))
      return resolveFailure({ cfg, store, db, events }, task, 'failed')
    }
  }

  if (res.ok) {
    try {
      store.report(task.id, { kind: 'done', commitHash: res.commitHash ?? 'unknown' })
    } catch (err) {
      // backlog 沒打勾：已知殘留風險——下一輪會重新撿到這個「已完成」任務。
      quiet(() => events.append('report-failed', {
        task: task.text, kind: 'done', error: String(err), willRepick: true
      }))
    }
    quiet(() => events.append('task-done', { task: task.text, cost: res.costUsd, commit: res.commitHash }))
    return 'done'
  }

  quiet(() => events.append('task-failed', { task: task.text, reason: res.failureReason }))
  return resolveFailure({ cfg, store, db, events }, task, 'failed')
}

/**
 * 失敗共通路（engine.run 回 ok:false 或 engine.run 拋例外都會走到這）。
 * 判斷是否達 maxAttempts → blocked；report 拋錯也只吞錯記事件，不影響本輪回傳的語意結果。
 */
function resolveFailure(
  { cfg, store, db, events }: Pick<Deps, 'cfg' | 'store' | 'db' | 'events'>,
  task: Task,
  base: 'failed' | 'engine-error'
): CycleResult {
  if (db.failCount(task.id) < cfg.maxAttempts) return base

  try {
    store.report(task.id, { kind: 'blocked', reason: `連敗 ${cfg.maxAttempts} 次，人工介入` })
  } catch (err) {
    // backlog 沒打上 blocked 標記：已知殘留風險——下一輪會重新撿到這個「該擋下」的任務。
    quiet(() => events.append('report-failed', {
      task: task.text, kind: 'blocked', error: String(err), willRepick: true
    }))
  }
  quiet(() => events.append('task-blocked', { task: task.text }))
  return { kind: 'blocked', taskId: task.id, taskText: task.text }
}

/** M4 Task 3：本地日成本（取代舊版 UTC 字串切割）。offsetHours=0 時與舊行為完全一致
 * （相容性錨點）；生產路徑一律帶入 cfg.timezoneOffsetHours。 */
function todayCost(db: RunDb, offsetHours: number): number {
  return db.costForLocalDay(localDay(new Date().toISOString(), offsetHours), offsetHours)
}
