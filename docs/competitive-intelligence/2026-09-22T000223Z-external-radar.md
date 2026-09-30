# External Competitive / New Product / Workflow Radar — 2026-09-22T00:02:23Z

Status: **COMPLETE / MATERIAL COMPETITOR STRATEGY SHIFT / 0 NEW ISSUES**

## Scope / direction / evidence boundary

- Primary intelligence source this round: public web **outside Reese-max GitHub**. Connected GitHub was used for current owner inventory, product/source truth, dedupe, active-work coordination and report persistence.
- Issue-quality source: `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected-GitHub pagination completed in this run: **42 Reese-max-owned repositories / 41 unarchived**; `obsidian-vault` is the only archived repository. The second page was empty. Older inventory snapshots were not treated as exhaustive.
- Fair-rotation focus inherited from the previous radar: `Reese-max/tick-stock-panel`.
- Default-branch HEAD immediately before report write: `main@54c303476e5d643d37c0195876c35593d234603f` (`docs: add 2026-09-18 tick-stock product board audit`). The latest owner Product Board records the product-code baseline as `565ccdfee6c2fb0c079cd4192edb9cb31c9157f4`; later commits are audit-only documentation.
- Owner-approved direction remains **MAINTAIN / SIMPLIFY**, with narrow investment in trustworthy Taiwan/A-share research. Current priority remains: #6 generated/custom Python execution boundary, #2 / PR #9 result-bound coverage/freshness, and #7 / PR #8 truthful release execution receipts. Issue #10 separately tracks the confirmed cross-exchange benchmark-averaging bug.
- Explicit current non-goals remain brokerage/order execution, personalized financial advice, social feed, native-mobile parity, global-terminal breadth, plugin marketplace, generic agent framework, new database/ledger, and unrestricted natural-language-to-Python expansion.
- Open PR #9 remains active on the coverage contract. This radar did not take over, comment on, or broaden any active implementation scope.
- No product source, CI/config, secret, repository setting/permission, branch, merge, deploy, GOAL/worker, paid service, provider account, or production data was changed. No runtime provider call or financial transaction was executed.

## Product → market category mapping

`tick-stock-panel` currently sits at the intersection of:

1. Self-hosted Taiwan/A-share research workspace.
2. Deterministic screener / strategy / backtest / market-monitoring workflow.
3. Provider-aware historical and realtime market-data analysis.
4. Optional AI-assisted research setup, with an approved direction toward inspectable rules rather than arbitrary generated code.
5. Local APIs and UI for watchlists, alerts, screeners and analysis, but no approved generic agent-distribution product.

The question this round is not whether to copy a competitor's MCP surface. It is whether a major competitor has changed the distribution baseline enough to alter what counts as differentiation.

# External Signals

## A. Direct competitor strategy change — TradingView launches an official MCP Server

**Status:** `CONFIRMED` first-party product release.  
**Published:** 2026-09-16.  
**Checked:** 2026-09-22 (Asia/Taipei).  
**Sources:**
- https://www.tradingview.com/blog/en/tradingview-mcp-server-public-beta-60864/
- https://www.tradingview.com/mcp/docs

TradingView's official MCP Server entered public beta on 2026-09-16. It connects a paid TradingView account to Claude, ChatGPT/Codex and other streamable-HTTP MCP clients through OAuth 2.1, without asking users to manage an API key.

The important change is broader than “TradingView has AI.” The MCP surface exposes the user's existing financial-research workspace to external assistants:

- market data and historical OHLCV;
- symbol search and screener operations;
- fundamentals, forecasts, news, filings and calendars;
- watchlists;
- alerts.

TradingView's own tool catalog explicitly marks operations as **Read-only** or **Write**. Read-only calls such as `run_screener` and `get_ohlcv` consume platform data; watchlist and alert mutations such as `create_watchlist`, `add_to_watchlist` and `create_alert` are separately labeled Write and operate on persisted user objects. The beta is currently included in Essential and higher plans, and the current docs state an approximate tool-call rate limit of 100 requests/minute/user; the launch blog also notes that daily limits may be applied during beta.

### User job / workflow reduction

For a user who already performs research in an AI assistant, this removes several cross-tool steps: open a finance terminal, manually reproduce a filter, copy symbols/results into the assistant, and later copy decisions back into watchlists/alerts. The external assistant can invoke the underlying research operation directly and, for approved stateful objects, write back to the user's TradingView workspace.

### Strategic consequence for `tick-stock-panel`

This materially changes the competitive baseline. “Financial research can be queried conversationally” and “a screener can be reached from an AI assistant” are becoming distribution capabilities of a large incumbent, not a defensible wedge by themselves.

What remains more defensible for `tick-stock-panel` is the existing owner direction:

- local/self-hosted Taiwan/A-share specialization;
- provider/coverage/as-of truth bound to the actual result;
- point-in-time and non-trading boundaries;
- inspectable deterministic rule definitions;
- explicit degraded/partial state rather than fabricated completeness;
- no brokerage execution or personalized-advice expansion.

**Decision:** major competitor strategy signal; retain in positioning. Do **not** create an MCP implementation Issue this round.

---

## B. Adjacent workflow pattern — OpenBB makes human and agent analysis share one governed workspace contract

**Status:** `CONFIRMED` current first-party product/docs pattern.  
**Relevant date:** OpenBB's current site records an Aug 25, 2026 move to open-source the full product suite; current Workspace documentation was checked 2026-09-22.  
**Sources:**
- https://openbb.co/
- https://docs.openbb.co/workspace/developers/agents-integration
- https://docs.openbb.co/workspace/developers/data-integration

OpenBB currently emphasizes one financial workspace where analysts and AI agents use the same governed data/context/tools rather than maintaining a separate “AI data path.” Its agent integration is a small HTTP contract (`/agents.json` plus a streaming query endpoint), while custom data backends expose the same data/workflows to workspace widgets and agents.

### Transferable pattern

If `tick-stock-panel` later gains evidence that users need an external assistant surface, the product should expose the **same canonical research contract** already used by the UI/API: the same screener rule, universe, provider, coverage, `as_of`, partial/degraded state and result receipt. It should not create a second LLM-specific calculation engine or let an assistant bypass #2/#6 trust boundaries.

### What not to copy

No team workspace, agent registry, enterprise governance suite, generic agent framework or hosted collaboration layer is justified by current owner evidence.

---

## C. New provider correction signal — FinMind has recently revised historical datasets that this repository consumes

**Status:** `CONFIRMED` provider correction; local-user incidence remains `UNKNOWN`.  
**Key dates:** 2026-09-01, 2026-09-06, 2026-09-17 through 2026-09-20.  
**Checked:** 2026-09-22.  
**Source:**
- https://finmind.github.io/WhatIsNew/

FinMind's Sep 1 correction notice says `TaiwanStockPriceAdj` was recalculated across its full history after fixes to ex-right/ex-dividend handling, reduction-of-capital cases and holiday shifting, and explicitly tells users who previously downloaded the data to obtain it again. The same notice corrected other Taiwan datasets; later September notices continue to publish bounded historical corrections and re-fetch instructions.

This matters because `tick-stock-panel` directly queries both `TaiwanStockPrice` and `TaiwanStockPriceAdj` to derive local adjustment events. Current ordinary incremental operation typically refreshes the latest daily range and, when there is no historical repair range, only a short recent adjustment-factor window. A historical full-recalculation performed upstream therefore does **not** automatically prove that an already-populated local cache has been refreshed across its entire history.

The repository already has an important countermeasure: the repair path accepts an explicit historical `override_start_date`, reuses the normal daily/adjustment pipeline, merges corrected `(symbol, trade_date)` factors with `keep=last`, and marks affected symbols for enriched recomputation. In other words, the minimum recovery mechanism exists; the unresolved question is whether a real operator has a stale pre-Sep-1 FinMind cache and whether correction discoverability is a material workflow problem.

**Decision:** `VALIDATION_GAP / severity=NOT_ESTABLISHED / decision_priority=MEDIUM / NEEDS_EVIDENCE / auto_implementation=false`. Report only. Do not invent a provider-changelog crawler, revision database or migration framework without user/runtime evidence.

# New Releases / market moves

| Date | Product / change | Confidence | Consequence |
|---|---|---|---|
| 2026-09-16 | TradingView official MCP Server public beta | CONFIRMED | Conversational/external-agent access to screeners, research, watchlists and alerts becomes incumbent distribution capability |
| 2026-09-01 | FinMind full-history `TaiwanStockPriceAdj` recalculation | CONFIRMED | Historical provider corrections can outlive a normal incremental local refresh; existing repair path is the first response |
| 2026-08-25 | OpenBB announces full-suite open sourcing; current Workspace keeps analysts/agents on shared governed data | CONFIRMED | Self-hosting alone is less unique; canonical data/provenance contract matters more than a separate AI surface |

# Community Pain

No community anecdote is retained for prioritization this round. First-party competitor/provider documentation plus repository source was sufficient to establish the market change and the bounded correction risk. No social post is used as prevalence, ROI or severity evidence.

# Adjacent Ideas

## 1. If agent distribution is ever validated, start read-only and reuse the existing API

`tick-stock-panel` already has FastAPI routes for screeners, alerts, watchlists, backtests and market analysis. If owner/user evidence later shows repeated copy/paste friction between the product and an assistant, the smallest experiment is **not** a generic agent framework:

1. expose only 2–3 read-only research operations;
2. reuse existing deterministic services and result receipts;
3. require the response to preserve `provider / coverage / universe / as_of / partial` semantics;
4. keep all account/workspace mutation disabled in the first experiment;
5. evaluate whether the assistant surface actually reduces a measured manual handoff.

Only after that could a separate decision examine bounded watchlist/alert writes. Brokerage/order execution remains out of scope.

## 2. Treat provider corrections as provenance events, not automatically as a new subsystem

The smallest current operating response to a known FinMind historical correction is to use the existing historical repair path and verify the resulting factor/enriched data. A new persistent provider-revision system would need evidence that correction discovery and recovery is recurring enough to justify maintenance cost.

# Opportunity Map — `tick-stock-panel`

| Bucket | Decision |
|---|---|
| MUST MATCH | Preserve source/provider, effective coverage/universe, `as_of`, partial/degraded state and deterministic rule semantics in every research result; resolve existing #2/#6/#10 correctness/trust work before distribution expansion. |
| SHOULD BE BETTER | If an assistant surface is validated later, make it a thin view over the same canonical research/result contract, with explicit read/write effect classes instead of a parallel AI calculation path. |
| DIFFERENTIATOR | Local/self-hosted Taiwan/A-share specialization with inspectable point-in-time inputs, provider-aware truth, reproducible rule/result lineage and explicit non-trading boundaries. |
| ADJACENT IDEA | Bounded read-only assistant/MCP experiment over existing APIs; provider-correction repair/provenance receipt if real stale-cache evidence appears. |
| DO NOT COPY | Trading/broker execution, global-market/tool parity, generic agent framework, social feed, native-mobile parity, team SaaS, provider-revision crawler/database without evidence. |

# Four-Gate Decisions

## Candidate 1 — external assistant / MCP distribution surface

Stable fingerprint:

`tick-stock-panel + existing local FastAPI research APIs + user may work from external AI assistant + incumbent TradingView now exposes screener/research/watchlist/alert workflows through official MCP + no observed Reese-max user copy/paste bottleneck + owner currently rejects generic agent framework`

Classification:

- `kind=OPPORTUNITY`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- runtime if researched: `NEEDS_RUNTIME_VERIFICATION`

### Gate 1 — Problem / value

A plausible target user is a self-hoster who already researches from ChatGPT/Claude/Codex and repeatedly copies screening questions/results between the assistant and the local product. TradingView proves this workflow is now productized by an incumbent, but it does **not** prove this Reese-max user has the same pain, frequency or willingness to expose a local financial service to an agent.

Contrary evidence matters: the product already has a direct UI plus HTTP API; owner direction says trust/correctness blockers precede generic AI/distribution expansion. Therefore the opportunity is not a missing-feature BUG.

### Gate 2 — Priority

- User Pain: `UNKNOWN`.
- Strategic Fit: `MEDIUM` as a distribution option, lower than current trust work.
- External Evidence: `HIGH` for the competitor strategy shift, not for Reese-max demand.
- Novelty: `MEDIUM-HIGH` relative to the product's current distribution surface.
- Reuse: `HIGH` if built as a thin read-only adapter over existing endpoints/services.
- Effort: `LOW-MEDIUM` for a tiny read-only experiment; much higher if expanded to OAuth, remote hosting and stateful writes.
- Security/Privacy/Cost: external assistant access adds an authority boundary; no paid or public exposure is justified yet.

Decision priority is `MEDIUM`, not P1/P2 and not an implementation mandate.

### Gate 3 — Minimum approach

Do nothing to product code now. If explicit owner/user evidence later authorizes research, test only 2–3 read-only operations against an isolated/local instance and compare the manual workflow against the existing UI/API. Preserve all provenance fields and fail closed when coverage/provider truth is incomplete. Do not start with account writes, hosted MCP, OAuth infrastructure, plugin marketplace or a second calculation engine.

### Gate 4 — Research / implementation separation

A bounded future research question can end cleanly:

- **BUILD:** repeated real workflow evidence shows assistant handoff is materially painful and the read-only adapter preserves all trust contracts with acceptable authority/cost.
- **NARROW:** only one or two read-only research calls add value; keep them private/local and stop there.
- **REJECT:** current UI/API already solves the job or the additional authority/surface outweighs the workflow benefit.

A BUILD outcome would support a next scoped decision only. It would not authorize writes, deployment, public exposure, brokerage or a generic agent framework.

**Decision this round: REPORT ONLY / NO NEW ISSUE.**

---

## Candidate 2 — FinMind historical correction awareness

Stable fingerprint:

`tick-stock-panel + locally persisted FinMind adjustment/history + provider publishes full-history correction and requests re-fetch + normal incremental sync does not automatically revisit all prior dates + explicit historical repair path already exists + no current stale-cache instance observed`

Classification:

- `kind=VALIDATION_GAP`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`

