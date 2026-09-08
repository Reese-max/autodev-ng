# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-09

## Scope & Method

本輪以 Reese-max 擁有、未封存且可視為產品／產品基礎設施的 40 個 repositories 為範圍。主要市場情報來自 GitHub repository 之外的公開網路；GitHub 只用來確認本產品用途、近期 commit、現有 Issue/PR、duplicate/fingerprint 與跨排程 lock 狀態。

優先掃描最近 30–90 天的官方產品網站、官方新聞／changelog、第三方產品發布、安全研究、工具文件與公開案例。社群內容只當 anecdotal evidence；本輪沒有任何 Reddit 訊號進入立案決策。外部產品／廠商自己的 benchmark 或安全數字只按其來源屬性使用，不冒充獨立效果證明。

Evidence labels：
- `CONFIRMED`：官方產品／文件／可核對的公開能力或日期。
- `CONFIRMED_VENDOR_RESEARCH`：廠商公開研究，可支持 failure mode，但樣本比例不可外推成市場母體。
- `LIKELY`：多項訊號一致但仍欠直接 runtime / user evidence。
- `COMMUNITY_SIGNAL`：社群個案，只是 anecdotal。
- `UNKNOWN`：資料不足，明確保留不確定性。

---

## Executive Summary

本輪只有 **1 個候選達到高價值立案門檻**：`skill-foundry` 應把 Agent Skill 從「可比較／可認證的 prompt/knowledge package」進一步視為 **software supply-chain artifact**，在 Promotion 前增加 package-level 的安全檢查與 hash-bound `SecurityAttestation`。

新 Issue 已建立：

- `Reese-max/skill-foundry#3` — `[Research][RESEARCH_REQUIRED][SECURITY] 為 Skill Promotion 加入供應鏈安全檢查與可驗證 Security Attestation`
- Opportunity Score：**95/100**
- Stable fingerprint：`skill-foundry + evidence-gated candidate promotion + tree hash / behavioral red-team + no package-level agent-skill supply-chain security attestation + promotion may certify quality without independently certifying package risk`

本輪最重要的外部轉折不是「又出現一個 Skill Marketplace」，而是 **Agent/Skill/MCP 生態開始把「部署前檢查」產品化**：Tenable 於 2026-09-03 公布 CyberAgents Exchange AI Inspector，針對 agents、skills、MCP servers、multi-agent playbooks 在部署前做評估；Mitiga 於 2026-06-16 發布 Skillgate，直接掃 skills/hooks/agent rules/MCP configs/CLAUDE.md/AGENTS.md 的 prompt injection、hook RCE、credential exfiltration 等風險。Snyk 2026-02 的 ToxicSkills 研究則提供一個重要的 vendor-research failure signal：其特定 3,984-skill corpus 中確實發現 critical findings 與人工確認的 malicious payloads。

這與 `skill-foundry` 現況形成明確缺口：目前已有 Candidate tree hash、symlink/bytecode rejection、Promptfoo behavioral red-team、Waza、SkillEvaluator、final canary、HMAC attestation 與 deterministic Promotion，但「Skill 執行後模型會不會被 prompt injection 誘導」與「Skill package 自己是否帶危險腳本、未宣告外連、credential path、obfuscated/invisible instructions、dependency risk」是不同命題。

本輪沒有為其他 repository 灌水開票：`cf-mcp-server` 的 2026-07-28 MCP/CIMD/stateless migration 已有 #6；`autodev-ng` 的遠端 steering/queue 已有 #11；`taichung-police-intel` 最新只是資料發布 refresh；`chatgpt-dual-pipeline` 最新是 product-board audit，新增的 publish-safety / portable verification 問題已由 #3/#4 處理。

---

## Portfolio Refresh / What Changed in GitHub Since Last Radar

上一輪中央報告基準：`docs/competitive-intelligence/2026-09-08-external-radar-r8.md`。

r8 之後跨 40 repo 搜尋到的實質新 commit 只有：

