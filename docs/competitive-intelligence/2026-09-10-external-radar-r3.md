# External Competitive Intelligence Radar — 2026-09-10 r3

## Executive Summary

本輪重新盤點 Reese-max 目前可存取、owned、未封存且可視為產品的 **35 個 repositories**。相較同日 r2，本輪 repository 端最大的新增變化不是新功能，而是 `cyber-prep-coach` 新增 product-board audit，正式把「AI 解析由同一模型生成＋同一模型二次驗證、尚未有獨立 SME gold-set calibration」列為 public-release reliability blocker，並已有 #6 追蹤；因此本輪沒有再替考試產品灌入通用 AI Tutor 功能。

本輪主要情報來源刻意放在 GitHub 之外的公開網路，優先掃描 2026-09-09～09-10 新變化與最近 30–90 天資料。最強的新跨產品訊號來自 **模型生命週期本身已成為產品可靠性問題**：GitHub Copilot 的 `MAI-Code-1-Flash` 在 **2026-09-10** 進入退役日，而且 9/1 已一次退役多個模型、10/2 還有下一波；Groq 則把 announcement → transition → optional automatic upgrade → EOL 明文化，並在 8/16 對 free/developer tier 關閉兩個常用 Llama 型號。這不是單純「provider outage」，而是可提前知道的 planned failure。

`cf-ai-router` 本身已用穩定 alias 隔離實際 model ID，README 也明確承認免費模型常改名或下架；但目前主要靠 health/fallback 在失敗發生後處理，沒有版本化 deprecation/shutdown/replacement contract。相鄰產品 magicdoor 在 9/8 已示範 saved workflow 在模型退休時自動轉到 supported replacement；Portkey 則把 canary testing 當 gateway 一級能力。可移植的方向不是 silent auto-swap，而是 **Sunset-aware migration gate**。

本輪正式建立：

**`cf-ai-router #4` — `[Competitive Inspiration][RESEARCH_REQUIRED][RELIABILITY] 建立 Model Lifecycle Registry + Sunset Canary，避免上游模型退役後才靠 fallback 發現`**

Opportunity Score: **93/100**

核心生命週期：

`Vendor Notice → CandidateLifecycleEntry → Source/Date Validation → Replacement Candidate → Cost/Capability Gate → Shadow/Canary Fixtures → Human/Policy Promotion → Active Chain Revision → MigrationReceipt`

Issue: https://github.com/Reese-max/cf-ai-router/issues/4

這不是要求 router 自動追最新模型，而是把「已知將退役」從被動 runtime error 提升成可預覽、可驗證、可回滾的 maintenance workflow。

---

# Portfolio Discovery / What Changed Since Last Radar

- Scope 維持 **35 個 Reese-max owned + unarchived product-like repositories**；`openab`、`gemini-deidentifier`、`obsidian-vault` 等 archived repositories 不納入本輪產品 Opportunity Map。
- r2 的新機會 `video-timeline-pipeline #11`（Evidence-backed Paper Cut / NLE Handoff）已存在，本輪不重複。
- r2 後最明顯的新 repo commit 是 `cyber-prep-coach` 的 2026-09-10 product-board audit；它新建 #6，要求 AI explanations 在 public release 前用獨立 expert gold set 校準。這使「再加通用 tutor/chat」的優先度下降。
- `cf-ai-router` current README 已具備 7 provider、stable aliases、manual auditable chains、provider/key cooldown、tool/vision capability gate、cost fail-closed、實際 404→timeout→第三家 fallback，以及 `/internal/provider-health` / `/internal/chains`。
- `cf-ai-router` README 同時明確寫出「免費模型時常改名或下架，綁死實際模型 ID 的使用端遲早會斷」；但 repository search 未找到 `deprecation / deprecated / shutdown / replacement / sunset` 的 lifecycle contract。
- 已搜尋 `cf-ai-router` open/closed Issues 與 all-state PR 的 `model deprecation / migration / retirement / sunset / lifecycle`。#1 是 task-specific provider reliability；#2/#3 PR 是 Responses API contract；皆非本輪 fingerprint，因此建立 #4。
- 本輪沒有修改任何產品 source code、implementation branch、merge、deployment、secrets、permissions 或 repository settings。

