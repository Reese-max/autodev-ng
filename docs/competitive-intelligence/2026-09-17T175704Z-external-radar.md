# External Competitive / New-Product / Workflow Radar — 2026-09-17T17:57:04Z

## Status

- Focus cursor: `Reese-max/ai-flight-radar`.
- Next fair cursor: `Reese-max/academic-mcp`.
- Issue Quality v2 blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Current focal default branch / HEAD: `main@6228138337f950cb6399088c4f814f27a518e29e`.
- Fresh GitHub owner pagination returned **41 Reese-max-owned repositories; 40 unarchived**; a second page returned empty. `obsidian-vault` is archived in the current connector-visible result. This differs from the prior radar's 40/39 and is recorded only as inventory/access drift, not proof of repository creation/deletion or archival history.
- Write scope: this unique radar report only. **0 new Issues, 0 Issue updates, 0 PR comments.** No product source/CI/config/secrets/settings change, implementation branch, merge, deploy, worker/GOAL start, paid request, flight search, booking, or production-data write.
- No live provider or booking-handoff experiment was executed. Provider accuracy, booking fidelity, and any new exploratory-ranking approach remain `NEEDS_RUNTIME_VERIFICATION` where applicable.
- This radar does not declare the portfolio CLEAN.

## Product direction / current truth

AI Flight Radar remains **INVEST / SIMPLIFY**: a small, trustworthy Taiwan-origin fare evidence radar that explains what was observed, when, under which query, how it changed, and when the user must reconfirm. Booking/payments, hotel search, multi-tenant travel SaaS, and a general travel-agent platform remain outside the approved direction.

Current `main` already separates several important truth layers:

- observed fare is not guaranteed final bookable fare;
- quotes have source and observation time and expire from the product's usable view;
- historical deal claims require prior observation coverage rather than a fabricated market average;
- broad date comparison is not presented as a time series;
- browser-local tracking does not silently create a server-side watch;
- Fli phase 1 exists behind an optional provider path, while current product direction still requires bounded request semantics and calibration before a provider-default switch.

The repo already has overlapping scopes that matter for dedupe:

- #1 — quote/source/handoff calibration and release gate;
- #4 — reviewed intent -> durable `WatchSpec`, including bounded flexible constraints;
- #6 — broad 48-route freshness/capacity arithmetic; active PR #9 is changing the cadence/lock path;
- #8 — Fli-derived provider/flexible-date direction; branch `devin/issue-8` still exists, so this radar does not rewrite that scope;
- PR #11 also actively owns #2 dependency-lock work.

## External Signals

### A. CONFIRMED capability — Zerolook splits exploratory flight shopping from booking-grade truth

**Checked:** 2026-09-17 UTC.  
**First-party source:** https://www.zerolook.com/  
**Recent market event:** funding reported 2026-08-11 by PhocusWire / EU-Startups.

Zerolook's current public product positions itself as flight-search infrastructure for high-volume AI exploration. Its stated architecture is materially different from the usual “query a live shopping source for every permutation” approach:

- exploratory requests return **predicted itineraries, predicted prices, and confidence scores**;
- the company explicitly says this trades some accuracy for lower query cost and is intended for browsing/comparison where booking-grade precision is not yet required;
- when a user commits to a fare, the workflow hands off to a normal booking/distribution channel rather than claiming the exploratory answer is final booking truth;
- current developer distribution advertises REST and MCP surfaces and a free development quota, but no current quota number was relied on here.

This is useful evidence because AI Flight Radar already has the exact pressure point that broad flexible search creates: one natural-language request such as “next 60 days, 4–6 nights, several destinations” can expand into many provider operations. Existing #4/#8 already require bounded expansion, so Zerolook does **not** justify a new provider, ML subsystem, MCP, or Issue.

**Transferable workflow, not architecture:**

`cheap / broad exploratory evidence`
`→ explicit uncertainty / age / coverage`
`→ user narrows candidates`
`→ bounded live recheck`
`→ optional watch`
`→ booking handoff reconfirmation`

