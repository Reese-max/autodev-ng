# GOAL

產出可見性——成果自己送上門（北極星判準 3 直指，USER-SIGNALS 頭兩條痛點）：daemon 每日
自主交付大量 commits，但 digest 只落本機檔案，使用者從來看不到；auto-goal 立案後使用者
也毫不知情，事中無喊停窗口。改為：（1）每日 digest 組裝完成後，經現有 notify 通道
（src/notify.ts，Discord，DLQ 治理沿用）確實送出——若勘查發現既有送出路徑存在但故障/
未接通，修通並補回歸測試；（2）perpetual 立案事件（perpetual-goal-authored）發生時，
即時經同一 notify 通道推送一則立案通知，內容含：問題標題、lens、critic VALUE、一句
rationale、專屬驗收指令——讓使用者事中知情、可人工介入喊停（介入手段沿用既有 stopFile/
GOAL.md 置換機制，不新造）；（3）通知失敗一律走既有 DLQ fail-open 路徑，不得影響
digest 組裝與立案主流程。新邏輯必須有紅→綠測試，放在 tests/visibility*.test.ts。

## 驗收指令

```sh
npx vitest run tests/visibility --reporter=dot
```

## 細部要求

1. 測試以注入假 notifier 驗證：digest 完成→send 被呼叫且內容含當日戰績；立案→send 被
   呼叫且內容含標題/VALUE/驗收指令；send 失敗→主流程不受影響且事件照記。
2. 立案通知須在 authorGoal 成功寫入 GOAL.md 之後、session 開跑之前發出。
3. 通知文字 zh-TW、單則 ≤500 字元（Discord 顯示友善），超長截斷。
4. 向後相容：notify 既有呼叫點行為不變；digest 檔案照常落地（通知是加項不是替換）。
5. kernel 行數預算維持綠燈；`npm run build` 與 `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/、data/ 目錄與任何 daemon 進程。
- 改動最小化：優先動 src/autopilot/、src/bot/ 等子目錄；kernel 頂層只准最小接線。

連續無進展上限：3
