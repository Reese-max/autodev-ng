# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-12 r6

> Scope: `Reese-max` owner repositories that are **not archived** and can reasonably be treated as products.  
> Evidence discipline: public-web evidence outside GitHub is the primary research source; connected GitHub is used to map product fit, recent truth, duplicate/PR/lock coordination, and issue/report persistence.  
> Confidence labels: **CONFIRMED** = directly supported by first-party product/docs/release material or current repository evidence; **LIKELY** = reasonable inference / explicitly announced roadmap but not independently verified as shipped; **COMMUNITY_SIGNAL** = anecdotal practitioner/community evidence only; **UNKNOWN** = insufficient evidence.  
> Vendor claims are treated as product/positioning signals, not as efficacy proof.

## Executive Summary

This round refreshed the same **37 non-archived product-like repositories**. Since r5, the most material repository-side change is `ai-novel-workstation`'s 2026-09-12 Round-3 persona audit: the product remains **NOT CLEAN**, and new P2 Issue #5 records that the declared default-branch CI workflow has produced no observed workflow/check execution receipt on recent main pushes / the current PR head. That means new integration surfaces must remain research-only until the validation gate is demonstrably executing.

External public-web research produced a stronger-than-r5 convergence around **long-form creative workspaces becoming agent-addressable without manual copy/paste**:

1. **A — Direct competitor / current product:** CalliopeWriter currently positions MCP as a bridge from local manuscript files to ChatGPT, Claude and OpenCode, with Git-backed history/restore. Pendraic currently states that Premium users can connect the product to Claude Desktop, ChatGPT or another supported AI app and read/update the book without leaving the AI client. This establishes a real product/distribution pattern, not merely a generic MCP trend.
2. **B — Adjacent workflow:** Laserfiche Cloud 2026.09 introduced AI-assisted form fill that maps an uploaded source document into form fields while **never overwriting user-entered values** and leaving uncertain fields blank for review. This is a highly transferable mutation principle for `note-filler`, `clinical-scribe-worker`, and any Reese-max workflow where AI-derived content meets human-owned canonical data.
3. **C — Emerging / roadmap signal:** NovelShaft's 2026-09-10 update expanded its external-AI/MCP guidance, while its public product page explicitly says MCP/CLI remain **in preparation**. At the same time its shipped workspace already uses explicit approvals for risky AI changes, project-wide Undo, source/reference tagging, and intentionally withholds delete authority for reference material. The market direction is therefore clear even though this particular transport is not yet confirmed shipped.

The strongest new opportunity is **not “add MCP”**. It is a domain contract that lets an external AI client read the canonical story state and submit **candidate-only story patches** which still pass the existing stale-base, continuity, quality, checkpoint and promotion path. A new research Issue was created only after open/closed Issue + all-state PR duplicate checks found no matching fingerprint:

- `Reese-max/ai-novel-workstation #6` — **[Competitive Inspiration][Research][RESEARCH_REQUIRED][WORKFLOW] Agent-facing Story Workspace Contract** — **Opportunity Score 92/100**.

The Issue is explicitly blocked by #5 until default-branch CI is proven to run. It reuses #2 / PR #3 Context Manifest work and #4 Cost Envelope work; it does not create a second context system or a privileged filesystem write path.

**Notification gate: MET.** This round produced a high-value, sufficiently evidenced, non-duplicate product opportunity with direct-competitor confirmation and a concrete manual copy/paste workflow to remove.

---

# Portfolio Discovery / Product → Market Category