1. `Reese-max/taichung-police-intel` — `498a5068876154afc7e7aa268f0a418a30b56d29` — `data: refresh V1 and V2 publication bundle [skip ci]`。分類：**資料 refresh，不是 product-code delta**。
2. `Reese-max/chatgpt-dual-pipeline` — `2299ea98063436b5d7995299d8baa166b14137d8` — `docs: add 2026-09-08 product board audit`。分類：**audit/docs delta**；既有新問題已形成 #3 fail-closed publish state 與 #4 portable verification gate，本雷達不重複立案。

`skill-foundry` 目前既有 Competitive Inspiration #1 是 Target Runtime Compatibility / Negative-Transfer Gate；本輪 #3 的 package security fingerprint 明確不同。建立 #3 前已搜尋 open/closed Issues、all-state PR 與 `github-issue-lock:v1` marker，沒有相同 fingerprint 或 implementation lock。

---

# External Signals

## Signal A — Direct / Near-direct: Agent component registries are adding pre-deployment inspection

### A1. Tenable CyberAgents Exchange AI Inspector — 2026-09-03 — `CONFIRMED`

Sources:
- https://www.tenable.com/press-releases/tenable-uses-openai-gpt-cyber-models-to-help-defenders-inspect-community-built-ai-components
- https://www.tenable.com/cyberagents-exchange

Tenable 於 2026-09-03 宣布 CyberAgents Exchange AI Inspector，將 frontier assessment、Tenable skills inspection、研究員 review 組合起來，對 Exchange 中的 agents、skills、MCP servers、multi-agent playbooks 做部署前評估；官方當時表述為 **expected to be available in September**，所以不能把它當成已全面 production-proven 的成效數據。CyberAgents Exchange 本身是免費 browse/use/contribute 的 registry，來源 code 仍留在各自 repo。

**JTBD**：團隊想重用第三方 agent component，但不想每次人工翻 Skill、MCP config、hooks、scripts 才決定能不能部署。

**為什麼省步驟／更可靠**：把「找元件」與「部署前檢查」放到同一 distribution surface，減少 registry → clone → 人工 grep → 靠經驗判斷的斷點。

**Onboarding / distribution**：免費、vendor-neutral registry 先降低發現／採用門檻；trust/inspection 變成 adoption layer，而不只是 README star/download signal。

**新能力模式**：agent/skill/MCP/playbook 被視為同一類「可重用、需要驗證的 component」，適合用 artifact identity、inspection receipt、review state 管理。

**Pricing / business-model signal**：Exchange 免費；Inspector 的企業安全 monetization／Tenable One 關係存在策略訊號，但本輪沒有足夠公開資料證明實際 Inspector 定價，標 `UNKNOWN`。產品設計上值得吸收的是「免費 distribution + trust gate」，不是複製其商業方案。

**限制／失敗點**：2026-09-03 時 Inspector 尚是預告 availability；官方文案不能當 detection accuracy 證據；registry link-to-source 也不等於 source 本身安全。

**適合吸收**：pre-Promotion inspection、component manifest、review receipt。

**不應照抄**：不要為 `skill-foundry` 建 Marketplace；Foundry 的定位應是 certification/governance，不是 catalog growth。

---

## Signal B — Adjacent: software supply-chain attestation separates provenance from security policy

### B1. GitHub Artifact Attestations — current docs — `CONFIRMED`

Sources:
- https://docs.github.com/en/actions/concepts/security/artifact-attestations
- https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations

GitHub 的 Artifact Attestation 把 artifact 與 repository、workflow、commit、event 等 provenance 綁定；官方也明確警告：**attestation 不是 artifact 安全保證**，只有在消費端驗證並套用自己的 security policy 後才有實際價值。

**JTBD**：software consumer 想回答「這個 artifact 從哪裡、怎麼產生、我是否應信任它」，而不是只比檔名或版本。

**省步驟／可靠性**：把 build/provenance evidence 機器化，消費端不用人工拼 workflow/commit/hash；同時保留 policy decision 與 provenance 分離。

**Onboarding / distribution**：attestation 跟 artifact 一起發布，consumer 用 verifier 驗證；適合轉譯成 Skill Promotion 的 evidence bundle，而非多一個 dashboard。

**能力模式**：`subject digest + producer identity + predicate/evidence + verifier policy`。

