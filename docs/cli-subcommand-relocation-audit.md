# CLI 子指令搬移稽核（2026-07-24）

## 結論

已檢查實際 Git diff：`80825e5^..45307ff` 的 `src/cli.ts` 與 `src/cli/`。子指令邏輯已搬至 `src/cli/`；頂層 `src/cli.ts` 僅保留 `runCli` 的參數傳入、直接執行判定、錯誤輸出，以及既有公開 API 的 re-export。未發現行為變更。

## 實際 diff 證據

- `git diff --stat 80825e5^ 45307ff -- src/cli.ts src/cli tests`：`src/cli.ts` 為 `398 + / 1 -`，並新增 `src/cli/{assemble,daemon,entry,notify-test,run-once,status,supervise}.ts`。
- 搬移前 `src/cli.ts` 為 403 行；目前為 19 行，沒有 `cmd*`、`assemble`、`formatStatus` 或檔案 I/O 的本機實作。
- `src/cli/entry.ts` 保留原本的 argv 解析、`supervise` 參數互斥檢查、缺少 `--config` 的用法錯誤、以及五個子指令的分派。
- `src/cli/{status,run-once,daemon,notify-test,supervise}.ts` 的函式本體與原 `src/cli.ts` 對應邏輯一致；`assemble.ts` 承接原組裝與設定檔解析。
- 唯一呼叫形狀調整是 `cmdSupervise(cliPath, configPath, configsDir)`：`runCli` 傳入與搬移前相同的 `fileURLToPath(import.meta.url)`，因此傳給 supervisor 的 CLI 路徑不變。

## 行為驗證

`tests/cli-commands.test.ts` 的快照覆蓋 `status`、`run-once`、空目錄 `supervise` 與未知子指令的 stdout、stderr、exit code；同時確認既有 `src/cli.ts` 公開匯出與 argv 解析契約不變。

`tests/kernel-slim.test.ts` 新增子指令模組承接檢查，並既有驗證 `src/cli.ts` 僅委派 `runCli`、不含業務實作。`tests/kernel-budget.test.ts` 持續守住 `src/*.ts` 頂層 2700 行上限。
