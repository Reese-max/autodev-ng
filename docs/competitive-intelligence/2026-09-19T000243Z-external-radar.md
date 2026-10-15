# External Competitive / New-Product / Workflow Radar — 2026-09-19T00:02:43Z

## Scope, rules, and evidence boundary

- Owner scope: `Reese-max` only. No third-party repository was modified.
- Issue-quality rule re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality-rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh owner pagination returned **41 accessible Reese-max-owned repositories; 40 unarchived**. `obsidian-vault` is archived; the remaining accessible repositories are unarchived. This is the current accessible inventory, not a claim about deleted/inaccessible historical repositories.
- Fair external-radar cursor from the preceding round: `ai-flight-radar`; this round processed that product deeply. Next cursor: `academic-mcp`.
- Current `ai-flight-radar` default branch: `main`; HEAD inspected: `6228138337f950cb6399088c4f814f27a518e29e`.
- The default-branch HEAD is unchanged from the prior dedicated AI Flight Radar external-radar report (`2026-09-15T220016Z-external-radar.md`).
- Current repository scope remains an evidence-oriented **Taiwan-origin fare observation / tracking product**, not a booking/payment platform. README and roadmap explicitly distinguish observed fare from bookable/final fare and keep automatic purchase/payment out of scope.
- Current open work includes #1 live source calibration, #4 reviewed intent→WatchSpec research, #6 route-capacity/freshness defect, and #8 Fli-derived provider work. Open PRs #9/#11 overlap #2/#6 dependency/capacity work and PR #10 is an audit report; this radar did not modify those scopes.
- No live flight search, provider call, booking handoff, notification, deployment, paid request, worker/GOAL, source/config/CI/secrets/settings change, or product branch was created by this radar.
- Provider runtime fidelity remains `NEEDS_RUNTIME_VERIFICATION` where the repository already requires it. This radar does **not** declare the repository or portfolio CLEAN.

## Executive decision

**0 new Issues. 0 existing Issue/PR comments. 0 implementation authorizations.**

There is useful new market evidence, but after fingerprinting it maps to existing product boundaries rather than a new root cause:

1. **Agent-native flight booking is becoming provider/distribution infrastructure.** Duffel announced a September 2026 integration with Meta's Muse so users can search, book, cancel and manage flights through the agent. This is a meaningful adjacent-market shift, but it strengthens the current `DO NOT COPY` boundary: AI Flight Radar's differentiation is truthful observation/history/alerts, not rebuilding airline booking infrastructure or an autonomous travel agent.
2. **Mature flight APIs separate a search observation from a transaction-valid offer.** Duffel's first-party API exposes `expires_at`, says offers typically expire in roughly 30 minutes, and recommends re-fetching the selected offer because availability/price may change. This strongly supports the repository's existing principle that a six-hour radar observation must not be presented as six hours of bookability. The roadmap already tracks offer expiry / final-price / handoff recheck work, so opening another “offer validity” Issue would be duplicate scope.
3. **Provider availability and contracts continue to churn.** Amadeus' self-service developer portal was decommissioned on 2026-07-17 and its public site now points developers at Enterprise APIs. This is evidence against casually adding providers for breadth. It does not prove Duffel, NDC, or any other source is the right Taiwan-market secondary source.

The smallest next step remains the already-authorized sequence: finish truthful source/outcome evidence and capacity work, then use #1's bounded live calibration to decide whether a genuinely independent second source is useful as a comparator/admission candidate. No new provider integration should be created from vendor marketing alone.

## External Signals

### A. Direct competitor — discovery, tracking and transaction remain different freshness classes

**CONFIRMED current first-party capability; checked 2026-09-19 UTC.**

KAYAK's current help surface continues to separate Explore from current search and Price Alerts:

- Explore can show destination prices found in the last 48 hours and explicitly tells the user to check current prices before booking.
- Price Alerts are managed separately; most refresh daily, while optional real-time alerts trigger on significant changes (KAYAK documents a typical 10% change threshold).
- A selected Explore destination can be promoted into current flight search or an alert instead of treating every broad discovery result as transaction-fresh.

Sources:
- https://www.kayak.com/c/help/search/
- https://www.kayak.com/c/help/pricing/

