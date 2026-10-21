# Product Board 增量稽核：soundbox 完整備份驗證阻擋

- 稽核時間（UTC）：2026-09-29T23:04:40Z
- 狀態：PARTIAL / TARGETED_DELTA
- 規則來源：[issue-quality-v2](https://github.com/Reese-max/autodev-ng/blob/8167e10798071d2276addaff6b201c6b0e904a2a/docs/portfolio-audit/2026-09-14-issue-quality-v2.md)
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- 上次增量截止：2026-09-29T20:01:00Z
- 證據查閱日：2026-09-29 UTC

> 這是針對變動 PR 的增量稽核，不是新的完整 portfolio 輪次；不重貼既有競品矩陣、50 位合成 Persona 或固定 A01–J05 結論，也不增加 CLEAN 輪數。

## Discovery 範圍

- 已重新列舉 Reese-max 自有 repositories：42 個；41 個未封存，`obsidian-vault` 因封存排除產品變動檢查。
- 41 個未封存 repo 的 default branch 在截止點後沒有新提交。
- 截止點後有 head 變動的開放 PR：
  - `autodev-ng` #67、#102、#103、#105
  - `soundbox-offline` #13
- `autodev-ng` #102（`78ff331…`）與 #67（`fd5aa10…`）exact-head CI 成功；#103（`a8f841a…`）查閱時 CI 仍在執行；#105（`c8f2875…`）尚無 PR-triggered run。這些變動沒有產生較本報告更高且未追蹤的新 finding。
- 所有狀態 Issue 在截止點後沒有新更新。
- 本次未發現 default-branch 產品修正，因此不宣稱任何既有 finding 已驗證修復。

## 新證據：完整備份中「存在但損壞」的音訊欄位被正規化消失

### 追蹤與固定版本

- 既有根因追蹤：[soundbox-offline #1](https://github.com/Reese-max/soundbox-offline/issues/1)
- 活躍實作：[soundbox-offline PR #13](https://github.com/Reese-max/soundbox-offline/pull/13)
- default/base SHA：`68d8137b77be063cc5ae5468e9e31b81455060a9`
- inspected PR head：`076e46c5bac977882f620649a309f3b9482b8546`
- inspected source blob：`app/library-backup.ts@4e7cdbdcae07909d86f80c61cd0deb9bcab73dd7`
- 原始 review finding：[P1 discussion](https://github.com/Reese-max/soundbox-offline/pull/13#discussion_r4137809494)
- 證據等級：CONFIRMED / SOURCE_CONFIRMED
- runtime：NEEDS_RUNTIME_VERIFICATION

### 問題與可到達因果鏈

PR #13 先以「值必須是字串且以 `data:` 開頭」的條件建立 `audioDataUrl`；條件不成立就把值改成 `undefined`。後續資料 URL／base64 驗證只在 `audioDataUrl !== undefined` 時執行。

因此，JSON 可解析的 `BACKUP_FORMAT_FULL` 若包含：

1. `audioDataUrl: "not-a-data-url"`，或
2. 已存在但不是字串的 `audioDataUrl`

欄位會在驗證前被正規化掉。後續 `stageRestore()` 把該 track 當作 metadata-only；在乾淨裝置沒有既有 blob 可重用時，restore 可回報成功並建立 0-byte placeholder，而不是在任何寫入前拒絕損壞的完整備份。

受影響者是使用完整備份做災難復原、且來源檔部分損壞的離線使用者。實際後果不是本輪重新證明舊 default-branch 的同 ID 覆寫資料損失，而是 intended P0 fix 仍可能把「完整備份」成功降級為不可播放的還原結果，讓使用者誤以為音訊已復原。

現有替代只有保留原備份、不要確認還原，或人工檢查每筆 data URL；這不是可靠的產品流程。

### 分級

- kind：BUG
- severity：P1
- decision_priority：NOW / pre-merge blocker within existing #1
- triage：NEEDS_REVIEW
- auto_implementation：false
- fingerprint：`soundbox-offline|library-backup import|full backup contains present malformed audioDataUrl|value normalized to undefined and staged as metadata-only|presence lost before full-format validation`

這不是新 Issue：#1 的既有驗收已要求完整格式逐筆 decode／validate 音訊 payload，並在寫入前拒絕 invalid base64/data URL。開新單會重複根因與實作所有權。

### 最小有效範圍

先保留「欄位缺席」與「欄位存在但無效」的差異，再做格式驗證：

- 對 `BACKUP_FORMAT_FULL`，在正規化前拒絕存在但非字串、非 `data:`、或不可解碼的 `audioDataUrl`。
- 測試至少覆蓋 malformed prefix 與 present non-string 兩條路徑。
- 驗證拒絕發生在任何 IndexedDB 寫入前，且既有 library 不變。
- 合法 full backup 與合法 metadata backup 仍維持原行為。

非目標：新 registry、ledger、migration framework、資料庫或跨 repo 平台。

## Red Team

- **已有追蹤可否推翻新開單？** 可以；#1 已完整涵蓋根因，所以本輪不開新 Issue。
- **能否只因競品或 Persona 偏好升級？** 不行；本 finding 只依固定 source path 與既有驗收，不使用模擬投票。
- **是否重現舊 P0 覆寫路徑？** 本 PR 的這條新路徑在乾淨裝置產生 0-byte placeholder；未在本輪執行真實 IndexedDB 覆寫。故列 P1 合併前阻擋，不新增 P0 宣稱。
- **是否有更小替代？** 有；只需在正規化前保存 presence 並 fail closed，不需擴大架構。
- **可能是稽核環境問題嗎？** 靜態控制流不依賴本地環境；但瀏覽器／IndexedDB 結果仍待 runtime 證據。
- **是否能從 CI 失敗推論產品錯誤？** 不能。exact-head CI run [36623760412](https://github.com/Reese-max/soundbox-offline/actions/runs/36623760412) 與 Deploy run [36623760249](https://github.com/Reese-max/soundbox-offline/actions/runs/36623760249) 都以零步驟 job 失敗；根因 UNKNOWN，不猜測帳單、額度或 YAML。

## 互斥、去重與寫入決策

- #1 已指派 Reese-max，且 #13 使用活躍分支 `fix/issue-1-restore-integrity`。
- #1 歷史 lock 已有相對應 release，未發現仍有效 lease；但活躍 PR/branch 已明確持有實作所有權。
- 搜尋所有狀態 Issue／PR、default-branch audit 與相關 branch 後，沒有找到本 exact fingerprint 的獨立中央 delta 報告。
- 結果：`SKIPPED_LOCKED_ACTIVE_PR`。不改 #1、不留言、不改 #13 scope、不搶鎖；只把證據寫入中央獨立報告。
- 本任務未啟動 autodev run、GOAL、worker、merge、deploy 或產品程式修改。

## 董事會增量決策

這是模型多視角推演，不是獨立專家共識。

- CEO／CPO：既有 #1 的完整備份承諾若仍可「成功」產生空音訊，先阻擋合併；不新增新功能。
- CTO／Staff Engineer／QA：修正欄位 presence 的驗證順序並補兩個直接回歸案例，是最小根因修正。
- Security／Privacy：沒有新權限或外傳證據；不要把可靠性 bug 升格為安全事故。
- SRE：zero-step Actions 只能阻止 runtime claim，不能當作此 source finding 的根因。
- UX／Support／Accessibility：錯誤訊息必須明確告知完整備份損壞，避免成功狀態誤導；不要求新 UI framework。
- CFO／Growth：不以合成比例、競品功能或假設收益支持優先級。

如果本輪只能做三件事：一、在正規化前拒絕 present-invalid payload；二、增加兩個直接 regression tests；三、取得 exact-head 瀏覽器／IndexedDB 非破壞驗證。暫不做跨裝置同步、雲端備份或新儲存架構。

## 回歸與 CLEAN

- 結論：STILL_OPEN_ON_PR_HEAD / NEEDS_RUNTIME_VERIFICATION
- 因 finding 尚未進 default branch，不能標 VERIFIED_FIXED、REGRESSION 或關閉 #1。
- portfolio：NOT CLEAN。這個 targeted delta 不計固定 A01–J05 完整輪次，也不更新兩輪 CLEAN accounting。
- 外部競品與 50 合成 Persona：本輪沒有相關市場訊號或產品方向變動，不重跑／不改寫既有基線；它們不作本 finding 的分級證據。

## 本輪計數

- 新增 Issue：0
- 更新／重開 Issue：0
- 新研究 Issue：0
- 去重：1（併入既有 #1）
- 縮範圍：1（只修 presence-before-normalization）
- 分級修正：0
- 已驗證修復：0
- SKIPPED_LOCKED：1
- REPORT_WRITE_BLOCKED：0（以實際 PR/commit 回讀為準）
