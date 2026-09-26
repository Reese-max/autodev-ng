# External Competitive / Workflow Radar — police-exam-archive

- Run UTC: 2026-09-24T05:57:39Z
- Focal repository: `Reese-max/police-exam-archive`
- Current default: `master@a0b5dbb9352b5558dbe62445c6452947dbd2501b`
- Product baseline beneath audit-only HEAD: `fe497aa9fac7a4e4a411e663edeef6c1c5356577`
- Governing rule: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Governing rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh owner inventory: 42 Reese-max-owned repositories / 41 unarchived / 1 archived (`obsidian-vault`); repository-search page 2 empty.
- Fair-cursor provenance: open radar PR #89 handed off from `exam-archive`; `police-exam-practice` was freshly revalidated there as a compatibility-only redirect, so this run continues at `police-exam-archive`.
- Status: `NO_NEW_ACTIONABLE_FINDING / REPORT_ONLY`
- New Issues: 0
- Existing Issue/PR comments or scope mutations: 0
- Implementation authorization: 0
- Runtime execution performed by this radar: 0
- Portfolio CLEAN declaration: none

## Direction and current evidence

Owner-approved product direction remains **INVEST / SIMPLIFY / MAINTAIN**. The 2026-09-22 product-board decision explicitly puts existing PWA/offline truth and current trust/recovery defects ahead of account systems, cloud sync, LMS breadth, marketplaces, or generic AI tutoring.

