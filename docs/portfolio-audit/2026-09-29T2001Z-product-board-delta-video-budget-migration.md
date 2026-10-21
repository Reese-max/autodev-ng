# Product-board delta — video budget period migration safety

- Audit UTC: 2026-09-29T20:01Z
- Rules blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Target repository: `Reese-max/video-timeline-pipeline`
- Default branch at inspection: `main@7d8929728fc7a04e97119e3fcf5ffe6e42b01f18`
- Candidate PR: [#29](https://github.com/Reese-max/video-timeline-pipeline/pull/29) at `2eb9349c7ed08489ab80c258d6fed511e167a864`
- Existing owner: [Issue #18](https://github.com/Reese-max/video-timeline-pipeline/issues/18)
- Result: `SKIPPED_LOCKED_ACTIVE_PR`
- Evidence class: `SOURCE_CONFIRMED`; no provider call, charge, production mutation, or executed full-path reproduction

## New actionable finding

**Fingerprint:** `video-timeline-pipeline + rolling upgrade from UTC-labelled budget reservations to local-period labels + outstanding legacy reservation omitted + hard-stop can approve additional provider work`

- kind: `BUG`
- severity: `P1`
- decision_priority: `NOW`
- triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- current-product status: pre-merge blocker only; the affected code is not on the default branch

PR #29 changes the reservation lookup to:

```sql
SELECT COALESCE(SUM(max_micro_usd), 0)
FROM budget_reservations
WHERE account_scope = ? AND period_id = ? AND status = 'reserved'
```

The new `period_id` is the configured local date. The current default branch wrote the UTC date. During a rolling upgrade, an outstanding reservation created by the old version can therefore have a different label from the new local period even though it belongs to the same configured local-day window. Example for `Asia/Taipei`: an old-version reservation created at 2026-01-15T23:50Z is labelled `2026-01-15`; after upgrading at 07:55 local, the new lookup uses `2026-01-16`. The old reservation is excluded from `outstanding_micro`, so hard-stop admission can overcommit the configured daily limit and dispatch additional external work.

This is a deterministic causal chain for a supported hard-stop path. It does not claim a real charge or incident occurred. The unresolved P1 review thread on PR #29 already tracks the exact blocker, so no duplicate Issue or target-Issue comment was created.

## Minimum effective scope

Preserve the local UTC-window correction, but add an upgrade-safe compatibility rule before admitting new work. The smallest acceptable correction must include outstanding legacy reservations that fall in the current configured local window, or migrate them atomically before the first new-version admission. It must not clear unknown/sent reservations, weaken the hard stop, introduce a new service, or broaden Issue #18 into a general billing platform.

Direct acceptance:

1. Seed an old-version outstanding reservation whose UTC `period_id` differs from the new local-day label.
2. Start the new code in the same configured local-day window.
3. Prove the old reservation remains included in projected spend and an over-limit second reservation is rejected before provider transport.
4. Cover settled, cancelled, previous-local-day, and month-boundary neighbors so compatibility logic does not double-count or retain stale reservations.
5. After merge to the default branch, rerun the same scenario at the merged SHA; PR tests alone do not earn `VERIFIED_FIXED`.

## Red Team

- **Not a duplicate new product problem:** it is a transition defect inside the active fix for Issue #18, so the existing Issue/PR owns it.
- **Not established on current production code:** default branch still has the original UTC-boundary bug; the new blocker exists only at the candidate PR head.
- **Smaller alternative exists:** a bounded migration/compatibility read is sufficient; no cross-repository ledger, state machine, or provider platform is justified.
- **Runtime limit:** PR #29 has no GitHub Actions run at the inspected head and no provider/runtime receipt. Static source confirms the lookup mismatch, but exact-head execution remains required.

## Run accounting

- Owned inventory: 42 repositories; 41 unarchived, 1 archived.
- Incremental default-branch commits after 2026-09-29T17:00Z: 0.
- Updated PRs inspected: 16.
- New Issues: 0.
- Existing Issue mutations: 0.
- Product/CI/config changes: 0.
- Worker/GOAL/merge/deploy actions: 0.
- New actionable finding: 1, already tracked by active PR review.
- Portfolio CLEAN: not claimed; fixed A01–J05 two-round and runtime conditions are not satisfied.