| Product | Market / JTBD | Recent repository truth relevant to this round |
|---|---|---|
| `cf-ai-router` | AI gateway / free-quota routing / provider reliability | Existing reliability-profile research remains the right direction; do not add generic agent-facing routing UI. |
| `soundbox-offline` | local/offline music player | Recovery/integrity remains ahead of NAS/network-source breadth. |
| `police-exam-archive` | Taiwan police exam archive/search | Provenance, completeness and source traceability remain core. |
| `skill-foundry` | Skill creation/evaluation/certification | Distribution/install receipts already tracked; no marketplace breadth. |
| `lobsterpulse` | multi-agent/provider operations monitoring | #9 already owns decision-only attention; new agent-addressable product signals do not justify more raw alerts. |
| `prompt-autoresearch` | local prompt research/evaluation for Taiwan exam essays | CI/evidence and promotion variance remain higher priority than external-agent breadth. |
| `tick-stock-panel` | market/portfolio panel | Coverage/freshness/partial-data truth remains more valuable than broader AI surfaces. |
| `clinical-scribe-worker` | clinical drafting / SOAP / validation | Human-owned clinical fields must remain non-destructively reviewable; auth/signature blocker still precedes broader automation. |
| `avatar-vfo` | avatar / visual-output workflow | Preserve candidate→canonical control and exportability; no signal this round justifies new generation breadth. |
| `adng-memory` | cross-repo operational memory/state | Activation/staleness/deletion/provenance lifecycle remains the product truth. |
| `ai-flight-radar` | flight watch / fare intelligence | Existing source-health / quote-truth / total-trip-cost work remains higher value than generic conversational breadth. |
| `taiwan-intel-dashboard` | Taiwan intelligence dashboard | Evidence/source-health + typed handoff remain differentiators. |
| `note-filler` | document/note automation | Laserfiche strongly validates non-destructive candidate field mutation and leaving unknowns explicit; #2/#3 already cover source-health/review foundations. |
| `cyber-prep-coach` | cybersecurity exam prep | Knowt/Pocket Prep validate mock/history/exam-version patterns already represented by #3/#4/#6/#8; avoid another mode. |
| `UkePack` | music/ukulele creative tooling | Reversible candidate→canonical artifact flow remains reusable. |
| `autodev-ng` | multi-engine autonomous development control plane | #12 effect firewall, #17 principal/credential and #21 environment handoff remain the shared safety substrate. |
| `ai-novel-workstation` | long-form creative writing workstation | **NEW:** #6 Agent-facing Story Workspace Contract created. #5 CI execution receipt is a hard prerequisite; #2/PR #3 context manifest must be reused. |
| `herdr-skills` | agent skill orchestration/reuse | Candidate/eval/distribution lifecycle already active; no generic connector clone. |
| `video-timeline-pipeline` | video intelligence / transcript/timeline/evidence | Evidence-backed rough-cut/NLE handoff remains the right in-context artifact pattern. |
| `chatgpt-dual-pipeline` | dual-model/reviewer workflow | Independent evidence/review separation more important than vendor UI. |
| `claude-mem` | coding-agent memory | Memory provenance/staleness remains central; typed external access must not erase source identity. |
| `lplrs-judicial-sync` | judicial-data sync | #5 target-date coverage/no-success receipt remains urgent; fixed-day gaps outrank product expansion. |
| `internship-notes-sites-mirror` | internship notes publishing | Stable publishing/provenance, not SaaS collaboration breadth. |
| `MaterialYouNewTab` | new-tab productivity/workspace | Session-capsule remains research-only; keep optional-permission/local-first posture. |
| `taichung-police-intel` | municipal/police intelligence monitoring | Evidence contract / transport-neutral distribution already tracked; do not duplicate as generic MCP breadth. |
| `ninax-line-hermes` | LINE/agent workflow integration | Identity/effect permission/safe handoff remain key. |
| `92-duty-scheduler` | duty scheduling/coordination | #19/#20/#22 already cover repair/policy/self-service confirmation; new form-fill pattern is adjacent only. |
| `voice-actress` | legal/knowledge answer workflow | Citation existence/support boundary remains primary; candidate edits must remain evidence-backed. |
| `project-doctor-web` | project diagnosis / quality review | Failure→repro→verification, not more dashboards. |
| `flux-image-gen` | image generation/edit workflow | #22 edit sessions/reference tray and spatial-edit research already cover current creative-session signals. |
| `neciken-summer-poem` | creative literary experience | Keep narrow artistic identity; do not become a generic AI writing suite. |
| `minideck` | lightweight AI deck creation/share/export | Draft/public lifecycle remains P1; agent surfaces must not implicitly republish. |
| `police-exam-practice` | police-exam practice | Source correctness, progress continuity and wrong-answer repair remain more important than more practice modes. |
| `ppt-studio` | presentation generation/studio | Auth/CI trust gate remains ahead of new remote-agent breadth. |
| `exam-archive` | exam archive | Completeness/source lineage/search reliability remain core. |
| `academic-mcp` | academic research aggregation/MCP | Canonical paper identity/research bundle already captures multi-source reconciliation. |
| `cf-mcp-server` | MCP/Cloudflare integration | Consent/auth/effect boundaries remain the reusable connector lesson. |

---

# External Signals

## A. Direct Competitor — fiction workspaces are becoming addressable from the user's existing AI client

### A1. CalliopeWriter

**CONFIRMED — checked 2026-09-12**  
Source: https://calliowriter.com/

CalliopeWriter publicly positions itself as “a writing app built for you and your AI agent.” Its product page says the manuscript connects directly to ChatGPT, Claude or OpenCode through MCP; manuscript content is kept in local files on the writer's Mac, history is Git-backed, and private GitHub backup is optional.

