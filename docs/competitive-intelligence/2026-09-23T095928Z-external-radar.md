# External Competitive Intelligence Radar — 2026-09-23T095928Z

Target: `Reese-max/MaterialYouNewTab`  
Run type: external competitive/workflow radar; research/tracking only  
Rules blob: `8167e10798071d2276addaff6b201c6b0e904a2a` (`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`)  
Target HEAD: `7d32f2f460cc879b3efbaa2523cadc11508882cd`  
Product-code baseline: `c9e58837534b4853395f9a06e30086d8f7bf5a3f`  
Status: `COMPLETE / NOT CLEAN CLAIMED`; no implementation authorization

## Direction and current scope

Fresh owner inventory was fully paginated in this run: **42 Reese-max-owned repositories, 41 unarchived**; page 2 was empty. `obsidian-vault` remains the only archived repository and is excluded from active-product rotation.

The current owner-approved product direction remains `INVEST / SIMPLIFY`: preserve a trustworthy local dashboard, local backup/restore, Traditional-Chinese-first workflows and narrow optional permissions; fix the shared confirmation-modal accessibility boundary before adding breadth; treat AI Assist PR #4 and exam dashboard PR #5 as independent active scopes; do not add cloud account/sync, broad browsing permissions, autonomous browser-agent behavior, generic chatbot breadth or multi-platform SaaS by default. The 2026-09-18 board explicitly kept a URL-only Session Capsule as research-only, not a build request.

Current `main` has no product-code change after `c9e5883`; later commits are audit/report-only. PR #4 is still open draft and unmerged; PR #5 is open, non-draft and unmerged. Repository Issues remain disabled (`has_issues=false`), so a target Issue write is not available without a repository-settings change, which this radar is not authorized to make.

## External Signals

### A. Direct competitor — Offiqa, live Chrome Web Store product

**CONFIRMED.** Offiqa's Chrome Web Store listing was updated **2026-09-13** (version 1.0.0). Its public homepage was last reviewed **2026-09-14**. Offiqa positions the New Tab page as a work-context workspace: save selected/current tabs together with a quick note and a next action, then resume that bundle later. The product explicitly distinguishes this from a plain tab saver: the value claim is preserving *why the tabs mattered* and *what should happen next*.

Sources (accessed 2026-09-23):
- https://offiqa.com/
- https://chromewebstore.google.com/detail/offiqa-%E2%80%94-new-tab/ngobfaakfdicgnbfeploaepeddapfgpi
- https://offiqa.com/help/

User job: return to a client/campaign/meeting/research context without reopening multiple apps, reconstructing the reason for each tab, finding the note in a separate tool, and re-deriving the next action.

Workflow reduction: current browser tabs + note + next action become one resumable workspace card. This removes cross-tool copying and context reconstruction rather than merely adding another dashboard widget.

Distribution/onboarding signal: the live listing starts from one real workspace and encourages one note plus one next action, rather than asking users to configure a large productivity system first.

Important limitation: the Chrome Web Store listing currently shows **0 ratings**, so this is strong product-shape evidence but **not adoption, retention or demand proof**.

### B. Trust/permission model — local-first plus optional sync

**CONFIRMED.** Offiqa's privacy/permissions pages say the core workspace should remain useful locally without an account, browsing-history scan or deep Gmail/CRM/calendar/content integration. Its Web Store listing nevertheless discloses handling categories including web history, user activity and website content, and says selected data can optionally be backed up/synced to the user's Google Drive.

Sources (accessed 2026-09-23):
- https://offiqa.com/privacy/
- https://offiqa.com/permissions/
- https://chromewebstore.google.com/detail/offiqa-%E2%80%94-new-tab/ngobfaakfdicgnbfeploaepeddapfgpi

Transferable lesson: local-first messaging does not remove the need for precise permission explanations and explicit capture boundaries. MYNT should continue treating tab metadata as sensitive state and should not equate "stored locally" with "permission-free".

**CONFIRMED.** Chrome's current extension documentation still separates `activeTab` from the `tabs` permission. `activeTab` grants temporary access to the current tab after a user gesture; reading sensitive tab properties such as URL/title/favicon across queried tabs requires `tabs` or matching host access. `chrome.tabs`/`chrome.tabGroups` can manage browser state without requiring a generic page-content scraping architecture.

Sources (accessed 2026-09-23):
- https://developer.chrome.com/docs/extensions/reference/permissions-list
- https://developer.chrome.com/docs/extensions/reference/api/tabs
- https://developer.chrome.com/docs/extensions/develop

### C. Adjacent market signals

**CONFIRMED.** Momentum documentation updated **2026-09-15 to 2026-09-20** now makes the account boundary explicit: the new-tab dashboard can be used without an account; account creation is for sync across browsers/devices. This weakens "no account required" as a standalone differentiator and strengthens the need for MYNT's differentiation to come from local ownership, reversible state, workflow depth and truthful permission boundaries rather than account avoidance alone.

