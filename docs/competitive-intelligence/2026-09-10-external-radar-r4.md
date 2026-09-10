# External Competitive Intelligence Radar — 2026-09-10 r4

## Executive Summary

本輪重新以 Reese-max 目前可存取、owned、未封存且可視為產品的 **35 個 repositories** 為範圍，先對照上一輪 r3，再檢查近期 repository 變更、既有 Competitive Gap / Feature / Research Issues，並以 GitHub 之外的最新公開網路資料做主要研究來源。

本輪**沒有出現一個同時滿足「新穎、與現有能力不重複、公開證據充分、適合立即立案」的 ≥90 分新機會**，因此沒有建立新的 Competitive Inspiration / Research / Competitive Gap Issue，也沒有為了數量灌水。最值得追蹤的市場變化集中在兩個方向：

1. **多 Agent 工具的競爭正在從「看見很多 session」進一步移到「幫人決定現在先處理哪一個」**。Linear 於 2026-09-03 推出 Priority Inbox，把 blocking review 從一般通知中分出；Baton、Agent Watch、CodeStatus 類產品也把 `waiting / approval / needs attention` 做成顯眼的一級狀態。對 `lobsterpulse` 來說方向成立，但 current default branch 已有 `waitingSessions()`、等待回應清單、starvation ordering、waiting sound/toast 與 rules engine，因此「做 Attention Inbox」已不是乾淨的新功能；而且 Codex activation 的 #3 P1 仍是更高優先 reliability blocker。
2. **Agent/Skill/MCP 元件的信任工作流正變成「全量 baseline scan + 高風險分流到更深檢查」**。Tenable 2026-09-09 對 CyberAgents Exchange AI Inspector 的最新說明，補充了 LLM instructions、tool-chaining permissions、prompt injection 等 attack surface，並強化分層 review 的產品模式。這高度支持 `skill-foundry #3`，但該 Issue 已經完整規劃 package manifest、deterministic static gate、capability declaration、SecurityAttestation、optional semantic review 與 promotion separation；本輪新資料屬**強化既有證據**，不是新的 fingerprint。

因此本輪結論為 **NO NEW HIGH-VALUE ISSUE**。主要新增價值是把「Attention Triage」與「Risk-tiered Component Inspection」兩個市場方向更新到 portfolio Opportunity Map，同時明確記錄為何目前不立案。

---

# Portfolio Discovery / What Changed Since Last Radar

- Scope 維持 **35 個 Reese-max owned + unarchived product-like repositories**。
- r3 新建的 `cf-ai-router #4`（Model Lifecycle Registry + Sunset Canary）已存在；本輪沒有重複建立 model lifecycle / migration 類 Issue。
- `lobsterpulse` current code 已有「等待回應」資料模型：只收 `waiting_for_user` sessions、依等待時間由久到新排序；README / rules-engine 亦已有 task-waiting 即時事件、音效與通知。這使 generic Priority Inbox 的 Novelty 明顯下降。
- `lobsterpulse #3` 仍追蹤 Codex monitoring activation 的 transactional / truthful enablement；在底層 provider identity / activation evidence 未完全可靠前，不應先把 UI 升級成看似更精準的跨 provider priority engine。
- `skill-foundry #3` 已正式追蹤 Agent Skill package-level supply-chain security attestation，且已有 `SkillPackageManifest → Static Gate → Capability Manifest → SecurityAttestation → Promotion Policy` 的完整方向。Tenable 9/9 新文章補強「baseline review + high-risk deeper inspection」，但不構成另一張 Issue。
- `prompt-autoresearch #3` 已處理 stochastic prompt promotion、repeated evaluation、variance/stability、holdout isolation；本輪看到的 prompt optimizer / self-evolving prompt 研究不足以形成另一個不重複的高價值 Issue。
- `soundbox-offline #3` 已處理 same-LAN QR / browser direct transfer；本輪沒有再因 soundboard / local audio 周邊產品而擴張產品定位。
- 本輪沒有修改任何產品原始碼、實作 branch、merge、deploy、secret、permission 或 repository settings。

---

# External Signals

## A. Direct Competitor / Category Signal — Multi-agent Attention Surfaces

### CONFIRMED — Linear Priority Inbox — 2026-09-03

Source: https://linear.app/changelog/2026-09-03-priority-inbox