### A2. Pendraic

**CONFIRMED — checked 2026-09-12**  
Source: https://www.pendraic.com/

Pendraic states that Premium users can connect Pendraic to Claude Desktop, ChatGPT or another supported AI app and **read or update the book without leaving the AI client**. It also maintains a long-form editor, open threads, iterations/versioning and canon/world structure. Its public packaging lists:

- Free: $0;
- Essentials: US$14.99/month, BYO AI;
- Premium: US$24.99/month, including use from Claude/ChatGPT;
- Desktop: US$99 one-time, local database/offline, three computers.

These prices are product-packaging signals, not proof of outcomes.

### JTBD

Use an already-preferred AI client to inspect the real current novel state and request edits without re-copying manuscript fragments, story-bible facts and the returned draft between applications.

### Why it can save steps / improve reliability

The manual pattern is typically:

`find canon → copy → paste into AI → request → copy result → locate target → paste/overwrite → remember validation`.

The emerging pattern is:

`canonical story state → typed tool read → candidate action → review → promote`.

The latter can make revision identity, stale context and validation observable instead of relying on human memory.

### Onboarding / distribution signal

The writing product is distributed **into Claude/ChatGPT/OpenCode**, rather than forcing the writer into another proprietary AI-chat surface. Pendraic's premium packaging suggests that interoperability itself can be a monetizable workflow layer.

### Capability pattern

`Story Workspace → Typed Read → Scoped Candidate Patch → Validation → Human Promotion → Mutation Receipt`.

### Limits / failures

First-party pages confirm product positioning/capabilities, not writing quality, security or interoperability correctness. Raw filesystem access also creates a dangerous shortcut: an agent that can “edit the book” may bypass canon/continuity/quality/publish boundaries unless the product supplies a narrower domain contract.

### Reese-max fit

`ai-novel-workstation` already has exactly the primitives needed to build a safer version: canonical `books/`, production state, fail-closed checkpoints, continuity/quality gates, Context Manifest work and project validation. The opportunity is therefore **not another chat UI and not generic MCP**; it is a typed story-domain boundary.

**Opportunity Score: 92/100.**  
Disposition: **NEW ISSUE — `ai-novel-workstation #6`**.

---

## B. Adjacent Workflow — AI-derived data should not silently overwrite human-owned canonical values

### B1. Laserfiche Cloud 2026.09 AI-Assisted Form Fill

**CONFIRMED — September 2026; release page published 2026-09-03**  
Sources:
- https://doc.laserfiche.com/laserfiche/en-us/content/2026.09.htm
- https://docs.laserfiche.com/laserfiche/en-us/content/ai-form-fill.htm
- https://www.laserfiche.com/es/resources/product-updates/whats-new-in-september-ai-assisted-form-fill-and-do-more-with-agents/

Laserfiche now lets a form designer mark an upload field as an AI extraction source. The system identifies data in the uploaded document, maps it to form fields and fills relevant values. Its current docs define unusually useful mutation semantics:

- AI does not clear a field;
- AI does not write read-only fields;
- once a user manually edits a field, AI treats it as user-owned and does not overwrite it;
- uncertain / unfound values are left blank for human review;
- AI can update values previously filled by AI if the user has not taken ownership.

### B2. Community cost/abuse caveat

**COMMUNITY_SIGNAL — Laserfiche Answers, asked 2026-09-11**  
Source: https://answers.laserfiche.com/questions/238245/AIassisted-form-fill-on-public-forms-abandoned-uploads-spend-AI-units-with-no-attribution

A community question reports concern that public anonymous uploads can trigger extraction before form submission and consume AI units, while current usage views may not identify the exact form/user/request responsible for spend. This is a single community report/question, not an established abuse-rate statistic.

### JTBD

Remove repetitive document→form re-entry while preserving the submitter's corrections and making uncertainty visible.

### Why it saves steps / improves reliability

The product removes manual transcription but does **not** treat AI output as higher authority than human-entered data. This sharply reduces destructive “AI corrected my correction” behavior.

### Onboarding / distribution

One form-field setting enables the extraction path; users stay inside the form they already need to complete.

### Capability pattern

`Source Document → Candidate Field Value → Ownership/Constraint Check → Fill Empty/AI-owned Field → Human Review → Submission`.

### Pricing / cost signal

AI extraction consumes AI units even when unsuccessful, so automation cost should be tied to a request identity/budget/receipt rather than treated as invisible infrastructure.

### Reese-max fit

