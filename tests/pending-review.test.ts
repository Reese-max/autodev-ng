import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { ConfigSchema, type Engine } from '../src/types.js'
import { runOnce, type Deps } from '../src/scheduler.js'
import { KernelVerifier } from '../src/verifier.js'
import { TeamState } from '../src/engines/team-state.js'
import { EvidenceStore } from '../src/engines/evidence-chain.js'
import { reviewLlmFromConfig } from '../src/autopilot/llm.js'
import { reviewDiff } from '../src/engines/review-gate.js'
import { FREE_MODEL_CATALOG, FREE_MODEL_URL } from '../src/engines/free-model-policy.js'
import { pendingReviewFile, readPendingReview, reviewRetryDelay } from '../src/engines/pending-review.js'
import { runGoalSession } from '../src/autopilot/orchestrator.js'
import { baseAlertMessage } from '../src/engines/daemon-alerts.js'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }).trim()
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'adng-review-resume-')), project = join(root, 'repo'), dataDir = join(root, 'data')
  mkdirSync(project); mkdirSync(dataDir)
  git(project, 'init', '-b', 'main'); git(project, 'config', 'user.name', 'test'); git(project, 'config', 'user.email', 'test@example.test'); git(project, 'config', 'core.autocrlf', 'false')
  writeFileSync(join(project, 'value.cjs'), 'module.exports = 1\n'); git(project, 'add', '.'); git(project, 'commit', '-m', 'initial')
  const backlogFile = join(dataDir, 'BACKLOG.md'); writeFileSync(backlogFile, '- [ ] Return 2 from value.cjs\n')
  const cfg = ConfigSchema.parse({ projectPath: project, dataDir, backlogFile, worktreesDir: join(root, 'worktrees'), stopFile: join(root, 'STOP'),
    tierMode: 'free-only', defaultRisk: 'low', defaultEngine: 'oc-worker', engineRotation: ['oc-worker'],
    engines: { 'oc-worker': { adapter: 'mock', model: 'test/writer:free', costPerRunUsd: 0, dailyAttemptCap: 1 } },
    judgeUrl: FREE_MODEL_URL, judgeModel: 'test/planner:free', judgeApiKey: 'test-credential', auditModel: 'test/reviewer:free',
    verifyCommand: 'node -e "require(\'node:assert/strict\').equal(require(\'./value.cjs\'), 2)"',
  })
  const engine: Engine = { id: 'oc-worker', preflight: vi.fn(async () => ({ ok: true, detail: 'offline worker' })), run: vi.fn(async job => {
    const baseCommitHash = git(job.projectPath, 'rev-parse', 'HEAD')
    writeFileSync(join(job.projectPath, 'value.cjs'), 'module.exports = 2\n'); git(job.projectPath, 'add', 'value.cjs'); git(job.projectPath, 'commit', '-m', 'fix value')
    return { ok: true, costUsd: 0, output: 'Changed value to 2', commitHash: git(job.projectPath, 'rev-parse', 'HEAD'), baseCommitHash }
  }) }
  let available = false, reject = false, blockAll = false
  const fetch = vi.fn(async (url, init) => {
    if (url === FREE_MODEL_CATALOG) return new Response(JSON.stringify({ data: [cfg.judgeModel, cfg.auditModel, ...(cfg.freeReviewFallbacks ?? [])].map(id => ({ id, pricing: { prompt: '0', completion: '0' } })) }))
    const model = JSON.parse(String(init?.body)).model
    if (!available && (model === cfg.auditModel || blockAll && model !== cfg.judgeModel)) return new Response('', { status: 429, headers: { 'retry-after': model === cfg.auditModel ? '60' : '15' } })
    return new Response(JSON.stringify({ model, choices: [{ message: { content: model === cfg.judgeModel ? 'MATCH' : reject ? 'REVIEW: REJECT broken candidate' : 'REVIEW: PASS' } }], usage: { cost: 0 } }))
  }) as typeof globalThis.fetch
  vi.stubGlobal('fetch', fetch)
  const verifier = new KernelVerifier({ cfg, reviewRun: args => reviewDiff({ ...reviewLlmFromConfig(cfg), onModel: args.onModel }, args.diff, args.taskText) })
  const db = new RunDb(join(dataDir, 'run.db')), team = new TeamState(project)
  const deps: Deps = { cfg, db, team, store: new BacklogStore(backlogFile), events: new EventLog(dataDir), engines: { resolve: vi.fn(() => engine) }, verifier, evidence: new EvidenceStore(dataDir) }
  return { deps, engine, fetch, blockAll: () => { blockAll = true }, allowBackup: () => { blockAll = false }, available: () => { available = true }, unavailable: () => { available = false }, reject: () => { available = true; reject = true } }
}

