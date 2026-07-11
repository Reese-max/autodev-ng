import { existsSync } from 'node:fs'
import type { BacklogStore } from './backlog.js'
import { localDay, type RunDb } from './db.js'
import { quiet, type EventLog } from './events.js'
import type { Config, Engine, EngineResolver, Job, RunResult, Task } from './types.js'
import type { VerifierCheck } from './verifier.js'
import { cleanupWorktree, mergeBack, prepareWorktree, WorktreeCleanupPartialError, type WorktreeHandle } from './worktree.js'

/** M7：教訓注入/反思 port（Task 2 makeLessonsPort 的輸出型別）。inject() 供 scheduler
 * 附進 job.directive；reflect() 留給 Task 4/5 接線（本 task 只注入 inject）。 */
export interface LessonsPort {
  inject(): string
  reflect(result: CycleResult): Promise<void>
}

export interface Deps {
  cfg: Config
  store: BacklogStore
  db: RunDb
  /** M5 Task 1：per-config 單例改為 per-task 解析（registry 按需建、可 cache，實作在
   * assemble 層）。任務 engineTag（或 cfg.defaultEngine）先過 cfg.engines 白名單再 resolve。 */
  engines: EngineResolver
  events: EventLog
  verifier?: { check(job: Job, res: RunResult): Promise<VerifierCheck> }
  /** M7：未接線時 undefined，行為與現狀完全一致（fail-open 硬線）。 */
  lessons?: LessonsPort
}

/** MEDIUM 1 修復：機器可讀的 blocked 原因碼。daemon.baseAlertMessage 依此挑對應人話文案
 * ——不是每種 blocked 都是「連敗」，含糊文案會誤導人工介入的方向。 */
export type BlockedReason =
  | 'max-attempts' | 'not-a-git-repo' | 'merge-conflict' | 'branch-switched'
  // M5 Task 1：任務 tag 不在本專案 engines 白名單（或引擎無法建立）。直接 blocked，
  // 系統不自作主張換引擎（鐵律 #1 精神；zen 不派 voice-actress 即靠白名單落地）。
  | 'engine-not-allowed'

export type CycleResult =
  | 'stopped' | 'cost-hard-stop' | 'idle' | 'done'
  | 'failed' | 'preflight-failed' | 'engine-error'
  // blocked 攜帶任務文字回呼叫端：daemon 的 alertMessageFor 不再讀 heartbeat.currentTask
  // （解隱性耦合——heartbeat 是「目前跑到哪」的觀測面，blocked 的任務文字該由產生
  // blocked 的呼叫鏈直接帶回，不該繞去讀一個為了別的目的而存在的檔案）。
  // taskId 供 daemon 冷卻閘 key 使用（修正：舊版 key 用任務文字前 40 字，兩個長任務
  // 前 40 字相同會撞出同一個 key、互相吞告警；taskId 全域唯一不會有這問題）。
  | { kind: 'blocked'; taskId: string; taskText: string; reason: BlockedReason }

