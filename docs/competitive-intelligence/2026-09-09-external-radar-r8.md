# External Competitive / Product / Workflow Inspiration Radar — 2026-09-09 r8

## Executive Summary

本輪主要情報來源仍是 GitHub 之外的公開網路；GitHub 只用來確認 Reese-max portfolio 的現況、近期變更、既有 Competitive Gap / Feature / Research Issues、PR 與 `github-issue-lock:v1` 協調狀態。

本輪新增一個達通知門檻、但**不建立 duplicate Issue** 的高價值跨產品機會：

- **Memory Poisoning / Origin-aware Memory Admission**
- Primary home: `Reese-max/adng-memory #4`（既有 Memory Activation / Staleness / Deletion Contract）
- Action: **UPDATE EXISTING ISSUE #4**，新增 memory-origin、admission/quarantine、retrieval-time composition、permission boundary 與 poisoning regression contract。
- Opportunity Score: **95/100**
- Stable sub-fingerprint: `persistent agent memory + candidate lifecycle contract + external/environment content can be summarized/stored and later retrieved as authority + no explicit origin-risk/admission/quarantine/poison-replay security gate`

這輪的市場變化不是「再多一個 memory backend」。更重要的是兩股趨勢同時出現：

1. memory 正從單人、單 agent，往 **team/shared institutional memory** 擴張；
2. security 產品開始把 **persistent-memory poisoning** 當成與一般 prompt injection 不同的一級攻擊面，提供專門 red-team、read/write policy、quarantine、snapshot / rollback 與 lifecycle repair。

因此 Reese-max portfolio 下一步不應把「能保存更多記憶」當核心指標，而應把 durable memory 的生命週期收斂成：

`Observed content → Origin / scope → CandidateMemory → AdmissionPolicy → ALLOW / REVIEW / QUARANTINE / REJECT → ActiveMemory → Retrieval Set → Action Permission Gate → MemorySecurityReceipt`

其中 **memory 可以提供 context，但不能因為被保存就取得 instruction / authorization 權限**。

---

## Scope & GitHub Pre-scan

本輪沿用並重新掃描 35 個 Reese-max 擁有、未封存、可視為產品／產品基礎設施的 repositories：

`exam-archive`, `police-exam-practice`, `police-exam-archive`, `92-duty-scheduler`, `UkePack`, `ppt-studio`, `voice-actress`, `taiwan-intel-dashboard`, `autodev-ng`, `flux-image-gen`, `claude-mem`, `lobsterpulse`, `prompt-autoresearch`, `neciken-summer-poem`, `note-filler`, `lplrs-judicial-sync`, `adng-memory`, `cyber-prep-coach`, `cf-ai-router`, `avatar-vfo`, `project-doctor-web`, `minideck`, `chatgpt-dual-pipeline`, `internship-notes-sites-mirror`, `taichung-police-intel`, `soundbox-offline`, `skill-foundry`, `video-timeline-pipeline`, `ai-novel-workstation`, `clinical-scribe-worker`, `MaterialYouNewTab`, `cf-mcp-server`, `tick-stock-panel`, `herdr-skills`, `ninax-line-hermes`.

### What changed in GitHub since r7

- 沒有看到 r7 之後新的產品程式碼 feature commit；最新產品側變更主要是 audit / regression evidence。
- `cf-mcp-server` Round 3 新增 P1 #9：Web OAuth first-grant owner approval 目前要求 browser navigation 無法正常攜帶的 custom bearer header；P2 #5 也因非原子的 abuse accounting / D1 fail-open-to-isolate-memory / registration 無 quota/TTL 而重新開啟。這些是 correctness / onboarding blocker，已有 Issue，不另立競品功能。
- `tick-stock-panel` Round 3 重新開啟 #2：coverage / partial / empty-universe 目前主要是 warning，screening execution 尚未 server-side fail closed；現階段仍應先完成 truth/coverage gate，不擴張新的 AI 投資功能。
- `adng-memory #4` 已存在 Memory Activation / Staleness / Deletion Contract，內容包含 candidate ≠ active、predecessor/head、quarantine、supersession、tombstone、derived lineage；其舊 `github-issue-lock:v1` lease 已於 2026-09-07 過期，因此本輪可安全補充外部研究，不搶其他 worker 的 active lease。
- `claude-mem` 是可自動擷取 tool observations、產生 semantic summaries、跨 session 注入 context 的 persistent memory product；目前 repository / Issue / PR 搜尋未見 `memory poisoning`、`prompt injection` 或 `quarantine` 的 Reese-max-specific tracking，但本輪不另開 Issue，避免和 portfolio-level `adng-memory #4` 重複。

