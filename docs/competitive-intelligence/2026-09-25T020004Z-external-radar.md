# 外部競品／新品／工作流靈感雷達 — 2026-09-25T02:00:04Z

## Status

**COMPLETE / MAJOR COMPETITOR STRATEGY SIGNAL / NO NEW ISSUE / NO IMPLEMENTATION AUTHORIZATION**

Focus：`Reese-max/flux-image-gen`。Issue Quality v2 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。

Fresh owner inventory：42 owned / 41 unarchived / 1 archived。Current target default branch：`main@dfadcf30ca1d3daf479e05dd97aa457afa265333`。

本輪只有公開網路研究、GitHub read 與中央研究報告；沒有產品程式、CI/config、secrets、permissions/settings、實作 branch、merge、deploy、worker/GOAL、付費 provider 或正式資料變更。

## Direction / current coordination

沿用既有 **INVEST / SIMPLIFY**：安全、可靠性、provider/cost/output/source truth 先於功能廣度。現有 #11、#7–#10 仍較新分發面優先；#18、#22、#23、#26 已分別覆蓋 provenance、reference/session continuity、spatial targeting、exact-text finishing。

## Product → Market Category

- Direct：Adobe Firefly/Photoshop/Express、Canva、OpenAI Images。
- Adjacent：general AI assistant → specialist creative action → interactive finishing。
- Enabling stack：Cloudflare Workers AI / Images。
- Do not copy：完整 design suite、tool catalog、account/collaboration cloud、assistant connector matrix、provider/model 數量競賽。

## External Signals

### A. Adobe 將專業創作工具深入 general AI assistants

**CONFIRMED — 2026-09-24；checked 2026-09-25**

Source: https://blog.adobe.com/en/publish/2026/09/24/adobe-comes-to-gemini-expands-what-you-can-do-in-claude

Adobe 宣布把 Photoshop、Lightroom、Express、Firefly 能力放進 Gemini，並持續擴大在 Claude 等 assistant surface 的整合。Adobe for Claude 擴到 80+ tools，且加入 interactive editing；Express 的 layer-based editor 可讓使用者針對 image、copy、color、font 個別調整，而不是只靠整張重新生成。

可移植模式：
`conversation intent → bounded specialist action → candidate artifact → user-controlled finishing → truthful export/receipt`

這減少 prompt 複製、檔案下載/重傳、上下文重建等跨工具步驟；但目前沒有 `flux-image-gen` 使用者證據證明「直接從 Gemini/Claude 呼叫產品」是核心 bottleneck。

Classification：
- kind=`OPPORTUNITY`
- severity=`NOT_ESTABLISHED`
- decision_priority=`MEDIUM`
- triage=`NEEDS_EVIDENCE`
- auto_implementation=`false`

Decision：**REPORT_ONLY / NO ISSUE**。

### B. Cloudflare Images transformation analytics

**CONFIRMED — 2026-09-23；checked 2026-09-25**

Sources:
- https://developers.cloudflare.com/changelog/product/images/
- https://developers.cloudflare.com/images/pricing/

Cloudflare Images 新增 transformation analytics，可觀察 transformation traffic 與來源。這對既有 #26 的 server-side exact-text candidate 增加可觀測性，但不改變「browser-local Canvas first；只有不足才研究 Cloudflare Images」的最小順序。

Current pricing check：Free plan 每月最多 5,000 unique transformations；Paid 的前 5,000 included，超出後按 unique transformations 計費，storage/delivery 另計。這是成本邊界，不是 ROI 證據。

Decision：**DEDUPED → #26 supporting evidence / NO COMMENT**。

### C. Assistant + interactive finishing 已形成相鄰市場模式

Canva Magic Layers（代表性 June 2026 pattern）把 flat AI image 轉為 editable layers，並出現在 AI assistant workflow：
https://www.canva.com/newsroom/news/magic-layers-ai-assistants/

OpenAI Images 2.5（2026-09-08，前輪已追蹤）提供 targeted edit / reference consistency 等能力：
https://openai.com/index/introducing-chatgpt-images-2-5/

本輪只把這些視為「AI candidate 後仍需要 bounded/manual control」的支持，不建立 layer system，不重複 #22/#23。

## New Releases

- 2026-09-24：Adobe in Gemini + expanded Adobe for Claude — 本輪重大策略訊號。
- 2026-09-23：Cloudflare Images transformation analytics — #26 supporting evidence。
- OpenAI Images 2.5、Cloudflare text rasterization、Stability bounded edits 已在先前 radar 映射，不重複立案。

## Community Pain

本輪沒有足以改變優先級的高品質近期 community evidence。零星「AI 圖生成後仍希望指定元素可編輯」只能算 `COMMUNITY_SIGNAL`，不能外推頻率、完成率或 severity。

## Adjacent Ideas

