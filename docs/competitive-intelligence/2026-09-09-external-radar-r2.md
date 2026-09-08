# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-09 r2

## Scope and evidence boundary

- Scope: Reese-max owned, unarchived repositories visible through the connected GitHub account: **40 repositories**.
- This round is external-first. The primary new signal set comes from public product/docs/news/community sources outside Reese-max GitHub repositories.
- GitHub was used to map product purpose, current implementation, recent commits, existing Issues/PRs, and duplicate fingerprints.
- Community posts are marked `COMMUNITY_SIGNAL` and are treated as anecdotal workflow evidence only.
- Vendor claims are not treated as independent performance proof.
- No product source code, implementation branch, merge, deployment, secret, permission, or repository setting was changed.

## Executive result

### High-value new opportunity — OpenAB Capability Permission Broker / Sentinel

**Target:** `Reese-max/openab`

**Stable fingerprint:**

`openab + remote Discord ACP broker + session/request_permission auto-selects most-permissive allow option + README normal path uses Kiro --trust-all-tools + upstream Kiro 3.0 replaced binary trust flags with capability permissions + no broker-owned action-risk policy / explicit high-impact approval / timeout-deny / auditable permission receipt`

**Opportunity Score: 96/100**

| Factor | Assessment |
|---|---|
| User Pain | 10/10 — remote agents must avoid both constant prompt fatigue and silent high-impact execution |
| Strategic Fit | 10/10 — OpenAB is itself the ACP control plane between Discord users and coding agents |
| Novelty | 9/10 — the opportunity is not merely “add approvals”; it is broker-owned, capability-scoped policy across heterogeneous ACP backends |
| Evidence Strength | 10/10 — current repository behavior plus Kiro/Claude/Meta primary sources and independent reporting agree on the direction |
| Reuse Potential | 10/10 — reusable by OpenAB backends, MCP actions, remote steering, and other Reese-max agent/control-plane products |
| Implementation Effort | 6/10 cost — requires protocol/session/UI/persistence work but can be staged |
| Security / Privacy / Cost Risk | 3/10 residual if fail-closed; 9/10 if implemented as another blanket auto-approval path |

**Decision:** `MUST MATCH + SHOULD BE BETTER + DIFFERENTIATOR`.

**Issue filing status:** **NOT CREATED because GitHub Issues are disabled for `Reese-max/openab`.** The repository’s own 50-persona audit explicitly records that Issues are disabled and already tracks the broader P1 `--trust-all-tools + broad Discord actor` risk. A PR search found no matching permission-broker implementation. To respect repository configuration and duplicate discipline, this round records the new external product direction in the central radar instead of attempting to bypass settings or creating a duplicate elsewhere.

---

## External Signals

### A. Direct competitor / backend signal — Kiro CLI 3.0 replaces binary trust with capability permissions

**Status:** `CONFIRMED`

**Source date:** page updated **2026-08-04**

Sources:
- https://kiro.dev/docs/cli/v3/
- https://kiro.dev/docs/cli/chat/permissions/
- https://kiro.dev/docs/cli/acp/

Kiro is OpenAB’s documented default backend. Its current 3.0 documentation calls permissions a breaking migration: the old `--trust-all-tools` / `/tools trust` model is replaced by capability-based `permissions.yaml`; capability effects are `deny / ask / allow`, with structured capabilities such as filesystem read/write, shell, web, MCP, subagent, skill, and sandbox network.

**1) Job-to-be-Done**

Let an agent run for long periods without forcing the user to approve every low-risk action, while retaining deterministic boundaries for higher-impact operations.

**2) Why this saves time / steps / improves reliability**

A blanket “ask everything” mode creates approval fatigue; a blanket “trust everything” mode removes the very safety boundary that remote execution needs. Capability rules let routine reads/tests proceed while writes, shell, network, or selected resources follow explicit policy.

**3) Onboarding / distribution signal**

Permissions are now part of the agent’s portable configuration rather than an incidental CLI flag. That makes policy travel across surfaces and reduces per-session reconfiguration.

