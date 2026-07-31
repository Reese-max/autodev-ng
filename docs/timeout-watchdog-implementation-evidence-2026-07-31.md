# 五件套實作佐證（2026-07-31）

本檔案補足「只有測試輸出、沒有實作佐證」的交付缺口。內容只核對目前工作樹內的 TypeScript 實作與單元測試，不啟動 daemon、node 長駐程序，也不改動 `configs/`、`scripts/` 或 `data/`。

## 實作與測試對照

| 契約 | 實作位置 | 直接測試證據 |
| --- | --- | --- |
| `idleTimeoutMs` 設定、registry 透傳、各 adapter run 插管、300000 預設 | `src/types.ts:74-86` 定義欄位與防呆；`src/engines/registry.ts:34-116` 傳入八個非 mock adapter；`src/engines/proc.ts:32` 的 `DEFAULT_ENGINE_IDLE_TIMEOUT_MS`；`src/engines/claude-cli.ts`、`codex.ts`、`copilot.ts`、`agy.ts`、`grok.ts`、`qwen.ts`、`opencode.ts`、`devin.ts` 各自保存並傳入 `runProcess`。 | `tests/engine-registry-command.test.ts`：`idleTimeoutMs 透傳所有 adapter 的 run；未設預設 300s，preflight 只用 pingTimeoutMs` |
| `timeoutMs` 防呆 | `src/types.ts:82-85`：`timeoutMs` 非負整數；`timeoutMs=0` 或超過 `7200000` 時，必須有正的同引擎 `idleTimeoutMs`。 | `tests/types.test.ts`：`timeout 無牆鐘或超過 2 小時時必須由同一引擎的 idleTimeoutMs 護欄接手`；`tests/manual-goal-proc-kill-escalation.test.ts` 的 `timeout／idle schema 組合` 矩陣 |
| `killTree` 升級 | `src/engines/proc.ts:169-228`：扁平 PID 輸入、葉到根排序、Windows `taskkill /T /F` 後等待驗活、逐 PID fallback、殘存程序寫 `proc-zombie`；非 Windows kill 亦支援注入依賴。 | `tests/proc.test.ts`：雙層樹斬與 fallback；`tests/manual-goal-proc-kill-escalation.test.ts`：殘存者事件、注入 kill 與非 Windows 路徑 |
| `supervise` heartbeat 看門狗 | `src/supervisor/supervise.ts:10` 定義 30 分鐘門檻；`src/supervisor/supervise.ts:279-318` 僅在 PID 探測成功、程序仍存活且 heartbeat 過期時 reap、清 lock、重拉。 | `tests/supervisor-health/supervise.test.ts`：heartbeat 新鮮、過期、PID 已死三態；`tests/supervisor-health/io-fail-open.test.ts`：探測失敗保守 keep |
| 事件寫入 | `src/supervisor/supervise.ts:308-315` 透過 `EventLog` 寫入 `daemon-wedge-recovered` 與 `frozenMinutes`；`src/engines/proc.ts:218` 以注入 sink 寫入 `proc-zombie`。 | `tests/supervisor-health/supervise.test.ts` 驗證 `events.jsonl`；`tests/proc.test.ts` 與 `tests/manual-goal-proc-kill-escalation.test.ts` 驗證殘存程序事件 |

## 可重放驗證

```text
npx vitest run tests/types.test.ts tests/engine-registry-command.test.ts tests/proc.test.ts tests/manual-goal-proc-kill-escalation.test.ts tests/supervisor-health/supervise.test.ts tests/supervisor-health/io-fail-open.test.ts
→ Test Files 6 passed (6)
→ Tests 75 passed (75)
→ exit code 0

npm run typecheck
→ exit code 0

npm run build
→ exit code 0

npx vitest run tests/kernel-budget.test.ts
→ Test Files 1 passed (1)
→ Tests 2 passed (2)
→ exit code 0

npm test
→ Test Files 134 passed (134)
→ Tests 1428 passed (1428)
→ exit code 0
```

完整測試末段出現一行由既有 `commit-hash` 失敗容錯測試刻意產生的 `fatal` stderr；Vitest exit code 仍為 0，不能把該行誤判成套件失敗。
