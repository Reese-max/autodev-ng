# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-23T13:58:49Z

Status: **COMPLETE**

## Scope / Direction / Inventory

- Quality gate: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`; blob SHA **`8167e10798071d2276addaff6b201c6b0e904a2a`**.
- Fresh connected-GitHub pagination was completed in this run: **42 Reese-max-owned repositories / 41 unarchived**. `obsidian-vault` is the only archived repository; page 2 was empty. Older inventories were not treated as exhaustive.
- Fair-rotation focus: **`Reese-max/tick-stock-panel`**.
- Default branch rechecked before report write: **`main@54c303476e5d643d37c0195876c35593d234603f`**. The current head is the 2026-09-18 product-board audit commit; the board records product-code baseline `565ccdfee6c2fb0c079cd4192edb9cb31c9157f4` and treats later audit-only commits separately.
- Owner-approved direction remains **MAINTAIN / SIMPLIFY**: protect a self-hosted, inspectable Taiwan/A-share research workflow with provider-aware coverage/freshness, point-in-time inputs, deterministic screeners and reproducible backtests. Do not expand into brokerage execution, personalized financial advice, social feed, native-mobile parity, global-terminal breadth, plugin marketplace, generic agent framework, a new ledger/database, or unrestricted natural-language-to-Python.
- Current priority work was not taken over: #6 generated/custom Python execution boundary; #2 / open PR #9 result-bound coverage/freshness; #7 / open PR #8 truthful release execution receipts; #10 corresponding-index abnormal-move correctness. PR #8 and PR #9 are both still open and unmerged.
- This radar changed no product source, CI/config, secrets, permissions/settings, implementation branch, deployment, worker/GOAL, paid service, or production data.

## Product → Market Category

`tick-stock-panel` is best treated as:

1. self-hosted Taiwan/A-share quantitative research workbench;
2. deterministic screener / strategy / backtest / monitoring workspace;
3. provider-aware local market-data analysis;
4. inspectable research with optional AI-assisted setup, not an AI stock-advice or broker-execution product.

The external scan therefore looked for workflow reductions around screening, explanation, comparison and strategy validation—not merely feature-count parity.

## External Signals

### A. Direct competitor — Koyfin adds criterion-level “why did this ticker pass/fail?” inspection

**CONFIRMED — published and updated 2026-09-10; checked 2026-09-23.**

Source: https://www.koyfin.com/help/release-notes/check-ticker/

Koyfin’s new **Check Ticker** flow lets a user choose a saved screen and any security, then see one row per criterion with the security’s current value and a pass/fail result. It is reachable both from the saved-screen surface and from a security page. Koyfin explicitly positions the workflow as removing manual cross-referencing of metrics. Availability is Plus and above according to the same official release note.

**User job solved:** “I expected this ticker to appear / not appear—show me exactly which rule decided it.”

**Manual steps reduced:** opening the screen definition, opening the ticker, locating every metric, comparing each value to each threshold, and determining which rule excluded the security.

**Transferable pattern:** make an already-deterministic rule set inspectable against one concrete subject without changing or re-running the definition in a second analysis system.

**Do not copy:** paid-tier packaging, advisor-specific workflows, or a second rule evaluator merely to generate explanations.

### B. Adjacent workflow — TrendSpider puts cross-symbol robustness in one backtest table

**CONFIRMED — published 2026-07-22; checked 2026-09-23.**

Source: https://trendspider.com/blog/group-strategy-tester/

TrendSpider’s Group Strategy Tester runs one or more strategies across symbol lists, timeframes and backtest depths, then places the combinations in one sortable comparison table. The stated workflow goal is to distinguish a strategy that works robustly across a group from one that only looks good on a cooperative single symbol. The July changelog confirms this was a rebuilt/renamed product surface with guided first-run setup and richer result comparison.

Source: https://trendspider.com/blog/july-2026-changelog/

**User job solved:** test whether a strategy’s apparent edge survives different symbols / windows instead of manually repeating single-symbol backtests.

**Transferable pattern:** keep the strategy definition fixed while varying universe / timeframe / depth, and keep those dimensions attached to each result row.

**Repository counter-evidence:** `tick-stock-panel` already has factor/strategy backtests plus nested out-of-sample factor/strategy mining, candidate comparison and explicit publish gates. This signal therefore does **not** establish a missing core backtesting feature. The useful principle is the compact comparative receipt, not a new backtest engine.

### C. New-tool possibility — pasted ticker lists can become a temporary scan universe without a separate setup ritual

**CONFIRMED — TrendSpider July 2026 changelog, published 2026-07-31; checked 2026-09-23.**

Source: https://trendspider.com/blog/july-2026-changelog/

TrendSpider says Sidekick can accept a pasted ticker list, create a watchlist from that list, and run a scanner against it. The value is not “AI has another tool”; it compresses a small cross-tool sequence—prepare list → create universe → switch to scanner → select universe—into one bounded handoff.

For `tick-stock-panel`, the safe transferable idea is **ephemeral explicit universe input** that still appears in the result receipt. It is not evidence for an autonomous agent, hidden watchlist mutation, new database, or provider expansion.

## New Releases / Strategy Moves

| Date | Product | Signal | Confidence | Consequence for `tick-stock-panel` |
|---|---|---|---|---|
| 2026-09-10 | Koyfin | Check Ticker explains each saved-screen criterion for any security | CONFIRMED | New high-quality workflow signal; keep as bounded opportunity pending local pain evidence |
| 2026-07-31 | TrendSpider | Sidekick can turn pasted tickers into a watchlist then scan it | CONFIRMED | Adjacent universe-input simplification; no agent/framework mandate |
| 2026-07-22 | TrendSpider | Group Strategy Tester compares strategy × symbol × timeframe/depth in one table | CONFIRMED | Reinforces robustness / comparative receipts; current product already has substantial OOS/mining capability |
| 2026-09-09 / 2026-09-11 | TradingView | Screener heatmap / chart-view improvements | CONFIRMED, previously reviewed | No new decision; already captured in the 2026-09-20 radar and deliberately not duplicated |

## Community Pain

No community anecdote was promoted into a finding this round. The first-party product releases were sufficient to identify the workflow patterns, while there is still **no direct local user evidence** showing that `tick-stock-panel` users frequently fail because they cannot explain one ticker against a screen or cannot paste a temporary universe. Community posts would not establish prevalence for this product and would not change the gate result.

## Current Repository Evidence Relevant to the New Signal

Current default-branch screener evidence was inspected rather than inferring from the README alone:

- `backend/app/services/screener.py::ScreenerResult` carries `as_of`, `strategy`, matching `rows`, `total` and `elapsed_ms`; it does not currently carry a criterion-by-criterion decision trace.
- The custom screener path takes a list of conditions, applies them to the enriched dataset and returns **matching rows**. A non-matching security is therefore absent rather than accompanied by a structured “failed criterion X” receipt.
- `backend/app/api/screener.py::CustomRequest` forwards the conditions into that existing path; preset screening uses the existing StrategyEngine. The product already has deterministic rule machinery and should not duplicate it merely to explain results.
- The README already exposes 18 built-in strategies, custom conditions, strategy/factor backtesting, nested out-of-sample mining and an explicit candidate publication gate.

This is enough to identify a plausible manual investigation step, but **not** enough to prove material user pain, frequency, conversion impact or a P2 defect.

## Opportunity Map — `tick-stock-panel`

| Bucket | Decision | Why |
|---|---|---|
| **MUST MATCH** | Existing trust/correctness blockers remain first: safe custom/generated-code boundary (#6), truthful result coverage/freshness (#2 / PR #9), corresponding-index math (#10), truthful release execution evidence (#7 / PR #8) | Current repo evidence and approved direction; competitor novelty does not outrank correctness |
| **SHOULD BE BETTER** | If real support/research evidence appears, explain a saved deterministic screen against one ticker with per-criterion value + pass/fail + `as_of`/coverage | Koyfin demonstrates a concise workflow that reduces manual comparison without requiring another AI system |
| **DIFFERENTIATOR** | One local/self-hosted research receipt tying provider/coverage/universe/as-of → deterministic rule → result/backtest evidence | Fits owner-approved Taiwan/A-share trust wedge |
| **ADJACENT IDEA** | Reuse an explicit pasted/selected universe and compare existing strategy results across symbols/timeframes without hidden mutation | TrendSpider patterns; useful only if current workflow friction is observed |
| **DO NOT COPY** | Broker execution, generic AI trading adviser, arbitrary generated-code expansion, global-terminal breadth, opaque auto-created persistent watchlists | Outside approved scope or directly conflicts with #6 / non-trading boundary |

## Four-Gate Decision

### Candidate: criterion-level “Check this ticker against this saved screen” explanation

Fingerprint:

`tick-stock-panel + saved/preset screener + user investigates a specific included/excluded symbol + current result returns matches but no per-criterion verdict for an arbitrary symbol + manual rule/metric cross-check is required`

Provisional classification:

- `kind=OPPORTUNITY`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `evidence=NEEDS_EVIDENCE`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- runtime: `NEEDS_RUNTIME_VERIFICATION` only if a research spike is later authorized

### Gate 1 — Problem / value

Target user: a self-hoster/researcher who has a saved deterministic screen and asks why a specific symbol was included or excluded.

Plausible manual breakpoint: current screening returns matches; diagnosing one absent ticker can require reading the rule definition, locating its metric values and manually comparing conditions. Koyfin independently demonstrates that this is a coherent workflow worth productizing.

However, no current `tick-stock-panel` user report, support trace, task replay or observed abandonment was found showing this is a material blocker. Existing workarounds—inspect the strategy/conditions and the security’s metrics—may be adequate for the current product scale. The opportunity therefore fails the issue/value evidence threshold for immediate tracking.

### Gate 2 — Priority

No P2/P1 severity is established. The signal concerns investigation convenience and explainability, not a demonstrated incorrect result, data loss, privilege failure or major supported-task failure. It remains behind #6/#2/#10/#7.

### Gate 3 — Minimum approach if evidence later appears

Compare in order:

1. **No code change:** improve existing strategy/condition visibility if the friction is only discoverability.
2. **Reuse existing evaluator:** given one existing saved/preset rule and one symbol, return the evaluator’s already-known criterion IDs/operators/thresholds, observed values, pass/fail, `as_of`, universe/coverage and unavailable-data reason.
3. Only if existing rule machinery cannot expose those decisions without semantic duplication should a narrow explanation adapter be considered.

Do **not** build a second strategy engine, LLM explainer, rule registry, database, audit ledger or generic explainability framework.

### Gate 4 — Research / implementation separation

No Issue is created this round. If owner/user evidence later makes the breakpoint material, a bounded research fixture can answer the question with 5–10 representative existing strategies and deliberately chosen pass/fail boundary symbols:

- **BUILD** only if criterion verdicts can be produced from the same evaluator semantics with no second source of truth and the workflow measurably removes manual cross-checking.
- **NARROW** if only some deterministic preset strategies expose stable criterion structure; exclude arbitrary/custom SQL initially.
- **REJECT** if explanation requires duplicating strategy semantics or users do not show meaningful investigation friction.

Research success would authorize only the next decision, not implementation.

**Gate result: HOLD IN CENTRAL RADAR — NO NEW ISSUE.**

## Other Candidate Decisions

1. **Group Strategy Tester parity — NO ISSUE / REUSE FIRST.** Current backtest/mining surfaces already cover substantial cross-sample robustness work. First prove a result-comparison navigation problem before adding another tester mode.
2. **Paste-list → temporary universe — HOLD.** Useful workflow compression, but no evidence that manual watchlist/pool setup is a current material bottleneck. If tested later, preserve explicit universe identity and preview; do not silently mutate a persistent watchlist.
3. **TradingView screener heatmap/chart parity — DEDUPED.** Reviewed on 2026-09-20; no new evidence overturns the prior HOLD decision.
4. **Natural-language screener expansion — DEDUPED to #5.** Koyfin’s new signal is about post-definition criterion inspection, not a reason to broaden NL→rule work or generated Python.
5. **AI-generated custom code / trading automation — REJECT as expansion.** #6 already establishes the current execution-boundary priority; external automation breadth is not evidence to enlarge the dangerous path.
6. **Broker integration — REJECT.** Explicit owner-approved non-goal; no external signal here overturns that decision.

## Issue / PR Mapping

- **0 new Issues.**
- **0 existing Issue comments or scope changes.**
- **0 PR comments or scope changes.**
- #6 remains the current P1 execution-boundary blocker; this radar does not lower or expand it.
- #10 remains a source-confirmed P2 abnormal-move benchmark bug requiring runtime verification; no new evidence changes its severity.
- #2 / open PR #9 remains the coverage/freshness/result-receipt scope; no takeover.
- #7 / open PR #8 remains the release-evidence scope; no takeover.
- #5 remains bounded research for natural-language → deterministic StrategyDef; Check Ticker is adjacent but does not grant implementation authority.

Because no shared Issue/PR state was modified, no issue lease was acquired. Active implementer scopes were left untouched.

## Cross-Portfolio Idea

A reusable **principle**, not a framework mandate:

> For products that already make deterministic include/exclude decisions, “why this object passed/failed?” can often be answered by exposing the existing evaluator’s criterion trace. Prefer that over an LLM-generated narrative or a second evaluator.

Only apply this where a real user investigation workflow exists. Do not create portfolio-wide Issues from the principle alone.

## Sources

### External public web — primary intelligence

1. Koyfin — **Check Ticker**, published/updated 2026-09-10; checked 2026-09-23: https://www.koyfin.com/help/release-notes/check-ticker/
2. TrendSpider — **Backtest Your Strategy Across a Whole Watchlist or Portfolio: Group Strategy Tester**, published 2026-07-22; checked 2026-09-23: https://trendspider.com/blog/group-strategy-tester/
3. TrendSpider — **July 2026 — What’s New at TrendSpider**, published 2026-07-31; checked 2026-09-23: https://trendspider.com/blog/july-2026-changelog/
4. TradingView — **Visualize your Screener results with heatmap view**, published 2026-09-09; rechecked only for deduplication: https://www.tradingview.com/blog/en/heatmap-view-in-screener-60678/
5. TradingView — **Screener chart view adds moving averages and more flexibility**, published 2026-09-11; rechecked only for deduplication: https://www.tradingview.com/blog/en/screener-chart-view-indicators-60757/

### Repository evidence — applicability / deduplication

- `Reese-max/tick-stock-panel/main@54c303476e5d643d37c0195876c35593d234603f`
- product-code baseline recorded by owner board: `565ccdfee6c2fb0c079cd4192edb9cb31c9157f4`
- `.github/quality-audits/2026-09-18T2003Z-product-board-audit.md`
- `README.md`
- `backend/app/services/screener.py`
- `backend/app/api/screener.py`
- all-state Issue search and all-state PR search
- open PR #8 and open PR #9 metadata
- prior radar `docs/competitive-intelligence/2026-09-20T001100Z-external-radar.md`

## What Changed This Round

- **New external signal retained:** Koyfin’s 2026-09-10 criterion-level Check Ticker workflow.
- **Decision:** useful but **not issue-worthy yet** because local user pain / frequency / completion impact is not established and current trust/correctness work remains higher priority.
- **0 new Issues.**
- **0 existing Issue/PR writes.**
- **0 implementation authorizations.**
- No severity inflation, synthetic ROI, user-count claims or competitor-feature parity claims were used.

## Classification / Scope Calibration

- No existing BUG was converted into RESEARCH merely because runtime prevalence is unknown.
- No OPPORTUNITY was labeled P1/P2 simply because a competitor shipped it.
- #6 P1, #10 P2, #2/#7 P2 remain governed by their existing evidence; this radar adds no evidence sufficient to reclassify them.
- Check Ticker remains `OPPORTUNITY / NOT_ESTABLISHED / MEDIUM / NEEDS_EVIDENCE / auto_implementation=false`.
- No current/open implementation scope was expanded.

## Completion / Gaps / Cursor

- External-web exploration covered a direct research/screener competitor (Koyfin), adjacent strategy-testing workflow (TrendSpider), and an AI-assisted workflow compression pattern (TrendSpider Sidekick).
- No production/provider/browser/mobile runtime was executed. The opportunity conclusion does not require one; if a research spike is later authorized, it must bind results to a concrete product SHA and existing evaluator behavior.
- Missing evidence: real `tick-stock-panel` user/support traces showing frequency and impact of “why didn’t ticker X match?” or temporary-universe setup friction.
- This report does **not** declare `tick-stock-panel` or the portfolio CLEAN.
- **Next fair-rotation target: `Reese-max/travel-planning-mcp`.**