export async function runOnce(deps: Deps): Promise<CycleResult> {
  const { cfg, store, db, engines, events, verifier } = deps
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

  // M5 Task 1：per-task 引擎解析。tag 不在 cfg.engines 白名單 → 直接 blocked
  // （engine-not-allowed），不計 maxAttempts（是路由設定問題，不是任務本身失敗）。
  // resolve 拋錯（adapter 未實作／{env:VAR} 引用缺失）同歸此路——錯誤訊息只含變數名
  // 不含值（API key 永不落 log/backlog）。
  const engineTag = task.engineTag ?? cfg.defaultEngine
  const engineCfg = cfg.engines[engineTag]
  if (!engineCfg) {
    return blockTask(
      { store, events }, task, 'engine-not-allowed',
      `engine-not-allowed：tag [engine:${engineTag}] 不在本專案 engines 白名單，需人工修 tag 或補 config`
    )
  }
  let engine: Engine
  try {
    engine = engines.resolve(engineTag)
  } catch (err) {
    return blockTask(
      { store, events }, task, 'engine-not-allowed',
      `engine-not-allowed：引擎 ${engineTag} 無法建立（${String(err)}）`
    )
  }
  // 非 claude 真值引擎（costPerRunUsd 有設）：成功失敗一律入帳固定估計值；
  // 未設＝真值引擎，保留真值解析與 costUnknown→failureCostEstimateUsd 語意（M4 Task 3）。
  const fixedCost = engineCfg.costPerRunUsd

  const pf = await engine.preflight()
  if (!pf.ok) {
    // appendOnce：preflight 持續故障（如引擎掛掉）不可無限灌 log
    quiet(() => events.appendOnce('preflight-failed', { engine: engine.id, detail: pf.detail }))
    quiet(() => events.heartbeat({ state: 'idle', todayCostUsd: spent }))
    return 'preflight-failed'
  }

  // M4 Task 6（worktree 接線）：任務級隔離執行環境。非 git 專案（prepareWorktree 上拋）
  // → 直接 blocked+告警，不計入 maxAttempts 失敗計數（環境問題而非任務本身失敗——
  // fail-open 不炸 daemon，鐵律 #4）。
  let wt: WorktreeHandle
  try {
    wt = prepareWorktree(cfg.projectPath, cfg.worktreesDir, task.id)
  } catch (err) {
    quiet(() => events.append('worktree-prepare-failed', { task: task.text, error: String(err) }))
    return blockTask({ store, events }, task, 'not-a-git-repo', `worktree 建立失敗：${String(err)}`)
  }

  // extraDirective 附加到 task.text 尾組成 job.directive（未設定時維持 undefined）——
  // claude-cli engine 的 prompt 任務行以 job.directive ?? task.text 消費（Fix 1 已接線）。
  let directive = cfg.extraDirective ? `${task.text}\n\n${cfg.extraDirective}` : undefined
  // M7：教訓注入（fail-open：inject 故障視同無教訓，絕不擋派工）
  let lessonsText = ''
  try { lessonsText = deps.lessons?.inject() ?? '' } catch { /* 教訓面故障不擋派工 */ }
  if (lessonsText) directive = `${directive ?? task.text}\n\n${lessonsText}`

  // try 只包 engine.run 本身：db.record／store.report／events 的下游 I/O 故障
  // 不該被誤判成「引擎錯誤」而污染 failCount。
  let res: RunResult
  try {
    res = await engine.run({ task, projectPath: wt.cwd, directive })
  } catch (err) {
    // M5 Task 1：固定成本引擎連拋例外都入帳 costPerRunUsd（進程極可能已實際起跑燒錢）。
    db.record({ taskId: task.id, ok: false, costUsd: fixedCost ?? 0, detail: String(err) })
    quiet(() => events.append('engine-error', { task: task.text, error: String(err) }))
    quiet(() => events.append('worktree-kept', { taskId: task.id, branch: wt.branch, worktreePath: wt.cwd }))
    return resolveFailure({ cfg, store, db, events }, task, 'engine-error')
  }

  // 引擎結果記帳：db 壞了是基礎設施故障，不該靜默，讓它浮出。
  // 失敗成本估計（M4 Task 3，真花錢前必修）：res.costUnknown===true 表示引擎沒能力回報真值
  // （timeout/exit≠0/輸出不可解析——已於 claude-cli.ts 標記），改記 cfg.failureCostEstimateUsd，
  // detail 帶 cost-estimated 標記供人工／digest 辨識這是估計值非真值。engine 正常解析出真值
  // （包含 is_error 但仍解出 JSON、真值恰好 0）時 costUnknown 不設，照記真值不套估計。
  // M5 Task 1：fixedCost 有設（非 claude 真值引擎）→ 成功失敗一律入帳固定估計值，
  // costUnknown/failureCostEstimateUsd 的估計語意只留給真值引擎（claude）。
  const costEstimated = fixedCost === undefined && !res.ok && res.costUnknown === true
  const recordedCostUsd = fixedCost ?? (costEstimated ? cfg.failureCostEstimateUsd : res.costUsd)
  const baseDetail = res.failureReason ?? res.commitHash ?? ''
  const recordedDetail = costEstimated ? `${baseDetail} [cost-estimated]` : baseDetail
  db.record({ taskId: task.id, ok: res.ok, costUsd: recordedCostUsd, detail: recordedDetail })

  if (res.ok && verifier) {
    // verifier 本身故障（非 verify-fail / judge-mismatch 的明確拒絕）一律 pass-with-alert（鐵律 #4）：
    // infra 層的驗證閘壞掉不該反殺已經成功的任務。
    let vc: VerifierCheck
    try {
      vc = await verifier.check({ task, projectPath: wt.cwd }, res)
    } catch (err) {
      vc = { pass: true, alerts: [`verifier-exception: ${String(err)}`] }
    }
    for (const a of vc.alerts) quiet(() => events.append('verify-alert', { task: task.text, detail: a }))
    if (!vc.pass) {
      // 引擎那筆已記 ok:true+真實 cost（成本不可造假）；這裡多記一筆 ok:false 讓失敗計數靠這筆走。
      db.record({ taskId: task.id, ok: false, costUsd: 0, detail: vc.reason ?? 'verify rejected' })
      quiet(() => events.append('task-verify-failed', { task: task.text, reason: vc.reason }))
      // engine 失敗/verify 拒：rollback 已在 worktree 內安全跑過，保留現場供 debug（不清理）。
      quiet(() => events.append('worktree-kept', { taskId: task.id, branch: wt.branch, worktreePath: wt.cwd }))
      return resolveFailure({ cfg, store, db, events }, task, 'failed')
    }
  }

  if (res.ok) {
    // engine 成功 + verify 通過（或未設 verifier）→ 嘗試把任務分支 ff-only 合回主 repo。
    const merge = mergeBack(cfg.projectPath, wt.branch, wt.baseBranch, wt.baseHead)
    if (!merge.merged) {
      if (merge.reason === 'branch-switched') {
        // HIGH 修復：主 repo 已不在 prepareWorktree 當時記下的分支（切走或 detached）——
        // 不硬 merge，成果不會悄悄落到使用者當下所在分支；worktree/分支保留給人工介入。
        quiet(() => events.append('branch-switched', { task: task.text, branch: wt.branch }))
        return blockTask(
          { store, events }, task, 'branch-switched',
          'branch-switched：主 repo 分支已切換或處於 detached HEAD，成果未合回，需人工介入合併'
        )
      }
      // 主分支同時被使用者/第三方動過，ff 不可行——不硬 merge，worktree/分支保留給人工，
      // 直接 blocked（不計入 maxAttempts：這不是任務本身失敗，是環境衝突）。
      quiet(() => events.append('merge-conflict', { task: task.text, branch: wt.branch }))
      return blockTask({ store, events }, task, 'merge-conflict', 'merge-conflict：主分支已前進，需人工介入合併')
    }

    try {
      store.report(task.id, { kind: 'done', commitHash: merge.commitHash ?? res.commitHash ?? 'unknown' })
    } catch (err) {
      // backlog 沒打勾：已知殘留風險——下一輪會重新撿到這個「已完成」任務。
      quiet(() => events.append('report-failed', {
        task: task.text, kind: 'done', error: String(err), willRepick: true
      }))
    }
    quiet(() => events.append('task-done', { task: task.text, cost: recordedCostUsd, commit: merge.commitHash }))

    try {
      cleanupWorktree(cfg.projectPath, wt.cwd, wt.branch)
    } catch (err) {
      if (err instanceof WorktreeCleanupPartialError) {
        // M5 Task 2：rmSync 已成功、僅 git 記錄（prune/branch -d）清理失敗——現場已不在，
        // 記 partial 而非 kept（kept 會誤導人工去找一個不存在的目錄）。
        quiet(() => events.append('worktree-cleanup-partial', {
          taskId: task.id, branch: wt.branch, error: String(err)
        }))
      } else {
        // rmSync 前失敗（marker 驗證不過/dirty/檔案鎖住等）：現場還在，保留供 debug，
        // 不強行二次清除掩蓋問題。
        quiet(() => events.append('worktree-kept', {
          taskId: task.id, branch: wt.branch, worktreePath: wt.cwd, error: String(err)
        }))
      }
    }
    return 'done'
  }

  // Fix 2：失敗時 engine 最後輸出是唯一的（可能已花真錢的）診斷線索，截尾 600 字持久化
  // 進 events（保尾不保頭：死因在最後；events.jsonl 有輪替，欄位大小可控即可）。
  quiet(() => events.append('task-failed', {
    task: task.text, reason: res.failureReason, outputTail: res.output.slice(-600)
  }))
  // engine 失敗（res.ok===false，非例外）：既有流程走 resolveFailure，worktree 保留現場。
  quiet(() => events.append('worktree-kept', { taskId: task.id, branch: wt.branch, worktreePath: wt.cwd }))
  return resolveFailure({ cfg, store, db, events }, task, 'failed')
}

