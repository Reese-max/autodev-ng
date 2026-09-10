# External Competitive / New Product / Workflow Radar — 2026-09-09 r5

## Scope and Evidence Contract

- Portfolio scope: Reese-max owned, **unarchived** repositories visible to the connected GitHub account. Current inventory: **35 unarchived repositories**.
- Archived repositories are excluded from opportunity mapping (`openab`, `gemini-deidentifier`, `obsidian-vault`).
- Primary research source this round is the **public web outside Reese-max GitHub**. Reese-max GitHub is used to establish product reality, recent changes, duplicate boundaries and coordination state.
- Freshness: prioritize the last 30–90 days. Older/current pages are used only when they define a relevant protocol or durable product contract.
- Evidence labels:
  - `CONFIRMED`: official product/docs/release/spec or directly inspectable Reese-max repository fact.
  - `LIKELY`: strong secondary evidence, but not independently verified as runtime/product outcome.
  - `COMMUNITY_SIGNAL`: anecdotal user/developer discussion; never treated as prevalence statistics.
  - `UNKNOWN`: needs runtime, human-user, deployment, or customer evidence.
- Vendor marketing claims are treated only as product-positioning/capability signals unless independently supported.

## Executive Summary

### High-value new opportunity — public intelligence should become AI-queryable without becoming an autonomous police system

**New Issue:** `Reese-max/taichung-police-intel #15`  
**Title:** `[Competitive Inspiration][RESEARCH_REQUIRED][DISTRIBUTION] 建立 read-only Evidence MCP，讓外部 AI 直接查詢 canonical public intelligence`  
**Opportunity Score:** **93/100**

The strongest new signal this round is a distribution shift in public-sector data products:

`portal/dashboard → API → governed MCP / agent-accessible evidence surface`

The new opportunity is **not** “add another chatbot” and not “turn police intelligence into an autonomous agent.” It is to expose the already-public, already-verified canonical publication through a **very small read-only MCP surface** so users working in ChatGPT/Claude/other agents can retrieve the same event IDs, official evidence locators, source health, freshness, gaps and publication hash without manually switching windows and copy/pasting.

The proposed trust contract is:

`verified publication → narrow read-only tools → evidence envelope → external AI reasoning → official source locator`

No MCP tool may write schedules, call internal systems, expose 110/case/person data, run arbitrary SQL/URLs/filesystem, or manufacture a second canonical summary. Source `FAILED/PARTIAL/STALE/CONFLICT` states must survive the handoff to the external AI.

### Why now

1. **GSA, 2026-09-03** formally opened a government-wide MCP Server + AI Agent Hackathon for Sep–Nov 2026, explicitly asking agencies to make open-data assets and service-delivery APIs AI-ready through MCP.
2. **Twinkle Hub** now exposes 143,848+ government datasets across seven regions through one MCP endpoint and positions the workflow as “ask your AI; it queries government data.”
3. **GovSpend, 2026-06-16** launched an MCP server because customers increasingly consume public-sector intelligence inside their existing AI environments rather than only inside the vendor UI.
4. `taichung-police-intel` itself changed materially after r4: the 2026-09-09 Twinkle hybrid-source design now formalizes `OFFICIAL_FIRST / TWINKLE_FIRST / DUAL_VERIFY`, provenance, stale/conflict states, official fallback and promotion gates. That makes a trusted outbound projection more feasible than it was in prior rounds.

### Portfolio implication

The reusable primitive is not “MCP everywhere.” It is a shared **EvidenceEnvelope / PublicationReceipt** that lets any external AI integration preserve:

`artifact identity + canonical item identity + source locator + evidence status + freshness/gap/conflict + version/hash + truncation/result semantics`

That pattern could later serve `taiwan-intel-dashboard`, exam/archive products, judicial/law data and other public evidence systems, but this round opens only one research Issue in the repository with the clearest fit and newest source contract.

---

## Recent Reese-max Changes Since r4

### `taichung-police-intel` — material product-direction update

Recent default-branch commits after r4:

