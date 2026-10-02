# CI 全量回歸守門事故證據（2026-09-10，issue #13）

## 事件

`windows-latest`/Node 22 CI 在 `npm run test:flaky-regression`（完整 Vitest 兩輪、每輪 15 分鐘上限）連續失敗；`npm ci` 與 `npm run typecheck` 綠，`tests/regressions/*.test.cjs` 因前一個 blocking step 失敗而未執行。

| run | SHA | 結果 |
|---|---|---|
| 34428878217 | `d1f5a32` | success（最後綠） |
| 34440070661 | `e94916a` | failure |
| 34454796061 | `5b1826d` | failure |
| 34456050572 | `8143ec4` | failure |
| 34469734636 | `8103b212` | failure（審計當前） |

Run `34469734636` 的 job `102846569277` 確實完成 checkout、Node setup、`npm ci`、typecheck 與回歸命令，不是 runner admission 或 Actions budget 失敗。精確保留的結果是 201 個 test files 中 3 個失敗、1,977 個 tests 中 5 個失敗；兩輪的診斷均包含固定 completion/config/repair clusters 與一個第二輪才通過的 watcher case。其固定根因已由後續變更對齊目前的 `Deps`、free-policy fixture 與 repair gate detail 契約。

## 本次修復的 gate-operability 缺口

Windows workflow 本身已在目前 base 保持 blocking contract：`windows-latest`、`npm run typecheck`、兩輪 `npm run test:flaky-regression`，以及後續的 `tests/regressions/*.test.cjs` retained tests 均未改成 warning 或刪除。這個變更讓同一套 gate 能在 Linux 驗證主機與 detached replay 上可靠執行，同時保持 Windows assertion 不變：

- `fake-qwen` poison fixture 在大輸出後改由最後一個 `stdout.write` callback 結束，避免 POSIX pipe 尚未排空就 `process.exit()` 而遺失合法 result event。
- POSIX 的 SIGKILL/zombie 回收斷言改用有界 polling，不再用單點 PID probe 造成時序假紅。
- `taskkill`、PowerShell FileShare、Windows process-tree 與 Windows 9009 exit-code 語意只在非 Windows 不成立的環境略過；Windows CI 仍執行原 assertion。
- 依賴 gitignored `dist/` 的測試以 `RUNTIME_BUILT` 作為前置條件；CI 的 `test:flaky-regression` 先 build，因此 Windows gate 仍執行這些測試，乾淨 Linux checkout 則不會把缺少建置產物誤報成產品失敗。
- GitHub repair tests 的 CLI admission 改用 unknown-admission test seam，避免宿主的真實 Codex quota 狀態改變測試結果或觸發 provider call；Python regression fixture 在 POSIX 使用 `python3`、Windows 使用 `python`。

## 驗證

- Linux、無 `dist/`：`npx vitest run --reporter=dot` → 203 files / 1,997 passed / 19 skipped / 0 failed。
- Linux、完成 build：`npm test` → 204 files / 2,008 passed / 8 skipped / 0 failed。
- `npm run typecheck`（含 secret scan）與 `npm run build` 均成功。
- focused regression：`npx vitest run tests/qwen.test.ts -t 'poison fixture drains the final JSON event before exiting'` 成功。

此文件只保存 CI 事故與本地可重播的 gate evidence；不把 CI 綠燈單獨宣稱為所有 P0/P1/P2 或 runtime path 已 CLEAN。
