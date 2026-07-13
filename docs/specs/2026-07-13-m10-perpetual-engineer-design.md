# M10 永續工程師：外環自主立案＋問題台帳＋多訊號源＋判斷力 Design Spec

日期：2026-07-13
狀態：使用者已核可設計方向（全開工作邊界／沿用既有日頂／先上 Prompt AutoResearch／三期分段）

## 0. 問題陳述

M9.x 完成後系統具備完整閉環（M9.7 discovery → planner → engine+verify → M9.5 informed judge → M9.6 對抗補足），但**只在人工寫 GOAL.md 時點火，achieved 後即退出**。要成為「一直工作並有效找出問題的工程師」，缺四塊：

1. **外環**：無人給目標時不會自己立案開工（daemon idle 只會發「請補任務」提醒，`daemon.ts` idle 分支）。
2. **眼睛**：唯一機械訊號是 surveyCommand（測試/覆蓋率），沒有 git churn、TODO 掃描、runtime log 等訊號源。
3. **台帳**：discovery 結果只活在單一 session——長跑必然重複發現、忘記擱置原因（實證：continuous_optimizer 殭屍任務靠人工查明收案）。
4. **判斷力**：立案前不驗真（LLM 猜的問題直接開工）、任務 timeout 兩次就放棄不會拆小、沒有「不值得做就不做」的門檻。

## 1. 使用者決策（已定案，不再開放）

| 決策 | 選擇 | 設計含義 |
|---|---|---|
| 自主工作邊界 | **全開（含新功能）** | 不做類型白名單；風險用品質閘門控（機械驗收＋informed judge＋對抗補足＋台帳留痕＋digest 透明） |
| 預算治理 | **不新增** | 沿用專案既有 dailySoftUsd/dailyHardUsd；不建自主專屬預算機制 |
| 首發專案 | **Prompt AutoResearch** | configs/prompt-autoresearch.json 開 `perpetual: true`；voice-actress 維持 false |
| 分期 | **三期** | M10.0 外環＋台帳 → M10.1 多訊號源 → M10.2 判斷力。各自獨立分支、獨立驗收 |

## 2. 總架構

採「daemon 內建外環」：外環是 daemon 主迴圈 idle 分支的延伸，`await` 完整自主 session 後才回迴圈——**單進程、絕無雙工搶 backlog**（2026-07-13 實戰教訓：daemon 與 autopilot 並存會雙搶 backlog）。

```
runDaemon while(true)
  └─ runOnce → 'idle'
       └─ maybeRunPerpetual(deps, notifier)   ← 新，src/autopilot/perpetual.ts
            ├─ 前置閘（§3.1）不過 → 立即 return，daemon 照常 idle sleep
            ├─ 有手動 GOAL.md → 直接跑該 GOAL 的 autopilot session（§3.5 搶佔）
            └─ 無 GOAL → discovery → 台帳去重 → value 閘 → 自寫 GOAL → session → 收案回寫台帳
```

**模組邊界與依賴方向**（防循環 import——daemon.ts 是 kernel，不得 import cli.js）：

- `src/autopilot/perpetual.ts`（新）：外環主邏輯。只吃注入依賴，不 import cli.js。
- `src/autopilot/run.ts`（重構）：把 main() 的 session 核心抽成 `export async function runGoalWithDeps(deps, notifier, cfg, opts?: { discovered?: DiscoverResult }): Promise<GoalOutcome>`（含 autopilot.lock、discovery（可由 opts 傳入跳過重跑）→orchestrator→supplement 全鏈）；main() 變薄殼（assemble ＋呼叫核心）。perpetual.ts 呼叫同一核心。**重構後 main() 行為不變（既有 autopilot 測試全綠、斷言不改為證）。**
- `src/autopilot/ledger.ts`（新）：問題台帳。自行對 `join(dataDir,'run.db')` 開第二條 better-sqlite3 連線（WAL 併存安全；寫入者只有 daemon 進程內的外環，單寫者紀律）——**不動 kernel db.ts，零 kernel 行數成本**。
- `src/daemon.ts`（kernel，薄接線 +~15 行）：idle 分支呼叫 perpetual（見 §3.6）。

kernel 行數預估：daemon +15、types +12、digest +8、bot/handlers +15 ≈ **2599/2700**（硬牆 3000）。

## 3. M10.0 外環＋台帳

