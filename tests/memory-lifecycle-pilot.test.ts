import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { afterEach, expect, test } from 'vitest'
// @ts-expect-error Maintainer-owned native script has no TypeScript declaration.
import { memoryPilotIsolation } from '../scripts/memory-lifecycle-isolation.mjs'

const source = path.resolve(import.meta.dirname, '..')
const temporary: string[] = []
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')
const ownerFiles = ['scripts/memory-snapshot.mjs', 'scripts/pause-gated-spawn.mjs', 'scripts/memory-lifecycle-isolation.mjs',
  'scripts/memory-lifecycle-state.mjs', 'scripts/memory-lifecycle-runtime.mjs', 'scripts/memory-lifecycle-jobs.mjs',
  'scripts/memory-lifecycle-publication.mjs', 'scripts/memory-lifecycle.mjs', 'scripts/memory-lifecycle-git-isolation.mjs']
const canonicalFiles = ['scripts/verify-memory-lifecycle.py', 'scripts/memory_origin.py', 'schemas/memory-envelope.schema.json']
afterEach(() => { for (const target of temporary.splice(0)) fs.rmSync(target, { recursive: true, force: true }) })
function unsupported() {
  if (process.platform === 'linux') return false
  expect(() => memoryPilotIsolation('/unopened-source', '/unopened-memory', { ADNG_MEMORY_LIFECYCLE_PILOT: 'requested' }))
    .toThrow('MEMORY_PILOT_PLATFORM_UNSUPPORTED')
  return true
}

