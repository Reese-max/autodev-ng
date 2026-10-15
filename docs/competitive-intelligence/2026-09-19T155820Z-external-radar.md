# External Competitive / New-Product / Workflow Radar — 2026-09-19T15:58:20Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY / 0_NEW_ISSUES / 0_TRACKING_WRITES / NOTIFICATION_THRESHOLD_NOT_MET**.
- Owner scope: `Reese-max` only. No third-party repository was modified.
- Issue-quality rules re-read from `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected-owner enumeration returned **41 Reese-max-owned repositories / 40 unarchived**; `obsidian-vault` is the only archived repository returned. The result fit within one `page_size=100` page; no historical inventory was used as the denominator.
- Fair cursor entering this round: `Reese-max/cyber-prep-coach`, carried from `2026-09-19T140215Z-external-radar.md`.
- Focal default branch rechecked at analysis start: `main@402e472261f8f02c2089e81d1cc3c40ba6977bda`. The latest commits after `0f5dcca3902735d3b68b96611b97f70128544f51` are audit/product-board documentation; this radar does not treat those documentation commits as candidate-facing product fixes.
- Owner-approved product direction re-read from the repository's 2026-09-10 Product Board audit and current PRD: **INVEST while holding public release on content calibration**. Core differentiation is iPAS specificity, source/provenance, local-first learner state and trustworthy explanations; do not expand into a generic AI tutor, LMS, cloud-account platform, social feed, marketplace or hands-on cyber lab before current trust/release work is credible.
- Existing active scope was rechecked. PR #13 for #4 (`MasteryProfile` / adaptive 今日任務), PR #7 for #6 (independent calibration machinery), and PR #11 for #10 (RSC CVE patch) are OPEN and unmerged. This radar does not take over those scopes.
- No browser/device, Cloudflare deployment, real learner, human SME, iPAS authenticated flow, paid service or production mutation was exercised. Runtime claims remain limited to repository evidence and external public sources stated below.

## Executive decision

This round found **useful external evidence, but no new finding crosses the Issue gate**.

The strongest external signals all reinforce work already in flight:

1. **Pocket Prep's current certification-prep workflow** separates unseen-question micro-practice, missed questions, weakest subject, timed quiz, build-your-own practice and full mock exam; its guidance explicitly moves a learner from first question to exam day. That is strong market evidence for the product job behind #4/#13, but not a new root cause.
2. **Quizlet's current Learn / spaced-repetition surfaces** similarly emphasize targeted practice from past study behavior and due review. This supports explainable adaptive review, but it does not establish that `cyber-prep-coach` should copy a generic flashcard scheduler or cloud sync.
3. **TryHackMe launched PT2 on 2026-09-15**, reinforcing a separate market category centered on hands-on, job-skill certification. That is a useful boundary signal: this repo should deepen iPAS exam fidelity and evidence, not chase browser labs or practical penetration-testing infrastructure.
4. The **current retrievable iPAS learning-resources page shows only 115-1 intermediate current-session papers**, while a 2026-09-04 independent article reports that it obtained/read the 115-2 I21/I22 papers from the iPAS site. This is an external-source consistency warning, not proof that 115-2 was permanently removed. It strengthens #12's existing requirement to capture exact first-party URLs, publication dates, bytes and hashes during a bounded ingestion dry-run rather than assuming stable landing-page discoverability.

The smallest product decision is therefore **no new implementation request**. Keep active #10/#6 release-trust work ahead of feature expansion; let #13 finish or be owner-reviewed before revisiting adaptive-planner refinements; keep #12 as the bounded source-ingestion research object. No new scheduler, source registry, lab platform, account sync, AI tutor or second mastery engine is justified.

---

# Product → market category

| Product | Market / substitutes | Current differentiated job |
|---|---|---|
| `cyber-prep-coach` | iPAS official resources, Pocket Prep, Boson ExSim, Quizlet, Anki, community iPAS quiz sites; adjacent TryHackMe/HTB hands-on cyber training | Local-first, source-traceable iPAS intermediate practice with historical questions, mock/practice flows, learner state and explicit content/release evidence |

The current product is not trying to be the broadest cyber-learning platform. Its stronger wedge is **authoritative-ish source traceability + exam-specific practice + local ownership + calibrated trust**.

# External Signals

## A. CONFIRMED — Pocket Prep keeps exam-prep modes behaviorally distinct

**Published: 2026-04-10 on the current Help Center page. Checked: 2026-09-19.**

Primary source:
- https://help.pocketprep.com/en/articles/14548723-quiz-modes-explained-how-to-study-with-pocket-prep

Pocket Prep's current workflow distinguishes:

- Question of the Day for a minimal daily habit;
- Quick 10 prioritizing unseen questions;
- Timed Quiz for bounded practice time;
- Level Up for progressively harder subject practice;
- Missed Questions;
- Weakest Subject;
- Build Your Own for explicit filters/interleaving;
- Mock Exam matching exam time/question count on supported exams.

Its guidance also recommends a full mock roughly 1–2 weeks before the exam and then using the subject breakdown to focus final preparation.

### User job / transferable pattern

This is not evidence that every mode improves outcomes. It is evidence that successful certification-prep products preserve **different user intents** instead of collapsing everything into one opaque adaptive feed.

`cyber-prep-coach` already has nearly the same semantic separation: today task, custom practice, wrong/uncertain/favorites, timed mock and target exam date. PR #13 adds an explainable adaptive planner with reason codes. Therefore the transferable lesson is to keep adaptive selection **explainable and reversible**, not create another route or black-box score.

### Counterevidence / limit

Pocket Prep is a broad paid certification platform with account/cloud behavior and proprietary question banks. Its packaging, learner volume and learning-effect claims do not transfer to this local-first iPAS product. No real user evidence here shows that the current planner causes failure.

### Decision

`SHOULD BE BETTER / DEDUP #4 / SKIPPED_LOCKED_ACTIVE_PR#13`.

