import { existsSync, appendFileSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import type { Config } from '../types.js'
import type { Deps } from '../scheduler.js'
import { finalizeRunOnceHeartbeat, runOnce } from '../scheduler.js'
import { acquireLock, releaseLock } from '../lock.js'
import { parseGoal } from './goal.js'
import { plan } from './planner.js'
import { evaluate } from './evaluator.js'
import { verifyAndSupplement } from './supplement.js'
import { discoverProblems, type DiscoverResult } from './discover.js'
import { runGoalSession, type OrchestratorDeps, type GoalOutcome } from './orchestrator.js'

export interface SessionResult {
  goalId: string
  outcome: GoalOutcome
  supplement?: { clean: boolean; rounds: number; supplemented: number; residualGaps: string[] }
}

// M10.5 補洞（2026-07-17 實證）：config-gone 檢查原本只在 daemon cycle 開頭，但 perpetual
// 一整個 GOAL session 都在單一 cycle 內，config 移除後 session 可再跑數小時（pid 33628 實測
// 1.5h 未退）。session 存活判定併入 config 存在檢查，讓退役/優雅重啟在任務間即煞停（≤一輪生效）。
export function sessionAlive(goalFile: string, stopFile: string, cfgPath?: string): boolean {
  return existsSync(goalFile) && !existsSync(stopFile) && (!cfgPath || existsSync(cfgPath))
}

export function stopAlertMessage(goalId: string, outcome: GoalOutcome): string | null {
  if (outcome.kind === 'achieved') return null
  const base = `autopilot GOAL 停機（goal ${goalId}）：${outcome.kind}，共 ${outcome.rounds} 輪`
  return outcome.kind === 'stuck' ? `${base}——${outcome.reason}` : base
}

export async function runGoalWithDeps(
  deps: Deps, notifier: { send(text: string): Promise<boolean> }, cfg: Config,
  opts?: { discovered?: DiscoverResult }
): Promise<SessionResult | 'no-goal' | 'lock-busy'> {
  if (!cfg.goalFile || !existsSync(cfg.goalFile)) {
    console.log('no GOAL.md（autopilot 未啟動）'); return 'no-goal'
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
    // GOAL 指定的免費引擎覆寫 defaultEngine（沙盒 config 白名單須含此引擎）
    const kernelDeps = goal.engine
      ? { ...deps, cfg: { ...cfg, defaultEngine: goal.engine } }
      : deps
    const llm = { url: cfg.judgeUrl, model: cfg.judgeModel, apiKey: cfg.judgeApiKey }
    const auditFile = join(cfg.dataDir, `goal-${goalId}.jsonl`)
    // M7 Task 5：session 開始時讀一次教訓（不逐輪重讀），fail-open——教訓面故障不擋 GOAL 啟動
    let lessonsText = ''
    try { lessonsText = deps.lessons?.inject() ?? '' } catch { /* fail-open */ }

    // M9.7：session 開頭跑一次 discovery（僅 cfg.surveyCommand 有設；fail-open——故障退回無 discovered）。
    let discovered: DiscoverResult | undefined
    if (opts?.discovered) {
      discovered = opts.discovered
    } else if (cfg.surveyCommand) {
      // spec：auditModel 未設時 critic 退用 judgeModel，獨立性降級——記一筆稽核事件提醒（fail-open，不擋 discovery 主流程）。
      if (!cfg.auditModel) {
        try { appendFileSync(auditFile, JSON.stringify({ discoveryNote: 'critic 用 judgeModel（auditModel 未設，獨立性降級）' }) + '\n') } catch { /* fail-open */ }
      }
      try {
        discovered = await discoverProblems({
          finderLlm: llm,
          criticLlm: { url: cfg.judgeUrl, model: cfg.auditModel ?? cfg.judgeModel, apiKey: cfg.judgeApiKey },
          runSurvey: (_c, wd) => {
            try { return { output: execSync(cfg.surveyCommand!, { cwd: wd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: cfg.surveyTimeoutMs, windowsHide: true }).slice(-8000) } }
            catch (e) { const er = e as { stdout?: string }; return { output: (er.stdout ?? '').slice(-8000) } }
          },
          lenses: cfg.discoverLenses
        }, goal, cfg.projectPath)
      } catch (e) { console.error('discovery 故障（fail-open，無 discovered）:', String(e)) }
      // 稽核 append 移出 discovery 主 try：即使寫檔失敗，discovered 已賦值不受影響，且不會誤觸「無 discovered」訊息。
      if (discovered) {
        try { appendFileSync(auditFile, JSON.stringify({ discovered }) + '\n') } catch { /* fail-open：稽核寫入失敗不影響主流程 */ }
      }
    }

    const alive = () => sessionAlive(cfg.goalFile!, cfg.stopFile, deps.cfgPath)
    const orchDeps: OrchestratorDeps = {
      goalId, goal, cwd: cfg.projectPath, kernelDeps, lessonsText, discovered,
      planFn: (input) => plan(llm, input),
      evalFn: (cwd) => evaluate({ llm }, goal, cwd),
      runOnceFn: async (d) => { const r = await runOnce(d); finalizeRunOnceHeartbeat(d, r); return r },
      isAlive: alive,
      onRound: (r) => appendFileSync(auditFile, JSON.stringify(r) + '\n')
    }
    const outcome = await runGoalSession(orchDeps)
    appendFileSync(auditFile, JSON.stringify({ outcome }) + '\n') // 停止原因入稽核（spec 段⑤）
    console.log(`GOAL outcome: ${JSON.stringify(outcome)}`)
    // M9.6：達成後對抗式獨立驗證＋補足（僅 cfg.auditModel 有設時啟動；fail-open——本階段故障保留 achieved）。
    let supplement: SessionResult['supplement']
    if (outcome.kind === 'achieved' && cfg.auditModel) {
      try {
        const sup = await verifyAndSupplement({
          auditLlm: { url: cfg.judgeUrl, model: cfg.auditModel, apiKey: cfg.judgeApiKey },
          runVerify: (cmd, wd) => {
            try { return { exitCode: 0, passed: 1, output: execSync(cmd, { cwd: wd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }).slice(-2000) } }
            catch (e) { const er = e as { status?: number; stdout?: string }; return { exitCode: er.status ?? 1, passed: 0, output: (er.stdout ?? '').slice(-2000) } }
          },
          runOnceFn: async () => { const r = await runOnce(kernelDeps); finalizeRunOnceHeartbeat(kernelDeps, r); return r },
          appendTask: (t) => kernelDeps.store.append(t, { goalId, round: 0 }),
          isAlive: alive,
          supplementLimit: cfg.supplementLimit
        }, goal, cfg.projectPath)
        supplement = sup
        appendFileSync(auditFile, JSON.stringify({ supplement: sup }) + '\n')
        console.log(`supplement: ${JSON.stringify(sup)}`)
      } catch (e) { console.error('supplement 階段故障（fail-open，保留 achieved）:', String(e)) }
    }
    const alert = stopAlertMessage(goalId, outcome)
    if (alert) await notifier.send(alert) // 一次性停機告警；send 永不 throw（fail-open）
    return { goalId, outcome, supplement }
  } finally {
    releaseLock(lockDir)
  }
}
