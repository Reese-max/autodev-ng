import { closeSync, lstatSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PROCESS_STARTED_AT = Date.now() - process.uptime() * 1000

/** Contention never grants permission to inspect or mutate the protected inventory. */
export class InventoryLockBusyError extends Error {
  constructor() {
    super('execution inventory update is in progress or its owner is unknown')
    this.name = 'InventoryLockBusyError'
  }
}

function processIsAlive(pid: number): boolean {
  try { process.kill(pid, 0); return true } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH'
  }
}

function inventoryLockState(lockFile: string): 'busy' | 'stale' | 'unknown' {
  let stat
  try { stat = lstatSync(lockFile) } catch (error) {
    // The successful owner may release after our exclusive open saw EEXIST.
    return (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'busy' : 'unknown'
  }
  if (!stat.isFile() || stat.size > 1024) return 'unknown'
  try {
    const owner = JSON.parse(readFileSync(lockFile, 'utf8')) as { pid?: unknown; processStartedAt?: unknown }
    if (typeof owner.pid !== 'number' || !Number.isInteger(owner.pid) || owner.pid <= 0 || typeof owner.processStartedAt !== 'number' || !Number.isFinite(owner.processStartedAt))
      return Date.now() - stat.mtimeMs > 60_000 ? 'stale' : 'busy'
    const pid = owner.pid as number
    if (pid === process.pid) return Math.abs(owner.processStartedAt - PROCESS_STARTED_AT) > 2_000 ? 'stale' : 'busy'
    return processIsAlive(pid) ? 'busy' : 'stale'
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 'busy'
    if (!(error instanceof SyntaxError)) return 'unknown'
    // A contender can see the new empty lock before its owner JSON is written.
    return Date.now() - stat.mtimeMs > 60_000 ? 'stale' : 'busy'
  }
}

/**
 * Serialize execution inventory mutations. Stale locks intentionally fail closed:
 * reclaiming one by path can race with another process acquiring a replacement lock.
 */
export function withInventoryLock<T>(dataDir: string, action: () => T, options: { retainOnError?: boolean } = {}): T {
  const root = join(dataDir, 'executions'), lockFile = join(root, '.inventory.lock')
  mkdirSync(root, { recursive: true })
  let descriptor: number
  try { descriptor = openSync(lockFile, 'wx') }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      const state = inventoryLockState(lockFile)
      if (state === 'stale') throw new Error('stale execution inventory lock requires operator recovery')
      if (state === 'busy') throw new InventoryLockBusyError()
    }
    throw new Error('execution inventory update is in progress or its owner is unknown')
  }

  try {
    writeFileSync(descriptor, JSON.stringify({ pid: process.pid, processStartedAt: PROCESS_STARTED_AT, acquiredAt: Date.now() }))
  } catch {
    try { closeSync(descriptor) } catch { /* preserve fail-closed lock path */ }
    throw new Error('execution inventory lock could not be initialized; operator recovery is required')
  }

  let retain = false
  try { return action() } catch (error) {
    retain = options.retainOnError === true
    throw error
  } finally {
    closeSync(descriptor)
    if (!retain) unlinkSync(lockFile)
  }
}
