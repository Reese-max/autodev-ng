# CLI 自動修復驗收紀錄

日期：2026-09-07。狀態：**程式已實作，實際模型修復尚未通過，背景修復保持暫停**。操作入口見 [CLI 自動修復](../github-repair.md)。原有 GitHub 巡檢通報繼續運作。

## 已取得的證據

- CLI 修復流程使用真實 Git、scheduler、隔離 worktree、宿主提交及驗收證據；模型與 GitHub 替身測試涵蓋原始檢查紅到綠、獨立評審、同一 commit 驗證及不重複接案。相關 7 個測試檔、78 項測試通過，exit 0。
- `28c33536e0a76fca9bff09f19f0be205485d9cec` 的乾淨提交完成 build 與完整 Vitest：179 個測試檔、1715 項測試，exit 0。後續啟動檢查修正的完整測試結果，另存於下列最終 gate 收據，不能用此舊版結果替代。
- 實際讀取既有 [Issue #4](https://github.com/Reese-max/autodev-ng/issues/4)，核對原發布收據與不可變內容快照後接案；未修改 GitHub Issue、推送或建立 PR。
- 從 GitHub `main` clone 的基底為 `afda700ffa876c6e53442941214f51b5bf784377`。npm 安裝與建置實際 exit 0，耗時 22851 ms；原始 `node dist/cli.js --help` 連續兩次 exit 1，輸出符合通報。
- 第一次模型修復在啟動前因 CLI 權限路徑的引號解析失敗，尚未改檔或產生候選 commit。修正共同參數與 patrol 呼叫後，另確認 Windows 沙箱初始化仍受阻，未把這次失敗計為完成。
- 原有 reports watcher 在 22:35:46（台灣時間）完成巡檢，exit 0；輸出 `reported=0; pending=0; uncertain=0` 及 `github-repair Reese-max/autodev-ng: paused`。

## 尚缺的實機驗收

本機 Codex CLI 為 `0.153.4`。其 elevated 沙箱紀錄回報 `sandbox users missing or incompatible with marker version`；既有 setup marker 為 version 5。當前程序沒有 Windows 管理員權限。透過 CLI 的本機 app-server `windowsSandbox/setupStart` 嘗試初始化未完成；使用者設定檔的 SHA-256 前後相同，沒有取消隔離或改用全權限執行。

原生 `codex sandbox` 的最小檔案測試可在工作區寫入，區外讀寫皆為 `EPERM`；這只是邊界元件證據。實際 CLI 的 unelevated 模式則明確拒絕 split filesystem read restrictions，因此沒有採用這個備援。強化沙箱與備援的差異見 [OpenAI 官方 Windows sandbox 文件](https://learn.chatgpt.com/codex/windows/windows-sandbox)。

仍須完成 elevated 沙箱設定，再取得真實 CLI worker 回應、新 commit、完整專案 CI、獨立 CLI reviewer 及同一 commit 的原始 probe 通過，才可稱實機自動修復通過。現有第 1 次失敗的狀態、重試次數與 worktree 均保留。

暫停旗標為 `data/github-repairs/autodev-ng/.adng.stop`，內容註明本次 CLI 權限修正驗證。尚未通過上述驗收前，不應移除它而宣稱已啟用。`publish=false`，通過後的成果也只會是本機候選。

## 本機收據

`data/maintenance/github-repair-activation/` 保留：

- `full-tests-final-result.json`／`full-tests-final.log`：`28c3353` 的完整回歸。
- `full-tests-gate-result.json`／`full-tests-gate.log`：啟動檢查修正後的最終 build、typecheck、完整測試與首尾版本。
- `legacy-snapshot.json`：舊案發布收據與不可變快照的核對。
- `live-repair-result.json`／`live-repair.log`：首次實際接案結果。
- `native-sandbox-inline.json`：工作區寫入及區外讀寫拒絕。
- `native-exec-pong.json`、`existing-sandbox-model-write.json`：CLI 初始化失敗的實際結果。
- `sandbox-setup-scoped.json`：強化沙箱初始化嘗試與設定檔前後雜湊。

`data/github-repairs/autodev-ng/issue-4/` 保留 state、prepare／baseline 收據、events 與隔離 checkout；`data/github-reports/` 保留原巡檢 ledger 與 watcher 狀態。這些資料不納入版控。
