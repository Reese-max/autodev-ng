# 外部競品／新品／工作流靈感雷達 — 2026-09-08 r7

> Scope：Reese-max 擁有、未封存且可視為產品的 repositories。本輪**主要情報來源為 GitHub 之外的公開網路**；GitHub connector 僅用來核對產品用途、最新 default-branch 行為、近期 commit、open/closed Issues/PR、duplicate fingerprint 與中央報告寫入。官方產品文案只當 capability / workflow / business-model signal，不直接當成效果證據；Reddit、OpenAI Developer Community 等使用者回報一律標 `COMMUNITY_SIGNAL`。

## Executive Summary

本輪找到 **2 個符合高價值立案門檻的新機會**，都源自「產品最近剛補齊一層能力後，外部市場顯示下一層應該如何長」：

1. **cf-mcp-server — 有界 Gradual Deployment / Health-gated Promotion**（92/100，MUST MATCH / DIFFERENTIATOR）→ 已建立 **#8**。
   - repo 在 r6 之後才剛加入 exact immutable Worker version deployment、target-bound confirmation、deployment drift check 與 read-back verification；但 production POST 仍固定把 target version 切到 **100% traffic**。
   - Cloudflare 自己的 Workers deployment primitive 原生支援兩版本 percentage split、version affinity、version-aware observability 與 rollback；最新 preview 文件 2026-08-26/27 仍持續強化 gradual rollout 說明。
   - 因此最自然的下一步不是更多 deploy button，而是：`directed smoke / small canary → bounded observation → fresh health receipt → explicit promote / abort`。

2. **autodev-ng — In-flight STEER 與 Next-turn QUEUE 分離**（91/100，SHOULD BE BETTER / DIFFERENTIATOR）→ 已建立 **#11**。
   - r6 後 default branch 新增 Discord/CLI `monitor/status/pause/resume/github` 等 operator control；`/task` 仍是把文字寫入未來 backlog，而 project pause 是較粗的 safety control。
   - OpenAI Codex mobile/remote workflow、Slack Code，以及近期 Product Hunt 的 SessionCast / VibeAround / Porte，都把「回到正在跑的 agent session、改方向、排 follow-up、stop turn、回覆 permission」當一級 control-plane Job。
   - 新 Issue 不做「Discord 聊天直接灌進 agent」；而是 `project + taskId + executionId + mode + TTL + hash → delivery disposition → receipt`，避免 race 與錯投。

本輪沒有發現足以推翻既有產品方向的外部市場訊號；反而進一步支持 Portfolio 既有的共通原則：**候選動作、正式執行與後續 promotion 必須是不同狀態，且每次人類介入都要綁 exact target 並留下可驗證 receipt。**

---

## Product → Market Category Map

| Repository | 市場／產品角色 | 本輪主要外部對照 |
|---|---|---|
| gemini-deidentifier | AI RPG / interactive fiction | persistent world / consequence engines |
| exam-archive | exam archive / public reference | source-grounded archives |
| police-exam-practice | legacy exam practice | exam drill apps |
| police-exam-archive | official question bank + practice | adaptive practice / deadline planning |
| 92-duty-scheduler | constraint scheduling | workforce schedulers / repair solvers |
| openab | Discord ↔ ACP coding-agent broker | remote agent approval/control planes |
| UkePack | MusicXML → teacher/child practice packs | Soundslice / Flat-style teaching workflows |
| ppt-studio | AI presentation workstation | Gamma / source-context deck creation |
| book5-windows-server-2022 | teaching content | versioned technical curriculum |
| obsidian-vault | local PKM/content | local-first knowledge workflows |
| voice-actress | legal essay grading / learning | evidence-linked rubric grading |
| taiwan-intel-dashboard | public-intelligence dashboard | monitoring / alert dashboards |
| autodev-ng | multi-agent delivery orchestrator | Codex/Claude/Slack remote agent operations |
| flux-image-gen | AI image workspace | provenance / Content Credentials |
| claude-mem | upstream memory fork | agent memory platforms |
| lobsterpulse | agent observability / hooks | OTel GenAI observability |
| prompt-autoresearch | prompt optimizer | prompt search / eval / promotion systems |
| neciken-summer-poem | AI writing + contest submission | contest discovery / rule monitoring |
| note-filler | evidence-grounded notes | research / drafting copilots |
| gooaye | placeholder / undefined | N/A until product identity exists |
| lplrs-judicial-sync | judicial-source synchronization | source change / tombstone pipelines |
| adng-memory | operational agent memory | temporal / governed memory |
| cyber-prep-coach | iPAS exam prep | mastery / next-best study |
| cf-ai-router | AI provider router | multi-provider routing / reliability |
| avatar-vfo | AI avatar/chat | persistent character / memory products |
| project-doctor-web | clinical teaching/research UI | medically constrained assistants |
| minideck | lightweight deck publishing | Gamma/Pitch-style publishing lifecycle |
| chatgpt-dual-pipeline | internship-note publishing pipeline | source→publish automation |
| internship-notes-sites-mirror | deployment/content mirror | mirror / artifact distribution |
| taichung-police-intel | public-sector intelligence monitor | role-based intelligence operations |
| soundbox-offline | local-first music | local media / LAN transfer |
| skill-foundry | Skill creation/certification | agent package / skill marketplaces |
| video-timeline-pipeline | video intelligence | adaptive multimodal evidence retrieval |
| ai-novel-workstation | long-running AI writing workstation | Sudowrite / long-form writing automation |
| clinical-scribe-worker | scribe evaluation | ambient clinical validation |
| MaterialYouNewTab | local-first new-tab productivity | local dashboards / optional sync |
| cf-mcp-server | Cloudflare MCP control server | MCP + Workers release management |
| tick-stock-panel | Taiwan market screen/backtest | screening / deterministic strategy tools |
| herdr-skills | multi-agent workflow skills | packaged agent roles / workflows |
| ninax-line-hermes | LINE ↔ long-running AI/video | messaging-based long-running agents |

