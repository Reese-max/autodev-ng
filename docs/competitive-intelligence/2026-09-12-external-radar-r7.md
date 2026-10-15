# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-12 r7

> Scope: `Reese-max` repositories that are owned by Reese-max, not archived, and can reasonably be treated as products.  
> Evidence discipline: public-web evidence outside Reese-max GitHub is the primary research source. Connected GitHub is used for current product truth, recent changes, duplicate/PR/lock coordination, and persistence.  
> Confidence labels: **CONFIRMED** = directly supported by first-party product/docs/release material or current repository evidence; **LIKELY** = announced/strong inference but not yet verified as shipped; **COMMUNITY_SIGNAL** = anecdotal practitioner/community evidence only; **UNKNOWN** = insufficient evidence.  
> Vendor benchmark/marketing claims are product signals only and are not used as Reese-max performance targets.

## Executive Summary

This round rechecked the same **37 non-archived product-like repositories**. Connected-GitHub commit search did not show a newer product commit after the r6 research window, so the product→market baseline is materially unchanged. GitHub Issue state is not unchanged, however: `autodev-ng` still has open reliability gates #13/#14/#15/#16, and this round created one new **research-only** opportunity after open/closed Issue, all-state PR and `github-issue-lock:v1` duplicate checks.

The strongest external convergence is around **real browser sessions becoming a delegated agent capability instead of an all-or-nothing tool attachment**:

1. **A — Direct competitor / current capability:** GitHub Copilot code review can now make an approval assessment for every review and, if administrators explicitly enable it, submit an approval that counts toward branch requirements. Authority is off by default, can be scoped at enterprise/org/repository/path level, and a new commit dismisses the old approval. This is an important freshness/scope model for all agent authority, not a reason to auto-merge.
2. **B — Adjacent product/workflow:** Tabbit exposes live page/tab context, visible browser execution, separate task groups, permission states that distinguish reading from submission, and human handoff before login/purchase/send/delete-style consequential steps. The person can take the tab back and later resume without reconstructing the context.
3. **C — Emerging technical pattern:** Tencent BrowserSkill connects Codex/Claude Code/Cursor-class agents to an already logged-in browser while documenting a bounded session lifecycle, a separate Agent Window, explicit `borrow`/`return` for an existing user tab, and `request-help` for login/CAPTCHA/OTP/payment/confirmation. Its docs also forbid extracting credentials/cookies/tokens. This is open-source design evidence, not proof that every implementation path is perfectly contained.

The high-value Reese-max opportunity is therefore **not “add Chrome automation.”** It is a missing canonical contract between existing controls:

`TaskIntent → BrowserCapabilityRequest → bounded browser surface → BrowserCapabilityLease → Agent read/prepare → #12 ExternalEffect gate or HUMAN_TAKEOVER → fresh read-back → Return/Expire → BrowserLeaseReceipt`

A signed-in browser is a **stateful ambient-authority surface**. Network reachability, principal identity and execution environment do not by themselves answer which profile/window/tab was loaned, whether the agent currently has active control, when a human temporarily owns the tab, or whether that authority was actually returned/revoked.

After duplicate/lock checks, a new research Issue was created:

- `Reese-max/autodev-ng #28` — **[Competitive Inspiration][Research][RESEARCH_REQUIRED][SECURITY][WORKFLOW] Browser Capability Lease + Human Takeover Receipt** — **Opportunity Score 92/100**.

The Issue explicitly depends on #12 (external effects), #17 (principal/credential identity), #21 (environment truth), and current reliability #13/#14/#15/#16. It does **not** authorize a production browser extension, cookie/session export, whole-profile takeover, implementation branch, merge, deploy, secrets or repository-settings changes.

**Notification gate: MET.** This is a new, cross-portfolio reusable capability with direct public-product evidence, a distinct non-duplicate fingerprint, and a clear manual workflow/security gap.

---

# Portfolio Discovery / Product → Market Category

Current active product-like portfolio remains **37 repositories**. No post-r6 repository commit materially changes the following mapping.

