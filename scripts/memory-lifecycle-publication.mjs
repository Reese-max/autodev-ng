/** Independent exact native publication permission. Memory never issues it. */
import path from 'node:path'
import fs from 'node:fs'
import { memoryPilotIsolation, readPilotFile } from './memory-lifecycle-isolation.mjs'
import { digest, jsonBytes, parse, loadState, ownerDirectory, writeNew, mutate, ownsWriter } from './memory-lifecycle-state.mjs'
import { verifyObservation, nativeGit, nativeHead } from './memory-lifecycle-runtime.mjs'
import { loadJob, loadStage, acceptedRead } from './memory-lifecycle-jobs.mjs'

const issued = new WeakMap()
const fail = code => { throw new Error(code) }
function record(authority) {
  const value = issued.get(authority)
  if (!value) fail('OWNER_PUBLICATION_AUTHORITY_INVALID')
  return value
}
export function publicationArguments(authority, args) {
  if (authority === undefined) return args
  const value = record(authority), { pilot } = value
  if (args.includes('push')) {
    const head = value.ownCommit ?? value.stage.previous_head
    if (head === null) fail('OWNER_PUSH_HEAD_MISSING')
    args = ['-C', pilot.memory, 'push', '-q', `--force-with-lease=refs/heads/main:${value.stage.previous_head ?? ''}`,
      pilot.remote, `${head}:refs/heads/main`]
  }
  return ['-c', 'core.fsmonitor=false', '-c', `core.hooksPath=${path.join(pilot.host, 'hooks')}`,
    '-c', 'protocol.allow=never', '-c', 'protocol.file.allow=always', ...args]
}
export function publicationMessage(authority, today) {
  return `snapshot ${today}` + (authority === undefined ? '' : `\n\nadng-memory-pilot:${record(authority).grant.nonce}`)
}
export function checkPublication(authority, phase) {
  if (authority === undefined) return
  const value = record(authority), { pilot, token, stage, job, grant } = value
  memoryPilotIsolation(pilot.root, pilot.memory)
  const grantPath = path.join(pilot.host, 'grants', stage.stage_id + '.json'), grantBytes = readPilotFile(grantPath, 8192), metadata = fs.lstatSync(grantPath)
  if (!grantBytes.equals(value.grantRaw) ||
      ['dev', 'ino', 'size', 'mtimeMs', 'ctimeMs'].some(key => metadata[key] !== value.grantMetadata[key])) fail('OWNER_PUBLICATION_GRANT_CHANGED')
  if (!ownsWriter(token) || Math.floor(Date.now() / 1000) >= grant.expires_at) fail('OWNER_PUBLICATION_GRANT_EXPIRED')
  const state = loadState(pilot, token), current = acceptedRead(pilot, state)
  if (!state.raw || digest(state.raw) !== stage.anchor_sha256 || current.status !== 'ACTIVE' ||
      current.read.active_head !== job.candidate.memory_id || current.read.source.content_hash !== job.observation.fact.content_hash) fail('OWNER_PUBLICATION_STATE_CHANGED')
  verifyObservation(pilot, job.observation, true)
  if (mutate(pilot, () => nativeGit(pilot, ['-C', pilot.memory, 'write-tree'])) !== stage.payload_tree) fail('OWNER_PUBLICATION_TREE_CHANGED')
  const local = nativeHead(pilot, pilot.memory), remote = nativeHead(pilot, pilot.remote, true)
  if (local !== (value.ownCommit ?? stage.previous_head) ||
      remote !== (value.pushed ? value.ownCommit ?? stage.previous_head : stage.previous_head)) fail('OWNER_PUBLICATION_HEAD_CHANGED')
  if (phase === 'stamp' && !value.pushed) fail('OWNER_PUBLICATION_UNCONFIRMED')
}
export function observedPublication(authority, phase, today) {
  if (authority === undefined) return
  const value = record(authority), { pilot, stage } = value
  if (phase === 'commit') {
    const head = nativeHead(pilot, pilot.memory)
    const [tree, parents, ...body] = nativeGit(pilot, ['-C', pilot.memory, 'show', '-s', '--format=%T%n%P%n%B', 'HEAD']).split('\n')
    if (head === stage.previous_head || tree !== stage.payload_tree || parents !== (stage.previous_head ?? '') ||
        body.join('\n').trim() !== publicationMessage(authority, today)) fail('OWNER_COMMIT_OWNERSHIP_UNCERTAIN')
    value.ownCommit = head
  }
  if (phase === 'push') {
    if (nativeHead(pilot, pilot.remote, true) !== (value.ownCommit ?? stage.previous_head)) fail('OWNER_PUSH_UNCONFIRMED')
    value.pushed = true
  }
  if (phase === 'stamp') {
    if (!value.pushed || readPilotFile(path.join(pilot.memory, '.last-snapshot')).toString('utf8') !== today) fail('OWNER_STAMP_UNCONFIRMED')
    value.stamped = true
  }
}
export function beginPublication(pilot, token, stageId) {
  if (!ownsWriter(token)) fail('OWNER_WRITER_REQUIRED')
  const { stage, raw } = loadStage(pilot, stageId), job = loadJob(pilot, stage.job_id)
  const grantRaw = readPilotFile(path.join(ownerDirectory(pilot, 'grants'), stageId + '.json'), 8192), grant = parse(grantRaw)
  const keys = ['version', 'action', 'nonce', 'expires_at', 'stage_id', 'stage_sha256', 'anchor_sha256',
    'registry_sha256', 'receipt_stream_sha256', 'manifest_sha256', 'payload_tree', 'previous_head', 'remote']
  if (!grant || Object.keys(grant).length !== keys.length || !keys.every(key => Object.hasOwn(grant, key)) ||
      grant.version !== 1 || grant.action !== 'publish_snapshot' || !/^[a-f0-9]{32}$/.test(grant.nonce ?? '') ||
      !Number.isSafeInteger(grant.expires_at) || grant.expires_at > Math.floor(Date.now() / 1000) + 900 ||
      grant.stage_id !== stageId || grant.stage_sha256 !== digest(raw) || grant.remote !== pilot.remote ||
      !['anchor_sha256', 'registry_sha256', 'receipt_stream_sha256', 'manifest_sha256', 'payload_tree', 'previous_head'].every(key => grant[key] === stage[key])) fail('OWNER_PUBLICATION_GRANT_INVALID')
  const grantMetadata = fs.lstatSync(path.join(pilot.host, 'grants', stageId + '.json'))
  const authority = Object.freeze({}), value = { pilot, token, stage, job, grant, grantRaw, grantMetadata, ownCommit: null, pushed: false, stamped: false }
  issued.set(authority, value)
  checkPublication(authority, 'grant')
  // Independent host control file, outside restored memory. An interrupted
  // attempt is never automatically reset or reused as permission.
  writeNew(pilot, path.join(pilot.host, 'grants', grant.nonce + '.used.json'), jsonBytes({ version: 1,
    status: 'ATTEMPT_STARTED', stage_id: stageId, grant_sha256: digest(grantRaw), anchor_sha256: stage.anchor_sha256 }))
  return authority
}
export function completedPublication(authority) {
  const value = record(authority)
  if (!value.pushed || !value.stamped) fail('OWNER_PUBLICATION_UNCONFIRMED')
  return { head: value.ownCommit ?? value.stage.previous_head, tree: value.stage.payload_tree,
    stage_id: value.stage.stage_id, job_id: value.stage.job_id, memory_id: value.job.candidate.memory_id, grant_nonce: value.grant.nonce }
}
