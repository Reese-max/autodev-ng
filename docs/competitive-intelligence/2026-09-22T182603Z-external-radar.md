# 外部競品／新品／工作流靈感雷達 — 2026-09-22T18:26:03Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / FRESH EXTERNAL SIGNALS / NO NEW ACTIONABLE ISSUE / NO USER NOTIFICATION**。
- 主要情報來源為 Reese-max GitHub 之外的公開網路；GitHub 僅用於 current product truth、owner scope/direction、Issue/PR 去重、active ownership 與持久化本報告。
- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`；本輪重新讀取 rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected-owner pagination：**42 Reese-max-owned repositories / 41 unarchived**；page 2 為空；目前只有 `obsidian-vault` archived。未以歷史 inventory 當全集。
- Fair-rotation focus：`Reese-max/ai-flight-radar`，承接上一輪 `2026-09-22T160036Z-external-radar.md` 的 cursor。
- Focal current default branch：`main@6228138337f950cb6399088c4f814f27a518e29e`；最新產品程式 commit 仍為 2026-09-15 的 48-route seed-plan test contract 修正，本輪未觀察到新的 default-branch product-code delta。
- Owner-approved direction 重新核對：**INVEST / SIMPLIFY**。維持「truthful、bounded、Taiwan-origin fare evidence radar」；先收斂 provider/quote/handoff truth、容量／freshness 契約與 reproducible build，再考慮更廣能力。Booking、payments、hotel search、multi-tenant travel SaaS、general MCP travel platform 仍不在目前核定範圍。
- Current README 仍把自然語言描述為需使用者核對的 rule parser，不是 autonomous agent；browser watch list 仍是本機狀態，不等同 server schedule/push；observed price 也不等同 final bookable fare。
- Current issue/PR mapping 重新核對：#1 quote/provider fidelity gate、#2 build reproducibility、#3 license decision、#4 WatchSpec research、#5 fixed50 umbrella、#6 route-capacity bug、#8 Fli provider migration；#7 已 closed/completed。Open PRs #9/#11 正處理 #2/#6 類 scope；PR #10 是 audit-only evidence。#4 沒有 active implementation PR，但已有 2026-09-16 bounded experiment 的 `NARROW` 決策。
- `autodev-ng/main` 寫入前 HEAD：`845233b3e20aae33a1dbb68686c083d448e1abf2`。
- 本輪沒有執行 live fare search、booking handoff、provider purchase、Cloudflare deployment、CI trigger、merge、worker/GOAL、secret/permission/settings 變更，也沒有修改產品 source/config。
- 本雷達不宣告 portfolio CLEAN。

## Executive decision

**0 new Issue、0 existing Issue/PR comment、0 issue update/reopen、0 implementation authorization。**

本輪外部市場有兩個值得保留、但都不足以改變 current roadmap 的訊號：

1. **Skyscanner 把 AI discovery、價格比較與實際 flight-option click-through 明確分層。** 這支持 `ai-flight-radar` 現有「語意解讀 != 真實報價 != 可購買價格」邊界，也支持 #4 的 `NARROW`：只 canonicalize 真正能被使用者 review 且 backend 能執行的欄位，不需要先打造 generic AI travel agent。
2. **Going 已把價格監控往 post-booking lifecycle 延伸。** 2026-05-04 的 Price Drop 會在已訂票後持續監控，先以 10% 降幅、之後每 5% 觸發通知；目前 Terms 又描述可選功能在使用者授權後可能直接對 reservation 執行 rebook/cancel/reissue 等效果。這是競品從「觀察」往「代辦交易後續」延伸的策略訊號，但它正好落在 owner 現行明確排除的 booking/transaction authority 之外。

因此，本輪最小產品判斷不是 ADD，而是 **維持邊界**：AI Flight Radar 應優先把「觀測值、來源健康、freshness、watch scope、alert reason、handoff recheck」做得可核對；不要因競品往 post-booking automation 前進，就取得 reservation/payment/loyalty/ancillary 的修改權。

---

## Product → market category mapping

`ai-flight-radar` 本輪對照：

1. **Direct metasearch / discovery competitor**：Skyscanner — AI discovery、Saved/Price Alerts、DROPS、live flight info；
2. **Direct/adjacent price-watch product**：Going — deal alerts、trip-specific watches、post-booking Price Drop；
3. **Direct platform baseline**：Google Flights / AI Mode — conversational intent → explicit price tracking confirmation；
4. **Current product job**：台灣出發、owner-controlled 的 airfare observation / history / alert evidence，重視 source/freshness/unknown truth，不負責 booking/transaction execution。

# External Signals

## A. Direct competitor — Skyscanner 把 AI discovery 與 flight-option evidence 分成兩段

**Status:** `CONFIRMED` first-party。  
**Published:** 2026-07-01。  
**Checked:** 2026-09-22 UTC / 2026-09-23 Asia/Taipei。  
**Source:** https://www.skyscanner.net/news/summer-product-release-2026-uk

Skyscanner 的 2026 Summer Product Release 把 `Explore with AI` 放在 discovery 層：使用者可用自然語言說「12 月便宜飛日本」之類的意圖，產品再呈現 destination/date/style 建議、flight pricing、weather、duration、destination vibes 與 AI insights。官方自述 2026-04-28 至 2026-05-05、14,000 名全球英語使用者的 early test 中，有 60% 會點進 AI search 產生的 flight options。

這個數字只視為 **vendor-reported engagement metric**，不是獨立成效／完成率證據，也不外推到 Reese-max 使用者。

### User job / reduced manual work

它減少「先想目的地 → 試很多日期 → 開很多比較頁」的手工搜尋，讓模糊旅行意圖先收斂成可比較候選，再進入 flight option。

### Transferable signal

對 `ai-flight-radar` 最有用的不是複製 destination-vibe AI，而是保留分層：

`free-form intent / discovery`
`→ inspectable structured candidate`
`→ real fare option / observation`
`→ optional reviewed watch`
`→ booking handoff recheck`

這與 current #4 在 2026-09-16 的 bounded experiment 結論一致：兩個語義不同的 prompt（例如多了 2 位成人、商務艙、長榮）目前可能 collapse 成相同 parsed/review state，因此不能把「AI/自然語言理解過」冒充「所有 constraint 已被 review / executable」。

### Gate result

- `kind=RESEARCH signal / OPPORTUNITY context`
- `severity=NOT_ESTABLISHED`
- `decision_priority=LOW_MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- Decision：**DEDUPE -> #4 / KEEP NARROW / NO COMMENT**。

