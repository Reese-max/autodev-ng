import { describe, expect, test } from 'vitest'
import Database from 'better-sqlite3'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LongHorizonBackend, runDir } from '../src/backends/long-horizon.js'
import type { AuditorFn } from '../src/backends/types.js'

const goal = { objective: 'bounded fixture', verifyCommand: 'node --version' }
const auditor: AuditorFn = async () => ({
  outcome: 'verified', detail: 'fixture', verifyStatus: 'pass',
  gitSha: 'a'.repeat(40), goalAchieved: true,
})

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'adng-lh-lease-'))
  const cwd = join(root, 'project')
  const dataDir = join(root, 'data')
  mkdirSync(cwd)
  mkdirSync(dataDir)
  return { root, cwd, dataDir }
}

function leaseCount(dir: string): number {
  const db = new Database(join(dir, '.autodev-lock-coordination.sqlite'), { readonly: true })
  try {
    return (db.prepare('SELECT COUNT(*) AS count FROM lock_leases').get() as { count: number }).count
  } finally { db.close() }
}

describe('LongHorizon generation leases', () => {
  test('a completed driver releases both its directory and committed lease', async () => {
    const { root, cwd, dataDir } = fixture()
    try {
      const backend = new LongHorizonBackend({
        dataDir, auditor,
        executor: async () => ({ ok: true, output: '', costUsd: 0 }),
      })
      const handle = await backend.start(goal, { cwd })
      expect((await handle.done).phase).toBe('complete')
      const dir = runDir(dataDir, handle.runId)
      expect(existsSync(join(dir, 'drive.lock'))).toBe(false)
      expect(leaseCount(dir)).toBe(0)
      expect((await backend.status(handle.runId)).driverAlive).toBe(false)
    } finally { rmSync(root, { recursive: true, force: true }) }
  })

  test('a second resume observes the live generation and cannot dispatch another executor', async () => {
    const { root, cwd, dataDir } = fixture()
    let finish!: () => void
    const pending = new Promise<void>(resolve => { finish = resolve })
    let entered!: () => void
    const started = new Promise<void>(resolve => { entered = resolve })
    let calls = 0
    let done: Promise<unknown> | undefined
    try {
      const backend = new LongHorizonBackend({
        dataDir, auditor,
        executor: async () => {
          calls++
          entered()
          await pending
          return { ok: true, output: '', costUsd: 0 }
        },
      })
      const handle = await backend.start(goal, { cwd })
      done = handle.done
      await started
      const dir = runDir(dataDir, handle.runId)
      const owner = JSON.parse(readFileSync(join(dir, 'drive.lock', 'pid.json'), 'utf8'))
      expect(owner.token).toEqual(expect.any(String))
      expect(leaseCount(dir)).toBe(1)
      const second = new LongHorizonBackend({
        dataDir, auditor,
        executor: async () => { calls++; throw new Error('duplicate driver dispatched') },
      })
      const snapshot = await (await second.resume(handle.runId)).done
      expect(snapshot.driverAlive).toBe(true)
      expect(calls).toBe(1)
      expect(JSON.parse(readFileSync(join(dir, 'drive.lock', 'pid.json'), 'utf8')).token).toBe(owner.token)
      finish()
      expect((await handle.done).phase).toBe('complete')
      expect(leaseCount(dir)).toBe(0)
      expect(existsSync(join(dir, 'drive.lock'))).toBe(false)
    } finally {
      finish()
      await done
      rmSync(root, { recursive: true, force: true })
    }
  })
})
