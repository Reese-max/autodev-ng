/** Isolated owning-writer pilot boundary only; never admission or permission. */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash } from 'node:crypto'
import { assertPilotGit } from './memory-lifecycle-git-isolation.mjs'

const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fail = () => { throw new Error('MEMORY_PILOT_BOUNDARY_REFUSED') }
const hex = (value, size) => typeof value === 'string' && new RegExp(`^[a-f0-9]{${size}}$`).test(value)
const requiredOwner = ['scripts/memory-snapshot.mjs', 'scripts/pause-gated-spawn.mjs', 'scripts/memory-lifecycle-isolation.mjs',
  'scripts/memory-lifecycle-state.mjs', 'scripts/memory-lifecycle-runtime.mjs', 'scripts/memory-lifecycle-jobs.mjs',
  'scripts/memory-lifecycle-publication.mjs', 'scripts/memory-lifecycle.mjs', 'scripts/memory-lifecycle-git-isolation.mjs']
const requiredCanonical = ['scripts/verify-memory-lifecycle.py', 'scripts/memory_origin.py', 'schemas/memory-envelope.schema.json']
const allowedEnv = new Set(['PATH', 'HOME', 'LANG', 'TZ',
  'PYTHONUTF8', 'PYTHONIOENCODING', 'PYTHONDONTWRITEBYTECODE', 'GIT_CONFIG_NOSYSTEM',
  'GIT_CONFIG_GLOBAL', 'GIT_ATTR_NOSYSTEM', 'GIT_ALLOW_PROTOCOL', 'GIT_TERMINAL_PROMPT', 'GIT_NO_REPLACE_OBJECTS',
  'GIT_TEMPLATE_DIR', 'ADNG_MEMORY_DIR', 'ADNG_MEMORY_LIFECYCLE_PILOT'])

function directory(target) {
  const stat = fs.lstatSync(target)
  if (!stat.isDirectory() || fs.realpathSync(target) !== path.resolve(target) ||
      stat.uid !== process.getuid() || (stat.mode & 0o077) !== 0) fail()
}

function read(target, limit = 1_000_000) {
  const entry = fs.lstatSync(target)
  if (!entry.isFile() || entry.nlink !== 1) fail()
  if (fs.realpathSync(target) !== path.resolve(target)) fail()
  const fd = fs.openSync(target, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK)
  try {
    const before = fs.fstatSync(fd)
    if (!before.isFile() || before.nlink !== 1 || before.size > limit) fail()
    const bytes = Buffer.alloc(before.size)
    let count = 0
    while (count < bytes.length) {
      const amount = fs.readSync(fd, bytes, count, bytes.length - count, null)
      if (amount === 0) fail()
      count += amount
    }
    const after = fs.fstatSync(fd), current = fs.lstatSync(target)
    for (const key of ['dev', 'ino', 'size', 'mtimeMs', 'ctimeMs', 'nlink']) {
      if (before[key] !== after[key] || before[key] !== current[key]) fail()
    }
    if (fs.realpathSync(target) !== path.resolve(target)) fail()
    return bytes
  } finally { fs.closeSync(fd) }
}

function pins(root, files, required) {
  if (!files || typeof files !== 'object' || Array.isArray(files) || Object.keys(files).length > 16 ||
      !required.every(name => Object.hasOwn(files, name))) fail()
  for (const [name, hash] of Object.entries(files)) {
    if (!/^(scripts|schemas)\/[A-Za-z0-9_-]+(?:\.schema)?\.(mjs|py|json)$/.test(name) || !hex(hash, 64)) fail()
    if (sha(read(path.join(root, name))) !== hash) fail()
  }
}

function names(target, limit) {
  const directory = fs.opendirSync(target), result = []
  try {
    for (let entry; (entry = directory.readSync()) !== null;) {
      if (result.length >= limit) fail()
      result.push(entry.name)
    }
    return result
  } finally { directory.closeSync() }
}

function syntheticInputs(root) {
  const configs = path.join(root, 'configs'), data = path.join(root, 'data')
  directory(configs); directory(data); directory(path.join(data, 'synthetic'))
  const configsFound = names(configs, 32).filter(name => name.endsWith('.json'))
  if (configsFound.length !== 1 || configsFound[0] !== 'synthetic.json') fail()
  const config = JSON.parse(read(path.join(configs, configsFound[0]), 4096).toString('utf8'))
  if (!config || Object.keys(config).length !== 2 || config.dataDir !== '../data/synthetic' ||
      config.backlogFile !== '../data/synthetic/BACKLOG.md') fail()
  const rootFiles = new Set(['patrol-log.md', 'PATROL-ALERTS.md', 'patrol-heartbeat.json'])
  for (const name of names(data, 8)) {
    if (name === 'synthetic') continue
    if (!rootFiles.has(name)) fail()
    read(path.join(data, name))
  }
  const files = new Set(['BACKLOG.md', 'USER-SIGNALS.md', 'NORTHSTAR.md', 'GOAL.md', 'learnings.md'])
  for (const name of names(path.join(data, 'synthetic'), 8)) {
    if (!files.has(name)) fail() // This pilot never opens opaque or real run.db.
    read(path.join(data, 'synthetic', name))
  }
}