---

# External Signals

## A. Direct Competitor Recent Capability

### CONFIRMED — OpenRouter In-Region Routing — 2026-09-09

OpenRouter 在 2026-09-09 上線 US In-Region Routing，與既有 EU routing 並列。`us.openrouter.ai` / `eu.openrouter.ai` 會限制 request 只路由到指定區域的 provider endpoints，主打 end-to-end data residency。

Source:
- https://openrouter.ai/blog/announcements/us-in-region-routing/

**JTBD**：企業使用多 provider gateway 時，希望保留模型選擇與 routing，又能滿足資料駐留／採購政策。

**省步驟 / reliability**：將「每家 provider individually 驗 region」收斂成 gateway-level base URL / routing constraint。

**Onboarding / distribution**：不要求換 SDK，主要換 region-specific base URL，降低導入摩擦。

**Automation / integration pattern**：routing policy 不只看 latency/cost，也開始把 compliance constraint 當第一級 hard filter。

**Business model signal**：OpenRouter 持續往 enterprise control-plane 擴張，證明 gateway 的價值不只「多模型入口」，而是 central policy enforcement。

**限制 / 不應照抄**：`cf-ai-router` 是 owner-controlled、free/subscription-quota-first 的小型自用 gateway，目前沒有跨國 enterprise residency JTBD；直接複製 region routing 會增加 scope，沒有現有需求 evidence。

**適合吸收**：hard constraint 必須早於 performance preference；這與本 repo 現有 cost fail-closed 邏輯一致，也支持 lifecycle state 未來應是 deterministic eligibility input，而不是 prompt-based heuristic。

### CONFIRMED — OpenRouter two-layer failover — 2026-07，2026-09-10 再核對

OpenRouter 把 provider-level failover 與 model fallback 分開：同一 model 的 provider failure 先切 provider，整體 model 失敗再按 `models[]` 切下一 model。

Sources:
- https://openrouter.ai/blog/insights/model-routing/
- https://openrouter.ai/docs/guides/routing/model-fallbacks

**可移植原理**：runtime failover 是必要的，但 planned EOL 不應永遠被當作一般 runtime failure；兩者應分層。

---

## B. Adjacent Transferable Workflow

### CONFIRMED — magicdoor saved workflow migration — 2026-09-08

magicdoor Images 以 Recraft V4.1 取代 Recraft V4，同時退休 Flux.1 Kontext Pro；既有 saved workflows 會繼續透過 supported replacement 運作，而且 upload/paste/prompt-first workflow 不變。

Source:
- https://www.magicdoor.ai/changelog

**JTBD**：使用者保存的是「工作流」，不是「對某個短命 model ID 的忠誠」。模型升級時，希望原本 workflow 不需要逐一重建。

**為何省步驟**：避免每一個 saved workflow 手工重選模型、重新設定。

**Onboarding / distribution**：維持原 UI/入口，把模型變動藏在 product-managed lifecycle 之下。

**Automation / provenance pattern**：product alias / workflow identity 與 concrete runtime model 分離。

**Pricing signal**：新 Recraft V4.1 仍有明確 per-image price；replacement 並不等於成本相同，因此任何自動 migration 都必須把 cost contract 一起驗證。

**限制 / failure point**：官方 changelog 能證明 workflow 被 reroute，不能證明新舊模型輸出語義等價。

**適合吸收**：stable alias、replacement candidate、migration receipt。

**不應照抄**：對 tool calling / structured output / code agent 做 silent auto-swap；這些產品面向的行為漂移風險遠高於單純 saved image workflow。

---

## C. Emerging Tool / New Product Possibility

### CONFIRMED — GitHub Copilot model retirement wave — 2026-08-11 / 2026-08-31 / 2026-09-03

GitHub 官方公告：
- `MAI-Code-1-Flash`：**2026-09-10** 退役，建議 `MAI-Code-1.1-Flash`；
- 2026-09-01：Gemini 3.1 Pro、Claude Opus 4.5/4.6、Claude Sonnet 4.5/4.6、Raptor Mini 等已退役；
- 2026-10-02：Gemini 3.5/3.6 Flash、Kimi K2.7 Code、Claude Opus 4.7 預定退役。

