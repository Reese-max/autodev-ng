# External Competitive Radar — 2026-09-20T12:02:34Z

Status: **COMPLETE**

查閱日：2026-09-20。主要市場情報來自 GitHub 之外的 Google Travel、KAYAK、Trip Manta、Kestrelia、Duffel 等第一方公開頁面；GitHub 僅用於 Reese-max 自有 repository inventory、owner 方向、default-branch 現況、Issue/PR 去重與中央報告寫入。

## Scope / Direction Check

- Governing rule：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected owner inventory：完整分頁列舉 **42 個 Reese-max-owned repositories / 41 個未封存**；offset 100 再查為空。唯一 archived repo 為 `obsidian-vault`。
- Fair-rotation focal repository：`Reese-max/ai-flight-radar`，承接上一輪 `2026-09-20T100800Z-external-radar.md` 的 cursor。
- Current default HEAD：`main@6228138337f950cb6399088c4f814f27a518e29e`；本報告寫入前重新核對未變。
- Owner direction：**INVEST / SIMPLIFY**。核心工作是「定義航班查詢 → 收集觀測 → 與可辯護的歷史比較 → 決定是否值得進一步查看」，不是 booking / purchase 產品。可信來源狀態、query identity、freshness、calibration 與 recheck-before-booking 優先於新 provider、支付、旅遊代理或廣泛功能。
- Current active scopes：#1 live quote/source calibration、#2 reproducible builds、#4 WatchSpec research、#6 route-capacity、#8 Fli provider migration 均已有追蹤；PR #9、#10、#11 仍 open。本輪不搶改 active scope。
- Current runtime evidence from repository audit remains materially important：fixed-persona Round 3 對目前 SHA 的 scheduled collector 已讀到 12 次 run，只有 1 次 success、11 次在 bounded batch 失敗；其根因仍應留在既有 #1/#6 調查，外部競品的高頻掃描不能用來合理化先提高採集頻率或擴大成本。
- 本輪未修改產品原始碼、CI/config、secrets、permissions/settings；未建立 implementation branch、未 merge/deploy、未啟動 worker/GOAL、未新增付費承諾或正式外部寫入。

## Product → Market Category

`ai-flight-radar` 現行產品屬於：

1. 台灣出發航線的 evidence-first fare observation / comparison radar；
2. same-query 歷史最低價比較、freshness 與 source-health 語義；
3. bounded collector + Cloudflare/D1 / local FastAPI/SQLite 的 self-hostable workflow；
4. 尚未證實 live source fidelity 的 early operational product，不是 booking engine；
5. 合理差異化在「可追溯的觀測事實、query identity、UNKNOWN/STALE/PARTIAL 誠實狀態、保守決策」，而非供應商廣度或購買閉環。

## External Signals

### A. CONFIRMED — Google Flights 已明確區分 route/date watch 與 specific-flight watch

**現行官方文件，查閱：2026-09-20。**

Source: https://support.google.com/travel/answer/6235879?hl=en

Google Flights 官方說明目前允許：
- 對 route + searched dates 追蹤；
- dates flexible 時追蹤 `Any dates`；
- 選定具體航班後，另行追蹤 specific flight；
- 價格發生 significant change 時寄送 email，並可能提示價格上升／fare expiring 的機率與 confidence。

**使用者工作:** 「我是在意這條路線任何合理低價，還是我已經挑中這班航班，只想知道它是否降價？」這兩種 watched object 語義不同。

**對本產品的意義:** 現行 `ai-flight-radar` 是 same-query minimum tracker，不保證歷次比較的是同航空公司、同航班或同 fare。這不是 bug；產品文件已誠實說明。但 external market 現在把 route-floor watch 與 exact-flight watch 當成兩個可理解的產品模式。若未來有真實使用需求，WatchSpec 應先明確記錄 watched-object semantics，而不是讓 UI 文案把「同查詢最低價下降」誤解成「你挑的那班降價」。

### A2. CONFIRMED — Google 把 price tracking 直接嵌進 AI Mode，但需要明確確認才建立追蹤

**發布：2026-08-27；查閱：2026-09-20。**

Source: https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/

Google Search AI Mode 已把自然語言旅遊規劃與 Google Flights price tracking 接起來：使用者描述想飛的時間／地點，要求追蹤價格，確認後才建立追蹤；之後以 email 通知變化。Google 同時把傳統 Flights 搜尋／航空公司或其他 booking platform 保留為最終選擇面。

