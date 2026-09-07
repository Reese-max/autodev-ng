import { llmFromConfig } from '../autopilot/llm.js'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import type { Config, Job, RunResult, TaskRisk } from '../types.js'
import { runVerify } from '../verify.js'
import { judgeCommit } from '../judge.js'
import { runReviewGate } from './review-gate.js'
import { defaultRollback, defaultGetDiff, defaultGetNameStatus, composeJudgeDiff, tail } from './verify-helpers.js'
import { classifyTaskRisk, reviewRequired, verifyRequired } from './risk-policy.js'
import type { VerificationEvidence } from './evidence-chain.js'

export interface VerifierCheck {
  pass: boolean
  risk?: TaskRisk
  reason?: string
  blockedReason?: 'verification-infra' | 'review-unavailable' | 'release-approval'
  paused?: boolean
  alerts: string[]
  evidence?: VerificationEvidence
}

export interface KernelVerifierOpts {
  cfg: Config
  rollback?: (cwd: string, toHash: string) => boolean
  getDiff?: (cwd: string, baseCommitHash?: string) => string
  getNameStatus?: (cwd: string, baseCommitHash?: string) => string
  judgeFetchFn?: typeof fetch
  reviewRun?: (args: { diff: string; taskText: string }) => Promise<string>
}

export class KernelVerifier {
  private readonly cfg: Config
  private readonly rollback: (cwd: string, toHash: string) => boolean
  private readonly getDiff: (cwd: string, baseCommitHash?: string) => string
  private readonly getNameStatus: (cwd: string, baseCommitHash?: string) => string
  private readonly judgeFetchFn?: typeof fetch
  private readonly reviewRun?: (args: { diff: string; taskText: string }) => Promise<string>

  constructor(opts: KernelVerifierOpts) {
    this.cfg = opts.cfg
    this.rollback = opts.rollback ?? defaultRollback
    this.getDiff = opts.getDiff ?? defaultGetDiff
    this.getNameStatus = opts.getNameStatus ?? defaultGetNameStatus
    this.judgeFetchFn = opts.judgeFetchFn
    this.reviewRun = opts.reviewRun
  }

  async check(job: Job, res: RunResult): Promise<VerifierCheck> {
    const alerts: string[] = []
    const diff = this.getDiff(job.projectPath, res.baseCommitHash)
    const nameStatus = this.getNameStatus(job.projectPath, res.baseCommitHash)
    const risk = classifyTaskRisk(this.cfg, job.task, nameStatus)
    const reviewerModel = this.cfg.reviewEngine ?? this.cfg.auditModel
    const vOut = await runVerify({ command: this.cfg.verifyCommand, cwd: job.projectPath, timeoutMs: this.cfg.verifyTimeoutMs })
    const evidence: VerificationEvidence = {
      candidateCommit: res.commitHash ?? 'unknown',
      ci: { status: vOut.status, command: this.cfg.verifyCommand, executed: vOut.executed, exitCode: vOut.exitCode, detail: vOut.detail },
      reviewer: { status: 'not-run', detail: 'review did not run' },
    }
    const done = (check: Omit<VerifierCheck, 'evidence'>): VerifierCheck => ({ ...check, evidence })
    if (vOut.status === 'fail') {
      if (!job.preserveOnReject) this.tryRollback(job.projectPath, res.baseCommitHash, alerts)
      return done({ pass: false, risk, reason: `verify-fail: ${vOut.detail}`, alerts })
    }
    if (vOut.status === 'blocked') return done({ pass: false, risk, blockedReason: 'verification-infra', reason: `verify-blocked: ${vOut.detail}`, alerts })
    if (vOut.status === 'skip') {
      if (verifyRequired(risk)) return done({ pass: false, risk, blockedReason: 'verification-infra', reason: `verify-blocked: ${risk} risk requires verifyCommand`, alerts })
      alerts.push(`verify-skip: ${vOut.detail}`)
    }
    if (existsSync(this.cfg.stopFile)) return done({ pass: false, risk, paused: true, reason: 'paused after CI', alerts })

    if (!res.baseCommitHash || !diff) {
      if (reviewRequired(risk)) {
        evidence.reviewer = { status: 'blocked', detail: 'no baseCommitHash/empty diff' }
        return done({ pass: false, risk, blockedReason: 'review-unavailable', reason: 'review-blocked: no baseCommitHash/empty diff', alerts })
      }
      alerts.push('judge-skipped: no baseCommitHash/empty diff')
      evidence.reviewer = { status: 'not-applicable', detail: 'low-risk task has no review evidence requirement' }
      return done({ pass: true, risk, alerts })
    }

    const jOut = await judgeCommit(
      { ...llmFromConfig(this.cfg, this.cfg.judgeModel, this.cfg.judgeUrl), fetchFn: this.judgeFetchFn },
      tail(res.output, 2000), composeJudgeDiff(nameStatus, diff),
    )
    if (jOut.verdict === 'MISMATCH') {
      if (!job.preserveOnReject) this.tryRollback(job.projectPath, res.baseCommitHash, alerts)
      return done({ pass: false, risk, reason: `judge-mismatch: ${jOut.detail}`, alerts })
    }
    if (jOut.verdict === 'SKIP') alerts.push(`judge-skip: ${jOut.detail}`)
    if (existsSync(this.cfg.stopFile)) return done({ pass: false, risk, paused: true, reason: 'paused before Reviewer', alerts })

    if (reviewRequired(risk) && !reviewerModel) {
      evidence.reviewer = { status: 'blocked', detail: `${risk} risk requires reviewEngine or auditModel` }
      return done({ pass: false, risk, blockedReason: 'review-unavailable', reason: `review-blocked: ${risk} risk requires reviewEngine or auditModel`, alerts })
    }
    if (reviewerModel) {
      const reviewerExecutionId = randomUUID()
      const rv = await runReviewGate(this.reviewRun, { diff, taskText: job.task.text })
      if (rv.kind === 'reject') {
        evidence.reviewer = { status: 'fail', identity: `review:${reviewerModel}`, executionId: reviewerExecutionId, detail: rv.reason }
        if (!job.preserveOnReject) this.tryRollback(job.projectPath, res.baseCommitHash, alerts)
        return done({ pass: false, risk, reason: `review-reject:${rv.reason}`, alerts })
      }
      if (rv.kind === 'skip' && reviewRequired(risk)) {
        evidence.reviewer = { status: 'blocked', identity: `review:${reviewerModel}`, executionId: reviewerExecutionId, detail: rv.alert }
        return done({ pass: false, risk, blockedReason: 'review-unavailable', reason: `review-blocked: ${rv.alert}`, alerts })
      }
      if (rv.kind === 'skip') {
        evidence.reviewer = { status: 'skip', identity: `review:${reviewerModel}`, executionId: reviewerExecutionId, detail: rv.alert }
        alerts.push(rv.alert)
      } else {
        evidence.reviewer = { status: 'pass', identity: `review:${reviewerModel}`, executionId: reviewerExecutionId, detail: 'review contract passed' }
      }
    } else evidence.reviewer = { status: 'not-applicable', detail: 'low-risk task has no review evidence requirement' }
    return done({ pass: true, risk, alerts })
  }

  private tryRollback(cwd: string, baseCommitHash: string | undefined, alerts: string[]): void {
    if (!baseCommitHash) return
    try {
      const ok = this.rollback(cwd, baseCommitHash)
      if (!ok) alerts.push(`rollback-failed: ${cwd}=>${baseCommitHash}`)
    } catch (err) { alerts.push(`rollback-exception: ${String(err).slice(0, 200)}`) }
  }
}
