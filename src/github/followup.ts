import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import type { GithubClient } from './client.js'
import { githubStopFile, type GithubConfig } from './config.js'
import { eligibleForRun } from './repair.js'
import { branchFor, fingerprint, saveState, type IssueState } from './state.js'
import { assertPublishable } from './job.js'

// ponytail: reuse the runner lock and lifetime attempt cap for every revision.
export async function observePr(cfg: GithubConfig, state: IssueState, client: GithubClient, active = () => true, check = assertPublishable): Promise<void> {
  if (!client.feedback || !state.pr || !state.commit) return
  const remote = await client.feedback(branchFor(state.issue.number))
  if (!active()) return
  if (remote.url !== state.pr || remote.base !== cfg.base || remote.head !== state.commit) throw new Error('PR head/base changed outside this runner; inspect before continuing')
  const key = createHash('sha256').update(JSON.stringify([remote.head, remote.feedback])).digest('hex')
  state.remote = { ...remote, at: new Date().toISOString(), key }
  saveState(cfg, state)
  if (remote.state !== 'open' || remote.checks === 'pending' || !remote.feedback || !cfg.followup || !cfg.publish || state.revision?.key === key) return
  if (state.runs >= cfg.maxRuns) { state.detail = 'PR follow-up attempt limit reached; human review required'; saveState(cfg, state); return }
  const issue = await client.issue(state.issue.number)
  if (!active() || existsSync(githubStopFile(cfg))) return
  if (!eligibleForRun(issue, cfg) || fingerprint(issue) !== state.fingerprint) throw new Error('Issue approval changed before PR follow-up')
  check(cfg, state)
  state.revision = { round: (state.revision?.round ?? 0) + 1, baseCommit: state.commit, feedback: remote.feedback, key }
  state.baseSha = state.commit
  state.commit = undefined
  state.acceptance = undefined
  state.status = 'queued'
  state.nextRunAt = Date.now() + cfg.retryMs
  state.detail = 'PR feedback queued; previous revision and evidence preserved'
  saveState(cfg, state)
}
