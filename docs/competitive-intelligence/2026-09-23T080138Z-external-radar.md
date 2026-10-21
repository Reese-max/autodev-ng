# External Competitive / New-Product / Workflow Radar — 2026-09-23T08:01:38Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY / MATERIAL_COMPETITOR_STRATEGY_SIGNAL / 0_NEW_ISSUES**.
- Primary intelligence source this round was the public web outside Reese-max GitHub. GitHub was used for current owner scope, product truth, owner-approved direction, duplicate/ownership checks and this durable report.
- Governing gate re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`; rules blob SHA **`8167e10798071d2276addaff6b201c6b0e904a2a`**.
- Fresh connected-owner enumeration was paged to completion: **42 Reese-max-owned repositories / 41 unarchived**; page 2 was empty and `obsidian-vault` is archived/excluded. No historical inventory was used as the denominator.
- Fair-rotation focal repo: **`Reese-max/clinical-scribe-worker`**.
- Focal default branch/head rechecked: **`main@4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5`** (`docs: record round 4 CI regression evidence`). The latest substantive product/security implementation baseline remains **`88bb7469508e8732aaff6f21d048c8677823fc04`**; later default-branch commits are audit documentation.
- Current owner-approved Product Board direction remains **INVEST / SIMPLIFY**. NOW = repair the authenticated trust boundary (#6) and honest executing CI/provider evidence (#10). NEXT = only after those trust/release gates, continue already-bounded specialty/workflow validation (#4) and section repair/revision research (#7). DO NOT = expand toward real clinical use, EHR actions, autonomous diagnosis/coding, generic IAM, or a new CI platform.
- Current product boundary remains **competition prototype / synthetic and non-clinical research only**. The shipped UI explicitly forbids real patient/PII input and use for clinical practice or medical advice.
- Open ownership remains active: #6 has open PRs #15/#13/#8; #10 has #14/#11; #4 has #12/#5; #7 has #9. No active Issue/PR scope was rewritten or commented on.
- No live Gemini/provider call, paid request, Cloudflare Access tenant, deployed Worker, browser/device, clinician/patient, EHR, PHI, production data, CI rerun, product source/config/secret/permission/settings mutation, worker/GOAL, merge or deployment was performed. Source evidence is not represented as runtime evidence.

## Executive decision

**0 new Issues. 0 Issue/PR comments or scope edits. 0 implementation authorizations.**

The strongest fresh external signal is **Heidi's 2026-09-22 strategy shift from documentation into supervised action across the clinician's work day**, backed by US$340M of newly announced capital. Heidi explicitly describes the next phase as agentic capabilities around patient visits, with clinicians controlling every decision and with new investment in clinical evidence, quality systems and regulatory work.

This is a meaningful direct-competitor strategy change, but it does **not** overturn `clinical-scribe-worker`'s current scope. The repository is deliberately synthetic/non-clinical and its default-branch SOAP contract explicitly forbids directly executable orders. The smallest transferable principle is not "add agents"; it is **keep model-generated work as a bounded candidate, bind it to evidence/current state, require explicit human authority before any effect, and emit a truthful receipt**. Existing #4 and #7 already own the evaluation/candidate-revision primitives, while #6/#10 still outrank new product breadth.

Two same-day market signals reinforce the same direction without establishing new local feature gaps:

1. **Abridge / U.S. VA (2026-09-22):** Abridge moved from nationwide pilot into a VA enterprise contract while operating across both VistA/CPRS and the Federal EHR. The relevant pattern is preserving context/evidence across heterogeneous host systems and migrations, not copying federal procurement or adding EHR connectors here.
2. **Altera Sunrise Thread AI / SUNY Downstate (2026-09-22):** its native-EHR workflow allows mobile capture and later desktop review/approval, while keeping data in the existing environment and informing patients about recording/AI use. The transferable pattern is that capture, review and external record mutation are separate workflow stages. The current repo already has typed fallback and an explicit synthetic-only boundary; it has no approved real-patient consent or EHR-write job.

Therefore the opportunity remains **research context only**: `OPPORTUNITY / severity=NOT_ESTABLISHED / decision_priority=MEDIUM / triage=NEEDS_EVIDENCE / auto_implementation=false`.

---

## Product → market category

| Product | Direct / adjacent market category | Current supported job |
|---|---|---|
| `clinical-scribe-worker` | synthetic clinical documentation prototype; source-constrained SOAP drafting; validation/review research | synthetic transcript/profile → differential + source-constrained SOAP draft → explicit human review/evidence, with no real-patient or autonomous clinical authority |

## External Signals

### A. Direct competitor strategy — Heidi moves from scribe to supervised agentic work

**CONFIRMED first-party release — event date 2026-09-22; checked 2026-09-23.**

Source: https://www.heidihealth.com/en-sg/blog/heidi-secures-us340m-to-scale-agents-across-health-systems-globally

Heidi announced US$100M Series C plus US$240M growth investment, and states that its product is moving from documentation into **supervised action** and agentic capabilities around the patient visit. It says the clinician remains in control of every decision and that the funding also supports clinical evidence, quality-management systems and regulatory submissions for agentic capabilities.

**User job solved:** clinicians currently perform administrative and follow-up work around an encounter after documentation is complete.

**Concrete manual work targeted:** taking structured information from the visit and carrying it into later tasks, instead of repeatedly reconstructing the same context across tools.

**Transferable product pattern:** `generated candidate != authorized action != external effect`. The useful design signal is supervised, reviewable work with explicit authority and evidence, not generic autonomous agents.

**What not to copy:** clinical action execution, orders, diagnosis/treatment automation, real-patient context, EHR write-back, agent marketplace, generic task orchestrator, new regulatory subsystem or provider breadth. Those are outside approved scope and carry materially higher safety/privacy/maintenance cost.

**Repository contrary evidence:** current `src/scribe.ts` explicitly states that the system only produces drafts and suggested directions, does not issue medical orders, and forbids drug/dose/route/frequency or directly executable treatment commands in Plan. Existing #7 already defines candidate revisions, stale-input handling, explicit Accept/Reject and revision receipts. Existing #4 owns source-fidelity and safety-validation research.

**Decision:** `MAJOR_STRATEGY_SIGNAL / EXISTING_DIRECTION_CONFIRMED / NO_NEW_ISSUE`.

### B. Adjacent enterprise workflow — Abridge preserves context across two VA EHR systems

**CONFIRMED first-party release — event date 2026-09-22; checked 2026-09-23.**

Source: https://www.abridge.com/press-release/va-enterprise-contract

Abridge announced selection for a VA ambient-AI enterprise contract after a nationwide pilot. It states that the platform is already operational on both **VistA/CPRS** and the **Federal EHR**, serving thousands of VA clinicians at more than 75 medical centers, with Linked Evidence / cited decision-support positioned as a trust mechanism.

Independent/current public context: https://news.va.gov/148010/ambient-scribe-reimagining-va-clinic-experience/ (VA, 2026-07-29) documents the phased national rollout and existing clinician-review workflow.

**User job solved:** avoid losing context and forcing clinicians to re-enter/reconstruct information when care spans specialties, facilities and different host systems.

**Transferable pattern:** host portability should not destroy evidence lineage or review state. The evidence/candidate contract should survive the host rather than making the host itself the source of truth.

**Current repo fit:** this reinforces #4/#7 source/revision receipts. It does not establish any need for VistA, Epic, FHIR, VA procurement, PHI retention, multi-tenant enterprise deployment or EHR migration support.

**Decision:** `DISTRIBUTION / PORTABILITY SIGNAL / DEDUP_TO_#4+#7 / NO_NEW_ISSUE`.

