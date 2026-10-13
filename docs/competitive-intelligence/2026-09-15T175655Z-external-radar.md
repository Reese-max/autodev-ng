# External Competitive / New-Product / Workflow Radar — 2026-09-15T17:56:55Z

## Scope, rules, and evidence boundary

- Owner scope: `Reese-max` only.
- Issue-quality rule: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality-rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh owner inventory: **42 owned repositories; 39 unarchived**. Archived: `gemini-deidentifier`, `openab`, `obsidian-vault`.
- Current product classification retained after fresh listing: **36 product-like + 3 support/compatibility-only** (`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`). This run did not infer missing/renamed repositories from historical lists.
- Fair-rotation target inherited from the previous radar: **`herdr-skills`**. Current default branch: `main`; current HEAD observed: `9f134e1b0a53ffe72a64a5793ddc7dabe03ed571` (`docs: add herdr-skills 50-persona audit round 1`). Product-code baseline remains the August 31 hardening series; the latest default-branch commit is audit/docs.
- Next fair-rotation cursor: **`lobsterpulse`**.
- No product code, CI/config, secrets, permissions/settings, implementation branch, merge, deploy, worker, GOAL, paid request, or production data was changed.
- No live Herdr multi-agent run, Codex installation, provider session, external mutation, or OpenAI Agents API call was executed. Provider/runtime conclusions below that require execution remain `NEEDS_RUNTIME_VERIFICATION`.

## Product / owner direction re-read

Target: `Reese-max/herdr-skills`.

Current product is intentionally two narrow skills around an upstream Herdr control skill:

1. `herdr-reflect`: privacy-preserving, evidence-backed recall/learning for actual Herdr tasks. Candidate lessons cannot self-promote; deterministic/human evidence, project/runtime compatibility, staleness, conflicts, and privacy boundaries are first-class.
2. `herdr-supervisor`: policy + machine-checkable run-state gate for multi-agent Herdr workflows. It explicitly says it is **not** a Herdr CLI replacement. It tracks task/agent/lease/source-state/evidence/external-action state and only allows `DONE` after current deterministic evidence and no active unfinished work.

Current Supervisor contract already contains several strong boundaries relevant to this radar:

- scale out only when there is positive marginal value;
- conversation/agent claims such as `done`, `idle`, or `PLAN_READY` are not completion evidence;
- external mutation follows `PREPARE -> AUTHORIZE -> EXECUTE -> VERIFY`;
- crash/resume must inspect the action ledger and remote state before retrying, targeting at-most-once external mutation;
- untrusted repository/web/tool text cannot obtain Supervisor authority.

Current tracked work / coordination:

- `#3` — relocation/recovery defect for project-scoped Reflect identity; related PR `#5` exists. Do not change its scope from this radar.
- `#6` — correction/steering recurrence -> candidate Rule/Skill research. **Open PR #8 (`devin/issue-6-correction-candidates`) is active**, so external evidence touching this fingerprint is `SKIPPED_LOCKED` and stays in this central report.
- PR #8 currently has a review finding that exact proposed diffs can conflict with the research's `STRUCTURED_ONLY` privacy promise. This is implementation/research-review evidence, not a reason for the radar to seize the issue.
- 50-persona Round 1 remains `NOT CLEAN` because of #3 and missing live/runtime recovery evidence; this radar does not change that status.

## External Signals

### A. Direct platform / competitor shift — OpenAI Agents API makes generic long-running orchestration a managed primitive

**Status: CONFIRMED.**  
**Launch: 2026-09-10. Checked: 2026-09-15.**

Primary sources:

- https://openai.com/index/introducing-the-agents-api/
- https://platform.openai.com/docs/api-reference/agents
- https://platform.openai.com/docs/api-reference/agents/sessions
- https://platform.openai.com/docs/api-reference/agents/subagents

OpenAI launched the Agents API in public beta as a managed way to run cloud agents with the Codex harness. The current API exposes first-class managed sessions, turns/items, artifacts, subagents and nested subagents, status/lifecycle information, and usage. A developer can use an OpenAI-hosted sandbox, their own infrastructure, or a supported sandbox partner. The launch states there is no additional Agents API platform fee beyond the tokens/tools/resources actually used; this is a pricing/design signal, not a prediction of Reese-max cost.

