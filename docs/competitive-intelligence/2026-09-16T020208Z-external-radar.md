# 外部競品／新品／工作流靈感雷達 — 2026-09-16T02:02:08Z

## Scope / rules / evidence boundary

- Owner scope：只處理 `Reese-max` 自有 repository；未修改第三方 repository。
- Issue Quality：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- Quality-rule blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh owner pagination：**42 owned repositories；39 unarchived**。archived：`gemini-deidentifier`、`openab`、`obsidian-vault`。
- Working classification 沿用上一輪：36 product-like + 3 support/compatibility-only；本輪沒有足夠新證據重分類其他 repo。
- 上一輪公平輪巡游標：`spotify-playlist-organizer-mcp`；本輪深讀該產品。
- `spotify-playlist-organizer-mcp` default branch：`main`；本輪觀察到 main HEAD `9b99f580acaf1e0b6631aa911b9222c262ddc1ec`，該 commit 為 audit/docs；最近已核對的產品 baseline 為 `a0bad36b6ab80185f01f0632f25c8b27ef09dbb8`。
- 另有非常新的 open PR #20（head `7a59abd1297982a85f0773537b952662f2561fdc`），正在實作 Personal Music Library、unified save、sync、HTTP facade、batch import、backup/restore、playlist admin 等大批既有 Issue。此 radar **沒有修改 PR #20、其 active scope、branch 或任何被其覆蓋的 Issue**。
- 本輪只寫中央研究報告；**0 新 Issue、0 既有 Issue 更新**。
- 沒有修改產品 source、CI/config、secret、權限/settings；沒有建立實作 branch、merge、deploy、worker、GOAL、付費試用或正式資料寫入。
- 本輪沒有執行真實 YouTube/TikTok provider mutation，也沒有宣告 portfolio CLEAN。

## Product direction re-read — Music Playlist Organizer MCP

現行產品方向仍是 **INVEST / SIMPLIFY，YouTube-first、local-first、可檢查、可恢復**。

核心使用者／北極星：隱私敏感的個人或小型技術團隊，在找到一首歌後，以 exact candidate / video ID 為基礎，經 preview、分類、去重後，把歌曲安全加入 YouTube／YouTube Music playlist，且 provider write 不確定時必須回 truthful partial state，而不是猜成功或盲重試。

現行 repo 已有的重要邊界：

- 自由文字先 `youtube_identify_track`，使用者選定 exact `videoId` 後才 `youtube_save_track`；
- 精確 YouTube / YouTube Music URL 可走快速路徑；
- write timeout / network loss 使用 `UNKNOWN_AFTER_WRITE` / `PARTIAL_PLAYLIST_CREATED` 等 typed receipt；
- Spotify 為 optional legacy provider，不是目前產品擴張方向；
- 最新 Product Board 明確拒絕在 local YouTube mutation contract 尚未穩定前擴成 hosted transfer SaaS、社交 discovery、AI recommendations、native app、subscriptions 或更多 provider。

本輪重新核對 existing scopes：

- #14：YouTube ↔ Local Library sync / reconciliation；
- #16：YouTube links / playlists batch import；
- #17：portable Library export / backup / restore；
- #18：similar-song recommendation，P3 research、明確延後；
- #26：mobile/web collection UI，現行第一步仍是「貼上歌名或 YouTube / YouTube Music 連結」；
- #27：stdio MCP E2E validation。

因此本輪外部訊號不能再被包裝成另一組 import/sync/mobile/AI 功能單。

## Executive decision

**0 new Issues；0 existing Issues modified。**

本輪最有價值的新外部訊號是「**capture-at-discovery**」：YouTube Music 已把 TikTok 中正在看的歌曲直接變成 YouTube Music playlist save；多個相鄰工具則把 iOS/Android share sheet 或 desktop clipboard 當成音樂連結的即時入口。這些產品共同減少的是：

`看到歌曲 → 記住／複製 → 切到另一個 app → 貼上／重新搜尋 → 再確認`。

但這個訊號目前**還不通過開單門檻**：