| Product | Market / JTBD | Current radar priority |
|---|---|---|
| `exam-archive` | exam archive/search | Completeness, source lineage and retrieval reliability before new modes. |
| `police-exam-practice` | police-exam practice | Source correctness, progress continuity and wrong-answer repair. |
| `police-exam-archive` | Taiwan police-exam archive | Provenance/completeness/search traceability. |
| `92-duty-scheduler` | duty/workforce scheduling | Existing repair-plan, PolicySpec/Rule Studio and self-service duty inbox before more channels. |
| `UkePack` | music/ukulele creative tooling | Reversible candidate→canonical artifact flow; no broad AI suite. |
| `ppt-studio` | presentation generation/studio | Auth/CI trust gate before remote-agent or collaboration breadth. |
| `voice-actress` | legal/knowledge answer workflow | Citation existence/support/claim-evidence separation. |
| `taiwan-intel-dashboard` | Taiwan intelligence dashboard | Evidence/source health + typed handoff. |
| `autodev-ng` | multi-engine autonomous-development control plane | **NEW #28 Browser Capability Lease** layered on #12/#17/#21; reliability #13–#16 remains hard gate. |
| `flux-image-gen` | image generation/edit workflow | #22 edit sessions/reference tray; preserve candidate/branch/compare rather than model-count race. |
| `claude-mem` | coding-agent memory | Provenance/staleness/activation over raw transcript accumulation. |
| `lobsterpulse` | multi-agent/provider operations monitoring | #9 decision-only attention queue; do not add more raw alerts. |
| `prompt-autoresearch` | prompt research/evaluation | Existing failure attribution/countermeasures + stability/promotion work already covers error-guided optimization. |
| `neciken-summer-poem` | creative literary experience | Protect narrow artistic identity; do not become generic writing SaaS. |
| `note-filler` | document/note automation | User-owned vs AI-candidate fields, source health and review. |
| `lplrs-judicial-sync` | judicial-data synchronization | Target-date coverage/no-success/backfill receipts before feature expansion. |
| `adng-memory` | cross-repo operational memory/state | Activation, staleness, supersession and deletion lifecycle. |
| `cyber-prep-coach` | cybersecurity exam prep | Exam-version/mastery/content-quality work; avoid extra modes. |
| `cf-ai-router` | AI gateway/free-quota/provider routing | Deterministic capability/reliability and model lifecycle; provider policy remains gateway-scoped. |
| `avatar-vfo` | avatar/visual-output workflow | Candidate→canonical control and exportability. |
| `project-doctor-web` | project diagnosis/quality review | Failure→repro→verification, not another dashboard layer. |
| `minideck` | lightweight AI deck creation/share/export | Draft/public lifecycle and provenance before agent mutation breadth. |
| `chatgpt-dual-pipeline` | dual-model/reviewer workflow | Independent evidence/reviewer separation. |
| `internship-notes-sites-mirror` | internship-notes publishing | Stable publishing/source provenance. |
| `taichung-police-intel` | municipal/police intelligence monitoring | Evidence contract + transport-neutral distribution; avoid duplicate MCP surface. |
| `soundbox-offline` | local/offline music player | Recovery/integrity ahead of NAS/network-source expansion. |
| `skill-foundry` | Skill creation/evaluation/certification | Certified distribution/install receipts; browser Skills must not mint browser authority. |
| `video-timeline-pipeline` | video transcript/timeline/NLE workflow | Existing evidence-backed Paper Cut / NLE handoff owns latest editing signal. |
| `ai-novel-workstation` | long-form creative writing workstation | #6 typed story workspace contract; CI #5 remains prerequisite. |
| `clinical-scribe-worker` | clinical drafting/SOAP/validation | Human review, de-identification and traceable normalization before more dictation breadth. |
| `MaterialYouNewTab` | new-tab productivity/workspace | Session Capsule opportunity remains research-only; preserve local-first/optional permissions. |
| `cf-mcp-server` | MCP/Cloudflare integration | Consent/auth/effect boundary; browser login handoff may consume #28 later, not fork it. |
| `tick-stock-panel` | market/portfolio panel | Coverage/freshness/partial-data truth over broad finance-chat features. |
| `herdr-skills` | agent Skill orchestration/reuse | Candidate/eval/distribution lifecycle; browser Skills reference capabilities, not raw sessions. |
| `ninax-line-hermes` | LINE/agent workflow integration | Identity/effect permission/safe handoff. |
| `ai-flight-radar` | flight watch/fare intelligence | Source/quote health, total-trip cost and reconfirmation; browser booking automation remains out of scope. |
| `academic-mcp` | academic research aggregation/MCP | Canonical paper identity + research-bundle ledger already owns multi-source reconciliation. |

---

# External Signals

## A. Direct Competitor — GitHub Copilot separates review assessment, approval authority, scope and freshness

**CONFIRMED — released 2026-09-01**  
Source: https://github.blog/changelog/2026-09-01-copilot-code-review-can-now-approve-pull-requests/  
Current docs checked 2026-09-12: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review

