# Vitest 可疑 spec 二分結果（2026-07-21）

## 結論

以固定 `HEAD c65f6ed`、每輪新啟動一個 Vitest 行程做檔案／`describe`／`it` 二分後，最小「曾重現」集合停在整個 `tests/restart-routing-consistency.test.ts`：第一組 10 輪有 9 輪全綠，第 7 輪精確出現 `1 failed | 7 passed`。

失敗沒有落在上一步的兩個候選，而是同檔的：

`狀態重建入口守門 > 只讀檢查：第二次重建不重初始化快取與事件計數，試探/常駐候選不重置`

失敗點為首次 `buildRoutingContext`，訊息是 `expected 'reuse-current' to be 'context'`（`tests/restart-routing-consistency.test.ts:267`）。兩個原候選、兩個 `describe`、新浮現的單一 `it`，以及只保留三個真實 SQLite 案例的集合，各自重跑 10 輪皆全綠。獨立再跑整檔 10 輪也全綠，因此已確認是間歇失敗；目前證據不支持特定 `describe`／`it` 的順序污染。

## 二分矩陣

| 粒度／集合 | 每輪結果 | 10 輪失敗數 | 判定 |
|---|---:|---:|---|
| 整個 `restart-routing-consistency.test.ts`（發掘組） | 8 tests | 1 | 第 7 輪 `1 failed / 7 passed`，其餘 9 輪全綠 |
| `describe: 狀態重建入口守門` | 5 passed / 3 skipped | 0 | 無法重現 |
| `describe: 重啟後一致性：隔離 / 候補晉升 / 試探時點 / 事件` | 3 passed / 5 skipped | 0 | 無法重現 |
| `it: 只讀檢查：第二次重建...` | 1 passed / 7 skipped | 0 | 無法重現 |
| `it: 寫入隔離+晉升...` | 1 passed / 7 skipped | 0 | 無法重現 |
| `it: 重啟前首次隔離有事件...` | 1 passed / 7 skipped | 0 | 無法重現 |
| 三個真實 SQLite `it` 合集 | 3 passed / 5 skipped | 0 | 無法重現 |
| 整個檔案（獨立確認組） | 8 passed | 0 | 10/10 全綠，證實非固定失敗 |

## 可重跑指令

整檔最小曾重現集合，每個指令以 PowerShell 迴圈序列執行 10 次：

```powershell
npx vitest run tests/restart-routing-consistency.test.ts --reporter=dot
```

`describe` 二分：

```powershell
npx vitest run tests/restart-routing-consistency.test.ts -t '狀態重建入口守門' --reporter=dot
npx vitest run tests/restart-routing-consistency.test.ts -t '重啟後一致性：隔離 / 候補晉升 / 試探時點 / 事件' --reporter=dot
```

`it` 二分：

```powershell
npx vitest run tests/restart-routing-consistency.test.ts -t '只讀檢查：第二次重建' --reporter=dot
npx vitest run tests/restart-routing-consistency.test.ts -t '寫入隔離' --reporter=dot
npx vitest run tests/restart-routing-consistency.test.ts -t '重啟前首次隔離' --reporter=dot
```

只保留三個會讀真實 `run.db` 的案例（內層雙引號避免 Windows `npx.cmd` 將 `|` 解讀為管線）：

```powershell
npx vitest run tests/restart-routing-consistency.test.ts -t '"只讀檢查|寫入隔離|重啟前首次隔離"' --reporter=dot
```

## 證據邊界

本輪重現與上一步高負載失敗相同，都在預期 `context` 時收到 fail-open 的 `reuse-current`；三個相關案例也都會經過真實 SQLite 與 `recentRunStats` 的 50ms 截止。不過本輪沒有直接記錄 `reuse-current` 的內部原因，而且相同子集合與整檔確認組均可連續全綠，所以只能鎖定到 I/O 截止型間歇訊號，不能宣稱 50ms 截止已被證明為根因。
