# 外部競品／新品／工作流靈感雷達 — 2026-09-23T20:00:34Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / MATERIAL_COMPETITOR_STRATEGY_CHANGE / ZERO_NEW_ISSUE**。
- 主要情報來源為 Reese-max GitHub 之外的公開網路；GitHub 只用於 owner inventory、current product truth、方向／範圍、去重、active ownership 與報告持久化。
- Issue Quality v2：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，blob SHA `8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected-owner inventory 已完整分頁至空頁：**42 Reese-max-owned repositories / 41 unarchived / 1 archived**；`obsidian-vault` archived，不納入產品輪巡。
- 上一輪 handoff 指向 `Reese-max/octobroker`。本輪重新核對：owner `octobroker/main@b669101c0ef4a2c03c1ddcb2b99c014fd1947d29` 與 upstream `openabdev/octobroker/main` 仍完全同 SHA，因此維持 mirror-fork exclusion，不把 upstream finding 歸給 Reese-max。
- `Reese-max/openab` 也重新核對：owner `main@50424ed461776fc4b817a85ee08052533f511d1e`，upstream `openabdev/openab/main@3718ef059715d00008d10c76ea442d376b413414`；upstream 新 commit 的 parent 正是 owner SHA。它已由「exact mirror」變成**一個 upstream commit behind 的未客製 mirror lineage**，仍不視為 Reese-max 自有產品缺陷來源，也不操作 upstream。
- 因兩個 fork exclusion，本輪實際產品 focus 前進至 **`Reese-max/police-essay-mcp`**。
- Focal current default HEAD：`main@7fcff5048935f2dd303a4f270aa68574cd33327b`；該 HEAD 為 audit-only，最近實質產品／測試基線為 `92b10e3a20d21a0803176fdb67e551646fdd3696`。
- Owner-approved direction 重新核對：**INVEST / NARROW / SECURE REMOTE BEFORE CONNECT**。產品核心是臺灣警察／公務人員申論的固定 A4 兩頁、每頁 22 行、結構化段落編修、可預測行數與可移植輸出；明確不擴成 OCR、AI 評分、題庫／LMS、帳號／雲端同步、多人協作、商城、通用文件平台或通用 IAM。
- Active ownership：PR #5 是 interactive answer-sheet canvas WIP；PR #6 是 #4 remote export artifact。兩者皆 open；本輪不搶 scope、不留言、不改 PR、不取得 Issue lease。
- 本輪沒有實際執行 ChatGPT connector、tunnel、Word／LibreOffice、手機、列印、正式資料、付費 provider 或 destructive action；未實跑的產品路徑仍是 `NEEDS_RUNTIME_VERIFICATION`。
- 本雷達不宣告 portfolio CLEAN。

## Executive decision

2026-09-23 出現一個**值得通知但不值得開單**的直接競品策略變化：臺灣警察／公職補習品牌 WAYDA 將課程、章節練習、模擬測驗、歷屆考古題、錯題／成績紀錄與「申論 AI 批閱」整合成單一學習系統；申論答案可直接線上作答，也可手寫拍照上傳，並讓 AI 25 分制評分與老師人工批閱並存。

這證明目標市場正在把「申論作答」包進一個完整 LMS／輔考閉環，而不是只做單點 AI 批改。但是，這個外部訊號**沒有推翻 owner 已核定方向**：`police-essay-mcp` 的差異化仍應集中在「把內容可靠地放進真實固定答題紙、精確知道還剩幾行、局部改動不破壞其他段落、輸出可取回且跨 renderer 可驗證」。WAYDA 的 OCR／AI 評分／學習分析／全科 LMS 廣度屬於已明確拒絕的產品面，不應因競品具備就照抄。

相鄰領域也出現一個可移植但暫不立案的模式：ReaDDy 以 Examplify-style、倒數計時、distraction-free、逐字 local autosave、離線恢復來模擬 2026 Philippine Bar 真實作答環境。這支持「練習介面越接近真實考試，轉換成本越低」的工作流，但目前 `police-essay-mcp` 已有 active draft PR #5 處理 answer-sheet canvas，且 owner 優先事項仍是 remote safety、44-line renderer receipt、first-success ChatGPT journey；因此不新增「考試模式／計時器」 Issue。

考選部現行官方資料則提供反向邊界：115 年警察／一般警察考試頁面仍直接提供「試卷、試卡作答注意事項及範例」，而考選部另有獨立的「申論式試題模擬作答網站」提供鍵盤輸入、120 分鐘倒數與每題顯示的電腦化介面。這表示國考環境已存在**紙本與電腦化申論並行的產品形狀**；但不能把通用電腦化模擬頁推論成目前警察特考已全面改採電腦作答。現階段固定紙本 44 行仍符合 owner 已選市場，typed-exam template 只保留 `ADJACENT IDEA / HOLD`。

四道 Gate 後結果：**0 新 Issue、0 existing Issue/PR scope change、0 implementation authorization**。

# Product → market category mapping

`Reese-max/police-essay-mcp` 本輪對照：

- **Direct Taiwan exam-prep competitor:** WAYDA 公職／警察特考學習系統；
- **Official target workflow:** 考選部警察考試頁、國家考試申論式試題模擬作答網站；
- **Adjacent professional-exam workflow:** ReaDDy Philippine Bar Exam Trainer；
- **Generic substitute baseline:** Word／Google Docs／紙本模板仍由既有 product-board audit 覆蓋，本輪沒有重複做功能表式比較。

# External Signals

## A. WAYDA：從單點題庫／課程轉成「課程＋題庫＋AI申論＋人工批閱」一體化流程

**Status:** `CONFIRMED PRODUCT / MATERIAL STRATEGY CHANGE`  
**Published:** **2026-09-23**  
**Checked:** 2026-09-24 Asia/Taipei  
**Source:** https://www.wayda.com.tw/wayda-learning-system-upgrade/

官方公告確認：

- 課程、章節練習、模擬測驗、歷屆考古題、申論 AI 批閱、錯題與學習紀錄被整合進同一套備考流程；
- 申論題可線上作答，或手寫拍照上傳；
- WAYDA AI 依 25 分制評分；老師人工批閱可與 AI 並行；
- 登入後依使用者實際購買的課程／科目客製化顯示。

### 使用者工作 / 減少的人工步驟

WAYDA 減少的是 `看課程 → 到另一處找題 → 作答 → 找批改 → 回頭整理錯題／成績` 之間的跨工具搬運。它用單一帳號把內容、作答、feedback 與 progress loop 串起來。

### 可移植部分

不是「AI 25 分評分」本身，而是**作答 artifact 與 feedback state 綁在同一份 work item**，讓使用者知道「這份答案現在是什麼版本、由誰／什麼系統看過、下一步是什麼」。`police-essay-mcp` 若未來要增強 review UX，應先重用目前 answer/version/preview/check_layout/export contract，而不是建立 LMS。

### 不應照抄部分

- OCR／手寫辨識；
- AI 評分與教師 marketplace；
- 全科題庫、錯題本、會員分級、課程 entitlement；
- 學習分析 dashboard。

這些都超出 owner-approved NARROW scope；競品存在不構成需求證據。

## B. ReaDDy：專業考試產品以「像真的考場」而非「更多 AI 功能」降低練習切換成本

**Status:** `CONFIRMED CURRENT PRODUCT / ADJACENT WORKFLOW`  
**2026 exam context:** Philippine Bar Exam 2026  
**Checked:** 2026-09-24 Asia/Taipei  
**Source:** https://readdy.ddlaw.ph/

官方頁面目前提供：

- Examplify-style timed、distraction-free essay simulator；
- ALAC rubric AI critique；
- reviewer annotation；
- subject progress tracking；
- **每個 keystroke local autosave**，主張可承受斷線、refresh、battery failure；
- 一次性 Bar Season Pass ₱799，另有 review-center license。

### 可移植部分

最值得移植的是 `exact exam-shaped surface + local recovery`，不是其 rubric scoring。對 `police-essay-mcp` 來說，active PR #5 的固定答題紙 canvas 正屬同一使用者工作：減少「在一般文字框寫完後才發現真實答題紙放不下」的人工來回。

### Gate

目前已有 active PR #5，真實 MCP client runtime 尚未驗證；因此本訊號只記為 `ADJACENT IDEA / SUPPORTING_EVIDENCE`，不搶 scope、不新增 timer／lockdown／analytics Issue。

## C. 考選部：官方同時存在紙本警察考試脈絡與電腦化申論模擬介面

**Status:** `CONFIRMED OFFICIAL WORKFLOW`  
**Checked:** 2026-09-24 Asia/Taipei  
**Sources:**

- 115 年警察／一般警察等考試頁（更新 2026-09-03）：https://wwwc.moex.gov.tw/main/exam/wFrmExamDetail.aspx?c=115060
- 國家考試申論式試題模擬作答網站：https://cbtpw.moex.gov.tw/PWWebOWR/portal/PW2001_01.jsp

警察考試頁仍列出「試卷、試卡作答注意事項及範例」入口；同時，申論模擬網站提供鍵盤／滑鼠橫式作答、每次一題、120 分鐘倒數等數位流程。

### Product implication

- **不要**把「國考有電腦化申論」誤寫成「115 警察特考已全面電腦化」；本輪沒有這個證據。
- 固定紙本 44 行模板仍是當前產品的有效狹窄市場假設。
- typed-exam mode 可以成為未來的另一 template class，但只有在 owner 明確擴大考試類型、且出現真實使用者工作證據後才值得研究；現在不立案。

# New Releases / strategy changes

| Date | Product | Change | Radar decision |
|---|---|---|---|
| 2026-09-23 | WAYDA | 課程／題庫／模考／錯題／AI 申論／手寫照片／教師批閱整合為同一學習流程 | **重大直接競品策略訊號；通知，但不開 Issue** |
| 2026-09-03（頁面更新） | 考選部 115 警察考試頁 | 仍保留紙本試卷／試卡相關入口 | 支持目前固定答題紙 target；不宣稱未來制度不會變 |
| current 2026 season | ReaDDy | Examplify-style timed practice + local keystroke autosave + AI/human review | 支持 exam-shaped/recovery UX；active PR #5 已覆蓋相鄰 scope |

# Community Pain

本輪**沒有使用 Reddit／論壇 anecdotes 建立發生率或 severity**。WAYDA、ReaDDy 與考選部訊號均來自產品／官方第一手頁面；因此只能確認市場／工作流存在，不能推估 `police-essay-mcp` 使用者會有多少人要求 AI 評分、OCR、計時器或數位考場。

# Adjacent Ideas

## 1. Review state 跟著同一 answer revision，而不是建 LMS

若未來有「老師／AI feedback」需求，最小形狀應先是：

`answerId + exact version → review candidate/comment → explicit user acceptance → new answer version`

而不是帳號、課程、教師派單、評分資料庫或 analytics。現在沒有足夠 evidence 立案。

## 2. Typed-exam template only after target expansion

官方數位申論介面證明「倒數＋逐題鍵盤作答」是國考的一種真實產品形狀。若未來 owner 要支援採電腦化作答的特定考試，最小方案是新增該考試的 template／layout contract；不是把現有固定紙本引擎改寫成通用 testing platform。

# Opportunity Map — `police-essay-mcp`

| Category | Current decision |
|---|---|
| **MUST MATCH** | 真實答題紙尺寸／行數；局部修改的版本安全；preview → apply；可取回的 DOCX/PDF/TXT；remote auth boundary |
| **SHOULD BE BETTER** | 比一般文書／AI 批改工具更清楚地告訴使用者「還有幾行、哪段超出、改這一段會不會影響整份」；同一份 44-line answer 跨 Word/LibreOffice/PDF/mobile/print 有可驗證 receipt |
| **DIFFERENTIATOR** | 臺灣申論固定格線的 deterministic line model + local-first + revision-safe structured editing，而不是 generic scoring |
| **ADJACENT IDEA** | exact-exam practice surface、local recovery、未來特定電腦化考試 template；均需 owner scope/evidence |
| **DO NOT COPY** | OCR、AI grading、全科 LMS、錯題／成績 analytics、教師 marketplace、cloud sync、collaboration、通用 exam platform |

# Cross-portfolio ideas

**「作答 artifact 的 exact revision」與「feedback／approval／export evidence」應分離但可追溯。** 這個模式可能也適用 `note-filler`、`cyber-prep-coach` 等有人工 review 的產品；但本輪沒有重新核對那些 repo 的相同 root cause，因此不建立 cross-portfolio framework Issue，也不把模式升格成共用平台需求。

# Four Gate decision

## Candidate 1 — AI／教師混合 review

1. **Problem / value:** WAYDA 證明同市場提供 AI + human review，但 `police-essay-mcp` owner 已明確拒絕 AI grading/LMS，且 repo 無 user evidence 顯示「缺評分」是目前完成率瓶頸。
2. **Priority:** `kind=OPPORTUNITY`, `severity=NOT_ESTABLISHED`, `decision_priority=LOW`, `triage=DEFERRED`, `auto_implementation=false`。
3. **Minimum:** 若未來需求成立，先把 review comment 綁 exact `answerId/version`；不用 OCR、teacher marketplace 或 analytics。
4. **Research / implementation:** 現在直接 `REJECT for current scope`；新證據若推翻 owner 拒絕理由才重評。

## Candidate 2 — exam-shaped timed practice / typed mode

1. **Problem / value:** ReaDDy 與考選部證明 real-exam-like UI 能減少練習到正式考試的 context switch；但 police target 仍有紙本流程，且 repo 已有 answer-sheet canvas WIP。
2. **Priority:** `kind=OPPORTUNITY`, `severity=NOT_ESTABLISHED`, `decision_priority=LOW_TO_MEDIUM`, `triage=NEEDS_EVIDENCE`, `auto_implementation=false`。
3. **Minimum:** 先完成／驗證既有 canvas；若特定 typed exam target 確立，再新增一個 bounded template，不先建 timer service、exam scheduler 或 testing platform。
4. **Research / implementation:** active PR #5 使相關範圍 `SKIPPED_LOCKED`; 不新增 Issue。

## Candidate 3 — 目前核心 reliability gaps

外部競品沒有推翻既有優先序。#1 remote/tunnel auth、#4 remote artifact retrieval/PR #6、44-line real renderer receipts、ChatGPT first-success journey 仍高於競品 breadth。競品新增功能不自動升級既有 Issue severity。

# Rejected Ideas

- **手寫 OCR / photo-to-text:** rejected for current scope；WAYDA 有能力不代表本產品需要，且 owner 明確拒絕。
- **AI 25 分評分／rubric engine:** rejected；沒有產品內真實需求證據，且會引入評分可靠性、教材／基準、模型成本與申訴治理。
- **老師人工批閱平台:** rejected；需要身份、派單、權限、通知、營運與 marketplace 面，遠超現有單人 local-first 工具。
- **全科題庫／LMS／錯題分析:** rejected；直接違反 NARROW，且與 deterministic answer-sheet differentiation 無關。
- **現在新增考試倒數／lockdown:** rejected；active PR #5 尚未有真實 runtime receipt，先把現有 exam-shaped canvas 驗證完。
- **把考選部數位申論當成警察考試轉型結論:** rejected；目前只證明官方有此介面，不證明 115 警察特考已全面採用。

# Issue Mapping / coordination

| Signal / fingerprint | Existing mapping | Decision |
|---|---|---|
| remote/tunnel owner authorization | #1 | existing P1；本輪不改 severity/scope |
| overlapping expectedVersion writes | #3 | existing P2；本輪無新 external evidence改變 root cause |
| remote export artifact retrievability | #4 + active PR #6 | `SKIPPED_LOCKED`; 不留言、不搶 scope |
| interactive answer-sheet canvas | active draft PR #5 | ReaDDy / exam-shaped workflow 僅補 supporting evidence；`SKIPPED_LOCKED` |
| AI grading / handwritten photo review | no matching Issue | owner-rejected current direction；`REJECT / NO ISSUE` |
| typed computer-based exam template | no matching Issue | `ADJACENT IDEA / NEEDS_EVIDENCE / NO ISSUE` |

沒有取得 `github-issue-lock:v1`，因為本輪沒有修改任何 existing Issue、PR comment 或共用 tracking state。報告為唯一新檔，沒有覆寫 shared history。

# Sources

公開網路，查閱日 2026-09-24 Asia/Taipei：

1. WAYDA，**2026-09-23**，《WAYDA學習系統全面升級：課程、題庫、AI申論批閱一次整合的備考流程》  
   https://www.wayda.com.tw/wayda-learning-system-upgrade/
2. 考選部，115 年公務人員特種考試警察人員／一般警察等考試頁，頁面更新 **2026-09-03**  
   https://wwwc.moex.gov.tw/main/exam/wFrmExamDetail.aspx?c=115060
3. 考選部，國家考試申論式試題模擬作答網站（頁面未提供本輪可驗證發布日）  
   https://cbtpw.moex.gov.tw/PWWebOWR/portal/PW2001_01.jsp
4. ReaDDy — Philippine Bar Exam Trainer（2026 Bar season；頁面未提供本輪可驗證發布／更新日）  
   https://readdy.ddlaw.ph/

Source classification:

- WAYDA：`CONFIRMED FIRST-PARTY PRODUCT CLAIM`；不能當作獨立成效測量或採用率。
- 考選部：`CONFIRMED OFFICIAL WORKFLOW`。
- ReaDDy：`CONFIRMED FIRST-PARTY PRODUCT CLAIM`；定價與功能於本輪查閱時可見，不能外推成市場普遍需求。
- 本輪沒有用 community posts 推估 incidence。

# What Changed

- **Portfolio applicability:** `octobroker` 仍 exact upstream mirror；`openab` 從 exact mirror 變成 upstream-behind-one-commit mirror lineage，仍不當成 owner 自有產品 finding 來源。
- **Direct competitor:** WAYDA 2026-09-23 將 AI 申論／手寫照片／教師批閱整合到完整備考平台，屬重大直接競品策略變化。
- **Product decision:** 外部變化沒有推翻 `police-essay-mcp` 的 NARROW/local-first/fixed-layout direction；反而讓「不要跟著做 LMS breadth」更清楚。
- **New Issues:** 0。
- **Existing Issue/PR comments or scope changes:** 0。
- **Implementation authorization:** 0。
- **Product code / CI / config / secrets / permissions / settings / implementation branch / merge / deploy / worker / GOAL / paid call / production data changes:** 0。
- **Runtime evidence added:** 0；維持 `NEEDS_RUNTIME_VERIFICATION` for real ChatGPT/export/render/mobile/print paths。

# Completion / gaps / cursor

- Fresh inventory pagination：**COMPLETE — 42 owned / 41 unarchived / 1 archived**。
- Rule blob verification：**COMPLETE — `8167e10798071d2276addaff6b201c6b0e904a2a`**。
- Owner direction / current HEAD / issues / PRs / active scope：**COMPLETE for focal repo**。
- External A/B/C scan：**COMPLETE enough for decision** — direct WAYDA, adjacent ReaDDy, official MOEX workflow; no fixed quota was forced.
- Report write：pending write/read-back verification at the moment this body was prepared.
- Notification gate：**YES — major direct competitor strategy change (WAYDA 2026-09-23)**。通知內容應只說影響與最小下一步；不製造 Issue。
- Fair rotation：`octobroker` exclusion consumed, `openab` applicability revalidated, `police-essay-mcp` processed. **Next cursor wraps to `Reese-max/exam-archive` for a fresh applicability check**；不得預先假設它是產品型 repo，若是內容／archive collection 則當輪直接跳至下一個 eligible product。
