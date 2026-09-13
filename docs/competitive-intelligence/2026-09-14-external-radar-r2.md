# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-14 r2

## Scope and portfolio truth

This round re-read the current Reese-max owned, unarchived portfolio and recent Issue/PR activity, then used **public web sources outside GitHub as the primary competitive input**. The current working set remains 37 owned + unarchived repositories, with 35 treated as product-like; `adng-memory` and `internship-notes-sites-mirror` remain coordination/support artifacts rather than feature-scored products.

Recent GitHub truth materially affects prioritization: `academic-mcp #9`, `cf-mcp-server #15`, `autodev-ng #28`, `herdr-skills #6`, `lobsterpulse #9`, `clinical-scribe-worker #4/#10`, `lplrs-judicial-sync #1/#5`, `video-timeline-pipeline #18`, and other previously identified gaps now have active PR work. This round therefore does not compete for those fingerprints.

## Product → market map

| Product | Market category |
|---|---|
| exam-archive | exam source archive / study data |
| police-exam-practice | police exam practice / learning |
| police-exam-archive | police exam archive / provenance |
| 92-duty-scheduler | duty roster / scheduling / LINE self-service |
| UkePack | MusicXML → child-friendly ukulele practice pack |
| ppt-studio | AI presentation editor/export |
| voice-actress | grounded legal/evidence QA |
| taiwan-intel-dashboard | multi-source intelligence dashboard |
| autodev-ng | AI SDLC / agent orchestration / governance |
| flux-image-gen | AI image generation/editing |
| claude-mem | persistent coding-agent memory |
| lobsterpulse | monitoring / decision attention queue |
| prompt-autoresearch | prompt optimization / autonomous research |
| neciken-summer-poem | creative writing / contest workflow |
| note-filler | structured notes/forms |
| lplrs-judicial-sync | judicial/public-data sync |
| cyber-prep-coach | iPAS cybersecurity exam coach |
| cf-ai-router | model routing / AI cost control |
| avatar-vfo | role/personality simulation |
| project-doctor-web | project diagnostics / project health |
| minideck | compact slide/deck creation |
| chatgpt-dual-pipeline | multi-model / dual-pipeline workflow |
| taichung-police-intel | public-sector intelligence monitor |
| soundbox-offline | offline/local media player |
| skill-foundry | skill creation/evaluation/distribution |
| video-timeline-pipeline | evidence-to-video / NLE automation |
| ai-novel-workstation | long-form writing workstation |
| clinical-scribe-worker | clinical documentation |
| MaterialYouNewTab | browser new-tab / productivity dashboard |
| cf-mcp-server | MCP/SaaS tool server |
| tick-stock-panel | stock/strategy analysis |
| herdr-skills | agent skills / policy improvement |
| ninax-line-hermes | LINE AI gateway / ordered messaging |
| ai-flight-radar | flight intelligence / fare tracking |
| academic-mcp | scholarly retrieval / research-agent gateway |

# External Signals

## A. Direct competitor recent capability — conversational intent → durable flight watch

### CONFIRMED — Google Search AI Mode, 2026-08-27
Source: https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/

Google moved Google Flights price tracking directly into AI Mode. A traveler describes destination and dates conversationally, sees current options, asks to track the prices, explicitly confirms, and later receives price-change email. Google states the feature is available in more than 180 countries/territories where supported.

**JTBD:** “I already described the trip I care about; keep watching that same intent without making me recreate a tracker.”

**Why it is faster/more reliable:** the interpreted trip constraints become the starting point for monitoring instead of requiring a second form entry.

**Onboarding/distribution:** tracking is embedded inside a high-frequency search/chat surface rather than launched as a separate product mode.

**Automation/integration pattern:** conversation → inspectable result → explicit confirmation → durable background watch → later notification.

**Business-model signal:** Google does not need a separate paid alert product; tracking is a retention feature inside the broader search/travel funnel.

**Limit/complaint:** it still inherits the ambiguity of flexible-date and filter semantics; community reports below suggest “any dates” discoverability/availability remains inconsistent for some searches.

**Reese-max absorption:** use the pattern to promote an already-reviewed deterministic query into a typed `WatchSpec`; do not copy booking/payment/account breadth.

### CONFIRMED — KAYAK Ask AI, 2026-05-14
Source: https://www.kayak.com/news/ask-ai/

KAYAK’s Ask AI keeps conventional real-time flight/hotel/car search results visible while the user refines the trip conversationally. The important transferable principle is not the chatbot itself: **natural-language interpretation remains inspectable against normal filters/results**.

