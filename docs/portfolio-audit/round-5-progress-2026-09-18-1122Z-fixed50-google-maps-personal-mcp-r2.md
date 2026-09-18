# Fixed 50-Persona Portfolio Audit — continuation 2026-09-18 11:22Z

This is continuation/audit state only. It is not a product fix, worker authorization, merge/deploy instruction, or CLEAN claim.

## Normative inputs

Re-read from current `Reese-max/autodev-ng` default branch before this run:

- `docs/portfolio-audit/2026-09-06-50-persona-audit.md`
  - blob: `6e3499d6ef5be7e123050e1526946f6a40f99263`
- `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
  - blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- fixed synthetic personas: A01–J05, 50 identities/constraints/original success conditions unchanged.

## Inventory

The connected Reese-max-owned repository inventory was fully paged again this run: page 1 returned **41** accessible owned repositories and page 2 was empty. Earlier fixed-persona checkpoints recorded 42, so the difference remains an **inventory visibility gap**; no missing repository is inferred deleted, transferred, excluded or CLEAN. Archived/content/empty applicability still requires explicit treatment before any portfolio CLEAN claim.

## Priority/fair-cursor precheck — ai-flight-radar

Fresh default branch remains `6228138337f950cb6399088c4f814f27a518e29e`.

The current product already has an **open audit PR #10** (`devin/issue-5`) with a complete fixed A01–J05 Round 3 report against that exact product SHA. The report was independently read in this run rather than trusting its summary:

- 50/50 fixed synthetic personas are present.
- #7 stale seed-plan test is VERIFIED_FIXED with exact-SHA Workers CI receipt.
- existing #1 has negative live scheduled-collector evidence (12 runs, 1 success / 11 failures) but the untyped failure signature remains inside #1's existing admission/calibration fingerprint.
- existing #6 remains STILL_REPRODUCIBLE on default branch.
- #8 remains an opt-in provider-contract gap; no production Fli incident is claimed.
- no new independent P0/P1/P2 fingerprint is established in that report.
- result remains NOT CLEAN, 0/2.

Because PR #10 is an active branch/goal directly owning umbrella #5's current fixed-persona audit report, this audit did **not** create a competing ai-flight-radar report/comment or modify its umbrella. The fair rotation therefore advanced rather than stealing the active scope.

## Completed — Reese-max/google-maps-personal-mcp Round 2

- default branch: `main`
- round-start HEAD: `3097a14e3fbe45ad3e4cd870fd89e516b4416b90`
- inspected product SHA: `8bb6931b6d34f158aedf9ad6f652a7aef3822bcb`
- comparison product SHA → round-start HEAD: audit/docs only; no product change credited
- exact product-SHA Actions query: `total_count: 0`
- existing fixed-persona umbrella: https://github.com/Reese-max/google-maps-personal-mcp/issues/3
- report: https://github.com/Reese-max/google-maps-personal-mcp/blob/800bc3b5adc3558a6ee9a5f296549098467596fb/.github/quality-audits/2026-09-18T1118Z-50-persona-audit-round-2.md
- report commit: `800bc3b5adc3558a6ee9a5f296549098467596fb`
- fixed A01–J05 matrix: 50/50 freshly re-reviewed
- status: **NOT CLEAN, 0/2**

### New independent actionable finding

Created and read back successfully:

- https://github.com/Reese-max/google-maps-personal-mcp/issues/7
- title: `[P2][BUG][50-persona audit] Serialize Google Maps writes that share one Chrome profile`
- classification: `BUG / P2 / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`
- fingerprint: `google-maps-personal-mcp + shared persistent Chrome profile + overlapping Google Maps write/verify operations across different collections/processes + second adapter launches the same configured profile while first context is active + no profile-wide ownership guard`

Source chain on the inspected product SHA:

1. `settings.py` defines one `GMPMCP_CHROME_PROFILE` path.
2. `App.make_adapter()` supplies that same path to every `PlaywrightMapsAdapter`.
3. `tools/sync.py` creates and opens a fresh adapter for each real single-place sync, collection sync, and list verification.
4. `PlaywrightMapsAdapter.open()` launches a persistent Chrome context.
5. `browser/chrome.py` explicitly documents that Chrome refuses a second instance on the same profile.
6. No profile-wide local/inter-process ownership boundary exists before `adapter.open()`.

This is not a duplicate of #2. #2 is same-collection queue-row ownership/recovery; #7 remains reachable with different collections or sync-vs-verification because those operations can have disjoint queue rows while still sharing one browser profile. Open PR #6 explicitly leaves different-collection concurrency allowed and calls the shared-profile collision a separate pre-existing concern.

Severity remains P2 rather than P0/P1 because no concurrent signed-in Chrome execution, duplicate external write, data loss, account impact or production incident was observed. Frequency is not fabricated. The minimal fix is a single local profile-wide ownership boundary, preferably reusing the smallest lease/lock primitive available after #2 remediation; no remote lock service, new database or generic workflow framework is justified.

### Existing findings / active scopes

- #1 retention boundary: open and SOURCE_CONFIRMED on current product baseline. PR #5 is active/unmerged; audit did not touch it.
- #2 same-collection queue race: open and SOURCE_CONFIRMED. PR #5 and PR #6 are active/unmerged; audit did not touch them.
- #4 Place-ID continuity: RESEARCH / NOT_ESTABLISHED / NEEDS_EVIDENCE; not promoted to P0/P1/P2.
- #7 new shared-profile ownership bug: open, no implementation authorization.

## Runtime / evidence boundary

- No exact-product-SHA GitHub Actions run exists.
- No live Places request, signed-in Google Maps mutation, concurrent Chrome profile reproduction, destructive failure injection or paid request was executed.
- Test files and PR-local test claims are not promoted to current-default runtime receipts.
- #7 is SOURCE_CONFIRMED from current code and Chrome-profile contract, not EXECUTED_REPRODUCTION.

## Coordination / write safety

- Repo branches read: `main`, `devin/issue-2`, `fix/issues-1-2-sync-retention`.
- Open PRs read: #5 and #6; their active #1/#2 implementation scopes were left untouched.
- Umbrella #3 comments were read in full. Round-2 `github-issue-lock:v1` was written and read back before audit-state mutation.
- #7 was duplicate-searched against current issues/PRs before creation, its returned number/URL was read back, and an audit lock marker was read back.
- Only audit/state/Issue/comments were written. No product source, CI/config, settings, secrets, permissions, implementation branch, merge, deploy, GOAL/worker or paid/external change was started.

## CLEAN accounting

`google-maps-personal-mcp` remains **NOT CLEAN, 0/2** because #1, #2 and #7 are applicable open P2 findings and required runtime paths are incomplete. Round 2 is a complete 50/50 synthetic re-review, but a new P2 means it cannot be a qualifying CLEAN round.

Portfolio remains **NOT CLEAN**. The current 41-vs-42 inventory visibility gap alone also prevents a complete-portfolio CLEAN claim.

## Notification state

Low-noise notification gate **is triggered** by the new independent actionable P2 #7. The notification must distinguish source confirmation from unexecuted signed-in Chrome behavior and link the real Issue/report.

## Fair rotation cursor

The prior persisted sequence after `google-maps-personal-mcp` points to **`claude-mem`**. No Round-5 fixed-persona `claude-mem` continuation was found in the current central index search, so the next fair unresolved/aging target is `claude-mem`, unless a higher-priority landed P0/P1 fix/regression or runtime-evidence expiry legitimately preempts it. Its state must be freshly re-read; older history (including any prior Issue-write limitation) must not be assumed current.