Sources:
- https://get.momentumdash.help/hc/en-us/articles/360018986134-Installing-Momentum
- https://get.momentumdash.help/hc/en-us/articles/115007780748-How-Momentum-works

**CONFIRMED product statement / not independent effect evidence.** Opera changed its vertical-tabs ordering on **2026-09-10** after user feedback and retained the prior ordering as a configurable option. The transferable pattern is reversible defaults after observed usage; it does not justify new MYNT functionality.

Source: https://press.opera.com/2026/09/10/opera-turns-vertical-tabs-upside-down/

## Community Pain

No new high-confidence community evidence was found that changes MYNT priority. Older Edge Workspaces complaints about large workspace lists lacking search/filter remain a scale warning only; they do not establish MYNT demand for session capture and are not used to promote severity.

Source (older COMMUNITY_SIGNAL): https://learn.microsoft.com/en-us/answers/questions/5832043/edge-workspaces-update-makes-50-workspaces-unnavig

## What Changed

The 2026-09-10 radar already identified a `Workspace Tab Session Snapshot / Preview / Restore` opportunity from tab/session-manager competitors. The 2026-09-18 product board then deliberately kept the Session Capsule research-only because demand was not validated and existing P2/default-branch and active-PR work ranked higher.

**New evidence this run:** Offiqa is now a direct New-Tab competitor with a live Chrome Web Store listing whose core product contract is not merely "save tabs" but **tabs + note + next action as one resumable local-first workspace**. This maps unusually closely to capabilities MYNT already owns separately: Workspaces (launch URLs), Scratchpad, tasks/Today, Focus Timer and local backup.

This strengthens the *shape* of the opportunity but does not by itself establish that MYNT users want it, and Offiqa's current lack of ratings provides no adoption proof.

## Opportunity Map

### MUST MATCH
- Honest permission/runtime truth: do not imply tab-state capture without declaring the needed browser capability.
- Reversible local data: export/restore remains first-class.
- Fast first value from one real workflow; do not require account/setup breadth before the dashboard is useful.

### SHOULD BE BETTER
- If session capture is ever tested, show a capture preview, allow exclusions, surface sensitive-looking/special URLs, and restore only missing tabs by default.
- Keep a clear distinction between saved URL/title metadata and unavailable application state (forms, editor buffers, login/session internals, video position).

### DIFFERENTIATOR
- Traditional-Chinese-first daily workflow.
- Existing integration of workspace + Scratchpad + task/Today + Pomodoro + backup in one local surface.
- Exact, user-triggered mutation and rollback rather than background browsing-history mining.

### ADJACENT IDEA
- Narrowly bind an existing workspace to **one optional existing next-action task** and **one short workspace note/context field**, and only if a future research fixture shows that users lose context between sessions.
- If browser-session capture is researched, reuse the existing workspace object and backup path; do not create a parallel session database.

### DO NOT COPY
- Hosted account/sync platform as the first response.
- Background scan of browsing history or page contents.
- CRM/calendar/document integrations, team workspace, collaboration SaaS or autonomous browser agent.
- Broad `<all_urls>`/content-script architecture for a URL/title session-capture problem.

## Four-Gate Decision

### 1. Problem / value

Target user is a desktop browser user who already creates Work/Study/Coding/custom MYNT workspaces but must manually enter launch URLs. The observable workflow gap is that an already-open real browser context cannot become a workspace candidate without manual URL reconstruction; Scratchpad/tasks are also not currently bound to a workspace as preserved context.

Current repo evidence: README defines Workspaces as preferred widgets, focus duration, background and launch URLs; current `main` remains the same product baseline as the prior radar. Existing substitute: manually configure launch URLs, use Scratchpad/ToDo separately, or rely on the browser's own tab restore.

Counter-evidence: owner direction already classified Session Capsule as research-only; no first-person MYNT usage evidence shows this manual step is frequent enough to outrank the default-branch P2 modal gap or active PR review work. Offiqa's 0 ratings do not establish market traction.

