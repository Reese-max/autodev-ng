# External Competitive Radar — 2026-09-19T17:59:58Z

Status: **COMPLETE**

## Scope / Direction Check

- Issue-quality rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected owner inventory: **41 Reese-max-owned repositories / 40 unarchived**. `obsidian-vault` is archived and excluded. Pagination was completed in this run; the older inventory was not assumed to be exhaustive.
- Fair-rotation primary repo: `Reese-max/clinical-scribe-worker`
- Current default branch/head checked: `main @ 4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5` (`docs: record round 4 CI regression evidence`). Relevant product/security implementation baseline remains `88bb7469508e8732aaff6f21d048c8677823fc04`; later default-branch commits are audit documentation.
- Current owner-approved boundary remains: **competition prototype for synthetic data and non-clinical research only**; the shipped UI explicitly forbids real patient/PII input and use for clinical practice or medical advice.
- Existing trust/release work remains higher priority: #6 Cloudflare Access cryptographic verification and #10 executing CI/security-test gate. Existing product research #4 (specialty/workflow validation) and #7 (section-scoped repair/revision receipts) both have open PR scope (#12 and #9 respectively).
- No product source, CI, config, secrets, branch, deployment, GOAL, paid service, or production data was modified.

## Product → Market Category

1. Ambient clinical documentation / scribe workflows.
2. Role-specific documentation and point-of-care structured charting.
3. Authorized EHR/context retrieval and source-grounded clinical assistance.
4. Specialty/workflow validation and provenance.
5. Human-factors / documentation-burden evidence.

Competitor presence is not treated as a feature requirement.

## External Signals

### 1. CONFIRMED — Oracle expands Clinical AI Agent from physician workflows into nursing point-of-care documentation

**Event date: 2026-09-14. Checked: 2026-09-20 (Asia/Taipei).**

Source: https://www.oracle.com/news/announcement/oracle-health-clinical-ai-agent-helps-nurses-alleviate-documentation-burden-and-streamline-care-2026-09-14/

Oracle announced U.S. availability of Oracle Health Clinical AI Agent for nurses. The first-party release combines voice-driven chart navigation/search, acute nursing summaries and voice-enabled **discrete charting** embedded in Oracle Health Foundation EHR, with documentation intended to happen near the point of care.

This is a meaningful competitor-strategy change: ambient/clinical AI is broadening from physician note drafting into **role-specific structured workflows**. The transferable principle is not “add nursing.” Different clinical roles have different fields, workflow timing, source context and review responsibilities, so any future expansion should be validated by role/workflow rather than assuming that a physician-oriented specialty pack generalizes.

Current impact on this repo: no feature gap is established. `clinical-scribe-worker` is explicitly synthetic/non-clinical and does not have an owner-approved nursing/EHR workflow. Existing #4 already has `workflow` / `care setting` in its ValidationPack design, which is the smallest place to represent a future role-specific scenario if owner scope changes. Do not create a second role framework.

### 2. CONFIRMED — OpenAI/Epic moves healthcare assistants toward authorized multi-source context with source pointers

**Event date: 2026-09-01. Checked: 2026-09-20.**

Source: https://openai.com/index/chatgpt-connects-health-records-and-healthcare-sources/

OpenAI announced an Epic integration for ChatGPT for Healthcare that brings authorized patient context into a governed workspace, lets clinicians review items such as notes, labs, medications and specialist documentation, and points responses back to supporting chart information. The useful design signal is the separation of **authorized context retrieval, source traceability and downstream action authority**.

For this repo this is an adjacent strategy signal only. The current scope forbids real patient/PII input, so EHR ingestion, live chart context, write-back, orders or coding are explicitly out of scope. The smallest reusable principle is to keep generated-note claims and revisions traceable to their allowed source evidence, which #4/#7 already target.

### 3. CONFIRMED independent evidence — reduced typing does not automatically imply reduced total workflow burden

**Article date: 2026-09-16. Checked: 2026-09-20.**

Source: https://www.medicaleconomics.com/view/ai-scribes-cut-documentation-time-by-69-in-simulated-primary-care-visits-study-finds

A recent report on a University of Toronto simulated primary-care study describes a large reduction in the share of encounter time spent typing/copying with AI scribes, while overall encounter duration was not significantly reduced and scrolling/review behavior increased. The simulation was small and constrained, so the percentages must not be generalized to this product or to routine clinical practice.

Transferable principle: “less typing” and “less total review/finalization burden” are different outcomes. This reinforces the earlier human-factors radar without creating a current defect in a synthetic-only prototype.

### 4. CONFIRMED independent prospective evidence — workflow outcomes differ by metric

**Published 2026; checked 2026-09-20.**

Source: https://medinform.jmir.org/2026/1/e84104

A prospective single-medical-group study enrolled 80 providers, with 79 completing a 3-month pilot and more than 25,000 notes across 23 specialties. High users showed less note-writing time and lower after-hours documentation, while the study found no statistically significant difference in burnout symptoms and no significant change in the measured patient-experience item. Providers reported most notes still required some degree of editing, commonly less than one-quarter of the note.

