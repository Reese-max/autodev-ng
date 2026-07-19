# src/engines 路由與狀態入口盤點

日期：2026-07-19

## 結論

可插入「戰績感知路由 / 隔離 / 試探 / 晉升」的最小改動點，是在 `src/scheduler.ts` 的 `pickReadyTask()` 呼叫 `candidateEngines()` 之前，將目前的 `cfg.engineRotation + cfg.defaultEngine + db.failCount(task.id)` 輸入，改成先交給 `src/engines/` 內新增的純路由模組計算候選清單。既有 `pickReadyTask()` 仍負責白名單檢查、`engines.resolve()`、`engine.preflight()` 與 blocked/failover 語意，避免把事件與狀態 I/O 擴散進新邏輯。

最小安全邊界：

- 無戰績資料、未設定新路由狀態、或新模組判定資料不可用時，必須直接回到既有 `candidateEngines()` 結果。
- 新邏輯不得改 `BacklogStore.report()`、`RunDb.record()` 或 `EventLog.append()` 的寫入協議；只讀既有戰績、只回候選 tag。
- 新增狀態檔若必要，應落在 `cfg.dataDir` 下並由獨立 `src/engines/*` store 管理，採 tmp+rename、fail-open，且不得阻塞 `pickReadyTask()` 主流程。

## 實際入口盤點

| 類別 | 實際入口 | 目前責任 | 可插入程度 |
| --- | --- | --- | --- |
| 任務挑選 | `src/scheduler.ts::runOnce()` 讀 `store.read().filter(t => t.status === 'open')` 後呼叫私有 `pickReadyTask()` | 建立開放任務集合、處理 idle/duplicate、接收挑選結果 | 不建議把新路由塞在 `runOnce()`；它還負責成本、worktree、verify，改動面太大 |
| 引擎候選 | `src/scheduler.ts::pickReadyTask()` 內 `candidateEngines(cfg.engineRotation, cfg.defaultEngine, cand, db.failCount(cand.id))` | 對每個 open task 展開候選 tag，逐一 resolve/preflight | 最小插入點；可只替換候選清單來源，其餘保留 |
| 現有輪替純函式 | `src/engines/rotation.ts::candidateEngines()` | 顯式 tag 優先、無 rotation 回 default、hash 分散與 failCount failover | 適合作為 fallback 與相容性錨點；不要直接塞 I/O |
| 引擎建立/隔離 | `src/engines/registry.ts::makeEngineRegistry()` | per-tag lazy 建 adapter、展開 env、建 `PreflightCache`、部分 adapter profileDir 落 `cfg.dataDir` | 適合承接「引擎級隔離設定」但不適合做戰績路由決策 |
| 探針 | `src/scheduler.ts::pickReadyTask()` 呼叫 `engine.preflight()`；各 adapter 內使用 `PreflightCache` | 候選引擎可用性確認，失敗 appendOnce `preflight-failed` 並後退 | 「試探」若是路由層試探比例，應先影響候選順序；實際健康探針仍沿用這裡 |
| 事件派發 | `src/events.ts::EventLog.append()/appendOnce()/heartbeat()`，由 `scheduler.ts` 用 `quiet()` 包住 | JSONL 事件、一次性事件、heartbeat 原子寫 | 新路由只需新增少量事件型別時，從 `pickReadyTask()` 成功/降級處呼叫；不應讓路由純函式直接寫事件 |
| 戰績讀取 | `src/db.ts::RunDb.failCount()`、`dayStats()`、`engineDayStats()`、`lastAttempt()` | SQLite attempts，含 task/engine 成敗與成本 | 戰績感知路由應新增只讀查詢或使用 `engineDayStats()`；避免改 `record()` schema |
| 狀態寫入 | `src/db.ts::RunDb.record()`、`src/backlog.ts::BacklogStore.report()`、`src/events.ts` | 嘗試紀錄、任務狀態、觀測事件 | 不應直接改；若需要隔離/晉升狀態，另建 `src/engines/*-state.ts` |

## 最小檔案級變更清單

### 必改

1. `src/engines/rotation.ts`
   - 保留 `candidateEngines()` 現有相容行為。
   - 可新增 `routeCandidateEngines()` 或 `rankCandidateEngines()` 純函式，輸入 rotation/default/task/failCount/戰績摘要/隔離狀態，輸出候選 tag。
   - 守門條件：資料缺漏、狀態未設定、全部候選被隔離時，回 `candidateEngines()` 或至少保留一條既有可用 fallback。

