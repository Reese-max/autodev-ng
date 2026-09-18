# 外部競品／新品／工作流靈感雷達 — 2026-09-18T21:56:57Z

Status: **COMPLETE / MATERIAL_STRATEGIC_SIGNAL / NO_NEW_ISSUE**

> 查閱日：2026-09-18 UTC（臺灣時間 2026-09-19）。
> Issue Quality：`issue_quality_version: 2`；規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
> Primary repo：`Reese-max/lobsterpulse`。
> Current default-branch HEAD：`ced78980b1e687313b146155e83e7ab51f358b35`。
> 本輪主要情報來源為 Reese-max GitHub 之外的公開網路；GitHub 只用來確認 owner scope、產品現況、去重、active work 與保存報告。
> 本輪沒有修改產品原始碼、CI/config、secrets、權限/settings，沒有建立實作 branch、merge/deploy、啟動 worker/run/GOAL、付費 provider request 或正式資料寫入。

## Executive Summary

Fresh connected GitHub inventory 重新完整分頁：**41 個 Reese-max-owned repositories / 40 個 unarchived**；`obsidian-vault` 為 archived。前輪 cursor 指向 `Reese-max/lobsterpulse`，本輪依公平輪巡處理 LobsterPulse。

LobsterPulse owner-approved/current product direction仍明確：它是給 Reese-max/OpenAB 與多 CLI power user 的**本機、低干擾、跨 provider 即時狀態監控器**，核心工作是知道哪個 agent 正在 working / waiting / stale / ended，並在不反覆切換終端機的情況下取得足以行動的 context。2026-09-14 Product Board 明確要求 **INVEST / SIMPLIFY**，優先完成 #3 runtime truth、#5 provider truth、#6 distribution truth、#11 Prometheus migration truth；不要擴成 cloud account、mobile/team SaaS、agent orchestrator、IDE extension、provider-count race 或另一套 observability dashboard。

本輪真正有價值的外部變化有三個：

1. **Claude Code Projects 在 2026-09-17 起把多個 cloud coding sessions 收斂到「Project → coordinator → parallel threads → separate branches/PRs → shared memory」的 provider-owned 工作流。**目前沒有找到 Anthropic 第一方長文文件，因此本報告將細節標為 `LIKELY / MULTIPLE-INDEPENDENT-REPORTS`，不把媒體報導冒充第一手產品契約。這個變化的重要意義不是 LobsterPulse 應該做 coordinator，而是相反：**generic multi-agent coordination 正被 provider 本身吸收；LobsterPulse 應維持 cross-provider observation / attention，而不是跨界成 orchestration product。**
2. **Splunk Token Meter（第一方文章 2026-09-08，本輪 2026-09-18 再被媒體報導）證明另一種更小的 local-first 觀測模式：直接讀 agent 已存在的 local trace files，做 live cost/activity/session analysis，不要求 API key、不把資料送出本機。**這對既有 #12 的價值是「補一個更被動的 usage/post-hoc evidence source」，但不推翻 9/16 已完成的 NARROW 結論：live WAITING 仍不能由事後 trace/OTel 訊號可靠取代即時 hook truth。
3. **Argus 與 Agent Watch 的現況共同強化 hybrid ingestion。**Argus 用 local OTLP 做 Claude/Codex/Gemini 的 usage/session/project analysis；Agent Watch 公開說明 Claude 用 full hook telemetry、Codex 用 session/completion、Gemini 用 OTLP。市場反而沒有收斂成「全部 OTel」或「全部 hooks」。

因此四道 Gate 後結果為：**0 新 Issue、0 Issue 修改／留言、0 PR 留言、0 implementation authorization**。#12 已有 NARROW research receipt；#9 有 open PR #10；#3/#5/#6 亦都有 active PR scope。本輪的新證據足以校準產品方向，但不足以形成新的 validated root cause。

下一個公平輪巡 cursor：**`Reese-max/ai-flight-radar`**。

---

## Direction / GitHub Current State

### Quality rules

