# Product Board Audit — note-filler 同工作階段重疊執行

- 稽核時間：2026-09-30T14:14:21Z
- 輪次狀態：PARTIAL（增量稽核；非完整 portfolio CLEAN 輪次）
- 中央 repo 基準：`Reese-max/autodev-ng@99eba2458a82a4fb8e70c25c5a454014b568c659`
- 品質規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- Inventory：Reese-max 共 45 個 repositories；44 個自有且未封存，封存排除 `obsidian-vault`
- 增量界線：2026-09-30T11:00:00Z
- 本報告只做稽核／分流；未修改產品程式、CI、設定、權限或 secrets，未啟動 worker、實作、merge 或 deploy。

## 執行摘要

本輪確認一項新的可行動產品缺陷：`note-filler` PR #15 雖已把全域 `last_doc` 改成以 session 與 opaque result ID 隔離的 `ResultStore`，但同一 session 的兩個重疊 `/run` 仍採「最後完成者寫入」；較舊、較慢的執行可在較新的執行失敗後，把舊結果重新放回可匯出集合。這違反既有 Issue #4 明列的安全行為：「新執行失敗時，不得把較舊成功結果當成該失敗請求的結果匯出」。

這是 **SOURCE_CONFIRMED 的靜態因果鏈**，尚未做隔離 runtime 交錯重現，因此標記 **NEEDS_RUNTIME_VERIFICATION**。影響限於同一 session／同一使用者（例如同瀏覽器兩個分頁或快速重試），未證明跨 session 洩漏，故本輪分級為 **P2**，不是 P1。

既有 Issue #4 與活躍 PR #15 已擁有相同根因與處理範圍；本輪不搶鎖、不改 issue/PR scope，狀態為 **SKIPPED_LOCKED_ACTIVE_PR**。此中央報告保存證據與最小驗收，供目前實作者整合。

## Finding NF-20260930-01

