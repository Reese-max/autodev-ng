# 外部競品／新品／工作流靈感雷達 — 2026-09-17T08:00:30Z

> 查閱日：2026-09-17（Asia/Taipei）
>
> Issue Quality：`issue_quality_version: 2`；本輪重新讀取 `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
>
> Evidence labels：`CONFIRMED`＝第一方官方資料或可直接檢查的 repository truth；`LIKELY`＝有支持但仍需 runtime／真人證據；`COMMUNITY_SIGNAL`＝個別社群經驗，不代表普遍發生率；`UNKNOWN`＝資料不足。
>
> 本輪只新增此中央情報報告；沒有修改產品原始碼、CI/config、secret、權限或 repository settings，沒有建立實作 branch、merge、deploy、啟動 worker/run/GOAL，也沒有新增付費承諾或改動正式資料。

## Executive Summary

本輪依上一輪公平輪巡 cursor 深讀 `Reese-max/minideck`。重新完整分頁列舉目前 GitHub connection 可見的 Reese-max-owned repositories：第一頁 39、下一頁為空；其中 `obsidian-vault` 為 archived，因此目前可確認為 **39 owned / 38 unarchived**。這與較早的 42/39 inventory 不一致，維持 `CONNECTED_INVENTORY_DRIFT`，不把目前看不到的 repository 解讀為已刪除或不存在。

`minideck` default branch 仍是 `main@31f7131ae24af9d89287000e8048750e598686a1`，HEAD 是 2026-09-12 的 audit/documentation commit；本輪沒有發現新的 default-branch 產品實作變更。Owner 核定方向仍為 **INVEST / SIMPLIFY**：保留 prompt → shareable HTML 的低負擔核心，先完成明確 publish/unpublish 邊界與真實 runtime/CI 證據，不增加協作、分享分析或大型設計平台範圍。

外部市場出現一個新的、但目前只適合保留在中央清單的訊號：Canva 於 2026-09-08 公布 4,000 名經常做工作簡報者的 Presentation Paradox 研究，顯示「AI 幫忙做 slides」後，使用者仍大量把 AI 用於 **演講準備／speaker notes／預想問題／角色扮演 rehearsal**。這使「presentation workflow 不只到 deck 生成」成為值得觀察的相鄰方向；但 `minideck` 目前沒有真人證據顯示 presenter coaching 是核心阻塞，而且 Product Board 明確要求先 SIMPLIFY，因此 **不建立 Issue**。

同時，Canva 2026-09-03 的 Visual Suite 更新把資料→圖表→stakeholder deck、custom-generated presenter notes、one-click presenting 與 mobile creation 放進同一套工作流。可移植原則是「減少 deck 前後的跨工具重輸」，不是複製 Canva 的 multi-format workspace。對 `minideck` 最直接的市場訊號仍然被既有 active scope 覆蓋：PR #1 已在做 MCP/source objects/claim mapping/slide-scoped revision；Pitch MCP/API 也早已在歷史雷達記錄，因此本輪標為 `DEDUPE + SKIPPED_LOCKED_ACTIVE_PR#1`。

結果：**0 新 Issue、0 existing Issue 修改、0 PR comment、0 implementation authorization**。

下一個公平輪巡 cursor：`ppt-studio`。

## Scope / Repository Truth

### Fresh portfolio pagination

- Current connected owner listing：39 repositories。
- Archived：`obsidian-vault`。
- Current owned + unarchived：38。
- 第二頁 cursor 已實際讀取且為空。
- 早期 42/39 與目前 39/38 的差異只記 access/inventory drift；不推論刪除。
- 空 repo、內容庫、support-only repo 不強行製造產品缺陷；本輪 deep product 為可存取且未封存的 `minideck`。

### minideck current default-branch truth

Default branch：`main@31f7131ae24af9d89287000e8048750e598686a1`。

Current owner-approved product direction（Product Board 2026-09-12）：
- Decision：`INVEST / SIMPLIFY`。
- 核心價值：低負擔 prompt → shareable self-contained HTML。
- 第一優先：draft/public head 分離、explicit preview/publish/unpublish、實際 Worker/D1/R2 驗證。
- 不優先：更多 generator、collaboration、sharing analytics、workspace breadth。

