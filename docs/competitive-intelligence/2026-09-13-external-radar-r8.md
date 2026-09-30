# External Inspiration Radar — 2026-09-13 r8

> Scope: Reese-max owned + unarchived repositories, with product-like repositories scored for market opportunities. Public web is the primary research source; GitHub is used for current product truth, recent-work checks, duplicate/lock checks, and Issue mapping. This round does **not** modify product source code, create implementation branches, merge, deploy, change secrets/permissions, or alter repository settings.

## Executive Summary

This round found a **major competitor strategy change** and one high-value product opportunity, but did **not** create a GitHub Issue because the most relevant repository (`Reese-max/claude-mem`) has GitHub Issues disabled. The attempted Issue creation returned HTTP/GitHub status **410: “Issues has been disabled in this repository.”** Per coordination rules, repository settings were not changed and the opportunity is retained here as `[Research][RESEARCH_REQUIRED]` rather than being forced into an unrelated repository.

### Highest-value opportunity — Temporal Memory Truth + Recall Receipt

**Target:** `claude-mem` first; reusable by `autodev-ng`, `ai-novel-workstation`, `herdr-skills`, and other long-running agents.  
**Opportunity Score:** **93/100**.  
**Fingerprint:** `memory-truth-lifecycle:v1`.

The market signal is not merely “agents need memory.” It is that memory products are converging on three distinct layers that must not be conflated:

`Past Evidence → Current/Temporal Truth → Runtime Authority`

The proposed Reese-max primitive is:

`Observation → Memory Candidate → Temporal/Source State → Retrieval → Freshness/Conflict Gate → Context Injection → RecallReceipt`

with a strict invariant:

**`Memory Evidence ≠ Current Truth ≠ Runtime Authority`.**

The strongest new strategic signal is Supermemory’s **2026-09-09 discontinuation of Company Brain and Nova**, announced on **2026-09-10**. Supermemory explicitly retained its MCP/plugins and moved functionality toward its developer console/API, stating that adding more application surfaces diluted product clarity, created channel conflict with customers building their own agent products, and left the broader app experience merely average. This is a rare “unshipping” signal: for Reese-max memory products, it argues for strengthening the memory engine, portable integrations, truth lifecycle, and inspection receipts before expanding a standalone second-brain/company-brain surface.

This round also cross-validates the opportunity with Zep’s temporal fact lifecycle (`created_at`, `valid_at`, `invalid_at`, `expired_at`), Supermemory’s visible recall/save status line, and recent research on portable/governed memory layers. Community discussions are used only as anecdotal failure-mode evidence for stale recall and context/token overhead.

---

# Portfolio Snapshot / Product → Market Category

Current connected GitHub truth shows **37 Reese-max owned + unarchived repositories**. Two are support artifacts rather than end-user products and are kept in the map for coordination but excluded from product-opportunity scoring: `adng-memory` explicitly says it is not a product-code repository; `internship-notes-sites-mirror` is a mirror/publishing support repository. Product-like scoring baseline for this round: **35 repositories**.

