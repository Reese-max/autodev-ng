import { describe, expect, test } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  LongHorizonBackend,
  classifyStepRisk,
  deterministicManager,
  engineEscalation,
  engineExecutor,
  listRuns,
  llmManager,
  makeExecutionBackend,
  mechanicalAuditor,
  runDir,
  summarizeRuns,
} from '../src/backends/long-horizon.js'
import {
  BoundedStepSchema,
  type AuditorFn,
  type ExecutorFn,
  type InterruptInstruction,
  type ManagerBundle,
  type ManagerFn,
  type RunEvidence,
  type RunState,
} from '../src/backends/types.js'
import { MockEngine } from '../src/engines/mock.js'
import type { LlmResult } from '../src/autopilot/llm.js'
import { ConfigSchema } from '../src/types.js'
import type { VerifyOutcome } from '../src/engines/run-verify.js'

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'adng-lh-'))
  const project = join(root, 'project')
  const dataDir = join(root, 'data')
  mkdirSync(project, { recursive: true })
  mkdirSync(dataDir, { recursive: true })
  return { root, project, dataDir, cleanup: () => rmSync(root, { recursive: true, force: true }) }
}

const GOAL = { objective: 'implement the feature', verifyCommand: 'node check.mjs' }
const okExec = (output = 'done'): ExecutorFn => async () => ({ ok: true, output, costUsd: 0.01 })
const passAudit: AuditorFn = async () => ({ outcome: 'verified', detail: 'verify pass', verifyStatus: 'pass', gitSha: 'a'.repeat(40), goalAchieved: true })
const rejectAudit = (detail: string): AuditorFn => async () => ({ outcome: 'rejected', detail, verifyStatus: 'fail', gitSha: 'b'.repeat(40) })
/** Mirror the real auditor's contract: executor failure can never be verified. */
const gateAudit: AuditorFn = async req => req.exec.ok
  ? passAudit(req)
  : rejectAudit(req.exec.failureReason ?? 'exec failed')(req)

function readState(dataDir: string, runId: string): RunState {
  return JSON.parse(readFileSync(join(runDir(dataDir, runId), 'state.json'), 'utf8')) as RunState
}

function backend(dataDir: string, overrides: Partial<ConstructorParameters<typeof LongHorizonBackend>[0]> = {}): LongHorizonBackend {
  return new LongHorizonBackend({ dataDir, executor: okExec(), auditor: passAudit, ...overrides })
}

describe('ExecutionBackend contract', () => {
  test('LongHorizonBackend exposes the pluggable backend interface', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      const b = backend(dataDir)
      expect(b.id).toBe('long-horizon')
      for (const method of ['start', 'resume', 'status', 'interrupt', 'collectEvidence'] as const) {
        expect(typeof b[method], method).toBe('function')
      }
      const handle = await b.start(GOAL, { cwd: project })
      expect(handle.runId).toMatch(/^[A-Za-z0-9][A-Za-z0-9_-]*$/)
      expect(typeof handle.done.then).toBe('function')
      await handle.done
    } finally {
      cleanup()
    }
  })
})

