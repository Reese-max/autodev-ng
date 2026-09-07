# CLI 自主開發驗收

北極星於 2026-09-08 經使用者「採用」確認；來源與原話保存在 `data/autodev-self/NORTHSTAR.md` 及 `USER-SIGNALS.md`。主契約是 `docs/goal-queue/GOAL-cli-autonomy.md`。

## 驗收方式

- 編譯、型別與完整測試：在乾淨提交執行 `npm run build`、`npm run typecheck`、`npm test`。
- 使用者操作：`node scripts/check-cli-journey.mjs` 實際啟動 CLI，檢查建立、去重、查看、阻擋髒工作目錄、保留資料與暫停。此測試使用離線引擎，沒有宣稱 AI 修復成功。
- 修復恢復：GitHub 整合測試使用真 Git 與排程器，模擬模型及 GitHub 回覆，驗證原始檢查紅轉綠、獨立審查、精確提交、崩潰後接回成果及不重設次數。
- 提案：同一提案只有一次排程；缺乏訊號或無法完成檢查時延後；模型採用須由另一模型審查；操作者回饋標示來源後進入 USER-SIGNALS。
- 最終 GOAL：`node scripts/verify-autonomy.mjs --config configs/integrations/github-repair.json --issue 4` 額外要求真正 Codex turn、宿主 commit 與完整 CI／review／merge／原始 probe 證據。缺任何一項非零退出。

完整測試結果與精確版本存於 `data/maintenance/cli-autonomy/gate.json`，詳細輸出在同目錄。機械驗收不得以舊提交或模擬引擎證據替代。

## 環境界線

既有 Issue #4 的第一次真實修復因 Windows Agent sandbox 設定失敗，保留 `runs=1`、原始快照與所有工作目錄；尚無真實修復成功證據。管理員完成 Codex 的 Set up Agent sandbox 後，才執行 `repair-doctor --live` 與 `repair-resume`。不得退回無沙箱或較弱的權限設定。

巡檢與修復分別由 `watch-github-owner.ps1 -Mode reports`、`-Mode repairs` 執行；使用各自的 mutex、紀錄與既有資料鎖。Issue 自動報告沿用既有授權，推送與草稿 PR 的 `publish` 仍是 false。沒有合併、部署或真人成效數據。
