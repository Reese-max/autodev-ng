# External Competitive / Product Inspiration Radar — 2026-09-07 r7

> Scope: all 40 Reese-max owned, non-archived repositories visible to the connected GitHub installation. Public web outside Reese-max GitHub is the primary research source. Repository/Issue/PR evidence is used to resolve product identity, readiness, duplication and safety. `COMMUNITY_SIGNAL` entries are anecdotal and are not market-share, efficacy, safety-rate or incident-rate claims.

## Executive Summary

Round 7 produced **three new high-value GitHub Issues** and one important no-duplicate decision:

1. **`ninax-line-hermes #1` — LINE message revision / webhook redelivery lifecycle.** LINE added `messageEdited` webhook events on 2026-08-12. LINE also documents duplicate and out-of-order webhook redelivery. The current repository has a long-running video second-pass + review + delivery workflow, but repository search found no `messageEdited`, `isRedelivery`, unsend or revision-head handling. A stale video job must not be allowed to deliver an answer for a message the user already changed. **Classification: MUST MATCH / P1 RELIABILITY. Opportunity Score: 96/100.**
2. **`clinical-scribe-worker #4` — specialty-scoped Clinical Validation Packs.** The repo already has a strong 8-case synthetic live evaluation, source-fidelity and plan-safety gates. Current ambient-scribe competition is moving toward specialty-specific models, continuous improvement tracking and real-world multi-specialty validation. The correct next step is broader evidence scope, not more autonomous clinical actions. **Classification: RESEARCH_REQUIRED / SAFETY. Opportunity Score: 95/100.**
3. **`adng-memory #4` — Memory Activation / Staleness / Deletion Contract.** 2026 memory systems/research increasingly treat persistent memory as governed temporal state, not simply retrieval. The repository already has ownership/retention/recovery documentation but no standard `valid_time / transaction_time / predecessor / disposition / tombstone / derived lineage` contract. **Classification: RESEARCH_REQUIRED / RELIABILITY / PRIVACY. Opportunity Score: 94/100.**
4. **`lplrs-judicial-sync` — no duplicate Issue.** New memory/deletion research reinforces the need for deletion to propagate through derived stores, but existing `lplrs-judicial-sync #1` already covers the essential problem: removed judgments can remain recoverable from Git history. This round does not create a second deletion ticket.

The strongest new cross-portfolio pattern is:

> **Every durable input/state/output should have an explicit current head, lineage and invalidation rule. “Stored”, “generated” or “received” is not the same as “currently authoritative”.**

That pattern now applies to agent memory, LINE messages, clinical validation, judicial takedowns, prompt champions, Skill certification, provider capabilities, deck claims and generated-image provenance.

---

## Product → Market Category / Opportunity Map