**4) New automation / integration model**

The important pattern is `capability + match scope + effect`, not tool-name-only trust. OpenAB can normalize heterogeneous agent permissions into a broker policy and then map to each backend’s native capability where possible.

**5) Pricing / business-model signal**

The strongest signal is governance rather than price: Kiro treats permission policy as a core product configuration needed across IDE/CLI/Web surfaces. Security control is becoming part of the agent platform, not an enterprise-only bolt-on.

**6) Complaints / limitations / failure points**

Migration itself is a compatibility risk. The current OpenAB README still documents `kiro-cli acp --trust-all-tools`. Kiro 3.0 explicitly labels the old trust model as replaced and requiring migration. Runtime breakage is `LIKELY`, not `CONFIRMED`, until an actual Kiro 3.0 OpenAB acceptance run proves whether the legacy flag is rejected, ignored, or translated.

**7) Adopt vs do not copy**

Adopt capability semantics, exact scope, and auditable policy. Do **not** simply copy Kiro’s schema into OpenAB; OpenAB must normalize Kiro, Claude, Codex, Gemini and future ACP agents without pretending their permission semantics are identical.

### A2. Direct coding-agent signal — Claude Code Auto mode separates autonomy from bypass

**Status:** `CONFIRMED`

**Source dates:** introduced **2026-03-24**, official post updated **2026-07-10** to note general availability; current docs rechecked this round.

Sources:
- https://claude.com/blog/auto-mode
- https://code.claude.com/docs/en/permission-modes
- https://code.claude.com/docs/en/permissions

