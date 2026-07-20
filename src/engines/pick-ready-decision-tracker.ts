/**
 * 測試專用：包住 pickReadyTask 的可觀測出口，產生可直接比對的分支指紋。
 * 正式派工不匯入此檔；追蹤時仍呼叫原 events/store，避免測試改變執行語意。
 */
import { existsSync, readFileSync } from 'node:fs'
import type { Disposition } from '../types.js'
import { routingStatePath } from './routing-state.js'

interface TrackableDeps {
  cfg: { dataDir: string }
  events: {
    append(type: string, data?: Record<string, unknown>): void
    appendOnce(type: string, data?: Record<string, unknown>): boolean
  }
  store: { report(taskId: string, disposition: Disposition): void }
}

export type PickReadyTaskResultLike =
  | string
  | { engineTag: string; fixedCost: number | undefined }
  | { kind: string; reason?: string }

export interface TrackedDecisionEvent {
  method: 'append' | 'appendOnce'
  type: string
  data: Record<string, unknown>
  status: 'sent' | 'skipped' | 'failed'
}

export type TrackedStateWrite =
  | {
      target: 'backlog'
      taskId: string
      disposition: Disposition
      status: 'written' | 'failed'
    }
  | {
      target: 'routing-state'
      status: 'created' | 'changed' | 'removed'
    }

export interface PickReadyTaskDecisionTrace<R> {
  result: R
  branchResult: string
  events: TrackedDecisionEvent[]
  stateWrites: TrackedStateWrite[]
  fingerprint: string
}

type FileSnapshot = { exists: boolean; content: string }

function snapshotRoutingState(dataDir: string): FileSnapshot {
  const file = routingStatePath(dataDir)
  if (!existsSync(file)) return { exists: false, content: '' }
  try {
    return { exists: true, content: readFileSync(file, 'utf8') }
  } catch {
    return { exists: true, content: '<unreadable>' }
  }
}

function routingStateWrite(before: FileSnapshot, after: FileSnapshot): TrackedStateWrite | undefined {
  if (!before.exists && after.exists) return { target: 'routing-state', status: 'created' }
  if (before.exists && !after.exists) return { target: 'routing-state', status: 'removed' }
  if (before.exists && after.exists && before.content !== after.content) {
    return { target: 'routing-state', status: 'changed' }
  }
  return undefined
}

export function pickReadyTaskBranchResult(result: PickReadyTaskResultLike): string {
  if (typeof result === 'string') return result
  if ('engineTag' in result) {
    const cost = result.fixedCost === undefined ? 'metered' : `fixed=${result.fixedCost}`
    return `picked:${result.engineTag}:${cost}`
  }
  return result.reason ? `${result.kind}:${result.reason}` : result.kind
}

function branchFingerprint(
  branchResult: string,
  events: readonly TrackedDecisionEvent[],
  stateWrites: readonly TrackedStateWrite[]
): string {
  // 排除 taskId、時間戳與人話 detail；保留真正決定分支的事件型別、engine 與寫入結果。
  return JSON.stringify({
    branch: branchResult,
    events: events.map(event => [
      event.method,
      event.type,
      typeof event.data.engine === 'string' ? event.data.engine : null,
      event.status,
    ]),
    stateWrites: stateWrites.map(write => write.target === 'backlog'
      ? [write.target, write.disposition.kind, write.status]
      : [write.target, write.status]),
  })
}

/** 單次執行追蹤；run 應直接呼叫實際 pickReadyTask。 */
export async function trackPickReadyTaskDecision<
  D extends TrackableDeps,
  R extends PickReadyTaskResultLike,
>(deps: D, run: (trackedDeps: D) => Promise<R>): Promise<PickReadyTaskDecisionTrace<R>> {
  const events: TrackedDecisionEvent[] = []
  const stateWrites: TrackedStateWrite[] = []
  const before = snapshotRoutingState(deps.cfg.dataDir)

  const trackedEvents = new Proxy(deps.events, {
    get(target, property) {
      if (property !== 'append' && property !== 'appendOnce') {
        const value = Reflect.get(target, property, target) as unknown
        return typeof value === 'function' ? value.bind(target) : value
      }
      return (type: string, data: Record<string, unknown> = {}) => {
        const event: TrackedDecisionEvent = { method: property, type, data: { ...data }, status: 'sent' }
        events.push(event)
        try {
          const sent = target[property](type, data)
          if (property === 'appendOnce' && sent === false) event.status = 'skipped'
          return sent
        } catch (error) {
          event.status = 'failed'
          throw error
        }
      }
    },
  })

  const trackedStore = new Proxy(deps.store, {
    get(target, property) {
      if (property !== 'report') {
        const value = Reflect.get(target, property, target) as unknown
        return typeof value === 'function' ? value.bind(target) : value
      }
      return (taskId: string, disposition: Disposition) => {
        const write: TrackedStateWrite = {
          target: 'backlog',
          taskId,
          disposition: { ...disposition },
          status: 'failed',
        }
        stateWrites.push(write)
        const result = target.report(taskId, disposition)
        write.status = 'written'
        return result
      }
    },
  })

  const trackedDeps = { ...deps, events: trackedEvents, store: trackedStore } as D
  const result = await run(trackedDeps)
  const stateWrite = routingStateWrite(before, snapshotRoutingState(deps.cfg.dataDir))
  // routing state 只會在 pickReadyTask 進候選迴圈前寫入，故排在 backlog report 之前。
  if (stateWrite) stateWrites.unshift(stateWrite)
  const branchResult = pickReadyTaskBranchResult(result)

  return {
    result,
    branchResult,
    events,
    stateWrites,
    fingerprint: branchFingerprint(branchResult, events, stateWrites),
  }
}