#### Job-to-be-Done

Run a long-lived coding/knowledge agent with durable session state and multiple workers without building all orchestration/session infrastructure from scratch.

#### Manual work removed

- less custom session persistence;
- less custom subagent lifecycle bookkeeping;
- less custom artifact transport for completed hosted turns;
- fewer bespoke APIs just to enumerate active/closed children and their outputs.

#### Product implication for `herdr-supervisor`

This is a **major strategy signal to avoid scope expansion**. Generic hosted session/subagent/artifact plumbing is increasingly a provider capability. `herdr-supervisor` should not react by becoming a second hosted orchestrator, session database, subagent UI, or provider clone.

The defensible Reese-max layer remains:

`external runtime facts -> Herdr/Supervisor binding -> SOURCE_STATE_ID + task/lease/evidence state -> independent authorization gate -> deterministic completion receipt`

The provider can own runtime execution; Supervisor should own the policy/evidence claim it is specifically designed to make. A provider session reporting `completed` or a root agent returning an answer is not, by itself, proof that the Reese-max acceptance contract is satisfied.

#### What not to copy

- mandatory dependence on one cloud provider;
- a new hosted multi-agent runtime;
- a general agent marketplace/control center;
- treating provider `required_actions`, session status, or tool requests as user authorization;
- duplicating provider usage/billing dashboards without a demonstrated owner need.

### B. Adjacent workflow — Claude Code turns correction memory and subagent behavior into separate mechanisms

**Status: CONFIRMED capability.**  
**Relevant guidance published/updated during 2026; checked 2026-09-15.**

Primary sources:

- https://docs.anthropic.com/en/docs/claude-code/memory
- https://www.anthropic.com/engineering/claude-code-best-practices
- https://docs.anthropic.com/en/docs/claude-code/sub-agents

Claude Code's current memory model separates durable project/user instructions from Auto Memory. Auto Memory can learn from corrections without requiring a user to manually edit every memory entry, while subagents can maintain their own memory. Anthropic's guidance also distinguishes conversational instructions, durable instructions, skills, hooks, and subagents by persistence/authority/lifecycle; hooks are appropriate when a workflow has matured enough to require deterministic enforcement.

#### Job-to-be-Done

Stop repeatedly explaining the same preference or workflow, while still choosing when a behavior should become durable instruction or deterministic enforcement.

#### Transferable principle

`observation/correction -> memory candidate -> durable instruction -> deterministic hook/check` are different authority levels. This aligns with Reflect's existing `candidate != active rule != permission` boundary.

#### Decision

No new Issue. This maps to the same root fingerprint as `herdr-skills #6`, and PR #8 is active. **SKIPPED_LOCKED**: record the evidence here only. It supports keeping #6 narrow rather than broadening it into transcript ingestion, autonomous policy writing, or a cross-agent memory SaaS.

### C. Emerging / adjacent durable execution — Temporal-style durable workflow semantics remain a useful comparison, not a dependency

**Status: CONFIRMED capability / representative adjacent pattern. Checked 2026-09-15.**

Source:

- https://temporal.io/

Temporal continues to position durable execution around persisted workflow progress and recovery after process/infrastructure failure. The transferable principle is that long-running work should resume from externally persisted state rather than trusting conversational memory or blindly repeating side effects.

`herdr-supervisor` already implements the relevant product-level pattern through externalized run state, receipts, leases, SOURCE_STATE_ID, checkpoints, and an external-action ledger. Therefore this signal is **validation of current direction**, not evidence for adopting Temporal or adding another workflow engine.

## New Releases / platform strategy / pricing signal

### OpenAI Agents API — managed sessions/subagents/artifacts are now product primitives

- **2026-09-10:** public-beta launch.
- Current API exposes managed sessions, subagents (including nested/closed subagents), items, session artifacts, lifecycle/status, and usage.
- Pricing signal from launch: no separate Agents API platform fee; normal model/tool/resource usage remains billable.
- Product meaning: the cost of implementing generic orchestration plumbing is becoming harder to justify unless Reese-max has a unique requirement that provider runtimes cannot expose.

