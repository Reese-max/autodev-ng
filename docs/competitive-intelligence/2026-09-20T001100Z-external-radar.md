# External Competitive Radar — 2026-09-20T00:11:00Z

Status: **COMPLETE**

## Scope / Direction Check

- Issue Quality v2: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected GitHub owner inventory was enumerated with pagination in this run: **42 Reese-max-owned repositories / 41 unarchived**. `obsidian-vault` is archived and excluded. This differs from the preceding radar's 41/40 snapshot; the fresh listing, not the older inventory, is used for this round.
- Fair-rotation focal repository: `Reese-max/tick-stock-panel`.
- Current default HEAD rechecked immediately before report write: `main@54c303476e5d643d37c0195876c35593d234603f` (`docs: add 2026-09-18 tick-stock product board audit`). Product-code baseline remains `565ccdfee6c2fb0c079cd4192edb9cb31c9157f4`; later commits are audit documentation.
- Owner-approved direction from `.github/quality-audits/2026-09-18T2003Z-product-board-audit.md`: **MAINTAIN / SIMPLIFY**, with narrow investment in trustworthy Taiwan/A-share research. Current focus remains #6 generated/custom Python execution boundary, #2/PR #9 result-bound coverage/freshness, and #7/PR #8 truthful release execution receipts.
- Explicit non-goals remain: brokerage/order execution, personalized financial advice, social feed, native-mobile parity, global-terminal breadth, plugin marketplace, generic agent framework, new database/ledger, and unrestricted natural-language-to-Python expansion.
- Active work was not taken over: PR #9 owns coverage-contract changes including `abnormal_moves.build_overview()` receipt fields; PR #8 owns the release-gate evidence work. No PR scope or comments were modified.
- No product source, CI/config, secrets, repository settings/permissions, implementation branch, deployment, GOAL/worker, paid service, or production data was changed.

## Current Repository Evidence

The product presents **異動監控** as an approximate exchange-rule risk monitor using 3d/10d/30d deviation from a corresponding index, and the UI explicitly says it is not a regulator determination.

Current source contains a material split between historical and intraday benchmark semantics:

- `backend/app/indicators/pipeline.py` defines exchange-specific benchmark preference: SH → `000002.SH` / fallback `000001.SH`; SZ → `399107.SZ` / fallback `399001.SZ`; BJ → `899050.BJ` / fallback.
- `backend/app/services/abnormal_moves.py::_bench_rt_pct()` instead fetches all available benchmark candidates and returns a **single mean percentage**.
- `build_overview()` then applies that scalar to every symbol via `rt_delta = stock_rt_pct - bench_rt`, before calculating 3d/10d/30d `closeness` and `triggered / edge / watch` state.
- Existing `test_abnormal_moves.py` supplies only one index quote in its fake, so a cross-exchange divergence case is not exercised.

This means the live overlay can depart from the repository's own historical `对应指数` contract when SH/SZ/BJ benchmarks move differently. It is a concrete supported-workflow correctness issue, not a request for a new benchmark registry or framework.

Severity brake: no production false alert or user loss was observed in this run; the page already describes the rules as approximate and non-regulatory. Runtime magnitude remains unknown.

## Product → Market Category

1. Self-hosted Taiwan/A-share research workbench.
2. Screener / strategy / backtest / market-monitoring workspace.
3. Provider-aware local market-data analysis.
4. Deterministic quantitative research with optional AI-assisted setup.
5. Non-trading risk/attention monitoring.

Competitor features are not requirements by themselves.

## External Signals

### 1. CONFIRMED — SSE's current rule defines deviation against the corresponding index

**Published: 2026-04-24. Effective: 2026-07-06. Checked: 2026-09-20.**

Source: https://www.sse.com.cn/lawandrules/sselawsrules2025/stocks/exchange/c/c_20260424_10816482.shtml

The current Shanghai Stock Exchange `Trading Rules (2026 Revision)` defines the cumulative closing-price deviation in Rule 5.4.2 as the security's cumulative return minus the **corresponding index** return. The same current rule set also reflects the 2026 risk-warning-stock normalization already acknowledged by this repository.

Product implication: an intraday monitor that claims a corresponding-index approximation should not replace that benchmark with the mean of unrelated exchange indices. External rule evidence confirms the semantic direction; it does not prove a live incident.

