# External Competitive / Product Inspiration Radar — 2026-09-07 r5

> Scope: current accessible, non-archived Reese-max repositories that can reasonably be treated as products or supporting product infrastructure. External public-web research is the primary signal source. Repository/Issue/PR evidence is used to judge fit, duplication, readiness, and safety. Community discussions are tagged `COMMUNITY_SIGNAL` and are not treated as market-share or efficacy studies.

## Executive Summary

Round 5 found two distinct opportunities strong enough to create GitHub Issues:

1. **`flux-image-gen` — verifiable generation/edit provenance receipt + Content Credentials preservation/inspection**. The repository already has a strong internal history/version chain, artwork JSON export, cloud share metadata, provider/model/seed capture and image-edit lineage, while the wider ecosystem is rapidly standardizing C2PA/Content Credentials and layered provenance. The product opportunity is not “add an AI badge”; it is to make each generated/edited artifact auditable, hash-verifiable, lineage-aware, privacy-preserving and honest about whether upstream credentials are verified, absent, invalid or possibly stripped. New Issue: `flux-image-gen #18`.
2. **`soundbox-offline` — same-LAN QR/browser direct import without cloud accounts**. The repository’s previous MUST-MATCH blocker, whole-library backup/restore, was completed on the current default branch today. The next high-value local-first friction is now onboarding/transfer: desktop-owned music still has to be moved through USB, Files, cloud drives or another transfer app before the mobile PWA can import it. PeerPlay/LocalSend-style local transfer maps directly to the product’s “no account / no cloud library” moat. New Issue: `soundbox-offline #3`.

Three recent repository changes materially alter the radar’s prioritization:

- `soundbox-offline #1` is completed on default branch (`44c22cc8...`), so the product can move from recovery-first to workflow-compression opportunities.
- `flux-image-gen #11` is completed on default branch (`ce69e934...`), so provenance can be considered without ignoring the prior production abuse-control blocker.
- `voice-actress #1/#2` are completed on default branch (`de674011...`), but new learning/personalization features remain deferred until the repaired grade → persist → dashboard path and live/mock provenance receive runtime evidence.

A governance correction also emerged: **upstream forks/mirrors should not automatically be treated as independent products for competitive feature creation**. `Reese-max/claude-mem` is explicitly a fork of `thedotmack/claude-mem` with GitHub Issues disabled in the fork. Radar should default such repositories to upstream-tracking / divergence review unless Reese-max has an intentional product fork strategy.

The broader cross-portfolio product pattern is now:

> **Artifact / Capability / Memory / Recommendation claims should be represented as versioned receipts with scope, source, lineage, freshness and validation state — not optimistic labels.**

---

## Product → Market Category Map / Opportunity Map