不建立 generic AI discovery engine、destination ontology、weather/vibe planner、LLM routing 或另一個 travel-planning service。

## B. Adjacent workflow — Going 將價格監控延伸到 post-booking Price Drop

**Status:** `CONFIRMED` first-party help；current Terms capability `CONFIRMED CURRENT / change date UNKNOWN`。  
**Price Drop help published:** 2026-05-04。  
**Checked:** 2026-09-22 UTC / 2026-09-23 Asia/Taipei。  
**Sources:**
- https://help.going.com/hc/en-us/articles/48899618777748-Price-Drop-FAQs-and-More
- https://www.going.com/terms-of-use

Going Price Drop 要求使用者提供 confirmation number、airline、fare type、paid price 與 trip details；之後持續掃描到起飛日，第一次比已付價格低 10% 時通知，之後每再低 5% 通知一次。FAQ 說明 round-trip cash trips 為目前支援範圍，並承認 airline/fare-type policy 會影響是否可實際取得 savings。

Going current Terms 更進一步描述一個 optional Price Drop authorization：符合資格的會員可以授權 Going 對 reservation 做 verify/monitor/manage/rebook/refile/cancel/reissue 等操作，並可能使用 traveler/payment/loyalty/ancillary information。Terms 的本輪可讀頁面沒有可靠的 feature-change 發布日，因此**不得把這段當成 2026-09 的新上線事件**；只記為 current capability / strategy boundary。

