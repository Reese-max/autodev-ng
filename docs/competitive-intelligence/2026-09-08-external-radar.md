# External Competitive / Product Inspiration Radar — 2026-09-08

> Scope: all 40 Reese-max owned, non-archived repositories visible to the connected GitHub installation. Public web outside Reese-max GitHub is the primary research source. Repository, Issue, PR and recent-commit evidence is used to resolve product identity, readiness, duplication and safety. `COMMUNITY_SIGNAL` items are anecdotal and are not market-share, efficacy or incident-rate claims.

## Executive Summary

This round produced **two new high-value GitHub Issues** and two important defer/duplicate decisions:

1. **`minideck #4` — separate draft head from published head.** Current `/p/:id` public sharing follows `current_version`, so any generate/revise/save/rollback can silently change content already shared with a teacher, customer or reviewer. Gamma's 2026 publishing flow separates Preview/Draft/Publish/Disable; Pitch treats external links as governed sharing objects and added expiring links in March 2026. MiniDeck already has versions, rollback, project tokens and a public player, so the minimum high-value change is `current_version != published_version`, explicit publish, preview and unpublish. **Classification: MUST MATCH / P1 RELIABILITY+PRIVACY. Opportunity Score: 96/100.**
2. **`gemini-deidentifier #30` — canonical World-State Consequence Ledger.** The repo already contains combat, inventory, quests, NPC relationships, world events and save/load. `WorldEvent` can mutate NPC reputation/trust/inventory directly, while some responses use runtime randomness. Current AI-RPG competitors increasingly distinguish persistent world state/game rules from generative narration. The opportunity is to make LLM/random systems propose consequences, deterministic rules validate them, and an append-only ledger commit canonical game truth that can be replayed independent of narrator/model changes. **Classification: DIFFERENTIATOR / P2 RELIABILITY. Opportunity Score: 92/100.**
3. **`lobsterpulse` — no duplicate Issue.** OpenTelemetry's 2026 GenAI semantic conventions strongly validate cross-agent traces/metrics as the correct observability direction, but LobsterPulse already contains `otel-provider-metrics-contract`, `otel-genai-runtime-emit-2026-q3` and cross-provider timeline work. Creating another generic “add OTel” ticket would be duplicate. **Classification: SHOULD BE BETTER / existing roadmap.**
4. **`avatar-vfo` — defer memory/voice expansion.** Character.AI and Convai show stronger user-controlled memory and identity-scoped long-term memory patterns; Inworld's August 2026 voice stack makes expressive realtime voice more accessible. However Avatar VFO only just landed auth/user isolation, CSRF/rate-limit and fail-closed secret fixes on 2026-09-06/07. This round records the opportunity but does not open another expansion ticket before runtime/security evidence settles. **Classification: LATER / DO NOT BLOAT YET.**

The strongest cross-portfolio conclusion is:

> **Separate the mutable working head from the authoritative/published head.**
>
> A draft, model proposal, random outcome, new memory, new provider capability or edited input should not become externally authoritative merely because it exists. Use `candidate/current → validate → explicit commit/publish/activate → authoritative head → receipt`.

This extends prior radar findings around input revisions, memory activation, prompt promotion, Skill certification and artifact provenance.

---

## Product → Market Category / Opportunity Map

