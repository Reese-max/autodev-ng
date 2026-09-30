# 外部競品／新品／工作流靈感雷達 — 2026-09-16T04:05:37Z

## Scope / rules / evidence boundary

- Owner scope：只處理 `Reese-max` 自有且未封存 repository；未操作第三方 repository。
- Issue Quality：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- Quality-rule blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh owner pagination：**42 owned repositories；39 unarchived**。archived：`gemini-deidentifier`、`openab`、`obsidian-vault`。
- Working classification 沿用目前已核對版本：36 product-like + 3 support/compatibility-only；本輪沒有足夠新證據改分類。
- 上一輪公平輪巡游標：`google-maps-personal-mcp`；本輪完成此 cold-rotation target。下一個 cursor：**`herdr-skills`**。
- `google-maps-personal-mcp` default branch：`main`；本輪 HEAD `3097a14e3fbe45ad3e4cd870fd89e516b4416b90`，最新變更為 audit/docs。現行產品邏輯 baseline 仍為 `8bb6931b6d34f158aedf9ad6f652a7aef3822bcb`。
- All-state PR list 為 0；branch 只有 `main`。GitHub 可見的 owner/goal/heartbeat 搜尋沒有顯示 active implementation ownership；host-local heartbeat/GOAL 仍屬 `UNKNOWN`，不把「看不到」當作不存在。
- 本輪只寫中央研究報告；**0 新 Issue、0 既有 Issue 更新**。
- 沒有修改產品 source、CI/config、secret、權限/settings；沒有建立 implementation branch、merge、deploy、worker、GOAL、付費試用或正式資料寫入。
- 沒有 live Places call、Google Maps signed-in write、iOS/Android runtime 或 production corpus observation；未執行路徑仍是 `NEEDS_RUNTIME_VERIFICATION`。
- 本輪不宣告 portfolio CLEAN。

## Product direction re-read — google-maps-personal-mcp

現行 owner 方向仍是 **INVEST / SIMPLIFY**：把使用者自己的 collections / notes / tags / priority 保留在 local SQLite，Places API 是 discovery/detail boundary，Google Maps Saved Lists 是 bounded sync target，而不是 canonical personal-data store。

當前最優先的已核定工作仍是：

1. #1 — provider-owned Places content retention boundary（`MAINTENANCE / P2 / NEEDS_REVIEW`）；
2. #2 — overlapping sync writer safety（`BUG / P2 / NEEDS_REVIEW`）；
3. #4 — Place ID rollover continuity（`RESEARCH / NOT_ESTABLISHED`）。

最新 Product Board 已明確拒絕在核心資料邊界尚未穩定時擴成 imports/accounts/collaboration/native app/another provider/AI recommendations/generic identity service。

本輪重新讀取 #4 完整 comments。另一個 research worker 已在 isolated fixture 上得到 **BUILD（只支持最小下一步決策）**：current field mask 看不到 `movedPlaceId`，404 無 continuity path；在 provider 給單一 successor、無 collection collision 時，bounded SQLite transaction 可保存 notes/tags/priority/rank 並將 sync state reset 為 pending。這不是 live provider proof，也不是 implementation authorization；本 radar 沒有修改 #4。

## Executive decision

**0 new Issues；0 existing Issues modified。**

本輪最有價值的新外部訊號是：直接競品 Rego 的最新產品演進正在從「能收藏很多地點」進一步轉向「大型個人 library 的找回、篩選與批次整理」。App Store 當輪列出的 Version 2026.3 直接以 **“Finding things in a big library just got a lot easier”** 為主軸，新增 folder / pin color / multiple collections filters、filtered bulk edit、跨 list/grid/map views；Rego 現行產品頁也把 **search names, notes and photo captions across the whole library or one collection** 作為核心能力。

這對 Reese-max 有一個具體、但尚未通過立案門檻的對照：repo 已經保存 user-owned `note`、`tags`、`priority`，但 MCP 目前沒有「搜尋我的已保存個人脈絡」的 global local-query tool。`search_places` 是 Google Places Text Search；本地查詢只能先 `list_collections()`，再逐 collection 呼叫 `list_collection_places(collection)` 並由 client/agent 掃描結果。