### User job / reduced manual work

它把「訂完後自己反覆查價 → 發現變便宜 → 查 fare rules → 聯絡航空公司／OTA → 嘗試改票」的一部分串起來。

### Transferable / not-copy boundary

對 AI Flight Radar 可移植的只有較小原則：

- watched object 的 lifecycle 必須明確區分 `pre-book observation` 與 `post-book reservation`；
- alert threshold 與 triggering observation 要能解釋；
- no news / no threshold crossing 不能冒充「價格不曾變」；
- final action 是否可行取決於 fare rules / merchant / current availability，不能從 observer 自動推定。

**不應照抄：** reservation credential、payment/loyalty data、cancel/reissue/rebook authority、OTA/airline transaction automation。Owner direction已明確排除 booking/payment breadth，而且 current product 沒有真人 evidence 指出 post-booking savings management 是核心工作。

**Classification:** `ADJACENT IDEA / HOLD`；若未來出現真實需求，也應另作 product-direction decision，不掛在 #1/#4/#8 上偷渡實作權。

## C. Direct platform recheck — Google AI Mode 的 conversational price tracking 已是 known signal

**Status:** `CONFIRMED` first-party。  
**Published:** 2026-08-27。  
**Checked:** 2026-09-22 UTC / 2026-09-23 Asia/Taipei。  
**Source:** https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/

Google AI Mode 讓使用者在對話中描述 where/when，查看最新 flight options，之後明確確認 `track these flight prices` 才建立價格追蹤並用 email 通知。此訊號已在 #4 與先前 radar 多次記錄。

**Decision:** `KNOWN SIGNAL / DEDUPE -> #4 / NO DELTA`。

本輪不因 Google 同時有 points/miles 或 hotel booking 就擴產品；那些能力不是 AI Flight Radar 的 owner-approved core job。

# New Releases / strategy changes

| Date / status | Product | Change | Consequence for AI Flight Radar |
|---|---|---|---|
| 2026-07-01 | Skyscanner | `Explore with AI` + pricing/weather/duration comparison；DROPS 繼續擴大 price-drop discovery | 支持「AI discovery 與 real fare evidence 分層」；dedupe #4，不建 generic AI planner |
| 2026-05-04 | Going | Price Drop post-booking monitoring；10% first alert、之後每 5% | 相鄰 lifecycle；目前屬 HOLD，不擴成 reservation manager |
| current / change date UNKNOWN | Going Terms | optional authorization 可涵蓋 rebook/cancel/reissue 等 reservation effects | 重大 scope boundary，**DO NOT COPY**；product observer 不自動取得 transaction authority |
| 2026-08-27 | Google AI Mode | conversational flight-price tracking after explicit confirmation | 已知 #4 證據；無新 root cause |
| 2026-09-02 | Going editorial guide | 明確反對可預測的「固定時點降價」神話，建議用 alerts 而非假裝價格會按時序必然下降 | 支持目前 evidence-first／不做 opaque price prediction；不構成新 Issue |

Going 2026-09-02 source: https://www.going.com/guides/when-do-flight-prices-drop

# Community Pain

本輪沒有找到比第一方產品／Help／Terms 更能改變 current priority 的近期 Reddit/HN evidence，因此不為湊類別加入零散 anecdote。

先前 radar 已記錄 flexible-date / any-dates alert 的社群不一致；那仍只支持 #4 的 unsupported-constraint fail-closed，不建立發生率、ROI 或 P1/P2 severity。

# Adjacent Ideas

## 1. Explicit watch lifecycle phase — HOLD

只有未來真人 workflow 顯示使用者同時需要「未訂票 route watch」與「已訂票 exact-reservation watch」，才研究一個極小欄位：例如 `watch_phase=PRE_BOOK | POST_BOOK_REFERENCE`，並先保持 POST_BOOK read-only。研究問題必須能以少量 fixture 回答，不先接 reservation credentials、payment、airline account 或 rebooking。

