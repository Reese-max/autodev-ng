# External Competitive / Product / Workflow Radar — project-doctor-web

- Run timestamp: `2026-09-28T04:25:06Z`
- Focal repository: `Reese-max/project-doctor-web`
- Current default: `main@7a9a96b1f22ce80149f23d8ee1ab8ca23b046ce6`
- Last substantive product baseline: `3a7e83ed012722f5d28b4bc7fb4bddbf98d07579`
- Governing Issue Quality v2 blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh owner inventory: **42 owned / 41 unarchived / 1 archived (`obsidian-vault`)**; page 2 empty.
- Product posture: **INVEST / SIMPLIFY** — keep a bounded clinical training/research simulator with explicit provenance, deterministic emergency interception and cost containment. Do not expand into diagnostic SaaS, EHR integration, patient accounts, telemedicine or a generalized clinical data platform.
- This radar authorizes **no implementation**.

## Executive decision

A material direct-competitor shift is confirmed: Stanford Clinical Mind AI's **2026-09-19** release turns the AI simulated-patient product into a fuller educator-controlled simulation lifecycle: draft/review, document-to-patient candidate creation with instructor review, preview as the learner, multi-visit delayed-result cases, repeat-attempt comparison, rubric feedback and evidence-drilldown analytics.

A separate Stanford update dated **2026-09-15** reports interviews with **51 medical instructors** who each authored a case and interviewed the resulting AI patient. In that project report, instructors valued analytics about **communication and questioning** more than other performance information, and many identified case-authoring time as a major adoption barrier. This is institution-reported research, not treated here as a peer-reviewed effect-size or as evidence of Project Doctor user demand.

This materially sharpens existing `project-doctor-web#11`; it does **not** establish a new root cause and does not justify a new Issue. The highest-value transferable change is narrower:

> First prove an exact, privacy-safe learner-action trajectory and deterministic evidence-linked debrief before adding broader rubric analytics, course administration, voice/video, collaboration, or a simulation platform.

Existing #11 / PR #13 already owns the CaseSpec + action ledger + rubric + replay fingerprint and has active unresolved review findings. Therefore this round is:
- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM_HIGH_WITHIN_#11_AFTER_CURRENT_SAFETY_BLOCKERS`
- `triage=NEEDS_EVIDENCE`
- `coordination=SKIPPED_LOCKED`
- `auto_implementation=false`
- `runtime=NEEDS_RUNTIME_VERIFICATION`

No Issue or PR scope is modified.

## Direction / repository checkpoint

### Governing direction

The current owner-approved board direction remains **INVEST / SIMPLIFY**. The project is a research/teaching clinical simulator, not a real-care diagnostic or treatment product. Priority remains safety/provenance/runtime correctness before feature breadth.

The current default branch is `7a9a96b1f22ce80149f23d8ee1ab8ca23b046ce6`. Comparing product baseline `3a7e83ed012722f5d28b4bc7fb4bddbf98d07579` to current HEAD shows exactly four added files, all under `docs/audits/`; there is no product source/config/CI drift in that range.

### Existing active ownership

- #11 — CaseSpec-driven virtual patient + competency feedback / debrief:
  https://github.com/Reese-max/project-doctor-web/issues/11
- PR #13 — research design for CaseSpec / LearnerActionLedger / CompetencyRubric:
  https://github.com/Reese-max/project-doctor-web/pull/13
  - unresolved P2 review: a single `requestedAction` loses compound-turn actions.
  - unresolved P2 review: retaining raw `learnerUtterance` can retain PHI; use redaction/structured actions or a non-retained transcript reference.
- #19 — emergency-intercept lifecycle remains a distinct P2 safety issue:
  https://github.com/Reese-max/project-doctor-web/issues/19
- PR #20 — active split-turn emergency work has an unresolved P1 review about prior trusted operator objective facts being excluded from cross-turn emergency evidence:
  https://github.com/Reese-max/project-doctor-web/pull/20
- #18 privacy research already reached a bounded **NARROW** result; it supports only a thin point-of-use MiniMax processing disclosure if owner later authorizes it, not a consent/compliance framework:
  https://github.com/Reese-max/project-doctor-web/issues/18

