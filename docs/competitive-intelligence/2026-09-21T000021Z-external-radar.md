# External Competitive / New-Product / Workflow Radar — 2026-09-21T00:00:21Z

Status: **COMPLETE**

查閱日：2026-09-21 UTC。主要市場情報來自 GitHub 之外的 OpenAI / ChatGPT Learn、Anthropic / Claude、Agent Watch 與 Reddit 公開頁面；GitHub 僅用於 Reese-max 自有 repository inventory、owner 方向、default-branch 現況、Issue / PR 去重與中央報告寫入。

## Scope / direction / evidence boundary

- Governing rule re-read：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected owner inventory：完整列舉 **42 個 Reese-max-owned repositories / 41 個未封存**；唯一 archived repo 為 `obsidian-vault`，不納入 active product scope。
- Fair-rotation focal repository：`Reese-max/lobsterpulse`，承接上一輪 `2026-09-20T220621Z-external-radar.md` 的 cursor。
- Current default HEAD：`main@ced78980b1e687313b146155e83e7ab51f358b35`。最新 default-branch 變更仍是 audit/docs；近期產品基線包含已合併的 Codex config-preservation / enablement source fix。
- Current owner direction re-read from the 2026-09-14 Product Board：**INVEST / SIMPLIFY**。核心工作是 local Windows / OpenAB power user 的跨 coding-agent 真實狀態，而不是 cloud SaaS、team product、mobile、billing、IDE-extension race、provider-count race 或 agent orchestration。
- Current README still describes a Traditional-Chinese Tauri monitor with 9 OpenAB + 4 local CLI providers; local Claude/Codex/Copilot/Gemini monitoring is opt-in and writes provider hook/config files only when enabled.
- Active tracked scopes rechecked：#3 Codex runtime/config truth、#5 provider denominator truth、#6 install/distribution truth、#9 decision-only attention research、#11 Prometheus migration、#12 provider-native OTel research。Open PR #14/#13/#10/#8/#7 mean those scopes are actively owned; this radar does not seize or rewrite them.
- #9 has an active research PR #10. Its current review also contains a concrete unresolved schema comment: the design must represent `NOT_MONITORED / EXTERNAL_DEPENDENCY / UNKNOWN` rather than forcing them into success-like states. New attention evidence in this run is therefore **SKIPPED_LOCKED** for Issue/PR writes and retained only in this central report.
- No product source, CI/config, secrets, permissions/settings, implementation branch, merge/deploy, worker/GOAL, paid service, or production data was changed.
- No packaged LobsterPulse, real OpenAI Pet, Claude Projects thread, Agent Watch client, or multi-agent session was executed in this run. Runtime/effectiveness claims remain `NEEDS_RUNTIME_VERIFICATION`.
- Portfolio CLEAN is **not** declared.

## Product → market category

`lobsterpulse` remains best treated as a **local cross-provider coding-agent attention/status monitor**:

1. one low-glance local surface for `WORKING / WAITING / COMPLETED-or-ended / STALE / UNKNOWN` across heterogeneous coding agents;
2. personalized OpenAB + local CLI coverage rather than generic SaaS/team observability;
3. hook/native-event/OTel transport normalized above provider-specific sources;
4. explicit local configuration ownership and truthful source/freshness status;
5. monitoring and attention compression, not autonomous work dispatch, remote terminal control, or agent orchestration.

The current defensible value is no longer “a status surface exists.” First-party platforms are now shipping their own ambient status surfaces. LobsterPulse must instead be better at **cross-provider truth and bounded human-attention prioritization without taking control of the agents**.

## External Signals

### A. CONFIRMED — OpenAI now exposes a first-party ambient multi-chat attention surface with explicit priority semantics

**Current first-party capability; checked 2026-09-21. The retrieved docs page does not expose a reliable publication date, so no release date is invented.**

Source: https://learn.chatgpt.com/docs/pets

