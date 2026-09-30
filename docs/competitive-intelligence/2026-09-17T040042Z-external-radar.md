# 外部競品／新品／工作流靈感雷達 — 2026-09-17T04:00:42Z

## Scope / rules / evidence boundary

- Owner scope：只處理 `Reese-max` 自有 repository；未操作第三方 repository。
- Issue Quality：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- Quality-rule blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- 本輪重新完整分頁列舉 connected owner inventory：connector 回傳 **39 owned repositories；38 unarchived**；第二頁為空。與較早歷史紀錄 42/39 不一致，記為 **inventory/access drift**，不推論缺少 repository 已刪除或不存在。
- 上一輪 `2026-09-17T020004Z-external-radar.md` 指定 fair-rotation target 為 **`note-filler`**；本輪完成該 target。下一個 cursor：**`lplrs-judicial-sync`**。
- `note-filler` default branch：`main@9b579adb0391f9a96f620f2d58d4a7f0e420c4df`；此 HEAD 為 audit docs，最近 product-code baseline 仍為 `935b00113662942f9d700444de42d445ee6c8cea`。
- Owner/product contract re-read：`pyproject.toml` 定位仍是「法律/行政/考試筆記自動補齊；研究層用 Grok；原稿不可變；無來源不進正文」。未找到獨立 owner roadmap/product-board 文件，因此不把競品方向當作 scope 授權。
- Current active ownership：#3 有 open PR #7；#1/#4 有 open PR #8，另有重疊中的 PR #2/#5/#6。PR #7 目前仍有 3 個 unresolved review threads（document scope、edited accepted revision、validation-contract version），不搶改 active scope。
- Research #9 已在本輪前由另一 research experiment 留下 `NARROW` 決策：已執行 source-equivalent probe 證明 local snapshot 年齡會被 query-day `fetched_date` 遮蔽，但尚未直接讀取 SQLite 中刑法第 80 條真實 row，因此不支持自動同步/citator/always-online 架構。其研究 lock 已超過 lease 時間；本輪仍不修改 #9，因沒有新的 repo/runtime 證據需要改寫決策。
- 本輪沒有真實 Grok/provider call、production canary、法規 DB binary row extraction、Harvey/Lexis runtime trial 或正式資料寫入。
- 本輪：**0 new Issues；0 existing Issue modifications；0 PR comments；0 implementation authorization**。
- 未修改產品 source、CI/config、secrets、permissions/settings；未建 implementation branch、未 merge/deploy、未啟動 worker/GOAL、未新增付費承諾。
- 本輪不宣告 portfolio CLEAN。

## Product → Market Category

`note-filler` 本輪對照市場：

1. **Legal AI research / drafting / review**：Harvey、Lexis+ with Protégé、CoCounsel 類 authoritative legal workflows。
2. **Human verification + revision history**：claim/assertion review、suggestion history、accepted/rejected revision lineage。
3. **Authoritative source freshness**：最新 jurisdictional content、citation/status verification、source update semantics。
4. **Adjacent memory / personalization**：跨 session drafting preference memory；評估哪些可移植、哪些不應進 authority/evidence path。

## Executive decision

**0 new Issues；0 existing Issues modified。**

本輪最大的外部變化是 Harvey 在 **2026-09-16**發布的 September 2026 bundle，把以下能力放在同一法律工作流：

- user-level memory；
- agentic Vault search，答案回到具體來源頁面；
- guided review-table creation / agent actions；
- multi-source query；
- 大量新增 authoritative legal research sources；
- Word 中的 alternate suggestions 與 `Apply Suggestions From History`。

這是一個明確的市場策略訊號：法律 AI 的競爭重點已不是「一次生成更多文字」，而是 **authoritative-source coverage + 可回到證據的 review surface + 可延續的 revision/history workflow + 適度個人化**。

但對 `note-filler` 沒有形成新 fingerprint：

- revision / human decision history 已由 #3 / PR #7 追蹤；
- source currentness 已由 #9 追蹤，且最新實驗只支持 NARROW；
- current repo 已有 multi-source `cross_validate()` 與 conflict marking；
- user-level memory 若影響 evidence/source/verification gate，反而會破壞「來源決定可信度、不是偏好決定可信度」的產品契約。

