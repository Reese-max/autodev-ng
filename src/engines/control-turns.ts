import { existsSync } from 'node:fs'
import type { Deps } from '../scheduler.js'
import type { Engine, Job, RunResult } from '../types.js'
import { localDay } from '../db.js'
import { globalBilledToday } from '../globalcost.js'
import { updateActiveExecutionPhase } from './active-execution.js'
import { nudgeNoCommit } from './no-commit-nudge.js'
import { subscriptionTags } from './pick-ready-task.js'
import { observeRun } from './run-control.js'
import { ControlStore, deliverControlQueue } from './steering.js'

/** One attempt, several invocations: preserve per-call charges and re-admit operator turns. */
export async function runControlTurns(engine: Engine, job: Job, initial: RunResult, opts: {
  deps: Deps; engineTag: string; baseCommit: string; store?: ControlStore; claimToken?: string
}): Promise<{ result: RunResult; costUsd: number; costEstimated: boolean }> {
  const { cfg, db, team } = opts.deps, ec = cfg.engines[opts.engineTag]!
  let costUsd = 0, costEstimated = false, calls = 0, workerUnconfirmed = false
  const charge = (r?: RunResult) => {
    const estimated = !r || (!r.ok && r.costUnknown === true)
    costUsd += ec.costPerRunUsd ?? (estimated ? cfg.failureCostEstimateUsd : r!.costUsd)
    costEstimated ||= ec.costPerRunUsd === undefined && estimated
  }
  charge(initial)
  const runner: Engine = {
    id: engine.id, preflight: () => engine.preflight(),
    run: async turn => {
      calls++
      workerUnconfirmed = false
      updateActiveExecutionPhase(cfg.dataDir, job.executionId!, 'engine-run')
      try {
        const r = await engine.run({ ...turn, control: { ...turn.control, onEvent: event => {
          if (event.type === 'spawn') workerUnconfirmed = true
          if (event.type === 'exit' && event.reason === 'exit') workerUnconfirmed = false
          observeRun(turn.control, event)
        } } })
        charge(r); workerUnconfirmed = false; return r
      }
      catch (err) { charge(); throw err }
      finally { updateActiveExecutionPhase(cfg.dataDir, job.executionId!, 'queue-boundary') }
    },
  }
  const paused = () => workerUnconfirmed || existsSync(cfg.stopFile) || !!job.control?.signal?.aborted
  const admit = () => {
    try {
      const spent = db.billedCostForLocalDay(localDay(new Date().toISOString(), cfg.timezoneOffsetHours), cfg.timezoneOffsetHours, subscriptionTags(cfg))
      const running = ec.subscription ? 0 : costUsd, next = ec.subscription ? 0 : ec.costPerRunUsd ?? cfg.failureCostEstimateUsd
      if (cfg.dailyHardUsd > 0 && (spent + running >= cfg.dailyHardUsd || spent + running + next > cfg.dailyHardUsd)) return false
      if (cfg.globalDailyHardUsd !== undefined) {
        if (!opts.deps.cfgPath) return false
        const global = globalBilledToday(opts.deps.cfgPath, new Date().toISOString()) + running
        if (global >= cfg.globalDailyHardUsd || global + next > cfg.globalDailyHardUsd) return false
      }
      if (team) return !!opts.claimToken && team.admitControlTurn({ executionId: job.executionId!, token: opts.claimToken,
        spentUsd: spent, reservedCostUsd: running + next, dailyHardUsd: cfg.dailyHardUsd, dailyAttemptCap: ec.dailyAttemptCap })
      // Without atomic team authority a capped adapter cannot admit another invocation.
      return ec.dailyAttemptCap === undefined
    } catch { return false }
  }
  const drain = (result: RunResult) => opts.store ? deliverControlQueue(runner, job, result, {
    store: opts.store, events: opts.deps.events, paused, admit, unconfirmed: () => workerUnconfirmed,
  }) : Promise.resolve(result)
  let result: RunResult = { ...initial, baseCommitHash: initial.baseCommitHash ?? opts.baseCommit }
  try {
    updateActiveExecutionPhase(cfg.dataDir, job.executionId!, 'queue-boundary')
    result = await drain(result)
    if (calls === 0 && !paused()) {
      result = await nudgeNoCommit(runner, job, result, opts.baseCommit)
      result = await drain(result)
    }
  } catch (err) {
    result = { ...result, ok: false, recoveryRequired: true, failureReason: `control delivery state unavailable: ${String(err)}` }
  }
  if (workerUnconfirmed) result = { ...result, ok: false, recoveryRequired: true, failureReason: 'follow-up transport lost before verified exit' }
  return { result, costUsd, costEstimated }
}
