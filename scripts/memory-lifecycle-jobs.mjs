/** Native observation/admission jobs. Admission is exclusively canonical v2. */
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { readPilotFile } from './memory-lifecycle-isolation.mjs'
import { canonicalCall, observeSnapshot, verifyObservation, nativeGit, nativeHead } from './memory-lifecycle-runtime.mjs'
import { digest, jsonBytes, parse, loadState, commitState, ownerDirectory, writeNew, mutate, ownsWriter } from './memory-lifecycle-state.mjs'

const fail = code => { throw new Error(code) }
const idCheck = id => { if (typeof id !== 'string' || !/^[a-f0-9]{32}$/.test(id)) fail('OWNER_JOB_ID_INVALID') }
export const registryContext = (pilot, state) => state.registryRaw === null ? {} : {
  file: path.join(pilot.host, 'origin-context.json'), pin: state.anchor.registry_sha256,
  streamPin: state.anchor.receipt_stream_sha256 }
export function acceptedRead(pilot, state) {
  if (state.anchor.generation === 0) return { status: 'CANNOT_VERIFY', reason: 'NO_ACCEPTED_HEAD', memory_grants_action: false }
  return canonicalCall(pilot, 'read', { receipts: state.history }, registryContext(pilot, state))
}
export function loadJob(pilot, id) {
  idCheck(id)
  const raw = readPilotFile(path.join(pilot.host, 'jobs', id + '.json')), job = parse(raw)
  const fields = ['version', 'id', 'candidate', 'observation', 'capture_id', 'context_sha256', 'manifest_sha256', 'upstream_context_ids']
  if (!job || Object.keys(job).length !== fields.length || !fields.every(name => Object.hasOwn(job, name)) ||
      job.version !== 1 || job.id !== id || job.candidate.memory_id !== 'snapshot-' + id ||
      job.manifest_sha256 !== pilot.manifestSha256 || !Array.isArray(job.upstream_context_ids)) fail('OWNER_JOB_INVALID')
  return { ...job, raw }
}
function capture(pilot, state, job) {
  return canonicalCall(pilot, 'capture', { candidate: job.candidate, snapshot_fact: job.observation.fact,
    upstream_context_ids: job.upstream_context_ids }, registryContext(pilot, state))
}
export function prepareJob(pilot, token, repairTarget = null, conflictingEvidence = false) {
  if (!ownsWriter(token)) fail('OWNER_WRITER_REQUIRED')
  const state = loadState(pilot, token), current = acceptedRead(pilot, state)
  if (state.anchor.generation !== 0 && current.status !== 'ACTIVE') fail('OWNER_CURRENT_CANNOT_VERIFY')
  const id = randomUUID().replaceAll('-', ''), now = new Date().toISOString()
  const parent = state.anchor.active_head
  if (repairTarget !== null && !state.history.some(record => record.memory_id === repairTarget)) fail('OWNER_REPAIR_TARGET_UNKNOWN')
  const job = { version: 1, id, candidate: { memory_id: 'snapshot-' + id, predecessor_id: parent,
    requested: repairTarget === null ? 'commit' : 'tombstone', valid_from: now, observed_at: now, derived_from: parent === null ? [] : [parent],
    tombstone_targets: repairTarget === null ? [] : [repairTarget], reason_codes: repairTarget !== null ? ['owner_poison_repair'] :
      conflictingEvidence ? ['conflicting_evidence'] : [] }, observation: observeSnapshot(pilot),
    capture_id: null, context_sha256: null, manifest_sha256: pilot.manifestSha256,
    upstream_context_ids: parent === null ? [] : [current.read.origin.context_id] }
  const produced = capture(pilot, state, job)
  job.capture_id = produced.capture_id; job.context_sha256 = produced.context_sha256
  verifyObservation(pilot, job.observation)
  const directory = ownerDirectory(pilot, 'jobs')
  writeNew(pilot, path.join(directory, id + '.capture.json'), jsonBytes(produced.checkpoint))
  writeNew(pilot, path.join(directory, id + '.json'), jsonBytes(job))
  return { status: 'PROPOSED', job_id: id, memory_id: job.candidate.memory_id, capture_id: job.capture_id,
    payload_sha256: job.observation.fact.content_hash, memory_grants_action: false }
}
export function admitJob(pilot, token, id) {
  if (!ownsWriter(token)) fail('OWNER_WRITER_REQUIRED')
  const job = loadJob(pilot, id), state = loadState(pilot, token)
  verifyObservation(pilot, job.observation)
  // Recapture identical measured inputs against the current append-only
  // registry, retaining the original context ID; never import a stored PASS.
  const produced = capture(pilot, state, job)
  if (produced.capture_id !== job.capture_id) fail('OWNER_CAPTURE_CHANGED')
  const contextPath = path.join(ownerDirectory(pilot, 'jobs'), randomUUID().replaceAll('-', '') + '.admit-context.json')
  writeNew(pilot, contextPath, jsonBytes(produced.checkpoint))
  const result = canonicalCall(pilot, 'admit', { candidate: job.candidate, receipts: state.history, capture_id: job.capture_id },
    { file: contextPath, pin: produced.context_sha256, streamPin: state.anchor.receipt_stream_sha256 })
  verifyObservation(pilot, job.observation)
  const saved = commitState(pilot, token, state, [...state.history, result.record], produced.checkpoint,
    result.receipt_stream_sha256, result.read.active_head)
  return { job, state: saved, result }
}
export async function stageJob(pilot, token, id, copyNative) {
  if (!ownsWriter(token)) fail('OWNER_WRITER_REQUIRED')
  const job = loadJob(pilot, id), state = loadState(pilot, token), current = acceptedRead(pilot, state)
  if (current.status !== 'ACTIVE' || current.read.active_head !== job.candidate.memory_id ||
      current.read.source.content_hash !== job.observation.fact.content_hash) fail('OWNER_JOB_NOT_CURRENT')
  verifyObservation(pilot, job.observation)
  if (!await copyNative()) fail('OWNER_PAUSED_OR_COPY_INCOMPLETE')
  verifyObservation(pilot, job.observation, true)
  mutate(pilot, () => nativeGit(pilot, ['-C', pilot.memory, 'add', '-A']))
  const tree = mutate(pilot, () => nativeGit(pilot, ['-C', pilot.memory, 'write-tree']))
  const head = nativeHead(pilot, pilot.memory), remoteHead = nativeHead(pilot, pilot.remote, true)
  if (head !== remoteHead || head !== state.anchor.published_head) fail('OWNER_PUBLICATION_HEAD_UNCERTAIN')
  const latest = loadState(pilot, token)
  if (!latest.raw.equals(state.raw)) fail('OWNER_STATE_CHANGED')
  const stageId = randomUUID().replaceAll('-', '')
  const stage = { version: 1, stage_id: stageId, job_id: id, anchor_sha256: digest(state.raw),
    registry_sha256: state.anchor.registry_sha256, receipt_stream_sha256: state.anchor.receipt_stream_sha256,
    manifest_sha256: pilot.manifestSha256, payload_tree: tree, previous_head: head,
    observation_sha256: digest(jsonBytes(job.observation)) }
  writeNew(pilot, path.join(ownerDirectory(pilot, 'jobs'), stageId + '.stage.json'), jsonBytes(stage))
  return { status: 'AWAITING_PUBLICATION_GRANT', job_id: id, stage_id: stageId,
    stage_sha256: digest(jsonBytes(stage)), payload_tree: tree, previous_head: head,
    registry_sha256: stage.registry_sha256, receipt_stream_sha256: stage.receipt_stream_sha256,
    published_head: state.anchor.published_head, snapshot_stamp_advanced: false, memory_grants_action: false }
}
export function loadStage(pilot, id) {
  idCheck(id)
  const raw = readPilotFile(path.join(pilot.host, 'jobs', id + '.stage.json')), stage = parse(raw)
  const keys = ['version', 'stage_id', 'job_id', 'anchor_sha256', 'registry_sha256', 'receipt_stream_sha256',
    'manifest_sha256', 'payload_tree', 'previous_head', 'observation_sha256']
  if (!stage || Object.keys(stage).length !== keys.length || !keys.every(key => Object.hasOwn(stage, key)) ||
      stage.version !== 1 || stage.stage_id !== id || !/^[a-f0-9]{32}$/.test(stage.job_id ?? '') || stage.manifest_sha256 !== pilot.manifestSha256 ||
      !/^[a-f0-9]{40}$/.test(stage.payload_tree ?? '')) fail('OWNER_STAGE_INVALID')
  return { stage, raw }
}
