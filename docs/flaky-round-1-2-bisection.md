# Round 1／2 worktree flaky 最小二分（2026-07-28）

## 結論

鎖定候選是 [`tests/worktree.test.ts`](../tests/worktree.test.ts) 的「殘留目錄被鎖住」案例。以目前 `HEAD dca0a30` 重跑後：

- **排除共享暫存 Git repo**：40 輪使用 40 個不同的 repo 內 temp root，共建立 80 個不同 Git repo；每輪實際 repo 數都符合該組執行的測試數。
- **排除檔內相鄰測試的跨測試狀態洩漏**：候選單跑、左鄰＋候選、候選＋右鄰、三者同跑，各 10 輪皆全綠。
- **歷史 flaky 最符合測試內檔案鎖的就緒競爭**：原始錯誤停在舊 `waitForWriteLockState(... locked=true)`，尚未進入 `prepareWorktree` 的產品斷言。舊版以輪詢猜 PowerShell 子行程何時拿到鎖；目前已由 `c77773d` 改成 READY／RELEASED 明確握手，本次 40／40 全綠。

因此，證據不支持共享 repo、共享檔案碰撞或相鄰測試污染；支持的是舊測試 helper 的鎖定子行程就緒／排程競爭。現行 `prepareWorktree` 不需再改。

## 最小集合與結果

候選與相鄰案例皆為檔案頂層 `test`，沒有外層 `describe`。每一輪都啟動新的 Vitest 行程，並只用 `--testNamePattern` 執行表中集合。

| 集合 | 每輪 tests | 輪數 | 失敗 | Git repo 數 | 累計耗時 |
|---|---:|---:|---:|---:|---:|
| 候選 | 1 | 10 | 0 | 10 | 63,125ms |
| 左鄰＋候選 | 2 | 10 | 0 | 20 | 70,909ms |
| 候選＋右鄰 | 2 | 10 | 0 | 20 | 51,298ms |
| 左鄰＋候選＋右鄰 | 3 | 10 | 0 | 30 | 71,147ms |
| **合計** | － | **40** | **0** | **80** | **256,479ms** |

三個案例依宣告順序為：

1. 左鄰：`prepareWorktree：殘留（前次崩潰留下未清的 worktree 目錄+分支）重建成功`
2. 候選：`prepareWorktree：殘留目錄被鎖住...；解鎖後重試自癒成功`
3. 右鄰：`assertWorktreeCheckout：正常 worktree → 不拋`

## 隔離與固定時鐘證據

- 每輪先建立 `.tmp-flaky-bisection/runs/<集合>/round-NN`，再把 `TEMP`、`TMP`、`TMPDIR` 全部指向該目錄；所有操作均留在目前 repo。
- 40 個執行 root 全部唯一；其下找到 80 個 `.git` 目錄與 80 份 `.adng-worktree` marker。
- 只固定 `Date` 為 `2026-07-28T00:00:00.000Z`，不 fake `setTimeout`；80 份 marker 的 `createdAt` 逐字一致，鎖定握手仍使用真實 timeout 與真實 PowerShell 子行程。
- `newRepo()` 每次呼叫 `mkdtempSync`，所以即使三個案例同跑，也不共用 repo 或 `result.txt`。

單輪命令形狀如下；四個 pattern 各在新的 temp root 重跑 10 次：

```powershell
npm test -- tests/worktree.test.ts --testNamePattern '殘留目錄被鎖住' --reporter=dot --no-color
```

## 驗收

| 指令 | 結果 |
|---|---|
| `npm test -- tests/worktree.test.ts tests/windows-file-lock.test.ts tests/kernel-budget.test.ts --reporter=dot --no-color` | 3 files、28 tests 全綠 |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 |
| `npm test -- --reporter=dot --no-color` | 124 files、1,330 tests 全綠 |

## 證據邊界

本輪驗證的是目前 HEAD 的同一候選。追蹤資料來自 `c65f6ed`，其舊 helper 以 `Date.now()` 控制輪詢 deadline，與固定 Date 的實驗條件不相容；本輪沒有把舊 helper 搬回來，也不宣稱重現了原錯誤簽章。判定依據是原錯誤位置、舊／新 helper 差異，以及目前四組隔離矩陣 40／40 全綠；不能由 40 輪推論所有機器負載下永不再發生逾時。
