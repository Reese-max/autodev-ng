# autodev-ng

以微核心與插件協調已授權的開發任務；巡檢可自動提出 GitHub Issue，具備明確檢查契約的缺陷可接續 CLI 自動修復。

文件入口：[專案導覽、現況與待辦](docs/README.md) · [Discord 維運](docs/bot-ops.md) · [Supervisor 維運](docs/supervision-playbook.md) · [GitHub Issue 接單](docs/github-issues.md) · [自動立案與研究](docs/github-reports.md) · [CLI 自動修復](docs/github-repair.md) · [CLI 自主開發與安全恢復](docs/cli-autonomy.md)

## 核心特點

- **微核心 + 插件**：kernel（`src/*.ts`，帳 ≤2250 行）只管任務庫/排程/引擎轉接/驗證閘/心跳；教訓記憶、GOAL 自主、Discord bot 全是掛在旁邊的插件目錄，不吃 kernel 帳。
- **本機工程團隊模式**：明示 ownership 的 low-risk 任務可依 `concurrency` 真正重疊執行；Git common-dir SQLite 負責原子 claim、成本保留與單一 Merge Captain，最終 CI／Reviewer／Release receipt 綁定精確 commit。
- **失敗學習迴圈**：任務失敗或 blocked 時，reflect 用 LLM 從證據提煉一條教訓寫進 `learnings.md`，下一輪派工 prompt 自動附上——不會重蹈覆轍。
- **三操作面**：CLI（`node dist/cli.js`）、Discord bot（雙向指令）、Web 控制台（監看與控制）。Discord 與 Web 的查詢／控制共用 `src/bot/handlers.ts`；CLI 由 `src/cli/` 分派，接到共用排程與設定組裝。
- **Fleet Guardian**：多專案 supervisor 每輪只把新失敗、探測降級、重啟／回收或超過 wedge hard-cap 的事故交給單一 `gpt-5.6-luna`（reasoning `max`）診斷、修復與實證驗證；健康專案不呼叫 LLM。
- **有界自主 GOAL**：可選開一個「連續無進展就自動停」的自主迴圈，由 planner LLM 自己拆任務、派工、驗證，唯一煞車是「連續 N 輪沒進展」；受控例外——只有帶 `autopilot` 標記的行才算系統自產任務，鐵律 #1（任務只能來自使用者）不破。

## 架構總覽

| 位置 | 責任 |
|---|---|
| `src/*.ts` | kernel：backlog、排程、daemon、SQLite 成本帳、事件、鎖與 worktree；頂層總量 ≤2250 行 |
| `src/cli/` | CLI 分派、設定解析、相依組裝與各子指令；`src/cli.ts` 保留入口與相容匯出 |
| `src/engines/` | 引擎 adapter／路由、驗證、ownership、團隊協調、merge queue、證據鏈與通知 |
| `src/autopilot/` | GOAL 解析、規劃、執行、評估、問題帳本與持續迴圈 |
| `src/learn/` | 教訓儲存、失敗反思與派工提示注入 |
| `src/bot/`、`web/` | Discord 與本機 Web 控制台；共用查詢／控制 handler |
| `src/supervisor/`、`src/guardian/` | daemon 健康探測、保活，以及事故診斷與修復 |
| `src/github/` | GitHub Issue 同步、執行與受設定控制的修復分支／草稿 PR 發布 |
| `configs/`、`scripts/` | 各專案設定、Windows 啟動／排程腳本與檢查工具 |
| `tests/`、`docs/` | 回歸測試、規格、維運說明與歷史驗收紀錄 |

任務主流程：`src/cli/entry.ts` → `assemble.ts` → `scheduler.ts` → worktree／engine → 驗證與審查 → merge queue／receipt。

執行資料位於設定指定的 `dataDir`（`run.db`、`heartbeat.json`、`events.jsonl`、教訓與證據等）；repo 共用的協調資料庫位於 `<git-common-dir>/autodev-ng/team.db`。`data/`、`dist/` 與 `node_modules/` 不納入版控。

引擎矩陣（`src/engines/`，per-task `[engine:xxx]` 行內 tag 或 config `defaultEngine` 選擇）：

已實作的引擎接法（`m3` 共用 `claude-cli` adapter；另有測試用 `mock`）：
- claude-cli（真值計費）
- m3（MiniMax，走 claude-cli 換後端 env）
- codex（OpenAI Codex CLI，支援 sol/luna/terra 多模型檔位）
- agy（WSL Antigravity，免費）
- copilot（GitHub Copilot CLI）
- qwen（阿里 Qwen，走 OpenAI 相容 proxy）
- grok（xAI Grok CLI）
- opencode/zen（免費）
- devin（Cognition Devin CLI，swe-1.6，免費）
- herdr（透過 `Start-Herdr-Autopilot.ps1` 執行受控 Herdr 工作）