**User job:** browse broad possibilities cheaply, then spend freshness/request budget only when the user narrows intent.

**Manual work reduced:** broad destination discovery does not require repeatedly issuing a transaction-fresh query for every route.

**Transfer:** same as the prior #6 calibration: explicit freshness classes are preferable to a single arbitrary cadence. No new Issue; #6 already carries the sustainable-capacity root cause and PR #9 is active.

**Do not copy:** KAYAK's exact 48-hour or 10% numbers. They are KAYAK product choices, not Reese-max evidence.

### A2. Direct competitor — Skyscanner's calendar is explicitly indicative, alerts are exact watches

**CONFIRMED — help page updated 2026-03-26; checked 2026-09-19 UTC.**

Source: https://help.skyscanner.net/hc/en-us/articles/201150942-How-do-I-find-the-best-prices

Skyscanner says Month/Everywhere prices are estimates found by users in the last eight days, while fixed-date Price Alerts are a separate monitoring workflow.

**Transferable pattern:** `broad estimated discovery != monitored exact query != bookable fare`.

This is stronger corroboration for the existing AI Flight Radar evidence boundary, but it does not create a new problem beyond #4/#6/roadmap.

### A3. Adjacent major strategy — Duffel makes flight transactions agent-native through Meta Muse

**CONFIRMED — Duffel first-party announcement, September 2026; checked 2026-09-19 UTC.**

Source: https://duffel.com/blog/millions-of-users-can-now-use-duffel-to-search-book-and-manage-holidays-on-muse-the-new-personal-ai-agent-from-meta

Duffel says Muse users in the US can search live flight inventory, compare prices/options, book, cancel and manage trips through its connector. Duffel positions its flight infrastructure as the layer underneath the agent rather than requiring every agent product to build airline connectivity itself.

**Job:** let a conversational agent execute a travel transaction without the user moving into a separate travel application.

**Distribution/onboarding:** capability is embedded as a connector in an existing agent surface.

**AI Flight Radar implication:** this is **not** a competitive-gap mandate. The current owner direction explicitly excludes payment/automatic booking. If a future AI interface is desired, the product should expose its distinctive evidence/price-history/watch capabilities and leave commodity transaction execution to authorized travel infrastructure.

**Do not copy:** booking/cancellation/payment/order management or passenger credential flows without a separately approved product direction and safety model.

## New Releases / capability changes

| Date / checked | Product / provider | Change | Radar implication |
|---|---|---|---|
| Sep 2026 / checked 2026-09-19 | Duffel × Meta Muse | Agent can search, book, cancel and manage flights via Duffel connector | Agent-native booking is becoming infrastructure; reinforces current no-booking boundary |
| current / checked 2026-09-19 | Duffel Offers API | Offers have `expires_at`; typically short-lived; re-fetch may show changed price/availability | Radar snapshot age and transaction validity must remain separate |
| 2026-07-17 / checked 2026-09-19 | Amadeus for Developers | Self-service portal decommissioned; site now directs to Enterprise API access | Provider access can disappear/change; do not add providers casually |
| checked 2026-09-19 | KAYAK | Explore recent snapshots, current search and alerts use different freshness/interaction semantics | Corroborates #6 freshness-class calibration |
| 2026-03-26 / checked 2026-09-19 | Skyscanner | Month/Everywhere prices described as estimates from the last 8 days | Corroborates explicit indicative-vs-current state |

## B. Adjacent workflow — transaction-validity evidence should be narrower than radar freshness

Duffel's first-party offer model is the clearest portable design pattern this round.

Sources:
- https://duffel.com/docs/api/offers
- https://duffel.com/docs/api/overview/test-your-integration

Duffel exposes an exact `expires_at` on each offer, warns that retrieving an offer can return a changed amount, and provides deterministic test-environment scenarios for `offer no longer available` and `offer price change`.

The useful principle for AI Flight Radar is not “adopt Duffel” or “copy a 30-minute TTL.” It is:

`historical observation freshness`
`!= provider/search result freshness`
`!= transaction-valid offer lifetime`
`!= final checkout truth`