| Repository | Category | r7 classification | Current decision |
|---|---|---|---|
| gemini-deidentifier | AI RPG / interactive-fiction repo with identity mismatch | SHOULD SIMPLIFY | Resolve product identity before expansion |
| exam-archive | Police-exam archive / public reference | MUST MATCH | Provenance, deterministic build, performance first |
| police-exam-practice | Police-exam practice | SHOULD BE BETTER | Reuse learner-profile primitives; avoid parallel learner state |
| police-exam-archive | Exam corpus / provenance archive | MUST MATCH | Source/image/answer fidelity over new modes |
| 92-duty-scheduler | Constraint-based duty scheduling | DIFFERENTIATOR | Existing #19 explainable repair plans remains high value |
| openab | Discord ↔ ACP remote coding-agent broker | MUST MATCH / SECURITY | Human permission broker remains ISSUE_WRITE_BLOCKED because Issues disabled |
| UkePack | MusicXML → child-friendly ukulele practice pack | SHOULD VALIDATE | Teacher Beta evidence before player/workspace breadth |
| ppt-studio | AI presentation workstation | DIFFERENTIATOR | Existing #3 slide/claim provenance remains the moat |
| book5-windows-server-2022 | Learning/content presentation site | SHOULD SIMPLIFY | Accessibility, build and learning flow before AI breadth |
| obsidian-vault | Personal knowledge/content repository | ADJACENT IDEA | Interop only where it removes a concrete manual step |
| voice-actress | Essay grading/coaching | MUST VERIFY THEN IMPROVE | Runtime/calibration proof before personalization expansion |
| taiwan-intel-dashboard | Paused intelligence dashboard | DO NOT ADD NOW | Recovery/reliability posture remains dominant |
| autodev-ng | Multi-agent software-delivery orchestrator | SHOULD BE BETTER | Reuse state-activation / evidence semantics; not agent-count growth |
| flux-image-gen | AI image generation/edit workspace | DIFFERENTIATOR | Existing #18 artifact provenance remains active |
| claude-mem | Upstream persistent-memory fork | UPSTREAM FORK | Track upstream unless deliberate divergence is declared |
| lobsterpulse | AI CLI quota/session monitor | SHOULD BE BETTER | State freshness/config integrity before new notification breadth |
| prompt-autoresearch | Autonomous prompt/eval optimizer | RESEARCH_REQUIRED | Existing #3 variance-aware stability gate remains active |
| neciken-summer-poem | AI literary workflow | MUST FIX | CI/reliability before expansion |
| note-filler | Evidence-grounded legal/admin augmentation | DIFFERENTIATOR | Existing claim-level Verify/Accept/Reject workflow remains correct |
| gooaye | Empty placeholder | N/A | Define product purpose or archive |
| lplrs-judicial-sync | Judicial data synchronization | MUST MATCH / PRIVACY | Existing #1 effective takedown deletion; no duplicate |
| **adng-memory** | Cross-repo operational memory/state store | **RESEARCH_REQUIRED** | **NEW #4 activation/staleness/deletion contract** |
| cyber-prep-coach | iPAS exam preparation | DIFFERENTIATOR | Existing #4 mastery profile / explainable next action |
| cf-ai-router | AI provider router | RESEARCH_REQUIRED | Task-reliability routing only after evidence/capability truth |
| avatar-vfo | AI avatar/chat | DO NOT ADD NOW | Security/release evidence dominates |
| project-doctor-web | Clinical teaching/research UI | DO NOT ADD NOW | Current regressions/runtime gates first |
| minideck | Presentation/deck workflow | MUST MATCH | Share/version/privacy authority before breadth |
| chatgpt-dual-pipeline | Internship-notes publication product | SHOULD SIMPLIFY | Source-of-truth and identity handoff first |
| internship-notes-sites-mirror | Publication mirror | N/A | Keep mirror role narrow |
| taichung-police-intel | Public-sector intelligence monitor | DIFFERENTIATOR | Existing #12 role intelligence profile remains high value |
| soundbox-offline | Local-first music library | DIFFERENTIATOR | Existing #3 same-LAN import remains active |
| skill-foundry | Agent-skill creation/certification | DIFFERENTIATOR | Existing #1 runtime compatibility / negative-transfer gate |
| video-timeline-pipeline | Video intelligence pipeline | DIFFERENTIATOR | Research Packs on existing roadmap; avoid parallel infra |
| ai-novel-workstation | Long-running AI writing workstation | DIFFERENTIATOR | Existing #2 Context Manifest / selective memory routing |
| **clinical-scribe-worker** | Clinical scribe / clinical reasoning Worker | **RESEARCH_REQUIRED / SAFETY** | **NEW #4 specialty-scoped validation packs** |
| MaterialYouNewTab | Local-first new-tab productivity fork | DO NOT BLOAT | Privacy/speed/minimalism remain competitive advantage |
| cf-mcp-server | Cloudflare MCP server | MUST MATCH | Existing #6 protocol/conformance migration |
| tick-stock-panel | Taiwan stock monitoring/simulation | MUST MATCH + RESEARCH | Coverage truth #2 before NL compiler #5 |
| herdr-skills | Multi-agent workflow skills | SHOULD BE BETTER | Reuse Skill Foundry evidence semantics |
| **ninax-line-hermes** | LINE messaging + audited video-summary recovery | **MUST MATCH / RELIABILITY** | **NEW #1 revision-aware input lifecycle / stale-summary gate** |