GitHub Copilot code review now provides an approval assessment on every Copilot review. Actual `Approve` authority is different: it is **off by default**, can be enabled/disabled at enterprise, organization and repository levels, and repository administrators can scope which file paths Copilot approvals count for. If a new commit arrives after Copilot approves, the old approval is dismissed and a fresh review can be requested.

### JTBD
Reduce review latency while keeping an explicit administrative decision over whether an AI review has merge-gate authority.

### Why it can save time / steps
Teams receive a compact readiness assessment alongside detailed review comments, and low-risk repositories/paths can optionally count AI approval without a separate manual approval step.

### Onboarding / distribution
No new review application: the feature appears in the existing pull-request review surface and reuses branch-protection semantics.

### New capability pattern
`Observation/Assessment ≠ Authority ≠ Scope ≠ Freshness`.

### Pricing / business signal
The public-preview capability is available across Copilot Pro/Pro+/Max/Business/Enterprise plans. This is packaging evidence only, not proof that AI approval improves defect rates.

### Limits / failures
- approval is preview functionality and subject to change;
- an assessment alone does not satisfy merge requirements;
- a new commit makes the prior approval stale;
- the product does not justify treating the same AI actor as author+reviewer+merger in Reese-max.

### Reese-max fit / do not copy
`autodev-ng` already has independent review/evidence and human merge/deploy gates. The useful transfer is **explicit authority state and stale-on-change semantics**. Do **not** turn AI approval into automatic merge or weaken independent reviewer separation.

**Disposition:** no new Issue; MATCH/SHOULD-BE-BETTER through existing reviewer/evidence contracts.

---

## B. Adjacent Workflow — Tabbit makes browser context, permission boundaries and handoff part of the same workflow

**CONFIRMED — current product checked 2026-09-12**  
Sources:
- https://go.tabbit.ai/browser-use-ai-agent
- https://go.tabbit.ai/what-is-tabbit-browser
- Product Hunt current listing: https://www.producthunt.com/products/tabbitai

Tabbit's current browser-agent surface makes the browser task visible as an operator loop:
- observe the live page/current tab;
- decide/act inside a separate task group;
- keep a permission ledger that distinguishes reading/opening from entering details and submit/purchase;
- pause and hand control back for logins, messages, purchases and irreversible changes;
- let the person manually use the tab without losing the task context;
- resume or close with an execution trail/replay;
- reference existing pages/tab groups/screenshots/bookmarks/local files directly instead of copy/pasting them into another chat.

The current Product Hunt listing additionally positions Tabbit as a browser that can work across pages/files now or on a schedule and save a workflow as a reusable Skill. Maker-provided benchmark numbers are **not** used here as efficacy evidence.

### JTBD
Use the live browser context the person already has, automate mechanical web work, and involve the human only where judgment/authentication/consequence requires it.

### Why it can save time / steps
The user does not have to repeatedly copy URLs/page text into an external agent, then manually rediscover the same page when a sensitive action is needed.

### Onboarding / distribution
Browser-native: context, automation, replay and human takeover are in the same surface rather than split between a terminal bot and a remote browser dashboard.

### Capability pattern
`Current Browser Context → bounded task surface → agent preparation → permission boundary → human takeover → resume → visible trail`.

### Limits / complaints
Tabbit's product pages describe intended capability/UX, not independently verified security containment. Its own materials advise reviewing sensitive actions; therefore Reese-max must not treat “visible agent UI” as proof of least privilege.

### Reese-max fit
This reveals a missing cross-engine contract in `autodev-ng`: browser context/control should be leased as a **typed, scoped stateful capability**, not inferred from “browser tool connected.”

**Opportunity Score: 92/100.**  
Disposition: **NEW — `autodev-ng #28`**.

---

## C. Emerging Tool / Technical Pattern — BrowserSkill borrows one already-authenticated tab and returns it

**CONFIRMED design/API intent — current docs checked 2026-09-12**  
Sources:
- https://github.com/Tencent/BrowserSkill
- https://github.com/Tencent/BrowserSkill/blob/main/skill/SKILL.md

Tencent BrowserSkill currently documents a local CLI/daemon + extension bridge for shell-capable agents including Codex, Claude Code and Cursor. The relevant product/architecture pattern is unusually concrete:

- each task owns a bounded browser session with explicit start/stop;
- normal automation runs in a separate visible Agent Window;
- user-window tabs are protected unless explicitly listed and `borrow`ed;
- a borrowed tab should be `return`ed after the relevant step;
- login/CAPTCHA/OTP/payment confirmation or human-only steps invoke `request-help` instead of brute force;
- after human control returns, the agent must make a fresh observation before reusing page state;
- the Skill instructs the agent not to extract credentials, cookies or tokens;
- a recorded trace can guide the task but does not expand the user's goal.

