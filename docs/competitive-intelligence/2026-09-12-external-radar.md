# External Competitive / Product / Workflow Inspiration Radar — 2026-09-12

## Scope / Method

本輪重新確認 Reese-max 的產品組合，維持 **37 個未封存、可視為產品或產品基礎設施的 repositories**。GitHub 只用於建立產品→市場類別對照、確認近期 repository 狀態、讀取既有 Competitive Gap / Feature / Research Issues、PR 與 `github-issue-lock:v1`；**主要市場情報來源仍是 GitHub 之外的公開網路**。

優先時間窗為最近 30–90 天；本輪最重要的一手變化集中在 2026-08-28～2026-09-10：Midjourney v8.2 Edit、Adobe Firefly unified generation/editing workspace、Canva Magic Layers、Pocket Prep exam-version switching，以及 2026-09-10 的 iterative image-editing research。

Status semantics：
- **CONFIRMED**：官方產品網站、官方文件、release notes、正式研究或可核對的一手資料。
- **LIKELY**：多項可信訊號一致，但目前沒有完整產品契約或 runtime evidence。
- **COMMUNITY_SIGNAL**：Reddit / 社群個案，只代表質性痛點，不代表發生率。
- **UNKNOWN**：目前證據不足，不推定。

本輪沒有修改產品原始碼、建立實作分支、merge、deploy、secrets、權限或 repository settings。

---

# Executive Result

本輪找到 **1 個達到正式立案與通知門檻的新產品機會**：

> **`flux-image-gen` — Creative Edit Session + Reference Tray：把目前每輪暫存在頁面記憶體的 1–4 張 reference images 與 roles 升級為 local-first、explicit opt-in 的可重用創作上下文，讓使用者從歷史作品直接建立 reference、branch、compare、rollback，而不必重複 download → re-upload → 重設角色。**

**Opportunity Score：92/100**

已建立：`Reese-max/flux-image-gen #22`  
`[Competitive Inspiration][Research][RESEARCH_REQUIRED][WORKFLOW] 建立 Creative Edit Session + Reference Tray，讓多輪改圖不再重選／重傳上下文`

Stable fingerprint：

`flux-image-gen + one-shot multipart /edit with 1-4 in-memory reference blobs + output version chain + no persistent opt-in reusable ReferenceAsset/CreativeSession binding across edit turns + user must reselect/re-upload/restate edit context`

建立前已搜尋 open/closed Issues、all-state PR 與 repository `github-issue-lock:v1`；既有 #18 是 provenance / Content Credentials，不是多輪 edit context，未找到相同 fingerprint 或 active lock。

---

# External Signals

## S1 — Midjourney v8.2：Edit 從「一次性操作」變成 session-native workflow

**Status:** CONFIRMED  
**Date:** 2026-09-03  
**Source:** https://updates.midjourney.com/alpha-changelog-9-2-26/

Midjourney 在 Alpha 把 v8.2 Edit Model 直接放進 lightbox。使用者開任一圖片後，可用自然語言修改、附最多 4 張 reference images，並在同一處看到 **all session edits**。

### Job-to-be-Done
創作者不是只想「再生一張」，而是想持續修改同一個創作脈絡，並且保留 reference、parent 與 edit history。

### 為何比現有做法省時間／步驟／更可靠
- 不必在「作品歷史」與「改圖上傳器」之間反覆搬運同一張圖。
- Reference image 與 edit result 留在同一 session 心智模型。
- 多輪 edit 可視化後，使用者比較容易回到較佳 parent，而不是只記得最後一張。

### Onboarding / Distribution
Editor 被放進既有 image lightbox，不要求使用者另外建立 project 或學新工具。

### Ability Pattern
`Artwork → Reference(s) + Instruction → Session Edit → Next Edit`

