# External Competitive / New-Product / Workflow Radar — 2026-09-15T22:00:16Z

## Scope, rules, and evidence boundary

- Owner scope: `Reese-max` only; no third-party repository was modified.
- Issue-quality rule: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality-rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh owner pagination: **42 owned repositories; 39 unarchived**. Archived and excluded from active scope: `gemini-deidentifier`, `openab`, `obsidian-vault`.
- Prior external-radar cursor: `ai-flight-radar`; this round processed that product deeply.
- Current `ai-flight-radar` default branch: `main`; HEAD inspected: `6228138337f950cb6399088c4f814f27a518e29e`.
- No product source, CI/config, secrets, permissions/settings, implementation branch, merge, deploy, worker, GOAL, paid request, booking, or production data was changed.
- No live flight search or booking-handoff experiment was executed by this radar. Provider/booking fidelity remains `NEEDS_RUNTIME_VERIFICATION` where applicable.
- This radar does **not** declare portfolio CLEAN.

### Fresh unarchived owner inventory

`exam-archive`, `police-exam-practice`, `police-exam-archive`, `92-duty-scheduler`, `UkePack`, `ppt-studio`, `voice-actress`, `taiwan-intel-dashboard`, `autodev-ng`, `flux-image-gen`, `claude-mem`, `lobsterpulse`, `prompt-autoresearch`, `neciken-summer-poem`, `note-filler`, `lplrs-judicial-sync`, `adng-memory`, `cyber-prep-coach`, `cf-ai-router`, `avatar-vfo`, `project-doctor-web`, `minideck`, `chatgpt-dual-pipeline`, `internship-notes-sites-mirror`, `taichung-police-intel`, `soundbox-offline`, `skill-foundry`, `video-timeline-pipeline`, `ai-novel-workstation`, `clinical-scribe-worker`, `MaterialYouNewTab`, `cf-mcp-server`, `tick-stock-panel`, `herdr-skills`, `ninax-line-hermes`, `ai-flight-radar`, `academic-mcp`, `spotify-playlist-organizer-mcp`, `google-maps-personal-mcp`.

Previous classification remains the working scope unless repository evidence changes: 36 product-like plus 3 support/compatibility-only (`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`). This round did not reclassify unrelated repositories.

## Product direction re-read — AI Flight Radar

Repository/product-board evidence continues to define AI Flight Radar as an **evidence-oriented Taiwan-origin fare observation product**, not a booking platform. The core job is to observe a stable query over time, show source/freshness/history, and say when evidence is insufficient. Current owner direction is `INVEST / SIMPLIFY`: keep a bounded truthful fare radar; repair validation, capacity and quote/handoff evidence before provider-default expansion. Booking, payments, hotel search, multi-tenant travel SaaS and a general MCP travel platform remain out of scope.

Current source truth at HEAD:

- seed plan is the full 4 origins × 12 destinations = **48-route matrix**;
- successful/empty tasks still reschedule at **+6 hours**;
- scheduled collector runs twice/hour (`17,47`) and executes at most **3 tasks/run**;
- therefore the existing #6 arithmetic defect remains: 48 routes / 6h requires 8 task claims/hour while planned capacity is 6/hour;
- #7's stale six-task test has been fixed in source and Issue #7 is now closed; that does not close #6;
- Fli phase 1 exists as an optional provider path, but current product direction still requires bounded calibration before a provider-default switch.

The newest scheduled run inspected at HEAD (`35018556246`, 2026-09-15T20:16Z) reached a GitHub runner and failed at `Run a bounded batch`. This radar did not retrieve or infer the root cause from that failure, so it is not used as proof of #6, quote inaccuracy, or an upstream outage.

## Executive decision

**0 new Issues. 1 existing Issue received a narrow evidence/scope calibration:** `Reese-max/ai-flight-radar#6`.

The external evidence supports a **smaller** solution than “raise the collector budget until 48 routes fit six hours.” Mature travel products explicitly separate broad discovery freshness from current-search and tracked-route freshness. Therefore the first product decision should be: what freshness promise does AI Flight Radar's broad 48-route discovery matrix actually need to make? Then satisfy that promise using existing knobs before increasing upstream request pressure.

