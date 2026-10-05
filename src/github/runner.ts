import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { acquireLock, releaseLock } from '../lock.js'
import { githubStopFile, loadGithubConfig, type GithubConfig, type Issue } from './config.js'
import { eligibleForRun } from './repair.js'
import { describeIssueBatchCoverage, githubClient, issueBatchFor, transientGithubRead, type GithubClient } from './client.js'
import { assertPublishable, checkoutDir, executeIssue, git, issueReviewPending } from './job.js'
import { alternativeRunPending, branchFor, candidatePolicyHash, fingerprint, readState, saveState, states, type IssueState } from './state.js'
import { observePr } from './followup.js'
import { issueQualityVeto } from './intake-quality.js'

export async function syncIssues(cfg: GithubConfig, client: GithubClient) {
  const batch = await issueBatchFor(client)
  let stoppedEarly = false
  for (const issue of batch.issues) {
    if (existsSync(githubStopFile(cfg))) { stoppedEarly = true; break }
    const veto = issueQualityVeto(issue.body)
    if (veto) { console.warn(`github-intake rejected Issue #${issue.number}: ${veto}`); continue }
    if (!eligibleForRun(issue, cfg) || readState(cfg, issue.number)) continue
    saveState(cfg, { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'queued', runs: 0, nextRunAt: 0 })
  }
  return stoppedEarly ? { ...batch, partial: true, stoppedEarly: true } : batch
}
function currentIssue(cfg: GithubConfig, state: IssueState, issue: Issue): boolean {
  return issue.number === state.issue.number && eligibleForRun(issue, cfg) && fingerprint(issue) === state.fingerprint
}
function checkpointFor(cfg: GithubConfig, state: IssueState, phase: 'issue-read' | 'publication-read', policyHash: string): NonNullable<IssueState['candidateCheck']> {
  if (!state.commit) throw new Error('Completed execution missing exact commit; manual recovery required')
  return { schema: 'github-candidate-checkpoint/v1', at: new Date().toISOString(), attempts: 0, phase, policyHash,
    receiptRefs: ['evidence', `regression-${state.commit}.json`, ...(cfg.acceptance ? [`acceptance-${state.commit}.json`] : []),
      ...(cfg.quality ? [`quality-${state.commit}.json`] : []), ...(cfg.repair ? [`repair-probe-${state.commit}.json`] : [])] }
}
export async function publishIssue(cfg: GithubConfig, state: IssueState, client: GithubClient, check = assertPublishable,
  push = () => git(checkoutDir(cfg, state), ['push', 'origin', `${state.commit}:refs/heads/${branchFor(state.issue.number)}`]), active = () => true): Promise<void> {
  if (!cfg.enabled || !cfg.publish || existsSync(githubStopFile(cfg)) || !active()) return
  if (state.candidateCheck) throw new Error('Candidate awaiting external recheck; resume the original runner checkpoint')
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
  /** 授權政策的持續重核對（如 owner 設定檔）。撤回/不可讀/拋錯一律 fail-closed。 */
  policyCheck?: () => boolean
} = {}): Promise<string> {
  if (!cfg.enabled || existsSync(githubStopFile(cfg))) return 'paused'
  const original = options.configPath ? readFileSync(options.configPath, 'utf8') : undefined
  if (options.configPath && JSON.stringify(loadGithubConfig(options.configPath)) !== JSON.stringify(cfg)) return 'paused'
  const inputs = [cfg.sourceConfig, ...(cfg.repair ? [cfg.repair.reportConfig] : [])].map(file => [file, readFileSync(file, 'utf8')] as const)
  const policyHash = candidatePolicyHash(cfg)
  mkdirSync(cfg.dataDir, { recursive: true })
  const lock = join(cfg.dataDir, 'runner.lock')
  const lockToken = acquireLock(lock)
  if (!lockToken) return 'locked'
  const client = options.client ?? githubClient(cfg)
  const policyOk = () => { try { return (options.policyCheck?.() ?? true) === true } catch { return false } }
  const active = () => !existsSync(githubStopFile(cfg)) && (!options.configPath || readFileSync(options.configPath, 'utf8') === original)
    && inputs.every(([file, snapshot]) => readFileSync(file, 'utf8') === snapshot) && policyOk()
  try {
    if (!policyOk()) return 'paused' // 子 repo 啟動即核對：授權在派工前被撤回
    // A completed candidate needs only its own remote checks, never a fresh intake/worker run.
    const pendingCandidate = states(cfg).filter(s => s.status === 'queued' && s.candidateCheck).sort((a, b) => a.nextRunAt - b.nextRunAt)[0]
    if (pendingCandidate && pendingCandidate.nextRunAt > Date.now()) return 'idle' // Respect remote cooldown for every GitHub read.
    const intake = pendingCandidate ? undefined : await syncIssues(cfg, client)
    const withCoverage = (result: string) => {
      const summary = intake ? describeIssueBatchCoverage(intake) : undefined
      return summary ? `${result}; ${summary}` : result
    }
    if (options.syncOnly) return withCoverage('synced')
    for (const published of states(cfg).filter(s => s.status === 'published')) {
      try { await observePr(cfg, published, client, active) }
      catch (error) { published.detail = String(error); saveState(cfg, published) }
    }
    for (const stale of states(cfg).filter(s => s.status === 'running')) {
      stale.status = 'blocked'; stale.detail = 'Previous runner interrupted; inspect artifacts before retry'; saveState(cfg, stale)
    }
    const state = pendingCandidate ?? states(cfg).find(s => (s.status === 'queued' || (s.status === 'ready' && cfg.publish)) && s.nextRunAt <= Date.now())
    if (!state) return withCoverage('idle')
    let checkpoint = state.candidateCheck
    if (!checkpoint && state.status === 'ready' && state.commit) {
      checkpoint = state.candidateCheck = checkpointFor(cfg, state, 'publication-read', policyHash)
      state.status = 'queued'; saveState(cfg, state)
    }
    try {
      if (checkpoint && checkpoint.attempts >= 5) throw new Error('candidate-read-retry-exhausted: inspect exact candidate and use existing recovery')
      if (checkpoint && checkpoint.policyHash !== policyHash) throw new Error('candidate-policy-changed: restore the original gate/source configuration before manual recovery')
      if (!currentIssue(cfg, state, await client.issue(state.issue.number))) {
        state.status = 'cancelled'; state.detail = 'Issue changed, closed, or no longer eligible'; saveState(cfg, state); return withCoverage('cancelled')
      }
      if (!active()) return withCoverage('paused')
      if (checkpoint) {
        if (!state.commit) throw new Error('Candidate checkpoint missing exact commit; manual recovery required')
        // Local executeIssue already completed; the original artifacts and accounting stay intact.
        delete state.candidateCheck
        state.status = 'ready'
      } else if (state.status === 'queued') {
        const existing = (await client.findPr(branchFor(state.issue.number)))?.html_url ?? await client.findLinkedPr(state.issue.number)
        if (existing && !state.revision) {
          state.status = 'blocked'; state.pr = existing; state.detail = 'Existing PR; manual review required before further execution'
          saveState(cfg, state); return withCoverage('blocked')
        }
        if (state.revision) {
          const pr = await client.findPr(branchFor(state.issue.number))
          if (!pr || pr.state !== 'open' || pr.html_url !== state.pr || pr.head.sha !== state.revision.baseCommit || pr.base.ref !== cfg.base) throw new Error('PR changed before revision execution')
        }
        if (!currentIssue(cfg, state, await client.issue(state.issue.number))) {
          state.status = 'cancelled'; state.detail = 'Issue changed or excluded before execution'; saveState(cfg, state); return withCoverage('cancelled')
        }
        if (!active()) return withCoverage('paused')
        if (state.runs >= cfg.maxRuns && !alternativeRunPending(cfg, state) && !issueReviewPending(cfg, state)) { state.status = 'blocked'; saveState(cfg, state); return withCoverage('blocked') }
        const pending = state.alternativeRetryPending
        state.alternativeRetryPending = false
        state.status = 'running'; state.runs++; saveState(cfg, state)
        const result = await (options.execute ?? executeIssue)(cfg, state)
        if (result.attempted === false) { state.runs--; state.alternativeRetryPending = pending } // Review/capacity deferral does not spend a writer attempt.
        if (result.recoveryRequired) {
          state.status = 'blocked'; state.detail = `Execution recovery required: ${result.detail}`
          saveState(cfg, state); return withCoverage('blocked')
        }
        state.detail = result.detail
        state.commit = result.commit
        if (result.alternativeRetryPending) state.alternativeRetryPending = alternativeRunPending(cfg, { ...state, alternativeRetryPending: true })
        state.status = result.done ? 'queued' : state.runs >= cfg.maxRuns && !state.alternativeRetryPending && !result.reviewPending ? 'blocked' : 'queued'
        state.nextRunAt = result.retryAt && result.retryAt > Date.now() ? result.retryAt : Date.now() + cfg.retryMs
        if (result.done) {
          checkpoint = state.candidateCheck = checkpointFor(cfg, state, 'issue-read', policyHash)
        }
        // Persist candidate, exact receipt locators, writer count and local result before any read.
        saveState(cfg, state)
        if (!active() || !currentIssue(cfg, state, await client.issue(state.issue.number))) {
          state.status = 'cancelled'; state.detail = 'Issue or configuration changed during execution; candidate preserved'
          saveState(cfg, state); return withCoverage('cancelled')
        }
        delete state.candidateCheck
        state.status = result.done ? 'ready' : state.runs >= cfg.maxRuns && !state.alternativeRetryPending && !result.reviewPending ? 'blocked' : 'queued'
      }
      if (state.status === 'ready' && cfg.publish) {
        checkpoint ??= state.commit ? checkpointFor(cfg, state, 'publication-read', policyHash) : undefined
        if (checkpoint) checkpoint.phase = 'publication-read'
        await (options.publish ?? publishIssue)(cfg, state, client, undefined, undefined, active)
      }
      saveState(cfg, state)
    } catch (err) {
      const transient = transientGithubRead(err)
      if (checkpoint && state.commit && transient) {
        checkpoint.attempts++
        state.candidateCheck = checkpoint
        const delay = Math.min(cfg.retryMs * 2 ** (checkpoint.attempts - 1), 30 * 60_000)
        state.nextRunAt = Math.max(Date.now() + delay, transient.retryAt ?? 0)
        const exhausted = checkpoint.attempts >= 5 || state.nextRunAt > Date.now() + 24 * 60 * 60_000
        state.status = exhausted ? 'blocked' : 'queued'
        state.detail = exhausted ? `candidate-read-retry-exhausted: HTTP ${transient.statusCode}; inspect exact candidate and use existing recovery` : `candidate-awaiting-remote-check: HTTP ${transient.statusCode}; retry ${checkpoint.attempts}/5`
      } else {
        if (checkpoint) state.candidateCheck = checkpoint
        state.status = 'blocked'; state.detail = err instanceof Error ? err.message : String(err)
      }
      saveState(cfg, state)
    }
    return withCoverage(`${state.issue.number}: ${state.status}`)
  } finally { releaseLock(lock, lockToken) }
}
