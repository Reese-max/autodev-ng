# 外部競品／新品／工作流靈感雷達 — 2026-09-14 r6

> Scope：Reese-max 擁有、未封存、可視為產品的 repositories。市場證據以 GitHub 之外的公開網路為主要來源；GitHub 只用於產品用途／近期變更／Issue・PR／duplicate・lock 協調與中央報告落地。
>
> Portfolio：本輪重新核對 **38 個 owned + unarchived repositories；36 個列為 product-like**。`adng-memory` 與 `internship-notes-sites-mirror` 維持協調／支援參考，不納入產品功能灌水。
>
> Evidence labels：**CONFIRMED** = 第一方產品／官方文件／release 資訊或可直接檢查的目前 repository truth；**LIKELY** = 合理推論但仍需 runtime／政策驗證；**COMMUNITY_SIGNAL** = 個別使用者經驗，只作 anecdotal evidence；**UNKNOWN** = 資料不足或必須實測。
>
> Safety boundary：本輪沒有修改任何產品原始碼、實作分支、merge、deploy、secrets、permissions 或 repository settings。

---

## Executive Summary

本輪出現一個新的高價值產品機會，而且是 **r5 後 repository 本身的產品方向改變所產生的新 gap**。

`spotify-playlist-organizer-mcp` 在 r5 之後新增 commit `28589712445e2229d79a1644b360425467ab7404`，把產品改為 **YouTube／YouTube Music first**，Spotify 降為 optional legacy provider；同時新增 `youtube_identify_track`、`youtube_add_to_playlist`、`youtube_save_track` 等工具。

目前 exact YouTube URL / video ID 會依 provider ID 解析；但 free-text input 會呼叫 `searchVideos(...)`，直接把 `search.videos[0]` 當 `match`。`youtube_add_to_playlist` 與 `youtube_save_track` 又會直接消費這個 match，當 `mode=apply` 時可以加入播放清單。

這產生一個很清楚的新產品邊界：

`Search Rank ≠ Track Identity ≠ User-approved Resolution ≠ Playlist Mutation ≠ Verified Saved Item`

外部市場也支持這個 gap：Soundiiz 目前的 transfer 文件把「review matches / partial / failed / skipped」做成第一級工作流；Spotivibly 的現行產品頁也把 YouTube matching 描述成多 candidate scoring + low-score unresolved，而不是只拿 first hit；YouTube 官方 `search.list` 本身則只是 query matching/ranking surface，不提供「第一名就是使用者想要的精確錄音版本」的 identity 保證。

### New high-value Issue

已建立：

- `Reese-max/spotify-playlist-organizer-mcp #2`
- **[Competitive Inspiration][Research][RESEARCH_REQUIRED] Canonical Track Resolution Ledger + review-before-write**
- Opportunity Score：**94/100**
- https://github.com/Reese-max/spotify-playlist-organizer-mcp/issues/2

#2 的核心不是建立更複雜的 AI playlist generator，而是在 discovery 與 write 中間增加 canonical resolution layer：

`User Input → CandidateSet → ResolutionDecision → CanonicalTrackRef → PlaylistPlan → Explicit Apply → Read-back Receipt`

free-text 預設 `REVIEW_REQUIRED`；exact URL 才能 `EXACT_PROVIDER_ID`。除非未來有真正校準、可重播的 auto-resolution eval，否則不憑空創造「95% confidence」或把 search #1 當真相。

### Why this is not duplicate of #1

`spotify-playlist-organizer-mcp #1` 仍擁有 Spotify provider policy / AI-model visibility boundary，以及 Spotify 端未來的 snapshot-safe Plan→Apply。#2 只處理 **YouTube-first track identity resolution**。建立前已搜尋 open/closed Issues、all-state PR 與 `github-issue-lock:v1`；沒有同 fingerprint 工作，也沒有其他流程鎖定。

### Strongest new portfolio principle

**`Discovery result ≠ canonical identity。`**

這個原理不只適用音樂；凡是 `search → choose first → write` 的產品，都應把「搜尋結果」、「身份解析」、「使用者批准」與「實際副作用」分成不同證據層。

---

# Product → Market Category / Recent Change Check

