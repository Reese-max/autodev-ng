# 產品董事會增量巡檢 — 2026-09-16T14:03Z

狀態：**PARTIAL / SEVERITY CALIBRATED / NO NEW ACTIONABLE FINGERPRINT / NOT CLEAN**

本輪只做稽核、分流與持久游標更新；沒有修改產品程式、CI、設定、secrets、權限，沒有 merge、deploy、建立實作分支或啟動 worker/GOAL。

## 規則、inventory 與範圍

- Issue Quality v2：`Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- 完整 inventory：42 個 Reese-max 自有 repositories；39 個未封存、3 個已封存。
- 已封存排除：`gemini-deidentifier`、`openab`、`obsidian-vault`。
- 本輪深巡：`Reese-max/internship-notes-sites-mirror`，private，default branch `main`。
- 受檢 HEAD：`379e378a84ea7a2e83e25459c2833f6af39d5d93`（audit-only）。
- 最近產品／內容基線：`837f83d505ebb46108ba7cedecddf4adb7adc4ff`。
- 前一游標：`internship-notes-sites-mirror`。
- 下一游標：`taichung-police-intel`。

已核對 README、package/hosting config、worker、build/test、publish launcher、近期 commits、全部狀態 Issues/PR、完整 Issue comments、PR comments/branches、current HEAD 與 PR head 的 Actions/status，以及既有 fixed-50 Round 1。沒有把 private repo、無 Actions 或無法取得 public HTTP receipt誤當成不存在或產品故障。

## 產品與用途

此 repo 是「頡譯的實習筆記」的 ChatGPT Sites 編輯／鏡像入口：

- `notes/` 提供手機／Codex 編輯來源。
- worker 對首頁、2026-08-03、2026-08-05 回傳內嵌 HTML，其餘 GET/HEAD 路徑代理 `https://police-tech-notes.pages.dev`。
- `npm test` 只驗證 mirror worker build 與兩個導覽標籤情境。
- `npm run publish:pages` 再呼叫 canonical `chatgpt-dual-pipeline` 的 mirror sync 與 deploy scripts。
- 真正的 VitePress verification、Cloudflare Pages deploy 與 live chunk verification 仍由 canonical repo 負責；本 repo 不應建立第二套發布框架。

## 既有 Issue #1 與活躍 PR

