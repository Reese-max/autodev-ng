# External Competitive / New-Product / Workflow Radar — 2026-09-25T14:01:25Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY / MATERIAL_STRATEGY_SIGNAL / 0_NEW_ISSUES**.
- Primary intelligence source this round was the public web outside Reese-max GitHub. GitHub was used for current product truth, owner direction, duplicate/ownership checks and this durable report.
- Governing gate re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`; rules blob SHA **`8167e10798071d2276addaff6b201c6b0e904a2a`**.
- Fresh connected-owner pagination completed: **42 Reese-max-owned repositories / 41 unarchived**. `obsidian-vault` is archived and excluded. The second page was empty; no old inventory was used as the denominator.
- Fair-rotation focus: **`Reese-max/clinical-scribe-worker`**.
- Focal default branch rechecked before report write: **`main@4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5`**. The latest substantive product/security baseline remains `88bb7469508e8732aaff6f21d048c8677823fc04`; later default-branch commits are audit documentation.
- Owner-approved Product Board posture remains **INVEST / SIMPLIFY**. NOW = fix the authenticated trust boundary (#6) and honest executing CI/provider evidence (#10). NEXT = bounded specialty validation (#4) and section repair/revision (#7). DO NOT = expand into real-clinical use, EHR actions, autonomous diagnosis/coding, generic IAM/CI infrastructure or other clinical breadth before those contracts are trustworthy.
- Current product boundary remains **competition prototype / synthetic and non-clinical research only**. Real patient data/PII, clinical care and production EHR workflows are outside the approved scope.
- Active scope remains visible in open PRs: #6 → PRs #15/#13/#8; #10 → PRs #14/#11; #4 → PRs #12/#5; #7 → PR #9. This radar did not rewrite, comment on or take ownership of those scopes.
- No provider call, paid request, Cloudflare tenant, deployed Worker, browser/device, clinician/patient, EHR, PHI, CI rerun, merge, deployment, worker/GOAL, product source/config/secret/permission/settings mutation was performed.

## Executive decision

**0 new Issues. 0 Issue/PR comments. 0 scope changes. 0 implementation authorizations.**

The strongest new public signal since the previous clinical-scribe radar is **Abridge's 2026-09-22 selection under the U.S. Department of Veterans Affairs ambient-AI enterprise contract**. Abridge says it is already operating on both VA EHR environments (VistA/CPRS and the Federal EHR), at more than 75 VA medical centers, across primary care, multiple specialties and virtual Clinical Resource Hubs. The contract is a multiple-award vehicle with a total ceiling shared across eligible vendors, so the ceiling must not be treated as Abridge revenue.

This is a major category signal because ambient documentation is moving from pilot tooling toward **cross-environment clinical infrastructure**: consistent context, workflow fit, security authorization, specialty/language coverage and continuity across an EHR migration matter alongside note generation.

For `clinical-scribe-worker`, however, this **does not justify EHR integration or real-clinical deployment work**. The current product is explicitly synthetic/non-clinical, and its highest-priority local failures remain #6/#10. The smallest transferable principle is only: **if owner scope ever expands to a supervised deployment, deployment evidence must be bound to the exact environment/version/specialty/language and must preserve the same source-linked review boundaries already being developed in #4/#7.**

A second fresh signal is the **2026-09-23 Scientific Reports** study of an ambient scribe across more than 2.3 million outpatient consultations and 45 specialties in a Spanish healthcare network. It reports improved readability and structured documentation quality, and manually audits safety-related fields such as medical history and allergies. This is useful evidence that **multi-specialty evaluation plus explicit safety-element auditing** is a real product/evaluation pattern. It is not independent proof for this repository: the study is retrospective, the structured-quality sample is much smaller than the total consultation count, and all authors are employees of the healthcare network where the Scribe system was developed/deployed.

The study therefore strengthens #4's existing specialty-scoped validation direction, but it does not raise #4 to a proven P1/P2 product defect and does not authorize a new evaluation platform.

---

## Product → market category

| Product | Direct / adjacent market category | Current supported job |
|---|---|---|
| `clinical-scribe-worker` | ambient/clinical documentation prototype; synthetic note validation; review/repair research | synthetic transcript/profile → differential + source-constrained SOAP draft → explicit human review/evidence, with no real-patient or autonomous clinical authority |

## External Signals

### A. Direct competitor strategy — Abridge crosses from pilot to VA enterprise deployment

**Status:** CONFIRMED first-party announcement.  
**Event date:** 2026-09-22.  
**Checked:** 2026-09-25.  
**Source:** https://www.abridge.com/press-release/va-enterprise-contract

Abridge says the VA enterprise contract allows VA medical centers and regions to procure its ambient AI, and that the platform is already operational on both the legacy VistA/CPRS environment and Federal EHR, serving thousands of clinicians at more than 75 medical centers. Abridge also states support for 28+ languages across specialties and care settings.

Important evidence boundary:
- the **$775.72M / five-year** figure is the ceiling of the **multiple-award contract across eligible vendors**, not established Abridge revenue;
- deployment and outcome claims are vendor-originated unless independently supported;
- nothing here demonstrates the same scale, quality or safety for this repository.

**User job solved:** health systems need documentation/intelligence to remain usable across specialties, facilities, virtual settings and an EHR migration without asking clinicians to re-learn or re-enter context at each boundary.

**Concrete manual work reduced:** repeated onboarding, context reconstruction and environment-specific workflow switching.

**Transferable pattern:** capability is not deployment evidence. A deployment receipt should identify the actual environment and supported workflow, not merely a model/version name.

**What fits here:** only a future evidence rule: if owner later authorizes a supervised deployment, bind validation to environment + product revision + specialty/language + source/review contract.

**What not to copy:** VA/EHR connectors, cross-system patient context, real-PHI storage, nationwide deployment infrastructure, multilingual clinical support or clinical decision support. None is an approved current job.

**Decision:** `MAJOR_STRATEGY_SIGNAL / NO_NEW_LOCAL_ROOT_CAUSE / NO_NEW_ISSUE`.

### B. New independent-ish evaluation evidence — large multi-specialty documentation study

**Status:** CONFIRMED peer-reviewed publication with declared conflicts/limitations.  
**Published:** 2026-09-23.  
**Checked:** 2026-09-25.  
**Source:** https://www.nature.com/articles/s41598-026-72180-z

The Scientific Reports study analyzes more than 2.3 million outpatient consultations across 45 specialties from Oct 2024 to Dec 2025. It reports improved readability and structured quality for notes produced with the scribe. A manual audit also evaluates completeness of safety-relevant elements such as medical history and allergies.

Limits that matter:
- the report-quality evaluation uses a stratified sample of 300 reports across 15 specialties, not all 2.3M consultations;
- authors are employees of the healthcare network where the Scribe system was developed/deployed;
- observational association is not proof that this repository/model/prompt would reproduce the effect;
- the study does not validate this product's source fidelity, speaker attribution, negation handling or revision lifecycle.

**User job solved:** organizations evaluating a scribe need to know whether quality changes are consistent across specialties and whether important safety fields are omitted, not just whether a generic note “looks good.”

**Concrete manual work reduced:** ad-hoc spot checking without an explicit multi-specialty/safety-element rubric.

**Transferable pattern:** versioned specialty packs + explicit safety-element audits + clear sample coverage.

**Repository mapping:** this is already the root job of #4 (specialty-scoped validation; omission/misattribution/negation/temporal checks). PRs #12/#5 are active.

**Decision:** `SUPPORTS_EXISTING_#4 / SKIPPED_ACTIVE_SCOPE / NO_COMMENT`.

