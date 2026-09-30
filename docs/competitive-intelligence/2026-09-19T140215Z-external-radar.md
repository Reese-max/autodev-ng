# External Competitive / New-Product / Workflow Radar — 2026-09-19T14:02:15Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY / 0_NEW_ISSUES / 0_TRACKING_WRITES**.
- Owner scope: `Reese-max` only. No third-party repository was modified.
- Issue-quality rules re-read from `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected-owner enumeration returned **41 Reese-max-owned repositories / 40 unarchived**; `obsidian-vault` is the only archived repository returned. The result fit within one `page_size=100` page; no historical inventory was used as the denominator.
- Fair cursor entering this round: `Reese-max/clinical-scribe-worker`, carried from `2026-09-19T115717Z-external-radar.md`.
- Focal default branch rechecked at analysis start: `main@4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5`. Later default-branch changes visible in history remain audit/docs changes; relevant product/security baseline remains `88bb7469508e8732aaff6f21d048c8677823fc04`.
- Owner-approved direction re-read from `docs/portfolio-audit/2026-09-18T1100Z-product-board-delta.md`: **INVEST / SIMPLIFY**. NOW = correct #6 Access trust boundary and #10 execution/canary truth; NEXT = bounded #4 specialty validation and #7 repair/revision research; DO NOT expand into real clinical use, EHR actions, autonomous diagnosis/coding, generic IAM/CI platforms.
- Existing active scope was rechecked before deciding on writes. PR #15 for #6 and PR #12 for #4 are currently open; #14/#13/#11/#9/#8/#5 are also existing candidate scopes found in the all-state PR search. This radar does not take over any active implementation/research scope.
- No live Cloudflare Access tenant, deployed Worker, Gemini provider call, browser/device, clinician, patient, EHR, PHI, billing path or production mutation was exercised. No runtime claim is made beyond GitHub/default-branch evidence explicitly cited below.

## Executive decision

This round found **useful external evidence, but no new finding crosses the Issue gate**.

Three signals matter:

1. **CHAI's vendor-neutral Ambient AI Testing & Evaluation Framework** independently supports the repo's existing #4 direction: clinical-documentation evaluation should be split across usability/efficacy, fairness, safety/reliability, privacy and operational/business dimensions, and benchmark values are not universal pass/fail cut points. Specialty/workflow/local baseline matters.
2. **Google released Gemini 3.8 Flash on 2026-09-02 and Gemini 3.8 Live on 2026-09-15**, while the repo still defaults to `gemini-3.6-flash`. Google's current deprecation table also says **no shutdown date is announced for 3.6 Flash**, so a newer model does not create an urgent migration defect.
3. **Abridge expanded to roughly 4,000 clinicians at BJC Health/WashU on 2026-09-02 after a pilot/evaluation**, reinforcing the market shift toward measured rollout rather than “new model = deploy broadly.” This is vendor-originated evidence and is not treated as independent proof of efficacy.

The smallest product decision is therefore **no implementation change now**. Keep #6/#10 ahead of expansion. When #4's existing active scope becomes available for owner review, use the current synthetic validation packs to compare candidate models/prompts and keep specialty/workflow-specific receipts. Do not create a generic healthcare benchmark framework, auto-upgrade model versions, or infer clinical readiness from a vendor rollout.

---

# Product → market category

| Product | Market / substitutes | Current differentiated job |
|---|---|---|
| `clinical-scribe-worker` | Dragon Copilot, Abridge, Suki, Nabla, other ambient/clinical documentation tools | Synthetic/non-clinical clinical-documentation prototype with explicit review, source/safety evidence, bounded security/cost controls and research-oriented validation |

Current owner posture is not “match the broadest ambient-scribe suite.” It is to make trust boundaries and evidence truthful before widening clinical/product scope.

# External Signals

## A. CONFIRMED — CHAI Ambient AI T&E says benchmark values are references, not universal gates

**Release: 2026-07-15. Checked: 2026-09-19.**

Primary sources:
- https://www.chai.org/blog/coalition-for-health-ai-chai-releases-new-implementation-playbook-and
- https://rai-content.chai.org/en/latest/Ambient-AI/t%26e-framework.html

CHAI released a vendor-agnostic Ambient AI Implementation Playbook and Testing & Evaluation Framework. The T&E framework organizes methods/metrics across usefulness/usability/efficacy, fairness/bias, safety/reliability, privacy, and business/financial considerations. Its explicit note is important for this repository: listed benchmark values are **reference points rather than universal pass/fail thresholds**, and expected performance varies by care setting, specialty, workflow and patient population; local baselines and threshold revisiting are recommended.

Relevant metric families include documentation completeness/correctness, clinically significant error proportions, omission, medical-term recall, clinician review/sign-off enforcement, retention/privacy controls and per-encounter control evidence.

### Transferable product principle

`ValidationPack` evidence should answer **which specialty/workflow/failure class was exercised under which model/prompt/parser revision**, not manufacture one portfolio-wide “safe score.” Existing #4's `UNTESTED`, per-pack receipt and safety-critical BLOCK direction fits this well.

### Counterevidence / limit

CHAI guidance does **not** prove this repo has a new clinical defect, nor does it authorize production clinical use. The current product is synthetic/non-clinical; no real-clinical local baseline exists here. Do not turn the framework into a mandatory telemetry/benchmark platform.

### Decision

`SHOULD BE BETTER / DEDUP #4 / SKIPPED_LOCKED`.