### JTBD
Reuse real logged-in browser state without forcing a separate test account/cloud login and without automatically handing over every normal user tab.

### Why it can save steps
Login state stays in the browser; the agent can borrow only the page that already has the required context, and the person can handle human-only challenges without re-onboarding the task.

### New product possibility
Treat a signed-in tab as a **temporary capability lease** with surface, action class, TTL, takeover and return state.

### Limits / do not copy
The GitHub docs prove intended workflow/API semantics, not that extension/CDP permissions are physically limited to exactly one tab in all cases. Reese-max must independently verify runtime scope and retain `UNENFORCED/UNKNOWN` if the underlying browser permission is broader.

**Disposition:** supports #28; no separate browser-tool repository/Issue.

---

## D. Adjacent Governance — model/provider connectivity is increasingly governed centrally, not inferred per request

### D1. Notion model controls

**CONFIRMED — 2026-09-09; related suggest-edits release 2026-08-28**  
Source: https://www.notion.com/releases/2026-09-09

Workspace owners can separately control which AI models Personal/Custom Agents may use and set a Custom Agent default. The prior Aug 28 release lets agents **suggest edits instead of directly applying them**.

Transferable principle: `tool/model connected ≠ mutation authority`.

### D2. Vercel AI Gateway provider allowlist

**CONFIRMED representative pattern — 2026-05-28**  
Source: https://vercel.com/changelog/team-wide-provider-allowlist-on-ai-gateway

Vercel's team-wide provider allowlist is enforced at the Gateway—including BYOK/coding-agent traffic—and request-level filters cannot expand beyond it. New providers are disabled by default once the allowlist is active.

This is older than the preferred 30–90 day window but remains representative of gateway-level governance. `cf-ai-router` already has provider/capability/lifecycle research, so no duplicate feature is opened.

---

# New Releases / Market Changes

| Date | Product / ecosystem | Signal | Confidence | Reese-max implication |
|---|---|---|---|---|
| 2026-09-09 | Notion | Workspace owners govern Personal/Custom Agent model roster/defaults | CONFIRMED | Central capability policy is stronger than request-time prompt convention. |
| 2026-09-01 | GitHub Copilot | Code review can optionally submit approval; off by default, scoped, stale after new commit | CONFIRMED | Freshness/scope/authority must be explicit; do not auto-merge. |
| Current, checked 2026-09-12 | Tabbit | Browser-agent permission ledger, isolated task groups, takeover/replay, direct tab/file context | CONFIRMED | Browser state should become a bounded leased capability. |
| Current, checked 2026-09-12 | Tencent BrowserSkill | Session start/stop, Agent Window, explicit tab borrow/return, human-help flow | CONFIRMED design intent | Strong emerging primitive for browser lease/takeover/return receipts. |
| 2026-08-14 | BrowserAct Cloud (Product Hunt launch) | Prompt-driven web automation/cloud browser product layer | CONFIRMED listing | Browser execution is becoming a reusable agent infrastructure layer; do not bind core contract to one vendor. |
| Current, checked 2026-09-12 | Nimbus/Product Hunt | Per-task sessions/history; asks user for cost/captcha/ambiguous decisions | CONFIRMED listing | Human judgment queue is converging with browser-session isolation; reinforces #9 + #28. |

---

# Community Pain Points

## Browser state is harder than “the model knows what to do”

**COMMUNITY_SIGNAL — Reddit, 2026-07-15**  
https://www.reddit.com/r/AI_Agents/comments/1uwy8v5/for_browser_agents_session_state_seems_harder/

A practitioner describes practical failures around keeping the correct login session, page-layout changes, duplicate controls and confirming whether a submit actually happened. Their preferred pattern is:

`research/prepare freely → pause before final external action → after action reopen direct page and verify`.

A later reply mentions session expiry/rotation breaking persistent-profile automation. This is anecdotal evidence only; it does not establish prevalence or a failure rate.

### Product implication
The important state machine is not simply `browser connected / disconnected`. It must distinguish authenticated-state freshness, active-control ownership, pre-effect confirmation and post-effect verification.

---

# Adjacent Ideas

## 1. Browser Capability Lease as a canonical shared primitive — NEW HIGH VALUE

`TaskIntent → BrowserCapabilityRequest → selected task surface → BrowserCapabilityLease → read/prepare → #12 effect gate or HUMAN_TAKEOVER → fresh observation → return/expire → BrowserLeaseReceipt`