| Repository | Market / product category | Current-round GitHub signal |
|---|---|---|
| exam-archive | exam source archive / study data | no new high-priority item in recent scan |
| police-exam-practice | police-exam practice / learning | no new high-priority item in recent scan |
| police-exam-archive | police-exam archive / provenance | recent documentation/persona-audit activity |
| 92-duty-scheduler | duty roster / scheduling / LINE self-service | Duty Inbox / self-service swap work already active; avoid duplicate workflow Issue |
| UkePack | MusicXML → child-friendly ukulele practice pack | current README confirms teacher review, practice audio, private sharing, beta workflow |
| ppt-studio | AI presentation editor/export | #5 Structured Slide State + Render Verification already covers current external direction |
| voice-actress | grounded legal/evidence QA | existing provenance/citation-validation direction remains valid |
| taiwan-intel-dashboard | multi-source intelligence dashboard | provenance/monitoring direction remains primary |
| autodev-ng | AI SDLC / agent orchestration/control plane | many active safety/reliability primitives; no duplicate memory Issue created here |
| flux-image-gen | AI image generation/editing | #22 creative edit session/reference lineage already active |
| claude-mem | persistent coding-agent memory | **new high-value opportunity: temporal truth lifecycle + recall receipt; Issue tracker disabled** |
| lobsterpulse | information monitoring / attention queue | #9 decision-only attention queue remains the relevant simplification direction |
| prompt-autoresearch | prompt optimization / autoresearch | current CI/evidence reliability work remains higher priority |
| neciken-summer-poem | creative writing / contest submission workflow | #4 fail-close submission/provenance remains higher priority than feature expansion |
| note-filler | structured notes/forms | correction/review provenance direction remains active |
| lplrs-judicial-sync | judicial/public-data sync | #5 exact-date coverage outage/recovery remains the dominant product risk |
| adng-memory | operational patrol-memory evidence store | **support artifact; README explicitly says not product-code** |
| cyber-prep-coach | cybersecurity exam coach | no new high-priority item in recent scan |
| cf-ai-router | model routing / AI cost control | cost truth/accounting remains preferred over more routing surface |
| avatar-vfo | role/personality simulation engine | README confirms evolving internal-state dashboard + multi-provider proxy architecture |
| project-doctor-web | project diagnostics / project health | no new high-priority item in recent scan |
| minideck | compact slide/deck creation | CI/default-branch receipt reliability remains a known concern |
| chatgpt-dual-pipeline | multi-model / dual-pipeline AI workflow | no new high-priority item in recent scan |
| internship-notes-sites-mirror | publishing/site mirror | **support/publishing artifact; excluded from feature scoring** |
| taichung-police-intel | public-sector intelligence / evidence monitor | provenance + source freshness remain core differentiation |
| soundbox-offline | offline/local media player | CI gate work remains higher priority than cloud feature expansion |
| skill-foundry | skill creation/evaluation/distribution | #5 demo-to-skill and #6 deterministic CI gate already active |
| video-timeline-pipeline | evidence-to-video/NLE automation | #18 cost-timezone correctness and #11 NLE handoff work remain active |
| ai-novel-workstation | long-form writing workstation | #6 typed story workspace already covers external-agent access |
| clinical-scribe-worker | clinical documentation | section repair/manual-edit preservation already active |
| MaterialYouNewTab | browser new-tab / personalization | no new high-priority item in recent scan |
| cf-mcp-server | MCP/SaaS tool server | #15 Tool Contract Manifest + Drift Gate remains active |
| tick-stock-panel | stock/strategy analysis | #6 Python isolation and #7 CI/release receipt remain higher priority |
| herdr-skills | agent skills/policy improvement | correction→candidate→validation direction already exists |
| ninax-line-hermes | LINE AI gateway / ordered messaging | messaging correctness remains higher priority than broader agent features |
| ai-flight-radar | flight intelligence / fare tracking | calibration/provenance/licensing Issues remain higher priority |
| academic-mcp | scholarly retrieval / research-agent gateway | #9 progressive tool exposure created last round; do not duplicate |

---

# External Signals

## A. Direct competitor recent capability / strategy

### A1. CONFIRMED — Supermemory unships Company Brain and Nova, doubles down on the memory engine

**Event date:** Company Brain/Nova stopped **2026-09-09**.  
**Announcement:** **2026-09-10**.  
**Source:** https://supermemory.ai/blog/an-update-to-supermemory/

**What changed**

Supermemory discontinued its Company Brain and Nova application surfaces, refunded paid users, kept MCP/plugins operating, and moved functionality toward the developer platform/console. Its founder gives three product reasons: focus/clarity, strategic positioning around memory infrastructure rather than a broad company-brain product, and channel conflict with developers/startups that already use the memory engine.

**Job-to-be-Done:** give any agent durable memory without forcing the user/developer to adopt an additional standalone knowledge-work application.

