# External Competitive / Product / Workflow Inspiration Radar — 2026-09-11 r4

> Scope: Reese-max owned, unarchived repositories that can reasonably be treated as products. Public web outside GitHub is the primary market source. GitHub is used to map product state/recent changes, inspect Competitive Gap / Feature / Research Issues and PRs, apply duplicate/lock rules, file evidence-backed opportunities, and preserve this report.
>
> Evidence labels: **CONFIRMED** = first-party product/docs/release information or directly inspectable current repository state; **LIKELY** = supported product inference requiring runtime/user validation; **COMMUNITY_SIGNAL** = anecdotal user/developer report; **UNKNOWN** = insufficient evidence / must be measured.
>
> Execution boundary: no product source code, implementation branch, merge, deploy, production credentials/secrets, permissions, network/IAM settings, or repository settings were changed.

---

## Executive Summary

This round found one new high-value opportunity and one material scope correction.

1. **The product portfolio is now 37 unarchived product-like repositories, not 35.** Two recently created repositories — `academic-mcp` and `ai-flight-radar` — were absent from r3's portfolio map and are included from this round onward.
2. **`academic-mcp` has a high-value gap after source aggregation but before durable research state:** it already preserves 81 upstream tools + 7 prompts across arXiv, multi-source search and Semantic Scholar, but cross-source paper identity, source-health provenance, research bundle revisions and replay/diff are still largely left to the caller/agent.
3. Recent external research products converge on exactly this next layer:
   - Scite (2026-09-09) added MCP citation-graph traversal and (2026-09-01) improved DOI recognition to avoid silently dropped references.
   - Elicit (2026-08-31) made research sessions/artifacts/version history collaborative and persistent.
   - ResearchRabbit (2026-07-09) explicitly separated "interesting candidate" from "saved collection" through Reading List.
   - Cito, a 2026 agent-oriented academic search product, exposes corpus freshness and attribution on responses and was built specifically around the rate-limit failure mode seen in agent research.
   - Semantic Scholar's own API documentation makes availability/rate limiting a first-class operational reality.
   - Paperpile's Ask AI reduces PDF handoff friction but still requires copy/paste to save an AI response back as a note — a concrete cross-tool state-loss seam.
4. **Action this round:** created `Reese-max/academic-mcp #1` — `[Competitive Inspiration][Research][RESEARCH_REQUIRED] 建立 Canonical Paper Identity + Research Bundle Ledger，跨來源去重並保留可重播研究證據` — Opportunity Score **93/100**.
5. `ai-flight-radar` also has fresh market validation: Google put Google Flights price tracking directly inside AI Mode on 2026-08-27, while current traveler discussions continue to expose stale-fare, multi-origin and flexible-route friction. However its repository already tracks NLP correctness, alerting, evidence-based quote snapshots, source health, a second independent source, total-price semantics and pre-booking reconfirmation. **No new Issue was filed**; the correct next step is to finish those existing gaps before adding more surface area.

Cross-portfolio principle added this round:

`Source result ≠ canonical entity; source failure ≠ zero result; discovery candidate ≠ accepted evidence; research session ≠ chat history.`

Reusable lifecycle:

`Research/Monitoring Intent → SourceObservation[] → Canonical Identity Candidate → Conflict-aware Resolution → Candidate Set → Explicit Inclusion → Versioned Bundle/WatchSpec → Refresh → Diff → Receipt`

---

## What Changed Since Last Radar

### Portfolio scope corrected: 35 → 37

GitHub owner inventory currently contains 40 Reese-max repositories; three are archived, leaving **37 unarchived repositories that can reasonably be treated as products**. r3 covered 35. The two newly included repositories are:

- `academic-mcp` — private multi-source academic research gateway / MCP.
- `ai-flight-radar` — Taiwan-origin airfare quote intelligence, historical observation and low-fare alert prototype.

This correction matters because both repositories already contain meaningful product logic and current work, not empty experiments.

### New repository changes checked

**CONFIRMED — `academic-mcp`**
- 2026-09-11: deployed academic MCP gateway with pinned upstream sources.
- 2026-09-11: recovery workflow added; Semantic Scholar SDK retry behavior changed so real HTTP 429 can surface promptly rather than stalling/retrying and later looking like empty data.
- 2026-09-11: real ChatGPT query evidence recorded; Semantic Scholar key application prepared.
- Current contract preserves **81 tools + 7 prompts**, namespaced by upstream rather than replacing them with a simplified fake-unified API.

**CONFIRMED — `ai-flight-radar`**
- 2026-09-10: initial product release.
- 2026-09-11: deal scoring changed to evidence-based scoring and radar execution hardened.
- Current implementation uses one actual fare source, rule-based intent parsing, SQLite snapshots, local task leases and ntfy/Telegram alerts; it deliberately avoids fabricated market averages and automatic purchasing.

**CONFIRMED — existing 35-product portfolio**
- No post-r3 repository change overturned the major current directions already tracked by earlier radars. The strongest net-new external evidence in this round applies to the two newly included products and to the reusable evidence/provenance primitives they expose.

---

## Product → Market Category / Current Focus

