# External Competitive / Product Inspiration Radar — 2026-09-07 r6

> Scope: Reese-max owned, non-archived repositories. Public web outside Reese-max GitHub is the primary research source; repository/Issue/PR evidence is used to resolve product identity, readiness, duplication and safety. `COMMUNITY_SIGNAL` entries are anecdotal and are not market-share, efficacy or incident-rate claims.

## Executive Summary

Round 6 produced **one new Research Issue and one high-severity ISSUE_WRITE_BLOCKED finding**.

1. **`prompt-autoresearch` — variance-aware repeated evaluation / stability gate.** The repository already has Gatekeeper → Smoke → Dev → Holdout and evidence manifests, but the current route evolution promotes a candidate after a single candidate dev run plus a single candidate holdout run. Recent 2026 prompt-optimization research shows that optimizer improvements and variance can rise together; a peak score is not enough evidence of a stable champion. New Issue created: **`prompt-autoresearch #3`**.
2. **`openab` — ACP permission broker / human approval gate.** The product identity is now resolved: OpenAB is a Discord ↔ ACP coding-agent bridge. Current code automatically responds to `session/request_permission`, preferring `allow_always`, and the README’s Kiro example uses `--trust-all-tools`. Direct ACP competitors already present approve/deny buttons in chat, while current agent-platform permission models treat sensitive tools as explicit approval boundaries. This is a P1-class product/security gap. GitHub Issues are disabled for this repository, so the proposed Issue could not be created and is recorded as **ISSUE_WRITE_BLOCKED**.

Two additional external signals changed prioritization without creating tickets:

- **`MaterialYouNewTab`**: current 2026 new-tab competition is strongly local-first, privacy-first and intentionally lightweight. The Reese-max fork already has tasks, scratchpad, workspaces, focus, command palette, backup and accessibility; copying RSS/AI/feed breadth would move it toward feature bloat. Decision remains **KEEP LIGHT / SIMPLIFY**.
- **`UkePack`**: the prior authorization blocker was fixed on default branch in commit `436db728...`. The product already has practice audio, teacher review, private sharing and a teacher Beta trial packet. Soundslice’s recent practice-player changes are useful adjacent evidence, but they do **not** justify copying an interactive synchronized player before teacher Beta evidence shows that this is the next bottleneck.

The strongest new cross-portfolio pattern is:

> **An agent or optimizer should not be allowed to convert its own proposal into execution/promotion authority. Proposed action → explicit policy/evidence → independent gate → receipt.**

This applies to remote coding actions, prompt champion promotion, model/provider routing, Skill certification, deployment and other agentic workflows.

---

## Product → Market Category / Opportunity Map

