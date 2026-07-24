# GOAL

critic 實證探針——評審從自由心證升級為有據可查：critic 現對候選問題的「挑戰」全憑
survey 文本自由心證，無法查證（候選宣稱某測試 flaky，critic 不能跑一下驗證），假陽性
只能靠立案後的紅燈檢查兜底。改為：critic 評審前，對候選清單跑廉價機械探針，結果注入
critic prompt 作為「實證註記」——探針種類：（a）候選 detail 中含 tests/ 路徑樣式者，
實跑該測試（沿用 runVerify 機制、獨立短 timeout，如 120s）記錄紅/綠；（b）候選文字中
含已知事件類型名（verify-fail、no-commit、timeout 等 events.jsonl 實際出現的 type）者，
統計該事件近 72h 出現次數；（c）其餘候選標「無探針可用」。critic prompt 新增硬約束：
有實證支持者優先、宣稱與探針結果矛盾者（宣稱 flaky 但實跑綠、宣稱高頻但近 72h 零次）
必須重降權並在理由點明。探針全程 fail-open：單一探針失敗/逾時標「探針故障」不影響其他
候選與評審主流程；探針總預算上限（如最多 5 個實跑、總計 ≤5 分鐘）防灌爆。新邏輯必須有
紅→綠測試，放在 tests/critic-probe*.test.ts。

## 驗收指令

```sh
npx vitest run tests/critic-probe --reporter=dot
```

## 細部要求

1. 測試以注入假 runner/假 events 驗證：測試路徑候選→實跑並注記紅綠、事件候選→計次注記、
   無特徵候選→無探針注記、探針 throw→標故障且其餘候選照常、預算上限截斷。
2. critic prompt 的實證註記格式與硬約束文案有快照測試釘住。
3. 探針絕不寫入任何狀態檔（唯讀鐵律同 survey 組裝器）。
4. 向後相容：探針整體故障時 critic prompt 與現行為一致。
5. kernel 行數預算維持綠燈；`npm run build` 與 `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/、data/ 目錄與任何 daemon 進程。
- 改動最小化：主戰場 src/autopilot/discover.ts 周邊與新模組。

連續無進展上限：3
