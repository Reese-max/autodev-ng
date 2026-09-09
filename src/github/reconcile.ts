import { createHash, randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { acquireLock, releaseLock } from '../lock.js'
import { writeJsonAtomic } from '../guardian/incident.js'
import { githubClient, type GithubClient } from './client.js'
import { githubStopFile, loadGithubConfig } from './config.js'
import { eligibleForRun } from './repair.js'
import { fingerprint, issueDir, readState, saveState } from './state.js'

export async function reconcileIssue(file: string, number: number, options: { apply?: boolean; reason?: string; client?: GithubClient } = {}) {
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('Positive Issue number required')
  if (options.apply && (!options.reason || options.reason.trim().length < 8 || options.reason.length > 1000)) throw new Error('Apply requires a specific reason (8–1000 characters)')
  const cfg = loadGithubConfig(file)
  if (!readState(cfg, number)) throw new Error('Issue state not found')
  const lock = join(cfg.dataDir, 'runner.lock')
  if (!acquireLock(lock)) throw new Error('Runner active; no reconciliation performed')
  try {
    const original = readFileSync(join(issueDir(cfg, number), 'state.json'), 'utf8')
    const state = readState(cfg, number)!
    if (JSON.stringify(loadGithubConfig(file)) !== JSON.stringify(cfg)) throw new Error('Configuration changed before reconciliation')
    const inputs = [file, cfg.sourceConfig, ...(cfg.repair ? [cfg.repair.reportConfig] : [])].map(path => [path, readFileSync(path, 'utf8')] as const)
    const pauseFile = githubStopFile(cfg), pause = existsSync(pauseFile) ? readFileSync(pauseFile, 'utf8') : undefined
    const client = options.client ?? githubClient(cfg)
    const observe = async () => {
      const issue = await client.issue(number)
      if (issue.number !== number) throw new Error('Issue identity mismatch')
      const currentFingerprint = fingerprint(issue), eligible = eligibleForRun(issue, cfg)
      const linked = await client.findLinkedPr(number)
      let pr
      if (linked) {
        const url = new URL(linked), parts = url.pathname.split('/')
        if (url.origin !== 'https://github.com' || url.search || url.hash || url.username || url.password || parts.length !== 5
          || `${parts[1]}/${parts[2]}`.toLowerCase() !== cfg.repo.toLowerCase() || parts[3] !== 'pull' || !/^[1-9]\d*$/.test(parts[4]!)) throw new Error('Linked PR is outside the configured repository')
        if (!client.inspectPr) throw new Error('PR inspection unavailable; no reconciliation performed')
        const remote = await client.inspectPr(Number(parts[4]))
        if (remote.html_url !== linked || remote.number !== Number(parts[4]) || remote.base.ref !== cfg.base || (remote.merged && !remote.merge_commit_sha)) throw new Error('Linked PR identity/base/merge evidence mismatch')
        pr = { url: linked, state: remote.merged ? 'merged' : remote.state, mergeCommit: remote.merged ? remote.merge_commit_sha : null }
      }
      const kind = pr?.state === 'merged' ? 'merged-pr-found' : issue.state === 'closed' ? 'issue-closed'
        : currentFingerprint !== state.fingerprint ? 'requirements-changed' : !eligible ? 'authorization-withdrawn'
        : pr ? 'existing-pr' : 'current'
      return { repo: cfg.repo, issue: number, kind, originalFingerprint: state.fingerprint, currentFingerprint,
        issueState: issue.state, eligible, pr: pr ?? null }
    }
    const observation = await observe()
    const key = createHash('sha256').update(JSON.stringify(observation)).digest('hex')
    const unchanged = () => {
      if (readFileSync(join(issueDir(cfg, number), 'state.json'), 'utf8') !== original || inputs.some(([path, text]) => readFileSync(path, 'utf8') !== text)
        || (existsSync(pauseFile) ? readFileSync(pauseFile, 'utf8') : undefined) !== pause) throw new Error('State, configuration or pause changed during reconciliation')
    }
    unchanged()
    const result = { ...observation, key, applied: false, status: state.status, runs: state.runs,
      workerDeliveryVerified: false, nextAction: observation.kind === 'merged-pr-found' ? 'Verify the merged result; original worker attempt remains unsuccessful' : 'Review current requirements before any new repair' }
    if (!options.apply) return result
    if (state.reconciliation?.key === key) return { ...result, alreadyReconciled: true, receipt: state.reconciliation.receipt }
    if (!['queued', 'blocked', 'cancelled'].includes(state.status) || ['current', 'existing-pr'].includes(observation.kind)) throw new Error('No safe retirement decision; preserve the candidate and inspect current work')
    if (JSON.stringify(await observe()) !== JSON.stringify(observation)) throw new Error('Remote evidence changed; inspect again before applying')
    unchanged()
    const at = new Date().toISOString(), receipt = `reconciliation-${randomUUID()}.json`, path = join(issueDir(cfg, number), receipt)
    const intent = { at, reason: options.reason!.trim(), before: state, observation }
    writeJsonAtomic(path, { ...intent, phase: 'prepared' })
    const after = { ...state, status: 'cancelled' as const, detail: `Reconciled: ${observation.kind}; ${options.reason!.trim()}`, reconciliation: { at, key, kind: observation.kind, receipt } }
    saveState(cfg, after)
    writeJsonAtomic(path, { ...intent, phase: 'completed', after: readState(cfg, number) })
    return { ...result, applied: true, status: after.status, receipt }
  } finally { releaseLock(lock) }
}

export async function reconciliationCli(argv: string[]) {
  const { values } = parseArgs({ args: argv, options: { config: { type: 'string' }, issue: { type: 'string' }, apply: { type: 'boolean' }, reason: { type: 'string' } } })
  if (!values.config) throw new Error('Usage: adng github reconcile --config FILE --issue N [--apply --reason TEXT]')
  console.log(JSON.stringify(await reconcileIssue(values.config, Number(values.issue), values), null, 2))
}
