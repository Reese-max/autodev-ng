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
# 心跳新鮮度（>30 分鐘未更新且 lock PID 存活 = wedged）
（名冊＝configs/*.json 動態枚舉，dataDir 相對 configs/ 解析——勿硬編碼專案清單）data/<proj>/heartbeat.json 的 ts vs now；data/<proj>/daemon.lock/pid.json 的 pid 存活性

# 出輪狀況（心跳新鮮但長時間零 attempts 也要查）
run.db: SELECT ts, engine, ok FROM attempts ORDER BY seq DESC LIMIT 3

# blocked／哨兵積壓
BACKLOG-adng.md 的 adng:blocked 標記；data/<proj>/restart.request 存在且 >30 分未消費

# GOAL 驗收實況（不信事件流，實跑 verifyCommand）
從 GOAL.md 抽 sh fence 指令實跑，exit code 為準
```

## 2. Wedge 處置（心跳凍結、進程活著）

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
   d. **重開任務一律行尾釘 `[engine:codex-terra]`**（2026-08-01 起）——任務會進 blocked
   就表示免費層已證明啃不動它，重開再讓它先在免費層失敗一輪是純浪費（實測失敗輪中位
   12 分鐘）。唯一例外：拒收根因確定是基建誤傷（孤兒分支／誤殺／逾時）時不釘，因為
   任務難度未被證明。maxAttempts 自 2026-08-01 起為 3（原 6）：注定失敗的任務燒 36 分
   而非 72 分即進 blocked，靠巡檢帶精準靶心重開，勝過盲目重試
3. 移除舊行的 adng:blocked 標記（同行改寫）或標 superseded
4. 殘留 worktree 卡 prepareWorktree 時：新 id 自然繞開；殘目錄待關機自清，不硬清
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
