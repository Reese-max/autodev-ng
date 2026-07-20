export const ISOLATE = '隔離' as const
export const PROBE = '試探' as const
export const PROMOTE = '晉升' as const
export const REUSE_CURRENT = '沿用現狀' as const

export type RoutingDecision =
  | typeof ISOLATE
  | typeof PROBE
  | typeof PROMOTE
  | typeof REUSE_CURRENT
