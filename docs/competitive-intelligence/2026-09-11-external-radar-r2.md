# External Competitive / Product / Workflow Inspiration Radar — 2026-09-11 r2

> Scope: Reese-max owned, unarchived repositories that are product-like. Public web is the primary source of market evidence. GitHub is used only to map current product state/recent changes, check duplicates/locks, update the matching research Issue, and preserve this report.
>
> Evidence labels: **CONFIRMED** = first-party product/docs/release information or directly inspectable current repository state; **LIKELY** = supported product inference still requiring runtime/user validation; **COMMUNITY_SIGNAL** = anecdotal user/developer report; **UNKNOWN** = insufficient evidence or result must be measured.
>
> Execution boundary: no product source code, implementation branch, merge, deploy, secrets, permissions, repository settings, or production configuration were changed.

---

## Executive Summary

This round found a **cross-portfolio distribution shift** rather than a new standalone fingerprint: **WebMCP is moving from a browser experiment into an agent-facing product surface that ChatGPT can already consume from the current page.**

The important change since the previous radar is that `taichung-police-intel #15` no longer needs to assume that “AI-ready distribution” means only a separately configured remote MCP server. Chrome’s WebMCP Imperative API was updated on **2026-09-01** with structured tool registration, side-effect/trust annotations, cancellation, and cross-origin controls; OpenAI’s current desktop app can discover WebMCP site tools from its built-in browser and use the page’s live signed-in state. OpenAI also ran a WebMCP Challenge from **2026-08-25 to 2026-09-03**, explicitly inviting existing web products to add WebMCP rather than build a new app.

This is a high-value reusable capability because many Reese-max products are already web applications with canonical typed actions or evidence projections. A page-native adapter can remove `open website → copy data → switch to AI → paste/restate → return to website` without creating a second source of truth.

**Action this round:** updated existing `Reese-max/taichung-police-intel #15` with a WebMCP/page-native delivery adapter, runtime verification requirements, and transport-neutral acceptance criteria. No new duplicate Issue was created. Incremental Opportunity Score: **94/100**.

The transferable architecture is:

`Canonical Product State → Typed Product Contract → Distribution Adapter {Web UI | MCP | WebMCP} → Existing Identity/Policy → Read or Candidate Effect → Canonical Result → DistributionReceipt`

The core caution is equally important: **WebMCP annotations are not authorization.** `readOnlyHint`, `untrustedContentHint`, and `consequentialHint` help clients reason about tools, but server-side data boundaries, authorization, current-state validation, effect confirmation, and runtime enforcement remain the source of truth.

Two additional external patterns were retained but not filed as new Issues:

1. **SideBoo (2026-08-15)** shows a strong direct-competitor browser workflow: one command palette searches open tabs, history, bookmarks and recently closed pages, with local-first storage and deliberate BYOK AI. `MaterialYouNewTab` already has a command palette and just improved bookmark navigation, so the opportunity is to **merge retrieval surfaces rather than add another widget**. Score **88/100**, research-list only.
2. **Moises Studio (2026-09-02 launch)** shows a transferable creative-AI pattern: AI works from human-created material, edits remain visible/reversible, collaboration happens in the same browser session, and output can hand off through existing formats such as MIDI/MusicXML/DAWproject. This reinforces `UkePack`, `ai-novel-workstation`, `ppt-studio`, and `video-timeline-pipeline`: assist inside canonical human work rather than replace it with a one-shot generated artifact. Score **84/100**, adjacent-pattern only.

---

## Portfolio → Market Category / Recent Change Check

Current scope remains **35 unarchived Reese-max repositories that can reasonably be treated as products**.

