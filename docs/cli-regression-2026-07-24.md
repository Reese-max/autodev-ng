# CLI 搬移回歸證據（2026-07-24）

## 結論

搬移前基準取自 `80825e5^:src/cli.ts`。搬移後逐一實跑五個公開子指令，stdout、stderr（含尾端換行）與 exit code 均以 UTF-8 位元組完全相等；主矩陣沒有正規化輸出。`daemon` 僅測設定檔不存在的安全出口，未啟動長駐程序。

## 完整公開子指令矩陣

`<missingConfig>` 表示搬移前 golden 與搬移後實跑共同收到的同一個絕對路徑；測試直接將該路徑帶入兩邊，不做字串替換。

| 子指令 | 情境 | stdout | stderr | exit code |
| --- | --- | --- | --- | ---: |
| `status` | 有效 mock config、無 heartbeat | `daemon 未跑過\n` | 空 | 0 |
| `run-once` | 有效 mock config、空 backlog | `CycleResult: idle\n` | 空 | 0 |
| `daemon` | config 不存在 | 空 | `設定檔不存在: <missingConfig>\n` | 1 |
| `notify-test` | 固定時鐘、未設定 channel | `送達失敗（已寫入 DLQ，detail 見 dataDir/notify-dlq.jsonl）：adng 通道測試 2026-07-24T00:00:00.000Z\n` | 空 | 1 |
| `supervise` | 空 configs 目錄 | `supervise：找不到 config，未執行任何動作\n` | 空 | 0 |

## 實跑結果

```text
> node_modules/.bin/vitest run tests/cli-golden.test.ts --reporter=verbose --maxWorkers=1

Test Files  1 passed (1)
     Tests  14 passed (14)
  Duration  1.31s
```

14 個案例包含：五命令搬移前後矩陣、公開命令白名單、UTF-8 byte comparator、stdout/stderr 尾端換行、三欄差異定位、capture 序列化、全域用法錯誤、`supervise` 參數互斥、未知子命令、缺檔／壞 JSON／schema 錯誤、`supervise` 單檔錯誤、完整 heartbeat status，以及 `--config` 缺值。

```text
> node_modules/.bin/vitest run tests/cli.test.ts tests/cli-commands.test.ts tests/cli-golden.test.ts tests/kernel-budget.test.ts tests/kernel-slim.test.ts --reporter=verbose --maxWorkers=1

Test Files  5 passed (5)
     Tests  56 passed (56)
  Duration  7.26s
```

```text
> npm run typecheck
> tsc --noEmit

exit code: 0

> npm run build
> tsc -p tsconfig.build.json

exit code: 0
```

`tests/kernel-budget.test.ts` 為 2/2 通過；`src/*.ts` 頂層 2,700 行上限維持綠燈。
