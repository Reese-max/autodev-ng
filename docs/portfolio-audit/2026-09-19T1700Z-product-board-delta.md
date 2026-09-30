# Product Board Delta — taichung-police-intel

- Run: 2026-09-19T17:00:00Z
- Inspected repository: Reese-max/taichung-police-intel
- Default branch: main
- Default-branch HEAD: e1d081bd04824c062c7ee99e7d74f9e478240743
- Candidate PR: #55, head 90d3c6ad6cf886bdd21b6f59b5b8f7d994ee1776
- Issue-quality rule blob: 8167e10798071d2276addaff6b201c6b0e904a2a
- Inventory receipt: 41 Reese-max-owned repositories, 40 unarchived, 1 archived
- Fork exclusions: Reese-max/octobroker main = openabdev/octobroker main at b669101c0ef4a2c03c1ddcb2b99c014fd1947d29; Reese-max/openab main = openabdev/openab main at 50424ed461776fc4b817a85ee08052533f511d1e. Neither fork has owner product delta or enabled Issues, so upstream findings were not attributed to Reese-max.
- Pagination: repository issues, PRs and branches exhausted at page 2; Actions exhausted at page 4 (224 runs total).
- Result: repository delta complete; portfolio round remains PARTIAL and NOT CLEAN (0/2)
- Write policy: audit/status only; no product code, CI/config, settings, branch, merge, deployment, worker, GOAL, paid service or production-data action

## Executive decision

Recommendation: INVEST / SIMPLIFY / BLOCK PR #55 UNTIL THE RECEIPT CONTRACT IS TRUE.

GovIntel should remain a narrow, public-source, provenance-first municipal intelligence reader: current changes, official source links, explicit freshness/gaps and a readable static fallback. It should not try to match broad commercial intelligence suites before one exact candidate can prove that required browser and sabotage lanes ran.

If only three actions are funded:

1. Fix the already tracked stale-source P1 in Issue #30 and the unresolved generation-loading/source-policy findings on PR #55.
2. Make a release-candidate PASS require the mode-specific browser, HTTP, identity and sabotage checks; skip flags may create a development or PARTIAL receipt, never a release PASS.
3. Run the exact current-checkout command in a durable CI or equivalent isolated environment and upload the receipt, logs and screenshots tied to the exact head.

Do not fund live multi-modal collection, predictive AI, entity graphs, chat/MCP breadth or a generalized evidence platform from competitor feature pressure.

## Discovery and evidence

PR #55 is an unmerged candidate; default branch remains e1d081b. The candidate adds 27 files and claims a 21/21 loopback HTTP/browser/sabotage PASS. Six Codex review threads remain unresolved. The stale-source P1 has already been de-duplicated into Issue #30 with owner lock/release history, so this audit does not create or repeat it.

The exact head has two hosted green runs:

- Verify pull requests run 35254778270: success. Its 13 visible work steps install Python and apps/web dependencies, run the existing project gate, publication/V2 checks and a web regression. It does not invoke scripts/verify-current-checkout.py and does not install the root playwright-core lock.
- Pinned backbone replay run 35254778251: success. It executes scripts/verify-backbone-runtime.py and uploads that separate historical lane. PR #55 and its documentation explicitly say this lane cannot substitute for current-checkout evidence.

No exact-head GitHub-hosted job runs the advertised full current-checkout command or uploads runtime-evidence/current-checkout. That directory is gitignored. Therefore the PR's local 21/21 statement is a useful author report, but not a durable independently readable receipt in this audit.

Evidence classification:

- SOURCE_CONFIRMED: scripts/verify-current-checkout.py, README/CURRENT_CHECKOUT.md, ci.yml, exact-head run/job metadata, PR/Issue/review discussions.
- STATIC_INFERENCE: the documented skip flags can lead to an overall PASS because finalize_status ignores not_run and checks no mode-specific required set.
- EXECUTED_REPRODUCTION: none in this audit; no product checkout/provider/public deployment was executed.
- NEEDS_RUNTIME_VERIFICATION: patched full candidate, public Pages/base-path, real external source opening, mobile and assistive technology.

## New actionable finding

### F01 — A full release-candidate receipt can PASS while required browser and sabotage lanes are skipped