| Repository | Market / product category | Current/recent state used in this round |
|---|---|---|
| `cf-ai-router` | Multi-provider AI gateway / routing | Model lifecycle, capability, cost and fallback governance already have active research Issues; no new WebMCP-specific gap. |
| `soundbox-offline` | Local-first offline audio PWA | Import/local-library/offline workflow remains the strategic center; page-native agent actions would add little now. |
| `police-exam-archive` | Police exam archive / source corpus | Canonical source/version identity and archive→practice handoff remain more important than new agent UI. |
| `skill-foundry` | Agent skill evaluation / promotion | Candidate-vs-active, risk-tier validation and behavior receipts remain core; WebMCP can later be another evaluated capability surface. |
| `prompt-autoresearch` | Prompt/model experiment research | Reproducible eval, model drift and variance-aware promotion remain core. |
| `lobsterpulse` | Product / market intelligence | Source date/freshness/dedupe/change detection remain moat; agent-ready read projection is possible later. |
| `tick-stock-panel` | Self-hosted quantitative research workstation | Research/backtest/monitoring only; no broker execution. Typed page tools would require strict read-vs-action separation. |
| `clinical-scribe-worker` | Clinical drafting / scribe research worker | #7 owns minimal section repair/revision; no new external mutation surface until auth blocker is resolved. |
| `adng-memory` | Agent memory governance | Origin/admission/quarantine/staleness/deletion/poisoning remain core. |
| `avatar-vfo` | Persona / character simulation | Continuity regression and structured state validation remain core. |
| `note-filler` | Evidence-backed note augmentation | Candidate/approval/staleness already define the right human-in-control pattern. |
| `taiwan-intel-dashboard` | Public-source Taiwan intelligence dashboard | Natural future consumer of a transport-neutral read-only evidence contract. |
| `cyber-prep-coach` | iPAS cybersecurity exam preparation | Trusted corpus/mastery/calibrated explanations before more AI surface. |
| `UkePack` | Ukulele / music-education worksheet generator | Human-authored MusicXML/chords → teacher-reviewed differentiated practice packs; Moises reinforces human-first reversible AI. |
| `autodev-ng` | Multi-engine software-development orchestrator | Production recovery/completion receipts recently strengthened; previous r1 already addressed effect containment. |
| `ai-novel-workstation` | Local-first AI fiction production workstation | Canonical story state, resumability, continuity and bounded AI changes fit the human-first Moises pattern. |
| `herdr-skills` | Reflective coding-agent rule/skill system | #6 owns correction→candidate improvement; no need for another agent-tool exposure layer. |
| `video-timeline-pipeline` | Evidence-backed video understanding/editing handoff | #11 owns evidence→CutSpec/NLE handoff; visible/reversible agent operations reinforce existing direction. |
| `chatgpt-dual-pipeline` | De-identified internship-notes publishing surface | Historical publishing path; canonical source should remain one-way. |
| `claude-mem` | Coding-agent memory | Memory provenance and authority boundaries matter more than distribution surface. |
| `lplrs-judicial-sync` | Taiwan judicial corpus sync | Exact authority revision/removal/source spans; future read-only page tools should consume, never reinterpret, these receipts. |
| `internship-notes-sites-mirror` | Static downstream mirror | Reproducible one-way mirror, not an action surface. |
| `MaterialYouNewTab` | Browser new-tab / productivity workspace | Recent bookmark tree/navigation integration plus existing command palette make unified local retrieval the strongest fresh competitor gap. |
| `taichung-police-intel` | Public-source local-government/police intelligence | #15 already owns bounded read-only external AI distribution; this round adds WebMCP as a transport adapter. |
| `ninax-line-hermes` | LINE AI assistant / workflow adapter | Revision/redelivery identity and external-channel effect boundaries remain more important than WebMCP. |
| `voice-actress` | Taiwan police/legal essay practice | Evidence-linked rubric grading + simplify/reposition remain strategic. |
| `project-doctor-web` | Clinical interview / rolling SOAP teaching app | Structured patient/case workflows; avoid exposing consequential medical actions through page tools. |
| `92-duty-scheduler` | Duty scheduling / roster operations | #22 owns typed post-publication shift-change lifecycle; WebMCP could only be a future adapter after identity/current-state gates. |
| `flux-image-gen` | Image-generation workflow | Provenance/cost/output receipts; page agent access is not current bottleneck. |
| `neciken-summer-poem` | Literary contest / creative workstation | Contest source truth, candidate isolation and frozen revisions align with human-first AI. |
| `minideck` | AI HTML presentation generator | Generate/revise/version/share; future typed page tools should operate on candidates, not silently replace canonical deck state. |
| `ppt-studio` | Local presentation authoring / AI deck workstation | Editable deck + statement/source provenance; Moises-style reversible in-context assist is relevant. |
| `police-exam-practice` | Police exam practice | Correct official corpus + adaptive review; AI distribution is secondary. |
| `exam-archive` | General exam archive | Provenance/version integrity + archive→practice handoff. |
| `cf-mcp-server` | Cloudflare-hosted MCP infrastructure | Natural shared server-side contract layer; WebMCP should complement rather than duplicate it. |

---

## External Signals

### A. Direct competitor — SideBoo collapses browser retrieval into one local command surface

**CONFIRMED — SideBoo changelog, 2026-08-15**  
https://sideboo.dev/changelog/

SideBoo v0.0.3 added a single command palette that searches **open tabs, browsing history, bookmarks and recently closed pages** from the current page. It can restore a recently closed window, jump across windows, group/sort tabs, show hover previews, and optionally let a BYOK model reason over selected browser context. SideBoo states that tabs/history/bookmarks stay on device and AI data leaves only on a user-triggered model request.