Linear 把所有通知同權的 Inbox 拆成 `Priority / Other`，官方舉例就是「blocking a release 的 review 不應被其他通知淹沒」。Priority 預設由產品判斷，使用者又可以用來源或 filter 自訂。

**Job-to-be-Done**：當工作流同時產生大量 agent / issue / review 通知時，使用者不是想「看全部」，而是想知道**哪一件現在不處理就會阻塞工作**。

**為何省時間／步驟**：從「巡檢每個通知／session」改成只巡檢 action-required subset，降低人工 context switching。

**Onboarding / distribution**：不要求使用者建立全新 dashboard；直接在原 Inbox 增加 Priority tab，保留既有工作方式。

**Automation / collaboration pattern**：priority 是一個可調整的 policy surface，而不是永久黑箱排序；使用者仍能定義來源 / filter。

**Pricing / business signal**：同一更新亦把 third-party app approvals 放入付費方案，顯示「agent/app 增多後的 attention + governance」正成為 workspace SaaS 的企業價值層。

**限制 / failure point**：Linear 的 notification graph 有 issue/review dependency semantics；`lobsterpulse` 目前跨 CLI provider 不一定能取得同等豐富的 blocker metadata，不能直接複製其黑箱 Priority 判斷。

**適合 Reese-max 吸收**：如果未來做 deeper triage，應把 `permission / user question / failure / completed-review` 等 action type 與 starvation age 分開，允許 deterministic filter/priority policy。

**不應照抄**：不要在來源 identity 尚未可靠時，讓 LLM 自動猜「哪個 agent 最重要」。

### CONFIRMED — Agent Watch — rechecked 2026-09-10

Source: https://agentwatch.dev/

Agent Watch 把 Claude Code、Codex、Gemini 的 `working / idle / waiting on you`、token/cost 與多通路 alerts 放在一個 dashboard。產品方向與 LobsterPulse 直接重疊。

**可移植原理**：`waiting on you` 應是跨 provider normalized state，而不是讓使用者自己解讀 terminal logs。

**不應過度解讀**：官網能力說明不能證明偵測準確率；尤其 permission/question detection 必須在各 CLI 真實版本做 runtime verification。

### CONFIRMED / PRODUCT LISTING — Baton — rechecked 2026-09-10

Source: https://www.producthunt.com/products/baton-2

Baton 的產品定位是同時 orchestrate Claude Code、Codex、OpenCode 與 terminal agents，以 git-isolated workspace 跑多 agent，並用 notification badge 標出「needs attention」，再把 diff/file review 放回同一 desktop surface。

**訊號**：監控本身逐漸 commodity；下一層價值是 `attention → jump to exact work context → review`，避免看見紅燈後仍要人工找是哪個 terminal/worktree。

**限制**：Product Hunt listing 能證明定位與公開功能，不代表使用者規模或效果。

---

## B. Adjacent Transferable Workflow — Priority as an Explicit Decision Surface

### CONFIRMED — Linear Inbox documentation — rechecked 2026-09-10

Source: https://linear.app/docs/inbox

Priority 可由預設規則選取，也可由使用者調整來源與 filter。這個設計比「用 AI 算一個神秘分數」更適合移植到本地 Agent supervisor：

`Normalized Event → Deterministic Action Class → User Filter / Policy → Priority Queue → Acknowledge / Snooze → Source Session`

對 Reese-max 的啟發不是增加另一個通知中心，而是把「action required」與「informational completion」分開。

**DO NOT COPY**：不要讓 snooze/ack 改寫 underlying agent state；UI acknowledgement 只是 attention state，不是 agent 已被處理的證明。

---

## C. Emerging Tool / Technology Possibility — Risk-tiered Agent Component Inspection

### CONFIRMED — Tenable CyberAgents Exchange AI Inspector — 2026-09-09

Source: https://www.tenable.com/blog/ai-agent-security-openai-tenable-cyberagents-exchange-inspector

Tenable 最新文章把 Agent component 的 attack surface明確列為：
- LLM instructions
- tool-chaining permissions
- prompt injection
- 傳統程式碼／暴露面以外的 agentic risk

並以 Tenable exposure detection + OpenAI GPT Cyber models + human oversight 組成 Inspector。官方目前仍寫 `Expect the Exchange Inspector to roll out in September`，所以「已全面上線」不可視為 CONFIRMED。

