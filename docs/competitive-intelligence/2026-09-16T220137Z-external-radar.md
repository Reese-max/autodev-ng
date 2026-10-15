# 外部競品／新品／工作流靈感雷達 — 2026-09-16T22:01:37Z

## Scope / rules / evidence boundary

- Owner scope：只處理 `Reese-max` 自有 repositories；未操作第三方 repository。
- Issue Quality：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- 本輪重新完整分頁列舉 connected owner inventory：**42 owned repositories；39 unarchived**；page 2 為空。archived：`gemini-deidentifier`、`openab`、`obsidian-vault`。working classification 沿用已核對的 **36 product-like + 3 support/compatibility-only**，但 owner 總數來自本輪 fresh pagination，不把舊 inventory 當全集。
- 上一份中央 radar `2026-09-16T201000Z-external-radar.md` 指定下一個 fair-rotation target 為 **`Reese-max/google-maps-personal-mcp`**；本輪完成該 target。下一個 cursor 回到既有 rotation 的 **`herdr-skills`**。
- `google-maps-personal-mcp` default branch：`main@3097a14e3fbe45ad3e4cd870fd89e516b4416b90`；latest default-branch change 是 audit/docs。current product-code baseline 仍為 `8bb6931b6d34f158aedf9ad6f652a7aef3822bcb`。
- 本輪重新讀取 README、owner-approved Product Board、所有 Issues、all-state PR、#1/#4 comments、PR #5 完整 discussion、branches。active implementation：PR #5 `fix/issues-1-2-sync-retention@a15c55de1b11b735542ea2a5502d6fa69077df56` 同時處理 #1 / #2；branch 列表只有 `main` 與該 active fix branch。
- 本輪只新增這份中央 radar report。**0 新 Issue、0 既有 Issue 修改、0 PR comment、0 implementation authorization**。
- 未修改產品 source、CI/config、secrets、permissions/settings；未建 implementation branch、未 merge/deploy、未啟動 worker/GOAL、未執行付費 provider request 或正式資料寫入。
- 沒有 live Places call、signed-in Google Maps write、production DB 或 real-user workflow observation；未執行路徑仍是 `NEEDS_RUNTIME_VERIFICATION`。
- 本輪不宣告 portfolio CLEAN。

## Owner direction / current product truth

Owner 已核定方向仍是 **INVEST / SIMPLIFY**，優先序為：

`SIMPLIFY → FIX → VALIDATE → IMPROVE → ADD`

北極星不是「自動化 Google Maps」，而是：

> Keep user-authored place knowledge durable and locally controllable while treating Google Maps as a replaceable discovery/sync boundary.

目前真正的 durable product truth 應是 user-owned collections / notes / tags / priority 加上可被允許長期保留的 provider identity；Places API 是 discovery/detail boundary，Google Maps Saved Lists 是 optional bounded sync target。

Current coordination：

- #1 — Places retention boundary：`MAINTENANCE / P2 / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`；active PR #5。
- #2 — overlapping sync writer safety：`BUG / P2 / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`；active PR #5。
- #4 — Place ID rollover continuity：`RESEARCH / NOT_ESTABLISHED`；isolated research 已得到 narrow BUILD decision，但明確沒有 implementation authorization，也沒有 live provider proof。
- Product Board 仍把 existing-list import、native app、collaboration、another provider、generic AI recommendations 放在 LATER / DO NOT COPY，除非 owner workflow evidence 改變優先級。

## Executive decision

**0 new Issues；0 existing Issues modified。**

本輪真正值得保留、且足以觸發通知門檻的不是「競品又多一個匯入功能」，而是**Google 第一方現行條款對 active PR #5 的 retention 解法提出了更窄的允許範圍**。

PR #5 目前新增：

- `GMPMCP_PLACE_CACHE_TTL_DAYS`，default `30`；
- `purge_expired_place_content(ttl_days)`，在 TTL 到期後一次清掉 `name/address/lat/lng/rating/review_count/google_maps_url/types/raw`；
- PR 說明把這視為「non-exempt content 30-day cache TTL」。