也就是可能存在的人工／Agent 斷點是：

`我記得以前存過一間「庭院很安靜／適合讀書」的咖啡店，但不記得放在哪個 collection`
→ 列舉所有 collections
→ 逐一讀每個 collection
→ 在 notes/tags 中比對
→ 才得到候選。

這與 #1 retention、#2 writer concurrency、#4 provider identity rollover 都是不同 fingerprint；也不需要新的資料庫、index service、vector store 或 AI recommendation engine。

然而目前仍缺一項必要價值證據：**沒有 owner / beta library observation 證明跨 collection recall 現在是高頻或高痛點工作**。最新 Product Board 又已明確把 #1/#2/#4 放在前面。因此本輪只保留為 `ADJACENT IDEA / NEEDS_USER_SCALE_EVIDENCE`，不因競品有功能就建立 Issue。

若未來有實際 evidence（例如 owner library 已跨多 collections，常靠 notes/tags 回想），最小研究應只比較：

- no change：由 MCP client 枚舉 collections + items；
- exact tag / deterministic local filter；
- 一個 read-only local recall tool，僅查 durable user-owned fields。

在 #1 provider retention boundary 未定前，不應把過期的 provider-owned name/address/raw content 偷渡成永久全文索引。

## External Signals

### A. Direct competitor — Rego 2026.3 把「大型 personal library 的找回」升為產品重點

**CONFIRMED — current App Store release / product capability；checked 2026-09-16 UTC。**

Sources:
- https://apps.apple.com/us/app/rego-bookmark-your-places/id1455145867
- https://rego.app/

當輪 App Store 顯示 Version `2026.3`，release notes 的主軸是大型 library retrieval / organization：

- 依 folder、pin color、multiple collections 篩選；
- 篩選時即時看到 match count；
- 對 filtered results 做 bulk folder/color/collection edits；
- 每個 folder / collection / color 都可 list/grid/map 顯示；
- 前一版本 2026.2 也針對 hundreds/thousands of places 做 pin clustering / map performance。

Rego 現行 product page 的核心 loop 是 `Capture → Add context → Organize → Find → Go`，其中 Find 明確支援依 distance / recency / name / search / color / map 找回；搜尋範圍包含 names、notes、photo captions，可查 whole library 或單一 collection。

**JTBD：** 使用者不是再次搜尋網路上「有哪些咖啡店」，而是找回「我以前存過且加過自己脈絡的那一個地方」。

**減少人工步驟：** 避免先記得 collection 名稱，再逐 collection 展開／掃描 notes。

**Onboarding / distribution：** Rego 把 private local/iCloud library 當長期 memory layer；不是把所有查詢導回 public map search。

**Transferable：** user-owned note/tag context 應能被 user 重新找回；retrieval 可能比再增加 capture surface 更接近「durable personal knowledge」北極星。

**Do not copy：** 不要直接照抄 iCloud/native iOS、photo-caption indexing、bulk editor、Pin Color UI。Reese-max 是 MCP / local SQLite，不需要先變成原生地圖 app。

### A2. Incumbent direction — Apple Maps Local Lists 強化 public discovery，反而支持 Reese-max 不做泛用推薦層

**CONFIRMED — Apple announcement June 2026；checked 2026-09-16 UTC。**

Source:
- https://www.apple.com/newsroom/2026/06/apple-unveils-innovative-features-and-intelligence-experiences-across-services/

Apple Maps 的 Local Lists 使用 privacy-minded trending insights 提供 local collections，如餐廳與親子地點。這與 Google Ask Maps 類似，說明大型 map incumbent 正持續強化「我現在該去哪裡」的 discovery surface。

**對 Reese-max：** 不需要和 incumbent 比 generic recommendations；較有差異的仍是「我已經保存了什麼、當時為什麼保存、現在怎麼找回與安全同步」。

### B. Adjacent workflow — Altrove：把 scattered discovery artifacts 直接轉成 place library

**CONFIRMED current vendor capability；checked 2026-09-16 UTC；頁面未提供可靠 feature launch date。**

Source:
- https://altrove.app/

