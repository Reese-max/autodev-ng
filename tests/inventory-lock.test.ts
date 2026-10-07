import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Worker } from 'node:worker_threads'
import { afterEach, expect, test, vi } from 'vitest'

const releaseRace = vi.hoisted(() => ({ at: undefined as 'stat' | 'read' | undefined }))
vi.mock('node:fs', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return { ...actual,
    lstatSync(...args: Parameters<typeof actual.lstatSync>) {
      if (releaseRace.at === 'stat' && String(args[0]).endsWith('.inventory.lock')) {
        releaseRace.at = undefined; actual.unlinkSync(args[0])
      }
      return actual.lstatSync(...args)
    },
    readFileSync(...args: Parameters<typeof actual.readFileSync>) {
      if (releaseRace.at === 'read' && typeof args[0] !== 'number' && String(args[0]).endsWith('.inventory.lock')) {
        releaseRace.at = undefined; actual.unlinkSync(args[0])
      }
      return actual.readFileSync(...args)
    },
  }
})
import { InventoryLockBusyError, withInventoryLock } from '../src/engines/inventory-lock.js'
import { readExecutions } from '../src/engines/execution-observation.js'

const roots: string[] = []
afterEach(() => { releaseRace.at = undefined; for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

test('two concurrent contenders fail closed on a stale lock without either reclaiming it', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-stale-inventory-lock-'))
  roots.push(root)
  const executionRoot = join(root, 'executions'), lockFile = join(executionRoot, '.inventory.lock')
  mkdirSync(executionRoot, { recursive: true })
  writeFileSync(lockFile, '{unknown owner')
  utimesSync(lockFile, new Date(0), new Date(0))
  const originalLock = readFileSync(lockFile, 'utf8')
  const moduleUrl = new URL('../src/engines/inventory-lock.ts', import.meta.url).href
  const script = `
    const { parentPort, workerData } = require('node:worker_threads');
    (async () => {
      const { withInventoryLock } = await import(workerData.moduleUrl);
      parentPort.postMessage({ ready: true });
      parentPort.once('message', () => {
        let entered = false;
        try { withInventoryLock(workerData.dataDir, () => { entered = true; }); parentPort.postMessage({ entered }); }
        catch (error) { parentPort.postMessage({ entered, error: String(error) }); }
        parentPort.close();
      });
    })().catch(error => { parentPort.postMessage({ setupError: String(error) }); parentPort.close(); });
  `
  const launch = () => {
    let readyResolve!: () => void, resultResolve!: (value: { entered: boolean; error?: string }) => void
    let reject!: (error: unknown) => void
    const ready = new Promise<void>((resolve, rejectReady) => { readyResolve = resolve; reject = rejectReady })
    const result = new Promise<{ entered: boolean; error?: string }>((resolve, rejectResult) => {
      resultResolve = resolve
      const priorReject = reject
      reject = error => { priorReject(error); rejectResult(error) }
    })
    const worker = new Worker(script, { eval: true, workerData: { moduleUrl, dataDir: root } })
    worker.on('message', (message: { ready?: boolean; setupError?: string; entered?: boolean; error?: string }) => {
      if (message.ready) readyResolve()
      else if (message.setupError) reject(new Error(message.setupError))
      else resultResolve({ entered: Boolean(message.entered), error: message.error })
    })
    worker.on('error', error => reject(error))
    worker.on('exit', code => { if (code !== 0) reject(new Error('inventory lock worker exited with code ' + code)) })
    return { worker, ready, result }
  }

  const contenders = [launch(), launch()]
  await Promise.all(contenders.map(contender => contender.ready))
  for (const contender of contenders) contender.worker.postMessage('attempt')
  const results = await Promise.all(contenders.map(contender => contender.result))

  expect(results).toHaveLength(2)
  expect(results.every(result => !result.entered && result.error?.includes('stale execution inventory lock requires operator recovery'))).toBe(true)
  expect(readFileSync(lockFile, 'utf8')).toBe(originalLock)
}, 15_000)

test('a live lock rejects another writer and releases after the successful owner finishes', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-live-inventory-lock-'))
  roots.push(root)
  const lock = join(root, 'executions', '.inventory.lock')
  withInventoryLock(root, () => {
    const owner = readFileSync(lock, 'utf8')
    expect(() => withInventoryLock(root, () => 'unsafe writer')).toThrow(InventoryLockBusyError)
    expect(() => withInventoryLock(root, () => { throw new Error('second writer entered') })).toThrow('update is in progress')
    expect(readFileSync(lock, 'utf8')).toBe(owner)
  })
  expect(existsSync(lock)).toBe(false)
  expect(withInventoryLock(root, () => 'next writer')).toBe('next writer')
})

test('a fresh empty lock defers contention during owner initialization and becomes recovery evidence when aged', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-initializing-inventory-lock-'))
  roots.push(root); mkdirSync(join(root, 'executions'))
  const lock = join(root, 'executions', '.inventory.lock')
  writeFileSync(lock, '')
  expect(() => withInventoryLock(root, () => 'unsafe writer')).toThrow(InventoryLockBusyError)
  expect(readFileSync(lock, 'utf8')).toBe('')
  utimesSync(lock, new Date(0), new Date(0))
  expect(() => withInventoryLock(root, () => 'unsafe writer')).toThrow('stale execution inventory lock requires operator recovery')
  expect(readFileSync(lock, 'utf8')).toBe('')
})

test('an oversized unknown owner stays untouched and fail-closed', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-oversized-inventory-lock-'))
  roots.push(root); mkdirSync(join(root, 'executions'))
  const lock = join(root, 'executions', '.inventory.lock'), bytes = 'x'.repeat(2048)
  writeFileSync(lock, bytes); utimesSync(lock, new Date(0), new Date(0))
  expect(() => withInventoryLock(root, () => 'unsafe writer')).toThrow('owner is unknown')
  expect(readFileSync(lock, 'utf8')).toBe(bytes)
})

test.each(['stat', 'read'] as const)('owner release before contention %s keeps admission transient and protected', at => {
  const root = mkdtempSync(join(tmpdir(), 'adng-inventory-release-race-'))
  roots.push(root); mkdirSync(join(root, 'executions'))
  const lock = join(root, 'executions', '.inventory.lock')
  writeFileSync(lock, JSON.stringify({ pid: process.pid, processStartedAt: Date.now() - process.uptime() * 1000 }))
  // Even an old lock can belong to a live long-running process.
  utimesSync(lock, new Date(0), new Date(0))
  releaseRace.at = at
  expect(readExecutions(root)).toMatchObject({ protected: true, diagnosisDue: true, updateInProgress: true })
  expect(existsSync(lock)).toBe(false)
  expect(readExecutions(root)).toMatchObject({ protected: false, errors: [] })
})
