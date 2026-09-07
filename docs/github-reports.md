# 自動巡檢立案與使用者研究

`github report` 將可重現問題與有來源的改善提案建立為自己專案的 GitHub Issue。接入 `supervise --configs-dir configs`，也可獨立以十五分鐘排程執行。設定 `repairConfigs` 可在通報後接續 [CLI 自動修復](github-repair.md)；未設定時維持只通報。修復的 PR 推送有獨立開關，不建立新 GOAL。

```powershell
node dist/cli.js github report-status --config configs/integrations/github-reports.json
node dist/cli.js github report-collect --config configs/integrations/github-reports.json
node dist/cli.js github report --config configs/integrations/github-reports.json --dry-run
node dist/cli.js github report --config configs/integrations/github-reports.json
```

`report-collect` 執行設定中的檢查與到期研究，只保存本地證據；`--dry-run` 只讀已有證據與 GitHub 狀態，列出預覽，不執行檢查命令、模型或 GitHub 寫入。

## 證據與情境

- 設定中的 `probes` 是管理者指定的 argv；模型產生的文字絕不當作命令。失敗須連續兩次輸出與結束碼一致，逾時或無法啟動不當作產品缺陷。根目錄 README 缺檔由 Git 追蹤清單確認，明確標成靜態觀察。
- 三個固定任務涵蓋首次使用、部分失敗恢復、來源追溯。persona ID 對照既有 [50-persona 規則](portfolio-audit/2026-09-06-50-persona-audit.md)，不是五十個常駐 agent，也不代表真人測試或完整瀏覽器驗收。
- 每週研究一次／專案，每輪最多研究一個專案、讀取五個公開來源、產生三個候選、評審一個候選。來源包括 GitHub 公開 Issues 與指定官方文件；文件由既有 AnySearch 擷取。搜尋只使用設定內的公開關鍵字，不傳私人原始碼、日誌或使用者訊號。
- 研究沿用 Codex 登入，以唯讀、停用工具的結構化輸出執行，不新增 API key。`USER-SIGNALS > NORTHSTAR > 設定用途摘要 > 外部來源`；用途摘要不是新 GOAL 的授權。
- 改善提案須對上指定任務、提供本專案文件的逐字引文、引用已擷取的來源，價值至少 8／10，再經第二次獨立評審。API／模型失敗沒有備援通過分數。已存在的 Issue 會提供給評審排除同案。
- 缺少本機 HEAD、origin 不符會阻擋該專案蒐證。追蹤檔案未提交時不執行 runtime 檢查；靜態研究仍可明確針對 Git HEAD。刻意暫停的服務依設定約束保留，不把 503 當成新故障。

## 發布、去重與停止

所有新案都有 `autodev-reported`、`needs-triage`；改善提案另有 `needs-validation`。一般接單端即使 `label: null`，也排除自動來源標記或 `autodev-reported` 標籤；明列的 CLI 修復政策只接收有不可變發布快照及可重現檢查的缺陷。既有人工 Issue 契約保留。

每個 repo 每輪最多一張、滾動二十四小時最多三張；六個設定專案合計最多十張。每次 API 寫入前重查停止旗標與設定內容。GitHub 錯誤至少退避一小時，並尊重回傳的 Retry-After／reset；無原地重試迴圈。

狀態放在 `data/github-reports/state.json`；沿用原子 rename 與本機檔案鎖。發送前先保存 `publishing`，建立後 API 讀回內容、作者、URL 與標籤才算 `posted`。重啟會先完整查詢含已關閉的 Issues；回應不明只核對來源標記，未找到也不盲目再發。

人工關閉、移除標記或刪除 Issue 不會被自動覆寫或重開。已有缺少 README 的人工 Issue 會直接關聯。相同檢查／情境使用穩定指紋，時間、版本、措辭和 persona 不改變身分。第一版不自動補留言或重開復發案。

若狀態損壞或 Issue 分頁未完整讀取，停止發布。這是單一主機、同一帳號 ledger 的限制；第二台 reporter 上線前需要共用租約。不同 dataDir 的多份啟用設定不受同一把鎖保護，不應並行啟用。

停止整體通報可建立 `data/github-reports/.adng.stop`；亦尊重 `configs/.adng.stop` 與個別專案的停止旗標。已送達 GitHub 的請求不能取消，下一輪只核對結果。`publishing` 長期無遠端對應時應查閱本地記錄與 GitHub，不能直接刪 ledger 重試。

```powershell
powershell.exe -NoProfile -File scripts/install-github-issues-task.ps1 -Mode reports -Config configs/integrations/github-reports.json -WhatIf
powershell.exe -NoProfile -File scripts/install-github-issues-task.ps1 -Mode reports -Config configs/integrations/github-reports.json
```

排程名稱 `adng-github-reports-Reese-max`，使用目前登入者的互動登入身分；登出時不能保證執行。任務註冊不等於驗收，須核對 `report-status`、實際 Issue URL 與重跑不重複的結果。

本機於 2026-09-07 註冊排程遭 Windows 拒絕（`0x80070005`），目前改用既有背景 watcher 的通報模式，每輪間隔十五分鐘；登入時由 `AutoDevNG-GitHub-Reports.lnk` 啟動。命名 mutex 及 reporter 檔案鎖會阻擋重複執行。未登入、電腦關機或休眠時不會持續巡檢。

```powershell
# 查看實際背景巡檢結果
Get-Content data/github-reports/watcher.json -Encoding UTF8
Get-Content data/github-reports/last-run.log -Encoding UTF8

# 清除自己建立的停止旗標後，可由登入捷徑恢復背景巡檢
Start-Process (Join-Path ([Environment]::GetFolderPath('Startup')) 'AutoDevNG-GitHub-Reports.lnk')
```

背景腳本為 `scripts/watch-github-owner.ps1 -Mode reports -Config <設定路徑>`；未指定 `-Mode` 仍保持原本接單 watcher 行為。Windows PowerShell 5.1 的設定讀取已明示 UTF-8，保留繁體中文。停止旗標讓 watcher 結束後，單純移除旗標不會重新啟動程序，須執行捷徑或等下次登入。

## 驗證

```powershell
npm.cmd run typecheck
npm.cmd exec -- vitest run tests/github-reports.test.ts tests/github-issues.test.ts tests/github-client.test.ts tests/github-owner.test.ts tests/github-issues-integration.test.ts
npm.cmd run test:flaky-regression
```

測試覆蓋二十輪去重、POST 回應遺失、狀態損壞、來源／引文拒絕、模型拒絕、停止、限額與接單隔離。實際啟用證據另記於 [啟用驗收](verification/github-reports-2026-09-07.md)。