ChatGPT Desktop on macOS and Windows now supports an optional floating Pet that remains above other applications and can follow activity while the user works elsewhere. The key product signal is not the character animation; it is the documented status contract and cross-chat prioritization:

- `Running` — chat actively working;
- `Needs input` — approval, answer, or another user decision required;
- `Ready` — completed with unread activity;
- `Blocked` — failed or hit a system error;
- when several chats have activity, the UI prioritizes **Needs input → Blocked → Ready → Running**.

The desktop activity tray is also explicitly separate from system notifications. Codex CLI terminal Pets reuse the same four states for the current CLI session but do not provide the desktop multi-chat tray.

**User job:** while several long-running chats/tasks are active, avoid repeatedly opening each one just to determine whether human action is needed.

**What is transferable to LobsterPulse:**
- `event/state exists` and `human should look now` are different contracts;
- explicit `Needs input` should outrank routine completion/running activity;
- multi-session priority can be deterministic and explainable without an LLM summary;
- an attention tray can coexist with OS notifications rather than turning every state transition into an interruption.

**What should not be copied:** animated-pet customization, ChatGPT project/chat semantics, or another decorative overlay. LobsterPulse already has a capsule/tray surface; the useful evidence is the priority/state model.

This is **new external evidence for existing #9**, not a new fingerprint. Because PR #10 is active and already has unresolved schema feedback, this run does not comment on, rewrite, or enlarge that scope.

### B. CONFIRMED — Claude Projects moved from user-managed sessions to coordinator → parallel thread hierarchy

**Published 2026-09-17; checked 2026-09-21.**

Source: https://claude.com/blog/projects-redesigned

Anthropic’s redesigned Claude Projects beta changes the unit of work from a folder with manually managed conversations into a coordinator that scopes a goal, delegates to parallel threads, monitors/reviews outputs, and assembles the result. Each thread is a full Claude Code cloud session on its own branch/repository copy; users can monitor the overall project or drill into individual threads. Threads can themselves split work through subagents/loops/workflows. Anthropic also states that several threads may run simultaneously and can consume usage limits faster.

**User job:** delegate a multi-part goal without manually decomposing, handing off, and stitching multiple Claude Code sessions together.

**Implication for LobsterPulse:** the market’s session topology is becoming hierarchical (`project/coordinator → thread → possible subagent`) rather than only a flat list of terminals. This is strategically important but **not a current LobsterPulse defect**: the product does not claim Claude Projects cloud orchestration support, and owner direction explicitly rejects becoming an orchestrator.

If a future supported provider source begins emitting project/thread relationships, the smallest valid observability experiment is to preserve an optional parent/work-item reference in observed evidence and verify whether it prevents misleading status collapse. Do **not** build a project graph database, orchestration engine, shared memory layer, branch manager, or cloud-session controller before a real supported-path need exists.

Classification for now:

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: LOW_MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

Decision: **ADJACENT IDEA / HOLD**.

### C. CONFIRMED current product breadth — Agent Watch is expanding from monitor into remote control/configuration/autonomous execution

**Current public product capability; checked 2026-09-21. The page does not provide reliable feature-release dates, so this is a current-state signal rather than a dated release claim.**

Sources:
- https://agent-watch.com/
- https://agent-watch.com/features/

Agent Watch currently markets one dashboard for Claude Code, Codex and Gemini with live `running / idle / waiting` status, multi-channel alerts, token/cost tracking, terminal/file/editor remote control, session history/replay, team visibility, centralized skills/rules/instructions sync with version history/dry-run, and an autonomous mode that can pick up a GitHub Issue and open a PR. The public page still describes hybrid ingestion: Claude hook telemetry, Codex session/completion events, Gemini OTLP. Current pricing shown is a 7-day free trial, Basic US$7/month, Annual US$50/year.

**Transferable signal:** provider-specific transport can remain hybrid while the user-facing state vocabulary stays unified; config changes deserve dry-run/version-history semantics when a product owns them.