This does **not** prove Herdr should migrate to Agents API. Compatibility with Herdr, provider-independent semantics, runtime identity binding, privacy, and the user's actual workflow are all still UNKNOWN.

## Security / trust-boundary signal

### Anthropic — more capable agents make trust/config/action boundaries more important

**Status: CONFIRMED first-party security guidance; checked 2026-09-15.**

Sources:

- https://www.anthropic.com/engineering/how-we-contain-claude-across-products
- https://www.anthropic.com/news/assessment-cybersecurity-incidents

Anthropic's engineering guidance describes deferring project-local configuration parsing/execution until after trust decisions, because project content/configuration can itself become an attack surface. Its recent security reporting also discusses operations where multiple agent instances or subagents participate in workflows.

Transferable principle for Herdr Skills: **runtime orchestration state and repository content are inputs, not authority**. This reinforces the existing Supervisor rule that untrusted repository/web/tool text cannot broaden permissions and that external mutations need an independent authorization phase.

No new security Issue is opened because the current repository already states this boundary and there is no current reproducible supported-path bypass in this run.

## Community Pain Points

All items below are **COMMUNITY_SIGNAL**, not incidence data or verified product defects.

1. A September 2026 Codex community post describes unintended recursive spawning that allegedly created hundreds of subagents and continued consuming quota after the main interaction appeared complete.
2. A September 2026 Claude Code discussion reports stale/late subagent-status notifications causing extra turns and uncertainty about whether child work had really stopped.
3. An August 2026 Codex discussion complains that a newer subagent UI hides model/task/activity detail, reducing observability.
4. A September 2026 multi-agent side-project post reports agents re-litigating decisions when they lacked a small shared state/log, and claims a simple shared Markdown artifact was sufficient for that user's workflow.

Interpretation:

- “root agent answered” must not be equated with “run fully completed”; active children/leases/effects matter.
- observability should expose only the minimum evidence needed to understand current work and shutdown, not justify a new dashboard by itself.
- the simple-Markdown anecdote is an important counterexample to overengineering: some coordination gaps may need a small durable artifact, not a database/service.

## Opportunity Map — `herdr-skills`

### MUST MATCH

1. **Root completion != run completion.** A `DONE` claim must account for currently active agents/writers/leases and unresolved external actions.
2. **Runtime identity is evidence, not authority.** Provider session/subagent IDs and statuses may be useful receipts, but they cannot grant permissions or replace the acceptance contract.
3. **Correction/memory != enforcement.** Recall can help, but learned content cannot self-promote or acquire network/file/deploy authority.
4. **Fail closed on stale runtime bindings.** Runtime/version/capability drift must stale incompatible evidence rather than silently reuse it.
5. **Treat project/tool/web content as untrusted input.** No repository text or tool response may broaden scope or permissions.

### SHOULD BE BETTER

1. **Prefer thin runtime bindings over duplicated orchestration.** If Herdr later exposes authoritative provider session/subagent IDs, Supervisor should consume those facts rather than invent a second shadow runtime.
2. **Reuse provider artifacts where they are immutable and addressable.** Bind their IDs/hashes into existing evidence only when they actually cover an acceptance path; do not copy entire transcripts by default.
3. **Surface bounded usage/backpressure evidence if the runtime provides it.** This can inform scaling/cancellation, but does not justify a billing analytics product.
4. **Keep review surfaces compact.** The useful view is “which task/agent/effect is still blocking verified completion,” not a generic swarm dashboard.

### DIFFERENTIATOR

- Provider-agnostic evidence + authorization layer over whichever runtime Herdr actually controls.
- `SOURCE_STATE_ID`, leases, state-bound receipts, external-action authorization and a deterministic `DONE` validator.
- Reflect's separation of candidate, trusted evidence, active rule, conflict/staleness and runtime authority.
- Privacy-preserving local learning rather than raw transcript-as-policy.

### ADJACENT IDEA

**Provider-runtime evidence adapter** — radar-only, not an Issue. If a future Herdr backend exposes managed session/subagent/artifact APIs (OpenAI Agents API or equivalent), test whether one read-only adapter can bind authoritative child lifecycle/artifact IDs into the current Supervisor state. Do not build this until a real supported backend path exists and a user workflow demonstrates that current Herdr state lacks the needed fact.

### DO NOT COPY