---

# External Signals

## A. Direct / market-direction signal

### A1 — CONFIRMED / VENDOR RELEASE — TencentDB Agent Memory「Team Memory」
**Published:** 2026-08-13  
Source: https://www.prnewswire.com/apac/news-releases/tencentdb-agent-memory-tops-20-000-github-stars-in-90-days-launches-team-memory-for-multi-agent-collaboration-302850576.html

Tencent Cloud 將 Agent Memory 從個人長期記憶擴到 **Team Memory**：conversation、document、code、workflow / skill 可成為 centrally managed shared memory assets，再依 role / task 組裝給不同 agent 使用；官方資料也描述 owner、version、status、usage history 與 user/role/agent permission。

**Job-to-be-Done**
多 agent / 多人團隊不必一直重講 project background、重建過去 troubleshooting 或人工複製已經沉澱的工作方式。

**Why fewer steps**
`human repeats context to every agent → each agent rebuilds context` 變成 `governed team memory → role-specific assembly`。

**Onboarding / distribution pattern**
Memory Hub / shared assets 成為獨立 control plane，可跨 agent platform 使用，而不是綁死在單一 chat thread。

**Automation / collaboration signal**
Memory 不再只是 session history，而是可版本化、可授權、可重用的 team asset。

**Pricing / business-model signal**
本輪不使用星數或 adoption marketing 作效果證據；真正重要的是 memory layer 開始被產品化成跨 agent 的 institutional substrate。

**Failure / limitation**
共享範圍越大，錯誤、過時或惡意 memory 的 blast radius 越大。`owner/version/status/ACL` 能解治理的一部分，但不等於 memory content 本身安全。

**Adopt**
Owner/version/status/scope + role-based retrieval + explicit activation。

**Do not copy**
不要因市場流行 shared memory 就把所有 log / chat / web observation 全部長期保存、全隊共享；權限、來源、生命週期與 admission 必須先成立。

---

## B. Adjacent transferable security workflow

### B1 — CONFIRMED — Palo Alto Prisma AIRS 新增 Memory Poisoning Red Teaming
**Release:** August 2026  
Source: https://docs.paloaltonetworks.com/ai-runtime-security/new-features/by-date/prisma-airs/august-2026

Prisma AIRS AI Red Teaming 現在有獨立 **Memory Poisoning** goal category：先確認 target 是否真的能寫入 persistent store 並在後續 session 取回，再依 agent 功能產生 memory-poisoning attack scenarios；若成功，report 會要求 operator 人工檢查／移除注入內容。

**JTBD**
在 production readiness / security review 前，確認「普通互動是否能留下跨 session 的惡意狀態」，而不是只掃單次 prompt。

**Why more reliable**
把 `can write → persists → later retrieved → changes behavior` 當成完整攻擊生命週期測試，而不是只檢查輸入文字是否看起來可疑。

**Onboarding / distribution**
Memory poisoning 被做成 red-team goal category，和其他 agent attack surface 一起進既有 security workflow。

**New product mode**
Memory security 必須有 stateful / cross-session test harness。

**Failure / limitation**
Vendor scan / judge 的 PASS/FAIL 不能直接當 Reese-max 的 security proof；而且 Prisma 自己說成功 poisoning 後仍需人工 review/remove。

**Adopt**
建立 isolated Write → Retrieve → Execute → Repair fixtures / receipts。

**Do not copy**
不對 production memory 直接注入攻擊內容；先 synthetic namespace / isolated writer。

### B2 — CONFIRMED — OWASP Agent Memory Guard
**Current recheck:** 2026-09-09  
Source: https://owasp.org/www-project-agent-memory-guard/

OWASP Agent Memory Guard 把 memory security 做成 read/write boundary runtime middleware：
- injection / sensitive-data / protected-key / rapid-change / size anomaly detection；
- declarative read/write policy；
- crypto integrity baseline；
- snapshots / rollback；
- roadmap 進一步處理 vector-store protection / multi-agent security。

