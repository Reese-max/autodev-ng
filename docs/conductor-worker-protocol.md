# Conductor / Worker Protocol（Issue #52 MVP）

低成本多模型半自動開發流水線：強模型（Conductor）負責規格、分解、路由、驗證、上呈與收斂；
便宜 worker（`agy`/`codex`/`herdr`/…）在明確邊界內實作。核心原則：**Verifier 不看 worker 報告，
只看 repo 證據（diff、測試、lint/build、CI）**。

```text
Spec → Task 分解（decomposeSpec）→ Task Envelope → Worker 實作
    → 驗證閘（verifyAttempt）
    → PASS → checkpoint/ledger → 下一個 task
    → FAIL → 回饋 retry（max_retries 預設 2）→ 再失敗 → Escalate
```

## 模組（`src/conductor/`）

| 檔案 | 職責 |
|---|---|
| `envelope.ts` | `TaskEnvelopeSchema`（zod）+ `task.yaml` 子集編解碼（或純 JSON）+ `workerTaskId`（hex marker） |
| `decompose.ts` | `decomposeSpec(llm, input)`：Conductor 把規格拆成 1–3 張過 schema 的 envelope；壞輸出 → `stuck` |
| `conductor.ts` | `runConductorTask(envelope, deps)`：派工→驗證→重試/上呈主迴路；`buildWorkerDirective` |
| `verify.ts` | `verifyAttempt`：累計 diff scope 檢查 + `tests[]` 逐一真跑（`runVerify`）→ `pass/fail/unverified` |
| `ledger.ts` | `TaskLedger`：`.autodev/task-ledger.jsonl` append-only 事件流（envelope/attempt/result/verification/finish） |
| `state.ts` | `.autodev/CURRENT_STATE.md` checkpoint：人類可讀段落 + `<!-- adng-state -->` canonical JSON |

## Task Envelope（`task.yaml`）

```yaml
task_id: "i52-t1"          # ^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$
phase: "implementation"
goal: "…"
scope: "…"
do_not_touch: ["secrets/"]          # 命中即 fail（優先於 allowed）
files_to_read: []
files_allowed_to_change: ["src/"]   # 空陣列＝唯讀任務
acceptance_criteria: ["…"]          # 必填，派工前就要可驗
tests: ["npx vitest run tests/x.test.ts"]  # 機械驗證指令；空＝UNVERIFIED 不可 PASS
worker: "agy"                       # engine tag → deps.resolveWorker
budget: { timeout_ms: 600000 }
max_retries: 2                      # 硬上限 ≤2；Attempt1+2 retries=3 次後 escalate
parent_commit: "abc123…"            # 立案基準；HEAD 不符＝stale → blocked
stop_conditions: []
final_report_required: true
```

## 狀態目錄

```text
.autodev/
  CURRENT_STATE.md        # 接手 checkpoint（規格+本檔+task.yaml+實作檔即可續）
  task-ledger.jsonl       # 全部事件：worker/model/cost/commit/attempt/tests/結果
  runs/<task_id>/
    task.yaml             # 契約定本（parent_commit 未填時首輪自動補記；resume 以此為準）
    worker-report.md      # 最新一輪 worker 輸出
    verification.md       # 最新一輪驗證結果
    attempt-<n>-worker-report.md / attempt-<n>-verification.md   # 每輪留證
```

`.autodev/` 由 conductor 寫進 `.git/info/exclude`（runtime 狀態不入版控；worker `add -A` 掃不走）。

## 終局語意

| status | 意義 |
|---|---|
| `done` | worker 產出 commit/檔案變動 且 scope 乾淨 且 tests 全綠 |
| `escalated` | 失敗達上限（或 identical-failure-fingerprint 提前斷點）→ 回 Conductor 重切/換模型 |
| `blocked` | stale parent_commit / stale-head（attempt 間外部改動）/ 非 git repo / engine 解析失敗 / HEAD 異常 |
| `unverified` | 無 tests 或驗證環境缺指令（blocked/skip）——**無 runtime 證據絕不標 PASS** |
| `stopped` | `isAlive=false` 中斷；非終局，不記 task-finished，重跑續原 epoch |

