# Product-board delta — prompt-autoresearch

Run: `2026-09-22T14:08Z-product-board`  
Rules: `8167e10798071d2276addaff6b201c6b0e904a2a`  
Target inspected pre-report HEAD: `244f7598b0157fa76217f988549869b0577f45b8`  
Underlying product baseline: `723746c96c7fdc03ba3ab9f754b79f7ae6addd75`  
Formal report commit: `34d3fa288b91d89b7b8dd309f92334824dc72e5e`

## Actionable delta

The concurrent full fixed A01–J05 Round 3 established one new independent fingerprint and created [prompt-autoresearch #12](https://github.com/Reese-max/prompt-autoresearch/issues/12):

`prompt-autoresearch + run_app.py local UI server + wildcard interface bind + unauthenticated permissive-CORS mutation endpoints + remote peer can start evolution/final/provider-proxy work`

Classification: `BUG / P1 / HIGH / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`.

Default `run_app.py` binds `ThreadingTCPServer(("", PORT), ...)` while telling the operator to open `localhost`. The same unauthenticated handler exposes `/api/run-evolution`, `/api/run-final`, and an allowlisted provider proxy with `Access-Control-Allow-Origin: *`. When the host is network-reachable, a non-owner peer has a source-confirmed path to start cost-bearing/state-changing work.

Minimum effective scope: loopback-only by default. If an explicit owner-approved external-bind mode remains, require a small configured authorization boundary for mutation routes and a controlled Origin policy. Preserve the provider-host allowlist. Do not build accounts, OAuth, RBAC, database, API gateway, secret broker, or a general auth platform.

Severity is not P0: no owner host exposure, unauthorized request, provider spend, credential disclosure, data loss, or arbitrary-code execution was observed. Network/firewall reachability remains `UNKNOWN`; runtime status is `NEEDS_RUNTIME_VERIFICATION`.

## Evidence and coordination

- Fixed-50 report: https://github.com/Reese-max/prompt-autoresearch/blob/244f7598b0157fa76217f988549869b0577f45b8/docs/audits/50-persona-round-3-2026-09-22-1128Z.md
- Product-board report with independent 30 regression + 20 exploration personas, competitor matrix, executive disagreement, Red Team, NOW/NEXT/LATER/DON'T, and Decision Memo: https://github.com/Reese-max/prompt-autoresearch/blob/34d3fa288b91d89b7b8dd309f92334824dc72e5e/.github/quality-audits/2026-09-22T1400Z-product-board-audit.md
- Report commit: https://github.com/Reese-max/prompt-autoresearch/commit/34d3fa288b91d89b7b8dd309f92334824dc72e5e
- #12 lock `persona-audit / 2026-09-22T11:23:30Z-fixed50-persona-audit` was read across all comments and released `completed` at 2026-09-22T11:28:30Z.
- Fresh all-state Issue/PR search found no duplicate tracker or implementation PR for the fingerprint.
- Existing #1/#4/#7 and PRs #2/#8/#9/#10/#11 remain active and were not mutated.
- [Actions run 35448297228](https://github.com/Reese-max/prompt-autoresearch/actions/runs/35448297228) shows all nine declared matrix jobs and `test-matrix-required` failed. This continues to support existing #4, not executed exploitation of #12.

## Product decision

**INVEST / SIMPLIFY / MAINTAIN**.

CEO top three:
1. close the #12 local-control-plane trust boundary;
2. restore #4 exact-SHA evidence gate;
3. only then run bounded variance and independent legal-SME validation.

Do not add providers, optimizers, hosted observability, multi-tenant SaaS, broad collaboration/RBAC, mobile app, or a general auth framework.

## Accounting

- New actionable root: **1**
- New / updated / reopened Issues: **1 / 0 / 0**
- New product implementation: **0**
- Verified fixed / confirmed regression: **0 / 0**
- Runtime exploit reproductions / paid provider calls: **0 / 0**
- Existing locked scopes modified: **0**
- Portfolio CLEAN: **NO; fixed A01–J05 0/2**
- Inventory visibility remains 41 versus historical 42; no deletion/exclusion inference.

Next fair product-board cursor: **`Reese-max/neciken-summer-poem`**, subject to P0/P1, confirmed regression, or landed-fix pre-emption.