### Pricing / Business Model Signal
Midjourney 目前 Basic / Standard / Pro / Mega 為 US$10 / 30 / 60 / 120 月費；Edit/Reference workflow 與整體生成服務綁在 subscription/GPU-time 模型內。這只代表 packaging，不證明效果。

### 限制／失敗點
Alpha 本身仍快速變動。近期 community 亦有多輪 edit 後未修改區域品質下降的個案，因此不能把「session continuity」做成 destructive linear overwrite。

### Reese-max 可吸收 / 不照抄
- **吸收：** reference tray、session continuity、branch/compare。
- **不照抄：** 不做完整 Midjourney gallery/editor shell；不把最新 edit 自動視為 canonical best version。

---

## S2 — Adobe Firefly：Project media + generation history + reference reuse 收斂成單一 workspace

**Status:** CONFIRMED  
**Dates:** generation docs updated 2026-08-28；workspace overview updated 2026-09-08  
**Sources:**
- https://helpx.adobe.com/ph_fil/firefly/web/unified-generation-and-editing-experience/generate-and-edit-content.html
- https://helpx.adobe.com/es/firefly/web/unified-generation-and-editing-experience/generation-and-editing-experience-overview.html

Firefly Beta 將 image/video generation、editing、project assets、generation history 放進單一 workspace。Generated content 可存成 Project media，之後直接作為新的 reference；過去 generation 的 prompt、reference、model、aspect ratio、resolution 可重新帶入新 generation。

### Job-to-be-Done
從「有一張不錯的結果」繼續改，而不是每一次都從新的上傳與設定開始。

### Why Better
真正節省的是 handoff：**generated asset 不必先下載到檔案系統，再回到另一個 edit surface 上傳。**

### Onboarding / Distribution
使用既有 Firefly workspace/project，不另外要求第三方 asset manager。

### Ability Pattern
`Generation → Project media → reusable reference → Edit / New generation → History`

### Pricing Signal
Firefly Standard US$9.99/月含 2,000 credits，Pro US$19.99/月含 4,000 credits；生成與持續編輯被包在同一 creative workflow。這是 packaging signal，不是本產品應導入收費的理由。

### Limits
Unified workspace 仍是 Beta，且 Adobe cloud project/account infrastructure 對 `flux-image-gen` 過重。

### Reese-max 可吸收 / 不照抄
- **吸收：** reuse existing generated assets as references；history → next action。
- **不照抄：** 不先做 Adobe cloud project/account backend；local-first 是 Reese-max 可保留的隱私與成本優勢。

---

## S3 — Canva Magic Layers：市場正在消除 generate → download → re-upload 的創作 handoff

**Status:** CONFIRMED  
**Date:** current release checked 2026-09-12  
**Sources:**
- https://www.canva.com/newsroom/news/magic-layers-ai-assistants/
- https://www.canva.com/magic-layers/

Canva 將 Magic Layers 帶入 ChatGPT / Gemini，官方明確把舊流程描述為 generate → download → re-upload；新流程可把 AI-generated flat image 直接轉成可編輯 design。

### Job-to-be-Done
生成只是起點，使用者還要把成果變成能繼續加工、交付的 artifact。

### Transferable Principle
真正的產品價值不是「多一個生成按鈕」，而是**保留下一步可操作性**。

### Pricing / Business Model Signal
Magic Layers 是 premium AI tool，使用量計入月度 AI allowance。這表示「後生成編輯能力」本身可被視為付費價值，但本 repo 不需要照抄 monetization。

### Reese-max 可吸收
- `flux-image-gen`: output → reusable reference / edit context。
- `ppt-studio` / `minideck`: AI output 應盡量進入可繼續修改的 structured artifact，而不是只輸出 flatten result。

### DO NOT COPY
不因 Canva 可把 raster 拆成 layers 就承諾本產品也能做到同級結構化；那是另一個模型/編輯器能力層。

---

## S4 — Iterative image editing 的新失敗模式：context continuity 不能犧牲 parent preservation

