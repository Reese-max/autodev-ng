# GOAL

Herdr 可行性探針（使用者 2026-08-04 核定；一天量級、只探不接線）——用實測回答
「Herdr（本機已裝 0.8.0-preview，terminal workspace manager for AI coding agents）能否
作為艦隊引擎的長駐 session adapter」。探針結論是 Go/No-Go 閘：四題全 PASS →
後續立 `herdr` adapter GOAL；任一題 FAIL → 不引入、留報告存檔。
GOAL-rebuttal-round（申辯輪）為獨立正案，不受本探針結論影響
（使用者 2026-08-04 裁示：兩線並行，各自以自己的數據定存廢）。本 GOAL 只做探測與報告，
不改任何生產接線。四個必答題：
（一）無頭相容：以 schtasks 排程（非互動觸發、有自動登入桌面 session 的環境）啟動
`herdr --session adng-probe`，pane 能建立且 CLI 可控制——實跑證明，不是文件推論。
（二）程式化全循環：純 CLI 完成「開 pane 跑一個引擎 CLI → 送入 prompt 文字 → 讀取輸出
→ 再送第二段訊息（模擬申辯/靶心注入）→ 收掉 pane」，每步有輸出證據。
（三）熱重試效益：同一個真實小任務（可用 mock 任務）以「pane 內同 session 二段對話」vs
「兩次冷啟一次性進程」對照，記錄 wall-clock 與輸出品質差異；至少 3 組樣本。
（四）生命週期安全：daemon/監督者視角——probe session 的 pane 在(a)主動收掉(b)herdr 進程
被殺(c)模擬登出 三情境後的殘留進程清點（對照 §9 孤兒偵測法）；任何殘留須可被現有
killTree 收斂迴圈清除。

## 驗收指令

```sh
npx vitest run tests/herdr-probe --reporter=dot
```

## 細部要求

1. 產出 `docs/herdr-probe-report.md`：四題各有 PASS/FAIL 判定＋可重跑的證據指令＋原始輸出
   摘錄；結尾一行機器可讀判定 `VERDICT: GO` 或 `VERDICT: NO-GO（第N題）`。
2. tests/herdr-probe*.test.ts 驗證：報告存在、四題判定俱全、VERDICT 行格式正確、
   報告中引用的證據指令檔案路徑真實存在；測試不得實跑 Herdr（CI 環境無 UI），
   實跑證據由探針執行時落盤。
3. 探針執行的 session 一律命名 `adng-probe-*` 且結束必清（含失敗路徑 finally 清理）；
   絕不觸碰使用者既有的 herdr session／workspace。
4. 記錄所用 Herdr 版本號於報告（preview 日更軟體，結論綁版本）；kernel 頂層零增長
   （探針腳本放 scripts/ 或 src/engines/，不入頂層帳）。

## 邊界

- 禁止修改 configs/*.json、src/ 生產接線、daemon 進程；本 GOAL 是唯讀探測＋報告＋測試。
- 探針過程中派生的任何進程屬 probe 自己的責任範圍，結束時依 §9 標準自證零殘留。
