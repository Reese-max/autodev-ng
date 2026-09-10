# External Competitive / Product / Workflow Inspiration Radar — 2026-09-10 r8

> Scope: Reese-max owned, unarchived repositories that are product-like. Primary market evidence in this round comes from the public web; GitHub is used for portfolio mapping, current-state evidence, duplicate/fingerprint checks, and issue coordination.
>
> Evidence labels: **CONFIRMED** = first-party product/documentation or directly inspectable repository state; **LIKELY** = reasonable product inference not yet runtime-verified; **COMMUNITY_SIGNAL** = anecdotal user report only; **UNKNOWN** = insufficient evidence / must be measured.

## Executive Summary

This round found one high-value, non-duplicate product opportunity worth formalizing:

- **Reese-max/clinical-scribe-worker #7** — `[Competitive Inspiration][Research][RESEARCH_REQUIRED][WORKFLOW] 建立 Section-scoped Repair + Note Revision Receipt，保留已審核編修並可回復`
- Opportunity Score: **92/100**
- Core pattern: `Canonical Note Revision → Select Section → Frozen Source Evidence → CandidateSectionRevision → Diff / Validation → Accept or Reject → Canonical Note Revision → RevisionReceipt`
- Why now: Nabla added **single-section regeneration on 2026-08-24**, explicitly preserving already-reviewed/manual edits and supporting Undo. Dragon Copilot already treats AI/manual edits as note versions with compare/restore, while its own documentation exposes an important failure mode: adding another recording can regenerate from the combined transcript without prior edits/style updates. This makes *repair scope + revision identity + preservation of reviewed work* a real competitive workflow, not merely an editor nicety.
- Safety constraint: current `clinical-scribe-worker #6` remains a P0 blocker because Cloudflare Access JWT assertions are not yet cryptographically verified. #7 is therefore **research-only / synthetic-first / no-PHI** until that authorization boundary is fixed and runtime-tested.

No other new Issue was created. Several signals map cleanly to existing Issues, or have weaker evidence/fit and remain research-list items.

---

## Product → Market Category Mapping