| Repository | Market / product category | 本輪主要產品 lens |
|---|---|---|
| `exam-archive` | 考試來源封存／學習資料 | provenance、版本、archive→practice handoff |
| `police-exam-practice` | 警察特考練習／學習 | official corpus、mastery、evidence-linked explanation |
| `police-exam-archive` | 考古題來源／provenance | source authority、correction trail、denominator truth |
| `92-duty-scheduler` | 勤務排班／LINE self-service | request lifecycle、human approval、published roster truth |
| `UkePack` | MusicXML→烏克麗麗練習包 | structured source→candidate pack、teacher review、export truth |
| `ppt-studio` | AI 簡報 editor/export | structured slide state、bounded patch、render/export verification |
| `voice-actress` | grounded legal/evidence QA | criterion evidence、rubric/source version、correction lineage |
| `taiwan-intel-dashboard` | 多來源情報 dashboard | freshness、provenance、dedupe、changed-since-last |
| `autodev-ng` | AI SDLC / multi-engine orchestration | bounded autonomy、review pressure、receipts、reliability first |
| `flux-image-gen` | AI image generation/editing | candidate output、provenance/C2PA、cost/output receipt |
| `claude-mem` | coding-agent persistent memory | temporal truth、freshness、recall provenance、safe injection |
| `lobsterpulse` | monitoring / attention queue | freshness、dedupe、priority/attention budget |
| `prompt-autoresearch` | prompt optimization | repeated eval、judge cost、holdout/stability、compaction |
| `neciken-summer-poem` | creative writing / contest workflow | policy provenance、frozen revisions、candidate isolation |
| `note-filler` | structured notes/forms | field/claim candidate、review、staleness、canonical fields |
| `lplrs-judicial-sync` | judicial/public-data sync | source revision/removal、exact spans、sync health |
| `cyber-prep-coach` | iPAS cybersecurity exam coach | trusted corpus、adaptive review、explanation calibration |
| `cf-ai-router` | model routing / cost control | provider truth、failover evidence、fail-closed cost semantics |
| `avatar-vfo` | role/personality simulation | structured state、continuity regression、user isolation |
| `project-doctor-web` | project diagnostics / health | finding→candidate remediation→review, not blind mutation |
| `minideck` | compact slide/deck creation | editable artifact、version/share/rollback |
| `chatgpt-dual-pipeline` | multi-model workflow | explicit handoff、shared context scope、no duplicate truth |
| `taichung-police-intel` | public-sector intelligence monitor | official-first evidence、freshness、read-only distribution |
| `soundbox-offline` | offline/local media player | offline data plane、local library truth、sync boundary |
| `skill-foundry` | Skill authoring/eval/distribution | candidate→evaluation→promotion、security/runtime/install receipts |
| `video-timeline-pipeline` | evidence→video/NLE automation | CutSpec、NLE handoff、creative approval、read-back |
| `ai-novel-workstation` | long-form writing workstation | canonical story state、context routing、resumability、cost |
| `clinical-scribe-worker` | clinical documentation | section regeneration、revision/undo、clinical truth boundary |
| `MaterialYouNewTab` | browser productivity/new-tab | local state、command surface、compatibility、privacy |
| `cf-mcp-server` | MCP / SaaS tool server | tool-contract drift、effect authority、runtime receipt |
| `tick-stock-panel` | stock/strategy analysis | point-in-time data、deterministic strategy、no live-trade leap |
| `herdr-skills` | agent skills/policy improvement | correction→candidate preference/skill、scoped promotion |
| `ninax-line-hermes` | LINE AI gateway | ordering、revision/redelivery、stale-answer invalidation |
| `ai-flight-radar` | flight intelligence/fare tracking | WatchSpec、scheduled collector、alert-decision receipts |
| `academic-mcp` | scholarly retrieval/research gateway | progressive exposure、source identity、research ledger |
| `spotify-playlist-organizer-mcp` | YouTube-first music organizer/MCP | canonical track identity、review-before-write、provider-policy separation |

## Recent connected-GitHub changes checked

### `spotify-playlist-organizer-mcp`
- **2026-09-14 14:38 +08:00**：`28589712445e2229d79a1644b360425467ab7404` — `feat: add YouTube-first playlist saving`。
- README 已把產品定位改成 YouTube／YouTube Music first；Spotify 保留為 legacy provider。
- 新增 YouTube 搜尋、辨識、批次解析、playlist list/create、duplicate、classify、add、save 等工具。
- current `resolveYouTubeMatch()`：exact YouTube identity 走 ID；free text 走 `searchVideos`，直接 `match = search.videos[0]`。
- `youtube_add_to_playlist` / `youtube_save_track` 的 apply path 會使用上述 selected match；未發現 first-class `resolution_id / selectedCandidate / match confidence policy / persistent source→target mapping`。
- 建立 #2 前，open/closed Issues 與 all-state PR 無同 fingerprint，code search 無 `github-issue-lock:v1`。

### `ai-flight-radar`
- **2026-09-14 14:50 +08:00**：`dad2ef4f546d339604f08aadf423c6f30e583e3d` — monthly task seeding workflow。
- task 會每 6 小時 self-reschedule 到 depart date；每月 seed 延伸 date window。
- 這讓既有 #4 `Intent-to-WatchSpec` 更重要：collector 是否有工作 ≠ 使用者是否明確批准一份 durable watch intent。本輪沒有建立重複 Issue。

### 其他 portfolio
- r5 後沒有看到另一個比上述兩項更重大、且與既有 Issue 不重複的產品 code direction change。
- audit/docs 更新持續進行；未把 audit document 數量當成新產品能力。

---

# External Signals

## A. 直接競品／同市場：playlist transfer 已把「matching review」做成產品工作流

**CONFIRMED — Soundiiz support updated 2026-08-22 / 2026-09-01**

Sources:
- https://support.soundiiz.com/hc/en-us/articles/360010007633-Why-are-some-tracks-not-found-or-matched-during-a-transfer
- https://support.soundiiz.com/hc/en-us/articles/360010006793-How-to-transfer-playlists-and-favorites-between-music-services
- https://support.soundiiz.com/hc/en-us/articles/360010006747-What-does-a-Soundiiz-transfer-result-mean

