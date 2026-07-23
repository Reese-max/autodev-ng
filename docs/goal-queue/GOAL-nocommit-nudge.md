# GOAL

phantom completion 當場補救——no-commit 不再整輪歸零：scheduler（src/scheduler.ts）偵測到
引擎宣稱完成但 worktree 無新 commit 時，目前直接記 no-commit 失敗，整輪引擎時間歸零。改為：
（1）偵測到 no-commit 時，同一輪內對同一引擎立即補發一次簡短 nudge prompt（明確告知「你宣稱
完成但 worktree 無新 commit——若工作已完成請實際執行 git add 與 git commit；若未完成請如實
回報」），nudge 後重新檢查 commit：有新 commit → 回到正常 verify 流程；仍無 → 才記 no-commit
失敗（detail 標注 nudged，供統計 nudge 救回率）；（2）每 attempt 最多 nudge 一次，嚴禁迴圈；
（3）任務 prompt 組裝處補一行完成定義：「完成定義＝存在新 commit，無 commit 視為未完成」。
nudge 呼叫失敗（引擎錯誤/timeout）視同 nudge 無效，走現行 no-commit 失敗路徑（fail-open，
不得讓排程停擺）。新邏輯必須有紅→綠測試，放在 tests/nocommit-nudge*.test.ts。

## 驗收指令

```sh
npx vitest run tests/nocommit-nudge --reporter=dot
```

## 細部要求

1. nudge 救回的 attempt 記帳須含 nudge 成本（該引擎 costPerRunUsd 照計，不得隱形）。
2. 測試覆蓋：nudge 後有 commit（救回）、nudge 後仍無 commit（失敗且 detail 含 nudged）、
   nudge 呼叫本身故障（fail-open）、每 attempt 至多一次 nudge。
3. 向後相容：invalidatePreflight 等既有 no-commit 後續處理不變。
4. kernel 行數預算維持綠燈；`npm run build` 與 `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/、data/ 目錄與任何 daemon 進程。
- 改動最小化：只動達成目標所需的檔案。

連續無進展上限：3
