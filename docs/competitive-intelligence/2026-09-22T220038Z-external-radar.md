# 外部競品／新品／工作流靈感雷達 — 2026-09-22T22:00:38Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / MATERIAL_DIRECT_COMPETITOR_SIGNAL / NO_NEW_ISSUE / OWNER_NOTIFICATION_WARRANTED**。
- 主要情報來源為 Reese-max GitHub 之外的公開網路；GitHub 僅用於 current product truth、owner scope/direction、Issue/PR 去重、active ownership 與持久化本報告。
- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`；rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected-owner pagination：**42 Reese-max-owned repositories / 41 unarchived**；page 2 為空；唯一 archived repo 為 `obsidian-vault`。未以舊 inventory 當全集。
- Fair-rotation focus：`Reese-max/spotify-playlist-organizer-mcp`，承接上一輪 `academic-mcp` radar 的 cursor。
- Focal default branch / current HEAD：`main@01f84bd496225c3b96d4a022fa8612320fba45df`；該 HEAD 為 audit/docs commit，最新 product-changing baseline 仍是 product-board 引用的 `a0bad36b6ab80185f01f0632f25c8b27ef09dbb8`。
- Owner-approved direction 重新核對：**INVEST / SIMPLIFY**。YouTube-first、local-first 的 intent-to-playlist effect broker；核心是 exact reviewed identity、preview/apply、local canonical ownership、safe credential lifecycle、truthful partial/unknown receipts。不要在 current controls 未驗證前擴成 generic transfer SaaS、provider-count race、hosted multi-user account system、social feed、billing 或 autonomous music organizer。
- Current main 已 source-addressed 舊 #2 的 silent top-1 apply：free-text `youtube_save_track` 在 apply 時要求 caller 帶回已選定的 exact `videoId`，否則回 `selection_required`；真實搜尋候選品質仍屬 runtime/provider evidence 問題。
- Existing open Issue surface 與 all-state PR surface 已重讀；目前沒有 closed Issue。Active implementation scope 包含 PR #20、#36–#41；本輪未留言、未重寫 scope、未搶鎖。
- `autodev-ng/main` 寫入前 HEAD：`77cef17acdce5396fe3314faa3dcd2e9c8da01ec`。
- 本輪沒有執行競品 runtime、Google OAuth、真實 YouTube mutation、provider quota exhaustion、CI trigger、deploy/merge、worker/GOAL、secret/permission/settings 變更，也沒有修改任何產品 source/config。
- 本雷達不宣告 portfolio CLEAN。

## Executive decision

**0 new Issue、0 existing Issue/PR comment、0 issue update/reopen、0 implementation authorization。**

本輪有一個值得通知 owner 的新直接競品訊號：**Sortune 已經把「YouTube Music + MCP + AI 整理」做成一個直接產品面**。其 current first-party site 讓使用者以 Google 登入、產生可撤銷 MCP token，讓 Claude／ChatGPT／其他 MCP client 讀取 liked tracks/playlists、依 artist/title 做 genre classification、按 season/year/genre 建 playlist，並自動把歌曲加入相符清單；另外提供 JSON library export。

這個訊號比先前 Free Your Music 更貼近本 repo 的 YouTube-first定位，但它**不支持照抄 hosted account DB、auto-write 或「多做一個 MCP token service」**。Sortune 的 privacy policy（2026-06-16）也顯示它選擇 hosted architecture：OAuth token 放在 private PostgreSQL、MCP token 以 hash 保存、token 可撤銷，AI-classified metadata 會按 account 保存。這是一個可觀察的 product trade-off，不是本 repo 必須採用的 architecture。

對 `spotify-playlist-organizer-mcp` 最重要的校準是：

1. **「YouTube Music + MCP + AI 分類」本身已不是稀缺差異化。**
2. 若未來真的提供手機／遠端 host，值得守住的 boundary 是：`host/session authority != provider OAuth credential != effect approval`。
3. `preview/apply + exact videoId + UNKNOWN_AFTER_WRITE/PARTIAL receipt` 仍比 competitor 的「自動建清單並加入」更符合 owner 已核定的可控 effect broker 定位。
4. 現有 #15/#20/#26 已涵蓋 protected HTTP/session/mobile surface；#17/PR #20 已涵蓋 library export；#11/#18 已涵蓋 classification/recommendation 研究。沒有證據支持重複開單。

最小判斷：**把 Sortune 當成定位與邊界證據，不把它轉成新工程。**

---

## Product → market category mapping

`spotify-playlist-organizer-mcp` 本輪對照：

1. **Direct YouTube Music + MCP competitor**：Sortune — hosted Google auth + revocable MCP token + AI genre/season organization + playlist writes + export；
2. **Direct playlist AI workflow**：Spotivibly — prompt-to-YouTube playlist，先產生 track candidates，再以 candidate scoring 匹配 YouTube，不採第一筆；低分結果明示而非靜默加入；
3. **Known direct music MCP / transfer competitor**：Free Your Music — 17 services、local MCP/desktop bridge、multi-account typed state；前輪已記錄，不重複當新訊號；
4. **Known transfer/sync workflow**：Soundiiz — account/channel-specific recovery、URL/CSV/text import、Add/Replace sync；已知訊號，不重複立案；
5. **Provider contract**：YouTube Data API — 2026-09-14/09-11 媒體 metadata 能力更新；2026-06-01 granular `search.list` quota 已由 #42 追蹤。

# External Signals

## A. Direct competitor — Sortune 把 YouTube Music MCP 做成可撤銷 host token + AI auto-organization

**Status:** `CONFIRMED current capability / first-party`; initial launch date `UNKNOWN`。  
**Policy/terms date:** 2026-06-16。  
**Checked:** 2026-09-22 UTC / 2026-09-23 Asia/Taipei。  
**Sources:**
- https://sortune.com/en
- https://sortune.com/en/privacy
- https://sortune.com/en/terms
- https://sortune.com/en/export

### Current capability

Sortune current homepage 的 documented flow：

`Google sign-in → generate MCP token → connect Claude/ChatGPT/any MCP client → agent reads liked music/playlists → classifies tracks → creates season-year-genre playlists → automatically adds tracks`。

其 privacy policy 進一步明確區分：

- provider side：Google profile + YouTube Music playlists/liked videos/video metadata；
- host side：由使用者產生的 MCP API token，可撤銷，server 只存 hash；
- derived side：AI-classified genre metadata 會與 account 一起保存；
- provider credential：OAuth tokens 存在其 private PostgreSQL；
- retention：account active 期間保留，刪帳號後 30 日內移除；revoke 後 cached YouTube data 立即清除；
- AI：聲稱不拿 YouTube user data 訓練模型，而由使用者授權的第三方 AI agent 即時分類。

### User job / reduced manual work

它解的是「我的 liked library 已經很亂，不想逐首搬運／手動建 genre playlist，也不想為每個 AI host 重做 Google OAuth」。MCP token 成為 AI host 的獨立授權憑證；Google OAuth 留在服務後端。

### Transferable signal

可移植的不是 hosted Postgres，而是**分開三種權限**：

`AI host/session token`
`→ provider credential custody`
`→ exact effect approval`

如果未來本 repo 真有 remote/mobile host，host 不應拿到 Google refresh token/passphrase；session/token 的 revoke 也不應等同 provider OAuth revoke。這和現有 #15/#20/#26 的 protected HTTP/session 方向重疊，因此本輪只保留為 product-boundary evidence。

### What not to copy

- 不因競品 hosted 就把 local-first 改成 SaaS account system；
- 不自動把分類推論直接變成 playlist write；
- 不新增 PostgreSQL/account registry/token dashboard 只為追競品；
- 不把 AI-generated genre 當 provider fact；
- 不把「AI 可以讀 library」等同「AI 可以在沒有 explicit apply 的情況下寫 provider」；
- 不把 export JSON 另開新 project；現有 #17/PR #20 已有 portable library export/backup scope。

### Gate result

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
decision: DEDUPE_TO_15_20_26 / SKIPPED_ACTIVE_SCOPE / NO_IMPLEMENTATION
```