Exit：
- `REJECT`：實際使用者只需要 pre-book fare radar；
- `NARROW`：只需要把已訂票基準價格作為人工輸入比較，不需 reservation integration；
- `BUILD`：只有真人 evidence 證明 post-book recheck 是高頻工作，且 owner 明確核定新產品範圍後，才另做最小 deliverable 決策。

現在不立案。

## 2. Keep natural-language promotion fail-closed — existing #4 NARROW

Skyscanner/Google 的 AI surface 只證明自然語言 discovery/track 很普及，不證明本產品需要 LLM。Current #4 已有可重播 counterexample 證明 unsupported dimensions 會被 silent-drop；最小方向仍是：只把可 review + executable 的欄位 canonicalize，其他 typed unsupported/block。

# Opportunity Map — AI Flight Radar

### MUST MATCH

- `NO_RESULTS`、provider failure、stale/unknown、observed quote、current recheck、final bookable price 必須分開。
- 對每個 watch / alert，保留 scope、source、observation time、trigger reason 與可重播的 threshold semantics。
- 自然語言要求若包含 UI/backend 尚未表示的 traveler/cabin/airline 等 constraint，不能 silently promote 成「已核對 watch」。
- scheduled/broad discovery freshness 契約必須在既有 request budget 下數學可持續；#6 仍是現有根因。

### SHOULD BE BETTER

- 比 generic metasearch 更明確呈現「這是歷史觀測／最近報價，不是保證可買」。
- broad discovery、explicit current check、durable watch 使用不同但可理解的 freshness semantics，而不是一律強迫同 cadence。
- alert 應避免用模糊的「便宜了」取代真正 threshold / baseline / age。

### DIFFERENTIATOR

- Taiwan-origin narrow focus + owner-controlled collection。
- source/freshness/coverage/error truth 和 no-fabricated-demo-fare discipline。
- historical-deal 判斷需有足夠既有 observation，而不是 opaque recommendation badge。
- future watch promotion 以 reviewed executable state 為核心，而非「LLM 說懂了」。

### ADJACENT IDEA

- read-only post-book reference price comparison；只有真人 evidence + owner scope change 才研究。

### DO NOT COPY

- reservation login / confirmation handling 作為預設產品資料面；
- autonomous cancel/reissue/rebook、payments、loyalty/ancillary management；
- destination-vibe / itinerary / hotel planner；
- generic AI travel agent、MCP travel platform；
- 為 flexible-date / AI discovery 無限制提高 provider call budget；
- 以競品 vendor engagement metric 當本產品 feature priority 證據。

# Cross-portfolio ideas

本輪沒有新的跨 portfolio primitive 通過立案門檻。

唯一可重用但已屬既有原則的是：**生成／語意解讀層不能自動取得 effect authority；promotion 前需 reviewable structured state，外部 effect 另行明確授權。** 這在多個 Reese-max 專案已有相同安全哲學，因此不建立新的 shared framework／ledger／registry。

# Rejected Ideas

1. **「Skyscanner 有 Explore with AI，所以新增 LLM travel discovery」— REJECT NOW。** Existing deterministic parser + reviewed state 已足以回答 current job；缺口是 constraint truth，不是模型聊天能力。
2. **「Going 已能 post-book rebook，所以新增 reservation manager」— REJECT / OUT OF SCOPE。** 會引入 credential、payment/loyalty、fare-rule、cancellation 與高風險 effect authority，且沒有本產品 user evidence。
3. **「DROPS 用 20% 就跟著固定 20%」— REJECT。** 競品 threshold 是其產品/資料設計，不是 Reese-max 的 calibration evidence。
4. **「把 #4 原本的 93/100 當高優先實作」— REJECT。** 2026-09-16 bounded experiment 已 `NARROW`；precision score 不取代 user evidence，也不自動取得實作權。
5. **「因競品更廣，現在加多 provider / booking / hotel / points」— REJECT。** Current #1/#6/#8 provider/freshness/capacity truth 尚未完成，breadth 不解 current root causes。

