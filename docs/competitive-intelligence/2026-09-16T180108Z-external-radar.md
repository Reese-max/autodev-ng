# 外部競品／新品／工作流靈感雷達 — 2026-09-16T18:01:08Z

## Scope / rules / evidence boundary

- Owner scope：只處理 `Reese-max` 自有 repositories；未操作第三方 repository。
- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- 本輪重新完整分頁列舉 owner repositories：**42 owned、39 unarchived**；第 2 頁為空。Archived 仍為 `gemini-deidentifier`、`obsidian-vault`、`openab`。工作分類沿用已校準的 36 product-like + 3 support/compatibility-only，但總數來自本輪 fresh pagination，而非舊 inventory。
- 上一輪外部雷達 cursor：`cyber-prep-coach`；本輪完成 `exam-archive`；下一個公平 cold-rotation cursor：**`flux-image-gen`**。
- Target repo：`Reese-max/exam-archive main@5d74726eed8f507bb9527aff2047945c6de10d79`。目前 HEAD 是 audit-only commit，未發現更新的 default-branch product commit。
- 本輪只做 GitHub read、公開網路研究與中央 radar report 寫入；**0 新 Issue、0 Issue 修改、0 implementation authorization**。未修改產品 code、CI/config、secrets、permissions/settings、branches，未 merge/deploy、未啟動 worker/GOAL、未付費或寫入 production data。
- 沒有執行 `exam-archive` 真實瀏覽器／輔助科技走查；使用者可見影響若涉及 runtime 仍標 `NEEDS_RUNTIME_VERIFICATION`。不宣告 portfolio CLEAN。

## Owner direction / current coordination

Owner-approved product-board direction仍為 **SIMPLIFY / MAINTAIN**：先完成既有可到達缺陷與 canonical ownership 決策，再考慮新學習功能。

Current tracked scopes：

- Issue #1：monolithic archive / repository contract / canonical relationship。PR #2（root README contract）與 PR #5（payload budget gate）目前都仍 **open**，而 #1 既有 comment 明確記錄為 partial；其 acceptance 已包含「若 repo 已被其他產品取代，改成 redirect/archive notice，而不是維護第二份 source of truth」。
- Issue #3：practice answer keyboard / assistive-tech operability。PR #4 目前 **open**；branch `devin/issue-3-a11y` 仍 active，且尚缺實際 browser/AT smoke，既有 review 亦指出 radio-group selected-state semantics / repeated live-region announcement 等問題。
- Branch pagination read：`claude/fix-project-issues-2vEIn`、`devin/issue-3-a11y`、`devin-cli/issue-1-payload-budget`、`docs/issue-1-root-readme`、`main`；第二頁為空。

因此本輪不搶改 #1/#3 scope，不替 active PR 加需求，也不取得 Issue lock。新外部 evidence 只在中央報告保留。

## Executive decision

**不建立新 Issue。** 本輪真正的新訊號不是「exam-archive 需要再做一條 115 年 ingestion pipeline」，而是相反：

1. 考選部第一方已完成 115 年警察特考考試週期，官方考試頁明列考試日期為 **2026-06-13～2026-06-15**，並提供「歷年考畢試題查詢（含測驗題答案）」入口。
2. 外部題庫／補教工作流已將 115 年內容放到使用者面前；例如阿摩目前直接列出 **115 年三等警察資訊管理人員「警政資訊管理與應用」4 題申論**，以及同類組的數位鑑識執法、電腦犯罪偵查等 115 年試卷；高見的警察考古題頁也標示部分警察考試 archive 已收錄至 115 年並記錄 2026-09-08 的來源核對。
3. 但 `exam-archive` repository metadata 至今仍自我描述為「警察特考三等資管組考古題總覽（105-114年）」。
4. 同一 owner 的 `police-exam-archive` 已經有更完整且更新的官方資料資產：README 明列 **106–115 年、49 類別、101 科目、42,518 題**，並明示 115 年三等資料已由考選部考畢試題平台匯入，包含 13 類科、90 科次、官方標準答案／更正答案；其中也包含三等「資訊管理學系」。

所以目前最小、安全、符合 owner 方向的決策不是把 115 年再複製進 `exam-archive`，而是沿用 **Issue #1 的 canonical relationship 決策**：先決定 `exam-archive` 是否仍有獨立產品價值；若保留，優先研究成為共享／重用既有 structured corpus 的薄 specialist surface；若沒有，就以 redirect/archive notice 收斂第二份 truth。

這是 **DEDUPE + SKIPPED_LOCKED_ACTIVE_PR**，不是新的功能缺口。

## External Signals

### A. Direct authority — 115 年警察特考已是現行可查考試週期

