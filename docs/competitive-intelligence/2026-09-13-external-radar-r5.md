# 外部競品／新品／工作流靈感雷達 — 2026-09-13 r5

> Scope：Reese-max 擁有、未封存、可視為產品的 repositories。  
> 主要證據：GitHub 之外的公開網路；GitHub 僅用於目前產品真相、近期變更、duplicate/PR/lock 與 Issue mapping。  
> 證據標記：`CONFIRMED`＝官方／第一方或直接可驗證產品面；`LIKELY`＝強但不完整交叉證據；`COMMUNITY_SIGNAL`＝社群個案；`UNKNOWN`＝不足以判定。  
> 本輪 repo inventory：**37** 個 owned + unarchived product-like repositories。

## Executive Decision

**NOTIFY。** 本輪找到一個足以正式立案、且與目前 Reese-max 簡報產品能力不重複的新產品方向：

> **Structured Slide State + Render Verification**：AI 不只產生「看起來像投影片」的結果，而是對有穩定物件身分、版面語意與原生可編輯結構的 slide state 做 bounded candidate patch；套用前後同時驗證結構與實際 render，最後才 promotion/export。

已建立 `Reese-max/ppt-studio #5`：  
`[Competitive Inspiration][Research][RESEARCH_REQUIRED][WORKFLOW] 建立 Structured Slide State + Render Verification，讓 AI 修改保持原生可編輯`

Opportunity Score：**92/100**。

這不是「加更多版型」或「複製 Canva」。它處理的是目前 AI 簡報產品逐步形成的新底線：**生成後仍是正常、原生、可局部修改、可交接給人與其他工具的工作檔。**

核心 contract：

`Canonical Slide State → Stable Object/Slot Graph → AI Candidate Patch → Exact Touched-Object Diff → Schema/Layout Validation → Render Candidate → Visual/Invariant Verification → Human Preview → Explicit Promotion → Export/Read-back Receipt`

新增 Portfolio 原則：

> **Editable JSON ≠ Native Editability ≠ Rendered Equivalence ≠ Brand-preserving Mutation ≠ Verified Export**

---

# Product → Market Category Map

