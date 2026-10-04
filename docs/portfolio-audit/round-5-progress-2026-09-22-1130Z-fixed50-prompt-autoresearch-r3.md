# Fixed 50-Persona portfolio continuation — prompt-autoresearch Round 3

- Run: `2026-09-22T11:23:30Z-fixed50-persona-audit`
- Target: `Reese-max/prompt-autoresearch`
- State: **NEW_ACTIONABLE / NOT_CLEAN / 0/2**
- Fixed A01–J05 spec blob: `6e3499d6ef5be7e123050e1526946f6a40f99263`
- Issue Quality v2 blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Central `autodev-ng/main` immediately before this write: `c835e107ab907fdb58e555925d0463e219c8876b`

## Fresh inventory

Connected owner pagination was repeated: page 1 exposes **41** accessible `Reese-max` repositories and page 2 is empty. Historical fixed-50 checkpoints exposed 42. Preserve the one-repository visibility/access gap; do not infer deletion, exclusion, or CLEAN for the missing historical repository. Whole-portfolio CLEAN remains ineligible while inventory completeness is uncertain.

## Target baseline / evidence

- default branch: `master`
- inspected pre-report HEAD: `13b895f34745c4a0c624479173d3a04514f485fb`
- underlying product baseline remains `723746c96c7fdc03ba3ab9f754b79f7ae6addd75`
- Round-3 audit-only commit: `244f7598b0157fa76217f988549869b0577f45b8`
- report: https://github.com/Reese-max/prompt-autoresearch/blob/244f7598b0157fa76217f988549869b0577f45b8/docs/audits/50-persona-round-3-2026-09-22-1128Z.md

The post-report default HEAD was read back and its parent is exactly the inspected HEAD; the only change is the new audit report. It is not credited as a product fix.

Exact inspected HEAD Actions evidence remains run `35448297228` (`completed/failure`). The 9 OS/Python matrix jobs reached their declared test path and failed, and the aggregate `test-matrix-required` job failed. This remains evidence for existing P1 #4, not proof of the new security path.

## New actionable finding

Created and read back:

- **#12 — P1 BUG — Keep local UI mutation endpoints loopback-only or authenticated**
- Issue: https://github.com/Reese-max/prompt-autoresearch/issues/12
- Classification: `BUG / P1 / CONFIRMED / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`
- Fingerprint: `prompt-autoresearch + run_app.py local UI server + wildcard interface bind + unauthenticated permissive-CORS mutation endpoints + remote peer can start evolution/final/provider-proxy work`

Source causal chain at the inspected SHA:

1. `run_app.py` permits wildcard CORS and `/api/run-evolution` / `/api/run-final` launch subprocesses without request authentication: https://github.com/Reese-max/prompt-autoresearch/blob/13b895f34745c4a0c624479173d3a04514f485fb/run_app.py#L429-L489
2. `/api/proxy` accepts caller-supplied provider URL/headers/body within the existing provider-host allowlist, without caller authorization: https://github.com/Reese-max/prompt-autoresearch/blob/13b895f34745c4a0c624479173d3a04514f485fb/run_app.py#L499-L547
3. `main()` binds `ThreadingTCPServer(("", PORT), ...)` while console guidance says `localhost`: https://github.com/Reese-max/prompt-autoresearch/blob/13b895f34745c4a0c624479173d3a04514f485fb/run_app.py#L552-L565

P1 is retained rather than P0: the source-level authorization boundary is missing on a supported core UI path and can start state-/cost-bearing work when the host is network reachable, but this run did not establish actual public/LAN exposure of an owner machine, secret exfiltration, data loss, arbitrary-code execution, or observed unauthorized spend. Network/firewall reachability is still UNKNOWN. No attack or provider call was executed.

Minimum correction stays local: bind loopback by default; only if an owner-approved external-bind mode is retained, require a small configured authorization token/equivalent on mutating routes and a controlled Origin policy. Preserve provider-host allowlisting. No account platform, OAuth, database, API gateway, queue, or cross-project framework is justified.

## Dedupe / coordination

Immediately before creating #12, Issue and all-state PR search found no matching `run_app` / wildcard-bind / CORS / unauthenticated mutation / proxy fingerprint. Branch searches for `feedback` and `auth` were empty.

Existing active scopes remain untouched:

- #1 P2 → PR #2 open/unmerged
- #4 P1 → PR #9 and #10 open/unmerged
- #7 P2 → PR #8 and #11 open/unmerged

Historical issue locks for #1/#4 are released; #7 has no issue comments. No active exact `owner-prompt-autoresearch` heartbeat was surfaced. Unmerged PRs are candidate evidence only and receive no current-product fix credit.

Issue #12 lock lifecycle was written and read back:

- acquire: `github-issue-lock:v1`, run `2026-09-22T11:23:30Z-fixed50-persona-audit`, lease through `2026-09-22T12:53:30Z`
- release: same run/repo/issue, `status=completed`, evidence `report-244f7598b0157fa76217f988549869b0577f45b8`

The related `api/server.py` explicit external feedback mode also lacks request authentication, but this round intentionally does **not** create a second issue: it defaults to `127.0.0.1`, external binding is explicit, and #12 is the stronger current-product trust-boundary root to fix first. Re-evaluate separately only after #12 if a remaining independent P2+ supported failure is established.

## Fixed-50 / runtime accounting

Round 3 contains a newly rechecked 50-row A01–J05 matrix and all ten required dimensions; it is not a copied NO_CHANGE round. New #12 maps especially to A05, B02, C05, D03–D05, E04, F01, H04–H05, I01, J02–J05. Existing #1/#4/#7 remain mapped separately.

No paid provider call, external-network probe, browser-origin attack, mobile/keyboard/screen-reader/200%-zoom session, timeout/429/5xx injection, production deployment, product source/config/CI change, implementation branch, merge, deploy, worker or GOAL was started.

For #12 the safe next runtime step is an isolated server test with subprocess/provider forwarding mocked, asserting actual listen address and zero side effects for unauthorized requests. Until that exists, #12 remains `SOURCE_CONFIRMED / NEEDS_RUNTIME_VERIFICATION`.

## CLEAN / continuation

- new independent actionable P0/P1/P2 findings: **1** (#12 P1)
- confirmed new regressions: **0**
- reopened findings: **0**
- landed fixes verified: **0**
- qualifying CLEAN rounds added: **0**
- `prompt-autoresearch`: **NOT CLEAN, 0/2**
- portfolio: **NOT CLEAN**; inventory completeness uncertain

The new P1 resets/holds the target's clean streak at zero. Audit-only writes do not count as product changes.

Next fair fixed-50 cursor: **`Reese-max/neciken-summer-poem`**, unless a newly landed P0/P1 fix or confirmed regression pre-empts the rotation.