### Gate 1 — Problem / value

A pre-correction local cache can in principle continue to disagree with current FinMind historical truth after normal incremental syncing. This matters to reproducible backtests, but no live cache was inspected and no wrong backtest was observed. The product already exposes a historical repair mechanism, so “there is no recovery path” would be false.

### Gate 2 — Priority

Data-correctness fit is high, but actual affected users/caches and result magnitude are unknown. The external correction by itself does not establish P2/P1 severity.

### Gate 3 — Minimum approach

For an affected operator, use the existing repair path from a date old enough to cover the corrected history and verify that corrected adjustment factors overwrite prior `(symbol, trade_date)` rows and that enriched data is recomputed. Only if repeated provider corrections cause real operational friction should the product add a small provider-revision/advisory receipt.

### Gate 4 — Research / implementation separation

- **BUILD:** runtime evidence shows stale corrected history is common/material and the current operator repair is too easy to miss.
- **NARROW:** document/notify a bounded correction advisory and reuse the existing repair API.
- **REJECT:** affected caches are rare or normal operator procedures already cover the event.

**Decision this round: REPORT ONLY / NO NEW ISSUE.**

# Issue / PR Mapping and dedupe

- **#5** natural-language → inspectable `StrategyDef` research remains open. TradingView's new MCP distribution is related market context but a different fingerprint: #5 is authoring/compilation semantics, while this round's candidate is product distribution into external assistants. No comment was added because the new evidence does not change #5's current dependency or authorize implementation.
- **#2 / PR #9** result-bound coverage/freshness remains active. Any future assistant read surface would depend on this contract rather than bypass it. PR #9 was not commented on or modified.
- **#6** generated/custom Python execution boundary remains the current P1 trust problem; this round does not widen it.
- **#7 / PR #8** release execution evidence remains separate and unchanged.
- **#10** corresponding-index abnormal-move bug remains separate and unchanged.
- Searches for `MCP`, `assistant`, `connector`, `Claude`, `ChatGPT`, `agent` in current Issues found no same-root tracking Issue. That absence is not used to manufacture one.
- FinMind correction signal is not a duplicate of #2: #2 concerns effective universe/coverage at result time; this signal concerns upstream historical revision after local persistence. It remains below Issue threshold because an existing repair path exists and no affected runtime cache was observed.