**CONFIRMED — 考選部第一方；checked 2026-09-17。**

Source：
- https://wwwc.moex.gov.tw/main/exam/wFrmExamDetail.aspx?c=115060

官方頁明列：
- 報名：115/3/10～3/19；
- 考試：115/6/13～6/15；
- 預定榜示：115/8/14；
- 頁面更新日期：115/07/30；
- 並直接提供「歷年考畢試題查詢（含測驗題答案）」入口。

**User job:** 準備警察特考三等資訊管理時，在一個可辨識的 authoritative archive 中找到「最新已考完年度」而不用先猜這個站是否只停在 114 年，再跳到考選部／其他題庫手動比對。

**Concrete friction:** `exam-archive 105–114 → 使用者發現缺 115 → 離站搜尋／比對`。但這個 friction 不代表需要再複製一份 115 corpus；若 sibling 已經是較新的 source of truth，重用或 redirect 可能更小。

### B. Direct market / alternative workflow — secondary archives 已把 115 年題目直接放進搜尋／練習入口

**COMMUNITY_SIGNAL / secondary distribution signal；不是 authority。**

Sources checked 2026-09-17：
- https://yamol.tw/cat-%E8%AD%A6%E6%94%BF%E8%B3%87%E8%A8%8A%E7%AE%A1%E7%90%86%E8%88%87%E6%87%89%E7%94%A8-1858.htm
- https://yamol.tw/exam-%E7%84%A1%E5%B9%B4%E5%BA%A6%2B%2B115%2B%E8%AD%A6%E5%AF%9F%E7%89%B9%E7%A8%AE%E8%80%83%E8%A9%A6_%E4%B8%89%E7%AD%89_%E8%AD%A6%E5%AF%9F%E8%B3%87%E8%A8%8A%E7%AE%A1%E7%90%86%E4%BA%BA%E5%93%A1%EF%BC%9A%E8%AD%A6%E6%94%BF%E8%B3%87%E8%A8%8A%E7%AE%A1%E7%90%86%E8%88%87%E6%87%89%E7%94%A8140-140754.htm
- https://www.kaozen.taipei/police-exam-past-papers/

Observable patterns：
- 阿摩的「警政資訊管理與應用」列表已把 115 年放在 114 年之前；115 卷標為 4 題非選擇題。
- 阿摩同一批 115 年最新資料也可見警察資訊管理人員的「數位鑑識執法」「電腦犯罪偵查」。
- 高見把「已收錄至 115 年」與「來源核對日期」直接呈現在 archive 頁面；這是 freshness communication pattern，不是答案真值證據。

**Transferable pattern:** 題庫產品的「最新覆蓋年度」是使用者可見狀態，不應只能靠閱讀巨大資料檔推斷。

**Do not copy:** 社群／補教整理頁不能取代考選部 authority，也不能因其更新快就直接複製題目、解答、SEO 結構或建立另一套 scraper。

### C. Adjacent architecture signal — presentation surface 不必擁有第二份 corpus

**CONFIRMED for Reese-max repository state；external product effectiveness UNKNOWN。**

`police-exam-archive` 已具備 106–115 年 structured JSON、下載／解析／audit pipeline、SQLite query API、官方來源與 115 import report。這使 `exam-archive` 的問題從「缺 115 ingestion 能力」重新校準成「這個 specialist surface 是否應重複擁有資料，還是重用已有 authority」。

這不是建立 shared data platform 的理由。最小選項順序仍是：redirect/archive → 文件化 canonical boundary → 既有 corpus 的薄讀取／產製 → 最後才考慮任何新 ingestion architecture。

## New Releases / Current Changes

| Date | Source | Change | Product implication |
|---|---|---|---|
| 2026-06-13～06-15 | 考選部 | 115 年警察人員等特種考試舉行 | `105–114` specialist description 已不是最新已考年度 |
| 2026-07-30 | 考選部 | 115060 exam detail page current update date | First-party current-state check remains available |
| current check | 阿摩 | 115 年三等警察資訊管理：警政資訊管理與應用／數位鑑識執法／電腦犯罪偵查已可見 | Secondary alternatives remove “wait for latest year” friction；not authority |
| 2026-09-08 source check | 高見 | 部分 115 警察考古題頁記錄來源核對日期 | Visible freshness/provenance is a market workflow signal |

## Community Pain / Market Signal

本輪沒有真人使用資料證明 `exam-archive` 使用者正在因缺 115 大量流失，因此不宣稱發生率、完成率或 ROI。

可觀察事實只有：
- repo 對外描述仍是 105–114；
- 第一方 115 年考試已完成；
- secondary archive 已提供 115 年資訊管理相關試卷；
- owner 自己已有另一個 106–115、結構化且具官方來源流程的 sibling corpus。