**JTBD**
不必重寫整個 memory backend，就能在 durable state 的 read/write 入口施加 policy、quarantine 與 audit。

**Transferable principle**
Memory store 成功寫入 ≠ 成為 active authority；retrieval 成功 ≠ 可拿來驅動所有 action。

**Do not copy blindly**
Hash/signature 只能證明 bytes/integrity 或 writer 身分，不能證明內容無害；合法來源也可能帶 prompt injection 或錯誤指示。

---

## C. Emerging technical possibility

### C1 — CONFIRMED RESEARCH — eTAMP: environment observation can poison future memory
**Published:** 2026-04-03  
Source: https://arxiv.org/abs/2604.02623

`Poison Once, Exploit Forever` 的重要新 threat model 是：攻擊者不必直接接觸 memory store。Web agent 只要看過受污染的產品頁／外部環境內容，就可能把 observation 沉澱成 memory，之後跨 session / 跨網站觸發。

**Product implication**
`WEB_EXTERNAL / TOOL_OBSERVATION / MESSAGE_EXTERNAL` 的 trust boundary 不能因「模型幫它摘要了一次」就消失。

### C2 — CONFIRMED RESEARCH — stealth memory injection via ordinary email
**Published:** 2026-07-06  
Source: https://arxiv.org/abs/2607.05189

該研究測試單一惡意 email 讓 persistent personal agent 靜默寫入 poisoned memory，未必在當下回覆暴露，卻在後續工作中才產生影響；涵蓋 OpenClaw / Claude Code SDK 與多種 memory backend。

**Product implication**
對 `ninax-line-hermes`、email/web-connected agents、`autodev-ng` 等系統，外部 message/content 應是 evidence/input，不應自動成為 durable instruction。

### C3 — CONFIRMED RESEARCH — MemPoison: write-time filtering is not enough
**Published:** 2026-07-16  
Source: https://arxiv.org/abs/2607.14651

MemPoison 區分 direct、multi-record compositional、context-triggered dormant poisoning。其重要架構訊號是：單筆 write-time consistency checks 能壓制部分直接攻擊，但多筆內容組合、延遲 trigger 仍可能繞過。

**Product implication**
需要 retrieval-time composition / use-time permission gate，而不是只做 `on_write(scan)`。

### C4 — CONFIRMED RESEARCH — MemSecBench lifecycle security
**Published:** 2026-07-29  
Source: https://arxiv.org/abs/2607.27080

MemSecBench 將測試拆成 `Write → Execute → Forget/Repair`，並比較 memory backend / agent harness / LLM backend 的差異。其百分比只屬於該 benchmark，不外推成 Reese-max 風險率。

**Product implication**
Security regression 應量「poison 是否真的進 active memory」「是否真的改變後續 action」「能否 selective repair」，不是只量 detector 命中率。

---

# New Releases / Recent Signals

| Date | Product / source | Capability / signal | Evidence class | Reese-max relevance |
|---|---|---|---|---|
| 2026-08 | Palo Alto Prisma AIRS | Memory Poisoning 成為 AI Agent Red Teaming goal | CONFIRMED | `adng-memory`, `autodev-ng`, `claude-mem`, agent products |
| 2026-08-13 | TencentDB Agent Memory | Team/shared memory + owner/version/status/permissions | CONFIRMED_VENDOR | shared memory governance / blast radius |
| 2026 Q3 current | OWASP Agent Memory Guard | read/write policy, detectors, quarantine, snapshot/rollback roadmap | CONFIRMED | reusable memory security middleware pattern |
| 2026-07-29 | MemSecBench | Write→Execute→Forget/Repair lifecycle benchmark | CONFIRMED_RESEARCH | poisoning regression harness |
| 2026-07-16 | MemPoison | multi-record / dormant poisoning blind spots | CONFIRMED_RESEARCH | retrieval-time composition defense |
| 2026-07-06 | WhisperBench / MemGhost research | single external email → stealth persistent memory injection | CONFIRMED_RESEARCH | message-connected persistent agents |
| 2026-04-03 | eTAMP | environment observation → cross-session/cross-site poisoning | CONFIRMED_RESEARCH | browser/web/tool observations |

---

# Community Pain Points

