# 艦隊監督 Playbook（2026-07-30 實戰提煉）

監督迴圈「發現→診斷→修復→驗證→部署→追蹤」的標準程序。
供人類監督者、排程巡檢 agent、以及未來的 supervise 看門狗共用。
所有程序來自 2026-07-29/30 實戰（三艦連環 wedge、GOAL 假完成、artifact 誤殺等事故）。

## 0. 授權分級（巡檢 agent 的行動邊界）

| 級別 | 動作 | 授權 |
|---|---|---|
| 自動 | 讀狀態、殺 wedged 進程樹、清殘鎖、觸發 supervisor、放 restart 哨兵 | 免請示（可逆、有本檔程序） |
| 自動 | blocked 任務重開（改寫文字＋拒收理由入靶心，每任務限一次） | 免請示 |
| 立案 | 需要改程式碼的修復 | 不直接動手——寫 GOAL 或 backlog 任務給 autodev-self |
| 升級 | 不可逆動作（刪資料、真金消費、外部發送）、同招連敗 2 次、無法診斷 | 推播人工，附證據 |

## 1. 健康檢查（每輪巡檢的固定查詢）

```
# 心跳新鮮度（wedged 三證缺一不可：心跳凍結 >30 分＋lock PID 存活＋run.db 無新 attempt，見 §1.1）
（名冊＝configs/*.json 動態枚舉，dataDir 相對 configs/ 解析——勿硬編碼專案清單）data/<proj>/heartbeat.json 的 ts vs now；data/<proj>/daemon.lock/pid.json 的 pid 存活性

# 出輪狀況（心跳新鮮但長時間零 attempts 也要查）
run.db: SELECT ts, engine, ok FROM attempts ORDER BY seq DESC LIMIT 3

# blocked／哨兵積壓
BACKLOG-adng.md 的 adng:blocked 標記；data/<proj>/restart.request 存在且 >30 分未消費

# GOAL 驗收實況（不信事件流，實跑 verifyCommand）
從 GOAL.md 抽 sh fence 指令實跑，exit code 為準
```

### 1.1 兩個反覆踩雷的判讀陷阱（2026-08-02 第四、五度實證後固化）

- **時區陷阱（PowerShell）**：比對 heartbeat ts 禁用 `ConvertFrom-Json` 後直接 `Parse`——
  會把 `...Z` 當本地時間，GMT+8 產生正好 +480 分鐘的偽 wedge（已四度復發）。正解：
  `$raw -match '"ts"\s*:\s*"([^"]+)"'` 取原始字串，再
  `[DateTimeOffset]::Parse($Matches[1], [Globalization.CultureInfo]::InvariantCulture,
  [Globalization.DateTimeStyles]::AssumeUniversal -bor [Globalization.DateTimeStyles]::AdjustToUniversal)`，
  一律比 epoch 差值。
- **長輪陷阱**：daemon 在單一 agentic 長輪（實測可達 50 分鐘）期間**不更新心跳、不消費哨兵**。
  心跳凍結 >30 分＋PID 存活仍可能完全健康——2026-08-02T15:27Z 誤殺實證：note-filler 心跳凍 49 分，
  但 run.db 於 15:10Z／15:16Z 仍正常寫入 attempts（該輪 duration 49.5 分，起點＝心跳凍結時刻）。
  判 wedged 前必查 `SELECT ts, duration_ms FROM attempts ORDER BY seq DESC LIMIT 1`：
  最新 attempt 完成時刻**晚於**心跳凍結時刻＝活著，不殺；心跳凍結時刻 ≈ 最新長輪起點＝長輪進行中。
  哨兵 >30 分未消費同理，先驗 run.db 再論積壓。

## 2. Wedge 處置（心跳凍結、進程活著）

0. 進入本節前先完成 §1.1 的 run.db 活性驗證——attempts 仍在推進＝不是 wedge，回頭等長輪結束再驗。

1. 找 daemon 子進程：`Get-CimInstance Win32_Process | Where ParentProcessId -eq <daemonPid>`
2. 子進程建立時刻 ≈ 心跳凍結時刻 → 即為吊死源
3. **殺法：PowerShell `Stop-Process -Id <pid> -Force`（TerminateProcess 直呼）**。
   taskkill /T /F 對卡死樹會「存取被拒」（樹枚舉被卡死子進程擋住）——不要用。
   由深至淺：先孫後子。
