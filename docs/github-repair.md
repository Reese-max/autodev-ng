# CLI 自動修復

已核對的巡檢缺陷可由 CLI 自動接案，在隔離 checkout 重現問題，呼叫 Codex CLI 修復，再執行專案測試、獨立 Codex CLI 評審及原始檢查。成功會保存本地修復 commit 與驗收證據。

```powershell
npm.cmd run build
node dist/cli.js github repair --config configs/integrations/github-repair.json --dry-run
node dist/cli.js github repair --config configs/integrations/github-repair.json
node dist/cli.js github repair-status --config configs/integrations/github-repair.json
```

`--dry-run` 只讀 GitHub 與本地紀錄，列出符合修復政策的 Issue；不建立任務、執行命令或啟動模型。`repair` 每次最多處理一案，失敗依 `retryMs` 與 `maxRuns` 限制重試；程序中斷保留現場並標為 blocked。`repair-status` 顯示候選 commit、狀態與資料路徑。`ready` 代表隔離 checkout 的驗收通過，主工作目錄尚未套用。

## 接案與驗收

- 使用獨立的 `github-repair.json`，明列 repo、作者、Codex engine、可修復的 `probeIds`、準備命令與測試命令。路徑相對於設定檔。目前只設定 `autodev-ng` 的 `cli-help` 檢查。
- `repair.reportConfig` 指向原通報設定；必須是同一 repo／sourceConfig。接案核對通報 ledger 的 Issue 編號與不可變發布快照、GitHub 作者、標籤及本地檢查命令。只信本地設定的 argv，Issue 文字不是命令授權。
- 只有已發布、可重現的 runtime 缺陷能接案。外部靈感、靜態推論、缺少快照的舊案、`needs-validation`、`no-autofix`、移除標籤或被編輯的 Issue 都不自動修復。一般人工 Issue 仍使用原本的 `github run`。
- 先 clone GitHub 的指定分支，執行 `prepareCommand`，再執行同一 probe 兩次；輸出與結束碼須一致且符合原始失敗。依賴或建置失敗、逾時、不同錯誤、已無法重現都保留現場，不能當成修復成功。
- 修復沿用 scheduler、worktree 與宿主提交，保留 sourceConfig 的範圍約束。worker 不自行提交、推送或部署。主工作目錄的未提交內容不會被移動或覆寫。
- worker 與獨立 reviewer 均使用 Codex CLI 及現有 ChatGPT 登入；忽略使用者 CLI 設定與 rules，不改寫登入或全域設定，不使用 API key／HTTP judge。Reviewer 不可執行工具；失效或拒絕不會退回自動通過。
- 必須有真實 CI exit 0、CLI review 通過、原始 probe 通過，以及同一候選 commit 的完整證據。大於 60,000 字元的 diff 停止自動評審，應拆成較小 Issue。原始 probe 的期望不能由模型放寬。

準備與驗收命令是操作者提供的本機命令；目前設定使用 Windows 的 npm 命令串接。其他平台需提供可執行的命令或單一驗收腳本。CLI 使用現有訂閱額度，成本與 token 紀錄不代表免費。

## 背景巡檢與停止

`github-reports.json` 的 `repairConfigs` 明列可接案的修復設定。每次 `github report` 完成後最多接一案，現有十五分鐘 watcher 與 supervise 巡檢會使用相同入口；`report-collect` 和 `report --dry-run` 不接案。依序修復，可能延長該輪巡檢時間；這是單機、單一啟用設定的初版限制。

```powershell
# 暫停修復，保留原本巡檢立案
New-Item -ItemType File data/github-repairs/autodev-ng/.adng.stop

# 查閱最近任務與原始檢查證據
node dist/cli.js github repair-status --config configs/integrations/github-repair.json
```

修復也尊重 report、fleet 與專案停止旗標。修改／關閉 Issue、撤回標籤或修改本次 repair 設定，會在接案、完成及發布邊界重新核對，候選保留供檢查。停止不會回收已經產生的 commit，也不會強制終止其他程序。確認後移除自己建立的修復停止旗標，下一輪既有 watcher 即可再接案。

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
