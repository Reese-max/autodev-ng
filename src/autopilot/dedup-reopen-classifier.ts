import type { Task } from '../types.js'

export const BLOCKED_REOPEN_EXHAUSTED_EVENT = 'blocked-reopen-exhausted' as const

export type ReopenHistory = 'never-reopened' | 'reopened'

export type DedupReopenDecision =
  | { kind: 'reopen'; reason: 'first-blocked' }
  | { kind: 'reject'; reason: 'done' | 'already-open' | 'reopen-history-missing' }
  | {
      kind: 'reject'
      reason: typeof BLOCKED_REOPEN_EXHAUSTED_EVENT
      event: {
        type: typeof BLOCKED_REOPEN_EXHAUSTED_EVENT
        data: { existingStatus: 'blocked'; reopenHistory: 'reopened' }
      }
    }

export interface ClassifyDedupReopenInput {
  existingStatus: Task['status']
  /** undefined/null 代表標記缺失；未知歷史一律保守拒絕。 */
  reopenHistory?: ReopenHistory | null
}

/** dedup 命中後的單次重開判定；不讀寫任何外部狀態。 */
export function classifyDedupReopen({
  existingStatus,
  reopenHistory,
}: ClassifyDedupReopenInput): DedupReopenDecision {
  if (existingStatus === 'done') return { kind: 'reject', reason: 'done' }
  if (existingStatus === 'open') return { kind: 'reject', reason: 'already-open' }
  if (reopenHistory === 'never-reopened') return { kind: 'reopen', reason: 'first-blocked' }
  if (reopenHistory !== 'reopened') return { kind: 'reject', reason: 'reopen-history-missing' }
  return {
    kind: 'reject',
    reason: BLOCKED_REOPEN_EXHAUSTED_EVENT,
    event: {
      type: BLOCKED_REOPEN_EXHAUSTED_EVENT,
      data: { existingStatus: 'blocked', reopenHistory: 'reopened' },
    },
  }
}
