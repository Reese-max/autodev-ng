# 外部競品／新品／工作流靈感雷達 — 2026-09-17T10:05:04Z

> 查閱日：2026-09-17（Asia/Taipei）。
>
> Issue Quality：`issue_quality_version: 2`；本輪重新讀取 `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
>
> Evidence labels：`CONFIRMED`＝第一方官方資料或可直接檢查的 repository truth；`LIKELY`＝有支持但仍缺 runtime／契約／真人驗證；`COMMUNITY_SIGNAL`＝個別社群訊號，不代表普遍發生率；`UNKNOWN`＝資料不足。
>
> 本輪未修改任何產品原始碼、CI/config、secret、權限或 repository settings；未建立實作 branch、merge/deploy、啟動 worker/run/GOAL、付費 API call 或正式資料寫入。新建的 Research Issue 不構成實作授權。

## Executive Summary

本輪依上一輪公平輪巡 cursor 深讀 `Reese-max/ppt-studio`，並因本日新出現且剛完成 Product Board 的 `Reese-max/travel-planning-mcp` 屬「近期產品變化」lane，額外做窄幅外部證據核對。主要市場情報來源均來自 GitHub 之外的公開網路；repository 只用來判斷是否真的存在產品斷點、重複追蹤與最小方案。

Fresh owner inventory 已重新完整列舉：目前 GitHub connection 可確認 **39 個 Reese-max-owned repositories、38 個未封存**；`obsidian-vault` 為 archived。這與較早 42/39 記錄不一致，維持 `CONNECTED_INVENTORY_DRIFT`，不把目前看不到的 repository 推論為已刪除或不存在。

本輪唯一通過四道立案 Gate 的新項目不在 `ppt-studio`，而在本日新建立的 `travel-planning-mcp`：目前 live `GooglePlaceProvider` 會把 Places Text Search 回傳的 `displayName / formattedAddress / location / primaryType/types / place ID` 正規化後直接存入 canonical `Place`。現在 default store 仍是 in-memory，因此**不宣稱已發生 durable retention 違規**；但 roadmap 已把 PostgreSQL durable persistence、retention/deletion 與 Place Details refresh 列為下一階段。Google Maps Platform 第一方現行條款只明確給 Places lat/lng 最多 30 天暫存邊界；Google 第一方 Place ID 文件則明確允許 place ID 保存供日後使用，並建議超過 12 個月 refresh。把目前整個 canonical `Place` 一體視為永久 user-owned data 或一體視為 30-day cache 都缺乏依據。

因此已建立 `Reese-max/travel-planning-mcp #6`：`[Research][RESEARCH_REQUIRED] Validate Google Places retention boundary before durable TravelStore`。它被限制為 **RESEARCH / NOT_ESTABLISHED / HIGH / NEEDS_EVIDENCE / auto_implementation=false / NEEDS_RUNTIME_VERIFICATION**；最小研究只有「核對實際 Agreement/billing region → 對目前 field mask 建欄位級 matrix → 本機 fixture 模擬 expiry/refresh 且保留 exact trip intent → BUILD/NARROW/REJECT」。不先做 PostgreSQL、retention service、policy registry 或 production purge job。

`ppt-studio` 本輪則 **0 新 Issue、0 existing Issue 修改、0 PR comment**。Microsoft 現行 PowerPoint Brand Kit 已把「Strict brand adherence」與「Notes Steering」正式做成產品能力：前者要求 Copilot 僅使用 approved template / slide-master layouts，後者讓模板管理者把可重用的 plain-language 生成規則放進 speaker notes。這是高價值產品設計訊號，但 PPT Studio 已有 #5 的 bounded structured/native-editability research，而 Product Board 明確要求先 `#7 translation integrity → #1 trust boundary → #5 bounded native editing → #3 provenance`。沒有真人證據證明再造 Brand Kit 是當前 top friction，因此只保留為 #5 的相鄰證據，不擴 Issue scope。

