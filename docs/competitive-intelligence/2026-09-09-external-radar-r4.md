# External Competitive / New Product / Workflow Radar — 2026-09-09 r4

## Scope and Evidence Contract

- Portfolio scope: Reese-max owned, **unarchived** repositories visible to the connected GitHub account. Current inventory: **35 unarchived repositories**; archived repositories such as `openab`, `gemini-deidentifier`, and `obsidian-vault` are excluded from product opportunity mapping.
- Primary evidence this round: public web outside Reese-max GitHub repositories. Reese-max repository/Issue evidence is used to establish current product reality and duplicate/coordination boundaries, not as the market-research source.
- Freshness: prioritize the last 30–90 days; older/current pages are used where product-category change is slower or where they provide a necessary baseline.
- Evidence labels:
  - `CONFIRMED`: official product/docs/release or directly inspectable repository fact.
  - `LIKELY`: strong secondary evidence but not independently verified as product runtime.
  - `COMMUNITY_SIGNAL`: anecdotal user/developer discussion; never treated as prevalence statistics.
  - `UNKNOWN`: requires runtime, customer, educator, or deployment evidence.
- Marketing effectiveness claims are not treated as measured outcomes unless independently supported.

## Executive Summary

### High-value new opportunity — Project Doctor as a case-governed clinical education simulator

**New Issue:** `Reese-max/project-doctor-web #11`  
**Title:** `[Competitive Inspiration][RESEARCH_REQUIRED][SAFETY] 將 Project Doctor 收斂為 CaseSpec 驅動的虛擬病人＋能力回饋／Debrief`  
**Opportunity Score:** **96/100**

The strongest external signal this round is not “make the AI doctor smarter.” The clinical-education market is converging on a safer and more measurable contract:

`Educator-authored case truth → constrained virtual patient → learner actions/conversation → transcript/evidence ledger → rubric/checklist → debrief/replay`

`project-doctor-web` already has dynamic questioning, SOAP, objective-data injection, deterministic emergency interception and a strict output parser, but it does not yet expose an educator-authored scenario truth, versioned competency rubric, evidence-linked debrief or replay contract. Current open P1 #9 also demonstrates why this matters: unobserved objective findings must never be silently turned into normal facts.

The new Issue is **research-only and explicitly blocked from public expansion by existing P1 #2 and #9**. It does not authorize real-patient data, EHR writes, diagnostic autonomy, voice/video expansion or production clinical action.

### Secondary strategic signal — multi-agent monitoring is becoming “attention routing,” not only telemetry

`lobsterpulse` already monitors 13 provider paths, waiting/completion states, notification sounds and Prometheus metrics. Current external products are moving one step beyond “show every session” toward **“tell me which session needs me now, why, and let me jump to the exact pending interaction.”**

Recent/current signals:
- Agent Watch: one dashboard across Claude Code/Codex/Gemini, explicit `waiting on you`, permission/question detection, needs-attention markers, Slack/Teams/Discord/SMS/email routing, mobile live terminal, token/cost rollups.
- OpenAI Codex 0.149.0 (2026-08-20): an interactive multi-session agents dashboard plus `codex queue` for messaging an existing local/remote session.
- `agents-observe` 0.9.12 (released 2026-07-22; last commit 2026-09-04): real-time Claude Code/Codex observability, replay and token usage.

