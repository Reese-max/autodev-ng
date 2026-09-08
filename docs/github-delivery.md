# GitHub 交付與日常操作

GitHub 案件沿用原本的 runner、scheduler、worktree、測試與 reviewer。新增功能把中斷恢復、PR 後續修正、專案驗收與控制台接到同一份案件紀錄。合併、部署及人工驗收不由模型自行宣告。

## 控制台

照原本方式建置並啟動 `web/server.mjs`。專案頁的「GitHub 案件與交付」會發現 sourceConfig 同目錄 `integrations/*.json` 中，明確指向該 sourceConfig 的單一 repository 設定。

- 查看案件、次數上限、修正輪次、失敗原因、歷史、commit、PR 連結與證據目錄。
- 「檢查交付證據」重新驗證候選 commit 的測試、reviewer、合併及回歸收據。
- 「設定診斷」檢查設定、Git／GitHub／所需 CLI 登入；不啟動修復模型。
- 「檢查並重排／恢復」必須提供具體原因，沿用 CLI 的鎖與恢復規則。
- 「更新 PR 狀態」只讀 GitHub；明確開啟 followup 時可排入後續修正，但不在 HTTP request 中執行 worker。
- GitHub 的 GET 與 POST 都要求原控制台 token；不接受瀏覽器指定任意設定檔路徑。

此介面針對單一 repo integration；owner 自動產生的 repo 設定可繼續使用 CLI。控制台不建立額外的帳號、服務或排程。

## 診斷與恢復

```powershell
node dist/cli.js github doctor --config configs/integrations/github-issues.json
node dist/cli.js github doctor --config configs/integrations/github-issues.json --live
node dist/cli.js github retry --config configs/integrations/github-issues.json --issue 7 --reason "已修復 CLI 登入並檢查原有成果"
node dist/cli.js github resume --config configs/integrations/github-issues.json --issue 7 --reason "已核對暫停原因、設定及原有成果"
```

既有 `repair-doctor`／`repair-retry`／`repair-resume` 保持相容；一般 Issue 使用相同實作。

一般 doctor 的 `ready=false` 表示尚未執行 worker preflight，不能當作完整可用性驗收；`--live` 會執行所選引擎既有 preflight，其成本與權限依 adapter 而定。診斷不執行專案測試，`verification.executed=false` 明確保留這個區別。

恢復會核對原始 Issue 快照、作者／標籤、設定、停止旗標、現有 PR、checkout 與 worktree。已完成且有完整證據的 commit 可恢復成 ready，無須重新派工。未提交變更、無法對應的 commit、缺失的原始 checkout 或耗盡的次數會保留現場並拒絕恢復。backlog 已被人工修改或已標成 blocked/done 但沒有完整交付證據時，仍需人工核對，不會自動覆寫。

每次操作保留 prepared／completed recovery receipt，`runs` 不歸零。一般 `run` 的失敗重試佇列也回傳非零結束碼，不能被 watcher 當成成功完成。

## PR 後續修正

在經操作者審查的單一 repo integration 加上：

```json
{
  "followup": true,
  "enabled": true,
  "publish": true,
  "maxRuns": 3
}
```

`followup` 預設 false。開啟後，既有 `github run`／watcher 會觀察 published PR：

1. 核對同一個 PR、base 與已發布的 head；人工改動分支時停止自動續作。
2. 等待 pending checks。失敗的 GitHub checks，或 `authors` 允許的 reviewer 對目前 head 提出的 CHANGES_REQUESTED，可成為下一輪需求。
3. 審查留言與行內留言一律視為不可信需求資料，不提供額外工具權限。過期／撤回的 review 不會觸發修正。
4. 把下一輪排入既有 retryMs 冷卻佇列，保留原 Issue 與前輪全部目錄。
5. 在 `issue-N/revisions/R/` 從前輪 commit 建立獨立 checkout，再走完整測試、reviewer 與紅／綠回歸。
6. 使用一般 fast-forward push 更新同一 PR，不 force push、不重開 PR、不自動合併。

