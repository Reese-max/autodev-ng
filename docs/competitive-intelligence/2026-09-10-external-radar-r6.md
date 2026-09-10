# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-10 r6

> Scope: Reese-max owned, unarchived, product-like repositories.  
> Primary evidence source: **public web outside GitHub**. GitHub is used only to establish current product state/recent changes, perform Issue/PR/lock deduplication, and persist this report / Issue mapping.  
> Evidence labels: `CONFIRMED` = official/first-party fact or strong independent reporting; `LIKELY` = plausible but incomplete; `COMMUNITY_SIGNAL` = anecdotal community evidence only; `UNKNOWN` = insufficient evidence.  
> Opportunity scores are portfolio heuristics, not statistical measurements. Marketing claims are not treated as product-effect evidence.

---

# Executive Summary

This round found **one new, non-duplicate high-value opportunity** and created **`Reese-max/herdr-skills #6`**:

**`[Competitive Inspiration][RESEARCH_REQUIRED] 建立 Correction→Candidate Improvement Pipeline，將重複 steering 轉成可驗證 Rule／Skill 提案`**

Opportunity Score: **94/100**.

The strongest new market signal is not “add more memory.” It is a shift from passive memory toward **turning repeated human corrections into inspectable improvement candidates**, while keeping proposal, validation, activation, and runtime authority separate.

Blume.codes, launched on Product Hunt in September 2026 and currently positioned as a local sidecar for Claude Code, Codex, Cursor, omp, and Pi, surfaces corrections/steering/frustration across coding-agent sessions, groups repeated patterns, and proposes concrete Rule/Skill changes. Its public product surface explicitly emphasizes evidence plus exact diff before apply/dismiss/save-later. This is highly relevant to `herdr-reflect`, because Reese-max already has the harder governance primitives—candidate vs active, evidence-backed validation, conflict handling, staleness, and permission separation—but the user/agent still has to manually notice that a correction keeps recurring and manually formulate the candidate lesson.

The proposed lifecycle is:

`Observed Correction / Steering → Sanitized FeedbackSignal → Recurrence / Conflict Cluster → CandidateImprovement → Evidence + Exact Proposed Diff → Validation / Skill Foundry Eval → Human / Existing Promotion Gate → Active Rule or Skill → Behavior Receipt`

The key product rule is:

**correction = evidence, not immediate policy.**

This round also materially strengthened three existing opportunities without creating duplicates:

- **`flux-image-gen #18`**: Apple Reference Image adds a capture-side provenance anchor, so AI-edit provenance should distinguish `HASH_ONLY` source identity from a verified capture/credential source. Existing #18 was updated rather than duplicated.
- **`autodev-ng #12`**: Harden’s new local pre-execution guardrail reinforces an action-scoped containment UX: block the unsafe effect while allowing other already-authorized local/read-only work to continue. Existing #12 remains the hard-containment owner.
- **`skill-foundry #3`**: Tenable’s 2026-09-09 detailed Exchange Inspector workflow supports a risk-tiered evaluation budget: deterministic baseline for every candidate; expensive frontier-model/dynamic/human review only when risk/complexity requires escalation.

No product source code, implementation branch, merge, deploy, secrets, permissions, repository settings, host firewall, runtime configuration, or production environment was modified by this radar.

---

# Portfolio / Recent Change Scan

Current owned + unarchived product-like scope remains **35 repositories**:

`92-duty-scheduler`, `adng-memory`, `ai-novel-workstation`, `autodev-ng`, `avatar-vfo`, `cf-ai-router`, `cf-mcp-server`, `chatgpt-dual-pipeline`, `claude-mem`, `clinical-scribe-worker`, `cyber-prep-coach`, `exam-archive`, `flux-image-gen`, `herdr-skills`, `internship-notes-sites-mirror`, `lobsterpulse`, `lplrs-judicial-sync`, `MaterialYouNewTab`, `minideck`, `neciken-summer-poem`, `ninax-line-hermes`, `note-filler`, `police-exam-archive`, `police-exam-practice`, `ppt-studio`, `project-doctor-web`, `prompt-autoresearch`, `skill-foundry`, `soundbox-offline`, `taichung-police-intel`, `taiwan-intel-dashboard`, `tick-stock-panel`, `UkePack`, `video-timeline-pipeline`, `voice-actress`.

Archived repositories remain excluded rather than silently mixed into the product count.

## Material repository / Issue state checked this round

### `herdr-skills`
Current product direction is unusually well aligned with the external correction-mining signal:

- `herdr-reflect` is already a privacy-preserving, evidence-backed learning overlay rather than raw transcript memory.
- Each task can record one experience and optionally one candidate lesson.
- A project rule requires trusted compatible validation in two distinct task IDs before activation; `agent_claim` can never self-promote.
- Contradictory active rules conflict rather than silently last-write-wins.
- Tool/operational rules can become stale when Herdr/policy/protocol/capability fingerprints change.
- Learned rules explicitly cannot grant permissions, broaden scope, authorize spending/deploy/delete/external writes, or control another Herdr session.
- Raw prompts, full terminal output, source snippets, credentials, and raw working-directory paths are outside the durable learning contract.

The missing step is **before candidate creation**: repeated corrections still require a human/agent to notice the recurrence and manually formulate the candidate rule/check/skill.

Current open PR #5 is about project relocation/rebind identity, not feedback distillation. Open/closed Issue search and all-state PR search for correction/feedback/repeated-rule/skill-learning fingerprints found no duplicate of the new opportunity.

### Other recent repository/Issue state

- `lobsterpulse` currently has active work around truthful desktop distribution and provider/K0 denominator truth, so another broad “agent desktop” feature is not warranted.
- `taiwan-intel-dashboard` still has active reliability work around operating-state and summary truth; distribution expansion should remain secondary.
- `flux-image-gen #18`, `skill-foundry #3`, and `autodev-ng #12` already own the relevant provenance, supply-chain-security, and egress-security fingerprints; this round updates them instead of creating parallel Issues.

