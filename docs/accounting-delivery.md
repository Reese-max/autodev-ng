# 帳務與正式交付

## 帳務契約

`attempts.accounting_json` 保存新執行紀錄的模型回報、設定模型、成本來源、計費分類、用量完整性及影子估價快照。舊紀錄不回填猜測值，保留原始金額與 NULL，控制台、成本查詢和摘要顯示未知與覆蓋率。

- 實際模型缺失時為 `null`；設定模型另存 `requestedModel`，不能充當 provider 回報。
- 實付資料來源區分 `provider-reported`、`configured-estimate`、`failure-estimate`、`unknown`。供應商回報仍不是帳單對帳。
- 明確 0 token 與沒有用量不同。cached 缺失、負值、非整數或超過輸入量時，不計影子估值。
- 影子估值只按明確模型選取歷史參考費率，保存數值、版本及依據。動態／未知模型不套用引擎名稱代表價。未回報模型時使用設定模型的估算會標記 `requested`。
- `legacy-reference-2026-07-29-v1` 是原專案歷史參考值，未宣稱為最新官方價格；估值不是實付或節省金額。費率變更不得覆寫已保存快照。
- 驗證結果列標記 `validation`，不再次彙總執行用量。補催執行任一段缺少用量，合計仍屬未知。
- 新紀錄沿用寫入時的訂閱／計量分類。歷史無來源資料仍可查閱原帳，但不能用來證明完整成本。

成本覆蓋率針對 `run.db` 中的執行紀錄；外部帳單、訂閱月費及未寫入此帳的其他服務，不能由這個數字推定。CLI reviewer／planner 的原始證據仍存於 `research/*/telemetry.json`，不能把執行帳稱為所有模型呼叫的已對帳總支出。

## 成本上限

有設定 `globalDailyHardUsd` 時，scheduler 和自主 discovery 都要求同層設定的查帳完整。遺失資料庫、損毀設定、未知計量成本及資料庫別名的衝突政策會停止派工。未設定全域上限的專案維持原操作方式。

資料庫以檔案 identity 去重；重複設定不會重複加總。錯誤只回報檔名與類型，不暴露設定中的憑證。舊 schema 只讀不遷移；正式開啟 RunDb 才新增可為 NULL 的欄位，原列不變。

上限約束已記錄或設定估算的金額，不能保證供應商最終帳單；未知時停止也不會取消已經送出的請求。

## 交付驗收

1. 合併 PR #5 的離線起步與 help，保留新 GitHub 交付指令；所有 help 在讀設定及啟動 provider 前返回。
2. 合併 PR #8 的 CLI reviewer 絕對路徑修復，保留 `tests/regressions/github-7.test.cjs`。
3. 對確切 commit 執行 typecheck、測試、build、原生 Node 回歸及瀏覽器控制台驗收。
4. 正式執行版本由同一 commit 建置；切換前備份現有 dist 與 integration，保留資料與既有暫停旗標。
5. 使用 GitHub 真實 PR 狀態及本機部署版本驗證。元件替身測試、實際模型測試、遠端 GitHub 狀態分開記錄。

`followup` 只適用明確啟用的 integration，仍受作者／標籤、停止旗標、冷卻、同一 PR head 及終身次數限制。驗收命令由本機設定提供，不接受 Issue 指定命令。模型不自行宣告人工驗收。
