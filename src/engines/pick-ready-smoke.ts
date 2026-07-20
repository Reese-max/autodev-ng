/**
 * 臨時 dataDir 下的端到端 smoke 入口：
 * 一次 pickReadyTask 決策 → 事件計數 → 狀態匯總輸出。
 *
 * 供回歸最小可重現；不進正式派工主路徑。
 */
import {
  trackPickReadyTaskDecision,
  type PickReadyTaskDecisionTrace,
  type TrackedDecisionEvent,
  type TrackedStateWrite,
} from './pick-ready-decision-tracker.js'
import type { PickReadyTaskResultLike } from './pick-ready-routing-summary.js'
import {
  readRoutingStatus,
  type RoutingStatusInput,
  type RoutingStatusReaders,
  type RoutingStatusReport,
} from './routing-status.js'

export interface PickReadySmokeEventCounts {
  readonly total: number
  /** 依事件 type 計數（append / appendOnce 合計） */
  readonly byType: Readonly<Record<string, number>>
  /** 依追蹤 status：sent / skipped / failed */
  readonly byStatus: Readonly<Record<string, number>>
}

export interface PickReadySmokeStateWriteSummary {
  readonly target: TrackedStateWrite['target']
  readonly status: string
}

export interface PickReadySmokeReport {
  readonly decision: {
    readonly branchResult: string
    readonly fingerprint: string
  }
  readonly eventCounts: PickReadySmokeEventCounts
  readonly stateWrites: readonly PickReadySmokeStateWriteSummary[]
  readonly status: RoutingStatusReport
}

interface TrackableDeps {
  cfg: { dataDir: string }
  events: {
    append(type: string, data?: Record<string, unknown>): void
    appendOnce(type: string, data?: Record<string, unknown>): boolean
  }
  store: {
    report(taskId: string, disposition: { kind: string; [k: string]: unknown }): void
  }
}

/** 純函式：由追蹤事件列表產出計數（不讀檔、不寫狀態）。 */
export function countTrackedEvents(
  events: readonly TrackedDecisionEvent[],
): PickReadySmokeEventCounts {
  const byType: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  for (const event of events) {
    byType[event.type] = (byType[event.type] ?? 0) + 1
    byStatus[event.status] = (byStatus[event.status] ?? 0) + 1
  }
  return Object.freeze({
    total: events.length,
    byType: Object.freeze({ ...byType }),
    byStatus: Object.freeze({ ...byStatus }),
  })
}

/** 純函式：組裝 smoke 報告（決策指紋 + 事件計數 + 狀態匯總）。 */
export function buildPickReadySmokeReport(input: {
  readonly trace: PickReadyTaskDecisionTrace<PickReadyTaskResultLike>
  readonly status: RoutingStatusReport
}): PickReadySmokeReport {
  const { trace, status } = input
  return Object.freeze({
    decision: Object.freeze({
      branchResult: trace.branchResult,
      fingerprint: trace.fingerprint,
    }),
    eventCounts: countTrackedEvents(trace.events),
    stateWrites: Object.freeze(
      trace.stateWrites.map(write =>
        Object.freeze({
          target: write.target,
          status: write.status,
        }),
      ),
    ),
    status,
  })
}

/**
 * 端到端 smoke：追蹤一次 pickReadyTask → 計事件 → 讀路由狀態匯總。
 * `run` 應直接呼叫實際 `pickReadyTask`。
 */
export async function runPickReadySmoke<
  D extends TrackableDeps,
  R extends PickReadyTaskResultLike,
>(
  deps: D,
  run: (trackedDeps: D) => Promise<R>,
  options: {
    readonly nowIso?: string
    readonly offsetHours?: number
    readonly statusReaders?: RoutingStatusReaders
  } = {},
): Promise<PickReadySmokeReport> {
  const trace = await trackPickReadyTaskDecision(deps, run)
  const statusInput: RoutingStatusInput = {
    dataDir: deps.cfg.dataDir,
    ...(options.nowIso !== undefined ? { nowIso: options.nowIso } : {}),
    ...(options.offsetHours !== undefined ? { offsetHours: options.offsetHours } : {}),
  }
  const status = readRoutingStatus(statusInput, options.statusReaders)
  return buildPickReadySmokeReport({
    trace: trace as PickReadyTaskDecisionTrace<PickReadyTaskResultLike>,
    status,
  })
}