Claude Code’s current modes explicitly separate `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, and `bypassPermissions`. `auto` uses a separate classifier before actions execute; `dontAsk` fail-denies non-preapproved calls; `bypassPermissions` is reserved for isolated environments.

**Product principle:** autonomy is not a Boolean. A control plane should expose distinct execution modes and preserve a hard difference between `policy-approved`, `human-approved`, `denied`, and `unsafe bypass`.

**What OpenAB should absorb:** OpenAB should stop treating an ACP permission request as a protocol nuisance to auto-answer. It is a first-class control-plane event.

**What not to copy:** do not add an opaque LLM classifier as the first MVP. Start with deterministic capability/risk policy and explicit user approval; a classifier can later advise but must not silently broaden authority.

### B. Adjacent transferable workflow — Meta Muse puts a separate Sentinel between task agent and outside world

**Status:** `CONFIRMED` for product design; `COMMUNITY/INCIDENT_SIGNAL` is not needed because independent reporting exists.

**Launch date:** **2026-09-08** — this occurred after the prior radar.

Primary source:
- https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/

Independent cross-checks:
- https://www.reuters.com/business/meta-launches-ai-agent-that-can-access-other-apps-send-emails-make-payments-2026-09-08/
- https://www.axios.com/2026/09/08/meta-debuts-muse-personal-ai-agent

Meta’s new personal agent runs in a dedicated VM. A separate Sentinel controls internet/service access; sensitive actions such as sending email or purchases ask the user; access is configurable per connected app; the product exposes an audit trail. Reuters independently reported internal reliability and privacy failures during testing, so Meta’s safety marketing is not treated as proof of effectiveness.

**1) Job-to-be-Done:** let a long-running agent operate across real accounts without giving the task model unrestricted ambient authority.

**2) Faster / safer:** the user does not have to approve every ordinary step; only boundary-crossing or sensitive actions surface.

**3) Distribution:** the control loop is embedded into the messaging surface rather than forcing users to return to a developer console. This is highly transferable to OpenAB because Discord is already the operator surface.

**4) New pattern:** `worker agent proposes → independent policy/sentinel evaluates → allow / deny / ask human → action → audit receipt`.

**5) Business model:** Muse is free for most use, with subscriptions for heavier usage. The relevant design signal is that safe background agency is treated as a mainstream product feature, not only enterprise compliance.

**6) Limitations:** independent reporting described unexplained disconnections, silent monitoring failures, unexpected uploads, and a severe personal-photo exposure in internal testing. Isolation plus a Sentinel reduces risk but does not prove correctness.

**7) Adopt vs do not copy:** OpenAB should adopt separation of duties and user-visible receipts. Do not copy a generic “safety agent approves another agent” architecture without deterministic policy, exact action identity, fail-closed timeouts, and runtime verification.

### C. Emerging tooling signal — permission gateways are becoming explicit infrastructure

**Status:** `CONFIRMED` capability pattern; not a market-share claim.

Sources:
- https://www.compozy.com/docs/sessions/permissions/
- https://docs.zeroclaw.com/master/en/channels/acp.html

Current agent-control tooling increasingly models ACP permission requests as pending objects with explicit decisions, workspace boundaries, timeout behavior, and persistent/revocable grants. CompozyOS documents network-originated turns as stricter than ordinary turns, auto-denies outside-workspace requests, and can bind durable decisions to exact workspace + agent + tool + input digest. ZeroClaw documents timeout-deny behavior when a client does not reply.

**Transferable principle:** a permission is an exact, expiring, auditable object—not a generic “the user trusts this bot” bit.

---

## New Releases / Changes Worth Tracking

| Date | Status | Product / signal | Relevance |
|---|---|---|---|
| 2026-09-08 | CONFIRMED | Meta Muse launches with Secure VM + separate Sentinel + per-app access + sensitive-action approval + audit trail | New adjacent product pattern for remote agent control |
| 2026-08-04 | CONFIRMED | Kiro CLI 3.0 docs mark capability permissions as replacing trust flags | Direct OpenAB backend compatibility + product-direction signal |
| 2026-07-10 | CONFIRMED | Claude Code Auto mode official post updated to GA | Direct backend pattern for reducing approval fatigue without full bypass |
| current docs | CONFIRMED | CompozyOS / ZeroClaw expose explicit ACP approval gateway and timeout-deny semantics | Emerging interoperable control-plane pattern |

---

## Community Pain Points

Community evidence is anecdotal only.

### Permission fatigue remains real

**Status:** `COMMUNITY_SIGNAL`

- 2026-09-03 Reddit thread: users reported Claude Code began prompting for grep/edit operations despite `--dangerously-skip-permissions` after permission-rule changes, describing the new friction as workflow-breaking.
- URL: https://www.reddit.com/r/ClaudeAI/comments/1w63c1b/cc_back_to_asking_permission_for_every_command/

### Users want narrow capability grants, not all-or-nothing bypass

**Status:** `COMMUNITY_SIGNAL`

- 2026-07-01 Reddit thread: a user specifically wanted autonomous `rm -rf` only inside one temporary directory, not broad unrestricted deletion.
- URL: https://www.reddit.com/r/ClaudeAI/comments/1uka5p4/how_can_i_allow_claude_code_to_run_rm_rf_on_a/

**Interpretation:** these signals support scoped grants and low-friction policy. They do not establish how common the problem is or whether any particular permission product improves safety statistically.

---

## Current OpenAB Evidence and Gap

**Status:** `CONFIRMED` from current default-branch repository evidence.

The current OpenAB README documents:

- OpenAB as a Discord → ACP coding-agent broker.
- “permission auto-reply support.”
- the default Kiro example `kiro-cli acp --trust-all-tools`.
- `allowed_users` is optional.

Current `src/acp/connection.rs` goes further: `pick_best_option()` checks `allow_always` first, then `allow_once`; if `session/request_permission` arrives without options, the fallback is `allow_always`; the reader loop automatically answers `session/request_permission` and continues without exposing a human approval event.

The existing local 50-persona audit already tracks the broader P1 that `--trust-all-tools` plus permissive Discord actor configuration creates an unsafe authorization boundary. This round does not duplicate that finding. The **new external opportunity** is to upgrade OpenAB from “forwarder that auto-answers permissions” to a **broker-owned permission control plane** aligned with the current direction of Kiro, Claude, and newly launched mainstream agents.

---

## Proposed Opportunity — OpenAB PermissionBroker v1

### Job-to-be-Done

When a Discord user sends a long-running task to an ACP coding agent, let routine, bounded actions proceed without babysitting while ensuring higher-impact actions cannot silently inherit blanket authority.

### Transferable core principle

`Agent proposes exact action → broker binds exact session/tool/action identity → deterministic capability policy → ALLOW / DENY / ASK → optional user decision in Discord → backend exact optionId → immutable PermissionReceipt`

### Minimum Valuable Version

1. **PermissionEnvelope**
   - `brokerSessionId`
   - ACP `sessionId`
   - `toolCallId`
   - backend / agent identity
   - sanitized action title
   - capability class: `READ / FS_WRITE / SHELL / NETWORK / MCP_WRITE / EXTERNAL_SEND / DESTRUCTIVE / UNKNOWN`
   - optional path/domain/resource scope where the backend exposes it
   - offered ACP option IDs exactly as received
   - actor / Discord channel / thread
   - created / expires timestamps
   - request hash

2. **Deterministic policy first**
   - read-only inside declared workspace may be auto-allowed once.
   - unknown capability, destructive action, external side effect, secret-sensitive action, or out-of-workspace target defaults to `ASK` or `DENY`.
   - no synthetic `allow_always` when the backend did not advertise that exact option.
   - unanswered approval times out to deny/cancel.

3. **Discord approval card**
   - show exact agent/session/action summary and scope.
   - buttons/commands map only to ACP option IDs actually offered.
   - one-time approval is the default positive action.
   - durable grant requires a separate explicit scope preview.

4. **Scoped durable grants**
   - MVP can support exact command/path/tool or capability + workspace scope.
   - store grant fingerprint and expiry/revocation state.
   - never translate “allow always” into unrestricted global trust unless the exact policy scope is visible.

5. **Backend capability adapter**
   - Kiro v3: prefer capability permission semantics where available.
   - Claude/Codex/Gemini ACP adapters: preserve backend-specific option IDs and semantics.
   - unsupported/underspecified permission metadata → generic prompt or deny, never fabricate rich meaning.

6. **PermissionReceipt**
   - request identity/hash
   - policy version/hash
   - offered options
   - decision source: `POLICY / HUMAN / TIMEOUT / BACKEND`
   - chosen exact option ID
   - grant scope if created
   - decision and execution timestamps
   - stale / cancelled / expired state

### Why this fits OpenAB

- OpenAB already owns the ACP connection, session pool, Discord actor surface, tool-call stream, and permission reverse request.
- This removes a manual tool switch: users no longer need to keep a local terminal open just to answer an approval the remote broker currently suppresses.
- It turns Discord from a chat transport into a trustworthy control surface without creating a separate mobile app.
- It can preserve high autonomy for safe work while making high-impact actions visible and revocable.

### Why not copy competitors literally

- Do not add a second LLM “Sentinel” and call it secure before deterministic rules exist.
- Do not treat Kiro’s capability names as a universal standard for every ACP backend.
- Do not infer file path/domain/effect from a vague tool title if the backend did not provide it.
- Do not use provider marketing claims as proof the classifier is safe.
- Do not preserve `--trust-all-tools` as the normal quick-start default merely for convenience.
- Do not silently convert a failed/stale Discord interaction into `allow_once`.

### Acceptance Criteria

- [ ] The broker no longer selects `allow_always` merely because it appears in ACP options.
- [ ] A permission request is bound to exact broker session + ACP session + toolCallId; stale/replayed/cross-thread replies fail closed.
- [ ] Unknown or underspecified actions cannot receive a durable grant automatically.
- [ ] Unanswered pending approvals expire and resolve to deny/cancel.
- [ ] Discord surfaces `ALLOW ONCE / DENY` for high-impact or unknown requests; durable trust is a separate explicit operation with visible scope.
- [ ] Policy auto-approval is limited to configured low-risk capabilities and scopes.
- [ ] Every decision produces a PermissionReceipt with policy version/hash and exact ACP optionId.
- [ ] Backend adapters never invent an optionId not advertised by the ACP request.
- [ ] Kiro 3.0 is exercised in a compatibility test; actual behavior of the legacy `--trust-all-tools` argument is measured rather than assumed.
- [ ] Tests cover replay, expired approval, wrong Discord actor, wrong thread, wrong session, request without options, only-reject options, unknown capability, read-only allow, scoped write ask, destructive deny, and reconnect.
- [ ] Existing channel/user authorization remains a separate outer boundary; PermissionBroker cannot make an unauthorized Discord user authorized.

### Success Metrics

- 0 permission decisions delivered to the wrong ACP session/tool call in adversarial fixtures.
- 100% high-impact/unknown actions have a human/policy decision receipt before execution.
- 100% timeout/stale/replay paths fail closed.
- Routine read-only fixture can complete without per-action human clicks.
- No normal quick-start example requires blanket trust-all to function.
- Kiro/Claude/Codex/Gemini capability matrix reports unsupported semantics explicitly instead of false-success.

### Major Risks

- ACP adapters expose different levels of tool metadata; a generic broker must not overstate what it knows.
- Permission fatigue can return if capability classification is too coarse.
- “Always allow” semantics may be backend-owned; OpenAB must not assume a durable grant means the same thing across adapters.
- A broker policy bug can become a high-leverage security bug; policy versioning and fail-closed fallback are mandatory.
- Discord button/message replay and actor binding must be treated as security-sensitive.

### Dependencies

- Existing Discord actor/channel authorization.
- ACP session and tool-call identity.
- A small persistent policy/receipt store.
- Per-backend compatibility matrix.
- Existing audit P1 remediation should remain separate and higher priority where it concerns unauthorized Discord actors.

### Runtime Verification Requirement

**REQUIRED.** Use an isolated disposable repository/container with no production secrets or deploy rights:

1. Start OpenAB with a Kiro 3.0 ACP backend and no blanket trust; verify session creation and capture actual permission frames.
2. Run read-only, workspace-write, shell, network, and destructive fixtures.
3. Prove low-risk policy allows only the expected scope.
4. Prove high-impact requests pause and appear in the correct Discord thread for the correct actor.
5. Approve once; prove the exact toolCall proceeds once and a replay fails.
6. Leave a request unanswered; prove timeout denies/cancels.
7. Reconnect/restart while approval is pending; old approvals must become stale unless exact session identity is safely restored.
8. Run at least one Claude/Codex/Gemini backend to prove the adapter does not assume Kiro-only fields.
9. Retain PermissionReceipts and compare them against ACP transcript/tool outcomes.

---

## Opportunity Map — 40-repository portfolio

`MUST MATCH` = parity/trust baseline; `SHOULD BE BETTER` = expected product-quality advantage; `DIFFERENTIATOR` = portfolio-specific edge; `ADJACENT IDEA` = research only; `DO NOT COPY` = explicit anti-pattern.

| Repository | Market category | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| gemini-deidentifier | AI RPG / persistent world | deterministic persisted state | replay/debug over model changes | auditable consequence ledger | world-state receipts | prose-only “memory” pretending to be state |
| exam-archive | exam archive / legacy study surface | source traceability | canonical links to current product | historical coverage | migration index | re-expand duplicated quiz modes |
| police-exam-practice | exam practice / legacy companion | official-question fidelity | handoff to canonical archive | lightweight drill surface | shared attempt ledger | duplicate full product stack |
| police-exam-archive | official exam prep | per-question attempts + provenance | deadline-aware review | authoritative official-question graph | external AI connector over canonical state | synthetic-question volume as moat |
| 92-duty-scheduler | constraint scheduling | safe authorized writes | explainable local repair | police/school duty constraints + fairness | publish/acknowledgement workflow | payroll-centric SaaS complexity |
| openab | ACP remote coding-agent broker | **capability-scoped permission boundary** | cross-backend normalized policy + receipts | Discord-native human control plane | safe steer/approval unification | **blanket trust-all / automatic most-permissive approval** |
| UkePack | music teaching / workshop kit | simple practice flow | teacher-first workshop usability | portable ukulele classroom pack | embedded low-friction practice tools | copy full commercial LMS |
| ppt-studio | AI presentation creation | source provenance | evidence-linked generation | traceable slide claims | source-in-place generation | opaque citation decoration |
| book5-windows-server-2022 | technical education | version/lifecycle truth | 2022↔2025 delta teaching | versioned security claims | lab drift checks | wholesale “upgrade textbook” rewrite |
| obsidian-vault | local knowledge base | local ownership | structured retrieval without lock-in | interoperable personal knowledge | capability-scoped agent access | cloud-account-first dependency |
| voice-actress | essay/answer scoring | rubric-level feedback | answer-span + verified-law evidence | evidence-linked legal grading | human review queue | AI score as unreviewable authority |
| taiwan-intel-dashboard | public intelligence dashboard | freshness/source status | cross-source dedup + evidence | Taiwan-specific operational briefing | source drift receipts | summarize without source state |
| autodev-ng | autonomous development orchestration | exact execution identity | steer vs queue receipts | multi-engine verified delivery loop | shared permission envelope | free-text control injected into wrong run |
| flux-image-gen | image generation workflow | model/parameter provenance | repeatable recipes | provider-independent generation receipt | artifact lineage | hide model/version changes |
| claude-mem | agent memory | explicit scope/retention | inspectable current memory | lifecycle-aware memory truth | bitemporal/supersession semantics | “more memory” without invalidation |
| lobsterpulse | provider/runtime observability | current provider telemetry | comparable cross-provider traces | truthful local operational timeline | OTel GenAI convergence | duplicate observability stacks |
| prompt-autoresearch | prompt research | reproducible eval | evidence-driven champion promotion | versioned experiment receipts | external benchmark import | win-by-single-score promotion |
| neciken-summer-poem | writing/contest workflow | official rule verification | pre-submit drift check | rule-drift receipt | opportunity discovery feeds | stale contest profile as truth |
| note-filler | structured note completion | source anchors | evidence-linked inserted text | traceable completion | feedback span reuse | unsupported fill-in hallucinations |
| gooaye | product/research utility | preserve current core job | simplify overlapping modes | narrow high-value workflow | adjacent automation after evidence | add features without JTBD evidence |
| lplrs-judicial-sync | judicial source sync | deletions/tombstones | derived-data lineage | legal source lifecycle | downstream invalidation | deletion only in working tree |
| adng-memory | operational agent memory | current-head semantics | bitemporal validity + supersession | activation/lineage contract | policy-aware memory | vector search = truth |
| cyber-prep-coach | cybersecurity exam coach | official spec alignment | mastery next action | evidence-grounded coach | canonical state connector | generic AI tutor duplication |
| cf-ai-router | AI provider routing | current API capability truth | cost-safe feature negotiation | provider receipt + failover evidence | agent-specific request shapes | silently pretend compatibility |
| avatar-vfo | character simulation | user isolation/auth | controllable memory/persona state | inspectable evolving cognitive matrix | editable long-term facts | consumer-assistant autonomy grafted onto roleplay |
| project-doctor-web | project diagnostics | reproducible checks | fix-path explainability | evidence-based project health | external tool compatibility radar | generic “AI health score” |
| minideck | lightweight presentations | draft/published separation | stable public head | explicit publish receipts | collaboration later | live draft == public artifact |
| chatgpt-dual-pipeline | multi-model review pipeline | exact artifact identity | independent review receipts | two-engine disagreement evidence | policy broker reuse | agreement == correctness |
| internship-notes-sites-mirror | learning-content mirror | content fidelity | stable navigation/portability | preserved internship knowledge | versioned source snapshots | turn mirror into redundant CMS |
| taichung-police-intel | public-sector intelligence | source freshness | operational dedup/prioritization | police-context briefing | cross-city source adapters | unverifiable urgency scores |
| soundbox-offline | offline sound utility | offline reliability | zero-account responsiveness | privacy/local-first | optional export/sync | cloud dependency for core use |
| skill-foundry | agent skill certification | package security attestation | quality/runtime/security separation | promotion receipts | permission manifest certification | hash == safety |
| video-timeline-pipeline | video evidence extraction | deterministic baseline | bounded evidence escalation | reproducible local visual evidence | agentic local re-sampling | full-video expensive agentic pass by default |
| ai-novel-workstation | long-form AI writing | token/runtime hard bounds | cost-envelope honesty | long-run production receipts | provider price drift | false guaranteed-dollar ceiling |
| clinical-scribe-worker | clinical documentation | safety/source fidelity | specialty/versioned validation | validation evidence receipts | evidence-linked feedback | autonomous clinical authority |
| MaterialYouNewTab | local-first new tab | minimal permissions | fast local capture | privacy-first dashboard | activeTab scoped capture | account-first sync as prerequisite |
| cf-mcp-server | Cloudflare MCP deployment control | exact target confirmation | staged health-gated promotion | target-bound deployment receipts | capability policy reuse | 100% rollout for every change |
| tick-stock-panel | market dashboard | coverage/freshness truth | market-state transparency | small truthful panel | source fallback receipts | infer missing prices as current |
| herdr-skills | multi-agent coordination skills | explicit roles/capabilities | repeatable council workflows | portable orchestration recipes | security attestation | invisible broad tool authority |
| ninax-line-hermes | LINE media/agent workflow | message revision correctness | stale-job suppression | revision-bound delivery receipt | permission/effect receipts | reply to stale edited input |

---

## Top 10 Cross-Portfolio Ideas

1. **Capability Permission Envelope + Receipt** — normalize `action identity → capability/scope → policy → human/policy decision → exact effect receipt`; highest new cross-portfolio idea this round.
2. **Control-plane separation of duties** — worker agent must not be its own only authority for external side effects.
3. **Authoritative Head** — draft/candidate/current state is not automatically the published/activated state.
4. **Freshness / Drift invalidation** — external rule, API, policy, market or source changes make prior validation stale.
5. **Evidence-linked outputs** — feedback/claims should point to exact input/source evidence and become stale when source revisions change.
6. **Attempt / Event Ledger** — persist per-action evidence instead of only aggregate scores/status.
7. **Bounded escalation** — keep deterministic/local baseline and escalate expensive AI only when evidence gap exists.
8. **Exact-target remote control** — steering, approvals, deployments and replies bind to stable execution/revision/action IDs.
9. **Cost Envelope with honesty modes** — hard enforce only where price/usage semantics support it; otherwise advisory.
10. **Artifact identity + independent safety certification** — hash/provenance proves which artifact, not whether it is safe.

---

## Ideas Rejected / Deferred

### Do not create a separate “Meta Muse clone” product

Reason: Muse is useful here as an architecture signal, not as evidence that Reese-max needs another general consumer assistant. OpenAB/autodev already own relevant control-plane surfaces.

### Do not add an LLM Sentinel before deterministic policy

Reason: classifier-based review can reduce prompt fatigue, but it adds its own false-positive/false-negative and cost/latency surface. OpenAB’s first gap is that it currently auto-picks permissive ACP outcomes; deterministic `deny/ask/allow` scopes fix the basic contract first.

### Do not simply switch OpenAB README from `--trust-all-tools` to another global “auto” flag

Reason: Kiro 3.0’s product direction is specifically away from binary trust flags toward capability policy. Replacing one global bypass with another would miss the market lesson.

### Do not create a duplicate autodev-ng permission Issue

Reason: `autodev-ng #11` already defines execution-bound steering and includes `supportsPermissionReply` in its adapter capability matrix. The new OpenAB opportunity is a concrete broker-side permission implementation, not a second steering Issue.

