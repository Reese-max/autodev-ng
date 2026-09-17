# External Competitive / Product / Workflow Radar — 2026-09-17T20:12:00Z

## Status

- Run status: COMPLETE_WITH_RUNTIME_GAP
- Rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Fair-rotation target: `Reese-max/academic-mcp`
- Inspected default branch: `main`
- Current HEAD: `e1665f8417eb1894d0c8dbee678c6a9fc6c54b31`
- Latest product-changing baseline identified by current repo audits: `4eb25de5005d33572095ed566ccf00762011bb50`
- Fresh connected inventory: 40 Reese-max-owned repositories, 39 unarchived; page 2 returned empty. This is connector-visible inventory only; drift from earlier rounds is not evidence of repository creation/deletion.
- Next fair-rotation cursor: `spotify-playlist-organizer-mcp`

## Owner Direction / Scope Check

The current product-board direction remains **INVEST / SIMPLIFY**: `academic-mcp` is a private, owner-operated, local-first academic research MCP gateway whose advantage is one authenticated entry point preserving heterogeneous upstream semantics (81 tools + 7 prompts), local papers/indexes, inspectable source versions, and truthful degraded-provider behavior.

Current explicit non-priorities remain: more providers merely for breadth, public multi-tenant SaaS, native mobile app, collaborative workspace product, billing/growth features, and opaque AI synthesis. Existing active/recent scopes were checked before writing:

- #1 / PR #8 — Canonical Paper Identity + Research Bundle, research/phase-0.
- #2 / PR #5 and PR #13 — host-independent integrity gate.
- #3 / PR #6 — off-host recovery / cold-start proof.
- #4 / PR #7 — home-directory confinement.
- #9 / PR #10 — progressive tool exposure / selection eval.
- #12 — Crossref post-publication status warning research.

No existing OpenAlex Issue, PR, or OpenAlex-named branch matched the new fingerprint below. The new bug does not require #1's larger research bundle and does not alter any active PR scope.

## Product → Market Category

| Product | Market / alternatives | Current differentiated job |
|---|---|---|
| `academic-mcp` | Elicit, Consensus, Scite, Zotero, OpenAlex/Semantic Scholar/Crossref-based research tooling, MCP research connectors | One private MCP gateway that preserves source-specific scholarly capabilities and errors while storing research artifacts locally |

## External Signals

### A. Direct competitor: Elicit turns collections into agent-visible, durable evidence context

**CONFIRMED — released 2026-09-17; checked 2026-09-17 UTC**  
Source: https://elicit.com/blog/library-into-resesearch-hub

Elicit now lets Research Agent search personal/shared collections, use those papers as sources, save newly found papers directly into a collection, and link collections to Projects so the agent knows which evidence matters to that work.

**User job:** avoid rediscovering papers, copying sources between sessions/projects, and losing which evidence a project considered important.

**Transferable signal:** a research agent should be able to work from a bounded, explicit evidence set and add candidates back into that evidence set while retaining project context.

**Do not copy:** shared-team collections and collaboration are outside the owner-approved single-user scope. This signal strengthens #1's candidate/included ResearchBundle direction; it does not justify a collaboration layer or a new Issue.

Classification: `CONFIRMED`, `ADJACENT IDEA / evidence supporting existing #1`.

### A. Direct competitor: Consensus continues moving research into the user's current AI/work surface

**CONFIRMED — 2026-09-15; checked 2026-09-17 UTC**  
Sources:
- https://help.consensus.app/en/articles/11954907-consensus-product-changelog
- https://consensus.app/home/blog/consensus-everywhere/
- https://help.consensus.app/en/articles/16951328-how-to-use-consensus-in-microsoft-365-copilot

Consensus is now available in Microsoft 365 Copilot after expanding API access in August. Its current strategy is explicit: research should happen where the question occurs, with the same research source available inside ChatGPT, Claude and Microsoft 365 workflows.

**User job:** reduce browser/app switching and repeated searches while drafting or analyzing.

**Transferable signal:** `academic-mcp`'s existing ChatGPT/MCP distribution remains directionally sound; source fidelity and reliability matter more than adding another bespoke UI.