**JTBD**：使用第三方 agent / skill / MCP / playbook 前，需要知道它是不是值得信任，而且高風險元件需要比一般元件更深的檢查。

**省步驟 / reliability**：把人工翻 package / tool permissions / prompts 的工作變成一個 release/admission gate；安全證據可跟 artifact revision 綁定。

**Onboarding / distribution**：CyberAgents Exchange 保留 source repo transparency，Inspector 是 adoption 前的 review layer，而不是把元件包成黑箱 binary。

**Automation / AI pattern**：不是每個元件都使用同等昂貴的 frontier review；可依 risk tier 決定 deeper analysis，讓 security cost 與風險匹配。

**Business model signal**：Agent registries 的競爭開始從 catalog 數量移到「能不能放心導入」。這直接支持 `skill-foundry` 的 certification 定位。

**限制 / failure point**：官方仍是自家產品說明；沒有獨立資料證明 Inspector 的 false-positive / false-negative rate，也不能把 GPT Cyber model verdict 當安全證明。

**適合吸收**：`baseline deterministic scan for all → risk classification → optional deeper semantic/model review → human/policy disposition`。

**不應照抄**：不要讓高階 LLM review 取代 deterministic capability manifest、artifact hash、rules hash 或 fail-closed policy。

### CONFIRMED — CyberAgents Exchange current catalog — rechecked 2026-09-10

Sources:
- https://www.tenable.com/cyberagents-exchange
- https://exchange.tenable.com/

Exchange 已把 Agent、Skill、MCP server、Playbook 視為同一類可重用 component family，並直接連到 source repository。這支持 Reese-max 將 `SkillPackageManifest / SecurityAttestation` 的核心 schema 設計成未來可外推到 Agent/MCP 元件，而不是只寫死 Skill.md。

---

# New Releases / Secondary Signals

## CONFIRMED — Product Hunt AI coding agent category refresh — 2026-09-09

Source: https://www.producthunt.com/categories/ai-coding-agents

Product Hunt 9/9 的 AI coding agents 類別已包含數百個候選，市場入口同時存在 IDE、terminal-first、prompt-driven app builder。**產品設計訊號**是「另一個 generic agent launcher」的差異化門檻持續提高；LobsterPulse / Herdr 應聚焦 orchestration evidence、attention、policy、quota、replay，而不是和 IDE 大平台比 editor breadth。

## CONFIRMED RESEARCH — SePO — 2026-06-03

Source: https://arxiv.org/abs/2606.04465

SePO 把 prompt optimizer 自己的 system prompt 也納入演化，採 archive / stepping-stone 的 self-evolving prompt search。這對 `prompt-autoresearch` 是方法研究訊號，但不是立刻可搬的產品功能：現有 #3 已先處理更基本的 stochastic promotion / variance / holdout isolation；在 evaluation gate 未穩定前再讓 optimizer 自我修改 optimizer prompt，會放大 attribution 與 regression difficulty。

Classification: **LIKELY ADJACENT IDEA / RESEARCH ONLY**。

## CONFIRMED — Kiln Prompt Optimizer — 2026-02-23（代表性較舊模式）

Source: https://kiln.tech/blog/introducing_kiln_prompt_optimizer

Kiln 以使用者自己的 evals 驅動 prompt optimization。這再次支持 `eval-defined objective → candidate iteration → deploy` 的成熟產品模式；但其效果宣稱屬 vendor marketing，不作 Reese-max 預期效果證據。

---

# Community Pain Points

以下一律視為 **COMMUNITY_SIGNAL / anecdotal evidence**，不推論市場發生率。

### Agent Quest — 2026-08-23
Source: https://www.reddit.com/r/coolgithubprojects/comments/1vvzr0t/agent_quest_now_tells_you_when_claude_code_or/

作者將多 Agent 狀態從「看活動」進一步做成 working / waiting for input / finished / error，並用不同視覺與聲音通知。這支持 `needs attention` 是使用者實際感知的痛點，但不證明其偵測可靠度。

### Claude Code agent-view user report — 2026-05-12
Source: https://www.reddit.com/r/ClaudeAI/comments/1tbafuu/been_using_claude_codes_new_agent_view_since/

使用者描述多 terminal 最大摩擦不是看不到 agent，而是不知道哪個已卡在等待輸入，造成過度巡檢或過晚回應。屬單一使用者經驗。