### 2. Priority

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
evidence: EXTERNAL_PRODUCT_SHAPE_CONFIRMED / USER_DEMAND_UNKNOWN
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime: NEEDS_RUNTIME_VERIFICATION
```

No P0/P1/P2 claim is made. Competitive presence does not prove product failure. The new evidence does not overturn the 2026-09-18 `INVEST / SIMPLIFY` decision or the priority of the existing modal accessibility finding.

### 3. Minimum solution

Compare in order:
1. **No code change** — keep manual launch URLs and separate Scratchpad/ToDo. This remains the default because user demand is unproven.
2. **Documentation/reuse only** — show a workflow for using one workspace + one Scratchpad section + one Today task; measure whether users still reconstruct context manually.
3. **Narrow research fixture** — if authorized later, add a local prototype that captures only selected/current-window URL/title metadata after explicit action, previews exclusions, stores it inside the existing workspace model, and restores missing tabs only.
4. Only if that validates value should a small optional workspace-context field or existing task reference be considered.

Rejected for now: new database, background session daemon, cloud sync/account, workspace registry, collaboration layer, browser-agent framework, CRM integrations or AI summarization of tabs.

### 4. Research / implementation separation

No implementation authorization is created. A future bounded research question would be: **"For users who already use MYNT Workspaces, does explicit capture of current tab URLs plus one saved note/next action reduce manual context reconstruction enough to justify the extra `tabs` permission?"**

Minimum experiment: one supported Chromium runtime, one current-window capture flow, one preview, one local workspace revision, one restore-missing-only path, synthetic/non-sensitive URLs. Measure successful capture/restore, excluded/unsupported counts and whether the added permission is accepted. BUILD only if the workflow materially removes repeated manual reconstruction; NARROW if value exists but permission/scope is too broad; REJECT if manual presets are sufficient.

## Issue / PR Mapping and coordination

- Target Issues are disabled: `ISSUE_WRITE_BLOCKED` for new target tracking.
- No new Issue created because this is also a duplicate/root-cause continuation of the existing Session Capsule opportunity, not a new defect.
- PR #4 (AI Assist) remains active draft and is not touched.
- PR #5 (exam dashboard) remains active and is not touched.
- No comments were added, no lock was taken, because no existing Issue/PR/shared target state was modified.
- No product source, CI/config, settings, secrets, permissions, repository settings, branch for implementation, merge, deployment, paid API or external data write was performed.

## Rejected Ideas

- "Offiqa has it, therefore MYNT must build it" — rejected; competitor existence is not user-value proof.
- "Local-first means capture has no privacy cost" — rejected; tab URLs/titles can be sensitive and capability disclosure still matters.
- "Use AI to summarize all open tabs" — rejected; adds content access/model complexity before the base workflow is validated.
- "Add cloud sync first" — rejected; owner direction and current evidence favor local reversible state.
- "Build a full session/version registry" — rejected; existing workspace + backup primitives are enough for a bounded experiment.

## Sources

Primary external/public-web sources, accessed 2026-09-23:
1. Offiqa homepage — https://offiqa.com/ — last reviewed 2026-09-14.
2. Offiqa Chrome Web Store — https://chromewebstore.google.com/detail/offiqa-%E2%80%94-new-tab/ngobfaakfdicgnbfeploaepeddapfgpi — v1.0.0, updated 2026-09-13, 0 ratings at access time.
3. Offiqa Help Center — https://offiqa.com/help/
4. Offiqa Privacy — https://offiqa.com/privacy/ — published 2026-06-26.
5. Offiqa Permissions — https://offiqa.com/permissions/ — published 2026-06-26.
6. Momentum install guide — https://get.momentumdash.help/hc/en-us/articles/360018986134-Installing-Momentum — updated 2026-09-15.
7. Momentum "How Momentum works" — https://get.momentumdash.help/hc/en-us/articles/115007780748-How-Momentum-works — updated 2026-09-20.
8. Opera vertical-tabs update — https://press.opera.com/2026/09/10/opera-turns-vertical-tabs-upside-down/ — 2026-09-10.
9. Chrome permissions — https://developer.chrome.com/docs/extensions/reference/permissions-list
10. Chrome Tabs API — https://developer.chrome.com/docs/extensions/reference/api/tabs
11. Chrome extension development overview — https://developer.chrome.com/docs/extensions/develop

Repository/historical evidence:
- `Reese-max/MaterialYouNewTab@7d32f2f460cc879b3efbaa2523cadc11508882cd`
- product-code baseline `c9e58837534b4853395f9a06e30086d8f7bf5a3f`
- `docs/competitive-intelligence/2026-09-10-external-radar.md`
- `MaterialYouNewTab` product-board audit commit `7d32f2f460cc879b3efbaa2523cadc11508882cd`
- rule blob `8167e10798071d2276addaff6b201c6b0e904a2a`

## Completion / gaps / cursor

- Fresh owner inventory: **42 owned / 41 unarchived**, pagination complete.
- New external high-value signal retained: **1** (Offiqa direct workflow confirmation).
- New Issues: **0**.
- Existing Issue/PR comments or scope changes: **0**.
- Implementation authorization: **0**.
- Runtime experiment: **not executed**; `NEEDS_RUNTIME_VERIFICATION` if research is later authorized.
- Portfolio CLEAN: **not declared**.
- Next fair external-radar cursor: **`Reese-max/cf-mcp-server`**.
