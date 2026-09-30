# External Competitive / New Product / Workflow Radar — 2026-09-14T14:24:08Z

## Run contract

- Quality gate: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Quality-rule blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Rule version: Issue Quality v2, effective 2026-09-14.
- External web is the primary research source in this round. GitHub is used for owned-repository scope, current product truth, issue/PR dedupe, coordination, and this report.
- No product source code, CI, config, secrets, permissions, repository settings, implementation branches, merges, deployments, paid trials, formal data, repair agents, or new GOALs were changed or started.
- This report does not declare any repository or the portfolio CLEAN.

## Portfolio scope and fair-rotation cursor

GitHub owner enumeration was re-run instead of reusing an earlier portfolio list.

- Owned repositories returned: **42**.
- Unarchived: **39**.
- Archived and excluded: `gemini-deidentifier`, `obsidian-vault`, `openab`.
- Support / compatibility rather than independent product surfaces: `adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`.
- `google-maps-personal-mcp` was previously held as UNKNOWN. Its current README now shows a working product surface: Places API search/details, local SQLite source of truth, collections/notes/tags/ranking/trip planning, resumable Google Maps Saved Lists sync through a replaceable Playwright adapter, dry-run defaults, and 32 tests. It is therefore reclassified **product-like** for future rotation.
- Current working classification: **36 product-like + 3 support/compatibility-only** among the 39 unarchived repositories.

Previous fair-rotation cursor was `spotify-playlist-organizer-mcp`. Because that repository received several high-frequency radar/audit passes today, it received only lightweight dedupe. This round then deep-read:

1. `taichung-police-intel` — current returned default-branch commit `e1d081bd04824c062c7ee99e7d74f9e478240743`
2. `taiwan-intel-dashboard` — `3367e15eb69e03f9e6d38c94631f287a6f75e088`
3. `tick-stock-panel` — `7257be29f002a4e951d616f8a5eb2b1a8aa7f2a9`
4. `voice-actress` — `120523b73872155457bf2251cb02b66c950ad4c2`

Lightweight dedupe repo:

- `spotify-playlist-organizer-mcp` — `4a7fd58d35f7e34492f59dc1e8332301eb81801f`

**Next fair-rotation cursor: `92-duty-scheduler`.**

---

## External Signals

### A1 — CONFIRMED — Feedly is reducing repeated monitoring setup and verification jumps

**Sources / dates**

- Feedly Threat Intelligence changelog, 2026-08-19: per-Custom-Intel-Agent email/Slack alerts.
  - https://feedly.com/threat-intelligence/changelog
- Feedly changelog, 2026-07-08: reusable Org Profiles, Report Builder citations down to source passages, evidence/confidence on insight cards.
  - https://feedly.com/changelog/faster-exploit-triage-smarter-org-profiles-and-more-transparency-across-your-report-builder
- Feedly changelog, 2026-06-24: self-serve Ask AI Research Playground; detection rules directly exposed from Insight Cards rather than requiring article search.
  - https://feedly.com/changelog/suricata-detection-rules-ask-ai-research-playground-and-more
- Accessed 2026-09-14.

**Job-to-be-Done**

An analyst wants a monitoring objective, organization context, alert behavior, evidence, and downstream report to remain reusable instead of being re-entered in every research session.

**Concrete manual steps removed**

- Re-entering the same organizational context in Ask AI / report / newsletter / monitoring flows.
- Opening a source article just to locate the exact evidence passage or detection artifact.
- Polling a monitoring agent manually when the actual need is “tell me when this monitor has something new.”

**Onboarding / distribution signal**

The self-serve research playground is a deliberate “try the workflow without a sales call” onboarding pattern. This is stronger as a distribution/onboarding signal than as evidence of product effectiveness.

**Automation / provenance pattern**

`Reusable context → bounded monitor → alert → evidence-backed item → report citation` rather than a fresh prompt each time.

**Pricing / business-model signal**

No current price claim is used in this report; the signal retained here is packaging around persistent intelligence workflows, not ROI.

**Known limits**

Vendor feature descriptions establish capability, not accuracy, adoption, or time saved. Threat-intelligence workflows also have different data sensitivity and urgency than public police-policy monitoring.

**Reese-max mapping**

