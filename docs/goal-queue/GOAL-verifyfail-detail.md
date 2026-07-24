# GOAL

verify-fail 失敗紀錄修繕——讓失敗看得見病灶：runVerify（src/verify.ts）的 fail detail
現取 stderr+stdout 尾 1000 字，vitest 輸出含大量 ANSI 控制碼且 Failed Tests 區塊在摘要前，
截尾實際留下的全是 ✓ 通過列表——run.db 的 verify-fail 紀錄看不到任何紅掉的測試名，
診斷價值為零，且經 survey 彙總把瞎訊號餵給發掘器（2026-07-24 實證：26 筆失敗 24 筆
verify-fail 全部無法從 detail 判讀病灶）。改為：fail 時 detail 先 strip ANSI 控制碼，
再優先擷取失敗相關區塊——含 FAIL/✗/×/AssertionError 的行及其鄰近上下文、加上末尾
Test Files/Tests 統計行；擷取不到失敗行（非 vitest 類輸出）時退回現行尾段截取（fail-open，
行為向後相容）。總長維持既有 1000 字上限。新邏輯必須有紅→綠測試，放在
tests/verifyfail-detail*.test.ts。

## 驗收指令

```sh
npx vitest run tests/verifyfail-detail --reporter=dot
```

## 細部要求

1. 測試用真實 vitest 失敗輸出樣本（含 ANSI 碼、Failed Tests 在前、pass 列表灌尾）斷言：
   detail 含失敗測試名與統計行、不含 ANSI 控制碼。
2. 非 vitest 輸出（純文字錯誤、空輸出）退回現行尾段行為的回歸測試。
3. pass/skip 路徑 detail 行為完全不變。
4. 擷取邏輯放 src/engines/ 子目錄（不佔 kernel 帳），verify.ts 只留最小接線。
5. kernel 行數預算維持綠燈；`npm run build` 與 `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/、data/ 目錄與任何 daemon 進程。
- 改動最小化：只動 verify.ts 接線、新 engines 模組與測試。

連續無進展上限：3