## B. Direct workflow — Spotivibly 以 candidate scoring + low-score disclosure 避免第一筆搜尋誤配

**Status:** `CONFIRMED current vendor claim / first-party`; initial launch date `UNKNOWN`。  
**Checked:** 2026-09-22 UTC。  
**Source:** https://spotivibly.com/youtube-music-playlist-generator

Spotivibly 的 YouTube playlist generator 宣稱，每首 track 會對 YouTube candidate results 做 scoring，而不是直接拿第一筆；分數太低的 match 會被回報而非靜默放進 playlist。

這是一個有價值的工作流模式：**candidate ranking 可以協助縮小人工比對，但低信心不能偷偷升格成 effect identity。**

對本 repo 而言，這不是新 bug。Current main 已要求 free-text apply 帶回使用者已選的 `videoId`；若沒有就回 `selection_required`。因此「不默默拿第一筆去寫」已 source-addressed。真實搜尋／candidate 品質仍是 #2 的 bounded research，不應因競品文案重新擴成 resolution ledger 或模型 matching framework。

Gate result：`RESEARCH / NOT_ESTABLISHED / DEDUPE -> #2 / NO ISSUE`。

## C. Provider recheck — YouTube 9 月更新沒有產生新的 core gap

**Status:** `CONFIRMED first-party / no new focal fingerprint`。  
**Checked:** 2026-09-22 UTC。  
**Source:** https://developers.google.com/youtube/v3/revision_history

