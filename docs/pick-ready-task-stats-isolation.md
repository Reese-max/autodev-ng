# pickReadyTask 戰績隔離：實作差異與驗證佐證

日期：2026-07-20  
任務：確認 `pickReadyTask` 讀取 `run.db` 近 3 日資料，對樣本數 ≥ 6 且成功率 < 30% 的輪替引擎隔離，並將隔離狀態、事由及事件寫入 `dataDir`。

## 結論

功能已落地並以單元測試佐證。呼叫鏈：

1. `src/scheduler.ts::pickReadyTask()` 進入候選迴圈前呼叫 `loadIsolatedTagsForPick()`
2. 其內部 `applyStatsIsolation()` 以 `recentRunStats()` 讀 `<dataDir>/run.db` **近 3 本地日**
3. `src/engines/isolation-policy.ts` 篩選 **rotation 清單內**、`sampleCount >= 6` 且 `successRate < 0.3` 的引擎
4. 透過 `applyFirstIsolation` + `saveRoutingState` 寫入 `<dataDir>/engine-routing-state.json`（含 `untilTs`、`reason`）
5. 對每個**新**隔離引擎經 `onIsolated` 回呼 → `events.append('engine-route-isolated', { engine, reason, sampleCount, successRate, untilTs })`
6. 回傳 `activeIsolatedTags` 餵給既有 `pickCandidateTags` → quarantine gate 跳過隔離檔位

### 守門（無資料維持原路徑）

| 條件 | 行為 |
| --- | --- |
| 未設 / 空 `engineRotation` | `kind:'reuse-current' reason:'no-rotation'`，不寫狀態 |
| 缺 `run.db` / 查詢失敗 / 超時 | `reuse-current`，沿用既有狀態或 `[]` |
| 近窗樣本不足或未達門檻 | `unchanged`，不新增隔離 |
| 已隔離同一 tag | 不重設 `untilTs`，`newlyIsolated` 為空 |

## 實作差異（本輪新增/接線）

| 路徑 | 角色 |
| --- | --- |
| `src/engines/isolation-policy.ts` | 純門檻：`ISOLATE_WINDOW_DAYS=3`、`ISOLATE_MIN_SAMPLES=6`、`ISOLATE_MAX_SUCCESS_RATE=0.3` |
| `src/engines/apply-stats-isolation.ts` | I/O 編排：`applyStatsIsolation` + `loadIsolatedTagsForPick` |
| `src/scheduler.ts::pickReadyTask` | 呼叫 `loadIsolatedTagsForPick`，onIsolated 派 `engine-route-isolated` |
| `tests/isolation-policy.test.ts` | 門檻邊界單元測試 |
| `tests/apply-stats-isolation.test.ts` | run.db 近窗、落盤、已隔離冪等、窗口外不計 |

既有可重用模組（本輪未重寫）：`run-stats.ts`（近 N 日聚合）、`routing-state.ts`（dataDir JSON）、`routing-transition.ts`（首次隔離 24h）、`pick-candidates.ts` / `quarantine-gate.ts`（候選過濾）。

## 驗證指令與預期

```bash
npx vitest run tests/isolation-policy.test.ts tests/apply-stats-isolation.test.ts tests/run-stats.test.ts tests/kernel-budget.test.ts
```

預期：上述測試全綠；kernel 頂層 `src/*.ts` 行數仍 ≤ 2700。

### 關鍵斷言對照任務

| 需求 | 測試 |
| --- | --- |
| 讀 run.db 近 3 日 | `apply-stats-isolation` 以真實 `RunDb` 種子近窗資料；`run-stats` 排除窗口外 |
| 樣本 ≥ 6 且成功率 < 30% | `shouldIsolateEngine(6, 0.29)===true`；恰 30% 為 false |
| 僅輪替引擎 | `selectEnginesToIsolate` 略過非 rotation tag |
| 狀態+事由寫 dataDir | 讀 `engine-routing-state.json` 的 `isolated.<tag>.reason/untilTs` |
| 事件 | `loadIsolatedTagsForPick` 的 `onIsolated` → `events.append('engine-route-isolated', …)` |
| pickReadyTask 接線 | `scheduler.ts` 候選迴圈前呼叫，缺資料 fail-open |

## 事件與狀態 schema

**事件** `engine-route-isolated`（JSONL / `events.jsonl`）：

```json
{
  "type": "engine-route-isolated",
  "schemaVersion": 1,
  "engine": "qwen",
  "reason": "近3日樣本6成功率16.7%<30%",
  "sampleCount": 6,
  "successRate": 0.1666,
  "untilTs": "2026-07-21T12:00:00.000Z",
  "ts": "…"
}
```

**狀態** `<dataDir>/engine-routing-state.json`：

```json
{
  "version": 1,
  "updatedAt": "2026-07-20T12:00:00.000Z",
  "isolated": {
    "qwen": {
      "untilTs": "2026-07-21T12:00:00.000Z",
      "reason": "近3日樣本6成功率16.7%<30%"
    }
  },
  "promoted": {},
  "probes": {}
}
```
