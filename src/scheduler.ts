import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import type { BacklogStore } from './backlog.js'
import { parseGoal } from './autopilot/goal.js'
import { localDay, type RunDb } from './db.js'
import { loadIsolatedTagsForPick } from './engines/apply-stats-isolation.js'
import { loadDailyAttemptCapContext } from './engines/daily-attempt-cap-gate.js'
import { loadEngineStatsForWeighting } from './engines/adaptive-rotation.js'
import { firstMissingArtifact } from './engines/artifact-contract-git.js'
import { noteSerialConcurrency } from './engines/concurrency-notice.js'
import { writeHeartbeat } from './engines/heartbeat-write.js'
import { cleanupRetryWorktree, isExternalEngineTermination, isInfrastructureRetryReason, retriedBlockedReason, worktreeFailureReason, type InfrastructureRetryReason, type InfraRetryState } from './engines/infra-retry.js'
import { enqueueMerge } from './engines/merge-queue.js'
import { nudgeNoCommit } from './engines/no-commit-nudge.js'
import type { TaskTerminalNotice } from './engines/notify.js'
import { pickCandidateTags } from './engines/pick-candidates.js'
import { singleFlightPickRouting } from './engines/pick-ready-single-flight.js'
import { quiet, type EventLog } from './events.js'
import { globalBilledToday } from './globalcost.js'
import type { Config, Engine, EngineResolver, Job, RunResult, Task } from './types.js'
import type { VerifierCheck } from './verifier.js'
import { cleanupWorktree, mergeBack, prepareWorktree, WorktreeCleanupPartialError, type MergeBackResult, type WorktreeHandle } from './worktree.js'
import { runVerify } from './verify.js'

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
  /** 告警面（可選）：引擎隔離等route事故推 Discord；未設或送失敗不影響派工（fail-open）。 */
  notify?: (text: string) => Promise<boolean>
  /** Telegram 任務終態通知；assemble 僅在 token/chat ID 齊全時接線。 */
  taskTerminalNotify?: (notice: TaskTerminalNotice) => Promise<boolean>
  events: EventLog
  verifier?: { check(job: Job, res: RunResult): Promise<VerifierCheck> }
  /** M7：未接線時 undefined，行為與現狀完全一致（fail-open 硬線）。 */
  lessons?: LessonsPort
  /** M10.5：config 檔絕對路徑（assemble 填入）——globalBilledToday 掃兄弟專案用。測試可不設。 */
  cfgPath?: string
}

/** MEDIUM 1 修復：機器可讀的 blocked 原因碼。daemon.baseAlertMessage 依此挑對應人話文案
 * ——不是每種 blocked 都是「連敗」，含糊文案會誤導人工介入的方向。 */
// infra codes distinguish retryable worktree／外部終止，其他 reason 維持既有終態。
export type BlockedReason = 'max-attempts' | 'not-a-git-repo' | 'merge-conflict' | 'dirty-worktree' | 'branch-switched' | 'engine-not-allowed' | 'worktree-locked' | 'worktree-invalid' | 'infra:worktree-timeout' | 'infra:engine-external-termination'

export type CycleResult =
  | 'stopped' | 'cost-hard-stop' | 'idle' | 'done'
  | 'failed' | 'preflight-failed' | 'engine-error'
  // blocked 攜帶任務文字回呼叫端：daemon 的 alertMessageFor 不再讀 heartbeat.currentTask
  // （解隱性耦合——heartbeat 是「目前跑到哪」的觀測面，blocked 的任務文字該由產生
  // blocked 的呼叫鏈直接帶回，不該繞去讀一個為了別的目的而存在的檔案）。
  // taskId 供 daemon 冷卻閘 key 使用（修正：舊版 key 用任務文字前 40 字，兩個長任務
  // 前 40 字相同會撞出同一個 key、互相吞告警；taskId 全域唯一不會有這問題）。
  | { kind: 'blocked'; taskId: string; taskText: string; reason: BlockedReason; alertDetail?: string }