---

# External Signals

## A. Direct competitor recent capability

### A1 — Blume.codes: repeated corrections become Rule / Skill proposals

**Status:** `CONFIRMED`  
**Current product checked:** 2026-09-10  
**Product Hunt launch surface:** September 2026  
**URLs:**
- https://www.producthunt.com/products/blume-codes
- https://blume.codes/
- https://blume.codes/blog/you-already-told-your-agent-that

Blume is a local desktop sidecar that sits next to existing coding agents instead of replacing the IDE or harness. Its public product surface supports Claude Code, Codex, Cursor, omp, and Pi and emphasizes four related surfaces: Agent status, Setup/rules/skills, Usage, and Improve.

The important workflow is:

1. observe local coding-agent sessions;
2. detect corrections / steering / repeated workflow explanations;
3. form recurring clusters;
4. propose a Rule / Skill / Hook / docs change;
5. show supporting evidence and exact diff;
6. user applies, dismisses, or saves for later.

The product gives concrete examples: repeated requests to run tests/typecheck before handoff become a verification-rule candidate; repeated explanation of a desktop release sequence becomes a Skill candidate shared to another agent.

**JTBD:** stop repeatedly re-explaining project conventions and review corrections across agent sessions.

**Why it can feel faster:** the user’s normal correction behavior becomes the intake surface; there is no separate “go maintain your AGENTS.md/Skill library now” bookkeeping step.

**Onboarding / distribution:** sidecar to existing tools, local conversation storage, free entry point; users do not have to migrate their coding environment.

**Automation / collaboration pattern:** passive observation → candidate improvement, not passive memory alone. Roadmap messaging also points toward team conflict resolution and domain models.

**Business-model signal:** free/local individual entry suggests the durable value is the cross-agent control/improvement layer rather than per-generation tokens.

**Limits / failure modes:** Product Hunt discussion includes concern that one-off feedback can be hardened too early. The maker describes recurrence/pain thresholds, but those thresholds are implementation details, not validated universal policy.

**Absorb:** correction-as-signal, evidence-backed preview, exact proposed diff, cross-agent candidate handoff.  
**Do not copy:** automatic transcript surveillance as default, emotion/frustration as correctness evidence, hard-coded recurrence thresholds, or immediate auto-edit of agent configuration.

---

### A2 — Harden: pre-execution guardrail blocks one action, not the whole agent

**Status:** `CONFIRMED_PRODUCT_SIGNAL`; performance claims remain vendor claims  
**Launch checked:** 2026-09-10; Product Hunt launch current around 2026-09-09  
**URLs:**
- https://www.producthunt.com/products/agent-integrity-foundation-aif
- https://harden.run/

Harden positions itself as a free/local security layer for coding agents including Claude Code, Codex, Cursor, Hermes, OpenClaw, Kiro, and Gemini AntiGravity. Its public workflow checks commands/file edits/tool calls/outbound requests before execution and can allow/log/rewrite/block an individual action while allowing the rest of the task to continue.

**JTBD:** let an autonomous agent continue useful work without approving every command, while stopping obviously dangerous external/destructive effects.

**Transferable pattern:** action-scoped denial is better UX than converting every blocked effect into a full-session kill switch.

**Do not copy:** a model guardrail is not proof of hard network containment. Native-hook, MCP-proxy, setup process, browser/tool bridge, and child-process coverage must still be independently verified. Vendor benchmark claims are not Reese-max effect evidence.

**Disposition:** update existing `autodev-ng #12`; do not create another firewall Issue.

---

### A3 — Tenable Exchange Inspector: risk-tiered review of agents/skills/MCP components

**Status:** `CONFIRMED`  
**Published:** 2026-09-09  
**URLs:**
- https://www.tenable.com/blog/ai-agent-security-openai-tenable-cyberagents-exchange-inspector
- https://www.tenable.com/press-releases/tenable-uses-openai-gpt-cyber-models-to-help-defenders-inspect-community-built-ai-components

Tenable describes a staged review pipeline for agents, Skills, MCP servers, and multi-agent playbooks:

- every submission gets a baseline review;
- material source changes require a new review;
- automated first pass checks sensitive-data / prompt-injection concerns;
- risk, authorization, and technical complexity determine which model/access tier is used;
- higher-risk items escalate to more specialized models and human review;
- source-reviewed submissions are installed/exercised in a clean isolated environment;
- observed runtime behavior is compared against documentation claims.

**JTBD:** avoid paying the full cost of highest-assurance review on every low-risk package, while still escalating truly risky components.

**Transferable pattern:** `cheap deterministic baseline → risk classification → selective expensive review → isolated runtime evidence → attestation`.

**Do not copy:** a model refusal or safe completion is not a clean security verdict; neither is a vendor trust score. Risk-model selection and escalation policy themselves need versioned evidence.

**Disposition:** update existing `skill-foundry #3`; no duplicate Issue.

---

## B. Adjacent transferable workflow

### B1 — Supermemory: automatic recall removes bookkeeping; security incident shows memory ≠ authority

**Status:** `CONFIRMED`  
**Dates:** 2026-08-21 and 2026-08-12  
**URLs:**
- https://supermemory.ai/changelog/plugins/
- https://supermemory.ai/changelog/plugins/claude/

On 2026-08-21, Supermemory made relevant-memory recall automatic for substantive Claude Code prompts and added a status line showing loaded/captured/recalled counts and save/recall freshness. This is a strong adjacent signal that manual “remember to save/remember to search” bookkeeping is being removed from agent workflows.

However, its 2026-08-12 security update states that during memory recall, a crafted Bash command could be automatically approved and run without confirmation. That is a valuable counter-signal: **frictionless recall must never silently become action authority**.