Existing repository facts relevant to this radar：
- `main` 的匿名 `/p/:id` 仍追隨 `current_version`；`published_version` 尚未存在，因此 publication boundary 仍由既有 #4/#5 追蹤。
- `main` 既有 `sourceData` 是單一文字型來源入口；歷史 radar 已記錄 open draft PR #1 正在擴成 source objects / claim mapping / MCP authoring。
- `main` revise 仍是 whole-deck HTML instruction flow；歷史 radar 已記錄 PR #1 的 `changedSlides` / slide-scoped patch，故「局部 agent editing」不是新的未覆蓋 gap。
- #6 是自動 CI execution validation gap；PR #8 正在處理，但其 own body 仍承認 default-branch push 真正取得 runner 並成功跑完 checkout/setup/install/check 尚未完成。
- #9 是 PR #1 queue/lease path 的 source-confirmed P2 reliability 問題；不因本輪競品訊號擴大 scope。

### Active work / coordination

本輪只讀確認，不取得任何 Issue lease，也不修改 active scope：

- PR #1 `feat(presentation): add v2 MCP and Dashi runner`：open draft，head `feature/presentation-studio-mcp-v2@0cb4ebc32fd4b75f2470f92854c6ceed79f0103e`，44 changed files。內容已涵蓋 Streamable HTTP MCP、OAuth/PKCE、source objects/claim integrity、Dashi runner、plan/render/revision/export、visual/factual judge；production 尚未部署。
- PR #8：`devin/issue-6@c939bd375b778e70f0e92876c6b10cb88037c492`，正在處理 #6 CI validation gap；不搶改。
- PR #3：`security/issue-2-require-token-on-deck-read@86ed0144b52387fc95b739074df509a3e5074dca` 仍 open；屬歷史 deck version authorization scope。
- #4/#5 publication-boundary fingerprint 已存在；本輪沒有新根因，不重複建單。

## External Signals

### A. Direct competitor / workflow expansion — Canva 把 presentation 從「做投影片」往「上台前準備」延伸

**CONFIRMED；事件日期 2026-09-08；查閱 2026-09-17**

Primary / first-party product-study source：
- https://www.canva.com/newsroom/news/ai-presentation-study/

Dated release corroboration（Canva via Business Wire）：
- https://www.businesswire.com/news/home/20260908549712/en/

Canva 的 Presentation Paradox 研究樣本為 4,000 名、近一個月有工作簡報經驗的成人，資料蒐集期為 2026-06-18 至 2026-07-01。Canva 報告：53% 目前用 AI 作 presentation coach，其中 45% 用於 draft feedback、41% 預想 audience questions、34% 產生 speaker notes、28% 角色扮演主管／同事、28% review 自己的 presentation recording。

Evidence boundary：這是 Canva 委託/發布的調查，能證明其樣本中的回答與 Canva 的產品策略訊號，**不能**外推成 MiniDeck 使用者比例、完成率或 ROI。

**User job**：生成 deck 之後，使用者仍需把內容轉成「我要怎麼講、會被問什麼、時間怎麼控制」。

**Manual steps potentially reduced**：另開 ChatGPT/筆記工具、複製 deck 摘要、重新描述 audience、手動整理 speaker notes 或問題清單。

**Transferable principle**：若未來真的有 MiniDeck 真人 evidence，可先驗證一個非常薄的 read-only companion：從已核定 published version 產生 notes / likely questions；不需要 avatar、錄影分析、earpiece 或 live coaching。

**Gate decision**：`ADJACENT IDEA / NEEDS_USER_EVIDENCE`。目前 owner direction 明確先 SIMPLIFY，且沒有 observable MiniDeck user break，因此不建 Issue、不給 READY_FOR_IMPLEMENTATION。

### B. Direct competitor current release — Canva Visual Suite 100+ 更新把資料、deck 與 presenting 串在同一個 project

**CONFIRMED capability；release event date 2026-09-03 有外部日期核對；查閱 2026-09-17**

Primary source：
- https://www.canva.com/newsroom/news/visual-suite-100-updates/

Date cross-check：
- https://kaleidofield.com/news/canva-100-visual-suite-updates-breadth-not-workflow-proof

Canva 官方描述的新工作流包括：Sheet 的資料可以不 export/reupload 直接轉成 chart 或 stakeholder deck；Presentation 加入 one-click presenting 與 custom-generated presenter notes；整個 Visual Suite 強調 Whiteboard → Doc → Sheet → Presentation → Website 的同 project continuity。官方也報告東南亞有 55% presentations 從 mobile 開始，但這是 Canva company-reported usage，不能當 MiniDeck mobile demand。

