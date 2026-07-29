import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import type { Config } from '../types.js'
import { quiet, type EventLog } from '../events.js'
import { localDay } from '../db.js'
import type { Deps } from '../scheduler.js'
import { subscriptionTags } from '../scheduler.js'
import { globalBilledToday } from '../globalcost.js'
import { ProblemsLedger, problemFingerprint, readHandledProblemTitles } from './ledger.js'
import { discoverProblems, type DiscoverResult, type RankedProblem } from './discover.js'
import { parseGoal } from './goal.js'
import { callAgent } from './llm.js'
import { authorGoal, isAutoGoal, loadPerpetualState, savePerpetualState } from './author.js'
import { gateAuthoredGoal, type GoalQualityGateResult } from './goal-quality-gate.js'
import { runGoalWithDeps, type SessionResult } from './session.js'
import { collectSurvey, hasSurveySources } from './survey-sources.js'
import { readRecentGoalRoiSummary, settleProblemRoi } from './roi.js'

/** 外環主邏輯（M10.0 perpetual engineer）。fail-open 是治理鐵律（#4）：本函式由 daemon
 * idle loop 呼叫，任何 throw 都不得逸出——整體包 try/catch，異常記 perpetual-error 回 false。 */

const DEFAULT_COOLDOWN_MS = 6 * 60 * 60 * 1000 // 6h（Task 5 schema 上線後由 cfg 覆寫）
const DEFAULT_VALUE_THRESHOLD = 6

/** Task 5 的 ConfigSchema 會補上這三欄；在那之前以交集型別讀取，缺省時走預設。 */
export type PerpetualConfig = Config & {
  perpetual?: boolean
  perpetualCooldownMs?: number
  perpetualValueThreshold?: number
}

export interface PerpetualHooks {
  now(): Date
  discover(): Promise<DiscoverResult | undefined>
  author(problem: RankedProblem, fingerprint: string): Promise<string | null>
  gateAuthoredGoal(md: string): Promise<GoalQualityGateResult>
  runSession(opts: { discovered?: DiscoverResult }): Promise<SessionResult | 'no-goal' | 'lock-busy'>
  billedToday(): number
}

// goalId 慣例：sha1(objective) 前 4 hex（與 session.ts/runGoalWithDeps 完全一致）。
function goalIdOf(objective: string): string {
  return createHash('sha1').update(objective).digest('hex').slice(0, 4)
}

// 自動立案標記行：`<!-- adng:auto-goal problem:<fp> -->`，抽指紋供收案回寫。
function fingerprintFromMarker(md: string): string {
  return md.match(/adng:auto-goal\s+problem:([0-9a-f]+)/)?.[1] ?? ''
}

export async function runPerpetualCycle(
  cfg: PerpetualConfig, dataDir: string, events: EventLog,
  notify: (t: string) => Promise<boolean>, hooks: PerpetualHooks
): Promise<boolean> {
  let ledger: ProblemsLedger | undefined
  // 終審 finding 2：宣告在 try 外，讓 catch 也摸得到——state 載入後任何 throw（discover/
  // ledger 開檔/runSession…）都要落地武裝冷卻，否則 daemon 下一 idle tick 立刻重跑燒錢迴圈。
  let state: ReturnType<typeof loadPerpetualState> | undefined
  try {
    // ── 前置閘（依序；任一擋下皆安靜讓路：不寫狀態、不發事件、不呼叫 discover）──
    // 移進 try（finding 3）：billedToday() 等 hook 若 throw，須落在下面的 catch → perpetual-error，
    // 不得逸出 runPerpetualCycle（鐵律 #4）。閘門順序與安靜讓路行為不變。
    if (cfg.perpetual !== true) return false
    if (existsSync(cfg.stopFile)) return false
    if (cfg.dailyHardUsd > 0 && hooks.billedToday() >= cfg.dailyHardUsd) return false

    const cooldownDefault = cfg.perpetualCooldownMs ?? DEFAULT_COOLDOWN_MS
    const threshold = cfg.perpetualValueThreshold ?? DEFAULT_VALUE_THRESHOLD
    state = loadPerpetualState(dataDir, cooldownDefault)
    const now = hooks.now()
    if (state.lastSessionTs && now.getTime() - Date.parse(state.lastSessionTs) < state.currentCooldownMs) return false

    ledger = new ProblemsLedger(join(dataDir, 'run.db'))
    return await runBody(cfg, dataDir, events, notify, hooks, state, now, threshold, ledger)
  } catch (e) {
    quiet(() => events.append('perpetual-error', { error: String(e) }))
    // 終審 finding 2 belt：state 已載入代表閘門都通過了（非安靜讓路），這次 throw 真的
    // 消耗了一次嘗試——best-effort 補武裝，蓋掉 discover-throw／ledger-open-throw／
    // runSession-throw 等所有下游意外，不再依賴 runBody 內每個分支各自記帳。
    if (state) {
      try { state.lastSessionTs = hooks.now().toISOString(); savePerpetualState(dataDir, state) } catch { /* fail-open：補武裝失敗不反殺 */ }
    }
    return false
  } finally {
    try { ledger?.close() } catch { /* fail-open：關閉失敗不反殺 */ }
  }
}