Current product page / privacy evidence:  
https://sideboo.dev/  
https://sideboo.dev/privacy/

**Job-to-be-Done:** “I remember part of what I was working on, not whether it lives in a tab, bookmark folder, history entry or closed session.”

**Why it reduces steps:** the user does not first classify the object (“is it a bookmark or open tab?”), open the relevant sidebar, then search again. Retrieval begins with memory of the content, not storage location.

**Onboarding/distribution:** no account; extension-first; command palette opens on the page the user is already reading. Core retrieval is useful before AI configuration.

**AI/privacy pattern:** local-first index + deliberate opt-in BYOK request. AI is an enhancement to a deterministic retrieval surface rather than a prerequisite.

**Business-model signal:** current core navigation is free; paid AI/multi-device/session features are planned. This suggests retrieval/search itself is table-stakes while cloud/AI convenience is monetizable.

**Limitations:** Chrome extension permissions (`tabs`, `history`, `bookmarks`, `sessions`, etc.) are broad metadata access even if processing is local. “Local-first” reduces server exposure but does not eliminate extension compromise or model-provider disclosure on deliberate AI calls.

**Fit for `MaterialYouNewTab`:** MYNT already has a command palette, local-first storage, workspaces, launch URLs, and a newly strengthened bookmark tree. The missing opportunity is not another command palette; it is **unified retrieval across existing product objects and, only with explicit optional permissions, browser context**.

**Do not copy:** do not silently request `history/tabs/sessions` at install; do not make AI the default search path; do not duplicate bookmark/workspace data into another proprietary index without an export story; do not increase feature count when existing surfaces can be merged.

#### Candidate — Unified Local Retrieval / “Find Anything” for MYNT

**Opportunity Score: 88/100 — research list only**

- User Pain: 8/10
- Strategic Fit: 9/10
- Novelty: 7/10
- Evidence Strength: 9/10
- Reuse Potential: 7/10
- Implementation Effort controllability: 9/10
- Security/Privacy/Cost Risk controllability: 7/10

**Reason not filed:** MYNT already has a command palette and its Issues are disabled. The smallest valuable change is likely to expand the existing palette’s indexed object types and measure actual retrieval friction, not launch a new subsystem.

---

### B. Adjacent workflow — Moises Studio keeps AI inside the human-created canonical session

**CONFIRMED — launched 2026-09-02**  
https://moises.ai/newsroom/product-announcements/moises-launches-studio-collaborative-workspace/

Moises Studio is a browser-based collaborative multitrack/MIDI workspace. Its differentiating product thesis is explicitly **not** “prompt → full finished song”; AI generates or edits material in response to what the musician already played/sang/decided. Agentic Mode can perform tasks inside the session while steps remain visible and reversible. The product supports collaboration on the same timeline and exports through mixes, stems, MIDI, MusicXML and DAWproject.

**Job-to-be-Done:** get AI assistance without surrendering authorship, editability, or compatibility with the user’s existing production workflow.

**Why it reduces steps:** AI does not require exporting a fragment to a separate generator and manually re-importing the result; collaborators operate on one shared project; final work can still hand off to established tools/formats.

**Onboarding/distribution:** browser-based shared session and link collaboration lower setup friction; no requirement to abandon downstream DAWs.

**Automation/collaboration/provenance pattern:** human-created canonical state → AI candidate change → visible/reversible operation → shared session → open/industry handoff.

**Business-model/design signal:** Moises is using integration and editable assistance rather than one-shot generation as the product value. Vendor claims about audience size or output quality are not used as effect evidence.

**Limitations:** cloud-heavy collaboration raises privacy, latency and availability dependencies; DAW-level compatibility is far outside `UkePack`’s scope.

**Transferable fit:**
- `UkePack`: keep MusicXML/chord/user arrangement as authority; AI proposes practice-pack transformations, teacher approves.
- `ai-novel-workstation`: AI should patch canonical story state with reversible diffs, not regenerate the whole book.
- `ppt-studio` / `minideck`: slide/claim-level candidate edits with source identity and undo.
- `video-timeline-pipeline`: reinforces #11 evidence-backed CutSpec rather than destructive autonomous editing.

**Do not copy:** real-time DAW collaboration, cloud compute, voice-model features, or broad media generation where product JTBD does not require them.

#### Candidate — Human-first Reversible Co-creation Contract

**Opportunity Score: 84/100 — adjacent pattern, no Issue**

Reason not filed: the principle is already represented across existing revision/candidate/receipt Issues; a new cross-portfolio abstraction without a concrete unmet user workflow would be architecture-first backlog inflation.