| Repository | Market / product category | Current focus used in r4 |
|---|---|---|
| `cf-ai-router` | Multi-provider AI gateway / routing | Lifecycle registry, truthful fallback/cost/capability gates; provider/source state should remain explicit. |
| `soundbox-offline` | Local-first offline audio PWA | Local import/dedupe/library simplicity; share/import entry points before cloud breadth. |
| `police-exam-archive` | Police exam archive / source corpus | Canonical source/revision integrity and archive→practice handoff. |
| `skill-foundry` | Agent skill evaluation / promotion | Candidate→risk-tier eval→promotion→receipt; do not let discovered skill mint authority. |
| `prompt-autoresearch` | Prompt/model experiment research | Reproducible experiments, model drift and comparable evidence bundles. |
| `lobsterpulse` | Product / market intelligence | Freshness, dedupe, changed-since-last-run and source reliability. |
| `tick-stock-panel` | Self-hosted quantitative research workstation | Read-only research truth, timestamped data and reproducible screens. |
| `clinical-scribe-worker` | Clinical drafting / scribe research | Section-scoped repair/revision receipts; authentication blocker remains higher priority. |
| `adng-memory` | Agent memory governance | Provenance/admission/quarantine/staleness/deletion/poisoning. |
| `avatar-vfo` | Persona / character simulation | Bounded continuity and versioned persona state. |
| `note-filler` | Evidence-backed note augmentation | Candidate patch, exact evidence, approval and stale-input handling. |
| `taiwan-intel-dashboard` | Public-source Taiwan intelligence dashboard | Public-source provenance, change detection and read-only agent distribution. |
| `cyber-prep-coach` | iPAS cybersecurity exam preparation | Trusted corpus, explanation calibration and mastery evidence before more AI modes. |
| `UkePack` | Music-education worksheet generator | Human source→reversible candidate transformation→export. |
| `autodev-ng` | Multi-engine coding-agent orchestrator | Principal/credential/effect/reliability control plane; no new implementation breadth while regression gate is red. |
| `ai-novel-workstation` | Local-first AI fiction production workstation | Canonical story state, revision/resume and reversible AI suggestions. |
| `herdr-skills` | Reflective coding-agent rules/skills | Correction/repeated workflow→candidate rule/skill→independent validation. |
| `video-timeline-pipeline` | Evidence-backed video understanding/editing handoff | Evidence→CandidateCutList→NLE handoff→runtime verification. |
| `chatgpt-dual-pipeline` | De-identified notes publishing pipeline | One-way source/publish boundary and de-identification evidence. |
| `claude-mem` | Coding-agent memory | Memory provenance/authority separation and bounded recall. |
| `lplrs-judicial-sync` | Taiwan judicial corpus sync | Exact authority revision/span/removal truth; cross-source identity can later reuse observation-ledger pattern. |
| `internship-notes-sites-mirror` | Static downstream mirror | Deterministic one-way mirror; no duplicate agent state. |
| `MaterialYouNewTab` | Browser new-tab / productivity workspace | Local workspace/session capture, unified retrieval and minimal permissions. |
| `taichung-police-intel` | Public-source local-government/police intelligence | Evidence contract exposed through UI/MCP/WebMCP without creating a second truth store. |
| `ninax-line-hermes` | LINE AI assistant / workflow adapter | Verified channel identity, typed candidate request and effect receipts. |
| `project-doctor-web` | Clinical interview / SOAP teaching app | Structured educational workflows; avoid consequential clinical automation. |
| `92-duty-scheduler` | Duty scheduling / roster operations | Canonical post-publication change lifecycle, verified identity and schedule revision. |
| `voice-actress` | Taiwan police/legal essay practice | Evidence-linked rubric grading, legal-source provenance and simplification. |
| `flux-image-gen` | Image-generation workflow | Source/output provenance, cost/parameter receipt and reversible variants. |
| `neciken-summer-poem` | Literary contest / creative workstation | Frozen contest source and isolated candidate revisions. |
| `minideck` | AI HTML presentation generator | Reversible candidate edits/version/export; source/evidence handoff. |
| `ppt-studio` | Local presentation authoring / AI deck workstation | Editable deck plus claim/source provenance and cross-format handoff. |
| `police-exam-practice` | Police exam practice | Official corpus, adaptive review and answer-evidence linkage. |
| `exam-archive` | General exam archive | Provenance/version integrity and archive→practice handoff. |
| `cf-mcp-server` | Cloudflare-hosted MCP infrastructure | Transport/auth/effect evidence; no second source-of-truth layer. |
| `academic-mcp` | **Private academic research gateway / multi-source MCP** | **NEW #1:** canonical paper identity + source observation ledger + versioned research bundles. |
| `ai-flight-radar` | **Airfare intelligence / price tracking / alerts** | **NEW scope:** typed WatchSpec, truthful quote freshness, low-noise alerts and pre-booking reconfirmation; roadmap already owns major gaps. |

---

## External Signals

### A. Direct competitor — Scite moves research agents from repeated search into citation traversal + durable collections

**CONFIRMED — 2026-09-09 / 2026-09-01**  
Sources:
- https://scite.ai/blog/citation-surfing-scite-mcp
- https://scite.ai/blog/august-2026-release-notes
- https://scite.ai/mcp

Scite added a `citation_graph` MCP tool on 2026-09-09 so an agent can start from one paper, traverse references/citing papers, inspect a new paper, then continue the graph. Where Scite has Smart Citation context, an edge can carry supporting/contrasting/mentioning classification plus section/citation text. Its 2026-09-01 release also made ChatGPT/Claude connection one-click and fixed Zotero imports where DOI values in notes/link fields had previously caused references to be silently skipped.