- Tracking: Issue #47 / PR #55; central report only because an owner branch and active PR are present.
- Fingerprint: Reese-max/taichung-police-intel + current-checkout receipt + full mode with skip-browser or skip-sabotage + overall PASS + finalize_status ignores not_run/required lane set
- Classification: VALIDATION_GAP / severity=NOT_ESTABLISHED / decision_priority=P2 / triage=NEEDS_REVIEW / auto_implementation=false
- Confidence: CONFIRMED / SOURCE_CONFIRMED plus static control-flow inference
- Affected role: maintainer or reviewer deciding whether the M1 candidate satisfies Issue #47; downstream consumers reading receipt.status
- Reachable steps:
  1. Run python scripts/verify-current-checkout.py --mode full --skip-browser --skip-sabotage after the other checks pass.
  2. Both omitted lanes are appended only to not_run.
  3. finalize_status examines checks only, requires merely one PASS and no FAIL, and returns PASS.
  4. The receipt still reports CURRENT_CHECKOUT_LOOPBACK_HTTP and status=PASS even though two explicit Issue #47 closing conditions did not run.
- Expected: full release-candidate PASS proves every required lane ran; an intentional omission is PARTIAL/INCOMPLETE or FAIL for release admission.
- Actual: skip flags remove required checks from the verdict. The exact-head hosted runs also do not execute the full verifier, so there is no durable counter-receipt proving the advertised full path.
- Consequence if not corrected: Issue #47 or a later release gate can accept a green receipt without the browser journey or sabotage binding that distinguishes current code from stale/fixed-worktree evidence.
- Existing alternative: keep skip flags for local diagnosis but issue a typed non-release receipt; use the existing exact command and artifact upload instead of a new validation platform.
- Minimum effective change:
  - Define required check IDs per mode.
  - In full mode, any required NOT_RUN yields PARTIAL/INCOMPLETE (or FAIL for admission), never PASS.
  - Reserve --skip-* for explicitly non-admissible diagnostic receipts.
  - Add one exact-head job that installs both lock scopes, runs full mode and uploads receipt/logs/screenshots; do not reuse pinned replay as proof.
- Direct acceptance:
  1. Full run with --skip-browser cannot return status=PASS.
  2. Full run with --skip-sabotage cannot return status=PASS.
  3. Core mode has its own explicit required set and cannot be mistaken for full/browser evidence.
  4. A complete full run records browser, HTTP, candidate identity and sabotage checks plus exact code/data/lock hashes.
  5. The exact-head hosted or otherwise isolated receipt is durable and read back after upload.
- Non-goals: no new orchestration platform, database, merge queue, external provider, live collector or production deploy.
- Severity calibration: this is not a demonstrated P1 product failure or incident. It can invalidate a P2 integration/release decision, so severity remains NOT_ESTABLISHED and decision priority is P2.

## Existing PR #55 findings and de-duplication

| Finding | Current calibration | Tracking / disposition |
|---|---|---|
| stale/very-stale source may become SNAPSHOT_RECENT and answerable_no_match=true | BUG / P1 / SOURCE_CONFIRMED | Existing Issue #30 and discussion_r4039888107; SKIPPED_LOCKED |
| brief can render before archive/status arrive, showing “same generation” indefinitely on failed secondary fetch | BUG / P1 pre-merge | discussion_r4039888112; active PR owner |
| source policy treats only exact STALE as degraded, not VERY_STALE/NO_DATA | BUG / P1 pre-merge | discussion_r4039888118; active PR owner |
| receipt may PASS with code_sha=null outside a Git checkout | VALIDATION_GAP / P2 | discussion_r4039888124; active PR owner |
| --chrome-path is copied into an env object that run() never receives | BUG / P2 | discussion_r4039888133; active PR owner |
| browser check inspects href/target but never opens the official source | VALIDATION_GAP / P2 | discussion_r4039888139; active PR owner |
| health_receipt marks query_index SUCCESS whenever HTTP checks returned, even if a query check failed | diagnostic evidence backlog / P3 candidate | Existing Issue #35 is the closest contract; no separate issue without a supported consumer failure |

F01 is not a duplicate of the existing source-opening thread: that thread says the implemented browser assertion is too weak; F01 says the entire required browser and sabotage lanes can be omitted while the overall release verdict remains PASS.

## Competitor and substitute check

Checked 2026-09-20 Asia/Taipei. Pages below did not expose a reliable page-update date in the retrieved content unless noted; status is therefore CONFIRMED product claim as of the access date, not independent outcome evidence.