### CONFIRMED — Skyscanner Saved + Price Alerts, current 2026 docs
Sources:
- https://www.skyscanner.net/flights/advice/get-best-air-fares-skyscanner-price-alerts
- https://help.skyscanner.net/hc/en-us/articles/115002499829-How-do-I-set-up-or-cancel-email-price-alerts

Skyscanner turns saved travel objects into durable, manageable alerts. This creates a low-friction promotion boundary from “interesting result” to “monitor this.”

### COMMUNITY_SIGNAL — flexible/custom alert friction
Sources:
- https://www.reddit.com/r/Flights/comments/1ujdb68/google_flights_track_prices_without_date/ — 2026-06-30
- https://www.reddit.com/r/Flights/comments/13wejt6/is_there_a_price_alert_website_for_people_with_a/ — includes a 2026-07-01 update

Some travelers still ask for “any date / next N months / trip length / below my threshold” alerts and report that flexible tracking controls are inconsistent or difficult to locate. This is anecdotal evidence only, not a prevalence estimate.

**Result:** created `Reese-max/ai-flight-radar #4` — `[Competitive Inspiration][Research][RESEARCH_REQUIRED] Intent-to-WatchSpec + reviewable price-tracking promotion`.

Opportunity Score: **93/100**.

Core flow:
`NaturalLanguageIntent → ParsedCandidate → UserReview → Canonical WatchSpec → PromotionReceipt → Scheduled Evaluation → AlertDecisionReceipt`

Hard dependency: `ai-flight-radar #1` live quote/source-fidelity calibration remains ahead of runtime activation. No public/scheduled external querying is authorized by #4.

## B. Adjacent transferable workflow — offline should be a first-class data plane, not a broken online UI

### CONFIRMED — Plexamp 4.50.3, 2026-09-01
Source: https://forums.plex.tv/t/plexamp-v4-50-3-ready-or-not/942338

Plexamp’s new Offline switch does not merely show a Downloads folder. It gives downloaded media a real library, Home, search and locally built play queues so the application behaves like the normal product while disconnected. It also removes the prior three-day download ceiling.

**JTBD:** continue using the product’s normal mental model when the network/server disappears.

**Why faster/reliable:** no spinner/server roundtrip is required for downloaded content; local queue construction gives predictable playback.

**Onboarding/distribution:** Offline is a source/state switch in the existing app rather than a separate companion app.

**New mode:** downloaded/local state becomes a canonical queryable subset, not a cache hidden behind a special screen.