---

# External Signals

## A. 直接競品近期新增／正在強化的能力

### CONFIRMED — OpenAI Codex：長時間 Agent 的 remote control 成為正式操作模式
**來源日期：** 2026-05-14；2026-09-08 重新查核

Source: https://openai.com/index/work-with-codex-from-anywhere/

OpenAI 將 Codex mobile/remote control 的 Job 描述得很清楚：當 agent 在 laptop/devbox/remote environment 做長時間工作，人可以離開原工作站後繼續看 active work、回答問題、review 發現、改方向、approve next step 或補新想法。

- **JTBD**：長任務不應要求人一直守在 terminal；需要介入時回到「同一個正在跑的 session」。
- **省時間／步驟**：不必 SSH/遠端桌面、不必重新開 prompt 重建 context。
- **Onboarding / distribution**：直接利用既有 ChatGPT mobile，而不是要求另一套開發控制台。
- **Automation / collaboration pattern**：execution 持續存在，control client 可晚點接入；人類控制與 agent execution 分離。
- **Pricing / business model signal**：本頁沒有足夠資訊支持「remote control 本身另行計價」的結論，因此不推論價格效果；產品訊號在於 remote control 被納入核心使用體驗，而非外掛。
- **限制／失敗點**：remote client 若看到的 session state 不是 canonical latest state，就可能發生 stale-control 風險；後述 2026-08-31 community report 正好提供反例訊號。
- **Reese 可吸收**：`autodev-ng` 把 Discord/CLI 從「監控 + project pause + future backlog」升級成 target-bound session control。
- **不應照抄**：不需要另做 mobile app；現有 Discord 已是低摩擦 distribution surface。

### CONFIRMED — OpenAI Academy, 2026-08-12：steer / review / approvals 被放進 Codex Team Workflow
Source: https://academy.openai.com/public/clubs/builders-etkn1/resources/codex-bootcamp-2026-09-23

近期 Codex Bootcamp 將「scope tasks、provide context、steer work、review changes」與「shared context、approvals、reusable skills、tool connections、repeatable team workflows」放在同一系列。這是產品定位訊號：成熟 agent workflow 的控制面不只是 start/stop，而是中途調整與批准。

### CONFIRMED — Slack Code / Agents & tools，2026-09-08 查核
Sources:
- https://app.slack.com/features/code-channels
- https://slack.com/help/articles/54310833022355-Build-with-AI-as-a-team-using-Slack-Code
- https://slack.com/help/articles/33076000248851-Work-with-AI-agents-in-Slack

Slack Code 把 agent session 變成 dedicated temporary code channel；同事可以看狀態、提出 suggestion、view changes、sign off，而且 Agents & tools 能查看多個 session 與「哪一個需要注意」。

- **JTBD**：團隊要共同 supervise 一個工作中的 agent，而不是每人各有一個私人 chat。
- **省步驟**：工作討論、agent session、review/approval 留在既有協作工具裡。
- **Distribution**：agent 進入團隊原本就工作的 channel；不是要求人切到 agent vendor portal。
- **Collaboration pattern**：session 是共享工作物件；多人能觀察／回饋。
- **可移植核心**：對 `autodev-ng`，應把 `executionId` 變成 operator 可見、可精確指定的 control target。
- **不應照抄**：不做完整 Slack Code clone；Discord/CLI 只需要把 exact-target control 契約做好。

---