| Repository | Product / Market category | Current product signal used this round |
|---|---|---|
| `cf-ai-router` | Multi-provider AI gateway / routing | Stable aliases, cost/fallback/capability routing; existing lifecycle work already covers provider churn. |
| `soundbox-offline` | Local-first offline audio PWA | Local library/import/playback/backup; inbound sharing remains an opportunity but overlaps current LAN import work. |
| `police-exam-archive` | Police exam archive / source corpus | Authority/version integrity and archive-to-practice handoff are the market lens. |
| `skill-foundry` | Agent skill evaluation / promotion | Candidate-vs-active, risk-tier evaluation and behavior receipts are the core product shape. |
| `prompt-autoresearch` | Prompt / model experiment research | Reproducible eval, held-out evidence, cost and behavior migration. |
| `lobsterpulse` | Tech / product-signal intelligence radar | Freshness, source/date, dedupe and changed-since-last are the defensible layer. |
| `tick-stock-panel` | Self-hosted quantitative research workstation | Screening, monitoring, OOS/backtest, factor mining; explicitly no broker order execution. |
| `clinical-scribe-worker` | Clinical drafting / scribe research worker | Structured SOAP, source/safety validation, authentication/quota boundaries; repair/revision is the new gap. |
| `adng-memory` | Agent memory governance | Origin, activation, quarantine, staleness, deletion and memory-poisoning defense. |
| `avatar-vfo` | Persona / character simulation | Persona continuity, structured state, multi-model behavior stability. |
| `note-filler` | Source-backed legal/admin/exam note augmentation | Original immutable, unsourced content excluded; claim review and evidence decisions already tracked. |
| `taiwan-intel-dashboard` | Public-source Taiwan intelligence dashboard | Canonical source truth/freshness first; distribution should not outrun truth-state repair. |
| `cyber-prep-coach` | iPAS cybersecurity exam preparation | Verified question bank, local progress, official-spec honesty, mastery and SME calibration. |
| `UkePack` | Music education / ukulele worksheet generator | MusicXML/manual chords → simplified teacher-reviewed practice pack. |
| `autodev-ng` | Multi-engine software-development orchestration | Runtime effects, policy/containment, resumability and evidence receipts. |
| `ai-novel-workstation` | Local-first AI fiction production workstation | Canonical story state, production loop, context/cost gates and long-running resumability. |
| `herdr-skills` | Reflective coding-agent skill/rule system | Corrections → candidate improvements → validation/promotion. |
| `video-timeline-pipeline` | Evidence-backed video understanding / editing handoff | Timeline evidence → CutSpec/NLE handoff; no destructive autonomous editing. |
| `chatgpt-dual-pipeline` | De-identified internship-notes publishing site | Historical slug only; current product is `internship-notes`, with one-way canonical notes → generated site/mirror. |
| `claude-mem` | Coding-agent memory | Session memory capture/recall; trust, provenance and authority separation are the key competitive dimensions. |
| `lplrs-judicial-sync` | Taiwan judicial corpus synchronization | Exact authority revision, removal lifecycle, downstream evidence locators. |
| `internship-notes-sites-mirror` | Downstream static mirror | Reproducible one-way mirror; not a second editorial source. |
| `MaterialYouNewTab` | Browser new-tab / workspace dashboard | Local workspace, session capture/preview/restore opportunity already identified. |
| `taichung-police-intel` | Public-source local-government / police intelligence | Official-first public evidence and read-only distribution surfaces. |
| `ninax-line-hermes` | LINE-based AI assistant / workflow adapter | Messaging channel should be an adapter into typed requests, not an authority by itself. |
| `voice-actress` | Police-exam essay practice platform; TTS is maintenance line | Main `/shenlun` product is AI model answer/grading, SRS, mock exams and subscription quotas. |
| `project-doctor-web` | Clinical interview / rolling SOAP teaching app | Medical research/teaching workflow with structured-output and deterministic red-flag guards. |
| `92-duty-scheduler` | Duty scheduling / roster operations | Canonical schedule/policy/identity; post-publication change-request lifecycle already filed as #22. |
| `flux-image-gen` | Image generation workflow | Model/source provenance, cost and output receipts; capture-side provenance already under research. |
| `neciken-summer-poem` | Chinese literary contest / creative production workstation | Contest-rule evidence, candidate isolation, blind selection/freeze, long-form continuation. |
| `minideck` | Cloudflare-hosted AI HTML presentation generator | Generate/revise/version/share with project-token isolation and rollback semantics. |
| `ppt-studio` | Local presentation authoring / AI deck workstation | Editable deck, imports and existing slide/claim provenance issue. |
| `police-exam-practice` | Police exam practice | Correct official corpus + adaptive review are the natural category. |
| `exam-archive` | General exam archive | Provenance/version integrity and archive→practice handoff. |
| `cf-mcp-server` | Cloudflare-hosted MCP infrastructure | Narrow tool surface, auth/effect boundaries and task-level verbs matter more than raw tool count. |

---

## External Signals

### A. Direct competitor: clinical-note repair becomes a first-class workflow

**CONFIRMED — Nabla, 2026-08-24**  
Source: https://help.nabla.com/en/articles/10364226

Nabla now lets a clinician regenerate **one note section**, keeps everything already reviewed or manually edited elsewhere unchanged, reprocesses the original transcript for that section, and provides Undo.

**CONFIRMED — Microsoft Dragon Copilot, current 2026 documentation**  
Source: https://support.microsoft.com/en-us/dragon-copilot/physicians/current/note-versions

Dragon Copilot creates new note versions after ambient recordings or AI prompts/templates, exposes AI-generated/manual-edited versions in Version History, supports split-view comparison and restore, and warns that additional recordings regenerate from the combined transcript without prior section edits/style updates.

