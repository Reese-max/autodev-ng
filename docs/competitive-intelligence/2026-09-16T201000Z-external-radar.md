# 外部競品／新品／工作流靈感雷達 — 2026-09-16T20:10:00Z

## Scope / rules / evidence boundary

- Owner scope：只處理 `Reese-max` 自有 repositories；未操作第三方 repository。
- Issue Quality：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- 本輪 fresh owner inventory：**42 owned、39 unarchived**；archived 仍為 `gemini-deidentifier`、`obsidian-vault`、`openab`。產品適用範圍沿用已校準的 36 product-like + 3 support/compatibility-only，但 owner 總數來自本輪 fresh pagination，不使用舊 inventory 當全集。
- 最新跨排程 cursor 來自 `2026-09-16T180108Z-external-radar.md`：上一輪完成 `exam-archive`，本輪 fair-rotation target 為 **`Reese-max/flux-image-gen`**。
- Target current default branch：`main@dfadcf30ca1d3daf479e05dd97aa457afa265333`。該 HEAD 為 2026-09-11 audit/docs-only commit；最近 substantive security baseline 為 `ce69e934e43df5a9cc0d76337414c63d82b778de`。
- 本輪只做公開網路研究、GitHub read、新增一張窄 research Issue 與中央 radar report；**未修改產品 code、CI/config、secrets、permissions/settings、branch，未 merge/deploy、未啟動 worker/GOAL、未執行付費 provider request 或 production write**。
- 沒有實際執行 FLUX.2 image edit，因此新研究仍是 `NEEDS_RUNTIME_VERIFICATION`；不宣告 portfolio CLEAN。

## Owner direction / current coordination

上一輪針對 `flux-image-gen` 的 external radar 已把產品方向校準為：先完成安全／可靠性／成本 truth，再談新創作能力；避免為競品功能直接批准大型 editor / account / cloud project / provider framework。

本輪重新核對 active work：

- #11：production abuse-control fail-closed；PR #20 **open**。
- #7/#8/#9/#10：batch/export/regenerate/moderation defects；PR #21 **open**。
- #18：provenance / Content Credentials；PR #19 **open**，且 review 仍有 edit-history regeneration、moderation false-positive、8MB verifier precache 等 findings；本輪不搶其 scope。
- #22：Creative Edit Session + Reference Tray，沒有 comments；先前 radar 已把它縮成「history output 能否一鍵成為現有 reference」的最小研究，而不是直接批准 IndexedDB/session framework。
- Branch `feat/edit-tab-toolkit` 仍存在但最後 commit 為 2026-08-23，沒有對應 PR，且已與 main 大幅 diverge；其 edit toolkit 仍是 prompt-only presets，沒有 mask/region/markup spatial targeting，因此不是本輪新 fingerprint 的 active ownership。

## Executive decision

**建立 1 張窄研究 Issue：`flux-image-gen #23`。**

本輪最有價值的新外部訊號是：AI image editing 的競爭焦點正在從「文字描述如何改」進一步移向**「直接在畫面上告訴模型要改哪裡」**。

2026-09-08 OpenAI 發布 ChatGPT Images 2.5，除了提升單一元素精準修改與 multi-turn consistency，產品面直接加入：

- 在圖片上放 comments 做 focused editing；
- Sketch：直接畫圖作為最終圖片 reference。

Adobe Firefly 目前亦把 AI Markup 定義成「文字 + 筆刷/freehand + region selection」，並直接說 region selection 用於 text prompt alone 不足以鎖定修改位置的情境。

這與目前 `flux-image-gen main` 的 request contract 有明確差異：`buildEditFormData()` 只送 `prompt + turnstileToken + 1–4 images`；reference role 只有 character/product/style/composition，沒有 mask、region、annotation coordinates 或其他 explicit spatial target。

但這**不是已證實產品缺陷**。沒有真人資料證明目前使用者常因局部 target ambiguity 失敗，因此不建立 P1/P2，也不把 release checklist 裡尚未開放的「局部修改」直接變成功能承諾。

最小研究問題為：

> 在不換 provider/model、不做 production UI 的前提下，能否把一次性 markup overlay 當成第二張 reference，沿用既有 Workers AI FLUX.2 Klein multi-reference edit path，讓「只改某個指定物件／區域」更準、少重試，且不破壞非目標區？

