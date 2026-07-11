# autodev-ng

24/7 全自動開發母艦（重練版）——微核心 + 插件式智慧，只做使用者手排 backlog 裡的事，永不自生任務。

## 核心特點

- **微核心 + 插件**：kernel（`src/*.ts`，帳 ≤2500 行）只管任務庫/排程/引擎轉接/驗證閘/心跳；教訓記憶、GOAL 自主、Discord bot 全是掛在旁邊的插件目錄，不吃 kernel 帳。
- **失敗學習迴圈**：任務失敗或 blocked 時，reflect 用 LLM 從證據提煉一條教訓寫進 `learnings.md`，下一輪派工 prompt 自動附上——不會重蹈覆轍。
- **三操作面**：CLI（`node dist/cli.js`）、Discord bot（雙向指令）、Web 控制台（唯讀監看+一鍵控制），三者共用同一份 handler 邏輯，零重複實作。
- **有界自主 GOAL**：可選開一個「連續無進展就自動停」的自主迴圈，由 planner LLM 自己拆任務、派工、驗證，唯一煞車是「連續 N 輪沒進展」；受控例外——只有帶 `autopilot` 標記的行才算系統自產任務，鐵律 #1（任務只能來自使用者）不破。

## 架構總覽

```
┌─────────────────────────── 操作面 ───────────────────────────┐
│  CLI (dist/cli.js)   Discord Bot (dist/bot/index.js)   Web (web/server.mjs :3900) │
│       status/run-once/daemon      /status /cost /backlog        GET /api/status   │
│       /notify-test                /task /goal /lessons ...      POST /api/run-once│
│                                    9 個唯讀+控制 slash command    /api/goal/* 等    │
└───────────────┬───────────────────────┬──────────────────────────┬───────────────┘
                │                       │                          │
                │        全部走同一份 src/bot/handlers.ts::handleCommand（web 是另一張皮）
                ▼                       ▼                          ▼
┌─────────────────────────────── kernel（src/*.ts，≤2500 行）───────────────────────┐
│ backlog.ts 任務庫  scheduler.ts 排程  engines/registry.ts 引擎轉接（9 adapter）    │
│ verifier.ts/verify.ts 驗證閘  daemon.ts 24/7 主迴圈+OOM/idle 閘  events.ts 心跳    │
│ db.ts 成本帳(sqlite)  worktree.ts 隔離工作區  notify.ts Discord 單向告警  lock.ts  │
└───────────────┬────────────────────────────────────────────────┬──────────────────┘
                │                                                  │
                ▼                                                  ▼
┌────────────────────── 插件（不吃 kernel 帳，各檔 ≤200 行）──────────────────────┐
│ src/learn/    LessonStore + reflect（教訓庫）                                     │
│ src/autopilot/ goal.ts/planner.ts/evaluator.ts/orchestrator.ts（GOAL 自主迴圈）    │
│ src/bot/      config/handlers/actions/route/silence/index（Discord bot）          │
└─────────────────────────────────────────────────────────────────────────────────┘
                │
                ▼
┌────────────────────────────── 資料面（dataDir）──────────────────────────────────┐
│ run.db(sqlite 成本/attempts)  heartbeat.json  events.jsonl  learnings.md          │
│ notify-dlq.jsonl  daemon.lock/bot.lock  silence.json  goal-*.jsonl  worktrees/    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

引擎矩陣（`src/engines/`，9 個 adapter，per-task `[engine:xxx]` 行內 tag 或 config `defaultEngine` 選擇）：claude-cli（真值計費）、m3（MiniMax，走 claude-cli 換後端 env）、codex、agy（WSL Antigravity，免費）、copilot、qwen、grok、opencode/zen（免費）、devin（swe-1.6，免費）。生產專案 voice-actress 白名單目前只開 claude + m3。

## 功能矩陣（里程碑 → 能力）

| 里程碑 | 能力 |
|---|---|
| M1–M5 | 核心閉環：backlog 任務庫、排程器、引擎轉接（8 adapter 起步）、驗證閘（無證據不 commit）、心跳/成本帳、worktree 隔離、web 控制台雛形 |
| M6 | GOAL 有界自主迴圈（autopilot）：planner/evaluator/orchestrator，唯一煞車=連續無進展 |
| M7 | 教訓庫（reflect + LessonStore）：失敗才寫、專案層自動、全局層人工策展、注入派工 prompt |
| M7.5 | OOM 閘（可用記憶體 <15% 跳過本輪）+ idle 要任務告警（冷卻閘防洗版） |
| M8 | 雙向 Discord bot：9 個 slash command（唯讀查詢 + 軟控制 + /ask + /task） |
| M8.2 | `/goal set|run|status|stop` 遙控 GOAL autopilot（真 spawn 子進程）+ `/lessons` 教訓查詢 |
| M9–M9.1 | Web 控制台升級：六面板（status/cost/backlog/log/lessons/goal）+ pause/resume/task/silence 遙控，複用 bot handler 零重複邏輯 |

第九引擎 Devin（swe-1.6，免費）與 M8.3 worktree 清理順序修復為併行的小里程碑，未列獨立行但已併入 main。

## 快速開始

### 1. 準備 config（JSON，範例見 `configs/voice-actress.json`）

必填欄位：`projectPath`（目標專案路徑）、`backlogFile`（使用者手排任務檔）、`dataDir`（本專案的觀測/成本/鎖檔目錄）。

常用欄位：

```json
{
  "projectPath": "D:/path/to/your-project",
  "backlogFile": "D:/path/to/your-project/BACKLOG-adng.md",
  "dataDir": "../data/your-project",
  "goalFile": "../data/your-project/GOAL.md",
  "worktreesDir": "../data/your-project/worktrees",
  "defaultEngine": "claude",
  "engines": { "claude": { "adapter": "claude-cli" } },
  "verifyCommand": "npm test",
  "judgeUrl": "http://127.0.0.1:8317/v1",
  "judgeApiKey": "<你的-proxy-key>",
  "dailySoftUsd": 40,
  "dailyHardUsd": 100,
  "learningsFile": "../data/your-project/learnings.md",
  "botTokenFile": "C:/Users/Administrator/.adng/bot.env",
  "botAllowedUserIds": ["<Discord user id>"],
  "botGuildId": "<Discord guild id>"
}
```

選配欄位說明：
- `goalFile`：未設就沒有 GOAL autopilot 能力（`/goal set` 會回「config 未設 goalFile」）。
- `learningsFile` / `globalLearningsFile`：`learningsFile` 未設時預設 `<dataDir>/learnings.md`（零設定自動開啟）；`globalLearningsFile` 為跨專案人工策展的全局教訓，未設即不注入。
- `botAllowedUserIds` / `botGuildId` / `botTokenFile`：不設 bot 相關欄位就是 fail-closed（allowlist 空陣列＝全員鎖死），Discord bot 需要這三者才能安全上線。

### 2. build

```
npm run build
```

### 3. CLI

```
node dist/cli.js status --config <path>       # 唯讀狀態（heartbeat/成本/backlog/DLQ）
node dist/cli.js run-once --config <path>      # 跑一輪就退出
node dist/cli.js daemon --config <path>        # 24/7 常駐主迴圈
node dist/cli.js notify-test --config <path>   # Discord 告警通道送達自檢
```

### 4. Discord bot（可選）

```
node dist/bot/index.js --config <path>
```

需先建立 token 檔（`botTokenFile` 指向的路徑，或環境變數 `ADNG_BOT_TOKEN`）；細節見 `docs/bot-ops.md`。

### 5. Web 控制台（可選）

```
node web/server.mjs --config <path>
```

只 bind `127.0.0.1:3900`，啟動時終端機印出的 URL 帶一次性 CSRF token（`http://127.0.0.1:3900/?token=...`），瀏覽器開該網址即可監看六面板並下控制指令。

