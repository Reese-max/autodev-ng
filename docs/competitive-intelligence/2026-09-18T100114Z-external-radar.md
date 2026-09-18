# External Competitive Radar — 2026-09-18T10:01:14Z

Status: **COMPLETE**

## Scope / Direction Check

- Issue quality rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected owner inventory: **41 Reese-max-owned repositories / 40 unarchived**. `obsidian-vault` is archived and excluded. This run used the current connected listing rather than an older inventory as the universe.
- Fair-rotation primary repo: `Reese-max/clinical-scribe-worker`
- Current default branch: `main`
- HEAD rechecked before this report: `4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5` (`docs: record round 4 CI regression evidence`, 2026-09-13). Recent product/security implementation baseline remains `88bb7469508e8732aaff6f21d048c8677823fc04`; later default-branch commits visible in the current history are audit documentation.
- No dedicated current owner-approved product-board document was found on the repo default branch. Scope was therefore bounded by current README/UI/AGENTS, the current 50-persona audit, existing Issues/PRs, and the prior external radar. The product currently presents Clinical Scribe as a **competition prototype for synthetic data and non-clinical research**, explicitly forbids real patient data/PII, and says it must not be used for clinical practice or medical advice.
- Existing high-priority work remains ahead of product expansion: #6 Cloudflare Access cryptographic verification and #10 executing CI/security-test gate. Current open PRs include #15/#13/#8 for #6, #14/#11 for #10, #12/#5 for #4 specialty validation, and #9 for #7 section-scoped repair. This radar did not modify or comment on those active scopes.
- Historical `2026-09-15T095812Z-external-radar.md` was re-read. It already evaluated Suki dictation-vs-ambient packaging, Abridge downstream evidence, Web Speech local-vs-remote processing, and the regulatory intended-use boundary. Those signals were not repackaged as new work.

## Product → Market Category

1. Ambient / clinical documentation: Suki, Dragon Copilot, Nabla, Abridge.
2. Clinical documentation quality / specialty validation: current #4 scope.
3. Review / repair / version lifecycle: current #7 scope.
4. Human-factors / implementation science: newly strengthened by Suki + MedStar on 2026-09-17.
5. Local / privacy-sensitive clinical speech systems: adjacent evidence only while this repo remains synthetic/non-clinical.

The radar does not treat competitor presence as a feature requirement.

## External Signals

### 1. CONFIRMED — Suki + MedStar shift evaluation from surface metrics to human-factors / implementation science

**Event date: 2026-09-17. Checked: 2026-09-18.**

Source: https://www.suki.ai/press-releases/suki-and-med-star-health-s-national-center-for-human-factors-in-healthcare-partner-to-pioneer-the-science-of-ambient-ai-adoption/

Suki and MedStar Health’s National Center for Human Factors announced a research collaboration explicitly framed as the **“Science of Use.”** Their announced research pillars include adoption, clinician/trainee/patient experience, administrative burden, clinical reasoning, patient-provider interaction, patient safety and care quality, using mixed quantitative and qualitative methods in real clinical environments.

This is a meaningful competitor-strategy signal because the evaluation target moves beyond “the model generated an acceptable note” toward **whether the complete workflow improves or harms human work in context**.

Transferable principle: content-quality validation and workflow/human-factors validation are different evidence layers. A good synthetic note score does not prove low review burden, safe trust calibration, successful adoption or preserved clinician reasoning.

Do not copy: the repo has no authorized real-clinical deployment, clinician cohort or patient-data scope. Creating a human-subject study platform, telemetry warehouse or adoption dashboard now would be scope inflation.

### 2. CONFIRMED — Suki’s broader 2026 research program is standardizing evidence, not only adding features

**Event date: 2026-09-10. Checked: 2026-09-18.**

Source: https://www.suki.ai/press-releases/suki-launches-science-at-suki-to-set-a-new-standard-for-healthcare-ai/

