# 外部競品／新品／工作流靈感雷達 — 2026-09-18T17:58:28Z

> 查閱日：2026-09-18 UTC（臺灣時間 2026-09-19 凌晨）。
> Issue Quality：`issue_quality_version: 2`；規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`（`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`）。
> 本輪只做公開網路研究、GitHub read 與新增中央報告；**沒有修改產品原始碼、CI/config、secrets、權限/settings，沒有建立實作 branch、merge/deploy、啟動 worker/run/GOAL、付費 provider request 或正式資料寫入。**

## Executive Summary

本輪重新以 connected GitHub 完整列舉 Reese-max owner inventory：**41 owned repositories／40 unarchived**；`obsidian-vault` 為 archived。一次 `per_page=100` 已涵蓋目前可見全集，沒有用舊 inventory 當全集，也不把與歷史 42/39 的差異解讀成刪除／新增原因。

上一輪 `2026-09-18T161010Z-external-radar.md` 指定下一個公平輪巡目標為 **`Reese-max/google-maps-personal-mcp`**，因此本輪以它為 primary repo。

目前 default branch 為 `main@800bc3b5adc3558a6ee9a5f296549098467596fb`；最新變更仍是 audit/docs。現行產品邏輯 baseline 仍是 `8bb6931b6d34f158aedf9ad6f652a7aef3822bcb`。Owner-approved 方向維持 **INVEST / SIMPLIFY**：durable truth 是使用者自己的 collections / notes / tags / priority 與允許長期保留的 place identity；Google Maps / Places 是 replaceable discovery / sync boundary，而不是個人資料的 canonical store。

本輪真正的新外部策略訊號是：**Google 已把通用 geospatial grounding 直接產品化成 Google-hosted Maps Grounding Lite MCP**，而且 2026-08-20 又把更完整的 routing / search-along-route 能力推進 Gemini Enterprise Agent Platform 的 GA。這使「讓 Agent 找地點、拿 Place ID、查天氣、算基本路線」更明顯成為 provider-owned commodity，而不是 `google-maps-personal-mcp` 必須自行擴大的差異化層。

四道 Gate 後結論：**0 新 Issue、0 既有 Issue 修改／留言、0 PR 留言、0 implementation authorization**。

這個訊號反而支持更小的產品策略：先把既有 #1/#2/#7 的 retention / mutation ownership / shared browser ownership 做對；若未來要降低自維護的 Places read surface，先測「官方 Maps Grounding Lite 作為 host-side companion MCP」而不是把 remote MCP 再包進本 MCP、重寫 provider layer，或做 generic agentic trip product。

下一個公平輪巡 cursor：**`Reese-max/herdr-skills`**。

---

## Direction / current GitHub coordination

### Owner-approved product direction

重新核對 Product Board、Round-2 fixed-persona audit、README、Issues、all-state PR 與 branches：

- 核心不是「自動化 Google Maps」，而是 local-first personal place knowledge + bounded optional Maps handoff。
- #1：Places provider-content retention boundary，`MAINTENANCE / P2 / NEEDS_REVIEW`；active PR #5。
- #2：same-collection sync ownership race，`BUG / P2 / NEEDS_REVIEW`；active PR #5 與 PR #6。
- #7：shared persistent Chrome profile ownership，`BUG / P2 / NEEDS_REVIEW`；尚未有 default-branch fix。
- #4：Place ID rollover continuity，`RESEARCH / NOT_ESTABLISHED / NEEDS_EVIDENCE`；不可因研究結果直接取得實作權。
- 現有 branches：`main@800bc3b...`、`fix/issues-1-2-sync-retention@a15c55d...`、`devin/issue-2@250ee22...`。
- PR #5 / #6 均 open；本輪沒有修改任何 active implementation scope。

Round-2 audit 仍為 **NOT CLEAN — streak 0/2**；本雷達不改 CLEAN 狀態，也沒有用 PR-local tests 冒充 default-branch / live provider evidence。

### Historical radar dedup

本輪也重新讀取先前兩輪對同 repo 的外部雷達，避免把舊點子換名重開：

- `2026-09-16T040537Z-external-radar.md` 已評估 Rego 的跨-library notes/tags retrieval；因沒有 owner/beta library 的真實規模／高頻痛點證據，維持 `ADJACENT IDEA / NEEDS_USER_SCALE_EVIDENCE`，沒有開 local-search Issue。
- `2026-09-16T220137Z-external-radar.md` 已用第一方 Google Maps Platform terms 校準 #1 / PR #5：不能把所有 Places fields 一律視為可 30-day cache；當時已 `DEDUP + SKIPPED_LOCKED_ACTIVE_PR#5`。
- Rego / Mapcove 的 export/backup、Mapstr / Takeout imports 也都已有歷史評估；在 retention boundary 與 owner workflow evidence 未穩定前，不重開。