export async function runOnce(deps: Deps, retry: InfraRetryState = { retried: false }): Promise<CycleResult> {
  const { cfg, store, db, engines, events, verifier, notify } = deps
  noteSerialConcurrency(deps)
  if (existsSync(cfg.stopFile)) {
    writeHeartbeat(events, cfg, { state: 'stopped', todayCostUsd: todayCost(db, cfg) })
    return 'stopped'
  }

  const spent = todayCost(db, cfg)
  if (cfg.dailyHardUsd > 0 && spent >= cfg.dailyHardUsd) {
    quiet(() => events.appendOnce('cost-hard-stop', { spent }))
    writeHeartbeat(events, cfg, { state: 'cost-stopped', todayCostUsd: spent })
    return 'cost-hard-stop'
  }

  // M10.5：全域日頂（第二道防線）。查帳失敗＝0 放行（fail-open，spec §4——第一道防線仍在）。
  if (cfg.globalDailyHardUsd !== undefined && deps.cfgPath) {
    let g = 0
    try { g = globalBilledToday(deps.cfgPath, new Date().toISOString()) } catch { /* fail-open */ }
    if (g >= cfg.globalDailyHardUsd) {
      quiet(() => events.appendOnce('cost-hard-stop-global', { spent: g }))
      writeHeartbeat(events, cfg, { state: 'cost-stopped', todayCostUsd: spent })
      return 'cost-hard-stop'
    }
  }

  if (cfg.dailySoftUsd > 0 && spent >= cfg.dailySoftUsd) quiet(() => events.appendOnce('cost-soft-warn', { spent }))

  const openTasks = store.read().filter(t => t.status === 'open')
  if (openTasks.length === 0) {
    quiet(() => events.appendOnce('idle', { note: 'backlog 空，等使用者補任務' }))
    writeHeartbeat(events, cfg, { state: 'idle', todayCostUsd: spent })
    return 'idle'
  }

  const dups = store.duplicateIds()
  if (dups.length > 0) quiet(() => events.appendOnce('duplicate-tasks', { ids: dups }))

  const candidates = retry.taskId ? openTasks.filter(task => task.id === retry.taskId) : openTasks; if (candidates.length === 0) return 'idle'
  const picked = await pickReadyTask({ cfg, store, db, events, engines, notify }, candidates)
  if (typeof picked === 'string' || 'kind' in picked) {
    if (picked === 'preflight-failed') writeHeartbeat(events, cfg, { state: 'preflight-failed', todayCostUsd: spent })
    return picked
  }
  const { task, engine, engineTag, fixedCost } = picked

  writeHeartbeat(events, cfg, { state: 'running', currentTask: task.text, todayCostUsd: spent })

  // M4 Task 6（worktree 接線）：任務級隔離執行環境。非 git 專案（prepareWorktree 上拋）
  // → 直接 blocked+告警，不計入 maxAttempts 失敗計數（環境問題而非任務本身失敗——
  // fail-open 不炸 daemon，鐵律 #4）。
  let wt: WorktreeHandle
  try {
    wt = prepareWorktree(cfg.projectPath, cfg.worktreesDir, task.id, cfg)
  } catch (err) {
    quiet(() => events.append('worktree-prepare-failed', { task: task.text, error: String(err) }))
    const reason: BlockedReason = worktreeFailureReason(err), detail = reason === 'infra:worktree-timeout' ? `infra:worktree-timeout：逾時 ${cfg.worktreeAddTimeoutMs}ms；可調整 config 欄位 worktreeAddTimeoutMs；${String(err)}` : `worktree 建立失敗：${String(err)}`
    if (isInfrastructureRetryReason(reason)) return retryInfrastructure(deps, task, retry, reason, detail)
    return blockTask({ store, events }, task, reason, detail)
  }

  const runStartMs = Date.now() // 輪耗時觀測（duration_ms）：涵蓋 engine.run＋verify＋judge＋review 全輪

  // extraDirective 附加到 task.text 尾組成 job.directive（未設定時維持 undefined）——
  // claude-cli engine 的 prompt 任務行以 job.directive ?? task.text 消費（Fix 1 已接線）。
  let directive = cfg.extraDirective ? `${task.text}\n\n${cfg.extraDirective}` : undefined
  // M7：教訓注入（fail-open：inject 故障視同無教訓，絕不擋派工）
  let lessonsText = ''
  try { lessonsText = deps.lessons?.inject() ?? '' } catch { /* 教訓面故障不擋派工 */ }
  if (lessonsText) directive = `${directive ?? task.text}\n\n${lessonsText}`
  // 驗收回饋（judge 有效性分析 2026-07-28）：上一輪失敗原因餵回派工，終結同型連環打回
  // （491bd799 案例：引擎不知道打回原因，同款 claim 膨脹重複六輪）。fail-open 不擋派工。
  try {
    const lastFail = db.lastFailureFor(task.id)
    if (lastFail) directive = `${directive ?? task.text}\n\n上一次嘗試失敗被驗收打回，原因：${lastFail.replace(/\s+/g, ' ').trim().slice(0, 400)}\n請針對打回原因修正；宣稱改動的檔案與範圍必須與實際 diff 一致，不得宣稱未完成的部分。`
  } catch { /* 回饋面故障不擋派工 */ }
  // 幻影完成對策（run.db 四大失敗來源分析 2026-07-27）：自證硬指令恆附派工尾。
  directive = `${directive ?? task.text}\n\n完成的定義＝已產生新 git commit。結束前執行 git log -1 --oneline 自證；沒有 commit 就如實回報失敗原因，不得宣稱完成。\n完成定義＝存在新 commit，無 commit 視為未完成。`

  // try 只包 engine.run：下游 I/O 故障不該被誤判成引擎錯誤而污染 failCount。
  let res: RunResult
  try {
    res = await engine.run({ task, projectPath: wt.cwd, directive })
  } catch (err) {
    if (isExternalEngineTermination(err)) return retryInfrastructure(deps, task, retry, 'infra:engine-external-termination', `infra:engine-external-termination：${String(err)}`)
    // M5 Task 1：固定成本引擎連拋例外都入帳 costPerRunUsd（進程極可能已實際起跑燒錢）。
    db.record({ taskId: task.id, ok: false, costUsd: fixedCost ?? 0, detail: String(err), engine: engineTag, durationMs: Date.now() - runStartMs })
    engine.invalidatePreflight?.() // 引擎健康存疑，下輪真探針再驗
    quiet(() => events.append('engine-error', { task: task.text, error: String(err) }))
    quiet(() => events.append('worktree-kept', { taskId: task.id, branch: wt.branch, worktreePath: wt.cwd }))
    return resolveFailure(deps, task, 'engine-error', String(err), { costUsd: fixedCost ?? 0 })
  }
  if (!res.ok && isExternalEngineTermination(`${res.failureReason ?? ''}\n${res.output}`)) return retryInfrastructure(deps, task, retry, 'infra:engine-external-termination', `infra:engine-external-termination：${res.failureReason ?? res.output}`)
  res = await nudgeNoCommit(engine, { task, projectPath: wt.cwd, directive }, res, wt.baseHead)
  // 引擎結果記帳：db 壞了是基礎設施故障，不該靜默。失敗成本估計（M4 Task 3）：costUnknown===true
  // （timeout/exit≠0/輸出不可解析）改記 cfg.failureCostEstimateUsd，detail 帶 cost-estimated 標記；
  // 引擎解析出真值（含 is_error、真值恰好 0）照記真值。M5 Task 1：fixedCost 有設（非真值引擎）
  // → 成功失敗一律入帳固定估計值，估計語意只留給真值引擎（claude）。
  const costEstimated = fixedCost === undefined && !res.ok && res.costUnknown === true
  const recordedCostUsd = fixedCost ?? (costEstimated ? cfg.failureCostEstimateUsd : res.costUsd)
  const baseDetail = res.failureReason ?? res.commitHash ?? ''
  const recordedDetail = costEstimated ? `${baseDetail} [cost-estimated]` : baseDetail
  db.record({ taskId: task.id, ok: res.ok, costUsd: recordedCostUsd, detail: recordedDetail, engine: engineTag, durationMs: Date.now() - runStartMs, tokensIn: res.tokensIn, tokensOut: res.tokensOut, tokensCached: res.tokensCached })
  const quotaUsage = { costUsd: recordedCostUsd, tokensIn: res.tokensIn, tokensOut: res.tokensOut, tokensCached: res.tokensCached }
  if (!res.ok) engine.invalidatePreflight?.() // timeout/exit≠0/no-commit：引擎健康存疑，下輪重探（verify 拒收不算）

  const missingArtifact = res.ok ? firstMissingArtifact(wt.cwd, res.output, res.baseCommitHash, res.commitHash, cfg.artifactContract) : undefined
  if (missingArtifact) {
    const reason = `artifact-missing:${missingArtifact}`
    db.record({ taskId: task.id, ok: false, costUsd: 0, detail: reason, engine: engineTag, durationMs: Date.now() - runStartMs })
    quiet(() => events.append('task-failed', { task: task.text, reason, outputTail: res.output.slice(-600) }))
    quiet(() => events.append('worktree-kept', { taskId: task.id, branch: wt.branch, worktreePath: wt.cwd }))
    return resolveFailure(deps, task, 'failed', reason, quotaUsage)
  }

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
      db.record({ taskId: task.id, ok: false, costUsd: 0, detail: vc.reason ?? 'verify rejected', engine: engineTag, durationMs: Date.now() - runStartMs, tokensIn: res.tokensIn, tokensOut: res.tokensOut, tokensCached: res.tokensCached })
      quiet(() => events.append('task-verify-failed', { task: task.text, reason: vc.reason }))
      // engine 失敗/verify 拒：rollback 已在 worktree 內安全跑過，保留現場供 debug（不清理）。
      quiet(() => events.append('worktree-kept', { taskId: task.id, branch: wt.branch, worktreePath: wt.cwd }))
      return resolveFailure(deps, task, 'failed', `verify 拒收：${vc.reason ?? '未附原因'}`, quotaUsage)
    }
  }

  if (res.ok) {
    // engine 成功 + verify 通過（或未設 verifier）→ 嘗試把任務分支 ff-only 合回主 repo。
    // merge queue（併發基建）：合併一次一個；串行下等價直呼，併發池（GOAL B）沿用同一入口。
    const merge = await enqueueMerge(cfg.projectPath, () => mergeAfterRebaseVerify(cfg, wt))
    if (merge.rebaseAttempted) quiet(() => events.append('rebase-attempted', {
      task: task.text,
      branch: wt.branch,
      rebaseAttempted: true,
      ...(merge.failureStage ? { stage: merge.failureStage } : {}),
    }))
    if (merge.rebased) quiet(() => events.append('merge-rebased', { task: task.text, branch: wt.branch }))
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
      if (merge.reason === 'dirty-worktree') {
        const files = merge.dirtyFiles ?? []
        const detail = `主工作目錄有 ${merge.dirtyFileCount ?? files.length} 個未提交變更檔阻擋合併，需先提交或移至分支保存${files.length > 0 ? `；檔案：${files.join('、')}` : ''}`
        quiet(() => events.append('dirty-worktree', { task: task.text, branch: wt.branch, fileCount: merge.dirtyFileCount, files }))
        return blockTask({ store, events }, task, 'dirty-worktree', detail)
      }
      // mergeBack 已做過唯一一次 rebase 補救；失敗時不可清理 worktree／分支，保留未合併成果。
      quiet(() => events.append('merge-conflict', {
        task: task.text,
        branch: wt.branch,
        ...(merge.rebaseAttempted ? { rebaseAttempted: true } : {}),
        ...(merge.failureStage ? { stage: merge.failureStage } : {}),
      }))
      const detail = merge.failureStage === 'verify'
        ? 'merge-conflict：rebase 後驗收紅燈，成果未合回，需人工介入合併'
        : merge.failureStage === 'rebase'
          ? 'merge-conflict：rebase 補救衝突，成果未合回，需人工介入合併'
          : merge.failureStage === 'merge'
            ? 'merge-conflict：rebase 後重試合併失敗，成果未合回，需人工介入合併'
            : 'merge-conflict：rebase 補救失敗，成果未合回，需人工介入合併'
      return blockTask({ store, events }, task, 'merge-conflict', detail)
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
      cleanupWorktree(cfg.projectPath, wt.cwd, wt.branch, cfg)
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
    await notifyTaskTerminal(deps, {
      outcome: 'done', taskId: task.id, taskText: task.text,
      resultSummary: `commit ${merge.commitHash ?? res.commitHash ?? 'unknown'}`,
      ...quotaUsage,
    })
    return 'done'
  }

  // Fix 2：失敗時 engine 最後輸出是唯一的（可能已花真錢的）診斷線索，截尾 600 字持久化
  // 進 events（保尾不保頭：死因在最後；events.jsonl 有輪替，欄位大小可控即可）。
  quiet(() => events.append('task-failed', {
    task: task.text, reason: res.failureReason, outputTail: res.output.slice(-600)
  }))
  // engine 失敗（res.ok===false，非例外）：既有流程走 resolveFailure，worktree 保留現場。
  quiet(() => events.append('worktree-kept', { taskId: task.id, branch: wt.branch, worktreePath: wt.cwd }))
  return resolveFailure(deps, task, 'failed', res.failureReason ?? '未知', quotaUsage)
}