但 Google Maps Platform **current Service Specific Terms**（current page；last modified 2026-06-10；checked 2026-09-17）在 Places API (Legacy and New) 的 caching 條款只明確允許：

- `latitude` / `longitude` 暫存最多 **30 consecutive calendar days**；
- General Service Terms 另允許依 Documentation cache 可 cache 的 Google IDs，例如 Places `place_id`；
- Google 的 Place ID 文件明確說 `place_id` 不受一般 caching restriction、可長期保存。

而 Google Maps Platform Terms 的核心原則是：Google Maps Content **只有在 Service Specific Terms 明確允許時才能 cache**。現行 Places 條款沒有把 display name、formatted address、rating、review count、types、Maps URL 或完整 raw response 一併列成「可先存 30 天」的 blanket exception。

因此本輪不能把 PR #5 的 `TTL=30` 解讀成「所有 provider fields 存 30 天就合規」。這不等於本 radar 下法律結論，也不等於已觀察到 enforcement；真正可確認的是：**PR #5 現在的 generic 30-day field policy 沒有被本輪讀到的第一方 Places caching terms 支持。**

這與 #1 是同一個 fingerprint，而 #1 正由 active PR #5 實作；依跨排程規則，本輪標為：

`NEW_EXTERNAL_EVIDENCE + DEDUPE + SKIPPED_LOCKED_ACTIVE_PR#5`

不另開「compliance framework」Issue、不搶改 PR、不用競品研究把 active scope 擴成新架構。

### 最小下一步（待 active owner / PR 處理，不是本輪 implementation authorization）

先做 **field-level retention matrix**，而不是 generic TTL framework：

1. durable：user-authored collections / notes / tags / priority；
2. durable provider identity：`place_id`，依 current documentation 可長期保存；
3. temporarily cacheable：`lat/lng`，在 applicable Places terms 下最多 30 consecutive calendar days；
4. 其他 Places content（例如 display name/address/rating/review count/types/raw）：除非 owner 的實際 Agreement / billing region / current Documentation 有另一個明確 permission，先不要假設 30-day blanket cache；最小安全設計是 request/on-demand display 或只在被明確允許的 boundary 中暫存；
5. 不要因 provider content 被清除而丟失 user-authored metadata；也不要把 provider content 偷渡進 export/backup 成永久 user corpus。

Non-EEA current Service Specific Terms 與 current EEA Service Specific Terms 的 Places caching clause 都把 30-day allowance 指向 lat/lng；但實際適用條款仍由 owner billing address / Agreement 決定，所以本報告不把 contract applicability 冒充已驗證。

---

# Product → Market Category

`google-maps-personal-mcp` 本輪市場類別：

1. **Personal place memory / local-first place library**：Rego、Mapcove。
2. **Agent-native personal travel knowledge**：TravelTip。
3. **Provider boundary / compliance**：Google Maps Platform Places API terms + Place ID documentation。
4. **Incumbent discovery / planning**：Google Maps / Gemini；只作 substitute signal，不照抄 generic recommendations / itinerary SaaS。

---

# External Signals

## A. Provider truth — Places caching permission 比 active PR 的 generic TTL 更窄

**CONFIRMED — current first-party terms；current page last modified 2026-06-10；checked 2026-09-17.**

Sources：

- https://cloud.google.com/maps-platform/terms/maps-service-terms
- https://developers.google.com/maps/documentation/places/web-service/place-id
- https://cloud.google.com/terms/maps-platform/eea/maps-service-terms

Current first-party facts：

- General terms：Google ID caching 可依 Documentation；`place_id` 是明列例子。
- Places API (Legacy and New)：lat/lng 可 temporary cache up to 30 consecutive calendar days。
- Place ID docs：Place IDs exempt from caching restrictions；可保存並建議超過 12 個月 refresh。
- EEA terms 的 Places caching clause 也把 30-day allowance 放在 lat/lng；另有 EEA-specific permitted-use restrictions。

### User job / concrete impact