Historical radar was checked before this decision. #11 already contains Geeky Medics/SimChat, Body Interact, SimX and prior literature signals, so those are not counted as new findings here.

## Product → market category

`project-doctor-web` maps most closely to:
1. AI simulated patients / virtual standardized patients;
2. clinical reasoning and history-taking practice;
3. educator-authored case simulation;
4. evidence-linked debrief and repeated-practice assessment.

It is **not** scoped as a telemedicine service, EHR product, real-patient clinical assistant, or institution-wide LMS.

## External Signals

### A. CONFIRMED — Stanford Clinical Mind AI moves toward an educator-controlled end-to-end simulation lifecycle

**Event date: 2026-09-19. Checked: 2026-09-28.**

Official source:
https://clinicalmindai.stanford.edu/news/more-ways-teach-learn-and-collaborate-82-new-features-and-improvements-clinical-mind-ai

The release contains 82 changes. The high-value workflow signals for this product are:

- **Draft before release**: patients, rubrics and clinical activities can remain unfinished drafts.
- **Document → candidate patient → instructor review**: an instructor can upload text/Word/PDF to prefill simulated patient information, including examination findings and tests; the instructor reviews/completes the proposed information before use.
- **Preview as learner before release**: an instructor can experience the activity from the learner perspective, including AI feedback, without saving instructor performance.
- **Delayed-result / two-visit cases**: tests can return later; the second visit preserves prior conversation and requested-test context.
- **Compare attempts over time**: instructors can move between attempts and examine whether the learner changed approach after feedback.
- **Evidence drill-down**: analytics navigation goes from course/activity summaries to underlying student/activity/result evidence.
- **Process-level data**: activity analytics include physical-examination and test-request patterns, not only final answer/score.
- **Resource constraints**: test costs and budgets can be part of a case.

These features solve concrete workflow breaks: repeated manual reconstruction of case state, checking an AI-generated case before learners see it, comparing two attempts, and reconstructing why a learner got a result.

Transferable core: **candidate → human review → controlled release → exact attempt evidence → debrief / comparison**.

Not transferable now: institution administration, course/group systems, public libraries, broad analytics exports, scheduled notifications, or cost/budget infrastructure.

### B. CONFIRMED — Stanford instructor study reports process analytics and authoring workload as the important problems

**Event: Stanford Big Ideas in Medicine Conference, 2026-09-11 to 2026-09-12. Article date: 2026-09-15. Checked: 2026-09-28.**

Official source:
https://clinicalmindai.stanford.edu/news/clinical-mind-ai-research-presented-stanfords-big-ideas-medicine-conference-2026

Stanford reports a poster based on semi-structured interviews with **51 medical instructors**. Each instructor authored a case and interviewed the resulting AI patient.

The project report says:
- instructors valued analytics about **communication and questioning** above other performance information;
- they wanted insight into how learners reason through a case, not only the final diagnosis;
- many described **case-authoring time** as a major adoption barrier;
- AI simulated patients were framed as a complement to standardized patients rather than a replacement.

Evidence boundary:
- this is an official Stanford project report about its own research;
- it is **not** used as a peer-reviewed learning-effect estimate;
- it does not prove Reese-max users have the same preferences;
- it is strong enough to prioritize which existing #11 hypothesis should be tested first.

### C. CONFIRMED — text transcript and voice transcript must not share the same evidence-confidence semantics

**Current documentation checked: 2026-09-28.**

Official source:
https://clinicalmindai.stanford.edu/platform/institutional-data-exports/student-performance-conversation-data

Clinical Mind AI states that text interactions reproduce what the learner typed and the simulated patient returned, whereas voice transcripts are speech-recognition output and may contain errors/omissions. Their documentation recommends text or complementary assessment when communication content must be evaluated accurately.

Transferable principle: if Project Doctor ever adds voice, an ASR transcript must not silently inherit the same “exact evidence” status as typed text. This is only an **adjacent future constraint**, not a reason to build voice now.

## New Releases