This does **not** copy another product's numeric SLA and does not authorize implementation.

## External Signals

### A. Direct competitor / major strategy — Google moves confirmed price tracking into conversational travel

**CONFIRMED — Google, published 2026-08-27; checked 2026-09-15 UTC.**

Source: https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/

Google AI Mode now lets a traveler describe a flight intent conversationally, inspect current options, explicitly confirm “track these flight prices,” and then receive price-change email. Google also added points/miles rates and began hotel booking inside AI Mode.

**Job-to-be-Done:** preserve a travel intent and move from exploration to monitoring without re-entering the same constraints.

**Manual step removed:** search intent → tracking no longer requires rebuilding the search in a separate alert form.

**Distribution/onboarding signal:** tracking is embedded directly in the existing conversational Search surface rather than introduced as a separate product.

**Transfer to AI Flight Radar:** the search → explicit-confirmation → durable-watch principle is already represented by existing #4. No duplicate Issue is justified.

**Do not copy:** points/miles aggregation, hotel checkout, Google Pay, broad itinerary commerce or autonomous booking. Those add merchant/integration scope unrelated to the current evidence-radar north star.

### A2. Direct competitor — KAYAK uses different freshness contracts for discovery versus tracking

**CONFIRMED current first-party capability; page update date not exposed, checked 2026-09-15 UTC.**

Sources:
- https://www.kayak.com/c/help/search/
- https://www.kayak.com/c/help/pricing/

KAYAK Explore explicitly presents broad destination-discovery fares as **recent snapshots found in the last 48 hours**, warns they are not guaranteed, and sends the user to “Check flight prices” / “See flights” for a current search. KAYAK Price Alerts use a different workflow: most alerts refresh daily, with optional real-time significant-change alerts.

**Job-to-be-Done:** broad inspiration can tolerate older but transparent observations; a decision/alert path requires a fresher, narrower contract.

**Manual step reduced:** users browse recent broad evidence first, then promote a chosen route/date into current search or monitoring rather than refreshing every possible route at transaction-level cadence.

**Transferable principle:** `broad discovery snapshot != current search != durable watch != final bookable fare`.

**Critical limitation:** KAYAK's exact 48-hour number is its own design choice. It is not evidence that 48 hours is correct for AI Flight Radar.

### A3. Direct competitor — Skyscanner turns a saved result into a price alert

**CONFIRMED — current Saved/Price Alert product; help page updated 2026-03-20, checked 2026-09-15 UTC.**

Sources:
- https://www.skyscanner.net/flights/advice/get-best-air-fares-skyscanner-price-alerts
- https://help.skyscanner.net/hc/en-us/articles/115002499829-How-do-I-set-up-or-cancel-email-price-alerts

Skyscanner can automatically track a saved flight and lets users manage alerts from account/app surfaces. This reinforces the already-tracked #4 promotion workflow but does not provide new evidence for another Issue.

## New Releases / capability changes

| Date / check | Product | Change | AI Flight Radar implication |
|---|---|---|---|
| 2026-08-27 | Google AI Mode / Flights | conversational flight-price tracking after explicit confirmation; points/miles; hotel booking rollout | Search→watch promotion is mainstream; booking/rewards breadth remains out of scope |
| checked 2026-09-15 | KAYAK | Explore uses recent snapshot semantics while alerts/search use separate freshness behavior | Strong evidence for explicit freshness classes instead of one cadence for all routes |
| 2026-03-20 / checked 2026-09-15 | Skyscanner | saved/search state can become a managed price alert | Same fingerprint as #4; no new Issue |
| checked 2026-09-15 | Scrappa Google Flights Date Range API | v2 progresses through a range via separate paid calls using `next_departure_date` | “Flexible/range” can still multiply upstream calls; preserve explicit query budgets |

## B. Adjacent workflow — tiered freshness before architecture expansion

