# Product-board delta — avatar-vfo PR #9 preview isolation blockers

- Run: `2026-09-17T19:58:00Z-product-board`
- Status: `ACTIONABLE_PRE_MERGE_FINDINGS / SKIPPED_LOCKED / NOT_CLEAN`
- Governing rule blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Central state base HEAD before this write: `7194933d8f6a7926fd5bd7e4c2e25e3b60943d6f`
- Repository: `Reese-max/avatar-vfo`
- Inspected default HEAD: `1226629dba0e82921504beb9169e4cdf43ad3797` (audit-only; last product baseline `b94ae9b82df76055301a25f4d9aa6e7a375d11b1`)
- Candidate: PR #9, head `9e353ad67f87d5fbec6835f9a9fb80e48ae0a117`
- Existing tracking: Issue #3 and two unresolved PR review threads
- Inventory receipt: 41 owner-visible repositories; 40 unarchived; this was an incremental fair-cursor pass, not a full portfolio deep audit

## Finding 1 — PR-controlled code receives the production authentication authority

- kind: `BUG`
- severity: `P1`
- decision_priority: `HIGH_PRE_MERGE`
- evidence: `SOURCE_CONFIRMED`
- triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- runtime: `NEEDS_RUNTIME_VERIFICATION`
- fingerprint: `avatar-vfo / pull_request preview smoke / same-repository PR job runs checked-out smoke.mjs with repository AUTH_SECRET / PR-controlled code can read or transmit production token-issuing authority`

PR #9 runs on `pull_request`, checks out the PR head, and then executes the checked-out `worker/scripts/smoke.mjs` with `VFO_SMOKE_SECRET: ${{ secrets.AUTH_SECRET }}`. The repository's own `AGENTS.md` says secrets must only be configured through Wrangler or the Cloudflare Dashboard, while `wrangler.toml` identifies `AUTH_SECRET` as the Worker secret used by the deployed service.

That value is not a narrow smoke credential. The smoke script uses it at `POST /api/auth/token` to mint tokens for caller-chosen user IDs. A same-repository PR can modify the executed script before review; if the repository secret is the production value, the PR-controlled process receives production token-issuing authority and can transmit it or mint identities outside the intended test. If the GitHub secret is absent, the proposed release gate always stops at usage error 2 and never satisfies Issue #3.

GitHub's official secure-use guidance, checked 2026-09-17, states that repository write users can read repository secrets and recommends least privilege plus protected environment secrets/review: https://docs.github.com/en/actions/reference/security/secure-use

### Minimum safe scope

Do not inject the production `AUTH_SECRET` into code checked out from a PR. Use one of these bounded approaches:

- a dedicated preview-only Worker/environment with a preview-only auth credential and no production authority; or
- run the deployed smoke from trusted, reviewed code after merge/approval while targeting an isolated preview environment.

Do not add a generalized secret broker, OAuth suite, or identity platform. The acceptance condition is simply that PR-controlled code cannot receive production authentication authority and the preview gate remains runnable.

## Finding 2 — the “non-production” smoke writes through the production D1 binding

- kind: `BUG`
- severity: `P1`
- decision_priority: `HIGH_PRE_MERGE`
- evidence: `SOURCE_CONFIRMED`
- triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- runtime: `NEEDS_RUNTIME_VERIFICATION`
- fingerprint: `avatar-vfo / version-preview smoke / wrangler versions upload uses sole vfo-adam D1 binding / PR smoke creates and deletes rows in production database and exceptions can leave residue`

The workflow calls `wrangler versions upload` without a named preview environment. At the inspected PR head, `worker/wrangler.toml` has one `DB` binding and it points to the sole `vfo-adam` D1 database ID. The smoke then creates an avatar before later isolation checks and cleanup. Its cleanup is not in a `finally` block, so a timeout, network error, unexpected response, or thrown request after creation can terminate the process and leave the row behind.

Cloudflare's official Workers documentation, updated 2026-07-03 and checked 2026-09-17, says a version captures code, assets, bindings, and compatibility settings, while storage state is not versioned: https://developers.cloudflare.com/workers/versions-and-deployments/

Cloudflare's D1 environments documentation, updated 2026-09-17 and checked the same day, explicitly shows staging and production using different D1 database IDs: https://developers.cloudflare.com/d1/configuration/environments/

Therefore a version-preview hostname is not, by itself, a data-isolation boundary. The candidate's statement that the gate runs against a non-production target is incomplete while the uploaded version retains the production D1 binding.

### Minimum safe scope