**JTBD:** repair the one part that missed the mark without throwing away already-reviewed work.  
**Why it saves time/steps:** whole-note regeneration forces the user to re-review unaffected sections and can require manual copy/paste of prior edits. Section-scoped candidate repair reduces the review blast radius.  
**Onboarding/distribution:** the capability sits inside the note review surface; no separate export/reimport tool is required.  
**Automation/AI/provenance pattern:** regeneration should be a *candidate patch based on a frozen transcript revision*, not immediate canonical overwrite.  
**Pricing/business-model signal:** Freed currently includes core AI note generation/editing at Starter ($39/mo), adds an AI note-editing assistant at Core ($79/mo), and reserves deeper EHR/context workflows for Premier ($119/mo). Editing continuity is being packaged as core workflow value, not only a post-generation accessory. Source: https://help.getfreed.ai/en/articles/9242518-freed-pricing-discounts-and-referral-program  
**Failure/complaint signal:** Dragon’s own documentation proves that new recording input can invalidate or bypass prior manual edits. Community discussions also describe omissions, hallucinated findings, style mismatch and proofreading burden, but those are **COMMUNITY_SIGNAL** only, not incidence statistics.  
**Absorb:** minimal repair scope, before/after diff, exact input/model/prompt/parser fingerprint, explicit Accept/Reject, undo-as-new-revision, manual-edit preservation.  
**Do not copy:** automatic EHR finalization, destructive replacement, or indefinite PHI/audio history just to support Undo.

### Independent evidence that repair should be a normal product state

**CONFIRMED (research) — 2026-08-31 preprint**  
Source: https://arxiv.org/abs/2608.31017

`One note in three: a verified census of three deployed AI scribes, and the instrument that counted it` tests three commercial scribes on the same 142 consultations / 565 generated notes and reports 31.3% of notes with at least one finding under its selected review instrument. The authors explicitly show that results vary dramatically with the review instruction/model and warn that the rate depends on the instrument and corpus.

Transferable product signal: treat omission/misattribution/incorrect note content as a **repairable lifecycle state**, but **do not** present 31.3% as a general market error rate or as a prediction for Reese-max.

### B. Adjacent workflow: evidence tools move review/approval into the user’s existing workspace

**CONFIRMED — Beaver (current product)**  
Source: https://www.beaverapp.ai/

Beaver lives inside Zotero, supports library-grounded answers, sentence-level citations, batch jobs with user approval + receipts, and note edits that require approval and can be undone.

**JTBD:** research users want to inspect/modify a trusted corpus without moving documents between research tool, AI chat and note editor.  
**Why it saves time:** in-context page awareness and batch approval remove repeated searching, exporting and copy/paste.  
**Distribution/onboarding:** side-panel placement inside Zotero means the product enters an existing workflow rather than asking the user to migrate libraries.  
**Capability pattern:** `candidate mutation → explicit approval → receipt → reversible change`.  
**Pricing signal:** core features are available across plans, with BYO API-key and paid hosted options; configuration burden itself is a packaging variable.  
**Failure risk:** approval UX can become noisy at scale; citations demonstrate traceability, not correctness.  
**Absorb:** reinforces `note-filler #3` and the new `clinical-scribe-worker #7`.  
**Do not copy:** another generic knowledge-base chat surface or a new cloud corpus for products that already have canonical local/source-controlled data.

### C. Emerging product/technology: AI research moves from repeated search to traversable evidence graphs and executable notebooks

**CONFIRMED — Scite, 2026-09-09**  
Source: https://scite.ai/blog/citation-surfing-scite-mcp

Scite added a `citation_graph` MCP tool so agents can traverse references backward/forward, inspect shared references/co-citation relationships, and combine those graph edges with Smart Citation context. This changes the agent workflow from repeated keyword search to `seed evidence → traverse relationships → inspect full text → continue`.

**CONFIRMED — Scite, 2026-09-01**  
Source: https://scite.ai/blog/august-2026-release-notes

Scite also reduced connector setup to one-click activation for ChatGPT/Claude and exposes MCP usage allowance in the AI tool. This is a distribution/onboarding signal: users increasingly expect evidence services to meet them in their existing AI client.

**CONFIRMED — Gemini Notebook, 2026-07-16 / 2026-08-28**  
Sources:
- https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/
- https://blog.google/innovation-and-ai/products/gemini-notebook/new-flexible-usage-limits/

Gemini Notebook added a secure cloud computer for source-grounded code execution and later compute-specific usage controls that expose/shape the resource envelope.

