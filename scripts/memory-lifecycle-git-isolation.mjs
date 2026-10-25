/** Exact isolated Git transport profile; no general repository configuration. */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const fail = () => { throw new Error('MEMORY_PILOT_GIT_REFUSED') }
function absent(file) {
  try { fs.lstatSync(file); return false } catch (error) { if (error.code === 'ENOENT') return true; throw error }
}
function directory(file) {
  if (!absent(file) && (!fs.lstatSync(file).isDirectory() || fs.realpathSync(file) !== file)) fail()
}
function emptyHooks(file) {
  if (absent(file)) return
  directory(file)
  const entries = fs.opendirSync(file)
  try { if (entries.readSync() !== null) fail() } finally { entries.closeSync() }
}
function configProfile(raw, bare) {
  const sections = bare ? new Set(['core']) : new Set(['core', 'user', 'remote "origin"', 'branch "main"'])
  const allowed = { core: new Set(['repositoryformatversion', 'filemode', 'bare', 'logallrefupdates']),
    user: new Set(['name', 'email']), 'remote "origin"': new Set(['url', 'fetch', 'pushurl']),
    'branch "main"': new Set(['remote', 'merge']) }
  let section = ''
  for (const source of raw.split('\n')) {
    const line = source.trim()
    if (!line || line.startsWith('#') || line.startsWith(';')) continue
    const header = /^\[([^\]]+)\]$/.exec(line)
    if (header) { section = header[1]; if (!sections.has(section)) fail(); continue }
    const entry = /^([a-zA-Z][a-zA-Z0-9]*)\s*=\s*(.*)$/.exec(line)
    if (!entry || !allowed[section]?.has(entry[1])) fail()
    if (section === 'core' && entry[1] === 'bare' && entry[2] !== String(bare)) fail()
  }
}
function payloadMetadata(memory, options) {
  const files = new Set(['.last-snapshot', '.memory-lifecycle.json', 'patrol-log.md', 'PATROL-ALERTS.md', 'patrol-heartbeat.json',
    ...['BACKLOG.md', 'USER-SIGNALS.md', 'NORTHSTAR.md', 'GOAL.md', 'learnings.md'].map(name => 'synthetic/' + name)])
  const command = args => execFileSync('git', ['-C', memory, ...args], { ...options, maxBuffer: 64_000 })
  for (const row of command(['ls-files', '--stage', '-z']).toString('utf8').split('\0').filter(Boolean)) {
    const match = /^100644 [a-f0-9]{40} 0\t(.+)$/.exec(row)
    if (!match || !files.has(match[1])) fail()
  }
  for (const row of command(['ls-files', '-v', '-z']).toString('utf8').split('\0').filter(Boolean)) {
    if (!row.startsWith('H ') || !files.has(row.slice(2))) fail()
  }
  const ref = command(['for-each-ref', '--format=%(objectname)', 'refs/heads/main']).toString('utf8').trim()
  if (!ref) return
  if (!/^[a-f0-9]{40}$/.test(ref)) fail()
  for (const row of command(['ls-tree', '-r', '-z', '--full-tree', ref]).toString('utf8').split('\0').filter(Boolean)) {
    const match = /^100644 blob [a-f0-9]{40}\t(.+)$/.exec(row)
    if (!match || !files.has(match[1])) fail()
  }
}
export function assertPilotGit(memory, remote, host, environment, read) {
  const local = path.join(memory, '.git')
  for (const root of [local, remote]) {
    for (const name of ['', 'objects', 'objects/info', 'refs', 'refs/heads']) directory(path.join(root, name))
    for (const name of ['objects/info/alternates', 'info/attributes', 'info/exclude']) if (!absent(path.join(root, name))) fail()
    emptyHooks(path.join(root, 'hooks'))
    if (read(path.join(root, 'HEAD'), 4096).toString('utf8') !== 'ref: refs/heads/main\n') fail()
  }
  for (const name of ['index', 'packed-refs', 'refs/heads/main']) if (!absent(path.join(local, name))) read(path.join(local, name))
  if (!absent(path.join(local, 'index.lock'))) fail()
  configProfile(read(path.join(local, 'config'), 32_000).toString('utf8'), false)
  configProfile(read(path.join(remote, 'config'), 32_000).toString('utf8'), true)
  const options = { env: environment, timeout: 5_000, stdio: ['ignore', 'pipe', 'pipe'] }
  payloadMetadata(memory, options)
  for (const direction of [[], ['--push']]) {
    const url = execFileSync('git', ['-c', 'core.fsmonitor=false', '-c', `core.hooksPath=${path.join(host, 'hooks')}`,
      '-C', memory, 'remote', 'get-url', ...direction, '--all', 'origin'], { env: environment, encoding: 'utf8',
      timeout: 5_000, maxBuffer: 4096, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
    if (url !== remote) fail()
  }
}
