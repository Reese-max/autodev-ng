# M5：網頁控制台＋引擎矩陣（2026-07-07）

**Goal:** 營運模式從「排程 24/7」轉「隨用隨觀察」：本機網頁控制台（監看＋一鍵 run-once＋daemon 開關）；引擎層從單一 claude 擴為多引擎矩陣（行內 tag 路由＋每引擎固定成本估計）。

**使用者拍板（2026-07-07）：**
- 不註冊 Windows 排程（M4 Task 9 腳本留備用）。
- 任務路由＝backlog 行內 tag（如 `[engine:agy]`）＋config 預設引擎；系統不自作主張（鐵律 #1 精神）。
- 記帳＝每引擎固定估計值 `costPerRunUsd`（agy=0 類免費引擎也入帳 0，成本閘語意保留）。
- 行數預算＝**kernel 凍結 2400＋緩衝 100（上限 2500）**；每個 engine adapter 獨立 ≤150 行（`src/engines/*.ts` 各檔自算，不入 kernel 帳——kernel 帳改為 `wc -l src/*.ts`）；網頁控制台獨立 `web/` 目錄 ≤800 行，不入 kernel 帳。
- opencode zen **不派 voice-actress**（官方明文拿資料訓練）；zen 只跑非專案雜務——落地方式＝voice-actress config 的 engines 白名單不含 zen，違規 tag 直接 blocked（reason: engine-not-allowed）。

**研究正本：** `.superpowers/sdd/m5-opencode-research.md`（opencode）、`m5-cli-engines-research.md`（六 CLI 規格卡）。adapter 實作前必先讀對應規格卡。

**引擎矩陣與固定成本估計（初值，可調）：**
| tag | 後端 | costPerRunUsd 初值 | 備註 |
|---|---|---|---|
| claude | claude CLI（Anthropic） | 真值解析（現行為，不用估計） | 高檔位 |
| m3 | claude CLI＋env 注入 MiniMax M3 | 0.5 | Anthropic 相容端點 |
| codex | codex exec --json | 1.0 | ChatGPT 訂閱；JSONL |
| agy | Antigravity CLI（WSL） | 0 | 免費；三坑見規格卡 |
| copilot | copilot CLI | 0.2 | gpt-5-mini 0x≈免費但慢 |
| qwen | qwen --auth-type openai → 8317 | 0.5 | 燒 ChatGPT 訂閱 |
| grok | grok -p --output-format json | 0.5 | 無 usage 欄位 |
| zen | opencode zen/big-pickle | **不設**（NDJSON cost 真值直用） | 僅非專案雜務；設 0 會令 scheduler `fixedCost ?? 真值` 恆取 0，把 opencode 的 cost 真值設計變死碼——故 schema superRefine 對 opencode 豁免 costPerRunUsd 必填 |

**Architecture:** Task 1（路由+config 骨架，kernel）→ Task 2（M4 移交安全修，kernel）→ Task 3-8（adapter 各一，互相獨立可亂序；每個 adapter 含單測+真探針一發）→ Task 9（web 控制台）→ Task 10（上線驗證輪）。

**Global Constraints:**
- kernel（`src/*.ts`）≤2500；每 adapter（`src/engines/<name>.ts`）≤150；`web/` ≤800。LF、每 Task commit、SDD 雙判定審查。
- 引擎工廠 `src/engines/registry.ts` 於 kernel 撞頂後抽出（引擎組裝屬引擎層），不入 kernel 帳；kernel 抽離後恢復餘裕 2500→~2390。
- 鐵律 #7 引擎鐵三角：所有 adapter 走 `runProcess`（stdin 餵 prompt、timeout、雙層樹斬、不吞 stderr）。agy 例外處理見 Task 4。
- 鐵律 #8：不做萬用宣告式引擎 config；每 CLI 一個 adapter 檔。
- 真探針（每 adapter 一發最小任務）由 implementer 在 scratchpad 假 repo 跑，絕不碰 voice-actress；上線驗證輪（Task 10）才動真專案，且先問使用者。
- prompt 一律走 stdin（.cmd shim 8191 argv 上限）；copilot 只能 argv（規格卡註明），截長防呆。
- Discord token／各家 API key 永不落 log/config 明文以外的地方。

### Task 1: 引擎路由＋config 骨架（kernel）
- `src/backlog.ts`：任務行解析 `[engine:xxx]` tag（行首或行尾皆可，從 text 中剝離不入 taskId 雜湊——**注意**：既有任務無 tag，雜湊不得變）。tag 剝離後存 `Task.engineTag?: string`。
- `src/types.ts`：config 加 `engines` map：`{ [tag]: { adapter: 'claude-cli'|'codex'|..., costPerRunUsd?: number, env?: Record<string,string>, model?: string, timeoutMs?: number } }`＋`defaultEngine: string`（預設 'claude'）。schema refine：defaultEngine 必在 engines 內。
- `src/scheduler.ts`：任務 engineTag 查 engines map——tag 不存在或不在白名單 → blocked（新 reason `engine-not-allowed`，daemon 告警文案同步）。engine 實例化移到 per-task（現為 per-config 單例，改為 registry 按需建、可 cache）。
- 記帳：非 claude 引擎失敗與成功一律記該引擎 `costPerRunUsd`（真值解析僅 claude 保留）。
- M3 檔位在此 Task 一併落地：`claude-cli.ts` opts 已有 command/baseArgs——加 `env?` 透傳給 runProcess（runProcess 若不支援 env 先補，屬 kernel 小改）；config `engines.m3 = { adapter:'claude-cli', env:{ANTHROPIC_BASE_URL:..., ANTHROPIC_AUTH_TOKEN:'{env:MINIMAX_API_KEY}'}, model:'MiniMax-M3', costPerRunUsd:0.5 }`。`{env:VAR}` 展開語法在 assemble 層實作（值不落 config 明文）。
- 測試：tag 解析（含無 tag 雜湊不變回歸）、engine-not-allowed、env 注入透傳、m3 檔位 assemble。