**JTBD:** move from “find documents and summarize” to “trace relationships, compute against evidence, continue the investigation.”  
**Why it saves steps:** graph traversal and embedded compute avoid serial hopping between search, spreadsheet/notebook and AI assistant.  
**Onboarding/distribution:** one-click AI connector plus integrated compute makes the capability available at the point of work.  
**Capability pattern:** evidence graph + scoped compute + explicit resource envelope.  
**Pricing/business signal:** credits/compute limits are visible where users work; resource transparency becomes UX.  
**Limit/failure:** graph edges show citation relationships, not whether a downstream claim is legally/scientifically correct; cloud compute also expands data/effect boundaries.  
**Absorb:** one-click read-only distribution for existing evidence products; relationship traversal only where a canonical edge model exists.  
**Do not copy:** generic cloud-computer execution in legal/police/public-intelligence products without a hard capability/egress boundary.

### Simplification opportunity: OS-native share target for `soundbox-offline`

**CONFIRMED — MDN, page updated 2026-08-27**  
Source: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target

Installed PWAs can register as OS share targets and receive shared text/URLs/files. Binary files use POST/multipart, and a Service Worker can intercept the request for an offline-friendly workflow. MDN explicitly marks the feature **Limited availability / Experimental** and advises validating incoming data.

For `soundbox-offline`, this suggests a small adjacent workflow: **Share audio from Files / another app → Soundbox candidate import → preview/dedupe → local library**, instead of file picker → navigate → reselect. However, browser/platform coverage is incomplete, so this remains a research-list idea rather than a high-confidence cross-platform feature Issue. It also overlaps the existing LAN/QR import direction and should not become a second import architecture.

---

## New Releases / Recent Product Moves

| Date | Product | Signal | Evidence |
|---|---|---|---|
| 2026-09-09 | Scite MCP | New `citation_graph` tool; citation traversal becomes an agent primitive | **CONFIRMED** |
| 2026-09-01 | Scite | One-click ChatGPT/Claude activation + visible MCP allowance | **CONFIRMED** |
| 2026-08-31 | Independent scribe study | Instrumented, reproducible AI-scribe error census; strong methodology caveats | **CONFIRMED (research)** |
| 2026-08-28 | Gemini Notebook | Flexible compute-specific usage limits and in-product budget visibility | **CONFIRMED** |
| 2026-08-27 | MDN Web Share Target | Updated platform/security guidance for installed-PWA inbound share | **CONFIRMED** |
| 2026-08-24 | Nabla | Single-section regeneration + preserve reviewed edits + Undo | **CONFIRMED** |
| 2026-07-31 | TrendSpider | Rebuilt Group Strategy Tester; guided first-use and easier result→watchlist handoff | **CONFIRMED** |
| 2026-07-16 | Gemini Notebook | Secure cloud computer + notebook execution/sync expansion | **CONFIRMED** |

TrendSpider source: https://trendspider.com/blog/july-2026-changelog/

---

## Community Pain Points

These are anecdotal signals only and are **not** treated as statistical evidence.

1. **COMMUNITY_SIGNAL — AI scribe proofreading burden / hallucinated or missing details.** Recent clinician discussions mention invented examination findings, missing details and formatting/bloat that can erase the expected time savings. These posts establish a repair/review pain shape, not a population failure rate.
   - https://www.reddit.com/r/doctorsUK/comments/1vy1b5y/what_you_hate_about_ai_scribe_apps/ — 2026-08-25
   - https://www.reddit.com/r/Residency/comments/1vzukc4/abridge_ai_scribe_tool/ — 2026-08-27
   - https://www.reddit.com/r/medicine/comments/1u24dul/please_please_proofread_your_ai_notes/ — 2026-06-10
2. **UNKNOWN — exact clinician time saved by section-scoped repair.** Vendor UX strongly implies reduced rework, but Reese-max needs a synthetic replay + later clinician usability study before claiming time savings.
3. **UNKNOWN — whether OS Share Target materially increases Soundbox import success on the target device mix.** Platform support is incomplete; measure installation/share availability and fallback behavior before productizing.

---

## Adjacent Ideas

