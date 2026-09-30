# Portfolio 50-Persona Audit Continuation — 2026-09-14 — 92-duty-scheduler

Protocol: `docs/portfolio-audit/2026-09-06-50-persona-audit.md`

Repository: `Reese-max/92-duty-scheduler`  
Round: 4  
Status: **NOT CLEAN — 0/2**

Repo report: `Reese-max/92-duty-scheduler/docs/audits/50-persona-round-4-2026-09-14.md`

## P0 #14 remains reproducible

Round-start `main` was `f9356a245b114086e8b103c7f82d587bb9b78c09`. No product/auth implementation change landed after the Round-3 product SHA `9a916b5ada2b1994d14bccdd780eb70ac564334d`; only audit/product-board documentation changed.

Current timetable source still permits the deterministic anonymous GET → returned victim-bound student token → POST for the same victim flow. The candidate admin-only write repair in PR #17 remains open/draft/unmerged and stacked on open/draft PR #16, so it is not counted as default-branch remediation. No production exploit or deployment claim is made.

## Existing P2 #21 added to portfolio CLEAN gate

README and `docs/DEPLOY.md` still present `2026-09-01` as a Monday even though it is Tuesday; the scheduling epoch path has no demonstrated invalid-weekday rejection gate. The tracked tenant config itself uses valid Monday `2026-02-23`, so this does not claim current production dates are shifted.

#21 is now mapped to the fixed persona set and remains a P2 blocker pending deterministic week-start tests plus isolated configure → schedule → review → Excel/LINE runtime smoke.

## New P2 #29 — default-branch CI gate is not executing

`.github/workflows/deploy.yml` declares checkout → Node 22 → `npm ci` → `npm run check` as the blocking `check` job.

Actual recent evidence:

- run `34258993534` on `3c183d902045014b98ca5e396aef97663f39d9e6`: check `failure`, `runner_id=0`, empty runner, `steps=[]`;
- run `34454287313` on `f9356a245b114086e8b103c7f82d587bb9b78c09`: same zero-step fingerprint;
- repo audit commit `4d7d7d4911ffd580630661a2f71079a2c38c6ae1` triggered run `34791355027`: again `failure`, `runner_id=0`, empty runner, `steps=[]`; deploy jobs skipped.

New actionable issue: `Reese-max/92-duty-scheduler#29` — `[P2][50-persona audit] Restore an actually executing default-branch CI gate`.

These receipts prove only that no workflow steps executed. They do not identify the GitHub-side admission/platform cause and do not prove an application, dependency, test, Cloudflare credential, or deployment failure.

Affected fixed personas: C05, D03, H03, H05, I05, J04, J05.

## Remaining gates

- P0 #14: land a real ownership/admin-only boundary and obtain isolated deployment negative-smoke evidence.
- P2 #21: enforce the semester/week-start contract and prove user-facing schedule/export behavior.
- P2 #29: restore an actually executing remote gate and obtain the required consecutive executed successes.
- Existing P2 #12 and required browser/mobile/accessibility/concurrency runtime paths remain unresolved.
- After fixes land, rerun the same fixed A01–J05 personas; only two consecutive qualifying rounds with no new P0/P1/P2 findings can mark the repository CLEAN.

## Portfolio stop condition

Not reached. `92-duty-scheduler` remains NOT CLEAN and the broader portfolio still contains unresolved P0/P1/P2 findings.
