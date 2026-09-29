# Product Board 增量稽核 — note-filler 批次輸出身分

- 時間：2026-09-29T05:00:00Z
- 狀態：PARTIAL（增量分流；非完整 portfolio CLEAN 輪次）
- 規則 blob：`8167e10798071d2276addaff6b201c6b0e904a2a`
- 中央基準：`Reese-max/autodev-ng@99eba2458a82a4fb8e70c25c5a454014b568c659`
- inventory：42 個 Reese-max 自有 repositories；41 未封存；`obsidian-vault` 因 archived 排除產品寫入
- 本輪界線：只稽核／分流；未修改產品程式、CI、設定、權限、secret，未啟動 worker/GOAL，未 merge/deploy

## Discovery 與增量範圍

自前一 evidence cutoff `2026-09-29T02:01:56Z` 起，完整比對自有 inventory 的近期 commits、所有狀態 Issue/PR 搜尋結果與活躍審查證據。default branch 新產品提交只有：

1. `taiwan-intel-dashboard@f1212679950059fa18a2a80f29704820dd89d382`（PR #63 merge）
2. `taiwan-intel-dashboard@3010006fe68d40f4c84228dfc779712552c57ef8`（PR #64 merge）

另重讀活躍產品 PR：`project-doctor-web#12`、`note-filler#13`、`92-duty-scheduler#44`、`police-exam-archive#76/#77`，及已合併的 `taiwan-intel-dashboard#63/#64`。

## 新 actionable finding

### NF-20260929-01 — 先取回已擁有的 deterministic alternate，再分配空閒 base

- repository / inspected head：`Reese-max/note-filler` PR #13，`6dacc7555c5f827468cdd316a01141d38916117a`
- kind：BUG
- severity：P2
- decision_priority：NOW（限 PR #13 合併前）
- triage：NEEDS_REVIEW
- auto_implementation：false
- evidence：SOURCE_CONFIRMED／靜態可到達因果鏈；NEEDS_RUNTIME_VERIFICATION
- 追蹤：
  - 既有根因 Issue：https://github.com/Reese-max/note-filler/issues/12
  - 活躍實作 PR：https://github.com/Reese-max/note-filler/pull/13
  - 未解審查證據：https://github.com/Reese-max/note-filler/pull/13#discussion_r4129505081
- 互斥結果：`SKIPPED_LOCKED_ACTIVE_PR`；未修改 Issue/PR scope，未建立重複 Issue

**fingerprint**

`note-filler + same-stem deterministic alternate already owned + original base owner's output/sidecars removed + reprocess alternate owner + allocator claims newly free base before resolving owned alternate + duplicate authoritative output/receipt and split metrics/history`

**受影響角色與支援流程**

批次處理兩個不同路徑但同 stem 的筆記時，第二份輸入已合法擁有 hash-suffixed 輸出。若第一份 base 擁有者的輸出與 sidecars 後來被移除，再重跑第二份輸入，當前分配順序會先占用重新空出的 base，而不是復用它已擁有的 alternate。結果是同一輸入留下兩套輸出／權威 receipt，metrics 可能重複計數，後續 recovery/audit history 被拆成兩條。

現有替代是避免在共享 outdir 中刪除 base 擁有者後重跑同 stem 輸入，或人工辨識並清理重複 artifacts；這不是可靠產品保證。不處理會使 Issue #12 原本要恢復的逐筆可稽核性仍在正常維護／重跑情境失真。

**最小有效修正**

在把空閒 base 指派給目前輸入前，先檢查其 deterministic hash-suffixed alternate 是否已由該輸入的 canonical identity/receipt 擁有；若是則復用 alternate。不要新增 registry、資料庫、跨 repo framework，也不要改變不衝突輸出的命名。

**直接驗收**

1. 建立同 stem 的 A/B，確認 B 取得 deterministic alternate。
2. 刪除 A 的 base output 與 note-owned sidecars，保留 B 的 alternate artifacts。
3. 重跑 B 後仍回傳原 alternate，不建立第二份 base output/authoritative receipt。
4. metrics 與 recovery history 對 B 只保留單一身分；既有不同輸入碰撞與失敗 receipt 回歸仍通過。
5. 合併後須在 default branch 的相同情境重跑；目前 PR head、單元測試宣稱或 review thread 均不等於 VERIFIED_FIXED。

## 去重與反證

- Issue #12 已擁有「batch sidecars 必須綁定各輸出」根因；本 finding 是其修正分支內新揭露的 allocator 邊界，不另造 Issue。
- PR #13 在 exact head 的 GitHub Actions run `36519307895` 為 failure 且零可用 steps；PR body 記載的 162 個本機聚焦測試不是 hosted exact-head CI，也未執行真實法律筆記／付費 provider／部署服務。
- 先前 recovery-history identity finding 已於 `6dacc75` 有局部修正與回歸；本 finding 的症狀是「同一輸入產生第二個權威輸出」，不是同一 fingerprint 的重貼。
- Red Team：若 allocator 在 free-base 判斷前已查 owned alternate，問題可被推翻；目前未解 review 指向 `src/note_filler/__main__.py:308` 的相反順序，故保留 finding。若後續 head 改變，須重新固定 SHA，不能沿用本結論。

## 其他 delta 判定

### taiwan-intel-dashboard