- **CandidatePatch as a cross-portfolio primitive:** clinical section regeneration, `note-filler` claim edits, slide changes, video CutSpec and scheduling changes all benefit from `candidate → diff → validation → explicit promotion → receipt` rather than direct mutation.
- **Preserve reviewed work:** when a change is local, the system should keep unaffected reviewed state hash-stable. This is stronger than generic version history because it reduces the re-review surface.
- **In-context distribution:** Scite/Beaver reinforce that evidence products gain utility when they can be activated inside the AI/research client where users already work. Reuse existing read-only MCP work instead of building separate chat frontends.
- **Relationship traversal, not only semantic search:** citation-graph traversal suggests a general pattern for judicial precedents, public-intelligence entities/events and source lineage—only where authoritative edge semantics can be defined.
- **Resource envelope as UX:** Gemini Notebook and Scite both expose usage/compute constraints where the task runs; this aligns with `ai-novel-workstation #4` cost envelope and `cf-ai-router` quota/lifecycle receipts.
- **OS-native ingress:** Web Share Target can remove manual file-selection steps for local PWAs, but should remain optional/platform-gated.
- **Guided first-run for complex analysis:** TrendSpider’s Group Strategy Tester now walks first-time users through setup rather than dropping them in a blank configuration. This is transferable to `tick-stock-panel` without changing its no-trading boundary.

---

## Opportunity Scores

Scores are heuristic prioritization, not measured ROI.

| Candidate | User Pain | Strategic Fit | Novelty | Evidence | Reuse | Effort | Security/Privacy/Cost risk | Score / Disposition |
|---|---:|---:|---:|---:|---:|---:|---|---|
| `clinical-scribe-worker`: section-scoped repair + revision receipt | 9 | 9 | 7 | 10 | 8 | 6 | High; synthetic/research-only until #6 fixed | **92 — CREATE #7** |
| `soundbox-offline`: OS Share Target candidate import | 8 | 9 | 6 | 8 | 6 | 4 | Medium; platform/browser fragmentation | **84 — research list** |
| Evidence products: one-click MCP activation / distribution | 8 | 9 | 6 | 10 | 9 | 5 | Medium; auth/scope dependent | **84 — map to existing taichung #15 / lplrs #3** |
| `tick-stock-panel`: guided multi-variant strategy lab | 7 | 8 | 5 | 8 | 5 | 6 | Medium; overfitting / false confidence | **77 — research list** |
| `cyber-prep-coach`: target-date diagnostic/readiness planning | 8 | 9 | 5 | 8 | 6 | 5 | Medium; fake precision risk | **duplicate of #4 mastery — no new issue** |
| `note-filler`: in-place batch approval/undo inspired by Beaver | 8 | 9 | 5 | 8 | 8 | 5 | Medium; evidence correctness | **duplicate/reinforces #3 — no new issue** |

---

