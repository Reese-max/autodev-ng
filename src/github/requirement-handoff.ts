import { createHash } from 'node:crypto'
import type { GithubConfig, Issue } from './config.js'
import { fingerprint, type IssueState } from './state.js'

// A review packet is not an approval or a new executable requirement version.
export function requirementHandoff(cfg: GithubConfig, state: IssueState, current: Issue,
  inputs: { stateText: string; configuration: readonly (readonly [string, string])[]; pr: unknown }) {
  if (state.fingerprint !== fingerprint(state.issue)) throw new Error('Saved requirement fingerprint does not match its snapshot; preserve state for manual inspection')
  const hash = (value: string) => createHash('sha256').update(value).digest('hex')
  return {
    version: 1,
    decision: 'manual-handoff' as const,
    readOnly: true,
    successorCreated: false,
    executionAuthorized: false,
    identity: { repo: cfg.repo, base: cfg.base, issue: state.issue.number },
    requirements: {
      old: { fingerprint: state.fingerprint, snapshot: state.issue },
      proposed: { fingerprint: fingerprint(current), snapshot: current },
      changedFields: (['title', 'body', 'user'] as const).filter(field =>
        field === 'user' ? state.issue.user.login.toLowerCase() !== current.user.login.toLowerCase()
          : state.issue[field] !== current[field]),
    },
    observedInputs: {
      stateSha256: hash(inputs.stateText),
      configuration: inputs.configuration.map(([path, text]) => ({ path, sha256: hash(text) })),
      linkedPr: inputs.pr,
    },
    preservedEvidence: {
      recordedAttempts: state.runs,
      historyEntries: state.history?.length ?? 0,
      historyCompleteness: state.history ? 'not-established' : 'legacy-history-unavailable',
      reconciliation: state.reconciliation ?? null,
      reconciliationIsBackendStopProof: false,
      candidate: { baseSha: state.baseSha ?? null, commit: state.commit ?? null, pr: state.pr ?? null },
      cost: { status: 'unknown', amountUsd: null, reason: 'Reconciliation does not read or reconcile cumulative billing databases' },
    },
    approval: { collected: false, allowedOperators: [...cfg.authors],
      requiredBinding: ['repository', 'issue', 'oldFingerprint', 'newFingerprint', 'trustedOperator', 'configuration', 'backendStop', 'budgetScope'],
      issueTextOrLabelToggleIsApproval: false },
    continuationBlockers: [
      { code: 'successor-transition-unimplemented', scope: 'software',
        detail: 'Current IssueState and checkout layout have no successor requirement lineage; no state replacement or queued successor is performed' },
      { code: 'trusted-approval-missing', scope: 'trust',
        detail: 'No authenticated allowed-operator receipt has approved this exact old-to-new fingerprint pair' },
      { code: 'backend-stop-unproved', scope: 'runtime',
        detail: 'A requirements-changed retirement receipt does not establish termination of the old execution or backend' },
      { code: 'worktree-and-pr-reconciliation-required', scope: 'runtime',
        detail: 'Preserve all candidate commits, linked PRs and worktrees; their current head, dirty state and ownership require reconciliation before continuation' },
      { code: 'global-budget-scope-unverified', scope: 'software-and-owner',
        detail: 'No complete fleet billing scope or cumulative attempt/cost reconciliation is established by this command; unknown spend is not zero' },
    ],
    nextActions: [
      'Keep the saved Issue snapshot, state.json, history, candidate commits and billing evidence; do not delete state or reset attempt counters',
      'Review the exact old/new snapshots and fingerprints with an allowed operator outside Issue text and candidate-controlled files',
      'Confirm the exact old backend stopped, reconcile PR/worktree ownership and obtain complete cumulative budget evidence',
      'Use reviewed manual handoff while successor transition remains unavailable; sync, retry and label toggles do not approve changed requirements',
    ],
  }
}
