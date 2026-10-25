import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { parseArgs } from 'node:util'
import { z } from 'zod'
import { BacklogStore } from '../backlog.js'
import { expandConfigPaths } from '../cli/assemble.js'
import { captureExecutionReadonly, readExecutions } from '../engines/execution-observation.js'
import { extraBillingScopes, globalCostReport } from '../globalcost.js'
import { acquireLock, releaseLock } from '../lock.js'
import { ConfigSchema } from '../types.js'
import { command, githubClient, type GithubClient } from './client.js'
import { githubStopFile, parseGithubConfig } from './config.js'
import { checkoutDir, git, issueTask, prepareCheckout, runtimeConfig } from './job.js'
import { eligibleForRun } from './repair.js'
import { branchFor, candidatePolicyHash, fingerprint, issueDir, readState, runDir, saveState, type IssueState } from './state.js'

const sha = z.string().regex(/^[a-f0-9]{64}$/)
const Request = z.object({ oldFingerprint: sha, newFingerprint: sha, stateSha256: sha, reason: z.string().trim().min(8).max(1000),
  stoppedExecutions: z.array(z.string().regex(/^[A-Za-z0-9_-]{1,100}$/)).max(5).default([]) }).strict()
export type ReapprovalRequest = z.input<typeof Request>
const digest = (text: string | Buffer) => createHash('sha256').update(text).digest('hex')
function immutableFile(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true })
  if (existsSync(path)) {
    if (!lstatSync(path).isFile() || readFileSync(path, 'utf8') !== text) throw new Error('Immutable approval evidence conflicts; preserve state')
  } else writeFileSync(path, text, { flag: 'wx', mode: 0o600 })
}

/** A trusted local operator action, never called by sync, Issue text or the Worker.
 * Queueing does not start an engine or reset lifetime attempts, historic databases or publication policy. */