| Repository | Current product category | r5 classification | r5 decision |
|---|---|---|---|
| gemini-deidentifier | AI RPG / interactive fiction (identity mismatch) | SHOULD SIMPLIFY | Resolve product/repo identity before expansion |
| exam-archive | Exam archive / public reference | MUST MATCH | Provenance, performance and reproducible build first |
| police-exam-practice | Police-exam practice | SHOULD BE BETTER | Reuse common learner-profile primitives later |
| police-exam-archive | Exam corpus / provenance archive | MUST MATCH | Preserve image/answer fidelity and source traceability |
| 92-duty-scheduler | Constraint-based duty scheduling | DIFFERENTIATOR | #19 repair-plan workflow remains the next major product gain |
| openab | Current product identity unresolved | UNKNOWN | Research identity before competitive conclusions |
| UkePack | Music/chord practice workflow | MAINTAIN | Stabilize authorization/runtime before broader product surface |
| ppt-studio | AI presentation workstation | DIFFERENTIATOR | #3 source/claim provenance remains the right moat |
| book5-windows-server-2022 | Learning/content site | SHOULD SIMPLIFY | Build/accessibility/landing contract over new AI features |
| obsidian-vault | Personal knowledge/content repository | ADJACENT IDEA | Add interoperability only when it removes a real manual step |
| voice-actress | Police/public-service essay grading & coaching | MUST VERIFY THEN IMPROVE | #1/#2 fixed; runtime proof before new adaptive/personalization work |
| taiwan-intel-dashboard | Public intelligence dashboard | DO NOT ADD NOW | Keep recovery/paused posture |
| autodev-ng | Multi-agent delivery orchestrator | SHOULD BE BETTER | Independent verification + memory trust/freshness, not agent-count growth |
| flux-image-gen | AI image generation/edit workspace | DIFFERENTIATOR | **NEW #18 provenance receipt + Content Credentials strategy** |
| claude-mem | Upstream persistent-memory fork | UPSTREAM FORK / N/A | Track upstream; no product Issue without explicit divergence strategy |
| lobsterpulse | Agent hooks / notifications | SHOULD BE BETTER | Preserve hook/config integrity; avoid notification breadth for its own sake |
| prompt-autoresearch | Prompt experiment optimizer | SHOULD BE BETTER | Variance-aware repeated eval remains research backlog |
| neciken-summer-poem | AI literary-production workflow | MUST FIX | Restore green default-branch CI before expansion |
| note-filler | Source-grounded legal/admin augmentation | DIFFERENTIATOR | Existing claim-review/evidence ledger remains the key moat |
| gooaye | Empty placeholder | N/A | Define purpose or archive |
| lplrs-judicial-sync | Judicial data synchronization | MUST MATCH | Retention/takedown/source lifecycle first |
| adng-memory | Operational memory / snapshots | MUST MATCH | Scope/freshness/retention/validation should precede richer recall |
| cyber-prep-coach | iPAS exam preparation | DIFFERENTIATOR | #4 mastery profile; SuperMemo-style history import can extend it later |
| cf-ai-router | AI provider/router infrastructure | RESEARCH_REQUIRED | #1 task reliability profile + shadow deterministic ordering |
| avatar-vfo | AI avatar/chat | DO NOT ADD NOW | Security/release evidence before new agent behavior |
| project-doctor-web | Clinical teaching/research UI | DO NOT ADD NOW | Safety/runtime gates remain dominant |
| minideck | Presentation/deck workflow | MUST MATCH | Share/version authority and privacy scope first |
| chatgpt-dual-pipeline | Internship-notes publishing product | SHOULD SIMPLIFY | Source-of-truth/identity handoff first |
| internship-notes-sites-mirror | Publication mirror | N/A | Keep as mirror, not a second product surface |
| taichung-police-intel | Public-sector/police intelligence monitor | DIFFERENTIATOR | #12 role intelligence profile remains high-value |
| soundbox-offline | Local-first/offline music library | DIFFERENTIATOR | **NEW #3 zero-cloud same-LAN browser transfer** |
| skill-foundry | Agent-skill creation/certification | DIFFERENTIATOR | #1 runtime compatibility / negative-transfer gate |
| video-timeline-pipeline | Video intelligence / knowledge pipeline | DIFFERENTIATOR | Reusable Research Packs on existing roadmap; avoid parallel infra |
| ai-novel-workstation | Long-running AI writing workstation | DIFFERENTIATOR | #2 Context Manifest / selective memory routing |
| clinical-scribe-worker | Clinical scribe/evaluation worker | DO NOT ADD NOW | Auth/quota/audit integrity first |
| MaterialYouNewTab | New-tab productivity surface | KEEP LIGHT | Only thin, local, low-cost integrations if strongly justified |
| cf-mcp-server | Cloudflare MCP server | MUST MATCH | #6 protocol compatibility/conformance remains active direction |
| tick-stock-panel | Taiwan stock monitoring/simulation | MUST MATCH + RESEARCH | #2 coverage truth first; #5 NL compiler research second |
| herdr-skills | Multi-agent workflow skills | SHOULD BE BETTER | Portable proof receipts; do not duplicate Skill Foundry |

