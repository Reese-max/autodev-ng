# External Competitive Radar — 2026-09-20T02:02:39Z

Status: **COMPLETE**

## Scope / Direction Check

- Governing rule: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected GitHub owner inventory was enumerated with pagination in this run: **42 Reese-max-owned repositories / 41 unarchived**. `obsidian-vault` is archived and excluded. A second page returned no repositories, so the run does not rely on an older inventory snapshot.
- Fair-rotation focal repository: `Reese-max/travel-planning-mcp`.
- Current default HEAD rechecked immediately before report write: `main@ea9c51ffb5c12a82f6bac609420731136e058c7c`. Current product-code baseline remains `5a84a746266a2bd8cabf07db24a0fd2e9558b400`; later commits are audit documentation.
- Owner-approved direction from `.github/quality-audits/2026-09-17T0811Z-product-board-audit.md` plus `autodev-ng/docs/portfolio-audit/2026-09-18T2300Z-product-board-delta.md`: **INVEST / SIMPLIFY; NARROW / INVEST IN TRUST / DEFER BREADTH**.
- NOW remains #5 proposal terminal-state integrity; NEXT is one bounded current read-only TRIP/App runtime receipt. #6 remains the Google Places retention gate before durable provider-content persistence. App/import/UI/writeback breadth remains NEEDS_REVIEW.
- Explicit non-goals remain consumer booking super-app breadth, affiliate/payment checkout, social feed, native-mobile parity, generalized workflow engine/ledger, provider-count expansion, AI self-approval, and production write without the existing approval boundary.
- Issue #7 is owner-authored active umbrella scope. It has no comments in the connected view and there are currently no open PRs, but the most recent Product Board delta explicitly treats it as active owner scope. This radar therefore does not edit #7 or silently expand it.
- All-state PR review: PR #1–#3 are merged; open PR count is 0. Route-related branch search returned no branch.
- No product source, CI/config, secrets, settings/permissions, implementation branch, merge/deploy, GOAL/worker, paid provider call, booking, payment, or production data was changed.

## Product → Market Category

`travel-planning-mcp` is best treated as:

1. agent-native canonical itinerary infrastructure;
2. safe proposal / approval / reversible mutation layer;
3. provider-independent travel context normalization;
4. developer/operator infrastructure rather than a consumer booking super-app;
5. a trust boundary between probabilistic planning and authoritative trip state.

Competitor breadth does not automatically become a requirement.

## External Signals

### A. CONFIRMED — Expedia is consolidating AI-native planning into a full supply/booking stack

**Event date: 2026-07-31. Checked: 2026-09-20.**

Source: https://ir.expediagroup.com/news-and-events/news/news-details/2026/Expedia-Group-acquires-Layla-accelerating-its-AI-powered-trip-planning-and-booking-strategy/default.aspx

Expedia Group acquired Layla, an AI-native conversational trip-planning and booking product. Expedia states that the strategic goal is an end-to-end journey from inspiration and itinerary creation through flights, accommodation, activities, dining, transportation and booking, combining Layla with Expedia supply, first-party traveler data and marketplace technology.

This is a major direct-market strategy signal, but it does **not** imply that this repository should copy the full stack. It instead increases the cost of competing on inventory, checkout, consumer distribution and booking breadth. The transferable lesson is to preserve a clean canonical boundary that can eventually consume provider/supplier capabilities without owning the whole marketplace.

User job affected: an agent or operator needs a stable trip object while discovery/booking providers change underneath it. The repo's proposal/version/approval model remains a more defensible wedge than trying to reproduce Expedia's supply network.

### B. CONFIRMED — Travel-agent infrastructure is exposing live booking facts while deliberately withholding mutation authority

**Release date: 2026-08-21. Checked: 2026-09-20.**

Source: https://docs.acai.travel/docs/changelog-acai-core