### C. New native-workflow product — Altera keeps capture, review and record update as distinct stages

**CONFIRMED first-party release — event date 2026-09-22; checked 2026-09-23.**

Source: https://www.alterahealth.com/newsroom/brooklyns-university-hospital-downstate-pilots-altera-digital-health-sunrise-thread-ai/

Altera reports a pilot of Sunrise Thread AI at University Hospital at Downstate: conversation capture can start on a preferred mobile device, generated notes are reviewed/approved in the native EHR, and review may occur immediately or later on desktop. The hospital also requires providers to inform patients that encounters are recorded and tells patients AI is used as part of general consent.

**User job solved:** capture can happen where the encounter occurs without forcing final review/approval at the same moment/device.

**Transferable pattern:** capture state, draft-generation state, human approval and final external record effect are distinct. A delayed review path must not silently upgrade a draft to an approved artifact.

**Current repo fit:** the repo is explicitly synthetic-only and has no approved real-patient capture/consent or EHR write path. Typed input already remains a fallback when browser speech capture is unavailable. No new current user failure is established.

**Decision:** `ADJACENT WORKFLOW SIGNAL / HOLD`.

## New Releases / recent strategy changes

| Date | Product / authority | Signal | Current decision |
|---|---|---|---|
| 2026-09-22 | Heidi | explicit shift from documentation into supervised action / agents across the clinical work day | material direct-competitor strategy change; retain supervision/evidence principle only |
| 2026-09-22 | Abridge | VA enterprise contract; operational across two EHR systems during migration | portability/context continuity signal; no EHR expansion |
| 2026-09-22 | Altera | Sunrise Thread AI pilot with mobile capture + later desktop review/approval in native EHR | capture/review separation signal; no real-patient/EHR scope |