Sources:
- https://github.blog/changelog/2026-08-11-upcoming-deprecation-of-mai-code-1-flash/
- https://github.blog/changelog/2026-08-31-selected-github-copilot-models-deprecated/
- https://github.blog/changelog/2026-09-03-upcoming-deprecation-of-selected-github-copilot-models/
- https://docs.github.com/en/copilot/reference/ai-models/supported-models

**JTBD**：agent/workflow owner 需要在 cutoff 前知道 pinned model 是否仍存在、replacement 是否已被 policy 啟用並經過測試。

**省步驟 / reliability**：把散落在 changelog、admin policy、各 workflow config 的 model dependency 轉成可 inventory 的 lifecycle data。

**新模式**：model lifecycle 本身正接近 package/runtime dependency lifecycle；不是只有 request-time latency/cost 的 routing 問題。

**不應誤讀**：GitHub 的 `suggested alternative` 只是遷移建議，不證明替代模型對某個產品 contract 無 regression。

### CONFIRMED — Groq formal model deprecation lifecycle — current docs, checked 2026-09-10

Groq 明確定義 announcement → transition → optional automatic upgrade → EOL，並區分 production 與 preview model 的穩定性預期。其近期紀錄顯示 `llama-3.1-8b-instant` 與 `llama-3.3-70b-versatile` 對 free/developer tier 在 **2026-08-16** shutdown，官方提供 replacement IDs。

Source:
- https://console.groq.com/docs/deprecations

這是 `cf-ai-router` 的直接 upstream signal；目前 chain 已使用 Groq `openai/gpt-oss-120b`。

### CONFIRMED — Portkey canary testing — checked 2026-09-10

Portkey AI Gateway 將 canary testing 與 fallbacks/retries/load-balancing 並列。這支持「replacement 在正式進 routing 前先 bounded canary」的 gateway pattern。

Source:
- https://portkey.ai/features/ai-gateway

---

# New Releases / Secondary Market Scans

## CONFIRMED — Coursera Project Helix — 2026-09-09

Coursera 宣布 Project Helix，將 natural-language goals、adaptive learning paths、demonstrated capability、skills intelligence、credentials 與 portable skills record 放在同一 AI-native platform；預計 2027 H1 廣泛 enterprise availability。

Source:
- https://investor.coursera.com/news/news-details/2026/Coursera-Announces-Project-Helix-a-New-AI-Native-Platform-Connecting-Skills-Discovery-and-Personalized-Learning-to-Verified-Capability-and-Business-Outcomes/default.aspx

對 `cyber-prep-coach` / `police-exam-practice` 的可移植訊號是「從總分/完成度往可驗證 capability evidence 移動」，但本輪不立案：`cyber-prep-coach #4` 已處理 mastery profile，而最新 #6 又把 explanation calibration 列為 public-release blocker；先把可信學習證據做實，比擴張 portable credential 更重要。

## CONFIRMED — PrepareBuddy / Pocket Prep coaching-vs-exam separation — current 2026

PrepareBuddy 讓 learner 在 `No Help / Guided Hints / AI Buddy / Real Exam` 間明確切換，Real Exam 隱藏 coaching；Pocket Prep AI Tutor 也刻意不在 Mock Exam 等模式提供 tutor。

Sources:
- https://preparebuddy.ai/
- https://www.pocketprep.com/posts/meet-your-new-ai-tutor-smarter-studying-starts-here/

可移植訊號：training assistance 與 exam-simulation authority 應分離。`cyber-prep-coach` 已有 official-mode fidelity #3，`voice-actress` 也已有獨立 exam/tutor surfaces；目前不再建重複 feature。

## CONFIRMED — Avo + MEDITECH integration expansion — 2026-09-09

Avo 將 Chart Assist、Ask Avo、AI Scribe 納入 MEDITECH Alliance，方向是把 AI 直接放進 EHR workflow，而不是讓臨床人員在另一個聊天產品 copy/paste。

Source:
- https://www.prnewswire.com/news-releases/avo-expands-meditech-alliance-partnership-bringing-its-suite-of-ai-powered-products-to-meditechs-ehr-302872806.html