若不成立就 REJECT；不會因競品有 markup 就導入第二套 inpainting model 或 Photoshop-like editor。

Issue：https://github.com/Reese-max/flux-image-gen/issues/23

---

# Product → Market Category

`flux-image-gen` 本輪有效比較範圍：

1. **Direct image generation/editing**：OpenAI ChatGPT Images / GPT-Image、Adobe Firefly。
2. **Adjacent integrated creative workflow**：Google Pics / Workspace image editing。
3. **Current provider capability**：Cloudflare Workers AI FLUX.2 Klein multi-reference，以及既有 mask-capable legacy/Beta diffusion models。
4. **Do-not-copy boundary**：完整 Photoshop/Canva layer editor、帳號協作、provider/model migration、持久 annotation DB。

---

# External Signals

## A. Direct competitor — OpenAI Images 2.5：精準編輯開始加入直接畫面指示

**CONFIRMED — published 2026-09-08; checked 2026-09-17.**

Source:
- https://openai.com/index/introducing-chatgpt-images-2-5/

官方重點：

- Images 2.5 更能只修改指定元素並保留其餘細節。
- multi-turn editing 更能維持先前修改與整體品質。
- ChatGPT 加入 **Sketch**，可直接畫作為 final-image reference。
- 可直接在圖片上放 **comments**，做更 focused 的 editing。
- API 推出 GPT-Image-2.5 Flare / Sunburst；Sunburst 強調更高精準控制但延遲較長。

### User job / workflow signal

舊流程：

`上傳圖片 → 用文字說「左邊第二個杯子／人物旁邊那塊」→ 模型猜 target → 不準再重述`

新的產品抽象：

`在畫面上指示 target → 再描述 change → edit`

可移植的是**把 location 與 intent 分開表達**，不是照抄 OpenAI model 或 ChatGPT editor。

### Evidence limit

OpenAI 的產品能力與其模型品質，不等於 FLUX.2 Klein 會同樣理解 annotation overlay；也不證明 `flux-image-gen` 的使用者目前大量遇到此問題。因此只支持 narrow research，不支持功能優先級升成 P1/P2。

## A2. Direct competitor — Adobe Firefly AI Markup

**CONFIRMED — official doc updated 2026-06-30; checked 2026-09-17.**

Source:
- https://helpx.adobe.com/tw/firefly/web/work-with-images/edit-images/use-ai-markup.html

Firefly AI Markup 讓使用者：

- 用文字框放在要改的位置；
- 用 brush/freehand 直接在圖上畫；
- 用 region 選取局部；
- 再搭配文字 prompt 生成修改。

官方文件直接說 region-based selection 能在「text prompts alone 不足」時鎖定要修改的區域。

### Transferable principle

**Spatial target 是 input evidence，不必先成為持久 project state。**

這支持最小實驗先做 ephemeral markup，而不是把 #22 的 CreativeSession、reference persistence、branching 和本研究綁成同一個大型工程。

## B. Adjacent workflow — Google Pics

**CONFIRMED — published 2026-09-01; checked 2026-09-17.**

Source:
- https://blog.google/products-and-platforms/products/workspace/google-pics/

Google Pics 在 Workspace 中主打 generate/refine，並支援 isolate objects、直接編輯／翻譯圖片中的文字與協作。

### Transferable / do-not-copy

它補強「生成後要能針對局部物件繼續完成作品」的市場方向，但不證明本 repo 需要 account、Workspace integration、collaboration 或 editable text layer。這些全部留在 `DO NOT COPY`。

## C. Provider reality — 先重用 FLUX.2 multi-reference，不先切 inpainting model

**CONFIRMED — current Cloudflare docs; checked 2026-09-17.**

Sources:
- https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/
- https://developers.cloudflare.com/changelog/product/workers-ai/
- https://developers.cloudflare.com/workers-ai/models/stable-diffusion-v1-5-inpainting/

Current facts：

- FLUX.2 Klein 4B 是 Cloudflare-hosted partner model，generation/editing 統一，適合 interactive workflows。
- Cloudflare current changelog 說明 FLUX.2 Klein 支援最多 4 張 reference image，可用 index 或自然語言描述 reference 關係，input images <512×512。
- Cloudflare 另有舊的 Stable Diffusion inpainting Beta，API 有 explicit `mask` parameter。