## B. 相鄰領域可移植的設計／工作流

### CONFIRMED — Cloudflare Gradual Deployments，正式文件 2026-07-03；preview 2026-08-26
Sources:
- https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/
- https://69edd8d5.previews.developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/

Cloudflare Workers 可以在新舊版本間分配 traffic percentage，而不是全量一次切換；官方流程明確把「逐步增加流量、觀察 error rates / exceptions、發現問題時 rollback」串成 release workflow。

**JTBD**：production deploy 的風險不能只靠 preview 判斷；需要用少量真實流量驗證後才升級。

**為何更可靠**：blast radius 有界，而且 rollout state 本身可讀回，不必 operator 自己記「目前到底幾 %」。

**Onboarding**：能力直接存在 Workers deployment primitive，不必另外架 rollout proxy。

**Automation / provenance 模式**：deployment 是「版本集合 + percentage」，可進一步綁 observation window、health evidence、promotion receipt。

**Business-model signal**：這是 Cloudflare 平台原生 release primitive；沒有必要先買另一層 deployment SaaS 才能做最小可行 canary。此處不推論方案價格差異。

**限制**：request-level percentage 不等於 session-level一致；stateful data / schema 也不跟 code rollback。

**Reese 可吸收**：`cf-mcp-server` 已經 POST `strategy: percentage`，但把 target hard-code 100%；應把它升級成 bounded rollout state machine。

**不應照抄**：不能因平台有 percentage 就自動把任何 Worker 開成 canary；需要 binding/state compatibility gate。

### CONFIRMED — Cloudflare Version Affinity，2026-07-03
Source: https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/version-affinity/

逐步發布時，同一使用者若每個 request 隨機命中不同版本，會產生 version skew。Cloudflare 提供 `Cloudflare-Workers-Version-Key` 讓 stable identifier 在同一次 deployment 期間 deterministic 命中同一版本。

**可移植原理**：任何 staged rollout 都不能只記「5%」；若 workflow 跨多 request，需要 affinity key / session identity。這同時適用 `cf-mcp-server`、`ninax-line-hermes`、`autodev-ng` 的長工作狀態設計。

### CONFIRMED — Cloudflare Rollbacks，2026-07-15
Source: https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/

Cloudflare 從 split deployment rollback 時，會把選定 version 重新切回 100%。但 D1/KV/R2 等 stored data 不會被 rollback。這再次證明「code deployment head」與「data state head」必須分開建模。

### CONFIRMED — Durable Objects gradual deployment，2026-08-27
Source: https://3b21a3e4.previews.developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/with-durable-objects/

Durable Object instance 在 gradual rollout 期間被分配到其中一個 Worker version，而且 instance 不會每 request 任意切版本。這是重要反例：release controller 必須理解 resource semantics，不能把所有 binding 都當無狀態 HTTP。

---

## C. 新興工具／技術造成的新產品可能性

### CONFIRMED CAPABILITY SIGNAL — SessionCast，2026-09-08 查核
Source: https://www.producthunt.com/products/sessioncast

SessionCast 把本機 Claude Code session 經輕量 agent 暴露給手機／平板／瀏覽器，不要求 VPN、SSH、tmux。其核心價值不是另一個模型，而是「session control plane」。Product Hunt listing 是產品能力訊號，不當成功率或市場份額證據。

### CONFIRMED CAPABILITY SIGNAL — VibeAround，2026-09-08 查核
Source: https://www.producthunt.com/products/vibearound

VibeAround 將 Claude Code、Codex CLI、Gemini CLI、OpenCode 等本機 coding agents 經單一 bridge 暴露到 Telegram、Slack、Discord、Web 等多個 control surface，並提供 session handover / remote previews。

**新可能性**：execution plane 可以保持 local / tool-native，而 control plane 是可替換的 messaging/UI client。這與 `autodev-ng` 現在 Discord + CLI 的方向相容；不必為每個 agent 重新做 orchestration kernel。

### CONFIRMED CAPABILITY SIGNAL — Porte，2026-09-08 查核
Source: https://www.producthunt.com/products/porte/built-with

Porte 的 Product Hunt listing 描述手機可讀 live transcript、send prompt/files、run slash commands、stop turns、answer permission requests；再次顯示「permission reply / stop-turn / steer」正從 agent 內部細節變成遠端 control-plane primitive。

**不應照抄**：`autodev-ng` 不應一次性加入所有 action；先把 `STEER` 與 `QUEUE` 的 exact-target + receipt 契約做好，日後 permission reply/stop-turn 才有安全基礎。

---

# New Releases / Recent Changes

## Reese-max portfolio changes since r6

