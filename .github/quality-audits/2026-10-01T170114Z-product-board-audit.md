# Product Board Audit — 2026-10-01T17:01:14Z

## Status and boundaries

- Round status: **PARTIAL / NOT CLEAN**. This was an incremental portfolio pass over all 45 owner repositories (44 unarchived, one archived) followed by deep inspection of the newest high-signal candidate changes. It is not a claim that every repository received a fresh full-depth product review in this round.
- Scope: audit and triage only. No product code, CI, configuration, secrets, permissions, settings, merge, deployment, worker run, paid service, or production failure injection was performed.
- Quality rules: `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`, blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Default-branch delta since the preceding product-board receipt (`0947d7e68cfd65cadb9ef6892398228d1c04b5e8`): no new default-branch product commit was found across the 44 unarchived owner repositories. New evidence was concentrated in open pull requests.
- Fixed A01–J05 audit: not rerun here and not replaced by the 50 synthetic product personas below. No CLEAN round is claimed.

## Discovery and inventory receipt

The owned inventory was fully paginated: 45 repositories, of which `obsidian-vault` is archived and excluded from product defect creation by purpose; 44 are unarchived. The incremental commit scan covered every unarchived default branch. Deep review then followed the freshest candidate evidence rather than re-reading unchanged popular repositories.

Repositories enumerated: `exam-archive`, `police-exam-practice`, `police-exam-archive`, `92-duty-scheduler`, `UkePack`, `ppt-studio`, `voice-actress`, `taiwan-intel-dashboard`, `autodev-ng`, `flux-image-gen`, `claude-mem`, `lobsterpulse`, `prompt-autoresearch`, `neciken-summer-poem`, `note-filler`, `adng-memory`, `cyber-prep-coach`, `cf-ai-router`, `avatar-vfo`, `project-doctor-web`, `minideck`, `chatgpt-dual-pipeline`, `taichung-police-intel`, `soundbox-offline`, `skill-foundry`, `video-timeline-pipeline`, `ai-novel-workstation`, `clinical-scribe-worker`, `MaterialYouNewTab`, `cf-mcp-server`, `tick-stock-panel`, `herdr-skills`, `ninax-line-hermes`, `ai-flight-radar`, `academic-mcp`, `spotify-playlist-organizer-mcp`, `google-maps-personal-mcp`, `travel-planning-mcp`, `octobroker`, `openab`, `police-essay-mcp`, `openab-pty`, `travel-planning-app`, and `studio`.

### High-signal candidate checks

| Product / candidate | Exact evidence | Result |
|---|---|---|
| `police-exam-archive` PR #89 | head `859b13ac65aa30d331acd859d983e3de7737fae1`; CI run `36813911303` and Data Quality `36813911210` passed | The delayed-resume timer gap is real but already recorded on Issue #69 at the same head and evidence version. **DEDUPED**, no new write. |
| `exam-archive` PR #7 | head `c32d2207900d85d7e5877aea3b2315e34dd11097`; contract run `36820517608` passed | Initial concern about unloaded sidebar/hash targets was disproved by later source: `handleHash()` and sidebar click handlers load the year before opening/scrolling. **REJECTED_BY_RED_TEAM**. |
| `police-exam-archive` PR #92 | base `master@a0b5dbb9352b5558dbe62445c6452947dbd2501b`; head `bbfb7b02e688e03e64240cbe91cf3cfe36094be3` | Chart code/data are paired, but HTML summary values remain on an independent cache/version route. **New actionable candidate finding F-01**, already disclosed in the active PR; no Issue/PR mutation. |

## Finding F-01 — Analytics summary HTML can disagree with its chart bundle

```yaml
kind: BUG
severity: P2
decision_priority: NOW_PREMERGE
triage: NEEDS_REVIEW
auto_implementation: false
confidence: CONFIRMED_SOURCE_CAUSAL_CHAIN
runtime: NEEDS_RUNTIME_VERIFICATION
disposition: SKIPPED_LOCKED_ACTIVE_PR
```