- `897d0c24...` — `docs: add Twinkle hybrid source routing`
- `4d33a48f...` — `docs: optimize GovIntel data source strategy`
- `78c4aa4...` — `docs: add GovIntel AI competition development plan`

The new hybrid model records provider path, official URL, dataset ID, publisher, license, published/effective/observed time, statistical period, content hash, freshness and verification state. It defines `OFFICIAL_FIRST`, `TWINKLE_FIRST`, `DUAL_VERIFY`, conflict preservation, last-known/background fallback semantics and a promotion gate before a source becomes production-active.

This is important because the new #15 does **not** ask an MCP server to scrape arbitrary sources. It asks the MCP layer to serve only the product’s already-governed publication/evidence truth.

### `taiwan-intel-dashboard` — trust defects still outrank expansion

A new product-board audit landed after r4 and keeps the product **not CLEAN**:

- #17 operating-state contradiction.
- #18 non-empty evidence can still deploy with an AI brief saying `（暫無資料）`.
- #19 repository-level licensing decision gap.

Therefore this round does **not** open an outbound-MCP Issue there. Distribution expansion before #17/#18 would amplify a truth defect into more clients.

### Other repositories

No newer change found this round materially overturns the opportunity priorities recorded in r4. Existing high-priority Competitive Inspiration / Research / Feature Issues remain the owning fingerprints for their domains.

---

# External Signals

## A. Direct / close-market product signals

### A1 — Twinkle Hub: government open data moves directly into AI clients
**Status:** CONFIRMED  
**Launch:** 2026-05-11; current product rechecked 2026-09-09  
**Sources:**
- https://hub.twinkleai.tw/
- https://hub.twinkleai.tw/tools
- https://hub.twinkleai.tw/pricing
- https://twinkleai.tw/en

Current public product surface:
- 7 countries/regions.
- 143,848+ government/open datasets.
- 184 tools behind one MCP endpoint.
- Free tier: 50 credits per rolling 5 hours and 500/week; Pro/Max planned.
- Connects Claude and other agent clients directly to government data.

**JTBD:** remove the manual “find dataset → understand API → copy data into AI” step.

**Why it can save steps:** data discovery/query is moved into the user’s existing AI client rather than requiring a separate data-portal journey.

**Onboarding/distribution signal:** one endpoint, one key, standard MCP client setup. The product explicitly sells endpoint portability rather than SDK lock-in.

**Automation/integration signal:** government data is treated as an agent-readable live capability, not only a downloadable dataset.

**Pricing/business-model signal:** core government-data lookup is used as free distribution; advanced semantic/full-document retrieval and enterprise support are monetization candidates.

**Limit / do not copy:** 184 tools is not evidence that 184 tools is a good interface for every agent. Twinkle now also offers domain Skills. Its public token/time benchmark is vendor-controlled and small-sample, so this radar treats it as a design hypothesis, not proof.

**What fits Reese-max:** a small number of task-level evidence tools over an already-governed publication.

### A2 — GovSpend MCP: intelligence follows the user into the AI environment
**Status:** CONFIRMED product capability / vendor signal  
**Release:** 2026-06-16; product page refreshed 2026-08  
**Sources:**
- https://govspend.com/media/govspend-launches-mcp-server/
- https://govspend.com/mcp-demo/
- https://support.govspend.com/june-2026-release-note

GovSpend explicitly frames MCP as the next step after UI and APIs: customers can query procurement intelligence from Claude, ChatGPT, Copilot or internal agents. June release notes also added OAuth and authenticated user-profile/opportunity context.

**JTBD:** perform research and opportunity analysis without leaving the AI environment already used for the rest of the workflow.

**Workflow innovation:** source intelligence becomes a composable capability inside customer agents instead of a destination UI only.

**Business-model signal:** proprietary intelligence becomes more valuable through distribution/integration, not only through dashboard lock-in.

**Limit / do not copy:** GovSpend’s dataset scale, sales claims, CRM/action flows and authenticated profile surface do not prove equivalent value for a public police-policy product.

**What fits Reese-max:** “data where the user is” distribution while retaining official evidence locators.

---

## B. Adjacent transferable workflow