describe('verified progress vs executor claims', () => {
  test('executor step + auditor verify pass → complete; checkpoint links git sha and verify evidence', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      const b = backend(dataDir)
      const handle = await b.start(GOAL, { cwd: project })
      const snap = await handle.done
      expect(snap.phase).toBe('complete')
      const state = readState(dataDir, handle.runId)
      expect(state.verifiedSteps).toHaveLength(1)
      expect(state.phase).toBe('complete')
      const dir = runDir(dataDir, handle.runId)
      const checkpoints = readdirSync(join(dir, 'checkpoints'))
      expect(checkpoints).toHaveLength(1)
      const checkpoint = JSON.parse(readFileSync(join(dir, 'checkpoints', checkpoints[0]!), 'utf8'))
      expect(checkpoint.gitSha).toBe('a'.repeat(40))
      expect(checkpoint.verifyStatus).toBe('pass')
      expect(existsSync(join(dir, 'metrics.json'))).toBe(true)
      const metrics = JSON.parse(readFileSync(join(dir, 'metrics.json'), 'utf8'))
      expect(metrics.verifiedSteps).toBe(1)
      expect(metrics.completed).toBe(true)
      // terminal phase：不帶 parkedAt／parkedMs（否則 wall-clock 彙總會無限膨脹）
      expect(state.metrics.parkedAt).toBeUndefined()
      expect(metrics.parkedMs).toBe(0)
      expect(typeof metrics.endedAt).toBe('string')
    } finally {
      cleanup()
    }
  })

  test('executor ok:true is not completion — auditor rejection yields no verified progress and blocks at the fingerprint cap', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      let calls = 0
      const b = backend(dataDir, {
        executor: async () => { calls++; return { ok: true, output: 'all done', costUsd: 0.01 } },
        auditor: rejectAudit('verify fail: tests red'),
        maxSameFingerprint: 2,
      })
      const handle = await b.start(GOAL, { cwd: project })
      const snap = await handle.done
      expect(snap.phase).toBe('blocked')
      expect(calls).toBe(2)
      const state = readState(dataDir, handle.runId)
      expect(state.verifiedSteps).toHaveLength(0)
      expect(state.metrics.falseCompletionClaims).toBe(2)
      expect(state.metrics.rejectedAttempts).toBe(2)
      const fingerprints = Object.keys(state.failures)
      expect(fingerprints).toHaveLength(1)
      expect(state.failures[fingerprints[0]!]!.count).toBe(2)
      // rejected attempts are evidence, never progress
      const attempts = readFileSync(join(runDir(dataDir, handle.runId), 'attempts.jsonl'), 'utf8').trim().split('\n')
      expect(attempts).toHaveLength(2)
      for (const line of attempts) expect(JSON.parse(line).outcome).toBe('rejected')
      expect(readdirSync(join(runDir(dataDir, handle.runId), 'evidence')).length).toBe(2)
    } finally {
      cleanup()
    }
  })

  test('manager done-claim still requires auditor verification (no self-declared completion)', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      const manager: ManagerFn = async () => ({ plan: { kind: 'done' } })
      let execCalls = 0
      const b = backend(dataDir, {
        manager,
        executor: async () => { execCalls++; return { ok: true, output: '', costUsd: 0 } },
        auditor: rejectAudit('verify exit=1'),
        maxSameFingerprint: 2,
      })
      const handle = await b.start(GOAL, { cwd: project })
      const snap = await handle.done
      expect(snap.phase).toBe('blocked')
      expect(execCalls).toBe(0)
      const state = readState(dataDir, handle.runId)
      expect(state.metrics.falseCompletionClaims).toBe(2)
      expect(Object.keys(state.failures).some(f => f.startsWith('claim:'))).toBe(true)
    } finally {
      cleanup()
    }
  })
})

describe('fresh bounded context', () => {
  test('every executor round receives a freshly assembled prompt carrying goal, verified progress and failure evidence', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      const prompts: string[] = []
      const auditor: AuditorFn = async ({ round }) => round < 2
        ? { outcome: 'rejected', detail: 'boom-42 signature failure', verifyStatus: 'fail' }
        : { outcome: 'verified', detail: 'pass', verifyStatus: 'pass', gitSha: 'c'.repeat(40), goalAchieved: true }
      const b = backend(dataDir, {
        executor: async req => { prompts.push(req.prompt); return { ok: true, output: '', costUsd: 0 } },
        auditor,
      })
      const handle = await b.start(GOAL, { cwd: project })
      await handle.done
      expect(prompts).toHaveLength(2)
      expect(prompts[0]).toContain(GOAL.objective)
      expect(prompts[0]).not.toContain('boom-42')
      expect(prompts[1]).toContain('boom-42 signature failure')
      expect(prompts[1]).toContain(GOAL.objective)
    } finally {
      cleanup()
    }
  })
})