本輪先重讀 `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，blob SHA 仍是 `8167e10798071d2276addaff6b201c6b0e904a2a`。依規則：競品存在不等於產品缺陷；RESEARCH / OPPORTUNITY 不可混成 P1/P2 BUG；先比較不改、文件、重用、局部修補，再考慮新模組/DB/framework；研究需有 BUILD/NARROW/REJECT；Issue 不是實作授權。

### Product direction re-read

Product Board 目前仍以以下順序為主：

1. #3：Codex enablement/config-preservation runtime truth。
2. #5：13-provider promise / denominator truth。
3. #6：truthful, obtainable desktop installation path。
4. #11：過期 Prometheus `_total` migration 的 CUTOVER / POSTPONE / CANCEL truth。

明確 non-goals：cloud accounts、mobile、team collaboration、billing、IDE extension、broad agent orchestration、另一套 observability dashboard、provider-count race。

### Current repo reality

Default branch 在報告寫入前再次核對仍為：

`main@ced78980b1e687313b146155e83e7ab51f358b35`

目前產品本身已有的 counter-evidence 很重要：

- `HookEvent` 已保存 `provider / session_id / cwd / tool_name / notification_type / prompt / tool_call_id / tool_status / terminal_pids / tab_title`。
- `Session` 已保存 `id / provider / state / cwd / last_tool_name / last_prompt / token samples / terminal_pids / tab_title`。
- `PermissionRequest | Notification` 會進 `WaitingForUser`，而不是從沒有 event 的 silence 猜等待。
- #9 已經研究 `AttentionEvent / AttentionItem / AttentionReceipt`、correlation、snooze、why_now、UNKNOWN/STALE fail-visible；PR #10 仍 open。
- #12 已在 2026-09-16 以 deterministic offline contract replay 得到 **NARROW**：native OTel 可以繼續研究 usage/session correlation/post-hoc diagnostics，但現有契約不足以取代 live WAITING hook。

因此不能因 Claude Projects 多了「Project/Thread/Branch」就斷言 LobsterPulse 缺 project identity，也不能因 Token Meter/Argus 用 OTel/trace 就宣稱 hooks 應移除。

### Active ownership / coordination

目前 open PR：

- #14 → #3 packaged runtime evidence / Codex fixture matrix。
- #13、#7 → #5 provider-coverage wording / denominator truth。
- #10 → #9 Attention Queue research design。
- #8 → #6 truthful install path。

這些 scope 均不搶改。本輪沒有需要修改既有 Issue，因此沒有取得新的 issue lease；#12 的 2026-09-15 research lease 已明確 release，研究結果為 NARROW。

---

## Product → Market Category

1. **Cross-provider local attention monitor**：LobsterPulse 的核心定位。
2. **Remote multi-agent monitoring/control SaaS**：Agent Watch。
3. **Local usage/cost observability**：Splunk Token Meter、OpenUsage、Argus。
4. **Provider-owned multi-agent project coordination**：Claude Code Projects。
5. **General agent runtime/orchestration**：應視為 provider/tooling infrastructure，不是 LobsterPulse 的差異化。

---

# External Signals

## A. Major provider strategy — Claude Code Projects 把 parallel coordination 變成 provider-owned workflow

**LIKELY / MULTIPLE-INDEPENDENT-REPORTS｜announcement 2026-09-17；checked 2026-09-18 UTC**

Sources:
- https://www.theverge.com/ai-artificial-intelligence/997134/anthropic-claude-code-projects
- https://devops.com/anthropic-adds-a-coordinator-to-claude-projects-for-running-ai-work-in-parallel/
- https://www.timesofai.com/news/anthropic-claude-code-projects-multi-agent/

多個獨立報導一致描述新的 Claude Code Projects：一個 coordinator 會把較大的工作拆成 parallel threads；每條 thread 是獨立 Claude Code cloud session，使用自己的 repo copy / branch；結果仍透過傳統 PR / merge conflict 邊界整合；Project 另有 shared memory、files/artifacts library。Times of AI 文章亦嵌入 Claude 官方社群貼文，稱 Projects 從單一 conversation 開始、parallel threads 在 laptop 關閉後仍可持續工作；但本輪沒有找到 Anthropic 第一方完整技術文件，所以不把所有細節升級為 `CONFIRMED_FIRST_PARTY`。

### User job being attacked

`我同時跑很多 coding sessions → 自己拆工作 → 自己記哪個 branch/session 做什麼 → 來回切換 → 手動拼結果`

### Product implication for LobsterPulse

這不是「缺 coordinator」的證據，反而使 LobsterPulse 的產品邊界更清楚：

- Provider 本身正在接管 **planning / task fan-out / shared project memory / branch orchestration**。
- LobsterPulse 應專注於 **跨 provider 的 observed state / attention / freshness / evidence**。
- 當同一個 Project 內有更多 parallel threads 時，低干擾 cross-provider monitor 的價值可能增加，但前提仍是 session identity、truth state 與 attention classification 正確。

### Why no Issue

目前 repo 已有 `session_id + cwd + terminal_pids + tab_title`，而 #9 也以 provider/session/execution ref 為 attention identity。尚未觀察到 LobsterPulse 因 Claude Projects 的 branch/thread model 而把兩條真實 session 合併、誤跳終端機、或把錯誤 task 標成 blocking。

因此目前 classification 只是：

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: LOW_MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
```

