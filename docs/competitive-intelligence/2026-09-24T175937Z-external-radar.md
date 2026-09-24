# 外部競品／新品／工作流靈感雷達 — 2026-09-24T17:59:37Z

## Status / scope

- Status: **COMPLETE / MATERIAL SUPPORTING SIGNAL / NO NEW ISSUE**.
- Checked: 2026-09-25 Asia/Taipei.
- Rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`, blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh owner pagination: **42 owned / 41 unarchived / 1 archived**; page 2 empty.
- Fair-rotation focus: `Reese-max/voice-actress`, resumed from pending radar PR #93. The later PR #94 has review feedback that its cursor provenance is invalid, so it is not used to supersede #93.
- Current product HEAD: `master@b20a3f3e58b055ff27acf7cdd302d822841a119c`.
- Owner direction: **INVEST / SIMPLIFY / REPOSITION** — Traditional-Chinese Taiwan police/legal essay practice; criterion-level feedback, law/source provenance, timed practice, personal recovery and compact TTS. Do not expand community before personal-data isolation is proven.
- Existing active scopes: #14 + PR #16 personal-session isolation, #15 + PR #17 dependency security, #6 + PR #18 evidence-linked feedback. #12 handwriting research remains `NARROW / NEEDS_EVIDENCE / auto_implementation=false`.
- No product source/config/CI/settings, deployment, paid-provider or production-data change was made.

## Executive decision

**0 new Issue, 0 existing Issue/PR comment or scope update, 0 implementation authorization.**

The strongest new external evidence is WAYDA's **2026-09-23** product update. The Taiwan police/public-exam competitor now connects courses, chapter practice, mock exams, past papers, AI essay review, wrong-answer/favorite review, score history and weakness analysis in one flow. Its essay path supports typed answers or **handwritten-photo upload for AI recognition and 25-point grading**, with teacher review available in parallel.

Relative to the 2026-09-14 deep radar for `voice-actress`, this is new direct-market evidence for the exact problem tracked by #12: a learner who practices on paper should not have to retype the same answer merely to obtain feedback. It does **not** prove user-frequency, OCR correctness, privacy/cost acceptability or completion-rate impact, and therefore does not upgrade #12 from NARROW to BUILD.

Google supplied two adjacent workflow signals. On **2026-09-22**, Gemini Study Notebooks expanded to Workspace accounts with source-grounded diagnostic quizzes, personalized lessons and a mastery dashboard that recommends focus areas. On **2026-09-23**, Google Docs gained the ability to use a Gemini Notebook as in-place context with inline citations, reducing tab switching and copy/paste. For `voice-actress`, the transferable pattern is source/evidence review in the same work surface; this already maps to #6 / active PR #18, so no new connector or generic notebook feature is justified.

## External Signals

### A. Direct competitor — WAYDA handwritten essay workflow

**CONFIRMED first-party product claim**  
Published 2026-09-23; checked 2026-09-25.  
Source: https://www.wayda.com.tw/wayda-learning-system-upgrade/

User steps reduced:
- paper answer → photo upload instead of paper answer → retype → grading;
- course → practice → mock → wrong-answer review in one system instead of cross-tool tracking.

Transfer:
- keep `capture candidate != confirmed text != grading result`;
- if future real-user evidence passes, reuse existing `answerText` / grade-v2 / session truth;
- do not create a second grader or OCR database.

Do not copy:
- full LMS, teacher marketplace, course-commerce, generic OCR, or more multi-user surface while #14 remains unresolved.

### B. Adjacent workflow — Gemini Study Notebooks

**CONFIRMED first-party product capability**  
Published 2026-09-22, with exam-prep update 2026-09-18.  
Sources:
- https://workspaceupdates.googleblog.com/2026/09/study-notebooks-in-gemini-are-now-available-for-Google-Workspace-accounts.html
- https://workspaceupdates.googleblog.com/2026/09/new-back-to-school-features-and-learning-tools-available-in-Gemini-Notebook.html

Pattern: trusted sources → progress-check quiz → personalized practice → mastery/focus areas.

Decision: `ADJACENT IDEA / HOLD`. The repo already has wrong-book, SRS/cards and dashboard state; there is no current user/runtime evidence that a new adaptive-learning engine is the bottleneck.

### C. Adjacent workflow — source-in-place review

**CONFIRMED first-party product capability**  
Published 2026-09-23; checked 2026-09-25.  
Source: https://workspaceupdates.googleblog.com/2026/09/ground-ai-prompts-in-google-docs-on-existing-sources-from-Gemini-Notebook.html

Google Docs can use a Notebook directly as context and expose inline citations. The transferable value is reducing manual copy/paste while keeping claims reviewable at the point of writing. This supports existing #6 / PR #18 and is `SKIPPED_LOCKED`.

## Community Pain

No recent Taiwan police/public-exam community evidence was strong enough to establish incidence, abandonment, grading accuracy or willingness to pay. Vendor adoption does not substitute for user evidence, so no severity is raised.

## Opportunity Map

| Bucket | Decision |
|---|---|
| MUST MATCH | #14 personal-session isolation; grading provenance; learner-history recovery without identity mixing |
| SHOULD BE BETTER | #6 criterion→exact answer evidence + law/source; #12 paper→reviewed transcript if real-user evidence supports it |
| DIFFERENTIATOR | Taiwan police/legal essay depth + answer revision + reviewable evidence + exam-shaped 22×25×2 practice + compact TTS |
| ADJACENT IDEA | reuse existing wrong-book/SRS/grade evidence to propose a bounded next focus |
| DO NOT COPY | generic LMS, course marketplace, teacher marketplace, generic OCR, generic notebook, cloud/account expansion, provider/model breadth |

## Four-Gate decisions

### Handwritten photo → AI grading

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`