> 下列只作 `COMMUNITY_SIGNAL` / workflow clue，不視為發生率或統計調查。

1. Persistent memory 的問題不是只「記錯」：使用者往往不知道某個未來行為是由哪一筆過去 memory 觸發，修復成本比單次 prompt injection 高。
2. Shared/team memory 帶來「一次沉澱、多 agent 重用」的效率，也讓一筆錯誤內容可能影響多個角色；因此 ownership/visibility/usage history 對 debug 很重要。
3. 使用者希望 agent 自動記住，不代表希望外部 email、網頁、tool output 被永久視為 preference / policy / instruction。
4. 一旦 memory 被摘要、embedding、derived summary、cache 多次加工，人工刪除原始 entry 未必等於所有衍生層都已失效；這和 `adng-memory #4` 的 tombstone/lineage 問題直接相連。

---

# Adjacent Ideas

1. **Origin-aware Memory Envelope** — 在現有 lifecycle envelope 加 `origin_class / source receipt / trust boundary`，摘要／轉換後仍保留 lineage。
2. **Memory Admission Broker** — Durable write 先成 candidate，再由 deterministic policy 決定 `ALLOW / REVIEW / QUARANTINE / REJECT`。
3. **Memory Permission Firewall** — 即使 memory ACTIVE，也不能直接批准 shell/network/destructive action；action 必須重新經 capability / exact-target authorization。
4. **Retrieval Composition Test** — red-team 不只測單筆 poisoned record，也測 benign-looking multi-record composition 與 delayed trigger。
5. **Poison Repair Receipt** — selective quarantine/tombstone/derived invalidation；避免遇到一筆污染就整庫 wipe。
6. **External-content trust preservation** — web/email/tool output 經 LLM summary 後 origin 仍是 external-derived，不因模型轉述就升格為 internal authority。
7. **Shared-memory blast-radius map** — 未來 Team Memory / multi-agent 共享時，記錄哪些 agent / task / retrieval 使用過某 revision，以利 stale/poison repair。
8. **Memory Security Pack** — 類似 `skill-foundry` security attestation / clinical validation pack，建立 versioned poisoning fixture pack，不和 quality benchmark 混為同一個 PASS。

---

# Opportunity Score

## `adng-memory #4` Security Extension — 95/100

| Dimension | Score | Reason |
|---|---:|---|
| User Pain | 9/10 | poisoned/stale durable state 可跨 session 影響未來工作且難追來源 |
| Strategic Fit | 10/10 | #4 已有 candidate→activation / lineage / quarantine / tombstone，可直接擴 security admission |
| Novelty | 9/10 | 2026 市場才開始把 memory poisoning 做成獨立 red-team/runtime product surface |
| Evidence Strength | 10/10 | Palo Alto、OWASP、Tencent + 多篇近期 research 交叉支持 |
| Reuse Potential | 10/10 | 可橫跨 agent control plane、developer memory、persona、optimizer、skills、messaging |
| Implementation Effort | 7/10 | schema/fixtures 容易先做；真正 writer/retrieval enforcement 需各 runtime pilot |
| Security/Privacy/Cost Risk | 6/10 | production poisoning test / payload retention 有風險，因此隔離與 synthetic first |

**Overall heuristic: 95/100.**

---

# Opportunity Map — 35 Unarchived Reese-max Repositories