只有未來真實 multi-thread fixture 證明 `session_id + cwd + tab_title` 不足以區分同 repo 多 worktree/thread，才值得開一個窄的 identity-gap Issue；第一步也應是補一個可觀察欄位，不是做 Project manager。

**Decision：DIFFERENTIATOR REINFORCEMENT / NO ISSUE。**

---

## B. Direct/adjacent new product — Splunk Token Meter 用既有 local traces 做 local-first live observability

**CONFIRMED FIRST-PARTY｜2026-09-08；checked 2026-09-18 UTC**

Sources:
- https://www.splunk.com/en_us/blog/artificial-intelligence/token-meter-a-live-cost-meter-for-your-coding-agents.html
- https://devops.com/splunk-open-sources-token-meter-tool-for-application-developers/ （2026-09-18 independent coverage）

Splunk 公開的 Token Meter 讀取 coding agents 已存在的 local trace files，顯示 live token consumption、estimated cost、context pressure、tool activity、session state/history；產品宣稱 local-only、no API key、資料不離開本機，並支援 Claude、Codex、Cursor、OpenCode、Kiro、Pi 等。它還提供 budget alerts、session comparisons 與 read-only MCP 查詢。

Splunk 文中提到作者使用後降低每週花費約三分之一，這是**廠商/作者自身使用敘述**，不是獨立效果研究，本雷達不拿它推估 LobsterPulse ROI。

### Transferable principle

對 LobsterPulse 而言，真正值得移植的不是 cost dashboard，而是：

> **若 provider 已在本機留下足夠的 read-only trace/evidence，先讀既有 evidence，再考慮新增 config mutation / custom hook。**

這可減少某些 usage/post-hoc diagnostics 的侵入性，尤其 #1/#3 已證明 provider config mutation 本身有真實風險。

### Why this does not overturn #12

Token Meter 的強項是 usage/cost/activity/history；它沒有提供第一手證據證明「permission wait 開始瞬間」可以從 local trace 在使用者尚未做 decision 前被可靠觀測。#12 已經證明：Claude OTel exported `blocked_on_user` / `tool_decision` 對 live WAITING 仍太晚。

因此最小策略仍是 hybrid：

- attention truth：保留能直接觀測 WAITING-start 的即時 signal；
- usage/session/post-hoc：優先研究 provider-native OTel 或穩定 local trace；
- 不能從 silence 猜 state。

### Why no new Issue

它仍是 #12 的同一使用者工作／同一根因層：**如何減少為觀測而修改 provider config 的必要性**。換成「local trace reader」只是另一種候選 transport，不應因架構名不同重開一張。

**Decision：ADJACENT IDEA / DEDUP → #12 NARROW；NO COMMENT（無狀態改變）。**

---

## C. Direct competitor — Argus 證明 local direct-OTLP receiver 可很薄，但主要解 usage/history，不是 live attention

**CONFIRMED CURRENT PRODUCT｜publication date not stated；checked 2026-09-18 UTC**

Sources:
- https://argus-ai.vercel.app/docs/en/architecture
- https://argus-ai.vercel.app/docs/en/setup-guide
- https://argus-ai.vercel.app/docs/en/user-guide

Argus 的現行 architecture 是 local-only / no-auth：app 直接接 OTLP，不要求外部 OTel Collector；SQLite WAL 存資料；Claude/Codex/Gemini 的 telemetry 在 ingest 時 normalize。User Guide 有 project filter、date range 與 agent recency；Setup Guide 則要求各 provider 指到 local OTLP endpoint，並清楚列出 Claude/Codex/Gemini 的配置差異。

### Transferable

- local OTLP receiver 可以是薄層，不一定要變成 observability platform；
- project/session/freshness 適合做 post-hoc filtering；
- 不同 provider 的 setup 仍不同，因此配置責任不會因採用 OTel 自動消失。

