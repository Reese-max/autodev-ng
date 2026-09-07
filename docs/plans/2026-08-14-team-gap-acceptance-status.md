# AutoDev NG 團隊化差距與 P0／P1／P2 驗收狀態

日期：2026-08-14

> 2026-09-07 複核：下表保留 2026-08-14 的驗收快照。現行 scoped ownership 已補上 symlink／junction 檢查，admission 與候選驗收均拒絕連結路徑；kernel 為 2215／2250 行。Crash 與 PAUSED_READY 仍採保留候選、阻擋重複執行的既有策略。最新證據與界線見 [專案清理驗收](../verification/project-cleanup-2026-09-07.md)。

狀態：本機多 Engineer 核心路徑已實作；完整工程組織治理仍未完成

## 結論

目前可稱為「**具備 fail-closed 交付閘的本機多 Engineer 執行團隊**」：兩個明示 low-risk、ownership 不衝突的任務能真實重疊執行，主分支由 repo 級單一 Merge Captain 依序寫入，CI／Reviewer／Release 與 merge receipt 綁定精確 commit。

目前**不可**稱為完整的人類工程組織替代品：尚無自動 crash-resume、靜態 code owners、一般任務 DAG、遠端 PR required checks、部署／canary、自動 PAUSED_READY 恢復及完整 team status UI。

## 驗收狀態定義

- `PASS`：本輪已有可重跑自動化證據。
- `PARTIAL`：安全邊界已守住，但完整恢復、治理或可觀測性仍缺。
- `BLOCKED`：需要外部服務、人工核可或另行授權；本輪不擴權執行。
- `NOT STARTED`：尚未實作。

## P0：安全與真實性底座

| 能力 | 狀態 | 本輪證據 | 剩餘差距／通過門檻 |
|---|---|---|---|
| Dirty baseline 固定 | PASS | `docs/plans/2026-08-14-dirty-baseline.md` | 基線是快照，不代表使用者 dirty 變更已提交或清除 |
| 必要 verify fail-closed | PASS | `tests/verify.test.ts`、`tests/verifier.test.ts` | 只有政策判定不適用的 low-risk gate 可 `SKIP` |
| 必要 Reviewer fail-closed | PASS | `tests/review-gate.test.ts` | medium／high timeout、錯誤、亂格式、缺設定皆須 `BLOCKED` |
| Commit-bound gate bundle | PASS | `tests/evidence-chain.test.ts` | `<dataDir>/evidence/` 需可寫；失敗不得標 `DONE` |
| Merge receipt | PASS | `tests/evidence-chain.test.ts` | receipt 必須連到相同 merged commit 的 ready gate bundle |
| Release 人工核可邊界 | PASS | `tests/evidence-chain.test.ts` | 發布型任務缺核可或 commit 不符即 `BLOCKED`；不代表已部署 |
| Ownership metadata round-trip | PASS | `tests/backlog.test.ts` | 任務文字、id 與原註記不得漂移 |
| Ownership 正規化／安全降級 | PARTIAL | `tests/ownership.test.ts` | 已拒絕絕對路徑、`..`、壞 resource；尚未對既有 symlink／junction 做 realpath 驗證 |
| 實際 diff coverage | PASS | `tests/scheduler-parallel-team.test.ts` | 任一越界檔案即 `BLOCKED(ownership-drift)`，main 不變 |
| 原子 task claim／成本保留 | PASS | `tests/team-state.test.ts` | SQLite `BEGIN IMMEDIATE`；尚未保留 Engine attempt／token 配額 |
| Dirty main admission | PASS | `tests/scheduler-parallel-team.test.ts` | tracked dirty 在 `engine.run()` 前阻擋；不 stash、不 reset |
| Repo 共用 team DB | PASS | `tests/team-state.test.ts` | 位於 `<git-common-dir>/autodev-ng/team.db` |
| Durable merge queue／Captain lease | PASS | `tests/team-state.test.ts` | 跨 DB 實例 FIFO 且同時僅一名 Captain |
| Crash 後不重複覆寫 | PARTIAL | `tests/team-state.test.ts` | 過期 worker 會 `QUARANTINED`；尚未自動判讀 commit graph 後續跑／補 receipt |
| Mid-flight pause | PARTIAL | `tests/verifier.test.ts`、`tests/scheduler-parallel-team.test.ts` | 不再啟 Reviewer／merge，候選進 `PAUSED_READY`；尚未自動 resume |
| Kernel budget | PASS | `tests/kernel-relocation-report.test.ts` | 目前 2214／2250 行，不得調高硬閘 |