- `note-filler`: reinforce claim/field-level review and explicit `USER_OWNED / AI_CANDIDATE / NO_EVIDENCE / ERROR` semantics rather than silent replacement.
- `clinical-scribe-worker`: clinician-authored/corrected content must dominate generated suggestions.
- `92-duty-scheduler`: generated repair suggestions should remain candidate changes, not overwrite human-confirmed duty facts.

Existing Reese-max candidate/review issues already cover the core direction, so no duplicate Issue is created.

**Opportunity Score: 90/100.**  
Disposition: **EXISTING PATTERN / research validation only**.

---

## C. Emerging Product / Roadmap — story context is turning into an explicit tool surface, but transport availability must stay truthful

### C1. NovelShaft recent updates

**CONFIRMED product updates + LIKELY future transport — 2026-09-03 through 2026-09-11**  
Sources:
- https://en.novelshaft.com/updates
- https://en.novelshaft.com/
- https://en.novelshaft.com/features
- https://en.novelshaft.com/updates/20260903-142759
- https://en.novelshaft.com/mobile

Recent confirmed product changes include:

- Sep 3: `@Manuscript` / `@Reference` tags let users point the AI at exact manuscript/reference material without copying whole passages;
- Sep 4: iPhone/iPad availability shares works, conversations, manuscripts and reference material with the Web account;
- Sep 9: the workspace retains the selected view after AI operations;
- Sep 10: external-AI connection status/guidance was expanded;
- Sep 11: reference editing/progress handling was improved.

The same public page explicitly says **MCP & CLI are “in preparation.”** Therefore the correct evidence label is: roadmap/guidance is confirmed, shipped MCP/CLI availability is **not**.

Its shipped in-app model is nonetheless informative: limited changes can be skipped/undone, risky changes require explicit approval, project-wide Undo is available, and AI is not given a delete tool for reference material.

### C2. Wrylo / local-first competitive corroboration

**CONFIRMED — checked 2026-09-12**  
Source: https://wrylo.in/

Wrylo markets a living story bible, local-first browser storage by default, optional paid cloud sync and BYOK. This provides a useful counterweight to “everything must become a cloud agent service”: interoperability should not require surrendering local-first ownership.

### C3. Human-centered market segmentation

**CONFIRMED product strategy — Plottr 2026 roadmap**  
Source: https://plottr.com/plottr-in-2026/

Plottr explicitly says AI is not coming to the product and focuses on human-crafted storytelling / simplification instead. This is strategically important: “more AI” is not the only competitive axis. Author control, human craft, local ownership and simplicity can themselves be differentiators.

### Transferable pattern

`Canonical Creative Workspace → Explicit Context Selection → Candidate AI Action → Bounded Authority → Human Decision → Reversible Revision`.

### What not to copy

- do not claim roadmap transports as shipped;
- do not turn every writing action into agent automation;
- do not require cloud sync for core authorship;
- do not treat “agent can edit files” as equivalent to safe story-domain mutation.

**Opportunity Score: 89/100** as a market-direction signal; the actionable non-duplicate slice is captured in `ai-novel-workstation #6`.

---

# New Releases / Fresh Product Changes

| Date | Product | Signal | Confidence | Reese-max implication |
|---|---|---|---|---|
| 2026-09-11 | NovelShaft | reference editing/progress reliability improvements | CONFIRMED | Session continuity/recovery matters, but does not justify cloud sync before #5. |
| 2026-09-10 | NovelShaft | external-AI connection guidance/status expanded; MCP/CLI still explicitly in preparation | CONFIRMED roadmap / LIKELY future surface | Plan a transport-neutral story contract, not vendor-specific MCP code first. |
| 2026-09-09 | NovelShaft | retain workspace view after AI operations | CONFIRMED | Minimize context switching in long creative loops. |
| 2026-09-04 | NovelShaft | iPhone/iPad shares works/manuscript/references with Web | CONFIRMED | Cross-device continuity is valuable but currently lower priority than `ai-novel-workstation #5`. |
| 2026-09-03 | NovelShaft | explicit `@Manuscript` / `@Reference` context tags | CONFIRMED | Validates #2 Context Manifest / explicit source selection. |
| 2026-09-03 | Laserfiche | AI-assisted form fill + AI usage visibility | CONFIRMED | Non-destructive field ownership + cost receipts are reusable primitives. |
| 2026-09-12 (docs checked) | Knowt | Exam Hub schedule, full mocks, history, predicted score/unit progress | CONFIRMED | Validates existing exam blueprint/review/progress work; no extra mode needed. |
| 2026-06-08 | Pocket Prep | exam-version switching while retaining progress | CONFIRMED older representative | Existing cyber-prep #3/#6 remain correct; dataset version ≠ exam blueprint version. |

