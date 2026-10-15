# Product Board 增量稽核：複習狀態與檔案交接

- 稽核時間：2026-09-30T05:00:19Z
- 增量起點：2026-09-30T02:11:50Z
- 規則文件：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- 中央基準 HEAD：`99eba2458a82a4fb8e70c25c5a454014b568c659`
- 結果：**PARTIAL / PRE-MERGE REVIEW；非 portfolio CLEAN**

## Discovery 與輪巡

- 完整 inventory：44 個 Reese-max 自有 repository；43 個未封存，1 個封存（`obsidian-vault`）。封存庫僅記錄，不因無產品表面開單。
- 增量區間內未找到自有 repo 的 default-branch commit，也未找到更新中的 Issue；因此沒有可宣告的已合併修正、回歸或產品表面變更。
- 增量區間共 28 個更新中的 open PR；排除上一輪中央稽核 PR #107 後，檢查 27 個產品 PR 的差異、相關 Issue、review threads 與可得 CI/部署證據。
- 本輪收斂 2 個新、可行動、但都由活躍 PR 持有範圍的 P2 finding。未建立新 Issue、未修改既有 Issue/PR、未啟動 worker、未改產品程式。
- 外部競品、50 合成 Persona 與完整董事會未重新跑全量：default branch 與產品方向皆未變，本輪兩項是既有核定流程內的契約矛盾；重跑市場模擬不會增加分級證據。固定 persona 基線不替代 CLEAN 輪次，亦未遺失；此報告不宣稱完整 portfolio 輪巡或 CLEAN。

## Finding 1 — 重新作答仍無法清除 dataset_changed

