# 外部競品／新品／工作流靈感雷達 — 2026-09-08 r6

> Scope：Reese-max 擁有、未封存且可視為產品的 repositories。**本輪主要資料來源為 GitHub 之外的公開網路**；GitHub 僅用來確認產品用途、近期變更、implementation boundary、既有 Competitive Gap / Feature / Research Issue、PR 與 duplicate/fingerprint。官方產品宣稱只視為 capability / business-model signal；Reddit 僅標 `COMMUNITY_SIGNAL`，不冒充統計調查。

## Executive Summary

本輪找到 **1 個達到高價值立案門檻的新機會**：

1. **ai-novel-workstation — Production Cost Envelope / Approval / Runtime Overrun Gate**（93/100，FEATURE / DIFFERENTIATOR）。直接競品 Sudowrite 在 2026-08-14 將 Draft 的估算上限升級為 credit ceiling 承諾；同一輪也處理 estimation error 與 failed complex plan 消耗 credits 的問題。Reese-max 現有 production-loop 已有 `--max-tokens` hard cap、checkpoint、`llm_usage.jsonl` 與事後成本彙總，但缺「執行前的版本化成本估算 → 人工批准 → pricing/provider/plan drift 失效 → 執行中可驗證的剩餘 envelope」。因此建立 **ai-novel-workstation #4**。

這個 Issue 刻意不照抄 Sudowrite 的 credit 承諾：第三方 API 的 billing、cached tokens、retry、model alias、usage-missing 可能無法被本機完全掌握，因此美元 ceiling 只有在 pricing + usage upper bound 都可驗證時才 hard-enforce；否則必須標 `ADVISORY_ONLY`，繼續由既有 token cap 做 hard safety boundary。

本輪另外得到兩組高價值但**不立案**的外部訊號：

- **Gamma 2026-08-28 Slack workflow**：直接在現有 thread / attached files 建 deck，並可 read/search/export/comment，不必先跳到 Gamma。這強化 `ppt-studio / minideck` 的「把 source context intake 靠近工作發生處」方向；但目前 `ppt-studio #3` 的 claim/source provenance 與 `minideck #4` 的 draft/published head 更優先，所以只列研究清單。
- **Slaet / Molt / Speedtab 近期新分頁工具**：2026-08-27～09-05 仍持續強調 local-first / no account / no tracking，同時出現 optional sync、live shared lists、public/read-only link 等模式。這證明 local-first 與「選擇性 collaboration」不是二選一；對 `MaterialYouNewTab` 有移植價值，但 permission/data-boundary 尚需設計，不直接加 cloud account feature。

跨 Portfolio 新原則：**「預算」也應是一個有版本、有證據、有批准、有失效條件的契約，而不是最後才看的報表。**

`Plan → Provider/Pricing Fingerprint → BudgetQuote → Approval → Runtime Usage Receipt → Remaining Envelope → Drift / Overrun Gate → Final Receipt`

---

## Product → Market Category Map / Opportunity Map

