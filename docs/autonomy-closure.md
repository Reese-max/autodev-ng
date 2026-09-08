# 自主運作完成條件

目的沿用專案 NORTHSTAR：從真實使用者問題、可重現缺口與外部資料提出需求，經價值驗證後開發、審查、交付，再用結果修正下一輪。測試通過、使用者覺得有用、主機穩定運作分別記錄。

## 完成判定

- `NOT ACHIEVED`、無效審查回應、審查例外與機械驗收失敗都不能產生 achieved。
- 自主 GOAL 必須有可執行的驗收；CLI 模式必須使用不同模型審查。新 GOAL 的原始紅燈無法驗證時不立案。
- 最終 GOAL 紀錄與 ROI 必須等補充審查通過。成果已合併而任務狀態寫入失敗時暫停，保留原始成果與收據供恢復。

自我專案啟用 `alternativeRetry: true`：同一任務累積三次任務／驗收失敗後，再給一次替代方案修復。第 4 次使用「最小重現、追查呼叫端與共用根因、不同實作、完整回歸」指令，沿用原任務、Astra writer、獨立審查與驗收；再失敗即 blocked。這是不同修復流程的派工契約，不保證模型一定找得到新解法。既有持久失敗計數不清零，啟動前以排他寫入保存 `dataDir/alternative-retries/` 收據；重啟或供應中斷不重發額度。沙箱、權限、驗收基礎設施故障仍直接阻擋。GitHub runner 只有收到 scheduler 的二次修復待辦證據才允許第 4 次，保留原本 runs。其他專案預設停用，free-only 沿用原有拆解流程。

## Astra 路由與用量

`configs/autodev-self.json` 的開發候選只保留 `codex-astra`（`gpt-6-astra`、`max`）；判斷及研究走 `gpt-6-astra`，獨立審查走 `gpt-5.6-sol`。GitHub repair 使用相同開發引擎。已有 GOAL 的引擎指定會覆蓋預設，操作時必須一併檢查。

依使用者要求，自我專案與繼承其設定的 GitHub repair 不設定 `dailyAttemptCap`，不因每日派工次數停止，可供全天持續運作。仍保留執行紀錄、同一任務的重試次數、逾時、暫停與單一寫入者保護；實際常駐啟用另須通過下方驗收。

預檢、判斷、研究與審查同樣不加每日次數上限，保留各自逾時、研究間隔及 GOAL 輪數控制。`subscription: true` 的 `costPerRunUsd: 0` 不計入美元帳；付費 API 的美元預算保護仍保留。服務端限制不由本專案設定控制。

## 學習與使用者回饋

沿用既有 lessons 的注入、反思與獨立審核。自動修復將教訓寫回來源專案，下一個 Issue 與一般工作都可讀取；共用檔案以既有檔案鎖序列化寫入，讀取錯誤不得當空檔覆寫。每次開始與結束另記 execution、任務、模型、基準 commit、教訓內容雜湊、耗時及交付結果；沒有結束紀錄的執行列為中斷／待定。

```powershell
node scripts/learning-report.mjs --config configs/autodev-self.json --repair-config configs/integrations/github-repair.json
```

退出碼：`0` 有觀測、`2` 尚無觀測、`1` 讀取或資料完整性失敗。只有任務、模型、基準 commit 相同，而且有／無教訓各至少三次觀測時才顯示差異；不宣稱因果改善。報表使用保留中的事件紀錄，長期比較前先封存事件。沒有真實樣本時不可用測試資料冒充進步。

```powershell
node dist/cli.js github proposal-status --config configs/integrations/github-reports.json
node dist/cli.js github proposal-feedback --config configs/integrations/github-reports.json --id <proposal-id> --outcome helpful --reason "實際使用後的具體結果，至少八個字元"
```

回饋保留操作者原話，不能由代理代填「有用」。回饋另附當時的 `delivery`：只有相符任務、CI、審查及合併收據的雜湊鏈完整時才標記 `locally-verified` 並附 commit；其餘為 `unverified`。本機交付證據不代表已部署。重送相同回饋不重複寫入，不允許覆蓋原始回饋。

## 啟用與交付

先提交候選，再執行 `node scripts/verify-host-release.mjs`；它對同一乾淨 commit 保存 build、typecheck、完整測試結束碼。主機啟用、優雅重啟、備份／還原與回切沿用 [主機部署程序](host-deployment.md)。新資料表可由舊版忽略，但回切前仍須保存 team 帳本與確認無活躍工作。

2026-09-08 的真實 CLI 檢查卡在 Windows sandbox：官方 `windowsSandbox/readiness` 回覆 `updateRequired`，CLI 日誌指出 sandbox users 與 marker 版本不相容。這是待完成的系統初始化；不能改成較弱沙箱以通過驗收。官方 elevated setup 需要 Windows 管理員核准，完成後須重新跑同政策 CLI preflight 與指定 Issue 的完整流程。

以下證據仍須真實取得，不能由單元測試代替：指定 Issue 的 worker 修改與完整審查收據、實際部署／草稿 PR（依授權）、無桌面登入的開機復原、外部主機失聯告警，以及使用者採用後的結果。第二台主機未指定前，採單主機所有權，不自動跨機接手。