Stable fingerprint: `police-exam-archive + analytics.html summary stats and analytics-chart-bundle.js + deployment/cache transition where page HTML refresh succeeds but bundle refresh falls back + summary cards/filter/year labels disagree with rendered charts + independent HTML/bundle version boundary`.

### Problem and affected path

The Analytics page is a supported, reachable dashboard. At PR #92 head, `scripts/sync_analytics_frontend.py` correctly regenerates both the static values in `analytics.html` and the chart code/data bundle from one source during a build. That prevents repository drift at one commit. Runtime delivery remains split:

1. `analytics.html` embeds total/choice/essay/category/subject/year values directly in HTML.
2. `analytics-chart-bundle.js` separately embeds `STATS`, year totals, category totals, answer distribution, and keywords.
3. `sw.js` serves HTML with `networkFirst(..., DYNAMIC_CACHE)` but serves the bundle with a separate `analyticsBundle()` request and complete-pair fallback from `CORE_CACHE`.
4. On a later deployment/cache transition, HTML can succeed from the newer deployment while the bundle request fails and falls back to an older complete bundle. The page can then show, for example, a new total and year range in cards while charts/filter calculations use older totals and years.

The reverse transition (cached/old HTML with a newer bundle) is also possible. The chart's code/data pair remains internally consistent, so Issue #74's narrow pair acceptance can pass while the user-facing Analytics page is still internally contradictory.

Evidence:

- PR: https://github.com/Reese-max/police-exam-archive/pull/92
- Page source: https://github.com/Reese-max/police-exam-archive/blob/bbfb7b02e688e03e64240cbe91cf3cfe36094be3/%E8%80%83%E5%8F%A4%E9%A1%8C%E7%B6%B2%E7%AB%99/analytics.html
- Generator: https://github.com/Reese-max/police-exam-archive/blob/bbfb7b02e688e03e64240cbe91cf3cfe36094be3/scripts/sync_analytics_frontend.py
- Service worker: https://github.com/Reese-max/police-exam-archive/blob/bbfb7b02e688e03e64240cbe91cf3cfe36094be3/%E8%80%83%E5%8F%A4%E9%A1%8C%E7%B6%B2%E7%AB%99/sw.js
- Existing pair issue: https://github.com/Reese-max/police-exam-archive/issues/74

### Impact and severity rationale

Affected users are learners, instructors, maintainers, and analysts who use the dashboard to understand coverage and trends, especially returning/offline/unstable-network users during an update. The contradiction is not cosmetic: totals, year ranges, filters, and plotted series can describe different dataset generations, undermining the dashboard's decision value. It does not corrupt source data, change permissions, or make the entire archive unavailable, so P0/P1 is not established. P2 is appropriate for a material correctness and trust failure in a supported analytics workflow. Frequency and production incidence are **UNKNOWN**; no fabricated prevalence or ROI is asserted.

### Reproduction precondition and expected/actual

Static causal reproduction precondition: begin with a controlled older complete page/bundle cache, deploy a newer generation, allow the HTML request to succeed, and fail the bundle refresh so `analyticsBundle()` returns the older cached pair.

- Expected: summary cards, filter count, year labels, and every chart either share one verified dataset generation or the page clearly fails as a unit.
- Actual by source: page HTML and bundle have no shared runtime identity; each can resolve from a different generation and both still render successfully.

No production failure was injected. This remains `NEEDS_RUNTIME_VERIFICATION` in an authorized isolated service-worker/browser harness and after eventual deployment.

### Minimum effective change

Options compared:

| Option | Assessment |
|---|---|
| Do nothing | Leaves a known silent contradiction across future data deployments. Reject for this candidate. |
| Documentation only | Honest but does not prevent incorrect combined output. Insufficient. |
| Reuse the existing bundle | **Preferred minimum**: render summary cards/year/filter text from the bundle's `STATS` (or a small shared payload already inside it), removing duplicated HTML values. |
| Version handshake | Acceptable alternative: place the same generation ID in HTML and bundle, verify before rendering, and reload/fail closed on mismatch. |
| Rewrite PWA/cache architecture | Not justified. The narrow shared-source or handshake fix is sufficient. |

