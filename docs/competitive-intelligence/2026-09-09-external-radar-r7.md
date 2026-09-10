# External Competitive / Product / Workflow Inspiration Radar — 2026-09-09 r7

## Executive Summary

本輪主要資料來源為 GitHub 之外的公開網路，並以 GitHub 只作 Reese-max portfolio 現況、近期變更、Issue/PR duplicate 與協調證據。

本輪新增一個達正式立案門檻的高價值機會：

- **Reese-max/lplrs-judicial-sync #3** — `[Competitive Inspiration][RESEARCH_REQUIRED] 建立 AuthorityReceipt / SourceSpan Contract，讓下游法律 AI 可追溯精確判決版本與移除狀態`
- Opportunity Score: **92/100**
- Stable fingerprint: `lplrs-judicial-sync + daily erasable judicial corpus + downstream importer + no content-addressed authority receipt/source-span locator/current-vs-removed lifecycle contract for AI/research consumers`

市場訊號已足以支持一個更明確的跨產品判斷：**法律 AI 的競爭正在從「有沒有 citation」轉成「citation 是否能回到 exact authority revision / exact supporting span，而且上游來源變更、移除或不可用時，舊證據會正確失效」。**

這不代表 Reese-max 應複製 Westlaw / Lexis / KeyCite；更適合的方向是把 `lplrs-judicial-sync` 做成可被下游工具重用的 judicial authority substrate。

---

## Scope & Method

### Portfolio scope
35 個 Reese-max 擁有、未封存、可視為產品／產品基礎設施的 repositories：

`exam-archive`, `police-exam-practice`, `police-exam-archive`, `92-duty-scheduler`, `UkePack`, `ppt-studio`, `voice-actress`, `taiwan-intel-dashboard`, `autodev-ng`, `flux-image-gen`, `claude-mem`, `lobsterpulse`, `prompt-autoresearch`, `neciken-summer-poem`, `note-filler`, `lplrs-judicial-sync`, `adng-memory`, `cyber-prep-coach`, `cf-ai-router`, `avatar-vfo`, `project-doctor-web`, `minideck`, `chatgpt-dual-pipeline`, `internship-notes-sites-mirror`, `taichung-police-intel`, `soundbox-offline`, `skill-foundry`, `video-timeline-pipeline`, `ai-novel-workstation`, `clinical-scribe-worker`, `MaterialYouNewTab`, `cf-mcp-server`, `tick-stock-panel`, `herdr-skills`, `ninax-line-hermes`.

### GitHub pre-scan
- 重新檢查 repositories 與近期 commits。
- 在 r6 之後，沒有看到上述產品 repo 的新產品程式／文件 commit；r6 本身仍是最新 central radar baseline。
- 針對 `lplrs-judicial-sync` 讀取 README、近期 commit、Issue #1、PR #2、Issue comments，並搜尋 open/closed Issues、all-state PR 與 `github-issue-lock:v1`。
- 本輪新 fingerprint 與 #1 / PR #2 不重複：#1/#2 解 **erasable body storage / historical deletion**；本輪 #3 解 **body-free authority identity / exact source-span / downstream lifecycle contract**。

### External research priority
本輪以 2026-08～2026-09 的法律 AI / legal-data infrastructure 為主，交叉掃描：
- Thomson Reuters / CoCounsel / Westlaw
- Google Gemini Enterprise for Legal
- Lexis+ AI / Shepard’s
- Moonlit legal data API / MCP
- Clearbrief
- practitioner community discussions

社群內容只作 failure-mode / workflow friction 訊號，不當作發生率或產品成效統計。

---

# External Signals

## A. Direct competitor / major legal-product releases

### A1 — CONFIRMED — Thomson Reuters CoCounsel Legal / Westlaw verification workflow
**Published:** 2026-09-08  
Source: https://www.thomsonreuters.com/en/press-releases/2026/september/thomson-reuters-unveils-new-ai-powered-capabilities-for-legal-professionals

近期能力把「回答／草擬」與「驗證 authority」放進同一工作流：
- Verbatim Extraction 回傳 source text 並可回到精確 highlighted passage；
- Deep Research Verify 對 assertion 顯示 supporting passages，並指出缺少支持的位置；
- Brief Builder 連接 research → drafting → authority validation；
- citation 可以回到 Westlaw / Practical Law 原始 authority。

**JTBD**
法律研究者不必從 AI 產出的句子重新人工全文搜尋，才能確認「到底是哪一段來源支持這句話」。

