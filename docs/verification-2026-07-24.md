# 驗收與品質檢查執行紀錄（2026-07-24）

## 結論

建置後完整測試、型別檢查與建置均通過。CLI 搬移的公開子指令、輸出／exit code 回歸，以及 kernel 行數預算都有可重放的具名測試。

## 驗收測試矩陣

| 實際檔名 | 測試名稱／覆蓋範圍 | 執行命令 |
| --- | --- | --- |
| `tests/cli.test.ts` | `assemble` 設定解析、引擎 registry、路徑展開、`formatStatus`、`parseArgv`、錯誤設定與通知結果 | `npx vitest run tests/cli.test.ts tests/cli-commands.test.ts tests/cli-golden.test.ts tests/kernel-budget.test.ts tests/kernel-slim.test.ts --reporter=verbose --maxWorkers=1` |
| `tests/cli-commands.test.ts` | `CLI 搬移回歸：代表性子指令維持搬移前的輸出快照與 exit code`、公開匯出、argv 解析、`formatCycleResult`、`printSuperviseResults` | 同上 |
| `tests/cli-golden.test.ts` | `五個公開子指令：搬移前 golden 與搬移後 stdout/stderr/exit code 逐位元一致`、用法／未知命令／設定錯誤／heartbeat 輸出矩陣 | 同上 |
| `tests/kernel-budget.test.ts` | `kernel 頂層行數 ≤ 工作上限 2700`、計數與 `wc -l` 一致 | 同上 |
| `tests/kernel-slim.test.ts` | kernel 總量 ≤ 2450、`src/cli.ts` 薄殼限制、子指令實作均位於 `src/cli/` | 同上 |

核心驗收命令結果：`Test Files 5 passed (5)`、`Tests 56 passed (56)`、exit code `0`。

## 專案級驗證

| 類別 | 執行命令 | 結果 |
| --- | --- | --- |
| 型別檢查 | `npm run typecheck` | exit code `0`；`tsc --noEmit` 通過 |
| 建置 | `npm run build` | exit code `0`；`tsc -p tsconfig.build.json` 通過 |
| 完整測試 | `npm run test` | exit code `0`；`Test Files 114 passed (114)`、`Tests 1220 passed \| 5 todo (1225)` |

完整測試執行順序為先 `npm run build` 再 `npm run test`，確保 `tests/web-server.test.ts` 使用的本工作樹 `dist/` 已產生。未啟動 daemon 或長駐服務。