### Do not copy

- 不因 Argus 有 SQLite 就替 LobsterPulse 再建 telemetry DB；
- 不做 dashboard parity；
- 不把 usage telemetry 當成 WAITING/COMPLETED ground truth；
- 不複製 AI suggestions 或 project analytics，除非有 LobsterPulse-specific user evidence。

**Decision：SHOULD REUSE PRINCIPLE / DEDUP → #12；NO ISSUE。**

---

## D. Direct competitor — Agent Watch 的 hybrid telemetry 再次反證「一種 transport 統一所有真相」

**CONFIRMED CURRENT PRODUCT CLAIM｜checked 2026-09-18 UTC**

Source:
- https://agent-watch.com/
- https://agent-watch.com/features/

Agent Watch 現在同時提供 live session status、needs-attention、remote terminal、alerts、cost tracking、configuration sync、autonomous GitHub-issue workflow 與 team/admin surfaces。目前公開 pricing 是 7-day trial（up to 3 agents）、US$7/month Basic、US$50/year Annual。

最重要的不是其 feature breadth，而是 supported-source 說明仍是 hybrid：

- Claude Code：full hook telemetry；
- Codex：session / completion events；
- Gemini：OTLP telemetry。

這與 #12 的 NARROW 結果方向一致。

### Do not copy

- cloud account / team billing；
- phone remote terminal；
- autonomous GitHub issue→PR harness；
- configuration sync / skill management；
- SMS/Slack/Discord alert matrix。

這些都和 LobsterPulse owner-approved non-goals 衝突，而且目前更高優先的 truth/install/runtime work 尚未完成。

**Decision：MUST UNDERSTAND / DO NOT COPY BREADTH / NO ISSUE。**

---

## E. Adjacent category — OpenUsage 的 35-provider breadth 是反例，不是目標

**CONFIRMED CURRENT PRODUCT CLAIM｜checked 2026-09-18 UTC**

Source:
- https://openusage.sh/

OpenUsage 現在主打 local terminal dashboard，跨 35 個 coding tools/API platforms 看 usage、spend、quota、rate limits、tokens、burn rate，並有 local SQLite、Prometheus、headless report、tmux/statusline。

對 LobsterPulse 的訊號不是「13 太少」，而是市場已經有人專門做 provider breadth + cost analytics。LobsterPulse 更值得維持「跨 provider live attention truth」差異，而不是把 #5 的 provider registry 重新變回 provider-count growth KPI。

**Decision：DO NOT COPY provider-count / analytics breadth。**

---

# New Releases / Current Changes

| Date | Signal | Confidence | LobsterPulse decision |
|---|---|---:|---|
| 2026-09-17 | Claude Code Projects 被多家媒體報導改成 coordinator + parallel cloud threads + branches/shared memory | LIKELY / cross-reported | generic orchestration 交給 provider；LobsterPulse 保持 observation/attention |
| 2026-09-18 | Splunk Token Meter 再被媒體報導為 open-source local coding-agent cost/activity monitor | CONFIRMED product, independent coverage | passive local evidence 是 #12 窄方向，不新增 Issue |
| 2026-09-08 | Splunk 第一方發表 Token Meter | CONFIRMED first-party | local trace reuse before new mutation |
| current | Argus local direct OTLP receiver / unified local dashboard | CONFIRMED current product | #12 corroboration；不做 DB/dashboard parity |
| current | Agent Watch hybrid source strategy + remote-control breadth | CONFIRMED current product claim | hybrid ingestion reinforced；cloud/mobile/autonomy = DO NOT COPY |
| current | OpenUsage 35-provider local usage dashboard | CONFIRMED current product claim | provider breadth race = DO NOT COPY |

---

# Community Pain

## Codex project association / task discovery drift

**COMMUNITY_SIGNAL｜2026-09-03 / 2026-09-04**

Sources:
- https://community.openai.com/t/openai-chatgpt-codex-desktop-app-update-v26-831-21537-sep-1-2026-wiped-projects/1394486
- https://community.openai.com/t/codex-desktop-created-task-completes-but-never-appears-in-task-listings/1394832

OpenAI Developer Community 有使用者回報 Codex Desktop 更新後 project sidebar association 消失、threads 仍留在 Recents，以及 isolated worktree task 已完成卻未出現在 task listings。這些是**使用者個案**，不能當成普遍發生率、也不能證明 LobsterPulse 有同類 bug。