**Do not copy:** remote terminals, mobile control, team billing/admin, company-wide dashboards, autonomous GitHub Issue→PR execution, central skill/config management, or SaaS account infrastructure. Those would turn LobsterPulse into a materially different product and duplicate surfaces already owned by provider platforms and `autodev-ng`.

The direct-competitor move therefore strengthens the current owner boundary rather than creating an expansion mandate.

## New Releases / Market Moves

| Date / state | Product | Signal | Confidence | LobsterPulse consequence |
|---|---|---|---|---|
| current docs checked 2026-09-21 | ChatGPT Desktop / Codex CLI Pets | `Running / Needs input / Ready / Blocked`; multi-chat priority `Needs input > Blocked > Ready > Running` | CONFIRMED first-party | ambient status is platform-native; dedupe to #9, focus on cross-provider truth + deterministic attention |
| 2026-09-17 | Claude Projects redesigned | coordinator delegates to several full Claude Code cloud threads; project-level + thread-level monitoring | CONFIRMED first-party | hierarchy is becoming a real agent topology; HOLD until a supported LobsterPulse source needs it |
| current product checked 2026-09-21 | Agent Watch | monitoring expanded into remote terminal/config sync/team/autonomous Issue→PR surfaces | CONFIRMED vendor capability | reinforces `DO NOT COPY` boundary; no SaaS/orchestration expansion |

## Community Pain

Two community signals are retained only as anecdotes, not prevalence or ROI evidence:

1. **COMMUNITY_SIGNAL — 2026-06-30, Reddit r/ClaudeAI.** A developer running several Claude/Codex/Cursor sessions described missing approval waits and specifically preferred “one status light” that shows whether any agent needs attention without wrapping/replacing the existing IDE/terminal workflow. This is directionally aligned with LobsterPulse’s current product boundary and argues against expanding into a full remote workspace.
2. **COMMUNITY_SIGNAL — 2026-09-14, Reddit r/ClaudeWorkflows.** A workflow post describes a visual multi-session office that surfaces approvals/decisions and agent-team activity. It supports the broader demand for multi-session visibility but is low-weight and includes self-reported workflow claims.

Neither establishes how often Reese-max users hit the problem, the optimal priority policy, or any measurable time saved. The first-party OpenAI status contract is stronger product evidence than these anecdotes.

## Repository Truth / Counter-evidence

### Existing #9 already owns the decision-attention fingerprint

Issue #9 was created around the exact workflow gap: many provider/session events → routine/recovered events leave the human queue → unresolved decisions remain visible, with snooze/ack/resolve evidence and fail-visible UNKNOWN/STALE behavior. It already rejects turning LobsterPulse into an autonomous coding agent and requires deterministic reason codes.

PR #10 is open for this research scope. Its review currently points out that the proposed schema does not yet directly represent `NOT_MONITORED / EXTERNAL_DEPENDENCY / UNKNOWN` even though the safety contract requires those states. This is a current active implementation/research concern and stronger immediate evidence than creating another attention ticket.

Therefore OpenAI Pets does **not** justify a new `[Competitive Inspiration]` Issue, a new queue framework, or a comment that could expand an active PR. The new evidence is recorded here only: **SKIPPED_LOCKED**.

### Existing #12 already owns provider-native signal simplification

The OpenAI/Anthropic market changes do not invalidate #12. Provider-native UX/status surfaces are evidence that status semantics are becoming first-party; #12 remains the bounded technical question of whether native OTel can reduce LobsterPulse’s custom hook/config mutation for one provider without losing truthful attention state.

No OTel adapter, collector, migration, or provider change is authorized here.

### Current reliability / delivery work still outranks feature expansion

#3/#5/#6/#11 remain concrete truth/lifecycle work. PR #14 is collecting packaged Codex runtime evidence; PR #13/#7 are provider-claim work; PR #8 is install-path work. A first-party ambient status competitor does not make those gates less important. It makes an untrustworthy duplicate status surface less defensible.

## Adjacent Ideas

### 1. Reframe #9 around explicit human-attention ordering — DEDUPED / SKIPPED_LOCKED