**User job**：從已有資料進入 deck、最後準備 delivery，減少跨工具 copy/export/reupload。

**What fits**：保留 canonical artifact + source-bound context + delivery-facing metadata 的概念。

**What not to copy**：Whiteboard/Docs/Sheets/Websites、team collaboration、mobile-native suite、full presenter workspace。MiniDeck 的 `INVEST / SIMPLIFY` 明確反對此 breadth。

**Gate decision**：資料→deck 與 source context 已被 active PR #1 覆蓋；presenter notes 沒有 repo/user evidence；因此 `DEDUPE / ADJACENT IDEA`，0 新 Issue。

### C. New distribution/tool signal — AI assistants 直接驅動 presentation service 已成平台級路徑，但不是新 fingerprint

**CONFIRMED；current capability checked 2026-09-17**

Sources：
- Canva AI Connector help: https://www.canva.com/help/mcp-agent-setup/
- Pitch MCP/API release 2026-08-12: https://pitch.com/whats-new/introducing-pitch-mcp-and-api

Canva 目前讓 ChatGPT、Claude、Cursor 等 MCP-capable assistants 連到 Canva API，建立設計、autofill template、搜尋既有 design、匯出 PDF/image；Pitch 則在 2026-08-12 已讓 Claude 從 call notes / CRM records 產 deck，並可從 workflow trigger delivery。

這個市場方向在 `autodev-ng` 歷史 radar 已多次紀錄，而且 MiniDeck open draft PR #1 已實作 Streamable HTTP MCP + OAuth/PKCE + runner。因此本輪只當 **外部驗證 active strategy**，不是新 Issue。

Coordination：`SKIPPED_LOCKED_ACTIVE_PR#1`；沒有 comment、scope rewrite 或 lock acquisition。

## New Releases / Current Capability Checks

- **2026-09-08 — Canva Presentation Paradox**：市場研究與產品敘事從 slide generation 延伸到 speaker notes / rehearsal / audience-question preparation。
- **2026-09-03 — Canva Visual Suite 100+ cumulative updates**：Presentation 加入 presenter-note workflow；Sheet→deck 減少 export/reupload；官方宣稱全球 rollout。
- **2026-08-12 — Pitch MCP/API**：本輪重新核對 capability，屬歷史已知訊號，沒有重新計為新發現。
- **2026-09-17 current pricing check — Pitch**：Free €0（100 AI credits，非每月重置）；Plus €10/month annual billing；Team €15；Business €20。Advanced links/engagement analytics 從 Team 起更完整。價格只作 packaging 訊號，不推算 MiniDeck willingness-to-pay。
  - https://pitch.com/pricing

## Community Pain

以下全部是低權重 `COMMUNITY_SIGNAL`，不作發生率或立案主證據：

- **2026-09-15** 一則 Reddit 討論只有極少回覆，但明確問「AI slide tool 的 editable PowerPoint export 是否是 must-have」，有回覆表示曾被不可編輯/品質差的輸出卡住。
  - https://www.reddit.com/r/aitoolhq/comments/1wheerv/is_editable_powerpoint_export_a_must_for_ai_slide/
- **2026-09-09** 一則 B2B deck 討論抱怨 serious work 缺 sources、editable PPTX 與 corporate templates；回覆數很少且含產品推薦，不能代表市場比例。
  - https://www.reddit.com/r/GoogleSlides/comments/1wbxywv/which_ai_presentation_generator_is_actually_good/
- **2026-09-05** Afterdeck 自我推廣文主張用 pure HTML slides + integrated agent + editable export 解決 flat AI slide 問題；因明顯是產品作者宣傳，只保留為 competitor positioning，不當獨立 effectiveness evidence。
  - https://www.reddit.com/r/SideProject/comments/1w89r76/gamma_and_ai_slide_generators_look_like_slop_so_i/

對 MiniDeck 的解讀：editable/export/source pain 與歷史 radar 一致；PR #1 與既有 export paths 已在處理相鄰能力，沒有新根因。任何「大家都需要 PPTX」的結論都不成立。

## Opportunity Map — minideck