Knowt sources:
- https://help.knowt.com/en/articles/10492949-where-can-i-find-exam-study-material
- https://help.knowt.com/en/articles/11385716-how-to-view-mock-exam-and-practice-history

Pocket Prep source:
- https://www.pocketprep.com/posts/what-do-i-do-when-a-new-version-of-my-exam-comes-out/

---

# Community Pain Points

## 1. Manual manuscript/context copy-paste remains an experienced-user pain

**COMMUNITY_SIGNAL — Reddit, 2026-06-25**  
https://www.reddit.com/r/WritingWithAI/comments/1ufkeny/ive_written_two_novels_with_ai_and_never/

One practitioner describes abandoning the repeated “mega-prompt + manual copy/paste” workflow in favor of canonical files, manifests, story-bible/ledger documents and handoff notes. The claimed book counts/quality are anecdotal and are **not** used as efficacy proof. The useful signal is the workflow complaint: context transfer and session resumption are manual and error-prone.

**COMMUNITY_SIGNAL — Reddit, 2026-08-10**  
https://www.reddit.com/r/WritingWithAI/comments/1vkqlz2/how_the_heck_do_you_write_a_longer_novel_with_ai/

A user reports long-form drift/compression despite story bible/outlines. This does not establish failure rates; it supports keeping context-selection and continuity evidence first-class rather than assuming a larger model window solves story consistency.

## 2. MCP can remove copy/paste, but raw file write is not a safety contract

**COMMUNITY_SIGNAL — Reddit, 2026-02-25**  
https://www.reddit.com/r/ClaudeAI/comments/1remj88/i_opensourced_the_mcp_server_and_prose_scanner_i/

A practitioner describes an MCP fiction workflow exposing story-bible search, character lookup, adjacent-chapter context and continuity checking. This supports typed story tools as a useful shape, but not unrestricted filesystem writes.

## 3. AI extraction on public forms can create cost/attribution concerns

**COMMUNITY_SIGNAL — Laserfiche Answers, 2026-09-11**  
https://answers.laserfiche.com/questions/238245/AIassisted-form-fill-on-public-forms-abandoned-uploads-spend-AI-units-with-no-attribution

The community question highlights a reusable risk: expensive AI work triggered before a durable business action may need rate/budget/identity receipts, particularly on public unauthenticated surfaces.

---

# Adjacent Ideas

1. **Human-owned field precedence** — use Laserfiche's “AI may update its own prior suggestion, but never a user-corrected value” semantics for `note-filler`, clinical drafting and schedule repair candidates.
2. **Explicit context handles** — NovelShaft's `@Manuscript` / `@Reference` pattern is simpler than forcing users to understand retrieval internals; Reese-max can map visible source handles onto existing Context Manifests/evidence locators.
3. **Transport-neutral domain contract** — define story operations first; MCP/CLI/desktop UI become adapters. This mirrors prior Reese-max WebMCP/MCP lessons without forcing a specific client.
4. **Local-first interoperability** — CalliopeWriter/Wrylo/Pendraic Desktop show that “agent-connected” does not have to mean “canonical data lives only in SaaS cloud.”
5. **AI spend attribution** — every externally triggered costly operation should retain requester/client/work/action/cost receipt, not merely a monthly aggregate.
6. **Cross-device state is not automatically canonical-state sync** — mobile convenience is valuable, but local-first products need explicit merge/conflict/offline semantics before enabling broad sync.

---

# Opportunity Scores

| Candidate | Pain | Fit | Novelty | Evidence | Reuse | Effort* | Risk* | Total / 100 | Disposition |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Agent-facing Story Workspace Contract | 9 | 10 | 8 | 9 | 9 | 7 | 8 | **92** | **NEW #6**; research-only until #5 CI gate proven |
| Human-owned field precedence / non-destructive AI fill | 9 | 9 | 7 | 10 | 10 | 8 | 9 | **90** | Cross-portfolio validation; no duplicate Issue |
| Explicit context handles backed by manifests | 9 | 10 | 7 | 9 | 9 | 8 | 9 | **90** | Maps to ai-novel #2 / PR #3 |
| Long-form cross-device continuity | 8 | 8 | 7 | 9 | 7 | 5 | 6 | **84** | Research only; blocked by reliability/privacy complexity |
| AI extraction cost/request attribution | 7 | 8 | 8 | 7 | 10 | 7 | 8 | **84** | Reuse existing cost/effect receipt patterns |
| Exam-version-aware progress migration | 8 | 9 | 6 | 9 | 8 | 7 | 9 | **87** | Existing cyber-prep #3/#6; no new Issue |
| Generic “add another AI chat” | 4 | 4 | 2 | 9 | 3 | 8 | 6 | **54** | REJECT |

