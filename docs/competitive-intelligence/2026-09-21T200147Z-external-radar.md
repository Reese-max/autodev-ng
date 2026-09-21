# External Competitive / New-Product / Workflow Radar — 2026-09-21T20:01:47Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY / NO_MATERIAL_NOTIFICATION / 0_NEW_ISSUES**.
- Primary intelligence source this round was the **public web outside Reese-max GitHub**. GitHub was used for owner scope, current product truth, direction, duplicate/ownership checks and this durable report.
- Governing gate re-read from current `main`: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`; rules blob SHA **`8167e10798071d2276addaff6b201c6b0e904a2a`**.
- Fresh connected-owner enumeration was paged to completion: **42 Reese-max-owned repositories / 41 unarchived**; page 2 was empty. Historical inventory was not used as the denominator.
- Fair cursor entering this round: **`Reese-max/MaterialYouNewTab`**, carried from `2026-09-21T180021Z-external-radar.md`.
- Focal default branch/head was rechecked immediately before report write: **`main@7d32f2f460cc879b3efbaa2523cadc11508882cd`**. This is audit documentation; the latest product-code baseline remains **`c9e58837534b4853395f9a06e30086d8f7bf5a3f`**.
- Current Product Board direction remains **INVEST / SIMPLIFY**: compete on a trustworthy local personal workspace and reversible state, not widget/AI feature-count parity. A URL-only Session Capsule remains research-only.
- Current product scope remains Traditional-Chinese-first desktop new-tab dashboard for search, tasks, notes, focus, workspaces, bookmarks and optional weather, with no required account.
- Current explicit non-goals remain cloud-account platform, broad history/all-URLs permission, autonomous browser agent, generic chatbot, collaboration SaaS, native-mobile breadth, cross-project state framework and paid-provider commitment.
- GitHub Issues remain disabled for this repository. This is `ISSUE_WRITE_BLOCKED` as a tracking limitation, **not** a product defect and not authority to change repository settings.
- Active candidate scope remains PR #4 (`feature/ai-assist-3.5.0`, head `4bef4e0d13a5139559db8781e7d966f2cb2da26a`) and PR #5 (`feature/police-exam-countdown`, head `100fb51d09858351667b47cb842f446d81a25b0a`). This radar did not comment on, rewrite or broaden either scope.
- No extension install, live browser profile, real history/tabs permission, user study, store publication, real weather/location request, destructive tab action, paid provider, branch, merge, deployment, GOAL, product source/config/secret/permission/settings mutation or runtime verification was performed.

## Executive decision

**0 new Issues. 0 Issue/PR comments. 0 scope changes. 0 implementation authorizations.**

Fresh public-web evidence sharpens the competitive picture but does **not** create a new root cause or overturn owner direction:

1. **Tabulo 1.23.1, updated 2026-09-18**, is a direct current new-tab competitor with local-first multi-canvas `Work / Life / Study`, widgets, backup/import-export, tab snapshots/recently-closed, bilingual UI, on-demand optional permissions and an exact-domain network whitelist. This is strong evidence that generic “local-first + widgets + work/study modes” is crowded and should not be treated as a moat by itself.
2. **Tabisto 1.1.2, updated 2026-08-11**, directly combines local-first workspaces, saved sessions, tab/history search, reminders, optional sync and paid session history/auto-snapshots. It is a much closer direct substitute for the historical Session Capsule job than generic tab-manager examples. It strengthens Strategic Fit for interrupted-work recovery but still does not establish MYNT user pain or implementation priority.
3. **Qixu 1.4.3, updated 2026-08-31**, demonstrates a narrower privacy lifecycle for optional history-derived suggestions: history permission is requested only after explanation; disabling the feature revokes permission and deletes derived browsing statistics; exports deliberately omit browsing-derived state. This is a useful permission/data-lifecycle pattern, but MYNT currently has **no `history` permission at all**, so it does not expose a present defect.
4. **Firefox Smart Window / Mozilla-Mistral, 2026-09-16**, continues the browser-level move toward contextual AI and user/model choice. This was already materially captured in the 2026-09-19 radar; the new partnership/model-choice detail does not justify widening PR #4 or granting browser-history authority.

The resulting calibration is:

> **Local-first privacy, work/study canvases, backup and even session capture are increasingly table stakes in this category. MYNT should not answer by adding more generic dashboard breadth. Its safer path is still reliability + explicit permission boundaries + one coherent owner-validated workflow extension at a time.**

That is a positioning refinement, not a build authorization.

---

## Product → market category

| Product | Direct / adjacent market category | Current supported job |
|---|---|---|
| `MaterialYouNewTab` | local-first new-tab/start-page dashboards; personal workspaces; focus/task surfaces; browser context/session continuity | new tab → search / task / note / focus / workspace / bookmark / optional-weather workflow with local state and manual backup/restore |

## External Signals

### A. Direct competitor — Tabulo makes local-first Work/Study multi-canvas breadth commodity-like

**CONFIRMED — Chrome Web Store updated 2026-09-18; checked 2026-09-21.**

Source: https://chromewebstore.google.com/detail/tabulo-modular-new-tab-st/himlpehldamlbcpiehokbgbhjjaalcol

Tabulo 1.23.1 presents itself as a local-first, ad-free modular new-tab workspace. The current store listing includes drag/resizable widgets, presets, single-step undo, import/export backup, multi-canvas `Work / Life / Study`, notes/todos, Pomodoro, countdown, tab snapshots, recently closed pages, bookmarks, weather, calendar and bilingual English/Chinese UI. It states there is no account or analytics; selected data uses `chrome.storage.sync`, while photos/sketches/notes remain local. Bookmarks/reading-list/top-sites permissions are requested on demand and described as revocable; network calls use an exact-domain whitelist rather than `<all_urls>`.

**User job solved:** assemble a context-specific new-tab surface without signing into a third-party dashboard or re-opening separate productivity tools.

**Manual work reduced:** less switching among notes/tasks/timer/bookmarks and less manual reconstruction of a Work/Study layout.

**Transferable pattern:** optional capabilities should request permissions only when invoked; network scope should remain visibly bounded; undo/export should accompany user-owned local state.

**What not to copy:** widget explosion, generic AI-portal shortcuts, another modular layout engine, or tab/history features merely to reach parity. MYNT already has workspaces, tasks, Scratchpad, Pomodoro, countdown-related candidate work, backup/restore and optional bookmarks.

**Repository mapping:** no new root cause. This signal reduces the differentiation value of **generic feature breadth** and reinforces `INVEST / SIMPLIFY`.

**Decision:** `DIRECT_COMPETITOR_SIGNAL / POSITIONING_CALIBRATION / NO_NEW_ISSUE`.

### A2. Direct competitor — Tabisto productizes saved sessions inside a local-first new-tab workspace

**CONFIRMED — Chrome Web Store version 1.1.2 updated 2026-08-11; current product/pricing checked 2026-09-21.**

Sources:
- https://chromewebstore.google.com/detail/tabisto-bookmark-manager/djaejekjeiaidoghnpndlfbnikpndngj
- https://tabisto.app/

The current listing/site combines workspaces, visual bookmarks, notes/reminders, command-palette search over bookmarks/open tabs/tab groups/recently closed/history, saved window sessions and optional background session snapshots. It is local-first/offline without an account; sign-in adds cloud sync. Current store pricing states Pro at **US$3.99/month or US$35.88/year**, with unlimited sessions plus session history/auto-snapshots and workspace export/import; the free tier includes one saved session.

The store currently lists Traditional Chinese among supported locales. That does not make the product Traditional-Chinese-first, but it further weakens any claim that merely having Chinese localization is defensible differentiation.

**User job solved:** keep project/bookmark context separated, save a live tab set, and reopen it later without manually rebuilding the browser window.

**Concrete manual work reduced:** tab-by-tab reconstruction, bookmark hunting and repeated context switching.

**Transferable pattern:** session restore is useful as a bounded workspace action; it does not require turning the whole product into an agent.

**What not to copy:** background autosnapshot/history search, account/sync infrastructure, paid limits, dead-link scanner, or full bookmark-manager breadth without owner evidence.

**Repository mapping:** same root cause/fingerprint as the historical **Workspace Session Capsule** backlog. This is stronger *direct-competitor* evidence than prior generic tab-manager examples, but local user pain and runtime benefit remain unproven.

**Decision:** `RESEARCH_SIGNAL / DEDUP_TO_SESSION_CAPSULE / NO_NEW_ISSUE`.

### B. Adjacent privacy workflow — Qixu couples optional history access with revocation and derived-data deletion

**CONFIRMED — Chrome Web Store updated 2026-08-31; checked 2026-09-21.**

Source: https://chromewebstore.google.com/detail/qixu-local-new-tab/keclldhkohjabfnmeimfifcbfmjlgiak

Qixu offers local “Smart picks” from browsing history. Its listing says the history permission is requested only after in-product explanation; the feature stores reduced host/count/title/time data rather than full page paths/query parameters/bodies/complete visit records; its configuration export omits browsing-derived statistics and permission state; turning Smart picks off revokes History permission and deletes derived browsing statistics.

**User job solved:** get context-aware shortcuts while preserving an explicit off-switch and reducing retained browsing data.

**Transferable design:** permission grant, derived-data retention, export semantics and disable/revoke semantics should be one lifecycle contract.

**Current contrary evidence:** MYNT `manifest.json` currently has only optional `bookmarks`, `favicon`, and optional Google host access. It does **not** request `history`. Historical owner direction also explicitly rejects broad history permission for Session Capsule research.

**Decision:** `ADJACENT_PRIVACY_PATTERN / NO_CURRENT_GAP / DO_NOT_ADD_HISTORY_FOR_PARITY`.

### C. Browser-platform update — Smart Window adds another model-choice path, but browser-wide contextual AI remains out of scope

**CONFIRMED first-party release — Mozilla/Mistral partnership published 2026-09-16; checked 2026-09-21.**

Source: https://blog.mozilla.org/en/firefox/mozilla-mistral-partnership/

Mozilla announced Mistral Small 4 as a Smart Window model option and expanded the beta to France. Smart Window already represents the browser-native context/AI direction captured in the 2026-09-19 radar.

**Transferable principle:** user choice and explicit AI controls matter more than embedding a single opaque assistant.

**Current mapping:** PR #4 is already a narrow optional AI-assistance layer and remains active. No new owner/user evidence supports broad browser history, browser-wide memory or generic chat-agent scope.

**Decision:** `PLATFORM_SIGNAL / EXISTING_DIRECTION_CONFIRMED / NO_SCOPE_CHANGE`.

## New Releases / current strategy signals

| Date | Product | Signal | Decision |
|---|---|---|---|
| 2026-09-18 | Tabulo 1.23.1 | local-first Work/Life/Study multi-canvas, tab snapshots, on-demand permissions, exact-domain network scope | direct breadth pressure; do not chase parity |
| 2026-09-16 | Firefox Smart Window + Mistral | more model choice inside browser-context AI | confirms explicit optionality; do not widen PR #4 |
| 2026-08-31 | Qixu 1.4.3 | optional history permission with revocation + derived-data deletion | privacy-lifecycle reference only; no history permission needed now |
| 2026-08-11 | Tabisto 1.1.2 | local-first workspaces + saved sessions + optional sync; current Pro US$3.99/mo or US$35.88/yr | strengthens Session Capsule strategic fit; no local pain proof |

## Community Pain

Fresh community search did not produce a stronger decision-grade signal than the already-recorded interrupted-work context examples.

Representative qualitative signals remain:

- LoadOut (Reddit, 2026-09-14) frames the unit of organization as a **project + next step + saved context**, not merely “more tabs.” This was already captured in the prior MYNT radar and is not counted as new evidence.
- TabPlex (Reddit, 2026-08-23) describes pausing one task, switching to another and not trusting that the first will come back intact; it emphasizes recovery, previewable backup and no host permissions. Useful qualitative context, not prevalence evidence.
- A 2026-09-20 TabForce post again describes 50+ tab overload, but it is a builder promotion with minimal engagement and does not establish incidence or priority.

No community claim is converted into frequency, ROI, severity or implementation authorization.

---

## Current repository / direction calibration

### Default-branch truth

Current `main` remains `7d32f2f460cc879b3efbaa2523cadc11508882cd`; product-code baseline remains `c9e58837534b4853395f9a06e30086d8f7bf5a3f`.

Current README explicitly provides:

- Traditional-Chinese-first dashboard;
- Workspaces including Study/Work/Coding/Relax/custom modes with preferred widgets, focus duration, background and launch URLs;
- tasks, Scratchpad, Pomodoro, focus history/streaks, bookmarks, optional weather, command palette;
- workspace presets and **multi-tab launchers**;
- backup/restore/local reset;
- manual-install truth for the customized fork.

Current Chromium manifest keeps permissions narrow:

```text
optional_permissions: bookmarks, favicon
optional_host_permissions: https://www.google.com/*
```

There is no `history` or `<all_urls>` permission on current `main`.

### Existing work still outranks new breadth

The 2026-09-18 Product Board remains stronger than the market novelty:

1. Fix/verify the shared confirmation-modal accessibility/keyboard boundary on `main`.
2. Before AI Assist merge, resolve exact-head async ownership / duplicate-task integrity blockers and obtain fresh review.
3. If exam dashboard remains the chosen vertical, close its runtime/fallback gaps and merge it independently.
4. Keep Session Capsule research-only until real owner-relevant journeys prove static Workspace launch URLs are insufficient.

PR #4 and PR #5 remain active. Market signals do not authorize combining them or adding new tab/session/history scope to either.

---

## Opportunity Map — `MaterialYouNewTab`

| Category | Decision | Evidence / reasoning |
|---|---|---|
| **MUST MATCH** | Local state must remain reliable, reversible and honestly exportable | current product promise + crowded local-first category |
| **MUST MATCH** | Optional permissions/network features must remain explicit and fail closed when disabled/hidden | current manifest + Qixu/Tabulo design patterns + existing PR #5 lifecycle work |
| **MUST MATCH** | First-use/install/browser-support truth | customized fork is manually loaded while direct competitors have store distribution |
| **SHOULD BE BETTER** | Resume work context without requiring an account or broad browsing history | Tabisto + prior Firefox/Chrome evidence validate the job; local value still needs proof |
| **SHOULD BE BETTER** | Calm default hierarchy instead of competing on raw widget count | Tabulo breadth increases parity pressure; owner board already favors simplification |
| **DIFFERENTIATOR** | Traditional-Chinese-first workflow depth + explicit local ownership + bounded/reversible actions | current owner direction; avoid claiming generic privacy/widgets alone as moat |
| **ADJACENT IDEA** | Historical URL-only Session Capsule: explicit capture/preview/missing-only restore, optional user-written “why/next step” | stronger direct-competitor evidence, but still `RESEARCH` only |
| **DO NOT COPY** | broad history ingestion / automatic autosnapshots / destructive tab cleanup | permission/privacy/support burden not justified by local evidence |
| **DO NOT COPY** | account-first sync platform, collaboration SaaS, generic browser agent/chatbot | outside owner-approved direction |
| **DO NOT COPY** | generic widget/portal breadth merely because Tabulo has it | parity race with no user-value proof |

---

## Four-Gate Review

### Candidate A — URL-only Workspace Session Capsule / interrupted-work resume

Stable fingerprint remains:

`MaterialYouNewTab + existing static Workspace launch URLs + evolving live browser context is not preserved + returning user manually rebuilds a partially completed task + current Workspace/bookmark flow is proven insufficient`

This is the **same historical root cause**, not a new candidate.

#### 1. Problem / value

Direct market evidence is now stronger: Tabisto ships saved sessions in the same new-tab/workspace category, while Firefox/Chrome and community products independently frame interrupted-task resumption as a user job.

But local contrary evidence remains decisive: MYNT already has Workspace presets, launch URLs, bookmarks and multi-tab launchers, and there is still no real owner/user session showing repeated reconstruction pain that those mechanisms fail to solve.

**Gate result:** external job = credible; local product problem/value = **not established**.

#### 2. Priority

```yaml
issue_quality_version: 2
kind: RESEARCH
severity: NOT_ESTABLISHED
evidence: NEEDS_EVIDENCE
decision_priority: MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