| Source | Current signal | Status | Product implication |
|---|---|---|---|
| Palantir Gotham — https://www.palantir.com/platforms/gotham/ | Integrates data, decisions and operations for dynamic operational environments | CONFIRMED vendor claim; update date UNKNOWN | DO NOT COPY platform breadth; DIFFERENTIATOR is public-source traceability and low-cost static fallback |
| Dataminr First Alert — https://www.dataminr.com/products/first-alert/ | Real-time public-sector alerts, browser/mobile/API, multi-modal and agentic claims | CONFIRMED vendor claim; page accessed 2026-09-20 | MUST NOT call a preserved snapshot real-time; live breadth requires independent evidence and budget |
| Esri ArcGIS Dashboards — https://www.esri.com/en-us/arcgis/products/arcgis-dashboards/overview | Location dashboards, real-time monitoring and community information | CONFIRMED vendor claim; update date UNKNOWN | SHOULD BE BETTER on source/version receipts; maps are optional, not a prerequisite |
| Microsoft Power BI — https://www.microsoft.com/en-us/power-platform/products/power-bi | Governed data, interactive BI and Copilot narratives | CONFIRMED vendor claim; update date UNKNOWN | Reuse familiar dashboard patterns; DO NOT COPY opaque AI summaries without evidence |
| Taiwan government open-data platform — https://data.gov.tw/ | Official datasets, API datasets, licensing, historical data and agency quality views; current page lists police datasets | SOURCE_CONFIRMED official substitute; accessed 2026-09-20 | Prefer official files/APIs and manual source opening before building new collectors |
| Manual official-page watchlist + spreadsheet/browser bookmarks | Existing low-tech substitute | CONFIRMED workflow inference from repo sources | Smallest fallback remains valid while live collection and trustworthy empty-result semantics are incomplete |

MUST MATCH: explicit source link, data date/freshness, partial/stale/error versus valid-empty distinction, deterministic version/receipt, keyboard-readable static fallback.

SHOULD BE BETTER: Taiwan municipal source specificity, zero-login public readability, low-cost deployment, and exact provenance rather than black-box alert confidence.

DIFFERENTIATOR: a bounded, reviewable chain from official publication to change summary to source/version receipt.

DO NOT COPY: surveillance-scale entity fusion, proprietary 1M-source claims, predictive threat scoring, generic BI administration, multi-modal AI breadth or mobile/API expansion before current candidate evidence is admissible.

## Product board perspectives

These are model-simulated viewpoints, not independent expert votes.

- CEO: fund stale/empty truth, generation integrity and one admissible release receipt; reject platform breadth.
- CPO: the first success is “I can tell what changed and why I trust it,” not “many capabilities exist.”
- CTO: mode-specific required checks are a small control-flow fix; no new evidence framework is justified.
- Staff/Principal Engineer: reuse checks/not_run and existing artifact upload; fail release admission when required IDs are absent.
- UX Lead: never show “same generation” while dependencies are still unknown; loading, failed and mixed are separate states.
- UX Researcher: test a morning scan, a stale-source empty query and opening the original source; synthetic personas cannot substitute.
- Growth: trustable public links are a stronger distribution loop than chat or predictive claims.
- CFO: avoid Dataminr/Palantir-like scope and paid providers; preserve static hosting and official open data.
- Security/Privacy: remain public-source-only; do not import operational, personal, 110 or private conversation data.
- QA: require negative runs for skipped lanes, missing Git identity, stale sources, delayed/missing artifacts and actual link navigation.
- SRE: a PASS must be machine-actionable; PARTIAL/NOT_RUN must not be hidden inside a green envelope.
- Accessibility: keyboard, screen-reader and mobile paths still lack exact-head runtime evidence.
- Support: expose snapshot date, unavailable capabilities and a direct official-source fallback without internal jargon.

## 50 synthetic personas

Synthetic simulation only; not user research, prevalence, preference share, revenue or priority evidence. B01–B30 are regression baseline; X01–X20 are exploratory. They are separate from fixed A01–J05 CLEAN personas.