# Four-gate review

## Candidate 1 — Skyscanner-style AI discovery

### 1. Problem / value
目前沒有真人 evidence 顯示 AI Flight Radar 的核心使用者因缺 destination inspiration / vibe / weather AI 而無法完成台灣出發票價觀測。相反證據：現有 rule parser + filters 已支援窄工作，真正已證明的語意問題是 silent-drop unsupported constraints（#4 experiment）。

### 2. Priority
`OPPORTUNITY / severity=NOT_ESTABLISHED / decision_priority=LOW_MEDIUM / NEEDS_EVIDENCE / auto_implementation=false`。

### 3. Minimum solution
不新增功能。先維持 current parser/review 邊界；若日後 user evidence 要求 discovery，只先測「一個 free-form request → inspectable structured candidate」是否減少重輸，不建完整 planner。

### 4. Research / implementation separation
現階段 `HOLD`。沒有 BUILD decision。

## Candidate 2 — Going post-booking Price Drop / reservation effects

### 1. Problem / value
外部產品證明 post-booking savings 是一種產品工作，但 Reese-max repo/user evidence 尚未顯示這是 current supported job。現在不做的後果只是「產品仍是 pre-book evidence radar」，不是契約違反。

### 2. Priority
`OPPORTUNITY / severity=NOT_ESTABLISHED / decision_priority=LOW / NEEDS_EVIDENCE / auto_implementation=false`。

### 3. Minimum solution
不接 reservation provider。若未來真的需要，先以人工輸入「已付基準價」做 read-only comparison fixture；這比 credential/account/rebook automation 小很多，且保留安全界線。

### 4. Research / implementation separation
`HOLD / OUTSIDE CURRENT OWNER SCOPE`。任何 BUILD 都需要新的明確 owner product-scope decision；本雷達不提供該授權。

# Issue Mapping / dedupe

| Signal / candidate | Mapping | Decision |
|---|---|---|
| conversational search → explicit price tracking | #4 | KNOWN / DEDUPE |
| unsupported NLP constraints silently absent from review state | #4 bounded experiment | Existing `NARROW`; no update |
| broad discovery freshness vs explicit current lookup | #6 + prior radar | Existing semantics; no new root cause |
| provider/booking-handoff truth | #1 | Existing gate; external product breadth does not upgrade severity |
| flexible-date/provider expansion | #8 | Existing broad scope; no new authorization |
| post-booking reservation management | none | OUTSIDE CURRENT SCOPE / HOLD / no Issue |
| build reproducibility | #2 + open PRs #9/#11 | unrelated active scope; untouched |

No issue lock was acquired because this run performed no Issue/comment/shared-state mutation.

# Sources

## External / public web — primary intelligence

1. Skyscanner — Summer Product Release 2026, 2026-07-01  
   https://www.skyscanner.net/news/summer-product-release-2026-uk
2. Skyscanner Help — Price Alerts, updated 2026-03-20  
   https://help.skyscanner.net/hc/en-us/articles/115002499829-How-do-I-set-up-or-cancel-email-price-alerts
3. Skyscanner — Saved + Price Alerts current product guide  
   https://www.skyscanner.net/flights/advice/get-best-air-fares-skyscanner-price-alerts
4. Going Help — Price Drop: FAQs and More, 2026-05-04  
   https://help.going.com/hc/en-us/articles/48899618777748-Price-Drop-FAQs-and-More
5. Going — current Terms of Use, checked 2026-09-22 UTC; relevant feature-change date UNKNOWN  
   https://www.going.com/terms-of-use
6. Going — When Do Flight Prices Drop?, 2026-09-02  
   https://www.going.com/guides/when-do-flight-prices-drop