### C. Adjacent research-platform signal — ambient-AI vendors are standardizing evaluation, not only adding features

**Status:** CONFIRMED first-party strategy, already known from the prior clinical radar.  
**Published:** 2026-09-10 / 2026-09-17.  
**Checked again:** 2026-09-25.  
**Sources:**
- https://www.suki.ai/press-releases/suki-launches-science-at-suki-to-set-a-new-standard-for-healthcare-ai/
- https://www.suki.ai/press-releases/suki-and-med-star-health-s-national-center-for-human-factors-in-healthcare-partner-to-pioneer-the-science-of-ambient-ai-adoption/

Suki's current research program separates model/content quality from implementation, human factors, adoption, workflow and real-world impact.

This is **not new enough to trigger another local proposal**. It is retained only as corroborating strategy context: a synthetic note-quality pass is not a substitute for a future real-clinical workflow study, and the current repo is not authorized for such a study.

**Decision:** `KNOWN_SIGNAL / NO_CHANGE`.

## New Releases / recent changes

| Date | Product / source | Signal | Current decision |
|---|---|---|---|
| 2026-09-22 | Abridge / VA enterprise announcement | Ambient AI moves into a cross-EHR, multi-site enterprise procurement/deployment shape | material category strategy signal; no current local implementation |
| 2026-09-23 | Scientific Reports | Large multi-specialty retrospective documentation-quality analysis with explicit safety-element audit | strengthens #4 validation direction only |
| 2026-09-10 / 09-17 | Suki | Standardized evaluation + human-factors research program | previously known; no duplicate work |