使用者真正要長期保留的是「我為什麼保存這個地方」及自己的 organization metadata，而不是長期鏡像 Google 的 directory fields。

若把 generic 30-day TTL 當成所有 Google Places fields 的 permission，後續可能需要再做一次破壞性 retention migration，並讓 ranking/dedup/trip 在不同欄位權限下產生不一致 truth。

### Transferable principle

**Retention must be per-field / per-source, not one TTL per provider response.**

這是 #1 的最小 scope 校準，不是新 registry / policy engine 的理由。

### Evidence limit

- 本輪不是法律意見，也沒有讀 owner 私人 Agreement / billing account。
- 沒有 Google enforcement event、account warning 或 suspension evidence。
- 因此保留 #1 的既有 `P2 MAINTENANCE / NEEDS_REVIEW`，不因新條款閱讀自行升成 P0/P1。

## B. Direct competitor — Rego 3 把 local-first 的「可離開」做成核心承諾

**CONFIRMED current vendor capability；privacy policy effective 2026-08-29；checked 2026-09-17.**

Sources：

- https://rego.app/
- https://rego.app/features/
- https://www.rego.app/faqs/
- https://rego.app/privacy/

Rego 3 current pattern：

- library 在裝置與 private iCloud；沒有 Rego account；
- share sheet 從 Apple Maps / Google Maps capture；
- KML/KMZ/GPX import；
- lossless native archive + KML/KMZ/GPX export；
- backup to a plain folder controlled by the user；
- explicit positioning：import/export 不是 afterthought，而是長期 place library 的 trust promise。

### 對 Reese-max 的可移植訊號

`google-maps-personal-mcp` 的 local-first thesis 若成立，**user-owned metadata 的 bounded export/restore** 比 social/collaboration 更吻合產品方向。

但現行 Product Board 已把 export/backup 記成 SHOULD BE BETTER / evidence backlog，而且 #1/PR #5 正在改 retention boundary。此時若做 export，最危險的是把尚未釐清的 Google provider fields 一起封裝成「永久備份」。

Decision：**ADJACENT IDEA / DEFER UNTIL RETENTION BOUNDARY STABLE**；不開 Issue。

未來若 owner workflow 證明 machine-loss / migration 是真痛點，最小研究只需：

`user-owned collections + notes + tags + priority + place_id → read-only export → isolated restore round-trip`

不要先做 cloud backup service、KML suite、sync account 或 cross-provider archive framework。

## C. Adjacent competitor — Mapcove 也把 local-first + open export 當 acquisition/trust surface

**CONFIRMED current vendor capability；feature launch date UNKNOWN；checked 2026-09-17.**

Source：

- https://mapcove.app/

Current product claims：

- free plan local-first，places remain on-device；
- no account required for core usage；
- import/export GPX/KML/CSV/JSON；
- full JSON backup；
- explicit “leave anytime” positioning。

它與 Rego 形成市場 convergence：local/private place library 若只說「資料在本機」，但沒有明確 safe exit / backup path，trust story 仍不完整。

但 vendor marketing 不是 Reese-max real-user evidence；本輪只保留方向訊號，不把兩個競品就推算成需求率。

## D. Adjacent distribution — TravelTip 把 personal saved places 暴露給 AI agent

**CONFIRMED current vendor capability；feature launch date UNKNOWN；checked 2026-09-17.**

Source：

- https://www.traveltip.world/en

TravelTip current workflow：

`Google Takeout → personal saved-place corpus → ask your own places → guide`，並提供 optional agent skill；頁面明列 Cursor / Codex / Gemini / ChatGPT，另提供 REST API (`GET /v1/places`)。

### 對 Reese-max 的意義

這反而支持目前 MCP thesis：**agent-native access 本身正在成為 personal place knowledge 的 distribution surface**。因此沒有必要因 consumer competitors 有 mobile app，就把 Reese-max 轉成 native iOS/Android product。

Decision：**DIFFERENTIATOR VALIDATION / no new Issue**。

不要照抄：hosted account、public guide publishing、generic AI itinerary generation。

---

# New Releases / Current Changes

