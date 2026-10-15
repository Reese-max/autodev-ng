# Portfolio Fixed 50-Persona Audit — police-exam-archive Round 4

Run: `2026-09-21T08:36:10Z-persona-audit-police-exam-archive-r4-resume`

Status: **NOT CLEAN — clean streak 0/2**

> Fixed A01–J05 synthetic persona simulation plus repository/CI evidence review. Not 50 human participants or 50 independent validations.

## Governing rules

- `docs/portfolio-audit/2026-09-06-50-persona-audit.md` blob `6e3499d6ef5be7e123050e1526946f6a40f99263`.
- `docs/portfolio-audit/2026-09-14-issue-quality-v2.md` blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- `autodev-ng/main` was re-read before this unique-file write at `5db5f6a38b008cf8790b103fb21b288637443d65`.

## Inventory / fair continuation

Fresh owner enumeration was fully paged: **41 currently accessible Reese-max repositories** and the next page was terminal empty. Older checkpoints exposed 42; retain this as an inventory visibility/access gap. Whole-portfolio CLEAN is therefore ineligible.

The incoming fair cursor was `Reese-max/octobroker`.

- `Reese-max/octobroker/main` = `b669101c0ef4a2c03c1ddcb2b99c014fd1947d29`, exactly equal to `openabdev/octobroker/main`; mirror-fork exclusion, no upstream defect attributed to Reese-max.
- `Reese-max/openab/main` = `50424ed461776fc4b817a85ee08052533f511d1e`, exactly equal to `openabdev/openab/main`; mirror-fork exclusion.
- Cursor then advanced to `Reese-max/police-exam-archive` for a due complete recheck.

Next fair cursor: **`Reese-max/police-exam-practice`**, subject to priority P0/P1/regression/landed-fix preemption.

## Repository / inspected revision

- Repo: `Reese-max/police-exam-archive`
- Default branch: `master`
- Current/inspected HEAD immediately before report persistence: `a0b5dbb9352b5558dbe62445c6452947dbd2501b`.
- Current HEAD is audit-only (`docs: add 50-persona audit round 1`); product baseline remains parent `fe497aa9fac7a4e4a411e663edeef6c1c5356577`.
- No default-branch product source/config/dependency remediation landed after Round 3.
- Open remediation PRs remain unmerged: #71 for #58, #72 for #61, #73 for #69.

The prior Round 4 umbrella lease (`2026-09-20T20:01:28Z`) expired at `2026-09-20T21:31:28Z` without a release/report. Before takeover, full #68 comments, all-state PRs, visible persona-audit branches and available owner/heartbeat evidence were rechecked. No still-valid persona-audit ownership was found. A fresh lease was acquired and read back.

## Exact execution evidence

Exact current SHA `a0b5dbb...` has two successful Actions receipts:

- CI run `33989440607`: three successful Python 3.10/3.11/3.12 jobs executed checkout, dependencies, all tests, full category/115 UI checks, responsive-layout checks, homepage stats, search-index generation, analytics generation/sync, and frontend JS syntax checks.
- Pages run `33989440679`: successful deploy job regenerated home/category/search/analytics assets and executed `actions/deploy-pages`.

These prove only the executed CI/deployment paths. They do not prove browser reload recovery, screen-reader/200%-zoom/touch behavior, mixed-cache failure injection, or first-offline Analytics operation.

## Findings / dedupe

### Existing independent #74 — P2 BUG: Analytics code/data mixed-version cache pair

Issue: https://github.com/Reese-max/police-exam-archive/issues/74

`BUG / P2 / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`.

At current `sw.js`, `analytics-chart.js` and `analytics-chart-data.js` independently use `networkFirst(..., CORE_CACHE)`. One request may succeed fresh while the other fails and independently falls back to old cache. There is no shared version identity or atomic pair promotion. Merged PR #48's unresolved review thread `discussion_r3837788306` identified the same root cause and is still unresolved/not outdated. #74 already existed before this resumed audit, so it was deduped rather than recreated. It is new to the fixed-50 finding set relative to Round 3.