Under Issue Quality v2, the old #4 `P2 FEATURE` wording should not be read as a confirmed P2 product defect solely because competitors personalize study. The external signal is best treated as an `OPPORTUNITY` input; active implementation scope already exists and is untouched.

---

## B. CONFIRMED current capability — Quizlet Learn and spaced repetition target due/weak material

**Current product pages checked 2026-09-19; the spaced-repetition page does not expose a reliable publication date in the retrieved page.**

Primary sources:
- https://quizlet.com/features/learn
- https://quizlet.com/cn/features/spaced-repetition

Quizlet Learn says it uses prior study behavior to focus practice on what is most challenging. Its current spaced-repetition surface asks learners to rate recall difficulty and automatically schedules future review; the retrieved page also says that this spaced-repetition feature is not yet available in the mobile app.

### Transferable product principle

A useful adaptive system keeps at least three facts separate:

`what the learner got wrong / what appears weak / what is due to be seen again`.

That aligns with #4/#13's separation of incorrect, uncertain, sample insufficiency, review due, coverage gaps and unseen exploration. It does **not** justify importing Quizlet's account model, flashcard abstraction, generic Memory Score or cloud synchronization.

### Minimum future question after #13 owner review

Only if real use shows the current topic-level due logic is too coarse, test one bounded fixture comparing existing deterministic due logic with an item-level spacing rule. Do not introduce FSRS/SM-2 or a second scheduler merely because another product uses spaced repetition.

### Decision

`ADJACENT SUPPORT / NO NEW ISSUE`.

---

## C. CONFIRMED new release — TryHackMe PT2 deepens the hands-on certification branch

**Published: 2026-09-15. Checked: 2026-09-19.**

Primary source:
- https://tryhackme.com/resources/blog/introducing-pt2-tryhackme-advanced-penetration-testing-certification

TryHackMe launched PT2 as an advanced penetration-testing certification and recommends preparation through practical web-app pentesting, red teaming, DevSecOps and Active Directory training. This is a real new product/release signal in the broader cybersecurity-learning market.

### Strategic implication

It clarifies category boundaries rather than creating a feature gap. `cyber-prep-coach` serves a Taiwanese knowledge/certification exam with an existing 880-question traceable corpus. Building AttackBox-style labs, practical networks, red-team environments or job-skill certificates would add major infrastructure, safety, cost and content-maintenance obligations without evidence that the iPAS core job requires them.