Under Issue Quality v2, the old #4 wording `P1 Research` should not be interpreted as a confirmed P1 product defect. The radar's normalized classification is:

- kind: `RESEARCH`
- severity: `NOT_ESTABLISHED`
- decision_priority: `MEDIUM_HIGH`
- triage: `NEEDS_EVIDENCE`
- auto_implementation: `false`

No Issue comment/edit was made because #4 has active PR #12 (and existing PR #5 scope) and unresolved review work.

---

## B. CONFIRMED — Google has newer stable Gemini Flash, but 3.6 Flash is not currently sunset

**Release dates / current status checked 2026-09-19.**

Primary source:
- https://ai.google.dev/gemini-api/docs/deprecations

Google's current model lifecycle table lists:

- `gemini-3.8-flash` — available **2026-09-02**, no shutdown date announced;
- `gemini-3.8-live` — available **2026-09-15**, no shutdown date announced;
- `gemini-3.6-flash` — available **2026-07-21**, **no shutdown date announced**.

The repository README currently defaults to `gemini-3.6-flash`.

### User job / possible value

A maintainer eventually needs to decide whether a newer model improves the supported synthetic note/differential workflow without regressing omission, attribution, negation, source fidelity, latency/cost behavior or output contract.

### Contrary evidence first

There is no provider deprecation forcing a move, no current repo evidence that 3.6 Flash fails the supported task, and #4 already owns the correct bounded model/prompt validation surface. Therefore “3.8 exists” is not value evidence by itself.

### Minimum future experiment

After #6/#10 trust/release gates are credible and #4's active pack work is reviewable:

1. run the same small synthetic validation-pack fixture on current 3.6 and candidate 3.8;
2. keep prompt/parser fixed;
3. compare per-pack failure classes plus explicit provider call/cost scope;
4. BUILD/NARROW only if a decision-relevant difference appears; otherwise keep 3.6.

No automatic model switch, provider router, model registry, benchmark farm or new Issue is justified now.

### Decision

`ADJACENT IDEA / RESEARCH CANDIDATE ONLY / NO ISSUE`.

---

## C. CONFIRMED vendor signal — Abridge scaled after a measured pilot

**Event date: 2026-09-02. Checked: 2026-09-19.**

Primary source:
- https://www.abridge.com/press-release/bjchealth-washumedicine-expand-abridge

Abridge says BJC Health/WashU expanded access to about 4,000 clinicians after an earlier pilot and evaluation that examined documentation time and physician/patient experience. This is a meaningful direct-competitor rollout pattern, but it is vendor-originated and cannot be used as independent efficacy proof or as an incident/prevalence estimate.

### Transferable workflow principle

Expansion should follow evidence matched to the deployment claim. For this repo, the analogous sequencing is already correct:

`security/release truth → synthetic content validation → bounded repair/review evidence → only if clinical scope is explicitly authorized, governed human/workflow evidence`.

### Do not copy

Do not infer that this synthetic prototype should support thousands of clinicians, add EHR integration, collect real patient data, or build deployment analytics.

### Decision

`DIFFERENTIATOR SUPPORT / NO NEW WORK`.

# New Releases / strategy changes

| Date | Signal | Implication | Decision |
|---|---|---|---|
| 2026-09-15 | Gemini 3.8 Live available | new provider capability exists | no use-case evidence for this repo; no switch |
| 2026-09-02 | Gemini 3.8 Flash available | candidate model for future bounded comparison | reuse #4, no new Issue |
| 2026-09-02 | Abridge BJC/WashU expansion to ~4,000 clinicians after pilot/evaluation | rollout tied to measured workflow evidence | supports existing evidence-first sequencing |
| 2026-07-15 | CHAI Ambient AI Implementation Playbook + T&E Framework | independent vendor-neutral evaluation categories; no universal threshold | calibrate #4 conceptually, do not build framework |

No newer first-party direct-competitor announcement discovered this round materially overturns the 2026-09-18 clinical-scribe radar (Suki/MedStar human-factors strategy, Dragon review surface, specialty/privacy evidence).

# Community Pain

No new Reddit/community anecdote was promoted to decision-grade evidence. This round already has first-party provider/competitor sources plus a vendor-neutral healthcare-AI framework. Community anecdotes would not establish incidence, severity or clinical effectiveness and were not used to manufacture an Issue.