**Why it can save time/steps:** a common memory plane across Claude Code, Codex, Cursor/OpenCode/MCP clients removes repeated export/import or copy/paste of context and avoids requiring users to maintain a second canonical workspace.

**Onboarding/distribution:** integration-first distribution—MCP, plugins, SDK/API—rather than a separate destination app.

**New capability/business-model signal:** the monetizable surface is increasingly memory infrastructure and developer usage, while application surfaces can become channel conflict. This is a strategic signal, not proof that APIs always monetize better.

**Known limitation/failure signal:** Supermemory itself says the broader product became average because effort was spread across too many surfaces. This is first-party strategy evidence, not an independent efficacy benchmark.

**Reese-max adaptation:** for `claude-mem`, keep the local viewer as inspection/control UI, but do not expand it into a broad PKM/company-brain product before the engine’s truth lifecycle, cost, portability, and receipts are strong.

**Do not copy:** do not remove useful local inspection UI merely because a competitor removed a standalone app; Reese-max has a different deployment/user context.

### A2. CONFIRMED — Supermemory makes invisible recall visible in the coding-agent status line

**Date:** **2026-08-21**.  
**Source:** https://supermemory.ai/changelog/plugins/

Supermemory’s Claude Code plugin automatically recalls relevant memories and shows a live status line with loaded/captured/recall counts plus time since last save/recall.

**JTBD:** know whether persistent memory actually participated in the current session without opening another dashboard.

**Workflow advantage:** reduces “did it remember?” manual checking and makes background memory mutation observable.

**Transferable principle:** automatic context mutation should leave a lightweight `RecallReceipt`.

**Reese-max fit:** `claude-mem` already has observation IDs/citations, progressive disclosure, and a viewer. The next step is to connect recall provenance + freshness state to a session-visible receipt rather than inventing another UI.

---

## B. Adjacent-domain transferable workflow

### B1. CONFIRMED — Freed turns user edits into opt-in, versioned personalization

**Source checked:** 2026-09-13.  
**Sources:**
- https://help.getfreed.ai/en/articles/11644153-use-templates-to-format-your-notes
- https://help.getfreed.ai/en/articles/11796456-templates-that-learn

Freed’s Learned Templates can observe clinician edits and update a template in the background. Crucially, Auto Learn is **off by default**, only applies to eligible owned templates, and keeps version history with rollback.

**JTBD:** stop repeatedly fixing the same documentation style/structure after every generated note.

**Why it feels faster:** ordinary correction work becomes future personalization instead of a separate “configure the AI” task.

**Onboarding/distribution:** no separate model-training UI; the product learns from edits in the workflow users already perform.

**New pattern:** `Correction → Candidate preference update → versioned policy/template state`.

**Pricing/business signal:** deeper personalization is used to increase workflow stickiness inside the main documentation product, rather than sold as a separate memory app.

**Limit:** vendor-reported editing-time reductions are not used here as independent proof. Automatic learning can encode accidental edits if ownership/review boundaries are weak.

**Reese-max fit:** this pattern is transferable to `clinical-scribe-worker`, `note-filler`, `herdr-skills`, `ppt-studio`, and `UkePack` teacher-review templates—but existing Issues already cover section repair/correction-derived candidates in several of these products, so no duplicate Issue is opened.

**Do not copy:** do not silently turn every manual edit into global policy; scope, ownership, versioning, and rollback are mandatory.

---

## C. Emerging tool / technical possibility

### C1. CONFIRMED — Zep treats fact truth as bi-temporal state, not a single timestamp

**Current official docs checked:** 2026-09-13.  
**Sources:**
- https://help.getzep.com/facts
- https://help.getzep.com/searching-the-graph
- https://help.getzep.com/how-graph-creation-works

Zep distinguishes:
- `created_at`: when the system learned a fact;
- `valid_at`: when it became true in the world;
- `invalid_at`: when it stopped being true;
- `expired_at`: when the system learned it was false/outdated.

New contradictory evidence can invalidate an older fact while preserving history.

**Product possibility:** memory retrieval can answer both “what is true now?” and “what was true then?” without deleting older evidence.