### 2. CONFIRMED — TradingView moved Screener triage toward alternate views without changing the underlying selection

**Published: 2026-09-09 and 2026-09-11. Checked: 2026-09-20.**

Sources:
- https://www.tradingview.com/blog/en/heatmap-view-in-screener-60678/
- https://www.tradingview.com/blog/en/screener-chart-view-indicators-60757/

TradingView added a heatmap view to its Screeners on 2026-09-09 and light moving-average overlays to the Screener chart view on 2026-09-11. The important workflow pattern is not merely “has a heatmap”: the **same filtered result set** can be read as table, chart, or heatmap while preserving the screen selection, and the view can persist with the saved screen.

Transferable idea: reduce manual sorting/visual comparison only after the result's scope/provenance is trustworthy. This is `ADJACENT_IDEA`, not a feature mandate. There is no repo/user evidence yet that current table/card representations are a high-impact blocker.

### 3. CONFIRMED — Pine Screener now removes manual watchlist construction for index universes

**Published: 2026-09-01. Checked: 2026-09-20.**

Source: https://www.tradingview.com/blog/en/pine-screener-update-60542/

Pine Screener can now use an index directly as symbol source rather than requiring a manually built watchlist first. This reduces one cross-tool/manual setup step while keeping the symbol universe explicit.

Transferable idea: universe selection should be an explicit input/receipt, not an invisible assumption. This reinforces #2 / PR #9's result-bound `coverage / universe_size / as_of` work. It does **not** justify adding global index catalogs or a second universe service.

### 4. CONFIRMED — Fugle capability and entitlement remain operation-specific

**Current pricing/docs checked: 2026-09-20.**

Source: https://developer.fugle.tw/docs/pricing/

Fugle's current personal plans still distinguish per-symbol intraday API access from full snapshot entitlement and materially different request-rate limits. Basic supports 60/min intraday calls and no snapshot; paid plans expose snapshot capability with higher limits.

This re-confirms the current product direction that provider name alone is insufficient to infer coverage. It is already tracked by #2 / PR #9 and therefore does not create a second Issue. No paid-plan support or subscription is authorized by this radar.

## New Releases / Market Moves

| Date | Product / source | Signal | Confidence | Radar consequence |
|---|---|---|---|---|
| 2026-09-11 | TradingView Screener | mini-chart view gains MA context | CONFIRMED | Adjacent triage UX only; do not distract from trust blockers |
| 2026-09-09 | TradingView Screener | filtered results can switch to heatmap while preserving selection | CONFIRMED | Preserve one result contract across views if ever explored |
| 2026-09-01 | TradingView Pine Screener | index can be symbol source without manual watchlist | CONFIRMED | Reinforces explicit universe/coverage receipts; dedupe to #2 |
| Effective 2026-07-06 | Shanghai Stock Exchange | corresponding-index deviation remains the operative rule contract | CONFIRMED | Exposes current intraday benchmark-averaging bug |
| Current docs | Fugle | entitlement-specific snapshot/rate capability | CONFIRMED | Dedupe to #2 / PR #9; no paid commitment |

## Community Pain

No community signal was retained. First-party exchange/product sources plus deterministic repository evidence were sufficient to establish the current decision; anecdotal prevalence would not change the priority or authorize expansion.

## Adjacent Ideas

### A. One result, multiple representations

If real users later show scanning/triage friction, the smallest experiment is to reuse an existing result object and let users switch representation while preserving exactly the same `rule / universe / provider / as_of / partial` receipt. Do not build a parallel calculation path for heatmap/chart mode.

### B. Explicit universe source

TradingView's index-source workflow suggests a useful design principle: universe choice is a first-class research input. For this repository, current #2 / PR #9 coverage metadata is the correct foundation; there is no evidence for a new global index catalog now.

## Opportunity Map — `tick-stock-panel`

