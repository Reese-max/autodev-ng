# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-12 r8

> Scope: `Reese-max` repositories owned by Reese-max, not archived, and reasonably product-like.  
> Evidence discipline: public web outside Reese-max GitHub is the primary research source; connected GitHub is used for current product truth, recent changes, duplicate/PR/lock coordination, and persistence.  
> Confidence: **CONFIRMED** = first-party product/docs/release or current repo evidence; **LIKELY** = announced/strong inference, not fully verified as shipped; **COMMUNITY_SIGNAL** = anecdotal user/practitioner evidence only; **UNKNOWN** = insufficient evidence.  
> Vendor benchmark/marketing claims are treated as product signals, not Reese-max performance evidence.

## Executive Summary

This round rechecked the same **37 non-archived product-like repositories**. The strongest new external change is in professional video tooling: on **2026-09-08, DaVinci Resolve Studio 21.1 shipped AI-assistant integration through a native MCP server**, allowing compatible external assistants such as Claude / Claude Code / ChatGPT Codex to analyze projects, organize media, change settings, build highlight edits, remove clips and batch-render. In parallel, Invideo launched a browser-based **agentic video editor** on 2026-09-01 where AI acts on an editable multitrack timeline, Adobe expanded project-wide AI assistants / in-timeline generation on 2026-09-08, and emerging local editors such as WeftCut and PilotCut expose editable timelines to MCP agents while keeping human review/undo in the loop.

For Reese-max, this materially strengthens an existing direction rather than justifying a new editor. `video-timeline-pipeline #11` already defines **Evidence-backed Paper Cut / NLE Handoff** and has active PR **#15** implementing research artifacts around CutSpec, CSV/OTIO interchange and runtime verification. The new signal changes the **next-stage adapter strategy**:

`Canonical Evidence → Candidate CutSpec → Preview → deterministic export → TargetCapabilityProbe → typed target-native apply → target read-back / change receipt → human creative decision`

The key product opportunity is **not** “let an LLM freely edit video.” It is to preserve the current evidence/provenance boundary while making a verified professional NLE a downstream executable target when that target exposes a typed API/MCP surface. Because PR #15 is open and mergeable, this round obeys the coordination rule: **no update/comment/lock is made on #11 or #15; the signal is recorded only in this central radar**.

A second major market signal comes from Atlassian on **2026-09-10**: it is shipping an AI-native SDLC stack around **Code Context, Agent Context Controls, governed agent loops, Standards, AI Review, Agent Usage Dashboard and DX measurement**. This does not justify a new “AI Control Plane” monolith in Reese-max because `autodev-ng` already has task/execution identity, #11 steering, #12 external-effect containment, #17 principal/credential identity, #21 environment contracts, independent review/evidence and `lobsterpulse` attention work. The transferable signal is narrower: **context, authority, standards, execution and measurement should remain independent contracts and be composable across agents**.

The only material repository delta since r7 is `minideck`'s Round-4 audit. It leaves publication-boundary Issue #4 unresolved and adds #6: recent default-branch CI records failed before runner execution (`runner_id=0`, `steps=[]`). The correct product response is **feature restraint**: repair draft/published truth and remote verification before agent/editor breadth.

**Notification gate: MET — major competitor strategy change.** A mainstream professional NLE has moved native agent control into the product surface, and multiple independent video products now converge on “agent does repetitive edits on a real editable timeline; human retains creative authority.” No new Issue is created because the relevant Reese-max Issue already has an active PR.

---

# Portfolio Discovery / Product → Market Category

Current active product-like portfolio remains **37 repositories**.

