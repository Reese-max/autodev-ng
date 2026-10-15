# External Competitive / New-Product / Workflow Radar — 2026-09-19T08:15:01Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY / 1_NEW_NARROW_RESEARCH_ISSUE**.
- Owner scope: `Reese-max` only. No third-party repository was modified.
- Issue Quality v2 re-read from `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality-rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected-owner listing fit in one page: **41 currently accessible Reese-max-owned repositories / 40 unarchived**; `obsidian-vault` is the only archived repository returned. Older inventory was not treated as the current denominator.
- Fair cursor entering this round: `Reese-max/skill-foundry` (continued from `2026-09-19T060228Z-external-radar.md`).
- Focal repo default branch re-read immediately before the Issue write: `main@21be2b62b72fb3030b50b08a078da2f6569961be`; this HEAD is audit-only. Latest substantive product baseline remains `e865c0057f49b55cab5215aeb884d0992c4e7fef`.
- Owner-approved product direction remains **INVEST / SIMPLIFY**: Skill Foundry is a narrow reusable Agent Skill **certification / promotion plane** for authors and reviewers who need reconstructable evidence; it is not a hosted marketplace, generic orchestration runtime, observability suite, memory product, team workspace SaaS, or native app.
- Existing active scopes were re-read and not taken over: #1/PR #2 target-runtime compatibility, #6/PR #8/#9 exact-SHA deterministic CI. #3 package security, #4 distribution/install verification and #5 demonstration intake remain separate research fingerprints.
- Branch listing was re-read before the write: only `main`, `github-1-runtime-compatibility`, `fix/issue-6-ci-gate-workflow`, and `devin/issue-6` were present. No behavior-coverage implementation branch was found.
- This radar did not modify product source, Skill contents, CI/config, secrets, permissions, repository settings, PR scope, deployment, provider credentials, worker/GOAL state, or production data; it did not run a paid/live model call.
- Academic Research connector was attempted for primary-paper retrieval but returned an organization-context 401. This did not block the research because the papers' first-party arXiv pages/project pages were available on the public web. No connector failure is treated as evidence about the papers themselves.

## Executive decision

This round found one **high-value but deliberately narrow certification-research opportunity** and created:

- `Reese-max/skill-foundry#10` — **[Research][RESEARCH_REQUIRED] 驗證 Skill Behavior Coverage：認證通過不等於關鍵指令都被測到**
  - https://github.com/Reese-max/skill-foundry/issues/10
  - `kind=RESEARCH`
  - `severity=NOT_ESTABLISHED`
  - `decision_priority=MEDIUM`
  - `triage=NEEDS_EVIDENCE`
  - `auto_implementation=false`
  - `runtime_status=NEEDS_RUNTIME_VERIFICATION`

The decision is not that current Skill Foundry certification is broken. The decision is narrower:

> **Current aggregate green evidence can show that a skill helped or passed selected tasks, but the repository does not currently expose an auditable mapping from each material behavior in the exact Skill revision to the case/receipt/trajectory that actually exercised it.**

That distinction matters for a product whose differentiated promise is evidence-gated promotion. External research now provides a concrete, bounded way to test whether this is decision-useful without building a new evaluation platform: do one exact-skill, one-revision behavior-to-evidence audit, preserve `UNKNOWN`, and only add product scope if the mapping actually changes a promotion/review decision.

