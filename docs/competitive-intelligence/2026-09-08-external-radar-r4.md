# 外部競品／新品／工作流靈感雷達 — 2026-09-08 r4

> Scope：Reese-max 擁有、未封存且可視為產品的 repositories。公開網路是本輪主要情報來源；GitHub repository / Issues / PR / recent commits 用於判斷產品 fit、重複、目前 implementation boundary 與安全優先序。社群來源一律標記 `COMMUNITY_SIGNAL`，不得當作市場統計或效果證明。

## Executive Summary

本輪找到 1 個達到正式立案門檻的新機會：

1. **neciken-summer-poem — 在正式投稿／contest export 前重新驗證官方規則，產生 Rule-Drift Receipt**（94/100，DIFFERENTIATOR）。現有產品已能發現比賽、保存官方來源、deadline / AI policy 與正式 contest profile，但真正投稿前仍需要人工重新打開官方頁逐欄比對。2026 年外部市場同時出現更強的 submission discovery 工具，以及更成熟的網頁 change-history 工作流；而官方競賽對 AI 的政策甚至可從「完全禁止」到「至少 50% prose 必須由 AI 生成」。因此 freshness / drift 不應只是 README 提醒，而應變成 formal readiness gate。

本輪也找到 2 個「保留研究、不立案」訊號：

- **MaterialYouNewTab**：Chrome `activeTab` 可在明確 user gesture 後暫時取得目前頁面的 URL / title / favicon，且不需要廣泛 host permission。這使「目前頁面 → Task / Scratchpad」比前輪評估更可行，但目前仍缺真人需求證據，維持 ADJACENT IDEA。
- **book5-windows-server-2022**：Windows Server 2022 即將在 2026-10-13 結束 Mainstream Support，而 Windows Server 2025 安全基線與 hotpatch 能力持續變動；但產品名稱已清楚標 2022，尚不足以證明需要立即做跨版本教材平台，因此只留 freshness research，不新增 Issue。

跨 Portfolio 新原則：**「來源曾被查核」不等於「正式執行當下仍有效」；所有外部規則型來源都應有 last-verified、content hash、normalized critical fields、drift classification 與 invalidation。**

---

## Product → Market Category Map

