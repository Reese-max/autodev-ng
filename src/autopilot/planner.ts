import type { Goal } from './goal.js'
import { callAgent, type LlmOpts } from './llm.js'

export type PlanResult =
  | { kind: 'tasks'; tasks: string[] }
  | { kind: 'achieved' }
  | { kind: 'stuck'; reason: string }

export interface PlanInput { goal: Goal; repoSummary: string; history: string[]; lessonsText?: string }

function buildPrompt(input: PlanInput): string {
  const { goal, repoSummary, history, lessonsText } = input
  const goalBlock = `# 目標\n${goal.objective}` + (lessonsText ? `\n\n${lessonsText}` : '')
  return [
    '你是自主開發規劃器。目標如下，判斷為達成目標「下一批」該做哪些具體任務。',
    '若 repo 現況含「已排序的待解問題」，優先挑其中最高價值且未在歷史中處理過的問題，為它拆任務。',
    goalBlock,
    goal.verifyCommand ? `# 驗收條件\n${goal.verifyCommand}` : '',
    `# repo 現況\n${repoSummary || '（無摘要）'}`,
    history.length ? `# 已跑過的任務與結果\n${history.join('\n')}` : '',
    '',
    '嚴格照以下格式回答，第一行必須是 ACHIEVED / STUCK / TASKS 其一：',
    '- 若目標已達成：只回一行 `ACHIEVED`',
    '- 若卡住無法推進：回 `STUCK: <一句理由>`',
    '- 否則回 `TASKS`，其後每行一條「與目標直接相關」的具體任務（1~5 條），任務文字須可被工程引擎獨立執行。'
  ].filter(Boolean).join('\n')
}

export async function plan(llm: LlmOpts, input: PlanInput): Promise<PlanResult> {
  const out = (await callAgent(llm, buildPrompt(input))).text.trim()
  if (!out) return { kind: 'stuck', reason: 'planner 無回應' }
  const lines = out.split(/\r?\n/)
  const head = (lines[0] ?? '').trim()
  if (/^ACHIEVED\b/i.test(head)) return { kind: 'achieved' }
  if (/^STUCK\b/i.test(head)) {
    return { kind: 'stuck', reason: head.replace(/^STUCK\s*:?\s*/i, '').trim() || '未說明' }
  }
  if (/^TASKS\b/i.test(head)) {
    const seen = new Set<string>()
    const tasks: string[] = []
    for (const l of lines.slice(1)) {
      const t = l.replace(/^\s*(?:[-*]|\d+[.)])\s+/, '').trim()
      if (t && !seen.has(t)) { seen.add(t); tasks.push(t) }
    }
    return tasks.length ? { kind: 'tasks', tasks } : { kind: 'stuck', reason: 'planner 未產出任務' }
  }
  return { kind: 'stuck', reason: `planner 格式異常：${head.slice(0, 40)}` }
}
