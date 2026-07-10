import { existsSync, appendFileSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { assemble, finalizeRunOnceHeartbeat } from '../cli.js'
import { runOnce } from '../scheduler.js'
import { parseGoal } from './goal.js'
import { plan } from './planner.js'
import { evaluate } from './evaluator.js'
import { runGoalSession, type OrchestratorDeps, type GoalOutcome } from './orchestrator.js'

export function stopAlertMessage(goalId: string, outcome: GoalOutcome): string | null {
  if (outcome.kind === 'achieved') return null
  const base = `autopilot GOAL 停機（goal ${goalId}）：${outcome.kind}，共 ${outcome.rounds} 輪`
  return outcome.kind === 'stuck' ? `${base}——${outcome.reason}` : base
}

export async function main(cfgPath: string): Promise<void> {
  const { deps, notifier, cfg } = assemble(cfgPath)
  if (!cfg.goalFile || !existsSync(cfg.goalFile)) {
    console.log('no GOAL.md（autopilot 未啟動）'); return
  }
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

  const orchDeps: OrchestratorDeps = {
    goalId, goal, cwd: cfg.projectPath, kernelDeps, lessonsText,
    planFn: (input) => plan(llm, input),
    evalFn: (cwd) => evaluate({ llm }, goal, cwd),
    runOnceFn: async (d) => { const r = await runOnce(d); finalizeRunOnceHeartbeat(d, r); return r },
    isAlive: () => existsSync(cfg.goalFile!) && !existsSync(cfg.stopFile),
    onRound: (r) => appendFileSync(auditFile, JSON.stringify(r) + '\n')
  }
  const outcome = await runGoalSession(orchDeps)
  appendFileSync(auditFile, JSON.stringify({ outcome }) + '\n') // 停止原因入稽核（spec 段⑤）
  console.log(`GOAL outcome: ${JSON.stringify(outcome)}`)
  const alert = stopAlertMessage(goalId, outcome)
  if (alert) await notifier.send(alert) // 一次性停機告警；send 永不 throw（fail-open）
}

const cfgArg = process.argv.indexOf('--config')
if (cfgArg >= 0 && cfgArg + 1 < process.argv.length) {
  main(process.argv[cfgArg + 1]!).catch((e) => { console.error(e); process.exit(1) })
}
