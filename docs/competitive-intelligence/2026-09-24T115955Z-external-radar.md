# External Competitive / New-Product / Workflow Radar — 2026-09-24T11:59:55Z

## Status / scope / evidence boundary

- Status: **COMPLETE / FRESH EXTERNAL DELTA / NO NEW ACTIONABLE ISSUE / NO IMPLEMENTATION AUTHORIZATION**.
- Governing rule: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`; rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected-owner pagination: **42 Reese-max-owned repositories / 41 unarchived / 1 archived** (`obsidian-vault` archived). Old inventory was not treated as complete.
- Fair-rotation provenance: open report-only `autodev-ng` PR #92 completed `Reese-max/UkePack` and explicitly handed the next eligible product to **`Reese-max/ppt-studio`**.
- Focal default branch: `Reese-max/ppt-studio` `master@5b1e86f327cd6817241a73ab74efb147fc162856`. Latest default commits are audits/docs; relevant product implementation remains the existing local-first presentation workstation.
- Owner direction remains **INVEST / SIMPLIFY**: keep the product focused on editable presentation creation/editing/translation/export, resolve correctness/security boundaries before breadth, and do not turn it into collaboration SaaS, cloud accounts, a marketplace, a generic geometry engine, another renderer, a native app, or a connector catalog.
- Current priority/ownership was rechecked before drawing conclusions:
  - #7 translation lost-update is P0 and has active PR #8 → `SKIPPED_LOCKED` for any overlapping scope.
  - #1 local/remote Docker/auth boundary has active PR #2 and PR #4 → `SKIPPED_LOCKED`.
  - #9 FastAPI/Starlette security upgrade remains an independent P1 dependency finding; this radar found no competitor evidence that changes its classification.
  - #5 already owns structured slide state / bounded patch / native editability / render-export verification research.
  - #3 already owns source/claim provenance for externally grounded decks.
- No target-repository Issue/PR comment, scope rewrite, branch, product source, CI/config, secret, permission/setting, deployment, worker/GOAL, paid provider, production data, or merge was performed.
- No production/browser/PowerPoint/provider Runtime path was executed in this radar. Any new product hypothesis below remains `NEEDS_RUNTIME_VERIFICATION` if later promoted.

## Product → market category mapping

`ppt-studio` is best compared as a **local-first / provider-optional editable presentation workstation**, not as a general cloud design suite. This round mapped it against:

1. **Direct AI presentation editors:** Tosea, Canva/Claude Design, Google Slides/Gemini, PowerPoint/Copilot, Pitch.
2. **Presentation infrastructure / agent surfaces:** Presentations.AI API/MCP and Pitch API-style generation surfaces.
3. **Adjacent local/open workflow:** deterministic content/design separation and editable PPTX generation.

Supported user job in scope: take text/PDF/URL/structured input, create a usable deck, refine selected slides/content, keep normal editability, translate/present/export, and retain truthful mutation/output behavior.

# External Signals

## A. CONFIRMED — Tosea v1.3.0 makes recovery and data editability first-class editor operations

**Published:** 2026-09-21  
**Checked:** 2026-09-24  
**Source:** https://tosea.ai/whats-new

Tosea v1.3.0 rebuilt its workspace as a canvas with page reordering, **version switching**, **retry of one failed page**, inline speaker-note editing, and a Data Studio that exposes the underlying data/chart type/styling behind charts and tables. It also announced an Ultra plan with 16,000 credits/month; no independent evidence here establishes adoption or productivity impact.

### User job / friction removed

The valuable workflow signal is not merely “more editor features.” It reduces two concrete repair loops:

- one page fails or is poor → repair that page rather than restart/regenerate the deck;
- chart/table came from a figure or Excel/CSV → correct the underlying structured data without rebuilding the visual in another tool.

### Repository comparison

`ppt-studio` already has a meaningful contrary capability: `improve_slide` supports `preview_only`, returns a single-slide candidate without mutating the deck, and current regression tests require malformed or multi-slide model output to fail closed. Charts are also an explicit supported capability with a five-type catalog. Therefore “single-slide repair exists nowhere” would be false.

A narrower difference remains: the initial generate/upload/fetch-url flows currently require the model result to match the requested slide count and fail closed if it does not. There is no evidence in this run that a partially useful generated deck is persisted with page-local failure state and page-local retry.

**Disposition:** `ADJACENT IDEA / OPPORTUNITY_CONTEXT`, not a defect. External product shape is real; user pain/frequency in PPT Studio is UNKNOWN.

## B. CONFIRMED — Presentations.AI exposes presentation generation as API/MCP infrastructure

**Announcement:** 2026-09-17  
**Current capability checked:** 2026-09-24  
**Sources:**
- https://www.presentations.ai/solutions/api
- https://www.globenewswire.com/news-release/2026/09/17/3364353/0/en/ai-ppt-maker-and-slide-generator-presentations-ai-opens-its-presentation-agent-to-developers-and-ai-agents-through-api-and-mcp-server.html

Presentations.AI now positions its presentation agent as callable infrastructure for applications and AI agents through REST API and MCP. Its current first-party API page advertises structured inputs (JSON/CSV/text), branded generation, charts, PPTX/PDF/web outputs, webhooks and white-label use.

The pricing page content is internally inconsistent in the current crawl: one section says a free tier of 10 presentations/month, while the FAQ also describes a 200-credit one-time allowance approximating 2–3 15-slide presentations. That makes the exact free allowance **UNKNOWN / not used as a decision input**. The usable product-design signal is metered, programmatic presentation generation—not the exact marketing numbers.

### Transferable / non-transferable

Transferable: the assistant/agent can be a **distribution surface**, while the presentation artifact/editor remains the authority for actual editing and export.

Do not copy by default: MCP server, white-label SaaS, webhook infrastructure, enterprise SLA, account/billing layer, or a second hosted generation backend. The 2026-09-20 radar already found the same strategic direction from Pitch API/Claude integration. `ppt-studio` already exposes an HTTP/OpenAPI surface, so another protocol is not a validated user gap.

**Disposition:** `MARKET_COMMODITIZATION_SIGNAL / DO_NOT_ADD_WITHOUT_DEMAND`.

## C. CONFIRMED — Canva + Claude Design reinforces “generation is draft; structured editor owns the artifact”

**Anthropic adoption guidance:** 2026-09-03  
**Current product checked:** 2026-09-24  
**Sources:**
- https://www.anthropic.com/webinars/getting-started-with-claude-design
- https://www.canva.com/newsroom/news/canva-claude-design/

Anthropic’s Claude Design guidance explicitly covers going from brief to final export to PowerPoint/Google Slides/other tools. Canva’s Claude Design integration turns Claude-generated drafts into structured, editable Canva designs, emphasizing that users can continue modifying the artifact rather than regenerate from scratch.

This is strong market validation for the principle already tracked in #5: **AI output should become a normal editable artifact, and bounded edits should preserve untouched structure**. It is not a new root cause and does not justify a new object graph/framework beyond the narrow existing four-layout research.

**Disposition:** `SHOULD BE BETTER / EXISTING #5 EVIDENCE`.