| Repository | 市場／產品類別 | 本輪目前真相／優先序 |
|---|---|---|
| cf-ai-router | AI gateway／成本安全路由 | cache/cost 與 fail-closed provider truth 仍優先；本輪無新高價值 gap。 |
| soundbox-offline | local-first/offline 音樂播放器 | recovery/CI 仍先於 NAS/cloud source breadth。 |
| police-exam-archive | 官方考題 archive/provenance | source truth、頁碼／圖檔 provenance 仍是核心。 |
| skill-foundry | Agent Skill 研究／認證 | #5 Demonstration-to-Skill Intake 已吸收近期 record-a-skill 趨勢。 |
| lobsterpulse | multi-agent observability/attention | Decision-only Attention Queue 仍符合市場需求，不需更多通知噪音。 |
| prompt-autoresearch | prompt/model 實驗 | candidate/evidence-first 實驗方向正確；無新獨立 gap。 |
| tick-stock-panel | 股票研究／screening/backtest | **新 P1 #6**：AI/custom Python 仍 in-process；#5 deterministic StrategyDef compiler 現在更具優先性。 |
| clinical-scribe-worker | clinical scribe／structured note | user-owned values、domain validation、redaction candidate 仍優先。 |
| avatar-vfo | avatar/content workflow | candidate-first、explicit publish authority 仍優於自動發佈。 |
| adng-memory | durable Agent memory | activation/staleness/erasure 已是主要差異化。 |
| ai-flight-radar | flight/fare intelligence | live quote truth/calibration/licensing 仍先於自動 rebook。 |
| taiwan-intel-dashboard | 台灣情報 dashboard | source-backed answer/evidence receipt 仍是核心。 |
| note-filler | structured form completion | user-owned vs AI-owned 值、review/export gate 仍優先。 |
| cyber-prep-coach | 資安考試教練 | exam blueprint/dataset/mastery migration 仍是主要機會。 |
| UkePack | 教學／音樂內容工具 | 本輪無高信心新市場變化。 |
| autodev-ng | multi-agent 開發 orchestration/governance | #12/#17/#21/#28 等 authority contracts 已覆蓋本輪 Agent 安全訊號。 |
| ai-novel-workstation | 長篇小說工作站 | #6 typed story workspace/candidate mutation 仍是主要方向。 |
| herdr-skills | multi-agent skills/workflows | correction/friction → candidate improvement 已匹配 workflow-mining 趨勢。 |
| video-timeline-pipeline | evidence-backed video edit/NLE handoff | native NLE target apply 候選已有 #11/相關工作；#18 cost-timezone 正確性先修。 |
| chatgpt-dual-pipeline | 雙引擎內容／發佈 | candidate publication + explicit publish authority 仍適合。 |
| claude-mem | Claude memory/context layer | scope/portability/staleness 仍比增加新 UI 更重要。 |
| lplrs-judicial-sync | 司法資料同步 | schedule coverage/backfill receipt 仍為 MUST MATCH。 |
| internship-notes-sites-mirror | publishing/mirror/archive | deterministic mirroring/provenance 優先。 |
| MaterialYouNewTab | local-first new-tab workspace | Workspace Session Capsule 仍是高價值 research；避免整個 browser-agent 化。 |
| taichung-police-intel | 政府／警政情報監測 | Evidence MCP、meeting/session provenance 仍優先。 |
| ninax-line-hermes | LINE/Agent workflow integration | LINE messageEdited/redelivery correctness 仍先於多 Agent room breadth。 |
| 92-duty-scheduler | duty scheduling／swap governance | policy-spec/ranked repair/human inbox 仍是合適形狀。 |
| voice-actress | 法律／申論 evidence workflow | citation exists/supports claim/reasoning correctness 分離仍是差異化。 |
| project-doctor-web | 醫療情境模擬／case learning | CaseSpec/action ledger、anti-fabrication 仍先於 generic agent UX。 |
| flux-image-gen | AI 圖片生成／多輪編輯 | #22 Creative Edit Session/Reference Tray 仍是主方向。 |
| neciken-summer-poem | 文學／競賽工作站 | contest policy/export fail-closed 仍符合 integrity 需求。 |
| minideck | 輕量簡報／分享 | published_version 與 draft head 分離仍先；可日後重用 structured-artifact primitive。 |
| police-exam-practice | 警察考試練習 | provenance、解析、模擬考真實流程優先。 |
| **ppt-studio** | **AI presentation studio** | **本輪新立 #5：Structured Slide State + Render Verification；#1 auth/local boundary 仍不得被功能擴張繞過。** |
| exam-archive | 通用考題 archive | source traceability 仍主導。 |
| academic-mcp | 學術搜尋／evidence MCP | canonical paper identity、research bundle、entitlement truth 仍是核心。 |
| cf-mcp-server | governed Cloudflare MCP | #15 Tool Contract Manifest + Drift Gate 仍是主要外部治理機會。 |

---

# External Signals

## A. 直接競品：Google Slides 把「fully native and editable」當 AI 生成底線

**分類：CONFIRMED**  
**日期：2026-06-30**  
**來源：** https://workspaceupdates.googleblog.com/2026/06/create-fully-native-and-editable-presentations-with-Gemini-in-Google-Slides.html

Google Slides 的 Gemini 已能從 prompt 產生完整多頁簡報、用 Drive 檔案 grounding、拿另一份 deck 當 style reference，且在真正生成前可讓使用者修改／批准 outline。最重要的產品訊號不是「有 AI」，而是官方特別把輸出定義成 **fully native and editable slides**。

### JTBD
使用者需要 AI 快速做初稿，但後續仍要像普通 Slides 一樣改字、改圖、改版面、交給同事繼續做，而不是得到一個「只能重生成」的 AI artifact。

### 為何省步驟／提高可靠性
若生成結果本身就是 native artifact，就減少「生成 → 匯出 → 發現元素扁平化／位移 → 人工重建」的 handoff 稅。

### Onboarding / distribution
AI 直接存在既有 Slides，而不是另要求使用者學新 editor；Drive/style reference 也把既有資產直接變成輸入。

### 能力模式
`existing content + style reference + outline approval + native editable generation`。