---

## External Signals

### A. Direct platform / competitor: LINE messages are no longer immutable inputs

**CONFIRMED — LINE Messaging API, 2026-08-12**

LINE added the `messageEdited` webhook event for group chats with a LINE Official Account. An edit event carries a reply token, so a bot can react to a changed message rather than assuming the original message is final.

Source: https://developers.line.biz/en/news/2026/02/04/messaging-api-outage/  
(official news feed entry: “Users can now edit messages in group chats with a LINE Official Account”, dated 2026-08-12)

**CONFIRMED — LINE webhook redelivery, current 2026 docs**

LINE documents that:
- the same webhook may arrive more than once;
- `webhookEventId` should be used to detect duplicates;
- redelivery can change event arrival order;
- `timestamp` may be needed to reconstruct context;
- `deliveryContext.isRedelivery` marks a redelivery;
- redelivery does not provide an exactly-once guarantee.

Source: https://developers.line.biz/en/docs/messaging-api/receiving-messages/

**CONFIRMED ADJACENT — OpenClaw messaging v2026.8.1**

OpenClaw’s recent messaging release stores webhook events before acknowledgement so accepted work can continue after restart, while keeping LINE reply behavior bounded and fallbacks visible.

Source: https://docs.openclaw.ai/releases/2026.8.1/messaging

**CONFIRMED DEVELOPER WORKFLOW — LINE Taiwan Developer Relations, 2026-09-03**

A LINE developer-relations implementation article explicitly examines edit/unsend webhooks and the downstream problem created when a bot already processed the old message.

Source: https://dev.to/gde/ai-in-practice-building-a-dynamic-line-group-buying-bot-with-edit-and-unsend-webhooks-1clh

**Transferable principle:** long-running agent work must bind to a versioned input head. Duplicate delivery and revised input are different cases; both require explicit receipts and invalidation.

### B. Direct competitor: clinical documentation is becoming specialty-scoped and continuously validated

**CONFIRMED — Microsoft Dragon Copilot specialty enhancements, current 2026**

Dragon Copilot uses a clinician’s primary specialty to generate specialty-specific HPI, Physical Exam, Assessment/Plan and terminology; dedicated clinical-integrity teams continuously monitor and refine output.

Sources:
- https://support.microsoft.com/en-us/dragon-copilot/physicians/current/specialty-enhancements
- https://support.microsoft.com/en-us/dragon-copilot/physicians/current/specialty-references

**CONFIRMED — Dragon Copilot clinical-note improvement tracking, updated 2026-07-08**

Microsoft tracks current and past note improvements by specialty and target date rather than treating “the model” as one undifferentiated quality state.

Source: https://learn.microsoft.com/en-us/industry/healthcare/dragon-copilot/specialty-models/clinical-note-status

**CONFIRMED — CLEARvalidate, 2026-07-13**

The UK National CLEAR Programme launched a six-month ambient-voice validation programme spanning up to three clinical specialties per participating NHS trust, explicitly aimed at safety, quality, adoption and performance evidence.

Source: https://www.clearprogramme.org.uk/2026/07/13/clearvalidate-a-fully-funded-opportunity-to-validate-the-safety-and-performance-of-ambient-voice-technology/

**CONFIRMED — Abridge, 2026-08-17 / 2026-08-28**

Abridge expanded context-aware clinical intelligence and encounter-adjacent workflows, increasing the importance of validating which patient/context source produced which note or recommendation.