A direct competitor shipping sessions does not make missing sessions a P2/P1 defect. Current main accessibility and active PR integrity work still outrank it.

#### 3. Minimum solution

**No product code change now.** If the owner later authorizes the bounded experiment:

1. reuse the existing Workspace model/storage;
2. capture only explicit currently-open URLs/titles selected by the user;
3. no browsing-history permission and no background autosnapshot service;
4. optional one-line user-authored `why / next step` rather than AI intent inference;
5. preview before restore;
6. restore **missing URLs only** and do not auto-close/reorder/destructively dedupe;
7. receipt: `OPENED / ALREADY_OPEN / SKIPPED_INVALID / PAGE_STATE_UNKNOWN`;
8. compare against the existing static Workspace launcher on a small set of real owner-relevant journeys.

Smaller alternatives remain viable: a simple “save current URLs into this existing Workspace” action may be enough. Therefore a new session DB/state machine/tab platform is not justified.

#### 4. Research / implementation separation

- **BUILD:** only if owner-authorized real workflows repeatedly lose evolving URL context and the bounded experiment materially reduces manual reconstruction without broadening permissions.
- **NARROW:** if one save-to-existing-workspace action or user note solves the job.
- **REJECT:** if current presets/bookmarks/multi-tab launchers are sufficient, or value requires passive history, background snapshots, account sync or destructive tab control.