The only release promoted into this run's decision is the **2026-09-19 Clinical Mind AI 82-feature release**, because it materially changes the direct competitor workflow from “AI patient interaction” toward a managed simulation lifecycle.

Recent Geeky Medics / SimChat functionality was rechecked but is already represented in #11 and prior radar, so it is not counted again as new evidence.

## Community Pain

No community anecdote was strong enough this round to change priority or establish frequency. No Reddit/forum complaint is promoted into a finding merely to fill a category.

## Adjacent Ideas

### 1. Process-first debrief, not diagnosis-first scoring

The external evidence strengthens an already implied #11 principle: the debrief should first answer:
- What did the learner actually ask/request?
- Which case facts became available because of those actions?
- Which important action/fact was missed?
- Which result is unsupported / NOT_ASSESSED?
- How did attempt B differ from attempt A?

This should be deterministic from CaseSpec + normalized actions + fact IDs before adding an LLM judge.

### 2. Candidate case import is useful only as authoring acceleration

“Upload a vignette/document and prefill a case” is promising because authoring workload is a reported barrier. The transferable shape is:

`source vignette → CandidateCaseSpec → schema/reference checks → educator review → ACTIVE exact version`

Do **not** let imported/AI-generated case facts become active automatically.

### 3. Delayed result / second visit

A bounded two-visit case could eventually test longitudinal reasoning better than a single chat. It is an **ADJACENT IDEA**, not current scope: first prove action capture and debrief correctness.

### 4. Resource-use constraints

Test cost/budget can teach prioritization, but it introduces institution/currency/content maintenance. Keep it deferred until the core case/evidence loop is proven.

## Opportunity Map

### MUST MATCH

- Educator-approved canonical case truth owns clinical facts; natural language does not.
- `NOT_ASSESSED / NOT_PROVIDED / UNKNOWN` remain explicit states.
- AI-generated/imported case content must remain candidate/draft until review.
- Every assessed learner behavior must trace to exact normalized actions / fact IDs / case revision.
- A repeated attempt must bind to the same exact CaseSpec/rubric baseline if it is compared.
- Model/prompt/parser versions must remain distinguishable from educator case truth.
- Raw learner text must not be retained by default merely to make scoring easier.

### SHOULD BE BETTER

- Preserve **all** actions in compound turns instead of one `requestedAction`.
- Make debrief process-oriented: questions, examinations/tests requested, facts revealed/missed, unsupported claims.
- Offer a learner-view preview before a case version becomes active.
- Allow deterministic attempt-to-attempt comparison without re-parsing raw conversation text.
- Keep authoring workload low through candidate generation/import, but require review.

### DIFFERENTIATOR

- Synthetic-first, bounded clinical training rather than an open-ended “AI doctor”.
- Deterministic fact reveal and explicit unavailable/unknown states.
- Evidence-linked debrief with replayable case/rubric/action identities.
- Privacy-safe structured action evidence instead of indefinite raw transcript retention.
- No claim that an AI-generated score or simulated patient is clinical truth.

### ADJACENT IDEA

- Delayed-result / two-visit cases.
- Bounded test-cost/resource constraints.
- Modality-specific evidence confidence if voice is ever studied.
- Thin document-to-CandidateCaseSpec import after the canonical schema is stable.

### DO NOT COPY

- Institution/account/course administration suite.
- Public case marketplace/library.
- Group collaboration/chat.
- Full LMS/analytics warehouse.
- Voice/video/avatar expansion now.
- Experimental generative patient video.
- Email/notification system.
- Broad AI analytics assistant.
- Autonomous activation of AI-generated clinical cases.

## Four-gate evaluation

### Gate 1 — Problem / value

Target users: clinical/health-professions learners and educators using synthetic teaching cases.

Observed supported-workflow problem behind #11:
- current product is an open-ended interview/SOAP flow;
- a deterministic educator-owned scenario truth and exact learner-action/debrief contract are not on current default;
- active PR #13 design can lose compound-turn actions and has an unresolved raw-text/PHI retention issue.