**Status:** CONFIRMED RESEARCH  
**Date:** 2026-09-10  
**Source:** https://arxiv.org/abs/2609.11317

Mi-Ripple 研究指出 iterative reference-conditioned editing 可能累積 grid-like / granular artifacts，並研究 cleaned-reference regeneration。這不等於所有多輪 edit 都會退化，但足以形成產品設計訊號：**不要把最後一次輸出當唯一真相，也不要刪掉乾淨 parent/reference。**

### Transferable Pattern
`Original/clean parent → Candidate edit → compare → promote/branch`，而不是 `latest output overwrites previous context`。

### New Product Possibility
在 `flux-image-gen` 現有 version chain 上，加入 candidate/branch/rollback 比另建「自動修復模型」更符合目前產品能力。

---

## S5 — Midjourney community：新 Edit 很有用，但多輪品質與 reference 行為仍需要可退回

**Status:** COMMUNITY_SIGNAL  
**Dates:** 2026-08-30～2026-09-03  
**Sources:**
- https://www.reddit.com/r/midjourney/comments/1w2adon/midjourneys_new_editing_interface_reduces_overall/
- https://www.reddit.com/r/midjourney/comments/1w5wcw3/useful_tip_for_new_midjourney_edit/

社群一方面回報 v8.2 reference/edit 對構圖、pose 很有用；另一方面也有使用者描述多次局部 edit 後未修改區域品質下降。

這些都是 anecdotal evidence，不代表失敗率。保留的產品訊號只有：
1. reference image workflow 的確能降低「文字很難描述」的控制成本；
2. 多輪 edit 必須能回 parent、branch 或保留原 reference，不能只向前覆寫。

---

## S6 — Pocket Prep：Certification prep 已把「考試版本切換」做成正式產品生命週期

**Status:** CONFIRMED  
**Date:** 2026-06-08  
**Source:** https://help.pocketprep.com/en/articles/10536957-how-do-i-switch-exam-versions

Pocket Prep 在 credential body 更新 exam outline 後，會通知使用者；舊版在正式退場後一段時間仍可使用，使用者可切換 old/new version 且不丟失進度，直到 discontinuation date。

### Job-to-be-Done
考生需要知道「我現在準備的是哪一版考試」，而不是只知道題庫最後一次內容 SHA。

### Transferable Principle
`Content dataset version` 與 `Official exam blueprint version` 是不同物件。

### 對 cyber-prep-coach 的機會
目前 repo 已有強 `datasetVersion` integrity，但任何 datasetVersion mismatch 會讓舊 practice 無法 resume；可研究更細的 `ExamBlueprintVersion + CompatibilityMap + MigrationReceipt`，避免將小型內容修正與正式考綱切版視為同一種事件。

### 本輪為何不立案
既有 #4 已要求 datasetVersion 改變時 mastery 必須 migrate/rebuild/invalidate；此方向與 #3/#4/#6 形成較大的 version-lifecycle 設計，應先做 research matrix，不急著開第四個相鄰 Feature Issue。

**Score:** 89/100 — Research List。

---

## S7 — SEKEL：exam-aware spaced repetition 把官方 blueprint 直接變成 next-action input

**Status:** CONFIRMED PRODUCT CLAIM / EFFECTIVENESS UNKNOWN  
**Date:** current pre-alpha checked 2026-09-12  
**Source:** https://www.sekel.io/

SEKEL 將 official blueprint weights、個人 performance、coverage gaps 與 spaced repetition 合併，直接顯示某 domain 的 blueprint 比例與 learner coverage。官方網站稱 governing body 更新時產品也會更新；目前 Beta 免費。

### Signal
這進一步支持 `cyber-prep-coach #4` 的 mastery/coverage 方向，但**不是新 Issue**：#4 已經要求「弱項、到期複習、coverage gap、unseen」混合並提供可解釋 reason code。

