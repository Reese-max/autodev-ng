import type { Deps, CycleResult, BlockedReason } from '../scheduler.js'
import type { Config, Engine, Task } from '../types.js'
import type { RunDb } from '../db.js'
import { quiet } from '../events.js'
import { alternativeRetryUsed, taskAttemptLimit } from './alternative-retry.js'
import { freeOnlyRetryCandidates } from './free-only-retry.js'
import { assertFreeWorker } from './free-model-policy.js'
import { loadIsolatedTagsForPick } from './apply-stats-isolation.js'
import { loadDailyAttemptCapContext } from './daily-attempt-cap-gate.js'
import { loadEngineStatsForWeighting } from './adaptive-rotation.js'
import { deniedFreeOnlyPin, pickCandidateTags } from './pick-candidates.js'
import { singleFlightPickRouting } from './pick-ready-single-flight.js'

/** 環境級 blocked：不計 maxAttempts；store.report 失敗只記事件。 */
export function blockTask(
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
    if (cfg.alternativeRetry && (db.taskFailCount(cand.id) >= taskAttemptLimit(cfg) || alternativeRetryUsed(cfg, cand.id))) return blockTask({ store, events }, cand, 'max-attempts', '替代方案額度已用完，保留失敗紀錄等待人工介入')
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
        if (cfg.tierMode === 'free-only') assertFreeWorker(engineCfg, cfg.llmTransport)
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
/** 訂閱制引擎 tag 清單（邊際成本≈0，不踩日頂）。 */
export function subscriptionTags(cfg: Config): string[] {
  return Object.entries(cfg.engines ?? {}).filter(([, e]) => e.subscription).map(([t]) => t)
}

/** 免費起跑用：零邊際成本引擎（subscription 且 costPerRunUsd===0，即 devin、oc 系、agy 層；
 * codex 系記固定成本 1 反映 ChatGPT 額度機會成本，故排除）。 */
export function zeroCostTags(cfg: Config): Set<string> {
  return new Set(Object.entries(cfg.engines ?? {}).filter(([, e]) => e.subscription && (e.costPerRunUsd ?? 0) === 0).map(([t]) => t))
}

export function recentAttemptedEngineTags(db: Pick<RunDb, 'attemptedEngineTags'>, taskId: string, cooldownMs: number): Set<string> | undefined {
  try { return typeof db.attemptedEngineTags === 'function' ? new Set(db.attemptedEngineTags(taskId, new Date(Date.now() - cooldownMs).toISOString())) : new Set() } catch { return undefined }
}