KAYAK's Explore → current search → Price Alert sequence is the most useful adjacent design pattern this round. It is not interesting because KAYAK has more features; it is interesting because it prevents one expensive freshness requirement from leaking across every stage of the user journey.

For AI Flight Radar the smallest transferable shape is:

`broad route discovery observation (aged visibly)`
`→ user chooses route/date`
`→ current/revalidated search`
`→ optional future WatchSpec promotion (#4)`
`→ alert receipt`
`→ booking handoff recheck`

This can be implemented, if owner-approved later, using existing route/task/snapshot primitives. It does not require a new scheduler, queue, database, registry or service.

## C. Emerging tool / technical possibility — “date range” is not necessarily one upstream operation

**CONFIRMED vendor capability, update date UNKNOWN, checked 2026-09-15 UTC.**

Source: https://scrappa.co/docs/google-flights-api/google_flights_date_range

Scrappa's v2 date-range endpoint currently searches one `from_date` per request and returns `next_departure_date` for a separate paid request to continue through the range. The vendor states one credit per request.

This is not independent performance evidence and is not a recommendation to adopt Scrappa. The transferable technical signal is narrower: UI/API surfaces called “date range” or “flexible search” can hide N upstream operations. AI Flight Radar should continue treating request/query expansion as an explicit bounded plan rather than assuming one user intent equals one upstream call. Existing #8 already contains that requirement, so no new Issue is justified.

## Community Pain

### Flexible-date alert inconsistency

**COMMUNITY_SIGNAL — Reddit / r/Flights, 2026-06-30; checked 2026-09-15 UTC.**

Source: https://www.reddit.com/r/Flights/comments/1ujdb68/google_flights_track_prices_without_date/

A small discussion reports inconsistent availability of Google's “any dates” tracking and uncertainty around filters/city pairs. This is anecdotal, not prevalence evidence. It supports the existing #4 decision to make unsupported/ambiguous flexible constraints reviewable rather than silently widening them.

### Price-band freshness uncertainty

**COMMUNITY_SIGNAL — Reddit / r/SideProject, 2026-09-14; checked 2026-09-15 UTC.**

Source: https://www.reddit.com/r/SideProject/comments/1wg6gwd/111_departures_priced_against_googles_own_range/

A project author reports route samples where live-looking fares sometimes sit outside Google's displayed historical range and speculates that some ranges may lag. The sample/method is not independently validated and is **not** used as an error-rate claim. It only reinforces #1's existing requirement that observed fare, historical baseline and booking truth remain separate evidence layers.

No community item passed the gate for a new Issue.

## Opportunity Map — AI Flight Radar

### MUST MATCH

- Show source, observation time, route/date/currency/stops and freshness explicitly.
- Keep `NO_RESULTS`, provider error, stale/unknown, observed fare and final bookable fare distinct.
- Make every advertised refresh contract mathematically sustainable under the bounded request budget.
- Reconfirm a selected fare before treating a broad-discovery snapshot as booking evidence.
- Keep flexible-date/query expansion bounded and observable.

### SHOULD BE BETTER

- State the freshness class of broad discovery separately from explicit current lookup and future watches.
- Prefer reducing unnecessary refresh work before raising upstream budgets.
- Surface degraded coverage/age rather than a generic healthy heartbeat.
- Reuse existing task/snapshot semantics instead of adding a parallel scheduling layer.

### DIFFERENTIATOR