這是既有 #4 `Intent → Review → Canonical WatchSpec → PromotionReceipt` 的**新鮮再確認**，不是新 fingerprint。本輪不另開「AI agent watch」Issue，也不因大型平台已有 AI Mode 就把 deterministic parser 換成 LLM。

### B. CONFIRMED — Trip Manta 把 exact-flight identity、threshold、check time 做成 alert 的核心可解釋內容

**現行產品，頁面含 2026 年觀測資料；查閱：2026-09-20。**

Sources:
- https://www.tripmanta.com/
- https://www.tripmanta.com/features/flight-price-tracker

Trip Manta 的產品流程是：搜尋 → 選定 specific flight → 設定 price target → 持續追蹤；alert 會列 previous price、current price、savings、itinerary、check time。Free plan 可有最多五個 trackers，其中一個 hourly；Pro 宣稱可 unlimited hourly trackers。

其「hourly 比 daily 找到更多降價」數字來自 Trip Manta 自己的 1.4M checks / 2026-04～07 self-analysis，屬 **VENDOR SELF-ANALYSIS**，只能視為產品策略／設計訊號，不能當成 `ai-flight-radar` 應提高掃描頻率的獨立 benchmark 或 ROI 證據。

**可移植部分:** watched object、觀測時間、threshold、previous/current value 與 review link 應在 alert receipt 中可核對。

**不應照抄:** hourly cadence、post-booking credit/refund workflow、與航空公司處理票券，不符合目前 scope；更不能在 #1/#6 未完成時先增加 request rate。

### B2. LIKELY / VENDOR CLAIM — Kestrelia 把 precision criteria 作為 2026 Q3/Q4 產品定位

**頁面標示 Pre-launch Q3 2026 Canada + USA first；查閱：2026-09-20。**

Source: https://kestrelia.com/en/about/

Kestrelia 宣稱把 route、budget、flexible dates、cabin、layovers、baggage、airlines、time windows 等多種條件組成 precise watch，並透過 multiple providers + email/push/SMS 通知。這是產品自述，尚不能當作獨立成效驗證。

對 `ai-flight-radar` 的可用訊號仍是：**精準的 watched-object / criteria contract 本身是一個產品面**。但 #4 已經涵蓋 canonical WatchSpec、unsupported field fail-closed、版本化與 promotion receipt；因此本輪只視為 #4 的外部支持，不另立「31 criteria framework」或 provider-aggregation Issue。

### C. CONFIRMED — Duffel 把 live offer 視為會過期、需要 booking 前再取一次的具體 object

**現行官方 API 文件，查閱：2026-09-20。**

Sources:
- https://duffel.com/docs/api/offers
- https://duffel.com/docs/api/overview/test-your-integration

Duffel 的 offer 有明確 `expires_at`，文件說明搜尋所得價格在真正下單前不保證仍可用，並建議 booking 前重新取得 single offer；其測試整合也提供 deterministic test scenarios，因為 live availability/price 本來就會變。

這與本 repo 的方向一致：`observed fare != bookable final price`，先用 fixtures 驗證 typed contract，再以 bounded live calibration 補外部 provider 事實。它**不支持**把 Duffel booking/order API 加入本產品；反而支持現有 #1 的 recheck / handoff fidelity gate。

## New Releases / Market Moves

| Date / state | Product | Signal | Confidence | Radar consequence |
|---|---|---|---|---|
| 2026-08-27 | Google Search AI Mode + Flights | conversational intent 可經確認直接建立 price tracking | CONFIRMED | 去重至 #4；支持 explicit promotion，不新增 agent architecture |
| Current 2026 docs | Google Flights | route/date、Any dates、specific flight 是不同 tracking modes | CONFIRMED | 新產品校準：future WatchSpec 應明確 watched-object semantics；目前無需改 same-query history |
| Current 2026 product | Trip Manta | exact-flight + threshold + detailed alert receipt + hourly tracking | CONFIRMED feature / vendor benchmark | 可移植 receipt clarity；拒絕用 self-benchmark 推高採集頻率 |
| Q3 2026 pre-launch | Kestrelia | precision criteria + multi-provider notifications | LIKELY / vendor claim | 支持 #4 precision contract；不自動擴 provider breadth |
| Current docs | Duffel | expiring concrete Offer + booking 前 re-fetch；deterministic test scenarios | CONFIRMED | 強化 #1 recheck/calibration；DO NOT COPY booking/order stack |

