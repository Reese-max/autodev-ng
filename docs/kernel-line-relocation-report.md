# Kernel 頂層搬移前後行數報告

## 結論

`src/*.ts` 頂層由 **2700 行**降至 **2315 行**，實際騰回 **385 行**。因此符合頂層最多
2450 行，且至少騰回 250 行的目標。

| 量測點 | 來源 | 頂層行數 | 與搬移前差異 |
| --- | --- | ---: | ---: |
| 搬移前 | `942554a00fdbed0b6666ff6f4a9bac140809fdce` | 2700 | 0 |
| 搬移後 | 目前工作樹 `src/*.ts` | 2315 | -385 |

搬移前基準是 `refactor(cli): 搬移子指令處理至子目錄`（`80825e5`）的直接前身；因此比較的是
同一份 kernel 在實際搬移前後的檔案內容，而非 2700 行的匿名常數。

## 計數契約

與 `tests/kernel-budget.test.ts` 相同：只計 `src/` 第一層的 `.ts` 一般檔，不遞迴子目錄；每檔
行數為 UTF-8 內容的 `split('\n').length - 1`，即換行字元數。`src/cli/` 的搬移目的地不納入
kernel 頂層帳。

搬移只改變頂層 `src/cli.ts`：406 行降至 21 行，騰回 385 行；其餘頂層檔案合計仍為 2294 行。

## 可重現驗證

在 repo 根目錄執行：

```sh
npx vitest run tests/kernel-relocation-report.test.ts --reporter=verbose
npx vitest run tests/kernel-slim.test.ts tests/kernel-budget.test.ts --reporter=verbose
```

第一個測試直接以 Git 讀取上述基準提交的 `src/*.ts`，並以相同計數函式讀取目前工作樹，斷言
2700 → 2315、385 行騰回、≤2450 與 ≥250。第二個測試持續守住既有 kernel 預算與薄殼邊界。