\*Effort/Risk scores are controllability scores: higher = easier/safer to control.

---

# Opportunity Map — all 37 products

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| `cf-ai-router` | truthful provider health | deterministic task-fit routing | evidence of why route chosen | per-request cost/effect receipt | opaque “smart auto” switching |
| `soundbox-offline` | reliable local playback/recovery | integrity-aware resume | offline-first ownership | network source only after recovery gates | cloud dependency for basic play |
| `police-exam-archive` | source/page provenance | completeness visibility | Taiwan police-exam specificity | exam-version metadata | generic AI summaries without source |
| `skill-foundry` | repeatable certification | install/read-back receipts | candidate→certified lifecycle | portable adapter bundles | marketplace breadth before trust |
| `lobsterpulse` | provider/session state truth | decision-only attention | bounded pre-investigation | costly-action attribution | AI summary on every event |
| `prompt-autoresearch` | reproducible evals | variance-aware promotion | local research evidence | failure→dataset loop later | production feedback ingestion before gates |
| `tick-stock-panel` | freshness/coverage truth | partial-data semantics | evidence-first panel | typed research handoff | generic finance chatbot |
| `clinical-scribe-worker` | clinician-owned corrections | section-scoped candidate repair | explicit evidence/status | Laserfiche-style field ownership | overwrite clinician edits |
| `avatar-vfo` | reversible asset versions | export/portability | controllable creative state | reference asset tray | irreversible regenerate loop |
| `adng-memory` | source/staleness/deletion | activation lifecycle | inspectable operational memory | external typed read with source hashes | hidden evergreen memory |
| `ai-flight-radar` | quote/source health | total-cost/reconfirm | watch intent + truthful receipt | post-booking reprice research | auto-book/auto-claim without rules |
| `taiwan-intel-dashboard` | evidence/source health | typed distribution | police/public-intel specialization | transport-neutral tools | answer without provenance |
| `note-filler` | source→field traceability | human-owned field precedence | immutable original + supplements | non-destructive form-fill semantics | replace corrected human values |
| `cyber-prep-coach` | exam blueprint/version truth | mastery migration/review | evidence-backed next action | Knowt-style history without mode sprawl | another redundant practice mode |
| `UkePack` | editable/exportable music artifacts | reversible revisions | candidate creative handoff | external tool surface later | one-shot generation only |
| `autodev-ng` | principal/environment/effect truth | explicit receipts/policies | local multi-engine control plane | story-domain contracts as downstream consumers | broad authority via one connector |
| `ai-novel-workstation` | canonical story truth + validation gates | typed external reads/candidate edits | **agent-safe story workspace contract** | cross-device continuity after #5 | raw filesystem MCP / direct canonical write |
| `herdr-skills` | portable evaluated skills | target read-back | skill lifecycle/evidence | domain-specific tool adapters | copy folders blindly |
| `video-timeline-pipeline` | transcript/evidence timecodes | candidate cut specs | evidence-backed NLE handoff | in-context derived media | full NLE clone |
| `chatgpt-dual-pipeline` | independent reviewer separation | evidence of disagreement | dual-engine cross-check | candidate patch comparison | consensus = truth |
| `claude-mem` | provenance/staleness | scoped activation | local coding-memory lifecycle | typed read-only memory access | hidden unsourced recall |
| `lplrs-judicial-sync` | target-date coverage receipt | no-success alarm/backfill accounting | fixed-day gap truth | downstream candidate alerts | assume schedule = coverage |
| `internship-notes-sites-mirror` | stable published output | source/history provenance | simple public notes | selective reference tags | SaaS collaboration sprawl |
| `MaterialYouNewTab` | fast local workspace | session capsule truth | minimal permissions/local-first | optional explicit sync | broad history/tab permissions by default |
| `taichung-police-intel` | evidence envelope | distribution contract | public-safety evidence lineage | WebMCP/MCP adapters | duplicate agent data store |
| `ninax-line-hermes` | exact identity/effect | safe handoff receipts | LINE-native workflow | decision queue integration | infer authorization from chat identity |
| `92-duty-scheduler` | hard constraint truth | explainable repair + confirmation | human-approved minimal changes | non-destructive generated field suggestions | auto-publish schedule edits |
| `voice-actress` | source/citation support truth | claim-level verification | legal-answer evidence contract | candidate wording patches | citation exists = claim supported |
| `project-doctor-web` | reproducible diagnostics | fix verification | failure→repro→receipt | structured agent handoff | dashboard-only diagnostics |
| `flux-image-gen` | revision/reference lineage | branch/compare/rollback | private edit sessions | spatial intent/mask research | latest-image overwrite chain |
| `neciken-summer-poem` | intentional literary experience | simple share/output | narrow artistic identity | optional reversible assist | generic AI novel suite |
| `minideck` | draft/public separation | agent edits as candidate revisions | lightweight explicit publish | API/MCP after #4 | agent edit = republish |
| `police-exam-practice` | correct question/source | repair queue + continuity | Taiwan police exam loop | mock history/blueprint views | mode proliferation |
| `ppt-studio` | fail-closed auth + CI | source→claim→layout provenance | controlled presentation studio | external typed tools after trust gate | broaden remote surface now |
| `exam-archive` | source completeness | stable indexing/search | exam archive lineage | blueprint metadata | AI content without source |
| `academic-mcp` | canonical paper identity | partial/rate-limit truth | versioned research bundle | external-agent bundle diffs | flatten unknown into “no result” |
| `cf-mcp-server` | consent/auth/effect boundary | explicit client session | Cloudflare-native controlled MCP | candidate-effect simulation | connection = blanket write authority |

