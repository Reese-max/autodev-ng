# External Competitive / New-Product / Workflow Radar — neciken-summer-poem

- Checked at: 2026-09-26
- Focus repo: `Reese-max/neciken-summer-poem`
- Current default branch: `master@38c614bac410aee7e00bcc008bc364593d9efd29`
- Last product-facing baseline: `3572303c0ddc598a8f4c9272b884ca91d47e1480`
- Portfolio rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Owner direction: INVEST / SIMPLIFY / MAINTAIN
- Runtime status: NEEDS_RUNTIME_VERIFICATION
- This report is research/triage evidence only. It does not authorize implementation, merge, deployment, paid usage, external submission, or product-code changes.

## Scope / inventory

Fresh owner pagination returned 42 Reese-max repositories on the first page and 0 on the second page; `obsidian-vault` is archived, leaving 41 currently unarchived repositories. This run did not infer product status from inventory metadata.

The focal repo's post-baseline commits are audit/docs-only. No product-source change after `3572303c...` was treated as a fix.

Current active scopes:
- #4 formal submission policy × provenance gate → open PR #5 (`fix/issue-4-formal-export-gate`)
- #3 rule freshness / Rule-Drift Receipt → open PR #6 (`devin/issue-3`)
- #1 CI restoration → open PRs #2 and #7
- #8 deterministic contest-AI-policy preservation remains independently tracked; PR #6 touches the same discovery component

No active scope was taken over or modified.

## External Signals

### A. Direct market signal — contest AI rules are now task-scoped, not binary

**CONFIRMED — The Shift, “The Tilt” teen poetry contest, published 2026-08-31.**  
The official rules prohibit AI-generated or AI-assisted writing while explicitly allowing standard spelling and grammar tools. This is a concrete policy category distinct from both “AI prohibited” and unrestricted “AI allowed”.

Source: https://theshiftison.com/the-tilt-girls-gender-expansive-teen-poetry-contest/

**CONFIRMED — MyAnimeList × Honeyfeed Writing Contest 2026, active entry window 2026-07-06 through 2026-09-27.**  
The official rules allow support uses such as idea organization and grammar assistance and allow AI-generated cover art with tool credit, while prohibiting AI as creative editor, story writer, co-author, or translation substitute; fully or partially AI-generated stories are disqualifying. The same rules freeze manuscript editing after the submission deadline while finalist selection is underway.

Source: https://www.honeyfeed.fm/contests/myanimelist_x_honeyfeed_202607/rules

**CONFIRMED — Short Fiction Break / The Write Practice Summer 2026.**  
The official contest rules allow brainstorming, research, grammar checks, feedback, and critique, but prohibit stories primarily or entirely written by AI. Submission asks entrants how AI was used, and dishonest disclosure is disqualifying.

Source: https://shortfictionbreak.com/writing-contest/summer-2026/rules/

These three current/recent rule sets show a stable pattern: “AI use” is increasingly a matrix of *task*, *degree of generated material*, *disclosure*, and sometimes *artifact type*, not a single allowed/prohibited bit.

### B. Adjacent transferable workflow — structured AI disclosure

**CONFIRMED — D&AD Awards 2026 Integrity Policy.**  
D&AD requires structured disclosure of tools used, purpose, whether AI-generated material appears in the final output, and (in its Terms) stage of use, nature/proportion of AI-generated material, and human oversight/editorial controls. It can request logs/version histories or other substantiation.

Sources:
- https://www.dandad.org/awards/d-ad-awards/integrity-policy
- https://www.dandad.org/awards/d-ad-awards/terms-and-conditions

Transferable principle: capture only the few dimensions needed to make a submission decision and keep evidence attached. Do **not** copy D&AD's full enterprise verification process.

### C. Submission-tool signal

**CONFIRMED — Duosuma changelog, latest update 2026-09-01.**  
Duosuma continues to evolve reviewer-side submission workflow and already supports an account-level allow/prohibit-AI setting with submitter affirmation. Its newest September change is reviewer identity/profile linking, not a reason for this repo to add hosted accounts or social/profile features.

Source: https://duotrope.com/duosuma/docs/changelog.aspx

## New Releases

- 2026-09-01: Duosuma added optional links to submitters' Duotrope profile pages as a final review step.
- 2026-08-31: The Shift published a contest rule that explicitly separates ordinary spelling/grammar tools from prohibited AI-assisted writing.
- Current through 2026-09-27: Honeyfeed's active contest distinguishes organizational/grammar support, cover generation, creative editing/writing, translation, and partial/full generation.

