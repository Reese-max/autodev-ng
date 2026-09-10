# External Competitive / New Product / Workflow Radar — 2026-09-09 r6

## Scope and Evidence Contract

- Portfolio scope: Reese-max owned, **unarchived** repositories visible to the connected GitHub account. Current inventory remains **35 unarchived repositories**.
- Archived repositories are excluded from this round (`openab`, `gemini-deidentifier`, `obsidian-vault`).
- Primary research source this round is the **public web outside Reese-max GitHub**. Reese-max GitHub is used to establish current product reality, recent changes, issue/PR duplicate boundaries and lock coordination.
- Freshness: priority is the last 30–90 days. Older sources are used only where they define a durable product pattern or protocol.
- Evidence labels:
  - `CONFIRMED`: official product/docs/release/spec, peer-reviewed proceedings, directly inspectable repository fact, or source with inspectable methodology.
  - `LIKELY`: strong secondary evidence whose runtime outcome has not been independently verified.
  - `COMMUNITY_SIGNAL`: anecdotal user/developer discussion; never treated as prevalence statistics.
  - `UNKNOWN`: requires runtime, human-user, customer, or deployment evidence.
- Vendor performance claims are treated as capability/positioning signals unless independently corroborated.

## Executive Summary

### High-value new opportunity — avatar-vfo needs to prove that its visible psychological state actually improves long-horizon character continuity

**New Issue:** `Reese-max/avatar-vfo #5`  
**Title:** `[Competitive Inspiration][RESEARCH_REQUIRED] 建立 Persona Continuity Regression Harness，驗證 VFO 狀態機與結構化記憶的增量價值`  
**Opportunity Score:** **95/100**

The strongest new signal this round is not “add more memory” or “add more emotional meters.” It is a market/research correction:

`single-turn role-play quality ≠ long-horizon persona continuity`

and

`plausible emotional state machine ≠ measured incremental value`

`avatar-vfo` is unusually well positioned to test this because it already has a distinctive six-dimensional VFO state system, auto-simulation, parsed state reinjection, multiple OpenAI-compatible model routes and a visible inspection UI. However, its raw message context sent to the model is capped at the latest 20 rounds, while the VFO numeric state is explicitly carried forward as an authoritative prior state. That means a character can preserve L/T/SAI/B-D/MF/ATM while still losing the concrete relationship events that made those numbers meaningful.

The market has moved toward explicit memory/canon layers: Character.AI launched Lorebook in July 2026 and Kindroid documents layered persistent/cascaded/retrievable memory, with model/experience migration now a real product lifecycle event. Meanwhile, July–August 2026 research introduced dedicated persona-collapse/trajectory-recall audits and produced an uncomfortable result for state-heavy architectures: ZifaMem found structured memory helpful under its protocol, while an additional emotion state machine had no measurable incremental gain on its best-powered endpoints once structured memory was present.

This does **not** prove VFO is useless. It creates a high-value falsifiable research question:

> Does VFO state provide incremental continuity, explainability or creative-control value after controlling for memory policy and model/provider?

The proposed product contract is:

`ScenarioPack → exact RunFingerprint → long-horizon replay → Persona / Trajectory / Negative-Knowledge / State↔Reply metrics → Memory×State ablation → migration gate → evidence-backed KEEP / SIMPLIFY / REMOVE-FROM-CLAIM decision`

### Portfolio implication

This round introduces a reusable **behavioral migration gate** for any Reese-max product whose experience depends on an LLM’s persistent persona, tone, memory or policy behavior:

`Behavior Contract → Sealed Probes → Exact Model/Prompt/Memory Fingerprint → Paired Replay → Non-inferiority Gate → Promotion Receipt`

The same primitive can later inform `ai-novel-workstation`, `voice-actress`, `adng-memory`, `claude-mem`, `ninax-line-hermes` and agent-memory systems, but this round creates only the `avatar-vfo` Issue because it has the clearest product differentiator and the strongest new falsification evidence.

---

## Recent Reese-max Changes Since r5

### `avatar-vfo` — current audit makes this opportunity actionable

Latest repository activity is an audit round on 2026-09-09. Current product reality:

- VFO Cognitive Engine forces a seven-step workflow and settles six evolving state dimensions: L, T, SAI, B-D, MF and ATM.
- Parsed state from the prior assistant turn is explicitly reinjected as a **system-authoritative** starting state for the next turn.
- Raw dialogue context sent to the LLM is capped at **20 rounds** (`MAX_HISTORY_ROUNDS = 20`); stored history is larger.
- Local/FastAPI UX supports MiniMax, ProxyPilot(ChatGPT) and Hermes(Grok) OpenAI-compatible routes; Worker path is server-bound.
- Auto-simulate exists, making repeatable long-horizon replay feasible without inventing a new runtime.
- The 2026-09-07 product-board audit already identified “reproducible simulation evaluation” as the strategically correct direction and explicitly deferred an export/comparison Issue because evidence/acceptance boundaries were not yet strong enough.

The new public evidence in this round supplies that missing boundary.

### Coordination / blocker state

`avatar-vfo #2` is currently open P0 and has an active `github-issue-lock:v1` held by another worker for Cloudflare Access JWT signature verification. This radar did **not** touch or claim that issue. New #5 is research/evaluation-only and explicitly blocks any new production memory/state mutation surface behind #2/#3.

### `clinical-scribe-worker`

Latest change is also a Round-3 audit, not a new product-direction change. Existing specialty-scoped validation and clinical provenance Issues continue to own the relevant fingerprints. No duplicate clinical feature was created this round.

---

# External Signals

## A. Direct / close-market product signals

### A1 — Character.AI Lorebook: canonical world knowledge is separated from character definition
**Status:** CONFIRMED  
**Released:** 2026-07-24; support article updated 2026-08-13  
**Sources:**
- https://blog.character.ai/lorebook/
- https://support.character.ai/hc/en-us/articles/52739596326811-Lorebooks

Lorebook stores side characters, locations, items, events, factions and world rules as keyword-activated entries. One Lorebook can be linked to multiple Characters so they share a canonical world. Character.AI explicitly frames the design as removing the tradeoff between putting personality and worldbuilding into the same finite character definition/context.

**JTBD:** keep long-running role-play consistent without repeatedly re-explaining all lore or expanding one giant prompt.

**Why fewer steps:** creators define a world fact once and reuse it across characters; only relevant entries enter context.

**Onboarding/distribution:** creation works through templates and in-chat viewing/editing rather than requiring a creator to understand embeddings or RAG.

**Automation/integration signal:** knowledge activation is contextual and selective, not all-context-all-the-time.

**Pricing signal:** Lorebook creation/editing is initially a c.ai+ capability, making memory/canon management part of premium product value.

**Limit / do not copy:** Character.AI’s social feed, creator distribution and consumer entertainment stack are not the right target for `avatar-vfo`. Keyword lore retrieval is also not evidence that relationship trajectory is solved.

**What fits Reese-max:** split persona truth, world canon, episodic relationship events and derived VFO state into independently testable context sources.

### A2 — Kindroid Memory + V2 transition: memory architecture and model migration are product contracts
**Status:** CONFIRMED  
**Memory docs updated:** 2026-08-11  
**V2 log rechecked:** 2026-09-09; V2 is default, V1 retirement planned for 2026-10-01  
**Sources:**
- https://kindroid.ai/v2/docs/memory/
- https://kindroid.ai/v2/docs/update-log/

Kindroid publicly distinguishes persistent memory, cascaded medium-term memory and retrievable long-term memory across multiple memory systems. Paid subscribers receive stronger cascaded memory. The V2 transition demonstrates another important lifecycle fact: companion products change models/context behavior under existing characters, so continuity needs migration testing rather than only API compatibility testing.

**JTBD:** preserve “the same companion” as conversations and product versions evolve.

**Why fewer steps:** users should not need to re-enter backstory or repeatedly remind the system of events after context/model changes.

**Business model:** memory capacity/quality is explicitly part of subscription differentiation.

**Limit / do not copy:** paid memory is not proof of better outcomes; vendor claims are not used as measured efficacy.

**What fits Reese-max:** every provider/model/system-prompt/memory-policy change should have an exact runtime fingerprint and a continuity regression result.

### A3 — AsgineAI 2026-09-08: writing products are also moving from generic recency to scene-relevant long-term continuity
**Status:** CONFIRMED product capability; vendor outcome not independently verified  
**Released:** 2026-09-08  
**Source:** https://www.asgineai.com/changelog

The release says long-running stories now keep important preferences/boundaries/duties available, select story memory using the current scene rather than unrelated recency, reject accidental repeated continuations and avoid persisting failed drafts.

**Signal:** continuity systems increasingly need *selection provenance and failure hygiene*, not just a larger window.