Minimum effective fix: a small shared pair identity/manifest + atomic promotion or equivalent. No backend/database/general cache framework.

Evidence boundary: source-confirmed only; no production mixed-pair incident or injected browser reproduction claimed.

### New #75 — P2 BUG: first offline Analytics visit lacks Chart.js

Issue: https://github.com/Reese-max/police-exam-archive/issues/75

`BUG / P2 / CONFIRMED / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`.

Current `CORE_ASSETS` pre-caches `analytics.html`, `analytics-chart.js` and `analytics-chart-data.js`. But `analytics.html` requires Chart.js 4.4.1 from jsDelivr, and the service worker only caches jsDelivr responses on demand with `staleWhileRevalidate()`. A fresh user can install the service worker from another page, never visit Analytics online, then go offline: the Analytics HTML/local scripts can fall back from core cache while Chart.js has never entered `CDN_CACHE` and is unavailable.

This is independent from #74. #74 is same-origin code/data cohort mixing after partial network success; #75 is a missing external runtime dependency on the first offline Analytics visit. Open/closed Issues, all-state PRs and PR #48 review threads were searched before creation. The matching unresolved review `discussion_r3837788308` was source evidence, not an existing Issue.

Minimum effective fix: reuse current cache boundaries; vendor/precache the fixed Chart.js dependency as a controlled asset, or explicitly stop treating Analytics as offline core and degrade intentionally. No new backend/database/account/queue/framework.

Evidence boundary: source-confirmed only. Required post-fix safe runtime: isolated fresh browser profile → online homepage only → never open Analytics → offline → open Analytics.

## Existing blockers / current remediation status

- #58 P2 image-option fidelity remains current-default reproducible; #71 is open/unmerged.
- #61 P2 corpus quality denominator drift remains in README (36,760 corpus vs 36,210/36,210 quality claims); #72 is open/unmerged.
- #69 P2 active mock-exam recovery remains unfixed on default; #73 is open/unmerged. PR-head Playwright evidence is useful only for that candidate branch.
- #70 P2 VALIDATION_GAP remains an open delivery-readiness item for diverged PR #50; it is not promoted into a current-product P1.
- #60 remains feature/opportunity scope and is not converted into a proven defect or implementation authorization.
- #74 and #75 are independent Analytics reliability blockers.

No Issue closure, PR merge, diff, or PR-head test claim is treated as `VERIFIED_FIXED` until the relevant fix lands on default and the necessary path is rerun.

## Fixed A01–J05 matrix — 50/50 complete