### Decision

「Cloudflare 有 mask model」不是新增 provider/model 的價值證據。最小順序應是：

1. 現有文字提示是否已足夠；
2. 若不足，以 local fixture 產生一次性 markup reference，仍走現有 FLUX.2 path；
3. 只有 1/2 都失敗且有真實 user value 證據，才另研究 mask-aware model。

---

# New Releases

### OpenAI Images 2.5 — 2026-09-08

本輪真正的新競爭策略變化。前一份 `flux-image-gen` radar（2026-09-15T140841Z）已涵蓋 Midjourney session edit、Firefly unified workspace、Canva Magic Layers、BFL MCP、Cloudflare granular pricing，但**沒有涵蓋 OpenAI 9/8 把 Sketch + image comments + precision editing 一起推成產品一級能力**。

這使「spatially grounded edit」成為新的獨立 fingerprint，而不是 #22 的 session continuity 重複訊號。

---

# Community Pain

本輪沒有使用社群抱怨來推估發生率，也沒有找到足以把 `flux-image-gen` 的局部 edit ambiguity 升成已證實 defect 的真人 evidence。

結論：**User Pain = UNKNOWN**。競品策略與 repo contract 足以支持 bounded research；不足以支持 severity 升級或 implementation approval。

---

# Adjacent Ideas

1. **Ephemeral markup as reference**：在 browser/test fixture 上生成圈選、箭頭或半透明區域標記，當第二張 reference，而不是持久 mask schema。
2. **Target-vs-rest evaluation**：研究成功標準要同時看 target compliance 與 non-target preservation；不能只看整張圖「好不好看」。
3. **Reuse provenance later, not prerequisite**：若 #18 未來完成，markup experiment 可把 exact input hashes/operation 記進 receipt，但 #23 不應等 #18 才能回答研究問題。

---

# Opportunity Map — `flux-image-gen`

| Class | Decision |
|---|---|
| MUST MATCH | 先完成既有 production abuse-control、batch/export/regenerate/moderation 可靠性與 truthful provider/cost paths；本輪不降低既有 blockers。 |
| SHOULD BE BETTER | 對「只改特定區域」提供更少歧義的 target expression，但先用 bounded experiment 證明比現行文字指令有實際改善。 |
| DIFFERENTIATOR | 中文優先 + local-first history/privacy + provenance + 低摩擦精準 edit；不是更多模型數量。 |
| ADJACENT IDEA | 一次性 local markup overlay 作為既有 FLUX.2 reference，若成立再考慮極薄 UI。 |
| DO NOT COPY | Photoshop-like layer editor、Adobe cloud project、Google Workspace collaboration、account system、持久 annotation DB、只因有 mask API 就切第二模型。 |

---

# Four-gate calibration

## 1. 問題／價值

- Target user：已使用現有 edit，想只改某一指定物件／區域的人。
- Repo evidence：`main@dfadcf...` 的 `buildEditFormData()` 只有 prompt + images + Turnstile；沒有 spatial target。
- Existing alternative：更精確地用文字描述位置；1–4 reference roles。
- Uncertainty：沒有真人資料證明此摩擦高頻或造成完成率下降。
- Gate：**Research only，pass with uncertainty**。