## 三操作面對照表

| 功能 | CLI | Discord | Web |
|---|---|---|---|
| 查狀態/成本/backlog | `status` | `/status` `/cost` `/backlog` | 六面板 + 總覽三徽章 |
| 查事件/教訓 | 讀 `dataDir/events.jsonl` | `/log` `/lessons` | Log / Lessons 面板 |
| 跑一輪 | `run-once` | — | POST `/api/run-once` |
| 開/停 daemon | `daemon`（前景常駐） | — | POST `/api/daemon/start`/`stop` |
| 暫停/恢復 | 手動建/刪 `stopFile` | `/pause` `/resume` | POST `/api/pause`/`resume` |
| 加任務 | 直接編輯 backlog 檔 | `/task <文字>` | POST `/api/task` |
| 靜音告警 | — | `/silence <分鐘>` | POST `/api/silence` |
| 問 LLM | — | `/ask <問題>` | — |
| GOAL 自主迴圈 | `node dist/autopilot/run.js --config <path>`（前景） | `/goal set\|run\|status\|stop` | Goal 面板 + set/run/stop 按鈕 |
| 告警自檢 | `notify-test` | — | — |

## 鐵律摘要

1. **永不自生任務**：任務只能來自使用者手排的 backlog 檔；GOAL autopilot 是唯一受控例外（帶 `<!-- adng:autopilot -->` 標記的行才算系統自產，且需使用者先 `/goal set` 授權，唯一煞車=連續無進展，另有 kill-switch）。
2. **fail-open**：教訓庫/bot/web/通知等觀測與智慧面任何故障絕不反殺 24/7 主迴圈（唯一硬擋留在 preflight 與成本閘）。
3. **告警送達確認**：不信 healthz/PID 活著，`notify-test` 端到端驗證送達；digest 每日必達不受 silence 影響。
4. **kernel 帳紀律**：`wc -l src/*.ts | tail -1` ≤2500 行；新功能一律進 `src/learn/`、`src/autopilot/`、`src/bot/`、`src/engines/`、`web/` 子目錄，不進 kernel 帳，各檔另有自己的行數上限（插件 ≤200、adapter ≤150）。

## 開發規範

- **SDD 流程**：spec → plan（`docs/plans/`）→ subagent 逐 task TDD 實作 → 雙判定審查（Spec 合規 + 程式碼品質）→ opus 全分支最終審查 → `merge --no-ff` 回 main（本地，預設不 push）。進度與裁決記在 `.superpowers/sdd/progress.md`（ledger，最權威）。
- **kernel 帳**：每次改動前後跑 `wc -l src/*.ts | tail -1` 核對 ≤2500；implementer 自報行數不可信，一律由審查者/主控獨立 `wc` 核實。
- **測試**：`npm test`（即 `vitest run`）。本機（768 進程負載環境）並行跑測試會有假逾時，`vitest.config.ts` 已固定 `maxWorkers: 1` + `testTimeout: 20000`，serial 模式才可信。
- **build**：`npm run build`（`tsc -p tsconfig.build.json`，只含 `src/`）；`npm run typecheck` 走含 `tests/` 的原始 `tsconfig.json`。
- **換行**：全 repo LF-only（`.gitattributes` 已設）；改共用非 git 版控檔案前先備份 `.bak-YYYYMMDD`。
- **commit**：conventional commit（`feat:`/`fix:`/`docs:` 等），voice-actress 專案另有 `KPI-impact:` 之類的專案特規 hook，見 config 的 `extraDirective`。
