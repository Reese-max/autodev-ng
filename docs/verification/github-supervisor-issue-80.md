# GitHub watcher supervisor：Issue #80

## Current-main verification refresh (2026-10-04 UTC)

The candidate includes `main@f5892611c856502b8a0a754250689e5ac101c390`.
The historical receipts below refer to the earlier candidate, not this refresh.
`GitHub watcher quality` now runs the four commands required by issue #80 as
separate named Windows steps: unit tests, coverage, CRAP, and mutation. The
normal CI still runs the retained 13-case supervisor process matrix with inert
local CLI fixtures. A complete exact-head hosted receipt is required; Linux
skips of Windows process cases do not establish those runtime contracts.

These workflows do not install scheduled tasks, start the production watcher,
or invoke any provider. Actual host installation and canary adoption remain
operator acceptance items.

基準：`99eba2458a82a4fb8e70c25c5a454014b568c659`；分支：`issue-loop/issue-80`。
驗證環境：Windows、Node.js `v26.7.0`、Windows PowerShell 5.1。

新增 `scripts/supervise-github-owner.ps1`，直接啟動系統 PowerShell 與原有 watcher。
每個設定與模式使用 supervisor mutex；模式大小寫會正規化，原 watcher mutex 保留。
每次 watcher 使用獨立的 Windows Job Object，啟動 event 必須在加入 job 後才放行。
意外退出時先清除整個 job 並確認零存活程序，才等待有界延遲並重啟；清理失敗即停止。
正常退出、停用、stop file 或所有權／dataDir 改變都不會觸發重啟。
狀態按模式分檔，只覆寫需求指定的六個欄位。

## TDD 與程序驗收

先新增回歸測試，實作前執行 `node --test tests/regressions/github-80.test.cjs`：

```text
Exit code: 1
AssertionError [ERR_ASSERTION]: GitHub watcher supervisor must exist
tests 12
pass 0
fail 12
skipped 0
```

審查另發現大小寫 mutex 與啟動 event 消失的問題；新增檢查先重現：
`duplicate supervisor must not overwrite state`、`missing start event must never launch the watcher`。
修正後由 Git Bash 執行相同回歸檔，13 項通過、0 失敗、0 跳過、exit 0。
所有程序均來自暫存 fixture，沿用真正 watcher，僅將其 CLI 換成不呼叫外部服務的本機等待程序。

| Issue 驗收 | 對應證據 |
| --- | --- |
| 1：新增測試、保留原測試 | 新增 Node 原生回歸檔與 Vitest 入口，未修改既有測試 |
| 2：預先暫停零子程序 | disabled、非布林 enabled、預設／自訂／repairs stop file |
| 3：意外退出僅替換一次、無孤兒 | 三種 mode 均只停止 watcher PID，確認舊 Node 消失、restartCount=1、替代 watcher 的 parent PID 正確 |
| 4：恢復後停止，不再重啟 | stop 後 supervisor 退出、watcher 與 Node 均消失、start marker 恰好兩筆；另測等待期間停止 |
| 額外邊界 | 重複 supervisor（不同 mode 大小寫）、正常退出不重啟、父程序在 job attachment 前／後終止皆不留下 worker |
| 5–8：完整品質閘門 | 下列命令的最終結果 |
| 9：證據與人工 PR | 本文件與根目錄 `.issue-loop-evidence.json`；PR 由 driver 建立 |

## 品質閘門

| 命令 | Exit | 結果 |
| --- | --- | --- |
| `npm run build` | 0 | TypeScript build 通過 |
| `npm run typecheck` | 0 | 型別與既有 secret scan 通過 |
| `node --test tests/regressions/github-80.test.cjs` | 0 | 13 passed、0 failed、0 skipped；已由 `bash -lc` 重跑 |
| `npm test` | 0 | 205 files、2018 passed；相對原版新增 1 個 Vitest 入口，內含 13 項 Node 程序檢查 |
| `npm run test:coverage` | 0 | 205 files、2018 passed；Statements 56.34%、Branches 50.80%、Functions 57.13%、Lines 55.49% |
| `npm run quality:crap` | 0 | 10 functions；max=13.00，門檻 30 |
| `npm run test:mutation` | 0 | 100%；104 killed、0 survived、0 timeout；既有 `src/github/quality.ts` 範圍 |

V8 coverage 與 mutation 沿用既有 TypeScript 檢查範圍；PowerShell 的完成證據是上述實際 Windows 程序測試。

首次完整測試在未 build 的全新 worktree 執行，既有 host／HTTP 測試缺少 `dist`。
確認 `scripts/host.mjs` 的 build 前置條件後中止該輪，完成 build 並重新執行；未修改原測試。

## 範圍

僅本機實作與驗證。未推送、建立 PR、合併、關閉 Issue、部署或安裝排程；這些外部動作由 driver／人工處理。
未修改正式設定、credentials、provider/model、team.db、worktree／執行收據邊界、Issue 狀態或既有 receipt，亦未接管 PR #18 或清除 Herdr quarantine。
未執行正式 watcher 或外部 GitHub／模型呼叫；遠端 CI 與正式啟用尚未驗證。