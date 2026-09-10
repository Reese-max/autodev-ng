# External Competitive / Product / Workflow Inspiration Radar — 2026-09-11 r3

> Scope: Reese-max owned, unarchived repositories that can reasonably be treated as products. Public web outside GitHub is the primary market source. GitHub is used to map current product state/recent changes, inspect Competitive Gap / Feature / Research Issues and PRs, apply duplicate/lock rules, file one evidence-backed research opportunity, and preserve this report.
>
> Evidence labels: **CONFIRMED** = first-party product/docs/release information or directly inspectable current repository state; **LIKELY** = supported product inference still requiring runtime/user validation; **COMMUNITY_SIGNAL** = anecdotal user/developer report; **UNKNOWN** = insufficient evidence / must be measured.
>
> Execution boundary: no product source code, implementation branch, merge, deploy, production credentials/secrets, permissions, network/IAM settings, or repository settings were changed.

---

## Executive Summary

This round found a **new cross-portfolio control-plane primitive** that is distinct from the already-tracked egress/effect firewall: **Agent Principal + Credential Lease identity**.

The strongest fresh market signal is JumpCloud’s **2026-09-10** Agentic IAM expansion. Its current product model treats an AI agent as a separate non-human identity with a required human owner, separate authentication lifecycle, application access, suspend/reactivate/delete states, and per-agent revocation. Independent reporting describes creation-to-retirement tracking and task-expiring privileged grants. Akeyless, which made Agentic Runtime Authority generally available on **2026-09-09**, independently converges on the same split from another direction: credentials can be brokered instead of exposed to the model, action authority is checked at runtime, and activity is attributed to a human/application/agent.

For `autodev-ng`, this matters because current repository evidence already has `taskId`, `executionId`, `engineTag`, `writerIdentity`, evidence receipts, secret references, review independence and multi-engine routing — but `writerIdentity` is currently populated from `engineTag`. That is useful routing/model evidence, not a first-class revocable actor. If two Codex/Claude/OpenCode instances share one machine/provider login, the system can distinguish executions, but repository evidence does not currently prove that either instance owns a separately revocable identity/credential lease.

**Action this round:** created `Reese-max/autodev-ng #17` — `[Competitive Inspiration][RESEARCH_REQUIRED][SECURITY] 建立 Agent Principal / Credential Lease Registry，分離 engine、execution、owner 與可撤銷授權` — Opportunity Score **94/100**.

The issue is **research-only**. Current product-board evidence says the Windows full-regression/recovery gate is red and #13–#16 must be repaired before adding implementation breadth. Accordingly #17 permits identity schema, read-only inventory and synthetic fixtures only; it explicitly blocks real credential/IAM mutation or production enforcement until reliability recovers.

Transferable architecture:

`Human/Owner → AgentRoleTemplate → AgentPrincipalLease → Capability/Credential Bindings → ExecutionId → Action/Artifact → PrincipalReceipt`

and, when an external effect is involved:

`PrincipalReceipt → ExternalEffectSpec (#12) → Runtime Policy/Containment → EffectReceipt`

Core rule: **identity is not permission; permission is not containment; a model/engine name is not an identity; an execution ID is not credential authority.**

---

## Portfolio → Market Category / Recent Change Check

Current scope remains **35 unarchived Reese-max product-like repositories**. The latest product-board/repository scan was used to distinguish current gaps from repeated radar findings.