**Business-model signal:** users value ownership/local availability enough for Plex to invest in cross-platform download infrastructure; local-first player Trove likewise uses a one-time Pro unlock and no account/cloud upload for owned files (https://troveplayer.com/).

**Limit/community pain:** Plex’s beta forum immediately surfaced Android availability, download and platform-compatibility issues; this is useful evidence that offline parity needs explicit platform verification, not just a feature flag.

**Reese-max absorption:** `soundbox-offline` should preserve local library/search/queue semantics as the primary product model. For other products, “offline” should mean a typed local capability/state with truthful missing-data behavior, not a silent stale copy.

No Issue created this round because this signal needs a fresh repository-specific gap check beyond the portfolio-level baseline before formal scope is justified.

## C. Emerging technology/ecosystem change — browser compatibility windows just halved

### CONFIRMED — Chrome two-week Stable cycle begins with Chrome 153, 2026-09-08
Source: https://developer.chrome.com/blog/chrome-two-week-start
Release confirmation: https://chromereleases.googleblog.com/2026/09/stable-channel-update-for-desktop_0808145027.html

Chrome moved Stable from a four-week to a two-week milestone cadence and explicitly recommends testing against Beta. Chrome 154 Stable is scheduled for 2026-09-22. Chrome 153 also shipped a very large security-fix set.

**JTBD for developers:** discover browser/runtime regressions before Stable users receive them.

**Why it changes workflow:** the regression detection window is now roughly half as long; manual “test when someone notices” becomes less viable.

**Transferable pattern:** `RuntimeChannel → Compatibility Fixture → Beta/Stable Receipt → Supported/Blocked decision`.

**Reese-max applicability:** highest for `MaterialYouNewTab`, browser-heavy `ppt-studio`, `cyber-prep-coach`, `ai-flight-radar`, dashboards and any project whose acceptance path relies on Chromium/Playwright. This should be a lightweight compatibility receipt, not a portfolio-wide new framework unless repeated breakage proves the need.

No Issue created: this is a major ecosystem change worth recording, but current evidence does not yet prove a distinct user-facing product gap beyond existing CI/browser smoke work.

## C2. Emerging training model — live AI-security systems instead of only reading/quiz content

### CONFIRMED — Immersive Labs AI Red Teaming: Defense Evasion, 2026-09-04
Source: https://support.immersivelabs.com/hc/en-us/articles/50489638598033-September-2026-Release-Notes

The new labs cover guardrail bypass and false-RAG injection mapped to MITRE ATLAS techniques.

### CONFIRMED — TryHackMe AI Security path, current 2026
Source: https://tryhackme.com/aisecurity

TryHackMe markets browser-based “break and defend real systems,” 25 lessons and a 13-scenario AI Security certification.

**Reese-max conclusion:** this is a meaningful cybersecurity-learning market shift, but **DO NOT COPY NOW** into `cyber-prep-coach`. That product is an evidence-backed iPAS exam-prep system with 880 historical questions, provenance gates and exam-specific practice flows. Building a live offensive-security lab platform would be a different product and increase infrastructure/safety scope. A future bounded “concept → safe simulation/explanation” layer may be adjacent, but not until exam learning outcomes show the need.

# New Releases

| Date | Product/ecosystem | Signal | Status |
|---|---|---|---|
| 2026-09-08 | Chrome 153 | two-week Stable cadence begins; Beta testing becomes more time-sensitive | CONFIRMED |
| 2026-09-04 | Immersive Labs | AI Red Teaming: Defense Evasion labs | CONFIRMED |
| 2026-09-01 | Plexamp 4.50.3 | first-class Offline mode, local search/queue, download-limit removal | CONFIRMED |
| 2026-08-27 | Google Search AI Mode | conversational flight-price tracking with explicit confirmation | CONFIRMED |
| 2026-05-14 | KAYAK Ask AI | live conventional travel results stay synchronized with chat | CONFIRMED |

# Community Pain Points

1. **Flexible flight tracking remains awkward** — “any dates,” custom thresholds and long flexible windows are repeatedly discussed. Marked COMMUNITY_SIGNAL only.
2. **Offline parity is hard across platforms** — new Plexamp beta discussions report platform/install/download edge cases immediately after launch. COMMUNITY_SIGNAL; not a defect-rate estimate.
3. **Fast browser cadence increases regression pressure** — this is an ecosystem implication inferred from Google’s official cadence change; actual Reese-max breakage rate is UNKNOWN until Beta-channel receipts exist.

# Adjacent Ideas

1. **Promotable typed intent**: search/filter intent should become a durable versioned watch/job only after explicit review.
2. **Offline as queryable canonical subset**: local data should preserve normal browse/search/queue semantics, with availability state explicit.
3. **Beta-channel runtime receipts**: compatibility should be measured against the next runtime before it becomes Stable.
4. **Safe simulation instead of infrastructure-heavy labs**: exam products can borrow scenario reasoning without becoming offensive lab platforms.
5. **One-action promotion**: Saved/result objects can become background monitoring objects without re-entry, but promotion must remain inspectable and reversible.

# Opportunity Map

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| exam-archive | source/version truth | faster historical lookup | provenance-first exam corpus | attempt/review handoff | generic AI tutor sprawl |
| police-exam-practice | exam-faithful practice | misconception feedback | source-backed explanations | distractor-quality eval | unrelated gamification |
| police-exam-archive | immutable source lineage | cross-year comparison | rights/provenance receipts | attempt ledger | unverified mirrors as truth |
| 92-duty-scheduler | rules/compliance | repairable conflicts | explainable RepairPlan | reviewed NL schedule-change candidate | autonomous schedule publish |
| UkePack | correct MusicXML mapping | child-readable output | evidence-preserving practice pack | teacher correction candidate | opaque full-score regeneration |
| ppt-studio | native editability | touched-object precision | render + structure verification | browser Beta rendering receipt | rasterize-everything AI decks |
| voice-actress | citation/evidence grounding | counterevidence visibility | claim→authority trace | conflict set | uncited legal prose |
| taiwan-intel-dashboard | fresh multi-source evidence | contradiction surfacing | provenance receipts | counterevidence lane | opaque “AI confidence” |
| autodev-ng | least-authority effects | typed receipts | principal/environment/effect separation | shared runtime compatibility receipts | monolithic trusted-agent flag |
| flux-image-gen | repeatable edit intent | reference management | creative edit session | versioned edit receipt | hidden destructive overwrite |
| claude-mem | source-backed memory | temporal truth | stale/invalidated memory state | recall receipt | “remembered = current truth” |
| lobsterpulse | deduplicated attention | decision-only surfacing | explainable attention queue | watch promotion primitive | notify on every repeated signal |
| prompt-autoresearch | holdout/stability | shorter deployable prompts | Pareto complexity gate | compaction candidates | endless additive prompt patches |
| neciken-summer-poem | contest constraints | revision trace | author-controlled creative workflow | candidate revision diff | mass-generation spam |
| note-filler | field/schema truth | preserve manual edits | typed form mutation | reviewed preference learning | free-form overwrite |
| lplrs-judicial-sync | source/takedown truth | deletion propagation | verifiable erasure/coverage receipts | tombstone lifecycle | “deleted from UI = erased” |
| cyber-prep-coach | iPAS exam fidelity | adaptive review | provenance-gated question corpus | safe scenario reasoning | full offensive cyber-lab platform |
| cf-ai-router | cost/provider truth | cache-aware costing | typed UsageCostReceipt | route-cost forecast | hidden provider substitution |
| avatar-vfo | scoped persona state | provenance on traits | explicit simulation boundary | revision/consent receipt | impersonation as authority |
| project-doctor-web | diagnostic reproducibility | actionable repair plan | evidence-backed project health | runtime-specific fixtures | auto-fix without review |
| minideck | editable slide structure | export fidelity | compact deterministic deck | structured slide patch | image-only slides |
| chatgpt-dual-pipeline | source/model separation | disagreement visibility | dual-evidence handoff | conflict receipt | majority-vote-as-truth |
| taichung-police-intel | public-source freshness | entity/event dedupe | police-use evidence trace | counterevidence lane | unsupported operational claims |
| soundbox-offline | real offline playback | offline search/library parity | local-first/no-account path | Plexamp-style first-class offline source | cloud dependency for local files |
| skill-foundry | evaluable skills | demo-to-candidate intake | promotion + security/runtime receipts | correction compaction | recording = certified skill |
| video-timeline-pipeline | deterministic source ranges | target capability probing | NLE read-back receipt | native target apply | rebuild full NLE |
| ai-novel-workstation | canon/story state | controlled revisions | agent-facing story workspace | compact memory/state diff | unconstrained rewrite-all |
| clinical-scribe-worker | factual/section integrity | repair one section safely | validation packs + edit preservation | scoped preference learning | auto-sign clinical notes |
| MaterialYouNewTab | browser compatibility | Beta-channel warning | local-first productivity dashboard | Chrome cadence compatibility receipt | browser-specific hacks without fallbacks |
| cf-mcp-server | stable tool contracts | semantic drift detection | ToolContractManifest | client reapproval receipt | server identity = permanent authority |
| tick-stock-panel | deterministic strategy truth | safe sandbox boundaries | NL→StrategyDef | candidate order analysis only | live autonomous trading |
| herdr-skills | correction provenance | scoped promotion | correction→candidate pipeline | complexity/compaction gate | one correction = global policy |
| ninax-line-hermes | ordered/revision-safe messaging | redelivery idempotency | message lifecycle receipt | room-scoped task state | reply side effects from stale events |
| ai-flight-radar | quote/source truth | flexible watch UX | reviewed Intent→WatchSpec | one-action durable watch promotion | auto-book/payment or silent scope widening |
| academic-mcp | source-specific semantics | progressive tool discovery | selection eval + research bundle | counterevidence lane | semantic-similarity provider substitution |

# Opportunity Scores

| Candidate | Score | Decision |
|---|---:|---|
| ai-flight-radar — Intent→WatchSpec promotion | **93** | **CREATE #4**; runtime blocked by #1 |
| cross-portfolio — Browser Beta compatibility receipt | 86 | research list; wait for repo-specific failure evidence |
| soundbox-offline — first-class offline data plane parity | 85 | research list; perform deeper repo gap check first |
| cyber-prep-coach — hands-on AI-security labs | 62 | reject as current scope; adjacent pattern only |
| portfolio — generic AI chat added to every product | 38 | reject |

# Top 10 Cross-Portfolio Ideas

1. **Promotable typed intent** — transient user intent becomes a durable job/watch only through explicit review + receipt.
2. **Runtime compatibility receipts** — Beta/next-runtime evidence becomes a first-class release input where runtime cadence is fast.
3. **Offline as a canonical capability state** — `ONLINE / LOCAL_COMPLETE / LOCAL_PARTIAL / UNAVAILABLE`, not fake parity.
4. **Semantic preservation on promotion** — intent/search state hashes should survive handoff into watches, schedules, forms or automation.
5. **One-action promotion without hidden authority escalation** — fewer steps does not mean broader permissions.
6. **Versioned alert/job specs** — historical notifications must resolve to the exact rules that produced them.
7. **Bounded expansion plans** — flexible dates/destinations/provider searches need explicit request/cost budgets.
8. **Result + conventional controls together** — conversational interpretation should stay inspectable against typed filters/state.
9. **Safe scenario learning over product scope creep** — borrow reasoning patterns without rebuilding competitors’ heavy infrastructure.
10. **Evidence before trend adoption** — Chrome cadence, new agent surfaces and new labs trigger compatibility/research gates, not automatic feature creation.

# Ideas Rejected

- **Autonomous flight booking/payment** — conflicts with current product safety boundary and adds merchant/identity/payment scope.
- **LLM-only flight parsing** — deterministic reviewed parsing is already a strength; LLMs may assist only where evidence shows deterministic parsing cannot represent the intent.
- **Enable scheduled/public flight collection now** — blocked by `ai-flight-radar #1` runtime calibration.
- **Build a full AI red-team lab platform inside cyber-prep-coach** — poor strategic fit with iPAS exam preparation.
- **Create a portfolio-wide browser framework immediately** — Chrome cadence is real, but abstractions should follow repeated repo-level need.
- **Treat offline cache as automatically current** — local availability and freshness are separate states.

# Issue Mapping

## Created this round
- `Reese-max/ai-flight-radar #4` — `[Competitive Inspiration][Research][RESEARCH_REQUIRED] Intent-to-WatchSpec + reviewable price-tracking promotion`
- Score: 93/100
- Duplicate search: no matching open/closed WatchSpec / natural-language-to-durable-watch Issue found.
- Lock search: no `github-issue-lock:v1` marker matching this fingerprint found.
- Runtime dependency: #1 remains higher priority; #4 does not enable collection, notification, booking or deployment.

## Not touched because active/duplicate work already exists
- `academic-mcp #9` → active PR #10
- `cf-mcp-server #15` → active PR #16
- `autodev-ng #28` → active PR #29
- `herdr-skills #6` → active PR #8
- `lobsterpulse #9` → active PR #10
- `clinical-scribe-worker #4/#10` → active PR #12/#11
- `lplrs-judicial-sync #1/#5` → active PR #7/#6
- `video-timeline-pipeline #18` → active PR #19

# Sources

## Primary / official or first-party
- Google Search / Travel — 2026-08-27 — https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/
- KAYAK — 2026-05-14 — https://www.kayak.com/news/ask-ai/
- Skyscanner price alerts — current 2026 — https://www.skyscanner.net/flights/advice/get-best-air-fares-skyscanner-price-alerts
- Skyscanner Help — updated 2026 — https://help.skyscanner.net/hc/en-us/articles/115002499829-How-do-I-set-up-or-cancel-email-price-alerts
- Chrome for Developers — 2026-09-08 — https://developer.chrome.com/blog/chrome-two-week-start
- Chrome Releases — 2026-09-08 — https://chromereleases.googleblog.com/2026/09/stable-channel-update-for-desktop_0808145027.html
- Plex Labs / Plex forum release post — 2026-09-01 — https://forums.plex.tv/t/plexamp-v4-50-3-ready-or-not/942338
- Immersive Labs release notes — 2026-09-04 — https://support.immersivelabs.com/hc/en-us/articles/50489638598033-September-2026-Release-Notes
- TryHackMe AI Security — current 2026 — https://tryhackme.com/aisecurity
- Trove Player — current 2026 — https://troveplayer.com/

## Community / anecdotal only
- Reddit r/Flights — 2026-06-30 — https://www.reddit.com/r/Flights/comments/1ujdb68/google_flights_track_prices_without_date/
- Reddit r/Flights — older thread with 2026-07-01 update — https://www.reddit.com/r/Flights/comments/13wejt6/is_there_a_price_alert_website_for_people_with_a/
- Plex Labs beta discussion attached to the first-party release thread — community reports used only as regression hypotheses.

# What Changed Since Last Radar

1. **New formal opportunity:** `ai-flight-radar #4` converts reviewed natural-language search intent into a versioned durable `WatchSpec` without duplicate entry.
2. **New product principle:** `Parsed Intent ≠ Approved Watch ≠ Collector Authority ≠ Triggered Alert ≠ Delivered Notification`.
3. **New adjacent pattern:** Plexamp demonstrates that offline can be the same product backed by a local data plane, not a crippled Downloads screen.
4. **New ecosystem constraint:** Chrome’s two-week Stable cadence makes Beta-channel compatibility evidence materially more valuable for browser-heavy Reese-max products.
5. **New explicit rejection:** hands-on AI red-team labs are a real training-market trend, but copying them into the iPAS-focused `cyber-prep-coach` would be scope expansion rather than a justified competitive gap.
6. No product source code, implementation branch, merge, deployment, secrets, permissions or repository settings were modified in this radar run.