**Pricing signal**：GitHub 的可用範圍受 plan/repository visibility 限制；對 `skill-foundry` 的啟示不是採用 GitHub 付費功能，而是複用 attestation 語意。

**限制**：provenance/signature 只證明「誰／什麼流程產生這份東西」，不代表內容無 prompt injection、RCE、secret exfiltration 或危險 dependency。

**適合吸收**：`SecurityAttestation` 必須綁 exact Skill hash + scanner/rules identity + findings digest + policy verdict；consumer/release gate 仍需 verify。

**不應照抄**：不能把「有 HMAC / hash」重新命名成 security-certified。

---

## Signal C — Emerging tooling / security research: Skill files are becoming a real supply-chain attack surface

### C1. Mitiga Skillgate — 2026-06-16 — `CONFIRMED`

Source:
- https://www.mitiga.io/press-release/mitiga-labs-launches-skillgate-to-detect-risks-in-ai-agent-skills-and-configurations

Mitiga 發布免費 Skillgate，掃描 skills、hooks、agent rules、MCP configs、CLAUDE.md、AGENTS.md，針對 prompt injection、hook RCE、credential exfiltration 等風險做 pre-agent inspection。

**JTBD**：在 agent 真的讀取／執行配置前，先看出 instruction/code/config 中的危險模式。

**省步驟**：減少人工逐檔 security review；尤其對 frequent Skill iteration、第三方 imports、跨 agent configs 很有價值。

**Distribution / pricing signal**：免費 scanner 本身可以是企業安全產品的 adoption wedge；對 Foundry 的啟示是 security check 應低摩擦、可在 Promotion gate 自動跑，而不是額外高成本流程。

**限制**：scanner 有 false positive / false negative；score 不是 security truth；第三方工具本身也需版本化與可重播。

### C2. Snyk ToxicSkills — corpus as of 2026-02-05 — `CONFIRMED_VENDOR_RESEARCH`

Source:
- https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/

Snyk 掃描 3,984 個 ClawHub / skills.sh Skills；在該 corpus、該 detector/policy 下，公開結果包含 534 個至少一項 critical finding、1,467 個至少一項 security issue、76 個經 human-in-the-loop 確認的 malicious payload。這些比例**不可外推成所有 Agent Skills 的母體比例**，但可支持一件產品決策：package-level malicious / vulnerable instruction 不再只是理論威脅。

特別值得移植的 failure classes：hardcoded secrets、credential handling、prompt injection + malware convergence、runtime dynamic-fetch-and-execute。

### C3. Static-first + optional semantic review — `LIKELY` transferable pattern

市場工具逐漸把 deterministic/static checks 與 LLM/semantic inspection疊在一起。對 `skill-foundry` 的正確移植方式不是「讓另一個 LLM 說安全就 PASS」，而是：

`deterministic manifest / static findings → optional isolated semantic review → versioned evidence → deterministic release policy`

若 semantic review 會把 private Skill 內容送出，必須有 `NO_EXTERNAL_CONTENT_EGRESS` 模式與 provider/egress receipt。

---

# New Releases

## Tenable Exchange Inspector — 2026-09-03

**CONFIRMED**。Agent component discovery surface 開始加入 trust/inspection layer。這是本輪最重要的新產品策略變化。

## Fiveable “use Fiveable in your AI study app” — 2026-09-02

Source:
- https://fiveable.me/whats-new/use-fiveable-in-your-ai-study-app

**CONFIRMED PRODUCT SIGNAL**。Fiveable 允許使用者把其 AP guide content、practice、progress、FRQ feedback 連進 ChatGPT、Claude、Grok、Cursor、VS Code，讓學生在既有 AI client 裡使用受控學習來源，而不是每次從 open web 開始。

可移植到 `police-exam-archive` / `cyber-prep-coach` 的不是「再做一個聊天機器人」，而是 **canonical learning data as a connector/source**：題目、progress、mastery、source provenance 保持在產品內，AI client 只是另一個 distribution surface。

本輪不立案：`police-exam-archive #60` 的 attempt/mastery/deadline review 與 `cyber-prep-coach #4` 的 learner-model/next-best action 仍是更基礎的 truth layer；在 canonical learner state 尚未成熟前先擴 AI connector 會放大不一致。