| Repository | Category | r6 classification | Current decision |
|---|---|---|---|
| gemini-deidentifier | AI RPG / interactive fiction with repo-identity mismatch | SHOULD SIMPLIFY | Resolve identity before feature expansion |
| exam-archive | Exam archive / public reference | MUST MATCH | Provenance, reproducible build, performance first |
| police-exam-practice | Police-exam practice | SHOULD BE BETTER | Reuse learner-profile primitives instead of parallel learner state |
| police-exam-archive | Exam corpus / provenance archive | MUST MATCH | Preserve source/image/answer fidelity |
| 92-duty-scheduler | Constraint-based duty scheduling | DIFFERENTIATOR | Existing #19 explainable repair plans remains high value |
| **openab** | **Discord ↔ ACP remote coding-agent broker** | **MUST MATCH / SECURITY** | **Human permission broker; ISSUE_WRITE_BLOCKED because Issues disabled** |
| UkePack | MusicXML → child-friendly ukulele practice pack | SHOULD VALIDATE | Auth blocker fixed; use teacher Beta evidence before Phase 3 expansion |
| ppt-studio | AI presentation workstation | DIFFERENTIATOR | Existing #3 source/claim provenance remains the moat |
| book5-windows-server-2022 | Learning/content site | SHOULD SIMPLIFY | Build/accessibility/landing contract over AI breadth |
| obsidian-vault | Personal knowledge/content repository | ADJACENT IDEA | Interop only when it removes a concrete manual step |
| voice-actress | Essay grading/coaching | MUST VERIFY THEN IMPROVE | Runtime/calibration proof before more personalization |
| taiwan-intel-dashboard | Paused intelligence dashboard | DO NOT ADD NOW | Recovery/reliability posture remains dominant |
| autodev-ng | Multi-agent delivery orchestrator | SHOULD BE BETTER | Independent verification/receipts, not agent-count growth |
| flux-image-gen | AI image generation/edit workspace | DIFFERENTIATOR | Existing #18 artifact provenance remains active |
| claude-mem | Upstream memory fork | UPSTREAM FORK | Track upstream unless intentional divergence is declared |
| lobsterpulse | Agent hooks/notifications | SHOULD BE BETTER | Preserve config/hook integrity before breadth |
| **prompt-autoresearch** | Autonomous prompt/eval optimizer | **RESEARCH_REQUIRED** | **NEW #3 variance-aware repeated evaluation / stability gate** |
| neciken-summer-poem | AI literary workflow | MUST FIX | Default-branch CI/reliability before expansion |
| note-filler | Evidence-grounded legal/admin augmentation | DIFFERENTIATOR | Existing claim-level evidence review remains correct direction |
| gooaye | Empty placeholder | N/A | Define product purpose or archive |
| lplrs-judicial-sync | Judicial data synchronization | MUST MATCH | Source lifecycle/retention/takedown first |
| adng-memory | Operational memory/state | MUST MATCH | Scope/freshness/validation before richer recall |
| cyber-prep-coach | iPAS exam preparation | DIFFERENTIATOR | Existing #4 mastery profile / explainable next action |
| cf-ai-router | AI provider router | RESEARCH_REQUIRED | Existing task-reliability + safe Responses API research first |
| avatar-vfo | AI avatar/chat | DO NOT ADD NOW | Security/release evidence dominates |
| project-doctor-web | Clinical teaching/research UI | DO NOT ADD NOW | Safety/runtime gates before agentic actions |
| minideck | Presentation/deck workflow | MUST MATCH | Share/version/privacy authority first |
| chatgpt-dual-pipeline | Internship-notes publication product | SHOULD SIMPLIFY | Source-of-truth and identity handoff first |
| internship-notes-sites-mirror | Publication mirror | N/A | Keep mirror role narrow |
| taichung-police-intel | Public-sector intelligence monitor | DIFFERENTIATOR | Existing #12 role intelligence profile remains high value |
| soundbox-offline | Local-first music library | DIFFERENTIATOR | Existing #3 same-LAN import is active direction |
| skill-foundry | Agent-skill certification | DIFFERENTIATOR | Existing #1 runtime compatibility / negative-transfer gate |
| video-timeline-pipeline | Video intelligence pipeline | DIFFERENTIATOR | Research Packs on existing roadmap; avoid parallel infra |
| ai-novel-workstation | Long-running AI writing workstation | DIFFERENTIATOR | Existing #2 Context Manifest / selective memory routing |
| clinical-scribe-worker | Clinical scribe/eval worker | DO NOT ADD NOW | Auth/quota/audit integrity first |
| **MaterialYouNewTab** | Local-first new-tab productivity fork | **DO NOT BLOAT / KEEP LIGHT** | Privacy, speed, minimalism are competitive signals; no new AI/RSS surface |
| cf-mcp-server | Cloudflare MCP server | MUST MATCH | Existing #6 protocol/conformance migration |
| tick-stock-panel | Taiwan stock monitoring/simulation | MUST MATCH + RESEARCH | Coverage truth #2 before NL compiler #5 |
| herdr-skills | Multi-agent workflow skills | SHOULD BE BETTER | Reuse Skill Foundry evidence semantics |

---

## External Signals

### A. Direct competitor: remote coding-agent bridges are making permission approval a first-class chat UX

**CONFIRMED — OpenACP, checked 2026-09-07**

OpenACP is a self-hosted ACP bridge for Telegram, Discord and Slack. Its documented feature set includes:
- permission buttons that approve/deny agent actions in the messaging client;
- optional auto-approval for specifically configured action classes rather than blanket approval;
- streaming tool calls and results;
- session transfer and persistence;
- token/cost tracking and budgets.

Sources:
- https://openacp.ai/
- https://github.com/madezmedia/openacp

