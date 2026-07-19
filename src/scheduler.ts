import { existsSync } from 'node:fs'
import type { BacklogStore } from './backlog.js'
import { localDay, type RunDb } from './db.js'
import { candidateEngines } from './engines/rotation.js'
import { quiet, type EventLog } from './events.js'
import { globalBilledToday } from './globalcost.js'
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
  /** M10.5：config 檔絕對路徑（assemble 填入）——globalBilledToday 掃兄弟專案用。測試可不設。 */
  cfgPath?: string
}

/** MEDIUM 1 修復：機器可讀的 blocked 原因碼。daemon.baseAlertMessage 依此挑對應人話文案
 * ——不是每種 blocked 都是「連敗」，含糊文案會誤導人工介入的方向。 */
export type BlockedReason =
  | 'max-attempts' | 'not-a-git-repo' | 'merge-conflict' | 'branch-switched'
  // M5 Task 1：任務 tag 不在本專案 engines 白名單（或引擎無法建立）。直接 blocked，
  // 系統不自作主張換引擎（鐵律 #1 精神；zen 不派 voice-actress 即靠白名單落地）。
  | 'engine-not-allowed'
  // Task 2：worktree 殘留鎖定失敗（cleanStaleWorktree 掛 code==='worktree-locked'），獨立於 not-a-git-repo，避免人工誤判方向。
  | 'worktree-locked'
  // 2026-07-16 事故：worktree add 後 checkout 未落地（assertWorktreeCheckout 掛 code==='worktree-invalid'）——
  // 空目錄派工會讓引擎遊走到別的 repo 繞過 verify 閘，必須在派工前擋下。
  | 'worktree-invalid'

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
    quiet(() => events.heartbeat({ state: 'stopped', todayCostUsd: todayCost(db, cfg) }))
    return 'stopped'
  }

  const spent = todayCost(db, cfg)
  if (spent >= cfg.dailyHardUsd) {
    quiet(() => events.appendOnce('cost-hard-stop', { spent }))
    quiet(() => events.heartbeat({ state: 'cost-stopped', todayCostUsd: spent }))
    return 'cost-hard-stop'
  }

  // M10.5：全域日頂（第二道防線）。查帳失敗＝0 放行（fail-open，spec §4——第一道防線仍在）。
  if (cfg.globalDailyHardUsd !== undefined && deps.cfgPath) {
    let g = 0
    try { g = globalBilledToday(deps.cfgPath, new Date().toISOString()) } catch { /* fail-open */ }
    if (g >= cfg.globalDailyHardUsd) {
      quiet(() => events.appendOnce('cost-hard-stop-global', { spent: g }))
      quiet(() => events.heartbeat({ state: 'cost-stopped', todayCostUsd: spent }))
      return 'cost-hard-stop'
    }
  }

  if (spent >= cfg.dailySoftUsd) quiet(() => events.appendOnce('cost-soft-warn', { spent }))

  const openTasks = store.read().filter(t => t.status === 'open')
  if (openTasks.length === 0) {
    quiet(() => events.appendOnce('idle', { note: 'backlog 空，等使用者補任務' }))
    quiet(() => events.heartbeat({ state: 'idle', todayCostUsd: spent }))
    return 'idle'
  }

  const dups = store.duplicateIds()
  if (dups.length > 0) quiet(() => events.appendOnce('duplicate-tasks', { ids: dups }))

  const picked = await pickReadyTask({ cfg, store, db, events, engines }, openTasks)
  if (typeof picked === 'string' || 'kind' in picked) {
    if (picked === 'preflight-failed') quiet(() => events.heartbeat({ state: 'idle', todayCostUsd: spent }))
    return picked
  }
  const { task, engine, engineTag, fixedCost } = picked

  quiet(() => events.heartbeat({ state: 'running', currentTask: task.text, todayCostUsd: spent }))

  // M4 Task 6（worktree 接線）：任務級隔離執行環境。非 git 專案（prepareWorktree 上拋）
  // → 直接 blocked+告警，不計入 maxAttempts 失敗計數（環境問題而非任務本身失敗——
  // fail-open 不炸 daemon，鐵律 #4）。
  let wt: WorktreeHandle
  try {
    wt = prepareWorktree(cfg.projectPath, cfg.worktreesDir, task.id)
  } catch (err) {
    quiet(() => events.append('worktree-prepare-failed', { task: task.text, error: String(err) }))
    const code = (err as { code?: string })?.code
    const reason: BlockedReason = code === 'worktree-locked' || code === 'worktree-invalid' ? code : 'not-a-git-repo'
    return blockTask({ store, events }, task, reason, `worktree 建立失敗：${String(err)}`)
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
    db.record({ taskId: task.id, ok: false, costUsd: fixedCost ?? 0, detail: String(err), engine: engineTag })
    engine.invalidatePreflight?.() // 引擎健康存疑，下輪真探針再驗
    quiet(() => events.append('engine-error', { task: task.text, error: String(err) }))
    quiet(() => events.append('worktree-kept', { taskId: task.id, branch: wt.branch, worktreePath: wt.cwd }))
    return resolveFailure({ cfg, store, db, events }, task, 'engine-error', String(err))
  }

  // 引擎結果記帳：db 壞了是基礎設施故障，不該靜默。失敗成本估計（M4 Task 3）：costUnknown===true
  // （timeout/exit≠0/輸出不可解析）改記 cfg.failureCostEstimateUsd，detail 帶 cost-estimated 標記；
  // 引擎解析出真值（含 is_error、真值恰好 0）照記真值。M5 Task 1：fixedCost 有設（非真值引擎）
  // → 成功失敗一律入帳固定估計值，估計語意只留給真值引擎（claude）。
  const costEstimated = fixedCost === undefined && !res.ok && res.costUnknown === true
  const recordedCostUsd = fixedCost ?? (costEstimated ? cfg.failureCostEstimateUsd : res.costUsd)
  const baseDetail = res.failureReason ?? res.commitHash ?? ''
  const recordedDetail = costEstimated ? `${baseDetail} [cost-estimated]` : baseDetail
  db.record({ taskId: task.id, ok: res.ok, costUsd: recordedCostUsd, detail: recordedDetail, engine: engineTag })
  if (!res.ok) engine.invalidatePreflight?.() // timeout/exit≠0/no-commit：引擎健康存疑，下輪重探（verify 拒收不算）

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
      db.record({ taskId: task.id, ok: false, costUsd: 0, detail: vc.reason ?? 'verify rejected', engine: engineTag })
      quiet(() => events.append('task-verify-failed', { task: task.text, reason: vc.reason }))
      // engine 失敗/verify 拒：rollback 已在 worktree 內安全跑過，保留現場供 debug（不清理）。
      quiet(() => events.append('worktree-kept', { taskId: task.id, branch: wt.branch, worktreePath: wt.cwd }))
      return resolveFailure({ cfg, store, db, events }, task, 'failed', `verify 拒收：${vc.reason ?? '未附原因'}`)
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
  return resolveFailure({ cfg, store, db, events }, task, 'failed', res.failureReason ?? '未知')
}