## Opportunity Map — All Product Repositories

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| `cf-ai-router` | capability/cost/fallback correctness | lifecycle + canary compatibility before sunset | legal/free routing with receipts | visible resource envelope | silent paid-model substitution |
| `soundbox-offline` | durable local import/play/backup | lower-friction inbound capture | no-cloud personal audio library | OS Share Target candidate import | cloud account/DRM streaming stack |
| `police-exam-archive` | exact source/version | archive→practice handoff | Taiwan police-exam provenance | source-change watcher | AI text presented as official source |
| `skill-foundry` | isolated evaluation/promotion | risk-tier evaluation budget | behavior receipts | marketplace import review | auto-install unreviewed skills |
| `prompt-autoresearch` | reproducible held-out eval | cost/behavior migration gates | versioned experiment receipt | eval graph across model generations | same-model self-judge as sole evidence |
| `lobsterpulse` | freshness/source/date/dedupe | changed-since-last | cross-source actionable signal | one-click evidence export | trend spam with weak provenance |
| `tick-stock-panel` | point-in-time + fee/slippage + OOS | robustness/variant comparison UX | no-order self-hosted research workstation | guided Group Strategy Tester style onboarding | broker auto-order / “AI 必漲” |
| `clinical-scribe-worker` | source fidelity/safety/auth | **section repair + revision receipt** | traceable candidate-to-canonical note lifecycle | clinician review surface | autonomous finalize/treatment/EHR write |
| `adng-memory` | origin/lifecycle/deletion | poisoning + retrieval-time defense | memory ≠ authority | governed shared memory | untrusted memory promoted to permission |
| `avatar-vfo` | persona continuity | long-horizon replay/ablation | interpretable state + behavior receipt | shared lore/structured memory | unvalidated psychology claims |
| `note-filler` | immutable original; no-source-no-body | claim review/staleness/accepted-only export | evidence overlay with decision history | Zotero-style batch approval | automatic unsourced legal rewriting |
| `taiwan-intel-dashboard` | source/freshness truth | repair operating-state truth first | source-aware public intel | read-only evidence distribution later | distribution expansion while truth is unreliable |
| `cyber-prep-coach` | official blueprint/provenance/scoring honesty | mastery + independent explanation calibration | local-first verified corpus | target-date plan on top of #4 | fake pass probability / another generic AI tutor |
| `UkePack` | MusicXML→usable teacher-reviewed PDF | teacher onboarding/feedback loop | child-level musical simplification | mobile share/import | auto-publish copyrighted/unreviewed packs |
| `autodev-ng` | permission/effect/resume correctness | exact runtime containment coverage | cross-engine receipts | visual orchestration artifact | “firewall on” without process-origin proof |
| `ai-novel-workstation` | canonical story/production state | context routing + cost envelope | local resumable production loop | behavior migration checks | model-of-the-week feature churn |
| `herdr-skills` | candidate ≠ policy | correction clustering + independent validation | learned rules with capability boundary | cross-project rule portability | auto-edit policy from one correction |
| `video-timeline-pipeline` | source timestamp/hash truth | evidence→CutSpec/NLE handoff | verifiable paper cut | candidate edit diffs | destructive auto-edit / false frame accuracy |
| `chatgpt-dual-pipeline` | canonical notes→generated site | source/link/public-content validation | stable identity map despite legacy slug | search/navigation improvements | re-expanding obsolete “dual pipeline” scope |
| `claude-mem` | origin/scope/deletion | admission/quarantine | observable memory lineage | correction→candidate rule extraction | memory as command/authorization |
| `lplrs-judicial-sync` | exact revision/removal | AuthorityReceipt/SourceSpan | lifecycle-safe judicial corpus | citation/authority graph research | infer “good law” from hash/version |
| `internship-notes-sites-mirror` | one-way reproducible sync | mirror drift detection | disposable rebuildable downstream | offline/static export | edit mirror as canonical source |
| `MaterialYouNewTab` | fast local dashboard | session capture/preview/restore | local Material-You workspace | browser snapshot diff | silent browsing surveillance |
| `taichung-police-intel` | official-first public source state | exact evidence distribution | canonical public Evidence MCP | one-click connector activation | internal/private operational data |
| `ninax-line-hermes` | verified identity/effect boundary | durable typed request/receipt | thin mobile messaging adapter | approval inbox | direct chat text as mutation authority |
| `voice-actress` | grading truth/quota/persistence | explainable/calibrated scoring | police-exam-specific essay practice | mastery/criteria feedback | expanding legacy TTS at expense of main product; mock score presented as real |
| `project-doctor-web` | structured-output/red-flag safety | preserve valid rolling SOAP state | deterministic safety + teaching workflow | **section-scoped repair research after clinical-scribe validation** | medical autonomy / unsupported treatment |
| `92-duty-scheduler` | canonical schedule/policy/identity | request lifecycle (#22) | auditable schedule mutation | thin LINE self-service | chat as schedule truth |
| `flux-image-gen` | model/source/cost provenance | capture-side source evidence | generation receipt | C2PA/provider credentials | provenance = truth claim |
| `neciken-summer-poem` | contest rule/source correctness | candidate isolation/compare/freeze | evidence-aware literary submission workstation | portfolio-wide revision receipt | self-evolution bypassing contest/AI policy |
| `minideck` | editable/shareable versioned deck | revision diff/provenance | project-token isolated HTML deck lifecycle | claim/source receipt | public exposure of historical drafts/tokens |
| `ppt-studio` | editable/exportable deck | claim provenance (#3) | evidence-backed presentation | spreadsheet/office handoff | unverified source text converted to polished “fact” |
| `police-exam-practice` | correct official Q/A | adaptive review | exam-specific local practice | explainable mastery | fabricated official questions/scores |
| `exam-archive` | provenance/version integrity | archive→practice pipeline | reproducible corpus | source change monitoring | scraping without source/right state |
| `cf-mcp-server` | auth/tool/effect boundaries | task-level curated tools | narrow MCP primitives | graph traversal tools where semantics exist | huge write-capable tool surface by default |

---

## Top 10 Cross-Portfolio Ideas

1. **Candidate Patch Contract** — every AI-generated mutation starts as a candidate, not canonical truth.
2. **Minimal Repair Scope** — when only one section/object changed, keep unrelated reviewed state hash-stable.
3. **RevisionReceipt** — parent revision + exact source/model/prompt/parser/policy fingerprints + diff + approval.
4. **Stale-on-Drift** — source/model/prompt/policy changes invalidate old candidate approvals rather than silently rebasing.
5. **In-context Distribution** — expose existing evidence products in the tools users already inhabit; avoid separate generic chat UIs.
6. **Traversable Evidence Graphs** — add relationship traversal only when edge semantics are canonical and auditable.
7. **OS-native Explicit Capture** — receive user-initiated share/import state without continuous monitoring.
8. **Resource Envelope UX** — surface credits/compute/provider uncertainty before or during long-running work.
9. **Guided Complex First Run** — complex research/backtest tools should start from a bounded scenario, not a blank configuration matrix.
10. **DELETE/MERGE before ADD** — consolidate duplicate workflows around one canonical state machine before adding another mode or integration.

---

## Ideas Rejected / Deferred

1. **New `cyber-prep-coach` readiness / deadline planner Issue — REJECT as duplicate.** Existing #4 already owns local `MasteryProfile`, explainable next-best task, confidence/sample sufficiency and coverage gaps. A target-date layer can be evaluated inside that work after #6 independent explanation calibration.
2. **New `note-filler` approval/undo Issue from Beaver — REJECT as duplicate.** Existing #3 already owns claim-level Accept/Reject/Needs-Evidence/Edit, staleness and accepted-only export.
3. **New evidence-MCP Issue from Scite — REJECT as duplicate.** `taichung-police-intel #15` and `lplrs-judicial-sync #3` already define read-only evidence distribution and exact source-span receipts. Scite’s one-click setup should inform onboarding, not create a second architecture.
4. **New `soundbox-offline` Share Target Issue — DEFER.** Strong low-effort workflow idea, but Web Share Target has incomplete browser support and overlaps current LAN/QR import work. Keep one import state machine and add platform-gated adapters later.
5. **Clinical auto-EHR push/finalize — DO NOT COPY.** It expands authorization/PHI risk while #6 P0 auth is still open and clinical validation remains bounded.
6. **Store every clinical revision as indefinite full-PHI body — DO NOT COPY.** Version metadata/receipts and retention of full note/transcript bodies must be separate policy decisions.
7. **`tick-stock-panel` broker integration — DO NOT COPY.** Violates the explicit non-trading research boundary. Guided robustness testing is a better adjacent move.
8. **Generic cloud computer inside legal/police intelligence products — DO NOT COPY.** Gemini Notebook demonstrates value but also a much larger effect/data boundary than these products need.

---

## Issue Mapping

| Product | Signal | Existing / New mapping | Action this round |
|---|---|---|---|
| `clinical-scribe-worker` | Nabla section regen + Dragon version/restore | **NEW #7** | Created research Issue after open/closed Issue + all-state PR + lock/fingerprint checks. |
| `clinical-scribe-worker` | Specialty safety evidence | #4 / PR #5 | No update; do not compete with existing validation scope. #7 consumes future validation receipts only. |
| `clinical-scribe-worker` | Auth/JWT boundary | #6 | Remains hard blocker for any new production mutation route. No lock stealing / no code change. |
| `note-filler` | Beaver approval/receipt/undo | #3 | Reinforces existing fingerprint; no duplicate Issue. |
| `cyber-prep-coach` | diagnostic/mastery/readiness | #4; explanation calibration #6 | No duplicate Issue. |
| `taichung-police-intel` | Scite one-click MCP onboarding | #15 | Add to future onboarding research; no duplicate Issue. |
| `lplrs-judicial-sync` | Evidence relationship traversal / citations | #3 | Research adjacency only; legal-status graph semantics remain separate. |
| `soundbox-offline` | PWA Share Target | overlaps current import/peer-transfer work | Research list only; platform capability must be runtime-tested. |
| `tick-stock-panel` | guided multi-variant strategy test | no sufficiently high-value non-duplicate filing confirmed | Research list only. |

### Duplicate / Coordination Gate for `clinical-scribe-worker #7`

Before creating #7, this round searched:
- repository code for `regenerate`, `undo`, `version history`, `note revision`, `section`;
- open/closed Issues for revision/regeneration/version/manual-edit concepts;
- all-state PRs;
- `github-issue-lock:v1` coordination markers.

Only #4 / PR #5 (specialty validation) and security PR #3 were relevant; no matching repair/revision fingerprint was found. #7 explicitly does **not** claim or modify their implementation scope.

---

## Sources

### Direct competitors / clinical workflow
- **CONFIRMED — 2026-08-24** Nabla, `Regenerating Section`: https://help.nabla.com/en/articles/10364226
- **CONFIRMED — current 2026** Microsoft Dragon Copilot, `Work with note versions`: https://support.microsoft.com/en-us/dragon-copilot/physicians/current/note-versions
- **CONFIRMED — current 2026** Freed pricing/workflow packaging: https://help.getfreed.ai/en/articles/9242518-freed-pricing-discounts-and-referral-program
- **CONFIRMED (research) — 2026-08-31** Fox et al., `One note in three...`: https://arxiv.org/abs/2608.31017

### Adjacent / emerging workflow
- **CONFIRMED — 2026-09-09** Scite citation graph MCP: https://scite.ai/blog/citation-surfing-scite-mcp
- **CONFIRMED — 2026-09-01** Scite August release / one-click connector: https://scite.ai/blog/august-2026-release-notes
- **CONFIRMED — current page** Beaver Zotero research assistant: https://www.beaverapp.ai/
- **CONFIRMED — 2026-07-16** Gemini Notebook secure cloud computer: https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/
- **CONFIRMED — 2026-08-28** Gemini Notebook flexible usage limits: https://blog.google/innovation-and-ai/products/gemini-notebook/new-flexible-usage-limits/
- **CONFIRMED — page modified 2026-08-27** MDN Web Share Target: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target
- **CONFIRMED — 2026-07-31** TrendSpider July 2026 changelog: https://trendspider.com/blog/july-2026-changelog/

### Community signals — anecdotal only
- **COMMUNITY_SIGNAL — 2026-08-25** https://www.reddit.com/r/doctorsUK/comments/1vy1b5y/what_you_hate_about_ai_scribe_apps/
- **COMMUNITY_SIGNAL — 2026-08-27** https://www.reddit.com/r/Residency/comments/1vzukc4/abridge_ai_scribe_tool/
- **COMMUNITY_SIGNAL — 2026-06-10** https://www.reddit.com/r/medicine/comments/1u24dul/please_please_proofread_your_ai_notes/

---

## What Changed Since Last Radar

1. **New high-value opportunity:** r7 centered post-publication duty-scheduling requests; r8 shifts to post-generation *clinical note repair* because a recent direct competitor now exposes single-section regeneration with edit preservation + Undo.
2. **New Issue created:** `Reese-max/clinical-scribe-worker #7` (Opportunity Score 92/100).
3. **No feature-chasing around EHR automation:** the stronger conclusion is the opposite—**repair/review/version semantics should mature before external clinical mutation surfaces expand**.
4. **Cross-portfolio primitive strengthened:** previous rounds repeatedly converged on `candidate → validate → promote → receipt`; the new insight is **minimal repair scope / preserve reviewed state** as an explicit invariant.
5. **Evidence-product distribution matured:** Scite’s 2026-09-09 citation graph + 2026-09-01 one-click connector reinforces existing Evidence MCP work, but does not justify duplicate Issues.
6. **One simplification candidate surfaced:** PWA OS Share Target can remove manual file-picker steps from `soundbox-offline`, but browser/platform support is insufficient for a new cross-platform promise.
7. **No product source code, implementation branch, merge, deploy, secrets, permissions or repository settings were changed.** This round only created the high-value research Issue and this central intelligence report.
