# External Competitive Radar — 2026-09-19T20:00:17Z

Status: **COMPLETE**

## Scope / Direction Check

- Issue-quality rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected owner inventory was fully paginated in this run: **41 Reese-max-owned repositories / 40 unarchived**. `obsidian-vault` is archived and excluded from active-product rotation. An older inventory was not assumed to be exhaustive.
- Fair-rotation primary repo: `Reese-max/MaterialYouNewTab`.
- Current default branch/head checked: `main @ 7d32f2f460cc879b3efbaa2523cadc11508882cd`. This latest commit is audit documentation; the latest product-code baseline beneath audit-only commits remains `c9e58837534b4853395f9a06e30086d8f7bf5a3f` (`feat: restore classic layout and personalize bookmarks`, 2026-08-28).
- Owner-approved product boundary remains: a **Traditional-Chinese-first, local-first desktop browser dashboard** for search, shortcuts, tasks, notes, focus, workspaces, bookmarks and optional weather. The 2026-09-18 product-board decision is `INVEST / SIMPLIFY`: preserve local ownership and reversible state; do not chase feature-count parity.
- Explicit current non-goals remain: no account-first cloud sync platform, broad browsing-history/all-URLs permission, autonomous browser agent, generic chatbot, collaboration SaaS, native-mobile breadth, cross-project state framework or paid-provider commitment.
- The repo has GitHub Issues disabled. This is a tracking constraint, not a product defect, and no repository setting was changed.
- Open candidate scope remains active in PR #4 (`feature/ai-assist-3.5.0`, head `4bef4e0d13a5139559db8781e7d966f2cb2da26a`) and PR #5 (`feature/police-exam-countdown`, head `100fb51d09858351667b47cb842f446d81a25b0a`). This radar did not compete with or broaden either scope.
- No product source, CI, config, secrets, permission, setting, branch, deployment, GOAL, paid service or external production data was changed.

## Historical Dedupe / Rejection Context

The stable prior fingerprint is already present in the central radar history:

`MaterialYouNewTab + local-first workspace presets + static launch URLs + no opt-in current-tab capture / saved-session preview / dedupe-aware restore + users manually preserve browser context by leaving tabs open or rebuilding it`

The 2026-09-11 external radar called this a high-value **Workspace Session Capsule** opportunity and attempted to create an Issue, but GitHub returned that Issues are disabled. That pre-dates Issue Quality v2 and its numeric score is **not** current prioritization authority.

The 2026-09-18 Product Board subsequently recalibrated the same fingerprint to **RESEARCH_BACKLOG**: URL-only experiment, explicit preview, missing-only restore, no history permission, and no current build authorization because demand/runtime proof is still missing. The same board explicitly rejected turning MYNT into a full tab manager.

This run therefore asks only whether new external evidence materially changes that calibration. It does not reopen the old large proposal by changing its name.

## Product → Market Category

1. Local-first new-tab / start-page productivity dashboards.
2. Browser workspace and project-context launchers.
3. Tab/session continuity and interrupted-work resumption.
4. Browser-native AI/context surfaces embedded in New Tab.
5. Privacy-preserving alternatives to account/history-centric browser workspaces.

Competitor presence is not treated as a feature requirement.

## External Signals

### 1. CONFIRMED — Firefox Smart Window makes interrupted-task resumption a browser-level product job

**Original publication: 2026-08-18. Material update: 2026-09-16. Checked: 2026-09-20 (Asia/Taipei).**

Source: https://blog.mozilla.org/en/firefox/firefox-smart-window/

Mozilla now describes a first-party browser workflow around a concrete user problem: starting an online task is easy, but returning days or weeks later requires remembering where the user was, what they already found and even what they originally intended to do. Smart Window uses context the user chooses to share, including open tabs and browsing history, to help resume unfinished work.

The September update adds related-tab grouping, duplicate detection/one-click closing, visual history previews and source-backed web answers. Mozilla also says it is working toward surfacing recent browsing journeys and related tabs/history when users return to a task.

