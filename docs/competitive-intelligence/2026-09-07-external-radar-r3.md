# External Competitive / Product Inspiration Radar — 2026-09-07 r3

> Scope: third same-day external-radar pass across Reese-max non-archived product repositories. Public web research is the primary signal source; GitHub repository evidence is used to resolve product fit, recent change state, duplicate fingerprints, safety boundaries, and whether an opportunity is already owned by an Issue/PR. Product marketing claims are treated as product-direction evidence, not efficacy proof. Community discussions are `COMMUNITY_SIGNAL` only.

## Executive Summary

Round 3 focused on the four product families explicitly left for follow-up in r2: public-intelligence systems, evidence-grounded note/research workflows, Agent Skills/skill certification, and reusable learner-state ideas.

Two high-confidence opportunities passed the Quality Gate and duplicate check, so two new GitHub Issues were created:

1. **`taichung-police-intel #12` — versioned Unit / Role Intelligence Profiles + role-aware Priority Briefs.** The repository already owns canonical change events, source health/gaps, `affected_roles`, `why_it_matters`, `recommended_action`, topics, deadlines and evidence locators. The missing step is not more collection: it is a reusable, non-sensitive work-context object that deterministically reranks the same verified events for different public police-policy roles and explains *why this matters to this role* without changing the underlying facts.
2. **`skill-foundry #1` — Target Runtime Compatibility Manifest + Negative-Transfer Gate.** The repository already has paired with/without-Skill evaluation, Waza, SkillEvaluator, Promptfoo, Codex canaries, harness hashes and deterministic promotion. New external evidence makes the next gap concrete: a Skill that helps one model/harness cannot be assumed to help another. Runtime support claims need their own evidence, freshness and negative-transfer state instead of an implicit universal-compatibility assumption.

Round 3 also deliberately avoided duplicate/low-value expansion:

- **`note-filler`** already has `#3`, a claim-level Verify / Accept / Reject queue with stale-evidence invalidation. That issue fully consumes the strongest legal/research-review opportunity; no duplicate was created.
- **`taiwan-intel-dashboard`** remains explicitly paused with HTTP 503 and update workflow disabled pending controlled recovery/data-size verification. New intelligence features were therefore deferred; reliability/restore remains the gate.
- **`herdr-skills`** already has an active relocation/portable-memory defect (#3). Cross-runtime Skill certification belongs in `skill-foundry`, not another orchestration/recovery repository.
- **`voice-actress` / `police-exam-practice`** should not independently invent learner-state engines while `cyber-prep-coach #4` is still the portfolio’s proving ground for an explainable mastery primitive.

The new cross-portfolio pattern is:

> **Context should become a versioned, inspectable object — and any claim that an AI/Skill/workflow is relevant or compatible must be scoped to the exact context/runtime that was actually verified.**

This extends r1’s “trusted context + evidence” and r2’s “deterministic compiler + visible next action” into a third layer: **context-scoped claims with explicit freshness and invalidation**.

---

## Product → Market Category Map

The baseline r1/r2 map remains valid. Round 3 updated the following product families because external signals or current GitHub state materially changed their opportunity status.

| Repository / family | Market category | Current product state | Round-3 treatment |
|---|---|---|---|
| `taichung-police-intel` | Evidence-first public-sector / council intelligence | Active; recent publication verification remediation merged; V2 change-event/brief work exists | **DIFFERENTIATOR**: role/unit intelligence profiles over canonical events |
| `taiwan-intel-dashboard` | Broad multi-source Taiwan intelligence dashboard | **PAUSED**; canonical HTTP 503; automated update disabled | **DO NOT EXPAND** until controlled restore/data-size trust gate passes |
| `note-filler` | Source-grounded legal/admin/exam research overlay | Evidence-rich claim/citation model; human review workflow now tracked by #3 | **MUST COMPLETE EXISTING #3**; duplicate avoided |
| `skill-foundry` | Evidence-gated Agent Skill creation/certification | Approved research with multi-evaluator promotion stack | **DIFFERENTIATOR**: target-runtime compatibility + negative-transfer gate |
| `herdr-skills` | Multi-agent workflow skills + learned operational memory | Current portability/recovery defect #3 | **MAINTAIN / FIX** portability before expanding certification concerns |
| `cyber-prep-coach` | iPAS exam preparation | Mastery/adaptive task opportunity already #4 | **PORTFOLIO PRIMITIVE OWNER** for learner-state experimentation |
| `voice-actress` | Exam/essay grading & coaching | Reliability/provenance should remain primary | **ADJACENT**: consume learner-state primitive later, do not fork now |
| `police-exam-practice` | Police exam practice | Compatibility/legacy product; no reason to duplicate adaptive engine yet | **ADJACENT**: reuse proven learner state later |
| `video-timeline-pipeline` / `taichung-police-intel` / `note-filler` | Research/intelligence workflows | Strong provenance/data contracts exist | **ADJACENT**: bounded source-set / Research Pack objects remain portfolio-level opportunity |

For all other non-archived repositories, r1/r2 classifications are unchanged unless a future run detects meaningful market or repository changes. Empty/mirror/infrastructure-only repositories remain outside feature-expansion priority.

---

## What Changed Since Last Radar

| Repo | r2 state | r3 change | Decision |
|---|---|---|---|
| `taichung-police-intel` | Next target: source packs / delta / operator workflow | Recent main now contains durable event/priority fields and publication-verification remediation; external intelligence products increasingly reuse persistent org/client context | **NEW FEATURE #12** |
| `skill-foundry` | Next target: portable Skills + executable evaluation contracts | Repository already has strong single/certification gates; external benchmark evidence shows material model/harness variance and negative Skill transfer | **NEW FEATURE #1** |
| `note-filler` | Next target: source-grounded acceptance workflow | A new Issue #3 already implements exactly that fingerprint | **DUPLICATE AVOIDED** |
| `taiwan-intel-dashboard` | Candidate intelligence-system target | README now makes pause/HTTP 503/update-disabled state explicit | **DEFER FEATURE WORK** |
| `herdr-skills` | Agent/skill adjacent | Existing portability Issue #3 remains more immediate; certification belongs to Foundry | **NO NEW ISSUE** |
| learner apps | Possible shared learner-state primitive | `cyber-prep-coach #4` remains the highest-fit proving ground | **REUSE LATER, DO NOT FORK** |

Recent repository evidence also shows `taichung-police-intel` has continued to refresh its publication bundle and merged remediation for scheduled publication verification. This improves the feasibility of building a role-aware projection *on top of* the event/evidence model, but it does not remove the requirement that stale/failed publication state remain visible.

---

## External Signals

### 1. Intelligence products are turning organizational context into a reusable first-class object

**CONFIRMED — Feedly Org Profiles, 2026-07-08**

Feedly lets users describe an Org Profile in plain text or Markdown and reuse it through `@` references in Ask AI, Report Builder, Newsletter and Custom Intel Agents. Feedly also exposes where an Org Profile is referenced. This is a strong design signal that intelligence context should be a persistent, inspectable object rather than a prompt users retype for every investigation.

Source:
- https://feedly.com/changelog/faster-exploit-triage-smarter-org-profiles-and-more-transparency-across-your-report-builder

The same release also expands citation transparency in Report Builder, supporting the broader pattern that *relevance context* and *evidence context* should both be traceable.

**CONFIRMED — Feedly Custom Intel Agent alerts, 2026-08-19**

Feedly added email / Slack alerts configurable per Custom Intel Agent. The portable principle is not “add Slack”: it is that each monitoring objective can own persistent relevance/notification context instead of one global feed.

Source:
- https://feedly.com/threat-intelligence/changelog

**CONFIRMED PRODUCT DIRECTION — Dataminr, Black Hat USA, 2026-08-04 to 2026-08-06**

Dataminr’s 2026 Black Hat presentation emphasizes client-tailored threat intelligence: external signals are filtered against client-specific assets, industry and exposure. This is treated as product-positioning evidence, not proof of accuracy or response-time gains.

Source:
- https://www.dataminr.com/events/black-hat/

**CONFIRMED — Dataminr + Esri public-sector pattern, 2026-02-23**

Dataminr/Esri material shows the general public-sector pattern of placing events into asset/geographic/mission context so an identical external event may have different operational relevance depending on the viewer’s context.

Source:
- https://www.dataminr.com/resources/insight/how-dataminr-and-esri-enable-better-force-protection/

**Transferable principle:** separate **canonical event truth** from **role/unit relevance projections**. One event should not be regenerated differently for every audience; instead, a versioned profile should deterministically select/rank the same verified facts and expose the reason.

**Fit:** `taichung-police-intel` already has `affected_roles`, topics, deadlines, temporal basis, official evidence and source-gap semantics. The product gap is therefore a profile projection, not a new collection or AI summarization stack.

---

### 2. Synchronized bounded source sets are becoming the default unit for enterprise AI research

**CONFIRMED — Perplexity enterprise connectors, 2026-07 to 2026-09**

Recent Perplexity connector updates cover GitHub (2026-07-14), Google Drive (2026-07-16), Box/Dropbox (2026-08-14) and Microsoft 365/SharePoint/OneDrive updates into early September. Enterprise connector documentation describes explicit source selection and synchronization as content changes or access is removed.

Sources:
- https://www.perplexity.ai/help-center/en/articles/11183882-github-connector
- https://www.perplexity.ai/help-center/en/articles/11183963-google-drive-connector
- https://www.perplexity.ai/help-center/en/articles/11844863-box-connector
- https://www.perplexity.ai/help-center/en/articles/11844889-dropbox-connector
- https://www.perplexity.ai/help-center/en/articles/11183951-microsoft-365-connector

**CONFIRMED — Feedly bounded source context, 2026-04-01**

Feedly Ask AI / Analyze lets users attach explicit AI Feeds, Boards and Team Feeds as source sets, using RAG over that bounded context.

Source:
- https://feedly.com/changelog/add-specific-context-to-your-market-intelligence-queries

**Transferable principle:** the useful reusable object is increasingly **source set + refresh policy + task/profile + evidence contract**, not “search everything.”

**Portfolio implication:** continue treating Research Packs as a cross-portfolio idea for `video-timeline-pipeline`, `taichung-police-intel` and `note-filler`. Do not create a new generic platform yet: each repository already owns different source/evidence semantics, and premature abstraction would duplicate existing contracts.

---

### 3. Agent Skills have measurable, runtime-dependent upside — and measurable negative transfer

**CONFIRMED RESEARCH — SkillsBench 1.1, 2026-06-16**

SkillsBench 1.1 evaluates 87 tasks across 8 domains and 18 model-harness configurations. Its current aggregate reports curated Skills increasing resolution rate from 33.9% to 50.5%, but the important product signal for this portfolio is the variation across model/harness/domain combinations.

Source:
- https://www.skillsbench.ai/blogs/skillsbench-1-1

**CONFIRMED RESEARCH — SkillsBench paper / original release, 2026-02**

The research reports that Skill benefit is heterogeneous; in an earlier comparable task snapshot, 16 of 84 tasks had negative delta, and self-generated Skills did not produce an average improvement. These are benchmark findings, not guarantees about `skill-foundry`.

Sources:
- https://arxiv.org/abs/2602.12670
- https://www.skillsbench.ai/blogs/introducing-skillsbench

**CONFIRMED — OpenAI Codex team workflows, 2026-08-06**

OpenAI’s Codex team-workflow material treats reusable Skills alongside shared context, approval/sandbox boundaries, MCP/tool integrations and worktrees. As Skills move from personal snippets into repeatable team workflows, the question “which runtime was this Skill actually tested on?” becomes a product-level trust problem.

Source:
- https://academy.openai.com/public/clubs/builders-etkn1/events/codex-bootcamp-201-team-workflows-a3krsush07

**Transferable principle:** do not certify “the Skill” in the abstract. Certify **Skill revision × target runtime fingerprint × evaluator/dataset/policy** and invalidate the claim when any critical dimension changes.

**Fit:** `skill-foundry` already pins tool versions, records harness hashes, runs paired with/without Skill comparisons, and has multiple model/harness integrations. A compatibility manifest is the next logical evidence layer, not another optimizer.

---

## New Releases / Recent Changes Worth Tracking

| Date | Product / ecosystem | New signal | Reese-max relevance |
|---|---|---|---|
| 2026-09-04 | Perplexity Microsoft 365 connector docs/update | broader synchronized enterprise source context | Research Packs / source-set freshness and access invalidation |
| 2026-08-19 | Feedly Custom Intel Agents | per-Agent email/Slack alert configuration | persistent monitoring objectives; profile-aware alerts later |
| 2026-08-04–06 | Dataminr Black Hat USA | client-tailored threat intelligence | role/unit-specific relevance over one event truth |
| 2026-08-06 | OpenAI Codex team workflows | reusable Skills + shared context + approvals/tools/worktrees | Skill portability/certification scope matters more |
| 2026-07-08 | Feedly Org Profiles | reusable org context across research/report workflows | direct inspiration for `taichung-police-intel #12` |
| 2026-06-16 | SkillsBench 1.1 | expanded model-harness Skill evaluation matrix | direct inspiration for `skill-foundry #1` |
| 2026-04-01 | Feedly Ask AI | explicit multi-source RAG context | bounded source-pack pattern |

---

## Community Pain Points

These are anecdotal signals and are **not** statistical evidence.

### Cross-agent Skill portability / version drift

**COMMUNITY_SIGNAL — r/codex, 2026-06-30**

A discussion argues that many generic Skills were authored/tested for a Claude-oriented model/harness and may not transfer cleanly to Codex or exploit Codex-specific capabilities.

Source:
- https://www.reddit.com/r/codex/comments/1ujrjf4/those_generic_skills_you_installed_dont_work_as/

**COMMUNITY_SIGNAL — r/codex, 2026-08-03**

A separate discussion describes multi-project / multi-agent Skill duplication, config differences and version drift as ongoing maintenance friction.

Source:
- https://www.reddit.com/r/codex/comments/1ve4yvb/how_are_you_all_managing_ai_agent_skills_when/

**Product implication:** a shared Skill registry without target-runtime claims can create false confidence. `skill-foundry` should expose tested scope and staleness rather than presenting portability as binary metadata.

### Intelligence overload is not solved by collecting more sources

The most relevant external product movement this round is not “more feeds.” Feedly and Dataminr are explicitly adding org/client context on top of large signal collections. That reinforces a repository-local observation: `taichung-police-intel` already has the hard source/evidence plumbing; the next usability bottleneck is deciding which verified changes matter first to a specific role.

No community anecdote is promoted here because the official product/workflow evidence is already sufficient and less noisy.

---

## Repository Evidence and Decision Logic

### `taichung-police-intel`

CONFIRMED:
- The product is explicitly evidence-first and intended for police policy / council-liaison preparation from public information only.
- V2 work already defines durable change states and evidence locators (#3).
- Daily briefs already require `what_changed`, `why_it_matters`, `affected_roles`, `recommended_action`, deadlines and temporal basis (#4).
- `build-v2-shadow-brief.py` contains deterministic role labels such as council liaison, HQ staff, attending supervisors and responsible units.
- `V2DailyDashboard` renders `affected_roles`.
- A generic Topic filter exists.
- Recent commits show publication-verification remediation and refreshed V1/V2 publication bundles.
- Search did not find a `UnitProfile`/`RoleProfile` or other versioned reusable role-context object.

Decision: **create #12**. This is an additive projection layer over canonical events, with strict safety boundaries against predictive policing, internal operational data, or profile-specific fact generation.

Issue:
- https://github.com/Reese-max/taichung-police-intel/issues/12

### `skill-foundry`

CONFIRMED:
- Paired with-Skill / without-Skill evaluation exists.
- Waza, SkillEvaluator, Promptfoo and Codex structured-output canary are part of the current promotion evidence.
- External tools are version-pinned and harness hashes are part of certification evidence.
- Waza defaults include MiniMax-M3; Codex-related evaluation paths identify `gpt-5.6-luna`.
- Existing Waza static reports allow compatibility metadata to be absent/optional, and prior repository state includes a Waza/MiniMax compatibility candidate — evidence that runtime compatibility is already a real maintenance concern.
- No GitHub Issue/PR already owns a consolidated runtime compatibility matrix / negative-transfer claim gate.

Decision: **create #1**. The release object should distinguish core Skill quality from scoped runtime-support claims, including `UNTESTED`, `STALE`, `DEGRADED` and verified positive states.

Issue:
- https://github.com/Reese-max/skill-foundry/issues/1

### `note-filler`

CONFIRMED duplicate ownership:
- Current Issue #3 already defines claim-level human review states, citation/source evidence, persisted review decisions, claim/source hash invalidation, stale review, and accepted-only export.
- That is the same product job this radar would otherwise promote from recent legal/research-product signals.

Decision: **DUPLICATE AVOIDED**. Continue/validate #3; do not create a second “evidence review” issue.

Existing Issue:
- https://github.com/Reese-max/note-filler/issues/3

### `taiwan-intel-dashboard`

CONFIRMED:
- README marks the product **paused**.
- Canonical endpoint returns HTTP 503.
- Automated update workflow is disabled until controlled data-size / restore verification is complete.
- The repository already has extensive source/freshness/coverage auditing.

Decision: **DO NOT EXPAND**. A role/profile layer or new connectors may be interesting later, but current product state fails the precondition for feature expansion.

### `herdr-skills`

CONFIRMED:
- Existing #3 tracks project-scoped learned memory becoming unreachable after checkout relocation because identity derives from canonical path.

Decision: no new cross-runtime Skill certification issue here. Fix portability/recovery in `herdr-skills`; let `skill-foundry` own certification semantics.

---

## Adjacent Ideas

### A. Standing Intelligence Requirement / Role Profile

Reusable object:
- role/unit purpose;
- non-sensitive responsibilities;
- topics and source priorities;
- deadline/status weighting;
- explicit exclusions;
- ranking-policy version;
- profile hash.

Best immediate fit: `taichung-police-intel` (#12).

Possible later reuse: a **private/internal deployment** of a broader intelligence product, but not the currently paused public `taiwan-intel-dashboard` and not with case/personnel/operational data unless a completely separate trust model is designed.

### B. Research Pack = Source Set + Profile + Refresh + Evidence Contract

A more complete version of r1/r2 Research Packs:

```text
ResearchPack
  ├─ bounded source set / source IDs
  ├─ source capability + access/freshness rules
  ├─ task or audience profile
  ├─ refresh / delta policy
  ├─ evidence requirements
  ├─ output schema
  └─ cost/network/privacy policy
```

Best fits: `video-timeline-pipeline`, `taichung-police-intel`, `note-filler`.

Do not centralize this into a generic framework until at least two repositories have proven compatible contracts.

### C. Runtime Compatibility Claims as Evidence Objects

Potential later reuse beyond `skill-foundry`:
- `herdr-skills`: which Skill contract is verified on which agent/tool stack;
- `cf-mcp-server`: tool/server compatibility against client protocol versions;
- `cf-ai-router`: provider/model capability claims with freshness/version evidence;
- `autodev-ng`: engine/provider execution claims tied to actual harness/version receipts.

But `skill-foundry` should prove the schema first.

### D. Learner State as a Shared Primitive, Not a Shared Product

If `cyber-prep-coach #4` succeeds, extract a small deterministic learner-state library or schema for reuse in `police-exam-practice` / `voice-actress`. Do not copy the whole iPAS product or its taxonomy.

---

## Opportunity Map — Round 3

| Opportunity | Classification | Repo(s) | Score* | Decision |
|---|---|---|---:|---|
| Versioned Unit/Role Intelligence Profile + role-aware brief | **DIFFERENTIATOR** | taichung-police-intel | 93/100 | **NEW #12** |
| Target Runtime Compatibility Manifest + negative-transfer gate | **DIFFERENTIATOR** | skill-foundry | 94/100 | **NEW #1** |
| Claim-level Verify/Accept/Reject decision ledger | **MUST / DIFFERENTIATOR** | note-filler | 92/100 | Existing #3; duplicate avoided |
| Research Pack: source set + refresh + task/profile + evidence | **ADJACENT IDEA** | video-timeline-pipeline / taichung-police-intel / note-filler | 87/100 | Continue research; map into existing contracts first |
| Profile-aware alerts | **SHOULD BE BETTER** | taichung-police-intel | 78/100 | Defer until profile ranking proves value |
| Shared learner-state primitive | **ADJACENT IDEA** | cyber-prep / police-exam / voice-actress | 80/100 | Wait for cyber-prep #4 runtime proof |
| Compatibility/evidence claims for agent infrastructure | **ADJACENT IDEA** | herdr / cf-mcp / cf-ai-router / autodev | 83/100 | Let skill-foundry prove pattern first |
| Add new feeds/features to paused Taiwan dashboard | **DO NOT COPY / DEFER** | taiwan-intel-dashboard | 31/100 | Reject until restore gate passes |
| Predictive policing / autonomous police operational recommendation | **DO NOT COPY** | police-intelligence products | 8/100 | Reject — outside product/safety scope |
| Universal “works on all agents/models” Skill badge | **DO NOT COPY** | skill-foundry | 5/100 | Reject without per-runtime evidence |

\* Score is a prioritization heuristic combining User Pain, Strategic Fit, Novelty, Evidence Strength, Reuse Potential and implementation effort, penalized for Security/Privacy/Cost risk. It is not market share, efficacy evidence or a forecast.

---

## Top 10 Cross-Portfolio Ideas

1. **Versioned Context Profiles** — turn audience/org/role/task context into a reusable object with hash/version instead of repeated prompts.
2. **Runtime-Scoped Evidence Claims** — any “works with X” statement should bind to model/harness/tool/policy/dataset fingerprints and become stale when inputs change.
3. **One Canonical Truth, Many Projections** — role/view personalization should change ranking/presentation, not fork facts or evidence.
4. **Research Packs** — package bounded sources, refresh/delta rules, task/profile, evidence and cost/privacy policies.
5. **Deterministic Relevance Reasons** — show *why* an item/rule/Skill was selected instead of a naked AI score.
6. **Evidence Invalidation as a Primitive** — source hash, context hash, model/harness or dataset changes should invalidate downstream approvals/compatibility claims rather than silently inherit them.
7. **Independent Human/Runtime Acceptance** — system-verified is not human-accepted (`note-filler`); schema-valid is not runtime-compatible (`skill-foundry`); relevant is not operational truth (`taichung-police-intel`).
8. **Reuse Before Fork** — prove mastery, compatibility, source-pack and context-manifest primitives in one owner repo before copying them across the portfolio.
9. **Reliability Gate Before Expansion** — paused/stale/security-blocked products should not receive attractive new features until the core trust boundary is restored.
10. **AI as Compiler/Selector, Domain Engine as Authority** — maintain r2’s pattern: AI may lower configuration/search friction, but domain rules, evidence and final execution remain deterministic/inspectable wherever possible.

---

## Ideas Rejected / Deferred

1. **`taichung-police-intel`: personalized facts/summaries generated independently per role** — rejected. It risks contradictions across audiences; use one canonical event and deterministic projections.
2. **`taichung-police-intel`: internal personnel, duty roster, case or deployment profiles in the public product** — rejected. The current product explicitly excludes personal/operational police data.
3. **`taichung-police-intel`: Slack/LINE/email alerts as the immediate next step** — deferred. Prove relevance/ranking first; delivery channels are not the core product insight.
4. **`skill-foundry`: universal compatibility badge after one evaluator passes** — rejected. External benchmark evidence directly contradicts the assumption that Skill lift is uniform.
5. **`skill-foundry`: evaluate every model/agent combination** — rejected. Cost and combinatorics require an allowlisted set of critical target runtimes.
6. **`note-filler`: create another evidence-review issue** — rejected as duplicate; #3 already owns it.
7. **`taiwan-intel-dashboard`: add new connectors or role profiles now** — deferred; product is paused and must restore reliability first.
8. **`herdr-skills`: duplicate Foundry certification logic** — rejected; address checkout/memory portability locally, use Foundry for certification semantics.
9. **`voice-actress` / `police-exam-practice`: each invent a mastery engine** — deferred to avoid three inconsistent learner models.
10. **Predictive policing / autonomous operational recommendations** — rejected; not a valid extension of a public-information preparation product.

---

## Issue Mapping

### New in r3

- `Reese-max/taichung-police-intel#12` — `[Competitive Inspiration][DIFFERENTIATOR] 建立可版本化的 Unit／Role Intelligence Profile 與角色化 Priority Brief`
  - https://github.com/Reese-max/taichung-police-intel/issues/12
- `Reese-max/skill-foundry#1` — `[Competitive Inspiration][DIFFERENTIATOR] 建立 Target Runtime Compatibility Manifest 與 Negative-Transfer Gate`
  - https://github.com/Reese-max/skill-foundry/issues/1

### Existing issue intentionally reused / duplicate avoided

- `Reese-max/note-filler#3` — claim-level Verify / Accept / Reject queue and decision ledger.
  - https://github.com/Reese-max/note-filler/issues/3
- `Reese-max/taichung-police-intel#3` — durable item-level change identity/diff; dependency for #12.
- `Reese-max/taichung-police-intel#4` — priority-brief semantics; dependency for #12.
- `Reese-max/taichung-police-intel#9` — scheduled publication reliability remains a trust gate.
- `Reese-max/herdr-skills#3` — checkout relocation / project-memory portability remains the right local priority.
- `Reese-max/cyber-prep-coach#4` — portfolio proving ground for learner-state/mastery adaptation.

### Prior radar issues remain active

- `ppt-studio#3` — claim/source provenance.
- `cyber-prep-coach#4` — explainable mastery / adaptive next task.
- `92-duty-scheduler#19` — explainable minimal-impact schedule repair.
- `ai-novel-workstation#2` — auditable Context Manifest / memory routing.
- `tick-stock-panel#5` — research natural-language → inspectable deterministic strategy compiler.

---

## Sources

### Official / primary product and research sources
- Feedly Org Profiles / Report Builder transparency — 2026-07-08: https://feedly.com/changelog/faster-exploit-triage-smarter-org-profiles-and-more-transparency-across-your-report-builder
- Feedly Threat Intelligence changelog / Custom Intel Agent alerts — 2026-08-19: https://feedly.com/threat-intelligence/changelog
- Feedly bounded Ask AI source context — 2026-04-01: https://feedly.com/changelog/add-specific-context-to-your-market-intelligence-queries
- Dataminr Black Hat USA — 2026-08-04 to 2026-08-06: https://www.dataminr.com/events/black-hat/
- Dataminr + Esri public-sector context — 2026-02-23: https://www.dataminr.com/resources/insight/how-dataminr-and-esri-enable-better-force-protection/
- SkillsBench 1.1 — 2026-06-16: https://www.skillsbench.ai/blogs/skillsbench-1-1
- SkillsBench paper: https://arxiv.org/abs/2602.12670
- SkillsBench launch: https://www.skillsbench.ai/blogs/introducing-skillsbench
- OpenAI Academy, Codex Team Workflows — 2026-08-06: https://academy.openai.com/public/clubs/builders-etkn1/events/codex-bootcamp-201-team-workflows-a3krsush07
- Perplexity GitHub connector — 2026-07-14 docs update: https://www.perplexity.ai/help-center/en/articles/11183882-github-connector
- Perplexity Google Drive connector — 2026-07-16 docs update: https://www.perplexity.ai/help-center/en/articles/11183963-google-drive-connector
- Perplexity Box connector — 2026-08-14: https://www.perplexity.ai/help-center/en/articles/11844863-box-connector
- Perplexity Dropbox connector — 2026-08-14: https://www.perplexity.ai/help-center/en/articles/11844889-dropbox-connector
- Perplexity Microsoft 365 connector — current/2026 update: https://www.perplexity.ai/help-center/en/articles/11183951-microsoft-365-connector

### Community signals — anecdotal only
- r/codex generic Skill portability discussion — 2026-06-30: https://www.reddit.com/r/codex/comments/1ujrjf4/those_generic_skills_you_installed_dont_work_as/
- r/codex cross-project Skill management/version drift — 2026-08-03: https://www.reddit.com/r/codex/comments/1ve4yvb/how_are_you_all_managing_ai_agent_skills_when/

---

## Next Radar Targets

1. **`cf-ai-router` / `cf-mcp-server`** — examine whether provider/tool capability claims need freshness/version/compatibility receipts similar to `skill-foundry #1`, without duplicating security Issues.
2. **`video-timeline-pipeline`** — test whether Research Pack should become a concrete object on top of its existing RAG/digest/evidence roadmap, or remain only a portfolio pattern.
3. **`voice-actress` / `police-exam-practice`** — inspect current progress/grading schemas and identify the smallest reusable learner-state boundary *after* confirming no duplicate with `cyber-prep #4`.
4. **`ppt-studio` / `minideck`** — examine whether provenance/context-manifest primitives should be shared rather than implemented twice.
5. **`autodev-ng` / `herdr-skills`** — look for claim-level runtime receipts and reusable compatibility metadata after Foundry’s schema is clarified; do not add more Agent count as a goal.

## Round Boundary

This round used public-web research as the primary market/competitive signal source, then inspected current GitHub repositories, recent commits, Issues, PRs and code for product fit and duplicate fingerprints. It created only the two tracking Issues listed above and this central intelligence report.

It did **not** modify product source code, create implementation branches, merge PRs, deploy, change secrets/permissions/repository settings, access internal police data, execute financial trades, or claim that proposed features have passed runtime or human usability validation.