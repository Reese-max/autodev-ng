# CLI 子指令搬移稽核（2026-07-24）

## 結論

已檢查實際 Git diff：`80825e5^..45307ff` 的 `src/cli.ts` 與 `src/cli/`。子指令邏輯已搬至 `src/cli/`；頂層 `src/cli.ts` 僅保留 `runCli` 的參數傳入、直接執行判定、錯誤輸出，以及既有公開 API 的 re-export。未發現行為變更。

## 實際 diff 證據

- `git diff --stat 80825e5^ 45307ff -- src/cli.ts src/cli tests`：`src/cli.ts` 為 `398 + / 1 -`，並新增 `src/cli/{assemble,daemon,entry,notify-test,run-once,status,supervise}.ts`。
- 搬移前 `src/cli.ts` 為 406 行；目前為 22 行，沒有 `cmd*`、`assemble`、`formatStatus` 或檔案 I/O 的本機實作。
- `src/cli/entry.ts` 保留原本的 argv 解析、`supervise` 參數互斥檢查、缺少 `--config` 的用法錯誤、以及五個子指令的分派。
- `src/cli/{status,run-once,daemon,notify-test,supervise}.ts` 的函式本體與原 `src/cli.ts` 對應邏輯一致；`assemble.ts` 承接原組裝與設定檔解析。
- 唯一呼叫形狀調整是 `cmdSupervise(cliPath, configPath, configsDir)`：`runCli` 傳入與搬移前相同的 `fileURLToPath(import.meta.url)`，因此傳給 supervisor 的 CLI 路徑不變。

## 行為驗證

`tests/cli-commands.test.ts` 的快照覆蓋 `status`、`run-once`、空目錄 `supervise` 與未知子指令的 stdout、stderr、exit code；同時確認既有 `src/cli.ts` 公開匯出與 argv 解析契約不變。

`src/cli/golden.ts` + `tests/cli-golden.test.ts` 建立公開子指令搬移前後 golden 矩陣：對 `status` / `run-once` / `daemon` / `notify-test` / `supervise` 以 UTF-8 逐位元比對 stdout、stderr、exit code，涵蓋正常流程、錯誤參數、`--help`、`--version`、未知子命令與設定失敗情境（`daemon` 僅鎖用法／設定失敗出口，不啟動長駐進程）。volatile 路徑與 ISO 時刻經 `stabilizeCliCapture` 正規化後再比對。

`tests/kernel-slim.test.ts` 新增子指令模組承接檢查，並既有驗證 `src/cli.ts` 僅委派 `runCli`、不含業務實作。`tests/kernel-budget.test.ts` 持續守住 `src/*.ts` 頂層 2700 行上限。

## Kernel 行數重統計

計數規則完全對齊 `tests/kernel-budget.test.ts`：只計 `src/` 頂層的 `.ts` 一般檔案，不遞迴子目錄；每檔行數為 UTF-8 內容中的換行字元數（`split('\n').length - 1`）。外移前取 `80825e5^`，外移後取完成回歸測試的 `45307ff`。

| 頂層檔案 | 外移前 | 外移後 | 差異 |
|---|---:|---:|---:|
| `backlog.ts` | 188 | 188 | 0 |
| `cli.ts` | 406 | 22 | -384 |
| `daemon.ts` | 341 | 341 | 0 |
| `db.ts` | 147 | 147 | 0 |
| `digest.ts` | 84 | 84 | 0 |
| `events.ts` | 126 | 126 | 0 |
| `globalcost.ts` | 40 | 40 | 0 |
| `judge.ts` | 42 | 42 | 0 |
| `lock.ts` | 110 | 110 | 0 |
| `notify.ts` | 137 | 137 | 0 |
| `preflight.ts` | 37 | 37 | 0 |
| `proc.ts` | 123 | 123 | 0 |
| `scheduler.ts` | 316 | 316 | 0 |
| `types.ts` | 159 | 159 | 0 |
| `verifier.ts` | 94 | 94 | 0 |
| `verify.ts` | 93 | 93 | 0 |
| `worktree.ts` | 257 | 257 | 0 |
| **總計** | **2700** | **2316** | **-384** |

斷言結果：外移後 `2316 ≤ 2450`；相較外移前基準 `2700` 減少 `384` 行，滿足至少減少 `250` 行。新上限尚餘 `134` 行。
