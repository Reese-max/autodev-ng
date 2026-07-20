/**
 * 路由管線單一出口 helper。
 *
 * 收斂兩類出口，避免回退 shape 與事件派發規則分叉：
 * 1. 路由上下文回退（buildRoutingContext 所有失敗分支）
 * 2. 隔離 idle 結果 + 事件派發（applyStatsIsolation / loadIsolatedTagsForPick）
 *
 * 之後變更回退契約或事件派發規則，只改本檔。
 */
import { REUSE_CURRENT } from './routing-decision.js'

export type RoutingContextUnavailable = {
  kind: 'reuse-current'
  decision: typeof REUSE_CURRENT
  reason: 'unavailable'
}

export type IsolationIdleKind = 'unchanged' | 'reuse-current'

export type IsolationIdleResult = {
  kind: IsolationIdleKind
  newlyIsolated: []
  activeIsolatedTags: string[]
  reason: string
}

/** 隔離事件 payload（與 apply-stats-isolation 的 IsolationAppliedEvent 對齊）。 */
export interface IsolationEventPayload {
  engine: string
  reason: string
  sampleCount: number
  successRate: number
  untilTs: string
}

/** 路由上下文不可用時的唯一回退結果。 */
export function routingContextUnavailable(): RoutingContextUnavailable {
  return { kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'unavailable' }
}

/**
 * 隔離管線非 applied 的唯一結果出口。
 * newlyIsolated 固定為空 → finalizeIsolationForPick 不會派事件。
 */
export function isolationIdle(
  kind: IsolationIdleKind,
  activeIsolatedTags: readonly string[],
  reason: string
): IsolationIdleResult {
  return {
    kind,
    newlyIsolated: [],
    activeIsolatedTags: [...activeIsolatedTags],
    reason,
  }
}

/**
 * 隔離事件派發唯一出口。
 * 只對 newlyIsolated 派發；回退/unchanged 因陣列為空而不進迴圈。
 * onIsolated 拋錯 fail-open，不阻斷派工。
 */
export function dispatchIsolationEvents(
  newlyIsolated: readonly IsolationEventPayload[],
  onIsolated?: (ev: IsolationEventPayload) => void
): void {
  if (!onIsolated || newlyIsolated.length === 0) return
  for (const ev of newlyIsolated) {
    try {
      onIsolated(ev)
    } catch {
      /* fail-open */
    }
  }
}

/**
 * pick 路徑完成出口：先派事件（若有 newlyIsolated），再回 active tags。
 * 將「回退不派事件 / 新隔離才派」收斂於單一 helper。
 */
export function finalizeIsolationForPick(
  result: {
    newlyIsolated: readonly IsolationEventPayload[]
    activeIsolatedTags: readonly string[]
  },
  onIsolated?: (ev: IsolationEventPayload) => void
): string[] {
  dispatchIsolationEvents(result.newlyIsolated, onIsolated)
  return [...result.activeIsolatedTags]
}
