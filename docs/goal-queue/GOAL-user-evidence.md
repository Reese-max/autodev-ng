# GOAL

用戶視角證據 v1（使用者 2026-08-05 核定）——為艦隊產品建立「用戶視角」的機械化證據管線，
回答「產品真的變好了嗎」而非「測試綠了幾個」。v1 只做兩個最機械、最不受代理謬誤影響的
鏡頭（設計討論結論：先真值對帳、後偏好盲測；盲測面板待審查者金標校準集落地後另立 GOAL）：
（一）**gooaye 真值對帳**：從 gooaye repo（唯讀）抽樣已標 verified 的數值 claim N≥20 筆，
逐筆回查其原始逐字稿座標，機械比對數值／單位／指涉是否與原文相符，輸出正確率與逐筆
證據對照表——量測「投資訊號可信度」這個產品核心的真實水位。
（二）**taiwan-intel 真值探針**：抓取線上站台的公開資料 JSON，抽樣事件 N≥20 筆：
(a) 引用來源 URL 可達性；(b) 以 judge 端點比對事件摘要與來源頁面內容的一致性
（每筆保存原文摘錄供人工複核）；(c) 時間／地理欄位內部一致性。輸出準確率報告。
兩鏡頭統一由 `scripts/user-evidence/` 的可重跑 runner 產出報告至 `docs/user-evidence/
<ship>-<YYYYMMDD>.md`，含機械分數、抽樣種子、逐筆證據；並在既有 3 小時巡檢可讀的
位置留最新摘要指標。

## 驗收指令

```sh
npx vitest run tests/user-evidence --reporter=dot
```

## 細部要求

1. **觀測隔離鐵律**：本管線只觀測、永不接入任何 verify／review 閘（防 Goodhart——船不得
   有取悅體驗指標的迴路）；報告不得寫入任何 USER-SIGNALS.md（方向盤主權屬使用者，
   採納與否由使用者決定）；對船 repo 一律唯讀。
2. 抽樣以顯式 seed 決定且記入報告（可重現）；judge 端點僅用於內容比對且每筆判定必附
   兩側原文摘錄（人工可稽核，不信黑箱分數）。
3. 網路呼叫僅限：taiwan-intel 公開站台 JSON 與其引用的來源 URL（逾時與重試上限明確，
   失敗標 unreachable 不中斷整跑）；gooaye 鏡頭純本地資料零網路。
4. tests/user-evidence*.test.ts 先紅後綠覆蓋：(a) 報告格式（分數、seed、逐筆證據俱全）；
   (b) 同 seed 重跑抽樣一致；(c) 來源不可達與比對失敗的降級路徑；(d) 對船 repo 無任何
   寫入（唯讀驗證）；(e) 實跑產出兩船各一份真實首報告並通過格式驗證。
5. kernel 頂層零增長（runner 與邏輯全在 scripts/ 或 src/engines/）；`npm run build` 與
   既有測試零改動全綠。

## 邊界

- 不改 configs/*.json、不動 daemon、不碰船 repo 工作樹；報告目錄只增不改寫歷史報告。
- 市場走勢回測（外部行情資料）與 neciken 盲測偏好面板皆屬 v2，本 GOAL 不做。