No pricing claim, vendor adoption count or funding amount is treated as proof of efficacy for this repository. Vendor-reported usage, savings or accuracy are not local benchmark evidence.

## Community Pain

No fresh community anecdote was promoted to decision-grade evidence this round. Recent first-party product releases were sufficient to establish the market-direction signal. No isolated report is converted into prevalence, safety incidence, ROI or severity.

---

## Current repository evidence / contrary evidence

Current focal HEAD remains `4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5`; the latest substantive product/security baseline remains `88bb7469508e8732aaff6f21d048c8677823fc04`.

Current evidence that narrows the opportunity:

- `public/scribe.html` explicitly says the competition prototype is for synthetic data/non-clinical research only, forbids real patient/PII, and must not be used for clinical practice/medical advice.
- `src/scribe.ts` explicitly says the system creates chart drafts/suggested directions only and does not issue orders; Plan forbids drugs, dose, route, frequency and directly executable treatment commands.
- Browser voice input uses Web Speech API with typed fallback; competitor investment in hardware/mobile capture does not by itself create a local defect.
- #4 already owns specialty/workflow validation, source fidelity, omission/misattribution/negation and versioned validation receipts.
- #7 already owns candidate section revision, source/transcript/model/prompt binding, stale-input handling, Accept/Reject and undo/revision receipts.
- #6 remains the current P0 trust-boundary issue on default branch; #10 remains the P2 release/CI evidence gap. Active PRs remain open, so they are not treated as merged/default truth.

This contrary evidence prevents the new Heidi signal from being converted into an "agent framework" feature request.

## Opportunity Map — `clinical-scribe-worker`

| Category | Decision | Evidence / reasoning |
|---|---|---|
| **MUST MATCH** | Cryptographically trustworthy identity/reviewer boundary | Existing #6 P0; higher priority than feature breadth |
| **MUST MATCH** | A requested verification/canary must prove the declared path executed | Existing #10; green-with-zero-execution is not evidence |
| **MUST MATCH** | Clinical text remains a draft/candidate until explicit human review; unsupported/executable orders remain blocked | current source contract + #4/#7 |
| **SHOULD BE BETTER** | Any future bounded action research must bind exact source/current revision and explicit authority before effect | Heidi supervised-action strategy, but no current action job exists |
| **DIFFERENTIATOR** | Synthetic-first, evidence-linked, fail-closed receipts instead of premature autonomous clinical breadth | owner-approved scope and existing research direction |
| **ADJACENT IDEA** | If owner later authorizes one non-clinical synthetic action, test a single `candidate -> evidence -> explicit confirm -> receipt` fixture without external write | smallest research experiment; reuse #7 before adding schema |
| **DO NOT COPY** | orders/treatment execution, autonomous coding/diagnosis, EHR write-back, PHI context store, general agent platform, enterprise tenant/IAM system | outside scope; no current job evidence |
| **DO NOT COPY** | hardware capture, federal procurement, multi-EHR integration merely because competitors are scaling | distribution/market signal is not a local product defect |