| Repository | 市場／產品角色 | Opportunity Map |
|---|---|---|
| gemini-deidentifier | AI RPG / interactive fiction | DIFFERENTIATOR：world-state consequence ledger 已有 #30；DO NOT COPY 純聊天式 storyteller 堆疊 |
| exam-archive | exam archive / public reference | SHOULD SIMPLIFY：維持 archive/provenance，不和正式 practice 產品重複 |
| police-exam-practice | legacy exam practice | DO NOT DUPLICATE：持續向 police-exam-archive 收斂 |
| police-exam-archive | official question bank + practice | DIFFERENTIATOR：Attempt Ledger / deadline-aware review #60 已立案 |
| 92-duty-scheduler | constraint scheduling | DIFFERENTIATOR：minimal-impact repair #19；DO NOT ADD feature before P0/P1 security debt |
| openab | Discord ↔ ACP coding-agent broker | MUST MATCH：human approval broker；Issue write 仍受 repository Issues 設定限制 |
| UkePack | MusicXML → teacher/child practice packs | RESEARCH：#3 先真人老師 workflow；不要先抄完整 music LMS/toolbox |
| ppt-studio | AI presentation workstation | DIFFERENTIATOR：claim/source provenance #3；ADJACENT：conversation/file-nearby intake |
| book5-windows-server-2022 | teaching content | ADJACENT：version/source freshness；未證明需要跨版本 SaaS 化 |
| obsidian-vault | personal knowledge/content | DO NOT TURN INTO SaaS；local ownership / portability |
| voice-actress | legal essay grading / learning | DIFFERENTIATOR：evidence-linked feedback #6 |
| taiwan-intel-dashboard | paused public-intelligence dashboard | DO NOT EXPAND：先恢復 canonical availability |
| autodev-ng | multi-agent delivery orchestrator | SHOULD BE BETTER：proposal → independent gate → receipt；避免 agent-count 競賽 |
| flux-image-gen | AI image workspace | DIFFERENTIATOR：provenance / Content Credentials #18 |
| claude-mem | upstream memory fork | N/A standalone roadmap：先 upstream identity / sync |
| lobsterpulse | agent observability / hooks | MUST MATCH：現有 OTel / provider metrics roadmap；不重複 |
| prompt-autoresearch | prompt optimizer | DIFFERENTIATOR：variance-aware promotion #3 |
| neciken-summer-poem | AI writing + contest submission | DIFFERENTIATOR：Rule-Drift Receipt #3 |
| note-filler | evidence-grounded notes | DIFFERENTIATOR：claim-level review queue #3；可共用 evidence lifecycle |
| gooaye | placeholder | N/A：先定義 product purpose 或 archive |
| lplrs-judicial-sync | judicial source synchronization | MUST MATCH：deletion/tombstone/source lifecycle 已立案 |
| adng-memory | operational agent memory | RESEARCH：activation/supersession/bitemporal lifecycle #4 |
| cyber-prep-coach | iPAS exam prep | DIFFERENTIATOR：mastery/next-best study #4；不要再造另一 learner model |
| cf-ai-router | AI provider router | RESEARCH：provider reliability/capability evidence；可吸收 quote/fingerprint 思路 |
| avatar-vfo | AI avatar/chat | SHOULD VERIFY：auth/isolation/runtime first；暫緩更多 long-term memory |
| project-doctor-web | clinical teaching/research UI | DO NOT EXPAND agentic action before safety/runtime gates |
| minideck | lightweight deck publishing | MUST MATCH：draft head vs published head #4；ADJACENT：near-source intake |
| chatgpt-dual-pipeline | internship-note publishing pipeline | SHOULD SIMPLIFY：canonical source/publish path |
| internship-notes-sites-mirror | deployment/content mirror | N/A standalone features |
| taichung-police-intel | public-sector intelligence monitor | DIFFERENTIATOR：role profile #12 + provisional/reconciliation #13 |
| soundbox-offline | local-first music | DIFFERENTIATOR：LAN import #3；DO NOT COPY account-first cloud music |
| skill-foundry | Skill creation/certification | MUST MATCH：runtime compatibility #1；ADJACENT：side-effect/anti-job policy metadata |
| video-timeline-pipeline | video intelligence | RESEARCH：bounded visual evidence escalation #10 已立案 |
| **ai-novel-workstation** | long-running AI writing workstation | **DIFFERENTIATOR：NEW #4 versioned Cost Envelope；#2 Context Manifest 已有 PR #3** |
| clinical-scribe-worker | scribe evaluation | MUST MATCH：versioned clinical validation pack #4 |
| MaterialYouNewTab | local-first new-tab productivity | ADJACENT：optional sync/share without account-first architecture；permission boundary first |
| cf-mcp-server | MCP server | MUST MATCH：2026-07-28 protocol / SDK v2 migration #6 |
| tick-stock-panel | Taiwan market screen/backtest | RESEARCH：NL→deterministic StrategyDef #5；coverage truth #2 first |
| herdr-skills | multi-agent workflow Skills | SHOULD BE BETTER：package contract / approval boundary / compatibility；不重造 orchestrator |
| ninax-line-hermes | LINE ↔ long-running AI/video | MUST MATCH：message revision / stale-result gate #1 |