| Repository | 市場／產品角色 | 本輪 Opportunity Map |
|---|---|---|
| gemini-deidentifier | AI RPG / interactive fiction | DIFFERENTIATOR：world-state ledger 已立案；不再堆 storyteller agent |
| exam-archive | 考試資料／單檔 archive | SHOULD SIMPLIFY；避免與 practice 產品重疊 |
| police-exam-practice | 警察考試練習舊路徑 | DO NOT DUPLICATE；能力往 police-exam-archive 收斂 |
| police-exam-archive | 官方題庫＋練習 | DIFFERENTIATOR：Attempt Ledger / deadline-aware review 已立案 |
| 92-duty-scheduler | constraint scheduling | DIFFERENTIATOR：minimal-impact repair plans 已立案 |
| openab | Discord ↔ ACP coding-agent broker | MUST MATCH：human approval broker；Issues disabled，維持 write-blocked |
| UkePack | MusicXML → 教師／兒童教學包 | RESEARCH：workshop pack-set #3 已存在，不重複 |
| ppt-studio | AI presentation workstation | DIFFERENTIATOR：claim provenance #3 已存在 |
| book5-windows-server-2022 | Windows Server 2022 教學 deck | ADJACENT IDEA：version/source freshness；本輪不立案 |
| obsidian-vault | personal knowledge/content | DO NOT TURN INTO SaaS；保持 content-first |
| voice-actress | 申論評分／法律學習 | DIFFERENTIATOR：evidence-linked feedback #6 已存在 |
| taiwan-intel-dashboard | 暫停中的公共情報 dashboard | DO NOT EXPAND；先恢復 availability / canonical publish |
| autodev-ng | multi-agent software-delivery orchestrator | SHOULD BE BETTER：independent verification / receipts |
| flux-image-gen | AI image generation workspace | DIFFERENTIATOR：provenance / C2PA #18 已存在 |
| claude-mem | upstream memory fork | N/A standalone roadmap；優先 upstream sync 身分 |
| lobsterpulse | agent observability / hooks | MUST MATCH：OTel 已有 roadmap，不重複 |
| prompt-autoresearch | prompt optimizer / experiment runner | DIFFERENTIATOR：variance-aware promotion #3 已存在 |
| neciken-summer-poem | AI 長篇創作＋文學競賽工作流 | **DIFFERENTIATOR：Rule-Drift Receipt → NEW #3** |
| note-filler | evidence-grounded note completion | DIFFERENTIATOR：claim review queue 已存在 |
| gooaye | placeholder | N/A |
| lplrs-judicial-sync | judicial source synchronization | MUST MATCH：deletion / tombstone lifecycle 已有 Issue |
| adng-memory | operational agent memory | RESEARCH：activation / supersession / bitemporal lifecycle 已立案 |
| cyber-prep-coach | iPAS exam prep | DIFFERENTIATOR：mastery / next-best-study #4 已存在 |
| cf-ai-router | AI provider router | RESEARCH：provider reliability / Responses API 已有 Issues |
| avatar-vfo | AI avatar/chat | SHOULD VERIFY：auth/isolation/runtime before memory expansion |
| project-doctor-web | clinical teaching/research UI | DO NOT EXPAND agentic actions before safety/runtime gates |
| minideck | lightweight AI deck publishing | MUST MATCH：draft head vs published head #4 已存在 |
| chatgpt-dual-pipeline | internship-notes publishing pipeline | SHOULD SIMPLIFY：canonical publish/source-of-truth |
| internship-notes-sites-mirror | deployment/content mirror | N/A standalone product features |
| taichung-police-intel | police/public-sector intelligence monitor | DIFFERENTIATOR：role intelligence profile #12 已存在 |
| soundbox-offline | local-first offline music | DIFFERENTIATOR：LAN import #3；backup boundary 已補 |
| skill-foundry | agent Skill creation/certification | MUST MATCH：runtime compatibility manifest #1 |
| video-timeline-pipeline | video intelligence / knowledge workflow | DIFFERENTIATOR：Research Pack concept fits existing roadmap；不另開重複 Issue |
| ai-novel-workstation | long-running AI writing workstation | DIFFERENTIATOR：Context Manifest #2 已存在且已有 implementation PR |
| clinical-scribe-worker | clinical scribe evaluation worker | MUST MATCH：versioned validation pack #4 |
| MaterialYouNewTab | local-first browser new-tab productivity | ADJACENT IDEA：permission-minimal active-page capture；研究先行 |
| cf-mcp-server | MCP server | MUST MATCH：2026-07-28 protocol / SDK v2 migration #6 |
| tick-stock-panel | Taiwan market screen/backtest | RESEARCH：NL→deterministic StrategyDef #5；coverage trust 優先 |
| herdr-skills | multi-agent workflow Skills | SHOULD BE BETTER：portable compatibility / evidence，避免重造 orchestrator |
| ninax-line-hermes | LINE ↔ long-running AI/video workflow | MUST MATCH：message revision / stale-result gate #1 |

---

## External Signals

### A. 直接競品／同類新品：submission discovery 正在產品化

**CONFIRMED — Needle in the Haystack，2026-09 初新上線**

`Needle in the Haystack` 目前顯示約 **1,681** 個 open submissions / prompts / contests / events，能以 kind、genre、topic、free-to-submit 等條件篩選，並提供 browser-local saved items 與 CSV download。

- JTBD：讓作者不用人工追蹤大量 Substack / open call。
- 省步驟：把 discovery / filtering / deadline browsing 集中。
- Distribution：無帳號、browser-local save，低 onboarding friction。
- Business-model signal：目前輕量公開工具，說明「找到機會」本身已快速商品化。
- Limit：listing 仍不是官方規則真相；第三方摘要存在 freshness / extraction risk。
- Reese-max 吸收：`neciken-summer-poem` 不需再做更大的 aggregator，而應把優勢放在「選定 contest 後的 readiness / rule verification」。
- 不應照抄：不要把第三方 listing 當 authoritative rule source。

Source（2026-09-08 查核）：https://needleinthehaystack.pages.dev/

### B. 相鄰領域：change monitoring 正從「有變」進化到完整版本／差異歷史

**CONFIRMED — Visualping Timeline，2026-04-10**

Visualping 的新 Timeline 將完整監控歷史、change summaries、side-by-side screenshots、alert status 集中；2026 年 8 月更新的 help 也把 application dates、government/regulatory changes 列為典型監控場景。

- JTBD：不用自己記錄「上次看到什麼」，直接回看來源變更。
- 可靠性：before/after 比單一「變更了」通知更適合 audit。
- Automation：定期 fetch → detect → summarize → alert。
- Pricing signal：developer API / business plan 顯示 change-monitoring evidence 可被當成專業工作流基礎設施。
- Reese-max 吸收：只搬運 **versioned source hash + normalized rule diff + history receipt**。
- 不應照抄：不需要長期保存完整網頁 screenshot/history，也不需要建立通用網站監控 SaaS。