AI Flight Radar already states that observations are at most six-hour evidence and are not guaranteed bookable. `docs/ROADMAP.md` already includes offer-expiry information, full fare/baggage truth and a recheck before purchase as P2 work. Therefore the right action is **dedup**, not a new Offer Registry/TTL Issue.

If future runtime work reaches this boundary, the minimum test is one selected result rechecked immediately before handoff, recording whether provider price/identity/availability changed. There is no evidence for a new database, provider-wide expiry framework or booking subsystem.

## C. Emerging provider ecosystem — independent source may be useful as calibration evidence, not product breadth

**CONFIRMED current first-party state; checked 2026-09-19 UTC.**

Amadeus' developer site states that the Self-Service portal was decommissioned on 2026-07-17 and that the remaining public route is the Enterprise API portal:
https://developers.amadeus.com/blog/comparing-open-source-flight-data-sources

Duffel currently advertises access to 300+ airlines across NDC/GDS/LCC channels and exposes separate test/live mode in its API:
- https://duffel.com/flights/search
- https://duffel.com/docs/api/offer-requests

This is **not** evidence that Duffel is complete for Taiwan-origin/Japan routes, price-comparable with Google Flights, affordable for the intended radar cadence, or contractually suitable for storing historical fares. Those facts remain UNKNOWN without a bounded evaluation.

The portable idea is narrower: #1's future calibration could use a genuinely independent provider/booking handoff as one comparator where terms and test/live limits permit. That can improve confidence in route/date/price semantics without promoting the comparator to an always-on production provider.

No new provider Issue is justified while #1/#8 and source-health evidence are unresolved.

## Community Pain

### Alert fatigue / redundant notifications

**PRODUCT-HELP SIGNAL, not prevalence evidence — Hopper help checked 2026-09-19 UTC.**

Source: https://help.hopper.com/en_us/why-didn%27t-i-receive-a-notification-about-a-price-change-rJxqIYutP

Hopper says it may suppress insignificant price changes and may avoid notifying about a price the user has already manually seen.

**Transferable idea:** notification value depends on novelty/materiality, not only “price changed.”

**Why no Issue:** AI Flight Radar's public durable-watch path is not yet enabled; #4 already requires traceable alert decisions, and #1/source reliability is higher priority. There is no Reese-max user evidence yet that seen-state or alert-fatigue logic is needed.

No Reddit/community-only claim was used to establish frequency, severity or ROI this round.

## Opportunity Map — AI Flight Radar

### MUST MATCH

- Keep observed fare, historical baseline, stale/unknown, provider failure, selected-offer recheck and final bookable price as distinct states.
- Preserve exact observation/source time and query identity.
- Keep `NO_RESULTS` distinct from provider/parse/rate-limit failures.
- Make the broad route cadence mathematically sustainable under the authorized request budget.
- Before any consequential booking handoff claim, revalidate the selected fare rather than relying on the broad radar snapshot.

### SHOULD BE BETTER

- Express freshness by job: broad discovery, explicit current check, future durable watch, final handoff.
- When a provider exposes native offer expiry, preserve it as provider evidence instead of replacing it with the radar's own generic TTL.
- Prefer a bounded independent comparator inside #1 research before adding another always-on source.
- Surface route/source degradation from real outcome evidence rather than a generic worker heartbeat.

### DIFFERENTIATOR

- Taiwan-origin fare intelligence with explicit historical thresholds and honest insufficient-data states.
- Evidence-oriented price history instead of opaque “cheap” claims.
- Bounded, owner-controlled collection with no fabricated demo fares.
- Future reviewable WatchSpec promotion that preserves exact intent without becoming an autonomous booking agent.

### ADJACENT IDEA

- Use an independent, terms-compatible provider only as a calibration comparator for selected strata before deciding whether production multi-provider support is valuable.
- Preserve provider-native `offer expires at` / last-refreshed evidence when available.
- Later, consider material-change/seen-state notification suppression only after durable watches are authorized and real alert-fatigue evidence exists.

### DO NOT COPY