This extends the already-established “discovery snapshot != current verification” principle. The new part is that a market entrant is explicitly treating **query precision itself as stage-dependent**, not only freshness.

**Do not copy:** Zerolook's ML predictor, vendor confidence score, look-to-book claims, or any claimed cost reduction. Those are product/vendor assertions, not independent evidence that the same model would work on Reese-max data. AI Flight Radar currently lacks evidence that its own historical corpus is large or representative enough for a prediction layer.

### B. CONFIRMED recent platform move — Google keeps promotion to tracking explicit

**Published:** 2026-08-27.  
**First-party:** https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/

Google AI Mode now lets a user describe a flight intent, inspect current flight options, say “track these flight prices,” explicitly confirm, and receive later price-change email. This remains direct evidence for #4's explicit promotion boundary and does not create a new fingerprint.

The important comparison with Zerolook is not “AI vs non-AI.” Google is using current partner flight data for the surfaced options, while Zerolook intentionally markets approximate exploratory answers. Both still preserve a distinct step before consequential booking/tracking behavior. The common transferable pattern is **stage-aware truth and explicit promotion**, not an autonomous travel agent.

### C. CONFIRMED existing market pattern — flexible discovery may use weaker freshness than action paths

Skyscanner's current help continues to explain that flexible month/year prices are estimates based on prices found by users in recent days and can change, while an exact search/alert is a different user action. This is directionally consistent with the prior KAYAK evidence already recorded in the 2026-09-15 radar.

No new Issue is warranted from this signal because the repo already has #6 freshness/capacity calibration and #4 reviewed watch promotion.

## New Releases / recent changes

| Date / checked | Product | Change / current capability | AI Flight Radar implication |
|---|---|---|---|
| 2026-08-11 / checked 2026-09-17 | Zerolook | recent pre-seed market entry around predicted exploratory flight shopping; current site exposes predicted itinerary/price/confidence and REST/MCP | New external evidence for staged precision; do not infer ML efficacy or build a predictor |
| 2026-08-27 | Google Search / Flights | conversational flight intent can be explicitly promoted to price tracking | Existing #4 fingerprint; no duplicate |
| checked 2026-09-17 | Skyscanner | broad flexible-date prices remain estimated/recent-observation discovery rather than booking truth | Reinforces tiered truth/freshness already mapped to #6/#1 |

## Community Pain

No community-only anecdote passed the Issue gate this round. The strongest product decision is supported by current vendor/first-party capability evidence plus existing repository constraints.

No search-volume ratio, savings percentage, accuracy percentage, adoption rate, or ROI claim from Zerolook or secondary coverage is treated as an AI Flight Radar fact.

## Adjacent Ideas

1. **Stage-aware precision before provider expansion.** If flexible exploration is later approved, first ask whether every candidate truly needs a live provider lookup. A coarse candidate-ranking stage may be acceptable only if it is visibly non-bookable and followed by live verification before action.
2. **Reuse current evidence before adding ML.** A bounded offline experiment could test whether existing observation recency/history can rank a tiny fixed candidate set well enough to reduce live checks. This is a future research option, not an implementation request and not evidence that the current dataset is sufficient.
3. **Confidence must be evidence-backed.** If the product ever surfaces a confidence/coverage indicator, it should be derived from explicit observation count/age/source health, not an unexplained model score.
4. **Promotion stays explicit.** Exploratory intent must not silently become a scheduled watch or broader provider workload. Existing #4 already owns this boundary.

## Opportunity Map — AI Flight Radar

### MUST MATCH

- Source, observation time, route/date/currency/stops and freshness remain explicit.
- `NO_RESULTS`, provider error, stale/unknown, estimate, observed quote, watch trigger, and final bookable fare remain distinct states.
- Consequential actions use a bounded current/revalidated path rather than an exploratory estimate.
- Query expansion has an explicit request/cost budget and deterministic stop rule.

### SHOULD BE BETTER

- Make broad discovery cheap by **reducing unnecessary live work first**, not by silently weakening truth semantics.
- If a low-fidelity discovery layer is ever tested, show why it is uncertain using age/coverage/source evidence and make current recheck one explicit action.
- Keep provider/flexible-date changes reversible and calibrated by version.