### Agent-to-agent handoff discussion — 2026-09-08
Source: https://www.reddit.com/r/ClaudeCode/comments/1wb0yxk/wait_codex_can_now_invoke_claude_code_sessions/

近期社群開始直接把 Codex/Claude 等 agent 串成互相呼叫與 review 流程；這是一個 workflow direction signal，但目前多為使用者自建規則／CLI glue，且成本、授權、transcript ownership 與失敗恢復契約沒有一致標準。因此只保留研究，不立案。

---

# Opportunity Score

評分為 portfolio heuristic，不是假裝統計精準度。Implementation Effort 與 Security/Privacy/Cost Risk 以「越容易／越低風險越高分」折算。

| Candidate | Pain | Fit | Novelty | Evidence | Reuse | Effort | Risk | Score | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| LobsterPulse Action-Class / Attention Triage refinement | 9 | 10 | 4 | 9 | 8 | 8 | 8 | **84** | KEEP IN RESEARCH；current waiting list 已存在，且 #3 reliability blocker 先行 |
| Skill Foundry risk-tiered Inspector staging | 9 | 10 | 4 | 10 | 10 | 7 | 7 | **87** | UPDATE RADAR ONLY；stable fingerprint 已被 #3 覆蓋 |
| Cross-agent Handoff Receipt for Herdr/autodev | 8 | 8 | 6 | 5 | 9 | 6 | 6 | **74** | RESEARCH ONLY；主要證據仍偏 community / workflow signal |
| Prompt optimizer self-evolution / optimizer-of-optimizer | 7 | 8 | 6 | 7 | 7 | 4 | 5 | **69** | DEFER；先完成 prompt-autoresearch #3 stability gate |
| Soundbox voice-trigger / soundboard mode | 4 | 4 | 7 | 5 | 3 | 7 | 8 | **54** | REJECT；偏離 mobile local music library 主 JTBD |

沒有一個**新且不重複**候選達到正式立案門檻。

---

# Adjacent Ideas

1. **Action Class before Priority Score**：先把 agent 事件 deterministic 分成 `PERMISSION_REQUIRED / QUESTION / FAILURE / COMPLETED_REVIEW / INFORMATIONAL`，再排序；比直接餵 LLM 算重要性更容易驗證。
2. **Attention receipt**：若未來 LobsterPulse 加 ack/snooze，保存 `event identity + state revision + attention disposition`，但絕不把 ack 當 agent 已解除阻塞。
3. **Risk-tiered certification cost**：Skill Foundry 全 candidate 跑 deterministic baseline scan；只有 high-risk / ambiguous findings 才進較昂貴語義 review。
4. **Component family manifest**：Skill Foundry 的 manifest 可預留 `component_kind = skill|agent|mcp|playbook`，但不在本輪擴大實作範圍。
5. **Agent handoff as candidate state**：跨 Claude/Codex handoff 若未來立案，應傳 typed task/evidence/permission/cost state，不把另一個 agent 的 transcript 當自動授權。
6. **Optimizer self-change quarantine**：Prompt optimizer 若修改自己的 evaluator/generator prompt，應視為 evaluator regime change，舊 noise profile / holdout claim 需 stale。

---

# Opportunity Map — 35 Product Repositories