PowerPoint 現行 Translate 功能會建立**新的翻譯副本**而不是直接覆寫原 deck，提供另一個可移植的非破壞 mutation 模式；但 PPT Studio #7 的真正 source-confirmed P0 是 translate 與其他 deck mutation 交錯時造成 lost update，而 PR #8 已在用既有 per-presentation lock 修復。這項競品模式因此標記 `ADJACENT IDEA + SKIPPED_LOCKED_ACTIVE_PR#8`，不把「new-copy translation」混進正在處理的 concurrency root cause。

結果：**1 新 Research Issue（travel-planning-mcp #6）；0 ppt-studio Issue 修改；0 PR comment；0 implementation authorization。**

下一個公平輪巡 cursor：`project-doctor-web`（沿用上一次 `ppt-studio` 完整輪巡後的 successor，且本輪 fresh inventory 仍可存取、未封存）。

---

## Scope / Repository Truth

### Fresh portfolio pagination

- GitHub connection 本輪完整 owner listing：39 repositories。
- Archived：`obsidian-vault`。
- Owned + unarchived：38。
- 所有可見項目在本輪完整 listing 中已覆蓋；無下一頁未讀結果。
- 較早中央報告的 42/39 與目前 39/38 差異只記為 access/visibility drift。
- 空 repo／內容庫／support-only repo 不硬造產品缺陷。

### Governing issue-quality rules

本輪重新讀取：
`Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`

- blob：`8167e10798071d2276addaff6b201c6b0e904a2a`
- 維持 kind / severity / decision_priority / evidence / triage 分離。
- `RESEARCH` 不因 HIGH priority 升成 P1/P2。
- 外部競品有某功能不構成缺陷。
- 最小方案先比較不改、文件、重用與局部變更，再考慮新模組／服務。
- 模擬 Persona、產品文案、vendor benchmark 都不是獨立效果證據。

### `ppt-studio` current truth

- Default branch：`master@dc2aab78dbf5acc41d97fbf17645b8331cd21bfd`。
- 最近實質產品 baseline：`da303f7cdc93883b6aed1b414286ef640a6c99ee`；後續 default commits 為 audit/docs。
- Owner/Product Board：**INVEST / SIMPLIFY**。
- 核心工作：讓非設計師從文字/PDF/URL/JSON/Markdown 生成、編輯、翻譯、播放並輸出可繼續編輯的 PPTX。
- Owner 明示 K1–K5 進維護期，P6 collaboration / marketplace 未經另外決策不主動擴張。
- NOW：#7 translation lost-update integrity。
- NEXT：#1 local/remote trust boundary 與真實 runtime/container evidence。
- LATER：#5 bounded structured/native-editability + render/export verification；#3 provenance 重用穩定 object identity。

Active scope：
- #7：P0 translate lost-update；PR #8 `fix/issue-7-translate-lock@0370309275491f879c29c4a5da9f532011253bfa` open，已加入 same-deck mutation lock regression。**本輪不搶改。**
- #1：仍有 PR #2 / #4 處理 local Docker / auth boundary。**本輪不搶改。**
- #5：已有完整 competitive research，追蹤 stable slide/object state、bounded patch、render/export verification、native editability；Microsoft/Google/Canva 新訊號多屬同一產品問題，不另開。
- #3：已有 claim/source provenance；不因外部 connector 趨勢再建第二套 evidence graph。
- #9：FastAPI/Starlette upstream security issue；與本輪 competitor workflow 無同根因。

### `travel-planning-mcp` recent-product-change truth

- Repository 本日建立，default branch `main@ea9c51ffb5c12a82f6bac609420731136e058c7c`；此 HEAD 是 audit timestamp docs-only 變更。
- Inspected product baseline：`5a84a746266a2bd8cabf07db24a0fd2e9558b400`。
- Product Board：**INVEST / SIMPLIFY**；目標是 technical traveler / travel-tool builder / operator 的 AI-readable canonical itinerary，強調 constraints、versioning、human approval、reversible writes 與 provider-independent data，不做 consumer booking super-app。
- Current default store：versioned in-memory store；durable PostgreSQL / retention-deletion / Place Details refresh 為後續 roadmap。
- `GooglePlaceProvider` Text Search field mask：`places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types`，之後組成 canonical `Place` 並 unconditional `savePlace(normalized)`。
- #5 已追蹤 proposal terminal-state revalidation P2；與本輪 provider-content lifecycle 是不同根因。
- 既有 PR #1/#2/#3 已 merged，沒有與 provider-retention fingerprint 衝突的 active PR / branch。