---

## External Signals

### A. 直接競品近期新增能力

#### CONFIRMED — Sudowrite, 2026-08-14 — Draft estimate ceiling 成為 credit ceiling promise
Source: https://feedback.sudowrite.com/en/changelog

Sudowrite 的 Draft planning step 現在不只顯示估算範圍，而是承諾不收超過 estimate ceiling 的 credits；同一 changelog 也指出 retired My Voice model 曾造成 credit-estimation error 並阻擋生成，且 complex multi-step plan 失敗仍消耗 credits 的問題被修正。

**JTBD**：長篇作者在開始 expensive Draft / manuscript workflow 前，需要知道「這一輪最多會吃掉多少可計費資源」。

**為何省時間／更可靠**：不用先跑完再從 credit balance 推回成本，也降低長流程跑到一半才發現資源不足的風險。

**Onboarding / distribution**：estimate 直接位於 Draft planning step，不另做財務 dashboard；成本決策嵌在工作發生前。

**Automation / data provenance 新模式**：estimate ceiling 與實際 credit accounting 綁定，而不是單純 calculator。

**Pricing / business-model signal**：credits 不只是計費機制，也成為 workflow contract；「可預測性」本身是產品價值。

**限制／失敗點**：官方同一更新承認 estimation code 曾因 retired model 出錯並阻擋 generation，證明 estimator 也會因 model lifecycle drift 失效。

**Reese 可吸收**：preflight quote + approved ceiling + stale-on-pricing/model drift。

**不應照抄**：Sudowrite 能控制內部 credits；Reese 的第三方 API billing 不一定可控，因此不能把估算直接稱 hard USD guarantee。

#### COMMUNITY_SIGNAL — WritingWithAI Reddit, 2026-08-18
Source: https://www.reddit.com/r/WritingWithAI/comments/1vrx7be/ive_hit_a_frustrating_dilemma/

有使用者表示喜歡 Sudowrite，但一章左右就耗掉大量 credits、帳期尚未過半。這只證明「成本可預期性」是真實抱怨類型之一，**不代表平均使用者成本、留存率或市場規模**。

---

### B. 相鄰領域可移植的設計／工作流

#### CONFIRMED — OpenAI API project/org spend limits, current docs checked 2026-09-08
Source: https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform

OpenAI 文件目前同時描述 monitor-only / soft threshold 與可 enforcement 的 hard spend limit。這是重要設計訊號：

- `budget shown`、`alert threshold`、`hard enforcement` 是三種不同語意；
- UI 必須說清楚哪一層真的會讓 request fail；
- 對 multi-provider product，provider-side hard limit 可作 defense-in-depth，但不應在沒有 runtime evidence 時假設它存在。

可移植到：`ai-novel-workstation`、`video-timeline-pipeline`、`cf-ai-router`、`autodev-ng` 的 paid action control。

#### CONFIRMED — Gamma, 2026-08-28 — Slack 直接把 thread / files 變成 deck
Sources:
- https://ideas.gamma.app/changelog/whats-new-in-gamma-august-28
- https://help.gamma.app/en/articles/15546622-can-i-use-gamma-with-slack

Gamma 現在可在 Slack mention 後直接：以 prompt/current thread/attached files 產 deck/doc/webpage/image、search/read existing gamma、preview shared links、export、回覆 comments。它仍限制「編輯既有 Gamma」要回 Gamma 本體，這是一個清楚的 integration boundary。

**JTBD**：討論已經發生在 Slack；使用者不想先 copy/paste 到簡報工具才開始整理。

**省步驟**：source context 就地 intake，creation 與 export 靠近原 workflow。

**Onboarding / distribution**：安裝 Slack app / MCP connection，而不是要求團隊全面換工作平台。

**能力模式**：integration 不只「通知」，而是 read/create/export/comment 的完整工作單元；權限仍沿用 Gamma workspace access。

**可吸收**：`ppt-studio/minideck` 未來可設計「source-context adapter」而不是硬做一個 Slack clone。

**不應照抄**：目前 provenance/published-head 的 correctness debt 比增加聊天平台 connector 更重要；integration 不能繞過 source evidence / publish approval。