**Reese-max adaptation:** a first version does not need Zep’s full temporal graph. `claude-mem` can start with a small lifecycle contract attached to observations/derived memories and a conservative injection gate.

### C2. CONFIRMED RESEARCH SIGNAL — portable/governed memory layers are adding conflict resolution and verifiable lifecycle semantics

**MindMemOS:** 2026-08-12 — https://arxiv.org/abs/2608.12428  
**SuperLocalMemory 4.0:** 2026-08-08 — https://arxiv.org/abs/2608.08253

These research systems describe portable/self-evolving memory, correction/conflict handling, bi-temporal recall, audit trails, erasure, and verifiable memory transactions.

**Interpretation:** the emerging product opportunity is no longer only “better vector search.” It is **memory state governance**: what changed, why, whether it is still valid, which agent may see it, and whether a write/read completed as intended.

**Important:** paper benchmark numbers are not used as expected Reese-max performance.

---

# New Releases / Recent Moves

| Date | Product/ecosystem | Change | Radar interpretation |
|---|---|---|---|
| 2026-09-10 | Supermemory | announced discontinuation of Company Brain + Nova | major strategy shift toward memory infrastructure/API/plugins |
| 2026-09-09 | Supermemory | Company Brain/Nova service stopped | “unshipping” is itself a product-design signal: simplify surface area |
| 2026-08-24 | Supermemory MCP | auth outage now returns 503/Retry-After instead of invalid_token | protocol error semantics matter because wrong errors can destroy client state |
| 2026-08-21 | Supermemory plugin | automatic recall + live status line | background memory activity becomes observable |
| 2026-08-12 | MindMemOS | portable/self-evolving memory research | conflict/correction becomes part of memory lifecycle |
| 2026-08-08 | SuperLocalMemory 4.0 | governed/local-first memory research | verifiable write/erase/audit semantics move into memory infrastructure |
| current | Zep | temporal fact lifecycle in product docs | real-world validity and system-learned time are separate concepts |

---

# Community Pain Points

All items in this section are **COMMUNITY_SIGNAL** only and are not treated as representative market statistics.

1. **Stale truth can be more dangerous than no memory.** A 2026-07-08 practitioner described an agent recalling a formerly correct value after ground truth changed and proposed source quotes + deterministic storage gates.  
   Source: https://www.reddit.com/r/AI_Agents/comments/1uqj252/my_agents_kept_remembering_things_that_werent/
2. **Freshness is under-measured.** A 2026-08-04 discussion argues that common memory evaluations over-focus on recall while ignoring whether recalled facts remain current.  
   Source: https://www.reddit.com/r/AI_Agents/comments/1vfbda5/every_agent_memory_system_is_benchmarked_on/
3. **Memory can consume too much context/cost if capture/recall is too eager.** A 2026-03-27 `claude-mem` user reported heavy token consumption and store growth. Exact percentages are anecdotal and are not reused as benchmark expectations.  
   Source: https://www.reddit.com/r/ClaudeCode/comments/1s52ggk/claudemem_was_eating_58_of_my_tokens_heres_the/
4. **Stale memories need explicit lifecycle semantics.** Multiple user discussions describe old context being treated as equally true forever. Treat this as a regression hypothesis to test, not proof of a current Reese-max production defect.

---

# Opportunity Scores

Scoring combines User Pain, Strategic Fit, Novelty, Evidence Strength, Reuse Potential, Implementation Effort, and Security/Privacy/Cost Risk. Higher score means stronger opportunity after implementation/risk penalties; it is not a probability of success.

| Candidate | Score | Decision |
|---|---:|---|
| `claude-mem`: Temporal Memory Truth + Recall Receipt | **93** | HIGH VALUE; retain as RESEARCH_REQUIRED; Issue creation blocked because repository Issues are disabled |
| Cross-portfolio: Engine-first / thin application surfaces for memory | **91** | strategic direction; no standalone Issue required |
| Correction-derived personalization with opt-in/version history | **89** | reuse existing `clinical-scribe-worker` / `herdr-skills` / note-review work; no duplicate |
| Historical-vs-current query lane for intelligence/agent memory | **88** | research list; reuse provenance primitives before new framework |
| Token/cost-aware memory injection budget | **86** | research list; measure before changing retrieval defaults |
| Full temporal knowledge graph replacement for `claude-mem` | **66** | reject for now: too much architecture/operational cost before simpler lifecycle contract is tested |