---

# Product → Market Category

本輪只保留與 `google-maps-personal-mcp` 真正相關的市場類別：

1. **Provider-owned agentic geospatial grounding**：Google Maps Grounding Lite MCP、Grounding with Google Maps。
2. **Consumer agentic map experience**：Ask Maps / Personal Intelligence。
3. **Private personal place memory**：Rego；作為 differentiation / trust benchmark，而不是 native-app feature checklist。
4. **Do-not-copy boundary**：generic AI trip planner、native map renderer、booking/order agent、team collaboration、another identity platform、remote MCP orchestration framework。

---

# External Signals

## A. 直接 provider / substitute — Google Maps Grounding Lite 已把通用地理查詢 MCP 化

**CONFIRMED｜GA 2026-04-22；current docs checked 2026-09-18**

Primary sources:

- https://mapsplatform.google.com/resources/blog/powering-the-next-era-of-agentic-experiences-announcing-new-grounding-capabilities/
- https://developers.google.com/maps/architecture/grounding-with-maps-mcp
- https://developers.google.com/maps/ai/grounding-lite
- https://developers.google.com/maps/ai/grounding-lite/reference/mcp

Google 第一方現在提供 **fully managed / Google-hosted MCP server**，可由相容 host 直接連接 `https://mapstools.googleapis.com/mcp`。目前三個核心工具是：

- `search_places`：會回 AI-generated place summary，並附 **Place IDs、lat/lng、Google Maps links**；
- `lookup_weather`；
- `compute_routes`：目前提供 driving / walking 的距離與時間資訊。

這一點很重要，因為 `google-maps-personal-mcp` 現有 read-side 也在做 Places search/details，且 durable local workflow 最終需要的 connective identity 正是 Place ID。也就是「讓 Agent 從 Google 找到真實地點」現在已有官方 MCP 供應層，未來不應因為 AI/agent 趨勢就繼續擴張自家 generic geospatial intelligence。

但它**不是直接替代整個產品**：Grounding Lite 不保存 Reese-max 的 user-owned collections / notes / tags / priority，也不提供本 repo 的 Saved Lists bounded sync queue。官方文件也要求 attribution、LLM compatibility 與 Google Maps content 使用限制；導入它不會自動消除 #1 的資料邊界責任。

### User job / reduced step

可能可縮短的只是：

`Agent 想查一個地點／距離 → 自家 MCP Places client → 自家 schema / error / provider maintenance`

變成 host 同時配置：

`Google official Maps MCP 做 generic discovery → local personal MCP 只在使用者決定保存時接 Place ID + user-owned context`

這是**可能的架構簡化**，不是已證實的 user-value improvement。

### Limit / do not overclaim

- 尚未實際連線 Grounding Lite；沒有 latency / cost / tool-routing / host compatibility receipt。
- 官方 `search_places` 回 Place ID，但這不證明其 response shape 能無縫替代現有 `PlaceModel` 或所有 detail fields。
- Grounding Lite 仍按 Google Maps Platform billing/quota/terms 運作；不能以「官方 MCP」當作免費或免合規的同義詞。
- 不應在 local MCP 內先做 MCP-of-MCP proxy；host-side companion 是更小方案。