**Job-to-be-Done:** move from “search the topic again” to “follow the evidence network around a known paper, without losing the papers/identifiers already found.”

**Why it saves steps / may feel more reliable:** graph traversal eliminates repeated query reformulation; better DOI recognition prevents silently missing library items; one-click MCP activation removes manual endpoint configuration.

**Onboarding / distribution:** Scite is meeting users inside ChatGPT, Claude and other MCP clients rather than forcing all research into its own UI. Free accounts now include a limited MCP allowance, making agent integration part of acquisition rather than an enterprise-only afterthought.

**Capability pattern:** search, citation traversal and full text are separate complementary primitives; Collections/Feeds retain research state beyond a chat turn.

**Pricing/business-model signal:** monthly MCP credits and a dedicated Academic plan indicate agent-native access is becoming a separately metered product surface. This is packaging evidence, not effectiveness evidence.

**Limitations / complaints:** Scite's own release notes are the evidence for the previous silently dropped DOI problem. Smart Citation labels depend on Scite's corpus/classification; they should not be assumed available from Reese-max's existing sources.

**Absorb:** identifier normalization, explicit source/citation-edge provenance, persistent research bundle, easy client onboarding.

**Do not copy:** do not build a second citation classifier; `academic-mcp` already contains Semantic Scholar-backed citation graph functionality, and source-specific semantics should remain attributable to the actual provider.

---

### A2. Direct / emerging academic-agent competitor — Cito makes source freshness and rate-limit behavior visible

**CONFIRMED — current docs checked 2026-09-11; launched in 2026**  
Sources:
- https://cito.fim.ai/
- https://cito.fim.ai/docs
- https://cito.fim.ai/docs/api
- https://www.producthunt.com/products/cito

Cito is a programmatic academic search service over locally indexed Semantic Scholar/OpenAlex data, exposing web search, JSON API and a native MCP endpoint. Its API response includes `corpus_release`, `corpus_synced_at` and attribution; anonymous/API-key rate limits are explicit and HTTP 429 is a documented state. Search ordering is described as deterministic against the same snapshot. Product Hunt lists it as a free 2026 launch aimed at agent research, with the maker explicitly citing upstream academic-API throttling as the problem being solved.

**Job-to-be-Done:** let an agent fan out academic searches without turning provider throttling into stalled deep-research runs.

**Why it saves steps / may feel more reliable:** corpus freshness travels with the result; the caller need not separately ask “what snapshot am I looking at?” and can distinguish a deterministic snapshot from a live provider response.

**Onboarding / distribution:** a single MCP endpoint and no-signup search lower adoption friction; API keys raise rate limits rather than changing the basic contract.

**Capability pattern:** retrieval is deliberately separated from reasoning; source attribution and corpus snapshot are part of the transport contract.

**Pricing/business-model signal:** free/no-signup discovery plus higher keyed limits suggests the retrieval layer can be a commodity acquisition surface, while reliability/scale/usage control are differentiators. No Product Hunt popularity metric is treated as proof of product-market fit.

**Limitations:** a locally indexed corpus can lag upstream publication, and Cito's own docs expose that freshness tradeoff. It does not replace full-text licensing/availability, and it is not a citation-verification authority simply because it returns citation counts.

**Absorb:** `SourceObservation` should carry retrieval time, source/corpus revision, status and attribution.

**Do not copy:** do not replace Reese-max's three pinned upstream projects with a new fourth provider merely to evade a rate limit. `academic-mcp` should first make current partial/failure states truthful and replayable.

---

### B. Adjacent research workflow — Elicit / ResearchRabbit turn “research state” into a versioned artifact, not a chat output

**CONFIRMED — 2026-08-31 / 2026-07-09 / 2026-07-15**  
Sources:
- https://elicit.com/blog/ai-powered-research-is-now-multiplayer
- https://elicit.com/
- https://www.researchrabbit.ai/releases/major-release-2026-07-09-2
- https://learn.researchrabbit.ai/en/articles/15890653-track-your-reading-with-reading-lists

Elicit's 2026-08-31 release added Skills, Collaborative Sessions, artifact editing and Shared Projects. Multiple researchers can work from shared context and version history rather than passing a finished AI output around after the fact. ResearchRabbit's 2026-07 release added a Reading List as an explicit “exploration parking lot” — a paper can be kept as a candidate without being promoted into a curated collection.

**Job-to-be-Done:** preserve enough state to continue a research project later or with another person/agent without reconstructing what was already searched, considered, accepted or rejected.

**Why it saves steps / may feel more reliable:** candidate/accepted states reduce repeated re-evaluation; version history and shared artifacts make changes inspectable; reusable Skills reduce repeated re-explanation of method.

**Onboarding / distribution:** Elicit expands from solo AI research into organization-level shared context; ResearchRabbit keeps lightweight triage directly inside its existing library workflow.

**Capability pattern:** canonical artifact + side threads/candidates + version history + reusable method.

**Pricing/business-model signal:** Elicit reserves collaborative sessions/artifact editing for organization Scale/Enterprise contexts and Skills for Pro/Scale/Enterprise, signaling that persistent/reusable research process — not merely search — is a monetizable layer. Vendor claims about time savings/accuracy are not used here as evidence.