**CONFIRMED — acp-discord, checked 2026-09-07**

The `acp-discord` client exposes tool calls, Discord approve/deny buttons, and unified file diffs before permission approval. Mutating Discord MCP operations require confirmation.

Source: https://github.com/broven/acp-discord

**CONFIRMED — Claude Managed Agents permission policies, current 2026 documentation**

Anthropic distinguishes `always_allow` from `always_ask`; `always_ask` pauses execution until the application supplies an explicit allow/deny event. MCP toolsets default to `always_ask`, specifically preventing newly exposed MCP tools from silently executing without approval.

Source: https://platform.claude.com/docs/en/managed-agents/permission-policies

**CONFIRMED — ACP remote transport design, updated through 2026-05-04**

ACP’s remote transport draft keeps `request_permission` as a server-to-client request and shows a client response such as `allow_once`. This reinforces that the client is an authorization boundary, not merely a transport that should auto-select the most permissive option.

Source: https://agentclientprotocol.com/rfds/streamable-http-websocket-transport

**Transferable principle:** for agent actions, low-risk read-only operations may be explicitly allowlisted, but consequential or unknown actions require a client-side policy/human decision. Tool request ≠ execution authority.

### B. Emerging research: prompt optimization must evaluate stability, not just peak score

**CONFIRMED RESEARCH — MAGE, 2026-07-11**

MAGE reports a Prompt Optimization Coupling Effect: combining stochastic optimization signals can improve mean performance while amplifying variance. In one experiment, a larger candidate pool improved mean accuracy while increasing variance by 3.7×. The paper argues optimizer evaluation should include stability as well as performance.

Source: https://arxiv.org/abs/2607.11944

**CONFIRMED RESEARCH — FAPO, 2026-06-17**

FAPO repeatedly validates pipeline variants and reports comparison results across trials using mean ± trial standard deviation. The authors explicitly note cases where gaps fall within sampling noise. FAPO also isolates iterative validation from held-out test evaluation instead of making the final test set an unconstrained mutation signal.

Source: https://arxiv.org/abs/2606.19605

**Transferable principle:** autonomous optimizers need a versioned evaluation receipt containing replicate/cohort identity, dispersion/noise evidence, cost and an `INCONCLUSIVE` state. Single lucky runs should not silently become champions.

### C. Adjacent workflow: music-practice products improve the practice loop, but only after the content/teacher workflow exists

**CONFIRMED — Soundslice product update, 2026-05-22**

Soundslice added automatic device-audio latency detection, persistent per-instrument volume/choice, multitrack stem playback for notationless material and scale-degree pitch labels.

Source: https://www.soundslice.com/blog/310/new-features-and-fixes-may-2026/

**UkePack implication:** these are credible signals that interactive practice UX can matter, but UkePack’s current job is different: prepare a child-friendly practice pack and teacher-reviewed material quickly. Its current Beta is explicitly measuring preparation-to-practice workflow. An interactive synced practice player should remain a later hypothesis until teacher/student evidence shows playback sync is a higher pain than content prep/review/distribution.

### D. Adjacent market: new-tab products are differentiating through restraint, privacy and local ownership

**CONFIRMED — Mist, current 2026**

Mist markets a minimal local-first new tab with no account database, local extension storage, and optional network features that run only when enabled.

Source: https://www.mistnewtab.com/

**CONFIRMED — PrismTab, current 2026**

PrismTab emphasizes no account/analytics/remote database, local IndexedDB, full JSON backup/restore, optional permissions and a dedicated minimalist mode.

Source: https://prismtab.app/

**CONFIRMED — Speedtab, Chrome Web Store, updated recently in 2026**

Speedtab similarly positions an extensive but local-first dashboard around no account/backend/tracking and portable export/import.

Source: https://chromewebstore.google.com/detail/speedtab-local-speed-dial/adkjbdepojalajhfkoobiedddlnoamff

**MaterialYouNewTab implication:** this market does not justify adding every possible widget. Reese-max already has workspaces, tasks, scratchpad, focus, command palette, accessibility and backup. The competitive move is performance/privacy clarity and selective simplification, not feature-count competition.

---

## Community Pain Points

