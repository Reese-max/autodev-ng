# External Competitive / Product Inspiration Radar — 2026-09-07 r2

> Scope: continuation of the same-day external radar for Reese-max non-archived product repositories. External web sources remain the primary signal source; repository evidence is used for fit, duplicate checks, and safety. Product claims are not treated as efficacy evidence, and community discussions are anecdotal signals only.

## Executive Summary

Round 2 deliberately revisited opportunities that Round 1 had left in `MEDIUM / LATER`, then promoted only those where new external evidence and current-repository evidence made the product gap concrete.

Three GitHub tracking objects were created:

1. **92-duty-scheduler #19 — explainable minimal-impact repair plans**: the project already diagnoses empty-slot causes, has candidate classification, auto-swap, fairness scoring, history and undo. The missing product step is `diagnose → propose several legal fixes → show trade-offs → preview → apply/undo`.
2. **ai-novel-workstation #2 — per-chapter Context Manifest + selective story-memory routing**: the project already has strong post-generation continuity gates, but the generation input is still a fixed context bundle and world context is prefix-truncated at 12,000 characters. Competitors are making AI-visible scope and relevance routing explicit controls, making an auditable input-context layer a strong fit.
3. **tick-stock-panel #5 — research natural-language → inspectable StrategyDef/Screener compiler**: TradingView's 2026 AI Screener shows a useful pattern where natural language maps to existing deterministic filters/columns and exposes an explanation. This is research-only here because provider coverage/freshness truth (#2) must remain a prerequisite.

The key Round-2 pattern is:

> **Move from “show the problem / expose the primitive” to “propose an inspectable next action using the same deterministic rules.”**

This principle appears across scheduling, writing context, and financial research, but it should not be implemented as a generic LLM layer. Each product already owns a safer domain-specific contract that should remain authoritative.

---

## What Changed Since Round 1

| Repo | Round 1 | Round 2 | Why it changed |
|---|---|---|---|
| 92-duty-scheduler | ADJACENT / medium-later: explain conflicts + what-if | **PROMOTED → FEATURE #19** | Repo already contains empty-slot diagnosis + swaps + fairness + undo; external workforce products confirm conflict-resolution + impact-preview as a mature workflow pattern |
| ai-novel-workstation | ADJACENT editorial/context direction | **PROMOTED → DIFFERENTIATOR #2** | Static evidence found fixed context assembly and `world_context[:12000]`; external writing products now expose AI visibility, relevance selection and long-project context-cost optimization |
| tick-stock-panel | ADJACENT visual/conditional rules | **PROMOTED only to RESEARCH #5** | TradingView released AI Screener with explicit explanation, but this repo still has a higher-priority coverage-truth issue, so feature commitment would be premature |
| soundbox-offline | local-first portability | **NO NEW ISSUE** | Whole-library backup/restore is already tracked; adding cloud sync/recommendation before recovery is solved would be feature bloat |

---

## External Signals

### 1. Workforce scheduling is moving from conflict display toward assisted repair with visible impact

**CONFIRMED — Homebase**

Homebase auto-scheduling uses availability, time off, work history and labor/compliance constraints to produce an adjustable draft rather than a final opaque schedule. Its shift-swap flow filters for compatible role/skills/availability and lets managers inspect effects such as overtime before approval.

Sources:
- https://www.joinhomebase.com/employee-scheduling/auto-scheduling
- https://www.joinhomebase.com/employee-scheduling/ai-employee-scheduling-software
- https://www.joinhomebase.com/employee-scheduling/shift-swapping
- https://www.joinhomebase.com/releases

**CONFIRMED — When I Work, updated 2026-03-16**

Scheduler conflicts are explicitly surfaced when an employee has approved time off, is unavailable, or already has an overlapping shift.

Source:
- https://help.wheniwork.com/articles/interpreting-availability-on-the-schedule-computer/

**Transferable principle:** do not merely report a conflict. Generate a bounded set of legal, reversible repair candidates and expose what each candidate changes.

**Repository fit:** `92-duty-scheduler` already has the hard pieces: `analyzeEmptySlots()`, candidate categories, swap logic, weighted fairness, history and undo. The differentiator is school/police-specific constraint repair rather than payroll optimization.

### 2. Long-form AI writing products are making “what the AI sees” a first-class control

**CONFIRMED — Sudowrite visibility controls**

Sudowrite supports hiding whole Character / Worldbuilding cards or individual traits from AI features. Its Saliency Engine also performs relevance selection before passing story context to generation.

Sources:
- https://docs.sudowrite.com/using-sudowrite/1ow1qkGqof9rtcyGnrWUBS/visibility-settings/4KL8gFeLZP6ep8keUhKVGp
- https://docs.sudowrite.com/using-sudowrite/1ow1qkGqof9rtcyGnrWUBS/saliency-engine/4KL8gFeLZNvk8CEeXpfwB2