| Persona | Core scenario / success condition | Current observation | Evidence/result |
|---|---|---|---|
| A01 | first-time mobile learner starts without tooling | web learner entry exists; phone first-use not rerun | SOURCE_CONFIRMED; NEEDS_RUNTIME |
| A02 | non-CLI student uses browser path | quiz/search usable without CLI | SOURCE_CONFIRMED |
| A03 | technical student filters/searches current corpus | generated category/search checks execute | CI_EXECUTED |
| A04 | time-pressured learner completes long quiz | reload/interruption loses current-default active session | **#69 P2** |
| A05 | visual learner can understand every choice | four graphical-choice questions remain incomplete | **#58 P2** |
| B01 | office novice starts study directly | setup path exists; usability not rerun | SOURCE_CONFIRMED; NEEDS_RUNTIME |
| B02 | junior engineer diagnoses failures | exact-SHA CI executed real checks | CI_EXECUTED |
| B03 | designer expects reversible mistakes | active-session loss remains | **#69 P2** |
| B04 | research assistant trusts corpus/export scope | public quality denominator remains stale | **#61 P2** |
| B05 | fragmented/mobile user returns later/offline | recovery missing; first-offline Analytics dependency missing | **#69/#75 P2** |
| C01 | police/public user needs correctness/provenance | image and denominator trust gaps remain | **#58/#61 P2** |
| C02 | teacher wants low-learning-cost flow | direct web flow exists; no new multi-user defect proven | SOURCE_CONFIRMED; NEEDS_RUNTIME |
| C03 | high-risk user needs explicit evidence boundary | public quality denominator inconsistent | **#61 P2** |
| C04 | long-workflow user avoids loss | active quiz state not recoverable on default | **#69 P2** |
| C05 | SRE needs fail-safe cache/deploy | CI/Pages green; Analytics pair/dependency contracts fail | **#74/#75 P2** |
| D01 | manager reads trustworthy summary | quality denominator stale | **#61 P2** |
| D02 | PM traces issue/ownership state | umbrella/findings/open PRs traceable | SOURCE_CONFIRMED |
| D03 | IT admin checks deployment evidence | exact-SHA Pages deploy executed; browser paths incomplete | DEPLOY_EXECUTED; NEEDS_RUNTIME |
| D04 | cost-sensitive user avoids surprise spend | no new paid provider path; CDN is reliability dependency only | SOURCE_CONFIRMED |
| D05 | audit role requires provenance consistency | image/denominator gaps remain | **#58/#61 P2** |
| E01 | older office user completes setup | visible setup exists; real usability not run | SOURCE_CONFIRMED; NEEDS_RUNTIME |
| E02 | desktop/large-text user operates site | responsive CI ran; real 200% zoom not run | CI_EXECUTED; NEEDS_RUNTIME |
| E03 | low-digital user recovers mistakes/interruption | no resume/discard path on default | **#69 P2** |
| E04 | spreadsheet-familiar user avoids cloud admin | learner route is static/browser-based | SOURCE_CONFIRMED |
| E05 | long-duration user completes 90/120-min session | interruption can lose session | **#69 P2** |
| F01 | older first-time user finds primary actions | source controls present; physical usability not tested | NEEDS_RUNTIME |
| F02 | low-vision user uses zoom/contrast | source support exists; real low-vision path absent | NEEDS_RUNTIME |
| F03 | low-precision user uses touch safely | touch-target runtime absent | NEEDS_RUNTIME |
| F04 | memory-sensitive user relies on persistence | reload drops active exam | **#69 P2** |
| F05 | assisted setup then independent use | browser flow exists; recovery gap remains | **#69 P2** |
| G01 | keyboard-only answers/navigates | no new source-confirmed P2 beyond known gaps; focus runtime not rerun | NEEDS_RUNTIME |
| G02 | screen reader consumes complete questions | image-choice content incomplete; AT not rerun | **#58 P2**; NEEDS_RUNTIME |
| G03 | color-limited user reads status without color-only cues | no new P2 chain proven | NEEDS_RUNTIME |
| G04 | 200% zoom/narrow view completes flow | responsive CI checks ran; actual 200% browser path absent | CI_EXECUTED; NEEDS_RUNTIME |
| G05 | slow/high-latency user survives partial/offline loading | mixed Analytics pair and first-offline Chart.js gap reachable | **#74/#75 P2** |
| H01 | Windows maintainer validates project | no Windows-specific defect newly established | CI_EXECUTED; OS runtime gap |
| H02 | macOS maintainer validates project | no macOS-specific defect newly established | CI_EXECUTED; OS runtime gap |
| H03 | Linux/CI noninteractive validation | three Python jobs executed successfully | **CI_EXECUTED** |
| H04 | Pages/self-host deployer needs coherent offline assets | Pages ran; Analytics cache/dependency contracts remain | **#74/#75 P2** |
| H05 | new maintainer needs one corpus truth | public denominator drift remains | **#61 P2** |
| I01 | repeat click/re-submit | no distinct new P2 chain established | SOURCE_SIMULATION; NEEDS_RUNTIME |
| I02 | close/reload mid-task then recover | current exam cannot reconstruct | **#69 P2** |
| I03 | invalid input fails safely | constrained UI/tests exist; no new P2 chain | CI_EXECUTED; NEEDS_RUNTIME |
| I04 | timeout/5xx/offline | one Analytics asset can refresh while peer falls back; fresh offline lacks Chart.js | **#74/#75 P2** |
| I05 | partial success then retry | Analytics can become incoherent after partial resource success | **#74/#75 P2** |
| J01 | large corpus remains usable | build/index checks execute; large-device performance not rerun | CI_EXECUTED; NEEDS_RUNTIME |
| J02 | concurrent users avoid cross-user corruption | static/local learner flow has no shared learner server state | SOURCE_CONFIRMED |
| J03 | long-running task survives interruption | long mock exam remains non-resumable | **#69 P2** |
| J04 | privacy-sensitive user avoids hidden sharing | no new learner-data server path found | SOURCE_CONFIRMED |
| J05 | expert uses shortest/trustworthy path | image/denominator/cache blockers remain | **#58/#61/#74/#75 P2** |