### DO NOT COPY
- 不把 blueprint weight 直接變成「通過率預測」。
- 不增加黑箱 AI tutor。
- 不用產品網站宣稱的學習效果當實證。

---

# New Releases / Market Moves

| Date | Product / Release | Signal | Confidence |
|---|---|---|---|
| 2026-09-10 | Mi-Ripple research | 多輪 reference-conditioned edit 可能累積 artifact；保留 clean parent / branch 有產品價值 | CONFIRMED RESEARCH |
| 2026-09-08 | Adobe Firefly unified workspace | Generation / edit / project assets / history / reference reuse 收斂 | CONFIRMED |
| 2026-09-03 | Midjourney Alpha v8.2 Edit | Lightbox editor + 4 refs + all session edits | CONFIRMED |
| 2026-09 current | Canva Magic Layers in AI assistants | 直接縮短 generate → download → re-upload → edit | CONFIRMED |
| 2026-06-08 | Pocket Prep exam versions | old/new exam coexistence、明確 transition/discontinuation、progress preservation | CONFIRMED |
| 2026 current | SEKEL | official blueprint + learner state + next-best study action | CONFIRMED PRODUCT CLAIM / outcome UNKNOWN |

---

# Community Pain Points

1. **Iterative edit degradation** — Midjourney 使用者個案指出反覆局部 edit 後，未修改區域也可能退化。**COMMUNITY_SIGNAL**，不外推發生率。
2. **Reference setup friction** — 社群實作顯示 reference image 對姿勢/構圖很有價值，也說明純文字 prompt 並不是所有視覺控制的最佳 interface。**COMMUNITY_SIGNAL**。
3. **版本切換焦慮** — Certification prep 市場以正式 exam-version selector 與 discontinuation date 解決，不應讓使用者自己猜題庫 SHA 是否等於新考綱。Pocket Prep 為 **CONFIRMED product pattern**，不是社群統計。

---

# Adjacent Ideas

## A1 — ReferenceAsset 作為跨媒體共用 primitive
可移植到：`flux-image-gen`、`ppt-studio`、`video-timeline-pipeline`、`minideck`、`UkePack`。

核心不是「素材庫」，而是：
`Asset bytes/hash → role → source revision → availability → privacy scope → consuming candidate`。

## A2 — Candidate-first editing
可移植到：圖片、簡報、影片、小說、筆記、clinical note。

任何 AI 修改先成 Candidate，再由人或 policy Promote；不要 silent overwrite canonical artifact。

## A3 — Dataset Version 與 Domain Policy/Blueprint Version 分離
可移植到：`cyber-prep-coach`、`exam-archive`、`police-exam-practice`、`police-exam-archive`、`voice-actress`。

例如：一題解析 typo 修正 ≠ 官方考綱換版。兩者需不同 migration semantics。

## A4 — Flat output → editable handoff
Canva Magic Layers 顯示 downstream editability 正變成 distribution advantage。對 `ppt-studio/minideck` 最值得研究，但目前不需要增加一個新「AI design model」Issue。

---

# Opportunity Scores

| Candidate | User Pain | Strategic Fit | Novelty | Evidence | Reuse | Effort controllability | Risk controllability | Overall | Action |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| flux-image-gen Creative Edit Session + Reference Tray | 9 | 10 | 8 | 10 | 9 | 7 | 8 | **92** | **CREATE #22** |
| cyber-prep ExamBlueprintVersion + Progress Migration Receipt | 8 | 10 | 8 | 9 | 9 | 7 | 9 | **89** | Research list; coordinate #3/#4/#6 |
| Cross-media ReferenceAsset contract | 8 | 9 | 8 | 8 | 10 | 6 | 8 | **87** | Adjacent research |
| Flat raster → editable structured artifact handoff | 7 | 8 | 9 | 8 | 8 | 4 | 7 | **82** | Research only; high implementation scope |
| Automatic iterative-edit quality repair | 6 | 6 | 9 | 7 | 6 | 3 | 6 | **70** | Reject for now; branch/compare first |

