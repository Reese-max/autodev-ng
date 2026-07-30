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
  const appendedTexts = new Set<string>()
  // 跨 session 去重（2026-07-17 實證：goal 8a0d 出現多批 round:0 近同文任務）：daemon 重啟後
  // 新 session 的 history 歸零，planner 看不到 backlog 已 done/blocked 的舊案而重複立案白燒
  // attempts。開場把 backlog 既有任務（含狀態）種進 history 供 planner 參照、種進 appendedTexts
  // 擋同文重複 append。取尾端 50 條防 prompt 無界膨脹；讀失敗 fail-open 照舊空史。
  try {
    for (const t of deps.kernelDeps.store.read().slice(-50)) {
      appendedTexts.add(t.text)
      history.push(`既有任務(${t.status}): ${t.text}`)
    }
  } catch { /* fail-open */ }
  let round = 0
  let lastScore = -Infinity
  let noProgress = 0

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
    if (planResult.kind === 'achieved') {
      // planner 口頭 ACHIEVED 不可信（2026-07-30 實證：GOAL 背景寫「急救已完成」即被誤判達標、
      // 驗收檔不存在仍記 achieved）——一律過 evalFn 機械驗收；紅燈把 verify 輸出餵回下一輪。
      const snap = await deps.evalFn(deps.cwd)
      deps.onRound?.({ round, plan: planResult, snapshot: snap })
      if (snap.achieved) return { kind: 'achieved', rounds: round }
      history.push(`round ${round}: planner 宣告 ACHIEVED 但機械驗收未過（${snap.detail}）——不採信，繼續`)
      noProgress++
      if (noProgress >= deps.goal.noProgressLimit) return { kind: 'no-progress', rounds: round }
      continue
    }
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
