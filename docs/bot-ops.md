# adng Discord Bot 營運手冊

## 上線前置

1. 建立 token 檔（純文字，cmd/shell 格式皆可，逐行 regex 解析）：`C:\Users\Administrator\.adng\bot.env`
   內容範例（僅示範格式，不得含真實 token 以外的機密）：
   ```
   set ADNG_BOT_TOKEN=<真實 bot token>
   ```
2. 確認 `configs/<project>.json` 有以下三欄位（見 `src/bot/config.ts`）：
   - `botAllowedUserIds`：string 陣列，操作 bot 的 Discord user ID allowlist（fail-closed，缺省空陣列＝全員鎖死）
   - `botGuildId`：目標 guild ID（guild-scoped slash command 註冊，缺省則全域註冊）
   - `botTokenFile`：token 檔路徑（相對路徑以 config 檔所在目錄 resolve）；`ADNG_BOT_TOKEN` 存在且非空白則優先

## 啟動指令

```
node dist/bot/index.js --config configs/voice-actress.json
```

進程持有獨立 `bot.lock`（與 daemon 的 lock 分開），重複啟動因 lock busy 直接退出，不會雙開。

## 排程註冊／解除

`scripts/install-bot-task.ps1` 註冊／解除 Windows 排程任務 `\adng-bot`：

```
powershell -File scripts\install-bot-task.ps1              # 安裝
powershell -File scripts\install-bot-task.ps1 -Uninstall   # 解除
powershell -File scripts\install-bot-task.ps1 -WhatIf      # 預覽
```

開機啟動、每 15 分鐘重複觸發（bot 靠自身 lock 防重，重複觸發等同 auto-respawn）、Priority 強制 Normal(5)、無隱藏啟動鏈、`ExecutionTimeLimit` 關閉（24/7 常駐）。

## 雙 token 說明（不可混用）

本專案有兩個**不同的 Discord bot**，各自獨立 token：

| 用途 | 環境變數 | 讀取邏輯 | 走向 |
|---|---|---|---|
| bot 本體 gateway（雙向互動/slash command） | `ADNG_BOT_TOKEN` | `src/bot/config.ts loadBotToken` | `src/bot/index.ts`，discord.js `Client.login` |
| daemon 單向通知（成功/失敗/告警） | `LPBOT_TOKEN` | `src/notify.ts loadDiscordToken`（預設檔 `C:/Users/Administrator/openab/.env.tokens`） | `DiscordNotifier`，走 openab 舊 bot |

兩者是**兩個不同的 Discord application**，token 不可互換：`ADNG_BOT_TOKEN` 放錯會讓 bot 本體無法登入；`LPBOT_TOKEN` 放錯則 daemon 通知失敗（DLQ 記錄，不影響派工）。

## Readiness 驗證

不信 Task Scheduler 狀態、不信 PID 活著（踩雷 §18）。驗證方式：

1. `data\voice-actress\bot-console.log` 出現一行含 `adng bot ready` 的日誌。
2. Discord 頻道內對 bot 送 `/status`，收到回覆。

## Kill-switch

- 軟停：Discord 送 `/pause`（寫入 `stopFile`，daemon 端跳過派工；bot 本體仍在線可回應查詢）。
- 硬停：`scripts\install-bot-task.ps1 -Uninstall` 解除排程 + 手動終止進程（釋放 `bot.lock`）。

## `/goal` 指令組（M8.2，遙控 GOAL autopilot）

`/goal set|run|status|stop`，實作於 `src/bot/actions.ts doGoal`：

- `/goal set <目標文字>`：寫入 `config.goalFile`（未設此欄位會回「config 未設 goalFile」），內容含預設邊界「連續無進展上限:3」。文字沿用 `/task` 同款注入防護（拒收換行與 `<!-- -->`）。
- `/goal run`：**真 spawn 子進程**跑 `node dist/autopilot/run.js --config <path>`（`process.execPath`、`detached`+`windowsHide`，log 寫 `dataDir/autopilot-console.log`）。autopilot 內建 session lock，重複 `/goal run` 不會雙跑。
- `/goal status`：印 GOAL 檔頭 200 字 + 最新一份 `dataDir/goal-*.jsonl` 稽核紀錄的最後一行。
- `/goal stop`：**kill-switch**——刪除 `goalFile`，autopilot 下一輪偵測到檔案消失即自行停止（非強殺進程）。

