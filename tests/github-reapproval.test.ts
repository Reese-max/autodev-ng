import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { RunDb } from '../src/db.js'
import { GithubConfigSchema, type Issue } from '../src/github/config.js'
import * as github from '../src/github/client.js'
import * as reconcile from '../src/github/reconcile.js'
import { branchFor, fingerprint, readState, runDir, saveState, type IssueState } from '../src/github/state.js'
import { issueBillingDbs } from '../src/globalcost.js'
import { assertPublishable, git, issueTask, prepareCheckout, runtimeConfig } from '../src/github/job.js'
import { publishIssue, runGithub, syncIssues } from '../src/github/runner.js'
import { BacklogStore } from '../src/backlog.js'
import { attemptAccounting } from '../src/engines/attempt-accounting.js'
import { createExecutionObservation } from '../src/engines/execution-observation.js'

const roots: string[] = []
afterEach(() => { vi.restoreAllMocks(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })
const hash = (text: string) => createHash('sha256').update(text).digest('hex')
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'adng-reapproval-')); roots.push(root)
  const configs = join(root, 'configs'); mkdirSync(configs)
  const source = join(configs, 'source.json'), file = join(root, 'github.json'), dataDir = join(root, 'issues'), accounting = join(root, 'accounting')
  mkdirSync(accounting); new RunDb(join(accounting, 'run.db')).close()
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: source, dataDir, engine: 'writer', template: true, enabled: true, verifyCommand: 'node --version' })
  writeFileSync(file, JSON.stringify(cfg)); writeFileSync(source, JSON.stringify({ projectPath: root, dataDir: accounting, backlogFile: 'unused', globalDailyHardUsd: 10,
    engines: { writer: { adapter: 'codex', costPerRunUsd: 0.5 } }, defaultEngine: 'writer', reviewEngine: 'reviewer' }))
  const old: Issue = { number: 4, title: 'Original', body: 'Version one', state: 'open', labels: [{ name: 'autodev' }], user: { login: 'owner' } }
  const current: Issue = { ...old, body: 'Version two' }
  const state: IssueState = { repo: cfg.repo, base: cfg.base, issue: old, fingerprint: fingerprint(old), status: 'cancelled', runs: 0, nextRunAt: 0 }
  saveState(cfg, state)
  const stateFile = join(dataDir, 'issue-4/state.json'), before = readFileSync(stateFile, 'utf8')
  const request = { oldFingerprint: state.fingerprint, newFingerprint: fingerprint(current), stateSha256: hash(before), reason: 'Approve exact revised requirement after review', stoppedExecutions: [] as string[] }
  const client: github.GithubClient = { list: vi.fn(async () => [current]), issue: vi.fn(async () => current), findPr: vi.fn(async () => undefined), findLinkedPr: vi.fn(async () => undefined), createPr: vi.fn() }
  const original = github.command
  vi.spyOn(github, 'command').mockImplementation((exe, args, cwd, input) => exe === 'gh' && args.includes('user') ? 'owner' : original(exe, args, cwd, input))
  return { root, file, cfg, source, old, current, state, stateFile, before, request, client }
}
const approve = (...args: unknown[]) => (reconcile as unknown as { reapproveIssue: (...a: unknown[]) => Promise<any> }).reapproveIssue(...args)

