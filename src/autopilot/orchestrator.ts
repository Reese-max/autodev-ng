import type { Deps, CycleResult } from '../scheduler.js'
import type { Goal } from './goal.js'
import type { PlanResult, PlanInput } from './planner.js'
import type { ProgressSnapshot } from './evaluator.js'
import type { RankedProblem } from './discover.js'

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
  /** M7 Task 5：session 開始時讀一次的教訓文字，逐輪附進 planFn 的 prompt（fail-open，undefined 時行為與現狀一致）。 */
  lessonsText?: string
  /** M9.7：session 開始時跑一次的勘查＋排序問題清單，逐輪附進 repoSummary（fail-open，undefined 時行為與現狀一致）。 */
  discovered?: { survey: string; ranked: RankedProblem[] }
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
  const appendedTexts = new Set<string>()

  for (;;) {
    if (!deps.isAlive()) return { kind: 'killed', rounds: round }
    round++

    const repoSummary = deps.discovered && deps.discovered.ranked.length
      ? [
          `round ${round}`,
          `# 專案勘查\n${deps.discovered.survey.slice(0, 2000)}`,
          '# 已排序的待解問題（高價值在前；配下方歷史挑最高價值且未處理者）',
          ...deps.discovered.ranked.map((p, i) => `${i + 1}. [value ${p.value}] ${p.title}（${p.lens}）— ${p.rationale}`)
        ].join('\n')
      : `round ${round}`
    const planResult = await deps.planFn({ goal: deps.goal, repoSummary, history, lessonsText: deps.lessonsText })
    if (planResult.kind === 'achieved') return { kind: 'achieved', rounds: round }
    if (planResult.kind === 'stuck') return { kind: 'stuck', rounds: round, reason: planResult.reason }

    // tasks：append 進 backlog（autopilot 標記），逐條跑完該批
    for (const t of planResult.tasks) {
      if (appendedTexts.has(t)) continue // 本 session 已 append 過，跳過（防多輪重複污染 backlog）
      appendedTexts.add(t)
      deps.kernelDeps.store.append(t, { goalId: deps.goalId, round })
      history.push(`round ${round}: ${t}`)
    }
    for (;;) {
      if (!deps.isAlive()) return { kind: 'killed', rounds: round }
      const r = await deps.runOnceFn(deps.kernelDeps)
      // preflight-failed 不會標記 task done/blocked，task 仍是 open，
      // 若不中止，下一輪 runOnceFn 會重撿同一個 task、重複同一個 preflight
      // 失敗，形成無退避的緊迴圈。中止後交還控制權給外層 round 迴圈，
      // 讓「連續無進展」煞車與 kill switch 接手。
      if (r === 'idle' || r === 'stopped' || r === 'cost-hard-stop' || r === 'preflight-failed') break
    }

    const snapshot = await deps.evalFn(deps.cwd)
    deps.onRound?.({ round, plan: planResult, snapshot })
    if (snapshot.achieved) return { kind: 'achieved', rounds: round }

    if (snapshot.score > lastScore) { lastScore = snapshot.score; noProgress = 0 }
    else { noProgress++; if (noProgress >= deps.goal.noProgressLimit) return { kind: 'no-progress', rounds: round } }
  }
}