1. Reese-max 的 repo 已有可行替代：copy/paste exact YouTube/YT Music link → 現有 `save_music` / #26 UI；
2. 沒有真人／owner workflow evidence 證明「paste」現在是 top friction；
3. PR #20 正活躍地改造 HTTP/library/sync core，這一輪不應搶 scope；
4. 若未來要驗證，也應先以一個薄 capture adapter 重用 existing save core，不先建 native app、TikTok scraper、cross-service resolver 或 background clipboard service。

因此本輪把它保留為 **ADJACENT IDEA / NEEDS_USER_WORKFLOW_EVIDENCE**，而不是新 Feature Issue。

另一個重要策略訊號是 SongShift 在 2026-07-18 把 sharing/discovery 擴張到獨立的 SongMix，而讓 SongShift 留在 transfer/sync。這反而支持目前 owner 的產品邊界：**收藏／整理／同步核心與社交 discovery 不需要塞在同一產品。**

## External Signals

### A. Direct competitor / platform-native change — YouTube Music 把 TikTok discovery 直接接成 save

**CONFIRMED — current first-party capability；頁面未暴露可靠 launch date；checked 2026-09-16 UTC.**

Source:
- https://support.google.com/youtubemusic/answer/16112512?hl=en

YouTube Music 官方目前提供：在 TikTok 影片點歌曲名稱 → `Add to music app` → `Add to YouTube Music` → 第一次授權後，歌曲自動存入 `TikTok songs` playlist；之後可從確認通知改到既有或新 playlist。官方亦明示 TikTok / YouTube 僅分享完成正確歌曲保存所需資訊。

**JTBD：** 使用者在「剛發現一首歌」的當下就收藏，不必先離開 discovery surface 再重建意圖。

**減少人工步驟：** 不必 copy title/link、切 app、重新搜尋同一首歌，再判斷哪個結果是原本看到的版本。

**Onboarding/distribution：** 授權一次後，後續 save 直接嵌在既有 TikTok song-detail workflow，而不是要求先打開 YouTube Music 建資料結構。

**Transferable principle：** capture surface 可以位在 discovery moment；但 effect authority 仍應與後續 playlist organization 分開。

**Do not copy：** 不要為了模仿 TikTok 整合去爬 TikTok、逆向 sound metadata、建立新的 provider credential path，或把外部平台頁面內容當成可無限制給 AI 使用的資料。

### B. Adjacent workflow — OS share sheet / clipboard 把「找到連結」變成即時 handoff

#### PlayOver

**CONFIRMED current vendor capability；checked 2026-09-16 UTC.**

Source:
- https://playover.app/

PlayOver 目前把 capture 分散在各 OS 原生 surface：iOS Share Sheet、Android share menu / link interception、Windows clipboard monitoring、Mac menu-bar clipboard flow。核心流程是「copy/share music link → 轉換 → 在偏好平台開啟」。官方直接以「不用 copy-paste / search」作產品價值主張；這是 vendor capability / positioning，不是獨立成效實驗。

**可移植：** share/copy 可以只是 thin ingress，不必成為新的音樂資料庫或推薦引擎。

**不該照抄：** always-on clipboard monitoring 增加 privacy、background-process、false-positive 與權限負擔；Reese-max 目前沒有證據需要它。

#### UniTune

**CONFIRMED current vendor capability；checked 2026-09-16 UTC.**

Source:
- https://unitune.art/

UniTune 強調 no account / no tracking / local-first，並從 Spotify、Tidal、Apple Music 等 app 的系統 share sheet 直接接入，主張在同一 share flow 中完成轉換，不要求手動 copy/paste/app switching。

**可移植：** 「privacy-first + share target」與本 repo 的 local-first 方向相容；若日後驗證價值，最小版本應只是把 exact URL/text payload 導入既有 `save_music`，而不是引入另一套 identity/auth/business logic。

#### JamShare

**CONFIRMED current vendor capability；checked 2026-09-16 UTC.**

Source:
- https://jamshare.io/

JamShare 也把「Share as usual → Tap JamShare → Open anywhere」作主要 mobile workflow，並保留 share history / default platform。此訊號進一步支持 share sheet 是成熟 capture pattern，但 JamShare 的 universal-link/social-sharing thesis 與 Reese-max 的 personal organizer thesis 不相同。