---

## Product → Market Category Map

| Repository | 市場／產品角色 | 本輪外部對照 |
|---|---|---|
| `ppt-studio` | local-first AI presentation workstation / editable PPTX workflow | PowerPoint Copilot Brand Kit、translation copy；Gemini in Slides native editable generation；Canva layered/editable + presentation coaching |
| `travel-planning-mcp` | agent-native canonical itinerary / safe travel mutation layer | Google Places/Maps provider contract；Gemini travel planning；Wanderlog/Mindtrip consumer workflows（僅作 scope 對照） |

---

## External Signals

### A. `travel-planning-mcp` — Google Maps provider content 有欄位級 lifecycle，而不是單一 cache 期限

**CONFIRMED；第一方；查閱 2026-09-17。**

Sources:
- Google Maps Platform Service Specific Terms: https://cloud.google.com/maps-platform/terms/maps-service-terms
- Google Maps Platform EEA Service Specific Terms: https://cloud.google.com/terms/maps-platform/eea/maps-service-terms
- Google Places API Place IDs: https://developers.google.com/maps/documentation/places/web-service/place-id

Current official contract/documentation signals：
- Places API lat/lng 可暫存最多 30 個連續日，之後刪除。
- EEA terms 另有 Places API permitted-use / map-use 邊界；實際 Agreement/billing region 必須先確認，不能把一套契約假設套到所有帳戶。
- Place ID 官方文件明確說明可保存供日後使用，並建議超過 12 個月 refresh。

**User job**：在跨 agent / 跨 session 的 canonical itinerary 中長期保留「使用者選的是哪個地方」與自己的行程意圖，同時不要把第三方 provider 回傳內容錯當成無限期 user-owned truth。

**Concrete manual/risk reduction**：如果先建立 field-level lifecycle，未來 durable store 不必靠人工猜「哪些欄位要刪、哪些要 refresh、刪完是否會失去行程 identity」，也不必把整個 Place 物件一刀切成 30-day cache。

**Do not copy / overbuild**：不因條款存在就建立 compliance platform、第二資料庫、purge service 或 provider registry。先只回答目前 field mask 的實際保存分類。

### B. `ppt-studio` — Microsoft 將「模板硬限制」與「可重用生成指令」分開

**CONFIRMED；Microsoft Support current docs；查閱 2026-09-17。**

Source:
- https://support.microsoft.com/en-us/powerpoint/copilot/manage-brand-kit-template-settings-in-powerpoint

Microsoft PowerPoint Brand Kit 現行文件將兩件事分離：
1. `Strict brand adherence`：Copilot 僅能使用 approved template / slide-master layouts，不能任意加減 placeholder 或創造新 layout。
2. `Note instructions / note steering`：brand manager 可以把 plain-language generation guidance 放入模板 speaker notes，後續每次生成重用，不必每個 prompt 重述。

**User job**：組織／個人要重複生成同品牌 deck 時，避免每次手動重述「這頁必須存在、這頁不能改、文字密度、順序、layout 規則」。

**Transferable principle**：`hard structural invariant` 與 `soft reusable authoring guidance` 應分開；LLM instructions 不應取得覆寫 approved layout invariant 的權力。

**Repository opposite evidence / dedupe**：PPT Studio #5 已經要求 bounded layout/object state、unsupported intent fail-visible、untouched-object invariants 與 render/export verification；目前沒有真人證據需要再造 Brand Kit 管理平台。本訊號只保留為 #5 的 research evidence，不另立案。