---

# Top 10 Cross-Portfolio Ideas

1. **Typed domain tools before transport:** define `Read / Propose / Validate / Promote / Receipt` for the product object; MCP/WebMCP/CLI/UI are adapters.
2. **Human-owned value precedence:** once a human corrects a field/artifact, AI cannot silently overwrite it.
3. **Candidate-only external mutation:** outside agents submit diffs/candidates; canonical state changes only through the product's existing gate.
4. **Exact base revision / stale-state rejection:** every external candidate carries parent hash/revision and fails closed when reality changed.
5. **Explicit context source handles:** users can point to exact evidence/story/reference objects without copying their content into prompts.
6. **Cost attribution per AI action:** costly generation/extraction should retain request/client/work/action/cost identity, especially on public surfaces.
7. **Local-first interoperability:** agent connectivity should not force cloud canonical storage when the product's value is local ownership.
8. **Cross-device sync only with conflict semantics:** “same account on phone and desktop” is useful, but offline/conflict/merge truth must precede silent sync.
9. **Unknown stays unknown:** uncertain form fields, unavailable sources, partial data, stale context and missing coverage should remain explicit states.
10. **Transport availability truth:** roadmap docs, configured connectors and actually verified runtime integrations are different states and must not be collapsed.

---

# Ideas Rejected / Deferred

1. **“Just add MCP to ai-novel-workstation.” — REJECT.** Transport is not the product boundary; raw filesystem access would bypass canonical validation.
2. **Immediate `ai-novel-workstation` mobile/cloud sync. — DEFER.** NovelShaft proves user value, but current #5 CI execution gap makes a new distributed-write surface the wrong sequencing.
3. **Treat NovelShaft MCP/CLI as launched. — REJECT.** Its own public page says both remain in preparation.
4. **New generic AI chat inside ai-novel-workstation. — REJECT.** The opportunity is reuse of the user's existing AI client, not another chat shell.
5. **Public unauthenticated AI extraction without request/cost controls. — REJECT.** Laserfiche community feedback highlights a plausible abuse/attribution problem.
6. **Auto-overwrite human-corrected note/clinical/schedule fields. — REJECT.** Directly conflicts with the stronger non-destructive ownership pattern.
7. **More cyber/police exam modes to match Knowt. — REJECT.** Existing Reese-max exam products already have mode/quality work; blueprint/progress truth is higher value.
8. **Generic Plottr-style feature accumulation or generic AI-writing clone. — REJECT.** Competitor differentiation includes both AI-native and explicitly human-centered positions; Reese-max should preserve its own local/gated production identity.

---

# Issue Mapping / Coordination

| Signal | Existing/New work | Duplicate / lock / PR check | Action this round |
|---|---|---|---|
| External AI can directly read/update a novel workspace | `ai-novel-workstation #6` | Search across open/closed Issues found no MCP/external-agent/story-workspace fingerprint; all-state PR search found only PR #3 for Context Manifest | **Created #6** |
| Deterministic story context / source selection | `ai-novel-workstation #2`, PR #3 | Existing active implementation; not duplicated | #6 depends on/reuses it |
| Cost controls for novel AI work | `ai-novel-workstation #4` | Existing | #6 must preserve it |
| Default-branch CI actually executes | `ai-novel-workstation #5` | Existing newest audit finding | **Hard dependency; no implementation start claimed** |
| Non-destructive AI field fill | `note-filler #3` + existing supplement/review architecture | Existing semantic overlap | Report-only validation |
| Exam blueprint/version/progress | `cyber-prep-coach #3/#4/#6/#8`, `police-exam-practice #4` | Existing | No new Issue |