### 1) Job-to-be-Done
使用者不是要「找到一個看起來很像的影片」，而是把來源中的**那一首／那一版本**安全映射到目的地 catalog，並知道哪些沒找到、哪些部分成功、哪些需要人工修正。

### 2) 為什麼比現有 top-1 做法省步驟／更可靠
Soundiiz 現行文件要求在可能時 review proposed matches；結果也能分 success / partial / failed / skipped/unmatched。這把錯誤發現時間往「寫入之前或剛完成後」移，而不是讓使用者在播放清單裡聽到錯版後才人工找回來源。

對 Reese-max，目前 free-text → first result → preview/apply 的流程仍可能讓使用者必須事後：搜尋原歌、比較 live/remix/cover、移除錯誤項目、重新加入正確項目。Resolution Ledger 可直接消除這段返工。

### 3) Onboarding / distribution
Soundiiz 的核心 UX 是來源→目的地→review→run→result detail。Spotify 現在更進一步把 Tune My Music 的 import 入口放入 mobile Library，讓使用者不用先去另一個網站找到 transfer service。

Spotify source:
- https://support.spotify.com/article/transfer-your-music-library/

可移植原理：**降低進入 automation 的跳轉次數，但不要降低 identity / write review 標準。**

### 4) Automation / AI / integration 新模式
真正有價值的 primitive 是：

`Source Item → Candidate Set → Match Decision → Destination Item → Item Outcome`

而不是 `query → best guess → add`。

`spotify-playlist-organizer-mcp #2` 把這層變成可重用 canonical state，並讓 preview/apply 綁在同一 resolution revision。

### 5) Pricing / business-model signal
本輪沒有把 Soundiiz 的方案價或 transfer 次數當主要證據。產品設計訊號是：**correctness/review/history 本身就是 transfer product 的核心價值，而不是只有 catalog coverage。**

另一個新工具 Spotivibly 把 playlist generation 做成 free → paid usage ceiling，顯示「生成多少」很容易商品化；Reese-max 更有差異化空間的是可稽核 matching、exact diff、provider-policy boundary，而不是再比生成數量。

### 6) Complaints / limits / failure points
官方 Soundiiz 文件明確指出 metadata、territory、duplicate、version/remix/edit 等差異會造成 unmatched / wrong candidate，需要 review。

COMMUNITY_SIGNAL：
- 2026-09-08：有使用者回報 743 項 YouTube Music playlist，API/transfer service 只看得到 2 項；後續確認大量項目源自 legacy uploaded tracks，而非正常 API-visible catalog。這只作 fixture，不當故障率。
  - https://www.reddit.com/r/Soundiiz/comments/1wb4tkg/soundiiz_only_shows_a_couple_songs_in_big_ytm/
- 2024-09：另一位使用者希望能匯出 source→destination 的實際 mapping，以便找出「哪一首被錯配成哪一首」。這是 anecdotal workflow evidence。
  - https://www.reddit.com/r/Soundiiz/comments/1fh0par/possible_to_get_mappings_from_transferred_playlists/

### 7) Absorb vs do not copy

**Absorb**
- CandidateSet / reviewed mapping；
- item-level `UNMATCHED / AMBIGUOUS / PARTIAL / FAILED`；
- source→destination mapping ledger；
- explicit correction without starting the entire transfer again；
- durable resolution revision reused by preview/apply。

**Do not copy**
- 不把 vendor 自述 match rate 當 Reese-max accuracy；
- 不把 playlist-level `success` 當所有項目都正確；
- 不把 search #1 當 identity；
- 不因 quota 想省成本就重用 stale mapping；
- 不建立 full multi-service transfer SaaS 作為 MVP。

**Opportunity Score：94/100 — Issue #2 created.**

---

## A2. 直接技術約束：YouTube Search 是 discovery surface，不是 track identity contract

**CONFIRMED — current YouTube Data API docs checked 2026-09-14**

Sources:
- https://developers.google.com/youtube/v3/docs/search/list
- https://developers.google.com/youtube/v3/getting-started
- https://developers.google.com/youtube/v3/docs/playlistItems/list

### Signal
`search.list` 按 query/order/region 等參數回傳匹配資源；`relevance` 是目前 repository 使用的預設排序。官方 API 沒有提供「結果第一名就是使用者想要的音樂 recording/version」的保證。

因此對這個產品：

- exact video ID 是 provider identity evidence；
- free text 是 discovery intent；
- candidate ordering 是 ranking evidence；
- user confirmation 才能把 ambiguity 收斂成 canonical resolution。

API 也是 quota-governed。這讓「把已經人工確認過的 mapping 保存下來」同時有 UX 與成本價值，但 **cost 不能成為 stale resolution 的例外理由**。

### Product possibility

`CanonicalTrackRef` 未來可以在多處重用：
- save track；
- duplicate check；
- category organization；
- source→destination migration；
- future sync / alert；
- audit/export mapping report。

這也是為什麼本輪選擇「Resolution Ledger」而不是只加一個 UI confirm button。

---

## A3. 新直接工具：Spotivibly 把「候選打分 + 低分 unresolved」變成使用者可理解的產品行為

**CONFIRMED product surface / UNKNOWN effectiveness — current page checked 2026-09-14**

Source:
- https://spotivibly.com/youtube-music-playlist-generator

