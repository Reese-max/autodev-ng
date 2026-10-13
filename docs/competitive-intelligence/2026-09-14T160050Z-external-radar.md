# 外部競品／新品／工作流靈感雷達 — 2026-09-14T16:00:50Z

> 查閱日：2026-09-15（Asia/Taipei）；檔名時間為 UTC。主要市場證據來自 GitHub 之外公開網路；Reese-max GitHub 僅用於實際 repo 列舉、產品範圍、default-branch 現況、Issue/PR 去重與本報告落地。
>
> Issue Quality：`issue_quality_version: 2`；來源 `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`；本輪讀取 blob `8167e10798071d2276addaff6b201c6b0e904a2a`。
>
> Evidence labels：`CONFIRMED` = 第一方官方資料或可直接檢查的 repository truth；`LIKELY` = 有支持但仍需 runtime／真人證據；`COMMUNITY_SIGNAL` = 個別社群經驗；`UNKNOWN` = 資料不足。
>
> Safety：本輪沒有修改產品原始碼、CI/config、secret、權限或 repository settings；沒有建立實作 branch、merge、deploy、啟動 worker/run 或新 GOAL；沒有付費試用或變更正式資料。

---

## Executive Summary

本輪 **0 新 Issue、0 Issue 更新**。不是因為沒有外部訊號，而是 Issue Quality v2 與既有 owner scope 明確阻止把「競品已有匯入」直接升級成產品需求。

最有價值的新訊號集中在 `google-maps-personal-mcp`：Mapstr 目前已把 **Google Maps list → share sheet → 偵測地點 → 選擇／加入** 做成免費的 iOS/Android onboarding；同一套入口也可從文章、網頁、Instagram、TikTok 匯入地點。這直接命中「已有大量收藏的人，若改用另一個個人地點層，最痛的不是搜尋，而是重新逐筆輸入」的 JTBD。

但 `google-maps-personal-mcp` 最新 Product Board 已明確排序：`SIMPLIFY → FIX → VALIDATE → IMPROVE → ADD`，而且把 **Existing-list import** 放在 `LATER`，只有當 owner workflow data 證明 bootstrapping 是 top friction 時才考慮。現有更高優先事項仍是 #1 的 Places data retention boundary、一次 bounded live sync 證據，以及 first-success/repeat-use observation。因此本輪將「Google Maps list bootstrap」保留為 **RESEARCH CANDIDATE / NEEDS_USER_WORKFLOW_EVIDENCE**，不建立 Issue，不用外部競品存在推翻已核定優先順序。

相鄰市場的最新訊號則支持「可攜、批次、可讀的收藏資料」：Organic Maps 2026-08-31 增加 bookmarks/tracks 多選操作、可讀 share links，並保留匯出 bookmark 的原始名稱／描述。Google Places API 2026-08-06 新增 `entrances` / `navigationPoints`，可把地點 identity 延伸到更精確的導航終點；但在 `google-maps-personal-mcp` 尚未完成 live sync 驗證前，這只列 `ADJACENT IDEA`，不做新功能。

本輪最重要的產品校準：`google-maps-personal-mcp` 已由最新 Product Board 的實際 source/readme/tests 審查從 `UNKNOWN` 升為 **product-like / private alpha**。因此目前 42 個 owned repos 中，3 個 archived、39 個未封存；依現有分類為 **36 個 product-like + 3 個 support/compatibility-only**（`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`）。

---

## 1. Repo enumeration / scope / fair rotation

### 1.1 實際 owner listing

本輪重新列舉 `Reese-max` 實際 repositories，沒有沿用舊清單：

- owned repositories：42
- archived：3（`gemini-deidentifier`, `openab`, `obsidian-vault`）
- owned + unarchived：39
- current product-like：36
- support/compatibility-only：3

### 1.2 本輪公平輪巡

上一輪中央 radar cursor：`spotify-playlist-organizer-mcp`。

本輪處理 cohort：
1. `spotify-playlist-organizer-mcp` — lightweight dedupe；近期已高頻研究。
2. `google-maps-personal-mcp` — deep read；自上一輪後已由 UNKNOWN 變成明確 private-alpha product。
3. `exam-archive` — status/issue dedupe。
4. `police-exam-archive` — adaptive-study signal dedupe。
5. `92-duty-scheduler` — workflow signal dedupe。