| Product | Market / primary JTBD | Current radar priority |
|---|---|---|
| `exam-archive` | exam archive/search | Source completeness, version/provenance and retrieval truth. |
| `police-exam-practice` | police-exam practice | Official answer provenance, progress continuity, wrong-answer repair. |
| `police-exam-archive` | Taiwan police-exam archive | Provenance/completeness/search traceability. |
| `92-duty-scheduler` | duty/workforce scheduling | Constraint truth, explainable conflicts, one canonical schedule state. |
| `UkePack` | music/ukulele creative tooling | Reversible candidate→canonical assets; avoid generic AI-suite expansion. |
| `ppt-studio` | presentation generation/studio | Auth/CI reliability + provenance before remote-agent breadth. |
| `voice-actress` | legal/knowledge answer workflow | `Citation exists ≠ citation supports claim`; source-backed reasoning. |
| `taiwan-intel-dashboard` | Taiwan intelligence dashboard | Freshness/coverage/evidence + attention compression. |
| `autodev-ng` | multi-engine autonomous-development control plane | Compose #11/#12/#17/#21/#28 rather than add a monolithic control plane. |
| `flux-image-gen` | image generation/edit workflow | #22 session/reference lineage; candidate/branch/compare/rollback. |
| `claude-mem` | coding-agent memory | Provenance, freshness, activation/supersession; not raw transcript accumulation. |
| `lobsterpulse` | agent/provider operations monitoring | #9 decision-only attention queue; do not add raw alert volume. |
| `prompt-autoresearch` | prompt research/evaluation | Independent train/test evidence; avoid self-feedback drift. |
| `neciken-summer-poem` | narrow creative/literary experience | Preserve artistic identity and authorship/version control. |
| `note-filler` | document/note automation | User-owned vs AI-candidate fields, source-backed fill, review. |
| `lplrs-judicial-sync` | judicial-data synchronization | Target-date coverage receipt, no-success alert, backfill/gap truth. |
| `adng-memory` | agent operational memory/state | Staleness/supersession/deletion/activation lifecycle. |
| `cyber-prep-coach` | cybersecurity exam prep | Dataset integrity, official blueprint/version migration, fewer modes. |
| `cf-ai-router` | AI gateway/provider routing | Provider capability/reliability/cost truth; no silent paid fallback. |
| `avatar-vfo` | avatar/visual output | Versioned asset lineage and reversible candidate→canonical flow. |
| `project-doctor-web` | software/project diagnosis | Failure→repro→verification, cross-repo context without false-green UI. |
| `minideck` | lightweight deck generation/share | **Hard gate:** draft/published boundary + actually executing CI before expansion. |
| `chatgpt-dual-pipeline` | dual-model/reviewer pipeline | Independent evidence/reviewer roles and explicit handoff states. |
| `internship-notes-sites-mirror` | publishing/mirror | Source/freshness sync, stable publishing. |
| `taichung-police-intel` | municipal/police intelligence monitoring | Source coverage/evidence + decision-only attention; no duplicate control surfaces. |
| `soundbox-offline` | local/offline music player | Recovery/integrity before NAS/network-source breadth. |
| `skill-foundry` | Skill creation/evaluation/certification | Separate quality/runtime/security + distribution/install receipts. |
| `video-timeline-pipeline` | video intelligence → production handoff | #10 visual escalation, #11 evidence-backed NLE handoff; **new target-native NLE adapter signal**. |
| `ai-novel-workstation` | long-form writing workstation | #6 typed story reads/candidate patches; CI prerequisite. |
| `clinical-scribe-worker` | clinical drafting/validation | Source-backed draft, user ownership, human review, privacy. |
| `MaterialYouNewTab` | new-tab productivity/workspace | Session Capsule research; local-first + optional permissions. |
| `cf-mcp-server` | MCP/Cloudflare integration | Consent/auth/effect boundaries; no install==authority assumption. |
| `tick-stock-panel` | market/portfolio panel | Coverage/freshness/partial-data truth before broad finance AI. |
| `herdr-skills` | agent Skill orchestration/reuse | Package/security/runtime/distribution evidence; no copied-skill trust shortcut. |
| `ninax-line-hermes` | LINE/agent workflow integration | Purpose-bound external effects, recipients, receipts. |
| `ai-flight-radar` | flight watch/fare intelligence | Quote/source health, total-trip cost, watch/reconfirm; no auto-buy. |
| `academic-mcp` | academic research aggregation/MCP | Canonical paper identity, source-status truth, replayable research bundles. |

---

# External Signals

## A. Direct competitor / major market change — DaVinci Resolve Studio 21.1 makes the NLE itself an agent target

**CONFIRMED — released 2026-09-08**  
First-party release URL: https://www.blackmagicdesign.com/media/release/20260908-03  
Cross-checks:  
https://gigazine.net/gsc_news/en/20260909-davinci-resolve-21-1-update/  
https://www.watch.impress.co.jp/docs/news/2139568.html

Blackmagic's 21.1 release adds AI-assistant integration to Resolve Studio. Current reporting tied directly to the Blackmagic release describes a **native MCP server** connecting Claude, Claude Code and ChatGPT Codex. The assistants can operate on the live project for tasks such as project analysis, media organization, setting changes, highlight edits, clip removal and batch rendering. Secondary coverage also confirms the AI integration is a **Studio-tier** capability, while the base editor remains free.

### Job-to-be-Done
An editor wants to delegate repetitive, structurally well-defined work without exporting project context into a separate AI editor or recreating a rough cut manually.

### Why it saves steps / improves reliability
The target of automation is the **canonical editing project itself**, so an assistant can act on media/timeline/project objects instead of producing prose timecodes that a person must re-enter. This removes one handoff layer: `analysis result → manual timecode copy → NLE reconstruction` can become `typed plan → NLE operation → read-back`.

### Onboarding / distribution
The agent bridge is built into the professional editing product rather than requiring a separate automation dashboard. The pricing signal is also important: agent integration is packaged in the paid Studio tier, suggesting professional users may pay for **workflow automation inside the canonical tool** rather than a separate AI-only editor.

### New capability pattern
`External Agent → typed NLE surface → live project state → editable operation → human review/render`.