- fingerprint：`Reese-max/note-filler+web-result-store+same-session-overlapping-runs+older-run-finishes-after-newer-failure+missing-session-generation-binding`
- kind：BUG
- severity：P2
- decision_priority：NOW
- triage：NEEDS_REVIEW
- auto_implementation：false
- confidence：中高
- 證據類型：SOURCE_CONFIRMED／靜態推論
- runtime：NEEDS_RUNTIME_VERIFICATION
- inspected base：`e8057ad815fc18dfd20aeea5e2e3c76d56925b3b`
- inspected PR head：`f48f961258455dd709fd33d900dc0389064ec677`
- 既有追蹤：[note-filler #4](https://github.com/Reese-max/note-filler/issues/4)
- 活躍實作：[note-filler PR #15](https://github.com/Reese-max/note-filler/pull/15)

### 誰受影響與可到達流程

受影響者是使用受支援 loopback Web 流程、在同一瀏覽器 session 內開兩個分頁或於前一次處理尚未完成時再次送出檔案的使用者。兩個請求共享 `nf_session` cookie，屬可到達而非跨租戶假設。

可重現的交錯前提：

1. 執行 A 先開始，呼叫 `discard_owner(session)`，然後進入較慢的 pipeline。
2. 同 session 的執行 B 稍後開始，再次呼叫 `discard_owner(session)`。
3. B 較快失敗；此時應保持該 session 無任何可匯出結果。
4. A 隨後完成，無條件呼叫 `put(doc, session)`。
5. A 的較舊結果因此重新成為可匯出內容；使用者可能把舊校正單誤認為較新失敗請求的結果。

不處理的後果是同一使用者可能匯出與最近一次操作不相符的校正文件，降低可恢復性與結果可信度。這不是資料跨 session 外洩，但對核心「上傳—處理—匯出」任務有顯著錯誤結果風險。

### Repo 證據

PR head 的 [`app/server.py`](https://github.com/Reese-max/note-filler/blob/f48f961258455dd709fd33d900dc0389064ec677/app/server.py) 在每次 `/run` 開始時執行 `discard_owner(session)`，等待檔案讀取及 threadpool pipeline，完成後直接 `put(doc, session)`；沒有 per-session generation、run epoch、取消旗標或「仍為最新請求」檢查。

PR head 的 [`app/result_store.py`](https://github.com/Reese-max/note-filler/blob/f48f961258455dd709fd33d900dc0389064ec677/app/result_store.py) 會刪除 owner 現存項目，但無法阻止先前已開始、稍後完成的請求重新寫入。

PR head 的 [`tests/test_server.py`](https://github.com/Reese-max/note-filler/blob/f48f961258455dd709fd33d900dc0389064ec677/tests/test_server.py)：

- concurrent 測試使用兩個不同 client/session，能覆蓋跨 session 隔離，不能覆蓋同 session 兩分頁交錯。
- failed-run 測試為依序執行，不能覆蓋「舊 A 尚在運行、較新 B 先失敗、A 後完成」。
- 因此目前測試通過不等於這條支援路徑已通過。

Issue #4 的既有驗收已明定：新執行失敗後，不得匯出較舊成功結果；並要求 concurrent `/run` + export 測試。此 finding 是該既有根因在同 session 交錯下尚未被 PR #15 完整封住，不是另造大型架構需求。

### 預期／實際

- 預期：同 session 的較新 `/run` 一旦開始，任何較舊且仍在運行的請求都不能再建立可匯出結果；若最新請求失敗，export 維持不可用。
- 實際：較舊請求只要最後完成，就會無條件 `put`，重新建立可匯出結果。

### 最小有效變更

在既有記憶體 `ResultStore` 內加入每個 session 的單調 generation／current-run token：

1. 每次 `/run` 開始取得新 generation，並使先前 generation 失效。
2. pipeline 完成時，只有 generation 仍是該 session 最新值才允許 `put`。
3. 較舊 completion 應丟棄結果，不得恢復 export。
4. session／result ID 的既有隔離、TTL 與容量限制保持不變。

非目標：不新增資料庫、跨 repo ledger、背景工作平台、取消整個 threadpool 任務、遠端多使用者部署或新的授權模型。

### 直接驗收

1. 同一 session：慢 A 開始後，快 B 失敗；A 最後完成時不得建立任何可匯出 result ID，export 仍回拒絕。
2. 同一 session：慢 A 開始後，快 B 成功；A 最後完成時，只有 B 的結果可匯出。
3. 不同 session 的 concurrent runs 仍互不混用。
4. 既有「成功後 export」與「依序新失敗使舊結果失效」測試持續通過。
5. 在隔離環境對上述交錯進行可控制 barrier/event 重現，保存命令、head SHA 與結果；完成前不得標為 VERIFIED_FIXED。

## Red Team

- **相反解釋：兩個同 session 請求都有效，最後完成者可被視為最新。** 不成立；產品的現有安全契約以「後開始的新執行」使舊結果失效，且 B 失敗後不應再匯出 A。
- **更小替代：只在 UI 禁用按鈕。** 不足；兩分頁、直接 HTTP 或快速重試仍可形成交錯，server 必須維持結果關聯。
- **是否 P1。** 否；目前沒有跨 session／跨使用者洩漏或資料權限影響證據。若 runtime 證明可跨 session，應重新分級。
- **是否需要新服務或 DB。** 否；既有 in-memory store 的 session generation 足以封住根因。
- **是否可能只是測試缺口。** 不只是；由 `discard_owner` 與完成後無條件 `put` 可推出確切交錯。runtime 僅用來確認實際框架排程與 export 行為，不是拿缺測試冒充缺陷。

## 董事會分歧與決策

- CEO／CPO：先完成結果與請求的正確關聯，再考慮新功能；不擴張遠端／多使用者部署。
- CTO／Staff Engineer：接受小型 session generation；反對為此引入持久資料庫或工作佇列。
- UX／Support：失敗後匯出舊內容會造成最難解釋的「看似成功」；需明確維持 export 不可用。
- Security／Privacy：現有證據不支持 P1 或跨 session 洩漏，但需保留不同 session 回歸測試。
- QA／SRE：合併前需可控交錯測試；單一綠燈或 PR 合併不足以宣稱修復。
- CFO／Growth：不以競品功能或合成人格投票擴張範圍；優先低成本封住已成立錯誤結果。

若只做三件事：  
1. 補同 session generation 綁定；  
2. 加入兩個可控交錯回歸測試；  
3. 合併後在 default branch 重跑相同情境並保存收據。  

不做：資料庫、跨 repo 共用框架、遠端 SaaS 支援、額外產品功能。

## 50 合成 Persona 與競品限制

本輪為增量缺陷驗證，不是新的完整市場研究輪次，未重新產生 50 人 synthetic preference share，也未以模型票數支持分級。已保留既有回歸角色：單機使用者、同瀏覽器多分頁、失敗後重試、輔助科技使用者、低效能裝置／長處理時間。探索角色聚焦直接 HTTP 與兩分頁交錯。這些是合成情境，不是真人發生率或收益證據。

本輪未出現足以改變產品方向的新競品證據；「競品有背景工作／版本化結果」不構成本產品必做大型架構的理由。最小 generation guard 已可處理已成立根因。

## 既有回歸追蹤

`taichung-police-intel` PR #98 已於 2026-09-30T11:06:49Z 合併至 default branch，merge SHA `562141e396c693e115b3fce10594c434c401a58e`。本輪尚未看到以原始矩陣 artifact 在該 default-branch SHA 重跑並保存的同情境收據，因此維持 **PARTIALLY_FIXED / NEEDS_RUNTIME_VERIFICATION**，不宣稱 VERIFIED_FIXED，也不重複通知舊 finding。

## 追蹤與寫入結果

- 新 Issue：0
- Issue 更新／重開：0
- 產品程式變更：0
- 中央 audit report：1
- 去重／既有追蹤：1（note-filler #4）
- SKIPPED_LOCKED_ACTIVE_PR：1（note-filler PR #15）
- 分級修正：本 finding 為 P2；未沿用 Issue 標題的 P1
- 已驗證修復：0
- runtime pending：2（本 finding；taichung-police-intel #98）
- Portfolio CLEAN：否；本輪非完整固定 A01–J05 稽核，亦缺必要 runtime 證據。

## Decision Memo

服務對象是需要在本機可靠產生並匯出校正文件的使用者。選擇 `note-filler` 的理由應是可預測、可恢復的單機流程，而非比競品更大的平台。差異化應維持「本機、最小資料面、結果不混用」。

前三優先：
1. 修正同 session 重疊執行的結果關聯。
2. 保存 default-branch 的可控交錯回歸收據。
3. 維持跨 session 隔離、TTL 與 export 安全回歸。

建議：`note-filler` = MAINTAIN / SIMPLIFY；本 finding = INVEST（局部修補與驗證）。這是稽核建議，不是實作、merge 或部署授權。