---

### C. 新興工具／技術造成的新產品可能性

#### CONFIRMED — Slaet Chrome Extension, updated 2026-09-02
Sources:
- https://chromewebstore.google.com/detail/slaet-%E2%80%94-new-tab-to-do-lis/pkcodfcngbboofdelfejggniolgainof
- https://slaet.space/

Slaet 主打：local-first、offline、no account by default；只有使用者選擇登入時才增加 sync；同時支援 live shared lists 與 read-only task links。Chrome Web Store 顯示 2026-09-02 更新。

#### CONFIRMED — Molt, updated 2026-08-27
Source: https://chromewebstore.google.com/detail/molt-%E2%80%94-new-tab-dashboard/pkgnibilkdfocgnegpjbjjahjmcfdnfj

Molt 採「100% local / no account / no tracking」並把 open-tab mission control、duplicate detection、snapshot/restore 做成新分頁價值，說明 local-first 新分頁仍有新品空間，而且差異化不一定靠 AI。

#### CONFIRMED — Speedtab, checked 2026-09-08
Source: https://chromewebstore.google.com/detail/speedtab-local-speed-dial/adkjbdepojalajhfkoobiedddlnoamff

Speedtab 同樣強調 local-first/no backend/no account/no tracking，但提供 optional remote sync、JSON portability、RSS/tasks/encrypted notes。

**共同產品訊號**：local-first 並不等於「永遠不能跨裝置／協作」。更可行的差異是：

`local canonical data → explicit opt-in sync/share surface → scoped data subset → reversible/exportable → no account for baseline`

對 `MaterialYouNewTab` 的價值在於「同步／分享」可以被設計成**增量能力**，不是把整個產品改成 account-first SaaS。現階段仍屬研究，不建立 Issue。

---

## New Releases

| 日期 | 產品／市場 | 更新 | Status | Reese 訊號 |
|---|---|---|---|---|
| 2026-09-02 | Slaet | local-first new-tab + optional sync/live shared lists | CONFIRMED | MaterialYouNewTab：opt-in collaboration 可與 local-first 共存 |
| 2026-08-28 | Gamma | native mobile + Slack create/read/export/comment + API/connectors | CONFIRMED | ppt-studio/minideck：把 source intake 靠近原工作流 |
| 2026-08-27 | Molt | local-only tab mission-control + snapshot/restore | CONFIRMED | local-first 仍可用 focused JTBD 差異化，不必加 AI |
| 2026-08-14 | Sudowrite | Draft estimate ceiling / failed-plan credit fixes | CONFIRMED | ai-novel：成本預估應成可批准 workflow contract |
| 2026-09-08 查核 | OpenAI API | spend-limit docs 區分 monitor-only 與 enforceable | CONFIRMED | 所有 paid agents：soft budget 與 hard gate 語意分離 |

---

## Community Pain Points

1. **COMMUNITY_SIGNAL — 長篇 AI 寫作 credits 消耗缺乏可預期性**：2026-08-18 WritingWithAI 有使用者抱怨短時間用完 credits。這支持 cost visibility 的 pain，但不推論所有 Sudowrite 使用者都有同樣問題。
2. **LIKELY — integration fatigue**：Gamma 把 thread/file → deck 直接放進 Slack 的產品決策，本身是「使用者不想搬運 context」的強 workflow signal；但未找到獨立統計證明 manual copy/paste 的發生率，因此不寫成市場比例。
3. **LIKELY — local-first users want optional portability, not forced cloud**：Slaet / Speedtab 近期都採 baseline local + optional sync；這是多產品一致設計模式，但不是使用者調查。

---

## Adjacent Ideas