**Portfolio fit:** reinforces `ai-novel-workstation #2` context/provenance direction. No new Issue created because that existing fingerprint already owns the problem.

---

## B. Adjacent transferable workflow / research

### B1 — ZifaMem: structured memory showed measurable benefit; extra emotion state did not under memory
**Status:** CONFIRMED research result within its stated protocol  
**Published:** 2026-07-20  
**Source:** https://arxiv.org/abs/2607.17564

ZifaMem organizes dialogue into session summaries, episodic memories and a consolidated user model. Under a route-audited four-backbone protocol it reports a pooled +11.4% emotional-intelligence score relative to full raw dialogue history, and persona grounding improved on all four backbones. More important for `avatar-vfo`, the paper reports the tested legacy emotion-state layer had no measurable incremental gain on five endpoints once structured memory was present.

The paper itself carefully warns that engineering plausibility of a state variable does not establish response value.

**Transferable principle:** memory representation and dynamic affect state must be evaluated as separate components with paired ablations.

**Do not overclaim:** this result does not generalize automatically to VFO, its six dimensions, its prompts, users or providers.

### B2 — Memory-Driven Role-Playing, ACL Findings 2026
**Status:** CONFIRMED peer-reviewed proceedings  
**Published:** July 2026  
**Source:** https://aclanthology.org/2026.findings-acl.1175/

MREval decomposes role-play memory use into Anchoring, Selecting, Bounding and Enacting rather than one “sounds like the character” score. MRPrompt explicitly separates structured persona-memory retrieval from response generation.

**Transferable principle:** `avatar-vfo` should diagnose whether a failure came from retrieving the wrong persona knowledge, selecting irrelevant knowledge, violating boundaries or enacting the right knowledge badly.

### B3 — SPASM, ACL Findings 2026
**Status:** CONFIRMED peer-reviewed proceedings  
**Published:** July 2026  
**Source:** https://aclanthology.org/2026.findings-acl.412/

SPASM reports lower persona drift by storing dialogue in a perspective-agnostic representation and deterministically projecting it into each agent’s egocentric view before generation.

**Transferable principle:** for multi-agent simulation, context projection can be a deterministic transformation rather than letting every model infer perspective from one raw transcript.

**Portfolio fit:** useful later for `avatar-vfo` multi-character experiments and `herdr-skills`, but insufficient standalone evidence to open another Issue.

---

## C. Emerging tool / evaluation technology

### C1 — ANCHOR: persona collapse and trajectory recall become separable regression dimensions
**Status:** CONFIRMED recent research  
**Published:** 2026-07-30  
**Source:** https://arxiv.org/abs/2607.28818

ANCHOR evaluates 2,008 conversations across 27 personas and separates `persona collapse` from `behavioral drift` / trajectory recall. The paper reports average trajectory accuracy of 44.4% and finds no tested configuration reliably preserved both dimensions.

**New product possibility:** `avatar-vfo` can turn auto-simulate into a controlled long-horizon regression harness with sealed identity and trajectory probes.

**Do not overclaim:** 44.4% is a benchmark result, not a market-wide user failure rate.

### C2 — CompanionBench: immersion is not relational competence
**Status:** CONFIRMED recent research  
**Published:** 2026-08-03  
**Source:** https://arxiv.org/abs/2608.02046

CompanionBench uses theory-anchored capability rubrics, a deterministic disclosure gate and a cross-family judge panel. Its reported results distinguish surface warmth/role-play immersion from deeper relational capabilities.

**New product possibility:** separate persona fidelity, boundary consistency, trajectory recall, relationship-state handling and judge provenance rather than optimize one entertainment score.

### C3 — Agent evaluation is becoming a first-class operational product
**Status:** CONFIRMED product-direction signal  
**Fresh sources:**
- IBM watsonx Orchestrate, 2026-09-03: https://www.ibm.com/new/announcements/new-in-ibm-watsonx-orchestrate-cross-platform-agent-discovery-custom-evaluation-and-agentops-agent-goes-ga
- UiPath Agents, 2026-09-07: https://docs.uipath.com/agents/automation-cloud/latest/release-notes/september-2026

IBM now pairs cross-platform agent discovery with Trace Inspector and custom LLM-as-a-Judge evaluation. UiPath introduced an LLM-as-Judge guardrail and explicitly exposes its extra unit cost.

**Transferable principle:** evaluation itself is becoming part of the product/control plane, but judge identity/cost/provenance must be visible.