| Repository | Market category | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| exam-archive | exam archive/search | source fidelity / stable question IDs | retrieval/filtering | source provenance | evidence locator | generated fake official questions |
| police-exam-practice | exam practice | deterministic grading / persistence | adaptive review | official-exam fidelity | mastery next-task | opaque pass prediction |
| police-exam-archive | official exam corpus + practice | official source/question identity | deadline-aware review | traceability | read-only AI retrieval | replacing official questions with generated content |
| 92-duty-scheduler | constrained scheduling | deterministic hard constraints | preview/repair | auditable Rule Studio | PolicySpec / impact diff | black-box autonomous scheduling |
| UkePack | music practice/teaching | reliable chords/audio | fewer tool jumps | offline teacher-friendly toolkit | tuner/metronome/tone tools | DAW feature sprawl |
| ppt-studio | AI presentation authoring | editable export / stable render | source-backed generation | slide/claim provenance | source-context connectors | collaboration SaaS sprawl |
| voice-actress | exam / essay grading | grading provenance | evidence-linked feedback | criterion→answer span→source | AuthorityReceipt consumer | opaque single-score grading |
| taiwan-intel-dashboard | public intelligence | truthful source health / operating state | evidence-first brief | explicit gaps / canonical event truth | EvidenceEnvelope after truth gates | AI over broken source truth |
| autodev-ng | autonomous dev control plane | exact execution identity / permissions | attention + steering UX | action receipts | **origin-aware durable memory admission/security receipt** | silent autonomous mutation / memory-granted authority |
| flux-image-gen | image generation/edit | output/history integrity | provenance UX | verifiable generation/edit receipt | C2PA inspect/preserve | “credential absent = human-made” |
| claude-mem | developer/agent memory | scoped durable state | safe write/retrieval | local persistent context substrate | **memory poisoning admission/quarantine + origin lineage** | treating auto-captured external text as authority |
| lobsterpulse | agent observability | correct session/status visibility | needs-attention routing | attention inbox | security/permission/memory alerts | dashboard overload |
| prompt-autoresearch | prompt optimization | exact evaluation/prompt identity | variance-aware promotion | evidence manifests | poisoning-safe learned durable state | single lucky run = champion |
| neciken-summer-poem | contest-aware writing | current rule/source truth | pre-submit revalidation | rule-drift receipt | contest opportunity feed | autonomous submission/payment |
| note-filler | evidence-backed notes | immutable original + source support | human claim review | claim evidence ledger | AuthorityReceipt / SourceSpan | auto-promote unsupported additions |
| lplrs-judicial-sync | judicial ingestion/lifecycle | complete + erasable source sync | downstream source identity | AuthorityReceipt / SourceSpan | legal data substrate | legal-validity inference |
| adng-memory | cross-repo operational memory | ownership / freshness | activation + deletion + **origin-aware admission** | temporal lineage + MemorySecurityReceipt | poisoning regression / shared-memory blast-radius | vector-first expansion / auto-trust latest write |
| cyber-prep-coach | iPAS prep | official exam spec/question truth | mastery-driven next task | local explainable study | trusted external-AI source | pass-rate prediction |
| cf-ai-router | AI gateway/router | exact provider/model/cost policy | reliability routing | deterministic evidence-backed profiles | local inference federation | opaque billable dynamic routing |
| avatar-vfo | persona/roleplay | identity/state consistency | long-horizon continuity | explainable state + ablation | structured memory **with trust/origin boundary** | therapeutic/psychological efficacy claims |
| project-doctor-web | clinical education simulation | fact provenance/safety | CaseSpec + debrief | controlled virtual patient | educator authoring | autonomous diagnosis/treatment |
| minideck | lightweight presentation sharing | explicit publication boundary | preview/publish clarity | draft vs published head | provenance later | full collaboration SaaS |
| chatgpt-dual-pipeline | multi-model comparison | exact model/input identity | replay/comparison | complementary reviewer evidence | behavior migration harness | “two models agree = truth” |
| internship-notes-sites-mirror | archive/mirror | freshness / complete capture | content diff | archival provenance | extraction/search | access-control bypass |
| taichung-police-intel | public intelligence | source verification/freshness | canonical brief | EvidenceEnvelope | read-only Evidence MCP | internal operational data distribution |
| soundbox-offline | local-first audio | local library integrity/offline | import friction | no-account ownership | LAN QR/browser direct transfer | cloud streaming catalog/account dependency |
| skill-foundry | agent skill pipeline | exact artifact/security identity | security attestation | quality/runtime/package-security separation | memory-write capability + taint policy | trust-by-hash alone |
| video-timeline-pipeline | video intelligence | evidence/timeline identity | bounded visual escalation | exact timestamp receipts | task-local re-observation | unbounded agentic rescanning |
| ai-novel-workstation | long-form AI writing | resumability/cost boundary | cost envelope | production-loop receipts | continuity/memory regression | opaque credit guarantees |
| clinical-scribe-worker | clinical documentation | source fidelity / PHI safety | specialty validation | per-pack release evidence | origin-governed persistent context only if later added | autonomous clinical action |
| MaterialYouNewTab | browser start page | fast/local/privacy | optional sync | local-first personalization | opt-in collaboration | account-first cloud dependency |
| cf-mcp-server | Cloudflare admin MCP | OAuth / permission correctness | staged deployment + health evidence | exact action receipts | memory/security only if persistent agent state is later introduced | broad auto-trust / 100%-traffic-only assumptions |
| tick-stock-panel | market analysis | coverage truth | execution gating | deterministic strategy rules | NL→StrategyDef research | live advice / full-market claims on partial coverage |
| herdr-skills | reusable agent skills | exact skill provenance | capability declarations | security attestation | poisoning fixtures for skills that write memory | silent network/shell/memory authority |
| ninax-line-hermes | messaging/video agent | exact message revision/source | stale-summary invalidation | event/delivery receipts | **external-message memory admission** if persistent memory is enabled | exactly-once claims / message-as-authority |