### Task 2: M4 移交安全修（kernel）
- rmSync 前 `.adng-worktree` marker verify-then-delete（對齊 verifier 紅線 3；marker 驗後才刪、dirty 檢查移到 marker 驗之後）。
- dirty porcelain 清單截前 10 行；prune/branch -d 失敗改記事件 `worktree-cleanup-partial`（非 worktree-kept）。
- acquireLock throw 告警納冷卻閘（key `daemon-acquire-throw`）。
- 測試各一。

### Task 3: codex adapter（`src/engines/codex.ts`）
- `codex exec --json --dangerously-bypass-approvals-and-sandbox`，prompt stdin，cwd=worktree。JSONL 逐行 parse，`turn.completed` 取 tokens（記錄用），cost 記 config 估計值。silent-fail exit 0 防呆：無 turn.completed 或零輸出＝失敗。no-commit 檢查沿模板。preflight：真探針（規格卡：`codex exec` 最小 prompt）。

### Task 4: agy adapter（`src/engines/agy.ts`）
- 直呼 WSL binary：`wsl.exe --cd <worktree的/mnt/d路徑> -d Ubuntu -u root -- /usr/local/bin/agy -p <prompt經stdin> --dangerously-skip-permissions --print-timeout <秒>`（實際旗標以規格卡為準）。路徑轉換 D:\→/mnt/d 助手函數。
- 樹斬：taskkill 殺不進 WSL——超時時以 `wsl.exe -d Ubuntu -u root -- pkill -f '<worktree專屬marker字串>'` 精準補刀，**絕不殺 wsl.exe 本體**（OpenAB）。prompt 內嵌 run-id marker 供 pkill 匹配。
- `--print-timeout` 明確設定（預設僅 5m）。輸出純文字→no-commit 檢查是唯一硬證據（規格卡結論）。cost 記 0。

### Task 5: copilot adapter（`src/engines/copilot.ts`）
- `copilot --allow-all-tools`＋prompt argv（截長 6000 字防 8191 上限）。JSONL 尾事件 usage.premiumRequests/codeChanges 記錄；模型鎖 gpt-5-mini（0x）。冷啟慢（110s）→ pingTimeoutMs 加大。

### Task 6: qwen adapter（`src/engines/qwen.ts`）
- `qwen --auth-type openai --openai-base-url http://127.0.0.1:8317/v1 --yolo`，result JSON 最好解析。注意背景 memory-extractor 多打 2 次 API（成本備註）。

### Task 7: grok adapter（`src/engines/grok.ts`）
- `grok -p --output-format json --permission-mode bypassPermissions`（prompt 用 --prompt-file，寫 tmp 檔）。無 usage 欄位→cost 記估計值。preflight 用真探針（`grok models` 謊報）。stderr telemetry 雜訊過濾（只在失敗時附）。

### Task 8: opencode adapter（`src/engines/opencode.ts`）
- 照 opencode 研究報告：直呼 opencode.exe＋`run --format json --pure -m zen/big-pickle --dangerously-skip-permissions`，stdin prompt，XDG_CONFIG_HOME/XDG_DATA_HOME 指 `data/opencode-profile/`（定期清 snapshot）。NDJSON Σ step_finish.cost。preflight 驗 model 三元組（免費模型輪替快）。
- voice-actress config 的 engines 白名單**不含 zen**。

### Task 9: 網頁控制台（`web/`，≤800 行，獨立於 kernel）
- 極簡 Node http server（零框架或內建模組），`node web/server.mjs --config configs/voice-actress.json`，bind 127.0.0.1、port 3900（避開 3210/8317/8318/5678）。
- 監看：GET /api/status（heartbeat、backlog 計數、今日成本 vs 閘、attempts 近 10 筆、events 尾 50、DLQ 數）；GET /api/logs SSE tail（engine 進行中的 events 增量）。前端單檔 HTML（fetch+輪詢 3s，不用打包器）。
- 控制：POST /api/run-once（spawn `node dist/cli.js run-once`，沿用 lock 防重入；回 task id）；POST /api/daemon/start（spawn detached daemon）；POST /api/daemon/stop（寫 stopFile——既有機制）。所有控制端點簡單 token 防 CSRF（啟動時印隨機 token 進 URL）。
- 不入 kernel 帳；審查照 SDD。**啟動驗證由主控實跑＋使用者瀏覽器確認。**

### Task 10: 上線驗證輪（operations，主控執行，動真專案前問使用者）
1. 各 adapter 真探針全綠（Task 3-8 已各自跑過，這裡彙總重驗 preflight）。
2. 使用者往 BACKLOG-adng.md 排 1-2 條帶 tag 的真任務（如 `[engine:agy]` 一條雜項），主控經網頁控制台按 run-once 人工盯。
3. live 401 演練（M4 條款 5 移交）：低風險時段暫時改壞 claude 認證 env 跑 preflight，驗告警鏈，完成即還原。
4. 驗收：閉環 6 條在多引擎語境重打勾；web 控制台使用者實際操作確認。

**Acceptance：** kernel ≤2500、每 adapter ≤150、web ≤800；全測試綠；至少 3 引擎（claude/m3/agy）真探針過；voice-actress engines 白名單不含 zen；opus 最終全分支審查 READY。
