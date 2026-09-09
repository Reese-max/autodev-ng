import { expect, test, vi } from 'vitest'
import fs from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import Database from 'better-sqlite3'
// @ts-expect-error operator scripts intentionally expose plain JavaScript
import { initHost, loadHost, doctor, health, assertIdleData, writeJson, inside, switchRuntime, handoffStatus, pauseForHandoff } from '../scripts/host.mjs'
// @ts-expect-error operator scripts intentionally expose plain JavaScript
import { backupState, restoreState } from '../scripts/host-state.mjs'
// @ts-expect-error operator scripts intentionally expose plain JavaScript
import { checkHeartbeat } from '../scripts/check-host-heartbeat.mjs'
// @ts-expect-error operator scripts intentionally expose plain JavaScript
import { publishSnapshot } from '../scripts/memory-snapshot.mjs'

function fixture() {
  const root = fs.mkdtempSync(join(tmpdir(), 'adng-host-')), project = join(root, 'source project')
  fs.mkdirSync(project)
  const git = (...args: string[]) => execFileSync('git', args, { cwd: project, windowsHide: true, stdio: 'pipe' })
  git('init', '-b', 'main'); fs.writeFileSync(join(project, 'README.md'), 'fixture\n')
  git('add', '.'); git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'fixture')
  const home = join(root, 'host home'); initHost(home, project)
  return { root, home, project, git, config: join(home, 'configs/project.json') }
}
test('new host is paused, does not modify the project, and refuses overwrite', async () => {
  const f = fixture()
  expect(f.git('status', '--porcelain').toString()).toBe('')
  expect(fs.existsSync(join(f.home, 'configs/.adng.stop'))).toBe(true)
  expect(() => initHost(f.home, f.project)).toThrow('must not exist')
  expect((await doctor(f.home)).checks.find((c: {name: string}) => c.name === 'engine-configured').ok).toBe(false)
  expect((await health(f.home)).ok).toBe(false)
  expect(inside(f.home, join(f.home, '../outside'))).toBe(false)
  const alias = join(f.root, 'home-alias')
  fs.symlinkSync(f.home, alias, process.platform === 'win32' ? 'junction' : 'dir')
  expect(inside(f.home, join(alias, 'new-destination'))).toBe(true)
  const pid = join(f.home, 'data/pid.json'); writeJson(pid, { pid: process.pid })
  expect(() => assertIdleData(join(f.home, 'data'))).toThrow('alive')
})
test('backup/restore preserves SQLite and issue evidence, rejects corruption and remains paused', async () => {
  const f = fixture(), data = join(f.home, 'data/project')
  fs.mkdirSync(data)
  const db = new Database(join(data, 'run.db')); db.exec("CREATE TABLE proof (runs INTEGER); INSERT INTO proof VALUES (7)"); db.close()
  fs.writeFileSync(join(data, 'auth.json'), '{"access_token":"fixture-not-a-real-token"}')
  fs.writeFileSync(join(data, 'web-console.token'), 'fixture-console-token')
  const iData = join(f.home, 'data/integration'); fs.mkdirSync(iData)
  fs.writeFileSync(join(iData, '.adng.stop'), 'preserve original pause reason')
  writeJson(join(iData, 'state.json'), { issue: 7, runs: 1, status: 'published' })
  writeJson(join(f.home, 'configs/integrations/github.json'), { sourceConfig: '../project.json', dataDir: '../../data/integration', repo: 'fixture/repo', enabled: true })
  const backup = join(f.root, 'snapshot')
  expect((await backupState(f.config, backup)).gate).toBe('HOST_BACKUP_PASS')
  expect(fs.existsSync(join(backup, 'data/auth.json'))).toBe(false)
  expect(fs.existsSync(join(backup, 'data/web-console.token'))).toBe(false)
  expect((await restoreState(backup, join(f.root, 'restored'), loadHost(f.home).runtime)).paused).toBe(true)
  const restoredHome = join(f.root, 'restored/host'), restoredDb = new Database(join(restoredHome, 'data/project/run.db'), { readonly: true })
  expect(restoredDb.prepare('SELECT runs FROM proof').pluck().get()).toBe(7); restoredDb.close()
  expect(JSON.parse(fs.readFileSync(join(restoredHome, 'configs/integrations/github.json'), 'utf8')).enabled).toBe(false)
  expect(JSON.parse(fs.readFileSync(join(restoredHome, 'data/integrations/github.json/state.json'), 'utf8')).runs).toBe(1)
  expect(fs.existsSync(join(restoredHome, 'configs/.adng.stop'))).toBe(true)
  fs.appendFileSync(join(backup, 'BACKLOG.md'), 'tampered')
  await expect(restoreState(backup, join(f.root, 'bad'), loadHost(f.home).runtime)).rejects.toThrow('checksum')
  expect(fs.existsSync(join(f.root, 'bad'))).toBe(false)
  fs.writeFileSync(join(f.project, 'dirty'), 'keep me')
  await expect(backupState(f.config, join(f.root, 'dirty-snapshot'))).rejects.toThrow('dirty')
  expect(fs.readFileSync(join(f.project, 'dirty'), 'utf8')).toBe('keep me')
})
test('external receipt checks reject stale, wrong-host and paused states', () => {
  const dir = fs.mkdtempSync(join(tmpdir(), 'adng-heartbeat-')), file = join(dir, 'health.json'), now = Date.now()
  for (const patch of [{}, { checkedAt: new Date(now - 180001).toISOString() }, { hostId: 'other' }, { ok: false }, { checkedAt: 'invalid' }]) {
    writeJson(file, { hostId: 'test', ok: true, checkedAt: new Date(now).toISOString(), ...patch })
    expect(checkHeartbeat(file, 'test', 180000, now).ok).toBe(Object.keys(patch).length === 0)
  }
  expect(checkHeartbeat(join(dir, 'missing'), 'test').ok).toBe(false)
})
test('failed backup push cannot advance success stamp; successful retry advances it', async () => {
  const dir = fs.mkdtempSync(join(tmpdir(), 'adng-publish-')), stop = join(dir, '.stop'), stamp = join(dir, '.last-snapshot')
  fs.writeFileSync(stamp, 'previous')
  let failPush = true
  const run = async (_exe: string, args: string[]) => ({ started: true, status: args.includes('push') && failPush ? 1 : 0 })
  await expect(publishSnapshot(dir, stop, run, 'today')).rejects.toThrow()
  expect(fs.readFileSync(stamp, 'utf8')).toBe('previous')
  failPush = false; await publishSnapshot(dir, stop, run, 'today')
  expect(fs.readFileSync(stamp, 'utf8')).toBe('today')
})

