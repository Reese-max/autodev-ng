# GOAL

survey 訊號多源化——讓 auto-goal 發掘器吃得到系統自身的營運數據與使用者訊號：discoverProblems
目前的勘查訊號只有 surveyCommand 的輸出（單一來源，導致發掘結果長期偏向測試整備類低價值問題）。
新增一個唯讀的多源 survey 組裝器，在既有 surveyCommand 輸出之外附加：（a）run.db 近 7 日各引擎
attempts/成功率摘要與最常見失敗 detail 模式；（b）events.jsonl 尾部的高頻事件類型統計（如
verify-fail、preflight-failed、killed 的次數與最近樣本）；（c）dataDir 下的 `USER-SIGNALS.md`
使用者訊號檔全文——此源存在時在組合訊號中置頂並標記為最高權重證據；（d）dataDir 下的
`NORTHSTAR.md` 北極星檔全文——緊接使用者訊號之後，並在給 critic 的評審 prompt 中加一條
指示：候選問題須對照北極星的價值判準排序，與北極星無關的候選降權。所有新資料源讀取失敗一律
fail-open（缺哪源略過哪源，surveyCommand 輸出永遠保留），總長度截斷維持現有 8000 字元上限。
新邏輯必須有紅→綠測試，放在 tests/survey-sources*.test.ts。

## 驗收指令

```sh
npx vitest run tests/survey-sources --reporter=dot
```

## 細部要求

1. 唯讀：組裝器絕不寫入 run.db／events.jsonl／USER-SIGNALS.md／任何狀態檔。
2. 各源獨立 fail-open：run.db 缺失/損壞、events.jsonl 缺失、USER-SIGNALS.md 不存在皆不影響其他源。
3. 向後相容：未接新組裝器的呼叫路徑行為完全不變；surveyCommand 未設時其他源照常可用。
4. 測試覆蓋：全源可用、單源損壞、全源缺失三情境；USER-SIGNALS 置頂順序；截斷邊界；唯讀驗證。
5. kernel 行數預算維持綠燈；`npm run build` 與 `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/、data/ 目錄與任何 daemon 進程。
- 改動最小化：只動達成目標所需的檔案。

連續無進展上限：3