Potential consumers: `autodev-ng`, `cf-mcp-server`, `herdr-skills`, `skill-foundry`, `ai-flight-radar`, `MaterialYouNewTab`, `ninax-line-hermes`.

Key separations:
- browser reachable ≠ tab authorized;
- tab authorized ≠ active control;
- active control ≠ external write approval;
- logged-in state ≠ exportable credential;
- human takeover ≠ credential transfer;
- selector/reference ≠ durable authorization;
- action attempted ≠ effect confirmed.

## 2. Stale-on-change authority — MATCH / reuse

GitHub's Copilot approval is dismissed after new commits. The same principle belongs in browser control, data edits, story patches and form suggestions: a material base change invalidates prior approval/context rather than silently reusing it.

## 3. Agent skill should declare capability requirements, never mint them — SHOULD BE BETTER

Tabbit/BrowserSkill show browser workflows becoming Skills. Reese-max should allow a Skill to declare `requires: browser.read/tab.borrow/...`, but `skill-foundry` certification/install must not create browser, credential or effect authority. Capability grant remains runtime/policy-owned.

## 4. Minimal evidence for sensitive surfaces — SHOULD BE BETTER

Browser receipts should default to metadata: lease ID, opaque tab ref, origin class, lifecycle transition, effect receipt IDs. Avoid retaining full DOM/screenshots/form values unless explicitly required and privacy-reviewed.

---

# Opportunity Scores

Scoring dimensions: User Pain, Strategic Fit, Novelty, Evidence Strength, Reuse Potential, Implementation Effort controllability, Security/Privacy/Cost Risk controllability.

| Candidate | Pain | Fit | Novelty | Evidence | Reuse | Effort ctrl | Risk ctrl | Score | Disposition |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Browser Capability Lease + Human Takeover Receipt | 9 | 10 | 9 | 10 | 10 | 8 | 8 | **92** | **NEW #28** |
| Central model/provider governance contract | 8 | 9 | 7 | 10 | 9 | 8 | 9 | 87 | Existing `cf-ai-router` / runtime policy direction; no duplicate |
| Stale-on-change AI approval/promotion semantics | 8 | 10 | 7 | 10 | 10 | 9 | 9 | 90 | Existing review/candidate contracts; integrate, no new Issue |
| Prompt Failure Atlas / error-cohort mutation | 8 | 9 | 7 | 9 | 7 | 8 | 9 | 82 | **Rejected as duplicate:** `prompt-autoresearch` already has failure classes/countermeasures + stability work |
| Clinical ubiquitous dictation expansion | 8 | 7 | 5 | 9 | 5 | 6 | 5 | 69 | Existing clinical validation/de-id/auth work first |
| Full Reese-max AI browser | 7 | 4 | 4 | 8 | 5 | 2 | 2 | 46 | **DO NOT BUILD** |
| Auto-enable AI PR approval/merge | 6 | 4 | 4 | 10 | 5 | 8 | 3 | 57 | **DO NOT COPY**; independent reviewer/human merge remains safer product posture |

---

