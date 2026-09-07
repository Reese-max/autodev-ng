# External Competitive / Product Inspiration Radar — 2026-09-08 r2

> Scope: all Reese-max owned, non-archived repositories visible to the connected GitHub installation. Public web outside Reese-max GitHub is the primary research source. Repository, Issue, PR and recent-commit evidence is used to resolve product identity, readiness, duplication and safety. `COMMUNITY_SIGNAL` items are anecdotal and are not market-share, efficacy or incident-rate claims.

## Executive Summary

This round produced **one new high-confidence product opportunity** and several deliberate no-duplicate/defer decisions.

1. **`police-exam-archive #60` — persist a per-question Attempt Ledger and turn it into a deadline-aware “today review” queue.** The current mock-exam engine can identify wrong/unanswered/marked questions during the session, but `saveHistory()` discards that detail and persists only aggregate score/time. External learning products increasingly use prior attempts to decide the next practice action, while current exam-prep community discussions show that generic spaced-repetition backlogs can consume study time or place reviews after the actual exam. This repository already owns 42,518 official historical questions and a local-first quiz surface, so the strongest next step is **not** generated AI questions; it is to make official-question practice cumulative, explainable and exam-deadline aware. **Classification: DIFFERENTIATOR / P2. Opportunity Score: 93/100.**
2. **No new issue for `cyber-prep-coach`.** Its existing #4 already owns the broader mastery-profile / next-best-study-action direction. The new police-exam opportunity should reuse compatible learner-state concepts, not create another opaque recommendation engine.
3. **No new issue for `police-exam-practice`.** It is explicitly a compatibility/redirect surface after fusion into `police-exam-archive`; product logic belongs in the archive repo.
4. **No new generic AI Tutor issue.** Quizlet, NotebookLM/Gemini Notebook and ChatGPT Study Mode show a market shift toward guided practice, source grounding and repeated understanding checks, but copying generic chat would dilute the corpus advantage. The reusable principle is **attempt → reasoned next action → grounded practice → updated attempt evidence**.

The strongest cross-portfolio conclusion is:

> **For learning products, a score is not durable learning state. Keep the raw attempt evidence, derive an explainable next action, and make the schedule aware of the user’s real deadline and available capacity.**

This extends prior radar principles around source provenance, candidate/authoritative state, explicit activation and stale invalidation.

---

## Product → Market Category / Opportunity Map