### Limits / failure points
- Native integration does not prove complete API coverage or reliable creative judgment.
- Recent user discussion reports gaps in timeline scripting operations and continued need to check AI edits; these are community anecdotes, not market-wide failure rates.
- A successful API/MCP call does not prove the intended timeline state is correct; target read-back is required.
- Professional editing semantics include timebase, VFR, proxy/original relinking, transitions, grades and attached effects; destructive shortcuts can lose attached state.

### Reese-max transfer
`video-timeline-pipeline` should **not build its own NLE**. The new high-value pattern is to make #11's evidence-backed CutSpec capable of targeting a verified downstream editor via an adapter that first probes target capabilities and then records exact applied/read-back changes.

### What not to copy
- No free-form “AI can edit anything” permission.
- No silent direct mutation of source media or canonical NLE projects.
- No claim that `MCP connected` means `all editing operations supported`.
- No replacement of deterministic CSV/OTIO export; target-native control should be an optional later adapter.

**Opportunity Score: 93/100.**  
Disposition: **REPORT ONLY because `video-timeline-pipeline #11` already owns the fingerprint and PR #15 is actively open/mergeable. No lock/comment/update made.**

---

## A2. Direct/adjacent convergence — Invideo and Adobe move AI work onto editable timelines/projects

### Invideo Editor
**CONFIRMED — 2026-09-01**  
https://invideo.io/news/introducing-invideo-editor/

Invideo launched a browser-based professional editor with an AI assistant that receives plain-language direction and places results on a **real multitrack timeline the user controls**. Its positioning explicitly separates work only the editor can do (story/rhythm/taste) from logging, syncing, selects, silence removal and search. It also exposes version branching/rollback and frame-accurate review comments that the assistant can act on.

Transferable principle: **agent output should land as editable, reviewable project state, not as a final opaque render.**

### Adobe Premiere / After Effects
**CONFIRMED — 2026-09-08**  
https://blog.adobe.com/en/publish/2026/09/08/generate-create-directly-in-your-timeline-with-new-ai-powered-innovations-in-premiere-after-effects

Adobe expanded AI work inside the canonical creative project: Premiere can generate media directly in timeline gaps, and After Effects AI Assistant can operate across an entire project for tedious technical/multi-step work while Adobe explicitly says the user remains in creative control and every outcome remains editable.

Transferable principle: eliminate “leave canonical tool → generate elsewhere → download → import → re-align” loops when an operation can safely remain inside the editable project.

**Disposition:** supports #11 / `ppt-studio` / `flux-image-gen` handoff philosophy; no new Issue.

---

## B. Adjacent transferable workflow — Google Sheets Canvas: generated view stays synchronized to canonical data

**CONFIRMED — 2026-08-13**  
https://blog.google/products-and-platforms/products/workspace/sheets-canvas-for-google-sheets-spreadsheets/

Sheets canvas lets Gemini create interactive mini-app views—dashboards, study trackers, seating charts—directly on top of spreadsheet data. Google describes the canvas as a **read-write layer** that stays synchronized with the original Sheet in real time.

### Job-to-be-Done
Users want a workflow-specific interface without manually rebuilding/copying structured data into another app.

### Why it saves steps
The source dataset stays canonical; the custom UI is generated as a view. Changes made in either surface remain synchronized instead of forcing export/import or duplicate data ownership.

### Onboarding/distribution
The generated view lives inside the spreadsheet product and shares through the same collaboration model.

### Transferable capability pattern
`Canonical Structured Data → Generated View → Bidirectional validated mutation → Same canonical state`.

### Pricing/business signal
The feature is tied to Google AI Pro/Ultra and selected Workspace tiers. The design signal is that **workflow-specific UI generation can be monetized without creating a second data silo**.

### Reese-max fit
Strong adjacent idea for `92-duty-scheduler`, exam products, `note-filler`, `taiwan-intel-dashboard` and other structured-data tools: prefer generated task-specific views over adding many hard-coded modes. The view should operate through typed canonical services, not duplicate data into an AI-owned store.

### What not to copy
- Do not let a generated view bypass scheduler/exam/document validation rules.
- Do not allow AI-generated UI state to become a second canonical database.
- Do not interpret a synchronized UI as proof the underlying domain mutation is valid.

**Opportunity Score: 87/100.**  
Disposition: cross-portfolio research pattern only; no new Issue because each candidate product currently has higher-priority truth/reliability work.

---

## C. Emerging product / technical pattern — agent-native local NLEs make “MCP + editable timeline + checkpoints” a reusable product architecture

### WeftCut
**CONFIRMED current product, checked 2026-09-12; launch date not relied on**  
https://weftcut.com/

WeftCut is a free/open-source MIT desktop NLE that exposes the editor to MCP clients. It keeps footage local, gives agents editing primitives such as trim/split/transitions/keyframes/effects/captions/markers, records agent moves in a change feed and places edits under checkpoints/undo. Optional analysis is local.

### PilotCut
**CONFIRMED current product, checked 2026-09-12; launch date not relied on**  
https://www.pilotcut.com/