| Date / checked | Product / source | Change / signal | Decision |
|---|---|---|---|
| current terms; last modified 2026-06-10; checked 2026-09-17 | Google Maps Platform Service Specific Terms | Places 30-day cache permission explicitly covers lat/lng; Google ID caching handled separately | **Material new decision evidence for #1 / PR #5; DEDUPE + SKIPPED_LOCKED** |
| effective 2026-08-29; checked 2026-09-17 | Rego privacy / Rego 3 current product | private iCloud/local library + explicit lossless/open export/backup | ADJACENT IDEA; wait for retention boundary + owner workflow evidence |
| current; checked 2026-09-17 | Mapcove | local-first + CSV/GPX/KML/JSON exit/backup | corroborating market signal only |
| current; checked 2026-09-17 | TravelTip | personal saved-place corpus exposed to Cursor/Codex/Gemini/ChatGPT via skill/API | validates agent-native distribution; no scope expansion |
| 2026-08-06 | Places API (New) | `entrances` / `navigationPoints` | prior radar already assessed; DUPLICATE / no action |

---

# Community Pain

本輪沒有保留足以改變 severity / priority 的新 Reddit/HN/community incidence evidence。

沒有理由從個別競品 positioning 推算：

- 多數使用者一定需要 backup/export；
- 多數使用者一定需要 mobile capture；
- 競品說「Google Maps lists are broken」就代表 Reese-max owner 也有相同痛點；
- agent skill 的存在就代表 hosted API 比 local MCP 更好。

真正的 owner evidence gap 仍是：

- first-success / repeat-use path 是否已完成一次 bounded live validation；
- 真實 library size / collection count；
- owner 是否已遇到 machine migration / backup recovery；
- applicable Google Agreement / billing address；
- provider field freshness / retention behavior 在產品上要如何 truthful degradation。

---

# Adjacent Ideas

## 1. User-owned export / restore — after #1 boundary stabilizes

Candidate job：`machine loss / tool migration → restore personal place knowledge without provider lock-in`。

最小候選：單一 deterministic user-owned archive；不把 Google raw/display fields 默認打包進永久 backup。

Status：`ADJACENT IDEA / NEEDS_USER_WORKFLOW_EVIDENCE / DEFERRED_BY_ACTIVE_RETENTION_WORK`。

## 2. Agent-native query surface is already the product, not a bridge to a native app

TravelTip 的 agent skill signal 支持目前 stdio MCP / agent-first distribution；後續應先證明 MCP first-success，而不是新增 native mobile client。

Status：`DIRECTION_SUPPORTED / no Issue`。

## 3. Provider cache and user archive must not share the same lifecycle

若未來做 export/backup，必須把：

- durable user-authored fields；
- durable allowed IDs；
- expiring provider content；
- runtime/sync receipts

分開，不要把「SQLite 裡目前有的欄位」等同「都可以永久備份」。

Status：`CROSS-CUTTING DESIGN PRINCIPLE`；本輪未跨 repo 建 Issue，因沒有重新驗證其他 repo 的 current storage contracts。

---

# Opportunity Map — `google-maps-personal-mcp`

| Class | Decision |
|---|---|
| MUST MATCH | 修正 #1 的 field-level retention truth；完成 #2 sync ownership safety；保留 durable user metadata；再做一次 bounded live Places + Maps sync verification。 |
| SHOULD BE BETTER | 在 retention boundary 穩定後，為 user-owned personal library 提供可驗證的 bounded export/restore；但先取得 owner workflow evidence。 |
| DIFFERENTIATOR | local durable personal context + replaceable Google boundary + MCP/agent-native access；不需要 hosted account 才能操作。 |
| ADJACENT IDEA | explicit source lineage、lossless user-owned archive、personal recall；都先重用既有 SQLite，不預設新 service/index。 |
| DO NOT COPY | native social map、public profiles、collaborative trip SaaS、generic AI itinerary/recommendation、cloud account、把 Google Places response 直接變成永久 portable corpus。 |

---

# Four-gate calibration

## Gate 1 — 問題 / 價值