Sources:
- https://www.abridge.com/press-release/context-aware-clinical-intelligence-extended-to-all-partners
- https://www.abridge.com/blog/now-in-practice-august-2026

**CONFIRMED — Nabla, 2026-07-28**

Nabla added on-device clinical dictation on macOS for work outside the ambient encounter, such as inbox/referral/follow-up documentation.

Source: https://www.nabla.com/fr/press-release/nabla-launches-medical-grade-dictation-product-built-for-apple-devices

**Transferable principle:** each specialty/workflow/input class needs its own validation scope. A small generic test set must not silently authorize cross-specialty claims.

### C. Emerging technology/research: persistent memory is becoming governed temporal state

**CONFIRMED — Microsoft Agent Framework / Cosmos DB memory, updated 2026-08-25**

Microsoft separates exact conversation history from extracted long-term semantic memory. Production guidance covers stable authenticated scope, TTL, backup, retention and deletion, and explicitly says extracted memories should not directly decide authorization.

Source: https://learn.microsoft.com/en-us/agent-framework/integrations/by-component/context-providers/azure-cosmos

**CONFIRMED — Neo4j Agent Memory, current 2026**

Neo4j Agent Memory separates short-term, long-term and reasoning memory and makes temporal fact validity, relationships and trace history first-class concepts.

Sources:
- https://neo4j.com/labs/agent-memory/
- https://learn.microsoft.com/en-us/agent-framework/integrations/neo4j-memory

**CONFIRMED RESEARCH — STALE / StateAuditor, 2026-08-03**

Research shows that an agent can have updated memory available and still plan around an old dependency. The repair approach verifies provenance and chronology of old→new transitions with deterministic checks before allowing repair.

Source: https://arxiv.org/abs/2608.01619

**CONFIRMED RESEARCH — Continuity Kernel, 2026-08-12**

A proposed continuity architecture separates candidate state from active state: changes target an exact predecessor head; activation revalidates ownership, authority and freshness, then records Commit/Reject/Quarantine/Defer with lineage.

Source: https://arxiv.org/abs/2608.11632

**CONFIRMED RESEARCH — Agent Zero Memory, 2026-08-30**

Agent Zero Memory treats origin, timestamp and evidence pointer as required attributes of learned items and combines event timeline, knowledge graph and citation-locked documentary memory.

Source: https://arxiv.org/abs/2608.29606

**CONFIRMED RESEARCH — Deployment-Time Memorization, 2026-06-08**

The study shows that deleting raw memory can leave information recoverable from derived summaries; full-pipeline purge/tombstone semantics are needed to drive worst-tier residue to zero in its evaluation.

Source: https://arxiv.org/abs/2606.10062

**Transferable principle:** durable memory needs proposal/activation separation, bitemporal evidence, supersession and deletion propagation — not merely better retrieval.

---

## New Releases / Recent Changes Worth Tracking

| Date | Product / ecosystem | Change | Reese-max relevance |
|---|---|---|---|
| 2026-09-03 | LINE developer ecosystem | Edit/unsend bot workflow guidance published | ninax-line-hermes: revised input must invalidate downstream state |
| 2026-08-30 | Agent Zero Memory | Provenance-aware long-term memory research | adng-memory: source/timestamp/evidence pointer + citation-locked reads |
| 2026-08-28 | Abridge | Context reuse across clinical workflow | clinical-scribe: context source/scope must be validation-visible |
| 2026-08-25 | Microsoft Agent Framework | Cosmos persistent-memory production guidance updated | adng-memory: scope/TTL/deletion/authorization boundaries |
| 2026-08-17 | Abridge | Context-aware clinical intelligence broadened | clinical-scribe: validation scope before capability expansion |
| 2026-08-12 | LINE | `messageEdited` webhook event | ninax-line-hermes: platform compatibility / revision head |
| 2026-08-12 | Continuity Kernel research | Candidate-vs-active state protocol | cross-portfolio state activation semantics |
| 2026-08-03 | STALE / StateAuditor research | Stale memory dependency repair | memory freshness / supersession gates |
| 2026-07-28 | Nabla | On-device clinical dictation for macOS | validate new input/workflow types separately |
| 2026-07-13 | CLEARvalidate | NHS multi-specialty ambient-voice validation | clinical validation as deployment evidence |