- `taichung-police-intel #12` already covers reusable role/unit context and deterministic profile relevance.
- Existing alert/profile evidence is therefore **same fingerprint**, not a new issue.
- Passage-level citations reinforce the existing evidence-first direction rather than justify a second evidence subsystem.
- The Research Playground pattern is interesting for onboarding, but `taichung-police-intel` already has a public static demo and has higher-priority publication reliability work. No new onboarding issue is justified.

**Do not copy**

Do not turn the public police-policy product into a general commercial threat-intelligence workspace, per-user private profile store, or Slack-first enterprise SaaS.

---

### C1 — CONFIRMED — Policy intelligence is becoming an assistant-native distribution product

**Source / date**

- FiscalNote, 2026-08-13: PolicyNote MCP published in Anthropic’s Claude Connectors Directory, after an earlier OpenAI App Store listing.
  - https://fiscalnote.com/newsroom/fiscalnote-launches-policynote-mcp-in-anthropics-claude-connectors-directory-expanding-access-to-its-policy-intelligence-amid-accelerating-enterprise-adoption
- Accessed 2026-09-14.

**Job-to-be-Done**

Policy analysts already working in an AI assistant want authoritative legislative/regulatory data without leaving the assistant, copying source material into chat, or building a custom integration for each AI platform.

**Concrete manual steps removed**

`open policy platform → search → copy facts/links → switch to assistant → paste/contextualize` becomes a structured, authorized assistant query.

**Onboarding / distribution signal**

The connector directory itself is becoming a discovery channel. FiscalNote explicitly positions the same underlying intelligence product across multiple AI surfaces rather than betting on one assistant.

**Automation / provenance pattern**

Structured sourced policy data stays under provider-controlled access terms while the assistant is only the interaction surface.

**Pricing / business-model signal**

FiscalNote states the MCP remains a commercial product and it controls pricing/access directly. No numeric price or vendor adoption claim is used here.

**Known limits**

The announcement is vendor-authored. It confirms availability and packaging, not that MCP improves analysis quality or reduces time by a measured amount.

**Reese-max mapping**

This is strong fresh confirmation for `taichung-police-intel #15` (read-only Evidence MCP / agent-native evidence distribution), but **not a new fingerprint**. The transferable principle is:

`canonical evidence product → multiple assistant distribution surfaces → same data/access/provenance contract`

not “build another AI chat UI.”

**Coordination result**

`#15` has a comment stating `devin-loop: research PR opened`, and open PR **#17 `docs: read-only Evidence MCP design`** exists on branch `devin/issue-15-research`. Therefore this radar marks the fresh FiscalNote signal **SKIPPED_LOCKED** for issue updates and records it only here. No lock was taken and no active scope was modified.

---

### A2 — CONFIRMED — TradingView removed manual watchlist preparation from Pine Screener

**Sources / dates**

- TradingView blog, 2026-09-01: “Pine Screener: scan any index, pick any script.”
  - https://www.tradingview.com/blog/en/pine-screener-update-60542/
- Current TradingView support page, accessed 2026-09-14.
  - https://www.tradingview.com/support/solutions/43000742436-tradingview-pine-screener-key-features-and-requirements/

**Job-to-be-Done**

A market researcher wants to scan a meaningful universe without manually constructing a watchlist first.

**Concrete manual steps removed**

TradingView explicitly says the old workflow required building a watchlist by hand and adding a script to Favorites. The new flow allows an index to be the symbol source and expands compatible script selection.

**Onboarding / distribution signal**

The source selector is now an explicit first-class step: choose the universe, choose the indicator, define filter criteria, scan.

**Automation / provenance pattern**

The important product principle is not “more AI.” It is separating the **universe definition** from the **screening rule** so users do not have to materialize the universe as an intermediate manual list.

**Pricing / business-model signal**

This round does not use plan limits or price as product evidence; support docs are used only for current capability/constraint verification.

**Known limits**

Current Pine Screener still supports one symbol source at a time and has script/timeframe/request limitations. It is not an unrestricted full-market execution engine.

**Reese-max mapping to `tick-stock-panel`**

- Current repo already has backend universe concepts and can call `get_by_universes(...)` for full-market data.
- Current source also contains screener presets and saved strategy parameters.
- Therefore the external change does **not** prove that Reese-max users are currently forced through the same manual-watchlist preparation step.
- A repository search did not establish a user-facing index/universe selector inside the Screener, but absence of a search result is not enough to create a product defect.

**Decision**

