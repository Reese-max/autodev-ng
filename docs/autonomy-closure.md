# 自主運作完成條件

目的沿用專案 NORTHSTAR：從真實使用者問題、可重現缺口與外部資料提出需求，經價值驗證後開發、審查、交付，再用結果修正下一輪。測試通過、使用者覺得有用、主機穩定運作分別記錄。

## 完成判定

- `NOT ACHIEVED`、無效審查回應、審查例外與機械驗收失敗都不能產生 achieved。
- 自主 GOAL 必須有可執行的驗收；CLI 模式必須使用不同模型審查。新 GOAL 的原始紅燈無法驗證時不立案。
- 最終 GOAL 紀錄與 ROI 必須等補充審查通過。成果已合併而任務狀態寫入失敗時暫停，保留原始成果與收據供恢復。

## Astra 路由與用量

`configs/autodev-self.json` 的開發候選只保留 `codex-astra`（`gpt-6-astra`、`max`）；判斷及研究走 `gpt-6-astra`，獨立審查走 `gpt-5.6-sol`。GitHub repair 使用相同開發引擎。已有 GOAL 的引擎指定會覆蓋預設，操作時必須一併檢查。

自我專案設定 `dailyAttemptCap: 6`。UTC 每日共用 Git team 帳本在 SQLite transaction 內計數，直接工作與 repair checkout 共用來源帳本；釋放租約、重啟或換 Issue 不能清零。額度不足時延後，尚未執行 worker 的 GitHub 延後不消耗 Issue 重試次數。計數不可讀時不假設為零。

這是開發派工次數上限；預檢、判斷、研究與審查仍可能使用訂閱額度，並受各自逾時、研究間隔及 GOAL 輪數控制。`subscription: true` 的 `costPerRunUsd: 0` 只代表不計入美元帳，不能用來宣稱零用量或帳號配額充足。

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
