# Phase 1 Kernel Spec — autodev-ng 微核心

日期：2026-07-05
前置：`docs/2026-07-05-autodev-rebirth-design.md`（含 8 條鐵律）、`docs/legacy/knowledge-legacy.md`
目標：對 **voice-actress** 跑通「backlog → 執行 → 驗證 → commit → 回報」全自動小閉環，24/7 無人值守且使用者隨時能一眼看懂系統狀態。

## 範圍

**做**：單專案（voice-actress）、單引擎（claude CLI）、手排 backlog、完整可觀測性、成本閘。
**不做**（Phase 2+）：多專案、多引擎、記憶插件、任務評分、失敗覆盤、自動 PR/deploy。

## 技術底座

- TypeScript + Node（LTS），ESM
- 依賴極簡：`better-sqlite3`（執行狀態）、`zod`（設定驗證）、`vitest`（測試）。不引框架
- 目標規模：kernel 全部 TS 碼（`wc -l src/*.ts` 頂層 16 檔）分兩道界限——
  **硬牆 < 3000 行**（源自驗屍第一原則「核心小到永遠維護得動」，不可逾越）；
  **工作上限 ≤ 2700 行**（2026-07-12 使用者拍板：現況 2500 + 緩衝 200，取代 M5「凍結 2400 + 緩衝 100 ≤2500」——該緩衝自 M5 撞頂後長期為 0，每次核心改動被迫付精簡稅，故抬升）。
  護欄：2700→3000 只准靠**外移子目錄/重構**騰空間，不准再加緩衝。守門目前為人工閘（原訂 CI 守門未建）。
  子預算不變：adapter 各 ≤150、web/ ≤800（均不計入 kernel 頂層帳）。
- 部署形態：單一 Node 進程 daemon + Windows 排程自啟；stop 檔優雅停機（繼承舊系統唯一好用的停法）

## 五模組與介面

### 1. task-store（任務庫）
- **任務來源唯一真相＝使用者手寫的 `BACKLOG.md`**（voice-actress repo 內既有格式：`- [ ] 任務描述`）
- 系統只能改勾選狀態與附註（`<!-- adng: status -->`），**永不新增任務條目**（鐵律 #1，parser 層強制）
- SQLite 只存執行紀錄：attempts、耗時、成本、失敗證據路徑——backlog 檔遺失時 SQLite 不能反向生成任務
- 介面：`nextTask(): Task | null`、`report(taskId, outcome: Outcome): void`

### 2. scheduler（排程器）
- 單迴圈 single-flight（mkdir atomic lock，Windows 無 flock——舊教訓）
- 每輪：成本閘檢查 → 取任務 → 派執行 → 收結果 → 冷卻（指數退避 on 失敗）
- **backlog 空 = idle + 一次性告警**，不空轉、不自生任務
- stop 檔（`.adng.stop`）每輪開頭檢查；連續同任務失敗 2 次 → 任務標 blocked + 告警，不無限重試（舊系統 925 respawn 之鑑）

### 3. engine（引擎轉接層）
- 介面：`interface Engine { id: string; preflight(): Promise<PreflightResult>; run(job: Job): Promise<RunResult> }`
- 首發插頭 `claude-cli`：宣告式 metadata（timeout、成本模型、認證方式、已知 failure signatures）
- 呼叫鐵三角（鐵律 #7）：prompt 走 stdin、明確 timeout、逾時雙層樹斬（taskkill /T + MSYS）、`< /dev/null`、stderr 全留檔
- preflight：spawn 前對 (engine, model) 實打 round-trip ping，結果 cache 6h（舊系統 silent 404 連炸四次的解藥）
- 執行環境：voice-actress 的 git worktree（隔離，不汙染人的工作樹）

### 4. verify（驗證閘）
- 機械層：專案測試框架自動偵測（voice-actress = npm test / next build），**timeout 視為 SKIP+告警不算 FAIL**（防慢測試 thrash）
- 語義層：semantic-verify——便宜判官（本機 proxy gpt-5.4-mini low，haiku 備援）比對 commit 宣稱 vs 實際 diff，MISMATCH 注入下輪 prompt（抓 phantom completion）
- 政策：驗證不過 → 不 commit、任務標 failed 附證據；gate 自身故障 → fail-open-with-alert（鐵律 #4）

### 5. observe（可觀測性）——一等公民
- **事件流**：單一 `events.jsonl`（輪次、任務、成本、告警全進這裡），輪替防肥大
- **心跳**：`heartbeat.json` 每輪更新（ts、state、當前任務、今日成本）；`adng status` CLI 一眼全貌
- **liveness 定義**（鐵律 #3）：24h 內 commit 產出率 + backlog 消化數——不是 PID、不是 healthz
- **告警通道**：Telegram bot（機上現成）；**每日一則摘要即使無事**（送達確認＝通道自檢，鐵律 #6；舊系統告警斷 13 天沒人知）
- **成本**：每次引擎呼叫記帳 → 日累計；$40 軟警告 / $100 硬停（80%/90%/100% 三段告警）

## 閉環定義（Phase 1 驗收標準）

1. 使用者往 voice-actress `BACKLOG.md` 加一條真任務
2. 30 分內系統撿起 → worktree 執行 → 測試過 → semantic 判 MATCH → commit 進 voice-actress
3. Telegram 收到完成通知含 commit hash 與成本
4. backlog 清空後系統 idle，告警一次，成本歸零增長
5. 拔掉 claude CLI 認證（模擬 401）→ preflight 擋下、告警送達、系統 idle 而非狂重試
6. 連續跑 72h：無殭屍進程、log 有輪替、心跳不斷、日摘要每天到

## 測試策略

- 每模組單元測試（vitest）；engine 用 fake CLI 腳本模擬 hang/429/空輸出/慢輸出四種病態
- 整合測試：對一個 fixture repo 跑完整閉環（不打真 LLM，engine 用 mock）
- E2E（上線前一次）：voice-actress 真任務一條，真 claude CLI，人工驗收

## 里程碑

| # | 交付 | 驗收 |
|---|---|---|
| M1 | repo 骨架 + task-store + scheduler（mock engine） | 單元測試綠、mock 閉環跑通 |
| M2 | claude-cli 引擎插頭 + preflight | 病態注入測試全過 |
| M3 | verify 雙層 + observe 全套 | fixture repo 整合測試綠、Telegram 通知送達 |
| M4 | voice-actress 真閉環 + 72h 浸泡 | 閉環驗收 1–6 全過 |

## 開放事項

- voice-actress `BACKLOG.md` 28 項待辦需使用者過一遍，確認哪些仍要做（避免系統執行過期意圖）
- Telegram bot token 沿用現有 or 新建（M3 前定）