# Opportunity Map — All 37 Products

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| `exam-archive` | Source-complete searchable archive | Source/date/page provenance | Taiwan exam traceability | Stale-on-source-change receipt | Generic AI chat over incomplete corpus |
| `police-exam-practice` | Stable practice/progress | Wrong-answer→source repair | Police-exam-specific provenance | Candidate explanations with freshness | More redundant modes |
| `police-exam-archive` | Search/index/source | Completeness accounting | Official-source traceability | Evidence bundle export | Scraped answer without source |
| `92-duty-scheduler` | Conflict-aware scheduling | PolicySpec + human-confirmed repairs | Auditable duty-rule decisions | Human-owned vs AI-candidate fields | Black-box auto-roster overriding confirmed facts |
| `UkePack` | Useful music artifacts | Reversible generation/editing | Small focused creative workflow | Candidate artifact branch/compare | Generic creator suite |
| `ppt-studio` | Editable deck output | Source→claim→layout evidence | Local/custom production control | Candidate suggestion mode | Remote-agent breadth before auth/CI is green |
| `voice-actress` | Correct legal answers | Citation-support verification | Exact source spans + unresolved state | Stale-on-law/source-change review | Citation existence = correctness |
| `taiwan-intel-dashboard` | Fresh multi-source intel | Source health + typed provenance | Taiwan-specific operational synthesis | Decision-only attention | Feed volume as product value |
| `autodev-ng` | Reliable multi-engine execution | **Browser lease + effect/principal/environment separation** | Evidence-first local control plane | Browser Skill capability declarations | Whole-profile browser authority / AI auto-merge |
| `flux-image-gen` | Strong generation/edit | Session/reference/branch/compare | Local lineage + candidate promotion | Spatial intent + outside-region drift check | Latest output silently overwrites clean parent |
| `claude-mem` | Useful memory retrieval | Provenance/staleness/supersession | Coding-agent memory truth | Background consolidation receipts | Transcript == memory |
| `lobsterpulse` | Accurate provider/session state | Decision-only attention | Cross-agent normalized operational view | Browser takeover attention item | AI summary on every event |
| `prompt-autoresearch` | Repeatable eval/evolve | Variance/stability promotion | Taiwan-answer rubric + failure classes | Structural error cohorts | New issue duplicating existing failure diagnosis |
| `neciken-summer-poem` | Polished literary experience | Small reversible creative enhancements | Distinct artistic identity | Optional local creative branch | General-purpose AI writing suite |
| `note-filler` | Reliable source→field fill | USER_OWNED / AI_CANDIDATE / UNKNOWN | Traceable field evidence | Browser lease for bounded web-form handoff | Silent overwrite of human correction |
| `lplrs-judicial-sync` | Scheduled official-data capture | Target-date coverage receipt/alarm | Exact gap accounting | Browser fallback only if explicitly evidence-backed | Assuming schedule run == data coverage |
| `adng-memory` | Durable operational memory | Activation/staleness/deletion lifecycle | Cross-repo evidence-linked state | Consolidation + supersession receipt | Permanent accumulation of stale facts |
| `cyber-prep-coach` | Exam-aligned practice/mastery | Exam-version/progress migration | Source-traceable learning map | Candidate migration preview | More home-screen modes |
| `cf-ai-router` | Deterministic provider routing | Capability/lifecycle/cost truth | Free/low-cost evidence-aware router | Org provider allowlist semantics | Request hint treated as hard policy |
| `avatar-vfo` | Reproducible visual output | Candidate/canonical/export controls | Focused avatar workflow | Revision lineage | Model-count feature race |
| `project-doctor-web` | Actionable diagnosis | Repro/evidence/verification | Project-health evidence | Browser canary as bounded fixture | Dashboard without reproducible finding |
| `minideck` | Fast editable deck creation | Explicit draft/public state | Lightweight deck lifecycle | Suggest-not-publish agent mode | Agent silently republishes deck |
| `chatgpt-dual-pipeline` | Two-model workflow | Independent writer/reviewer identity | Review separation | Stale-on-change reviewer receipt | Same actor writes+approves silently |
| `internship-notes-sites-mirror` | Stable public mirror | Source/edition traceability | Internship-specific structured publishing | Explicit publish candidate | SaaS collaboration breadth |
| `taichung-police-intel` | Timely municipal/police signals | Evidence/source-health/dedup | Operational Taiwan context | Attention queue + typed handoff | More feeds without decision value |
| `soundbox-offline` | Reliable offline playback/library | Recovery/integrity | Local/offline ownership | Network source after integrity gate | Cloud subscription clone |
| `skill-foundry` | Eval/certify reusable Skills | Install/read-back/drift receipts | Evidence-backed Skill lifecycle | Declare browser capability requirement | Skill installation grants browser/credential authority |
| `video-timeline-pipeline` | Transcript/timeline accuracy | Evidence-backed Paper Cut/NLE handoff | Source-linked rough-cut artifacts | Candidate sequence diff | Duplicate Adobe Paper Edit Issue |
| `ai-novel-workstation` | Canon/continuity/quality | Typed external-AI candidate patch | Local canonical story production loop | Browser research lease later | Raw filesystem mutation by AI |
| `clinical-scribe-worker` | Draft→clinician review | Critical-slot/normalizer/de-id trace | Fail-closed clinical candidate workflow | Browser dictation/handoff only after auth/privacy gates | “Dictated” == clinically verified |
| `MaterialYouNewTab` | Fast local new-tab workspace | Session Capsule/restore truth | Minimal-permission local-first UI | Optional bounded agent task group | Broad history/all-URLs permission by default |
| `cf-mcp-server` | Correct MCP auth/consent | Exact target/effect confirmation | Cloudflare-integrated typed permissions | Consume BrowserLease for browser-only auth later | Export session cookies into MCP context |
| `tick-stock-panel` | Accurate market panel | Coverage/freshness/partial-data truth | Honest portfolio/data state | Governed source entitlement | AI narrative hiding stale/partial data |
| `herdr-skills` | Reusable multi-agent Skills | Candidate/eval/install lifecycle | Cross-agent orchestration | Browser Skill declares lease requirements | Skill text as permission grant |
| `ninax-line-hermes` | Useful LINE agent workflow | Identity/effect/safe handoff | Channel-native automation | Human-takeover item via attention queue | Chat message treated as unlimited authority |
| `ai-flight-radar` | Reliable fare watch | Source/quote health + total-trip cost | Intent→watch→alert truth | Browser lease for **research/reconfirm only** | Auto-book/rebook from ambient login |
| `academic-mcp` | Multi-source paper retrieval | Canonical identity + versioned bundle | Conflict/rate-limit-aware research evidence | Browser lease only for bounded paywalled/user-open page research | “No result” when source is rate-limited |