現行頁面明確描述：一首 track 映射到 YouTube 時，不只拿 first hit，而會對 candidate results 評分；低分結果回報而不是靜默包含。這只證明產品設計方向，不能證明它的 matcher 實際優於其他工具。

### Transferable design
Reese-max 不需要複製其 scoring formula，也不應造一個無校準的 confidence number。應先從更可靠的狀態開始：

`EXACT_PROVIDER_ID / REVIEW_REQUIRED / USER_CONFIRMED / UNMATCHED / AMBIGUOUS / STALE`

未來如果真的建立 holdout set、版本化 features、calibration 與 false-positive budget，再考慮 `AUTO_RESOLVED`。

---

## B. 相鄰領域可移植工作流：Caseware 把「外部提交 → 驗證 → canonical workpaper」直接串起來

**CONFIRMED — announced 2026-09-09**

Sources:
- https://www.caseware.com/us/news/caseware-puts-agentic-ai-inside-the-audit-connecting-client-requests-to-the-workpaper-with-caseware-verity-for-excel
- https://www.caseware.com/products/client-requests
- https://www.caseware.com/products/caseware-verity-for-excel

### 1) Job-to-be-Done
審計人員原本要向客戶要求文件、追蹤是否回覆、確認資料完整，再把已接受的資料重新下載／查找／輸入 Excel workpaper。

Caseware 的新路線把 Request、Response Validation、Accept/Return、connected engagement、Excel workpaper 接成一條 stateful workflow。

### 2) 省步驟／可靠性
有價值的地方不是 vendor 自述的省時百分比；本輪不採用那些效果數字。真正可驗證的產品結構是：**已驗證、已接受的資料可成為 downstream canonical artifact 的直接 context，避免同一份資料再次 copy/re-upload/re-key。**

### 3) Onboarding / distribution
AI 被放進 auditor 本來就在使用的 Caseware engagement / Excel ribbon，而不是要求使用者離開 system of record 去另一個 chatbot。Client Request 也有 status-first view 與 email notification。

### 4) 新 capability pattern

`External Request → Submitted Evidence → Validation Finding → Human Accept/Return → Canonical Evidence → Downstream Artifact Candidate → Human Approve`

這個 pattern 很適合：
- `note-filler`：外部資料／附件 → field candidate；
- `clinical-scribe-worker`：來源證據 → section candidate；
- `ppt-studio`：source evidence → slide object candidate；
- `UkePack`：MusicXML/source → teacher-reviewed pack；
- `lplrs-judicial-sync`：source change → canonical record revision。

### 5) Pricing / business model
Caseware 表示 Verity for Excel 對已有 Verity access 的 firm 自動包含、無額外 license。產品訊號是：**AI validation / context handoff 可以作為 system-of-record 的 embedded capability，而非一定獨立收費的 chat assistant。**

### 6) Limitations / failure points
- Client Requests 的新 AI-first capability仍在 limited early access；不能把整套 workflow 宣稱已普及。
- vendor 的效率數字是公司自述，本輪不當外部效果證據。
- AI finding 不是 accept decision；接受／退回仍由 auditor 決定。

### 7) Absorb vs do not copy

**Absorb**
- input request 的 canonical lifecycle；
- validation finding 與 accept decision 分離；
- accepted evidence 直接成為 downstream context；
- status transition + audit trail；
- 取消重複 re-key/re-upload。

**Do not copy**
- 不建立通用 accounting suite；
- 不把 agent finding 自動升級為 truth；
- 不拿 vendor time-saving claim 當本產品 KPI；
- 不新增第二套 evidence store，如果產品已有 canonical provenance。

**Opportunity Score：91/100 — Research List；目前各產品已有部分相同 candidate/promotion primitives，不另開跨 portfolio umbrella Issue。**

---

## C. 新興工作流：Arg 把 shared agent context 做成「明確 opt-in 的 distribution surface」

**CONFIRMED — first-party Desktop changelog, Aug–Sep 2026**

Source:
- https://arg.ai/changelog/desktop

近期 Desktop release 包含：
- 2026-08-25：可選擇讓 Claude Code / Codex 讀取 Arg shared context；
- 2026-08-25：chat agent 可看 desktop window；
- 2026-08-27：Bot mode 把 workspace agents 放進 messaging window；
- 2026-09-01：worktree agent autostart / Code terminal improvements。

### 1) Job-to-be-Done
使用者想讓不同 agent 共用專案 context，不想每次重新貼同一批文件與狀態。

### 2) 省步驟／可靠性
shared context 能減少重複 copy/paste；但 Arg 的產品 surface 仍把「是否讓 Claude Code/Codex 取得這個 context」做成 opt-in，而不是全域默認。

### 3) Onboarding / distribution
context 跟 workspace 綁定，Agent 成為 context consumer，而不是每個 Agent 各自維護一份真相。

### 4) 新 capability pattern

`Canonical Context Store → Context Selection → Agent-specific Context Lease → Run → Context-use Receipt`

對 `chatgpt-dual-pipeline`、`autodev-ng`、`claude-mem`、`herdr-skills` 有可移植性。

### 5) Pricing / business model
本輪不從 changelog 推導價格策略。真正的 design signal 是：context sharing 本身是一個**權限／distribution primitive**，不能只靠「所有 agent 看同一資料夾」實作。