### cf-mcp-server — 2026-09-08 17:24–18:33 台北時間附近連續更新 Workers deployment
Recent default-branch commits include：
- `80f4a623...` — add confirmed Workers version deployments
- `ea863199...` — isolated Worker deployment acceptance canary
- `d35db0e6...` — bind Workers confirmations to explicit deployment targets
- `9299833a...` — record explicit confirmation release and blocked acceptance

Current `src/tools/workers.ts` confirms：
- immutable Worker version IDs separate from Pages deployments；
- exact `worker_name + version_id`；
- 60s one-time confirmation；
- `expected_deployment_id` drift invalidation；
- target binding identities；
- confirm 後 read-back active deployment；
- **production traffic 固定 100%**。

這使 gradual rollout 從「遠期點子」變成自然的 next capability，而不是替尚未完成的 deploy 功能再加 feature。

### autodev-ng — 2026-09-08 r6 後新增 operator visibility/control
Recent commits include：
- `fd9a5a00...` — CLI controls and Discord operational monitoring
- `5b5a76a1...` — Discord monitoring without model credentials
- `c7fb621c...` — scoped CCTEST monitor queries

新的 operator surface 已包含 monitor/status/github/pause/resume；`/task` 仍寫 future backlog。外部 control-plane 市場訊號因此現在有更高 Strategic Fit：底層觀測已到位，下一步能聚焦「精確介入正在跑的 execution」。

---

# Community Pain Points

### COMMUNITY_SIGNAL — Codex Remote Control session state continuity，2026-08-31
Source: https://community.openai.com/t/codex-remote-control-sessions-appear-to-lose-progress-across-desktop-mobile-even-though-the-remote-rollout-remains-intact/1393848

有使用者回報 remote Linux host 上 canonical task 繼續執行且 rollout records 仍存在，但 Desktop/mobile 顯示只停在較早的 conversation prefix。這不是統計性 outage 證據，也不代表所有 Codex Remote Control 都有問題；但它提供一個很好的 failure pattern：**remote control client 看到的 session head 可能 stale**。

對 `autodev-ng #11` 的直接設計影響：steer/enqueue 不應只用 project name 或「目前那個 task」，而要綁 `taskId + executionId + expected phase/head`；head 不一致就 `STALE/REJECT`。

### COMMUNITY_SIGNAL — coding-agent control plane fragmentation，2026-09-07
Source: https://www.reddit.com/r/ChatGPTCoding/comments/1w9lsay/weekly_self_promotion_thread/

一個 self-promotion project 將問題描述為：session disposable、context fragmented、remote control 綁在特定 harness，切 Claude/Codex 時人要手搬 operational context。因為作者有產品利益，這只列 `COMMUNITY_SIGNAL`。

可移植原理不是「去裝該產品」，而是：**project/execution identity 應比某一個模型 session 更持久，control receipt 不能綁死單一 UI。**

### COMMUNITY_SIGNAL — 手機控制 VPS coding agent，2026-08-08
Source: https://www.reddit.com/r/vibecoding/comments/1vj8hs5/coding_agent_with_android_app_controlling_vps/

使用者明確尋找 Android surface 控制 VPS 上 coding agent，回覆中多個工具被提及。樣本很小，不當市場調查；但與 OpenAI/Slack/Product Hunt 的產品供給方向相互印證：remote supervision 是真實 Job 類型。

---

# Adjacent Ideas

1. **Staged Promotion Receipt**：`cf-mcp-server #8` 的 `candidate → canary → evidence → promote` 可抽象給 `prompt-autoresearch` champion promotion、`cf-ai-router` provider promotion、`skill-foundry` certification、`minideck` published head。
2. **Steering Envelope**：`autodev-ng #11` 的 exact-target human command envelope 可延伸到 permission reply、stop-turn、human clarification；但這些應是後續 capability，不在本輪灌水拆票。
3. **Version/Session Affinity**：Cloudflare 的 version affinity 原理可移植到長 workflow：同一 human control / message revision / evidence receipt 要綁同一 execution head。
4. **Control Plane ≠ Execution Plane**：SessionCast/VibeAround/Porte 顯示本機 agent 可保留原執行環境，遠端只承擔觀察與控制。這適合 `openab`、`autodev-ng`、`ninax-line-hermes`，也降低另做 mobile app 的必要。
5. **INCONCLUSIVE 是正式狀態**：低流量 canary 沒足夠 evidence 時，不能硬判 PASS；這可共用到 clinical validation、prompt eval、provider reliability 與 research evidence。

---

# Opportunity Map — 全 Portfolio

> 每個產品都同時檢查五類；`—` 表示本輪沒有新理由改變既有優先序，不代表永遠不做。

