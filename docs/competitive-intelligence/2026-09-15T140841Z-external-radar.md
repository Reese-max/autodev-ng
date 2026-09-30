# 外部競品／新品／工作流靈感雷達 — 2026-09-15T14:08:41Z

> 查閱日：2026-09-15（UTC；臺灣 2026-09-15）。
>
> Issue Quality：`issue_quality_version: 2`；規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`（`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`）。
>
> 本輪只做公開網路研究、repository / Issue / PR / branch / audit 唯讀核對，以及新增本中央雷達報告。沒有修改產品原始碼、CI/config、secret、權限或 repository settings；沒有建立實作 branch、merge/deploy、啟動 worker/run/GOAL、付費試用或變更正式資料。

## Executive Summary

跨排程先讀到最新 `docs/portfolio-audit/2026-09-15T140713Z-product-board-delta.md`：Product Board 已完成 `exam-archive`，並把下一個公平輪巡目標指向 `Reese-max/flux-image-gen`。因此本輪沒有重複搶做 `exam-archive`，而是深讀 `flux-image-gen`。

重新完整分頁列舉 connected owner inventory：**42 個 Reese-max owned repositories，3 archived、39 owned + unarchived**；第二頁為空。沿用目前已核對範圍 **36 product-like + 3 support/compatibility-only**（`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`），沒有操作他人 repository。

本輪公開網路找到三組有效訊號：

1. **Midjourney / Adobe Firefly 正把「參考素材 + 多輪編輯 + generation history / project assets」做成同一個創作工作流。** 但這不是新的 fingerprint：`flux-image-gen #22` 已經用同一批來源追蹤「重新選檔／重新上傳／重新指定 reference role」摩擦。
2. **Black Forest Labs 已直接提供官方 FLUX MCP server**，可在 Claude、Codex、Cursor、Windsurf 等 MCP client 內完成 generate/edit/variations/history/credits。這使「再包一層通用 FLUX MCP」更像商品化基礎能力，而不是 `flux-image-gen` 的差異化方向。
3. **Cloudflare Workers AI 現行圖像價格已是 model / input tile / output tile / steps 等細粒度計價**；而 repo 目前仍以單一 `USAGE_ESTIMATED_COST_USD_PER_IMAGE` 預估所有 image provider/model。這是可觀察的估算粒度差異，但 release checklist 已明確把「成本估算校準」列為 `TASK-039` release blocker，因此不另開 Issue。

經 Issue Quality v2 四道 Gate，決策為：**0 新 Issue、0 既有 Issue 修改、0 新實作授權**。本輪最有價值的結果是範圍校準：`flux-image-gen` 應先完成現有安全／可靠性／成本 truth，再把 #22 的研究問題縮成「能否用既有 history record 一鍵成為當前 reference」，而不是先批准一整套 CreativeEditSession / IndexedDB / branching framework。

---

## Scope / Repository Truth

### `flux-image-gen`

- Default branch：`main`。
- Current HEAD：`dfadcf30ca1d3daf479e05dd97aa457afa265333`（2026-09-11；docs-only audit commit）。
- 最近 substantive security code baseline：`ce69e934e43df5a9cc0d76337414c63d82b778de`。
- 產品定位：FastAPI + Cloudflare Workers AI 圖片生成／編輯網站，中文優先，無帳號；具 history、版本鏈、分享／匯出、R2、PWA、成本 Dashboard、moderation、Turnstile、rate limit。
- `/edit` 現行支援 1–4 張 reference image；default Workers AI edit model 為 `@cf/black-forest-labs/flux-2-klein-4b`。
- Release checklist 明定：尚未完成的「局部修改、換背景、擴圖、去背、加文字、調整比例」不得做成可點入口或空承諾；現行公開面只應顯示真正可送出的通用／角色一致／產品照模式。
- Round 3 audit 仍判定 **NOT CLEAN**：#11 的 production abuse-control release path 尚未完整 runtime 驗證；production branch 仍落後。

### Existing active ownership / coordination

- **#11**：P1 production abuse-control fail-closed；PR #20 active。不得被本雷達新功能研究阻塞。
- **#7/#8/#9/#10**：已有 PR #21 處理 batch/export/regenerate/moderation defects。
- **#18**：provenance / Content Credentials；PR #19 active，故本輪相關來源只進中央報告，`SKIPPED_LOCKED_ACTIVE_PR#19`。
- **#22**：Creative Edit Session + Reference Tray；目前無 comments、無 lock marker、未見對應 active PR/branch。但本輪外部訊號主要重複其既有 Midjourney / Adobe / Canva 證據，沒有真人 task evidence，因此不為了重複訊號留言或擴大 scope。

---

# Product → Market Category

`flux-image-gen` 本輪有效比較範圍：