Coverage: **50/50 fixed personas re-reviewed** against the current default product and original success-condition baseline. This is a qualifying full recheck, not `NO_CHANGE`: it independently incorporated #74 and discovered/created #75.

## Ten dimensions

1. First understanding — web entry exists; first-use browser study not rerun.
2. Core task — CI/Pages are real; #58/#69 still affect supported practice paths.
3. Error recovery — #69 remains current-default.
4. Data safety — no new privacy/authorization defect established in static learner flow.
5. Observability — CI/Issue evidence exists; offline Analytics failures are not deliberate degraded states.
6. Accessibility/device — #58 remains; AT/200%-zoom/touch/mobile evidence incomplete.
7. Performance/cost — no new P0/P1/P2 from scale/cost; #75 is reliability, not cost speculation.
8. Maintainability — #61 remains; #70 is a delivery validation gap; exact-SHA CI executes.
9. Failure injection — #74/#75 are source-confirmed network/offline failure paths; no destructive production injection performed.
10. Trust — official corpus/provenance is strong, but #58/#61/#74/#75 prevent CLEAN.

## Issue-quality / minimum-change decisions

- #74/#75 each identify a supported, reachable failure and actual current source root cause; neither treats the absence of a proposed framework as the defect.
- Both remain P2: no data loss, privilege bypass, security incident, full-site outage or widespread production incident was observed.
- Repairs stay local to existing cache/dependency boundaries.
- Both are `NEEDS_REVIEW`, `auto_implementation=false`.
- Synthetic persona counts, board votes and competitive capabilities were not used as impact evidence.

## Writes / coordination

- Reused umbrella #68; no duplicate umbrella.
- Deduped existing #74.
- Created independent #75 after Issue/PR/source/review-thread dedupe.
- #68 and #75 audit leases were written and read back; the prior #68 Round 4 marker was expired before takeover.
- Attempted repo-local report write to `.github/quality-audits/2026-09-21T0845Z-50-persona-audit-round-4.md`; GitHub rejected it with HTTP 409: `Changes must be made through a pull request. 4 of 4 required status checks are expected.` This is recorded as **REPORT_WRITE_BLOCKED**. No audit branch/PR was created because this task does not create branches merely to bypass protected-default policy.
- This unique central continuation is the durable report for the completed round.
- No product source, CI/config, settings, secrets, implementation branch, worker/GOAL, merge, deploy, paid provider call, production failure injection or upstream fork issue was modified.

## CLEAN / notification

- New independent actionable P0/P1/P2 created this run: **1** (#75 P2 BUG).
- Existing independent actionable finding newly incorporated relative to prior fixed-50 Round 3: **#74 P2 BUG**.
- Confirmed new current-default regression: **0** (these are latent/source-confirmed defects, not a newly landed regression).
- Landed relevant product fixes: **0**.
- Qualifying full fixed-50 rounds added: **1**, but it contains P2 findings and therefore earns no clean streak.
- `police-exam-archive`: **NOT CLEAN, 0/2**.
- Whole portfolio: **NOT CLEAN / inventory completeness uncertain**.
- Low-noise notification trigger: **YES — new actionable #75**.
