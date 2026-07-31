# 全量測試與 kernel 預算驗證紀錄（2026-07-31）

## 執行基準

- 基準提交：`9940f1a7e42a97cd252e983812a763f1f1c0bce5`
- 工作樹起始狀態：乾淨
- Node.js：`v25.1.0`
- npm：`11.6.2`
- Vitest：`v4.1.9`

## 完整既有測試套件

執行命令：

```powershell
npm test
```

Exit code：`0`

完整摘要：

```text
> autodev-ng@0.1.0 test
> vitest run


 RUN  v4.1.9 D:/Users/Administrator/Desktop/autodev-ng/data/autodev-self/worktrees/4dd00bb3


 Test Files  135 passed (135)
      Tests  1431 passed (1431)
   Start at  14:53:46
   Duration  357.75s (transform 7.83s, setup 1.10s, import 21.31s, tests 300.63s, environment 15ms)

fatal: cannot change to 'C:\Users\ADMINI~1\AppData\Local\Temp\adng-ch-not-exist-xyz': No such file or directory
```

末行是 `tests/commit-hash.test.ts` 刻意以不存在目錄驗證 Git 失敗容錯的既有 stderr；該測試與整套 Vitest 均通過，並未造成非零 exit code。

## kernel 行數預算測試

執行命令：

```powershell
npx vitest run tests/kernel-budget.test.ts
```

Exit code：`0`

完整摘要：

```text
 RUN  v4.1.9 D:/Users/Administrator/Desktop/autodev-ng/data/autodev-self/worktrees/4dd00bb3


 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  15:00:15
   Duration  338ms (transform 34ms, setup 33ms, import 21ms, tests 21ms, environment 0ms)
```

測試採用的 `src/*.ts` 頂層換行計數為 `2070` 行，低於工作上限 `2700` 行，剩餘 `630` 行；亦低於硬牆 `3000` 行。

## 不變性確認

- `git diff --exit-code -- tests`：exit code `0`。
- `git diff --exit-code -- configs scripts data BACKLOG.md`：exit code `0`。
- 本次僅新增此驗證紀錄；未修改程式碼、測試、禁止路徑或 `BACKLOG.md`。