**CONFIRMED — Sudowrite, 2026-08-03**

Generate Scenes was changed to pull less redundant context to reduce generation cost on longer projects.

Source:
- https://feedback.sudowrite.com/changelog

**CONFIRMED — Sudowrite mobile, 2026-05-28**

Mobile added support for hiding characters and world-building entries from AI.

Source:
- https://apps.apple.com/us/app/sudowrite-ai-novel-writing/id6740884542

**CONFIRMED — Novelcrafter**

Novelcrafter added finer Codex tracking controls, including case-sensitive matching, excluded phrases and multiple custom categories.

Source:
- https://novelcrafter.canny.io/changelog/new-codex-tracking-options

**COMMUNITY / PRODUCT FEEDBACK SIGNAL**

Sudowrite's own feedback board includes a request for an “AI-visible-only” view from a user managing 100+ worldbuilding elements. This is not market-size evidence, but it directly illustrates the operational pain of not being able to audit visible context.

Source:
- https://feedback.sudowrite.com/p/ai-visible-only-mode-for-worldbuilding-elements-and-character-cards

**Transferable principle:** context selection itself needs provenance, visibility controls and reproducibility. A post-generation continuity checker does not answer which source material actually reached the model.

### 3. Financial screeners are using AI as a constrained compiler, not as the calculation engine

**CONFIRMED — TradingView AI Screener, launched 2026-08-17**

TradingView lets a user describe a stock-screening idea in natural language, then maps it into the platform's existing filters, columns and sorting. An `Explanation` view exposes why filters/columns were selected; unsupported mappings produce a request to rephrase instead of inventing arbitrary filters.

Sources:
- https://www.tradingview.com/blog/en/ai-screener-60101/
- https://www.tradingview.com/support/solutions/43000785770-how-to-use-the-ai-screener/
- https://tw.tradingview.com/support/solutions/43000785770/

**CONFIRMED — TradingView Pine Screener, 2026-08/09**

Pine Screener now supports index universes and a broader set of compatible indicators/scripts. The underlying screener remains a defined deterministic surface.

Sources:
- https://www.tradingview.com/pine-script-docs/release-notes/
- https://www.tradingview.com/blog/en/pine-screener-update-60542/

**CONFIRMED — Koyfin**

Koyfin persists explicit price, valuation, technical and news conditions as alerts across watchlists/portfolios and centralizes their management.

Sources:
- https://www.koyfin.com/features/alerts/
- https://www.koyfin.com/features/watchlists/

**Transferable principle:** AI may lower configuration friction, but execution should remain an inspectable deterministic object. In `tick-stock-panel`, any future compiler must reuse StrategyDef/screener/backtest and provider capability gates rather than create a parallel “AI stock picker.”

---

## Repository Evidence That Changed Decisions

### 92-duty-scheduler

Confirmed current capabilities:
- README: one-click scheduling using fairness, free periods, gender, week and other constraints.
- README: automatic swaps, including cross-duty swaps.
- README: candidate picker distinguishes direct availability, swap and cross-duty states.
- README: history editing and undo.
- `app.js`: `analyzeEmptySlots()` presents an empty-slot diagnostic panel with reasons such as `allBusy`, `allAssigned`, `saturated`, `unknown`.
- UI contains weighted fairness / unassigned statistics.

The missing layer is therefore not diagnosis or swapping; it is **ranked repair-plan composition with explicit deltas and preview**.

Issue: https://github.com/Reese-max/92-duty-scheduler/issues/19

### ai-novel-workstation

Confirmed current capabilities:
- `books/` is the story truth source.
- production loop has checkpoints, token/step/time budgets and fail-closed gates.
- deterministic continuity checking already exists and is used as a hard gate.
- `lib/services/memory.py::build_context()` always assembles a fixed set of truth/state inputs.
- `_world_context(..., limit=12000)` concatenates world Markdown and returns a prefix slice `text[:limit]`; the code comment already notes chapter-related retrieval as a possible future improvement.

The missing layer is therefore not another continuity checker or generic RAG. It is **a versioned manifest of actual model-visible context + deterministic relevance/budget routing before generation**.

Issue: https://github.com/Reese-max/ai-novel-workstation/issues/2

### tick-stock-panel

Confirmed current capabilities:
- existing `StrategyDef`, dependency resolver, filters/signals/scoring and backtest machinery;
- screener/strategy-monitor integration;
- provider `CapabilitySet` probing/limits;
- existing Issue #2 already identifies a dangerous mismatch between claimed full-market coverage and actual watchlist-only provider scope.