Non-goals: no backend, database, account system, analytics platform, new framework, generalized registry, or full service-worker rewrite.

### Direct acceptance and regression

- [ ] Summary cards, year labels, filter total, and charts use one generation identity or one runtime data object.
- [ ] Controlled `new HTML + old cached bundle` and `old HTML + new bundle` cases cannot render contradictory values; they converge or fail explicitly.
- [ ] Same-generation online and offline loads preserve the current chart code/data pair guarantees and the legacy split routes remain fail-closed.
- [ ] An isolated browser/service-worker test covers install, subsequent data deployment, partial network failure, reload, and rendered text/chart inputs.
- [ ] After merge, repeat on the deployed commit in desktop and narrow/mobile paths before `VERIFIED_FIXED`.

### Tracking and lock decision

The exact limitation is already disclosed in active PR #92, which references open Issue #74 and has an active implementation owner/branch. Per mutual-exclusion rules this audit did not claim the Issue, comment on or edit the PR, alter labels/scope, or create a duplicate Issue. Status is `SKIPPED_LOCKED_ACTIVE_PR`; this independent report is the central evidence receipt. Owner review should decide whether to extend #74 narrowly or create a separate follow-up. Issue existence or this report is not implementation authorization.

## External landscape (official/public sources)

Accessed 2026-10-01 UTC. Pages without an explicit update date are marked `date UNKNOWN`; that is a source limitation, not an invented release date.

| Alternative | Evidence status and dated source | Users / first success / workflow | UX, automation, API, mobile | Reliability, security/privacy, pricing, docs/distribution |
|---|---|---|---|
| 考選部考畢試題查詢平臺 | **CONFIRMED**, update date UNKNOWN, accessed 2026-10-01: https://wwwq.moex.gov.tw/ | Official source; first success is selecting year/exam/subject and opening official PDF. | Search/filter and PDF/print; AI/API UNKNOWN; mobile-specific support UNKNOWN. | Authoritative provenance; page states new papers appear the morning after all written tests finish. Public/free; official distribution and instructions. |
| 阿摩線上測驗 | **CONFIRMED**, manual date UNKNOWN, accessed 2026-10-01: https://manual.yamol.tw/%E7%B6%B2%E9%A0%81%E7%89%88-web/%E5%85%A5%E9%96%80%E4%BB%8B%E7%B4%B9/startquiz and https://manual.yamol.tw/%E7%B6%B2%E9%A0%81%E7%89%88-web/%E6%B8%AC%E9%A9%97/examoption_exam | Taiwan exam learners; first success is finding a paper and answering with keyboard or pointer. | Test/review/bookmark/error-report workflows and documented keyboard controls; app references exist; AI/API UNKNOWN. | Account/history and VIP features imply server dependence; security/privacy evidence UNKNOWN. Free/paid tiers are documented at https://yamol.tw/pricing; extensive public manual. |
| Quizlet | **CONFIRMED**, update date UNKNOWN, accessed 2026-10-01: https://quizlet.com/features/study-modes and https://help.quizlet.com/hc/en-us/articles/25946589648013-Studying-with-Practice-Tests | Broad learners/teachers; first success is selecting a study set and a study/test mode. | Multiple modes; AI-generated practice tests are documented for supported materials; web/mobile presence; public API status UNKNOWN. | Cloud-account product; exact reliability/privacy outcomes not independently evidenced here. Free and paid capabilities exist but current price not used in this audit; official help/distribution. |
| Anki / AnkiWeb | **CONFIRMED**, manual crawled 2026-09-29 to 2026-10-01, accessed 2026-10-01: https://docs.ankiweb.net/studying.html and https://docs.ankiweb.net/syncing.html | Recall-focused learners; first success is studying a deck and grading recall. | Keyboard-first review and cross-device sync documented; automation via scheduling, not generative AI; API UNKNOWN; separate mobile clients documented. | Local collection plus optional sync offers a different privacy/reliability tradeoff. Pricing not assessed; mature official manual and desktop/mobile distribution. |