New evidence suggests a simple ordering can be enough:

`NEEDS_INPUT / human decision > BLOCKED / error > READY / unread completion > RUNNING`

This should **not** be copied literally into code without LobsterPulse fixtures. Existing states include `STALE / NOT_MONITORED / EXTERNAL_DEPENDENCY / UNKNOWN`, and those must remain fail-visible rather than being forced into OpenAI’s four-state vocabulary.

Smallest future research, only within existing #9 ownership:
- replay a fixed event set through the current design;
- compare current human-facing order against one explicit deterministic ordering;
- count misses of pre-labelled human-decision items and false interruptions;
- keep source freshness and UNKNOWN semantics visible;
- exit BUILD/NARROW/REJECT without adding an LLM ranking model.

No Issue/PR write this run because #9/PR #10 is active.

### 2. Optional parent/work-item reference for hierarchical sessions — HOLD

Claude Projects shows a real future topology where one user-visible goal owns several worker sessions. If LobsterPulse later ingests such a source, one optional `parent_work_ref` / `project_ref` in normalized evidence may be enough to preserve context.

No current supported-path failure proves it is necessary. Do not create a graph store, coordinator UI, project state machine, shared memory, worktree manager, or orchestration API.

### 3. Separate attention surface from notification transport — KEEP

OpenAI explicitly separates its activity tray from system notifications. This is a useful product invariant: a durable “needs attention” list can exist without firing an equal-severity OS notification for every event.

This is already within #9’s intent and is not a new project.

## Opportunity Map — `lobsterpulse`

### MUST MATCH

- `Needs human input` must be distinguishable from routine running/completion and from failure.
- `UNKNOWN / STALE / NOT_MONITORED / EXTERNAL_DEPENDENCY` must remain explicit; absence of a signal is not success.
- Provider/session identity and freshness must remain traceable to a real source.
- User-owned provider config must be preserved when monitoring is enabled/disabled.
- One truthful install/runtime path and provider denominator remain prerequisites to broad claims.

### SHOULD BE BETTER

- Cross-provider semantics should be more stable than each vendor’s private UI vocabulary.
- Human-attention ordering should be deterministic, inspectable and bounded; no LLM is needed where reason codes suffice.
- A low-glance surface should point the user to the exact provider/session/work item that needs a decision.
- If hierarchical agent sessions become supported, preserve enough parent context to avoid collapsing a coordinator and worker threads into misleading one-session status.

### DIFFERENTIATOR

- One local Windows-first capsule across personalized OpenAB + local coding CLIs.
- Cross-provider truth while first-party Pets/status surfaces remain provider-specific.
- Local structured telemetry/Prometheus without requiring a cloud account.
- Attention compression without taking mutation/orchestration authority over the agents.

### ADJACENT IDEA

- Evidence-only parent/project reference for supported hierarchical sessions, after a real provider path exists.
- Compare explicit attention ordering inside existing #9 using deterministic replay fixtures.

### DO NOT COPY

- Animated pet/theming as a product priority.
- Claude Projects coordinator/orchestration engine, cloud thread manager or shared-memory system.
- Agent Watch remote terminal, file editor, team SaaS, billing/admin plane or autonomous Issue→PR workflow.
- Provider-count race or a second generic observability dashboard.
- LLM summaries/rankers for every raw event.
- Mobile/cloud account sync without owner/user evidence.

## Cross-portfolio ideas

### 1. `activity state` and `human-attention state` should be separate concepts

Across `lobsterpulse`, `autodev-ng`, `ai-flight-radar` and other monitoring products, “something is running / changed / completed” is not equivalent to “a human should be interrupted now.” A reusable principle is:

`observation -> source/freshness truth -> deterministic policy -> human-attention state -> notification transport`

This is an architectural invariant, **not** authorization to create a shared cross-repo framework/database.

### 2. Hierarchical agents increase the importance of identity, not the need for a universal orchestrator