| Product | Market Category | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| `cf-ai-router` | multi-provider AI gateway | truthful provider/model lifecycle + cost gate | planned-EOL canary before runtime break | owner-controlled free/subscription routing receipts | lifecycle registry reusable by other products | enterprise breadth / residency feature without user need |
| `soundbox-offline` | local-first offline music PWA | reliable local playback/import/backup | safer mobile transfer/recovery | no-account no-cloud owned-music workflow | LAN direct import already #3 | streaming catalog/social/soundboard category creep |
| `police-exam-archive` | exam archive / practice data | complete questions/images/provenance | mobile source fidelity | traceable official exam corpus | capability-level learning evidence after data quality | generic AI tutor before source completeness |
| `skill-foundry` | Agent Skill certification / promotion | exact artifact/runtime/security evidence | risk-tiered inspection cost | evidence-gated promotion across quality/runtime/security | component-family manifest | marketplace breadth or LLM-only trust score |
| `prompt-autoresearch` | autonomous prompt optimization | reproducible eval + budget + holdout | variance-aware promotion | inspectable prompt evolution evidence | optimizer self-change quarantine | unbounded self-evolution before evaluation reliability |
| `lobsterpulse` | multi-agent desktop monitor | truthful provider state / safe config integration | action-type attention triage | local quota + agent state + rules/replay | exact-context jump from attention item | generic AI ranking or another heavy IDE |
| `tick-stock-panel` | market dashboard | timely source freshness + clear delayed/live semantics | actionable but sourced summaries | compact evidence-first watch panel | event-to-position relevance | autonomous trading / unsupported financial advice |
| `clinical-scribe-worker` | clinical documentation assistant | clinician review + provenance + privacy | EHR/workflow handoff | bounded documentation not diagnosis | specialty templates with explicit evidence | autonomous clinical decision/action platform |
| `adng-memory` | cross-repo operational memory | origin/lifecycle/deletion contract | poisoning-aware retrieval | receipts for accepted durable state | component security / memory admission linkage | more memory = more trust |
| `avatar-vfo` | persistent AI persona / virtual relationship | continuity + exact behavior regression | trajectory recall evidence | state-machine explainability if it proves value | migration non-inferiority gates | more psychological dimensions without ablation evidence |
| `note-filler` | automated note/content filling | explicit input/output provenance | reproducible template completion | bounded structured transformation | human preview/diff before fill | opaque auto-write into unknown documents |
| `taiwan-intel-dashboard` | public intelligence dashboard | source truth / operating status / summary integrity | deterministic degradation | public evidence + provenance | outbound evidence interfaces only after truth layer | more AI surface before #17/#18 reliability |
| `cyber-prep-coach` | cybersecurity exam coach | explanation calibration + exam fidelity | mastery evidence | source-grounded coaching | portable capability record later | broader tutor chat before SME gold-set gate |
| `UkePack` | ukulele/music utility | core mobile/offline usability | fast song/practice workflow | focused musician toolkit | local media handoff primitives | generic social/music streaming suite |
| `autodev-ng` | autonomous software-development orchestration | locks/receipts/review/runtime evidence | cross-agent handoff clarity | policy-driven multi-agent repair board | typed HandoffReceipt | invisible autonomous escalation across permissions |
| `ai-novel-workstation` | long-form AI writing workstation | continuity / context / budget receipts | explainable selective context | unattended production with checkpoints | behavior migration gates | SaaS credit UX promises it cannot enforce |
| `herdr-skills` | multi-agent supervision / reflective skills | move-safe identity + run-state truth | handoff/recovery evidence | privacy-preserving reflective policy | typed inter-agent transfer | transcript-as-authority or unbounded agent recursion |
| `video-timeline-pipeline` | multimodal video intelligence | source/timeline/cost truth | direct NLE handoff | evidence-backed paper cut | cut receipts into downstream editors | full NLE/editor scope |
| `chatgpt-dual-pipeline` | public internship-notes site | canonical content / de-identification | source-safe publishing | structured learning notes | improved evidence navigation | old slug-driven feature assumptions; not an AI pipeline |
| `claude-mem` | coding-agent memory | provenance / admission / stale invalidation | origin-preserving summaries | local inspectable memory | adng-memory contract consumer | auto-trust summarized external observations |
| `lplrs-judicial-sync` | judicial data synchronization | exact authority revision + removal state | source-span handoff | body-free authority receipts | legal AI consumers | good-law/status conclusions from mere source identity |
| `internship-notes-sites-mirror` | generated notes mirror | mirror-only ownership truth | deterministic sync | low-maintenance public mirror | integrity receipt | editing mirror as canonical content |
| `MaterialYouNewTab` | browser new-tab/workspace extension | privacy / local workspace basics | capture-preview-restore | versioned browser session workspace | restore diff / undo | continuous silent tab surveillance / cloud account bloat |
| `taichung-police-intel` | public government/police policy intelligence | verified public evidence + source health | profile/live navigation | official evidence lifecycle | read-only Evidence MCP already #15 | operational policing / private data / write MCP |
| `ninax-line-hermes` | LINE AI video summarization assistant | webhook revision/dedupe truth | stale-job suppression | evidence-checked media second pass | cross-agent handoff only after input lifecycle | exactly-once claims LINE cannot guarantee |
| `voice-actress` | voice/practice learning product | task-mode separation + reliable media | mobile feedback loop | focused guided practice | competency evidence | generic AI tutor/chat everywhere |
| `project-doctor-web` | clinical education / virtual patient | case truth + red flags + provenance | rubric-linked debrief | CaseSpec-driven reproducible simulation | competence replay | free-form model-generated clinical truth |
| `92-duty-scheduler` | staff/duty scheduling | auth + deterministic rule correctness | preview/conflict checking | PolicySpec Rule Studio | policy replay receipts | LLM directly deciding duty eligibility |
| `flux-image-gen` | multi-provider AI image generation/editing | output/provider/version truth | lineage + provenance | Content Credentials-aware receipt | downstream creative workflow handoff | provenance-as-truth detector |
| `neciken-summer-poem` | creative/public poem experience | simple accessible presentation | mobile/share polish | focused authored experience | provenance for generated variants if ever needed | agent/SaaS complexity |
| `minideck` | presentation generation/sharing | share/version privacy | interoperable export | narrow verified deck workflow | claim/source receipts | public access to hidden historical drafts |
| `ppt-studio` | AI presentation studio | local auth/deployment boundary | source/claim traceability | editable evidence-backed slides | Sheets/mobile/Slack only after core trust | enterprise collaboration suite breadth |
| `police-exam-practice` | police exam practice | official mode/source fidelity | explainable mastery | exam-specific structured practice | verified capability profile | hints leaking into exam simulation |
| `exam-archive` | static exam archive | fast complete data access | chunk/lazy-load + provenance | lightweight searchable archive | shared canonical exam data layer | duplicate source-of-truth maintenance |
| `cf-mcp-server` | Cloudflare MCP operations server | strong OAuth/authz + exact-target confirmation | capability receipts | safe bounded Cloudflare operations | reusable permission broker pattern | broad autonomous destructive tools / token passthrough |