### A2. Competitor strategy — SongShift 把 sharing/discovery 拆成獨立 SongMix

**CONFIRMED — SongShift first-party announcement published 2026-07-18；checked 2026-09-16 UTC.**

Source:
- https://www.songshift.com/blog/introducing-songmix

SongShift 團隊明確說 SongShift 繼續專注 transfer / synchronization，而 sharing、profiles、discovery 讓新 app SongMix 獨立成長。

**策略訊號：** 當 discovery/social job 與 transfer/organize job 開始需要不同產品 surface 時，拆開比把所有功能堆進同一 app 更合理。

**對本 repo：** 支持現行 owner 的 `DO NOT COPY social discovery`，也降低 #18 recommendation 被誤升級成近期核心的理由。

### C. Existing technical/product pattern strengthened — transfer/sync history ≠ backup

**CONFIRMED — Soundiiz first-party support updated 2026-08-22 to 2026-09-01；checked 2026-09-16 UTC.**

Sources:
- https://support.soundiiz.com/hc/en-us/articles/360010006193-How-Soundiiz-Playlist-Sync-Works-Direction-Add-vs-Replace-and-Frequency
- https://support.soundiiz.com/hc/en-us/articles/38130467755794-Can-I-Recover-Old-Transfer-Batch-or-Sync-Results
- https://support.soundiiz.com/hc/en-us/articles/360009511174-Can-Soundiiz-Recover-Deleted-or-Overwritten-Playlists-and-Favorites
- https://support.soundiiz.com/hc/en-us/articles/360010097413-How-to-Use-Soundiiz-to-Transfer-Playlists-and-Favorites

Soundiiz 現行 Sync 明確區分 source/destination、一方向與 Add vs Replace；結果明細有保留期限，而且官方明示 history 是報告，不是可 restore 的 backup。

**對本 repo：** 這是 #14 / #16 / #17 已有方向的增量證據，不是新 fingerprint。PR #20 正在實作這些 scope，因此標為 `SKIPPED_LOCKED / DEDUPE`，沒有留言或搶改驗收。

## New Releases / capability changes

| 日期 / 查閱 | 產品 | 變化 | 對 Reese-max 的意義 |
|---|---|---|---|
| current；checked 2026-09-16 | YouTube Music × TikTok | discovery 當下可直接 save 到 `TikTok songs`，授權一次後持續使用 | 高價值 capture-at-discovery pattern；目前只列研究候選 |
| 2026-07-18 | SongShift / SongMix | sharing/discovery 從 transfer/sync 核心拆成獨立 app | 支持不要把 social discovery 塞進 organizer core |
| 2026-08-22~09-01 | Soundiiz support model | 更清楚區分 Add/Replace、result-history retention、history 非 backup | 與 #14/#16/#17 同 fingerprint；不重開 |
| current；checked 2026-09-16 | PlayOver | iOS share sheet、Android share/interception、desktop clipboard capture | share/copy 可是薄 ingress，不必先做完整 native app |
| current；checked 2026-09-16 | UniTune | privacy-first local share-sheet conversion | local-first capture pattern 與現行方向相容，但需求尚未證實 |

## Community Pain / evidence gap

本輪沒有保留足以改變決策的 Reddit/HN 個案。搜尋到的社群貼文無法提供「Reese-max 使用者現在因 copy/paste 放棄收藏」的發生率或因果證據，因此不以 anecdote 補成需求。

**Evidence gap：** 缺少真實 owner / beta workflow observation：實際歌曲發現來源是 TikTok、YouTube、YouTube Music、朋友傳連結還是文字搜尋？有多少次因為必須 copy/paste 而中斷？在 #26 介面完成後，paste 是否仍是主要摩擦？這些未知足以阻止新 Issue，不足以宣稱產品缺陷。

## Repository evidence / coordination

### Current main

`main@9b99f580acaf1e0b6631aa911b9222c262ddc1ec` 的最新變更是 audit/docs；README 的 current public contract 仍是：

- 傳 song name 或 YouTube / YouTube Music link；
- free text 先 identify，再由使用者選 exact `videoId`；
- exact URL 可直接進 save；
- server 為 stdio MCP；手機頁面若要直接操作，需受保護 HTTP/session layer。

