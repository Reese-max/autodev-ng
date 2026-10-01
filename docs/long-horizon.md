# 長時程執行後端（Execution Backend，issue #55）

`adng run` 把「單一 GitHub Issue／有界目標」交給可插拔的長時程執行後端跑：

`Plan → Act → Verify → Checkpoint/Recover → Repeat`

第一個 adapter 是 `long-horizon`（`src/backends/long-horizon.ts`）。它**不取代**
既有的 portfolio scheduler、Herdr/council、或任何引擎 adapter——scheduler 仍負責
選題與時機，本層只負責把已選中的目標可恢復地執行到驗證完成。

## 角色分工（三角色各自獨立設定）

| 角色 | 預設 | 設定鍵 | 責任 |
|---|---|---|---|
| Manager | deterministic（每輪提目標本身）| `executionBackend.managerModel` | 每輪用最小重組 context（原始目標＋已驗證進度＋失敗證據＋升級指導）決定下一個 bounded step；無 conversation 歷史 |
| Executor | `defaultEngine`（走既有 Engine matrix）| `executionBackend.executorEngine` | 對單一有界步驟跑一次；每輪都是 fresh bounded prompt |
| Auditor | mechanical（`runVerify`＋git HEAD）| `executionBackend.auditorModel`（可選 LLM 二審）| 獨立驗收：`verifyCommand`＋git SHA；executor/manager 的自我宣告**永遠只是證據**，不推進完成狀態 |
| Escalation | 無（指紋撞頂即 blocked）| `executionBackend.escalationEngine`（如 `herdr` tag）| 同一失敗指紋連續達上限時的外部升級；每指紋最多一次 |

## Run 生命週期與狀態

```text
running ──▶ complete          （goal verifyCommand 通過）
   │  ├─▶ interrupted          （operator pause / stop 哨兵 / process 中斷）
   │  ├─▶ needs-approval       （高風險步驟等待人工核可）
   │  └─▶ blocked              （失敗指紋撞頂且無/失敗升級、manager blocked、maxRounds 達頂）
interrupted / needs-approval / blocked ── resume ──▶ running
cancelled / complete / failed ＝終結，不可 resume
```

- **checkpoint**：每次 Auditor 驗收通過寫 `checkpoints/<seq>.json`，記 step、round、git SHA、
  verifyStatus、commitHash；`state.json.verifiedSteps` 是唯一的進度真相。
- **失敗指紋**：`<類別>:<detailSignature>`（沿用 `signature-breaker` 首行 80 字慣例），
  類別有 `exec`（executor 失敗）、`verify`（驗收紅）、`infra`（驗收基礎設施）、
  `claim`（自報完成被駁回）、`manager`。連續相同指紋達 `maxSameFingerprint`（預設 3）
  → 升級或 `blocked`；不同指紋各自計數，不會因一個新錯誤提早放棄。
- **interrupt**：`interrupt.json` 哨兵檔案＋`pause`/`abort`/`approve` 指令；
  無 live driver 時直接落盤生效。`drive.lock` 防止同 run 雙驅動。
- **resume**：只依賴 `<dataDir>/runs/<runId>/` 落盤狀態重建，不需原 conversation；
  供 process crash / reboot 後接續。
- **approval gate**：步驟 `risk: 'high'` 或文本命中高風險關鍵字
  （deploy/production/migration/secret/credential/permission/rm -rf/drop table/major upgrade/refactor）
  → park `needs-approval`；`approve` 只放行**那一個**已核可步驟，不重問 manager。

## 落盤佈局（`<dataDir>/runs/<runId>/`）

```text
goal.json        原始目標（含 issue 來源）
state.json       RunState（zod 驗證、atomic 寫；verifiedSteps/failures/directives/pendingApproval/metrics）
attempts.jsonl   每次 attempt 一行：outcome ∈ verified|rejected|blocked|needs-approval
checkpoints/     <seq>.json：每個 verified step 的 SHA/verify/commitHash
evidence/        attempt-<round>-<outcome>.json：rejected/blocked 的 executor output＋audit detail
metrics.json     RunMetrics＋phase/completed/parkedMs
interrupt.json   操作員哨兵（讀後即刪）
drive.lock       單一驅動鎖（acquireLock：PID 驗活＋stale 回收）
```

## CLI

```powershell
adng run start --config <path> --goal "fix flaky test"            # 直接給目標
adng run start --config <path> --goal-file GOAL.md                # 檔案（parseGoal）
adng run start --config <path> --github-config <gh.json> --issue 55   # 由同步的 IssueState 產生目標
adng run resume    --config <path> --id <runId>
adng run status    --config <path> [--id <runId>]                 # 不帶 id → 全部 run
adng run interrupt --config <path> --id <runId> --kind pause|abort
adng run approve   --config <path> --id <runId> --by <who>
adng run evidence  --config <path> --id <runId>                   # state＋attempts＋checkpoints
adng run metrics   --config <path>                                # 跨 run 彙總（A/B 比較）
```

exit code：`complete`→0；`needs-approval`/`interrupted`/`running`→2；`blocked`/`failed`/`cancelled`→1。

## 設定範例

```jsonc
{
  "executionBackend": {
    "adapter": "long-horizon",
    "managerModel": "gpt-5-codex",        // 可選；未設走 deterministic manager
    "auditorModel": "claude-sonnet-4.5",  // 可選；設了會在 verify pass 後做 LLM 二審
    "executorEngine": "codex",            // engines 白名單 tag；未設用 defaultEngine
    "escalationEngine": "herdr",          // 可選；指紋撞頂時的外部升級
    "maxRounds": 10,
    "maxSameFingerprint": 3
  }
}
```

`executorEngine`／`escalationEngine` 必須存在於 `engines` 白名單（schema＋factory 雙層
fail-closed）；LLM 角色沿用 `judgeUrl`/`judgeApiKey` 檔位（`llmFromConfig`）。

## 量測（`adng run metrics` → BackendMetricsSummary）

供與既有 `run-once` runner 做 A/B 比較：`completionRate`、`averageRounds`、
`auditorRejectionRate`、`falseCompletionClaims`（自報完成被駁回次數）、
`repeatedFailureRate`、`resumes`、`recoverySuccessRate`、`manualInterventionRate`、
`tokensIn`/`tokensOut`、`costUsd`、`wallClockMs`/`activeMs`/`blockedMs`。

## 驗收對照（issue #55）

- `ExecutionBackend` 介面：`src/backends/types.ts`（start/resume/status/interrupt/collectEvidence）
- 每輪 fresh bounded context：`prompt()` 逐輪重組；executor 永遠拿不到歷史
- Auditor 獨立、不信自報：`mechanicalAuditor`（exec.ok 為 false 直接 rejected）
- 失敗指紋限次：`state.failures`＋`consecutive`＋`maxSameFingerprint`
- 中斷恢復：`resume()` 只依落盤狀態；`metrics.recoverySuccesses`
- checkpoint 連結 SHA/測試證據：`checkpoints/*.json`
- 三角色各自設定：`executionBackend.{managerModel,executorEngine,auditorModel,escalationEngine}`
- 可選 herdr 升級：`escalationEngine` tag 指向 herdr adapter
- 高風險 approval gate：不因 long-running 繞過
- CLI pilot：`adng run …`（`tests/cli-run.test.ts` 為整合驗收）
- 量測：`metrics.json`＋`summarizeRuns`