### B1 — GSA 2026 MCP Server and AI Agent Government Hackathon
**Status:** CONFIRMED official public-sector market direction  
**Published:** 2026-09-03; events page updated 2026-09-08  
**Sources:**
- https://www.gsa.gov/artificial-intelligence/ai-community-of-practice/events-and-training/mcp-server-and-ai-agent-government-hackathon
- https://www.gsa.gov/artificial-intelligence/ai-community-of-practice/events-and-training

GSA’s Sep–Nov 2026 program explicitly asks government employees to prototype MCP servers for agency **open-data assets and service-delivery use cases**, so AI assistants can answer plain-language questions, dynamically surface datasets and support analysis.

**Transferable principle:** domain expertise and public-data governance can be packaged into the connector itself instead of requiring every downstream AI user to rediscover source semantics.

**What fits:** Taichung Police Intel already knows which source is authoritative, how stale/failure/conflict should be represented, and which public data is out of bounds. An outbound evidence interface can preserve that domain contract.

**What not to copy:** GSA also mentions service-delivery APIs and potential read/write use cases. Reese-max should not infer that `taichung-police-intel` needs write-capable police/government tools.

### B2 — “API-shaped evidence, not chatbot-shaped truth”
**Status:** LIKELY cross-market pattern

Across Twinkle, GovSpend and GSA, the valuable shift is not that vendors all added chat UIs. They make governed data available to **other** AI systems. For Reese-max this argues against duplicating another assistant surface inside every product.

---

## C. Emerging technical/product possibility

### C1 — MCP authorization now has a concrete least-privilege contract
**Status:** CONFIRMED protocol contract  
**Rechecked:** 2026-09-09  
**Source:**
- https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization

Current MCP authorization guidance requires OAuth 2.1 patterns for protected HTTP resources, resource/audience binding and no token passthrough. Scope selection is explicitly tied to least privilege.

**Product implication:** a later protected Reese-max MCP cannot trust client-supplied identity or forward inbound tokens downstream. The first public-data pilot should remain simpler: anonymous/public if appropriate, read-only, rate-limited and isolated from any private credentials.

### C2 — Tool-surface budgets / playbooks are becoming a practical MCP design concern
**Status:** COMMUNITY_SIGNAL, not a benchmark

Recent developer discussions:
- 2026-08-13: https://www.reddit.com/r/mcp/comments/1vngiit/
- 2026-09-01: https://www.reddit.com/r/mcp/comments/1w4o1xg/
- 2026-09-07: https://www.reddit.com/r/AI_Agents/comments/1w9op5p/

Developers report context/tool-routing problems when many MCP tools are exposed and are experimenting with playbooks, lazy discovery and pre-filtered tool permissions. These posts are anecdotal and self-reported; no numeric threshold is accepted as general evidence.

**Product implication:** `taichung-police-intel #15` caps the MVV at five high-level read-only verbs instead of making one MCP tool per source/dataset.

---

# New Releases / Fresh Changes

1. **2026-09-03 — GSA:** 2026 MCP Server + AI Agent Government Hackathon announced for Sep–Nov 2026; focus on agency open data and service delivery.
2. **2026-09-08 — GSA events page:** hackathon listed as an upcoming AI Community of Practice event.
3. **2026-08-31 — Twinkle Hub Terms:** explicitly describes the service as MCP-as-a-Service aggregation for government/open/local data.
4. **2026-08-17 — Twinkle Hub:** Taiwan statute time-machine capability added; current pricing page surfaces it in changelog.
5. **2026-08 / current — GovSpend:** MCP is promoted alongside SSO, Slack, APIs and other integration channels as a core distribution surface.
6. **2026-09-09 — Reese-max/taichung-police-intel:** hybrid Twinkle + official-source routing/provenance design landed after the prior radar, creating a stronger internal trust base for a bounded outbound interface.

---

# Community Pain Points

## MCP tool sprawl / routing ambiguity
**Classification:** COMMUNITY_SIGNAL

Anecdotal MCP developers describe agents making poorer routing choices or consuming unnecessary context when large tool catalogs are loaded. Some respond with playbooks, lazy tool descriptions or a smaller pre-authorized tool list.