---

# Proposed High-value Research Contract

## `[Research][RESEARCH_REQUIRED] Temporal Memory Truth + Recall Receipt`

### User workflow

Current safe workflow often becomes:

`Recall → manually inspect age/source → compare current repo/runtime → correct agent → continue`

Target workflow:

`Recall → CURRENT/STALE/INVALIDATED/UNKNOWN + source IDs → conservative injection → continue`

Historical information remains searchable without being silently presented as current truth.

### Minimal contract

Candidate fields/semantics:

- `observed_at`
- `valid_from` / `valid_to` when evidence supports them
- `last_verified_at`
- `freshness_state = CURRENT | STALE | INVALIDATED | UNKNOWN`
- `supersedes` / `superseded_by`
- source observation/session IDs
- optional `memory_kind = durable | working | preference | authority_reference`

`authority_reference` remains evidence. A remembered approval must never grant deploy/spend/secret/write authority.

### Minimum deliverable

1. backwards-compatible truth-state metadata;
2. explicit invalidate/supersede without deleting history;
3. conservative auto-injection for stale/conflicting/unknown operational facts;
4. session-visible `RecallReceipt` listing injected IDs, freshness state, source and inclusion reason;
5. deterministic fixtures for changed host/version, reversed decision, undated conflict, explicit correction, historical query;
6. preserve `<private>`, progressive disclosure, viewer, and cloud-sync boundaries.

### Acceptance Criteria

- Existing stores remain readable or have deterministic migration/rollback guidance.
- System-observed time and real-world validity time are not conflated when both are known.
- Undated evidence is `UNKNOWN`, not silently `CURRENT`.
- Contradicted facts can be invalidated/superseded while remaining historically searchable.
- Stale/invalidated records do not silently auto-inject as current operational truth.
- Every automatically injected memory item has an inspectable source ID + truth state.
- Existing privacy exclusions continue to hold.
- Memory records cannot confer runtime effect authority.

### Success Metrics

- unsafe stale injection rate = 0 on deterministic contradiction fixtures;
- no regression on current-truth retrieval for non-conflicting baseline cases;
- historical query still retrieves superseded truth when explicitly requested;
- 100% receipt coverage for automatically injected memory;
- measure, do not assume, token/latency impact versus current progressive-disclosure baseline.

### Main risks

False invalidation; ambiguous dates; migration complexity; costly auto-verification; sync races; users interpreting `CURRENT` as stronger verification than evidence actually supports.

### Runtime Verification Requirement

A real local Claude Code/OpenCode run must:
1. recall a known fact with a receipt;
2. ingest contradictory later evidence;
3. retain the old fact for historical lookup;
4. stop injecting the old fact as current truth;
5. show the new truth state/source in viewer/receipt;
6. survive worker/client restart;
7. if cloud sync is enabled, verify second-client read-back without exposing `<private>` content.

A model merely saying “I remembered the new value” is not verification.

---

# Opportunity Map

These entries are intentionally compact. “DO NOT COPY” is as important as “ADD.” For support artifacts, the map is coordination-only rather than feature scoring.