These are anecdotal `COMMUNITY_SIGNAL`s only.

### Agent authorization becomes ambiguous when one approval can cascade into many tool calls

- **2026-04-21:** an AI Agents discussion asks how to bind an approved intent to only the specific allowed API calls rather than leaving a broad credential/session open. https://www.reddit.com/r/AI_Agents/comments/1srhbl1/how_do_you_scope_an_ai_agent_to_only_its_approved/
- **2026-06-09:** another discussion focuses on deciding which agent actions need human approval and argues about fail-closed behavior when no response arrives. https://www.reddit.com/r/AI_Agents/comments/1u0qolu/how_are_you_actually_deciding_which_agent_actions/
- **2026-07-14:** a governance discussion asks whether authorization should be a shared action-control layer across files, CRM, messages, shell and MCP tools rather than scattered prompt instructions. https://www.reddit.com/r/AI_Agents/comments/1uwns1r/if_an_ai_agent_can_call_20_tools_where_should/

These are not empirical security studies, but they match the product architecture gap found directly in OpenAB code.

### Prompt quality gains can hide cost or stability regressions

- **2026-03-13:** a repeated-prompt community experiment ran identical prompts multiple times and observed stochastic choice variation, illustrating why one output is weak evidence of stability. https://www.reddit.com/r/u_ParadoxeParade/comments/1rskyqs/repeated_prompting_experiment_with_llms_84_runs/
- **2026-07-03:** a PromptEngineering anecdote describes a prompt that looked better in evals but nearly doubled average output tokens/cost. https://www.reddit.com/r/PromptEngineering/comments/1umk4j2/one_prompt_change_almost_doubled_our_costs/

Implication: repeated/stability evaluation should record token/cost alongside quality; more trials must be budget-aware rather than unlimited.

---

## Repository Evidence / Gap Validation

### `openab`

**CONFIRMED current default branch**

`src/acp/connection.rs` currently:
- defines `pick_best_option()` that tries `allow_always` before `allow_once`;
- falls back to an `allow_always` response when permission options are missing;
- auto-replies to `session/request_permission` inside the ACP reader and consumes the request without Discord human decision.

README also shows the default Kiro example using `args = ["acp", "--trust-all-tools"]`.

No matching permission/approval Issue or PR was found. Attempting to create the proposed P1 Issue returned GitHub HTTP **410: “Issues has been disabled in this repository.”**

**Decision:** MUST MATCH / P1 SECURITY opportunity, but `ISSUE_WRITE_BLOCKED`.

Proposed title:
`[Competitive Gap][P1][SECURITY] 將 ACP 權限 auto-approve 改為 Discord Human Approval Broker`

Recommended minimum contract:
- normalized local policy: `allow / ask / deny`;
- unknown/consequential action defaults to ask/deny;
- Discord Allow once / Deny buttons tied to authorized user + thread + session + request + tool identity + TTL;
- timeout/restart/Discord failure fail closed;
- explicit read-only allowlist instead of blanket auto-approval;
- no default `--trust-all-tools` posture;
- redacted decision receipt;
- runtime smoke across at least two ACP backends.

### `prompt-autoresearch`

**CONFIRMED current `master`**

The existing system already has strong anti-overfit structure, including Gatekeeper, smoke/dev/holdout, evidence manifests and per-type champions. However `route_evolve.py` currently performs one candidate dev run, then one candidate holdout run, and if both single comparisons pass it saves the champion and uses those runs as the new baselines. Route validation likewise performs a single dev and holdout evaluation.

Issue/PR searches found no existing repeated-trial / variance / uncertainty / stability-gate fingerprint.

**Decision:** create Research Issue **#3** rather than immediately changing promotion logic.

### `UkePack`

Recent default-branch commit `436db728...` fixed project capability isolation, CSRF and fail-closed deployment from the prior authorization finding. Current README confirms teacher review, practice audio, private sharing, Beta teacher trial packets and a Phase-3 teacher workspace/subscription plan.

**Decision:** do not copy Soundslice’s player breadth yet. First collect teacher Beta evidence about whether the remaining friction is preparation, review, distribution, student playback, or progress tracking.

### `MaterialYouNewTab`