**Why this matters to MYNT:** this is stronger evidence than another small tab-manager extension. A major browser vendor is explicitly elevating **resume interrupted work / recover train of thought** into a first-class browser job. That materially strengthens the strategic fit of MYNT's already-recorded Session Capsule research backlog.

**What not to copy:** Firefox can use browsing history and a browser-wide AI window. MYNT's product advantage is narrower local ownership and minimal permission. The market signal supports the *job*, not Firefox's data boundary or AI architecture.

### 2. CONFIRMED — Edge turns New Tab into an account-linked work surface

**Documentation last updated: 2026-09-08. Checked: 2026-09-20.**

Source: https://learn.microsoft.com/en-us/deployedge/microsoft-edge-management-configure-the-copilot-new-tab-page

Microsoft's Copilot New Tab experience puts work cards, Microsoft 365 app launcher, pinned links and a Copilot search box directly on the New Tab page. Its side rail includes chat, agents/skills, tasks and Cowork, with remembered collapse/expand state. Work cards can be disabled by users when policy permits; licensing and sign-in/sync state affect parts of the experience.

**Transferable signal:** New Tab is becoming a persistent work-entry surface rather than a decorative start page.

**MYNT implication:** do not imitate the tenant/account/licensing stack. MYNT should be better on user-owned local state, reversible export/restore and explicit optionality. The relevant competitive job is “return to my work context quickly,” not “embed an enterprise assistant.”

### 3. CONFIRMED — Chrome New Tab can inject user-selected recent tabs into AI Mode

**Published: 2026-04-16. Checked: 2026-09-20.**

Source: https://blog.google/products-and-platforms/products/search/ai-mode-chrome/

Google's Chrome AI Mode lets users choose recent tabs from a plus menu in the New Tab page and combine those tabs with images/files in a query. Google frames the job as avoiding tab hopping and maintaining the user's train of thought while researching.

This is older than the preferred 30–90-day window but remains a current, directly representative browser-level design pattern. It is retained because Firefox's September move shows the broader direction is still active.

**MYNT implication:** current-tab context can be useful without automatically granting full browsing history. A future bounded Session Capsule should start from explicit user-selected/current tabs, not passive history ingestion.

### 4. CONFIRMED — ARC Tab shows a paid local-first dashboard can keep board data entirely browser-local

**Chrome Web Store updated: 2026-08-25. Checked: 2026-09-20.**

Source: https://chromewebstore.google.com/detail/arc-tab-productivity-dash/cfalnmddmncikdglpppjlemlepgjailn

ARC Tab states that board/typed data has no backend or database and lives in extension storage; only the feed reader and Pro license check use the network after user action. Current listed pricing is US$2.99/month or US$20/year after trial, with regional variation.

This is a **packaging/privacy signal**, not evidence that MYNT should charge or add a backend. It confirms that “local-first, no account/sync/telemetry for the core workspace” remains commercially legible in the current new-tab market.

### 5. CONFIRMED — ASTERIA uses native bookmark import + JSON backup rather than a cloud account

**Chrome Web Store updated: 2026-09-01. Checked: 2026-09-20.**

Source: https://chromewebstore.google.com/detail/asteria-new-tab/ogigpnbddabioppklpandoaaibjhggdo

ASTERIA combines links/folders, local-first layout, browser bookmark import and JSON backup/restore. The transferable lesson is not “add another bookmark database”: MYNT already has optional browser bookmark integration plus backup/restore. The useful signal is that onboarding can reuse the user's existing browser-owned objects rather than requiring re-entry.

No new feature is justified from this alone.

## New Releases / Market Moves

