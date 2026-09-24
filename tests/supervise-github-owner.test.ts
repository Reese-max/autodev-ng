import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

type SupervisorState = {
  supervisorPid: number
  childPid: number
  status: string
  restartCount: number
}

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const powershell = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')

function readState(path: string): SupervisorState {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, '')) as SupervisorState
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function killTree(pid: number | undefined): void {
  if (!pid || !isAlive(pid)) return
  try {
    execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' })
  } catch {
    // The process may have exited between the liveness check and taskkill.
  }
}

async function waitFor(predicate: () => boolean, timeoutMs = 8_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      if (predicate()) return
    } catch {
      // Windows PowerShell can hold the state file while replacing its contents.
    }
    await new Promise(resolvePromise => setTimeout(resolvePromise, 50))
  }
  throw new Error('timed out waiting for supervisor state')
}

test('GitHub watcher supervisor restarts one child and stops cleanly on pause', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-github-supervisor-'))
  const dataDir = join(root, 'data')
  const configPath = join(root, 'github.json')
  const fakeWatcherPath = join(root, 'fake-watcher.ps1')
  const statePath = join(dataDir, 'supervisor.json')
  const stopPath = join(dataDir, '.adng.stop')
  writeFileSync(configPath, JSON.stringify({
    owner: 'Reese-max', repo: 'autodev-ng', enabled: true, dataDir,
  }))
  writeFileSync(fakeWatcherPath, [
    'param([string]$Config, [string]$Mode = "issues")',
    '$marker = Join-Path (Split-Path -Parent $Config) "child-starts.log"',
    'Add-Content -LiteralPath $marker -Value $PID',
    'while ($true) { Start-Sleep -Milliseconds 100 }',
  ].join('\n'))

  let supervisor: ChildProcess | undefined
  let supervisorPid: number | undefined
  try {
    supervisor = spawn(powershell, [
      '-NoLogo', '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden',
      '-ExecutionPolicy', 'Bypass', '-File', join(repoRoot, 'scripts', 'supervise-github-owner.ps1'),
      '-Config', configPath, '-WatcherPath', fakeWatcherPath, '-RestartDelayMs', '1000',
    ], { windowsHide: true, stdio: 'ignore' })

    await waitFor(() => existsSync(statePath) && readState(statePath).status === 'running')
    const first = readState(statePath)
    supervisorPid = first.supervisorPid
    expect(first.childPid).toBeGreaterThan(0)
    expect(isAlive(first.childPid)).toBe(true)

    killTree(first.childPid)
    await waitFor(() => {
      if (!existsSync(statePath)) return false
      const state = readState(statePath)
      return state.restartCount === 1 && state.childPid > 0 && state.childPid !== first.childPid
    })
    const replacement = readState(statePath)
    expect(isAlive(replacement.childPid)).toBe(true)
    await waitFor(() => existsSync(join(root, 'child-starts.log'))
      && readFileSync(join(root, 'child-starts.log'), 'utf8').trim().split(/\r?\n/).length === 2)

    writeFileSync(stopPath, 'pause\n')
    await waitFor(() => supervisor?.exitCode !== null)
    const paused = readState(statePath)
    expect(paused.status).toBe('paused')
    expect(paused.childPid).toBe(0)
    expect(isAlive(replacement.childPid)).toBe(false)
    expect(readFileSync(join(root, 'child-starts.log'), 'utf8').trim().split(/\r?\n/)).toHaveLength(2)
  } finally {
    killTree(supervisorPid)
    killTree(supervisor?.pid)
  }
})

test('GitHub watcher supervisor starts no child while already paused', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-github-supervisor-paused-'))
  const dataDir = join(root, 'data')
  const configPath = join(root, 'github.json')
  const fakeWatcherPath = join(root, 'fake-watcher.ps1')
  const statePath = join(dataDir, 'supervisor.json')
  mkdirSync(dataDir, { recursive: true })
  writeFileSync(configPath, JSON.stringify({
    owner: 'Reese-max', repo: 'autodev-ng', enabled: true, dataDir,
  }))
  writeFileSync(fakeWatcherPath, 'Start-Sleep -Seconds 30\n')
  writeFileSync(join(dataDir, '.adng.stop'), 'pause\n')

  let supervisor: ChildProcess | undefined
  try {
    supervisor = spawn(powershell, [
      '-NoLogo', '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden',
      '-ExecutionPolicy', 'Bypass', '-File', join(repoRoot, 'scripts', 'supervise-github-owner.ps1'),
      '-Config', configPath, '-WatcherPath', fakeWatcherPath,
    ], { windowsHide: true, stdio: 'ignore' })
    await waitFor(() => supervisor?.exitCode !== null)
    const state = readState(statePath)
    expect(state.status).toBe('paused')
    expect(state.childPid).toBe(0)
    expect(existsSync(join(root, 'child-starts.log'))).toBe(false)
  } finally {
    killTree(supervisor?.pid)
  }
})