### Decision

`DO NOT COPY / CATEGORY BOUNDARY`.

---

## D. CONFIRMED current competitor pattern — Boson ExSim separates study, reports and exam simulation

**Current product pages checked 2026-09-19; no reliable page publication date exposed.**

Primary source:
- https://www.boson.com/exsim-max-practice-exams/

Boson ExSim currently emphasizes detailed explanations/references, category reports, timed simulation matching the live exam and longitudinal score comparison. This reinforces three existing `cyber-prep-coach` tracks rather than exposing a new root cause:

- official-mode fidelity → #3 / PR #9;
- weakness/adaptive review → #4 / PR #13;
- explanation trust/calibration → #6 / PR #7.

### Decision

`MUST MATCH CONCEPTUALLY / DEDUP EXISTING SCOPE`.

---

## E. SOURCE CONSISTENCY SIGNAL — iPAS 115-2 discoverability is not currently stable enough to assume

**Official page checked 2026-09-19. Secondary observation dated 2026-09-04.**

Sources:
- First-party current learning-resources page: https://ipd.nat.gov.tw/ipas/certification/ISE/learning-resources
- Secondary contemporaneous observation: https://vocus.cc/article/6a9a7809fd897800016a9188

The currently retrievable first-party learning-resources page exposes 115-1 I21/I22 as the intermediate current-session papers. By contrast, the independent 2026-09-04 article explicitly states that the author obtained/read the newly published 115-2 I21/I22 papers from the iPAS site and analyzes their content.

### Evidence classification

- `CONFIRMED`: the retrieved first-party page snapshot currently visible to this radar lists 115-1, not 115-2.
- `COMMUNITY_SIGNAL`: a dated independent article says 115-2 was available from the official site on 2026-09-04.
- `UNKNOWN`: whether the official site removed 115-2, temporarily rotates “current” papers, serves different content dynamically, or the web retrieval snapshot is stale.

This inconsistency is exactly why #12's minimum experiment is correctly framed around **actual first-party URL + bytes + hash + bounded dry-run**, not “scrape whatever the landing page currently shows.”

### Decision

`SOURCE-RISK SUPPORT / DEDUP #12 / NO ISSUE COMMENT`.

The observation is not strong enough to assert a regression or a permanent official-source removal, so this radar does not mutate #12. Future execution of #12 should resolve the live-source state directly and record the exact retrieved artifacts.

# New Releases / strategy changes

| Date | Signal | Implication | Decision |
|---|---|---|---|
| 2026-09-15 | TryHackMe PT2 launched | hands-on cyber certification is deepening as a separate market branch | DO NOT COPY labs/infrastructure into iPAS prep |
| 2026-09-04 | Independent dated report says iPAS 115-2 I21/I22 became available | current corpus freshness is decision-relevant | already #12; exact first-party artifact capture required |
| current | Quizlet Learn / spaced repetition focus weak + due material | supports adaptive, explainable review | existing #4/#13; no second scheduler |
| current | Boson ExSim study/report/simulation split | exam prep benefits from distinct practice jobs | existing #3/#4/#6 |

No recent source discovered this round establishes a need for a new generic AI tutor, cloud learner account, social layer, marketplace, cyber lab environment or broad learning-platform expansion.

# Community Pain

No anecdotal community complaint was promoted to product-severity evidence this round.

The 2026-09-04 iPAS analysis is retained only as a **dated source/discoverability signal**. Its claims about exam difficulty, future trends and topic importance are the author's analysis, not official prevalence/effect evidence and not an answer-key authority.

# Adjacent Ideas

## 1. Exam-date-aware planner refinement — HOLD behind #13

The repo already stores `targetExamDate` and shows days remaining, while PR #13's documented adaptive mix centers on weakness, uncertainty, due review, coverage, unseen and replay. Pocket Prep's workflow explicitly changes recommended behavior as exam day approaches.