1. AI image generation/editing：Midjourney、Adobe Firefly、Black Forest Labs FLUX。
2. Creative continuity / project assets：Firefly generation history + Project media、Midjourney Edit Lightbox。
3. Assistant distribution：BFL FLUX MCP、Canva Magic Layers in AI assistants。
4. Provider cost / operational truth：Cloudflare Workers AI pricing。

不把完整 Photoshop/Canva editor、帳號協作雲、generic design suite、native desktop 或模型 marketplace 自動視為 must-have。

---

# External Signals

## A. 直接競品更新 — Midjourney 把 edit + references + session history 放進 Lightbox

**CONFIRMED｜2026-09-03｜checked 2026-09-15**

Source: https://updates.midjourney.com/alpha-changelog-9-2-26/

Midjourney v8.2 Edit Model 可直接在 image lightbox 使用自然語言修改、附最多 4 張 reference images，並在同一處看到 all session edits。8 月 27 日公告亦把 inpainting / outpainting / multi-reference 納入同一 edit model。

Source: https://updates.midjourney.com/edit-model-for-v8/

### JTBD / workflow signal

把原本的：

`找到舊圖 → 重新上傳 → 記住上次參考 → 再做一次 edit`

縮成：

`打開既有結果 → 沿用上下文 → 修改 → 看同 session revisions`。

### Limit

Midjourney 自己把 Alpha 描述為快速實驗環境；近期使用者也曾回報多輪 edit 會讓未編輯區域品質下降。這是 anecdotal evidence，不是發生率；9 月 3 日回覆又表示已有改善。

Representative community signal: https://www.reddit.com/r/midjourney/comments/1w2adon/midjourneys_new_editing_interface_reduces_overall/

### Reese implication

這與 #22 完全相同 fingerprint，不能換名重開。可移植的是「reuse current artifact/reference + session continuity」，不等於要複製完整 Lightbox、mask/outpaint UI 或雲端 gallery。

---

## A2. 直接競品更新 — Adobe Firefly 把 generation / edit / Project media / history 合併

**CONFIRMED｜updated 2026-09-08｜checked 2026-09-15**

Sources:
- https://helpx.adobe.com/sg/firefly/web/unified-generation-and-editing-experience/generation-and-editing-experience-overview.html
- https://helpx.adobe.com/firefly/web/unified-generation-and-editing-experience/generate-and-edit-content.html

Firefly Beta 把 image/video generation、editing、Project media、Files、generation history 與 timeline 放進單一 workspace。既有 generated content 可加入 Project media，也能直接重用 prompt/reference/model/aspect/resolution。

### Transferable principle

真正的產品價值不是多一顆模型，而是**避免 download → upload → reselect → restate context**。

### Do not copy

`flux-image-gen` 沒帳號系統，local-first + explicit share 是目前成本/隱私優勢；沒有證據支持先複製 Adobe cloud project/account/collaboration backend。

---

## B. 相鄰 workflow — Canva 把 flat AI image 交回 editable surface

**CONFIRMED｜checked 2026-09-15**

Sources:
- https://www.canva.com/newsroom/news/magic-layers-ai-assistants/
- https://www.canva.com/magic-layers/

Canva Magic Layers 已可從 Gemini / ChatGPT 把 AI-generated flat image 轉成 Canva 可編輯 layers，官方明確把舊流程描述為 generate → download → re-upload，再由 integration 縮短 handoff。

### Product signal

「生成」與「可繼續完成作品」正在分離：生成模型越來越商品化，持續編輯上下文與 downstream handoff 更可能是體驗差異。

### Counterargument / DO NOT COPY

這不證明 `flux-image-gen` 應做 raster→layers。repo release checklist 反而明確要求未完成 edit tool 不得露出空入口；且 Magic Layers 本身是 premium AI allowance。故只保留為相鄰設計訊號。

---

## C. 新工具／技術 — BFL 官方 FLUX MCP 已把通用 model invocation 商品化

**CONFIRMED｜checked 2026-09-15**

Source: https://docs.bfl.ai/api_integration/mcp_integration

官方 FLUX MCP server 支援 Claude、Codex、Cursor、Windsurf 等 MCP client，使用 OAuth，不需把 API key 貼進對話；工具已涵蓋 `generate_image`、`generate_variations`、`get_history`、`get_credits`，並能重用原 prompt/model/dimensions/input images。

### Strategic signal

若 `flux-image-gen` 再做一個「通用 FLUX MCP wrapper」，很容易與 provider 官方能力同質化。產品更合理的差異化仍是：

- 中文／用途導向 workflow；
- local-first history/reference reuse；
- 明確 moderation / cost / abuse-control boundary；
- provenance / reproducibility；
- 分享與作品管理。

### Risk

