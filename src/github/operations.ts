import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { parseArgs } from 'node:util'
import { BacklogStore } from '../backlog.js'
import { ConfigSchema } from '../types.js'
import { expandConfigPaths } from '../cli/assemble.js'
import { acquireLock, releaseLock } from '../lock.js'
import { makeEngineRegistry } from '../engines/registry.js'
import { runProcess } from '../engines/proc.js'
import { writeJsonAtomic } from '../guardian/incident.js'
import { githubStopFile, loadGithubConfig, type GithubConfig } from './config.js'
import { command, githubClient, type GithubClient } from './client.js'
import { eligibleForRun } from './repair.js'
import { assertPublishable, checkoutDir, git, issueTask, prepareCheckout } from './job.js'
import { alternativeRunPending, branchFor, fingerprint, issueDir, runDir, readState, saveState, states, type IssueState } from './state.js'
import { readExecutions } from '../engines/execution-observation.js'

export async function repairDoctor(cfg: GithubConfig, live = false) {
  const source = expandConfigPaths(dirname(cfg.sourceConfig), ConfigSchema.parse(JSON.parse(readFileSync(cfg.sourceConfig, 'utf8'))))
  const engine = source.engines[cfg.engine]
  if (!engine || ['mock', 'herdr'].includes(engine.adapter) || engine.timeoutMs === 0) throw new Error('Requires a bounded supported worker')
  if (!(cfg.verifyCommand ?? source.verifyCommand)?.trim() || !(source.reviewEngine ?? source.auditModel)) throw new Error('Requires verification command and independent reviewer')
  const checks: Record<string, string> = { credentials: 'pass', verification: 'pass', reviewer: 'pass' }
  if (!cfg.template) {
    const origin = git(source.projectPath, ['remote', 'get-url', 'origin']).replace(/\.git$/, '').replace(/^git@github.com:/, 'https://github.com/').replace(/^https:\/\//, '').toLowerCase()
    if (origin !== `github.com/${cfg.repo}`.toLowerCase()) throw new Error('Source repository origin does not match GitHub configuration')
  }
  const probes: [string, string, string[]][] = [['git', 'git', ['--version']], ['github', 'gh', ['api', '--hostname', 'github.com', `repos/${cfg.repo}`, '--jq', '.permissions.push']]]
  if (source.llmTransport === 'cli' || ['codex', 'freebuff'].includes(engine.adapter)) probes.push(['codex', 'codex', ['--version']], ['login', 'codex', ['login', 'status']])
  for (const [name, cmd, args] of probes) {
    try {
      const result = await runProcess({ command: cmd, args: [...args], cwd: source.projectPath, stdinText: '', timeoutMs: 20_000, maxOutputChars: 2000 })
      checks[name] = result.exitCode === 0 && !result.timedOut && (name !== 'github' || result.stdout.trim() === 'true') ? 'pass' : 'unavailable; run the CLI login/setup command'
    } catch { checks[name] = 'unavailable; run the CLI login/setup command' }
  }
  let sandbox = { ok: false, detail: 'not tested; use repair-doctor --live (same worker permissions)' }
  if (live && Object.values(checks).every(c => c === 'pass')) {
    mkdirSync(cfg.dataDir, { recursive: true })
    const worker = makeEngineRegistry({ ...source, dataDir: cfg.dataDir, ...(cfg.repair && source.tierMode !== 'free-only' ? { llmTransport: 'cli' as const } : {}) }).resolve(cfg.engine)
    worker.invalidatePreflight?.()
    sandbox = await worker.preflight()
  }
  const result = { repo: cfg.repo, at: new Date().toISOString(), live, ready: live && sandbox.ok && Object.values(checks).every(c => c === 'pass'),
    paused: !cfg.enabled || existsSync(githubStopFile(cfg)), stopFile: githubStopFile(cfg), checks, sandbox,
    verification: { configured: true, executed: false, acceptanceConfigured: !!cfg.acceptance },
    isolation: engine.adapter === 'freebuff' ? 'worktree and prompt scope; MCP preflight is not an OS sandbox test' : engine.adapter === 'codex' ? 'Codex sandbox' : 'adapter-controlled permissions; preflight is not an OS sandbox proof' }
  if (live) writeFileSync(join(cfg.dataDir, 'doctor.json'), JSON.stringify(result, null, 2) + '\n')
  return result
}

export function delivery(cfg: GithubConfig, state: IssueState) {
  if (!['ready', 'published'].includes(state.status)) throw new Error('No completed candidate; inspect repair-status or recover the interrupted run')
  assertPublishable(cfg, state)
  return { repo: cfg.repo, issue: state.issue.number, commit: state.commit, base: state.baseSha, snapshot: state.fingerprint,
    directory: checkoutDir(cfg, state), evidence: join(runDir(cfg, state), 'evidence'),
    review: 'CI, independent reviewer, local checkout merge and regression verified for this exact commit',
    projectAcceptance: cfg.acceptance ? 'passed for candidate' : 'not configured',
    remote: state.remote?.head === state.commit ? state.remote : null, humanAcceptance: state.acceptance?.commit === state.commit ? state.acceptance : null,
    publishEnabled: cfg.publish, pr: state.pr ?? null, humanMergeRequired: true,
    rollback: `git revert ${state.commit}` }
}

export async function recoverIssue(file: string, number: number, reason: string, resume = false,
  options: { client?: GithubClient; doctor?: typeof repairDoctor } = {}): Promise<IssueState> {
  if (!Number.isSafeInteger(number) || number <= 0 || reason.trim().length < 8 || reason.length > 1000) throw new Error('A positive Issue number and specific recovery reason (8–1000 characters) are required')
  const cfg = loadGithubConfig(file), original = readFileSync(file, 'utf8'), source = readFileSync(cfg.sourceConfig, 'utf8')
  if (!cfg.enabled) throw new Error('Repair configuration disabled or missing')
  const policy = cfg.repair ? readFileSync(cfg.repair.reportConfig, 'utf8') : undefined, stop = githubStopFile(cfg)
  const pause = existsSync(stop) ? readFileSync(stop, 'utf8') : undefined
  if (pause !== undefined && !resume) throw new Error('Paused; use repair-resume after fixing the environment')
  mkdirSync(cfg.dataDir, { recursive: true })
  const lock = join(cfg.dataDir, 'runner.lock')
  if (!acquireLock(lock)) throw new Error('Runner active; no recovery performed')
  try {
    const state = readState(cfg, number)
    if (!state || !['blocked', 'running', 'queued', 'ready'].includes(state.status)) throw new Error('State cannot be recovered')
    if (readExecutions(runDir(cfg, state)).protected) throw new Error('Execution stop remains unconfirmed; preserve ownership and verify the backend before recovery')
    const client = options.client ?? githubClient(cfg)
    const current = async () => {
      const issue = await client.issue(number)
      if (!eligibleForRun(issue, cfg) || fingerprint(issue) !== state.fingerprint) throw new Error('Issue changed, closed or authorization withdrawn')
      if (readFileSync(file, 'utf8') !== original || readFileSync(cfg.sourceConfig, 'utf8') !== source || (cfg.repair ? readFileSync(cfg.repair.reportConfig, 'utf8') : undefined) !== policy
        || (existsSync(stop) ? readFileSync(stop, 'utf8') : undefined) !== pause) throw new Error('Configuration or pause changed during recovery')
    }
    await current()
    const pr = await client.findPr(branchFor(number))
    if (pr && pr.state === 'open' && pr.head.sha === state.commit && pr.base.ref === cfg.base) {
      state.pr = pr.html_url // Publish may have succeeded before the host persisted its final state.
    } else if (state.revision) {
      if (!pr || pr.state !== 'open' || pr.html_url !== state.pr || pr.head.sha !== state.revision.baseCommit || pr.base.ref !== cfg.base) throw new Error('Existing PR changed; inspect it before retry')
    } else if (pr || await client.findLinkedPr(number)) throw new Error('Existing PR; inspect it before retry')
    const cwd = checkoutDir(cfg, state)
    if (existsSync(cwd)) {
      prepareCheckout(cfg, state)
      const head = git(cwd, ['rev-parse', 'HEAD'])
      if (head !== state.baseSha) { state.commit = head; assertPublishable(cfg, state); state.status = 'ready' }
      else if (state.commit || state.status === 'ready') throw new Error('Candidate missing; preserving state')
      // Preserve every interrupted worktree; a clean non-base commit also requires evidence recovery.
      for (const row of git(cwd, ['worktree', 'list', '--porcelain']).split(/\r?\n/).filter(l => l.startsWith('worktree '))) {
        const path = row.slice(9)
        if (git(path, ['status', '--porcelain'])) throw new Error('Dirty worktree preserved; inspect changes before retry')
        const head = git(path, ['rev-parse', 'HEAD'])
        if (path.replace(/\\/g, '/') !== cwd.replace(/\\/g, '/') && head !== state.baseSha && head !== state.commit) throw new Error('Unreconciled worktree commit; inspect evidence before retry')
      }
    } else if (state.baseSha && !state.revision) throw new Error('Checkout missing; preserving state')
    if (state.status !== 'ready') {
      if (state.runs >= cfg.maxRuns && !alternativeRunPending(cfg, state)) throw new Error('Attempt limit reached; counters will not be reset')
      const backlog = join(runDir(cfg, state), 'BACKLOG.md')
      if (existsSync(backlog)) {
        const tasks = new BacklogStore(backlog).read()
        if (tasks.length !== 1 || tasks[0]!.text !== issueTask(state) || tasks[0]!.status !== 'open') throw new Error('Backlog requires evidence recovery; no automatic rewrite')
      }
      state.status = 'queued'; state.nextRunAt = 0
    }
    if (state.status === 'queued' || pause !== undefined) {
      const doctor = await (options.doctor ?? repairDoctor)(cfg, true)
      if (!doctor.ready) throw new Error(`Repair environment unavailable: ${doctor.sandbox.detail}`)
    }
    await current()
    const receipt = join(issueDir(cfg, number), `recovery-${randomUUID()}.json`)
    const intent = { at: new Date().toISOString(), reason, before: readState(cfg, number), plannedStatus: state.status }
    writeJsonAtomic(receipt, { ...intent, phase: 'prepared' })
    state.detail = `Recovery: ${reason.trim()}`; saveState(cfg, state)
    if (pause !== undefined) renameSync(stop, `${stop}.resumed-${randomUUID()}`)
    writeJsonAtomic(receipt, { ...intent, phase: 'completed', after: readState(cfg, number), paused: existsSync(stop) })
    return state
  } finally { releaseLock(lock) }
}

export async function acceptDelivery(file: string, number: number, commit: string, evidence: string) {
  if (!Number.isSafeInteger(number) || number < 1 || evidence.trim().length < 8 || evidence.length > 2000) throw new Error('Issue and concrete acceptance evidence required (8–2000 characters)')
  const cfg = loadGithubConfig(file), lock = join(cfg.dataDir, 'runner.lock'), original = readFileSync(file, 'utf8'), source = readFileSync(cfg.sourceConfig, 'utf8')
  if (!acquireLock(lock)) throw new Error('Runner active; retry acceptance later')
  try {
    const state = readState(cfg, number)
    if (!state || state.commit !== commit || state.status !== 'published') throw new Error('Published candidate changed; review current commit')
    delivery(cfg, state)
    const client = githubClient(cfg), remote = await client.feedback!(branchFor(number))
    if (remote.head !== commit || remote.url !== state.pr || remote.state !== 'merged') throw new Error('Merge must be confirmed before human acceptance')
    const actor = command('gh', ['api', '--hostname', 'github.com', 'user', '--jq', '.login'])
    if (!cfg.authors.some(a => a.toLowerCase() === actor.toLowerCase())) throw new Error('Acceptance requires an allowed operator')
    if (readFileSync(file, 'utf8') !== original || readFileSync(cfg.sourceConfig, 'utf8') !== source) throw new Error('Acceptance configuration changed; inspect current policy')
    state.acceptance = { commit, at: new Date().toISOString(), actor, evidence: evidence.trim() }
    state.remote = { ...remote, at: new Date().toISOString(), key: state.remote?.key ?? '' }
    saveState(cfg, state)
    return state.acceptance
  } finally { releaseLock(lock) }
}

export function repairMetrics(cfg: GithubConfig) {
  const rows = states(cfg), attempted = rows.filter(s => s.runs > 0), completed = rows.filter(s => ['ready', 'published'].includes(s.status))
  const verified = completed.filter(s => { try { delivery(cfg, s); return true } catch { return false } })
  const paused = !cfg.enabled || existsSync(githubStopFile(cfg))
  const failed = (s: Pick<IssueState, 'status' | 'runs' | 'detail'>) => s.runs > 0 && ['queued', 'blocked'].includes(s.status) && s.detail === 'failed'
  const failures = rows.map(s => {
    const runs = new Set((s.history ?? []).filter((e, i, history) => e.runs > 0 && ['queued', 'blocked'].includes(e.status)
      && !e.detail?.startsWith('Recovery:') && !e.detail?.startsWith('Execution recovery required:') && (e.detail === 'failed' || (history[i - 1]?.status === 'running' && history[i - 1]?.runs === e.runs))).map(e => e.runs))
    if (failed(s)) runs.add(s.runs) // A legacy snapshot is evidence of this failure, not every earlier attempt.
    return runs.size
  })
  const incomplete = attempted.filter(s => new Set((s.history ?? []).filter(e => e.status === 'running' && e.runs > 0 && e.runs <= s.runs).map(e => e.runs)).size < s.runs)
  const recordedFailedAttempts = failures.reduce((n, v) => n + v, 0)
  return { repo: cfg.repo, at: new Date().toISOString(), paused, recordedFailedAttempts,
    failedAttempts: incomplete.length ? null : recordedFailedAttempts, failureHistoryIncompleteIssues: incomplete.length,
    repeatedFailureIssues: failures.filter(n => n > 1).length, observedIssues: rows.length, attemptedIssues: attempted.length, attempts: rows.reduce((n, s) => n + s.runs, 0),
    verifiedCompletions: verified.length, issueCompletionRate: attempted.length ? verified.length / attempted.length : null,
    retriedIssues: rows.filter(s => s.runs > 1).length, needsAttention: rows.filter(s => ['blocked', 'cancelled'].includes(s.status) || (paused && s.status === 'queued' && s.runs > 0)).length,
    recoveries: rows.reduce((n, s) => n + (s.history ?? []).filter(e => e.detail?.startsWith('Recovery:')).length, 0),
    journeyCompletions: { verifiedCandidates: verified.length, automatedRepairProbe: cfg.repair ? verified.length : null,
      merged: rows.filter(s => s.remote?.state === 'merged' && s.remote.head === s.commit).length,
      humanAcceptance: rows.filter(s => s.acceptance && s.acceptance.commit === s.commit).length },
    userOutcome: 'explicit acceptance only; candidate verification is not human acceptance', issues: rows.map(s => ({ number: s.issue.number, status: s.status, runs: s.runs, detail: s.detail })) }
}

export async function operationsCli(mode: string, argv: string[]): Promise<void> {
  if (!mode.startsWith('repair-')) mode = `repair-${mode}` // Shared recovery and diagnosis for both intake paths.
  const { values } = parseArgs({ args: argv, options: { config: { type: 'string' }, issue: { type: 'string' }, reason: { type: 'string' }, commit: { type: 'string' }, live: { type: 'boolean' } } })
  if (!values.config) throw new Error('Usage: adng github repair-<doctor|retry|resume|delivery|metrics> --config <path> [--issue N --reason text] [--live]')
  const cfg = loadGithubConfig(values.config)
  let result: unknown
  if (mode === 'repair-accept') result = await acceptDelivery(values.config, Number(values.issue), values.commit ?? '', values.reason ?? '')
  else if (mode === 'repair-doctor') { const doctor = await repairDoctor(cfg, values.live); result = doctor; if (!doctor.ready) process.exitCode = 1 }
  else if (mode === 'repair-metrics') result = repairMetrics(cfg)
  else if (mode === 'repair-delivery') {
    const state = readState(cfg, Number(values.issue)); if (!state) throw new Error('Issue state not found'); result = delivery(cfg, state)
  } else result = await recoverIssue(values.config, Number(values.issue), values.reason ?? '', mode === 'repair-resume')
  console.log(JSON.stringify(result, null, 2))
}