因此本輪應 **保留方向、不要擴建**。

---

# External Signals

## A. Direct competitor — Harvey September 2026 workflow bundle

**CONFIRMED — Harvey first-party；published 2026-09-16；checked 2026-09-17.**

Sources:
- https://www.harvey.ai/blog/the-brief-september-2026
- https://help.harvey.ai/release-notes

### Current capabilities / dates

Harvey first-party release notes list：

- **2026-09-09** `User-Level Memory`：記住 drafting style、negotiating posture、jurisdiction 等偏好並在後續 session 使用；
- **2026-09-09** guided Review Table creation；
- **2026-09-02** 130+ new legal research sources；
- **2026-09-02** `Apply Suggestions From History` in Word；
- **2026-08-26** Agentic Vault Search；
- **2026-08-19** Review Table Agent Actions、Alternate Suggestions、Enhanced Multi-Source Queries；
- **2026-08-05** Multi-Source Query on Mobile。

Harvey 9/16 overview 進一步把這些能力包裝成：跨資料來源 research、document review、history continuation、enterprise knowledge integration 與 personalization。

### User job / reduced manual work

最值得移植的不是 feature count，而是兩個 workflow：

1. **重新打開歷史工作，不必重新比對「我上次看過/拒絕/略過哪個建議」**；
2. **在 review surface 直接回到具體來源，不必在 output、來源文件、另一張人工清單間反覆切換**。

這正是 #3 想解的 claim-level human review / decision history，但 PR #7 已 active，且 review threads 已指出 ledger key、edited revision persistence、validation-contract version 三個具體問題。本輪不另開「Harvey history」Issue，也不把競品 UX 壓進 active implementation scope。

### What not to copy

- 不讓 `User-Level Memory` 改變法規 currentness、source level、grounding 或 conflict 判定；
- 不建 data-room / Vault、review-table platform、Word add-in 或 enterprise DMS integration；
- 不因 Harvey 增加 130+ sources 就追求 source-count KPI；`note-filler` 的核心是 source appropriateness / provenance / currentness，不是來源數量。

Decision：**SHOULD BE BETTER principle already represented by #3；DEDUPE + SKIPPED_LOCKED_ACTIVE_PR#7**。

## B. Direct / adjacent competitor — LexisNexis 把 authoritative legal insight 嵌進既有 claims workflow

**CONFIRMED — LexisNexis first-party；2026-09-01；checked 2026-09-17.**

Source:
- https://www.lexisnexis.com/community/pressroom/b/news/posts/lexisnexis-and-evenup-announce-strategic-alliance-bringing-trusted-legal-ai-to-personal-injury-professionals

LexisNexis + EvenUp 的訊號不是「多一個 AI」，而是把 citation-backed legal insight 帶進使用者原本的 claims workflow，減少 claims analysis → legal research → case strategy → document preparation 之間跨 app 的切換。

### Transferable pattern

`note-filler` 可保留的原則只有：**evidence review 應盡量靠近使用者決定是否採納 supplement 的地方**。這與 #3 的 claim review card / accepted-only export 相符。

### Do not over-transfer

- 不做 personal-injury claims intelligence；
- 不新增付費法律資料 provider；
- 不把第三方 citation-backed marketing claim 當成本產品 runtime correctness 證據。

Decision：**DIFFERENTIATOR / workflow confirmation；no Issue**。

## C. Direct competitor strategy — Lexis+ with Protégé guided Skills

**CONFIRMED — LexisNexis first-party；Singapore launch 2026-09-04；checked 2026-09-17.**

Source:
- https://www.lexisnexis.com/blogs/sg-lnlp/b/press-room/posts/lexisnexis-launches-skills-in-lexis-with-protege-in-singapore

LexisNexis 將 guided Skills 定位為 complex legal work 的可重用流程，grounded in authoritative Lexis content、user-uploaded files 與 web sources，並把 current authoritative content、verification、confidentiality/governance 視為法律 AI 與一般生成式工具的差別。

對 `note-filler` 的可移植點是**流程限制與驗證可以被明確包成可重複 contract**，不是「再做一個 skill framework」。目前產品已有固定 pipeline、source levels、cross validation、immutable original，因此沒有新架構缺口。

Decision：**MUST PRESERVE current contract；DO NOT COPY framework breadth**。