New external evidence does not invent this root cause; it clarifies the highest-value job:
**understand the learner's reasoning process from actions/questions, while reducing case-authoring effort without surrendering case truth to AI.**

Counter-evidence:
- a transcript plus ordinary rubric may prove sufficient;
- the product has no Reese-max user study showing institutional analytics, group workflows or multi-visit simulation are needed;
- current safety/runtime blockers outrank product breadth.

### Gate 2 — Priority

```yaml
issue_quality_version: 2
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: MEDIUM_HIGH_WITHIN_#11_AFTER_CURRENT_SAFETY_BLOCKERS
evidence: SOURCE_CONFIRMED_EXTERNAL_PLUS_REPO_CONFIRMED
triage: NEEDS_EVIDENCE
coordination: SKIPPED_LOCKED
auto_implementation: false
runtime: NEEDS_RUNTIME_VERIFICATION
```

Why not P2/P1:
- competitor capability is not a product failure;
- no current user completion/safety loss has been measured for missing process analytics;
- existing safety issues and active remediation are separate, already tracked.

### Gate 3 — Minimum solution

Do not build a simulation platform.

When #11's active design blockers are resolved, the smallest bounded research fixture is:

1. one synthetic CaseSpec with a small fixed set of fact IDs and critical actions;
2. one compound learner turn containing multiple history/exam/test actions;
3. a normalized `actions[]` representation that does not require retaining raw learner text;
4. one deterministic debrief that maps each rubric/process item to action/fact evidence or `NOT_ASSESSED`;
5. two attempts against the same exact case revision, with a deterministic attempt diff.

No database, graph, LMS, course system, voice, video, provider change, or production data is required.

A secondary authoring experiment is allowed only after the schema is trustworthy: convert one synthetic vignette into a **CandidateCaseSpec** offline, require explicit educator review, and compare manual edits needed. Do not make this a production uploader first.

### Gate 4 — Research / implementation separation

BUILD only if the bounded fixture proves that:
- all actions in compound turns are captured deterministically;
- process/debrief questions can be answered without re-parsing or indefinitely retaining raw utterances;
- unknown/out-of-case facts stay unknown;
- attempt comparison remains bound to exact case/rubric identity;
- candidate import does not bypass human activation.

NARROW if only history-taking/questioning benefits from structured process evidence.

REJECT if current transcript + rubric already provides the same useful review with less state/maintenance.

Even BUILD only supports a next product decision; it does not authorize implementation.

## Rejected Ideas / Why

- **New Issue for “process analytics”** — rejected: same actual root/workflow gap as #11, with active PR #13.
- **Full Clinical Mind clone** — rejected: institutional/LMS scope conflicts with owner direction and product scale.
- **Voice / realtime patient** — rejected now: no user evidence, extra cost/latency/provenance burden; current external documentation itself distinguishes ASR transcript uncertainty.
- **Video patient / avatar** — rejected now: high complexity, experimental even in competitor context, no core-workflow evidence.
- **Public case library / marketplace** — rejected: distribution/network effects are not current JTBD.
- **Test budget subsystem** — deferred: interesting clinical prioritization mechanic, not needed to validate CaseSpec/action/debrief.
- **New analytics database / event ledger service** — rejected: a bounded structured fixture and existing app state are enough for the research question.
- **LLM judge as primary scorer** — rejected: external evidence supports process visibility, not opaque model authority.

## Issue Mapping / Coordination

| Signal | Canonical tracking | Action |
|---|---|---|
| educator-owned case truth / debrief / replay | #11 / PR #13 | `SKIPPED_LOCKED`; new external evidence only in central report |
| compound-turn learner actions | unresolved PR #13 review | no comment/scope rewrite |
| raw learner text / PHI retention | unresolved PR #13 review | no comment/scope rewrite |
| MiniMax point-of-use provider disclosure | #18 | already NARROW; no duplicate |
| emergency lifecycle / split-turn safety | #19 / PR #20 and existing safety issues | higher-priority independent work; no scope change |

No Issue lease was acquired because no Issue/PR/shared issue status was modified.

## Cross-portfolio idea

