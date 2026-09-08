import { llmFromConfig } from './llm.js'
import { existsSync, appendFileSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import type { Config } from '../types.js'
import { quiet } from '../events.js'
import type { Deps } from '../scheduler.js'
import { finalizeRunOnceHeartbeat, runOnce } from '../scheduler.js'
import { acquireLock, releaseLock } from '../lock.js'
import { parseGoal } from './goal.js'
import { readHandledProblemTitles } from './ledger.js'
import { plan } from './planner.js'
import { evaluate, runGoalVerify } from './evaluator.js'
import { verifyAndSupplement } from './supplement.js'
import { discoverProblems, type DiscoverResult } from './discover.js'
import { runGoalSession, type OrchestratorDeps, type GoalOutcome } from './orchestrator.js'
import { collectSurvey, hasSurveySources } from './survey-sources.js'
import { readRecentGoalRoiSummary, settleGoalRoi } from './roi.js'
import { inspectGitWorkspace, persistGitWorkspaceBlock } from './git-workspace.js'

export interface SessionResult {
  goalId: string
  outcome: GoalOutcome
  supplement?: { clean: boolean; rounds: number; supplemented: number; residualGaps: string[] }
}

// M10.5 補洞（2026-07-17 實證）：config-gone 檢查原本只在 daemon cycle 開頭，但 perpetual
// 一整個 GOAL session 都在單一 cycle 內，config 移除後 session 可再跑數小時（pid 33628 實測
// 1.5h 未退）。session 存活判定併入 config 存在檢查，讓退役/優雅重啟在任務間即煞停（≤一輪生效）。
// 2026-07-28 同型補洞：restart.request 哨兵也被長 GOAL 餓死（note-filler 實測 5 小時未吃部署）——
// 哨兵存在＝session 不再存活，GOAL 回 killed 交還主迴圈；消費（unlink＋事件）仍歸 daemon 檢查點。
export function sessionAlive(goalFile: string, stopFile: string, cfgPath?: string, dataDir?: string): boolean {
  return existsSync(goalFile) && !existsSync(stopFile) && (!cfgPath || existsSync(cfgPath))
    && (!dataDir || !existsSync(join(dataDir, 'restart.request')))
}

export function stopAlertMessage(goalId: string, outcome: GoalOutcome): string | null {
  if (outcome.kind === 'achieved') return null
  const base = `autopilot GOAL 停機（goal ${goalId}）：${outcome.kind}，共 ${outcome.rounds} 輪`
  if (outcome.kind === 'blocked') return `${base}——${outcome.reason}：${outcome.detail}；修復：${outcome.repairCommands.join('；')}`
  return outcome.kind === 'stuck' ? `${base}——${outcome.reason}` : base
}

/** GOAL 指定引擎時鎖死選擎：defaultEngine 與 engineRotation 一併覆蓋——
 * 只蓋 defaultEngine 會被非空 rotation 淹沒（candidateEngines 規則），GOAL 級指定形同虛設。 */
export function pinGoalEngine(cfg: Config, engine: string | undefined): Config {
  return engine ? { ...cfg, defaultEngine: engine, engineRotation: [engine] } : cfg
}

export async function runGoalWithDeps(
  deps: Deps, notifier: { send(text: string): Promise<boolean> }, cfg: Config,
  opts?: { discovered?: DiscoverResult }
): Promise<SessionResult | 'no-goal' | 'lock-busy' | 'stopped'> {
  if (!cfg.goalFile || !existsSync(cfg.goalFile)) {
    console.log('no GOAL.md（autopilot 未啟動）'); return 'no-goal'
  }
  if (existsSync(cfg.stopFile)) {
    console.log('全域暫停中（autopilot 未啟動）'); return 'stopped'
  }
  // 單例鎖：防止 /goal run 手滑雙跑同一 GOAL session（鏡像 bot/index.ts 的 bot.lock 慣例）。
  const lockDir = join(cfg.dataDir, 'autopilot.lock')
  if (!acquireLock(lockDir)) {
    console.log('autopilot 已在執行中（lock busy），本次啟動略過，避免雙跑')
    return 'lock-busy'
  }
  try {
    const goalMd = readFileSync(cfg.goalFile, 'utf8')
    const goal = parseGoal(goalMd)
    const goalId = createHash('sha1').update(goal.objective).digest('hex').slice(0, 4)
    const startedAt = new Date().toISOString()
    const auditFile = join(cfg.dataDir, `goal-${goalId}.jsonl`)
    const workspace = inspectGitWorkspace(cfg.projectPath)
    if (!workspace.ok) {
      let record
      try { record = persistGitWorkspaceBlock(join(cfg.dataDir, 'research-blocked.jsonl'), workspace) } catch (error) {
        quiet(() => deps.events.append('research-blocked', {
          goalId, projectPath: workspace.projectPath, reason: workspace.reason,
          detail: workspace.detail, repairCommands: workspace.repairCommands,
          deliverable: false, persistenceError: String(error)
        }))
      }
      if (record) {
        try { appendFileSync(auditFile, JSON.stringify({ ...record, goalId }) + '\n') } catch { /* audit is best-effort */ }
        quiet(() => deps.events.append('research-blocked', { goalId, ...record }))
      }
      return { goalId, outcome: { kind: 'blocked', rounds: 0, reason: workspace.reason, detail: workspace.detail, repairCommands: workspace.repairCommands } }
    }
    if (!goal.verifyCommand?.trim()) {
      const outcome: GoalOutcome = { kind: 'stuck', rounds: 0, reason: 'GOAL 缺少可執行的機械驗收指令，未派工' }
      appendFileSync(auditFile, JSON.stringify({ outcome }) + '\n')
      return { goalId, outcome }
    }
    // GOAL 指定引擎時鎖死選擎（config 白名單須含此引擎）
    const kernelDeps = goal.engine
      ? { ...deps, cfg: pinGoalEngine(cfg, goal.engine) }
      : deps
    if (cfg.llmTransport === 'cli' && (!cfg.auditModel || cfg.auditModel === cfg.judgeModel || cfg.auditModel === cfg.engines[kernelDeps.cfg.defaultEngine]?.model)) {
      const outcome: GoalOutcome = { kind: 'stuck', rounds: 0, reason: 'CLI GOAL 需要不同模型的獨立審查，未派工' }
      appendFileSync(auditFile, JSON.stringify({ outcome }) + '\n')
      return { goalId, outcome }
    }
    const llm = llmFromConfig(cfg, cfg.judgeModel, cfg.judgeUrl)
    // M7 Task 5：session 開始時讀一次教訓（不逐輪重讀），fail-open——教訓面故障不擋 GOAL 啟動
    let lessonsText = ''
    try { lessonsText = deps.lessons?.inject() ?? '' } catch { /* fail-open */ }

    // M9.7：session 開頭跑一次 discovery（僅 cfg.surveyCommand 有設；fail-open——故障退回無 discovered）。
    let discovered: DiscoverResult | undefined
    if (opts?.discovered) {
      discovered = opts.discovered
    } else if (cfg.surveyCommand || hasSurveySources(cfg.dataDir)) {
      // spec：auditModel 未設時 critic 退用 judgeModel，獨立性降級——記一筆稽核事件提醒（fail-open，不擋 discovery 主流程）。
      if (!cfg.auditModel) {
        try { appendFileSync(auditFile, JSON.stringify({ discoveryNote: 'critic 用 judgeModel（auditModel 未設，獨立性降級）' }) + '\n') } catch { /* fail-open */ }
      }
      try {
        discovered = await discoverProblems({
          finderLlm: llm,
          criticLlm: llmFromConfig(cfg, cfg.auditModel ?? cfg.judgeModel, cfg.judgeUrl),
          runSurvey: (_c, wd) => ({ output: collectSurvey(cfg, wd, (type, data) => quiet(() => deps.events.append(type, data))) }),
          onEvent: (type, data) => quiet(() => deps.events.append(type, data)),
          readRoiSummary: () => readRecentGoalRoiSummary(join(cfg.dataDir, 'run.db')),
          readHandledTitles: () => readHandledProblemTitles(join(cfg.dataDir, 'run.db')),
          lenses: cfg.discoverLenses
        }, goal, cfg.projectPath)
      } catch (e) { console.error('discovery 故障（fail-open，無 discovered）:', String(e)) }
      // 稽核 append 移出 discovery 主 try：即使寫檔失敗，discovered 已賦值不受影響，且不會誤觸「無 discovered」訊息。
      if (discovered) {
        try { appendFileSync(auditFile, JSON.stringify({ discovered }) + '\n') } catch { /* fail-open：稽核寫入失敗不影響主流程 */ }
      }
    }

    const alive = () => sessionAlive(cfg.goalFile!, cfg.stopFile, deps.cfgPath, cfg.dataDir)
    const orchDeps: OrchestratorDeps = {
      goalId, goal, cwd: cfg.projectPath, kernelDeps, lessonsText, discovered,
      planFn: (input) => plan(llm, input),
      evalFn: (cwd) => evaluate({ llm, verifyTimeoutMs: cfg.verifyTimeoutMs }, goal, cwd),
      runOnceFn: async (d) => { const r = await runOnce(d); finalizeRunOnceHeartbeat(d, r); try { await d.lessons?.reflect(r) } catch { /* Learning cannot overwrite a cycle result. */ } return r },
      isAlive: alive,
      onRound: (r) => appendFileSync(auditFile, JSON.stringify(r) + '\n')
    }
    let outcome = await runGoalSession(orchDeps)
    // 最終成果必須包含已設定的獨立審查結果。
    let supplement: SessionResult['supplement']
    if (outcome.kind === 'achieved' && cfg.auditModel) {
      try {
        const sup = await verifyAndSupplement({
          auditLlm: llmFromConfig(cfg, cfg.auditModel, cfg.judgeUrl),
          runVerify: (cmd, wd) => runGoalVerify(cmd, wd, cfg.verifyTimeoutMs),
          runOnceFn: async () => { const r = await runOnce(kernelDeps); finalizeRunOnceHeartbeat(kernelDeps, r); try { await kernelDeps.lessons?.reflect(r) } catch { /* Preserve cycle outcome. */ } return r },
          appendTask: (t) => kernelDeps.store.append(t, { goalId, round: 0 }),
          isAlive: alive,
          supplementLimit: cfg.supplementLimit
        }, goal, cfg.projectPath)
        supplement = sup
        appendFileSync(auditFile, JSON.stringify({ supplement: sup }) + '\n')
        console.log(`supplement: ${JSON.stringify(sup)}`)
      } catch (e) {
        supplement = { clean: false, rounds: 0, supplemented: 0, residualGaps: [`audit error: ${String(e)}`] }
      }
      if (!supplement?.clean) outcome = { kind: 'stuck', rounds: outcome.rounds, reason: `獨立審查未通過：${supplement?.residualGaps.join('；') || '審查未完成'}` }
    }
    appendFileSync(auditFile, JSON.stringify({ outcome }) + '\n')
    console.log(`GOAL outcome: ${JSON.stringify(outcome)}`)
    if (outcome.kind !== 'killed' && outcome.kind !== 'blocked') {
      settleGoalRoi({
        events: deps.events, dbFile: join(cfg.dataDir, 'run.db'), backlogFile: cfg.backlogFile,
        goalId, result: outcome.kind, startedAt, endedAt: new Date().toISOString()
      })
    }
    const alert = stopAlertMessage(goalId, outcome)
    if (alert) await notifier.send(alert) // 一次性停機告警；send 永不 throw（fail-open）
    return { goalId, outcome, supplement }
  } finally {
    releaseLock(lockDir)
  }
}
