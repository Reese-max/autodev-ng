# Windows 主機部署與搬遷

第一版採每個 repo 固定一台執行主機；不同主機不得同時接同一 repo 的 Issue。現有 SQLite claim、成本保留與 PID 鎖只協調本機。此流程不提供跨機租約或自動故障接手。

| 能力 | 實作與驗收界線 |
|---|---|
| 獨立設定 | `host.mjs init` 只建立指定專案，mock＋暫停起步，拒絕覆寫既有目錄 |
| 環境檢查 | `doctor` 檢查版本、SQLite、Git、分支、資料路徑、引擎及憑證參照；`--live` 查 GitHub 登入與 Codex 版本，不派工 |
| 無登入啟動 | `install-host-task.ps1` 建立 Password logon 排程，支援 `-WhatIf`；目標帳號的重開機仍需實測 |
| 備份／還原 | 暫停、PID、dirty worktree、team claim 檢查；SQLite 快照、Git bundle、team.db、Issue 收據、SHA-256 完整清單；新目錄還原並保持暫停 |
| 更新／回滾 | `switch`／`rollback` 只切換通過指定 commit 驗證的 runtime；要求停止 worker／bot，保留舊版本，切換後仍暫停 |
| 外部監控 | `health` 產生主機／版本／監控收據，另一台主機執行 `check-host-heartbeat.mjs`；告警發送需接上既有監控服務 |

## 建立 runtime 與主機目錄

目標 Windows 需 Git、Node.js（CI 基準為 22）、所選模型 CLI 與 GitHub CLI。使用 `npm ci` 重新安裝原生模組，不複製舊電腦的 node_modules。工具不自動登入帳號、付費或啟用其他引擎。

```powershell
git clone https://github.com/Reese-max/autodev-ng.git C:\AutoDev\releases\candidate
Set-Location C:\AutoDev\releases\candidate
npm.cmd ci
npm.cmd run build
node scripts/host.mjs init --home C:\AutoDev\hosts\worker-a --project C:\Projects\my-project
node scripts/host.mjs doctor --home C:\AutoDev\hosts\worker-a
```

`init` 建立 host.json、configs/project.json、空白 backlog 與暫停旗標；project 必須是既有 Git repo，原工作內容不會被初始化或清空。doctor 此時應因 mock 引擎回 exit 2。

在新主機自己的 configs/project.json 設定允許引擎、verifyCommand、費用上限與通知目的地；移除 `engine: "mock"`，改設 defaultEngine 與 engines。憑證使用 `{env:VAR}`／`{file:PATH}`。不要複製原六專案 configs 或共用舊電腦的登入檔。

```powershell
node scripts/host.mjs doctor --home C:\AutoDev\hosts\worker-a --live
node scripts/verify-host-release.mjs
```

`--live` 目前只提供 Codex 版本前置探測；其他 adapter 不會被假裝驗證通過。版本、登入探測不是 sandbox 可寫入或真實 worker 成功的證據。

## 背景排程

```powershell
powershell -NoProfile -File scripts/install-host-task.ps1 -HostHome C:\AutoDev\hosts\worker-a -Role worker -WhatIf
powershell -NoProfile -File scripts/install-host-task.ps1 -HostHome C:\AutoDev\hosts\worker-a -Role worker
powershell -NoProfile -File scripts/install-host-task.ps1 -HostHome C:\AutoDev\hosts\worker-a -Role health
```

正式註冊時提示輸入已完成 CLI 授權的執行帳號。密碼不放入命令列或 repo；使用 Password logon。預設不註冊 Discord bot：只有此主機要承接唯一控制入口時，才以 `-Role bot` 註冊。同名任務拒絕覆寫。

移除暫停旗標前，先完成 repo ownership 交接與指定測試任務授權。可在暫停期間驗證開機觸發及 health 收據，不能把 Task Scheduler 成功當成 worker 成功。

