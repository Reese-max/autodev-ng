# External Radar — voice-actress — 2026-09-24T220128Z

## Run scope
- focal repo: Reese-max/voice-actress
- default branch / HEAD checked: master @ b20a3f3e58b055ff27acf7cdd302d822841a119c
- Issue Quality v2 blob: 8167e10798071d2276addaff6b201c6b0e904a2a
- owner direction source blob: b2de40b42dca171d62f22ef763822998c749d7a2
- fresh inventory: 42 owner repos / 41 unarchived / 1 archived
- result: 0 new Issues; 0 Issue/PR scope changes; 0 implementation authorization
- runtime: NEEDS_RUNTIME_VERIFICATION for any future new workflow

Fairness note: autodev-ng PR #93 hands off to voice-actress. PR #94 points back to 92-duty-scheduler, but that repo had already been scanned by PR #91 only hours earlier. This run follows the non-duplicative cursor and avoids an immediate repeat. Next fair eligible target: Reese-max/taiwan-intel-dashboard.

## External Signals

### A — direct competitor: WAYDA
**CONFIRMED product claim; event 2026-09-23.**
Source: https://www.wayda.com.tw/wayda-learning-system-upgrade/

WAYDA now packages courses, chapter practice, mocks, past papers, AI essay grading, wrong-answer review and learning records in one learner flow. Essay answers can be typed or uploaded as handwritten photos; AI uses a 25-point grading flow, while teacher manual review remains available as a separate path.

Transferable workflow signal: AI feedback and human review are separate authorities; paper-first intake is useful only if transcription/review truth remains explicit; an attempt should feed a later review action rather than end at a total score.

Do not infer learning gains, reviewer usage frequency, or a requirement to copy the LMS/teacher operation.

### A — incumbent Taiwan workflow: 公職王
**CONFIRMED current product surface; checked 2026-09-25.**
Sources:
- https://www.public.com.tw/previousexam
- https://www.public.com.tw/membercenter/pts-exchange

Current past-paper pages expose AI essay grading, while member services include teacher essay correction. This independently confirms separate AI and human correction paths in the Taiwan exam-prep market.

### B — adjacent workflow: Examly
**CONFIRMED current product surface; checked 2026-09-25.**
Source: https://examly.tw/

Examly links daily practice, weakness tracking, wrong-answer review cards, essay grading and cross-device progress. Current listed plans are free, NT$290/month and NT$2,500/year. Useful pattern: attempt -> identified weakness -> next review action. This pattern is safe to copy only when the underlying grading evidence is current and attributable.

### B — legal-exam surface: Lawier
**CONFIRMED product surface; vendor outcome numbers are marketing claims.**
Source: https://lawier.tw/

Lawier combines legal-exam AI grading and computerized exam simulation. The market signal is exam-shaped immediate feedback, not proof that more AI feedback improves outcomes.

### C — research signal: rubric granularity
**CONFIRMED for the study; transfer to Taiwan police/legal essays is unvalidated.**
Published 2026-04-14.
Source: https://arxiv.org/abs/2604.12227

The study reports lower human-AI agreement on mid-level responses with partial/ambiguous reasoning and better consistency with more fine-grained checklist rubrics than holistic scoring. This supports explicit criterion evidence and uncertainty/review boundaries, not importing the reported reliability numbers into this product.

## New Releases

Material delta: WAYDA's 2026-09-23 release newly combines handwritten intake, immediate AI scoring, teacher review and the wider attempt/wrong-answer/learning-record loop. This is a meaningful direct-market strategy change, but it does not by itself establish a voice-actress defect.

## Community Pain

No sufficiently attributable new community-frequency signal was retained. Vendor pain statements are treated as product marketing, not prevalence. No synthetic ROI, affected-user count or adoption rate was inferred.

## Repository reality / contrary evidence

Current owner decision remains INVEST / SIMPLIFY / REPOSITION around Traditional-Chinese Taiwan police/legal essay practice.

Relevant existing work already owns the strongest external patterns:
- #6 + active PR #18: criterion-level answer evidence, revision binding and law-source status. Overlap = SKIPPED_LOCKED.
- #12: narrow RESEARCH for handwritten sheet -> candidate transcript -> explicit user confirmation -> existing grade-v2; explicitly rejects generic OCR.
- #14 + PR #16: personal-session isolation.
- #1 + PR #3/#9: truthful grading provenance.
- #7 + PR #8/#10: truthful product contract.
- #15 + PR #17: dependency security patch.

Contrary evidence against a new human-review feature Issue: no current user evidence establishes access to a human reviewer as a supported promise or top friction; no reviewer operation is authorized; #6 is already the smaller prerequisite; current trust work is higher priority.

## Opportunity Map