Sources：
- 2026-04-10：https://www.abnewswire.com/pressreleases/visualping-launches-new-timeline-view-giving-users-their-complete-monitoring-history-in-one-place_801400.html
- current help：https://help.visualping.io/en/articles/4438913

### C. 規則來源本身：AI policy 可能完全相反，且可修改

**CONFIRMED — The Protopian Prize 2026**

官方規則禁止全部或部分 generative LLM / AI 產生投稿文字，2026 submissions 開放 5/1–7/31。

Source：https://protopianprize.com/contest-rules

**CONFIRMED — The Prompty Awards 2026**

官方規則方向完全相反：作品需 wholly/substantially 由 AI 協助，規則寫明至少 50% final prose 由 AI 生成，並要求揭露 AI contribution；final submission deadline 為 2026-12-31。

Sources：
- https://promptyawards.com/rules/
- https://promptyawards.com/about/

**CONFIRMED — The People Next Door，2026-01-04**

AI policy 公告明確寫出 general rules 可能隨時 revision，要求以 Contest Guidelines 為最新資訊。

Source：https://www.peoplenextdoor.org/news-updates/jan-4-2026-ai-use-policy

**Product implication**：對 AI 創作產品，`AI_ALLOWED=true/false` 不是永久欄位，而是**帶來源版本與有效時間的規則事實**。

### D. 新技術造成的 adjacent possibility：Chrome activeTab

**CONFIRMED — Chrome Extensions activeTab**

Chrome `activeTab` 只在 explicit user gesture 後，暫時給 extension 目前 tab 的 host access；可取得 URL、title、favicon，權限會在 navigation/close 後撤銷，且不需要 `<all_urls>` 類廣泛 host permission。

- 產品可能性：`MaterialYouNewTab` 可以研究「右鍵／action → 把目前頁面存成 Task/Scratchpad link」。
- 目前 manifest 只有 optional `bookmarks` / `favicon` 與 Google optional host permission，因此低權限是可辨識的產品優勢。
- 決策：先研究，不建立 Issue；若未來要做，必須維持 explicit user gesture、temporary permission、no history/background scraping。

Source：https://developer.chrome.com/docs/extensions/reference/permissions-list

---

## New Releases / Recent Changes

| 日期 | 產品／來源 | 新變化 | Reese-max relevance |
|---|---|---|---|
| 2026-09 初 | Needle in the Haystack | 約 1,681 個 writing opportunities 的集中發現／篩選 | neciken：discovery 更商品化，差異化應往 verified readiness 移 |
| 2026-08 current | Visualping help | 將 application dates / government / regulatory change 明列為 monitoring 用途 | neciken / intel：來源 freshness 是正式工作流 |
| 2026-04-10 | Visualping | unlimited change Timeline + side-by-side history | 跨 portfolio：source drift receipt |
| 2026-01-04 | The People Next Door | 正式 AI policy，並提醒規則可 revision | neciken：AI-policy 必須版本化 |
| 2026 rules | Protopian Prize | 全面禁止 AI-generated contest prose | neciken：policy 可為 hard block |
| 2026 rules | Prompty Awards | 至少 50% final prose AI-generated | neciken：不能用單一「AI競賽」假設 |

---

## Community Pain Points

以下僅為 anecdotal evidence。

### 寫作者未必會主動回頭逐條讀規則

**COMMUNITY_SIGNAL — r/writing，2026-04-19**

一則 contest-related 問答中，留言者直接反問投稿者是否真的讀過 essay requirements，並貼出 word limit、footnote/bibliography 與 LLM-use 規則；另一留言則指出這類提問者常希望社群代做規則研究。這不能代表所有作者，但支持「規則存在 ≠ 使用者有正確讀到」。

Source：https://www.reddit.com/r/writing/comments/1sq017t/

### AI-writing contest 的規則常包含格式、版本與特殊 disclosure

**COMMUNITY_SIGNAL — r/WritingWithAI，2026-03-31**

社群比賽要求 400–3000 words、PDF、特定投稿 channel，且允許 deadline 前重送，最後版本才算。這顯示 readiness 不只有 deadline；submission format / last-version semantics 也會影響有效投稿。

Source：https://www.reddit.com/r/WritingWithAI/comments/1s8iioy/

### 投稿資訊透明度本身就是 friction

**COMMUNITY_SIGNAL — r/writingcontests，2026-03-05**

