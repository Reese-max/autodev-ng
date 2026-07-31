# 完整測試驗收輸出（2026-07-31）

## 執行環境

- 基準提交：`a5575e28f96950bf025a4d03128c2bfd147eea09`
- Node.js：`v25.1.0`
- npm：`11.6.2`

## 完整測試套件

執行命令：

```powershell
npm test
```

原始輸出：

```text
> autodev-ng@0.1.0 test
> vitest run


 RUN  v4.1.9 D:/Users/Administrator/Desktop/autodev-ng/data/autodev-self/worktrees/48db1956


 Test Files  133 passed (133)
      Tests  1396 passed (1396)
   Start at  08:36:04
   Duration  253.39s (transform 4.35s, setup 873ms, import 13.97s, tests 214.50s, environment 11ms)

fatal: cannot change to 'C:\Users\ADMINI~1\AppData\Local\Temp\adng-ch-not-exist-xyz': No such file or directory
```

退出碼：`0`。

末行是 `tests/commit-hash.test.ts` 刻意以不存在目錄驗證 Git 失敗容錯時的既有 stderr；該測試本身通過，Vitest 結果為 `133/133` 個測試檔、`1396/1396` 項測試全綠。

## 回歸修正與不變性

第一次全量執行找出 `tests/kernel-relocation-report.test.ts` 的兩項既有精確行數檢查失敗：提交 `4fd2192` 把 `src/types.ts` 的 `effort` 欄位說明由尾端註解展開成兩個獨立註解行，使檔案由固定帳目的 `170` 行變成 `172` 行。修正只把相同說明收回欄位尾端，保留 `max` 枚舉與原有行為，並讓既有檢查紅轉綠；未修改任何測試。

```text
 RUN  v4.1.9 D:/Users/Administrator/Desktop/autodev-ng/data/autodev-self/worktrees/48db1956


 Test Files  3 passed (3)
      Tests  22 passed (22)
   Start at  08:35:52
   Duration  1.71s (transform 59ms, setup 39ms, import 168ms, tests 870ms, environment 0ms)
```

定向命令：

```powershell
npx vitest run tests/kernel-relocation-report.test.ts tests/kernel-budget.test.ts tests/types.test.ts
```

不變性檢查：

```text
git diff --exit-code -- tests
tests diff exit code: 0

git diff --exit-code -- configs scripts data BACKLOG.md
forbidden paths diff exit code: 0
```

## 型別檢查與建置

```text
> autodev-ng@0.1.0 typecheck
> tsc --noEmit
```

`npm run typecheck` 退出碼：`0`。

```text
> autodev-ng@0.1.0 build
> tsc -p tsconfig.build.json
```

`npm run build` 退出碼：`0`。
