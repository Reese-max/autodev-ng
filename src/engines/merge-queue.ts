import { resolve } from 'node:path'
import type { MergeBackResult } from '../worktree.js'
import type { TeamState } from './team-state.js'

/** 同一主 repo 共用一條 promise chain；不同 repo 不互相阻塞。 */
const tails = new Map<string, Promise<void>>()

/** daemon 進程內 FIFO merge queue；前者失敗仍會把併入權交給下一個。 */
export function enqueueMerge<T>(projectPath: string, fn: () => T | Promise<T>): Promise<T> {
  const key = resolve(projectPath)
  const next = (tails.get(key) ?? Promise.resolve()).then(fn)
  const tail = next.then(() => undefined, () => undefined)
  tails.set(key, tail)
  void tail.then(() => {
    if (tails.get(key) === tail) tails.delete(key)
  })
  return next
}

export function enqueueTeamMerge(
  projectPath: string,
  team: TeamState,
  item: { executionId: string; token: string; taskId: string; candidateHead: string; branch: string; worktreePath: string },
  timeoutMs: number,
  fn: () => MergeBackResult | Promise<MergeBackResult>,
): Promise<MergeBackResult> {
  try { team.enqueue(item) } catch { return Promise.resolve({ merged: false, reason: 'merge-queue-recovery' }) }
  return enqueueMerge(projectPath, async () => {
    try {
      const result = await team.withMergeTurn(item.executionId, item.token, timeoutMs, fn)
      team.finishMerge(item.executionId, result.merged, result.commitHash, result.reason === 'paused' ? 'PAUSED_READY' : undefined)
      return result
    } catch {
      team.finishMerge(item.executionId, false)
      return { merged: false, reason: 'merge-queue-recovery' }
    }
  })
}
