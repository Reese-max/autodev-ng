import fs from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import Database from 'better-sqlite3'
import { assertQuiescent, assertIdleData, command, initHost, inside, readJson, writeJson, exists, matchingIntegrations } from './host.mjs'

const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex')
function assertNoInlineSecrets(value) {
  if (!value || typeof value !== 'object') return
  for (const [key, v] of Object.entries(value)) {
    if (/(api_?key|password|token|secret)$/i.test(key) && typeof v === 'string' && v && !/^\{(?:env|file):[^}]+\}$/.test(v)) throw new Error('Use secret references before exporting configuration')
    assertNoInlineSecrets(v)
  }
}
const excluded = name => name === 'node_modules' || name === 'pid.json' || name.endsWith('.pid') || name.endsWith('.lock') || name.endsWith('.lockdir') || name.endsWith('-wal') || name.endsWith('-shm') || name === 'heartbeat.json' || name === 'auth.json' || name === 'web-console.token' || /^\.env($|\.)/.test(name) || /^(credentials|cookies|tokens)(\.|$)/i.test(name)
async function copyTree(src, dst, excludedFiles) {
  const stat = fs.lstatSync(src)
  if (stat.isSymbolicLink()) throw new Error('Backup does not follow links')
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true })
    for (const name of fs.readdirSync(src)) {
      if (excluded(name)) { excludedFiles.push(join(src, name)); continue }
      await copyTree(join(src, name), join(dst, name), excludedFiles)
    }
  } else if (stat.isFile()) {
    fs.mkdirSync(dirname(dst), { recursive: true })
    if (/\.(db|sqlite|sqlite3)$/i.test(src)) {
      const db = new Database(src, { readonly: true, fileMustExist: true })
      try { await db.backup(dst) } finally { db.close() }
      const check = new Database(dst, { readonly: true })
      try { if (check.pragma('quick_check', { simple: true }) !== 'ok') throw new Error('SQLite integrity failure') } finally { check.close() }
    } else fs.copyFileSync(src, dst, fs.constants.COPYFILE_EXCL)
  } else throw new Error('Unsupported state file')
}
function inventory(root) {
  const files = {}
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isSymbolicLink()) throw new Error('Snapshot contains link')
      if (e.isDirectory()) walk(p)
      else if (e.isFile()) files[relative(root, p).replaceAll('\\', '/')] = hash(p)
      else throw new Error('Unsupported snapshot entry')
    }
  }
  walk(root); return files
}
export async function backupState(config, out) {
  config = resolve(config); out = resolve(out)
  if (exists(out)) throw new Error('Backup destination already exists')
  const source = assertQuiescent(config), excludedFiles = []
  assertNoInlineSecrets(source.raw)
  if ([source.data, source.project].some(p => inside(p, out))) throw new Error('Backup must be outside source data and project')
  const worktrees = command('git', ['worktree', 'list', '--porcelain'], source.project).split('\n').filter(l => l.startsWith('worktree ')).map(l => l.slice(9))
  for (const worktree of worktrees) if (command('git', ['status', '--porcelain'], worktree)) throw new Error('Commit or preserve dirty worktrees before backup')
  const integrations = matchingIntegrations(config)
  for (const i of integrations) {
    assertNoInlineSecrets(i.cfg)
    if (!exists(i.stop)) throw new Error('Pause every matching GitHub integration before backup')
    // Use the same PID checks without touching the original integration config.
    assertIdleData(i.data)
  }
  const temp = `${out}.partial-${randomUUID()}`
  fs.mkdirSync(temp, { recursive: true })
  try {
    if (exists(source.data)) await copyTree(source.data, join(temp, 'data'), excludedFiles)
    const backlog = resolve(source.base, source.raw.backlogFile)
    await copyTree(backlog, join(temp, 'BACKLOG.md'), excludedFiles)
    const common = resolve(source.project, command('git', ['rev-parse', '--git-common-dir'], source.project))
    const team = join(common, 'autodev-ng', 'team.db')
    if (exists(team)) {
      const db = new Database(team, { readonly: true })
      try { if (db.prepare('SELECT 1 FROM team_claims WHERE active=1 LIMIT 1').get()) throw new Error('Active team claims must be resolved before migration') } finally { db.close() }
      await copyTree(team, join(temp, 'team.db'), excludedFiles)
    }
    const heads = worktrees.map(w => command('git', ['rev-parse', 'HEAD'], w))
    command('git', ['bundle', 'create', join(temp, 'project.bundle'), '--all', ...heads], source.project)
    for (const key of ['goalFile', 'learningsFile', 'globalLearningsFile']) if (source.raw[key]) {
      const extra = resolve(source.base, source.raw[key])
      if (exists(extra)) await copyTree(extra, join(temp, 'extra', key), excludedFiles)
    }
    for (const i of integrations) {
      if (exists(i.data)) await copyTree(i.data, join(temp, 'integrations', i.name), excludedFiles)
    }
    // Recheck ownership before publishing the snapshot. Keep partial evidence on any failure.
    assertQuiescent(config)
    for (const i of integrations) { if (!exists(i.stop)) throw new Error('Integration resumed during snapshot'); assertIdleData(i.data) }
    const branch = command('git', ['symbolic-ref', '--short', 'HEAD'], source.project)
    const manifest = { version: 1, at: new Date().toISOString(), source: config, project: source.project, branch, config: source.raw, integrations, excludedFiles, worktrees, files: inventory(temp), activationRequiresRevalidation: true }
    writeJson(join(temp, 'manifest.json'), manifest)
    fs.renameSync(temp, out)
    return { gate: 'HOST_BACKUP_PASS', path: out, files: Object.keys(manifest.files).length, excludedFiles, remoteBackupVerified: false }
  } catch (e) { writeJson(join(temp, 'FAILED.json'), { gate: 'HOST_BACKUP_FAIL' }); throw e }
}
export async function restoreState(from, home, runtime) {
  from = resolve(from); home = resolve(home)
  if (exists(home) || inside(from, home) || inside(home, from)) throw new Error('Restore requires a separate new host directory')
  const m = readJson(join(from, 'manifest.json'))
  if (m.version !== 1 || !m.files || typeof m.files !== 'object') throw new Error('Invalid snapshot manifest')
  const actual = inventory(from); delete actual['manifest.json']
  if (Object.keys(actual).length !== Object.keys(m.files).length) throw new Error('Snapshot inventory mismatch')
  for (const [name, digest] of Object.entries(m.files)) {
    if (!inside(from, join(from, name)) || actual[name] !== digest || !/^[a-f0-9]{64}$/.test(digest)) throw new Error('Snapshot checksum mismatch')
  }
  for (const i of m.integrations || []) if (!/^[A-Za-z0-9_-]+\.json$/.test(i.name)) throw new Error('Invalid integration name')
  // Restore only data. No source-supplied commands are executed; git hooks are disabled.
  const staging = `${home}.partial-${randomUUID()}`, project = join(staging, 'project')
  fs.mkdirSync(staging, { recursive: true })
  try {
    const gitEnv = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null' }
    const hooks = `core.hooksPath=${join(staging, 'disabled-hooks')}`
    command('git', ['-c', hooks, '-c', 'core.longpaths=true', 'clone', '--config', 'core.longpaths=true', '--no-checkout', '--', join(from, 'project.bundle'), project], undefined, gitEnv)
    command('git', ['check-ref-format', `refs/heads/${m.branch}`], project, gitEnv)
    command('git', ['-c', hooks, 'checkout', m.branch, '--'], project, gitEnv)
    const hostDir = join(staging, 'host')
    initHost(hostDir, project, runtime)
    if (exists(join(from, 'data'))) await copyTree(join(from, 'data'), join(hostDir, 'data/project'), [])
    fs.copyFileSync(join(from, 'BACKLOG.md'), join(hostDir, 'data/BACKLOG.md'))
    if (exists(join(from, 'team.db'))) {
      fs.mkdirSync(join(project, '.git/autodev-ng'), { recursive: true })
      fs.copyFileSync(join(from, 'team.db'), join(project, '.git/autodev-ng/team.db'))
    }
    const cfg = { ...m.config, projectPath: join(home, 'project'), dataDir: '../data/project', backlogFile: '../data/BACKLOG.md', stopFile: '.adng.stop' }
    delete cfg.botTokenFile; delete cfg.botTestPeer; delete cfg.botAllowedUserIds
    // Old absolute evidence paths remain evidence; never rewrite their contents/hashes or auto-resume.
    for (const key of ['goalFile', 'learningsFile', 'worktreesDir']) if (cfg[key]) cfg[key] = `../data/project/${key === 'goalFile' ? 'GOAL.md' : key === 'learningsFile' ? 'learnings.md' : 'worktrees'}`
    for (const key of ['goalFile', 'learningsFile', 'globalLearningsFile']) if (exists(join(from, 'extra', key))) {
      cfg[key] = `../data/${key}.md`; fs.copyFileSync(join(from, 'extra', key), join(hostDir, 'data', `${key}.md`))
    }
    writeJson(join(hostDir, 'configs/project.json'), cfg)
    for (const i of m.integrations || []) {
      const dst = join(hostDir, 'data/integrations', i.name)
      if (exists(join(from, 'integrations', i.name))) await copyTree(join(from, 'integrations', i.name), dst, [])
      fs.mkdirSync(dst, { recursive: true }); fs.writeFileSync(join(dst, '.adng.stop'), 'Restored: ownership and receipts require revalidation\n')
      writeJson(join(hostDir, 'configs/integrations', i.name), { ...i.cfg, enabled: false, sourceConfig: '../project.json', dataDir: `../../data/integrations/${i.name}`, stopFile: `../../data/integrations/${i.name}/.adng.stop` })
    }
    writeJson(join(hostDir, 'data/restore-receipt.json'), { source: from, at: new Date().toISOString(), sourceProject: m.project, requires: ['new credentials', 'project remote and branch', 'path review', 'team claims and integration receipt revalidation', 'exclusive ownership', 'real worker acceptance'] })
    fs.renameSync(staging, home)
    return { gate: 'HOST_RESTORE_PASS', home: join(home, 'host'), paused: true, liveWorkerVerified: false }
  } catch (e) { writeJson(join(staging, 'FAILED.json'), { gate: 'HOST_RESTORE_FAIL' }); throw e }
}