/** rebase 成功後仍在 merge queue 內驗收；只有非紅燈才允許唯一一次 merge 重試。 */
async function mergeAfterRebaseVerify(cfg: Config, wt: WorktreeHandle): Promise<MergeBackResult> {
  const timeouts = { gitTimeoutMs: cfg.gitTimeoutMs, worktreeAddTimeoutMs: cfg.worktreeAddTimeoutMs }
  const first = mergeBack(cfg.projectPath, wt.branch, wt.baseBranch, wt.baseHead, wt.cwd, {
    ...timeouts,
    deferAfterRebase: true,
  })
  if (!first.rebased || first.failureStage !== 'verify') return first

  const command = rebasedGoalVerifyCommand(cfg, wt.cwd)
  let verification
  try {
    verification = await runVerify({ command, cwd: wt.cwd, timeoutMs: cfg.verifyTimeoutMs })
  } catch {
    return { ...first, failureStage: 'verify' }
  }
  // runVerify 的 skip 是既有 fail-open 語意（未設指令、逾時或驗證工具故障），只有明確 fail 阻擋合併。
  if (verification.status === 'fail') return { ...first, failureStage: 'verify' }

  return mergeBack(cfg.projectPath, wt.branch, wt.baseBranch, wt.baseHead, wt.cwd, {
    ...timeouts,
    allowRebase: false,
    rebaseAttempted: true,
  })
}