可移植的產品原則只有：

- provider UI 的 project grouping 不應被 LobsterPulse 當唯一 source of truth；
- session/worktree/project identity 必須保持 observed evidence 與 UNKNOWN 狀態；
- 如果未來從 provider UI/project label 引入 identity，要能處理 missing/detached/stale，而不是 silently merge。

目前 LobsterPulse 仍使用自身 observed `session_id/cwd/tab_title/terminal_pids`，所以這些社群訊號**不是新缺陷證據**。

---

# Adjacent Ideas

### 1. Hybrid observation contract，transport-specific but truth-normalized

最值得保留的跨產品模式不是「統一 transport」，而是：

`hooks / native OTel / local traces / provider session events → source-specific adapter → explicit confidence/freshness → one observed session/attention contract`

現有 #12 已在這個方向縮範圍；若之後 BUILD，先一個 provider / 一個 missing field / 一條 read-only path，不做 provider framework。

### 2. Provider project orchestration becomes context, not LobsterPulse authority

Claude Projects 若普及，LobsterPulse 可以在未來**顯示** project/thread/branch context，但不應負責建立、排程、合併或治理那些 project。顯示前先證明現有 `session_id + cwd + tab_title` 真的不足。

### 3. Quiet budget tripwire, not cost-management product

Token Meter 的「平時安靜、超過 session/month threshold 才提示」和 #9 decision-only attention 的產品原則相容；但 LobsterPulse 不需要複製 cost dashboard。只有目前已有可靠 token/cost source 且真實使用者需要時，才考慮把 budget breach 當一種 `AttentionCandidate`。

目前先保留為非阻塞 idea；沒有 LobsterPulse runtime/use evidence，不開單。

---

# Opportunity Map

| Class | Opportunity / boundary | Evidence | Decision |
|---|---|---|---|
| **MUST MATCH** | session/provider/freshness 真相不可從 marketing registry 或 silence 推斷 | repo + #5/#12 + Agent Watch hybrid | already tracked |
| **MUST MATCH** | WAITING-start 與 post-hoc usage/decision 要分開 | #12 executed NARROW + current competitor patterns | already tracked |
| **SHOULD BE BETTER** | 本機、低干擾、跨 provider 的 attention truth；routine telemetry 不打斷人 | #9 + market shift to parallel agents | active research PR #10 |
| **DIFFERENTIATOR** | provider-independent local observation，不替 provider 做 project coordinator | Claude Projects shift + owner non-goals | reinforce direction |
| **ADJACENT IDEA** | passive local trace as read-only usage/post-hoc source | Splunk Token Meter | dedup to #12 narrow; no write |
| **ADJACENT IDEA** | project/thread/branch context only if current identity fixture proves ambiguity | Claude Projects + community signals | NEEDS_EVIDENCE; no issue |
| **DO NOT COPY** | remote terminals/mobile/team SaaS/config sync/autonomous issue→PR harness | Agent Watch | rejected by owner direction |
| **DO NOT COPY** | 35-provider breadth / full FinOps dashboard | OpenUsage / Token Meter | wrong product axis |
| **DO NOT COPY** | new telemetry DB / generic OTel collector/framework | Argus architecture is evidence that thin reuse is possible, not a requirement | overengineering |

---

# Four-Gate Review

## Candidate 1 — Add Claude Project/thread/branch awareness

### Gate 1: problem/value
- Target user: multi-agent power developer。
- External change is real enough to watch, but **repo currently already has session_id/cwd/tab_title/terminal PIDs**。
- No executed fixture shows identity collision or wrong jump caused by parallel Project threads。

**Result: FAIL current problem-evidence gate.**

### Gate 2: priority
`OPPORTUNITY / NOT_ESTABLISHED / LOW_MEDIUM / NEEDS_EVIDENCE`。不能升 P2。

### Gate 3: smallest solution
If future evidence exists, first try one extra observed identity field or display-only context; do not create project manager, branch registry, DB, or coordinator。

### Gate 4: research/implementation separation
Keep central idea only until a reproducible multi-thread ambiguity fixture exists。

**Decision: NO ISSUE。**

## Candidate 2 — Add passive local-trace ingestion