| Date | Product | Signal | Confidence |
|---|---|---|---|
| 2026-09-16 update | Firefox Smart Window | Interrupted-work resumption, related-tab grouping, duplicate handling and visual history previews are becoming browser-native workflows | CONFIRMED |
| 2026-09-08 doc update | Microsoft Edge Copilot New Tab | New Tab becomes a work-entry surface with cards, tasks and assistant access | CONFIRMED |
| 2026-09-01 | ASTERIA New Tab | Local-first dashboard with bookmark import and JSON backup/restore | CONFIRMED |
| 2026-08-25 | ARC Tab 1.0.2 | Browser-local workspace with no backend for user board data; optional paid layer | CONFIRMED |
| 2026-04-16 | Chrome AI Mode in New Tab | User-selected recent tabs become explicit context for NTP research flows | CONFIRMED / older representative pattern |

## Community Pain

Community sources were used only as qualitative signals, never as prevalence evidence.

### COMMUNITY_SIGNAL — rebuilding project context after switching work remains a recognizable pain

Source: https://www.reddit.com/r/ProductivityApps/comments/1wg9z5u/loadout_a_chrome_new_tab_that_opens_into_your/ — posted 2026-09-14.

The author describes repeatedly rebuilding browser context when switching projects and proposes one-click project workspaces plus saving a page/text with a short “reason” so future self remembers why it mattered. This maps unusually closely to the Session Capsule job, but it is still a single builder/community account, not validation of MYNT demand.

A useful transferable detail is **why/context alongside URLs**, not merely saving more tabs. A one-line optional user-authored note is cheaper and more privacy-preserving than inferring intent from history.

### COMMUNITY_SIGNAL — local-first users still ask about cross-device continuity, but manual export remains an accepted fallback

Source: https://www.reddit.com/r/startpages/comments/1wcatkd/i_turned_my_new_tab_page_into_a_personal/ — posted 2026-09-10.

A local-only new-tab workspace received a request for sync; the builder answered that export can be manually stored in a drive provider. This does not prove demand or justify cloud sync. It supports keeping MYNT's existing portable backup as the smaller boundary until actual synchronization need is established.

## Current Repository Evidence / Contrary Evidence

Current `MaterialYouNewTab` default HEAD: `7d32f2f460cc879b3efbaa2523cadc11508882cd`; current product-code baseline remains `c9e58837534b4853395f9a06e30086d8f7bf5a3f`.

- README already defines Workspaces with preferred widgets/focus/background/launch URLs, plus multi-tab launchers, local state, backup/restore and optional bookmarks.
- Therefore the product already solves **planned/static context launch**. Any Session Capsule research must prove value specifically for **evolving live context** that presets do not express.
- The Product Board explicitly retains a URL-only Session Capsule only as `LATER / RESEARCH_BACKLOG`, with explicit preview, missing-only restore and no history permission.
- `main` still has a higher-priority P2 shared-modal accessibility/keyboard boundary. Issues are disabled, so that existing main finding remains `ISSUE_WRITE_BLOCKED` in prior audit tracking.
- PR #4 is an active draft for narrow local-first AI Assist and has existing integrity/accessibility blockers tracked by review. Browser-native AI market moves do not authorize widening it into a generic assistant.
- PR #5 is an active exam-dashboard candidate; no Session Capsule work should be bundled into it.

**Contrary evidence matters:** current Workspaces/multi-tab launchers may already be sufficient for the owner's actual repeated tasks. External market activity cannot establish that users need dynamic session capture here. This blocks promotion from research to feature.

## Opportunity Map — `MaterialYouNewTab`

| Bucket | Decision | Evidence / reason |
|---|---|---|
| MUST MATCH | Fast first-use, honest browser/install support, reliable local state and reversible backup | Direct competitors and existing product direction; higher value than more widgets. |
| MUST MATCH | User control over AI/context features | Firefox exposes explicit AI controls; MYNT already treats AI as optional and should retain deterministic/non-cloud paths. |
| SHOULD BE BETTER | Resume a work context without requiring an account or broad history surveillance | Firefox/Edge/Chrome validate the job; MYNT can preserve a narrower permission boundary. |
| DIFFERENTIATOR | Traditional-Chinese-first local workspace + user-owned tasks/notes/workspaces + explicit export/restore | Existing product strengths; do not dilute with enterprise/account breadth. |
| ADJACENT IDEA | Existing URL-only Session Capsule research: explicit current-tab selection/capture, optional one-line intent note, preview, missing-only restore | New browser-level evidence strengthens strategic fit, but local user pain is still unproven. |
| DO NOT COPY | Full history ingestion, automatic tab closing, browser-wide AI window, account-first sync, tenant work cards, autonomous browsing, full tab manager | Expands permissions/support/maintenance beyond evidence and conflicts with approved scope. |