### 3.1 觸發前置閘（全部成立才進外環）

1. `cfg.perpetual === true`（**預設 false，逐專案 opt-in**）
2. runOnce 本輪結果為 `'idle'`（backlog 無 open 任務）
3. 非 cost-stopped（billed 日成本 < dailyHardUsd——沿用 M9.9 billed 語意）
4. 距上次自主 session 結束 ≥ 目前冷卻窗（狀態檔 §3.4；預設 6h）
5. `.adng.stop` 不存在（既有 kill switch，runOnce 已擋，此處雙保險）

### 3.2 自主立案流程（無手動 GOAL 時）

1. **discovery**：沿用 M9.7 `discoverProblems`（survey→lens finders→critic 排序）。
2. **台帳去重**：ranked 逐條算 fingerprint（§3.3），已存在且 status ∈ {fixed, deferred, rejected} → 跳過；status=open → 更新 lastSeen/value 後仍為候選。全新 → INSERT status=open。
3. **value 閘**：取最高 value 候選；value < `cfg.perpetualValueThreshold`（預設 6）→ 本次無案可立，記 `perpetual-no-case` 事件，進冷卻翻倍邏輯（§6.3，M10.2；M10.0 先固定冷卻）。
4. **自寫 GOAL**：LLM（judgeModel）把候選問題展開成 GOAL.md，模板強制結構：
   - 首行標記 `<!-- adng:auto-goal problem:<fingerprint> -->`
   - `# GOAL` 段：objective（含問題 rationale 與完成定義）
   - 驗收 fence：**一律逐字使用 `cfg.verifyCommand`，禁止 LLM 自由發揮**（安全決策：自寫 GOAL 的 verify 會被 execSync 執行，LLM 自由命令＝注入面；目標特定的品質判定交給 informed judge 的佐證檔案，不靠客製命令）
   - `## 佐證檔案`：LLM 從候選問題的 lens/rationale 挑 1~4 個實際存在的檔案路徑（寫入前逐一 existsSync 驗證，不存在的剔除；全剔光→退回機械 verify only）
   - `連續無進展上限：2`（比手動 3 緊——自主工作失敗要更快止損）
   - 產出必須通過 `parseGoal` 且 objective 非空、verifyCommand 非空，否則該問題記 `deferred`（note: goal-authoring-failed）換下一個候選；連 3 個候選都寫不出 → 本次放棄，記事件。
5. **執行**：呼叫 run.ts 抽出的 session 核心（discovery 結果直接傳入，**不重跑**）。judge/audit/supplement 全沿用。
6. **收案回寫**：
   - achieved（含 supplement 結束）→ 台帳 status=fixed，note 記 goalId＋rounds＋残餘 gaps 數
   - stuck/no-progress → status=deferred，note 記原因（下次不會再自動立同案，人工可改回 open）
   - 刪除自寫 GOAL.md（僅刪帶 auto-goal 標記的；手動 GOAL 永不代刪）
   - 更新狀態檔 lastSessionTs
7. **通知**：session 結束發 Discord（成案/收案/擱置＋成本）；digest 增列「自主工程師」段（§3.7）。

### 3.3 問題台帳（ledger.ts，run.db 新表 problems）

```sql
CREATE TABLE IF NOT EXISTS problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  lens TEXT NOT NULL DEFAULT '',
  value INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',   -- open | in-progress | fixed | deferred | rejected
  goal_id TEXT NOT NULL DEFAULT '',
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT ''
)
```

- fingerprint＝`sha1(normalize(title)).slice(0,16)`；normalize＝NFKC→小寫→去空白/標點。lens 不入 fingerprint（同一問題換鏡頭再現仍算同案）。
- 冪等建表（CREATE TABLE IF NOT EXISTS）；與 M9.9 migration 同風格容錯。
- API（全同步，better-sqlite3）：`upsertSeen(candidate) → {isNew, row}`、`setStatus(fingerprint, status, note)`、`listByStatus(status, limit)`、`counts()`。
- 單寫者紀律：只有 daemon 進程的外環寫入。bot `/problems` 唯讀（開唯讀連線）。

### 3.4 外環狀態檔（dataDir/perpetual-state.json）

```json
{ "lastSessionTs": "ISO", "consecutiveEmpty": 0, "currentCooldownMs": 21600000 }
```
tmp+rename 原子寫（鏡像 alert-cooldown.json 慣例）；讀取損壞→視同全新（fail-open，頂多提早跑一次）。

