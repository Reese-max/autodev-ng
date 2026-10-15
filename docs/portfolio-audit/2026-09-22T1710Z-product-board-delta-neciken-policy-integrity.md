# Product Board Delta — neciken-summer-poem policy integrity

- Run: 2026-09-22T17:10:00Z
- Product repository: `Reese-max/neciken-summer-poem`
- Inspected pre-report HEAD: `6911b59273349f07a40d874802191191ee4e1a7e`
- Last product-facing baseline: `3572303c0ddc598a8f4c9272b884ca91d47e1480`
- Product-board report commit: `38c614bac410aee7e00bcc008bc364593d9efd29`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Status: PARTIAL portfolio rotation; product round complete for this repository; portfolio NOT CLEAN (0/2)
- Next fair product-board cursor: `Reese-max/note-filler`

## Outcome

The fixed A01–J05 Round 4 audit discovered one new independently actionable root cause and created [Issue #8](https://github.com/Reese-max/neciken-summer-poem/issues/8). This product-board pass confirmed the issue is not a duplicate of #3 or #4 and wrote the complete product report:

- [Product-board report](https://github.com/Reese-max/neciken-summer-poem/blob/38c614bac410aee7e00bcc008bc364593d9efd29/.github/quality-audits/2026-09-22T1700Z-product-board-audit.md)
- [Fixed A01–J05 Round 4 evidence](https://github.com/Reese-max/neciken-summer-poem/blob/6911b59273349f07a40d874802191191ee4e1a7e/docs/audits/50-persona-round-4-2026-09-22-1443Z.md)
- [Fixed-persona central continuation](https://github.com/Reese-max/autodev-ng/blob/6b32877e59b535992312f21d8eac6f0a54cfde92/docs/portfolio-audit/round-5-progress-2026-09-22-1450Z-fixed50-neciken-summer-poem-r4.md)

## New actionable finding

Fingerprint:

`Reese-max/neciken-summer-poem + contest discovery draft/promotion + extracted AI policy is 禁止 or 未明示 + draft profile records 允許 + build_ai_draft hard-codes allowed and promotion does not compare against source evidence`

Classification:

- kind: BUG
- severity: P1
- decision_priority: HIGH
- triage: NEEDS_REVIEW
- auto_implementation: false
- confidence: CONFIRMED / SOURCE_CONFIRMED
- runtime: NEEDS_RUNTIME_VERIFICATION

The official candidate may record AI as prohibited or unstated, but `build_ai_draft()` substitutes allowed and promotion validates only the enum shape. A formal profile can therefore carry the opposite policy from its stored official evidence. #4’s downstream export gate cannot reconstruct the lost source meaning, and #3 addresses freshness/revision identity rather than this deterministic substitution.

Minimum effective scope: preserve the candidate’s three-state policy, compare it against the existing evidence at promotion, and reject a mismatch inside the existing promotion lock. No database, policy framework, account system, queue, hosted monitor, or auto-submission.

## Ownership and lock safety

- Issue #8’s creation lease was read back and released by the fixed-persona audit.
- PR #6 is active in the same component and retains the hard-coded allowed value at `ab9150df0f943f42e2505808314c2649ed8b74fa`.
- This pass did not comment on #8, alter PR #6, take ownership, change scope, or start implementation.
- Issues #1, #3, and #4 and PRs #2, #5, #6, and #7 remain owner-controlled.
- DNS/redirect internal-fetch concerns remain `NOT_ESTABLISHED / NEEDS_EVIDENCE`; no issue was created.

## Evidence boundary

Exact current-head Actions run [35458471556](https://github.com/Reese-max/neciken-summer-poem/actions/runs/35458471556) has `runner_id=0` and `steps=[]`. Cause is UNKNOWN. It is a validation gap, not evidence that product tests passed or failed.

No live contest submission, external provider, production deployment, credential, mobile, Windows, browser, screen-reader, or assistive-technology verification was executed. No fix is marked VERIFIED_FIXED and no regression is claimed.

## Product direction

Recommendation remains **INVEST / SIMPLIFY / MAINTAIN**:

1. Preserve official policy through draft and promotion.
2. Complete the existing formal-export gate.
3. Restore exact-head executable evidence, then finish the already-owned freshness path.

Do not expand to marketplace, accounts, social discovery, payment, CRM, automatic submission, a universal policy engine, or a shared evidence platform.

External official sources were refreshed on 2026-09-22 for [Submittable](https://submittable.help/en/articles/904856-how-can-i-submit), [Duotrope](https://duotrope.com/about/), [Chill Subs](https://support.chillsubs.com/how-tos/how-to-use-our-submission-tracker), and [Visualping](https://visualping.io/blog/how-to-monitor-website-changes). They support reliability, traceability, discovery, and status tracking as comparison dimensions, not independent demand or outcome evidence.

## Accounting

- New actionable findings: 1
- New issues attributable to the underlying Round 4 discovery: 1 (#8)
- Additional issues/comments from this product-board pass: 0
- Updated/reopened issues: 0
- Duplicate issues avoided: 2
- Active PR scopes changed: 0
- Product implementation writes: 0
- Runtime reproductions: 0
- Verified fixed: 0
- Confirmed regressions: 0
- Report writes: 2 (product report plus this central delta)
- Portfolio CLEAN: no, 0/2