- hosted agent platform / generic orchestration service;
- provider-specific runtime as mandatory architecture;
- team dashboard or agent marketplace;
- raw transcript ingestion as the default memory path;
- automatic correction -> active rule conversion;
- “subagent count” or “parallelism” as a success metric;
- provider status/required-action fields as authorization;
- new database/registry merely because provider APIs expose more objects.

## Four-gate decisions

### Candidate 1 — Build an OpenAI Agents API adapter now

**1. Problem/value:** No current repo/runtime evidence shows a supported Herdr workflow is blocked because Supervisor cannot read Agents API session/subagent data. OpenAI's launch is strategically important but does not establish owner pain.

**2. Priority:** `kind=OPPORTUNITY`, `severity=NOT_ESTABLISHED`, qualitative `decision_priority=LOW-MEDIUM`, `triage=NEEDS_EVIDENCE`, `auto_implementation=false` if it were ever tracked. No Issue created.

**3. Smallest path:** Do nothing in product code. Preserve the current provider-neutral run-state model. If Herdr later adopts/exposes such a provider backend, first perform a read-only mapping experiment against one session and one subagent lifecycle. A generic adapter framework/service is not justified.

**4. Research/implementation separation:** No bounded current experiment exists without a real supported Herdr backend path; therefore keep on radar only. External API existence is not implementation permission.

**Decision: RADAR_ONLY / DEFER.**

### Candidate 2 — Correction-to-rule / auto-memory refinement

A real manual-recognition gap is already tracked by `#6`. Current external evidence strengthens the distinction between memory, durable instructions, skills and deterministic hooks, but **PR #8 is active** on the same fingerprint.

**Decision: SKIPPED_LOCKED.** No comment or Issue update. The central report is the only write from this radar for this candidate.

### Candidate 3 — Add a new generic agent-observability dashboard

Community posts show observability pain, but current Supervisor already maintains agent/task/lease/effect state and the user direction rejects building broad control surfaces without evidence. The smallest solution, if a real supported-path gap later appears, would be a compact blocker/status readout from existing run state.

**Decision: REJECT NOW.** No Issue.

## Cross-portfolio ideas

### 1. Runtime execution can be delegated; authority should not be inferred from the runtime

Across `herdr-skills`, `autodev-ng`, `cf-mcp-server`, `chatgpt-dual-pipeline`, and other agent-facing tools, provider-native sessions/tools/subagents can reduce infrastructure work. Their state should be treated as **evidence inputs**. Permission, scope, and irreversible-effect authority must remain separately traceable to user/product policy.

Suggested invariant:

`provider runtime state -> evidence binding -> product acceptance/authorization policy -> effect -> verified receipt`

not:

`provider says ready -> action authorized`.

### 2. Root response != complete workflow

Any multi-agent product should distinguish:

`root response emitted`  
`all relevant child work settled/cancelled`  
`all writes/effects verified or cancelled`  
`acceptance evidence current`.

This is already mostly embodied by Herdr Supervisor. Other Reese-max orchestration projects should reuse the principle rather than inventing a common framework without a concrete shared gap.

## Rejected / deferred ideas

- **Replace Herdr with OpenAI Agents API:** rejected; no user/runtime evidence, breaks provider-neutral direction, and API is beta.
- **Build another session/subagent database:** rejected; provider platforms increasingly provide this, while Herdr Supervisor already stores the narrower evidence state it needs.
- **Create a live swarm dashboard:** rejected pending a demonstrated decision/operational gap.
- **Automatically mine all raw Claude/Codex transcripts:** rejected; violates current Reflect privacy direction and overlaps active #6 research.
- **Copy fixed recurrence thresholds from another product:** rejected; no evidence they transfer to Herdr.
- **Add Temporal as a dependency:** rejected; current state/receipt design already captures the relevant durable-execution principle and no missing path requires another workflow engine.
- **Open a security Issue based only on industry incident reports:** rejected; no reproducible supported-path Herdr bypass was established.

## Issue / PR Mapping