## D. Current-source freshness signal — latest jurisdictional information is an explicit competitive axis

**CONFIRMED as vendor product claim, not independent effectiveness measurement.**

Sources:
- https://help.harvey.ai/release-notes/category/knowledge
- https://www.lexisnexis.com/en-us/products/lexis-plus-protege.page

Harvey 2026-09-02 release notes explicitly describes expanding legal sources to provide the latest relevant jurisdictional information；Lexis positions Shepard’s Verify/Citation Service around citation validity/status/treatment.

這些只強化 #9 的產品重要性，**不改變 #9 的研究結論**：source freshness/currentness 重要，但目前 repository evidence 只證明 local snapshot provenance date 被 query date 遮蔽，尚未證明真實 DB row 已錯。因此仍不批准 sync daemon / citator / always-online lookup。

Decision：**#9 NARROW preserved / no Issue update needed**。

# Community Pain

本輪沒有新的 community-only signal 通過保留門檻。沒有以單一 Reddit/論壇個案推估法律 AI 的普遍錯誤率，也沒有用 vendor benchmark 當 `note-filler` 成效數字。

# Adjacent Ideas

1. **Review history should preserve the exact reviewed revision**：Harvey 的 history continuation 強化「歷史建議應可安全重開」的 UX signal；但 PR #7 review 已更具體指出 `EDITED_ACCEPTED` 缺 durable edited revision，故不是新 issue。
2. **Preference memory must be lower authority than evidence policy**：可將個人偏好用於呈現/格式（未來若真有需求），但 source/currentness/verification 必須由 evidence contract 決定。
3. **Latest-source coverage is a quality dimension, not a source-count race**：對 `note-filler` 應先把 snapshot/query/revision/effective date 語意說對，再討論擴來源。

沒有足夠跨兩個 Reese-max repo 的新實證，因此不升級成 portfolio-wide framework。

# Opportunity Map

| Category | Signal | Decision |
|---|---|---|
| MUST MATCH | 法律 evidence/currentness 不可由 query-day 或個人偏好冒充 | Existing #9 NARROW；不擴建 |
| SHOULD BE BETTER | 歷史 review 必須能重開且精確指向被核准 revision / evidence contract | Existing #3 + active PR #7 review findings；不另開 |
| DIFFERENTIATOR | immutable original + source-bound supplement + explicit conflict + human adoption gate | Preserve |
| ADJACENT IDEA | guided review flow / filterable queue；presentation-only user preferences | 待 #3 真實 usability/runtime 證據後再評估 |
| DO NOT COPY | legal preference memory into authority gate、Vault/data-room platform、DMS/Word integration、source-count expansion、citator clone | 無證據／超範圍 |

# Four-gate assessment of candidate signals

## Candidate 1 — “Add Harvey-style cross-session legal memory”

1. **Problem/value**：沒有 current user evidence 顯示使用者反覆重輸 drafting style 是 `note-filler` 的核心人工斷點。
2. **Priority**：`NOT_ESTABLISHED`；偏好記憶不是法律可信度證據。
3. **Smallest option**：若未來真有需求，文件/format preset 已比 persistent memory 更小。
4. **Research/implementation separation**：目前連 research Issue 都不通過；保留中央 idea 即可。

**Decision：REJECT FOR NOW / DO NOT COPY。**

## Candidate 2 — “Build legal-source expansion / always-online sync because competitors add sources”

1. **Problem/value**：#9 已證明 provenance semantic gap，但未證明 current DB content mismatch。
2. **Priority**：研究仍 `NOT_ESTABLISHED`；不能因競品強調 latest sources 升成 P1/P2。
3. **Smallest option**：先修 snapshot/query date semantic；若真實 row mismatch 再評估 bounded refresh/currentness gate。
4. **Research separation**：#9 已 NARROW；BUILD 不自動批准。

**Decision：DEDUPE #9 / NARROW。**

## Candidate 3 — “Add suggestion/review history workflow”

1. **Problem/value**：現有 #3 已定義 claim review state/history，且 PR #7 active。
2. **Priority**：現有 review findings 比競品 feature 更直接：document scope、edited revision persistence、validation-contract version。
3. **Smallest option**：先修正 PR #7 的資料 contract，無需新增 review-table platform。
4. **Research separation**：Harvey signal 是 workflow reference，不是 implementation authorization。