1. **BudgetQuote as a reusable platform primitive**：可由 ai-novel #4 先驗證，再抽象到 `video-timeline-pipeline/cf-ai-router/autodev-ng`。
2. **Source-context adapters**：Slack/thread/files → deck 的核心不是 Slack，而是「source 在哪裡，就從哪裡建立 artifact」；未來可支援 clipboard/folder/Drive/issue/thread adapter，但不能繞過 provenance。
3. **Optional collaboration plane over local canonical state**：MaterialYouNewTab 可研究只同步明確選取的 list/task，不把完整 local workspace 上雲。
4. **Budget approval drift semantics**：pricing/model/plan hash 改變時批准 STALE，可與既有 Rule-Drift / Capability Profile / Context Manifest 共用生命周期。
5. **Cost unknown is first-class**：subscription、free、unpriced、usage-missing 都不應被壓成 `$0`；這個 evidence vocabulary 可跨 portfolio 重用。

---

## Top 10 Cross-Portfolio Ideas

| Rank | Idea | 主要受益專案 | 本輪判斷 |
|---:|---|---|---|
| 1 | Versioned BudgetQuote → Approval → Runtime Envelope → Final Receipt | ai-novel, video, router, autodev | **NEW / HIGH** |
| 2 | Soft estimate 與 enforceable hard boundary 分離 | 所有 paid-agent workflows | HIGH |
| 3 | Pricing/provider/model fingerprint drift → approval STALE | ai-novel, router, skill-foundry | HIGH |
| 4 | Source-context adapter：在原工作場域產 artifact | ppt-studio, minideck, note-filler | RESEARCH |
| 5 | Local canonical + explicit opt-in sync/share | MaterialYouNewTab, soundbox | RESEARCH |
| 6 | UNKNOWN cost / evidence 不得顯示 0 或 success | portfolio-wide | HIGH |
| 7 | Current Head ≠ Published/Approved Head | minideck, memory, prompt, budget | EXISTING PRINCIPLE |
| 8 | Fixed baseline + bounded escalation | video, router, search, learning | EXISTING PRINCIPLE |
| 9 | Exact source/evidence locator for AI decisions | voice, note, ppt, clinical | EXISTING PRINCIPLE |
| 10 | Provider-side control only as defense-in-depth with verification | router, ai-novel, video | RESEARCH |

---

## Ideas Rejected / Deferred

### REJECT — 把 ai-novel 的 `$` estimate 直接稱為 hard cap
第三方 provider billing 未必由本機完全掌握。只有在 conservative upper bound + current pricing + usage semantics 可 runtime 驗證時才能 hard-enforce；否則為 advisory。

### REJECT — 為省錢自動把小說 production 換成較便宜模型
成本控制不能無聲改變現有角色／品質 contract。若未來要 adaptive model routing，應由獨立 capability/reliability evidence 決定，不由 budget 偷改。

### DEFER — ppt-studio / minideck 立即做 Slack App
Gamma 的訊號強，但 Reese 現有 provenance / publish lifecycle work 更接近核心 moat。先抽象 source-context adapter，再決定要不要特定 connector。

### DEFER — MaterialYouNewTab 加帳號／雲端同步
Slaet/Speedtab 證明 optional sync 有市場模式，但 Reese 的低權限/local-first 是差異化；需先做 data-subset、permissions、encryption、delete/export contract research。

### REJECT — 新分頁塞更多 AI widget
Molt 的新品方向再次證明 focused local utility 本身可差異化；不因「AI 流行」破壞簡潔與 privacy boundary。

---

## Issue Mapping

### NEW — ai-novel-workstation #4
Title: `[Competitive Inspiration][FEATURE] 為長時間 production-loop 增加可批准 Cost Envelope 與可驗證超支閘門`

Stable fingerprint:
`ai-novel-workstation + long-running multi-provider production-loop + existing hard token cap and post-hoc llm_usage cost report + no versioned pre-run cost quote/approval tied to plan/provider/pricing fingerprints + paid calls can begin before operator sees a reusable cost envelope`

Minimum deliverable：
- zero-paid-call `BudgetQuote` preflight；
- provider/model/pricing/plan fingerprints；
- `METERED_ESTIMATE / SUBSCRIPTION_NO_MARGINAL_PRICE / FREE / UNPRICED / UNKNOWN_USAGE_BOUND`；
- explicit approval tied to quote hash；
- drift → stale；
- conservative pre-dispatch overrun gate where enforceable；
- reuse `llm_usage.jsonl` as usage truth；
- final quote-vs-actual receipt；
- token hard cap 保持獨立。