**Limitations:** these are broad research products. Importing their UI, team system or systematic-review machinery would create a second product rather than strengthen a private MCP gateway.

**Absorb:** candidate set vs included set, versioned bundle, reusable query/method plan, explicit diff.

**Do not copy:** no team workspace, PRISMA suite or paid collaboration surface in the MVP.

---

### B2. Adjacent handoff workflow — Paperpile removes PDF selection friction but still loses AI state on the return path

**CONFIRMED — 2026-05-06 product launch; help page checked 2026-09-11**  
Sources:
- https://paperpile.com/blog/pdf-ai-assistant/
- https://paperpile.com/h/ask-ai/

Paperpile Ask AI can select PDFs in a reference library and send them directly to ChatGPT, Claude, Gemini, Copilot or NotebookLM, including prompts and source links/quotes. However the current help center explicitly says an AI response **cannot yet be automatically saved back as a Paperpile note**; the user must copy and paste it.

**Job-to-be-Done:** use the best external reasoning assistant without manually finding/re-uploading the same papers.

**Why it saves steps:** source selection and upload are handled by the library integration, but the return-path still creates a manual state seam.

**Onboarding / distribution:** BYO existing AI subscription, rather than paying for a proprietary embedded model.

**Capability pattern:** source system keeps bibliographic/PDF state; reasoning system is replaceable; source quotes link back to the original document.

**Pricing/business-model signal:** Paperpile explicitly positions “use the AI subscription you already pay for” as an advantage. That supports `academic-mcp` remaining model-neutral instead of bundling a costly proprietary LLM.

**Limitations:** Paperpile warns that AI assistants can hallucinate exact quotes, article links, DOIs or facts and tells users to verify against source PDFs. Claude upload limits can also fail in larger batches.

**Absorb:** cross-tool handoff should preserve stable source identity and evidence links, and the result should have a path back into a durable research bundle.

**Do not copy:** do not proxy/re-host entire PDFs into the ledger or assume the AI assistant's output is canonical research evidence.

---

### C. Emerging adjacent product pattern — conversational intent compiles directly into persistent monitoring

**CONFIRMED — Google 2026-08-27; KAYAK 2026-05**  
Sources:
- https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/
- https://www.kayak.com/news/ask-ai/

Google added Google Flights price tracking directly inside AI Mode on 2026-08-27. A traveler can describe where/when they want to fly in conversation and turn that context into a persistent flight-price alert without breaking the conversational flow. KAYAK's Ask AI similarly keeps live travel results beside the conversation instead of forcing repeated form resets/tab switching.

**Job-to-be-Done:** express a fuzzy travel goal once, then convert it into a concrete watch instead of manually rebuilding a search/filter form and separately configuring alerts.

**Why it saves steps:** conversational context becomes a typed long-lived watch; tracking does not require a second search setup.

**Onboarding / distribution:** the capability appears inside an already-used Search/travel surface rather than a dedicated “AI airfare bot.”

**Capability pattern:** natural-language intent → structured search constraints → live inventory → persistent monitor.

**Pricing/business-model signal:** travel search remains primarily distribution/lead-generation rather than selling an autonomous booking agent. This reinforces read/alert/redirect before auto-purchase for `ai-flight-radar`.

**Limitations:** marketing pages do not prove lowest-price coverage or alert accuracy. Different providers can expose stale/cached/incomplete fares, and AI-generated constraint interpretation can be wrong.

**Absorb:** `ParsedSearchIntent` should become a reviewable `WatchSpec` with explicit origins/destinations/date window/duration/budget/directness/cabin/passengers/currency and a pre-activation preview.

**Do not copy:** do not add general trip-planning chat, hotel booking or autonomous purchase; `ai-flight-radar` should stay focused on evidence-backed fare monitoring from Taiwan origins.

---

## Community Pain Points

Community evidence is anecdotal and is not used as a market-size statistic.

### `ai-flight-radar`: flexible constraints and stale-price friction remain unresolved in real use

**COMMUNITY_SIGNAL — Reddit, 2026-08-28**  
https://www.reddit.com/r/SmartTravelHacks/comments/1w0xrpl/where_are_you_finding_flight_deals/

A recent thread says Google Flights is still a default discovery tool, but one user reports fares can be outdated by the time they click through and that map exploration can omit smaller-city options unless manually zoomed/refined.

**COMMUNITY_SIGNAL — Reddit, 2026-07-29**  
https://www.reddit.com/r/TravelHacks/comments/1va8z76/track_cheap_flights_from_multiple_airports/

Users discuss wanting one alert over several origin airports and note that multi-origin alerting can require separate watches/manual setup depending on interface/device.

**COMMUNITY_SIGNAL — Reddit, 2026-07-13**  
https://www.reddit.com/r/travel/comments/1uv5jus/what_on_earth_is_going_on_with_flight_search/

A traveler reports seeing cached prices in multiple aggregators that changed or disappeared on airline handoff. This is anecdotal, but it supports the repository's existing decision to keep quote timestamps/source evidence and to reconfirm before booking instead of treating a search result as a guaranteed fare.

**COMMUNITY_SIGNAL — Reddit, 2026-06-25**  
https://www.reddit.com/r/SideProject/comments/1ufjjy7/google_flights_hides_the_cheapest_way_to_travel/