function fixture() {
  const area = fs.mkdtempSync(path.join(os.tmpdir(), 'adng-memory-pilot-')); temporary.push(area)
  const root = path.join(area, 'writer'), memory = path.join(area, 'memory'), host = path.join(area, 'host')
  const canonical = path.join(area, 'canonical'), remote = path.join(area, 'remote.git')
  for (const relative of ['writer/scripts', 'writer/configs', 'writer/data/synthetic', 'memory', 'host/home',
    'host/hooks', 'host/template', 'canonical/scripts', 'canonical/schemas', 'remote.git']) {
    fs.mkdirSync(path.join(area, relative), { recursive: true, mode: 0o700 })
  }
  for (const name of ownerFiles) fs.copyFileSync(path.join(source, name), path.join(root, name))
  // Direct isolation unit controls do not execute this placeholder as policy.
  for (const name of canonicalFiles) fs.writeFileSync(path.join(canonical, name), 'synthetic pin bytes only\n')
  fs.writeFileSync(path.join(root, 'configs/synthetic.json'), JSON.stringify({ dataDir: '../data/synthetic', backlogFile: '../data/synthetic/BACKLOG.md' }))
  fs.writeFileSync(path.join(root, 'data/synthetic/BACKLOG.md'), '# Owned synthetic observation\n')
  const env = { PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`, HOME: path.join(host, 'home'),
    LANG: 'C.UTF-8', GIT_CONFIG_NOSYSTEM: '1', GIT_ATTR_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: os.devNull, GIT_ALLOW_PROTOCOL: 'file',
    GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1', GIT_TEMPLATE_DIR: path.join(host, 'template'),
    ADNG_MEMORY_DIR: memory, ADNG_MEMORY_LIFECYCLE_PILOT: path.join(host, 'pilot.json') }
  const git = (args: string[]) => execFileSync('git', args, { env, stdio: ['ignore', 'pipe', 'pipe'] })
  git(['init', '--bare', '--initial-branch=main', remote]); git(['init', '-b', 'main', memory])
  git(['-C', memory, 'remote', 'add', 'origin', remote])
  git(['-C', memory, 'config', 'user.name', 'Owned Fixture']); git(['-C', memory, 'config', 'user.email', 'owned@example.invalid'])
  const manifest = { version: 1, pilot_id: 'a'.repeat(32), source_commit: 'b'.repeat(40), source_tree: 'c'.repeat(40),
    canonical_commit: 'd'.repeat(40), canonical_tree: 'e'.repeat(40),
    owner_files: Object.fromEntries(ownerFiles.map(name => [name, hash(fs.readFileSync(path.join(root, name)))])),
    canonical_files: Object.fromEntries(canonicalFiles.map(name => [name, hash(fs.readFileSync(path.join(canonical, name)))])) }
  const save = () => fs.writeFileSync(env.ADNG_MEMORY_LIFECYCLE_PILOT, JSON.stringify(manifest) + '\n', { mode: 0o600 })
  save()
  return { area, root, memory, host, canonical, remote, env, git, manifest, save }
}

test('default snapshot mode remains off without opening source or memory paths', () => {
  expect(memoryPilotIsolation('/unopened-source', '/unopened-memory', {})).toBeNull()
})

test('valid isolated layout verifies source pins and native local remote without granting policy or action', () => {
  if (unsupported()) return
  const item = fixture(), result = memoryPilotIsolation(item.root, item.memory, item.env)
  expect(result.remote).toBe(item.remote); expect(Object.isFrozen(result)).toBe(true)
  expect(result).not.toHaveProperty('allowed'); expect(result).not.toHaveProperty('admission')
  expect(fs.existsSync(path.join(item.memory, '.last-snapshot'))).toBe(false)
})

test.each(['source-root', 'destination', 'config-escape', 'other-project', 'opaque-db', 'ambient-secret',
  'network-protocol', 'network-remote', 'source-pin', 'canonical-pin', 'extra-pass', 'duplicate-key',
  'symlink-input', 'public-root', 'git-include', 'git-hook', 'push-url', 'multiple-push-urls', 'receivepack',
  'remote-hook', 'destination-db', 'extra-destination', 'git-attributes', 'destination-symlink', 'dangling-destination',
  'unknown-index-path', 'deleted-unknown-head-path', 'info-attributes', 'info-exclude', 'home-attributes', 'xdg-attributes', 'assume-index', 'skip-index'])('pilot refuses %s before publication', kind => {
  if (unsupported()) return
  const item = fixture()
  let root = item.root, memory = item.memory
  if (kind === 'source-root') root = source
  if (kind === 'destination') memory = path.join(item.area, 'unowned-destination')
  if (kind === 'config-escape') fs.writeFileSync(path.join(root, 'configs/synthetic.json'), JSON.stringify({ dataDir: '../../outside', backlogFile: '../../outside/BACKLOG.md' }))
  if (kind === 'other-project') fs.writeFileSync(path.join(root, 'configs/other.json'), '{}')
  if (kind === 'opaque-db') fs.writeFileSync(path.join(root, 'data/synthetic/run.db'), 'must not open opaque evidence')
  if (kind === 'ambient-secret') Object.assign(item.env, { OPENAI_API_KEY: 'owned dummy never print' })
  if (kind === 'network-protocol') item.env.GIT_ALLOW_PROTOCOL = 'https'
  if (kind === 'network-remote') item.git(['-C', memory, 'remote', 'set-url', 'origin', 'https://owned-fixture.invalid/never-connect'])
  if (kind === 'source-pin') fs.appendFileSync(path.join(root, ownerFiles[0]!), '\n// changed producer\n')
  if (kind === 'canonical-pin') fs.appendFileSync(path.join(item.canonical, canonicalFiles[0]!), '\n# changed canonical\n')
  if (kind === 'extra-pass') { Object.assign(item.manifest, { PASS: true }); item.save() }
  if (kind === 'duplicate-key') fs.writeFileSync(item.env.ADNG_MEMORY_LIFECYCLE_PILOT, JSON.stringify(item.manifest).replace('{', '{"version":1,') + '\n')
  if (kind === 'symlink-input') {
    const target = path.join(root, 'data/synthetic/BACKLOG.md'); fs.unlinkSync(target)
    fs.symlinkSync(path.join(item.host, 'pilot.json'), target)
  }
  if (kind === 'public-root') fs.chmodSync(item.area, 0o755)
  if (kind === 'git-include') fs.appendFileSync(path.join(memory, '.git/config'), '\n[include]\npath = /must-not-read\n')
  if (kind === 'git-hook') fs.appendFileSync(path.join(memory, '.git/config'), '\n[core]\nfsmonitor = /must-not-run\n')
  if (kind === 'push-url') item.git(['-C', memory, 'config', 'remote.origin.pushurl', path.join(item.area, 'wrong-bare.git')])
  if (kind === 'multiple-push-urls') {
    item.git(['-C', memory, 'config', '--add', 'remote.origin.pushurl', item.remote])
    item.git(['-C', memory, 'config', '--add', 'remote.origin.pushurl', item.remote])
  }
  if (kind === 'receivepack') item.git(['-C', memory, 'config', 'remote.origin.receivepack', '/must-not-run'])
  if (kind === 'remote-hook') {
    fs.mkdirSync(path.join(item.remote, 'hooks'), { mode: 0o700 })
    fs.writeFileSync(path.join(item.remote, 'hooks/pre-receive'), '#!/bin/sh\nexit 1\n', { mode: 0o700 })
  }
  if (kind === 'destination-db') {
    fs.mkdirSync(path.join(memory, 'synthetic'), { mode: 0o700 }); fs.writeFileSync(path.join(memory, 'synthetic/run.db'), 'opaque sentinel, never open')
  }
  if (kind === 'extra-destination') fs.mkdirSync(path.join(memory, 'another-project'), { mode: 0o700 })
  if (kind === 'git-attributes') fs.writeFileSync(path.join(memory, '.gitattributes'), '*.md filter=must-not-run\n')
  if (kind === 'destination-symlink') {
    const outside = path.join(item.area, 'outside'); fs.mkdirSync(outside, { mode: 0o700 })
    fs.symlinkSync(outside, path.join(memory, 'synthetic'), 'dir')
  }
  if (kind === 'dangling-destination') fs.symlinkSync(path.join(item.area, 'must-not-create'), path.join(memory, '.last-snapshot'))
  if (kind === 'assume-index' || kind === 'skip-index') {
    fs.mkdirSync(path.join(memory, 'synthetic'), { mode: 0o700 }); fs.writeFileSync(path.join(memory, 'synthetic/BACKLOG.md'), 'owned synthetic old content')
    item.git(['-C', memory, 'add', '-A']); item.git(['-C', memory, 'update-index', kind === 'assume-index' ? '--assume-unchanged' : '--skip-worktree', 'synthetic/BACKLOG.md'])
  }
  if (kind === 'info-attributes' || kind === 'info-exclude') {
    fs.mkdirSync(path.join(memory, '.git/info'), { recursive: true }); fs.writeFileSync(path.join(memory, '.git/info', kind.slice(5)), '*.md text eol=lf\n')
  }
  if (kind === 'home-attributes') fs.writeFileSync(path.join(item.env.HOME, '.gitattributes'), '*.md text eol=lf\n')
  if (kind === 'xdg-attributes') Object.assign(item.env, { XDG_CONFIG_HOME: path.join(item.host, 'outside-config') })
  if (kind === 'unknown-index-path' || kind === 'deleted-unknown-head-path') {
    const unknown = path.join(memory, 'unmeasured-private.db')
    fs.writeFileSync(unknown, 'owned synthetic sentinel, never parse')
    item.git(['-C', memory, 'add', '-A'])
    if (kind === 'deleted-unknown-head-path') item.git(['-C', memory, 'commit', '-qm', 'owned metadata boundary'])
    fs.unlinkSync(unknown)
  }
  expect(() => memoryPilotIsolation(root, memory, item.env)).toThrow('MEMORY_PILOT_BOUNDARY_REFUSED')
  expect(fs.existsSync(path.join(item.memory, '.last-snapshot'))).toBe(false)
  expect(item.git(['--git-dir', item.remote, 'rev-list', '--all']).toString().trim()).toBe('')
})

test.each(['default', 'guarded'])('actual complete copied %s writer counterexample and refusal before publication', mode => {
  if (unsupported()) return
  const item = fixture()
  // Native entry control uses the complete tracked source ROOT, not a destination override.
  const archive = execFileSync('git', ['-C', source, 'archive', 'HEAD'], { maxBuffer: 25_000_000 })
  execFileSync('tar', ['-x', '-C', item.root], { input: archive })
  fs.rmSync(path.join(item.root, 'configs'), { recursive: true, force: true })
  fs.mkdirSync(path.join(item.root, 'configs'), { mode: 0o700 })
  fs.writeFileSync(path.join(item.root, 'configs/synthetic.json'), JSON.stringify({ dataDir: '../data/synthetic', backlogFile: '../data/synthetic/BACKLOG.md' }))
  for (const name of ownerFiles) fs.copyFileSync(path.join(source, name), path.join(item.root, name))
  fs.symlinkSync(path.join(source, 'node_modules'), path.join(item.root, 'node_modules'), 'dir')
  fs.writeFileSync(item.env.ADNG_MEMORY_LIFECYCLE_PILOT, '{}\n')
  const nativeEnv: Record<string, string> = { ...item.env }
  if (mode === 'default') delete nativeEnv.ADNG_MEMORY_LIFECYCLE_PILOT
  const result = spawnSync(process.execPath, [path.join(item.root, 'scripts/memory-snapshot.mjs')], { cwd: item.root, env: nativeEnv, timeout: 10_000, encoding: 'utf8' })
  const copied = fs.existsSync(path.join(item.memory, 'synthetic/BACKLOG.md'))
  const stamped = fs.existsSync(path.join(item.memory, '.last-snapshot'))
  const published = item.git(['--git-dir', item.remote, 'rev-list', '--all']).toString().trim() !== ''
  if (mode === 'default') {
    // Existing default native behavior remains unchanged. All effects stay local.
    expect(result.status).toBe(0); expect(copied && stamped && published).toBe(true)
  } else {
    expect(result.status).toBe(2); expect(JSON.parse(result.stdout).status).toBe('CANNOT_VERIFY')
    expect(copied || stamped || published).toBe(false)
  }
  console.info('MEMORY_PILOT_ISOLATION_NATIVE', JSON.stringify({ mode, exit: result.status, copied, stamped, published, remote: 'OWNED_LOCAL_BARE_ONLY' }))
})

test.each(['missing', 'non-executable-placeholder'])('actual opted-in entry refuses %s external artifact without admission or publication', mode => {
  if (unsupported()) return
  const item = fixture()
  fs.symlinkSync(path.join(source, 'node_modules'), path.join(item.root, 'node_modules'), 'dir')
  if (mode === 'missing') fs.unlinkSync(path.join(item.canonical, canonicalFiles[0]!))
  const result = spawnSync(process.execPath, [path.join(item.root, 'scripts/memory-snapshot.mjs'), '--lifecycle-prepare'], {
    cwd: item.root, env: item.env, timeout: 10_000, encoding: 'utf8' })
  expect(result.status).toBe(2)
  const receipt = JSON.parse(result.stdout)
  expect(receipt.status).toBe('CANNOT_VERIFY'); expect(receipt.memory_grants_action).toBe(false)
  if (mode === 'missing') expect(receipt.reason).toBe('MEMORY_PILOT_ARTIFACT_UNAVAILABLE')
  expect(fs.existsSync(path.join(item.host, 'current.json'))).toBe(false)
  expect(fs.existsSync(path.join(item.memory, '.memory-lifecycle.json'))).toBe(false)
  expect(fs.existsSync(path.join(item.memory, '.last-snapshot'))).toBe(false)
  expect(fs.existsSync(path.join(item.memory, 'synthetic/BACKLOG.md'))).toBe(false)
  expect(item.git(['--git-dir', item.remote, 'rev-list', '--all']).toString().trim()).toBe('')
})

test('unsupported capability refuses before any filesystem operation while default mode remains unchanged', () => {
  const descriptor = Object.getOwnPropertyDescriptor(process, 'platform')!
  try {
    Object.defineProperty(process, 'platform', { value: 'win32' })
    expect(memoryPilotIsolation('/unopened-source', '/unopened-memory', {})).toBeNull()
    expect(() => memoryPilotIsolation('/unopened-source', '/unopened-memory', { ADNG_MEMORY_LIFECYCLE_PILOT: 'requested' }))
      .toThrow('MEMORY_PILOT_PLATFORM_UNSUPPORTED')
  } finally { Object.defineProperty(process, 'platform', descriptor) }
})
