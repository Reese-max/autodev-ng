# Flaky 根因修正：每測獨立 fixture／快取／env（2026-07-22）

## 鎖定 spec

最小曾重現集合（見 `docs/flaky-bisection.md`／`docs/flaky-analysis.md`）：

- `tests/restart-routing-consistency.test.ts` 整檔
- 高頻失敗訊息：`expected 'reuse-current' to be 'context'`

## 根因

| 依賴 | 問題 |
|---|---|
| 模組級 `run-stats` 快取 | 跨測共用；中段 `clearRunStatsCache` 後重讀走生產預設 50ms |
| 生產 `recentRunStats` timeout 50ms | 全套高負載下 SQLite 同步讀 fail-open → `reuse-current` |
| OS 共用 temp | 多測 `mkdtemp(tmpdir())` 與他測／他行程競爭 |
| env | 未固定時鐘 env、未還原 TMP* |

獨立 solo／describe 二分常全綠（見 sibling 最小二分結論），故屬**跨測／高負載 I/O 截止**，非固定邏輯錯。

## 修正

1. **`src/engines/test-isolation.ts`**
   - `createIsolatedWorkspace`：每測獨立 root + 巢狀 `.tmp`
   - `beginRoutingFixtureIsolation`：清空 run-stats 快取、設 `ADNG_FIXED_CLOCK_ISO`、TMPDIR/TEMP/TMP 指到工作區、dispose 還原 env 並刪目錄
   - `createIsolatedRecentRunStats`：固定 `nowIso`/`nowMs` + `FIXTURE_IO_TIMEOUT_MS=5000`（**不改生產 50ms 預設**）

2. **`tests/restart-routing-consistency.test.ts`**
   - beforeEach/afterEach 改走 isolation handle
   - 真實 SQLite 路徑一律 `buildContextFromFixture`／`statsFn: fx.recentRunStats`
   - 移除對「全域 wall-clock + 預設 50ms」的隱性依賴

3. **`tests/run-stats.test.ts`** 快取案例：固定 `nowMs` + 寬 `timeoutMs`，並先斷言 `first.kind === 'stats'`

4. **`tests/test-isolation.test.ts`**：workspace／env 還原／快取暖讀單元測試

## 驗收

```powershell
npx vitest run tests/test-isolation.test.ts tests/restart-routing-consistency.test.ts tests/run-stats.test.ts tests/kernel-budget.test.ts --reporter=dot
```

生產路由逾時與 fail-open 契約不變；僅測試邊界顯式注入。
