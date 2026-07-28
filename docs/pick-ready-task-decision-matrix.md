# `pickReadyTask` 決策分支實測矩陣

日期：2026-07-28

## 實測方式

`tests/pick-ready-decision-tracker.test.ts` 以四個互相獨立的最小暫存 fixture，直接呼叫正式的 `src/scheduler.ts::pickReadyTask()`。fixture 使用真實 `RunDb` 與路由狀態檔，僅替換引擎、事件與 backlog 介面；追蹤器會保留原呼叫並記錄事件、路由狀態變更及 backlog 寫入。

穩定指紋排除 task id、時間戳與人話 detail，只保留實際回傳、事件型別、引擎及狀態寫入。四個案例皆只呼叫一次 `pickReadyTask`，也都沒有寫入 backlog。

## 實測結果

| 分支 | 最小觸發 fixture | 實際輸出 | 引擎呼叫 | 事件次數 | 持久副作用 |
| --- | --- | --- | --- | ---: | --- |
| 隔離命中 | rotation=`qwen,codex`；`qwen` 近窗 6 次全敗 | `picked:codex:fixed=0` | `resolve/preflight: codex` | 1：`append engine-route-isolated(qwen)` | 有：建立 `engine-routing-state.json`；無 backlog 寫入 |
| 試探放行 | 同一失敗戰績；既有 `qwen` 隔離已到期，且 `isSingleProbeEligible=true` | `picked:qwen:fixed=0` | `resolve/preflight: qwen` | 0 | 無新寫入；既有隔離仍在、`probes.qwen` 仍缺席；無 backlog 寫入 |
| 候補補位 | rotation=`qwen`；subscription 候補=`spark`；`qwen` preflight 失敗 | `picked:spark:fixed=0` | 依序 `qwen`、`spark` 的 resolve/preflight | 1：`appendOnce preflight-failed(qwen)` | 無路由狀態或 backlog 寫入 |
| 沿用現狀 | 未設 rotation；只有 defaultEngine=`qwen` | `picked:qwen:fixed=0` | `resolve/preflight: qwen` | 0 | 無路由狀態或 backlog 寫入 |

實際穩定指紋如下：

```text
隔離命中 {"branch":"picked:codex:fixed=0","events":[["append","engine-route-isolated","qwen","sent"]],"stateWrites":[["routing-state","created"]]}
試探放行 {"branch":"picked:qwen:fixed=0","events":[],"stateWrites":[]}
候補補位 {"branch":"picked:spark:fixed=0","events":[["appendOnce","preflight-failed","qwen","sent"]],"stateWrites":[]}
沿用現狀 {"branch":"picked:qwen:fixed=0","events":[],"stateWrites":[]}
```

## 目前缺口

1. **試探尚未接到正式派工狀態轉移。** `recordProbeAttempt()`、`applyProbeSuccess()` 目前沒有 `src/` 呼叫點，`pickReadyTask()` 也未派發 `engine-route-probe`。實測的「試探放行」只是隔離到期後不再被 `activeIsolatedTags()` 過濾；它沒有記錄單次試探。因此本矩陣證明目前輸出，但不能證明「只試一次」或試探成功後解除隔離。
2. **試探與沿用現狀的回傳本身不可區分。** 兩者都回 `picked:qwen:fixed=0` 且事件、寫入皆為 0；目前只能靠 fixture 前置狀態判別，正式觀測面沒有分支證據。
3. **候補補位尚缺真實 EventLog 組合測試。** 本矩陣已驗證 `appendOnce` 被呼叫一次，但事件去重與 `events.jsonl` 落盤目前由其他 preflight 測試分開覆蓋，尚未與 subscription 補位串成同一個端到端案例。

這次只建立現況矩陣與缺口證據，不補試探狀態機；後者會改變正式路由語意，應另立實作任務並同時定義成功／失敗後的狀態轉移。

## 重現命令

```powershell
npm run build
npm test -- tests/pick-ready-decision-tracker.test.ts
npm test -- tests/kernel-budget.test.ts
npm test
```

必須先 build；web 測試會延遲載入本工作樹的 `dist/events.js`。未先 build 時，`tests/web-cockpit.test.ts` 會因 `ERR_MODULE_NOT_FOUND` 等到單測 timeout，並非路由矩陣 assertion 失敗。
