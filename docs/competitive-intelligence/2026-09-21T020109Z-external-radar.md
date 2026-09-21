# External Competitive / New-Product / Workflow Radar — 2026-09-21T02:01:09Z

Status: **COMPLETE / NO-NOTIFICATION DELTA**

查閱日：2026-09-21 UTC。主要市場情報來自 GitHub 之外的 Google、KAYAK 與 Hopper/CommBank 公開第一手頁面；GitHub 僅用於 Reese-max 自有 repository inventory、owner 方向、default-branch 現況、Issue / PR 去重、既有 runtime evidence 與中央報告寫入。

## Scope / direction / evidence boundary

- Governing rule：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected owner inventory：完整分頁列舉 **42 個 Reese-max-owned repositories / 41 個未封存**；offset 100 再查為空。唯一 archived repo 為 `obsidian-vault`。
- Fair-rotation focal repository：`Reese-max/ai-flight-radar`，承接上一輪 `2026-09-21T000021Z-external-radar.md` 的 cursor。
- Current default branch：`main@6228138337f950cb6399088c4f814f27a518e29e`；最新 default-branch 產品變更仍停在 2026-09-15 的 48-route test-contract 修正。
- Owner direction re-read：**INVEST / SIMPLIFY**。產品維持 Taiwan-origin、evidence-first fare observation radar；優先修 source truth、freshness、bounded capacity、quote/handoff evidence，不擴張 booking、payments、hotel search、multi-tenant travel SaaS 或 generic MCP travel platform。
- `docs/ROADMAP.md` 仍把授權真實報價取樣/來源健康列 P0，把第二獨立票源列 P2；不新增自動購票或付款。
- Open PR #9 正處理 #6 capacity/cadence 與部分 #2；PR #11 另處理 #2；PR #10 為 audit-only。這些 active scopes 本輪不搶改。
- 本雷達沒有執行新的 provider query、訂票頁比較、購買、部署、workflow rerun、產品 source/config/CI 修改、branch、merge、GOAL、worker 或 paid action。
- 本輪讀取既有 GitHub scheduled collector runtime evidence；這不是本雷達啟動的外部實驗。
- Portfolio CLEAN **未宣告**。

## Product → market category

`ai-flight-radar` 仍應視為 **有來源、時間與失敗語義的機票價格觀測雷達**，而不是完整旅遊搜尋／交易平台：

1. broad discovery observation 與 current recheck / durable watch / final bookable fare 分層；
2. source、observed_at、freshness、NO_RESULTS / ERROR / UNKNOWN 不混為一談；
3. request/cost budget 是產品契約的一部分；
4. 使用者需要的最終動作是「是否值得現在重新確認」，不是由產品代替購買。

## External Signals

### A. Direct competitor — Google AI Mode price tracking remains the strongest recent search→watch signal

**CONFIRMED — Google, published 2026-08-27; rechecked 2026-09-21.**

Source: https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/

Google 把 Google Flights price tracking 直接放進 AI Mode：使用者描述航程、看最新結果，明確要求追蹤後再確認，之後以 email 收到價格變化；真正購票仍轉至航空公司或 booking partner。這仍支持 `transient reviewed intent -> explicit confirmation -> durable watch`，但此 fingerprint 已由 `ai-flight-radar #4` 追蹤，因此 **DEDUPED**，不開新 Issue。

Google 同篇也把 points/miles 與 hotel booking 擴進 AI Mode。這是大型平台的 commerce / rewards bundling，不推翻 owner 方向；對目前產品分類為 **DO NOT COPY**。

### B. Adjacent workflow — KAYAK is packaging discovery, alerting, trip-state and live-flight status together, but still keeps freshness contracts distinct

**CONFIRMED — KAYAK app article published 2026-09-01; current help rechecked 2026-09-21.**

Sources:
- https://www.kayak.com/news/kayak-app/
- https://www.kayak.com/c/help/pricing/
- https://www.kayak.com/c/help/search/

KAYAK 的近期 app packaging 把 Price Alerts、Explore、Trips、Flight Tracker/live updates 與 offline itinerary access 集中到同一 mobile surface。可移植訊號不是「做更多 travel features」，而是每種任務仍有不同證據/時效：

- Explore 顯示最近約 48 小時找到的 discovery fares，並明示要再查 current price；
- 多數 Price Alerts 以 daily refresh 為主，另有 significant-price-change real-time alerts；
- live flight status 又是另一種更即時的資料契約。