/** 環境級 blocked（worktree 建立失敗於非 git 專案 / mergeBack ff 失敗）：不計入 maxAttempts
 * （不是任務本身的失敗），直接標記 blocked 讓人工介入。store.report 拋錯只吞錯記事件
 * （backlog 沒標到 blocked 是已知殘留風險，下一輪會重新撿到）。 */
function blockTask(
  { store, events }: Pick<Deps, 'store' | 'events'>,
  task: Task,
  reason: BlockedReason,
  humanReason: string
): CycleResult {
  try {
    store.report(task.id, { kind: 'blocked', reason: humanReason })
  } catch (err) {
    quiet(() => events.append('report-failed', { task: task.text, kind: 'blocked', error: String(err), willRepick: true }))
  }
  quiet(() => events.append('task-blocked', { task: task.text, reason }))
  return { kind: 'blocked', taskId: task.id, taskText: task.text, reason }
}

/** 餓死修正（07-17）＋輪替路由（07-18，engines/rotation.ts）：逐候選任務展開 candidateEngines，
 * resolve/preflight 壞的逐一後退（PreflightCache 保證同引擎只真打一次探針），全部候選壞→
 * 'preflight-failed'；白名單外或單一候選 resolve 拋錯→blocked（訊息只含變數名不含值）。 */