---

### C. Emerging technology / major strategy shift — WebMCP makes the current webpage an agent tool provider

#### C1. Chrome WebMCP Imperative API

**CONFIRMED — published 2026-05-18, last updated 2026-09-01**  
https://developer.chrome.com/docs/ai/webmcp/imperative-api

Chrome documents `document.modelContext.registerTool()` with typed input schema and executable page-local handlers. Current API supports annotations including:

- `readOnlyHint`
- `untrustedContentHint`
- `consequentialHint`

It also documents cancellation, lifecycle/unregistration, cross-origin permission/origin gating, and experimental React/Angular integration. Chrome explicitly says WebMCP is under active discussion and subject to change.

Chrome DevTools/Lighthouse have also gained WebMCP inspection/audit support:  
https://developer.chrome.com/blog/new-in-devtools-149  
https://developer.chrome.com/docs/lighthouse/agentic-browsing/registered-webmcp-tools

This is important because distribution is no longer only an API spec; browser developer tooling is beginning to make agent-exposed surface area inspectable.

#### C2. OpenAI ChatGPT site tools

**CONFIRMED — rechecked 2026-09-11; help article updated in late Aug 2026**  
https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app

OpenAI states that ChatGPT’s desktop app built-in browser can discover WebMCP site tools from the current page. Site tools work with the page’s live state and signed-in session, remain page-local, and appear in activity/sources. OpenAI also warns that site tools introduce data-exfiltration and prompt-injection risks and keeps browser-task permission/safety checks.

**Important limitation:** current OpenAI site-tool support is documented for the ChatGPT desktop app’s built-in browser, **not Chrome generally**. A page tool disappears when the page is closed.

#### C3. Ecosystem/distribution signal

**CONFIRMED — WebMCP Challenge, submissions 2026-08-25 through 2026-09-03**  
https://openai.com/webmcp-challenge/

OpenAI describes WebMCP as an experimental open standard that lets sites expose structured tools directly to agents instead of forcing agents to guess through UI. Existing applications can add support. Challenge supporters include Shopify, Google Chrome, Netlify, Cloudflare, Vercel and Render.

This is not adoption proof, but it is a meaningful distribution/ecosystem signal across browser, hosting, commerce and AI-client vendors.

#### C4. Community pain / maturity signal

**COMMUNITY_SIGNAL — Reddit, 2026-06-02**  
https://www.reddit.com/r/AI_Agents/comments/1tumyd4/i_exposed_my_sites_existing_tools_to_ai_agents/

One developer reports that exposing existing handlers through WebMCP required little extra glue, but actual adoption was near zero at that time and destructive-action confirmation/security still felt immature. This is anecdotal and dated relative to current OpenAI support; it is useful as a warning against assuming ecosystem readiness from API availability.

### Job-to-be-Done

For a user already on a Reese-max web product page and already signed into whatever identity that page uses: “let my AI inspect or perform the small set of actions this product intentionally supports **without** making the AI reverse-engineer the DOM, copy data manually, or configure a separate connector when that is unnecessary.”

### Why users may experience fewer steps / higher reliability

- structured schemas reduce UI-guessing and selector fragility;
- current page/session provides natural context;
- product code can reuse the same validated handlers behind human UI controls;
- a read-only evidence tool can return canonical evidence IDs/receipts directly instead of forcing copy/paste;
- unsupported clients can fall back to the normal UI rather than breaking the product.

### Onboarding / distribution signal

This is the strongest change: **agent capability can be distributed with the webpage itself**. For some use cases, the onboarding sequence becomes `open trusted page → sign in normally if required → agent discovers allowed tools` instead of `find connector URL → configure MCP client → OAuth/keys → re-establish app context`.

### Automation / AI / integration / provenance mode

The reusable contract should be transport-neutral:

`Canonical State → Typed Tool Contract → Adapter {Web UI | MCP | WebMCP} → Policy/Identity → Result/Effect → Receipt`

For evidence products, WebMCP output should carry the same publication/evidence identity as Web/MCP. For action products, a WebMCP call should create the same candidate/request/effect object as the human UI, not an alternate mutation path.

### Pricing / business model signal

WebMCP itself is an open/experimental browser standard. The business signal is indirect: major vendors are making **agent-readiness part of the product distribution layer**, which can reduce the need to build and host bespoke chat surfaces merely to make a product “AI-enabled.”

### Risks / failure points