## 2. 優先級

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`

不使用競品發布把它升成 P1/P2；既有 #11 等已證實 reliability/safety work 仍較優先。

## 3. 最小方案

順序：

1. 不改；
2. 文件／prompt wording；
3. 隔離 fixture 中產生 ephemeral markup reference，重用既有 FLUX.2 multi-reference；
4. 只有新的 runtime evidence 證明 1–3 不足，才研究 mask-aware model。

沒有先建立 canvas editor、mask service、annotation store、CreativeSession 或 provider abstraction。

## 4. Research / implementation separation

#23 的最小實驗：2–3 個固定非敏感 fixture，text-only vs markup-reference，比較：

- target compliance；
- non-target preservation；
- retries；
- latency；
- 真實 provider 執行時的 usage/cost receipt；
- overlay 是否反而被模型當成需保留的畫面內容。

退出：`BUILD / NARROW / REJECT`。BUILD 只代表下一步可評估薄 UI，不代表自動實作、merge 或 deploy。

---

# Rejected / Deferred Ideas

- **直接新增 mask model**：REJECT NOW。沒有證據證明現有 provider 無法用更小方法解決。
- **把 #23 合併進 #22 CreativeSession**：REJECT。跨-turn context 與 per-turn spatial target 是不同 fingerprint；綁在一起會讓研究問題膨脹。
- **完整 editor / layers**：REJECT。產品規模與 owner direction 不支持。
- **Google Pics 式團隊協作／帳號**：REJECT。沒有需求 evidence。
- **只加「局部修改」按鈕**：REJECT。release TASK-035 已明確禁止未接完整能力的空入口。

---

# Issue Mapping

| Fingerprint | Tracking | Result |
|---|---|---|
| production abuse-control | #11 + PR #20 | Active; no radar mutation |
| batch/export/regenerate/moderation | #7–#10 + PR #21 | Active; no radar mutation |
| provenance/C2PA | #18 + PR #19 | `SKIPPED_LOCKED_ACTIVE_PR#19` |
| cross-turn reference/session reuse | #22 | Existing research; no update |
| per-turn localized spatial target ambiguity | **#23** | **New bounded RESEARCH**, `NOT_ESTABLISHED / MEDIUM / NEEDS_EVIDENCE / auto_implementation=false` |
| unfinished local edit entry points | release TASK-035 | Existing guardrail; not a feature commitment |

New Issue was re-read after creation and confirmed at:
https://github.com/Reese-max/flux-image-gen/issues/23

---

# What Changed

Relative to the previous deep `flux-image-gen` radar (`2026-09-15T140841Z-external-radar.md`):

1. **New direct-competitor strategy signal**：OpenAI Images 2.5 (2026-09-08) makes Sketch + image comments + precision editing first-class product controls; this was not captured in the prior report.
2. This creates a new, independent product question: *how the user points to the place to edit*, distinct from #22’s *how reference context persists across turns*.
3. Current repo request contract is still prompt + references only; no default-branch spatial target mechanism was found.
4. Cloudflare’s current FLUX.2 multi-reference capability suggests a smaller experiment than switching to a mask/inpainting model.
5. One new narrow Research Issue (#23) passed Gate; no implementation authority was granted.

---

# Sources

## Official / first-party

- OpenAI, ChatGPT Images 2.5, 2026-09-08: https://openai.com/index/introducing-chatgpt-images-2-5/
- Adobe Firefly, 使用「標記」編輯影像, updated 2026-06-30: https://helpx.adobe.com/tw/firefly/web/work-with-images/edit-images/use-ai-markup.html
- Google, Google Pics, 2026-09-01: https://blog.google/products-and-platforms/products/workspace/google-pics/
- Cloudflare Workers AI, FLUX.2 Klein 4B: https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/
- Cloudflare Workers AI changelog, FLUX.2 multi-reference: https://developers.cloudflare.com/changelog/product/workers-ai/
- Cloudflare Workers AI, Stable Diffusion v1.5 inpainting Beta: https://developers.cloudflare.com/workers-ai/models/stable-diffusion-v1-5-inpainting/

No community source was used as prevalence evidence this round.

---

# Completion / gaps / cursor

Completed:
- Re-read Issue Quality v2 and recorded rule blob.
- Fresh owner pagination: 42 owned / 39 unarchived.
- Reconciled latest fair-rotation cursor and selected `flux-image-gen`.
- Re-read current README/default-branch edit contract, release checklist, current issues, all-state PR search, active PR metadata/comments, current branches and stale divergent edit-toolkit branch.
- Performed fresh public-web research using first-party OpenAI, Adobe, Google and Cloudflare sources.
- Re-deduped before write; created and re-read `flux-image-gen #23`.
- Wrote this unique central report.

Gaps / not claimed:
- No live FLUX.2 request was executed.
- No real-user test establishes frequency or task completion impact.
- No paid-call cost/latency receipt exists for the proposed experiment.
- No implementation, preview, deployment, merge or product code change was made.
- No portfolio CLEAN claim.

Next cold-rotation target: **`google-maps-personal-mcp`**. Before any write, re-read current HEAD, owner direction, open/closed Issues, full comments, all-state PRs/branches and available heartbeat/lock evidence; do not reuse old assumptions if provider APIs or repo state changed.