async function runBody(
  cfg: PerpetualConfig, dataDir: string, events: EventLog,
  notify: (t: string) => Promise<boolean>, hooks: PerpetualHooks,
  state: ReturnType<typeof loadPerpetualState>, now: Date, threshold: number, ledger: ProblemsLedger
): Promise<boolean> {
  const goalFile = cfg.goalFile

  // ── 既有 GOAL：手動 or auto-goal 殘留 ──
  if (goalFile && existsSync(goalFile)) {
    const content = readFileSync(goalFile, 'utf8')
    if (!isAutoGoal(content)) {
      // 手動 GOAL：跑一次，記錄 manualGoalDone 防重跑；絕不代刪。
      const goalId = goalIdOf(parseGoal(content).objective)
      if (goalId === state.manualGoalDone) {
        // 已跑過同一份：無聲空轉會讓整台停擺無人知（2026-07-24 實證）——appendOnce 24h 提醒一次
        if (events.appendOnce('manual-goal-idle', { goalId })) {
          await notify(`自主工程師：手動 GOAL ${goalId} 已完成但 GOAL.md 仍佔位——請派下一棒，或移除 GOAL.md 讓 auto-goal 接手`)
        }
        return false
      }
      const result = await hooks.runSession({})
      if (typeof result !== 'object') return false // lock-busy / no-goal：沒真的跑，不記狀態
      // killed＝外力中斷（stopFile/config-gone/daemon 輪替），不消耗一次性執行權也不寫冷卻
      // 時間戳——重啟後立即重新拾取（2026-07-19 實證：兩個手動 GOAL 被 daemon 輪替燒掉）。
      if (result.outcome.kind !== 'killed') {
        state.manualGoalDone = goalId
        state.lastSessionTs = now.toISOString()
        savePerpetualState(dataDir, state)
      }
      await notify(`自主工程師：手動 GOAL ${goalId} → ${result.outcome.kind}（${result.outcome.rounds} 輪）`)
      return true
    }
    // auto-goal 殘留（前次 crash）：直接續跑，收案照 closeout。goalId 由 GOAL 內容 objective
    // 雜湊得出（與 session 內部算法一致），不取 result.goalId——回寫的 goalId 須與台帳一致。
    const fp = fingerprintFromMarker(content)
    const objective = parseGoal(content).objective
    const startedAt = ledger.get(fp)?.startedAt ?? hooks.now().toISOString()
    ledger.setRoi(fp, { startedAt })
    const result = await hooks.runSession({})
    return closeout(cfg, dataDir, events, notify, ledger, state, now, fp, objective.slice(0, 40),
      goalIdOf(objective), result, startedAt, hooks.now().toISOString())
  }

  // ── 無 GOAL：discover → 立案 ──
  const discovered = await hooks.discover()
  if (!discovered || discovered.ranked.length === 0) {
    quiet(() => events.append('perpetual-no-case', { reason: 'discover-empty' }))
    state.consecutiveEmpty++
    state.lastSessionTs = now.toISOString()
    savePerpetualState(dataDir, state)
    return false
  }

  const nowIso = now.toISOString()
  const byFp = new Map<string, RankedProblem>()
  for (const p of discovered.ranked) {
    ledger.upsertSeen({ title: p.title, lens: p.lens, value: p.value }, nowIso)
    byFp.set(problemFingerprint(p.title), p)
  }

  // 候選：ledger status=open 且 value≥門檻，按 value DESC 取前 3（listByStatus 已排序）。
  const open = ledger.listByStatus('open')
  const candidates = (ledger.isOperational()
    ? open
    : discovered.ranked.map(p => ({ ...p, fingerprint: problemFingerprint(p.title) })))
    .filter(r => r.value >= threshold).slice(0, 3)

  let authored: { md: string; fp: string; title: string } | undefined
  const qualityRejected = new Set<string>()
  for (const row of candidates) {
    const problem: RankedProblem = {
      title: row.title, lens: row.lens, value: row.value,
      rationale: byFp.get(row.fingerprint)?.rationale ?? ''
    }
    // 逐案自我隔離：單一候選 author throw 不得中斷其餘候選（fail-open per-attempt）。
    let md: string | null = null
    try { md = await hooks.author(problem, row.fingerprint) } catch { md = null }
    if (!md) continue
    let gate: GoalQualityGateResult
    try {
      gate = await hooks.gateAuthoredGoal(md)
    } catch (error) {
      gate = { ok: false, reason: `verify-unverifiable: gate ${String(error).slice(0, 240)}` }
    }
    if (!gate.ok) {
      qualityRejected.add(row.fingerprint)
      ledger.setStatus(row.fingerprint, 'deferred', `goal-quality-reject:${gate.reason}`)
      quiet(() => events.append('perpetual-goal-rejected', { fingerprint: row.fingerprint, title: row.title, reason: gate.reason }))
      continue
    }
    authored = { md, fp: row.fingerprint, title: row.title }
    break
  }

  if (!authored) {
    for (const row of candidates) {
      if (!qualityRejected.has(row.fingerprint)) ledger.setStatus(row.fingerprint, 'deferred', 'goal-authoring-failed')
    }
    // finding 2：candidates 空（全部 value<門檻，author 從未被呼叫）與「author 全試過但皆回 null」
    // 是不同原因，拆開回報。finding 1：兩者都真的呼叫過 hooks.discover()，須武裝冷卻（同 discover-empty
    // 分支慣例），否則 daemon 下一個 idle tick 立刻重跑 discover（LLM 呼叫）直到燒穿當日額度。
    const reason = candidates.length === 0 ? 'below-threshold' : qualityRejected.size ? 'goal-quality-rejected' : 'goal-authoring-failed'
    quiet(() => events.append('perpetual-no-case', { reason }))
    state.consecutiveEmpty++
    state.lastSessionTs = now.toISOString()
    savePerpetualState(dataDir, state)
    return false
  }

  // 成案：tmp+rename 原子寫 GOAL；ledger in-progress；發 authored 事件。
  const goalId = goalIdOf(parseGoal(authored.md).objective)
  const tmp = `${goalFile}.tmp`
  writeFileSync(tmp, authored.md)
  renameSync(tmp, goalFile!)
  ledger.setStatus(authored.fp, 'in-progress', '', goalId)
  quiet(() => events.append('perpetual-goal-authored', { fingerprint: authored.fp, goalId, title: authored.title }))
  const startedAt = hooks.now().toISOString()
  ledger.setRoi(authored.fp, { startedAt })

  // 終審 finding 2/g：runSession 前先武裝冷卻——涵蓋 session throw（外層 catch 也會補，
  // 這裡是主線）與 session 回 'lock-busy'/'no-goal'（closeout 對非 object result 直接回 false
  // 不回寫，若不在此先武裝，下一 idle tick 會對同一份剛落地的 GOAL 立刻重跑）。之後 closeout
  // 成功收案還會再 save 一次刷新 lastSessionTs——雙重寫入正確（跑完那段時間也該算數）。
  state.lastSessionTs = hooks.now().toISOString()
  savePerpetualState(dataDir, state)

  const result = await hooks.runSession({ discovered })
  return closeout(cfg, dataDir, events, notify, ledger, state, now, authored.fp, authored.title, goalId,
    result, startedAt, hooks.now().toISOString())
}