function rebasedGoalVerifyCommand(cfg: Config, worktreePath: string): string | undefined {
  if (!cfg.goalFile) return cfg.verifyCommand
  const projectPath = resolve(cfg.projectPath)
  const configuredGoal = resolve(cfg.goalFile)
  const rel = relative(projectPath, configuredGoal)
  if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)) return cfg.verifyCommand
  const goalPath = join(worktreePath, rel)
  try {
    const parsed = parseGoal(readFileSync(goalPath, 'utf8').replace(/\r\n/g, '\n'))
    return parsed.verifyCommand?.trim() || cfg.verifyCommand
  } catch {
    return cfg.verifyCommand
  }
}

/** 環境級 blocked：不計 maxAttempts；store.report 失敗只記事件。 */
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
  quiet(() => events.append('task-blocked', { task: task.text, reason, ...(humanReason.includes('retried=1') ? { retried: 1 } : {}) }))
  return { kind: 'blocked', taskId: task.id, taskText: task.text, reason, ...(reason === 'dirty-worktree' ? { alertDetail: humanReason } : {}) }
}

async function retryInfrastructure(deps: Deps, task: Task, retry: InfraRetryState, reason: InfrastructureRetryReason, detail: string): Promise<CycleResult> {
  if (retry.retried) return blockTask({ store: deps.store, events: deps.events }, task, reason, retriedBlockedReason(detail))
  quiet(() => deps.events.append('infra-retry', { task: task.text, reason, retried: 1 }))
  try { cleanupRetryWorktree(deps.cfg.projectPath, deps.cfg.worktreesDir, task.id, deps.cfg) } catch (err) { quiet(() => deps.events.append('infra-retry-cleanup-failed', { task: task.text, reason, error: String(err) })) }
  return runOnce(deps, { taskId: task.id, retried: true, source: reason })
}