| Repository | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| exam-archive | source/provenance integrity | searchable historical indexing | exam-source truth ledger | diagnostic-to-study handoff | AI-generated answers without source state |
| police-exam-practice | reliable question/answer provenance | misconception-quality feedback | Taiwan police-exam-specific mastery model | adaptive next-best practice | mode sprawl |
| police-exam-archive | immutable source lineage | easier source→practice conversion | police-specific historical corpus | auto-linked concept map | silently rewriting historical questions |
| 92-duty-scheduler | policy-safe roster correctness | self-service confirmation/swap | auditable human-policy scheduling | correction-derived preferences | opaque AI auto-assignment |
| UkePack | editable teacher-reviewed practice pack | reduce teacher prep/rework | deterministic difficulty + playable output | edits→versioned teacher template | replacing teacher judgment with one-shot AI |
| ppt-studio | native editable structure | render/export verification | structured-object patch receipts | edit corrections→style candidates | rasterized “editable” output |
| voice-actress | claim/source support | counterevidence visibility | legal evidence state machine | temporal authority status | citation existence = correctness |
| taiwan-intel-dashboard | source freshness/provenance | contradiction/coverage display | multi-source government intelligence | current-vs-historical truth lane | summaries without evidence links |
| autodev-ng | runtime authority boundaries | reusable receipts/control primitives | evidence-backed agent SDLC | memory truth receipt reuse | `trusted_agent=true` super-authority |
| flux-image-gen | controllable edit lineage | drift/outside-region checks | candidate/reference graph | object/region truth receipts | one-shot destructive edit |
| claude-mem | persistent low-friction memory | **freshness/conflict + RecallReceipt** | portable local-first truth-aware memory | thin viewer + engine distribution | standalone company-brain sprawl; silent stale recall |
| lobsterpulse | actionable signal triage | suppress repeated/seen noise | decision-only attention queue | memory-aware “already saw” suppression | notifying every signal |
| prompt-autoresearch | reproducible eval evidence | holdout/selection discipline | autonomous but auditable prompt research | memory of failed hypotheses with expiry | self-scored improvements without independent gate |
| neciken-summer-poem | provenance/submission compliance | clear human/AI boundary | fail-close contest workflow | versioned creative decisions | submitting when rules prohibit AI |
| note-filler | user-owned field preservation | versioned correction learning | structured data + review ledger | Freed-like opt-in learned template | silently generalizing every edit |
| lplrs-judicial-sync | exact-date coverage truth | gap/backfill accounting | irrecoverable-gap receipt | temporal validity model | treating schedule success as coverage |
| adng-memory | ownership/retention contract | freshness/health evidence | append-only patrol evidence | truth-state terminology reuse | turning evidence store into authority/product UI |
| cyber-prep-coach | grounded curriculum/answers | adaptive diagnostics | cybersecurity-specific mastery state | plausible distractor eval | infinite AI-generated quiz modes |
| cf-ai-router | truthful cost/provider accounting | cache-aware cost receipt | fail-closed cost routing | temporal pricing validity | dynamic paid route without auditable cost |
| avatar-vfo | deterministic state persistence | explain state transitions | inspectable persona-state simulation | memory truth for evolving relationship state | presenting model-internal scores as psychological fact |
| project-doctor-web | reproducible project diagnostics | evidence-linked remediation | health receipt across toolchains | recurring regression memory | “AI says healthy” without checks |
| minideck | native editable deck output | default-branch runtime receipt | small deterministic deck surface | ppt-studio object contract reuse | adding modes before CI proves shipping path |
| chatgpt-dual-pipeline | clear model/provider provenance | retry/fallback semantics | explicit dual-model comparison | disagreement/counterevidence lane | silent fallback pretending same provider/result |
| internship-notes-sites-mirror | faithful publishing mirror | deterministic sync/read-back | historical publishing evidence | none | treating mirror as product source of truth |
| taichung-police-intel | evidence freshness | contradiction/coverage queue | public-sector decision briefing | temporal memory truth lane | anecdotal/social signal as official fact |
| soundbox-offline | offline-first playback | deterministic packaging/CI | local privacy/no-cloud dependency | local media annotation memory | cloud dependency for basic playback |
| skill-foundry | candidate→eval→promotion | deterministic CI + privacy | evidence-backed skill lifecycle | edit/demo corrections as candidates | demo = certified skill |
| video-timeline-pipeline | evidence-backed cuts | NLE read-back + cost truth | typed CutSpec/receipts | memory of editorial decisions | MCP connected = mutation verified |
| ai-novel-workstation | canonical story state | stale-base protection | typed story candidate patches | temporal character/world-state memory | raw filesystem authority for agents |
| clinical-scribe-worker | edit-safe clinical note repair | user-owned/manual-edit preservation | section-scoped verified mutation | Freed-like opt-in learned formatting | auto-learning clinical facts from formatting edits |
| MaterialYouNewTab | fast/local new-tab UX | low-permission integrations | privacy-preserving personalization | local preference memory | turning new tab into heavy agent platform |
| cf-mcp-server | truthful tool contract/effects | drift/version/read-back | ToolContractManifest gate | memory of contract changes as evidence | server identity = current authority |
| tick-stock-panel | deterministic strategy definition | isolated custom code | auditable strategy receipts | temporal market assumption state | in-process generated Python as sandbox |
| herdr-skills | correction→candidate→validation | versioned behavior changes | multi-agent governed skill evolution | truth-aware memory of steering history | correction = immediate global policy |
| ninax-line-hermes | message order/idempotency | recoverable human handoff | LINE-native agent gateway | thin persistent thread memory | adding channels before ordering correctness |
| ai-flight-radar | calibrated source/licensing truth | reliable alert/quote receipts | evidence-backed fare/flight radar | seen-price memory + threshold suppression | scraping/alerts without licensing/calibration |
| academic-mcp | source-specific scholarly semantics | progressive tool exposure eval | 81-tool canonical catalog + source truth | memory of research bundles with freshness | semantic tool match = provider substitution |

