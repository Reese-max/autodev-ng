# External Competitive / New-Product / Workflow Radar — 2026-09-20T19:58:49Z

## Status / scope / evidence boundary

- Run status: **COMPLETE / NO_NEW_ACTIONABLE_ISSUE**.
- Governing rule re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected owner inventory: full pagination returned **42 Reese-max-owned repositories / 41 unarchived**; offset 100 was empty. `obsidian-vault` is the only archived repository and is excluded from active product scope.
- Fair-rotation focal repository: `Reese-max/google-maps-personal-mcp`, continuing the latest cursor from `2026-09-20T180012Z-external-radar.md`.
- Current default branch / HEAD: `main@800bc3b5adc3558a6ee9a5f296549098467596fb`. The current product-code baseline remains `8bb6931b6d34f158aedf9ad6f652a7aef3822bcb`; later default-branch commits are audit/docs evidence.
- Owner direction remains **INVEST / SIMPLIFY**: local SQLite is the durable personal truth for collections / notes / tags / priority; Google Places / Google Maps are replaceable discovery and bounded sync surfaces. Generic travel-planning breadth, social discovery, collaboration SaaS, another provider, native-app breadth and generic identity infrastructure remain non-priorities without owner workflow evidence.
- Existing active scopes checked before this report: #1 Places-content retention, #2 same-collection sync ownership, #4 Place-ID rollover research, #7 shared Chrome-profile ownership; open PRs #5/#6 remain active. This radar does not modify or steal those scopes.
- No product source, CI/config, secrets, permissions/settings, implementation branch, merge/deploy, worker/GOAL, paid provider request or formal Google Maps write was started.
- Portfolio CLEAN is **not declared**.

## Product → market category

`google-maps-personal-mcp` is best treated as a **private/local personal-place memory and bounded Maps handoff layer**, not a travel SaaS or generic geospatial agent. Its durable value is user-owned context plus inspectable synchronization; provider facts are refreshable and policy/cost constrained.

## External Signals

### A. CONFIRMED — Tripsy 3.10 turns heterogeneous travel inputs into reviewable candidate imports

**Released 2026-09-14; 3.10.1 follow-up 2026-09-16; checked 2026-09-20 UTC.**

Sources:
- https://tripsy.app/updates
- https://tripsy.app/integrations/claude
- https://tripsy.app/ai/tripsy-mcp

Tripsy 3.10 adds Smart Import from screenshots, documents, saved emails, pasted text, Google Maps / Apple Maps lists, travel sites, and supported social links. The important workflow detail is not merely "AI import": users can **review the extracted results on a map, edit details, and import all or only selected items**. Tripsy can also keep the originating file/link attached to the resulting activity. Its current Claude/MCP surfaces similarly keep action approval visible rather than treating model intent as automatic mutation authority.

**User job:** reduce repeated copy/paste when a place recommendation starts outside the place library, while retaining control over what becomes canonical trip/place state.

**Transferable pattern:**

`Untrusted external input → extracted candidate → map/provider grounding → review/edit/select → durable commit + source pointer`

This is stronger than direct "AI found a place, so save it" behavior and aligns with the repo's existing dry-run / bounded-effect philosophy.

**Repository mapping / counter-evidence:** imports have already been explored via Mapstr / Takeout in earlier radars and were held because no owner-scale/high-frequency import pain was established. The current product already has explicit local notes/tags/priority and bounded sync semantics. Therefore Tripsy is **fresh corroborating workflow evidence**, not enough to open an importer architecture Issue.

**Do not copy:** email/document ingestion platform, automatic itinerary SaaS, social-source breadth, account/cloud collaboration or opaque auto-commit.

### B. CONFIRMED — current Places field masks couple normal search/detail calls to Enterprise-tier SKUs

**Current first-party Google documentation checked 2026-09-20 UTC.**

Sources:
- https://developers.google.com/maps/documentation/places/web-service/data-fields
- https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
- https://developers.google.com/maps/billing-and-pricing/pricing

Google's current field table places `rating` and `userRatingCount` in **Enterprise-tier Text Search / Nearby Search**. Place Details fields such as `regularOpeningHours`, `internationalPhoneNumber`, `websiteUri`, and `priceLevel` are also Enterprise-tier fields. Google bills a request according to the highest applicable SKU triggered by its field mask.

Repository source currently asks every text/nearby search for `rating` and `userRatingCount`; every `get_place()` asks for several Enterprise detail fields. This is a real provider-cost contract, not an inferred architecture issue.

