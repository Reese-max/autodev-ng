import type { Deps, CycleResult } from '../scheduler.js'
import type { Goal } from './goal.js'
import type { PlanResult, PlanInput } from './planner.js'
import type { ProgressSnapshot } from './evaluator.js'

export type GoalOutcome =
  | { kind: 'achieved'; rounds: number }
  | { kind: 'no-progress'; rounds: number }
  | { kind: 'stuck'; rounds: number; reason: string }
  | { kind: 'killed'; rounds: number }

export interface RoundLog { round: number; plan: PlanResult; snapshot: ProgressSnapshot }

export interface OrchestratorDeps {
  goalId: string
  goal: Goal
  cwd: string
  kernelDeps: Deps
  planFn: (input: PlanInput) => Promise<PlanResult>
  evalFn: (cwd: string) => Promise<ProgressSnapshot>
  runOnceFn: (d: Deps) => Promise<CycleResult>
  isAlive: () => boolean
  onRound?: (r: RoundLog) => void
}

export async function runGoalSession(deps: OrchestratorDeps): Promise<GoalOutcome> {
  const history: string[] = []
  let round = 0
  let lastScore = -Infinity
  let noProgress = 0

  for (;;) {
    if (!deps.isAlive()) return { kind: 'killed', rounds: round }
    round++

    const repoSummary = `round ${round}`
    const planResult = await deps.planFn({ goal: deps.goal, repoSummary, history })
    if (planResult.kind === 'achieved') return { kind: 'achieved', rounds: round }
    if (planResult.kind === 'stuck') return { kind: 'stuck', rounds: round, reason: planResult.reason }

    // tasks：append 進 backlog（autopilot 標記），逐條跑完該批
    for (const t of planResult.tasks) {
      deps.kernelDeps.store.append(t, { goalId: deps.goalId, round })
      history.push(`round ${round}: ${t}`)
    }
    for (;;) {
      if (!deps.isAlive()) return { kind: 'killed', rounds: round }
      const r = await deps.runOnceFn(deps.kernelDeps)
      if (r === 'idle' || r === 'stopped' || r === 'cost-hard-stop') break
    }

    const snapshot = await deps.evalFn(deps.cwd)
    deps.onRound?.({ round, plan: planResult, snapshot })
    if (snapshot.achieved) return { kind: 'achieved', rounds: round }

    if (snapshot.score > lastScore) { lastScore = snapshot.score; noProgress = 0 }
    else { noProgress++; if (noProgress >= deps.goal.noProgressLimit) return { kind: 'no-progress', rounds: round } }
  }
}