所以這是 **canonical ownership / freshness communication 的決策證據**，不是已證實的新 P1/P2 產品缺陷。

## Adjacent Ideas

1. **Thin specialist view over existing corpus**：若 `exam-archive` 的單頁瀏覽／快速練習確實有獨立價值，可在 #1 ownership 清除後驗證能否由 `police-exam-archive` 的 structured data 產製，而不是手工維護第二份題目內容。
2. **Redirect/archive notice**：若 sibling 已完全覆蓋核心工作，這比大型 monolith refactor 更小，也正是 #1 已允許的 acceptance branch。
3. **Visible coverage receipt**：任何保留的 archive 應明確顯示「覆蓋到哪一年／來源 authority／更新時間」。先用現有 README/static UI 足以驗證，不需要 registry/database。

## Opportunity Map — exam-archive

### MUST MATCH
- 不把 `105–114` 表述成現行完整 archive，如果產品仍以「考古題總覽」對外存在。
- 題目／答案 authority 以考選部為準；secondary copies 只作市場／分發訊號。
- 不維護兩套彼此漂移、都自稱 canonical 的 Reese-max 警察特考 corpus。
- #3 的 keyboard/AT core practice defect 先由 active PR 完成，不以新功能繞過。

### SHOULD BE BETTER
- 讓 latest covered year / source-of-truth relationship 可直接看懂。
- 若保留 specialist UI，優先重用既有 structured corpus／產製流程，而不是人工更新巨大 `index.html`。
- #1 在 ownership 清除後應用「redirect 是否已足夠」重新檢查剩餘 monolith refactor 是否仍值得做。

### DIFFERENTIATOR
- 若 specialist surface 有保留價值，差異應是「三等資訊管理快速查找／練習 + 官方來源可追溯」，而不是再擴成通用 LMS。

### ADJACENT IDEA
- Shared read/生成 path 僅在確認 `exam-archive` 必須繼續存在後才研究；不先建 shared framework。

### DO NOT COPY
- AI tutor、social feed、leaderboard、forced account/cloud sync。
- 第二套 115 crawler/downloader/parser。
- 直接把阿摩／補教解答當 authority。
- 為了解決 file-count smell 就建立 database/service/framework。

## Four-gate decision — 「直接替 exam-archive 加 115」

### 1. Problem / value
- **Target user:** 三等警察資訊管理考生，想從 specialist archive 找最新考古題。
- **Observable gap:** repo description 仍 105–114，而 115 年第一方考試已完成。
- **Existing alternative:** owner 已有 `police-exam-archive` 106–115 structured official corpus；使用者亦可直接回考選部查詢。
- **If unchanged:** specialist surface 的 freshness 語意可能誤導／迫使用者人工確認；但目前沒有真人 impact measure。
- **Contrary evidence:** `exam-archive` 可能本來就是 frozen specialist snapshot；在 canonical relationship 尚未定義前，缺 115 不能直接等同 defect。

### 2. Priority

```yaml
candidate_kind: MAINTENANCE_OR_OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
evidence: SOURCE_CONFIRMED_FOR_FRESHNESS_MISMATCH
triage: DEDUPE_TO_EXISTING_ISSUE_1
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION_FOR_USER_IMPACT
```

不升 P1/P2：外部競品已有 115、缺 runtime/user data、或年份落後本身都不足以證明重大核心任務失敗。

### 3. Smallest safe path
1. **不新增資料**，先完成 canonical relationship 決策。
2. 若 repo 不再需要：**redirect/archive notice**。
3. 若仍需要：文件化 source contract，驗證從 sibling structured corpus 產製／讀取的薄路徑。
4. 只有上述較小方案證明不足時，才考慮獨立 ingestion；目前沒有證據支持。

### 4. Research / implementation separation

不建立 Research Issue，原因是核心 fingerprint 已由 #1 持有：`exam-archive canonical status / source-of-truth / monolithic data shell`，且 PR #2/#5 正在 active ownership。換成「115 freshness」名稱另開單會把同一根因拆成平行架構工作。

若 active ownership 結束後仍要決策，最小問題是：「在不複製 corpus 的前提下，redirect 還是 thin reuse 哪一個能完成 specialist user job？」答案 BUILD/NARROW/REJECT 只支持下一步決策，不授權實作。

## Cross-portfolio idea

**Presentation surface ≠ data authority。** 當 owner 已有一個更新、更可追溯的 canonical corpus，舊的 specialist surface 出現 freshness gap 時，先問能否刪除、redirect、重用或產製；不要把每個 UI 都升級成獨立 ingestion owner。

這只是 reusable decision rule；本輪沒有建立跨 repo framework / umbrella Issue。