No pricing signal is used for prioritization because the current repository has no validated monetization/procurement job.

## Community Pain

A representative 2026-07 community discussion reports AI-scribe errors around bilateral exams and associating plans with the wrong body part. This is **COMMUNITY_SIGNAL only**, not prevalence evidence and not a current-version reproduction.

Source: https://www.reddit.com/r/medicalscribe/comments/1urlzuw/doctors_whove_tried_an_ai_scribe_and_stopped_what/

The described failure class maps directly to #4's speaker/attribution and specialty-context validation work. It is therefore a duplicate signal, not a new Issue.

## Adjacent Ideas

### 1. Environment-bound validation receipt — only if intended use expands

If a future owner-approved supervised pilot ever exists, the smallest evidence object should bind:
- product/model/prompt/parser revision;
- deployment environment / integration mode;
- specialty/language;
- exact validation pack;
- known unsupported/untested states;
- human-review requirement;
- timestamp and result.

This is an **ADJACENT IDEA**, not a current implementation requirement. Do not create a deployment registry, EHR adapter framework or compliance database before there is an authorized deployment question.

### 2. Keep “content quality” and “deployment readiness” separate

The new study can support an evaluation method; Abridge's VA deployment can support a deployment-strategy observation. Neither proves the other. A high-quality synthetic note test is not evidence that an EHR integration, identity boundary, security authorization or real clinical workflow is production-ready.

## Opportunity Map — `clinical-scribe-worker`

| Bucket | Decision |
|---|---|
| **MUST MATCH** | #6 cryptographic identity trust; #10 actual CI/security-path execution; explicit human review/source evidence for generated clinical content |
| **SHOULD BE BETTER** | Versioned multi-specialty validation with explicit omission/misattribution/safety-element coverage — already #4 |
| **SHOULD BE BETTER** | Bounded section repair preserving reviewed work and stale-input/revision receipts — already #7 |
| **DIFFERENTIATOR** | Synthetic-first, source-aware, fail-closed evidence boundaries instead of prematurely claiming clinical deployment readiness |
| **ADJACENT IDEA** | If intended use later changes, environment-bound validation receipts for exact integration/specialty/language |
| **DO NOT COPY** | VA/EHR integration, cross-system PHI context, nationwide deployment, multilingual clinical claims, autonomous diagnosis/CDS/coding, billing/revenue cycle, generic clinical platform architecture |

## Four-Gate Review

### Candidate — cross-environment / deployment-portability evidence

Proposed future fingerprint if it ever becomes actionable:

`clinical-scribe-worker + explicitly authorized supervised clinical pilot + same supported drafting/review workflow must operate across a named integration/environment + current validation evidence cannot identify whether that exact path was exercised + operator must manually reconstruct environment/version/specialty/language support before trusting a result`

### 1. Problem / value

Abridge demonstrates a real enterprise job: clinical AI must survive heterogeneous environments and migration. **This repo has no supported real-clinical or EHR-integrated workflow**, so there is currently no local user breakpoint to solve.

Gate result: **problem/value NOT ESTABLISHED for current scope**.

### 2. Priority

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: LOW
evidence: NEEDS_EVIDENCE
triage: DEFERRED
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

A direct competitor's enterprise contract does not convert an out-of-scope integration into P2/P1.

### 3. Minimum solution

**Do nothing in product code now.**

If intended use later changes, start with one synthetic/prod-equivalent fixture for one explicitly authorized environment and reuse #4/#7 receipts. Add only the minimum fields required to prove which path was evaluated.

Do not begin with:
- FHIR/EHR connector framework;
- deployment registry;
- patient-context store;
- multi-language clinical rollout;
- background synchronization service;
- compliance dashboard;
- new database solely for “enterprise readiness.”

### 4. Research / implementation separation

- **BUILD later:** only if owner authorizes a supervised deployment question and one bounded fixture shows current receipts cannot distinguish the exact supported path.
- **NARROW:** if environment metadata on an existing receipt is enough.
- **REJECT:** if the product remains synthetic/non-clinical.

**Decision: DEFER / CENTRAL REPORT ONLY.**

## Issue Mapping / dedupe / coordination

| External signal | Existing owner / scope | Result |
|---|---|---|
| Multi-specialty + safety-element evaluation | #4; PRs #12/#5 | DEDUPE; SKIPPED_ACTIVE_SCOPE |
| Bilateral/body-part misattribution community signal | #4 | DEDUPE; no prevalence claim |
| Source-linked candidate/review/revision | #7; PR #9 | existing direction; no scope change |
| Deployment/security authorization lessons | #6/#10 remain higher-priority current trust/release work | no new issue |
| Cross-EHR enterprise rollout | no current supported local workflow | DEFER; no issue |