- Repository / tracking：[police-exam-archive Issue #60](https://github.com/Reese-max/police-exam-archive/issues/60)
- 活躍實作：[PR #81](https://github.com/Reese-max/police-exam-archive/pull/81)
- inspected PR HEAD：`8339e958a1e74ffd02a0333d7beb2bce7e7e9a79`
- kind：`BUG`
- severity：`P2`
- decision_priority：`NOW / pre-merge blocker`
- triage：`NEEDS_REVIEW`
- auto_implementation：`false`
- 信心：`CONFIRMED / SOURCE_CONFIRMED`
- runtime：`NEEDS_RUNTIME_VERIFICATION`
- fingerprint：`police-exam-archive+review-queue+current-answer-after-dataset-drift+dataset_changed-never-clears+stale-derived-from-any-historical-incompatible-attempt`

### 問題與影響

`考古題網站/js/review-queue.js`（blob `a03d5b8de634f5cd9ce93a6bc9ed01da9ed80466`）以：

`stale = all.length > compatible.length`

判定狀態。只要歷史上存在任何舊 dataset/source-hash 的 attempt，即使使用者已在目前版本重新作答、產生 compatible attempt，`all` 仍大於 `compatible`，狀態永久保持 `STALE`。結果是：

1. `dataset_changed` 會反覆佔據今日複習佇列；
2. 目前版本重新作答不能完成重新驗證；
3. compatible 的錯題／到期狀態會持續被 stale 分支重設或壓過。

受影響者是資料更新後繼續使用本機學習紀錄的考生；既有替代只有清除全部學習資料，會一併犧牲仍有效的歷史紀錄。

### 測試與反證

- `tests/review_queue_contract.cjs` blob `9d10fbb19c4081b9d4eeed21c0ff4e511393c585` 只驗證題目內容改變後會進入 `STALE`；沒有再記錄目前版本作答並驗證狀態回到 `CURRENT`。
- Exact-head Actions run [36670465515](https://github.com/Reese-max/police-exam-archive/actions/runs/36670465515) 的 Python 3.10/3.11/3.12 jobs 與 run [36670465652](https://github.com/Reese-max/police-exam-archive/actions/runs/36670465652) 的 quality-check 皆成功；綠燈不覆蓋上述生命週期。
- Red Team：保留舊 attempt 本身是正確需求，問題不是「有歷史資料」，而是把「存在任何舊資料」等同「尚未在新版本重驗」。不需要新 ledger、資料庫或 FSRS。

### 最小有效修正與驗收

在現有 ledger 內只調整 stale lineage 判定：目前 source/dataset 已有有效作答後應解除 stale，同時保留歷史 attempts。

1. 舊 source-hash attempt 單獨存在時仍為 `STALE/dataset_changed`。
2. 同題新增目前 source-hash/dataset attempt 後變為 `CURRENT`。
3. 新 attempt 的 wrong/due/marked 狀態正常參與排序。
4. 舊 attempt 仍保留在 export/import，不以清資料掩蓋。
5. 回歸未變更題目與再次變更題目的路徑。

## Finding 2 — 不帶 job_id 可繞過權威分段綁定

- Repository / tracking：[video-timeline-pipeline Issue #23](https://github.com/Reese-max/video-timeline-pipeline/issues/23)
- 活躍實作：[PR #30](https://github.com/Reese-max/video-timeline-pipeline/pull/30)
- inspected PR HEAD：`1568dadd26283df23d667289d364b8b00a22fa4c`
- kind：`VALIDATION_GAP`
- severity：`P2`
- decision_priority：`NOW / pre-merge blocker`
- triage：`NEEDS_REVIEW`
- auto_implementation：`false`
- 信心：`CONFIRMED / SOURCE_CONFIRMED`
- runtime：`NEEDS_RUNTIME_VERIFICATION`
- fingerprint：`video-timeline-pipeline+ingest_video_segments+missing-job_id+files_received-with-unverified-time-ranges+job-binding-optional`

### 問題與影響

`mcp_server.py`（blob `8643c048e67b39d4361691034f1c9f10984fa0d4`）把 `job_id` 宣告為 optional，且只在非 `None` 時讀 manifest 與執行 `bind_handoff_segments`。未傳 `job_id` 時，任意 file reference 仍可回：

- `status=files_received`
- `job_id=None`
- `segments_expected=None`

這條可到達成功路徑沒有把 `segment_index/start_seconds/end_seconds` 綁到 server manifest，卻使用與已驗證交接相同的成功狀態。模型可能把呼叫者提供、缺失或錯誤的時間範圍誤當權威資料，直接破壞 Issue #23 與 PR 標題所承諾的「verified per-segment time ranges」。

### 測試與反證

- `tests/test_mcp_server.py` blob `97a5245e313ea7fab0d7a63ecf86a7d5f4c4982e` 的 `test_file_handoff_protocol_returns_structured_content` 明確只傳 `files`、不傳 `job_id`，並期待 `files_received`；這不是未覆蓋的偶發分支，而是被測試固定下來的繞過。
- PR 提供作者回報的 detached replay 與測試數，但 GitHub Actions 沒有可取得的 exact-head run；未宣告 host/provider runtime 已驗證。
- Red Team：若產品確實需要接受無 job 的一般檔案，仍不必建立新服務或 attachment framework；可回不同的 `unverified_files_received` 狀態，且不得授權逐段時間摘要。

### 最小有效修正與驗收

優先要求成功的「verified」交接必須帶非空 `job_id` 且每個檔案可綁到 ready manifest；若保留無 job 模式，必須使用不能授權逐段摘要的不同狀態。

1. 缺失與空白 `job_id` 均不能回 verified `files_received`。
2. 每個成功檔案都從 manifest 取得 index 與時間範圍。
3. 未綁定、重複、時間宣稱不一致維持 fail closed。
4. 只有完整綁定才回 segments expected/received 並允許逐段摘要。
5. 保留 host 不支援 file handoff 的明確錯誤，不回退 metadata-only 摘要。

## 互斥、去重與寫入

- 兩個 fingerprint 在目標 repo 的所有狀態搜尋與中央 default-branch audit 搜尋均未找到獨立重複追蹤。
- 兩項相關 Issue 均已有活躍 PR，且本輪重新讀取 review threads（皆為空）；依互斥規則標記 `SKIPPED_LOCKED_ACTIVE_PR`。
- 未取得 Issue lock、未追加 Issue/PR comment，避免搶改 scope。必要證據集中於本報告。
- 寫入統計：新增 Issue 0；更新/reopen Issue 0；PR/Issue comment 0；新中央 audit 報告 1；產品程式/CI/config 變更 0。

## 董事會分歧與決策備忘錄

這是模型多視角推演，不是獨立專家共識。

- CEO（只做三件事）：先讓 stale 可被目前版本作答清除；再封住無 job 的 verified-success；第三是為兩條負向生命週期補測試。不做新排程引擎、共用 ledger 平台或通用附件框架。
- CPO / UX / Support：兩項都讓使用者看到「完成」或「已驗證」但實際狀態不可收斂，優先於新增功能。
- CTO / Staff：根因都在現有布林／optional 分支，可用局部契約修正；反對擴張架構。
- QA：現有綠燈分別漏掉狀態恢復，或直接固定不安全契約，需負向與相鄰路徑。
- Security / Privacy：影片 finding 是證據完整性而非權限 P1；沒有資料外洩或權限突破因果鏈，不升級。
- CFO / Growth：無真人轉換或營收證據，不做 ROI 數字；避免合併後返工是唯一可支持的成本論述。
- Accessibility / SRE：目前未建立無障礙或服務可用性回歸；不借題擴單。

### NOW / NEXT / LATER / DON'T

- **NOW**：兩項在各自 PR 合併前縮成最小契約修正與直接回歸。
- **NEXT**：修正進 default branch 後，在相同情境與相鄰路徑重跑；未有 host/runtime 證據前保持 `NEEDS_RUNTIME_VERIFICATION`。
- **LATER**：只有真實使用資料支持時才研究更進階排程或通用 file ingestion。
- **DON'T**：不把競品差異、模擬 persona 票數、綠燈總數或 PR 存在當成功證據；不建立新平台。
- Portfolio 建議：兩 repo 皆 **MAINTAIN + SIMPLIFY**；無 INVEST/REPOSITION/MERGE/PAUSE/ARCHIVE 操作授權。

## 回歸狀態與限制

- 兩項都尚未進 default branch，故狀態是 `CANNOT_VERIFY / PRE-MERGE`，不是 `REGRESSION` 或 `STILL_REPRODUCIBLE`。
- Finding 1 有 exact-head CI，但缺「新版本重新作答後清除 stale」執行證據。
- Finding 2 為靜態與測試契約確認，缺 GitHub exact-head run、真實 ChatGPT host file handoff 與 provider runtime。
- 沒有 default-branch 產品變更，故本輪不宣告任何 `VERIFIED_FIXED`。
- 未完成全量固定 A01–J05 的兩個完整合格輪次，portfolio 不得標記 CLEAN。
