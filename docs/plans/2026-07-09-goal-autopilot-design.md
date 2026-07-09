# GOAL 有界自主迴圈（autopilot）— 設計 spec（2026-07-09）

**一句話**：給系統一份 `GOAL.md`，它自主「規劃 → 執行 → 評估進展 → 重規劃」直到達成或撞煞車，全程複用現有 `runOnce` 的引擎/驗收/合併護欄。這是把系統從「執行器」升級為「有界自主規劃者」，是在鐵律 #1 上開的一道**受控閘門**。

## 使用者拍板（2026-07-09）
| 決策點 | 拍板 |
|---|---|
| 自主程度 | B. 有界自主（自己跑，每輪可看可停） |
| 目標來源 | `GOAL.md`（自然語言 + 可量測驗收條件） |
| 達成判定 | 可量測條件優先，無法程式化的部分才交 agent 補判 |
| 硬邊界 | **只有「連續無進展上限」**（免費引擎成本 0，不設輪數/時間/成本閘） |
| 改動落地 | 沿用現有 ff-only 自動 merge 進 main（全自主） |
| 鐵律 #1 | 修訂為帶受控例外；自主任務**寫進 backlog 但標記 `source:autopilot`** |
| 架構 | 外掛 orchestrator（`src/autopilot/`），複用 `runOnce`，kernel 不動 |
| 引擎 | GOAL session **強制免費引擎**（devin `swe-1.6` / agy），讓「無成本上限」在成本 0 前提下才安全 |
| 首次上線 | **先沙盒/示範專案驗閉環**，確認規劃品質+進展判定+煞車真的煞得住，再上 voice-actress |

## 風險自覺（設計前提）
使用者選的是四路口裡**最自主的一版**：自生任務、驗收過就自動進 main、唯一煞車是「連續無進展」。因此：
- **verify + judge 驗收閘 = 改動落地前最後一道防線**，其品質等於系統安全下限，本設計據此加嚴。
- 「進展」定義必須釘死在**可量測訊號**上，否則唯一煞車會失效。
- 首跑鎖沙盒 + 免費引擎，把「自動 merge + 無成本上限」的爆炸半徑先關進籠子。

## 鐵律 #1（修訂版，僅在 autodev-ng 專案內生效，不動使用者全域 CLAUDE.md）
> 永不自生任務——**除非在 GOAL 自主模式下**，且滿足全部條件：
> 1. **明確授權**：目標專案根目錄存在使用者放的 `GOAL.md`，且使用者啟動了 autopilot session。
> 2. **強制標記**：自生任務行必須標 `(autopilot)` + 綁定 GOAL id + 規劃輪次，例：
>    `- [ ] (autopilot) 任務文字 <!-- adng:autopilot goal:a1b2 round:3 -->`
> 3. **手排/自主永遠可區分**：資料與視覺上一眼看得出來源。
> 4. **非 session 期間退回原行為**：無 active autopilot session 時，系統對 backlog 只有「打勾 + 加註記」權，絕不新增/改寫任務文字。
> 5. **kill switch**：刪 `GOAL.md` 或按停 → orchestrator 立即停止生任務，已生任務照原規則收尾。

落地影響：autodev-ng 鐵律文件表述、`BACKLOG-adng.md` 檔頭說明（改前備份 `.bak-YYYYMMDD`）。

## 架構：外掛 orchestrator（方案 1）
新增 `src/autopilot/`（獨立層；非遞迴 `wc -l src/*.ts` 的 kernel 帳本就不含子目錄，故自動不入帳。各檔建議 ≤200 行，實際上限由 plan 定）。

四個各司其職的單元：

| 單元 | 職責 | 輸入 → 輸出 |
|---|---|---|
| **goal 解析** | 讀目標檔 | `GOAL.md` → 自然語言目標 + 可量測驗收區塊（shell 指令，exit 0 = 該項達成） |
| **planner agent** | 規劃下一批子任務 | GOAL + repo 現況 + 已完成/失敗歷史 → 1~N 條子任務，**或**宣告「已達成」/「卡住」 |
| **progress evaluator** | 量離目標多遠 | 跑可量測驗收指令 +（模糊處）judge agent → 進展分數 + 快照 |
| **backlog writer** | 落地自主任務 | 子任務 → 寫 backlog（標 autopilot），複用現有 mark 機制 |