No source-code branch, implementation branch, merge, deployment, secret, permission or repository setting was modified in this radar round.

---

# Sources

## Direct / creative-writing products
- CalliopeWriter — checked 2026-09-12 — https://calliowriter.com/
- Pendraic — checked 2026-09-12 — https://www.pendraic.com/
- NovelShaft updates — checked 2026-09-12 — https://en.novelshaft.com/updates
- NovelShaft product/MCP roadmap status — checked 2026-09-12 — https://en.novelshaft.com/
- NovelShaft features — checked 2026-09-12 — https://en.novelshaft.com/features
- NovelShaft reference tags — 2026-09-03 — https://en.novelshaft.com/updates/20260903-142759
- NovelShaft mobile — 2026-09-04 availability — https://en.novelshaft.com/mobile
- Wrylo — checked 2026-09-12 — https://wrylo.in/
- Plottr 2026 strategy — published 2026 — https://plottr.com/plottr-in-2026/

## Adjacent workflow / form automation
- Laserfiche Cloud September 2026 updates — https://doc.laserfiche.com/laserfiche/en-us/content/2026.09.htm
- Laserfiche AI-Assisted Form Fill docs — https://docs.laserfiche.com/laserfiche/en-us/content/ai-form-fill.htm
- Laserfiche Sep 3 product update — https://www.laserfiche.com/es/resources/product-updates/whats-new-in-september-ai-assisted-form-fill-and-do-more-with-agents/
- Laserfiche Answers public-form cost/attribution question — 2026-09-11 — https://answers.laserfiche.com/questions/238245/AIassisted-form-fill-on-public-forms-abandoned-uploads-spend-AI-units-with-no-attribution

## Exam products
- Knowt Exam Hub — updated 2026-09-12 — https://help.knowt.com/en/articles/10492949-where-can-i-find-exam-study-material
- Knowt mock/practice history — updated 2026-09-12 — https://help.knowt.com/en/articles/11385716-how-to-view-mock-exam-and-practice-history
- Pocket Prep exam version switching — 2026-06-08 — https://www.pocketprep.com/posts/what-do-i-do-when-a-new-version-of-my-exam-comes-out/

## Community / anecdotal only
- Reddit WritingWithAI file-based novel workflow — 2026-06-25 — https://www.reddit.com/r/WritingWithAI/comments/1ufkeny/ive_written_two_novels_with_ai_and_never/
- Reddit WritingWithAI long-novel context pain — 2026-08-10 — https://www.reddit.com/r/WritingWithAI/comments/1vkqlz2/how_the_heck_do_you_write_a_longer_novel_with_ai/
- Reddit ClaudeAI fiction MCP workflow — 2026-02-25 — https://www.reddit.com/r/ClaudeAI/comments/1remj88/i_opensourced_the_mcp_server_and_prose_scanner_i/

---

# What Changed Since Last Radar (r5 → r6)

1. **New repository truth:** `ai-novel-workstation` Round-3 audit created #5 because default-branch/PR CI has no observed execution receipt; CLEAN streak remains 0/2.
2. **New direct-competitor concentration:** CalliopeWriter + Pendraic provide current external-AI-to-manuscript access patterns; NovelShaft now publishes setup/cost guidance but correctly remains labelled roadmap/in-preparation for MCP/CLI.
3. **New high-value opportunity:** created `ai-novel-workstation #6` for a typed Agent-facing Story Workspace Contract, score 92/100.
4. **Sequencing is explicit:** #6 is research-only and hard-blocked by #5; it must reuse #2/PR #3 and #4 rather than creating parallel context/cost systems.
5. **New adjacent product rule:** Laserfiche's non-destructive AI form-fill semantics strengthen a reusable Reese-max principle: `USER_OWNED ≠ AI_OWNED`, and unknown fields stay blank/explicit.
6. **No implementation work:** no product source changes, implementation branch, merge, deploy, secrets, permissions or repo settings were touched.

## New cross-portfolio principle

> **`External AI Access ≠ Raw Filesystem Authority ≠ Canonical Mutation.`**
>
> The safer reusable primitive is: **`Canonical State → Typed Read → Candidate Mutation → Exact-Base Validation → Domain Gate → Human/Policy Promotion → Mutation Receipt`**.