However, current pricing also includes free monthly usage per SKU (current table: typically 1,000 Enterprise calls/SKU/month, 5,000 Pro, 10,000 Essentials; Place Details IDs-only has a larger/unlimited allowance depending on the SKU table). This radar has **no owner billing telemetry, request volume, invoice, or cost incident**, and rating/review count are not obviously waste: the repo's `rank_places` formula uses them.

Therefore this does **not** establish a P2/P1 defect or justify deleting ratings. It is retained as a small maintenance/cost-envelope candidate:

```yaml
kind: MAINTENANCE
severity: P3
decision_priority: LOW_MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

Smallest future action if real volume/cost evidence appears: first measure actual request counts and identify which user workflows need rating/opening-hours/phone/site/price data; then compare the present single Enterprise request with a cheaper discovery mask plus optional enrichment only when the user/ranking path needs it. Do **not** build a billing database, cost dashboard, provider registry or second API layer preemptively.

### C. CONFIRMED — Trip Pocket separates provider canonical identity from a short personal reason-to-save label

**Current first-party product checked 2026-09-20 UTC. App Store listed version 1.9.0 as six days old when checked; no absolute release date is inferred here.**

Sources:
- https://trippocket.app/
- https://apps.apple.com/in/app/trip-pocket-travel-planner/id6768290313

Trip Pocket uses an inbox for ideas arriving from screenshots/social sources, grounds extracted locations against Google Maps, and avoids saving an unrecognized place. Its recent product surface also exposes **personal labels**: a short user-owned label explaining why the place was saved without replacing the provider's real name.

**Portable idea:** `provider canonical name ≠ user's reason-to-save / personal display label`.

Repository counter-evidence is strong: `CollectionPlace` already has `note`, `tags`, `priority` and `rank`, so most of this job can be done today without a new schema field. There is no evidence that users repeatedly need a one-line alias distinct from notes/tags. Retain as **ADJACENT IDEA / HOLD** only.

### D. CONFIRMED — Places Insights continues to expand provider analytics, but it is outside this product's job

**Places Insights historical monthly snapshots became generally available 2026-09-02; checked 2026-09-20 UTC.**

Source:
- https://developers.google.com/maps/documentation/placesinsights/release-notes

Google can expose place/rating/count history for analytics workloads. That is useful market context but does not create a personal-place-library job here. Building trend analytics, place-market intelligence, or historical review-count warehouses would enlarge scope and provider-content obligations without evidence.

Decision: **DO NOT COPY**.

## New Releases / Market Moves

| Date / state | Product / platform | Signal | Confidence | Radar consequence |
|---|---|---|---|---|
| 2026-09-14 / 09-16 | Tripsy 3.10 / 3.10.1 | multimodal Smart Import with review/edit/selective commit and source attachment | CONFIRMED | strengthens candidate-before-commit ingestion pattern; import demand still unproven |
| Current 2026 docs | Google Places API | current search/detail field masks can trigger Enterprise SKUs | CONFIRMED | retain P3 cost-envelope candidate; do not remove useful ranking fields without usage evidence |
| Current 2026 product | Trip Pocket | grounded idea inbox + personal labels | CONFIRMED product capability | user-owned label is separate from provider identity; existing notes/tags are the smaller solution |
| 2026-09-02 | Google Places Insights | historical monthly snapshots GA | CONFIRMED | analytics breadth is outside local personal-memory scope |

## Community Pain

No new, recent community signal was reliable enough to change prioritization in this round. Prior anecdotes around Google Maps list import/export and cross-tool saving remain **COMMUNITY_SIGNAL**, not evidence of owner frequency, completion-rate loss or a new P0/P1/P2 defect.

The absence of prevalence evidence is specifically why this radar does **not** convert Tripsy's importer pattern into an implementation Issue.

## Adjacent Ideas

### 1. Candidate-before-commit import — HOLD / NEEDS OWNER WORKFLOW EVIDENCE

If future owner usage repeatedly begins from screenshots, articles, social links or existing Maps lists, the smallest experiment is **not** a general importer service.

Start with no product change: for a bounded set of real save workflows, record the input source type and the manual copy/re-identification steps. Only if repeated friction is observed, test one isolated path:

`source artifact/link → extracted place candidates → Google-grounded IDs → explicit review/select → existing save_place()`.

Preserve the source pointer if policy permits; never let OCR/LLM extraction itself acquire save/sync authority.

Classification:

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: LOW_MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

### 2. Field-mask cost split — HOLD / P3 maintenance candidate

Do nothing while usage comfortably fits the current cost envelope. If request volume or billing becomes material, test whether `rating/userRatingCount` enrichment can be conditional without breaking ranking semantics or multiplying request count enough to erase savings.