This supports keeping **content correctness, editing/review burden, clinician workload and patient experience as separate evidence layers**. It does not prove efficacy for this repo and does not authorize a telemetry or human-subject study platform.

## New Releases / Changes

- **2026-09-14 — Oracle Health:** Clinical AI Agent for nurses adds role-specific chart navigation, nursing summaries and discrete charting. Retained as the main new strategic signal.
- **2026-09-01 — OpenAI:** Epic context integration reinforces authorized-context and source-traceability patterns; retained as adjacent architecture evidence, not a mandate to ingest PHI.
- **2026-09-16 — recent workflow evidence coverage:** typing reduction and total encounter burden remain distinct measures; retained as human-factors calibration.

## Community Pain

No community anecdote was promoted to decision-grade evidence this round. Recent first-party product releases and independent research were sufficient. No prevalence claim was inferred from vendor marketing or isolated user stories.

## Current Repository Evidence / Contrary Evidence

Current `clinical-scribe-worker` HEAD: `4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5`.

- `public/scribe.html` explicitly states: competition prototype, synthetic/non-clinical research only, no real patient/PII, not for clinical practice or medical advice.
- Voice input remains the previously-reviewed browser Web Speech API path with typed fallback; no new local-ASR issue is created.
- #4 already scopes validation by specialty / care setting / workflow / language and includes speaker misattribution, negation, omission and unsupported-addition failure classes.
- PR #12 for #4 is currently open and research-only. Its current base is `main @ 4de4e7e...`.
- #7 already covers source-aware section repair, candidate/revision receipts, transcript drift and preservation of reviewed work.
- PR #9 for #7 remains open and research-only.
- #6 still has active security remediation candidates including PR #15; #10 has active CI work. These remain ahead of new clinical product breadth.
- No current owner-approved nursing, real-clinical, EHR-context, patient-data or clinical-action workflow was found.

Contrary evidence matters: #4's existing `workflow` dimension means the Oracle nursing signal does **not** establish a missing role-validation framework. The smallest future step can reuse that contract first.

## Opportunity Map — `clinical-scribe-worker`

| Bucket | Decision | Evidence / reason |
|---|---|---|
| MUST MATCH | Fail-closed identity boundary and honest executing verification | Existing #6/#10; current higher-priority trust/release work. |
| MUST MATCH | Source fidelity, attribution/negation/omission safety and reversible review | Existing #4/#7; directly relevant to generated clinical text. |
| SHOULD BE BETTER | If scope expands beyond the current prototype, validation must be **role/workflow scoped**, not merely specialty scoped | Oracle nursing expansion shows physician-vs-nurse workflow differences; reuse #4 first. |
| DIFFERENTIATOR | Keep source evidence, review state and action authority separate | Fits #4/#7 and current non-clinical safety boundary; reinforced by authorized-context patterns. |
| ADJACENT IDEA | One bounded synthetic nurse/role fixture only after owner authorizes that target workflow | Would test whether current `workflow` field is sufficient before adding schema. |
| DO NOT COPY | EHR ingestion/write-back, orders/coding, nursing product expansion, PHI context store, human-subject telemetry platform | Outside current product direction and adds privacy/safety/maintenance burden. |

## Four-Gate Decision

### Candidate: role/workflow-scoped validation for non-physician clinical documentation

Fingerprint if it ever becomes actionable:

`clinical-scribe-worker + owner-authorized non-physician target workflow + existing specialty validation cannot express role-specific structured fields/review responsibility + synthetic fixture demonstrates ambiguous or wrong validation outcome`

Current classification:

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=LOW / DEFERRED until product scope changes`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`

### Gate 1 — problem / value

Oracle provides strong market evidence that clinical documentation AI is expanding by role, but this repository has no supported nursing or real-clinical workflow. A current user failure is therefore not established. #4 already has a workflow dimension, which is contrary evidence against creating a new abstraction now.

### Gate 2 — priority

No P0/P1/P2 current product severity is established. #6/#10 remain higher priority. #4/#7 are the proper existing evidence/review surfaces. The historical wording `P1 Research` in #4/#7 should be interpreted under Issue Quality v2 as research urgency, not a proven P1 product defect; no active Issue/PR scope was rewritten.

### Gate 3 — minimum approach

Do nothing in product code now. If owner later authorizes a nurse/non-physician use case, first encode one bounded synthetic scenario using the existing #4 `workflow` / `care setting` contract. Add an explicit `role` field only if the fixture proves `workflow` is ambiguous or insufficient. No role engine, template marketplace, EHR integration, new database or generalized clinical workflow framework is justified.

### Gate 4 — research / implementation separation

- **BUILD:** only if an owner-authorized target role exists and a bounded synthetic fixture demonstrates that the current validation contract cannot express the required structured workflow safely.
- **NARROW:** keep role as metadata/value inside the existing workflow pack if that is sufficient.
- **REJECT:** if the product remains synthetic physician-oriented research or the existing workflow dimension fully expresses the needed distinction.

Result: **NO NEW ISSUE.**

## Adjacent Ideas

