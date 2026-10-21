# Product Board Delta Audit — 2026-09-30T02:03:37Z

## 結論

狀態：**PARTIAL / PRE-MERGE BLOCKERS / NOT CLEAN**

本輪是自 2026-09-29T23:10:13Z 起的增量輪巡。共確認 8 個可行動的 pre-merge finding：4 個 P1、4 個 P2；另有 1 個被 Red Team 降為 P3 的維護缺口。所有可行動 finding 都已有相同根因或工作流的既有 Issue，且由活躍 PR/branch 持有，因此一律記為 **SKIPPED_LOCKED_ACTIVE_PR**：不搶鎖、不改 Issue scope、不另開重複 Issue。

本輪沒有產品實作、合併、部署、worker/GOAL 啟動或權限/settings 變更。沒有任何 finding 被宣稱已修復；缺少實際 provider、部署或瀏覽器崩潰路徑證據者仍為 **NEEDS_RUNTIME_VERIFICATION**。

## 稽核依據與範圍

- 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- 中央 repo 基準 HEAD：`99eba2458a82a4fb8e70c25c5a454014b568c659`
- 增量 cutoff：`2026-09-29T23:10:13Z`
- Inventory：43 個 Reese-max 自有 repo；42 個未封存、1 個封存（`obsidian-vault`）
- 新增 inventory：`Reese-max/openab-pty`
- default branch 實質產品變動：僅 `openab-pty@9e1464058335bcba73593651837433c11c9e6eb5`
- 全狀態 Issue 增量：cutoff 後未發現新 Issue
- 寫入統計：新 Issue 0、Issue 更新 0、重開 0、產品檔案 0、中央 audit report 1
- 完整 portfolio 輪巡、固定 A01–J05 兩輪 CLEAN、完整 50 persona 與完整競品刷新：**本輪未完成，因此不可宣稱 CLEAN**

## Default branch delta：openab-pty

`openab-pty` 是本輪新增且未封存的產品 repo。README 與 commit `9e1464058335bcba73593651837433c11c9e6eb5` 顯示其為 Rust 遠端 PTY sandbox；該 commit 新增 session-independent `POST /mcp` 與 bearer session key，並包含相關測試。

靜態檢視未建立可達的 P0–P2 缺陷。沒有 exact-HEAD GitHub Actions run；另有被忽略的 socket 測試，因此只能記為 **SOURCE_CONFIRMED / NEEDS_RUNTIME_VERIFICATION**，不因缺少 runtime 證據而硬開 Issue。

## Findings 與既有追蹤