PilotCut is a native Mac editor designed for MCP-speaking agents such as Claude Code/Codex/Gemini CLI. It is local-first/BYO-agent, and its current product surface says agent proposals become named operations that can be accepted, rejected or tweaked before rendering. Its free/beta/perpetual-license packaging is a useful business-model signal: local workflow automation can be sold without per-minute media credits. Vendor performance numbers are not used as evidence.

### New product possibility
The interesting abstraction is not “MCP video editor.” It is **typed operation proposals against a canonical editable object, with checkpoints/read-back and no need to upload original media**.

### Reese-max fit
For `video-timeline-pipeline`, this argues that after deterministic #11 export works, adapters should target **capability-probed NLE operations**. For other products, the same pattern supports agent-accessible typed project APIs where humans can review candidate mutations before promotion.

**Disposition:** supports the same #11 next-stage design; report-only due active PR.

---

## D. Major adjacent strategy — Atlassian moves from per-prompt coding AI to governed agent loops

**CONFIRMED — 2026-09-10**  
https://www.atlassian.com/blog/jira/governed-agent-loops

Atlassian announced/started shipping a stack around:
- **Code Context** across multi-repository codebases;
- **Agent Context Controls** that govern which agents can operate in a space and what they may see;
- agent loops for always-on workflows;
- Standards and AI Review;
- an Agent Usage Dashboard;
- DX measurement around productivity/quality/cost.

Availability is mixed: Code Context is rolling out in open beta for paid customers, while some loop/Standards/AI Review capabilities are private early access and other governance/dashboard features are coming to paid Jira customers. This distinction matters: strategy is confirmed; not every item is broadly GA.

### JTBD
Scale coding agents beyond one-off prompts while retaining organization context, access governance, standards/review and measurable outcomes.

### Transferable principle
`Context ≠ Authority ≠ Execution ≠ Review ≠ Outcome Metric`.

### Reese-max fit
This validates the existing decomposed architecture rather than calling for another dashboard: #11 controls in-flight instruction, #12 controls external effects, #17 principal/credential identity, #21 runtime environment, #28 browser authority, reviewers/evidence handle quality, and `lobsterpulse #9` handles human attention. A later context-graph layer should feed these contracts, not bypass them.

### What not to copy
- Do not make “shared context” an unrestricted corpus every agent can read.
- Do not use agent-usage counts as productivity evidence.
- Do not add an executive dashboard before runtime truth/receipts are reliable.
- Vendor productivity percentages are not adopted as Reese-max success metrics.

**Opportunity Score: 91/100 as a market-direction signal, but not a separate Issue fingerprint today.**

---

## E. Cross-portfolio safety confirmation — Meta Muse shows broad app access needs explicit capability, safety and environment separation

**CONFIRMED via Reuters — 2026-09-08**  
https://www.reuters.com/business/meta-launches-ai-agent-that-can-access-other-apps-send-emails-make-payments-2026-09-08/

Reuters reports Meta launched Muse with access to email/calendar/payments/health/shopping/smart-home apps and autonomous tasks such as email, sales and travel booking. It uses app-access controls and a safety-agent concept, but Reuters also reports internal testing found security/reliability problems and the launch had been delayed for additional safety work.

This is a major market signal but **not a new Reese-max opportunity fingerprint**: it reinforces the already-separated `principal / environment / capability / effect / human-attention / receipt` layers in `autodev-ng #12/#17/#21/#28`.

**Disposition:** confirmation only; no duplicate Issue.

---

# New Releases / Market Changes

| Date | Product/ecosystem | Signal | Confidence | Reese-max implication |
|---|---|---|---|---|
| 2026-09-10 | Atlassian | Governed agent loops + Code Context + context controls + standards/review/usage measurement | CONFIRMED, mixed rollout stages | Compose context/governance/measurement; do not build one monolithic control plane. |
| 2026-09-08 | DaVinci Resolve Studio 21.1 | Native AI-assistant/MCP integration into canonical professional NLE | CONFIRMED | #11 should remain export-first but plan optional typed target-native adapters with read-back. |
| 2026-09-08 | Adobe Premiere / After Effects | Generate/assist directly in editable timeline/project | CONFIRMED | Generated output should remain editable and project-local; reduce external handoff loops. |
| 2026-09-08 | Meta Muse | Cross-app personal agent with broad consequential actions and safety controls | CONFIRMED | Validates capability/effect/environment separation; no new architecture needed. |
| 2026-09-01 | Invideo Editor | Agent performs real edits on user-controlled multitrack timeline | CONFIRMED | Human creative authority + editable operations is becoming a baseline product pattern. |
| 2026-08-13 | Google Sheets Canvas | AI-generated read/write mini-app on canonical Sheet data | CONFIRMED | Prefer generated synced views over duplicated AI-owned data/mode sprawl. |
| checked 2026-09-12 | WeftCut | Local/open MCP editor + change feed/checkpoints | CONFIRMED current capability | Typed project operations + checkpoints can outperform full custom editor scope. |
| checked 2026-09-12 | PilotCut | Local/BYO-agent native timeline + named reviewable operations | CONFIRMED current capability | Local-first agent editing can use customer agent and preserve media locality. |