---

## External Signals

### 1. AI media provenance is becoming a product layer, not a metadata checkbox

**CONFIRMED — OpenAI, 2026-05-19; updated 2026-07-31**

OpenAI describes a layered provenance approach combining C2PA Content Credentials, SynthID and verification tooling. The July 31 update extends supported provenance/watermark verification into audio as well as images.

Source: https://openai.com/index/advancing-content-provenance/

**CONFIRMED — Adobe Firefly, updated 2026-09-04**

Adobe documents automatic Content Credentials for Firefly-generated content, including issuer/date/app/device/AI-tool/action metadata, with credential persistence mechanisms beyond a simple visible badge.

Source: https://helpx.adobe.com/tw/firefly/web/get-started/learn-the-basics/content-credentials-overview.html

**CONFIRMED — Adobe Creative Studio, updated 2026-08-25**

Adobe treats C2PA preservation as part of the editing pipeline: generative-AI creation/editing attaches provenance metadata, and supported transforms such as crop/resize can preserve it.

Source: https://experienceleague.adobe.com/en/docs/advertising/creative/creative-studio/creative-studio-content-credentials

**CONFIRMED — C2PA 2.4 / Conformance ecosystem, 2026**

C2PA 2.4 adds mechanisms including crJSON and repository receipt assertions; the ecosystem has a formal Conformance Program / Trust List and a 2026 implementation guide specifically addressing AI-generated / AI-modified content labels.

Sources:
- https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html
- https://c2pa.org/conformance/
- https://c2pa.org/a-new-implementation-guide-for-content-credentials/

**Transferable principle:** maintain an internal, versioned artifact receipt regardless of provider support; adapt external credentials separately; represent `verified / absent / invalid / unknown-after-transform` truthfully; never equate missing credentials with “human-made.”

### 2. Local-first media products are competing on zero-cloud onboarding and transfer

**CONFIRMED — PeerPlay, current 2026**

PeerPlay’s transfer workflow is directly relevant: phone and desktop on the same Wi-Fi, QR/private browser page, drag-and-drop local music, no desktop application, no account and no cloud library.

Source: https://peerplay.store/wifi-music-transfer/

**CONFIRMED — LocalSend, current 2026**

LocalSend reinforces the user mental model that local-network transfer can be cross-platform, accountless and cloudless, with transfer kept on the local network.

Source: https://localsend.org/

**CONFIRMED — WaveFlow v1.7.0, 2026-07-26**

WaveFlow positions local ownership, no tracking/cloud dependency and exportable/scheduled backups as part of the product value, not merely an implementation detail.

Source: https://waveflow.app/

**Transferable principle:** a local-first product should remove the external-tool jump required to get user-owned data into the product without quietly reintroducing a central account/cloud dependency.

### 3. Persistent agent memory needs freshness, scope validation and inert-data boundaries

**CONFIRMED — GitHub Copilot Memory public preview, 2026-03-04**

GitHub describes repository-scoped memories that are validated against the current codebase and automatically expire after a bounded period rather than remaining unquestioned forever.

Source: https://github.blog/changelog/2026-03-04-copilot-memory-public-preview/

**CONFIRMED — Supermemory changelog, 2026-07/08**

Supermemory’s recent updates add automatic recall/status visibility and cross-agent memory usage, but also document a security fix where recalled memory content could contribute to automatic approval/execution of a crafted command. This is an important boundary: memory is data/context, not action authorization.

Sources:
- https://supermemory.ai/changelog
- https://supermemory.ai/changelog/claude-code-plugin

**Portfolio implication:** `adng-memory` / `autodev-ng` should eventually represent memory source, scope, freshness/expiry, validation state and tool-authorization separation. No new Issue this round because a deeper duplicate/current-architecture pass is required. `Reese-max/claude-mem` itself is an upstream fork, so competitive feature Issues are inappropriate without an explicit divergence strategy.