| Repository | Category | Classification this round | Current decision |
|---|---|---|---|
| **gemini-deidentifier** | AI RPG / interactive fiction | **DIFFERENTIATOR** | **NEW #30 canonical World-State Consequence Ledger** |
| exam-archive | Exam archive / public reference | MUST MATCH | Provenance, deterministic build and performance first |
| police-exam-practice | Police-exam practice | SHOULD BE BETTER | Reuse learner-state primitives; avoid parallel recommendation logic |
| police-exam-archive | Structured police-exam corpus | MUST MATCH | Source/image/answer fidelity; keep archive role narrow |
| 92-duty-scheduler | Constraint-based duty scheduling | DIFFERENTIATOR | Existing #19 explainable repair plans remains high-value |
| openab | Discord ↔ ACP remote coding-agent broker | MUST MATCH / SECURITY | Human permission broker remains important; Issues are disabled |
| UkePack | MusicXML → practice pack | SHOULD VALIDATE | Teacher Beta evidence before interactive-player breadth |
| ppt-studio | AI presentation workstation | DIFFERENTIATOR | Existing #3 slide/claim provenance remains the moat |
| book5-windows-server-2022 | Learning/content site | SHOULD SIMPLIFY | Accessibility/build/learning flow before AI breadth |
| obsidian-vault | Personal knowledge repository | ADJACENT IDEA | Interop only where it removes concrete copy/paste |
| voice-actress | Essay grading/coaching | MUST VERIFY THEN IMPROVE | Runtime/calibration evidence before personalization |
| taiwan-intel-dashboard | Paused intelligence dashboard | DO NOT ADD NOW | Recovery/reliability posture remains dominant |
| autodev-ng | Multi-agent delivery orchestrator | SHOULD BE BETTER | Reuse candidate→gate→receipt semantics, not more agents |
| flux-image-gen | Image generation/edit workspace | DIFFERENTIATOR | Existing #18 provenance receipt remains active |
| claude-mem | Upstream memory fork | UPSTREAM FORK | Track upstream unless deliberate product divergence is declared |
| **lobsterpulse** | AI coding CLI monitor | **SHOULD BE BETTER / DUPLICATE AVOIDED** | Existing OTel/runtime/timeline work already covers new observability signal |
| prompt-autoresearch | Prompt optimization/evaluation | RESEARCH_REQUIRED | Existing #3 variance-aware promotion gate remains active |
| neciken-summer-poem | AI literary workflow | MUST FIX | Reliability/CI before expansion |
| note-filler | Evidence-grounded legal/admin augmentation | DIFFERENTIATOR | Existing claim-level Verify/Accept/Reject workflow remains correct |
| gooaye | Empty placeholder | N/A | Define product purpose or archive |
| lplrs-judicial-sync | Judicial-data sync | MUST MATCH / PRIVACY | Existing takedown/deletion work; no duplicate |
| adng-memory | Operational memory/state store | RESEARCH_REQUIRED | Existing #4 activation/staleness/deletion contract |
| cyber-prep-coach | iPAS exam preparation | DIFFERENTIATOR | Existing #4 mastery profile + explainable next action |
| cf-ai-router | AI provider router | RESEARCH_REQUIRED | Reliability routing only after evidence/capability truth |
| **avatar-vfo** | AI persona simulation | **LATER / DO NOT BLOAT YET** | Memory/voice pattern recorded; first validate newly landed security boundary |
| project-doctor-web | Clinical teaching/research UI | DO NOT ADD NOW | Runtime/safety gates first |
| **minideck** | AI deck generator/share workflow | **MUST MATCH / P1** | **NEW #4 draft head ≠ published head** |
| chatgpt-dual-pipeline | Internship-note publishing product | SHOULD SIMPLIFY | Source-of-truth and identity handoff first |
| internship-notes-sites-mirror | Publication mirror | N/A | Keep mirror role narrow |
| taichung-police-intel | Public-sector intelligence monitor | DIFFERENTIATOR | Existing #12 role intelligence profile remains high-value |
| soundbox-offline | Local-first music library | DIFFERENTIATOR | Existing #3 same-LAN import remains active |
| skill-foundry | Agent-skill creation/certification | DIFFERENTIATOR | Existing runtime compatibility / negative-transfer gate |
| video-timeline-pipeline | Video intelligence pipeline | DIFFERENTIATOR | Reusable Research Packs on existing roadmap; avoid parallel infra |
| ai-novel-workstation | Long-running AI writing workstation | DIFFERENTIATOR | Existing Context Manifest / selective memory routing |
| clinical-scribe-worker | Clinical scribe/eval Worker | RESEARCH_REQUIRED / SAFETY | Existing specialty validation packs remain correct |
| MaterialYouNewTab | Local-first new-tab productivity | DO NOT BLOAT | Privacy/speed/minimalism remain competitive advantage |
| cf-mcp-server | Cloudflare MCP server | MUST MATCH | Existing protocol/conformance migration |
| tick-stock-panel | Taiwan stock monitoring/simulation | MUST MATCH + RESEARCH | Coverage truth before natural-language compiler |
| herdr-skills | Multi-agent workflow skills | SHOULD BE BETTER | Reuse Skill Foundry evidence semantics |
| ninax-line-hermes | LINE messaging + video-summary workflow | MUST MATCH / RELIABILITY | Existing revision-aware input lifecycle remains critical |

---

## External Signals

### A. Direct competitor / distribution workflow — publishing is becoming an explicit state transition