This Issue is sequenced **after** the owner-approved reliability/runtime/security priorities (#6 → #1 → #3). It does not authorize implementation and does not compete with active PR #2/#8/#9.

---

## Product → market category

| Product | Market / substitutes | Current differentiated job |
|---|---|---|
| `skill-foundry` | NVIDIA SkillEvaluator/Verified Skills, Agent Skills ecosystems, managed team Skill libraries, package/security scanners, generic skill marketplaces | Bind an exact reusable Skill revision to traceable sources, paired evaluation, policy, security/runtime evidence and an explicit promotion boundary that can be reconstructed later |

The market is increasingly commoditizing discovery, installation, sharing and generic Skill authoring. The remaining high-value question is not “can the Skill be stored or installed?” but “what exact claim does the evidence justify for this exact revision?”

# External Signals

## A. Direct evaluation alternative — NVIDIA makes paired live Skill evaluation a first-class release gate

**CONFIRMED — NVIDIA Technical Blog published 2026-08-19; ACES paper published 2026-08-20; current docs checked 2026-09-19.**

Sources:
- https://developer.nvidia.com/blog/evaluating-ai-agent-skill-performance-with-nvidia-skillevaluator/
- https://arxiv.org/abs/2608.20614
- https://docs.nvidia.com/skills/skillevaluator
- https://docs.nvidia.com/skills/agent-skill-trust-pipeline

NVIDIA's current SkillEvaluator/Verified Skills workflow separates structural/security checks from live paired execution. Tier 3 runs the same tasks with and without the target Skill and reports Skill Lift across dimensions such as correctness/effectiveness/discoverability/efficiency. The ACES paper similarly treats Skill value as a live paired claim bound to a fixed task, harness, workspace and scorer.

### User job

A Skill reviewer needs to answer “did this exact Skill improve the target agent on the intended work?” rather than trusting documentation or a static scan.

### Manual steps reduced

NVIDIA packages baseline-vs-Skill execution, grading and reporting into one evaluation path instead of requiring reviewers to manually run two sessions and reconcile outputs.

### Transferable principle

Skill Foundry already does the important part: with/without evaluation, trigger metrics, Waza/public-private evaluation, Promptfoo and a deterministic Promotion boundary. **Do not replace this system.** The useful new calibration is the caveat NVIDIA states explicitly: a Skill can only be measured as precisely as its evaluation set describes the job.

### Do not copy

Do not clone NVIDIA's catalog, Harbor execution stack, signing pipeline, marketplace distribution, or broad metric set merely because the competitor has them. Existing Foundry evidence planes are already narrower and aligned with owner direction.

---

## B. Adjacent workflow — shared Skill libraries are becoming commodity infrastructure, not Foundry's moat

**CONFIRMED — Notion 3.7 published 2026-09-15; strategy post/current release checked 2026-09-19. CROSS-PORTFOLIO DEDUP: already captured by earlier radar, retained here only for product-boundary context.**

Source:
- https://www.notion.com/en-gb/releases/2026-09-15

Notion now offers a shared Skills Library, collaborative maintenance, automatic/manual execution, and export of a Skill as `SKILL.md` plus approved supporting files to Claude Code, Codex, Cursor, Gemini and Grok. When a Skill changes, Notion marks it so users know to fetch the latest copy.

### User job

Teams want one current reusable instruction source instead of copies scattered across chats/docs and different agent directories.

### Transferable principle

Version awareness and cross-agent portability are moving into general knowledge/workspace products. Foundry should remain **SHOULD BE BETTER at evidence identity**, not compete on library UI or collaboration breadth.

### Do not copy

No workspace database, team permission layer, mobile collaboration surface, subagent platform, or automatic Skill execution should be added to Foundry from this signal.

---

## C. New evaluation research — task success does not answer which Skill behaviors were actually tested

**CONFIRMED RESEARCH — “Skill Coverage: A Test Adequacy Metric for Agent Skills,” published 2026-06-09; author project page/current public paper checked 2026-09-19.**

Sources:
- https://arxiv.org/abs/2606.20659
- https://shuaijiumei.github.io/skillcoverage/

The paper treats the Skill artifact itself as the object under test. It extracts observable Skill Behavior Constraints (SBCs), then asks whether agent trajectories actually exercised each constraint and whether observed behavior passed or failed. In the paper's SkillsBench sample, reported SBC coverage is roughly 38.66%–45.51% across the evaluated configurations; failed-constraint-guided strengthening is also explored.

**Boundary:** those percentages are evidence about the paper's corpus, not about Skill Foundry. This radar does not claim Foundry currently has 40% coverage, a missing-behavior incident, or a defect rate.

### Why the pattern is valuable here

Foundry's active `tw-official-document-master/SKILL.md` contains several materially different observable behaviors: three modes, explicit fact basis, subject-drafting preservation, review replacement with literal `【待補依據】`, date/attachment preservation, uncertainty handling, untrusted-instruction refusal, and an exact nine-key JSON output contract. The checked-in public eval folder currently exposes five named cases; separate Waza/private/trigger/Promptfoo/final-canary evidence also exists.

The repo therefore has strong **outcome evidence**, but no current checked-in artifact maps every material Skill behavior to the specific case/receipt/trajectory that exercised it. Private hidden tests may already cover some of the behaviors; absence of a mapping is not proof that they are untested. That is exactly why this is `RESEARCH / NOT_ESTABLISHED`, not a bug.

### Manual step reduced if validated

Today a reviewer wanting to answer “did we actually test the refusal rule / date preservation / exact output contract for this revision?” has to inspect the Skill, multiple fixtures and several aggregate reports manually. A small behavior→evidence receipt could reduce that manual cross-check **if** the one-Skill experiment proves it changes decisions.

---

## C2. New methodology signal — Skill effects can be negative for different reasons, so aggregate score is not enough to diagnose why

**CONFIRMED RESEARCH — “Signal or Noise? A Benchmark Study of Agent Skills in Web Development,” published 2026-08-24; checked 2026-09-19.**

Source:
- https://arxiv.org/abs/2608.23067

In that paper's WebDev benchmark, matched Skill injection sometimes reduced task performance and substantially increased tokens; the authors use a **length-matched irrelevant control** to distinguish prompt-length distraction from Skill-content effects and report weak transfer of Skill rankings across models.

Again, the numeric results are not imported as Foundry outcomes. The useful design signal is narrower: when Foundry eventually investigates a negative-transfer case, it should distinguish “the Skill content misled the agent” from “adding this amount of context harmed the run.” That is potentially useful to #1 but **does not justify expanding active PR #2** in this radar.

Decision: `ADJACENT_METHOD / HOLD`. Do not automatically add placebo/length controls to every certification run before Foundry observes a decision that cannot be explained with the current paired suite.

---

## C3. Security research is shifting from static detection toward grounded localization/patch proposals, but auto-remediation is outside scope

**CONFIRMED RESEARCH — SkillSecurer, arXiv 2609.14079, published 2026-09-12; checked 2026-09-19.**

Source:
- https://arxiv.org/abs/2609.14079

SkillSecurer studies context-compatible prompt-injection attacks against Skill packages and an agentic blue-team flow that detects, localizes and proposes patches. It reports strong results on its controlled injected instances and analyzes public Skills.

Transferable signal: package-security evaluation is increasingly **evidence/localization-oriented**, not just a single risk score. This strengthens existing `skill-foundry #3`'s need for bounded, exact-package security evidence.

Decision: `DEDUP_EXISTING_RESEARCH`. No #3 comment was added because the new paper does not change #3's current decision or grant implementation authority. Automatic security patching is explicitly **DO NOT COPY** without owner-reviewed evidence and patch authority.

# New Releases / strategy changes

| Date | Signal | Relevance | Decision |
|---|---|---|---|
| 2026-09-15 | Notion 3.7 team Skills Library + cross-agent `SKILL.md` export | distribution/library layer is becoming commodity | cross-portfolio dedup; do not copy workspace breadth |
| 2026-09-12 | SkillSecurer security research | security checks increasingly preserve localized evidence and remediation proposals | map to existing #3; no auto-patch feature |
| 2026-08-24 | Signal or Noise? WebDev Skills benchmark | negative Skill effect can be context-length or content-driven | method note for #1; no active PR scope change |
| 2026-08-20 | ACES paper | paired Skill Lift bound to task/harness/workspace/scorer | confirms Foundry's paired-evidence strategy |
| 2026-06-09 | Skill Coverage | test adequacy can be measured at documented-behavior level | **new bounded research opportunity → #10** |

No price-sensitive product conclusion was made this round. The radar did not infer willingness-to-pay, ROI, or cost savings from vendor marketing. No paid runtime was invoked.

# Community Pain

No new community anecdote crossed the evidence threshold this round. Recent discussions about whether Skills are worth maintaining and whether published Skills should be re-tested on every PR were already recorded in the 2026-09-18 Skill Foundry radar. They remain `COMMUNITY_SIGNAL` only and are not repeated as prevalence evidence.

# Adjacent Ideas

## 1. Behavior coverage receipt, not a universal coverage framework

Possible minimal output for one exact revision:

`behavior_id → Skill source locator → applicability condition → observable expected behavior → case/receipt/trajectory locator → COVERED_PASS | COVERED_FAIL | UNCOVERED | UNKNOWN`

This is only useful if it lets the reviewer see a material blind spot that aggregate green metrics hide. No fixed “90%” or “95%” coverage gate is justified by current product evidence.

## 2. Length-matched control only as a diagnostic trigger

If #1 later finds a real negative-transfer case that current evidence cannot explain, a single irrelevant length-matched control may separate context overhead from content harm. Do not pay this cost for every run preemptively.

## 3. Security finding localization without automatic patch authority

#3 can continue to prefer exact finding/evidence locators over opaque risk scores. A proposed patch is not a permission to modify or publish a Skill.

## 4. Cross-portfolio idea — evidence coverage for policy artifacts

The general pattern could matter to other Reese-max systems that make a formal claim from a reusable policy/instruction artifact: “passed tasks” should not automatically become “every instruction was validated.” This is **central-report only**; no other repo was given an Issue because this round did not validate an equivalent active certification workflow elsewhere.

# Opportunity Map — `skill-foundry`

| Category | Decision | Rationale |
|---|---|---|
| **MUST MATCH** | Preserve the difference between aggregate task success and which documented behavior was actually exercised | certification must not silently widen evidence claims |
| **MUST MATCH** | Keep exact Skill revision/hash attached to any coverage evidence | behavior mapping for one revision cannot automatically apply after Skill drift |
| **SHOULD BE BETTER** | Let reviewer trace a material behavior to the case/receipt that exercised it, if the one-Skill experiment proves decision value | reduces manual cross-check without new eval infrastructure |
| **SHOULD BE BETTER** | Keep `UNKNOWN/UNCOVERED` explicit rather than treating missing mapping as PASS | aligns with existing evidence-first semantics |
| **DIFFERENTIATOR** | Bind source/provenance, paired lift, package security, runtime compatibility, policy and behavior-level test adequacy without conflating them | generic libraries/installers do not provide the complete claim boundary |
| **ADJACENT IDEA** | length-matched control for diagnosed negative-transfer ambiguity | only after a real need appears |
| **ADJACENT IDEA** | localized security evidence from SkillSecurer-style workflows | already belongs under #3, not a new scanner product |
| **DO NOT COPY** | team Skill library/marketplace/engagement analytics | commodity layer and outside owner direction |
| **DO NOT COPY** | universal automatic natural-language constraint extractor as certification authority | model output is not authoritative specification |
| **DO NOT COPY** | arbitrary coverage percentage gate | no repo evidence establishes an appropriate threshold |
| **DO NOT COPY** | auto-patch security findings and republish Skills | patch proposal does not equal owner authorization |
| **DO NOT COPY** | trajectory lake / new eval DB / observability UI | far larger than the decision question |

# Four-gate decision for #10

## Gate 1 — problem / value

Target user: Skill author/reviewer deciding whether an exact candidate revision has enough evidence for promotion.

Observable manual break: current reviewer can see multiple green aggregate receipts but must manually inspect the Skill and several evaluation surfaces to determine whether a material instruction was ever actually exercised. Current active Skill has multiple distinct observable requirements and five checked-in public eval cases; additional hidden/public aggregate evidence exists, but no exact behavior→evidence mapping is checked in.

Counterevidence was considered: Foundry already has strong paired/trigger/Waza/Promptfoo/canary gates, and hidden tests may cover behaviors not visible in the public case folder. Therefore the radar does **not** assert a missing-behavior defect. The decision question is whether an explicit map changes review quality enough to merit a tiny addition.

Consequence of doing nothing: reviewers may continue relying on aggregate outcome evidence and manual inspection. This is acceptable unless the experiment demonstrates a material behavior remains `UNKNOWN/UNCOVERED` despite an apparently green certification bundle.

## Gate 2 — priority

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_status: NEEDS_RUNTIME_VERIFICATION
```

Why not P2/P1: no current bad promotion, user incident, security failure, completion-rate loss, or real uncovered high-risk behavior has been demonstrated. External benchmark coverage rates are not Foundry rates. Owner-approved sequencing (#6 → #1 → #3) remains ahead of this research.

## Gate 3 — minimum solution

Compare in order:

1. **Do nothing:** retain current aggregate evidence. Valid unless an actual decision blind spot is shown.
2. **Documentation only:** insufficient to answer which behavior has evidence for one exact revision.
3. **One-Skill manual mapping experiment:** smallest useful test. Manually review a short BehaviorConstraint list for the active Skill, then map existing public/allowed evidence to `COVERED_PASS/COVERED_FAIL/UNCOVERED/UNKNOWN`.
4. **Only if decision-changing unknowns appear:** add at most 2–3 synthetic/local fixtures using the existing evaluator/harness.
5. **Do not build yet:** generic parser, DB, trajectory warehouse, scoring framework or UI.

## Gate 4 — research / implementation separation

#10 has explicit exits:

- **BUILD** only if an apparently green current bundle leaves at least one material promotion-relevant behavior `UNKNOWN/UNCOVERED` and the small mapping consistently exposes the blind spot. A future BUILD would only justify adding the mapping/receipt to the existing report path.
- **NARROW** if the issue is simply a few missing fixtures or locators.
- **REJECT** if existing evidence already gives adequate material-behavior coverage or the classification is too subjective to improve decisions.

Even BUILD is not implementation authorization. No worker, branch, merge, CI change, active Skill edit or Promotion policy change is authorized by #10.

# Issue Mapping

## Created

### `Reese-max/skill-foundry#10`

https://github.com/Reese-max/skill-foundry/issues/10

Fingerprint:

`skill-foundry + evidence-gated skill certification + task-level/paired/trigger evaluations exist + no auditable mapping from material Skill behaviors to exercised evidence + certification cannot currently answer which instructions were actually tested`

The Issue body contains:
- dated first-party/research sources;
- current default/product SHA evidence;
- distinction from #1/#3/#4/#5/#6;
- minimum one-Skill experiment;
- privacy boundary for hidden/private cases;
- BUILD/NARROW/REJECT exits;
- five direct acceptance conditions;
- explicit `auto_implementation=false` and `NEEDS_RUNTIME_VERIFICATION`.

Before creation, open/closed Issues were searched for `coverage`, `behavior coverage`, `test adequacy`, `instruction coverage` and related terms; all-state PRs and branches were also rechecked. No matching fingerprint or active implementation scope was found. The new Issue was created in a single write with its complete scope; no existing Issue/shared tracker was mutated, so no existing-Issue lease marker was required.

## Not modified

- #1 / PR #2 — active target-runtime compatibility implementation; Signal-or-Noise methodology remains report-only to avoid scope theft.
- #3 — package-security research; SkillSecurer is new supporting evidence but did not change decision/status enough to justify a comment.
- #4 — distribution/install verification; recent Notion/library signals are already deduplicated and do not change the NARROW decision.
- #5 — demonstration intake; no new decision-changing evidence.
- #6 / PR #8/#9 — active exact-SHA CI validation; Actions budget/runner evidence remains their scope.

# Rejected Ideas / negative findings

1. **Declare current certification incomplete because the paper reports ~40% coverage — REJECT.** External corpus results do not establish Foundry coverage.
2. **Turn #10 into a new automated behavior-constraint extraction system — REJECT.** The minimum decision test is one manually reviewed Skill revision.
3. **Require a fixed coverage percentage for Promotion — REJECT.** No evidence establishes a meaningful threshold across skill types.
4. **Add length-matched placebo runs to every evaluation now — REJECT FOR NOW.** Useful diagnostic method, but current Foundry has no unresolved negative-transfer case proving the extra runs are worth their cost.
5. **Expand active PR #2 with new evaluation methodology — SKIPPED_ACTIVE_SCOPE.** New research evidence is preserved centrally without modifying active implementation ownership.
6. **Auto-patch SkillSecurer findings — REJECT.** Research patch proposals are not authorization to mutate a certified Skill.
7. **Build a Notion-style shared Skills Library — REJECT / DEDUP.** Owner direction and prior radars already reject workspace/library breadth.
8. **Create another security Issue from SkillSecurer — DEDUP.** Same root is already #3.
9. **Treat GitHub Actions budget/admission status as proof of Skill evaluation quality — REJECT.** CI execution evidence and live Skill behavior evidence remain separate planes.

# Sources

Checked 2026-09-19 unless otherwise stated:

1. NVIDIA — Evaluating AI Agent Skill Performance with SkillEvaluator (2026-08-19): https://developer.nvidia.com/blog/evaluating-ai-agent-skill-performance-with-nvidia-skillevaluator/
2. ACES — Evaluating Skills, Not Just Agents (2026-08-20): https://arxiv.org/abs/2608.20614
3. NVIDIA SkillEvaluator docs: https://docs.nvidia.com/skills/skillevaluator
4. NVIDIA Agent Skill Trust Pipeline: https://docs.nvidia.com/skills/agent-skill-trust-pipeline
5. Skill Coverage — A Test Adequacy Metric for Agent Skills (2026-06-09): https://arxiv.org/abs/2606.20659
6. Skill Coverage author project page: https://shuaijiumei.github.io/skillcoverage/
7. Signal or Noise? A Benchmark Study of Agent Skills in Web Development (2026-08-24): https://arxiv.org/abs/2608.23067
8. SkillSecurer (2026-09-12): https://arxiv.org/abs/2609.14079
9. Notion 3.7 — Agent skills for your whole team (2026-09-15): https://www.notion.com/en-gb/releases/2026-09-15
10. WebKit — Safari MCP introductory reference (2026-07-01; Safari 27 availability confirmed 2026-09-17 during broader scan): https://webkit.org/blog/18136/introducing-the-safari-mcp-server-for-web-developers/ — retained as a future runtime-tool reference only; it does not prove any Foundry macOS/Safari path.

# What Changed

- Reconfirmed fresh inventory: 41 accessible Reese-max-owned repositories / 40 unarchived.
- Re-read current Skill Foundry product truth at `main@21be2b62...` and product baseline `e865c005...`; no later product commit invalidated the analysis.
- Rechecked owner-approved `INVEST / SIMPLIFY` scope and active PR ownership.
- Found and recorded new decision-useful test-adequacy research not present in existing Skill Foundry Issues/radar by title/ID search.
- Created exactly one bounded research tracker, #10, without implementation authority.
- Did **not** re-open or rescope #1/#3/#4/#5/#6.
- Did not claim external benchmark statistics are Foundry runtime results.

# Classification / scope calibration

- New #10: `RESEARCH / NOT_ESTABLISHED / MEDIUM / NEEDS_EVIDENCE / auto_implementation=false / NEEDS_RUNTIME_VERIFICATION`.
- #1 remains target-runtime compatibility / negative-transfer work with active PR #2; no priority escalation from the paper.
- #3 remains package-security research; SkillSecurer strengthens the category but does not authorize automatic remediation.
- #4 remains narrow install/materialized-identity research; Notion/library changes do not justify Foundry distribution UI.
- #6 remains validation gap with active PRs; this radar does not treat absent/rate-limited CI as product failure.
- No portfolio CLEAN claim was made.

# Completion / gaps / fair cursor

Completed:
- fresh full owner inventory;
- Issue Quality v2/rules SHA refresh;
- owner direction/current default-product SHA refresh;
- all-state Issue/PR duplicate search and branch check around the focal repo;
- A direct evaluation alternative, B adjacent distribution workflow, C new evaluation/security research from public web;
- four-gate assessment and Opportunity Map;
- new Issue read-back confirmation through the create response;
- unique central report write.

Gaps / non-claims:
- no live Agnes/Codex/Waza/MiniMax/Claude runtime was executed;
- no hidden/private case was exposed or inspected beyond checked-in/aggregate repository evidence;
- no behavior-coverage map has actually been produced yet — that is #10's research question;
- no macOS/Safari runtime was exercised;
- no external benchmark outcome is claimed as Foundry performance;
- Academic Research connector returned 401 organization-context error, so arXiv primary pages were used through the public web instead;
- existing active PRs were not re-scoped or commented on.

Next fair cursor: **`Reese-max/video-timeline-pipeline`**.

This report is research/tracking evidence only and is not implementation authorization.