**Do not copy:** Microsoft 365 integration, shared billing, and hosted workspace expansion do not address a proven Reese-max gap.

Classification: `CONFIRMED`, `DIFFERENTIATOR validation`, no new Issue.

### B. Adjacent workflow: Zotero 10 emphasizes collection retrieval and truthful library failures

**CONFIRMED — Zotero 10.0.2 released 2026-09-09; checked 2026-09-17 UTC**  
Source: https://www.zotero.org/support/changelog

Zotero's latest maintenance release surfaces recent collections during add-to-collection workflows and improves explicit errors for database corruption/read-only state while fixing missing-attachment download/sync cases.

**Transferable signal:** durable research libraries need short-path placement into known collections and failures that remain distinguishable from an empty/missing library.

For `academic-mcp`, the relevant part is the latter truthfulness principle. It supports the product's existing `PARTIAL/RATE_LIMITED/ERROR != empty` discipline; it does not justify reproducing Zotero's desktop library UI.

Classification: `CONFIRMED`, `SHOULD BE BETTER` on truthful source-state handling.

### C. Provider/platform change: OpenAlex's current API contract no longer matches the pinned adapter

**CONFIRMED — OpenAlex current docs checked 2026-09-17 UTC; pricing/API-key model announced 2026-02-24**  
Sources:
- https://developers.openalex.org/guides/page-through-results
- https://developers.openalex.org/guides/authentication
- https://developers.openalex.org/guides/deprecations
- https://blog.openalex.org/openalex-api-new-features-and-usage-based-pricing/

Current OpenAlex contract:

1. `per_page` is 1–100; cursor paging is the documented route for larger result sets.
2. Keyless API access has a much smaller daily allowance; free API keys are the path for use at scale.
3. The historical polite-pool/`mailto` mechanism has been replaced by API keys.
4. `work.concepts` is deprecated in favor of Topics, though it still works today.

Current pinned `paper-search-mcp` OpenAlex adapter:

- sends `per_page=min(max_results, 200)`;
- exposes `search_openalex(query, max_results=10)` without a 100-result bound;
- only sets a User-Agent with a placeholder `mailto` reference and has no OpenAlex API-key configuration path;
- converts every non-200 response and exception into `[]`;
- unified `search_papers()` records an error only when the source coroutine raises, so the returned empty list appears as `source_results.openalex=0` with no OpenAlex error.

This creates a source-confirmed false-empty path: `max_results=101` can produce an out-of-contract provider request, and any resulting provider non-2xx is normalized into an apparent zero-result search. Keyless budget/rate failures reach the same normalization path. The absence of an API key alone is **not** called an outage because OpenAlex still allows limited keyless usage.

A non-destructive direct API probe was attempted from the available execution environment, but DNS resolution failed before reaching OpenAlex. That is an environment limitation, not product evidence; actual gateway/provider execution remains `NEEDS_RUNTIME_VERIFICATION`.

Classification: `BUG`, `P2`, `decision_priority=HIGH`, `triage=NEEDS_REVIEW`, `auto_implementation=false`.

## New Releases

- 2026-09-17 — Elicit Library becomes a shared research hub with Research Agent collection read/write and Project-linked collections.
- 2026-09-15 — Consensus released official Microsoft 365 Copilot integration; API/MCP usage remains account/plan-governed.
- 2026-09-09 — Zotero 10.0.2 library/reliability fixes.
- Current OpenAlex docs reflect the 2026 usage-pricing/API-key era and paging limit of 100 results per request.

## Community Pain

No community anecdote was needed to pass the OpenAlex bug gate. No Reddit/HN frequency claim is used as evidence of prevalence. The bug is based on first-party provider contract plus pinned repo source.

## Opportunity Map — `academic-mcp`

### MUST MATCH

- Provider failure must remain distinguishable from confirmed empty search results.
- Current upstream request constraints must be respected where the tool presents the source as usable.
- Source-specific requests must not be silently substituted by another provider.

### SHOULD BE BETTER