- browser/client support remains experimental and uneven;
- page-provided tool descriptions/results can become prompt-injection or exfiltration surfaces;
- current signed-in page context is convenient but can tempt developers to confuse session presence with action authorization;
- broad tool catalogs recreate routing/context problems;
- annotations are hints, not hard security controls;
- a tool wrapper around an unsafe existing handler only makes the unsafe handler easier to invoke.

### Reese-max absorption decision

**Absorb:** transport-neutral typed contracts; page-native read-only evidence tools; exact version/receipt parity across Web UI, MCP and WebMCP; feature detection/fallback; explicit side-effect/trust classification.

**Do not copy:** exposing every button; arbitrary URL/SQL/filesystem/shell tools; using `consequentialHint` as authorization; assuming Chrome origin-trial availability equals production ubiquity; creating a second store/index/truth only for agents.

#### High-value mapped opportunity — `taichung-police-intel #15`

**Incremental Opportunity Score: 94/100**

- User Pain: 9/10
- Strategic Fit: 10/10
- Novelty: 9/10
- Evidence Strength: 10/10
- Reuse Potential: 10/10
- Implementation Effort controllability: 9/10
- Security/Privacy/Cost Risk controllability: 8/10

**Issue decision:** same fingerprint as existing #15 (`canonical verified public evidence → bounded read-only external AI distribution`). Updated #15 rather than creating a duplicate.

**Incremental MVP:** feature-detected WebMCP canary exposing only the existing five read-only evidence verbs against a fixed publication snapshot, using the same `EvidenceEnvelope / PublicationReceipt` semantics as the web/MCP path.

**Runtime Verification Requirement:** actual supporting client/browser must discover/invoke tools; exact browser/client version, publication hash, tool-contract version and forbidden-field negative tests must be recorded. “Code registered the tool” is not runtime proof.

---

## New Releases / Market Moves

| Date | Signal | Classification | Reese-max implication |
|---|---|---|---|
| 2026-09-01 | Chrome WebMCP Imperative API latest documented update | CONFIRMED | Browser-native structured agent actions are becoming a real delivery target; keep contracts transport-neutral. |
| late Aug 2026 / rechecked 2026-09-11 | ChatGPT desktop built-in browser site tools use WebMCP | CONFIRMED | Agent-ready web pages can be consumed by a mainstream AI client without separate connector setup. |
| 2026-08-25→09-03 | OpenAI WebMCP Challenge | CONFIRMED ecosystem signal | Browser/hosting/AI vendors are actively seeding WebMCP applications; not adoption proof. |
| 2026-08-15 | SideBoo v0.0.3 unified command palette/local-first privacy | CONFIRMED | MYNT should consider merging retrieval surfaces rather than adding more navigation widgets. |
| 2026-09-02 | Moises Studio launch | CONFIRMED | Reversible, human-authored canonical sessions + AI assistance + interoperable handoff are a useful creative-product pattern. |
| current beta / rechecked 2026-09-11 | TabHelm local-first board + open export + MCP access | CONFIRMED current product surface | Open export and bounded agent verbs reduce lock-in; useful comparator for MYNT, but its cloud-sync MCP path should not be copied by default. |

---

## Community Pain Points

1. **WebMCP maturity/adoption uncertainty — COMMUNITY_SIGNAL.** A June developer report says implementation glue was easy but adoption nearly absent then; treat current official client support as progress, not proof of broad usage.
2. **Browser-state fragmentation — CONFIRMED product response, not population statistic.** SideBoo’s design treats tabs/history/bookmarks/recently-closed as one retrieval problem; this is a strong indicator that storage-location navigation itself is friction.
3. **Privacy tradeoff in unified browser retrieval — CONFIRMED capability risk.** SideBoo’s own privacy documentation shows the required power: tabs/windows/history/bookmarks/sessions metadata. Local processing reduces server exposure but optional permissions and explicit AI transmission remain necessary.
4. **Agent action surface can outgrow review/security — LIKELY.** WebMCP makes actions easier to expose, so Reese-max should bias toward narrow verbs and existing candidate/confirmation contracts rather than feature parity.

---

## Adjacent Ideas

### 1. Transport-neutral Product Tool Contract
Define one typed business operation once, then adapt it to human UI / remote MCP / WebMCP without duplicating truth or authorization. **Score 94/100; mapped into existing #15.**

### 2. Unified Local Retrieval Before More Widgets
For `MaterialYouNewTab`, combine bookmark/workspace/action retrieval under the existing command palette; only then consider optional tabs/history/sessions search. **Score 88/100; research only.**

### 3. Agent Tool Surface Budget
Every product should have an explicit “agent-visible verbs” budget. Prefer high-level task verbs over one tool per source/button/object. Measure selection errors before expanding. **Score 87/100; cross-portfolio research pattern.**