Suki launched a multi-institution research initiative covering implementation, human factors, clinician adoption, workflow optimization, specialty care, medical education and standardized evaluation methods. This is vendor-originated evidence and must not be treated as independent proof of efficacy; its useful signal is the **evaluation strategy**.

For this repo, the signal reinforces sequencing: first make source fidelity, omission/misattribution and revision behavior trustworthy (#4/#7); only if owner scope later expands toward real clinical use should human-factors claims require separate governed evidence.

### 3. CONFIRMED independent research — specialty users still rank reliability, integration and local/privacy posture as major requirements

**Publication date: 2026-09-17. Checked: 2026-09-18.**

Source: https://link.springer.com/article/10.1007/s00347-026-02531-8

A newly published open-access survey of 34 ophthalmologists in Germany reports strong interest in functioning ambient scribes, while reliability, integration, legal/data-protection concerns and preference for local deployment were prominent barriers/requirements. The authors explicitly note the small regional sample and the absence of routine ambient-scribe users in the surveyed cohort, so the results are **not** a universal adoption rate or direct requirement for this product.

Transferable principle: specialty-specific acceptance is not captured by synthetic diagnostic correctness alone. However, because this repo explicitly excludes real patient/clinical use today, the paper does not establish a current product defect or justify a local-ASR rewrite.

### 4. CONFIRMED current capability — Dragon Copilot 5.0 consolidates note, transcript and context for review

**Version: Dragon Copilot 5.0; publication date not stated on the current support page. Checked: 2026-09-18.**

Source: https://support.microsoft.com/en-us/dragon-copilot/physicians/current/whats-new

Microsoft’s current physician experience puts note, patient context, transcript and generated content into one simplified patient view and keeps transcript access alongside the note. This is relevant as a review-workflow pattern, but it is **not a current gap** for `clinical-scribe-worker`: the existing scribe UI is already a multi-column review surface with transcript and generated outputs visible together. No “build a unified workspace” Issue was created.

## New Releases / Changes

- **2026-09-17 — Suki + MedStar:** new human-factors / implementation-science collaboration; retained as the main new strategic signal.
- **2026-09-17 — Die Ophthalmologie:** new specialty requirements survey; retained as independent contextual evidence, with sample/generalizability limits.
- **Current Dragon Copilot 5.0:** review-space consolidation; treated as already substantially matched, not a missing-feature claim.

## Community Pain

No new community post was promoted to decision-grade evidence this round. The fresh first-party and independent research sources are sufficient to support the product-direction calibration without using anecdotes as prevalence evidence.

## Current Repository Evidence

Current `clinical-scribe-worker` HEAD: `4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5`.

Positive / contrary evidence checked first:

- `public/scribe.html` already states synthetic/non-clinical-only use and forbids real patient/PII input.
- The UI already keeps transcript and generated clinical/SOAP content in the same workspace; therefore Dragon 5.0 does not establish a missing “single review view.”
- Existing #4 already targets specialty-scoped synthetic validation, omission, unsupported additions, speaker misattribution, negation/temporal flips and per-pack evidence.
- Existing #7 already targets section-scoped repair, candidate review, diff, undo/restore and source-aware revision receipts.
- Existing security/release blockers #6 and #10 remain higher-priority than adding new clinical product surfaces.
- Code/repo search did not show a current human-factors/usability study contract or real-user task measurement, but **absence of such a framework is not itself a defect** because current supported scope is not real clinical deployment.

The current Web Speech input remains the same previously-reviewed browser `SpeechRecognition` path; this is not treated as a new finding. The 2026-09-17 local-deployment preference paper strengthens the prior radar’s adjacent signal but does not overturn the current synthetic-only scope.

## Opportunity Map — `clinical-scribe-worker`

| Bucket | Decision | Evidence / reason |
|---|---|---|
| MUST MATCH | Fail-closed access/auth and executing regression evidence | Existing #6/#10; active PRs; higher priority than feature expansion. |
| MUST MATCH | Explicit human review and source/omission safety for generated notes | Existing #4 and current UI/product boundary. |
| SHOULD BE BETTER | If clinical scope is ever authorized, separate **content validity** from **verification burden / workflow fit / trust calibration / human experience** | New 2026-09-17 Suki + MedStar strategy; not current implementation authorization. |
| DIFFERENTIATOR | Evidence-first promotion ladder: synthetic content safety → repair/revision evidence → only then governed human-factors/real-world evidence | Fits current #4/#7 direction without a new platform. |
| ADJACENT IDEA | Local/on-device speech path where target users/regulation truly require it | 2026-09-17 ophthalmology survey + prior Web Speech research. Keep as research signal until scope/user evidence exists. |
| DO NOT COPY | EHR push, autonomous coding/orders, clinical reasoning expansion, telemetry warehouse, human-subject study platform, local ASR rewrite solely because competitors have them | Outside current owner-supported synthetic/non-clinical scope and adds disproportionate safety/privacy/maintenance burden. |

## Four-Gate Decision

### Candidate evaluated: human-factors / review-burden validation layer

Proposed fingerprint if it ever becomes actionable:

`clinical-scribe-worker + authorized real-clinical/supervised pilot + generated-note review workflow + content-quality tests do not measure reviewer burden/trust calibration/workflow fit + need bounded human-factors evidence before clinical claims`

Current classification:

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=LOW-MEDIUM until clinical scope is explicitly authorized`
- `triage=DEFERRED / NEEDS_EVIDENCE`
- `auto_implementation=false`

### Gate 1 — problem / value

The external market now provides stronger evidence that human factors matter independently of note quality. However, **the current repository explicitly supports synthetic/non-clinical research only**. There is no current authorized clinician workflow, patient cohort or real clinical deployment whose review burden can be measured. Therefore a present user/job failure is not established.

### Gate 2 — priority

No P0/P1/P2 product severity is established. #6 and #10 remain current trust/release blockers; #4/#7 already own the closest safety/review research surfaces. The new external signal changes future evidence requirements, not current defect severity.

### Gate 3 — minimum approach

Do **not** build anything now. The smallest future step, only if owner scope expands, is a bounded study protocol using the existing scribe flow and existing #4/#7 artifacts to measure a few direct tasks: correction count, unresolved/unsupported finding handling, review completion, accept/reject/restore behavior and qualitative workload/trust feedback. Reuse existing receipts; no new database, telemetry warehouse or general human-factors framework unless the study itself proves those are necessary.

### Gate 4 — research / implementation separation

- **BUILD later:** only if owner explicitly authorizes supervised clinical/usability study scope and a bounded protocol shows current evidence cannot answer the decision.
- **NARROW:** if one review task/failure class is the actual bottleneck, measure only that.
- **REJECT:** if the product remains synthetic/non-clinical or #4/#7 evidence is sufficient for its intended purpose.

Result this round: **NO NEW ISSUE.** The candidate remains central-radar research. This avoids turning a new competitor research program into an ungrounded engineering project.

## Issue Mapping / Dedupe / Coordination

- #4 specialty validation — new human-factors signal is adjacent, not a reason to rewrite active scope. PR #12/#5 are active; **SKIPPED_LOCKED / no comment**.
- #7 section-scoped repair/revision receipt — Dragon review workflow and human-factors evidence can eventually consume its receipts; PR #9 is active; **SKIPPED_LOCKED / no comment**.
- #6 Cloudflare Access cryptographic verification — active PRs #15/#13/#8; untouched.
- #10 executing CI/security-test gate — active PRs #14/#11; untouched.
- Prior Web Speech local-vs-remote candidate from 2026-09-15 — not reopened. New ophthalmology evidence strengthens local/privacy preference only in a different clinical context; current product still forbids real PHI and offers typed fallback.

Writes this round: **0 new Issues, 0 Issue edits/comments, 0 PR comments, 0 implementation authorization.**

## Rejected Ideas

- **Create a “Human Factors Platform” now** — rejected: no authorized clinical-user study; framework absence is not a current root cause.
- **Add telemetry for every click/time-on-task** — rejected: privacy/scope burden without a decision-grade study question.
- **Build local speech recognition because ophthalmologists prefer local systems** — rejected: small German specialty survey is not proof this synthetic prototype needs an ASR rewrite; prior Web Speech analysis already exists.
- **Copy Dragon Copilot’s unified patient view** — rejected: current scribe UI already co-locates transcript and generated content sufficiently to invalidate a simple feature-gap claim.
- **Expand into clinical reasoning/coding/EHR actions because Suki/Abridge/Nabla do** — rejected: current intended-use boundary explicitly excludes clinical practice and autonomous treatment/action.
- **Treat vendor research announcements as independent efficacy evidence** — rejected: use them as product-strategy signals only.

## Cross-portfolio Ideas

One reusable principle is retained without creating cross-repo work: **model/content evaluation, workflow verification burden and real-world human impact are separate evidence layers.** Apply this only where a repository has a concrete authorized user workflow; do not create a central “human factors framework” from this single signal.

## Sources

External public web sources (primary source for this radar):

1. Suki + MedStar Health National Center for Human Factors — **2026-09-17** — https://www.suki.ai/press-releases/suki-and-med-star-health-s-national-center-for-human-factors-in-healthcare-partner-to-pioneer-the-science-of-ambient-ai-adoption/ — `CONFIRMED` product/research-strategy signal.
2. Suki “Science at Suki” — **2026-09-10** — https://www.suki.ai/press-releases/suki-launches-science-at-suki-to-set-a-new-standard-for-healthcare-ai/ — `CONFIRMED` vendor strategy; not independent efficacy proof.
3. Terheyden et al., *Die Ophthalmologie* — **2026-09-17** — https://link.springer.com/article/10.1007/s00347-026-02531-8 — `CONFIRMED` independent specialty requirements survey; small regional sample and no routine ambient users in cohort.
4. Microsoft Dragon Copilot physician 5.0 current support page — checked **2026-09-18** — https://support.microsoft.com/en-us/dragon-copilot/physicians/current/whats-new — `CONFIRMED_CURRENT`, page does not expose a publication date.

Internal GitHub evidence used only for product truth, direction and dedupe:

- `autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` @ blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- `autodev-ng/docs/competitive-intelligence/2026-09-15T095812Z-external-radar.md`.
- `clinical-scribe-worker` current HEAD `4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5`.
- Current `README.md`, `AGENTS.md`, `public/scribe.html`, `docs/audits/50-persona-round-4-2026-09-14.md`.
- Existing Issues #4/#6/#7/#10 and all-state/open PRs.

## What Changed

1. **New since the last clinical-scribe radar:** Suki and MedStar publicly moved ambient-AI evaluation toward formal human-factors / implementation science on 2026-09-17.
2. A same-day independent ophthalmology paper adds specialty-specific evidence that reliability, integration and local/privacy posture matter to adoption, with explicit sample limitations.
3. Neither signal establishes a current defect because this repo remains synthetic/non-clinical and has no authorized real-clinical user workflow.
4. Existing #4/#7 remain the correct technical prerequisites; #6/#10 remain higher-priority operational blockers.
5. No duplicate Issue or large research project was created.

## Completion / Gaps / Cursor

- External exploration completed with recent first-party and independent sources.
- Repository/Issue/PR/current audit/default-branch evidence checked; no product HEAD drift detected before report write.
- No live Gemini provider, deployed Worker, clinician, patient, PHI, EHR, browser/device runtime or production path was exercised. These remain **NEEDS_RUNTIME_VERIFICATION** where relevant.
- Vendor announcements are not treated as independent outcome measurement; the ophthalmology survey is not generalized beyond its cohort.
- No portfolio CLEAN claim.

**Next fair-rotation cursor: `Reese-max/cyber-prep-coach`.**
