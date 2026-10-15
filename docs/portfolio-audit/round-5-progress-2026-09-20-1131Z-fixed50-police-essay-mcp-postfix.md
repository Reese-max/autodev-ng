# Portfolio audit continuation — police-essay-mcp priority post-fix verification

Run: `2026-09-20T11:31:00Z-persona-audit-11-police-essay-mcp-postfix`

Status: **TARGETED POST-FIX VERIFICATION / NOT CLEAN / 0/2**

## Protocol / inventory

- Fixed A01–J05 protocol blob: `6e3499d6ef5be7e123050e1526946f6a40f99263`.
- Issue Quality v2 blob: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Central `autodev-ng/main` was re-read immediately before this write at `a1679190111f96c96693ff342caf589b9d4c52a8`.
- Fresh connected-owner pagination exposed **38 Reese-max-owned repositories** in this run. Historical checkpoints exposed 42. Preserve the visibility/access gap; do not infer deletion, exclusion, or CLEAN. Whole-portfolio CLEAN is ineligible while the inventory is incomplete.
- Product-board direction for `police-essay-mcp` remains NARROW/local-first: secure remote use before connector expansion, verify the real 44-line export/renderer journey, and avoid OCR/grading/LMS/cloud-sync/collaboration/general-IAM expansion.

## Priority lane selection

The persisted fair fixed-50 cursor was `Reese-max/prompt-autoresearch`, whose current default remains the prior Round-2 audit-only HEAD `13b895f34745c4a0c624479173d3a04514f485fb`; no new product change was found there during the bounded cursor precheck.

A higher-priority lane pre-empted the cursor: `Reese-max/police-essay-mcp` still had open P1 #1, and four commits of real product/test/config changes landed after its Fixed-50 Round 1 audit. The current inspected product HEAD is `92b10e3a20d21a0803176fdb67e551646fdd3696`.

Target report was written and read back at:

- report: `.github/quality-audits/2026-09-20T1131Z-postfix-verification.md`
- report commit: `ed7a905cf5e03fa053ab5ef20d63f032c12ad899`
- URL: https://github.com/Reese-max/police-essay-mcp/blob/ed7a905cf5e03fa053ab5ef20d63f032c12ad899/.github/quality-audits/2026-09-20T1131Z-postfix-verification.md

The report commit is audit-only and does not count as product remediation.

## Re-verification results

### #1 — P1 remote/tunnel owner authorization

Outcome: **PARTIALLY_FIXED / STILL_REPRODUCIBLE**.

Current source now checks a configured bearer token before MCP handling and refuses explicitly non-loopback `HOST` without authentication unless anonymous remote is explicitly allowed. However the documented/default tunnel workflow still starts on `127.0.0.1`; mandatory-auth configuration is keyed to `HOST`, and `tokenMatches()` accepts all requests when no token is configured. A tunnel can therefore proxy the loopback listener without the product enforcing the README's instruction to set a token.

The current HTTP integration test always supplies `MCP_AUTH_TOKEN`, so it does not cover the original `loopback + tunnel + no token` failure condition. #1 remains `BUG / P1 / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`. No production exploit was claimed.

A new audit comment was added under a verified 90-minute persona-audit lease; final release is recorded after target/central write verification.

### #3 — P2 overlapping expectedVersion edits

Outcome: **PARTIALLY_FIXED / source correction present / NEEDS_RUNTIME_VERIFICATION**.

Current `FileStore` serializes writes per answer ID, re-reads current state inside the lock, checks expected version at commit time, and uses UUID temporary files. A current regression test defines two concurrent expectedVersion=1 writes and requires one success/one conflict. This closes the original single-process source path without architectural expansion.

Exact current-SHA CI did not execute recorded steps, so the audit does not promote this to executed reproduction or VERIFIED_FIXED. #3 remains open pending a bounded current/recent-code execution receipt. The Issue was updated under a verified audit lease.

### #4 — P2 retrievable export artifact for remote MCP clients

Outcome: **STILL_REPRODUCIBLE** on current default. Export tools still return server-local paths; no bounded authenticated artifact download/resource/handle exists. No duplicate Issue or status-only comment was created.

## CI / runtime evidence boundary

Exact product SHA `92b10e3a20d21a0803176fdb67e551646fdd3696` has push CI run `35507096168`, conclusion `failure`. Node 20 and Node 22 jobs both expose zero recorded steps. Record this as an admission/validation gap of unknown cause; do not infer product test failure or guess billing/runner/quota/YAML causes.

No live tunnel, ChatGPT connector, Office/LibreOffice, browser/mobile/accessibility session, production-data mutation, failure injection, deployment, paid-provider action, worker, or GOAL was started.

## CLEAN / notification / continuation

- New independent actionable P0/P1/P2 findings: **0**.
- Confirmed new current-default regressions: **0**.
- Landed fixes re-verified: **#1, #3**.
- New/reopened Issues: **0**.
- Qualifying full fixed-50 rounds added: **0**.
- `police-essay-mcp`: **NOT CLEAN, 0/2**.
- Low-noise notification trigger: **NONE**.

Reasons: #1 remains reachable on the supported loopback+tunnel no-token path; #4 remains; #3 lacks executed post-fix evidence; required exact-head remote/export/render/mobile/accessibility runtime receipts remain incomplete.

Because this was a priority post-fix lane rather than a fair-rotation round, the next fixed-50 fair cursor remains **`Reese-max/prompt-autoresearch`**.