### 4. Adaptive learning is increasingly history-aware rather than score-only

**CONFIRMED — SuperMemo API, 2026-03-31**

SuperMemo’s API can ingest substantial historical repetition data to personalize scheduling, reinforcing that prior attempt history should be a first-class input into future review decisions.

Source: https://www.supermemo.com/en/blog/supermemo-api-early-access

**CONFIRMED — Kognit, current 2026**

Kognit markets adaptive sessions, weak-concept targeting, spaced repetition and topic-progress/confidence signals as a connected learning loop.

Source: https://www.kognit.ai/

**Portfolio implication:** this reinforces `cyber-prep-coach #4`; it does not justify a duplicate “SRS engine” Issue. If history import / due-review is added, it should extend the same mastery profile and explainable next-best-task contract.

### 5. Grading products are treating provenance/fairness/auditability as quality infrastructure

**CONFIRMED — Provenance Learning changelog, 2026-07-16**

Recent product changes emphasize grading fairness boundaries, immutable/auditable records and security hardening rather than only adding more AI feedback surfaces.

Source: https://www.provenancelearning.com/changelog

**Portfolio implication:** `voice-actress` has just repaired its primary provenance/session defects. The next move should be runtime/calibration evidence before a new personalization or fairness feature, not immediate scope expansion.

---

## New Releases / Recent Changes Worth Tracking

| Date | Product/ecosystem | Change | Reese-max relevance |
|---|---|---|---|
| 2026-09-04 | Adobe Firefly | Latest Content Credentials guidance | `flux-image-gen`: provenance is now a visible product contract |
| 2026-08-25 | Adobe Creative Studio | C2PA preservation in generative/edit workflows | `flux-image-gen`: transforms must record preservation/invalidation |
| 2026-08-21 | Supermemory | Automatic memory recall + recall/status visibility | `adng-memory/autodev-ng`: visible memory provenance/freshness |
| 2026-08-12 | Supermemory | Memory-recall security hardening | agent memory must never become action authorization |
| 2026-07-31 | OpenAI / C2PA | Expanded provenance verification; new AI implementation guidance | cross-portfolio artifact receipts + external credential adapters |
| 2026-07-26 | WaveFlow | v1.7.0 local ownership / export / backup posture | `soundbox-offline`: local ownership is the moat |
| 2026-07-25 | Supermemory | Cross-agent memory workspace | memory portability requires scope/compatibility evidence |
| 2026-07-16 | Provenance Learning | Grading fairness/auditability/security update | `voice-actress`: validate repaired trust path before expansion |
| 2026-03-31 | SuperMemo | API early access with historical repetition input | `cyber-prep-coach`: extend mastery history, do not split learner state |

---

## Community Pain Points

These are `COMMUNITY_SIGNAL` only and are not treated as statistical evidence.

### AI provenance: metadata may disappear in real sharing workflows

Creator/OSINT discussions repeatedly note that social platforms, re-encoding and re-saving can strip C2PA or related metadata. The actionable product lesson is to expose truthful states such as `absent` and `unknown_after_transform`; absence cannot be interpreted as proof of non-AI origin.

Representative discussions:
- https://www.reddit.com/r/osinttools/comments/1vegal0/the_eus_ailabeling_rules_ai_act_article_50/
- https://www.reddit.com/r/SideProject/comments/1w66ixa/we_built_a_free_browser_tool_that_tells_you/

### Local music: the transfer step remains friction even when playback is solved

Recent Android/iOS discussions still revolve around USB transfers, loss of SD-card workflows, VLC/Plex/Plexamp/cloud/self-hosted workarounds and the difficulty of moving a personal collection onto a phone.

Representative discussions:
- https://www.reddit.com/r/androidapps/comments/1s48wnl/best_way_to_transfer_local_files_onto_your_phone/
- https://www.reddit.com/r/AndroidQuestions/comments/1u2z0w3/have_everyone_really_moved_on_from_local_media/
- https://www.reddit.com/r/ios/comments/1vnjm3r/how_to_stream_audio_files_i_own_on_iphone_without/