Keep as a narrow `NEEDS_EVIDENCE` research question: observe whether a user running a Taiwan/A-share screen must first prepare a watchlist or otherwise manually reconstruct a universe. If the backend already chooses the intended universe automatically, do nothing. If a real handoff exists, first consider a local selector reusing existing universe support before adding any new “universe framework.”

No Issue opened.

---

### B1 — CONFIRMED — Study products are converging on diagnostic → targeted practice → updated plan

**Sources / dates**

- OpenAI current Study Mode help, accessed 2026-09-14:
  - https://help.openai.com/en/articles/11780217
  - Current product supports quizzes/practice questions, explaining missed answers, flashcard-style review, uploaded files/images, personalization, and user-requested hint-first / one-question-at-a-time behavior.
- Google education post, 2026-06-25, still within representative 90-day window and rechecked 2026-09-14:
  - https://blog.google/products-and-platforms/products/education/iste-students-2026/
  - Study notebooks use an initial diagnostic quiz, identify focus areas, generate bite-sized interactive lessons, update lessons based on subsequent quiz results/material, and sync with NotebookLM.

**Job-to-be-Done**

A learner wants feedback to become the next small practice action, not another long report they must manually translate into a study plan.

**Concrete manual steps removed**

`read feedback → decide weak topic → invent next exercise → find supporting material → repeat` is compressed into diagnostic identification plus targeted practice and progress-aware adjustment.

**Onboarding / distribution signal**

OpenAI exposes Study as a first-class mode across web/mobile; Google embeds the loop in study notebooks and connects it to NotebookLM rather than requiring another standalone study app.

**AI / personalization pattern**

The key pattern is not generic chat: `diagnostic evidence → small task → new result → plan update`.

**Pricing / business-model signal**

No pricing inference is used. The Google student offer and plan promotion are distribution signals, not evidence that the workflow improves exam outcomes.

**Known limits**

OpenAI explicitly notes study interactions can still provide a direct answer and can make mistakes. Google’s positive student statements are vendor-collected testimonials, not an independent outcome study.

**Reese-max mapping to `voice-actress`**

The repository already has:

- SRS cards / SM-2 review,
- daily challenge,
- mock exam,
- dashboard,
- `study-plan` / `adaptive` / summary logic derived from sessions,
- missed issues and fix suggestions,
- wrong-book flows.

Thus “add adaptive study planning” is **not a validated gap**. The stronger current gap remains `#6`: criterion feedback lacks validated answer spans and trusted law-source evidence, so downstream personalization could amplify weak grading evidence if built first.

**Decision**

Do not open another adaptive-learning Issue. Revisit only after #1/#2 provenance/session correctness and #6 evidence-linked grading have runtime proof, and only if a concrete manual transition from verified grading evidence to SRS/daily practice still remains.

---

## Community Pain Points

All items below are anecdotal and are **not** occurrence-rate evidence.

### COMMUNITY_SIGNAL — TradingView watchlist friction / packaging

- 2026-09-08 Reddit thread: users report losing access to multiple saved watchlists after a plan/feature change and express frustration with relying on watchlists as a workflow boundary.
  - https://www.reddit.com/r/TradingView/comments/1war7zn/watchlists_just_one_now/
- A Pine Screener feature-request thread received additional comments in August 2026 describing the repeated burden of selecting watchlist, indicator, and settings each time.
  - https://www.reddit.com/r/TradingView/comments/1lvxinz/feature_request_save_screens_in_pine_screener/

These signals support testing whether a Reese-max screener workflow depends on a manually maintained intermediate watchlist. They do not prove the same problem exists in `tick-stock-panel`, and they do not justify copying TradingView’s plan structure.

### COMMUNITY_SIGNAL — trust concerns around AI essay feedback

- 2026-09-04 Reddit discussion: a student questions whether to use an AI essay-review tool at all; replies express skepticism and recommend human/teacher cross-checking.
  - https://www.reddit.com/r/CollegeEssays/comments/1w7ke8z/ai_essay_feedback/

This supports the trust direction already represented by `voice-actress #1` and `#6`: grading provenance, inspectable evidence, and source verification matter more than adding more generated feedback. It is not a measurement of AI-grading accuracy.

---

## New Releases / Product Strategy Signals