---

# Top 10 Cross-Portfolio Ideas

1. **Action Class Contract** — normalize `needs user / permission / failure / review / info` before any priority score.
2. **Typed Handoff Receipt** — agent-to-agent transfer carries task revision, evidence, permission scope, budget and current owner; transcript alone is not authority.
3. **Risk-tiered Evaluation Budget** — cheap deterministic checks for all; expensive semantic/frontier checks only for ambiguous/high-risk cases.
4. **Component Security Attestation** — Skill/Agent/MCP/Playbook share artifact identity + capabilities + scanner/rules evidence.
5. **Behavior Migration Gate** — model/prompt/memory/runtime upgrades require paired replay, not just API success.
6. **Canonical Evidence Handoff** — stop manual copy/paste into next tool; export typed evidence plus source locator/receipt.
7. **Candidate ≠ Active** — captured/imported/generated state must preview/validate before promotion.
8. **Unknown is a first-class state** — missing provider/source/security/billing evidence cannot silently become success/zero/no-event.
9. **Versioned User Work State** — browser tabs, cuts, policies, cases, writing context and memory all benefit from exact version + diff + restore.
10. **Simplify before expand** — repositories with unresolved P0/P1 truth/auth blockers should not add broad AI or distribution surfaces first.

---

# Ideas Rejected / Deferred

## 1. New LobsterPulse “Priority Inbox” Issue — DEFER / DUPLICATE-ADJACENT
原因：current code 已有 waiting list、oldest-first starvation order、waiting event/sounds/rules。市場訊號支持 refinement，但不是一個全新的 capability；且 #3 provider activation reliability 更優先。

## 2. Second Skill Foundry “AI Inspector” Issue — REJECT AS DUPLICATE
原因：`skill-foundry #3` 已覆蓋 package security manifest、static scan、capability declaration、SecurityAttestation、semantic review與 promotion separation。9/9 Tenable 內容只增加 staged/risk-tiered review 的強證據。

## 3. Prompt optimizer self-evolves itself — DEFER
原因：`prompt-autoresearch #3` 尚在處理 promotion variance / holdout isolation。先把 evaluator reliability 做穩，再研究 optimizer-of-optimizer，否則 attribution 更差。

## 4. Soundbox voice-trigger / soundboard mode — REJECT
原因：雖有 local-audio/creator 工具市場，但與聲匣目前「手機優先、owned music、offline library」的 primary JTBD 不同，會稀釋產品。

## 5. Generic cross-agent autonomous messaging — RESEARCH ONLY
原因：9/8 社群訊號有趣，但正式 API / permission / transcript ownership / failure semantics 證據不足；先以 typed handoff contract 觀察，不建立 autonomous agent-to-agent write surface。