| Repository | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| gemini-deidentifier | deterministic state integrity | consequence replay / failure recovery | #30 world-state ledger | staged mutation promotion receipt | 純聊天 storyteller 堆功能 |
| exam-archive | source provenance | archive freshness / navigation | official-source reliability | rule/source drift markers | adaptive coach 功能塞進 archive |
| police-exam-practice | — | migration/redirect 到正式產品 | — | thin compatibility shell | 與 police-exam-archive 雙線長期分叉 |
| police-exam-archive | official-source traceability | #60 attempt-led review | deadline-aware official-question practice | `INCONCLUSIVE/overload` workload signal | 大量 AI 自造題取代官方題 |
| 92-duty-scheduler | constraint correctness/security | minimal-impact repair #19 | auditable schedule diff | staged proposal→approve→publish | 先加 AI chat / feature bloat |
| openab | **human approval broker** | exact-session/permission target | chat-native secure ACP control | SteeringEnvelope 原理 | auto-approve / trust-all-tools |
| UkePack | teacher review integrity | 真人老師 workflow #3 | child/teacher practice pack | small embedded practice utility | 一次抄完整 music LMS |
| ppt-studio | claim/source provenance #3 | source-context intake | evidence-first deck | Slack/thread adapter after correctness | connector 數量競賽 |
| book5-windows-server-2022 | source/version freshness | chapter update map | reproducible lab content | compatibility-date style curriculum tags | SaaS 化純教材 |
| obsidian-vault | portability/local ownership | cleanup / retrieval ergonomics | user-owned PKM | optional local agent control | account-first cloud lock-in |
| voice-actress | grading provenance | evidence-linked rubric #6 | answer-span + verified law feedback | staged feedback review | 黑箱分數 / 假稱法源已查核 |
| taiwan-intel-dashboard | canonical availability | restore freshness | — | share infra with taichung-police-intel only if canonical | 在 paused state 擴 feature |
| **autodev-ng** | security/cost/verification gates | **NEW #11 exact-target STEER vs QUEUE** | human control receipts across engines | permission reply / stop-turn later | 每個 Discord 訊息直接餵 active agent；另造 mobile app |
| flux-image-gen | provenance integrity | Content Credentials #18 | lineage / tamper state | staged publish / review | 用 metadata presence 判定真偽 |
| claude-mem | upstream identity/sync | fork hygiene | — | memory governance ideas only | 自行分叉 product roadmap |
| lobsterpulse | OTel/runtime truth | provider timeline / hooks | agent observability | SteeringEnvelope events as new telemetry type | 重複另開「加 OTel」 |
| prompt-autoresearch | eval isolation | variance-aware promotion #3 | evidence-bound champion | StagedPromotionReceipt | 單次 peak score 自動升級 |
| neciken-summer-poem | official rule source | Rule-Drift Receipt #3 | submission-time revalidation | staged contest profile promotion | discovery 數量競賽 |
| note-filler | source evidence | claim-level review #3 | evidence-linked note | human control/approval receipt | LLM 行銷文案當 evidence |
| gooaye | product identity | define or archive | — | — | 未定義目的前加 feature |
| lplrs-judicial-sync | deletion/tombstone | derived lineage | legal-source lifecycle | staged source refresh | 「工作目錄刪除=資料消失」 |
| adng-memory | scope/retention | bitemporal activation #4 | governed operational memory | exact-head control envelope | retrieval 命中就自動當真相 |
| cyber-prep-coach | source-grounded learning | mastery profile #4 | next-best study action | attempt ledger reuse | 再造另一套黑箱 learner model |
| cf-ai-router | eligibility/cost safety | provider reliability research #1 | evidence-bound deterministic routing | staged provider promotion | 黑箱 adaptive routing直接進 prod |
| avatar-vfo | auth/isolation | runtime regression first | controlled character memory | session-head / user-visible memory | 先堆 realtime/long-memory |
| project-doctor-web | clinical safety | deterministic fail-closed | constrained educational assistant | ValidationReceipt patterns | autonomous medical action |
| minideck | published-head integrity #4 | preview/publish clarity | explicit authoritative version | staged publish receipt | current draft 自動公開 |
| chatgpt-dual-pipeline | canonical source identity | simplify publish path | reproducible note publishing | exact artifact head | 多 mirror 各自變產品 |
| internship-notes-sites-mirror | mirror integrity | clear canonical pointer | — | deployment receipt only | standalone feature roadmap |
| taichung-police-intel | freshness/reconciliation | role profile #12 / provisional #13 | evidence-rich public-sector intelligence | INCONCLUSIVE/freshness receipts | 把 provisional 當 confirmed |
| soundbox-offline | local ownership/backup | LAN import #3 | account-free library | optional local control surface | cloud music/account-first |
| skill-foundry | runtime compatibility #1 | side-effect/approval metadata | certified skill package | control capability matrix | marketplace 規模競賽 |
| video-timeline-pipeline | baseline evidence | bounded escalation #10 | local-first adaptive evidence | staged evidence promotion | 全片一律昂貴 agentic scan |
| ai-novel-workstation | hard token safety | Cost Envelope #4 | approved long-run budget | SteeringEnvelope for long production loop after #4 | 假 USD guarantee |
| clinical-scribe-worker | safety validation | versioned pack #4 | specialty/failure-class evidence | INCONCLUSIVE as explicit verdict | aggregate 分數掩蓋高風險退步 |
| MaterialYouNewTab | local-first/privacy | permission-minimal capture | local canonical + optional share | remote control patterns只借「opt-in」思想 | account-first/AI widget bloat |
| **cf-mcp-server** | MCP #6 + exact confirmation | **NEW #8 gradual rollout + health gate** | evidence-bound production promotion | staged promotion primitive reusable | all Worker 默認 canary、自動無人全量 |
| tick-stock-panel | coverage truth | deterministic StrategyDef #5 | transparent strategy receipts | staged strategy promotion | 自然語言直接交易/黑箱回測 |
| herdr-skills | package contract | approval/capability metadata | portable workflow skills | SteeringEnvelope capability declaration | 再造 orchestration kernel |
| ninax-line-hermes | message revision #1 | long-job stale-result gate | messaging-native verified summary | exact execution steering later | channel message=任意控制指令 |