| Date | Product | Confirmed change | Reese-max implication | Decision |
|---|---|---|---|---|
| 2026-09-01 | TradingView Pine Screener | Index can be symbol source; manual watchlist prep no longer required; broader script selection | Test whether `tick-stock-panel` has a real universe-selection handoff before building anything | NEEDS_EVIDENCE, no Issue |
| 2026-08-19 | Feedly | Alerts per Custom Intel Agent | Confirms persistent monitoring objective + notification context; already covered by `taichung-police-intel #12/#4` | Duplicate direction |
| 2026-08-13 | FiscalNote PolicyNote MCP | Claude Connectors Directory listing; same policy data available in assistant-native workflow | Fresh evidence for `taichung-police-intel #15` | SKIPPED_LOCKED due active PR #17 |
| 2026-07-08 | Feedly | Reusable Org Profiles and source-passage citations | Confirms reusable role context + evidence locator | Existing #12 / evidence-first direction |
| 2026-06-25 | Google Study Notebooks | Diagnostic quiz → personalized bite-size lessons → progress-based updates | Relevant to `voice-actress`, but current repo already has adaptive/study-plan/SRS primitives | No gap established |
| current, checked 2026-09-14 | OpenAI Study Mode | Quiz, explain misses, flashcard review, files/images, personalized/hint-first study | Reinforces active-recall workflow; does not establish a missing feature in `voice-actress` | No Issue |

---

## Adjacent Ideas

### 1. Universe as a reusable input, not a manually materialized list

Potentially transferable to `tick-stock-panel`:

`UniverseDefinition → CoverageCapabilityCheck → Strategy/Filter → ScanReceipt`

But only if user observation shows the current product requires redundant list-building. Existing backend universe support means the minimum change, if needed, is likely a selector/projection—not a new registry/service.

### 2. Assistant-native distribution should preserve canonical-product authority

FiscalNote reinforces a cross-portfolio principle already emerging in `taichung-police-intel #15`:

`Assistant = discovery/interaction surface; canonical product = data/provenance/access authority.`

Possible later reuse: `taiwan-intel-dashboard`, exam archives, legal/judicial evidence products. No umbrella cross-portfolio Issue is justified while the Taichung pilot is already active and not runtime-verified.

### 3. Diagnostic evidence should be promoted into the next task only after evidence quality is known

For `voice-actress`:

`Grading evidence → verified weak criterion → existing SRS/daily-practice primitive`

is preferable to `AI score → automatically generate more AI exercises`. This keeps the current product narrow and avoids compounding grading uncertainty.

---

## Opportunity Map — processed products

### `spotify-playlist-organizer-mcp` — lightweight dedupe

- **MUST MATCH:** exact provider identity vs search candidate distinction; user review before persistent playlist writes — already tracked by #2.
- **SHOULD BE BETTER:** provider-policy-safe data boundary and explicit write/apply receipts — already tracked by #1/#2.
- **DIFFERENTIATOR:** YouTube-first organization with local deterministic classification/dedupe and reviewable apply semantics.
- **ADJACENT IDEA:** provider-independent playlist intent only if it reuses current resolution/write boundaries.
- **DO NOT COPY:** broad transfer-SaaS/provider marketplace scope; another generic AI playlist generator.
- **Decision:** no new research this round; recently saturated by radar/audit passes.

### `taichung-police-intel`

- **MUST MATCH:** truthful source health/freshness/gaps/LKG and exact official evidence locators; publication reliability before distribution breadth.
- **SHOULD BE BETTER:** reduce Web→copy/paste→assistant handoffs while preserving exact publication/evidence state.
- **DIFFERENTIATOR:** public police-policy intelligence where AI/distribution cannot silently promote derived text into formal truth.
- **ADJACENT IDEA:** multi-assistant connector distribution and self-serve evidence exploration.
- **DO NOT COPY:** commercial threat-intel workspace breadth, private organizational asset profiles, operational policing data/action.
- **Decision:** FiscalNote is fresh same-fingerprint evidence for #15, but PR #17 is active. `SKIPPED_LOCKED`; central report only.

### `taiwan-intel-dashboard`

