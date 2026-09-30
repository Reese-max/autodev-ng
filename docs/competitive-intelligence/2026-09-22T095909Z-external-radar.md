# 外部競品／新品／工作流靈感雷達 — 2026-09-22T09:59:09Z

## Status

**COMPLETE / MATERIAL EXTERNAL SIGNALS / NO NEW ACTIONABLE ISSUE / NO USER NOTIFICATION**

本輪 fair-rotation focus：`Reese-max/flux-image-gen`。

本輪遵守 Issue Quality v2；規則檔：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。

Fresh owner inventory 已重新完整分頁：**42 Reese-max-owned repositories、41 unarchived**；第二頁為空。本輪只處理自有 repo，不把舊 inventory 當全集，不操作第三方 repo。

Target current default branch：`Reese-max/flux-image-gen main@dfadcf30ca1d3daf479e05dd97aa457afa265333`。該 HEAD 為 audit/docs commit；最近 substantive security baseline 仍為 `ce69e934e43df5a9cc0d76337414c63d82b778de`。

本輪只做公開網路研究、GitHub read 與中央 radar report write；**沒有修改產品原始碼、CI/config、secrets、permissions/settings，沒有建立實作 branch、merge/deploy、啟動 worker/GOAL、呼叫付費 provider 或寫入正式資料**。

---

## Direction / current coordination

沿用 owner 已核定方向：`flux-image-gen` 先完成 **安全、可靠性、provider/cost truth、輸出/來源可追溯**，再評估新創作能力；不因競品功能直接擴成完整 editor、帳號／cloud project、provider framework 或模型追逐。

目前 default branch 已有：
- FastAPI + Cloudflare Worker 雙路徑；
- NVIDIA / Workers AI / Pollinations provider chain；
- 1–4 reference 的 FLUX.2 edit；
- history/version、export/share、usage/cost、moderation、Turnstile、rate limit；
- local-first 創作歷史與 PWA。

近期 changelog 也已明確刪除 custom-size UI、project board／idea-card 等對 casual 生圖使用者投報低的重 UI，因此「更多控制項」不是預設方向。

既有相關追蹤：
- #11：public generation abuse-control fail-closed；
- #7–#10：batch/export/regenerate/moderation defects；其中 PR #21 仍 open，直接碰到 provider failure / `rate_limited` retry semantics；
- #18：provenance / Content Credentials；
- #22：Creative Edit Session + Reference Tray（歷史較早、Issue 內 P2/92 分數不得按 Issue Quality v2 解讀為已證實 P2 缺陷）；
- #23：spatially grounded edit / ephemeral markup research；
- #26：exact visible text 的 deterministic overlay research。

本輪沒有去搶 active PR 的 provider-retry scope，也沒有因新外部訊號去擴 #23/#26。

---

# Product → Market Category

`flux-image-gen` 本輪對照：

1. **Direct image generation/editing**：Stability AI Image Services、OpenAI Images、Adobe Firefly / Photoshop、Google Pics。
2. **Adjacent workflow**：managed, bounded image-edit operations（erase / inpaint / remove background / recolor）與 beginner-oriented guided editing。
3. **Current enabling stack**：Cloudflare Workers AI / Images。
4. **Do-not-copy boundary**：新增 Bedrock/provider 面、完整 Photoshop/Canva layer editor、account/project collaboration、任意 custom-size surface、為模型 catalog 而擴張。

---

# External Signals

## A. Direct competitor / platform strategy — Stability AI Image Services on Amazon Bedrock

**CONFIRMED — announced 2026-09-18; checked 2026-09-22.**

Sources:
- https://stability.ai/news-updates/stability-ai-brings-image-services-to-amazon-bedrock-delivering-professional-creative-control-with-enterprise-grade-infrastructure
- https://docs.aws.amazon.com/bedrock/latest/userguide/stable-image-services.html

Stability AI 把 image editing 明確拆成 managed API operations。官方公告列出 Inpaint、Erase、Remove Background，並把產品概念描述成多步驟 refinement，而不是每次都重做整張圖；AWS 文件目前列出更完整的 Edit / Control 類別，包含 mask、search/replace、recolor、upscale 等 bounded operations。

### User job / transferable signal

真正可移植的不是「再接 AWS」，而是：

`使用者想做一個明確局部動作 → 系統知道 action + target → 只修改必要範圍 → 保留其他構圖`

這再次支持 #23 的核心假設：**target intent 應能比純文字更明確地表達**。但 #23 已存在，且本輪沒有新真人完成率／重試率證據，因此只記為 supporting evidence，不留言、不升 severity、不自動 BUILD。

### DO NOT COPY

- 不新增 Bedrock provider；
- 不把 13 個 Stability Image Services 全部做成模式；
- 不因 API catalog 很完整就建立 provider abstraction framework；
- 不用競品 managed-service 可用性替代本產品 runtime evidence。

