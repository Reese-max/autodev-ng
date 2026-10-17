import { afterEach, expect, test } from 'vitest'
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

// Run the actual scripts against a local inert CLI: no credentials, network or workers.
const shell = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe')
type Mode = 'issues' | 'reports' | 'repairs'
type Start = { watcherPid: number; pid: number; at: number; args: string[] }
type State = { supervisorPid: number; childPid: number | null; status: string; restartCount: number; lastExitCode: number | null }
type Fixture = ReturnType<typeof makeFixture>
const fixtures: Fixture[] = []
function fixture(...args: Parameters<typeof makeFixture>): Fixture {
  const value = makeFixture(...args)
  fixtures.push(value)
  return value
}
const alive = (pid: number) => { try { process.kill(pid, 0); return true } catch { return false } }
function killOwned(f: Fixture, pid: number) {
  // Retain a native handle and verify creation time plus fixture command line before killing.
  const command = `
    $ErrorActionPreference = 'Stop'
    $p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue
    if (-not $p) { exit 0 }
    try {
      $null = $p.Handle
      $row = Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}'
      if (-not $row -or $p.HasExited) { exit 0 }
      $text = $row.CommandLine
      if ($text -match '-EncodedCommand\\s+([^\\s"]+)') { $text = [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String($Matches[1])) }
      if (-not $text.Contains('${f.root.replaceAll("'", "''")}') -or
          [Math]::Abs(($row.CreationDate.ToUniversalTime() - $p.StartTime.ToUniversalTime()).TotalMilliseconds) -ge 1) { exit 0 }
      $p.Kill()
      if (-not $p.WaitForExit(5000)) { throw 'Canary did not stop' }
    } finally { $p.Dispose() }
  `
  const run = spawnSync(shell, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(command, 'utf16le').toString('base64')], { windowsHide: true, encoding: 'utf8' })
  expect(run.status, run.stderr).toBe(0)
}

async function until<T>(read: () => T | undefined, timeout = 10_000): Promise<T> {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    const value = read()
    if (value !== undefined) return value
    await delay(50)
  }
  throw new Error('Timed out waiting for isolated supervisor')
}

function makeFixture(mode: Mode = 'issues', options: { spaced?: boolean; exit?: number; liveCli?: boolean } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'adng-pr156-'))
  const repo = options.spaced ? join(root, "canary dir 'quoted'") : root
  const data = join(repo, 'data')
  const modeData = mode === 'repairs' ? join(data, 'repairs') : data
  mkdirSync(join(repo, 'scripts'), { recursive: true })
  mkdirSync(join(repo, 'dist'), { recursive: true })
  mkdirSync(modeData, { recursive: true })
  for (const file of ['watch-github-owner.ps1', 'watch-github-supervisor.ps1']) {
    copyFileSync(join(import.meta.dirname, '../../scripts', file), join(repo, 'scripts', file))
  }
  // A synchronous, inert CLI records the real watcher PID before optionally waiting.
  writeFileSync(join(repo, 'dist/cli.js'), `
    const fs = require('node:fs'), path = require('node:path');
    fs.appendFileSync(path.join(__dirname, '../starts.jsonl'), JSON.stringify({
      watcherPid: process.ppid, pid: process.pid, at: Date.now(), args: process.argv.slice(2)
    }) + '\\n');
    ${options.liveCli ? 'setInterval(() => {}, 1000);' : ''}
  `)
  if (options.exit !== undefined) {
    writeFileSync(join(repo, 'scripts/watch-github-owner.ps1'), `
      param([string]$Config, [string]$Mode)
      & '${process.execPath.replaceAll("'", "''")}' (Join-Path $PSScriptRoot '../dist/cli.js') --config $Config
      exit ${options.exit}
    `)
  }
  const config = join(repo, 'config.json')
  const settings: Record<string, unknown> = { repo: `canary/${root.split(/[\\/]/).at(-1)}`, dataDir: 'data', enabled: true, retryMs: 60_000, intervalMs: 60_000 }
  const save = () => writeFileSync(config, JSON.stringify(settings))
  save()
  const children: ChildProcess[] = []
  let stderr = ''
  const launch = (script = 'watch-github-supervisor.ps1') => {
    const quote = (value: string) => `'${value.replaceAll("'", "''")}'`
    // Keep the buggy pre-fix Start-Process path hidden during the red replay too.
    const command = `$PSDefaultParameterValues['Start-Process:WindowStyle'] = 'Hidden'; & ${quote(join(repo, 'scripts', script))} -Config ${quote(config)} -Mode ${quote(mode)}; if (-not $?) { exit 1 }`
    const child = spawn(shell, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', Buffer.from(command, 'utf16le').toString('base64')], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
    child.stderr?.on('data', chunk => { stderr += String(chunk) })
    children.push(child)
    return child
  }
  const starts = (): Start[] => {
    try { return readFileSync(join(repo, 'starts.jsonl'), 'utf8').trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line) as Start) }
    catch { return [] }
  }
  const statePath = join(modeData, mode === 'reports' ? 'supervisor-reports.json' : 'supervisor.json')
  const state = (): State | undefined => {
    try { return JSON.parse(readFileSync(statePath, 'utf8').replace(/^\uFEFF/, '')) as State }
    catch { return undefined }
  }
  const result = { root, repo, data, modeData, config, settings, save, launch, starts, state, statePath, children, stderr: () => stderr }
  return result
}

