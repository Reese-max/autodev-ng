'use strict'
// Real Windows processes, real watcher, inert local CLI: no GitHub or provider calls.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { spawn, execFileSync } = require('node:child_process')
const { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } = require('node:fs')
const { rm } = require('node:fs/promises')
const { tmpdir } = require('node:os')
const { join, resolve } = require('node:path')
const { setTimeout: sleep } = require('node:timers/promises')

const repo = resolve(__dirname, '../..')
const script = join(repo, 'scripts/supervise-github-owner.ps1')
const shell = join(process.env.SystemRoot || 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe')
const windows = { skip: process.platform !== 'win32', timeout: 90_000 }
const alive = pid => { try { process.kill(pid, 0); return true } catch { return false } }
const json = file => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))

async function waitFor(check, message) {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try { if (check()) return } catch (err) {
      if (!(err instanceof SyntaxError) && !['ENOENT', 'EBUSY', 'EPERM'].includes(err.code)) throw err
    }
    await sleep(50)
  }
  assert.fail(message)
}

function fixture(t, mode = 'issues', extra = {}) {
  assert.ok(existsSync(script), 'GitHub watcher supervisor must exist')
  const root = mkdtempSync(join(tmpdir(), "adng supervisor ' "))
  const config = join(root, 'config.json'), data = join(root, 'data')
  const modeData = mode === 'repairs' ? join(data, 'repairs') : data
  const state = join(modeData, `supervisor-${mode}.json`)
  const stop = join(data, '.adng.stop'), starts = join(root, 'starts.jsonl')
  const settings = { owner: `canary-${process.pid}-${root.slice(-6)}`, dataDir: 'data', enabled: true, retryMs: 60000, intervalMs: 60000, ...extra }
  const children = []
  mkdirSync(join(root, 'scripts')); mkdirSync(join(root, 'dist')); mkdirSync(modeData, { recursive: true })
  copyFileSync(script, join(root, 'scripts/supervise-github-owner.ps1'))
  copyFileSync(join(repo, 'scripts/watch-github-owner.ps1'), join(root, 'scripts/watch-github-owner.ps1'))
  writeFileSync(config, JSON.stringify(settings))
  writeFileSync(join(root, 'dist/cli.js'), `
    const fs = require('node:fs'), path = require('node:path');
    fs.appendFileSync(path.join(path.dirname(process.argv.at(-1)), 'starts.jsonl'),
      JSON.stringify({ pid: process.pid, watcherPid: process.ppid, command: process.argv[3] }) + '\\n');
    setInterval(() => {}, 1000);
  `)
  const markers = () => existsSync(starts) ? readFileSync(starts, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse) : []
  const launch = (delay = 1000, launchMode = mode, entry = 'supervise-github-owner.ps1') => {
    const child = spawn(shell, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File',
      join(root, 'scripts', entry), '-Config', config, '-Mode', launchMode, '-RestartDelayMs', String(delay)],
    { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
    child.output = ''
    child.stdout.on('data', data => { child.output += data })
    child.stderr.on('data', data => { child.output += data })
    children.push(child)
    return child
  }
  t.after(async () => {
    writeFileSync(stop, 'test cleanup')
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null) {
        try { await waitFor(() => child.exitCode !== null || child.signalCode !== null, 'cleanup exit') }
        finally { if (alive(child.pid)) child.kill() }
      }
    }
    for (const row of markers()) for (const pid of [row.pid, row.watcherPid]) if (alive(pid)) process.kill(pid)
    assert.ok(resolve(root).startsWith(resolve(tmpdir()) + require('node:path').sep))
    await rm(root, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
  })
  return { root, config, settings, data, modeData, state, stop, starts, launch, markers }
}

async function exited(child) {
  await waitFor(() => child.exitCode !== null || child.signalCode !== null, 'supervisor did not exit')
  assert.equal(child.exitCode, 0, child.output)
}

async function running(f, child, count) {
  await waitFor(() => {
    assert.equal(child.exitCode, null, child.output)
    return f.markers().length === count && json(f.state).status === 'running'
  }, 'watcher did not start')
  const state = json(f.state), marker = f.markers().at(-1)
  assert.equal(state.supervisorPid, child.pid)
  assert.equal(marker.watcherPid, state.childPid)
  assert.ok(alive(marker.pid) && alive(state.childPid))
  const parent = execFileSync(shell, ['-NoProfile', '-NonInteractive', '-Command',
    `(Get-CimInstance Win32_Process -Filter 'ProcessId=${state.childPid}').ParentProcessId`],
  { encoding: 'utf8', windowsHide: true, timeout: 30_000 }).trim()
  assert.equal(Number(parent), child.pid, 'watcher must be a direct child of the supervisor')
  assert.deepEqual(Object.keys(state).sort(), ['childPid', 'lastExitCode', 'restartCount', 'status', 'supervisorPid', 'timestamp'])
  assert.ok(readFileSync(f.state).length < 512, 'state is bounded and contains metadata only')
  assert.ok(Number.isFinite(Date.parse(state.timestamp)))
  return { state, marker }
}

test('GitHub watcher supervisor is available', () => {
  assert.ok(existsSync(script), 'GitHub watcher supervisor must exist')
})

