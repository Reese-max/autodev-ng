# Product-board delta — cf-ai-router PR #11 cost-gate blockers

- Run: `2026-09-17T16:58:00Z-product-board`
- Status: `ACTIONABLE_PRE_MERGE_FINDINGS / SKIPPED_LOCKED / NOT_CLEAN`
- Governing rule blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Repository: `Reese-max/cf-ai-router`
- Inspected default HEAD: `74c52130046a9f3e654fae3fe42f9bbc2224baeb` (audit-only; last product baseline `bb2d3c4b7d1e596b838f952f95d43b6833136653`)
- Candidate: PR #11, head `282b68d59ba0daee82fc5cf4bafe352518ebf61e`
- Existing tracking: Issue #5 and two unresolved PR review threads
- Inventory receipt: 41 owner-visible repositories; 40 unarchived; this was an incremental fair-cursor pass, not a full portfolio deep audit

## Finding 1 — stale `free-plan-asserted` preserves the original charge-risk path

- kind: `BUG`
- severity: `P2`
- decision_priority: `HIGH_PRE_MERGE`
- evidence: `SOURCE_CONFIRMED`
- triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- runtime: `NEEDS_RUNTIME_VERIFICATION`
- fingerprint: `cf-ai-router / Workers AI cost gate / account changes Free→Paid or checked-in config is copied / stale free-plan-asserted continues metered inference without metered-opt-in`

PR #11 correctly changes a missing or unknown billing mode to fail closed. It does not close the other explicit Issue #5 trigger: an external account-plan change or cross-account config reuse.

`workersAiBillingMode()` treats `WORKERS_AI_BILLING_MODE=free-plan-asserted` as an indefinitely valid enable signal. The PR also checks that value into both production and dev sections of `wrangler.toml`. After an account changes from Free to Paid, or the repository configuration is copied to a Paid account, the unchanged value still enables Workers AI. No current-plan proof, expiry, deployment preflight, or re-attestation boundary invalidates the assertion.

Cloudflare's official pricing page, checked 2026-09-17 and itself updated 2026-09-17, states that both plans receive 10,000 Neurons/day, but Workers Paid is charged $0.011 per 1,000 Neurons above that allocation: https://developers.cloudflare.com/workers-ai/platform/pricing/

Therefore `metered-opt-in` is not the only state that can reach billable inference after an external plan transition. The PR's scoped Round-4 statement that the D04 stale-configuration exposure is fixed is not supported, and Issue #5 remains open.

### Minimum safe scope

Choose one narrow boundary:

- only `metered-opt-in` may enable a path that can become billable, leaving unverifiable accounts disabled; or
- before accepting `free-plan-asserted`, require a non-billable plan proof or deployment/preflight receipt with explicit freshness, and fail closed when missing, stale, or mismatched.

Do not add a generalized billing platform, usage ledger, or deliberate paid-threshold test.

## Finding 2 — provider probe chooses a blocked entry before a usable one

- kind: `VALIDATION_GAP`
- severity: `P3`
- decision_priority: `NORMAL_PRE_MERGE`
- evidence: `SOURCE_CONFIRMED`
- triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- runtime: `NEEDS_RUNTIME_VERIFICATION`
- fingerprint: `cf-ai-router / provider-health probe / custom chain has blocked provider entry before safe entry / whole provider is reported cost-gated and safe entry is never probed`

`probeProviders()` flattens configured chains and selects the first entry for each provider, then decides whether the provider is cost-gated. A supported custom OpenRouter chain such as `paid/model` followed by `safe:free` makes the first match billable, so `/internal/provider-health?probe=1` skips the provider even though the router can use the later safe entry.

This does not create paid traffic and does not break normal routing. It is calibrated to P3 because it is a diagnostic false negative on a specific custom-chain ordering, not a core request failure. The minimal correction is to select the first usable entry under the same router cost predicate, and cover both `blocked→safe` and `blocked-only` fixtures.

## Execution evidence

- PR head Actions: Deploy run 35176503988 and CI run 35176504055 both concluded `failure`.
- Their `check` jobs expose no steps or logs; deploy jobs were skipped. This confirms no GitHub-hosted green receipt for the head, but does not establish a product-test failure or YAML/root cause.
- The PR body reports local `npm run check` with 143 tests, but those fixtures do not invalidate Finding 1 and encode the false-negative behavior in Finding 2.
- No paid inference, account-plan mutation, deployment, secret change, or production failure injection was performed.

## Ownership, dedupe, and Red Team

- Issue #5 is assigned and PR #11 is open with active owner/branch state and unresolved review threads. Result: `SKIPPED_LOCKED`; no Issue, PR, label, or review mutation was made.
- Finding 1 maps to Issue #5 and its unresolved review thread: https://github.com/Reese-max/cf-ai-router/pull/11#discussion_r4032705642
- Finding 2 is already tracked by the second unresolved review thread: https://github.com/Reese-max/cf-ai-router/pull/11#discussion_r4032705648
- Red Team accepted that missing/unknown modes now fail closed and that billable OpenRouter/Z.ai entries remain blocked; it rejected treating that partial improvement as proof that the Free→Paid trigger is fixed.
- Red Team rejected adding plan automation unless Cloudflare exposes a trustworthy non-billable proof; disabling unverifiable Workers AI is the smaller safe alternative.

## Product-board disposition

- NOW: resolve the stale assertion before merging PR #11; keep Issue #5 open.
- NEXT: repair the bounded provider-probe selection and obtain a real CI receipt.
- LATER: re-run affected fixed personas D04/H04/H05/I04/J04 after the fix reaches the default branch, then capture a non-billable deployed health receipt.
- DON'T: declare Round 4 clean, intentionally cross a paid threshold, or build a generalized billing/control platform.
- Recommendation: `MAINTAIN / SIMPLIFY`.

## Accounting

- Total findings: 2
- Severity: P0 0 / P1 0 / P2 1 / P3 1
- New Issues: 0
- Updated/Reopened Issues: 0
- Duplicate mappings: 2/2
- `SKIPPED_LOCKED`: 1 active remediation scope
- Verified fixed: 0
- Issue write blocked: 0
- Report write blocked: 0
- Fixed A01–J05 CLEAN: NO, qualifying rounds `0/2`
- Next fair cursor: `avatar-vfo`