**Why fewer steps / more reliable**
`AI claim → exact source passage → full authority` 取代 `AI claim → 自己猜搜尋字串 → 開多個結果 → 人工比對段落`。

**Onboarding / distribution**
能力直接嵌入既有 legal research / drafting surface，而不是要求使用者另開一個 verification tool。

**Automation / provenance pattern**
主張、citation、authority passage 與完整 source 可連成一條可核對鏈。

**Business-model signal**
高價法律資料的價值正在從「資料庫可搜尋」延伸到「資料能安全餵給 AI 並保持可驗證」。不引用供應商宣稱的效率百分比作效果證據。

**Failure / limitation**
vendor-controlled corpus / workflow 與台灣司法院資料不同；不能因其 verification 成功就推定 Reese-max 的同步資料具同等 legal status intelligence。

**Adopt**
exact authority revision / source span / lifecycle receipt。

**Do not copy**
不要複製完整 legal research SaaS，也不要把 citation existence 直接升級成 `good law`。

### A2 — CONFIRMED — Google Gemini Enterprise for Legal
**Published:** 2026-08-25  
Source: https://cloud.google.com/blog/topics/public-sector/gemini-enterprise-for-legal

Google 將法律 AI 拆成 legal skills、secure connectors/MCP、agents、governance、verifiable grounding、traceable citations。既有 DMS / case repository 的權限可沿用，而不是為 AI 另做大量 export / re-upload。

**JTBD**
在既有 firm data / matter repository 上使用 AI，不要再建立另一個資料孤島。

**Transferable principle**
AI 是受治理資料的 consumer，不是新的 authority owner。

**Adjacent fit**
對 Reese-max，不是先做 Gemini connector，而是先讓 judicial-data layer 本身有穩定 authority / revision / lifecycle contract，未來任意 consumer 才能安全重用。

### A3 — CONFIRMED — Lexis+ AI source references / Shepard’s separation
**Current docs rechecked:** 2026-09-09  
Source: https://supportcenter.lexisnexis.com/app/answers/answer_view/a_id/1127420/~/viewing-sources-in-lexis%2B-ai

Lexis+ AI 的生成回答會附 source references，可展開 supporting excerpt 並進入完整 authority；而 Shepard’s 是另一個 authority status / treatment layer。

**Key product lesson**
「可回到來源」與「知道來源目前法律效力」必須分開。這直接形成 `lplrs-judicial-sync` 的 DO NOT COPY 邊界。

---

## B. Adjacent transferable design / workflow

### B1 — CONFIRMED — Moonlit 從 legal portal 轉成 data infrastructure
**Published:** 2026-08-17  
Source: https://www.moonlit.ai/blog/q2-2026-product-wrap-up

Moonlit 公開把方向描述成從「需要登入的平台」往「其他產品可建立在上面的 legal-data infrastructure」移動，以 API + MCP 對外提供同一 corpus。

Current MCP docs: https://docs.moonlit.ai/docs/mcp

目前 MCP surface 為少量 curated read-only tools，底層則強調 normalized structure、reference relationships 與 version-aware data。

**JTBD**
讓法律資料直接進入使用者既有 AI / research workflow，而不是每次回 portal 複製貼上。

**Distribution signal**
trusted data layer 本身成為產品；UI 只是其中一個 consumer。

**Pricing signal**
其 MCP / legal-data access 也作為付費入口，說明「可信資料分發」可形成獨立產品價值。

**Adopt**
先建立 canonical legal-data contract；未來 Web/API/MCP 共用同一 authority truth。

**Do not copy**
本輪不替 lplrs 直接建立 public MCP；現有 erasure boundary 尚未完成，而且 portfolio 已有 `taichung-police-intel #15` 作 read-only Evidence MCP pattern。

### B2 — CONFIRMED — Clearbrief：verification 回到 authoring surface
**Current capability rechecked:** 2026-09-09  
Source: https://clearbrief.com/

其核心 interaction 是把一句主張和 supporting source 對起來，而且直接在 Word drafting flow 裡完成。

**Transferable principle**
`source_url` 太粗；真正能降低人工比對步驟的是 stable span / paragraph locator + exact source revision。

---

## C. Emerging tool / technology possibility

### C1 — LIKELY / EMERGING — AuthorityReceipt 成為跨 Reese-max 法律產品共用 primitive

本輪從 CoCounsel、Google、Lexis、Moonlit、Clearbrief 交叉後得到的新架構假設：

`Authority Identity → Exact Revision → SourceSpan → Lifecycle → CitationReceipt`