No provider abstraction, database, scheduler or billing dashboard is justified.

### 3. Personal short label — HOLD

Reuse `note` / `tags` first. Add a dedicated alias/label only if real workflows repeatedly show that notes are too verbose and tags are too categorical for the job.

## Opportunity Map — `google-maps-personal-mcp`

### MUST MATCH

- User-owned notes/tags/priority/collection membership stay distinct from refreshable provider identity/content.
- Extracted/imported candidates never become durable local or Google Maps state without an explicit review/commit boundary.
- Provider failure, stale data, billing tier and verified external mutation remain separate facts rather than one generic "connected" state.
- Existing #1/#2/#7 correctness work stays ahead of feature breadth.

### SHOULD BE BETTER

- If import demand is later proven, preserve source provenance and selective commit instead of bulk opaque ingestion.
- Make provider field-mask/cost implications explicit before scaling request volume; optimize only from actual usage evidence.
- Prefer existing notes/tags for personal intent before adding another user-metadata field.

### DIFFERENTIATOR

- Local SQLite as personal truth rather than provider/account truth.
- Inspectable user-authored context plus replaceable discovery/sync boundary.
- Dry-run, bounded writes and recoverable synchronization rather than autonomous travel-agent actions.

### ADJACENT IDEA

- Narrow, reviewable capture from one external artifact/link type.
- Optional personal short label if real usage proves note/tag friction.
- Host-side official Maps MCP / provider tools remain a future substitute for commodity discovery, as recorded in prior radar; do not nest MCPs now.

### DO NOT COPY

- Tripsy/Puddle-style full itinerary/travel SaaS breadth.
- Social/group collaboration, account cloud, email/document ingestion platform.
- Automatic AI save/import without review.
- Historical Places analytics / review-trend warehouse.
- Generic billing platform or multi-provider routing framework.
- Native/mobile product expansion solely because competitors package the same workflow there.

## Cross-Portfolio Ideas

One small reusable principle is reinforced across Maps, travel-planning, music and document-ingestion products:

`External Artifact → Candidate Extraction → Provider/Source Grounding → Human Review → Canonical Local Commit → Optional External Effect Receipt`

This is a **design primitive, not a shared service proposal**. There is no evidence for building a portfolio-wide ingestion framework. Each domain has different identity, policy, licensing and effect semantics.

A second reusable distinction is:

`Useful Provider Field ≠ Required On Every Request`.

Cost-sensitive products should tie optional enrichment to a concrete user job rather than delete useful data blindly or request the richest SKU everywhere by default. Again, this does not justify a shared cost engine.

## Four-gate decisions

### Candidate A — reviewable external-place capture

1. **Problem/value:** Tripsy demonstrates a low-friction workflow for heterogeneous inputs, but this repo has no measured owner frequency showing screenshot/list/link re-entry is a material bottleneck. Prior Mapstr/Takeout exploration already reached the same demand uncertainty.
2. **Priority:** `RESEARCH / NOT_ESTABLISHED / LOW_MEDIUM / NEEDS_EVIDENCE`.
3. **Minimum solution:** observe actual source types first; if needed, one source type → candidates → review → existing `save_place`. No import framework, inbox DB or travel-parser architecture.
4. **Research/implementation separation:** no Issue now. A future BUILD result would only justify the narrowest validated input path and would still need explicit owner authorization.

### Candidate B — Enterprise field-mask cost coupling

1. **Problem/value:** source code and first-party docs confirm that routine search/detail masks request Enterprise-tier fields. Actual owner cost/volume harm is unknown and ranking legitimately consumes rating data.
2. **Priority:** `MAINTENANCE / P3 / LOW_MEDIUM / NEEDS_EVIDENCE`.
3. **Minimum solution:** measure request count/cost first; only then test conditional enrichment while preserving ranking truth. Documentation is enough until volume warrants more.
4. **Research/implementation separation:** no Issue now because no invoice/usage/frequency evidence shows a material maintenance problem. Google pricing alone does not authorize optimization work.

### Candidate C — personal label

1. **Problem/value:** competing workflow cleanly separates canonical name from personal intent, but current `note/tags` already provide a viable substitute.
2. **Priority:** `OPPORTUNITY / NOT_ESTABLISHED / LOW / NEEDS_EVIDENCE`.
3. **Minimum solution:** use notes/tags; dedicated field only after observed UX friction.
4. **Research/implementation separation:** no Issue.

## Rejected Ideas / why