**Transferable principle to Herdr:** automate signal capture/candidate formation if useful, but preserve current separation between observation, candidate lesson, active rule, and runtime permission.

---

### B2 — StockAlert.pro: MCP alert/watchlist management plus domain-semantic false-positive reduction

**Status:** `CONFIRMED`  
**Dates:** 2026-09-01 to 2026-09-08  
**URL:** https://stockalert.pro/changelog

Recent changes include:

- 2026-09-01: Claude/ChatGPT/Codex can manage alerts via MCP;
- 2026-09-03: watchlist list/add/remove over MCP, with removal still requiring confirmation and OAuth scopes preserved until reconnect;
- 2026-09-07: symbol screener + suggested alert setups;
- 2026-09-08: insider alerts now exclude tax-withholding shares that previously looked like open-market sells.

Two transferable ideas matter more than “add MCP”:

1. **agent access should preserve the same product limits and confirmation semantics as the UI**;
2. **better domain semantics can remove noisy alerts more effectively than adding more AI summarization**.

For `tick-stock-panel`, this is research-only. The current product already has rich local monitoring, explicit non-trading boundaries, and should not expand into autonomous trading or unbounded agent writes merely because a competitor exposes alerts over MCP.

---

### B3 — Partial-window completeness should be explicit, not inferred

**Status:** `LIKELY / RESEARCH_SIGNAL`  
**Checked:** 2026-09-10

Recent data/MCP products increasingly expose not only the returned rows but whether a result window is complete, whether older data exists, and where the next continuation starts. This is especially valuable across `tick-stock-panel`, `taiwan-intel-dashboard`, `taichung-police-intel`, `video-timeline-pipeline`, and legal/intelligence retrieval.

**Transferable product primitive:** `WindowCompletenessReceipt = {complete, has_more, continuation, observed_at, source_revision}`.

This avoids a common automation failure: “API returned 100 rows” being silently interpreted as “there are only 100 rows.”

No new Issue is opened this round because this is cross-portfolio research rather than a proven repository-specific gap with enough direct product evidence.

---

## C. Emerging research / technical possibility

### C1 — TRACE: compile user corrections into atomic rules + runtime checks

**Status:** `CONFIRMED_RESEARCH`  
**Published:** 2026-06-11  
**URL:** https://arxiv.org/abs/2606.13174

TRACE explicitly studies the gap between **preference access** and **preference compliance**. It mines user corrections, rewrites them into atomic rules, and compiles them into checks that must pass before completion.

The paper reports substantial benchmark improvements in its own anonymized/simulated protocol. Those percentages are **not** generalizable to Herdr/Codex/real users. The useful transferable principle is structural:

`correction capture → atomic candidate rule → applicability → runtime check → outcome evidence`.

This is stronger than “put the correction into long-term memory and hope the model obeys it next time.”

---

### C2 — Accumulated Behavioral Rules

**Status:** `CONFIRMED_RESEARCH`  
**Published:** 2026-07-13  
**URL:** https://arxiv.org/abs/2607.13091

This work turns accepted code-review feedback into persistent behavioral rules and a pre-submission checklist. It reports deployment across a 35+ service platform but only 11 recorded sessions, so its outcome claims must remain narrow.

**Transferable principle:** review feedback can become operational knowledge, but rule growth must be measured together with recurrence, false positives, and behavior—not by rule count alone.

---

### C3 — Auditable self-improvement needs candidate/promotion separation

**Status:** `CONFIRMED_RESEARCH_DIRECTION`  
**Representative source:** https://arxiv.org/abs/2606.10241

Recent self-improvement systems increasingly use append-only events, candidate patches, static validation, bounded evaluation, held-out checks, and explicit promotion/discard records.

**Transferable principle:** a system may generate its own proposed improvement, but it should not be able to certify that proposal merely because it generated it.

This fits Reese-max’s existing `candidate ≠ active` design and is one reason the new Herdr opportunity is narrower than Blume’s eventual “Auto-Improve Mode.”

---

### C4 — Apple Reference Image creates a capture-side provenance anchor

**Status:** `CONFIRMED`; independent reporting cross-check available  
**Apple announcement:** 2026-09-09  
**Independent coverage:** 2026-09-10  
**URLs:**
- https://www.apple.com/newsroom/2026/09/apple-debuts-iphone-18-pro-and-iphone-18-pro-max/
- https://www.theverge.com/tech/992766/apple-iphone-18-pro-reference-image

Apple introduced opt-in Reference Image on iPhone 18 Pro models. In Reference mode, signed sensor data is developed into an unalterable reference image, viewable alongside the editable image. Apple also says APIs are available in iOS/iPadOS/macOS 27 for third-party apps to view reference images, while SynthID support for most edited images is planned in a later software update.

**Product possibility for `flux-image-gen`:** source provenance for an edit can be more than `input SHA-256`; it can reference a capture/platform credential anchor.

**Critical limitation:** this proves provenance/capture linkage, not that the depicted scene is “true.” Absence of such a reference does not prove an image is AI-generated or fake.

**Disposition:** update existing `flux-image-gen #18`, not a new Feature.

---

# New Releases / Changes Worth Tracking