**CONFIRMED — Gamma, updated 2026-04-24**

Gamma Sites separates editing from public release. Authors can Preview, keep draft changes unpublished, explicitly Publish, and disable a site without deleting the editable project.

Source: https://help.gamma.app/en/articles/11047576-can-i-publish-or-disable-my-gamma-site

**CONFIRMED — Pitch, updated 2026-05-05**

Pitch external links are governed sharing objects: links can be named, disabled, passcode-protected and configured for download. The standard presentation link can still act as a live link that reflects later edits, showing that “live” and “governed external share” are distinct workflows rather than one accidental behavior.

Source: https://help.pitch.com/en/articles/3748926-share-an-external-link-to-your-presentation

**CONFIRMED — Pitch, 2026-03-18**

Pitch added expiring external links. The transferable principle is that a share URL has a lifecycle and policy, not merely a path to the current object.

Source: https://pitch.com/whats-new/share-expiring-links-and-sync-slide-edits

**CONFIRMED — Canva, May 2026**

Canva continued expanding publishing/sharing surfaces and preview-before-publish workflows. MiniDeck should not copy the distribution breadth; the relevant principle is explicit authority over what leaves the editing workspace.

Source: https://www.canva.com/newsroom/news/whats-new-may-2026/

**Transferable principle:** `working head` and `public head` should be independently versioned. Save/edit/rollback are not publish operations.

### B. Adjacent / direct AI-RPG products — persistent world state is replacing “chat memory” as the core game substrate

**CONFIRMED — Forged20, active 2026**

Forged20 explicitly positions itself as a game system rather than a fantasy chatbot: rules, dice, character progression, memory and world state share one system foundation. A March 2026 milestone emphasizes persistent world state and consistency.

Source: https://www.forged20.com/

**CONFIRMED — WorldLines, 2026 roadmap**

WorldLines structures a persistent world around world/character agents, events and consequences; its roadmap moves toward multiple players/agents sharing a single event history. The useful principle is not “add agent swarm,” but “one canonical sequence of world consequences.”

Source: https://www.worldlines.gg/

**CONFIRMED — Playworlds, Q3 2026 Early Access target**

Playworlds combines voice/text input, an AI GM and persistent campaign state shaped by decisions. Its Early Access plan calls out state clarity, reliability and encounter balance as validation targets.

Source: https://store.steampowered.com/app/4911480/Playworlds/

**CONFIRMED — Auferet, current 2026**

Persistent worlds, remembered choices and lasting consequences are a central product promise in the emerging AI-RPG category.

Source: https://auferet.com/

**Transferable principle:** generation proposes narration; deterministic game systems commit canonical consequences. Long-running state should be replayable independently of narrator/model choice.

### C. Emerging infrastructure — GenAI observability is converging on traces + model/tool spans, but LobsterPulse already has this roadmap

**CONFIRMED — OpenTelemetry, 2026-05-14**

OpenTelemetry's GenAI observability work standardizes traces, metrics and events around agent/model/tool execution, including parent-child span structures and model/token/latency attributes.

Source: https://opentelemetry.io/blog/2026/gen-ai-observability/

**CONFIRMED — OpenAI, 2026-05-08**

OpenAI's agent-native engineering/safety materials continue emphasizing auditability and telemetry for autonomous coding workflows.

Source: https://openai.com/index/codex-security/

**Repository consequence:** LobsterPulse already has an OTel provider metrics contract, a Q3 GenAI runtime emit proposal and a cross-provider timeline. New external evidence should strengthen those existing work items instead of opening a duplicate generic observability Issue.

### D. Persona-memory competition — stronger user-controlled memory exists, but Avatar VFO should first prove its new trust boundary

**CONFIRMED — Character.AI, 2026-05-21**

Character.AI's Smarter Memory adds Story Memory, editable Facts and Memory Usage visibility, making memory inspectable/editable instead of fully implicit.

Source: https://blog.character.ai/smarter-memory-for-more-consistent-characters/

**CONFIRMED — Convai, current 2026**

Convai supports long-term memory with explicit identity scope; its support guidance notes that memory is separated by character and speaker/end-user identity, and some realtime services have different memory availability.

Sources:
- https://docs.convai.com/api-docs/plugins-and-integrations/long-term-memory
- https://support.convai.com/en/articles/long-term-memory-not-working

**CONFIRMED — Inworld, 2026-08-31**