One small reusable principle is worth retaining, but not building as a framework:

**Evidence identity should include capture modality / confidence class.** Typed text can be exact user input; ASR-derived text is a derived observation and should not silently acquire exact-source status. This may later matter to `clinical-scribe-worker` and other evidence-oriented products, but there is no cross-repo implementation authorization and no shared schema is proposed.

## Sources

Primary public-web sources (not GitHub):

1. Stanford Clinical Mind AI — “More Ways to Teach, Learn, and Collaborate: 82 New Features and Improvements in Clinical Mind AI”
   - Date: 2026-09-19
   - Checked: 2026-09-28
   - Classification: CONFIRMED / first-party product update
   - https://clinicalmindai.stanford.edu/news/more-ways-teach-learn-and-collaborate-82-new-features-and-improvements-clinical-mind-ai

2. Stanford Clinical Mind AI — “Clinical Mind AI Research Presented at Stanford’s Big Ideas in Medicine Conference 2026”
   - Event: 2026-09-11 to 2026-09-12
   - Article date: 2026-09-15
   - Checked: 2026-09-28
   - Classification: CONFIRMED institution-reported research / not used as peer-reviewed outcome evidence
   - https://clinicalmindai.stanford.edu/news/clinical-mind-ai-research-presented-stanfords-big-ideas-medicine-conference-2026

3. Stanford Clinical Mind AI — Student Performance (Conversation Data)
   - Checked: 2026-09-28
   - Classification: CONFIRMED / first-party data-export documentation
   - https://clinicalmindai.stanford.edu/platform/institutional-data-exports/student-performance-conversation-data

Repository/decision sources:
- Issue Quality v2:
  https://github.com/Reese-max/autodev-ng/blob/main/docs/portfolio-audit/2026-09-14-issue-quality-v2.md
- Project Doctor #11:
  https://github.com/Reese-max/project-doctor-web/issues/11
- Project Doctor PR #13:
  https://github.com/Reese-max/project-doctor-web/pull/13
- Project Doctor #18:
  https://github.com/Reese-max/project-doctor-web/issues/18
- Project Doctor #19:
  https://github.com/Reese-max/project-doctor-web/issues/19
- Project Doctor PR #20:
  https://github.com/Reese-max/project-doctor-web/pull/20

## What Changed

Since the older #11 evidence set, the important new material is not “another AI virtual patient exists.” It is:

1. a direct competitor now exposes an explicit **draft/review → learner preview → controlled release → repeat attempt / evidence drill-down** lifecycle;
2. its newest reported instructor interviews prioritize **communication/questioning trajectory** and identify **case-authoring workload** as a barrier;
3. this makes the unresolved PR #13 “single requestedAction” limitation more consequential for the research hypothesis, because losing compound actions destroys the very process evidence educators say they value;
4. it strengthens the existing candidate-before-active case-authoring direction;
5. it does **not** justify institutional SaaS, voice/video, collaboration, or a new analytics subsystem.

Owner direction remains **INVEST / SIMPLIFY**. No external evidence overturns the requirement to finish current safety/provenance/runtime work first.

## Completion / gaps / cursor

Completed:
- fresh owned-repository pagination: 42 owned / 41 unarchived / 1 archived;
- governing rule blob re-read;
- current target HEAD and docs-only delta checked;
- owner direction and historical radar checked;
- all-state target PR search and relevant Issue comments checked;
- target branch pagination completed;
- active #11 / PR #13 review ownership checked;
- public-web direct-competitor and adjacent evidence checked;
- de-duplication completed.

Gaps:
- no Project Doctor real-user study was run;
- no MiniMax/provider/runtime/browser call was performed;
- no production deployment, real patient data, paid request, or voice test was performed;
- Stanford's 51-instructor result is treated as institution-reported research, not an independent effect estimate.

Writes in this round:
- central report only;
- 0 target Issues;
- 0 target Issue/PR comments;
- 0 product source/config/CI changes;
- 0 implementation branches;
- 0 merge/deploy/GOAL/worker;
- 0 implementation authorization.

Next fair product cursor: **`Reese-max/minideck`**.