⚠️ **花錢警告**：`/goal run` 啟動的是會自己拆任務、自己派工、自己驗證的自主迴圈，每輪都可能真的呼叫引擎燒錢（成本閘與日軟/硬頂在 kernel 端管，但不代表零成本）。唯一自動煞車是「連續無進展達上限」；人工要停用 `/goal stop`（kill-switch）或直接 `/pause`（停整個 daemon）。GOAL 自主任務在 backlog 檔裡帶 `<!-- adng:autopilot -->` 標記，與使用者手排任務可區分（鐵律 #1 受控例外，非系統任意自生）。

## `/lessons` 指令（M7 教訓庫查詢）

`/lessons` 讀兩層教訓檔原文全文輸出：專案層（`config.learningsFile`，未設時預設 `dataDir/learnings.md`）+ 全域層（`config.globalLearningsFile`，有設才讀）。兩層都缺回「教訓庫尚空」。

## Web 控制台（M9–M9.1）

```
node web/server.mjs --config configs/voice-actress.json
```

只 bind `127.0.0.1:3900`；啟動時終端機印出的 URL 帶一次性 CSRF token（`http://127.0.0.1:3900/?token=...`），之後每個 POST 控制端點（`/api/run-once`、`/api/daemon/start|stop`、`/api/pause`、`/api/resume`、`/api/task`、`/api/goal/set|run|stop`、`/api/silence`）都要帶同一個 token（header `x-csrf-token` 或 query `?token=`），GET 監看端點（`/api/status`、`/api/logs` SSE、`/api/panel/:name`）不驗 token。**token 持久化**（M9.3）：啟動時先讀 `<dataDir>/web-console.token`（單行 hex），存在且非空即沿用；不存在才新生並寫入。常駐排程 respawn 後 token 不變，使用者分頁不會被 403 卡住；log 仍照舊印帶 token 的 URL 供撈取。

面板/控制邏輯**與 bot 同一套**：`GET /api/panel/:name`（`status`/`cost`/`backlog`/`log`/`lessons`/`goal` 白名單）與 `/api/goal/*`、`/api/silence`、`/api/pause`、`/api/resume`、`/api/task` 全部直接呼叫 `dist/bot/handlers.js` 的 `handleCommand`，零重複業務邏輯——web 只是 bot handler 的另一張皮。`/api/run-once`、`/api/daemon/start|stop` 則是 spawn 既有 `dist/cli.js`（單一事實來源，web 不 import scheduler）。

## 排程現況

| 任務 | 排程名稱 | 狀態 |
|---|---|---|
| Discord bot | `\adng-bot`（`scripts\install-bot-task.ps1`，開機自啟 + 每 15 分鐘重複觸發） | **已註冊**，常駐運行中（bot 靠 `bot.lock` 防重複，重複觸發等同 auto-respawn） |
| daemon | `\adng-daemon`（`scripts\install-scheduled-task.ps1`） | **已註冊**，常駐運行中（使用者 2026-07-11 拍板保留常駐化，取代 M5「不註冊、純手動啟動」原決策；恢復純手動用 `powershell -File scripts\install-scheduled-task.ps1 -Uninstall`） |
| web 控制台 | `\adng-web`（`scripts\install-web-task.ps1`，開機自啟 + 每 15 分鐘重複觸發） | 腳本已備（M9.3），**註冊待使用者親跑**；web server 無自帶 lock，雙開靠 port 3900 EADDRINUSE 退出等效單例 |

## 教訓庫維運（M7）

- **專案層**（`config.learningsFile`，未設預設 `dataDir/learnings.md`）：**自動寫**。daemon 每輪 cycle 結果為 `failed` 或 `blocked` 時（`engine-error`/`preflight-failed` 視為 infra 噪音，不觸發）才呼叫 reflect，用 ProxyPilot LLM 從失敗證據（最近一次 attempt 的敗因、verify 輸出尾段）提煉一條可泛化教訓；LLM 回 `NONE`、空字串或逾時一律不寫（寧缺勿濫，反 Goodhart）。
- **全域層**（`config.globalLearningsFile`，選配）：**只讀不自動寫**。晉升教訓到全域由人工策展——自動寫全域必膨脹污染，是舊系統的教訓。
- **上限**：每層最多 30 條、單條 ≤200 字（超長截斷）；滿 30 條時 FIFO 淘汰最舊一條再寫新的；新教訓與既有任一條正規化文字互為包含則跳過（去重）。
- **注入**：派工 prompt（`extraDirective` 之後）與 GOAL autopilot 的 planner prompt 都會附上兩層合併全文；兩層皆空則不附任何字（prompt 零污染）。