4. 殺子進程後 daemon 的 await 會解開自行復甦——**先不殺 daemon 本體**，等 90 秒看心跳。
5. 心跳仍凍 → 殺 daemon、`Remove-Item -Recurse -Force data/<proj>/daemon.lock`、
   `schtasks /Run /TN adng-daemons` 立即重拉。
6. 時區陷阱：heartbeat ts 是 UTC ISO 字串，比對一律用 epoch 差值，勿手工轉時區
   （2026-07-30 誤殺健康 daemon 實證）。

## 3. 誤殺記帳補償

殺進程會讓該輪記 FAIL（exit 4294967295/-1）計入任務失敗數。殺完必查：
被殺輪所屬 task 的 failCount 若因此逼近 maxAttempts（6），屬基建誤傷——
按 §4 重開並在新任務文字註明「N 筆為基建誤殺非引擎能力問題」。

## 4. blocked 任務重開（第 N 棒程序）

1. 讀 blocked reason 與歷輪拒收理由（run.db attempts detail）
2. 改寫任務文字＝新 task id＝失敗數歸零；必含：
   a. 棒次與重開日期；b. 既有實況（哪些已存在、只准接線/不准重做）；
   c. 歷輪拒收根因逐條轉為靶心指引；
   d. **重開任務一律行尾釘 `[engine:codex-luna]`**（2026-08-02 修訂；原訂 codex-terra）——
   任務會進 blocked 就表示免費層已證明啃不動它，重開再讓它先在免費層失敗一輪是純浪費
   （實測失敗輪中位 12 分鐘），此前提不變；**改釘 luna 的依據**：近 4 日實測 codex-luna
   191 輪 66% 通過、每輪影子成本 $0.79，codex-terra 201 輪 60% 通過、每輪 $1.46——terra
   在通過率與成本上皆劣（每個 OK：luna $1.20 vs terra $2.43）。需要更強能力才升
   `codex-sol`（20 輪 90%，但每輪 $2.60、每個 OK $2.89，僅用於連敗且確認難度高者）。
   唯一例外：拒收根因確定是基建誤傷（孤兒分支／誤殺／逾時）時不釘，因為任務難度未被證明。
   **驗證合約**：下輪比對這批改釘 luna 的任務通過率；若低於 terra 的 60% 即改回。
   未釘引擎的任務由 weightedRotation 依 run.db 成功率自動調權（agy 近 4 日 32 輪僅 16%
   會被自動壓低），不需手動調 rotation-weights.json。
   maxAttempts 自 2026-08-01 起為 3（原 6）：注定失敗的任務燒 36 分
   而非 72 分即進 blocked，靠巡檢帶精準靶心重開，勝過盲目重試