尚未實作 adapter（目前不在 registry）：
- gemini（Google Gemini CLI）
- cline（Cline CLI）
- kiro（Kiro CLI）

各專案允許的引擎以其設定檔 `engines` 為準；已有 adapter 不代表本機已登入或可用。

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

### 0. 安裝相依套件

需要 Node.js ≥22；CI 使用 Windows + Node.js 22。在專案根目錄執行：

```powershell
npm ci
```

npm 12 會依 `package.json` 的 `allowScripts` 決定是否執行相依套件安裝腳本；本專案僅允許鎖定版本的 `better-sqlite3` 建置原生模組。PowerShell 若需將參數傳給 npm script，使用 `npm.cmd test -- ...`。

### 1. 準備 config（JSON，現有設定見 `configs/autodev-self.json`）

`configs/` 內含本機部署路徑，使用前須核對。相對路徑以設定檔所在目錄解析；模式變體放在 `configs/modes/`，整合設定放在 `configs/integrations/`，避免被 fleet supervisor 當成另一個專案。

現有六份設定以本 checkout 與相鄰專案目錄解析路徑；缺少原 backlog 的專案使用 `data/<project>/BACKLOG.md`。模式範本須先複製到 `configs/autodev-self.json`，再由該位置解析相對路徑。Windows 啟動／排程腳本會從自身位置找到 repo；不再依賴固定磁碟路徑。

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
  "defaultRisk": "medium",
  "concurrency": 1,
  "reviewEngine": "gpt-5.6-terra",
  "judgeUrl": "http://127.0.0.1:8317/v1",
  "judgeApiKey": "{env:JUDGE_API_KEY}",
  "dailySoftUsd": 40,
  "dailyHardUsd": 100,
  "learningsFile": "../data/your-project/learnings.md",
  "botTokenFile": "C:/Users/Administrator/.adng/bot.env",
  "botAllowedUserIds": ["<Discord user id>"],
  "botGuildId": "<Discord guild id>"
}
```

選配欄位說明：
- `judgeApiKey`：以 `{env:JUDGE_API_KEY}` 引用啟動程序的環境變數；不要將真實金鑰寫進版控。
- `goalFile`：未設就沒有 GOAL autopilot 能力（`/goal set` 會回「config 未設 goalFile」）。
- `learningsFile` / `globalLearningsFile`：`learningsFile` 未設時預設 `<dataDir>/learnings.md`（零設定自動開啟）；`globalLearningsFile` 為跨專案人工策展的全局教訓，未設即不注入。
- `botAllowedUserIds` / `botGuildId` / `botTokenFile`：不設 bot 相關欄位就是 fail-closed（allowlist 空陣列＝全員鎖死），Discord bot 需要這三者才能安全上線。
- `concurrency`：預設 `1`。大於 `1` 時只讓明示 `risk:"low"` 且 ownership 不重疊的任務進平行 lane；未宣告或不合法的 ownership 會安全降級為全 repo 獨佔。
- `reviewEngine`：中高風險必須有 Reviewer；未設時可沿用既有 `auditModel`，兩者皆缺或 Reviewer 無法完成時為 `BLOCKED`。
- `releaseApprovalFile`：發布型任務的人工作業核可 JSON；`candidateCommit` 必須精確等於待合併 commit，否則為 `BLOCKED`。一般 scheduler 不會自行 push 或部署；GitHub Issue 整合另以 `enabled`／`publish` 控制修復分支推送與草稿 PR，見 [接單文件](docs/github-issues.md)。

任務 ownership 使用行尾 JSON，不支援 glob；指定的寫入路徑若經過 symlink／junction，會在取得團隊寫入權前拒絕，候選變更也會再次檢查：

```markdown
- [ ] 修正排程 <!-- adng:ownership {"write":["src/scheduler.ts","tests/scheduler.test.ts"],"resources":[],"risk":"low"} -->
```

每次正式 CLI 執行會把 gate bundle 與 merge receipt 寫入 `<dataDir>/evidence/`；repo 級 claim／merge queue 則位於 `<git-common-dir>/autodev-ng/team.db`。

### 2. build

```powershell
npm run build
```

### 3. CLI

```powershell
node dist/cli.js status --config <path>       # 唯讀狀態（heartbeat/成本/backlog/DLQ）
node dist/cli.js run-once --config <path>      # 跑一輪就退出
node dist/cli.js daemon --config <path>        # 24/7 常駐主迴圈
node dist/cli.js notify-test --config <path>   # Discord 告警通道送達自檢
node dist/cli.js supervise --configs-dir configs                         # 相容模式：保活後 inline Guardian
node dist/cli.js supervise --configs-dir configs --guardian off          # 只跑 supervisor（建議獨立排程）
node dist/cli.js supervise --configs-dir configs --guardian only         # 獨立 Guardian 排程；仍先做一次安全探測
```

Guardian 不啟動 subagent，也不另設專案任務總時間／成本上限；Codex 完全無輸出進度 30 分鐘才由 idle watchdog 精準終止。相同事故以 supervisor 狀態與位元組事件游標去重，`failed`／`needs_attention`／卡死會送 Discord 告警；LLM 使用隔離 `CODEX_HOME` 與 `workspace-only` 權限，只能修改工作區檔案，Git 提交、重啟與驗收由宿主執行。每次決策、token、耗時與獨立驗收證據寫入各專案 `<dataDir>/guardian-runs.jsonl`，跨專案租約與輸出 schema 位於 `data/guardian/`。

建立 `configs/.adng.stop` 會暫停整個 fleet：launcher、直接 `supervise`、Guardian、持續 patrol 與 `/goal run` 都不會啟動工作；Discord bot 控制面仍可在線接受狀態查詢與後續明確恢復指令。

只讀 Herdr fleet 控制台（要求既有 `herdr-autopilot` session 為 compatible；不會啟動 Herdr、恢復 fleet 或派工）：

```powershell
pwsh -NoProfile -File scripts/herdr-fleet-console.ps1
```

Herdr adapter 只在任務明確標成 `[engine:herdr]` 時使用；`engines.herdr.command` 必須指向 `Start-Herdr-Autopilot.ps1`，並設定 `costPerRunUsd`。可選的 `engines.herdr.provider` 為 `Codex` 或 `Pi`，未設仍走 Codex；Pi 必須先有可用模型／provider。AutoDev 仍擁有 worktree、提交與最終驗收。

### 4. Discord bot（可選）

```powershell
node dist/bot/index.js --config <path>
```

需先建立 token 檔（`botTokenFile` 指向的路徑，或環境變數 `ADNG_BOT_TOKEN`）；細節見 `docs/bot-ops.md`。

### 5. Web 控制台（可選）

```powershell
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
2. **分層失敗語意**：教訓庫/bot/web/通知等觀測面 fail-open；必要 CI、Reviewer、ownership、release evidence 與 merge coordination 一律 fail-closed 為 `BLOCKED`。
3. **告警送達確認**：不信 healthz/PID 活著，`notify-test` 端到端驗證送達；digest 每日必達不受 silence 影響。
4. **kernel 帳紀律**：`wc -l src/*.ts | tail -1` ≤2250 行；新功能一律進 `src/learn/`、`src/autopilot/`、`src/bot/`、`src/engines/`、`web/` 子目錄，不進 kernel 帳，各檔另有自己的行數上限（插件 ≤200、adapter ≤150）。