對 `clinical-scribe-worker` 的訊號仍是「workflow-integrated handoff」；但 vendor 成效宣稱不作效果證據，而且本產品現階段應優先 clinician review / provenance / specialty validation，不追完整 clinical decision platform。

## CONFIRMED — Deepgram Flux TTS — checked 2026-09-10

Deepgram Flux TTS 把 conversation state、barge-in / interruption 與 per-turn speech lifecycle 做成 API primitive；其官方頁同時提供 2026-09-12 前的 limited free promotion。

Source:
- https://deepgram.com/product/text-to-speech/flux

對 `voice-actress` TTS maintenance line 是新技術訊號，但 `voice-actress` 現階段主線已轉成警察申論練習；除非回到 live conversational voice JTBD，否則不應為新 TTS 模型重擴主產品 scope。

---

# Community Pain Points

以下全部只標為 **COMMUNITY_SIGNAL**，不當統計調查：

1. 2026-04-22 GitHub Copilot 使用者描述，subagent model policy 改變、Gemini 被移除後，原本 `Opus + Gemini + 5.4` 的自動 code-review workflow 需要改成人工切模型。這是「model/policy drift 會讓跨模型工作流突然多出人工重新選擇」的具體案例，不代表 Copilot 全體使用者失敗率。
   Source: https://www.reddit.com/r/GithubCopilot/comments/1ss5xd5/copilot_cli_you_can_no_longer_call_a_higher_model/

2. 2026-04-20～21 多位 Copilot 使用者在方案/模型選項變更後抱怨，原本依賴的 model choice、multiplier 與 workflow 被打亂。這些留言可能有情緒化與帳號方案差異，只保留為「產品若把 model identity 當靜態設定，使用者會直接感受到 migration cost」的 anecdotal evidence。
   Sources:
   - https://www.reddit.com/r/GithubCopilot/comments/1sr66yl/one_week_into_github_copilot_and_the_plan_changes/
   - https://www.reddit.com/r/GithubCopilot/comments/1srj6xi/github_copilot_is_not_the_same_product_you_signed/

3. 2026-09-04 有 Copilot Pro 使用者反映切換服務後對 credit consumption 不確定。這不是 model retirement evidence，但提醒 replacement validation 不能只看「能不能回 200」，也要檢查成本/配額 contract。
   Source: https://www.reddit.com/r/GithubCopilot/comments/1w6zbe6/copilot_pro_am_i_missing_something/

---

# Adjacent Ideas

## 1. Model Lifecycle Registry + Sunset Canary — PROMOTE

核心不是自動抓 changelog 改 production，而是把 planned upstream retirement 變成受控的 dependency migration。

Candidate schema:
- `provider`
- `model_id`
- `lifecycle_state = ACTIVE | PREVIEW | DEPRECATED | EOL_PENDING | RETIRED | UNKNOWN`
- `announced_at`
- `shutdown_at`
- `source_url`
- `source_checked_at`
- `provider_recommended_replacements[]`
- `registry_revision`

Replacement 必須再走 local evidence：cost gate → required capability → actual Gateway reachability → frozen fixture → bounded canary → explicit promotion。

## 2. Capability Evidence Passport for exam products — RESEARCH LIST

Coursera Project Helix 的 portable skills record 是強市場訊號，但 Reese-max exam portfolio 已有 mastery / attempt-ledger research。先把 per-item evidence、source provenance、official-mode fidelity、explanation calibration做好，再考慮 portable profile/export；不另開 Issue。

## 3. Workflow-embedded clinical AI — RESEARCH LIST

Avo/Meditech 顯示「不要讓醫師跳工具 copy/paste」的市場方向。但對 `clinical-scribe-worker`，最小可移植原理應只是 bounded handoff / template / review contract，不是 clinical action platform。

---

# Opportunity Score — Promoted Candidate

