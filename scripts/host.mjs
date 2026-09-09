// Windows single-writer deployment. No provider calls or remote writes unless explicitly requested.
import fs from 'node:fs'
import { resolve, join, dirname, relative, isAbsolute } from 'node:path'
import { hostname } from 'node:os'
import { randomUUID } from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import Database from 'better-sqlite3'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'))
export function exists(file) {
  try { fs.lstatSync(file); return true } catch (error) { if (error.code === 'ENOENT') return false; throw error }
}
export function writeJson(file, value) {
  fs.mkdirSync(dirname(file), { recursive: true })
  const temp = `${file}.tmp-${randomUUID()}`
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
  fs.renameSync(temp, file)
}
export function command(exe, args, cwd, env = process.env) {
  return execFileSync(exe, args, { cwd, env, encoding: 'utf8', windowsHide: true, timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}
export function inside(root, path) {
  // Resolve existing parents too: a new destination may sit below a Windows junction.
  const canonical = input => {
    let parent = resolve(input)
    const suffix = []
    for (;;) {
      try { return resolve(fs.realpathSync.native(parent), ...suffix) }
      catch (error) {
        if (error.code !== 'ENOENT' || dirname(parent) === parent) throw error
        suffix.unshift(relative(dirname(parent), parent)); parent = dirname(parent)
      }
    }
  }
  const rel = relative(canonical(root), canonical(path))
  return rel !== '..' && !rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(rel)
}
export function revision(runtime) { return command('git', ['rev-parse', 'HEAD'], runtime) }
const samePath = (a, b) => inside(a, b) && inside(b, a)
export function loadHost(home) {
  home = resolve(home)
  const h = readJson(join(home, 'host.json'))
  if (h.version !== 1 || !/^[A-Za-z0-9_-]{1,80}$/.test(h.hostId) || !isAbsolute(h.runtime) || !/^[a-f0-9]{40}$/.test(h.commit)) throw new Error('Invalid host profile')
  return { ...h, home, config: join(home, 'configs', 'project.json') }
}
export function initHost(home, project, runtime = ROOT) {
  home = resolve(home); project = resolve(project); runtime = resolve(runtime)
  if (fs.existsSync(home)) throw new Error('Host home must not exist; existing files will not be overwritten')
  command('git', ['rev-parse', '--show-toplevel'], project)
  if (!fs.existsSync(join(runtime, 'dist', 'cli.js'))) throw new Error('Build runtime first')
  const h = { version: 1, hostId: `${hostname().replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 60)}-${randomUUID().slice(0, 8)}`, runtime, commit: revision(runtime), ownerPolicy: 'one-host-per-repo' }
  fs.mkdirSync(join(home, 'configs'), { recursive: true })
  fs.mkdirSync(join(home, 'data'), { recursive: true })
  fs.writeFileSync(join(home, 'configs', '.adng.stop'), 'New host: validate credentials, ownership and restore before enabling.\n', { flag: 'wx' })
  fs.writeFileSync(join(home, 'data', 'BACKLOG.md'), '', { flag: 'wx' })
  writeJson(join(home, 'configs', 'project.json'), { projectPath: project, dataDir: '../data/project', backlogFile: '../data/BACKLOG.md', stopFile: '.adng.stop', engine: 'mock', dailySoftUsd: 1, dailyHardUsd: 2 })
  writeJson(join(home, 'host.json'), h)
  return loadHost(home)
}
export async function doctor(home, live = false) {
  const h = loadHost(home), checks = []
  const check = (name, fn) => { try { fn(); checks.push({ name, ok: true }) } catch { checks.push({ name, ok: false }) } }
  check('node>=22', () => { if (+process.versions.node.split('.')[0] < 22) throw 0 })
  check('native-sqlite', () => { const db = new Database(':memory:'); try { db.prepare('SELECT 1').get() } finally { db.close() } })
  check('runtime-commit', () => { if (revision(h.runtime) !== h.commit || command('git', ['status', '--porcelain'], h.runtime)) throw 0 })
  check('built-cli', () => { if (!command(process.execPath, [join(h.runtime, 'dist/cli.js'), '--help'], h.runtime).includes('adng')) throw 0 })
  const { loadMonitorConfig } = await import(pathToFileURL(join(h.runtime, 'dist/bot/monitor.js')).href)
  let cfg
  check('project-config', () => { cfg = loadMonitorConfig(h.config) })
  if (cfg) {
    check('project-git', () => command('git', ['rev-parse', '--show-toplevel'], cfg.projectPath))
    check('project-branch', () => command('git', ['symbolic-ref', '--quiet', 'HEAD'], cfg.projectPath))
    check('backlog-readable', () => fs.readFileSync(cfg.backlogFile))
    check('host-owned-state', () => { if (![cfg.dataDir, cfg.backlogFile, cfg.stopFile].every(p => inside(h.home, p))) throw 0 })
    check('engine-configured', () => { const raw = readJson(h.config); if (raw.engine === 'mock' || !raw.defaultEngine || !raw.engines?.[raw.defaultEngine]) throw 0 })
    const { expandConfigPaths } = await import(pathToFileURL(join(h.runtime, 'dist/cli/assemble.js')).href)
    check('secret-references', () => expandConfigPaths(dirname(h.config), cfg))
    check('bot-credentials', () => {
      const raw = readJson(h.config)
      if (raw.botTokenFile && !fs.existsSync(resolve(dirname(h.config), raw.botTokenFile))) throw 0
    })
    if (live) {
      check('github-login', () => command('gh', ['api', '--hostname', 'github.com', 'user', '--jq', '.login']))
      const raw = readJson(h.config), engine = raw.engines?.[raw.defaultEngine]
      check('worker-cli', () => { if (engine?.adapter !== 'codex') throw 0; command(engine.command || 'codex', ['--version']) })
      // Version/login probes are prerequisites, never proof of a worker turn or sandbox acceptance.
    }
  }
  return { hostId: h.hostId, commit: h.commit, checks, liveWorkerVerified: false, ok: checks.every(c => c.ok) }
}
export async function health(home) {
  const h = loadHost(home)
  const { readMonitor, loadMonitorConfig } = await import(pathToFileURL(join(h.runtime, 'dist/bot/monitor.js')).href)
  const monitor = readMonitor(loadMonitorConfig(h.config), h.config)
  return { hostId: h.hostId, commit: h.commit, runtime: h.runtime, ...monitor, ok: monitor.health === 'observed' && monitor.errors.length === 0 }
}
export function assertQuiescent(config, runtime = ROOT) {
  const raw = readJson(config), base = dirname(resolve(config)), data = resolve(base, raw.dataDir)
  if (!fs.existsSync(resolve(base, raw.stopFile || '.adng.stop'))) throw new Error('Pause the selected project first')
  assertIdleData(data)
  return { raw, base, data, project: resolve(base, raw.projectPath), runtime }
}
export function assertIdleData(data) {
  const visit = dir => {
    if (!exists(dir)) return
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isSymbolicLink()) throw new Error('State contains a link; inspect before migration')
      if (e.isDirectory() && e.name !== 'node_modules') visit(p)
      if (e.isFile() && (e.name === 'pid.json' || e.name.endsWith('.pid'))) {
        const value = fs.readFileSync(p, 'utf8').trim()
        const pid = e.name === 'pid.json' ? JSON.parse(value).pid : Number(value)
        if (!Number.isSafeInteger(pid) || pid < 1) throw new Error('Invalid PID evidence; inspect before migration')
        try { process.kill(pid, 0); throw new Error('A recorded process is still alive') } catch (err) { if (err.code !== 'ESRCH') throw err }
      }
    }
  }
  visit(data)
}
export function matchingIntegrations(config) {
  config = resolve(config)
  const dir = join(dirname(config), 'integrations'), integrations = []
  if (!exists(dir)) return integrations
  for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.json') && !n.endsWith('.example.json'))) {
    const originalConfig = join(dir, name), cfg = readJson(originalConfig)
    if (!cfg.sourceConfig || !samePath(resolve(dir, cfg.sourceConfig), config)) continue
    const data = resolve(dir, cfg.dataDir), stop = cfg.stopFile ? resolve(dir, cfg.stopFile) : join(data, '.adng.stop')
    integrations.push({ name, cfg, data, stop, originalConfig })
  }
  return integrations
}
export function handoffStatus(config) {
  config = resolve(config)
  const raw = readJson(config), base = dirname(config), project = resolve(base, raw.projectPath)
  const sources = [{ config, data: resolve(base, raw.dataDir), stop: resolve(base, raw.stopFile || '.adng.stop') },
    ...matchingIntegrations(config).map(i => ({ config: i.originalConfig, data: i.data, stop: i.stop }))]
  const entries = sources.map(s => {
    let idle = true, error = ''
    try { assertIdleData(s.data) } catch (e) { idle = false; error = e.message }
    return { ...s, paused: exists(s.stop), idle, error }
  })
  const checks = []
  const check = (name, fn) => { try { fn(); checks.push({ name, ok: true }) } catch (e) { checks.push({ name, ok: false, error: e.message }) } }
  check('worktrees-clean', () => {
    for (const row of command('git', ['worktree', 'list', '--porcelain'], project).split('\n').filter(l => l.startsWith('worktree ')))
      if (command('git', ['status', '--porcelain'], row.slice(9))) throw new Error('Dirty worktree preserved; commit or preserve changes before backup')
  })
  check('team-claims-idle', () => {
    const common = resolve(project, command('git', ['rev-parse', '--git-common-dir'], project)), file = join(common, 'autodev-ng/team.db')
    if (!exists(file)) return
    const db = new Database(file, { readonly: true, fileMustExist: true })
    try { if (db.prepare('SELECT 1 FROM team_claims WHERE active=1 LIMIT 1').get()) throw new Error('Active team claims require inspection') } finally { db.close() }
  })
  return { config, project, at: new Date().toISOString(), entries, checks,
    readyForBackup: entries.every(e => e.paused && e.idle) && checks.every(c => c.ok), backupVerified: false }
}
export async function pauseForHandoff(config) {
  config = resolve(config)
  const raw = readJson(config), base = dirname(config), integrations = matchingIntegrations(config)
  const stop = resolve(base, raw.stopFile || '.adng.stop'), stops = [stop, ...integrations.map(i => i.stop)]
  // A project action must not pause another project through a shared flag.
  for (const dir of [base, join(base, 'integrations')]) if (exists(dir)) {
    for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.json') && !n.endsWith('.example.json'))) {
      const file = join(dir, name), other = readJson(file)
      if (samePath(file, config) || integrations.some(i => samePath(i.originalConfig, file)) || !other.dataDir || (!other.projectPath && !other.sourceConfig)) continue
      const otherStop = resolve(dir, other.stopFile || (other.sourceConfig ? join(other.dataDir, '.adng.stop') : '.adng.stop'))
      if (stops.some(s => samePath(s, otherStop))) throw new Error('Shared pause flag; configure a project-specific stopFile before handoff')
    }
  }
  const inputs = [config, ...integrations.map(i => i.originalConfig)].map(path => [path, fs.readFileSync(path, 'utf8')])
  const { withPauseGate } = await import('../dist/supervisor/pause-gate.js')
  for (const file of stops) fs.mkdirSync(dirname(file), { recursive: true })
  withPauseGate(stops, () => {
    if (inputs.some(([path, text]) => fs.readFileSync(path, 'utf8') !== text)) throw new Error('Configuration changed before pause')
    for (const file of stops) if (!exists(file)) { fs.mkdirSync(dirname(file), { recursive: true }); fs.writeFileSync(file, 'Operator requested project handoff; existing attempts and artifacts preserved.\n', { flag: 'wx' }) }
  })
  return handoffStatus(config)
}
export function switchRuntime(home, runtime) {
  const h = loadHost(home)
  assertQuiescent(h.config)
  assertIdleData(join(h.home, 'data'))
  runtime = resolve(runtime)
  if (runtime === h.runtime) throw new Error('Candidate is already active')
  if (command('git', ['status', '--porcelain'], runtime)) throw new Error('Candidate runtime is dirty')
  const commit = revision(runtime)
  const gate = readJson(join(runtime, 'data', 'host-release-gate.json'))
  if (gate.commit !== commit || !['build', 'typecheck', 'tests'].every(k => gate[k] === 0)) throw new Error('Candidate needs exact-commit build/typecheck/test receipt')
  if (!command(process.execPath, [join(runtime, 'dist/cli.js'), '--help'], runtime).includes('adng')) throw new Error('Candidate smoke failed')
  const profile = readJson(join(h.home, 'host.json'))
  writeJson(join(h.home, `host.json.bak-${Date.now()}`), profile)
  writeJson(join(h.home, 'host.json'), { ...profile, runtime, commit, previous: { runtime: h.runtime, commit: h.commit } })
  return { commit, paused: true, activationVerified: false }
}
export async function runHost(home, role) {
  const h = loadHost(home)
  if (!['worker', 'bot'].includes(role)) throw new Error('Role must be worker or bot')
  if (revision(h.runtime) !== h.commit || command('git', ['status', '--porcelain'], h.runtime)) throw new Error('Runtime drift; refusing launch')
  if (role === 'worker' && fs.existsSync(join(h.home, 'configs', '.adng.stop'))) return { paused: true }
  if (role === 'worker' && !(await doctor(home)).ok) throw new Error('Host doctor failed')
  const args = role === 'bot' ? ['bot', '--configs-dir', join(h.home, 'configs')] : ['supervise', '--config', h.config, '--guardian', 'off']
  const log = fs.openSync(join(h.home, 'data', `${role}-console.log`), 'a')
  try {
    const code = await new Promise((ok, fail) => {
      const child = spawn(process.execPath, [join(h.runtime, 'dist/cli.js'), ...args], { cwd: h.runtime, windowsHide: true, stdio: ['ignore', log, log] })
      child.once('error', fail); child.once('exit', code => ok(code ?? 1))
    })
    if (code !== 0) throw new Error(`${role} exited ${code}`)
    return { launched: true, readinessVerified: false }
  } finally { fs.closeSync(log) }
}
async function main() {
  const { values: v, positionals } = parseArgs({ allowPositionals: true, options: { home: { type: 'string' }, project: { type: 'string' }, runtime: { type: 'string' }, config: { type: 'string' }, out: { type: 'string' }, from: { type: 'string' }, live: { type: 'boolean' }, role: { type: 'string' }, help: { type: 'boolean' } } })
  const action = positionals[0]
  if (v.help || !action) { console.log('host: init --home NEW --project GIT | doctor|health --home DIR [--live] | handoff|pause --config FILE | backup --config FILE --out NEW | restore --from SNAPSHOT --home NEW | switch --home DIR --runtime RELEASE | rollback --home DIR | run --home DIR --role worker|bot'); return }
  const need = key => { if (!v[key]) throw new Error(`--${key} required`); return v[key] }
  let result
  if (action === 'init') result = initHost(need('home'), need('project'), v.runtime)
  else if (action === 'handoff' || action === 'pause') { result = action === 'pause' ? await pauseForHandoff(need('config')) : handoffStatus(need('config')); if (!result.readyForBackup) process.exitCode = 2 }
  else if (action === 'doctor') { result = await doctor(need('home'), v.live); if (!result.ok) process.exitCode = 2 }
  else if (action === 'health') { result = await health(need('home')); if (v.out) writeJson(resolve(v.out), result); if (!result.ok) process.exitCode = 2 }
  else if (action === 'switch') result = switchRuntime(need('home'), need('runtime'))
  else if (action === 'rollback') { const h = loadHost(need('home')); if (!h.previous || revision(h.previous.runtime) !== h.previous.commit) throw new Error('Previous runtime unavailable or changed'); result = switchRuntime(h.home, h.previous.runtime) }
  else if (action === 'run') result = await runHost(need('home'), need('role'))
  else if (action === 'backup') result = await (await import('./host-state.mjs')).backupState(need('config'), need('out'))
  else if (action === 'restore') result = await (await import('./host-state.mjs')).restoreState(need('from'), need('home'), v.runtime || ROOT)
  else throw new Error('Unknown host command')
  console.log(JSON.stringify(result, null, 2))
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(() => { console.error('HOST_FAIL: check paths, pause/process state and prerequisites; existing state was not cleared'); process.exitCode = 1 })