### Competitive interpretation

- **MUST MATCH:** authoritative provenance, reachable search/browse, internally consistent counts/content, keyboard-operable core tasks, and graceful recovery/offline behavior where claimed.
- **SHOULD BE BETTER:** a local-first static archive should make version/provenance visible and remain coherent during updates without requiring an account.
- **DIFFERENTIATOR:** Taiwan police-exam specificity, official-source traceability, offline/local-first access, and auditable generated artifacts.
- **DO NOT COPY:** broad AI test generation, monetized history gates, or a generalized spaced-repetition platform without user evidence. Competitor feature presence is not proof of this product's need or benefit.

External marketing and feature pages are product claims, not independent outcome evidence. They inform workflow expectations only and do not establish revenue, frequency, or priority.

## 50 synthetic product personas

These are model-simulated scenarios, not people, votes, incidence, or market share. `PB-B01`–`PB-B30` are the stable regression baseline for this product-board track; `PB-E01`–`PB-E20` are exploratory. They are separate from the fixed A01–J05 quality audit and do not satisfy CLEAN requirements.

| ID | Background / constraint | Goal and journey | Friction / simulated result | Severity / advice / evidence |
|---|---|---|---|---|
| PB-B01 | First-time police examinee, desktop | Open Analytics, read coverage, choose a subject | Contradictory totals make scope unclear under skewed cache | P2; unify generation; source causal chain |
| PB-B02 | Returning learner, cached PWA | Reopen after dataset update | New cards can coexist with old charts | P2; regression target; source causal chain |
| PB-B03 | Mobile learner, unstable network | Check trend during commute | Partial refresh is reachable; contradiction may look authoritative | P2; narrow-browser runtime needed |
| PB-B04 | Offline learner | Reopen a previously installed dashboard | Same installed pair is coherent; no new failure shown | No new defect; Red Team boundary |
| PB-B05 | Slow-network user | Compare annual counts | Mixed generations can persist for the session | P2; version handshake or shared STATS |
| PB-B06 | Instructor preparing lesson | Cite total and chart | Conflicting values block trustworthy citation | P2; fail closed on mismatch |
| PB-B07 | Maintainer importing new year | Publish updated dataset | Build sync passes but runtime atomicity is untested | P2; deployment-transition test |
| PB-B08 | Data analyst | Compare category ranking and total | Filter total may disagree with plotted input | P2; one runtime data object |
| PB-B09 | Keyboard-only learner | Navigate dashboard | This finding does not add a keyboard blocker | Maintain; covered elsewhere |
| PB-B10 | Screen-reader user | Hear summary and chart context | Conflicting text remains misleading even if announced | P2; semantic consistency |
| PB-B11 | Low-vision user at 200% | Read large stat cards then chart | Visual proximity amplifies contradiction, not root cause | P2; shared source |
| PB-B12 | Teacher on school proxy | Refresh after release | One asset may fail while HTML succeeds | P2; controlled proxy-failure test |
| PB-B13 | Learner on captive portal | Open cached dashboard | Soft failure could trigger old bundle fallback | P2; preserve content-type guard plus version boundary |
| PB-B14 | Privacy-sensitive learner | Use without login | No privacy regression found in F-01 | Maintain local-first boundary |
| PB-B15 | Data contributor on Windows | Regenerate assets | LF/CRLF bundle digest is tested | No defect; keep existing test |
| PB-B16 | Contributor updating only HTML copy | Edit labels | Generator checks reduce repo drift but not deployment skew | P2 runtime boundary only |
| PB-B17 | Support volunteer | Explain two totals | Cannot know which generation is authoritative | P2; expose generation ID |
| PB-B18 | Exam coach | Screenshot trends | Screenshot may preserve contradictory evidence | P2; block incoherent render |
| PB-B19 | Returning desktop user | Compare this month with prior view | Cache transition can silently change one layer | P2; atomic page state |
| PB-B20 | Fresh browser user | First online visit | Install should pre-cache same release; likely coherent | No reproduced failure; test only |
| PB-B21 | Browser with storage eviction | Reload dashboard | Missing cached pair fails closed, which is safer | Maintain; existing pair test |
| PB-B22 | Browser with cache-write quota failure | Load fresh pair | Fresh bundle still renders while HTML may be another generation | P2; runtime ID comparison |
| PB-B23 | User sharing Analytics URL | Recipient opens fresh | Fresh path likely coherent; not evidence of bug frequency | No new defect; UNKNOWN incidence |
| PB-B24 | Researcher verifying provenance | Trace values to source | HTML and bundle lack visible common runtime identity | P2; expose build generation |
| PB-B25 | User comparing official PDFs | Validate dashboard coverage | Contradiction increases manual verification burden | P2; one source at render |
| PB-B26 | Older device | Load cached assets to save bandwidth | Cache fallback is central to workflow | P2; avoid full framework rewrite |
| PB-B27 | Intermittent CDN user | Load Chart.js and local bundle | CDN behavior is separate; not F-01 root cause | Maintain; do not conflate |
| PB-B28 | No-JS user | Read static totals | Sees HTML only; charts unavailable by design | P3/known limitation, not F-01 |
| PB-B29 | Auditor checking CI | Review green pair tests | Green tests do not cover HTML/bundle skew | P2 validation gap within same bug |
| PB-B30 | Release manager | Decide whether to merge #92 | Known deviation remains reachable on later deploy | NOW premerge review |
| PB-E01 | Learner using browser back/forward | Return to cached Analytics | May restore old document while worker has new pair | P2; browser history scenario test |
| PB-E02 | Multi-tab user | Keep old tab, open new tab after deploy | Tabs may run different workers/generations | P2; generation mismatch must fail clearly |
| PB-E03 | App-installed PWA user | Resume after update | Worker activation timing makes split generations plausible | P2; lifecycle harness |
| PB-E04 | Corporate cache user | Receive stale JS despite fresh HTML | Service worker `no-store` helps but cannot guarantee network availability | P2; shared ID |
| PB-E05 | Translator/localizer | Change HTML wording only | Copy change need not change data generation | No defect if values derived at runtime |
| PB-E06 | Accessibility tester | Compare announced total with chart table alternative | No table evidence reviewed; consistency still prerequisite | P2; runtime and AT smoke |
| PB-E07 | Automated crawler | Index static totals | Crawler may index new HTML while users see old charts | P2 trust/distribution risk; no frequency claim |
| PB-E08 | Search visitor | Land directly on Analytics | Fresh network path should be coherent | No new defect absent skew |
| PB-E09 | User on metered data | Avoid reload | Asking user to hard reload is a poor primary recovery | P2; automatic convergence |
| PB-E10 | Maintainer rolling back deployment | Restore previous release | Fixed filenames plus caches can cross generations | P2; rollback case in test matrix |
| PB-E11 | Maintainer hot-fixing text | Deploy HTML without data change | Version may differ despite equivalent data | Use data-generation ID, not commit only |
| PB-E12 | Maintainer updating data only | Regenerate all assets | Script updates both, but delivery remains split | P2; preserve generator, fix render source |
| PB-E13 | Student comparing answer distribution | Read donut then total | Old distribution plus new total can imply false proportions | P2 correctness |
| PB-E14 | Student comparing year coverage | Read 106–115 badge | Old chart series may omit newest year | P2 completion/trust |
| PB-E15 | Analyst filtering category | Select category after mismatch | Bundle drives filter while HTML advertises new total | P2; same generation for controls |
| PB-E16 | Device with service worker disabled | Load network assets | Same-deploy network path likely coherent; no fallback mismatch | Red Team: not universal |
| PB-E17 | Browser clearing site data | Fresh reload | Clears mismatch but destroys offline convenience | Not acceptable as sole fix |
| PB-E18 | Security reviewer | Assess digest claim | Digest authenticates internal pair, not HTML association | P2 integrity boundary, not cryptographic security claim |
| PB-E19 | CFO/solo maintainer | Minimize maintenance | Reusing existing `STATS` is cheaper than a new framework | Prefer minimum patch |
| PB-E20 | Product owner | Decide scope | Fix contradiction; defer AI, accounts, API, generalized platform | NOW narrow / DON'T expand |