## Rejected Ideas

| Idea | Decision | Reason |
|---|---|---|
| 直接把 115 題目再塞進 monolithic `index.html` | DEFER / DEDUPE | canonical 關係未定；可能擴大第二份 truth |
| 建新的 115 crawler / scheduler / DB | REJECT | sibling 已有 download/parse/audit corpus；目前無獨立價值證據 |
| 從阿摩／補教站同步答案 | REJECT | secondary source，不是 authority；增加 provenance/copyright/maintenance 風險 |
| 新 AI tutor / adaptive platform | REJECT | owner direction 明確先 canonical + accessibility；沒有新 JTBD 證據 |
| 把 #3 a11y 與 freshness 合成一張單 | REJECT | 不同根因；#3 已有 active PR ownership |

## Issue Mapping

- `exam-archive #1` — **DEDUPE / SKIPPED_LOCKED_ACTIVE_PR**。新 evidence 強化其 canonical relationship / redirect branch，但 PR #2/#5 仍 open，本輪不留言、不改 scope。
- `exam-archive #3` — **SKIPPED_LOCKED_ACTIVE_PR#4**。本輪外部 freshness evidence 與 a11y root cause 無關，不搶改。
- New Issue：**0**。
- Existing Issue update/comment：**0**。
- Implementation authorization：**0**。

## Sources

Primary public-web authority：
1. 考選部 115060 考試資訊（checked 2026-09-17）  
   https://wwwc.moex.gov.tw/main/exam/wFrmExamDetail.aspx?c=115060

Secondary / market workflow signals：
2. 阿摩「警政資訊管理與應用」試卷列表（checked 2026-09-17）  
   https://yamol.tw/cat-%E8%AD%A6%E6%94%BF%E8%B3%87%E8%A8%8A%E7%AE%A1%E7%90%86%E8%88%87%E6%87%89%E7%94%A8-1858.htm
3. 阿摩 115 年警政資訊管理與應用 #140754（checked 2026-09-17）  
   https://yamol.tw/exam-%E7%84%A1%E5%B9%B4%E5%BA%A6%2B%2B115%2B%E8%AD%A6%E5%AF%9F%E7%89%B9%E7%A8%AE%E8%80%83%E8%A9%A6_%E4%B8%89%E7%AD%89_%E8%AD%A6%E5%AF%9F%E8%B3%87%E8%A8%8A%E7%AE%A1%E7%90%86%E4%BA%BA%E5%93%A1%EF%BC%9A%E8%AD%A6%E6%94%BF%E8%B3%87%E8%A8%8A%E7%AE%A1%E7%90%86%E8%88%87%E6%87%89%E7%94%A8140-140754.htm
4. 高見警察考古題與答案（checked 2026-09-17；頁面記錄部分 115 資料來源核對 2026-09-08）  
   https://www.kaozen.taipei/police-exam-past-papers/

Repository evidence：
- https://github.com/Reese-max/exam-archive
- https://github.com/Reese-max/exam-archive/issues/1
- https://github.com/Reese-max/exam-archive/issues/3
- https://github.com/Reese-max/exam-archive/pull/2
- https://github.com/Reese-max/exam-archive/pull/4
- https://github.com/Reese-max/exam-archive/pull/5
- https://github.com/Reese-max/police-exam-archive

## What Changed / calibration

- 新確認：外部 115 年 content freshness 已到達警察資訊管理專業科目的使用者介面層，不再只是考試日程預告。
- 新校準：這不支持「exam-archive 應新增 ingestion」；反而因 sibling 已有 115 structured official corpus，更支持既有 **SIMPLIFY / canonical-first** 方向。
- Severity 未升級；沒有用競品更新速度推導真實流失率。
- 沒有把 secondary archive 的題目／解答當作 first-party truth。
- 沒有因 repo 缺 README / monolith / 年份落後而新增 ledger、registry、database 或 framework。

## Completion / gaps / cursor

Completed：
- fresh owner pagination：42 owned / 39 unarchived；page 2 empty；
- current rule blob re-read；
- `exam-archive` current HEAD、all current Issues found、#1/#3 full comments、all-status PR search、#2/#4/#5 current open state、branch pagination checked；
- owner-approved product direction / prior radar / dedupe history checked；
- public-web first-party authority + secondary direct/adjacent workflow signals checked；
- no issue write needed；report-only write。

Gaps：
- 未做 `exam-archive` deployed browser/runtime walkthrough；
- 未有真人資料證明 115 缺口造成離站率／完成率影響；
- 未驗證 thin specialist view 是否可直接重用 sibling data；這只有 canonical decision 需要時才值得做。

Next fair cursor：**`flux-image-gen`**。

Portfolio CLEAN：**not claimed**。