**Reese-max response:** do not infer a universal “10/20 tools” threshold. Instead define a tool-surface budget, measure a fixed evaluation set and prefer task-level verbs.

## Permission ambiguity
**Classification:** COMMUNITY_SIGNAL

Recent agent/MCP discussions focus on whether every server tool should be visible by default or whether agents should only see an allowlisted subset, with audit trails and constrained hosts/methods/paths.

**Reese-max response:** the new public intelligence surface is read-only and does not inherit upstream collector credentials. If protected tools ever arrive, authorization is a separate project gate.

## Public data fragmentation
**Classification:** CONFIRMED product problem statement / older civic-data observation

Twinkle’s launch rationale and Taiwan open-data ecosystem discussions both emphasize that datasets are distributed across portals and often require manual integration before they become useful to AI/workflows.

**Reese-max response:** continue to solve this at the canonical evidence layer; do not push fragmentation downstream into every AI client.

---

# Opportunity — Read-only Evidence MCP

## Job-to-be-Done

When a police policy/council-liaison user is already drafting a brief or answering a question inside an AI tool, they should be able to:

1. ask for the current verified public-intelligence brief;
2. query a specific event/topic;
3. receive source health/freshness/gap/conflict state with the answer;
4. jump to the exact official evidence locator;
5. know which publication/hash the AI queried;
6. do all of this without giving the external AI any operational, private or write authority.

## Proposed MVV

Task-level read-only tools only:

- `get_current_brief(profile_id?)`
- `search_verified_events(query, source_ids?, since?)`
- `get_event_evidence(event_id)`
- `get_source_health(source_id?)`
- `get_publication_receipt()`

Response envelope:

`publication_hash + event_id + evidence_status + official_source_url + published/effective/observed time + freshness + source-health + gap/conflict + generated_at + truncation/result metadata`

## Opportunity Score

| Dimension | Score | Reason |
|---|---:|---|
| User Pain | 8/10 | Removes current Web → copy/paste → AI → Web verification loop; human demand magnitude still needs testing. |
| Strategic Fit | 10/10 | Extends the repository’s evidence-first public-only differentiator. |
| Novelty | 9/10 | AI-ready governed data distribution is accelerating in public-sector products. |
| Evidence Strength | 9/10 | GSA official direction + Twinkle + GovSpend + MCP specification; vendor outcome claims excluded. |
| Reuse Potential | 10/10 | EvidenceEnvelope/PublicationReceipt can be shared by multiple evidence products. |
| Implementation Effort | 7/10 | Static/published JSON makes a bounded spike feasible; production auth/rate-limits still require care. |
| Security/Privacy/Cost Risk | 7/10 | Public/read-only lowers risk but tool boundary, data leakage, stale state and abuse must be tested. |

**Overall: 93/100 — create research Issue.**

---

# Opportunity Map — 35 Unarchived Reese-max Repositories

