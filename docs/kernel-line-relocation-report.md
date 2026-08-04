# Kernel 頂層搬移前後行數報告

## 結論

`src/*.ts` 頂層由 **2700 行**降至 **2232 行**，實際騰回 **468 行**。因此確認頂層嚴格低於
2250 行，且至少騰回 250 行。

| 量測點 | 來源 | 頂層行數 | 與搬移前差異 |
| --- | --- | ---: | ---: |
| 搬移前 | `942554a00fdbed0b6666ff6f4a9bac140809fdce` | 2700 | 0 |
| 搬移後 | 目前工作樹 `src/*.ts` | 2232 | -468 |

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
| `src/engines/auto-goal-completion.ts` | `src/scheduler.ts` 的 auto-goal 完成證據與專屬驗收閘 |
| `src/engines/notify.ts` | `src/cli/assemble.ts` 組裝 Discord／Telegram notifier |
| `src/engines/proc.ts` | `src/verify.ts` 共用子進程執行器 |
| `src/engines/daemon-alerts.ts` | `src/daemon.ts` 保留告警薄接線 |
| `src/engines/semantic-judge.ts` | `src/judge.ts` 保留相容 re-export |
| `src/engines/worktree-checkout.ts` | `src/worktree.ts` 派工前 checkout 與 Git 根目錄驗證 |

`tests/kernel-relocation-report.test.ts` 會逐一檢查上述檔案存在、路徑只屬於
`src/engines/` 或 `src/autopilot/`，並確認 `src/` 頂層沒有同名 `.ts` 檔。

## 目前逐檔帳目

下表是正式計數的完整白名單；只計 `src/` 第一層 `.ts`，不計 `src/engines/`、`src/autopilot/`、`src/cli/` 等子目錄。

| 檔案 | 行數 |
| --- | ---: |
| `src/backlog.ts` | 203 |
| `src/cli.ts` | 21 |
| `src/daemon.ts` | 217 |
| `src/db.ts` | 178 |
| `src/digest.ts` | 107 |
| `src/events.ts` | 126 |
| `src/globalcost.ts` | 40 |
| `src/judge.ts` | 1 |
| `src/lock.ts` | 134 |
| `src/preflight.ts` | 37 |
| `src/scheduler.ts` | 463 |
| `src/types.ts` | 180 |
| `src/verifier.ts` | 99 |
| `src/verify.ts` | 94 |
| `src/worktree.ts` | 332 |
| **總計** | **2232** |

2026-08-03 帳目校正：infra-retry／rebase 補救／髒樹守門等連串交付使 `scheduler.ts` +60、
 `worktree.ts` +42，reap 前 run.db 活性雙證閘使 `types.ts` +2，合計 2248、騰回 452 行；2026-08-04 圍籬（fencing）與 todayLocal 外移 src/engines/（daemon-fence.ts／daemon-alerts.ts）後 daemon.ts 218→217，總計 2247、騰回 453 行。此次將 worktree checkout 驗證外移 `src/engines/worktree-checkout.ts`，頂層 `worktree.ts` 349→332，總計 2230、騰回 470 行；auto-goal completion gate 的主邏輯外移 `src/engines/auto-goal-completion.ts`，kernel 僅保留完成出口接線與 verify exit code，總計 2235、騰回 465 行；本次 free-only tier mode 的主邏輯留在 `src/engines/`，頂層只增加 schema 與拒派接線 3 行，總計 2238、騰回 462 行；本次免費層重試狀態查詢與 scheduler 接線增加 6 行，總計 2244、騰回 456 行。此次把既有 judge 邏輯搬至 `src/engines/semantic-judge.ts`（`src/judge.ts` 僅保留 re-export），並以子目錄承接 free-only split；backlog/parser、scheduler 與 Task metadata 接線淨調整後，總計 **2232**、騰回 **468** 行。
**距 2250 上限仍餘 18 行**——下一筆 kernel 頂層增長必須先搬移邏輯至 `src/engines/`。

## 可重現驗證

在 repo 根目錄執行：

```sh
npx vitest run tests/kernel-relocation-report.test.ts --reporter=verbose
npx vitest run tests/kernel-slim.test.ts tests/kernel-budget.test.ts tests/daemon.test.ts --reporter=verbose --maxWorkers=1
npm run typecheck
npm run build
```

第一個測試直接以 Git 讀取上述基準提交的 `src/*.ts`，並以相同計數函式讀取目前工作樹，斷言
2700 → 2232、468 行騰回、<2250 與 ≥250，並逐檔比對上表及搬移目的地。第二個測試持續守住 ≤2250 的
kernel 薄殼邊界；`kernel-budget` 仍保留既有 ≤2700 工作上限守門。
