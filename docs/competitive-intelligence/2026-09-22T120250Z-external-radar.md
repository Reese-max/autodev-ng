# 外部競品／新品／工作流靈感雷達 — 2026-09-22T12:02:50Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / FRESH EXTERNAL SIGNALS / NO NEW ACTIONABLE ISSUE / NO USER NOTIFICATION**。
- 主要情報來源為 Reese-max GitHub 之外的公開網路；GitHub 僅用於 current product truth、owner direction、Issue/PR 去重、協調與持久化。
- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`；rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected-owner pagination：**42 Reese-max-owned repositories / 41 unarchived**；第二頁為空；`obsidian-vault` 是目前唯一 archived repo。沒有用舊 inventory 當全集。
- 本輪 fair-rotation focus：`Reese-max/google-maps-personal-mcp`。
- Current default branch：`main@800bc3b5adc3558a6ee9a5f296549098467596fb`；目前 HEAD 仍是 audit/docs commit，candidate-facing product baseline 為 `8bb6931b6d34f158aedf9ad6f652a7aef3822bcb`。
- Owner-approved direction 沿用既有 Product Board / prior radar：**INVEST / SIMPLIFY**。Local SQLite 是 collections / notes / tags / priority 的 durable personal truth；Google Places / Google Maps 是可替換的 discovery 與 bounded sync surface。沒有證據支持擴成 full travel SaaS、social graph、cloud collaboration、generic identity framework 或新 provider breadth。
- Current open Issues 已重新核對：#1 Places retention、#2 same-collection sync ownership、#3 fixed-persona umbrella、#4 Place-ID rollover research、#7 shared-Chrome-profile write ownership；closed Issue search 為空。
- All-state PR 已重新核對：PR #5 / #6 仍是 #1/#2 的未落地候選；default branch 不把 PR 內容當成已修復。#7 的 shared-profile root cause 仍是獨立 scope。這輪不留言、不搶 active scope。
- `autodev-ng/main` 寫入前可見 HEAD：`9699833362d7913a3f5374fff07e9b52d16aec72`。
- 本輪沒有執行 live Places request、登入 Google Maps 的 Playwright write、CI trigger、production/deploy、付費 provider、worker/GOAL、secret/permission/settings 變更，也沒有修改產品 source/config。
- 本雷達不宣告 portfolio CLEAN。

## Executive decision

**0 new Issue、0 existing Issue/PR comment、0 implementation authorization。**

本輪外部訊號足以強化三個設計原則，但都沒有通過「新 Issue」四道 Gate：

1. **Google Maps link / shared-list → candidate import → user commit** 已被 Triply 2.1 產品化，但 `google-maps-personal-mcp` 尚無 owner-frequency evidence 證明 Maps/link/list re-entry 是核心瓶頸；prior radar 已把 importer 需求留在 HOLD，這輪不重新包裝成新 feature。
2. Tripsy 3.10.2 修掉「MCP 加入 activity 的 link 無法在 app 打開」的實際 handoff defect，提醒 **link / deep-link 是可驗證的 user-facing contract**；current repo 確實保存並回傳 Google `googleMapsUri`，但本輪沒有任何 source/runtime evidence 顯示它的官方 Maps URL 壞掉，所以不能冒稱 regression。
3. Google Maps Grounding Lite MCP 讓 commodity place search / routes / weather 更接近平台能力；這只再次支持「不要把搜尋 wrapper 當護城河」。本產品更應守住 user-owned local context、explicit save/sync authority、Place-ID continuity、provider-retention truth 與 external-write receipts。此平台訊號先前已出現，本輪只校準、不另開 migration/provider Issue。

---

## Product → market category mapping

`google-maps-personal-mcp` 本輪對照：

1. **Direct / close substitute for saved-place workflow**：Triply AI（Google Maps link/shared-list ingestion + saved-place-aware planning）。
2. **Adjacent MCP/travel workflow**：Tripsy（AI/MCP modifies itinerary with user-visible app handoff）。
3. **Platform substitute for commodity discovery**：Google Maps Grounding Lite MCP。
4. **Current product job**：私人、local-first 的 place memory + deterministic ranking/trip helpers + bounded Google Maps Saved Lists handoff；不是全功能 itinerary SaaS。

# External Signals

## A. Direct competitor — Triply 2.1 turns a Google Maps link/list into an AI-visible candidate surface

**Status:** `CONFIRMED` via current product site + App Store version history.  
**Release date:** 2026-09-05（App Store version 2.1）。  
**Checked:** 2026-09-22.  
**Sources:**
- https://apps.apple.com/tw/app/triply-ai-trip-planner/id6758882852
- https://triplyplanner.com/

Triply 2.1 lets its AI reason over saved places/trips, accept a Google Maps link, ingest an entire shared list, and receive links shared directly from the Maps app. Its current product copy also says a generated plan is presented as a card and **nothing is created until the user taps it**; it additionally uses live opening-hour checks rather than assuming schedule data from model memory.

### User job / friction removed

The useful pattern is not “AI trip planner” itself. It reduces:

`Google Maps shared list / place link → manually reopen every place → re-enter into another collection/planner → manually map identity again`.

The transferable pattern is:

`external Maps artifact → grounded candidate Place IDs → review/explicit action → durable personal state`.

### Repo mapping / counter-evidence

Current repo already separates `search_places` from `save_place`: search returns normalized `place_id` / `google_maps_url`, while durable collection membership requires a separate explicit save call. It already has local notes/tags/priority and `build_trip`; therefore a large import/planner subsystem is not required to imitate Triply.

Prior Maps radars already held screenshot/list/link import because owner workflow frequency was unproven. Triply 2.1 is stronger current market evidence that the workflow exists, **not evidence that this owner needs it now**.

**Classification:** `OPPORTUNITY / severity=NOT_ESTABLISHED / decision_priority=LOW_MEDIUM / triage=NEEDS_EVIDENCE / auto_implementation=false`.

**Decision:** `REINFORCE_EXISTING_HOLD / NO ISSUE`.

Smallest future experiment, only if real re-entry friction is observed: accept exactly one Google Maps place/list URL format, resolve to candidate Place IDs, show candidate counts/details, require explicit review, then reuse existing `save_place`. Do not build social-video ingestion, generic crawler/OCR, inbox database, itinerary service or cross-provider resolver first.

## B. Adjacent MCP reliability — Tripsy 3.10.2 fixes broken links created through MCP

**Status:** `CONFIRMED` first-party changelog.  
**Published:** 2026-09-20.  
**Checked:** 2026-09-22.  
**Source:** https://tripsy.app/updates

Tripsy 3.10.2 explicitly fixes an issue where **links added to activities via MCP would not open in the app**. This is a useful product-quality signal because the underlying write could look successful while the downstream handoff artifact was unusable.

### Transferable principle

For cross-surface MCP products, “a value was written” is weaker than:

`canonical identity + usable handoff link + target-visible read-back / verification`.

Current repo already stores Google Places `googleMapsUri` as `Place.google_maps_url` and returns it through search/details. Separately, its Google Maps Saved Lists mutations have explicit verify tooling. That architecture is already pointed in the right direction.

### Gate result

There is **no evidence** in current source, Issues, PRs or runtime receipts that `google_maps_url` is malformed or that the repo generates a broken app deep-link. Google supplies the URI itself. Therefore this remains a **design/checklist signal**, not a BUG or VALIDATION_GAP ticket.

**Classification:** `MAINTENANCE / severity=NOT_ESTABLISHED / decision_priority=LOW / triage=NEEDS_EVIDENCE / auto_implementation=false`.

**Decision:** `REPORT_ONLY`.

If a real handoff defect later appears, the minimum verification is one returned Google Maps URL opened/read back in a bounded non-mutating smoke at the affected SHA; no link registry, redirect service or generic deep-link framework is justified.

## C. Platform capability — Google Maps Grounding Lite MCP commoditizes basic place search

**Status:** `CONFIRMED` current first-party documentation.  
**Publication/release date:** current capability; original platform launch is older than this scan window, so this report does not pretend it is a new September release.  
**Checked:** 2026-09-22.  
**Sources:**
- https://developers.google.com/maps/architecture/grounding-with-maps-mcp
- https://developers.google.com/maps/ai/grounding-lite/reference/mcp

Google now offers a fully managed Maps Grounding Lite MCP server with `search_places`, weather and route tools. Place search can return Place IDs, coordinates and Google Maps links; access supports API key or OAuth.

This is not a reason to nest Google’s MCP inside this local MCP or rewrite the provider layer. It is evidence that **basic geospatial lookup is becoming commodity infrastructure**. The defensible layer for this repo is the user-owned place memory and trustworthy effect boundary, not wrapper count.

**Decision:** `REINFORCE_DIRECTION / NO ISSUE`.

# New Releases / strategy changes

| Date | Product / change | Confidence | Consequence |
|---|---|---|---|
| 2026-09-20 | Tripsy 3.10.2 fixes MCP-created activity links not opening | CONFIRMED | Treat cross-surface link usability as verifiable handoff contract; no current repo defect proven |
| 2026-09-05 | Triply 2.1 adds saved-place-aware AI, Google Maps link/shared-list ingestion and direct Maps sharing | CONFIRMED | Strengthens reviewable import opportunity; owner demand/frequency still unproven |
| current 2026-09-22 | Google Maps Grounding Lite MCP exposes managed place search/weather/routes | CONFIRMED | Commodity discovery should remain replaceable; local personal truth/effect receipts are the stronger differentiation |

# Community Pain

本輪搜尋近期 Google Maps saved-list / MCP / import 討論，沒有找到足以改變優先級且可可靠映射到 owner workflow 的新鮮社群證據。舊 Reddit saved-list disappearance anecdotes 年代較早、案例零散，也不能用來推估本產品使用者的發生率或證明 Google Maps sync target 普遍不可靠。

因此沒有為了湊 Community Pain 類別引用 anecdote，也沒有把歷史個案升成 P1/P2。

# Adjacent Ideas

## 1. One-format Google Maps link/list capture — HOLD

只在 owner 真實使用紀錄反覆出現「從 Maps list/link 搬回 local collection」的人工重輸時研究。

最小實驗：
1. 固定一種 input URL；
2. resolve candidates，不寫入；
3. 顯示候選 Place IDs / canonical names / source pointer；
4. explicit select；
5. reuse existing `save_place()`；
6. ambiguous / inaccessible list → explicit partial/unsupported，不猜。

Exit：
- `BUILD`：多次真實 workflow 顯示重輸摩擦，且 bounded parser 能穩定減少手工 re-identification；
- `NARROW`：只單一 Maps place URL 有穩定價值；
- `REJECT`：現有 search + save 已足夠，或 shared-list extraction 不可靠/政策不適合。

No issue now.

## 2. Handoff-link smoke — checklist only

若之後有 product code 生成／轉換 URL，而非直接透傳官方 `googleMapsUri`，再把「link opens target surface」納入 bounded contract test。現在不建立 deep-link service。

## 3. Managed Maps MCP as future discovery substitute — HOLD

如果未來現有 Places wrapper 成為維護負擔，先比較 2–3 個 read-only operation 的 schema、成本、provenance、field control 與 failure semantics；沒有實測前不做 migration。Google managed MCP 不具有 Saved Lists mutation，因此也不能替代本 repo 的完整 job。

# Opportunity Map — `google-maps-personal-mcp`

### MUST MATCH

- Local user-authored collections / notes / tags / priority 與 provider-owned Places content 分離；#1 仍是優先 correctness boundary。
- 同一 collection queue ownership 與 shared Chrome profile ownership 不得因 active PR 未合併而被當成已修好；#2 / #7 保持現狀。
- Place ID rollover 不能靜默丟失 personal metadata；#4 的 bounded research 仍正確。
- 外部 artifact / model extraction 不能自動取得 durable save 或 Google Maps write authority。

### SHOULD BE BETTER

- 若未來支援 link/list import，candidate → explicit review → canonical local commit 應比 opaque bulk import 更清楚。
- 跨 surface 的成功 receipt 應能指向 canonical Place ID、target-visible state 或可用 handoff link；但只在產品真的產生該 artifact 時驗證。
- Basic provider discovery 應保持可替換，避免把產品價值綁在自製 API wrapper 數量。

### DIFFERENTIATOR

- Local SQLite 作為 user-owned personal place truth。
- notes/tags/priority/rank 等 personal context 與 refreshable provider facts 分層。
- dry-run、bounded writes、retry/verify semantics 與 explicit external-effect boundary。
- 能在 provider/MCP surface 改變後保住 personal metadata 與 intent，而不是追求最多 AI/travel feature。

### ADJACENT IDEA

- 一種 Google Maps URL/list 的 reviewable capture；只有 owner workflow evidence 才研究。
- 必要時做 provider/MCP read-only substitution spike，而不是第二套常駐 discovery stack。

### DO NOT COPY

- Triply/Tripsy 的 full itinerary、social feed、collaboration、booking、reservation inbox、creator-video ingestion breadth。
- 直接因 competitor 支援 YouTube/TikTok/screenshots 就增加 OCR/video pipeline。
- 把 Google Grounding Lite MCP 再包一層後宣稱產品差異化。
- 新 host/provider registry、generic import framework、cloud account/sync、deep-link service。
- 在 #1/#2/#7 尚未 default-branch 落地前擴 Google Maps write surface。

# Cross-portfolio ideas

本輪只保留兩個 design primitives，不提 shared service：

1. `External Artifact → Grounded Candidate → Explicit Review → Canonical Local Commit → Optional External Effect Receipt`。
2. `Effect Accepted ≠ Handoff Usable`：跨 app / MCP 的 URL、deep-link、file pointer 或 external receipt 必須在需要時有 target-visible 驗證，但不能機械要求所有小型 read-only tool 都加完整 end-to-end suite。

不同產品的 identity、licensing、provider policy 與 effect semantics 不同，沒有 evidence 支持 portfolio-wide ingestion/deep-link framework。

# Four-gate decisions

## Candidate 1 — Google Maps shared-list / link ingestion

1. **Problem/value**：Triply 證明市場有「Maps saved places → AI/planner」工作；prior Tripsy/Mapstr/Takeout research 也支持相同摩擦類型。但本 repo/owner 沒有高頻人工重輸 evidence，現有 search + explicit save 已是 viable substitute。
2. **Priority**：`OPPORTUNITY / NOT_ESTABLISHED / LOW_MEDIUM / NEEDS_EVIDENCE / auto_implementation=false`。
3. **Minimum solution**：先觀察 owner workflow；若成立，只做單一 input format → candidates → review → existing `save_place`。不建 importer service / inbox DB / travel SaaS。
4. **Research vs implementation**：HOLD；就算未來 BUILD，也只批准被驗證的 narrow format，不自動授權實作、merge、deploy 或 Google write。

## Candidate 2 — MCP/deep-link usability

1. **Problem/value**：Tripsy 有真實已修 bug，但這是 competitor 的 symptom；current repo 的 `google_maps_url` 由 Google 官方 Places response 提供，沒有本產品失敗證據。
2. **Priority**：`MAINTENANCE / NOT_ESTABLISHED / LOW / NEEDS_EVIDENCE / auto_implementation=false`。
3. **Minimum solution**：不改；如果未來有失敗 report，先用一個 bounded read-only open/read-back smoke 證明 affected path。
4. **Research vs implementation**：NO ISSUE，不能把 competitor bug 當本 repo regression。

## Candidate 3 — replace/custom Places client with Google managed MCP

1. **Problem/value**：managed MCP 降低 commodity integration work，但 current custom client already exists、tests its request/serialization path and supports field control/local data flow；沒有 current maintenance pain requiring migration。
2. **Priority**：`OPPORTUNITY / NOT_ESTABLISHED / LOW / DEFERRED / auto_implementation=false`。
3. **Minimum solution**：不改。只有 current wrapper 真的產生成本/維護斷點時，才做 2–3 read-only operations comparison。
4. **Research vs implementation**：DEFER；不做 provider migration/framework。

# Rejected Ideas / why

1. **建立 Triply-style 全功能 importer / travel planner — REJECT/DEFER。** 市場能力是真實的，但 owner pain/frequency 尚未成立。
2. **自動把 Google Maps shared list 全部寫入 local / Google Saved Lists — REJECT。** extraction/import 不等於 effect authority，且 ambiguous/partial 必須可見。
3. **把 Tripsy 3.10.2 的 bug 當成本 repo regression — REJECT。** 沒有 causal/source/runtime evidence。
4. **把 Google managed MCP 直接當成 migration mandate — REJECT。** 現有 product job 包含 durable local context / bounded Saved Lists sync，managed MCP 只覆蓋 commodity grounding 一部分。
5. **新建 deep-link registry/service — REJECT。** 一個 handoff-checklist signal 不支持新架構。
6. **擴成 social/YouTube/TikTok/screenshot ingestion — REJECT。** 沒有 owner workflow evidence，且跨政策/identity complexity 過大。
7. **修改 #1/#2/#4/#7 或 PR #5/#6 — SKIPPED_ACTIVE_SCOPE / NO NEW ROOT CAUSE。** 本輪外部證據沒有改變既有 acceptance boundary。

# Issue Mapping

- New Issues：**0**。
- Existing Issue edits/comments：**0**。
- PR edits/comments：**0**。
- Implementation authorizations：**0**。
- Issue locks：未需要；沒有 Issue/shared mutable state write。
- Existing fingerprints：#1 retention、#2 same-collection ownership、#4 Place-ID rollover、#7 shared-profile ownership，均未被本輪新訊號推翻。

# Sources

Public web sources checked this round（GitHub 之外）：

1. Tripsy Updates — 3.10.2, 2026-09-20: https://tripsy.app/updates
2. Triply App Store Taiwan — version 2.1, 2026-09-05: https://apps.apple.com/tw/app/triply-ai-trip-planner/id6758882852
3. Triply product site — current product checked 2026-09-22: https://triplyplanner.com/
4. Google Maps Platform — Maps Grounding Lite MCP architecture/current docs, checked 2026-09-22: https://developers.google.com/maps/architecture/grounding-with-maps-mcp
5. Google Maps Platform — Maps Grounding Lite MCP reference, checked 2026-09-22: https://developers.google.com/maps/ai/grounding-lite/reference/mcp

Repository evidence used only for current-product truth / dedupe:

- `Reese-max/google-maps-personal-mcp main@800bc3b5adc3558a6ee9a5f296549098467596fb`
- product baseline `8bb6931b6d34f158aedf9ad6f652a7aef3822bcb`
- README `b84037fe63f4b3422a634905b6173c00a8bf7265`
- `services/google_places.py` blob `b8440b5ec178035955a877015d06f4eaf2f2eeec`
- `db/models.py` blob `5e043108e954452d577951a78fa8922aecfa93ef`
- `tools/places.py` blob `7212fec7d8e23629f008fdcd0c4c1b8b1caaf36f`
- current Issues #1/#2/#3/#4/#7; closed Issue search empty; all-state PR review includes #5/#6.

# What Changed

Compared with the prior Maps radar (`2026-09-20T195849Z-external-radar.md`):

- **New market evidence:** Triply 2.1 provides Google Maps single/shared-list ingestion directly into a saved-place-aware AI surface. This increases confidence that Maps-list re-entry is a real market job, but does not establish owner demand.
- **New reliability evidence:** Tripsy 3.10.2 documents a concrete MCP-to-app link handoff failure and fix. This sharpens the principle that link usability belongs to effect/handoff truth, without proving this repo is broken.
- **No product HEAD drift:** focal repo remains audit-only HEAD over the same initial product baseline.
- **No priority inflation:** import stays opportunity/HOLD; handoff link stays evidence/checklist-only; managed Maps MCP stays direction reinforcement.
- **No new Issue / no existing Issue rewrite / no active PR interference.**

# Classification / scope calibration

- Triply import: `OPPORTUNITY / NOT_ESTABLISHED / LOW_MEDIUM / NEEDS_EVIDENCE / auto_implementation=false`.
- Tripsy link handoff: `MAINTENANCE / NOT_ESTABLISHED / LOW / NEEDS_EVIDENCE / auto_implementation=false`.
- Google managed MCP substitution: `OPPORTUNITY / NOT_ESTABLISHED / LOW / DEFERRED / auto_implementation=false`.
- No P0/P1/P2 created from competitor features, social anecdotes, missing runtime, or synthetic user counts.

# Completion / gaps / cursor

- Fresh owner pagination：完成，42 owned / 41 unarchived，page 2 empty。
- Rules / owner direction / current default changes / open+closed Issues / all-state PRs / prior radar and rejected ideas：完成核對。
- External A/B/C scan：完成；關鍵能力以 first-party / platform sources核對。
- Runtime：本輪未執行 live Places、logged-in Chrome/Maps、CI、production；所有這些路徑仍不可冒稱已驗證。
- Report write：本輪唯一 repository mutation。
- Portfolio CLEAN：**不宣告**。
- Next fair external-radar cursor：**`Reese-max/herdr-skills`**。

Notification decision：**NO NOTIFICATION**。本輪有新鮮且可保存的市場/可靠性訊號，但都只強化既有 HOLD/方向；沒有高價值已通過 Gate 的新產品機會、重大策略推翻、有證據的跨專案新共用能力，亦沒有需要 owner 立即決策的新 P0/P1/P2。