一則 contest post 的讀者首先追問沒有清楚揭露的 $15 entry fee；主辦者回覆是第一次辦比賽、仍在摸索。這類案例不是市場統計，但說明第三方 listing 或社群 post 的 fee / eligibility / rule completeness 不穩定，正式產品不應只信摘要。

Source：https://www.reddit.com/r/writingcontests/comments/1rllba2/

---

## Adjacent Ideas

### 1. Rule-Drift Receipt（本輪立案）

可重用 primitive：

`canonical source → fetch timestamp → content hash → normalized critical fields → deterministic diff → current/stale/ambiguous → receipt`

適用：
- `neciken-summer-poem`：deadline / AI policy / eligibility / format。
- `taichung-police-intel`：政府規則／政策頁 source drift。
- `lplrs-judicial-sync`：法規／判決來源 revision / deletion。
- `book5-windows-server-2022`：官方技術文件版本／lifecycle freshness（未立案）。
- `ppt-studio`：來源更新後 citation stale（既有 #3 可吸收）。

### 2. Permission-Minimal Capture

`MaterialYouNewTab` 不必取得 browsing history 或 `<all_urls>`；若真人需求成立，可只在 user click / context-menu 時用 `activeTab` 取得 URL/title/favicon，寫入既有 Task/Scratchpad。

### 3. Product aging badge / version boundary

對明確 versioned-learning product（例如 Windows Server 2022），比「自動升級所有教材到 2025」更安全的做法是：
- product/version target；
- official lifecycle；
- last-reviewed date；
- relevant successor differences；
- 不把新版內容混進舊版認證/課程敘述。

本輪只列 research list。

---

## Opportunity Map

### High-value actionable

| Opportunity | Classification | Repo | Opportunity Score | Action |
|---|---|---|---:|---|
| 投稿／export 前官方規則自動 revalidation + Rule-Drift Receipt | DIFFERENTIATOR | neciken-summer-poem | **94/100** | **NEW Issue #3 created** |

### Research / monitor

| Opportunity | Classification | Repo | Score | Decision |
|---|---|---|---:|---|
| current page → Task/Scratchpad via `activeTab` | ADJACENT IDEA | MaterialYouNewTab | 81/100 | Research only；先驗證需求／permission UX |
| Windows Server 2022 lifecycle / source freshness badge | SHOULD BE BETTER | book5-windows-server-2022 | 78/100 | No Issue；產品已明確標 2022，等待混淆證據 |
| contest-discovery aggregator expansion | MUST MATCH? | neciken-summer-poem | 68/100 | REJECT as roadmap priority；Needle 等工具已把 discovery 商品化 |

### Existing opportunity — do not duplicate

- UkePack workshop pack-set → existing #3.
- ppt-studio provenance → #3.
- cyber-prep adaptive learner model → #4.
- ai-novel Context Manifest → #2 / implementation PR.
- flux-image-gen provenance → #18.
- clinical-scribe validation packs → #4.
- adng-memory lifecycle → #4.
- prompt-autoresearch stability → #3.
- police-exam-archive Attempt Ledger → #60.
- voice-actress evidence-linked grading → #6.

---

## Top 10 Cross-Portfolio Ideas

1. **Source Freshness Contract** — 每個外部 rule/source 有 `last_verified_at + hash + canonical_url + schema_version`。
2. **Normalized Critical-Field Diff** — raw page changed 不等於 business rule changed；先 normalize 再判 criticality。
3. **Stale-by-Default on Uncertainty** — timeout / 429 / parse ambiguity 不能推論成 unchanged。
4. **Explicit Promotion** — 新來源／新規則先 candidate，不能 silent overwrite authoritative profile。
5. **Authoritative Head vs Working Head** — 延續 MiniDeck / memory / prompt promotion 的共同 primitive。
6. **Evidence Locator / Receipt** — 結論能回到來源位置／版本，而非只有 URL。
7. **Permission-Minimal Browser Integration** — explicit gesture + temporary scope 優於常駐 broad permission。
8. **Product-Version Boundary** — 教材／工具明確標 target version，不把 successor knowledge 無聲混入。
9. **Third-party discovery ≠ source of truth** — aggregator 只做 discovery，final eligibility 必須回官方來源。
10. **Deletion / Supersession Propagation** — source 被更新／刪除後，derived recommendation / profile / artifact 要能變 stale。

---

## Ideas Rejected

### REJECT — 把 neciken 變成更大的 contest aggregator

理由：Needle in the Haystack 等新工具正在快速降低 discovery 成本；Reese-max 更有產品 fit 的差異化是「作品已產生後，正式投稿前能否證明現在仍符合規則」。

