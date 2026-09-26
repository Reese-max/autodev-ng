# 外部競品／新品／工作流靈感雷達 — 2026-09-26T07:58:55Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / MATERIAL ADJACENT WORKFLOW SHIFT / 0 NEW ISSUES**。
- 主要情報來源為 GitHub 之外的公開網路；GitHub 僅用於 Reese-max 產品真相、owner 範圍、Issue/PR 去重、協調與報告持久化。
- Issue Quality v2：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，blob SHA `8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected-owner pagination：**42 Reese-max-owned repositories / 41 unarchived / 1 archived (`obsidian-vault`)**；第二頁 0 筆，不沿用舊 inventory 當全集。
- 本輪 fair-rotation focus：`Reese-max/note-filler`。
- current default branch：`main@e8057ad815fc18dfd20aeea5e2e3c76d56925b3b`。
- 最近產品程式 baseline：`935b00113662942f9d700444de42d445ee6c8cea`；從 baseline 到目前 HEAD 的 4 個 commit 僅新增 fixed-50 audit docs，沒有產品 source/config 變更。
- Owner/product-board 最近校準：**MAINTAIN / SIMPLIFY**。核心工作是法律／行政／考試筆記補齊，原稿不可變、無來源不進正文；不要擴成大型法律平台、Vault/DMS、帳號系統、citator clone、host integration framework。
- Current active scope：#3 + PR #10（claim-level Verify/Accept/Reject 與 decision history）；#1/#4 + PR #8（README + web export isolation）；#9（law snapshot freshness research，已 NARROW）；#12（batch sidecar binding P2）。本輪不搶改 active scope。
- 本輪沒有執行 provider、正式法律意見、production web、CI 觸發、merge/deploy、worker/GOAL、secret/permission/settings 變更，也沒有修改產品 source/config。

## Executive decision

**0 new Issue、0 existing Issue/PR comment、0 implementation authorization。**

本輪真正的新訊號不是「再加一個法律 AI 功能」，而是 **source-grounded research 正直接移進使用者本來就寫作的文件編輯器**：

1. Google Workspace 在 **2026-09-23**讓 Google Docs 可直接引用 Gemini Notebook 作為 context source，從研究資料庫直接在文件內產生內容並附 inline citations，官方明確把價值定位成「不用切頁、不用 copy-paste」。
2. OpenAI 在 **2026-09-17**讓 ChatGPT for Word GA，直接在 Word 裡從 notes/source text 起草、修改選取內容與格式；同日 Astra for Law 將 legal search、法律分析/寫作、trusted controls、partner plugins 與既有法律工具連在一起。

對 note-filler 的校準是：

> 「AI 幫我補筆記／從來源起草」以及「AI 出現在 Word/Docs」正在商品化。更值得累積的是 **不可變原稿 + claim/evidence binding + currentness truth + human adoption decision + artifact receipt**。這些可信狀態應能跟著成品走，但目前沒有使用者證據支持立即做 Google Docs/Word plugin、MCP 或 hosted integration。

## Product → market category mapping

- 直接競品／替代：legal research + drafting copilots、Astra for Law、CoCounsel/Harvey/Lexis 類 source-grounded drafting。
- 相鄰工作流：Google Docs + Gemini Notebook、ChatGPT for Word，把 research context 帶進 target editor。
- 可移植能力：inline citations、source identity continuity、human review before adoption、document-scoped provenance。
- 非目標：DMS/matter workspace、全套 office add-in、host marketplace、跨平台 connector framework、legal citator clone。

# External Signals

## A. Google Docs × Gemini Notebook：research → writing handoff 直接進文件

**Status:** CONFIRMED（Google first-party）  
**Published:** 2026-09-23  
**Checked:** 2026-09-26  
**Source:** https://workspaceupdates.googleblog.com/2026/09/ground-ai-prompts-in-google-docs-on-existing-sources-from-Gemini-Notebook.html

Google Workspace Updates 宣布 Google Docs 可把既有 Gemini Notebook 當 context source。使用者在 Docs 內用 @ 引用 Notebook，Gemini 會以該來源庫 grounding 輸出並附 inline citations；官方直接描述它減少在 research 與 content creation 之間切換分頁與 copy-paste。

### User job / manual steps removed

- 不再把研究結果手動從研究工具貼回文件；
- 不再重新輸入 context；
- citation 直接留在 drafting surface，降低「文字搬過去後來源關係消失」的風險。

### note-filler implication

這是 **ADJACENT IDEA / POSITIONING SIGNAL**，不是新 integration Issue。

note-filler 目前已有 Markdown/DOCX 輸出、來源註腳、`binding_report.json` 的 argument/source/citation-span binding，也已有 #3 正在處理 system-verified 與 human-accepted 的差異。真正該先做好的是 evidence 與 decision 在成品 lifecycle 中不失真，而不是搶做 Google Docs add-on。

沒有 repo/user evidence 證明「把 note-filler 成品手動搬進 Google Docs」是高頻斷點，因此：
- kind = OPPORTUNITY
- severity = NOT_ESTABLISHED
- decision_priority = LOW_MEDIUM
- triage = NEEDS_EVIDENCE
- auto_implementation = false

若未來要研究，最小問題只能是：「現有 DOCX/Markdown export 是否已把 accepted supplement、citation 與 revision identity 帶得夠完整？」先測現有 export，不先建 plugin。

## B. OpenAI Astra for Law：current legal search + drafting + governance 變成 foundation layer

**Status:** CONFIRMED（OpenAI first-party）  
**Published:** 2026-09-17  
**Checked:** 2026-09-26  
**Source:** https://openai.com/index/astra-for-law/

Astra for Law 結合 legal search index、法律分析／寫作 instructions 與 governance controls。官方稱 legal search corpus 超過 2.3 億 URLs，來源每日加入；並把 research、facts-to-supported-answer、drafting、uncertainty、permissions/ethical walls、partner plugins 放在同一 foundation。

重要限制：OpenAI 公開 benchmark 與 early-user quote 是廠商自有評測／產品宣稱，不當作 note-filler 成效證據，也不拿 benchmark 數字推本產品 ROI。

### note-filler implication

這進一步削弱「再做 generic legal answer bot」的差異化價值，並強化既有 #9 的核心原則：**source presence ≠ current authority**。Astra 將來源每日加入，是產品能力訊號；它不證明 note-filler 必須 always-online，也不推翻 #9 的 NARROW 結論。

#9 已經 source-confirmed：本地 SQLite law snapshot 在 query 時被包成 `fetched_date=today`，使 snapshot age 對 currentness gate 不可見；研究實驗已選擇 NARROW。新外部訊號沒有改變 root cause 或退出條件，所以不留言、不重開、不升 severity。

**Decision:** DEDUPE -> #9 / NO STATUS CHANGE。

## C. ChatGPT for Word：AI 編輯器內工作流普及，但仍明示要人工核對

**Status:** CONFIRMED（OpenAI first-party Help Center）  
**Published/updated:** 2026-09-17 / checked 2026-09-26  
**Source:** https://help.openai.com/en/articles/20001526-chatgpt-for-word

ChatGPT for Word 可直接在 Word 側欄讀取目前文件、從 notes/source text 起草、修改選取段落、調整 heading/formatting。官方同時明示目前限制：
- 複雜格式／表格／圖表仍可能需要人工調整；
- open document 以外的本機檔案不能直接當 context，需貼入相關文字；
- 模型可能犯錯或改掉使用者原本想保留的內容，重要 facts / figures / citations / edits 應人工檢查並保存副本。

### note-filler implication

這個 first-party warning 反而支持 note-filler 的核心 differentiation：
- immutable original；
- supplement 與 original 分離；
- human adoption gate；
- citation/source binding；
- revision-bound decision history。

#3 / PR #10 正是 human Accept/Reject/history 的 active scope。新證據與同一 fingerprint 高度重疊，且 PR #10 尚有「computed decisions 未回傳／持久化」的 active review finding，因此本輪標記：

**DEDUPE -> #3 / SKIPPED_ACTIVE_SCOPE**。

不留言、不擴 scope，不把 Word add-in 當成需求。

# New Releases / What Changed

相較 2026-09-22 note-filler radar，本輪新增決策級訊號：

- **2026-09-23 Google Docs × Gemini Notebook**：source-grounded context 直接進 drafting surface，附 inline citations；這是前輪不存在的新 release。
- **2026-09-17 Astra for Law**：本輪補入先前未納入 note-filler external radar 的直接法律 AI foundation 訊號。
- **2026-09-17 ChatGPT for Word**：本輪補入 in-editor drafting 與 first-party「人工核對/保留原稿」限制。

沒有新的 GitHub default-branch product code change，所以這些外部訊號只能校準方向與待驗證問題，不能直接升成缺陷。

# Community Pain

本輪未找到足以改變 issue decision 的高可信新 community signal。沒有為了湊類別引用單一 Reddit 貼文或把 anecdote 當普遍發生率。

# Opportunity Map

## MUST MATCH

- 不可把 query-day 當 legal source snapshot currentness；
- 不可讓 AI suggestion 直接取得 canonical/adopted 權限；
- accepted decision 必須綁 exact claim/evidence/revision，來源或內容變動後不能靜默沿用；
- 成品與 authoritative sidecar/evidence receipt 必須一一對應。

## SHOULD BE BETTER

- 讓使用者在成品旁能快速看見「這段為何可採用／來源在哪／是否已 stale」；
- accepted-only export 的 evidence continuity 應比 generic Word/Docs AI 更清楚；
- 審查 surface 預設突出 risk / stale / unresolved claims，不要求逐段重做完整研究。

## DIFFERENTIATOR

- immutable original；
- source-bound supplement；
- explicit source conflicts / currentness UNKNOWN；
- human adoption decision history；
- delivery/binding receipt 可追溯到 exact artifact。

## ADJACENT IDEA

**Portable provenance handoff**：未來若有真實 copy-paste 痛點，先研究現有 DOCX/Markdown 是否已能把 accepted claim + citation + revision identity 帶到外部 editor；能靠 export 解決就不做 add-in。

## DO NOT COPY

- Google Docs add-on / Microsoft Word add-in；
- generic legal AI chat；
- 230M-url search index；
- DMS/Vault/matter workspace；
- connector marketplace / MCP host framework；
- online legal citator / treatment graph；
- multi-tenant account/permission system；
- agentic end-to-end legal workflow。

# Four-gate review

## Candidate: Word/Docs in-editor integration

1. **問題/價值**：外部產品證明可減少跨工具 copy-paste，但 note-filler 沒有目前使用者資料證明這是核心斷點；現有 DOCX/Markdown export 已是替代方案。
2. **優先級**：OPPORTUNITY / NOT_ESTABLISHED / LOW_MEDIUM / NEEDS_EVIDENCE。
3. **最小方案**：先檢查現有 export 是否保存足夠 provenance；若只需 export metadata/format 微調，不建立 plugin。
4. **研究/實作分離**：若未來研究，BUILD 只在可重現 handoff 遺失來源/decision 且造成實際返工；NARROW 若只缺少量 export fields；REJECT 若現有 export 已足夠。

**Decision: CENTRAL LIST ONLY / NO ISSUE。**

# Issue Mapping

- #3 + PR #10 — new ChatGPT-for-Word/human-review signal 同 fingerprint；`SKIPPED_ACTIVE_SCOPE`。
- #9 — Astra daily-source/currentness signal 僅強化既有 NARROW research；無新 root cause。
- #12 — batch sidecar overwrite 與本輪 editor signals 無關；維持 P2 SOURCE_CONFIRMED。
- #1/#4 + PR #8 — export isolation 仍較高優先，且 PR #8 在 2026-09-26 有 fresh follow-up；不搶 scope。
- #11 — continuous audit umbrella，不拿來吸收產品 feature hypothesis。

# Rejected Ideas

- **直接做 Google Docs / Word integration**：缺高頻斷點證據，且外部平台本身快速商品化。
- **做 hosted legal workspace / matter store**：超出 owner 規模與方向，增加帳號、權限、保密與長期維運。
- **做自動法規同步服務**：#9 已 NARROW；先修 provenance/currentness semantic，不先建 daemon。
- **做 citator / authority graph**：沒有 target-user evidence，且遠大於目前核心需求。
- **把外部 benchmark 當產品優先級**：OpenAI 自有 benchmark 不是 note-filler 的使用者效果。

# Sources

1. Google Workspace Updates — “Ground AI prompts in Google Docs on existing sources from Gemini Notebook” — published 2026-09-23; checked 2026-09-26.  
   https://workspaceupdates.googleblog.com/2026/09/ground-ai-prompts-in-google-docs-on-existing-sources-from-Gemini-Notebook.html
2. OpenAI — “Introducing Astra for Law” — published 2026-09-17; checked 2026-09-26.  
   https://openai.com/index/astra-for-law/
3. OpenAI Help Center — “ChatGPT for Word” — updated 2026-09-17; checked 2026-09-26.  
   https://help.openai.com/en/articles/20001526-chatgpt-for-word
4. Prior note-filler external radar — 2026-09-22T04:00:18Z.  
   https://github.com/Reese-max/autodev-ng/blob/main/docs/competitive-intelligence/2026-09-22T040018Z-external-radar.md
5. Product board checkpoint — 2026-09-22T20:03:33Z.  
   https://github.com/Reese-max/autodev-ng/blob/main/docs/portfolio-audit/2026-09-22T2003Z-product-board-cursor-note-filler-nochange.md

# Completion / gaps / cursor

- new actionable findings: 0
- new / updated / reopened issues: 0 / 0 / 0
- issue / PR comments: 0
- implementation authorization: 0
- runtime execution: 0
- product source/config writes: 0
- material external strategy signals retained: 3
- portfolio CLEAN: **not declared**
- runtime gaps unchanged: browser concurrency/deployed web, two-note batch fixture for #12, provider/Windows/Office/mobile/printing/accessibility paths remain unverified unless covered by existing evidence.
- next fair external-radar product cursor: **Reese-max/cyber-prep-coach**（`adng-memory` 保持 support/compatibility repo，不強造 product surface）。