The current default branch has not changed since that decision. Current priority evidence already includes independent P2 tracks for image-answer fidelity (#58), corpus-denominator truth (#61), interrupted mock-exam recovery (#69), Analytics code/data cache cohort consistency (#74), and first-offline Chart.js availability (#75). Those are not displaced by competitor breadth.

The previously identified learning-workflow opportunity is #60: completed quiz history currently collapses into aggregate score/time, while the proposed research/product shape preserves per-question attempts and derives a deterministic local review queue. PR #66 is an active design branch for that exact scope; related radar evidence is therefore `SKIPPED_LOCKED` rather than used to rewrite the Issue or seize ownership.

## External Signals

### A. Direct competitor — WAYDA integrated exam-prep loop

**CONFIRMED — 2026-09-23; checked 2026-09-24**

Source: https://www.wayda.com.tw/wayda-learning-system-upgrade/

WAYDA now packages courses, chapter practice, mock exams, past papers, AI essay marking, wrong-answer records and learning history into one Taiwan police/civil-service exam-prep flow. It also allows rebuilding mock tests from conditions such as previous wrong answers or saved questions.

**User job:** after a test, return to the exact material that still needs work without manually reconstructing a study list.

**Transferable pattern:** the useful signal is not “add AI grading”; it is the closed loop from attempt evidence → identifiable weak material → next bounded practice action.

**Do not copy:** course marketplace/LMS breadth, paid-account coupling, AI essay grading, teacher marketplace, or cloud learner profile. Those are outside the current owner-approved product shape and add privacy/cost/maintenance surface without evidence that they solve the current bottleneck.

This signal is not new relative to radar PR #84 and does not justify a new Issue.

### B. Adjacent product — Break the Test repair set

**CONFIRMED — 2026-09-16; checked 2026-09-24**

Source: https://breakthetest.app/whats-new

After a practice test, Break the Test now takes the skill missed most and places a short “repair set” of different questions on the home screen until completed. The same changelog also reports:

- **2026-09-23:** full ACT practice tests were promoted into normal practice/home navigation because requiring users to know a hidden URL made the capability hard to discover.
- **2026-09-21:** users may connect an AI assistant to selected study-data categories with granular permissions and revoke access later.
- **2026-09-13:** app updates wait until the learner is not mid-question, or ask before reloading, to avoid losing the active drill state.

**User job:** convert a just-completed practice session into the next small action without copying scores into another tool or re-finding weak topics manually.

**Transferable pattern:** short deterministic follow-up from the last attempt, visible reason for why it appears, and preservation of in-progress state during updates.

**Repository mapping:**
- repair-set / weakest-skill follow-up → existing #60 / active PR #66;
- preserving mid-question state across interruption/update → existing #69 / active PR #73;
- discoverability of full tests → useful design reminder, but no current repository evidence establishes a comparable hidden-entry failure;
- external AI access to learner data → `DO NOT COPY` for current scope because it introduces a new data-sharing/authority surface and no local need is established.

No new root cause emerges from these signals.

### C. Authoritative source — Taiwan Ministry of Examination

**CONFIRMED — official 115 police examination answer sheet dated 2026-06-15; checked 2026-09-24**

Sources:
- https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?code=115060&t=A
- https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx?e=115060&y=2026

The current MOEX query surface still exposes the 115 police/general-police examination papers and standard answers as the authoritative source. No new correction or authority change was found in this run that would invalidate the repository's current source strategy.

**Transferable implication:** freshness/provenance remains more defensible than generated-question breadth. A new feature should not dilute the requirement that every official-question learning action remains traceable to the source corpus/version.

## New Releases

The only material 24-hour delta worth preserving is Break the Test's 2026-09-23 discoverability change. It improves access to an existing practice capability rather than adding a new learning model. No repository evidence currently shows that `police-exam-archive` has an equivalent hidden-only core route, so this remains a design observation, not an Issue.

WAYDA's 2026-09-23 upgrade is a meaningful market release but was already captured in radar PR #84; it is not treated as a new signal merely because this rotation reached the same product again.

## Community Pain

No new community source met the evidence threshold for a repository-specific decision in this run. The radar does not infer prevalence from isolated learner complaints and does not use competitor marketing as proof of learning outcomes.

## Adjacent Ideas

1. **Post-test repair set using existing official corpus** — narrow variant of #60: after submission, present a small, deterministic set of different official questions tied to the weakest observed topic/reason code. This avoids copying scores into another tool and avoids immediately repeating the same test item. It remains research/design context while #60/PR #66 are active.
2. **Update-safe active-session preservation** — Break the Test's update behavior independently supports the user value behind #69, but #69 already has a dedicated recovery root cause and PR #73. No second Issue.
3. **Practice discoverability check** — if future runtime/usability evidence shows important practice modes are only reachable by memorized URL or obscure navigation, solve it locally in navigation before inventing a dashboard or recommendation engine. Current evidence is insufficient to file.

## Opportunity Map

| Category | Current decision |
|---|---|
| MUST MATCH | Official-source fidelity; current corpus/source truth; core PWA/offline contract; safe recovery from interruption where already promised. Existing #58/#61/#69/#74/#75 cover current actionable gaps. |
| SHOULD BE BETTER | Turn completed official-question attempts into a clear, local, deterministic “what next” action with reason codes, without requiring account/cloud state. Existing #60 owns this opportunity. |
| DIFFERENTIATOR | MOEX-source provenance + local-first/no-account workflow + explicit reason/state truth instead of opaque AI mastery or synthetic pass probability. |
| ADJACENT IDEA | A short post-test repair set made from different official questions; only after #60 evidence/design review and without creating a second learner-state system. |
| DO NOT COPY | Generic AI tutor, AI-generated exam questions as default, LMS/course marketplace, cloud learner profile, external AI data-sharing permissions, account/sync infrastructure without validated demand. |

## Cross-portfolio ideas

No new cross-portfolio capability passes the Gate. The general pattern “source identity/currentness → bounded candidate/next action → explicit user authority → truthful state” is already present across owner products; this run provides no evidence that a new shared framework/service is warranted.

## Rejected Ideas

- **Create a new `[FEATURE] Repair Set` Issue:** rejected as duplicate scope. The validated workflow gap is already #60, and PR #66 actively designs the per-question attempt/review model.
- **Add AI tutor because WAYDA/Break the Test expose AI-related capability:** rejected. Competitor existence is not value evidence; current owner direction explicitly favors official-source/local-first trust and existing reliability blockers.
- **Build a generic learner-state backend/account system:** rejected. The minimum viable shape can reuse current browser-local data and existing quiz engine; no cross-device requirement has been established.
- **Promote #60 to P2/P1 because competitors implemented related workflows:** rejected. #60 remains an opportunity/research track; external adoption does not prove a current supported-flow defect in this product.
- **Open a new update-interruption Issue:** rejected as same user-level recovery problem already tracked by #69 and actively implemented in PR #73.

## Four-Gate Decision

### 1. Problem / value

There is credible market validation for closing the loop between a completed practice attempt and the next focused practice action. However, the repository already has #60 for the relevant supported product opportunity, and no new current-default defect was established by the fresh external evidence.

### 2. Priority

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
evidence: EXTERNAL_CONFIRMED + REPO_SCOPE_ALREADY_TRACKED
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime: NEEDS_RUNTIME_VERIFICATION
```

This does not outrank the currently established P2 reliability/trust work. No competitor feature, marketing claim, synthetic persona count or arbitrary score is used to inflate severity.

### 3. Minimum solution

If #60 later receives owner approval beyond research/design, the smallest useful increment is to reuse the existing quiz engine and local state to expose a bounded post-test queue/reason code. Do not first add a database, cloud sync, AI tutoring service, generic scheduler framework or new learner platform.

### 4. Research / implementation separation

External evidence supports continuing the #60 decision process, not implementation authority. PR #66 remains active ownership, so this radar does not edit, comment on, relabel, merge, deploy or spawn a worker for it.

## Issue Mapping / Dedup

- #60 — existing competitive-learning workflow; **new external evidence maps here; `SKIPPED_LOCKED` due active PR #66; no comment/scope change**.
- #69 — active-session recovery; Break the Test's update-safe behavior is corroborating context only; **active PR #73, no duplicate**.
- #58 / #61 / #74 / #75 — established P2 fidelity/reliability tracks remain ahead of product breadth; no severity or scope change.
- #70 / PR #50 — separate merge/readiness validation; untouched.

Fingerprint search across open Issues and all-state PRs found no independent new root cause that passes the opening threshold.

## Coordination / Locks

No Issue/PR/common-state mutation was required, so no `github-issue-lock:v1` lease was acquired. Active PR #66 and #73 ownership was respected. No `autodev-ng run`, repair worker or GOAL was started.

## Sources

Public web, checked 2026-09-24:

1. WAYDA learning-system upgrade, event/publication 2026-09-23: https://www.wayda.com.tw/wayda-learning-system-upgrade/
2. Break the Test changelog, relevant entries 2026-09-13 / 09-16 / 09-21 / 09-23: https://breakthetest.app/whats-new
3. Break the Test stale-question/provenance article, published 2026-09-10: https://breakthetest.app/blog/practice-questions-expire/
4. MOEX 115 police/general-police standard answers, dated 2026-06-15: https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?code=115060&t=A
5. MOEX 115 police/general-police question search surface, checked 2026-09-24: https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx?e=115060&y=2026

Repository evidence:

- `police-exam-archive master@a0b5dbb9352b5558dbe62445c6452947dbd2501b`
- owner decision: `docs/portfolio-audit/2026-09-22T0800Z-product-board-delta-police-exam-archive.md`
- #60 + PR #66; #69 + PR #73; #58/#61/#74/#75; #70/PR #50
- fair-cursor handoff: `autodev-ng` PR #89

## What Changed

- Added one genuinely fresh adjacent-product detail set from Break the Test: short repair set after testing, explicit discoverability remediation, and update-safe in-progress handling.
- Rechecked WAYDA and MOEX; no new authority/freshness reversal.
- New evidence strengthens the existing #60/#69 rationale but does **not** create an independent root cause, severity upgrade or implementation right.
- Product source/default branch was not modified by this run.

## Completion / Gaps / Cursor

- External A/B/C exploration: completed for this rotation with direct competitor, adjacent workflow and authoritative source.
- New Issues: 0.
- Issue/PR comments or scope changes: 0.
- Runtime/product test execution: 0; no runtime behavior is claimed verified by this report.
- Report is documentation-only; it does not declare this repository or portfolio CLEAN.
- Remaining evidence gap for the opportunity: real user frequency/value of post-test focused review in this product, plus bounded usability/runtime evidence after any explicitly authorized implementation.
- Next fair eligible product target: `Reese-max/92-duty-scheduler`.