`UkePack` 與 `ppt-studio` 最近已做深度 radar，因此本輪不重複消耗同一市場訊號。**下一個 cold-rotation cursor：`voice-actress`**；owner-order skipped-recent 仍保留在後續輪巡，不視為永久跳過。

---

## 2. Current product truth / recent default-branch evidence

### 2.1 `spotify-playlist-organizer-mcp`

- current HEAD：`4a7fd58d35f7e34492f59dc1e8332301eb81801f`（最新為 audit docs）。
- latest product commit：`28589712445e2229d79a1644b360425467ab7404` — YouTube-first playlist saving。
- 現行產品以 YouTube / YouTube Music 為主要 provider；Spotify 已是 optional legacy provider。
- 已有 #2 selected-video binding research、#3 OAuth secret handling、#4 partial-state recovery、#5 minimal CI、#6 request deadline/cancellation；本輪市場訊號沒有新的獨立 fingerprint。

Decision：**DEDUPE / no write**。

### 2.2 `google-maps-personal-mcp`

- current HEAD：`ee2cbd56b3b8da28a6f856a9bf2323b6687d32c6`（audit formatting）；產品實作 SHA `8bb6931b6d34f158aedf9ad6f652a7aef3822bcb`。
- 北極星：本機、可控的 personal place knowledge layer；user-authored notes/tags/priority 是 durable truth，Google Maps 是可替換 discovery/sync boundary。
- 核心使用者：以 Codex / Claude Code / Devin 經 stdio MCP 操作的技術型個人使用者。
- 現況：free-text/nearby/details → local collection；可 rank/dedup/build trip；Google Maps 寫入走 dry-run-by-default、bounded、resumable Playwright adapter。
- 現有 #1：non-exempt Places content retention boundary；P2 MAINTENANCE / NEEDS_REVIEW / auto_implementation=false。
- Product Board 明確：NOW=#1 + preserve local-only；NEXT=32 tests + bounded Places/Playwright fixture + observed recommendation→collection→shortlist→Maps journey；LATER=existing-list import only if owner workflow proves bootstrapping is top friction。

Decision：**INVEST / SIMPLIFY；本輪不越過既有 roadmap 開 import Issue。**

### 2.3 `exam-archive`

- current HEAD：`5d74726eed8f507bb9527aff2047945c6de10d79`（audit docs）。
- root 仍沒有 README；核心 artifact 是約 1.35 MB 的 `index.html`。
- #1 已追蹤 canonical status / repository contract / monolith；其中已明示若 repo 已被其他產品取代，應 redirect/archive，不要維護第二份 truth。
- #3 已追蹤 practice answer keyboard/AT operability。

Decision：在 canonical status 未解前，不以 Quizlet/RemNote 再擴 adaptive/AI study feature。

### 2.4 `police-exam-archive`

- current HEAD：`a0b5dbb9352b5558dbe62445c6452947dbd2501b`（audit docs）；近期產品 UI commit `fe497aa9fac7a4e4a411e663edeef6c1c5356577`。
- README：106–115 年、42,518 題、49 類科、101 科目；官方題庫解析與資料品質是核心資產。
- #60 已追蹤 per-question attempt / deadline-aware review queue，外部 Quizlet/Anki adaptive signals 屬相同 fingerprint。

Decision：**DEDUPE**；不另開 generic AI tutor / flashcard feature。

### 2.5 `92-duty-scheduler`

- current HEAD：`4d7d7d4911ffd580630661a2f71079a2c38c6ae1`（audit docs）。
- 核心仍是 Excel roster/timetable → deterministic scheduling → human tweak → Excel/LINE/history。
- #19 = explainable minimal-impact repair；#20 = PolicySpec / Rule Studio research；#22 = post-publish Duty Inbox / LINE request lifecycle。

Decision：近期 workforce scheduling 的 agent/rule/inbox 訊號均已有 owner fingerprint；本輪不再重開。

---

## 3. External Signals

### A. Direct competitor — Mapstr current import/capture workflow

**CONFIRMED — current capability；feature release date UNKNOWN；checked 2026-09-15**

Sources:
- https://en.mapstr.com/faq
- https://en.mapstr.com/fonctionnalites/importer-des-adresses