This is a plausible future refinement, but there is no current user/runtime evidence that ignoring exam proximity inside the planner causes material failure, and active PR #13 owns the same decision surface. Keep it as a central candidate only.

If later validated, the minimum experiment is not a calendar service: use one deterministic learner fixture at two synthetic horizons (for example 60 days vs 7 days) and ask whether the existing mix should merely change bounded weights or recommend an official-mode mock. BUILD/NARROW/REJECT from that fixture before changing schema.

## 2. Retrieval-before-explanation — HOLD behind #6

Pocket Prep explicitly recommends an “explain your answer” retrieval-practice behavior on questions previously missed. That is interesting because this repo currently has 880 AI-generated explanations whose independent calibration is still open work.

A possible future low-cost experiment would ask the learner to recall/explain before revealing the stored rationale on a small optional flow. But without user evidence, scoring criteria or completed explanation-trust calibration, adding a free-text interaction now would add UX complexity and possibly imply evaluation authority that does not exist.

Decision: `ADJACENT IDEA / HOLD / NO ISSUE`.

# Opportunity Map — `cyber-prep-coach`

| Bucket | Decision | Evidence / rationale |
|---|---|---|
| **MUST MATCH** | Current dependency/security baseline and public-release trust evidence | #10 / PR #11 plus existing release blockers |
| **MUST MATCH** | Exam-mode fidelity and clear separation of training vs official pacing | #3 / PR #9; Boson/Pocket Prep reinforce the job |
| **SHOULD BE BETTER** | Explainable adaptive next task using local evidence, not opaque “AI score” | #4 / PR #13; Pocket Prep + Quizlet support the job |
| **SHOULD BE BETTER** | Latest official paper/source acquisition must preserve exact artifact identity rather than assume landing-page permanence | #12 + current iPAS discoverability inconsistency |
| **DIFFERENTIATOR** | Source/provenance + local learner state + calibrated explanation receipts for a narrow iPAS corpus | current product board / #6 |
| **ADJACENT IDEA** | Bounded exam-horizon weighting after #13; optional retrieval-before-rationale after #6 | plausible but not evidence-backed enough to open work |
| **DO NOT COPY** | hands-on cyber labs, generic AI tutor/chat, forced cloud accounts, social feed, broad LMS, marketplace, second scheduler/framework | large scope without supported iPAS job evidence |

# Four-gate decisions

## Candidate A — add another adaptive/spaced-repetition engine

### Gate 1 — problem / value

The value of better next-best-study selection is already established as a product opportunity in #4. Current PR #13 implements a deterministic, explainable local planner. Competitor use of spacing does not prove a distinct root cause.

### Gate 2 — priority

`OPPORTUNITY / NOT_ESTABLISHED / MEDIUM / NEEDS_REVIEW` as an external signal. Do not re-label this as P2/P1 because Quizlet/Pocket Prep have similar features.

### Gate 3 — minimum solution

No new engine. First review/validate PR #13's existing weak/due/coverage/unseen logic. Only a demonstrated failure of that logic could justify one small scheduling experiment.

### Gate 4 — research/implementation separation

PR #13 is OPEN. No comment, Issue edit or scope expansion is made by this radar.

**Decision: DEDUP / SKIPPED_LOCKED_ACTIVE_PR#13.**

## Candidate B — open a new 115-2 source-freshness Issue

### Gate 1 — problem / value

The current official landing-page retrieval and the dated 2026-09-04 external observation are inconsistent. However #12 already exists specifically to obtain exact first-party 115-2 artifacts and test ingestion through existing gates.

### Gate 2 — priority

Existing #12 remains `RESEARCH / NOT_ESTABLISHED / decision_priority=HIGH / NEEDS_EVIDENCE`. This radar does not convert source inconsistency into a product defect.

### Gate 3 — minimum solution

Reuse #12: capture exact URLs, publication dates, SHA-256 and byte lengths during a direct first-party retrieval attempt; then dry-run current parser/review/version gates. No source watcher, registry or crawler service.

### Gate 4 — research/implementation separation

No ingestion was executed in this radar; no `BUILD` decision is claimed. The inconsistent public observations are retained here until a direct #12 experiment resolves them.