**Writes:** 0 new Issues; 0 Issue comments/modifications; 0 PR comments/modifications; 0 implementation authorization. No issue lease was required because no Issue/shared tracking state was modified. This report uses a unique path and does not overwrite prior radar history.

# Cross-portfolio Ideas

One principle is worth retaining without turning it into a cross-repository framework:

> When a product is exposed to an AI assistant, the assistant should consume the same canonical source/provenance/result contract as the first-party UI, and write-capable operations should be a separately reviewable effect class rather than silently inheriting read authority.

Apply this elsewhere only when an actual product has a supported assistant workflow and evidence of value.

# Rejected Ideas

- **Build a generic MCP/agent framework now — REJECT.** Directly conflicts with current owner scope and has no Reese-max demand evidence.
- **Match TradingView tool-for-tool — REJECT.** Global breadth, filings, macro calendars and broad market parity are not this product's wedge.
- **Broker/order execution because finance competitors are adding agent channels — REJECT.** Explicit owner non-goal and higher authority/risk.
- **Add watchlist/alert writes in the first assistant experiment — REJECT for now.** Read-only value has not been validated; do not acquire effect authority preemptively.
- **Build a FinMind changelog crawler / provider revision database — REJECT for now.** Existing repair path can recover known corrections; recurrence and user impact are unmeasured.
- **Treat FinMind Sep 17–20 futures corrections as a product defect — REJECT.** Current repository evidence examined here is stock-focused and does not establish consumption of the affected futures tick/KBar datasets.
- **Reopen TradingView heatmap/chart-view work — REJECT / DEDUPE.** Those Sep 9/11 signals were already evaluated in the 2026-09-20 tick-stock radar and remain lower priority than trust/correctness work.