describe('approval gate', () => {
  test('model-controlled verifyCommand is rejected before executor or host verification', async () => {
    const { project, dataDir, cleanup } = fixture()
    const injectedStep = { text: 'inspect service status', risk: 'low', verifyCommand: 'high-risk sentinel' }
    expect(BoundedStepSchema.safeParse(injectedStep).success).toBe(false)
    const execCalls: string[] = []
    const verifyCalls: string[] = []
    const auditor = mechanicalAuditor({
      runVerifyFn: (async ({ command }: { command?: string }) => {
        verifyCalls.push(command ?? '')
        return { status: 'pass', detail: 'spy pass', executed: true, exitCode: 0 }
      }) as never,
      gitHead: () => undefined,
    })
    const executor: ExecutorFn = async req => {
      execCalls.push(req.step.text)
      return { ok: true, output: '', costUsd: 0 }
    }
    try {
      const modelManager = llmManager(
        { apiKey: 'k', model: 'm' } as never,
        (async () => ({ text: JSON.stringify({ kind: 'step', step: injectedStep }), totalTokens: 1 })) as never,
      )
      const modelRun = await backend(dataDir, { manager: modelManager, executor, auditor })
        .start({ objective: 'routine maintenance' }, { cwd: project })
      expect((await modelRun.done).phase).toBe('blocked')
      expect(execCalls).toEqual([])
      expect(verifyCalls).toEqual([])

      // Also fail closed if a custom Manager bypasses the LLM schema at runtime.
      const forgedManager: ManagerFn = async () => ({
        plan: { kind: 'step', step: injectedStep as never },
      })
      const forgedRun = await backend(dataDir, { manager: forgedManager, executor, auditor })
        .start({ objective: 'routine maintenance' }, { cwd: project })
      expect((await forgedRun.done).phase).toBe('blocked')
      expect(execCalls).toEqual([])
      expect(verifyCalls).toEqual([])

      // The Auditor itself only accepts the trusted goal/config command.
      const directVerdict = await auditor({
        runId: 'auditor-direct', goal: { objective: 'routine maintenance' }, round: 1,
        step: injectedStep as never, exec: { ok: true, output: '', costUsd: 0 }, cwd: project, claim: false,
      })
      expect(directVerdict.outcome).toBe('rejected')
      expect(verifyCalls).toEqual([])
    } finally {
      cleanup()
    }
  })

  test('high-risk step parks at needs-approval and never reaches the executor until approved + resumed', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      const execCalls: string[] = []
      const manager: ManagerFn = async () => ({ plan: { kind: 'step', step: { text: 'rotate production secrets', risk: 'high' } } })
      const b = backend(dataDir, {
        manager,
        executor: async req => { execCalls.push(req.step.text); return { ok: true, output: '', costUsd: 0 } },
      })
      const handle = await b.start({ objective: 'routine maintenance', verifyCommand: 'x' }, { cwd: project })
      const snap = await handle.done
      expect(snap.phase).toBe('needs-approval')
      expect(execCalls).toHaveLength(0)
      expect(snap.pendingApproval?.step).toContain('secrets')

      // approve is recorded but the step still does not run until resume
      const approved = await b.interrupt(handle.runId, { kind: 'approve', by: 'ops' } satisfies InterruptInstruction)
      expect(approved.phase).toBe('needs-approval')
      expect(approved.pendingApproval?.approved).toBe(true)
      expect(execCalls).toHaveLength(0)

      const resumed = await b.resume(handle.runId)
      const final = await resumed.done
      expect(execCalls).toEqual(['rotate production secrets'])
      expect(final.phase).toBe('complete')
      const state = readState(dataDir, handle.runId)
      expect(state.metrics.interventions).toBe(1)
      expect(state.pendingApproval).toBeUndefined()
      // gated step burns exactly one round (gate bookkeeping is not a round)
      expect(state.rounds).toBe(1)
    } finally {
      cleanup()
    }
  })

  test('keyword classifier marks deployment/migration/secret steps high-risk even without an explicit tag', () => {
    expect(classifyStepRisk({ text: 'deploy to production' })).toBe('high')
    expect(classifyStepRisk({ text: 'run destructive data migration' })).toBe('high')
    expect(classifyStepRisk({ text: 'rotate api credential' })).toBe('high')
    expect(classifyStepRisk({ text: 'update readme typo' })).toBe('low')
    expect(classifyStepRisk({ text: 'update readme typo', risk: 'high' })).toBe('high')
  })
})