---

# Opportunity Scores

| Candidate | User Pain | Strategic Fit | Novelty | Evidence Strength | Reuse Potential | Implementation Effort* | Security/Privacy/Cost Risk* | Score | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| cf-mcp-server bounded gradual rollout | 9 | 10 | 8 | 10 | 9 | 5 | 5 | **92** | **CREATE #8** |
| autodev-ng exact-target steer vs queue | 9 | 10 | 8 | 9 | 10 | 6 | 5 | **91** | **CREATE #11** |
| skill-foundry control-capability certification | 7 | 9 | 7 | 8 | 10 | 5 | 4 | 84 | research only; #1 compatibility first |
| ninax-line-hermes operator steer | 7 | 8 | 7 | 8 | 9 | 7 | 6 | 79 | research only; #1 revision correctness first |
| openab remote steer after approval | 8 | 9 | 7 | 8 | 9 | 7 | 7 | 80 | approval broker remains prerequisite / Issues disabled |
| ai-novel-workstation mid-run steer | 7 | 8 | 6 | 8 | 9 | 7 | 5 | 77 | Cost Envelope #4 first |

\* Effort/Risk：數字越低越有利；score 綜合而非單純加總，不把低 effort 當唯一產品優先序。

---

# Top 10 Cross-Portfolio Ideas

1. **Target-bound Human Control Envelope** — `project/task/execution/head + command + TTL + issuer + hash + disposition receipt`；起點 `autodev-ng #11`。
2. **Staged Promotion Receipt** — candidate 不直接變 authority；先 observation/evidence，再 explicit promote。起點 `cf-mcp-server #8`。
3. **`PASS / FAIL / INCONCLUSIVE / STALE` 四態證據** — 避免資料少卻硬判 PASS；可共用到 canary、clinical eval、prompt eval、provider routing。
4. **Version/Session Affinity** — 長 workflow 的多 request / 多 client 必須綁穩定 head，避免控制與結果跨版本。
5. **Control Plane 與 Execution Plane 分離** — 本機/既有 agent runtime 不必因手機/Discord 控制而搬到另一雲端。
6. **Adapter Capability Matrix** — native steer、queue、permission reply、stop-turn、runtime verify 等必須明確宣告 `SUPPORTED / UNSUPPORTED / DEGRADED`。
7. **Promotion Approval 綁 exact current head** — deployment、prompt champion、provider、memory、published deck 都適用；head drift 後舊批准自動失效。
8. **Resource-semantic Release Gate** — 不只看 code/version；D1/KV/R2/DO/service bindings/schema 等要決定是否能雙版本共存。
9. **Operator-facing Canonical IDs** — UI/Discord 不再只說「正在執行」，而能顯示 taskId/executionId/deploymentId/publishedHead，讓人精準操作。
10. **False-success Eradication** — 不支援的 steer、無資料的 health check、過期 evidence 都應顯示 UNSUPPORTED/INCONCLUSIVE/STALE，不用成功文案掩蓋。

---

# Ideas Rejected / Deferred

### 1. REJECT — cf-mcp-server 直接接受任意 `percentage` 數字
原因：會把安全 policy 變成 generic float；99.9% 也能被稱「canary」。先做有限 stage / policy-defined percentages，後續有真需求才開放。