## Community Pain

本輪只保留一則低權重社群訊號：2026-09-17 Google Travel Community 有使用者聲稱 tracked flight 曾大幅降價再回升，但沒有收到通知。這是 **COMMUNITY_SIGNAL / single anecdote**，不能推算漏報率，也不能證明 Google 或任何產品普遍失效。

其唯一可移植問題是「notification condition met」與「notification delivered」應分開記錄；#4 原本就明確要求 alert receipt 保留 triggering observation 與 delivery state，因此不另開 Issue。

## Repository Truth / Counter-evidence

### Current price-history contract is intentionally query-floor, not exact itinerary

`docs/PRICE_INTELLIGENCE.md` 明確說：`search_snapshots` 每次成功查詢只保存一筆最低價與 query identity；同條件歷史比較的是 **same-query lowest quote**，並不保證歷次是同 airline / flight / fare。缺少 fare basis、baggage、sellability verification 時，也不能稱為精確同票種跌價追蹤。

這是重要反證：看到 Google/Trip Manta specific-flight watch，不能反過來把 current design 說成 defect。現在產品提供的是另一種合法工作：「這組條件下的最低觀測價是否變好」。

### Fli phase 1 already carries richer leg identity but is not yet a reason to expand persistence

Current `providers/fli_custom/mapper.py` 已能在 upstream 提供時保留 leg flight number；`providers/selector.py` 也允許顯式選擇 Fli，但 safe default 仍是 `fast_flights`，等待 runtime calibration。

因此若未來要研究 exact-flight watch，可以先重用既有 normalized leg identity；沒有理由先建新的 itinerary registry / provider manager / event store。

### Alert delivery exists locally, but Cloudflare collector intentionally does not send notifications

Local path 已有 opt-in notification/throttling；現行 throttler 會在先前已通知後，只有價格再低至少 5% 才允許同類 re-alert。Cloudflare scheduled collector 的 source comment 則明確說目前不實作 notification sending。

所以 Trip Manta/KAYAK 的 alert UX 不能被拿來宣稱 current public Cloudflare workflow「漏發通知」；目前更準確的是功能邊界尚未開啟／尚未由 #4 授權，而非已證實 regression。

## Adjacent Ideas

### 1. Explicit watched-object semantics — HOLD / NEEDS_EVIDENCE

Candidate question：使用者在建立 watch 時，是否需要選擇／理解：

- `QUERY_FLOOR`：追蹤這組 route/date/constraints 的最低觀測價；或
- `EXACT_ITINERARY`：追蹤已選定具體航班／行程的價格。

這兩者不能共享模糊的「這班機降價」文案。

目前分級：

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
evidence: NEEDS_EVIDENCE
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

**最小實驗（未授權，不執行）：** 不改程式；用 3–5 組 synthetic/current search fixtures，刻意讓同 query 的 cheapest itinerary 在不同觀測時間更換 flight identity。比較：若產品顯示 query-floor 降價，使用者是否仍可從既有 receipt 正確理解；只有實際觀察到「我以為是那一班降價」造成決策摩擦，才考慮把 watched-object mode 加進既有 #4 WatchSpec。

**BUILD:** 有明確使用者／runtime 證據顯示兩種模式皆重要，且 current wording/receipt 會造成錯誤決策。  
**NARROW:** 只需更清楚標示 `這組條件的最低觀測價`，不需 exact itinerary persistence。  
**REJECT:** target users 只需要 route/query-level deal radar，specific-flight watch 沒有額外價值。

不先建 itinerary DB、fare-basis service、background tracker framework 或 post-booking workflow。

### 2. Alert receipt clarity — EXISTING #4, DO NOT DUPLICATE

Trip Manta 的 previous/current price、itinerary、check time，Google/KAYAK 的 alert controls，都支持「alert 必須能回答：監控什麼、什麼值變了、何時觀測、為什麼通知、通知是否送達」。#4 已有 WatchSpec version + triggering observation + trigger reason + delivery state，因此沒有新 root cause。