- Preserve local/private operation while allowing optional provider credentials only when they materially improve an existing source; no paid commitment by default.
- Keep project/evidence context explicit and durable, following #1's bounded bundle direction rather than depending on chat memory.

### DIFFERENTIATOR

- Existing source namespaces and truthful degraded states remain visible instead of being hidden behind one synthesized research answer.
- One private MCP entry point already follows the market movement toward “research where the question occurs” without needing a new web/desktop product.

### ADJACENT IDEA

- Elicit's Project-linked collection context is useful evidence for #1's candidate/included bundle model. Single-owner implementation, if ever approved, should be much smaller than Elicit's team workspace.

### DO NOT COPY

- Elicit multiplayer/shared organization collections.
- Consensus Microsoft 365 distribution merely for channel parity.
- Zotero desktop library/search UI.
- A central provider lifecycle registry, rate-limit service, or new database to repair one stale OpenAlex adapter.
- OpenAlex Topics migration as part of the false-empty bug without a separately demonstrated failure.

## Cross-Portfolio Ideas

One reusable principle is evidence-backed across this round:

`Provider request → provider outcome → normalized result` must preserve the distinction between `CONFIRMED_EMPTY`, `RATE_LIMITED`, `INVALID_REQUEST`, `UPSTREAM_ERROR`, and `UNKNOWN`.

This is potentially reusable in other Reese-max multi-provider products, but this report does **not** create a cross-portfolio framework Issue. Each repository should first prove a real false-empty/false-success path before adopting anything.

## Rejected Ideas / Why

1. **Add another scholarly provider** — rejected; owner direction explicitly says breadth is not the next priority, and the current bug exists inside an already-supported provider.
2. **Build a provider registry/lifecycle service** — rejected; excessive maintenance surface for a local adapter mismatch.
3. **Automatically fallback OpenAlex to Crossref/arXiv** — rejected; source substitution can turn provider failure into false confidence.
4. **Require paid OpenAlex usage** — rejected; a free API key exists and keyless use is still possible within a smaller budget.
5. **Bundle Concepts→Topics migration into the same fix** — rejected for now; Concepts is deprecated but still working, so this is not the validated root cause.
6. **Copy Elicit collaboration** — rejected; collaboration remains outside single-owner scope.

## Four-Gate Decision

### 1. Problem / value

Target user is the owner doing literature search through the private research gateway. The observable supported path accepts an unbounded `max_results`, can send an invalid `per_page > 100`, and converts provider non-2xx to `[]`. The downstream unified tool reports zero results instead of source failure. This can mislead research completeness and violates the repo's existing truthful-provider-state principle.

Counterevidence: normal low-volume keyless OpenAlex calls may still work; no owner incident was observed; OpenAlex is one of several sources. Therefore the claim is bounded to a reachable false-empty path, not a general OpenAlex outage.

### 2. Priority

```yaml
kind: BUG
severity: P2
decision_priority: HIGH
triage: NEEDS_REVIEW
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

P2 is justified by a source-causal path that can materially change search completeness. P1 is not justified because the entire research workflow is not shown to be unavailable and no production incident was observed.

### 3. Minimum solution

Prefer a thin adapter fix only:

- propagate/bound OpenAlex non-2xx/transport errors so unified search can expose `errors.openalex`;
- enforce the provider's `per_page<=100`; paginate only if the existing supported tool truly needs >100, otherwise reject/cap with an explicit limit;
- optionally accept a private free OpenAlex API key through existing configuration if OpenAlex is intended for regular use.

No new framework, database, state machine, provider abstraction rewrite, or fallback router is required.

### 4. Research / implementation separation

This is a BUG tracking Issue, not authorization to implement. Runtime acceptance still requires one authorized live normal query and one bounded failure/limit scenario. No source code, configuration, secret, deployment, branch or worker was changed/started in this run.

## Issue Mapping

### Created

- `Reese-max/academic-mcp#14` — **[P2][RELIABILITY] Stop OpenAlex provider failures from becoming false-empty search results**
  - https://github.com/Reese-max/academic-mcp/issues/14
  - fingerprint: `academic-mcp:paper-openalex:provider-request-failure:non-2xx-normalized-to-empty:false-empty-results:v1`
  - verified created as open Issue; no labels/assignee added; no implementation authorization.