---

## Community Pain Points

These are anecdotal `COMMUNITY_SIGNAL`s only.

### Persistent agent memory rots even when retrieval “works”

- **2026-07-08:** an AI_Agents post describes an agent using a stale account balance and proposes evidence-quoted, deterministic memory admission. https://www.reddit.com/r/AI_Agents/comments/1uqj252/my_agents_kept_remembering_things_that_werent/
- **2026-07-16:** a long-running-memory discussion argues that raw “save everything + RAG” fails to encode supersession/identity/relationships. https://www.reddit.com/r/AI_Agents/comments/1uxwp0i/after_a_year_building_agent_memory_im_convinced/
- **2026-08-15:** a discussion asks how to stop persistent agents from accumulating convincing but wrong long-term state. https://www.reddit.com/r/AgentsOfAI/comments/1vp4fd0/how_do_you_stop_persistent_agents_from/

Implication: `adng-memory` should not solve this by simply adding embeddings or more stored history. Admission, authority, supersession and lineage are the higher-value control plane.

### Clinical scribe users still worry about wrong concepts / attribution

- **2026-08-16:** a Reddit discussion includes an anecdote of an AI scribe mapping a sinus/ENT conversation to a completely different concept and repeatedly emphasizes clinician review. https://www.reddit.com/r/fuck_ai_slop/comments/1vpx904/ai_medical_scribes_hallucinating/

Implication: this is not evidence of a population error rate, but it supports explicit misattribution/unsupported-addition/negation regression fixtures rather than only measuring diagnosis coverage.

---

## Repository Evidence / Gap Validation

### `ninax-line-hermes`

**CONFIRMED current default branch**
- README identifies audited LINE video recovery as the product: verify source/media → recover subtitle/audio/vision → independent review → deliver LINE text.
- Current evidence reports 46 Hermes regressions, 6 reviewer cases, two representative videos and ordinary-chat isolation.
- `video-loop/check_line_video.py` creates an ordinary `type=message` event with `webhookEventId`, reply token, timestamp and message id/text.
- Search found no `messageEdited`, unsend, `isRedelivery` or revision-head implementation.
- Issue/PR duplicate check found no matching ticket.

**Decision:** NEW Issue `#1` — revision-aware input lifecycle / stale-summary gate.

### `clinical-scribe-worker`

**CONFIRMED current default branch**
- Product has Clinical Scribe endpoints and production auth/quota/kill-switch.
- `test/gemini-eval.live.test.ts` runs a fixed 8-case synthetic Gemini evaluation and persists evidence artifacts.
- Existing metrics already include Top1/Top3, red flags, workup, referral, SOAP completeness, assessment, source fidelity, plan safety and exact vitals.
- Current inputs are single synthetic patient briefs; no multi-speaker, specialty-pack, negation-flip, temporal-flip or explicit omission/misattribution coverage was found.
- Issue/PR duplicate checks found no matching specialty validation ticket.

**Decision:** NEW Research Issue `#4` — versioned Specialty-scoped Clinical Validation Packs.

### `adng-memory`

**CONFIRMED current default branch**
- README now defines repository purpose, source-of-truth boundaries, writer/reader ownership, retention, sensitive-data boundary and recovery.
- README explicitly says writer implementation lives outside this repository.
- `patrol-log.md` is append-only, `patrol-heartbeat.json` has freshness semantics, and `.last-snapshot` is a date marker rather than content hash.
- Search found no standard `superseded / tombstone / valid_time / transaction_time / activation disposition` contract.
- Existing #1 covers README/retention/recovery; new state-lifecycle research is distinct.