test('runtime switch requires a matching release gate and idle services, retaining a rollback target', () => {
  const f = fixture(), next = join(f.root, 'next')
  fs.mkdirSync(next); fs.mkdirSync(join(next, 'dist'))
  fs.writeFileSync(join(next, 'dist/cli.js'), 'console.log("adng fixture")')
  fs.writeFileSync(join(next, '.gitignore'), 'data/\n')
  const git = (...args: string[]) => execFileSync('git', args, { cwd: next, windowsHide: true, stdio: 'pipe' })
  git('init', '-b', 'main'); git('add', '.'); git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'release')
  const commit = git('rev-parse', 'HEAD').toString().trim(), original = loadHost(f.home).runtime
  writeJson(join(next, 'data/host-release-gate.json'), { commit: '0'.repeat(40), build: 0, typecheck: 0, tests: 0 })
  expect(() => switchRuntime(f.home, next)).toThrow('exact-commit')
  expect(loadHost(f.home).runtime).toBe(original)
  writeJson(join(next, 'data/host-release-gate.json'), { commit, build: 0, typecheck: 0, tests: 0 })
  writeJson(join(f.home, 'data/bot.lock/pid.json'), { pid: process.pid })
  expect(() => switchRuntime(f.home, next)).toThrow('alive')
  fs.unlinkSync(join(f.home, 'data/bot.lock/pid.json'))
  expect(switchRuntime(f.home, next)).toMatchObject({ commit, paused: true, activationVerified: false })
  expect(loadHost(f.home).previous.runtime).toBe(original)
})

test('backup rejects inline credentials and missing pause without creating a snapshot', async () => {
  const f = fixture(), cfg = JSON.parse(fs.readFileSync(f.config, 'utf8')), out = join(f.root, 'backup')
  writeJson(f.config, { ...cfg, judgeApiKey: 'fixture-credential' })
  await expect(backupState(f.config, out)).rejects.toThrow('secret references')
  expect(fs.existsSync(out)).toBe(false)
  writeJson(f.config, cfg); fs.unlinkSync(join(f.home, 'configs/.adng.stop'))
  await expect(backupState(f.config, out)).rejects.toThrow('Pause')
})