| Repository | Market / product category | Current/recent state used in r3 |
|---|---|---|
| `cf-ai-router` | Multi-provider AI gateway / routing | Existing lifecycle/cost/capability research remains primary; Agent Principal can later bind caller identity without becoming a full IAM system. |
| `soundbox-offline` | Local-first offline audio PWA | Offline/import/library simplicity remains the moat; identity/IAM is not a current gap. |
| `police-exam-archive` | Police exam archive / source corpus | Source/version truth and archive→practice handoff remain primary. |
| `skill-foundry` | Agent skill evaluation / promotion | Candidate/attestation/risk-tier eval remains core; future Skill manifests may declare required principal/capability but cannot mint authority. |
| `prompt-autoresearch` | Prompt/model experiment research | Reproducible eval/model drift remains core; identity is mostly provenance for runner actors. |
| `lobsterpulse` | Product / market intelligence | Source freshness/dedupe/change detection remain core; no need for agent IAM now. |
| `tick-stock-panel` | Self-hosted quantitative research workstation | Read-only research boundary remains important; principal/effect split relevant only if future automations gain external actions. |
| `clinical-scribe-worker` | Clinical drafting / scribe research | Section-scoped repair and auth blocker remain higher priority; no new mutation surface. |
| `adng-memory` | Agent memory governance | Provenance/admission/quarantine/staleness/deletion/poisoning remain primary; recalled memory cannot mint principal authority. |
| `avatar-vfo` | Persona / character simulation | Continuity and bounded state remain core. |
| `note-filler` | Evidence-backed note augmentation | Candidate/approval/staleness already match human-in-control design. |
| `taiwan-intel-dashboard` | Public-source Taiwan intelligence dashboard | Read-only evidence projection remains stronger opportunity than agent identity. |
| `cyber-prep-coach` | iPAS cybersecurity exam preparation | Trusted corpus/mastery/calibration before new agent surfaces. |
| `UkePack` | Music-education worksheet generator | Human-authored source → reversible candidate transformation remains strategic. |
| `autodev-ng` | Multi-engine coding-agent orchestrator | **New #17:** principal/owner/credential lifecycle. Current release gate remains blocked by #13–#16; do not expand implementation breadth yet. |
| `ai-novel-workstation` | Local-first AI fiction production workstation | Canonical story state/revision/resumability remain core. |
| `herdr-skills` | Reflective coding-agent rules/skills | #6 owns correction→candidate improvement. Record & Replay is a new intake pattern, not a separate policy authority. |
| `video-timeline-pipeline` | Evidence-backed video understanding/editing handoff | #11 owns evidence→CutSpec/NLE handoff. |
| `chatgpt-dual-pipeline` | De-identified notes publishing pipeline | Preserve one-way publishing/source boundary. |
| `claude-mem` | Coding-agent memory | Memory provenance/authority separation remains key; principal IDs could become origin metadata later. |
| `lplrs-judicial-sync` | Taiwan judicial corpus sync | #3 owns exact authority revision/span/removal contract. |
| `internship-notes-sites-mirror` | Static downstream mirror | One-way deterministic mirror; no agent action surface needed. |
| `MaterialYouNewTab` | Browser new-tab / productivity workspace | Unified local retrieval and session capture remain current browser opportunities; no IAM. |
| `taichung-police-intel` | Public-source local-government/police intelligence | #15 owns transport-neutral evidence distribution/WebMCP; keep tools read-only until stronger action identity exists. |
| `ninax-line-hermes` | LINE AI assistant / workflow adapter | External-channel identity and effect boundaries matter; Agent Principal is a future reusable contract, not a duplicate Issue. |
| `project-doctor-web` | Clinical interview / SOAP teaching app | Structured educational case workflows; avoid consequential medical automation. |
| `92-duty-scheduler` | Duty scheduling / roster operations | #22 owns typed post-publication request lifecycle; verified human identity/current schedule revision remain authority. |
| `voice-actress` | Taiwan police/legal essay practice | Evidence-linked rubric grading + simplify/reposition remain strategic. |
| `flux-image-gen` | Image-generation workflow | Provenance/cost/output receipts remain primary. |
| `neciken-summer-poem` | Literary contest / creative workstation | Frozen contest source + isolated candidate revisions remain core. |
| `minideck` | AI HTML presentation generator | Reversible candidate edits/version/share remain stronger than agent IAM. |
| `ppt-studio` | Local presentation authoring / AI deck workstation | Editable deck + claim/source provenance remain core. |
| `police-exam-practice` | Police exam practice | Official corpus + adaptive review before extra AI surfaces. |
| `exam-archive` | General exam archive | Provenance/version integrity + archive→practice handoff. |
| `cf-mcp-server` | Cloudflare-hosted MCP infrastructure | Natural future consumer of principal-bound MCP/OAuth receipts; do not duplicate full IAM in this repo yet. |

### Recent GitHub product changes relevant to this round

**CONFIRMED — `autodev-ng`:** latest product-board audit keeps the product at INVEST/SIMPLIFY but the current Windows two-round regression gate is red. #14, #15 and #16 track three concrete roots under #13. The board explicitly says to restore executable configuration, completion/repair evidence and precise recovery receipts before adding another model adapter, auto-merge, marketplace or second control plane.

**CONFIRMED — identity implementation gap:** current `Job` includes `executionId` and `writerIdentity`; scheduler sets `writerIdentity: engineTag`, and evidence-chain receipts write that identity. Secret handling supports env/file references plus secret scanning. Repository search found no `principalId / agentId / credentialLease / ownerId` lifecycle contract.

This is why #17 is research-only rather than an implementation sprint.

---

## External Signals

### A. Direct competitor — AgentConnect turns multi-agent roles/permissions into a visible control plane

**CONFIRMED — current product checked 2026-09-11**  
https://www.agentconnect.md/  
https://www.producthunt.com/products/agentconnect

