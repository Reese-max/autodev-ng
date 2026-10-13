import { existsSync } from 'node:fs'
import type { Deps } from '../scheduler.js'
import type { Engine, Job, RunResult } from '../types.js'
import { localDay } from '../db.js'
import { quiet } from '../events.js'
import { globalBilledToday, extraBillingScopes } from '../globalcost.js'
import { combineRuns } from './no-commit-nudge.js'
import { subscriptionTags } from './pick-ready-task.js'
import { ControlStore } from './steering.js'

/** Govern saved controls at each scheduler cycle without authorizing a dispatch. */
export function createControls(deps: Deps): ControlStore {
  const controls = new ControlStore(deps.cfg.dataDir, deps.events)
  try { controls.sweep() } catch { /* Subsequent exact-target admission remains fail closed. */ }
  return controls
}

const MAX_CONTROL_TURNS = 4
/** The fixed one-time nudge uses the same admission and charge lineage as QUEUE. */
export function additionalTurnHooks(deps: Deps, engine: Engine, job: Job, result: () => RunResult, isDegraded: () => boolean, engineTag: string, fixedCost: number | undefined, costState: { dispatchedTurns: number }) {
  return {
    beforeRun: () => additionalTurnAdmission(deps, engine, job, result(), isDegraded, engineTag, fixedCost, costState),
    onDispatch: () => { deps.onWorkerStart?.(job.task.id); costState.dispatchedTurns++ },
  }
}

export async function additionalTurnAdmission(deps: Deps, engine: Engine, job: Job, res: RunResult, isDegraded: () => boolean, engineTag: string, fixedCost: number | undefined, costState: { dispatchedTurns: number }): Promise<boolean> {
  let readiness
  try { readiness = await engine.preflight() } catch { return false }
  if (!readiness.ok || !res.ok && !res.failureReason?.startsWith('no-commit') || res.cancelled || res.recoveryRequired || job.control?.signal?.aborted || existsSync(deps.cfg.stopFile) || isDegraded()) return false
  const engineConfig = deps.cfg.engines[engineTag]
  // A queued turn is another dispatch. Team reservations and daily-attempt
  // receipts currently cover one dispatch only; retain the queue until a
  // separate reservation/attempt contract can authorize an additional turn.
  if (deps.team || engineConfig?.dailyAttemptCap !== undefined) {
    quiet(() => deps.events.append('control-admission-blocked', { executionId: job.executionId, reason: 'additional-dispatch-authority-unverified' }))
    return false
  }
  const subscription = engineConfig?.subscription === true
  if (!subscription && fixedCost === undefined && res.costUnknown === true) {
    quiet(() => deps.events.append('control-admission-blocked', { executionId: job.executionId, reason: 'in-flight-cost-unknown' }))
    return false
  }
  // The current execution has not reached the ledger. Include every already
  // dispatched fixed-cost turn, and reserve the next known fixed charge.
  const inFlightCost = subscription ? 0 : fixedCost === undefined ? res.costUsd : fixedCost * costState.dispatchedTurns
  const nextCharge = subscription ? 0 : fixedCost ?? 0
  const localSpent = deps.db.billedCostForLocalDay(localDay(new Date().toISOString(), deps.cfg.timezoneOffsetHours), deps.cfg.timezoneOffsetHours, subscriptionTags(deps.cfg)) + inFlightCost
  if (deps.cfg.dailyHardUsd > 0 && (localSpent >= deps.cfg.dailyHardUsd || localSpent + nextCharge > deps.cfg.dailyHardUsd)) return false
  if (deps.cfg.globalDailyHardUsd !== undefined) {
    if (!deps.cfgPath) return false
    try {
      const extra = typeof deps.billingScopes === 'function' ? deps.billingScopes()
        : deps.billingScopes ?? extraBillingScopes(deps.cfg, deps.billingScopeDirs)
      const globalSpent = globalBilledToday(deps.cfgPath, new Date().toISOString(), extra, deps.billingSourceHash) + inFlightCost
      if (globalSpent >= deps.cfg.globalDailyHardUsd || globalSpent + nextCharge > deps.cfg.globalDailyHardUsd) return false
    } catch {
      quiet(() => deps.events.append('control-admission-blocked', { executionId: job.executionId, reason: 'global-accounting-incomplete' }))
      return false
    }
  }
  return true
}

export async function deliverQueuedControls(deps: Deps, engine: Engine, job: Job, initial: RunResult, controls: ControlStore, isDegraded: () => boolean, engineTag: string, fixedCost: number | undefined, costState: { dispatchedTurns: number }): Promise<RunResult> {
  let res = initial
  for (let turn = 0; turn < MAX_CONTROL_TURNS; turn++) {
    if (!res.ok || res.cancelled || res.recoveryRequired || isDegraded() || job.control?.signal?.aborted || existsSync(deps.cfg.stopFile)) break
    const batch = controls.peekQueue(job.executionId ?? '')
    if (batch.length === 0) break
    if (!await additionalTurnAdmission(deps, engine, job, res, isDegraded, engineTag, fixedCost, costState)) break
    // Preflight can yield long enough for a control to expire or be resolved.
    // Read the same execution's current pending FIFO again at dispatch time.
    const currentBatch = controls.peekQueue(job.executionId ?? '')
    if (currentBatch.length === 0) break
    const directive = `${job.directive ?? job.task.text}\n\n[操作員於本次執行追加 ${currentBatch.length} 則指示，請依序納入當前工作]\n${currentBatch.map((e, i) => `${i + 1}. ${e.instruction}`).join('\n')}`
    try { deps.onWorkerStart?.(job.task.id) } catch { return res }
    costState.dispatchedTurns++
    try { res = combineRuns(res, await engine.run({ ...job, directive })) }
    catch (err) {
      // Retain charges/output from every earlier successful queued turn.
      return combineRuns(res, { ok: false, output: `[control-turn error] ${String(err)}`, costUsd: 0, costUnknown: true, failureReason: `control-turn：${String(err)}` })
    }
    const delivered = controls.markDelivered(currentBatch)
    quiet(() => deps.events.append('control-delivered', { executionId: job.executionId, taskId: job.task.id, count: delivered }))
  }
  return res
}