3. 移除舊行的 adng:blocked 標記（同行改寫）或標 superseded
4. 殘留 worktree 卡 prepareWorktree 時：新 id 自然繞開；殘目錄待關機自清，**不硬清**。
   人工清掃殘目錄的唯一安全窗（2026-08-03 血訓）：該艦 daemon 已停或 state=idle **且**
   run.db 最新 attempt 非進行中。重開任務與原任務同文字＝同 id＝同 worktree 路徑——
   清掃時該 id 可能正有活輪在跑，刪其 worktree 會讓引擎 git 上溯到 autodev-ng 主 repo，
   把船的工作 commit 進錯 repo 甚至 reset 掉主 repo 未提交變更（45703e9/95923c8 實案，
   rescue/* 分支留存）。批次清掃一律逐 id 對照「無活輪」後才動手。
5. 同一任務人工重開以一次為限；再敗＝升級人工（不無限重開）

## 5. GOAL 換棒／重新武裝

1. 舊 GOAL 須驗收綠或明確放棄才換；備份 `GOAL.md.bak-YYYYMMDD[-標記]`
2. 新 GOAL 紅綠鐵律：寫入前實跑驗收指令確認**紅態**（exit≠0）；parseGoal 驗證
   objective/verifyCommand 解析正確
3. 措辭防呆：objective 不得含「已完成」語句描述本 GOAL 的工作（planner 會誤判達標——
   2026-07-30 dc46 實證）；背景敘述須明標「場外已處置，非本 GOAL 工作」＋「驗收目前紅態」
4. 放 restart.request 哨兵；in-flight 有價值輪次時可不放，等自然週期
5. manualGoalDone 已記同 id 時：改 objective 文字產生新 goalId 即重新武裝
6. 繼任規則（2026-07-31 使用者核定）：手動 GOAL 驗收綠且無人工下一棒指示 →
   備份後**移除 GOAL.md**，讓 auto-goal 自主發掘接手（不再等人）。巡檢須審每個
   新立 auto-GOAL 的價值對位（對 USER-SIGNALS／北極星），發現「好驗證但不重要」
   的漂移型立案 → 記錄並於下輪重導；USER-SIGNALS.md 是使用者的方向盤，權重最高

## 6. 部署程序（改 autodev-ng 程式碼後）

1. `npm run build` → 全套 `npx vitest run`（負載高時背景跑；失敗先分「真壞／負載 flake／
   守護反轉」三類，flake 以單獨重跑＋放寬 testTimeout 洗清）
2. commit（conventional、zh-TW、含實證與根因）→ push
3. 三艦放哨兵（daemon 重啟才載新 dist）
4. **驗證合約**：部署訊息必含可否證檢查點（「下輪 X 非 NULL＝結案；仍 NULL＝假設錯誤換路」），
   下輪巡檢必回頭對照

## 7. 引擎層事故

- 端點懸掛（每叫必掛）：寫 data/<proj>/engine-routing-state.json 隔離
  （isolated: {tag: {untilTs, reason}}，version 1 全欄位）；到期自動解除
- 新模型試點鐵律：≤3 輪即人工核帳（「free」宣稱以帳單為準——swe-1.7 教訓）；
  單輪 tokens 遠超該引擎 7 日中位數＝立即告警
- preflight 連敗引擎：rotation 自動跳過，無需處置；全引擎皆死＝查網路
  （curl -m 8 探 api 端點，>5s＝機器出網劣化，通報人工）

## 8. 升級人工的固定條件

- 同一問題同一招失敗 2 次
- 任何不可逆動作前
- 外部世界核帳（供應商餘額/帳單/方案）
- 診斷結論與使用者描述矛盾
- 新事故型態不在本檔任一程序內

## 9. 孤兒進程與跨 repo 污染 SOP（2026-08-03 全日事故提煉）

**偵測（每輪巡檢固定查）**：
- 孤兒 daemon：`cli.js daemon` 進程的 pid 不在任何 `data/*/daemon.lock/pid.json` ＝孤兒
- 陷阱殼：`data/*/worktrees/<id>/` 目錄存在但無 `.git` 檔＝向上解析地雷
- 灘頭堡：`git ls-files data/` 必須為 0；>0＝ignore 被鑿洞，立即 `git rm --cached`
- 污染 commit：main 出現非 worktree 流程的直接 commit（作者時間與 run.db 對不上、路徑含 data/、或訊息掛錯船名）

**處置（依 §0 分級）**：
1. 孤兒 daemon：葉到根 Stop-Process 樹斬（連同其引擎鏈）。**絕不殺 claude.exe**（可能是使用者 session）、絕不殺 wsl.exe
2. 陷阱殼：mtime >5 分鐘者直接 rmSync（無 .git 的殼不可能承載合法輪；5 分鐘護欄防誤刪創建中目錄）
3. 污染 commit：先 rescue 分支保存 → 甄別（build＋測試綠且內容對船＝cherry-pick 留用；否則棄置）→ main reset 回最後好點 → push 錨定遠端
4. 活輪 worktree **在任何情況下都不得手動刪除**（§4.4 安全窗鐵律——2026-08-03 兩度血訓）

**驗證**：處置後 pid.json 帳目恰好等於 config 數、陷阱殼歸零、`git ls-files data/`=0、main 與 origin 同步。

**根治狀態追蹤**：三層孤兒源——supervise 殺法（da482d0 已修）、看門狗誤殺（3ac9b3e 已修）、daemon 哨兵退出洩漏（autodev-self 隊列，交付前本 SOP 是唯一防線）。

## 10. 月度知識蒸餾儀式（2026-08-05 使用者核定 D）

每月首個巡檢日執行：(1) patrol-log 上月條目歸檔至 data/patrol-log-archive/YYYY-MM.md，主檔只留當月＋未結驗證合約；(2) 重複出現 ≥2 次的教訓合併進本 playbook 對應章節（引用歸檔證據）；(3) PATROL-ALERTS 已結案段落移歸檔；(4) 蒸餾本身記一條含前後行數的日誌。目的：headless 巡檢的每輪讀取量有界，制度記憶越用越薄而非越厚。