2. `src/scheduler.ts`
   - 在私有 `pickReadyTask()` 內，把 `candidateEngines(...)` 換成新路由函式。
   - 保留 `engineCfg` 白名單檢查、`engines.resolve()`、`engine.preflight()`、`appendOnce('preflight-failed')` 與 blocked 行為。
   - 若要發「路由降級 / 隔離命中 / 晉升」事件，只在這層用 `quiet(() => events.appendOnce/append(...))` 寫，避免 I/O 進入純函式。

3. `tests/engine-rotation.test.ts` 或新增 `tests/engine-routing-*.test.ts`
   - 覆蓋無資料維持原路徑。
   - 覆蓋隔離名單會下沉或略過，但全部隔離時仍 fail-open。
   - 覆蓋試探比例/晉升門檻只改候選順序，不繞過白名單與 preflight。

### 視需求新增

4. `src/engines/routing-state.ts`（已落地：格式 + 版本 + 回退）
   - 檔名：`cfg.dataDir/engine-routing-state.json`
   - 寫入 tmp+rename；讀取失敗回空狀態 + `kind:'reuse-current'`；不得拋錯阻斷 `pickReadyTask()`。
   - 詳見下方「路由狀態檔 schema」。

5. `src/engines/routing-stats.ts`
   - 若 `RunDb.engineDayStats()` 不足以表示「近期窗口」或「試探結果」，新增 adapter 將 db 查詢結果轉為路由摘要。
   - 優先放在 `src/engines/` 子目錄，避免增加 `src/*.ts` 頂層 kernel 行數。

6. `docs/engine-routing-insertion-points.md`
   - 本盤點檔；後續實作若改路由狀態格式，補充狀態檔 schema 與事件型別。

## 不建議改動點

- `src/backlog.ts::BacklogStore.report()`：這是任務狀態機與受控寫 BACKLOG 的唯一入口；路由不應改寫任務文字或狀態。
- `src/db.ts::RunDb.record()`：attempts schema 已承擔成本/成敗記帳；戰績路由應以讀取或額外摘要為主，不在記帳熱路徑塞策略。
- 各 adapter 的 `run()`：戰績感知屬派工前決策，不應散落到 `qwen/codex/opencode/...`。
- `src/engines/registry.ts` 的 adapter switch：除非隔離需要 per-engine profile/config，否則不應在 registry 做晉升或試探決策。

## 建議事件型別

若後續實作需要觀測，建議只新增低頻事件：

- `engine-route-fallback`：戰績/狀態不可用，回既有 rotation。
- `engine-route-isolated`：某 tag 因隔離被下沉或跳過。
- `engine-route-probe`：某 tag 被選為試探候選。
- `engine-route-promoted`：某 tag 達門檻升為優先候選。

這些事件應由 `pickReadyTask()` 在取得候選清單後派發，並以 `appendOnce()` 控制噪音；純排序函式只回傳決策結果與 reason，不直接碰 I/O。

## 路由狀態檔 schema（`engine-routing-state.json`）

路徑：`<cfg.dataDir>/engine-routing-state.json`  
實作：`src/engines/routing-state.ts`  
目前寫入版本：`version: 1`

```json
{
  "version": 1,
  "updatedAt": "2026-07-20T00:00:00.000Z",
  "isolated": {
    "qwen": { "untilTs": "2026-07-21T00:00:00.000Z", "reason": "probe-fail" }
  },
  "promoted": {
    "codex": { "score": 3, "promotedAt": "2026-07-18T00:00:00.000Z" }
  },
  "probes": {
    "opencode": { "hits": 2, "lastTs": "2026-07-19T01:00:00.000Z" }
  }
}
```

### 版本兼容

| 情況 | 行為 |
| --- | --- |
| 缺檔 | `kind:'reuse-current' reason:'missing'` → 沿用 `candidateEngines()` |
| 讀不到 / JSON 損壞 | `unreadable` / `corrupt` → 同上 |
| 非物件形狀 | `invalid-shape` → 同上 |
| 未來 version 且無可讀 map | `unsupported-version` → 同上 |
| 未來 version 仍帶 v1 map 欄位 | 降級讀取已知欄位，`kind:'state'` |
| 缺 `version` / 缺 map 欄位 | 回填空 map 與目前 version，`kind:'state'` |
| 單筆 entry 型別錯 | 該筆回填安全預設（字串 `''`、數字 `0`），略過非物件 entry |

### 寫入

- 永遠寫成 `ROUTING_STATE_VERSION`（目前 1）
- tmp+rename 原子寫；失敗回 `false` 不拋（fail-open）
- 呼叫端在接線 `pickReadyTask()` 前應用 `shouldApplyRoutingState()`；`false` 時不得覆寫既有候選清單