### Active #1 scope

- Target：依賴 local durable collection 的 owner / local user。
- Repo evidence：main 仍把 provider fields + raw 寫入 SQLite；PR #5 試圖用 default 30-day TTL 解決。
- New external evidence：current Google Places terms 的 30-day permission 明確指向 lat/lng，不是所有 Places content。
- Existing alternative：更小方案是 per-field boundary + on-demand provider fetch；不需要 new DB / registry / policy service。
- 不做後果：可能在 merge 後仍需要第二次 retention correction；但沒有 account enforcement / production incident evidence。

Gate：**new evidence passes as scope correction to existing #1, not a new root cause**。

### Export / backup candidate

- User pain：UNKNOWN；只有 product-board backlog + competitor convergence。
- Existing workaround：SQLite file/manual backup。
- Active dependency：#1 retention field ownership 尚未穩定。

Gate：**does not pass Issue threshold now**。

## Gate 2 — 優先級

Existing #1 stays：

- `kind=MAINTENANCE`
- `severity=P2`
- `evidence=SOURCE_CONFIRMED`
- `triage=NEEDS_REVIEW`
- `auto_implementation=false`

本輪沒有因 contract reading 把它改標 P1；也沒有把 PR review 內的 P1 code-review badge冒充 Issue Quality severity。

Export candidate：

- `kind=OPPORTUNITY / RESEARCH candidate`
- `severity=NOT_ESTABLISHED`
- `decision_priority=LOW-MEDIUM until owner workflow evidence`
- `triage=DEFERRED / NEEDS_EVIDENCE`
- `auto_implementation=false`

## Gate 3 — 最小方案

Retention：

1. no change — 不足，因 new first-party evidence 與 generic 30-day assumption 不一致；
2. docs-only field matrix — 必要，但若 code 仍存 prohibited/unpermitted fields 不能單靠文件；
3. local per-field storage/read correction — 最小產品變更；
4. policy engine / new service / registry — **REJECT**，沒有必要。

Export：

1. manual SQLite copy；
2. deterministic user-owned JSON/native archive；
3. only after evidence, KML/GPX interoperability；
4. cloud backup / cross-provider sync service — **REJECT for current scope**。

## Gate 4 — 研究 / 實作分離

- 本輪沒有授權 PR #5 改動，也沒有評論 active PR。
- 若 active PR owner 接納新條款 evidence，仍應先確認 applicable Agreement，再縮 field matrix；不是 radar 自動啟動修復。
- Rego/Mapcove/TravelTip signals 只支持產品方向判斷，不取得 implementation rights。

---

# Rejected / Deferred Ideas

1. **另開 retention/compliance Issue** — REJECT：#1 已是相同 fingerprint，且 PR #5 active。
2. **留言搶改 PR #5** — SKIPPED_LOCKED：active implementation 有明確 branch/PR ownership；新證據留中央 report。
3. **Google Takeout / Mapstr / Rego import** — DEFER：先前已評估，owner Product Board 明列 LATER；沒有新 owner bootstrapping evidence。
4. **Native iOS/Android / share sheet** — REJECT current：MCP/agent-native thesis已有市場 corroboration；native app 增加 distribution/security 維護面。
5. **Generic AI itinerary / Ask Maps clone** — DO NOT COPY：incumbents / travel SaaS 更適合做 generic discovery；與 local personal memory north star 不符。
6. **Places Insights / rating-history analytics** — DEFER：沒有 current user job evidence；也會把 provider content/cost/retention面擴大。
7. **把所有 Places fields 30 days 後 purge 就稱 compliance solved** — REJECT：current first-party terms 不支持 blanket 30-day interpretation。
8. **因 Rego/Mapcove 都有 export 立刻開 backup Issue** — REJECT now：market convergence ≠ owner pain；且 #1 field boundary active。

---

# Issue Mapping / coordination