### 2. REJECT — canary PASS 後自動無人 promotion 到 100%
原因：目前 MCP L3 的明確優勢就是 target-bound human confirmation。新能力應提高 release safety，不應以「自動化」名義移除安全 gate。

### 3. REJECT — 自建 L7 proxy 做 shadow/canary
原因：Cloudflare 已有 native version/deployment percentage primitive與 affinity；自建 proxy 增加錯誤面，沒有足夠 Job 證據。

### 4. REJECT — 把所有 stateful Worker 都視為可 split
原因：Durable Objects、D1 schema、KV/R2 side effects、service bindings 可能不允許新舊版本共存。unknown 必須 REVIEW_REQUIRED。

### 5. REJECT — autodev-ng 建一個專用 mobile app
原因：外部新品的真正可移植原理是 remote control plane，而不是「一定要 App」。Discord/CLI 已有 distribution，先做 exact-target semantics。

### 6. REJECT — Discord 任意訊息直接成為 active-agent prompt
原因：channel chatter / prompt injection / race 都會污染控制面；必須是 slash command / authenticated envelope + exact execution target。

### 7. DEFER — permission reply / stop-turn 一次全部實作
原因：它們適合共用 SteeringEnvelope，但 `STEER vs QUEUE` 是較小且能驗證核心 identity/receipt contract 的第一步。

### 8. DEFER — openab 同步加入 remote steer
原因：openab 更高優先缺口仍是 human approval broker；且 repository Issues 目前不可用。不要越過 prerequisite。

### 9. DEFER — skill-foundry 新開 control-capability certification Issue
原因：概念高度可重用，但現有 #1 runtime compatibility/certification 更基礎；先把新 evidence 留在中央 radar。

### 10. REJECT — 用 Product Hunt/廠商行銷數字直接證明效果
原因：本輪 Product Hunt 只用來確認新品形態與 distribution pattern；沒有把 follower、vendor claim 當 productivity 統計。

---

# Issue Mapping / Duplicate / Coordination

## NEW — Reese-max/cf-mcp-server #8
Title: `[FEATURE][COMPETITIVE_GAP][P1] 支援有界 Gradual Deployment：directed smoke → canary → health gate → 100%／rollback`

Fingerprint：
`cf-mcp-server + exact immutable Worker version deployment + explicit human confirmation + hard-coded 100% production traffic + no bounded canary/health-evidence promotion contract`

Duplicate checks：
- open/closed Issue search：沒有 gradual/canary/percentage rollout/health gate 相同項目。
- PR search：沒有相同項目。
- #6 是 MCP 2026-07-28 protocol/auth migration，不是 release rollout。

Runtime Verification：REQUIRED；Issue 已要求 isolated A/B Worker 真實 canary / failure / abort / promote / drift acceptance。

## NEW — Reese-max/autodev-ng #11
Title: `[FEATURE][COMPETITIVE_GAP] 區分 in-flight Steer 與 Next-turn Queue，讓 Discord／CLI 精確控制既有 Agent 執行`

Fingerprint：
`autodev-ng + long-running multi-agent scheduler + Discord/CLI monitoring + project pause/resume + /task appends future backlog + no explicit target-bound in-flight steer vs FIFO next-turn queue contract`

Duplicate checks：
- open/closed Issue search：沒有 steer/queue/current-session control 相同 fingerprint；現存 #2/#3/#4/#6/#7 是 audit/security/onboarding/path reliability。
- PR search：沒有相同項目。
- 內部 `no-commit nudge` 是同 attempt 的固定一次修復 prompt，不是 operator steer，因此不視為 duplicate。

Runtime Verification：REQUIRED；Issue 已要求真長 execution、exact execution ID、STEER/QUEUE FIFO、restart/stale/unsupported/critical-section acceptance。

### LOCK / COORDINATION
本輪 repository search 對 `github-issue-lock:v1` 只看到既有 central radar coordination 記錄；candidate fingerprint 的 Issue / PR 搜尋沒有顯示另一工作流正在處理同一項。兩張新 Issue 建立後，本輪**沒有建立實作 branch、沒有 merge、沒有 deploy、沒有修改 secrets/權限/repository settings**。若後續其他排程認領 #8 或 #11，本雷達只追加中央研究 evidence，不搶 implementation lock。

---

# Sources