---

# Top 10 Cross-Portfolio Ideas

1. **Memory Origin / Authority Separation** — external observation、human statement、internal governed fact、model-derived summary 必須保留不同 origin；不因「進了 memory」就等價。
2. **Candidate Memory Admission Broker** — proposal/write request 與 active memory 分離，支援 `ALLOW / REVIEW / QUARANTINE / REJECT`。
3. **Memory Cannot Grant Permission** — memory 只能提供 context；shell/network/deploy/delete/send/secret 等 capability 必須重新走 permission/approval layer。
4. **Retrieval-time Composition Defense** — security test 從單 entry 提升到 multi-record、delayed-trigger、derived-summary composition。
5. **Shared-memory Blast-radius Receipt** — 記錄某 revision 被哪些 agent/task/retrieval 使用，修復時可精準 stale/quarantine。
6. **Poison Repair / Selective Forgetting** — exact item / derived lineage invalidation 優先，避免整庫 wipe。
7. **Security Pack ≠ Quality Pack** — memory poisoning、skill security、behavior quality、runtime compatibility 分別出 receipt，不互相冒充。
8. **External Content Laundering Guard** — web/email/tool output 經 LLM rewrite/summary 後仍保留 external origin lineage。
9. **Cross-session Security Replay Harness** — `write → new session → retrieve → attempted action → repair` 成為 agent product 的共用 regression primitive。
10. **Trust State as Product UX** — 未來 UI 不只顯示「agent 記得什麼」，也顯示 memory 的來源、scope、active/quarantined/stale、最後使用時間與可撤銷範圍。

---

# Ideas Rejected / Deferred

1. **REJECT — 新開 `adng-memory #5 Memory Poisoning`。** #4 已有 candidate/activation/quarantine/lineage/tombstone，同一 lifecycle substrate；本輪用 update 避免 duplicate。
2. **REJECT — 在 `claude-mem` 直接 fork-in OWASP middleware。** Reese-max repo 看起來與 upstream claude-mem 同步性高，本輪先建立 portfolio contract/evaluation；不在未確認 upstream ownership strategy 時做重複 feature fork。
3. **REJECT — 所有 external memory 一律禁止。** Web/email/tool memory 是 agent 有用的重要來源；正確做法是 authority/scope/admission 分離，而不是全面封鎖。
4. **REJECT — hash/signature = safe memory。** Integrity/provenance 不等於內容安全；已授權 writer 也可能把惡意外部內容寫進記憶。
5. **REJECT — LLM classifier 作唯一 memory firewall。** 必須保留 deterministic protected capabilities、schema、origin、policy、review/quarantine。
6. **REJECT — production memory 上直接跑 poisoning attack。** Research 預設 synthetic / isolated namespace；正式 red team 需另有授權與清理計畫。
7. **NO NEW ISSUE — `cf-mcp-server` agent safety expansion。** 目前 #9/#5 OAuth/onboarding/abuse correctness 更優先，而且該產品本身不是 persistent-memory owner。
8. **NO NEW ISSUE — `tick-stock-panel` AI feature。** #2 coverage execution gate 尚未修完；新的 AI UX 不應放大不可信 market scope。
9. **DEFER — full team-memory product。** Reese-max 目前更需要把 cross-project memory trust/activation做對，再決定是否提供 shared team UI。
10. **DEFER — vector-store anomaly dashboard。** 有用但不是 MVP；先定義 exact lifecycle / admission / repair contract。

---

# Issue Mapping