| Repository | Category | Classification this round | Current decision |
|---|---|---|---|
| gemini-deidentifier | AI RPG / interactive fiction | DIFFERENTIATOR | Existing #30 world-state consequence ledger remains the correct next layer |
| exam-archive | Exam archive / public reference | MUST MATCH | Keep archive role narrow; provenance/performance/accessibility before personalization |
| police-exam-practice | Legacy police-exam practice entry | MERGE / DO NOT DUPLICATE | Formal product logic belongs in `police-exam-archive` |
| **police-exam-archive** | Official police-exam corpus + search/quiz/analytics | **DIFFERENTIATOR** | **NEW #60 Attempt Ledger + deadline-aware review queue** |
| 92-duty-scheduler | Constraint-based scheduling | DIFFERENTIATOR | Existing #19 explainable repair plans remains high-value |
| openab | Discord ↔ ACP remote coding-agent broker | MUST MATCH / SECURITY | Human approval broker remains important; Issues disabled |
| UkePack | MusicXML → practice pack | SHOULD VALIDATE | Teacher Beta evidence before interactive-player breadth |
| ppt-studio | AI presentation workstation | DIFFERENTIATOR | Existing claim/source provenance is more valuable than connector breadth |
| book5-windows-server-2022 | Static learning/course deck | SHOULD SIMPLIFY | Accessibility and active-learning navigation before AI generation breadth |
| obsidian-vault | Personal knowledge repository | ADJACENT IDEA | Interop only where it removes concrete copy/paste |
| voice-actress | Essay grading/coaching | MUST VERIFY THEN IMPROVE | Persisted attempt/feedback concepts may later reuse learner-state primitives |
| taiwan-intel-dashboard | Paused intelligence dashboard | DO NOT ADD NOW | Reliability/recovery remains dominant |
| autodev-ng | Multi-agent delivery orchestrator | SHOULD BE BETTER | Keep evidence/promotion gates; no more-agent quota |
| flux-image-gen | AI image generation/edit workspace | DIFFERENTIATOR | Existing provenance receipt work is active |
| claude-mem | Upstream memory fork | UPSTREAM FORK | Track upstream unless deliberate product divergence is declared |
| lobsterpulse | AI coding CLI monitor | SHOULD BE BETTER | Existing observability/runtime work already covers current external direction |
| prompt-autoresearch | Prompt optimization/evaluation | RESEARCH_REQUIRED | Existing variance-aware promotion gate remains active |
| neciken-summer-poem | AI literary workflow | MUST FIX | CI/reliability before expansion |
| note-filler | Evidence-grounded legal/admin augmentation | DIFFERENTIATOR | Existing claim Verify/Accept/Reject workflow remains correct |
| gooaye | Empty placeholder | N/A | Define product purpose or archive |
| lplrs-judicial-sync | Judicial data synchronization | MUST MATCH / PRIVACY | Existing erasure/tombstone work; no duplicate |
| adng-memory | Operational memory/state store | RESEARCH_REQUIRED | Existing lifecycle receipt / activation contract progressing |
| cyber-prep-coach | iPAS exam preparation | DIFFERENTIATOR | Existing #4 mastery profile is the broader learner-model owner |
| cf-ai-router | AI provider router | RESEARCH_REQUIRED | Current capability/reliability and Responses research first |
| avatar-vfo | AI persona simulation | MUST VERIFY THEN EXPAND | Runtime/security evidence before memory/voice expansion |
| project-doctor-web | Clinical teaching/research UI | DO NOT ADD NOW | Safety/runtime defects dominate |
| minideck | AI deck generator/share workflow | MUST MATCH | Existing #4 draft head ≠ published head |
| chatgpt-dual-pipeline | Internship-note publishing product | SHOULD SIMPLIFY | Source-of-truth and identity handoff first |
| internship-notes-sites-mirror | Publication mirror | N/A | Keep mirror role narrow |
| taichung-police-intel | Public-sector intelligence monitor | DIFFERENTIATOR | Existing role/unit profile remains high-value |
| soundbox-offline | Local-first music library/PWA | DIFFERENTIATOR | Existing same-LAN import work remains active |
| skill-foundry | Agent Skill creation/certification | DIFFERENTIATOR | Runtime compatibility / negative-transfer evidence is active |
| video-timeline-pipeline | Video intelligence pipeline | DIFFERENTIATOR | Research Packs should reuse existing roadmap/state owners |
| ai-novel-workstation | Long-running AI writing workstation | DIFFERENTIATOR | Context Manifest implementation is already progressing |
| clinical-scribe-worker | Clinical scribe/evaluation | RESEARCH_REQUIRED / SAFETY | Specialty validation packs are already progressing |
| MaterialYouNewTab | Local-first new-tab productivity | DO NOT BLOAT | Privacy/speed/minimalism remain product advantage |
| cf-mcp-server | Cloudflare MCP server | MUST MATCH | Protocol/conformance migration remains current priority |
| tick-stock-panel | Taiwan stock monitoring/simulation | MUST MATCH + RESEARCH | Coverage truth before natural-language strategy compiler |
| herdr-skills | Multi-agent workflow skills | SHOULD BE BETTER | Reuse Skill Foundry evidence semantics |
| ninax-line-hermes | LINE + long-running video-summary workflow | MUST MATCH / RELIABILITY | Revision-aware input lifecycle is already progressing |

---

## External Signals

### A. Direct learning-product signal — prior attempts are becoming the input to the next practice action

**CONFIRMED PRODUCT DIRECTION — Quizlet Learn, current product page, retrieved 2026-09-08**

Quizlet Learn describes a workflow that uses a learner’s previous study behavior to identify difficult material and focus subsequent practice on what needs more work. Its product design is session-oriented rather than “show me one aggregate score and forget the details.”

Source: https://quizlet.com/features/learn

**CONFIRMED PRODUCT DIRECTION — Quizlet AI Practice Test, current product page, retrieved 2026-09-08**