### Business model signal
功能落在 Business Standard/Plus、Enterprise Standard/Plus、Google AI Pro/Ultra 等方案；editability 被包在正式 productivity suite 能力，而不是單次 image-generation add-on。

### 限制／不要照抄
- Google Workspace/Drive 整合不是 Reese-max 必須複製的 moat。
- 官方功能頁是 capability evidence，不是「品質一定更好」的證明。
- Reese-max 應吸收 native artifact contract，而不是重做雲端協作套件。

---

## A2. 直接競品：Canva AI 2.0 的 Layered Object Intelligence

**分類：CONFIRMED（current product surface；本輪查核 2026-09-13）**  
**來源：** https://www.canva.com/newsroom/news/canva-create-2026-ai/

Canva AI 2.0 強調生成內容由 individual editable objects 組成，而不是 flat image；它把 layout、hierarchy、brand 和 object-level edits 放在同一 design engine 中，使用者也可隨時接手手動編輯。

### JTBD
AI 做完整視覺初稿後，使用者只想改一個 headline/image/font，而不是每次要求模型重做整頁。

### Transferable pattern
`AI Intent → bounded object mutation → same canonical design engine`。

### 不應照抄
- 不做 Canva/Figma clone。
- 不一次支援任意向量／自由幾何／多通路 campaign。
- 不把 vendor「只改那個物件」的敘述當成 Reese-max 已證實的 runtime 性質；需自己用 fixture 驗證 untouched-object invariants。

---

## A3. 直接競品：Pitch Agent 把 AI action 綁在 editor block，成本也以 action 計

**分類：CONFIRMED（代表性模式，較 90 天稍舊）**  
**日期：2026-05-27**  
**來源：** https://help.pitch.com/en/articles/14981091-pitch-agent  
**AI credits：** https://help.pitch.com/en/articles/12755590-guide-to-ai-credits

Pitch Agent 在 editor 內工作，可新增 slide、替換 image，並依使用者目前選到的 text/image/other block 顯示 quick actions。AI usage 以 credits per action 計，workspace 可設 monthly credit budget。

### 產品設計訊號
`selected object + bounded action + visible cost` 比「整份 deck 丟給 AI 重做」更可預測。這是 workflow/pricing signal，不作效果證明。

---

# New Releases / Emerging Technology

## C. SLIDEFORGE：Deck State Graph + rendered-state verification

**分類：CONFIRMED RESEARCH**  
**日期：2026-09-02**  
**來源：** https://arxiv.org/abs/2609.03109

SLIDEFORGE 研究把 slide 定義成連接 visual decomposition、native PPTX object structure 與 perceptual organization 的 Deck State Graph，並用 slide-native operation 做 theme-preserving reconstruction，再驗證 rendered state。

本輪不使用其 benchmark 數字當產品效果證明。可移植的原理只有：

`Native Object Structure ≠ Rendered State`，兩者都要驗證。

這直接補足 `ppt-studio` 現行 coarse field/layout representation 與實際 PPTX/browser render 之間的產品缺口。

---

# Adjacent Ideas

## B. Slides → Vids：canonical artifact 直接成為下一個 workflow 的 input

**分類：CONFIRMED**  
**日期：2026-08-20；Scheduled Release 2026-09-07 起全面 rollout**  
**來源：** https://workspaceupdates.googleblog.com/2026/08/record-presentations-in-google-slides-with-Google-Vids.html

Google 把 Slides 的 `Record` 直接導到 Vids，並加入 transcript-based editing/voiceover。這是一個相鄰但重要的 handoff 模式：**下游工作流應重用 canonical deck，而不是先 flatten/export 成中間檔再人工重建 context。**

對 Reese-max 的可移植原理：
- `ppt-studio` 的 native structured slide state 可成為未來 narration/video/export 的 canonical input；
- `video-timeline-pipeline` 也應持續優先 typed target handoff，而不是重做完整 NLE；
- 不因這個訊號現在就新增 video-generation feature。

---

# Community Pain Points

以下均為 `COMMUNITY_SIGNAL`，只作 failure-mode 個案，不冒充統計：

1. **2026-07-24 PowerPoint discussion**：使用者表示 AI deck 作 first draft 很快，但 PPTX handoff 時常需要重建 flattened charts、修多欄位移，否則團隊後續編輯困難。  
   https://www.reddit.com/r/powerpoint/comments/1v51dlm/if_your_ai_presentation_tool_keeps_making_decks/
