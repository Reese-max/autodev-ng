# 併發設定與合併安全：實作佐證

日期：2026-07-29
範圍：只核對現有 TypeScript 實作與隔離單元測試；本文件不改變執行期行為。

## 結論

四項需求均已接線，且目前 `concurrency > 1` 是**明示的單工降級**，不是尚未實作卻悄悄忽略設定。所有合併均先經同一 Node 行程內、以主 repo 路徑分流的 FIFO queue；取得併入權後若主線前進，才在任務 worktree rebase，真衝突則回到 scheduler 的 `merge-conflict` blocked 路徑。

| 項目 | 實作位置與責任 | 對應單元測試 |
| --- | --- | --- |
| `ConfigSchema` | `src/types.ts:92-120`：`ConfigSchema` 以 `z.number().int().positive().default(1)` 定義 `concurrency`。`src/cli/assemble.ts:37-46` 以 `ConfigSchema.parse()` 讀設定。 | `tests/manual-goal-parallel-foundation.test.ts:103-109` 驗預設 `1`、可接受 `2`，並拒絕 `0`、負值、小數、`NaN`、`Infinity`。 |
| scheduler 讀取 concurrency | `src/scheduler.ts:65-68` 的 `runOnce()` 先呼叫 `noteSerialConcurrency(deps)`；`src/engines/concurrency-notice.ts:12-21` 讀取 `deps.cfg.concurrency`，大於 `1` 時寫一次 `concurrency-serial-fallback` 事件。 | `tests/scheduler.test.ts:87-122` 驗 `concurrency:2` 仍一次一個任務，且 lifecycle 只記一次降級事件；`tests/run-once-concurrency-compat.test.ts:92-116` 驗預設值與明確 `1` 的成功、失敗、stop/idle 行為相同。 |
| 進程內 `mergeBack` 序列化鎖 | `src/engines/merge-queue.ts:3-15` 的 module-level `Map<string, Promise<void>>` 以 `resolve(projectPath)` 為 key 串接 FIFO promise；前一項失敗會被 `tail` 吃掉，後一項仍可執行。`src/scheduler.ts:9,188-191` 將每次 `mergeBack()` 放入 `enqueueMerge()`。 | `tests/merge-queue.test.ts:40-56` 驗同 repo FIFO；`:58-72` 驗不同 repo 不互鎖；`:74-94` 用獨立 Git fixture 驗兩個並發 merge 都保留在主線；`:96-116` 驗同檔衝突不污染主線。 |
| rebase-before-merge | `src/worktree.ts:192-210`：主線在任務開始後前進且有 `worktreePath` 時，先在該隔離 worktree 執行一次 `git rebase <baseBranch>`，成功再唯一一次 `git merge --ff-only`；rebase 失敗會 `rebase --abort`。 | `tests/worktree.test.ts:420-432` 驗不相干檔案的主線前進會 rebase 後合回，`rebased === true`；`tests/scheduler.test.ts:783-801` 驗完整 scheduler 路徑記錄 `merge-rebased` 並回 `done`。 |
| `merge-conflict` blocked | `src/worktree.ts:198-207`：rebase 或 ff-only 失敗回 `{ merged:false, reason:'merge-conflict' }`。`src/scheduler.ts:193-206` 寫 `merge-conflict` 事件後呼叫 `blockTask()`；`src/scheduler.ts:249-263` 以 `store.report(...blocked...)` 與 `task-blocked` 事件落盤，並回傳機器可讀 reason。 | `tests/worktree.test.ts:434-447` 驗真衝突會 abort rebase、保留乾淨 worktree、回 `merge-conflict`；`tests/scheduler.test.ts:470-496` 驗 scheduler 回 blocked、backlog 標記、事件存在且 worktree/分支保留。 |

## 呼叫鏈

```text
設定 JSON
  -> src/cli/assemble.ts::parseConfig
  -> src/types.ts::ConfigSchema (concurrency 預設 1)
  -> src/scheduler.ts::runOnce
       -> noteSerialConcurrency(deps)（>1 僅記單工降級）
       -> enqueueMerge(projectPath, () => mergeBack(...))
            -> src/engines/merge-queue.ts（同 repo FIFO）
            -> src/worktree.ts::mergeBack
                 -> rebase（僅主線前進且有 worktreePath）
                 -> ff-only merge
                 -> merge-conflict
       -> src/scheduler.ts::blockTask（backlog blocked + task-blocked event）
```

## 邊界與判讀

- 這把鎖的範圍是單一 Node 行程；它不宣稱處理多 daemon 或多主機的互斥。
- `concurrency > 1` 目前只完成設定驗證、讀取及可觀測降級；尚未啟用任務並行池。
- `merge-conflict` 是環境衝突，`blockTask()` 不將它計入 `maxAttempts`；任務 worktree 與分支留給人工合併。

## 驗證指令

```bash
npx vitest run tests/manual-goal-parallel-foundation.test.ts tests/scheduler.test.ts tests/run-once-concurrency-compat.test.ts tests/merge-queue.test.ts tests/worktree.test.ts tests/kernel-budget.test.ts
npm test
npm run typecheck
npm run build
```

## 本輪實測結果

- 對應測試全綠：`merge-queue` 4、`worktree` 24、ConfigSchema／concurrency 相容性／kernel 11，以及 scheduler 三條直接路徑（單工降級、真衝突 blocked、rebase 成功）3，共 **42** 項。
- `npm run typecheck` 與 `npm run build` 全綠；`tests/kernel-budget.test.ts` 全綠，頂層 `src/*.ts` 仍在 2700 行上限內。
- `npm test` 的全量結果為 **1362 passed / 1 failed**；唯一失敗是未在本輪變更的 `tests/proc.test.ts`：`idleTimeoutMs：stdout 持續前進會續租` 在完整套件負載下被判為 idle timeout。獨立重跑 `tests/proc.test.ts` 為 **14 passed**。此為未消除的時間敏感測試訊號，不將全量套件誤報為綠燈。