## D. COMMUNITY_SIGNAL — local editable output is also appearing in open/self-hosted workflows

**Published:** 2026-09-07  
**Checked:** 2026-09-24  
**Source:** https://www.reddit.com/r/foss/comments/1w9uu7m/presentation_forge_an_mitlicensed_selfhosted_pptx/

A Presentation Forge author describes a self-hosted design where the model writes content but cannot choose coordinates/fonts/colors; deterministic themes/rendering produce editable PPTX. A related PowerPoint community thread asks whether AI-generated text/shapes/charts remain editable after export.

These are anecdotal/community signals, not market prevalence or independent quality evidence. They reinforce the same architecture principle already present in PPT Studio’s owner direction: **separate generative intent from deterministic artifact constraints**.

**Disposition:** `COMMUNITY_SIGNAL / NO PRIORITY CHANGE`.

# New Releases / Strategy Changes

| Date | Product | Change | Confidence | Consequence for PPT Studio |
|---|---|---|---|---|
| 2026-09-21 | Tosea | canvas versions + one-page retry + editable chart/table data | CONFIRMED first-party | validates page-local repair and structured data editing; no established local pain |
| 2026-09-17 | Presentations.AI | API + MCP presentation-agent distribution | CONFIRMED capability / announcement | generation infrastructure is increasingly commodity; do not build connector breadth without demand |
| 2026-09-03 | Anthropic Claude Design | enterprise guidance for brief → deck → PowerPoint/Slides handoff | CONFIRMED first-party | strengthens editable handoff principle already in #5 |
| current | Canva × Claude Design | drafts become structured editable Canva designs | CONFIRMED first-party | validates bounded editability; no new issue |

# Community Pain

No fresh community source in this round establishes prevalence for PPT Studio users. Recent presentation discussions continue to focus on two recurring concerns—AI decks that are difficult to edit and fragile layout behavior—but those map directly to existing #5 and cannot independently justify a new priority.

No community evidence was used to promote severity, estimate ROI, or claim user-frequency percentages.

# Adjacent Ideas

## 1. Page-local recovery — research only if actual retry waste is observed

A narrow research question is reasonable only if future logs/support/user evidence show whole-deck retry is a meaningful workflow break:

> When generation produces one unusable/failed page, can PPT Studio preserve the valid candidate deck and repair only that page without introducing hidden partial state or weakening fail-closed validation?

Smallest experiment would use synthetic provider stubs and current editor primitives, not a queue/database/state machine:

1. create a deterministic N-page candidate with one injected page-local failure;
2. compare current fail-closed whole-request retry with a temporary candidate model that marks exactly one page unresolved;
3. allow only that page to be regenerated/replaced;
4. prove untouched pages are byte/semantic invariant under the fixture;
5. exit `BUILD` only if recovery is materially simpler and state semantics remain truthful; otherwise `NARROW` to better error/retry UX or `REJECT`.

No Issue is created now because the observable user pain is not established.

## 2. Structured chart source edits should reuse #5/#3, not create “Data Studio” as a separate subsystem

If a chart’s source data needs first-class editing later, the smallest consistent shape is to reuse stable slide/object identity from #5 and source evidence from #3. A new chart database, spreadsheet engine, dataset registry or collaborative data service would be disproportionate at current scale.

## 3. API/MCP distribution remains optional

The market increasingly lets external assistants delegate presentation generation, but PPT Studio already has an API surface. A future assistant integration should first prove that current API invocation/handoff is a real friction point. “Competitor supports MCP” alone is not evidence for an MCP server.

# Opportunity Map — `ppt-studio`

| Bucket | Decision | Evidence / rationale |
|---|---|---|
| MUST MATCH | no stale AI operation may silently overwrite a newer deck mutation | repo-confirmed P0 #7; active PR #8 owns the fix |
| MUST MATCH | exported deck claims must preserve normal editability truthfully | owner direction + #5; market strongly reinforces this |
| MUST MATCH | local/remote trust boundary and framework security must fail closed | #1 / #9; competitor breadth does not outrank them |
| SHOULD BE BETTER | bounded component/page repair should avoid unnecessary whole-deck churn when evidence supports it | Tosea v1.3.0; current single-slide preview already supplies a smaller building block |
| DIFFERENTIATOR | local-first/provider-optional + explicit candidate/preview + version/conflict + render/export receipts | fits product scale better than SaaS breadth |
| ADJACENT IDEA | structured chart-data correction tied to source evidence | Tosea Data Studio; reuse #5/#3 if validated |
| ADJACENT IDEA | assistant/agent distribution through existing API | Presentations.AI/Pitch trend; no MCP-specific pain established |
| DO NOT COPY | cloud collaboration, white-label API business, marketplace, enterprise billing/SLA, broad MCP/connector catalog, arbitrary freeform design engine | owner boundary + maintenance/security/cost burden + no validated demand |

# Four-Gate Candidate Calibration

## Candidate: recover one failed/unusable generated page without regenerating the whole deck