export async function reapproveIssue(file: string, number: number, input: ReapprovalRequest, options: { client?: GithubClient } = {}) {
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('Positive Issue number required')
  const request = Request.parse(input), configuration = readFileSync(file, 'utf8'), cfg = parseGithubConfig(file, configuration)
  if (!cfg.enabled || cfg.repair || existsSync(githubStopFile(cfg))) throw new Error('Reapproval requires enabled unpaused ordinary Issue configuration')
  const sourceBytes = readFileSync(cfg.sourceConfig), source = expandConfigPaths(dirname(cfg.sourceConfig), ConfigSchema.parse(JSON.parse(sourceBytes.toString('utf8'))))
  const token = acquireLock(join(cfg.dataDir, 'runner.lock'))
  if (!token) throw new Error('Runner active; no requirement approval performed')
  try {
    const state = readState(cfg, number)
    if (!state) throw new Error('Issue state not found')
    const stateFile = join(issueDir(cfg, number), 'state.json'), original = readFileSync(stateFile, 'utf8')
    const actor = command('gh', ['api', '--hostname', 'github.com', 'user', '--jq', '.login'])
    if (!cfg.authors.some(a => a.toLowerCase() === actor.toLowerCase())) throw new Error('Reapproval requires an authenticated allowed operator')
    const client = options.client ?? githubClient(cfg)
    const current = async () => {
      const issue = await client.issue(number)
      if (issue.number !== number || !eligibleForRun(issue, cfg) || fingerprint(issue) !== request.newFingerprint)
        throw new Error('New requirement changed, closed or authorization withdrawn')
      if (readFileSync(file, 'utf8') !== configuration || !readFileSync(cfg.sourceConfig).equals(sourceBytes) || existsSync(githubStopFile(cfg))
        || readFileSync(stateFile, 'utf8') !== original) throw new Error('State, configuration or pause changed during approval')
      return issue
    }
    const proposed = await current()
    const replay = state.requirement && state.fingerprint === request.newFingerprint && state.requirement.previousFingerprint === request.oldFingerprint
      && state.requirement.predecessorSha256 === request.stateSha256
    if (replay) {
      if (state.requirement!.configurationSha256 !== digest(configuration) || state.requirement!.sourceSha256 !== digest(sourceBytes)
        || state.requirement!.policyHash !== candidatePolicyHash(cfg, sourceBytes)) throw new Error('Approved configuration changed')
      if (JSON.stringify(await current()) !== JSON.stringify(proposed)) throw new Error('Issue changed during approval replay')
      return { alreadyApproved: true, state, approvalKey: state.requirement!.approvalKey }
    }
    if (state.status !== 'cancelled' || state.revision || state.fingerprint !== request.oldFingerprint || fingerprint(state.issue) !== state.fingerprint
      || request.oldFingerprint === request.newFingerprint || digest(original) !== request.stateSha256)
      throw new Error('Stale approval or unreconciled requirement; inspect exact cancelled snapshot')
    if (state.runs >= cfg.maxRuns) throw new Error('Lifetime attempt limit reached; reapproval cannot reset it')
    const version = (state.requirement?.version ?? 1) + 1
    if (version > 100) throw new Error('Requirement ancestry capacity reached; manual handoff required')
    const candidate: IssueState = { repo: state.repo, base: state.base, issue: proposed, fingerprint: request.newFingerprint,
      status: 'queued', runs: state.runs, nextRunAt: 0, history: state.history, detail: `Requirement ${version} explicitly approved by ${actor}` }
    runtimeConfig(cfg, candidate, sourceBytes) // Preserve supported engine, review, verification and cost-policy admission.
    const local = () => {
      const expectedRuns = state.runs - (state.requirement?.priorRuns ?? 0)
      const cwd = checkoutDir(cfg, state)
      let head: string | null = null
      if (existsSync(cwd)) {
        prepareCheckout(cfg, state); head = git(cwd, ['rev-parse', 'HEAD'])
        if (head !== (state.commit ?? state.baseSha)) throw new Error('Candidate head changed; preserve old worktree')
        if (git(cwd, ['worktree', 'list', '--porcelain']).split(/\r?\n/).filter(l => l.startsWith('worktree ')).length !== 1)
          throw new Error('Additional worktree ownership requires manual handoff')
      } else if (state.baseSha || state.commit || expectedRuns) throw new Error('Old checkout missing; backend/worktree ownership unproved')
      const inventory = readExecutions(runDir(cfg, state))
      if (inventory.protected) throw new Error('Old backend stop remains unconfirmed; preserve ownership')
      if (request.stoppedExecutions.length !== expectedRuns || new Set(request.stoppedExecutions).size !== expectedRuns)
        throw new Error('Exact stopped-execution evidence required for every prior writer attempt')
      const backlog = join(runDir(cfg, state), 'BACKLOG.md')
      const tasks = existsSync(backlog) ? new BacklogStore(backlog).read() : []
      if (expectedRuns && (tasks.length !== 1 || tasks[0]!.text !== issueTask(state))) throw new Error('Old task identity unproved; manual handoff required')
      const executions = request.stoppedExecutions.map(id => {
        const captured = captureExecutionReadonly(runDir(cfg, state), id)
        const worktreePath = captured.ok ? relative(join(runDir(cfg, state), 'worktrees'), captured.record.projectPath) : '..'
        const ownedPath = captured.ok && isAbsolute(captured.record.projectPath) && (resolve(captured.record.projectPath) === resolve(cwd)
          || (worktreePath !== '' && !isAbsolute(worktreePath) && worktreePath !== '..' && !worktreePath.startsWith(`..${sep}`)
            && !existsSync(captured.record.projectPath)))
        if (!captured.ok || captured.record.phase !== 'terminal' || !['completed', 'failed'].includes(captured.record.outcome ?? '')
          || captured.record.exit?.reason !== 'exit' || captured.record.cancelRequested || captured.record.degraded || captured.record.backendRecovery
          || captured.record.taskId !== tasks[0]?.id || !head || !ownedPath)
          throw new Error('Exact prior backend stop/task/worktree binding unproved; manual handoff required')
        return { id, sha256: captured.sha256 }
      })
      if (!source.globalDailyHardUsd) throw new Error('Global budget policy required for requirement successor')
      const budget = globalCostReport(cfg.sourceConfig, new Date().toISOString(), extraBillingScopes(source, [cfg.dataDir, ...(cfg.billingScope ? [cfg.billingScope] : [])]), digest(sourceBytes))
      const nextReservation = source.engines[cfg.engine]?.costPerRunUsd ?? source.failureCostEstimateUsd
      if (!budget.complete || budget.bookedUsd >= source.globalDailyHardUsd || budget.bookedUsd + nextReservation > source.globalDailyHardUsd)
        throw new Error('Global budget exhausted or accounting incomplete; no successor queued')
      return { head, executions, budget }
    }
    const inspect = async () => {
      if (await client.findPr(branchFor(number)) || await client.findLinkedPr(number)) throw new Error('Existing PR ownership/head requires manual handoff')
      return local()
    }
    const observed = await inspect()
    if (JSON.stringify(await current()) !== JSON.stringify(proposed) || JSON.stringify(await inspect()) !== JSON.stringify(observed))
      throw new Error('Issue, backend, worktree, PR or budget evidence changed during approval')
    // One last local+remote read follows the asynchronous PR/accounting observations.
    if (JSON.stringify(await current()) !== JSON.stringify(proposed)) throw new Error('Issue changed before approval commit')
    if (JSON.stringify(local()) !== JSON.stringify(observed)) throw new Error('Backend, worktree or budget changed before approval commit')
    if (command('gh', ['api', '--hostname', 'github.com', 'user', '--jq', '.login']) !== actor) throw new Error('Authenticated operator changed during approval')
    if (existsSync(runDir(cfg, { ...candidate, requirement: { version } as IssueState['requirement'] })))
      throw new Error('Successor workspace already exists without a matching approval; manual handoff required')
    const key = digest(JSON.stringify([cfg.repo, number, request.oldFingerprint, request.newFingerprint, request.stateSha256, digest(configuration), digest(sourceBytes)]))
    const root = join(issueDir(cfg, number), 'requirements')
    for (const path of [root, join(root, 'snapshots'), join(root, 'approvals')]) {
      if (existsSync(path) && (!lstatSync(path).isDirectory() || lstatSync(path).isSymbolicLink())) throw new Error('Requirement evidence directory is not owned; preserve state')
      mkdirSync(path, { recursive: true })
    }
    const predecessorFile = `requirements/snapshots/${request.stateSha256}.json`, receiptFile = join(root, 'approvals', `${key}.json`)
    const receipt = { schema: 'github-requirement-approval/v1', key, repo: cfg.repo, issue: number, actor, approvedAt: new Date().toISOString(),
      oldFingerprint: request.oldFingerprint, newFingerprint: request.newFingerprint, stateSha256: request.stateSha256,
      configurationSha256: digest(configuration), sourceSha256: digest(sourceBytes), policyHash: candidatePolicyHash(cfg, sourceBytes), reason: request.reason, observed,
      oldSnapshot: state.issue, newSnapshot: proposed, priorRuns: state.runs }
    let receiptText = JSON.stringify(receipt, null, 2) + '\n'
    if (existsSync(receiptFile)) {
      const savedText = readFileSync(receiptFile, 'utf8'), saved = JSON.parse(savedText)
      if (saved.schema !== 'github-requirement-approval/v1' || saved.key !== key || saved.actor !== actor || saved.oldFingerprint !== request.oldFingerprint || saved.newFingerprint !== request.newFingerprint
        || saved.stateSha256 !== request.stateSha256 || saved.configurationSha256 !== digest(configuration) || saved.sourceSha256 !== digest(sourceBytes)
        || JSON.stringify(saved.observed) !== JSON.stringify(observed) || JSON.stringify(saved.oldSnapshot) !== JSON.stringify(state.issue)
        || JSON.stringify(saved.newSnapshot) !== JSON.stringify(proposed) || saved.priorRuns !== state.runs || saved.policyHash !== candidatePolicyHash(cfg, sourceBytes))
        throw new Error('Prepared approval conflicts; preserve state')
      receiptText = savedText // A crash after immutable evidence creation does not create a second approval.
    }
    immutableFile(join(issueDir(cfg, number), predecessorFile), original)
    immutableFile(receiptFile, receiptText)
    candidate.requirement = { version, previousFingerprint: state.fingerprint, priorRuns: state.runs, predecessorFile, predecessorSha256: request.stateSha256,
      approvalKey: key, approvalSha256: digest(receiptText), actor, approvedAt: JSON.parse(receiptText).approvedAt, configurationSha256: digest(configuration), sourceSha256: digest(sourceBytes), policyHash: candidatePolicyHash(cfg, sourceBytes) }
    saveState(cfg, candidate)
    return { alreadyApproved: false, state: readState(cfg, number)!, approvalKey: key }
  } finally { releaseLock(join(cfg.dataDir, 'runner.lock'), token) }
}

export async function reapprovalCli(argv: string[]) {
  const { values } = parseArgs({ args: argv, options: { config: { type: 'string' }, issue: { type: 'string' }, old: { type: 'string' }, new: { type: 'string' }, state: { type: 'string' }, reason: { type: 'string' }, stopped: { type: 'string', multiple: true } } })
  if (!values.config) throw new Error('Usage: adng github reapprove --config FILE --issue N --old SHA256 --new SHA256 --state SHA256 --reason TEXT [--stopped EXECUTION_ID]')
  console.log(JSON.stringify(await reapproveIssue(values.config, Number(values.issue), { oldFingerprint: values.old!, newFingerprint: values.new!, stateSha256: values.state!, reason: values.reason!, stoppedExecutions: values.stopped }), null, 2))
}