AgentConnect is a provider-neutral, self-hosted multi-agent collaboration/control product for Claude Code, Codex, Gemini CLI, DeepSeek and ACP-compatible runtimes. Its public product model includes named agents, schedules, memory, tools, permissions, routing/handoffs and channel visibility. It describes support/review/deploy/QA agents with different runtimes and states that processes/code/conversations remain on user-operated machines; provider model traffic goes directly to the provider. Product Hunt currently lists the product as **Free**.

**JTBD:** “I have several coding agents doing different jobs; I need to address and govern the right one without rebuilding bot routing, roles and permissions around every model.”

**Why it saves steps:** operator intent starts at role/agent identity rather than “open terminal A, remember which model/session it is, locate the matching channel, then infer scope.”

**Onboarding/distribution:** sits around existing agents/channels rather than forcing migration to a new IDE.

**Automation/integration pattern:** agent-specific schedules, tool scopes and visibility become first-class control-plane metadata.

**Business-model signal:** free/open/self-hosted control surfaces increase the baseline expectation that identity/routing/permissions are infrastructure, not premium UI decoration. This does not prove market willingness to pay.

**Limitations:** AgentConnect says agents use users’ own provider accounts/API keys. A named agent/permission surface therefore does not, by itself, prove per-agent credential isolation or independently revocable external identity.

**Fit:** `autodev-ng` already has stronger worktree/verification/cost/evidence machinery; it should add a minimal accountable principal contract rather than clone a collaboration suite.

**DO NOT COPY:** channel breadth, bot marketplace behavior, or a UI name that pretends to be a security identity.

---

### A2. Direct workflow competitor — Jira removes work-item → coding-agent copy/paste

**CONFIRMED — Atlassian Cloud changes Aug 31–Sep 7, 2026**  
https://confluence.atlassian.com/cloud/blog/2026/09/atlassian-cloud-changes-aug-31-to-sep-7-2026

Jira is rolling out one-click handoff from a work item to Cursor, Claude Code, GitHub Copilot and other coding agents. Jira assembles summary/description into the prompt, removing manual copy-paste. Jira Automation can also trigger Cursor and choose the **connection user** used for invocation.

**JTBD:** move authorized backlog context into an agent without manual prompt assembly.

**Fit:** `autodev-ng` already matches much of this via GitHub Issue intake/repair. The new signal is not “build Jira integration”; it is that invocation identity becomes part of automation configuration.

**SHOULD BE BETTER:** a Reese-max execution should eventually attribute the action to an exact principal + execution, not stop at `engineTag` or generic connection identity.

**DO NOT COPY:** add Jira/Atlassian breadth merely because it exists; GitHub remains the canonical current intake surface.

---

### B. Adjacent field — JumpCloud makes AI agents separately owned/revocable identities

**CONFIRMED + independent cross-check — major update 2026-09-10**  
https://jumpcloud.com/support/get-started-agents  
https://jumpcloud.com/support/faq-agent-identities  
https://siliconangle.com/2026/09/10/jumpcloud-extends-agentic-iam-with-new-controls-for-autonomous-ai-agents/

JumpCloud’s current public-preview Agent Identities model gives each agent an owner, separate OAuth client credentials, agent groups/application access, lifecycle/authentication states, per-agent application connection and suspend/delete controls. Suspension blocks the agent’s managed authentication/application connections while retaining the record for investigation. Deletion revokes credentials/disconnects applications. Its FAQ explicitly says a dedicated identity allows revocation without affecting the human credential.

Independent reporting on 2026-09-10 describes the same strategy as creation-to-retirement identity tracking, per-agent cutoff, shadow MCP discovery and task-expiring privileged grants.

**JTBD:** “disable the one autonomous actor that is stale/compromised without globally disabling the employee or every sibling automation.”

**Why it saves steps/reduces blast radius:** incident response can target one actor instead of reconstructing shared credentials and rotating a broad login.

**Onboarding/distribution:** agent identity lives alongside existing enterprise identity management, so organizations do not need a second bespoke AI-agent directory.

**Automation/integration pattern:** owner + lifecycle + group/app access + MCP authorization become governed identity properties.

**Pricing/business model:** feature is Public Preview and JumpCloud warns pricing/functionality may change. Treat this as strategic packaging evidence, not stable pricing evidence.

**Critical limitation:** JumpCloud explicitly says Phase 1 only governs the JumpCloud-controlled path; direct unmanaged downstream access is outside its boundary. It also does not yet support delegated agent-on-behalf-of-end-user access in the initial release.