### C. `ppt-studio` — PowerPoint Translation 採 non-destructive copy，是 mutation recovery 的相鄰模式

**CONFIRMED；Microsoft Support current docs；查閱 2026-09-17。**

Source:
- https://support.microsoft.com/en-US/PowerPoint/copilot/translate-your-presentation-with-copilot

PowerPoint Copilot 翻譯整份簡報時會建立**新的 translated copy**，原簡報不作為同一份 artifact 被直接覆寫。這是一種降低 destructive mutation recovery 壓力的產品模式。

**但不是新 defect**：PPT Studio 目前 #7 真正已證實的根因，是 provider await 期間其他 mutation 可以前進，翻譯回來再以 stale snapshot 覆寫較新 state；PR #8 已用既有 per-deck lock 修復該 concurrency path。把 translation 改成 copy 是產品語意變更，不是修 #7 所必須。

Decision：`ADJACENT IDEA / NEEDS_USER_EVIDENCE / SKIPPED_LOCKED_ACTIVE_PR#8`。

### D. `ppt-studio` — Google/Canva 持續把 native editability 與 presenter workflow 放到核心

**CONFIRMED；第一方；查閱 2026-09-17。**

Sources:
- Google Workspace — Gemini in Google Slides native editable presentations, 2026-06-30: https://workspaceupdates.googleblog.com/2026/06/create-fully-native-and-editable-presentations-with-Gemini-in-Google-Slides.html
- Canva AI 2.0: https://www.canva.com/newsroom/news/canva-create-2026-ai/
- Canva Visual Suite updates: https://www.canva.com/newsroom/news/visual-suite-100-updates/
- Canva Presentation Paradox study: https://www.canva.com/newsroom/news/ai-presentation-study/

Signals：
- Google Slides：由 prompt + Drive reference / style reference 生成 fully native/editable slides。
- Canva AI 2.0：layered editable output、iterative component editing、brand/context continuity。
- Canva Visual Suite：data/chart → stakeholder deck 不需 export/reupload，Presentation 可生成 presenter notes；整體策略是減少格式之間的重輸。
- Canva 的 4,000-person vendor study顯示其樣本中已有使用者把 AI 用於 rehearsal、draft feedback、預想問題與 speaker notes；這是**供應商調查與產品策略訊號**，不外推成 PPT Studio user frequency 或 ROI。

Decision：native editability / bounded editing **DEDUPE #5**；presenter coaching **ADJACENT IDEA only**。目前沒有證據把 rehearsal/avatar/Q&A coaching 提升為 Reese-max 核心需求。

---

## New Releases / Current Changes

- **2026-06-30 — Google Slides**：Gemini full multi-slide native/editable generation，支援 Drive grounding、style-reference deck。
- **Current / Microsoft Support checked 2026-09-17 — PowerPoint Brand Kit**：Strict brand adherence + note steering 已成公開產品文件；文件的部分 localized pages 標示 2026-08 更新，本報告不自行推斷更精確 GA 日。
- **Current / Microsoft Support checked 2026-09-17 — PowerPoint translation**：整份翻譯建立新副本；作為相鄰 non-destructive workflow 參考。
- **Current / Canva checked 2026-09-17**：Visual Suite 持續把跨格式資料→deck→presenter notes 串在同一 project；Canva AI 2.0 強化 layered editability。

---

## Community Pain

本輪未保留新的 community-only 訊號作為立案依據。現有第一方產品與 repository source evidence 已足以做上述 decision；不為湊來源數量引入 Reddit anecdote，也不把 vendor survey 當成普遍發生率。

---

## Adjacent Ideas

### `ppt-studio`

1. **Non-destructive translation copy/version** — 只在後續真人 evidence 顯示「翻譯後仍要保留原版並頻繁比較/回退」時研究；不混入 #7 concurrency 修復。
2. **Template rule separation** — 將 structural invariants（不能被模型改）與 reusable soft guidance 分離，可作 #5 research schema 的設計原則；不建 enterprise Brand Kit admin surface。
3. **Presenter preparation** — speaker notes / Q&A / rehearsal 有市場訊號，但沒有本產品使用者證據；不立案。