| Repo | Existing tracking | This round |
|---|---|---|
| `herdr-skills` | #3 + PR #5 — project relocation/rebind | No change; separate active work. |
| `herdr-skills` | #6 + **open PR #8** — correction -> candidate improvement | `SKIPPED_LOCKED`; new Claude/memory evidence recorded only here. |
| `herdr-skills` | #2 — continuous persona audit | No status change; radar does not declare CLEAN. |
| `herdr-skills` | OpenAI Agents API runtime-adapter idea | **No Issue**; `RADAR_ONLY / NEEDS_EVIDENCE`. |

New Issues created: **0**.  
Existing Issues modified: **0**.  
Issue locks acquired: **0** — no Issue write was necessary; active PR ownership was respected.

## Sources

First-party / primary:

1. OpenAI — Introducing the Agents API, 2026-09-10: https://openai.com/index/introducing-the-agents-api/
2. OpenAI Agents API reference — sessions: https://platform.openai.com/docs/api-reference/agents/sessions
3. OpenAI Agents API reference — subagents: https://platform.openai.com/docs/api-reference/agents/subagents
4. OpenAI Agents API reference — general resources/artifacts/items: https://platform.openai.com/docs/api-reference/agents
5. Claude Code memory: https://docs.anthropic.com/en/docs/claude-code/memory
6. Anthropic / Claude Code engineering guidance: https://www.anthropic.com/engineering/claude-code-best-practices
7. Claude Code subagents: https://docs.anthropic.com/en/docs/claude-code/sub-agents
8. Anthropic — containment/trust guidance: https://www.anthropic.com/engineering/how-we-contain-claude-across-products
9. Anthropic — cybersecurity incident assessment: https://www.anthropic.com/news/assessment-cybersecurity-incidents
10. Temporal durable execution overview: https://temporal.io/

Community signals, checked 2026-09-15 and treated as anecdotal only:

- Reddit / r/codex — September 2026 recursive-subagent/quota discussion.
- Reddit / r/ClaudeCode — September 2026 subagent-status/extra-turn discussion.
- Reddit / r/codex — August 2026 subagent-UI observability discussion.
- Reddit / r/SideProject — September 2026 simple shared-state/multi-agent coordination anecdote.

## What changed since the previous radar

1. Fair rotation moved from `google-maps-personal-mcp` to `herdr-skills`.
2. The largest external change is **OpenAI Agents API (2026-09-10)**, which makes managed sessions/subagents/artifacts a first-party platform primitive. This materially strengthens the case that Herdr Supervisor should remain a policy/evidence layer rather than expand into generic orchestration infrastructure.
3. Claude Code's current correction/auto-memory and subagent guidance gives fresh external support to `candidate/memory != active enforcement`, but the same fingerprint is already under active #6 / PR #8 work, so no Issue update was made.
4. Security/trust evidence from Anthropic reinforces existing fail-closed treatment of project-local/untrusted content; no new reproducible Herdr defect was established.
5. No high-confidence new feature passed the four gates. **Zero new Issues is the intended outcome for this round.**

## Severity / scope calibration

- No P0/P1/P2 was created from competitor capabilities, community posts, missing provider integration, or absent runtime evidence.
- OpenAI Agents API is a high-value strategic signal, not proof of a Reese-max defect.
- Community reports of runaway/stale subagents are not used as incidence rates and do not establish a Herdr bug.
- Existing #6 remains an active research fingerprint and was not rewritten while PR #8 is open.
- Existing #3 remains a separate concrete P2 recovery defect; this radar did not dilute or merge it into broader orchestration research.

## Completion / gaps / continuation

Completed this round:

- fresh owner inventory and unarchived scope check;
- Issue Quality v2 re-read + blob SHA verification;
- current `herdr-skills` default-branch direction, README, Reflect/Supervisor policy, audit, Issues and all-state PR review;
- coordination check for #6 / PR #8 and #3 / PR #5;
- current external A/B/C research using public-web primary sources;
- qualitative Opportunity Map and four-gate decision review;
- zero duplicate or speculative Issue writes.

Remaining gaps:

- no live Herdr runtime was exercised;
- no Agents API integration was tested;
- no owner study shows that provider-native runtime IDs would reduce a current Herdr manual step;
- #6's active PR review/privacy findings must be resolved by its current owner/workflow, not this radar;
- no portfolio CLEAN claim is made.

**Next fair-rotation cursor: `lobsterpulse`.**
