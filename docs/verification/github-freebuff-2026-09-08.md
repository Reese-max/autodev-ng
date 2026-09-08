# GitHub 自動修復實機驗收

2026-09-08：已完成真實 Issue → Freebuff 修復 → 專案測試 → 獨立 CLI reviewer → 原版回歸重跑 → 推送與 draft PR。合併由人工決定。

## 實際案件

- [Issue #7](https://github.com/Reese-max/autodev-ng/issues/7)：`codexJson()` 使用相對資料目錄時，schema 路徑在子程序 cwd 被重複解析。
- 原版 `b4d5681c9d080c259f057e1dd46298414da17a7d`；修復 `2b1c71e65daded584914c12434534d51a858d16c`；[draft PR #8](https://github.com/Reese-max/autodev-ng/pull/8)。首次派工成功，沒有重設重試次數。
- Freebuff 實際路由為 Limited／DeepSeek V4 Flash／max；worker 記帳 0 美元。Reviewer 與語意檢查仍使用現有 Codex 登入額度。
- 宿主實際執行 npm ci、build、npm test，exit 0，耗時 1,201,850 ms。
- 語意檢查 `gpt-5.6-terra`、獨立 reviewer `gpt-5.6-sol` 均實際執行且 exit 0，review gate 通過。
- 同一份 `tests/regressions/github-7.test.cjs` 在原始版本因 assertion 失敗（exit 1），在候選版本通過（exit 0）。測試涵蓋相對及絕對資料目錄，使用實際 helper 與假的 CLI 程序邊界。
- 測試 SHA-256：`9b1de4bde08f90bb988715817889504a91b1e4e88158f316d29bf5b19abed361`。發布後再次執行 `assertPublishable` 通過，GitHub PR head 與候選 commit 相同。

## 已啟用的接單

`configs/integrations/github-freebuff.json`：只接 `Reese-max/autodev-ng`、作者 `Reese-max`、標籤 `autodev-freebuff`；允許發布修復分支與 draft PR，每案最多三輪，間隔 15 分鐘。

Windows watcher 已啟動，首輪 `idle`、exit 0；Startup 的 `AutoDevNG-GitHub-Freebuff.lnk` 於登入時啟動隱藏視窗。登出或關機時不執行。停止方式是在 `data/github-freebuff/` 建立 `.adng.stop`，恢復前保留並檢查案件紀錄。

既有 Issue #4 的快照已改變且有 PR #5，沒有重複派工或覆寫它的舊現場；原通報修復暫停旗標維持保留。

## 回歸閘與後續 CI

每案強制新增獨立 Node 回歸測試。原版必須失敗於 assertion，候選必須通過且不得跳過；修改、刪除或改名既有測試會拒絕自動發布。收據綁定 base、candidate 與測試雜湊。Windows 換行透過 Git 的正常化內容雜湊比對，不把相同內容的 CRLF 當成竄改。

GitHub CI 保留原雙輪 Vitest 回歸，另執行已提交的 `tests/regressions/*.test.cjs`，使修復後的測試持續受到檢查。GitHub CI 的即時狀態以 Actions／PR checks 為準，不以本機通過替代。

## 本機證據

- `data/github-freebuff/issue-7/state.json`：published、PR、commit 與次數。
- `data/github-freebuff/issue-7/evidence/`：宿主測試、獨立 reviewer、合併與同一 commit 的證據。
- `data/github-freebuff/issue-7/regression-2b1c71e65daded584914c12434534d51a858d16c.json`：原版紅／候選綠的輸出與測試雜湊。
- `data/github-freebuff/issue-7/research/`：真實 CLI 語意檢查及 reviewer 回應與 telemetry。
- `data/github-freebuff/watcher.json`、`last-run.log`：最近一輪 watcher 狀態。
- `data/maintenance/github-live-review/activation.json`：啟動與登入捷徑收據。