/**
 * 環境級 blocked（worktree 建立失敗於非 git 專案 / mergeBack ff 失敗）：不計入 maxAttempts
 * （不是任務本身的失敗），直接標記 blocked 讓人工介入。store.report 拋錯只吞錯記事件
 * （同 resolveFailure 慣例——backlog 沒標到 blocked 是已知殘留風險，下一輪會重新撿到）。
 */
function blockTask(
  { store, events }: Pick<Deps, 'store' | 'events'>,
  task: Task,
  reason: BlockedReason,
  humanReason: string
): CycleResult {
  try {
    store.report(task.id, { kind: 'blocked', reason: humanReason })
  } catch (err) {
    quiet(() => events.append('report-failed', {
      task: task.text, kind: 'blocked', error: String(err), willRepick: true
    }))
  }
  quiet(() => events.append('task-blocked', { task: task.text, reason }))
  return { kind: 'blocked', taskId: task.id, taskText: task.text, reason }
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
  return blockTask({ store, events }, task, 'max-attempts', `連敗 ${cfg.maxAttempts} 次，人工介入`)
}

/** M4 Task 3：本地日成本（取代舊版 UTC 字串切割）。offsetHours=0 時與舊行為完全一致
 * （相容性錨點）；生產路徑一律帶入 cfg.timezoneOffsetHours。 */
function todayCost(db: RunDb, offsetHours: number): number {
  return db.costForLocalDay(localDay(new Date().toISOString(), offsetHours), offsetHours)
}