Altrove 接收 Instagram / TikTok / YouTube / Pinterest post、link 或 screenshot，以 AI 讀 caption/text/visual landmark 後建立 place；也能 ingest user-requested platform data export，再把結果放進 collections / visited / notes / trip surfaces。

**減少的人工步驟：** `看到內容 → 記住／複製地名 → Maps 重搜 → Notes 再記` 被壓成 `share artifact → candidate/place`。

**產品／定價訊號：** 當輪頁面列 Pro `From $7.99/month` 或 `$79.99/year`，paid value 包含更高準確度 AI import、import credits、協作／分享與 trip features。這只是商業設計訊號，不是效果驗證。

**Transferable：** capture adapter 應接使用者手上已存在的 artifact，而且最好保留 source lineage。

**Do not copy：** AI video/screenshot identification、social graph、public maps、trip planner、friend collaboration 都超出目前 owner scope；前幾輪已把 share/capture pattern 記為相鄰機會，因此本輪不重開 capture Issue。

### C. Provider capability — Google Places navigation endpoints

**CONFIRMED — released 2026-08-06；checked 2026-09-16 UTC。**

Source:
- https://developers.google.com/maps/documentation/places/web-service/release-notes

Places API (New) 的 `entrances` 與 `navigationPoints` 可加入 Nearby Search / Text Search / Place Details field mask；`navigationPoints` 提供 road-side navigation end point。

這已在先前 google-maps radar 評估過：它有可能改善「到建築物哪一側」的 final-arrival job，但 repo / user 目前沒有 final-arrival failure evidence，`build_trip` 也沒有宣稱 routing parity。**本輪為 DUPLICATE / NO NEW ACTION**，不因 provider 新欄位而擴 field mask 或成本面。

## New Releases / pricing signals

| 日期 / 查閱 | 產品 | 變化 | 對 Reese-max 的意義 |
|---|---|---|---|
| current Version 2026.3；checked 2026-09-16 | Rego | big-library filtering、multi-collection filtering、bulk edits、list/grid/map views | 新鮮直接競品訊號：library retrieval/organization 在規模增大後成為核心；尚未證明 Reese-max owner 已有相同規模痛點 |
| 2026-09-03 | Rego 2026.2 | hundreds/thousands pins clustering / map performance | scale handling signal；不需要照抄 map renderer |
| June 2026 | Apple Maps | Local Lists | public discovery 被 incumbent 吸收；支持 Reese-max 不做 generic recommendation AI |
| 2026-08-06 | Places API (New) | `entrances` / `navigationPoints` | 既有 radar 已評估；沒有新 user evidence，不立案 |
| current；checked 2026-09-16 | Altrove | artifact/video/screenshot → AI place capture；Pro from $7.99/mo or $79.99/yr | adjacent capture pattern + paid AI signal；非目前核心缺口 |

Rego App Store 的當輪價格與免費門檻可變動，因此本報告只保留產品頁所能確認的「optional paid upgrade unlocks unlimited library」作方向訊號，不把價格當 Reese-max 定價依據。

## Community Pain / evidence gap

本輪沒有保留足以改變 priority 的高品質新社群統計資料。搜尋結果中的使用者回饋只能作個案，不能推算 saved-place retrieval friction 的發生率。

因此目前真正的 evidence gap 仍是 Reese-max 自己的使用情境：

- owner library 現在有多少 saved places / collections？
- 找回一個舊地方時，實際 cue 是 place name、note、tag、地區、日期還是地圖位置？
- MCP host 是否已能以少量 tool calls 很快枚舉現有 library？
- #1 retention boundary 落地後，哪些 provider-owned fields仍可被 local retrieval 使用？

沒有這些資料，不能把「Rego 最近強化大 library search」轉成 Reese-max P2/P3 feature demand。

## Adjacent Ideas

### Personal recall surface

候選工作：`remembered personal cue → saved-place candidates`。

最小可驗證形式不是全文搜尋平台，而是 read-only local query over durable user-owned fields：collection identity、note、tags、priority、place_id；若需要 provider-owned name/address，必須先服從 #1 的 freshness/retention contract。

