# External Competitive / Product Inspiration Radar — 2026-09-24T14:02:30Z

Status: **COMPLETE / NO_NEW_ACTIONABLE_ISSUE / NO_USER_NOTIFICATION**

## Scope / Direction / Inventory

- Governing rule: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md` blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh GitHub inventory was paged from the connected owner account: **42 Reese-max-owned repositories / 41 unarchived**; the follow-up page after offset 100 was empty, so the current accessible inventory is exhausted rather than inferred from an older list.
- Fair-cursor continuation: `exam-archive` was rechecked first because it was the previous handoff, but a full external radar already ran on 2026-09-22 and current repository evidence did not introduce a material product delta. `police-exam-practice` was then revalidated as a compatibility/redirect surface whose README says product logic belongs in `police-exam-archive`. The first eligible product for a fresh deep pass was therefore **`Reese-max/police-exam-archive`**.
- Current product head rechecked before reporting: `master@a0b5dbb9352b5558dbe62445c6452947dbd2501b`; the latest default-branch commit is audit/docs and the current product baseline remains `fe497aa9fac7a4e4a411e663edeef6c1c5356577`.
- Owner/product-board direction from the 2026-09-22 delta remains **INVEST / SIMPLIFY / MAINTAIN**: make the existing static/local-first/PWA contract reliable before adding a learning-platform, sync, account, or generic AI-tutor architecture.

## External Signals

### A. Direct competitor: WAYDA integrated learning loop — CONFIRMED product claim

**Published 2026-09-23; checked 2026-09-24.** WAYDA announced an upgraded learner system that puts course content, chapter drills, mock exams, past papers, AI essay review, wrong-question history, favorites and score records into one flow. It also allows re-forming practice from previously wrong or favorited items.

Source: https://lino.wayda.com.tw/wayda-learning-system-upgrade/

User job reduced: after a practice session, the learner does not have to manually reconstruct what was wrong and decide where to find the next drill.

Transferable pattern: **attempt evidence -> explicit weakness/history -> next bounded practice action**. Do not copy the entire LMS/course/AI-grading stack.

This signal is materially relevant to `police-exam-archive`, but it is **not a new fingerprint**: existing #60 already owns per-question attempt history and a deadline-aware review queue; PR #66 is open on `devin/issue-60-attempt-ledger` and already has review feedback that answer outcome and manual-review marking must remain independently reconstructable. Because scope is active, this round is `SKIPPED_LOCKED` for any Issue/PR mutation.

### B. Direct/adjacent competitor: Examly personalized daily practice — CONFIRMED current capability claim

**Current product checked 2026-09-24.** Examly markets 450k+ historical questions across Taiwan exams, including a police category, and currently exposes 115-year police question pages. Its core loop is daily recommended practice, subject-level weakness views, wrong-answer review cards/spaced repetition and cross-device continuation.

Sources:
- https://examly.tw/
- https://examly.tw/library

The homepage currently advertises `99–114` as the collected-year range while individual 115 police pages are accessible. Treat this as a vendor-surface inconsistency, not an efficacy benchmark.

Transferable pattern: the next action should come from durable attempt evidence. `police-exam-archive` should remain stronger on official-source identity, explainable reason codes and local-first ownership rather than copying mandatory accounts/cloud sync or opaque weakness scores.

Decision: **no new Issue**; same root/workflow gap as #60.

### C. Police-specific smart review: WAYDA wrong-first review — CONFIRMED product claim

**Published 2026-09-05; checked 2026-09-24.** WAYDA's police sergeant-bank guide documents a wrong-question book and `智慧複習（錯題優先）` workflow.

Source: https://lino.wayda.com.tw/116-police-sergeant-online-qbank-guide/

This is stronger domain-specific market validation for #60, but not a state change that justifies touching the active PR. It also does not prove user improvement or an optimal scheduling algorithm.

### D. Official-answer freshness / correction handling — CONFIRMED source contract, no new defect

The current MOEX 115 police-exam page still exposes distinct `答案` and `更正答案` artifacts for affected papers; examples include 行政警察「警察政策與犯罪預防」、刑事警察「犯罪偵查學／刑案現場處理與刑事鑑識」、水上警察「海巡法規」 and four-level papers.

Source: https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx?e=115060&y=2026

A secondary police-exam source published 2026-08-17 enumerates 8 corrected scoring points, and a separate exam archive checked its 115 PDFs/corrections again on 2026-09-08:
- https://www.wayda.com.tw/115-police-exam-official-answer-corrections/
- https://www.kaozen.taipei/police-exam-past-papers/

Repository counter-evidence is strong: `docs/115-import-report.md` was generated 2026-08-23, records 4 official correction PDFs, states corrected answers override original standard answers, and the current data contains exact corrected values such as `A或C` and `A或C或D`. Therefore there is **no evidence of a stale-115-answer bug** in this pass.

### E. Adjacent provenance / law-grounding workflows — CONFIRMED current product claims

JumpVault now combines official-PDF identity, image/table/formula restoration, concept links and law-text citations; SoFa Engine combines statutes, questions, wrong-answer state and a return-to-weakness flow while allowing no-login practice.

Sources:
- https://www.jumpvault.tw/
- https://sofaengine.org/

Useful idea: a future law-sensitive study overlay could make current-law context explicit without rewriting historical official answers. However, this round did **not** find a concrete current-repo question where the displayed official answer is wrong solely because a later legal amendment changed the applicable rule, nor evidence that this is a top current user failure. Keep as `ADJACENT IDEA / NEEDS_EVIDENCE`, not an Issue.

## New Releases / Changes

| Date | Product | Signal | Decision |
|---|---|---|---|
| 2026-09-23 | WAYDA | Integrated course / question bank / past paper / wrong-answer / essay-feedback workflow | Market validation for existing #60; no duplicate Issue |
| 2026-09-05 | WAYDA | Police-specific wrong-first smart review | Reinforces explainable review queue; active #60/#66 owns scope |
| current 2026-09-24 | Examly | Daily recommendation, weakness cards, cross-device continuation, 115 police pages | Validate attempt->next-action pattern; do not copy cloud/account breadth |
| current 2026-09-24 | MOEX | 115 police page still exposes separate correction artifacts | Current repo import is already correction-aware; no freshness bug |

## Community Pain

No new recent community signal met the evidence bar for this round. Earlier Anki/exam-deadline backlog anecdotes already supported #60 and are not repeated as if they were new or representative prevalence data.

## Opportunity Map — police-exam-archive

| Class | Decision |
|---|---|
| MUST MATCH | official-source/question identity; corrected-answer precedence; resumable practice; truthful offline/PWA behavior |
| SHOULD BE BETTER | explainable per-question learner state and reason-coded next practice, while keeping source version identity |
| DIFFERENTIATOR | local-first/no-account official corpus + deterministic learner-state/review logic if #60 is eventually approved |
| ADJACENT IDEA | law-currentness context or corrected-answer provenance badge, only after concrete user/repo evidence |
| DO NOT COPY | mandatory cloud accounts/sync, opaque weakness scores, generic AI tutor/generated replacement questions, broad LMS/course marketplace |

## Four-Gate Decisions / Issue Mapping

### #60 Attempt Ledger / deadline-aware review

- kind: existing `OPPORTUNITY/FEATURE` concept; under v2 it should be treated as an opportunity/evidence workflow rather than evidence of a broken product.
- severity: **NOT_ESTABLISHED as a defect**; external competitor capability does not make absence a P1/P2 bug.
- decision priority: **MEDIUM/HIGH product opportunity**, subordinate to current confirmed reliability P2s and owner review.
- triage: active implementation/design PR exists; this radar does not reinterpret that as implementation authorization.
- External signals from WAYDA/Examly strengthen Strategic Fit and reuse, but do not establish population-level pain or justify a broader architecture.
- Minimum path remains local per-question event/state + deterministic reason codes + bounded today queue. No model service, cloud profile, generic SRS platform or new backend.
- **No comment/update** because PR #66 is open and owns this scope; radar stays `SKIPPED_LOCKED` for mutation.

### #58 / #61 / #69 / #74 / #75

Existing image fidelity, denominator truth, interrupted-quiz recovery and Analytics offline-contract work remain separate fingerprints. Current competitor signals do not change their severity or acceptance criteria. No scope was borrowed from active PRs #71/#72/#73.

### Correction-provenance / legal-currentness ideas

- kind: `OPPORTUNITY` / possible bounded research only.
- severity: `NOT_ESTABLISHED`.
- triage: `NEEDS_EVIDENCE`, `auto_implementation=false`.
- No Issue: current 115 correction pipeline already has source artifacts and correct final values; a user-facing correction badge or legal-currentness overlay lacks a demonstrated manual failure severe enough to open another track.

## Cross-Portfolio Ideas

One reusable principle remains valid across exam products without centralizing storage:

`source/question identity + attempt event + dataset revision -> derived reason-coded review state -> product-specific next action`

`cyber-prep-coach` may reuse semantics later, but no shared database/framework is authorized or justified here.

## Rejected / Deferred Ideas

- **Generic AI tutor / AI-generated questions:** rejected for this product direction; commodity capability does not beat the official corpus/provenance advantage.
- **Mandatory account + cloud sync:** rejected as default; Examly demonstrates a market pattern, not a requirement for a local-first static product.
- **Full LMS/course integration:** rejected; WAYDA's business model includes paid courses and teacher workflows that are not this repo's owner-approved scope.
- **Open a duplicate smart-review Issue:** rejected; #60 + open PR #66 already own the root workflow.
- **Claim 115 answer staleness from correction artifacts:** rejected by repository evidence: 2026-08-23 import consumed correction PDFs and exact corrected answer forms are present.
- **Law-version subsystem now:** deferred; no concrete current failure or minimum bounded experiment with sufficient user evidence yet.

## Sources

Checked 2026-09-24 unless an event/publication date is stated above.

1. MOEX 115 police exam source: https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx?e=115060&y=2026
2. WAYDA learning-system upgrade (2026-09-23): https://lino.wayda.com.tw/wayda-learning-system-upgrade/
3. WAYDA police smart review (2026-09-05): https://lino.wayda.com.tw/116-police-sergeant-online-qbank-guide/
4. WAYDA correction summary (2026-08-17): https://www.wayda.com.tw/115-police-exam-official-answer-corrections/
5. Examly current product: https://examly.tw/
6. Examly library: https://examly.tw/library
7. Kaozen police past papers / correction status: https://www.kaozen.taipei/police-exam-past-papers/
8. JumpVault: https://www.jumpvault.tw/
9. SoFa Engine: https://sofaengine.org/

## What Changed / Completion / Gaps / Cursor

- New external market evidence: yes — WAYDA's 2026-09-23 integrated loop and current Examly behavior provide stronger direct validation for a cumulative attempt-driven workflow.
- New root cause: **no**.
- New Issue: **0**.
- Existing Issue/PR comments or scope edits: **0**.
- Product source / CI / config / settings / branch / deploy / GOAL changes: **0**.
- Implementation authorization: **0**.
- Runtime verification performed: **none**; external/vendor claims and repository source evidence were not misrepresented as production behavior tests.
- Report is intentionally a necessary-state delta rather than a new large market report because the main opportunity is already owned by #60/#66.
- No user notification: the high-profile WAYDA 2026-09-23 signal was already surfaced in the immediately preceding police-essay radar; this product-specific mapping is new evidence for an existing #60 track, not a new notification fingerprint.
- Next fair eligible target: **`Reese-max/92-duty-scheduler`**.
