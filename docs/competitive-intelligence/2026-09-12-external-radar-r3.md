# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-12 r3

> Scope: Reese-max owned, unarchived repositories that are reasonably product-like.  
> Primary evidence source for this round: public web outside Reese-max GitHub. GitHub is used for current product truth, recent-change review, duplicate/PR/lock coordination, and this historical report.  
> Evidence labels: **CONFIRMED** = first-party/current product or authoritative documentation; **LIKELY** = well-supported but not fully runtime-verified; **COMMUNITY_SIGNAL** = anecdotal user/developer discussion; **UNKNOWN** = insufficient evidence.  
> No vendor marketing claim is treated as product-effect evidence unless independently verified.

## Executive Summary

This round refreshed **37 unarchived product-like Reese-max repositories**. No candidate cleared the threshold for a new GitHub feature/research issue, and no existing issue needed a material update. The strongest fresh signals are useful refinements to already-tracked directions rather than genuinely new fingerprints:

1. **MaterialYouNewTab — reversible stale-tab hygiene, not another tab-manager surface** (**88/100**). Tab Manager AI v4.0.0 (2026-09-11) now auto-archives stale tabs only after local archival succeeds, keeps the feature opt-in, previews exactly what will happen, excludes pinned/audio/current/grouped/last-window tabs, supports one-click restore/export, and explicitly admits that inactivity history starts only when the extension is installed. This strengthens the existing Workspace Session Capsule direction from the prior radar: any future cleanup should be `candidate → preview → archive-before-close → restore receipt`, not silent tab destruction. It is a refinement, not a separate issue.
2. **Cross-portfolio — governed logic should travel with AI access, not be reimplemented inside each agent** (**87/100**). Alteryx’s September release extends approved datasets/workflows/business logic into external AI through Agent Studio, MCP, OpenAI integrations, inherited permissions, and auditable workflow execution. OpenAI’s Data plugin similarly brings connected business data plus team metric definitions/context into ChatGPT Work/Codex while honoring connected-account permissions. This validates existing Reese-max evidence/transport contracts (`taichung-police-intel`, `taiwan-intel-dashboard`, `tick-stock-panel`, `academic-mcp`) rather than justifying a new generic data-agent layer.
3. **video-timeline-pipeline — media intelligence is moving closer to the creative surface** (**86/100**). Avid/Google Cloud’s 2026-09-11 browser Media Composer announcement combines semantic media search, transcript/description enrichment, natural-language prep, and governed agentic workflows inside the existing editor. Reese-max already tracks Hybrid Search/RAG (#5) and task-specific visual evidence escalation (#10), so the transferable lesson is to keep retrieval/action inside the current evidence contract instead of bolting on a second AI editor.
4. **Distribution/UX signal — ambient access can remove context-switching, but shell duplication is not a moat** (**78/100**). Google’s Gemini desktop app for Windows (2026-09-11) uses `Alt+Space` over active work and connects Workspace sources. This is a strong onboarding/distribution pattern, but it does not justify desktop-wrapper projects across Reese-max; existing products should first expose stable commands/contracts that a shell can invoke.
5. **Latest GitHub truth changed only one product materially since r2:** `prompt-autoresearch` added a 2026-09-12 board audit. Its decision is **INVEST / SIMPLIFY**: restore the red evidence/CI contract (#4) before implementing variance-aware promotion (#3). Fresh public-web research did not overturn that priority.

No product source, implementation branch, merge, deployment, secret, permission, firewall, or repository setting was changed.

---

## Portfolio → Market Category Refresh

| Repository | Market / product category | Current direction / latest relevant truth |
|---|---|---|
| `cf-ai-router` | Multi-provider LLM routing / reliability | Cost-fail-closed routing, capability truth, fallback evidence, and model-lifecycle resilience remain the moat; do not add providers for count. |
| `soundbox-offline` | Local/offline audio library/player | Local-first/privacy remains differentiated; recovery/CI assurance still precedes NAS/source breadth. |
| `police-exam-archive` | Police-exam archive / practice intelligence | Source identity, candidate/attempt state, and actionable work queues outrank more modes. |
| `skill-foundry` | Agent Skill generation/evaluation/certification/distribution | Goal Autopilot reduces creation effort; certified distribution/install-state truth remains tracked by #4. |
| `lobsterpulse` | Multi-agent/provider observability and operator attention | Decision-only Attention Queue remains the correct abstraction; raw events should not equal human interruptions. |
| `prompt-autoresearch` | Local prompt research/evaluation for Taiwan civil-service essay prompts | Latest audit says INVEST/SIMPLIFY: restore canonical evidence CI (#4), then variance-aware/inconclusive promotion (#3); do not become generic hosted eval SaaS. |
| `tick-stock-panel` | Market/stock monitoring panel | Freshness/coverage/partial-data truth remain more strategic than generic finance chat. |
| `clinical-scribe-worker` | Clinical AI scribe | Specialty validation (#4) and section-scoped reversible repair (#7) already cover the most valuable external workflow signals. |
| `avatar-vfo` | Avatar / voice-oriented workflow tooling | Keep bounded asset/workflow state and explicit outputs; avoid broad agent-control expansion without product evidence. |
| `adng-memory` | Agent/autodev memory layer | Memory provenance, compaction, retrieval scope, and exact revision lineage matter more than unbounded retention. |
| `ai-flight-radar` | Flight discovery / fare monitoring / quote truth | Quote/source health, total trip cost, watch-state truth and guarded cloud execution remain core; avoid auto-booking. |
| `taiwan-intel-dashboard` | Taiwan public-intelligence aggregation/dashboard | Evidence provenance, source health, freshness and governed agent-consumable contracts matter more than generic chat. |
| `note-filler` | Structured note completion / productivity | Candidate-vs-canonical mutation, field provenance and reviewable diffs remain the transferable primitives. |
| `cyber-prep-coach` | Cybersecurity exam preparation | Versioned exam blueprint/content and mastery migration remain more important than adding quiz modes. |
| `UkePack` | Music / ukulele creative toolkit | Reversible creative assistance and export/handoff remain more strategic than opaque generative replacement. |
| `autodev-ng` | Multi-engine autonomous software-development orchestrator | Existing principal/environment/effect/attention/evidence contracts remain the right kernel; no new control-plane dashboard needed. |
| `ai-novel-workstation` | Long-form AI writing workstation | Canonical manuscript, candidate revisions, continuity and reversible edits should stay distinct. |
| `herdr-skills` | Multi-agent Skill library / improvement workflow | Correction/demonstration → candidate Skill → evaluation/promotion remains the right lifecycle. |
| `video-timeline-pipeline` | Video transcription/OCR/timeline knowledge extraction | Hybrid evidence retrieval and bounded visual escalation already cover the strongest new media-intelligence patterns. |
| `chatgpt-dual-pipeline` | Multi-model / dual-pipeline AI workflow | Cross-model evidence/review boundaries matter more than another model selector or shell. |
| `claude-mem` | Persistent memory for Claude/agents | Retrieval provenance, lifecycle, privacy and stale-memory handling remain key. |
| `lplrs-judicial-sync` | Legal/judicial source synchronization and evidence | Source identity, freshness, conflicts and provenance remain differentiators. |
| `internship-notes-sites-mirror` | Notes/site publishing mirror | Source-to-published revision traceability and simple export/publish remain core. |
| `MaterialYouNewTab` | Browser new-tab productivity/workspaces | Workspace/session continuity remains the larger opportunity; new signal adds reversible stale-tab hygiene and opt-in automation. |
| `taichung-police-intel` | Police/public-sector intelligence & evidence dashboard | Governed evidence distribution contracts remain more valuable than broad generative chat. |
| `ninax-line-hermes` | LINE messaging / agent bridge | Channel identity, send/reply capability boundaries and receipts should remain explicit. |
| `92-duty-scheduler` | Duty roster / staffing scheduler | Proposed-vs-canonical schedule, constraints, approvals and mutation receipts remain core. |
| `voice-actress` | Police/law essay practice and evidence-based evaluation | Rubric revision + answer revision + evidence-linked scoring remain the differentiated direction. |
| `project-doctor-web` | Project diagnosis / maintenance web surface | Keep diagnosis evidence and repair proposals distinct; avoid auto-fixing without runtime verification. |
| `flux-image-gen` | Image generation/editing workstation | #22 Creative Edit Session / Reference Tray remains the latest high-value workflow; candidates must not overwrite canonical art. |
| `neciken-summer-poem` | Creative writing / poetry product | Preserve author intent, revision history and lightweight creative flow; avoid workflow bloat. |
| `minideck` | Lightweight presentation creation | Source-preserving transformations and editable handoff are preferable to feature-heavy collaboration. |
| `police-exam-practice` | Exam practice | Reliable source mapping, attempt state and feedback quality remain more useful than more modes. |
| `ppt-studio` | AI presentation generation/editor | Claim/source provenance remains strategically right; auth/CI integrity still outranks remote-agent breadth. |
| `exam-archive` | Exam archive | Searchability, source identity and stable content indexing remain foundational. |
| `academic-mcp` | Academic research MCP / multi-source retrieval | Canonical Paper Identity + Research Bundle Ledger (#1) remains the right answer to multi-source drift/rate limits. |
| `cf-mcp-server` | Cloudflare management MCP | Protocol/auth interoperability, exact-target confirmation and gradual rollout safety remain priorities. |

---

# External Signals

## Signal A — Tab Manager AI v4.0.0: archive-before-close, previewed automation, truthful history limits

**Classification:** CONFIRMED direct competitor signal  
**Date:** 2026-09-11  
**Sources:**
- https://tabai.site/
- https://tabai.site/articles/en/auto-archive-stale-tabs

### Job-to-be-Done
Users accumulate stale tabs because closing them feels irreversible. The product must reduce clutter without forcing the user to decide every tab immediately or fear permanent loss.

### Why this saves steps / improves reliability
- Stale tabs can be handled automatically after a configured age.
- Every tab is first written to the local archive; close occurs only after that write succeeds.
- Restore is one click and full archive export uses a portable bookmarks file.
- The configuration screen previews which tabs would be archived and why others are protected.

This removes the repeated `inspect tab → decide → bookmark/save → close → later search again` loop while preserving reversibility.

### Onboarding / distribution pattern
- Auto-archive is **off by default**.
- User chooses 7/30/60/90 day threshold.
- Pinned/audio/current/grouped/last-window/browser-internal tabs are protected by default.
- No account is required for the archive; the vendor positions storage as local-first.

### New capability pattern
`Observed tab → eligible candidate → preview/reason → durable local archive → close → restore/export`.

The strongest part is not “automation”; it is **automation with a preconditioned reversible state transition**.

### Pricing / business-model signal
The public site currently emphasizes the extension itself rather than a paid automation tier. No pricing claim is used as a product-effect signal.

### Limitation / failure point
The vendor explicitly states Chrome cannot tell the extension when a tab was last used before installation, so inactivity history starts when v4 first observes the tab. This is a valuable truth-contract signal: unknown historical state should not be presented as old/stale with fake precision.

### Reese-max absorption
**MaterialYouNewTab SHOULD BE BETTER:** any future stale-tab cleanup should reuse the existing session/workspace direction and add a reversible `ArchiveCandidate` rather than a second tab-management subsystem.

Suggested state machine:

`OpenTabObservation → CleanupCandidate → Preview → ARCHIVE_WRITE_VERIFIED → Close → CleanupReceipt → RestoreCandidate`

Receipts should distinguish:
- `OBSERVED_SINCE_INSTALL`
- `LAST_ACTIVITY_KNOWN`
- `AGE_UNKNOWN`
- `EXCLUDED_PINNED/AUDIO/GROUP/CURRENT`
- `ARCHIVED_THEN_CLOSED`

**Do not copy:** do not infer pre-install age; do not silently close; do not request history/page-content permissions merely to make a “smart” score if URL/title and observed activity are enough.

### Opportunity Score
**88/100** — strong direct evidence and fit, but this is a refinement of the already-recorded Workspace Session Capsule rather than a new independent product fingerprint.

---

## Signal B — Opera reverses a familiar tab layout after direct behavior evidence

**Classification:** CONFIRMED direct browser UX signal  
**Date:** 2026-09-10  
**Sources:**
- https://press.opera.com/2026/09/10/opera-turns-vertical-tabs-upside-down/
- https://blogs.opera.com/news/2026/09/opera-turns-vertical-tabs-upside-down/

### Job-to-be-Done
Opening a new tab should be a low-friction, high-frequency action even in vertical-tab layouts.

### What changed
Opera moved the New Tab button and newest tabs to the top of the vertical strip. Its own August/September survey of **4,900 Opera One users with Vertical Tabs enabled** found over 73% reported opening new tabs by clicking the button. This is a vendor-run product survey, not an independent browser-market statistic.

### Transferable principle
For a high-frequency action, physical/visual distance and placement can matter more than copying the market-standard layout. Opera also preserves a setting to revert to the prior behavior.

### Reese-max absorption
**MaterialYouNewTab SHOULD BE BETTER:** rank controls by actual repeated user action, not by conceptual grouping. Command Palette, quick add, workspace resume and session actions should be reachable without long pointer travel or extra drawers.

**Do not copy:** do not redesign navigation from a competitor screenshot; use this only as evidence that reversible UX experiments on frequent actions can be rational.

### Opportunity Score
**76/100** — useful interaction-design principle, not a standalone feature opportunity.

---

## Signal C — Alteryx One: approved business logic becomes a reusable AI-facing asset

**Classification:** CONFIRMED adjacent / emerging enterprise workflow  
**Dates:** 2026-09-08 to 2026-09-09; current September release  
**Sources:**
- https://www.alteryx.com/platform/whats-new
- https://www.alteryx.com/about-us/newsroom/press-release/alteryx-launches-new-ai-capabilities-to-bring-governed-analytics-anywhere-work-happens
- https://help.alteryx.com/aac/en/agent-studio.html
- https://help.alteryx.com/aac/en/release-notes/release-notes-for-agent-studio.html

### Job-to-be-Done
Teams already have approved calculations, datasets and workflows. They need agents to use that business logic without analysts rebuilding the same logic in every chat, prompt, notebook or MCP client.

### Why this saves steps / improves reliability
Alteryx positions the workflow/data layer as canonical and lets Agent Studio, external AI clients, MCP-compatible agents and an OpenAI integration access those assets. Permissions inherit from existing Alteryx access rather than being recreated inside each agent.

### Onboarding / distribution pattern
- Agent Studio is the configuration surface for datasets/workflows/apps and agent access.
- External AI apps connect through an MCP server or supported marketplace integration.
- The authenticated user only sees assets they are permitted to access.
- The September 8 release expanded the MCP Server from 2 to 7 toolsets, including knowledge, formula validation, assets and datasets.

### Capability pattern
`Governed source/workflow → approved asset → permissioned tool exposure → external AI client → auditable execution/result`.

### Pricing / business-model signal
Agent Studio access is tied to Alteryx One Professional/Enterprise. Alteryx docs state that beginning **2026-10-01**, qualifying workflow runs triggered through the MCP Server will consume Automation Credits. This is a product-design signal that agent access is becoming a metered execution surface, not evidence that the feature reduces total customer cost.

### Limitations
- This is first-party product evidence; performance/ROI claims are not independently verified here.
- An MCP gateway only governs traffic that actually traverses it.
- Workflow governance does not make the underlying data correct or current.

### Reese-max absorption
This reinforces an existing cross-portfolio primitive:

`Canonical evidence/business rule → permissioned projection → UI/MCP/WebMCP/plugin → same source identity + freshness + receipt`

Best fits:
- `taichung-police-intel`
- `taiwan-intel-dashboard`
- `tick-stock-panel`
- `academic-mcp`
- `lplrs-judicial-sync`

**Do not copy:** do not add a generic “Agent Studio”; do not rebuild the same metric/source rule in each interface; do not treat transport permission as data-quality proof.

### Opportunity Score
**87/100** — high reuse, but same family as the portfolio’s existing evidence-distribution and transport-neutral contract work.

---

## Signal D — OpenAI Data plugin: metric definitions and connected permissions travel into the analysis conversation

**Classification:** CONFIRMED adjacent workflow  
**Date:** 2026-09-10  
**Sources:**
- https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- https://help.openai.com/en/articles/20001518

### Job-to-be-Done
A user wants to investigate a business question without manually exporting data, re-explaining team metric definitions, and rebuilding a dashboard outside the conversation.

### Why it saves steps
The Data plugin can analyze connected business data, follow up on changes, create interactive dashboards/reports, and incorporate team metric definitions/business context. Connected-account permissions and workspace controls continue to apply.

### Transferable principle
A useful analysis contract needs more than rows: it also needs **metric semantics, source access context, and follow-up lineage**.

### Reese-max absorption
For `tick-stock-panel`, `taiwan-intel-dashboard`, and public-intelligence products, a future agent-facing result should carry:
- definition/version of computed metrics;
- source coverage and `as_of`;
- permission/source boundary;
- query/analysis revision;
- citation/source IDs.

This is already consistent with existing portfolio provenance/freshness work, so no duplicate issue is warranted.

**Do not copy:** do not turn every dashboard into chat; do not let a conversational answer erase coverage gaps or stale data.

### Opportunity Score
**84/100**.

---

## Signal E — Avid + Google Cloud: media search, prep automation and editing move into one governed surface

**Classification:** CONFIRMED direct/adjacent professional-media workflow  
**Date:** 2026-09-11  
**Sources:**
- https://www.googlecloudpresscorner.com/2026-09-11-Avid-and-Google-Cloud-Expand-Strategic-Partnership-to-Deliver-Browser-Based-Media-Composer-and-Agentic-Creative-Workflows
- https://www.avid.com/press-room/2026/08/avid-shows-the-future-of-agentic-editing-at-ibc2026
- https://www.avid.com/press-room/2026/09/avid-content-core-expands-with-insights-and-intelligent-media-management-at-ibc2026

### Job-to-be-Done
Professional editors lose time moving between footage archives, transcript search, logging/tagging, preparation and the timeline editor.

### Why it saves steps
Avid’s announced workflow combines:
- semantic search over generated transcripts/descriptions;
- natural-language prep such as syncing media, transcribing/alignment and bin organization;
- browser-based editing;
- Gemini panel for B-roll/stock/tagging/logging/translation;
- Content Core as the asset/workflow context layer.

The vendor’s own Q2 survey reports 120 professional editors; those percentages are vendor research and are not treated here as independent evidence of performance.

### Distribution / integration pattern
AI is embedded into the established editor/content-core workflow rather than requiring a separate AI app. Avid also emphasizes hybrid-cloud deployment and customer-controlled cloud environments for high-resolution assets.

### Pricing / business model
Media Composer retains tiered commercial plans, including a free First edition and paid Standard/Ultimate/Enterprise tiers. This signals that AI-assisted preparation is being packaged into the professional workflow rather than sold only as a separate AI tool.

### Limitations
Several showcased agentic/browser capabilities are rollout/preview-stage product announcements, not evidence of production efficiency on Reese-max workloads.

### Reese-max absorption
**video-timeline-pipeline SHOULD BE BETTER:** keep search, Ask, visual evidence escalation and future action handoff tied to one `EvidenceOccurrence` identity. If a future UI can hand an evidence window to an editor/tool, the handoff should carry timestamps/hashes rather than copy-pasted text.

**Do not copy:** do not build a full NLE/editor; do not replace stable local ingest with a vendor-specific cloud pipeline.

### Opportunity Score
**86/100** — strong direction but already covered by #5/#10 fingerprints.

---

## Signal F — Gemini desktop for Windows: ambient invocation becomes distribution

**Classification:** CONFIRMED adjacent distribution signal  
**Date:** 2026-09-11  
**Source:** https://workspaceupdates.googleblog.com/2026/09/the-gemini-desktop-app-is-now-available-for-Windows.html

### Job-to-be-Done
Users want assistance while staying inside current work rather than switching to a separate browser tab/app and restating context.

### Pattern
- `Alt + Space` summons Gemini over active work.
- Gemini can use Workspace data such as Gmail/Drive for summaries.
- Admins control the app through existing Workspace generative-AI settings.
- Google calls this the beginning of native Windows desktop capabilities.

### Reese-max absorption
Treat **invocation surface** as replaceable. Products should expose stable commands/contracts first; desktop shortcut, web UI, CLI, Discord/LINE or agent surface can then invoke the same canonical operation.

**Do not copy:** do not build a desktop wrapper merely because large vendors have one; a wrapper without unique local capability would create another state surface.

### Opportunity Score
**78/100**.

---

# New Releases

| Date | Product | Release / change | Evidence | Reese-max relevance |
|---|---|---|---|---|
| 2026-09-11 | Tab Manager AI | v4.0.0 auto-archive, preview, archive-before-close, exclusions, restore/export | CONFIRMED | `MaterialYouNewTab`: reversible cleanup candidate, not silent automation |
| 2026-09-11 | Gemini desktop | Windows 10/11 desktop app; Alt+Space ambient invocation | CONFIRMED | Distribution pattern only; avoid shell duplication |
| 2026-09-11 | Avid + Google Cloud | Browser Media Composer + agentic prep + semantic media search | CONFIRMED | `video-timeline-pipeline`: evidence-to-action handoff inside one surface |
| 2026-09-10 | OpenAI | Data plugin in ChatGPT Work/Codex | CONFIRMED | Metric definition + source permission + analysis lineage |
| 2026-09-10 | Opera One | Vertical Tabs new-tab/newest-tab placement moved to top | CONFIRMED | High-frequency action placement, reversible UX experiment |
| 2026-09-09 | Alteryx One | Agent Studio/MCP/OpenAI integrations for governed analytics | CONFIRMED | Canonical business/evidence logic projected to external AI |
| 2026-09-08 | Alteryx Agent Studio | MCP Server expanded from 2 to 7 toolsets | CONFIRMED | Tool growth needs permissioned canonical asset discovery |

---

# Community Pain Points

Community evidence below is anecdotal and is **not** used as a market-share/error-rate estimate.

1. **Tab/session tooling is extremely fragmented.** A 2026-08-15 `r/chrome_extensions` post curated more than 100 tab/session managers and explicitly described the ecosystem as fragmented. This supports **simplification and differentiation**, not a feature-count arms race.  
   Source: https://www.reddit.com/r/chrome_extensions/comments/1vp77kp/i_made_a_comprehensive_github_directory_of/

2. **Users still want small, obvious cleanup actions rather than a giant manager.** A 2026-09-06 TabTools post says its creator’s most-used capability is simply “close all tabs from the same site,” despite also offering sorting, duplicate/inactive cleanup and suggestions. A commenter immediately questioned why not use established tools. This is a useful COMMUNITY_SIGNAL that **one frequent action can matter more than breadth**, and that a new tab product needs a clear reason to exist.  
   Source: https://www.reddit.com/r/chrome_extensions/comments/1w8pcd3/i_built_tabtools_a_free_tab_management_browser/

3. **Aggressive automatic cleanup can feel destructive.** A 2026-05 project explicitly chose manual-by-default selection because existing tools felt too aggressive, with auto-kill off by default, pinned/audio exclusions, undo and a local/no-account model. This is older than the preferred 30–90 day window but remains a representative workflow constraint and aligns with Tab Manager AI’s newer v4 behavior.  
   Source: https://www.reddit.com/r/SideProject/comments/1t4f6j1/i_built_a_free_chrome_extension_that_closes/

4. **Local session products still raise portability/recovery questions.** Recent and older tab-manager discussions repeatedly ask whether saved work survives reinstall/device changes, and whether restoration can be selective rather than reopening everything. These are COMMUNITY_SIGNAL only; they support explicit export/import and missing-only restore rather than background sync by default.  
   Representative source: https://www.reddit.com/r/browsers/comments/17de56u/save_all_open_chrome_tabs_for_a_future_browsing/

---

# Adjacent Ideas

## 1. Reversible automation as a general product primitive

Tab Manager AI’s archive-before-close pattern is reusable beyond browsers:

`Candidate destructive action → Preview → Durable recovery point → Apply → Receipt → Restore`

Potential consumers:
- `MaterialYouNewTab`: stale tab cleanup/session restore;
- `note-filler`: bulk candidate changes;
- `92-duty-scheduler`: schedule edits;
- `flux-image-gen`: candidate revision promotion;
- `ai-novel-workstation`: bulk manuscript transforms.

This is not a new cross-portfolio framework requirement; most products already have candidate/canonical distinctions. Use it as a consistency rule.

## 2. Canonical metric/business definition travels with the data

Alteryx/OpenAI’s fresh releases reinforce that a useful agent-facing data surface should send:

`value + definition/version + source identity + coverage/as_of + permission boundary + calculation/workflow revision`

Potential consumers:
- `tick-stock-panel`
- `taiwan-intel-dashboard`
- `taichung-police-intel`
- `academic-mcp`
- `lplrs-judicial-sync`

## 3. Evidence-to-action handoff without copy/paste

Avid’s direction suggests a useful future bridge for media products:

`EvidenceOccurrence → ActionCandidate → target/editor handoff → target read-back → HandoffReceipt`

For `video-timeline-pipeline`, the first useful handoff is likely timestamps/clips/evidence packages, not a new full editing UI.

## 4. Ambient invocation is a shell, not a source of truth

Gemini desktop and existing Reese-max channel surfaces support a common rule:

`Canonical operation/service → multiple invocation surfaces`

The invocation surface must not own business state.

---

# Opportunity Scores

Scoring is heuristic and directional. Higher Implementation Effort / Security-Privacy-Cost Risk reduce build attractiveness; they do not erase evidence strength.

| Candidate | User Pain | Strategic Fit | Novelty | Evidence Strength | Reuse Potential | Impl. Effort | Risk | Score | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| MYNT reversible stale-tab hygiene | 9 | 9 | 6 | 9 | 7 | 5 | 4 | **88** | Research/refine existing session opportunity; no new Issue |
| Governed business/evidence logic projection | 8 | 9 | 6 | 10 | 10 | 7 | 7 | **87** | Same family as existing evidence/transport contracts |
| Video evidence → editor/action handoff | 8 | 9 | 7 | 9 | 7 | 7 | 6 | **86** | Keep in #5/#10 research family; no duplicate |
| Metric Definition + Analysis Receipt | 8 | 9 | 5 | 9 | 9 | 6 | 6 | **84** | Cross-portfolio design rule, not new subsystem |
| Prompt promotion variance-aware gate | 9 | 10 | 6 | 9 | 7 | 7 | 5 | **existing #3** | Latest audit reinforces; #4 CI first |
| Ambient desktop invocation | 6 | 5 | 5 | 10 | 7 | 8 | 6 | **78** | DO NOT build generic desktop shell now |
| Opera frequent-action placement lesson | 6 | 7 | 4 | 9 | 7 | 3 | 2 | **76** | UX principle only |

No candidate in this round both exceeded the practical new-Issue threshold **and** had a novel fingerprint not already represented in existing Reese-max work.

---

# Opportunity Map — All 37 Products

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| `cf-ai-router` | truthful provider/capability/cost state; fail-closed billable routes; fallback evidence | client-visible capability/availability semantics without leaking secrets | zero-cost/subscription-safe multi-provider routing with real fallback proof | gateway-delivered capability metadata if clients need it | opaque dynamic routing whose cost/provider cannot be known before send |
| `soundbox-offline` | deterministic local library/recovery | restore integrity + authoritative CI before source expansion | no-account/local-first playback | later network-library source with explicit cache/offline pin | subscription/cloud account just to play local files |
| `police-exam-archive` | source/year/page identity, durable attempt state | reduce PDF/context switching and manual source lookup | police-exam-specific archive/provenance | versioned question packs and migration receipts | more home-screen modes without fixing source gaps |
| `skill-foundry` | explicit certified revision and target compatibility | target read-back/drift truth | evidence-backed Skill certification | reusable distribution adapters | marketplace breadth before installed-state proof |
| `lobsterpulse` | reliable provider/session state | suppress correlated/no-action noise | decision-only attention queue | reversible attention policies | AI summary on every raw event |
| `prompt-autoresearch` | green canonical evidence CI; typed failures; repeatable evaluation | budget-aware paired replicates + `INCONCLUSIVE` | Taiwan legal essay corpus + hard risk gates + local lineage | cost-per-reliable-uplift receipt | hosted generic eval SaaS, provider marketplace, mobile app |
| `tick-stock-panel` | source freshness, coverage, partial/unknown truth | metric definition/version in every analysis | compact evidence-aware market panel | permissioned Data/MCP projection later | generic finance chatbot that hides stale/missing data |
| `clinical-scribe-worker` | auth/PHI boundary and clinical validation evidence | specialty packs + section-scoped reversible repair | source-grounded clinical drafting with explicit limits | validation-driven revision receipt | autonomous clinical action or EHR push before safety/auth proof |
| `avatar-vfo` | asset identity/output truth | deterministic handoff and revision state | bounded avatar/voice workflow | reversible candidate transforms | generic agent control center |
| `adng-memory` | retrieval provenance, stale state, retention scope | compact with source/revision lineage | memory designed for autonomous dev evidence | environment-aware memory portability | unbounded “remember everything” storage |
| `ai-flight-radar` | quote/source health, expiry, total-trip truth | typed watch state and reconfirmation | evidence-based fare/deal monitoring from Taiwan | post-booking reprice candidate research | auto-booking or stale aggregator price claims |
| `taiwan-intel-dashboard` | source/freshness/evidence coverage | carry metric/source definitions into agent surfaces | Taiwan-specific public-source intelligence | governed analysis projection | generic chat over unverified scraped text |
| `note-filler` | field/source provenance | candidate diff + explicit apply/rollback | structured completion with reviewable mutation | reversible bulk-fill candidate | silent overwrite of user-edited fields |
| `cyber-prep-coach` | content/source/version integrity | exam-blueprint version + progress migration | exam-specific mastery/evidence | migration receipt across syllabus versions | quiz-mode proliferation |
| `UkePack` | canonical musical artifact + export | reversible assistance | creator-controlled local creative toolkit | candidate-arrangement handoff | opaque AI replacement of the user’s arrangement |
| `autodev-ng` | principal/environment/effect/cost/evidence separation | compose existing contracts cleanly | multi-engine local-first autonomous dev with reviewer/evidence | policy/read-only control views over canonical state | monolithic “AI Control Plane” dashboard or blanket auto-approve |
| `ai-novel-workstation` | manuscript canonical state + revision lineage | preserve accepted human edits through AI operations | long-form continuity with reversible candidates | source/reference tray for research assets | single mutable chat buffer as manuscript truth |
| `herdr-skills` | candidate Skill vs promoted Skill | demonstration/correction lineage | multi-agent improvement loop | sanitized trace → candidate skill | auto-promoting one demonstration |
| `video-timeline-pipeline` | stable evidence identity/timestamps | hybrid retrieval + bounded local visual escalation | local-first replayable multimodal evidence | evidence clip/timestamp handoff to external editor | build a full NLE or replace ingest with vendor cloud |
| `chatgpt-dual-pipeline` | independent model/reviewer evidence | explicit cross-model disagreement/receipt | bounded two-engine workflow | shared candidate/evidence contract | extra model selector without better verification |
| `claude-mem` | source/retrieval provenance and privacy | stale-memory invalidation | persistent memory with inspectable lineage | scoped memory bundles per task/project | invisible global memory with no deletion/expiry truth |
| `lplrs-judicial-sync` | authoritative source identity/version/freshness | conflict-aware multi-source resolution | legal/judicial provenance | agent-facing evidence bundle | flatten conflicting sources into one “answer” |
| `internship-notes-sites-mirror` | source→published revision trace | simple publish/export receipt | focused notes publishing mirror | one-click verified handoff | adding CMS complexity without workflow need |
| `MaterialYouNewTab` | fast local new-tab/workspace basics | reversible session capture + stale-tab cleanup candidate/preview | Material You, local-first, minimal permissions | frequent-action placement experiments | full browser/tab-manager feature race; broad history/page permissions |
| `taichung-police-intel` | evidence/source health/publication receipt | same governed evidence contract through UI/MCP/WebMCP | police/public-sector evidence intelligence | metric/business-definition envelope | separate AI-only database or untraceable generated brief |
| `ninax-line-hermes` | channel identity/send scope/receipt | exact reply/send target preview | bounded LINE-agent bridge | decision-only escalation | agent gets blanket send authority |
| `92-duty-scheduler` | hard constraints and canonical schedule | candidate schedule + diff + approval receipt | police-duty constraints/workflow | reversible batch changes | silent AI rewrite of duty roster |
| `voice-actress` | rubric/source evidence per score | bind score to answer+rubric revision | police/law essay feedback with evidence | candidate rewrite suggestions | generic LMS/TTS breadth |
| `project-doctor-web` | diagnosis evidence | repair proposal vs applied repair | project maintenance diagnosis | bounded repair preview | automatic fixes without target read-back/runtime proof |
| `flux-image-gen` | generation/edit provenance | #22 persistent reference/edit session | local, branchable candidate art workflow | export/handoff to editable downstream tools | latest-image overwrite or model-count race |
| `neciken-summer-poem` | author text/revision integrity | minimal reversible suggestions | small focused literary experience | lightweight reference/motif memory | agentic workflow bloat |
| `minideck` | source-preserving slide transformation | editable handoff and provenance | lightweight deck generation | document claim→slide receipt | enterprise collaboration suite clone |
| `police-exam-practice` | reliable question/source mapping and attempt state | feedback quality and mistake loop | focused police-exam practice | versioned attempt/evidence export | extra game/mode count without pedagogy evidence |
| `ppt-studio` | auth/CI integrity and claim/source provenance | source-preserving editable transformations | evidence-linked slide generation | governed document→deck handoff | remote agent surface before fail-closed auth |
| `exam-archive` | stable source identity/index | fast retrieval and source preview | focused historical exam archive | cross-archive canonical question identity | AI summaries before indexing/source reliability |
| `academic-mcp` | canonical paper identity and source-specific state | bundle diff, partial/rate-limit truth | multi-source research with replayable evidence | metric/definition envelopes for bibliometrics | flatten rate-limit/unknown into “no result” |
| `cf-mcp-server` | exact-target confirmation, OAuth/identity, runtime verification | browser-usable consent and gradual rollout | safety-first Cloudflare MCP management | governed tool catalog/read-back | root-token-in-URL or gateway coverage claims beyond mediated paths |

---

# Top 10 Cross-Portfolio Ideas

1. **Reversible automation rule:** no automatic destructive action without a recoverable prior state when recovery is technically possible.
2. **Unknown is a first-class state:** pre-install tab age, stale data, partial source coverage, provider timeout and unverified external effect must not be normalized to certainty.
3. **Canonical business/evidence logic should be transport-neutral:** UI, MCP, WebMCP and plugins project the same source/workflow definitions.
4. **Metric Definition Receipt:** computed values should carry definition/version/source/as_of when used by agents or reports.
5. **Evidence-to-action handoff:** avoid copy/paste by passing stable IDs, hashes/timestamps and target read-back receipts.
6. **High-frequency action placement:** optimize the repeated path before adding more control surfaces.
7. **Shell independence:** desktop/CLI/chat/channel are invocation surfaces, not owners of product state.
8. **Preview before bulk state change:** cleanup, schedule edits, note repair, content transforms and session restore should show exact scope first.
9. **Selective restore/apply:** restore only missing/selected state rather than blindly reopening/reapplying everything.
10. **Simplify when the market is fragmented:** when dozens of competitors converge on feature breadth, differentiate with a narrower trustworthy job rather than matching every checkbox.

---

# Ideas Rejected / Deferred

## Rejected — Build a desktop wrapper for every product
Gemini’s Windows app is a distribution signal, not proof a Reese-max desktop shell creates value. It would duplicate state, updater/security burden and UI without fixing a core JTBD.

## Rejected — Turn MaterialYouNewTab into a full tab manager
The tab/session market is already heavily fragmented. The product should absorb only session continuity and reversible hygiene primitives that strengthen its new-tab/workspace job.

## Deferred — Automatic stale-tab cleanup as a standalone MYNT Issue
Valuable, but same family as the previously recorded Workspace Session Capsule. Keep it as a refinement until that base state model exists.

## Rejected — Generic Alteryx-style Agent Studio
Reese-max products already have domain-specific state and evidence contracts. A generic agent-building layer would create another configuration/control plane.

## Rejected — Full video editor inside `video-timeline-pipeline`
Avid proves integration value, not the need to reproduce Media Composer. Keep the product focused on trusted extraction/search/evidence and handoff.

## Rejected — Replace prompt-autoresearch with LangSmith/promptfoo/DSPy/Braintrust
The latest internal audit and external comparators support restoring evidence trust and variance-aware promotion, not rewriting the vertical legal workflow.

## Deferred — Client-consumable gateway pricing/capability manifest for `cf-ai-router`
Potentially useful as third-party clients become gateway-aware, but current zero-cost/fail-closed routing does not yet show a high-value user pain that warrants another contract Issue.

---

# Issue Mapping / Coordination

| Candidate / signal | Existing issue / PR overlap | Action this round |
|---|---|---|
| MYNT stale-tab hygiene | Same family as prior Workspace Session Capsule research | Central report only; no duplicate issue |
| Prompt variance-aware evaluation | `prompt-autoresearch #3`; latest audit says #4 first | No update needed; fresh audit already captures priority |
| Prompt evidence/CI reliability | `prompt-autoresearch #4` | No external-inspiration scope expansion |
| Video semantic search / evidence | `video-timeline-pipeline #5` | No duplicate |
| Video task-specific visual escalation | `video-timeline-pipeline #10` | Avid signal recorded centrally only |
| Clinical omission / specialty validation | `clinical-scribe-worker #4` | No duplicate |
| Clinical section repair/revision | `clinical-scribe-worker #7` | No duplicate |
| Governed evidence projection | Existing `taichung-police-intel` evidence-distribution direction + portfolio provenance work | Central report only |
| Agent principal/environment/effect governance | `autodev-ng #17/#21/#12` | No generic control-plane issue |
| Skill installed-state/drift | `skill-foundry #4` | No duplicate |

No active `github-issue-lock:v1` scope was contested because this round created/updated **no product Issue**.

---

# Sources

## CONFIRMED — first-party/current
- 2026-09-11 — Tab Manager AI v4.0.0 release notes: https://tabai.site/
- Current — Tab Manager AI Auto-Archive design: https://tabai.site/articles/en/auto-archive-stale-tabs
- 2026-09-10 — Opera Vertical Tabs change: https://press.opera.com/2026/09/10/opera-turns-vertical-tabs-upside-down/
- 2026-09-10 — Opera product reasoning + vendor survey context: https://blogs.opera.com/news/2026/09/opera-turns-vertical-tabs-upside-down/
- 2026-09-11 — Gemini desktop app for Windows: https://workspaceupdates.googleblog.com/2026/09/the-gemini-desktop-app-is-now-available-for-Windows.html
- 2026-09-11 — Avid + Google Cloud browser Media Composer / agentic workflows: https://www.googlecloudpresscorner.com/2026-09-11-Avid-and-Google-Cloud-Expand-Strategic-Partnership-to-Deliver-Browser-Based-Media-Composer-and-Agentic-Creative-Workflows
- 2026-08-27 — Avid Media Composer 2026.8 / agentic editing preview: https://www.avid.com/press-room/2026/08/avid-shows-the-future-of-agentic-editing-at-ibc2026
- 2026-09-08 — Avid Content Core / governed orchestration: https://www.avid.com/press-room/2026/09/avid-content-core-expands-with-insights-and-intelligent-media-management-at-ibc2026
- 2026-09-09 — Alteryx AI capabilities announcement: https://www.alteryx.com/about-us/newsroom/press-release/alteryx-launches-new-ai-capabilities-to-bring-governed-analytics-anywhere-work-happens
- September 2026 current release — Alteryx One What’s New: https://www.alteryx.com/platform/whats-new
- 2026-09-08 — Alteryx Agent Studio release notes: https://help.alteryx.com/aac/en/release-notes/release-notes-for-agent-studio.html
- Current — Alteryx Agent Studio access/governance: https://help.alteryx.com/aac/en/agent-studio.html
- 2026-09-10 — OpenAI ChatGPT release notes, Data plugin: https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- Current — OpenAI Data plugin usage/access: https://help.openai.com/en/articles/20001518

## COMMUNITY_SIGNAL — anecdotal, not statistical
- 2026-08-15 — Fragmented tab/session-manager directory: https://www.reddit.com/r/chrome_extensions/comments/1vp77kp/i_made_a_comprehensive_github_directory_of/
- 2026-09-06 — TabTools / small frequent-action workflow: https://www.reddit.com/r/chrome_extensions/comments/1w8pcd3/i_built_tabtools_a_free_tab_management_browser/
- 2026-05-05 — Manual-by-default inactive-tab cleanup / fear of destructive automation: https://www.reddit.com/r/SideProject/comments/1t4f6j1/i_built_a_free_chrome_extension_that_closes/
- Representative recovery/portability discussion: https://www.reddit.com/r/browsers/comments/17de56u/save_all_open_chrome_tabs_for_a_future_browsing/

---

# What Changed Since Last Radar (2026-09-12 r2 → r3)

1. **Portfolio count remains 37**; no new Reese-max unarchived product-like repository appeared.
2. `prompt-autoresearch` added a new 2026-09-12 Product Board audit after r2. It explicitly prioritizes #4 evidence/CI repair before #3 variance-aware promotion and rejects generic hosted-eval expansion.
3. A new direct browser signal appeared: **Tab Manager AI v4.0.0 (2026-09-11)** makes stale-tab automation previewable and reversible, with truthful pre-install-history limitations. This refines the existing MYNT session opportunity but does not create a new fingerprint.
4. **Opera’s 2026-09-10 Vertical Tabs reversal** adds a useful evidence-backed simplification lesson: frequent-action distance can justify changing a familiar convention, while keeping rollback preference.
5. **Alteryx’s September Agent Studio/MCP/OpenAI release** adds fresh cross-vendor evidence that approved business logic/permissions are becoming portable agent assets. This reinforces existing Reese-max provenance/transport work; it does not justify a new Agent Studio/control plane.
6. **OpenAI Data plugin (2026-09-10)** adds a parallel signal around team metric definitions, connected permissions and analysis lineage.
7. **Avid + Google Cloud (2026-09-11)** adds professional-media evidence that semantic search, preparation automation and editing are converging in one workflow surface. Existing `video-timeline-pipeline #5/#10` already cover the relevant retrieval/evidence primitives.
8. No new high-value non-duplicate Issue was created or updated. The central radar history is the only GitHub mutation in this round.

## Round Decision

**NO_NOTIFICATION_THRESHOLD_CROSSED.** Fresh signals were useful but either (a) refined already-recorded opportunities, (b) validated existing issues, or (c) were distribution/UX patterns below the threshold for a new Reese-max product direction.
