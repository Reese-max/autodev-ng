# Portfolio 50-Persona Audit — Round 4 Continuation

Date/time: 2026-09-14T17:30Z

Normative inputs re-read from current `main`:

- `docs/portfolio-audit/2026-09-06-50-persona-audit.md` blob `6e3499d6ef5be7e123050e1526946f6a40f99263`
- `docs/portfolio-audit/2026-09-14-issue-quality-v2.md` blob `8167e10798071d2276addaff6b201c6b0e904a2a`

The current accessible Reese-max inventory remains 42 owned repositories in the completed page-0 enumeration (<100 returned, so no second page is implied by this API result). Old 39-repo snapshots are not treated as exhaustive.

## Fair-cursor work completed

The prior continuation explicitly selected `google-maps-personal-mcp` as the next fair fixed-persona discovery target. This continuation processed that repository using the fixed synthetic A01–J05 set (50/50 rows), not Product Board dynamic personas.

Repository evidence:

- default branch: `main`
- inspected product SHA: `8bb6931b6d34f158aedf9ad6f652a7aef3822bcb`
- round-start HEAD: `ee2cbd56b3b8da28a6f856a9bf2323b6687d32c6`
- commits between product SHA and round-start HEAD were audit/report-only and were not treated as product fixes
- current product runtime evidence: GitHub Actions `total_count: 0`; inspected SHA commit statuses: none
- repo report commit: `35680e6a61a0f6a31bf4b77cb1e8f83b6d48df5c`
- report: https://github.com/Reese-max/google-maps-personal-mcp/blob/35680e6a61a0f6a31bf4b77cb1e8f83b6d48df5c/.github/quality-audits/2026-09-14-1727Z-fixed50-round-1.md
- umbrella: https://github.com/Reese-max/google-maps-personal-mcp/issues/3

## New actionable finding

A new independent finding passed Issue Quality v2 and was written/read back successfully:

- `Reese-max/google-maps-personal-mcp#2`
- https://github.com/Reese-max/google-maps-personal-mcp/issues/2
- classification: `BUG / P2 / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`
- fingerprint: `google-maps-personal-mcp + sync queue recovery + overlapping sync run on the same collection while a row is active + active SYNCING row is reset to PENDING and becomes eligible for a second write + reset_stale_syncing has no age/owner/run distinction`

Source chain: every `sync_collection()` call begins with `db.reset_stale_syncing(collection_id)`; the DB method resets every `syncing` row for that collection, without distinguishing abandoned rows from active rows. A concurrent second call can therefore requeue the first call's active place and select it again. Individual DB calls are lock-serialized, but the browser mutation lifecycle has no same-collection/run ownership guard. Existing tests prove only sequential idempotency and synthetic post-crash recovery; they do not cover overlapping runs.

Severity remains P2 rather than P0/P1 because the queue-ownership violation is source-confirmed, but no two-writer signed-in Maps execution was performed and no duplicate external write, data loss, privacy breach, or account impact was observed. The issue requires an isolated deterministic overlap regression test at the fixing SHA; it does not require a paid/live provider call to prove the queue fix.

Existing `google-maps-personal-mcp#1` (P2 Places retention boundary) remains open and source-applicable. It was not re-commented merely to restate prior evidence.

## Persona / CLEAN accounting

- Fixed A01–J05 synthetic matrix: 50/50 accounted for.
- New P0: 0.
- New P1: 0.
- New P2: 1 (#2).
- Existing applicable open P2: #1.
- Reopened regression: 0.
- Required live Places, signed-in Maps sync, interruption/error and applicable client/accessibility execution evidence remains missing.
- Round qualification: `PARTIAL / non-qualifying` for CLEAN streak despite complete synthetic matrix, because open P2s and runtime gaps remain.
- Repo CLEAN: `NOT CLEAN`, streak `0/2`.
- Portfolio CLEAN: not claimable.

## Quality-v2 false-positive controls retained

The audit did **not** create issues for:

- absent GitHub Actions alone (validation gap, not product failure),
- suspected Playwright selector/list-creation incompatibility without live evidence,
- generic mobile/native-app absence outside the local MCP scope,
- backup/export ideas without established P2 task failure.

## Coordination / write safety

- Existing Issue #1 full comments were read; its Product Board lease was released.
- Repository issue/PR/branch state was checked before new finding creation: no duplicate concurrency issue, no PR, only `main` branch.
- New #2 was duplicate-searched before creation and its returned number/URL was verified.
- New umbrella #3 was duplicate-searched; a `github-issue-lock:v1` persona-audit marker was added and read back; after report commit `35680e6a...`, a matching completed release marker was written.
- No product source, CI/config, secrets, permissions, repository settings, merge, deployment, provider call, paid action, or repair worker was changed/started.

## Notification state

This continuation **does** satisfy the low-noise notification gate because a new independent actionable P2 finding (#2) was actually created and verified. The user-facing notice must clearly distinguish source confirmation from unexecuted live Google Maps behavior.

## Fair rotation cursor

`google-maps-personal-mcp` discovery is now persisted. Next fair unresolved/aging target is **`claude-mem`**, unless a higher-priority current default-branch P0/P1 regression, newly landed finding fix requiring same-scenario retest, or expiring runtime-evidence recheck legitimately preempts it. Its prior history includes an older fixed-persona finding whose Issue write was blocked because repository Issues were disabled; current state must be re-read rather than assumed.

Portfolio status remains **NOT CLEAN**. Audit-only commits and NO_CHANGE checks do not advance qualifying streaks.
