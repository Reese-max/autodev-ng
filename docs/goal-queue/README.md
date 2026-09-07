# GOAL 規格與驗收索引

2026-09-07 依目前原始碼與測試重新盤點。這裡保存歷史規格，不代表 daemon 正在執行，也不會因更新本表而派工。完整回歸結果見 [專案清理驗收](../verification/project-cleanup-2026-09-07.md)。

## 已有實作與對應測試

| 規格 | 現況與驗收入口 |
|---|---|
| [GOAL-reap-idlechild.md](GOAL-reap-idlechild.md) | Supervisor 健康分類與回收；`tests/supervisor-health/` |
| [GOAL-restart.md](GOAL-restart.md) | `restart.request` 與 daemon 優雅重啟；`tests/daemon-restart*.test.ts` |
| [GOAL-adaptive-rotation.md](GOAL-adaptive-rotation.md) | 成功率加權輪替；`tests/adaptive-rotation.test.ts` |
| [GOAL-review-gate.md](GOAL-review-gate.md) | 依風險執行 Reviewer，必要審查缺證據即阻擋；`tests/review-gate.test.ts`。現行接線以 config 與原始碼為準，舊 swe-check 描述為歷史設計 |
| [GOAL-survey.md](GOAL-survey.md) | 多來源 survey；`tests/survey-sources*.test.ts` |
| [GOAL-author.md](GOAL-author.md) | 自動 GOAL 驗收品質閘；`tests/author-gate.test.ts` |
| [GOAL-roi.md](GOAL-roi.md) | 問題帳本成本／結果與 ROI；`tests/ledger-roi*.test.ts` |
| [GOAL-kernel-slim.md](GOAL-kernel-slim.md) | **已實作** CLI 薄殼與模組搬移；頂層 **2215／2250 行**，餘裕 35 行；`tests/kernel-slim.test.ts` |
| [GOAL-visibility.md](GOAL-visibility.md) | 立案與 digest 通知；`tests/visibility-*.test.ts` |
| [GOAL-verifyfail-detail.md](GOAL-verifyfail-detail.md) | 驗收失敗詳情；`tests/verifyfail-detail.test.ts` |
| [GOAL-nocommit-nudge.md](GOAL-nocommit-nudge.md) | 無 commit 時補救一次；`tests/nocommit-nudge.test.ts` |
| [GOAL-merge-rebase.md](GOAL-merge-rebase.md) | **已實作** 合併前 rebase 與重新驗收；`tests/merge-rebase.test.ts` |

以上表示本機存在實作與測試，部署狀態需另以目標主機證據確認。Kernel 行數以 `tests/kernel-slim.test.ts` 即時計算；舊表的「2700 行、零餘裕」與 kernel-slim／merge-rebase「執行中」不再適用。

## 尚無完整驗收的歷史草稿

| 規格 | 複核結果 |
|---|---|
| [GOAL-verify-tiered.md](GOAL-verify-tiered.md) | 缺少規格指定的 `tests/verify-tiered*.test.ts`；現行 GOAL／增量驗收不等於已完成該規格全部要求 |
| [GOAL-signal-quality.md](GOAL-signal-quality.md) | 缺少 `tests/signal-quality*.test.ts`；預設 `discoverLenses` 尚未納入該規格要求的 cost／observability |
| [GOAL-critic-probe.md](GOAL-critic-probe.md) | 缺少 `tests/critic-probe*.test.ts`，不能標為已驗收 |
| [GOAL-northstar.md](GOAL-northstar.md) | 缺少 `tests/northstar-iterate*.test.ts`，不能標為已驗收 |
| [GOAL-herdr-probe.md](GOAL-herdr-probe.md) | 現在已有 Herdr adapter 與 `tests/herdr.test.ts`；原規格要求的四題實測報告及 `tests/herdr-probe*.test.ts` 未出現在本 checkout，舊「已派」狀態不可沿用 |
| [GOAL-user-evidence.md](GOAL-user-evidence.md) | 缺少 `tests/user-evidence*.test.ts` 與該規格要求的產品證據管線 |

這些是尚未交付的功能草稿，不是本次清理重新建立的任務。立新 GOAL 前，仍須依 [CLAUDE.md](../../CLAUDE.md) 確認使用者的北極星與價值判準。

其他歷史工作：純免費層已有 `tests/free-tier-v1/`；審查校準已有 `tests/review-calibration.test.ts` 與 `docs/review-calibration/`，不等同於巡檢自身 KPI 全部完成。申辯輪仍維持舊索引的撤案記錄，不據其他草稿內的矛盾敘述重新立案。

## 使用既有規格

只在目標任務已獲授權時，才將規格交給 daemon：

1. 核對目標專案的 NORTHSTAR 與驗收指令。
2. 確認 daemon 位於可切換的 session 邊界。
3. 備份現有 `data/<project>/GOAL.md`，不得覆寫同名備份。
4. 使用 `parseGoal` 實測 objective、verifyCommand 與 noProgressLimit，再切換規格。
5. 收案後依既有流程備份並移走舊 GOAL，或換成已授權的下一項。

## devin-only 模式範本

[configs/modes/autodev-self.devin-only.json](../../configs/modes/autodev-self.devin-only.json) 是複製到 `configs/autodev-self.json` 使用的完整模式範本。相對路徑以**複製後的設定位置**解析；不要直接以 `--config configs/modes/...` 啟動。

範本只保留 Devin 引擎，2026-09-07 將舊 24 小時 timeout 校正為現行 2 小時上限並通過設定 schema。切換前備份目前設定；GOAL 交付後才使用 `restart.request` 優雅重啟。恢復原模式使用該次備份，不以 `git checkout` 覆蓋使用者尚未提交的設定。

## GOAL 格式

- 第一行為 `# GOAL`，objective 寫在標題之後、第一個 `##` 之前。
- 驗收使用 `sh`／`bash` 程式碼圍欄，內容為實際可執行的機械指令。
- 明示 `連續無進展上限：N`；本次 18 份規格均能解析出 objective 與驗收指令。