它不是一個新 AI 模型，而是一個資料契約。若建立在 `lplrs-judicial-sync`：

`Judicial JList/JDoc → Approved Erasable Body Store → Body-free AuthorityReceipt → Downstream DB/Index → Consumer → CitationReceipt`

可被以下產品重用：
- `note-filler`：claim review / source support；
- `voice-actress`：法律申論的 verified law/source evidence；
- 未來司法搜尋／研究 UI；
- read-only AI retrieval / MCP（後續另行審查）。

這比每個 consumer 自己存一份 `source_url + excerpt` 更能避免 source drift / removal / stale citation。

### C2 — COMMUNITY_SIGNAL — 法律實務仍將 citation verification 視為人工責任
近期法律從業者討論持續出現「AI citation / case 必須人工核對」與虛假引用後果的案例討論。這些只作 anecdotal failure-mode evidence，不代表某法律 AI 的錯誤率，也不使用社群自報數字作產品門檻。

Representative discussions:
- https://www.reddit.com/r/law/
- https://www.reddit.com/r/Lawyertalk/
- https://www.reddit.com/r/legaltech/

產品含義不是「AI 一律不可信」，而是 verification surface 應能回答 exact source identity，而不是只顯示一個無法核對的引用字串。

---

# New Releases

| Date | Product / source | New capability / signal | Evidence class | Portfolio relevance |
|---|---|---|---|---|
| 2026-09-08 | Thomson Reuters / CoCounsel Legal | Verbatim Extraction、Deep Research Verify、authority-linked drafting | CONFIRMED | `lplrs-judicial-sync`, `note-filler`, `voice-actress`, `ppt-studio` |
| 2026-08-25 | Google Gemini Enterprise for Legal | governed legal skills/connectors + verifiable grounding / traceable citations | CONFIRMED | legal-data substrate / AI distribution |
| 2026-08-17 | Moonlit | legal product → infrastructure / API + MCP | CONFIRMED | `lplrs-judicial-sync`, future Evidence MCP consumers |
| 2026-09-09 recheck | Lexis+ AI | inline source excerpts / full-source navigation, status layer separate | CONFIRMED | source-span vs legal-validity boundary |
| 2026-09-09 recheck | Clearbrief | sentence/claim → supporting evidence inside Word | CONFIRMED | claim-level source locator pattern |

---

# Community Pain Points

> COMMUNITY_SIGNAL only. No prevalence claim.

1. **Citation verification remains a manual burden.** Even when AI returns a plausible authority string, practitioners still need to verify existence, holding, context and applicability.
2. **Context loss between tools.** Legal users moving from DMS/research system → AI → document editor still face export / upload / copy-paste friction unless source identity travels with the content.
3. **A citation can exist but fail to support the claim.** A useful product must distinguish `source exists`, `span supports`, `authority status`, and `legal interpretation`.
4. **Removal / source drift is harder than initial retrieval.** If an upstream document changes/disappears, downstream cached excerpts and AI answers can look current unless lifecycle state is explicit.

---

# Adjacent Ideas

1. **AuthorityReceipt library before MCP.** First define source identity/lifecycle once; later Web/API/MCP consumers reuse it.
2. **ClaimEvidence interop.** `note-filler #3` can eventually consume `AuthorityReceipt + SourceSpanRef` rather than storing a free-form legal URL/excerpt.
3. **Citation stale invalidation.** Adapt portfolio-wide exact-head / stale-receipt pattern to legal source revisions.
4. **Erasure-aware provenance.** Provenance must support evidence of deletion without retaining the deleted body itself.
5. **Legal source gap semantics.** `SOURCE_UNAVAILABLE` / `PARTIAL_SYNC` must never become `NO_AUTHORITY_FOUND` automatically.
6. **Consumer capability declaration.** Future external AI connector should expose only body/status/span operations that match storage and permission policy.

---

# Opportunity Map — 35 Unarchived Reese-max Repositories