MCP client 可能直接觸發 provider effect；這條 path 不會自動經過本 repo 的 Turnstile、rate limit、moderation、usage dashboard。沒有明確 product requirement 前，不應把 MCP 當新的公開寫入 surface。

**Decision：DO NOT BUILD / radar-only。**

---

# New Releases / Pricing Signal

## Cloudflare Workers AI granular pricing

**CONFIRMED｜pricing page updated 2026-08-28｜checked 2026-09-15**

Sources:
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/

Current pricing is model/input/output dependent. Example:

- `flux-2-klein-4b`: $0.000059 / input 512×512 tile + $0.000287 / output 512×512 tile.
- `flux-2-dev`: $0.00021 / input tile / step + $0.00041 / output tile / step.
- Workers AI overall bills at $0.011 / 1,000 neurons above the free 10,000 neurons/day allocation.

Current repo code uses one flat `USAGE_ESTIMATED_COST_USD_PER_IMAGE` (default `0.003`) for non-demo image provider attempts. That cannot represent model/resolution/input-image/step dependent pricing precisely.

However this is **not a new defect fingerprint**: `docs/release-acceptance-checklist.md` already has `TASK-039 成本估算校準` as a release blocker requiring real provider price calibration. Therefore: **no Issue**. Any later fix should prefer reusing current usage events and adding only the smallest provider/model-aware estimator necessary; do not build a new billing service.

For reference only, BFL direct API has different pricing (`FLUX.2 klein 4B from $0.014/image`), proving provider-host pricing cannot safely be inferred from model family name alone:
https://docs.bfl.ai/quick_start/pricing

---

# Community Pain Points

**COMMUNITY_SIGNAL — not prevalence data**

1. Midjourney user report (2026-08-30): repeated inpainting/editing could reduce untouched-area quality; later replies reported partial improvement. This supports retaining parent revisions/compare rather than assuming latest output is best.
   - https://www.reddit.com/r/midjourney/comments/1w2adon/midjourneys_new_editing_interface_reduces_overall/
2. The evidence does **not** establish that `flux-image-gen` currently suffers the same degradation, because provider/model/runtime paths differ. No bug or severity escalation.

---

# Opportunity Map — `flux-image-gen`

