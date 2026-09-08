import { attemptAccounting } from './engines/attempt-accounting.js'
import { existsSync, writeFileSync } from 'node:fs'
import type { BacklogStore } from './backlog.js'
import { localDay, type AttemptFailureClass, type RunDb } from './db.js'
import { loadIsolatedTagsForPick } from './engines/apply-stats-isolation.js'
import { loadDailyAttemptCapContext } from './engines/daily-attempt-cap-gate.js'
import { loadEngineStatsForWeighting } from './engines/adaptive-rotation.js'
import { firstMissingArtifact } from './engines/artifact-contract-git.js'
import { noteSerialConcurrency } from './engines/concurrency-notice.js'
import { writeHeartbeat } from './engines/heartbeat-write.js'
import { cleanupRetryWorktree, isExternalEngineTermination, isInfrastructureRetryReason, retriedBlockedReason, worktreeFailureReason, type InfrastructureRetryReason, type InfraRetryState } from './engines/infra-retry.js'
import { enqueueMerge, enqueueTeamMerge } from './engines/merge-queue.js'
import { nudgeNoCommit } from './engines/no-commit-nudge.js'
import type { TaskTerminalNotice } from './engines/notify.js'
import { freeOnlyAttemptLimit, freeOnlyListExhausted, freeOnlyRetryCandidates } from './engines/free-only-retry.js'
import { sequentialReadyTasks, tryFreeOnlySplit } from './engines/free-only-split.js'
import { deniedFreeOnlyPin, pickCandidateTags } from './engines/pick-candidates.js'
import { singleFlightPickRouting } from './engines/pick-ready-single-flight.js'
import { quiet, type EventLog } from './events.js'
import { globalBilledToday } from './globalcost.js'
import type { Config, Engine, EngineResolver, Job, RunResult, Task } from './types.js'
import type { VerifierCheck } from './verifier.js'
import { cleanupWorktree, mergeBack, prepareWorktree, WorktreeCleanupPartialError, type MergeBackResult, type WorktreeHandle } from './worktree.js'
import { runVerify } from './verify.js'
import { classifyTaskRisk, verifyRequired } from './engines/risk-policy.js'
import { defaultCommitHash } from './engines/commit-hash.js'
import { runCandidateGate } from './engines/candidate-gate.js'
import { newExecutionId, type EvidenceStore } from './engines/evidence-chain.js'
import { checkOwnership, compatibleTasks } from './engines/ownership.js'
import type { TeamState } from './engines/team-state.js'
import { trackedDirtyFiles } from './engines/main-admission.js'
import { observeLearning } from './learn/outcomes.js'

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
  /** CLI 正式接線必帶；測試或嵌入式呼叫未接時維持舊行為。 */
  evidence?: EvidenceStore
  /** Git common-dir 共用 ownership／merge queue；正式 CLI 必接，嵌入式測試可省略。 */
  team?: TeamState
  /** M7：未接線時 undefined，行為與現狀完全一致（fail-open 硬線）。 */
  lessons?: LessonsPort
  /** M10.5：config 檔絕對路徑（assemble 填入）——globalBilledToday 掃兄弟專案用。測試可不設。 */
  cfgPath?: string
}

/** MEDIUM 1 修復：機器可讀的 blocked 原因碼。daemon.baseAlertMessage 依此挑對應人話文案
 * ——不是每種 blocked 都是「連敗」，含糊文案會誤導人工介入的方向。 */
// infra codes distinguish retryable worktree／外部終止，其他 reason 維持既有終態。
export type BlockedReason = 'max-attempts' | 'not-a-git-repo' | 'merge-conflict' | 'completion-gate' | 'verification-infra' | 'review-unavailable' | 'release-approval' | 'ownership-drift' | 'merge-queue-recovery' | 'team-state-quarantined' | 'dirty-worktree' | 'branch-switched' | 'engine-not-allowed' | 'worktree-locked' | 'worktree-invalid' | 'infra:worktree-timeout' | 'infra:engine-external-termination'

export type CycleResult =
  | 'stopped' | 'cost-hard-stop' | 'idle' | 'done'
  | 'failed' | 'preflight-failed' | 'engine-error' | 'deferred'
  // blocked 攜帶任務文字回呼叫端：daemon 的 alertMessageFor 不再讀 heartbeat.currentTask
  // （解隱性耦合——heartbeat 是「目前跑到哪」的觀測面，blocked 的任務文字該由產生
  // blocked 的呼叫鏈直接帶回，不該繞去讀一個為了別的目的而存在的檔案）。
  // taskId 供 daemon 冷卻閘 key 使用（修正：舊版 key 用任務文字前 40 字，兩個長任務
  // 前 40 字相同會撞出同一個 key、互相吞告警；taskId 全域唯一不會有這問題）。
  | { kind: 'blocked'; taskId: string; taskText: string; reason: BlockedReason; alertDetail?: string }

