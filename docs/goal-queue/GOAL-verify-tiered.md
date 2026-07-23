# GOAL

分層驗收——砍掉紅→綠迭代的全套稅：KernelVerifier（src/verifier.ts）目前每輪都跑全套
cfg.verifyCommand（npm install + build + 全套 vitest，daemon 環境實測 ~14 分鐘），紅燈迭代
每一輪都付全額。改為兩層：（1）GOAL 專屬層——當前 GOAL.md 經 parseGoal 取得的 verifyCommand
存在且與全域 cfg.verifyCommand 不同時，輪內驗收先只跑專屬指令（秒級）；專屬紅燈即以其失敗
輸出作為該輪 verify 拒收回饋，不執行全套；（2）全套層——專屬綠燈後才跑全套 cfg.verifyCommand
守回歸，全套紅燈仍照現行為拒收。細節：專屬指令缺失、解析失敗、或與全域相同時，行為與現行
完全一致（fail-open 直跑全套）；兩層各自沿用 verifyTimeoutMs。另外 npm install 稅：全套指令
執行前若 package-lock.json 內容 hash 與上次成功驗收時相同，可跳過 install 步驟（hash 記錄
檔缺失/損壞一律不跳過，fail-open）。新邏輯必須有紅→綠測試，放在 tests/verify-tiered*.test.ts。

## 驗收指令

```sh
npx vitest run tests/verify-tiered --reporter=dot
```

## 細部要求

1. 專屬層紅燈的拒收 detail 須可區分於全套紅燈（如前綴 goal-verify-fail: / verify-fail:），
   供 run.db 統計與 ROI 分析。
2. 「專屬綠、全套紅」的情境必須有測試：該輪仍拒收，回饋為全套失敗輸出。
3. install 跳過的 hash 記錄檔放 dataDir 下，唯讀失敗 fail-open（照跑 install）。
4. 向後相容：GOAL 無專屬 verifyCommand（或與全域相同）時，執行路徑與現行為位元級一致。
5. kernel 行數預算維持綠燈；`npm run build` 與 `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/、data/ 目錄與任何 daemon 進程。
- 改動最小化：只動達成目標所需的檔案。

連續無進展上限：3