describe('interrupt / resume / recovery', () => {
  test('pause file interrupts a live run at the round boundary; resume continues to completion', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      let b2: LongHorizonBackend
      let paused = false
      const executor: ExecutorFn = async () => {
        if (!paused) {
          paused = true
          const runId = readdirSync(join(dataDir, 'runs'))[0]!
          await b2.interrupt(runId, { kind: 'pause', note: 'operator lunch' })
        }
        return { ok: true, output: '', costUsd: 0 }
      }
      b2 = new LongHorizonBackend({ dataDir, executor, auditor: rejectAudit('still red') })
      const handle = await b2.start(GOAL, { cwd: project })
      const snap = await handle.done
      expect(snap.phase).toBe('interrupted')
      const state = readState(dataDir, handle.runId)
      expect(state.metrics.interventions).toBe(1)

      const resumed = await b2.resume(handle.runId)
      const final = await resumed.done
      // executor keeps failing with the same fingerprint → bounded, ends blocked
      expect(final.phase).toBe('blocked')
      expect(readState(dataDir, handle.runId).metrics.resumes).toBe(1)
    } finally {
      cleanup()
    }
  })

  test('abort against a live driver parks the run as cancelled (terminal), not interrupted', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      let b2: LongHorizonBackend
      // auditor verifies partial progress but never declares the goal achieved,
      // so the loop reaches the next boundary where the abort sentinel lands.
      const auditor: AuditorFn = async () => ({
        outcome: 'verified', detail: 'partial progress', verifyStatus: 'pass',
        gitSha: 'c'.repeat(40), goalAchieved: false,
      })
      b2 = new LongHorizonBackend({
        dataDir,
        executor: async () => {
          const runId = readdirSync(join(dataDir, 'runs'))[0]!
          await b2.interrupt(runId, { kind: 'abort', by: 'ops' })
          return { ok: true, output: '', costUsd: 0 }
        },
        auditor,
      })
      const handle = await b2.start(GOAL, { cwd: project })
      const snap = await handle.done
      expect(snap.phase).toBe('cancelled')
      expect(readState(dataDir, handle.runId).metrics.interventions).toBe(1)
      await expect(b2.resume(handle.runId)).rejects.toThrow()
    } finally {
      cleanup()
    }
  })

  test('pause on a parked run applies without a stale sentinel: resume keeps driving', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      const manager: ManagerFn = async () => ({ plan: { kind: 'step', step: { text: 'rotate production secrets', risk: 'high' } } })
      const b = new LongHorizonBackend({ dataDir, manager, executor: okExec(), auditor: passAudit })
      const handle = await b.start({ objective: 'maintenance', verifyCommand: 'x' }, { cwd: project })
      expect((await handle.done).phase).toBe('needs-approval')

      // pause while parked (no driver) → interrupted directly; no interrupt.json must linger
      const paused = await b.interrupt(handle.runId, { kind: 'pause', by: 'ops' })
      expect(paused.phase).toBe('interrupted')
      expect(existsSync(join(runDir(dataDir, handle.runId), 'interrupt.json'))).toBe(false)

      // resume must reach the approval gate again, not be re-parked by a stale file
      const resumed = await b.resume(handle.runId)
      expect((await resumed.done).phase).toBe('needs-approval')

      // approve → resume → completes
      await b.interrupt(handle.runId, { kind: 'approve', by: 'ops' })
      const done = await (await b.resume(handle.runId)).done
      expect(done.phase).toBe('complete')
    } finally {
      cleanup()
    }
  })

  test('resume after blocked retries and recovery success is counted once verified progress lands', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      let phase: 'fail' | 'pass' = 'fail'
      const b = new LongHorizonBackend({
        dataDir,
        executor: async () => phase === 'fail'
          ? { ok: false, output: '', costUsd: 0, failureReason: 'provider timeout' }
          : { ok: true, output: '', costUsd: 0 },
        auditor: gateAudit,
        maxSameFingerprint: 2,
      })
      const handle = await b.start(GOAL, { cwd: project })
      expect((await handle.done).phase).toBe('blocked')
      phase = 'pass'
      const resumed = await b.resume(handle.runId)
      const final = await resumed.done
      expect(final.phase).toBe('complete')
      const metrics = readState(dataDir, handle.runId).metrics
      expect(metrics.resumes).toBe(1)
      expect(metrics.recoverySuccesses).toBe(1)
    } finally {
      cleanup()
    }
  })

  test('abort parks the run as cancelled and resume refuses terminal runs', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      const b = backend(dataDir, { auditor: rejectAudit('nope'), maxSameFingerprint: 5 })
      // park at needs-approval via manager high-risk step so abort lands on a non-terminal run
      const manager: ManagerFn = async () => ({ plan: { kind: 'step', step: { text: 'deploy to production', risk: 'high' } } })
      const b2 = new LongHorizonBackend({ dataDir, manager, executor: okExec(), auditor: passAudit })
      const handle = await b2.start(GOAL, { cwd: project })
      expect((await handle.done).phase).toBe('needs-approval')
      const snap = await b2.interrupt(handle.runId, { kind: 'abort', by: 'ops' })
      expect(snap.phase).toBe('cancelled')
      await expect(b2.resume(handle.runId)).rejects.toThrow()
      await expect(b2.status(handle.runId)).resolves.toMatchObject({ phase: 'cancelled' })
    } finally {
      cleanup()
    }
  })
})

