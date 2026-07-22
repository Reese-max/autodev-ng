/**
 * Supervisor daemon health classification — pure decision helper.
 *
 * Three fixed actions:
 * - launch: process is gone
 * - reap: alive but heartbeat stale and no children (wedged empty daemon)
 * - keep: otherwise leave running
 */

export type DaemonAction = 'launch' | 'reap' | 'keep'

export type ClassifyDaemonInput = {
  pidAlive: boolean
  /** Age of last heartbeat in ms; null/omitted = no heartbeat info */
  heartbeatAgeMs?: number | null
  childCount: number
  staleThresholdMs: number
}

/**
 * Classify what the supervisor should do with a daemon.
 *
 * Branches (fixed):
 * 1. !pidAlive => launch
 * 2. pidAlive && heartbeatAgeMs > staleThresholdMs && childCount === 0 => reap
 * 3. else => keep
 */
export function classifyDaemon({
  pidAlive,
  heartbeatAgeMs,
  childCount,
  staleThresholdMs,
}: ClassifyDaemonInput): DaemonAction {
  if (!pidAlive) return 'launch'
  if (
    heartbeatAgeMs != null &&
    heartbeatAgeMs > staleThresholdMs &&
    childCount === 0
  ) {
    return 'reap'
  }
  return 'keep'
}
