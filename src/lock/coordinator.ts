import Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { realpathSync, statSync, mkdirSync, rmSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import {
  dirAgeMs, generationOf, ownerAlive, readPidFile,
  removeIfUnclaimed, writeOwnPidFileOrCleanup,
} from './internal.js'
import type { PidInfo } from './internal.js'

const COORDINATOR_FILE = '.autodev-lock-coordination.sqlite'
const ACQUIRE_BUSY_TIMEOUT_MS = 1_000
const RELEASE_BUSY_TIMEOUT_MS = 5_000
const DEAD_LOCK_BUSY_TIMEOUT_MS = 100

interface LeaseRow {
  lock_key: string
  pid: number
  started_at: string
  token: string
}

interface Coordinator {
  db: Database.Database
  lockDir: string
  lockKey: string
}

export interface AcquireLockTestHooks {
  afterStaleObservation?: () => void
  readProcessStartTime?: (pid: number) => string
}

function errno(error: unknown): string | undefined {
  return (error as NodeJS.ErrnoException).code
}

function pathExists(path: string): boolean {
  try {
    statSync(path)
    return true
  } catch (error) {
    if (errno(error) === 'ENOENT') return false
    throw error
  }
}

function canonicalLockDir(dir: string): string {
  const absolute = resolve(dir)
  try {
    return realpathSync(absolute)
  } catch (error) {
    if (errno(error) !== 'ENOENT') throw error
  }
  return resolve(realpathSync(dirname(absolute)), basename(absolute))
}

function coordinatorFor(dir: string, timeout: number): Coordinator {
  const lockDir = canonicalLockDir(dir)
  const parent = dirname(lockDir)
  const lockKey = process.platform === 'win32' ? lockDir.toLowerCase() : lockDir
  const db = new Database(join(parent, COORDINATOR_FILE), { timeout })
  return { db, lockDir, lockKey }
}

function busy(error: unknown): boolean {
  const code = errno(error)
  return code === 'SQLITE_BUSY' || code === 'SQLITE_LOCKED'
}

function begin(db: Database.Database): void {
  db.exec('BEGIN IMMEDIATE')
  db.exec(`CREATE TABLE IF NOT EXISTS lock_leases (
    lock_key TEXT PRIMARY KEY,
    pid INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    token TEXT NOT NULL
  )`)
}

function rollback(db: Database.Database): void {
  if (db.inTransaction) db.exec('ROLLBACK')
}

function closeQuietly(db: Database.Database): void {
  try { rollback(db) } catch { /* the original filesystem or SQLite error wins */ }
  try { db.close() } catch { /* closing after rollback must not hide the original error */ }
}

function leaseFor(db: Database.Database, lockKey: string): LeaseRow | undefined {
  return db.prepare('SELECT lock_key, pid, started_at, token FROM lock_leases WHERE lock_key = ?').get(lockKey) as LeaseRow | undefined
}

function ownerInfo(lease: LeaseRow): PidInfo {
  return { pid: lease.pid, startedAt: lease.started_at, token: lease.token }
}

function recoveryRequired(lockDir: string): boolean {
  return pathExists(join(lockDir, 'recovery-required.json'))
}

function lockDirStats(lockDir: string): ReturnType<typeof statSync> | null {
  try {
    const stat = statSync(lockDir)
    if (!stat.isDirectory()) {
      const error = new Error(`Lock path is not a directory: ${lockDir}`) as NodeJS.ErrnoException
      error.code = 'ENOTDIR'
      throw error
    }
    return stat
  } catch (error) {
    if (errno(error) === 'ENOENT') return null
    throw error
  }
}

function removeOwnGeneration(lockDir: string, token: string): void {
  try {
    const current = readPidFile(lockDir)
    if (current && current.pid === process.pid && generationOf(current) === token) {
      rmSync(lockDir, { recursive: true, force: true })
    }
  } catch {
    // Keep the original acquisition error. A failed cleanup leaves the path fail-closed.
  }
}

/**
 * SQLite's OS-backed RESERVED lock serializes stale observation, ownership replacement,
 * and release. The short transaction is the compare-and-swap boundary; a crashed process
 * cannot leave it held, and no lock directory is renamed out from under a newer acquirer.
 */
export function acquireLockLease(dir: string, staleMs: number, testHooks?: AcquireLockTestHooks): string | null {
  const token = randomUUID()
  const { db, lockDir, lockKey } = coordinatorFor(dir, ACQUIRE_BUSY_TIMEOUT_MS)
  let transactionStarted = false
  let createdDir = false
  let wroteOwnGeneration = false
  const isOwnerAlive = (info: PidInfo): boolean => ownerAlive(info, testHooks?.readProcessStartTime)
  try {
    try {
      begin(db)
      transactionStarted = true
    } catch (error) {
      if (busy(error)) return null
      throw error
    }

    if (recoveryRequired(lockDir)) return null

    const lease = leaseFor(db, lockKey)
    const stat = lockDirStats(lockDir)
    const diskOwner = stat ? readPidFile(lockDir) : null

    // Honor both the transactional owner record and pre-upgrade pid.json locks. A live
    // PID wins over mtime; unreadable/invalid metadata remains fail-closed until stale.
    if (lease && isOwnerAlive(ownerInfo(lease))) return null
    if (diskOwner && isOwnerAlive(diskOwner)) return null
    if (stat && !diskOwner && !lease) {
      const age = dirAgeMs(lockDir)
      if (age === null || age <= staleMs) return null
    }
    if (stat && !diskOwner && lease) {
      const age = dirAgeMs(lockDir)
      if (age === null || age <= staleMs) return null
    }

    // Internal-only deterministic seam for the Windows multi-process race regression.
    // It runs while BEGIN IMMEDIATE is held, after this generation was classified stale.
    if (stat) testHooks?.afterStaleObservation?.()

    if (!stat) {
      try {
        mkdirSync(lockDir, { recursive: false })
        createdDir = true
      } catch (error) {
        if (errno(error) !== 'EEXIST') throw error
        // A legacy process may not use the SQLite coordinator. Re-read its state rather
        // than assuming the empty-path observation still applies.
        const raced = readPidFile(lockDir)
        if (raced && ownerAlive(raced)) return null
        if (!raced) {
          const age = dirAgeMs(lockDir)
          if (age === null || age <= staleMs) return null
        }
      }
    }

    if (recoveryRequired(lockDir)) return null

    const startedAt = new Date().toISOString()
    writeOwnPidFileOrCleanup(lockDir, token, startedAt)
    wroteOwnGeneration = true
    db.prepare(`INSERT INTO lock_leases(lock_key, pid, started_at, token)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(lock_key) DO UPDATE SET pid=excluded.pid, started_at=excluded.started_at, token=excluded.token`)
      .run(lockKey, process.pid, startedAt, token)
    db.exec('COMMIT')
    transactionStarted = false
    return token
  } catch (error) {
    if (transactionStarted) {
      try { rollback(db) } catch { /* retain the original error */ }
    }
    if (wroteOwnGeneration) removeOwnGeneration(lockDir, token)
    else if (createdDir) removeIfUnclaimed(lockDir)
    throw error
  } finally {
    closeQuietly(db)
  }
}

/** Only the process/token that owns the committed row may remove this generation. */
export function releaseLockLease(dir: string, token?: string | null): void {
  if (!token) return
  const { db, lockDir, lockKey } = coordinatorFor(dir, RELEASE_BUSY_TIMEOUT_MS)
  let transactionStarted = false
  try {
    begin(db)
    transactionStarted = true
    const lease = leaseFor(db, lockKey)
    const diskOwner = lockDirStats(lockDir) ? readPidFile(lockDir) : null
    const rowMatches = lease?.token === token && lease.pid === process.pid
    const legacyMatches = !lease && token.startsWith('legacy:') && diskOwner?.pid === process.pid && generationOf(diskOwner) === token
    if ((!rowMatches && !legacyMatches) || !diskOwner || generationOf(diskOwner) !== token) return

    rmSync(lockDir, { recursive: true, force: true })
    if (rowMatches) db.prepare('DELETE FROM lock_leases WHERE lock_key = ? AND token = ?').run(lockKey, token)
    db.exec('COMMIT')
    transactionStarted = false
  } catch (error) {
    if (transactionStarted) {
      try { rollback(db) } catch { /* retain the original error */ }
    }
    throw error
  } finally {
    closeQuietly(db)
  }
}

/** Supervisor-only cleanup. The caller never becomes owner; an uncertain backend stays put. */
export function releaseDeadLockLease(dir: string, staleMs: number): boolean {
  let coordinator: Coordinator
  try {
    coordinator = coordinatorFor(dir, DEAD_LOCK_BUSY_TIMEOUT_MS)
  } catch (error) {
    // A missing lock directory and parent mean there is nothing for the
    // supervisor to release. Keep cleanup fail-closed for every other error.
    if (errno(error) === 'ENOENT') return false
    throw error
  }
  const { db, lockDir, lockKey } = coordinator
  let transactionStarted = false
  try {
    try {
      begin(db)
      transactionStarted = true
    } catch (error) {
      if (busy(error)) return false
      throw error
    }

    if (recoveryRequired(lockDir)) return false
    const lease = leaseFor(db, lockKey)
    const stat = lockDirStats(lockDir)
    const diskOwner = stat ? readPidFile(lockDir) : null
    if (!lease && !stat) return false
    if (lease && ownerAlive(ownerInfo(lease))) return false
    if (diskOwner && ownerAlive(diskOwner)) return false
    if (stat && !diskOwner) {
      const age = dirAgeMs(lockDir)
      if (age === null || age <= staleMs) return false
    }

    if (stat) rmSync(lockDir, { recursive: true, force: true })
    if (lease) db.prepare('DELETE FROM lock_leases WHERE lock_key = ? AND token = ?').run(lockKey, lease.token)
    db.exec('COMMIT')
    transactionStarted = false
    return true
  } catch (error) {
    if (transactionStarted) {
      try { rollback(db) } catch { /* retain the original error */ }
    }
    throw error
  } finally {
    closeQuietly(db)
  }
}
