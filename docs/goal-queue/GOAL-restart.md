# GOAL

實作單專案優雅重啟：daemon 迴圈在每輪開頭檢查 dataDir 下的 `restart.request` 哨兵檔
（與現有 stopFile／config-gone 檢查同位置、同語意層），偵測到時刪除哨兵檔、append 一筆
`daemon-restart-requested` 事件後優雅退出（return 一個新的 DaemonResult 'restart-requested'）,
由既有 supervisor 排程（15 分鐘心跳）自動以新 config／新 dist 重新拉起。這讓部署換版不再需要
全艦隊 rename configs 的 dance,也不需要 taskkill。當前 attempt 進行中不得中斷——哨兵檢查
只發生在 cycle 邊界。新邏輯必須有紅→綠測試,放在 tests/daemon-restart*.test.ts。

## 驗收指令

```sh
npx vitest run tests/daemon-restart --reporter=dot
```

## 細部要求

1. 哨兵檔路徑：`<dataDir>/restart.request`；內容不拘（存在即觸發）。
2. 檢查時點：與 config-gone 檢查相鄰（cycle 開頭、digest 檢查之後）；attempt 執行中不受影響。
3. 退出前必須刪掉哨兵檔（防重啟後立即再觸發的迴圈）；刪除失敗仍照常退出並在事件中記錄。
4. 測試覆蓋：哨兵存在→退出且檔案被刪＋事件寫入；哨兵不存在→行為與現在完全相同；
   刪除失敗（唯讀/佔用）→仍退出不 crash。
5. kernel 行數預算維持綠燈；`npm run build` 與 `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/、data/ 目錄與任何 daemon 進程。
- 改動最小化；不動 supervisor 排程與任何外部腳本。

連續無進展上限：3
