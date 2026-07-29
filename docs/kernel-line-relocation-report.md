# Kernel 頂層搬移前後行數報告

## 結論

`src/*.ts` 頂層由 **2700 行**降至 **2187 行**，實際騰回 **513 行**。因此符合頂層最多
2250 行，且至少騰回 250 行的目標。

| 量測點 | 來源 | 頂層行數 | 與搬移前差異 |
| --- | --- | ---: | ---: |
| 搬移前 | `942554a00fdbed0b6666ff6f4a9bac140809fdce` | 2700 | 0 |
| 搬移後 | 目前工作樹 `src/*.ts` | 2187 | -513 |

搬移前基準是 `refactor(cli): 搬移子指令處理至子目錄`（`80825e5`）的直接前身；因此比較的是
同一份 kernel 在實際搬移前後的檔案內容，而非 2700 行的匿名常數。

## 計數契約

與 `tests/kernel-budget.test.ts` 相同：只計 `src/` 第一層的 `.ts` 一般檔，不遞迴子目錄；每檔
行數為 UTF-8 內容的 `split('\n').length - 1`，即換行字元數。`src/cli/` 的搬移目的地不納入
kernel 頂層帳。

搬移當下只改變頂層 `src/cli.ts`：406 行降至 21 行，騰回 385 行；其後 `src/proc.ts`
為 Guardian 無活動看門狗增加 30 行安全邏輯，移除 `src/judge.ts` 的 diff 截斷一行，
`src/scheduler.ts` 為簽名熔斷告警接線與 commit 自證行增加 7 行，`src/lock.ts` 為 Windows PID
重用驗證增加 24 行，rebase-before-merge 與 digest blocked 清單再增 30 行，judge 驗收回饋閉環（db.lastFailureFor、scheduler 打回原因注入、verifier 檔案清單餵料）再增 20 行，免費起跑 zeroCostTags 再增 6 行，judge effort/timeout 可配置化再增 3 行，attempt duration_ms 觀測再增 12 行，目前淨騰回 254 行。併發基建 GOAL（2026-07-28）再把 notify.ts（137 行）與 proc.ts（153 行）整檔外移 src/engines/、新增 merge queue 與 concurrency 骨架共 9 行，降至 2162 行；上限同步收緊 2450→2250。digest 可讀性接線再增 5 行；token 觀測（RunResult usage＋tokens 欄＋digest 顯示）再增 16 行至 2183；免費層影子帳接線再增 4 行至 2187，GOAL B 併發池餘 63 行。

## 可重現驗證

在 repo 根目錄執行：

```sh
npx vitest run tests/kernel-relocation-report.test.ts --reporter=verbose
npx vitest run tests/kernel-slim.test.ts tests/kernel-budget.test.ts --reporter=verbose
```

第一個測試直接以 Git 讀取上述基準提交的 `src/*.ts`，並以相同計數函式讀取目前工作樹，斷言
2700 → 2187、513 行騰回、≤2250 與 ≥250。第二個測試持續守住既有 kernel 預算與薄殼邊界。
