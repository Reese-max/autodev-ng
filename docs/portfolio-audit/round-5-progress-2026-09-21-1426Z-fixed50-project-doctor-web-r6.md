# Fixed 50-Persona portfolio audit continuation — project-doctor-web Round 6

- Run: `2026-09-21T14:23:09Z-project-doctor-web-r6`
- State: `NEW_ACTIONABLE_FINDING / NOT_CLEAN / 0/2`
- Fair cursor consumed: `Reese-max/project-doctor-web`
- Next fair cursor: `Reese-max/prompt-autoresearch`
- Central state base HEAD before this write: `8c00ec3869c828627b88e938bc9d198823110fac`

## Governing rules

- Fixed A01–J05 protocol blob: `6e3499d6ef5be7e123050e1526946f6a40f99263` (`docs/portfolio-audit/2026-09-06-50-persona-audit.md`).
- Issue Quality v2 blob: `8167e10798071d2276addaff6b201c6b0e904a2a` (`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`).
- Fixed personas remain synthetic simulations, not human research or 50 independent votes.

## Fresh owner inventory

Connected-owner enumeration exposed **41 accessible Reese-max-owned repositories**. Historical fixed-50 checkpoints exposed 42, so preserve the one-repository visibility/access gap. Whole-portfolio CLEAN remains ineligible while inventory completeness is uncertain. Archived `obsidian-vault` remains an applicability/exclusion item rather than an active-product defect or CLEAN product.

## project-doctor-web Round 6

- default branch: `main`
- inspected HEAD immediately before report write: `33bfdcf6a70d7a142369ca060faf9af27334d6e0`
- underlying candidate-facing product baseline: `3a7e83ed012722f5d28b4bc7fb4bddbf98d07579`
- exact inspected-HEAD Actions: `total_count: 0`
- repo-local report commit: `7a9a96b1f22ce80149f23d8ee1ab8ca23b046ce6`
- report: `docs/audits/50-persona-round-6-2026-09-21-1423Z.md`
- post-report HEAD is audit-only `7a9a96b1f22ce80149f23d8ee1ab8ca23b046ce6`, whose parent is inspected HEAD `33bfdcf...`; do not treat it as a product fix

A fresh complete A01–J05 source/static review found one new independent actionable root cause:

### #19 — P2 BUG: emergency-intercepted interview is not terminal

Issue: https://github.com/Reese-max/project-doctor-web/issues/19

`DoctorWorkspace.runTurn()` records `emergencyAlert` and emergency SOAP after `data.emergency`, but leaves the interview in `started` state. Reply/objective controls are disabled only while loading/empty, not by the emergency latch. The backend emergency response says to stop online consultation immediately, yet a later benign reply/objective request has no persisted emergency-stop state and can reach normal provider generation again.

Classification: `BUG / P2 / CONFIRMED / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`.

P2 rather than P1: the high-visibility emergency banner remains visible, so urgent guidance is not erased; nevertheless the supported workflow can resume ordinary clinical questioning after a confirmed emergency intercept, materially weakening recovery/trust. No production incident, harm, live provider reproduction, or frequency estimate is claimed.

Minimum repair is a thin Web-interview emergency-stopped latch plus bounded regression. Do not add a database, queue, general state machine, auth platform, or provider/session service unless a separate product decision proves a supported stateful raw-API requirement.

## Dedupe / existing evidence

- Closed #1 addressed absence of a deterministic gate. #19 is post-trigger lifecycle, so #1 was not reopened.
- Open #16 addresses cross-turn detection before an emergency trigger. #19 assumes the trigger already succeeded; root cause is distinct.
- Existing #2 P1, #9 P1, #14 P2, #16 P1 remain current-default blockers.
- #16 has a bounded historical no-network `EXECUTED_REPRODUCTION` receipt on the unchanged product blobs for split-turn cardiac/anaphylaxis; it is not deployed Cloudflare/provider evidence.
- #18 remains `RESEARCH / NOT_ESTABLISHED / NEEDS_EVIDENCE`, not promoted into a product P0/P1/P2.
- Emergency-related all-state PR/branch search found historical #6/#7 and #1 branches; no current branch/PR implements an emergency-session terminal latch.
- Open PR #17 (`devin/issue-3`) is an active umbrella/audit-trail scope. Umbrella #3 was fully read but not mutated; record `SKIPPED_LOCKED` for the umbrella write rather than taking over that PR. #19 and the unique repo/central reports preserve the independent finding.

## Evidence boundary

New #19 is `SOURCE_CONFIRMED`, not `EXECUTED_REPRODUCTION`. No live MiniMax request, Cloudflare deployment, real-patient data, browser accessibility/mobile session, or destructive failure injection was used. Exact inspected HEAD has zero Actions runs. Existing tests cover detection/malformed-output/non-suppression on an emergency turn but do not cover emergency → later benign input lifecycle.

## Writes / coordination

- new actionable Issue: #19
- #19 audit lease acquired/read back: `2026-09-21T14:23:09Z-project-doctor-web-r6`, 90-minute lease
- repo-local report write: success, commit `7a9a96b1f22ce80149f23d8ee1ab8ca23b046ce6`
- umbrella #3 mutation: `SKIPPED_LOCKED` because open PR #17 owns active umbrella scope
- product source/CI/config/secrets/settings/implementation branch/merge/deploy/worker/GOAL/provider write: none

## CLEAN / continuation

`project-doctor-web`: **NOT CLEAN, 0/2**. Round 6 is a complete fixed-50 static/source audit but cannot qualify for CLEAN because it created new P2 #19, current P1 #2/#9/#16 and P2 #14 remain, exact-SHA Actions/runtime/device evidence is incomplete, and required deployment/browser/accessibility paths remain unverified.

Whole portfolio: **NOT CLEAN**, additionally blocked by the 41-vs-42 inventory visibility gap.

Next fixed-50 fair cursor: **`Reese-max/prompt-autoresearch`**.