### Active implementation

Open PR #20（`feat/issue-9-library`，head `7a59abd1297982a85f0773537b952662f2561fdc`）正在一次處理 #9–#17、#19 的核心 library / sync / HTTP / import / backup / admin scope。PR 描述稱 122 tests 及 CI 已通過，但本 radar 沒有重跑，也不把 PR 文字冒充正式 default-branch runtime verification。

因為 #20 活躍：

- #14 sync / #16 batch import / #17 backup：`SKIPPED_LOCKED / DEDUPE`；
- #15 HTTP transport：不追加 share-target scope；
- #26 mobile UI：沒有重寫成「必須 native share extension」；
- #18 recommendation：沒有因 TikTok/SongMix discovery 而升級。

### Duplicate search

本輪重新搜尋 open / closed Issues 與 all-state PR，沒有找到 `share sheet` / `clipboard capture` / `TikTok capture` 的相同 fingerprint；但「沒有 duplicate」不等於應立案，四道 gate 仍未通過使用者價值／優先級證據。

## Opportunity Map — spotify-playlist-organizer-mcp

### MUST MATCH

- 使用者明確選定 exact track / video identity 才進 effectful save；不能因 share ingress 便利就降低 selected-video safety。
- 每個 provider write 保持 preview/apply、bounded request、no blind retry、truthful partial receipt。
- Local Library / user tags / identity decisions 與 provider state 分開。
- External discovery payload 只當 input/provenance，不把第三方內容權限擴張成模型可任意使用。

### SHOULD BE BETTER

- 在核心穩定後，驗證能否把 `copy/share exact YouTube/YT Music link → open organizer → paste` 收斂成單一 share handoff。
- capture 完成後仍顯示 exact candidate、destination、duplicate state 與 preview；便利不能跳過 review。
- 如果 share payload 本身就是 exact YouTube URL，優先重用既有快速路徑，不再做 search / cross-service matching。

### DIFFERENTIATOR

- local-first Personal Music Library + exact source identity + transparent reconciliation；而不是「支援最多 streaming providers」。
- capture surface 可以很薄，但後面的 canonicalization / classification / user metadata / sync receipt 都由同一 core 處理。
- provider write 不確定時承認 unknown，而不是因 mobile one-tap 體驗把不確定性藏掉。

### ADJACENT IDEA

**Capture-at-discovery adapter**：若日後真人 workflow 證明 paste 是主要摩擦，先做一個極薄入口，把 OS share payload（優先 exact YouTube/YT Music URL）導入 existing `save_music` / protected local HTTP facade。這是 adapter 候選，不是新 platform。

### DO NOT COPY

- 不做 TikTok scraper / unofficial sound resolver。
- 不做 always-on clipboard watcher，除非未來有明確 user evidence 與 privacy review。
- 不把 SongMix 式社交 profiles/feed/discovery 搬進 organizer core。
- 不因 Soundiiz 支援 47 個服務就新增 provider matrix。
- 不把 #18 recommendation 變成 auto-save / autonomous playlist mutation。
- 不在 #20 active PR 中臨時塞 share extension / native-app work。

## Four-gate calibration — capture-at-discovery candidate

### 1. Problem / value

**Target user：** 使用 local-first organizer 的 owner／技術型個人使用者。

**可觀察摩擦：** current README 與 #26 都從「提供／貼上 song name or URL」開始；相較 YouTube Music TikTok save 與 share-sheet 工具，發現歌曲到輸入 organizer 之間仍可能有 copy/paste/app-switch handoff。

**Repo evidence：** exact URL already works，意味著如果 capture surface 能交付 URL，後端 core 不需要新 identity system。

**Counterevidence / existing alternative：** copy/paste 本身已可完成任務，且沒有真人 evidence 證明這一步高頻失敗。#26 也可能已把實際 friction 降到足夠低。

**不做後果：** UNKNOWN；目前只能說多一個手動 handoff，不能推論 adoption / retention / save rate。

**Gate result：NEEDS_EVIDENCE；不開 Issue。**

### 2. Priority

若未來進入正式研究，建議初始 metadata 只能是：