狀態：**ADJACENT IDEA / NEEDS_USER_SCALE_EVIDENCE / no Issue this round**。

### Capture-at-discovery / source lineage

Rego share sheet + Altrove artifact ingest 再次支持：`artifact user already has → thin capture adapter → existing validated core`。此方向已在先前 `google-maps-personal-mcp` 與 `spotify-playlist-organizer-mcp` radar 留存，沒有新的 owner pain 或 root cause，本輪不重複開單。

## Opportunity Map — google-maps-personal-mcp

### MUST MATCH

1. User-authored notes/tags/priority/collection membership 必須比 provider cache 更耐久。
2. Provider identity rollover 不能 silently strand 或 merge personal metadata（#4）。
3. Provider-owned content 必須遵守 #1 的 retention/freshness boundary。
4. Sync mutation 必須保留 bounded ownership / truthful state（#2）。
5. 如果產品要求使用者保存 personal context，至少要能在可證明需要時重新找回該 context；但目前「需要 global search」的頻率仍 UNKNOWN。

### SHOULD BE BETTER

- 若 owner library 已跨多 collections/大量 items，提供比 `list collections → list each collection → client scan` 更小的 recall path。
- 搜尋優先利用 durable user-owned fields，而不是為方便搜尋永久保存受限 provider content。
- 未來 capture surface 若驗證有價值，維持 thin ingress，不複製 domain logic。

### DIFFERENTIATOR

- Local SQLite 中的 user-owned personal meaning，而不是 public-map discovery graph。
- MCP/CLI 可檢查、可 scripted 的 collection / note / tag / sync state。
- Google discovery/sync 可替換，不是個人知識唯一儲存地。
- Dry-run / bounded writes / explicit failure receipts。

### ADJACENT IDEA

- Cross-collection personal recall（本輪新保留）。
- One-link/share-sheet capture（歷史 radar 已保留）。
- Explicit correction / retention UX（與 #1/#4 對齊）。
- Navigation entrance data only after final-arrival evidence。

### DO NOT COPY

- Rego 的整套 native iOS/iPad/iCloud product surface。
- Apple/Google generic recommendation/discovery layer。
- Altrove social graph / AI itinerary / video landmark recognition。
- Vector database / embeddings / semantic-search service 作為第一步。
- Generic identity registry / cross-provider resolver。
- 為了競品 parity 建 bulk-edit framework 或 account/collaboration SaaS。

## Four-gate review — cross-collection personal recall candidate

### 1. Problem / value

**Target user / north star:** 技術型個人使用者，把地點與自己的 notes/tags/priority 存成本機長期 knowledge layer。

**Repo evidence:** `collection_places` 已保存 `note` / JSON `tags` / `priority`；MCP collection surface 只能列 collections 或列單一 collection items。現行 `search_places` 是 Google Places Text Search，不查使用者自己的 notes/tags。若使用者不知道原 collection，client 只能 enumerate + scan。

**Counter-evidence / existing alternative:** MCP agent 完全可以先 `list_collections()` 再逐 collection `list_collection_places()`；在 library 很小時這可能已足夠。沒有 owner runtime observation 證明目前因此放棄任務。

**Not doing it:** 目前沒有可量化損害；因此不是 BUG/P2/P3，最多只是價值假設。

### 2. Priority / classification

若未來立案，建議最多是：

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=LOW`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`

本輪 **不建立 Issue**，因 owner-scale / workflow evidence 仍不足，且 #1/#2/#4 有更直接的 current evidence。

Opportunity ranking（定性）：

| Candidate | User Pain | Strategic Fit | Evidence | Reuse | Effort | Security/Privacy/Cost | Decision |
|---|---|---|---|---|---|---|---|
| Personal recall over notes/tags | UNKNOWN frequency；friction deterministic once many collections | High | repo gap high；owner need low/unknown；direct competitor current signal high | High：existing SQLite | Low if deterministic filter only | Low if only user-owned fields | Radar only |
| Share/link capture | plausible handoff pain | High | external strong；owner pain unknown | Medium–High | Medium | short-link/privacy/parser maintenance | Historical radar only |
| Navigation points | pain unknown | Medium | provider feature confirmed | Low–Medium | Low | extra field/cost surface | Reject now |
| Generic AI discovery | incumbent already strong | Low | market signal high | Low | High | cost/privacy/maintenance high | Do not copy |