---

# Opportunity Map — 37 Products

| Repository | Market | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| exam-archive | 考試資料庫 | 年度/考次/來源可追溯 | 新舊考綱版本標示 | 台灣考試 evidence-first 索引 | ExamBlueprintVersion registry | 泛用 AI 聊天首頁 |
| police-exam-practice | 警察特考練習 | 穩定作答/續作/錯題 | 官方規格 pacing + explainable review | 警察考科專屬 provenance | Blueprint migration receipt | 黑箱通過率預測 |
| police-exam-archive | 警察考古題 | 原題/年度/來源 | 新舊法規/考綱狀態 | 法規與題目版本鏈 | Version compatibility map | 無來源 AI 改題 |
| 92-duty-scheduler | 排班/勤務 | canonical schedule + eligibility | Duty Inbox / self-service exceptions | policy + receipt 驅動調班 | mobile/LINE thin adapter | 把群組訊息當真相 |
| UkePack | 音樂創作工具 | 可編輯成果/匯出 | candidate/revision workflow | lightweight creator handoff | reusable reference assets | 重型 DAW 全套複製 |
| ppt-studio | AI 簡報 | editable deck + reliable export | fail-closed remote auth/CI | candidate → structured deck | flat visual → editable handoff | 未修 auth 前擴 remote agent |
| voice-actress | 申論/口說學習 | rubric/evidence 對齊 | revision-aware scoring | 台灣警察/法律專項 | exam blueprint versions | 泛 LMS / 泛 TTS SaaS |
| taiwan-intel-dashboard | 台灣情報儀表板 | freshness/source health | evidence-native agent access | Taiwan-specific source graph | WebMCP/read-only tools | 用摘要取代原證據 |
| autodev-ng | AI 軟體工廠 | locks/review/cost/evidence | principal/environment/effect truth | auditable autonomous loop | reference/candidate artifact contract | 追求 agent 數量而忽略 WIP/review |
| flux-image-gen | AI 圖片生成/編輯 | 安全/限流/可下載/可重播 | **Creative Edit Session + Reference Tray** | local-first + provenance + branchable edits | editable structured handoff | cloud account/project clone；destructive latest-only edit |
| claude-mem | Agent memory | scope/來源/刪除 | activation/staleness truth | local developer memory | versioned memory receipt | 全量永久記憶 |
| lobsterpulse | Agent monitoring | provider/session freshness | decision-only attention queue | bounded pre-investigation | creative/job session health | event 全塞通知 |
| prompt-autoresearch | Prompt optimization | holdout/cost/replay | variance-aware promotion | reproducible optimization evidence | candidate branch graph | 單次幸運高分就 promote |
| neciken-summer-poem | 創作內容 | editable source + attribution | 最小生成/人工修訂界線 | 小而清楚的作品 artifact | revision receipt | 過度 agent 化 |
| note-filler | 法律/行政筆記 | 原稿不可變/來源可查 | claim review ledger | source-backed overlay | blueprint/law-version staleness | 無來源補文、silent overwrite |
| lplrs-judicial-sync | 司法資料同步 | source/date/hash | cross-source identity/conflict | evidence distribution contract | citation graph | 把抓取成功當內容正確 |
| adng-memory | Agent memory infra | provenance/deletion | activation/staleness contract | runtime memory truth | session/reference leases | 無期限 hidden memory |
| cyber-prep-coach | iPAS 備考 | 官方題庫/規格/來源 | #3 official-mode、#4 mastery、#6 SME calibration | local-first iPAS provenance | **ExamBlueprintVersion + migration receipt** | 再加泛 AI tutor |
| cf-ai-router | AI routing | provider health/fallback | lifecycle + task capability profile | deterministic truth-based routing | session cost profile | 永久硬編模型排行榜 |
| avatar-vfo | Avatar/visual product | deterministic asset state | reference consistency | lightweight visual workflow | reusable character reference | 泛社群平台 |
| project-doctor-web | 臨床教育模擬 | safety/provenance/cost | CaseSpec + evidence debrief | constrained clinical teaching | candidate/branch scenario revisions | open-ended AI doctor expansion |
| minideck | 輕簡報 | editable output | structured handoff/export | fast lightweight deck editing | Canva-like editability principle | 完整 Canva clone |
| chatgpt-dual-pipeline | 雙代理工作流 | exact handoff/state | provenance between stages | independent pipeline receipts | ReferenceAsset/Artifact handoff | 模糊「另一模型已驗證」 |
| internship-notes-sites-mirror | 實習內容站 | source/date/content integrity | reusable structured diagrams | police-tech knowledge archive | editable content bundle | 加泛聊天功能 |
| taichung-police-intel | 政務/警政情報 | source/freshness/publication receipt | Evidence MCP/WebMCP | decision-ready public intelligence | attention queue | 把即時性冒充可信度 |
| soundbox-offline | offline 音訊 | offline-first/import/export | OS share/import | local private media workflow | reference tray concept for audio | 強迫帳號/雲同步 |
| skill-foundry | Agent Skill 研發 | eval/certification | distribution/install receipt | research→certified→installed truth | demo trace → candidate skill | format-valid=runtime-valid |
| video-timeline-pipeline | AI 影片 | timeline/editable stages | reusable assets + candidate edits | receipt-driven media pipeline | CreativeSession/reference assets | flatten-only output |
| ai-novel-workstation | AI 小說 | canonical manuscript/revisions | section-scoped candidate edits | writer-controlled provenance | reference/character asset tray | 自動覆寫正文 |
| clinical-scribe-worker | 臨床筆記 | auth/evidence | section-scoped repair + revision receipt | minimal blast-radius note editing | candidate branch/compare | 全文重生覆蓋人工修訂 |
| MaterialYouNewTab | new-tab/workspace | local-first/min permission | Session Capsule | workspace context restore | ReferenceAsset-like saved context | full tab-manager permission sprawl |
| cf-mcp-server | MCP/Cloudflare | auth/tool truth | capability/effect enforcement | serverless MCP boundary | WebMCP projection | annotation 當 authorization |
| tick-stock-panel | 市場/投資面板 | freshness/partial truth | source coverage/entitlement | transparent data status | versioned portfolio/data snapshot | 泛金融 Agent autonomous action |
| herdr-skills | multi-agent skills | correction/eval | candidate skill lifecycle | cross-engine learning | install receipt | self-feedback 直接 active |
| ninax-line-hermes | LINE/agent integration | verified identity | effect boundary/receipts | channel as thin adapter | session action candidate | LINE message=canonical state |
| ai-flight-radar | flight monitoring | quote/source health/reconfirm | complete fare + post-booking research | Taiwan-departure evidence radar | policy-aware reprice watch | auto-buy/rebook without fare-rule evidence |
| academic-mcp | academic research | canonical paper identity | research bundle ledger | multi-source provenance | citation graph | rate-limit/partial 當 zero results |

