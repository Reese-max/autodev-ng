import { existsSync, mkdirSync, readFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { writeJsonAtomic } from '../guardian/incident.js'
import { acquireLock, releaseLock } from '../lock.js'
import { githubStopFile, loadGithubConfig, type GithubConfig, type Issue } from './config.js'
import { eligibleForRun } from './repair.js'
import { githubClient, type GithubClient, type RejectedIssue } from './client.js'
import { assertPublishable, checkoutDir, executeIssue, git, issueReviewPending } from './job.js'
import { alternativeRunPending, branchFor, fingerprint, readState, saveState, states, type IssueState } from './state.js'
import { observePr } from './followup.js'

const MAX_REJECTED_RECORDS = 10_000
const MAX_REJECTED_DETAIL = 2_000

type RejectedRecord = RejectedIssue & { count: number }

function boundedDetail(detail: string): string {
  return detail.length > MAX_REJECTED_DETAIL ? `${detail.slice(0, MAX_REJECTED_DETAIL - 1)}…` : detail
}

function boundedRecord(r: RejectedIssue, count: number): RejectedRecord {
  const number = (typeof r.number === 'number' && Number.isSafeInteger(r.number) && r.number > 0) ? r.number : undefined
  return { number, at: r.at, detail: boundedDetail(r.detail), page: r.page, index: r.index, count }
}

function rejectionKey(r: { number?: number; detail: string }): string {
  return `${r.number ?? 'unknown'}|${r.detail}`
}

function uniqueBackupPath(basePath: string): string {
  const now = Date.now()
  let candidate = `${basePath}.corrupt.${now}`
  let n = 0
  while (existsSync(candidate)) {
    n += 1
    candidate = `${basePath}.corrupt.${now}.${n}`
  }
  return candidate
}

function validRecord(value: unknown): value is RejectedRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const v = value as Record<string, unknown>
  if (typeof v.at !== 'string' || typeof v.detail !== 'string' || v.detail.length === 0) return false
  if ('number' in v && v.number !== undefined) {
    if (typeof v.number !== 'number' || !Number.isSafeInteger(v.number) || v.number <= 0) return false
  }
  if ('count' in v && v.count !== undefined) {
    if (typeof v.count !== 'number' || !Number.isSafeInteger(v.count) || v.count < 1) return false
  }
  if ('page' in v && v.page !== undefined) {
    if (typeof v.page !== 'number' || !Number.isSafeInteger(v.page) || v.page < 0) return false
  }
  if ('index' in v && v.index !== undefined) {
    if (typeof v.index !== 'number' || !Number.isSafeInteger(v.index) || v.index < 0) return false
  }
  return true
}

export function recordRejects(dataDir: string, incoming: RejectedIssue[]): void {
  if (incoming.length === 0) return
  try {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
    const path = join(dataDir, 'rejected-issues.json')
    let existing: RejectedRecord[] = []
    if (existsSync(path)) {
      try {
        const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown
        if (!Array.isArray(raw)) throw new Error('corrupt')
        for (const r of raw) {
          if (!validRecord(r)) throw new Error('corrupt')
          existing.push(boundedRecord(r, r.count ?? 1))
        }
      } catch {
        const backup = uniqueBackupPath(path)
        try { renameSync(path, backup) } catch {
          console.error('Could not back up corrupt rejected-issues record; preserving original.')
          return
        }
      }
    }

    const merged = new Map<string, RejectedRecord>()
    for (const r of existing) {
      const key = rejectionKey(r)
      const cur = merged.get(key)
      if (cur) cur.count += r.count
      else merged.set(key, r)
    }
    for (const r of incoming) {
      const rec = boundedRecord(r, 1)
      const key = rejectionKey(rec)
      const cur = merged.get(key)
      if (cur) {
        cur.count += 1
        cur.at = rec.at
        cur.page = rec.page
        cur.index = rec.index
      } else {
        merged.set(key, rec)
      }
    }
    let records = [...merged.values()]
    if (records.length > MAX_REJECTED_RECORDS) {
      records.sort((a, b) => (a.at < b.at ? 1 : -1))
      const overflow = records.slice(MAX_REJECTED_RECORDS)
      records = records.slice(0, MAX_REJECTED_RECORDS)
      const overflowPath = uniqueBackupPath(`${path}.overflow`)
      try { writeJsonAtomic(overflowPath, overflow) } catch {
        console.error(`Could not preserve overflow rejected records; leaving ${path} unchanged.`)
        return
      }
    }
    writeJsonAtomic(path, records)
  } catch (e) {
    console.error('Failed to record rejected issues:', e instanceof Error ? e.message : 'unknown')
  }
}