No external release justifies marketplace, hosted account, auto-submission, CRM, social feed, or generic policy-engine expansion.

## Community Pain

No sufficiently strong fresh community evidence was found in this run that should be treated as incidence data. This report therefore does not use anecdotes to estimate frequency, conversion, rejection risk, or ROI.

## Repo Evidence / Counterevidence

Current default branch uses:
- `AI_POLICY_MODES = {"允許", "禁止", "未明示"}`
- `ai_policy_issue()` validates that enum only
- `ai_model_issue()` checks `禁止模型關鍵字` but is currently warning-only
- `require_export_allowed()` on default delegates to generation allowance; AI policy is currently informational

The checked-in `national-defense-60th-poetry-2026` profile is already a real internal counterexample to a binary reading of `允許`: it records that AI may only assist; disclosure of tool and generated scope is required; generated content cannot be the main part; and certain AI products are prohibited.

Open PR #5 improves the formal boundary substantially with typed provenance and fail-closed `BLOCKED / NEEDS_REVIEW / ELIGIBLE`. However, its current patch still treats `mode == 允許` as eligible after the generic disclosure/attestation requirement is satisfied. The patch does not make `禁止模型關鍵字` or the profile's other scoped `限制` part of the formal decision.

Counterevidence against a new feature:
- Issue #4 already explicitly says “allowed-with-disclosure → require the relevant disclosure fields before ready”.
- The owner direction already prefers a narrow formal boundary over a general policy framework.
- Practice export remains a safe fallback; not every nuanced policy requires machine automation.

Therefore this is not a new root cause and should not become a new Issue.

## Validated Workflow Gap / Fingerprint

`neciken-summer-poem + formal contest export + source/profile says AI is conditionally allowed for only specific tasks / disclosure / model or contribution limits + generic mode=允許 and generic human attestation + formal gate cannot prove those scoped conditions + submission artifact may be labeled ELIGIBLE too broadly`

Mapping: **existing #4**.  
This run adds stronger external evidence and a concrete acceptance gap; it does not establish a separate defect.

## Four-Gate Decision

### 1. Problem / value
Target user: a writer preparing a formal contest submission from a locally managed contest profile.

Observable break: the user should not have to manually remember that “允許” means “grammar only”, “brainstorming but not creative editing”, “must disclose tool/scope”, “no translation”, “not primarily generated”, or “these models are prohibited” when the product claims a formal eligibility decision.

Existing workaround: reopen the official rules and manually compare the exact AI workflow before submission.

Consequence if unaddressed: the formal gate can overstate certainty for conditionally allowed policies. This is a trust-boundary problem, but this run has no evidence of an actual rejected submission or deployed incident.

### 2. Priority
- kind: `VALIDATION_GAP` within existing #4
- severity: `NOT_ESTABLISHED` for this newly observed nuance; do not create a second P1 merely because #4 is P1
- decision_priority: `HIGH_WITHIN_#4_BEFORE_MERGE`
- triage: `SKIPPED_LOCKED / ACTIVE_SCOPE`
- auto_implementation: `false`
- runtime: `NEEDS_RUNTIME_VERIFICATION`

### 3. Smallest safe next step
Do not add a policy DSL, policy service, database, workflow engine, model registry, or general compliance framework.

Before richer typed sub-policies exist, the minimum safe formal behavior is:

1. If `mode=允許` but the selected profile contains scoped restrictions the gate cannot deterministically establish (for example `限制`, `禁止模型關鍵字`, or nontrivial disclosure/contribution constraints), return `NEEDS_REVIEW` rather than `ELIGIBLE`.
2. Keep practice export available and visibly non-submission-ready.
3. Add a small deterministic fixture matrix:
   - no AI at any stage;
   - spelling/grammar only;
   - research/organization/feedback allowed but creative writing/editing/translation forbidden;
   - conditional AI allowed with disclosure + prohibited models + “generated content not primary”.
4. Only if that matrix proves a recurring machine-decidable need should the team type the *minimum* required scopes (for example proofreading / research / brainstorming / creative editing / generation / translation).

Why smaller options are insufficient: documentation alone does not prevent a machine-readable `ELIGIBLE` result from overstating certainty. Why larger options are unjustified: the current set can safely fall back to `NEEDS_REVIEW`.

