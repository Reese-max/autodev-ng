# 產品董事會增量巡檢 — 2026-09-16T11:00Z

狀態：**PARTIAL / NO NEW ACTIONABLE FINGERPRINT / NOT CLEAN**

本檔只保存本輪增量證據與公平輪巡游標。沒有產品實作、部署、merge、worker/GOAL 啟動、權限或設定變更。

## 規則與 inventory

- Issue Quality v2：`Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- GitHub inventory：42 個 Reese-max 自有 repositories；39 個未封存、3 個已封存。
- 已封存排除：`gemini-deidentifier`、`openab`、`obsidian-vault`。
- 本輪深巡 repo：`Reese-max/chatgpt-dual-pipeline`（private，default branch `master`）。
- 受檢 HEAD：`1ade604e9ed0fe2b6ffa516b27cbf075f5e21eb8`。
- 產品相關基線：`83eb469c7b0aef50b840116ac2791d69e4d8da33`；其後 default-branch commits 為 audit/documentation，未將 #3/#4 修正帶入 default branch。
- 前一游標：`chatgpt-dual-pipeline`。
- 下一游標：`internship-notes-sites-mirror`。

## Discovery 與增量差異

已核對 README、manifest/config、同步／metadata／驗證／部署腳本、VitePress 導航、近期 commits、全部 Issues 與 comments、PR、可見 branches、current-HEAD Actions 與 commit status，以及既有產品董事會與固定 50 Persona 報告。

### #3 — 發布 eligibility / 隱私與可靠性

既有 Issue：[chatgpt-dual-pipeline #3](https://github.com/Reese-max/chatgpt-dual-pipeline/issues/3)

Default branch 仍保留同一 fingerprint，沒有形成新根因：

- `scripts/sync-notes-to-site.ps1` 仍複製允許副檔名而不解析 `status`。
- `scripts/check-source-metadata.ps1` 仍未對 missing/unknown/draft/scheduled 建立 fail-closed 發布阻擋。
- `site/.vitepress/config.mts` 仍列出三個先前已確認的 scheduled 頁面。
- 2026-09-08 的既有 runtime receipt 證明當時頁面可從 production 到達；本輪未重新對 production 發請求，因此不延伸該 runtime claim。

修正已由活躍 [PR #5](https://github.com/Reese-max/chatgpt-dual-pipeline/pull/5) 承載：

- PR head：`d4ff27ee92055c5d7c1fa4bbc6521535627d1386`
- 狀態：open、未 merge；base 仍為受檢 default HEAD。
- Branch 內容建立單一 release-status gate，排除 draft/scheduled/missing/unknown/no-frontmatter Markdown，並新增 fixture suite。
- PR 描述記錄 9/9 fixture checks；完整 `verify-all.ps1`、preview、production absence/404 receipt 仍待 owner-side runtime。

判定：`BUG / P1 / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`；狀態維持 `STILL_REPRODUCIBLE_ON_DEFAULT`。因活躍 PR 與 ownership 明確，本輪 `SKIPPED_LOCKED`，不留言、不改 scope、不另開單。

### #4 — verification portability

既有 Issue：[chatgpt-dual-pipeline #4](https://github.com/Reese-max/chatgpt-dual-pipeline/issues/4)

Default branch 仍保留同一 fingerprint：

- `project.config.json` 仍提交單一 Windows user-profile Node executable path。
- `scripts/verify-all.ps1` 仍在該路徑不存在時、進入同步／內容檢查／build 之前直接中止。
- gate 仍硬性要求 `powershell` command name。
- current HEAD 沒有 GitHub Actions workflow run 或 commit status；這只代表沒有 GitHub-hosted execution receipt，不推論 YAML、額度或程式失敗。

修正已由活躍 [PR #6](https://github.com/Reese-max/chatgpt-dual-pipeline/pull/6) 承載：

- PR head：`8f1d64a6f5f44927e02b1a13397c469fed6c264d`
- 狀態：open、未 merge；base 仍為受檢 default HEAD。
- Branch 新增 `Resolve-NodeExecutable`，先使用存在的 override，否則 PATH fallback 並要求 Node v20+；同時接受 powershell/pwsh。
- 既有 comment 記錄原 pinned path 已不存在、修正後能進入真正 VitePress preflight；clean checkout、ephemeral runner、完整 build/deploy 邊界仍未驗證。

判定：`MAINTENANCE / P2 / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`；狀態維持 `STILL_REPRODUCIBLE_ON_DEFAULT`。因活躍 PR，本輪 `SKIPPED_LOCKED`。

### #1 — repository identity

[#1](https://github.com/Reese-max/chatgpt-dual-pipeline/issues/1) 已關閉。現有 README/source-of-truth map 對靜態範圍仍成立；本輪沒有推翻結案理由的新證據，不重開。未執行真人 under-60-second maintainer comprehension test，因此只沿用 `PARTIALLY_FIXED / NEEDS_HUMAN_USABILITY_VERIFICATION`，不宣稱完全驗證。

## 競品、董事會與 50 合成 Persona 差異

本輪沒有產品能力、定位或 default-branch runtime 證據變化，因此不重貼完整矩陣或生成新的模擬比例；沿用 2026-09-08 正式產品董事會與 2026-09-10 固定 50 Persona Round 3 的已追溯基線：

- 直接／替代工作流：VitePress、Docusaurus、MkDocs、GitBook、Notion Sites。
- `MUST MATCH`：非 published 內容不得進 production artifact；驗證需能離開原 workstation 重現。
- `SHOULD BE BETTER`：敏感主題的來源 provenance、去識別邊界與 rollback receipt。
- `DIFFERENTIATOR`：繁體中文、官方來源連結、去識別的警政科技實習學習路徑。
- `DO NOT COPY`：在發布安全未完成前加入 AI 自動寫作、帳號／協作 SaaS、public comments、analytics surveillance 或自製 CMS。

13 個董事會視角的分歧不變：Security/QA/SRE/CTO 主張先完成單一 fail-closed gate 與可攜驗證；少數意見認為個人 repo 可保留本機 override，但不能把其當 canonical release contract。CEO 若只做三件事：合併並驗證 #3、合併並驗證 #4、完成 #1 的真人 comprehension check；其餘新增功能不做。

固定 50 Persona（30 回歸＋20 探索）仍以 #3 為主要停止條件，特別影響作者、隱私稽核、新維護者、partial-success recovery 與無法辨識內部 status 的一般讀者。這是模型模擬，不是真人研究、發生率、收入或優先級證據。Round 3 狀態仍為 `NOT CLEAN`；活躍 PR 不能替代 default-branch merge 與必要 runtime receipt。

## Red Team

- 反證：三個 scheduled 頁面可能已去識別且日期已過；因此沒有證據支持 P0 或已發生正式資料外洩，#3 維持 P1 release-boundary risk。
- 更小替代：PR #5 的單一 eligibility function 足以處理根因；不需要 CMS、database、approval service 或跨 repo framework。
- 更小替代：PR #6 的 runtime resolver 與 optional local override 足以處理 portability；不需要自製 runtime manager。
- 綠色 fixture／parser 結果不能冒充完整 VitePress build、preview、production absence/404 或 clean-runner receipt。
- current HEAD 沒有 Actions/status，不足以證明 CI 故障。
- audit-only commits 不視為產品修正，也不使舊 runtime receipt自動失效。

## Findings 與追蹤映射

| finding | severity | disposition |
|---|---:|---|
| 發布 eligibility fail-open | P1 | 已由 #3 + 活躍 PR #5 承載；SKIPPED_LOCKED |
| verification 綁定單一 Windows profile | P2 | 已由 #4 + 活躍 PR #6 承載；SKIPPED_LOCKED |
| repository identity comprehension | P2 historical | #1 已關閉；無新證據，不重開 |

- Total Findings（本輪重新確認）：2
- New Issues Created：0
- Updated Existing Issues：0
- Reopened Issues：0
- Research Issues：0
- Duplicate Avoided：2
- SKIPPED_LOCKED：2（PR #5／#6）
- Rejected/Deferred：CMS、AI authoring、協作 SaaS、analytics、custom runtime manager、以無 CI 冒充產品故障
- Verified Fixed：0
- Regression：0 new
- Issue Write Blocked：0
- Report Write Blocked：0
- Finding mapping：2/2
- Portfolio CLEAN：否

## Decision Memo

服務對象仍是繁體中文警政科技／法政學習者與單一主要維護者。競爭理由不是功能量，而是窄領域、來源可追溯、去識別與可自主管理的靜態發布。

建議：**SIMPLIFY / MAINTAIN**。

NOW：owner review/merge #3、#4 的既有窄修正並取得指定 runtime receipts。  
NEXT：同情境回歸；#3 驗證 excluded slugs 不在 artifact/navigation/search/sitemap 且 preview/production absence/404，#4 驗證 clean checkout 與 ephemeral runner。  
LATER：#1 真人 comprehension test、reader accessibility/field performance 實測。  
DON'T：不要以新平台、CMS、AI 寫作或通用治理框架取代兩個局部根因修正。

本輪只完成單 repo 增量深巡，未宣稱全 portfolio 重排、完整 CLEAN 或必要 runtime 已完成。