test('trusted exact reapproval creates one durable successor; sync and replay cannot authorize another writer', async () => {
  const f = fixture()
  await syncIssues(f.cfg, f.client)
  expect(readFileSync(f.stateFile, 'utf8')).toBe(f.before)
  const result = await approve(f.file, 4, f.request, { client: f.client })
  expect(result.alreadyApproved).toBe(false)
  const after = readState(f.cfg, 4)!
  expect(after).toMatchObject({ fingerprint: fingerprint(f.current), issue: f.current, status: 'queued', runs: 0, requirement: { version: 2, previousFingerprint: fingerprint(f.old), priorRuns: 0, actor: 'owner' } })
  expect(readFileSync(join(f.cfg.dataDir, 'issue-4', after.requirement!.predecessorFile), 'utf8')).toBe(f.before)
  expect(runDir(f.cfg, after)).toBe(join(f.cfg.dataDir, 'issue-4/requirements/2'))
  const stable = readFileSync(f.stateFile, 'utf8')
  expect(await approve(f.file, 4, f.request, { client: f.client })).toMatchObject({ alreadyApproved: true })
  expect(readFileSync(f.stateFile, 'utf8')).toBe(stable)
  const execute = vi.fn(async () => ({ done: false, detail: 'fixture terminal failure', attempted: true, terminalBlocked: true }))
  expect(await runGithub(f.cfg, { client: f.client, execute })).toBe('4: blocked')
  expect(await runGithub(f.cfg, { client: f.client, execute })).toBe('idle')
  expect(execute).toHaveBeenCalledTimes(1); expect(f.client.createPr).not.toHaveBeenCalled()
})

test('requirement-generation billing remains visible alongside original and PR revision databases', () => {
  const f = fixture(), issue = join(f.cfg.dataDir, 'issue-4')
  const locations = [issue, join(issue, 'requirements/2'), join(issue, 'requirements/2/revisions/1')]
  for (const p of locations) { mkdirSync(p, { recursive: true }); new RunDb(join(p, 'run.db')).close() }
  expect(issueBillingDbs(f.cfg.dataDir).sort()).toEqual(locations.map(p => join(p, 'run.db')).sort())
})

test('approved normalized GitHub policy remains bound at runner, direct runtime, checkout and publication entrypoints', async () => {
  const f = fixture(), accepted = await approve(f.file, 4, f.request, { client: f.client })
  f.cfg.verifyCommand = 'node -e "process.exit(0)"'
  writeFileSync(f.file, JSON.stringify(f.cfg))
  const execute = vi.fn(async () => ({ done: false, detail: 'unreachable', attempted: true, terminalBlocked: true }))
  await runGithub(f.cfg, { client: f.client, execute, configPath: f.file })
  expect(execute).not.toHaveBeenCalled()
  for (const gate of [runtimeConfig, prepareCheckout, assertPublishable]) expect(() => gate(f.cfg, accepted.state)).toThrow('Approved requirement policy changed')
  const pushed = vi.fn(), checked = vi.fn()
  await expect(publishIssue({ ...f.cfg, publish: true }, accepted.state, f.client, checked, pushed)).rejects.toThrow('Approved requirement policy changed')
  expect(checked).not.toHaveBeenCalled(); expect(pushed).not.toHaveBeenCalled(); expect(f.client.createPr).not.toHaveBeenCalled()
})

function priorAttempt(f: ReturnType<typeof fixture>) {
  const cwd = join(runDir(f.cfg, f.state), 'repo'); mkdirSync(cwd)
  git(cwd, ['init', '-b', branchFor(4)]); git(cwd, ['config', 'user.name', 'Test']); git(cwd, ['config', 'user.email', 'test@example.invalid'])
  git(cwd, ['remote', 'add', 'origin', 'https://github.com/owner/project.git'])
  writeFileSync(join(cwd, 'feature.txt'), 'original\n'); git(cwd, ['add', '.']); git(cwd, ['commit', '-m', 'original'])
  f.state.baseSha = git(cwd, ['rev-parse', 'HEAD'])
  writeFileSync(join(cwd, 'feature.txt'), 'preserved candidate\n'); git(cwd, ['add', '.']); git(cwd, ['commit', '-m', 'old requirement candidate'])
  f.state.commit = git(cwd, ['rev-parse', 'HEAD']); f.state.runs = 1; saveState(f.cfg, f.state)
  f.before = readFileSync(f.stateFile, 'utf8'); f.request.stateSha256 = hash(f.before)
  const backlogFile = join(runDir(f.cfg, f.state), 'BACKLOG.md'), backlog = new BacklogStore(backlogFile); writeFileSync(backlogFile, '')
  backlog.append(issueTask(f.state), { goalId: 'github-4', round: 1 })
  const task = backlog.read()[0]!, dataDir = runDir(f.cfg, f.state)
  const db = new RunDb(join(dataDir, 'run.db'))
  db.record({ taskId: task.id, ok: false, costUsd: 1.25, detail: 'Old requirement attempt', engine: 'writer', accounting: attemptAccounting({ ok: false, output: '', costUsd: 1.25 }, {}) }); db.close()
  const observer = createExecutionObservation({ dataDir, adapter: 'codex', job: { task, projectPath: join(dataDir, 'worktrees/old-worker'), executionId: 'old-execution' } })
  observer.control.onEvent!({ type: 'exit', code: 1, reason: 'exit' }); observer.finish('failed')
  f.request.stoppedExecutions = ['old-execution']
  return { cwd, task, dataDir }
}