README clearly marks this as an intentional customized fork and documents local-first storage, backup/restore, workspaces, scratchpad, focus, command palette and accessibility.

**Decision:** new-tab competition strengthens `DO NOT BLOAT`; no competitive Issue this round.

---

## Opportunity Map

| Opportunity | Classification | Repo | Opportunity Score | Action |
|---|---|---|---:|---|
| ACP Discord human approval broker with scoped permission receipts | MUST MATCH / SECURITY / DIFFERENTIATOR | openab | **97/100** | **ISSUE_WRITE_BLOCKED — Issues disabled** |
| Variance-aware repeated evaluation + holdout isolation | RESEARCH_REQUIRED / SHOULD BE BETTER | prompt-autoresearch | **91/100** | **NEW Issue #3** |
| Teacher/student practice feedback loop after Beta evidence | ADJACENT IDEA | UkePack | 76/100 | Research later; no Issue |
| Minimal/performance mode and feature-pruning discipline | SHOULD SIMPLIFY | MaterialYouNewTab | 78/100 | No new Issue; avoid breadth |
| Portfolio-wide action authorization receipt | ADJACENT IDEA | autodev-ng/openab/cf-mcp/skill-foundry | 89/100 | Standardize semantics first; no shared library yet |
| Evaluation cohort/noise receipt shared across optimizer/router/skills | ADJACENT IDEA | prompt-autoresearch/cf-ai-router/skill-foundry | 88/100 | Let repo-specific contracts prove shape first |

Opportunity Score combines User Pain, Strategic Fit, Novelty, Evidence Strength, Reuse Potential and Implementation Effort with Security/Privacy/Cost risk as a penalty. It is a prioritization heuristic, not a market forecast.

---

## Top 10 Cross-Portfolio Ideas

1. **Permission Broker primitive** — proposed action is not authority; map tools/actions to explicit allow/ask/deny policy.
2. **Scoped approval receipt** — approvals bind to actor, target, action hash, session/request, scope and expiry; replay fails.
3. **Fail-closed pending state** — timeout/network/restart should become denied/unresolved, not implicitly allowed.
4. **`INCONCLUSIVE` as a first-class decision** — research/evaluation systems should not force binary accept/reject when evidence is below noise or budget expires.
5. **Evaluation cohort identity** — model/judge/dataset/evaluator versions define a cohort; drift makes old noise profiles stale.
6. **Paired evidence before aggregate score** — compare the same tasks/items when possible rather than only two averages.
7. **Holdout is governance, not just another dataset split** — mutation loops should not repeatedly learn from their final gate.
8. **Cost is part of quality** — prompt/provider/agent improvements should record tokens, tool calls, latency and cost in the same receipt.
9. **Local-first products should compete on restraint** — privacy/speed/ownership can be stronger differentiation than another dashboard widget or AI chat.
10. **Product evidence before roadmap expansion** — after technical blockers are fixed (e.g. UkePack), use real Beta workflow evidence to choose the next bottleneck instead of immediately filling Phase-3 feature lists.

---

## Ideas Rejected / Deferred

- **OpenAB: add more ACP backends, Slack or Telegram before permissions.** Rejected for this round. The product already supports multiple backends; auto-approval is the more fundamental trust gap.
- **OpenAB: simply switch every tool to permanent denial.** Rejected. The useful design is explicit policy + low-friction human approval, not disabling agent usefulness.
- **prompt-autoresearch: copy FAPO structural pipeline mutation immediately.** Deferred. The repository first needs trustworthy promotion evidence; expanding mutation scope before measuring noise increases risk.
- **prompt-autoresearch: fixed N=5 or N=20 trials for every candidate.** Rejected. Trial count must be empirically calibrated and budget-aware; MAGE/FAPO numbers are research evidence, not defaults.
- **prompt-autoresearch: repeatedly query holdout until a candidate passes.** Rejected as overfitting leakage.
- **UkePack: build synchronized multitrack player because Soundslice has one.** Deferred; job-to-be-done differs and teacher Beta should determine whether this is meaningful.
- **MaterialYouNewTab: add RSS/news feed/embedded AI chat because competitors have dashboards.** Rejected; current external signal strongly rewards lightweight/local-first experiences and the fork already has a broad productivity surface.

---