| Repository | Market category | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| exam-archive | exam evidence archive | stable official source identity | freshness/source correction trail | canonical evidence-first archive | read-only evidence connector later | generic AI-generated question flood |
| police-exam-practice | compatibility shell | truthful redirect/deep-link | minimal accessible fallback | thin compatibility | usage-safe deep-link telemetry | duplicate quiz engine |
| police-exam-archive | official exam practice | question provenance | attempt/mastery truth | deadline-aware official-question review | learner-state/evidence connector | generic tutor before truth layer |
| 92-duty-scheduler | duty scheduling | authorization + hard constraints | explainable policy/repair preview | unit-specific PolicySpec/Rule Studio | exportable policy contract | autonomous LLM scheduler |
| UkePack | teacher music pack workflow | source/copyright boundary + reliable CI | real teacher workflow evidence | privacy-minimal differentiated pack sets | narrow practice tools after research | LMS/child roster creep |
| ppt-studio | AI presentation workstation | auth/local API boundaries | source provenance + artifact verification | evidence-linked local deck production | source-in-place connectors | hosted collaboration-suite cloning |
| voice-actress | answer/essay grading | rubric/source traceability | exact answer-span evidence | evidence-linked grading | reusable EvidenceLinkedFeedback | opaque score-only AI |
| taiwan-intel-dashboard | multi-source intelligence | truthful operating/data state | deterministic degraded summary | Taiwan provenance/health semantics | outbound evidence connector **after #17/#18** | more feeds/LLMs before trust fixes |
| autodev-ng | agent orchestration | exact execution identity | STEER/QUEUE + receipts | bounded auditable operations | consume attention/evidence envelopes | unrestricted remote control |
| flux-image-gen | image generation | export/provenance identity | verifiable metadata | reproducible image lineage | cross-artifact provenance | style breadth without provenance |
| claude-mem | agent memory | scope/retention/deletion truth | stale/supersede semantics | inspectable memory lifecycle | shared memory-envelope standards | infinite accumulation |
| lobsterpulse | local agent observability | provider-hook correctness | needs-attention routing | local-first cross-provider view | evidence-aware alert inbox | remote-terminal/team SaaS clone |
| prompt-autoresearch | prompt experimentation | repeatable eval | variance/holdout evidence | bounded auto-research | production drift watch | optimize one noisy score |
| neciken-summer-poem | contest/writing workflow | current rules/deadlines | rule-drift receipt | source-verified contest fit | generic external-rule verifier | mass submission automation |
| note-filler | structured note automation | claim/source provenance | evidence locator/review ledger | evidence-linked completion | common EvidenceEnvelope | silent factual fill |
| lplrs-judicial-sync | judicial ingestion | takedown/deletion compliance | erasable durable storage | auditable tombstone/sync receipt | law-data evidence connector | immutable sensitive raw bodies in Git |
| adng-memory | operational memory | ownership/retention | activation/staleness/deletion | cross-repo memory lifecycle | shared artifact identity | vector DB for its own sake |
| cyber-prep-coach | exam coaching | mastery truth | next-best study action | evidence-grounded skill state | external AI read-only learner context later | generic chat tutoring |
| cf-ai-router | AI gateway/router | hard cost/capability gates | task reliability profiles | quota-first deterministic routing | local/provider federation | black-box provider routing |
| avatar-vfo | avatar/agent product | auth/deploy correctness | explicit effect receipts | controlled avatar automation | capability policy broker | broad autonomous side effects |
| project-doctor-web | clinical education | case truth/provenance | evidence-linked debrief | CaseSpec virtual patient | educator case export/import | real-patient clinical autonomy |
| minideck | presentation publishing | published-head correctness | artifact/version receipt | simple verified deck publishing | evidence-source bundle | full office suite |
| chatgpt-dual-pipeline | dual-agent workflow | repository identity/canonical source | explicit handoff/verification | bounded two-stage workflow | common execution receipts | orchestration sprawl |
| internship-notes-sites-mirror | notes/site mirror | canonical-source freshness | mirror drift/redirect truth | stable public distribution | read-only content feed | duplicate authoring system |
| taichung-police-intel | public police-policy intelligence | source health/gaps/canonical evidence | role priority + live reconciliation | **public Evidence MCP with exact locators** | shared EvidenceEnvelope / PublicationReceipt | write-capable police agent / raw tool explosion |
| soundbox-offline | offline audio utility | restore/offline reliability | deterministic local state | no-account offline operation | portable pack metadata | cloud account dependence |
| skill-foundry | skill packaging/promotion | artifact identity | security + runtime attestation | gated promotion pipeline | tool-surface/schema certification | marketplace growth before trust gates |
| video-timeline-pipeline | video evidence/timeline | source/time identity | local evidence escalation | bounded evidence-aware rewatch | evidence connector for downstream AI | whole-video expensive agentic default |
| ai-novel-workstation | long-form AI writing | state/resume determinism | cost envelope | auditable long-running production loop | source/rule drift receipts | unlimited unattended spending |
| clinical-scribe-worker | clinical scribe | provenance/clinical safety | specialty validation | bounded clinician-review workflow | case/evidence schemas | autonomous clinical action |
| MaterialYouNewTab | local-first productivity | privacy/local state | permission-minimal capture | local canonical workspace | optional narrow collaboration | account-first cloud rewrite |
| cf-mcp-server | Cloudflare MCP operations | exact-target confirmations | staged deployment evidence | safe explicit infra actions | MCP permission/evidence contract reuse | broad implicit authority |
| tick-stock-panel | market panel | timestamp/data provenance | stale/error truth | compact source-aware monitoring | read-only evidence export | trading execution without separate controls |
| herdr-skills | multi-agent skill workflows | runtime compatibility | bounded handoff/receipts | portable agent skills | small task-level MCP/Skill recipes | giant always-loaded tool catalogs |
| ninax-line-hermes | LINE + research/video agent | source-bound recovery + delivery receipt | resumable long-media workflow | audited bounded message delivery | evidence envelope in message cards | unbounded autonomous outbound messaging |

