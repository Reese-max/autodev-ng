import { callAgent, type LlmOpts } from '../autopilot/llm.js'
import { TaskEnvelopeSchema, type TaskEnvelope } from './envelope.js'

/** Issue #52 任務分解：Conductor（強模型）把規格/Issue 拆成數個 Task Envelope。
 * 產出必須逐張過 TaskEnvelopeSchema——任一不符即整批 stuck，不產生半成品契約。
 * 對齊 issue 規則：每個 task 應可在 15–30 分鐘內完成並被驗證，過大要再切。 */

export interface DecomposeInput {
  /** 規格本文（GitHub issue body / spec 片段）。 */
  spec: string
  /** 可選 repo 概況（檔案樹/架構摘要），幫模型切出貼地的 scope。 */
  repoSummary?: string
  /** 產出 envelope 的預設 worker tag。 */
  worker: string
  phase?: string
  /** task_id 前綴（如 'i52'）；模型省略 task_id 時以 '<prefix>-<n>' 補齊。 */
  taskIdPrefix?: string
  /** 單次最多切幾張（預設 3，防 LLM 一口氣切碎成碎浪）。 */
  maxTasks?: number
}

export type DecomposeResult =
  | { kind: 'tasks'; envelopes: TaskEnvelope[] }
  | { kind: 'stuck'; reason: string; retryable?: true }

function buildPrompt(input: DecomposeInput): string {
  const max = input.maxTasks ?? 3
  return [
    '你是 Conductor。把下面的工作規格拆成 1–' + max + ' 張 Task Envelope，交給便宜 worker 執行。',
    '規則：',
    '- 每張 task 必須能在 15–30 分鐘內完成並被機械驗證；過大的工作切小，不要硬塞一張。',
    '- acceptance_criteria 必須在派工前就具體可驗；tests 填可在此 repo 真的跑的機械指令（如 vitest/tsc/git）。',
    '- files_allowed_to_change 是 worker 唯一可寫範圍（精確檔案或目錄前綴）；do_not_touch 明列禁區。',
    '- 輸出只回一個 ```json fenced array，每元素是物件，欄位：task_id, phase, goal, scope, do_not_touch[], files_to_read[], files_allowed_to_change[], acceptance_criteria[], tests[], worker, budget{timeout_ms,max_cost_usd}, max_retries(≤2), parent_commit, stop_conditions[], final_report_required。',
    '- worker/phase/task_id 可省略（Conductor 會補預設）；其餘欄位必填。',
    '',
    input.repoSummary ? `## repo 概況\n${input.repoSummary}\n` : '',
    '## 規格',
    input.spec,
  ].join('\n')
}

/** 從模型輸出抽 JSON：優先 ```json fence，其次第一個 [..] 平衡段。 */
function extractJsonArray(text: string): unknown[] | undefined {
  const fence = /```(?:json)?\s*\n([\s\S]*?)```/.exec(text)
  const candidates = [fence?.[1], text.slice(text.indexOf('['))].filter((s): s is string => Boolean(s))
  for (const cand of candidates) {
    try {
      const parsed: unknown = JSON.parse(cand)
      const arr = Array.isArray(parsed) ? parsed
        : (parsed && typeof parsed === 'object' && Array.isArray((parsed as { tasks?: unknown }).tasks)
          ? (parsed as { tasks: unknown[] }).tasks : undefined)
      if (arr) return arr
    } catch { /* next candidate */ }
  }
  return undefined
}

export async function decomposeSpec(llm: LlmOpts, input: DecomposeInput): Promise<DecomposeResult> {
  const res = await callAgent(llm, buildPrompt(input))
  if (res.error) return { kind: 'stuck', reason: `decompose LLM 呼叫失敗：${res.error}`, retryable: true }
  const arr = extractJsonArray(res.text)
  if (!arr || arr.length === 0) {
    return { kind: 'stuck', reason: 'decompose 輸出無 JSON array——規格可能需要先回 Conductor 釐清' }
  }
  const envelopes: TaskEnvelope[] = []
  const errors: string[] = []
  arr.slice(0, input.maxTasks ?? 3).forEach((item, i) => {
    const raw = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const filled = {
      worker: input.worker,
      phase: input.phase ?? 'implementation',
      task_id: `${input.taskIdPrefix ?? 'task'}-${i + 1}`,
      ...raw,
    }
    const parsed = TaskEnvelopeSchema.safeParse(filled)
    if (parsed.success) envelopes.push(parsed.data)
    else errors.push(`#${i + 1}: ${parsed.error.issues.map(is => `${is.path.join('.')} ${is.message}`).join('; ')}`)
  })
  if (errors.length) return { kind: 'stuck', reason: `envelope 不符 schema：${errors.join(' | ')}`, retryable: true }
  return { kind: 'tasks', envelopes }
}
