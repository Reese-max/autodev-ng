# Product Board Audit — note-filler 審查決策綁定與手動編輯持久性

- 稽核時間：2026-09-30T16:58:04Z
- 輪次狀態：PARTIAL（增量稽核；非完整 portfolio CLEAN 輪次）
- 中央 repo 基準：`Reese-max/autodev-ng@99eba2458a82a4fb8e70c25c5a454014b568c659`
- 品質規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- Inventory：Reese-max 共 45 個 repositories；44 個自有且未封存，封存排除 `obsidian-vault`
- 增量界線：2026-09-30T14:26:00Z
- 本報告只做稽核／分流；未修改產品程式、CI、設定、權限、secrets、Issue 或活躍實作 PR。

## 執行摘要

本輪沒有新的 default-branch 產品 commit；增量變化均在 PR。於 `note-filler` PR #14 current head `ae15d15c8b5020f7dcdc6b1e6ef24edd5e590d24` 確認兩項可到達的 P2 缺陷：

1. 舊瀏覽器頁面的審查表單只送出 `argument_id`，未攜帶文件／revision 綁定。載入新文件後，再送出舊頁面表單，可把舊決策或舊手動文字套到新文件相同 `argument_id` 上。
2. `EDITED_ACCEPTED` 的手動文字只更新 process memory；落盤 ledger 僅保存 claim hash，未保存可重播的 edited overlay。重啟或重新跑同一原稿後，手動文字遺失，決策轉 stale，無法恢復已核准正式稿。

兩者都是 **SOURCE_CONFIRMED／靜態因果鏈**；尚未在隔離瀏覽器與 process restart 情境實際重現，因此標記 **NEEDS_RUNTIME_VERIFICATION**。既有 Issue #3 與活躍 PR #14 已持有範圍；本輪不搶鎖、不改 scope、不另開重複 Issue，記為 **SKIPPED_LOCKED_ACTIVE_PR**。

## Finding NF-20260930-02：舊表單可把審查決策套到新文件

