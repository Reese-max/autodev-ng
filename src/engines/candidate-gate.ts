import type { Config, Job, RunResult, Task } from '../types.js'
import type { VerifierCheck } from '../verifier.js'
import { runVerify } from '../verify.js'
import { mergeBack, type MergeBackResult, type WorktreeHandle } from '../worktree.js'
import { defaultCommitHash } from './commit-hash.js'
import type { EvidenceReceipt, EvidenceStore } from './evidence-chain.js'
import { classifyTaskRisk, verifyRequired } from './risk-policy.js'
import { isTrustedHost } from './trusted-host.js'

export interface CandidateGateResult extends VerifierCheck { receipt?: EvidenceReceipt }

/** rebase 成功後仍在 merge queue 內驗收；只有非紅燈才允許唯一一次 merge 重試。 */
export async function mergeAfterRebaseVerify(
  cfg: Config, wt: WorktreeHandle, task: Task, result: RunResult,
  verifier: Parameters<typeof runCandidateGate>[0]['verifier'], evidence: EvidenceStore | undefined, executionId: string, writerIdentity: string,
): Promise<MergeBackResult> {
  const timeouts = { gitTimeoutMs: cfg.gitTimeoutMs, worktreeAddTimeoutMs: cfg.worktreeAddTimeoutMs }
  const first = mergeBack(cfg.projectPath, wt.branch, wt.baseBranch, wt.baseHead, wt.cwd, {
    ...timeouts,
    deferAfterRebase: true,
  })
  if (!first.rebased || first.failureStage !== 'verify') {
    return first
  }

  const risk = classifyTaskRisk(cfg, task)
  if (verifier || evidence || cfg.tierMode === 'free-only') {
    const baseCommitHash = defaultCommitHash(cfg.projectPath)
    const commitHash = defaultCommitHash(wt.cwd)
    if (!baseCommitHash || !commitHash) return { ...first, reason: 'verification-infra', failureStage: 'verify' }
    const gate = await runCandidateGate({
      cfg, task, cwd: wt.cwd, verifier, evidence, executionId, writerIdentity,
      result: { ...result, baseCommitHash, commitHash }, preserveOnReject: true,
    })
    if (!gate.pass) return { ...first, reason: gate.paused ? 'paused' : (gate.blockedReason ?? 'merge-conflict'), failureStage: 'verify', retryAt: gate.retryAt }
  } else {
    const verification = await runVerify({ command: cfg.verifyCommand, cwd: wt.cwd, timeoutMs: cfg.verifyTimeoutMs })
    if (verification.status === 'blocked' || (verification.status === 'skip' && verifyRequired(risk))) {
      return { ...first, reason: 'verification-infra', failureStage: 'verify' }
    }
    if (verification.status === 'fail') return { ...first, failureStage: 'verify' }
  }

  const merged = mergeBack(cfg.projectPath, wt.branch, wt.baseBranch, wt.baseHead, wt.cwd, {
    ...timeouts,
    allowRebase: false,
    rebaseAttempted: true,
  })
  return merged
}

/** 單一候選 commit 的 CI／Reviewer／Release 閘；CLI assemble 接 EvidenceStore 時，缺證據即 fail-closed。 */
export async function runCandidateGate(opts: {
  cfg: Config
  task: Task
  cwd: string
  result: RunResult
  verifier?: { check(job: Job, result: RunResult): Promise<VerifierCheck> }
  evidence?: EvidenceStore
  executionId: string
  writerIdentity: string
  preserveOnReject?: boolean
}): Promise<CandidateGateResult> {
  const candidateCommit = defaultCommitHash(opts.cwd) ?? opts.result.commitHash ?? 'unknown'
  const result = { ...opts.result, commitHash: candidateCommit }
  const risk = classifyTaskRisk(opts.cfg, opts.task)
  let check: VerifierCheck
  if (!opts.verifier) {
    check = opts.cfg.tierMode === 'free-only' || verifyRequired(risk)
      ? { pass: false, risk, blockedReason: 'verification-infra', reason: 'verifier unavailable', alerts: [] }
      : { pass: true, risk, alerts: ['verifier unavailable for low-risk task'] }
  } else {
    try {
      check = await opts.verifier.check({
        task: opts.task,
        projectPath: opts.cwd,
        executionId: opts.executionId,
        writerIdentity: opts.writerIdentity,
        preserveOnReject: opts.preserveOnReject,
      }, result)
    } catch (err) {
      check = opts.cfg.tierMode === 'free-only' || verifyRequired(risk)
        ? { pass: false, risk, blockedReason: 'verification-infra', reason: `verifier-exception: ${String(err)}`, alerts: [] }
        : { pass: true, risk, alerts: [`verifier-exception: ${String(err)}`] }
    }
  }

  const trustedHost = isTrustedHost(opts.cfg)
  if (!opts.evidence) return check
  if (!check.evidence) {
    return { pass: false, risk, blockedReason: 'verification-infra', reason: 'evidence-chain: verifier returned no gate evidence', alerts: check.alerts }
  }
  try {
    const receipt = opts.evidence.record({
      executionId: opts.executionId,
      task: opts.task,
      risk: check.risk ?? risk,
      writerIdentity: opts.writerIdentity,
      verification: { ...check.evidence, candidateCommit },
      releaseApprovalFile: opts.cfg.releaseApprovalFile,
      trustedHost,
    })
    if (receipt.releaseBlocked && check.pass) {
      return { ...check, pass: false, blockedReason: 'release-approval', reason: `release-blocked: ${receipt.releaseBlocked}`, receipt }
    }
    return { ...check, receipt }
  } catch (err) {
    return { pass: false, risk, blockedReason: 'verification-infra', reason: `evidence-chain write failed: ${String(err)}`, alerts: check.alerts }
  }
}