**Writes this round:** 0 new Issues; 0 Issue modifications/comments; 0 PR comments; 0 implementation authorization. No issue lock was required because no existing Issue/PR/shared tracker was modified.

## Rejected Ideas

- **Build VA/EHR integration because Abridge won enterprise distribution** — rejected: current product is synthetic/non-clinical and has no validated integration job.
- **Create an “Enterprise Readiness Framework”** — rejected: architecture before an authorized deployment question.
- **Turn the 2026-09-23 study into a claim that this product is safe/effective** — rejected: different system, observational design, declared organizational conflicts and limited manual-audit sample.
- **Open another specialty-validation Issue** — rejected: #4 already owns the same root job and has active PRs.
- **Raise #4/#7 to P1/P2 severity because competitors publish research** — rejected: research/market importance is not proven local severity.
- **Add real-user telemetry now** — rejected: no authorized clinical-user workflow, and privacy/scope cost would be unjustified.

## Cross-portfolio ideas

One reusable principle survives without a new cross-repo framework: **bind consequential AI claims to the exact path that produced them** — source revision, model/prompt version, environment, validation set and human decision. Reuse only when another repository has the same validated root job; do not create a central platform from this one signal.

## Sources

External public web sources:

1. Abridge — VA enterprise contract — **2026-09-22**  
   https://www.abridge.com/press-release/va-enterprise-contract  
   Status: `CONFIRMED_FIRST_PARTY`. Vendor deployment claims; multiple-award contract ceiling is not Abridge revenue.

2. Álvaro de la Parra et al., Scientific Reports — **published 2026-09-23**  
   https://www.nature.com/articles/s41598-026-72180-z  
   Status: `CONFIRMED_PEER_REVIEWED_WITH_DECLARED_CONFLICTS`. Retrospective multi-specialty study; does not validate this repo.

3. Suki — Science at Suki — **2026-09-10**  
   https://www.suki.ai/press-releases/suki-launches-science-at-suki-to-set-a-new-standard-for-healthcare-ai/  
   Status: `CONFIRMED_FIRST_PARTY / KNOWN_PRIOR_SIGNAL`.

4. Suki + MedStar human-factors collaboration — **2026-09-17**  
   https://www.suki.ai/press-releases/suki-and-med-star-health-s-national-center-for-human-factors-in-healthcare-partner-to-pioneer-the-science-of-ambient-ai-adoption/  
   Status: `CONFIRMED_FIRST_PARTY / KNOWN_PRIOR_SIGNAL`.

5. Reddit medical-scribe discussion — **2026-07-09 onward**  
   https://www.reddit.com/r/medicalscribe/comments/1urlzuw/doctors_whove_tried_an_ai_scribe_and_stopped_what/  
   Status: `COMMUNITY_SIGNAL` only; not prevalence or current-version reproduction.

Internal product/dedupe evidence:

- `autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` @ blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- `autodev-ng/docs/portfolio-audit/2026-09-18T1100Z-product-board-delta.md`.
- Prior clinical radar `autodev-ng/docs/competitive-intelligence/2026-09-21T180021Z-external-radar.md`.
- `clinical-scribe-worker/main@4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5`.
- Existing open Issues #4/#6/#7/#10 and open PRs #5/#8/#9/#11/#12/#13/#14/#15.

## What Changed

1. **New major direct-competitor deployment signal:** Abridge moved into a VA-wide enterprise procurement/deployment vehicle on 2026-09-22, with current vendor-reported operation across both VA EHR environments and more than 75 medical centers.
2. **New evaluation evidence:** a 2026-09-23 Scientific Reports paper adds large-scale multi-specialty documentation-quality evidence and explicit safety-element auditing, with important conflict/sample limitations.
3. These signals **strengthen existing #4/#7 principles but do not establish a new local root cause**.
4. Current sequencing is unchanged: #6/#10 trust/release correctness remains ahead of #4/#7 research; real clinical/EHR scope stays excluded.
5. No issue inflation, no severity inflation, no new implementation authority.

## Completion / gaps / cursor

- External A/B/C exploration: completed with recent first-party, peer-reviewed and community sources.
- Current owner direction/default-branch/open Issue/open PR/historical radar dedupe: completed.
- Fresh full repository pagination: completed, **42 visible / 41 unarchived**.
- Runtime/user/deployment validation: **not performed**. External source claims remain strategy/evaluation evidence only.
- No portfolio CLEAN claim.
- Next fair-rotation cursor: **`Reese-max/MaterialYouNewTab`**.
