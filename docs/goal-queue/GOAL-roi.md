# GOAL

goal ROI 回饋閉環——讓發掘器的品味隨經驗成長：現有 ProblemsLedger（問題台帳，src/autopilot/ledger.ts）
只記發掘時的預估 value 與狀態，事後無人對帳。擴充台帳為 ROI 帳本並回饋進發掘管線：
（1）收案記帳——goal 結束（achieved/no-progress/stuck）時，將該 goal 的實際成本（attempts 總數、
成功數、起訖時間）與結果種類寫回對應 problem 列（新增欄位，向後相容既有資料庫，缺欄自動遷移）；
（2）品味回饋——discovery 的 critic prompt 附加「近期已完成 goal 的 ROI 摘要」（每類 lens 的
預估 value vs 實際成本 vs 結果統計），讓 critic 據史實調整候選排序；（3）一切 fail-open：
台帳讀寫失敗不得影響 goal 執行與 discovery 主流程。新邏輯必須有紅→綠測試，放在
tests/ledger-roi*.test.ts。

## 驗收指令

```sh
npx vitest run tests/ledger-roi --reporter=dot
```

## 細部要求

1. schema 遷移：舊 problems 表無新欄位時自動 ALTER TABLE 補欄，既有資料不受損；有測試證明。
2. 記帳時點：goal outcome 確定處（perpetual session 收尾）；attempts 統計取自 run.db 該 goal
   期間的資料，run.db 不可用時記 NULL 不擋收案。
3. critic 回饋摘要有長度上限（≤1500 字元），無歷史資料時完全不附加（行為與現在相同）。
4. 測試覆蓋：新舊 schema 並存、記帳成功/失敗 fail-open、回饋摘要生成與空歷史情境。
5. kernel 行數預算維持綠燈；`npm run build` 與 `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/、data/ 目錄與任何 daemon 進程。
- 改動最小化：只動達成目標所需的檔案。

連續無進展上限：3
