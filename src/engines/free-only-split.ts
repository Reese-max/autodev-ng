import type { BacklogStore } from '../backlog.js'
import type { Config, Task } from '../types.js'
import type { SplitChild } from './backlog-split.js'

export const FREE_ONLY_SPLIT_FAILURES = 2
type JudgeOpts = Pick<Config, 'judgeUrl' | 'judgeModel' | 'judgeApiKey' | 'judgeEffort' | 'judgeTimeoutMs'>
interface JudgePiece { task: string; acceptance: string }
export interface FreeOnlySplitPlan { pieces: JudgePiece[] }
export type FreeOnlySplitAttempt = { kind: 'not-eligible' | 'blocked'; detail?: string } | { kind: 'split'; pieces: number }

function validPlan(input: unknown, parentAcceptance: string): FreeOnlySplitPlan | undefined {
  if (!input || typeof input !== 'object' || !Array.isArray((input as { pieces?: unknown }).pieces)) return undefined
  const pieces = (input as { pieces: unknown[] }).pieces
  if (pieces.length < 2 || pieces.length > 5) return undefined
  if (!pieces.every(piece => {
    const p = piece as Partial<JudgePiece>
    return typeof p?.task === 'string' && p.task.trim() !== '' && !/[\r\n]/.test(p.task)
      && typeof p?.acceptance === 'string' && p.acceptance.trim() !== '' && !/[\r\n]/.test(p.acceptance)
  })) return undefined
  const typed = pieces as JudgePiece[]
  return typed.at(-1)!.acceptance.includes(parentAcceptance) ? { pieces: typed } : undefined
}

async function requestSplit(
  opts: JudgeOpts, task: Task, failure: string, parentAcceptance: string, fetchFn: typeof fetch,
): Promise<FreeOnlySplitPlan | undefined> {
  if (!opts.judgeUrl || !parentAcceptance) return undefined
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), opts.judgeTimeoutMs)
  try {
    const res = await fetchFn(`${opts.judgeUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.judgeApiKey}` }, signal: controller.signal,
      body: JSON.stringify({ model: opts.judgeModel, reasoning_effort: opts.judgeEffort, messages: [{ role: 'user', content:
        `將以下 free-only 失敗任務拆成循序工作片。只回傳 JSON：{"pieces":[{"task":"單行子任務","acceptance":"可獨立執行的驗收指令"}]}。先產生 2–4 個子任務，最後一片是整合片；總片數限 2–5，最後 acceptance 必須逐字包含母任務原始驗收指令。\n\n母任務：${task.text}\n最後失敗：${failure}\n母任務原始驗收：${parentAcceptance}` }] }),
    })
    if (!res.ok) return undefined
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
    return validPlan(JSON.parse(data.choices?.[0]?.message?.content ?? ''), parentAcceptance)
  } catch { return undefined } finally { clearTimeout(timer) }
}

/** 只有 free-only 累積兩敗才拆；二層子片到門檻直接封鎖，永不遞迴展開。 */
export async function tryFreeOnlySplit(input: {
  cfg: Config; store: BacklogStore; task: Task; failures: number; failure: string; fetchFn?: typeof fetch
}): Promise<FreeOnlySplitAttempt> {
  const { cfg, store, task, failures, failure } = input
  if (cfg.tierMode !== 'free-only' || failures < FREE_ONLY_SPLIT_FAILURES) return { kind: 'not-eligible' }
  if ((task.split?.depth ?? 0) >= 2) return { kind: 'blocked', detail: 'split depth limit reached' }
  const parentAcceptance = cfg.verifyCommand?.trim() ?? ''
  const plan = await requestSplit(cfg, task, failure, parentAcceptance, input.fetchFn ?? fetch)
  if (!plan) return { kind: 'blocked', detail: 'judge split output invalid' }
  const parentId = task.id.slice(0, 8), depth = (task.split?.depth ?? 0) + 1
  const children: SplitChild[] = plan.pieces.map((piece, index) => ({
    text: `${index === plan.pieces.length - 1 ? '整合片：' : ''}${piece.task.trim()}；驗收：${piece.acceptance.trim()}`,
    split: { parentId, part: index + 1, depth, shape: 'sequential' },
  }))
  try { store.split(task.id, children) } catch { return { kind: 'blocked', detail: 'split persistence failed' } }
  return { kind: 'split', pieces: children.length }
}

/** 同一血緣只放行最早尚未完成的 sequential 片，較後片不得被挑選。 */
export function sequentialReadyTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => task.status === 'open' && (!task.split || task.split.shape !== 'sequential' || tasks
    .filter(other => other.split?.parentId === task.split!.parentId && other.split.part < task.split!.part)
    .every(other => other.status === 'done')))
}