### 3. Provider test fixtures before live provider claims — ALREADY SUFFICIENT DIRECTION

Duffel 的 deterministic test route pattern是相鄰參考，但 `ai-flight-radar` 已有 offline fixtures、typed provider errors 與 Fli mapping tests。真正缺口仍是 #1 的 bounded authorized live calibration；再建一套 sandbox framework 不會回答 live source fidelity。

## Opportunity Map — `ai-flight-radar`

| Bucket | Decision | Evidence / reason |
|---|---|---|
| MUST MATCH | 清楚區分 observed price 與 booking-time price | Duffel offer expiry/re-fetch；本 repo既有 #1 / PRICE_INTELLIGENCE 邊界 |
| MUST MATCH | watched object、query identity、observation time、trigger reason 可追溯 | Google specific-flight vs route watch；Trip Manta detailed alert receipts；既有 #4 可承接 |
| SHOULD BE BETTER | same-query history 的證據說明比競品 generic「deal」更可稽核 | 本 repo 已保留 query hash / historical evidence；不要稀釋成黑盒 prediction |
| DIFFERENTIATOR | Taiwan-origin + conservative history + typed stale/unknown + self-hostable evidence trail | owner direction；比 provider breadth 更符合產品定位 |
| ADJACENT IDEA | 在有使用者證據後，讓 WatchSpec 明確區分 `QUERY_FLOOR` vs `EXACT_ITINERARY` | Google + Trip Manta；目前需求未證實 |
| ADJACENT IDEA | Kestrelia 式多條件 precision watch | 已去重至 #4；先處理 unsupported/supported semantics，而不是追求 criteria 數量 |
| DO NOT COPY | hourly/高頻掃描 benchmark、booking/order/payment、post-booking refund、multi-provider breadth for its own sake | current collector reliability/capacity blockers + owner scope；vendor benchmark 非獨立成效 |

## Cross-portfolio Ideas

本輪**沒有建立新的跨 portfolio capability**。`explicit promotion + canonical watched object + evidence receipt` 的模式在 `ai-flight-radar #4` 已經具體化；若其他產品未來出現相同「把一次性意圖提升成長期監控」的真實斷點，可重用原則，但不因抽象相似就建立 portfolio registry/framework。

## Rejected Ideas / Why

1. **把 collector 改成 hourly / 更高頻率** — REJECT FOR NOW。Trip Manta 的 hourly 成效是 vendor self-analysis；本 repo 現有 scheduled runtime 本身仍有大量 bounded-batch failures，#6 的 capacity contract 也尚有 active PR。先提高頻率會放大成本與失敗，不解根因。
2. **立即實作 exact-flight tracking** — HOLD。current product contract 本來就是 query-floor；沒有證據顯示 target users 因此做錯決策。先以 #4 的 watched-object contract 做窄研究。
3. **多 provider aggregator / automatic provider failover** — REJECT AS NEW ISSUE。#8 已是 owner-authored provider migration，Phase 1 已有 FliCustomProvider；Kestrelia 的 multi-provider 只是 vendor feature claim，不能另創相同根因。
4. **加入 Duffel booking/order stack** — REJECT。違反目前產品 scope，增加支付、旅客資料、供應商契約與正式交易風險；真正可移植的是 re-fetch / expiry semantics。
5. **建立 notification delivery framework** — REJECT AS DUPLICATE. #4 已要求 delivery state；Cloudflare collector目前明確不負責發 notification，不能把尚未啟用的能力誤報為 bug。
6. **建立 fare/itinerary identity database 以支援所有未來模式** — REJECT AS OVERENGINEERING。若 exact-itinerary 需求成立，先評估既有 Fli normalized legs + WatchSpec 是否已足夠。

## Issue Mapping / Dedup

| Issue | 本輪新證據 | Decision |
|---|---|---|
| #1 live quote fidelity / collector gate | Duffel `expires_at` / re-fetch-before-booking；specialist trackers 強調 frequent recheck | **NO WRITE**：支持既有 recheck/calibration；不是新 root cause，且 active reliability scope |
| #4 Intent → WatchSpec | Google AI Mode 2026-08-27、Google specific-flight/route modes、Trip Manta exact-flight receipts、Kestrelia precision criteria | **NO WRITE**：高度相關但 fingerprint 相同；保留 watched-object semantics 作 narrow candidate，不擴 scope |
| #6 capacity | Trip Manta hourly/vendor benchmark | **NO WRITE**：不能用 competitor cadence 推高 authorized capacity；PR #9 active |
| #7 stale matrix test | current HEAD 已包含修正 commit | **NO WRITE**：不因 external radar 做 close/cleanup |
| #8 Fli provider migration | Kestrelia multi-provider positioning、Duffel provider API pattern | **NO WRITE**：owner scope 已存在且 phase 1 已部分實作；競品功能不證明 P1 severity |