A side-project developer describes the manual work of exploring flexible dates/airports/self-connections and frames the opportunity as “hard constraints + flex everything else.” This is not proof that self-connections are safe/desirable for Reese-max, but it supports typed hard/soft constraints as a better model than a free-form prompt alone.

**Action:** keep these as research signals only. Do not use them to claim Google/KAYAK error rates or guaranteed savings.

### `academic-mcp`: no fresh Reddit/HN claim retained as evidence

The current round's academic opportunity has enough first-party product/docs evidence plus directly observed repository runtime 429 behavior. Search results did not provide a cleaner recent Reddit/HN signal than those sources, so no weak community anecdote was added merely to satisfy a quota.

---

## Opportunity Scores

Scoring uses seven required dimensions. `Implementation Effort` and `Security/Privacy/Cost Risk` are penalty axes (lower is better); total is a normalized product decision score, not a statistical forecast.

| Candidate | Pain | Fit | Novelty | Evidence | Reuse | Effort ↓ | Risk ↓ | Score | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `academic-mcp` — Canonical Paper Identity + SourceObservation Ledger + ResearchBundle Revision/Diff | 9 | 10 | 9 | 9 | 10 | 4 | 3 | **93** | **Issue #1 created** |
| Cross-portfolio — SourceObservation typed status (`PARTIAL/RATE_LIMITED/STALE/UNKNOWN`) | 9 | 10 | 8 | 10 | 10 | 4 | 2 | **92** | Reuse principle inside #1; no separate Issue |
| `ai-flight-radar` — Intent→reviewable WatchSpec→persistent tracking receipt | 9 | 9 | 7 | 9 | 8 | 4 | 4 | **88** | Research list; current roadmap already owns NLP/alerts |
| `academic-mcp` — Collection/Bundle refresh feed with changed-since-last-run | 8 | 9 | 7 | 9 | 9 | 5 | 3 | **87** | Fold into #1 Phase 2; no duplicate Issue |
| `ai-flight-radar` — seen-state / novelty-aware alert suppression | 8 | 9 | 6 | 8 | 8 | 4 | 3 | **84** | Research list; measure notification noise first |
| `academic-mcp` — one-click multi-client MCP onboarding | 6 | 8 | 5 | 9 | 7 | 5 | 5 | **78** | Not now; gateway is already connected/working |
| `ai-flight-radar` — self-connection/multimodal itinerary optimization | 7 | 5 | 8 | 5 | 4 | 9 | 8 | **58** | Reject for now; reliability/liability/source coverage too weak |

### Why #1 crossed the Issue threshold

The opportunity is not “add another academic search provider.” It eliminates a current manual coordination layer created by the repository's own successful aggregation of three sources:

`paper_ search → copy candidate IDs → semantic_ query → reconcile DOI/arXiv/S2 identity manually → remember which provider failed/rate-limited → keep selected papers in ad-hoc notes/chat → later rerun and compare by eye`

Target workflow:

`ResearchIntent → QueryPlan → SourceObservation[] → PaperIdentity resolution → CandidatePaperSet → explicit include/exclude → ResearchBundleRevision → refresh/replay → BundleDiff → EvidenceReceipt`

A source observation can be true without becoming canonical metadata. A paper can be discovered without being accepted into a bundle. A provider can be unavailable without implying that its result count is zero.

---

## Opportunity Map — All 37 Products