### 4. Human-first Reversible Co-creation
AI changes should remain candidate/reversible and operate on canonical human work. `UkePack`, novel, deck, timeline products already have compatible primitives. **Score 84/100; no duplicate Issue.**

### 5. Open-format Escape Hatch as Trust Feature
TabHelm’s “export forever” positioning is a useful business/product signal: local-first tools can differentiate by making exit/migration cheap. Apply where Reese-max stores durable user state, but do not build exporters for products that already use open files as truth. **Score 82/100.**

---

## Opportunity Map — All Product Repositories

Legend: `MM` MUST MATCH, `SB` SHOULD BE BETTER, `D` DIFFERENTIATOR, `A` ADJACENT IDEA, `DNC` DO NOT COPY.

| Product | MM | SB | D | A | DNC |
|---|---|---|---|---|---|
| `cf-ai-router` | reliable typed routing | lifecycle/capability evidence | fail-closed cost truth | expose read-only route diagnostics via common tool contract | vendor-model sprawl |
| `soundbox-offline` | fast local library | import/recovery | offline/private mode | OS/share ingestion where platform-stable | cloud account dependency |
| `police-exam-archive` | official source integrity | archive→practice handoff | page/version provenance | read-only agent evidence adapter | AI-generated source truth |
| `skill-foundry` | safe candidate evaluation | risk-tier test budget | behavior receipts | evaluate WebMCP/tool contracts as skills | auto-promote from model judgement |
| `prompt-autoresearch` | reproducible runs | variance/drift gates | promotion evidence | evaluate tool-description variants | benchmark-only optimization |
| `lobsterpulse` | fresh external signals | dedupe/change tracking | changed-since-last evidence | read-only signal tools | source-count vanity |
| `tick-stock-panel` | deterministic research | strategy provenance | no accidental execution | page-local read-only screener tools | brokerage automation by default |
| `clinical-scribe-worker` | reviewable note state | minimal repair | exact revision receipts | page tools only after auth boundary | ambient write autonomy |
| `adng-memory` | provenance/admission | retrieval-time defense | memory ≠ authorization | tool-output origin lineage | auto-trust recalled text |
| `avatar-vfo` | continuity | regression harness | structured persona truth | reversible scene/state tools | opaque auto-memory |
| `note-filler` | evidence-linked patches | stale handling | candidate-first update | transport-neutral review tool | silent overwrite |
| `taiwan-intel-dashboard` | canonical public evidence | source-health UX | provenance/freshness | same EvidenceEnvelope via WebMCP | second AI summary truth |
| `cyber-prep-coach` | correct corpus | calibrated explanations | mastery+source receipts | read-only evidence lookup tools | tutor feature sprawl |
| `UkePack` | editable teacher artifacts | differentiated practice flow | teacher-approved MusicXML truth | human-first reversible AI | cloud DAW scope |
| `autodev-ng` | bounded execution | runtime evidence | planned/actual effect receipts | consume typed site tools under #12 policy | UI-guessing as primary integration |
| `ai-novel-workstation` | canonical story state | continuity/resume | local-first revision truth | visible reversible agent edits | one-shot novel regeneration |
| `herdr-skills` | correction evidence | candidate clustering | rule ≠ permission | inspect agent-tool failures as signals | auto-edit policy from one session |
| `video-timeline-pipeline` | timestamp/source identity | NLE handoff | evidence-backed CutSpec | visible/reversible agent operations | destructive autonomous edit |
| `chatgpt-dual-pipeline` | deterministic publish | source isolation | de-identified one-way mirror | none until canonical ownership clear | dual editorial truth |
| `claude-mem` | useful recall | poisoning/staleness defense | origin-preserving memory | surface memory diagnostics read-only | memory-based action authorization |
| `lplrs-judicial-sync` | exact JID/revision | removal lifecycle | AuthorityReceipt/SourceSpan | read-only page evidence tools | legal-status inference from existence |
| `internship-notes-sites-mirror` | reproducible mirror | freshness | one-way ownership | none | agent mutation of mirror |
| `MaterialYouNewTab` | fast local dashboard | command palette retrieval | Traditional-Chinese/local-first workspace | unified tabs/history/bookmark/session retrieval with opt-in permissions | more widgets / install-time broad permissions |
| `taichung-police-intel` | trusted public brief | AI-ready distribution | evidence/source-health contract | **WebMCP adapter to #15** | arbitrary tools / second truth |
| `ninax-line-hermes` | exact message identity | redelivery/edit handling | external-channel receipts | common effect contract | channel action = truth |
| `voice-actress` | criterion evidence | rubric revision identity | police/legal focus | read-only source lookup | generic LMS expansion |
| `project-doctor-web` | structured teaching | red-flag determinism | CaseSpec/debrief receipts | bounded read-only teaching tools | consequential clinical actions |
| `92-duty-scheduler` | canonical schedule revision | request lifecycle | policy+receipt | future WebMCP/UI adapter after identity gate | chat command directly mutates roster |
| `flux-image-gen` | reproducible generation | provenance/cost | source/output receipts | candidate edit tools | unverifiable provenance claims |
| `neciken-summer-poem` | contest source truth | candidate isolation | frozen submission revision | reversible writing assistance | autonomous final submission |
| `minideck` | editable deck | revision/rollback | project isolation | typed slide-level candidate edits | one-shot replace-all generation |
| `ppt-studio` | editable PPT | claim/source provenance | local evidence-backed authoring | reversible in-context AI | non-editable final-only output |
| `police-exam-practice` | official answers | adaptive review | provenance to archive | source lookup adapter | synthetic answers as authority |
| `exam-archive` | source/version integrity | archive→practice | reusable canonical corpus | evidence adapter | duplicate scraping pipelines |
| `cf-mcp-server` | narrow typed tools | auth/effect separation | reusable governed MCP infra | bridge common contract to WebMCP where page-local UX wins | one tool per endpoint |