/** 戰績隔離→輪替候選→preflight；全壞→preflight-failed；白名單外/單候選 resolve 拋→blocked。 */
export async function pickReadyTask(
  { cfg, store, db, events, engines, notify }: Pick<Deps, 'cfg' | 'store' | 'db' | 'events' | 'engines' | 'notify'>,
  openTasks: Task[]
): Promise<{ task: Task; engine: Engine; engineTag: string; fixedCost: number | undefined } | CycleResult> {
  const routingKey = JSON.stringify([cfg.dataDir, cfg.engineRotation, cfg.timezoneOffsetHours])
  const isolatedTags = cfg.engineIsolation && cfg.engineRotation?.length ? await singleFlightPickRouting(routingKey, () => loadIsolatedTagsForPick(
    { dataDir: cfg.dataDir, rotation: cfg.engineRotation, offsetHours: cfg.timezoneOffsetHours },
    ev => { // 告警 fire-and-forget：notify 依契約自吞錯，絕不反殺派工（鐵律 #2）
      quiet(() => events.append('engine-route-isolated', { ...ev }))
      void notify?.(`⛔ 引擎隔離：${ev.engine} — ${ev.reason}（24h 後單次試探）`)
    },
  )) : [], subs = subscriptionTags(cfg)
  // 日額度守門：helper/run.db 失敗 → 空 caps/counts，維持原派工路徑（fail-open）
  const { dailyAttemptCaps, todayAttemptCounts } = loadDailyAttemptCapContext(cfg.engines, cfg.dataDir)
  const engineStats = loadEngineStatsForWeighting(db, events, cfg.dataDir, cfg.engineRotation)
  for (const cand of openTasks) {
    const tags = pickCandidateTags({ rotation: cfg.engineRotation, defaultEngine: cfg.defaultEngine, task: cand, failCount: db.failCount(cand.id), isolatedTags, subscriptionTags: subs, dailyAttemptCaps, todayAttemptCounts, engineStats, zeroCostTags: zeroCostTags(cfg) })
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

/** 達 maxAttempts → blocked（lastFailure 進註記）；report 拋錯只吞錯。 */
async function resolveFailure(
  deps: Pick<Deps, 'cfg' | 'store' | 'db' | 'events' | 'taskTerminalNotify'>,
  task: Task,
  base: 'failed' | 'engine-error',
  lastFailure: string,
  quotaUsage: Pick<TaskTerminalNotice, 'costUsd' | 'tokensIn' | 'tokensOut' | 'tokensCached'>
): Promise<CycleResult> {
  const { cfg, store, db, events } = deps
  if (db.failCount(task.id) < cfg.maxAttempts) return base
  const hint = lastFailure.replace(/\s+/g, ' ').trim().slice(0, 80) || '未知'
  const result = blockTask({ store, events }, task, 'max-attempts', `連敗 ${cfg.maxAttempts} 次，人工介入（最後失敗：${hint}）`)
  await notifyTaskTerminal(deps, {
    outcome: 'failed', taskId: task.id, taskText: task.text,
    resultSummary: lastFailure, attempts: cfg.maxAttempts, ...quotaUsage,
  })
  return result
}

async function notifyTaskTerminal(
  { taskTerminalNotify }: Pick<Deps, 'taskTerminalNotify'>,
  notice: TaskTerminalNotice
): Promise<void> {
  try { await taskTerminalNotify?.(notice) } catch { /* 通知面故障不得改寫任務終態。 */ }
}

/** 訂閱制引擎 tag 清單（邊際成本≈0，不踩日頂）。 */
export function subscriptionTags(cfg: Config): string[] {
  return Object.entries(cfg.engines ?? {}).filter(([, e]) => e.subscription).map(([t]) => t)
}

/** 免費起跑用：零邊際成本引擎（subscription 且 costPerRunUsd===0，即 devin、oc 系、agy 層；
 * codex 系記固定成本 1 反映 ChatGPT 額度機會成本，故排除）。 */
export function zeroCostTags(cfg: Config): Set<string> {
  return new Set(Object.entries(cfg.engines ?? {}).filter(([, e]) => e.subscription && (e.costPerRunUsd ?? 0) === 0).map(([t]) => t))
}

/** 本地日 billed 成本（排除訂閱引擎）。 */
function todayCost(db: RunDb, cfg: Config): number {
  const offsetHours = cfg.timezoneOffsetHours
  return db.billedCostForLocalDay(localDay(new Date().toISOString(), offsetHours), offsetHours, subscriptionTags(cfg))
}

/** run-once 任務跑完後補 heartbeat idle（stopped/cost/idle/preflight 已自帶收尾）。 */
export function finalizeRunOnceHeartbeat(deps: Deps, result: CycleResult, now: Date = new Date()): void {
  if (!(typeof result === 'object' || result === 'done' || result === 'failed' || result === 'engine-error')) return
  try {
    const day = localDay(now.toISOString(), deps.cfg.timezoneOffsetHours)
    writeHeartbeat(deps.events, deps.cfg, { state: 'idle', todayCostUsd: deps.db.billedCostForLocalDay(day, deps.cfg.timezoneOffsetHours, subscriptionTags(deps.cfg)) })
  } catch { /* 觀測面故障不可反殺 CLI（鐵律 #4） */ }
}
