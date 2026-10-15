/**
 * run 清單與跨 run 量測彙總（issue #55：pilot metrics 供與既有 runner A/B 比較）。
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { checkLockOwner } from '../lock.js'
import { readRunState, runDir, runStateDirs } from './store.js'
import type { RunState, RunStatusSnapshot } from './types.js'

export function snapshotOf(state: RunState, driverAlive: boolean): RunStatusSnapshot {
  return {
    runId: state.runId,
    backend: state.backend,
    phase: state.phase,
    detail: state.phaseDetail,
    rounds: state.rounds,
    maxRounds: state.maxRounds,
    verifiedSteps: state.verifiedSteps.length,
    rejectedAttempts: state.metrics.rejectedAttempts,
    ...(state.pendingApproval
      ? { pendingApproval: { step: state.pendingApproval.step.text, reason: state.pendingApproval.reason, approved: !!state.pendingApproval.approved } }
      : {}),
    driverAlive,
    updatedAt: state.updatedAt,
  }
}

export function driverAlive(dir: string): boolean {
  return existsSync(join(dir, 'drive.lock')) && checkLockOwner(join(dir, 'drive.lock')) === 'alive'
}

export function listRuns(dataDir: string): RunStatusSnapshot[] {
  return runStateDirs(dataDir).flatMap(runId => {
    try {
      const dir = runDir(dataDir, runId)
      return [snapshotOf(readRunState(dataDir, runId), driverAlive(dir))]
    } catch { return [] }
  })
}

export interface BackendMetricsSummary {
  backend: string
  runs: number
  completed: number
  completionRate: number
  averageRounds: number
  verifiedSteps: number
  rejectedAttempts: number
  auditorRejectionRate: number
  falseCompletionClaims: number
  /** 有 ≥1 個重複失敗指紋的 run 佔比。 */
  repeatedFailureRate: number
  resumes: number
  recoverySuccesses: number
  recoverySuccessRate: number
  interventions: number
  /** 每 run 平均人工介入次數（pause/abort/approve）。 */
  manualInterventionRate: number
  tokensIn: number
  tokensOut: number
  costUsd: number
  wallClockMs: number
  activeMs: number
  blockedMs: number
}

/** Pilot 量測彙總（issue §量測）：跨 run 聚合，供與既有 runner 做 A/B 比較。 */
export function summarizeRuns(dataDir: string): BackendMetricsSummary {
  const states: RunState[] = runStateDirs(dataDir).flatMap(runId => {
    try { return [readRunState(dataDir, runId)] } catch { return [] }
  })
  const sum = (f: (s: RunState) => number) => states.reduce((acc, s) => acc + f(s), 0)
  const runs = states.length
  const completed = states.filter(s => s.phase === 'complete').length
  const verifiedSteps = sum(s => s.metrics.verifiedSteps)
  const rejectedAttempts = sum(s => s.metrics.rejectedAttempts)
  const resumes = sum(s => s.metrics.resumes)
  const recoverySuccesses = sum(s => s.metrics.recoverySuccesses)
  const interventions = sum(s => s.metrics.interventions)
  const repeated = states.filter(s => Object.values(s.failures).some(f => f.count >= 2)).length
  const wallClockMs = sum(s => s.metrics.activeMs + s.metrics.blockedMs
    + (s.metrics.parkedAt ? Math.max(0, Date.now() - Date.parse(s.metrics.parkedAt)) : 0))
  return {
    backend: 'long-horizon',
    runs,
    completed,
    completionRate: runs ? completed / runs : 0,
    averageRounds: runs ? sum(s => s.rounds) / runs : 0,
    verifiedSteps,
    rejectedAttempts,
    auditorRejectionRate: verifiedSteps + rejectedAttempts ? rejectedAttempts / (verifiedSteps + rejectedAttempts) : 0,
    falseCompletionClaims: sum(s => s.metrics.falseCompletionClaims),
    repeatedFailureRate: runs ? repeated / runs : 0,
    resumes,
    recoverySuccesses,
    recoverySuccessRate: resumes ? recoverySuccesses / resumes : 0,
    interventions,
    manualInterventionRate: runs ? interventions / runs : 0,
    tokensIn: sum(s => s.metrics.tokensIn),
    tokensOut: sum(s => s.metrics.tokensOut),
    costUsd: sum(s => s.metrics.costUsd),
    wallClockMs,
    activeMs: sum(s => s.metrics.activeMs),
    blockedMs: sum(s => s.metrics.blockedMs),
  }
}