### DIFFERENTIATOR

- Taiwan-origin, owner-controlled fare evidence with honest unknown/stale semantics.
- Historical “deal” claims based on the user's own observed corpus rather than an opaque market prediction badge.
- A possible future staged workflow where exploration can be inexpensive but every action-grade candidate is traceably revalidated.

### ADJACENT IDEA

- **Bounded offline ranking experiment** using only existing stored observations on a small fixed candidate set, followed by one/few live rechecks. This is only worth running after current #1/#6 gates and only if there is enough historical coverage to answer the research question.

### DO NOT COPY

- Zerolook's ML model or vendor confidence score without local evidence.
- Its reported look-to-book ratios or cost claims as Reese-max planning inputs.
- A second flight-shopping service merely because it has REST/MCP.
- Unbounded flexible-date expansion.
- Automatic booking/payments or a general travel agent.
- Another database, queue, registry, prediction service, or “flight intelligence framework” for this idea.

## Four-gate review — staged exploratory precision

### 1. Problem / value

**Observed repo constraint:** flexible-date/broad discovery can multiply provider work, while #6 already proves the current 48-route cadence must respect a bounded collector capacity. #8 also explicitly says flexible search must not silently explode into unbounded individual queries.

**Target user:** a Taiwan-origin traveler who is flexible on dates/destinations and wants a shortlist before spending current-provider calls on every combination.

**Existing alternatives / counterevidence:** current exact-date/date-comparison paths already work from observed quotes; users can narrow manually; #4 already supports future reviewed intent-to-watch promotion. There is no evidence that users currently need a predictive discovery layer, and no evidence that current history is large enough to estimate unobserved combinations reliably.

**Do-nothing consequence:** none for today's supported exact/bounded workflow. The opportunity only becomes material if flexible exploration is approved and live query expansion becomes a measured bottleneck.

### 2. Priority

```yaml
kind: OPPORTUNITY / possible bounded RESEARCH
severity: NOT_ESTABLISHED
decision_priority: LOW-MEDIUM
evidence: EXTERNAL_CAPABILITY_CONFIRMED / PRODUCT_NEED_NOT_ESTABLISHED
triage: NEEDS_EVIDENCE
auto_implementation: false
```

No P0/P1/P2 defect follows from a competitor/startup architecture.

### 3. Minimum solution order

1. **No change** while #1/#6 and current provider admission remain higher-value gates.
2. If flexible exploration becomes owner-approved, first use current deterministic bounded search and measure actual request expansion/cost/error.
3. Only if that measured path is materially wasteful, test one small offline ranker over existing observations with no new provider/service and no user-facing claim.
4. Revalidate selected candidates live before alert/action/booking handoff.
5. Reject the approach if historical coverage is insufficient or ranking does not reduce live work without hiding uncertainty.

A new ML service, provider, data lake, scheduler, or MCP is not the minimum answer.

### 4. Research / implementation separation

No new Issue is created. The idea overlaps existing #4 (`WatchSpec` / bounded flexible intent) and #8 (bounded flexible-date/provider work), while #8 still has a dedicated branch. If the opportunity later gets enough product evidence, the correct action is to narrow an existing tracker or run a tiny decision experiment — not grant implementation authority from this radar.

## Cross-portfolio ideas

### Stage-aware truth can reduce external work without hiding uncertainty

The reusable principle is: **broad exploration can use weaker/older/estimated evidence only when the UI/API names that state and a consequential action forces a narrower current verification.** This may apply to other evidence-heavy Reese-max products, but it does not authorize a shared prediction/cache framework.

No cross-portfolio Issue was created.

## Rejected Ideas

