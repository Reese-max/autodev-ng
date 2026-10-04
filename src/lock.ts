import { acquireLockLease, recoverRetainedLockLease, releaseDeadLockLease, releaseLockLease } from './lock/coordinator.js'

/**
 * Acquire a process-safe local lease. SQLite serializes the stale-owner check and
 * generation replacement, and its OS lock is released automatically after a crash.
 * Returns an ownership token, or null when another live/uncertain owner holds the lock.
 */
export function acquireLock(dir: string, staleMs = 30 * 60 * 1000): string | null {
  return acquireLockLease(dir, staleMs)
}

/** Release only the matching generation acquired by this process. */
export function releaseLock(dir: string, token?: string | null): void {
  releaseLockLease(dir, token)
}

/** Clear a Freebuff quarantine and its matching persistent lease after explicit operator confirmation. */
export function recoverRetainedLock(
  dir: string,
  token: string,
  options: { backendSafeConfirmed: boolean },
): boolean {
  return recoverRetainedLockLease(dir, token, options)
}

/** Remove only a dead or sufficiently old unknown lock; recovery-required state is preserved. */
export function releaseDeadLock(dir: string, staleMs = 30 * 60 * 1000): boolean {
  return releaseDeadLockLease(dir, staleMs)
}