**Decision: DEDUP #12 / NO WRITE.**

## Candidate C — add hands-on labs because cybersecurity competitors do

### Gate 1 — problem / value

No supported iPAS user workflow requires browser attack labs; the product's core job is exam-specific historical practice and review.

### Gate 2 — priority

`OPPORTUNITY / NOT_ESTABLISHED / LOW / OUT_OF_SCOPE`.

### Gate 3 — minimum solution

Do nothing. Existing question/exam workflows are the lower-cost path to the supported job.

### Gate 4 — research/implementation separation

TryHackMe's new PT2 is category evidence, not authorization.

**Decision: REJECT / DO NOT COPY.**

# Issue Mapping / dedupe / coordination

- **0 new Issues.**
- **0 Issue edits/comments.**
- **0 PR comments/reviews.**
- **0 implementation authorization.**
- #10 RSC dependency patch: PR #11 is OPEN/unmerged; untouched.
- #6 independent explanation calibration: PR #7 is OPEN/unmerged; human SME runtime remains not established; untouched.
- #4 adaptive mastery / next-best task: PR #13 is OPEN/unmerged; Pocket Prep/Quizlet signals map here; `SKIPPED_LOCKED_ACTIVE_PR#13`.
- #3 official-spec mock: existing PR #9 owns scope; Boson/Pocket Prep simulation evidence does not create a duplicate.
- #12 115-2 ingestion: current external-source inconsistency maps here. No direct 115-2 artifact retrieval was executed, so no status/Issue claim was changed.

No issue lock marker was written because this run made no Issue/shared-state mutation. Avoiding comments on active scopes is intentional coordination, not a missed write.

# Rejected Ideas

1. **Install FSRS/SM-2 or create a generic spaced-repetition subsystem now.** Rejected: competitor mechanism is not a root-cause proof; #13 already owns the adaptive job.
2. **Turn `targetExamDate` into a full calendar/reminder service.** Rejected: no evidence that external scheduling infrastructure is needed; a future deterministic horizon parameter would be smaller if the gap is validated.
3. **Create a permanent iPAS source watcher because the landing page is inconsistent.** Rejected: #12's one-shot artifact capture is enough to answer the immediate decision; watcher/service maintenance is not yet justified.
4. **Use the 2026-09-04 blog as official answer truth.** Rejected: it is useful as a dated availability/topic signal only; first-party source remains required for content truth.
5. **Add TryHackMe-style labs/AttackBox.** Rejected: different job, high infrastructure/security/content cost, no current iPAS-value evidence.
6. **Add another AI tutor because exam questions are becoming more scenario-based.** Rejected: explanation calibration remains unresolved and generic chat would widen authority before trust is established.
7. **Treat “all explanations approved” as equivalent to expert-validated correctness.** Rejected: current owner direction and #6 explicitly separate AI review from independent calibration.
8. **Create a second official-mode Issue because competitors simulate live exams.** Rejected: #3 / PR #9 already owns the root job.

# Cross-portfolio ideas

One bounded reusable principle is retained without creating cross-repo work:

> **When an external source is a product truth dependency, preserve the exact observed artifact identity separately from the current discoverability of the landing page.**

A source can be real and previously observed even if a landing page later rotates, disappears or serves a different view. This principle may help other source-driven repos, but it does not justify a central source registry/framework without a demonstrated repeated failure.

# Sources

External public-web sources — primary intelligence for this round:

1. iPAS Information Security Engineer learning resources — current first-party page, checked **2026-09-19**: https://ipd.nat.gov.tw/ipas/certification/ISE/learning-resources
2. Pocket Prep — Quiz Modes Explained, page date **2026-04-10**, checked 2026-09-19: https://help.pocketprep.com/en/articles/14548723-quiz-modes-explained-how-to-study-with-pocket-prep
3. Quizlet Learn — current capability, checked **2026-09-19**: https://quizlet.com/features/learn
4. Quizlet Spaced Repetition — current capability; page publication date not reliably exposed, checked **2026-09-19**: https://quizlet.com/cn/features/spaced-repetition
5. TryHackMe — PT2 launch, **2026-09-15**, checked 2026-09-19: https://tryhackme.com/resources/blog/introducing-pt2-tryhackme-advanced-penetration-testing-certification
6. Boson ExSim-Max — current practice/simulation/report capabilities; page publication date not reliably exposed, checked **2026-09-19**: https://www.boson.com/exsim-max-practice-exams/
7. CCChen / Vocus — dated independent report of reading iPAS 115-2 official questions, **2026-09-04**; treated as COMMUNITY_SIGNAL, not first-party content truth: https://vocus.cc/article/6a9a7809fd897800016a9188