---

# Community Pain Points

Community evidence is **anecdotal only** and is not treated as adoption, defect-rate or performance statistics.

1. **Resolve 21.1 API coverage / trust:** a 2026-09-08 r/davinciresolve discussion says some common timeline operations still lack clean scripting primitives, making workarounds destructive to attached grade/Fusion state. Another release discussion says users still expect to inspect AI edits rather than trust full creative edits.  
   Sources:  
   https://www.reddit.com/r/davinciresolve/comments/1wb0osu/the_new_davinci_211_llm_integration_is_a_nice/  
   https://www.reddit.com/r/davinciresolve/comments/1waf7ns/davinci_resolve_211_is_out_now/
2. **Setup friction:** one 2026-09-08 Windows user reported Resolve's AI-assistant setup could not find a Claude installation path without a manual workaround.  
   Source: https://www.reddit.com/r/davinciresolve/comments/1wb1oub/davinci_resolve_211_setup_ai_assistant_error/
3. **Creative-boundary preference:** an editor discussion describes AI as useful for repetitive prep/rough cuts/audio cleanup while pacing/story/creative direction remains human work.  
   Source: https://www.reddit.com/r/editing/comments/1td336d/has_ai_actually_replaced_video_editing_workflows/
4. **Release stability is still a separate concern:** recent Resolve users reported instability/crashes after 21.1. This does not prove AI caused the regressions; it is retained only as a reminder that feature breadth and product reliability are independent.  
   Source: https://www.reddit.com/r/davinciresolve/comments/1wczzwm/211_update_has_been_awful_are_these_problems/

Product consequence: **do not infer that native AI integration eliminates the need for capability probing, preview, checkpoint/rollback or read-back verification.**

---

# Adjacent Ideas

## 1. Canonical Data → Generated View, not a second AI database
`CanonicalDomainState → GeneratedTaskView → typed mutation → validation → same canonical state`

Best future fits: `92-duty-scheduler`, exam tools, `note-filler`, dashboards. This can simplify mode sprawl rather than add features.

## 2. Evidence → Editable Operation, not prose instructions
`EvidenceOccurrence → CandidateOperation → Preview → target capability check → apply → read-back → receipt`

Best fit: `video-timeline-pipeline #11`; later reusable in deck/image/story tools.

## 3. External agent surface should be target-native when the target is already canonical
If Premiere/Resolve/another application already owns the canonical timeline, Reese-max should prefer a narrow adapter over recreating that editor. This is an **opportunity to delete scope**, not add a second editor.

## 4. Agent context needs access policy and freshness
Atlassian's current strategy supports a reusable Reese-max rule: context must retain source/provenance/access/freshness and cannot automatically grant authority. This fits `adng-memory`, `claude-mem`, `academic-mcp`, `autodev-ng` and `ai-novel-workstation`.

---

# Opportunity Scores

Scores are portfolio heuristics, not external market statistics. Effort/Risk are scored for controllability; lower effort/risk raises the total.

| Candidate | User Pain | Strategic Fit | Novelty | Evidence | Reuse | Effort ctrl. | Risk ctrl. | Score | Disposition |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `video-timeline-pipeline`: verified target-native NLE adapter after #11 deterministic CutSpec | 9 | 10 | 9 | 10 | 9 | 8 | 8 | **93** | Report only; #11 + active PR #15 already own path |
| `autodev-ng`: composable governed context/standards/measurement layer | 9 | 10 | 8 | 10 | 10 | 7 | 8 | **91** | Existing contracts already own authority/execution/review; research pattern only |
| Cross-portfolio: canonical-data generated synced views | 9 | 9 | 8 | 10 | 10 | 8 | 8 | **87** | Research/simplification pattern; no new Issue |
| `minideck`: agent/editor breadth now | 6 | 5 | 7 | 8 | 5 | 5 | 4 | **58** | REJECT now; #4 publication truth + #6 CI first |
| `soundbox-offline`: new network sources now | 7 | 7 | 6 | 7 | 5 | 5 | 5 | **65** | HOLD; recovery integrity first |
| `ppt-studio`: remote project agent now | 8 | 8 | 7 | 9 | 8 | 5 | 4 | **72** | HOLD; auth/CI trust gate first |

---