- Meta Muse / Duffel booking, cancellation and payment breadth.
- KAYAK/Skyscanner numeric freshness windows as Reese-max SLAs.
- A new Offer Registry, transaction state machine or booking database merely to represent expiry.
- Multi-provider breadth before current provider calibration/source-health semantics are stable.
- Unbounded flexible-date expansion or a request-budget increase justified only by competitor breadth.
- Treat a provider's test environment or marketing coverage as proof of Taiwan-market live fidelity.

## Four-gate decision — candidate “independent offer provider / transaction-validity layer”

### 1. Problem / value

**Current user problem already established elsewhere:** AI Flight Radar can preserve a fare observation, but the product correctly cannot claim that observation is still purchasable at the same price hours later. Runtime source fidelity is already tracked by #1, and detailed offer expiry/final-price work is already in the roadmap.

**Counterevidence:** a new production provider is not necessary to state this truth. README already warns observations are not booking guarantees. Existing #1 can test handoff fidelity; #8 already contains provider admission/calibration concepts.

**Do-nothing consequence:** no new consequence beyond the already-known #1/roadmap gap was established this round.

**Gate result:** no independent new fingerprint.

### 2. Priority

No new item is assigned P0/P1/P2.

If evaluated later as a provider-comparator experiment, classify it under existing work as:

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
```

This is not a claim that #1/#8's historical title labels are quality-v2 severity assignments.

### 3. Minimum solution order

1. Do nothing new while current source/outcome/capacity evidence is unresolved.
2. Reuse #1's bounded calibration protocol and current provider domain model.
3. If owner-approved, add **one** independent comparator for a small route/date stratum without making it production-primary or scheduled.
4. Record source/query identity, observed amount, exact time, availability/expiry evidence if exposed, and handoff difference.
5. Only if that experiment demonstrates unique decision value should a second production provider be considered.

A new provider registry/database/booking system is not justified by this evidence.

### 4. Research / implementation separation

No research Issue was opened because #1/#8 already provide the relevant bounded decision surface. A future comparator result of BUILD would only support the next provider-admission decision; it would not authorize production switching, paid cadence, booking or external writes.

## Cross-portfolio ideas

### Observation freshness ≠ action validity

A reusable evidence principle across products is that an observation can be fresh enough for discovery yet too old for a consequential action. The action boundary should demand a narrower/current receipt appropriate to the action.

This is a product/evidence principle only. No shared cross-repository freshness framework, database or service is authorized or proposed.

## Rejected Ideas

1. **Integrate Duffel now — REJECT/DEFER.** Strong API semantics and agent distribution do not prove Taiwan-route coverage, historical-storage terms, economics, or value over the active Fli work.
2. **Build booking/cancellation into AI Flight Radar — REJECT.** Explicitly outside owner scope and increasingly available as external infrastructure.
3. **Create an Offer Registry/state machine — REJECT.** Existing observation model plus optional provider-native expiry/recheck is enough for current scope.
4. **Copy Duffel's typical ~30-minute lifetime — REJECT.** Provider-specific transactional semantics are not a universal radar freshness SLA.
5. **Treat Amadeus Self-Service shutdown as a reason to rush another provider — REJECT.** It is evidence of provider churn, not proof of a preferred replacement.
6. **Open a new alert-fatigue Issue — DEFER.** No durable public watch path/user evidence yet; #4/source reliability comes first.
7. **Reopen or duplicate #6 freshness work — REJECT/DUPLICATE.** External tiered-freshness evidence is already mapped to #6 and PR #9 is active.
8. **Claim agent-native booking is now a required feature — REJECT.** Market availability does not override the approved product boundary.

## Issue Mapping

| Signal / candidate | Existing destination | Decision |
|---|---|---|
| Broad discovery vs current/alert freshness | #6, #4 | DEDUP; no comment because no new state |
| Search observation vs transaction-valid offer | #1 + roadmap P2 | DEDUP; preserve as central evidence |
| Independent provider comparator | #1 / #8 | DEFER to bounded calibration; no new Issue |
| Agent-native booking via Duffel/Muse | product scope / rejected ideas | DO NOT COPY |
| Alert novelty / seen-state | #4 future alert semantics | DEFER; no user evidence yet |
| Provider ecosystem churn | #8 provenance/admission + #1 calibration | supporting evidence only |

No Issue lock was acquired because no existing Issue/shared status was modified. Active PR scopes were not touched.

## Sources

First-party / primary:

1. Google Search AI Mode travel (prior direct-competitor reference, 2026-08-27): https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/
2. KAYAK Search/Explore help, checked 2026-09-19: https://www.kayak.com/c/help/search/
3. KAYAK pricing/alerts help, checked 2026-09-19: https://www.kayak.com/c/help/pricing/
4. Skyscanner best-price help, updated 2026-03-26, checked 2026-09-19: https://help.skyscanner.net/hc/en-us/articles/201150942-How-do-I-find-the-best-prices
5. Duffel × Muse announcement, September 2026, checked 2026-09-19: https://duffel.com/blog/millions-of-users-can-now-use-duffel-to-search-book-and-manage-holidays-on-muse-the-new-personal-ai-agent-from-meta
6. Duffel Offers API, checked 2026-09-19: https://duffel.com/docs/api/offers
7. Duffel test-integration scenarios, checked 2026-09-19: https://duffel.com/docs/api/overview/test-your-integration
8. Duffel flight search product page, checked 2026-09-19: https://duffel.com/flights/search
9. Duffel Offer Requests / test-live semantics, checked 2026-09-19: https://duffel.com/docs/api/offer-requests
10. Amadeus developer portal decommission notice, checked 2026-09-19: https://developers.amadeus.com/blog/comparing-open-source-flight-data-sources
11. Hopper notification behavior, checked 2026-09-19: https://help.hopper.com/en_us/why-didn%27t-i-receive-a-notification-about-a-price-change-rJxqIYutP

Repository evidence:

- `Reese-max/ai-flight-radar@6228138337f950cb6399088c4f814f27a518e29e`
- `README.md`
- `docs/ROADMAP.md`
- Issues #1, #4, #6, #8
- Open PRs #9, #10, #11
- Prior radar: `docs/competitive-intelligence/2026-09-15T220016Z-external-radar.md`
- Issue-quality rule: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md@8167e10798071d2276addaff6b201c6b0e904a2a`