test('all free reviewers deferred: reopened scheduler merges through the recovered backup without rerunning the worker', async () => {
  const f = fixture(), d = f.deps, backup = 'test/backup:free'
  d.cfg.freeReviewFallbacks = [backup]; f.blockAll()
  try {
    expect(await runOnce(d)).toBe('deferred')
    const task = d.store.read()[0]!, pending = readPendingReview(d.cfg, task)!
    expect(pending.retryAt - Date.now()).toBeLessThanOrEqual(15_000)
    expect(baseAlertMessage('deferred', d.cfg)).toContain(pending.candidateHead.slice(0, 12))
    expect(baseAlertMessage('deferred', d.cfg)).toContain(new Date(pending.retryAt).toISOString())
    const count = vi.mocked(f.fetch).mock.calls.length
    expect(await runOnce(d)).toBe('deferred'); expect(f.fetch).toHaveBeenCalledTimes(count)
    d.db.close(); d.team!.close(); d.db = new RunDb(join(d.cfg.dataDir, 'run.db')); d.team = new TeamState(d.cfg.projectPath)
    f.allowBackup(); vi.spyOn(Date, 'now').mockReturnValue(pending.retryAt + 1000)
    expect(await runOnce(d)).toBe('done')
    expect(f.engine.run).toHaveBeenCalledTimes(1); expect(f.engine.preflight).toHaveBeenCalledTimes(1); expect(d.engines.resolve).toHaveBeenCalledTimes(1)
    expect(d.team.attemptsToday('oc-worker')).toBe(1); expect(d.db.taskFailCount(task.id)).toBe(0)
    expect(git(d.cfg.projectPath, 'rev-parse', 'HEAD')).toBe(pending.candidateHead)
    expect(d.evidence!.verifiedTaskCommit(task.id, task.text)).toBe(pending.candidateHead)
    const bundles = readdirSync(join(d.cfg.dataDir, 'evidence')).filter(file => file.endsWith('.json')).map(file => JSON.parse(readFileSync(join(d.cfg.dataDir, 'evidence', file), 'utf8')))
    const receipt = bundles.find(bundle => bundle.verdict === 'ready' && bundle.candidateCommit === pending.candidateHead)
    expect(receipt.gates.reviewer).toMatchObject({ status: 'pass', identity: `review:${backup}` })
    expect(reviewRetryDelay(d.cfg, 1000, true)).toBe(1000) // A completed fallback review must not stall the next task on the first model's cooldown.
    expect(reviewRetryDelay(d.cfg, 1000)).toBeGreaterThan(1000) // A GOAL audit that is still waiting retains its cooldown.
    expect(baseAlertMessage('deferred', d.cfg)).toContain('尚無已保存的待審候選')
  } finally { d.db.close(); d.team?.close() }
}, 30_000)

test('quota wait survives reopen: CI proof/candidate retained, one worker admission, no repeat preflight or worker', async () => {
  const f = fixture(), d = f.deps, base = git(d.cfg.projectPath, 'rev-parse', 'HEAD')
  try {
    expect(await runOnce(d)).toBe('deferred')
    const task = d.store.read()[0]!, pending = readPendingReview(d.cfg, task)!
    expect(pending.verification).toMatchObject({ candidateCommit: pending.candidateHead, ci: { status: 'pass', executed: true, exitCode: 0 }, reviewer: { status: 'blocked' } })
    expect(git(d.cfg.projectPath, 'rev-parse', 'HEAD')).toBe(base)
    expect(task.status).toBe('open'); expect(d.db.taskFailCount(task.id)).toBe(0)
    expect(reviewRetryDelay(d.cfg)).toBeLessThanOrEqual(60_000)
    const planner = vi.fn(async () => { throw new Error('Must resume review before planning') })
    expect(await runGoalSession({ goalId: 'resume', goal: { objective: task.text, noProgressLimit: 2 }, cwd: d.cfg.projectPath, kernelDeps: d,
      planFn: planner, evalFn: async () => ({ achieved: false, score: 0, detail: '' }), runOnceFn: runOnce, isAlive: () => true })).toMatchObject({ kind: 'stuck', retryable: true })
    expect(planner).not.toHaveBeenCalled()
    const calls = vi.mocked(f.fetch).mock.calls.length
    expect(await runOnce(d)).toBe('deferred'); expect(f.fetch).toHaveBeenCalledTimes(calls)
    d.db.close(); d.team!.close()
    d.db = new RunDb(join(d.cfg.dataDir, 'run.db')); d.team = new TeamState(d.cfg.projectPath)
    f.available(); vi.spyOn(Date, 'now').mockReturnValue(pending.retryAt + 1000)
    expect(await runOnce(d)).toBe('done')
    expect(f.engine.run).toHaveBeenCalledTimes(1); expect(f.engine.preflight).toHaveBeenCalledTimes(1); expect(d.engines.resolve).toHaveBeenCalledTimes(1)
    expect(d.team.attemptsToday('oc-worker')).toBe(1)
    expect(git(d.cfg.projectPath, 'rev-parse', 'HEAD')).toBe(pending.candidateHead)
    expect(d.evidence!.verifiedTaskCommit(task.id, task.text)).toBe(pending.candidateHead)
    expect(JSON.parse(readFileSync(pendingReviewFile(d.cfg, task), 'utf8')).phase).toBe('closed')
  } finally { d.db.close(); d.team?.close() }
}, 30_000)