# Adjacent Ideas

## 1. Candidate-model comparison as a consumer of existing validation packs

This should remain a tiny experiment, not a new model-management system. Exact prompt/parser/fixture must remain fixed so the model change is actually what is being tested.

## 2. Separate test coverage from deployment claims

CHAI's categories reinforce a useful boundary already present in the repo: synthetic completeness/correctness testing can support only the exercised content path. It cannot stand in for real clinician workload, consent, privacy configuration, deployment integration or patient-safety outcomes.

# Opportunity Map — `clinical-scribe-worker`

| Bucket | Decision | Evidence / rationale |
|---|---|---|
| **MUST MATCH** | Correct fail-closed Access authentication and honest CI/canary execution evidence | current #6/#10 and owner board; higher priority than competitor feature matching |
| **MUST MATCH** | Explicit `UNTESTED` / per-pack truth instead of aggregate safety claims | existing #4 direction + CHAI local/specialty/workflow calibration principle |
| **SHOULD BE BETTER** | Candidate model/prompt changes must be compared on the same bounded failure-class evidence before promotion | Gemini 3.8 availability makes this decision recurring; #4 is the existing consumer |
| **DIFFERENTIATOR** | Evidence-first boundary that clearly separates synthetic content validation, repair/review evidence and any later real-world evidence | owner direction + CHAI + recent competitor rollouts |
| **ADJACENT IDEA** | Gemini 3.8 Flash comparison after trust/release gates | candidate opportunity only; no shutdown or current failure forces migration |
| **DO NOT COPY** | auto-upgrade to newest model, EHR/clinical expansion, universal “safe score”, generic benchmark platform, telemetry warehouse | no current supported-job evidence; excessive scope/authority |

# Four-gate decisions

## Candidate A — create a new CHAI-style evaluation framework

### Gate 1 — problem / value

The framework is valuable external guidance, but the concrete repo job is already represented by #4's specialty/failure-class validation packs. “We do not have a CHAI framework” is not a root cause.

### Gate 2 — priority

`RESEARCH / NOT_ESTABLISHED / MEDIUM_HIGH / NEEDS_EVIDENCE`. No P0/P1/P2 product severity follows from framework absence.

### Gate 3 — minimum solution

No new system. When #4 is next owner-reviewed, keep its existing per-pack receipt, `UNTESTED`, failure-class and model/prompt/parser version concepts; calibrate interpretation to local/specialty/workflow context and avoid universal performance thresholds.

### Gate 4 — research/implementation separation

Existing PR #12/#5 are active. External evidence goes to this central report only. No new Issue/comment/implementation authority.

**Decision: DEDUP / SKIPPED_LOCKED.**

## Candidate B — upgrade default model from Gemini 3.6 Flash to 3.8 Flash

### Gate 1 — problem / value

No current failure or announced 3.6 shutdown is established. A newer version may be better, equal or worse for this particular structured clinical drafting contract.

### Gate 2 — priority

`OPPORTUNITY / NOT_ESTABLISHED / LOW-MEDIUM / NEEDS_EVIDENCE`.

### Gate 3 — minimum solution

No code change. Future bounded A/B through #4's same synthetic packs is smaller and safer than a default-model edit.

### Gate 4 — research/implementation separation

A favorable comparison would support a later explicit decision; it would not itself authorize production/default-model mutation.

**Decision: CENTRAL CANDIDATE ONLY / NO ISSUE.**

# Issue Mapping / dedupe / coordination

- **0 new Issues.**
- **0 Issue edits/comments.**
- **0 PR comments/reviews.**
- **0 implementation authorization.**
- #4 specialty validation: external CHAI/model signals map here; PR #12 is currently open and existing PR #5 already owns implementation/research scope. `SKIPPED_LOCKED`.
- #7 section repair/revision: no new independent root cause. Existing PR #9 owns scope; untouched.
- #6 Access cryptographic verification: PR #15 is currently open; product-board pre-merge findings already exist. Untouched.
- #10 executing CI/provider-canary truth: existing candidate PRs; untouched.
- No new model-upgrade Issue because `gemini-3.6-flash` is not currently sunset and #4 is already the correct validation consumer.
- No second “evaluation framework” Issue because CHAI is external guidance, not a distinct validated workflow gap.

No lock marker was written because this run made no Issue/shared-state mutation. Avoiding a lock/comment on active scopes is intentional coordination, not a missed write.

# Rejected Ideas