---

## Top 10 Cross-Portfolio Ideas

| Rank | Idea | Score | Decision |
|---:|---|---:|---|
| 1 | Transport-neutral typed product contract: Web UI / MCP / WebMCP share canonical handler semantics | 94 | **Update existing `taichung-police-intel #15`**; reusable reference pattern |
| 2 | Page-native read-only Evidence WebMCP for public-data products | 94 | Same #15 fingerprint; canary only |
| 3 | Existing auth/policy remains authoritative regardless of agent transport | 93 | Portfolio invariant; no standalone Issue |
| 4 | Unified local retrieval across user object types instead of more widgets | 88 | MYNT research list |
| 5 | Agent-visible tool-surface budget + task-level verbs | 87 | Research/eval metric; reuse in MCP/WebMCP products |
| 6 | Tool invocation receipt carries transport + contract version + canonical state hash | 87 | Fold into existing receipt architectures |
| 7 | Human-first reversible co-creation on canonical state | 84 | Reinforces UkePack/novel/deck/video existing direction |
| 8 | Open-format export/escape hatch as local-first trust feature | 82 | Apply selectively where durable proprietary state exists |
| 9 | Feature-detect experimental agent surfaces with zero-loss normal-UI fallback | 82 | Required for WebMCP canaries |
| 10 | Keep read and consequential mutation as distinct product contracts, not one “agent access” switch | 90 | Cross-portfolio safety invariant |

---

## Ideas Rejected / Deferred

1. **Create a new “WebMCP platform” repository — REJECTED.** Premature abstraction; current value is proving one existing typed evidence contract through a second adapter.
2. **Create a second Issue beside `taichung-police-intel #15` — REJECTED.** Duplicate fingerprint. The existing Issue already owns read-only external AI distribution of canonical public evidence.
3. **Turn every web-app button into a WebMCP tool — REJECTED.** Tool sprawl, policy ambiguity, and larger attack surface outweigh superficial parity.
4. **Use WebMCP annotations as security enforcement — REJECTED.** They are client-facing semantic hints, not replacement for server-side authorization/runtime boundaries.
5. **Add tabs/history/session permissions to MYNT by default — REJECTED.** SideBoo’s feature works because it accepts broad browser metadata permissions; MYNT should preserve optional/minimal permission posture.
6. **Copy TabHelm’s cloud-sync MCP dependency — REJECTED.** MYNT’s local-first value would be weakened merely to make agent access easier.
7. **Turn UkePack into a collaborative browser DAW — REJECTED.** Moises is an adjacent workflow pattern, not the same JTBD.
8. **Create a generic “reversible AI edits” Issue — REJECTED.** Already represented in several product-specific candidate/revision/receipt Issues.
9. **Claim WebMCP broadly adopted — REJECTED.** Official support is meaningful but experimental; current adoption level remains UNKNOWN.
10. **Replace remote MCP with WebMCP — REJECTED.** They solve overlapping but not identical distribution cases. Keep the core contract transport-neutral.

---

## Issue Mapping / Coordination

### Updated this round

**`Reese-max/taichung-police-intel #15`**  
`[Competitive Inspiration][RESEARCH_REQUIRED][DISTRIBUTION] 建立 read-only Evidence MCP，讓外部 AI 直接查詢 canonical public intelligence`