Therefore natural-language screen construction is only valid as **research behind the coverage/capability truth gate**.

Research Issue: https://github.com/Reese-max/tick-stock-panel/issues/5

---

## Opportunity Map — Round 2

| Opportunity | Classification | Repo | Score* | Decision |
|---|---|---|---:|---|
| Explainable minimal-impact schedule repair plans | DIFFERENTIATOR | 92-duty-scheduler | 93/100 | FEATURE #19 created |
| Auditable Context Manifest + selective story-memory routing | DIFFERENTIATOR | ai-novel-workstation | 94/100 | FEATURE #2 created |
| Natural-language → inspectable StrategyDef/Screener compiler | RESEARCH_REQUIRED / ADJACENT | tick-stock-panel | 82/100 | RESEARCH #5 created; no feature commitment |
| Whole-library portable backup | MUST MATCH | soundbox-offline | already tracked | No duplicate; existing Issue owns it |
| Broad cloud sync for soundbox | DO NOT COPY / DEFER | soundbox-offline | 52/100 | Rejected until local recovery/portability is solved |

\* Heuristic combines User Pain, Strategic Fit, Novelty, Evidence Strength, Reuse Potential and implementation effort, with security/privacy/cost risk as penalty. It is not a market forecast or efficacy score.

---

## Cross-Portfolio Insight

The three promoted ideas share one architecture pattern:

```text
Domain truth / rules
        ↓
Deterministic candidate or context compiler
        ↓
Visible explanation / manifest / delta
        ↓
Human preview or explicit confirmation
        ↓
Existing authoritative execution path
        ↓
Post-action verification + undo / replay / evidence
```

Examples:
- duty scheduler: constraints → repair candidates → schedule delta → preview → existing mutation → undo;
- novel workstation: truth files → context selector → manifest → write → continuity/quality gate → frozen replay;
- stock panel: user phrase → allowlisted strategy AST → explanation/coverage gate → existing screener/backtest.

This pattern is more reusable than “add an AI chat box” and should be considered a design principle across the portfolio.

---

## Ideas Rejected / Deferred

1. **92-duty-scheduler: full autonomous AI scheduling** — rejected. Deterministic constraints, preview and operator authority are a better fit.
2. **ai-novel-workstation: generic embedding/vector database immediately** — rejected. Existing structured truth + chapter plan/entity information is sufficient to test deterministic relevance routing first.
3. **tick-stock-panel: conversational buy/sell assistant** — rejected. It conflicts with the simulation/data-trust boundary and is not necessary to get the configuration-UX benefit.
4. **soundbox-offline: account/cloud sync before backup** — rejected/deferred. It weakens the local-first positioning while the existing whole-library recovery gap is still open.
5. **Any repo: copy a competitor feature solely because it exists** — rejected by default unless it maps to a concrete user job and current product gap.

---

## Issue Mapping

### New in r2
- `Reese-max/92-duty-scheduler#19` — `[Competitive Inspiration][FEATURE] 將空缺診斷升級為可解釋的最小影響修復方案`
- `Reese-max/ai-novel-workstation#2` — `[Competitive Inspiration][DIFFERENTIATOR] 建立可追溯的章節 Context Manifest 與選擇性故事記憶路由`
- `Reese-max/tick-stock-panel#5` — `[Research][Competitive Inspiration] 評估自然語言→可檢查 StrategyDef／Screener 規則編譯器`

### Existing items intentionally reused / not duplicated
- `Reese-max/tick-stock-panel#2` — provider coverage truth remains prerequisite for any new screener UX.
- `Reese-max/soundbox-offline#1` — whole-library backup/restore remains the correct local-first portability work item.
- Round-1 competitive issues remain active: `cyber-prep-coach#4`, `ppt-studio#3`.

---

## Next Radar Targets

For the next round, prioritize products where the portfolio already has a strong domain engine but may lack an inspectable next-action layer:

1. `taichung-police-intel` / `taiwan-intel-dashboard` — evidence packs, source-set contracts, delta/change detection and operator response workflows.
2. `note-filler` — source-grounded acceptance workflow and evidence-pack reuse rather than generic generation.
3. `skill-foundry` / `herdr-skills` — portable workflow skills with executable evaluation contracts, not just prompts.
4. `voice-actress` / `police-exam-practice` — reuse learner-state primitives after the current grading/provenance reliability boundaries are healthy.
5. `soundbox-offline` — only revisit new user-facing capabilities after backup/restore is resolved or explicitly planned.

## Round Boundary

This round performed public-web research, current repository/Issue/PR/code inspection, duplicate checks, and GitHub Issue creation. It did **not** modify product source code, create implementation branches, merge PRs, deploy, change secrets/permissions/settings, execute financial trades, or claim runtime success for any proposed feature.