近期 relevant changes：

- 2026-09-14：thumbnail / playlist image upload maximum 由 2 MB 提高至 50 MB；
- 2026-09-11：部分 resource 可回更高解析 thumbnail；
- 2026-09-01：`videos.getRating` 支援 readonly scope；
- 2026-06-01：`search.list` 與 `videos.insert` 開始 granular quota buckets；`search.list` contract 已由 #42 追蹤 typed quota state/exact-ID fallback。

本 repo 核心收藏流程沒有 playlist artwork/editing user job；thumbnail resolution 也不構成 effect correctness gap。因此沒有因 provider 功能增加而開單。

# New Releases / strategy changes

| Date / status | Product | Change | Consequence |
|---|---|---|---|
| current; terms/privacy updated 2026-06-16 | Sortune | YouTube Music + MCP token + AI classification + automatic playlist organization + JSON export | **Material direct competitor signal**；MCP/AI classification 本身商品化，守住 local custody、effect authority、truthful receipts |
| current; launch date unknown | Spotivibly | AI playlist generation + YouTube candidate scoring + low-score disclosure | 支持 low-confidence fail-visible pattern；current exact `videoId` guard 已覆蓋核心 effect boundary，dedupe #2 |
| 2026-09-14 | YouTube Data API | image upload max 50 MB | 無 current core user job；不加 artwork feature |
| 2026-09-11 | YouTube Data API | higher-resolution thumbnails | metadata surface change；無 Issue |
| 2026-06-01 | YouTube Data API | granular `search.list` quota bucket | 已由 #42 追蹤；本輪不升級 severity |

# Community Pain

本輪沒有把 Reddit/HN anecdote 升級成頻率、發生率或 ROI 證據。直接產品訊號已有 first-party competitor pages、privacy/terms 與 YouTube first-party revision history 足以建立產品邊界；沒有必要用零散社群留言替代 owner-specific pain evidence。

未知仍包括：

- Sortune 的 initial public launch date 與真實 active-user scale；
- Sortune 自動 playlist mutation 的 failure/receipt semantics；
- Spotivibly candidate scoring 的 precision/recall 或錯配率；
- owner 是否真的需要從手機／另一 host 遠端連到本 repo；
- owner 是否希望 AI 自動重組 liked library，而不是一首一首明確收藏；
- 沒有 live competitor runtime benchmark，所以 competitor capability 仍是產品文件證據，不是獨立成效測量。

# Adjacent Ideas

## 1. Host/session authority 與 provider OAuth 分離 — 已有 active scope，不新增 auth platform

Sortune 提供一個清楚的 architecture signal：MCP client 使用獨立 token，provider OAuth 保留在服務端；token 可撤銷而不必暴露 Google credential。

如果 #15/#20/#26 最後真的落地 remote/mobile surface，最小驗收可以是：

1. host/session token 只能授權既有 bounded API；
2. client 永遠拿不到 Google access/refresh token、credential file path、passphrase；
3. revoke host session 不等同刪除 provider credential；
4. effectful endpoint 仍保留 preview/apply/exact IDs；
5. session expiry/revocation 後 fail closed。

這已是 existing active scope 的自然驗收，不需要新增 token service、IAM DB、multi-tenant account platform 或新的 authentication framework。

## 2. AI auto-organization — HOLD / do not turn classification into write authority

Sortune 的 auto season/year/genre workflow 是值得研究的 user outcome，但 owner repo 目前的核心 job 是「意圖／精確歌曲 → 明確收藏」，不是背景重組整個 library。

如果未來有 owner evidence 顯示「大量 liked tracks 手動整理」是高頻痛點，最小研究應比較：

- `no change`；
- 只產生 local classification proposal；
- 只產生 playlist plan/preview；
- 使用既有 apply 明確批准後才寫 YouTube。

只有 preview plan 已無法解決實際工作時，才研究更高自動化。不得因競品 auto-add 就讓 #11/#18 自動取得實作權。

## 3. Candidate scoring — keep as assistive evidence, not authority

Spotivibly 的 scoring 模式可作 #2 的 research baseline，但 current main 的 `selection_required` 已阻止自由文字直接 apply。最小研究若需要，只比較「current user selection」與「scoring 協助排序」是否降低人工比對；不建向量 DB、global identity service 或 ML matching platform。

