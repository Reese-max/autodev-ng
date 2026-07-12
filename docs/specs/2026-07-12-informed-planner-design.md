# Informed Problem-Finding（planner 勘查發現）— 設計文件（M9.7）

## 問題

autopilot 的 planner **不看 codebase**（orchestrator 餵給它的 `repoSummary` 只是字串 `"round N"`），只會拆一個**被交下來**的目標。系統擅長「照著做並驗證」（M9.5 informed judge、M9.6 對抗式稽核），但**不會自己發現該做什麼**——每個目標都是人找的。這是「自主找問題」的核心缺口。

且此缺口有一個更深的對稱性問題：我們驗證了**工作品質**（M9.5/M9.6），卻沒有任何一層驗證**問題選擇**。單一 planner 讀單一訊號就挑，挑得對不對無人查——而問題選擇是最高槓桿的決定（選錯→所有下游執行白費）。

## 目標

把「接地＋獨立驗證」的 meta-pattern 也套到**發現側**，使 discovery 與 execution 對稱：
`surveyCommand 機械接地 → 多鏡頭發現 → 對抗式排序/驗證 → 排序問題清單注入 planner`

## 架構

- 新模組 **`src/autopilot/discover.ts`**（單一職責，全在 `src/autopilot/` 子目錄，**不計 kernel 帳**）。
- **每 session 開頭跑一次**（多鏡頭貴，不每輪重跑）：`run.ts` 在 `runGoalSession` 前呼叫 `discoverProblems`，產出 `{ survey, ranked }`，注入 `OrchestratorDeps`。
- orchestrator 用它建 `repoSummary`（取代 `"round N"`）：`survey 快照 + 已排序問題清單`，static 跨輪；planner 逐輪配 history 攻最高價值的未處理問題。
- **opt-in**：僅 `cfg.surveyCommand` 有設時啟動；未設→`repoSummary` 維持 `"round N"`（向後相容）。

## 三支柱（沿用 M9.5/M9.6 原則）

1. **機械接地**：`surveyCommand` 輸出客觀訊號（覆蓋率/lint/測試/複雜度），有界（截 ~8KB），fail-open。
2. **多鏡頭發現**：5 個獨立 finder，各一鏡頭（`correctness`/`tests`/`perf`/`design`/`security`），各讀 survey＋佐證檔，各提候選問題。一個鏡頭漏的別的補（multi-modal sweep）。
3. **對抗式驗證/排序**：獨立 critic（換模型）收所有候選 → 去重 → 挑戰每個「真問題嗎/高價值嗎/漏了什麼」→ 按價值排序。這是驗證「問題選擇」那層。

## 介面

```ts
// src/autopilot/discover.ts
export interface Candidate { lens: string; title: string; detail: string }
export interface RankedProblem { title: string; lens: string; value: number; rationale: string }

export interface DiscoverDeps {
  finderLlm: LlmOpts                 // 五鏡頭 finder（judgeModel）
  criticLlm: LlmOpts                 // 對抗式 critic（auditModel，換模型獨立）
  runSurvey?: (cmd: string, cwd: string) => { output: string }  // 跑 surveyCommand，可注入以利測試
  readEvidence?: (absPath: string) => string
  lenses: string[]                   // 預設 5 鏡頭
}
export interface DiscoverResult { survey: string; ranked: RankedProblem[] }

// 單鏡頭 finder：回候選問題（可 0 條）
export function parseCandidates(lens: string, out: string): Candidate[]
// critic 回應解析：排序後的問題（value 0~10）
export function parseRanked(out: string): RankedProblem[]

export async function discoverProblems(deps: DiscoverDeps, goal: Goal, cwd: string): Promise<DiscoverResult>
```

- `discoverProblems`：跑 survey（機械接地）→ 並行五鏡頭 finder（各 `callAgent(finderLlm, lensPrompt)`）→ 收候選 → critic（`callAgent(criticLlm, adversarialRankPrompt)`）→ `parseRanked`。
- **並行**：五 finder 用 `Promise.all`（各自 fail-open，錯→該鏡頭空候選）。
- **fail-open**：survey 崩→`survey=''`；finder 錯→跳過；critic 錯或亂格式→退回「原始候選按出現序、value 預設 5」或空清單。全程不 throw。

## Prompt

**Finder（每鏡頭）**：
```
你是「<lens>」視角的問題發現者。以下是專案勘查訊號與佐證檔。
只從「<lens>」這個角度，找出相對專案品質的具體問題（0~5 條，沒有就回 NONE）。
每行一問題：<簡短標題>｜<一句證據/理由>
# 勘查訊號\n<survey>
# 佐證檔案\n<evidence>
```

**Critic（對抗式排序）**：
```
你是對抗式問題評審。以下是多個視角提出的候選問題。
去重、挑戰每個（真問題嗎？夠高價值嗎？漏了什麼更重要的？），按「修復價值」排序。
嚴格照格式，每行一問題（高價值在前）：
VALUE:<0~10> | <標題> | <lens> | <一句排序理由>
候選：\n<candidates>
```

`parseRanked`：抽 `VALUE:<n> | title | lens | rationale` 各行，value 夾 0~10；亂格式行跳過；全空→空清單（fail-open）。

## 注入 planner

orchestrator 的 `repoSummary`（每輪）：
```
# 專案勘查\n<survey 前 N 字>
# 已排序的待解問題（高價值在前，配下方歷史挑未處理的最高價值者）
1. [value 9] <title>（<lens>）— <rationale>
2. ...
```
planner.ts 的 `buildPrompt` 已含「# repo 現況\n${repoSummary}」；小幅強化提示：「從『已排序的待解問題』挑最高價值且未在歷史中處理過的，為它拆任務」。

## config 新增（皆可選、向後相容）

- `surveyCommand: z.string().optional()`——未設＝discovery 不啟動。
- `surveyTimeoutMs: z.number().int().positive().default(120000)`。
- `discoverLenses: z.array(z.string()).default(['correctness','tests','perf','design','security'])`。
- finder 用 `judgeModel`、critic 用 `auditModel`（復用既有；`auditModel` 未設時 critic 退用 judgeModel，記事件提醒獨立性降級）。

## 與既有的關係

- discovery 產出的排序問題 → planner 攻 → M9.5 informed judge 驗工作品質 → M9.6 對抗式稽核補足。**發現、執行、驗證三階段全部機械接地＋獨立驗證，對稱閉環**。
- 廣目標（如「持續改善專案健壯性」）下，discovery 提供具體方向；`achieved` 通常不乾淨觸發，靠 `noProgressLimit`／成本頂收斂（持續改善到 plateau），這是對的。

## 測試（TDD，多 task）

- `parseCandidates`：正常多行、NONE、亂格式（→空）。
- `parseRanked`：正常排序行、value 夾界、亂格式行跳過、全空 fail-open。
- `discoverProblems`：survey→finder→critic 串接（注入 mock LLM）；並行五鏡頭都被呼叫；finder 錯跳過該鏡頭仍出結果；critic 錯 fail-open 退回；survey 崩→survey ''。
- config：新欄位可選/預設/向後相容。
- 整合：surveyCommand 未設→repoSummary 維持 "round N"；有設→repoSummary 含 survey+ranked。

## 不做（YAGNI）

- 不每輪重跑 discovery（每 session 一次；re-discovery 留後續）。
- 不做 LLM 主動探索整個 repo（靠 survey＋佐證檔接地，不無界讀碼）。
- 不新增 finder/critic 專屬 model config（復用 judgeModel/auditModel）。
- 不做多問題並行 meta-loop（排序清單＋history 讓 planner 逐一攻，reuse 既有迴圈）。
