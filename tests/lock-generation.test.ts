import { afterEach, expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, utimesSync, existsSync, writeFileSync, readFileSync, readdirSync, symlinkSync } from 'node:fs'
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { acquireLock, recoverRetainedLock, releaseDeadLock, releaseLock } from '../src/lock.js'
import { acquireLockLease } from '../src/lock/coordinator.js'
import { removeIfUnclaimed, writeOwnPidFileOrCleanup } from '../src/lock/internal.js'

const STALE = 30 * 60 * 1000
const tempParents: string[] = []
afterEach(() => {
  while (tempParents.length) rmSync(tempParents.pop()!, { recursive: true, force: true })
})

function freshDir(): { parent: string; dir: string } {
  const parent = mkdtempSync(join(tmpdir(), 'adng-lkg-'))
  tempParents.push(parent)
  return { parent, dir: join(parent, 'lock') }
}

function makeSentinelPaths(): { parent: string; dir: string; target: string; sentinel: string } {
  const { parent, dir } = freshDir()
  const target = join(parent, 'unrelated-target')
  return { parent, dir, target, sentinel: join(target, 'sentinel.txt') }
}

function makeSentinelTarget(): { parent: string; dir: string; target: string; sentinel: string } {
  const paths = makeSentinelPaths()
  mkdirSync(paths.target)
  writeFileSync(paths.sentinel, 'keep')
  return paths
}

function linkLockLeaf(dir: string, target: string): void {
  symlinkSync(target, dir, process.platform === 'win32' ? 'junction' : 'dir')
}

function expectUnsafeLockPath(action: () => unknown): void {
  let caught: unknown
  try {
    action()
  } catch (error) {
    caught = error
  }
  expect(caught).toMatchObject({ code: 'ERR_UNSAFE_LOCK_PATH' })
}

function expectSentinelOnly(target: string, sentinel: string): void {
  expect(readFileSync(sentinel, 'utf8')).toBe('keep')
  expect(readdirSync(target).sort()).toEqual(['sentinel.txt'])
}