## Four-Gate Review

### Candidate — supervised action primitive after documentation

Potential future fingerprint if it becomes actionable:

`clinical-scribe-worker + owner-authorized synthetic/non-clinical downstream action + user must manually re-enter an already-reviewed source-bound result + existing #7 candidate/receipt cannot represent the action safely + bounded fixture demonstrates repeated manual break or unsafe ambiguity`

### Gate 1 — problem / value

Heidi provides strong first-party evidence that the competitive category is moving beyond notes into supervised work. But this repo does not support real clinical actions, and its owner-approved boundary explicitly rejects clinical-use expansion. No current supported user is shown repeatedly re-entering a downstream action, and no supported flow currently fails because an action primitive is absent. Existing #7 is contrary evidence that the core candidate/review lifecycle is already being researched.

**Result:** market opportunity exists; current local problem/value is **not established**.

### Gate 2 — priority

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
evidence: NEEDS_EVIDENCE
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

This is not P2/P1 because a well-funded competitor is moving into agents. No current supported-task completion, recovery, safety or maintenance failure was demonstrated.

### Gate 3 — minimum approach

**Do not change product code now.** If owner scope later explicitly allows one bounded non-clinical action, first use a synthetic local fixture that:

1. freezes an exact source/note revision;
2. creates one reviewable candidate action;
3. shows source/support or `UNRESOLVED`;
4. requires explicit human confirmation;
5. emits a receipt and fails stale/changed input closed;
6. performs **no external side effect** during research.

Reuse #7's candidate/revision concepts first. Only add action-specific schema if the fixture proves the existing contract cannot express the need. No action engine, queue, database, router, EHR adapter, agent framework or permission service is the minimum solution.

### Gate 4 — research / implementation separation

No Issue is created and no BUILD authorization exists.

- **BUILD (research conclusion only):** owner explicitly authorizes a narrow synthetic/non-clinical downstream job, real workflow evidence shows repeated manual re-entry/error, and a bounded fixture demonstrates #7 cannot safely express it.
- **NARROW:** represent the action as one candidate type under the existing revision/evidence receipt and keep it local/no-effect.
- **REJECT:** current synthetic documentation scope remains unchanged, or the candidate produces no measurable decision value beyond #7.

Even a future BUILD result would only support the next product decision; it would not authorize a worker, merge, deployment, external write, paid provider or real clinical use.

**Result: NO NEW ISSUE.**

## Issue Mapping / dedupe / coordination

- **#6 P0 Access JWT verification:** active PRs #15/#13/#8; untouched. New competitor signals do not reduce its priority.
- **#10 P2 CI/security evidence:** active PRs #14/#11; untouched. Agentic-market urgency cannot substitute for an honest executing verification gate.
- **#4 validation research:** active PRs #12/#5. New strategy signals reinforce versioned/source-linked validation but do not create a distinct root cause. **SKIPPED_LOCKED / report-only.**
- **#7 repair/revision research:** active PR #9. Heidi supervised action and Altera delayed review reinforce candidate/human-authority separation but do not justify expanding the active scope. **SKIPPED_LOCKED / report-only.**
- No owner rejection was reopened, no prior issue was reclassified as fixed, and no current open issue received a duplicate comment.

Writes this round: **0 new Issues, 0 Issue edits/comments, 0 PR comments, 0 implementation authorization.**

## Adjacent / cross-portfolio ideas

One cross-portfolio principle is worth retaining without creating a shared framework:

**`input/source identity -> candidate state -> human/effect authority -> verified outcome/receipt` are separate layers.**