### REJECT — 自動登入／代投稿／自動付費

理由：增加 credential、付款、第三方 Terms 與不可逆副作用，且不是目前最大 manual pain。MVP 只產生 verified readiness / export receipt。

### REJECT — MaterialYouNewTab 取得 browsing history / `<all_urls>`

理由：與 local-first / low-permission identity 衝突。若研究 quick capture，只接受 explicit user gesture + `activeTab` 類最小能力。

### DEFER — 把 book5 Windows Server 2022 全面升級成 2025

理由：2022 仍是明確產品 target，而且尚未證明學習者需要跨版本遷移。先保留 version/freshness signal；若未來建立 2025 版，應做明確新 track，而不是混改現有教材。

---

## Issue Mapping

### Created this run

- `Reese-max/neciken-summer-poem #3`
  - Title: `[Competitive Inspiration][DIFFERENTIATOR] 在投稿／export 前自動重新驗證官方徵件規則與 Rule-Drift Receipt`
  - Stable fingerprint: `promoted contest profile + official source snapshot + later formal export/submission + manual reopen/compare + no automatic freshness/drift receipt`
  - Duplicate checks: open Issues = none；closed Issues = none；PR = none for same fingerprint.
  - Runtime verification required: synthetic mutable HTML/PDF + limited public official contest pages; redirect / timeout / AI-policy flip / deadline drift / normalized no-op change / explicit promote / offline path.

### Not created

- MaterialYouNewTab quick capture：no strong user-demand evidence；research list only.
- book5-windows-server-2022 freshness/version badge：market transition is real but current product scope is truthful; no duplicate-free high-pain gap yet.
- UkePack workshop workflow：existing #3 already covers.

---

## Sources

### Official / primary

- Chrome Extensions Permissions — `activeTab`: https://developer.chrome.com/docs/extensions/reference/permissions-list
- The Protopian Prize rules: https://protopianprize.com/contest-rules
- The Prompty Awards rules: https://promptyawards.com/rules/
- The Prompty Awards dates/about: https://promptyawards.com/about/
- The People Next Door AI Use Policy (2026-01-04): https://www.peoplenextdoor.org/news-updates/jan-4-2026-ai-use-policy
- Needle in the Haystack: https://needleinthehaystack.pages.dev/
- Visualping current help: https://help.visualping.io/en/articles/4438913

### Product / market corroboration

- Visualping Timeline announcement (2026-04-10): https://www.abnewswire.com/pressreleases/visualping-launches-new-timeline-view-giving-users-their-complete-monitoring-history-in-one-place_801400.html
- Duotrope Protopian listing / freshness disclaimer: https://duotrope.com/contest/the-protopian-prize-40398

### Community signals — anecdotal only

- r/writing contest requirement discussion (2026-04-19): https://www.reddit.com/r/writing/comments/1sq017t/
- r/WritingWithAI competition rules (2026-03-31): https://www.reddit.com/r/WritingWithAI/comments/1s8iioy/
- r/writingcontests fee disclosure discussion (2026-03-05): https://www.reddit.com/r/writingcontests/comments/1rllba2/

---

## What Changed Since Last Radar

1. **新增 `neciken-summer-poem #3`**：上一輪 Portfolio 共通原則是「AI feedback 要連到真實 evidence」；本輪將 lifecycle 再往前推成 **evidence 有效期限 / rule drift**。
2. `neciken-summer-poem` 的 contest-discovery 能力不再只視為 discovery feature，而明確拆成兩層：
   - discovery：第三方／Codex 幫忙找到可能機會；
   - authoritative readiness：正式投稿前重新確認官方 current rules。
3. `MaterialYouNewTab` 的 quick-capture 可行性上升：`activeTab` 證明可以不用 broad host permission；但因缺真人需求證據，仍不立案。
4. `book5-windows-server-2022` 因 2022 lifecycle 接近 Mainstream Support 結束，被升級到 freshness research list，但沒有足夠理由把 2025 功能塞入現有教材。
5. 本輪沒有為已在 implementation/PR 中的舊機會再開功能票，避免競品雷達變成 feature churn。

## Confidence / Evidence Boundary

- `CONFIRMED` 只用於 repository code / official docs / directly observed product behavior or published product page。
- `COMMUNITY_SIGNAL` 只代表 anecdotal friction。
- Opportunity Score 是 prioritization heuristic，不是市場預測或 ROI estimate。
- 本輪沒有修改產品原始碼、沒有建立實作 branch、沒有 merge / deploy、沒有變更 secrets / permissions / repository settings。