function deadPid(): number {
  const result = spawnSync(process.execPath, ['-e', 'process.exit(0)'])
  if (typeof result.pid !== 'number') throw new Error('Node did not report the child PID')
  try {
    process.kill(result.pid, 0)
    throw new Error(`Expected test child ${result.pid} to have exited`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error
  }
  return result.pid
}

function writeDeadOwner(dir: string, token = 'dead-generation'): { pid: number; startedAt: string; token: string } {
  const info = { pid: deadPid(), startedAt: new Date(Date.now() - 120_000).toISOString(), token }
  writeFileSync(join(dir, 'pid.json'), JSON.stringify(info))
  return info
}

function makeDeadLock(dir: string, token = 'dead-generation'): { pid: number; startedAt: string; token: string } {
  mkdirSync(dir)
  return writeDeadOwner(dir, token)
}

test('acquisition and failed-write cleanup reject a symlink or junction leaf without touching its target', () => {
  const { dir, target, sentinel } = makeSentinelTarget()
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(target, old, old)
  linkLockLeaf(dir, target)

  expectUnsafeLockPath(() => acquireLock(dir, 0))
  expectUnsafeLockPath(() => writeOwnPidFileOrCleanup(dir, 'unsafe-generation'))
  removeIfUnclaimed(dir)

  expectSentinelOnly(target, sentinel)
})

test('token release rejects a symlink or junction leaf without deleting its target', () => {
  const { dir, target, sentinel } = makeSentinelPaths()
  const token = acquireLock(target)
  expect(token).toBeTruthy()
  writeFileSync(sentinel, 'keep')
  linkLockLeaf(dir, target)

  expectUnsafeLockPath(() => releaseLock(dir, token))
  expect(readFileSync(sentinel, 'utf8')).toBe('keep')
  expect(existsSync(join(target, 'pid.json'))).toBe(true)

  releaseLock(target, token)
})

test('dead-lock cleanup rejects a symlink or junction leaf without deleting its target', () => {
  const { dir, target, sentinel } = makeSentinelTarget()
  writeDeadOwner(target)
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(target, old, old)
  linkLockLeaf(dir, target)

  expectUnsafeLockPath(() => releaseDeadLock(dir, 0))
  expect(readFileSync(sentinel, 'utf8')).toBe('keep')
  expect(existsSync(join(target, 'pid.json'))).toBe(true)
})

test('acquire writes a generation token and release removes only that generation', () => {
  const { dir } = freshDir()
  const token = acquireLock(dir)
  expect(typeof token).toBe('string')
  const info = JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8'))
  expect(info.pid).toBe(process.pid)
  expect(info.token).toBe(token)

  releaseLock(dir, 'wrong-holder-token')
  expect(existsSync(dir)).toBe(true)
  releaseLock(dir, token)
  expect(existsSync(dir)).toBe(false)
  releaseLock(dir, token) // repeated release remains a no-op
})

test('a different process cannot release a valid owner token', async () => {
  const { dir } = freshDir()
  const token = acquireLock(dir)!
  const script = `
    import { releaseLock } from ${JSON.stringify(pathToFileURL(join(process.cwd(), 'src', 'lock.ts')).href)};
    releaseLock(process.argv[1], process.argv[2]);
    console.log('released');
  `
  const child = spawn(process.execPath, [...CHILD_ARGS, '-e', script, dir, token], { stdio: ['pipe', 'pipe', 'pipe'] })

  try {
    expect(await nextLine(child, 120_000)).toBe('released')
    expect(await waitForClose(child, 30_000)).toBe(0)
    expect(JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8')).token).toBe(token)
    releaseLock(dir, token)
    expect(existsSync(dir)).toBe(false)
  } finally {
    await terminate(child)
  }
}, 120_000)

test('a stale release token cannot remove a successor generation', () => {
  const { dir } = freshDir()
  const oldToken = acquireLock(dir)!
  releaseLock(dir, oldToken)
  const newToken = acquireLock(dir)!

  releaseLock(dir, oldToken)
  expect(JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8')).token).toBe(newToken)
  expect(acquireLock(dir)).toBeNull()
  releaseLock(dir, newToken)
})

test('an active PID cannot be reclaimed even when the lock directory mtime is old', () => {
  const { dir } = freshDir()
  const token = acquireLock(dir)!
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old)

  expect(acquireLock(dir, 1)).toBeNull()
  expect(JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8')).token).toBe(token)
  releaseLock(dir, token)
})

test('fresh unknown state fails closed; stale unknown state retains mtime recovery behavior', () => {
  const { dir } = freshDir()
  mkdirSync(dir)
  writeFileSync(join(dir, 'pid.json'), 'not-json{{')
  expect(acquireLock(dir, STALE)).toBeNull()

  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old)
  const token = acquireLock(dir, STALE)
  expect(token).toBeTruthy()
  releaseLock(dir, token)
})

test('legacy dead PID is reclaimed immediately, while legacy release requires this process identity', () => {
  const { dir } = freshDir()
  const dead = makeDeadLock(dir)
  const token = acquireLock(dir, STALE)
  expect(token).toBeTruthy()
  expect(JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8')).token).toBe(token)
  releaseLock(dir, token)

  mkdirSync(dir)
  const legacy = { pid: process.pid, startedAt: new Date().toISOString() }
  writeFileSync(join(dir, 'pid.json'), JSON.stringify(legacy))
  releaseLock(dir, `legacy:${legacy.pid}:${legacy.startedAt}`)
  expect(existsSync(dir)).toBe(false)
  expect(dead.pid).not.toBe(process.pid)
})

test.runIf(process.platform === 'win32')('a reused Windows PID is distinguished by process start time', () => {
  const { dir } = freshDir()
  mkdirSync(dir)
  writeFileSync(join(dir, 'pid.json'), JSON.stringify({ pid: process.pid, startedAt: '2000-01-01T00:00:00.000Z' }))

  const token = acquireLockLease(dir, STALE, { readProcessStartTime: () => new Date().toISOString() })
  expect(token).toBeTruthy()
  releaseLock(dir, token)
})

test('recovery-required state is never taken over or automatically removed', () => {
  const { dir } = freshDir()
  makeDeadLock(dir)
  writeFileSync(join(dir, 'recovery-required.json'), '{}')

  expect(acquireLock(dir, 0)).toBeNull()
  expect(releaseDeadLock(dir, 0)).toBe(false)
  expect(existsSync(join(dir, 'pid.json'))).toBe(true)
  expect(existsSync(join(dir, 'recovery-required.json'))).toBe(true)
})

test('explicit retained-lock recovery requires its generation token and clears the row with the quarantine', () => {
  const { dir } = freshDir()
  const token = acquireLock(dir)!
  writeFileSync(join(dir, 'recovery-required.json'), '{}')

  expect(recoverRetainedLock(dir, 'wrong-token', { backendSafeConfirmed: true })).toBe(false)
  expect(recoverRetainedLock(dir, token, { backendSafeConfirmed: false })).toBe(false)
  expect(existsSync(dir)).toBe(true)
  expect(acquireLock(dir)).toBeNull()

  expect(recoverRetainedLock(dir, token, { backendSafeConfirmed: true })).toBe(true)
  expect(existsSync(dir)).toBe(false)
  const nextToken = acquireLock(dir)
  expect(nextToken).toBeTruthy()
  expect(recoverRetainedLock(dir, token, { backendSafeConfirmed: true })).toBe(false)
  expect(acquireLock(dir)).toBeNull()
  releaseLock(dir, nextToken)
})

test('explicit retained-lock recovery clears only its matching row after an operator already removed the quarantine', () => {
  const { dir } = freshDir()
  const token = acquireLock(dir)!
  writeFileSync(join(dir, 'recovery-required.json'), '{}')
  rmSync(dir, { recursive: true, force: true })

  expect(recoverRetainedLock(dir, 'wrong-token', { backendSafeConfirmed: true })).toBe(false)
  expect(acquireLock(dir)).toBeNull()
  expect(recoverRetainedLock(dir, token, { backendSafeConfirmed: true })).toBe(true)
  const nextToken = acquireLock(dir)
  expect(nextToken).toBeTruthy()
  releaseLock(dir, nextToken)
})

test('releaseDeadLock removes a dead legacy lock but leaves a live lock alone', () => {
  const { dir } = freshDir()
  const token = acquireLock(dir)!
  expect(releaseDeadLock(dir)).toBe(false)
  releaseLock(dir, token)

  makeDeadLock(dir)
  expect(releaseDeadLock(dir)).toBe(true)
  expect(existsSync(dir)).toBe(false)
})

const LOCK_URL = pathToFileURL(join(process.cwd(), 'src', 'lock.ts')).href
const COORDINATOR_URL = pathToFileURL(join(process.cwd(), 'src', 'lock', 'coordinator.ts')).href
const TS_HOOK = pathToFileURL(join(process.cwd(), 'tests', 'helpers', 'ts-resolve-hook.mjs')).href
const CHILD_ARGS = ['--experimental-strip-types', '--experimental-loader', TS_HOOK, '--input-type=module']

function nextLine(child: ChildProcessWithoutNullStreams, timeoutMs = 30_000): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = ''
    let stderr = ''
    const finish = (error?: Error, line?: string): void => {
      clearTimeout(timer)
      child.stdout.off('data', onStdout)
      child.stderr.off('data', onStderr)
      child.off('error', onError)
      child.off('close', onClose)
      if (error) reject(error)
      else resolve(line!)
    }
    const onStdout = (chunk: Buffer): void => {
      output += chunk.toString()
      const newline = output.indexOf('\n')
      if (newline >= 0) finish(undefined, output.slice(0, newline).trim())
    }
    const onStderr = (chunk: Buffer): void => { stderr += chunk.toString() }
    const onError = (error: Error): void => finish(error)
    const onClose = (code: number | null): void => finish(new Error(`Child ended before reporting a result (exit=${String(code)}): ${stderr.trim()}`))
    const timer = setTimeout(() => finish(new Error(`Child did not report a result within ${timeoutMs}ms: ${stderr.trim()}`)), timeoutMs)
    child.stdout.on('data', onStdout)
    child.stderr.on('data', onStderr)
    child.once('error', onError)
    child.once('close', onClose)
  })
}