```yaml
issue_quality_version: 2
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: MEDIUM_OR_LOWER_UNTIL_USER_EVIDENCE
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

外部產品有 share sheet 不構成 P1/P2。沒有真實 workflow frequency、drop-off 或 task-failure evidence。

### 3. Minimum solution order

依序比較：

1. **不改**：沿用 paste/exact-link workflow；
2. **文件／OS shortcut**：若使用者可用現有 share/copy 操作直接開 #26／local URL，先用最小指引；
3. **重用既有 HTTP facade**：只建立 thin share-target / intent adapter，payload 交給現有 `save_music`；
4. 僅當 exact-link 不足且有真實來源需求時，才研究 source-specific resolver。

不要從 native app、background service、cross-service resolver database、event bus 或 social graph 起步。

### 4. Research / implementation separation

未來只有在 #20／#26 基線穩定、且 owner workflow 顯示 paste 是實際摩擦後，才值得用一個 bounded experiment 回答：

- 一個支援的 mobile OS；
- 2–3 種已支援 exact link fixture（YouTube / YouTube Music）；
- share payload → existing preview → explicit apply；
- 比較 manual steps、identity correctness、failure/recovery；
- 無 provider secret 新增、無 background monitoring。

**BUILD：** thin adapter 確實消除 handoff，且完全重用 existing core / auth / receipt。

**NARROW：** 只對 exact YouTube/YT Music share 有價值，就只支援這一層。

**REJECT：** #26 paste flow 已足夠、OS payload 不穩定、或 share integration 帶來的權限/維護高於實際價值。

即使 BUILD，也只支持下一個最小產品決策，不自動批准 native app 或 broader ingestion。

## Cross-portfolio ideas

### Capture surface ≠ domain logic

`OS share / clipboard / browser action → thin ingress → existing validated core` 是可重用的產品原則，但本輪沒有足夠證據建立跨 portfolio framework 或共用 service。

特別是 `google-maps-personal-mcp` 先前也觀察到 share-sheet onboarding pattern；兩個 domain 都可以先保留「capture adapter should stay thin」原則，而不是共建一個通用 ingestion platform。

## Rejected / deferred ideas

1. **現在建立 Share Sheet Feature Issue — DEFER / NEEDS_EVIDENCE。** 外部模式清楚，但 Reese-max 真實痛點未證實；#20 正活躍。
2. **把 share extension 塞進 #26 — REJECT for this round。** 會改動現有 mobile UI scope，且沒有新使用者證據授權。
3. **TikTok direct integration / scraping — REJECT。** 官方 YouTube Music 可做不代表 Reese-max 有相同資料／授權邊界。
4. **Always-on clipboard watcher — REJECT as first move。** privacy / background / false-positive 成本太高，薄 share target 更小。
5. **擴 provider matrix — REJECT by current direction。** Soundiiz/PlayOver 的 breadth 是其產品 thesis，不是本 repo 的 KPI。
6. **升級 #18 recommendation — REJECT / no new need evidence。** SongMix 分拆反而支持把 social discovery 放在另一產品 thesis；recommendation 仍不應阻塞 core。
7. **另開 transfer/sync/history Issue — DUPLICATE。** #14/#16/#17 已存在且 PR #20 正活躍。
8. **把 competitor「one tap」行銷文案當成 Reese-max task-success 證據 — REJECT。** 只能當 capability / design signal。

## Issue Mapping / coordination

- **Created:** none.
- **Updated:** none.
- `#14/#16/#17/#15`：相關外部證據與 open PR #20 同 scope → `SKIPPED_LOCKED / DEDUPE`，未留言。
- `#26`：share-target 是相鄰候選而非既有 acceptance requirement → 未改 scope。
- `#18`：外部 discovery/social 訊號沒有證明 recommendation 應提前 → 未更新。
- open/closed Issue + all-state PR duplicate search 未發現既有 share-sheet/TikTok-capture fingerprint；仍因 value gate 未通過而不立案。
- 沒有更新既有 Issue，因此沒有取得 `github-issue-lock:v1`；沒有 shared mutable state file 被覆寫。

## Sources

Primary / first-party or product sources checked this round:

1. YouTube Music Help — Save music from TikTok on YouTube Music  
   https://support.google.com/youtubemusic/answer/16112512?hl=en