| Repo | Existing tracker | New evidence | Action |
|---|---|---|---|
| google-maps-personal-mcp | #1 + PR #5 | Places 30-day cache allowance is field-specific (lat/lng); generic 30-day TTL is not supported by current first-party terms read this round | `DEDUPE + SKIPPED_LOCKED_ACTIVE_PR#5`; central report only |
| google-maps-personal-mcp | #2 + PR #5 | PR review already has lease-renewal / stale-cache-path findings | no external-radar mutation |
| google-maps-personal-mcp | #4 | Place ID docs still confirm durable ID caching + refresh/obsolete behavior; prior isolated BUILD remains narrow | no change / no implementation authorization |
| google-maps-personal-mcp | no export tracker | Rego + Mapcove show local-first portability / round-trip trend | no Issue; `ADJACENT IDEA / NEEDS_USER_WORKFLOW_EVIDENCE` |

Current PR #5 review already contains separate implementation findings：lease expiration renewal、TTL crossing during long-lived process、hollow-row list verification。這些是 PR review scope，不由本 radar 重複立案。

# Sources

First-party / authoritative：

1. Google Maps Platform Service Specific Terms — https://cloud.google.com/maps-platform/terms/maps-service-terms
2. Google Maps Platform EEA Service Specific Terms — https://cloud.google.com/terms/maps-platform/eea/maps-service-terms
3. Google Places Place IDs — https://developers.google.com/maps/documentation/places/web-service/place-id
4. Google Places API (New) release notes — https://developers.google.com/maps/documentation/places/web-service/release-notes

Direct / adjacent vendor sources：

5. Rego — https://rego.app/
6. Rego features — https://rego.app/features/
7. Rego FAQ — https://www.rego.app/faqs/
8. Rego privacy — https://rego.app/privacy/
9. Mapcove — https://mapcove.app/
10. TravelTip — https://www.traveltip.world/en

Internal evidence：

11. `Reese-max/google-maps-personal-mcp` README / current default branch.
12. Product Board `2026-09-14T1115Z-product-board-audit.md`.
13. Issues #1 / #2 / #4.
14. PR #5 `fix/issues-1-2-sync-retention@a15c55de1b11b735542ea2a5502d6fa69077df56` + full review discussion.
15. Previous maps radar `2026-09-16T040537Z-external-radar.md`.
16. Prior latest radar `2026-09-16T201000Z-external-radar.md`.

# What Changed

Compared with the last deep `google-maps-personal-mcp` radar (`2026-09-16T040537Z`)：

- Then：no active PR / only main branch；retention #1 was still tracking only.
- Now：PR #5 is active and proposes a generic 30-day provider-content TTL.
- New material external evidence：current Google Places Service Specific Terms read this round only explicitly grant the 30-day caching window to lat/lng, while Google ID caching is separately permitted by Documentation.
- Therefore the most important next decision is not new product scope；it is to avoid merging an over-broad retention assumption as if it were confirmed provider policy.
- Rego/Mapcove add stronger current convergence around user-owned export/backup, but this remains lower priority until retention truth and owner workflow evidence exist.
- TravelTip provides current evidence that agent-native access to personal saved places is itself a viable distribution pattern, supporting the repo’s MCP direction rather than overturning it.

# Completion / gaps / cursor

Status：**COMPLETE for this radar decision, evidence-bounded.**

Verified this round：

- Fresh full owner pagination：42 owned / 39 unarchived；page 2 empty。
- Quality-rule blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Current maps repo HEAD / README / product direction / Issues / comments / PR / branches。
- First-party current Places Service Specific Terms + Place ID docs。
- Current direct/adjacent product patterns from Rego, Mapcove, TravelTip。

Unverified / not claimed：

- owner billing-account region / private Agreement;
- legal interpretation beyond the text cited above;
- live Google Places behavior / billing / provider enforcement;
- signed-in Maps write path;
- real user incidence for export/backup/retrieval needs;
- PR #5 fixes after head `a15c55de1b11b735542ea2a5502d6fa69077df56` if it changes after this report。

If PR #5 head changes in a way that alters retention semantics, this conclusion must be revalidated against the new head before claiming it current。

**Next fair-rotation cursor：`herdr-skills`。**
