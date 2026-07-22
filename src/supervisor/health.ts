/**
 * Supervisor daemon health classification — pure decision helper.
 *
 * Three fixed actions:
 * - launch: process is gone
 * - reap: alive but wedged (stale empty, or hard-cap without engine children)
 * - keep: otherwise leave running
 *
 * Fail-open: any missing/unknown probe field keeps the daemon (never kill on uncertainty).
 */

export type DaemonAction = 'launch' | 'reap' | 'keep'

export type ClassifyDaemonInput = {
  pidAlive: boolean
  /** Age of last heartbeat in ms; null/omitted = no heartbeat info */
  heartbeatAgeMs?: number | null
  childCount: number
  staleThresholdMs: number
  /**
   * Hard upper bound on heartbeat age (ms). Used only for the second reap branch
   * (alive + no engine children). null/omitted = cannot evaluate second branch → keep.
   */
  hardCapMs?: number | null
  /**
   * Whether the process tree contains a known engine child (node/codex/...).
   * null/omitted = unknown → fail-open keep for the hard-cap branch.
   */
  hasEngineChild?: boolean | null
}

/**
 * Classify what the supervisor should do with a daemon.
 *
 * Branches (fixed):
 * 1. !pidAlive => launch
 * 2. pidAlive && heartbeatAgeMs > staleThresholdMs && childCount === 0 => reap
 * 3. pidAlive && heartbeatAgeMs > hardCapMs && !hasEngineChild => reap
 *    (requires hardCapMs and hasEngineChild both known; otherwise fail-open keep)
 * 4. else => keep
 */
export function classifyDaemon({
  pidAlive,
  heartbeatAgeMs,
  childCount,
  staleThresholdMs,
  hardCapMs,
  hasEngineChild,
}: ClassifyDaemonInput): DaemonAction {
  if (!pidAlive) return 'launch'

  // Branch 1: empty wedged daemon past soft stale threshold
  if (
    heartbeatAgeMs != null &&
    heartbeatAgeMs > staleThresholdMs &&
    childCount === 0
  ) {
    return 'reap'
  }

  // Branch 2: past hard cap with no engine-type children (shell residue only)
  // Explicit null/undefined checks — !hasEngineChild alone would reap on "unknown"
  if (
    heartbeatAgeMs != null &&
    hardCapMs != null &&
    hasEngineChild != null &&
    heartbeatAgeMs > hardCapMs &&
    !hasEngineChild
  ) {
    return 'reap'
  }

  return 'keep'
}