### `travel-planning-mcp`

1. **Long-lived identity + refreshable provider content** — place ID / user-owned itinerary intent 與 provider-returned fields 分離，僅研究現有 field mask。
2. **Start-anywhere import** — consumer competitors把 screenshots/PDF/reservations/email 變 itinerary；本 repo roadmap已有 import/provider擴張方向，但 owner 目前把 trustable mutation/provider evidence 放前面，故不另開。
3. **Booking completion** — Gemini/Expedia/Mindtrip 等往 inspiration→booking 收斂；與 Product Board「不要 consumer booking super-app」相衝突，列 DO NOT COPY。

---

## Opportunity Map

### `ppt-studio`

- **MUST MATCH**：長時間 AI mutation 不得破壞 deck state；#7/PR #8 已覆蓋，競品不產生新 fingerprint。
- **SHOULD BE BETTER**：bounded object/edit/render/export receipts（#5）、source/claim provenance（#3），比單純「有 AI」更可驗證。
- **DIFFERENTIATOR**：local-first、可檢查 mutation、native/editable handoff、明確 unsupported/partial fidelity，而不是 SaaS breadth。
- **ADJACENT IDEA**：translation as copy、template note steering、presenter rehearsal。
- **DO NOT COPY**：enterprise Brand Kit administration、cloud collaboration、generic Office suite、AI avatar presenter、另一套自由排版引擎。

### `travel-planning-mcp`

- **MUST MATCH**：在 durable storage 前說清楚 provider content lifecycle 與 canonical user intent 的邊界。
- **SHOULD BE BETTER**：human approval、version binding、fixed commitment protection、reversible writes；現有 Product Board 已明確投資。
- **DIFFERENTIATOR**：provider-independent canonical itinerary + agent-native MCP/REST + safe mutation，而不是 consumer booking UI。
- **ADJACENT IDEA**：email/PDF/screenshot reservation import、bounded location refresh。
- **DO NOT COPY**：OTA checkout、affiliate inventory、social discovery、native app、live-navigation replacement。

---

## Cross-portfolio Ideas

### 1. `identity / user intent` 與 `provider-derived current content` 分層

本輪在 Travel Places provider 看到的問題，與 portfolio 其他 evidence-heavy產品有可重用的抽象原則，但**不建立跨專案框架 Issue**：

- 永久 user intent / stable identity 不應因 provider snapshot 到期而消失。
- provider content 應保留來源、retrieved_at、適用 lifecycle、UNKNOWN 狀態。
- refresh receipt 證明「這次重新查過什麼」，不能把舊值重新標成今日 truth。

只有未來至少兩個實作 repo 真正需要相同執行元件時，再研究共享 library；目前先局部解決 travel #6。

### 2. `hard invariant` 與 `soft AI guidance` 分離

Microsoft Brand Kit 提供有證據的產品模式：不可越權的 layout/template invariant 與可以反覆調整的 plain-language AI guidance 是不同層。這與 Herdr、PPT、travel 等產品已採用的「AI proposal ≠ authority」原則一致。但本輪沒有新的共同執行缺口，因此只記設計原則，不開 portfolio framework。

---

## Four-Gate Decisions / Classification Calibration

### PASS → `travel-planning-mcp #6`

**1. 問題／價值**
- Target：跨 session 保存 canonical itinerary 的 technical traveler / agent operator。
- Observable source：GooglePlaceProvider 把 provider fields 直接塞進 canonical Place；roadmap 又準備 durable store。
- Opposite evidence：現在只 in-memory，所以不宣稱已發生違規或 durable data loss。
- Consequence：若不先定義欄位 lifecycle，未來 persistence/refresh/deletion 可能把 provider content 當永久 user data，或反過來刪掉 user trip intent。

**2. Priority**
- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=HIGH`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`

