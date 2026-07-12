# Verify-and-Supplement Phase — 設計文件（M9.6）

## 問題

autopilot 的達成判定（M9.5 informed judge）雖能讀碼判品質，但它仍是單一 LLM——可能對平庸產出給高分而宣告 achieved。整個 session 的實證顯示：**獨立的第二個 AI 會抓到寫碼者與判分者一起漏掉的洞**（本 repo 的 typescript-reviewer 就抓到 informed judge 與人工都漏的路徑穿越 Critical）。因此需要一個「達成後的獨立驗證＋補足」階段，把「需要人工獨立查核」這件事自動化。

## 目標

在 autopilot 主迴圈回 `achieved` 之後、收尾之前，跑一個**對抗式驗證-補足階段**：獨立 AI 稽核已達成的產出，發現缺口就補，收斂到乾淨或撞上限。

## 架構

- 新模組 **`src/autopilot/supplement.ts`**（單一職責，不塞進 orchestrator）。全在 `src/autopilot/` 子目錄，**不計 kernel 帳**。
- 由 `run.ts` 在 `runGoalSession` 回 `{ kind: 'achieved' }` 後呼叫；其他 outcome（no-progress/stuck/killed）不觸發（沒達成就沒有「補足已達成產出」的意義）。

## 獨立性三支柱（本功能的價值所在）

1. **換模型**：稽核用 `config.auditModel`（異於 `judgeModel`），走同一個 `judgeUrl`/`judgeApiKey` proxy。
2. **對抗式 framing**：prompt 要它「找出缺少/造假/錯誤，預設一定找得到，除非真的完美」，不是肯定式「確認做得好不好」。
3. **機械接地**：稽核前跑 `cfg.verifyCommand`（若有），把輸出一併給稽核 LLM，讓判斷有客觀證據支撐，不是純 opine。

## 階段迴圈（上限 `supplementLimit`，預設 2）

```
for round in 1..supplementLimit:
  if !isAlive(): break                          # kill switch（goalFile 刪除/stopFile）
  verifyOut = runVerify(cfg.verifyCommand)      # 機械接地（無 verifyCommand 則略過）
  evidence = gatherEvidence(goal.evidenceFiles) # 複用 M9.5 的讀檔（含 8KB/檔、24KB 總、路徑圍欄）
  audit = adversarialAudit(auditLlm, goal, evidence, verifyOut)
  if audit.clean: return { clean: true, rounds, supplemented }
  for task in audit.gapTasks:                   # 補足任務走原引擎＋測試閘
    appendTask(task); runOnceFn()               # worktree 隔離、改壞不合回
    supplemented++
# 到上限仍有缺口 → 誠實回報殘留，不假裝乾淨
return { clean: false, rounds, supplemented, residualGaps }
```

## 對抗式稽核（`adversarialAudit`）

LLM prompt（`auditLlm` 發送）：

```
你是對抗式驗證者。以下是目標、佐證檔內容、與驗收指令輸出。
找出「相對目標仍缺少、造假、或錯誤」之處——預設一定找得到問題，除非真的完美。
發現缺口→回 GAPS，其後每行一條補足該缺口的具體、可被工程引擎獨立執行的任務（1~5 條）。
真的無可挑剔→只回一行 CLEAN。

# 目標\n<objective>
# 佐證檔案\n<evidence>
# 驗收指令輸出\n<verifyOut 或「（無驗收指令）」>
```

解析（複用 planner 的 TASKS 風格）：首行 `CLEAN` → `{ clean: true }`；`GAPS` → 其後非空行為任務。**fail-open**：空回應/亂格式 → 視為 `clean: true`（不憑空生任務、不反殺已達成成果）。

## 介面（供實作與測試）

```ts
// src/autopilot/supplement.ts
export interface AuditResult { clean: boolean; gapTasks: string[] }
export function parseAudit(out: string): AuditResult

export interface SupplementDeps {
  auditLlm: LlmOpts
  runVerify?: (cmd: string, cwd: string) => { exitCode: number; passed: number; output?: string }
  readEvidence?: (absPath: string) => string
  runOnceFn: () => Promise<unknown>       // kernel runOnce（跑補足任務）
  appendTask: (text: string) => void      // append 補足任務進 backlog
  isAlive: () => boolean
  supplementLimit: number
}
export interface SupplementResult { clean: boolean; rounds: number; supplemented: number; residualGaps: string[] }
export async function verifyAndSupplement(deps: SupplementDeps, goal: Goal, cwd: string): Promise<SupplementResult>
```

## config 新增（皆可選、向後相容）

- `auditModel: z.string().optional()`——未設時 supplement 階段不啟動（維持現狀；要開此功能才設）。
- `supplementLimit: z.number().int().positive().default(2)`。

## 錯誤處理（fail-open 為最高原則）

驗證-補足階段是**加值**，絕不可反殺已達成的成果。任一環節故障（audit LLM 錯、verify 崩、補足任務失敗）→ 記事件、跳過、保留 `achieved`。稽核亂格式 → 視為 CLEAN。

## 稽核紀錄

每輪 audit 結果（clean / gap 數 / 補了幾條）append 進既有 `goal-<id>.jsonl`；最終殘留缺口寫入，誠實揭露「補了但仍有 X 沒補完」，不假裝乾淨。

## 測試（TDD）

1. `parseAudit`：CLEAN、GAPS+任務、亂格式 fail-open（→clean）、空回應（→clean）。
2. `verifyAndSupplement`：audit 回 clean → 不補、rounds 1；audit 回 gaps → append+runOnce 被呼叫、再 audit clean → 收斂；連續有 gap → 撞 supplementLimit 停、residualGaps 記錄。
3. fail-open：auditLlm throw → 回 clean-ish（不崩、不生任務）。
4. kill switch：isAlive false → 中止。
5. 機械接地：runVerify 輸出有進 audit prompt（可注入 auditLlm 捕捉 prompt 驗證）。
6. auditModel 未設 → run.ts 不呼叫此階段（向後相容）。

## 不做（YAGNI）

- 不做「換執行引擎」（補足任務用原 defaultEngine，維持簡單；獨立性靠稽核換模型已足）。
- 不遞迴驗證稽核者本身（接受「AI 驗 AI」的殘餘，靠換模型＋對抗式＋機械接地緩解，非消除）。