| ID | Repo / existing tracking | Kind / Severity / Triage | Inspected SHA / blob | 證據與影響 | 最小有效修正 | 狀態 |
|---|---|---|---|---|---|---|
| F1 | [ninax-line-hermes Issue #8](https://github.com/Reese-max/ninax-line-hermes/issues/8) / [PR #12](https://github.com/Reese-max/ninax-line-hermes/pull/12) | BUG / **P1** / NEEDS_REVIEW / auto=false | head `af82091d8178caefb1ce37ac885f2b6284a3b42e`; blob `0a8404aa54b7364162d8de36cb52f1b1af6dca71` | [review evidence](https://github.com/Reese-max/ninax-line-hermes/pull/12#discussion_r4140080699)：`retry_key` 是 64 字元 SHA-256 hex，直接送入 `X-Line-Retry-Key`；既有 Issue #8 所記 LINE 規格要求 UUID。正常長回合與 invalid reply-token fallback 的 keyed Push 都可因 400 失敗，且本地會留下不可恢復的 unknown 結果。 | 由既有穩定輸入產生 deterministic UUID，保留冪等語意；不新增 broker/platform。 | **SKIPPED_LOCKED_ACTIVE_PR**；exact-head run `36657220163` 為 zero-step failure，原因 UNKNOWN；NEEDS_RUNTIME_VERIFICATION |
| F2 | [project-doctor-web Issue #19](https://github.com/Reese-max/project-doctor-web/issues/19) / [PR #24](https://github.com/Reese-max/project-doctor-web/pull/24) | BUG / **P1** / NEEDS_REVIEW / auto=false | head `b37f962d926c6069da92cbd3d876f9e90aa7146e`; blob `bb8e532139fd3720ca776d77516445f39853ae50` | [review evidence](https://github.com/Reese-max/project-doctor-web/pull/24#discussion_r4140075947)：送出回合後可在 loading 期間 reset；遲到 response 仍無條件覆寫 interview state、SOAP 與訊息，讓舊個案回到新設定。臨床教學/研究原型可能顯示錯案資料。 | 以 session/generation token 丟棄 stale response；UI 同時停用 reset 可作次要保護，但不能取代狀態失效機制。 | **SKIPPED_LOCKED_ACTIVE_PR**；未見 exact-head Actions run；NEEDS_RUNTIME_VERIFICATION |
| F3 | [ai-novel-workstation Issue #11](https://github.com/Reese-max/ai-novel-workstation/issues/11) / [PR #14](https://github.com/Reese-max/ai-novel-workstation/pull/14) / [PR #15](https://github.com/Reese-max/ai-novel-workstation/pull/15) | BUG / **P1** / NEEDS_REVIEW / auto=false | #14 head `8503a6ec7cac258ebf733fc757d47be6c8e52e04`, blob `2e88bebf…`; #15 head `c5a1bec77af8800df08e674ce6ff3dfeeccd2d9c`, blob `5c462fda…` | [review evidence](https://github.com/Reese-max/ai-novel-workstation/pull/14#discussion_r4140007876)：manuscript hash 檢查只在 `phase.startswith("approve:")` 且目前 approval 是 manuscript 時執行。若 manuscript approval 已完成，之後於 visuals/budget/deploy 停住，再修改章節並 `--continue`，可直接匯出/部署而不重跑品質審查；後開的 PR #15 仍保留此下游 resume 缺口。 | 在所有 approval 後的輸出/部署路徑前驗證已綁定 hash；變更時回到最早必要品質步驟。 | **SKIPPED_LOCKED_ACTIVE_PR**；runs `36655954186` / `36658005621` 為 zero-step failure，原因 UNKNOWN；NEEDS_RUNTIME_VERIFICATION |
| F4 | 同 F3 | BUG / **P2** / NEEDS_REVIEW / auto=false | 同上 | [review evidence](https://github.com/Reese-max/ai-novel-workstation/pull/14#discussion_r4140007880)：fingerprint 未包含會改變品質門檻或 profile 的 `book.json` 欄位；#15 甚至只雜湊 `chapters/*.md`。修改 genre、chapterWordCount 等品質驅動 metadata 仍可能沿用舊核准。 | 將 normalized、真正影響品質判斷的 metadata 納入 fingerprint；不要把所有無關 metadata 或新資料庫納入。 | **SKIPPED_LOCKED_ACTIVE_PR**；與 Issue #11 同根因，未另開單 |
| F5 | [soundbox-offline Issue #1](https://github.com/Reese-max/soundbox-offline/issues/1) / [PR #14](https://github.com/Reese-max/soundbox-offline/pull/14) | BUG / **P1** / NEEDS_REVIEW / auto=false | head `b100ef94d5c0130a458be2b4c94b046c0d47290e`; blob `4e7cdbdcae07909d86f80c61cd0deb9bcab73dd7` | [review evidence](https://github.com/Reese-max/soundbox-offline/pull/14#discussion_r4139962645)：restore 先持久化 localStorage 的 playlists/player state，之後才 await IndexedDB tracks。JS catch 能回滾例外，但 tab refresh/kill/crash 發生在兩個 store 之間時沒有恢復資訊；下次啟動會過濾失效 reference，造成備份還原後資料遺失。 | commit 前寫入 durable restore journal/recovery marker，啟動時完成或回滾；不建立通用 storage framework。 | **SKIPPED_LOCKED_ACTIVE_PR**；CI `36655154450`、Deploy `36655154370` 皆 zero-step failure，原因 UNKNOWN；需隔離式 crash/reload reproduction |
| F6 | [spotify-playlist-organizer-mcp Issue #26](https://github.com/Reese-max/spotify-playlist-organizer-mcp/issues/26) / [PR #53](https://github.com/Reese-max/spotify-playlist-organizer-mcp/pull/53) | BUG / **P2** / NEEDS_REVIEW / auto=false | head `65dbfd76e0e4221292cf144dd1fe5e232296cb80`; UI blob `470d01304458bee574dbb7c54f789a502d2ab955`; save blob `7be2716a93c6e3228ce23ec37d66d50d9d196324` | [review evidence](https://github.com/Reese-max/spotify-playlist-organizer-mcp/pull/53#discussion_r4139943496)：UI 只看 top-level `r.action`，但 canonical YouTube duplicate 狀態位於 `r.youtube.action`；因此專用訊息不可達，可能誤報 Saved 或 exact-source duplicate。 | UI 由 `r.youtube.action` / explicit duplicate kind 選擇訊息，並補一個 presentation contract 測試。 | **SKIPPED_LOCKED_ACTIVE_PR**；exact-head CI `36654876736` 成功且有實際 steps，但未覆蓋此 UI 分支 |
| F7 | [92-duty-scheduler Issue #13](https://github.com/Reese-max/92-duty-scheduler/issues/13) / [PR #45](https://github.com/Reese-max/92-duty-scheduler/pull/45) | VALIDATION_GAP / **P2** / NEEDS_REVIEW / auto=false | head `f12cbe87cb1ce840322cd96e119433797353a323`; blob `73cff760d59497563c3bd91aefe4e8d478bd2cd0` | [review evidence](https://github.com/Reese-max/92-duty-scheduler/pull/45#discussion_r4139857154)：deploy smoke 只確認 `configured` 是 boolean，連 `false` 也通過；未綁定 `SCHEDULE_KV` 的部署可被判成功。 | 要求 `configured === true`，並驗證最小、安全、非破壞的讀取能力。 | **SKIPPED_LOCKED_ACTIVE_PR**；run `36653388332` zero-step failure，deploy skipped；不推測 CI 共因 |
| F8 | 同 F7 | VALIDATION_GAP / **P2** / NEEDS_REVIEW / auto=false | 同上 | [review evidence](https://github.com/Reese-max/92-duty-scheduler/pull/45#discussion_r4139857166)：unauthenticated `/api/backup` 回 401/403 被當成功；`ADMIN_TOKEN` 缺失也會給相同結果，所以所有 authenticated admin write 都失效時仍可通過 smoke。 | 以既有 secret 執行正向、只讀或可安全回復的 authenticated probe，或檢查可證明設定可用的 config receipt。 | **SKIPPED_LOCKED_ACTIVE_PR**；目前只證明 gate 可 false-positive，未宣稱 production outage |

## 去重與鎖

- 所有 F1–F8 在寫入前均核對既有 open Issue 與活躍 PR/branch；活躍實作者已持有工作範圍，因此未對目標 Issue 留鎖 marker、改 scope、改 severity 或追加重複留言。
- AI novel F3/F4 與既有中央 [external-radar PR #65](https://github.com/Reese-max/autodev-ng/pull/65) 的大方向重疊；本輪只記錄兩個 partial-fix failure mode，不新建 Issue。
- soundbox PR #14 另仍有 [malformed full-backup audioDataUrl review](https://github.com/Reese-max/soundbox-offline/pull/14#discussion_r4139962650)。該 fingerprint 已由中央 [PR #106](https://github.com/Reese-max/autodev-ng/pull/106) 記錄，本輪不重複通知；F5 的 cross-store crash window 是不同根因。
- F7/F8 與中央 [availability radar PR #91](https://github.com/Reese-max/autodev-ng/pull/91) 不同：前者是兩個 smoke false-positive path，不把名稱不同的 gate 合併成抽象平台工程。
- 多 repo 同時出現 `steps=[]` 的 Actions failure；目前沒有足以證明 billing、quota、runner 或 YAML 是共因的證據，維持 **UNKNOWN**，不另建 shared-root Issue。

## Red Team

### 被保留的反證與縮範圍

1. **沒有把 review bot 標籤當結論。** 每個 finding 都回到 PR head 原始碼、既有 Issue 與可達流程重新分級。
2. **herdr-skills 降級。** [PR #14 review](https://github.com/Reese-max/herdr-skills/pull/14#discussion_r4140023896) 指出文件要求使用者解析 skill directory 並指定 `SKILL_DIR`，但 runnable PowerShell 區塊沒有初始化命令；fresh shell 可能展開為空。既有 [Issue #10](https://github.com/Reese-max/herdr-skills/issues/10) 明確定為 P3 compatibility。這是文件可執行性維護缺口，不足以證明核心產品完成率顯著受損，因此本輪記為 **MAINTENANCE / P3 / NEEDS_REVIEW**，不列入 8 個 actionable P1/P2。
3. **soundbox 未宣稱事故。** F5 的可達 crash window 由控制流程成立，但沒有實際 kill/reload reproduction；P1 來自備份還原核心任務與資料完整性風險，而非虛構 incident。
4. **CI failure 不等於產品 failure。** spotify exact-head CI 有實際 steps 且成功；其他 zero-step failures 只阻止驗證，不能證明各 finding 的產品路徑已壞或共因已知。
5. **openab-pty 不因新 repo 而開單。** 缺 exact-head hosted run 只阻止 CLEAN，不足以把未重現猜想升成 Issue。

## 產品董事會（模型多視角推演，不是獨立專家共識）

- **CEO：如果只做三件事**
  1. 在合併前阻擋 ninax retry-key 格式與 AI novel stale-approval 兩條會讓核心任務產生錯誤結果的路徑。
  2. 在合併前補 soundbox durable restore recovery，保護使用者備份資料。
  3. 關閉 project-doctor stale-response race，再處理 P2 呈現/部署驗證缺口。
  不做：不建立跨 repo ledger、通用狀態機、broker 或全新平台；不把競品功能清單當需求。
- **CPO / UX / Support：** 優先修正會對使用者顯示錯個案、錯誤儲存結果、或「部署成功」假象的路徑；spotify 的文字誤導有明確完成體驗影響，但低於資料/發布完整性。
- **CTO / Staff Engineer：** 所有問題都有局部修正；沒有證據證明需要新 service、DB 或共用框架。AI novel 應收斂成「下游 resume 前驗證 bound hash」與「納入品質驅動 metadata」。
- **Security / Privacy：** project-doctor 舊個案回流屬資料邊界錯配風險；本輪沒有證據顯示外洩到其他帳號或 production，因此不升成 P0。
- **QA / SRE：** P1 PR 在合併前需要相同原情境與鄰近路徑測試；zero-step workflow 必須分開處理，不能以綠/紅 badge 代替 runtime 證據。
- **CFO / Growth：** 無真人轉換、收入或市場規模證據；不使用合成偏好或競品行銷聲明做 ROI。
- **Accessibility：** 本輪沒有足以建立新的 accessibility P1/P2；維持 evidence backlog。

## 競品、50 合成 Persona 與方向差異

這是針對 cutoff 後 PR 的 pre-merge delta，不是新的完整產品研究輪。沒有 default-branch 產品變更足以改寫既有競品矩陣、MUST MATCH / SHOULD BE BETTER / DIFFERENTIATOR / DO NOT COPY 或 50-persona 基線；因此本輪不重跑、不製造新的模擬票數。

既有 50 persona（約 60% 回歸、40% 探索）與固定 A01–J05 audit 是不同資產；本輪沒有用董事會票數或 reviewer 次數替代它們。受影響角色以可達流程核對：LINE bot 維運者、長篇出版操作者、離線音訊備份使用者、臨床教學者、playlist organizer 使用者與 duty scheduler 部署維運者。沒有足夠證據宣稱其發生率或真人偏好份額。

## NOW / NEXT / LATER / DON'T

- **NOW（pre-merge）**：F1、F2、F3、F5；各自維持既有 Issue/PR 所有權，修正後在相同 head 的隔離環境重跑原情境。
- **NEXT**：F4、F6、F7、F8；加入最小 contract/smoke coverage，避免把單一成功 job 當完整覆蓋。
- **LATER / evidence backlog**：herdr-skills P3 文件初始化、openab-pty exact-head runtime、zero-step Actions 的真正共因調查。
- **DON'T**：不新建跨 repo framework、狀態平台、事件 broker、通用 ledger；不因沒有 runtime 就虛構 P0/P1；不在活躍 PR 上搶改 scope。

## 回歸與完成條件

本輪 findings 都在尚未合併的 PR head，沒有「修正已進 default branch」可驗證，因此回歸狀態均為 **CANNOT_VERIFY / NEEDS_RUNTIME_VERIFICATION**。後續只有在修正進 default branch 後，於新的 HEAD 重跑相同觸發條件、成功條件與鄰近路徑，才可標記 VERIFIED_FIXED / PARTIALLY_FIXED / STILL_REPRODUCIBLE / REGRESSION。

本輪不是完整 portfolio 合格輪次，不能計入兩輪 CLEAN；也沒有關閉任何 Issue、合併任何 PR 或把 label 變更冒充修復。
