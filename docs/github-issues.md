# GitHub Issue 自動接單

使用既有 scheduler、隔離 checkout、CI 與 reviewer 處理 GitHub Issues；驗收證據完整才推送
`autodev/issue-N` 並建立 draft PR。合併與部署由操作者決定。

## 設定

`configs/integrations/github-issues.example.json` 為單一 repo 範例，
`github-owner.example.json` 為整個 GitHub 個人帳號範例。兩者預設停用且不發布。
複製成自己的設定檔後，指定 `sourceConfig`、`engine`、`authors` 與資料目錄。
範例的 `codex-sol` 對應目前版本的 sourceConfig；實際引擎、模型登入與成本政策須依使用環境設定。
Freebuff、Herdr、mock 及無 wall timeout 的引擎不可用於此入口。

`sourceConfig`、`dataDir` 與 projects 的路徑相對於 integration 設定檔。
`enabled=true` 允許接單與執行，`publish=true` 允許推送修復分支與建立草稿 PR。

- `label: null`：不需標籤，接收指定作者的既有與新增 open Issues。
- 未指定 label：仍要求 `autodev`。
- `no-autofix`：一律排除，不分大小寫。
- Issue 內容變更、關閉、作者不符或新增排除標籤，會在執行與發布前取消或阻擋。
- 已有對應分支 PR 或 GitHub 關聯 PR（包含已關閉）時阻擋重複修復，保留 PR 連結。

帳號入口會確認 gh 登入身分與 owner 相符，自動發現該帳號擁有的公開／私人 repos；
跳過封存、停用、未開啟 Issues 或無 push 權限的專案。每輪最多執行一張 Issue，
透過帳號鎖、repo 鎖、重試間隔與最多三輪的預設上限避免重複或無界派工。

## 驗收指令

預設偵測根目錄 package-lock.json 與 npm test，執行 npm ci、test，以及存在的 build。
其他技術棧可在 owner 設定的 `verifyCommands` 依完整 repo 名稱指定既有驗收命令：

```json
{
  "verifyCommands": {
    "Reese-max/video-timeline-pipeline": "python -X utf8 -m unittest discover -s tests -v",
    "Reese-max/taichung-police-intel": "npm --prefix apps/web ci --no-audit --no-fund && npm run check"
  }
}
```

指令在候選 checkout 執行，只套用於指定 repo；空白指令會被拒絕。
命令語法與必要 Python／Node／瀏覽器依賴需配合執行主機。範例命令以 Windows 為目標。
`projects` 也可將完整 repo 名稱對應到既有 AutoDev 專案設定；該 sourceConfig 的 origin 必須匹配。
不能將未執行的測試或已有的基線失敗當成通過。Issue 內容不能改寫本機驗收設定。

## 執行

```powershell
npm run build
node dist/cli.js github owner-sync --config configs/integrations/github-owner.json
node dist/cli.js github owner-run --config configs/integrations/github-owner.json
node dist/cli.js github owner-status --config configs/integrations/github-owner.json
```

單一 repo 使用 `scan`（唯讀）、`sync`、`run`、`status`。
owner-sync 只同步，不啟動模型；owner-run 執行一輪。

Windows 可用 `scripts/install-github-issues-task.ps1 -Config <設定檔>` 安裝每五分鐘排程，
支援 `-WhatIf` 且不覆寫同名工作。無排程器權限時，可在背景執行
`scripts/watch-github-owner.ps1 -Config <設定檔>`，並由使用者 Startup 捷徑登入啟動。
watcher 使用 mutex 防止重複，每輪結束後等待 retryMs；登出或關機時不執行。

## 狀態與停止

帳號狀態在 dataDir/status.json，各 repo 使用獨立雜湊目錄。
watcher 最近輸出在 last-run.log，程序與結束碼在 watcher.json。
在 integration 的 dataDir 建立 `.adng.stop` 可停止下一次接單／發布步驟；不影響其他 fleet 的停止設定。

每張 Issue 保留需求快照、checkout、backlog、執行紀錄與證據。中斷的 running 任務會標為 blocked，
不自動清除工作目錄或重置次數。恢復前須檢查原因、Issue 快照、commit 與原執行紀錄並備份 state.json。
clone/worktree 提供版本隔離，不是作業系統沙箱；只接信任作者，PR 仍需人工審查。

## 測試

`tests/github-*.test.ts` 涵蓋免標籤、作者／排除條件、去重、重試、停止、證據及驗收命令隔離。
整合測試使用真實 Git worktree、scheduler、CI 及本機 bare remote，模型與 GitHub API 採測試替身。