- **Add Zerolook as a second provider now — REJECT.** Current product already has provider/calibration/budget work; another integration duplicates the same upstream-truth problem.
- **Build a fare prediction model — REJECT.** External vendor capability is not evidence that Reese-max has adequate training/history data or user need.
- **Turn predicted price into a “cheap/expensive” badge — REJECT.** Conflicts with the evidence-first product direction unless calibrated and explainable.
- **Use vendor-reported look-to-book ratios as our demand forecast — REJECT.** They are not independent measurements of this product.
- **Open a new flexible-discovery Issue — DUPLICATE / NOT ESTABLISHED.** #4/#8 already own bounded intent/flexible-provider concerns; no independent current failure exists.
- **Expand #6 active PR scope — REJECT / SKIPPED.** PR #9 actively owns the cadence/capacity fix; this external signal does not change its root cause.

## Issue / PR Mapping

| Signal | Existing mapping | Action this run |
|---|---|---|
| broad intent -> explicit tracking | #4 | DEDUPE; no write |
| flexible-date request amplification | #8; `devin/issue-8` branch exists | DEDUPE / SKIPPED_LOCKED for scope rewrite |
| current quote / booking-handoff truth | #1 | no new runtime evidence; no write |
| broad discovery freshness/capacity | #6 / active PR #9 | no scope interference |
| dependency lock | #2 / active PR #11 (and overlap in PR #9) | no interference |

No Issue lock was taken because no Issue/comment/shared mutable tracking state was modified. A unique report file was created instead.

## Sources

### First-party / primary

- Zerolook product page, checked 2026-09-17: https://www.zerolook.com/
- Google, “3 new ways to plan and book travel in Search,” published 2026-08-27: https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/
- Skyscanner price/flexible-date help, checked 2026-09-17: https://help.skyscanner.net/hc/en-gb/categories/200368471-Prices

### Recent secondary context (not effectiveness proof)

- PhocusWire, Zerolook funding / flight-price-prediction coverage, published 2026-08-11: https://www.phocuswire.com/news/finance/zerolook-funding-flight-price-prediction
- EU-Startups, Zerolook pre-seed coverage, published 2026-08-11: https://www.eu-startups.com/2026/08/zug-based-zerolook-raises-e1-6-million-to-tackle-ai-driven-flight-search-costs/

### Repository evidence

- `Reese-max/ai-flight-radar` current `main@6228138337f950cb6399088c4f814f27a518e29e`.
- README / `docs/ROADMAP.md`.
- Product-board audit `.github/quality-audits/2026-09-15T0208Z-product-board-audit.md`.
- Existing Issues #1, #4, #6, #8; open PRs #9, #10, #11; branch search for `devin/issue-8`.
- Prior AI Flight Radar radar: `docs/competitive-intelligence/2026-09-15T220016Z-external-radar.md`.

## What Changed

1. **New external signal:** Zerolook provides recent market evidence for a staged-precision flight-shopping architecture: approximate/cheap exploration, explicit confidence, then normal booking/revalidation channels.
2. **No new defect:** the current supported exact/bounded AI Flight Radar path is not broken by this market change.
3. **No new Issue:** the useful part maps to existing #4/#8 and is lower priority than #1/#6; #8 has a dedicated branch and #6 has active PR #9.
4. **Scope got smaller, not larger:** if flexible search later becomes important, first measure actual expansion and test whether existing history can cheaply rank a bounded set. Do not begin with a prediction service or new provider.
5. **Portfolio principle:** stage-aware truth may reduce external work, but only if estimate/stale/observed/current/final states remain explicit.

## Classification / scope calibration

- Candidate classification: `OPPORTUNITY / NOT_ESTABLISHED`, decision priority `LOW-MEDIUM`, `NEEDS_EVIDENCE`, `auto_implementation=false`.
- #1/#6 remain the more concrete current gates; this radar does not reclassify them.
- #4/#8 are not upgraded in severity from competitor evidence.
- No vendor benchmark is treated as local product performance.

## Completion / gaps / cursor

- Completed: rule re-read and SHA check; full current owner repository pagination; focal default-branch/head check; roadmap/board/Issue/PR mapping; fresh external web research with first-party sources; duplicate search for Zerolook in historical radar; unique report write.
- Gaps: no live flight/provider call; no booking comparison; no measurement of flexible-search request expansion on the current product; no evidence that the historical corpus supports prediction; no independent test of Zerolook efficacy.
- Next fair cursor: `Reese-max/academic-mcp`.