**Decision:** NEW Research Issue `#4` — versioned Memory Activation / Staleness / Deletion Contract.

### `lplrs-judicial-sync`

**CONFIRMED current default branch / existing Issue**
- README correctly consumes Judicial Yuan `removed.jsonl` and deletes removed records from PostgreSQL.
- Existing `#1` already identifies that committing raw judgments to Git means later deletion from the working tree does not erase Git history/clones.

**Decision:** no duplicate. Memory tombstone research strengthens the design principle, but implementation should stay under existing `lplrs-judicial-sync #1`.

---

## Adjacent Ideas

### A. State Activation Receipt

Reusable contract for `candidate → accepted current head` containing:
- scope / subject;
- source + content hash;
- predecessor/head identity;
- valid time + observed/accepted time;
- disposition (`commit/reject/quarantine/defer/tombstone`);
- derived lineage;
- freshness/expiry;
- reason codes.

Best fits: `adng-memory`, `autodev-ng`, `prompt-autoresearch`, `skill-foundry`, `cf-ai-router`, `taichung-police-intel`.

### B. Input Revision Head

Long-running workflows should bind jobs to exact user-input revisions. Before side effects/delivery, verify that the revision is still current.

Best fits: `ninax-line-hermes`, `video-timeline-pipeline`, `note-filler`, remote agent actions.

### C. Validation Packs as Product Capability Evidence

A capability is only “validated” under a named pack/scope/version. Aggregate quality must not erase a high-risk scoped regression.

Best fits: `clinical-scribe-worker`, `voice-actress`, `skill-foundry`, `prompt-autoresearch`, `cyber-prep-coach`.

### D. Deletion/Tombstone Propagation

Deletion must traverse registered derived artifacts, not only raw current storage. Keep minimal audit metadata without keeping the deleted sensitive payload.

Best fits: `lplrs-judicial-sync`, `adng-memory`, intelligence caches and any future persistent user-memory feature.

---

## Opportunity Map

### High-value / actionable now

| Opportunity | Classification | Main repo(s) | Score | Action |
|---|---|---|---:|---|
| LINE message revision + webhook dedupe + stale-delivery gate | MUST MATCH / RELIABILITY | ninax-line-hermes | **96/100** | **NEW #1 created** |
| Specialty-scoped synthetic clinical validation packs | RESEARCH_REQUIRED / SAFETY | clinical-scribe-worker | **95/100** | **NEW #4 created** |
| Memory activation / supersession / tombstone lifecycle | RESEARCH_REQUIRED / RELIABILITY / PRIVACY | adng-memory + autodev-ng | **94/100** | **NEW adng-memory #4 created** |
| Judicial takedown must delete beyond current working tree | MUST MATCH / PRIVACY | lplrs-judicial-sync | 93/100 | Existing #1; duplicate avoided |
| Human ACP permission broker | MUST MATCH / SECURITY | openab | 97/100 | Still ISSUE_WRITE_BLOCKED; Issues disabled |

### Medium / later

- `autodev-ng`: pilot the Memory Activation envelope only after `adng-memory #4` narrows the contract; do not build a second memory store.
- `voice-actress`: reuse scoped Validation Pack semantics after its current runtime/calibration fixes are stable.
- `video-timeline-pipeline`: bind any future user-editable research request to exact input revision before expensive downstream work.
- `taichung-police-intel`: role profile outputs should carry source/context version and become stale when the underlying evidence pack changes.
- `skill-foundry`: compatibility certification should be treated as an accepted capability head that becomes stale when runtime/model/harness changes.

### DO NOT COPY / defer