| Repository | Market category | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| exam-archive | exam archive/search | source fidelity, stable question identity | faster retrieval / filters | source provenance | review queue / evidence locators | generated fake official questions |
| police-exam-practice | police exam practice | deterministic grading / persistence | adaptive review | official-exam fidelity | learner mastery model | opaque pass-probability prediction |
| police-exam-archive | official exam corpus + practice | stable source/question IDs | deadline-aware review | official-source traceability | read-only AI retrieval over canonical questions | replacing official questions with generated content |
| 92-duty-scheduler | constrained scheduling | deterministic hard constraints | repair/preview workflow | auditable Rule Studio | PolicySpec import / impact diff | black-box autonomous scheduling |
| UkePack | music practice/teaching | reliable chords/audio | fewer practice-tool jumps | offline/teacher-friendly toolkit | tuner/metronome/tone analysis integration | broad DAW feature sprawl |
| ppt-studio | AI presentation authoring | editable export / stable render | source-backed generation | slide/claim provenance | source-context connectors | engagement/collaboration SaaS sprawl |
| voice-actress | exam / essay grading | grading provenance | evidence-linked feedback | criterion→answer span→legal source | reusable AuthorityReceipt consumer | opaque single-score grading |
| taiwan-intel-dashboard | public intelligence dashboard | source health / truthful operating state | evidence-first brief | explicit gaps / canonical event truth | EvidenceEnvelope distribution after truth gates | AI features over broken source truth |
| autodev-ng | autonomous dev control plane | exact execution identity / permissions | attention & steering UX | action receipts | cross-agent attention inbox | silent autonomous mutations |
| flux-image-gen | image generation/edit | output/history integrity | provenance UX | verifiable generation/edit receipt | C2PA inspection/preservation | “credential absent = human-made” badge |
| claude-mem | developer/agent memory | scoped durable state | stale/deletion semantics | local memory substrate | continuity / activation receipts | indiscriminate retention |
| lobsterpulse | multi-agent monitor | accurate agent state | needs-attention ranking | control-center UX | replay/action receipts | status dashboard without actionability |
| prompt-autoresearch | prompt optimizer | evidence-gated promotion | variance-aware evaluation | reproducible promotion receipts | behavior migration gates | single lucky-run promotion |
| neciken-summer-poem | contest-aware writing | current rules/source | pre-submit revalidation | rule-drift receipt | contest opportunity feed | autonomous submission/payment |
| note-filler | evidence-backed note augmentation | immutable original + source support | human claim review | claim-level evidence ledger | AuthorityReceipt/SourceSpan consumer | auto-promoting unsupported additions |
| lplrs-judicial-sync | judicial-data ingestion/lifecycle | complete + erasable source sync | downstream source identity | AuthorityReceipt / SourceSpan / lifecycle | future read-only legal data layer | legal-validity / precedent inference |
| adng-memory | cross-repo operational memory | ownership / freshness | activation & deletion contract | temporal state lineage | evidence-linked state graph | vector-DB-first expansion |
| cyber-prep-coach | iPAS certification prep | official exam spec / question truth | mastery-driven next task | local-first explainable study | trusted external-AI study source | pass-rate prediction |
| cf-ai-router | AI gateway/router | exact provider/model/cost policy | task reliability routing | evidence-backed deterministic profiles | local inference federation | opaque billable dynamic routing |
| avatar-vfo | persona / roleplay engine | identity / state consistency | long-horizon continuity testing | explainable state + ablation | structured memory layers | therapeutic/psychological efficacy claims |
| project-doctor-web | clinical education simulation | fact provenance / safety | CaseSpec + debrief | controlled virtual patient | educator authoring | autonomous diagnosis/treatment |
| minideck | lightweight presentation sharing | explicit publication boundary | preview/publish clarity | draft vs published head | provenance later | full workspace/collaboration SaaS |
| chatgpt-dual-pipeline | multi-model comparison/pipeline | exact model/input identity | replay/comparison | complementary reviewer evidence | migration/non-inferiority harness | “two models agree = truth” |
| internship-notes-sites-mirror | notes/site mirror | freshness / complete capture | changed-content diff | archival provenance | extraction/search index | access-control bypass |
| taichung-police-intel | public intelligence monitor | canonical evidence + source health | role/profile prioritization | evidence-first public intel | read-only Evidence MCP | operational policing / private-data expansion |
| soundbox-offline | local/offline audio | reliable offline import/playback | cross-device import | no-cloud local ownership | QR/browser same-LAN transfer | account-first cloud library |
| skill-foundry | agent-skill certification | exact artifact identity | runtime + security attestations | evidence-gated promotion | trusted skill consumption gateway | “signed = secure” claims |
| video-timeline-pipeline | video intelligence | temporal evidence / source locator | targeted evidence escalation | exact multimodal occurrence receipts | agentic/local rescan | opaque summary-only pipeline |
| ai-novel-workstation | long-form AI writing | resumable bounded production | context/cost preflight | production evidence manifests | behavior migration evaluation | uncontrolled model/context swaps |
| clinical-scribe-worker | clinical documentation | source fidelity / auth / clinician control | specialty-scoped validation | validation evidence packs | workflow-specific dictation packs | diagnostic autonomy |
| MaterialYouNewTab | local new-tab dashboard | fast/private/offline | local canonical + optional sync | private customizable start surface | opt-in share/sync | account-required cloud product |
| cf-mcp-server | Cloudflare MCP/deploy control | exact target + confirmation | staged rollout safety | deployment receipts | health-gated canary promotion | all-or-nothing blind deployment |
| tick-stock-panel | market research/backtest | coverage/freshness/point-in-time truth | explicit strategy authoring | NL→typed rule preview | capability-aware screener | investment-advice/trading autonomy |
| herdr-skills | reusable multi-agent skills | versioned runtime compatibility | certification/reuse workflow | portable evaluated task packages | side-effect/capability declarations | unverified marketplace installs |
| ninax-line-hermes | LINE agent/video assistant | webhook lifecycle / exact input revision | stale-job invalidation | evidence-backed mobile summary | mobile control/review | immutable-message assumption |

