# External Competitive / New-Product / Workflow Radar — 2026-09-23T04:03:13Z

## Status / Scope / Evidence Boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY / 0_NEW_ISSUES**.
- Owner scope: `Reese-max` only. No third-party repository was modified.
- Issue-quality rules re-read from `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected-owner pagination returned **42 Reese-max-owned repositories / 41 unarchived**; page 2 was empty. `obsidian-vault` remains archived and excluded from the active set. Older inventories were not used as the denominator.
- Fair-rotation focal repo: `Reese-max/video-timeline-pipeline`, carried from `2026-09-23T021000Z-external-radar.md`.
- Focal default branch before report write: `main@664bb6a3e2fb5b4ca2d80f28ec3661a5666b41fd`.
- The current HEAD was created at 2026-09-23T03:45:09Z by merging PR #25, `fix: server-first video analysis with optional Drive review`.
- Current owner posture remains **INVEST / SIMPLIFY / evidence-truth-first**: local/server evidence generation is the core path; external-host/media handoff is optional and must not become a generic hosted asset platform, universal provider framework, full NLE or generative-media suite.
- Active/open scopes rechecked before deciding: #22/PR #24 MiniMax completion-state/cache admission; #5/PR #21 grounded retrieval/citations; #18/PR #19 timezone accounting; #10/PR #16 bounded visual escalation; #11/PR #15 Evidence→NLE handoff; #20 C2PA provenance; #23 ChatGPT file handoff. None was taken over.
- No provider call, paid request, live ChatGPT/browser acceptance run, Drive mutation, NLE import, product branch, merge, deployment, worker/GOAL, product source/config/CI/secrets/settings change was performed by this radar.

## Executive Decision

This round found **no new Issue that passes the four gates**.

The material change is a **scope calibration of the existing ChatGPT handoff direction**. Since the prior 2026-09-21 radar, PR #25 has landed on default branch and made the core widget flow:

`public/authorized URL → MCP download/segment → server-side Groq transcription + MiniMax sampled visual analysis → ChatGPT organizes returned evidence`

Drive is now optional storage/original-MP4 review, and the main flow no longer depends on native MP4 attachment handoff. Current README/source says the widget automatically calls `analyze_prepared_video`; Drive/native attachment paths are not the canonical analysis substrate.

Fresh external evidence supports that choice:

1. OpenAI's current plugin contract still treats file helpers as **optional** host extensions that must be feature-detected.
2. Recent OpenAI Developer Community reports show a concrete failure mode where an attachment can appear accepted or have a file/path identity while its contents are not exposed to the execution/retrieval layer. These are community reports, not a prevalence estimate.
3. A current direct competitor, ScreenApp, owns ingestion/processing server-side and exposes transcript, timestamps, chapters, visual-frame analysis and chat as derived evidence rather than relying on a downstream chat host to mount raw media.

Therefore the old #23 assumption — “ChatGPT native file handoff is the blocker for the core video-analysis job” — should no longer be treated as a core prerequisite. The remaining value is narrower: optional original-media review when the evidence-quality receipt says server analysis is insufficient, or host-compatibility validation when a supported ChatGPT surface exposes the relevant capability.

Because PR #25 merged only minutes before this scan and its source branch still exists, ownership is treated as recently active/ambiguous. This radar **does not comment on, relabel, close or rewrite #23**. The calibration is recorded centrally as `SKIPPED_LOCKED / RECENT_RELATED_MERGE` and can be reconciled after live v11 acceptance evidence exists.

---

# Product → Market Category

| Product | Market / substitutes | Current differentiated job |
|---|---|---|
| `video-timeline-pipeline` | ScreenApp / BibiGPT-style video knowledge workspaces; ChatGPT/MCP media handoff; Gemini/TwelveLabs video understanding; Descript/Premiere editing | Public/authorized media → resumable evidence → transcript/visual timeline → truthful quality state → ChatGPT/user review, with optional raw-media handoff rather than raw-media handoff as the prerequisite |

# External Signals

## A. Direct competitor — ScreenApp keeps ingestion and evidence generation inside the video product

**CONFIRMED current product capability — ScreenApp page last updated 2026-09-19; facts on the page say last verified 2026-09-12; checked 2026-09-23.**

Source:
- https://screenapp.io/features/ai-summarizer

ScreenApp currently accepts uploads or links from YouTube, Vimeo, TikTok, Instagram, Facebook and a broader generic-import list including Twitch, Loom, Google Drive, Dropbox, X, Threads, Douyin, Kuaishou and Bilibili. It then produces speaker-labelled transcript, timestamped chapters, frame-aware notes, AI chat and exports such as PDF/DOCX/TXT/SRT/VTT. Its current page lists the annual-billed paid entry at $19/month; that price is a vendor/current-page fact, not evidence of value for Reese-max users.

### User job / workflow signal

The important pattern is not “support every platform.” It is that the video system itself owns the fragile ingest/processing boundary and gives the conversational layer a structured, timestamped evidence surface. That reduces repeated cross-tool copying and avoids treating a generic chat attachment pipeline as the canonical source-processing contract.

### Transferable part

Keep `video-timeline-pipeline`'s current server-first analysis path canonical, preserve source hash/revision/quality receipt, and use raw MP4 handoff only when the evidence path specifically needs human/model original-media review.

### Do not copy

Do not copy ScreenApp's hosted recording library, meeting bot, broad SaaS import catalog, cloud-sync/account system or pricing model without user/repo evidence. Those would materially expand custody, privacy, maintenance and distribution scope.

---

## B. Host/platform contract — ChatGPT file helpers remain optional, and recent community failures show why capability detection is not merely theoretical

### B1. First-party contract

**CONFIRMED — OpenAI Plugins reference/changelog, current docs checked 2026-09-23; capability changelog dates 2026-03-09 and 2026-03-24.**

Sources:
- https://developers.openai.com/plugins/reference
- https://developers.openai.com/plugins/changelog

OpenAI documents `window.openai.uploadFile`, `selectFiles` and file-library helpers as optional extensions. The reference explicitly says the ChatGPT file library may not be available to every user and that clients should feature-detect relevant helpers. Non-image uploads were added on 2026-03-09; file-library helpers followed on 2026-03-24.

This was already known in the 2026-09-21 radar. The new repo delta is that default branch now actually makes server analysis primary rather than merely keeping fallback paths.

### B2. Community pain

**COMMUNITY_SIGNAL — OpenAI Developer Community, 2026-09-01 through 2026-09-20; checked 2026-09-23.**

Sources:
- https://community.openai.com/t/mp4-attachments-accepted-by-chatgpt-but-unavailable-to-the-processing-environment/1393990
- https://community.openai.com/t/gpt-5-6-sol-the-retrieval-indexing-layer-is-failing-to-expose-attachment-contents/1399092
- https://community.openai.com/t/bug-multi-file-upload-state-unclear-and-attachments-disappear/1399325
- https://community.openai.com/t/video-attachment-is-not-included-in-sent-messages-and-may-cause-the-macos-app-to-crash-when-switching-chats/1384492/2

Observed reports include:
- an MP4 attachment appearing registered with an ID/path while the execution environment could not read the bytes;
- project/chat attachments whose contents were not exposed to retrieval/indexing even though attachment identity remained visible;
- ambiguous multi-file upload state;
- an OpenAI Support reply on 2026-09-07 stating video-file attachments are supported **where available** while not confirming a fix for the reported macOS behavior.

These reports **do not establish incidence, current global outage or a permanent platform limitation**. They do establish a plausible and recent failure class matching the product's observed concern: `attachment identity/UX acceptance != model/runtime-readable bytes`.

### Transferable part

A handoff receipt should distinguish at least:
- host capability exists;
- attachment/reference was accepted;
- model/runtime actually received readable bytes;
- analysis evidence was produced.

Current server-first v11 sidesteps this entire chain for the main path, which is smaller and more reliable than building a more elaborate host-file bridge as a prerequisite.

---

## C. Adjacent workflow — Descript exposes per-file processing progress and explicit recovery when edits cannot be merged

**CONFIRMED — Descript release roundup 2026-09-17; checked 2026-09-23.**

Source:
- https://feedback.descript.com/changelog/release-roundupseptember-17-2026

Descript's September roundup includes browser-side Google Drive import, per-file upload/processing progress rows instead of a single batch bar, and a visible recovery modal when concurrent edits cannot be merged. It also continues to expand AI generation/editing, which is intentionally out of scope here.

### Transferable part

For long or multi-segment media, make the **real bounded state** visible: which file/job is busy, complete, partial, needs review or failed. Current v11 already adds typed `busy`, bounded retries, `partial/error`, and `AnalysisQuality` rather than inventing an ETA or silent background queue. That is sufficient for now.

### Do not copy

Do not build collaboration merge machinery, a media editor or generative audio/video suite. There is no Reese-max evidence that those are the current job.

---

# New Releases / Current Changes

| Date | Signal | Relevance | Decision |
|---|---|---|---|
| 2026-09-23 | `video-timeline-pipeline` PR #25 merged; server-first analysis becomes default, Drive optional | removes native MP4 handoff from core-path dependency | current direction; needs live host acceptance evidence |
| 2026-09-20 | ChatGPT community report: multi-file attachment state unclear/disappearing | host attachment UX can diverge from actual accepted state | `COMMUNITY_SIGNAL`; supports fail-closed receipts, no new Issue |
| 2026-09-19 | ChatGPT community reports retrieval/indexing not exposing attachment contents | identity/reference can exist without consumable contents | `COMMUNITY_SIGNAL`; supports server-first default |
| 2026-09-19 | ScreenApp current summarizer page updated | direct competitor emphasizes owned ingestion + timestamped/visual evidence + chat | confirms evidence-workspace pattern; no catalog-expansion Issue |
| 2026-09-17 | Descript release roundup | per-file progress/recovery visibility | `ADJACENT IDEA`; current typed states already cover minimum need |

# Community Pain

The retained community signal is specific and bounded: **file/attachment presence is not always equivalent to downstream-readable content**. No community post is converted into market prevalence, SLA, user frequency, severity or ROI. Reports conflict in timing/surface and some users later reported recovery, so this evidence only justifies capability detection/fail-closed semantics and architecture that does not depend on the fragile path.

# Repository Delta / Counterevidence

Current default HEAD `664bb6a3...` is **8 commits ahead** of the focal HEAD used by the 2026-09-21 radar (`c8690059...`). Relevant current evidence:

1. PR #25 is merged and states the default widget flow is MCP download → Groq transcription / MiniMax visual analysis → ChatGPT summary/evidence organization.
2. Current README says the widget automatically calls `analyze_prepared_video`; the main flow no longer depends on native MP4 attachment or Drive.
3. Current `UI_META` describes Drive as optional storage/original-media review.
4. Current `upload_prepared_video_to_drive` description likewise says to use Drive for optional storage or original-MP4 review when server-analysis quality is insufficient or the user explicitly requests it.
5. Widget tests intentionally fail if native `uploadFile()` / `getFileDownloadUrl()` are invoked on the default test flow; this is repository test intent, not proof that the live ChatGPT host behaves correctly.
6. PR #25 reports 98 Python tests OK (2 Windows-side skips) plus 21 widget scenarios, but explicitly says **live deployment and ChatGPT browser acceptance are not yet completed**. Therefore v11 remains `NEEDS_RUNTIME_VERIFICATION` for the real host.
7. #23 is still open and its body says native ChatGPT file-reference handoff is the current blocker. That statement predates the merged server-first default and is now too broad for the core job.
8. PR #24 (#22), PR #21 (#5), PR #19 (#18), PR #16 (#10) and PR #15 (#11) remain open active scopes; this radar does not modify them.

Counterevidence against a new feature:
- the core server-side analysis path now exists on default branch;
- optional native file helpers are documented, but host/runtime availability is not a stable universal contract;
- no runtime evidence shows the new server-first path itself is inadequate enough to require a new architecture;
- broad source catalogs and hosted libraries already exist in competitors, but no current owner/user workflow proves those breadth features are the bottleneck.

# Adjacent Ideas

## 1. Narrow #23 to optional original-media review after v11 acceptance — central calibration only

After one real ChatGPT v11 run proves server analysis → evidence → model response, treat native/Drive raw-media handoff as an **optional evidence-quality escalation**, not the mandatory core pipeline.

Minimum validation:
1. run one authorized public-video fixture through v11;
2. verify server-side transcript/visual/timeline evidence is actually visible to the model;
3. verify `quality.status=evidence_available` ends without native MP4/Drive handoff;
4. use an intentionally low-quality/insufficient fixture to verify `needs_review` can request optional original-media review without silently calling it success;
5. if native host file helpers are absent, the core result must remain usable rather than fail.

Do not add a host-adapter registry, file-bridge service, background uploader or second analysis engine.

Current classification for the historical #23 scope:
- core feature prerequisite: **no longer established on current main**;
- remaining kind: `OPPORTUNITY / VALIDATION_GAP`;
- severity: `NOT_ESTABLISHED`;
- decision_priority: `MEDIUM` until live v11 acceptance;
- triage: `NEEDS_EVIDENCE`;
- auto_implementation: `false`;
- runtime: `NEEDS_RUNTIME_VERIFICATION`;
- coordination: `SKIPPED_LOCKED / RECENT_RELATED_MERGE` because PR #25 merged at 2026-09-23T03:45:10Z and its branch still exists during this scan.

Exit:
- **NARROW** if server-first covers normal analysis and raw-media review is only occasional;
- **BUILD_SMALL** only if a supported, repeated original-media review path demonstrably cannot be completed with current optional handoff;
- **REJECT** if server evidence plus representative frames is sufficient for supported jobs and raw MP4 handoff adds no validated value.

## 2. Per-file/segment progress — HOLD

Current typed `busy/partial/error` states and bounded 5/10/20-second retries are sufficient until a real long/multi-segment run shows users cannot tell which segment failed/stalled. If that occurs, first expose existing per-segment state/receipts. Do not build a durable task system solely to imitate Descript's progress UI.

## 3. Broader generic importer — REJECT_FOR_NOW

ScreenApp demonstrates broad source import as a commercial distribution pattern. Reese-max already has concrete public-media workflows under active maintenance. Without a specific unsupported source repeatedly blocking the target workflow, adding TikTok/X/Threads/Dropbox/Bilibili adapters is breadth without evidence.

# Opportunity Map — `video-timeline-pipeline`

| Category | Decision | Reason |
|---|---|---|
| **MUST MATCH** | Do not equate attachment/reference acceptance with model-readable bytes | OpenAI optional file contract + recent community failure mode + existing #23 evidence |
| **MUST MATCH** | Core analysis must remain useful when native host file helpers are absent | current v11 architecture; smaller than making host upload a prerequisite |
| **SHOULD BE BETTER** | Validate v11 on a real ChatGPT host and preserve truthful `partial/needs_review` state | PR #25 explicitly lacks live/browser acceptance evidence |
| **SHOULD BE BETTER** | If long/multi-segment runs show confusion, expose real per-file/segment state rather than global optimistic progress | Descript workflow pattern; no current issue threshold |
| **DIFFERENTIATOR** | Local/server evidence-first pipeline with source identity, bounded cloud actions and optional raw-media review | avoids dependence on hosted library or chat-host attachment substrate |
| **ADJACENT IDEA** | raw original-media review only after an evidence-quality escalation | narrows #23 rather than expanding product scope |
| **DO NOT COPY** | hosted recording library, meeting bot, generic cloud-sync/account system, source-marketplace breadth | high custody/maintenance burden; no validated user gap |
| **DO NOT COPY** | generative editing/music/SFX suite or collaboration merge system | owner scope rejects full editor/generative-suite expansion |

# Four-Gate Decisions

## Candidate A — Keep native/raw-media handoff as a core prerequisite

### Gate 1 — Problem / Value

The original #23 problem was real for the then-current flow: prepared MP4/reference identity did not guarantee model-readable media. Current main now solves the core user job through server-side analysis without relying on that handoff. External first-party docs say the helper itself is optional, and community reports show attachment identity/content accessibility can diverge.

**Result: the original blocker is not established for the current core path.** Remaining value is optional review compatibility.

### Gate 2 — Priority

- kind: `OPPORTUNITY / VALIDATION_GAP`
- severity: `NOT_ESTABLISHED`
- decision_priority: `MEDIUM`
- triage: `NEEDS_EVIDENCE`
- auto_implementation: `false`

No P1/P2: no current-main runtime failure of the server-first path was produced in this run; current PR tests are not live-host evidence.

### Gate 3 — Minimum solution

Do **not** add architecture. First run a single live v11 acceptance fixture. If the default path succeeds, narrow raw-media handoff to `needs_review` or explicit user-requested review only. If it fails, fix the smallest observed boundary with the actual receipt from that run.

### Gate 4 — Research / implementation separation

No implementation is authorized. #23 is not modified this round because a related PR merged minutes before the scan and the related branch remains present. Record the scope calibration centrally and revisit after the current owner work settles.

**Decision: NARROW_PENDING_RUNTIME / NO NEW ISSUE / SKIPPED_LOCKED.**

## Candidate B — Add broad source catalog because ScreenApp supports it

### Gate 1

Competitor capability is confirmed, but there is no current Reese-max user/repo evidence that unsupported source breadth is a recurring core-work failure.

### Gate 2

`OPPORTUNITY / NOT_ESTABLISHED / LOW / NEEDS_EVIDENCE / auto_implementation=false`.

### Gate 3

No change. Only add a source adapter when a concrete source repeatedly blocks an owner-approved workflow and there is a legal/stable acquisition path.

### Gate 4

No research Issue needed; retain as market context.

**Decision: REJECT_FOR_NOW / NO ISSUE.**

## Candidate C — Add a durable per-segment progress system

### Gate 1

Descript's per-file progress is a good UX pattern, but current v11 already exposes bounded `busy`, retry and partial/quality states. No observed supported run shows that these are insufficient.

### Gate 2

`OPPORTUNITY / NOT_ESTABLISHED / LOW / NEEDS_EVIDENCE / auto_implementation=false`.

### Gate 3

If evidence appears, first surface already-known segment/job state. Do not introduce a DB/state machine/service solely for a progress UI.

### Gate 4

No implementation right.

**Decision: HOLD / NO ISSUE.**

# Issue Mapping / Dedupe / Coordination

- **0 new Issues.**
- **#23** — scope now needs calibration after PR #25, but no comment/relabel/close this round due very recent related merge/branch presence. Central status: `NARROW_PENDING_RUNTIME / SKIPPED_LOCKED`.
- **#22 / PR #24** — MiniMax completion/truncation cache admission remains distinct and active; untouched.
- **#5 / PR #21** — grounded retrieval/citation identity active; untouched.
- **#10 / PR #16** — bounded agentic visual evidence escalation active; no duplicate from generic “AI can watch video” signals.
- **#11 / PR #15** — Evidence→NLE handoff active; Descript editing/generative updates do not expand scope.
- **#20** — C2PA provenance research remains independent.
- **#4/#8/#18** safety/accounting roots remain independent; no severity change from competitor/product marketing.

No Issue is treated as permission to start a worker, branch, merge, deploy, paid provider call or external write.

# Rejected Ideas and Reasons

- **Build host-specific upload orchestration as the new core** — rejected; optional host capability plus recent host-content-access failures make it a fragile prerequisite, while current main already has a smaller server-first route.
- **Copy ScreenApp's full hosted video workspace/import catalog** — rejected; product breadth is not current user evidence and would expand custody/privacy/account scope.
- **Copy Descript's full editor/generative media stack** — rejected by owner direction and existing #11's explicit handoff-not-editor scope.
- **Add a persistent background queue for widget busy state** — rejected; current bounded retry intentionally does not pretend to be durable background execution. Only a demonstrated long-run recovery failure can justify that infrastructure.
- **Treat community attachment reports as proof ChatGPT files are globally broken** — rejected; they are anecdotal, surface/version-dependent reports and some threads show later recovery.

# Cross-Portfolio Idea

One reusable principle is retained without opening cross-repo work:

> `reference exists / UI accepted / runtime can read bytes / domain analysis completed` are separate states.

Apply this only where another Reese-max product has a concrete file-handoff path. Do not create a central “file reliability framework” from this one repo.

# What Changed

1. `video-timeline-pipeline` default branch materially changed since the last formal focal scan: PR #25 merged and made server-side video analysis the canonical widget route, with Drive only optional storage/original-media review.
2. Fresh external community evidence from September shows attachment identity/content availability can diverge on ChatGPT surfaces, reinforcing the value of not making raw file handoff the core analysis dependency.
3. ScreenApp's current direct-competitor flow confirms the broader product pattern of owning ingest/processing and handing the chat layer timestamped/visual evidence.
4. Historical #23 is now broader than the current core need. Its next decision should be a live v11 acceptance run and scope narrowing, not a bigger file-bridge architecture.
5. No new Issue passed the gate; no Issue/PR/comment was modified; no implementation authority was granted.

# Sources

## First-party / product
- OpenAI Plugins reference — checked 2026-09-23: https://developers.openai.com/plugins/reference
- OpenAI Plugins changelog — capability events 2026-03-09 / 2026-03-24, checked 2026-09-23: https://developers.openai.com/plugins/changelog
- ScreenApp AI Video Summarizer — page updated 2026-09-19, checked 2026-09-23: https://screenapp.io/features/ai-summarizer
- Descript release roundup — 2026-09-17, checked 2026-09-23: https://feedback.descript.com/changelog/release-roundupseptember-17-2026

## Community signals
- MP4 accepted but unavailable to processing environment — 2026-09-01: https://community.openai.com/t/mp4-attachments-accepted-by-chatgpt-but-unavailable-to-the-processing-environment/1393990
- Attachment contents not exposed to retrieval/indexing — 2026-09-19: https://community.openai.com/t/gpt-5-6-sol-the-retrieval-indexing-layer-is-failing-to-expose-attachment-contents/1399092
- Multi-file upload state unclear / attachments disappear — 2026-09-20: https://community.openai.com/t/bug-multi-file-upload-state-unclear-and-attachments-disappear/1399325
- OpenAI Support reply: video attachments supported where available, macOS fix not confirmed — 2026-09-07: https://community.openai.com/t/video-attachment-is-not-included-in-sent-messages-and-may-cause-the-macos-app-to-crash-when-switching-chats/1384492/2

## Repository evidence
- Current default HEAD: `664bb6a3e2fb5b4ca2d80f28ec3661a5666b41fd`.
- Merged PR #25: https://github.com/Reese-max/video-timeline-pipeline/pull/25
- Existing #23: https://github.com/Reese-max/video-timeline-pipeline/issues/23
- Prior focal radar: `docs/competitive-intelligence/2026-09-21T140116Z-external-radar.md`.

# Completion / Gaps / Cursor

- Radar status: **COMPLETE** for this focal rotation step.
- Fresh inventory: **42 owned / 41 unarchived**, complete pagination; page 2 empty.
- Runtime gap: v11 has repository/unit/widget evidence, but **no live ChatGPT browser acceptance evidence** in PR #25; keep `NEEDS_RUNTIME_VERIFICATION`.
- Direct write to protected `autodev-ng/main` was rejected by repository rules requiring a pull request. This report was therefore committed to a **report-only documentation branch** and must not be treated as merged into default branch until the docs PR lands.
- No portfolio CLEAN claim was made.
- No product source/config/CI/secrets/settings/branch/deployment/GOAL/worker/paid external action was performed.
- Next fair-rotation cursor: `Reese-max/ai-novel-workstation`.