The signal supports a transfer/onboarding improvement, not a streaming-catalog pivot.

---

## Adjacent Ideas

### A. Portfolio-wide `ArtifactReceipt`

Reusable concepts across `flux-image-gen`, `ppt-studio`, `taichung-police-intel`, `video-timeline-pipeline`, `autodev-ng`:

- artifact id / version;
- source ids / hashes;
- producer/provider/model/tool version;
- input/context manifest hash;
- output hash;
- lineage / parent receipt;
- validation state;
- invalidation reason;
- privacy/public-share allowlist.

Do not force one giant shared library immediately. First standardize concepts/semantics, then extract only after multiple repos prove the same contract.

### B. Capability Truth Surface

Across providers, protocols, credentials and memories use explicit states such as:

`VERIFIED / PRESENT_UNTRUSTED / STALE / ABSENT / INVALID / UNKNOWN / UNSUPPORTED`

This is safer than binary badges and maps to MCP compatibility, AI-provider routing, source provenance, artifact credentials and memory freshness.

### C. Explicit local pairing session

The `soundbox-offline` QR/direct-import model can later transfer to other local-first tools, but only where it removes a real external-tool step. The reusable primitive is not “WebRTC everywhere”; it is **short-lived explicit pairing + truthful transport status + canonical local import**.

### D. Memory freshness / expiry contract

A future `adng-memory` review should consider:
- source repository/workspace;
- created/validated timestamps;
- source hashes or validation predicates;
- expiry/refresh policy;
- injected vs retrieved vs user-pinned memory;
- inert-data boundary before tools/actions.

### E. Fork / mirror scope guard for the radar itself

Before competitive feature creation, classify repository identity:
- original product;
- deliberate product fork with divergence;
- upstream fork/mirror;
- deployment/content mirror;
- empty/archive candidate.

Upstream forks should not receive product Issues by default.

---

## Opportunity Map

| Opportunity | Classification | Repo(s) | Score* | Action |
|---|---|---|---:|---|
| Verifiable generation/edit Provenance Receipt + Content Credentials status | DIFFERENTIATOR | flux-image-gen | **94/100** | **NEW #18** |
| Same-LAN QR/browser direct music import without cloud account | DIFFERENTIATOR | soundbox-offline | **91/100** | **NEW #3** |
| Memory freshness/expiry + inert-data boundary | SHOULD BE BETTER | adng-memory, autodev-ng | 84/100 | Research deeper before Issue |
| Historical repetition import into existing mastery model | SHOULD BE BETTER | cyber-prep-coach | 82/100 | Extend #4, no duplicate |
| Grading fairness/calibration evidence after trust fixes | RESEARCH_REQUIRED | voice-actress | 78/100 | Runtime proof first |
| Fork/mirror scope guard for portfolio radar | SHOULD BE BETTER | autodev-ng process | 88/100 | Add to future radar procedure/reporting, not product Issue this round |

\* Scores combine User Pain, Strategic Fit, Novelty, Evidence Strength, Reuse Potential and Implementation Effort, penalized for Security/Privacy/Cost risk. They are prioritization heuristics, not market forecasts.

### MUST MATCH

- `flux-image-gen`: provenance states must be truthful; missing credential is not proof of human origin.
- `soundbox-offline`: completed backup/restore remains a regression gate for future transfer work.
- `voice-actress`: repaired grading provenance/session lifecycle must receive runtime evidence before more adaptive logic.
- `cf-mcp-server`: protocol compatibility/conformance remains a maintained product contract.
- `tick-stock-panel`: data coverage/freshness truth remains a prerequisite for richer AI UX.

### SHOULD BE BETTER

- Memory should expose freshness/source/validation rather than silently injecting old context.
- Local-first import should remove avoidable external transfer tools.
- Generated artifacts should expose lineage/verification instead of only provider labels.