The map below is a strategy map, not a mandate to add features. `DO NOT COPY` is intentionally populated to keep simplification/removal decisions visible.

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| `cf-ai-router` | truthful provider health/lifecycle/fallback | pre-deprecation canary + exact migration receipt | zero-surprise billing + capability/cost fail-closed | reuse `SourceObservation` semantics for provider/model status | enterprise routing/data-residency breadth without demand |
| `soundbox-offline` | reliable offline library/import/export | dedupe + low-friction OS/share import | local-first/no account | candidate import preview + receipt | cloud social/music platform |
| `police-exam-archive` | exact official source/year/page | source revision + missing-source state | exam provenance first | canonical exam/source identity + bundle diff | AI-generated question flood |
| `skill-foundry` | isolated reproducible evaluation | risk-tier evaluation budget | promotion requires evidence, not popularity | source/eval observation ledger | marketplace install count as quality |
| `prompt-autoresearch` | reproducible configs/results | model/version/source snapshot diff | local experiment truth | versioned experiment bundle | opaque “best prompt” leaderboard |
| `lobsterpulse` | source freshness/change detection | dedupe same company/product announcement | evidence-backed cross-market radar | canonical product/signal identity | scrape volume as insight quality |
| `tick-stock-panel` | timestamped market/source data | stale/partial source warnings | self-hosted research not brokerage | observation receipts per data provider | auto-trading before execution governance |
| `clinical-scribe-worker` | source-linked note revision | section-scoped repair/undo | minimal blast-radius editing | observation ledger for model/transcript revisions | autonomous clinical action |
| `adng-memory` | provenance + quarantine/staleness | conflict/diff across memory revisions | memory cannot mint authority | canonical memory-source identity | infinite auto-memory |
| `avatar-vfo` | stable persona/scene state | revision/branch comparison | bounded continuity | source observation for character facts | unbounded hidden memory |
| `note-filler` | evidence-linked candidate patch | deterministic stale-input detection | explicit acceptance before canonical note | bundle source observations | silent overwrite |
| `taiwan-intel-dashboard` | source/date/URL provenance | cross-source event identity/dedupe | Taiwan public-source focus | event evidence bundle/diff | generic news-chat surface |
| `cyber-prep-coach` | official question/answer truth | calibration + weak-topic evidence | exam-specific mastery | research bundle for source-backed explanations | many AI modes with weak explanations |
| `UkePack` | editable export and deterministic source use | reversible candidate transformations | teaching artifact not AI demo | source/version receipt | DAW/social platform breadth |
| `autodev-ng` | bounded jobs/locks/review/evidence | principal + effect + completion truth | multi-engine evidence-first orchestration | shared observation/bundle primitive for research tasks | more engines before red regression gates close |
| `ai-novel-workstation` | canonical manuscript state | branch/revision/diff/resume | local-first long-form continuity | “candidate vs accepted” scene/research bundle | infinite autonomous writing loop |
| `herdr-skills` | correction→candidate improvement | conflict/dedupe + independent validation | rules cannot self-promote | source observation for learned rule evidence | auto-edit policy from one session |
| `video-timeline-pipeline` | timestamp/source identity | CutSpec diff + NLE round-trip proof | evidence-backed handoff | media/analysis observation ledger | full NLE clone |
| `chatgpt-dual-pipeline` | deterministic de-identification/publish boundary | source/publish revision receipt | one-way safe publication | source bundle lineage | bidirectional secret-bearing sync |
| `claude-mem` | memory source/provenance | stale/conflict controls | coding-memory simplicity | memory candidate bundles | remembered text as permission |
| `lplrs-judicial-sync` | exact legal authority/revision | cross-source identity/conflict | removal/span/revision truth | reuse observation ledger contract | fuzzy merge of judicial authorities |
| `internship-notes-sites-mirror` | deterministic mirror | changed-since-source diff | simple static downstream | source revision receipt | second authoring database |
| `MaterialYouNewTab` | fast local retrieval/workspaces | unified command palette + session capture preview | local/private workspace | candidate snapshot vs saved workspace | permission-heavy browser super-app |
| `taichung-police-intel` | evidence envelope + publication receipt | event identity/dedupe/currentness | operational public-source brief | UI/MCP/WebMCP over one bundle | Agent-specific second database |
| `ninax-line-hermes` | verified identity + bounded external effect | request-state/current-revision validation | thin LINE adapter over canonical workflow | source/receipt bundle for conversations | chat message = direct authority |
| `project-doctor-web` | pedagogically correct structured cases | revision/evidence feedback | education-only safety boundary | candidate answer/evidence bundle | diagnostic/prescriptive clinical automation |
| `92-duty-scheduler` | canonical roster/policy/identity | typed confirmation/swap lifecycle | policy-aware local duty operations | schedule revision observation + receipt | full HR/payroll/WFM suite |
| `voice-actress` | rubric/answer/legal-source linkage | rubric revision + scoring receipt | police/legal essay specialization | evidence bundle per graded answer | generic LMS/TTS expansion |
| `flux-image-gen` | parameter/model/output receipt | source-image provenance + reversible variants | explicit provenance/cost | output bundle/version diff | provenance badge as truth guarantee |
| `neciken-summer-poem` | frozen contest prompt/rules | isolated revisions + exact final export | contest-specific authoring | source/rule observation bundle | generic content factory |
| `minideck` | editable deterministic deck artifact | candidate edit diff + source handoff | HTML-first lightweight deck | versioned evidence bundle | collaboration suite before core editing |
| `ppt-studio` | editable PPT/deck state | claim/source provenance + round-trip | local workstation | slide/claim evidence bundle | SaaS/mobile/Slack breadth without demand |
| `police-exam-practice` | official question corpus | adaptive review + explanation evidence | police-exam specialization | canonical question identity | gamification feature flood |
| `exam-archive` | exact archive/source revision | dedupe + archive→practice handoff | provenance-first archive | canonical item/source observation | AI-generated archive filler |
| `cf-mcp-server` | transport/auth/runtime truth | tool/effect provenance + degraded-mode status | controlled MCP infrastructure | standard SourceObservation/Receipt envelope | server as hidden second truth store |
| `academic-mcp` | source-specific search/citation/full-text semantics | **canonical paper identity + source health/provenance + replay/diff** | pinned private gateway preserving upstream parity | research feed/alerts as bundle refresh, not new DB | rebuild Scite/Elicit UI/classifier; silent identifier merge |
| `ai-flight-radar` | real quote freshness + exact search constraints | **reviewable WatchSpec, source health, low-noise alerts, reconfirm before booking** | Taiwan-origin evidence-based fare monitoring | hard/soft constraint planner after second source exists | auto-purchase, “guaranteed deal,” self-connection optimizer before reliability proof |

---

## Top 10 Cross-Portfolio Ideas