---

# Top 10 Cross-Portfolio Ideas

1. **Memory Truth Lifecycle** — add current/stale/invalidated/unknown semantics wherever long-running agents reuse old context.
2. **RecallReceipt** — every automatic memory/context injection should expose what was injected, why, and from which source/time.
3. **Engine-first / thin surfaces** — prefer reusable infrastructure + integrations over duplicating full destination applications.
4. **Correction → Candidate → Versioned Promotion** — user edits are evidence for future behavior, not immediate global policy.
5. **System Time ≠ Real-world Validity Time** — useful for intelligence, legal data, schedules, memory, pricing, and research claims.
6. **Historical lane vs operational-current lane** — preserve old truth for audit/history while preventing unsafe current use.
7. **Context Budget Receipt** — memory/tool injection should make token/latency/cost visible instead of becoming invisible overhead.
8. **Evidence ≠ Authority** — remembered approvals/policies may explain prior actions but cannot authorize new external effects.
9. **Conflict Set before overwrite** — contradictory source evidence should produce explicit conflict/invalidation state, not last-write-wins by default.
10. **Simplification as opportunity** — remove/avoid secondary canonical UIs when an existing host (Claude/Codex/LINE/NLE/PowerPoint) can remain the user’s working surface.

---

# Ideas Rejected / Deferred

1. **Build a full Company Brain/PKM app around `claude-mem` now — REJECT.** Supermemory’s 2026-09 strategy reversal is evidence that surface expansion can dilute the infrastructure product; `claude-mem` already has an inspection viewer.
2. **Auto-delete stale memories — REJECT.** Historical truth remains useful; mark validity instead of destroying provenance.
3. **Replace `claude-mem` with a cloud temporal graph — DEFER.** Test a lightweight lifecycle contract first; preserve local-first/privacy behavior.
4. **Let the LLM decide conflict resolution silently — REJECT.** Ambiguous contradictions need deterministic state + evidence or human review.
5. **Create the blocked `claude-mem` Issue in `autodev-ng` instead — REJECT.** That would create scope drift merely to work around repository settings.
6. **Use vendor benchmark percentages as targets — REJECT.** Vendor/research benchmarks are context-specific and do not establish Reese-max performance.
7. **Turn every manual note edit into learned policy — REJECT.** Require opt-in/scope/version/rollback.

---

# Issue Mapping / Duplicate & Coordination Check