### Do not create another skill-foundry safety Issue

Reason: `skill-foundry #3` from the previous radar already covers package security attestation. Capability permission manifests can later feed that certification, but a new ticket would be duplicate/adjacent rather than a distinct user problem.

---

## Issue Mapping / Duplicate and Lock Discipline

| Candidate | Duplicate / PR check | Lock / coordination result | Action |
|---|---|---|---|
| OpenAB Capability Permission Broker | `search_issues(repo:Reese-max/openab)` returned none; repository audit says Issues disabled. PR search for permission/approval/trust returned no matching PR. Existing local audit tracks broader trust-all actor risk, not this full broker design. | No Issue exists to lock; repository settings must not be changed. | **Central radar only; no Issue created.** |
| autodev-ng reuse | #11 already includes permission-reply capability and exact execution-bound control | Existing fingerprint owns steering domain | No new Issue |
| skill-foundry reuse | #3 already owns security attestation | Existing fingerprint owns package-security domain | No new Issue |

No `github-issue-lock:v1` lock was taken or contested in this round because no GitHub Issue was created or updated.

---

## Sources

### Primary / official

1. Meta — Introducing Muse — 2026-09-08  
   https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/
2. Kiro CLI 3.0 — page updated 2026-08-04  
   https://kiro.dev/docs/cli/v3/
