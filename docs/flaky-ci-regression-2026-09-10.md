# CI 全量回歸守門事故證據（2026-09-10，issue #13）

## 事件

`windows-latest`/Node 22 CI 在 `npm run test:flaky-regression`（完整 Vitest 兩輪、
每輪 15 分鐘上限）連續失敗：`npm ci`／`npm run typecheck` 均綠，`tests/regressions/*.test.cjs`
階段因此被跳過。

| run | SHA | 結果 |
|---|---|---|
| 34428878217 | `d1f5a32` | success（最後綠） |
| 34440070661 | `e94916a` | failure |
| 34454796061 | `5b1826d` | failure |
| 34456050572 | `8143ec4` | failure |
| 34469734636 | `8103b212` | failure（審計當前） |

## 精確失敗證據（取自 run 34469734636 job log，非時序推測）

round=1/2 與 round=2/2 診斷行均指向 `tests/autopilot-completion.test.ts`，
`exit=1`、`timedOut=false`、`failureSignal="none"`、`detail="(無失敗訊息)"`——
詳細斷言被解析器丟失（見下節根因 B）。

round 1 共 6 個失敗（4 檔），round 2 共 5 個（watcher 案例間歇）：

| spec | assertion/error | 性質 |
|---|---|---|
| `autopilot-completion.test.ts > 補充審查 reject 不得保留 achieved` | `TypeError: Cannot read properties of undefined (reading 'read')` @ `src/autopilot/session.ts:113` | 固定 |
| `autopilot-completion.test.ts > 補充審查 exception 不得保留 achieved` | 同上（vitest 合併相同錯誤，兩 spec 共享一個錯誤區塊） | 固定 |
| `autopilot-completion.test.ts > 自主派工與補足派工都觸發既有反思` | 同上 | 固定 |
| `cli.test.ts > M5：configs/ 下所有現役真檔 schema 全過…` | `Error: free-policy: explicit openrouter/provider/model:free and controlled CLI arguments required` @ `src/engines/opencode.ts:47` | 固定 |
| `github-regression.test.ts > single-repository watcher accepts absolute and relative data directories while disabled` | `AssertionError: expected null to be +0` @ :19（`spawnSync` 10s 逾時，round 2 通過） | 間歇 |
| `github-repair.test.ts > report repair follow-up preserves the original fix…` | `AssertionError: expected '4: blocked' to be '4: published'` @ :199 | 固定 |

## 根因與修復

**A. 測試 fixture 落後於生產契約（已在上游修復）**

- `session.ts` 新增 `deps.store.read()` 後，舊 fixture 未提供 `store` →
  `f9cac85`「align baseline fixtures with runtime contracts」補齊。
- `cli.test.ts` M5 走 registry 建構，`opencode` free-policy 守門收緊 → 同批 fixture 對齊。
- `github-repair.test.ts` follow-up 狀態機調整 → `feaa287`、`cb7159c` 對齊並降噪。

驗證：base `99eba24` 的 CI run `36218491349`（2026-09-26）及之後 main 連續綠；
本地 `npx vitest run` 對四個失敗檔全綠。

**B. 診斷解析器丟失合併錯誤的 assertion（已定位，後續修正）**

Vitest 對相同錯誤的連續失敗只印一次錯誤區塊（多個相鄰 `FAIL` 標題共享）。
`parseVitestFailures` 把群組首幾個 spec 的 `message` 記為 `(無失敗訊息)`，
導致守門診斷行只剩 spec 名、沒有 assertion/error（上表第一列即此情況：
真正的 `TypeError ... (reading 'read')` 印於共享區塊，診斷卻顯示無訊息）。
修法方向：`src/engines/flaky-tracker.ts` 把空 body 的 `FAIL` 標題回填其群組
共享訊息；`src/engines/flaky-regression.ts` 診斷行另列當輪全部失敗 spec。
屬生產碼變更，須待守門套件在驗證環境回綠後隨後續變更落地（見下節 C 的
bootstrap 順序）。

**C. 守門套件在非 Windows 主機恆紅（本 PR 修復）**

套件本身設計為 Windows-first（CI 僅 `windows-latest`），但在 Linux/其他
驗證主機上 `npm test` 出現 23 項固定失敗——守門無法在非 Windows 機器上
被執行或驗證，屬 gate-operability 缺口。本 PR 只動 `tests/` 與文件：

| 失敗群組 | 性質 | 處理 |
|---|---|---|
| `tests/fixtures/fake-qwen.mjs` poison 模式 | **真 fixture bug**：220KB `stdout.write` 後立即 `process.exit(0)`，POSIX pipe 未沖完即截斷，result 事件遺失 | 最後一筆 write 的 callback 才 exit，忠實模擬 CLI 排空語義 |
| `tests/proc.test.ts` 取消驗證 | POSIX zombie 回收為非同步，kill 後立即 `isPidAlive` 誤報 | 有界輪詢取代單點探測 |
| `tests/proc.test.ts` `hang-tree`、supervisor-health 5 項 | `taskkill`/樹枚舉屬 `reapDaemonTree`/`killTree` 的 win32 分支，POSIX 後備為 SIGKILL（語意不同，非缺陷） | `test.skipIf(!win32)`／情境列過濾——Windows CI 全數照跑 |
| `tests/worktree.test.ts`、`tests/scheduler.test.ts` 檔鎖 | 以 `powershell.exe` 造 Windows FileShare 語意，POSIX 無同義鎖法 | `test.skipIf(!win32)` |
| `tests/verify.test.ts` exit 9009 | POSIX exit status 僅 8 bits，`process.exit(9009)` 觀測為 41 | 9009 僅 win32 驗；127 兩平台保留 |
| host-deployment/autonomy-gate/github-delivery/learn-store/learning-outcomes 共 11 項 | 依賴 `dist/` 建置產物（gitignored）或 `scripts/*.mjs→dist` 鏈；乾淨 checkout 必敗 | `tests/helpers/runtime-build.ts` `RUNTIME_BUILT` 門檻；CI 先 build 故照跑 |

所有被略過的測試僅在非 Windows 或無建置產物的環境略過，`windows-latest` CI
（先 `npm run build` 再兩輪全量）逐一執行，斷言內容零刪減。

## 殘留觀察項

- watcher 案例的 `spawnSync` 10s 上限在高負載 Windows runner 上仍是間歇風險
  （round 1 失敗、round 2 通過）；目前不調整，若再現才提高上限或改為明確的
  spawn-error 區分。

## 驗收對應

- 精確失敗證據：上表取自 CI job log（spec／assertion／round／timedOut／fixture 俱全）。
- 重現：固定失敗已由上游修復、本地四檔全綠；間歇 watcher 案例保留為觀察項。
- 未弱化守門：`typecheck`、雙輪 Vitest、`tests/regressions/*.test.cjs` 全部維持阻擋；
  平台／建置門檻僅略過在該環境本無法成立的測試，Windows CI 斷言零刪減。
- 套件可驗證性：修復後 Linux 主機 `npm test` 全綠（1996 通過／19 略過／0 失敗），
  守門首次可在非 Windows 驗證主機乾淨 replay。
- 連續綠 CI：base 起 main 已多輪連綠（含 `36218491349`）；本 PR 的 Windows CI
  亦走同一守門。