# Opportunity Map — spotify-playlist-organizer-mcp

## MUST MATCH

- provider write 前 target identity 明確；自由文字低信心不可 silent apply；
- provider credential 不送給 AI host/UI；若有 remote host，session authority 與 Google credential 分離；
- effectful operation 保留 preview/apply 或等價 explicit authority；
- timeout/partial/unknown-after-write 不冒充 success/failure；
- provider-specific quota/capability state 可辨識，#42 不因 generic 403 隱藏 search quota。

## SHOULD BE BETTER

- exact selected `videoId` + canonical policy + local user-owned identity evidence；
- `UNKNOWN_AFTER_WRITE` / `PARTIAL_PLAYLIST_CREATED` + exact IDs + recovery next step；
- local-first library/export，不要求把完整收藏交給 hosted service 才能使用；
- user-set classification/provenance 優先於 AI-derived label。

## DIFFERENTIATOR

- **可驗證的 effect authority 與 recovery truth**，而不是「AI 能整理 YouTube Music」；
- local canonical ownership + provenance + exact-source distinction；
- provider/host/session/AI inference 各自保持真實邊界。

## ADJACENT IDEA

- remote/mobile MCP/session token：只有 owner workflow evidence 出現且 #15/#20/#26 完成 review 後再評估；
- AI playlist plan：只做 preview research，不直接 auto-write；
- candidate scoring：只作排序輔助，existing exact selection remains authority。

## DO NOT COPY

- hosted OAuth/account database 只因競品採用；
- background/automatic playlist writes without explicit user authority；
- provider-count race、transfer SaaS、social feed；
- another export subsystem when #17/PR #20 already owns export/backup；
- AI-generated taxonomy 當 provider truth；
- playlist artwork feature 只因 YouTube API 新增更大 image size。

# Four-gate review

## Candidate 1 — Remote MCP token/session layer

### 1. Problem / value

Sortune 證明 category 中「AI host 不直接持有 provider OAuth」是可商品化 workflow。但本 repo 目前 README 仍以 local stdio MCP 為 primary surface，手機／Web 需要 protected HTTP/session layer 才能成立；owner 並沒有提供 remote-host high-frequency pain evidence。

### 2. Priority

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
```

不是 P1/P2：沒有 current supported remote workflow failure，且 active #15/#20/#26 已處理相鄰 scope。

### 3. Minimum solution

重用 existing protected HTTP/session boundary；client token 只授權既有 service，不取得 Google secret，effect 仍 preview/apply。這已比新增 hosted OAuth account service 更小。

### 4. Research / implementation separation

**DEDUPE / SKIPPED_ACTIVE_SCOPE。** 不新增 Issue、不修改 PR、不把競品產品選擇轉成 implementation authorization。

## Candidate 2 — Fully automatic library organization

### 1. Problem / value

外部產品表明這個 outcome 有市場，但 repo/owner 沒有 evidence 顯示「自動把 liked library 重建為 season/genre playlists」是目前核心工作或高頻人工斷點。

### 2. Priority

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: LOW_MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
```

### 3. Minimum solution

若未來有 pain evidence，先用 local `classification → proposed playlist plan → preview`；只有使用者 apply 才 provider write。不要先建 background job/scheduler/auto-curation engine。

### 4. Separation

#11/#18 已涵蓋 classification/recommendation 相鄰研究；**HOLD / NO ISSUE**。

## Candidate 3 — Candidate scoring before YouTube match

### 1. Problem / value

錯配是合理風險類型，但 current main 已阻止 free-text silent write：apply 必須帶 exact `videoId`，否則 `selection_required`。這是強反證，代表 competitor 的 scoring 不等於 current bug。