- Taiwan-origin focus with explicit evidence thresholds and honest unknown/stale states.
- Owner-controlled local/Cloudflare collection without fabricated demo fares.
- Historical-deal claims that require enough prior observations rather than opaque “cheap” badges.
- A future reviewed WatchSpec path (#4) that can preserve exact constraints without becoming an autonomous travel agent.

### ADJACENT IDEA

- A lightweight `freshness class` product contract: broad discovery vs current check vs durable watch. This is a semantics/config decision first, not a framework.
- If later user evidence supports it, show why a route is stale/degraded and offer an explicit current recheck rather than refreshing the entire matrix more often.

### DO NOT COPY

- KAYAK's exact 48-hour Explore SLA without Reese-max evidence.
- Google AI Mode hotel booking, rewards/miles commerce or autonomous purchase flows.
- Unbounded flexible-date explosion.
- Raising request/cost ceilings simply to preserve an arbitrary six-hour matrix cadence.
- A new scheduler/priority-queue/database service for #6.
- More provider breadth before current source admission/capacity contracts are stable.

## Four-gate decision — #6 capacity/freshness calibration

### 1. Problem / value

**Current observable problem:** at HEAD `6228138337f950cb6399088c4f814f27a518e29e`, the broad seed catalog remains 48 routes, successful/empty tasks return after six hours, and planned schedule capacity remains six tasks/hour. The zero-error demand is eight/hour.

**User affected:** operators/users relying on the broad matrix to satisfy its documented freshness promise.

**Counterevidence / existing alternatives:** the product does not need transaction-grade freshness for every discovery route merely because competitors can search broadly. Current systems already expose observation time and have an explicit recheck/handoff boundary. External products demonstrate that discovery and tracking can legitimately use different freshness semantics.

**Do-nothing consequence:** the stated six-hour broad-matrix contract remains impossible under the configured normal capacity.

### 2. Priority

Unchanged:

```yaml
issue_quality_version: 2
kind: BUG
severity: P2
evidence: SOURCE_CONFIRMED
triage: NEEDS_REVIEW
auto_implementation: false
```

No external competitor evidence upgrades this to P1. No production route-age distribution was measured this round.

### 3. Minimum solution order

Evaluate in this order:

1. Decide/document the freshness promise for the **broad discovery matrix**.
2. Prefer an existing knob: lengthen `next_run` enough to satisfy that promise at current bounded capacity.
3. If the 48-route breadth itself is not owner-required, reduce the broad route set instead.
4. Only if real product evidence requires both full breadth and tighter freshness, explicitly authorize and then raise bounded capacity with cost/upstream constraints.

Why not smaller? Documentation alone cannot close a source-confirmed arithmetic mismatch while checked-in defaults still promise an impossible cadence.

Why not bigger? No evidence requires a new queue/scheduler/database/framework. Existing primitives already contain route, `next_run`, claim budget and observation timestamps.

### 4. Research / implementation separation

This radar did not implement any option. #6 remains `NEEDS_REVIEW`. The external evidence only narrows the preferred decision order.

## Cross-portfolio idea

### Discovery snapshot ≠ current verification

This principle may be reusable where Reese-max products maintain broad cached/searchable evidence: broad discovery can have an explicit age contract, while consequential action requires a narrower current verification. This is a product/evidence principle, **not** authorization for a shared “freshness framework” or cross-repository service.

No cross-portfolio Issue was created.

## Rejected / deferred ideas

1. **Raise collector capacity to ≥8/hour as the default #6 fix — REJECT as first move.** It solves arithmetic by spending more upstream work before proving six-hour broad freshness is user-required.
2. **Copy KAYAK Explore's 48-hour number — REJECT.** Market evidence validates tiered semantics, not Reese-max's exact SLA.
3. **Build a new scheduler/priority queue — REJECT.** Existing primitives are sufficient for the current defect.
4. **Add rewards/miles tracking — DEFER/REJECT for current scope.** Google now supports it, but there is no Reese-max repo/user evidence that loyalty-currency tracking is a core job.
5. **Add hotel booking / payments — REJECT by owner scope.** Directly conflicts with current product direction.
6. **Open another flexible-price-alert Issue — DUPLICATE.** Existing #4 already tracks reviewed intent → WatchSpec promotion and flexible constraints.
7. **Adopt Scrappa as another provider now — DEFER.** Current provider admission, capacity and Fli calibration are higher priority; vendor docs alone are insufficient.
8. **Treat the latest scheduled batch failure as a new regression — REJECT without root-cause evidence.** The run failed at the bounded batch step, but no causal log was used here.

## Issue Mapping

| Issue | This round | Reason |
|---|---|---|
| `ai-flight-radar#6` | **UPDATED** with new external evidence and smaller-fix ordering | Same capacity/freshness fingerprint; no duplicate |
| `ai-flight-radar#7` | observed **closed/completed** | current HEAD fixes catalog-derived 48-route test; no radar write needed |
| `ai-flight-radar#4` | no write | Google/Skyscanner alert signals map to existing WatchSpec fingerprint |
| `ai-flight-radar#1` | no write | community price-band anecdote adds no independent provider-fidelity result |
| `ai-flight-radar#8` | no write | bounded flexible-query work already exists; provider expansion remains gated |

Issue #6 coordination evidence before write:

- complete Issue comments were empty before lock;
- all-state PR collection returned none;
- current branch list contains only historical feature/fix branches plus `main`, with no #6 implementation branch;
- no current repo-linked owner heartbeat/GOAL evidence was found through available repository search;
- `github-issue-lock:v1` lease was added and read back before the evidence comment;
- no implementation or worker run was started.

## Sources

### First-party / current product

- Google AI Mode travel update — 2026-08-27: https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/
- KAYAK Search & Discovery — current, checked 2026-09-15: https://www.kayak.com/c/help/search/
- KAYAK Pricing & Price Alerts — current, checked 2026-09-15: https://www.kayak.com/c/help/pricing/
- Skyscanner Price Alerts Help — updated 2026-03-20: https://help.skyscanner.net/hc/en-us/articles/115002499829-How-do-I-set-up-or-cancel-email-price-alerts
- Skyscanner Saved / Price Alerts — current, checked 2026-09-15: https://www.skyscanner.net/flights/advice/get-best-air-fares-skyscanner-price-alerts

### Emerging vendor/tool signal

- Scrappa Date Range Search — update date UNKNOWN, checked 2026-09-15: https://scrappa.co/docs/google-flights-api/google_flights_date_range

### Community / anecdotal

- Reddit r/Flights flexible any-date tracking discussion — 2026-06-30: https://www.reddit.com/r/Flights/comments/1ujdb68/google_flights_track_prices_without_date/
- Reddit r/SideProject Google price-range experiment — 2026-09-14: https://www.reddit.com/r/SideProject/comments/1wg6gwd/111_departures_priced_against_googles_own_range/

Community and vendor claims are not treated as prevalence, ROI, accuracy, or adoption statistics.

## What Changed Since Last Radar

- Fair rotation moved from `lobsterpulse` to `ai-flight-radar`.
- Fresh owner inventory remains 42 owned / 39 unarchived.
- `ai-flight-radar` HEAD is now `6228138337f950cb6399088c4f814f27a518e29e`; Issue #7's stale test is closed/completed.
- #6's source-confirmed 48-route / six-hour / six-per-hour capacity mismatch still exists.
- New external evidence from KAYAK materially changes the preferred **smallest-fix order**: first define a truthful broad-discovery freshness class and use existing cadence/route knobs; do not default to increasing request budget.
- Google AI Mode's 2026-08-27 price-tracking flow reinforces #4 but does not justify a duplicate Issue.
- Scrappa's current date-range semantics reinforce explicit bounded query expansion already present in #8.
- New Issues: **0**.
- Existing Issues updated: **1** (#6 evidence/scope calibration only).
- Severity upgrades: **0**.
- Implementation authorizations: **0**.

## Completion, gaps, and next cursor

Completed this round:

- fresh owner inventory/pagination;
- Issue Quality v2 SHA verification;
- current `ai-flight-radar` direction, roadmap, HEAD, issues, PR/branch state and source contract review;
- A direct competitor / B adjacent workflow / C emerging technical exploration using public web as the primary intelligence source;
- one deduplicated existing-Issue evidence calibration;
- central report write.

Gaps / UNKNOWN:

- no live fare or booking-handoff comparison was performed;
- no route-age distribution or provider-call-cost telemetry was measured;
- latest scheduled batch failure root cause is not established;
- no real-user evidence establishes the desired broad-matrix freshness SLA;
- vendor/community claims remain non-independent evidence.

**Next fair-rotation cursor: `academic-mcp`.**
