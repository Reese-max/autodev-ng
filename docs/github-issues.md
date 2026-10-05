# GitHub Issue 自動接單

使用既有 scheduler、隔離 checkout、CI 與 reviewer 處理 GitHub Issues；驗收證據完整才推送
`autodev/issue-N` 並建立 draft PR。合併與部署由操作者決定。

案件控制台、一般 Issue 恢復、PR 後續修正、自訂回歸及人工驗收，見 [GitHub 交付與日常操作](github-delivery.md)。

## 設定

`configs/integrations/github-issues.example.json` 為單一 repo 範例，
`github-owner.example.json` 為整個 GitHub 個人帳號範例。兩者預設停用且不發布。
複製成自己的設定檔後，指定 `sourceConfig`、`engine`、`authors` 與資料目錄。
範例的 `codex-sol` 對應目前版本的 sourceConfig；實際引擎、模型登入與成本政策須依使用環境設定。
Freebuff 可由本機設定明確選用，見 [Freebuff 使用方式](freebuff.md)；Herdr、mock 及無 wall timeout 的引擎仍不可用於此入口。

`sourceConfig`、`dataDir` 與 projects 的路徑相對於 integration 設定檔。
`enabled=true` 允許接單與執行，`publish=true` 允許推送修復分支與建立草稿 PR。

- `label: null`：不需標籤，接收指定作者的既有與新增 open Issues。
- 未指定 label：仍要求 `autodev`。
- `no-autofix`：一律排除，不分大小寫。
- AutoDev [自動通報](github-reports.md) 的來源標記或 `autodev-reported` 標籤預設排除，包含 `label: null`；只有明列本地通報快照與檢查契約的 [CLI 修復政策](github-repair.md) 可接案。
- Issue 內容變更、關閉、作者不符或新增排除標籤，會在執行與發布前取消或阻擋。
- 已有對應分支 PR 或 GitHub 關聯 PR（包含已關閉）時阻擋重複修復，保留 PR 連結。

Issue Quality v2 的單一 fenced `yaml` / `yml` metadata 區塊現在是 runner 強制否決：
`auto_implementation: false`、`kind: RESEARCH` / `OPPORTUNITY`、非 `READY` 的 triage，
或矛盾、重複、無法解析的 metadata，都不得接單。同步會輸出 Issue 編號與
`issue-quality-*` 原因碼，不保存正文或消耗 writer 次數。metadata 上限 4096 字元，
只接受 `key: scalar`、空行與註解，不執行 YAML tags、aliases 或巢狀資料。

沒有此 metadata 的既有人工 Issue 沿用作者、label、no-autofix 與受控 report 契約。
正文的 `true` / `READY` 僅解除 metadata 否決，不能授予執行權限；留言不參與批准。
作者、可信本地設定與 opt-in label 仍須匹配，執行前、follow-up 與發布前使用同一資格判斷。
將研究改為可實作前，操作者須明確確認需求與驗收，再更新 metadata 及既有批准標籤；
runner 不會自行移除 `no-autofix`、重開歷史 blocked 案件或重置次數。

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

每案另須新增 `tests/regressions/github-N.test.cjs`（N 為 Issue 編號），使用 `node:test` 與 `node:assert/strict`。宿主在候選版本執行，再把同一測試檔放入原始版本的獨立本機 clone 重跑：候選必須成功且不得跳過測試，原版必須因 assertion 失敗；逾時、缺少模組或只有 exit 1 不算重現。`regressionPrepareCommand` 可明列原版的安裝／建置命令；通報修復預設沿用 `repair.prepareCommand`。命令不由 Issue 決定。

此入口目前只接受新增回歸測試，不接受修改、刪除或改名既有測試；需要改動既有測試的案件交由人工處理。原版、候選 commit 與測試雜湊綁定收據，發布時再次核對。模型仍須審查測試是否對應問題，測試執行不代表具備 OS 沙箱。

### Quality gate 與失敗學習

`quality` 是每個 integration 的可選 quality contract；設定後會在 red→green 回歸與專案驗收後執行固定順序的 `unit`、`coverage`、`crap`、`mutation` 命令。`required` 列出的檢查若未設定會是 `unverified`，不是通過；任何已設定命令失敗都會阻止候選進入 `ready` 或發布。receipt 綁定候選 commit 與 contract hash，只保存 exit code、逾時、耗時與輸出雜湊，不保存原始命令輸出。

需要四道閘門時，設定檔可採用下列形狀；命令必須是 repository 本身已有且可重現的驗收命令：

```json
{
  "quality": {
    "required": ["unit", "coverage", "crap", "mutation"],
    "unit": { "command": "npm.cmd", "args": ["test"] },
    "coverage": { "command": "npm.cmd", "args": ["run", "test:coverage"] },
    "crap": { "command": "npm.cmd", "args": ["run", "quality:crap"] },
    "mutation": { "command": "npm.cmd", "args": ["run", "test:mutation"] }
  }
}
```