### DIFFERENTIATOR

- `flux-image-gen`: internal reproducibility receipt + external credential inspection/preservation.
- `soundbox-offline`: zero-account, zero-cloud transfer directly into the canonical offline library.

### ADJACENT IDEA

- Standardize receipt/state semantics across images, decks, intelligence outputs and agent results.
- Use explicit pairing-session primitives in other local-first products only if a real transfer handoff exists.

### DO NOT COPY

- Do not market C2PA as a truth detector.
- Do not add cloud accounts/sync/catalog features to Soundbox merely because music competitors have them.
- Do not copy upstream `claude-mem` features into its Reese-max fork without a fork strategy.
- Do not split learner state into separate SRS/mastery/planner engines.

---

## Top 10 Cross-Portfolio Ideas

1. **Versioned Artifact Receipt** — source/context/output hashes, producer version, lineage and validation state.
2. **Truthful Verification State Vocabulary** — verified/stale/absent/invalid/unknown instead of green/red badges.
3. **Transform Invalidation** — edits, re-encoding, model reruns and dependency changes must invalidate inherited evidence when appropriate.
4. **Local-First Direct Transfer** — remove USB/cloud/intermediate apps without quietly adding durable cloud storage.
5. **Memory Freshness Contract** — scope, source, validation and expiry before automatic injection.
6. **Inert Data Boundary** — memory/source content can inform reasoning but cannot authorize tool execution.
7. **Fork/Mirror Guard** — product radar should not create roadmap debt in upstream mirrors.
8. **Single Learner State** — mastery, SRS, deadline/capacity and practice recommendations should share one explainable model.
9. **Runtime Proof Receipts** — closed security/reliability Issues should preserve actual runtime evidence and environment scope.
10. **Privacy-Aware Share Schema** — share provenance/lineage without leaking prompts, private source material, tokens or signed URLs.

---

## Ideas Rejected / Deferred

- **Build our own C2PA signing authority immediately** — rejected for MVP. Certificate/trust/conformance/key-management complexity is not needed to gain value from internal receipts + upstream credential inspection.
- **Treat Content Credentials as AI detection** — rejected. Provenance describes origin/process claims; missing metadata is inconclusive.
- **Soundbox cloud account sync / streaming catalog / AI recommender** — rejected. These weaken the current local-first product position and do not address the observed transfer friction.
- **Soundbox full two-way sync with automatic deletes** — deferred. Start with explicit user-initiated push/import and safe pairing.
- **New product Issue in `claude-mem` fork** — rejected. It is explicitly an upstream fork with Issues disabled; track upstream until intentional divergence is defined.
- **Separate Cyber Prep SRS Issue** — duplicate-avoided; extend #4.
- **New Voice Actress personalization/fairness feature immediately** — deferred until repaired grade/session/provenance paths have runtime evidence.
- **New Prompt AutoResearch variance Issue** — still insufficient evidence that repeated-trial runtime cost materially changes promotion decisions.
- **Generalized WebRTC transfer platform in autodev-ng** — rejected as premature abstraction.
- **Broad “AI origin badge” in all products** — rejected; each domain needs evidence appropriate to the artifact and transform chain.

---

## Issue Mapping

### New Issues Created

- `Reese-max/flux-image-gen #18` — **[Competitive Inspiration][DIFFERENTIATOR] 建立可驗證的生成／編輯 Provenance Receipt 與 Content Credentials 保留策略**
  - https://github.com/Reese-max/flux-image-gen/issues/18
- `Reese-max/soundbox-offline #3` — **[Competitive Inspiration][DIFFERENTIATOR] 增加同網路 QR／瀏覽器直傳的無雲端音樂匯入流程**
  - https://github.com/Reese-max/soundbox-offline/issues/3

### Updated Existing Issues

- None this round.

### Duplicate / Scope Avoided