| Class | Decision |
|---|---|
| MUST MATCH | Truthful provider/model/cost metadata; reliable generate/edit/export paths; production abuse-control gate. These are already tracked (#11, #7–#10, TASK-039). |
| SHOULD BE BETTER | Reduce current history→edit reselect/reupload friction, but first test the smallest path: “Use this history image as current reference” into the existing in-memory reference selection. Do not require persistence framework to answer whether the friction matters. |
| DIFFERENTIATOR | Local-first creative history + privacy-aware sharing + provenance/reproducibility, without forcing an account/cloud project. #18 is active under PR #19. |
| ADJACENT IDEA | Assistant/MCP distribution may later become a thin integration surface, but only if it can preserve existing moderation/cost/effect authority; currently no evidence this is higher priority than core reliability. |
| DO NOT COPY | Full Canva/Adobe layered editor, Adobe cloud project backend, generic model zoo, native desktop app, or mask/outpaint UI solely because competitors expose them. Current release scope explicitly rejects unfinished edit controls. |

---

# Cross-Portfolio Ideas

只有兩項具可移植性，未建立 umbrella Issue：

1. **Artifact reuse before new storage architecture**：對 `ppt-studio`、`video-timeline-pipeline`、`UkePack` 等，先測「既有 canonical artifact 一鍵帶入下一步」是否已消除主要人工 handoff，再決定是否需要 session/database/framework。
2. **Provider-aware cost truth**：任何多 provider AI 產品若向使用者顯示「估計成本」，應綁 provider/model/unit assumptions 和 checked-at/version；不能用單一靜態 per-call 值假裝精確。是否需要共用框架仍未證明。

---

# Rejected / Deferred Ideas

- **新開「FLUX MCP」Issue：REJECT。** Provider 官方已有 MCP，且目前本產品沒有 user evidence 證明 chat-agent distribution 是主要 JTBD；新增 effect surface 還會跨越現有安全／成本 boundary。
- **新開「Magic Layers / editable layers」Issue：REJECT。** 與 owner 現行 release scope 不符，且成本／模型依賴高。
- **新開「inpainting/outpainting UI」Issue：REJECT。** release checklist 明確要求未完成模式不可露出，競品有功能不是本產品需求證據。
- **新開「成本錯誤」Issue：DUPLICATE/NO ISSUE。** 已被 TASK-039 release blocker 覆蓋。
- **更新 #22：NO WRITE。** 外部來源與 #22 既有 evidence 高度重複，沒有新的真人 evidence 或 state transition；避免 comment churn。
- **更新 #18：SKIPPED_LOCKED_ACTIVE_PR#19。** 不搶 active implementation/research scope。

---

# Issue Mapping / Quality Calibration

| Fingerprint | Current tracking | Calibration this run |
|---|---|---|
| production abuse-control release path | #11 + PR #20 | existing P1; no change |
| batch/export/regenerate/moderation defects | #7–#10 + PR #21 | active implementation; no radar write |
| provenance / C2PA | #18 + PR #19 | SKIPPED_LOCKED; no write |
| repeated reselect/reupload reference context | #22 | `kind=RESEARCH`, `severity=NOT_ESTABLISHED`, `decision_priority=MEDIUM`, `triage=NEEDS_EVIDENCE`, `auto_implementation=false` as current radar interpretation; no Issue mutation this run |
| image cost estimate accuracy | release checklist TASK-039 | existing validation/release blocker; no new Issue |

### #22 smallest valid research question

Current #22 is broader than needed to answer the first product question. Before any READY transition, the decision should be narrowed to:

> 在 3-round edit fixture 中，把既有 history output 直接放入現有 1–4 reference selection，是否實際消除重複 download/file-select/upload/restate-role 的主要摩擦？

Minimum experiment:

1. No account/cloud sync/new DB.
2. Reuse current history record + existing in-memory `selected[]` path.
3. Compare current manual workflow vs one-click history→reference on 3 fixed edit tasks.
4. Measure only observable actions/errors/reselection; do not invent time saved or adoption rate.
5. `BUILD` only if the friction is materially reduced and reload persistence is independently shown necessary; `NARROW` if current-tab reuse is enough; `REJECT` if users do not repeat this workflow or existing manual path is acceptable.

This narrowing is recorded in the central report only; it does not rewrite #22 or authorize implementation.

---

# What Changed Since Last Radar

Relative to `2026-09-15T121112Z-external-radar.md` and the later Product Board delta:

1. Fair rotation moved from already-handled `exam-archive` to `flux-image-gen` based on the newer cross-schedule cursor.
2. No new high-confidence product opportunity passed Issue Quality v2.
3. BFL official MCP strengthens a **do-not-rebuild commodity integration** conclusion.
4. Cloudflare’s current granular price table provides fresh evidence for existing TASK-039, not a new Issue.
5. #22 should be interpreted more narrowly than its original architecture-heavy body until real task evidence exists.

---

# Sources

## Official / first-party

- Midjourney Alpha Changelog, 2026-09-03: https://updates.midjourney.com/alpha-changelog-9-2-26/
- Midjourney Edit Model for V8, 2026-08-27: https://updates.midjourney.com/edit-model-for-v8/
- Adobe Firefly unified generation/editing overview, updated 2026-09-08: https://helpx.adobe.com/sg/firefly/web/unified-generation-and-editing-experience/generation-and-editing-experience-overview.html
- Adobe Firefly generate/edit content, updated 2026-08-19: https://helpx.adobe.com/firefly/web/unified-generation-and-editing-experience/generate-and-edit-content.html
- Canva Magic Layers in AI assistants: https://www.canva.com/newsroom/news/magic-layers-ai-assistants/
- Canva Magic Layers: https://www.canva.com/magic-layers/
- BFL FLUX MCP: https://docs.bfl.ai/api_integration/mcp_integration
- BFL pricing: https://docs.bfl.ai/quick_start/pricing
- Cloudflare Workers AI pricing, updated 2026-08-28: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Cloudflare FLUX.2 klein 4B model/pricing: https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/

## Community / anecdotal only

- Midjourney repeated-edit degradation discussion, 2026-08-30: https://www.reddit.com/r/midjourney/comments/1w2adon/midjourneys_new_editing_interface_reduces_overall/

---

# Completion / Gaps / Cursor

Completed:
- Re-read Issue Quality v2; blob SHA recorded.
- Fresh paginated owner inventory: 42 owned / 39 unarchived.
- Reconciled newer Product Board cursor before choosing target.
- Read current `flux-image-gen` README, recent commits, release checklist, audit, open/closed issue search, all-state PRs, issue #22 comments and current branches.
- Fresh public-web research covered A direct competitor, B adjacent workflow, C emerging provider/tooling plus current pricing.
- 0 Issue writes; no duplicated/active-scope takeover.

Not claimed:
- No live provider generation/edit request was executed.
- No production canary, Cloudflare billing receipt, real user usability study, or mobile/browser acceptance was run.
- Cloudflare pricing evidence updates estimator assumptions only; actual deployed usage/cost remains `NEEDS_RUNTIME_VERIFICATION` until compared with real provider receipts.
- No portfolio CLEAN claim.

Next cold-rotation target: **`google-maps-personal-mcp`**. Before any write, re-read current HEAD, owner direction, all Issue comments, all-state PRs/branches and available heartbeat/lock evidence; because this repo has changed recently, do not rely on older `UNKNOWN` classifications.