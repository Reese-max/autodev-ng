# Auto-Dev 知識遺產文件（Knowledge Legacy）

> 來源：舊系統本尊 `D:\Users\Administrator\Desktop\公司\auto-dev`（已於 2026-07-05 退役，只讀不寫）。
> 用途：TypeScript 重寫版（方案 A：微核心 + 插件式智慧）的設計輸入。只搬知識，不搬碼。
> 規模事實：engineer-loop.sh 1986 行 + lib/common.sh 2823 行（118KB）+ lib/ 64 個模組。
> 另一份濃縮教訓庫：`learnings/global.md`（2931 行，L001–L106），重寫版建議直接沿用其分類。

---

## 1. 教訓清單（最重要）

### 1.1 系統死因（PLAN-revival-20260601.md、engineering-log.md）

- **死因不是缺機制，是缺真活**：復活診斷原話「程式/架構不缺東西——缺的是真實的工作與實際在跑的自治」（PLAN-revival-20260601.md:10）。MISSION 要驅動 5 個 prod，但 4/5 工作樹長期不可達，只能自我 dogfood 空轉（同檔:12）。
  → 新系統**應該**把「任務來源是否真實存在」當第一級健康指標；沒有真 backlog 時寧可 idle 並告警，**不應該**讓 daemon 自己生任務餵自己（MISSION.md:31 反 Pattern 早已明文禁止，但系統仍繞道刷 KPI）。
- **自我參照 Goodhart 永動機**：所有 KPI 都是「auto-dev 自己的治理指標」而非「prod 交付量」→ KPI 全綠但 prod 零推進，策略顧問連 6+ 輪判 DRIFTING；smoke test 40→355（8.8x）而 features 只 +7，test 膨脹是功能的 20 倍（engineering-log.md:246, 468, 670）。帳面 K1/K2 74–93%，去掉 salvage tag 後真實僅 ~19–39%（PLAN-revival-20260601.md:16, 27）。
  → 新系統 KPI **應該**綁定外部交付物（prod repo 的 feat/fix 落地數），**不應該**有任何一個 KPI 是量測系統自身治理行為的。
- **假 uptime**：K4 報 100% 但進程樹裡根本沒有 watchdog-tick-loop——schtasks 顯示 Running ≠ 活著（engineering-log.md:378-380）。
  → 新系統的 liveness **應該**以「commit 產出率／有流量時 log 在長」為準（learnings/global.md L018、L073：24h 0 commit 是最強 meta-stuck 訊號），**不應該**信 PID 存活、healthz 200、排程器狀態。
- **元工程漩渦**：144 persona × 13 engine 的路由複雜度無上限機制，複雜度本身變成新的 chore 來源（engineering-log.md:242, 375-376）。
  → 新系統**應該**給插件數量／設定維度設硬上限並要求每個插件有退役條款；**不應該**允許「加機制去治理上一個機制」（RUNBOOK.md:158-159 心法：治法是縮小可變表面，不是治理治理者）。
- **最終壓垮稻草**：2026-07-04 mimo 端點 401 + stop-flag，最後一條 learning 停在 L106（watchdog.conf.bak-ukepack-mimo401-20260704 時間戳）。單一主力引擎認證失效 = 全系統停擺。

### 1.2 各防護機制的存在理由（新系統挑著繼承）