Quizlet’s practice-test flow explicitly returns strengths/weaknesses after the test so the result can inform what to practice next. The transferable principle is not AI question generation; it is **a completed practice run changes the next run**.

Source: https://quizlet.com/features/ai-test-generator

**Repository implication:** `police-exam-archive` currently has the necessary raw facts during `finishQuiz()` but loses them when `saveHistory()` persists only aggregate results. Persisting per-question attempts is a prerequisite for any credible cumulative practice workflow.

### B. Adjacent workflow — spaced review systems manage a queue, but exam products need a deadline/capacity layer

**CONFIRMED ADJACENT — Anki FSRS Helper, current plugin page retrieved 2026-09-08**

FSRS Helper packages review-history-based rescheduling, load balancing, break scheduling and future-workload shaping. The important transferable pattern is that a review system maintains an executable queue over time instead of treating every session as independent.

Source: https://ankiweb.net/shared/info/759844606

**COMMUNITY_SIGNAL — exam-date mismatch, 2025-12-30 / still relevant in 2026**

An Anki user explicitly asked for a way to reschedule reviews before an exam because cards were being scheduled months after the exam would finish. This is anecdotal, but it captures a product distinction: long-term retention optimization and deadline-constrained exam preparation are not identical objectives.

Source: https://www.reddit.com/r/Anki/comments/1pzwn42/is_there_any_anki_plugin_to_reschedule_for_exam/

**COMMUNITY_SIGNAL — review-volume pressure, 2026-08**

Recent medical-school/Anki discussions describe hundreds to thousands of daily reviews crowding out practice questions or other study methods. These posts do not establish an optimal study method, but they are useful evidence that “more due items” is not itself a good product outcome; a review product should expose workload/capacity and allow prioritization.

Representative sources:
- https://www.reddit.com/r/medicalschool/comments/1vt2168/feel_like_ive_been_psyopped_into_ankiing_and_i/
- https://www.reddit.com/r/medicalschoolanki/comments/1vvdro4/is_unsuspending_300_new_cards_per_day_a/
- https://www.reddit.com/r/medicalschoolanki/comments/1vlzkgc/what_is_your_new_card_limit/

**Transferable principle:** a police-exam review queue should accept an explicit exam date and daily question/time budget, then display overload honestly rather than silently scheduling important review after the deadline.

### C. Emerging AI-study workflow — guided, source-grounded practice is becoming a general-purpose product primitive

**CONFIRMED — Florida State University + NotebookLM, 2026-06-22**

FSU describes NotebookLM as a 24/7 study support surface that creates quizzes, flashcards and study guides while remaining grounded in specific course materials. The useful product principle for Reese-max is **trusted source → practice → repeated understanding**, not “add an unconstrained AI tutor.”

Source: https://blog.google/products-and-platforms/products/education/florida-state-university-notebooklm/

**CONFIRMED — ChatGPT Study Mode, current documentation updated 2026-09-08**

Study Mode supports exam preparation, notes/readings, practice questions, flashcard-style review, step-by-step reasoning and explaining why an answer is correct or incorrect. It also invites the learner to provide a test date/deadline and study constraints.

Source: https://help.openai.com/en/articles/11780217-using-study-mode-in-chatgpt

**Transferable principle:** generic AI already handles explanation and guided questioning. A specialized police-exam product should differentiate with official-source identity, historical-question provenance, cumulative attempt history, deadline-aware selection and deterministic reason codes.

---

## Recent Repository Changes Considered

- **`police-exam-archive`:** the current default branch remains a source-fidelity-first product with 42,518 questions, full-text search, quiz and analytics. The open PR #59 is actively repairing the four image-choice questions through category/search/quiz/PDF export, but it is not yet merged and still requires human approval + merged/public verification. New #60 explicitly treats unresolved image fidelity as a dependency, not a learner failure.
- **`ai-novel-workstation`:** PR #3 is already implementing the prior Context Manifest recommendation with deterministic selection and frozen-manifest evidence. No follow-on memory feature was created this round.
- **`skill-foundry`:** PR #2 is already implementing the prior runtime compatibility / negative-transfer gate. No generic “more agent compatibility” issue was added.
- **`adng-memory`:** PR #5 now contains the prior deterministic lifecycle receipt contract and replay oracle. The remaining gap is external writer runtime enforcement, not another schema proposal.
- **`ninax-line-hermes`:** PR #2 implements versioned LINE message heads and stale-summary suppression; real host-Hermes/LINE canary remains pending. No duplicate reliability issue was added.
- **`clinical-scribe-worker`:** PR #5 implements specialty-scoped synthetic safety packs, but real provider/runtime and governed real-world validation remain outstanding. No clinical feature expansion was added.