Runtime verification：先 deterministic fake-provider，再以低額 metered-provider canary 對照 provider usage/billing evidence；無法證明 provider-side billing 時不得宣稱 hard dollar cap。

### Existing / no duplicate
- `ai-novel-workstation #2` Context Manifest 已有 open PR #3 `feat(memory): add deterministic chapter context manifests`；本輪 #4 不修改該 PR，也不把 cost-envelope 混進同一 scope。
- `video-timeline-pipeline #10` 已處理 bounded agentic evidence escalation；不再新增另一 cost tracker。
- `ppt-studio #3` provenance 與 `minideck #4` publish lifecycle 優先於 Slack connector。
- `MaterialYouNewTab` 的 optional sync/share 只列 research backlog。

### LOCK / COORDINATION
本輪 code search 僅在既有 central radar 看到 `github-issue-lock:v1` coordination 記錄；candidate fingerprint 的 open/closed Issue 與 PR 搜尋均無相同 cost-envelope 工作。建立 #4 後不建立實作 branch、不 merge、不 deploy；若其他排程之後認領 #4，本雷達後續只補研究 evidence，不搶鎖。

---

## Sources

### Direct competitors / official
1. Sudowrite Changelog — 2026-08-14：Draft estimate ceiling / failed-plan credit fixes  
   https://feedback.sudowrite.com/en/changelog
2. Sudowrite Changelog current feed  
   https://feedback.sudowrite.com/changelog

### Adjacent official products
3. OpenAI — Managing projects / spend limits（2026-09-08 查核）  
   https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform
4. Gamma Changelog — 2026-08-28  
   https://ideas.gamma.app/changelog/whats-new-in-gamma-august-28
5. Gamma Help — Slack integration（2026-09-08 查核）  
   https://help.gamma.app/en/articles/15546622-can-i-use-gamma-with-slack

### Emerging tools / extension ecosystem
6. Slaet Chrome Web Store — updated 2026-09-02  
   https://chromewebstore.google.com/detail/slaet-%E2%80%94-new-tab-to-do-lis/pkcodfcngbboofdelfejggniolgainof
7. Slaet official  
   https://slaet.space/
8. Molt Chrome Web Store — updated 2026-08-27  
   https://chromewebstore.google.com/detail/molt-%E2%80%94-new-tab-dashboard/pkgnibilkdfocgnegpjbjjahjmcfdnfj
9. Speedtab Chrome Web Store — checked 2026-09-08  
   https://chromewebstore.google.com/detail/speedtab-local-speed-dial/adkjbdepojalajhfkoobiedddlnoamff

### Community signal
10. Reddit / r/WritingWithAI — 2026-08-18 Sudowrite credits complaint（anecdotal only）  
    https://www.reddit.com/r/WritingWithAI/comments/1vrx7be/ive_hit_a_frustrating_dilemma/

---

## What Changed Since Last Radar

1. **NEW HIGH-VALUE：ai-novel-workstation #4** — r5 只將 ai-novel 對應到 Context Manifest；r6 發現直接競品已把 long-form cost estimate 升級成 planning-time billing contract，而 Reese 目前仍是 token hard cap + post-hoc cost report。這是新的 workflow gap，不與 #2 重複。
2. **Implementation state changed / clarified**：ai-novel #2 已有 open PR #3，包含 deterministic chapter context manifests；本輪不介入該 PR，避免另一排程的實作 scope 被外部雷達擴張。
3. **New adjacent workflow**：Gamma 8/28 將 thread/files → presentation 的 intake 搬進 Slack，強化「減少 copy/paste / app switching」訊號，但不立案。
4. **New emerging-product cluster**：Slaet / Molt / Speedtab 顯示 local-first 新分頁仍活躍，且 optional sync/share 可作 opt-in plane；MaterialYouNewTab 暫時研究，不轉 account-first。
5. **No product-direction reversal**：本輪沒有證據推翻 r5 的「固定 baseline + bounded escalation」原則；Cost Envelope 反而補上一個相同形式的 bounded-resource contract。