## P1：真正多 Engineer 並行

| 能力 | 狀態 | 本輪證據 | 剩餘差距／通過門檻 |
|---|---|---|---|
| 真時間重疊 | PASS | `tests/scheduler-parallel-team.test.ts` barrier 量測 `maxActive=2` | 不是 pane／Promise 數，而是兩個 Engine execution 區間相交 |
| Low-risk admission | PASS | `src/scheduler.ts`＋並行 fixture | medium／high 維持單工；無 ownership 任務為全 repo 獨佔 |
| 衝突 ownership 互斥 | PASS | `tests/ownership.test.ts`、`tests/team-state.test.ts` | 檔案、目錄 prefix、resource、global 均不可重疊 |
| 單一 Merge Captain | PASS | `tests/team-state.test.ts` | 兩個 TeamState 實例競爭仍 FIFO |
| rebase 後 final CI／Reviewer | PASS | `tests/merge-rebase.test.ts`、candidate gate | rebase 改變 commit 後舊 receipt 無效，需重跑完整 gate |
| 並行成本保留 | PASS | `tests/team-state.test.ts` | active reservation 會計入 hard cap |
| Repo 級全域 slot 上限 | PARTIAL | 單一 coordinator 的 `concurrency` 有效 | 多 daemon 指向同 repo 時尚未以 DB 計算全域 slot 數 |
| Engine attempt／token reservation | NOT STARTED | 無 | admission 交易需保留 attempt；token 仍只可做可觀測預警 |
| 自動 crash-resume | NOT STARTED | 目前只 quarantine | 需重啟後核對 backlog、worktree、candidate、main graph，安全續跑或補 receipt |
| PAUSED_READY 自動恢復 | NOT STARTED | 目前保留候選並阻止覆寫 | 明確 resume 後須重新驗 HEAD、ownership 與所有 gate |
| Team status UI／CLI | NOT STARTED | DB 可直接稽核 | status 應顯示 slot、claims、queue age、lease、receipt 與 quarantine 原因 |

## P2：完整團隊治理與遠端交付

| 能力 | 狀態 | 本輪證據 | 剩餘差距／通過門檻 |
|---|---|---|---|
| Writer／Reviewer execution 分離 | PASS | gate bundle 記錄 writer identity 與獨立 review execution UUID | 尚未做組織帳號／真人身分驗證 |
| Static code owners | NOT STARTED | 無 | 路徑命中後路由指定領域 Reviewer，缺 owner 時 fail-closed |
| Planner／Writer 權限分離 | NOT STARTED | 無 | Planner 只能產 schema plan，不得取得 worktree 寫入權 |
| 一般任務 Dependency DAG | NOT STARTED | 只有既有 sequential split | 需 `dependsOn`、cycle detection 與 admission gate |
| 遠端 PR／required CI | BLOCKED | 本輪只有本機 `verifyCommand` | 需選定 Git provider、repo、branch policy 與 push／PR 授權 |
| 遠端 code review | BLOCKED | 本輪為本機模型 Reviewer | 需 provider review identity 與 required approval policy |
| Release deployment／canary receipt | BLOCKED | 只有人工 release approval receipt | 需要部署目標、回退策略及明確部署授權；本輪未 push、未部署 |
| 高風險人工變更核可 | PARTIAL | 發布型任務已要求核可 | 非發布型安全／migration／共享設定尚未有通用 approval policy |

## 當前可宣稱與不可宣稱

可宣稱：

- 本機同 repo 內，可讓明示 low-risk、ownership 不衝突的多個 Engineer 真正並行。
- 同 repo 主分支由 SQLite lease 保證單一 Merge Captain。
- 必要 CI／Reviewer／Release 證據缺失會 `BLOCKED`，不再以 `SKIP` 假完成。

不可宣稱：

- 不可宣稱已具備完整 GitHub／GitLab PR 團隊流程或遠端 required checks。
- 不可宣稱 crash 後一定自動續跑；目前安全策略是 quarantine 並保留現場。
- 不可宣稱已部署或已通過 production canary。
- 不可在目前 dirty main 與 stop sentinel 尚在時做 live fleet canary。