export async function runOnce(deps: Deps, retry: InfraRetryState = { retried: false }): Promise<CycleResult> {
  if (deps.cfg.concurrency <= 1 || retry.taskId || existsSync(deps.cfg.stopFile)) return runSingleOnce(deps, retry)
  if (!deps.team) { noteSerialConcurrency(deps); return runSingleOnce(deps, retry) }
  const open = sequentialReadyTasks(deps.store.read())
  if (open[0] && classifyTaskRisk(deps.cfg, open[0]) !== 'low') return runSingleOnce(deps, { retried: false, taskId: open[0].id })
  const selected = compatibleTasks(open.filter(task => classifyTaskRisk(deps.cfg, task) === 'low'), deps.cfg.concurrency)
  if (selected.length <= 1) return runSingleOnce(deps, selected[0] ? { retried: false, taskId: selected[0].id } : retry)
  const results = await Promise.all(selected.map(task => runSingleOnce(deps, { retried: false, taskId: task.id })))
  return results.find((r): r is Extract<CycleResult, object> => typeof r === 'object') ?? (results.includes('done') ? 'done' : results[0] ?? 'idle')
}

async function runSingleOnce(deps: Deps, retry: InfraRetryState): Promise<CycleResult> {
  const { cfg, store, db, engines, events, verifier, notify } = deps
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

  // M10.5：全域日頂（第二道防線）。查帳不完整時停止派工，不把未知當成零。
  if (cfg.globalDailyHardUsd !== undefined && deps.cfgPath) {
    let g = 0
    try { g = globalBilledToday(deps.cfgPath, new Date().toISOString()) } catch { quiet(() => events.appendOnce('cost-accounting-incomplete', { scope: 'global' })); writeHeartbeat(events, cfg, { state: 'cost-stopped', todayCostUsd: spent }); return 'cost-hard-stop' }
    if (g >= cfg.globalDailyHardUsd) {
      quiet(() => events.appendOnce('cost-hard-stop-global', { spent: g }))
      writeHeartbeat(events, cfg, { state: 'cost-stopped', todayCostUsd: spent })
      return 'cost-hard-stop'
    }
  }

  if (cfg.dailySoftUsd > 0 && spent >= cfg.dailySoftUsd) quiet(() => events.appendOnce('cost-soft-warn', { spent }))

  const openTasks = sequentialReadyTasks(store.read())
  if (openTasks.length === 0) {
    quiet(() => events.appendOnce('idle', { note: 'backlog 空，等使用者補任務' }))
    writeHeartbeat(events, cfg, { state: 'idle', todayCostUsd: spent })
    return 'idle'
  }

  const dups = store.duplicateIds()
  if (dups.length > 0) quiet(() => events.appendOnce('duplicate-tasks', { ids: dups }))

  const candidates = retry.taskId ? openTasks.filter(task => task.id === retry.taskId) : openTasks; if (candidates.length === 0) return 'idle'
  const picked = await pickReadyTask({ cfg, store, db, events, engines, notify, team: deps.team }, candidates)
  if (typeof picked === 'string' || 'kind' in picked) {
    if (picked === 'preflight-failed') writeHeartbeat(events, cfg, { state: 'preflight-failed', todayCostUsd: spent })
    return picked
  }
  const { task, engine, engineTag, fixedCost } = picked
  const executionId = newExecutionId()
  const mainDirty = trackedDirtyFiles(cfg.projectPath, cfg.gitTimeoutMs)
  if (mainDirty?.length) {
    const detail = `主工作目錄有 ${mainDirty.length} 個 tracked dirty 檔，admission 在 Engine 執行前拒絕；檔案：${mainDirty.slice(0, 5).join('、')}`
    quiet(() => events.append('dirty-worktree', { task: task.text, fileCount: mainDirty.length, files: mainDirty.slice(0, 5), stage: 'admission' }))
    return blockTask({ store, events }, task, 'dirty-worktree', detail)
  }
  const leaseMs = Math.max(60_000, cfg.staleThresholdMs)
  let teamClaim: { token: string } | undefined
  if (deps.team) {
    try {
      const claimed = deps.team.claim({
        executionId, task, workerId: engineTag,
        reservedCostUsd: cfg.engines[engineTag]?.subscription ? 0 : (fixedCost ?? cfg.failureCostEstimateUsd),
        spentUsd: spent, dailyHardUsd: cfg.dailyHardUsd, leaseMs, dailyAttemptCap: cfg.engines[engineTag]?.dailyAttemptCap,
      })
      if (!claimed.ok) {
        quiet(() => events.append('team-admission-deferred', { task: task.text, reason: claimed.reason, detail: claimed.detail }))
        return claimed.reason === 'quarantined'
          ? blockTask({ store, events }, task, 'team-state-quarantined', `team-state-quarantined：${claimed.detail}`)
          : 'deferred'
      }
      teamClaim = claimed
    } catch (err) {
      return blockTask({ store, events }, task, 'team-state-quarantined', `team coordination unavailable：${String(err)}`)
    }
  }
  let claimReleased = false
  const releaseClaim = (): void => {
    if (!teamClaim || claimReleased) return
    claimReleased = true
    try { deps.team?.release(executionId, teamClaim.token) } catch { /* DB 狀態保留，逾期後 quarantine */ }
  }
  const claimHeartbeat = teamClaim ? setInterval(() => { try { deps.team?.heartbeat(executionId, teamClaim!.token, leaseMs) } catch { /* merge admission 仍會 fail-closed */ } }, Math.max(10_000, Math.floor(leaseMs / 3))) : undefined
  claimHeartbeat?.unref?.()
  let finishLearning: ReturnType<typeof observeLearning> | undefined, learningResult: { accepted: boolean; commit?: string } = { accepted: false }

  try {

  writeHeartbeat(events, cfg, { state: 'running', currentTask: task.text, todayCostUsd: spent })

  // M4 Task 6（worktree 接線）：任務級隔離執行環境。非 git 專案（prepareWorktree 上拋）
  // → 直接 blocked+告警，不計入 maxAttempts 失敗計數（環境問題而非任務本身失敗——
  // fail-open 不炸 daemon，鐵律 #4）。
  let wt: WorktreeHandle
  try {
    wt = prepareWorktree(cfg.projectPath, cfg.worktreesDir, task.id, cfg)
  } catch (err) {
    const reason: BlockedReason = worktreeFailureReason(err), detail = reason === 'infra:worktree-timeout' ? `infra:worktree-timeout：逾時 ${cfg.worktreeAddTimeoutMs}ms；可調整 config 欄位 worktreeAddTimeoutMs；${String(err)}` : `worktree 建立失敗：${String(err)}`
    quiet(() => events.append(reason === 'worktree-invalid' ? 'worktree-invalid' : 'worktree-prepare-failed', { task: task.text, error: String(err) }))
    if (isInfrastructureRetryReason(reason)) { releaseClaim(); return retryInfrastructure(deps, task, retry, reason, detail) }
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
  finishLearning = observeLearning(events, { executionId, taskId: task.id, model: cfg.engines[engineTag]?.model ?? engineTag, baseCommit: wt.baseHead, lessonsText })
  // 驗收回饋（judge 有效性分析 2026-07-28）：上一輪失敗原因餵回派工，終結同型連環打回
  // （491bd799 案例：引擎不知道打回原因，同款 claim 膨脹重複六輪）。fail-open 不擋派工。
  try {
    const lastFail = db.lastFailureFor(task.id)
    if (lastFail) directive = `${directive ?? task.text}\n\n上一次嘗試失敗被驗收打回，原因：${lastFail.replace(/\s+/g, ' ').trim().slice(0, 400)}\n請針對打回原因修正；宣稱改動的檔案與範圍必須與實際 diff 一致，不得宣稱未完成的部分。`
  } catch { /* 回饋面故障不擋派工 */ }
  // 幻影完成對策（run.db 四大失敗來源分析 2026-07-27）：自證硬指令恆附派工尾。
  directive = `${directive ?? task.text}\n\n完成的定義＝工作區改動完成，且最終由引擎或可信宿主產生新 git commit。若 sandbox 保護 Git metadata，不得繞過沙箱，保留改動讓宿主提交；否則結束前執行 git log -1 --oneline 自證。\n完成定義＝最終存在新 commit，無 commit 視為未完成。`

  // try 只包 engine.run：下游 I/O 故障不該被誤判成引擎錯誤而污染 failCount。
  let res: RunResult
  try {
    res = await engine.run({ task, projectPath: wt.cwd, directive, executionId, writerIdentity: engineTag })
  } catch (err) {
    if (isExternalEngineTermination(err)) { releaseClaim(); return retryInfrastructure(deps, task, retry, 'infra:engine-external-termination', `infra:engine-external-termination：${String(err)}`) }
    // M5 Task 1：固定成本引擎連拋例外都入帳 costPerRunUsd（進程極可能已實際起跑燒錢）。
    db.record({ taskId: task.id, ok: false, costUsd: fixedCost ?? 0, detail: String(err), engine: engineTag, accounting: attemptAccounting({ ok: false, output: '', costUsd: 0, costUnknown: true }, cfg.engines?.[engineTag] ?? {}), durationMs: Date.now() - runStartMs, failureClass: 'supply' })
    engine.invalidatePreflight?.() // 引擎健康存疑，下輪真探針再驗
    quiet(() => events.append('engine-error', { task: task.text, error: String(err) }))
    quiet(() => events.append('worktree-kept', { taskId: task.id, branch: wt.branch, worktreePath: wt.cwd }))
    return resolveFailure(deps, task, 'engine-error', String(err), 'supply', { costUsd: fixedCost ?? 0 })
  }
  if (!res.ok && isExternalEngineTermination(`${res.failureReason ?? ''}\n${res.output}`)) { releaseClaim(); return retryInfrastructure(deps, task, retry, 'infra:engine-external-termination', `infra:engine-external-termination：${res.failureReason ?? res.output}`) }
  res = await nudgeNoCommit(engine, { task, projectPath: wt.cwd, directive }, res, wt.baseHead)
  // 引擎結果記帳：db 壞了是基礎設施故障，不該靜默。失敗成本估計（M4 Task 3）：costUnknown===true
  // （timeout/exit≠0/輸出不可解析）改記 cfg.failureCostEstimateUsd，detail 帶 cost-estimated 標記；
  // 引擎解析出真值（含 is_error、真值恰好 0）照記真值。M5 Task 1：fixedCost 有設（非真值引擎）
  // → 成功失敗一律入帳固定估計值，估計語意只留給真值引擎（claude）。
  const costEstimated = fixedCost === undefined && !res.ok && res.costUnknown === true
  const recordedCostUsd = fixedCost ?? (costEstimated ? cfg.failureCostEstimateUsd : res.costUsd)
  const baseDetail = res.failureReason ?? res.commitHash ?? ''
  const recordedDetail = costEstimated ? `${baseDetail} [cost-estimated]` : baseDetail
  const failureClass = res.failureReason?.startsWith('no-commit') ? 'task' as const : 'supply' as const
  db.record({ taskId: task.id, ok: res.ok, costUsd: recordedCostUsd, detail: recordedDetail, engine: engineTag, accounting: attemptAccounting(res, cfg.engines?.[engineTag] ?? {}, costEstimated), durationMs: Date.now() - runStartMs, tokensIn: res.tokensIn, tokensOut: res.tokensOut, tokensCached: res.tokensCached, ...(!res.ok ? { failureClass } : {}) })
  const quotaUsage = { costUsd: recordedCostUsd, tokensIn: res.tokensIn, tokensOut: res.tokensOut, tokensCached: res.tokensCached }
  if (!res.ok) engine.invalidatePreflight?.() // timeout/exit≠0/no-commit：引擎健康存疑，下輪重探（verify 拒收不算）

  const validationAccounting = { ...attemptAccounting({ ok: false, output: '', costUsd: 0, costUnknown: true }, {}), stage: 'validation' as const }
  const pauseReady = (): void => {
    const candidateHead = defaultCommitHash(wt.cwd) ?? res.commitHash ?? 'unknown'
    if (teamClaim && deps.team) try { deps.team.pauseCandidate({ executionId, token: teamClaim.token, taskId: task.id, candidateHead, branch: wt.branch, worktreePath: wt.cwd }) } catch (err) { quiet(() => events.append('pause-state-write-failed', { task: task.text, error: String(err) })) }
    quiet(() => events.append('task-paused-ready', { task: task.text, branch: wt.branch, candidateHead }))
    quiet(() => events.append('worktree-kept', { taskId: task.id, branch: wt.branch, worktreePath: wt.cwd }))
  }
  if (res.ok && existsSync(cfg.stopFile)) { pauseReady(); return 'stopped' }

  if (res.ok) {
    const ownership = checkOwnership(wt.cwd, task, res.baseCommitHash ?? wt.baseHead, defaultCommitHash(wt.cwd) ?? res.commitHash)
    if (!ownership.ok) {
      db.record({ taskId: task.id, ok: false, costUsd: 0, detail: ownership.detail, engine: engineTag, accounting: validationAccounting, durationMs: Date.now() - runStartMs, failureClass: 'task' })
      quiet(() => events.append('ownership-drift', { task: task.text, detail: ownership.detail, branch: wt.branch }))
      quiet(() => events.append('worktree-kept', { taskId: task.id, branch: wt.branch, worktreePath: wt.cwd }))
      return blockTask({ store, events }, task, 'ownership-drift', `ownership-drift：${ownership.detail}`)
    }
  }

  const missingArtifact = res.ok ? firstMissingArtifact(wt.cwd, res.output, res.baseCommitHash, res.commitHash, cfg.artifactContract) : undefined
  if (missingArtifact) {
    const reason = `artifact-missing:${missingArtifact}`
    db.record({ taskId: task.id, ok: false, costUsd: 0, detail: reason, engine: engineTag, accounting: validationAccounting, durationMs: Date.now() - runStartMs, failureClass: 'task' })
    quiet(() => events.append('task-failed', { task: task.text, reason, outputTail: res.output.slice(-600) }))
    quiet(() => events.append('worktree-kept', { taskId: task.id, branch: wt.branch, worktreePath: wt.cwd }))
    return resolveFailure(deps, task, 'failed', reason, 'task', quotaUsage)
  }

  if (res.ok && (verifier || deps.evidence)) {
    const vc = await runCandidateGate({ cfg, task, cwd: wt.cwd, result: res, verifier, evidence: deps.evidence, executionId, writerIdentity: engineTag })
    for (const a of vc.alerts) quiet(() => events.append('verify-alert', { task: task.text, detail: a }))
    const receipt = vc.receipt
    if (receipt) quiet(() => events.append('evidence-bundle', { task: task.text, commit: res.commitHash, path: receipt.path, hash: receipt.bundleHash }))
    if (vc.paused) { pauseReady(); return 'stopped' }
    if (!vc.pass) {
      // 引擎那筆已記 ok:true+真實 cost（成本不可造假）；這裡多記一筆 ok:false 讓失敗計數靠這筆走。
      db.record({ taskId: task.id, ok: false, costUsd: 0, detail: vc.reason ?? 'verify rejected', engine: engineTag, accounting: validationAccounting, durationMs: Date.now() - runStartMs, failureClass: vc.blockedReason ? 'infra' : 'task' })
      quiet(() => events.append('task-verify-failed', { task: task.text, reason: vc.reason }))
      // engine 失敗/verify 拒：rollback 已在 worktree 內安全跑過，保留現場供 debug（不清理）。
      quiet(() => events.append('worktree-kept', { taskId: task.id, branch: wt.branch, worktreePath: wt.cwd }))
      if (vc.blockedReason) {
        return blockTask({ store, events }, task, vc.blockedReason, `${vc.blockedReason}：${vc.reason ?? '必要驗收無可用證據'}`)
      }
      return resolveFailure(deps, task, 'failed', `verify 拒收：${vc.reason ?? '未附原因'}`, 'task', quotaUsage)
    }
  }

  if (res.ok && existsSync(cfg.stopFile)) { pauseReady(); return 'stopped' }

  if (res.ok) {
    // engine 成功 + verify 通過（或未設 verifier）→ 嘗試把任務分支 ff-only 合回主 repo。
    // merge queue（併發基建）：合併一次一個；串行下等價直呼，併發池（GOAL B）沿用同一入口。
    const mergeFn = () => existsSync(cfg.stopFile)
      ? ({ merged: false, reason: 'paused' } as const)
      : mergeAfterRebaseVerify(cfg, wt, task, res, verifier, deps.evidence, executionId, engineTag)
    const candidateHead = defaultCommitHash(wt.cwd) ?? res.commitHash ?? 'unknown'
    const merge = teamClaim && deps.team
      ? await enqueueTeamMerge(cfg.projectPath, deps.team, { executionId, token: teamClaim.token, taskId: task.id, candidateHead, branch: wt.branch, worktreePath: wt.cwd }, Math.max(cfg.wedgeHardCapMs, cfg.verifyTimeoutMs), mergeFn)
      : await enqueueMerge(cfg.projectPath, mergeFn)
    if (merge.rebaseAttempted) quiet(() => events.append('rebase-attempted', {
      task: task.text,
      branch: wt.branch,
      rebaseAttempted: true,
      ...(merge.failureStage ? { stage: merge.failureStage } : {}),
    }))
    if (merge.rebased) quiet(() => events.append('merge-rebased', { task: task.text, branch: wt.branch }))
    if (!merge.merged) {
      if (merge.reason === 'paused') { pauseReady(); return 'stopped' }
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
      if (merge.reason === 'verification-infra') {
        return blockTask({ store, events }, task, 'verification-infra', 'verification-infra：rebase 後必要 CI 驗收無法執行，成果未合回')
      }
      if (merge.reason === 'review-unavailable') {
        return blockTask({ store, events }, task, 'review-unavailable', 'review-unavailable：rebase 後必要 Reviewer 無法完成，成果未合回')
      }
      if (merge.reason === 'release-approval') {
        return blockTask({ store, events }, task, 'release-approval', 'release-approval：發布核可缺失或與 rebase 後候選 commit 不符，成果未合回')
      }
      if (merge.reason === 'merge-queue-recovery') {
        return blockTask({ store, events }, task, 'merge-queue-recovery', 'merge-queue-recovery：持久化 merge queue 無法安全取得或復原，成果分支已保留')
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

    if (deps.evidence && merge.commitHash) {
      try {
        const receipt = deps.evidence.recordMerge({ executionId, taskId: task.id, mergedCommit: merge.commitHash })
        quiet(() => events.append('merge-evidence', { task: task.text, commit: merge.commitHash, path: receipt.path, hash: receipt.bundleHash }))
      } catch (err) {
        quiet(() => events.append('merge-evidence-failed', { task: task.text, commit: merge.commitHash, error: String(err) }))
        return blockTask({ store, events }, task, 'verification-infra', `evidence-chain：main 已快轉至 ${merge.commitHash}，但 merge receipt 寫入失敗；不得標記 DONE（${String(err)}）`)
      }
    }

    try {
      store.report(task.id, { kind: 'done', commitHash: merge.commitHash ?? res.commitHash ?? 'unknown' })
    } catch (err) {
      // Preserve the merged work and pause before another cycle can pick the unchecked row.
      if (!existsSync(cfg.stopFile)) writeFileSync(cfg.stopFile, `Task ${task.id} merged but backlog write failed; recover state before resuming.\n`, { flag: 'wx' })
      quiet(() => events.append('report-failed', {
        task: task.text, kind: 'done', error: String(err), willRepick: false
      }))
      return blockTask({ store, events }, task, 'verification-infra', '成果已合併但任務狀態寫入失敗，需先恢復狀態')
    }
    learningResult = { accepted: true, commit: merge.commitHash ?? res.commitHash }
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
  return resolveFailure(deps, task, 'failed', res.failureReason ?? '未知', failureClass, quotaUsage)
  } finally {
    if (finishLearning) quiet(() => finishLearning!({ ...learningResult, failure: learningResult.accepted ? undefined : db.lastFailureFor(task.id) ?? undefined }))
    if (claimHeartbeat) clearInterval(claimHeartbeat)
    releaseClaim()
  }
}

/** rebase 成功後仍在 merge queue 內驗收；只有非紅燈才允許唯一一次 merge 重試。 */
async function mergeAfterRebaseVerify(
  cfg: Config, wt: WorktreeHandle, task: Task, result: RunResult,
  verifier: Deps['verifier'], evidence: EvidenceStore | undefined, executionId: string, writerIdentity: string,
): Promise<MergeBackResult> {
  const timeouts = { gitTimeoutMs: cfg.gitTimeoutMs, worktreeAddTimeoutMs: cfg.worktreeAddTimeoutMs }
  const first = mergeBack(cfg.projectPath, wt.branch, wt.baseBranch, wt.baseHead, wt.cwd, {
    ...timeouts,
    deferAfterRebase: true,
  })
  if (!first.rebased || first.failureStage !== 'verify') {
    return first
  }

  const risk = classifyTaskRisk(cfg, task)
  if (verifier || evidence) {
    const baseCommitHash = defaultCommitHash(cfg.projectPath)
    const commitHash = defaultCommitHash(wt.cwd)
    if (!baseCommitHash || !commitHash) return { ...first, reason: 'verification-infra', failureStage: 'verify' }
    const gate = await runCandidateGate({
      cfg, task, cwd: wt.cwd, verifier, evidence, executionId, writerIdentity,
      result: { ...result, baseCommitHash, commitHash }, preserveOnReject: true,
    })
    if (!gate.pass) return { ...first, reason: gate.paused ? 'paused' : (gate.blockedReason ?? 'merge-conflict'), failureStage: 'verify' }
  } else {
    const verification = await runVerify({ command: cfg.verifyCommand, cwd: wt.cwd, timeoutMs: cfg.verifyTimeoutMs })
    if (verification.status === 'blocked' || (verification.status === 'skip' && verifyRequired(risk))) {
      return { ...first, reason: 'verification-infra', failureStage: 'verify' }
    }
    if (verification.status === 'fail') return { ...first, failureStage: 'verify' }
  }

  const merged = mergeBack(cfg.projectPath, wt.branch, wt.baseBranch, wt.baseHead, wt.cwd, {
    ...timeouts,
    allowRebase: false,
    rebaseAttempted: true,
  })
  return merged
}

/** 環境級 blocked：不計 maxAttempts；store.report 失敗只記事件。 */
function blockTask(
  { store, events }: Pick<Deps, 'store' | 'events'>,
  task: Task,
  reason: BlockedReason,
  humanReason: string, eventDetail?: string
): CycleResult {
  try {
    store.report(task.id, { kind: 'blocked', reason: humanReason })
  } catch (err) {
    quiet(() => events.append('report-failed', { task: task.text, kind: 'blocked', error: String(err), willRepick: true }))
  }
  quiet(() => events.append('task-blocked', { task: task.text, reason, ...(eventDetail ? { detail: eventDetail } : {}), ...(humanReason.includes('retried=1') ? { retried: 1 } : {}) }))
  return { kind: 'blocked', taskId: task.id, taskText: task.text, reason, ...(['dirty-worktree', 'completion-gate', 'verification-infra', 'review-unavailable', 'release-approval', 'ownership-drift', 'merge-queue-recovery', 'team-state-quarantined'].includes(reason) ? { alertDetail: humanReason } : {}) }
}

async function retryInfrastructure(deps: Deps, task: Task, retry: InfraRetryState, reason: InfrastructureRetryReason, detail: string): Promise<CycleResult> {
  if (retry.retried) return blockTask({ store: deps.store, events: deps.events }, task, reason, retriedBlockedReason(detail))
  quiet(() => deps.events.append('infra-retry', { task: task.text, reason, retried: 1 }))
  try { cleanupRetryWorktree(deps.cfg.projectPath, deps.cfg.worktreesDir, task.id, deps.cfg) } catch (err) { quiet(() => deps.events.append('infra-retry-cleanup-failed', { task: task.text, reason, error: String(err) })) }
  return runOnce(deps, { taskId: task.id, retried: true, source: reason })
}

/** 戰績隔離→輪替候選→preflight；全壞→preflight-failed；白名單外/單候選 resolve 拋→blocked。 */
export async function pickReadyTask(
  { cfg, store, db, events, engines, notify, team }: Pick<Deps, 'cfg' | 'store' | 'db' | 'events' | 'engines' | 'notify' | 'team'>,
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
  // 日額度守門：無法確認計數或已達上限時延後派工。
  const { dailyAttemptCaps, todayAttemptCounts } = loadDailyAttemptCapContext(cfg.engines, cfg.dataDir)
  for (const tag of dailyAttemptCaps.keys()) { try { if (team) todayAttemptCounts.set(tag, Math.max(todayAttemptCounts.get(tag) ?? 0, team.attemptsToday(tag))) } catch { todayAttemptCounts.set(tag, Infinity) } }
  const engineStats = loadEngineStatsForWeighting(db, events, cfg.dataDir, cfg.engineRotation)
  let supplyDeferred = false
  for (const cand of openTasks) {
    const deniedPin = deniedFreeOnlyPin(cand, cfg.tierMode)
    if (deniedPin) { const detail = `engine-not-allowed：tierMode=free-only，行內 [engine:${deniedPin}] 不在影子帳 free-tier 名單；不得降級或改派`; return blockTask({ store, events }, cand, 'engine-not-allowed', detail, detail) }
    const attempted = recentAttemptedEngineTags(db, cand.id, cfg.supplyRetryCooldownMs)
    if (!attempted) { supplyDeferred = true; quiet(() => events.appendOnce('task-deferred', { taskId: cand.id, task: cand.text, reason: 'engine-supply-history-unavailable', retryAfterMs: cfg.supplyRetryCooldownMs })); continue }
    const candidates = pickCandidateTags({ rotation: cfg.engineRotation, defaultEngine: cfg.defaultEngine, task: cand, failCount: db.failCount(cand.id), isolatedTags, subscriptionTags: subs, dailyAttemptCaps, todayAttemptCounts, engineStats, zeroCostTags: zeroCostTags(cfg), tierMode: cfg.tierMode })
    const tags = freeOnlyRetryCandidates(candidates, cfg.tierMode, attempted).filter(tag => !attempted.has(tag))
    if (tags.length === 0) {
      supplyDeferred = true
      quiet(() => events.appendOnce('task-deferred', { taskId: cand.id, task: cand.text, reason: 'engine-supply-exhausted', retryAfterMs: cfg.supplyRetryCooldownMs }))
      continue
    }
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
  return supplyDeferred ? 'deferred' : 'preflight-failed'
}
/** 供應失敗保留 open；只有任務／驗收失敗達 maxAttempts 才 blocked。 */
async function resolveFailure(
  deps: Pick<Deps, 'cfg' | 'store' | 'db' | 'events' | 'taskTerminalNotify'>,
  task: Task,
  base: 'failed' | 'engine-error',
  lastFailure: string,
  failureClass: Extract<AttemptFailureClass, 'task' | 'supply'>,
  quotaUsage: Pick<TaskTerminalNotice, 'costUsd' | 'tokensIn' | 'tokensOut' | 'tokensCached'>
): Promise<CycleResult> {
  const { cfg, store, db, events } = deps
  if (failureClass === 'supply') {
    const attempted = recentAttemptedEngineTags(db, task.id, cfg.supplyRetryCooldownMs)
    if (!attempted) return 'deferred'
    if (cfg.tierMode === 'free-only' && freeOnlyListExhausted(cfg, task, subscriptionTags(cfg), attempted)) {
      quiet(() => events.append('task-deferred', { taskId: task.id, task: task.text, reason: 'engine-supply-exhausted', retryAfterMs: cfg.supplyRetryCooldownMs }))
      return 'deferred'
    }
    return base
  }
  const failures = db.taskFailCount(task.id)
  const split = await tryFreeOnlySplit({ cfg, store, task, failures, failure: lastFailure })
  if (split.kind === 'split') {
    quiet(() => events.append('free-only-task-split', { taskId: task.id, pieces: split.pieces }))
    return base
  }
  if (split.kind === 'blocked') {
    const result = blockTask({ store, events }, task, 'max-attempts', `free-only 拆解失敗，已 blocked（${split.detail}）`)
    await notifyTaskTerminal(deps, { outcome: 'failed', taskId: task.id, taskText: task.text, resultSummary: lastFailure, attempts: failures, ...quotaUsage })
    return result
  }
  const maxAttempts = freeOnlyAttemptLimit(cfg); if (failures < maxAttempts) return base
  const hint = lastFailure.replace(/\s+/g, ' ').trim().slice(0, 80) || '未知'
  const result = blockTask({ store, events }, task, 'max-attempts', `任務驗收連敗 ${maxAttempts} 次，人工介入（最後失敗：${hint}）`)
  await notifyTaskTerminal(deps, {
    outcome: 'failed', taskId: task.id, taskText: task.text,
    resultSummary: lastFailure, attempts: maxAttempts, ...quotaUsage,
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
  if (!(typeof result === 'object' || result === 'done' || result === 'failed' || result === 'engine-error' || result === 'deferred')) return
  try {
    const day = localDay(now.toISOString(), deps.cfg.timezoneOffsetHours)
    writeHeartbeat(deps.events, deps.cfg, { state: 'idle', todayCostUsd: deps.db.billedCostForLocalDay(day, deps.cfg.timezoneOffsetHours, subscriptionTags(deps.cfg)) })
  } catch { /* 觀測面故障不可反殺 CLI（鐵律 #4） */ }
}

function recentAttemptedEngineTags(db: Pick<RunDb, 'attemptedEngineTags'>, taskId: string, cooldownMs: number): Set<string> | undefined {
  try { return typeof db.attemptedEngineTags === 'function' ? new Set(db.attemptedEngineTags(taskId, new Date(Date.now() - cooldownMs).toISOString())) : new Set() } catch { return undefined }
}