### 2. Priority

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: LOW
triage: NEEDS_EVIDENCE
auto_implementation: false
```

### 3. Minimum solution

若 #2 runtime research 顯示人工候選選擇仍有顯著摩擦，再用 deterministic fixture 比較排序輔助；不先建 resolution ledger/ML stack。

### 4. Separation

**DEDUPE -> #2 / NO COMMENT / NO NEW ISSUE。**

# Cross-portfolio reusable idea

可保留一個跨 MCP 產品的設計原則，但**不建立跨 repo framework**：

`host/session authority != provider credential != effect approval != verified provider outcome`

它可用來檢查 `travel-planning-mcp`、`google-maps-personal-mcp`、`cf-mcp-server` 等未來 remote/effectful surface，但每個 repo 必須各自以真實 user job、provider contract 與 existing primitives 驗證；不能因本輪 competitor evidence 自動建立 shared IAM/token service。

# Rejected Ideas

- **Hosted account/OAuth service**：增加 credential custody、DB、privacy、availability、deletion burden；local-first owner direction無需求證據。
- **AI auto-add by default**：把 inference 升成 effect authority，和 current preview/apply safety contract相反。
- **新的 export project**：#17/PR #20 已有 export/backup；重複。
- **另一套 matching framework**：current exact-selection guard是反證；先完成 #2 bounded research。
- **Playlist artwork editor**：provider capability change ≠ owner user job。
- **追 17-provider breadth**：前輪已因 Free Your Music 判定不符合 simplify direction；本輪無新 evidence 推翻拒絕理由。

# Issue Mapping / calibration

| Existing tracking | 本輪判斷 |
|---|---|
| #2 selected-video binding research | Spotivibly scoring 只作 research baseline；current main `selection_required` 為反證；不重開、不升 severity |
| #11 classification | Sortune genre classification 是 category signal；不授權自動分類擴張 |
| #15 protected HTTP/session | Sortune MCP token 是 positioning evidence；existing active scope 已涵蓋最小 boundary |
| #17 export/backup | Sortune JSON export 只驗證 user-owned portability；existing scope already owns it |
| #18 recommendation research | auto-organization signal 保留為 adjacent context；仍 P3/research，不取得 BUILD |
| #20 implementation PR | Active scope；本輪不搶改、不把未合併能力當 default-branch 完成 |
| #26 mobile/web UI | remote/mobile token idea dedupe；不新增第二個 UI/backend project |
| #42 YouTube search quota | YouTube first-party contract沒有新 severity evidence；維持 P3 MAINTENANCE / NEEDS_REVIEW |

沒有新的 source-confirmed default-branch BUG fingerprint 通過四道 Gate，因此**零新 Issue 是正確結果，不是漏做。**

# Sources

## External / first-party

1. Sortune homepage — current capability, checked 2026-09-22 UTC: https://sortune.com/en
2. Sortune Privacy Policy — updated 2026-06-16, checked 2026-09-22 UTC: https://sortune.com/en/privacy
3. Sortune Terms — updated 2026-06-16, checked 2026-09-22 UTC: https://sortune.com/en/terms
4. Sortune Export — current capability, checked 2026-09-22 UTC: https://sortune.com/en/export
5. Spotivibly YouTube Music Playlist Generator — current capability, checked 2026-09-22 UTC: https://spotivibly.com/youtube-music-playlist-generator
6. YouTube Data API Revision History — checked 2026-09-22 UTC: https://developers.google.com/youtube/v3/revision_history

## Internal GitHub evidence

- `Reese-max/spotify-playlist-organizer-mcp/main@01f84bd496225c3b96d4a022fa8612320fba45df`
- current `README.md` blob `160b96c1d184e712e39217d7a6fd590818dd5066`
- product-board delta: `docs/portfolio-audit/2026-09-19T1400Z-product-board-delta.md`
- previous focal radar: `docs/competitive-intelligence/2026-09-21T060241Z-external-radar.md`
- latest prior radar/cursor context: `docs/competitive-intelligence/2026-09-22T195810Z-external-radar.md`
- Issue Quality v2 blob `8167e10798071d2276addaff6b201c6b0e904a2a`

# What Changed

- Fresh external search found **Sortune**, a direct YouTube Music + MCP + AI organization product not present in current `autodev-ng` code-search history for `Sortune`; this is the material new competitive signal.
- The signal changes **positioning**, not backlog authorization: MCP + classification is commodity-like; trusted effect boundary/local custody/recovery truth is the stronger product contract.
- Spotivibly supplies a useful candidate-scoring pattern but does not overturn current main’s explicit selected-`videoId` guard.
- No external evidence justified a P0/P1/P2 reclassification or a new product bug.
- Existing large feature/research Issues were not expanded; active PR scope was left untouched.

# Completion / gaps / cursor

- Completed: fresh full owner pagination; rule SHA re-read; focal default branch/current README/product-board/history/open Issues/all-state open PRs checked; direct/adjacent/provider web exploration performed; duplicate and four-gate review completed; unique report written.
- Gaps retained honestly: no competitor runtime benchmark, no owner telemetry, no live Google OAuth/YouTube provider mutation, no mobile/browser canary, no real quota exhaustion, no independent measurement of competitor matching/automation quality.
- Issue writes: **0**；Issue comments: **0**；PR comments: **0**；implementation authorization: **0**。
- Next fair product cursor：`Reese-max/soundbox-offline`。