Current Mapstr workflow：
- Google Maps list：在 Google Maps 開清單 → Share → 選 Mapstr → Mapstr 偵測地點 → 使用者選擇加入，並依現有 tags 建議分類。
- Article / blog / web page：share 到 Mapstr，由 app 偵測頁面提到的地點。
- Instagram / TikTok：同樣從 share sheet 進入，再偵測地點。
- Google Takeout / file：官方頁面亦描述檔案匯入路徑。
- 這些 import capability 在最新 iOS/Android 版本為免費功能。

JTBD：把「我已經收集過的地點／剛看到的推薦」轉成可管理收藏，而不是重新搜尋與重新輸入。

減少的人工步驟：`open source → remember/copy name → switch app → search again → select → tag` 收斂成 `share → review detected places → add`。

Onboarding/distribution：把 OS share sheet 當 capture surface，比要求使用者先進專用 app 建結構更低摩擦。

Business-model signal（current official FAQ；checked 2026-09-15）：Free 可保存最多 300 addresses；Plus 在歐洲示例約 €59/year 或 €7.90/month，實際依地區／幣別不同。Import 被放在 free surface，表示 onboarding/migration 本身被當 acquisition capability；這不是 Reese-max 付費意願或 ROI 證據。

限制／不該照抄：
- Mapstr 是 cloud/mobile consumer product；`google-maps-personal-mcp` 的差異是 local ownership 與可檢查的 provider boundary。
- 社交內容 extraction 會增加 mobile bridge、內容解析、privacy/terms 維護面。
- 競品有 import 不能證明 Reese-max owner 現在的最大痛點就是 migration。

### B. Adjacent workflow — Organic Maps bulk + portable collection operations

**CONFIRMED — released 2026-08-31；checked 2026-09-15**

Source:
- https://organicmaps.app/news/2026-08-31/multi-selection-bookmarks-tracks-carplay-dashboard-hiding-tracks-share-links-august-2026/
- https://organicmaps.app/faq/bookmarks/how-to-export/

New/current patterns：
- bookmark/track multi-selection，可一次 move/delete/change color；
- share place/bookmark/current position 時傳送較可讀的 link；
- exported bookmarks 保留原始 names/descriptions；
- bookmark lists 可匯出 KMZ/GPX/GeoJSON。

Transferable principle：local-first collection 不只要「能存」，還要能批次整理、可讀分享與可攜匯出，否則資料一多仍會回到人工逐筆管理。

Do not copy：Organic Maps 的導航、離線 map renderer、CarPlay/Android Auto 是另一個產品 thesis；`google-maps-personal-mcp` 不應因此擴成地圖/導航 App。

### C. Emerging provider capability — Places API navigation endpoints

**CONFIRMED — released 2026-08-06；checked 2026-09-15**

Source:
- https://developers.google.com/maps/documentation/places/web-service/release-notes
- https://developers.google.com/maps/documentation/places/web-service/nearby-search

Places API (New) 現可在 Nearby Search / Text Search / Place Details 要求：
- `entrances`：地點出入口位置；
- `navigationPoints`：道路側的實際導航終點，並可帶 navigation point token 給 Navigation SDK / Routes API。

Potential JTBD：對機場、商場、校園等大型 place，從「收藏一個 Place ID」走到「真正能抵達正確側／入口」。

Decision：**ADJACENT IDEA only**。目前沒有 repo/user evidence 說 wrong entrance 是核心 friction，且更重要的 live Places / Playwright path 尚未驗證。不能因 API 新欄位存在就開 feature。

---

## 4. New Releases

| Date | Product | Change | Relevance |
|---|---|---|---|
| 2026-08-31 | Organic Maps | bookmark/track multi-select、readable share links、exported bookmark names/descriptions | local-first collection portability / batch management pattern |
| 2026-08-06 | Google Places API (New) | `entrances` + `navigationPoints` | future precise navigation handoff; not current priority |
| UNKNOWN/current | Mapstr | Google Maps list + web/social share import；free on latest iOS/Android | strong onboarding/migration product pattern, but no release date found; not presented as a 30–90 day launch |

Freshness gap：Mapstr 官方目前沒有在上述頁面提供該 import feature 的明確上線日期，因此本報告只把它標成 current confirmed capability，不假造 recent launch。

---

## 5. Community Pain Points

### Google Maps export / recovery incompleteness

**COMMUNITY_SIGNAL — 2026-04-21**

Source:
https://support.google.com/maps/thread/426936623/google-takeout-only-downloading-a-fraction-of-lists-pins-when-downloading-google-maps-data

