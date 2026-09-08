import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { acquireLock, releaseLock } from '../lock.js'
import { githubStopFile, loadGithubConfig, type GithubConfig, type Issue } from './config.js'
import { eligibleForRun } from './repair.js'
import { githubClient, type GithubClient } from './client.js'
import { assertPublishable, checkoutDir, executeIssue, git } from './job.js'
import { branchFor, fingerprint, readState, saveState, states, type IssueState } from './state.js'
import { observePr } from './followup.js'

export async function syncIssues(cfg: GithubConfig, client: GithubClient): Promise<void> {
  for (const issue of await client.list()) {
    if (existsSync(githubStopFile(cfg))) return
    if (!eligibleForRun(issue, cfg) || readState(cfg, issue.number)) continue
    saveState(cfg, { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'queued', runs: 0, nextRunAt: 0 })
  }
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
    if (!currentIssue(cfg, state, await client.issue(state.issue.number))) {
      state.status = 'cancelled'; state.detail = 'Issue changed, closed, or no longer eligible'; saveState(cfg, state); return 'cancelled'
    }
    if (!active()) return 'paused'
    try {
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
        if (state.runs >= cfg.maxRuns) { state.status = 'blocked'; saveState(cfg, state); return 'blocked' }
        state.status = 'running'; state.runs++; saveState(cfg, state)
        const result = await (options.execute ?? executeIssue)(cfg, state)
        if (!active() || !currentIssue(cfg, state, await client.issue(state.issue.number))) {
          state.status = 'cancelled'; state.detail = 'Issue or configuration changed during execution; candidate preserved'
          saveState(cfg, state); return 'cancelled'
        }
        state.detail = result.detail
        state.commit = result.commit
        state.status = result.done ? 'ready' : state.runs >= cfg.maxRuns ? 'blocked' : 'queued'
        state.nextRunAt = Date.now() + cfg.retryMs
        saveState(cfg, state)
      }
      if (state.status === 'ready') await (options.publish ?? publishIssue)(cfg, state, client, undefined, undefined, active)
    } catch (err) {
      state.status = 'blocked'; state.detail = err instanceof Error ? err.message : String(err); saveState(cfg, state)
    }
    return `${state.issue.number}: ${state.status}`
  } finally { releaseLock(lock) }
}
