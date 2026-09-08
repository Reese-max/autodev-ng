# Kernel 頂層搬移前後行數報告

2026-09-08 帳務修正：`db.ts` 委由 `src/engines/attempt-accounting.ts` 保存及彙總來源快照，`digest.ts` 共用帳務文字；`scheduler.ts` 接上逐筆來源及查帳不完整停止，`globalcost.ts` 保留唯讀範圍盤點。行數上限與歷史基準不變，以既有即時計數測試驗證。

## 結論

截至 **2026-08-12** 的基準快照，`src/*.ts` 頂層由 **2700 行**降至 **2250 行**，實際騰回
**450 行**。目前值由測試即時計算，持續要求頂層不超過 2250 行且至少騰回 250 行。

| 量測點 | 來源 | 頂層行數 | 與搬移前差異 |
| --- | --- | ---: | ---: |
| 搬移前 | `942554a00fdbed0b6666ff6f4a9bac140809fdce` | 2700 | 0 |
| 2026-08-12 基準快照 | 當日工作樹 `src/*.ts` | 2250 | -450 |

搬移前基準是 `refactor(cli): 搬移子指令處理至子目錄`（`80825e5`）的直接前身；因此比較的是
同一份 kernel 在實際搬移前後的檔案內容，而非 2700 行的匿名常數。

## 計數契約

與 `tests/kernel-budget.test.ts` 相同：只計 `src/` 第一層的 `.ts` 一般檔，不遞迴子目錄；每檔
行數為 UTF-8 內容的 `split('\n').length - 1`，即換行字元數。`src/engines/`、
`src/autopilot/` 與其他子目錄不納入 kernel 頂層帳。

搬移當下只改變頂層 `src/cli.ts`：406 行降至 21 行，騰回 385 行；其後 `src/proc.ts`
為 Guardian 無活動看門狗增加 30 行安全邏輯，移除 `src/judge.ts` 的 diff 截斷一行，
`src/scheduler.ts` 為簽名熔斷告警接線與 commit 自證行增加 7 行，`src/lock.ts` 為 Windows PID
重用驗證增加 24 行，rebase-before-merge 與 digest blocked 清單再增 30 行，judge 驗收回饋閉環（db.lastFailureFor、scheduler 打回原因注入、verifier 檔案清單餵料）再增 20 行，免費起跑 zeroCostTags 再增 6 行，judge effort/timeout 可配置化再增 3 行，attempt duration_ms 觀測再增 12 行，目前淨騰回 254 行。併發基建 GOAL（2026-07-28）再把 notify.ts（137 行）與 proc.ts（153 行）整檔外移 src/engines/、新增 merge queue 與 concurrency 骨架共 9 行，降至 2162 行；上限同步收緊 2450→2250。digest 可讀性接線再增 5 行；token 觀測（RunResult usage＋tokens 欄＋digest 顯示）再增 16 行至 2183；影子帳接線（免費＋額度雙層）再增 5 行至 2188。此次再將 daemon 告警、冷卻表與日期回推純輔助外移至 `src/engines/daemon-alerts.ts`，`daemon.ts` 由 344 行降至 218 行；本次 mergeBack 收斂 rebase／ff 流程再減 5 行，頂層合計降至 2057 行；cached token 分離記帳（types+db）再增 3 行至 2060；artifact contract 接線（scheduler）再增 10 行至 2070；本次 worktree timeout 設定、逾時診斷與 infra 分流接線增 31 行至 2101；Telegram 終態通知服務留在 `src/engines/notify.ts`，頂層只增加設定與事件出口接線 25 行至 2126；本次 mergeBack 髒工作目錄守門與告警詳情接線增加 18 行至 2144，GOAL B 併發池餘 106 行。

## 搬移位置核對

目前與本帳目直接相關的搬移邏輯均位於允許的子目錄，沒有同名檔殘留在 `src/` 頂層：

| 搬移後檔案 | kernel 接線／用途 |
| --- | --- |
| `src/engines/notify.ts` | `src/cli/assemble.ts` 組裝 Discord／Telegram notifier |
| `src/engines/proc.ts` | `src/engines/run-verify.ts` 共用子進程執行器 |
| `src/engines/daemon-alerts.ts` | `src/daemon.ts` 保留告警薄接線 |
| `src/engines/semantic-judge.ts` | `src/judge.ts` 保留相容 re-export |
| `src/engines/worktree-checkout.ts` | `src/worktree.ts` 派工前 checkout 與 Git 根目錄驗證 |

`tests/kernel-relocation-report.test.ts` 會逐一檢查上述檔案存在、路徑只屬於
`src/engines/` 或 `src/autopilot/`，並確認 `src/` 頂層沒有同名 `.ts` 檔。

## 2026-08-12 逐檔基準快照

下表只保留搬移驗收當日的歷史快照，不作為目前值；目前值一律由測試掃描 `src/` 第一層 `.ts`，不計 `src/engines/`、`src/autopilot/`、`src/cli/` 等子目錄。