// 收案回寫（step 6）：achieved→fixed，其餘→deferred；僅 isAutoGoal 才刪 GOAL；更新狀態＋通知。
async function closeout(
  cfg: PerpetualConfig, dataDir: string, events: EventLog,
  notify: (t: string) => Promise<boolean>, ledger: ProblemsLedger,
  state: ReturnType<typeof loadPerpetualState>, now: Date,
  fp: string, title: string, goalId: string, result: SessionResult | 'no-goal' | 'lock-busy',
  startedAt: string, endedAt: string
): Promise<boolean> {
  if (typeof result !== 'object') return false // 沒真的跑（lock-busy/no-goal）：不回寫、不刪、留待下輪

  const { outcome } = result
  const done = outcome.kind === 'achieved'
  if (done) {
    const gaps = result.supplement?.residualGaps?.length ?? 0
    ledger.setStatus(fp, 'fixed', `rounds:${outcome.rounds}｜殘餘gaps:${gaps}`, goalId)
  } else {
    const reason = outcome.kind === 'stuck' ? outcome.reason : ''
    ledger.setStatus(fp, 'deferred', `${outcome.kind} ${reason}`.trim(), goalId)
  }
  if (outcome.kind !== 'killed') {
    settleProblemRoi({
      ledger, events, dbFile: join(dataDir, 'run.db'), backlogFile: cfg.backlogFile,
      fingerprint: fp, goalId, result: outcome.kind, startedAt, endedAt
    })
  }

  // 刪 GOAL 前重讀檔內容確認仍是 auto-goal（鐵律：絕不誤刪手動 GOAL）。
  try {
    if (cfg.goalFile && existsSync(cfg.goalFile) && isAutoGoal(readFileSync(cfg.goalFile, 'utf8'))) {
      rmSync(cfg.goalFile, { force: true })
    }
  } catch { /* fail-open：刪檔失敗留檔即可 */ }

  state.lastSessionTs = now.toISOString()
  state.consecutiveEmpty = 0
  savePerpetualState(dataDir, state)
  quiet(() => events.append('perpetual-session-done', { fingerprint: fp, goalId, kind: outcome.kind, rounds: outcome.rounds }))
  await notify(`自主工程師：${title} → ${done ? 'fixed' : 'deferred'}（${outcome.rounds} 輪）`)
  return true
}