No Synthetic Preference Share is reported; simulated persona outcomes are not votes or demand estimates.

## Product board deliberation

This is a model multi-perspective exercise, not independent expert consensus.

| Perspective | Position |
|---|---|
| CEO | If only three things are done: (1) block silent cross-generation Analytics output, (2) finish and deploy-verify the already scoped recovery/privacy fixes, (3) keep the official-source/local-first contract. Do not add AI tutoring, accounts, or a platform layer. |
| CPO | Analytics trust is part of the product promise. Treat F-01 as premerge scope review, not a new roadmap epic. |
| CTO | The pair bundle is a good reduction, but its consistency boundary stops one layer too early. Prefer deriving HTML stats from `STATS`. |
| Staff / Principal Engineer | Keep one source of truth at render time; add a two-generation service-worker regression. Avoid version registries and generalized asset transactions. |
| UX Lead / Researcher | A page showing two answers to the same coverage question is a task failure. Human prevalence is unknown; validate with a narrow runtime scenario before broader UX work. |
| Growth | Trustworthy indexed totals matter more than additional acquisition features. No growth estimate is supported. |
| CFO | A local reuse patch and deterministic test are proportionate; a PWA rewrite is not. |
| Security / Privacy | This is integrity, not confidentiality. Preserve fail-closed behavior and local-first use; do not add identity or telemetry. |
| QA | Green pair tests are necessary but insufficient. Add exact rendered-value assertions across install → deploy N+1 → partial failure. |
| SRE | Exercise cache activation, rollback, offline transition, and storage failure in isolation; do not inject failures into production. |
| Accessibility | Consistent announced text is prerequisite; later test screen-reader output, but do not conflate missing AT evidence with proof of a separate product failure. |
| Support | Provide explicit recovery if mismatch is detected. “Hard refresh” may be a fallback, not the normal contract. |