Acai's new Agent-to-Agent service lets external agents read live GDS/PNR data, inspect history and fare rules, and obtain priced change/cancellation quotes. Its release note explicitly says the connected agent is **read and quote only**: it does not ticket, cancel, void or otherwise alter the booking.

This is adjacent rather than a direct consumer competitor, but it strongly validates the repo's existing separation between **understand/simulate/quote** and **authoritative mutation**. The useful transplant is not Acai's GDS stack; it is the capability boundary: rich live context can be agent-readable without automatically granting final booking or state-change authority.

Do not copy: airline/GDS servicing breadth, ticketing, cancellation or refund execution. Those are outside the approved scope and would create new regulatory, payment, identity and provider obligations.

### C. CONFIRMED — Google is commoditizing raw geospatial agent tools via a managed MCP layer

**Maps Grounding Lite GA event: 2026-04-22; current architecture/docs checked 2026-09-20. August 2026 Maps newsletter also confirms continuing agent-oriented platform expansion.**

Sources:
- https://mapsplatform.google.com/resources/blog/powering-the-next-era-of-agentic-experiences-announcing-new-grounding-capabilities/
- https://developers.google.com/maps/architecture/grounding-with-maps-mcp
- https://developers.google.com/maps/innovators/newsletters/08-2026

Google Maps Grounding Lite is a Google-hosted MCP server exposing `search_places`, `lookup_weather`, and `compute_routes`, and Google's own architecture guide uses it to build a travel-planning agent. Google also published Maps Platform agent skills in August 2026.

Product implication: generic Places / weather / simple routing access is becoming provider-managed commodity infrastructure. `travel-planning-mcp` should not measure progress by adapter count. Its differentiator should remain the canonical Trip/Reservation/Constraint/ChangeProposal model, source/freshness truth, safe mutation boundary and cross-provider identity/provenance.

This is consistent with the current owner direction and does not authorize replacing the current Google adapters or creating an MCP-of-MCP proxy.

### D. CONFIRMED — Current Google Routes semantics expose a future-itinerary time-basis gap worth preserving as a bounded validation candidate

**Current Google Routes docs checked 2026-09-20; page update date not asserted.**

Sources:
- https://developers.google.com/maps/documentation/routes/transit-route
- https://developers.google.com/maps/documentation/routes/reference/rpc/google.maps.routing.v2

Google documents that `departure_time` is optional and, if absent, defaults to the time the request is made. Transit routes are schedule-sensitive, and Google supports explicit arrival/departure times within its documented window.

Current repository evidence on `main@ea9c51ff...`:

- `RouteRequest` contains only `from_place_id`, `to_place_id`, and `mode`.
- MCP `calculate_route` exposes only those same fields.
- `GoogleRouteProvider` sends no `departureTime` or `arrivalTime`; driving/taxi use `TRAFFIC_AWARE`, while transit/rail use `TRANSIT`.
- `RouteResult` / `RouteSnapshot` records `calculated_at`, but not the intended itinerary departure/arrival time or a normalized `time_basis`.
- `ProposalService` sums stored route `duration_minutes` into proposal impact.
- The repository's own Tokyo example contains future scheduled itinerary items, showing that future planning is a supported domain concept.

Therefore a route computed today can be carried into a future itinerary context without a machine-readable statement that it is a **request-time** route rather than a **trip-time** route. This can matter for transit schedules and traffic-sensitive driving.

This run does **not** claim a real missed connection, a live-user incident, or that every consumer persists these route snapshots. `calculated_at` is existing opposite evidence, and the current validator does not claim full schedule-feasibility from route duration alone.

Candidate classification retained centrally only:

- `kind=VALIDATION_GAP`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM_HIGH`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- runtime status: `NEEDS_RUNTIME_VERIFICATION`

Stable candidate fingerprint:

`travel-planning-mcp + calculate_route / RouteSnapshot + future scheduled itinerary + no requested departure/arrival time + Google defaults route departure basis to request time + duration may be reused as future-trip impact without explicit time basis`

Why no new Issue this round:

1. #7 is active owner scope and already contains future AI Planning Diff / travel-time-delta work, but the board has deliberately deferred that breadth until #5 and one bounded runtime journey are proven.
2. No runtime receipt currently shows this candidate changing an approval decision, hard constraint, or real trip outcome.
3. Creating another issue now would promote a technically plausible gap ahead of the owner-approved sequencing without enough user/runtime evidence.

Smallest future experiment, if/when authorized: one deterministic fixture matrix for `now` vs a future transit departure plus one traffic-sensitive driving case; record whether the consumer can distinguish `request_time_now` from `scheduled_departure`. Only if the gap changes a supported planning decision should the product add an optional `departure_at`/`arrival_at` and explicit `time_basis`. Do not start with route matrices, background refresh, traffic history storage, or a new scheduling engine.

## New Releases / Market Moves

| Date | Product | Signal | Confidence | Radar consequence |
|---|---|---|---|---|
| 2026-08-21 | Acai Core A2A | External agents can inspect live PNR/fare/change facts but cannot ticket/cancel/void | CONFIRMED | Reinforces read/simulate vs authoritative-write separation |
| 2026-07-31 | Expedia Group + Layla | AI-native planning is being combined with marketplace supply and booking at large-platform scale | CONFIRMED | Do not chase consumer booking breadth; keep canonical interoperable core |
| 2026-08 | Google Maps Platform agent skills | Provider is increasingly packaging current Maps knowledge/capabilities for AI agents | CONFIRMED | Adapter count is not a moat; provenance/state/mutation truth matters more |
| Current docs | Google Routes | Missing departure/arrival time defaults to request-time basis | CONFIRMED | Keep future-itinerary route time basis explicit before using it as strong feasibility evidence |

## Community Pain

No community signal was retained this round. The decision-relevant claims were sufficiently supported by first-party platform/product documentation and repository source. Anecdotal Reddit/HN prevalence would not change the current sequencing or authorize implementation.

## Adjacent Ideas

### 1. Quote / simulate before mutate

Acai's A2A boundary is a useful external analogue for the repo's strongest existing invariant. A future booking/status adapter should first be able to read authoritative booking state and compute a proposed change/quote without gaining ticket/cancel/write authority. If write support is ever approved, keep it behind a separate user/operator capability with exact proposal/version binding.

### 2. Provider as replaceable truth source, canonical trip as durable user intent

Google's managed MCP and Expedia's composable B2B direction both reduce the strategic value of building many provider wrappers. The canonical object should retain user intent and stable external identity while provider content remains source/freshness/retention-aware. This also reinforces #6 rather than creating a new persistence framework.

### 3. Time basis belongs in route provenance when schedule-sensitive decisions depend on it

A route timestamp alone says when a request was executed; it does not necessarily say **for when** the route was requested. This distinction should be introduced only when a supported workflow needs future-time route truth.

## Opportunity Map — `travel-planning-mcp`

| Bucket | Decision | Evidence / reason |
|---|---|---|
| MUST MATCH | Proposal lifecycle cannot let an ordinary planner rewrite protected operator decisions | Existing #5, owner-approved NOW |
| MUST MATCH | Provider-derived facts retain source/freshness/retention truth and do not become unqualified permanent canonical truth | Existing #6 + current Google platform direction |
| SHOULD BE BETTER | Keep canonical planning/mutation semantics independent from whichever discovery/booking provider is used | Expedia/Google market shift strengthens this wedge |
| SHOULD BE BETTER | When future itinerary feasibility depends on route duration, preserve the requested route time basis, not only request execution time | Google Routes contract + current RouteRequest/RouteSnapshot gap; hold for bounded evidence |
| DIFFERENTIATOR | Versioned ChangeProposal + external human approval + stale-write refusal + reversible canonical state | Repo/product-board direction; Acai adjacent pattern supports authority separation |
| ADJACENT IDEA | Read/quote-only booking or disruption adapters before any write capability | Acai A2A; requires future user/provider evidence |
| DO NOT COPY | Expedia/Layla full booking marketplace, affiliate/payment funnel, consumer social/mobile suite, supplier inventory ownership | Outside scope; scale/supply advantage belongs to incumbents |
| DO NOT COPY | New MCP-of-MCP router solely because Google offers managed Maps tools | No demonstrated workflow gap; would duplicate provider plumbing |

## Four-Gate Review

### Candidate 1 — Future itinerary route time basis

**Gate 1 — problem/value:** technically supported. Future itinerary items exist, the route contract lacks departure/arrival time, Google defaults route time to request time, and route duration can enter proposal impact. Counterevidence: `calculated_at` is retained; no real user/runtime outcome is observed.

**Gate 2 — priority:** `VALIDATION_GAP / NOT_ESTABLISHED / MEDIUM_HIGH / NEEDS_EVIDENCE`. P2 is not established without proof that this currently changes a supported completion/approval outcome at meaningful frequency.

**Gate 3 — minimum approach:** first run a tiny deterministic time-basis fixture. If the gap is decision-relevant, extend the existing request/result types locally with optional schedule time and a normalized time-basis receipt. No route-matrix service, scheduler rewrite, database, polling or provider framework.

**Gate 4 — research/implementation separation:** do not create an implementation ticket while #7 is active/deferred owner scope and the actual user/runtime consequence is unverified. Keep `auto_implementation=false`.

Result: **CENTRAL CANDIDATE ONLY; NO ISSUE WRITE.**

### Candidate 2 — Build booking / ticketing because Expedia is moving end-to-end

Gate result: **REJECT.** The external evidence shows incumbent consolidation of supply and checkout, not an unmet requirement in this repo. It would increase cost, permissions, compliance and failure surface while weakening the approved canonical-infrastructure wedge.

### Candidate 3 — Replace local provider adapters with Google Maps Grounding Lite MCP

Gate result: **HOLD / DO NOT COPY BY DEFAULT.** Google proves that managed geospatial tools are available, but the repo already has working provider ports and Google adapters. No concrete reduction in user friction or maintenance has been measured. A future host can use Google Maps MCP as a companion without forcing a core rewrite.

## Issue / PR Mapping

- Existing #5 — proposal terminal-state bug: unchanged; owner NOW.
- Existing #6 — Google Places retention boundary research: unchanged; reinforced by current provider-as-commodity direction.
- Existing #7 — owner next-phase umbrella: **SKIPPED_LOCKED_ACTIVE_OWNER_SCOPE**; no edits/comments. Its sequencing remains #5 → bounded runtime proof → later import/UI/writeback decisions.
- Existing #4 — fixed-persona quality tracker: unchanged.
- New Issues: **0**.
- Existing Issue comments/edits: **0**.
- PR comments/edits: **0**.
- Implementation authorization: **0**.
- Final de-dup search found no existing time-basis-specific Issue, but the candidate remains central-only because issue creation would outrun owner sequencing/evidence.

## Cross-portfolio Ideas

One principle is reusable without creating a platform-wide framework:

> Separate **observation/quote authority** from **mutation authority**, and record the time basis of any external fact that is used to justify a future-state decision.

This can apply to flight quotes, maps/routes, booking changes, market prices and other time-sensitive providers, but only where a repository actually consumes such evidence. Do not open portfolio-wide tickets from the principle alone.

## Rejected / Deduplicated Ideas

1. **Full booking/checkout integration — REJECT.** Expedia's acquisition is stronger evidence that this is an incumbent-supply game, not that the repo needs it.
2. **Social/group chat/native mobile parity — REJECT now.** Existing Product Board already excludes it; no new evidence overturns that decision.
3. **Generic Maps MCP proxy/router — REJECT/HOLD.** Managed Google MCP is useful, but the repo already has provider ports; no verified user workflow is improved by another orchestration layer.
4. **New route-matrix/optimization service now — HOLD.** Roadmap already records route-matrix optimization; current sequencing is #5 + bounded runtime evidence.
5. **New time-basis Issue — HOLD.** Source contract is real, but severity/value is not yet established and #7 is active owner scope.
6. **Duplicate Google Places retention work — DEDUPE to #6.** Provider-content durability is already correctly separated from user-owned trip intent.
7. **Booking write capability because Acai exposes GDS facts — REJECT.** Acai's own current A2A release intentionally stops at read/quote.

## Sources

### External / first-party

1. Expedia Group — Layla acquisition, 2026-07-31: https://ir.expediagroup.com/news-and-events/news/news-details/2026/Expedia-Group-acquires-Layla-accelerating-its-AI-powered-trip-planning-and-booking-strategy/default.aspx
2. Acai Core changelog — Agent to Agent, 2026-08-21: https://docs.acai.travel/docs/changelog-acai-core
3. Google Maps Platform — Maps Grounding Lite GA / agentic platform, 2026-04-22: https://mapsplatform.google.com/resources/blog/powering-the-next-era-of-agentic-experiences-announcing-new-grounding-capabilities/
4. Google Maps Platform — Grounding AI agents with Maps MCP, current docs checked 2026-09-20: https://developers.google.com/maps/architecture/grounding-with-maps-mcp
5. Google Maps Platform Innovators — August 2026 agent skills: https://developers.google.com/maps/innovators/newsletters/08-2026
6. Google Routes API — current transit/departure-time semantics: https://developers.google.com/maps/documentation/routes/transit-route
7. Google Routes API RPC reference — `departure_time` default semantics: https://developers.google.com/maps/documentation/routes/reference/rpc/google.maps.routing.v2

### Repository evidence

- `travel-planning-mcp/main@ea9c51ffb5c12a82f6bac609420731136e058c7c`
- product baseline `5a84a746266a2bd8cabf07db24a0fd2e9558b400`
- `.github/quality-audits/2026-09-17T0811Z-product-board-audit.md`
- `autodev-ng/docs/portfolio-audit/2026-09-18T2300Z-product-board-delta.md`
- `README.md`
- `docs/roadmap.md`
- `src/ports/route-provider.ts`
- `src/adapters/google-route-provider.ts`
- `src/mcp/server.ts`
- `src/domain/types.ts`
- `src/services/proposal-service.ts`
- `tests/google-providers.test.ts`
- all-state Issue search, all-state PR search, related owner-scope comments and route-related branch search were checked before deciding not to write a new Issue

## What Changed This Round

- Fresh portfolio pagination confirmed **42 owned / 41 unarchived**.
- Rules blob SHA reconfirmed: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Focal default HEAD rechecked: `ea9c51ffb5c12a82f6bac609420731136e058c7c`.
- Major direct-market change retained: Expedia's Layla acquisition confirms large travel platforms are consolidating inspiration → planning → booking around supply/marketplace scale.
- Adjacent workflow change retained: Acai A2A exposes live GDS truth and priced change/cancellation information while deliberately withholding booking mutation authority.
- Platform signal retained: Google continues commoditizing raw geospatial agent tools through managed MCP/agent skills.
- One source-confirmed but not-yet-prioritized route time-basis validation candidate was added to the central report only.
- **0 new Issues; 0 Issue modifications/comments; 0 PR modifications/comments; 0 implementation authorization.**
- No live Google Routes/Places call, TRIP-account run, booking, provider write, payment, deployment or production mutation was executed. Route time-basis candidate remains `NEEDS_RUNTIME_VERIFICATION`.
- This radar does not declare `travel-planning-mcp` or the portfolio CLEAN.
- Next fair-rotation target: `Reese-max/UkePack`.
