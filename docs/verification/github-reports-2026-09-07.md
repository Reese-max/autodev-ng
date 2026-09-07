# GitHub 自動通報啟用驗收

日期：2026-09-07。狀態：**已啟用並接入巡檢**。實際建立 [autodev-ng Issue #4](https://github.com/Reese-max/autodev-ng/issues/4)，立即重跑未重複建立。新案保持待分流，未啟用自動修復或推送。

保留並提交先前清理基線；主邏輯新增於 `src/github/`、`src/autopilot/`，沒有新增相依套件或 kernel 頂層行數。版本只在本機提交，沒有執行 git push。

## 測試與實際流程

| 驗證 | 結果 |
|---|---|
| `npm.cmd run typecheck` | exit 0，TypeScript 與憑證掃描通過 |
| GitHub 相關五個規格檔 | 新功能擴充期間全綠；最終 reporter 規格共 12 項，exit 0 |
| `npm.cmd run test:flaky-regression` | exit 0；完整 Vitest 兩輪分別 516785 ms、478423 ms；目前共 178 個規格檔 |
| 版本一致性 | 全套回歸開始及結束均為乾淨提交 `e39e12342b94e04e59c5ebf1898fe6f4860c48fe` |
| 真實公開來源 | 3 筆公開 GitHub CLI Issues，加上 OpenAI 非互動執行官方文件，共 4 筆有 URL 與擷取時間的來源 |
| 真實模型研究 | Finder exit 0、77140 ms；獨立 Critic exit 0、20632 ms。候選因本專案證據不足被拒絕，未強制立案 |
| `github report-collect`／`report --dry-run` | exit 0；產生預覽，未寫入 GitHub |
| 真實巡檢缺陷 | `node dist/cli.js --help` 連續兩次 exit 1、輸出一致；期望正常說明與 exit 0 |
| 程式自動發送 | `reported=1; pending=0; uncertain=0`；API 讀回作者、標題、完整多行內文、URL、標記及標籤一致 |
| 立即重跑 | `reported=0; pending=0; uncertain=0` |
| 接單隔離 | 以實際 Issue #4 驗證 `label: null` 的 `eligible()`，結果 false |
| 六專案正式回合 | exit 0；`reported=0; pending=0; uncertain=0`，沿用試行案、辨識既有文件 Issue |
| 排程安裝器 | PowerShell 7 與修正後的 Windows PowerShell 5.1 `-WhatIf` 均 exit 0；實際 Task Scheduler 註冊遭 `0x80070005` 拒絕 |
| 背景替代方案 | 隱藏 watcher 實際完成一輪、exit 0；重複啟動的程序 exit 0 並讓出 mutex；原 watcher 仍存活 |

全套回歸後只修改 Windows 安裝／watcher 腳本及文件，`src/`、`configs/`、套件與測試內容未再變更。腳本另以 Windows PowerShell 5.1 實際執行驗證，沒有將 Task Scheduler 的權限失敗當成註冊成功。

## 啟用範圍與限制

| 專案 | 第一輪結果 |
|---|---|
| `Reese-max/autodev-ng` | 已立 Issue #4；外部研究與獨立評審完成 |
| `Reese-max/gooaye` | 本機 Git 尚無 HEAD，記錄蒐證受阻，不猜測用途或產生缺檔案 |
| `Reese-max/neciken-summer-poem` | CLI help 檢查未出現問題；後續研究依週期輪替 |
| `Reese-max/note-filler` | README 缺口已由既有 Issue #1 追蹤，未新增重複案 |
| `Reese-max/prompt-autoresearch` | README 缺口已由既有 Issue #1 追蹤，未新增重複案 |
| `Reese-max/taiwan-intel-dashboard` | 保留刻意暫停的服務狀態；未當作新故障或重新部署 |

每次最多研究一個專案、每專案每週一次；三個情境使用既有 B02、I05、B04 persona。這不是完整五十人研究、真人測試或所有瀏覽器使用者旅程的驗收。靜態改善提案一律標示待驗證。

目前以登入者背景程序執行，每輪間隔十五分鐘。登入捷徑位於：

`C:\Users\Administrator\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\AutoDevNG-GitHub-Reports.lnk`

首輪背景程序於台灣時間 18:56:56 完成，`mode=reports`、`exitCode=0`。實際 watcher PID 為 48660；外層 PowerShell 隱藏視窗 wrapper PID 為 47900。PID 只代表當時證據，後續請讀取 `watcher.json` 並重新驗活。未登入、休眠與關機期間不提供持續巡檢。

## 本機證據

- `data/maintenance/github-report-activation/full-regression-result.json`、`full-regression-final.log`：兩輪完整回歸與首尾版本。
- `data/maintenance/github-report-activation/pilot-result.json`：Issue URL、API 讀回與接單排除。
- `data/maintenance/github-report-activation/preview/verified-sources.json`、`preview/research/`：公開來源、結構化候選、獨立否決與用量／結束碼。
- `data/maintenance/github-report-activation/watcher-install.json`、`activation-result.json`：登入捷徑、程序及重複啟動驗證。
- `data/github-reports/state.json`、`research/`、`watcher.json`、`last-run.log`：正式 ledger、研究紀錄及背景巡檢結果。

上述 `data/` 證據保留在本機，不納入版控。停止與恢復操作見 [操作說明](../github-reports.md)。