| Dimension | Score | Reason |
|---|---:|---|
| User Pain | 9/10 | Model rename/EOL 會造成已知可預防的 downtime、fallback latency 與人工 chain 維護。 |
| Strategic Fit | 10/10 | 直接強化 `cf-ai-router` stable alias / multi-provider / zero-surprise-cost 的核心價值。 |
| Novelty | 8/10 | 現有 #1 是 task reliability，#2 是 wire protocol；planned lifecycle migration 尚無 contract。 |
| Evidence Strength | 10/10 | GitHub、Groq、OpenRouter、Portkey、magicdoor 均有第一方公開資料。 |
| Reuse Potential | 9/10 | 可供 autodev-ng、skill-foundry、avatar-vfo、prompt-autoresearch、voice-actress、ppt-studio、ai-novel-workstation 等 pinned-model產品採用。 |
| Implementation Effort | 8/10 | MVP 可從 curated registry + synthetic canary 起步，重用現有 health/cost/capability/tests。 |
| Security/Privacy/Cost Risk | 8/10 | 禁止外部 notice 直接 mutate production；canary synthetic + budgeted，風險可控。 |

**Opportunity Score: 93/100**

---

# Opportunity Map — 35 Products

> 本表保留上一輪已成立方向；只有本輪有新 evidence 的項目用 **NEW/UPDATED** 標記。

| Product | Market | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| exam-archive | 歷屆考試資料庫 | 來源/年份/版本正確 | source traceability | 本地可核對考題檔案 | capability evidence export | 通用 LMS |
| police-exam-practice | 警察考試練習 | 正確計分、題目真值 | per-question attempt ledger | 考前截止日複習 | portable capability profile | 無來源 AI tutor |
| police-exam-archive | 警察考題典藏/檢索 | canonical source | 精確題目/附件定位 | 警察考試專屬 provenance | evidence→review queue | 社群 feed |
| 92-duty-scheduler | 單位勤務排班 | 權限、硬限制、可重現 | PolicySpec preview/conflict | deterministic Rule Studio | SOP→candidate policy | LLM 直接排班 |
| UkePack | 烏克麗麗教材製作 | MusicXML/render 正確 | 老師試用/審稿流程 | 可解釋簡化＋teacher review | classroom handoff | 大型音樂 marketplace |
| ppt-studio | AI 簡報製作 | export fidelity/source | claim/source provenance | audited deck generation | connector/handoff | 複製 Canva 全功能 |
| voice-actress | 警察申論練習＋TTS | 批改真值、exam/training 邊界 | feedback/SRS/正式模考 | 台灣警察申論 rubric | coaching mode separation | **UPDATED:** 為新 TTS 模型偏離主線 |
| taiwan-intel-dashboard | 公開情報 dashboard | operating-state/source truth | evidence locator/freshness | 台灣公開資料 canonical evidence | Evidence MCP after truth fixes | truth bug 未修先擴 distribution |
| autodev-ng | 多 repo 自動研發控制面 | lock、安全、runtime evidence | provider/recovery visibility | Issue closed-loop governance | **NEW:** consume ModelLifecycleReceipt | 無人值守 deploy/secret mutation |
| flux-image-gen | AI 圖像工作流 | model/input/output provenance | model-version migration | reproducible image workflow | **NEW:** lifecycle-aware alias | silent model swap |
| claude-mem | Agent memory | provenance/deletion | poisoning/admission | local summarized memory | origin-aware shared memory | memory = authorization |
| lobsterpulse | 多 Agent 狀態監控 | state detection 正確 | needs-attention inbox | cross-agent attention routing | lifecycle alerts | signal 未穩先堆 dashboard |
| prompt-autoresearch | Prompt 自動研究 | reproducible evals | exact model fingerprint | autonomous prompt experimentation | **NEW:** migration replay on model sunset | 在 moving model 上靜默比較 |
| neciken-summer-poem | 個人創作/詩文 | 可重現輸出條件 | style continuity | 私人創作 workflow | behavior regression | 通用寫作 SaaS |
| note-filler | 筆記/表單補全 | 不越界補資料 | structured evidence fill | template-first local workflow | source-span receipt | generic second brain |
| lplrs-judicial-sync | 司法判決同步 | erasable body/version truth | AuthorityReceipt/SourceSpan | court-source lifecycle provenance | read-only legal distribution | 自動推論 good-law status |
| adng-memory | Durable agent memory | activation/deletion lineage | poisoning/quarantine | memory lifecycle receipt | team memory governance | stored = trusted |
| cyber-prep-coach | iPAS 資安備考 | **UPDATED:** explanation calibration/source/official fidelity | mastery profile | 880 題 local traceable bank | capability evidence passport later | generic AI tutor before #6 |
| cf-ai-router | 多 provider AI gateway | cost hard gate、fallback、capability | #1 reliability + #2 Responses contract | free/subscription-pool audited routing | **PROMOTED:** Model Lifecycle Registry + Sunset Canary (#4) | enterprise gateway scope / silent swap |
| avatar-vfo | Persona/avatar continuity | persona truth/trajectory | paired behavior regression | VFO explainability | **UPDATED:** lifecycle-triggered replay | 增加未驗證 state variables |
| project-doctor-web | 醫療教育虛擬病人 | CaseSpec ground truth | rubric/debrief | state-bound simulation | evidence replay | diagnostic autonomy |
| minideck | 輕量簡報發布 | draft/published truth | export/state recovery | minimal local deck workflow | claim receipts | full design suite |
| chatgpt-dual-pipeline | 多模型協作 pipeline | source-of-truth/identity | cross-engine handoff | paired model review | **NEW:** model sunset preflight | hidden auto model substitution |
| internship-notes-sites-mirror | 實習筆記鏡像 | mirror fidelity | sync provenance | offline/archive availability | structured export | CMS feature sprawl |
| taichung-police-intel | 公開警政/市政情報 | source/freshness/conflict truth | read-only Evidence MCP | canonical public evidence | external AI distribution | internal/operational data |
| soundbox-offline | 離線音效板 | local import/playback | LAN/QR direct transfer | accountless offline use | TTS asset handoff | cloud-first account requirement |
| skill-foundry | Agent Skill promotion | runtime compatibility/security | security attestation | deterministic promotion receipts | **NEW:** runtime model lifecycle dependency | marketplace before trust |
| video-timeline-pipeline | 影片情報/時間軸 | source fingerprint/timecode evidence | NLE handoff | versioned CutSpec | agent editor adapters | full NLE |
| ai-novel-workstation | 長篇 AI 寫作 | story/world continuity | reproducible model/runtime | local long-form workstation | **NEW:** model-migration behavior replay | generic chat wrapper |
| clinical-scribe-worker | 臨床紀錄 AI | clinician review/provenance | specialty templates | bounded documentation workflow | EHR handoff | clinical action autonomy |
| MaterialYouNewTab | local-first 新分頁/工作區 | privacy/backup | tab session snapshot/restore | Material You local workspace | restore receipt | silent continuous monitoring |
| cf-mcp-server | Cloudflare MCP 操作面 | exact-target confirmation/least privilege | protocol migration safety | deployment/action receipts | model lifecycle if model-backed tools added | broad admin authority |
| tick-stock-panel | 股票資訊/策略面板 | market-data freshness/truth | deterministic StrategyDef | typed, auditable strategy | source/lifecycle receipts | autonomous trading |
| herdr-skills | 多 Agent 協作 skills | engine/task boundary | reusable council/routing skills | multi-engine orchestration | **NEW:** model availability preflight | hardcoded volatile model IDs |
| ninax-line-hermes | LINE × Agent workflow | sender/action authorization | memory/permission receipts | messaging-native agent use | **NEW:** provider lifecycle preflight | memory-based action authority |