---

# Top 10 Cross-Portfolio Ideas

1. **CreativeSession / ReferenceAsset** — 將 reference bytes、role、privacy、availability、content hash 與 consuming candidate 分開；先在 `flux-image-gen #22` 驗證。
2. **Candidate-first mutation** — 圖片、簡報、影片、小說、clinical note 都應先產生 candidate，再 Promote；不要 silent overwrite canonical artifact。
3. **Branch / Compare / Rollback as core UX** — AI 編輯是 stochastic，latest 不等於 best；保留 parent 是產品可靠性能力。
4. **DatasetVersion ≠ Domain/BlueprintVersion** — 小內容修正、來源變更、正式制度/考綱換版需不同 migration semantics。
5. **Migration Receipt** — 任何進度/狀態跨版本時，明確列 carry / reset / stale / unknown，而不是只顯示「版本不同」。
6. **Editable downstream handoff** — 生成完成不是終點；優先讓輸出能直接進下一步可編輯 surface，減少 download/upload。
7. **Local-first private asset store** — 對圖片/音訊/瀏覽器 context，先用 explicit opt-in + local availability state，不急著做 cloud account。
8. **Cost-aware continuity** — session/reference restore 本身不應背景呼叫模型；真正生成才消耗 quota，且仍走原 cost gates。
9. **Truthful reproducibility status** — `REFERENCE_MISSING / PAGE_STATE_UNKNOWN / DATASET_STALE / CREDENTIAL_UNAVAILABLE` 比假裝「已恢復」更重要。
10. **Separate provenance from usability lineage** — #18 類 Content Credentials 回答媒體來源可信度；#22 類 session lineage 回答工作流如何延續，不能混成一個欄位。