**orchestrator 主迴圈（資料流）**：
```
讀 GOAL.md（無檔即不啟動）
loop:
  planner 產子任務
    →（相關性檢查：與 GOAL 無關的丟棄，防目標漂移）
  → backlog writer 寫入（autopilot 標記）
  → 逐條餵現有 runOnce（engine + preflight + worktree + verify + judge + ff-merge，全複用）
  → evaluator 算進展 + 記快照
  → 達成？          → 停（成功，Discord 成功通知）
  → 連續無進展達上限？→ 停（告警：卡住，人工介入）
  → planner 宣告卡住？→ 停（告警）
  → 否則重規劃，下一輪
```
關鍵：**執行完全複用 `runOnce`**；orchestrator 只做「規劃 / 評估 / 決定續停」，不碰引擎與 merge 細節。

## GOAL.md 格式（草案，plan 層定稿）
```markdown
# GOAL
把 <目標專案> 的測試覆蓋率拉到 80%，且不破壞既有行為。

## 驗收條件（可量測；exit 0 = 達成）
```sh
npm run verify && npm run coverage -- --min 80
```

## 邊界
- 引擎：devin
- 連續無進展上限：3
```
- `GOAL.md` 放**目標專案根目錄**；config 新增 `goalFile` 指向（類比現有 `backlogFile`）。
- 可量測驗收區塊是達成判定的主依據；自然語言目標供 planner/evaluator 的 agent 判斷模糊部分。

## 唯一的界：「連續無進展」精確定義
- **「進展」= 可量測驗收條件通過項數增加**，或 evaluator 有**客觀依據**判定更接近（新測試通過數↑、錯誤數↓、驗收 exit code 改善）。
- **agent 主觀「我覺得有進展」不算數**，必須錨定可量測訊號。
- 連續 **N 輪**（預設 N=3）進展分數零提升 → 強制停 + Discord 告警「GOAL 卡住，人工介入」。
- 每輪記進展快照（稽核）。

## 引擎與成本
- GOAL session **強制免費引擎**（devin `swe-1.6` credit_multiplier=0 / agy）；session 期間覆寫 defaultEngine。
- 沙盒 config 的 engines 白名單需含所選免費引擎（devin 首次進白名單即在此 session 邊界內）。
- 記帳沿用現有固定估計（免費引擎 = 0），成本閘語意保留但此組合下不作為主煞車。

## 錯誤處理 / kill switch / 稽核
- **fail-open（鐵律 #4）**：evaluator/planner 自身故障不反殺主迴圈，發告警續走或安全停。
- **kill switch**：刪 `GOAL.md` 或寫 stopFile → 立即停；已生任務照原 runOnce 規則收尾。
- **稽核**：每個 GOAL session 產一份記錄（GOAL 內容、每輪規劃、每條子任務結果+commit hash、進展快照、停止原因），存 session 目錄。

## 測試（沙盒假 repo，絕不碰真專案）
- planner 產出格式驗證（子任務結構 / 已達成 / 卡住 三態）。
- 進展評估：可量測優先 + agent 補；進展分數計算。
- **連續無進展煞車**真的觸發並停。
- **kill switch**（刪 GOAL.md / stopFile）立即停。
- backlog autopilot 標記寫入與「手排/自主可區分」。
- **鐵律 #1 回歸**：非 autopilot session 期間，系統絕不新增任務行。
- 相關性檢查：與 GOAL 無關的 planner 產出被丟棄。
- 沙盒假 repo 真跑一個小 GOAL 完整閉環（達成路徑 + 卡住路徑各一）。

## 明確不做（YAGNI）
- 不設輪數/時間/成本硬上限（免費引擎前提下多餘）。
- 不做多 GOAL 併發（一次一個 GOAL）。
- 不做每輪/每子任務人工放行閘（那退回提案模式，與 B 有界自主矛盾）。
- 首版不上 voice-actress 真專案（先沙盒）。

## 交接
本 spec 通過使用者 review 後，交 writing-plans skill 產實作 plan（Task 分解、各檔行數上限、SDD 雙判定審查流程）。
