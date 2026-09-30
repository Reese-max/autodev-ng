# Product Board Delta — ai-novel-workstation PR #9

**UTC:** 2026-09-17T05:05:25Z  
**Status:** PARTIAL / ACTIVE_PR / SKIPPED_LOCKED  
**Rules:** `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`, blob `8167e10798071d2276addaff6b201c6b0e904a2a`  
**Product default branch:** `Reese-max/ai-novel-workstation@267a0b6a9856f1de5f20afe44c7e0fd23d0390aa`  
**Product baseline:** `8873c47202cdb96fbe5d457fda02bef16499525a` (last non-audit/default-branch product snapshot identified in this round)  
**Inspected active change:** PR [#9](https://github.com/Reese-max/ai-novel-workstation/pull/9), head `8686e875b75a0963b61fa7badc2a8256f3aceac1`  
**Existing tracker:** Issue [#2](https://github.com/Reese-max/ai-novel-workstation/issues/2)

## Scope and discovery

This is an incremental pre-merge review, not a new full-portfolio ranking or a replacement for the formal [2026-09-13 product-board audit](https://github.com/Reese-max/ai-novel-workstation/blob/267a0b6a9856f1de5f20afe44c7e0fd23d0390aa/.github/quality-audits/2026-09-13-2215-product-board-audit.md).

The connected inventory returned 39 Reese-max-owned repositories: 38 unarchived and one archived (`obsidian-vault`). `travel-planning-mcp` remains an empty unarchived repository and was excluded from product-surface defect inference. The fair-rotation cursor selected `ai-novel-workstation`; its default branch has only audit/documentation changes since the inspected product snapshot. Open Issues, PRs, review threads, comments, branches, recent commits, workflow-run receipts and commit statuses were checked.

PR #9 is a new active implementation of the already-approved Issue #2 direction. It overlaps older open PR #3 but has a distinct current head and three unresolved review threads. Issue #2 and both implementation PRs have active ownership. No Issue, PR body, implementation branch, product source, CI/config, settings, secrets, worker, deployment or paid provider was modified by this audit.

## Evidence classification

- The three findings below are **CONFIRMED / SOURCE_CONFIRMED** from the PR head and unresolved inline review threads.
- GitHub returned zero PR-triggered Actions runs and zero commit statuses for PR #9 head. The PR body reports local tests, but no independent GitHub-hosted receipt was available.
- No real provider, long-book, interruption/resume, browser, assistive-technology or production-data test was executed here.
- PR #9 is not merged. These are pre-merge blockers, not claims that the default-branch product or users have already suffered an incident.

## Quality-gate findings

### F1 — A reduced observer context can erase hidden character truth

- **Fingerprint:** `ai-novel-workstation + ContextManifest character selector + chapter plan names a subset of characters + observer receives reduced matrix and update_after overwrites full character_matrix + omitted character sections are lost`
- **Tracking:** Issue #2 / PR #9 / unresolved [review thread](https://github.com/Reese-max/ai-novel-workstation/pull/9#discussion_r4032563824)
- **Kind:** BUG
- **Severity:** P1
- **Decision priority:** P1 pre-merge blocker
- **Triage:** NEEDS_REVIEW
- **auto_implementation:** false
- **Affected roles:** long-form authors with multi-character truth files, editors, support and recovery operators.
- **Reachable chain:** chapter plan names only some characters → selector excludes other matrix sections from `ctx.character_sheets` → the same partial context is supplied to `observer.observe` → observer is asked to return updated full-matrix text → `memory.update_after` overwrites `character_matrix.md`. The observer cannot reproduce sections it was never shown, so an otherwise successful chapter finalization can silently delete unrelated character records.
- **Expected:** context reduction may limit model input, but must not reduce the authoritative mutation base or delete untouched truth.
- **Actual:** the reduced view is reused as if it were the complete mutable truth.
- **Consequence if merged unchanged:** core long-form continuity data can be silently lost; later chapters, exports and recovery can proceed from corrupted truth.
- **Existing alternative:** keep the current complete matrix as the mutation base while using the reduced projection only for planning/writing.
- **Minimum effective change:** separate read projection from authoritative update; either pass the full matrix to the observer or merge explicit per-character deltas into current truth while preserving unseen sections.
- **Non-goals:** no vector database, generic memory platform, collaboration service or new state machine.
- **Direct acceptance:**
  1. A fixture with at least two characters plans a chapter for only one.
  2. Observer updates the participating character.
  3. The non-participating character remains byte/field-equivalent after finalization.
  4. Observer failure/rollback and resume preserve both characters and existing chapter evidence.
- **Runtime need:** deterministic isolated AuthorLoop + real memory-store regression; provider credentials are unnecessary.

P1 is justified by a source-confirmed, reachable silent-deletion path affecting the product's authoritative continuity data. It is not P0 because the code is confined to an unmerged PR and no default-branch or production incident was observed.

### F2 — Rebuilding one chapter overwrites earlier model-call evidence

- **Fingerprint:** `ai-novel-workstation + per-chapter context manifest path + plan/write/quality rebuilds use same destination + later build replaces earlier input evidence`
- **Tracking:** Issue #2 / PR #9 / unresolved [review thread](https://github.com/Reese-max/ai-novel-workstation/pull/9#discussion_r4032563828)
- **Kind:** BUG
- **Severity:** P2
- **Decision priority:** P2 pre-merge blocker
- **Triage:** NEEDS_REVIEW
- **auto_implementation:** false
- **Impact:** chapters without an existing plan build context for planning, then rebuild after saving the plan; later quality work can rebuild again. All writes target the same path, so the input actually used for an earlier model call is destroyed.
- **Expected:** each plan/write/quality call remains attributable to an immutable manifest revision, or the product explicitly records which revision is canonical for each call.
- **Actual:** the latest rebuild replaces prior evidence while UI/docs imply per-call traceability and replay.
- **Minimum effective change:** use purpose/revision-qualified artifacts or an append-only revision list, and bind each model call/runlog entry to the exact manifest hash.
- **Non-goals:** no event platform or cross-project ledger.
- **Direct acceptance:** initial plan and post-plan write produce distinct preserved revisions; quality cannot overwrite them; loading requires an explicit purpose/revision; resume retains the original model-call binding.

### F3 — Frozen replay can accept changed JSON bytes and send different input

- **Fingerprint:** `ai-novel-workstation + JSON character matrix + verify parsed-section hashes + all sections selected renders current raw file + formatting/key-order drift passes verification but changes prompt bytes`
- **Tracking:** Issue #2 / PR #9 / unresolved [review thread](https://github.com/Reese-max/ai-novel-workstation/pull/9#discussion_r4032563832)
- **Kind:** VALIDATION_GAP
- **Severity:** P2
- **Decision priority:** P2 pre-merge blocker
- **Triage:** NEEDS_REVIEW
- **auto_implementation:** false
- **Impact:** when all JSON matrix sections are selected, verification hashes parsed values, but rendering can return the current raw file. Reformatting or key reordering can leave item hashes unchanged while changing exact model input, so “frozen replay” does not fail closed.
- **Expected:** verified bytes/canonical representation equal the bytes/canonical representation supplied to the model.
- **Actual:** verification and rendering use different representations.
- **Minimum effective change:** hash the exact rendered matrix input, or use one canonical JSON renderer for both original and replay.
- **Direct acceptance:** whitespace/key-order-only change either produces identical canonical model input or fails verification; a semantic value change fails closed; partial-section and all-section paths use the same representation contract.

## Duplicate, ownership and lock decision

Issue #2 already covers deterministic context selection, immutable/replayable evidence and source-drift detection. Changing solution wording does not create a new root tracker. PR #9 also already contains exact inline discussions for all three roots. Therefore:

- New Issue: 0
- Updated Issue: 0
- Reopened Issue: 0
- Duplicate avoided: 3
- **SKIPPED_LOCKED:** Issue #2 / PR #9, because a new owner branch, active PR and unresolved review threads are present.
- Older PR #3 and open cost/CI PRs #7/#8 were read for de-duplication and ownership only; their already-known findings were not reposted.

No Issue lock marker was added because this audit did not take ownership. The central report is the independent evidence channel.

## Product board delta

The 2026-09-13 board and 30 regression + 20 exploration persona corpus remain the current product baseline; this delta does not rotate or erase them and does not claim a new synthetic preference share. The new risk is concentrated in the exact moat those personas selected: local truth, deterministic context and safe resume.

- **CEO:** if only three things are done: (1) prevent F1 deletion, (2) make plan/write/quality evidence immutable and exact, (3) obtain a commit-bound verification receipt. Do not add providers, SaaS, mobile, community or publishing automation.
- **CPO / UX:** selective context remains valuable, but “AI sees less” must never mean “truth store keeps less.” Make advanced manifest history inspectable only when needed.
- **CTO / Staff Engineer:** use one source of truth and one representation contract; a projection may be read-only, while mutation must preserve the complete authoritative object.
- **QA / SRE:** add deterministic concurrency/resume/rollback fixtures and exact replay checks; local pass counts do not substitute for the absent PR/default-branch receipt.
- **Security/Privacy:** selective visibility is privacy-positive only if omitted material is neither deleted nor silently reintroduced.
- **Growth / CFO:** token savings remain unproven and cannot outweigh data integrity or evidence loss.
- **Accessibility / Support:** no new accessibility defect is established. Stable revision IDs and recovery receipts would reduce support ambiguity, but do not replace assistive-technology testing.

Substantive disagreement: Growth may prefer shipping the context-cost improvement quickly; Engineering, QA and Support reject that trade until F1 is closed. UX also rejects exposing a large revision-management surface; the smaller answer is automatic immutable revisions plus an inspectable advanced view.

## Competitor and Red Team delta

The most recent formal comparison remains Novelcrafter, Sudowrite, Scrivener, Atticus, Reedsy Studio and plain Markdown/Git. No competitor feature is used as defect evidence here. The product direction remains:

- **MUST MATCH:** lossless save/resume and truthful model-input evidence.
- **SHOULD BE BETTER:** local ownership, exact context/replay, explicit paid-effect boundaries.
- **DIFFERENTIATOR:** Traditional Chinese local-first long-form production with inspectable truth.
- **DO NOT COPY:** multi-tenant SaaS, marketplace/community, native mobile, LMS, automatic publishing or provider breadth before reliability.

Red Team conclusions:

1. These are not default-branch incidents; blocking merge is sufficient containment.
2. Existing PR #3 is a smaller already-reviewed alternative and must be reconciled before choosing PR #9; two parallel implementations should not both merge blindly.
3. F1 is not solved by more manifest schema or tests that only assert selected prompt content; the mutation boundary must preserve omitted truth.
4. F2 does not require a general ledger; purpose/revision-qualified files are enough.
5. F3 does not require storing provider prompts; exact local rendered-context hashing/canonicalization is enough.
6. PR-body test claims cannot prove GitHub admission or provider/long-book behavior. Missing remote receipts block CLEAN but do not prove product failure.

## Decision memo

**Recommendation:** INVEST / SIMPLIFY.

**Serve:** technically comfortable Traditional Chinese long-form authors who prefer local files and explicit control.  
**Why choose it:** inspectable, resumable manuscript production rather than opaque one-click generation.  
**Why it wins:** authoritative local truth plus deterministic context/replay—only if the new projection cannot corrupt truth and evidence is exact.

**NOW:** resolve F1–F3 within the active #2/PR scope and reconcile PR #3 versus #9.  
**NEXT:** establish PR and post-merge default-branch verification receipts; then run short-book + large-world + resume/recovery scenarios.  
**LATER:** usability/accessibility sessions and export/device verification.  
**DON'T:** widen product scope or treat simulated personas, issue priority or local pass counts as merge/deploy authorization.

## Accounting

- Total findings: 3
- Severity: P0 0 / P1 1 / P2 2 / P3 0
- New Issues: 0
- Updated Issues: 0
- Reopened Issues: 0
- Research Issues: 0
- Duplicate avoided: 3
- SKIPPED_LOCKED: 1 active scope (#2 / PR #9)
- Verified fixed: 0
- Issue write blocked: 0
- Report write blocked: 0 at authoring time
- Finding mapping: 3/3
- Portfolio CLEAN: not claimed; fixed A01–J05 remains NOT CLEAN, 0/2, and required runtime evidence is absent.