---

# Ideas Rejected / Deferred

## R1 — 把 flux-image-gen 直接改成 Adobe-style cloud project/media SaaS
**Reject now.** 需要帳號、雲端檔案權限、儲存成本與更大 privacy surface；本產品目前 local-first + R2 share 已足以先驗證 session JTBD。

## R2 — 自動保留所有上傳 reference 圖
**Reject.** Reference 圖可能含私人照片/素材。應 explicit pin、可刪除、local-first；share/R2 預設只放 allowlisted metadata/hash。

## R3 — 每次 edit 自動接著上一張繼續
**Reject.** Iterative degradation research + community signal 都顯示 latest-only chain 有風險；必須允許 branch/parent selection。

## R4 — 因 Canva Magic Layers 而做 raster→layers 大模型
**Defer.** 高模型/編輯器複雜度，與本輪最直接人工斷點無關；先解決 reference/session continuity。

## R5 — cyber-prep 新增另一個 AI tutor
**Reject.** 既有 #3/#4/#6 已明確指出正式規格、mastery 與 explanation calibration 才是高價值缺口。

## R6 — datasetVersion mismatch 全部自動 migration
**Reject.** 有些題目/考綱真的不相容；正確模式是 CompatibilityMap + preview + receipt，而不是 silent rebase。

---

# Issue Mapping

| Product | Issue | Action this round | Reason |
|---|---|---|---|
| flux-image-gen | **#22 Creative Edit Session + Reference Tray** | **CREATED** | 92/100；fresh direct competitors + repo gap + nonduplicate |
| flux-image-gen | #18 Provenance Receipt / Content Credentials | KEEP SEPARATE | provenance trust ≠ multi-round edit context；可共享 hashes/lineage |
| cyber-prep-coach | #3 Official-spec simulation | NO CHANGE | exam fidelity 已有正式追蹤 |
| cyber-prep-coach | #4 local mastery / adaptive today-task | NO CHANGE | SEKEL signal 強化但 fingerprint 已覆蓋 |
| cyber-prep-coach | #6 independent SME calibration | NO CHANGE | 仍是 public release 前高優先可靠性工作 |
| MaterialYouNewTab | Session Capsule from prior radar | CENTRAL REPORT ONLY | repository Issues disabled；本輪沒有改 settings |

---

# Runtime / Coordination Constraints

- `flux-image-gen #22` 是 **Research-first**；不建立 implementation branch、不 deploy。
- Reference/session 功能不得繞過現有 moderation、Turnstile、rate limit、provider/cost controls。
- Private reference bytes 不得因「保存 session」而自動進 R2、public share、usage log 或 prompt telemetry。
- 目前 `flux-image-gen` 最近仍有 production safety/audit 工作；產品安全 gate 優先於新 workflow rollout。
- 若後續另一排程認領 #22 並寫入 `github-issue-lock:v1`，外部雷達只補充中央報告，不搶鎖。

