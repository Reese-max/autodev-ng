# GOAL

發掘器訊號源品質——給盲人裝眼睛、給舊傷貼標籤：discoverProblems 的全部世界是 survey
組合訊號，現有三缺陷令發掘長期偏航：（a）無代碼面訊號——kernel 預算壓線、肥檔、慢測試、
worktree 堆積等架構債永遠不會被發現；（b）run.db 七日彙總把已修復的舊失敗當現役頭號訊號
（timeout 殘影 2026-07-23 實證誤導）；（c）發現鏡頭與北極星判準脫節——判準 2（額度）、
判準 3（可見性）沒有對應 lens。改為：（1）survey 組裝器新增「repo 健康指標」段——純機械
統計零 LLM 成本：kernel 頂層總行數與預算餘裕、最肥 src 頂層檔 top 3、tests/ 檔數、
data 下 worktrees 數量；統計失敗個別 fail-open 略過；（2）run.db 彙總由單一七日窗改為
「近 72h」與「前 4 日」雙段對照呈現，讓 critic 看得出趨勢（舊失敗歸零一目了然）；
（3）discoverLenses 預設值補 'cost'（額度/ROI 視角）與 'observability'（使用者看得到嗎
視角）兩鏡頭。全程沿用 8000 字元上限與既有優先序截斷。新邏輯必須有紅→綠測試，放在
tests/signal-quality*.test.ts。

## 驗收指令

```sh
npx vitest run tests/signal-quality --reporter=dot
```

## 細部要求

1. 健康指標段位置在「其他勘查訊號」內、run.db 段之前；行數統計計法對齊
   tests/kernel-budget.test.ts 的 kernelLineCount。
2. 雙段對照測試：構造「舊窗有失敗、近 72h 歸零」的 run.db fixture，斷言輸出可區分兩段。
3. lens 預設值改動在 types.ts（kernel）——僅允許改該一行 default 陣列，前置 GOAL
   kernel-slim 已騰緩衝。
4. 測試覆蓋：各統計源獨立 fail-open、8000 截斷下健康指標段的優先序、雙鏡頭出現在
   discoverProblems 實際派發的 lens 清單。
5. kernel 行數預算維持綠燈；`npm run build` 與 `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/、data/ 目錄與任何 daemon 進程。
- 改動最小化：主戰場 src/autopilot/survey-sources.ts 與 src/engines/ 子目錄。

連續無進展上限：3