2. **2026-07-07 Copilot Studio discussion**：一位 practitioner 把公司品牌模板轉成 JSON/coordinates catalogue，再由 renderer 機械生成，並以 screenshot 檢查 overflow；他指出這條流程有效但分享／成本仍有摩擦。  
   https://www.reddit.com/r/copilotstudio/comments/1uqarfx/creating_on_brand_powerpoint_decks/
3. **2026-07-19 Microsoft 365 Copilot discussion**：使用者抱怨 Agent mode 產生的新 slide 與 corporate deck 不一致。  
   https://www.reddit.com/r/microsoft_365_copilot/comments/1v0yuhg/powerpoint_agent_how_to_make_slides_that_look/
4. **2026-07-12 AIToolsAndTips discussion**：使用者描述 writing 已交給 Claude，但仍需把內容手工拖進 slides，形成跨工具人工重建。  
   https://www.reddit.com/r/AIToolsAndTips/comments/1uu815b/with_so_many_ai_tools_to_create_ppt_what_are_you/

可移植重點不是「某競品不好」，而是：**真正的使用者成本常發生在 AI first draft 之後的 edit/handoff/brand-preservation。**

---

# Repository Truth / What Changed Since Last Radar

## 1. `ppt-studio` 新機會成立且不重複
Current default branch `2c2ec432a559b726d35b0cc2d4b491b7f9ebd929` 的 repository evidence 顯示：
- `app_legacy.py` 目前 `VALID_LAYOUTS` 只有 `title-only / title-bullets / two-column / image-right`；
- generation/safety path 主要操作 `title/content/notes/bullets/layout` 等 coarse fields；
- 已有 `preview_only` 的單頁 AI action，可作 candidate-first mutation 基礎；
- 已有 PPTX/JSON/Markdown export 與 editor；
- #3 已處理 claim/source provenance，但沒有 stable object graph/render verification fingerprint；
- all-state PR 與 `github-issue-lock:v1` 搜尋未發現同 fingerprint。

因此本輪建立 #5，而不是更新 #3。

## 2. `ppt-studio #1` 仍是 trust-boundary gate
#1 仍 open：Docker Compose/local-only vs authentication 的 supported deployment boundary 未可視為 fully closed。雖然 2026-09-06 已有 loopback+APP_TOKEN 修補 commit，Issue 仍 reopen；因此 #5 明確只做 research contract/fixtures，不以新功能擴大 remote surface。

## 3. `tick-stock-panel` 新出現 P1 execution-boundary blocker
本輪 GitHub recent truth 新增：
- **#6 P1**：AI-generated/custom strategy Python 經 AST allowlist 後仍以 `spec.loader.exec_module()` 在服務 process 內執行；validator 自己也明示 AST allowlist 不是 real sandbox。
- **#5 Research** 已提出 natural-language → inspectable deterministic `StrategyDef`/Screener compiler，並以 TradingView AI Screener 為外部訊號。

因此 Opportunity Map 更新為：**先讓 supported intent 編譯成 deterministic StrategyDef；仍要保留 Python 時再用隔離 runner。不要再擴張「LLM 直接生 Python」功能。**

## 4. `autodev-ng #12` 仍由 active PR 處理
PR #26 `docs: cross-engine egress policy contract` 仍 OPEN，head `devin/issue-12-research`。本輪沒有把新的 presentation work 混進 #12，也沒有搶其 lock/scope。

---

