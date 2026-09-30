# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-12 r5

> Scope: `Reese-max` owner repositories that are **not archived** and can reasonably be treated as products.  
> Evidence discipline: external public-web evidence is the primary research source; GitHub repository/Issue/PR evidence is used to map applicability, avoid duplicates, and preserve coordination.  
> Confidence labels: **CONFIRMED** = directly supported by first-party docs/release notes or repository evidence; **LIKELY** = reasonable inference but not independently verified; **COMMUNITY_SIGNAL** = anecdotal practitioner evidence only; **UNKNOWN** = insufficient evidence.  
> Marketing claims are treated as product/positioning signals, not efficacy proof.

## Executive Summary

This round refreshed the same **37 non-archived product-like repositories**. Since the prior r4 radar, the only materially new repository-side product-board evidence was `minideck`'s 2026-09-12 audit. It re-confirmed that anonymous `/p/:id` follows `current_version`, so draft saves can change already-shared content; existing Issue #4 remains the correct P1 publication-boundary work. The current open PR #1 separately introduces an MCP v2 / runner surface, but does not replace the draft/public lifecycle requirement.

External research found useful signals in three required classes:

1. **A — Direct competitor:** Pitch's 2026-08-12 MCP + API turns call notes / CRM records into decks and lets Claude/Agent edit the current slide; API-driven recurring and event-triggered deck creation is now an explicit presentation workflow. This strongly validates `minideck` / `ppt-studio` agent-addressable presentation surfaces, but it also increases the importance of an explicit publication boundary. It does **not** justify deploying more automation before `minideck #4` is closed with runtime evidence.
2. **B — Adjacent workflow:** Adobe Premiere's 2026-09-09 Generative Media tools create video / sound directly in the timeline so the editor does not leave the point of use to search/generate/import. The transferable principle is **in-context derived artifact creation**: create the next artifact where it will be consumed, while preserving editability and source context. `video-timeline-pipeline #11` already captures the relevant evidence→rough-cut handoff, so no duplicate Issue is needed.
3. **C — Emerging product/technology:** Braintrust's 2026-09-09 eval workflow explicitly converts named production failure clusters into labeled datasets and targeted regression evals; its MCP lets coding agents query traces, create evaluators, build datasets and run evals without manual context transfer. Product Hunt also shows a fresh cluster of agent-observability products such as Agnost AI, Progress AI Observability, OpenObserve AI Observability, Latitude and Raindrop. The durable opportunity is **Observed Failure → Labeled Repro Slice → Eval → Fix Experiment → Promotion Receipt**, not “add another dashboard.” For Reese-max this remains research-list material because `prompt-autoresearch` currently has a red CI/evidence contract (#4) and unresolved variance-aware promotion (#3); importing more feedback before the promotion gate is trustworthy would increase noise rather than quality.

A fourth cross-check, Letta Agents SDK (2026-08-17), reinforces the already-open Reese-max architecture that **agent identity/memory should not be tied to a model or machine**. That evidence maps directly to `autodev-ng #17`, `autodev-ng #21`, and `adng-memory #4`; it is not a new fingerprint.

**Disposition:** no new Issue and no existing Issue update this round. No candidate crossed the “high-value + non-duplicate + not already actively tracked” gate. The best signals either validate active Issues/PRs or are blocked by more urgent reliability/security work. Therefore this is a **research/report-only round**, not a notification-worthy round.

---

# Portfolio Discovery / Product → Market Category