| Bucket | Decision | Evidence / reason |
|---|---|---|
| MUST MATCH | Intraday abnormal-deviation math uses the corresponding exchange benchmark, not a cross-exchange mean | Current source + effective SSE rule; supported risk-monitor workflow |
| MUST MATCH | Result-bound provider / coverage / universe / as-of / partial truth | Existing #2 / PR #9; Fugle capability docs reinforce it |
| SHOULD BE BETTER | Reuse one provenance-bearing result across future table/chart/heatmap representations | TradingView Sep 9/11 pattern; only after current trust blockers |
| DIFFERENTIATOR | Local/self-hosted Taiwan/A-share research with inspectable point-in-time inputs and non-trading boundary | Owner-approved product wedge |
| ADJACENT IDEA | Explicit index/universe source and view persistence | Useful workflow pattern, not established user pain |
| DO NOT COPY | Global terminal breadth, brokerage execution, social feed, native mobile parity, opaque AI recommendations, provider-count race | Outside approved scope / would dilute current trust work |

## Four-Gate Decision

### Candidate: intraday abnormal-deviation overlay applies one averaged benchmark to every exchange

Fingerprint:

`tick-stock-panel + AbnormalMoves intraday overlay + multiple exchange benchmark quotes available + one averaged benchmark applied to every symbol + deviation/closeness can differ from corresponding-index rule`

Classification:

- `kind=BUG`
- `severity=P2`
- `decision_priority=HIGH`
- `evidence=SOURCE_CONFIRMED`
- `triage=NEEDS_REVIEW`
- `auto_implementation=false`
- runtime status: `NEEDS_RUNTIME_VERIFICATION`

### Gate 1 — Problem / value

Target user: self-hoster/researcher using the supported intraday abnormal-move monitor.

Observable break: historical deviation uses exchange-specific benchmarks, while the realtime overlay averages all available benchmark candidates and applies that value to every symbol. The user-facing state (`watch/edge/triggered`) is derived from the resulting closeness and can therefore change because of an unrelated exchange's index move.

Existing alternatives are not sufficient: the disclaimer prevents regulatory overclaiming but does not make the numeric calculation internally consistent. The product already has the benchmark mapping, so the root cause is local selection logic rather than missing architecture.

### Gate 2 — Priority

P2 is established because a supported, prominently documented monitoring path can materially misstate completion/risk-attention state when exchange benchmarks diverge. P1 is **not** established: no production incident, loss, regulatory reliance, or observed real-user harm was found; the feature is research-only and explicitly approximate.

`decision_priority=HIGH` because this is a small correctness repair aligned with the approved trust-first direction, not because it authorizes implementation.

### Gate 3 — Minimum approach

Compare smaller options:

- **No change / docs only:** insufficient; numeric state remains wrong.
- **Local code correction:** sufficient. Reuse existing SH/SZ/BJ benchmark preference, compute live benchmark returns per exchange, and select per symbol.
- **New benchmark registry/service/database:** unnecessary ownership and maintenance burden.

Missing corresponding benchmark must remain explicit/degraded rather than silently averaging another exchange. Existing documented fallback may be reused where already defined.

### Gate 4 — Research / implementation separation

This is a source-confirmed BUG, not speculative research. Tracking can be created now, but implementation remains `NEEDS_REVIEW / auto_implementation=false`.

Direct verification required:

1. deterministic SH and SZ benchmark fixtures with deliberately divergent returns;
2. each symbol uses its corresponding benchmark, never the mean;
3. BJ follows the existing documented benchmark/fallback contract;
4. missing benchmark is explicit/degraded;
5. a boundary fixture demonstrates the expected `watch/edge/triggered` difference;
6. historical deviation semantics remain aligned.

Result: **NEW ISSUE CREATED — `Reese-max/tick-stock-panel#10`.**

## Rejected / Deduplicated Ideas

1. **Build Screener heatmap/chart mode now — HOLD.** Strong current competitor pattern, but no observed local user bottleneck justifies distracting from #6/#2/#7 and the new correctness bug.
2. **Add a global index/universe catalog — REJECT.** TradingView's workflow signal is useful, but explicit local universe metadata is the transferable idea; global breadth is outside the approved wedge.
3. **Add Fugle paid snapshot support/subscription now — HOLD / DEDUPE.** Current entitlement semantics reinforce #2, but there is no owner evidence supporting a paid commitment or broader provider scope.
4. **Create another natural-language Screener Issue — DEDUPE.** #5 already owns deterministic natural-language → StrategyDef research; TradingView's current AI/Pine Screener direction does not grant implementation authority.
5. **Expand PR #9 to fix the new benchmark bug — SKIPPED_ACTIVE_SCOPE.** PR #9 already owns coverage-contract changes and touches `build_overview()`. Do not silently enlarge an active implementer's scope; #10 tracks the distinct root cause separately.
6. **Brokerage/live trading or automated action from abnormal alerts — REJECT.** Explicit product non-goal and unnecessary to solve the correctness issue.