async function exited(f: Fixture, child: ChildProcess, timeout = 10_000) {
  await until(() => child.exitCode !== null || child.signalCode !== null ? true : undefined, timeout)
  expect(child.exitCode, f.stderr()).toBe(0)
}

afterEach(async () => {
  for (const f of fixtures.splice(0)) {
    const pids = new Set(f.starts().flatMap(start => [start.watcherPid, start.pid]))
    const childPid = f.state()?.childPid
    if (childPid) pids.add(childPid)
    for (const child of f.children) {
      if (child.exitCode === null && child.signalCode === null) child.kill()
    }
    for (const pid of pids) if (alive(pid)) killOwned(f, pid)
    expect(f.root.startsWith(join(tmpdir(), 'adng-pr156-'))).toBe(true)
    rmSync(f.root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
  }
})

const windows = test.skipIf(process.platform !== 'win32')

windows.each(['disabled', 'non-boolean', 'data-stop', 'configured-stop', 'repairs-base-stop'] as const)('pause gate starts zero children: %s', async gate => {
  const f = fixture(gate === 'repairs-base-stop' ? 'repairs' : 'issues')
  if (gate === 'disabled') f.settings.enabled = false
  if (gate === 'non-boolean') f.settings.enabled = 'true'
  if (gate === 'configured-stop') {
    f.settings.stopFile = 'configured.stop'
    writeFileSync(join(f.repo, 'configured.stop'), '')
  }
  if (gate === 'data-stop' || gate === 'repairs-base-stop') writeFileSync(join(f.data, '.adng.stop'), '')
  f.save()
  const child = f.launch()
  await exited(f, child)
  expect(f.starts()).toHaveLength(0)
  expect(f.state()).toMatchObject({ childPid: null, lastExitCode: null, restartCount: 0, status: 'paused' })
})

windows.each(['issues', 'reports', 'repairs'] as const)('real watcher owns its mutex and recovers exactly once: %s', async mode => {
  const f = fixture(mode, { liveCli: true })
  const parent = f.launch()
  const first = await until(() => f.starts()[0])
  expect(alive(first.pid)).toBe(true)
  expect(f.state()?.childPid).toBe(first.watcherPid)
  await exited(f, f.launch())
  expect(f.state()?.supervisorPid).toBe(parent.pid)
  expect(f.starts()).toHaveLength(1)
  const killedAt = Date.now()
  killOwned(f, first.watcherPid)
  const replacement = await until(() => f.starts()[1], 12_000)
  expect(replacement.watcherPid).not.toBe(first.watcherPid)
  expect(alive(first.pid)).toBe(false)
  expect(replacement.at - killedAt).toBeGreaterThanOrEqual(5000)
  expect(f.state()).toMatchObject({ childPid: replacement.watcherPid, restartCount: 1 })
  expect(f.starts()).toHaveLength(2)
  writeFileSync(join(f.modeData, '.adng.stop'), '')
  await exited(f, parent)
  expect(alive(replacement.watcherPid)).toBe(false)
  expect(f.state()?.childPid).toBeNull()
}, 30_000)

windows('quoted paths reach the real system shell and clean exit is not restarted', async () => {
  const f = fixture('issues', { spaced: true, exit: 0 })
  const parent = f.launch()
  await exited(f, parent)
  expect(f.starts()).toHaveLength(1)
  expect(f.starts()[0]?.args).toEqual(['--config', f.config])
  expect(f.state()).toMatchObject({ status: 'stopped', restartCount: 0, lastExitCode: 0, childPid: null })
})

windows('three retries mean four actual starts and the real last exit code', async () => {
  const f = fixture('issues', { exit: 7 })
  const parent = f.launch()
  await until(() => parent.exitCode !== null ? true : undefined, 40_000)
  expect(parent.exitCode, f.stderr()).toBe(1)
  expect(f.starts()).toHaveLength(4)
  expect(f.state()).toMatchObject({ status: 'stopped-max-restarts', restartCount: 3, lastExitCode: 7, childPid: null })
  const starts = f.starts()
  for (let i = 1; i < starts.length; i++) expect(starts[i]!.at - starts[i - 1]!.at).toBeGreaterThanOrEqual(5000)
}, 45_000)

windows('parent termination kills the owned watcher and live native descendant', async () => {
  const f = fixture('issues', { liveCli: true })
  const parent = f.launch()
  const start = await until(() => f.starts()[0])
  expect(alive(start.pid)).toBe(true)
  parent.kill()
  await until(() => !alive(start.watcherPid) && !alive(start.pid) ? true : undefined)
})

windows('stop during restart delay prevents a replacement', async () => {
  const f = fixture('issues', { exit: 7 })
  const parent = f.launch()
  await until(() => f.state()?.status === 'child-exited' ? true : undefined)
  writeFileSync(join(f.data, '.adng.stop'), '')
  await exited(f, parent)
  expect(f.starts()).toHaveLength(1)
  expect(f.state()?.restartCount).toBe(0)
})

windows('live ownership change pauses and reaps the original child tree', async () => {
  const f = fixture('issues', { liveCli: true })
  const parent = f.launch()
  const first = await until(() => f.starts()[0])
  f.settings.repo = 'canary/changed-owner'
  f.save()
  await exited(f, parent)
  expect(f.starts()).toHaveLength(1)
  expect(alive(first.watcherPid)).toBe(false)
  expect(alive(first.pid)).toBe(false)
})

windows('an existing watcher is never taken over', async () => {
  const f = fixture()
  const watcher = f.launch('watch-github-owner.ps1')
  await until(() => f.starts()[0])
  const supervisor = f.launch()
  await exited(f, supervisor)
  expect(f.starts()).toHaveLength(1)
  expect(watcher.pid && alive(watcher.pid)).toBe(true)
  expect(f.state()).toMatchObject({ status: 'stopped', restartCount: 0, lastExitCode: 0 })
  const other = fixture()
  killOwned(other, watcher.pid!)
  expect(alive(watcher.pid!)).toBe(true)
})

windows('paused issues and reports keep separate bounded state', async () => {
  const f = fixture()
  f.settings.enabled = false
  f.save()
  const issues = f.launch()
  await exited(f, issues)
  const reports = spawn(shell, ['-NoProfile', '-NonInteractive', '-File', join(f.repo, 'scripts/watch-github-supervisor.ps1'), '-Config', f.config, '-Mode', 'reports'], { windowsHide: true, stdio: 'ignore' })
  f.children.push(reports)
  await exited(f, reports)
  expect(f.state()?.supervisorPid).toBe(issues.pid)
  const reportState = JSON.parse(readFileSync(join(f.data, 'supervisor-reports.json'), 'utf8').replace(/^\uFEFF/, '')) as State
  expect(reportState.supervisorPid).toBe(reports.pid)
  expect(Object.keys(reportState).sort()).toEqual(['childPid', 'lastExitCode', 'restartCount', 'status', 'supervisorPid', 'timestamp'])
})