Any future BUILD result supports a later decision only. It does not authorize implementation, merge, deployment or new permissions.

**Decision:** `DEDUP / RESEARCH_BACKLOG / NO_NEW_ISSUE`.

### Candidate B — history-derived smart suggestions with strict revoke/delete lifecycle

#### 1. Problem / value

Qixu proves a privacy-conscious implementation exists, but MYNT does not currently request `history` and has no validated user job requiring passive browsing-derived suggestions.

#### 2. Priority

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: LOW
triage: NEEDS_EVIDENCE
auto_implementation: false
```

#### 3. Minimum solution

Do nothing. Existing explicit Workspace URLs/bookmarks are the smaller alternative. If a future authorized feature ever needs a sensitive optional permission, copy the **lifecycle principle** (explain → request → bound retention/export → revoke/delete) rather than Qixu’s actual feature.

#### 4. Research / implementation separation

No current research question is valuable enough to open. Do not add `history` permission just to test demand.

**Decision:** `REJECT_FOR_NOW / PRIVACY_REFERENCE_ONLY`.

### Candidate C — signed store distribution for the customized fork

Direct competitors such as Tabulo/Tabisto provide one-click store install while current README truthfully requires manual developer-mode/temporary-addon paths for Reese-max custom features.

However the Product Board already records signed/store distribution as a potential growth improvement that is deferred until release ownership/support cost are explicit. This round found no install-funnel/user-dropoff evidence that changes that call.

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: LOW_MEDIUM
triage: DEFERRED
auto_implementation: false
```