| Opportunity | Existing work / check | Action this round |
|---|---|---|
| Temporal Memory Truth + Recall Receipt | `claude-mem` current README verified; repo search found no `last_verified` / `expires` / temporal truth contract; GitHub Issues list is empty | attempted new Issue; GitHub returned **410 “Issues has been disabled in this repository”**; retained in radar only; no settings changes |
| Correction-derived personalization | `clinical-scribe-worker` section-repair/manual-edit preservation and `herdr-skills` correction→candidate work already exist | no duplicate Issue/update |
| Progressive tool discovery | `academic-mcp#9` created last round | no duplicate |
| MCP contract drift | `cf-mcp-server#15` already active | no duplicate |
| Presentation object edits | `ppt-studio#5` already active | no duplicate |
| Browser scoped authority | `autodev-ng#28` already active | no duplicate |
| Generated/custom strategy execution | `tick-stock-panel#6` already active | no duplicate |

No product source code, implementation branch, merge, deploy, secret, permission, or repository setting was changed.

---

# Sources

## First-party / official

1. Supermemory — **An update to supermemory** — 2026-09-10  
   https://supermemory.ai/blog/an-update-to-supermemory/
2. Supermemory — **Plugins & MCP changelog** — entries 2026-08-21 / 2026-08-24  
   https://supermemory.ai/changelog/plugins/
3. Zep — **Facts** — current docs checked 2026-09-13  
   https://help.getzep.com/facts
4. Zep — **Searching the Graph** — current docs checked 2026-09-13  
   https://help.getzep.com/searching-the-graph
5. Zep — **How Graph Creation Works** — current docs checked 2026-09-13  
   https://help.getzep.com/how-graph-creation-works
6. Freed — **Use Templates to format your notes** — current help page checked 2026-09-13  
   https://help.getfreed.ai/en/articles/11644153-use-templates-to-format-your-notes
7. Freed — **Templates that learn** — current help page checked 2026-09-13  
   https://help.getfreed.ai/en/articles/11796456-templates-that-learn

## Research

8. MindMemOS — 2026-08-12  
   https://arxiv.org/abs/2608.12428
9. SuperLocalMemory 4.0 — 2026-08-08  
   https://arxiv.org/abs/2608.08253

## Community signals — anecdotal only

10. Stale agent memory / source gate discussion — 2026-07-08  
    https://www.reddit.com/r/AI_Agents/comments/1uqj252/my_agents_kept_remembering_things_that_werent/
11. Freshness-oriented memory benchmark discussion — 2026-08-04  
    https://www.reddit.com/r/AI_Agents/comments/1vfbda5/every_agent_memory_system_is_benchmarked_on/
12. `claude-mem` token-overhead user report — 2026-03-27  
    https://www.reddit.com/r/ClaudeCode/comments/1s52ggk/claudemem_was_eating_58_of_my_tokens_heres_the/

---

# What Changed Since Last Radar (r7 → r8)

1. **Major new strategy signal:** Supermemory discontinued Company Brain and Nova and explicitly repositioned around its memory engine/API/plugins.
2. **New high-value opportunity:** `Temporal Memory Truth + Recall Receipt`, score **93/100**, targeted first at `claude-mem`.
3. **Issue filing was blocked by repository configuration:** `claude-mem` has Issues disabled; no attempt was made to change settings or spill the Issue into another repo.
4. **Portfolio truth corrected:** the current connected Reese-max owned/unarchived list is 37 repositories; the stale r7 table contained older repositories no longer present in the current connected baseline. This r8 uses the current list and separates two support artifacts from the 35 product-like repos.
5. **New simplification direction:** do not expand memory products into another canonical “company brain” surface merely because the engine can support it.
6. **New reusable invariant:** `Memory Evidence ≠ Current Truth ≠ Runtime Authority`.
7. Existing high-priority work in `academic-mcp`, `cf-mcp-server`, `ppt-studio`, `tick-stock-panel`, `video-timeline-pipeline`, `skill-foundry`, `lplrs-judicial-sync`, and `autodev-ng` remains higher priority than opportunistic feature expansion.