- fingerprint：`Reese-max/note-filler+claim-review-form+old-page-submit-after-new-document+decision-applied-to-current-doc-by-reused-argument-id+missing-document-revision-token`
- kind：BUG
- severity：P2
- decision_priority：NOW
- triage：NEEDS_REVIEW
- auto_implementation：false
- evidence：SOURCE_CONFIRMED／靜態推論
- runtime：NEEDS_RUNTIME_VERIFICATION
- inspected base：`e8057ad815fc18dfd20aeea5e2e3c76d56925b3b`
- inspected PR head：`ae15d15c8b5020f7dcdc6b1e6ef24edd5e590d24`
- 既有追蹤：[note-filler #3](https://github.com/Reese-max/note-filler/issues/3)
- 活躍實作：[note-filler PR #14](https://github.com/Reese-max/note-filler/pull/14)

### 可到達流程與影響

1. 使用者在文件 A 的結果頁看到 `argument:0`，頁面保持開啟。
2. 同一 process 另一次 `/run` 載入文件 B；B 也有 `argument:0`。
3. 使用者回到 A 的舊頁面，按 Accept、Reject 或提交 `edited_text`。
4. `POST /review` 在讀表單前先把**目前** `app.state.last_doc`（B）存到區域變數；表單沒有 A 的文件 fingerprint 或 revision token。
5. 只要請求讀表單期間 B 沒再次變動，`doc is app.state.last_doc` 檢查會通過；伺服器依 `argument_id` 找到 B 的 `argument:0` 並落盤 A 頁面送出的決策／文字。

結果是使用者可能在未查看 B 主張與證據的情況下核准、拒絕或覆寫 B；`accepted-only` 隨後可輸出不符合使用者實際審查意圖的內容。這直接破壞主張級人工 gate 的核心任務，但目前沒有跨 session／跨使用者權限影響證據，因此不升為 P1。

### Repo 證據

- [`app/templates/result.html`](https://github.com/Reese-max/note-filler/blob/ae15d15c8b5020f7dcdc6b1e6ef24edd5e590d24/app/templates/result.html) 的審查 form 僅提交 `argument_id`、decision、reason、note、reviewer、edited_text；沒有 `doc_fingerprint`、claim revision 或 CSRF-like one-time revision token。
- [`app/server.py`](https://github.com/Reese-max/note-filler/blob/ae15d15c8b5020f7dcdc6b1e6ef24edd5e590d24/app/server.py) 的 `review_decision` 以目前全域 `last_doc` 作目標；identity 檢查只捕捉「讀取表單期間」發生的替換，不能辨識提交前已經過期的瀏覽器頁面。
- PR 自我審查亦明示：`stale browser forms need a document/revision-bound POST contract`，但 current head 尚未實作該 contract。
- 現有回歸測試只在 `request.form()` 執行期間替換文件，未測「A 頁已渲染 → B 已完成載入 → A 才送出」。

### 最小有效變更

- 渲染每個審查 form 時加入目前 `doc_fingerprint` 與 claim revision hash（或等價不可混用 token）。
- `POST /review` 在任何 ledger／document mutation 前，常數時間或等價安全方式比對提交 token 與 current doc/current claim；不符時回 409 並要求重新載入。
- 不新增資料庫、帳號系統、多使用者 SaaS、DMS 或跨 repo framework。

### 直接驗收

1. A 頁渲染後載入 B；送出 A 的 Accept／Reject，伺服器回 409，B 的 doc、ledger、export 均不變。
2. A 頁渲染後重新產生同原稿但 claim/evidence revision 改變；舊 form 回 409。
3. current doc/current claim 的表單仍可成功落盤並輸出。
4. 隔離瀏覽器以兩個分頁執行上述交錯並保存 head SHA、步驟與結果。

## Finding NF-20260930-03：手動核准文字沒有持久 overlay

- fingerprint：`Reese-max/note-filler+edited-accepted-review+process-restart-or-same-document-rerun+manual-text-lost-and-ledger-cannot-replay+ledger-stores-hash-without-edited-content`
- kind：BUG
- severity：P2
- decision_priority：NEXT
- triage：NEEDS_REVIEW
- auto_implementation：false
- evidence：SOURCE_CONFIRMED／靜態推論
- runtime：NEEDS_RUNTIME_VERIFICATION
- inspected PR head：`ae15d15c8b5020f7dcdc6b1e6ef24edd5e590d24`
- 既有追蹤：[note-filler #3](https://github.com/Reese-max/note-filler/issues/3)
- 活躍實作：[note-filler PR #14](https://github.com/Reese-max/note-filler/pull/14)

### 可到達流程與影響

1. 使用者在審查頁修改 claim 文字並送出 Accept。
2. server 以 `replace(seg)` 建立 candidate，將新文字放入 `app.state.last_doc`，ledger 記錄 `EDITED_ACCEPTED`。
3. ledger 的 `DecisionRecord` 只保存 claim hash、evidence hash、decision、note 等 metadata，不保存 edited text 或可重播的 patch。
4. process restart 後重新處理同一原稿，原始 pipeline claim 重新出現；ledger 可由同一 `doc_fingerprint` 載入，但 latest record 的 claim hash 與重新產生的 claim 不符，因此成為 `STALE_REVIEW`。
5. 使用者已完成的手動文字不可恢復，也不能重建先前的 accepted-only 正式輸出。

這不是「審查歷史仍可見」即可消除的問題；產品主張 durable decision ledger 與後續重播，而手動核准內容本身是決策不可分離的一部分。遺失會造成重工與正式輸出不可重現。

### Repo 證據

- [`app/server.py`](https://github.com/Reese-max/note-filler/blob/ae15d15c8b5020f7dcdc6b1e6ef24edd5e590d24/app/server.py) 僅把 candidate text 更新到 process memory。
- [`src/note_filler/review.py`](https://github.com/Reese-max/note-filler/blob/ae15d15c8b5020f7dcdc6b1e6ef24edd5e590d24/src/note_filler/review.py) 的 `DecisionRecord.to_dict()` 未保存 edited text／patch；`load_for_document` 也無 overlay replay。
- current tests 證明存檔失敗不發布、hash drift 會 fail closed，但沒有「restart → reload ledger → 恢復 edited claim → accepted-only 等同先前輸出」驗收。
- PR 自我審查明示：`manual edits need a durable overlay/replay contract`。

### 最小有效變更

在既有 per-document ledger 中保存最小、可驗證的 edited overlay（例如 edited text + base claim hash + resulting claim hash），載入時只在 document／argument／base revision 全部相符時重播；任何不符維持 stale。避免儲存來源全文、建立新 DB 或擴成通用版本控制系統。

### 直接驗收

1. 編輯並核准 claim，保存 accepted-only 輸出；重建 app state／模擬 restart，再載入同原稿與 ledger，edited text 與輸出完全一致。
2. base claim 或 evidence revision 不同時不得套用 overlay，狀態為 stale。
3. ledger 毀損、edited payload 缺欄位或 hash 不符時 fail closed，不改原稿。
4. original paragraphs 在 replay 前後保持不變。

## Red Team 與分級校準

- **是否只是 UX 改善？** 否。第一項可把未針對 B 做出的人工決策寫到 B；第二項使已核准內容無法重播，兩者都違反 Issue #3 的核心完成條件。
- **是否 P1？** 目前否。沒有跨 session、權限、個資外洩或直接危及資料不可逆毀損的證據；影響為單機審查正確性與恢復性，符合 P2。
- **是否需要新資料庫／狀態機？** 否。現有 doc fingerprint、claim/evidence hash 與 JSON ledger 足以形成最小修正。
- **是否已有測試解決？** 現有 interleaving test 只涵蓋 request parsing 當下競態，沒有舊頁面 token；ledger reload tests 沒有 replay edited content。
- **是否可只寫文件？** 否。文件不能阻止舊表單 mutation，也不能恢復遺失的 edited overlay。

## 董事會分歧與決策

- CEO／CPO：審查功能若不能保證「核准的是眼前這一版」與「核准內容可恢復」，不應視為完成；不擴張多人協作。
- CTO／Staff Engineer：優先以既有 fingerprint/hash 加兩個局部 contract；反對引入 DB、事件平台或跨 repo ledger。
- UX／Support：409 必須提示重新載入；restart 後不應默默丟失使用者文字。
- Security／Privacy：表單 revision token 是完整性邊界，但目前沒有跨使用者影響，維持 P2。
- QA／SRE：需兩分頁與 process restart 測試；本機 946 tests 通過不涵蓋這兩條原情境。
- CFO／Growth：不以競品或合成偏好擴大功能；先封住審查正確性。

若只做三件事：
1. 為 review POST 加 document/claim revision token。
2. 為 edited accepted 保存最小 overlay 並安全 replay。
3. 合併後在 default branch 執行兩分頁與 restart 原情境，保存收據。

不做：帳號系統、DMS、多租戶 SaaS、資料庫、通用 workflow engine。

## 50 合成 Persona 與競品限制

本輪是增量 pre-merge 缺陷稽核，不是新的完整市場輪次，未用 synthetic preference share 支持分級。保留的回歸角色包括：單機使用者、兩分頁審查者、處理多份筆記的學生、完成手動法律文字修訂者、app 重啟後續作的人員、輔助科技／慢速操作使用者。探索角色聚焦舊頁提交、同原稿重跑、ledger replay 與毀損復原。這些是模型情境，不是真人發生率或營收證據。

Issue #3 已保存 CoCounsel 等競品的 assertion-level verification 與 human review 訊號；本輪沒有足以改變產品方向的新外部證據。競品存在 workflow 不代表需要大型平台；兩個局部完整性 contract 即可處理已成立根因。

## 回歸與執行證據

- PR #14 exact head `ae15d15c8b5020f7dcdc6b1e6ef24edd5e590d24` 的 Actions run [36746817276](https://github.com/Reese-max/note-filler/actions/runs/36746817276) 為 failure；多個 jobs 的 `steps=null`，不推測帳單、runner 或 YAML 根因。這不是產品測試失敗證據，也不能當成功驗證。
- PR 自我審查聲稱 Git Bash 946 passed、1 skipped、12 integration deselected；只支持其實際涵蓋的本機路徑，不涵蓋本報告的兩分頁 stale form 或 process restart overlay replay。
- 本輪沒有 default-branch 產品 commit，故沒有 VERIFIED_FIXED。

前輪 `note-filler` PR #15 同 session 重疊 run finding 在新 head `ceb61e38b255d82c7278e92496f8da4644f7f8f9` 仍可由 `discard_owner` + 完成後無條件 `put` 推得，且 tests 仍只用兩個不同 client；狀態維持 PRE-MERGE / NEEDS_RUNTIME_VERIFICATION，不重複開單或重複通知。

## 追蹤與寫入結果

- 新 Issue：0
- Issue 更新／重開：0
- 產品程式變更：0
- 新 findings：2（P2 BUG ×2）
- 去重／既有追蹤：2（note-filler #3）
- SKIPPED_LOCKED_ACTIVE_PR：2（note-filler PR #14）
- 已驗證修復：0
- runtime pending：3（本報告 2 項；前輪 PR #15 1 項）
- Portfolio CLEAN：否；本輪不是固定 A01–J05 完整稽核，且必要 runtime 證據缺失。

## Decision Memo

服務對象是需要把來源型補充內容審查後形成可恢復正式筆記的單機使用者。選擇 `note-filler` 的核心理由應是原稿不可變、證據可追溯、人工核准不錯綁且可重播；不是功能數量。

前三優先：
1. 綁定表單與文件／claim revision。
2. 持久化並安全重播 edited accepted overlay。
3. 保留 default-branch 的兩分頁與 restart 回歸收據。

建議：`note-filler` = MAINTAIN / SIMPLIFY；兩項 finding = INVEST（局部修正與驗證）。這是稽核建議，不是實作、merge、部署或付費授權。