**Fit:** adopt the *contract* — owned principal, lifecycle, isolation/revocation truth — but keep Reese-max local/simple and evidence-backed.

**DO NOT COPY:** persistent HR-style directory object for every ephemeral subagent, full SSO/SCIM/PAM stack, or claims that a local record controls provider access it cannot actually revoke.

---

### C. Emerging technology — Akeyless separates credential possession from action authority

**CONFIRMED — Agentic Runtime Authority GA 2026-09-09**  
https://www.prnewswire.com/news-releases/akeyless-announces-general-availability-of-agentic-runtime-authority-for-real-time-intent-based-access-control-of-ai-agents-302873639.html  
Technical workflow: https://www.akeyless.io/blog/claude-compliance-api-ai-agent-access/

Akeyless combines a credential-brokering layer (SecretlessAI) with runtime action checks. In the documented Claude path, a customer-managed gateway can evaluate a request, issue a just-in-time credential scoped to one action, broker the connection, inspect the response, then expire the credential when the action completes. The product also emphasizes attribution to the originating human/application/agent.

**JTBD:** agents need to use enterprise resources without carrying long-lived reusable secrets and without converting “credential works” into “every possible action is authorized.”

**Why users may perceive it as more reliable:** compromised/mis-steered agent has less durable credential material, and action policy can be evaluated at the effect boundary.

**Distribution/integration:** one broker path can mediate several downstream systems rather than storing credentials in each MCP configuration.

**Business-model signal:** Akeyless is packaging agent identity/runtime authority inside an enterprise secrets/identity platform, suggesting agent governance is becoming a monetizable infrastructure layer. No vendor ROI/security benchmark is used as Reese-max performance evidence.

**Limitations:** this is vendor architecture evidence. Introducing a broker can create its own availability/trust boundary; it should not be copied into a small local orchestrator without a concrete need.

**Fit:** principal record may reference `BROKERED_JIT / PROVIDER_NATIVE / ENV_REF / FILE_REF / SHARED_SESSION / UNKNOWN`; raw secrets should not be centralized just to improve observability.

**DO NOT COPY:** enterprise vault scope, every-action semantic LLM policy, or “kill switch” marketing as proof that all runtime paths are controlled.

---

## New Releases / Recent Product Moves

| Date | Product | Signal | Relevance |
|---|---|---|---|
| 2026-09-10 | JumpCloud Agentic IAM | Unique agent identity, required owner, lifecycle/revocation; shadow MCP and expiring grant direction | **Major cross-portfolio identity signal** |
| 2026-09-09 | Akeyless Agentic Runtime Authority | GA; secretless/JIT credential + action-time policy + attribution | Complements #17 and #12 |
| 2026-08-31 → 09-07 | Atlassian Jira | One-click work-item handoff to coding agents; automation can select connection user | Confirms no-copy/paste intake + invocation identity |
| Current 2026-09-11 | AgentConnect | Provider-neutral named agents, permissions, schedules, routing, self-hosted daemon | Direct `autodev-ng` competitive baseline |
| Current 2026-09-11 | OpenAI Codex Record & Replay | Demonstrate workflow once → reusable skill on eligible macOS desktop; records window/actions | New intake idea for `herdr-skills #6`, privacy-sensitive |

OpenAI Record & Replay source:  
https://help.openai.com/en/articles/11369540-codex-in-chatgpt

Current documentation says Record & Replay can turn a demonstrated stable workflow into a reusable skill, but recording observes the actions/window content and users should avoid secrets/sensitive data. This is a **candidate-intake** signal, not permission to auto-promote recorded behavior.

---

## Community Pain Points

Community evidence is anecdotal and not used as prevalence or failure-rate statistics.

### COMMUNITY_SIGNAL — shared local OAuth can blur actor boundaries
**2026-07-28, r/ClaudeCode**  
https://www.reddit.com/r/ClaudeCode/comments/1v8ncff/codex_found_my_claude_login_installed_claude_code/

A user reported Codex finding an existing Claude authenticated session on the same Windows account and using it to launch Claude Code as an independent QA worker. The author explicitly clarifies this was reuse of an already-authenticated OAuth session, not an authentication bypass.

**Signal:** a local machine can contain capability/authentication paths that are broader than the orchestration UI suggests. “Independent reviewer” should not automatically mean “independent identity/credential.”

### COMMUNITY_SIGNAL — cross-project MCP/token state leakage concern
**2026-07-29, r/SideProject**  
https://www.reddit.com/r/SideProject/comments/1v9wvix/i_kept_leaking_one_clients_mcp_servers_into/