---

## B. New stack capability — Cloudflare Workers AI `rejectIfBusy`

**CONFIRMED — released 2026-09-17; checked 2026-09-22.**

Sources:
- https://developers.cloudflare.com/changelog/post/2026-09-17-reject-if-busy/
- https://developers.cloudflare.com/workers-ai/features/reject-if-busy/
- https://developers.cloudflare.com/workers-ai/platform/errors/

Cloudflare 現在允許 synchronous Workers AI call 設 `rejectIfBusy: true`：capacity unavailable 時不進 capacity queue，而是立即拒絕。官方明確定義：
- out-of-capacity：HTTP `429`, internal code `3040`；
- daily/account limit：HTTP `429`, internal code `3036`。

這對 current repo 有直接關係：`cloudflare/src/image.js` 的 `runWorkersAiOnce()` 目前直接 `env.AI.run(...)`，外層另外用 `WORKERS_AI_FETCH_TIMEOUT_MS` 與 `Promise.race()` 限制等待，並有 Workers AI → Pollinations fallback。repo 本身先前又新增 NVIDIA circuit breaker，目的就是避免 provider dark 時每張圖長時間等待。

### Candidate value

新選項提供一個非常小的可能改善：**若使用者真正遇到 Workers AI capacity queue，可把「等到 local timeout 才 fallback」改成「平台確認 busy 後立即進既有 recovery path」**，不需要新 queue、background job、provider service 或第二套 UI。

但目前不能直接立案：

1. 本輪沒有 production/runtime evidence 證明 `flux-image-gen` 實際遇到 3040 capacity queue 或造成可觀察完成率/等待問題；
2. current Worker error wrapper 會把多數 non-content-filter `env.AI.run()` exceptions 統一轉成 `502 workers_ai_error`，所以在談 `rejectIfBusy` 前，必須先確認 binding error 是否能安全保留 `3040` vs `3036` 的語義；
3. PR #21 **open**，正在處理 batch variant 的 `rate_limited` / timeout / provider-error retry；現在另開 provider retry issue 容易搶 active scope 或導致兩套重試規則。

### Classification

`kind=RESEARCH / severity=NOT_ESTABLISHED / decision_priority=MEDIUM / triage=NEEDS_EVIDENCE / auto_implementation=false`

Decision：**REPORT_ONLY / SKIPPED_ACTIVE_SCOPE**。

最小可研究問題（未授權執行）：

> 在 non-production / isolated Worker，用 benign fixture 比較 current wait-vs-timeout 與 `rejectIfBusy`；確認 3040 可以 fail fast 且只進既有 infrastructure recovery，而 3036 account/quota limit 不被誤當 capacity。若無法取得真實 3040，就保持 NEEDS_RUNTIME_VERIFICATION，不用 synthetic fixture 假稱延遲改善。

BUILD/NARROW/REJECT：
- BUILD：真實 3040 可重現，fail-fast 明顯縮短等待，且 3036/內容過濾/產品端 rate limit 不被放寬；
- NARROW：只對單一 Workers AI generation/edit path 有效，就只放那一條；
- REJECT：沒有可觀察 capacity wait、error semantics 無法可靠區分，或 active PR 已用更小方式解決。

---

## C. Direct competitor packaging — Adobe / Firefly recent controls

**CONFIRMED — Adobe community update published 2026-09-18; checked 2026-09-22.**

Source:
- https://community.adobe.com/t5/adobe-firefly-discussions/what-s-new-in-adobe-firefly-september-2026/td-p/15518212

Adobe 本月把 GPT Image 2 在 Firefly 的 aspect-ratio 選項擴到 10 種，並延長部分 generation/video prompt input；這是「更多控制面」的 packaging signal。

對本 repo 的反證更強：current product 已有用途型尺寸 preset，而且 changelog 已因 casual-user ROI 低移除 custom-size UI。沒有實際使用者 evidence 證明多兩個 ratio 或重新開放任意尺寸會改善核心工作，因此本輪標 **DO NOT COPY / NO ISSUE**。

---

# New Releases

- **2026-09-18 — Stability AI Image Services on Amazon Bedrock**：把專業 image edit 拆成 managed bounded operations；對 #23 是 supporting evidence，不是 provider-expansion mandate。
- **2026-09-17 — Cloudflare Workers AI `rejectIfBusy`**：提供 capacity queue fail-fast；對現有 timeout/fallback path 有直接可研究性，但尚缺 runtime 3040 evidence，且 provider-retry active scope 已被 PR #21 佔用。
- **2026-09-18 — Adobe Firefly September update**：更多 aspect ratios / longer prompt surface；因 owner 簡化方向與缺 user pain 而拒絕立案。

