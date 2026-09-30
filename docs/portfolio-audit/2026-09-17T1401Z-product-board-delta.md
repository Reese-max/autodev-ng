# Product-board delta — 92-duty-scheduler PR #17 student-save regression

- Run: `2026-09-17T14:01:00Z-product-board`
- Status: `ACTIONABLE_PRE_MERGE_FINDING / SKIPPED_LOCKED / NOT_CLEAN`
- Governing rule blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Repository: `Reese-max/92-duty-scheduler`
- Inspected default HEAD: `4d7d7d4911ffd580630661a2f71079a2c38c6ae1` (audit-only; last product/auth baseline `9a916b5ada2b1994d14bccdd780eb70ac564334d`)
- Candidate: PR #17, head `8306c3727628279f2d0600c07ac630ea1b6488b6`, stacked on PR #16
- Existing tracking: Issue #14

## Finding

- kind: `BUG`
- severity: `P2`
- decision_priority: `HIGH_PRE_MERGE`
- evidence: `SOURCE_CONFIRMED`
- triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- runtime: `NEEDS_RUNTIME_VERIFICATION`
- fingerprint: `92-duty-scheduler / student timetable save / merge PR #17 admin-only POST while existing UI sends student token / every student self-save receives 401`

PR #17 closes the anonymous write chain by changing `POST /api/students/timetable` to accept only the administrator credential. That direction blocks the P0 exploit, but it also conflicts with the currently shipped, explicitly supported student self-fill journey.

At the inspected default HEAD, `/timetable` tells a student to enter a student ID, load the timetable, edit it, and save it. The page:

1. calls `GET /api/students/timetable?id=<student_id>`;
2. stores the returned `result.token` as `currentToken`;
3. sends `Authorization: Bearer ${currentToken}` and the same token in the POST body;
4. treats HTTP 200 as the successful save condition.

PR #17 changes the POST guard to `verifyAuth(context.request, context.env)`, which validates the administrator secret, not the student token minted by GET. It does not update the page or replace the student save contract. If merged as inspected, every supported student load → edit → save attempt reaches the endpoint and receives 401.

## Why the green test does not close the risk

The stacked Actions run 34033872896 passed 24 authentication tests, but PR #17 adds only a positive administrator-write case. It does not execute the shipped student-token positive journey. Existing Issue #14 acceptance also requires confirmation that the existing viewer/editor flows still work.

Evidence boundary: this is a deterministic source-level contract conflict on an unmerged PR. No production deployment or browser/provider runtime was exercised, so it is not reported as a default-branch regression or production incident.

## Severity calibration and minimum safe scope

`P2 / HIGH_PRE_MERGE` is appropriate because the candidate is not on the default branch, but merging it unchanged would broadly block the supported core self-fill completion path. It is not promoted to P0/P1 on hypothetical deployment impact.

The owner should choose one narrow product contract before merge:

- preserve student self-fill by replacing the caller-selectable bootstrap with a verifiable identity boundary and add one positive end-to-end regression for the shipped journey; or
- explicitly approve an admin-only scope change, remove the UI promise and student save attempt, and provide a truthful recovery/admin workflow.

No OAuth suite, identity platform, new database, or generalized authorization framework is required by this finding.

## Ownership, dedupe, and Red Team

- Issue #14, PR #16, and PR #17 have active owner/branch/review state. Result: `SKIPPED_LOCKED`; no Issue or PR mutation was made.
- The finding maps to Issue #14's remediation acceptance scope, so no duplicate Issue was created.
- Red Team rejected keeping the present student-token POST as-is: because GET anonymously mints a token for a caller-selected student ID, that preserves the P0 chain.
- Red Team also rejected declaring PR #17 safe from its green run: the run proves administrator success and rejection cases, not the existing student completion path.

## Other inspected evidence

- PR #32 remains active work for existing Issue #31 (SheetJS import/export split); its zero-step Actions failure maps to Issue #29 and did not establish a new product root cause.
- PR #33 is documentation-only work for existing Issue #12; its zero-step Actions failure also maps to Issue #29.
- Default-branch P0 Issue #14 remains `STILL_REPRODUCIBLE`; PR #17 is not merged.
- Fixed A01–J05 state remains `NOT_CLEAN`, qualifying rounds `0/2`.

## Accounting

- Total findings: 1
- Severity: P0 0 / P1 0 / P2 1 / P3 0
- New Issues: 0
- Updated/Reopened Issues: 0
- Duplicate mapping: 1/1 → Issue #14
- `SKIPPED_LOCKED`: 1
- Verified fixed: 0
- Issue write blocked: 0
- Report write blocked: 0
- Portfolio CLEAN: NO
- Next fair cursor: `cf-ai-router`