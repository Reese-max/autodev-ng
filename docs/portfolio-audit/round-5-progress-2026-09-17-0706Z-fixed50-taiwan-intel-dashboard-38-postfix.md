# Portfolio audit continuation — taiwan-intel-dashboard #38 post-fix re-verification

- Run ID: `2026-09-16T23:06:29Z-r11-ti38-firstpaint`
- Local date: 2026-09-17 (Asia/Taipei)
- Fixed-50 rules blob: `6e3499d6ef5be7e123050e1526946f6a40f99263`
- Issue Quality v2 blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Current accessible Reese-max-owned inventory checked this run: **42 repositories**
- Priority lane: post-fix regression verification
- Preserved fairness cursor: `tick-stock-panel`

## Why the fairness cursor did not advance

The previous continuation left `tick-stock-panel` as the next fairness target. Before advancing it, default-branch comparison found that `Reese-max/taiwan-intel-dashboard` Issue #38 had a product fix merged after the prior audit. Per portfolio priority rules, a landed fix for an existing P0/P1/P2 finding is re-verified before ordinary discovery. No fairness item was silently marked complete; the cursor remains `tick-stock-panel`.

## Re-verification target

Repository: `Reese-max/taiwan-intel-dashboard`

- current inspected product HEAD before audit-only write: `29a45b339ee257383073717105391757cd55ae70`
- fix under review: `830b1dc518672a2203fdcba1c70140cf0eefa6f8`
- tracked Issue: https://github.com/Reese-max/taiwan-intel-dashboard/issues/38
- result: `REGRESSION / PARTIALLY_FIXED / BUG / P2`
- confidence: `CONFIRMED`
- evidence: `SOURCE_CONFIRMED`
- runtime: `NEEDS_RUNTIME_VERIFICATION`
- triage: `NEEDS_REVIEW`
- `auto_implementation=false`

The fix correctly added manifest/hash-aware event/map loaders, fail-closed network snapshot handling, and bounded verified full-refresh behavior. A narrower path remains: application startup still calls `loadMapEvents(getState().scope)` before manifest locking and can promote the slim map payload without an expected cohort hash. A later verified refresh can correct it, but #38's D2 condition that event/map/network projections be promoted from one locked cohort is still not fully satisfied.

This is the same fingerprint/root cause as #38, so the closed Issue was reopened rather than creating a duplicate. No new Issue was created.

## Persistence

Repository audit report:
https://github.com/Reese-max/taiwan-intel-dashboard/blob/main/docs/audits/50-persona-issue-38-postfix-regression-2026-09-17-0706Z.md

Repository audit report commit: `4521d46411a2944fea446ce90f6f83ab3506a0f0`

The report is explicitly a **targeted post-fix pass**, not a full 50/50 qualifying round. Affected baseline persona regression subset rechecked: `C01, C05, D01, D02, D05, G05, H04, H05, I04, I05, J02, J03, J05`. Baseline identity/success criteria were not changed. Remaining personas were not claimed as rerun.

## Runtime evidence

The inspected SHA has successful Actions activity, including scheduled run:
https://github.com/Reese-max/taiwan-intel-dashboard/actions/runs/35155636279

This confirms the schedule executed successfully on the exact inspected SHA. It does not execute the browser first-paint staggered-artifact race, so the finding remains source-confirmed rather than `EXECUTED_REPRODUCTION`.

## CLEAN state

`taiwan-intel-dashboard`: `NOT CLEAN`, streak `0/2`.

This targeted pass is not a complete fixed-50 round and does not increment the streak. Reopening P2 #38 prevents CLEAN regardless. No portfolio CLEAN claim is possible.

## Next continuation

1. Resume fairness cursor at `tick-stock-panel` unless a higher-priority landed P0/P1/P2 fix or confirmed regression pre-empts it.
2. For #38, after a future fix reaches default branch, rerun the same startup deployment-race scenario first; sufficient root-cause regression coverage is enough for the individual Issue, while portfolio CLEAN still follows the full fixed-50/two-round rules.
3. Do not treat audit-only commit `4521d464...` as a product change.

No product source, CI/config, secrets, permissions/settings, merge, deploy, worker, GOAL, or paid operation was changed by this audit.