**Portfolio fit:** reinforces `autodev-ng`, `skill-foundry`, `lobsterpulse` and `avatar-vfo`; no new cross-portfolio Issue because those repositories already have evaluation/quality/trust fingerprints.

---

# New Releases / Fresh Changes

1. **2026-09-08 — AsgineAI:** stronger story memory, scene-relevant retrieval, repeated-generation rejection and failed-draft hygiene.
2. **2026-09-07 — UiPath Agents:** LLM-as-Judge guardrail preview with separately metered evaluation cost.
3. **2026-09-03 — IBM watsonx Orchestrate:** cross-platform agent discovery + trace inspection + custom evaluation / AgentOps GA.
4. **2026-09-03 — Character.AI:** current safety update reinforces that open-ended character products increasingly require explicit safety boundaries; not treated as a feature-growth signal.
5. **2026-08-21 — Character.AI Comics:** characters/personas are reused across multimodal artifacts; this is distribution expansion, not a priority for `avatar-vfo` before continuity is proven.
6. **2026-08-13 — Character.AI Lorebook support refresh:** reusable shared canon is now a concrete creator workflow.
7. **2026-08-11 — Kindroid Memory docs:** layered memory contract is explicit and current.
8. **2026-08 — Kindroid V2:** V2 is now the default and V1 retirement is scheduled for 2026-10-01, making continuity across experience/model migration a live product lifecycle concern.
9. **2026-09-09 — Reese-max/avatar-vfo:** Round-3 audit landed; no product code feature expansion, but current product evidence makes long-horizon evaluation research actionable.

---

# Community Pain Points

## Personality changes after model/tier migration
**Classification:** COMMUNITY_SIGNAL  
**Recent example:** 2026-08-18 thread, updated through 2026-09-07  
https://www.reddit.com/r/KindroidAI/comments/1vru307/kindroids_sudden_personality_change/

A user described an existing companion changing personality and relationship behavior after subscription/model-context changes, then manually repairing it through storytelling, persona tuning, rerolls, model switching and subscription restoration.

**Interpretation:** this is anecdotal; it does not establish prevalence or causal attribution. It does clearly expose the workflow cost of continuity regression: users manually reconstruct the state that the product was expected to preserve.

## Long-term memory remains a recurring complaint across companion products
**Classification:** COMMUNITY_SIGNAL  
**Recent example:** 2026-07-28  
https://www.reddit.com/r/ChatbotRefugees/comments/1v8pzym/anyone_else_think_memory_is_the_real_bottleneck/

Users describe personality drift, forgotten prior events and repeatedly re-explaining relationship context.

**Reese-max response:** do not simply increase history length. Measure which facts/events actually need to survive and whether structured retrieval or VFO state contributes.

---

# Adjacent Ideas

1. **Behavior Migration Receipt** — before changing any default model/provider/prompt/memory policy, record the exact evaluated artifact and non-inferiority result. Reusable across LLM products.
2. **Negative Knowledge Probes** — test facts the character must *not* know, so a warm/plausible hallucination cannot score as successful memory.
3. **Human Repair Workload** — measure rerolls, reminders, backstory edits and recovery steps as product friction, not just benchmark accuracy.
4. **Context-source provenance** — annotate reply evidence as persona canon / world lore / episodic event / recent transcript / derived VFO state. Useful for debugging without turning model inner reasoning into ground truth.
5. **State-as-explainability fallback** — if VFO state adds no continuity lift, keep it only if it still improves creator diagnosis/creative control; remove unsupported “memory/psychological realism” claims rather than preserving a feature for prestige.
6. **Cross-family judge panel only when worth the cost** — IBM/UiPath signals make evaluation cost visible. Use deterministic probes first, LLM judges second, human blind review on sampled disagreements.
7. **Perspective projection** — SPASM’s deterministic egocentric projection is a candidate for future multi-avatar simulation, but not before single-avatar continuity has a baseline.

---

# High-Value Opportunity — Persona Continuity Regression Harness

## Job-to-be-Done

A creator/prompt engineer wants to update a VFO prompt, avatar matrix, provider or model and know before release whether:

1. the character still obeys its original values/boundaries/style;
2. relationship events older than the 20-round raw context are still remembered correctly;
3. the model refrains from inventing events that never happened;
4. VFO state and spoken reply remain mutually consistent;
5. the new route/model is non-inferior to the current one;
6. VFO state provides measurable incremental value beyond a structured-memory policy.