| 檔案 | 行數 |
| --- | ---: |
| `src/backlog.ts` | 204 |
| `src/cli.ts` | 21 |
| `src/daemon.ts` | 219 |
| `src/db.ts` | 185 |
| `src/digest.ts` | 111 |
| `src/events.ts` | 126 |
| `src/globalcost.ts` | 40 |
| `src/judge.ts` | 1 |
| `src/lock.ts` | 134 |
| `src/preflight.ts` | 37 |
| `src/scheduler.ts` | 465 |
| `src/types.ts` | 182 |
| `src/verifier.ts` | 99 |
| `src/verify.ts` | 94 |
| `src/worktree.ts` | 332 |
| **總計** | **2250** |

2026-08-03 帳目校正：infra-retry／rebase 補救／髒樹守門等連串交付使 `scheduler.ts` +60、
 `worktree.ts` +42，reap 前 run.db 活性雙證閘使 `types.ts` +2，合計 2248、騰回 452 行；2026-08-04 圍籬（fencing）與 todayLocal 外移 src/engines/（daemon-fence.ts／daemon-alerts.ts）後 daemon.ts 218→217，總計 2247、騰回 453 行。此次將 worktree checkout 驗證外移 `src/engines/worktree-checkout.ts`，頂層 `worktree.ts` 349→332，總計 2230、騰回 470 行；auto-goal completion gate 的主邏輯外移 `src/engines/auto-goal-completion.ts`，kernel 僅保留完成出口接線與 verify exit code，總計 2235、騰回 465 行；本次 free-only tier mode 的主邏輯留在 `src/engines/`，頂層只增加 schema 與拒派接線 3 行，總計 2238、騰回 462 行；本次免費層重試狀態查詢與 scheduler 接線增加 6 行，總計 2244、騰回 456 行。此次把既有 judge 邏輯搬至 `src/engines/semantic-judge.ts`（`src/judge.ts` 僅保留 re-export），並以子目錄承接 free-only split；backlog/parser、scheduler 與 Task metadata 接線淨調整後，總計 2232、騰回 468 行。2026-08-05 審查校準週跑接線只新增 `daemon.ts` 2 行與 `digest.ts` 4 行，總計 **2238**、騰回 **462** 行。
2026-08-07 將失敗責任分類、供應冷卻與 superseded 狀態接回 kernel，並移除 scheduler 的子任務 auto-goal completion gate，校正後總計 **2249**、騰回 **451** 行。2026-08-12 修正 no-commit 失敗分類後，總計 **2250**、騰回 **450** 行。
**2026-08-12 快照已達 2250 上限**——下一筆 kernel 頂層增長必須先搬移或刪除既有邏輯。

2026-08-14 團隊化改造將 verifier 與 verify 實作分別外移至 `src/engines/kernel-verifier.ts`、
`src/engines/run-verify.ts`；頂層保留 re-export 相容面，讓 ownership、證據鏈、並行與 mid-flight pause 接線後為 **2214 行**，仍低於 2250 硬閘。

## 可重現驗證

在 repo 根目錄執行：

```sh
npx vitest run tests/kernel-relocation-report.test.ts --reporter=verbose
npx vitest run tests/kernel-slim.test.ts tests/kernel-budget.test.ts tests/daemon.test.ts --reporter=verbose --maxWorkers=1
npm run typecheck
npm run build
```

第一個測試直接以 Git 讀取上述基準提交的 `src/*.ts`，並以相同計數函式讀取目前工作樹，斷言
2700 基準、目前 ≤2250 與 ≥250 行騰回，並核對搬移目的地。第二個測試持續守住 ≤2250 的
kernel 薄殼邊界；`kernel-budget` 仍保留既有 ≤2700 工作上限守門。

## 2026-09-08 CLI 自主開發接線

`src/types.ts` 增加一行 CLI transport 設定；`src/backlog.ts` 增加一行既有 ID 去重，並保留 CLI 明示任務的 user 來源。
主要實作在既有子目錄，頂層目前 **2217 行**，仍低於 2250 行；上限未調整。

驗證：`npx vitest run tests/kernel-relocation-report.test.ts tests/cli-llm.test.ts tests/github-reports.test.ts`。

## 2026-09-08 Freebuff 接線

`src/types.ts` 擴充 adapter 枚舉並增加一行 Freebuff 設定驗證；其餘實作位於 `src/engines/` 與 `src/github/`。頂層共 **2218 行**，低於 2250 行；未調高上限。

## 2026-09-08 完成證據與嘗試額度

`src/scheduler.ts` 接入既有 team 帳本的每日 admission、學習結果紀錄，以及合併後任務狀態寫入失敗時的暫停；計數與分析實作留在 `src/engines/`、`src/learn/`。
頂層共 **2237 行**，低於 2250 行；未調高上限。

驗證：`npx vitest run tests/kernel-relocation-report.test.ts tests/scheduler.test.ts tests/team-state.test.ts tests/learning-outcomes.test.ts`。
