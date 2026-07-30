# 完整測試驗收輸出（2026-07-30）

## 執行命令

```powershell
npm test
```

## 原始輸出

```text
> autodev-ng@0.1.0 test
> vitest run


 RUN  v4.1.9 D:/Users/Administrator/Desktop/autodev-ng/data/autodev-self/worktrees/a6b0a275


 Test Files  132 passed (132)
      Tests  1377 passed (1377)
   Start at  12:33:45
   Duration  376.11s (transform 9.38s, setup 1.53s, import 23.62s, tests 316.35s, environment 16ms)

fatal: cannot change to 'C:\Users\ADMINI~1\AppData\Local\Temp\adng-ch-not-exist-xyz': No such file or directory
```

退出碼：`0`。

最後一行是 `tests/commit-hash.test.ts` 刻意以不存在目錄驗證 Git 失敗容錯時的既有 stderr；該測試本身通過，且 Vitest 結果為 132/132 檔案、1377/1377 測試全綠。

## 本次穩定化

完整 serial suite 會讓主機可用記憶體低於 daemon 的 15% OOM 閘；一般流程測試若直接讀取主機記憶體，便會錯走 OOM 分支。六個既有測試 helper 現預設注入 `memFreeRatioFn: () => 1`，而 OOM 專測仍由呼叫端覆寫為低記憶體值。未修改 `src/`、`configs/`、`scripts/` 或 `data/`。

相關回歸命令：

```powershell
npx vitest run tests/daemon.test.ts tests/daemon-m75.test.ts tests/bot-silence.test.ts tests/daemon-restart.test.ts tests/learn-integration.test.ts tests/daemon-cooldown-write-failure.test.ts
```

結果：6/6 檔案、53/53 測試通過。