Decision：**ADJACENT IDEA / RESEARCH CANDIDATE / severity=NOT_ESTABLISHED / decision_priority=LOW-MEDIUM / NEEDS_EVIDENCE / auto_implementation=false**。未通過 Issue Gate。

---

## B. 新鮮能力變化 — Google 的較完整 Grounding stack 在 8/20 把 routing / search-along-route 推到 GA

**CONFIRMED｜2026-08-20｜checked 2026-09-18**

Source:

- https://mapsplatform.google.com/resources/blog/introducing-new-routing-features-in-grounding-with-google-maps/

Google 在 Gemini Enterprise Agent Platform 的 Grounding with Google Maps 新增並 GA：

- find directions；
- search along route；
- travel time / distance；
- road conditions / live traffic context；
- richer place attributes。

這不是 Maps Grounding Lite 同一產品層，因此本輪**沒有**把 enterprise Agent Platform 能力誤寫成 Lite MCP 已具備。它的策略意義是：Google 持續把 generic route intelligence 往 provider-owned agent layer 上移。

對 Reese-max 的最小結論：**不要因競品有 advanced routing 就把 `build_trip` 擴成 routing engine**。現有 `build_trip` 已明確是 simple deterministic helper；真正需要 traffic-aware routing 時，優先把 provider capability 視為可替換外部工具，而不是在 personal-memory repo 內重造。

Decision：**DO NOT COPY as local engine；provider capability watch only**。

---

## C. Consumer strategy — Ask Maps 把 Personal Intelligence 與 agentic action 放進原生 Maps

**CONFIRMED｜2026-08-06｜checked 2026-09-18**

Sources:

- https://blog.google/products-and-platforms/products/maps/order-food-in-ask-maps/
- https://blog.google/intl/en-in/products/ask-maps-gets-more-helpful-in-india/

Ask Maps 的近期方向包含 Personal Intelligence、real-time transit、conversation memory 與 agentic food ordering。使用者可以讓 Maps 結合已保存地點／偏好等 context，再由 agent 預先完成部分工作並讓使用者 review。

可移植的不是「做 food-ordering agent」，而是更清楚的定位分工：Google 本身正吸收 generic discovery + provider-side personalization；Reese-max 若有差異，應是**可檢查、local、user-owned 的個人脈絡與可替換 provider boundary**。

本訊號沒有推翻前輪 local-recall Gate：沒有新增真實 owner workflow evidence，不能因 Ask Maps 支援 memory 就把先前被延後的 global local-search idea 升成 feature Issue。

Decision：**DIFFERENTIATOR reinforcement / no new Issue**。

---

## D. Rego — privacy / durable ownership 仍是直接競品的信任主軸

**CONFIRMED｜privacy effective 2026-08-29；checked 2026-09-18**

Sources:

- https://www.rego.app/privacy/
- https://rego.app/

Rego 表示 place library（places / notes / photos / tracks / collections）存於裝置與 private iCloud，沒有 Rego server 持有該 library；export / share 也是使用者主動發起。

這只是持續支持 Reese-max 既有 local-first thesis；不是新的 export/search Issue 證據。前輪已評估 Rego 3 retrieval / export，因此本輪標記 **CORROBORATING / DUPLICATE**。

---

# New Releases / Current Changes

| Date | Signal | Evidence | Decision |
|---|---|---|---|
| 2026-08-20 | Grounding with Google Maps routing + search-along-route GA in Gemini Enterprise Agent Platform | Google first-party | Fresh strategic signal；generic routing stays provider boundary |
| 2026-08-06 | Ask Maps adds agentic actions / Personal Intelligence / real-time transit | Google first-party | Supports differentiation; no local-recall Issue without owner evidence |
| 2026-04-22 | Maps Grounding Lite MCP GA | Google first-party, newly mapped by this radar | Official MCP may be companion/substitute for generic read-side; research candidate only |
| 2026-08-29 | Rego privacy policy effective | Rego first-party | Corroborates local/private ownership; historical idea duplicate |

---

# Community Pain