# Opportunity Map — 全 37 個產品

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| cf-ai-router | truthful provider/cost state | cache-aware real cost receipt | fail-closed free/cost routing | session/cache affinity | opaque cheapest-model auto-routing |
| soundbox-offline | reliable offline library | recovery/scan receipts | local-first privacy | bounded NAS source after reliability | cloud-sync breadth before integrity |
| police-exam-archive | official-source provenance | image/page locator | audit-friendly archive | evidence bundle export | AI answers detached from source |
| skill-foundry | candidate before promotion | demo→task model provenance | independent eval/security/runtime gates | workflow mining | recorded demo == certified skill |
| lobsterpulse | useful alerting | attention dedupe | decision-only queue | cross-agent decision receipt | every event becomes notification |
| prompt-autoresearch | reproducible experiment | model/cost/evidence ledger | candidate-first optimization | safe-transform experiments | self-scoring as sole evaluator |
| tick-stock-panel | sandbox untrusted code | deterministic StrategyDef compiler | coverage/point-in-time truth | NL→visible rule AST | LLM Python executed in service process |
| clinical-scribe-worker | domain validity + privacy | user-owned fields | evidence-backed note candidate | safe-redaction candidate | silent clinical meaning rewrite |
| avatar-vfo | review before publish | reusable asset lineage | candidate content workflow | object-level creative patch | autonomous publishing by default |
| adng-memory | scope/staleness/delete | activation evidence | memory lifecycle receipts | principal-aware memory | permanent unscoped memory |
| ai-flight-radar | live quote truth | post-booking evidence | source/currency/fare-rule provenance | reprice candidate | auto-rebook without fare-rule proof |
| taiwan-intel-dashboard | source-backed claims | changed-since-last | evidence-first briefing | generated task views | summary detached from sources |
| note-filler | explicit review/export | user-owned overwrite protection | field-level provenance | structured generated form view | AI overwrites manual edits |
| cyber-prep-coach | blueprint/source truth | mastery migration | exam-version receipt | official-version switch | treating dataset hash as exam version |
| UkePack | reliable course/content structure | reusable templates | local teaching workflow | structured lesson artifacts | generic AI chat bolted on |
| autodev-ng | runtime truth and fail-closed gates | principal/env/effect/browser/tool contracts | composable governance receipts | candidate safety transforms | giant monolithic control-plane UI |
| ai-novel-workstation | canonical manuscript truth | typed story reads/patches | continuity + promotion gate | agent-facing story workspace | raw filesystem authority |
| herdr-skills | reviewable skill/rule changes | repeated-friction mining | exact evidence diff | demo-derived candidates | correction instantly becomes policy |
| video-timeline-pipeline | deterministic timecode/evidence | NLE capability probe/read-back | evidence-backed CutSpec | typed native NLE apply | rebuild full NLE |
| chatgpt-dual-pipeline | canonical draft/publication state | cross-engine provenance | candidate publish contract | structured content patches | auto-publish on model completion |
| claude-mem | scoped memory | portable lifecycle truth | local evidence/erasure | principal-aware scopes | hidden permanent capture |
| lplrs-judicial-sync | target-date coverage | missed-run alarm/backfill | gap receipt | irrecoverable-gap accounting | assuming schedule == coverage |
| internship-notes-sites-mirror | deterministic mirror | changed-content receipt | durable archive | structured source map | AI rewrite in mirror path |
| MaterialYouNewTab | fast local workspace | session restore | privacy/minimal permission | Workspace Session Capsule | full-profile browser agent authority |
| taichung-police-intel | official/live source provenance | cross-source dedupe | evidence-backed meeting/intel sessions | generated operational views | unsourced executive summary |
| ninax-line-hermes | LINE event semantics | edit/redelivery stale-work handling | room-scoped evidence | named-agent room later | multi-agent breadth before correctness |
| 92-duty-scheduler | policy/legal constraints | ranked repair explanation | human-reviewed swap inbox | generated roster task view | AI silently mutates duty truth |
| voice-actress | citation existence/support | claim-level evidence | reasoning verification | source-state ledger | citation URL == supported argument |
| project-doctor-web | deterministic case truth | action/result ledger | anti-fabrication simulation | structured case state graph | freeform clinical hallucination |
| flux-image-gen | safe generation/edit lineage | session/reference continuity | clean-parent branching | spatial edit intent | flatten all revisions into latest image |
| neciken-summer-poem | contest policy integrity | explicit AI-operation receipt | compliant export | structured revision lineage | hidden AI rewriting |
| minideck | draft/public head separation | export fidelity | lightweight explicit publish | reuse structured slide slots later | full collaboration SaaS |
| police-exam-practice | source/answer correctness | realistic exam resume | image-integrated mobile flow | blueprint-aware progress | mode proliferation |
| **ppt-studio** | **native editability** | **stable object patch + render/export verification** | **provenance (#3) + verified editable artifact** | **structured slide state → narration/video/export** | **Canva clone / raster-first AI / arbitrary geometry code** |
| exam-archive | source indexing | consistent metadata | simple provenance-first retrieval | shared evidence schema | AI generation without archive truth |
| academic-mcp | canonical paper identity | entitlement/source-state truth | research bundle ledger | citation graph traversal | paper found == full text available |
| cf-mcp-server | stable tool contract | semantic drift detection | effect-class/tool receipts | contract manifest reused portfolio-wide | connected server == unchanged authority |

---

# Opportunity Scores — 本輪候選

| Candidate | User Pain | Strategic Fit | Novelty | Evidence | Reuse | Effort controllability | Risk controllability | Score | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| ppt-studio Structured Slide State + Render Verification | 9 | 10 | 8 | 10 | 8 | 8 | 9 | **92** | **CREATE #5** |
| tick-stock-panel deterministic StrategyDef first / sandbox Python | 10 | 10 | 7 | 10 | 8 | 7 | 7 | 91 | 已有 #5/#6，更新優先序，不重複立案 |
| Cross-portfolio Candidate Safety Transform | 9 | 10 | 8 | 9 | 10 | 8 | 8 | 92 | #12/PR #26 active，report-only |
| Slides→video canonical-artifact handoff | 7 | 7 | 7 | 9 | 8 | 7 | 8 | 78 | Adjacent research only |

---

# Top 10 Cross-Portfolio Ideas

1. **Structured Artifact State + Candidate Patch + Render/Read-back Verification** — ppt-studio #5；可日後縮窄重用到 minideck。
2. **Candidate Safety Transform** — autodev-ng #12；unsafe proposal 可轉 candidate safe alternative，但必須 exact diff + same-policy recheck。
3. **Deterministic Intent Compiler before Arbitrary Code** — tick-stock-panel #5/#6；也可移植到 form/scheduling/rules products。
4. **Demonstration → Candidate Skill, not direct authority** — skill-foundry #5。
5. **Tool Contract Manifest + Drift Gate** — cf-mcp-server #15；可再移植 academic-mcp/agent tool consumers。
6. **Browser Capability Lease + Human Takeover** — autodev-ng #28。
7. **Typed Agent-facing Workspace + Candidate Mutation** — ai-novel-workstation #6。
8. **Creative Edit Session + clean-parent branching** — flux-image-gen #22。
9. **Evidence Plan → Target-native NLE Apply → Read-back Receipt** — video-timeline-pipeline existing handoff work。
10. **Workspace Session Capsule / URL-only restore truth** — MaterialYouNewTab research direction。

---

# Ideas Rejected / Deferred

1. **不做 Canva/Figma clone**：ppt-studio 的優勢應是 verified editable artifact，而非通用設計 SaaS。
2. **不把「beautify as image」當 primary output**：視覺漂亮但扁平化會破壞 handoff/editability；可作 preview，不能冒充 native artifact。
3. **不為 #5 擴增 Google Drive/Slack/Notion connectors**：distribution signal 與 object-state gap 是兩件事。
4. **不讓 LLM 生成任意 slide geometry/code 並直接執行**：先以目前四種 layout 的 typed slots 驗證價值。
5. **不另建一套 citation graph**：ppt-studio #3 已擁有 SourceEvidence/ClaimEvidence；#5 應引用 stable object IDs。
6. **不替 tick-stock-panel 增加更多 generated-Python 玩法**：#6 已證明 execution boundary 比 feature breadth 急迫。
7. **不因 Google Slides→Vids 就替 ppt-studio 立即做 AI video**：先讓 canonical slide artifact 可驗證。
8. **不以 vendor benchmark 宣稱 native-editability 成效**：SLIDEFORGE benchmark 只作研究訊號。

---

# Issue Mapping / Coordination

| Repo | Issue/PR | 本輪動作 |
|---|---|---|
| ppt-studio | **#5 Structured Slide State + Render Verification** | **新建 Research Issue**；已先做 open/closed Issue、all-state PR、`github-issue-lock:v1` duplicate gate。 |
| ppt-studio | #3 claim/source provenance | 不重複；未來 object IDs 作 evidence anchor。 |
| ppt-studio | #1 Docker/local-auth boundary | 仍 open；#5 不授權 remote breadth。 |
| tick-stock-panel | #5 deterministic StrategyDef compiler | 已有，同方向保留。 |
| tick-stock-panel | #6 P1 isolate generated/custom Python | 新 repository truth；安全優先。 |
| autodev-ng | #12 / PR #26 | PR 仍 OPEN；不搶鎖、不留言。 |

本輪未修改任何產品原始碼、未建立實作分支、未 merge、未 deploy、未改 secrets/權限/repository settings。

---

# Sources

## Official / first-party
- Google Workspace Updates — 2026-06-30 — fully native/editable presentations with Gemini in Slides  
  https://workspaceupdates.googleblog.com/2026/06/create-fully-native-and-editable-presentations-with-Gemini-in-Google-Slides.html
- Google Workspace Updates — 2026-08-20 — Record presentations in Slides with Google Vids  
  https://workspaceupdates.googleblog.com/2026/08/record-presentations-in-google-slides-with-Google-Vids.html
- Canva — AI 2.0 current product surface, checked 2026-09-13  
  https://www.canva.com/newsroom/news/canva-create-2026-ai/
- Canva — Magic Layers current product surface, checked 2026-09-13  
  https://www.canva.com/newsroom/news/magic-layers/
- Pitch Help — Pitch Agent, 2026-05-27  
  https://help.pitch.com/en/articles/14981091-pitch-agent
- Pitch Help — AI credits, checked 2026-09-13  
  https://help.pitch.com/en/articles/12755590-guide-to-ai-credits

## Research
- SLIDEFORGE — 2026-09-02  
  https://arxiv.org/abs/2609.03109

## Community signals — anecdotal only
- PowerPoint AI cleanup / editable PPTX handoff — 2026-07-24  
  https://www.reddit.com/r/powerpoint/comments/1v51dlm/if_your_ai_presentation_tool_keeps_making_decks/
- Structured JSON + render screenshot brand workflow — 2026-07-07  
  https://www.reddit.com/r/copilotstudio/comments/1uqarfx/creating_on_brand_powerpoint_decks/
- Copilot PowerPoint on-brand friction — 2026-07-19  
  https://www.reddit.com/r/microsoft_365_copilot/comments/1v0yuhg/powerpoint_agent_how_to_make_slides_that_look/
- Cross-tool manual slide rebuilding — 2026-07-12  
  https://www.reddit.com/r/AIToolsAndTips/comments/1uu815b/with_so_many_ai_tools_to_create_ppt_what_are_you/

---

# What Changed Since r4

1. **新增正式產品機會：** `ppt-studio #5 Structured Slide State + Render Verification`，Score 92/100。
2. **簡報市場方向更明確：** Google、Canva、Pitch 與最新 SLIDEFORGE 研究共同把「native/editable structured artifact + bounded edit」拉成同一產品趨勢；不再只比誰能生成漂亮初稿。
3. **Opportunity Map 的 ppt-studio 方向改變：** 不再把主要競爭焦點放在「更多 AI layouts/connectors」，而是 `stable object identity + candidate patch + render/export verification + #3 provenance`。
4. **新增 repository safety truth：** `tick-stock-panel #6` 確認 generated/custom Python 仍以 service-process import 執行，因此該產品應優先 `deterministic StrategyDef → isolated Python fallback`，不擴張 arbitrary-code AI。
5. **既有 cross-schedule coordination 不變：** autodev-ng #12 的 PR #26 仍 OPEN，本輪不搶其 effect-policy scope。

## Portfolio conclusion

本輪最值得共用的抽象不是新的「AI Presentation Model」，而是：

`Canonical Structured Artifact → Candidate Patch → Exact-base/Touched-set Validation → Native/Structural Verification → Render Read-back → Explicit Promotion → Export/Effect Receipt`

對 Reese-max 而言，這比追求更多一次性生成模式更能減少真正的人工重工：**生成完之後不用跳到別的工具重建、重新對齊、重新輸入，且每一次 AI 修改都能回答「改了什麼、哪些沒改、看起來是否正確、匯出後是否仍可編輯」。**