---

# Top 10 Cross-Portfolio Ideas

1. **Browser Capability Lease + Human Takeover Receipt** — NEW #28; reuse wherever a real signed-in browser becomes an Agent tool.
2. **ExternalEffectSpec / effect firewall (#12)** — every browser/API/MCP mutation remains an independent effect decision.
3. **Principal / Credential Lease (#17)** — actor identity and shared/dedicated credential truth remain separate from browser state.
4. **Execution Environment Contract (#21)** — browser locality/capability must be observed, not assumed transferable to cloud.
5. **Decision-only Attention Queue (`lobsterpulse #9`)** — browser takeover/CAPTCHA/ambiguous-effect items should become actionable decisions, not raw event spam.
6. **Stale-on-change authority** — commit/page/base revision change invalidates prior approval/candidate assumptions.
7. **Candidate mutation before canonical mutation** — Notion suggest-edits, writing/form/deck workflows all reinforce proposal→review→promote.
8. **Skill declares capability requirement, runtime grants capability** — Skill Foundry/Herdr should never mint browser/network/credential authority.
9. **Minimal evidence by default on sensitive surfaces** — receipts store metadata/hashes/state, not full DOM/form/prompt/secret content.
10. **UNKNOWN/UNENFORCED remain product states** — if an extension/CDP/browser provider cannot prove scope, do not display a false least-privilege badge.

---

# Ideas Rejected / Deferred

## 1. Build a Reese-max AI browser
**REJECT.** Tabbit/Nimbus/BrowserAct prove a market, not a reason for `autodev-ng` to own browser rendering/UI. The transferable primitive is browser-capability governance.

## 2. Export/import cookies so agents can move between machines
**REJECT.** Conflicts with #17/#21 truth model and increases credential leakage. A local signed-in browser may correctly remain `LOCAL_ONLY`.

## 3. Let a Browser Skill grant itself control
**REJECT.** Skill/package intent may declare `requires browser`, but runtime policy/user selection grants the surface and action class.

## 4. Auto-enable Copilot-style AI approval as Reese merge authority
**REJECT.** Current Reese-max value is independent evidence/reviewer separation and human merge/deploy gates. GitHub's own product keeps approval authority opt-in and stale-on-change.

## 5. New Prompt Failure Atlas Issue
**REJECT AS DUPLICATE.** Current `prompt-autoresearch` already classifies failure types, records sample errors/countermeasures, feeds dominant failures back into candidate generation, and existing research covers variance-aware promotion.

## 6. New Clinical Dictation Issue
**DEFER / duplicate.** Current clinical workflow already owns clinician review, critical fields, de-identification, audit and normalizer trace; auth/privacy/validation are higher priority than another input mode.

## 7. Generic portfolio-wide model-roster UI
**DEFER.** Notion/Vercel validate central governance, but `cf-ai-router` and owning runtimes should expose actual provider/model capability truth first; a global settings UI without enforcement would create policy theater.

---

# Issue Mapping / Coordination

| Opportunity / signal | Owning repository | Mapping | Coordination result |
|---|---|---|---|
| Browser Capability Lease + Human Takeover | `autodev-ng` | **#28 NEW** | Duplicate search clean; research-only; blocked from production breadth by #13/#14/#15/#16 |
| External browser mutation effect | `autodev-ng` | #12 EXISTING | Browser control never bypasses effect policy |
| Browser actor / credential identity | `autodev-ng` | #17 EXISTING | Browser lease references principal; does not claim dedicated auth |
| Local/cloud browser availability | `autodev-ng` | #21 EXISTING | Browser state may remain local-only; no cookie migration |
| Human intervention / exact execution | `autodev-ng` / `lobsterpulse` | #11 / #9 EXISTING | Takeover can later surface through exact execution + decision-only attention |
| Browser Skills | `skill-foundry` / `herdr-skills` | existing Skill lifecycle | Declare requirements only; no permission minting |
| AI PR approval | `autodev-ng` | existing reviewer/merge gates | No new Issue; retain independence/human gate |
| Model/provider allowlist | `cf-ai-router` | existing capability/lifecycle work | No duplicate |
| Prompt error-cohort optimization | `prompt-autoresearch` | existing code + #3/#4 direction | No duplicate |
| Browser booking/reprice | `ai-flight-radar` | research list only | Do not auto-book from ambient session |

**Lock discipline:** before #28 creation, open/closed Issue search, all-state PR search and `github-issue-lock:v1` search found no same-fingerprint BrowserCapabilityLease / authenticated-tab-borrow / human-takeover contract in `autodev-ng`. No product source code, implementation branch, merge, deploy, secrets, permissions or repository settings were changed.

---

# Sources

## First-party / primary public web
1. GitHub Changelog — Copilot code review can approve pull requests, **2026-09-01**  
   https://github.blog/changelog/2026-09-01-copilot-code-review-can-now-approve-pull-requests/
2. GitHub Docs — Copilot code review / approvals, checked **2026-09-12**  
   https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review
3. Notion Releases — model controls, **2026-09-09**; suggest-edits item **2026-08-28**  
   https://www.notion.com/releases/2026-09-09
4. Tabbit — Browser-Use AI Agent, checked **2026-09-12**  
   https://go.tabbit.ai/browser-use-ai-agent
5. Tabbit — What Is Tabbit Browser, checked **2026-09-12**  
   https://go.tabbit.ai/what-is-tabbit-browser
6. Vercel — Team-wide provider allowlist on AI Gateway, **2026-05-28** (older representative pattern)  
   https://vercel.com/changelog/team-wide-provider-allowlist-on-ai-gateway

## Product/discovery ecosystem
7. Product Hunt — Tabbit AI, current listing checked **2026-09-12**  
   https://www.producthunt.com/products/tabbitai
8. Product Hunt — BrowserAct, including Cloud launch **2026-08-14**  
   https://www.producthunt.com/products/browseract
9. Product Hunt — Nimbus agentic browser, current listing checked **2026-09-12**  
   https://www.producthunt.com/products/nimbus-10

## Emerging open-source technical evidence
10. Tencent BrowserSkill repository, checked **2026-09-12**  
    https://github.com/Tencent/BrowserSkill
11. Tencent BrowserSkill `SKILL.md`, checked **2026-09-12**  
    https://github.com/Tencent/BrowserSkill/blob/main/skill/SKILL.md

## Community / anecdotal only
12. Reddit r/AI_Agents — browser-agent session-state discussion, **2026-07-15**  
    https://www.reddit.com/r/AI_Agents/comments/1uwy8v5/for_browser_agents_session_state_seems_harder/

---

# What Changed Since Last Radar (r6 → r7)

1. **Portfolio count unchanged:** still 37 non-archived product-like Reese-max repositories.
2. **Repository commit truth materially unchanged after r6:** no newer product commit changed the market mapping during this research window.
3. **New high-value opportunity:** `autodev-ng #28` Browser Capability Lease + Human Takeover Receipt, **92/100**.
4. **New market convergence:** browser-agent products/tools increasingly expose task surfaces, explicit consequential-action boundaries, human takeover and session return rather than only “browser connected.”
5. **New direct-competitor governance signal retained:** GitHub Copilot's AI approval separates assessment, authority, scope and freshness; Reese-max should copy the separation, not the auto-approval behavior.
6. **Cross-portfolio architecture sharpened:** #12 external effect, #17 principal/credential, #21 environment and #28 browser state are intentionally separate contracts.
7. **No new prompt-optimizer Issue:** current `prompt-autoresearch` already implements targeted failure classification/countermeasures; external structural-error research is validation, not a new gap.
8. **No reliability shortcut:** `autodev-ng` #13/#14/#15/#16 remain open; #28 is explicitly research-only until those gates are restored.
9. **No product code or settings mutations:** only the research Issue and this central radar report were written.

---

# Portfolio Principle Added This Round

**`Browser Reachability ≠ Tab Authorization ≠ Active Control ≠ External-Effect Permission ≠ Verified Outcome`**

The reusable Reese-max shape is:

`Owner/Principal → Execution/Environment → BrowserCapabilityLease → Bounded Browser State → Human/Policy Decision → ExternalEffectSpec → Runtime Effect → Read-back Verification → BrowserLeaseReceipt`

This lets a long-running Agent use the browser context the user already has **without pretending that a logged-in profile is just another unrestricted tool or transferable credential bundle**.
