# GOAL

kernel 減壓外移——騰回行數緩衝解鎖後續開發：kernel 頂層現況 2700/2700 零餘裕（工作上限
壓線），佇列中 nocommit-nudge（動 scheduler.ts）、merge-rebase（動 worktree.ts）、
verify-fail detail 修繕（動 verify.ts）全是 kernel 改動，不減壓即全數撞牆。依 spec 護欄
（2700→3000 之間只准外移/重構），把 src/cli.ts（406 行，最肥）的子指令處理邏輯外移到
src/cli/ 子目錄（子目錄不計 kernel 帳），cli.ts 頂層只留參數解析與分派薄殼。行為完全不變
（純機械搬移，公開 CLI 介面、輸出、exit code 逐位元一致）；外移後 kernel 頂層總行數
≤2450，一次騰回 ≥250 行緩衝。新增守門測試 tests/kernel-slim*.test.ts 斷言新上限，
防止緩衝被緩慢吃回。

## 驗收指令

```sh
npx vitest run tests/kernel-slim --reporter=dot
```

## 細部要求

1. tests/kernel-slim*.test.ts 斷言 src/*.ts 頂層總行數 ≤2450（計法對齊
   tests/kernel-budget.test.ts 的 kernelLineCount）——立案當下 2700 為紅，外移完成轉綠。
2. 純重構鐵律：不改任何行為、不改公開介面、不「順手」修任何無關問題；既有
   tests/cli.test.ts 與全套測試一行不改仍全綠。
3. 外移單位以子指令/功能塊為界，每塊帶其專屬 import；cli.ts 殘留部分不得殘留死 import。
4. kernel 行數預算測試（tests/kernel-budget.test.ts）維持綠燈；`npm run build` 與
   `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/、data/ 目錄與任何 daemon 進程。
- 改動最小化：只動 src/cli.ts、新的 src/cli/ 子目錄與新守門測試。

連續無進展上限：3
