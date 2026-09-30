# Product Board Delta — cyber-prep-coach（2026-09-22T2315Z）

## Round metadata

- 狀態：`FORMAL_DELTA / PARTIAL_PORTFOLIO / NOT CLEAN (0/2)`
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- repository：`Reese-max/cyber-prep-coach`
- inspected default HEAD：`402e472261f8f02c2089e81d1cc3c40ba6977bda`
- 產品基線：`0f5dcca3902735d3b68b96611b97f70128544f51`
- PR #14 inspected head：`d6c5a54eb04ad3a084d359f5ebdfe3ba089b9b93`
- 產品報告 commit：[`ffc7bbb`](https://github.com/Reese-max/cyber-prep-coach/commit/ffc7bbbb28377bbc64882a715fa449050aaaa8d1)
- [完整產品董事會報告](https://github.com/Reese-max/cyber-prep-coach/blob/ffc7bbbb28377bbc64882a715fa449050aaaa8d1/.github/quality-audits/2026-09-22T2300Z-product-board-audit.md)

## Inventory 與公平游標

重新分頁核對 owner inventory：42 repositories、41 未封存；`obsidian-vault` 是唯一封存項。`adng-memory` 為 support-only，已按用途記錄；本輪正式處理 `cyber-prep-coach`，下一游標為 `Reese-max/cf-ai-router`。

Default branch 自產品基線後只有稽核文件；audit-only commit 不算產品修正。真正產品變動在活躍 PR #14，故本輪固定 PR head，不把產品報告 commit 當回歸證據。

## Actionable finding 與追蹤

確認一項新的 `BUG / P2 / HIGH_PRE_MERGE / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`：有任何進行中 attempt 時，一般首頁／nav 的「模擬考模式」入口會被 `view=mock` effect 自動續作舊 attempt，繞過三模式 chooser。

- fingerprint：`Reese-max/cyber-prep-coach|mock-mode routing|generic mock navigation while any stored active attempt exists|mode chooser bypassed and prior attempt auto-resumed|unconditional view=mock auto-resume effect on activeStoredMock`
- 受影響者：已有 training／official attempt、想選另一模式的 iPAS 考生。
- 後果：#3 的核心模式選擇任務不能從一般入口可靠完成。
- 最小修正：只有明確續作 action 才 resume；一般入口一律顯示 chooser；重用既有 per-spec attempts。
- 非目標：router、狀態機、資料庫、帳號、雲端同步。
- 既有追蹤：[Issue #3](https://github.com/Reese-max/cyber-prep-coach/issues/3)、[PR #14](https://github.com/Reese-max/cyber-prep-coach/pull/14)、[unresolved review](https://github.com/Reese-max/cyber-prep-coach/pull/14#discussion_r4064672138)。
- 互斥：Issue、branches、PR 及 review 均活躍，`SKIPPED_LOCKED`；未留言、未修改 scope、未重複開單。

## Validation

- PR #14 CI [35631343404](https://github.com/Reese-max/cyber-prep-coach/actions/runs/35631343404)：failure，但 steps/logs 不可讀。
- PR #14 Deploy [35631343265](https://github.com/Reese-max/cyber-prep-coach/actions/runs/35631343265)：check failure、其餘 skipped，steps/logs 不可讀。
- root cause：`UNKNOWN`；不猜 runner、帳單或 YAML。
- 測試檔存在不是 durable receipt；沒有瀏覽器、手機、AT、正式部署或真實考試執行證據。
- 結論：`NEEDS_RUNTIME_VERIFICATION`，不是 regression，也不是 verified fixed。

## 外部研究與董事會結論

查閱日 2026-09-22。官方 [iPAS ISE 測驗資訊](https://ipd.nat.gov.tw/ipas/certification/ISE/exam-info)確認 115 年兩次中級考試、規劃／防護兩科、電腦測驗與各科 70 分門檻；這支持 official fidelity，但不證明本產品正確。[Quizlet Learn](https://help.quizlet.com/hc/en-us/articles/360030986971-Studying-with-Learn)提供個人化路徑；[Quizlet Test](https://help.quizlet.com/hc/en-us/articles/360030642972-Studying-with-Test)可調題數／題型但離開不保存；[Anki](https://docs.ankiweb.net/studying.html)以 FSRS 與 due review 強化長期記憶。外部功能宣稱不是本產品成效、收入或需求證據。

定位維持：`MUST MATCH` 官方規格／內容可信度；`SHOULD BE BETTER` 低設定、可恢復的 local-first 學習；`DIFFERENTIATOR` provenance 與本機續作；`DO NOT COPY` 帳號、雲端、AI tutor、LMS、社群、native app 或完整卡片平台。

模型多視角董事會的實質分歧：Growth 願意先做小規模 pilot；Security、QA、Accessibility 要求先完成 #10、內容校準、路由修正與最低 runtime receipt。決策採後者。CEO 若只做三件事：#10 相依修正、#6 分層校準、#3 official mode 在本輪 P2 修正及 exact-head receipt 後落地。不做功能量擴張。

完整報告包含獨立的 30 回歸＋20 探索市場 Persona、13 個董事會視角、Red Team、NOW／NEXT／LATER／DON'T 與 Decision Memo；該 50 人模型推演不替代固定 A01–J05，也不作真人比例或優先級證據。

## Accounting

- new actionable finding：1
- new／updated／reopened Issues：0／0／0
- deduplicated：1
- `SKIPPED_LOCKED`：1
- target report commits：1
- product implementation：0
- Verified Fixed／Regression：0／0
- runtime pending：exact-head root cause、browser、mobile、screen reader、zoom

固定稽核停止條件、兩個完整合格輪次及必要 runtime 證據未滿足，Portfolio 仍為 `NOT CLEAN, 0/2`。下一公平游標：`Reese-max/cf-ai-router`。