## 開發規範

- **開發紀錄**：規格與計畫在 `docs/specs/`、`docs/plans/`；現況與驗收從 [文件入口](docs/README.md) 查閱。歷史 SDD 工作階段的 `.superpowers/sdd/progress.md` 不納入版控，缺檔時以原始碼、Git 紀錄與可重跑驗收為準。
- **kernel 帳**：每次改動前後跑 `wc -l src/*.ts | tail -1` 核對 ≤2250；implementer 自報行數不可信，一律由審查者/主控獨立 `wc` 核實。
- **Graphify 範圍**：`.graphifyignore` 只排除 repo 內的 recovery／integration 快照，避免本機 AST 導覽重複掃描；它不會隱藏 Git 變更或刪除保全成果。
- **測試**：`npm test`（即 `vitest run`）。本機（768 進程負載環境）並行跑測試會有假逾時，`vitest.config.ts` 已固定 `maxWorkers: 1` + `testTimeout: 20000`，serial 模式才可信。
- **build**：`npm run build`（`tsc -p tsconfig.build.json`，只含 `src/`）；`npm run typecheck` 走含 `tests/` 的原始 `tsconfig.json`。
- **換行**：依 `.gitattributes`，一般文字使用 LF，Windows `.bat`／`.cmd`／`.ps1` 使用 CRLF；改共用設定前先建立不覆寫既有檔案的 `.bak-YYYYMMDD` 備份。
- **commit**：conventional commit（`feat:`/`fix:`/`docs:` 等）；目標專案的額外提交規則見 config 的 `extraDirective`。