每輪 Issue 的 `learnings.md` 與既有 `learning-started`／`learning-outcome`／`lesson-added` 事件會保留失敗學習；反思故障 fail-open，不得反殺 Issue 主流程。quality 或 red→green 失敗仍保留 checkout、state 與 receipt，下一輪只依狀態與明確 retry 規則恢復。

## 執行

```powershell
npm run build
node dist/cli.js github owner-sync --config configs/integrations/github-owner.json
node dist/cli.js github owner-run --config configs/integrations/github-owner.json
node dist/cli.js github owner-status --config configs/integrations/github-owner.json
```

單一 repo 使用 `scan`（唯讀）、`sync`、`run`、`status`。
owner-sync 只同步，不啟動模型；owner-run 執行一輪。

Owner 派工以持久化的 `dispatch-cursor.json` 記錄服務順序，不依系統時間輪替。
游標已存在但損壞或不可讀時會停止派工並記錄原因，不能重置進度後繼續。
PR 查核在僅同步的 repo 也會執行，每次單一 repo runner 呼叫最多查核 25 件；報告分列可查核、已嘗試與尚未涵蓋的件數。
`lastObservedAt`／`lastObservedSeq` 記錄查核嘗試（含失敗），有效的 exact-head 回執時間仍以 `state.remote.at` 為準。

Owner 在可執行的子 repo 呼叫前，先將 `recovery-required.json` 寫入目前 owner lock generation。
若子工作結果不明、狀態寫入失敗或回報 `recoveryRequired`，會保留該租約，阻止本輪及重新啟動後再派工。
Owner 的執行介面預設使用 typed outcome；舊版文字 adapter 的 `blocked` 結果無法證明 claim 已安全釋放，因此同樣保留租約。
確認原 backend／claim 已安全後，由 operator 使用既有 generation-fenced `recoverRetainedLock`（正確 token 與 `backendSafeConfirmed: true`）復原。
不得只刪除 lock 目錄、使用錯誤 generation 或把 failed PR read 當作已完成的查核。

Windows 可用 `scripts/install-github-issues-task.ps1 -Config <設定檔>` 安裝每五分鐘排程，
支援 `-WhatIf` 且不覆寫同名工作。無排程器權限時，可在背景執行
`scripts/watch-github-owner.ps1 -Config <設定檔>`，並由使用者 Startup 捷徑登入啟動。
watcher 使用 mutex 防止重複，每輪結束後等待 retryMs；登出或關機時不執行。
watcher 的 `-Mode issues` 也可直接讀取單一 repo 設定，僅輪詢該 repo。

## 狀態與停止

帳號狀態在 dataDir/status.json，各 repo 使用獨立雜湊目錄。
watcher 最近輸出在 last-run.log，程序與結束碼在 watcher.json。
在 integration 的 dataDir 建立 `.adng.stop` 可停止下一次接單／發布步驟；不影響其他 fleet 的停止設定。

每張 Issue 保留需求快照、checkout、backlog、執行紀錄與證據。中斷的 running 任務會標為 blocked，
不自動清除工作目錄或重置次數。恢復前須檢查原因、Issue 快照、commit 與原執行紀錄並備份 state.json。
完成 `executeIssue` 後，runner 會先保存候選 SHA、既有 receipt 相對位置與 writer 次數，
再核對外部 Issue。此時 `queued` 的 `candidateCheck` 表示本地已完成、外部尚未確認，
checkpoint 的 policy hash 綁定原 integration／source／report 設定；重啟後 drift
（包含刪除 quality 或 acceptance gate）會隔離，恢復須還原原設定，不能降低既有 gates。
不可直接發布。重啟後只接續同一 Issue／PR 核對，不重跑 Worker、不重記費用或重建成果。

只有具結構化 HTTP 回應的唯讀 408、429、500、502、503、504（及 remaining=0 的 403）
可退避；尊重 Retry-After／rate-limit reset。最多 5 次控制端失敗，基本延遲按 retryMs
倍增至 30 分鐘；需等待超過 24 小時則交人工，不提早重試。未知錯誤、權限拒絕、
需求變更、PR head 漂移及可能已成功的 POST 仍 fail closed。用既有 recover/resume
核對精確成果與證據，不批次重開舊 blocked 案件或重置 writer／費用計數。
clone/worktree 提供版本隔離，不是作業系統沙箱；只接信任作者，PR 仍需人工審查。

## 測試

`tests/github-*.test.ts` 涵蓋免標籤、作者／排除條件、去重、重試、停止、證據及驗收命令隔離。
整合測試使用真實 Git worktree、scheduler、CI 及本機 bare remote，模型與 GitHub API 採測試替身。