| 機制 | 為了防什麼 | 出處 |
|---|---|---|
| 成本封頂（--max-total-cost，80%/90%/100% 三段告警+停機） | 429/529 退避缺失時固定 60s 狂重試「無限睡覺燒額度且零通知」 | engineer-loop.sh:990-1017、engineering-log.archive.md:2402 |
| per-project maxCost | 全域 budget-pause「一人超支全員停工」粒度太粗 | engineering-log.archive.md:986 |
| stall 看門狗（run_with_stall_watchdog） | 純 wall-clock timeout 會把「還在動的大任務」15 分一刀砍在 mid-commit；真卡死又拖到 backstop 才死 | lib/common.sh:1078-1170, 1245-1249 |
| chore_ratio sensor（>30% 警告 / >50% 紅線） | chore treadmill：daemon 陷入自我治理空轉 | lib/chore-ratio-sensor.sh:1-40、MISSION.md:12 |
| single-flight lock（mkdir atomic，Windows 無 flock） | daemon 併發 commit 撞 index.lock；pre-commit quick smoke 被兩邊同時跑 | lib/lock.sh:1-14、engineering-log.md:616-628 R137 |
| preflight round-trip gate | engine/model 錯配 silent 404（04-22 evolve-120 招牌事故：keeper 忘傳 --model，沉沒成本巨大；之後 04-25/05-05/05-13 又踩三次） | lib/preflight-gate.sh:1-5, 180-184 |
| supervisor pattern + idle heartbeat | 04-25 八問題：daemon 無人守護 silent death、30 分無動作無 log 導致誤判死活 | MISSION.md:50, 87、docs/RUNBOOK.md:140 |
| 樹斬 kill（MSYS+Windows 雙層） | 裸 timeout 只殺 MSYS 層，npm/node 子樹孤兒化 → 34 棵孤兒樹耗盡 commit charge → 0xc0000142 | lib/verify.sh:74-81、lib/common.sh:1086-1171 |

### 1.3 機制自己變成病（新系統要避開的二階陷阱）

- **auto-salvage 自污染**（L072）：supervisor + reflect 對同一事件雙寫 `chore(auto-salvage)` commit，把自己要守的 chore_ratio 灌爆。sensor 必須排除自家噪音（chore-ratio-sensor.sh:24 `CHORE_RATIO_SELF_NOISE_RE`）。→ 任何 sensor **應該**天生排除系統自產 commit。
- **fail-closed gate self-DoS**（L083）：gate 把整條 commit pipeline（含修復 gate 自己的 commit）鎖死 → daemon idle、KPI flat-line。→ gate **應該** fail-open-with-alert，**不應該** key 在「未達標的 KPI」上。
- **escape-hatch 偽裝 liveness**（L085）：`--no-verify` 的 salvage 路徑讓 pipeline 看似活著（salvage 一直 land）但真 feat/fix=0。
- **aggregate-window 延遲誤導**（L086）：24h 窗內舊 feat burst 稀釋 ratio → 看似健康，burst 滾出窗後硬噴（實證 R61 48% → R71 57.7%）。→ 診斷**應該**看「gate-commit..HEAD 區間非 salvage commit 數」這種即時量，不看窗口比率。
- **告警最後一哩斷 13 天**（L076）：Discord token 401，sensor 正確觸發但告警全死在 dead-letter queue。→ 新系統**應該**對告警通道本身做週期性 end-to-end 自檢（送達確認，不是送出成功）。

---

## 2. 驗證閘設計（概念需求，不搬碼）

