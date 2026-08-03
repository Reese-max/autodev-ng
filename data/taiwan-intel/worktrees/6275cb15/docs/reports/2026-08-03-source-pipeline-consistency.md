# 四個核心領域來源管線一致性稽核

## 結論

新增 `scripts/audit-source-pipeline-consistency.mjs`，逐一檢查四個核心覆蓋領域的啟用來源：

| 核心領域 | 啟用來源 |
| --- | --- |
| 治安／警政 | `police`、`missing`、`twnews` |
| 災防／氣象 | `cwa`、`cwaWarnings`、`ncdr` |
| 交通／停車 | `police`、`parkingHsinchu`、`parkingTaoyuan` |
| 水情／環境 | `wra`、`wraRiver`、`moenvAir` |

目前盤點結果：四個領域、十一個去重後來源，皆同時具備：

1. `fetch-live.mjs` 的啟用設定與執行入口。
2. 既有 `fetch-*.mjs` 的抓取／解析函式。
3. 可從實作檔追溯的 HTTP 端點或既有 `queryTwinkleRows` MCP 查詢入口。

檢查遇到僅存在於設定的來源時，會分別輸出 `missing-execution-entrypoint`、`missing-parser-entrypoint`、`missing-parser-file` 或 `missing-endpoint`，並附領域、來源、檔案、預期符號／端點與失敗原因。

## 驗證

```text
來源管線一致性自我檢查通過
source-pipeline-consistency checks passed
```

執行方式：

```powershell
node scripts/audit-source-pipeline-consistency.mjs
node scripts/audit-source-pipeline-consistency.mjs --json
node scripts/audit-source-pipeline-consistency.mjs --self-test
node tests/source-pipeline-consistency.test.mjs
```