These progress signals matter because competitive radar should move to the next unsolved workflow rather than repeatedly reopening the same idea.

---

## New Releases / Changes Worth Tracking

| Date | Product/ecosystem | Change / signal | Reese-max relevance |
|---|---|---|---|
| 2026-09-08 current docs | ChatGPT Study Mode | Guided exam prep, practice questions, explanations, deadline-aware prompt context | exam products: generic tutoring is commoditizing; corpus/state differentiation matters more |
| 2026-08-19 | medical-school community | Review workload crowding out other practice | exam products: expose review capacity and prioritize, do not optimize only for queue completion |
| 2026-08-12/22 | medical-school Anki community | Hundreds/thousands of daily reviews viewed as unsustainable by some users | deadline/capacity-aware queue is a useful workflow signal |
| 2026-06-22 | FSU + NotebookLM | Source-grounded quizzes/study guides at institutional scale | trusted-source practice loop validates source-first differentiation |
| current 2026 | Quizlet Learn / Practice Test | Prior behavior and test result feed the next study action | police-exam: persist per-question attempts instead of aggregate-only history |
| current 2026 | Anki FSRS ecosystem | Review-history-based queue/rescheduling and load controls | useful adjacent design, but exam deadline must be a separate constraint |

---

## Community Pain Points

These are `COMMUNITY_SIGNAL` only.

### 1. Review queues can become the work instead of supporting the goal

Users in recent medical-school communities describe large daily review loads consuming hours and reducing time available for question banks or other learning methods. This does not prove that spaced repetition is ineffective; it demonstrates that an interface that optimizes only for “clear every due item” can conflict with a learner’s actual deadline and time budget.

### 2. Generic spacing may schedule useful review after the exam

A recurring exam-prep complaint is that a long-term scheduler can produce intervals that make sense for retention but not for a fixed test date. A specialized exam product has information generic SRS may not: official exam scope, subject coverage, question provenance and the user’s target test date.

### 3. Aggregate scores hide the actionable failure

A learner seeing “72%” after a mock exam still has to manually rediscover which official questions were wrong, which were skipped and whether they have already corrected them. The current repository literally discards this actionable detail after the session, so this is a concrete product friction rather than a speculative feature gap.

---

## Adjacent Ideas

### 1. Shared `AttemptLedger` primitive across exam products

A reusable minimal envelope:

```text
question/source identity
+ attempt timestamp
+ outcome
+ chosen answer / uncertainty marker
+ dataset/source version
+ practice mode
        ↓
derived review state / reason codes
        ↓
product-specific queue policy
```

Best fits: `police-exam-archive`, `cyber-prep-coach`, later `voice-actress`/other coaching products where the “item” may be an essay rubric dimension rather than a multiple-choice question.

Do not centralize all products into one database yet. Share semantics/schema/reason codes first; storage can remain local to each product.

### 2. Deadline + capacity as a first-class planning constraint

Reusable rule:

```text
remaining evidence of weakness
+ days to deadline
+ daily capacity
        ↓
feasible plan OR explicit overload
```

The important output is sometimes **“you cannot fit all reviews before the exam under this budget”**, not an optimistic schedule.

### 3. Grounded explanation, not generated replacement questions

Use official questions as the authoritative practice objects. If AI explanation is added later, it should reference the exact question/source and never replace answer fidelity or fabricate official wording.

### 4. Learner-state invalidation on dataset change

If an OCR correction, official answer correction, image restoration or question normalization changes the content identity, old attempts may no longer mean exactly the same thing. Learner state should therefore inherit the portfolio-wide `CURRENT / STALE / REVIEW_REQUIRED` lifecycle rather than silently attaching old results to revised content.