New Issues：**0**  
Issue updates/comments：**0**  
PR comments/changes：**0**  
Implementation authorization：**0**

## Severity / Scope Calibration

- #1 舊標題中的 `P1 Research` 不能依 Issue Quality v2 解讀為已證實 P1 產品 defect；current audit 已將核心理解為 live calibration / validation gap 與 release-contract blocker。外部市場證據只提高「應誠實 recheck」的支持，不提高 defect severity。
- #8 標題中的 `P1 Architecture` 是 owner-directed architecture work，不代表外部 competitor 有 multi-provider 就證明 current product 有 P1 缺陷。本輪不重分級、不擴 scope。
- #4 的舊 93/100 Opportunity Score 不作立案充分條件；本輪仍以 User Pain=UNKNOWN、Strategic Fit=HIGH、Evidence=external pattern strong / internal user evidence weak、Effort=can be small research、Security/Cost=must stay bounded 的定性比較為主。

## Sources

First-party / primary product documentation:

1. Google Travel Help — Track flights & prices, current at 2026-09-20  
   https://support.google.com/travel/answer/6235879?hl=en
2. Google — How to book travel with AI Mode in Google Search, 2026-08-27  
   https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/
3. KAYAK — Find deals & plan trips with the KAYAK App, 2026-09-01  
   https://www.kayak.com/news/kayak-app/
4. KAYAK — Pricing and Price Alerts, current at 2026-09-20  
   https://www.kayak.com/c/help/pricing/
5. Trip Manta — Flight Price Tracker / exact-flight tracking, current at 2026-09-20  
   https://www.tripmanta.com/  
   https://www.tripmanta.com/features/flight-price-tracker
6. Kestrelia — About / pre-launch Q3 2026  
   https://kestrelia.com/en/about/
7. Duffel — Offers, current at 2026-09-20  
   https://duffel.com/docs/api/offers
8. Duffel — Test your integration, current at 2026-09-20  
   https://duffel.com/docs/api/overview/test-your-integration

Community signal retained only as anecdotal context, not frequency evidence:
- Google Travel Community thread dated 2026-09-17 about a claimed missed tracked-flight price drop; not used to establish defect prevalence.

## What Changed This Round

1. Fresh external research shows the market more clearly separating **route/query-level flexible tracking** from **specific-flight tracking**.
2. This creates a useful product question for `ai-flight-radar`, but current repository evidence proves its query-floor semantics are intentional and documented; therefore it is **not a bug**.
3. The narrow candidate is watched-object semantics inside existing #4, not a new tracking architecture.
4. Specialist competitors increasingly market hourly/high-frequency alerts, but current repo runtime and #6 capacity evidence make **“increase cadence” the wrong next step**.
5. Duffel’s expiring-offer / re-fetch semantics strengthen the existing evidence-first direction rather than suggesting booking integration.
6. No external evidence passed all four gates for a new Issue or justified modifying active Issue/PR scope.

## Completion / Gaps / Cursor

- Inventory：COMPLETE — 42 owned / 41 unarchived; pagination exhausted.
- Governing rules：COMPLETE — blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Focal default HEAD：`6228138337f950cb6399088c4f814f27a518e29e`, rechecked before report write.
- External exploration：COMPLETE for this focal round across direct competitor, adjacent API/workflow, current/new product signals.
- Runtime tests：**NOT EXECUTED** in this radar. Existing repository runtime evidence is referenced but not re-labelled as this run's execution.
- Source limitations：Trip Manta performance numbers and Kestrelia capability/breadth are vendor claims; no independent performance conclusion is made.
- Issue/PR writes：none; no lock required because no Issue/shared-state mutation was attempted.
- Portfolio CLEAN：**NOT DECLARED**.
- Next fair-rotation cursor：`Reese-max/academic-mcp`.