---

# Opportunity Score — New Candidate

## lplrs-judicial-sync — AuthorityReceipt / SourceSpan

| Dimension | Score | Rationale |
|---|---:|---|
| User Pain | 9/10 | downstream verifier currently must reconstruct source/version/span manually |
| Strategic Fit | 10/10 | this repo already owns judicial acquisition/removal lifecycle |
| Novelty | 8/10 | verification is established externally; erasure-aware authority contract is portfolio-specific value |
| Evidence Strength | 10/10 | TR + Google + Lexis + Moonlit + Clearbrief cross-validation |
| Reuse Potential | 9/10 | legal notes, essay grading, future retrieval / MCP |
| Implementation Effort | 7/10 | schema/fixture low-medium; production resolver blocked on storage migration |
| Security/Privacy/Cost Risk | 5/10 | erasure/provenance tension is material; no new provider cost required for research MVV |

**Overall heuristic: 92/100.**

---

# Top 10 Cross-Portfolio Ideas

1. **Authority / Evidence Receipt interoperability** — standardize `source identity + revision + exact locator + lifecycle` across judicial, government-intel, notes, essay grading and presentation provenance.
2. **Stale-on-source-change as a hard primitive** — source revision drift invalidates prior claim/citation approvals instead of silently inheriting them.
3. **Erasure-aware provenance** — preserve proof that something was removed without preserving the removed body.
4. **AI as consumer, not truth owner** — model output carries source receipts; canonical truth remains in governed data layer.
5. **Exact-span verification UX** — jump from claim/grade/slide/intel card directly to the supporting passage or timestamp.
6. **Distribution after truth** — API/MCP should project a trusted canonical layer, not create another summary/data truth.
7. **Source failure ≠ absence** — standardize `FAILED/PARTIAL/STALE/UNKNOWN` semantics across all evidence products.
8. **Separate source existence from source validity/effect** — useful for legal authority, model compatibility, skill security, publication freshness and clinical evidence.
9. **Typed consumer contracts** — expose narrow task-level operations instead of arbitrary query/URL/filesystem surfaces.
10. **Provenance-first simplification** — delete duplicate per-product citation schemas where a common receipt can serve multiple consumers.

---

# Ideas Rejected / Deferred

1. **REJECT — Build a Taiwan KeyCite/Shepard’s clone now.** Current Judicial sync does not establish later treatment, precedential weight or `good law` status.
2. **DEFER — Public MCP directly from lplrs.** First solve erasable storage and authority contract. Portfolio already has a separate Evidence MCP research pattern.
3. **REJECT — Keep full removed judgments in Git for auditability.** This conflicts with #1 and the repository’s own removal requirement.
4. **REJECT — Preserve unlimited removed-body excerpts in provenance receipts.** A receipt must not become a deletion bypass.
5. **REJECT — Treat a SHA/JID match as proof a legal proposition is correct.** Identity/integrity and legal interpretation are separate claims.
6. **REJECT — Build a generic legal chatbot in lplrs.** The stronger strategic position is reusable judicial-data substrate.
7. **NO NEW ISSUE — note-filler claim verification.** Existing `note-filler #3` already covers human Verify/Accept/Reject and stale decision history; CoCounsel/Clearbrief signals reinforce it but are duplicate in fingerprint.
8. **NO NEW ISSUE — ppt-studio claim provenance.** Existing `ppt-studio #3` already covers slide/claim source evidence.
9. **NO NEW ISSUE — taichung public Evidence MCP.** Existing `taichung-police-intel #15` already tracks read-only evidence distribution.
10. **DEFER — Authority graph / citation network.** Reference graph may become useful later, but exact revision/span/lifecycle correctness is the prerequisite.