---

# Top 10 Cross-Portfolio Ideas

1. **Model Lifecycle Registry + MigrationReceipt** — NEW #1：把 provider/model retirement 當 dependency lifecycle，而不是普通 outage。
2. **Behavior Migration Gate**：model/prompt/memory/provider 變更前，用 sealed probes / paired replay 證明產品 contract 不退化；可和 `avatar-vfo #5` 方法共用。
3. **Candidate → Preview → Promotion → Receipt**：排班、tab snapshot、CutSpec、memory、Skill、model migration 都持續收斂到同一生命週期 primitive。
4. **Canonical Evidence → Interoperable Handoff**：已找出的證據/片段/來源不要要求使用者到下一工具重新抄一次。
5. **Origin-aware Memory / No Authorization by Memory**：任何 external observation 進 memory 後仍保留 origin，retrieve 不能等於授權。
6. **EvidenceEnvelope / AuthorityReceipt**：跨法律、情報、簡報、影片、考題保留 exact source + revision + locator。
7. **Attention Inbox for Agents**：從「顯示所有 agent」轉為「哪個 agent 現在需要人介入」。
8. **Portable Capability Evidence**：考試產品先建立可信 attempt/mastery/calibration，再考慮跨工具 capability record。
9. **Read-only MCP as Distribution Layer**：只有 canonical truth 足夠可靠的產品才把資料送進外部 AI，不先做第二套聊天 UI。
10. **Local Capture / Restore Receipts**：browser/workspace/audio/creative state 先 local versioning，restore 前 preview/diff，不 silent overwrite。