### 6) Limitations / failure points
- shared context 可造成 stale truth、secret over-sharing、cross-agent contamination；
- desktop/window visibility 也會擴大敏感資料暴露；
- changelog 只證明 feature existence，不證明 accuracy 或 security effectiveness。

### 7) Absorb vs do not copy

**Absorb**
- opt-in agent context scope；
- canonical store 與 agent-local session 分離；
- context lease / source refs / freshness；
- 不同 agent 可以不同 scope。

**Do not copy**
- 不建立另一個通用 desktop workspace；
- 不讓 memory / shared context 自動帶來 tool or credential authority；
- 不把「Agent 看過」當「Agent 有權修改 canonical state」。

**Opportunity Score：88/100 — Research List；與現有 memory/principal/context boundary 有明顯重疊，暫不立新 Issue。**

---

# New Releases / Market Moves

1. **Soundiiz transfer workflow docs — 2026-09-01 / 2026-08-22：** matching review、partial/failed/skipped result 都是第一級 UX，而非 hidden log。
2. **Caseware Verity for Excel + Client Requests — 2026-09-09：** request→validation→accepted evidence→Excel workpaper 形成一條 connected workflow；Excel capability GA，new Client Requests AI-first experience limited early access。
3. **Arg Desktop — 2026-08-25 to 2026-09-01：** shared context opt-in for Claude Code/Codex、desktop visibility、Bot mode、worktree agent improvements。
4. **Spotify current mobile import：** destination app 直接提供 cross-service import entry，實作由 Tune My Music partner 承接；降低「先找一個轉移網站」的 distribution friction。
5. **Spotivibly current YouTube playlist generator：** 對外描述 candidate scoring / low-score reporting；當作 product-design signal，match efficacy 仍 UNKNOWN。

---

# Community Pain Points

以下全數只標 **COMMUNITY_SIGNAL**：

1. **YouTube Music legacy uploads 與 API visibility 不一致（2026-09-08）**  
   743-item playlist 在第三方工具只有 2 項可見；後續確認大量內容是 Google Play Music 時代 uploaded tracks。這應成為 `VISIBLE_COUNT != RETRIEVABLE_COUNT` fixture，而不是假設 provider list API 就是完整 library truth。  
   https://www.reddit.com/r/Soundiiz/comments/1wb4tkg/soundiiz_only_shows_a_couple_songs_in_big_ytm/

2. **使用者想知道「來源這首到底被映射成目的地哪一首」**  
   長清單 mismatch 無法靠人工逐項核對，希望能匯出 mapping 並修正錯配。這支持 Resolution Ledger / mapping export。  
   https://www.reddit.com/r/Soundiiz/comments/1fh0par/possible_to_get_mappings_from_transferred_playlists/

3. **playlist headline count 與 API-returned item list 可不同**  
   2026-02 的 Soundiiz 討論也描述 provider metadata 顯示數量與實際可抓取項目不同；原因可能是 rights/API exposure。只用來建立 denominator/freshness fixture。  
   https://www.reddit.com/r/Soundiiz/comments/1raznf6/track_count_doesnt_match_track_list/

沒有把以上 anecdote 外推成市場錯誤率。

---

# Adjacent Ideas

## 1. Resolution Ledger 作為通用 Entity Resolution Primitive
可移植到：
- `academic-mcp`：搜尋命中的 paper candidate ≠ canonical paper identity；
- `voice-actress`：名稱／條文／判決候選 ≠ authoritative source identity；
- `lplrs-judicial-sync`：query result ≠ canonical judgment revision；
- `ai-flight-radar`：airport/city/fare candidate ≠ approved WatchSpec；
- `spotify-playlist-organizer-mcp`：search video ≠ chosen recording。

不要建一個大一統 library；先讓各產品使用同一 semantic principle。

## 2. Accepted Evidence Handoff
Caseware 的相鄰模式可收斂為：

`Submitted ≠ Validated ≠ Accepted ≠ Canonical ≠ Applied`

適合 `note-filler` / `clinical-scribe-worker` / `ppt-studio` / `UkePack`。

## 3. Context Lease
Arg 的模式：

`Stored Context ≠ Shared Context ≠ Agent-visible Context ≠ Tool Authority`

適合 `claude-mem` / `chatgpt-dual-pipeline` / `autodev-ng`。

## 4. Accountless / zero-write discovery surface
像 MindTube 這類 Chrome toolbar 產品主打「不連 YouTube 帳號，只產生可播放 queue/links」。這表示 music product 可以把 `DISCOVER/PREVIEW` 與 `ACCOUNT_WRITE` 做成兩個 onboarding tier。對 Reese-max 而言，這是 ADJACENT IDEA，不是取代現在 OAuth playlist save 的理由。

Source:
- https://getmindtube.com/

---

# Opportunity Scores