| Repository | Issue / item | This round | Mapping |
|---|---|---|---|
| adng-memory | #4 Memory Activation / Staleness / Deletion Contract | **UPDATED** | 加入 Memory Poisoning / Origin-aware Admission / retrieval composition / permission boundary / MemorySecurityReceipt |
| claude-mem | no matching Reese-max issue found | research signal only | candidate consumer / pilot，暫不 duplicate |
| autodev-ng | existing execution/permission/steering work | adjacent | future durable-memory writer must not let memory grant authority |
| skill-foundry | existing package security attestation | adjacent | skills that can write durable memory should declare capability + security boundary |
| avatar-vfo | existing continuity regression | adjacent | structured memory should preserve origin/trust, not only persona continuity |
| ninax-line-hermes | existing message revision lifecycle | adjacent | external messages must not silently become durable privileged instruction |
| cf-mcp-server | #9 / #5 | existing blocker | no new competitive issue; OAuth/abuse correctness first |
| tick-stock-panel | #2 | existing blocker | no new AI expansion until server-side coverage gate |

### Coordination result

- `adng-memory #4` previous `github-issue-lock:v1` lease expired on 2026-09-07; no active lock was taken over.
- 本輪只補充既有 Research Issue 與 central radar report。
- 沒有修改產品原始碼、建立實作 branch、merge、deploy、secret、permission 或 repository settings。

---

# Sources

## CONFIRMED / primary or vendor-primary
- Palo Alto Prisma AIRS — August 2026 / Memory Poisoning Detection for AI Agents: https://docs.paloaltonetworks.com/ai-runtime-security/new-features/by-date/prisma-airs/august-2026
- OWASP Agent Memory Guard: https://owasp.org/www-project-agent-memory-guard/
- Tencent Cloud Team Memory announcement, 2026-08-13: https://www.prnewswire.com/apac/news-releases/tencentdb-agent-memory-tops-20-000-github-stars-in-90-days-launches-team-memory-for-multi-agent-collaboration-302850576.html

## CONFIRMED_RESEARCH
- eTAMP / Poison Once, Exploit Forever, 2026-04-03: https://arxiv.org/abs/2604.02623
- When Claws Remember but Do Not Tell, 2026-07-06: https://arxiv.org/abs/2607.05189
- MemPoison, 2026-07-16: https://arxiv.org/abs/2607.14651
- MemSecBench, 2026-07-29: https://arxiv.org/abs/2607.27080

## Evidence handling
- Vendor benchmark/adoption claims are not used as Reese-max expected performance.
- Academic attack-success percentages are not treated as market prevalence or Reese-max risk rate.
- Community discussion, where considered, is anecdotal failure-mode evidence only.

---

# What Changed Since Last Radar

Compared with `2026-09-09-external-radar-r7.md`:

1. **No new independent feature Issue was created.** r7 added legal `AuthorityReceipt / SourceSpan`; r8 instead identified a high-value memory-security signal that belongs inside existing `adng-memory #4`.
2. `adng-memory #4` is now broader and more precise: lifecycle correctness (`stale/supersession/deletion`) + **security admission (`origin/quarantine/poisoning`)**。
3. Portfolio-wide memory principle changed from「memory needs version/lifecycle」to **「memory needs an authority boundary」**。
4. Direct market signal changed from legal provenance to **Team/Shared Memory**；adjacent signal changed to **persistent-memory-specific red teaming/runtime guard**；emerging technical signal is **environment/email → durable memory → later action poisoning**。
5. `claude-mem` / `autodev-ng` / `avatar-vfo` / `herdr-skills` / `ninax-line-hermes` now receive the same reusable primitive without creating five separate Issues。
6. `cf-mcp-server` and `tick-stock-panel` remain blocked by their newest correctness regressions; no competitive feature expansion was allowed to jump ahead of those trust gates。

## Portfolio principle added this round

**「記得」不是一種授權。**

Persistent memory 的安全模型不應是：

`stored → retrieved → trusted → acted on`

而應是：

`observed → provenance/origin → candidate → admission → active context → retrieval composition check → independent action authorization → receipt`

只要 source、memory revision、admission policy、retrieval set 或 permission head 其中任何一項失效，後續 consumer 都必須能得到 `STALE / QUARANTINED / REVIEW_REQUIRED / REJECTED / CANNOT_VERIFY`，而不是默默沿用舊 authority。