---

# Top 10 Cross-Portfolio Ideas

1. **EvidenceEnvelope v1** — common schema for canonical item ID, source locator, evidence state, freshness/gaps, version/hash and truncation.
2. **PublicationReceipt** — prove exactly which published artifact an external AI or downstream product queried.
3. **Small tool-surface budget** — task-level tools first; measure routing/context before adding source-specific verbs.
4. **Source-health propagation** — external AI integrations must receive stale/failed/partial/conflict, not just data rows.
5. **Public/private capability separation** — public read-only evidence servers must have no credential path into private/operational data.
6. **Snapshot-first connector canary** — prove distribution over immutable/checked publication before live upstream calls.
7. **Role projection without truth duplication** — profile changes ranking, never canonical event facts.
8. **Cross-product evidence connector harness** — one conformance suite for deterministic replay, locator validity, gaps and data-boundary negative cases.
9. **Client-facing result caps / pagination receipts** — prevent “ask one question, export the whole corpus” behavior and make truncation explicit.
10. **Distribution as a product feature** — evaluate “use trustworthy data inside the user’s existing AI” before building another embedded chatbot.

---

# Ideas Rejected / Deferred

| Idea | Decision | Reason |
|---|---|---|
| Create one MCP tool per Taichung source/dataset | REJECT | Tool sprawl; duplicates source registry and pushes routing complexity into the model. |
| Let external AI call collectors directly | REJECT | Bypasses publication/provenance gates and turns source failure semantics into client-specific behavior. |
| Add write-capable government/police actions | REJECT | Outside public-info scope; unacceptable authority expansion without a separate product/security case. |
| Add a new in-product chatbot | DEFER | Does not solve distribution; repeats UI rather than placing evidence where user already works. |
| Replace static Web with MCP | REJECT | MCP is a companion distribution surface, not a substitute for inspectable human UI. |
| Expose arbitrary SQL / filesystem / URL fetch | REJECT | Violates narrow evidence boundary and creates injection/exfiltration surface. |
| Open the same Issue in `taiwan-intel-dashboard` now | DEFER | #17/#18 trust defects must be closed first; expansion would amplify misleading state. |
| Create another Twinkle-integration Issue | REJECT | Latest `taichung-police-intel` commits already define Twinkle hybrid ingestion; #15 is outbound distribution, not another input provider. |
| Copy GovSpend authenticated opportunity actions | REJECT | Different business model and authority; public evidence read-only is the appropriate wedge. |
| Adopt community-reported numeric tool-count thresholds | REJECT | Anecdotal/self-measured data is not general benchmark evidence. |

---

# Issue Mapping / Duplicate / Coordination

| Candidate | Repository | Duplicate search | Lock/coordination | Action |
|---|---|---|---|---|
| Public read-only Evidence MCP | taichung-police-intel | No matching open/closed `MCP / external AI / AI-ready / read-only evidence` Issue; no all-state PR with same distribution fingerprint | repository `github-issue-lock:v1` search = 0; central radar records only unrelated locks | **Created #15** |
| Same outbound connector in taiwan-intel-dashboard | taiwan-intel-dashboard | No new Issue created | existing #17/#18 own higher-priority production-truth gaps | Research backlog only |
| Twinkle source expansion | taichung-police-intel | Existing #14 + new hybrid docs already own ingestion/source-promotion scope | do not split source ownership | No new Issue |
| Live meeting ingestion | taichung-police-intel | #13 owns provisional live ASR/reconciliation | separate fingerprint | No change |
| Role-specific ranking | taichung-police-intel | #12 owns Unit/Role Profile | may later become `profile_id` projection input | No change |
| Skill/MCP package security | skill-foundry | #3 already owns package security attestation | existing owner | No duplicate |