| Rank | Candidate | Score | Decision |
|---|---|---:|---|
| 1 | Spotify/YouTube provider-policy boundary | 98 | existing #1；仍是 blocker，不重複 |
| 2 | Canonical Track Resolution Ledger + review-before-write | **94** | **new #2 created** |
| 3 | Intent-to-WatchSpec / durable fare monitoring | 93 | existing `ai-flight-radar #4` |
| 4 | Accepted Evidence → Canonical Artifact handoff | 91 | Research List；reuse existing candidate/promotion primitives |
| 5 | Item-level Outcome / Mapping Ledger | 91 | folded into new #2，避免拆太碎 |
| 6 | Shared Context Lease / opt-in agent distribution | 88 | Research List；overlaps existing memory/principal boundaries |
| 7 | Provider-query quota/cost receipt | 86 | research primitive；不單獨立案 |
| 8 | Accountless discovery → explicit connected promotion | 84 | adjacent idea；not core blocker |
| 9 | Mapping export / correction rule from prior accepted resolution | 89 | future phase of #2 |
| 10 | Generic multi-service transfer engine | 70 | REJECT/NARROW；scope too broad and provider-policy-heavy |

Scoring dimensions used：User Pain、Strategic Fit、Novelty、Evidence Strength、Reuse Potential、Implementation Effort controllability、Security/Privacy/Cost Risk controllability。沒有用「每輪一定開幾個 Issue」配額。

---

# Opportunity Map — 36 Product Repositories

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| `exam-archive` | 可追溯官方來源／版本 | 修訂／撤回 diff 更清楚 | archive→practice provenance chain | accepted-source handoff | 不做通用題庫商城 |
| `police-exam-practice` | 題源、答案、解析可追溯 | 錯題／mastery 回饋比單純 quiz 更可靠 | evidence-linked explanation | source revision invalidates stale study item | 不追求 AI 無限生題 |
| `police-exam-archive` | official-first source identity | 修訂 trail / denominator truth | audit-ready exam corpus | canonical entity resolution | 不把搜尋命中當正式題源 |
| `92-duty-scheduler` | roster truth、approval、auth | request→review→publish 更少人工轉錄 | LINE self-service + exact published receipt | accepted-request→canonical roster | 不擴張 HR/payroll suite；先修 P0/P1 |
| `UkePack` | MusicXML source fidelity | teacher review / export diff | playable pack with source lineage | accepted evidence→pack section | 不做全功能 DAW |
| `ppt-studio` | native editability | bounded object patch + render/export verification | structured slide state + provenance | accepted source→slide object | 不做 Canva clone／不 raster 當 editable |
| `voice-actress` | authoritative evidence identity | conflict/counterevidence | criterion-level source graph | entity resolution ledger | 不把 search result 當權威來源 |
| `taiwan-intel-dashboard` | freshness/provenance/dedupe | changed-since-last + stale/unknown | official-first intelligence truth | accepted signal→brief object | 不做 autonomous action center |
| `autodev-ng` | bounded autonomy / receipts | review-pressure / WIP evidence | multi-engine candidate→verification→promotion | opt-in context lease | 不重造通用 agent platform |
| `flux-image-gen` | output/cost/provenance | candidate comparison + exact params | C2PA/provenance receipt | context-scoped reference bundle | 不把 vendor aesthetic claims 當品質證據 |
| `claude-mem` | temporal truth/freshness | stale/conflict recall gate | RecallReceipt + provenance | opt-in context lease | 不做第二個 generic brain UI |
| `lobsterpulse` | signal freshness/dedupe | attention budget / changed-since-last | decision queue rather than news dump | accepted signal→watch policy | 不把所有 feed 都加入首頁 |
| `prompt-autoresearch` | independent eval/stability | quality+cost+complexity Pareto | compaction / judge-cost receipts | accepted correction→candidate | 不追求 prompt 越長越好 |
| `neciken-summer-poem` | contest rule/source version | frozen candidate + revision diff | policy-aware creative artifact | source/rule acceptance gate | 不做 generic social writing suite |
| `note-filler` | canonical fields + evidence | section/field-scoped candidate | accepted evidence→field with undo | Caseware-style request→accepted field | 不 auto-apply uncertain extracted data |
| `lplrs-judicial-sync` | authoritative revision/removal | exact spans + sync health | revision-aware legal mirror | entity resolution / accepted evidence handoff | 不把 search cache 當法律 truth |
| `cyber-prep-coach` | trusted iPAS corpus | mastery/adaptive review | explanation calibration + source trace | accepted source update→study plan | 不做 offensive lab platform 只因競品有 |
| `cf-ai-router` | provider/model/cost truth | last-good + fail-closed routing | measured route receipts | scoped context/model lease | 不以 free label 猜實際零成本 |
| `avatar-vfo` | canonical persona state | continuity regression | versioned personality state | opt-in shared context | 不讓 memory = tool authority |
| `project-doctor-web` | reproducible findings | candidate remediation preview | fix receipt / no blind mutation | accepted finding→repair candidate | 不做 autonomous repo admin |
| `minideck` | editable artifact | version/share/rollback | simple native deck handoff | source accepted→deck object | 不做 full design suite |
| `chatgpt-dual-pipeline` | explicit stage handoff | context scope/ownership | dual-model disagreement as evidence | Agent-specific Context Lease | 不把 shared context 全域暴露 |
| `taichung-police-intel` | official-first / freshness | update diff + evening brief | local gov/police operational intelligence | accepted signal→brief | 不做 write-capable gov automation |
| `soundbox-offline` | full offline playback/library | offline data plane parity | local-first no-account media state | ephemeral discovery→local promote | 不把 downloads page 當 offline mode 全部 |
| `skill-foundry` | quality/security/runtime/install evidence | CI receipts + stale claims | certified artifact chain | context-scoped skill runtime | 不再造 marketplace／不重複 #3 Inspector |
| `video-timeline-pipeline` | evidence-backed CutSpec | NLE handoff/read-back | intent upstream, execution capability-owner | accepted media gap→NLE candidate | 不做完整 AI video marketplace |
| `ai-novel-workstation` | canonical story state | resumable context + cost | continuity/evidence ledger | context lease per writing agent | 不把每輪完整小說塞入 context |
| `clinical-scribe-worker` | clinical truth / human review | section regen、undo、manual edit preservation | source-linked clinical sections | request/evidence→accepted section | 不讓 AI 自動變更 clinical truth |
| `MaterialYouNewTab` | local/private productivity state | browser compatibility / offline | command surface with narrow tool exposure | opt-in context/tool lease | 不廣泛 expose tasks/notes to agents |
| `cf-mcp-server` | tool contract / effect semantics | drift diff + fail closed | exact tool manifest + receipt | provider data classification | 不把 server identity 當 tool authority |
| `tick-stock-panel` | point-in-time data truth | deterministic StrategyDef | inspectable strategy, no live-trade leap | search result→canonical instrument identity | 不因競品 MCP 下單就開 live trade |
| `herdr-skills` | correction as evidence | scoped/versioned promotion | candidate preference/skill | opt-in shared context | 不一次 correction 就永久學會 |
| `ninax-line-hermes` | message ordering/idempotency | edit/redelivery stale invalidation | channel-native reliable AI gateway | accepted request→canonical workflow | 不讓 message arrival = permission |
| `ai-flight-radar` | quote freshness/collector truth | WatchSpec promotion + alert receipt | evidence-backed deal scoring | entity resolution for airport/fare input | 不做 live booking；collector ≠ consent |
| `academic-mcp` | provider/source identity | progressive tool exposure | canonical paper/research ledger | generic entity resolution principle | 不把 semantic similarity 當 provider substitution |
| `spotify-playlist-organizer-mcp` | **exact/reviewed track identity + item outcome** | **persistent Resolution Ledger + preview/apply binding** | **auditable source→chosen-video mapping + provider-policy separation** | accountless discovery、cross-service mapping export | **不 silent top-1、不 opaque confidence、不 full transfer SaaS** |

