# Scheduler kernel 接線行數預算結果（2026-07-30）

## 結論

`src/scheduler.ts` 在併發降級提示接線提交 `a680932` 的差異是 **2 + / 2 -**：總變更量 **4 行**、淨變更 **0 行**，均不超過 15 行預算。新增邏輯位於 `src/engines/concurrency-notice.ts`，目前為 22 行；它不屬於 `src/*.ts` 頂層統計，因此不計入 kernel 預算。

## 可重跑證據

```text
git diff --numstat a680932^ a680932 -- src/scheduler.ts
2       2       src/scheduler.ts
```

- 總變更量：`2 + 2 = 4`，`4 ≤ 15`。
- 新模組：`src/engines/concurrency-notice.ts`；`git diff --name-status a680932^ a680932 -- src/engines/concurrency-notice.ts` 回傳 `A`，且以與預算測試相同的換行計數為 22 行。
- `tests/kernel-budget.test.ts` 只列舉 `src/` 直屬的一般 `.ts` 檔，不遞迴 `src/engines/`；因此 `concurrency-notice.ts` 不會出現在頂層明細。
- 實測頂層 `src/*.ts` 為 2070 行，`2070 ≤ 2700`。

## 實測

```text
npx vitest run tests/kernel-budget.test.ts tests/scheduler-kernel-wiring-budget.test.ts --reporter=verbose
Test Files  2 passed (2)
Tests       5 passed (5)
```