| Product | Market / JTBD | Recent repository truth relevant to this round |
|---|---|---|
| `cf-ai-router` | AI gateway / free-quota routing / provider reliability | #1 already researches deterministic task-specific provider reliability profiles; do not create a second adaptive-router layer. |
| `soundbox-offline` | local/offline music player | Reliability/recovery remains ahead of network-library expansion. |
| `police-exam-archive` | Taiwan police exam archive/search | Provenance, completeness and source traceability remain core. |
| `skill-foundry` | Skill creation/evaluation/certification | Distribution/install receipt work already tracked; do not expand into marketplace breadth first. |
| `lobsterpulse` | multi-agent/provider operations monitoring | #9 already defines decision-only attention queue; observability products reinforce issue→action reduction, not more raw alerts. |
| `prompt-autoresearch` | local prompt research/evaluation for Taiwan national-exam essays | Latest audit: 9-cell CI/evidence gate red (#4); #3 variance-aware promotion remains incomplete. |
| `tick-stock-panel` | market/portfolio panel | Coverage/freshness/partial-data truth remains more important than enterprise-finance breadth. |
| `clinical-scribe-worker` | clinical drafting / SOAP / validation | #7 already covers section-scoped repair/version receipts; #6 auth signature verification remains a hard production blocker. |
| `avatar-vfo` | avatar / visual-output workflow | Preserve controllable, exportable asset workflow before adding more generation breadth. |
| `adng-memory` | cross-repo operational memory/state | #4 already covers activation/staleness/deletion/provenance lifecycle. |
| `ai-flight-radar` | flight watch / fare intelligence | Existing roadmap already covers source health, quote truth, total-trip cost and reconfirmation; avoid auto-booking breadth. |
| `taiwan-intel-dashboard` | Taiwan intelligence dashboard | Evidence/source-health and typed handoff remain differentiators. |
| `note-filler` | document/note automation | Reliability and explicit source/field mapping before new autonomous breadth. |
| `cyber-prep-coach` | cybersecurity exam prep | Dataset/exam-version truth and mastery migration remain higher priority than generic tutor expansion. |
| `UkePack` | music/ukulele creative tooling | Reversible candidate→canonical artifact flow remains the reusable pattern. |
| `autodev-ng` | multi-engine autonomous development control plane | #12 effect firewall, #17 principal/credential lease, #21 environment handoff already cover the strongest current agent-control-plane signals; Windows regression issues still gate breadth. |
| `ai-novel-workstation` | long-form creative writing workstation | Versioned candidate/revision/handoff more valuable than more model buttons. |
| `herdr-skills` | agent skill orchestration/reuse | Candidate-skill/eval/distribution lifecycle already active; no generic marketplace clone. |
| `video-timeline-pipeline` | video intelligence / transcript/timeline/evidence | #11 already owns evidence-backed rough-cut/NLE handoff; Adobe's latest in-timeline workflow reinforces it. |
| `chatgpt-dual-pipeline` | dual-model/reviewer workflow | Independent evidence/review separation more important than vendor-specific UI. |
| `claude-mem` | coding-agent memory | Memory provenance/staleness lifecycle remains central; Letta is validation, not a new direction. |
| `lplrs-judicial-sync` | judicial-data sync | #5 target-date coverage/no-success receipt remains urgent because missed fixed-day coverage may be irrecoverable. |
| `internship-notes-sites-mirror` | internship notes publishing | Publishing provenance / stable output, not SaaS collaboration breadth. |
| `MaterialYouNewTab` | new-tab productivity/workspace | Session-capsule idea remains research-only; keep optional-permission/local-first posture. |
| `taichung-police-intel` | municipal/police intelligence monitoring | Evidence contract / transport-neutral distribution already tracked; do not add generic agent platform breadth. |
| `ninax-line-hermes` | LINE/agent workflow integration | Exact identity/effect permission and safe handoff remain key. |
| `92-duty-scheduler` | duty scheduling/coordination | Constraint truth, change receipts and explicit human approval matter more than generic chat UI. |
| `voice-actress` | legal/knowledge answer workflow | Citation existence ≠ claim support remains key; existing verification work covers it. |
| `project-doctor-web` | project diagnosis / quality review | Failure→repro→verification flow, not more dashboards. |
| `flux-image-gen` | image generation/edit workflow | #22 already covers edit sessions/reference tray; spatial edits remain research list. |
| `neciken-summer-poem` | creative literary experience | Keep narrow product identity; avoid generic AI-writing breadth. |
| `minideck` | lightweight AI deck creation/share/export | Latest audit re-confirms #4 draft/public head P1; PR #1 MCP v2 is separate automation surface. |
| `police-exam-practice` | police-exam practice | Question/source correctness and progress continuity before more modes. |
| `ppt-studio` | presentation generation/studio | Auth/CI trust gate remains higher priority than remote-agent/distribution breadth. |
| `exam-archive` | exam archive | Completeness/source lineage/search reliability. |
| `academic-mcp` | academic research aggregation/MCP | Canonical paper identity/research bundle work already tracks multi-source reconciliation. |
| `cf-mcp-server` | MCP/Cloudflare integration | Consent/auth/effect boundaries first; no generic integration sprawl. |

---

# External Signals

## A. Direct Competitor — Pitch MCP + API makes the deck an agent-addressable workflow object

**CONFIRMED — Pitch — 2026-08-12**  
Release: https://pitch.com/whats-new/introducing-pitch-mcp-and-api  
API help: https://help.pitch.com/en/articles/15926009-use-pitch-s-api  
Pricing: https://pitch.com/pricing

Pitch's release notes state that Claude can turn call notes or CRM records into Pitch decks, workflows can trigger deck delivery, and Agent can edit the slide currently in view. The API help page positions recurring decks and CRM/form-triggered deck generation as automation use cases. API access is a premium/select-plan feature, while Pitch remains freemium and meters AI actions with credits.

### 1. Job-to-be-Done
Turn structured business context into a presentation **without** manually moving content through `notes → chatbot → copy/paste → deck editor → delivery`.

### 2. Why users perceive it as faster / fewer steps
The deck is no longer merely an export target. It becomes an addressable object inside the existing CRM/Claude/workflow surface. The user can stay in the initiating workflow and ask for a deck/edit/delivery action instead of re-onboarding a presentation tool.

### 3. Onboarding / distribution signal
Pitch is distributing presentation capability through MCP/API **into the tools users already use**, rather than forcing every automation through a dedicated presentation UI.

### 4. Capability pattern
`External Context → Typed Presentation Action → Editable Deck Object → Human Review → Delivery`.

### 5. Pricing / business-model signal
Automation/API and higher-volume presentation workflows are monetizable premium workflow capabilities; AI actions are credit-metered. The design lesson is to expose cost/authority explicitly, not to copy the plan structure.

### 6. Limits / failure points
First-party pages prove product availability/use cases, not deck quality, correctness, or delivery reliability. A workflow that edits/deploys decks through an Agent also increases the danger of silently changing already-shared content.

### 7. Reese-max fit / do not copy
- **Absorb:** agent/API actions should operate on explicit candidate/draft revisions and retain receipts.
- **Do not copy:** do not let MCP/API mutation implicitly republish a public deck.
- `minideck` already has PR #1 for MCP v2/runner and #4 for publication lifecycle. The new external signal supports **sequencing**, not a new Issue: `draft automation → preview/review → explicit publish`.

**Opportunity Score: 88/100**  
User Pain 9 / Strategic Fit 9 / Novelty 7 / Evidence 10 / Reuse 8 / Effort controllability 8 / Risk controllability 8.  
**Disposition: EXISTING WORK / no new Issue.**

---

## B. Adjacent Workflow — Adobe generates the next media artifact at the point of use

**CONFIRMED — Adobe Premiere / After Effects — 2026-09-09**  
Source: https://blog.adobe.com/jp/publish/2026/09/09/cc-generate-create-directly-in-your-timeline-with-new-ai-powered-innovations-in-premiere-after-effects  
Release notes: https://helpx.adobe.com/premiere/desktop/whats-new/release-notes.html

Adobe explicitly frames the problem as leaving the editing timeline to search websites/libraries for B-roll or sound, losing creative flow. New Generative Media tools create video/sound directly in the timeline, keeping the editor at the consumption point.

### 1. Job-to-be-Done
Fill a missing artifact in an existing production sequence without leaving the canonical workspace.

### 2. Why it saves steps
It removes `identify gap → leave tool → search/generate → download → import → relink → continue` and collapses it toward `identify gap → generate candidate in context → review → continue`.

### 3. Onboarding/distribution
Capability arrives inside an already-adopted professional editor. The user does not have to learn a parallel “AI media app” for the common case.

### 4. Transferable capability pattern
`Canonical Work Context → Gap/Intent → Candidate Derived Asset → In-context Preview → Promote/Replace → Provenance`.

### 5. Business-model signal
AI becomes valuable when attached to an existing paid production surface and removes tool switching; model breadth alone is not the product.

### 6. Limits
Generated media still requires creative review. Adobe's claims about creator adoption/speed are vendor-supplied and are not used here as expected Reese-max performance.

### 7. Reese-max fit / do not copy
- `video-timeline-pipeline #11` already defines `Canonical Evidence → CandidateCutList → Preview → CutSpec → NLE export → CutReceipt` and is the right product-shaped transfer.
- `flux-image-gen #22` similarly turns prior artwork/reference state into the next candidate edit.
- **Do not copy:** do not turn `video-timeline-pipeline` into a full renderer/NLE; its differentiation is evidence-backed handoff.

**Opportunity Score: 87/100.**  
**Disposition: EXISTING ISSUE #11 / adjacent validation only.**

---

## C. Emerging Workflow — production failure clusters become labeled evals and fix experiments

### C1. Braintrust diagnose→dataset→eval loop

**CONFIRMED — Braintrust — 2026-09-09 / current MCP docs**  
Workshop: https://manifesto.preview.braintrust.dev/workshops/2026-09-09-evals-foundations  
MCP: https://www.braintrust.dev/blog/braintrust-mcp  
Pricing: https://www.braintrust.dev/pricing

Braintrust's 2026-09-09 eval workshop explicitly describes:
- grouping production traces into named failure patterns;
- filtering a failure cluster into a labeled dataset;
- writing a targeted eval for that pattern;
- validating the fix with a repeatable diagnose-to-eval workflow.

Its MCP lets coding agents access production traces, experiments, datasets, prompts and scorers, create/test evaluators, build datasets and run evals without manually transferring context between tools.

### C2. Market corroboration from new observability products

**LIKELY / PRODUCT-LISTING SIGNAL — Product Hunt, Aug–Sep 2026**
- Agnost AI: https://www.producthunt.com/products/agnost-ai — groups production conversations into recurring failures/drift/frustration and positions those patterns as inputs to evals/fixes.
- Progress AI Observability: https://www.producthunt.com/products/progress-ai-observability — launched Aug 2026 around tracing/evaluating production agent failures.
- OpenObserve AI Observability: https://www.producthunt.com/products/openobserve — Sep 10 launch for OpenTelemetry-native agent/LLM observability.
- Latitude: https://www.producthunt.com/products/latitude-4 — failure modes with states/evals attached.
- Raindrop: https://www.producthunt.com/products/raindrop — monitoring plus proposed/validated fixes.

Product Hunt descriptions are product-positioning evidence, not independent proof that these systems find all failures or improve quality.

### 1. Job-to-be-Done
Stop maintaining a static eval set that only covers failures someone already anticipated. Turn recurrent real failures into reproducible regression evidence.

### 2. Why it saves time / improves reliability
It removes repeated `notice failure → manually search logs → copy examples → invent fixture → write eval → compare change` work and creates a traceable path from observation to regression.

### 3. Onboarding/distribution
MCP and OpenTelemetry are increasingly used as **distribution surfaces**: the coding agent/eval workflow comes to existing traces rather than requiring manual export/import.

### 4. Capability pattern
`Observed Failure Pattern → Candidate Cluster → Human/Deterministic Label → Frozen Repro Slice → Targeted Eval → Fix Experiment → Promotion/Reject Receipt`.

### 5. Pricing signal
Braintrust's Starter tier includes traces/evals with limited processed data, scores and retention; Pro monetizes higher-volume retention/RBAC. The product signal is that retention/score volume is an explicit cost dimension. Reese-max local-first tools should keep dataset/evidence volume bounded rather than silently retaining every trace.

### 6. Failure/limit signal
Production traffic is not automatically a gold dataset. User data can contain privacy-sensitive material, correlated duplicates, prompt-injection content, and unverified “bad” labels. Clustering is candidate discovery, not ground truth.

### 7. Reese-max fit / do not copy
Best fit is a future shared contract for `prompt-autoresearch`, `skill-foundry`, `cf-ai-router`, `project-doctor-web`, `lobsterpulse` and `autodev-ng`:

`Observation → FailureFingerprint → CandidateFixture → Approval/Gold Label → Regression Pack → Experiment Receipt`

However, **do not build this yet as a central platform**. `prompt-autoresearch` currently has:
- P1 #4: CI/evidence contract red across all declared matrix cells;
- #3: variance-aware promotion unresolved.

A failure-cluster importer before these are trustworthy would generate more tests without establishing reliable promotion semantics.

**Opportunity Score: 89/100.**  
**Disposition: RESEARCH LIST / blocked by evidence-gate reliability; no Issue.**

---

## D. Cross-portfolio validation — Letta separates persistent agent identity/state from model and machine

**CONFIRMED — Letta Agents SDK — 2026-08-17**  
https://www.letta.com/blog/introducing-the-letta-agent-sdk/  
https://www.letta.com/agent-sdk/

Letta's SDK presents a stateful agent whose identity, experience and memory persist across models/machines/interfaces; an agent can resume from different processes/backends and move between local/cloud execution. This is a strong architecture signal, but not a new Reese-max opportunity fingerprint.

It maps cleanly to existing work:
- `autodev-ng #17`: Owner ≠ Principal ≠ Engine/Model ≠ Credential.
- `autodev-ng #21`: Agent/Task ≠ Execution Environment; handoff requires read-back verification.
- `adng-memory #4`: persistent state requires activation/staleness/supersession/deletion semantics.

**Do not copy:** persistence itself does not prove stale memory correctness, credential isolation, or cross-machine environment equivalence.

**Opportunity Score: 90/100 as market validation; 0 new-Issue value because the fingerprint is already covered.**

---

# New Releases / Market Movement

| Date | Product | Signal | Classification | Reese-max implication |
|---|---|---|---|---|
| 2026-09-09 | Adobe Premiere / After Effects | Generate media/sound directly in timeline | CONFIRMED | Favor in-context candidate artifacts and handoff, not app-switching. |
| 2026-09-09 | Braintrust | Failure clusters → labeled dataset → targeted eval | CONFIRMED | Strong pattern for future evidence-driven regression intake. |
| 2026-09-10 | OpenObserve AI Observability | OpenTelemetry-native agent/LLM observability Product Hunt launch | LIKELY/product signal | Open standards matter; no reason to build another dashboard. |
| ~late Aug 2026 | Agnost AI | Production conversations → recurring patterns → eval/fix | LIKELY/product signal | Corroborates failure-fingerprint→repro workflow. |
| 2026-08-17 | Letta Agents SDK | Persistent state/identity across machines/models | CONFIRMED | Validates #17/#21/adng-memory #4 architecture. |
| 2026-08-12 | Pitch | MCP + API + in-slide Agent editing | CONFIRMED | Agent-accessible deck object is becoming a direct competitor baseline; publication trust must remain explicit. |

---

# Community Pain Points

These are **COMMUNITY_SIGNAL only**, not representative surveys.

1. **AI presentation export/editability remains a practical pain point.** A 2026-08 Reddit post describes generic layouts and difficulty editing generated presentations; another 2026-07 PowerPoint discussion highlights PPTX export/layout breakage and the need for manual cleanup. This reinforces that “generated” is not equivalent to “handoff-ready/editable.”  
   - https://www.reddit.com/r/aiToolForBusiness/comments/1vf3g3t/finally_found_an_ai_presentation_maker_that/  
   - https://www.reddit.com/r/powerpoint/comments/1v51dlm/if_your_ai_presentation_tool_keeps_making_decks/
2. **Prompt/eval changes are still frequently eyeballed instead of regression-tested.** A 2026-09-01 practitioner thread argues for versioned prompts, fixed regression inputs and statistically aware comparisons. It is anecdotal, but aligns with `prompt-autoresearch #3/#4` rather than justifying a new feature.  
   - https://www.reddit.com/r/LLMDevs/comments/1w43rhc/most_people_evaluating_llm_changes_are_just/
3. **Paper Edit demand reflects transcript→rough-cut friction.** A June 2026 Premiere beta thread describes highlighting transcript sections, previewing them and then creating a sequence. This is anecdotal user feedback around the same workflow Adobe later shipped.  
   - https://www.reddit.com/r/premiere/comments/1u7ga43/now_in_beta_paper_edit_to_text_based_editing/

---

# Adjacent Ideas

1. **FailureFingerprint as a reusable typed object** — not raw log aggregation. A fingerprint can point to representative evidence, affected product/version, severity, recurrence window and a candidate regression fixture.
2. **In-context artifact generation** — when a user is already reviewing a canonical artifact, produce the next candidate at that point instead of requiring download/re-upload/copy-paste.
3. **Agent-accessible canonical objects, not second-class AI copies** — MCP/API should operate on the same versioned deck/note/evidence objects the human UI uses.
4. **Retention is part of the product contract** — traces/evals/memory create storage/privacy/cost obligations; “save everything for AI” is not a neutral default.
5. **Failure discovery ≠ gold-label creation** — automatic clustering should produce candidates; promotion to regression evidence requires deterministic or authorized human labeling.

---

# Opportunity Scores

| Candidate | Pain | Fit | Novelty | Evidence | Reuse | Effort ctrl. | Risk ctrl. | Score | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Failure cluster → labeled regression fixture | 9 | 9 | 8 | 10 | 10 | 8 | 8 | **89** | Research list; reliability blockers first |
| Pitch-style agent/API deck workflow with explicit publish boundary | 9 | 9 | 7 | 10 | 8 | 8 | 8 | **88** | Existing PR #1 + Issue #4; no duplicate |
| In-context derived artifact at point of use | 9 | 9 | 8 | 10 | 9 | 8 | 8 | **87** | Existing VTP #11 / flux #22 |
| Persistent agent identity/state across models/machines | 9 | 10 | 8 | 10 | 10 | 7 | 7 | **90** | Already #17/#21/adng-memory #4 |
| Generic hosted observability dashboard | 5 | 4 | 3 | 8 | 4 | 5 | 5 | **55** | Reject |

Scoring is portfolio prioritization, not a scientific measurement.

---

# Opportunity Map — 37 Products

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| cf-ai-router | truthful provider/capability health | deterministic task-profile shadow ordering | zero-surprise cost gates | failure fingerprint from real route validation | black-box LLM router overriding cost/security |
| soundbox-offline | reliable local playback/recovery | explicit offline/library truth | privacy/local-first | future network-library source receipt | subscription/cloud-library bloat before recovery gate |
| police-exam-archive | complete traceable sources | mobile-first question/image access | Taiwan police-exam provenance | failure-to-answer gap list | generic study-social features |
| skill-foundry | reproducible eval/certification | installed-state/read-back receipts | evidence-first skill lifecycle | failure cluster → candidate training/eval case | marketplace breadth before trust |
| lobsterpulse | actionable status truth | decision-only correlated attention | narrow operator attention surface | repeated failure fingerprint → candidate regression | AI summary on every event |
| prompt-autoresearch | green canonical evidence/CI | variance-aware promotion + INCONCLUSIVE | Taiwan legal-exam corpus/risk gates | labeled failure slice intake later | hosted generic eval/observability SaaS |
| tick-stock-panel | freshness/coverage/partial truth | governed data-source receipts | narrow transparent finance panel | source entitlement/provenance | enterprise-finance assistant breadth |
| clinical-scribe-worker | cryptographic auth + source fidelity | section repair/revision evidence | deterministic clinical validation boundaries | failure cluster per specialty after #6/#4 | autonomous care/action expansion |
| avatar-vfo | editable/exportable asset | candidate compare/rollback | controlled creative output | in-context derived asset | model-count competition |
| adng-memory | staleness/supersession/deletion truth | exact active-head read contract | operational provenance | portable state across execution environment | vector DB / knowledge graph for its own sake |
| ai-flight-radar | current quote/source health | total-trip + reconfirmation | evidence-backed watch | booked-itinerary reprice research | automatic purchase/rebooking without fare-rule proof |
| taiwan-intel-dashboard | source/date/evidence truth | cross-source typed evidence bundle | Taiwan public-data synthesis | agent transport of same canonical contract | generic news chatbot |
| note-filler | field/source correctness | preview before mutation | deterministic form mapping | in-context candidate field patch | autonomous document mutation without receipt |
| cyber-prep-coach | official blueprint/dataset truth | versioned mastery migration | focused certification prep | failure slice → targeted drill | more homepage modes |
| UkePack | reversible creative revision | direct next-step handoff | instrument-specific workflow | in-context accompaniment candidate | generic music generator |
| autodev-ng | runtime-enforced identity/effect/environment truth | evidence-driven failure→fixture loop after CI recovery | provider-neutral local control plane | portable persistent actor state | enterprise control-plane UI breadth |
| ai-novel-workstation | version/revision lineage | branch/compare/handoff | long-form continuity | failure/consistency fingerprint | generic chat-first writing shell |
| herdr-skills | versioned skill/eval identity | install/read-back receipt | multi-agent skill reuse | trace→candidate-skill/eval loop | uncontrolled self-install/self-promotion |
| video-timeline-pipeline | exact source/time provenance | evidence→CutSpec/NLE handoff | intelligence before editing | in-context generated supporting asset later | full NLE/rendering suite |
| chatgpt-dual-pipeline | reviewer independence | explicit evidence/decision receipt | dual-engine cross-check | failure pattern → fixed cross-review fixture | opaque majority voting |
| claude-mem | provenance/staleness/deletion | portable but inspectable memory head | coding-memory focus | model/machine-independent memory contract | persistence without expiry/supersession |
| lplrs-judicial-sync | target-date coverage truth | no-success alarm/backfill receipt | official judicial-source tracking | coverage failure fingerprint | scheduler migration without root cause |
| internship-notes-sites-mirror | stable source/publish linkage | explicit revision/publish state | internship-domain content | generated diagram as versioned artifact | broad CMS features |
| MaterialYouNewTab | local-first optional permissions | unified find-anything / session capsule | Material You personal workspace | in-context workspace restore candidate | invasive history/all-URLs permissions by default |
| taichung-police-intel | evidence/source health | transport-neutral evidence contract | municipal/police intelligence focus | failure cluster for source adapters | broad generic intelligence SaaS |
| ninax-line-hermes | exact identity/permission | action receipt + bounded handoff | LINE-specific controlled automation | attention queue for consequential actions | auto-send breadth |
| 92-duty-scheduler | constraint/schedule truth | change preview + receipt | duty-domain constraints | decision-only conflict queue | chat-generated schedule without solver verification |
| voice-actress | authority existence/support truth | exact quote/support mapping | legal evidence discipline | contradiction/failure fixture | citation checker that treats URL existence as correctness |
| project-doctor-web | reproducible diagnostic finding | issue/failure fingerprint→verification | actionable project repair | observed failure → regression candidate | dashboard-only observability |
| flux-image-gen | versioned edit lineage | reference/edit-session continuity | inspectable creative workflow | spatial-intent candidate with drift check | “edit succeeded” = preserved image |
| neciken-summer-poem | stable creative experience | export/share simplicity | distinctive literary product | candidate variations | general-purpose writing suite |
| minideck | explicit draft/published head | one trustworthy public-head lifecycle | lightweight self-contained HTML deck | MCP/API operating on drafts + explicit publish | Agent mutation auto-publishing shared deck |
| police-exam-practice | source-correct questions | progress continuity | police exam domain | failure→targeted practice set | too many overlapping modes |
| ppt-studio | fail-closed auth + green CI | provenance-preserving generation | source/evidence→deck pipeline | agent/API only after trust gate | remote-agent surface before auth repair |
| exam-archive | archive completeness/provenance | searchable structured metadata | exam-source collection | coverage-gap queue | AI features before source truth |
| academic-mcp | canonical paper identity/source states | versioned research bundle/diff | multi-source research MCP | failure cluster for rate-limit/source disagreement | collapsing PARTIAL/UNKNOWN into no-result |
| cf-mcp-server | explicit consent/auth/effect boundary | exact-target receipts | controlled MCP integration | managed consent workflow | connector breadth before security boundary |

---

# Top 10 Cross-Portfolio Ideas

1. **Observed Failure → Candidate Regression Fixture**: make failure discovery a typed handoff, not an alert screenshot.
2. **Canonical Artifact → Agent/API Action → Candidate Revision → Explicit Promotion**: AI/automation never needs a second product state.
3. **In-context derived artifact**: create the next artifact where it is consumed to remove download/upload/copy-paste loops.
4. **Failure discovery ≠ gold label**: clusters require deterministic/human approval before becoming regression authority.
5. **Identity/state portability with explicit environment read-back**: preserve actor continuity without assuming machine equivalence.
6. **Retention/cost/privacy receipt for traces and memory**: no invisible “keep everything” default.
7. **Public/share state is independent from edit state**: especially important once APIs/MCP can mutate artifacts rapidly.
8. **Editable handoff > pretty generation**: structured/exportable artifacts matter more than first-render aesthetics.
9. **Evidence gate before feedback expansion**: do not ingest more production/user signals into a broken promotion pipeline.
10. **SIMPLIFY before ADD**: if an existing Issue/PR already owns the fingerprint, strengthen sequencing/acceptance rather than create another feature.

---

# Ideas Rejected / Deferred

1. **New `[Competitive Inspiration]` for MiniDeck MCP/API.** Rejected as duplicate/active overlap: PR #1 already implements MCP v2/runner, while #4 owns the publication trust boundary. Correct action is sequencing, not another Issue.
2. **Generic Reese-max AI observability platform.** Rejected. Braintrust/Agnost/etc. show a valid market, but `autodev-ng`, `lobsterpulse`, `project-doctor-web`, `prompt-autoresearch` already have narrower product-shaped evidence surfaces. A central dashboard would add surface area without fixing current reliability gates.
3. **Automatic production-trace → gold-eval promotion.** Rejected. Trace clusters are candidates, not truth; privacy, correlation, injection and labeling errors require a separate approval/gold step.
4. **Full video editor inside `video-timeline-pipeline`.** Rejected. Adobe's signal supports direct handoff, and #11 already defines a narrower CutSpec/NLE bridge.
5. **Persistent-agent framework inside `autodev-ng`.** Rejected as duplicate direction. #17/#21 plus `adng-memory #4` already separate principal/environment/memory lifecycle; copying Letta would blur product boundaries.
6. **Presentation analytics/passcode/teamspace breadth in MiniDeck.** Deferred. Latest internal audit explicitly says publish trust first.
7. **More prompt/eval data before prompt-autoresearch CI/evidence repair.** Rejected sequencing. #4 P1 then #3 variance-aware promotion, then richer failure-intake research.

---

# Issue / PR Mapping and Coordination

| Signal | Existing owner | Action this round |
|---|---|---|
| Pitch MCP/API / agent deck editing | `minideck PR #1`; publication semantics `minideck #4` | Report only. No comment/Issue; product-board already refreshed #4 this morning. |
| Draft/public separation | `minideck #4` | Remains P1; latest audit confirms fingerprint. |
| Adobe Paper Edit / in-context media | `video-timeline-pipeline #11` | Report only; no duplicate. |
| Failure cluster → eval | `prompt-autoresearch #3/#4` are prerequisite reliability/eval owners; broader cross-portfolio candidate unowned | Research list only until promotion evidence is trustworthy. |
| Portable agent identity/state | `autodev-ng #17`, `#21`, `adng-memory #4` | External validation only; no duplicate. |
| Clinical context/section repair | `clinical-scribe-worker #7`; auth blocker #6 | No duplicate. |
| Router quality/reliability profiles | `cf-ai-router #1` | No duplicate. |

Lock/coordination checks: `minideck #4` had a product-board `github-issue-lock:v1` lease created at 2026-09-12 02:04 UTC and expiring 03:34 UTC; it was already followed by a product-board evidence comment. This radar did not compete for the same work or add redundant Issue traffic. No product source code, implementation branch, merge, deployment, secrets, permissions or repository settings were changed.

---

# Sources

## Primary / first-party
- Pitch, **Introducing Pitch's MCP and API**, 2026-08-12: https://pitch.com/whats-new/introducing-pitch-mcp-and-api
- Pitch API help, current 2026: https://help.pitch.com/en/articles/15926009-use-pitch-s-api
- Pitch pricing, current 2026: https://pitch.com/pricing
- Adobe, **Generate/Create Directly in Timeline**, 2026-09-09: https://blog.adobe.com/jp/publish/2026/09/09/cc-generate-create-directly-in-your-timeline-with-new-ai-powered-innovations-in-premiere-after-effects
- Adobe Premiere release notes: https://helpx.adobe.com/premiere/desktop/whats-new/release-notes.html
- Braintrust, **Evals foundations**, 2026-09-09: https://manifesto.preview.braintrust.dev/workshops/2026-09-09-evals-foundations
- Braintrust MCP: https://www.braintrust.dev/blog/braintrust-mcp
- Braintrust pricing: https://www.braintrust.dev/pricing
- Letta Agents SDK, 2026-08-17: https://www.letta.com/blog/introducing-the-letta-agent-sdk/
- Letta SDK current product page: https://www.letta.com/agent-sdk/

## Product discovery / market listings
- Agnost AI: https://www.producthunt.com/products/agnost-ai
- Progress AI Observability: https://www.producthunt.com/products/progress-ai-observability
- OpenObserve AI Observability: https://www.producthunt.com/products/openobserve
- Latitude: https://www.producthunt.com/products/latitude-4
- Raindrop: https://www.producthunt.com/products/raindrop
- Plus AI Presentation Agent: https://www.producthunt.com/products/plus-ai-presentation-agent
- Folio AI: https://www.producthunt.com/products/folio-ai

## Community / anecdotal only
- AI presentation editability complaint, 2026-08-04: https://www.reddit.com/r/aiToolForBusiness/comments/1vf3g3t/finally_found_an_ai_presentation_maker_that/
- AI-deck cleanup/export pain, 2026-07-24: https://www.reddit.com/r/powerpoint/comments/1v51dlm/if_your_ai_presentation_tool_keeps_making_decks/
- LLM eval discipline discussion, 2026-09-01: https://www.reddit.com/r/LLMDevs/comments/1w43rhc/most_people_evaluating_llm_changes_are_just/
- Premiere Paper Edit beta discussion, 2026-06-16: https://www.reddit.com/r/premiere/comments/1u7ga43/now_in_beta_paper_edit_to_text_based_editing/

---

# What Changed Since Last Radar (r4 → r5)

1. **No new repository count:** still 37 non-archived product-like repositories.
2. **New internal truth:** `minideck` product-board audit re-confirmed the public-head defect and explicitly prioritized #4 over more generation/collaboration/share analytics; PR #1 remains separately scoped MCP v2/runner work.
3. **New direct-competitor emphasis:** Pitch's MCP/API shows presentation products becoming agent-addressable workflow objects. This validates MiniDeck/PPT Studio's direction, but also makes explicit publication/promotion semantics more important, not less.
4. **New adjacent workflow emphasis:** Adobe's latest timeline-native generation strengthens the cross-portfolio “make the next candidate artifact at the point of use” pattern; no new Issue because `video-timeline-pipeline #11` and `flux-image-gen #22` already encode it.
5. **New emerging-workflow emphasis:** Braintrust plus newer Product Hunt observability products show convergence around failure-pattern discovery → eval creation → fix validation. Reese-max should preserve this as a future reusable primitive, but **not before `prompt-autoresearch #4/#3` restore a trustworthy evidence/promotion gate**.
6. **Architecture validation, not direction change:** Letta's persistent agent SDK reinforces the existing `Principal ≠ Engine ≠ Environment ≠ Memory` separation already tracked by #17/#21/adng-memory #4.
7. **No notification threshold crossed:** no high-value non-duplicate feature opportunity, no competitor move that invalidates current product strategy, and no new cross-portfolio primitive absent from existing tracked work. This round therefore writes evidence/history only and does not create/update an Issue.

## Portfolio Principle Added This Round

**`Observed Failure ≠ Gold Eval; Agent-accessible Artifact ≠ Auto-published Artifact; Persistent Agent ≠ Equivalent Environment.`**

The next useful system layer is not “more AI surfaces.” It is a disciplined conversion pipeline:

`Observed Context/Failure → Candidate Structured Artifact → Evidence/Label/Preview → Explicit Promotion → Runtime/Publication Receipt`.
