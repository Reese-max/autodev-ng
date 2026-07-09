import { existsSync, appendFileSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { assemble } from '../cli.js'
import { runOnce } from '../scheduler.js'
import { parseGoal } from './goal.js'
import { plan } from './planner.js'
import { evaluate } from './evaluator.js'
import { runGoalSession, type OrchestratorDeps } from './orchestrator.js'

export async function main(cfgPath: string): Promise<void> {
  const { deps, cfg } = assemble(cfgPath)
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

  const orchDeps: OrchestratorDeps = {
    goalId, goal, cwd: cfg.projectPath, kernelDeps,
    planFn: (input) => plan(llm, input),
    evalFn: (cwd) => evaluate({ llm }, goal, cwd),
    runOnceFn: (d) => runOnce(d),
    isAlive: () => existsSync(cfg.goalFile!) && !existsSync(cfg.stopFile),
    onRound: (r) => appendFileSync(auditFile, JSON.stringify(r) + '\n')
  }
  const outcome = await runGoalSession(orchDeps)
  appendFileSync(auditFile, JSON.stringify({ outcome }) + '\n') // 停止原因入稽核（spec 段⑤）
  console.log(`GOAL outcome: ${JSON.stringify(outcome)}`)
}

const cfgArg = process.argv.indexOf('--config')
if (cfgArg >= 0 && cfgArg + 1 < process.argv.length) {
  main(process.argv[cfgArg + 1]!).catch((e) => { console.error(e); process.exit(1) })
}