**Pricing/business signal**：Fiveable 採 limited preview + sign-in progress 的連接流程，代表 connector 可以作為 distribution/onboarding 而不是要求使用者遷移到新 chat UI。是否適合 Reese-max 真實用戶仍 `UNKNOWN`，先研究。

---

# Community Pain Points

本輪沒有新的 Reddit／Hacker News anecdote 達到升級 Issue 的證據門檻，因此沒有用社群個案驅動立案。

重要區分：Snyk ToxicSkills 是 `CONFIRMED_VENDOR_RESEARCH`，不是 community signal；其 corpus 數字不外推成整個 Skills 生態比例。Tenable / Mitiga 的產品發布也只證明市場正在產品化 inspection workflow，不證明其 detection accuracy。

---

# Adjacent Ideas

1. **Package Security Attestation**：可重用至 `skill-foundry`、`herdr-skills`、`openab`、`autodev-ng`，未來也可涵蓋 MCP/agent bundles。
2. **Capability / Side-Effect Manifest**：讓 component 明示 `READ_LOCAL_FILES / WRITE_WORKSPACE / RUN_PROCESS / NETWORK_EGRESS / MCP_TOOL_CALL / EXTERNAL_SEND`，並與 static detection 比對；未宣告高風險能力 fail closed。
3. **Security evidence freshness**：scanner version、rules hash、dependency intelligence 或 candidate hash 變更時，舊 security claim 轉 `STALE`，不靜默沿用。
4. **Claim separation**：`QUALITY_CERTIFIED`、`RUNTIME_COMPATIBILITY_CERTIFIED`、`PACKAGE_SECURITY_ATTESTED` 必須是三個不同 claim，不能互相替代。
5. **No-external-content-egress mode**：安全敏感／私有 Skill 先用 deterministic local scan；任何 LLM review 必須明確 opt-in 且留下 egress receipt。
6. **Canonical study data as connector**：Fiveable 的分發模式可移植到考試／學習產品，但必須先有可信 progress/mastery/source state。
7. **Trust layer should sit before distribution activation**：registry/install/download 不能等於 active；應是 candidate → inspect → review/policy → activate。
8. **Scanner output must be explainable**：finding 要能回到 file/line/rule/evidence，不只一個 72/100 trust score。

---

# Opportunity Map — All Product-like Repositories