| Status | Date / checked | Source | URL | Used for |
|---|---|---|---|---|
| CONFIRMED | 2026-07-03 / checked 2026-09-08 | Cloudflare Gradual Deployments | https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/ | split rollout / health monitoring |
| CONFIRMED | preview updated 2026-08-26 | Cloudflare Gradual Deployments preview | https://69edd8d5.previews.developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/ | recent continuity of feature |
| CONFIRMED | 2026-07-03 | Cloudflare Version Affinity | https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/version-affinity/ | version skew / stable key |
| CONFIRMED | 2026-07-15 | Cloudflare Rollbacks | https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/ | rollback semantics / data non-rollback |
| CONFIRMED | 2026-08-27 | Cloudflare Durable Objects gradual deployments | https://3b21a3e4.previews.developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/with-durable-objects/ | stateful rollout caveat |
| CONFIRMED | 2026-05-14, rechecked 2026-09-08 | OpenAI Codex mobile remote control | https://openai.com/index/work-with-codex-from-anywhere/ | long-run remote steering workflow |
| CONFIRMED | 2026-08-12 | OpenAI Academy Codex Bootcamp | https://academy.openai.com/public/clubs/builders-etkn1/resources/codex-bootcamp-2026-09-23 | steer/review/approval workflow signal |
| CONFIRMED | checked 2026-09-08 | Slack Code | https://app.slack.com/features/code-channels | shared session/control surface |
| CONFIRMED | checked 2026-09-08 | Slack help — Build with AI as a team | https://slack.com/help/articles/54310833022355-Build-with-AI-as-a-team-using-Slack-Code | suggestions/review/sign-off |
| CONFIRMED | checked 2026-09-08 | Slack Agents & tools | https://slack.com/help/articles/33076000248851-Work-with-AI-agents-in-Slack | session status / agent discovery |
| CONFIRMED capability signal | checked 2026-09-08 | Product Hunt — SessionCast | https://www.producthunt.com/products/sessioncast | browser/mobile local-session control |
| CONFIRMED capability signal | checked 2026-09-08 | Product Hunt — VibeAround | https://www.producthunt.com/products/vibearound | multi-agent messaging control plane |
| CONFIRMED capability signal | checked 2026-09-08 | Product Hunt — Porte | https://www.producthunt.com/products/porte/built-with | stop-turn / permission reply / phone control |
| COMMUNITY_SIGNAL | 2026-08-31 | OpenAI Developer Community | https://community.openai.com/t/codex-remote-control-sessions-appear-to-lose-progress-across-desktop-mobile-even-though-the-remote-rollout-remains-intact/1393848 | stale remote session head failure mode |
| COMMUNITY_SIGNAL | 2026-09-07 | Reddit ChatGPTCoding self-promotion | https://www.reddit.com/r/ChatGPTCoding/comments/1w9lsay/weekly_self_promotion_thread/ | persistent project/control fragmentation |
| COMMUNITY_SIGNAL | 2026-08-08 | Reddit vibecoding | https://www.reddit.com/r/vibecoding/comments/1vj8hs5/coding_agent_with_android_app_controlling_vps/ | mobile/VPS supervision Job |

---

# What Changed Since Last Radar (r6)

1. **cf-mcp-server 的產品邊界實際前進了**：r6 時主要聚焦 MCP 2026-07-28 migration；本輪 default branch 已出現完整 Workers immutable-version deployment + exact target confirmation。新問題不是「能不能 deploy」，而是「是否每次都應該 100%」。
2. **Cloudflare 外部平台能力正好提供可移植答案**：percentage split、version affinity、version-aware monitoring、rollback 與 stateful caveat 組成一個完整 staged rollout primitive，因此 #8 具充分 evidence，不是憑空 feature idea。
3. **autodev-ng operator surface 也在 r6 後成熟**：monitor/status/pause/resume/github 等已落地；因此 remote-agent 市場的 steer/queue pattern 現在有直接 Strategic Fit。
4. **新興 coding-agent control plane 更明顯**：SessionCast/VibeAround/Porte 與 OpenAI/Slack 的產品方向交叉驗證「execution 持續、control client 可後加入」；但本輪沒有因此新增 mobile app 或 marketplace。
5. **Portfolio 共通模型再細化**：以前強調 `Candidate → Validate → Promote → Receipt`；本輪加入兩個重要維度：
   - Promotion 可分多 stage，每 stage 需要 fresh evidence；
   - Human control 也必須綁 exact active head，不能依賴「現在應該還是那一個」的模糊假設。

## Updated Cross-Portfolio Principle

**長時間自動化的安全控制不應只有 START / STOP。**

更完整模型應是：

`Authoritative Head → Candidate Action → Exact Target + Policy → Human Approval / Steer → Bounded Execution Stage → Fresh Evidence → Promote / Queue / Abort → Immutable Receipt`

如果 head、session、deployment、source 或 evidence 在中間漂移：

`PENDING → STALE / INCONCLUSIVE / REJECTED`

而不是默默把舊批准、舊 steer 或舊 health signal 套到新的工作上。