test('proven stopped predecessor preserves actual Git candidate, billing and lifetime attempts across restart and ancestry', async () => {
  const f = fixture(), prior = priorAttempt(f), originalDb = readFileSync(join(prior.dataDir, 'run.db'))
  const result = await approve(f.file, 4, f.request, { client: f.client })
  expect(result.state).toMatchObject({ status: 'queued', runs: 1, requirement: { version: 2, priorRuns: 1 } })
  expect(git(prior.cwd, ['rev-parse', 'HEAD'])).toBe(f.state.commit)
  expect(readFileSync(join(prior.cwd, 'feature.txt'), 'utf8')).toBe('preserved candidate\n')
  expect(readFileSync(join(prior.dataDir, 'run.db'))).toEqual(originalDb)
  const after = readState(f.cfg, 4)!
  expect(after.commit).toBeUndefined(); expect(after.baseSha).toBeUndefined()
  const receipt = JSON.parse(readFileSync(join(f.cfg.dataDir, 'issue-4/requirements/approvals', `${after.requirement!.approvalKey}.json`), 'utf8'))
  expect(receipt.observed).toMatchObject({ budget: { bookedUsd: 1.25, complete: true }, executions: [{ id: 'old-execution' }] })
  expect(await approve(f.file, 4, f.request, { client: f.client })).toMatchObject({ alreadyApproved: true })
  // A later approved requirement extends the chain without refreshing attempt allowance.
  after.status = 'cancelled'; saveState(f.cfg, after)
  const third: Issue = { ...f.current, body: 'Version three' }; f.client.issue = async () => third
  const request3 = { ...f.request, oldFingerprint: fingerprint(f.current), newFingerprint: fingerprint(third), stateSha256: hash(readFileSync(f.stateFile, 'utf8')), stoppedExecutions: [] }
  const v3 = await approve(f.file, 4, request3, { client: f.client })
  expect(v3.state).toMatchObject({ runs: 1, requirement: { version: 3, priorRuns: 1 } })
  expect(git(prior.cwd, ['rev-parse', 'HEAD'])).toBe(f.state.commit)
  expect(readState(f.cfg, 4)!.requirement!.version).toBe(3)
  const predecessor = join(f.cfg.dataDir, 'issue-4', v3.state.requirement.predecessorFile)
  writeFileSync(predecessor, '{}')
  expect(() => readState(f.cfg, 4)).toThrow('ancestry evidence changed')
})