1. If future scope is authorized, reuse #4/#7 receipts to measure a handful of review/finalization tasks; do not create clickstream telemetry first.
2. Preserve explicit source/support pointers for generated claims and revisions before considering any external patient-context connector.
3. Treat role-specific structured fields as validation metadata before treating them as a new product surface.

## Cross-Portfolio Ideas

One reusable principle is retained without creating cross-repo work: **task role, source context, generated content and action authority are separate dimensions.** Products that ingest context should not infer permission to act, and evaluation should match the actual supported role/workflow rather than a generic persona label.

## Rejected Ideas

- **Create a Nursing Mode now** — rejected: no owner-approved nursing workflow; competitor expansion is not local user evidence.
- **Add an EHR/Epic connector** — rejected: current product explicitly forbids real patient/PII input; OpenAI's product direction does not override local scope.
- **Create a role registry / clinical workflow framework** — rejected: #4 already has workflow/care-setting metadata; no failing fixture proves a new abstraction is required.
- **Build workload telemetry / human-factors platform** — rejected: no authorized clinical cohort and no bounded study question in current scope.
- **Use typing-time reductions as ROI evidence** — rejected: independent studies show different workflow metrics move differently; no local runtime or real-user evidence exists.
- **Reopen local-ASR work because point-of-care voice is growing** — rejected: prior Web Speech analysis already exists, typed fallback remains, and current scope does not establish a local-processing requirement.

## Issue Mapping / Dedupe / Coordination

- #4 specialty/workflow validation: Oracle role-specific signal is adjacent evidence, but PR #12 is open and already owns ValidationPack research. **SKIPPED_LOCKED / report-only; no comment.**
- #7 section repair/revision: source-aware review remains relevant, but PR #9 is open. **SKIPPED_LOCKED / report-only; no comment.**
- #6 authentication boundary: active remediation PRs including #15; untouched.
- #10 CI/security-test gate: active work; untouched.
- No new fingerprint passed all four gates. No existing owner rejection was reopened.

Writes this round: **0 new Issues, 0 Issue edits/comments, 0 PR comments, 0 implementation authorization.**

## Sources

External public web sources — primary intelligence source for this round:

1. Oracle Health — **2026-09-14** — https://www.oracle.com/news/announcement/oracle-health-clinical-ai-agent-helps-nurses-alleviate-documentation-burden-and-streamline-care-2026-09-14/ — `CONFIRMED` first-party strategy/capability signal.
2. OpenAI — **2026-09-01** — https://openai.com/index/chatgpt-connects-health-records-and-healthcare-sources/ — `CONFIRMED` first-party integration/source-traceability signal.
3. Medical Economics — **2026-09-16** — https://www.medicaleconomics.com/view/ai-scribes-cut-documentation-time-by-69-in-simulated-primary-care-visits-study-finds — `CONFIRMED` recent secondary reporting on a constrained simulation; not generalized efficacy evidence.
4. JMIR Medical Informatics — **2026** — https://medinform.jmir.org/2026/1/e84104 — `CONFIRMED` prospective single-group implementation study; useful for separating outcome dimensions, not proof for this product.

Internal GitHub evidence used for product truth, direction and dedupe only:

- `autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` @ blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- `autodev-ng/docs/competitive-intelligence/2026-09-18T100114Z-external-radar.md`.
- `autodev-ng/docs/portfolio-audit/2026-09-18T1100Z-product-board-delta.md`.
- `clinical-scribe-worker` current HEAD `4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5`.
- Current `AGENTS.md`, `README.md`, `public/scribe.html`, Issues #4/#6/#7/#10, PRs #9/#12/#15 and related active work.

## What Changed

1. Oracle's 2026-09-14 nursing release provides new first-party evidence that ambient clinical AI is expanding from physician-note generation into **role-specific, structured point-of-care documentation**.
2. This does not create a current product feature gap because the repo remains synthetic/non-clinical and #4 already has workflow-scoped validation metadata.
3. OpenAI/Epic reinforces context/source traceability, but does not justify ingesting PHI or adding EHR write-back here.
4. Recent independent workflow evidence reinforces a previously established distinction: documentation typing time, editing/review burden, total visit time, clinician workload and patient experience must not be collapsed into one success metric.
5. Historical `P1 Research` wording in #4/#7 is not treated as proven P1 severity under Issue Quality v2; active PR ownership prevents scope rewriting.
6. No duplicate Issue, new framework or implementation authorization was created.

## Completion / Gaps / Cursor

- External exploration completed with recent first-party and independent sources.
- Fresh owner inventory pagination completed: 41 owned / 40 unarchived.
- Focal default branch, current scope, Issues, all-state PRs and prior radar/product-board evidence were checked.
- No live Gemini, Cloudflare Access tenant, deployed Worker, EHR, clinician, patient, PHI, browser/device or human-subject workflow was exercised. Runtime-sensitive conclusions remain **NEEDS_RUNTIME_VERIFICATION**.
- This radar does **not** declare the repository or portfolio CLEAN.
- Next fair-rotation target: `Reese-max/MaterialYouNewTab`.