1. **Create a CHAI compliance/evaluation framework repo/module.** Rejected: framework absence is not the root problem; #4 already represents the bounded validation job.
2. **Raise #4 to P1 because CHAI treats ambient AI safety seriously.** Rejected: Issue Quality v2 separates research urgency from confirmed severity; this repo has no authorized real-clinical workflow.
3. **Switch to Gemini 3.8 immediately.** Rejected: newer does not mean better for the supported structured output, and 3.6 has no announced shutdown date.
4. **Add a provider/model router to compare many Gemini models.** Rejected: one controlled A/B is enough to answer the current decision.
5. **Use Abridge's rollout as proof of clinical efficacy or ROI.** Rejected: vendor rollout/claims are not independent effect estimates and do not transfer to this prototype.
6. **Expand to real clinical deployment so human-factors metrics can be collected.** Rejected: directly violates current owner-approved scope and introduces PHI/consent/regulatory obligations without authorization.
7. **Add one universal safety score.** Rejected: CHAI explicitly says performance varies by setting/specialty/workflow/population and benchmark references are not universal cut points.

# Cross-portfolio ideas

One bounded reusable principle is retained without creating cross-repo work:

> **A newer provider/model/version should enter through the product's existing evidence contract, not bypass it.**

This can apply elsewhere only when the repo already has a concrete acceptance/evidence path. It does not justify a central model-registry/benchmark framework.

# Sources

External public web sources (primary intelligence source this round):

1. CHAI — Ambient AI Implementation Playbook + Testing & Evaluation Framework announcement — **2026-07-15**, checked 2026-09-19: https://www.chai.org/blog/coalition-for-health-ai-chai-releases-new-implementation-playbook-and
2. CHAI — Ambient AI Testing & Evaluation Framework — current, checked 2026-09-19: https://rai-content.chai.org/en/latest/Ambient-AI/t%26e-framework.html
3. Google AI for Developers — Gemini model lifecycle/deprecations; `gemini-3.8-flash` 2026-09-02, `gemini-3.8-live` 2026-09-15, `gemini-3.6-flash` 2026-07-21; no shutdown date currently announced for these entries — checked 2026-09-19: https://ai.google.dev/gemini-api/docs/deprecations
4. Abridge — BJC Health/WashU expansion to ~4,000 clinicians — **2026-09-02**, checked 2026-09-19: https://www.abridge.com/press-release/bjchealth-washumedicine-expand-abridge

Internal GitHub evidence used only for product truth, direction, dedupe and coordination:

- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` @ blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-18T1100Z-product-board-delta.md`.
- `Reese-max/autodev-ng/docs/competitive-intelligence/2026-09-18T100114Z-external-radar.md`.
- `Reese-max/autodev-ng/docs/competitive-intelligence/2026-09-19T115717Z-external-radar.md` for fair-cursor continuation.
- `Reese-max/clinical-scribe-worker@4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5`.
- Current README, `docs/audits/50-persona-round-4-2026-09-14.md`, Issues #4/#6/#7/#10 and all-state PR search.
- PR #12 confirmed open at head `545bbf516f1726e3bb3488065fc20b5784eb589e`; PR #15 confirmed open at head `1bb5171507fc91fbba53bfaf557ea90226a41ce7`.

# What Changed

1. Added a new-to-this-radar vendor-neutral evidence source: CHAI's Ambient AI T&E framework supports specialty/workflow/local-baseline interpretation and explicitly warns against universal benchmark cut points.
2. Google now has newer Gemini 3.8 Flash/Live releases, but current provider documentation does **not** establish a forced migration from the repo's 3.6 Flash default.
3. Abridge's recent scaled rollout reinforces evidence-before-expansion but does not establish a new product requirement here.
4. No source overturns the current owner direction: #6/#10 trust/release truth first, then bounded #4/#7 research.
5. No new Issue or existing active scope was modified.

# Grading / scope calibration

- Legacy #4 wording `P1 Research` is not used as a confirmed P1 severity in this report. Under Issue Quality v2 the decision is `RESEARCH / NOT_ESTABLISHED`, with separate `decision_priority=MEDIUM_HIGH`.
- Missing real clinical/human-factors evidence remains a boundary on claims, not proof the synthetic product is broken.
- A new Gemini model is an opportunity input, not an implementation mandate.
- CHAI benchmark values are not imported as hard product thresholds; only the evidence structure/principle is retained.

# Completion / gaps / cursor

- External exploration: completed with public-web primary sources across direct competitor, adjacent vendor-neutral workflow/evaluation guidance and provider technology change.
- Fresh owner inventory: completed, 41 owned / 40 unarchived.
- Current focal default branch, owner direction, historical radar, Issues and active PR scope: checked.
- Runtime: **NEEDS_RUNTIME_VERIFICATION** for all deployed/provider/clinical paths because none was executed in this round.
- Notification threshold: **not met**. The new evidence supports/refines existing direction but does not create a high-value new product opportunity, major strategy reversal, validated cross-project implementation capability, or evidence that overturns owner direction.
- Next fair-rotation target: `Reese-max/cyber-prep-coach`.