# Opportunity Map — all 37 products

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| `exam-archive` | Source/version provenance | Coverage/delta health | Taiwan exam truth | Generated study view on canonical archive | AI answers without official source |
| `police-exam-practice` | Official answer/source identity | Blueprint/progress migration | Police-exam-specific repair | Canvas-like study tracker | More modes / opaque AI grading |
| `police-exam-archive` | Complete traceable archive | Missing-period alerts | Taiwan police exam lineage | Search/study view | Unsourced answer enrichment |
| `92-duty-scheduler` | Constraint/lock truth | Explainable conflicts | Policy-aware duty scheduling | Generated synced roster views | Second AI-owned schedule database |
| `UkePack` | Artifact/version integrity | Reversible edit candidates | Narrow creative workflow | Agent-readable candidate manifest | Generic creative suite |
| `ppt-studio` | Source/citation + auth/CI truth | Editable structured output | Evidence-preserving deck workflow | Target-native project operations later | Remote agent breadth before trust gate |
| `voice-actress` | Citation existence/support split | Claim-level evidence | Legal/source verification | Typed research→answer bundle | Citation checker = reasoning correctness |
| `taiwan-intel-dashboard` | Freshness/coverage truth | Decision-focused views | Taiwan source provenance | Generated synced operational views | Stale source shown as “no event” |
| `autodev-ng` | Principal/environment/effect/capability separation | Governed context + standards + outcome receipts | Evidence-first multi-engine orchestration | Atlassian-like context graph feeding existing contracts | One giant control-plane dashboard |
| `flux-image-gen` | Edit-session/reference lineage | Spatial drift checks | Private/reversible creative revisions | Editable downstream handoff | “selected area” = guaranteed edit boundary |
| `claude-mem` | Source/freshness/ownership | Scoped cross-client recall | Local controllable memory | Context access manifest | Stale memory silently active |
| `lobsterpulse` | Decision-only attention | Correlation/pre-investigation | Truthful agent/provider state | Outcome/quality signals | AI summary for every event |
| `prompt-autoresearch` | Train/test split | Frozen reusable eval bundles | Anti-drift evidence | Multi-agent research receipt | Synthetic-train gain = generalization |
| `neciken-summer-poem` | Authorship/version integrity | Gentle iterative session | Strong artistic identity | Session memory | Generic AI writing SaaS |
| `note-filler` | User-owned vs AI-owned fields | Source-backed candidate fill | Non-overwrite ownership semantics | Generated form view | Overwrite manual edits |
| `lplrs-judicial-sync` | Exact target-date coverage | No-success/backfill alert | Irrecoverable-gap accounting | Coverage dashboard | Schedule existence = data coverage |
| `adng-memory` | Source/scope/freshness | Supersession/deletion lifecycle | Ops-linked memory evidence | Governed context graph | More memory without lifecycle |
| `cyber-prep-coach` | Dataset/official blueprint version | Progress migration | Evidence-aware coaching | Canvas-like study UI | More home-screen modes |
| `cf-ai-router` | Provider/cost/capability truth | Health/routing receipts | Provider-neutral fail-closed routing | Policy/context-aware routing | Silent fallback to paid/unknown model |
| `avatar-vfo` | Asset consent/version lineage | Reversible edit flow | Local/source-preserving output | Creative session | Full regenerate for every change |
| `project-doctor-web` | Runtime/CI evidence | Cross-repo context + standards | Repro→verification diagnostics | Code-context graph | Dashboard as health proof |
| `minideck` | **Draft ≠ published; executing CI** | Structured editable deck | Lightweight HTML/version/share | Agent ops only after blockers | More AI/editor surface now |
| `chatgpt-dual-pipeline` | Independent pipeline/reviewer states | Handoff receipts | Cross-model contrast | Governed context bundle | Merge uncertain outputs into one truth |
| `internship-notes-sites-mirror` | Source/freshness sync | Delta visibility | Durable mirror | Generated search/read view | Mirror age hidden from user |
| `taichung-police-intel` | Source coverage/evidence | Attention compression | Local operational intelligence | Generated synced views | Autonomous external actions |
| `soundbox-offline` | Offline durability/recovery | Library integrity | Local-first ownership | WebDAV/SMB later | Cloud/network breadth before recovery |
| `skill-foundry` | Quality/runtime/security separation | Install/drift/rollback receipts | Evidence-chain certification | External inspector adapters | Ratings/stars = safety |
| `video-timeline-pipeline` | Exact source/evidence timing | #10 visual escalation + #11 CutSpec/NLE handoff | Provenance-rich intelligence→production | **Verified native NLE adapter/read-back** | Build full editor / freeform canonical mutation |
| `ai-novel-workstation` | Typed read/candidate patch | Context/cost lineage | Canon-preserving promotion | Agent-facing story workspace | Raw filesystem mutation |
| `clinical-scribe-worker` | Source vs draft vs clinician truth | User-owned field protection | Privacy/review provenance | Structured synced note view | AI output as final clinical truth |
| `MaterialYouNewTab` | Local-first/minimal permissions | Session capsule | Material workspace UX | Missing-only restore | Reopen URL = restore app state |
| `cf-mcp-server` | Consent/session binding | Scoped capabilities/effect receipt | Cloudflare/MCP security boundary | Human takeover/browser lease consumer | Installed MCP = authority |
| `tick-stock-panel` | Coverage/freshness/partial state | Data provenance | Transparent finance panel | Entitlement/source receipts | Broad finance chatbot before data truth |
| `herdr-skills` | Skill package/runtime security | Distribution installed-state | Multi-agent skill orchestration | Inspector/attestation | Copied Skill = safe/compatible |
| `ninax-line-hermes` | Recipient/effect authorization | Send receipts/attention | Channel workflow | Purpose-bound action lease | Model chooses recipients/actions silently |
| `ai-flight-radar` | Quote/source health + reconfirm | Total-trip and watch lifecycle | Taiwan-outbound multi-source radar | Post-book repricing research | Auto-book/auto-claim |
| `academic-mcp` | Canonical paper identity/source status | Bundle refresh/diff | Replayable research evidence | Context bundle into writing tools | Rate-limit/partial = no result |