## Issue Mapping

### NEW
- `Reese-max/prompt-autoresearch #3` — `[Research][Competitive Inspiration] 將 prompt promotion 升級為 variance-aware repeated evaluation / stability gate`
  - Status: created successfully.
  - Includes external sources, repository evidence, research spike, holdout-isolation options, budget-aware replication, Acceptance Criteria, Success Metrics, risks and runtime requirements.

### ISSUE_WRITE_BLOCKED
- Repository: `Reese-max/openab`
- Proposed title: `[Competitive Gap][P1][SECURITY] 將 ACP 權限 auto-approve 改為 Discord Human Approval Broker`
- Error: GitHub HTTP 410 — **Issues has been disabled in this repository.**
- Evidence remains in this radar report; no claim is made that the Issue exists.

### DUPLICATE AVOIDED / NO NEW TICKET
- `UkePack`: existing product/Beta/Phase-3 workflow already provides the right place to collect evidence; no premature interactive-practice feature ticket.
- `MaterialYouNewTab`: no new feature ticket because market evidence supports restraint rather than breadth.
- Existing r1–r5 Issues remain the preferred tracking objects for their respective fingerprints.

---

## What Changed Since r5

1. **OpenAB is no longer UNKNOWN.** Repository inspection resolves it as an active Discord↔ACP coding-agent product and surfaces a concrete permission auto-approval gap.
2. **Prompt optimization stability moved from backlog note to formal research.** New 2026 MAGE/FAPO evidence plus current single-run promotion code is strong enough to justify #3.
3. **UkePack’s prior authorization blocker is fixed on default branch.** This removes one reason to freeze all product exploration, but does not justify skipping teacher Beta evidence.
4. **MaterialYouNewTab’s fork/product identity is explicit.** External competition reinforces a “local-first + lightweight + optional permissions” strategy; the correct action this round is not to add features.
5. The portfolio design principle advances from generic “versioned receipts” to **separation of proposal, authorization/evaluation, and execution/promotion**.

---

## Sources

### Direct competitors / product docs
- OpenACP — https://openacp.ai/
- OpenACP repository — https://github.com/madezmedia/openacp
- acp-discord — https://github.com/broven/acp-discord
- Claude Managed Agents permission policies — https://platform.claude.com/docs/en/managed-agents/permission-policies
- ACP Streamable HTTP & WebSocket Transport RFD — https://agentclientprotocol.com/rfds/streamable-http-websocket-transport
- Soundslice May 2026 product update — https://www.soundslice.com/blog/310/new-features-and-fixes-may-2026/
- Mist — https://www.mistnewtab.com/
- PrismTab — https://prismtab.app/
- Speedtab Chrome Web Store — https://chromewebstore.google.com/detail/speedtab-local-speed-dial/adkjbdepojalajhfkoobiedddlnoamff

### Research
- MAGE, 2026-07-11 — https://arxiv.org/abs/2607.11944
- FAPO, 2026-06-17 — https://arxiv.org/abs/2606.19605

### Community signals
- Scoped API-call approvals — https://www.reddit.com/r/AI_Agents/comments/1srhbl1/how_do_you_scope_an_ai_agent_to_only_its_approved/
- Human approval placement — https://www.reddit.com/r/AI_Agents/comments/1u0qolu/how_are_you_actually_deciding_which_agent_actions/
- Shared authorization layer — https://www.reddit.com/r/AI_Agents/comments/1uwns1r/if_an_ai_agent_can_call_20_tools_where_should/
- Repeated prompting experiment — https://www.reddit.com/r/u_ParadoxeParade/comments/1rskyqs/repeated_prompting_experiment_with_llms_84_runs/
- Prompt cost regression anecdote — https://www.reddit.com/r/PromptEngineering/comments/1umk4j2/one_prompt_change_almost_doubled_our_costs/

---

## Round Outcome

- High-value opportunities: **2**
- New Issues created: **1**
- Issue write blocked: **1**
- Product-source modifications: **0**
- Branches / merges / deployments / secrets / repository settings changed: **0**
- Main strategic conclusion: **agent proposal, permission/evaluation authority and execution/promotion must remain separate control planes, with explicit evidence and fail-closed behavior at the boundary.**
