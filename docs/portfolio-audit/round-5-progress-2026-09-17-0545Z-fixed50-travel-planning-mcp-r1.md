# Portfolio continuation — travel-planning-mcp fixed-50 Round 1

- Run: `2026-09-17T05:40:13Z-fixed50-travel-planning-mcp-r1`
- Governing fixed-50 blob: `6e3499d6ef5be7e123050e1526946f6a40f99263`
- Issue Quality v2 blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Target: `Reese-max/travel-planning-mcp`
- Product SHA inspected: `5a84a746266a2bd8cabf07db24a0fd2e9558b400`
- Audit-only commit after inspection: `74fcf8d12b6aaca91dd6ce7c9be15f72be8250e6`
- Repo report: https://github.com/Reese-max/travel-planning-mcp/blob/74fcf8d12b6aaca91dd6ce7c9be15f72be8250e6/.github/quality-audits/2026-09-17T0540Z-50-persona-audit-round-1.md
- Umbrella: https://github.com/Reese-max/travel-planning-mcp/issues/4
- Actionable finding: https://github.com/Reese-max/travel-planning-mcp/issues/5
- Result: **NOT CLEAN / 0/2**

## Fresh inventory

The owner inventory was fully paged with 100 entries per page. The current connector view exposes **39 Reese-max repositories**; offset 100 returned no additional repositories. `obsidian-vault` is archived. This still differs from older portfolio records that enumerated 42 repositories. Treat the difference as an inventory visibility/access discrepancy, not evidence that previously visible repositories were deleted. Whole-portfolio CLEAN remains unavailable while this discrepancy is unresolved.

## Fair-cursor target completed

The prior persisted cursor selected `travel-planning-mcp`, which was newly visible and had no prior fixed-50 audit. Current `main` at audit start was `5a84a746266a2bd8cabf07db24a0fd2e9558b400`.

The current product contract was read from README/security/architecture/TRIP integration docs plus the core HTTP/MCP/service/provider/store code. All repository Issues and PRs were searched. Before this audit there were no Issues; PR #1, #2 and #3 are closed and merged; no open PR exists. Current feature branch names remain but no open PR owns the audit finding. `autodev-ng` / `adng-memory` search exposed no active owner/heartbeat/GOAL for this repository. No implementation run/worker/branch was started.

## Exact-SHA execution evidence

At inspected SHA `5a84a746...`:

- Actions CI run `35179007178`: completed success. The job checked out that exact SHA, installed dependencies, ran typecheck, ran 46 Vitest tests across 6 files, and built successfully.
- Actions TRIP integration run `35179007047`: completed success. Bridge-check and source-package jobs executed core check/build, bootstrap syntax, pinned upstream preparation, local Compose configuration check, upstream Python syntax check, source packaging/provenance, overwrite refusal and artifact upload.

Evidence boundary: these runs do not prove live Google provider behavior, a real TRIP account, remote multi-user deployment, live timeout/429/5xx recovery, browser/mobile UI, or the newly identified terminal-lifecycle revalidation scenario.

## New actionable finding

Issue #5 — `[P2][50-persona audit] Keep approved/rejected/applied proposals terminal during revalidation`

Classification: `BUG / P2 / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`.

Root cause: `ProposalService.validate()` re-evaluates any existing proposal then unconditionally persists `status = validated | needs_review`, without guarding the current lifecycle state. Ordinary REST/MCP planner validation can therefore rewrite `approved`, `rejected`, or `applied` state. An approved proposal can be downgraded before apply and require operator reapproval while retaining its old approval receipt; rejected/applied records can also become internally inconsistent. Human approval is not bypassed, so P0/P1 was rejected.

Minimal fix remains local: protect terminal/protected lifecycle states in existing `validate()` (or make later validation observational without mutating terminal state) and add direct regression tests. No database, general state-machine framework, ledger, service, deploy, provider spend or external write is required or authorized.

## Broad discovery decisions

The Round 1 report contains the complete A01–J05 matrix. Other observed gaps were deliberately not inflated into Issues:

- Google live adapters currently lack app-level request timeout/backoff/quota metrics, but the repository itself marks these as production-hardening follow-ups and this audit has no measured current incident/frequency/cost evidence. Retain as `VALIDATION_GAP / NOT_ESTABLISHED`.
- Durable persistence, multi-instance transactional idempotency, OAuth/ACL and TRIP writeback are explicit future/production boundaries, not current supported MVP defects.
- Some README limitation wording lags the newer live-provider adapters; this is below P2 and does not justify a count-padding Issue.

## Writes / lock state

A deduped fixed-50 umbrella was created as #4 and the independent P2 as #5. Audit leases were appended and read back on both Issues before subsequent audit/shared-state writes. No pre-existing active Issue lease or open PR scope conflicted. The repo report write was verified at commit `74fcf8d12b6aaca91dd6ce7c9be15f72be8250e6`.

The audit-only commit is the only change after the inspected product SHA, so it does not count as a product fix and does not invalidate the exact-SHA product observations.

## CLEAN accounting

`travel-planning-mcp`: **NOT CLEAN / 0/2**. Reasons: open P2 #5, incomplete required external runtime evidence, no two consecutive qualifying clean rounds, and current portfolio inventory visibility discrepancy. This Round 1 is a complete fixed-persona discovery round but not a qualifying CLEAN round.

## Next fair cursor

Advance the fair discovery/reverification cursor to **`exam-archive`**, wrapping after the newly visible last entry. A higher-priority landed P0/P1/P2 remediation or confirmed regression may pre-empt the fairness lane, but does not mark `exam-archive` complete.
