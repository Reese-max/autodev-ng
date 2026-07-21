# Vitest flaky 追蹤結果（2026-07-21）

## 結論

連續序列執行 `npx vitest run --reporter=dot` 共 20 輪：16 輪全綠、4 輪失敗、0 輪 tracker timeout。

沒有唯一候選；以下兩個 spec 並列最高頻不穩定測試，皆於第 9、10 輪失敗（2/20，10%）：

1. `tests/restart-routing-consistency.test.ts > 重啟後一致性：隔離 / 候補晉升 / 試探時點 / 事件 > 重啟前首次隔離有事件；重啟後同條件只延續、untilTs 不變、事件不重複`
2. `tests/restart-routing-consistency.test.ts > 重啟後一致性：隔離 / 候補晉升 / 試探時點 / 事件 > 寫入隔離+晉升 → 重建上下文 → pick 延續原狀且不重設試探、不重派事件`

第 9、10 輪也是最慢的兩輪（526,703ms、545,402ms），且同輪另有 timeout／Git `ETIMEDOUT`。這表示失敗與高負載相關，但本次資料不足以證明負載是根因。

## 高頻候選明細

| spec | 輪次／失敗順序 | 失敗訊息 |
|---|---|---|
| 重啟前首次隔離有事件；重啟後只延續 | 9／3 | `AssertionError: expected [] to include 'qwen'` |
| 同上 | 10／4 | `AssertionError: expected 'reuse-current' to be 'context' // Object.is equality` |
| 寫入隔離+晉升後重建上下文 | 9／2 | `AssertionError: expected 'reuse-current' to be 'context' // Object.is equality` |
| 同上 | 10／3 | `AssertionError: expected 'reuse-current' to be 'context' // Object.is equality` |

其餘 9 個 spec 各只失敗 1/20（5%）。完整 spec 名稱、每輪失敗順序、訊息、exit code、開始時間與耗時見 [`flaky-runs.json`](./flaky-runs.json)。

## 逐輪摘要

| 輪次 | 耗時（ms） | exit code | 失敗 spec 數 |
|---:|---:|---:|---:|
| 1 | 223,341 | 0 | 0 |
| 2 | 269,917 | 1 | 1 |
| 3 | 244,321 | 0 | 0 |
| 4 | 253,012 | 0 | 0 |
| 5 | 225,288 | 0 | 0 |
| 6 | 218,504 | 0 | 0 |
| 7 | 241,361 | 0 | 0 |
| 8 | 280,834 | 1 | 1 |
| 9 | 526,703 | 1 | 4 |
| 10 | 545,402 | 1 | 7 |
| 11 | 411,817 | 0 | 0 |
| 12 | 274,986 | 0 | 0 |
| 13 | 258,027 | 0 | 0 |
| 14 | 233,989 | 0 | 0 |
| 15 | 201,729 | 0 | 0 |
| 16 | 222,781 | 0 | 0 |
| 17 | 211,782 | 0 | 0 |
| 18 | 212,491 | 0 | 0 |
| 19 | 218,286 | 0 | 0 |
| 20 | 209,379 | 0 | 0 |

- 量測區間：`2026-07-21T05:02:49.785Z` 至 `2026-07-21T06:34:13.840Z`
- 平均耗時：274,198ms；最短：201,729ms；最長：545,402ms
- 重跑方式：`npm run build` 後執行 `node dist/engines/flaky-tracker.js --rounds 20 --output docs/flaky-runs.json`
