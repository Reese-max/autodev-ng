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

### Herdr admission（#35：相依阻擋，未啟用）

一般 Issue 與通報 repair 目前都拒絕 Herdr。runtime 與 `github doctor --live`
會指出 #33 backend 對帳、#34 backend readiness 及另行授權的 Windows canary 尚未通過，
不執行 Herdr preflight、Agent 或發布。選擇 `engine`、Issue 文字聲稱已批准、
launcher 的 running／compatible 或可建立 adapter，都不能解除此封鎖。

#32 的結果契約 v1 已綁定 request／execution／repo／task／base／session，
但 `inspect-herdr` 的 `correlated-v1-done` 仍明示 `trustedTerminal:false`，
server／pane occupant 與 deadline／expiry 也仍未驗證。通用 execution quarantine
會保留不明執行；Issue state reconciliation 不能當作 backend 已停止的證據。
因此這次只補齊安全拒絕的診斷與離線回歸，沒有新增可啟用的 opt-in 欄位或可信能力宣告。

| #35 驗收 | 此版本狀態 |
|---|---|
| 預設、缺少能力證據時拒絕 Herdr | 保留；一般／repair 的 runtime 與 live doctor 均有離線測試 |
| 可信 config opt-in，限一般已授權 bugfix-only、單機／單 Worker、指定 backend | 未實作；等 #33／#34 的可信契約，不能用 Issue 或自行宣告的 JSON 補證 |
| 真實 Agent 修改 → 宿主提交 → 原版紅／候選綠 → review → draft PR，精確綁定全程回執 | 未驗證；不啟動 Agent、不 push、不建立 PR |
| 錯誤回執、權限／worktree／回歸／review／費用失敗時不發布 | 既有檢查保留；Herdr 尚未進入此流程，不能宣稱整體通過 |
| 斷線、逾時、重啟、重複事件的 backend 對帳與單一 writer／PR | #33 阻擋；現有 quarantine 只保守封鎖，不自動恢復 backend |
| 一般與 repair 分別列明、離線與 Windows canary 分開 | Herdr 一般入口仍停用；Herdr report repair 明確不支援；canary 未執行 |

解除封鎖前須整合並核對 #32–#34 的相容版本／能力、#13 CI 修復，
再另行授權 Windows 真實 canary。該證據需綁 exact repo、Issue snapshot、execution
與 candidate commit，並涵蓋失敗、重啟、重複事件及費用政策；離線測試不能代替。

離線拒絕契約：`npm test -- tests/github-herdr-admission.test.ts`。

本次本機驗證（基線 `57762c1c131930668eaa7e9f3549f817fa933e73`）：

- TDD：實作前新測試 4 failed（exit 1），候選 7 passed（exit 0）。
- 全套：基線 2763 passed／1 failed；候選 coverage 全套 2770 passed／1 failed，兩者 exit 1。
  唯一失敗均為 `tests/steering.test.ts:658` 的 10,000 筆控制紀錄案例；候選明確回報 30 秒逾時。未跳過、調高該測試逾時或修正其他 Issue。
- `npm run build`、`npm run typecheck`（含秘密掃描）與 `npm run quality:crap` 均 exit 0；CRAP 10 個函式、最高 13。
- 兩處 admission guard 的 scoped mutation：`npm exec -- stryker run --mutate src/github/job.ts:43-44,src/github/operations.ts:23-24 --testFiles tests/github-herdr-admission.test.ts --concurrency 2 --reporters clear-text,json`，exit 0，9 killed／23 compile errors，mutation score 100%（門檻 80%）。
- 候選 coverage JSON 的 `src/` 彙總：lines 91.39%、statements 86.99%、functions 90.45%、branches 82.53%。專案未設定 coverage ratchet；這些數字不代表全套通過或真實 canary 驗收。

### 入口授權

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
新出現的 repo 名稱從目前游標進度加入，同順位時未派工者先行；反覆改名不能靠重置為零一直插隊。
報告保留新身分的加入理由，既有 repo 的 lease／claim／工作狀態不會移轉到另一個名稱。
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

需要 watcher 意外退出後自動恢復時，改以
`scripts/supervise-github-owner.ps1 -Config <設定檔> -Mode issues` 啟動；同樣支援 `reports`、`repairs`。
同一設定與模式只能有一個 supervisor；原 watcher 的 mutex 與所有執行／發布閘門保持生效。
非零退出會先清除該次 watcher 的 Windows Job Object 內所有子程序，再等待 `-RestartDelayMs`
（預設 5000，允許 1000–60000 毫秒）後重啟。正常退出（包含 watcher mutex 已被占用）不重啟。
啟動前、執行中及等待重啟時都檢查 `enabled`、dataDir 的 `.adng.stop` 與設定的 `stopFile`
（相對設定檔解析）；repairs 另檢查 `dataDir/repairs/.adng.stop`。
暫停時清除所屬程序樹並退出；移除旗標後需明確重新啟動。設定損毀或所有權／dataDir 變更也不會重啟。
本機狀態固定覆寫 `dataDir/supervisor-<mode>.json`（repairs 在其子目錄），只記錄
`supervisorPid`、`childPid`、`status`、`restartCount`、`lastExitCode`、`timestamp`。
此指令不安裝排程或修改 Startup；需已建置的 `dist/cli.js`。

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