| Bucket | Decision | Evidence / reasoning |
|---|---|---|
| MUST MATCH | 明確 draft/publication boundary；核心 queue recovery；可驗證 CI/runtime | #4/#5、#9、#6 已存在；repo/source evidence 強於新市場功能 |
| SHOULD BE BETTER | source-bound deck creation + smallest targeted revision，不因 agent editing 漂移無關 slides | 外部方向持續驗證，但 PR #1 active scope 已覆蓋，`SKIPPED_LOCKED` |
| DIFFERENTIATOR | lightweight self-contained HTML + stable public player + bounded/inspectable agent service | 與 Canva/Pitch workspace breadth 不同，符合 owner `INVEST / SIMPLIFY` |
| ADJACENT IDEA | published-version speaker notes / likely-questions companion | 2026-09-08 Canva study 是需求訊號；目前無 MiniDeck 真人/usage evidence，不建 Issue |
| DO NOT COPY | Canva multi-format suite/mobile app、Pitch deal rooms/analytics、avatar presenter、live earpiece coaching、full collaboration workspace | scope/maintenance/cost 擴張，且不解目前已證實的 publication/CI/recovery 問題 |

## Cross-portfolio Ideas

本輪沒有通過 Gate 的跨 portfolio 共用能力。

「presenter coach」目前只是一個 presentation-specific adjacent workflow，沒有證據支持抽成 portfolio-wide agent framework。Canva/Pitch 的 MCP/connector 方向也已由各 repo 既有 MCP/agent work 承接，不新增 shared abstraction。

## Ideas Rejected / Deferred

- **現在新增 Presenter Coach / rehearsal mode** — DEFER：外部調查有市場訊號，但沒有 MiniDeck user pain 或 owner direction；先完成 #4/#6/#9。
- **新增 AI avatar presenter / live audience sensing / earpiece prompts** — REJECT NOW：高 scope、高 runtime/privacy complexity，完全沒有 repo-level value evidence。
- **把 MiniDeck 擴成 Canva 式 Whiteboard+Doc+Sheet+Website suite** — REJECT：直接違反 `INVEST / SIMPLIFY`，維護面暴增。
- **因 Canva/Pitch 都有 MCP 再開一張 MCP Issue** — REJECT/DEDUPE：PR #1 已是 active implementation scope，歷史 radar 也已記錄 Pitch MCP/API。
- **因 Reddit 提到 editable PPTX 就升級 export 為 P1/P2** — REJECT：社群樣本少、含 promotion，不能取代本產品因果證據。
- **因 Canva 調查的 53% 使用 AI coach 就捏造 ROI 或 Opportunity Score** — REJECT：vendor study 不是 MiniDeck product analytics。

## Four-Gate Evaluation

### Candidate: thin presenter-prep companion

1. **Problem / value**：外部樣本顯示存在工作，但 MiniDeck 目前沒有可觀察的真人斷點、support request 或 completion failure。`NOT_ESTABLISHED`。
2. **Priority**：`kind=OPPORTUNITY`（若未來研究則轉 RESEARCH）；`severity=NOT_ESTABLISHED`；`decision_priority=LOW`；`triage=NEEDS_EVIDENCE`；`auto_implementation=false`。
3. **Minimum**：若有真人證據，先從既有 published deck 產一份 ephemeral notes/questions，不能先建 recording pipeline、avatar、memory DB 或 coaching service。
4. **Research/implementation separation**：目前連 research Issue 都不需要；中央清單足夠。未來只有在真實使用者證據顯示「deck 已完成但 presenter prep 是重複斷點」時，才做小實驗並以 BUILD/NARROW/REJECT 結束。

Decision：**NO ISSUE**。

## Issue / PR Mapping

| Tracking | 本輪判斷 | Action |
|---|---|---|
| minideck #4 / #5 — publication boundary | 仍是同一既有 fingerprint；外部新訊號未改根因 | NO CHANGE / DEDUPE |
| minideck #6 / PR #8 — CI execution | Active ownership；與市場訊號無關 | SKIPPED_LOCKED |
| minideck #9 / PR #1 queue path — expired-running recovery | 既有 source-confirmed P2；不依賴 presenter research | NO CHANGE |
| minideck PR #1 — MCP/source/slide-scoped revision | Canva/Pitch external direction再度驗證；scope 已活躍 | SKIPPED_LOCKED_ACTIVE_PR#1 |
| minideck PR #3 — historical deck auth | unrelated active security scope | NO CHANGE |

New Issues: **0**  
Updated Issues: **0**  
PR comments: **0**  
Implementation authorization: **0**

## Severity / Scope Calibration