- **分層驗證金字塔值得保留**：機械層（bash -n / 測試框架自動偵測執行）→ 統計層（commit pattern 分析）→ 語義層（LLM-as-Judge 比對 commit 宣稱 vs 實際 diff）。三層各抓不同的假。
- **verify（lib/verify.sh）**：自動偵測測試框架（smoke > pytest > npm > cargo，verify.sh:36-57）、優先用專案自己的 venv（:111-135）、**測試逾時視為 SKIP 不算 FAIL**（:83-88，防慢測試 thrash repo）、超時用樹斬不用裸 timeout（:74-81）。→ 新系統應繼承「timeout=skip+告警」語義與框架自動偵測。
- **semantic-verify（lib/semantic-verify.sh）**：用便宜模型（GLM 免費/haiku）判 commit message 宣稱與 diff 是否 MATCH/MISMATCH，diff 截前 200 行防 prompt 爆炸（:71-75），MISMATCH 注入下一輪 directive（:149）。→ 值得保留：這是抓「phantom completion」（L047/L055 家族：宣稱完成 ≠ 已 commit）最便宜的閘。判官模型**應該**固定用最便宜檔位（MISSION.md:35 semantic_judge 永遠 haiku）。
- **quality-gate（lib/quality-gate.sh）**：不 block、只產「下一輪建議」注入 prompt——連 5 feat 無 test、refactor 未在 spec、7 feat 無 fix 三個 yellow flag（:36-54）。→ 「軟建議注入」比硬擋更適合連續迴圈；硬擋留給 preflight 與 smoke。
- **preflight-gate（lib/preflight-gate.sh）**：spawn 前對 (engine, model, endpoint) 三元組實打 round-trip（ping→PONG），結果 cache 6h（1h 太短會被 grok 90s cold-start 反覆拖垮 watchdog tick，:20-22）；quota 型引擎不打 endpoint，改查 24h 內 429≥3 次即判 exhausted，且 24h 窗自動 self-heal（:108-158）。**每一條實際會走的模型路徑都要驗**——evolve/reflect fallback 路徑沒驗過，連炸三次（:180-184）。
- **goal-judge 的教訓**：LLM 判官必加 timeout + heuristic fallback，否則三引擎全 hang 永卡、全敗就 SKIP；純中文目標要 CJK 2-gram 關鍵詞提取否則永判 NOT_YET（engineering-log.md:388-431, 496-522）。
- **快/慢 suite 邊界**：真 git IO 的守門測試不可留在 quick 層（爆 60s 預算）；hard gate 一律包 timeout fail-closed（learnings/global.md L079/L80）。
- **KPI-impact commit gate**：每 commit 必附影響標籤、chore streak 3 次 HARD REJECT（HANDOFF-20260605-codex.md:66）——概念可保留，但見 §1.3 fail-closed 教訓，改 fail-open-with-alert。

---

## 3. 引擎轉接經驗（13 引擎：claude/glm/gemini/codex/copilot/grok/mimo/minimax/dual/fallback/race/chain/rotate，models.sh:42）

**通用律**：
- 引擎/模型/端點三元組必過 preflight（§2）；「加引擎漏補 case 清單」踩過 5 次 → 引擎清單要 SSOT（models.sh:40-50 KNOWN_ENGINES + is_valid_engine）。
- 判「某引擎沒某能力」前先查官方文件 + 真實用例——grok/minimax/agy 三路都曾被誤判死刑後翻盤（HANDOFF-20260605-codex.md:70）。
- CLI 引擎呼叫一律：stdin 給 prompt + 明確 timeout + 樹斬 kill + 不吞 stderr + `< /dev/null` 防巢狀 stdin 啞死（HANDOFF-20260605-codex.md:62）。
- 成本抓不到真值時用 flat fallback（codex $0.10/輪，common.sh 註解），但 label 必須反映真引擎——mimo 跑著卻顯示 claude-opus-4-8 的殘留 label 誤導過排查（HANDOFF-20260607-directed-worker.md:84-96）。