### 4. Research / implementation separation
Narrow experiment exit:
- **BUILD**: current #4 implementation marks one of the frozen nuanced fixtures `ELIGIBLE` although an official scoped condition is not proven; add only the smallest missing condition/fail-closed rule.
- **NARROW**: generic `NEEDS_REVIEW` for any unresolved conditional policy covers all fixtures safely; no new schema.
- **REJECT**: existing #4 after merge already fails closed correctly for the fixtures.

A BUILD result authorizes only a later owner decision; it does not authorize implementation by this radar.

## Opportunity Map

| Bucket | Decision |
|---|---|
| MUST MATCH | Source-faithful rule meaning; formal output must not claim readiness when scoped AI conditions are unproven. |
| SHOULD BE BETTER | Local-first source receipt + deterministic fail-closed decision + explicit practice fallback. |
| DIFFERENTIATOR | Literary workstation that connects drafting to exact official contest constraints without forcing hosted accounts. |
| ADJACENT IDEA | Minimal structured AI-use receipt: tool, purpose/task, final-output contribution, disclosure state. Research only if #4 fixtures prove value. |
| DO NOT COPY | Hosted submission marketplace, creator profiles/community, auto-submission, payment/CRM, general policy engine, broad AI-authorship detector. |

## Rejected Ideas

- **General AI policy DSL / rules engine** — rejected: one active formal-boundary issue can fail closed without it.
- **Automatic authorship detector** — rejected: weak fit, high false-positive and trust risk, not required to enforce known source rules.
- **Auto-submit to contest portals** — rejected by owner direction and unnecessary for the validated gap.
- **Hosted account / tracker / creator profile features** — rejected: Duosuma/Submittable-style platform breadth does not address the current local formal-boundary problem.
- **Model-by-model global registry** — rejected: only contest-scoped restrictions with evidence are relevant.

## Issue Mapping / Coordination

- #4 / PR #5: **DEDUP + SKIPPED_LOCKED**. New evidence belongs to its acceptance validation; no comment or scope takeover in this run.
- #3 / PR #6: no new root cause; rule freshness remains separate.
- #8: no new root cause; deterministic policy preservation remains separate.
- #1 / PRs #2/#7: no change.

No Issue, Issue comment, PR comment, implementation branch, code/config change, CI run, deployment, external submission, paid action, or worker/GOAL was created by this radar.

## Sources

Checked 2026-09-26:
1. The Shift — The Tilt contest — published 2026-08-31  
   https://theshiftison.com/the-tilt-girls-gender-expansive-teen-poetry-contest/
2. Honeyfeed — MyAnimeList × Honeyfeed Writing Contest 2026 rules — active 2026-07-06 through 2026-09-27  
   https://www.honeyfeed.fm/contests/myanimelist_x_honeyfeed_202607/rules
3. Short Fiction Break / The Write Practice — Summer 2026 contest rules — 2026 contest cycle  
   https://shortfictionbreak.com/writing-contest/summer-2026/rules/
4. D&AD Awards 2026 Integrity Policy / Terms — 2026 awards cycle  
   https://www.dandad.org/awards/d-ad-awards/integrity-policy  
   https://www.dandad.org/awards/d-ad-awards/terms-and-conditions
5. Duosuma changelog — latest update 2026-09-01  
   https://duotrope.com/duosuma/docs/changelog.aspx

Source confidence:
- First-party contest / award / product rules above: CONFIRMED.
- No community signal was promoted into product evidence.

## What Changed

The useful new fact is not “another competitor has AI settings.” It is that active 2026 contest policies now repeatedly distinguish **which AI task**, **how much generated content**, **what disclosure is required**, and sometimes **which tools/models are disallowed**.

That external evidence directly intersects an existing in-repo profile and the open #4 formal gate. The correct response is to make #4's acceptance more fail-closed, not to create a new policy platform or a duplicate Issue.

## Completion / gaps / cursor

- Fresh owned-repo inventory: complete for this run (42 / 41 unarchived / 1 archived).
- Rules file: read; blob SHA recorded.
- Focal default HEAD: rechecked; product baseline unchanged.
- Existing Issues / open PRs / relevant issue comments: checked.
- External A/B/C exploration: completed with first-party sources.
- Runtime experiment: not executed; status remains NEEDS_RUNTIME_VERIFICATION.
- New Issue count: 0.
- Scope changes: 0.
- Implementation authorization: 0.
- Next fair cursor: `Reese-max/note-filler`.