### 3.5 搶佔與 kill switch

- **手動 GOAL.md 存在**（無 auto-goal 標記）→ 外環不立案，直接以該 GOAL 跑 session（效果：「丟 GOAL 檔隨時自動開工」，不用再手動啟 autopilot——語意升級，spec 明定）。
- 手動 GOAL 執行結束後 **不代刪檔**：achieved 後 GOAL.md 留在原地，但外環在狀態檔記 `manualGoalDone:<goalId>`，同一 goalId 不重跑（防每輪 idle 重複點火同一份已達成 GOAL）；使用者刪檔或換內容（goalId 變）即重新武裝。
- kill switch 三層：`.adng.stop`（停一切）＞ `cfg.perpetual:false`（停自主，手動 GOAL 搶佔路徑也停——daemon 回 M9.x 行為）＞ 刪 GOAL.md（停當前 session，既有機制）。

### 3.6 daemon.ts 接線（kernel，薄）

idle 分支改為：

```ts
if (result === 'idle') {
  let acted = false
  try { acted = await maybeRunPerpetual(deps, notifier) } catch { /* fail-open：外環故障不反殺 daemon */ }
  if (!acted) await alert('idle', 'daemon 提醒:backlog 已耗盡,請補任務')
  await sleep(acted ? cooldownMs : idleSleepMs) // acted：session 已耗時，短冷卻即回輪
  continue
}
```

- `maybeRunPerpetual` 回 `true`＝本輪有進 session（跳過 idle 提醒，睡短冷卻 cooldownMs 而非 idleSleepMs）；`false`＝前置閘未過，維持既有 idle 行為（提醒＋idleSleepMs）。既有迴圈尾端的 idle sleep 分支對應改寫，總行為：非 idle 路徑完全不動。
- import 來自 `./autopilot/perpetual.js`（daemon→autopilot 單向依賴，無環）。

### 3.7 可觀測性

- events：`perpetual-start`、`perpetual-no-case`、`perpetual-goal-authored`、`perpetual-session-done`、`perpetual-error`（全 quiet() 包裹）。
- digest 新段（+~8 行 kernel）：`自主工程師：立案 N｜修復 M｜擱置 K｜台帳 open X 件`（無自主活動時整段省略，零噪音）。
- bot 新指令 `/problems [status]`（+~15 行 kernel）：列台帳 top 10（value 排序）。

## 4. M10.1 多訊號源（眼睛）

survey 從單一 command 擴為**收集器組合**，各收集器輸出帶標頭拼接（`=== [collector] ===`），總量 cap 沿用 discovery 的 slice(-8000) 尾窗→調整為各收集器獨立 cap（command 4000、其餘各 1500）後拼接，避免單一來源擠掉其他訊號。

ConfigSchema 新增（向後相容：只設 surveyCommand＝現行為）：

```ts
surveySources: z.array(z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('command'), command: z.string(), timeoutMs: z.number().int().positive().default(120000) }),
  z.object({ kind: z.literal('git-churn'), days: z.number().default(30), top: z.number().default(15) }),
  z.object({ kind: z.literal('todo-scan'), globs: z.array(z.string()).default(['**/*.py','**/*.ts','**/*.js']) }),
  z.object({ kind: z.literal('file-tail'), path: z.string(), bytes: z.number().default(4000) })
])).optional()
```

- 實作放 `src/autopilot/collectors.ts`（新，不吃 kernel 帳）；`git-churn` 用 `git log --since --name-only` 統計、`todo-scan` 用 rg（`--no-ignore` 不開，尊重 .gitignore）、`file-tail` 讀檔尾（不存在→空字串）。
- 每個收集器獨立 try/catch fail-open；全部失敗→退回 surveyCommand 舊路徑；surveyCommand 與 surveySources 並存時，surveyCommand 自動視為第一個 command 收集器。
- Prompt AutoResearch 首發配置：command（既有 coverage）＋git-churn＋todo-scan＋file-tail(feedback.jsonl)。
- lens finder prompt 增加一句「訊號含多來源標頭，交叉引用多來源可提升 value 評估可信度」；critic 不變。

## 5. M10.2 判斷力三洞

### 5.1 立案先驗真（correctness 類問題）