## Proposed MVV

### Versioned ScenarioPack
Store avatar/matrix hash, scene, scripted turns, sealed persona facts/boundaries/style invariants, trajectory events, counterfactual probes and expected-negative facts.

### Exact RunFingerprint
`ScenarioPack hash + code SHA + system prompt hash + matrix hash + provider + exact model evidence + context policy + temperature/seed support + timestamp`

### Four metric families
- Persona Enactment
- Trajectory Recall
- Negative Knowledge / Hallucination
- VFO State ↔ Reply Consistency

### Memory × State ablation
- A: current 20-round history + VFO state
- B: same history, VFO dynamic state neutralized
- C: structured memory candidate, VFO state off
- D: structured memory candidate + VFO state on

Only paired, same-provider/model comparisons may support causal statements.

### Migration gate
Return `PASS / REGRESSION / INCONCLUSIVE / UNSUPPORTED`. Unknown runtime model identity, route drift or inadequate evidence cannot be promoted as PASS.

### Human repair workload
Track reminders, rerolls, memory/backstory edits and recovery steps/time.

## Opportunity Score

| Dimension | Score | Reason |
|---|---:|---|
| User Pain | 9/10 | Long-run drift creates repeated manual repair and destroys the “same character” expectation. |
| Strategic Fit | 10/10 | Directly tests the product’s unique visible-state thesis instead of chasing voice/3D/social features. |
| Novelty | 9/10 | 2026 benchmarks make persona-collapse and trajectory-regression auditing newly practical. |
| Evidence Strength | 10/10 | Official competitor memory/migration products + ACL/arXiv methods + recent community failure narrative. |
| Reuse Potential | 9/10 | ScenarioPack/RunFingerprint/migration gate generalize to multiple Reese-max LLM products. |
| Implementation Effort | 7/10 | Existing auto-simulation/providers/tests reduce effort; multi-model repeated runs still cost time/tokens. |
| Security/Privacy/Cost Risk | 8/10 | Synthetic fixtures and bounded evaluation avoid private-chat retention; cost must be metered. |

**Overall: 95/100 — research Issue created as `avatar-vfo #5`.**

---

# Opportunity Map — 35 Unarchived Reese-max Repositories