單一使用者回報 custom list 約 120 pins，但 Takeout 中只看到 6 pins。這不是發生率、也不是 Google 官方承認的普遍 bug；只能用作研究 fixture 訊號。

Implication：如果日後研究 existing-list bootstrap，不能預設「Google Takeout = 完整 truth」。最小實驗必須對 controlled source list 做 item-count / identity reconciliation，並把 missing/unknown 顯示出來，而不是把 partial import 當成功。

補充 COMMUNITY_SIGNAL（2026-06-06）：另有使用者描述 custom dropped pins 從 list 消失且 Takeout 也未包含；同樣僅支持 recovery/portability 要有不完整狀態，不外推普遍性。

---

## 6. Adjacent Ideas / candidate research

### 6.1 Existing-list bootstrap — **NEEDS_USER_WORKFLOW_EVIDENCE, no Issue**

Candidate fingerprint：
`google-maps-personal-mcp + local onboarding + user already has a Google Maps saved list + adoption requires re-search/re-save per place + no bounded one-way bootstrap path`

Why interesting：
- repo 目前只有 search/nearby/details，再 `save_place`；Google Maps adapter 是 outbound sync。
- Mapstr current workflow proves a direct-list import UX exists in this category。
- product board itself identifies onboarding as a competitive gap。

Counterargument / why not now：
- current owner roadmap explicitly says existing-list import is LATER **only if owner workflow data proves bootstrapping is top friction**。
- technically capable owner with a small/new collection may be adequately served by existing `search_places → save_place`。
- #1 provider-retention truth + bounded live sync evidence are more urgent。
- reverse browser sync / scraping can create fragile selectors and provider-policy burden。

Smallest future experiment, if owner workflow evidence appears：
1. Create one disposable 10-place list owned by the tester.
2. Compare existing manual search/save with two bounded candidates: user-exported file vs read-only shared-list path.
3. Measure only observable task steps/errors; reconcile expected count + exact Place IDs where available.
4. Persist only durable allowed identity/user-authored mapping; do not broaden provider-data retention while #1 is unresolved.
5. `BUILD` if one bounded path materially removes repeated re-entry and reconciles all controlled items; `NARROW` if only user-file import is reliable; `REJECT` if it needs brittle/terms-risky scraping or adds little value for the intended user.

No production list, paid request, or broad importer framework is authorized by this radar.

### 6.2 Share-sheet / article/social capture — **DEFERRED**

Mapstr shows a compelling low-friction pattern, but this would require a mobile/browser capture surface and content extraction. It expands the product surface more than existing-list bootstrap and is explicitly downstream of proving repeated capture friction. No Issue.

### 6.3 Readable portable links / export — **RESEARCH LIST**

Organic Maps shows that readable links + export preserving user-authored names/descriptions can strengthen trust without team/social SaaS. This aligns with local-first values, but current product-board roadmap already says export/backup only if recovery/portability evidence warrants it. No Issue.

---

## 7. Opportunity Map — actually processed products

### `spotify-playlist-organizer-mcp`