The Heidi shift is evidence that products are moving from answer generation into effects, making this separation more important. It can be reused conceptually across other Reese-max products that may later perform writes, but there is no evidence yet that a new cross-repo library/service is justified.

## Rejected Ideas

- **Add an agent/action framework now** — rejected: no owner-approved supported action job; current scope explicitly forbids clinical action breadth.
- **Add EHR/FHIR/VA integrations** — rejected: market distribution success is not local workflow evidence, and real patient context is outside scope.
- **Build hardware/mobile recording** — rejected: no current supported-task evidence; browser speech plus typed fallback already exists.
- **Add patient consent/PHI retention subsystem** — rejected: current product forbids real patient/PII input. A consent system would incorrectly imply expanded authority.
- **Add diagnosis/coding/prior-auth/revenue-cycle workflows** — rejected: unrelated downstream categories and substantially larger safety/regulatory surface.
- **Treat US$340M funding, deployment scale or vendor usage figures as priority/ROI proof** — rejected: external commercial traction is not evidence of local user pain or product efficacy.

## Sources

Public web sources — primary intelligence source for this round:

1. Heidi — **2026-09-22** — https://www.heidihealth.com/en-sg/blog/heidi-secures-us340m-to-scale-agents-across-health-systems-globally — `CONFIRMED` first-party strategy/funding/product-direction signal.
2. Abridge — **2026-09-22** — https://www.abridge.com/press-release/va-enterprise-contract — `CONFIRMED` first-party enterprise/distribution/portability signal.
3. U.S. Department of Veterans Affairs — **2026-07-29** — https://news.va.gov/148010/ambient-scribe-reimagining-va-clinic-experience/ — `CONFIRMED` public deployment context; older representative pattern, not used as a new event.
4. Altera Digital Health — **2026-09-22** — https://www.alterahealth.com/newsroom/brooklyns-university-hospital-downstate-pilots-altera-digital-health-sunrise-thread-ai/ — `CONFIRMED` first-party workflow/pilot signal.

Internal GitHub evidence used for product truth/direction/dedupe only:

- `autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` @ blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- `autodev-ng/docs/portfolio-audit/2026-09-18T1100Z-product-board-delta.md`.
- prior clinical radars `2026-09-19T175958Z-external-radar.md` and `2026-09-21T180021Z-external-radar.md`.
- `clinical-scribe-worker/main@4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5`; relevant product baseline `88bb7469508e8732aaff6f21d048c8677823fc04`.
- current `AGENTS.md`, `README.md`, `public/scribe.html`, `src/scribe.ts`, Issues #4/#6/#7/#10 and all-state current PRs.

## What Changed

1. **New direct-competitor strategy evidence:** Heidi on 2026-09-22 explicitly committed to moving beyond documentation into supervised agentic work across the clinical day and funding the associated evidence/safety/regulatory layer.
2. This **does not overturn** owner direction. It increases confidence that supervision/evidence/effect separation is strategically important, while simultaneously strengthening the case against premature autonomous action in this synthetic-only prototype.
3. Same-day Abridge and Altera releases show two complementary market patterns: host/EHR portability with evidence continuity, and capture/review separation inside existing workflows.
4. No new root cause passed all four gates; existing #4/#7 already own the transferable research primitives, and #6/#10 remain higher-priority trust/release work.
5. No duplicate Issue, large framework or implementation authorization was created.

## Completion / gaps / cursor

- External exploration completed with fresh 2026-09-22 first-party sources and current public-web checks.
- Fresh owner inventory pagination completed: **42 owned / 41 unarchived**.
- Focal default branch, current scope, relevant Issues, all-state PRs, owner-approved Product Board direction and prior clinical radars/rejections were checked.
- No live provider, deployed clinical runtime, browser/device, clinician/patient, PHI, EHR, CI trigger or production path was exercised. Runtime-sensitive conclusions remain **NEEDS_RUNTIME_VERIFICATION**.
- This radar does **not** declare the repository or portfolio CLEAN.
- Next fair-rotation target: **`Reese-max/MaterialYouNewTab`**.