---

# Ideas Rejected / Deferred

## REJECT — Silent automatic model replacement

magicdoor 的 saved image workflow continuity 有吸引力，但不適合直接套到 code/tool/structured-output router。replacement 必須先做 cost/capability/runtime evidence，不能 vendor 一說 alternative 就自動換。

## REJECT — 直接從外部 changelog 抓資料並修改 production chain

外部網頁、RSS、搜尋結果都只能產生 candidate lifecycle data；未驗證來源不能取得 production mutation authority。MVP 應 curated registry + review/canary。

## DEFER — `cf-ai-router` 複製 OpenRouter US/EU In-Region Routing

這是重大 direct-competitor feature，但現有產品的核心 JTBD 是 owner-controlled quota pooling、零意外計費與 auditable fallback，沒有企業 data-residency evidence。保留 research watch，不進 feature backlog。

## DEFER — Exam products新增 portable credential / AI tutor

Project Helix、PrepareBuddy、Pocket Prep 都是強市場訊號，但 `cyber-prep-coach` 目前已有 #3 official fidelity、#4 mastery、#6 independent explanation calibration。信任層未完成前不再擴 assistant surface。

## DEFER — Clinical scribe 擴成決策/行動平台

Avo 的 EHR-integrated suite 顯示市場往 point-of-care workflow 整合，但本 repo 應先證明安全的 documentation/review/handoff；不把 vendor 宣稱的 care/revenue/compliance 效果當實證。

## DEFER — Deepgram Flux 接入 voice-actress 主產品

技術上有趣，但 `voice-actress` README 已明確說主線轉為警察特考申論練習，TTS 是維護線。沒有 live conversational voice JTBD 前不因新模型改產品重心。

---

# Issue Mapping

| Repo | Issue / Action | Result |
|---|---|---|
| `cf-ai-router` | Search open/closed Issues + all-state PR for lifecycle/deprecation/migration/sunset | No duplicate fingerprint |
| `cf-ai-router` | Existing #1 | Related: task reliability profile；不等於 lifecycle |
| `cf-ai-router` | Existing #2 + PR #3 | Related: Responses wire contract；不等於 model retirement |
| `cf-ai-router` | **NEW #4** | **Created — Model Lifecycle Registry + Sunset Canary, Opportunity Score 93/100** |
| `cyber-prep-coach` | Existing #3/#4/#6 | No new Issue；official mode/mastery/calibration 已涵蓋本輪學習市場訊號 |
| `video-timeline-pipeline` | Existing #11 from r2 | No duplicate update |
| All other products | Radar-only | No sufficiently novel, high-confidence nonduplicate candidate this round |

Cross-schedule coordination: no existing same-fingerprint `github-issue-lock:v1` claim was found before creating `cf-ai-router #4`. This round does not claim or modify implementation work.

---

# Sources

## CONFIRMED / First-party

1. GitHub Changelog — Upcoming deprecation of MAI-Code-1-Flash — 2026-08-11
   https://github.blog/changelog/2026-08-11-upcoming-deprecation-of-mai-code-1-flash/
2. GitHub Changelog — Selected GitHub Copilot models deprecated — 2026-08-31 / effective 2026-09-01
   https://github.blog/changelog/2026-08-31-selected-github-copilot-models-deprecated/
3. GitHub Changelog — Upcoming deprecation of selected Copilot models — 2026-09-03
   https://github.blog/changelog/2026-09-03-upcoming-deprecation-of-selected-github-copilot-models/
4. GitHub Docs — Supported Copilot models / retirement history — checked 2026-09-10
   https://docs.github.com/en/copilot/reference/ai-models/supported-models