- `kind=OPPORTUNITY`
- `severity=NOT_ESTABLISHED`
- `decision_priority=LOW_MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- runtime: `NEEDS_RUNTIME_VERIFICATION` if research is later authorized

### Gate 1 — problem/value

**External signal:** Tosea explicitly ships page-local retry.  
**Repo truth:** PPT Studio supports single-slide candidate improvement, but initial generation is fail-closed on malformed or wrong-count output.  
**Missing evidence:** no current support ticket, runtime failure sample, user observation, or owner direction shows repeated whole-deck retry is a material bottleneck. A competitor feature does not establish this product’s pain.

**Gate result:** does not pass Issue creation.

### Gate 2 — priority

There is no evidence of data loss, security impact, major completion-rate impact, or high-frequency recovery cost. Existing #7 P0 and #1/#9 P1 work clearly outrank this hypothesis.

**Gate result:** `NOT_ESTABLISHED`, not P2/P1.

### Gate 3 — minimum solution

Order of consideration:

1. **Do nothing now** — preferred while pain is unverified.
2. Improve error copy/retry guidance if real failures appear.
3. Reuse existing single-slide candidate/editor path in a synthetic research fixture.
4. Only if necessary, add bounded page-local unresolved/retry state.
5. Reject queue/database/job framework or distributed partial-generation service absent independent need.

### Gate 4 — research/implementation separation

If authorized later, the research must terminate with `BUILD / NARROW / REJECT` and use synthetic failures only. A `BUILD` result would authorize only a subsequent decision, not production implementation.

# Existing Issue / PR Mapping and Dedupe

| External signal | Mapping | Action |
|---|---|---|
| Tosea page-local retry | new opportunity context; no validated root cause | HOLD centrally; **0 new Issue** |
| Tosea structured chart data | #5 structured object state + #3 provenance overlap | no duplicate; no comment because classification/state does not change |
| Canva/Claude editable structured handoff | #5 same underlying editable-artifact research | no duplicate; no scope expansion |
| API/MCP distribution | prior Pitch/API radar + existing HTTP/OpenAPI surface | no connector Issue |
| translation concurrency / stale promotion | #7 | `SKIPPED_LOCKED` because PR #8 is active |
| remote trust boundary | #1 | `SKIPPED_LOCKED` because PR #2/#4 are active |

No owner-rejected direction received evidence strong enough to overturn its rejection reason. No fixed bug was claimed to have regressed.

# Rejected Ideas and Why

1. **Add MCP server because Presentations.AI has one** — rejected: protocol availability is not user value evidence; existing API already supplies an integration surface.
2. **Build cloud version history/collaboration because Tosea exposes versions** — rejected: current product is local-first/single-owner; no collaboration approval.
3. **Create a full Data Studio / spreadsheet subsystem** — rejected: chart source editing can only justify a narrow local object/data contract if real user pain appears.
4. **Replace fail-closed generation with best-effort partial persistence immediately** — rejected: that can create ambiguous half-valid state; current fail-closed behavior is safer until a truthful partial-state contract is proven.
5. **Copy competitor credit/pricing models** — rejected: no business-model evidence or owner authorization; exact Presentations.AI free allowance is also inconsistent on the current page.

# Cross-portfolio ideas

One bounded reusable principle remains worth carrying across creative tools, without creating a portfolio framework:

> **Generation result ≠ editable canonical state ≠ verified export.**

A model may propose a page/object change, but promotion should be tied to an exact base and deterministic artifact constraints; export/read-back evidence should remain separate. This is already represented in `ppt-studio` #5 and adjacent portfolio work, so no new shared framework Issue is warranted.

# Sources

Public-web sources were the primary intelligence inputs for this round.

- Tosea changelog — 2026-09-21 — https://tosea.ai/whats-new — `CONFIRMED` first-party capability.
- Presentations.AI API — checked 2026-09-24 — https://www.presentations.ai/solutions/api — `CONFIRMED` first-party current capability; exact free-tier allowance internally inconsistent / `UNKNOWN`.
- Presentations.AI API/MCP announcement — 2026-09-17 — https://www.globenewswire.com/news-release/2026/09/17/3364353/0/en/ai-ppt-maker-and-slide-generator-presentations-ai-opens-its-presentation-agent-to-developers-and-ai-agents-through-api-and-mcp-server.html — vendor announcement, capability corroborated by first-party API page.
- Anthropic Claude Design webinar — 2026-09-03 — https://www.anthropic.com/webinars/getting-started-with-claude-design — `CONFIRMED` first-party workflow guidance.
- Canva in Claude Design — current, checked 2026-09-24 — https://www.canva.com/newsroom/news/canva-claude-design/ — `CONFIRMED` first-party product capability.
- Presentation Forge Reddit discussion — 2026-09-07 — https://www.reddit.com/r/foss/comments/1w9uu7m/presentation_forge_an_mitlicensed_selfhosted_pptx/ — `COMMUNITY_SIGNAL`, not prevalence evidence.

Internal GitHub evidence was used only for product truth, owner direction, dedupe/coordination and report persistence.

# What Changed

Relative to the 2026-09-20 PPT Studio radar:

1. **New external workflow evidence:** Tosea v1.3.0 now explicitly packages per-page retry, page versions, speaker-note editing and editable chart/table data in the main editor.
2. **New market-distribution evidence:** Presentations.AI has opened API/MCP access to its presentation agent, further commoditizing generic presentation generation as callable infrastructure.
3. **No product-direction reversal:** both signals strengthen the existing `INVEST / SIMPLIFY` position—keep generation/editing artifacts bounded and editable; do not chase cloud/connector breadth.
4. **No new root cause:** structured data/native editability maps to #5/#3; agent distribution overlaps the prior Pitch/API signal; page-local retry lacks local user-pain evidence.
5. **Priority unchanged:** #7 P0, #1/#9 P1 and their actual verification work stay ahead of speculative workflow expansion.

# Completion / gaps / cursor

- Fresh owner inventory: complete — **42 owned / 41 unarchived / 1 archived**.
- Rules / owner direction / current default changes / Issues / open PRs / historical PPT radar: checked.
- Public-web A/B/C exploration: complete with direct, infrastructure/adjacent and community signals; no category was padded with weak claims.
- New Issues: **0**.
- Existing target Issue/PR comments or scope changes: **0**.
- Implementation authorization: **0**.
- Product code/config/deploy changes: **0**.
- Runtime verification performed: **none**.
- Portfolio CLEAN claim: **none**.
- Next fair eligible product cursor: **`Reese-max/voice-actress`**.