## 防護

- **stale context**：fresh epoch 派工前 `HEAD` 必須等於 `parent_commit`（短 sha 先 `rev-parse` 解析；
  未填則以當前 HEAD 立案）；attempt 間 HEAD 異動 → `blocked`。
- **unexpected diff**：verify 以 `parent_commit..HEAD` **累計** diff + 髒檔**內容雜湊差集**為準。
  快照邊界＝派工視窗（conductor 寫檔後、worker 啟動前 vs worker 返回後、驗證前）——
  視窗內任何變動（含預存髒檔被改、`.autodev` 被寫）都歸屬 worker 並過 scope 檢查。
- **conductor 狀態自保**：stateDir（`.autodev/`）寫入 `.git/info/exclude`——worker `git add -A`
  掃不進去；硬 `add -f` 進 commit 仍在累計 diff 被逮（=隱含 do_not_touch）；髒檔竄改由
  雜湊差集偵測（porcelain 看不見 ignore 檔，故 snapshot 對 stateDir 改走目錄走訪）。
- **tests 指令白名單**：LLM 分解產生的驗證指令 head 限 dev-tool 白名單
  （git/node/npm/npx/vitest/tsc/…），schema 層拒絕 `curl|sh`、`rm`、shell 直達——
  殘餘風險（如 `npm run <script>`）於高風險環境應人工審 envelope。
- **phantom completion**：worker 回 ok 但無 commit 且視窗內零檔案變動 → 計失敗。
- **timeout**：`budget.timeout_ms` → `AbortSignal.timeout` **加上** `Promise.race` watchdog——
  engine 無視 signal / 永不返回也不會把 conductor 掛死。
- **over-budget**：`budget.max_cost_usd` 比對 `RunResult.costUsd`，超標計失敗。
- **preflight**：派工前 `engine.preflight()`，不過計 `preflight` 失敗 attempt。
- **resume**：crash 後重跑同 task_id —— 契約以磁碟 `task.yaml` 定本為準（不信 call site），
  open attempt 補記 `interrupted`，epoch 內已耗 budget 續計；`done` 重跑冪等返回。
- **不重複燒錢**：連續相同失敗指紋（sha1 of class+reason）→ 提前 escalate。

## 與既有系統的接縫

- Worker dispatch 走既有 `Engine` 介面（`resolveWorker(tag)`），`agy`/`herdr` adapter 直接可用：
  `Job.task.id = workerTaskId(task_id)`（16-hex sha1，滿足 agy pkill marker 白名單），
  `Job.directive = buildWorkerDirective(...)`（含 `WORKER_GUARDS` + 完整契約 + 上輪回饋），
  `Job.control.signal = AbortSignal.timeout(budget.timeout_ms)`。
- Herdr 路徑同介面：Herdr engine adapter 內部已含 `-MaxRounds 1`、禁自行 commit、`AUTOPILOT_WAIT_OK` 等護欄。
- 事件接線：可選 `deps.events`（如 `FileEventLog`）記 `conductor-verification`/`conductor-task-finished`。
- 驗證執行重用 `src/engines/run-verify.ts` 的 `runVerify`（指令探測/exit code/逾時語意一致）。

## 已知邊界（MVP）

- `task-ledger.jsonl` 無鎖——假設單 conductor 程序持有同一 stateDir。
- escalated 任務重跑 = 新 epoch、budget 重新計（預期行為；stale parent_commit 通常先擋下）。
- worker 結束後殘留行程若再寫 .autodev 屬視窗外事件——post-attempt 快照抓不到；
  真正的行程清理屬 engine/adapter 職責。
- `npm run` 白名單殘餘風險（可控 package.json scripts）；高風險環境建議人工簽 envelope。

## MVP 範圍外（issue 明列）

多 worker 並行、複雜 DAG、動態決策、自動大改架構、Herdr /route /council 全整合——皆為後續。