Gate 1: the retyping breakpoint is already proven in repo structure and tracked by #12; WAYDA adds market feasibility, not user-frequency evidence.

Gate 2: no P2/P1 promotion. Competitor capability alone is not a product failure.

Gate 3: smallest next research remains a few anonymous/explicitly-authorized real 22×25 handwriting photos: candidate transcript → full side-by-side correction → explicit confirmation → existing `answerText`. Do not build OCR service/database/camera app first.

Gate 4: #12's 2026-09-15 synthetic experiment concluded NARROW. WAYDA does not replace the missing real-handwriting/mobile/privacy evidence.

**Result: DEDUPED → #12 / no Issue update.**

### Source-in-place evidence

Google's Docs/Notebook pattern maps to #6; PR #18 is active.

**Result: DEDUPED → #6 / SKIPPED_LOCKED.**

### Integrated adaptive learning

WAYDA/Gemini show attempt → weakness → next practice. Existing local state already covers parts of this job and current correctness/privacy work is higher priority.

**Result: OPPORTUNITY / NOT_ESTABLISHED / LOW / HOLD.**

## Rejected Ideas

- Immediate implementation of #12: missing real handwriting/mobile/user evidence.
- Generic OCR/camera platform: outside approved scope.
- Teacher-review marketplace/full LMS: scope, identity and operations expansion.
- Second 25-point grader because a competitor has one: existing provenance/evidence correctness comes first.
- Generic adaptive engine: first prove a real next-step bottleneck using existing learner state.
- Workspace/Gemini connector: the transferable need is review-in-place, already owned by #6.

## Issue Mapping / coordination

- #14 / PR #16: active P0 personal-session isolation. No takeover.
- #15 / PR #17: active dependency-security fix. No scope change.
- #6 / PR #18: active evidence-linked grading. Google source-in-place signal is supporting evidence only.
- #12: open; synthetic experiment result remains NARROW. WAYDA is new external evidence but does not change triage or exit conditions, so no comment is added.
- No existing Issue/shared-state write occurred; no issue lock was required.

## Sources

1. WAYDA, 2026-09-23 — https://www.wayda.com.tw/wayda-learning-system-upgrade/
2. Google Workspace Updates, 2026-09-22 — https://workspaceupdates.googleblog.com/2026/09/study-notebooks-in-gemini-are-now-available-for-Google-Workspace-accounts.html
3. Google Workspace Updates, 2026-09-18 — https://workspaceupdates.googleblog.com/2026/09/new-back-to-school-features-and-learning-tools-available-in-Gemini-Notebook.html
4. Google Workspace Updates, 2026-09-23 — https://workspaceupdates.googleblog.com/2026/09/ground-ai-prompts-in-google-docs-on-existing-sources-from-Gemini-Notebook.html

## What Changed

- New direct-market evidence: WAYDA now supports handwritten-photo essay AI grading in the same Taiwan police/public-exam market.
- No new root cause: it maps to existing #12.
- New adjacent distribution/workflow: Gemini Study Notebooks expanded to Workspace with source-grounded assessment and focus-area guidance.
- New source-in-place pattern: Notebook context in Docs; maps to #6.
- Current priority remains #14 personal-data isolation before growth/feature expansion.
- Fair cursor is reconciled from PR #93 rather than divergent PR #94.

## Completion / gaps / cursor

- Fresh inventory: complete.
- Rule blob: verified.
- Owner direction / default HEAD / Issues / recent all-state PRs / branches / relevant comments: checked.
- External A/B/C: completed with first-party sources.
- New Issues: 0.
- Existing Issue/PR comments: 0.
- Implementation authorization: 0.
- No new runtime/provider/user-study evidence was created.
- Portfolio CLEAN: not declared.
- Same WAYDA 2026-09-23 signal was already recorded in pending radar PR #82; this run is a repo-specific remap and does not create a duplicate owner notification.
- **Next fair eligible product: `Reese-max/taiwan-intel-dashboard`.**