describe('failure fingerprint / escalation', () => {
  test('identical fingerprints are capped; escalation receives fingerprint + evidence and can resume with a directive', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      const escalations: string[] = []
      const bundles: ManagerBundle[] = []
      const manager: ManagerFn = async bundle => { bundles.push(bundle); return { plan: { kind: 'step', step: { text: 'try thing' } } } }
      let fail = true
      const b = new LongHorizonBackend({
        dataDir,
        manager,
        executor: async () => fail ? { ok: false, output: '', costUsd: 0, failureReason: 'missing secret' } : { ok: true, output: '', costUsd: 0 },
        auditor: gateAudit,
        escalate: async req => {
          escalations.push(req.fingerprint)
          fail = false
          return { action: 'resume', directive: 'inject the secret first' }
        },
        maxSameFingerprint: 2,
      })
      const handle = await b.start(GOAL, { cwd: project })
      const snap = await handle.done
      expect(snap.phase).toBe('complete')
      expect(escalations).toHaveLength(1)
      expect(escalations[0]).toContain('missing secret')
      const state = readState(dataDir, handle.runId)
      expect(state.directives).toEqual(['inject the secret first'])
      expect(state.metrics.escalations).toBe(1)
      // the manager saw the escalation directive in a later bundle
      expect(bundles.some(bun => bun.directives.includes('inject the secret first'))).toBe(true)
    } finally {
      cleanup()
    }
  })

  test('without an escalation hook the same fingerprint parks the run as blocked', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      let calls = 0
      const b = new LongHorizonBackend({
        dataDir,
        executor: async () => { calls++; return { ok: false, output: '', costUsd: 0, failureReason: 'CI unavailable' } },
        auditor: gateAudit,
        maxSameFingerprint: 3,
      })
      const handle = await b.start(GOAL, { cwd: project })
      expect((await handle.done).phase).toBe('blocked')
      expect(calls).toBe(3)
    } finally {
      cleanup()
    }
  })
})

describe('status / evidence', () => {
  test('status and collectEvidence read persisted run state; unknown runs reject', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      const b = backend(dataDir)
      const handle = await b.start(GOAL, { cwd: project })
      await handle.done
      const snap = await b.status(handle.runId)
      expect(snap).toMatchObject({ runId: handle.runId, backend: 'long-horizon', phase: 'complete', verifiedSteps: 1 })
      const evidence: RunEvidence = await b.collectEvidence(handle.runId)
      expect(evidence.state.runId).toBe(handle.runId)
      expect(evidence.attempts.length).toBe(1)
      expect(evidence.attempts[0]!.outcome).toBe('verified')
      expect(evidence.checkpoints.length).toBe(1)
      await expect(b.status('missing-run')).rejects.toThrow()
      await expect(b.collectEvidence('missing-run')).rejects.toThrow()
      expect(listRuns(dataDir).map(r => r.runId)).toContain(handle.runId)
    } finally {
      cleanup()
    }
  })

  test('run id must be filesystem-safe', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      const b = backend(dataDir)
      await expect(b.start(GOAL, { cwd: project, runId: '../escape' })).rejects.toThrow()
      await expect(b.start(GOAL, { cwd: project, runId: 'ok-run_1' })).resolves.toBeTruthy()
    } finally {
      cleanup()
    }
  })
})