3. Kiro Permissions — current docs  
   https://kiro.dev/docs/cli/chat/permissions/
4. Kiro ACP — current docs  
   https://kiro.dev/docs/cli/acp/
5. Claude Code Auto mode — introduced 2026-03-24, official update notes GA 2026-07-10  
   https://claude.com/blog/auto-mode
6. Claude Code permission modes — current docs  
   https://code.claude.com/docs/en/permission-modes
7. OpenAI — Running Codex safely at OpenAI — 2026-05-08  
   https://openai.com/index/running-codex-safely/
8. CompozyOS permissions — current docs  
   https://www.compozy.com/docs/sessions/permissions/
9. ZeroClaw ACP — current docs  
   https://docs.zeroclaw.com/master/en/channels/acp.html

### Independent cross-checks

10. Reuters — Meta launches AI agent that can access other apps to send emails, make payments — 2026-09-08  
    https://www.reuters.com/business/meta-launches-ai-agent-that-can-access-other-apps-send-emails-make-payments-2026-09-08/
11. Axios — Meta debuts Muse, its long-planned personal AI agent — 2026-09-08  
    https://www.axios.com/2026/09/08/meta-debuts-muse-personal-ai-agent

### Community signals — anecdotal only

12. Reddit — permission prompt regression discussion — 2026-09-03  
    https://www.reddit.com/r/ClaudeAI/comments/1w63c1b/cc_back_to_asking_permission_for_every_command/
