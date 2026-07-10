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
