/** Native measurements + exact canonical CLI transport, with no local policy. */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { memoryPilotIsolation, readPilotFile } from './memory-lifecycle-isolation.mjs'
import { digest, jsonBytes } from './memory-lifecycle-state.mjs'

const GUARD = `import os,runpy,sys
script,*args=sys.argv[1:]
def deny(event,args):
 if event in {'socket.__new__','socket.getaddrinfo','socket.connect','socket.bind','subprocess.Popen','os.system','os.posix_spawn'}: raise RuntimeError('OWNER_TRANSPORT_DENIED')
sys.addaudithook(deny)
sys.path.insert(0,os.path.dirname(script))
sys.argv=[script,*args]
runpy.run_path(script,run_name='__main__')
`
const INPUTS = [['data/patrol-log.md', 'patrol-log.md'], ['data/PATROL-ALERTS.md', 'PATROL-ALERTS.md'],
  ['data/patrol-heartbeat.json', 'patrol-heartbeat.json'], ...['BACKLOG.md', 'USER-SIGNALS.md', 'NORTHSTAR.md',
    'GOAL.md', 'learnings.md'].map(name => [`data/synthetic/${name}`, `synthetic/${name}`])]
export const scope = pilot => ({ repo: 'Reese-max/autodev-ng', project: 'synthetic', subject: 'snapshot:' + pilot.pilotId })

export function observeSnapshot(pilot) {
  const entries = INPUTS.map(([source, locator]) => {
    const file = path.join(pilot.root, source)
    try {
      const raw = readPilotFile(file)
      return { source, locator, present: true, bytes: raw.length, content_sha256: digest(raw) }
    } catch (error) {
      if (error.code === 'ENOENT') return { source, locator, present: false }
      throw error
    }
  })
  const count = entries.filter(entry => entry.present).length
  if (!count) throw new Error('OWNER_EMPTY_SNAPSHOT')
  const contentHash = digest(jsonBytes(entries))
  return { entries, fact: { version: 1, locator: 'native-snapshot://' + contentHash.slice(7), content_hash: contentHash, file_count: count } }
}
export function verifyObservation(pilot, expected, copied = false) {
  if (!jsonBytes(observeSnapshot(pilot)).equals(jsonBytes(expected))) throw new Error('OWNER_SOURCE_CHANGED')
  if (copied) for (const item of expected.entries) {
    try {
      const raw = readPilotFile(path.join(pilot.memory, item.locator))
      if (!item.present || raw.length !== item.bytes || digest(raw) !== item.content_sha256) throw new Error('OWNER_COPIED_SNAPSHOT_CHANGED')
    } catch (error) {
      if (!item.present && error.code === 'ENOENT') continue
      throw error
    }
  }
}

export function canonicalCall(pilot, mode, payload, context = {}) {
  if (!['capture', 'admit', 'read'].includes(mode)) throw new Error('OWNER_CANONICAL_MODE_INVALID')
  if (Object.hasOwn(payload, 'version') || Object.hasOwn(payload, 'expected_scope')) throw new Error('OWNER_CONTROL_FIELD_INVALID')
  memoryPilotIsolation(pilot.root, pilot.memory)
  const args = ['-c', GUARD, path.join(pilot.canonical, 'scripts/verify-memory-lifecycle.py'), '--owner-' + mode]
  if (mode === 'capture') args.push('--producer-sha256', 'sha256:' + pilot.manifestSha256)
  if (context.file) {
    if (!path.resolve(context.file).startsWith(pilot.host + path.sep) || fs.realpathSync(context.file) !== context.file) throw new Error('OWNER_CONTEXT_PATH_INVALID')
    args.push('--origin-context', context.file, '--origin-context-sha256', context.pin)
  }
  if (context.streamPin) args.push('--receipt-stream-sha256', context.streamPin)
  const packet = { version: 2, expected_scope: scope(pilot), ...payload }
  const input = jsonBytes(packet)
  if (input.length > 1_000_000) throw new Error('OWNER_PACKET_LIMIT')
  let output, failed = false
  try {
    output = execFileSync('/usr/bin/python3', args, { cwd: pilot.root, input, timeout: 10_000, maxBuffer: 1_000_000,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', PYTHONUTF8: '1' }, stdio: ['pipe', 'pipe', 'pipe'] })
  } catch (error) { output = error.stdout; failed = true }
  memoryPilotIsolation(pilot.root, pilot.memory)
  if (!Buffer.isBuffer(output) || output.length > 1_000_000) throw new Error('OWNER_CANONICAL_RESPONSE_INVALID')
  const text = output.toString('utf8').trim(), result = JSON.parse(text)
  if (text !== JSON.stringify(result) || result.version !== 2 || result.memory_grants_action !== false) throw new Error('OWNER_CANONICAL_RESPONSE_INVALID')
  if (result.read?.status === 'ACTIVE' && (result.read.evidence_realm !== 'owning_writer' || result.read.action_authority !== 'NONE')) throw new Error('OWNER_CANONICAL_REALM_INVALID')
  if (mode === 'capture' && !failed && (result.checkpoint?.realm !== 'owning_writer' || result.context_sha256 !== result.checkpoint.sha256)) throw new Error('OWNER_CANONICAL_REALM_INVALID')
  if (failed) throw new Error(/^[A-Z_]{1,80}$/.test(result.reason ?? '') ? result.reason : 'OWNER_CANONICAL_REFUSED')
  return result
}
export function nativeGit(pilot, args) {
  return execFileSync('git', ['-c', 'core.fsmonitor=false', '-c', `core.hooksPath=${path.join(pilot.host, 'hooks')}`,
    ...args], { env: process.env, encoding: 'utf8', timeout: 5_000, maxBuffer: 8192, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}
export function nativeHead(pilot, directory, bare = false) {
  const prefix = bare ? ['--git-dir', directory] : ['-C', directory]
  if (nativeGit(pilot, [...prefix, 'symbolic-ref', '--quiet', 'HEAD']) !== 'refs/heads/main') throw new Error('OWNER_GIT_HEAD_AMBIGUOUS')
  try { return nativeGit(pilot, [...prefix, 'rev-parse', '--verify', 'HEAD']) }
  catch (error) {
    if (error.status !== 128) throw error
    try { nativeGit(pilot, [...prefix, 'show-ref', '--verify', '--quiet', 'refs/heads/main']) }
    catch (absent) { if (absent.status === 1) return null; throw absent }
    throw error
  }
}