5. GroqDocs — Model Deprecation — checked 2026-09-10
   https://console.groq.com/docs/deprecations
6. OpenRouter — How Model Routing Works — 2026-07
   https://openrouter.ai/blog/insights/model-routing/
7. OpenRouter Docs — Model Fallbacks — checked 2026-09-10
   https://openrouter.ai/docs/guides/routing/model-fallbacks
8. OpenRouter — In-Region Routing — 2026-09-09
   https://openrouter.ai/blog/announcements/us-in-region-routing/
9. Portkey — AI Gateway / Canary Testing — checked 2026-09-10
   https://portkey.ai/features/ai-gateway
10. magicdoor changelog — Recraft V4.1 + workflow migration — 2026-09-08
    https://www.magicdoor.ai/changelog
11. Coursera — Project Helix — 2026-09-09
    https://investor.coursera.com/news/news-details/2026/Coursera-Announces-Project-Helix-a-New-AI-Native-Platform-Connecting-Skills-Discovery-and-Personalized-Learning-to-Verified-Capability-and-Business-Outcomes/default.aspx
12. Pocket Prep — AI Tutor — 2026-04-13
    https://www.pocketprep.com/posts/meet-your-new-ai-tutor-smarter-studying-starts-here/
13. PrepareBuddy — current product pages, checked 2026-09-10
    https://preparebuddy.ai/
14. Avo / MEDITECH Alliance expansion — 2026-09-09
    https://www.prnewswire.com/news-releases/avo-expands-meditech-alliance-partnership-bringing-its-suite-of-ai-powered-products-to-meditechs-ehr-302872806.html
15. Deepgram Flux TTS — checked 2026-09-10
    https://deepgram.com/product/text-to-speech/flux

## COMMUNITY_SIGNAL only

16. GitHub Copilot subagent/model workflow friction — 2026-04-22
    https://www.reddit.com/r/GithubCopilot/comments/1ss5xd5/copilot_cli_you_can_no_longer_call_a_higher_model/
17. Copilot plan/model-change complaint — 2026-04-20
    https://www.reddit.com/r/GithubCopilot/comments/1sr66yl/one_week_into_github_copilot_and_the_plan_changes/
18. Copilot model/plan change complaint — 2026-04-21
    https://www.reddit.com/r/GithubCopilot/comments/1srj6xi/github_copilot_is_not_the_same_product_you_signed/
19. Copilot Pro credit-consumption concern — 2026-09-04
    https://www.reddit.com/r/GithubCopilot/comments/1w6zbe6/copilot_pro_am_i_missing_something/

---

# What Changed Since Last Radar

1. **新增高價值方向從 video handoff 轉到 AI runtime lifecycle**：r2 解的是「已選好的影片 evidence 如何不重抄到 NLE」；r3 解的是「已存在的 model-dependent workflow 如何在 upstream model planned retirement 前完成受控 migration」。
2. **首次正式把 provider/model EOL 視為 planned dependency failure**，而不是 runtime 404/5xx 的變體。
3. **建立 `cf-ai-router #4`**，與 #1 reliability profile、#2 Responses API 明確切開 fingerprint。
4. **新增跨 Portfolio primitive：`ModelLifecycleEntry + MigrationReceipt`**；之後可被 autodev-ng / avatar-vfo / skill-foundry / prompt-autoresearch / ai-novel-workstation 等重用。
5. **考試產品方向反而收斂**：Project Helix / AI tutoring 市場持續增長，但 `cyber-prep-coach` 最新 audit #6 顯示現在應先做 independent content calibration，不應因外部 AI tutor 熱潮繼續加 surface。
6. **不把新 direct-competitor feature 一律變 backlog**：OpenRouter 9/9 In-Region Routing 是真實重大更新，但不符合目前 `cf-ai-router` 的 primary JTBD，因此列為 DO NOT COPY / watch，而非 feature request。

---

## Portfolio Principle Added This Round

**「能 fallback」不等於「已安全完成 migration」。**

planned model retirement 應採：

`Known Vendor Change → Typed Lifecycle State → Replacement Candidate → Local Cost/Capability Evidence → Bounded Canary → Explicit Promotion → MigrationReceipt`

而不是：

`Old model dies → request errors → fallback happens → operator later discovers why`。