**Decision：DEDUPE + SKIPPED_LOCKED_ACTIVE_PR#7。**

# Rejected Ideas

- **Legal-wide user memory / preference engine**：沒有核心痛點證據，且若滲入 authority gate 反而危險。
- **Harvey-style Vault / data room**：產品規模與工作不匹配。
- **Lexis/Harvey source-count expansion**：來源多不等於 authoritative/current；先完成 #9 的薄 provenance correction decision。
- **Shepard’s/KeyCite clone**：超出產品定位與資料授權/維護能力。
- **Word/DMS/claims integration**：沒有 owner direction / current user workflow evidence。
- **新 review-table database/service**：#3 可以重用現有 argument/evidence model，PR #7 已在設計；不另造平台。

# Issue Mapping

| Fingerprint / signal | Existing tracker | Action |
|---|---|---|
| local Level-A snapshot age hidden by query-day `fetched_date` | #9 | Research now NARROW；本輪不更新 |
| claim-level review + persisted decision/re-review | #3 / PR #7 | Harvey history signal overlaps；`SKIPPED_LOCKED` |
| document scope / exact edited accepted revision / validation contract version | PR #7 unresolved review threads | Stronger repo evidence already exists；no new Issue |
| cross-client export authority | #4 / PR #8 (+ older PR #5) | Unrelated to external signals；no scope change |
| root README / real dry-run contract | #1 / PR #8, PR #6, PR #2 | Unrelated；no scope change |

No new fingerprint passed all four gates.

# What Changed

Compared with the prior `note-filler` radar:

1. **Research #9 acquired real experiment evidence and chose NARROW**：false-freshness semantics are confirmed, but real SQLite Article 80 content mismatch remains UNKNOWN.
2. **Harvey published a fresh 2026-09-16 legal-workflow bundle** showing market convergence around review history, authoritative source breadth, multi-source research and carefully scoped personalization.
3. The external signal **strengthens existing #3/#9 directions but does not justify broader architecture**.
4. No Issue creation/update was warranted because the strongest actionable areas already have active ownership or existing research, and the new vendor evidence does not change severity/implementation authorization.

# Sources

Checked 2026-09-17 unless noted.

1. Harvey — The Brief: September 2026, published 2026-09-16  
   https://www.harvey.ai/blog/the-brief-september-2026
2. Harvey — Release Notes (feature-specific dates)  
   https://help.harvey.ai/release-notes
3. Harvey — Knowledge release notes  
   https://help.harvey.ai/release-notes/category/knowledge
4. LexisNexis + EvenUp strategic alliance, 2026-09-01  
   https://www.lexisnexis.com/community/pressroom/b/news/posts/lexisnexis-and-evenup-announce-strategic-alliance-bringing-trusted-legal-ai-to-personal-injury-professionals
5. LexisNexis — Skills in Lexis+ with Protégé Singapore, 2026-09-04  
   https://www.lexisnexis.com/blogs/sg-lnlp/b/press-room/posts/lexisnexis-launches-skills-in-lexis-with-protege-in-singapore
6. Lexis+ with Protégé current product page / Shepard’s verification  
   https://www.lexisnexis.com/en-us/products/lexis-plus-protege.page
7. Taiwan MOJ current legal database / official Article 80 links already captured by Research #9  
   https://mojlaw.moj.gov.tw/LawContent.aspx?LSID=FL001424&TypeSort=2&lawNumber=80  
   https://mojlaw.moj.gov.tw/LawContentExtent.aspx?LawNo=80&lsid=FL001424

# Completion / gaps / cursor

- Completed current fair target：`note-filler`。
- External web was the primary competitive intelligence source; GitHub was used to bind signals to current repo state, dedupe and respect active ownership.
- No runtime/provider trial was needed to decide this round because all candidate additions failed the new-fingerprint / smallest-fix / evidence gates or were already actively tracked.
- Remaining #9 content question：**actual SQLite Article 80 row mismatch is still UNKNOWN** until the binary row is directly inspected in an authorized isolated experiment; this is not performed by this radar.
- Report-only write; no product mutation.
- Next fair-rotation cursor：**`lplrs-judicial-sync`**。