### Gate 1: problem/value
Current config mutation risk is real (#1/#3 history), and Token Meter proves local trace reuse is possible for some activity/usage jobs. But #12 already owns the root question: reduce custom hook/config mutation where provider-native evidence suffices。

### Gate 2
`RESEARCH / NOT_ESTABLISHED / MEDIUM / NEEDS_EVIDENCE`；not a defect。

### Gate 3
One provider + one read-only fixture + compare exact fields with current hook/OTel path. No daemon/DB/framework。

### Gate 4
#12 already concluded NARROW; new evidence does not change status or BUILD authority。

**Decision: DEDUP → #12; NO COMMENT。**

## Candidate 3 — Add cost budgets/FinOps UI

There is strong external market activity, but owner direction and current product weaknesses make this lower value than truth/install/runtime work. LobsterPulse already has token/quota context; no observed user failure requires a cost product。

**Decision: REJECT / DO NOT COPY。**

---

# Historical Issue / Scope Calibration

- **#12**：keep `RESEARCH / NOT_ESTABLISHED / NEEDS_EVIDENCE / auto_implementation=false`; 9/16 NARROW remains valid. Token Meter/Argus corroborate only the narrow usage/session/post-hoc branch。
- **#9 / PR #10**：舊 body 使用 `P2 Research` 與精確 93/100 score，是 v2 前語法。就目前規則，若日後重寫，應分離為 `RESEARCH / NOT_ESTABLISHED` 與 `decision_priority`，但 active PR #10 存在，本輪不搶改。
- **#3 / PR #14**：PR 宣稱 Linux packaged smoke evidence，但 default branch 尚未變；本輪不把 PR evidence冒稱 main 已完成，更不代替真實 Codex CLI event / non-Linux path。
- **#5 / PR #13/#7**：active scope；provider count/breadth外部訊號不應讓它擴回「更多 providers」工程。
- **#6 / PR #8**：active install truth；Argus/Token Meter 有 installer 不構成另開 distribution issue 的理由。
- **#11**：Prometheus migration truth still independent; external observability products do not change its root cause or severity。

---

# Cross-Portfolio Ideas

只有一個值得保留、且不應直接變共用 framework 的跨 portfolio 原則：

**Observed state should be transport-agnostic but evidence-specific.**

在 `lobsterpulse` 是 hook / OTel / trace / session event；在 `autodev-ng` 可能是 GitHub/CI/lease/run receipt；在 `ai-flight-radar` 可能是 provider/API/cache。共通原則是每個 observation 帶來源、freshness、confidence/UNKNOWN，然後才做 policy。這是設計原則，不足以批准跨 repo state framework。

---

# Rejected Ideas

1. **Clone Claude Projects coordinator into LobsterPulse** — provider-owned orchestration 正在商品化，且違反 owner scope。
2. **Build a generic telemetry collector/database** — #12 尚未需要，Argus證明 thin local receiver 可存在但不代表 LobsterPulse需要 DB。
3. **Replace hooks with OTel/local traces wholesale** — executed #12 evidence directly反對 live WAITING parity。
4. **Copy Agent Watch remote terminal/mobile/team/autonomous mode** — scope/maintenance/security burden過大，且已有明確 non-goal。
5. **Chase OpenUsage’s 35-provider breadth** — #5 正在修 truth denominator，現在用 provider count 競賽會倒退。
6. **Turn Token Meter cost claims into ROI estimate** — 廠商/作者敘述，不是 LobsterPulse independent efficacy measurement。
7. **Create a new project-identity ledger/framework** — 目前沒有 reproducible identity failure；`session_id/cwd/tab_title` 已存在。

---

# Issue Mapping

| Candidate / signal | Existing issue/PR | Action this round | Reason |
|---|---|---|---|
| provider-native / passive telemetry | #12 | no write | 9/16 NARROW already covers usage/session/post-hoc branch; no status change |
| decision-only attention under more parallel agents | #9 / PR #10 | `SKIPPED_LOCKED_ACTIVE_PR` | same fingerprint + active scope |
| session/project identity | none | no Issue | no reproducible LobsterPulse gap; current fields are counterevidence |
| provider breadth / support truth | #5 / PR #13/#7 | `SKIPPED_LOCKED_ACTIVE_PR` | external breadth signal does not change root cause |
| packaged runtime | #3 / PR #14 | `SKIPPED_LOCKED_ACTIVE_PR` | active runtime-evidence work |
| installation | #6 / PR #8 | `SKIPPED_LOCKED_ACTIVE_PR` | no new root cause |
| Prometheus migration | #11 | no change | unrelated to current external signals |

Result: **0 new Issue / 0 Issue comments / 0 PR comments**。

---

# Sources

## Public web — first-party / product sources

1. Splunk Token Meter, 2026-09-08: https://www.splunk.com/en_us/blog/artificial-intelligence/token-meter-a-live-cost-meter-for-your-coding-agents.html
2. Agent Watch current product/pricing/source strategy: https://agent-watch.com/
3. Agent Watch features: https://agent-watch.com/features/
4. Argus architecture: https://argus-ai.vercel.app/docs/en/architecture
5. Argus setup guide: https://argus-ai.vercel.app/docs/en/setup-guide
6. Argus user guide: https://argus-ai.vercel.app/docs/en/user-guide
7. OpenUsage current product: https://openusage.sh/

## Public web — independent / secondary

8. The Verge, Claude Code Projects, 2026-09-17: https://www.theverge.com/ai-artificial-intelligence/997134/anthropic-claude-code-projects
9. DevOps.com, Claude Projects coordinator, 2026-09-18: https://devops.com/anthropic-adds-a-coordinator-to-claude-projects-for-running-ai-work-in-parallel/
10. Times of AI, Claude Projects, 2026-09-18: https://www.timesofai.com/news/anthropic-claude-code-projects-multi-agent/
11. DevOps.com, Splunk Token Meter, 2026-09-18: https://devops.com/splunk-open-sources-token-meter-tool-for-application-developers/

## Community signals — not prevalence evidence

12. OpenAI Developer Community, missing Codex Projects after update, 2026-09-03: https://community.openai.com/t/openai-chatgpt-codex-desktop-app-update-v26-831-21537-sep-1-2026-wiped-projects/1394486
13. OpenAI Developer Community, task discovery sync issue, 2026-09-04: https://community.openai.com/t/codex-desktop-created-task-completes-but-never-appears-in-task-listings/1394832

## GitHub owner evidence

- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- `Reese-max/lobsterpulse/.github/quality-audits/2026-09-14-0410-product-board-audit.md`
- `Reese-max/lobsterpulse/README.md`
- `Reese-max/lobsterpulse/src-tauri/src/hook_event.rs`
- `Reese-max/lobsterpulse/src-tauri/src/session.rs`
- LobsterPulse Issues #3/#5/#6/#9/#11/#12 and current all-state PRs。

---

# What Changed

Compared with the last LobsterPulse-focused radar (`2026-09-15T200024Z-external-radar.md`):

1. #12 已完成一個 deterministic research iteration 並得到 **NARROW**，且 lock 已 release；本輪以此作為已決策 evidence，而不是再提「OTel 替代 hooks」。
2. 新出現／新確認 Splunk Token Meter：使「local trace read-only source」成為更可信的 adjacent pattern，但仍沒有 live WAITING parity evidence。
3. Claude Code Projects 市場方向變得更明確：provider 開始吸收 coordinator / parallel thread / shared project context；這降低 LobsterPulse 做 orchestration 的必要性，而非增加。
4. LobsterPulse active PR scope 比 9/15 增加 #13/#14；因此 provider truth 與 packaged runtime 都更不應被本輪搶改。
5. 未發現新的可重現 P0/P1/P2 root cause，也沒有外部證據推翻 owner 的「local-first monitor, not orchestration SaaS」方向。

---

# Completion / Gaps / Cursor

Completed:
- fresh owner repo pagination：41 owned / 40 unarchived；
- rule blob re-read：`8167e10798071d2276addaff6b201c6b0e904a2a`；
- LobsterPulse HEAD + Product Board + README + normalized event/session model re-read；
- open/closed Issue + all-state PR coordination review；
- #12 full comments / lock release / NARROW decision review；
- current public-web A/B/C exploration using non-Reese GitHub primary sources；
- qualitative Opportunity Map + four-gate review；
- duplicate/rejected/active-scope mapping。

Gaps / limits:
- no real Claude Projects beta access was exercised；
- no Anthropic first-party detailed Projects document was located this round, so implementation details remain `LIKELY` despite multiple independent reports；
- no Token Meter/Argus binary was installed or run；their behavior is product/documentation evidence, not independent runtime validation；
- no new LobsterPulse runtime session was executed；
- no claim that real users experience notification fatigue, project identity failures, or measurable cost savings。

Next fair-rotation cursor: **`Reese-max/ai-flight-radar`**。

This radar does **not** declare LobsterPulse or the portfolio CLEAN.