Give the preview upload a dedicated preview D1 binding and preview-only secrets, then run the existing bounded smoke against that environment. Keep best-effort cleanup, but do not treat cleanup as the isolation boundary. No new database framework, tenant ledger, or production failure injection is required.

## Execution evidence

- PR head Actions: Deploy run 35174753426 and CI run 35174753495 both concluded `failure`.
- Deploy's `deploy-preview` and all four CI jobs expose `steps=null` and no logs; production deploy was correctly skipped for the PR event. This proves there is no GitHub-hosted green receipt for the head, but does not prove a repository test or workflow-code failure.
- Issue #3's owner-authored update reports local backend 56/56, Worker 43/43, frontend 5/5/build, and actionlint success. Those claims support the local harness only; they do not execute Cloudflare version upload, secret isolation, or remote D1 isolation.
- The owner comment attributes current zero-step failures to an Actions budget annotation. This run did not retrieve that annotation independently, so it is retained as source-reported context rather than inferred from `steps=null`.
- No Cloudflare deployment, secret read/change, D1 mutation, paid provider call, browser session, or production failure injection was performed.

## Ownership, dedupe, and Red Team

- Issue #3 is open; PR #9 is open with an active owner branch and two unresolved review threads. Result: `SKIPPED_LOCKED`; no Issue, PR, label, review, branch, or lock mutation was made.
- Finding 1 maps to Issue #3 and review thread: https://github.com/Reese-max/avatar-vfo/pull/9#discussion_r4032573981
- Finding 2 maps to Issue #3 and review thread: https://github.com/Reese-max/avatar-vfo/pull/9#discussion_r4032573984
- Red Team accepted that the local socket harness proves fail-closed HTTP assertions and that `versions upload` avoids immediately promoting code to 100% traffic.
- Red Team rejected treating a preview URL as an isolated environment: the repository configuration carries the production data binding, and the smoke intentionally performs writes.
- Red Team rejected copying the production auth secret into GitHub merely to make the job runnable; a preview-only credential or trusted post-review runner is smaller and safer.

## Product-board, alternatives, and persona continuity

The prior complete product-board report at `.github/quality-audits/2026-09-07-2217-product-board-audit.md` remains the current 50-persona and competitor baseline because default-branch product code has not changed since `b94ae9b`. This delta preserves all 30 regression personas and 20 exploratory personas; it does not rotate or replace A01–J05.

Affected baseline journeys are B02 (safe release), C01/C03/C05 (privacy and deletion), D03 (access control), H03/H04/H05 (multi-user isolation and operator safety), I05 (secret handling), and J05 (deploy recovery). Their modeled result remains `FAIL/PARTIAL/UNKNOWN` until an isolated preview receipt exists. This is synthetic review, not human testing or occurrence-rate evidence.

Current alternative-workflow benchmark, checked 2026-09-17:

- `MUST MATCH`: preview execution must not possess production identity authority or write to production persistence.
- `SHOULD BE BETTER`: retain the useful 18-check HTTP smoke while making environment identity explicit and replayable.
- `DIFFERENTIATOR`: keep the product's inspectable VFO state and self-hosting model; release isolation is trust infrastructure, not a feature differentiator.
- `DO NOT COPY`: do not add broad environment orchestration, a secret platform, or a second production-like stack beyond the smallest isolated preview boundary.

The prior Inworld, Convai, Character.AI, and SillyTavern comparison remains valid for product direction; no new competitor feature was promoted into a defect. Recommendation remains `INVEST / SIMPLIFY`.

## Product-board disposition

- NOW: block merge of PR #9 until both the credential and D1 preview boundaries are isolated.
- NEXT: obtain an actual PR/preview run after the Actions admission blocker is cleared; record the preview environment, deployed version, and smoke receipt.
- LATER: only after review and explicit owner approval, promote the repaired auth build and verify the production deployed SHA.
- DON'T: copy the production secret into GitHub, run destructive smoke against production storage, or declare Issue #3 fixed from local tests.
- CEO three choices: isolate preview authority/data; restore a real green release receipt; then promote the security remediation. Do not build marketplace, voice, 3D, or generalized deployment infrastructure.

## Accounting

- Total findings: 2
- Severity: P0 0 / P1 2 / P2 0 / P3 0
- New Issues: 0
- Updated/Reopened Issues: 0
- Duplicate mappings: 2/2
- `SKIPPED_LOCKED`: 1 active remediation scope
- Verified fixed: 0
- Issue write blocked: 0
- Report write blocked: 0
- Fixed A01–J05 CLEAN: NO, qualifying rounds `0/2`
- Next fair cursor: `project-doctor-web`