| Product | Market / JTBD | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| `92-duty-scheduler` | constraint duty scheduling | hard constraints / feasible schedule | minimal-change repair + explainability | auditable repair receipts (#19) | policy/version drift checks | opaque AI autoscheduling |
| `adng-memory` | cross-repo operational memory | source/freshness/ownership | stale/supersede/tombstone semantics (#4) | bitemporal activation receipts | security-attestation state reuse | generic vector DB for everything |
| `ai-novel-workstation` | long-running AI novel production | continuity + resumability | cost/context visibility (#2/#4) | evidence-gated production loop | artifact/security receipts for imported tools/skills | uncontrolled agent loops |
| `autodev-ng` | multi-agent delivery orchestrator | execution identity/status/recovery | exact STEER vs QUEUE (#11) | evidence-gated multi-engine delivery | imported agent/skill security attestation | broad marketplace/orchestrator bloat |
| `avatar-vfo` | AI avatar/character conversation | auth / per-user isolation | user-visible scoped memory | identity-bound memory controls | package/plugin trust if extensions arrive | giant unscoped memory / account-first expansion |
| `book5-windows-server-2022` | security learning deck | lifecycle/version correctness (#5) | 2022↔2025 delta | versioned claim/source drift | course claim attestation | wholesale 2025 rewrite |
| `cf-ai-router` | cost-safe multi-provider AI gateway | fail-closed cost/capability routing | task reliability + Responses compatibility (#1/#2) | auditable zero-surprise-spend routing | provider capability attestation | black-box dynamic routing |
| `cf-mcp-server` | Cloudflare control-plane MCP | OAuth/permission/audit + latest protocol | MCP 2026-07-28 dual migration (#6), staged deploy (#8) | exact-target confirmation + runtime receipts | component security manifest for MCP bundles | duplicate protocol/session framework |
| `chatgpt-dual-pipeline` | public internship notes publishing | fail-closed publish eligibility (#3) | portable clean-run gate (#4) | source/de-identification evidence | publication attestation | AI authoring before release-safety fix |
| `claude-mem` | upstream/agent memory fork | upstream compatibility | clear local delta | none until own product boundary proven | observe memory governance patterns | independent roadmap duplication |
| `clinical-scribe-worker` | clinical documentation/eval | auth/PHI/safety boundary | specialty/failure-class validation (#4) | versioned clinical validation packs | package attestation for model/prompt/parser bundles | autonomous clinical action |
| `cyber-prep-coach` | cybersecurity exam coaching | grounded curriculum/progress | mastery + next-best study action (#4) | evidence-linked learner model | external AI connector after canonical state | generic AI tutor clone |
| `exam-archive` | exam archive/reference | exact source/version | correction/freshness provenance | canonical source evidence | reusable attempt ledger only if product converges | duplicate practice engine |
| `flux-image-gen` | AI image workspace | generation provenance | C2PA/content credential integration (#18) | source/model/edit lineage | signed artifact receipt | “AI generated” label only |
| `gemini-deidentifier` | AI RPG / interactive fiction | persistent state correctness | deterministic consequence ledger (#30) | replayable world-state mutations | capability manifest for mod/tool packs | prose-only state as truth |
| `gooaye` | unclear/placeholder | establish product JTBD first | minimal repository contract | none until evidence | research only | manufacture features to fill quota |
| `herdr-skills` | reusable multi-agent workflows/skills | portable skill packaging | role/capability declarations | composable governed workflows | consume `skill-foundry` SecurityAttestation | build second security scanner/marketplace |
| `internship-notes-sites-mirror` | mirror/static publication | canonical mirror fidelity | freshness/link correctness | none independent of source repo | publish receipt from canonical source | independent product roadmap |
| `lobsterpulse` | agent observability/hooks | trace/token/error visibility | standard GenAI/OTel semantics | cross-provider audit timeline | surface security-attestation IDs in traces | duplicate telemetry frameworks |
| `lplrs-judicial-sync` | judicial data sync | source deletion/update fidelity | tombstone propagation | replayable source→derived lineage | reuse drift/tombstone contracts | assume file deletion erases history |
| `MaterialYouNewTab` | local-first new-tab productivity | fast/offline/low-permission | frictionless capture without broad perms | local canonical + privacy-minimal automation | `activeTab`-style explicit capture; optional sync research | account-first cloud suite / widget bloat |
| `minideck` | AI slide creation/publishing | stable shared output | draft vs published head (#4) | explicit publish/unpublish receipts | artifact provenance/security | current draft automatically public |
| `neciken-summer-poem` | AI writing + contest submission | exact contest rules | pre-submit rule drift (#3) | rule snapshot/receipt | source-policy attestation | generic contest discovery marketplace |
| `ninax-line-hermes` | LINE ↔ long AI/video workflows | message revision/redelivery correctness (#1) | stale-job delivery prevention | revision-bound job receipts | capability/security manifest for agent tools | long-running job bound only to message ID |
| `note-filler` | evidence-grounded legal/admin notes | immutable original/source grounding | claim review ledger (#3) | evidence-linked human acceptance | security/source attestation for research plugins | auto-accept LLM claims |
| `obsidian-vault` | local personal knowledge base | recovery/conflict reliability (#2) | portable setup (#3) | inspectable Markdown + owner control | safe connector/plugin manifest | add AI/collab before recovery proof |
| `openab` | Discord↔ACP coding-agent broker | explicit human tool permission boundary | approval scope/TTL/replay resistance | remote human approval broker | consume package SecurityAttestation before loading agent components | auto-allow widest permission |
| `police-exam-archive` | official police-exam bank/practice | faithful official questions/source | attempt ledger + deadline review (#60) | official-source-aware adaptive review | canonical data connector to AI clients, later | generic AI-generated question flood |
| `police-exam-practice` | legacy practice surface | preserve compatibility | consolidate into canonical archive | none as separate fork | redirect/migration contract | parallel feature divergence |
| `ppt-studio` | AI presentation workstation | source/claim provenance (#3) | export/review reliability | evidence-linked slide generation | package/model/provider attestation | “make slides from anything” breadth |
| `project-doctor-web` | clinical teaching/research UI | deterministic emergency/output integrity | provenance-safe objective findings | safety/evidence teaching contract | versioned validation packs | autonomous diagnosis/record truth |
| `prompt-autoresearch` | autonomous prompt optimization | dev/holdout isolation | variance-aware promotion (#3) | stability/evidence-gated champion | security-attested imported optimizer skills | single lucky-run promotion |
| `skill-foundry` | Skill creation/certification/governance | **package-level pre-Promotion security inspection (#3)** | exact hash + scanner/rules + capability attestation | **quality + runtime + security three-axis certification** | export attestation to herdr/openab/autodev | marketplace, universal trust score, LLM-only scanner |
| `soundbox-offline` | local-first music/audio utility | offline/recovery correctness | portable state/export | privacy/local operation | signed release/plugin manifest if extensible | cloud account dependency |
| `taichung-police-intel` | public-source police/public intelligence | source freshness/provenance | role/unit profiles + provisional→official reconciliation (#12/#13) | evidence-aware public-intel workflow | source/component attestation | treat data refresh as product-feature churn |
| `taiwan-intel-dashboard` | Taiwan public intelligence dashboard | current/as-of/source clarity | delta-first evidence reconciliation | cross-source provenance | source drift receipt | aggregate headlines without evidence |
| `tick-stock-panel` | Taiwan market screener/backtest | truthful coverage/as-of/simulation boundary (#1/#2) | deterministic strategy compiler research (#5) | explainable provider-capability-aware research | connector-style external analysis only after truth contract | AI stock advisor / live orders |
| `UkePack` | teacher/child ukulele practice packs | reliable generation/authorization | validate pack-set teacher workflow (#3) | privacy-minimal differentiated print/audio packs | small integrated practice tools | LMS/roster/account platform before research |
| `video-timeline-pipeline` | local-first video intelligence | stable evidence/timeline | bounded local evidence escalation (#10) | selection manifests + exact timestamps | provider capability/security attestations | replace pipeline with one vendor agentic API |
| `voice-actress` | legal essay grading/learning | grade provenance/session correctness | evidence-linked rubric spans (#6) | claim→answer span→law source verification | external source attestation | opaque total-score grader |

---

# Opportunity Scores / Decision

Scoring semantics：Implementation Effort、Security/Privacy/Cost Risk 越低越好；總分是產品排序工具，不是假精準統計。

| Candidate | Pain | Fit | Novelty | Evidence | Reuse | Effort | Risk | Score | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `skill-foundry` Package Security Attestation | 9 | 10 | 9 | 10 | 10 | 6 | 4 | **95** | **CREATE #3** |
| `cf-mcp-server` optional-scope / latest MCP auth refinements | 9 | 10 | 6 | 10 | 8 | 6 | 5 | 88 | Existing #2/#6; supporting evidence only |
| `autodev-ng` durable delegated-task handoff/remote control patterns | 8 | 9 | 6 | 8 | 9 | 7 | 5 | 84 | Existing #11/monitoring surfaces; no new issue |
| exam/cyber canonical content connector to external AI clients | 7 | 8 | 8 | 8 | 9 | 6 | 6 | 82 | Research list; prerequisite learner-state truth not done |
| `chatgpt-dual-pipeline` richer publishing workflow | 8 | 8 | 4 | 8 | 6 | 6 | 6 | 76 | Reject now; #3/#4 correctness first |

---

# Top 10 Cross-Portfolio Ideas

1. **`PackageSecurityAttestation`** — exact component hash + scanner/rules identity + findings + verdict。
2. **`Capability / SideEffect Manifest`** — declared vs detected file/process/network/tool/external-send能力。
3. **Security Evidence Freshness** — candidate/scanner/rules/dependency-intel drift → `STALE`，不得 silent reuse。
4. **Separate Certification Claims** — Quality、Runtime Compatibility、Package Security 互不冒充。
5. **`NO_EXTERNAL_CONTENT_EGRESS`** — private/sensitive Skill 可在完全 local/static mode 完成最低安全 gate。
6. **Canonical Data as Connector** — 將可信題庫/progress/mastery 提供給使用者既有 AI client，而非再造 chat UI；先研究後建。
7. **Least-Privilege Component Activation** — install/discover 不等於 activate；activation 應綁 capability + approval + current hash。
8. **Explainable Findings** — security/review verdict 永遠可回到 file/line/rule/evidence，不用黑箱 trust score。
9. **Evidence-Aware Release Receipts** — artifact identity、policy、runtime/security gate、freshness 一起保存，適合 slide/model/skill/deploy 等多產品。
10. **Change-Triage Simplification** — data refresh、audit/docs commit、product-code change 分層，避免每輪雷達把資料更新誤判成新功能需求。

---

# Ideas Rejected / Deferred

1. **在 `skill-foundry` 建 Skill Marketplace** — REJECT。Tenable 的 registry 是 distribution context；Foundry 的 moat 是 certification，而非 catalog。
2. **以單一 LLM security score 決定 Promotion** — REJECT。LLM verdict 不可覆蓋 deterministic BLOCK，且可能帶來 private-content egress。
3. **scan 階段直接執行未知 Skill/Hook「看會不會惡意」** — REJECT。第一版 static/non-executing；未來動態測試需獨立 sandbox。
4. **把 HMAC/tree hash 當作「內容安全」** — REJECT。Identity/provenance 與 safety claim 分離。
5. **重開 `cf-mcp-server` 最新協定 Issue** — DUPLICATE。2026-07-28、CIMD、stateless discover、conformance 已由 #6 處理。
6. **重開 `autodev-ng` 遠端 control / steering** — DUPLICATE。#11 已處理 STEER vs QUEUE exact execution semantics。
7. **因 taichung 資料 refresh 新增功能** — REJECT。最新 commit 是 publication data refresh，不是產品能力變化。
8. **先替 `chatgpt-dual-pipeline` 增 AI authoring/connector** — DEFER。先完成 #3 fail-closed publication 與 #4 portable verification。
9. **直接替警察考試產品增加通用 AI Chat** — DEFER。先完成 attempt/mastery/deadline review；Fiveable 訊號先留 connector research。
10. **把 Snyk corpus 百分比當市場母體風險率** — REJECT。只保留 vendor-research failure evidence。

---

# Issue Mapping

## Created

### `Reese-max/skill-foundry#3`
`[Research][RESEARCH_REQUIRED][SECURITY] 為 Skill Promotion 加入供應鏈安全檢查與可驗證 Security Attestation`

核心：

`Candidate tree hash → static package inventory → deterministic security scans → optional isolated semantic review → SecurityAttestation → release policy → Promotion`

Issue 已包含：
- 外部來源與日期；
- current repo evidence；
- JTBD 與人工斷點；
- transferable principle；
- `SkillPackageManifest`；
- non-executing static gate；
- capability / side-effect declaration；
- hash-bound `SecurityAttestation`；
- optional semantic review 的 egress contract；
- Promotion claim separation；
- freshness/invalidation；
- What NOT to copy；
- Acceptance Criteria；
- benign/unsafe security fixtures；
- Success Metrics；
- Major Risks；
- Dependencies；
- `Runtime Verification Requirement = REQUIRED`。

## Existing / no duplicate

- `skill-foundry#1` — Target Runtime Compatibility / Negative-Transfer：與 #3 互補。最終 release report 應並列 Runtime 與 Package Security，不合併成一個模糊 PASS。
- `cf-mcp-server#6` — MCP 2026-07-28/CIMD/stateless/conformance：本輪新協定訊號只補研究背景，不再立案。
- `cf-mcp-server#2` — OAuth token scope/short-lived credential remediation：least-privilege scope signal 已有 owner。
- `autodev-ng#11` — STEER vs QUEUE：不以新 agent-control產品重開票。
- `police-exam-archive#60` / `cyber-prep-coach#4` — learner state/mastery 是 Fiveable-style external connector 的前置 truth layer。
- `chatgpt-dual-pipeline#3/#4` — publish safety + portable gate 優先於新 distribution 功能。

## Coordination / Lock

建立 #3 前：
- open/closed Issue search：無相同 package-supply-chain-security fingerprint；
- all-state PR search：無相同 fingerprint；
- `skill-foundry` code search：無 `github-issue-lock:v1` implementation lock marker；
- central radar 中的 lock markers 只屬既有 coordination record。

本輪**沒有建立實作 branch、沒有修改產品原始碼、沒有 merge、沒有 deploy、沒有改 secrets、permissions 或 repository settings**；只建立 research/product Issue 與本中央 radar report。

---

# Sources

| Date | Status | Source | URL | Use |
|---|---|---|---|---|
| 2026-09-03 | CONFIRMED | Tenable — CyberAgents Exchange AI Inspector | https://www.tenable.com/press-releases/tenable-uses-openai-gpt-cyber-models-to-help-defenders-inspect-community-built-ai-components | Direct/near-direct pre-deployment inspection signal |
| current 2026-09 | CONFIRMED | Tenable CyberAgents Exchange FAQ | https://www.tenable.com/cyberagents-exchange | Free/vendor-neutral registry + source-linked distribution model |
| 2026-06-16 | CONFIRMED | Mitiga Skillgate | https://www.mitiga.io/press-release/mitiga-labs-launches-skillgate-to-detect-risks-in-ai-agent-skills-and-configurations | Agent Skill/config pre-execution scanner pattern |
| corpus 2026-02-05 | CONFIRMED_VENDOR_RESEARCH | Snyk ToxicSkills | https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/ | Package-level failure evidence; percentages not extrapolated |
| current docs | CONFIRMED | GitHub Artifact Attestations | https://docs.github.com/en/actions/concepts/security/artifact-attestations | Adjacent provenance/attestation contract |
| current docs | CONFIRMED | GitHub attestation build provenance | https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations | Verification/policy separation |
| 2026-09-02 | CONFIRMED PRODUCT SIGNAL | Fiveable AI-study app connection | https://fiveable.me/whats-new/use-fiveable-in-your-ai-study-app | Adjacent distribution: canonical study source inside existing AI clients |

---

# What Changed Since Last Radar

1. **新市場訊號**：Agent/Skill/MCP component trust 從「registry/source link」更明確進化為「pre-deployment inspection / review」，Tenable 2026-09-03 的 Inspector 是本輪最新強訊號。
2. **新高價值機會**：`skill-foundry` 現有 evidence-gated promotion 已有足夠基礎，現在值得補 package supply-chain security；建立 #3，Score 95/100。
3. **新共通模型**：`Artifact Identity != Safety`。hash/provenance、behavioral quality、runtime compatibility、package security 應各自成 claim，再由 release policy組合。
4. **GitHub 端產品變動很少**：r8 後只有 `taichung-police-intel` data refresh 與 `chatgpt-dual-pipeline` audit docs commit；未發現另一個足以建立新產品 Issue 的 product-code delta。
5. **新 distribution research**：Fiveable 2026-09-02 顯示「可信學習資料/進度接入使用者既有 AI client」值得後續研究，但 Reese-max 考試產品目前先完成 canonical attempt/mastery state，不提前擴 surface。
6. **去重維持**：MCP 協定、remote agent steering、taichung live reconciliation、chatgpt-dual publication safety 均已有 owner，不重複立案。

---

## Portfolio Principle Added This Round

**任何可被 Agent 載入、執行或授權的 Skill / MCP / workflow component，都不應只問「它效果好不好」，還要問「這一份 exact artifact 在這一套 scanner/rule/policy 下，允許做什麼、發現什麼風險、證據是否仍 fresh」。**

建議共通生命週期：

`Candidate Artifact → Identity/Manifest → Static Security Inspection → Optional Semantic Review → Security Attestation → Quality/Runtime Gates → Policy Activation → Receipt → Drift/Stale/Revoke`

其中：
- `hash` 證明 identity，不證明 safety；
- `quality pass` 不證明 package safe；
- `security pass` 不證明 task quality；
- `runtime compatibility pass` 不代表 universal portability；
- 任何 critical artifact/scanner/rules drift 都不能 silent reuse 舊 PASS。