Material disagreement: engineering/product/QA view this as a narrow merge blocker; finance and Red Team warn against expanding #74 into a generalized cache architecture. Resolution: **NARROW**, not REJECT and not platform expansion.

## Red Team

- **Disconfirming evidence accepted:** `sync_analytics_frontend.py` updates HTML values and bundle sources together, so the report does not claim repository content drift within one commit.
- **Disconfirming evidence accepted:** a fresh successful install pre-caches `analytics.html` and the complete pair, so the defect is not universal on every load.
- **Existing feature check:** the bundle digest and legacy-route failures already solve the precise chart-code/chart-data split in #74. F-01 is the adjacent page/bundle boundary, not proof that the pair work is useless.
- **Smaller alternative:** render static summaries from bundle `STATS` or verify one shared generation token. This is smaller than a PWA rewrite, database, registry, or framework.
- **Environment boundary:** no authorized deployed cache-transition reproduction was run. Static source proves reachability; actual browser behavior and incidence remain unmeasured.
- **Demand boundary:** competitor features and 50 personas do not establish market demand, revenue, or user frequency.
- **Rejected candidate:** the suspected `exam-archive` sidebar/hash bug was withdrawn after full event-chain inspection showed load-before-scroll routing.

## Decision memo

### Who this serves

Taiwan police-exam learners and instructors who need a focused, traceable archive; maintainers who need reproducible imports and static deployment; and returning/offline users who rely on coherent cached content.

### Choice, competition, and differentiation