| Date | Status | Product / change | Reese-max relevance | Decision |
|---|---|---|---|---|
| 2026-09-10 / current | CONFIRMED | Blume.codes current sidecar shows Corrections/Steering clusters → exact Rule/Skill proposals | Directly matches `herdr-reflect` pre-candidate gap | **CREATE `herdr-skills #6`** |
| 2026-09-10 / launch current | CONFIRMED_PRODUCT_SIGNAL | Harden local pre-execution guardrail for coding agents | Strengthens action-scoped external-effect control | Update `autodev-ng #12`; no duplicate |
| 2026-09-10 | CONFIRMED independent | The Verge details Apple Reference Image APIs/capture anchor | Cross-checks Apple official provenance direction | Update `flux-image-gen #18` |
| 2026-09-09 | CONFIRMED | Apple Reference Image announced with iPhone 18 Pro | Capture-side provenance anchor for edit workflows | Update `flux-image-gen #18` |
| 2026-09-09 | CONFIRMED | Tenable publishes risk-tiered Exchange Inspector design | Selective expensive review for Skill/agent supply chain | Update `skill-foundry #3` |
| 2026-09-08 | CONFIRMED | StockAlert insider alerts exclude tax-withholding shares | Domain-semantic filtering can remove false alerts | Research for `tick-stock-panel` |
| 2026-09-07 | CONFIRMED | StockAlert new symbol screener + suggested alert setups | Better alert onboarding | Research only |
| 2026-09-03 | CONFIRMED | StockAlert new dashboard + MCP watchlist/alert operations | Agent workflow integration without trading | Research only; preserve explicit confirmation |
| 2026-09-03 / September launch | CONFIRMED_PRODUCT_SIGNAL | Blume Product Hunt launch | Correction→improvement category is now productized | High-value `herdr-skills #6` |
| 2026-08-21 | CONFIRMED | Supermemory automatic Claude Code recall/statusline | Removes manual memory bookkeeping | Adjacent principle; no new memory Issue |
| 2026-08-12 | CONFIRMED | Supermemory patches recall-time command auto-approval problem | Recall can become an unsafe action path | Reinforces permission separation |

---

# Community Pain Points

Community evidence below is **anecdotal only** and is never treated as prevalence or effect statistics.

## 1. One-off correction becoming permanent policy

**Status:** `COMMUNITY_SIGNAL`  
**Surface:** Product Hunt discussion around Blume  
**Checked:** 2026-09-10  
**URL:** https://www.producthunt.com/products/blume-codes

A commenter raises the obvious danger: one situational correction may be hardened into a permanent rule. The maker describes conservative recurrence/pain thresholds.

**Product implication:** Reese-max should not copy a fixed threshold. Candidate ranking may use recurrence, but promotion still needs trusted evidence, scope, contradiction handling, and actual rule validation.

## 2. Users repeatedly re-explain the same corrections across different coding agents

**Status:** `COMMUNITY_SIGNAL`  
**Representative date:** 2026-07-08  
**Representative URL:** https://www.reddit.com/r/AI_Agents/comments/1uqtdn8/your_agent_forgets_every_correction_you_give_it_i/

One user reports mining their own Claude Code/Codex/Cursor histories and finding many feedback snippets collapsing to a much smaller set of recurring issues.

**Product implication:** recurrence discovery can be useful even when the final policy is not automatically activated.

## 3. Rulebook bloat can reduce usability

**Status:** `COMMUNITY_SIGNAL`  
**Representative discussion:** 2026  

Coding-agent users periodically report that very large global instruction/rule collections become hard to reason about and may be inconsistently followed.

**Product implication:** the new Herdr pipeline must support `MERGE`, `NARROW_SCOPE`, `SUPERSEDE_STALE`, and `DELETE_REDUNDANT`—not just `ADD_RULE`.

---

# High-Value Opportunity Analysis — `herdr-skills #6`

## Opportunity

**Correction → Candidate Improvement Pipeline**

`herdr-reflect` already has a strong evidence/promotion model, but it still assumes someone recognizes the lesson and writes it down. That creates a repeated manual workflow:

1. User corrects an agent during a Herdr task.
2. The task completes or partially completes.
3. User/agent manually decides whether this correction was important.
4. Someone manually creates the `key / rule / scope / evidence` candidate.
5. Later, a similar correction happens again.
6. Someone must remember that a related candidate already exists and decide whether it is the same rule, a contradiction, or a narrower scope.
7. Larger repeated workflows must be separately translated into a Skill/checklist.

The opportunity is to automate **candidate discovery and packaging**, not authority.

## Minimum Valuable Research Contract

### 1. `FeedbackSignal`

Versioned, privacy-preserving event with only the minimum needed to identify a recurring pattern:

- pseudonymous project id / task id;
- Herdr/runtime/policy fingerprints;
- event kind: `CORRECTION | STEERING | REWORK | REPEATED_WORKFLOW | ACCEPTED_REVIEW`;
- short sanitized semantic summary;
- candidate target concept/key;
- evidence pointer/hash or existing Reflect event id;
- observed time;
- extractor version/confidence;
- sensitive-material flag.

Raw prompt, full pane transcript, source code, terminal dump, and secrets do not become the durable event.

### 2. Capture modes

- `STRUCTURED_ONLY`: the current Herdr/Reflect task emits a minimal structured signal—no historical transcript scan.
- `LOCAL_OPT_IN_REVIEW`: if the host can legitimately inspect local session history, bounded local extraction may propose signals; the original transcript is not copied into the durable store.
- default research posture: `NO_EXTERNAL_CONTENT_EGRESS`.

### 3. Recurrence + conflict clustering

Candidate ranking may use:

- distinct task count;
- same-project vs cross-project recurrence;
- repeated rework/failure context;
- runtime compatibility;
- supporting evidence strength;
- counterexamples / conflicting corrections.

A cluster is **not** validation. The system must not promote a rule merely because the same wording appeared many times.

### 4. Candidate types

- `REFLECT_RULE_CANDIDATE`
- `CHECK_CANDIDATE`
- `SKILL_DRAFT`
- `DOC_ONLY`
- `REJECT_NOISE`
- `CONFLICT`
- `INSUFFICIENT_EVIDENCE`

A deterministic “run tests before claiming completion” correction should prefer a check candidate when feasible; a multi-step release workflow may be a `SKILL_DRAFT`; a temporary preference may stay one-off.

### 5. Evidence-first preview

Before any promotion, the operator should be able to see:

- how many independent tasks support this candidate;
- exact supporting occurrence IDs;
- contradictory examples;
- whether an equivalent active rule already exists;
- proposed exact Rule/check/Skill diff;
- recommendation: `ADD | MERGE | NARROW | SUPERSEDE | DELETE | SNOOZE | DISMISS | CONFLICT`.

### 6. Reuse current authority gates

- Reflect candidate still requires current trusted-validation thresholds.
- Cluster count cannot replace “the rule itself was actually exercised.”
- A `CHECK_CANDIDATE` must prove it catches the intended failure without blocking benign fixtures.
- A `SKILL_DRAFT` should hand off to `skill-foundry`; runtime compatibility and package-security evidence remain separate.
- Promotion cannot grant spending, deployment, deletion, external-write, cross-session-control, or broader tool permissions.

## Why it fits Reese-max

- The difficult lifecycle primitives already exist in Reflect.
- It reduces manual “remember what I keep correcting → retype a rule” work without turning the learning store into raw surveillance.
- It connects naturally to `skill-foundry`, `adng-memory`, `autodev-ng`, `claude-mem`, and potentially `lobsterpulse` as consumers/producers of improvement signals.
- It preserves Reese-max’s recurring cross-portfolio pattern: candidate creation can be probabilistic; activation must be evidence-gated.

## Why not copy Blume directly

- Blume optimizes a desktop sidecar for several coding agents; Herdr Reflect already has stronger internal evidence/promotion semantics.
- A frustration score can prioritize review, but it is not correctness evidence.
- Local raw transcript storage may be acceptable for a desktop product but is unnecessary for the first Herdr research version.
- “Auto-Improve Mode” is explicitly not the first target; automatic self-modification increases privacy, bloat, and self-confirmation risk.

---

# Opportunity Score

| Candidate | Pain | Fit | Novelty | Evidence | Reuse | Effort-control | Risk-control | Score | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **Herdr Correction→Candidate Improvement Pipeline** | 9 | 10 | 8 | 10 | 10 | 8 | 8 | **94** | **CREATE `herdr-skills #6`** |
| **Capture-side `SourceEvidenceRef` / Apple Reference Image adapter** | 8 | 10 | 9 | 10 | 8 | 7 | 8 | **91** | **UPDATE existing `flux-image-gen #18`** |
| **Risk-tiered Skill/Agent security evaluation** | 8 | 10 | 7 | 10 | 10 | 8 | 8 | **90** | **UPDATE existing `skill-foundry #3`** |
| **Action-scoped pre-execution containment / safe continuation** | 9 | 10 | 6 | 9 | 10 | 7 | 7 | **88** | **UPDATE existing `autodev-ng #12`** |
| Tick-stock MCP watchlist/alert management + semantic alert filtering | 7 | 8 | 7 | 9 | 8 | 7 | 7 | **84** | RESEARCH ONLY; existing monitor is already strong |
| Cross-portfolio Window Completeness Receipt | 7 | 8 | 7 | 7 | 10 | 8 | 9 | **83** | RESEARCH; needs stronger repository-specific evidence before Issue |
| Autonomous pay-per-request finance-data wallet | 5 | 3 | 9 | 9 | 5 | 5 | 2 | **54** | **DO NOT COPY**: conflicts with cost authority / non-trading posture |

---

# Adjacent Ideas

1. **Correction is evidence, not policy** — learn from user friction without treating a single chat message as durable authority.
2. **FeedbackSignal should be smaller than a transcript** — keep a sanitized semantic/event envelope with evidence pointers.
3. **Prefer deterministic checks over prose rules when possible** — “run tests before ready” is better as an enforceable completion check than another paragraph in context.
4. **Rule/Skill discovery should include deletion** — merge duplicates, narrow scope, supersede stale rules, delete redundant candidates.
5. **Action-scoped denial** — block a dangerous network/tool effect without cancelling unrelated already-approved local work.
6. **Risk-tiered evaluation budget** — cheap deterministic checks for all; expensive semantic/dynamic/human review only for high-risk ambiguity.
7. **Capture provenance can precede generation** — source media may carry a capture/platform credential anchor distinct from the AI output receipt.
8. **Window completeness is part of truth** — partial query results should explicitly say whether more data exists and how to continue.
9. **Agent write surfaces should inherit UI limits** — MCP/API access should preserve confirmation, quota, and non-trading constraints instead of becoming a privileged bypass.
10. **Memory recall ≠ compliance ≠ permission** — automatic recall improves convenience but must never grant runtime effect authority.

---

# Opportunity Map — 35 Product Repositories