2. YouTube Music Help index — Manage your library / TikTok save / playlist transfer  
   https://support.google.com/youtubemusic
3. SongShift — Introducing SongMix（2026-07-18）  
   https://www.songshift.com/blog/introducing-songmix
4. Soundiiz — How Playlist Sync Works（updated 2026-08-23）  
   https://support.soundiiz.com/hc/en-us/articles/360010006193-How-Soundiiz-Playlist-Sync-Works-Direction-Add-vs-Replace-and-Frequency
5. Soundiiz — Result history retention（updated 2026-08-23）  
   https://support.soundiiz.com/hc/en-us/articles/38130467755794-Can-I-Recover-Old-Transfer-Batch-or-Sync-Results
6. Soundiiz — Recovery limits（updated 2026-08-22）  
   https://support.soundiiz.com/hc/en-us/articles/360009511174-Can-Soundiiz-Recover-Deleted-or-Overwritten-Playlists-and-Favorites
7. Soundiiz — Transfer workflow（updated 2026-09-01）  
   https://support.soundiiz.com/hc/en-us/articles/360010097413-How-to-Use-Soundiiz-to-Transfer-Playlists-and-Favorites
8. PlayOver  
   https://playover.app/
9. UniTune  
   https://unitune.art/
10. JamShare  
    https://jamshare.io/

Repository evidence:

- `Reese-max/spotify-playlist-organizer-mcp` main HEAD `9b99f580acaf1e0b6631aa911b9222c262ddc1ec`.
- Product baseline referenced by latest Product Board: `a0bad36b6ab80185f01f0632f25c8b27ef09dbb8`.
- Open PR #20 head `7a59abd1297982a85f0773537b952662f2561fdc`.
- README current contract and Issues/PRs re-read before decision.

## What Changed from previous radar

Relative to `docs/competitive-intelligence/2026-09-16T000900Z-external-radar.md`：

- 公平輪巡從 `academic-mcp` 推進到 `spotify-playlist-organizer-mcp`。
- 新的主要市場訊號不是另一個 bulk-import feature，而是 **capture-at-discovery**：YouTube Music × TikTok 與多個 share-sheet products 都把「發現歌曲後的 handoff」壓到 discovery surface。
- 新的反方證據同樣重要：SongShift 把 sharing/discovery 分拆為 SongMix，支持 Reese-max 不把 social feed / discovery 塞進 organizer core。
- `spotify-playlist-organizer-mcp` 出現新的 active PR #20；因此本輪對 #14/#15/#16/#17/#19 相關市場訊號只做 report-level dedupe，不搶 active scope。
- 沒有新 Issue，因為 share capture 的真實 user pain / frequency 尚未建立，且現有 copy/paste exact-link path 已能完成任務。

## Classification / scope calibration

- `capture-at-discovery`：**ADJACENT IDEA / NEEDS_EVIDENCE**，不是缺陷。
- `social discovery/profile/feed`：**DO NOT COPY / out of current scope**。
- `bulk import / sync / backup`：**already tracked; active implementation; no duplicate**。
- `recommendation`：維持後續研究，沒有新證據升級。
- 沒有 P0/P1/P2 新分級；外部 competitor capability 不用來製造 severity。

## Completion / gaps / next cursor

Completed this round:

- fresh owner pagination：42 owned / 39 unarchived；
- Issue Quality v2 re-read + rule blob continuity；
- current repo/main/README/Product Board evidence re-read；
- open/closed Issue duplicate search + all-state PR check；
- current active PR #20 coordination check；
- external direct / adjacent / technical/product strategy research；
- Opportunity Map、反方、四道 gate、Rejected Ideas、Issue Mapping 完成；
- central report only，沒有 scope mutation。

Remaining gaps:

- no real owner/beta observation proving paste/app-switch is top friction；
- no actual iOS/Android share-target prototype or runtime experiment；
- no TikTok provider integration test；
- no live YouTube mutation；
- PR #20 is not on default branch, so its claimed tests/capabilities must not be treated as current main behavior until merged and verified；
- no production CLEAN conclusion.

**Next fair-rotation cursor: `google-maps-personal-mcp`.**