**Decision:** `EXISTING_DEFERRED_DIRECTION / NO_NEW_ISSUE`.

---

## Rejected Ideas

- **Copy Tabulo’s large widget catalog:** rejected; feature breadth is increasingly commodity-like and conflicts with `SIMPLIFY`.
- **Add browser-history Smart picks:** rejected for now; no user problem requires it, and current product advantage includes narrow permission scope.
- **Add background session autosnapshots because Tabisto has them:** rejected; passive tab/history capture raises support/privacy complexity before local demand is established.
- **Build cloud sync/account infrastructure:** rejected; current portable backup is the smaller boundary and no cross-device need is validated.
- **Turn PR #4 into browser-wide contextual AI:** rejected; browser platforms already own that surface and PR #4 is intentionally narrow.
- **Bundle Session Capsule into PR #5 exam dashboard:** rejected; active PR scope should remain independent and reviewable.
- **Create a generic permission/data-lifecycle framework:** rejected; use small feature-local contracts when/if a concrete capability needs them.

## Adjacent Ideas

1. If any future optional-permission feature is authorized, make **disable** semantics explicit: stop use, revoke permission when possible, remove derived sensitive state, and define what backup/export excludes.
2. If Session Capsule is ever tested, favor user-authored `why / next step` over model-inferred intent.
3. Treat restored URLs as reconstruction, not full browser/page-state recovery; authentication, forms and SPA state remain `PAGE_STATE_UNKNOWN` unless separately proven.

