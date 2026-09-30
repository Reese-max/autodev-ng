import { closeSync, mkdirSync, openSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PROCESS_STARTED_AT = Date.now() - process.uptime() * 1000

function processIsAlive(pid: number): boolean {
  try { process.kill(pid, 0); return true } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH'
  }
}

function staleInventoryLock(lockFile: string): boolean {
  let stat
  try { stat = statSync(lockFile) } catch { return false }
  try {
    const owner = JSON.parse(readFileSync(lockFile, 'utf8')) as { pid?: unknown; processStartedAt?: unknown }
    if (typeof owner.pid !== 'number' || !Number.isInteger(owner.pid) || typeof owner.processStartedAt !== 'number' || !Number.isFinite(owner.processStartedAt))
      return Date.now() - stat.mtimeMs > 60_000
    const pid = owner.pid as number
    if (pid === process.pid) return Math.abs(owner.processStartedAt - PROCESS_STARTED_AT) > 2_000
    return !processIsAlive(pid)
  } catch { return Date.now() - stat.mtimeMs > 60_000 }
}

/**
 * Serialize execution inventory mutations. Stale locks intentionally fail closed:
 * reclaiming one by path can race with another process acquiring a replacement lock.
 */
export function withInventoryLock<T>(dataDir: string, action: () => T): T {
  const root = join(dataDir, 'executions'), lockFile = join(root, '.inventory.lock')
  mkdirSync(root, { recursive: true })
  let descriptor: number
  try { descriptor = openSync(lockFile, 'wx') }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST' && staleInventoryLock(lockFile))
      throw new Error('stale execution inventory lock requires operator recovery')
    throw new Error('execution inventory update is in progress or its owner is unknown')
  }

  try {
    writeFileSync(descriptor, JSON.stringify({ pid: process.pid, processStartedAt: PROCESS_STARTED_AT, acquiredAt: Date.now() }))
  } catch {
    try { closeSync(descriptor) } catch { /* preserve fail-closed lock path */ }
    throw new Error('execution inventory lock could not be initialized; operator recovery is required')
  }

  try { return action() } finally {
    closeSync(descriptor)
    unlinkSync(lockFile)
  }
}