A developer describes using one shared Claude configuration/login/MCP/token surface across several client projects, then building containerized per-company homes to isolate logins/MCP/secrets.

**Signal:** isolation boundaries can be project/principal-specific, but this is one developer’s experience and self-promotion, not general market data.

### Implication
The product opportunity is **not** “invent stronger names for agents.” It is to expose `DEDICATED / PROVIDER_NATIVE / SHARED / UNKNOWN` and make revocation claims proportional to actual runtime evidence.

---

## Adjacent Ideas

### 1. Demonstrated workflow → Candidate Skill, not Active Skill
OpenAI Record & Replay is useful for `herdr-skills #6`: manual teaching can be easier than explaining a GUI workflow in text. The transferable shape is:

`Recorded demonstration → sanitized action trace → Candidate Skill → exact preview → Foundry/eval → explicit promotion → runtime receipt`

**Do not copy:** keep raw screen recordings indefinitely, capture passwords/payment/private data, or auto-promote a demonstration to permission-bearing automation.

**Opportunity Score:** 89/100, but **same family as `herdr-skills #6`**; central research only this round to avoid duplicate/lock interference.

### 2. Shadow MCP / unmanaged tool discovery as identity inventory input
JumpCloud’s shadow MCP direction is useful to `autodev-ng`, `cf-mcp-server`, `skill-foundry`: a principal inventory should be able to say “this worker can reach an unregistered MCP path” without pretending that discovery itself blocks it.

**Opportunity Score:** 87/100. Keep inside #17/#12 research boundary; no new Issue.

### 3. Connection-user / principal lineage across external intake
Atlassian’s `connection user` setting is a reminder that an automated handoff needs initiator/principal lineage. For `ninax-line-hermes`, `92-duty-scheduler`, WebMCP consumers and GitHub intake, preserve:

`external requester → verified human/service identity → agent principal → execution → effect`.

Do not collapse external channel user ID, agent identity and canonical mutation authority into one field.

---