## What Changed

- No `ai-flight-radar` default-branch product change since the prior dedicated external-radar inspection; HEAD remains `6228138337f950cb6399088c4f814f27a518e29e`.
- Fresh accessible owner inventory is now 41 repositories / 40 unarchived; this round did not reuse the 2026-09-15 count as current truth.
- New external evidence since the prior AI Flight Radar radar: Duffel's Meta Muse integration makes agent-native flight transactions an external infrastructure pattern; first-party Duffel API semantics provide a concrete model of short-lived transaction-valid offers and re-fetch-before-action.
- These signals **narrow** rather than expand the recommended product: preserve evidence/historical/tracking differentiation; do not build booking infrastructure.
- No new actionable root cause passed all four gates.

## Classification / scope calibration

- Historical issue titles such as `#1 [Research][P1]` and `#8 [P1][Architecture]` are not automatically treated as quality-v2 confirmed P1 product defects. This radar separates research urgency from demonstrated severity and does not rewrite active historical Issues merely for label hygiene.
- #6 remains a source-confirmed P2 capacity/contract mismatch, with active remediation scope in PR #9. This radar does not claim runtime cadence proof.
- Missing live provider evidence remains a validation/research gate and does not by itself prove current quotes are wrong.

## Completion / gaps / cursor

Completed:

- re-read current quality gate and recorded blob SHA;
- fresh owner inventory pagination;
- current repo HEAD/README/roadmap and prior radar review;
- current issue/PR scope review sufficient to avoid duplicate/active-scope writes;
- public-web exploration across direct competitors, adjacent agent/travel infrastructure and provider/API lifecycle;
- explicit opportunity/rejection map and four-gate disposition;
- no unapproved product/implementation mutation.

Gaps intentionally left open:

- no live Taiwan-origin provider query;
- no independent price/handoff comparison;
- no provider cost/rate/retention-terms evaluation;
- no proof of Duffel Taiwan/Japan coverage or suitability;
- no real alert-user research;
- no booking or purchase test.

**Next fair external-radar cursor: `Reese-max/academic-mcp`.**