初次執行與所有後續修正共用 `maxRuns`，不是每輪重新給額度。預設 Node 測試的新輪次檔名為 `github-N-rR.test.cjs`，前輪測試持續保留。每次新修正必須確實產生可重現的 regression；純環境或基礎設施失敗仍可能需要人工處理。

通報修復的原始 probe 快照仍維持既有政策；`repair` 模式發布後不自動延伸成 PR 修正。超過 100 筆 reviews／comments 或 20,000 字元的回饋會要求拆分，避免靜默漏掉審查要求。

## 不同技術棧的回歸與驗收

沒有新增設定時，保留既有 Node 回歸規則。其他技術棧可以明確設定一個新增測試檔與無 shell 的命令。例如 Python unittest：

```json
{
  "regression": {
    "file": "tests/regressions/github-{issue}-{revision}.py",
    "command": "python",
    "args": ["{file}"],
    "passPattern": "Ran [1-9][0-9]* tests?[\\s\\S]*OK",
    "failPattern": "AssertionError"
  },
  "acceptance": {
    "command": "python",
    "args": ["-m", "unittest", "discover", "-s", "tests", "-v"]
  }
}
```

`file` 限於 tests/regressions 的單一新增檔案，必須含 issue／revision placeholder；命令必須使用 `{file}`。測試需自行設定正確的匯入路徑。基線只複製該新增測試，準備環境沿用 `regressionPrepareCommand`。候選 exit 0 並符合 passPattern，基線 exit 1 並符合 assertion failPattern，兩者均不得逾時；設定及測試雜湊綁定收據。

自訂 pattern 由操作者負責對應測試框架的實際輸出，不能設為寬鬆的「任意輸出」。宿主不會從 Issue 推導或覆寫驗收命令。已有測試的修改／刪除／改名依然交由人工審查。

`acceptance` 是候選上的額外驗收命令，可呼叫專案既有瀏覽器或整合驗證程式。成功／失敗輸出均保存；只有成功、HEAD 與原始碼未改變的收據可通過發布檢查。命令須限於已授權的測試環境；它不是自動部署入口。

新增測試仍須接入目標 repo 的長期 CI。AutoDev 自身現有 CI 保留 Node regression，新支援的框架應由該 repo 的既有測試命令收集。

## 完成分層

```powershell
node dist/cli.js github delivery --config configs/integrations/github-issues.json --issue 7
node dist/cli.js github metrics --config configs/integrations/github-issues.json
node dist/cli.js github accept --config configs/integrations/github-issues.json --issue 7 --commit <候選SHA> --reason "合併後已在指定環境實際驗證問題不再發生"
```

分別記錄 verified candidate、GitHub checks、merged 與 human acceptance。`accept` 要求已驗證的 published candidate、GitHub 已確認合併且 head 相符、gh 登入者位於 authors，以及具體驗收證據文字。它記錄操作者的驗收聲明，不會自行證明部署結果。驗收只綁定該 commit，下一輪修正不繼承。

`{env:NAME}`／`${NAME}`／`{file:path}` 明確引用的啟用中憑證缺少、空白或不可讀時，設定解析立即失敗且不回傳密鑰內容。CLI 登入模式不解析未使用的 HTTP judgeApiKey，未設定的選用整合維持停用。

## 驗證

`tests/github-delivery.test.ts` 覆蓋一般 Issue 恢復、PR 禁止派工條件、HTTP 權限與設定路徑隔離、Python 紅／綠及驗收收據。

`tests/github-issues-integration.test.ts` 使用真實 Git、scheduler、worktree、測試及本機 bare remote，驗證兩輪修正更新同一 PR，再驗證人工驗收要求。模型及 GitHub API 為測試替身，不代表遠端實機驗收。

Windows 本機瀏覽器驗收：先 build，再執行 `node scripts/verify-github-console.mjs`。使用獨立 Chrome profile、fixture HTTP server 與資料目錄；檢查鍵盤、需求文字跳脫、恢復原因與手機寬度，產出 `data/verification/github-console/` 截圖和收據，不執行 worker 或 GitHub 寫入。
