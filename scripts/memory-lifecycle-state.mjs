/** Fixed owner store/anchor transactions. Canonical policy stays in Python. */
import fs from 'node:fs'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { withPauseGate } from './pause-gated-spawn.mjs'
import { readPilotFile } from './memory-lifecycle-isolation.mjs'

export const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex')
export const jsonBytes = value => Buffer.from(JSON.stringify(value) + '\n')
const fail = code => { throw new Error(code) }
const tokens = new WeakSet()
const hash = value => typeof value === 'string' && /^sha256:[a-f0-9]{64}$/.test(value)
const gitHash = value => value === null || typeof value === 'string' && /^[a-f0-9]{40}$/.test(value)
const sync = directory => { const fd = fs.openSync(directory, 'r'); try { fs.fsyncSync(fd) } finally { fs.closeSync(fd) } }
const optional = file => { try { return readPilotFile(file) } catch (error) { if (error.code === 'ENOENT') return null; throw error } }
export function parse(bytes) {
  const value = JSON.parse(bytes.toString('utf8'))
  if (!jsonBytes(value).equals(bytes)) fail('OWNER_STORE_SERIALIZATION_INVALID')
  return value
}
export const ownsWriter = token => tokens.has(token)
export function ownerDirectory(pilot, name) {
  if (!['jobs', 'grants'].includes(name)) fail('OWNER_DIRECTORY_INVALID')
  const target = path.join(pilot.host, name)
  try { mutate(pilot, () => fs.mkdirSync(target, { mode: 0o700 })) } catch (error) { if (error.code !== 'EEXIST') throw error }
  const info = fs.lstatSync(target)
  if (!info.isDirectory() || info.uid !== process.getuid() || info.mode & 0o077 || fs.realpathSync(target) !== target) fail('OWNER_DIRECTORY_UNSAFE')
  return target
}
export function mutate(pilot, action) {
  const result = withPauseGate(path.join(pilot.root, 'configs/.adng.stop'), action)
  if (!result.started) fail('OWNER_PAUSED_OR_GATE_BUSY')
  return result.value
}
export function writeNew(pilot, file, bytes) {
  return mutate(pilot, () => {
    const fd = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600)
    try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd) } finally { fs.closeSync(fd) }
    sync(path.dirname(file))
  })
}
function install(pilot, file, bytes) {
  const temporary = file + '.tmp-' + randomUUID()
  writeNew(pilot, temporary, bytes)
  mutate(pilot, () => { fs.renameSync(temporary, file); sync(path.dirname(file)) })
  if (!readPilotFile(file).equals(bytes)) fail('OWNER_STORE_WRITE_UNCERTAIN')
}
export async function withMemoryWriter(pilot, action) {
  const lock = path.join(pilot.host, 'writer.lock'), token = Object.freeze({ nonce: randomUUID() })
  mutate(pilot, () => fs.mkdirSync(lock, { mode: 0o700 })) // Never steal a dead/unknown lock.
  const lease = jsonBytes({ version: 1, pid: process.pid, nonce: token.nonce })
  try {
    writeNew(pilot, path.join(lock, 'lease.json'), lease); tokens.add(token)
    return await action(token)
  } finally {
    tokens.delete(token)
    try {
      if (readPilotFile(path.join(lock, 'lease.json')).equals(lease)) {
        fs.unlinkSync(path.join(lock, 'lease.json')); fs.rmdirSync(lock); sync(pilot.host)
      }
    } catch { /* Retain uncertain ownership, never clear a successor or unknown contents. */ }
  }
}
export function loadState(pilot, token) {
  if (fs.existsSync(path.join(pilot.host, 'intent.json'))) fail('OWNER_RECOVERY_REQUIRED')
  if (fs.existsSync(path.join(pilot.host, 'writer.lock')) && !tokens.has(token)) fail('OWNER_WRITER_BUSY')
  const raw = optional(path.join(pilot.host, 'current.json'))
  const historyRaw = optional(path.join(pilot.memory, '.memory-lifecycle.json'))
  const registryRaw = optional(path.join(pilot.host, 'origin-context.json'))
  if (raw === null) {
    if (historyRaw !== null || registryRaw !== null) fail('OWNER_ANCHOR_MISSING')
    return { raw: null, history: [], registryRaw: null, anchor: { version: 1, generation: 0,
      history_sha256: digest(jsonBytes([])), receipt_stream_sha256: digest(Buffer.from('[]')), registry_sha256: null,
      registry_file_sha256: null, active_head: null, published_head: null, published_tree: null, published_memory_id: null, manifest_sha256: pilot.manifestSha256 } }
  }
  const anchor = parse(raw)
  const fields = ['version', 'generation', 'history_sha256', 'receipt_stream_sha256', 'registry_sha256',
    'registry_file_sha256', 'active_head', 'published_head', 'published_tree', 'published_memory_id', 'manifest_sha256']
  if (!anchor || Object.keys(anchor).length !== fields.length || !fields.every(key => Object.hasOwn(anchor, key)) ||
      anchor.version !== 1 || !Number.isSafeInteger(anchor.generation) || anchor.generation < 1 ||
      anchor.manifest_sha256 !== pilot.manifestSha256 || !hash(anchor.receipt_stream_sha256) ||
      !hash(anchor.history_sha256) || !hash(anchor.registry_sha256) || !hash(anchor.registry_file_sha256) ||
      !gitHash(anchor.published_head) || !gitHash(anchor.published_tree) ||
      !(anchor.published_memory_id === null || /^snapshot-[a-f0-9]{32}$/.test(anchor.published_memory_id)) ||
      !(anchor.active_head === null || typeof anchor.active_head === 'string' && /^[a-z0-9][a-z0-9._:-]{2,127}$/.test(anchor.active_head)) ||
      historyRaw === null || registryRaw === null || digest(historyRaw) !== anchor.history_sha256 ||
      digest(registryRaw) !== anchor.registry_file_sha256) fail('OWNER_ANCHOR_MISMATCH')
  const history = parse(historyRaw)
  if (!Array.isArray(history) || history.length > 256 || parse(registryRaw).sha256 !== anchor.registry_sha256) fail('OWNER_ANCHOR_MISMATCH')
  return { raw, history, registryRaw, anchor }
}
export function commitState(pilot, token, previous, history, checkpoint, streamPin, activeHead, publication = null) {
  if (!tokens.has(token)) fail('OWNER_WRITER_REQUIRED')
  const current = loadState(pilot, token)
  if ((current.raw === null) !== (previous.raw === null) || current.raw !== null && !current.raw.equals(previous.raw)) fail('OWNER_STATE_CHANGED')
  if (!hash(streamPin) || !hash(checkpoint.sha256)) fail('OWNER_CANONICAL_PIN_INVALID')
  if (!Array.isArray(history) || history.length > 256 || publication &&
      (!gitHash(publication.head) || publication.head === null || !gitHash(publication.tree) || publication.tree === null || publication.memory_id !== activeHead)) fail('OWNER_PUBLICATION_INVALID')
  const historyRaw = jsonBytes(history), registryRaw = jsonBytes(checkpoint)
  if (historyRaw.length > 1_000_000 || registryRaw.length > 1_000_000) fail('OWNER_STORE_LIMIT')
  const anchor = { ...previous.anchor, generation: previous.anchor.generation + 1, history_sha256: digest(historyRaw),
    receipt_stream_sha256: streamPin, registry_sha256: checkpoint.sha256, registry_file_sha256: digest(registryRaw), active_head: activeHead,
    ...(publication ? { published_head: publication.head, published_tree: publication.tree, published_memory_id: publication.memory_id } : {}) }
  const raw = jsonBytes(anchor), intent = jsonBytes({ version: 1, nonce: randomUUID(),
    previous_anchor_sha256: previous.raw === null ? null : digest(previous.raw), next_anchor_sha256: digest(raw),
    history_sha256: digest(historyRaw), registry_file_sha256: digest(registryRaw) })
  const intentPath = path.join(pilot.host, 'intent.json')
  writeNew(pilot, intentPath, intent)
  install(pilot, path.join(pilot.host, 'origin-context.json'), registryRaw)
  install(pilot, path.join(pilot.memory, '.memory-lifecycle.json'), historyRaw)
  install(pilot, path.join(pilot.host, 'current.json'), raw)
  if (!readPilotFile(intentPath).equals(intent)) fail('OWNER_INTENT_CHANGED')
  mutate(pilot, () => { fs.unlinkSync(intentPath); sync(pilot.host) })
  return loadState(pilot, token)
}