test.each(['unauthenticated', 'old-fingerprint', 'new-fingerprint', 'state-hash', 'same-requirement', 'no-autofix', 'label-withdrawn', 'closed', 'author', 'existing-pr', 'linked-pr', 'attempt-limit', 'config-disabled', 'pause', 'budget', 'zero-estimate-budget', 'unknown-billing', 'active-backend', 'missing-stop', 'dirty-worktree', 'wrong-origin', 'changed-head', 'issue-drift', 'config-drift', 'source-drift', 'pause-drift'])('reapproval refuses %s without overwriting the old snapshot', async mode => {
  const f = fixture()
  let observer: ReturnType<typeof createExecutionObservation> | undefined
  if (mode === 'unauthenticated') vi.mocked(github.command).mockImplementation(() => 'other-user')
  if (mode === 'old-fingerprint') f.request.oldFingerprint = 'f'.repeat(64)
  if (mode === 'new-fingerprint') f.request.newFingerprint = 'f'.repeat(64)
  if (mode === 'state-hash') f.request.stateSha256 = 'f'.repeat(64)
  if (mode === 'same-requirement') { f.request.newFingerprint = f.request.oldFingerprint; f.client.issue = async () => f.old }
  if (mode === 'no-autofix') f.current.labels = [...f.current.labels, { name: 'no-autofix' }]
  if (mode === 'label-withdrawn') f.current.labels = []
  if (mode === 'closed') f.current.state = 'closed'
  if (mode === 'author') f.current.user = { login: 'other' }
  if (mode === 'existing-pr') f.client.findPr = async () => ({ number: 8, html_url: 'https://github.com/owner/project/pull/8', state: 'open', head: { ref: branchFor(4), sha: 'a'.repeat(40) }, base: { ref: 'main' } })
  if (mode === 'linked-pr') f.client.findLinkedPr = async () => 'https://github.com/owner/project/pull/8'
  if (mode === 'attempt-limit') { f.state.runs = f.cfg.maxRuns; saveState(f.cfg, f.state); f.before = readFileSync(f.stateFile, 'utf8'); f.request.stateSha256 = hash(f.before) }
  if (mode === 'config-disabled') { f.cfg.enabled = false; writeFileSync(f.file, JSON.stringify(f.cfg)) }
  if (mode === 'pause') writeFileSync(join(f.cfg.dataDir, '.adng.stop'), 'Paused')
  if (mode === 'zero-estimate-budget') {
    const source = JSON.parse(readFileSync(f.source, 'utf8')); source.engines.writer.costPerRunUsd = 0
    writeFileSync(f.source, JSON.stringify(source))
  }
  if (['budget', 'zero-estimate-budget', 'unknown-billing'].includes(mode)) {
    const db = new RunDb(join(f.cfg.dataDir, 'issue-4/run.db'))
    db.record({ taskId: 'fixture', ok: false, costUsd: 10, detail: '', engine: 'writer', ...(mode !== 'unknown-billing' ? { accounting: attemptAccounting({ ok: false, output: '', costUsd: 10 }, {}) } : {}) }); db.close()
  }
  if (mode === 'active-backend') observer = createExecutionObservation({ dataDir: runDir(f.cfg, f.state), adapter: 'codex', job: { executionId: 'active', projectPath: f.root, task: { id: 'active', text: issueTask(f.state), status: 'open', line: 0 } } })
  if (['missing-stop', 'dirty-worktree', 'wrong-origin', 'changed-head'].includes(mode)) {
    const p = priorAttempt(f)
    if (mode === 'missing-stop') f.request.stoppedExecutions = []
    if (mode === 'dirty-worktree') writeFileSync(join(p.cwd, 'feature.txt'), 'dirty')
    if (mode === 'wrong-origin') git(p.cwd, ['remote', 'set-url', 'origin', 'https://github.com/other/project.git'])
    if (mode === 'changed-head') { writeFileSync(join(p.cwd, 'other.txt'), 'drift'); git(p.cwd, ['add', '.']); git(p.cwd, ['commit', '-m', 'unowned candidate']) }
  }
  if (['issue-drift', 'config-drift', 'source-drift', 'pause-drift'].includes(mode)) {
    let calls = 0
    f.client.issue = async () => {
      if (++calls === 2) {
        if (mode === 'issue-drift') return { ...f.current, body: 'Unapproved version three' }
        if (mode === 'config-drift') writeFileSync(f.file, JSON.stringify({ ...f.cfg, publish: true }))
        if (mode === 'source-drift') writeFileSync(f.source, '{}')
        if (mode === 'pause-drift') writeFileSync(join(f.cfg.dataDir, '.adng.stop'), 'Paused during approval')
      }
      return f.current
    }
  }
  try {
    await expect(approve(f.file, 4, f.request, { client: f.client })).rejects.toThrow()
    expect(readFileSync(f.stateFile, 'utf8')).toBe(f.before)
    expect(f.client.createPr).not.toHaveBeenCalled()
  } finally { observer?.finish('unconfirmed') }
})