Issue：[internship-notes-sites-mirror #1](https://github.com/Reese-max/internship-notes-sites-mirror/issues/1)

Default branch 仍能靜態重現原 fingerprint：

- README 指示直接執行 `npm run publish:pages`。
- `scripts/publish-pages.ps1` 預設把 `scripts/../..` 當 canonical root。
- standalone clone 的 parent 並不包含 canonical scripts 時，命令會在 sync/verify/deploy 前中止。
- 這是 documented clean-clone、handoff 與災難復原路徑的具體契約違反。

活躍 [PR #3](https://github.com/Reese-max/internship-notes-sites-mirror/pull/3)（head `a8fef63929a164a776a4f813293898e1c31a16d6`）已承載較完整的最小修正：explicit flag/env/named sibling、actionable diagnostics、side-effect-free dry-run、dirty source/target 預檢，並保留 canonical sync → verify → deploy → live-check chain。PR #2 是較窄但被 #3 實質涵蓋的替代方案；本輪不重複開單或改 PR。

### Quality v2 分級校準

既有 Issue 將 clean-clone publish handoff 定為 P1。本輪按新版門檻校準為：

- kind：`BUG`
- severity：**P2**（原 P1）
- decision priority：HIGH，因修正已存在且 recovery/handoff 受阻
- evidence：`SOURCE_CONFIRMED`
- triage：`NEEDS_REVIEW`
- auto_implementation：`false`

理由：目前受支援的 clean-clone／新維護者路徑確實在進入驗證前失敗，對恢復性與交接有顯著影響，符合 P2；但 canonical repo 仍保有直接 verification/deploy 路徑，沒有證據顯示目前 production 發布全面停擺、資料／權限重大受損或核心讀者流程中斷，因此不符合 P1。這是分級校準，不代表已修復，也不改寫歷史來源。

因 PR #3、專用 branch 與既有 owner/worker 紀錄仍清楚承載 scope，本輪標記 `SKIPPED_LOCKED`；不追加 Issue comment、不取得新鎖、不搶 ownership。

## 執行與回歸證據

- default HEAD `379e378...`：GitHub 返回零 PR-triggered workflow runs、零 commit statuses。這不是 CI 失敗證據。
- PR #3 較早 head `9a4b06c...`：[Actions run 34102243292](https://github.com/Reese-max/internship-notes-sites-mirror/actions/runs/34102243292) 曾在 Ubuntu／Windows 各通過 5/5 tests，且 Codex review 無重大發現。
- PR #3 最新 head `a8fef639...`：[Actions run 34129186315](https://github.com/Reese-max/internship-notes-sites-mirror/actions/runs/34129186315) 顯示 Ubuntu failure、Windows cancelled；兩個 jobs 都是 `steps=[]`，logs 讀取為 `BlobNotFound`。因此只能記 `CI_ADMISSION_UNKNOWN / NEEDS_RUNTIME_VERIFICATION`，不得推論程式、YAML、額度或測試回歸。
- Issue comment 記錄 Windows 本機 `npm test` 為 16 pass / 1 expected skip；它不能替代 latest-head Ubuntu CI、default-branch CI 或真實 canonical checkout dry-run。
- PR 尚未 merge，故 #1 維持 `STILL_REPRODUCIBLE_ON_DEFAULT`，不是 `PARTIALLY_FIXED` 或 `VERIFIED_FIXED`。

## 新候選與 Red Team

### 內嵌 HTML／hashed assets 漂移候選 — REJECTED AS ISSUE / evidence backlog

worker 對首頁與兩篇日誌回傳約 91 KB 的內嵌 VitePress HTML，引用 `/assets/style.BCVugsJn.css` 等 content-hashed assets，再把其餘路徑代理到 canonical origin。靜態上存在「canonical rebuild 後舊 hash 消失、局部頁面內容／樣式漂移」的可能。

但本輪未取得可重播的公開 mirror/origin HTTP 回應；web 讀取被環境安全限制拒絕。GitHub source 只能證明設計，不能證明 asset 已 404、手機頁已壞、內容已漂移或 production 事故。現有 tests 也明確把首頁與 0803/0805 local override 當預期行為。故不開 Issue，保留最小 evidence backlog：

1. 對 mirror 的三個 local paths 取得 HTML receipt。
2. 逐一 HEAD/GET 其 stylesheet、modulepreload、image assets。
3. 與同時點 canonical page 比較 status、canonical URL、主要標題／導覽。
4. 若確認 missing asset 或不可解釋的內容漂移，再以單一根因立案；否則 REJECT。

### scheduled 內容

mirror repo 的 `notes/` 仍含三個 `status: scheduled` 檔案，但這是 canonical `chatgpt-dual-pipeline` #3 的同一發布 eligibility 根因與同步症狀；不得換 repo 或解法名重開。既有 canonical PR #5 仍活躍，因此此處記 `DUPLICATE_AVOIDED`。

### 更小替代與不做事項

- #1 的最小有效解法是合併、驗證 PR #3；不 vendoring canonical deploy scripts、不新增 database、registry、第二個發布服務。
- hardcoded HTML 候選先做三頁非破壞 HTTP/asset receipt，不建立內容 diff 平台。
- 無 GitHub-hosted run 不能升級成產品故障。
- PR 成功、review 綠燈或 local tests 均不能替代 default-branch merge 與實際 handoff dry-run。
- 不以 Notion/GitBook 遷移掩蓋現有窄範圍 path contract。

## 外部競品／替代工作流（查閱 2026-09-16 UTC）

本輪以官方來源重新核對相關工作流；功能宣稱不是本產品效果證據：

- VitePress deploy guide（CONFIRMED；更新日期 UNKNOWN）：https://vitepress.dev/guide/deploy
- Cloudflare Pages framework/deploy docs（CONFIRMED；搜尋頁顯示 2026-04-21 內容日期）：https://developers.cloudflare.com/pages/framework-guides/
- GitHub Pages publishing source（CONFIRMED；更新日期 UNKNOWN）：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- GitBook change requests（CONFIRMED；搜尋頁顯示 2026-08-25）：https://gitbook.com/docs/collaborate/change-requests
- Notion Sites publish/pricing（CONFIRMED；更新日期 UNKNOWN）：https://www.notion.com/help/public-pages-and-web-publishing 及 https://www.notion.com/help/notion-sites-availability-and-pricing

比較結論：

- MUST MATCH：一個可說明、可 dry-run、可從 clean checkout 到 canonical gate 的 handoff；鏡像不應偷偷依賴 parent directory。
- SHOULD BE BETTER：內容來源、canonical URL、发布 eligibility 與 production artifact receipt 必須可追溯。
- DIFFERENTIATOR：手機／Codex 編輯入口與 owner-controlled Markdown/VitePress/Cloudflare 正式站分離。
- DO NOT COPY：hosted CMS migration、多人協作套件、analytics、AI 自動改寫或第二套 deploy pipeline。

## 董事會與 50 合成 Persona 差異

沿用固定 50 Persona Round 1 的 30 個回歸角色，並以 20 個探索角色檢查 Windows／Linux clean clone、mobile edit、canonical checkout 命名、path with spaces、dirty target、partial sync、CI admission、origin outage、stale asset、screen reader 與 recovery。這是模型模擬，不是真人測試或發生率證據。

- CEO：只做三件事—owner review/merge PR #3、latest/default-head CI、真實 canonical checkout dry-run；不做新平台。
- CPO／Support：README 必須從 mirror 清楚導向 canonical prerequisite 與失敗復原。
- CTO／Principal：保留單一 canonical verify/deploy source，不複製 scripts。
- QA／SRE：要求 exact SHA 的 latest-head run 與 default-branch receipt；`steps=[]` 不冒充測試結果。
- Security／Privacy：scheduled 內容沿用 canonical #3，不在 mirror 重複治理。
- Accessibility／UX Research：無 browser/AT receipt，保持 UNKNOWN。
- 少數意見：這是單一 owner 的私有 repo，magic sibling layout 可能暫時可用；但 README 將命令呈現為一般流程，所以仍是可重現的 P2 handoff defect。

合成旅程沒有產生第二個通過門檻的新根因；Round 1 的 P1 歷史 finding 校準為 P2，但 repo 仍 `NOT CLEAN`，因 default branch 尚未修正且必要 runtime receipts 不完整。

## Findings／寫入對照

| finding | 原分級 | 本輪分級 | disposition |
|---|---:|---:|---|
| standalone clone publish root 依賴 magic parent layout | P1 | P2 BUG | #1 + active PR #3；SKIPPED_LOCKED |
| local HTML／hashed asset 可能漂移 | — | NOT_ESTABLISHED | evidence backlog；未開單 |
| scheduled notes 進 public artifact | P1 upstream | P1 upstream | canonical #3 duplicate；未開單 |

- Total actionable findings：1（既有）
- New Issues Created：0
- Updated Existing Issues：0
- Reopened Issues：0
- Research Issues：0
- Duplicate Avoided：2（scheduled root cause、PR #2 alternative）
- Rejected / evidence backlog：1（local HTML asset drift）
- Scope Narrowed：1
- Severity Calibration：1（P1 → P2）
- SKIPPED_LOCKED：1（Issue #1 / PR #3）
- Verified Fixed：0
- Regression：0 confirmed
- Issue Write Blocked：0
- Report Write Blocked：0
- Finding mapping：1/1
- Portfolio CLEAN：否

## Decision Memo

服務對象是主要維護者與從手機／Codex 編輯實習筆記的作者；讀者主要由 canonical Pages 產品承接。這個 repo 的價值不是另一個網站生成器，而是安全、可恢復的編輯入口與薄鏡像。

建議：**SIMPLIFY / MAINTAIN / MERGE（建議，不是 merge 授權）**。

NOW：review PR #3 最新 diff，取得 latest-head CI 可判讀 receipt。  
NEXT：核定後 merge，取得 default-branch CI 與真實 canonical checkout dry-run；再依相同 clean-clone 情境複驗 #1。  
LATER：三個 local override paths 的 HTTP/asset drift receipt與 accessibility smoke。  
DON'T：不要新增第二套 CMS、發布框架、內容 registry、協作 SaaS 或鏡像專用 eligibility engine。

本輪只完成單 repo 增量深巡，未宣稱重新完成全 portfolio 排名、任何部署成功或 Portfolio CLEAN。