---

# Top 10 Cross-Portfolio Ideas

1. **Typed Target Adapter + Read-back Receipt** — when another application already owns canonical state, Reese-max should produce a candidate plan/spec, probe capabilities, apply through typed APIs and verify actual state rather than rebuild the target product.
2. **Generated View over Canonical Data** — reduce mode/UI sprawl by generating task-specific read/write views that call the same validated canonical services.
3. **Context Access Manifest** — any agent context bundle should record sources, scope, freshness, privacy class and allowed consumers; context does not grant mutation authority.
4. **Editable Candidate, not Opaque Final Output** — video/deck/image/story outputs should remain reviewable/reversible before promotion.
5. **Capability Probe before Agent Action** — `connected` or `MCP available` is not equivalent to exact operation support; probe/version capability and preserve UNKNOWN.
6. **Human Taste/Judgment as an explicit boundary** — delegate repetitive/mechanical transformation while preserving approval for high-subjectivity or consequential decisions.
7. **Local/BYO-Agent as a business model option** — WeftCut/PilotCut show useful distribution where customer footage/state stays local and intelligence comes from the user's chosen agent.
8. **Feature deletion by handoff** — if Premiere/Resolve/Sheets already owns editing/view semantics, integrate rather than build another editor/dashboard.
9. **Outcome receipts over usage dashboards** — measure verified task outcome/quality/cost, not raw agent calls or token volume.
10. **Reliability gate beats competitive urgency** — `minideck`, `ppt-studio`, `soundbox-offline` should explicitly reject fashionable agent breadth while core publication/auth/CI/recovery truth is red.

---

# Ideas Rejected / Deferred

## Reject: build a full NLE inside `video-timeline-pipeline`
The market change actually makes this **less** attractive. Professional and emerging editors now expose agent surfaces; Reese-max can specialize in evidence/provenance/select generation and hand off to the canonical editor.

## Reject: immediately add direct Resolve mutation to #11
PR #15 is still research/export-first. Native MCP capability is new and API coverage is not equivalent to import correctness. First finish deterministic CutSpec/OTIO/CSV and source-range runtime verification; a target-native adapter is a later gated phase.

## Reject: new “Agent Control Plane” Issue for Atlassian parity
Existing Reese-max contracts already separate steering, external effects, principals, environments, browser leases, review and attention. A new control-plane monolith would mostly duplicate product surfaces and risk hiding enforcement gaps.

## Defer: `minideck` AI editing/agent mutation
Latest Round-4 audit remains **NOT CLEAN**: public share still tracks draft/edit head instead of an explicit published revision, and recent CI records did not execute runner steps. Fix #4/#6 first.

## Defer: `ppt-studio` remote project agent
The external creative market is moving toward project-wide agents, but current auth/CI reliability remains higher priority.

## Defer: `soundbox-offline` NAS/network library feature
Direct product evidence exists in the market, but recovery/integrity debt remains the correct sequencing gate.

---

# Issue / PR Mapping and Coordination

| Repo | External signal | Existing owner | Action this round |
|---|---|---|---|
| `video-timeline-pipeline` | DaVinci native MCP + Invideo/Adobe/WeftCut/PilotCut editable-agent workflows | **Issue #11 + open PR #15** | **Report only. Do not comment/update/lock.** |
| `video-timeline-pipeline` | More selective/agentic observation remains relevant | #10 | No change; distinct from editor handoff. |
| `autodev-ng` | Atlassian governed loops/context controls | #11/#12/#17/#21 + review/evidence; `lobsterpulse #9` | No duplicate Issue. |
| `autodev-ng` | Meta Muse broad app authority/safety | #12/#17/#21/#28 | Confirmation only. |
| `skill-foundry` | Agent component inspection market | #3 security attestation + #4 distribution | Already owned; no duplicate. |
| `minideck` | Competitive AI editor pressure | #4 publication boundary + new #6 CI execution gate | No feature Issue; reliability first. |

### Active coordination evidence
Connected GitHub shows `video-timeline-pipeline PR #15` is **OPEN, mergeable, head `devin/issue-11-research`**, with body explicitly referencing #11 and implementing CutSpec schema + CSV/OTIO interchange + round-trip/FFmpeg source-range verification. Therefore this radar does not add comments, claim an issue lock or alter that work.

---

# Sources