---

# Top 10 Cross-Portfolio Ideas

1. **Canonical Resolution Ledger** — 搜尋結果先變 CandidateSet，人工／規則解析後才成 canonical identity。`spotify-playlist-organizer-mcp #2` 是第一個具體實例。
2. **Item-level Outcome Ledger** — batch/playlist/job 成功不能抹掉單項 `UNMATCHED / PARTIAL / UNKNOWN / FAILED`。
3. **Accepted Evidence Handoff** — 一份資料只收一次；驗證／接受後直接成為 downstream artifact context，不再 re-key/re-upload。
4. **Context Lease** — context storage 與 agent-visible scope 分開，opt-in、版本化、可過期。
5. **Provider Data Classification** — provider API 可呼叫 ≠ provider content 可進模型；沿用 Spotify #1 原則。
6. **Preview/Apply Exact Revision Binding** — preview 和 apply 中間不能重新算出另一個 action 再當成已批准。
7. **Quota/Cost as Receipt, not Authority** — quota/cost 要量測，但不能成為跳過 correctness/freshness 的理由。
8. **Accountless Exploration Tier** — 不需 external account authority 的 discovery/preview 可降低 onboarding；真正 write 再升級授權。
9. **Mapping Export + Correction Reuse** — 使用者修正一次 mapping 後，不必每次重新比較；同時保留來源→目的地 trail。
10. **Search Rank Never Equals Truth by Default** — 可移植到 paper、legal source、flight entity、media identity、monitoring signal 等產品。

---

# Ideas Rejected / Narrowed

## REJECT — 再做一個「AI 幫你產生 playlist」主功能
YouTube Music、MindTube、Spotivibly 等都已把 prompt→playlist 商品化。Reese-max 目前真正的新 gap 是 identity/review/write correctness，不是生成更多候選歌曲。

## REJECT — 把 free-text top-1 加一個自訂 confidence 就算完成
沒有 calibration / holdout / versioned features 的 confidence 是裝飾性數字，可能更危險。

## REJECT — Spotify unresolved 自動 fallback 到 YouTube 或反向 fallback
Provider policy、catalog identity、terms 和 user intent 都不同。Fallback 本身必須是使用者明確策略，不能是錯配的隱藏修補。

## REJECT — 為這輪再開 generic Skill Inspector Issue
`skill-foundry #3` 已明確涵蓋 Tenable CyberAgents Exchange/AI Inspector、package security attestation、scanner/rules hash、capability manifest 等；再開只是 duplicate。

## NARROW — Caseware-style connected evidence workflow
有跨多產品價值，但 `note-filler`、`clinical-scribe-worker`、`ppt-studio` 等已各自有 candidate/review/provenance primitives。先把相同原理映射到現有 canonical stores，不建新的 umbrella framework。