Internal GitHub evidence used only for product truth, direction, dedupe and coordination:

- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` @ blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- `Reese-max/autodev-ng/docs/competitive-intelligence/2026-09-19T140215Z-external-radar.md` for fair-cursor continuation.
- `Reese-max/cyber-prep-coach@402e472261f8f02c2089e81d1cc3c40ba6977bda`.
- Candidate-facing product baseline `0f5dcca3902735d3b68b96611b97f70128544f51` because later default commits inspected here are audit/product-board docs.
- Current README / PRD / RELEASE-BLOCKERS / latest fixed-50 audit.
- Issues #3/#4/#6/#10/#12 and all-state PR search.
- PR #13 confirmed OPEN at head `56a5dfc8f05eca90a129310784b2ae511e6019e4`.
- PR #7 confirmed OPEN at head `5f9b8268a82a4bce15d076ef88b306fb8cb81254`.
- PR #11 confirmed OPEN at head `db96ccacf56466ce334d6428229a4819d18b4003`.

# What Changed

1. Fair rotation advanced from `clinical-scribe-worker` to `cyber-prep-coach`.
2. Fresh Pocket Prep / Quizlet evidence reinforces the already-tracked adaptive-study job, but does not justify a second planner/scheduler while #13 is active.
3. TryHackMe's 2026-09-15 PT2 release provides a useful category boundary: hands-on practical certification is expanding, but that is not the supported iPAS job.
4. The currently retrievable iPAS landing page and a dated 2026-09-04 external observation disagree on 115-2 discoverability. This does **not** establish removal; it strengthens #12's artifact-identity-first dry-run design.
5. No source found this round overturns the owner-approved direction: trust/release evidence first, exam fidelity/adaptive study through existing bounded scopes, no generic AI/LMS/lab expansion.
6. No new Issue or existing active scope was modified.

# Grading / scope calibration

- Legacy #4 `P2 FEATURE` language is not used here as proof of a P2 defect. Competitor personalization is an opportunity signal, not severity evidence.
- Legacy #6 `P1 Research` wording is likewise not interpreted as a confirmed P1 product defect under Issue Quality v2; the actual explanation error rate remains UNKNOWN pending independent SME runtime evidence.
- #12 remains `RESEARCH / NOT_ESTABLISHED`; unstable or inconsistent source discoverability is not the same as proven corpus corruption.
- Active PR test claims cover only their reported local paths; this radar did not re-run or independently validate them.
- No competitor claim or marketing statement is treated as independent learning-effect measurement.

# Completion / gaps / cursor

- External exploration: completed with public-web primary sources across direct certification-prep products, adjacent learning workflow, official iPAS source and a new hands-on cybersecurity certification release.
- Fresh owner inventory: completed, 41 owned / 40 unarchived.
- Current focal default branch, owner direction, current README/PRD, historical radar, existing Issues and active PR ownership: checked.
- iPAS 115-2 current direct artifact state: **UNKNOWN**. The landing-page snapshot visible to this radar conflicts with a dated independent observation; no PDF download was executed here.
- Runtime: **NEEDS_RUNTIME_VERIFICATION** for deployed/browser/device/human-SME and any 115-2 ingestion path because none was executed in this round.
- Notification threshold: **not met**. The new evidence refines and supports existing scopes; it does not create a high-value distinct product opportunity, major competitor strategy reversal, validated cross-project implementation capability, or evidence that overturns owner direction.
- Next fair-rotation target: **`Reese-max/exam-archive`**.

This radar does not declare any repository or the portfolio CLEAN.