test('changed candidate after restart is quarantined without worker, model request or merge', async () => {
  const f = fixture(), d = f.deps
  try {
    expect(await runOnce(d)).toBe('deferred')
    const task = d.store.read()[0]!, pending = readPendingReview(d.cfg, task)!, calls = vi.mocked(f.fetch).mock.calls.length
    writeFileSync(join(pending.wt.cwd, 'value.cjs'), 'module.exports = 999\n')
    expect(await runOnce(d)).toMatchObject({ kind: 'blocked', reason: 'team-state-quarantined' })
    expect(f.engine.run).toHaveBeenCalledTimes(1); expect(f.fetch).toHaveBeenCalledTimes(calls)
    expect(readFileSync(join(pending.wt.cwd, 'value.cjs'), 'utf8')).toContain('999')
  } finally { d.db.close(); d.team?.close() }
}, 30_000)

test('an independent rejection after waiting still blocks the merge and counts a task failure', async () => {
  const f = fixture(), d = f.deps, base = git(d.cfg.projectPath, 'rev-parse', 'HEAD')
  try {
    expect(await runOnce(d)).toBe('deferred')
    const task = d.store.read()[0]!, pending = readPendingReview(d.cfg, task)!
    f.reject(); vi.spyOn(Date, 'now').mockReturnValue(pending.retryAt + 1000)
    expect(await runOnce(d)).toBe('failed')
    expect(f.engine.run).toHaveBeenCalledTimes(1); expect(d.db.taskFailCount(task.id)).toBe(1)
    expect(git(d.cfg.projectPath, 'rev-parse', 'HEAD')).toBe(base)
    expect(JSON.parse(readFileSync(pendingReviewFile(d.cfg, task), 'utf8')).phase).toBe('closed')
  } finally { d.db.close(); d.team?.close() }
}, 30_000)

test('free-only low-risk candidates cannot pass without a verifier or with a missing judge', async () => {
  const f = fixture(), d = f.deps
  try {
    d.verifier = undefined
    expect(await runOnce(d)).toMatchObject({ kind: 'blocked', reason: 'verification-infra' })
    expect(git(d.cfg.projectPath, 'show', 'HEAD:value.cjs')).toContain('1')
  } finally { d.db.close(); d.team?.close() }
}, 30_000)

test('rebase review quota wait resumes the exact candidate after restart without another worker', async () => {
  const f = fixture(), d = f.deps, verifier = d.verifier!
  let checks = 0, originalCandidate = '', current = ''
  f.available()
  d.verifier = { check: async (job, result) => {
    const check = await verifier.check(job, result)
    if (++checks === 1) {
      expect(check.pass).toBe(true); originalCandidate = result.commitHash!
      writeFileSync(join(d.cfg.projectPath, 'other.txt'), 'main advanced\n'); git(d.cfg.projectPath, 'add', '.'); git(d.cfg.projectPath, 'commit', '-m', 'advance main')
      current = git(d.cfg.projectPath, 'rev-parse', 'HEAD'); f.unavailable()
    }
    return check
  } }
  try {
    expect(await runOnce(d)).toBe('deferred')
    const task = d.store.read()[0]!, pending = readPendingReview(d.cfg, task)!
    expect(checks).toBe(2); expect(pending.retryAt).toBeGreaterThan(Date.now())
    expect(pending.candidateHead).not.toBe(originalCandidate); expect(pending.result.baseCommitHash).toBe(current)
    expect(git(d.cfg.projectPath, 'rev-parse', 'HEAD')).toBe(current)
    expect(git(pending.wt.cwd, 'show', 'HEAD:value.cjs')).toContain('2')
    expect(d.db.taskFailCount(task.id)).toBe(0)
    d.db.close(); d.team!.close()
    d.db = new RunDb(join(d.cfg.dataDir, 'run.db')); d.team = new TeamState(d.cfg.projectPath)
    f.available(); vi.spyOn(Date, 'now').mockReturnValue(pending.retryAt + 1000)
    expect(await runOnce(d)).toBe('done'); expect(checks).toBe(3)
    expect(f.engine.run).toHaveBeenCalledTimes(1); expect(d.engines.resolve).toHaveBeenCalledTimes(1)
    expect(d.team.attemptsToday('oc-worker')).toBe(1)
    expect(git(d.cfg.projectPath, 'rev-parse', 'HEAD')).toBe(pending.candidateHead)
    expect(d.evidence!.verifiedTaskCommit(task.id, task.text)).toBe(pending.candidateHead)
  } finally { d.db.close(); d.team?.close() }
}, 30_000)