1. Specialist capability 可成為 assistant 裡的 bounded candidate tool，但需先有 user evidence。
2. 語言 orchestration 遇到精準修改時，應交回 deterministic / user-controlled finishing；優先沿用 #23/#26。
3. Cloudflare analytics 可作未來 server-side transformation experiment 的 usage receipt，但不能替代 correctness/provenance。
4. 此模式可能跨到 minideck/ppt-studio，但目前不足以建立共用 framework。

## Opportunity Map

| Class | Decision |
|---|---|
| MUST MATCH | 先完成既有 safety/reliability 與 provider/model/cost/output truth。 |
| SHOULD BE BETTER | 減少「生成→下載→另開工具改文字/區域→再匯回」；先沿用 #22/#23/#26。 |
| DIFFERENTIATOR | local/simple、繁中友善、truthful provenance/cost/provider、可逆 edit candidate。 |
| ADJACENT IDEA | assistant-surface distribution；先 isolated candidate-only proof，再談 connector。 |
| DO NOT COPY | 80+ tool catalog、完整 layer editor、account/collaboration suite、跨 assistant connector matrix。 |

## Four-gate decision — assistant-surface distribution

### 1. Problem / value
外部市場證明 general assistant 與 specialist creative tool 的 handoff 正被產品化；但 repo 沒有本產品高頻 handoff evidence，且既有 reliability/safety 工作更急。

### 2. Priority
`OPPORTUNITY / NOT_ESTABLISHED / MEDIUM / NEEDS_EVIDENCE / auto_implementation=false`。

### 3. Minimum path
依序比較：
1. 不改，先確認 user demand；
2. 重用既有 share/export/receipt；
3. 有 evidence 才做 isolated candidate-only tool contract proof；
4. 只有前三步不足才評估 connector/plugin surface。

不先建 account、OAuth platform、tool registry、multi-assistant adapter 或新 service。

### 4. Research / implementation separation
目前不需新 Issue。若未來有足夠 user evidence，再以 BUILD / NARROW / REJECT bounded research 決策；BUILD 也不自動授權公開 connector、merge、deploy、付費或外部寫入。

## Rejected / Deferred

- 現在做 ChatGPT/Gemini/Claude connector：DEFER。
- 複製 Adobe 80+ tools：REJECT。
- 把 #23 擴成完整 layer editor：REJECT。
- 因 Canva 就建立 re-layer subsystem：REJECT。
- 因 Cloudflare analytics 已存在就直接採 server-side transform：REJECT。
- 建 portfolio-wide assistant-distribution framework：REJECT NOW。
- 為競品 catalog 增加更多 image providers：REJECT。

## Issue Mapping

| Signal | Mapping | Action |
|---|---|---|
| Adobe assistant distribution | 新策略機會，但未驗證本產品 pain | REPORT_ONLY |
| Interactive/manual finishing | #23 / #26 | Supporting evidence only |
| Reference continuity | #22 | Already tracked |
| Cloudflare analytics | #26 | Supporting evidence only |
| Content Credentials | #18 | Already tracked |
| Current safety/reliability | #11 / #7–#10 | Higher priority |

本輪沒有 Issue/comment write，因此沒有取得 issue lock。

## Sources

Checked 2026-09-25：
1. Adobe, 2026-09-24 — https://blog.adobe.com/en/publish/2026/09/24/adobe-comes-to-gemini-expands-what-you-can-do-in-claude
2. Cloudflare Images changelog, 2026-09-23 — https://developers.cloudflare.com/changelog/product/images/
3. Cloudflare Images pricing — https://developers.cloudflare.com/images/pricing/
4. Canva Magic Layers — https://www.canva.com/newsroom/news/magic-layers-ai-assistants/
5. OpenAI Images 2.5, 2026-09-08 — https://openai.com/index/introducing-chatgpt-images-2-5/

Confidence：Adobe/Cloudflare feature existence HIGH；real `flux-image-gen` demand for assistant connector UNKNOWN；browser-local vs server-side exact-text path NEEDS_RUNTIME_VERIFICATION。

## What Changed

Compared with `2026-09-22T095909Z-external-radar.md`：
1. NEW：Adobe 2026-09-24 把 specialist creative stack 更深入嵌入 general assistants，且配 interactive editor。
2. NEW：Cloudflare 2026-09-23 加 transformation analytics。
3. 沒有新 user evidence 建立 connector demand 或推翻 simplify direction。
4. 既有 #22/#23/#26 已覆蓋最直接可移植 workflow。
5. 本輪 **0 new Issue、0 Issue/PR comment/scope modification、0 implementation authorization**。

## Completion / gaps / cursor

Completed：規則 SHA、fresh inventory、target HEAD、README/open+closed Issues/all-state PRs/prior radar、公開網路一手來源、去重與 scope calibration 均已完成。

Gaps：沒有 production deploy、付費 provider、Cloudflare Images transformation、mobile study 或 assistant connector runtime；沒有真人需求研究；不宣告 portfolio CLEAN。

Next fair-rotation cursor：**`Reese-max/claude-mem`**。

Notification：**YES — major competitor distribution-strategy change；但沒有 feature approval。**
