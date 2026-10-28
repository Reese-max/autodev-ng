# External Competitive / Product / Workflow Radar — 2026-09-24T07:57:34Z

## Status

- **Run result:** COMPLETE / NO NEW ISSUE
- **Focal product:** `Reese-max/92-duty-scheduler`
- **Inspected default branch:** `main@4d7d7d4911ffd580630661a2f71079a2c38c6ae1`
- **Issue Quality v2 rules blob:** `8167e10798071d2276addaff6b201c6b0e904a2a`
- **Fresh owner inventory:** 42 Reese-max-owned repositories, 41 unarchived, 1 archived; page 2 returned empty.
- **Prior fair-rotation handoff:** `police-exam-archive` → `92-duty-scheduler` (autodev-ng PR #90).
- **Next fair eligible product:** `Reese-max/UkePack` (freshly checked: unarchived product repo; AI-powered MusicXML → ukulele practice-pack/PDF generator).
- **Writes:** 0 product-code/config/CI changes; 0 Issue/PR comments; 0 implementation authorization; 0 GOAL/worker/deploy action.

## Direction / Current Product Contract

Owner-approved product-board direction remains **INVEST, but fix calendar truth and authorization gates before expanding**. The repo is a Taiwan-focused, semi-automatic school / police / military-style duty scheduler; its moat is local duty rules, free-period inputs, explainable vacancy/swap handling, Excel/LINE handoff, and self-hosted Cloudflare/D1 with no telemetry.

`docs/ROADMAP.md` keeps expansion feedback-gated: Setup Wizard only after demand, larger admin/deployment/multi-week features after stronger demand, and explicitly rejects native mobile, real-time collaboration, generic AI scheduling suggestions, and a notification bot as default expansion paths.

Current `main` product code has not changed since the 2026-09-06 security-fix line; later default-branch changes are audit/report documentation. Open implementation PRs are active for #14, #13, #19, #29, #31, #35 and adjacent research scopes, so this radar did not take over their scope.

## External Signals

### A — Direct competitor / category signal: Workforce.com Rota Agent

**CONFIRMED — published 2026-08-17; checked 2026-09-24**

Source: https://help.workforce.com/en/articles/15301502-rota-agent

Workforce.com now exposes an AI-powered Rota Agent that creates a **proposal** rather than silently publishing a roster. The workflow is operationally important beyond the AI label:

- the manager selects an exact week/location before build;
- outstanding leave / availability requests are surfaced before building;
- approved leave and employee availability are schedule inputs;
- one build can start from a template, previous week, rota pattern, or regular hours;
- per-build custom instructions are distinct from organisation/location standing instructions;
- natural-language validations distinguish **blocking** rules from **warning** rules;
- no shifts are created until the user approves the proposal; publishing remains a separate manual action.

**Transferable pattern:** temporary, build-scoped facts should not be stored as standing policy merely because both affect eligibility. `planner authority != effect authority`, and temporal scope is part of schedule truth.

**Do not copy:** a chat-first AI scheduling agent. `92-duty-scheduler` already has a deterministic engine and owner direction explicitly rejects opaque LLM scheduling as the next product step.

### A2 — Direct competitor data model: availability has explicit temporal scope

**CONFIRMED — Workforce.com Availability Report published 2026-07-23; checked 2026-09-24**

Source: https://help.workforce.com/en/articles/16053492-availability-report

Workforce distinguishes:

- ongoing availability;
- temporary availability for a specified period;
- once-off unavailability for a date/date-range.

Its current availability workflow also treats temporary availability as an override with explicit start/end dates rather than mutating the standing pattern indefinitely.

**CONFIRMED — Deputy help updated 2026-07-16; checked 2026-09-24**

Source: https://help.deputy.com/hc/en-au/articles/4614772805135-How-to-let-your-manager-know-you-re-available-or-unavailable-to-work-on-a-specific-date

Deputy similarly distinguishes one-off unavailability from recurring availability and supports explicit end dates for recurring patterns.

**Transferable pattern:** schedule eligibility exceptions need a scope (`one-off / bounded temporary / ongoing`) that is visible and replayable. The source proves the market pattern, not that this repo has a production incident.

### B — Adjacent public-safety workflow

**CONFIRMED — checked 2026-09-24**

Source: https://www.powerdms.com/power-time

PowerTime, positioned for law-enforcement / corrections / fire / emergency communications, treats time off, open shifts, schedule swaps, staffing rules and audit history as distinct stateful concerns. This supports preserving the repo's domain-specific police/school workflow while avoiding a generic HR suite.

### C — Emerging technique / architecture signal

No separate new technical primitive passed the evidence gate this round. The most relevant recent technique remains already-tracked work: #20's deterministic PolicySpec / validation lifecycle and #19's bounded repair plans. Adding another rule registry, AI planner, state machine or cross-project framework would be duplication rather than a new root cause.

## Repository Evidence / Counter-Evidence

### Confirmed current behavior

The public UI labels the control **「本週排除學員（請假/公差等）」**, and the formal weekly SOP says to collect this week's leave / official-duty absences and add those people before scheduling.

However the canonical backend stores exclusions only as `(semester_id, student_id)` and `/api/exclusions` replaces the entire set for the current semester. `/api/state` also reloads `excluded` by `semester_id` only; there is no week/date scope in this path. The scheduler's shared candidate filter treats every member of `S.excluded` as ineligible.

This means the UI wording is week-scoped while durable state is semester-scoped. That is a real semantic mismatch in source, but it is **not a new undiscovered fingerprint**: #35 already records this exact adjacent question and explicitly defers it pending scope/expiry evidence, while PR #42 is actively implementing the narrower clear-all persistence bug.

### Counter-evidence / why no new Issue now

- Existing historical production notes also show exclusions can represent longer-lived injury cases, so simply auto-clearing the set every week would be unsafe.
- #35 explicitly calls out the same `本週排除` vs semester-scoped schema tension and says not to expand that bug into a schema redesign without further evidence.
- PR #42 is active in the same exclusion component and should not have its scope silently expanded by this radar.
- #22 already owns employee/self-service exception request lifecycle; #20 owns rule authoring / validation; neither should be duplicated.
- The new external sources strengthen the design principle but do not add a user-observed failure frequency, a new production incident, or a new root cause beyond what #35 already preserved.

Therefore the candidate remains **central-report evidence only**, not a new Issue or comment.

## Opportunity Map

| Class | Signal / decision |
|---|---|
| **MUST MATCH** | Temporal scope of schedule-defining exceptions must be truthful. A one-week absence must not silently become semester-long, and a standing exclusion must not be accidentally cleared as if it were temporary. |
| **SHOULD BE BETTER** | Keep exception semantics deterministic and visible to the operator; if/when scope is implemented, reuse existing eligibility/history rather than create a second scheduling truth. |
| **DIFFERENTIATOR** | Taiwan police/school duty rules, free-period awareness, explainable local repair, self-hosted D1, Excel/LINE handoff, and operator-controlled mutation. |
| **ADJACENT IDEA** | If future evidence warrants it, represent `semester baseline` separately from `week/date-bounded exception`, with explicit expiry and read-back. This is narrower than an availability portal. |
| **DO NOT COPY** | Generic AI rota agent, payroll/timeclock/HR suite, native mobile app, always-on chat automation, or an LLM in the eligibility hot path. |

## Four Gates

### 1. Problem / Value

Target user: the operator who runs the documented weekly duty-scheduling flow.

Observable source-level mismatch: weekly leave/official-duty exceptions are entered in a UI explicitly called `本週排除`, yet durable storage and reload are semester-scoped. Consequence is potentially incorrect eligibility on later weeks unless the operator manually reconciles a state model that does not expose duration.

This is meaningful, but the exact fingerprint is already preserved in #35 and related active work exists. External competitor models add corroboration, not an independent defect.

### 2. Priority

For any future dedicated tracking:

- `kind=BUG` if a deterministic fixture demonstrates a week-N exception affecting week N+1 under the supported flow;
- `severity=P2` would be plausible because eligibility directly affects core schedule completion/correctness;
- **current radar disposition:** `NOT_NEW / EXISTING_ADJACENT_EVIDENCE`, `decision_priority=MEDIUM`, `triage=NEEDS_EVIDENCE`, `auto_implementation=false`.

No P0/P1 escalation: there is no new evidence of unauthorized access, production incident, data loss, or widespread impact.

### 3. Minimum Solution

Do not jump to an availability service or request platform. If later evidence crosses the gate, compare in order:

1. **No change / documentation only:** insufficient if the supported UI continues to call a semester-persisted set `本週`.
2. **Clear everything on week rollover:** unsafe because longer-lived exclusions exist.
3. **Smallest complete data change:** preserve legacy/current semester exclusions as standing baseline and add only the minimum week/date scope required for temporary exceptions (for example a backward-compatible nullable scope/week range), then make the UI show which scope will be changed.
4. Only after measured demand consider self-service submission; that belongs to #22 rather than this root cause.

No new DB/service/framework is authorized by this report.

### 4. Research / Implementation Separation

No new research Issue is needed. A future narrow fixture can answer the remaining decision:

`baseline exclusion + one-week exception + week switch/reload -> which IDs should affect eligibility?`

Possible exits:

- **BUILD:** supported workflow deterministically carries one-week exclusions into later weeks and mixed scope cannot be handled safely by operator convention.
- **NARROW:** only wording/SOP is misleading while actual operator workflow intentionally maintains a semester set.
- **REJECT:** current behavior is explicitly owner-approved and measured use shows no weekly-scoping requirement.

A BUILD result would authorize only a next-step decision, not implementation, merge or deploy.

## Community Pain

No new Reddit/community source was strong enough to change classification. Anecdotes were not used as prevalence evidence.

## New Releases

- Workforce.com Rota Agent — 2026-08-17 — proposal-first AI rota generation, pending-request review, scoped instructions, blocking/warning validations.
- Workforce.com Availability Report — 2026-07-23 — ongoing / temporary / once-off availability separated with date-range semantics.
- Deputy availability help — updated 2026-07-16 — one-off vs recurring unavailability with explicit end dates.

These are product/workflow signals, not independent proof of effect size or ROI.

## Cross-Portfolio Ideas

One reusable contract is worth retaining as a principle, not a framework project:

> **standing state != bounded exception != proposed change != approved effect**

This applies to duty scheduling, travel changes, clinical candidates, playlist/provider writes and other stateful tools, but this run does **not** create a shared service/registry/state machine from that observation.

## Rejected / Deferred Ideas

- **New AI Rota Agent:** reject; deterministic scheduling is already adequate and owner direction says no opaque LLM scheduling expansion.
- **Generic leave/availability portal:** defer; #22 owns request lifecycle and has active scope.
- **New Policy/Rule framework:** reject as duplicate; #20 already tracks bounded PolicySpec research.
- **New Issue for weekly-vs-semester exclusions in this run:** defer; same semantic tension is explicitly preserved in #35, related PR #42 is active, and no new user/runtime evidence establishes a separate actionable fingerprint yet.
- **Expanding PR #42:** skipped; active implementer scope must not be grabbed by the radar.

## Issue Mapping / Coordination

- #35 — P2 clear-all persistence bug; **active PR #42**. Same component, distinct narrow bug. Scope/expiry question already recorded as adjacent, so no duplicate Issue/comment.
- #19 — vacancy repair; active PR #39. No change.
- #20 — PolicySpec / rule authoring research; existing PR #27. Workforce scoped-instruction pattern is corroborating context only; no update due active scope.
- #22 — Duty Inbox / LINE request lifecycle; active PR #34 plus earlier research PR #26. No expansion.
- #14 / #13 / #29 / #31 — active security/reliability work with PRs. No interference.

No lock was acquired because no existing Issue/shared product state was modified. New Issue creation was not needed after final dedupe.

## Sources

Public web, primary sources used as main intelligence:

1. Workforce.com, **Rota Agent**, 2026-08-17, checked 2026-09-24: https://help.workforce.com/en/articles/15301502-rota-agent — CONFIRMED.
2. Workforce.com, **Availability Report**, 2026-07-23, checked 2026-09-24: https://help.workforce.com/en/articles/16053492-availability-report — CONFIRMED.
3. Workforce.com, **Submitting & Managing Availability**, current help, checked 2026-09-24: https://help.workforce.com/en/articles/15359569-submitting-managing-availability — CONFIRMED.
4. Deputy, **available/unavailable on a specific date**, updated 2026-07-16, checked 2026-09-24: https://help.deputy.com/hc/en-au/articles/4614772805135-How-to-let-your-manager-know-you-re-available-or-unavailable-to-work-on-a-specific-date — CONFIRMED.
5. PowerDMS, **PowerTime public-safety scheduling**, checked 2026-09-24: https://www.powerdms.com/power-time — CONFIRMED current product description; no independent effectiveness claim inferred.

Repository evidence was used only to map signals to Reese-max product state, not as the primary external-intelligence source.

## What Changed

- Fresh inventory was re-paginated: **42 owned / 41 unarchived / 1 archived**, no second-page repositories.
- Fair rotation advanced from `police-exam-archive` to `92-duty-scheduler` and next to `UkePack`.
- Current external workforce products reinforce a precise temporal-scope contract for schedule inputs and proposal-before-effect behavior.
- No new root cause crossed the Issue gate; no existing Issue received a comment because the useful signal is corroborative and active related PRs already own adjacent scope.
- No runtime test was executed in this radar. Any future scope/expiry fix remains `NEEDS_RUNTIME_VERIFICATION` with isolated synthetic D1/browser fixtures.

## Completion / Gaps

**Completed:** rules/direction/roadmap/current default branch/open Issues/all-state PRs; fresh inventory pagination; public-web direct/adjacent scan; dedupe and Four Gates; next cursor validation.

**Gaps:** no live production D1 inspection, no real-user frequency measurement, no destructive write testing. These gaps intentionally prevent escalation or implementation authorization.

**Portfolio CLEAN:** not asserted.