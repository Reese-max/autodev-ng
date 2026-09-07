# GOAL
讓使用者透過 CLI 完成發現、驗證、立案、修復及審查交付，能追蹤失敗並安全恢復；先以 autodev-ng 自身完成六項驗收。對應 data/autodev-self/NORTHSTAR.md，使用者已於 2026-09-08 確認。

## 六項驗收

1. 真正 CLI 修復：原始失敗檢查轉綠，worker 實際改碼、宿主提交、CI 與獨立 CLI reviewer 通過，證據綁定同一 commit。
2. 全流程 CLI：規劃、審查、判官、學習共用 CLI 呼叫；環境診斷及安全重試保留次數、工作目錄與授權檢查。
3. 使用者旅程：建立任務、執行、查看成果及中斷恢復的可重現檢查；help 包含可操作用法。
4. 產品方向：保存已確認北極星與原始使用者訊號，研究和規劃優先引用，不虛構回饋。
5. 提案與學習：有界驗證、採用／延後／拒絕記錄及去重排程；失敗教訓經證據審查後才注入。
6. 交付與成效：本機交付清單驗證精確 commit，統計已觀察結果；巡檢與長時間修復分開執行。

## 機械驗收

```sh
npm run build
npm run typecheck
npm test
node scripts/verify-autonomy.mjs --config configs/integrations/github-repair.json --issue 4
```

引擎：codex-sol
連續無進展上限：3

## 佐證檔案
- data/autodev-self/NORTHSTAR.md
- data/autodev-self/USER-SIGNALS.md
- docs/verification/cli-autonomy-2026-09-08.md

## 執行界線
由目前 Codex GOAL 執行，未啟動另一個專案 daemon。Windows sandbox 未通過前保留修復暫停旗標。外部發布仍依明確授權。