## Cross-portfolio ideas

No evidence-backed shared component passes the creation gate.

Reusable principles only:

- optional permission lifecycle = `explain -> explicit request -> bounded data -> disable/revoke -> derived-state cleanup`;
- restore/import features should preview mutations and preserve unknowns rather than imply exact state recovery.

These are design principles, not authorization for a central permission registry, state framework or browser-session service.

## Issue Mapping / coordination

- Product-repo Issues: disabled; no settings change attempted.
- Historical Workspace Session Capsule: same fingerprint; remains central `RESEARCH_BACKLOG` / `NEEDS_EVIDENCE`.
- PR #4 AI Assist: active draft; no comment/scope mutation; browser-AI signals do not broaden it.
- PR #5 exam dashboard: active; no comment/scope mutation; Tabulo Work/Study breadth does not create parity work.
- New Issue: **0**.
- Updated/reopened Issue: **0**.
- Issue/PR comments: **0**.
- Lock acquisition: **not needed**, because no existing Issue/shared tracking state was modified.
- Implementation authorization: **0**.

## Sources

Primary public-web sources, checked 2026-09-21 unless otherwise stated:

1. Tabulo — Chrome Web Store, **updated 2026-09-18**: https://chromewebstore.google.com/detail/tabulo-modular-new-tab-st/himlpehldamlbcpiehokbgbhjjaalcol
2. Mozilla — **2026-09-16**, Mozilla and Mistral partnership / Smart Window model choice: https://blog.mozilla.org/en/firefox/mozilla-mistral-partnership/
3. Qixu — Chrome Web Store, **updated 2026-08-31**: https://chromewebstore.google.com/detail/qixu-local-new-tab/keclldhkohjabfnmeimfifcbfmjlgiak
4. Tabisto — Chrome Web Store, **updated 2026-08-11**: https://chromewebstore.google.com/detail/tabisto-bookmark-manager/djaejekjeiaidoghnpndlfbnikpndngj
5. Tabisto current product/pricing page: https://tabisto.app/
6. Firefox Smart Window memories/current behavior, checked 2026-09-21: https://support.mozilla.org/en-US/kb/smart-window-memories