Inworld Realtime TTS-2 broadens expressive realtime voice support with multilingual tone/pacing/emotional control.

Source: https://inworld.ai/blog/inworld-realtime-tts-2-now-generally-available

**Repository consequence:** Avatar VFO has just landed authentication, per-user isolation, CSRF/rate-limit and fail-closed secret fixes. Memory/voice expansion is attractive but should wait for runtime verification of those boundaries instead of immediately widening data/action surface.

---

## Recent Repository Changes Considered

- **`minideck` — 2026-09-07:** commit `d3026875` closed a major historical-version privacy gap by requiring project tokens for raw deck access and restricting anonymous share to the current active version. This makes the remaining draft/public coupling more visible: the privacy boundary is improved, but `current_version` still doubles as the public head.
- **`lobsterpulse` — 2026-09-07:** recent commits enabled Codex hooks safely and preserved TOML/config semantics. Existing telemetry/timeline OpenSpec artifacts remain present, so a new OTel Issue would be duplication rather than new product value.
- **`avatar-vfo` — 2026-09-06/07:** auth, per-user isolation, CSRF, rate limiting, fail-closed secrets and Cloudflare Access JWT validation landed. This materially changes prior radar readiness from “security blocker unresolved” to “security fix landed; runtime/regression evidence still required before expansion.”
- **`gemini-deidentifier`:** no newer product change resolved the existing direct-mutation/replay gap; the current game-event architecture remains the evidence baseline for #30.

---

## New Releases / Changes Worth Tracking

| Date | Product/ecosystem | Change | Reese-max relevance |
|---|---|---|---|
| 2026-08-31 | Inworld | Realtime TTS-2 GA | avatar-vfo: future voice opportunity, but not before trust/runtime proof |
| Q3 2026 target | Playworlds | AI-GM persistent campaign Early Access | gemini-deidentifier: persistent state/reliability is a market differentiator |
| 2026-05-21 | Character.AI | Smarter Memory / Story Memory / editable Facts | avatar-vfo: inspectable memory is becoming expected |
| 2026-05-14 | OpenTelemetry | GenAI observability guidance | lobsterpulse: validates existing OTel work, no duplicate issue |
| 2026-05-05 | Pitch | Governed external-link workflow documentation | minideck: separate live editing from governed share state |
| 2026-04-24 | Gamma | Explicit Preview / Publish / Disable site lifecycle | minideck: direct product pattern for published head |
| 2026-03-18 | Pitch | Expiring links | sharing is a lifecycle object, not only a URL |
| 2026-03 | Forged20 | Persistent-state/game-system milestone | gemini-deidentifier: canonical world state over chatbot memory |

---

## Community Pain Points

These are anecdotal `COMMUNITY_SIGNAL`s only.

### AI roleplay: “memory” is still experienced as unreliable when consequences disappear

Recent Character.AI discussions continue to describe long RP sessions where characters forget prior events or lose personality/relationship continuity. This does not establish a failure rate, but it reinforces that “send more chat history” does not solve durable game consequences.

Representative discussion: https://www.reddit.com/r/CharacterAI/comments/1w3zllv/the_chatbots_poor_memory_makes_roleplay_less/

**Implication for `gemini-deidentifier`:** solve canonical game-state continuity at the engine layer. Do not respond by simply increasing prompt history, adding more lore text or adding more NPC agents.

### Public artifacts: live links are useful but can create accidental publication

Pitch intentionally supports live links that reflect presentation edits, while also offering external-link controls. The existence of both models is important: MiniDeck should not declare live updating “wrong”; it should make it an explicit policy rather than coupling it to every save by accident.

---

## Adjacent Ideas

### 1. Working Head vs Authoritative Head

Reusable state contract:

```text
candidate/current head
      ↓
validate
      ↓
explicit publish / activate / commit
      ↓
authoritative head
      ↓
receipt + lineage
```

Best fits now:
- `minideck`: current draft vs published deck;
- `gemini-deidentifier`: proposed consequence vs canonical game mutation;
- `adng-memory`: candidate memory vs active memory;
- `prompt-autoresearch`: candidate prompt vs champion;
- `skill-foundry`: tested Skill build vs certified runtime compatibility;
- `ninax-line-hermes`: received message revision vs current input head.

### 2. Replayable Consequence Receipts

A receipt should explain “why is the state currently this way?” without requiring the model to reconstruct history from prose.