- **MUST MATCH:** secure OAuth credential lifecycle (#3), bounded provider requests (#6).
- **SHOULD BE BETTER:** selected-video identity binding without unnecessary ledger (#2); explicit partial-state recovery (#4).
- **DIFFERENTIATOR:** local, preview-first YouTube playlist organization with exact-ID and explicit effects.
- **ADJACENT IDEA:** none promoted this round; provider breadth is not automatically value.
- **DO NOT COPY:** generic multi-provider AI ingestion when provider policy/identity semantics are unclear.

### `google-maps-personal-mcp`

- **MUST MATCH:** truthful retention/provider boundary (#1); prove one bounded sync journey before expanding.
- **SHOULD BE BETTER:** onboarding should eventually avoid unnecessary re-entry, but only after observed owner workflow evidence.
- **DIFFERENTIATOR:** durable user-authored local metadata + replaceable provider identity/sync boundary.
- **ADJACENT IDEA:** existing-list bootstrap; readable export/share; precise navigation endpoint.
- **DO NOT COPY:** full trip SaaS, social feed, native map renderer, reservations, generic AI recommendations, broad scraping/import framework.

### `exam-archive`

- **MUST MATCH:** keyboard/AT-operable practice (#3).
- **SHOULD BE BETTER:** first resolve canonical repo/status contract (#1).
- **DIFFERENTIATOR:** lightweight official-exam archive if it remains canonical.
- **ADJACENT IDEA:** adaptive queue only after status/source-of-truth decision.
- **DO NOT COPY:** generic AI tutor/practice generator while canonical status is unresolved.

### `police-exam-archive`

- **MUST MATCH:** official-source fidelity, stable question identity, data quality.
- **SHOULD BE BETTER:** continue existing #60 deadline-aware review research rather than inventing another adaptive feature.
- **DIFFERENTIATOR:** Taiwan police-exam-specific canonical 42k+ question corpus and provenance.
- **ADJACENT IDEA:** explanation/review workflows grounded in source questions, only if distinct from existing work.
- **DO NOT COPY:** generic flashcard SaaS, opaque AI mastery scores, AI-generated replacement questions as default.

### `92-duty-scheduler`

- **MUST MATCH:** deterministic constraints, human review, safe publish/export, authorization boundaries.
- **SHOULD BE BETTER:** existing #19 repair workflow, #20 rule authoring research, #22 post-publish exception lifecycle.
- **DIFFERENTIATOR:** school/police-specific timetable + duty rules + Excel/LINE handoff with inspectable deterministic decisions.
- **ADJACENT IDEA:** only evidence-backed thin integrations that feed canonical schedule requests.
- **DO NOT COPY:** full HR/payroll workforce suite or autonomous publish/mutation just because commercial schedulers offer it.

---

## 8. Cross-portfolio ideas — evidence-backed only

1. **Bootstrap before feature expansion**：成熟 personal-data products treat migration/import as onboarding, but Reese-max products should only implement it when existing-user workflow shows re-entry is a real adoption blocker.
2. **Portable human-readable artifacts**：Organic Maps reinforces that local-first products benefit from export/share that preserves user-authored labels/descriptions; this can apply to notes, playlists, schedules and place collections without building collaboration SaaS.
3. **Provider identity ≠ user-owned context**：Google Maps work strengthens a broader portfolio boundary: stable external identity can be referenced, while provider-owned payload retention and user-authored notes/tags have different durability/authority rules.

No cross-portfolio framework Issue is justified from these patterns alone.

---

## 9. Ideas Rejected / Deferred

| Candidate | Decision | Reason |
|---|---|---|
| Google Maps list importer Issue now | **DEFERRED / NEEDS_USER_WORKFLOW_EVIDENCE** | Product Board explicitly requires owner workflow proof first; competitor parity is insufficient |
| Instagram/TikTok/article share capture | **DEFERRED** | mobile/content-extraction scope expansion before proving capture friction |
| Places `navigationPoints` feature | **RESEARCH LIST** | new provider capability, but no current user friction + live Places path unverified |
| Places Insights historical analytics | **REJECT** | enterprise/location analytics is outside personal knowledge-layer north star |
| exam-archive AI tutor/adaptive mode | **REJECT FOR NOW** | canonical status + accessibility issues are more fundamental |
| police-exam-archive new adaptive Issue | **DEDUPE** | same product job already tracked by #60 |
| 92-duty-scheduler new repair/rule/inbox Issues | **DEDUPE** | same jobs already tracked by #19/#20/#22 |
| spotify organizer new candidate-resolution Issue | **DEDUPE** | #2 already narrowed to smallest selected-video binding experiment |

---

## 10. Issue Mapping / coordination

### New Issues

- **0**

### Updated Issues

- **0**

### Duplicate / existing owner

- `spotify-playlist-organizer-mcp #2` — selected-video binding / text search drift.
- `spotify-playlist-organizer-mcp #3/#4/#6` — credential, partial state, timeout boundaries.
- `google-maps-personal-mcp #1` — Places content retention boundary.
- `exam-archive #1/#3` — canonical/status + accessibility.
- `police-exam-archive #60` — deadline-aware per-question review.
- `92-duty-scheduler #19/#20/#22` — repair / PolicySpec / post-publish request lifecycle.

No existing Issue was edited, so no `github-issue-lock:v1` lease was acquired. No active scope was taken from another worker.

---

## 11. Sources

| Status | Event/update date | Checked | Source | Used for |
|---|---|---|---|---|
| CONFIRMED | UNKNOWN/current | 2026-09-15 | https://en.mapstr.com/faq | Google Maps list/article/social import; free import surface; current free/Plus packaging |
| CONFIRMED | UNKNOWN/current | 2026-09-15 | https://en.mapstr.com/fonctionnalites/importer-des-adresses | direct list + Takeout/file import workflow |
| CONFIRMED | 2026-08-31 | 2026-09-15 | https://organicmaps.app/news/2026-08-31/multi-selection-bookmarks-tracks-carplay-dashboard-hiding-tracks-share-links-august-2026/ | bulk bookmarks, readable links, preserved names/descriptions |
| CONFIRMED | current docs | 2026-09-15 | https://organicmaps.app/faq/bookmarks/how-to-export/ | KMZ/GPX/GeoJSON list export |
| CONFIRMED | 2026-08-06 | 2026-09-15 | https://developers.google.com/maps/documentation/places/web-service/release-notes | `entrances` / `navigationPoints` release |
| CONFIRMED | current docs | 2026-09-15 | https://developers.google.com/maps/documentation/places/web-service/nearby-search | navigation-point semantics/token handoff |
| COMMUNITY_SIGNAL | 2026-04-21 | 2026-09-15 | https://support.google.com/maps/thread/426936623/google-takeout-only-downloading-a-fraction-of-lists-pins-when-downloading-google-maps-data | partial Takeout export anecdote; test hypothesis only |
| COMMUNITY_SIGNAL | 2026-06-06 | 2026-09-15 | https://support.google.com/maps/thread/439534666/custom-list-of-locations-dissapeared-after-adding-2-new-locations-to-the-list-today | disappearing custom-pin anecdote; recovery hypothesis only |

Pricing note：Mapstr official FAQ currently gives Europe examples of €59/year or €7.90/month and says exact rates vary by country/currency. This is packaging evidence only, not effectiveness or willingness-to-pay evidence.

---

## 12. What Changed Since Last Radar

1. `google-maps-personal-mcp` is no longer UNKNOWN: latest own Product Board source review classifies it as a coherent product-like private alpha.
2. Product-like portfolio count therefore calibrates from 35 + 1 UNKNOWN to **36 product-like + 3 support/compatibility-only** among 39 unarchived owned repos.
3. External category evidence now strongly shows migration/capture is a mature competitor onboarding pattern, but existing owner roadmap deliberately requires real workflow evidence before opening an import feature/research Issue. The new evidence **does not overturn that rejection condition**.
4. Organic Maps adds a recent, first-party local-first portability pattern (2026-08-31) that supports export/share as future evidence-backed research, not immediate scope.
5. Google Places adds precise navigation endpoint fields (2026-08-06), but this remains adjacent until the base live path is verified.
6. No historical Issue was broadened or reopened from older radar text.

---

## 13. Classification / scope calibration

- `google-maps-personal-mcp`: `UNKNOWN → product-like/private alpha` based on actual source/tests/audit; not based on repo name.
- `police-exam-practice`: remains support/compatibility redirect, not independently benchmarked as a product.
- `adng-memory`: support/coordination state.
- `internship-notes-sites-mirror`: mirror/support artifact.
- `exam-archive`: remains product/status ambiguous enough that new study-surface additions are deferred until #1 resolves canonical status.

No severity was raised from external research alone. No missing runtime evidence was relabeled as a product defect.

---

## 14. Unfinished / runtime evidence boundary / cursor

Not executed this round:
- no live Places API request;
- no signed-in Google Maps Playwright write;
- no Google Maps list import / Takeout reconciliation experiment;
- no production/real-user list mutation;
- no provider quota/cost canary;
- no exam learning experiment;
- no scheduler runtime mutation.

Therefore all provider/import effectiveness claims remain **NEEDS_RUNTIME_VERIFICATION / NEEDS_USER_WORKFLOW_EVIDENCE** as applicable.

### Run accounting

- external A/B/C categories covered: **3/3**
- new Issues: **0**
- updated Issues: **0**
- duplicate/redundant issue families avoided: **4** (spotify identity, police adaptive review, duty repair/rules/inbox, Google retention vs import)
- report write: pending receipt at time of content generation
- portfolio CLEAN: **not evaluated / not claimed**
- next cold-rotation cursor: **`voice-actress`**

### Portfolio principle added this round

> **Competitor migration feature ≠ proven owner migration pain.**
>
> Import/capture can be a powerful onboarding pattern, but for a narrow local-first product the correct sequence is：observe repeated re-entry → prove it is a top friction → test one bounded source → reconcile identity/completeness → only then BUILD/NARROW/REJECT。