## Issue / PR Mapping

- **NEW:** `tick-stock-panel#10` — `[BUG][P2][ABNORMAL] Intraday deviation applies one averaged benchmark to every exchange`
  - `SOURCE_CONFIRMED`
  - `NEEDS_REVIEW`
  - `auto_implementation=false`
  - `NEEDS_RUNTIME_VERIFICATION`
  - URL: https://github.com/Reese-max/tick-stock-panel/issues/10
- Existing #2, #5, #6, #7 were not rewritten.
- Active PR #9 remains the owner of result-bound coverage/freshness scope; active PR #8 remains the owner of release-gate evidence. No comments or scope changes were made.
- Final pre-write de-dup search found no Issue with the benchmark-average/corresponding-index fingerprint.

## Cross-portfolio Ideas

One principle is worth retaining without creating a generic framework:

> When a product computes a user-visible state from a benchmark/reference series, the **reference identity is part of the result provenance**. A single averaged proxy must not silently replace a documented per-entity reference relationship.

Apply this only to repositories that actually calculate benchmark-relative state; do not open portfolio-wide work from the principle alone.

## Sources

### External / first-party

1. Shanghai Stock Exchange — `Trading Rules (2026 Revision)`, published 2026-04-24, effective 2026-07-06: https://www.sse.com.cn/lawandrules/sselawsrules2025/stocks/exchange/c/c_20260424_10816482.shtml
2. TradingView — `Visualize your Screener results with heatmap view`, 2026-09-09: https://www.tradingview.com/blog/en/heatmap-view-in-screener-60678/
3. TradingView — `Screener chart view adds moving averages and more flexibility`, 2026-09-11: https://www.tradingview.com/blog/en/screener-chart-view-indicators-60757/
4. TradingView — `Pine Screener: scan any index, pick any script`, 2026-09-01: https://www.tradingview.com/blog/en/pine-screener-update-60542/
5. Fugle Developer Docs — current Taiwan market-data pricing/capabilities, checked 2026-09-20: https://developer.fugle.tw/docs/pricing/

### Repository evidence

- `tick-stock-panel/main@54c303476e5d643d37c0195876c35593d234603f`
- product-code baseline `565ccdfee6c2fb0c079cd4192edb9cb31c9157f4`
- `.github/quality-audits/2026-09-18T2003Z-product-board-audit.md`
- `README.md`
- `backend/app/indicators/pipeline.py`
- `backend/app/services/abnormal_moves.py`
- `backend/app/services/quote_service.py`
- `backend/tests/test_abnormal_moves.py`
- all-state issue search, all-state PR search for the benchmark/deviation fingerprint, and branch search were performed before the new Issue write

## What Changed This Round

- **1 new source-confirmed P2 BUG** opened: #10.
- **0 existing Issues modified/comments added.**
- **0 PR comments or scope changes.**
- **0 product-code / CI / config / secret / permission changes.**
- **0 implementation authorization.**
- Fresh external exchange-rule evidence plus repository control-flow evidence exposed a distinct correctness root cause in intraday abnormal-deviation calculation.
- Recent TradingView Screener releases provide useful workflow inspiration, but they remain lower priority than current trust/correctness blockers.

## Completion / Gaps / Cursor

- Fresh inventory: **42 owned / 41 unarchived**; this round did not assume the previous 41/40 inventory remained exhaustive.
- Rules blob SHA confirmed: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Focal default HEAD rechecked before report write: `54c303476e5d643d37c0195876c35593d234603f`.
- No live market session, provider API, brokerage path, production alert, or destructive action was executed. #10 remains `NEEDS_RUNTIME_VERIFICATION`.
- The report does not claim that any real user received a false alert, and it does not claim exact regulatory equivalence for the approximate monitor.
- This radar does **not** declare `tick-stock-panel` or the portfolio CLEAN.
- Next fair-rotation target: `Reese-max/travel-planning-mcp`.