---

# Issue Mapping

| Repository | Issue / PR | Mapping | Action this round |
|---|---|---|---|
| lplrs-judicial-sync | **#3 AuthorityReceipt / SourceSpan** | NEW high-value competitive inspiration | **CREATED** |
| lplrs-judicial-sync | #1 | erasable storage / real deletion beyond Git working tree | dependency; no lock takeover |
| lplrs-judicial-sync | PR #2 | body-free control records + approved erasable-store direction | dependency; no modification |
| note-filler | #3 | claim-level human review + evidence decision ledger | reinforced; no duplicate |
| voice-actress | #6 | rubric criterion → answer span + legal source | future AuthorityReceipt consumer; no duplicate |
| ppt-studio | #3 | slide/claim provenance | adjacent evidence primitive; no duplicate |
| taichung-police-intel | #15 | read-only Evidence MCP | future distribution pattern; no duplicate |

Coordination result:
- `lplrs #1` 的舊 `github-issue-lock:v1` lease 已過期；本輪新 fingerprint 也不與 #1/PR #2 重疊。
- 本輪只建立 research/product opportunity Issue；沒有 source-code change、branch、merge、deploy、secret、permission 或 repository-settings mutation。

---

# Sources

## Official / primary product sources
1. Thomson Reuters, 2026-09-08 — https://www.thomsonreuters.com/en/press-releases/2026/september/thomson-reuters-unveils-new-ai-powered-capabilities-for-legal-professionals
2. Thomson Reuters, 2026-08-20 — https://www.thomsonreuters.com/en/press-releases/2026/august/thomson-reuters-launches-next-generation-of-cocounsel-legal-the-ai-ecosystem-built-for-legal-professionals
3. Google Cloud, 2026-08-25 — https://cloud.google.com/blog/topics/public-sector/gemini-enterprise-for-legal
4. Lexis+ AI support, rechecked 2026-09-09 — https://supportcenter.lexisnexis.com/app/answers/answer_view/a_id/1127420/~/viewing-sources-in-lexis%2B-ai
5. Moonlit Q2 wrap, 2026-08-17 — https://www.moonlit.ai/blog/q2-2026-product-wrap-up
6. Moonlit MCP docs, rechecked 2026-09-09 — https://docs.moonlit.ai/docs/mcp
7. Moonlit product/data layer overview, 2026 — https://www.moonlit.ai/
8. Clearbrief, rechecked 2026-09-09 — https://clearbrief.com/

## Community / anecdotal
- Reddit legal/legaltech discussions were used only to identify verification/copy-paste failure modes; no self-reported prevalence, accuracy or cost figures were used as factual market statistics.

---

# What Changed Since Last Radar (r6)

1. **Repository state:** no new product-code/document commits were found across the 35 scoped repositories after r6 before this round’s radar/Issue actions.
2. **New external signal:** Thomson Reuters published a fresh 2026-09-08 release that makes assertion-level verification / exact supporting source passages a first-class legal workflow.
3. **Cross-validation:** Google’s 2026-08-25 legal product direction and Moonlit’s 2026-08-17 infrastructure shift independently point toward governed source layers feeding AI rather than isolated AI portals.
4. **New portfolio conclusion:** exact source provenance should become a shared data primitive, not a badge generated separately inside every AI product.
5. **New opportunity:** `lplrs-judicial-sync` can own a body-free `AuthorityReceipt / SourceSpan` contract that preserves source/revision/lifecycle identity without conflicting with judicial-removal requirements.
6. **New Issue:** `lplrs-judicial-sync #3` created after duplicate/PR/lock checks.
7. **Safety constraint strengthened:** provenance cannot justify retaining removed full text. Erasure policy remains the hard authority over receipt design.

---

## Portfolio Principle Added This Round

**可驗證引用不是「附上一個 URL」，而是讓使用者能證明：AI 當時使用哪一個 authority、哪一版本、哪一段，而且那份 authority 現在是否仍可用。**

Reusable lifecycle:

`Canonical Source → Exact Revision → Exact Evidence Locator → Consumer Claim → Verification Receipt → Source/Lifecycle Drift → STALE / REMOVED / UNKNOWN`

對法律資料尤其要再加一條：

`Provenance must never become an erasure bypass.`