PR #63 的 review 曾提出「HTTP 200 但非 ZIP 會跳過重試／fallback」P1；核對合併 head `261ae4506de67cdebfb9b865e69b2edbfcbb00c1` 與現行 default file blob `04b493104b0b3980d63527bd0fac8a1fb2b4d611` 後，`download_zip()` 已把 `ValueError` 納入 retry/fallback catch。故不列現存 finding、不重複開單。PR exact-head 檢查與 Deploy 為 success，但尚未取得合併後下一次正式 data refresh 的完整 runtime receipt，狀態為 `NEEDS_RUNTIME_VERIFICATION`，不可宣稱 VERIFIED_FIXED。

### 92-duty-scheduler

PR #44 的新增 race／epoch finding 已逐步由後續 commits 回覆；最新 draft head `b531fb387d2210fabd453c328ff01f8e465eaf53` 的自動 review 未再提出 major issue。default branch 未變，且沒有 deployed multi-admin/runtime evidence，因此只視為活躍 PR 進度，不做修復通知、不改 Issue scope。

### project-doctor-web / police-exam-archive

`project-doctor-web#12` 最新 head `ec83986b063d21e44e15619a4b426487b86ddd56` 已將先前 P2 threads 標為 resolved，但仍缺 real MiniMax、fixed-persona 與 deployment evidence；`police-exam-archive#76/#77` 仍為未合併 PR。皆不把 code review 或綠燈當 default-branch runtime 修復。

## 產品董事會 delta（模型多視角推演）

- CEO：只做三件事時，先阻止同一輸入產生雙重權威 artifacts、保留 default-branch/runtime 驗證、拒絕擴成新 registry。暫不做 UI 美化、跨 repo sidecar 平台或新付費整合。
- CPO／Support：批次可稽核性是既有承諾；本 finding 阻斷 Issue #12 的完成，不是新產品方向。
- CTO／Staff Engineer：調整 allocator 判斷順序與一個 deterministic regression 足以處理根因；大型 migration 不成比例。
- QA／SRE：零步驟 Actions failure 不能提供正負產品證據；合併後要在 default SHA 重跑同 stem 刪除／重跑情境與鄰近 metrics/recovery。
- Security／Privacy：不需真實法律筆記或外部 provider；隔離 fixture 可完成驗證。
- CFO／Growth：沒有真人需求、收益或 ROI 證據；不以合成偏好或競品功能升級優先級。
- Accessibility／UX：本輪沒有可成立的可及性或互動 finding；不為配額開單。

分歧：產品與支援希望合併前把所有 sidecar 邊界一次收斂；工程與 Red Team 反對引入全域 registry。結論採局部 allocator 修正與一個直接 regression。

## 競品、50 合成 Persona 與 Red Team 邊界

本輪是既有 P2 根因的 pre-merge 邊界分流，未出現需要重新評估產品定位的 opportunity；不以外部競品存在某功能當缺陷，也不重貼 2026-09-26 以前市場資料。本次未產生新的競品主張或 Synthetic Preference Share。

50 合成 Persona 基線不輪替、不宣稱重跑：Issue #12 原有 B04、C01、C04、D02、D05、I05、J01、J05 等批次／稽核／復原情境仍適用；其餘既有 regression baseline 保留。新 edge case 只增加到既有 batch/recovery evidence backlog，不能替代固定 A01–J05 完整稽核，也不能推動 CLEAN 輪數。

Red Team 已檢查：已有功能是否解決、是否只是測試環境問題、是否可用更小順序修正、是否需要 registry，以及是否與 recovery-history dedupe finding 重複。結論支持窄修，不支持擴張工程。

## NOW / NEXT / LATER / DON'T

- NOW：PR #13 內先解析 owned alternate，再考慮 free base；補單一 deterministic regression。
- NEXT：修正真正進 default branch 後，在 exact default SHA 重跑同情境與 metrics/recovery 鄰近路徑；再判定 VERIFIED_FIXED／STILL_REPRODUCIBLE。
- LATER：只有真實多輸入規模或跨版本 migration 證據出現時，才研究更強的 artifact identity storage。
- DON'T：不新增重複 Issue、不把 PR/review 當修復、不建全域 registry／ledger／framework、不啟動 agent、merge 或 deploy。

## Decision Memo

- 服務誰：以共享 outdir 批次處理筆記，並依 receipt、metrics、recovery 稽核結果的操作者與審查者。
- 為何競爭／選擇：可追溯、可恢復且每筆輸出只有一個權威身分，比新增功能更直接保護既有核心流程。
- 差異化：本地可驗證的 output/receipt hash binding 與保守 recovery；不是更多 AI 功能。
- 前三優先：單一輸入單一權威 artifact；default-branch exact-SHA 驗證；保持最小範圍。
- 不做／刪除：拒絕新 registry、跨 repo 平台、真人資料測試與功能綁包；若 owned-alternate 查找可解根因，就不保留更大設計。
- 風險／實驗：隔離同 stem A/B fixture，刪除 A 後重跑 B；以 artifacts 數量、identity 與 history 為退出條件。
- 建議：`MAINTAIN + SIMPLIFY`；不是實作授權。

## 寫入與計數

- 新 Issue：0
- Issue 更新／重開／關閉：0
- 新 actionable finding：1（既有 Issue #12 + PR #13 review thread 追蹤）
- 去重：1
- 縮範圍：1（allocator 順序 + regression；拒絕 registry）
- 已驗證修復：0
- NEEDS_RUNTIME_VERIFICATION：2（note-filler default regression；taiwan-intel production refresh）
- SKIPPED_LOCKED_ACTIVE_PR：1
- ISSUE_WRITE_BLOCKED：0
- REPORT_WRITE_BLOCKED：0（待 GitHub 寫入回讀）
- portfolio CLEAN：否；本輪非完整 A01–J05 兩輪稽核