### 3. Smallest safe experiment if evidence appears

No new index/service/vector DB. Use isolated SQLite fixtures and existing schema only:

1. Construct 25 / 250 / 2,000 saved entries distributed across collections, with deterministic notes/tags cues.
2. Ask a small fixed set of recall tasks: exact tag across collections、note phrase、collection+tag、ambiguous cue。
3. Compare current MCP-style enumerate/scan with one local read-only query/filter over user-owned fields；record tool calls、rows surfaced、ambiguity and exact candidate correctness。
4. Keep provider/network disabled; do not index stale provider `raw` content。

Exit:

- **BUILD:** real owner/beta workflow evidence shows repeated cross-collection recall, and one thin local query materially removes enumeration while retaining explicit ambiguity.
- **NARROW:** exact tag/filter is enough; no free-text/FTS/search service.
- **REJECT:** current library is small, host-side enumeration is adequate, or #1’s approved data model makes a separate surface unnecessary.

### 4. Research / implementation separation

Even a future BUILD result would only support a tiny read-only tool proposal. It would not authorize FTS5, embeddings, vector search, native UI, bulk editor, import service, account system, or implementation worker.

## Rejected / deferred ideas

1. **Open a cross-library search Feature Issue now — DEFER / NEEDS_EVIDENCE.** Direct competitor signal is fresh, but owner-scale pain is not established.
2. **SQLite FTS5 / vector DB / embeddings — REJECT as first move.** Exact note/tag filtering or host-side scan is smaller; semantic search adds schema/index/model/privacy maintenance before need is proven.
3. **Rego-style bulk editing — REJECT for now.** No Reese-max bulk-management pain evidence.
4. **Native iOS/iPad app + iCloud sync — REJECT by current product scale/direction.** MCP/local SQLite is current product thesis.
5. **Altrove-style AI video/screenshot place extraction — DEFER / out of current core.** High scope/cost/accuracy/privacy burden; historical capture candidate already exists in narrower form.
6. **Apple/Google recommendation AI — DO NOT COPY.** Public discovery is incumbent territory; personal memory layer is stronger fit.
7. **Add navigationPoints because API exposes them — DUPLICATE / NO NEW ACTION.** Prior radar already evaluated; no arrival-error evidence.
8. **Modify #4 because it now has BUILD research result — NO ACTION by this radar.** Separate worker already recorded exact experiment and kept implementation unauthorized; no new external evidence changes its bounded decision.

## Issue Mapping / coordination

- **Created:** none.
- **Updated:** none.
- #1 retention boundary：unchanged; current P2 maintenance evidence remains more important than new recall hypothesis.
- #2 overlapping sync writer：unchanged; no external signal this round changes its root cause or scope.
- #3 fixed-persona umbrella：unchanged.
- #4 Place ID rollover：full comments re-read. Prior research lock is expired/released in practice; isolated experiment reports a bounded BUILD decision but retains `RESEARCH / NOT_ESTABLISHED / auto_implementation=false`. No radar update needed because no new external evidence changes that decision.
- All-state PR list：0；branch list：`main` only。
- Search of open/closed issues for local search/filter/retrieval keywords found no distinct existing cross-library personal-recall fingerprint. This avoids false dedupe, but value gate still blocks opening a new Issue.
- Because no Issue was modified, no `github-issue-lock:v1` acquisition was necessary this round.

## Sources

Primary / first-party / product sources checked this round:

1. Rego App Store — current Version 2026.3 release notes and prior version history  
   https://apps.apple.com/us/app/rego-bookmark-your-places/id1455145867
2. Rego — current product loop, whole-library search, privacy, import/export  
   https://rego.app/
3. Apple Newsroom — Local Lists announcement, June 2026  
   https://www.apple.com/newsroom/2026/06/apple-unveils-innovative-features-and-intelligence-experiences-across-services/
4. Altrove — current artifact capture workflow and pricing  
   https://altrove.app/
