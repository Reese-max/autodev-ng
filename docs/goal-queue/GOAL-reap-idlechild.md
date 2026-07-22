# GOAL

硬化 supervisor 的 wedge 判定，讓「卡死但留著閒置殘留子進程」的 daemon 也能自動 reap，
同時嚴格不誤殺「正在跑合法長任務／正在等慢 LLM 回應」的健康 daemon。
現況缺口(2026-07-22 實際發生):`classifyDaemon`(src/supervisor/health.ts)的 reap 分支
硬性要求 `childCount === 0`；一個 wedged 的 note-filler daemon(heartbeat 凍結 3 小時)因為留著
一個上一個失敗任務殘留的 wsl.exe 子進程(childCount=1)而逃過 reap，只能靠人工提權 taskkill 救回。

關鍵設計約束(這題的難點，務必守住):不能用「子進程 CPU 是否為 0」當 wedge 訊號——
因為 engine 等待慢 LLM 回應時也是 0 CPU（網路 I/O 阻塞），與 wedge 無法用 CPU 區分，
會誤殺正在等 LLM 的健康 daemon。改用「時間 + 子進程性質」的兩段式判準：

1. 既有第一段(維持不變)：`pidAlive && heartbeatAgeMs > staleThresholdMs(30分) && childCount === 0` → reap。
2. 新增第二段(帶子進程的 wedge)：`pidAlive && heartbeatAgeMs > hardCapMs && 無任何 engine 型子進程` → reap。
   - `hardCapMs` 是一個遠大於 staleThreshold 的硬上限(建議預設 120 分，config 可覆寫 `wedgeHardCapMs`)，
     取「任何單一任務／LLM 呼叫都不該讓 heartbeat 凍這麼久」為前提；9660 凍了 3 小時，會被這段抓到。
   - 「engine 型子進程」= 子進程樹中存在已知 engine 執行檔（node/devin/codex/opencode/python/bun 等，
     以清單比對進程名）。殘留的 wsl.exe / cmd.exe / conhost.exe 這類殼進程不算 engine。
     若樹中存在 engine 型進程 → 視為可能仍在工作，即使超過 hardCap 也保守 keep（寧可不殺）。

如此:
- 合法長任務(有 node/codex/opencode 等 engine 子進程在跑，即使阻塞在慢 LLM、CPU=0)→ 永遠不被殺。
- 帶純殼殘留(wsl/cmd/conhost)且 heartbeat 凍超過 hardCap 的 wedge(如 9660)→ 自動 reap。

所有新邏輯必須有紅→綠測試，放在 tests/supervisor-health*.test.ts。

## 驗收指令

```sh
npm run build && npx vitest run tests/supervisor-health --reporter=dot
```

## 背景

2026-07-22 note-filler daemon(pid 9660)在一個任務失敗後 wedged，heartbeat 凍結 3 小時、
本體 CPU 不動，只留一個失敗任務 spawn 的 wsl.exe 殼進程。新上線的自癒 supervisor 因為
`childCount===1` 判 keep 無法自動復原，最後靠人工提權。教訓:不能只看「有沒有子進程」，
但也不能用「子進程 CPU」——等慢 LLM 也是 0 CPU。可靠訊號是「凍結時間 + 子進程是不是 engine」。

## 細部要求

1. 安全第一(最高優先):只要子進程樹中存在 engine 型進程，任何情況都不得 reap
   （涵蓋「等慢 LLM、CPU=0」的合法情境）。必須有測試覆蓋:heartbeat 凍超過 hardCap、
   但樹中有 node engine → keep。
2. 對稱地，必須有測試覆蓋:heartbeat 凍超過 hardCap、樹中只有 wsl/cmd 殼進程(無 engine)→ reap
   ——這正是 9660 的情境。
3. 既有三分支(!pidAlive→launch、childCount===0 且 stale→reap、其餘 keep)行為維持不變(向後相容)。
   第一段 staleThreshold 與第二段 hardCap 分開設定。
4. engine 進程名清單集中在一處常數，易於增修；比對用進程名(不靠 CPU)。
5. `superviseConfig` 探測子進程樹時，判斷樹中有無 engine 型進程即可（不需採樣 CPU）；
   probe 失敗一律 fail-safe → keep（不確定不殺，鏡像現有保守作法）。
6. kernel 行數預算維持綠燈(tests/kernel-budget.test.ts)；必要時精簡註解，不得刪功能。
7. 完成後 `npm run build` 與 `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/、data/ 目錄與任何 daemon 進程。
- 改動最小化:只動 src/supervisor/ 下達成目標所需的檔案與其測試。
- 狀態一律放 dataDir，絕不寫回 config 檔。
- 不得弱化既有的保守 fail-open 行為。

連續無進展上限：3