**MUST MATCH**
- personal-data isolation and owner authority (#14)
- truthful grading provenance/failure state (#1)
- inspectable criterion evidence (#6 / PR #18)

**SHOULD BE BETTER**
- link each criterion to exact learner text and distinguish model judgment from verified legal source
- do not turn stale answer revisions into current weakness truth
- any future human handoff should expose one bounded evidence artifact, not all learner history

**DIFFERENTIATOR**
- Taiwan police/legal depth
- answer-revision binding
- exact-text criterion evidence
- reviewable legal-source state
- truthful privacy/provenance boundaries

**ADJACENT IDEA — HOLD**
A user-initiated human-review-ready evidence packet for disputed/ambiguous grading: answer revision/hash + criterion + exact evidence spans + law-source status + separate reviewer opinion. Current classification:
- kind=OPPORTUNITY
- severity=NOT_ESTABLISHED
- decision_priority=MEDIUM
- triage=NEEDS_EVIDENCE
- auto_implementation=false

No Issue because the user pain/reviewer channel is not established and #6/PR #18 already owns the minimum evidence substrate.

**DO NOT COPY**
teacher marketplace/roster/scheduling; LMS breadth; generic OCR; silent image-to-grade; automatic paid escalation; model voting presented as independent review; more social features before #14; restoring billing solely because competitors charge.

## Four Gates

1. **Problem/value:** no new supported-flow failure established. Fresh market evidence validates reviewability, but existing #6/#12 already map the relevant workflow.
2. **Priority:** new handoff remains OPPORTUNITY / NOT_ESTABLISHED / MEDIUM / NEEDS_EVIDENCE; existing P0/P1 trust work stays ahead.
3. **Minimum:** do nothing now. If real demand later appears, reuse one existing grading result as one explicit-share review packet before considering accounts, queues, marketplaces or services.
4. **Research vs implementation:** no implementation authority. A future experiment must identify an attainable reviewer, explicit learner consent, bounded data, privacy/cost limits, and BUILD/NARROW/REJECT exits. BUILD would authorize only the next decision.

## Issue Mapping

| Signal | Mapping | Decision |
|---|---|---|
| WAYDA handwritten photo -> AI | #12 | existing RESEARCH; no duplicate |
| WAYDA/public.com AI + human correction | #6 prerequisite + future handoff candidate | report-only HOLD |
| attempt -> wrong-answer loop | existing grading/history surfaces | no new root cause |
| fine-grained rubric research | #6 / PR #18 | strengthens existing scope; SKIPPED_LOCKED |
| grading ambiguity/trust | #1 + #6 | no duplicate |

No Issue/PR comment was written, so no issue lease was acquired.

## Cross-portfolio ideas

No shared cross-project framework is justified. A generic evidence-packet abstraction remains premature until a local bounded artifact proves useful.

## Rejected Ideas

- teacher marketplace now: no validated demand, reviewer supply or authority model
- copy WAYDA's full portal: scope mismatch
- generic OCR now: duplicated by #12 and too broad
- auto-create SRS weakness cards from every AI deduction: unsafe until evidence freshness is reliable
- second LLM as “independent” review: not independent human oversight
- restore billing from competitor pricing: owner previously removed it
- severity promotion from competitor recency: no causal product-impact evidence

## Sources

1. WAYDA, 2026-09-23: https://www.wayda.com.tw/wayda-learning-system-upgrade/
2. 公職王 current past-paper AI entry: https://www.public.com.tw/previousexam
3. 公職王 teacher correction service: https://www.public.com.tw/membercenter/pts-exchange
4. Examly: https://examly.tw/
5. Lawier: https://lawier.tw/
6. Tang, Ambrose, Cheng, 2026-04-14: https://arxiv.org/abs/2604.12227
7. Issue Quality v2: https://github.com/Reese-max/autodev-ng/blob/main/docs/portfolio-audit/2026-09-14-issue-quality-v2.md
8. voice-actress #6: https://github.com/Reese-max/voice-actress/issues/6
9. voice-actress #12: https://github.com/Reese-max/voice-actress/issues/12
10. voice-actress #14: https://github.com/Reese-max/voice-actress/issues/14
11. voice-actress PR #18: https://github.com/Reese-max/voice-actress/pull/18

## What Changed / Scope Calibration

New external evidence: one direct Taiwan police/public-service prep competitor now publicly combines handwritten essay intake, immediate AI grading, teacher review and a wider review loop.

Decision: no owner-direction reversal, no new Issue, no severity promotion, no scope mutation. The signal increases confidence in the existing “AI recommendation != final authority” and “paper intake needs an explicit review boundary” principles.

## Completion / Gaps / Cursor

Completed: full owner pagination; rules reread; owner direction and default HEAD check; relevant Issues/PRs/branches review; non-GitHub A/B/C exploration; dedupe; four-gate decision.

Gaps: no independent demand prevalence for human review; no authorized reviewer channel; no runtime usability receipt for PR #18; no runtime handwriting-bridge receipt for #12; no transfer claim from external grading benchmarks.

Next fair eligible target: **Reese-max/taiwan-intel-dashboard**.

This report does not declare the portfolio CLEAN and does not authorize implementation, merge, deployment, paid-provider use, permission changes or production-data writes.