- 沒有把 competitor capability 升成 P0/P1/P2。
- 沒有用 Canva 4,000-person survey 替 MiniDeck 建立 severity 或 ROI。
- #9 的 P2 來自 repo source-causal recovery bug，不受本輪市場研究影響。
- #6 的 P2 是既有自動 CI validation path 問題；本輪沒有宣稱 PR #8 已修好。
- #4/#5 的歷史優先級/描述本輪未重寫；publication boundary 仍應依 Issue Quality v2 與真正 runtime evidence驗收。
- `main@31f7131...` 自 2026-09-12 以來沒有新的 default-branch product change；active PR 的能力不能冒充已合併/production 能力。

## Runtime / Evidence Gaps

- 本輪沒有執行 MiniDeck production Worker、D1、R2、browser presentation flow、MCP、Pitch/Canva paid capability 或 provider API。
- PR #1 的 historical CI/container smoke 只能證明其記錄的 candidate SHA/path；production 仍未部署。
- Canva company-reported scale、使用比例與 time-saving 不等於 MiniDeck outcome benchmark。
- Reddit/community posts 不代表普遍發生率。
- Current connected inventory 39/38 與舊 42/39 不一致；仍存在 access/inventory drift，不能推論 repo deletion。

## Sources

### Repository / owner direction
- https://github.com/Reese-max/minideck
- https://github.com/Reese-max/minideck/blob/main/README.md
- https://github.com/Reese-max/minideck/blob/main/.github/quality-audits/2026-09-12-1010-product-board-audit.md
- https://github.com/Reese-max/minideck/blob/main/docs/audits/50-persona-round-4-2026-09-12.md
- https://github.com/Reese-max/minideck/pull/1
- https://github.com/Reese-max/minideck/pull/8
- https://github.com/Reese-max/minideck/issues/4
- https://github.com/Reese-max/minideck/issues/5
- https://github.com/Reese-max/minideck/issues/6
- https://github.com/Reese-max/minideck/issues/9
- https://github.com/Reese-max/autodev-ng/blob/main/docs/competitive-intelligence/2026-09-14T200041Z-external-radar.md

### Public web
- https://www.canva.com/newsroom/news/ai-presentation-study/
- https://www.businesswire.com/news/home/20260908549712/en/
- https://www.canva.com/newsroom/news/visual-suite-100-updates/
- https://www.canva.com/help/mcp-agent-setup/
- https://pitch.com/whats-new/introducing-pitch-mcp-and-api
- https://pitch.com/pricing
- https://www.reddit.com/r/aitoolhq/comments/1wheerv/is_editable_powerpoint_export_a_must_for_ai_slide/
- https://www.reddit.com/r/GoogleSlides/comments/1wbxywv/which_ai_presentation_generator_is_actually_good/
- https://www.reddit.com/r/SideProject/comments/1w89r76/gamma_and_ai_slide_generators_look_like_slop_so_i/

## What Changed This Run

1. Fresh pagination reconfirmed currently accessible Reese-max inventory at **39 owned / 38 unarchived**; second page empty；保留 inventory drift 註記。
2. Fair-rotation deep scan moved from `MaterialYouNewTab` to `minideck`。
3. Reconfirmed `minideck main@31f7131...` unchanged at product-code level since prior MiniDeck radar; active work now includes PR #8 and source-confirmed #9 around PR #1 queue recovery。
4. Added **2026-09-08 Canva Presentation Paradox** as a new adjacent workflow signal: AI slide creation is extending into presenter preparation, but it does **not** pass MiniDeck issue gate。
5. Added current **2026-09-03 Canva Visual Suite** workflow evidence around data→deck continuity / presenter notes / mobile; rejected suite-level copying。
6. Rechecked Pitch MCP/API and pricing; MCP remains historical/deduplicated evidence for active PR #1, not a new feature request。
7. **0 new Issue / 0 Issue update / 0 PR comment / 0 implementation authorization**。
8. Next fair cursor：`ppt-studio`。

## Completion Status

`COMPLETE_WITH_CONNECTED_INVENTORY_DRIFT`

本輪成功完成 fresh owner pagination、規則 blob 核對、owner direction/default-branch/Issues/active PR 協調、真正外部市場探索、Opportunity Map、去重與四道 Gate。唯一保留限制是 connected inventory 與舊 inventory 不一致；本輪不把 access drift 誤判成 repository deletion。