1. **Canonical Identity ≠ Canonical Metadata.** Keep source aliases/observations; merge only with stable evidence, fail closed on conflict.
2. **Source failure ≠ zero result.** `RATE_LIMITED`, `PARTIAL`, `STALE`, `ERROR`, `UNKNOWN` should survive normalization.
3. **Versioned Bundle + Diff.** Long-running research/monitoring should have a replayable artifact, not rely on chat context.
4. **Candidate ≠ Included.** Discovery can be automatic; promotion into accepted evidence/state should remain explicit when errors matter.
5. **Intent → Typed WatchSpec → Preview → Activate.** Natural language is an intake surface, not the durable monitoring contract.
6. **Alert on novelty/state change, not every observation.** Preserve seen-state and explain why a notification fired.
7. **Cross-tool handoff should preserve provenance in both directions.** Removing upload friction but requiring copy/paste on return is only half a workflow.
8. **Provider/source revision belongs in receipts.** A result should reveal what corpus/model/source revision it came from when reproducibility matters.
9. **Separate retrieval from reasoning.** Cheap/deterministic source retrieval can be reused by different models without making model output canonical evidence.
10. **One canonical state, multiple transports.** Human UI, MCP, WebMCP, exports and alerts should project the same underlying identity/revision contracts rather than create parallel truths.

---

## Adjacent Ideas

### `academic-mcp` — Research Feed as `BundleRefresh`, not a new product surface

Scite's July/August Research Feed and Elicit Alerts show real demand for keeping up with evolving literature. The transferable primitive is not “build a news feed”: schedule/re-run a saved `ResearchBundle` query plan, produce `BundleDiff`, then notify only on meaningful new/changed evidence. This should remain a later phase of #1 because source identity/freshness must exist before an alert can truthfully say what changed.

### `ai-flight-radar` — hard vs soft constraints

Community flight-search friction and Google/KAYAK conversational search both support a typed intent model that distinguishes:
- hard: origin set, passport/market assumptions if relevant, max budget, maximum stops, excluded carriers/OTAs, required date boundaries;
- soft: preferred dates, nearby airports, trip duration, departure time, “anywhere cheap.”

The agent/parser may propose relaxation of a soft constraint, but cannot silently relax a hard one. This is especially important when a cheap result introduces self-connections, separate tickets or stale cached fares.

### Cross-portfolio — source observation ledger

`academic-mcp #1` makes the primitive concrete, but the design can later be reused by judicial/event/exam/media intelligence products:

`source-specific observation → canonical identity candidate → conflict-aware resolution → versioned bundle → diff → receipt`

Each domain must define its own identity rules. A DOI merge heuristic must never become a generic “fuzzy dedupe everything” service.

---

## Ideas Rejected / Deferred

| Idea | Decision | Why |
|---|---|---|
| Add another academic-search provider solely to escape Semantic Scholar 429 | **DO NOT COPY / defer** | Cito validates the pain, but a fourth provider adds identity/licensing/freshness complexity. First make current source states truthful and replayable. |
| Build Scite-style supporting/contrasting citation classifier | **REJECT** | Requires corpus/classifier/licensing evidence not present in `academic-mcp`; existing S2 citation graph already covers relationships. |
| Clone Elicit systematic-review/team workspace | **REJECT** | Wrong scope for a private gateway; collaboration UI is not needed to solve identity/provenance. |
| Auto-merge papers by fuzzy title similarity | **REJECT** | False merge corrupts evidence; unresolved ambiguity should become `REVIEW_REQUIRED`. |
| Store full PDF text inside every ResearchReceipt | **REJECT** | Storage/licensing/privacy risk; keep identity/metadata/hash and separate full-text availability/index state. |
| Add AI trip-planning chatbot to `ai-flight-radar` | **REJECT** | Existing differentiation is fare evidence/monitoring, not general itinerary advice. |
| Auto-book/buy tickets when a threshold is crossed | **REJECT** | Price/inventory can change; payment/consequential actions are outside current safety/product scope. |
| Optimize hidden-city/self-connection itineraries now | **DEFER** | Source coverage, baggage/connection risk and total-price semantics are not mature enough; roadmap P2 second source/reconfirmation comes first. |
| Treat vendor “best price / accuracy / time saved” claims as success metrics | **REJECT** | Marketing claims are not independent evidence; measure Reese-max runtime/workflow metrics directly. |
| Open separate Issues for bundle refresh, alert feed and one-click MCP onboarding | **REJECT duplicate/scope split** | Bundle refresh naturally belongs to #1 later phase; onboarding already works and is lower-value. |

---

## Issue Mapping / Duplicate & Lock Check

### Created this round

**`Reese-max/academic-mcp #1`**  
`[Competitive Inspiration][Research][RESEARCH_REQUIRED] 建立 Canonical Paper Identity + Research Bundle Ledger，跨來源去重並保留可重播研究證據`

Fingerprint:

`academic-mcp:canonical-paper-identity:source-observation-ledger:research-bundle-revision:v1`

Before creation, searched `academic-mcp` open/closed Issues and all-state PRs for `bundle`, `provenance`, `DOI`, `dedupe`, `identity` and adjacent wording. No same/near fingerprint and no visible competing `github-issue-lock:v1` work was found.

The Issue includes:
- dated external sources;
- competitor/adjacent workflow analysis;
- manual current workflow and target workflow;
- transferable principle;
- why it fits and why not to copy competitors directly;
- minimum deliverable;
- Acceptance Criteria;
- Success Metrics;
- risks/dependencies;
- Runtime Verification Requirement;
- cross-portfolio reuse boundary.

### No new `ai-flight-radar` Issue

No Issue was created because current repository roadmap already tracks the highest-value gaps revealed by the market scan:
- NLP scope/correctness;
- source health and actual quote sampling;
- alert reliability/outbox;
- second independent fare source;
- total round-trip/baggage semantics;
- cache expiry / reconfirm before booking;
- explicit non-goal of automatic purchase.