## Four-Gate Decision

### Candidate: narrow URL-only Session Capsule / interrupted-work resume experiment

Stable fingerprint remains the historical Session Capsule fingerprint; this is **not** a new issue.

Current classification under Issue Quality v2:

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `evidence=NEEDS_EVIDENCE`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- runtime status: `NEEDS_RUNTIME_VERIFICATION`

### Gate 1 — Problem / value

Target user: a desktop MYNT user who uses Work/Study/Coding workspaces and later returns to a partially completed browser task.

Observable external job: Firefox now explicitly productizes the difficulty of returning to interrupted online work; current community products similarly describe project-context rebuilding. MYNT internally has static workspace launch URLs but no current evidence in this run that the owner repeatedly loses evolving live context or that the existing preset/bookmark workflow is insufficient.

Not doing anything therefore has an **unknown local cost**, not a proven completion-rate defect. External evidence raises Strategic Fit and Reuse; User Pain inside this product remains unknown.

### Gate 2 — Priority

No P0/P1/P2 product severity is established. The historical numeric opportunity score from 2026-09-11 is treated only as historical ordering context and does not override the current evidence gap.

The new Mozilla signal is meaningful enough to keep the research candidate alive, but current main P2 accessibility work and active PR integrity work remain higher priority. `decision_priority=MEDIUM`, not a feature commitment.

### Gate 3 — Minimum approach

**Do not change product code now.** If the owner later authorizes a bounded experiment, test the smallest possible version:

1. Reuse existing Workspaces/local storage/backup concepts; do not create a new database, registry, account system or background history service.
2. Capture only URLs/titles the user explicitly selects from the **currently open context**; request no browsing-history permission.
3. Allow an optional short user-written “why / next step” note instead of inferring intent with AI.
4. Show a preview before any restore.
5. Restore **missing URLs only**; do not auto-close, reorder or deduplicate by destructive action.
6. Produce a tiny receipt such as `OPENED / ALREADY_OPEN / SKIPPED_INVALID`; explicitly state that reopening a URL does **not** restore unsaved form/SPA/page state (`PAGE_STATE_UNKNOWN`).
7. Compare this against the existing static Workspace launch workflow on a small set of real owner-relevant journeys before deciding to retain the change.

Why smaller alternatives are not yet rejected: existing Workspaces, bookmarks and backup may already satisfy the actual need. That is exactly what the experiment must determine.

### Gate 4 — Research / implementation separation

- **BUILD:** only if an owner-authorized real workflow repeatedly produces dynamic URL context that static Workspace presets cannot practically represent, and the bounded capture/preview/missing-only restore experiment materially reduces manual reconstruction without adding broad permissions.
- **NARROW:** if the need can be satisfied by a tiny “save current URLs to this existing Workspace” affordance or optional note, keep it as a field/action on the existing Workspace model.
- **REJECT:** if existing presets/bookmarks/backup are sufficient, or the value depends on browsing-history ingestion, automatic tab management or a cloud account.

A `BUILD` result would support a subsequent decision only. It would **not** authorize implementation, merge, deployment, permission expansion or a larger session platform.

Result: **NO NEW ISSUE.** Dedupe maps this to the existing central Session Capsule backlog, and the product repository has Issues disabled. No Issue write was attempted merely to manufacture closure.

## AI / Workflow Calibration

The external browser market is also making generic browser AI increasingly platform-native:

- Firefox exposes optional, centrally managed AI controls and Smart Window context.
- Edge embeds Copilot/agents/tasks into New Tab.
- Chrome can directly consume selected recent tabs inside AI Mode.