這再次支持先前 #6 radar 已記錄的 `broad discovery snapshot != current search != durable watch != final bookable fare`。它**沒有提供新的 Reese-max 使用者證據**去指定某個數字 SLA，也沒有理由在 PR #9 active 時再改 scope。分類：**SHOULD BE BETTER / DEDUPED / SKIPPED_LOCKED**。

### C. Adjacent commerce — Hopper/CommBank turns prediction into financial guarantees and checkout

**CONFIRMED current product page; last updated 2026-08-20; checked 2026-09-21.**

Source: https://travelbooking.hopper.com/

CommBank Travel Booking（Hopper 提供）把 AI price prediction 直接接上 flight/hotel/car booking、price-drop travel credit、lower-price guarantee，以及 points/card checkout。

這代表 prediction 可被大型交易產品包成 financial promise，但這**不是**證明 `ai-flight-radar` 應提供同類 guarantee。若沒有自己的 calibration、merchant economics、terms 與交易 authority，照抄反而會把「觀測證據」錯升成「價格承諾」。分類：**DO NOT COPY**。

## New Releases / Market Moves

| Date | Product | Signal | Confidence | Radar consequence |
|---|---|---|---|---|
| 2026-09-01 | KAYAK App | Price Alerts + Explore + Trips + live flight tracking + offline itinerary in one mobile surface | CONFIRMED first-party | packaging signal only; no new issue |
| 2026-08-27 | Google AI Mode | conversational flight-price tracking after explicit confirmation; rewards + hotel booking expansion | CONFIRMED first-party | tracking dedupes to #4; commerce out of scope |
| updated 2026-08-20 | Hopper / CommBank Travel Booking | price prediction + credit/guarantee + booking/payment | CONFIRMED product page | reinforces evidence-vs-financial-promise boundary |

No retained source this round establishes a new provider-quality benchmark, Reese-specific demand frequency, or measurable ROI.

## Community Pain

本輪沒有保留新的社群訊號。既有 Reddit flexible-date / alert friction 已在歷史 radar 記錄；沒有新增可推翻既有決策的第一手或可重現證據，因此不為湊類別重複引用。

## Current repository/runtime truth

Current default HEAD remains `6228138337f950cb6399088c4f814f27a518e29e`.

The latest scheduled collector run inspected in this round was GitHub Actions run `35547995188`, started **2026-09-21T00:31:57Z** on that exact SHA. Setup and dependency installation succeeded; `Run a bounded batch` executed with `RADAR_COLLECTOR_ENABLED=true` and returned:

```json
{"run_id":"2295b1dc-eb92-450f-85d5-80ff678b886f","attempted":1,"observed":0,"errors":1}
```

then exited with code 2.

This is real runtime evidence that the scheduled path remains enabled and still encounters collector errors. It is **not** enough to identify provider root cause, prove quote inaccuracy, or claim an upstream outage because the current sanitized result does not expose the typed error category. PR #10 had already documented a repeated failure pattern on the same product SHA, so this run is **new timestamped evidence but not a new fingerprint or material status transition**.

Accordingly:

- #1 remains `VALIDATION_GAP / P2 / decision_priority=HIGH / NEEDS_REVIEW / NEEDS_RUNTIME_VERIFICATION` under its Issue Quality v2 calibration;
- no new Issue is created for the repeated scheduled failure;
- no #1 comment is added because the evidence does not yet add typed root cause or a new decision state;
- #6 remains owned by active PR #9 and is not rewritten;
- #2 remains covered by active PR #9/#11.

## Opportunity Map — `ai-flight-radar`

### MUST MATCH

- source + observation time + route/date/currency/stops/freshness;
- `NO_RESULTS`, provider error, stale/unknown, observed quote and final bookable fare remain distinct;
- advertised freshness must be mathematically sustainable under bounded request budget;
- consequential booking intent requires current recheck/handoff, not cached-discovery confidence.

### SHOULD BE BETTER