自寫 GOAL 時，候選 lens=`correctness` → GOAL objective 強制加一段：「第一步：先新增一個 failing test 重現此問題並單獨 commit；若無法重現，停止並回報 NOT-REPRODUCIBLE」。orchestrator 每輪收到 evaluate() 回應後檢查：回應文字含 `NOT-REPRODUCIBLE` 標記 → session 提前結束（新 outcome kind `not-reproducible`），台帳 status=rejected（note: 不可重現），不燒後續輪。

### 5.2 timeout 自動拆小

scheduler 對任務的 attempts 耗盡且兩次失敗原因皆為 timeout → 該 blocked 事件帶 `splitEligible: true`。autopilot session 內（orchestrator 收到 runOnce blocked 結果時）：對 splitEligible 任務給 planner 一次性重規劃——prompt：「此任務兩次 timeout，拆成 ≤3 條更小、各自可獨立 verify 的任務」；新任務行帶 `<!-- adng:split-from:<taskId> -->` 標記，**帶此標記的任務不再享有拆分資格**（防無限分裂）。原任務保持 blocked 不動（審計留痕）。

### 5.3 不值得做就不做

- value 閘已在 §3.2（M10.0 落地）。
- 冷卻翻倍：`perpetual-no-case` 連續發生 → `currentCooldownMs = min(currentCooldownMs*2, 48h)`；一旦成功立案 → 重置回 `cfg.perpetualCooldownMs`。狀態存 §3.4 檔。

## 6. ConfigSchema 全量新增（M10 三期合計）

```ts
perpetual: z.boolean().default(false),
perpetualCooldownMs: z.number().int().positive().default(6 * 60 * 60 * 1000),
perpetualValueThreshold: z.number().int().min(0).max(10).default(6),
surveySources: ...(§4，optional)
```

## 7. 錯誤處理總則

- 外環全鏈 fail-open：任何階段 throw → `perpetual-error` 事件 → return false → daemon 照常。**絕不反殺 daemon（鐵律 #4）**。
- 台帳寫入失敗：吞掉並記事件——台帳是記憶不是閘門，失憶降級可接受，擋工作不可接受。
- 自寫 GOAL 寫檔失敗：本次放棄，不留半成品檔（先寫 tmp 再 rename）。
- session 內部故障：沿用既有 autopilot fail-open 語意（achieved 不可逆轉等）。

## 8. 測試策略（TDD，各期獨立）

- **M10.0**：前置閘矩陣（perpetual off／非 idle／cost-stopped／冷卻中／stop 檔——五維各自擋下）；台帳 upsert 去重/狀態機/fingerprint 正規化；GOAL 自寫格式（parseGoal 可解析、fence 逐字＝cfg.verifyCommand、佐證檔 existsSync 過濾、標記行存在）；手動 GOAL 搶佔與 manualGoalDone 防重跑；auto-goal 收案刪檔（手動不刪）；daemon 接線 fail-open（perpetual throw 不殺迴圈——注入假 perpetual）。run.ts 重構回歸：既有 autopilot 測試全綠不改斷言。
- **M10.1**：各收集器輸出格式與 fail-open；組合拼接 cap；surveyCommand 相容路徑 byte-identical。
- **M10.2**：NOT-REPRODUCIBLE 提前收案；splitEligible 判定（兩次皆 timeout 才給）；split 標記防重拆；冷卻翻倍/重置數學。
- 全程 `npm run build`＋`npx vitest run`（serial）全綠；kernel 帳每 task 實測 ≤2700。

## 9. 驗收（每期）

- **M10.0**：Prompt AutoResearch 開 `perpetual:true`，人工清空 backlog＋無 GOAL → daemon 在冷卻窗後自主立案跑完一個 session，台帳/digest/Discord 三處留痕；`perpetual:false` 專案行為與 M9.x byte-identical。
- **M10.1**：discovery 輸入含四來源標頭；任一收集器故障不擋。
- **M10.2**：注入不可重現假問題 → rejected 收案；注入雙 timeout 任務 → 拆分一次且不重拆。

## 10. 非目標（YAGNI 明列）

- 不做跨專案影響分析（voice-actress↔prompt-autoresearch 契約感知）——另案。
- 不做自主預算治理（使用者決策）。
- 不做台帳 Web UI（bot /problems 足矣）。
- 不做多專案並行外環（首發單專案驗證成熟再說）。