---

# Issue Mapping / Duplicate & Lock Coordination

| Product | Candidate | Existing Issue / State | This Round |
|---|---|---|---|
| `lobsterpulse` | Attention / priority triage | waiting list/rules already in code；#3 reliability blocker | Central radar only; no new Issue |
| `skill-foundry` | risk-tiered Agent component inspection | #3 Package Security Attestation | Central radar only; no duplicate update required |
| `prompt-autoresearch` | self-evolving optimizer | #3 variance-aware promotion | Research watch only |
| `herdr-skills` / `autodev-ng` | typed cross-agent handoff | no sufficiently strong new standalone evidence this round | Research list only |
| `cf-ai-router` | model lifecycle | #4 created in r3 | No duplicate |

本輪未認領、更新或搶奪任何 `github-issue-lock:v1` 鎖。沒有新 Issue，因此不存在與其他 worker 的 ownership collision。

---

# Sources

## CONFIRMED / official or first-party
- 2026-09-03 — Linear Priority Inbox: https://linear.app/changelog/2026-09-03-priority-inbox
- checked 2026-09-10 — Linear Inbox docs: https://linear.app/docs/inbox
- 2026-09-09 — Tenable CyberAgents Exchange AI Inspector: https://www.tenable.com/blog/ai-agent-security-openai-tenable-cyberagents-exchange-inspector
- 2026-09-03 — Tenable AI Inspector announcement: https://www.tenable.com/press-releases/tenable-uses-openai-gpt-cyber-models-to-help-defenders-inspect-community-built-ai-components
- checked 2026-09-10 — CyberAgents Exchange: https://www.tenable.com/cyberagents-exchange and https://exchange.tenable.com/
- checked 2026-09-10 — Agent Watch: https://agentwatch.dev/
- checked 2026-09-10 — Baton Product Hunt listing: https://www.producthunt.com/products/baton-2
- 2026-09-09 category refresh — Product Hunt AI coding agents: https://www.producthunt.com/categories/ai-coding-agents
- 2026-06-03 — SePO research: https://arxiv.org/abs/2606.04465
- 2026-02-23 — Kiln Prompt Optimizer: https://kiln.tech/blog/introducing_kiln_prompt_optimizer

## COMMUNITY_SIGNAL / anecdotal only
- 2026-08-23 — Agent Quest needs-attention update: https://www.reddit.com/r/coolgithubprojects/comments/1vvzr0t/agent_quest_now_tells_you_when_claude_code_or/
- 2026-05-12 — Claude Code agent-view user report: https://www.reddit.com/r/ClaudeAI/comments/1tbafuu/been_using_claude_codes_new_agent_view_since/
- 2026-09-08 — Codex ↔ Claude agent-to-agent discussion: https://www.reddit.com/r/ClaudeCode/comments/1wb0yxk/wait_codex_can_now_invoke_claude_code_sessions/

---

# What Changed Since Last Radar (r3 → r4)

1. **沒有新增高價值 Issue。** r3 的 `cf-ai-router #4` lifecycle opportunity 仍成立；本輪沒有新的非重複 ≥90 候選。
2. **Tenable 9/9 補充了 Agent component security 的具體 review 模式**：attack surface 明確涵蓋 instructions / tool chaining / prompt injection，並更支持 baseline + risk-tier deeper inspection；但與 `skill-foundry #3` 重疊，因此只更新研究證據。
3. **Linear Priority Inbox + Baton / Agent Watch 形成更清楚的「attention is the product」市場訊號**；但 `lobsterpulse` 本身已經有 waiting-for-user list、starvation order、sounds/rules，因此 generic Attention Inbox 不再算新能力，應等待 #3 reliability 底層更穩後再評估 action-class refinement。
4. **社群開始出現更多 agent-to-agent direct handoff / orchestration 討論**，但證據仍以 anecdotal workflow 為主，尚不足建立跨 Portfolio autonomous handoff feature。
5. 本輪新增的設計原則：**「Priority 不是另一個通知分數，而是對『誰在等人、為什麼等、處理後要回到哪個 exact context』的可驗證決策面。」** 同時，component security 應採 **`Baseline deterministic inspection → Risk classification → Deeper review only when needed → Human/Policy disposition → Exact artifact receipt`**。
