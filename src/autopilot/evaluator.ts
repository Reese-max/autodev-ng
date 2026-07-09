import { execSync } from 'node:child_process'
import type { Goal } from './goal.js'
import { callAgent, type LlmOpts } from './llm.js'

export interface ProgressSnapshot { achieved: boolean; score: number; detail: string }
export interface EvalDeps {
  llm: LlmOpts
  runVerify?: (cmd: string, cwd: string) => { exitCode: number; passed: number }
}

// 預設 verify 執行：非零 exit 不 throw；passed = 從輸出數 "pass"/"passing" 的粗略計數（沙盒足夠）
function defaultRunVerify(cmd: string, cwd: string): { exitCode: number; passed: number } {
  try {
    const out = execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    const m = out.match(/(\d+)\s+pass/i)
    return { exitCode: 0, passed: m ? Number(m[1]) : 1 }
  } catch (err) {
    const e = err as { status?: number; stdout?: string }
    const m = (e.stdout ?? '').match(/(\d+)\s+pass/i)
    return { exitCode: e.status ?? 1, passed: m ? Number(m[1]) : 0 }
  }
}

export async function evaluate(deps: EvalDeps, goal: Goal, cwd: string): Promise<ProgressSnapshot> {
  if (goal.verifyCommand) {
    const run = deps.runVerify ?? defaultRunVerify
    try {
      const { exitCode, passed } = run(goal.verifyCommand, cwd)
      return { achieved: exitCode === 0, score: passed, detail: `verify exit=${exitCode} passed=${passed}` }
    } catch (err) {
      return { achieved: false, score: 0, detail: `verify error: ${String(err).slice(0, 120)}` }
    }
  }
  // 無可量測條件：agent 補判（fail-open：空回應 = 未達成）
  const out = (await callAgent(deps.llm,
    `目標：${goal.objective}\n判斷是否已達成，達成回 ACHIEVED，否則回 NOT-YET 並簡述缺口。`)).trim()
  const achieved = /ACHIEVED/i.test(out.slice(0, 20))
  return { achieved, score: achieved ? 1 : 0, detail: out.slice(0, 200) || 'agent 無回應' }
}