不升 P1/P2：沒有當前 durable store、沒有 production incident、沒有因果證據證明目前 user data 已違規保存。

**3. 最小方案**
- 不改：在 durable phase 前會留下實作決策盲點。
- 只改 docs：無法回答 field mask 各欄位要怎麼保存/refresh。
- 最小 research：實際 Agreement + field matrix + local expiry fixture。
- 不先做 DB / policy service / crawler / purge job。

**4. 研究／實作分離**
- BUILD：條款/文件 + fixture 證明需要薄 lifecycle boundary。
- NARROW：只有少數欄位需 expiry；長期 identity 以 place ID + user-owned metadata 為主。
- REJECT：實際 agreement 明確支持 planned use，或產品決定 durable store 不保存 provider content。
- BUILD 也只支持下一步產品決策，**不自動批准 code / merge / deploy**。

### REJECT NEW ISSUE → `ppt-studio`

- Brand Kit strict/note steering：問題與 #5 bounded structural-editability research 高度重疊，且無真人 top-friction evidence。
- Translation-copy：是 product-semantic alternative，不是 #7 concurrency root cause；PR #8 active，`SKIPPED_LOCKED_ACTIVE_PR#8`。
- Native editable generation：#5 已有 Google/Canva/Pitch/SLIDEFORGE evidence，同根因不重複。
- Presenter coaching：外部市場訊號強於內部需求證據；普通候選留中央報告，不立案。

---

## Rejected / Deferred Ideas

| Idea | Disposition | Reason |
|---|---|---|
| PPT Studio enterprise Brand Kit admin | REJECT NOW | owner maintenance/SIMPLIFY；#5 足以研究 invariant，不需要管理平台 |
| PPT Studio translation always creates a copy | DEFER / ADJACENT | 可能有恢復價值，但不是 #7 修復必要條件，缺真人需求 |
| PPT Studio presenter coach/avatar | DEFER | Canva vendor study是市場訊號，不是本產品 pain evidence |
| PPT Studio cloud collaboration / Office suite | DO NOT COPY | 超出 owner scope，增加 ACL/storage/collaboration 負擔 |
| Travel full 30-day TTL for all Places fields | REJECT | 第一方文件只明確給 lat/lng 30-day，而 place ID 有不同規則 |
| Travel permanent storage for all normalized Places fields | REJECT ASSUMPTION | 未核對 applicable Agreement/permitted use，不把 canonicalization 當永久保存權 |
| Travel OTA checkout/affiliate inventory | DO NOT COPY | Product Board 明確不是 consumer booking super-app |
| Cross-portfolio retention framework | REJECT NOW | 目前只有局部研究問題，沒有兩個以上已驗證 implementation needs |

---

## Issue Mapping / Coordination

### Created

- `Reese-max/travel-planning-mcp #6`
  - https://github.com/Reese-max/travel-planning-mcp/issues/6
  - `[Research][RESEARCH_REQUIRED] Validate Google Places retention boundary before durable TravelStore`
  - `RESEARCH / NOT_ESTABLISHED / HIGH / NEEDS_EVIDENCE / auto_implementation=false`
  - 已 read-back 確認 Issue number / URL / body。

### Existing, unchanged

- `ppt-studio #7` / PR #8 — translation concurrency/lost update：active implementation scope，不留言、不搶改。
- `ppt-studio #5` — structured slide/native editability research：新 Brand Kit / Google / Canva 訊號與既有 fingerprint重疊，中央報告保留，不重複開單。
- `ppt-studio #3` — provenance：不建第二套 evidence graph。
- `ppt-studio #1` / PR #2/#4 — network/auth：與本輪產品靈感無同根因。
- `travel-planning-mcp #5` — proposal terminal-state lifecycle：與 provider content retention 不同根因，保持獨立。

### Locks / leases

本輪沒有修改既有 Issue 或 active PR，因此未取得它們的 Issue lease，也未追加 lock marker。新 Issue #6 在建立前已搜尋 open/closed issue 與 all-state PR，沒有同 fingerprint tracker；建立後 read-back 確認成功。

