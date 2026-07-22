# GOAL

北極星迭代循環——讓大 GOAL 隨證據自動進化但由使用者拍板：NORTHSTAR.md（各專案 dataDir）目前
是靜態手寫檔。新增一個節流的北極星審視器（每個 perpetual session 收尾時執行，距上次審視
<24 小時則跳過）：彙整（a）USER-SIGNALS.md 新增條目、（b）問題台帳/ROI 歷史、（c）近期
commit 主旨與北極星價值判準的對照（跑偏偵測），據此產出兩類輸出——【自動生效】直接改寫
NORTHSTAR.md 的「目前最大差距」盤點段（純事實陳述，附日期戳）；【提案待審】北極星宣言或
價值判準的修訂建議一律只寫入 `NORTHSTAR-PROPOSAL.md`，絕不直接改動 NORTHSTAR.md 的宣言與
判準段落，並 append 一筆 `northstar-proposal` 事件讓 digest 可見「有提案待使用者審核」。
使用者核可的機制：PROPOSAL 檔首行含 `APPROVED` 標記時，下次審視將其合併進 NORTHSTAR.md 並
歸檔提案。全程 fail-open：任何資料源缺失或審視器故障都不影響 goal 執行主流程。新邏輯必須有
紅→綠測試，放在 tests/northstar-iterate*.test.ts。

## 驗收指令

```sh
npx vitest run tests/northstar-iterate --reporter=dot
```

## 細部要求

1. 分段解析：NORTHSTAR.md 的「目前最大差距」段以 `## 目前最大差距` 標題定界，審視器只允許
   改寫此段；宣言（粗體句）與「價值判準」段位元組級不變，有測試證明。
2. 節流狀態記在 dataDir（如 northstar-review-state.json），與其他狀態檔同紀律。
3. NORTHSTAR.md 不存在的專案：審視器跳過，不自行創建（北極星必須源自使用者）。
4. 測試覆蓋：盤點段改寫且宣言不變、提案不落 NORTHSTAR、APPROVED 合併與歸檔、節流、
   缺檔跳過、故障 fail-open。
5. kernel 行數預算維持綠燈；`npm run build` 與 `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/ 目錄與任何 daemon 進程。
- 改動最小化：只動達成目標所需的檔案。

連續無進展上限：3