- make broad-discovery freshness class explicit rather than pretending every route has transaction-level freshness;
- expose degraded coverage / last successful observation instead of only a generic collector heartbeat;
- preserve exact reviewed intent when eventually promoting to a durable WatchSpec (#4).

### DIFFERENTIATOR

- Taiwan-origin focus with visible evidence thresholds and honest UNKNOWN/STALE states;
- owner-controlled collection without fabricated fares;
- explainable historical evidence rather than opaque “cheap” labels.

### ADJACENT IDEA

- Mobile/offline trip packaging exists in KAYAK, but no Reese evidence shows itinerary management is a current core job. **HOLD**.

### DO NOT COPY

- points/miles marketplace, hotel booking, payments, price guarantees/credits;
- arbitrary competitor freshness numbers;
- unbounded flexible-date expansion;
- more providers before source admission/capacity contracts are stable;
- a new scheduler/database/framework for existing #1/#6 problems.

## Rejected / deferred ideas

1. **Create a new alert/WatchSpec Issue from Google AI Mode — DUPLICATE.** Existing #4 already owns it.
2. **Turn KAYAK app breadth into a mobile itinerary roadmap — REJECT for now.** No Reese-specific pain/evidence; outside current north star.
3. **Offer price-drop credits/guarantees like Hopper/CommBank — REJECT.** Requires transaction/economic authority the product does not have.
4. **Open another collector-error Issue from run 35547995188 — REJECT/DUPLICATE.** It strengthens #1 runtime evidence but supplies no new root cause; repeated untyped failure is already tracked.
5. **Raise request budget because scheduled runs still fail — REJECT.** Errors are not evidence that more capacity fixes the cause, and PR #9 already owns cadence/capacity.
6. **Switch Fli primary because another scheduled fast_flights run failed — REJECT.** Current evidence does not establish comparative provider quality; #8 and #1 still require bounded calibration.

## Issue Mapping

| Candidate / signal | Mapping | Decision |
|---|---|---|
| Google conversational search → confirmed price watch | #4 | DEDUPED; no write |
| Broad discovery vs current/alert freshness classes | #6 + prior external radar | DEDUPED; active PR #9 => SKIPPED_LOCKED |
| Latest scheduled collector `1 attempted / 0 observed / 1 error` | #1 | existing VALIDATION_GAP; no material state change, no comment |
| Reproducible dependency installs | #2 | active PR #9/#11; no write |
| Hopper/CommBank booking/guarantee model | none | DO NOT COPY; no issue |

## Cross-portfolio idea

`discovery evidence != action authority` continues to be a useful principle across monitoring products: cached/aggregated evidence can support discovery, while consequential action should require a narrower current verification. This is a design invariant only, **not** authorization for a shared framework/service.

No cross-portfolio Issue was created.

## What Changed

- Fresh owner inventory reverified: **42 owned / 41 unarchived**, second page empty.
- Rules blob unchanged: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- `ai-flight-radar` HEAD unchanged: `6228138337f950cb6399088c4f814f27a518e29e`.
- Recent external product packaging was rechecked; no new market signal passed the four gates for a new Issue or owner-direction change.
- Fresh runtime receipt: scheduled collector run `35547995188` on 2026-09-21 again failed with `attempted=1, observed=0, errors=1`; no typed root cause exposed.
- **0 new Issues; 0 Issue comments/updates; 0 PR comments/updates; 0 implementation authorization.**
- Notification threshold: **not met** — no new high-value opportunity, major competitive strategy delta beyond already-recorded signals, evidence-backed new shared capability, or external evidence overturning owner direction.
- Next fair-rotation cursor: `Reese-max/academic-mcp`.

## Sources

External first-party/public web:

1. Google — *3 new ways to plan and book travel in Search*, 2026-08-27: https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/
2. KAYAK — *Find deals & plan trips with the KAYAK App*, 2026-09-01: https://www.kayak.com/news/kayak-app/
3. KAYAK — *Pricing and Price Alerts*, current page checked 2026-09-21: https://www.kayak.com/c/help/pricing/
4. KAYAK — *Search and discovery*, current page checked 2026-09-21: https://www.kayak.com/c/help/search/
5. CommBank Travel Booking / Hopper, last updated 2026-08-20: https://travelbooking.hopper.com/

Internal evidence used only for Reese-max truth / dedupe:

- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- `Reese-max/ai-flight-radar/.github/quality-audits/2026-09-15T0208Z-product-board-audit.md`
- `Reese-max/ai-flight-radar/docs/ROADMAP.md`
- Issues #1–#8, open PR #9/#10/#11, current default branch and scheduled Actions run `35547995188`.

## Completion / gaps / cursor

Status **COMPLETE** for this rotation. No external provider/booking runtime experiment was authorized or executed, so actual quote fidelity and final-price mismatch remain governed by #1. Current collector errors remain untyped in the available scheduled summary. Next cursor: `Reese-max/academic-mcp`.