- `cyber-prep-coach #4`: SuperMemo/history-aware scheduling belongs in the existing mastery/next-best-task design.
- `voice-actress`: no new Issue until #1/#2 repairs receive runtime regression evidence.
- `claude-mem`: no Issue because Reese-max repository is an upstream fork/mirror scope, not currently an intentional divergent product.
- `note-filler`: existing evidence-review ledger remains the right contract; no duplicate provenance workspace.

### Recent Completed Preconditions Observed

- `soundbox-offline #1` — whole-library backup/restore completed on default branch.
- `flux-image-gen #11` — production abuse-control fail-closed fix completed on default branch.
- `voice-actress #1/#2` — grading provenance and session/dashboard defects completed on default branch.

---

## Sources

### Official / primary product and standards sources

- OpenAI content provenance: https://openai.com/index/advancing-content-provenance/
- Adobe Firefly Content Credentials: https://helpx.adobe.com/tw/firefly/web/get-started/learn-the-basics/content-credentials-overview.html
- Adobe Creative Studio Content Credentials: https://experienceleague.adobe.com/en/docs/advertising/creative/creative-studio/creative-studio-content-credentials
- C2PA 2.4 specification: https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html
- C2PA Conformance Program: https://c2pa.org/conformance/
- C2PA AI implementation guide: https://c2pa.org/a-new-implementation-guide-for-content-credentials/
- PeerPlay Wi-Fi music transfer: https://peerplay.store/wifi-music-transfer/
- LocalSend: https://localsend.org/
- WaveFlow: https://waveflow.app/
- GitHub Copilot Memory public preview: https://github.blog/changelog/2026-03-04-copilot-memory-public-preview/
- Supermemory changelog: https://supermemory.ai/changelog
- SuperMemo API early access: https://www.supermemo.com/en/blog/supermemo-api-early-access
- Kognit: https://www.kognit.ai/
- Provenance Learning changelog: https://www.provenancelearning.com/changelog

### Community signals — anecdotal only

- AI/C2PA metadata discussion: https://www.reddit.com/r/osinttools/comments/1vegal0/the_eus_ailabeling_rules_ai_act_article_50/
- C2PA browser-check discussion: https://www.reddit.com/r/SideProject/comments/1w66ixa/we_built_a_free_browser_tool_that_tells_you/
- Android local-file transfer discussion: https://www.reddit.com/r/androidapps/comments/1s48wnl/best_way_to_transfer_local_files_onto_your_phone/
- Android local-media discussion: https://www.reddit.com/r/AndroidQuestions/comments/1u2z0w3/have_everyone_really_moved_on_from_local_media/
- iOS owned-audio discussion: https://www.reddit.com/r/ios/comments/1vnjm3r/how_to_stream_audio_files_i_own_on_iphone_without/

---

## What Changed Since Last Radar

1. **Soundbox’s prerequisite changed from open gap to completed capability.** r4 correctly deferred new features until whole-library backup/restore existed; default branch now contains the completed backup/relink/fail-closed restore path, enabling a credible next-stage direct-transfer feature.
2. **Flux’s production-abuse prerequisite is now completed.** The prior fail-open rate-limit issue is closed on default branch; provenance can be planned without pretending the public-cost boundary is still untouched.
3. **Image provenance moved from a general trend to a concrete product opportunity.** Fresh Adobe/OpenAI/C2PA evidence plus the repository’s existing version-chain/export/share primitives make a provenance receipt a high-fit differentiator rather than speculative standards work.
4. **Voice Actress moved from blocker repair to verification phase.** Provenance/session defects landed, but adaptive/personalized expansion remains gated on runtime evidence.
5. **Portfolio scope discipline improved.** `claude-mem` was explicitly verified as an upstream fork; future radar rounds should classify forks/mirrors before opening feature Issues.
6. **Cross-portfolio architecture sharpened:** receipt + lineage + freshness + invalidation + truthful state now appears across image provenance, source claims, agent memory, protocol compatibility and learner recommendations.