This is **counterevidence against broadening MYNT PR #4** into a general browser assistant. MYNT's smaller differentiator is user-owned local workflow state and explicit apply, not competing with browser vendors on generic chat/agent breadth.

PR #4 remains active and owns its current scope. This radar is report-only: **SKIPPED_LOCKED_ACTIVE_PR#4** for any scope change/comment.

## Adjacent Ideas

1. If Session Capsule is ever tested, retain a user-authored `why / next step` field; it may solve “what was I doing?” more cheaply than AI summarization or history inference.
2. Reuse native bookmark/workspace data rather than importing the same objects into a second store.
3. Treat URL/session restoration as **reconstruction evidence**, not full browser-state resurrection; transient form state, authentication and SPA state remain unknown unless separately proven.

## Cross-Portfolio Ideas

No new cross-portfolio capability passed the evidence bar. A general “session/context registry” was explicitly rejected: this browser workflow can remain a local product-specific primitive, and no second Reese-max product currently establishes the same root cause strongly enough to justify shared infrastructure.

## Rejected Ideas

- **Turn MYNT into a full tab/session manager** — rejected again; prior radar already rejected this direction and browser/platform products are better positioned for deep tab/history management.
- **Add browsing-history or all-URLs permission to mimic Firefox Smart Window** — rejected; the market signal validates task resumption, not the same data boundary.
- **Automatically close duplicate tabs** — rejected for MVP/research; destructive tab mutation adds recovery and trust cost. Missing-only restore is smaller.
- **Add account/cloud sync because other users ask for sync** — rejected; community anecdotes do not establish local demand, and MYNT already has export/restore.
- **Copy Edge work cards / Microsoft 365 integration** — rejected; account/tenant coupling conflicts with local-first product direction.
- **Expand PR #4 into generic browser chat/agent tooling** — rejected; browser vendors are commoditizing that layer and the active PR already has narrower integrity work to finish.
- **Import bookmarks into a parallel MYNT database** — rejected; existing optional browser bookmark integration is contrary evidence that re-entry is necessary.
- **Add autonomous browsing / auto-fill / browser agent actions** — rejected; outside current direction and materially expands action authority/privacy surface.

## Issue Mapping / Dedupe / Coordination

- Historical Workspace Session Capsule radar fingerprint: **same root cause / same candidate**. Current state remains central `RESEARCH_BACKLOG`; no duplicate Issue created.
- Product repo Issues are disabled. No settings change was attempted.
- `main` shared-modal P2: existing source-confirmed finding, not part of this research; prior audit tracking remains `ISSUE_WRITE_BLOCKED`.
- PR #4 AI Assist: open/draft active scope, head `4bef4e0...`; no comment, no scope rewrite, no lock contention.
- PR #5 exam dashboard: open active scope, head `100fb51...`; no comment, no scope rewrite, no lock contention.

Writes this round: **0 new Issues, 0 Issue edits/comments, 0 PR comments, 0 implementation authorization.**

## Sources

External public web sources — primary intelligence source for this round:

1. Mozilla Firefox — **published 2026-08-18; updated 2026-09-16** — https://blog.mozilla.org/en/firefox/firefox-smart-window/ — `CONFIRMED` first-party task-resumption / tab-grouping / history-preview strategy signal.
2. Microsoft Learn / Edge — **last updated 2026-09-08** — https://learn.microsoft.com/en-us/deployedge/microsoft-edge-management-configure-the-copilot-new-tab-page — `CONFIRMED` first-party New Tab work-surface signal.
3. Google Chrome — **2026-04-16** — https://blog.google/products-and-platforms/products/search/ai-mode-chrome/ — `CONFIRMED` first-party recent-tab context / New Tab AI signal; retained as an older representative pattern.
4. Chrome Web Store / ARC Tab — **updated 2026-08-25** — https://chromewebstore.google.com/detail/arc-tab-productivity-dash/cfalnmddmncikdglpppjlemlepgjailn — `CONFIRMED` current product/privacy/pricing claim, not independent outcome evidence.
5. Chrome Web Store / ASTERIA — **updated 2026-09-01** — https://chromewebstore.google.com/detail/asteria-new-tab/ogigpnbddabioppklpandoaaibjhggdo — `CONFIRMED` current local-first/bookmark-import/backup product claim.
6. Reddit / LoadOut — **posted 2026-09-14** — https://www.reddit.com/r/ProductivityApps/comments/1wg9z5u/loadout_a_chrome_new_tab_that_opens_into_your/ — `COMMUNITY_SIGNAL`; builder-described project-resumption pain, not prevalence evidence.
7. Reddit / local productivity new tab — **posted 2026-09-10** — https://www.reddit.com/r/startpages/comments/1wcatkd/i_turned_my_new_tab_page_into_a_personal/ — `COMMUNITY_SIGNAL`; sync/export discussion, not prevalence evidence.