async function pickReadyTask(
  { cfg, store, db, events, engines }: Pick<Deps, 'cfg' | 'store' | 'db' | 'events' | 'engines'>,
  openTasks: Task[]
): Promise<{ task: Task; engine: Engine; engineTag: string; fixedCost: number | undefined } | CycleResult> {
  for (const cand of openTasks) {
    const tags = candidateEngines(cfg.engineRotation, cfg.defaultEngine, cand, db.failCount(cand.id))
    for (const engineTag of tags) {
      const engineCfg = cfg.engines[engineTag]
      if (!engineCfg) return blockTask({ store, events }, cand, 'engine-not-allowed', `engine-not-allowed：tag [engine:${engineTag}] 不在本專案 engines 白名單，需人工修 tag 或補 config`)
      let engine: Engine
      try {
        engine = engines.resolve(engineTag)
      } catch (err) {
        if (tags.length === 1) return blockTask({ store, events }, cand, 'engine-not-allowed', `engine-not-allowed：引擎 ${engineTag} 無法建立（${String(err)}）`)
        quiet(() => events.appendOnce('engine-resolve-failed', { engine: engineTag, detail: String(err) })) // 輪替候選壞一個不堵任務，後退下一檔
        continue
      }
      const pf = await engine.preflight()
      if (!pf.ok) {
        quiet(() => events.appendOnce('preflight-failed', { engine: engine.id, detail: pf.detail })) // appendOnce：持續故障不灌 log
        continue
      }
      // costPerRunUsd 有設＝固定估計引擎；未設＝真值引擎（M4 Task 3 語意保留）
      return { task: cand, engine, engineTag, fixedCost: engineCfg.costPerRunUsd }
    }
  }
  return 'preflight-failed'
}

/** 失敗共通路：達 maxAttempts → blocked，lastFailure 寫進註記（人工分流不用翻 events.jsonl
 * 就能分辨 timeout/no-commit/verify 拒收）；report 拋錯只吞錯記事件不改語意。 */
function resolveFailure(
  { cfg, store, db, events }: Pick<Deps, 'cfg' | 'store' | 'db' | 'events'>,
  task: Task,
  base: 'failed' | 'engine-error',
  lastFailure: string
): CycleResult {
  if (db.failCount(task.id) < cfg.maxAttempts) return base
  const hint = lastFailure.replace(/\s+/g, ' ').trim().slice(0, 80) || '未知'
  return blockTask({ store, events }, task, 'max-attempts', `連敗 ${cfg.maxAttempts} 次，人工介入（最後失敗：${hint}）`)
}

/** M9.9：cfg.engines 中標了 subscription:true 的引擎 tag 清單（訂閱制，邊際成本≈0，
 * 估值照記帳但不踩日頂）。digest/handlers 各自需要同一份清單，故導出供 import。 */
export function subscriptionTags(cfg: Config): string[] {
  return Object.entries(cfg.engines ?? {}).filter(([, e]) => e.subscription).map(([t]) => t)
}

/** M4 Task 3：本地日成本（取代舊版 UTC 字串切割）。offsetHours=0 時與舊行為完全一致
 * （相容性錨點）；生產路徑一律帶入 cfg.timezoneOffsetHours。
 * M9.9：日頂閘改踩真金帳（billedCostForLocalDay 排除訂閱引擎）——訂閱引擎的名義估值
 * 不該誤觸日頂，真花錢的引擎才觸。 */
function todayCost(db: RunDb, cfg: Config): number {
  const offsetHours = cfg.timezoneOffsetHours
  return db.billedCostForLocalDay(localDay(new Date().toISOString(), offsetHours), offsetHours, subscriptionTags(cfg))
}

/**
 * Fix 4（首跑實證）：runOnce 對 stopped/cost-stop/idle/preflight-failed 自帶 heartbeat 收尾，
 * 但任務真的跑起來（running）之後的 done/failed/engine-error/blocked 都不再寫——daemon 靠
 * 下一輪覆寫無礙；run-once 是單輪進程，不收尾 heartbeat 會永遠停在 running 假活。這裡只對
 * 「跑過任務」的結果補寫 idle（觀測面故障吞錯，不反殺 CLI）。從 cmdRunOnce 抽出導出
 * （同 runNotifyTest 模式）：mock deps 即可回歸測試，不必真跑 CLI 進程。
 */
export function finalizeRunOnceHeartbeat(deps: Deps, result: CycleResult, now: Date = new Date()): void {
  if (!(typeof result === 'object' || result === 'done' || result === 'failed' || result === 'engine-error')) return
  try {
    const day = localDay(now.toISOString(), deps.cfg.timezoneOffsetHours)
    // M9.9：heartbeat todayCostUsd 語意＝billed（真金帳，與 scheduler todayCost 的踩頂數字一致），
    // 排除訂閱引擎的名義估值——顯示與日頂閘看同一個數字，不因寫入路徑不同而語意漂移。
    deps.events.heartbeat({ state: 'idle', todayCostUsd: deps.db.billedCostForLocalDay(day, deps.cfg.timezoneOffsetHours, subscriptionTags(deps.cfg)) })
  } catch { /* 觀測面故障不可反殺 CLI（鐵律 #4） */ }
}