Opening another `[Competitive Inspiration]` Issue for “AI price tracking” would duplicate work without increasing product clarity.

### Existing related portfolio Issues left untouched

The new `SourceObservation / canonical identity / versioned bundle` primitive is compatible with, but does not steal scope from:
- `taichung-police-intel #15` — transport-neutral evidence distribution/WebMCP.
- `lplrs-judicial-sync #3` — judicial authority revision/span/removal truth.
- `video-timeline-pipeline #11` — evidence-backed CutSpec/NLE handoff.
- `autodev-ng #12` — external-effect/egress containment.
- `autodev-ng #17` — Agent Principal/Credential Lease identity.

No lock was taken on those Issues and no competing implementation work was started.

---

## Runtime Verification Requirements for the New Opportunity

Before `academic-mcp #1` can be considered implemented rather than research:

1. Select a public paper with independently resolvable arXiv + DOI + Semantic Scholar identities.
2. Resolve it through at least two existing namespaces/sources in the real gateway; fixture-only proof is insufficient.
3. Produce exactly one `PaperIdentity` while preserving source-specific aliases/metadata observations.
4. Inject or encounter a controlled Semantic Scholar 429 and prove the source status remains `RATE_LIMITED/PARTIAL`, never normalized into “0 citations/no result.”
5. Refresh a saved bundle and produce a deterministic `BundleDiff` without overwriting the previous revision.
6. Re-run gateway parity and confirm **81 tools + 7 prompts** remain registered with compatible upstream semantics.
7. Inspect generated receipts/logs and verify no Bearer/API key or PDF full text is accidentally stored in the evidence ledger.

Until those checks pass, the Issue remains `[RESEARCH_REQUIRED]`.

---

## Sources

### Academic research / agent tools

- **Scite — Citation Surfing with Scite MCP**, 2026-09-09  
  https://scite.ai/blog/citation-surfing-scite-mcp
- **Scite — August 2026 Release Notes**, 2026-09-01  
  https://scite.ai/blog/august-2026-release-notes
- **Scite MCP**, current product page checked 2026-09-11  
  https://scite.ai/mcp
- **Cito — product/docs/API**, current checked 2026-09-11  
  https://cito.fim.ai/  
  https://cito.fim.ai/docs  
  https://cito.fim.ai/docs/api
- **Cito — Product Hunt launch page**, launched 2026  
  https://www.producthunt.com/products/cito
- **Elicit — AI-powered research is now multiplayer**, 2026-08-31  
  https://elicit.com/blog/ai-powered-research-is-now-multiplayer
- **Elicit product/release index**, current checked 2026-09-11  
  https://elicit.com/
- **ResearchRabbit — Major release**, 2026-07-09  
  https://www.researchrabbit.ai/releases/major-release-2026-07-09-2
- **ResearchRabbit — Reading Lists guide**, 2026-07-15; updated 2026-08-12  
  https://learn.researchrabbit.ai/en/articles/15890653-track-your-reading-with-reading-lists
- **Semantic Scholar Academic Graph API**, current checked 2026-09-11  
  https://www.semanticscholar.org/product/api
- **Semantic Scholar API tutorial/rate-limit guidance**, current checked 2026-09-11  
  https://www.semanticscholar.org/product/api/tutorial
- **Paperpile — Ask AI launch**, 2026-05-06  
  https://paperpile.com/blog/pdf-ai-assistant/
- **Paperpile — Ask AI help/known limitations**, current checked 2026-09-11  
  https://paperpile.com/h/ask-ai/

### Flight / monitoring products

- **Google — AI Mode adds Google Flights price tracking**, 2026-08-27  
  https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/
- **KAYAK — Ask AI**, 2026-05  
  https://www.kayak.com/news/ask-ai/

### Community signals — anecdotal only

- Reddit / SmartTravelHacks — flight deals/stale fare discussion, 2026-08-28  
  https://www.reddit.com/r/SmartTravelHacks/comments/1w0xrpl/where_are_you_finding_flight_deals/
- Reddit / TravelHacks — multi-origin alert discussion, 2026-07-29  
  https://www.reddit.com/r/TravelHacks/comments/1va8z76/track_cheap_flights_from_multiple_airports/
- Reddit / travel — cached/incorrect flight-search prices, 2026-07-13  
  https://www.reddit.com/r/travel/comments/1uv5jus/what_on_earth_is_going_on_with_flight_search/
- Reddit / SideProject — flexible self-connection search workflow, 2026-06-25  
  https://www.reddit.com/r/SideProject/comments/1ufjjy7/google_flights_hides_the_cheapest_way_to_travel/

---

## Final Decision

**Notify:** yes — one evidence-backed, non-duplicate product opportunity crossed the Issue threshold and is reusable beyond a single repository.

**Filed:** `Reese-max/academic-mcp #1`, Opportunity Score **93/100**.

**Not filed:** `ai-flight-radar` conversational WatchSpec/alert opportunities because the repository's current roadmap already owns the core gaps; fresh external evidence validates prioritization rather than requiring duplicate backlog.

**Portfolio design rule from r4:**

> A system that aggregates more sources becomes less trustworthy if it collapses identity, freshness and failure states into one answer. The next product layer is not “more search”; it is **conflict-aware canonical identity + source-specific observations + versioned research/monitoring state + deterministic diff + receipt**.