describe('role adapters', () => {
  test('deterministicManager proposes the goal objective as the next bounded step', async () => {
    const plan = await deterministicManager()({ goal: GOAL, round: 1, verifiedSteps: [], failures: [], directives: [] })
    expect(plan.plan.kind).toBe('step')
    if (plan.plan.kind === 'step') expect(plan.plan.step.text).toContain(GOAL.objective)
  })

  test('llmManager parses structured JSON plans and reports token usage; unparseable output degrades to the deterministic step', async () => {
    const seen: string[] = []
    const callFn = async (_opts: unknown, prompt: string): Promise<LlmResult> => {
      seen.push(prompt)
      return { text: '{"kind":"step","step":{"text":"patch the parser","risk":"low"}}', totalTokens: 42 }
    }
    const manager = llmManager({ apiKey: 'k', model: 'm' } as never, callFn as never)
    const res = await manager({ goal: GOAL, round: 3, verifiedSteps: [], failures: [], directives: [] })
    expect(res.plan).toEqual({ kind: 'step', step: { text: 'patch the parser', risk: 'low' } })
    expect(res.usage?.tokensIn).toBe(42)
    expect(seen[0]).toContain(GOAL.objective)

    const degraded = llmManager({ apiKey: 'k', model: 'm' } as never, (async () => ({ text: 'not json', totalTokens: 1 })) as never)
    const res2 = await degraded({ goal: GOAL, round: 1, verifiedSteps: [], failures: [], directives: [] })
    expect(res2.plan.kind).toBe('step')
  })

  test('mechanicalAuditor never trusts exec.ok: verify fail/blocked/missing all reject, executor failure skips verify', async () => {
    const calls: string[] = []
    const verify = async (opts: { command?: string }): Promise<VerifyOutcome> => {
      calls.push(opts.command ?? '')
      return { status: 'fail', detail: 'red', executed: true, exitCode: 1 }
    }
    const auditor = mechanicalAuditor({ runVerifyFn: verify as never, gitHead: () => 'f'.repeat(40), timeoutMs: 1000 })
    const exec = { ok: true, output: '', costUsd: 0 }
    const fail = await auditor({ runId: 'r', goal: GOAL, round: 1, step: { text: 's' }, exec, cwd: '/tmp', claim: false })
    expect(fail.outcome).toBe('rejected')
    expect(fail.verifyStatus).toBe('fail')
    expect(fail.gitSha).toBe('f'.repeat(40))

    const noCmd = await auditor({ runId: 'r', goal: { objective: 'x' }, round: 1, step: { text: 's' }, exec, cwd: '/tmp', claim: false })
    expect(noCmd.outcome).toBe('rejected')

    const execFail = await auditor({ runId: 'r', goal: GOAL, round: 1, step: { text: 's' }, exec: { ok: false, output: '', costUsd: 0, failureReason: 'spawn died' }, cwd: '/tmp', claim: false })
    expect(execFail.outcome).toBe('rejected')
    // executor failure short-circuits: verify never ran for the exec-fail or no-command cases
    expect(calls).toEqual(['node check.mjs'])

    const blockedVerify = mechanicalAuditor({
      runVerifyFn: (async () => ({ status: 'blocked', detail: 'verify infra failure（command-not-found）', executed: false, exitCode: null })) as never,
      gitHead: () => undefined, timeoutMs: 1000,
    })
    const blocked = await blockedVerify({ runId: 'r', goal: GOAL, round: 1, step: { text: 's' }, exec, cwd: '/tmp', claim: false })
    expect(blocked.outcome).toBe('blocked')
  })

  test('engineExecutor wraps an Engine and passes only the bounded prompt as the task', async () => {
    const engine = new MockEngine([{ ok: true }])
    const exec = engineExecutor(() => engine)
    const out = await exec({ runId: 'run-ab12', round: 2, step: { text: 'step' }, prompt: 'BOUNDED PROMPT', cwd: '/tmp' })
    expect(out.ok).toBe(true)
    expect(out.commitHash).toBe('mock0000')
    expect(engine.calls).toHaveLength(1)
    expect(engine.calls[0]!.task.text).toBe('BOUNDED PROMPT')
    expect(engine.calls[0]!.projectPath).toBe('/tmp')
  })

  test('engineEscalation routes the fingerprint evidence through a resolved engine', async () => {
    const engine = new MockEngine([{ ok: true }])
    const escalate = engineEscalation(() => engine)
    const res = await escalate({ runId: 'r', goal: GOAL, fingerprint: 'exec:missing secret', count: 2, lastDetail: 'missing secret', failures: [], cwd: '/tmp' })
    expect(res.action).toBe('resume')
    expect(engine.calls[0]!.task.text).toContain('missing secret')
    const failEngine = new MockEngine([{ ok: false, reason: 'herdr down' }])
    const res2 = await engineEscalation(() => failEngine)({ runId: 'r', goal: GOAL, fingerprint: 'x', count: 2, lastDetail: 'd', failures: [], cwd: '/tmp' })
    expect(res2.action).toBe('blocked')
  })
})