export async function syncIssues(cfg: GithubConfig, client: GithubClient): Promise<void> {
  const rejects: RejectedIssue[] = []
  for (const issue of await client.list(reject => { rejects.push(reject) })) {
    if (existsSync(githubStopFile(cfg))) { recordRejects(cfg.dataDir, rejects); return }
    if (!eligibleForRun(issue, cfg) || readState(cfg, issue.number)) continue
    saveState(cfg, { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'queued', runs: 0, nextRunAt: 0 })
  }
  recordRejects(cfg.dataDir, rejects)
}
function currentIssue(cfg: GithubConfig, state: IssueState, issue: Issue): boolean {
  return issue.number === state.issue.number && eligibleForRun(issue, cfg) && fingerprint(issue) === state.fingerprint
}
export async function publishIssue(cfg: GithubConfig, state: IssueState, client: GithubClient, check = assertPublishable,
  push = () => git(checkoutDir(cfg, state), ['push', 'origin', `${state.commit}:refs/heads/${branchFor(state.issue.number)}`]), active = () => true): Promise<void> {
  if (!cfg.enabled || !cfg.publish || existsSync(githubStopFile(cfg)) || !active()) return
  if (!currentIssue(cfg, state, await client.issue(state.issue.number))) throw new Error('Issue closed, changed, or approval label/author no longer matches')
  check(cfg, state)
  const branch = branchFor(state.issue.number), existing = await client.findPr(branch)
  if (existing) {
    if (state.revision && existing.state === 'open' && existing.head.sha === state.revision.baseCommit && existing.base.ref === cfg.base) {
      if (!currentIssue(cfg, state, await client.issue(state.issue.number)) || existsSync(githubStopFile(cfg)) || !active()) return
      git(checkoutDir(cfg, state), ['merge-base', '--is-ancestor', state.revision.baseCommit, state.commit!])
      push() // Ordinary fast-forward push; never overwrite a reviewer edit.
      const updated = await client.findPr(branch)
      if (!updated || updated.head.sha !== state.commit || updated.state !== 'open' || updated.base.ref !== cfg.base) throw new Error('Updated PR head/base mismatch')
      state.pr = updated.html_url; state.status = 'published'; saveState(cfg, state); return
    }
    if (existing.head.sha !== state.commit || existing.base.ref !== cfg.base) throw new Error('Existing PR does not match the verified candidate')
    state.pr = existing.html_url
  } else {
    if (await client.findLinkedPr(state.issue.number)) throw new Error('Issue already has a linked PR; manual review required')
    if (!currentIssue(cfg, state, await client.issue(state.issue.number))) throw new Error('Issue changed before push')
    if (existsSync(githubStopFile(cfg)) || !active()) return
    // Push only this candidate, never main or all branches; no force push.
    push()
    if (existsSync(githubStopFile(cfg)) || !active()) return
    if (await client.findLinkedPr(state.issue.number)) throw new Error('Issue acquired a linked PR before PR creation')
    if (!currentIssue(cfg, state, await client.issue(state.issue.number))) throw new Error('Issue changed before PR creation')
    if (existsSync(githubStopFile(cfg)) || !active()) return
    const pr = await client.createPr(branch, `Fix #${state.issue.number}: ${state.issue.title}`.slice(0, 250),
      `Closes #${state.issue.number}\n\nImplements the imported Issue snapshot. CI and reviewer gates passed for commit \`${state.commit}\`.\n\nIssue snapshot SHA-256: \`${state.fingerprint}\`\n\nHuman review and merge required.`)
    if (pr.head.sha !== state.commit || pr.base.ref !== cfg.base) throw new Error('Created PR head/base mismatch')
    state.pr = pr.html_url
  }
  state.status = 'published'
  saveState(cfg, state)
}
export async function runGithub(cfg: GithubConfig, options: {
  syncOnly?: boolean; client?: GithubClient; execute?: typeof executeIssue; publish?: typeof publishIssue; configPath?: string
} = {}): Promise<string> {
  if (!cfg.enabled || existsSync(githubStopFile(cfg))) return 'paused'
  const original = options.configPath ? readFileSync(options.configPath, 'utf8') : undefined
  if (options.configPath && JSON.stringify(loadGithubConfig(options.configPath)) !== JSON.stringify(cfg)) return 'paused'
  const inputs = [cfg.sourceConfig, ...(cfg.repair ? [cfg.repair.reportConfig] : [])].map(file => [file, readFileSync(file, 'utf8')] as const)
  mkdirSync(cfg.dataDir, { recursive: true })
  const lock = join(cfg.dataDir, 'runner.lock')
  if (!acquireLock(lock)) return 'locked'
  const client = options.client ?? githubClient(cfg)
  const active = () => !existsSync(githubStopFile(cfg)) && (!options.configPath || readFileSync(options.configPath, 'utf8') === original)
    && inputs.every(([file, snapshot]) => readFileSync(file, 'utf8') === snapshot)
  try {
    await syncIssues(cfg, client)
    if (options.syncOnly) return 'synced'
    for (const published of states(cfg).filter(s => s.status === 'published')) {
      try { await observePr(cfg, published, client, active) }
      catch (error) { published.detail = String(error); saveState(cfg, published) }
    }
    for (const stale of states(cfg).filter(s => s.status === 'running')) {
      stale.status = 'blocked'; stale.detail = 'Previous runner interrupted; inspect artifacts before retry'; saveState(cfg, stale)
    }
    const state = states(cfg).find(s => (s.status === 'queued' || (s.status === 'ready' && cfg.publish)) && s.nextRunAt <= Date.now())
    if (!state) return 'idle'
    try {
      if (!currentIssue(cfg, state, await client.issue(state.issue.number))) {
        state.status = 'cancelled'; state.detail = 'Issue changed, closed, or no longer eligible'; saveState(cfg, state); return 'cancelled'
      }
      if (!active()) return 'paused'
      if (state.status === 'queued') {
        const existing = (await client.findPr(branchFor(state.issue.number)))?.html_url ?? await client.findLinkedPr(state.issue.number)
        if (existing && !state.revision) {
          state.status = 'blocked'; state.pr = existing; state.detail = 'Existing PR; manual review required before further execution'
          saveState(cfg, state); return 'blocked'
        }
        if (state.revision) {
          const pr = await client.findPr(branchFor(state.issue.number))
          if (!pr || pr.state !== 'open' || pr.html_url !== state.pr || pr.head.sha !== state.revision.baseCommit || pr.base.ref !== cfg.base) throw new Error('PR changed before revision execution')
        }
        if (!currentIssue(cfg, state, await client.issue(state.issue.number))) {
          state.status = 'cancelled'; state.detail = 'Issue changed or excluded before execution'; saveState(cfg, state); return 'cancelled'
        }
        if (!active()) return 'paused'
        if (state.runs >= cfg.maxRuns && !alternativeRunPending(cfg, state) && !issueReviewPending(cfg, state)) { state.status = 'blocked'; saveState(cfg, state); return 'blocked' }
        const pending = state.alternativeRetryPending
        state.alternativeRetryPending = false
        state.status = 'running'; state.runs++; saveState(cfg, state)
        const result = await (options.execute ?? executeIssue)(cfg, state)
        if (result.attempted === false) { state.runs--; state.alternativeRetryPending = pending } // Review/capacity deferral does not spend a writer attempt.
        if (result.recoveryRequired) {
          state.status = 'blocked'; state.detail = `Execution recovery required: ${result.detail}`
          saveState(cfg, state); return 'blocked'
        }
        if (!active() || !currentIssue(cfg, state, await client.issue(state.issue.number))) {
          state.status = 'cancelled'; state.detail = 'Issue or configuration changed during execution; candidate preserved'
          saveState(cfg, state); return 'cancelled'
        }
        state.detail = result.detail
        state.commit = result.commit
        if (result.alternativeRetryPending) state.alternativeRetryPending = alternativeRunPending(cfg, { ...state, alternativeRetryPending: true })
        state.status = result.done ? 'ready' : state.runs >= cfg.maxRuns && !state.alternativeRetryPending && !result.reviewPending ? 'blocked' : 'queued'
        state.nextRunAt = result.retryAt && result.retryAt > Date.now() ? result.retryAt : Date.now() + cfg.retryMs
        saveState(cfg, state)
      }
      if (state.status === 'ready') await (options.publish ?? publishIssue)(cfg, state, client, undefined, undefined, active)
    } catch (err) {
      state.status = 'blocked'; state.detail = err instanceof Error ? err.message : String(err); saveState(cfg, state)
    }
    return `${state.issue.number}: ${state.status}`
  } finally { releaseLock(lock) }
}