/** digest 一行摘要：開唯讀 ledger 取 counts。任何故障回 null（fail-open）。 */
export function perpetualDigestLine(dataDir: string): string | null {
  let ledger: ProblemsLedger | undefined
  try {
    ledger = new ProblemsLedger(join(dataDir, 'run.db'))
    const c = ledger.counts()
    const open = c.open ?? 0, fixed = c.fixed ?? 0, deferred = c.deferred ?? 0
    // 終審 finding 1：零活動（空台帳／全 0）＝整段省略，不是印「0｜0｜0」的噪音行（spec §3.7）。
    if (open === 0 && fixed === 0 && deferred === 0) return null
    return `自主工程師台帳：open ${open}｜fixed ${fixed}｜deferred ${deferred}`
  } catch {
    return null
  } finally {
    try { ledger?.close() } catch { /* fail-open */ }
  }
}

/** 生產薄殼：綁真實 hooks 後呼叫 runPerpetualCycle。單元測試涵蓋 runPerpetualCycle 本體，
 * 本殼的綁定於 Task 5 daemon 測試中演練。author 綁 judgeModel（生成用途，無獨立性顧慮，
 * 異於 discover 的 critic 用 auditModel??judgeModel）。 */
export async function maybeRunPerpetual(
  deps: Deps, notifier: { send(t: string): Promise<boolean> }
): Promise<boolean> {
  const cfg = deps.cfg as PerpetualConfig
  const offset = cfg.timezoneOffsetHours
  const judgeLlm = { url: cfg.judgeUrl, model: cfg.judgeModel, apiKey: cfg.judgeApiKey }

  const hooks: PerpetualHooks = {
    now: () => new Date(),
    discover: async () => {
      if (!cfg.surveyCommand && !hasSurveySources(cfg.dataDir)) return undefined
      return discoverProblems({
        finderLlm: judgeLlm,
        criticLlm: { url: cfg.judgeUrl, model: cfg.auditModel ?? cfg.judgeModel, apiKey: cfg.judgeApiKey },
        runSurvey: (_c, wd) => ({ output: collectSurvey(cfg, wd) }),
        readRoiSummary: () => readRecentGoalRoiSummary(join(cfg.dataDir, 'run.db')),
        readHandledTitles: () => readHandledProblemTitles(join(cfg.dataDir, 'run.db')),
        lenses: cfg.discoverLenses
      }, { objective: '', noProgressLimit: 2 }, cfg.projectPath)
    },
    author: (problem, fingerprint) =>
      authorGoal((prompt: string) => callAgent(judgeLlm, prompt).then(r => r.text), problem, cfg, fingerprint,
        {
          onEvent: (type, data) => quiet(() => deps.events.append(type, data)),
          northstar: ((): string => { try { return readFileSync(join(cfg.dataDir, 'NORTHSTAR.md'), 'utf8') } catch { return '' } })() || undefined,
        }),
    gateAuthoredGoal: md => gateAuthoredGoal(md, cfg),
    runSession: (opts) => runGoalWithDeps(deps, notifier, cfg, opts),
    billedToday: () => deps.db.billedCostForLocalDay(localDay(new Date().toISOString(), offset), offset, subscriptionTags(cfg))
  }

  // M10.5：全域日頂同步閘（安靜讓路，與其他前置閘一致）。
  if (cfg.globalDailyHardUsd !== undefined && deps.cfgPath) {
    try { if (globalBilledToday(deps.cfgPath, new Date().toISOString()) >= cfg.globalDailyHardUsd) return false } catch { /* fail-open 放行 */ }
  }

  return runPerpetualCycle(cfg, cfg.dataDir, deps.events, (t) => notifier.send(t), hooks)
}