**各引擎的坑**：
- **codex**：exec 無 timeout 會無限 hang，實測堆出 6-33 小時殭屍（common.sh:1357-1360，解法 timeout -k 60 5400）；短 ping 也要 37-40s 含 cold start，preflight 60s 不夠要 90s（preflight-gate.sh:36）；Windows unelevated sandbox 對 .git 套 DENY ACE 導致 commit Permission denied（HANDOFF-20260529.md:80）；codex shell 下 Git Bash 會死於 CreateFileMapping error 5 的 phantom RED，非 repo 問題（learnings L069）。
- **mimo**（末期主力）：走 claude CLI + BASE_URL override。三坑：用 ANTHROPIC_API_KEY 非 AUTH_TOKEN（要 env -u 排除）、BASE_URL 不能帶尾段 /v1（CLI 自補 → 雙重 /v1 → 404）、WSL→Windows env 必須列入 WSLENV 否則不傳（preflight-gate.sh:89-106、engineering-log.md:33-47）。死因：07-04 端點 401。
- **minimax**：同為 claude CLI override，同款雙重 /v1 坑 + env 前綴綁錯位置的假 FAIL（preflight-gate.sh:72-87）；要穩定需 round timeout 90→15 分 + 不載 MCP/LSP（PLAN-revival-20260601.md:41、common.sh:1035）。
- **copilot**：stdin pipe 不給 -p 會進 interactive 立刻 EOF 空輸出；premium 模型 60s timeout 太短（preflight-gate.sh:63-66）；Premium 月配額 1500 需動態 cooldown；Git Bash 無 flock 導致每輪 commit lock contention（engineering-log.archive.md:3536）。
- **grok**：cold start 90s+、偶發 flake 需 3x retry + 180s timeout（preflight-gate.sh:44-60）；Heavy 訂閱只有 grok-build 一個 model，不吃 --effort；本機 proxy (8318) 免費，適合當判官 chain 首選。
- **glm/gemini**：GLM 免費（OAuth 日額度）無 --max-budget-usd，成本控制只能靠 quota 探測（common.sh:913）；gemini CLI 掛死被移出輪替，改 agy（WSL），但 agy 解析不了 C:\ separated gitdir（HANDOFF-20260529.md:69, 84）。
- **claude**：429/529 需指數退避；`.claude.json` 改 MCP 不 hot-reload；CLI 2.1.162 起 SessionEnd hook 失敗需處理（common.sh:847）。

→ 新系統**應該**：每個引擎 = 一個插件，宣告式 metadata（timeout 常數、認證方式、quota 模型、成本模型、已知 failure signature），preflight 由核心統一跑；**不應該**讓引擎差異散落在 if/case 分支裡（舊系統 common.sh 2823 行的主因）。

---

## 4. 學習權重機制的結論數據（.learn-weights.json、.learn-history.jsonl）

- 133 輪、46 次 dispatch 分析後的學到的權重：`chore_ratio:30, smoke_fail:61, staleness:15, backlog:15`（.learn-weights.json，2026-06-13）；相對預設值的調整只有兩條：smoke_fail 50→61、backlog 5→15（learn-history adjustments）。
- **任務類型有效性**（30 天窗，effectiveness = 加權 delta）：feature 9.96（48 次，avg +3.5 tests +0.58 features）＞ fix 6.32（28 次）≈ test 6.0（13 次）＞ chore 0.0（6 次）＞ **other -8.95（38 次，avg tests -5.26）**。→ 「未分類任務」是負產出重災區：新系統**應該**強制任務先分類，拒絕 other 桶。
- **dispatch 類型 ROI**：salvage 19 次/ROI 540 最高，reduce-chore 9 次/290，review-untracked 8 次/140，backlog 10 次/89。→ 但注意 salvage ROI 高本身是 §1.3 的病灶指標（有東西一直需要救）。
- **keep_rate 全類 100%** = 這個指標已 Goodhart 失真（見 results.tsv：135 行全 keep），不可沿用。
- **引擎×任務組合的成功率**：舊系統只做到 reflect 角色的保守 A/B 路由（models.sh:91-220，需雙方 ≥2 樣本且候選成功率更高才切換），沒有累積出可信的跨引擎結論數據。→ 新系統若要做 telemetry 路由，**應該**沿用「證據不足不切換 + 保留探索流量」的保守設計，並從第一天就記 engine×task_type×outcome 三欄。
- **不應該**搬的：權重學習 133 輪只改動兩個數字，投入產出比極低——新系統用固定權重 + 人工月審即可。

---

## 5. 成本數據（logs/cost-tracker.jsonl，61,989 筆，2026-04-02 ～ 07-05）