| Repository | Market category | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| cf-ai-router | AI model routing / gateway | exact provider/model identity, failure semantics | task reliability + cost-aware routing | evidence-backed route profiles | behavioral migration receipts | opaque auto-routing by price alone |
| soundbox-offline | local/offline media utility | fast local import/playback | same-LAN transfer without cloud | offline-first private soundboard | QR/browser direct import (#3) | cloud account requirement |
| police-exam-archive | official exam practice | source/question provenance | truthful Attempt Ledger + mastery | deadline-aware official-question review | export learner evidence later | generic AI question flood |
| skill-foundry | agent-skill build/evaluation | package identity + compatibility + security | promotion evidence across runtimes | quality/runtime/security attestations | migration regression fixtures | marketplace before trust gates |
| lobsterpulse | coding-agent observability | correct agent/session state | needs-attention reliability | local multi-agent Attention Inbox | eval/trace linkage after #3 | more dashboards before signal truth |
| prompt-autoresearch | prompt optimization research | repeatable eval | variance/stability-aware search | promotion only after stable gain | judge provenance/cost ledger | one-run leaderboard optimization |
| tick-stock-panel | trading/stock panel | data freshness + strategy truth | deterministic StrategyDef | explainable strategy compiler | evidence receipt for backtests | LLM directly executing trades |
| clinical-scribe-worker | clinical documentation/simulation | provenance, auth, reviewer identity | specialty omission/misattribution validation | human-confirmed evidence chain | case-specific evaluation packs | autonomous clinical action |
| adng-memory | agent memory | source/provenance + retrieval correctness | memory migration/versioning | reusable memory receipts | persona/trajectory probes from #5 | storing everything forever |
| avatar-vfo | character/persona simulation | long-horizon persona & trajectory truth | reproducible cross-model evaluation | debuggable VFO psychological state | **#5 Memory×State ablation + migration gate** | voice/3D/social marketplace before proof |
| note-filler | evidence-assisted notes | claim/source mapping | explicit review decisions | claim decision ledger | selective memory/context receipts | silent AI autofill as truth |
| taiwan-intel-dashboard | public intelligence dashboard | operating-state/summary truth | source gaps/freshness visible | evidence-first public brief | outbound EvidenceEnvelope after core fixes | distribution expansion before #17/#18 |
| cyber-prep-coach | cyber exam study coach | official spec/question truth | local mastery + today task | evidence-linked adaptive coaching | portable learner-state connector | generic chat tutor before truth |
| UkePack | music/ukulele education | accurate practice content | teacher workflow + practice feedback | lightweight instrument-specific pack | integrated tuner/metronome later | broad DAW/music social suite |
| autodev-ng | autonomous dev orchestration | issue/action identity + locks | steering/queue semantics + receipts | evidence-first autonomous loop | shared behavior migration gates | opaque autonomy without approval |
| ai-novel-workstation | long-form AI writing | story/canon continuity | context provenance + cost envelope | production-loop with evidence | scene-relevant memory selection | generic chat-first writing UI |
| herdr-skills | multi-agent orchestration skills | deterministic role/tool boundaries | repeatable council evaluation | reusable multi-engine workflows | perspective projection experiments | unlimited agent spawning |
| chatgpt-dual-pipeline | dual-model workflow | exact model/turn attribution | handoff/review evidence | two-engine cross-check | migration/non-inferiority gate | “two models = automatically better” |
| video-timeline-pipeline | multimodal video evidence | timestamp/source grounding | local escalation only when needed | evidence-aware visual timeline | adaptive evidence escalation (#10) | ingest-every-frame cloud cost |
| claude-mem | assistant memory | source identity/retention controls | editable/versioned memory | user-controlled persistent context | trajectory/negative-knowledge probes | invisible immutable memory |
| lplrs-judicial-sync | judicial/legal sync | authoritative-source/version truth | update/reconciliation receipts | traceable judicial sync | read-only evidence distribution later | AI legal conclusion as source truth |
| internship-notes-sites-mirror | notes/site mirror | faithful source mirror | update provenance | stable public learning archive | semantic navigation after source truth | feature-heavy CMS rebuild |
| MaterialYouNewTab | browser new-tab workspace | fast/private local-first baseline | optional permission/sync clarity | local canonical personal dashboard | activeTab capture / optional sharing research | account-first cloud lock-in |
| taichung-police-intel | public police/civic intelligence | canonical public evidence + source health | freshness/conflict propagation | evidence-first priority brief | read-only Evidence MCP (#15) | operational/private police tooling |
| ninax-line-hermes | LINE / agent bridge | exact message/actor identity | revision/approval semantics | bounded messaging automation | persona/behavior migration tests | silent external sends |
| voice-actress | learning/assessment workflow | criterion-to-evidence truth | reviewer/law source trace | evidence-grounded feedback | behavior rubric replay | model opinion as grading authority |
| project-doctor-web | virtual patient / medical education | authoritative CaseSpec truth | competency evidence/debrief | fact-bounded simulation | replayable case competency pack (#11) | free-form model-generated clinical truth |
| 92-duty-scheduler | duty scheduling | identity/auth + hard constraints | PolicySpec preview/conflict checks | deterministic explainable scheduling | rule migration/impact receipts (#20) | LLM choosing duty assignments directly |
| flux-image-gen | image generation | artifact/model provenance | prompt/input/output receipt | C2PA/provenance preservation | template/migration comparison | unverifiable “same model” claims |
| neciken-summer-poem | literary contest workflow | current official contest rules | rule drift detection | submission-readiness receipt | source lifecycle primitive (#3) | discovery volume without eligibility truth |
| minideck | lightweight presentation | published-head correctness | source/template consistency | minimal deterministic deck pipeline | editable source artifact receipt | AI design bloat before correctness |
| ppt-studio | evidence-rich presentation | claim/source provenance | template fidelity | slide/claim evidence graph | artifact migration evaluation | attractive uncited slides |
| police-exam-practice | exam compatibility/deeplink | truthful navigation | accessible fallback | thin compatibility surface | safe telemetry | duplicate quiz engine |
| exam-archive | exam evidence archive | official source identity | freshness/correction trail | canonical archive | AI-ready evidence envelope later | hallucinated source filling |
| cf-mcp-server | Cloudflare MCP/deployment control | exact target/version confirmation | staged promotion + runtime evidence | safe Worker operations via MCP | new Workers bundle-limit awareness | unconstrained deployment autonomy |

---

# Top 10 Cross-Portfolio Ideas

1. **Behavior Migration Gate** — model/provider/prompt/memory changes require exact fingerprint + non-inferiority replay before becoming default.
2. **Negative-Knowledge Fixtures** — explicitly test what a model/agent must *not* know or claim.
3. **Evidence-separated evaluation** — deterministic checks, LLM judges and human review remain separate evidence types.
4. **Judge Receipt** — record judge model/version/prompt/order/repeats/cost; judge drift invalidates old comparability.
5. **Repair-Workload Metric** — count rerolls, manual reminders, re-entry, corrections and recovery time as product friction.
6. **Context-source provenance** — tell whether an output relied on canonical facts, episodic memory, recent context, derived state or model inference.
7. **State feature falsification** — if a derived dashboard/state does not improve the job, keep it only for explainability/creative control or simplify it.
8. **Versioned ScenarioPack / CasePack / PolicyPack** — one reusable artifact pattern for avatar, medical simulation, scheduling and agent evaluations.
9. **INCONCLUSIVE as first-class status** — unknown model route, judge disagreement, stale evidence or inadequate sample must not be coerced into PASS.
10. **Evaluation cost budget** — the quality gate itself consumes model calls; track it explicitly just like production cost.

---

# Ideas Rejected / Deferred

## 1. Add 3D/voice/avatar embodiment to avatar-vfo
**Decision:** REJECT NOW.  
Character platforms compete heavily on embodiment, but current Reese-max differentiation is inspectable simulation. Voice/3D would add cost and runtime surface without answering whether VFO behavior is stable.

## 2. Add a Character marketplace / social feed
**Decision:** REJECT NOW.  
Character.AI’s growth stack is real but brings moderation, discovery, privacy and creator-marketplace problems. There is no evidence that distribution is `avatar-vfo`’s current bottleneck.

## 3. Immediately replace VFO with ZifaMem or another memory framework
**Decision:** REJECT.  
The ZifaMem result is a falsification signal, not a universal architecture verdict. #5 requires paired product-specific ablation before removing or promoting VFO claims.

## 4. Simply increase MAX_HISTORY_ROUNDS from 20 to a much larger number
**Decision:** REJECT AS FIRST MOVE.  
This increases cost/context competition and still does not prove correct selection, trajectory recall or persona stability. Baseline it inside the evaluation harness if useful.

## 5. Create a new ai-novel-workstation memory Issue from AsgineAI
**Decision:** DUPLICATE / DEFER.  
Scene-relevant continuity strongly supports the existing context/provenance direction, especially `ai-novel-workstation #2`; no new fingerprint.

## 6. Add LLM-as-Judge to every Reese-max product because IBM/UiPath now surface it
**Decision:** REJECT AS BLANKET FEATURE.  
Judge calls cost money and can add family/order/scale bias. Use only where deterministic evidence is insufficient and preserve judge provenance.

## 7. Expand `lobsterpulse` into AgentOps/custom evaluation immediately
**Decision:** DEFER.  
The Attention Inbox / cross-agent signal remains promising, but current Codex monitoring activation correctness (#3) must be trustworthy before higher-level evaluation is layered on top.

## 8. Copy Character.AI Comics / video distribution into avatar-vfo
**Decision:** REJECT.  
Multimodal content generation is adjacent entertainment distribution, not evidence of long-horizon persona quality.

---

# Issue Mapping / Duplicate & Lock Coordination

| Repository | Candidate | Existing fingerprint / check | Decision |
|---|---|---|---|
| avatar-vfo | Persona Continuity Regression Harness | searched open/closed issues for memory/persona/continuity; searched PRs for memory; none matched | **Created #5** |
| avatar-vfo | active P0 Access JWT remediation | #2 has active `github-issue-lock:v1` lease held by another worker | **Do not touch / do not claim lock** |
| avatar-vfo | deployment/runtime release proof | #3 already owns deployment evidence | No duplicate |
| ai-novel-workstation | scene-relevant memory continuity | #2 context manifest/provenance already owns the central context problem | Research note only |
| skill-foundry | evaluation/attestation expansion | #1 runtime compatibility and #3 package security attestation already own promotion trust | No duplicate |
| lobsterpulse | agent evaluation/Attention Inbox | #3 signal correctness blocker remains | Deferred |
| autodev-ng | agent steering/evaluation control plane | #11 owns STEER vs QUEUE; existing quality gates own implementation path | No duplicate |
| cf-mcp-server | new Cloudflare Worker size limits | #8 gradual deployment + existing deployment safety work more important; size increase is not a user pain by itself | No Issue |
| MaterialYouNewTab | local-first + optional sync | existing prior research signal; no new evidence strong enough to exceed current priorities | No Issue |
| clinical-scribe-worker | evaluator/reviewer improvements | #4 specialty validation + existing reviewer/auth findings already own trust gap | No duplicate |

---

# Sources

## Direct products / official docs
- Character.AI Lorebook, 2026-07-24: https://blog.character.ai/lorebook/
- Character.AI Lorebooks help, updated 2026-08-13: https://support.character.ai/hc/en-us/articles/52739596326811-Lorebooks
- Character.AI Memory, 2026-05-21: https://blog.character.ai/memory/
- Character.AI Comics help, updated 2026-08-21: https://support.character.ai/hc/en-us/articles/54400390862875-Creating-Comics
- Character.AI Safety update, 2026-09-03: https://blog.character.ai/continuing-to-build-upon-our-safety-priorities/
- Kindroid Memory, updated 2026-08-11: https://kindroid.ai/v2/docs/memory/
- Kindroid Update Log, rechecked 2026-09-09: https://kindroid.ai/v2/docs/update-log/
- AsgineAI changelog, 2026-09-08: https://www.asgineai.com/changelog
- IBM watsonx Orchestrate, 2026-09-03: https://www.ibm.com/new/announcements/new-in-ibm-watsonx-orchestrate-cross-platform-agent-discovery-custom-evaluation-and-agentops-agent-goes-ga
- UiPath Agents release notes, 2026-09-07: https://docs.uipath.com/agents/automation-cloud/latest/release-notes/september-2026
- Cloudflare Workers changelog, 2026-09-04: https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/

## Research / adjacent evidence
- ZifaMem, 2026-07-20: https://arxiv.org/abs/2607.17564
- Best Friends, Not Forever / ANCHOR, 2026-07-30: https://arxiv.org/abs/2607.28818
- CompanionBench, 2026-08-03: https://arxiv.org/abs/2608.02046
- Memory-Driven Role-Playing, ACL Findings 2026: https://aclanthology.org/2026.findings-acl.1175/
- SPASM, ACL Findings 2026: https://aclanthology.org/2026.findings-acl.412/
- TiMem, ACL Findings 2026: https://aclanthology.org/2026.findings-acl.1091/

## Community signals
- Kindroid personality change after model/tier experience change, 2026-08-18 → updated 2026-09-07: https://www.reddit.com/r/KindroidAI/comments/1vru307/kindroids_sudden_personality_change/
- Companion memory bottleneck discussion, 2026-07-28: https://www.reddit.com/r/ChatbotRefugees/comments/1v8pzym/anyone_else_think_memory_is_the_real_bottleneck/

---

# What Changed Since Last Radar (r5)

1. **Primary opportunity moved from distribution to behavioral evidence.** r5 created a read-only Evidence MCP for `taichung-police-intel`; r6 found no reason to duplicate that distribution pattern elsewhere.
2. **`avatar-vfo` became the strongest new research target.** Its latest audit explicitly prioritizes reproducible simulation evaluation, while fresh external companion-memory research now provides a concrete falsification protocol.
3. **The market signal is no longer merely “long-term memory matters.”** Character.AI and Kindroid show structured, user-visible memory/canon systems; Kindroid’s V2 lifecycle also makes model/context migration continuity a concrete product problem.
4. **The biggest new falsification signal is ZifaMem:** under its protocol, structured memory added value while an extra emotion state machine did not add measurable value once memory was present. That is directly relevant to VFO’s current product thesis and justifies an explicit ablation rather than another feature-add quota.
5. **New Issue created:** `Reese-max/avatar-vfo #5` with a stable fingerprint, MVV, acceptance criteria, success metrics, risks, dependencies and runtime verification requirements.
6. **No lock conflict:** `avatar-vfo #2` remains actively claimed by another worker; r6 records the coordination state but does not touch it.
7. **Portfolio primitive added:** `Behavior Contract → Sealed Probes → Exact Runtime Fingerprint → Paired Replay → Non-inferiority Gate → Promotion Receipt`.

## Round decision

**NOTIFY.** A high-value new opportunity exists and one recent research result materially challenges an unvalidated part of an existing product direction. The action is not to remove VFO now; it is to make the VFO claim falsifiable before expanding the product around it.