| ID | Background / constraint | Goal / journey | Friction or result | Triage / evidence |
|---|---|---|---|---|
| B01 | Morning duty analyst | open dashboard, scan top changes | secondary artifacts may still be unknown | P1 existing thread |
| B02 | Shift supervisor | verify no relevant change | stale source can look like trusted empty | P1 Issue #30 |
| B03 | Policy officer | open official source | browser receipt does not actually navigate | P2 existing thread |
| B04 | Records clerk | confirm publication generation | missing feed/status can still show same generation | P1 existing thread |
| B05 | Public information officer | share static link | static fallback is valuable | maintain |
| B06 | Mobile field reader | scan on phone | exact-head mobile runtime absent | NEEDS_RUNTIME_VERIFICATION |
| B07 | Keyboard-only user | search and open source | navigation evidence incomplete | accessibility runtime |
| B08 | Screen-reader user | hear freshness and gaps | semantic runtime unverified | accessibility runtime |
| B09 | Low-bandwidth user | read cached/static content | keep static fallback | differentiator |
| B10 | Color-vision-deficient user | distinguish status | color plus text exists; runtime pending | verify |
| B11 | Analyst on slow source fetch | wait for complete state | brief can render before dependencies | P1 existing thread |
| B12 | Analyst during source outage | distinguish failure from zero | core promise; stale gap defect | P1 Issue #30 |
| B13 | Analyst after snapshot ages | know data is stale | VERY_STALE may appear covered | P1 existing thread |
| B14 | Reviewer checking exact code | inspect receipt code_sha | null SHA may still PASS | P2 existing thread |
| B15 | Reviewer using custom Chromium | run full verifier | flag is ignored | P2 existing thread |
| B16 | Reviewer diagnosing browser setup | skip browser temporarily | diagnostic PASS can be mistaken for release PASS | P2 F01 |
| B17 | Reviewer diagnosing sabotage lane | skip sabotage temporarily | release PASS remains possible | P2 F01 |
| B18 | CI maintainer | find durable full receipt | hosted jobs do not run current-checkout full | P2 F01 support |
| B19 | Auditor | reproduce screenshots/logs | runtime directory is gitignored and not uploaded | NEEDS_RUNTIME_VERIFICATION |
| B20 | Maintainer comparing pinned replay | verify current code | separate lane can be over-read as proof | F01 guard |
| B21 | User searching S-004 | filter historical items | current browser filter test exists | maintain |
| B22 | User with no matching record | interpret empty result | depends on correct freshness gaps | P1 Issue #30 |
| B23 | User opening old bookmark | retain history | archive fallback intended | verify mixed generations |
| B24 | User refreshing page | preserve generation | current test checks truncated prefix | runtime receipt only |
| B25 | User during query outage | read static publication | supported negative path | keep |
| B26 | User seeing unavailable capability | avoid fake empty | typed status exists | keep/regress |
| B27 | Data steward | inspect policy hash | candidate manifest shown only if loaded | verify binding |
| B28 | Release manager | approve M1 | current green runs are not full receipt | P2 F01 |
| B29 | Support staff | explain data age | needs plain-language stale/partial state | NOW |
| B30 | Security reviewer | keep public data boundary | no credentials used in candidate | maintain |
| X01 | City council researcher | compare agenda revisions | source-linked change history useful | NEXT after truth gates |
| X02 | Journalist | verify headline rapidly | direct source and timestamp matter | SHOULD BE BETTER |
| X03 | Civil-society monitor | export evidence | export need not block current fix | research |
| X04 | Academic researcher | query longitudinal archive | bounded metadata search useful | NEXT |
| X05 | Data journalist | obtain API | browser/static path is smaller first | DEFER API breadth |
| X06 | GIS analyst | map events | no proved core demand | DEFER |
| X07 | Emergency manager | real-time alerts | current snapshot is not real time | DO NOT CLAIM |
| X08 | Patrol commander | operational decisions | public snapshot lacks operational authorization | OUT OF SCOPE |
| X09 | Privacy advocate | audit source scope | public-only provenance is positive | maintain |
| X10 | Legal reviewer | inspect licensing | data.gov licensing/source pages are alternatives | narrow check |
| X11 | Bilingual user | read English summary | no established demand | evidence backlog |
| X12 | Older desktop user | use without modern GPU | static HTML advantage | maintain |
| X13 | Tablet user | tap official links | real navigation/mobile unverified | runtime experiment |
| X14 | Analyst wanting email alerts | receive digest | manual bookmark/digest smaller | DEFER |
| X15 | Analyst wanting chat | ask natural language | evidence gate and query truth first | DEFER |
| X16 | Developer embedding data | consume API | no authorization for API product | DEFER |
| X17 | Procurement officer | compare commercial suites | local narrow tool avoids platform cost | DIFFERENTIATOR |
| X18 | Adversarial maintainer | produce green receipt cheaply | skip flags allow it without required lanes | P2 F01 |
| X19 | Auditor reading only health lanes | infer query success | diagnostic SUCCESS can overstate failed check | P3 backlog |
| X20 | New contributor | run documented command | clean full path needs durable hosted proof | NEXT |