Potential reuse:
- RPG NPC/quest/item state;
- scheduling repair application;
- deployment/config changes;
- public-share publication;
- provenance-aware content edits.

### 3. Share Policy as a First-Class Object

For shareable products, avoid a single implicit URL policy. Useful attributes may eventually include:
- published head;
- enabled/disabled;
- expiry;
- audience/access mode;
- download/export permission;
- publish receipt.

For MiniDeck MVP only `published_version + explicit publish/unpublish` is justified; do not copy enterprise sharing breadth prematurely.

### 4. Observability Evidence Should Map to Existing Product Contracts

OpenTelemetry's GenAI conventions are valuable only if they map cleanly to existing provider/session/tool state. LobsterPulse already invested in this mapping. New standards evidence should update/validate the current contract, not create a second telemetry truth source.

---

## Opportunity Map

| Opportunity | Classification | Repo(s) | Score | Decision |
|---|---|---|---:|---|
| Draft head ≠ published head; explicit publish/preview/unpublish | MUST MATCH / RELIABILITY | minideck | **96/100** | **NEW #4** |
| Replayable canonical world-state consequence ledger | DIFFERENTIATOR | gemini-deidentifier | **92/100** | **NEW #30** |
| GenAI OTel runtime tracing/metrics aligned to standard conventions | SHOULD BE BETTER | lobsterpulse | 88/100 | DUPLICATE AVOIDED — existing OpenSpec work |
| Inspectable/editable long-term persona memory | ADJACENT IDEA | avatar-vfo | 85/100 | DEFER until runtime/security evidence |
| Realtime expressive voice | ADJACENT IDEA | avatar-vfo | 77/100 | LATER; not core trust problem |
| Expiring/passcode multi-link sharing | LATER | minideck | 74/100 | NOT MVP; first separate public head |
| Multiplayer/shared-world agent swarm | DO NOT COPY NOW | gemini-deidentifier | 58/100 | State ledger before agent count |

Score is a prioritization heuristic based on User Pain, Strategic Fit, Novelty, Evidence Strength, Reuse Potential and Implementation Effort with Security/Privacy/Cost risk as a penalty. It is not a market forecast.

---

## Top 10 Cross-Portfolio Ideas

1. **Working Head / Authoritative Head primitive** — reusable lifecycle object for publish, memory, prompt, provider and artifact decisions.
2. **Explicit activation/publish receipt** — every externally authoritative transition should record version, actor/policy, timestamp and source head.
3. **Deterministic consequence ledger** — use for RPG state, scheduling mutations and other multi-step automation where final state must be explainable.
4. **Replay from authoritative history** — snapshots remain caches/projections; drift should be detectable.
5. **Preview with the real delivery renderer/path** — avoid preview/production divergence in decks, reports and generated artifacts.
6. **Unpublish/deactivate without deleting work** — separate public visibility from edit-state retention.
7. **Share-policy lifecycle** — expiry/passcode/audience only after a simple published-head model proves useful.
8. **Memory controls as visible evidence** — what is stored, active, hidden, stale and why.
9. **Standards-aligned telemetry mapping** — one OTel/metrics truth source, not parallel monitoring implementations.
10. **Model-independent canonical state** — model/prompt upgrades must not silently rewrite world, memory, recommendation or publication truth.

---

## Ideas Rejected / Deferred

- **Do not add “more AI RPG agents” to `gemini-deidentifier` before state authority is deterministic.** More NPC/world agents increase the number of writers to an already unclear canonical state.
- **Do not increase RPG world templates just because competitors have more worlds.** The repo already has 17+ categories; persistence/consistency has higher strategic value.
- **Do not add Pitch-style analytics/workspaces/passcodes/expiring links to MiniDeck in the same MVP.** First solve `draft != published` cleanly.
- **Do not create a second generic OTel/trace Issue for LobsterPulse.** Existing OpenSpec artifacts already cover provider metrics, runtime emit and cross-provider timeline.
- **Do not immediately add voice to Avatar VFO.** Expressive voice is attractive but widens realtime, privacy, cost and identity surface just after security fixes landed.
- **Do not add generic “memory RAG” to Avatar VFO as the next move.** If later pursued, memory should be editable/scoped/auditable rather than merely longer context.
- **Do not copy Pitch live-link semantics blindly into every deck product.** Live links are useful when explicit; MiniDeck's problem is that the policy is implicit and inseparable from save.