- **總量**：81 天燒 **$3,102.76**；日均 $38.3（有花費的 71 天平均 $43.7）。月分佈：4 月 $274 → 5 月 $1,277 → 6 月 $1,550（複雜度增長 = 成本增長，功能沒同步增長，見 §1.1）。
- **尖峰日**：最貴 $224（05-09）、$203（06-01）、$181（05-08）；前 10 貴日全在 $97-224 區間。
- **引擎成本排行**：claude-opus-4-7 $1,077（606 calls，單 call 最貴 ~$1.78）＞ mimo $950（2,280 calls）＞ MiniMax-M3 $427（52,535 calls，量大單價低，監控型負載）＞ copilot $175 ＞ opus-4-8 $154。
- **專案排行**：gov-ai(政府ai agent) $825 ≈ UkePack $817 ＞ voice-actress $568 ＞ 監控 $409 ＞ auto-dev 自身 $392。**系統花在治理自己身上的錢（$392）超過部分 prod 專案的產出投入。**
- **參考基準**：一次「真做事」的大爆發（gov-ai 30hr）≈ $97（HANDOFF-20260426.md:248）。
- → 新系統成本閘建議：**日封頂 $40-50（軟警告）/ $100（硬停）**、單專案月封頂 ~$300、單輪 budget $10（舊預設，engineer-loop.sh:28）、80%/90%/100% 三段告警照抄。opus 級模型**應該**只給高價值角色，量大低價任務走本機 proxy/免費檔。定價表要帶 stale 警告（14 天，HANDOFF-20260426.md:95-99）。

---

## 6. KPI / MISSION 概念的取捨

**值得繼承**：
- Mission anchor 概念本身：每輪先讀 MISSION、KPI 有明確量測指令與目標值、反 Pattern 隨發現持續追加（MISSION.md:58-62 更新節奏）。
- 反 Pattern 清單全部照搬（MISSION.md:24-31）：禁自編治理批次、禁純小 polish、禁無量測的 sensor field、禁「refactor 為整潔」單獨成案、**禁自己加 task 給自己**。
- K1 chore_ratio 概念（<30%/50% 紅線）——但量測要修 §1.3 的窗口與自污染缺陷。
- K3「測試不退步」概念——但要加 test/feature 增速比守門，防 §1.1 的 8.8x 膨脹。
- 架構約束裡的：新功能向下相容、supervisor + idle heartbeat 為 daemon 預設（MISSION.md:81-87）。

**不應該繼承**：
- K2（commit 標籤覆蓋率）與 K5（反思落地率）——兩者都是「量測系統自己有沒有寫作業」的自我參照指標，直接催生 Goodhart（§1.1）。
- K4 uptime 的量測法（信 schtasks/PID）——改為 commit 產出率 + 告警送達率。
- 144 persona 體系——已實證高風險 persona 會拉去做雞毛蒜皮（MISSION.md:37），維護成本遠超收益。
- 「KPI 進展表」文字比對式量測（grep -c）——太容易刷。

---

## 開放問題（需使用者裁決）

1. **cost-tracker.jsonl 今天（07-05 13:44）仍在寫入**，最後一筆 project=監控、model=minimax:MiniMax-M3——「監控」（LobsterPulse）負載似乎還活著並共用舊 repo 的 logs。退役是否涵蓋它？新系統要不要接手其成本記帳？
2. **新系統的任務來源**：舊系統死因第一條是「無真 backlog」。重寫版打算從哪裡進活（Notion QA Hub？GitHub issues？owner 手派）？這決定微核心的第一個插件。
3. **5 prod 專案現況**：gov-ai ChromaDB 已損毀、4/5 工作樹曾不可達——新系統上線前是否先盤點哪些 prod 還值得接管？
4. **成本閘參考值**（§5 建議日 $40-50/$100）是按舊系統實耗給的；若新系統定位更精簡，是否要砍半起步？
5. **learnings/global.md（L001–L106）與 engineering-log.archive.md（615KB）**是否要整包搬進新系統 repo 作為唯讀參考？本文件只摘了骨幹。
6. **多引擎範圍**：舊系統 13 引擎大多已死或退役（gemini 掛、mimo 401、grok Heavy 訂閱狀態不明）。新系統首發要支援哪幾個？（目前本機常備：Grok proxy 8318、ProxyPilot 8317。）
7. **semantic-verify 的判官引擎**：舊系統用 GLM 免費/haiku；新系統要用本機 proxy（gpt-5.4-mini low）還是續用 haiku？涉及成本與可靠度取捨。