Synthetic switching conclusion: users who value Taiwan-specific official provenance and free static access may prefer GovIntel, but stale-as-empty or a non-admissible green receipt reverses that simulated preference. This is not a real vote or market share estimate.

## Red Team

- “Two green Actions prove the 21/21 current-checkout path” is disproved by job steps: one runs the old project gate, the other is explicitly separate pinned replay.
- “not_run is visible, so PASS is harmless” is insufficient: release automation and reviewers commonly key on top-level status; Issue #47 explicitly makes browser and sabotage closing conditions.
- “Skip flags are only developer convenience” does not repair the contract; keep them, but emit a non-admissible status.
- “The browser lane exists, therefore source opening is tested” is false; the existing review shows href/target inspection without navigation.
- “A missing hosted receipt means the product is broken” is rejected. It blocks verification but does not establish a user-facing failure.
- “Every unresolved review is P1” is rejected. Missing Git identity, ignored Chrome path and skipped required lanes remain P2/NOT_ESTABLISHED without a data/permission/core-outcome chain.
- “A new CI platform is needed” is rejected; one job and existing upload-artifact are sufficient.
- “Commercial competitors prove live AI alerts are required” is rejected; vendor breadth and marketing claims are not product-value evidence.
- “Map, mobile, chat and entity fusion must ship together” is rejected; the smallest valuable workflow is a trustworthy change summary with an official link.
- “The static archive is unsafe whenever the query lane is down” is rejected; the designed static fallback can remain readable if its snapshot/generation label is honest.

## NOW / NEXT / LATER / DON'T

NOW:

- Block PR #55 until existing P1 stale/generation/source-policy findings and F01 are resolved.
- Make full PASS require every closing-condition lane; preserve skip flags only for typed diagnostic receipts.
- Keep owner activity intact; no Issue/PR scope seizure and no implementation worker.

NEXT:

- Produce and upload an exact-head full current-checkout receipt with actual external-link navigation and fresh negative cases.
- Re-run delayed/missing artifact, stale/very-stale/no-data, no-Git-identity, custom-Chrome and public Pages/base-path cases.
- Conduct a small real-user task study: find one current change, explain freshness, open the official source and recover during a query outage.

LATER:

- Accessibility, mobile, longitudinal export and bounded API research after M1 trust gates pass.
- Live collection only with source rights, cost, reliability and fail-closed semantics.

DON'T:

- Do not add Palantir/Dataminr-scale fusion, predictive AI, generic BI, private operational data, paid providers, entity graphs, Chat/MCP breadth or native apps from competitor presence alone.
- Do not call pinned replay, a PR badge or a locally asserted count proof of the exact current candidate.

## Decision memo

- Serve: public-sector analysts, oversight/research users and maintainers who need a small, reviewable official-source change reader.
- Choice: compete on Taiwan municipal specificity, provenance and honest degraded states, not source volume or AI novelty.
- Differentiation: official source → deterministic snapshot/generation → change summary → direct link → durable verification receipt.
- Top three: stale/empty truth; generation/loading integrity; admissible exact-head receipt.
- Not doing/deleting: remove release meaning from diagnostic skip-mode PASS; defer unused capability breadth; do not duplicate source registries or evidence frameworks.
- Risk/experiment: run one isolated full receipt and a three-task real-user test before any breadth investment.
- Portfolio recommendation: INVEST / SIMPLIFY / MAINTAIN; do not MERGE PR #55 yet; no PAUSE/ARCHIVE decision for the repository.

## Fixed A01–J05 and CLEAN

The fixed audit is separate from the 50 synthetic product personas. Open P1 pre-merge blockers, absent public/runtime paths and no two consecutive complete qualifying rounds mean Portfolio CLEAN remains 0/2. No product fix was verified.

## Write and tracking ledger

- New actionable findings: 1
- New P0/P1: 0
- New VALIDATION_GAP / severity=NOT_ESTABLISHED / decision_priority=P2: 1
- Existing PR #55 findings rechecked: 6; existing mappings 6/6
- New issues: 0
- Updated/reopened issues: 0
- Duplicate avoided: 6 existing review findings plus Issue #30 mapping
- SKIPPED_LOCKED: Issue #47 / PR #55 due active owner branch and PR; Issue #30 due active owner/assignee/PR mapping
- Verified fixed: 0
- Runtime receipts newly executed: 0
- Issue write blocked: 0
- Report write blocked: 0 at preparation time
- Product implementation: 0

This report is an audit-only artifact. It is not authorization to implement, merge, deploy, purchase, mutate production data or write outside the approved audit surface.