13. Reddit — request for folder-scoped destructive permission — 2026-07-01  
    https://www.reddit.com/r/ClaudeAI/comments/1uka5p4/how_can_i_allow_claude_code_to_run_rm_rf_on_a/

---

## What Changed Since Last Radar

Previous radar: `docs/competitive-intelligence/2026-09-09-external-radar.md`.

1. **Major new external event:** Meta Muse launched on 2026-09-08 after the previous radar, making a separate supervisory Sentinel, configurable service access, sensitive-action approvals and audit trail a mainstream consumer-agent product pattern.
2. **New direct-backend gap identified:** current OpenAB still documents `kiro-cli acp --trust-all-tools`, while Kiro 3.0’s current migration docs explicitly replace trust flags with capability-based `permissions.yaml`.
3. **New code-level OpenAB evidence surfaced:** the ACP client currently selects `allow_always` before `allow_once` and auto-replies to `session/request_permission`, so the remote broker suppresses the very permission surface that newer agent products are productizing.
4. **Portfolio product code did not materially change after the previous radar:** the newest observed commits were audit/documentation progression in `autodev-ng` and `92-duty-scheduler`; this round therefore focuses on new external market information rather than re-filing already known gaps.
5. **No new GitHub Issue was created:** OpenAB Issues are disabled, and existing autodev/skill-foundry fingerprints would make a central substitute Issue misleading. The central report is the authoritative record for this round.

## Round conclusion

The meaningful market shift is not “agents need more autonomy.” It is **autonomy must become capability-scoped, separately governed, and auditable**. For OpenAB, the highest-value next product move is to turn ACP permission requests into first-class, exact-target control objects instead of automatically choosing the most permissive available outcome.