已知但**非本輪新訊號**：OpenAI Images 2.5（2026-09-08）→ #23；Cloudflare Images text rasterization（2026-09-02）→ #26；Adobe Content Credentials 近期文件更新 → #18。沒有重複開單。

---

# Community Pain

本輪沒有找到足以改變優先級、又能可靠對映到 `flux-image-gen` 的近期社群抱怨，因此**沒有把 Reddit / community anecdote 當普遍發生率或 severity 證據**。

User pain 仍以 repo 已可觀察的 handoff / defect 為主：#7–#11、#23、#26。外部新品只用於提出／校準假設。

---

# Adjacent Ideas

1. **Provider failure taxonomy 應至少保留「capacity」與「account/quota」差異**：兩者同為 429，但 recovery decision 不相同。這是一個可移植設計原則；本輪只有 flux current source + Cloudflare 一手文件，尚不足以建立 portfolio-wide framework。
2. **Bounded edit verbs over mode explosion**：若未來證明「移除背景／擦除指定物件」是高頻工作，先重用現有 edit + spatial target，避免建立完整 editor。
3. **Fail-fast 只在有既有安全 fallback 時有價值**：不能為了 latency 把 content filter、quota policy 或 moderation 變成跨 provider 繞過。

---

# Opportunity Map — `flux-image-gen`

| Class | Decision |
|---|---|
| MUST MATCH | 先完成既有 #11 safety/release gate、#7–#10 reliability 與 runtime truth；active PR 未合併不得當 default branch 已修好。 |
| SHOULD BE BETTER | 對真正 provider capacity failure，若實測成立，應比「等到本地 timeout」更快進既有 recovery；但必須先保留 3040 vs 3036 語義。 |
| DIFFERENTIATOR | 中文／local-first 創作、truthful provider/model/cost/provenance、精準且可追溯的 edit，而不是更多 provider 或更多 mode。 |
| ADJACENT IDEA | Stability 式 bounded edit operation 可作 UX vocabulary；只有有 user evidence 才增加極薄入口。 |
| DO NOT COPY | Bedrock/provider expansion、13-tool catalog、Photoshop/Canva layer editor、account/project collaboration、恢復任意 custom-size UI、因模型／比例數量競爭。 |

---

# Four-gate decisions

## Candidate 1 — Workers AI capacity fail-fast

### 1. Problem / value
- Target user：在 public Worker 生圖／改圖，遇 provider capacity queue 的人。
- Repo evidence：已有 Workers AI local timeout、fallback chain、NVIDIA circuit breaker；可證明產品重視 slow-failure recovery。
- External evidence：Cloudflare 2026-09-17 新增 fail-fast，且 3040/3036 同為 429 但根因不同。
- Missing evidence：沒有本產品 3040 runtime receipt、等待分布或 abandonment evidence。
- Gate：**research hypothesis only**。

### 2. Priority
- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`

不因 Cloudflare 新功能或「可能更快」升 P2/P1。

### 3. Minimum solution
依序比較：
1. 不改：保留 current local timeout/fallback；
2. isolated evidence：取得/辨識 3040 vs 3036；
3. 只有 runtime 證明 capacity wait 是實際問題，才評估在現有 `env.AI.run()` 加 fail-fast option 並重用 existing recovery；
4. 不建新 queue/provider router/circuit framework。

### 4. Research vs implementation
Research 若得到 BUILD 只代表可以另行決策；不授權 code/CI/config/deploy。PR #21 尚 open 時也不得搶改其 retry/fallback scope。

## Candidate 2 — Stability bounded edit catalog

- `kind=OPPORTUNITY`
- `severity=NOT_ESTABLISHED`
- `decision_priority=LOW_MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- Decision：**DEDUPED → #23 supporting evidence / NO WRITE**。

沒有 user evidence 支持新增 Bedrock 或一口氣建立更多 edit mode。

## Candidate 3 — Adobe more ratios / longer prompts

- Decision：**REJECT**。
- Reason：repo 已主動簡化 custom-size UI；目前沒有相反證據推翻 owner direction。

---

# Rejected / Deferred Ideas

1. **立即新增 AWS Bedrock / Stability provider** — REJECT：provider availability 不是 user-value evidence；增加 credentials/cost/maintenance 面積。
2. **一次做滿 Inpaint / Erase / Remove Background / Recolor / Control 全套** — REJECT：#23 尚未證明 spatial targeting 的本產品 pain/frequency。
3. **為 `rejectIfBusy` 直接改 production** — DEFER：缺真實 3040 evidence，且 PR #21 正在碰 provider/retry scope。
4. **把所有 429 視為同一類 rate limit** — REJECT AS DESIGN PRINCIPLE：Cloudflare 已明確區分 3036 account limit 與 3040 capacity；但本輪只記 evidence，不直接改 code。
5. **重新開放任意 custom size / 更多 aspect-ratio UI** — REJECT：與已記錄的 simplification 方向相反，沒有新 user evidence。
6. **另造 provider/error registry framework** — REJECT：當前只需要先回答一個窄 runtime 問題。