5. Google Places API (New) release notes — `entrances` / `navigationPoints` 2026-08-06; moved-place history 2025-10-20  
   https://developers.google.com/maps/documentation/places/web-service/release-notes

Repository evidence:

- `Reese-max/google-maps-personal-mcp` main HEAD `3097a14e3fbe45ad3e4cd870fd89e516b4416b90`.
- Current product-code baseline `8bb6931b6d34f158aedf9ad6f652a7aef3822bcb`.
- README blob `b84037fe63f4b3422a634905b6173c00a8bf7265`.
- `tools/collections.py` blob `6ddfe33676e487306845c5647914777c40674a64`.
- `tools/places.py` blob `7212fec7d8e23629f008fdcd0c4c1b8b1caaf36f`.
- `db/database.py` blob `849a557fda8daacebab0dcb23eaefa0daeaa59c6`.
- Latest Product Board audit blob `2d90f9cdd2074da2b6e966e7d1216bf02f97a70c`.
- Existing Issue #4 comments include the separate isolated rollover experiment and its BUILD/NARROW boundary; no live provider validation was claimed.

## What Changed from previous radar

Relative to `docs/competitive-intelligence/2026-09-16T020208Z-external-radar.md`：

- 公平輪巡從 `spotify-playlist-organizer-mcp` 推進到 `google-maps-personal-mcp`。
- `google-maps-personal-mcp` #4 在另一個 research run 已取得 isolated fixture 的 bounded BUILD result；這不是本 radar 的成果，也沒有轉成 implementation authorization。
- 外部市場新增最明確的訊號是 Rego current Version 2026.3 把 **big-library filter / retrieval / bulk organization** 放到最新 release 核心；與 repo 現況對照後，發現 user-owned notes/tags 雖被保存，卻沒有 cross-library local recall tool。
- 四道 gate 後沒有開 Issue：缺少 owner / beta scale evidence，current MCP enumeration 仍是可行替代，而且 #1/#2/#4 優先級證據更強。
- Altrove / share-artifact capture 和 Google navigation endpoints 沒有形成新的 fingerprint，避免重複立案。

## Classification / scope calibration

- Cross-collection personal recall：**ADJACENT IDEA / RESEARCH CANDIDATE / severity NOT_ESTABLISHED / decision priority LOW / NEEDS_USER_SCALE_EVIDENCE**。
- Provider-content retention：維持 #1 `MAINTENANCE / P2`。
- Overlapping writer：維持 #2 `BUG / P2`。
- Place ID rollover：維持 #4 `RESEARCH / NOT_ESTABLISHED`; separate experiment BUILD 只支持窄 implementation proposal 的下一步決策。
- Navigation endpoints：provider capability confirmed，但產品 need 未建立；不升級。
- Generic recommendation/social/native app：`DO NOT COPY / out of current scope`。
- 沒有新 P0/P1/P2，也沒有用競品功能或精確 Opportunity Score 製造 severity。

## Completion / gaps / next cursor

Completed this round:

- fresh owner pagination：42 owned / 39 unarchived；
- Issue Quality v2 re-read and blob continuity；
- current default HEAD / Product Board / README / DB / MCP tool surface re-read；
- open/closed Issue duplicate search、all-state PR、branches、GitHub-visible owner/heartbeat evidence check；
- #4 full issue comments / lock history read；
- external direct competitor、adjacent workflow、incumbent strategy、provider release research；
- Opportunity Map、反方、四道 gate、Rejected Ideas、Issue Mapping completed；
- central report only，沒有 scope mutation。

Remaining gaps:

- no real owner/beta observation proving cross-collection personal recall is frequent or blocking；
- no production library size/distribution measurement；
- no isolated local recall benchmark was executed because product value gate has not passed；
- no live Places request / Google Maps write / mobile runtime；
- #1’s final provider-content retention model remains unresolved，so future local search must not assume rich provider fields are durable；
- host-local heartbeat/GOAL state is not visible in GitHub and remains UNKNOWN；
- no portfolio CLEAN conclusion。

**Next fair-rotation cursor: `herdr-skills`.**