---

## Opportunity Map

### High-value / actionable now

| Opportunity | Classification | Main repo(s) | Score | Action |
|---|---|---|---:|---|
| Per-question Attempt Ledger + deadline-aware official-question review queue | DIFFERENTIATOR | police-exam-archive | **93/100** | **NEW Issue #60 created** |
| Shared learner-state semantics/reason codes | ADJACENT / REUSE | police-exam-archive, cyber-prep-coach, police-exam-practice | 88/100 | Reuse concepts; no central-platform issue yet |
| Source-version invalidation of learner state | MUST MATCH | exam products | 87/100 | Include in #60/#4 acceptance, not a separate issue |

### Existing high-value work; do not duplicate

- `cyber-prep-coach #4`: local mastery profile + explainable adaptive today task.
- `police-exam-archive #58` / PR #59: image-choice fidelity; learner system must not score an unrenderable question as a user failure.
- `ppt-studio #3`: claim-level source provenance.
- `taichung-police-intel #12`: role-based intelligence profile.
- `skill-foundry #1`: runtime compatibility / negative transfer.
- `adng-memory #4`: memory activation/staleness/deletion lifecycle.
- `minideck #4`: draft/public authority separation.

### Medium / later

- **`book5-windows-server-2022` — source-grounded self-check questions**: only after accessibility/reading-order/runtime gates are clean. Existing static slide content could generate a small deterministic review index, but there is insufficient evidence to justify AI generation or a new quiz engine now.
- **`voice-actress` — feedback-to-next-practice loop**: potentially reuse AttemptLedger semantics once current grading persistence/calibration is verified; do not create a second mastery engine now.
- **`exam-archive` — archival study affordances**: keep it primarily reference/provenance. If practice demand appears, reuse `police-exam-archive` components rather than duplicating logic into every archive.

---

## Top 10 Cross-Portfolio Ideas

1. **Raw attempt/event evidence before derived score.** A summary percentage is a projection, not the durable source state.
2. **Reason-coded next action.** Recommendations should say `last_wrong`, `due`, `coverage_gap`, `deadline_pressure`, etc., not just output opaque ranking numbers.
3. **Deadline + capacity feasibility.** Planning products should be allowed to report overload rather than manufacture a complete plan.
4. **Versioned source identity.** Any learner state tied to a question/source should stale when the authoritative content changes materially.
5. **Shared semantic contracts, not premature shared infrastructure.** Reuse learner-state shapes/reason codes across exam products without forcing one storage service.
6. **Working head ≠ authoritative head.** Continue applying draft/current vs published/accepted/active boundaries across content and state products.
7. **Proposal ≠ activation.** AI suggestions, memories, provider routes and generated study actions still require deterministic policy/gates where consequences matter.
8. **Receipt-driven portability.** Export/import should carry the evidence needed to reconstruct derived state, not only final UI settings.
9. **Local-first where cloud identity adds no value.** The exam products can gain persistence/personalization without accounts by storing versioned learner state locally.
10. **Do not compete with generic AI where specialized data is the moat.** Chat/quiz generation is broadly available; official-source fidelity + longitudinal user evidence is harder to commoditize.

---

## Ideas Rejected / Deferred

### DO NOT COPY — generic AI question generation into `police-exam-archive`

The repository already owns a large official corpus. Generating substitute “police-exam-like” questions risks lowering source fidelity and introduces a separate correctness problem. If ever explored, it should be explicitly labeled synthetic and evaluated independently; it is not part of #60.

### DEFER — direct FSRS implementation

FSRS is valuable evidence that scheduling can be history-aware, but a police-exam product has a fixed deadline and official coverage requirements. Start with a deterministic, inspectable heuristic and replay fixtures. Only adopt a more complex memory model after real learner-state data shows the need.

### DO NOT ADD — cloud account/sync just to persist practice history

Current product architecture is static/local-first. A versioned local ledger with export/import solves the first-value problem with much less privacy, authentication and operational complexity.

### DO NOT DUPLICATE — separate learner engine in `police-exam-practice`

The repository README states it is now a compatibility redirect to `police-exam-archive`. New product logic there would recreate the divergence the fusion was meant to remove.