# Sources

Primary public-web sources checked this round:

1. TradingView, “Bring TradingView to Claude with the new MCP Server: public beta available for paid plans,” 2026-09-16  
   https://www.tradingview.com/blog/en/tradingview-mcp-server-public-beta-60864/
2. TradingView MCP Server documentation, current, checked 2026-09-22  
   https://www.tradingview.com/mcp/docs
3. FinMind update / correction log, current, checked 2026-09-22  
   https://finmind.github.io/WhatIsNew/
4. OpenBB current product site, checked 2026-09-22; page includes Aug 25, 2026 open-source announcement  
   https://openbb.co/
5. OpenBB Workspace agent integration docs, checked 2026-09-22  
   https://docs.openbb.co/workspace/developers/agents-integration
6. OpenBB Workspace custom data integration docs, checked 2026-09-22  
   https://docs.openbb.co/workspace/developers/data-integration

Repository evidence used for fit/dedupe includes the current Product Board, issues #2/#5/#6/#7/#10, open PR #9, FinMind provider implementation, normal daily/adjustment pipeline, historical repair path and FastAPI service surface. No README/Issue/audit alone was used as the primary market signal.

# What Changed

- **Material new external signal:** TradingView moved from in-product AI/Screener features to an official cross-assistant MCP distribution surface with explicit read-only versus write operations.
- **Positioning calibration:** “AI can query a screener” is less differentiated. `tick-stock-panel` should keep competing on local Taiwan/A-share specialization, canonical result truth, provenance and deterministic/reproducible analysis—not tool count.
- **Provider-truth calibration:** FinMind's recent historical corrections show that data provenance includes upstream revision over time, not just current `as_of`; however, the repository already has a bounded manual repair path, so no new subsystem is justified.
- **No new implementation authority:** all new signals remain report/research context. Existing owner-approved trust work stays ahead of distribution expansion.

# Completion / gaps / cursor

- Owner pagination: complete, 42 owned / 41 unarchived; second page empty.
- Rules/direction/current default HEAD: checked.
- Existing research/feature/bug tracking and active PRs: checked for the focal product.
- External web: direct competitor, adjacent workflow and provider-correction signal checked from first-party sources.
- Runtime: **not executed**; no provider account, stale local cache, browser, mobile, CI or production path was exercised. Relevant unexecuted claims remain `NEEDS_RUNTIME_VERIFICATION` / `UNKNOWN` as stated above.
- Report write is the only GitHub mutation in this run.
- This radar does **not** declare `tick-stock-panel` or the portfolio CLEAN.
- Next fair-rotation candidate: `Reese-max/ninax-line-hermes` (recently processed products are not immediately re-selected merely because they are popular).