---

# Sources

## Direct competitors / official product docs
1. Midjourney Alpha Changelog — 2026-09-03  
   https://updates.midjourney.com/alpha-changelog-9-2-26/
2. Midjourney Plans — checked 2026-09-12  
   https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans
3. Midjourney Omni/Edit reference docs — checked 2026-09-12  
   https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference
4. Adobe Firefly Generate/Edit — updated 2026-08-28  
   https://helpx.adobe.com/ph_fil/firefly/web/unified-generation-and-editing-experience/generate-and-edit-content.html
5. Adobe Firefly unified workspace overview — updated 2026-09-08  
   https://helpx.adobe.com/es/firefly/web/unified-generation-and-editing-experience/generation-and-editing-experience-overview.html
6. Adobe Firefly pricing — checked 2026-09-12  
   https://www.adobe.com/products/firefly.html

## Adjacent product/workflow
7. Canva Magic Layers in AI assistants — checked 2026-09-12  
   https://www.canva.com/newsroom/news/magic-layers-ai-assistants/
8. Canva Magic Layers product — checked 2026-09-12  
   https://www.canva.com/magic-layers/
9. Pocket Prep exam-version switching — 2026-06-08  
   https://help.pocketprep.com/en/articles/10536957-how-do-i-switch-exam-versions
10. Pocket Prep educator exam-version docs — 2026-01-21  
    https://help.educators.pocketprep.com/en/articles/10536988-exam-versions
11. SEKEL exam-aware spaced repetition — checked 2026-09-12  
    https://www.sekel.io/

## Emerging research / community
12. Mi-Ripple: Restoring Images Degraded by Iterative AI Editing — 2026-09-10  
    https://arxiv.org/abs/2609.11317
13. Midjourney multi-edit quality degradation report — COMMUNITY_SIGNAL, 2026-08-30  
    https://www.reddit.com/r/midjourney/comments/1w2adon/midjourneys_new_editing_interface_reduces_overall/
14. Midjourney edit/reference workflow tip — COMMUNITY_SIGNAL, 2026-09-03  
    https://www.reddit.com/r/midjourney/comments/1w5wcw3/useful_tip_for_new_midjourney_edit/

---

# What Changed Since Last Radar

Compared with `2026-09-11-external-radar-r8.md`：

1. **新高價值機會：** `flux-image-gen` 從「有 history + one-shot edit」進一步識別出「reference/session continuity」斷點；建立 #22，Score 92。
2. **直接競品策略變化更明確：** Midjourney v8.2 與 Firefly 同時把 edit history、references、project/session continuity 拉到核心 creative surface。
3. **新增反向可靠性訊號：** 2026-09-10 research + 近期 community case 都提醒 multi-round edit 不能設計成 destructive latest-only chain。
4. **新增 cross-portfolio primitive：** `ReferenceAsset / CreativeSession / CandidateEdit / Branch / Receipt`，可移植到圖片、影片、簡報與其他創作工具。
5. **Certification prep 研究更新：** Pocket Prep 的 explicit exam-version transition 強化「DatasetVersion ≠ ExamBlueprintVersion」；目前先留 research list，避免與 cyber-prep #3/#4/#6 重複立案。
6. **沒有新增低價值功能配額：** SEKEL、Canva 等訊號若已被既有 Issues 覆蓋，只作證據補強，不另外灌水開 Issue。

---

# Portfolio Principle Added This Round

**`Generated Output ≠ Reference Asset ≠ Edit Session ≠ Candidate Revision ≠ Canonical Artwork`**

外部市場正從「再生成一次」轉向「保持創作上下文並可繼續修改」。對 Reese-max 而言，最值得吸收的不是再接一個模型，而是讓已有的 output 可以安全、可追溯、可回退地成為下一步 input；同時對 private bytes、成本、provider capability 與版本 drift 保持誠實。