## First-party / authoritative product sources
- Blackmagic Design — DaVinci Resolve 21.1 release: https://www.blackmagicdesign.com/media/release/20260908-03 — 2026-09-08 — **CONFIRMED**.
- Invideo — Introducing invideo Editor: https://invideo.io/news/introducing-invideo-editor/ — 2026-09-01 — **CONFIRMED**.
- Adobe — Generate/create directly in timeline: https://blog.adobe.com/en/publish/2026/09/08/generate-create-directly-in-your-timeline-with-new-ai-powered-innovations-in-premiere-after-effects — 2026-09-08 — **CONFIRMED**.
- Google — Sheets canvas: https://blog.google/products-and-platforms/products/workspace/sheets-canvas-for-google-sheets-spreadsheets/ — 2026-08-13 — **CONFIRMED**.
- Atlassian — governed agent loops: https://www.atlassian.com/blog/jira/governed-agent-loops — 2026-09-10 — **CONFIRMED**, with rollout stages as stated by Atlassian.
- WeftCut: https://weftcut.com/ — checked 2026-09-12 — **CONFIRMED current product capability; launch date not inferred**.
- PilotCut: https://www.pilotcut.com/ — checked 2026-09-12 — **CONFIRMED current product capability; launch date not inferred**.

## Independent / secondary cross-checks
- GIGAZINE — Resolve 21.1 AI-assistant/MCP coverage: https://gigazine.net/gsc_news/en/20260909-davinci-resolve-21-1-update/ — 2026-09-09.
- Impress Watch — Resolve 21.1 Claude/Codex integration and Studio packaging: https://www.watch.impress.co.jp/docs/news/2139568.html — 2026-09-09.
- Reuters — Meta Muse cross-app agent: https://www.reuters.com/business/meta-launches-ai-agent-that-can-access-other-apps-send-emails-make-payments-2026-09-08/ — 2026-09-08.

## Community signals — anecdotal only
- Resolve API gaps: https://www.reddit.com/r/davinciresolve/comments/1wb0osu/the_new_davinci_211_llm_integration_is_a_nice/ — 2026-09-08 — **COMMUNITY_SIGNAL**.
- Resolve 21.1 release/trust discussion: https://www.reddit.com/r/davinciresolve/comments/1waf7ns/davinci_resolve_211_is_out_now/ — 2026-09-08 — **COMMUNITY_SIGNAL**.
- Setup AI Assistant path issue: https://www.reddit.com/r/davinciresolve/comments/1wb1oub/davinci_resolve_211_setup_ai_assistant_error/ — 2026-09-08 — **COMMUNITY_SIGNAL**.
- Editor on AI/repetitive vs creative tasks: https://www.reddit.com/r/editing/comments/1td336d/has_ai_actually_replaced_video_editing_workflows/ — 2026-05-14 — **COMMUNITY_SIGNAL**.
- Resolve 21.1 stability discussion: https://www.reddit.com/r/davinciresolve/comments/1wczzwm/211_update_has_been_awful_are_these_problems/ — 2026-09-10 — **COMMUNITY_SIGNAL**.

---

# What Changed Since Last Radar (r7 → r8)

1. **Portfolio count unchanged:** 37 non-archived product-like repositories.
2. **New major direct-market signal:** DaVinci Resolve Studio 21.1 has moved native external AI-assistant/MCP control into a professional NLE, elevating target-native agent editing from community tooling to a first-party product strategy.
3. **Independent convergence:** Invideo, Adobe, WeftCut and PilotCut all reinforce the same product shape: automate repetitive operations **inside an editable project/timeline**, keep review/undo/creative authority with the human.
4. **#11 next-stage direction clarified:** deterministic evidence-backed CutSpec/export remains the correct first layer; after it is runtime-proven, add an optional `TargetCapabilityProbe → Apply → ReadBackReceipt` adapter instead of building an editor.
5. **No Issue mutation due coordination:** `video-timeline-pipeline #11` already has open/mergeable PR #15. This run did not comment, update, lock or compete with it.
6. **New adjacent market strategy:** Atlassian is explicitly packaging governed multi-agent context, loops, standards, review and measurement. This validates Reese-max's decomposed contracts; no new “control plane” Issue is needed.
7. **New internal truth:** `minideck` Round-4 audit keeps publication-boundary #4 open and adds CI execution gate #6. Opportunity Map is tightened to **DO NOT EXPAND** until both are resolved.
8. **New simplification insight:** rising target-native agent surfaces reduce the need for Reese-max to rebuild full editing/admin UIs. “Integrate into canonical tool with typed receipts” is increasingly a product advantage, not a compromise.

---

## Portfolio Principle Added This Round

**`Evidence Plan ≠ Target Capability ≠ Applied Mutation ≠ Verified Target State ≠ Human Creative Approval`**

The more professional applications expose typed agent interfaces, the less Reese-max should rebuild those applications. The durable cross-portfolio pattern is:

`Canonical Evidence/Intent → Candidate Spec → Preview → Capability Probe → Explicit Typed Apply → Target Read-back → Receipt → Human/Policy Promotion`

A successful MCP/API call is transport evidence only; it must never be presented as proof that the intended product state is correct.