### Existing scopes not modified

- #1 / PR #8 — Elicit Sep-17 signal supports its evidence-context hypothesis; no scope expansion.
- #9 / PR #10 — no new tool-exposure root.
- #12 — no change; Crossref status research remains independent.
- #2/#3/#4 and active PRs — no overlap with OpenAlex false-empty fingerprint.

## Sources

Primary public sources checked in this run:

1. Elicit, “Turn your Elicit Library into a shared research hub,” 2026-09-17 — https://elicit.com/blog/library-into-resesearch-hub
2. Consensus product changelog, updated 2026-09-17 — https://help.consensus.app/en/articles/11954907-consensus-product-changelog
3. Consensus, “Consensus Everywhere,” 2026-09-14 — https://consensus.app/home/blog/consensus-everywhere/
4. Consensus Microsoft 365 Copilot guide — https://help.consensus.app/en/articles/16951328-how-to-use-consensus-in-microsoft-365-copilot
5. Zotero Version History, 10.0.2 dated 2026-09-09 — https://www.zotero.org/support/changelog
6. OpenAlex Page through Results — https://developers.openalex.org/guides/page-through-results
7. OpenAlex Authentication & Pricing — https://developers.openalex.org/guides/authentication
8. OpenAlex Deprecations — https://developers.openalex.org/guides/deprecations
9. OpenAlex, “New Features and Usage-Based Pricing,” 2026-02-24 — https://blog.openalex.org/openalex-api-new-features-and-usage-based-pricing/

Repository evidence:

- `Reese-max/academic-mcp@e1665f8417eb1894d0c8dbee678c6a9fc6c54b31`
- vendored OpenAlex adapter blob `281ffcd514d1e4c04dc26a981341c65988b25451`
- vendored paper server blob `a6815e3533217c771a20f4d971c160a9716b7f26`
- Product Board audit: `.github/quality-audits/2026-09-11-1010-product-board-audit.md`
- Fixed persona round 1: `.github/quality-audits/2026-09-14T1432Z-50-persona-audit-round-1.md`

## What Changed

- New high-confidence external/provider evidence: OpenAlex's current paging/auth contract exposes a concrete mismatch in the pinned adapter.
- New actionable fingerprint: false-empty OpenAlex results on provider/request failure.
- Created and verified Issue #14 after open/closed Issue, all-state PR, prior-radar and branch dedupe.
- Elicit's 2026-09-17 Library/Project/Agent integration strengthens #1's bounded evidence-context direction but does not justify collaboration or a new Issue.
- No product code/config/CI/secret/settings/branch/merge/deploy/GOAL/paid action was performed.

## Classification / Scope Calibration

- #14: `BUG / P2 / HIGH / NEEDS_REVIEW / auto_implementation=false / NEEDS_RUNTIME_VERIFICATION`.
- Do not reinterpret missing live probe as an OpenAlex outage; network DNS failure belonged to the verification environment.
- Do not elevate Elicit's competitor release into a requirement for teams/collaboration.
- Do not declare `academic-mcp` or the portfolio CLEAN.

## Completion / Gaps / Cursor

Completed:
- Quality v2 read and blob SHA recorded.
- Current owner direction and audits read.
- Fresh owned-repo pagination checked; page 2 empty.
- Current academic-mcp HEAD, Issues, PRs and OpenAlex branch dedupe checked.
- Public-web direct competitor, adjacent workflow and provider/platform signals checked.
- New Issue #14 created and read-back verified.

Remaining evidence gaps:
- Actual connected academic-mcp OpenAlex request not executed in this run.
- Direct public OpenAlex probe from the execution environment failed at DNS resolution before reaching the provider.
- Therefore live 200/400/429 behavior through the real gateway remains `NEEDS_RUNTIME_VERIFICATION`.

Next fair-rotation cursor: `spotify-playlist-organizer-mcp`.
