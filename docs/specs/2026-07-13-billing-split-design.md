# 訂閱引擎成本分離帳 — 設計文件（M9.9）

## 問題

日成本頂（dailySoft/HardUsd）踩的是 attempts 表全額總和，含訂閱制引擎（codex 走 ChatGPT 訂閱、邊際成本≈0）的每 run 固定估值。實測後果（2026-07-13 閉環驗證，ledger 記載）：昨日累積 $22 估值把新 session 預算吃光，autopilot 空轉 3 輪誤觸 no-progress 收斂——**煞車保護不存在的錢包，卻真擋工作**。

## 決策（使用者拍板）

**分離帳**：訂閱引擎的估值照記（審計/用量分析保留），但日頂煞車只看**真金帳**（billed）。

## 設計

1. **`EngineConfigSchema` 加 `subscription?: boolean`**（types.ts）：標記走訂閱額度的引擎。config 是訂閱清單的單一事實來源。
2. **attempts 表加 `engine` 欄**（db.ts）：冪等 migration——`PRAGMA table_info(attempts)` 檢查無 engine 欄才 `ALTER TABLE attempts ADD COLUMN engine TEXT NOT NULL DEFAULT ''`。`AttemptRecord` 加 `engine?: string`，`record()` 寫入。
3. **帳目分離查詢**（db.ts）：
   - `billedCostForLocalDay(day, offsetHours, subscriptionEngines: string[])`：`SUM(cost_usd) WHERE engine NOT IN (清單)`——**fail-safe：engine 空（歷史列）或未知一律算真金**（寧誤煞不漏煞）。
   - 既有 `costForLocalDay` 保留＝名義總帳（審計）。
   - `dayStats` 加 `billedUsd` 欄位（同排除邏輯），供顯示端雙數字。
4. **踩頂改真金**（scheduler.ts）：`todayCost` 改用 `billedCostForLocalDay`（訂閱清單從 `cfg.engines` 過濾 `subscription===true` 的 tag）。heartbeat `todayCostUsd` 語意隨之變為 billed（＝踩頂數字，顯示與煞車一致）。
5. **顯示端雙數字**（digest.ts＋bot handlers cmdCost）：「真金 $X｜訂閱名義 $Y」（Y＝名義總帳−billed），避免「顯示大數卻不煞車」困惑。
6. **configs**：voice-actress 與 prompt-autoresearch 的 codex 引擎設 `"subscription": true`。

## Fail-safe 原則

- engine 欄空/未知 → 真金（保守）。
- migration 冪等，舊庫升級零資料損失。
- `subscription` 未設 → false → 行為與現狀完全一致（向後相容）。

## 不做（YAGNI）

雙欄 billed/nominal schema、web 面板獨立改動（吃 cmdCost 文字自然帶到）、費率換算。

## 測試

migration 冪等；record 帶 engine 落庫；billed 排除訂閱、名義含全部；空 engine 歷史列算真金；scheduler 日頂用 billed（訂閱引擎 N 次不觸頂、真金照觸）；digest/cmdCost 雙數字。