- **MUST MATCH:** one truthful operating-state contract (#17) and no “no data” narrative when deterministic evidence exists (#18).
- **SHOULD BE BETTER:** evidence-linked degraded summaries once those reliability contracts are fixed.
- **DIFFERENTIATOR:** Taiwan public-intelligence aggregation with explicit source/provenance/freshness boundaries.
- **ADJACENT IDEA:** assistant-native read-only distribution later, preferably by reusing a proven Taichung evidence-distribution contract.
- **DO NOT COPY:** add more feeds/agents/connectors while pause/restore and summary truth are contradictory.
- **Decision:** external market movement does not outrank the two current P1 trust/reliability gaps. No feature Issue.

### `tick-stock-panel`

- **MUST MATCH:** effective provider coverage truth (#2), point-in-time/backtest boundaries, generated/custom Python isolation (#6), simulation-only / no-broker authority.
- **SHOULD BE BETTER:** make the scan universe explicit and low-friction if user observation proves redundant watchlist setup.
- **DIFFERENTIATOR:** visible deterministic StrategyDef/filter/backtest contracts instead of opaque “AI stock picks.”
- **ADJACENT IDEA:** TradingView’s universe-first Pine Screener workflow; natural-language rule compiler remains #5.
- **DO NOT COPY:** live order execution, generalized AI financial adviser, or a second screening engine disconnected from existing capability/coverage plumbing.
- **Decision:** `NEEDS_EVIDENCE`; no Issue. Current code already contains backend universe support and screener presets, so a new framework would be premature.

### `voice-actress`

- **MUST MATCH:** live/mock provenance (#1), grade→session persistence correctness (#2), truthful free-only/SQLite product contract (#7).
- **SHOULD BE BETTER:** criterion→answer evidence and verifiable law-source linkage (#6).
- **DIFFERENTIATOR:** Taiwan police/legal essay practice where feedback can be traced to the learner’s own answer and formal source.
- **ADJACENT IDEA:** diagnostic→micropractice loop using existing SRS/daily/adaptive primitives after evidence quality is established.
- **DO NOT COPY:** teacher LMS, batch-classroom grading, essay-authorship policing, or an AI “final examiner” authority layer.
- **Decision:** no new adaptive-learning Issue; existing capability and higher-priority trust gaps make the generic opportunity redundant.

---

## Opportunity / Research Gate Decisions

### Candidate 1 — multi-assistant canonical evidence distribution

- `kind`: RESEARCH (existing #15 scope)
- `severity`: NOT_ESTABLISHED
- `decision_priority`: high research interest, lower than production publication correctness
- `triage`: NEEDS_EVIDENCE
- `auto_implementation`: false
- User pain: plausible and directly described in #15; fresh FiscalNote evidence shows industry distribution movement.
- Strategic fit: high because the product’s strongest asset is structured provenance/evidence.
- Novelty: moderate; this is now an established connector pattern, not a unique feature.
- Evidence strength: high for availability/product direction; UNKNOWN for actual Reese-max user demand/time saved.
- Reuse: potentially high across evidence products, but cross-project abstraction is premature.
- Effort: bounded research possible; production cost/ops/auth unknown.
- Security/privacy/cost: public read-only surface is lower risk than mutation, but field exposure/rate limits/stale truth remain real.
- Counterargument: current web publication may already be sufficient; publication reliability is more important; assistant distribution can create another stale surface.
- Coordination: **SKIPPED_LOCKED** because PR #17 / `devin/issue-15-research` is open. No issue update.

### Candidate 2 — universe-first screening UX

- `kind`: OPPORTUNITY / possible RESEARCH
- `severity`: NOT_ESTABLISHED
- `decision_priority`: low–medium until repo/user friction is observed
- `triage`: NEEDS_EVIDENCE
- `auto_implementation`: false
- User pain: strong in TradingView’s old workflow and anecdotal community comments; **UNKNOWN in Reese-max**.
- Strategic fit: high if the current screener requires manual intermediate lists.
- Novelty: low; direct workflow simplification.
- Evidence strength: high external, low repo-specific.
- Reuse: existing `universes` support suggests good reuse if a gap is confirmed.
- Effort: likely local UI/service wiring, but not estimated without tracing the actual user journey.
- Risk: low product safety risk, but incorrect universe/coverage semantics can become a data-correctness problem.
- Counterargument: `tick-stock-panel` already scans full markets/universes and has presets; the “manual watchlist” problem may simply not exist here.
- Minimum next evidence: one observed screener journey for A-share and Taiwan modes, recording whether a user must build/select a list that merely recreates an already-known universe.
- Decision: no Issue.

### Candidate 3 — grading-to-targeted-practice handoff

- `kind`: OPPORTUNITY
- `severity`: NOT_ESTABLISHED
- `decision_priority`: deferred behind evidence correctness
- `triage`: DEFERRED / NEEDS_EVIDENCE
- `auto_implementation`: false
- External fit: OpenAI/Google confirm the product pattern.
- Repo evidence: current architecture already exposes adaptive/study-plan/session-derived flows, daily challenge, SRS, dashboard and wrong-book.
- Root-cause gap: not established.
- Counterargument: without evidence-linked grading (#6), auto-promoting a weak criterion into more practice may amplify model error.
- Decision: reject as a new issue now; re-evaluate only if a concrete manual handoff remains after current trust work.

---

## Ideas Rejected / Deferred

1. **New `taichung-police-intel` connector Issue** — rejected as duplicate; #15 already owns the fingerprint and has active PR #17.
2. **Cross-portfolio “Evidence Connector Framework”** — rejected. One active product research spike must prove the need first; the absence of a framework is not a defect.
3. **`tick-stock-panel` index/universe registry** — rejected. Existing backend universe support means a new module would violate minimum-change discipline; first prove a UI/manual handoff.
4. **`voice-actress` new adaptive-learning engine** — rejected. Existing adaptive/study-plan/SRS primitives already cover the generic pattern; evidence quality is the tighter bottleneck.
5. **`taiwan-intel-dashboard` agent/MCP expansion** — deferred. #17/#18 are more important product-truth issues and the repo currently documents a pause/restore contract discrepancy.
6. **Feedly-style per-user org profiles/Slack SaaS for police intelligence** — rejected for scope/sensitivity reasons. Current #12 deterministic public role profiles are the narrower fit.
7. **TradingView-like live brokerage or AI market advice** — explicitly out of scope; current `tick-stock-panel` non-trading contract remains the correct boundary.

---

## Issue Mapping and Coordination

| Repo | Existing item | Mapping this round | Action |
|---|---|---|---|
| `taichung-police-intel` | #15 read-only Evidence MCP | FiscalNote Claude-directory release is same fingerprint, fresh distribution evidence | **SKIPPED_LOCKED** — issue comment says research PR opened; PR #17 is open on `devin/issue-15-research`; report only |
| `taichung-police-intel` | #12 role/unit profile | Feedly Org Profiles + per-Agent alerts already match its rationale | no duplicate / no repost |
| `tick-stock-panel` | #5 natural-language → deterministic StrategyDef | AI/conversational configuration remains covered | no duplicate |
| `tick-stock-panel` | #2 provider coverage truth | Current source now contains `isWatchlistMode` / universe-size-aware wording in layout; this suggests the old static symptom may have changed | **do not declare fixed**; runtime/provider-switch evidence still required; no radar scope change |
| `voice-actress` | #6 criterion-linked evidence grading | Recent AI-feedback trust signals reinforce the same trust boundary | no duplicate |
| `voice-actress` | #1/#2/#7 | provenance/session/docs truth are higher priority than new study features | no scope expansion |
| `spotify-playlist-organizer-mcp` | #1/#2 | recent provider-boundary + canonical-resolution work already owns the material opportunities | lightweight dedupe only |

**New Issues created this round: 0.**

No existing Issue was updated because the only strong fresh same-fingerprint candidate (#15) is actively owned by an open research PR. Therefore no `github-issue-lock:v1` was acquired.

---

## Scope / Severity Calibration

### Portfolio classification

`google-maps-personal-mcp` is no longer UNKNOWN. Current README provides a concrete running product contract, so future portfolio rotation should count it product-like. This changes the current unarchived classification from the last report’s `35 product-like + 3 support + 1 unknown` to **`36 product-like + 3 support/compatibility`**.

### `tick-stock-panel #2`

The original issue’s static symptom described provider-agnostic `全市場快照` copy. Current default-branch source search at `7257be29...` shows `Layout.tsx` derives visible text from `isWatchlistMode` and includes `universe_size`, which is evidence that part of the original static mismatch may already have moved.

This radar does **not** close, downgrade, or declare #2 fixed: the issue requires provider-switch/plan/partial/empty runtime verification, and that path was not executed here. The important quality-v2 consequence is that new market-universe ideas must not cite the old copy mismatch as if it were still proven current.

### `voice-actress`

Current architecture still contains the adaptive/SRS/study-plan surface while #7 documents significant README/architecture drift after billing/storage changes. Therefore vendor study-mode releases should not be translated into another “adaptive learning” backlog item until existing product truth is reconciled.

---

## What Changed Since the Previous Radar

1. **Portfolio scope changed:** `google-maps-personal-mcp` now has enough repository evidence to classify as product-like; product-like count becomes 36.
2. **Fresh policy-intelligence distribution evidence:** FiscalNote’s 2026-08-13 Claude Connectors Directory listing confirms that authoritative policy-data products are treating AI assistants as distribution channels. This does not create a new Reese-max opportunity because `taichung-police-intel #15` already owns it and has open PR #17.
3. **Fresh direct competitor workflow simplification:** TradingView’s 2026-09-01 Pine Screener release removes manual watchlist construction as a prerequisite by allowing index-based symbol sources. Reese-max backend already has universe concepts, so the correct next step is evidence gathering, not a new module.
4. **Learning market cross-check:** OpenAI Study Mode and Google Study Notebooks reinforce diagnostic→practice→progress loops, but `voice-actress` already has the generic primitives; grading evidence quality remains the more defensible gap.
5. **No new issue passed v2 gate.** The most valuable action was avoiding duplicate/scope-inflated work and preserving active PR ownership.

---

## Sources

Primary/recent public web sources used this round, with access date 2026-09-14 unless noted:

1. Feedly Threat Intelligence changelog — Aug 19 / Jul 08 / Jun 24 2026 updates  
   https://feedly.com/threat-intelligence/changelog
2. Feedly Org Profiles / Report Builder transparency — 2026-07-08  
   https://feedly.com/changelog/faster-exploit-triage-smarter-org-profiles-and-more-transparency-across-your-report-builder
3. Feedly Ask AI Research Playground — 2026-06-24  
   https://feedly.com/changelog/suricata-detection-rules-ask-ai-research-playground-and-more
4. FiscalNote PolicyNote MCP in Anthropic Claude Connectors Directory — 2026-08-13  
   https://fiscalnote.com/newsroom/fiscalnote-launches-policynote-mcp-in-anthropics-claude-connectors-directory-expanding-access-to-its-policy-intelligence-amid-accelerating-enterprise-adoption
5. TradingView Pine Screener index/script update — 2026-09-01  
   https://www.tradingview.com/blog/en/pine-screener-update-60542/
6. TradingView Pine Screener requirements — current  
   https://www.tradingview.com/support/solutions/43000742436-tradingview-pine-screener-key-features-and-requirements/
7. OpenAI Study Mode help — current  
   https://help.openai.com/en/articles/11780217
8. Google education / Study Notebooks — 2026-06-25  
   https://blog.google/products-and-platforms/products/education/iste-students-2026/
9. Reddit TradingView watchlist discussion — 2026-09-08 — COMMUNITY_SIGNAL only  
   https://www.reddit.com/r/TradingView/comments/1war7zn/watchlists_just_one_now/
10. Reddit Pine Screener save/re-entry thread, with Aug 2026 comments — COMMUNITY_SIGNAL only  
   https://www.reddit.com/r/TradingView/comments/1lvxinz/feature_request_save_screens_in_pine_screener/
11. Reddit AI essay feedback discussion — 2026-09-04 — COMMUNITY_SIGNAL only  
   https://www.reddit.com/r/CollegeEssays/comments/1w7ke8z/ai_essay_feedback/

Vendor claims were used only as capability/product-direction evidence. Community posts were treated as anecdotes, not prevalence or performance statistics.

---

## Runtime / evidence limits

- No live paid provider trial was started.
- No production data was changed.
- No production/canary browser path was executed.
- No GitHub Actions workflow, autodev-ng run, repair agent, or new GOAL was started.
- Repo-level runtime claims remain `NEEDS_RUNTIME_VERIFICATION` where existing Issues say so.
- Search/code evidence is not being substituted for provider/runtime verification.

## Cursor / unfinished

- Next product cursor: **`92-duty-scheduler`**.
- `taichung-police-intel #15` fresh FiscalNote evidence remains report-only while PR #17 is active.
- `tick-stock-panel` universe-first UX remains a **research-list hypothesis**, not a defect or Issue, until an actual user journey proves redundant manual universe preparation.
- No notification-worthy direction reversal was established this round; this was primarily a dedupe/scope-calibration run with one fresh but already-owned distribution signal.