- Do **not** add Neo4j/vector DB merely because current memory products use them; the gap is lifecycle governance, not storage brand.
- Do **not** expand `clinical-scribe-worker` into more autonomous diagnosis/EHR/coding actions before scoped validation evidence exists.
- Do **not** rebuild `ninax-line-hermes` as a LIFF/Mini App just because LINE adds new surfaces; first support the revised event contract correctly.
- Do **not** create another judicial deletion Issue while `lplrs-judicial-sync #1` already owns the fingerprint.
- Do **not** interpret “old” as “invalid” or “new” as “authoritative”; freshness needs source/authority semantics.

---

## Top 10 Cross-Portfolio Ideas

1. **Proposal ≠ activation:** agents/workers may propose durable state, but only an independent deterministic/authorized gate can advance the current head.
2. **Bitemporal state:** distinguish when something became true from when the system learned/accepted it.
3. **Revision-bound work:** long-running work binds to exact input/hash/revision and revalidates before delivery or other side effects.
4. **Tombstone cascade:** deletion invalidates registered summaries/caches/derived memories, not only raw storage.
5. **Scoped Validation Packs:** capability evidence is specialty/task/runtime/version-specific, not global.
6. **Per-scope regression blocking:** one safety-critical scope may block promotion even when aggregate score improves.
7. **Event receipts before expensive work:** dedupe/replay state should exist before external API/model/video calls.
8. **Stale-result gate:** a technically successful job can still be invalid for delivery because its source/input/head changed.
9. **Evidence-visible `UNTESTED / STALE / CANNOT_VERIFY`:** absence of validation should be a product-visible state, not silent success.
10. **Reuse one lineage vocabulary across portfolio:** source hash, current head, predecessor, disposition, freshness, verification and invalidation should converge rather than being reimplemented per repo.

---

## Ideas Rejected / Deferred

- **`adng-memory`: add semantic/vector search** — rejected for now. Better retrieval does not solve stale authority, supersession or deletion residue.
- **`clinical-scribe-worker`: add more specialties as product features immediately** — deferred. First build validation packs and mark untested scope honestly.
- **`clinical-scribe-worker`: auto-send notes to EHR / allow autonomous orders** — rejected at current maturity/safety boundary.
- **`ninax-line-hermes`: add LIFF/Mini App dashboard** — deferred. Platform event correctness and phone delivery evidence are higher priority.
- **`ninax-line-hermes`: treat webhook redelivery as exactly-once** — rejected; LINE explicitly does not guarantee that.
- **`lplrs-judicial-sync`: create a second purge Issue** — rejected as duplicate of #1.
- **`MaterialYouNewTab`: add AI/RSS breadth** — still rejected; local-first minimalism remains competitive.
- **`UkePack`: copy advanced synced-practice player features** — still deferred until teacher Beta identifies that bottleneck.

---

## Issue Mapping

### New Issues Created

1. `Reese-max/ninax-line-hermes #1`  
   **[Competitive Gap][P1][RELIABILITY] 支援 LINE messageEdited／redelivery 的版本化輸入與 stale-summary 失效**
2. `Reese-max/clinical-scribe-worker #4`  
   **[Research][Competitive Inspiration] 建立 Specialty-scoped Clinical Validation Pack 與 omission／misattribution 安全閘門**
3. `Reese-max/adng-memory #4`  
   **[Research][Competitive Inspiration] 建立可驗證的 Memory Activation／Staleness／Deletion Contract**

### Updated Existing Issues

None. No existing ticket was modified this round.

### Duplicate Avoided

- `Reese-max/lplrs-judicial-sync #1` already owns effective deletion beyond working-tree/Git-history concerns.

### Issue Write Blocked

- `Reese-max/openab`: prior P1 ACP human-approval finding remains blocked because GitHub Issues are disabled. No new write attempt was needed this round.

---

## What Changed Since r6