function destinations(memory) {
  const project = path.join(memory, 'synthetic')
  const leaves = ['BACKLOG.md', 'USER-SIGNALS.md', 'NORTHSTAR.md', 'GOAL.md', 'learnings.md']
  const roots = new Set(['.git', '.last-snapshot', '.memory-lifecycle.json', 'patrol-log.md', 'PATROL-ALERTS.md', 'patrol-heartbeat.json', 'synthetic'])
  if (names(memory, 16).some(name => !roots.has(name))) fail()
  try {
    const info = fs.lstatSync(project)
    if (!info.isDirectory() || fs.realpathSync(project) !== project) fail()
    if (names(project, 8).some(name => !leaves.includes(name))) fail()
  } catch (error) { if (error.code !== 'ENOENT') throw error }
  for (const locator of ['.last-snapshot', '.memory-lifecycle.json', 'patrol-log.md', 'PATROL-ALERTS.md',
    'patrol-heartbeat.json', ...leaves.map(name => 'synthetic/' + name)]) {
    const target = path.join(memory, locator)
    try { read(target) } catch (error) { if (error.code !== 'ENOENT') throw error }
  }
}

export function memoryPilotIsolation(root, memory, environment = process.env) {
  if (environment.ADNG_MEMORY_LIFECYCLE_PILOT === undefined) return null
  if (process.platform !== 'linux' || !fs.constants.O_NOFOLLOW || typeof process.getuid !== 'function')
    throw Object.assign(new Error('MEMORY_PILOT_PLATFORM_UNSUPPORTED'), { code: 'MEMORY_PILOT_PLATFORM_UNSUPPORTED' })
  try {
    root = path.resolve(root); memory = path.resolve(memory)
    const area = path.dirname(root), host = path.join(area, 'host')
    const canonical = path.join(area, 'canonical'), remote = path.join(area, 'remote.git')
    if (!/^adng-memory-pilot-[A-Za-z0-9_-]+$/.test(path.basename(area)) ||
        path.basename(root) !== 'writer' || memory !== path.join(area, 'memory') ||
        environment.ADNG_MEMORY_DIR !== memory ||
        environment.ADNG_MEMORY_LIFECYCLE_PILOT !== path.join(host, 'pilot.json')) fail()
    for (const target of [area, root, memory, host, remote]) directory(target)
    if (Object.keys(environment).some(name => !allowedEnv.has(name)) || environment.HOME !== path.join(host, 'home') ||
        environment.GIT_CONFIG_NOSYSTEM !== '1' || environment.GIT_ATTR_NOSYSTEM !== '1' || environment.GIT_CONFIG_GLOBAL !== os.devNull ||
        environment.GIT_ALLOW_PROTOCOL !== 'file' || environment.GIT_TERMINAL_PROMPT !== '0' ||
        environment.GIT_NO_REPLACE_OBJECTS !== '1' || environment.GIT_TEMPLATE_DIR !== path.join(host, 'template')) fail()
    for (const target of [environment.HOME, environment.GIT_TEMPLATE_DIR, path.join(host, 'hooks')]) directory(target)
    if (names(environment.HOME, 1).length || names(environment.GIT_TEMPLATE_DIR, 1).length || names(path.join(host, 'hooks'), 1).length) fail()
    syntheticInputs(root)
    destinations(memory)
    const bytes = read(environment.ADNG_MEMORY_LIFECYCLE_PILOT, 64_000)
    const manifest = JSON.parse(bytes.toString('utf8'))
    if (bytes.toString('utf8') !== JSON.stringify(manifest) + '\n') fail() // Closed native serialization; no duplicate keys.
    const keys = ['version', 'pilot_id', 'source_commit', 'source_tree', 'canonical_commit', 'canonical_tree', 'owner_files', 'canonical_files']
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest) ||
        Object.keys(manifest).length !== keys.length || !keys.every(key => Object.hasOwn(manifest, key)) ||
        manifest.version !== 1 || !hex(manifest.pilot_id, 32) ||
        !['source_commit', 'source_tree', 'canonical_commit', 'canonical_tree'].every(key => hex(manifest[key], 40))) fail()
    pins(root, manifest.owner_files, requiredOwner)
    try { directory(canonical); pins(canonical, manifest.canonical_files, requiredCanonical) }
    catch (error) { if (error.code === 'ENOENT') throw Object.assign(new Error('MEMORY_PILOT_ARTIFACT_UNAVAILABLE'), { code: 'MEMORY_PILOT_ARTIFACT_UNAVAILABLE' }); throw error }
    assertPilotGit(memory, remote, host, environment, read)
    if (read(environment.ADNG_MEMORY_LIFECYCLE_PILOT, 64_000).compare(bytes) !== 0) fail()
    return Object.freeze({ root, memory, area, host, canonical, remote, manifestSha256: sha(bytes), pilotId: manifest.pilot_id,
      sourceCommit: manifest.source_commit, canonicalCommit: manifest.canonical_commit })
  } catch (error) { if (error.code === 'MEMORY_PILOT_ARTIFACT_UNAVAILABLE') throw error; fail() }
}

export { read as readPilotFile }
