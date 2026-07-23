# GOAL

merge-conflict 自動補救——舊基底 worktree 先 rebase 再合：任務 worktree 合併回 main 失敗
（merge-conflict）時，目前直接記 task-blocked，整段工作擱淺。改為：（1）合併失敗時先中止
（merge --abort 還原乾淨狀態），將 worktree 分支自動 rebase onto 最新 main；（2）rebase 乾淨
完成 → 重跑當前 GOAL 專屬驗收指令（parseGoal 自 GOAL.md；無專屬指令則跑全域
cfg.verifyCommand）確認 rebase 未破壞成果，綠燈後重試合併一次；（3）rebase 本身衝突、驗收
紅燈、或重試合併仍失敗 → rebase --abort（如適用）後走現行 merge-conflict/blocked 路徑，
事件 data 標注 rebase-attempted 與失敗階段（rebase/verify/merge），供統計自動補救成功率。
每次合併失敗至多自動補救一次，嚴禁迴圈。全程不得讓未合併的 commit 遺失（補救失敗後分支
必須完整保留）。新邏輯必須有紅→綠測試，放在 tests/merge-rebase*.test.ts。

## 驗收指令

```sh
npx vitest run tests/merge-rebase --reporter=dot
```

## 細部要求

1. 測試用真實臨時 git repo 演練：乾淨 rebase 救回、rebase 衝突走 blocked、rebase 後驗收
   紅燈走 blocked 且分支保留、至多補救一次。
2. rebase/merge 的 git 指令一律帶 timeout（沿用既有 proc 執行機制），逾時視同該階段失敗。
3. 向後相容：合併一次成功的路徑行為完全不變。
4. kernel 行數預算維持綠燈；`npm run build` 與 `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/、data/ 目錄與任何 daemon 進程。
- 改動最小化：只動達成目標所需的檔案。

連續無進展上限：3
