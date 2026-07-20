/**
 * 臨時 dataDir 下的端到端 smoke 入口：
 * 一次 pickReadyTask 決策 → 事件計數 → 狀態匯總輸出。
 *
 * 供回歸最小可重現；不進正式派工主路徑。
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
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

/** smoke 報告落盤檔名（相對 dataDir）。 */
export const PICK_READY_SMOKE_REPORT_FILE = 'pick-ready-smoke-report.json'

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

/** 穩定匯總輸出（排序鍵、精簡路由狀態），供回歸字串比對。 */
export interface PickReadySmokeSummary {
  readonly decision: string
  readonly fingerprint: string
  readonly eventCounts: {
    readonly total: number
    readonly byType: Readonly<Record<string, number>>
    readonly byStatus: Readonly<Record<string, number>>
  }
  readonly stateWrites: readonly string[]
  readonly routing: {
    readonly maintainOriginalPath: boolean
    readonly decision: string
    readonly isolated: readonly string[]
    readonly standby: readonly string[]
    readonly recentStatsKind: string
  }
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

function sortRecord(input: Readonly<Record<string, number>>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const key of Object.keys(input).sort()) out[key] = input[key]!
  return out
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
 * 純函式：決策 + 事件計數 + 路由狀態 → 穩定匯總物件。
 * 鍵已排序；不含 observedAt / 時間戳，利於字串快照比對。
 */
export function summarizePickReadySmoke(report: PickReadySmokeReport): PickReadySmokeSummary {
  return Object.freeze({
    decision: report.decision.branchResult,
    fingerprint: report.decision.fingerprint,
    eventCounts: Object.freeze({
      total: report.eventCounts.total,
      byType: Object.freeze(sortRecord(report.eventCounts.byType)),
      byStatus: Object.freeze(sortRecord(report.eventCounts.byStatus)),
    }),
    stateWrites: Object.freeze(
      report.stateWrites.map(write => `${write.target}:${write.status}`),
    ),
    routing: Object.freeze({
      maintainOriginalPath: report.status.maintainOriginalPath,
      decision: report.status.decision,
      isolated: Object.freeze(
        report.status.isolatedEngines.map(e => e.engine).sort(),
      ),
      standby: Object.freeze(
        report.status.standbyEngines.map(e => e.engine).sort(),
      ),
      recentStatsKind: report.status.recentStats.kind,
    }),
  })
}

/** 穩定 JSON 字串（2-space）；回歸入口的可讀輸出。 */
export function formatPickReadySmokeSummary(report: PickReadySmokeReport): string {
  return `${JSON.stringify(summarizePickReadySmoke(report), null, 2)}\n`
}

/**
 * 將匯總寫入臨時 dataDir（tmp 路徑由呼叫端提供）。
 * 僅供 smoke/回歸；正式派工不呼叫。
 */
export function writePickReadySmokeReport(
  dataDir: string,
  report: PickReadySmokeReport,
): string {
  const file = join(dataDir, PICK_READY_SMOKE_REPORT_FILE)
  writeFileSync(file, formatPickReadySmokeSummary(report), 'utf8')
  return file
}

/**
 * 端到端 smoke：追蹤一次 pickReadyTask → 計事件 → 讀路由狀態匯總。
 * `run` 應直接呼叫實際 `pickReadyTask`。
 * `writeReport: true` 時把穩定匯總落到 dataDir。
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
    readonly writeReport?: boolean
  } = {},
): Promise<PickReadySmokeReport> {
  const trace = await trackPickReadyTaskDecision(deps, run)
  const statusInput: RoutingStatusInput = {
    dataDir: deps.cfg.dataDir,
    ...(options.nowIso !== undefined ? { nowIso: options.nowIso } : {}),
    ...(options.offsetHours !== undefined ? { offsetHours: options.offsetHours } : {}),
  }
  const status = readRoutingStatus(statusInput, options.statusReaders)
  const report = buildPickReadySmokeReport({
    trace: trace as PickReadyTaskDecisionTrace<PickReadyTaskResultLike>,
    status,
  })
  if (options.writeReport) writePickReadySmokeReport(deps.cfg.dataDir, report)
  return report
}