Claude Projects demonstrates coordinator→thread topology. Other Reese-max monitors may eventually observe nested work too. First response should be preserving traceable parent/child identity in evidence where the source provides it, not building a portfolio orchestration service.

## Four-gate decisions

### Candidate A — copy OpenAI’s attention priority into a new LobsterPulse feature

1. **Problem/value:** the user job is real and directly relevant; first-party OpenAI now exposes explicit multi-chat prioritization. But LobsterPulse already has #9 for the same fingerprint.
2. **Priority:** `RESEARCH / severity=NOT_ESTABLISHED / decision_priority=MEDIUM / NEEDS_EVIDENCE`. External market validation does not prove LobsterPulse’s current users suffer a P2/P1 defect.
3. **Minimum solution:** no new module. If/when #9 owner continues, use one deterministic replay comparison and preserve UNKNOWN/freshness semantics.
4. **Research/implementation separation:** active PR #10 means this run leaves evidence in the central report only. No comment, scope change, implementation authorization, merge or deploy.

Decision: **DEDUPED → #9 / SKIPPED_LOCKED**.

### Candidate B — add project/coordinator/thread hierarchy now

1. **Problem/value:** Anthropic now has a concrete hierarchical multi-agent product, but LobsterPulse does not claim to monitor Claude Projects cloud threads and no supported path is failing.
2. **Priority:** `OPPORTUNITY / NOT_ESTABLISHED / LOW_MEDIUM / NEEDS_EVIDENCE`.
3. **Minimum solution:** do nothing until a provider source actually exposes hierarchy to LobsterPulse; then first test an optional parent/work reference.
4. **Research/implementation separation:** no Issue, no schema change, no coordinator UI.

Decision: **HOLD**.

### Candidate C — follow Agent Watch into remote control/team/autonomous execution

1. **Problem/value:** vendor capability exists, but no owner-approved user job requires it; current Product Board explicitly rejects these surfaces.
2. **Priority:** `OPPORTUNITY / NOT_ESTABLISHED / DEFERRED`.
3. **Minimum solution:** none; keep monitor local and observational.
4. **Research/implementation separation:** competitor breadth is not authorization.

Decision: **DO NOT COPY / REJECT under current direction**.

## Rejected Ideas / reasons

1. **Create another attention-priority Issue — REJECT / DEDUPE.** Same root workflow as #9; active PR #10 owns it.
2. **Add a Pet UI — REJECT.** The transferable insight is attention semantics, not animation/theming.
3. **Build Claude-style coordinator/threads — REJECT now.** This would change LobsterPulse from observability into orchestration.
4. **Add remote terminal/mobile/team SaaS because Agent Watch has them — REJECT.** Contradicts current owner scope and adds auth/network/permission burden.
5. **Create a hierarchy database/state machine in advance — REJECT.** No current supported source requires it.
6. **Use vendor/self-reported efficiency claims as ROI — REJECT.** No LobsterPulse-specific human or runtime measurement exists.

## Issue Mapping / coordination

| Issue / PR | Relation to this radar | Action |
|---|---|---|
| #9 / PR #10 | Exact decision-attention fingerprint; new OpenAI state-priority evidence is relevant | **SKIPPED_LOCKED** — active PR; central report only |
| #12 | Native provider telemetry as an observation source | No change; still bounded one-provider research |
| #3 / PR #14 | Codex enablement/runtime truth | No change; higher-priority concrete reliability evidence |
| #5 / PR #13 + #7 | provider denominator/truth | No change; active scope |
| #6 / PR #8 | truthful acquisition/install path | No change; active scope |
| #11 | Prometheus lifecycle truth | No change |

New Issues: **0**  
Issue comments/edits: **0**  
PR comments/edits: **0**  
Implementation authorization: **0**

## Sources