| Product | Market Category | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| `cf-ai-router` | multi-provider AI gateway | truthful provider/model lifecycle + cost gate | planned-EOL canary before runtime break | owner-controlled free/subscription routing receipts | lifecycle registry reusable by other products | enterprise breadth / residency feature without user need |
| `soundbox-offline` | local-first offline music PWA | reliable local playback/import/backup | safer mobile transfer/recovery | no-account no-cloud owned-music workflow | LAN direct import already #3 | streaming catalog/social/soundboard category creep |
| `police-exam-archive` | exam archive / practice data | complete questions/images/provenance | mobile source fidelity | traceable official exam corpus | capability-level learning evidence after data quality | generic AI tutor before source completeness |
| `skill-foundry` | Agent Skill certification / promotion | exact artifact/runtime/security evidence | **risk-tiered baseline→semantic/dynamic/human escalation with versioned cost/reason evidence** | evidence-gated promotion across quality/runtime/security | receive `SKILL_DRAFT` from Herdr correction pipeline | marketplace breadth, universal trust score, or all-candidates-frontier-model cost |
| `prompt-autoresearch` | autonomous prompt optimization | reproducible eval + budget + holdout | variance-aware promotion | inspectable prompt evolution evidence | correction signals as held-out failure taxonomy, not self-label truth | unbounded self-evolution before evaluation reliability |
| `lobsterpulse` | multi-agent desktop monitor | truthful provider state + truthful install/distribution | action-type attention triage | local quota + agent state + rules/replay | show pending improvement proposals / blocked effects as attention items | generic AI ranking or another heavy IDE |
| `tick-stock-panel` | market dashboard | source freshness + delayed/live + **window-completeness truth** | domain-semantic alert filtering before more AI summaries | compact evidence-first monitoring with non-trading boundary | task-level MCP for alerts/watchlist with same confirmation/quota rules | autonomous trading, autonomous wallet spending, unsupported financial advice |
| `clinical-scribe-worker` | clinical documentation assistant | clinician review + provenance + privacy | EHR/workflow handoff | bounded documentation not diagnosis | explicit external-data destination policy | autonomous clinical decision/action platform |
| `adng-memory` | cross-repo operational memory | origin/lifecycle/deletion contract | poisoning-aware retrieval | receipts for accepted durable state | feedback signals may reference memory events, but memory never becomes policy automatically | more memory = more trust |
| `avatar-vfo` | persistent AI persona / virtual relationship | continuity + exact behavior regression | trajectory recall evidence | state-machine explainability if it proves value | correction/pref signals can be candidate state only | more psychological dimensions without ablation evidence |
| `note-filler` | automated note/content filling | explicit input/output provenance | reproducible template completion | bounded structured transformation | human preview/diff before fill | opaque auto-write into unknown documents |
| `taiwan-intel-dashboard` | public intelligence dashboard | source truth / operating status / summary integrity | deterministic degradation + completeness receipt | public evidence + provenance | outbound evidence interfaces only after truth layer | more AI surface before #17/#18 reliability |
| `cyber-prep-coach` | cybersecurity exam coach | explanation calibration + exam fidelity | mastery evidence | source-grounded coaching | portable capability record later | broader tutor chat before SME gold-set gate |
| `UkePack` | ukulele/music utility | core mobile/offline usability | fast song/practice workflow | focused musician toolkit | local media handoff primitives | generic social/music streaming suite |
| `autodev-ng` | autonomous software-development orchestration | exact task/engine/process egress coverage + locks/receipts/review | **action-scoped block/rewrite semantics without cancelling unrelated allowed work** | cross-engine ExternalEffectSpec / EgressReceipt truth layer (#12) | feedback/rework signals can feed Herdr candidate discovery | “network enabled” Boolean, model-only firewall, silent alternative external retries |
| `ai-novel-workstation` | long-form AI writing workstation | continuity / context / budget receipts | explainable selective context | unattended production with checkpoints | behavior/model migration gates | every-new-model catalog race or SaaS credit promises it cannot enforce |
| `herdr-skills` | multi-agent supervision / reflective skills | **evidence-backed candidate/active/conflict/stale rules + privacy + move-safe identity** | **recurrence/conflict discovery and exact evidence/diff preview** | **Correction→Rule/Check/Skill candidate pipeline that still uses trusted promotion (#6)** | hand off larger workflow candidates to Skill Foundry | raw transcript surveillance, auto-editing agent files, rule bloat, emotion-as-authority |
| `video-timeline-pipeline` | multimodal video intelligence | source/timeline/cost truth | direct NLE handoff + completeness state for partial analysis windows | evidence-backed paper cut | cut receipts into downstream editors | full NLE/generative editor scope |
| `chatgpt-dual-pipeline` | public internship-notes site | canonical content / de-identification | source-safe publishing | structured learning notes | improved evidence navigation | old slug-driven feature assumptions; not an AI pipeline |
| `claude-mem` | coding-agent memory | provenance / admission / stale invalidation | origin-preserving summaries | local inspectable memory | emit sanitized correction candidate signals while keeping recall separate from compliance | auto-trust summarized observations or recall-time authority |
| `lplrs-judicial-sync` | judicial data synchronization | exact authority revision + removal state | source-span handoff + complete/partial-result state | body-free authority receipts | legal AI consumers | good-law/status conclusions from mere source identity |
| `internship-notes-sites-mirror` | generated notes mirror | mirror-only ownership truth | deterministic sync | low-maintenance public mirror | integrity receipt | editing mirror as canonical content |
| `MaterialYouNewTab` | browser new-tab/workspace extension | privacy / local workspace basics | capture-preview-restore | versioned browser session workspace | restore diff / dedup / undo | continuous silent tab surveillance / 50-feature utility race / account bloat |
| `taichung-police-intel` | public government/police policy intelligence | verified public evidence + source health | profile/live navigation + query completeness | official evidence lifecycle | read-only Evidence MCP already #15 | operational policing / private data / write MCP |
| `ninax-line-hermes` | LINE AI video summarization assistant | webhook revision/dedupe truth | stale-job suppression | evidence-checked media second pass | outbound destination/effect receipt | exactly-once claims LINE cannot guarantee |
| `voice-actress` | voice/practice learning product | task-mode separation + reliable media | mobile feedback loop | focused guided practice | competency evidence | generic AI tutor/chat everywhere |
| `project-doctor-web` | clinical education / virtual patient | case truth + red flags + provenance | rubric-linked debrief | CaseSpec-driven reproducible simulation | competence replay | free-form model-generated clinical truth |
| `92-duty-scheduler` | staff/duty scheduling | auth + deterministic rule correctness | preview/conflict checking | PolicySpec Rule Studio | policy replay receipts | LLM directly deciding duty eligibility |
| `flux-image-gen` | multi-provider AI image generation/editing | output/provider/version truth | **source-side `SourceEvidenceRef` + credential preservation/validation** | generated/edited derivative receipt that distinguishes capture anchor vs hash-only input | creative handoff with provenance carried across transforms | provenance/camera signature as “truth detector”; absent credential = AI/fake |
| `neciken-summer-poem` | creative/public poem experience | simple accessible presentation | mobile/share polish | focused authored experience | provenance for generated variants if ever needed | agent/SaaS complexity |
| `minideck` | presentation generation/sharing | share/version privacy | interoperable export | narrow verified deck workflow | claim/source receipts | public access to hidden historical drafts |
| `ppt-studio` | AI presentation studio | local auth/deployment boundary | source/claim traceability | editable evidence-backed slides | mobile/Slack/Sheets only after core trust | enterprise collaboration suite breadth |
| `police-exam-practice` | police exam practice | official mode/source fidelity | explainable mastery | exam-specific structured practice | verified capability profile | hints leaking into exam simulation |
| `exam-archive` | static exam archive | fast complete data access | chunk/lazy-load + provenance | lightweight searchable archive | shared canonical exam data layer | duplicate source-of-truth maintenance |
| `cf-mcp-server` | Cloudflare MCP operations server | strong OAuth/authz + exact-target confirmation | capability receipts | safe bounded Cloudflare operations | consume shared ExternalEffectSpec for remote endpoints | broad autonomous destructive tools / token passthrough |

---

# Top 10 Cross-Portfolio Ideas

1. **Correction → Candidate Improvement — NEW #1:** use recurring user steering/rework as evidence for a proposed Rule/check/Skill without allowing it to self-promote.
2. **Candidate ≠ Active:** generated/imported/captured/learned state must validate before promotion; repetition alone is not validation.
3. **Memory ≠ Compliance ≠ Permission:** automatic recall can save steps but must not gain runtime authority.
4. **Risk-tiered Evaluation Budget:** cheap deterministic checks for everyone, selective expensive semantic/dynamic/human review for ambiguous/high-risk cases.
5. **SourceEvidenceRef / Capture Anchor:** provenance can begin at capture/import, not only at AI output; derived work must never impersonate the source anchor.
6. **Window Completeness Receipt:** every bounded result should say whether it is complete and how to continue, preventing truncation from masquerading as absence.
7. **Action-scoped Containment:** deny the unsafe effect while allowing unrelated already-approved local work to continue; no silent fallback to another external destination.
8. **Typed Handoff Receipt:** agent-to-agent / product-to-product handoff should carry exact task/evidence/runtime/permission scope rather than requiring manual re-entry.
9. **UNKNOWN is a first-class state:** missing model, source, security, provenance, completeness, or containment evidence is not success.
10. **Simplification is a feature:** merge, narrow, supersede, delete, and replace prose with deterministic checks when that reduces context/rule bloat.

---

# Ideas Rejected / Deferred

## 1. Default full transcript surveillance for Herdr improvement
**Decision:** REJECT for MVV.  
It conflicts with the existing privacy-preserving event design and is unnecessary to prove recurrence extraction. Start with structured current-task signals and optional bounded local review.

## 2. Hard-code Blume-style occurrence/pain thresholds
**Decision:** REJECT.  
A maker-described threshold is not an independent optimum. Calibrate using frozen human-labeled fixtures and keep promotion separate.

## 3. Automatically rewrite `AGENTS.md`, `CLAUDE.md`, Hooks, or Skills after repeated correction
**Decision:** REJECT for current scope.  
The system may propose an exact diff; activation/install remains a separate gate.

## 4. Use frustration / ALL CAPS as correctness evidence
**Decision:** REJECT.  
At most it can be a review-priority signal. Emotional intensity does not prove a durable rule is correct.

## 5. Treat Apple Reference Image / C2PA / SynthID as a truth detector
**Decision:** REJECT.  
These can support provenance and integrity claims. They cannot prove the depicted scene is true, nor does absence imply fake/AI.

## 6. Replace `autodev-ng #12` hard containment with a local LLM monitor
**Decision:** REJECT.  
Harden is a useful UX/product signal, but a semantic model verdict does not prove all process origins are physically contained.

## 7. Run the most expensive security model/dynamic sandbox on every Skill candidate
**Decision:** REJECT.  
Tenable’s staged design strengthens the opposite approach: baseline all; escalate based on risk/complexity with explicit policy/cost evidence.

## 8. Autonomous pay-per-request market-data wallet
**Decision:** DO NOT COPY.  
It introduces a new spending authority and surprise-cost surface that conflicts with Reese-max’s cost-gate/non-trading posture.

## 9. Turn `tick-stock-panel` into an autonomous brokerage agent
**Decision:** REJECT.  
Agent-managed alerts/watchlists are adjacent; real-money order execution remains outside the product boundary.

## 10. Measure self-improvement by number of learned rules
**Decision:** REJECT.  
Success must include held-out behavior, duplicate/stale/conflict counts, false-cluster rate, and user steps saved. More context is not inherently better.

---

# Issue Mapping

| Repository | Issue | Action this round | Why |
|---|---|---|---|
| `herdr-skills` | **#6** Correction→Candidate Improvement Pipeline | **CREATED** | New high-value, non-duplicate fingerprint; strongest new direct product + research evidence |
| `flux-image-gen` | #18 Provenance Receipt / Content Credentials | **UPDATED** | Apple Reference Image extends same provenance fingerprint to capture-side source evidence; duplicate Issue avoided |
| `autodev-ng` | #12 External-Effect Firewall | **UPDATED** | Harden adds action-scoped guardrail UX evidence; hard containment owner remains #12 |
| `skill-foundry` | #3 Security Attestation | **UPDATED** | Tenable 9/9 adds concrete staged/risk-tiered review workflow; same security-attestation fingerprint |
| `tick-stock-panel` | none | RESEARCH ONLY | MCP alert/watchlist + semantic filtering are relevant, but not yet a strong enough non-duplicate product gap to justify new Issue |
| `claude-mem` | none | RESEARCH ONLY | automatic recall/correction signals should not duplicate existing memory lifecycle/security work |
| `MaterialYouNewTab` | none | NO NEW ACTION | session capture/restore direction remains valid; avoid repeating previous disabled-Issue constraint / feature-count race |

### GitHub coordination notes

Before creating `herdr-skills #6`, open/closed Issues and all-state PRs were searched for correction/feedback/repeated-rule/skill-learning equivalents. Existing #3 / PR #5 are relocation/rebind recovery, not this fingerprint. No `github-issue-lock:v1` evidence showed another worker owning the correction-distillation scope.

Before updating existing #18/#12/#3, comments were inspected; no issue-thread evidence showed another worker actively claiming the incremental research sub-scope. Updates were appended to the existing canonical Issues rather than creating duplicate Issues.

---

# Sources

## Direct products / official docs

1. `CONFIRMED` — Blume.codes Product Hunt product page, checked 2026-09-10  
   https://www.producthunt.com/products/blume-codes
2. `CONFIRMED` — Blume official product surface, checked 2026-09-10  
   https://blume.codes/
3. `CONFIRMED_PRODUCT_SIGNAL` — Blume correction→Skill write-up, 2026-07-27  
   https://blume.codes/blog/you-already-told-your-agent-that
4. `CONFIRMED_PRODUCT_SIGNAL` — Harden Product Hunt page, current launch checked 2026-09-10  
   https://www.producthunt.com/products/agent-integrity-foundation-aif
5. `CONFIRMED_PRODUCT_SIGNAL` — Harden official product surface, checked 2026-09-10  
   https://harden.run/
6. `CONFIRMED` — Tenable Exchange Inspector detailed design, 2026-09-09  
   https://www.tenable.com/blog/ai-agent-security-openai-tenable-cyberagents-exchange-inspector
7. `CONFIRMED` — Tenable Exchange Inspector announcement, 2026-09-03  
   https://www.tenable.com/press-releases/tenable-uses-openai-gpt-cyber-models-to-help-defenders-inspect-community-built-ai-components
8. `CONFIRMED` — Apple iPhone 18 Pro / Reference Image announcement, 2026-09-09  
   https://www.apple.com/newsroom/2026/09/apple-debuts-iphone-18-pro-and-iphone-18-pro-max/
9. `CONFIRMED` — The Verge independent Reference Image coverage, 2026-09-10  
   https://www.theverge.com/tech/992766/apple-iphone-18-pro-reference-image
10. `CONFIRMED` — Supermemory plugin changelog, 2026-08-21 automatic recall; 2026-08-12 security update  
    https://supermemory.ai/changelog/plugins/
11. `CONFIRMED` — StockAlert.pro changelog, 2026-09-01 through 2026-09-08  
    https://stockalert.pro/changelog

## Research

12. `CONFIRMED_RESEARCH` — TRACE, 2026-06-11  
    https://arxiv.org/abs/2606.13174
13. `CONFIRMED_RESEARCH` — Self-Improving AI Coding Agents Through Accumulated Behavioral Rules, 2026-07-13  
    https://arxiv.org/abs/2607.13091
14. `CONFIRMED_RESEARCH_DIRECTION` — auditable self-improvement / candidate-promotion pattern, 2026-06  
    https://arxiv.org/abs/2606.10241

## Community / anecdotal only

15. `COMMUNITY_SIGNAL` — repeated-correction session-history anecdote, 2026-07-08  
    https://www.reddit.com/r/AI_Agents/comments/1uqtdn8/your_agent_forgets_every_correction_you_give_it_i/
16. `COMMUNITY_SIGNAL` — Product Hunt user/maker discussion around one-off correction vs recurrence  
    https://www.producthunt.com/products/blume-codes

---

# What Changed Since Last Radar

Compared with `2026-09-10-external-radar-r5.md`:

1. **NEW high-value product opportunity:** correction/steering recurrence is promoted from generic “memory/self-improvement” thinking into a concrete, evidence-backed `Correction → Candidate Improvement` product layer.
2. **CREATED `herdr-skills #6`** after repository/Issue/PR/lock dedupe. It does not replace Reflect’s current promotion gate; it automates the expensive manual step before candidate creation.
3. **Blume.codes becomes a direct category signal** for cross-agent correction→Rule/Skill workflows, with a local sidecar and exact-diff review rather than a new IDE.
4. **Supermemory strengthens the negative constraint:** automatic recall removes friction, while its August security fix demonstrates why memory recall must remain separate from command/action authority.
5. **`flux-image-gen #18` updated:** Apple Reference Image makes capture-side provenance a first-class source anchor, not merely an output-C2PA concern.
6. **`autodev-ng #12` updated:** Harden reinforces action-scoped blocking/safe continuation, but does not replace the need for runtime containment evidence.
7. **`skill-foundry #3` updated:** Tenable’s 9/9 design adds evidence for risk-tiered security review and exact-source-version invalidation after material change.
8. **`tick-stock-panel` research list refined:** StockAlert demonstrates agent-managed alert/watchlist workflows with preserved confirmation/scope plus domain-semantic alert cleanup; no autonomous trading expansion is recommended.
9. **New cross-portfolio primitive under watch:** `WindowCompletenessReceipt` to distinguish complete data from truncated result windows.
10. **No change to core safety direction:** `candidate ≠ active`, `memory ≠ authorization`, `UNKNOWN` remains first-class, and expensive/probabilistic analysis cannot replace deterministic/runtime evidence.

---

# Round Conclusion

The most valuable new pattern is not “AI learns everything automatically.” It is narrower and more controllable:

**the user is already spending effort correcting the system; that correction stream can become a structured improvement backlog without becoming self-authorizing policy.**

The reusable portfolio lifecycle is now:

`Observed Friction → Minimal Evidence Signal → Pattern / Conflict Detection → Candidate Improvement → Exact Preview → Independent Validation → Explicit Promotion → Runtime Behavior Evidence → Receipt`

This reduces repetitive re-explanation while keeping the strongest Reese-max design principle intact: **systems may propose their own improvements, but they must not certify or authorize those improvements merely because they proposed them.**