test('state inventory access errors abort backup instead of treating the directory as missing', async () => {
  const f = fixture(), data = join(f.home, 'data/project'), out = join(f.root, 'backup')
  const original = fs.lstatSync
  const spy = vi.spyOn(fs, 'lstatSync').mockImplementation(((file: fs.PathLike, ...args: unknown[]) => {
    if (file === data) throw Object.assign(new Error('fixture access denied'), { code: 'EACCES' })
    return (original as Function)(file, ...args)
  }) as typeof fs.lstatSync)
  try { await expect(backupState(f.config, out)).rejects.toThrow('access denied'); expect(fs.existsSync(out)).toBe(false) }
  finally { spy.mockRestore() }
})

test('project handoff pauses only matching sources, keeps existing reasons and reports active/dirty state', async () => {
  const f = fixture(), cfg = JSON.parse(fs.readFileSync(f.config, 'utf8')), base = join(f.home, 'configs')
  try {
    fs.unlinkSync(join(base, '.adng.stop'))
    writeJson(join(base, 'other.json'), { ...cfg, dataDir: '../data/other' })
    await expect(pauseForHandoff(f.config)).rejects.toThrow('Shared pause flag')
    expect(fs.existsSync(join(base, '.adng.stop'))).toBe(false)
    writeJson(f.config, { ...cfg, stopFile: 'project.stop' })
    const data = join(f.home, 'data/integration'), stop = join(data, '.adng.stop')
    fs.mkdirSync(data); fs.writeFileSync(stop, 'Keep original reason')
    writeJson(join(base, 'integrations/repair.json'), { sourceConfig: '../project.json', dataDir: '../../data/integration' })
    writeJson(join(base, 'integrations/other.json'), { sourceConfig: '../other.json', dataDir: '../../data/other-repair' })
    expect(handoffStatus(f.config)).toMatchObject({ readyForBackup: false, entries: [{ paused: false }, { paused: true }] })
    const paused = await pauseForHandoff(f.config)
    expect(paused).toMatchObject({ readyForBackup: true, backupVerified: false })
    expect(fs.readFileSync(stop, 'utf8')).toBe('Keep original reason')
    expect(fs.existsSync(join(base, '.adng.stop'))).toBe(false)
    expect(fs.existsSync(join(f.home, 'data/other-repair/.adng.stop'))).toBe(false)
    writeJson(join(data, 'pid.json'), { pid: process.pid })
    expect(handoffStatus(f.config)).toMatchObject({ readyForBackup: false, entries: [{ idle: true }, { idle: false }] })
    fs.unlinkSync(join(data, 'pid.json')); fs.writeFileSync(join(f.project, 'dirty'), 'Keep changes')
    expect(handoffStatus(f.config).readyForBackup).toBe(false)
    expect(fs.readFileSync(join(f.project, 'dirty'), 'utf8')).toBe('Keep changes')
  } finally { fs.rmSync(f.root, { recursive: true, force: true }) }
})

test('restore supports long Windows tracked paths with only repository-local Git configuration', async () => {
  const f = fixture()
  try {
    const backup = join(f.root, 'snapshot'), destination = join(f.root, 'restored'), name = `${'long-'.repeat(32)}file.txt`
    fs.writeFileSync(join(f.project, name), 'long path fixture\n')
    f.git('-c', 'core.longpaths=true', 'add', '.')
    f.git('-c', 'core.longpaths=true', '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'long path')
    await backupState(f.config, backup)
    expect((await restoreState(backup, destination, loadHost(f.home).runtime)).paused).toBe(true)
    expect(fs.readFileSync(join(destination, 'project/README.md'), 'utf8')).toBe('fixture\n')
    expect(fs.readFileSync(join(destination, 'project', name), 'utf8')).toBe('long path fixture\n')
    expect(execFileSync('git', ['config', '--local', '--get', 'core.longpaths'], { cwd: join(destination, 'project'), encoding: 'utf8', windowsHide: true }).trim()).toBe('true')
  } finally { fs.rmSync(f.root, { recursive: true, force: true }) }
})