Qualitative community sources (not incidence/severity evidence):

7. LoadOut project-context post, 2026-09-14: https://www.reddit.com/r/chrome_extensions/comments/1wfvqr5/i_built_a_new_tab_extension_that_organizes_chrome/
8. TabPlex local-first task-switching post, 2026-08-23: https://www.reddit.com/r/chrome_extensions/comments/1vwmunk/i_built_a_localfirst_chrome_workspace_manager/
9. TabForce promotional post, 2026-09-20: https://www.reddit.com/r/chrome_extensions/comments/1wljxpm/i_built_a_powerful_and_scalable_tab_manager/

GitHub was used only for owner/product truth, not as the primary market-intelligence source.

## What Changed

1. Fresh owner inventory remains **42 owned / 41 unarchived** with pagination exhausted.
2. Issue Quality v2 is unchanged at blob **`8167e10798071d2276addaff6b201c6b0e904a2a`**, despite later `autodev-ng` process changes on `main`.
3. `MaterialYouNewTab` default HEAD remains `7d32f2f460cc879b3efbaa2523cadc11508882cd`; no product-code drift was observed.
4. New-to-this-radar direct competitor evidence: **Tabulo 1.23.1 (2026-09-18)** now overlaps generic local-first Work/Study/dashboard breadth, and **Tabisto** gives direct same-category saved-session evidence.
5. This strengthens the conclusion that generic local-first/dashboard/session breadth is not a moat, but it **does not overturn** `INVEST / SIMPLIFY`, establish local Session Capsule demand, or justify a parity roadmap.
6. Qixu provides a useful permission/derived-data lifecycle reference, but current MYNT has no history permission and therefore no matching present defect.
7. Existing PR #4/#5 scopes remain active and untouched.
8. New Issues **0**; comments/updates **0**; implementation authorizations **0**; runtime validations **0**.

## Completion / gaps / fair cursor

- Direct competitors, adjacent privacy workflow, browser-platform strategy and qualitative community signals were explored from the public web.
- Current rules, owner direction, default branch, README/manifest truth, historical MYNT Session Capsule radar, repo Issue availability and all-state PRs were rechecked.
- No real user/task telemetry, extension runtime, store-install funnel, Firefox manual validation, screen reader, current-tab capture experiment, history permission or cross-device sync experiment was executed. Runtime-sensitive hypotheses remain `NEEDS_RUNTIME_VERIFICATION` where applicable.
- This radar does **not** declare the repository or portfolio CLEAN.
- Notification threshold: **not met**. The Tabulo/Tabisto evidence sharpens category crowding and strengthens an already-recorded Session Capsule research hypothesis, but it does not create a high-value net-new opportunity, prove a P0/P1/P2 product problem, validate a reusable cross-project component or overturn owner-approved direction.
- Next fair-rotation cursor: **`Reese-max/cf-mcp-server`**.