---

# Issue Mapping / coordination

| Signal | Mapping | Action |
|---|---|---|
| Stability bounded edit operations | #23 spatial target research | Supporting evidence only；不留言、不升級、不擴 provider scope |
| Workers AI rejectIfBusy / 3040 | provider timeout/fallback + open PR #21 | REPORT_ONLY / SKIPPED_ACTIVE_SCOPE；不建新 Issue |
| Cloudflare Images text rasterization | #26 exact-text finishing | Already tracked；no duplicate |
| Content Credentials | #18 provenance | Already tracked；no duplicate |
| Adobe ratio expansion | none | Rejected; no issue |

本輪沒有取得或修改任何 Issue lock，因為**沒有 Issue/comment write**。沒有把 active PR 的 branch work 當 default-branch evidence，也沒有把 report-only calibration 算成修復。

---

# Sources

Checked 2026-09-22 unless noted:

1. Stability AI — Image Services on Amazon Bedrock, announced 2026-09-18  
   https://stability.ai/news-updates/stability-ai-brings-image-services-to-amazon-bedrock-delivering-professional-creative-control-with-enterprise-grade-infrastructure
2. Amazon Bedrock — Stability AI Image Services current docs  
   https://docs.aws.amazon.com/bedrock/latest/userguide/stable-image-services.html
3. Cloudflare Workers AI — reject busy requests, released/updated 2026-09-17  
   https://developers.cloudflare.com/changelog/post/2026-09-17-reject-if-busy/  
   https://developers.cloudflare.com/workers-ai/features/reject-if-busy/
4. Cloudflare Workers AI errors — 3036 account limited vs 3040 out of capacity  
   https://developers.cloudflare.com/workers-ai/platform/errors/
5. Adobe Firefly September 2026 community update, published 2026-09-18  
   https://community.adobe.com/t5/adobe-firefly-discussions/what-s-new-in-adobe-firefly-september-2026/td-p/15518212
6. Existing-reference only, not counted as new this round: OpenAI Images 2.5 (2026-09-08)  
   https://openai.com/index/introducing-chatgpt-images-2-5/
7. Existing-reference only: Cloudflare Images text rasterization (2026-09-02)  
   https://developers.cloudflare.com/changelog/post/2026-09-02-images-binding-updates/

Confidence:
- Cloudflare / Stability technical claims：HIGH，first-party documentation。
- Adobe September packaging：MEDIUM-HIGH，Adobe Community Manager source；not independent effectiveness evidence。
- Any claim about real `flux-image-gen` frequency/latency improvement：UNKNOWN until runtime evidence exists。

---

# What Changed

相較上一個 `flux-image-gen` radar：

1. **新增 external enabling capability**：Cloudflare 2026-09-17 `rejectIfBusy`，可在 capacity unavailable 時 fail fast；但尚不足以立案或實作。
2. **新增 direct-market confirmation**：Stability AI 2026-09-18 把 granular edit operations 正式帶進 Amazon Bedrock，支持 bounded/targeted editing 已成為 API-first workflow，但不推翻「不追 provider 數量」方向。
3. 沒有新真人痛點、production 3040 receipt、或證據推翻現有 owner simplification direction。
4. 因 active PR #21 與證據門檻，本輪 **0 新 Issue、0 Issue/PR 修改或留言、0 implementation authorization**。

---

# Completion / gaps / cursor

Completed:
- Re-read Issue Quality v2 and recorded rule blob SHA.
- Fresh paginated owner inventory to exhaustion: 42 owned / 41 unarchived.
- Reconciled latest fair cursor from `2026-09-22T080941Z-external-radar.md`; selected `flux-image-gen`.
- Re-read current README/default-branch source, prior radar, Competitive/Research Issues, current all-state PRs and active PR #21.
- Performed fresh public-web research with Stability AI, AWS, Cloudflare and Adobe sources.
- Re-deduped against #18/#22/#23/#26 and active reliability work.
- Wrote this unique central report.

Gaps:
- No real Workers AI 3040 capacity event was executed or observed; `rejectIfBusy` candidate remains `NEEDS_RUNTIME_VERIFICATION`.
- No production deploy/mobile/paid-provider run was performed.
- No community anecdote was used to infer prevalence.
- This radar does **not** declare portfolio CLEAN.

Next fair-rotation cursor：**`Reese-max/google-maps-personal-mcp`**。

Notification decision：**NO NOTIFICATION** — external signals materially refine future research, but do not create a new high-value approved opportunity, do not overturn owner direction, and are either deduped into existing research or blocked by missing runtime evidence / active scope.