---

## Issue Mapping

### NEW

- `Reese-max/minideck #4` — `[Competitive Inspiration][FEATURE] 將草稿 current_version 與公開 published_version 分離`
  - URL: https://github.com/Reese-max/minideck/issues/4
  - Fingerprint: `minideck + /p/:id follows current_version + edits silently change public content + no published head`
  - Priority: P1
  - Runtime verification required.

- `Reese-max/gemini-deidentifier #30` — `[Competitive Inspiration][DIFFERENTIATOR] 將 AI 敘事與可重播 World-State Consequence Ledger 分離`
  - URL: https://github.com/Reese-max/gemini-deidentifier/issues/30
  - Fingerprint: `AI RPG + structured mechanics/world events + direct state mutation + no canonical replayable consequence ledger`
  - Priority: P2
  - Runtime verification required.

### DUPLICATE AVOIDED

- `lobsterpulse` — new OTel/GenAI observability evidence maps to existing `openspec/changes/otel-provider-metrics-contract/`, `otel-genai-runtime-emit-2026-q3/` and cross-provider timeline. No new Issue.

### DEFERRED

- `avatar-vfo` — inspectable memory and realtime voice are valid external opportunities, but auth/isolation/security fixes only recently landed. Require runtime/regression evidence before expansion.

### ISSUE WRITE BLOCKED

- None in this round.

---

## Sources

### Presentation / sharing
- Gamma — Can I publish or disable my Gamma Site? (updated 2026-04-24): https://help.gamma.app/en/articles/11047576-can-i-publish-or-disable-my-gamma-site
- Pitch — Share an external link (updated 2026-05-05): https://help.pitch.com/en/articles/3748926-share-an-external-link-to-your-presentation
- Pitch — Expiring links (2026-03-18): https://pitch.com/whats-new/share-expiring-links-and-sync-slide-edits
- Canva — What's new May 2026: https://www.canva.com/newsroom/news/whats-new-may-2026/

### AI RPG / persistent worlds
- Forged20: https://www.forged20.com/
- WorldLines: https://www.worldlines.gg/
- Playworlds: https://store.steampowered.com/app/4911480/Playworlds/
- Auferet: https://auferet.com/
- Character.AI community memory signal: https://www.reddit.com/r/CharacterAI/comments/1w3zllv/the_chatbots_poor_memory_makes_roleplay_less/

### GenAI observability
- OpenTelemetry — GenAI observability (2026-05-14): https://opentelemetry.io/blog/2026/gen-ai-observability/
- OpenAI — Codex security / agent auditability (2026-05-08): https://openai.com/index/codex-security/

### Persona memory / voice
- Character.AI — Smarter Memory (2026-05-21): https://blog.character.ai/smarter-memory-for-more-consistent-characters/
- Convai long-term memory docs: https://docs.convai.com/api-docs/plugins-and-integrations/long-term-memory
- Convai memory support guidance: https://support.convai.com/en/articles/long-term-memory-not-working
- Inworld Realtime TTS-2 GA (2026-08-31): https://inworld.ai/blog/inworld-realtime-tts-2-now-generally-available

---

## What Changed Since Last Radar

Compared with `2026-09-07-external-radar-r7.md`:

1. **`gemini-deidentifier` moved from “resolve identity / simplify before expansion” to a concrete DIFFERENTIATOR.** Current repo evidence confirms a coherent AI-RPG product with substantial deterministic mechanics; the new opportunity is to make canonical world consequences replayable and model-independent. Created #30.
2. **`minideck` moved from generic “share/version/privacy authority first” to a precise P1 publication contract.** The 2026-09-07 historical-version security fix is now present, but it makes the remaining coupling clearer: `current_version` still doubles as the public version. Created #4.
3. **`lobsterpulse` received stronger external validation but no new ticket.** OTel GenAI conventions support the existing metrics/runtime/timeline path; duplicate avoided.
4. **`avatar-vfo` readiness improved because auth/isolation/CSRF/rate-limit/fail-closed-secret fixes landed,** but this round still defers memory/voice expansion until runtime evidence proves those boundaries.
5. The portfolio-level model is now more explicit: **mutable working state must not silently become authoritative/public state.** This is the same lifecycle pattern already appearing in memory activation, edited messaging inputs, prompt champions and Skill certification.