1. **Open a Tripsy-style Smart Import feature batch — REJECT/DEFER.** Fresh workflow evidence is real, but owner pain/frequency is still unproven and prior import research already hit that gate.
2. **Auto-save extracted screenshot/social places — REJECT.** Extraction is not identity/effect authority; review remains required.
3. **Remove ratings from all searches to chase lower SKU cost — REJECT.** Ranking currently uses rating/review count; cost harm is unmeasured.
4. **Build billing dashboard / quota database — REJECT.** A tiny personal product should first inspect actual request counts/invoice; no system is needed yet.
5. **Add dedicated personal-label schema now — REJECT/DEFER.** Existing note/tags are the smaller substitute.
6. **Add Places Insights analytics — REJECT.** Different product/job and larger provider-data surface.
7. **Expand into itinerary SaaS / social travel planning — REJECT.** Contradicts approved scope and duplicates stronger provider/consumer products.
8. **Modify #1/#2/#4/#7 or PR #5/#6 with these signals — SKIPPED_ACTIVE_SCOPE.** No fresh evidence changes their root cause or acceptance boundary.

## Issue Mapping

- New Issues: **0**.
- Existing Issue edits/comments: **0**.
- PR edits/comments: **0**.
- Implementation authorizations: **0**.
- Locks: none required because no Issue/shared-state mutation was attempted.
- Existing relevant scopes remain #1, #2, #4, #7; open PRs #5/#6 remain untouched.

## Sources

Primary public sources checked this round:

1. Tripsy Updates — 2026-09-14 / 2026-09-16: https://tripsy.app/updates
2. Tripsy Claude integration — current product checked 2026-09-20: https://tripsy.app/integrations/claude
3. Tripsy MCP — current product checked 2026-09-20: https://tripsy.app/ai/tripsy-mcp
4. Google Places API field table — current docs checked 2026-09-20: https://developers.google.com/maps/documentation/places/web-service/data-fields
5. Google Places usage and billing — current docs checked 2026-09-20: https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
6. Google Maps Platform pricing — current table checked 2026-09-20: https://developers.google.com/maps/billing-and-pricing/pricing
7. Trip Pocket — current product checked 2026-09-20: https://trippocket.app/
8. Trip Pocket App Store — current listing checked 2026-09-20: https://apps.apple.com/in/app/trip-pocket-travel-planner/id6768290313
9. Google Places Insights release notes — event 2026-09-02: https://developers.google.com/maps/documentation/placesinsights/release-notes
10. Google Place IDs — current docs checked 2026-09-20, retained only as duplicate support for #4: https://developers.google.com/maps/documentation/places/web-service/place-id

## What Changed

- **No new actionable product fingerprint passed all four gates.**
- New external workflow evidence from Tripsy strengthens reviewable candidate ingestion and provenance, but does not overcome the repo's existing lack of owner import-frequency evidence.
- A new repo-to-provider comparison makes the cost contract more explicit: current search/detail field masks select Enterprise-tier Places fields. This is retained as a P3 maintenance candidate only because actual request volume/cost impact is unknown and the data powers existing ranking behavior.
- Trip Pocket reinforces a useful identity boundary: provider canonical name should remain separate from user-owned intent/label. Current notes/tags are sufficient until proven otherwise.
- Places Insights expansion is intentionally rejected as scope breadth.
- Severity upgrades: **0**. Scope expansions: **0**. Implementation authorizations: **0**.

## Classification / scope calibration

- Existing #1/#2/#7 remain the higher-value source-confirmed correctness/maintenance work; this radar does not demote or expand them.
- #4 remains `RESEARCH / NOT_ESTABLISHED`; no new provider evidence changes its requirement for bounded fixtures and review-safe rollover semantics.
- Competitive feature presence does not establish a defect.
- Enterprise SKU selection does not establish an actual billing incident; missing owner telemetry is kept as uncertainty rather than converted into fake ROI.
- No runtime provider call was executed here. Repository source inspection and first-party public contracts support only the scoped conclusions above.

## Completion / gaps / cursor

- Fresh owner inventory pagination: complete, 42 owned / 41 unarchived, second page empty.
- Focal repository direction, default HEAD, current Issues, all-state/open PR scopes and prior Maps radar were rechecked.
- External exploration covered direct provider contracts, a recent adjacent importer/workflow, a current personal-place product and a new analytics capability.
- Community evidence was insufficient to change priority and was not inflated into prevalence.
- Runtime tests/provider calls: **NOT EXECUTED** in this radar.
- Report write is the only repository mutation in this round.
- Next fair-rotation cursor: **`Reese-max/herdr-skills`**.