Internal GitHub evidence used only for product truth, direction, dedupe and coordination:

- `autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` @ blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- `autodev-ng/docs/competitive-intelligence/2026-09-11-external-radar-r8.md` — historical Session Capsule fingerprint and blocked Issue write.
- `MaterialYouNewTab/.github/quality-audits/2026-09-18T1403Z-product-board-audit.md` — current owner direction and research backlog calibration.
- `MaterialYouNewTab` current HEAD `7d32f2f460cc879b3efbaa2523cadc11508882cd`; product baseline `c9e58837534b4853395f9a06e30086d8f7bf5a3f`.
- Current README, all-state PRs, PR #4 and PR #5 metadata.

## What Changed

1. **The strongest new evidence is strategic, not local defect evidence:** Firefox's 2026-09-16 Smart Window expansion turns “resume interrupted browsing / recover train of thought” into a first-party browser strategy, materially strengthening the strategic fit of MYNT's existing Session Capsule research backlog.
2. Edge and Chrome independently show New Tab/context surfaces moving from decorative launchers toward work/context entry points.
3. This does **not** overturn the 2026-09-18 Product Board calibration. Local MYNT user pain and runtime benefit remain unproven; severity stays `NOT_ESTABLISHED`, research stays `NEEDS_EVIDENCE`.
4. The smallest plausible differentiator becomes clearer: **explicit current-context capture + optional user-written intent + preview + missing-only restore**, while refusing broad history ingestion and destructive tab management.
5. Current local-first competitors continue to validate account-free/browser-local packaging, but do not justify a new backend or subscription.
6. Browser-native generic AI is becoming more commoditized, which strengthens the existing decision to keep MYNT's AI surface narrow/optional rather than expand PR #4.
7. No duplicate Issue, new framework, permission expansion or implementation authorization was created.

## Severity / Scope Calibration

Historical pre-v2 “91/100” Session Capsule scoring is retained as historical context only. Under Issue Quality v2, current truth is:

`RESEARCH / NOT_ESTABLISHED / decision_priority=MEDIUM / NEEDS_EVIDENCE / auto_implementation=false / NEEDS_RUNTIME_VERIFICATION`

Reason: external strategic fit is now stronger, but there is still no current supported-flow failure, no measured completion-rate loss, no real-user evidence and no executed MYNT runtime experiment proving that static Workspaces are inadequate.

## Completion / Gaps / Cursor

- External exploration completed with recent first-party browser/platform sources, current Chrome Web Store product signals and limited community signals.
- Fresh owner inventory pagination completed: **41 owned / 40 unarchived**.
- Focal default HEAD, current approved scope, historical Session Capsule radar, current Product Board, Issues availability and all-state PRs were checked.
- No live extension install, real browser profile, tabs/history permission, user study, cross-device sync, store publication, cloud provider or destructive tab action was exercised. Runtime-sensitive conclusions remain **NEEDS_RUNTIME_VERIFICATION**.
- No current product HEAD drift was observed during the evidence review before report write; recheck after write is required if a later run uses this as current truth.
- This radar does **not** declare the repository or portfolio CLEAN.
- Next fair-rotation target: `Reese-max/cf-mcp-server`.