- Existing issue comments were empty before this update; no competing `github-issue-lock:v1` claim was present.
- Repository code search found no `github-issue-lock:v1` marker.
- Repo-scoped and owner-scoped Issue/PR search found no `WebMCP` duplicate.
- Added a 2026-09-11 external-radar comment with official Chrome/OpenAI sources, transport-neutral design, non-copy constraints, incremental MVP/Acceptance Criteria and Runtime Verification Requirement.
- GitHub comment ID: `5624711515`.

### No new Issue

- `MaterialYouNewTab`: unified local retrieval is valuable but not high-confidence enough to justify a separate backlog item, and repository Issues are disabled.
- `UkePack` / creative products: Moises signal reinforces existing candidate/revision/handoff principles; no unique unmet fingerprint.
- `cf-mcp-server`: WebMCP is complementary delivery, not a reason to duplicate server infrastructure.
- `autodev-ng`: WebMCP consumers must remain under existing #12 effect/egress policy rather than spawning a separate security model.

---

## Sources

### First-party / official

1. Chrome for Developers — **WebMCP Imperative API**, published 2026-05-18, updated 2026-09-01  
   https://developer.chrome.com/docs/ai/webmcp/imperative-api
2. Chrome for Developers — **What’s new in DevTools 149**, 2026-06-02  
   https://developer.chrome.com/blog/new-in-devtools-149
3. Chrome for Developers — **Registered WebMCP tools / Lighthouse**, updated 2026-07-01  
   https://developer.chrome.com/docs/lighthouse/agentic-browsing/registered-webmcp-tools
4. OpenAI Help — **Using site tools in the ChatGPT desktop app**, rechecked 2026-09-11  
   https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app
5. OpenAI — **WebMCP Challenge**, submissions 2026-08-25→2026-09-03, rechecked 2026-09-11  
   https://openai.com/webmcp-challenge/
6. SideBoo — **Changelog v0.0.3**, 2026-08-15  
   https://sideboo.dev/changelog/
7. SideBoo — current product page, rechecked 2026-09-11  
   https://sideboo.dev/
8. SideBoo — privacy/permission disclosure, rechecked 2026-09-11  
   https://sideboo.dev/privacy/
9. TabHelm — current beta product/pricing/export surface, rechecked 2026-09-11  
   https://tabhelm.com/
10. TabHelm — MCP connection/tool surface, rechecked 2026-09-11  
    https://tabhelm.com/mcp/
11. Moises — **Moises Studio launch**, announced 2026-09-01 / launch stated 2026-09-02  
    https://moises.ai/newsroom/product-announcements/moises-launches-studio-collaborative-workspace/

### Community / anecdotal

12. Reddit r/AI_Agents — individual developer report on WebMCP implementation/adoption/security uncertainty, 2026-06-02  
    https://www.reddit.com/r/AI_Agents/comments/1tumyd4/i_exposed_my_sites_existing_tools_to_ai_agents/  
    **Classification: COMMUNITY_SIGNAL only.**

---

## What Changed Since Last Radar

Previous `2026-09-11-external-radar.md` centered on Meta Muse’s independent effect/credential boundary (mapped into `autodev-ng #12`), Mastra Factory’s review/WIP backpressure lesson, trace-level evaluation, and evidence-linked grading.

This r2 adds a different portfolio-level shift:

1. **WebMCP moved from watch-list browser API to a credible product distribution channel** because the Chrome API was updated on 2026-09-01, Chrome tooling can inspect it, and ChatGPT’s desktop built-in browser can consume site tools now.
2. **`taichung-police-intel #15` is refined from “remote Evidence MCP” to a transport-neutral Evidence Distribution Contract.** Remote MCP remains valid; WebMCP becomes a page-native optional adapter.
3. **The strongest new product simplification idea is merge, not add:** SideBoo suggests expanding MYNT’s existing command palette across existing object types before adding more dashboards/widgets.
4. **Creative AI signal shifted toward in-context reversible assistance:** Moises Studio reinforces keeping human-created canonical state and interoperable exports rather than one-shot generation.
5. No product code or settings were modified; one existing research Issue was augmented and this immutable round report was added.

---

## Round Conclusion

This round’s portfolio-level principle is:

> **AI-ready should be a delivery adapter over the product’s existing truth and permissions, not a second application state.**

The safest reusable shape is:

`Canonical State → Typed Contract → {Human UI | MCP | WebMCP} → Same Policy/Identity → Same Candidate/Read Semantics → Same Canonical Result → Receipt`

When the client/browser does not support the new adapter, the normal product must continue to work unchanged. When the adapter is supported, it should eliminate manual copy/paste and UI-guessing without gaining any authority the human-facing product does not already grant.