function waitForClose(child: ChildProcessWithoutNullStreams, timeoutMs = 30_000): Promise<number | null> {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode)
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.off('close', onClose)
      reject(new Error(`Child did not exit within ${timeoutMs}ms`))
    }, timeoutMs)
    const onClose = (code: number | null): void => {
      clearTimeout(timer)
      resolve(code)
    }
    child.once('close', onClose)
  })
}

async function waitForFile(path: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (!existsSync(path) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  if (!existsSync(path)) throw new Error(`File was not created before timeout: ${path}`)
}

async function terminate(child: ChildProcessWithoutNullStreams): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return
  child.kill('SIGKILL')
  await new Promise<void>((resolve) => child.once('close', () => resolve()))
}

test.runIf(process.platform === 'win32')('Windows subprocess interleave: only one process can replace a stale generation; crash recovery remains available', async () => {
  const { dir } = freshDir()
  mkdirSync(dir)
  writeFileSync(join(dir, 'pid.json'), 'malformed previous generation')
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old)
  const continueFile = join(dir, 'continue-reclaim')
  const readyFile = join(dir, 'stale-observation-ready')
  const reclaimerScript = `
    import { existsSync } from 'node:fs';
    import { writeFileSync } from 'node:fs';
    import { acquireLockLease } from ${JSON.stringify(COORDINATOR_URL)};
    const [dir, continueFile] = process.argv.slice(1);
    const token = acquireLockLease(dir, 0, { afterStaleObservation: () => {
      writeFileSync(${JSON.stringify(readyFile)}, 'ready');
      const waitCell = new Int32Array(new SharedArrayBuffer(4));
      const deadline = Date.now() + 30_000;
      while (!existsSync(continueFile) && Date.now() < deadline) Atomics.wait(waitCell, 0, 0, 10);
      if (!existsSync(continueFile)) throw new Error('The parent did not release the stale-reclaim gate');
    }});
    console.log(JSON.stringify({ stage: token ? 'acquired' : 'busy', token }));
    if (token) setInterval(() => {}, 1000);
  `
  const contenderScript = `
    import { acquireLock } from ${JSON.stringify(LOCK_URL)};
    const dir = process.argv[1];
    const token = acquireLock(dir, 0);
    console.log(JSON.stringify({ stage: token ? 'acquired' : 'busy', token }));
    process.exit(0);
  `
  const reclaimer = spawn(process.execPath, [...CHILD_ARGS, '-e', reclaimerScript, dir, continueFile], { stdio: ['pipe', 'pipe', 'pipe'] })
  let contender: ChildProcessWithoutNullStreams | undefined
  try {
    await waitForFile(readyFile)

    contender = spawn(process.execPath, [...CHILD_ARGS, '-e', contenderScript, dir], { stdio: ['pipe', 'pipe', 'pipe'] })
    // BEGIN IMMEDIATE is held by the paused reclaimer. acquireLock returns busy only
    // after its SQLite busy timeout, so this result proves the contender reached the
    // coordinator while the stale observation is still in flight.
    const blocked = JSON.parse(await nextLine(contender)) as { stage: string; token: string | null }
    expect(blocked).toEqual({ stage: 'busy', token: null })
    expect(await waitForClose(contender, 30_000)).toBe(0)
    expect(reclaimer.exitCode).toBeNull()

    writeFileSync(continueFile, 'continue')
    const reclaimed = JSON.parse(await nextLine(reclaimer)) as { stage: string; token: string | null }
    expect(reclaimed.stage).toBe('acquired')
    expect(reclaimed.token).toBeTruthy()

    contender = spawn(process.execPath, [...CHILD_ARGS, '-e', contenderScript, dir], { stdio: ['pipe', 'pipe', 'pipe'] })
    const competing = JSON.parse(await nextLine(contender)) as { stage: string; token: string | null }
    expect(competing).toEqual({ stage: 'busy', token: null })
    expect(await waitForClose(contender, 30_000)).toBe(0)
    expect(JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8')).token).toBe(reclaimed.token)

    await terminate(reclaimer)
    const afterCrash = acquireLock(dir)
    expect(afterCrash).toBeTruthy()
    expect(JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8')).token).toBe(afterCrash)
    releaseLock(dir, afterCrash)
  } finally {
    if (existsSync(dir)) writeFileSync(continueFile, 'cleanup')
    if (contender) await terminate(contender)
    await terminate(reclaimer)
  }
}, 120_000)

test.runIf(process.platform === 'win32')('a slow Windows owner probe does not make a sibling lock report busy', async () => {
  const { parent, dir } = freshDir()
  const siblingDir = join(parent, 'sibling-lock')
  const readyFile = join(parent, 'owner-probe-ready')
  const ownerScript = `
    import { mkdirSync, writeFileSync } from 'node:fs';
    import { join } from 'node:path';
    import { acquireLockLease } from ${JSON.stringify(COORDINATOR_URL)};
    const [dir, readyFile] = process.argv.slice(1);
    mkdirSync(dir);
    writeFileSync(join(dir, 'pid.json'), JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    const token = acquireLockLease(dir, 0, { readProcessStartTime: () => {
      writeFileSync(readyFile, 'ready');
      const cell = new Int32Array(new SharedArrayBuffer(4));
      const deadline = Date.now() + 2_000;
      while (Date.now() < deadline) Atomics.wait(cell, 0, 0, 10);
      return new Date(Date.now() - 60_000).toISOString();
    }});
    console.log(JSON.stringify({ stage: token ? 'acquired' : 'busy', token }));
  `
  const owner = spawn(process.execPath, [...CHILD_ARGS, '-e', ownerScript, dir, readyFile], { stdio: ['pipe', 'pipe', 'pipe'] })

  try {
    await waitForFile(readyFile)

    // The owner probe holds BEGIN IMMEDIATE for longer than the former 1s
    // timeout. This is a distinct key in the same coordinator database.
    const siblingToken = acquireLock(siblingDir)
    expect(siblingToken).toBeTruthy()
    expect(JSON.parse(await nextLine(owner))).toEqual({ stage: 'busy', token: null })
    expect(await waitForClose(owner, 30_000)).toBe(0)
    expect(JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8')).pid).toBe(owner.pid)
    releaseLock(siblingDir, siblingToken)
  } finally {
    await terminate(owner)
  }
}, 30_000)