### First-party / current product
- OpenAI / ChatGPT Learn — Pets, current docs checked 2026-09-21: https://learn.chatgpt.com/docs/pets
- Anthropic / Claude — Projects redesigned, published 2026-09-17: https://claude.com/blog/projects-redesigned
- Agent Watch — current product checked 2026-09-21: https://agent-watch.com/
- Agent Watch Features — current product checked 2026-09-21: https://agent-watch.com/features/

### Community signals — anecdotal only
- Reddit r/ClaudeAI, 2026-06-30, multi-agent “one status light” / missed waiting-for-input workflow: https://www.reddit.com/r/ClaudeAI/comments/1ujnf5b/
- Reddit r/ClaudeWorkflows, 2026-09-14, visual multi-session approval/decision workflow: https://www.reddit.com/r/ClaudeWorkflows/comments/1wfpki6/

### Repository / governance
- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` — blob `8167e10798071d2276addaff6b201c6b0e904a2a`
- `Reese-max/lobsterpulse/.github/quality-audits/2026-09-14-0410-product-board-audit.md`
- `Reese-max/lobsterpulse/README.md`
- `Reese-max/lobsterpulse/issues/9`, `#12`, `#3`, `#5`, `#6`, `#11`
- Open PRs `#14`, `#13`, `#10`, `#8`, `#7`
- Previous focused LobsterPulse radar: `docs/competitive-intelligence/2026-09-15T200024Z-external-radar.md`

## What Changed

Compared with the previous focused LobsterPulse radar:

1. **New first-party competitive evidence:** OpenAI’s current desktop Pet now documents a concrete cross-chat human-attention order (`Needs input > Blocked > Ready > Running`). This validates the direction of #9 but does not create a new fingerprint.
2. **New platform topology:** Anthropic’s 2026-09-17 Claude Projects redesign makes coordinator→parallel-thread work a first-party coding workflow. It is strategically relevant but remains an adjacent unsupported topology for LobsterPulse.
3. **Current competitor boundary rechecked:** Agent Watch now clearly markets monitoring plus remote control/config sync/team/autonomous Issue→PR workflows. This reinforces the decision to keep LobsterPulse observational/local rather than copy breadth.
4. **No new repository defect was established.** Existing concrete reliability/delivery work remains higher priority than feature expansion.
5. **No active scope was touched.** #9 evidence was intentionally left in this central report because PR #10 is active and has unresolved review feedback.

## Classification / scope calibration

- OpenAI attention priority evidence → **RESEARCH / NOT_ESTABLISHED / MEDIUM / DEDUPED to #9 / SKIPPED_LOCKED**.
- Claude hierarchical Projects → **OPPORTUNITY / NOT_ESTABLISHED / LOW_MEDIUM / HOLD**.
- Agent Watch remote/team/autonomous breadth → **DO NOT COPY under current owner direction**.
- Historical labels such as `P2 Research` in #9 are not treated as proven severity=P2 under Issue Quality v2; research urgency and defect severity remain separate.
- No market announcement, vendor feature, synthetic persona, or community anecdote grants implementation authority.

## Completion / gaps / fair cursor

Completed:
- issue-quality-v2 re-read and blob SHA captured;
- fresh owner inventory rechecked: 42 owned / 41 unarchived;
- current LobsterPulse board direction, default HEAD, README, Issues and all-state PRs re-read;
- historical focused LobsterPulse radar deduped;
- public-web exploration covered direct/platform competitor, adjacent workflow, emerging multi-agent topology, current competitor breadth, and community pain;
- four-gate decisions and Opportunity Map recorded;
- zero unnecessary Issues created.

Gaps retained honestly:
- no packaged LobsterPulse or live provider session executed;
- no ChatGPT Pet or Claude Projects runtime was exercised;
- no evidence that current LobsterPulse users need hierarchical project/thread status;
- no measured miss/false-interruption rate for #9 attention policies;
- no claim that Agent Watch marketing or community anecdotes prove productivity/ROI;
- open PR scopes remain active and were not mutated.

Next fair-rotation cursor: **`Reese-max/ai-flight-radar`**, preserving the historical `lobsterpulse → ai-flight-radar` rotation sequence.