## 舊主機備份、新主機還原

暫停來源專案及相關 GitHub integration，停止其排程接新工作，等 worker 完成；保留既有暫停理由。backup 拒絕活躍 PID、active team claim、dirty worktree、符號連結及既存目的地。

```powershell
node scripts/host.mjs backup --config C:\OldHost\configs\project.json --out E:\AutoDevBackups\snapshot-001
node scripts/host.mjs restore --from E:\AutoDevBackups\snapshot-001 --home C:\AutoDev\restored-a
node scripts/host.mjs doctor --home C:\AutoDev\restored-a\host
```

備份為私有敏感資料，需受控／加密儲存；工具不把它推送 GitHub。已知 token/auth、PID、heartbeat、lock、node_modules 不搬移，排除清單保存於 manifest；此機制不是完整秘密掃描。任何讀取／SQLite 錯誤回非零，僅留下 `.partial-*` 診斷目錄，不覆寫上一份備份。

還原前驗證完整清單及雜湊。project 由 bundle 重建，資料與原始收據保留，所有 integration 強制 disabled。舊命令／其他路徑、Git origin、工作樹、外部報表設定及憑證必須重新核對；不改寫原收據中的絕對路徑及雜湊，也不將舊收據視為新主機已驗收。repo 位於 `<目的地>/project`，host 位於 `<目的地>/host`。

一般 Git push 不是狀態備份。舊 memory-snapshot.mjs 仍是每日鏡像，現在只有 push 成功才更新日戳，失敗 exit 1，且要求預先設定 backup origin；正式搬遷使用上述獨立快照。

## 更新與回切

新版另存乾淨 release 目錄，執行 `node scripts/verify-host-release.mjs`。它保存 build/typecheck/完整測試的結束碼與 commit，失敗即撤銷綠燈收據。

```powershell
node scripts/host.mjs switch --home C:\AutoDev\hosts\worker-a --runtime C:\AutoDev\releases\next
node scripts/host.mjs rollback --home C:\AutoDev\hosts\worker-a
```

切換前暫停並停止 worker／bot，工具拒絕活躍 PID。原 runtime 必須保留，排程 launcher 仍由安裝時版本讀取 host profile。切換不啟動服務、不改寫資料庫 schema；若新版有 schema 變更，先驗證備份與還原。切換後重新驗收再開放派工，無自動跨機接手保證。

## 外部心跳與正式驗收

```powershell
node scripts/host.mjs health --home C:\AutoDev\hosts\worker-a --out C:\AutoDev\hosts\worker-a\data\host-health.json
# 在另一台主機對受控傳輸／分享取得的收據檢查
node scripts/check-host-heartbeat.mjs --file C:\Monitoring\worker-a.json --host <host.json內的hostId>
```

health 在 paused／not-running／stale／unknown／blocked 時 exit 2；讀取或命令錯誤 exit 1；觀測到新鮮 worker 心跳 exit 0，仍不代表任務成功。外部檢查預設 3 分鐘過期；須在另一台主機執行並接上告警，不能由被監控主機自行宣稱「離線告警完成」。

上線逐項保存時間、主機、commit、結束碼及證據：

1. 未登入桌面重新開機，確認正確帳號、版本與設定來源。
2. 指定測試 repo：Issue → 真實 worker 修改 → 測試 → 草稿 PR；無重複接單，帳務來源可追溯。
3. 中斷 worker、網路或憑證失效：不假成功、不無限重試，保留失敗狀態與告警。
4. 新路徑還原後成本／重試次數／Issue 收據一致；更新失敗可回切舊版本。
5. 舊主機停止接單，最後備份／還原後才啟用新主機；回切先停止新主機並核對已完成工作。

跨機共享租約與 fencing、跨機總預算、Linux CI 及自動故障接手屬後續階段。尚無第二台主機與真實測試 repo 收據時，只能標記本機元件驗收。