1. **Portfolio scope increased from 39 to 40 products:** `ninax-line-hermes` is now visible and was added to the map.
2. **`ninax-line-hermes` immediately gained a platform-compatibility P1:** LINE’s August 2026 message-edit event changes the truth model for long-running bot work.
3. **`adng-memory` moved from generic “scope/freshness/validation first” to a concrete research contract:** current 2026 memory systems/research now provide enough evidence to formalize activation, bitemporal state, supersession and tombstone propagation.
4. **`clinical-scribe-worker` moved from “do not add until safety/runtime gates” to a specific positive investment:** expand evidence scope through specialty Validation Packs, not product autonomy.
5. **Deletion semantics are now a cross-portfolio primitive:** `lplrs-judicial-sync #1` and `adng-memory #4` should use compatible tombstone/derived-lineage concepts where possible, without merging the products.
6. The portfolio-wide design rule is now stronger: **current authority must be versioned and revocable.** A successful computation cannot be delivered/promoted if its input/state/evidence head is no longer current.

---

## Sources

### Official / product
- LINE Messaging API news / edit event — https://developers.line.biz/en/news/2026/02/04/messaging-api-outage/
- LINE webhook receiving/redelivery — https://developers.line.biz/en/docs/messaging-api/receiving-messages/
- OpenClaw messaging v2026.8.1 — https://docs.openclaw.ai/releases/2026.8.1/messaging
- LINE developer-relations edit/unsend workflow — https://dev.to/gde/ai-in-practice-building-a-dynamic-line-group-buying-bot-with-edit-and-unsend-webhooks-1clh
- Microsoft Dragon Copilot specialty enhancements — https://support.microsoft.com/en-us/dragon-copilot/physicians/current/specialty-enhancements
- Microsoft Dragon Copilot specialty references — https://support.microsoft.com/en-us/dragon-copilot/physicians/current/specialty-references
- Microsoft clinical-note improvement status — https://learn.microsoft.com/en-us/industry/healthcare/dragon-copilot/specialty-models/clinical-note-status
- CLEARvalidate — https://www.clearprogramme.org.uk/2026/07/13/clearvalidate-a-fully-funded-opportunity-to-validate-the-safety-and-performance-of-ambient-voice-technology/
- Abridge context-aware clinical intelligence — https://www.abridge.com/press-release/context-aware-clinical-intelligence-extended-to-all-partners
- Abridge August 2026 release — https://www.abridge.com/blog/now-in-practice-august-2026
- Nabla on-device clinical dictation — https://www.nabla.com/fr/press-release/nabla-launches-medical-grade-dictation-product-built-for-apple-devices
- Microsoft Agent Framework Cosmos memory — https://learn.microsoft.com/en-us/agent-framework/integrations/by-component/context-providers/azure-cosmos
- Neo4j Agent Memory — https://neo4j.com/labs/agent-memory/
- Microsoft Neo4j memory integration — https://learn.microsoft.com/en-us/agent-framework/integrations/neo4j-memory

### Research
- STALE / StateAuditor — https://arxiv.org/abs/2608.01619
- Continuity Kernel — https://arxiv.org/abs/2608.11632
- Agent Zero Memory — https://arxiv.org/abs/2608.29606
- Deployment-Time Memorization — https://arxiv.org/abs/2606.10062

### Community signals
- https://www.reddit.com/r/AI_Agents/comments/1uqj252/my_agents_kept_remembering_things_that_werent/
- https://www.reddit.com/r/AI_Agents/comments/1uxwp0i/after_a_year_building_agent_memory_im_convinced/
- https://www.reddit.com/r/AgentsOfAI/comments/1vp4fd0/how_do_you_stop_persistent_agents_from/
- https://www.reddit.com/r/fuck_ai_slop/comments/1vpx904/ai_medical_scribes_hallucinating/

---

## Run Boundary

This round performed external research, repository/Issue/PR duplicate checks, created the three Issues listed above, and wrote this report. It did **not** modify product source code, create implementation branches, merge PRs, deploy, rotate secrets, change repository settings, or claim unexecuted runtime validation.