本輪沒有取得足以改變 priority 的可靠 community incidence。

近期社群仍可看到使用者為 Google Maps Saved Lists → 其他 trip/planning tools 自建 extension / workaround，或抱怨 export/import handoff；這最多是 **COMMUNITY_SIGNAL**，不能外推成 Reese-max owner 的高頻痛點，而且 `existing-list import` 已在 Product Board / prior radar 被列為「research only with demand」。

因此：

- 不建立 import Issue；
- 不把 Takeout / Saved Lists reverse engineering 變成核心 roadmap；
- 不拿 anecdote 當使用量或留存證據。

---

# Adjacent Idea — Official Maps MCP as host-side companion, not nested dependency

若未來有實際證據要降低自家 Places read-side 維護面，最小研究順序應是：

1. **No change**：保留 current direct Places client；先完成 #1/#2/#7。
2. **Companion MCP**：在相容 host 同時配置 Google Maps Grounding Lite + `google-maps-personal-mcp`；前者只做 generic discovery / route facts，後者只處理 local user-owned memory / explicit save / bounded sync。
3. 只有 host 無法可靠把 returned Place ID 交給 local MCP、而且此 handoff 已被實際觀察成痛點，才考慮很薄的 adapter。**不要預先做 MCP proxy / orchestration framework。**

Bounded research exits：

- **BUILD**：3–5 個固定 discovery → save journeys 顯示 companion path 能少掉明確自維護/provider glue，同時保留 Place ID、attribution、成本／retention truth，且沒有增加更多手工 tool routing。
- **NARROW**：只把 Grounding Lite 用於 route/weather 等 local repo 不該擴張的工作；Places save flow仍沿用 current direct client。
- **REJECT**：host routing、response shape、cost、latency、terms 或 missing fields 讓整體 handoff 更複雜。

目前缺少會改變決策的 runtime／user evidence，因此不建 Issue。

---

# Opportunity Map — `google-maps-personal-mcp`

| Class | Decision |
|---|---|
| MUST MATCH | user-owned notes/tags/priority 不因 provider refresh / retention / ID transition 遺失；外部寫入 bounded / truthful / single-owner。 |
| SHOULD BE BETTER | 只有實證顯示維護 generic Places read surface 是負擔時，才用 provider-owned MCP 縮小自家 code surface。 |
| DIFFERENTIATOR | local durable personal memory + inspectable deterministic helpers + replaceable Google discovery/sync boundary。 |
| ADJACENT IDEA | Maps Grounding Lite 作為 host-side companion MCP；先不整合。 |
| DO NOT COPY | generic AI trip planner、traffic routing engine、food-ordering agent、native map renderer、hosted account/collaboration、MCP orchestration framework。 |

---

# Rejected / deferred ideas

1. **另開「global personal recall/search」Issue** — REJECT THIS ROUND / DUPLICATE. 2026-09-16 已研究；仍缺 owner library scale / high-frequency retrieval evidence。
2. **Google Maps list / Takeout import** — DEFER. Product Board 已要求 real demand；社群 workaround 不足以建立 Reese-max 需求率。
3. **以 Grounding Lite 取代整個 local MCP** — REJECT. 它沒有 local user-owned collection/notes/tags/priority 與 Saved Lists bounded sync semantics。
4. **把 remote MCP 嵌入 local MCP** — REJECT until companion-host experiment proves host orchestration insufficient。
5. **擴 `build_trip` 成 traffic-aware route engine** — REJECT. Google provider layer已在快速商品化，且 repo 無此 failure evidence。
6. **因 official MCP 存在就關閉 #1 retention concern** — REJECT. Grounding Lite 自己仍有 Google Maps content / attribution / LLM compatibility requirements。

---

# Issue Mapping / current coordination