describe('config wiring', () => {
  test('executionBackend block keeps the three roles independently configurable', () => {
    const cfg = ConfigSchema.parse({
      projectPath: './p', backlogFile: './p/B.md', dataDir: './d',
      engines: { mock1: { adapter: 'mock' }, esc: { adapter: 'mock' } },
      defaultEngine: 'mock1',
      executionBackend: {
        adapter: 'long-horizon', managerModel: 'manager-llm', auditorModel: 'auditor-llm',
        executorEngine: 'mock1', escalationEngine: 'esc', maxRounds: 7, maxSameFingerprint: 4,
      },
    })
    expect(cfg.executionBackend?.managerModel).toBe('manager-llm')
    expect(cfg.executionBackend?.auditorModel).toBe('auditor-llm')
    expect(cfg.executionBackend?.executorEngine).toBe('mock1')
    expect(cfg.executionBackend?.maxRounds).toBe(7)
  })

  test('unknown executor/escalation engine tags are rejected at schema and factory level', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      // schema-level：engines 白名單外的 tag 在 ConfigSchema.parse 就 fail-closed
      expect(() => ConfigSchema.parse({
        projectPath: project, backlogFile: join(project, 'B.md'), dataDir,
        engines: { mock1: { adapter: 'mock' } }, defaultEngine: 'mock1',
        executionBackend: { adapter: 'long-horizon', executorEngine: 'missing' },
      })).toThrow(/engines 白名單/)

      // factory-level：繞過 schema 組態（程式內組裝）仍被擋
      const cfg = ConfigSchema.parse({
        projectPath: project, backlogFile: join(project, 'B.md'), dataDir,
        engines: { mock1: { adapter: 'mock' } }, defaultEngine: 'mock1',
      })
      const forged = { ...cfg, executionBackend: { adapter: 'long-horizon' as const, executorEngine: 'missing', maxRounds: 10, maxSameFingerprint: 3 } }
      expect(() => makeExecutionBackend(forged)).toThrow(/missing/)

      const cfg2 = ConfigSchema.parse({
        projectPath: project, backlogFile: join(project, 'B.md'), dataDir,
        engines: { mock1: { adapter: 'mock' } }, defaultEngine: 'mock1',
        executionBackend: { adapter: 'long-horizon', executorEngine: 'mock1' },
      })
      const engine = new MockEngine([{ ok: true }])
      const b = makeExecutionBackend(cfg2, { resolve: () => engine })
      expect(b.id).toBe('long-horizon')
      const handle = await b.start({ objective: 'x', verifyCommand: 'node --version' }, { cwd: project })
      const snap = await handle.done
      expect(snap.phase).toBe('complete')
      expect(engine.calls).toHaveLength(1)
    } finally {
      cleanup()
    }
  })
})

describe('metrics', () => {
  test('summarizeRuns aggregates the pilot metrics for A/B comparison', async () => {
    const { project, dataDir, cleanup } = fixture()
    try {
      const b1 = backend(dataDir)
      const h1 = await b1.start(GOAL, { cwd: project, runId: 'run-one' })
      await h1.done
      const b2 = backend(dataDir, { auditor: rejectAudit('red'), maxSameFingerprint: 2 })
      const h2 = await b2.start(GOAL, { cwd: project, runId: 'run-two' })
      await h2.done
      const summary = summarizeRuns(dataDir)
      expect(summary.runs).toBe(2)
      expect(summary.completed).toBe(1)
      expect(summary.completionRate).toBe(0.5)
      expect(summary.averageRounds).toBeGreaterThan(0)
      expect(summary.rejectedAttempts).toBe(2)
      expect(summary.falseCompletionClaims).toBe(2)
      expect(summary.tokensIn).toBeGreaterThanOrEqual(0)
      expect(summary.costUsd).toBeGreaterThan(0)
      expect(summary.blockedMs + summary.activeMs).toBeGreaterThanOrEqual(0)
    } finally {
      cleanup()
    }
  })
})