This is a meaningful market-direction change, but **no LobsterPulse Issue is opened this round** because the repository still has an open P1 (#3) on enabling Codex monitoring correctly. The concept is retained as a research candidate: a local-first **Attention Inbox** driven by existing waiting/error/provider-health evidence, without copying remote-control SaaS scope.

## External Signals

### A. Direct competitor recent capabilities

#### A1 — SimChat / Geeky Medics: scenario authoring from existing teaching materials
**Status:** CONFIRMED  
**Date:** 2026-05-28; support authoring doc updated 2026-09-04; rechecked 2026-09-09  
**Sources:**
- https://geekymedics.com/virtual-patient-simulator/
- https://app.simchat.ai/medical-education/
- https://support.geekymedics.com/en/article/how-do-i-create-and-share-osce-stations-12tydyj/

**JTBD:** turn an existing patient script/OSCE checklist/mark scheme/vignette/local teaching document into a reusable virtual-patient exercise.

**Why fewer steps / more reliable:** the educator does not rebuild the scenario from a generic prompt each session; the script and checklist remain the teaching contract, while the learner receives a conversational interface. Transcript, checklist, rubric and learning objectives are kept together for review.

**Onboarding/distribution:** scenario library, private-by-default authoring, direct-link sharing, group practice, text/voice/video practice. A 2026-09-04 support update documents AI station generation with a free allowance, credit-based additional generations and daily caps.

**Business-model signal:** scenario creation itself is treated as a bounded resource/product capability. Do not copy credits; the useful principle is that expensive generation and reusable educator assets are separate product objects.

**Limits / do not copy:** 800+ scenario breadth is not evidence that automatically generated cases are high quality. Reese-max should start with few versioned synthetic/educator-reviewed cases, not mass-generate a catalog.

#### A2 — Agent Watch: multi-agent observability shifts to needs-attention routing
**Status:** CONFIRMED current product surface; launch date UNKNOWN  
**Checked:** 2026-09-09  
**Source:** https://agent-watch.com/

**JTBD:** supervise several Claude Code/Codex/Gemini sessions without repeatedly opening terminal tabs.

**Workflow innovation:** working/idle/waiting-on-you state, event timeline, permission/question detection, needs-attention dots, channel alerts, remote/mobile terminal, cost rollup, and config versioning/dry-run.

**Distribution:** one global install and repo-scoped onboarding paths.

**Pricing signal:** subscription pricing shows that fleet attention/remote supervision is being packaged as a standalone developer product, not a hidden CLI utility.

**What fits LobsterPulse:** `needs_attention_reason`, age/urgency, provider-health correlation, one-click jump/open, local notification aggregation, and a compact attention queue.

**What should not be copied:** cloud remote terminal, broad team/admin SaaS, SMS/ElevenLabs, or central config mutation unless a separate authorization/privacy case is proven. LobsterPulse's local-first desktop niche can stay narrower.

#### A3 — OpenAI Codex multi-session dashboard + queue
**Status:** CONFIRMED official multi-agent direction; v0.149 details cross-checked through current release trackers  
**Dates:** Codex app 2026-02-02 / Windows update 2026-03-04; Codex 0.149.0 released 2026-08-20  
**Sources:**
- https://openai.com/index/introducing-the-codex-app/
- https://github.com/openai/codex/releases/tag/rust-v0.149.0
- https://codex.danielvaughan.com/2026/08/29/codex-cli-v0149-multi-session-agents-dashboard-codex-queue-working-directory/

**JTBD:** manage multiple parallel agents and send follow-up instructions without reopening each terminal.

**Signal:** the operational model is changing from “one agent conversation” to “fleet / session management.” This reinforces both `autodev-ng #11` (STEER vs QUEUE identity) and a future LobsterPulse attention surface.

**Do not copy:** do not make LobsterPulse a second orchestrator. Observation/attention should consume authoritative provider/session state rather than inventing another execution authority.

### B. Adjacent transferable workflows

#### B1 — Body Interact: simulation is incomplete without reflection/analytics
**Status:** CONFIRMED  
**Dates:** AI conversations beta available 2026-04-22; current pages rechecked 2026-09-09  
**Sources:**
- https://bodyinteract.com/blog/ai-driven-conversations-virtual-patient/
- https://bodyinteract.com/virtual-patient-simulator/

**Transferable principle:** an interactive simulation should produce an inspectable post-run learning object. For Project Doctor, that means timeline + revealed/missed case facts + rubric evidence + unsupported statements, not only an AI-generated SOAP summary.

#### B2 — SimX: natural language can be flexible while scenario authority stays deterministic
**Status:** CONFIRMED current product architecture statement  
**Checked:** 2026-09-09  
**Source:** https://www.simxvr.com/platform/autonomous-simulation/

SimX describes autonomous learners talking naturally to patients/family/care-team characters while a tightly controlled AI layer only triggers pre-authored clinician-validated actions.

**Transferable principle:** `natural-language interaction != clinical state authority`. This maps directly to a Project Doctor `CaseSpec`: facts, results and allowed state transitions remain authored/validated; the model performs role expression rather than world-state invention.

**Do not copy:** no VR, 3D avatar, expensive physiology engine or multiplayer is needed for the MVV.

#### B3 — New-tab products: local canonical data + optional collaboration remains viable
**Status:** CONFIRMED but mostly repeated from prior radar  
**Recent examples:** Tanhome updated 2026-08-19; Slaet/Speedtab current 2026 products  
**Sources:**
- https://chromewebstore.google.com/ (Tanhome/Slaet/Speedtab current listings surfaced in search)
- https://slaet.app/

The important design signal remains: local-first/no-account does not prevent carefully opt-in sync or narrow shared objects. This remains an `ADJACENT IDEA` for `MaterialYouNewTab`; no new Issue because r3 already captured this direction and current evidence does not materially change it.

### C. Emerging tools / technical possibilities

#### C1 — Evidence-grounded educational simulation rather than unconstrained medical chatbot
**Status:** CONFIRMED research signal  
**Date:** 2026  
**Source:** https://www.jmir.org/2026/1/e82756

A 2026 JMIR systematic review finds GenAI virtual-patient education promising but emphasizes short intervention durations, heterogeneous designs, limited educational-theory grounding, and the need for stronger standardized protocols. No meta-analysis was performed because evidence was too heterogeneous.

**Product implication:** Project Doctor should not use “AI virtual patient” as a success claim. It needs versioned cases, rubric/evidence contracts, replayable outcomes, and explicitly scoped validation before making educational-effect claims.

#### C2 — Machine-readable multi-agent observability feeds
**Status:** CONFIRMED current open-source/product signal  
**Sources:**
- https://www.claudepluginhub.com/plugins/simple10-agents-observe
- https://agent-watch.com/

`agents-observe` (0.9.12, 2026-07-22; current maintenance through 2026-09-04) and current agent dashboards expose replay/telemetry/attention states as structured machine-readable data. LobsterPulse already has Prometheus metrics; a future “attention queue” can be derived from existing local evidence rather than screen scraping or LLM classification.

## New Releases / Fresh Product Changes

1. **2026-09-04 — Geeky Medics OSCE authoring support updated:** AI station generation, virtual-patient station modes, private library, direct-link sharing, group practice, credit caps. Source: https://support.geekymedics.com/en/article/how-do-i-create-and-share-osce-stations-12tydyj/
2. **2026-09-04 — `agents-observe` latest commit noted by plugin index:** version 0.9.12 originally released 2026-07-22, live Claude/Codex observability/replay. Source: https://www.claudepluginhub.com/plugins/simple10-agents-observe
3. **2026-08-20 — Codex 0.149.0:** multi-session `agents` dashboard; current release coverage also records `codex queue` for sending messages to existing sessions. Source: https://github.com/openai/codex/releases/tag/rust-v0.149.0
4. **2026-08-19 — Tanhome new-tab update:** offline/private notes/tasks/planners/habits/timers/links and local backup; confirms local-first new-tab competition is still active. No new gap beyond prior MaterialYouNewTab radar.
5. **2026-09-03 — major cross-provider AI outage signal:** multiple reports described simultaneous instability across ChatGPT, Claude and Grok. This is not a product feature, but it reinforces an observability need to distinguish “this agent needs you” from “upstream provider/system is unhealthy.” This remains research-only until provider-health evidence quality is verified.

## Community Pain Points

### Multi-agent coding — attention saturation
**Classification:** COMMUNITY_SIGNAL / secondary product signal

Current developer-facing products increasingly describe the pain as “I have several sessions and do not know which one is waiting.” This is consistent with the direct-product surfaces in Agent Watch, AgentHUD/agents-observe and Codex's own session dashboard. Do not translate this into a prevalence statistic. For Reese-max, the actionable question is whether existing LobsterPulse `waiting/error/provider-health` facts can produce a deterministic attention list with fewer false alerts than generic notifications.

### Clinical simulation — generic AI feedback is not sufficient evidence
**Classification:** CONFIRMED research limitation + vendor workflow signal

The independent systematic review does not support treating short single-session GenAI virtual-patient studies as proof of general educational efficacy. The practical response is not “more AI”; it is tighter case/rubric/version/replay evidence.

## Opportunity Map — 35 Unarchived Reese-max Repositories

| Repository | Market category | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| exam-archive | exam archive / learning | canonical source traceability | explicit source/freshness | official-evidence-first study surface | reuse attempt/review truth from police-exam-archive | generic AI question flood |
| police-exam-practice | legacy compatibility shell | truthful redirect/deep-link contract | minimal accessible fallback | thin compatibility, no duplicate logic | usage telemetry only if privacy-safe | rebuild quiz here |
| police-exam-archive | exam practice platform | official-question provenance | attempt/mastery/review state | deadline-aware evidence-based review | expose canonical learning state to external AI later | generic AI tutor before truth layer |
| 92-duty-scheduler | duty/workforce scheduling | authorization + deterministic constraints | policy explainability/preview | unit-specific Rule Studio + reason codes | policy import/export | autonomous LLM scheduler |
| UkePack | teacher music pack workflow | safe project authorization/reliable CI | teacher batch prep evidence | privacy-minimal differentiated workshop packs | practice toolkit only after real teacher study | full LMS/child roster by default |
| ppt-studio | AI presentation workstation | local API/auth boundaries | source provenance + artifact verification | evidence-linked local deck production | source-in-place generation connectors | hosted collaboration suite creep |
| voice-actress | essay/answer grading | rubric/evidence traceability | exact answer-span + source verification | evidence-linked legal/exam feedback | shared EvidenceLinkedFeedback schema | opaque AI score |
| taiwan-intel-dashboard | intelligence dashboard | source/date/coverage truth | cross-source reconciliation | public-sector evidence receipts | reusable role-specific briefs | generic news portal |
| autodev-ng | agent orchestration | exact execution identity | STEER/QUEUE + receipts | bounded, auditable multi-agent operations | consume LobsterPulse attention signals | unrestricted remote control |
| flux-image-gen | image generation | provenance/export integrity | C2PA/metadata verification | reproducible provenance receipt | asset lineage across decks/docs | style/feature sprawl without provenance |
| claude-mem | agent memory | scope/freshness/deletion truth | explicit stale/supersede | inspectable memory lifecycle | share adng-memory envelope concepts | infinite memory accumulation |
| lobsterpulse | local AI CLI observability | provider hook correctness | **attention routing + provider-health correlation** | local-first 13-provider observability | needs-attention inbox / exact jump | remote-terminal/team SaaS clone |
| prompt-autoresearch | prompt experimentation | repeatable eval | variance-aware repeated evidence | bounded evidence-first auto-research | holdout/production drift watch | optimize on one noisy score |
| neciken-summer-poem | writing/contest workflow | current rules/deadlines | rule-drift receipt | source-verified contest fit | reusable deadline/source checker | mass-submit automation |
| note-filler | structured note/document automation | evidence provenance | claim review ledger | evidence-linked completion | reusable evidence locator | silent factual completion |
| lplrs-judicial-sync | judicial data ingestion | deletion/takedown compliance | durable erasure beyond Git | auditable sync/tombstone receipt | non-Git erasable object storage research | immutable raw bodies in Git history |
| adng-memory | operational memory store | ownership/retention | activation/staleness/deletion contract | cross-repo verifiable memory lifecycle | pilot one real writer | vector DB just because competitors use one |
| cyber-prep-coach | cyber exam coaching | mastery truth | next-best study action | evidence-grounded skill mastery | canonical learner-state connector | generic chat tutoring |
| cf-ai-router | AI gateway/router | cost/capability hard gates | Responses API + task reliability profiles | quota-first deterministic routing | local GPU/PAIR provider as explicit node | black-box dynamic routing |
| avatar-vfo | agent/avatar product | auth/deploy gate correctness | verified runtime promotion | constrained assistant actions | evidence/permission receipts | autonomous high-risk actions |
| **project-doctor-web** | **clinical education simulator** | **fact provenance + safe scope** | **CaseSpec + evidence-linked debrief** | **controlled virtual patient whose truth is educator-authored** | rubric/replay/curriculum packs | **generic autonomous AI doctor** |
| minideck | lightweight presentations | published-head correctness | immutable current/published separation | tiny trustworthy publishing pipeline | source-triggered deck creation later | full office suite |
| chatgpt-dual-pipeline | internship/public notes | publication eligibility/privacy | portable verification | de-identified source→site chain | evidence-linked reflection aids | account/CMS complexity |
| internship-notes-sites-mirror | publish mirror | deterministic canonical handoff | dry-run/verification | thin mirror contract | deployment receipt surfacing | second content source of truth |
| taichung-police-intel | public-sector intelligence | source/reconciliation | live provisional→verified lifecycle | role-profile operational brief | outage/source health integration | generic alert firehose |
| soundbox-offline | offline/local media | offline ownership | easy LAN/browser import | no-account offline sound workflow | QR/local transfer | cloud media service |
| skill-foundry | agent-skill certification | artifact identity/security | runtime compatibility + supply-chain attestation | evidence-gated promotion | shared package capability manifest | marketplace/catalog race |
| video-timeline-pipeline | video evidence analysis | replayable baseline evidence | bounded local evidence escalation | selection manifests/receipts | claim-driven reinspection | full-video expensive agentic scan |
| ai-novel-workstation | long-form AI writing | reproducible context/cost state | Context Manifest + Cost Envelope | auditable local production loop | author-visible routing controls | subscription-credit UX copied blindly |
| clinical-scribe-worker | clinical documentation | source/PHI/safety boundaries | specialty-scoped validation | validation packs + omission/misattribution gates | shared Case/Evidence manifest concepts only | new clinical autonomy before validation |
| MaterialYouNewTab | local-first new tab/productivity | privacy + low permissions | simpler capture/optional sync | Traditional-Chinese local productivity dashboard | opt-in collaboration/current-tab capture | account-first cloud suite |
| cf-mcp-server | MCP/Cloudflare control plane | protocol/auth conformance | gradual promotion + health gates | exact-target approval/receipt | shared capability permission policy | autonomous production mutation |
| tick-stock-panel | market dashboard/backtest | truthful coverage/as-of | normalized provider capability | transparent Taiwan-data routing | strategy compiler after data truth | live brokerage scope creep |
| herdr-skills | multi-agent skill/workflow layer | runtime/skill identity | compatibility/security evidence | reusable audited orchestration skills | consume Skill Foundry attestations | duplicated agent framework |
| ninax-line-hermes | LINE AI/video agent | revision/redelivery correctness | stale-job invalidation | source-verified LINE video summary | controlled correction workflow | noisy autonomous messaging |

## Opportunity Score — This Round Candidates

### 1. Project Doctor CaseSpec + Competency Debrief — **96/100** — ISSUE CREATED
- User Pain: 9/10
- Strategic Fit: 10/10
- Novelty: 9/10
- Evidence Strength: 10/10
- Reuse Potential: 9/10
- Implementation Effort: 6/10 (lower is better; medium)
- Security/Privacy/Cost Risk: 5/10 (manageable only with synthetic-first / blocked production expansion)

**Disposition:** create research/safety Issue #11. Hard dependency: existing #2/#9 before public expansion.

### 2. LobsterPulse deterministic Attention Inbox — **91/100** — RESEARCH LIST ONLY
- User Pain: 9/10
- Strategic Fit: 10/10
- Novelty: 7/10
- Evidence Strength: 9/10
- Reuse Potential: 9/10
- Implementation Effort: 5/10
- Security/Privacy/Cost Risk: 3/10 if local/read-only

**Why not Issue now:** open P1 #3 remains on core Codex monitoring activation. The opportunity is real, but an attention layer built on unreliable hook activation would amplify false confidence. Revisit after #3 closes with runtime evidence.

### 3. MaterialYouNewTab optional sync/shared objects — **84/100** — REJECT AS NEW ISSUE
Strong market signal but substantially duplicates r3's local-canonical + opt-in collaboration research. No materially new fingerprint.

### 4. Cross-provider outage correlation for agent monitors — **82/100** — RESEARCH LIST
Potentially useful to distinguish `WAITING_FOR_USER` from `UPSTREAM_DEGRADED`, but provider status truth, false-correlation risk and maintenance burden are not yet proven. Prefer explicit health adapters over news/social inference.

## Top 10 Cross-Portfolio Ideas

1. **Case/Policy/Artifact truth separated from LLM interaction.** LLM may translate or converse; authoritative state lives in a typed versioned object.
2. **Evidence-linked debrief everywhere.** Grading, simulation, intelligence, agent actions and document review should answer “what exact evidence produced this judgment?”
3. **Attention routing as a first-class operator layer.** Status dashboards should identify what needs human action, why, how old it is, and the exact target identity.
4. **Proposal ≠ activation.** AI-generated case/policy/config/skill remains a candidate until deterministic validation and explicit promotion.
5. **Replay receipts for training and operations.** Same case/policy/input head should be replayable; drift must be visible, not silently absorbed.
6. **Provider/outage state is distinct from task failure.** Agent monitors and AI routers should avoid blaming the task when the upstream service is degraded.
7. **Bound expensive generation separately from reusable authored assets.** Credits are not required, but case generation/probing/eval should have explicit cost/rate envelopes.
8. **Local-first remains a viable differentiator.** Optional sync/collaboration should add narrow object-level sharing rather than replacing local canonical state.
9. **Validation scope must be explicit.** Synthetic clinical cases, provider probes, persona simulations and one-client smokes must never be generalized into universal efficacy/support claims.
10. **Simplify before adding.** For Project Doctor, the opportunity includes deleting the ambiguous “generic AI doctor” mental model in favor of select-case → simulate → debrief; for LobsterPulse, prioritize attention over more charts/providers.

## Ideas Rejected / Deferred

### Rejected — Turn Project Doctor into a stronger diagnostic assistant
Reason: external evidence points to simulation governance, not greater clinical autonomy; existing P1 provenance/cost findings make autonomy expansion strategically wrong.

### Rejected — Copy Body Interact/SimX VR, avatars and physiology engine
Reason: high implementation/validation cost; does not reuse Project Doctor's strongest current primitives. The transferable idea is controlled scenario state + debrief.

### Deferred — Add voice/video to Project Doctor because SimChat has it
Reason: higher privacy/cost/runtime complexity before case truth/rubric and P1 safety fixes are established.

### Deferred — Open LobsterPulse Attention Inbox Issue now
Reason: open P1 #3 on Codex hook activation. Keep the opportunity, but do not build a higher-level status claim on a known unreliable source path.

### Rejected — MaterialYouNewTab account-first cloud sync
Reason: directly weakens its low-permission local-first advantage; prior radar already captured narrow opt-in collaboration.

### Rejected — News/social based provider outage auto-classification
Reason: anecdotal/secondary reports are unsuitable as runtime truth. A future provider-health feature should use official status/transport evidence with `UNKNOWN` fallback.

## Issue Mapping

| Candidate | Repo | Existing duplicate? | Lock/coordination | Action |
|---|---|---|---|---|
| CaseSpec + virtual patient + rubric/debrief | project-doctor-web | No matching open/closed Issue or PR found | repository `github-issue-lock:v1` code search = 0 | **Created #11** |
| Attention Inbox / waiting-on-human triage | lobsterpulse | No matching feature Issue/PR found | core monitoring has open P1 #3 | Research list only |
| local canonical + opt-in collaboration | MaterialYouNewTab | Concept already captured in prior radar | n/a | No new Issue |
| provider outage correlation | lobsterpulse / cf-ai-router | overlaps existing health/reliability primitives, evidence not sufficient | n/a | Research list only |

## Sources

### Clinical simulation / education
- 2026-05-28 — Geeky Medics Virtual Patient Simulator / SimChat: https://geekymedics.com/virtual-patient-simulator/
- Current 2026 — SimChat medical education workflow: https://app.simchat.ai/medical-education/
- Updated 2026-09-04 — Geeky Medics OSCE station authoring/sharing: https://support.geekymedics.com/en/article/how-do-i-create-and-share-osce-stations-12tydyj/
- 2026-04-22 beta availability — Body Interact AI-Driven Conversations: https://bodyinteract.com/blog/ai-driven-conversations-virtual-patient/
- Current 2026 — Body Interact virtual-patient/debrief analytics: https://bodyinteract.com/virtual-patient-simulator/
- Current 2026 — SimX Autonomous Simulation: https://www.simxvr.com/platform/autonomous-simulation/
- 2026 — JMIR systematic review, GenAI-supported virtual patients: https://www.jmir.org/2026/1/e82756

### Agent monitoring / attention routing
- Current 2026 — Agent Watch: https://agent-watch.com/
- 2026-02-02 / 2026-03-04 update — OpenAI Codex app: https://openai.com/index/introducing-the-codex-app/
- 2026-08-20 — OpenAI Codex release 0.149.0: https://github.com/openai/codex/releases/tag/rust-v0.149.0
- 2026-08-29 / 2026-08-31 — current Codex 0.149 workflow analysis cross-referencing upstream release: https://codex.danielvaughan.com/2026/08/29/codex-cli-v0149-multi-session-agents-dashboard-codex-queue-working-directory/
- 2026-07-22, last commit indexed 2026-09-04 — agents-observe: https://www.claudepluginhub.com/plugins/simple10-agents-observe

### Repository evidence inspected through connected GitHub
- `Reese-max/project-doctor-web` README and Issues #2/#9; no product `rubric`/`debrief` code hits.
- `Reese-max/lobsterpulse` README and open Issue #3; product currently covers 13 provider paths, waiting/completion signals, sounds and Prometheus metrics.
- Previous central radar: `docs/competitive-intelligence/2026-09-09-external-radar-r3.md`.

## What Changed Since Last Radar

Compared with r3:

1. **New portfolio direction signal:** the clinical-education market gives a stronger, safer destination for `project-doctor-web`: case-governed virtual-patient simulation with rubric/debrief, rather than a more autonomous AI doctor.
2. **New Issue created:** `project-doctor-web #11`, Opportunity Score 96/100, with synthetic-only CaseSpec research and hard dependency on current P1 #2/#9 before public expansion.
3. **New multi-agent market signal:** Codex 0.149 + Agent Watch + agents-observe reinforce that observability is evolving into **attention routing / multi-session fleet management**. This raises a LobsterPulse opportunity but does not yet justify a new Issue while #3 is open.
4. **No repeat Issue for MaterialYouNewTab:** local-first + optional sync/collaboration remains valid but is not materially new versus r3.
5. **Portfolio inventory corrected to current connected state:** 35 owned, unarchived repositories are mapped this round; archived repos are excluded rather than carrying forward older portfolio counts.

## Round Decision

**NOTIFY-worthy finding exists:** yes — one high-value new product-direction opportunity was created as `project-doctor-web #11` and the signal is supported by recent direct-competitor authoring/distribution changes, adjacent controlled-simulation architecture, and independent 2026 research limitations.

No source code, implementation branch, merge, deployment, secrets, permissions or repository settings were modified in this radar. Only the research Issue and this central intelligence report were written.