| Tracking | Current calibration | This round |
|---|---|---|
| #1 retention boundary | MAINTENANCE / P2 / NEEDS_REVIEW | unchanged；active PR #5，no scope theft |
| #2 same-collection ownership | BUG / P2 / NEEDS_REVIEW | unchanged；active PR #5/#6 |
| #7 shared Chrome profile ownership | BUG / P2 / NEEDS_REVIEW | unchanged；official MCP does not fix external-write ownership |
| #4 Place ID rollover | RESEARCH / NOT_ESTABLISHED / NEEDS_EVIDENCE | unchanged |
| Official Maps MCP companion | RESEARCH candidate / NOT_ESTABLISHED / LOW-MEDIUM | central radar only；**no Issue** |

No lease was needed because this round did not modify an existing Issue/PR/shared tracker. No issue/comment write was attempted.

---

# Sources

Checked 2026-09-18 UTC:

1. Google Maps Platform — Maps Grounding Lite GA (2026-04-22): https://mapsplatform.google.com/resources/blog/powering-the-next-era-of-agentic-experiences-announcing-new-grounding-capabilities/
2. Google for Developers — Grounding agents with Maps Grounding Lite MCP: https://developers.google.com/maps/architecture/grounding-with-maps-mcp
3. Google for Developers — Maps Grounding Lite docs / billing / terms: https://developers.google.com/maps/ai/grounding-lite
4. Google for Developers — MCP reference: https://developers.google.com/maps/ai/grounding-lite/reference/mcp
5. Google Maps Platform — new routing features (2026-08-20): https://mapsplatform.google.com/resources/blog/introducing-new-routing-features-in-grounding-with-google-maps/
6. Google Maps — Ask Maps update (2026-08-06): https://blog.google/products-and-platforms/products/maps/order-food-in-ask-maps/
7. Google India — Ask Maps Personal Intelligence (2026-08-06): https://blog.google/intl/en-in/products/ask-maps-gets-more-helpful-in-india/
8. Rego privacy policy (effective 2026-08-29): https://www.rego.app/privacy/
9. Rego current product: https://rego.app/

GitHub evidence:

- `google-maps-personal-mcp main@800bc3b5adc3558a6ee9a5f296549098467596fb`
- product-code baseline `8bb6931b6d34f158aedf9ad6f652a7aef3822bcb`
- Quality v2 blob `8167e10798071d2276addaff6b201c6b0e904a2a`
- Active PR #5 head `a15c55de1b11b735542ea2a5502d6fa69077df56`
- Active PR #6 head `250ee226c758a1a10b54ebbf5b9a58c52828ee18`

---

# What Changed

1. Fair cursor moved from `flux-image-gen` to `google-maps-personal-mcp`；next = `herdr-skills`。
2. Fresh inventory remains connector-visible **41 owned / 40 unarchived**。
3. First radar mapping of **Google-hosted Maps Grounding Lite MCP** establishes that generic place/weather/basic-route grounding can now be treated as an official provider capability rather than a future hypothetical.
4. Fresh 2026-08-20 Google routing/search-along-route GA further strengthens the architectural signal that generic geospatial intelligence is moving up into provider agent infrastructure.
5. This does **not** pass a feature Issue gate: no runtime companion test, no observed user handoff pain, no measured reduction in setup/cost/maintenance, and existing #1/#2/#7 remain more important.
6. Previously rejected/deferred local recall/import/export ideas remain deferred; no duplicate Issue was created.

---

# Completion / evidence gaps / cursor

Completed:

- fresh owner inventory pagination;
- rule blob / owner direction / current HEAD / existing Issues / all-state PR / branches re-check;
- direct competitor/provider + adjacent workflow + current privacy benchmark web scan;
- historical radar dedup;
- four-gate decision and Opportunity Map;
- central report write only.

Still missing / intentionally not claimed:

- no live Maps Grounding Lite MCP call;
- no comparison of current Places client vs Grounding Lite latency/cost/response fidelity;
- no owner/beta workflow telemetry showing generic discovery maintenance or cross-tool handoff is a real pain point;
- no live Places API request;
- no signed-in Google Maps mutation / Playwright validation;
- no inference that official MCP removes Google content retention/attribution obligations;
- no portfolio CLEAN claim.

Next fair-rotation target: **`Reese-max/herdr-skills`**.
