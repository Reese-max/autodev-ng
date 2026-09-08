# CLI 自動修復

已核對的巡檢缺陷可由 CLI 自動接案，在隔離 checkout 重現問題，呼叫本機設定選擇的 Codex CLI 或 Freebuff 修復，再執行專案測試、獨立 Codex CLI 評審及原始檢查。成功會保存本地修復 commit 與驗收證據。

```powershell
npm.cmd run build
node dist/cli.js github repair --config configs/integrations/github-repair.json --dry-run
node dist/cli.js github repair --config configs/integrations/github-repair.json
node dist/cli.js github repair-status --config configs/integrations/github-repair.json
```

`--dry-run` 只讀 GitHub 與本地紀錄，列出符合修復政策的 Issue；不建立任務、執行命令或啟動模型。`repair` 每次最多處理一案，失敗依 `retryMs` 與 `maxRuns` 限制重試；上一輪失敗而保留 queued 時，CLI 仍回傳非零結束碼。程序中斷保留現場並標為 blocked。`repair-status` 顯示候選 commit、狀態與資料路徑。`ready` 代表隔離 checkout 的驗收通過，主工作目錄尚未套用。

## 接案與驗收

- 使用獨立的 `github-repair.json`，明列 repo、作者、Codex engine、可修復的 `probeIds`、準備命令與測試命令。路徑相對於設定檔。目前只設定 `autodev-ng` 的 `cli-help` 檢查。
- `repair.reportConfig` 指向原通報設定；必須是同一 repo／sourceConfig。接案核對通報 ledger 的 Issue 編號與不可變發布快照、GitHub 作者、標籤及本地檢查命令。只信本地設定的 argv，Issue 文字不是命令授權。
- 只有已發布、可重現的 runtime 缺陷能接案。外部靈感、靜態推論、缺少快照的舊案、`needs-validation`、`no-autofix`、移除標籤或被編輯的 Issue 都不自動修復。一般人工 Issue 仍使用原本的 `github run`。
- 先 clone GitHub 的指定分支，執行 `prepareCommand`，再執行同一 probe 兩次；輸出與結束碼須一致且符合原始失敗。依賴或建置失敗、逾時、不同錯誤、已無法重現都保留現場，不能當成修復成功。
- 修復沿用 scheduler、worktree 與宿主驗收，保留 sourceConfig 的範圍約束。Codex worker 由宿主提交；Freebuff worker 在隔離 worktree 提交後仍須通過同一驗收閘。worker 不推送或部署。主工作目錄的未提交內容不會被移動或覆寫。
- worker 可由本機設定選擇 Codex CLI 或 [Freebuff](freebuff.md)；獨立 reviewer 與語意驗證仍使用 Codex CLI 及現有 ChatGPT 登入。Codex 忽略使用者 CLI 設定與 rules，不改寫登入或全域設定，不使用 API key／HTTP judge。Reviewer 不可執行工具；失效或拒絕不會退回自動通過。Freebuff 的 MCP 路由檢查不等同 Codex 沙箱驗證，也不會在 Codex 失敗後自動切換。
- Codex worker 在開始準備與改檔前，以相同權限政策執行無工具 PONG。登入或沙箱無法啟動時標為 `blocked`，不反覆重試；舊 read-only 探針的快取不能代替此檢查。Windows 須先完成 Codex `elevated` 沙箱設定。明確選用 Freebuff 時改驗證 MCP 路由與 session 可用性；這不是 Codex 故障時的自動降級，也沒有宣稱具備同等 OS 沙箱。
- 必須有真實 CI exit 0、CLI review 通過、原始 probe 通過，以及同一候選 commit 的完整證據。大於 60,000 字元的 diff 停止自動評審，應拆成較小 Issue。原始 probe 的期望不能由模型放寬。

準備與驗收命令是操作者提供的本機命令；目前設定使用 Windows 的 npm 命令串接。其他平台需提供可執行的命令或單一驗收腳本。CLI 使用現有訂閱額度，成本與 token 紀錄不代表免費。

本機修復設定透過 `npm --userconfig <絕對路徑>/github-repair.npmrc` 明列 `better-sqlite3@12.11.1` 的安裝腳本權限。這是遠端 checkout 在 npm 12 上載入 SQLite 的先決條件；搬移此專案時須更新兩個命令中的 npmrc 路徑。npm 12 的專案安裝須將政策放在 package.json 或 npmrc，不能把 `--allow-scripts` 直接傳給 `npm ci`。[npm 官方說明](https://docs.npmjs.com/cli/v12/commands/npm-ci/#allow-scripts)

## 背景巡檢與停止

`github-reports.json` 的 `repairConfigs` 明列可接案的修復設定。`github report` 只處理巡檢；獨立的 `github repair-batch` 每輪最多接一案，再驗證一項提案。Windows watcher 的 `-Mode reports` 與 `-Mode repairs` 使用各自的 mutex 與紀錄，長時間修復不延後巡檢。完整 CLI 與恢復命令見 [CLI 自主開發](cli-autonomy.md)。

```powershell
# 暫停修復，保留原本巡檢立案
New-Item -ItemType File data/github-repairs/autodev-ng/.adng.stop

# 查閱最近任務與原始檢查證據
node dist/cli.js github repair-status --config configs/integrations/github-repair.json
```

修復也尊重 report、fleet 與專案停止旗標。修改／關閉 Issue、撤回標籤或修改本次 repair 設定，會在接案、完成及發布邊界重新核對，候選保留供檢查。停止不會回收已經產生的 commit，也不會強制終止其他程序。使用 `repair-doctor --live` 驗證相同權限的環境，再以 `repair-resume --issue <N> --reason <說明>` 保留次數並恢復；旗標改名保存。watcher 若已退出，須重新啟動相應模式。

`publish=false`：只產生本地候選，不推送、不建立 PR、不關閉 Issue。日後明確允許推送並設定 `publish=true`，才沿用現有精確 commit 證據檢查與 draft PR 流程；自動合併／部署不在此入口範圍內。

舊通報沒有不可變的發布快照時維持待分流；本機 ledger 只能在核對既有發布收據與 GitHub 內容後補齊，不能僅憑來源標記授權修復。

## 驗證

```powershell
npm.cmd run typecheck
npm.cmd exec -- vitest run tests/github-repair.test.ts tests/github-reports.test.ts tests/github-issues.test.ts tests/github-issues-integration.test.ts tests/codex.test.ts
npm.cmd run build
npm.cmd test
```

新測試使用真實 Git／scheduler／worktree 與 CLI adapter，僅模型輸出及 GitHub 採測試替身；另涵蓋 Issue 篡改、停止、設定撤回、缺少快照、原檢查紅→綠、評審失效與 dry-run 無執行。實際模型執行須另記錄 CLI 回應、commit 與驗收結果，不能以替身測試宣稱已實跑。

Codex CLI 的非互動模式與結構化輸出旗標已對照本機 `codex exec --help` 及 [OpenAI 官方文件](https://developers.openai.com/codex/noninteractive)。

本機啟用進度及實機限制見 [2026-09-07 驗收紀錄](verification/github-repair-2026-09-07.md)。