`github-issue-lock:v1`: no matching implementation lock was found for #15. This radar creates no implementation branch, code change, merge, deployment, secret/permission change or repository-setting mutation.

---

# Sources

## Official / primary product / protocol

1. GSA — 2026 Model Context Protocol Server and AI Agent Hackathon. Published 2026-09-03; rechecked 2026-09-09.  
   https://www.gsa.gov/artificial-intelligence/ai-community-of-practice/events-and-training/mcp-server-and-ai-agent-government-hackathon
2. GSA — AI Community of Practice events/training. Updated 2026-09-08.  
   https://www.gsa.gov/artificial-intelligence/ai-community-of-practice/events-and-training
3. Twinkle Hub — government open-data MCP service. Rechecked 2026-09-09.  
   https://hub.twinkleai.tw/
4. Twinkle Hub — tool marketplace, current 184-tool catalog. Rechecked 2026-09-09.  
   https://hub.twinkleai.tw/tools
5. Twinkle Hub — pricing/changelog. Rechecked 2026-09-09.  
   https://hub.twinkleai.tw/pricing
6. Twinkle AI — Twinkle Hub launch article. 2026-05-11.  
   https://twinkleai.tw/en
7. GovSpend — MCP Server launch. 2026-06-16.  
   https://govspend.com/media/govspend-launches-mcp-server/
8. GovSpend — current MCP product page. Rechecked 2026-09-09.  
   https://govspend.com/mcp-demo/
9. GovSpend — June 2026 MCP/OAuth release notes.  
   https://support.govspend.com/june-2026-release-note
10. Model Context Protocol — Authorization specification. Rechecked 2026-09-09.  
    https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization

## Community signals — anecdotal only

11. r/mcp — tool-sprawl/playbook discussion, 2026-08-13.  
    https://www.reddit.com/r/mcp/comments/1vngiit/
12. r/mcp — lazy tool discovery/context-cost self-report, 2026-09-01.  
    https://www.reddit.com/r/mcp/comments/1w4o1xg/
13. r/AI_Agents — MCP permission/tool allowlisting discussion, 2026-09-07.  
    https://www.reddit.com/r/AI_Agents/comments/1w9op5p/

---

# What Changed Since Last Radar (r4)

1. **New external market signal:** GSA’s official Sep–Nov 2026 government MCP hackathon is now a strong, current indicator that “government data as AI-ready MCP” is becoming an explicit public-sector delivery pattern, not only an isolated startup feature.
2. **New internal product readiness signal:** `taichung-police-intel` landed a hybrid Twinkle + direct-official routing/provenance design after r4. The repo now has a clearer ingestion/trust contract from which a safe outbound projection can be built.
3. **New high-value Issue:** created `taichung-police-intel #15` for a read-only Evidence MCP; Opportunity Score 93/100.
4. **No change to r4 Project Doctor direction:** `project-doctor-web #11` remains the owner of CaseSpec/virtual-patient/debrief research. No duplicate clinical feature created.
5. **`taiwan-intel-dashboard` remains expansion-blocked:** new audit evidence reinforces #17/#18; no connector/MCP Issue opened there this round.
6. **Portfolio principle refined:** prior rounds emphasized authoritative truth, explicit approval, receipts and versioning. This round adds a distribution rule: **canonical evidence must stay canonical when it crosses into somebody else’s AI.**

## Round conclusion

This is a notification-worthy round because it produced both:

- a new high-value product opportunity; and
- a reusable cross-portfolio distribution primitive.

The strategic recommendation is narrow: **make trusted public evidence easier to consume from external AI tools, but do not make the external AI more authoritative than the evidence it queried.**