7. Google — AI Mode travel / flight price tracking, 2026-08-27  
   https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/

## Reese-max GitHub — product truth / direction / coordination only

- `Reese-max/ai-flight-radar@6228138337f950cb6399088c4f814f27a518e29e`
- `.github/quality-audits/2026-09-15T0208Z-product-board-audit.md`
- Issues #1/#2/#3/#4/#5/#6/#8；closed #7
- PRs #9/#10/#11
- #4 comments including 2026-09-16 bounded `NARROW` experiment
- prior report: `Reese-max/autodev-ng/docs/competitive-intelligence/2026-09-15T220016Z-external-radar.md`
- latest cursor source: `Reese-max/autodev-ng/docs/competitive-intelligence/2026-09-22T160036Z-external-radar.md`
- Issue Quality v2: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`

# What Changed

相對 prior AI Flight Radar radar：

- **新增 Skyscanner 產品策略 evidence**：2026 Summer Release 清楚呈現 AI discovery → flight-option click-through 的分層，支持 current #4 `NARROW` 而非 generic AI agent 擴張。
- **新增 Going post-booking workflow evidence**：Price Drop 把 watched object 從「想買的 route」延伸到「已存在 reservation」；current Terms 顯示可選 authorization 甚至可能涵蓋 rebook/cancel/reissue，但 change date UNKNOWN，所以只當 current strategy boundary，不冒稱近期上線。
- **沒有 repo product-code delta**：`ai-flight-radar/main` 仍 `6228138337f950cb6399088c4f814f27a518e29e`。
- **沒有新 root cause**：AI intent/track 仍 dedupe #4；provider truth仍 #1；capacity/freshness仍 #6；Fli breadth仍 #8。
- **沒有 priority upgrade**：competitor breadth / vendor metrics / commercial transaction capability 不能把 research/opportunity 升成 P1/P2 defect。
- **方向未被推翻**：反而強化 INVEST/SIMPLIFY——先讓觀測與 promotion truthful，再考慮 broader travel lifecycle；transaction authority 保持外部。

# Classification / scope calibration

- #4 historical body 仍保留舊 `93/100` 與較大型 WatchSpec 描述，但 2026-09-16 comment 已有較新的 bounded evidence，明確決定 `NARROW`。本輪 current index 以該 comment 為準，不再引用舊大方案作 implementation target。
- #1 舊標題帶 `[P1]`，但 #5 umbrella 已記錄較新的 v2 disposition：`VALIDATION_GAP / P2 / REGRESSION_CONTRACT / NEEDS_RUNTIME_VERIFICATION`。本輪不利用競品新聞把它重新升級。
- #8 的 Fli phase-1 已進 default branch，但 flexible-date / MCP / provider-primary 等後續仍不能從 Issue 存在直接推導為已授權；本輪沒有擴 scope。
- #7 closed/completed；本輪不把已修復 stale test 當成 current finding。

# Completion / gaps / cursor

- Fresh owner inventory：**42 owned / 41 unarchived**；pagination complete；page 2 empty。
- External categories：direct competitor、adjacent workflow、direct platform baseline 均完成；主要技術／產品主張以 first-party sources 為主。
- New Issues: **0**。
- Existing Issue/PR comments: **0**。
- Issue updates/reopens: **0**。
- Locks acquired: **0**（no mutation）。
- Implementation authorization: **0**。
- Runtime executions claimed: **0**。
- Gaps：沒有 live fare/handoff comparison、沒有 current route-age distribution、沒有真人 user evidence for post-booking workflow、Going Terms feature-change date UNKNOWN、Skyscanner engagement metric 為 vendor-reported。
- Notification threshold: **not met**。新 evidence 有助產品邊界校準，但沒有高價值且通過 Gate 的新產品機會、沒有推翻 owner direction、沒有新的 cross-project actionable capability，也沒有建立新 Issue 的充分證據。
- Next fair-rotation target：**`Reese-max/academic-mcp`**。