### DEFER — AI tutor expansion in `book5-windows-server-2022`

The deck is still a hand-maintained static artifact with explicit accessibility/publication checks. Adding tutoring/generation before validating the base learning flow is feature bloat.

---

## Issue Mapping

### NEW

- **`Reese-max/police-exam-archive #60`** — `[Competitive Inspiration][FEATURE] 以逐題 Attempt Ledger 驅動考前截止日複習佇列，而不是只保存總分`
  - Fingerprint: `police-exam-archive + quiz attempts + aggregate-only local history + per-question errors/uncertainty discarded + no deadline-aware review queue`
  - Evidence: current `quiz-engine.js` + Quizlet/NotebookLM/Study Mode/Anki workflow signals + recent community workload/deadline pain.
  - Runtime state: `NEEDS_RUNTIME_VERIFICATION`.

### DUPLICATE AVOIDED / REUSE

- `cyber-prep-coach #4`: already owns mastery-profile / next-best study action.
- `police-exam-practice`: product logic intentionally fused into archive; no issue.
- `police-exam-archive #58` / PR #59: image fidelity is related but distinct; #60 depends on it rather than duplicating it.

### ISSUE WRITE BLOCKED

- None this round.

---

## Sources

### Direct / official product sources
- Quizlet Learn — https://quizlet.com/features/learn — retrieved 2026-09-08.
- Quizlet AI Test Generator / Practice Test — https://quizlet.com/features/ai-test-generator — retrieved 2026-09-08.
- OpenAI Study Mode — https://help.openai.com/en/articles/11780217-using-study-mode-in-chatgpt — current documentation, retrieved 2026-09-08.
- Florida State University / NotebookLM — https://blog.google/products-and-platforms/products/education/florida-state-university-notebooklm/ — published 2026-06-22.
- Anki FSRS Helper — https://ankiweb.net/shared/info/759844606 — current plugin page, retrieved 2026-09-08.

### Community signals — anecdotal only
- Exam-date rescheduling pain — https://www.reddit.com/r/Anki/comments/1pzwn42/is_there_any_anki_plugin_to_reschedule_for_exam/ — 2025-12-30.
- Review workload / practice-question tradeoff — https://www.reddit.com/r/medicalschool/comments/1vt2168/feel_like_ive_been_psyopped_into_ankiing_and_i/ — 2026-08-19.
- 300 new cards/day sustainability — https://www.reddit.com/r/medicalschoolanki/comments/1vvdro4/is_unsuspending_300_new_cards_per_day_a/ — 2026-08-22.
- New-card/review workload — https://www.reddit.com/r/medicalschoolanki/comments/1vlzkgc/what_is_your_new_card_limit/ — 2026-08-12.

### Reese-max repository evidence
- `police-exam-archive/README.md` — official corpus/product identity and 42,518-question scale.
- `police-exam-archive/考古題網站/js/quiz-engine.js` — current random selection, in-memory wrongList/marked state, aggregate-only `saveHistory()`.
- `police-exam-archive #58` + PR #59 — image-choice fidelity dependency.
- `cyber-prep-coach #4` — existing local mastery / next-action work; duplicate avoided.
- `police-exam-practice/README.md` — compatibility entry fused into `police-exam-archive`; duplicate product logic rejected.

---

## What Changed Since Last Radar

Previous 2026-09-08 radar centered on **working head vs authoritative/published head** (`minideck`) and **canonical consequence state vs generative narration** (`gemini-deidentifier`). This round moves to a different product family—learning systems—and identifies a parallel lifecycle problem:

```text
one-off quiz result
        ↓
raw per-question Attempt Ledger
        ↓
versioned derived Review State
        ↓
deadline + capacity + coverage policy
        ↓
explainable Today Queue
        ↓
new attempts
        ↺
```

The new design principle is therefore:

> **A completed session should change future behavior through durable, source-versioned evidence—not merely produce a score card.**

This is a genuinely new cross-portfolio primitive rather than a restatement of the previous publication/provenance findings. It can later be reused by `cyber-prep-coach`, `voice-actress` and other coaching products while keeping each product’s domain-specific selection policy separate.