## REJECT — 通用 multi-service music migration SaaS
provider policies、OAuth、catalog mismatch、billing、support burden 都很高；目前產品差異化應先把 YouTube-first organizer 的 resolution/effect contract做對。

---

# Issue Mapping / Coordination

| Repo / Issue | 本輪處理 | Reason |
|---|---|---|
| `spotify-playlist-organizer-mcp #1` | 保留，不更新 fingerprint | Spotify AI-content/model-visibility + future snapshot-safe plan/apply；與 YouTube track identity 不同 |
| `spotify-playlist-organizer-mcp #2` | **NEW** | YouTube-first free-text top-1 identity gap；94/100；無 duplicate/PR/lock |
| `ai-flight-radar #4` | 保留 | monthly task seeding 讓 durable WatchSpec 更重要，但同 fingerprint 已立案 |
| `skill-foundry #3` | 保留，不重複 | 已包含 agent skill/component pre-deploy inspector + SecurityAttestation |
| `ppt-studio #5` | 保留 | Caseware workflow只補強 accepted-evidence handoff，沒有取代 structured slide state fingerprint |
| `clinical-scribe-worker` existing section/revision work | 保留 | 相鄰 accepted-evidence principle，不重建第二套 canonical store |

Cross-schedule rule：本輪沒有搶任何已有 `github-issue-lock:v1` 的工作；沒有建立實作 branch、PR、merge 或 deploy。

---

# Sources

## Direct market / music transfer
- Soundiiz — transfer flow (updated 2026-09-01): https://support.soundiiz.com/hc/en-us/articles/360010006793-How-to-transfer-playlists-and-favorites-between-music-services
- Soundiiz — why tracks are unmatched / review matches (updated 2026-08-22): https://support.soundiiz.com/hc/en-us/articles/360010007633-Why-are-some-tracks-not-found-or-matched-during-a-transfer
- Spotify — Transfer your music library / Tune My Music integration: https://support.spotify.com/article/transfer-your-music-library/
- YouTube Data API `search.list`: https://developers.google.com/youtube/v3/docs/search/list
- YouTube Data API overview/quota: https://developers.google.com/youtube/v3/getting-started
- Spotivibly YouTube Music Playlist Generator: https://spotivibly.com/youtube-music-playlist-generator
- MindTube: https://getmindtube.com/

## Adjacent workflow
- Caseware — announcement, 2026-09-09: https://www.caseware.com/us/news/caseware-puts-agentic-ai-inside-the-audit-connecting-client-requests-to-the-workpaper-with-caseware-verity-for-excel
- Caseware Client Requests: https://www.caseware.com/products/client-requests
- Caseware Verity for Excel: https://www.caseware.com/products/caseware-verity-for-excel

## Emerging agent/context workflow
- Arg Desktop changelog: https://arg.ai/changelog/desktop

## Community signals — anecdotal only
- Soundiiz / YouTube Music 743→2 API-visible items, 2026-09-08: https://www.reddit.com/r/Soundiiz/comments/1wb4tkg/soundiiz_only_shows_a_couple_songs_in_big_ytm/
- Source→destination mapping request: https://www.reddit.com/r/Soundiiz/comments/1fh0par/possible_to_get_mappings_from_transferred_playlists/
- Playlist count vs retrievable list mismatch: https://www.reddit.com/r/Soundiiz/comments/1raznf6/track_count_doesnt_match_track_list/

---

# What Changed Since Last Radar (r5 → r6)

1. **Portfolio count unchanged：38 owned + unarchived / 36 product-like。**
2. `spotify-playlist-organizer-mcp` 在 r5 後真正改成 YouTube-first，而不只是「Spotify policy blocker」。這讓市場類別從單一 Spotify organizer 變成更廣的 music playlist organizer，但也立刻暴露新的 track-identity correctness gap。
3. 新建立 `spotify-playlist-organizer-mcp #2`：Canonical Track Resolution Ledger + review-before-write，Score 94/100。
4. #1 沒有被關掉或取代；Spotify provider data/model-visibility 仍是 legacy provider 的獨立 blocker。
5. `ai-flight-radar` 新增 monthly task seeding；它讓 durable monitoring 更完整，但沒有改變「collector work ≠ approved WatchSpec」原則，因此不重複開 Issue。
6. 新增直接市場證據：Soundiiz matching review / item-level outcomes、Spotify in-app transfer distribution、Spotivibly candidate-scoring product surface。
7. 新增相鄰工作流：Caseware request→validate→accept→workpaper，強化「accepted evidence 直接 handoff 到 canonical artifact」原則。
8. 新增 emerging workflow：Arg 以 opt-in 方式把 shared context 暴露給 Claude Code / Codex，強化 Context Lease 原則。
9. 本輪沒有因為新工具很多就建立 umbrella Agent framework、music marketplace 或 Skill Inspector duplicate。

---

## Final Portfolio Rule from this round

**`搜尋結果只是一份候選證據，不是身份本身。`**

產品如果要從「搜尋」跨到「寫入、同步、發布、追蹤」等 durable effect，中間至少需要：

`Candidate → Resolution → Approval → Effect → Read-back`

缺一層，就會把「模型／搜尋引擎覺得像」錯當成「使用者真的要的是這個」。