# Freebuff

Freebuff 可用於手動 backlog、一般 GitHub Issue 接單及具備本地原始 probe 的通報修復。使用現有本機 `freebuff-mcp` stdio 服務，不新增 npm 依賴。

本機需有已登入的 Freebuff、Bun，以及 `~/freebuff-mcp/server.ts`。Windows 從 PATH 尋找 `bun.exe`，其他平台使用 `bun`；可用引擎的 `command` 指定其他 Bun 執行檔，避免依賴舊版的固定安裝位置。

## 使用

`configs/autodev-self.json` 已註冊 `freebuff`；既有預設引擎與輪替維持原設定。明確派工可在 backlog 使用：

```markdown
- [ ] 修正指定問題，並通過專案驗收 [engine:freebuff]
```

GitHub 接單範本為 `configs/integrations/github-freebuff.example.json`。操作者確認 repo、作者、標籤及授權工作範圍後，複製成自己的設定檔並啟用；`engine` 必須由本機設定選擇，Issue 文字不構成引擎或工具授權。範本預設不執行、不發布。既有通報修復設定也可明確選擇 `engine: "freebuff"`，原始 probe、獨立 Reviewer、精確 commit 與恢復檢查仍適用。

```powershell
npm.cmd run build
node scripts/check-freebuff.mjs
node scripts/check-freebuff.mjs --live
```

第一個檢查只讀取 MCP 路由；`--live` 會在 `data/maintenance/freebuff/check-*` 建立獨立測試 repo，要求真實 Freebuff 修正一個加法錯誤，核對測試紅轉綠、只改指定檔案及新 commit。收據保留在該目錄；不會推送或修改正式任務。此檢查證明 adapter 真實流程，不等同 GitHub 真實 Issue 的端到端交付。

## 行為與限制

- 依 MCP 回報的 tier 自動選模型，僅接受符合路由的模型與推理證據；缺證據、額度不足或其他 session 占用時回報失敗。
- 不指定模型、不強制換模型、不接管其他作用中的 session；最多 20 步，預設 30 分鐘 wall timeout。`model`、`effort`、`env`、`provider`、`idleTimeoutMs` 自訂值會被設定驗證拒絕，避免靜默忽略。
- 使用同一使用者的 `~/.autodev-ng/freebuff.lock` 協調各專案；只管理自己啟動的 MCP 子程序。
- Worker 記帳為 0 美元；Reviewer 與語意驗證沿用原設定，不代表整條流程沒有訂閱或模型配額需求。通報修復的獨立 Reviewer 仍使用 Codex CLI。
- `tierMode: "free-only"` 也接受標準 `freebuff` 引擎名稱；MCP 沒有逐輪 token 計價資料，因此不虛構節省金額或影子價格。
- worktree 與 prompt 提供工作範圍限制，並非作業系統沙箱。`repair-doctor --live` 對 Freebuff 驗證的是路由可用性，不代表通過 Codex 沙箱測試。
- Worker 只能實作及本機提交；推送、PR、部署與其他外部動作仍由宿主依既有授權與驗收閘處理。

## 本機驗證（2026-09-08）

- `npm.cmd run typecheck`、`npm.cmd run build`：exit 0，憑證掃描通過。
- `npm.cmd test -- tests/freebuff.test.ts tests/shadow-price.test.ts tests/github-repair.test.ts tests/github-issues.test.ts tests/github-issues-integration.test.ts tests/engine-registry-command.test.ts tests/project-layout.test.ts tests/types.test.ts tests/kernel-relocation-report.test.ts tests/kernel-slim.test.ts tests/free-tier-v1 --reporter=dot`：12 個測試檔、96 項測試通過，exit 0。
- 真實 `node scripts/check-freebuff.mjs --live`：exit 0、`LIVE_ADAPTER_PASS`；Limited／`deepseek/deepseek-v4-flash`／max，測試由 exit 1 轉為 0，僅修改 `sum.cjs`，產生 commit `ef047249b3a7b2f610da57fcc05dbc4baadb0b53`。收據：`data/maintenance/freebuff/check-gSnN6v/receipt.json`。
- 最終完整回歸 `npm.cmd test -- --reporter=dot`：181 個測試檔、1743 項測試全部通過，exit 0，耗時 572.41 秒；前一輪的兩項失敗均已排除。紀錄：`data/maintenance/freebuff/full-test-final.log`。
- 本機專案設定及 GitHub Freebuff 範本均通過實際設定解析（`CONFIG_PASS`）；原預設引擎維持 `codex-sol`，GitHub 範本未啟用、未發布。
- GitHub 修復測試使用真實本機 Git／排程／probe，MCP、GitHub 與 Reviewer 為測試替身；真實 GitHub Issue 交付尚未驗證。
