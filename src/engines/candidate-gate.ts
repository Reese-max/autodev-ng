import type { Config, Job, RunResult, Task } from '../types.js'
import type { VerifierCheck } from '../verifier.js'
import { defaultCommitHash } from './commit-hash.js'
import type { EvidenceReceipt, EvidenceStore } from './evidence-chain.js'
import { classifyTaskRisk, verifyRequired } from './risk-policy.js'

export interface CandidateGateResult extends VerifierCheck { receipt?: EvidenceReceipt }

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
    check = verifyRequired(risk)
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
      check = verifyRequired(risk)
        ? { pass: false, risk, blockedReason: 'verification-infra', reason: `verifier-exception: ${String(err)}`, alerts: [] }
        : { pass: true, risk, alerts: [`verifier-exception: ${String(err)}`] }
    }
  }

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
    })
    if (receipt.releaseBlocked && check.pass) {
      return { ...check, pass: false, blockedReason: 'release-approval', reason: `release-blocked: ${receipt.releaseBlocked}`, receipt }
    }
    return { ...check, receipt }
  } catch (err) {
    return { pass: false, risk, blockedReason: 'verification-infra', reason: `evidence-chain write failed: ${String(err)}`, alerts: check.alerts }
  }
}