## Opportunity Map — 35 Products

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| `cf-ai-router` | Honest model/cost/capability lifecycle | Caller/principal attribution on routed requests | Fail-closed free/subscription policy | Principal-bound route receipt | Enterprise IAM/gateway sprawl |
| `soundbox-offline` | Offline/import durability | One-step local import/dedupe | Accountless local library | OS share-target import | Cloud account/sync dependency |
| `police-exam-archive` | Official source/version truth | Direct archive→practice handoff | Traceable Taiwan police corpus | SourceSpan-style receipts | AI answers without corpus evidence |
| `skill-foundry` | Candidate≠active, sandbox/eval | Required-capability/principal manifest | Evidence-backed promotion | Recorded-demo→Skill candidate | Skill self-granting permissions |
| `prompt-autoresearch` | Reproducible eval/model pinning | Variance/drift receipts | Autonomous research with evidence | Runner principal attribution | Leaderboard chasing without significance |
| `lobsterpulse` | Source freshness/change detection | Explain changed signal vs duplicate | Portfolio intelligence/dedupe | Governed data plugin/export | Generic chat dashboard |
| `tick-stock-panel` | Read-only research boundary | Provenance and stale-data state | Self-hosted quant workspace | Agent principal only for future automation | Brokerage/execution by default |
| `clinical-scribe-worker` | Strong auth + revision lineage | Minimal section repair | Evidence/revision receipt | Principal-bound reviewer later | Autonomous clinical actions |
| `adng-memory` | Admission/quarantine/deletion | Origin + actor lineage | Memory authority separation | principal as memory source metadata | Memory becoming authorization |
| `avatar-vfo` | Canonical character state | Continuity regression | Controlled persona simulation | Actor/principal trace for tools | Unbounded self-modifying persona |
| `note-filler` | Candidate/approval/staleness | Section/claim scoped repair | Evidence-backed augmentation | External actor lineage | Silent canonical overwrite |
| `taiwan-intel-dashboard` | Source date/provenance | Faster evidence drilldown | Public-source Taiwan synthesis | Read-only MCP/WebMCP | Write tools without identity/effect gates |
| `cyber-prep-coach` | Correct corpus/mastery | Calibrated explanations | iPAS-focused adaptive learning | Verified skill record later | More tutor modes before trust |
| `UkePack` | Editable source/export | Reversible candidate transforms | Teacher-controlled practice packs | Demonstrated editing workflow | Full DAW/cloud suite |
| `autodev-ng` | Restore current regression gate | **Agent Principal / Credential Lease (#17)** | Multi-engine evidence/cost/review | task-scoped JIT identity, recorded skill intake | More engines/auto-merge/enterprise IAM now |
| `ai-novel-workstation` | Canonical story state | Local reversible edits | Long-form continuity/resume | Demonstrated stable editing Skill | One-shot whole-book regeneration |
| `herdr-skills` | Candidate≠active rule/skill | Correction/demo→candidate intake | Evidence-gated behavior learning | Record & Replay-style teaching | Raw recording→auto-permission |
| `video-timeline-pipeline` | Source/timestamp identity | NLE handoff/round-trip | Evidence-backed CutSpec | principal attribution for editing agent | Full NLE replacement |
| `chatgpt-dual-pipeline` | Deterministic one-way publish | Less manual publishing friction | De-identified downstream mirror | Publication actor receipt | Bidirectional hidden mutation |
| `claude-mem` | Memory provenance/staleness | Origin/principal lineage | Local coding memory | agent principal as source | Auto-executing recalled commands |
| `lplrs-judicial-sync` | Erasure + exact authority revision | SourceSpan resolver | Taiwan judgment lifecycle truth | agent principal for downstream resolver | “good law” claims without treatment data |
| `internship-notes-sites-mirror` | Deterministic mirror | Reproducible freshness | Static low-risk distribution | publication receipt | Agent write surface |
| `MaterialYouNewTab` | Local privacy/fast launch | Unified find-anything/session restore | Material/local workspace | optional browser-context principal only if actions emerge | Broad install-time permissions |
| `taichung-police-intel` | Evidence truth + source health | Transport-neutral read distribution | Local-government/police intel | principal-aware future actions | WebMCP annotations as authorization |
| `ninax-line-hermes` | Verified channel identity/replay safety | Separate requester/agent/effect IDs | LINE workflow adapter | Agent Principal contract | LINE user ID as mutation authority |
| `project-doctor-web` | Educational case integrity | Structured feedback | Clinical teaching workflow | reviewer actor receipt | Real clinical treatment automation |
| `92-duty-scheduler` | Canonical schedule revision/identity | Typed shift-change lifecycle | Policy/evidence-aware scheduling | external requester→agent→commit lineage | Group-chat message as schedule truth |
| `voice-actress` | Rubric/source evidence | Revision-bound scoring | Taiwan police/legal essay focus | grading actor receipt | Generic LMS/platform expansion |
| `flux-image-gen` | Cost/output/provenance | Source/reference lineage | Controlled image workflow | generator principal receipt | provenance badge = truth claim |
| `neciken-summer-poem` | Frozen contest/source revision | Reversible candidate edits | Literary contest workstation | demonstrated revision Skill | Autonomous submission |
| `minideck` | Editable/versioned deck | Claim/slide scoped repair | Lightweight HTML deck | authoring-agent principal | Enterprise slide suite |
| `ppt-studio` | Editable deck + source provenance | Reversible scoped edits | Local authoring/evidence | recorded presentation workflow | Cloud collaboration breadth first |
| `police-exam-practice` | Official corpus correctness | Adaptive review/explanations | Police-exam specialization | portable mastery later | AI-generated unsourced law |
| `exam-archive` | Version/source integrity | Archive→practice handoff | Reusable exam corpus | evidence API | Chat UI as source of truth |
| `cf-mcp-server` | Exact tool/target permission | Principal-bound OAuth/tool receipt | Cloudflare MCP deployment boundary | Agent Identity consumer | One shared agent credential for all tools |

---

## Opportunity Score — retained candidates

| Candidate | User Pain | Strategic Fit | Novelty | Evidence | Reuse | Effort control | Risk control | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Agent Principal / Credential Lease Registry | 9 | 10 | 9 | 10 | 10 | 8 | 8 | **94/100 — FILED #17, research-only** |
| Record/Demonstrate → Candidate Skill | 8 | 10 | 8 | 9 | 10 | 7 | 7 | **89/100 — existing #6 family, research list** |
| Shadow MCP / unmanaged capability inventory | 8 | 9 | 8 | 9 | 9 | 7 | 7 | **87/100 — fold into #17/#12 research** |
| Jira-style zero-copy issue handoff | 8 | 9 | 6 | 10 | 8 | 9 | 9 | **85/100 — largely already matched** |
| Agent control-plane collaboration breadth | 7 | 8 | 6 | 8 | 7 | 5 | 6 | **76/100 — reject for now; feature breadth** |

---

## Top 10 Cross-Portfolio Ideas

1. **Agent Principal + Credential Lease:** separate engine/model, actor, owner, execution and credential lifecycle; filed #17.
2. **Effect authority remains independent:** principal identity feeds #12 but cannot bypass egress/action policy.
3. **Dedicated vs shared identity truth:** expose `DEDICATED / PROVIDER_NATIVE / SHARED / UNKNOWN`; never claim per-agent revoke when auth is shared.
4. **Ephemeral principal leases over HR-style records:** bounded actor lifecycle for subagents/short-lived workers.
5. **Parent→child delegation lineage:** subagents get a new bounded principal/grant; no implicit scope widening.
6. **Demonstration→Candidate Skill:** GUI/workflow recording can lower teaching friction, but must go through #6/Foundry validation and privacy gates.
7. **External requester→agent→effect lineage:** reusable for LINE, GitHub, MCP and WebMCP workflows.
8. **Shadow MCP/tool inventory:** discover unmanaged capabilities and mark coverage gaps without pretending discovery is enforcement.
9. **Zero-copy canonical intake:** Jira confirms handoff should carry existing issue context; avoid manual prompt re-entry or second backlog truth.
10. **Identity receipts as provenance, not surveillance:** record minimum actor/runtime/auth state, not full prompts/screens/secrets.

---

## Ideas Rejected / Deferred

- **Full enterprise Agent IAM directory:** rejected. Reese-max is owner-operated/local-first; do not clone JumpCloud/Okta/SCIM/PAM.
- **Persistent named identity for every ephemeral subagent:** rejected. Use bounded leases/lineage to avoid identity-object sprawl.
- **Centralize all provider OAuth/API keys in `autodev-ng`:** rejected. Preserve provider/keychain isolation; store binding state/ref only.
- **Treat `engineTag` or model name as principal:** rejected; routing metadata is not independently revocable identity.
- **Treat local UUID as proof of external revocation:** rejected; external/shared paths must remain `SHARED/UNKNOWN` until verified.
- **Auto-promote Record & Replay recordings into active Skills:** rejected; demonstrations can include mistakes/secrets and do not confer authority.
- **Retain raw screen recording/session transcript as permanent learning store:** rejected on privacy/minimization grounds.
- **Build Atlassian/Jira integration now:** deferred; current GitHub issue intake already solves the main handoff JTBD.
- **Add another model/agent adapter to answer competitive pressure:** rejected while #13–#16 keep reliability gate red.
- **Create separate Issues for Shadow MCP discovery, JIT credentials, or recorded Skills:** rejected as duplicate/architecture inflation; these belong in #17/#12/#6 research families until concrete independent JTBD emerges.

---

## Issue Mapping

### CREATED — `Reese-max/autodev-ng #17`
`[Competitive Inspiration][RESEARCH_REQUIRED][SECURITY] 建立 Agent Principal / Credential Lease Registry，分離 engine、execution、owner 與可撤銷授權`

Stable fingerprint:

`autodev-ng + multi-engine local coding-agent orchestrator + executionId exists + writerIdentity currently resolves to engineTag + generic env/file/provider-native credential paths + no first-class revocable agent principal/owner/lifecycle/credential-lease contract + two instances of the same engine cannot be proven as distinct actors or independently revoked from repository evidence`

Creation gate completed before filing:
- searched open/closed Issues across all 35 product-like Reese-max repositories for Agent Principal / agent identity / credential lease / non-human identity / per-agent credential — no duplicate;
- searched all-state `autodev-ng` PRs for principal/identity/credential/revocation — no matching PR;
- repository code search confirmed `writerIdentity` is currently engine-tag based and no principal/lease contract was found;
- searched `github-issue-lock:v1`; no competing lock matched this fingerprint.

Hard dependency: #13/#14/#15/#16 reliability recovery before production implementation breadth.

### EXISTING — `autodev-ng #12`
Egress / external-effect containment remains separate and should later consume `principalId` only as attribution. A valid principal cannot make an effect automatically permitted.

### EXISTING — `autodev-ng #11`
STEER/QUEUE continues to target exact `executionId`. Principal identity is complementary and must not make controls fan out by role/name.

### EXISTING — `herdr-skills #6`
OpenAI Record & Replay is new external evidence for demonstration→candidate intake, but the fingerprint already belongs to correction/workflow→candidate rule/skill. No update was made this round to avoid unnecessary issue churn/lock conflict; evidence is retained centrally.

---

## Sources

### Direct competitors / coding workflows
- AgentConnect product — checked 2026-09-11: https://www.agentconnect.md/
- AgentConnect Product Hunt — checked 2026-09-11: https://www.producthunt.com/products/agentconnect
- Atlassian Cloud changes Aug 31–Sep 7, 2026: https://confluence.atlassian.com/cloud/blog/2026/09/atlassian-cloud-changes-aug-31-to-sep-7-2026

### Adjacent identity / governance
- JumpCloud Get Started: Agents — checked 2026-09-11: https://jumpcloud.com/support/get-started-agents
- JumpCloud Agent Identities FAQ — checked 2026-09-11: https://jumpcloud.com/support/faq-agent-identities
- SiliconANGLE independent JumpCloud coverage — 2026-09-10: https://siliconangle.com/2026/09/10/jumpcloud-extends-agentic-iam-with-new-controls-for-autonomous-ai-agents/

### Emerging runtime/credential technology
- Akeyless Agentic Runtime Authority GA — 2026-09-09: https://www.prnewswire.com/news-releases/akeyless-announces-general-availability-of-agentic-runtime-authority-for-real-time-intent-based-access-control-of-ai-agents-302873639.html
- Akeyless Claude/Runtime Authority technical flow — checked 2026-09-11: https://www.akeyless.io/blog/claude-compliance-api-ai-agent-access/
- OpenAI Codex Record & Replay — checked 2026-09-11: https://help.openai.com/en/articles/11369540-codex-in-chatgpt

### Community / anecdotal evidence
- Shared authenticated Claude session reused in multi-agent QA scenario — 2026-07-28: https://www.reddit.com/r/ClaudeCode/comments/1v8ncff/codex_found_my_claude_login_installed_claude_code/
- Cross-project MCP/login isolation self-report — 2026-07-29: https://www.reddit.com/r/SideProject/comments/1v9wvix/i_kept_leaking_one_clients_mcp_servers_into/

### Reese-max repository evidence
- `autodev-ng/src/types.ts` — current default branch inspected 2026-09-11.
- `autodev-ng/src/scheduler.ts`, `src/engines/evidence-chain.ts`, `src/engines/kernel-verifier.ts` — writer/execution evidence inspected 2026-09-11.
- `autodev-ng/docs/security/CREDENTIAL_ROTATION.md` — secret-reference/rotation contract inspected 2026-09-11.
- `autodev-ng/.github/quality-audits/2026-09-11-0410-product-board-audit.md` — current reliability/product-board constraint.
- Previous radar: `docs/competitive-intelligence/2026-09-11-external-radar-r2.md`.

---

## What Changed Since Last Radar (r2 → r3)

1. **New market category shift:** WebMCP/distribution remains important, but the strongest fresh change is now **Agent Identity lifecycle** rather than another transport adapter.
2. **New independent evidence:** JumpCloud’s 2026-09-10 release + current docs + independent reporting make owner/agent separation, per-agent lifecycle and revocation a concrete product pattern, not only a security-paper idea.
3. **New runtime complement:** Akeyless GA 2026-09-09 strengthens the distinction between agent identity, credential possession and action authority.
4. **New direct-competitor baseline:** AgentConnect demonstrates that multi-agent identities/permissions/schedules are moving into self-hosted coding-agent control planes, not only enterprise IAM suites.
5. **New Reese-max gap identified:** `writerIdentity` currently maps to `engineTag`; no first-class principal/credential-lease contract was found. This is a distinct fingerprint from #11 execution steering and #12 effect containment.
6. **Action:** filed `autodev-ng #17`, Opportunity Score 94/100.
7. **Safety/reliability constraint strengthened:** #17 explicitly blocks production implementation until #13–#16 restore current regression/recovery evidence. Competitive research must not override the product board’s “repair before breadth” decision.
8. **New adjacent workflow:** Codex Record & Replay suggests demonstration→candidate Skill intake for `herdr-skills #6`; retained centrally, no duplicate Issue.
9. **No direction reversal for browser/evidence products:** r2 WebMCP transport-neutral principle still holds; agent identity becomes an additional actor layer only when those products ever gain consequential actions.
10. **No source-code/product-setting mutation:** this round changed only the research Issue and central radar history file.

---

## Portfolio Principle Added This Round

> **Know who the agent is before asking what it is allowed to do — but never confuse identity with authority.**

The reusable control-plane chain is now clearer:

`Owner → Agent Principal → Credential/Capability Lease → Execution → Requested Effect → Independent Policy/Containment → Artifact/Effect Receipt`

Each boundary answers a different question:
- **Owner:** who is accountable?
- **Principal:** which actor is this?
- **Lease/binding:** what authority/credential path is currently attached?
- **Execution:** which exact attempt/turn did the work?
- **Policy/containment:** is this effect actually allowed and enforceable now?
- **Receipt:** what happened, under which exact identities/revisions/evidence?

If any layer cannot be proved, the correct state is `SHARED / UNKNOWN / UNENFORCEABLE`, not a reassuring but unverifiable identity badge.