for (const paused of ['disabled', 'non-boolean', 'stop-file', 'configured-stop', 'repair-stop']) {
  test(`starts zero children with ${paused}`, windows, async t => {
    const f = fixture(t, paused === 'repair-stop' ? 'repairs' : 'issues', {
      enabled: paused === 'disabled' ? false : paused === 'non-boolean' ? 'true' : true,
      ...(paused === 'configured-stop' ? { stopFile: 'operator.stop' } : {}),
    })
    if (paused.endsWith('stop')) writeFileSync(join(paused === 'repair-stop' ? f.modeData : f.root, paused === 'repair-stop' ? '.adng.stop' : 'operator.stop'), 'pause')
    if (paused === 'stop-file') writeFileSync(f.stop, 'pause')
    await exited(f.launch())
    assert.deepEqual(f.markers(), [])
    const state = json(f.state)
    assert.equal(state.status, 'paused'); assert.equal(state.childPid, 0); assert.equal(state.restartCount, 0)
  })
}

for (const mode of ['issues', 'reports', 'repairs']) {
  test(`${mode}: one replacement, no orphaned workers, pause cleans up`, windows, async t => {
    const f = fixture(t, mode), child = f.launch()
    const first = await running(f, child, 1)
    assert.equal(first.marker.command, { issues: 'owner-run', reports: 'report', repairs: 'repair-batch' }[mode])
    if (mode === 'issues') {
      await exited(f.launch(1000, 'ISSUES'))
      assert.equal(json(f.state).supervisorPid, child.pid, 'duplicate supervisor must not overwrite state')
      assert.equal(f.markers().length, 1)
    }
    const killedAt = Date.now()
    process.kill(first.state.childPid) // Kill only PowerShell, deliberately leave its Node descendant.
    const replacement = await running(f, child, 2)
    assert.ok(Date.now() - killedAt >= 1000, 'bounded restart delay must be respected')
    assert.equal(replacement.state.restartCount, 1)
    assert.equal(typeof replacement.state.lastExitCode, 'number')
    assert.notEqual(replacement.state.childPid, first.state.childPid)
    assert.equal(alive(first.marker.pid), false, 'old Node worker must be gone before replacement')
    assert.equal(alive(first.state.childPid), false)
    writeFileSync(f.stop, 'operator pause after recovery')
    await exited(child)
    assert.equal(json(f.state).status, 'paused'); assert.equal(json(f.state).childPid, 0)
    assert.equal(alive(replacement.marker.pid), false); assert.equal(alive(replacement.state.childPid), false)
    assert.equal(f.markers().length, 2)
  })
}

test('stop during restart delay prevents replacement', windows, async t => {
  const f = fixture(t), child = f.launch(5000)
  const first = await running(f, child, 1)
  process.kill(first.state.childPid)
  await waitFor(() => json(f.state).status === 'child-exited', 'exit state missing')
  writeFileSync(f.stop, 'pause during backoff')
  await exited(child)
  assert.equal(f.markers().length, 1)
  assert.equal(json(f.state).restartCount, 0)
  assert.equal(alive(first.marker.pid), false)
})

test('supervisor termination leaves no watcher or worker', windows, async t => {
  const f = fixture(t), child = f.launch()
  const first = await running(f, child, 1)
  child.kill()
  await waitFor(() => !alive(first.state.childPid) && !alive(first.marker.pid), 'orphaned process after supervisor exit')
})

test('clean watcher exit does not restart a competing watcher', windows, async t => {
  const f = fixture(t)
  writeFileSync(join(f.root, 'scripts/watch-github-owner.ps1'), 'exit 0\n')
  await exited(f.launch())
  const state = json(f.state)
  assert.equal(state.status, 'stopped'); assert.equal(state.restartCount, 0); assert.equal(state.lastExitCode, 0)
})

test('parent crash before job attachment cannot release an unowned watcher', windows, async t => {
  const f = fixture(t), bootstrap = join(f.root, 'bootstrap.pid')
  // Delay the bootstrap, then terminate its real parent before Attach. Only this fixture overrides the cmdlet.
  writeFileSync(join(f.root, 'scripts/crash-before-attach.ps1'), `
    param([string]$Config, [string]$Mode, [int]$RestartDelayMs)
    function Start-Process {
      param($FilePath, [string[]]$ArgumentList, $WorkingDirectory, $WindowStyle, [switch]$PassThru)
      $launch = 'Start-Sleep -Seconds 2; ' + [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String($ArgumentList[-1]))
      $ArgumentList[-1] = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($launch))
      $PSBoundParameters.ArgumentList = $ArgumentList
      $child = Microsoft.PowerShell.Management\\Start-Process @PSBoundParameters
      [IO.File]::WriteAllText('${bootstrap.replaceAll("'", "''")}', [string]$child.Id)
      Stop-Process -Id $PID -Force
    }
    & (Join-Path $PSScriptRoot 'supervise-github-owner.ps1') -Config $Config -Mode $Mode -RestartDelayMs $RestartDelayMs
  `)
  f.launch(1000, 'issues', 'crash-before-attach.ps1')
  let pid
  await waitFor(() => { pid = Number(readFileSync(bootstrap, 'utf8')); return Number.isInteger(pid) && pid > 0 }, 'bootstrap was not started')
  try {
    await waitFor(() => !alive(pid) || f.markers().length > 0, 'bootstrap did not fail closed')
    assert.deepEqual(f.markers(), [], 'missing start event must never launch the watcher')
  } finally { if (alive(pid)) process.kill(pid) }
})