Choose a narrow official-source/local-first archive over a broad study platform. Compete on trustworthy Taiwan-police coverage, transparent provenance, low-friction access, and auditable generation. Do not imitate generalized AI generation, social/community breadth, paid history gates, or cross-product infrastructure without evidence.

### Top three priorities

1. **NOW — NARROW:** prevent or explicitly reject cross-generation Analytics HTML/bundle output before merging the candidate that introduces the known boundary.
2. **NOW — MAINTAIN:** finish existing #69/#74/#14 candidate scopes and obtain required deployed desktop plus narrow/mobile runtime evidence after they actually reach default.
3. **NEXT — SIMPLIFY:** remove duplicated displayed analytics facts by using one runtime data object; keep official-source import and reproducible checks.

### Not doing / delete

- No new AI tutor, account, backend, telemetry, paid dependency, API platform, generalized cache registry, or state-machine framework.
- No duplicate Issue for F-01 while PR #92 owns the exact limitation; no mutation of active owner scope.
- Do not treat audit-only commits, green unit tests, open PRs, merges, or model votes as deployed verification.

### Risks and smallest experiment

Risk: widening #74 could delay a valuable pair fix. Small experiment: in an isolated service-worker/browser harness, serve release N, install/cache it, then serve release N+1 HTML while failing the bundle request; assert all displayed totals/year labels and chart inputs either remain N together, become N+1 together, or show an explicit error. BUILD only the shared-STATS or generation-handshake patch if the scenario reproduces; NARROW if a smaller render change works; REJECT a generalized transaction framework.

Portfolio recommendation for this product: **MAINTAIN + SIMPLIFY**. This is not a merge/deploy authorization. Full portfolio ranking/merge/archive recommendations are deferred because this round was incremental rather than a new full-depth portfolio completion.

## NOW / NEXT / LATER / DON'T

- **NOW:** F-01 owner review on PR #92; keep #69 delayed-resume gap and #74 deployed verification open; preserve #14 privacy verification state.
- **NEXT:** after a fix reaches default, rerun the exact cache-transition case and adjacent online/offline/rollback cases on the final HEAD and deployed artifact.
- **LATER:** collect real user evidence on which analytics decisions matter; reconsider broader study workflows only then.
- **DON'T:** create duplicate issues, merge/deploy, start workers, use synthetic votes as priority proof, or claim portfolio CLEAN.

## Regression and runtime ledger

| Item | Classification | Evidence limit |
|---|---|---|
| #69 resume timer candidate | `PARTIALLY_FIXED` candidate / not default | Exact-head CI passed; delayed prompt remains; browser/deployed evidence missing. |
| #74 chart code/data pair candidate | `PARTIALLY_FIXED` candidate / not default | Internal pair is source-confirmed; deployed offline evidence missing. |
| F-01 HTML/bundle generation | `STILL_REACHABLE_IN_CANDIDATE` | Source causal chain only; isolated browser/service-worker and deployed evidence required. |
| exam-archive sidebar/hash suspicion | `REJECTED_BY_RED_TEAM` | Full source event chain loads before scroll; no finding. |
| Portfolio CLEAN | `NOT_CLEAN` | Fixed A01–J05 stopping conditions, two complete qualifying rounds, and required runtime receipts were not established. |

## Write ledger and remaining scope

- New Issues: 0.
- Updated/reopened Issues or PR comments: 0 (active ownership/PR; no new lock taken).
- New research Issues: 0.
- Dedupe: 1 (#69 delayed-resume gap already tracked at exact head).
- Rejected by Red Team: 1 (`exam-archive` sidebar/hash suspicion).
- New actionable candidate finding: 1 (F-01), centrally recorded and explicitly blocked from Issue mutation by the active PR.
- Product implementation/merge/deploy/worker runs: 0.
- Remaining: unreviewed lower-signal open candidates, deployed runtime for existing fixes, full fixed-persona CLEAN rounds, and the next fair-rotation deep repository slice.

