/** Default-off isolated native snapshot workflow, not a fleet deployment. */
import { memoryPilotIsolation } from './memory-lifecycle-isolation.mjs'
import { withMemoryWriter, loadState, commitState, parse } from './memory-lifecycle-state.mjs'
import { verifyObservation, nativeHead } from './memory-lifecycle-runtime.mjs'
import { prepareJob, admitJob, stageJob, loadJob, acceptedRead } from './memory-lifecycle-jobs.mjs'
import { beginPublication, completedPublication } from './memory-lifecycle-publication.mjs'

function readOwner(pilot) {
  const state = loadState(pilot), current = acceptedRead(pilot, state)
  if (current.status !== 'ACTIVE') return { version: 1, status: 'CANNOT_VERIFY', reason: current.reason ?? 'CANONICAL_CURRENT_UNVERIFIED', memory_grants_action: false }
  const head = current.read.active_head
  if (!/^snapshot-[a-f0-9]{32}$/.test(head)) throw new Error('OWNER_HEAD_INVALID')
  const job = loadJob(pilot, head.slice(9))
  verifyObservation(pilot, job.observation, true)
  if (nativeHead(pilot, pilot.remote, true) !== state.anchor.published_head ||
      nativeHead(pilot, pilot.memory) !== state.anchor.published_head) throw new Error('OWNER_PUBLISHED_HEAD_CHANGED')
  const after = loadState(pilot)
  if (!after.raw.equals(state.raw)) throw new Error('OWNER_STATE_CHANGED')
  return { version: 1, status: 'ACTIVE', read: current.read, generation: state.anchor.generation,
    receipt_stream_sha256: state.anchor.receipt_stream_sha256, registry_sha256: state.anchor.registry_sha256,
    published_head: state.anchor.published_head, published_memory_id: state.anchor.published_memory_id,
    publication_state: state.anchor.published_memory_id === head ? 'PUBLISHED' : 'UNPUBLISHED', memory_grants_action: false }
}

export async function runMemoryLifecycle(pilot, argv, native) {
  let publicationAttempted = false
  try {
    const [command, id, ...extra] = argv
    const noId = ['--lifecycle-prepare', '--lifecycle-propose-conflict', '--lifecycle-read'].includes(command)
    if (!['--lifecycle-prepare', '--lifecycle-propose-conflict', '--lifecycle-admit', '--lifecycle-stage', '--lifecycle-publish', '--lifecycle-read', '--lifecycle-repair'].includes(command) ||
        extra.length || (noId ? id !== undefined : typeof id !== 'string')) throw new Error('OWNER_PILOT_COMMAND_INVALID')
    memoryPilotIsolation(pilot.root, pilot.memory)
    if (command === '--lifecycle-read') return readOwner(pilot)
    return await withMemoryWriter(pilot, async token => {
      if (['--lifecycle-prepare', '--lifecycle-propose-conflict'].includes(command)) return { version: 1,
        ...prepareJob(pilot, token, null, command === '--lifecycle-propose-conflict') }
      if (command === '--lifecycle-repair') {
        // Only the separate explicit local operator command selects this exact
        // repair target. Snapshot text can never request a repair/action.
        const prepared = prepareJob(pilot, token, id), admitted = admitJob(pilot, token, prepared.job_id)
        return { version: 1, status: admitted.result.disposition === 'tombstone' ? 'TOMBSTONED' : 'REJECTED',
          target: id, receipt: admitted.result.record, read: admitted.result.read,
          published_head: admitted.state.anchor.published_head, memory_grants_action: false }
      }
      if (command === '--lifecycle-admit') {
        const admitted = admitJob(pilot, token, id)
        if (admitted.result.disposition !== 'commit') return { version: 1, status: 'REJECTED',
          disposition: admitted.result.disposition, receipt: admitted.result.record, read: admitted.result.read, memory_grants_action: false }
        return { version: 1, ...await stageJob(pilot, token, id, native.copy), receipt: admitted.result.record }
      }
      if (command === '--lifecycle-stage') return { version: 1, ...await stageJob(pilot, token, id, native.copy) }
      const authority = beginPublication(pilot, token, id), before = loadState(pilot, token)
      const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
      publicationAttempted = true
      await native.publish(today, authority)
      const effect = completedPublication(authority)
      const saved = commitState(pilot, token, before, before.history, parse(before.registryRaw),
        before.anchor.receipt_stream_sha256, before.anchor.active_head, effect)
      return { version: 1, status: 'PUBLISHED', publication: effect, published_head: saved.anchor.published_head,
        receipt_stream_sha256: saved.anchor.receipt_stream_sha256, memory_grants_action: false }
    })
  } catch (error) {
    const reason = typeof error.message === 'string' && /^[A-Z_]{1,80}$/.test(error.message) ? error.message :
      error.code === 'EEXIST' ? 'OWNER_WRITER_OR_GRANT_BUSY' : 'OWNER_PILOT_CANNOT_VERIFY'
    return { version: 1, status: 'CANNOT_VERIFY', reason, publication_may_have_changed: publicationAttempted, memory_grants_action: false }
  }
}
