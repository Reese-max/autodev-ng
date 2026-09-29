import { afterEach, expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, utimesSync, existsSync, writeFileSync, readFileSync } from 'node:fs'
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { acquireLock, releaseDeadLock, releaseLock } from '../src/lock.js'
import { acquireLockLease } from '../src/lock/coordinator.js'

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

function makeDeadLock(dir: string, token = 'dead-generation'): { pid: number; startedAt: string; token: string } {
  mkdirSync(dir)
  const info = { pid: deadPid(), startedAt: new Date(Date.now() - 120_000).toISOString(), token }
  writeFileSync(join(dir, 'pid.json'), JSON.stringify(info))
  return info
}

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
    console.log(JSON.stringify({ stage: 'attempting' }));
    const token = acquireLock(dir, 0);
    console.log(JSON.stringify({ stage: token ? 'acquired' : 'busy', token }));
    process.exit(0);
  `
  const reclaimer = spawn(process.execPath, [...CHILD_ARGS, '-e', reclaimerScript, dir, continueFile], { stdio: ['pipe', 'pipe', 'pipe'] })
  let contender: ChildProcessWithoutNullStreams | undefined
  try {
    await waitForFile(readyFile)

    contender = spawn(process.execPath, [...CHILD_ARGS, '-e', contenderScript, dir], { stdio: ['pipe', 'pipe', 'pipe'] })
    const attempting = JSON.parse(await nextLine(contender)) as { stage: string }
    expect(attempting).toEqual({ stage: 'attempting' })

    writeFileSync(continueFile, 'continue')
    const reclaimed = JSON.parse(await nextLine(reclaimer)) as { stage: string; token: string | null }
    expect(reclaimed.stage).toBe('acquired')
    expect(reclaimed.token).toBeTruthy()
    const competing = JSON.parse(await nextLine(contender)) as { stage: string; token: string | null }
    expect(competing).toEqual({ stage: 'busy', token: null })
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
