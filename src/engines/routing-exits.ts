/**
 * 路由管線單一出口 helper。
 *
 * 收斂兩類出口，避免回退 shape 與事件派發規則分叉：
 * 1. 路由上下文回退（buildRoutingContext 所有失敗分支）
 * 2. 隔離 idle 結果 + 事件派發（applyStatsIsolation / loadIsolatedTagsForPick）
 *
 * 之後變更回退契約或事件派發規則，只改本檔。
 */
import { z } from 'zod'
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

export const ROUTING_EVENT_SCHEMA_VERSION = 1 as const

export const ROUTING_EVENT_TYPES = {
  isolated: 'engine-route-isolated',
  probe: 'engine-route-probe',
  promoted: 'engine-route-promoted',
} as const

const routingEventBase = {
  schemaVersion: z.literal(ROUTING_EVENT_SCHEMA_VERSION),
  engine: z.string().trim().min(1),
}
const eventTimestamp = z.string().datetime({ offset: true })

/** 三類路由事件的固定 v1 payload；strict 拒收缺欄、錯型別與未知欄位。 */
export const IsolationEventPayloadSchema = z.object({
  ...routingEventBase,
  reason: z.string().trim().min(1),
  sampleCount: z.number().int().positive(),
  successRate: z.number().min(0).max(1),
  untilTs: eventTimestamp,
}).strict()

export const ProbeEventPayloadSchema = z.object({
  ...routingEventBase,
  hits: z.number().int().positive(),
  lastTs: eventTimestamp,
}).strict()

export const PromotionEventPayloadSchema = z.object({
  ...routingEventBase,
  score: z.number().int().nonnegative(),
  promotedAt: eventTimestamp,
}).strict()

export type IsolationEventPayload = z.infer<typeof IsolationEventPayloadSchema>
export type ProbeEventPayload = z.infer<typeof ProbeEventPayloadSchema>
export type PromotionEventPayload = z.infer<typeof PromotionEventPayloadSchema>
export type RoutingEventType = typeof ROUTING_EVENT_TYPES[keyof typeof ROUTING_EVENT_TYPES]

export interface RoutingEventPayloadByType {
  'engine-route-isolated': IsolationEventPayload
  'engine-route-probe': ProbeEventPayload
  'engine-route-promoted': PromotionEventPayload
}

export const ROUTING_EVENT_PAYLOAD_SCHEMAS = {
  [ROUTING_EVENT_TYPES.isolated]: IsolationEventPayloadSchema,
  [ROUTING_EVENT_TYPES.probe]: ProbeEventPayloadSchema,
  [ROUTING_EVENT_TYPES.promoted]: PromotionEventPayloadSchema,
} as const

/** 驗證事件 payload；不完整、版本不符或多欄一律拒收。 */
export function parseRoutingEventPayload<T extends RoutingEventType>(
  type: T,
  payload: unknown
): RoutingEventPayloadByType[T] | undefined {
  const parsed = ROUTING_EVENT_PAYLOAD_SCHEMAS[type].safeParse(payload)
  return parsed.success ? parsed.data as RoutingEventPayloadByType[T] : undefined
}

/** 路由事件共用 fail-open 出口；拒收或 consumer 失敗都只回 false。 */
export function dispatchRoutingEvent<T extends RoutingEventType>(
  type: T,
  payload: unknown,
  onEvent?: (type: T, payload: RoutingEventPayloadByType[T]) => void
): boolean {
  if (!onEvent) return false
  const parsed = parseRoutingEventPayload(type, payload)
  if (!parsed) return false
  try {
    onEvent(type, parsed)
    return true
  } catch {
    return false
  }
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
  newlyIsolated: readonly unknown[],
  onIsolated?: (ev: IsolationEventPayload) => void
): void {
  if (!onIsolated || newlyIsolated.length === 0) return
  for (const ev of newlyIsolated) {
    dispatchRoutingEvent(ROUTING_EVENT_TYPES.isolated, ev, (_type, payload) => onIsolated(payload))
  }
}

/**
 * pick 路徑完成出口：先派事件（若有 newlyIsolated），再回 active tags。
 * 將「回退不派事件 / 新隔離才派」收斂於單一 helper。
 */
export function finalizeIsolationForPick(
  result: {
    newlyIsolated: readonly unknown[]
    activeIsolatedTags: readonly string[]
  },
  onIsolated?: (ev: IsolationEventPayload) => void
): string[] {
  dispatchIsolationEvents(result.newlyIsolated, onIsolated)
  return [...result.activeIsolatedTags]
}