---

## Sources

### Google / travel
- Google Maps Platform Service Specific Terms — https://cloud.google.com/maps-platform/terms/maps-service-terms — `CONFIRMED`, checked 2026-09-17.
- Google Maps Platform EEA Service Specific Terms — https://cloud.google.com/terms/maps-platform/eea/maps-service-terms — `CONFIRMED`, checked 2026-09-17.
- Google Places API Place IDs — https://developers.google.com/maps/documentation/places/web-service/place-id — `CONFIRMED`, checked 2026-09-17.

### Microsoft / presentation
- Manage template settings in your Brand Kit for Copilot in PowerPoint — https://support.microsoft.com/en-us/powerpoint/copilot/manage-brand-kit-template-settings-in-powerpoint — `CONFIRMED`, checked 2026-09-17.
- Translate your presentation with Copilot — https://support.microsoft.com/en-US/PowerPoint/copilot/translate-your-presentation-with-copilot — `CONFIRMED`, checked 2026-09-17.
- Add speaker notes with Copilot — https://support.microsoft.com/en-US/PowerPoint/copilot/add-speaker-notes-to-your-presentations-using-copilot — `CONFIRMED`, checked 2026-09-17.

### Google / Canva presentation
- Gemini in Google Slides native editable presentations — https://workspaceupdates.googleblog.com/2026/06/create-fully-native-and-editable-presentations-with-Gemini-in-Google-Slides.html — `CONFIRMED`, event 2026-06-30.
- Canva AI 2.0 — https://www.canva.com/newsroom/news/canva-create-2026-ai/ — `CONFIRMED`, checked 2026-09-17.
- Canva Visual Suite 100 updates — https://www.canva.com/newsroom/news/visual-suite-100-updates/ — `CONFIRMED`, checked 2026-09-17.
- Canva Presentation Paradox study — https://www.canva.com/newsroom/news/ai-presentation-study/ — `CONFIRMED` vendor study, checked 2026-09-17; not independent outcome evidence.

---

## What Changed

1. Fresh inventory再次確認目前 connected scope = **39 owned / 38 unarchived**；不把與舊 inventory 的差異解讀為刪除。
2. 公平輪巡完成 `ppt-studio`，沒有新的獨立 actionable fingerprint。
3. `ppt-studio` 新增中央證據：Microsoft Brand Kit 的 strict invariant / note steering 分離，以及 translation-as-copy；均未擴張 active scope。
4. 因 `travel-planning-mcp` 是本日新產品且 roadmap 正準備 durability，外部 Google 第一方條款與 repo source 合起來通過研究 Gate。
5. 實際建立並 read-back `travel-planning-mcp #6`；沒有實作授權。
6. 0 existing Issue modifications；0 PR comments；0 product code/config/settings writes。

---

## Completion / Gaps / Cursor

### Completed

- Issue Quality v2 reread + blob pinned。
- Fresh complete owner inventory enumeration。
- `ppt-studio` owner direction/default branch/issues/all-state active PR coordination review。
- `travel-planning-mcp` recent-product-change direction/default branch/roadmap/issues/PR/source review。
- GitHub 之外第一方 external research for Google Maps, Microsoft PowerPoint, Google Slides, Canva。
- New Issue dedupe + creation + read-back verification。
- Central report written as unique file; no historical report overwritten。

### Gaps / evidence boundaries

- 未執行任何 live Google Places paid request，也未取得/檢查實際 Maps billing Agreement；#6 因此維持 `NEEDS_EVIDENCE / NEEDS_RUNTIME_VERIFICATION`。
- 未做法律意見；只把公開第一方 Terms/Docs 轉成產品研究問題。
- 未做 PPT Studio 真實 end-user rehearsal/translation-copy usability test；市場訊號不當 user evidence。
- 未將 Canva vendor survey 數字外推為本產品 ROI、frequency 或 conversion。
- 未宣告任何 repository 或 portfolio CLEAN。

### Next fair cursor

`project-doctor-web`
