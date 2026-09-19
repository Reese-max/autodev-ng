# UkePack Product Board Delta — 2026-09-19 02:00 UTC

Repository: `Reese-max/UkePack`  
Default branch: `master`  
Inspected default HEAD: `56bcdb78da1e27529d70a9de71aa3414ddfcfb36`  
Product/security baseline: `436db728300f6679c193eb886af7a2fd672d7fb2`  
Issue-quality rules blob: `8167e10798071d2276addaff6b201c6b0e904a2a`  
Previous formal product-board audit: [2026-09-08](https://github.com/Reese-max/UkePack/blob/56bcdb78da1e27529d70a9de71aa3414ddfcfb36/.github/quality-audits/2026-09-08-0410-product-board-audit.md)  
Previous fixed-persona round: [2026-09-10 Round 3](https://github.com/Reese-max/UkePack/blob/56bcdb78da1e27529d70a9de71aa3414ddfcfb36/docs/audits/50-persona-round-3-2026-09-10.md)

## Scope and evidence boundary

This is an incremental audit of the current product, all open Issues/PRs, comments and review threads, recent commits, and GitHub Actions receipts. The repository remains an active FastAPI/HTMX product for turning authorized MusicXML/manual chord input into teacher-reviewed, child-friendly ukulele PDF/audio practice packs. It is not an empty repository or a content-only archive.

The default HEAD contains the security remediation plus audit-only commits; no later product change has landed. This round did not execute a live deployment, browser, real legacy-database upgrade, paid provider, printer, screen reader, mobile device, or real child/teacher study. Source findings are therefore marked SOURCE_CONFIRMED, not EXECUTED_REPRODUCTION.

Inventory status: 41 repositories were enumerated for Reese-max, 40 unarchived and one archived. UkePack was selected by the persistent fair-rotation cursor. No third-party repository was modified.

## Executive decision

Recommendation: **INVEST / SIMPLIFY / MAINTAIN**.

UkePack should remain a privacy-minimal teacher production workflow: authorized source → level choice → teacher review → print/share. Do not expand into a broad song catalog, full LMS, child accounts, marketplace, or realtime performance coach while the capability-custody repair is still unsafe and governance CI has multiple competing fixes.

CEO, if only three things are done:

1. Make the legacy-project recovery path actually usable across the next request and durable across write failures.
2. Select one governance-parser repair, close the duplicate branches after owner review, and preserve a trustworthy green gate.
3. Validate print/mobile/share accessibility on the exact release SHA.

Do not build teacher accounts, roster/billing, public song discovery, or an interactive player from synthetic preference alone.

## New actionable findings

### F-01 — Claim URL authorizes only the landing GET

- Tracking: existing [Issue #5](https://github.com/Reese-max/UkePack/issues/5); active [PR #6](https://github.com/Reese-max/UkePack/pull/6).
- Fingerprint: `UkePack + legacy claim URL + follow-up project action + 401/403 + claim handler does not establish existing auth cookies or propagate capability`.
- Kind: `BUG`
- Severity: `P1`
- Decision priority: `HIGH_PRE_MERGE`
- Triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- Evidence: `SOURCE_CONFIRMED`
- Inspected PR head: `862beb4405337dba52d83ca90fe9cd1413dc36c0`
- Review evidence: [unresolved thread](https://github.com/Reese-max/UkePack/pull/6#discussion_r3985858027)

Who is affected: a legitimate pre-upgrade owner receiving an operator-generated claim URL. The query token authorizes only the initial analysis-page GET. Ordinary Preview, Review, download links and forms omit it, and the handler does not establish the existing project auth cookies. The next supported action therefore fails with 401/403.

Expected: accepting a valid one-time/claim capability establishes the same bounded project credentials used by the normal workflow, or safely propagates the capability for every supported next step. Actual: the recipient can view the landing page but cannot use the handed-off project.

Minimum effective change: reuse the existing project-cookie boundary when accepting a valid claim, with expiry/scope unchanged; test a second request without the query parameter. Non-goals: accounts, OAuth, roster identity, or a general IAM service.

Acceptance:
1. A valid claim grants only that project and establishes the existing bounded credential mechanism.
2. Preview, Review, download, and one state-changing form succeed on a subsequent request without the query parameter.
3. Invalid/expired/wrong-project tokens remain 401/403.
4. Adjacent projects and public share permissions remain inaccessible.
5. A browser/runtime receipt is attached before closure.

### F-02 — Database token commit can outlive the recovery manifest

- Tracking: existing [Issue #5](https://github.com/Reese-max/UkePack/issues/5); active [PR #6](https://github.com/Reese-max/UkePack/pull/6).
- Fingerprint: `UkePack + legacy migration + manifest write failure after DB commit + recovery not retried + token commit precedes durable custody output and exception is swallowed`.
- Kind: `BUG`
- Severity: `P2`
- Decision priority: `HIGH_PRE_MERGE`
- Triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- Evidence: `SOURCE_CONFIRMED`
- Review evidence: [unresolved thread](https://github.com/Reese-max/UkePack/pull/6#discussion_r3985858031)

Who is affected: an operator upgrading an existing installation when the recovery volume is read-only, full, missing, or otherwise unwritable. PR #6 commits fresh legacy capability tokens first, then writes the operator manifest; the broad outer exception suppresses the manifest failure. On restart, those rows no longer qualify for migration, so the supported recovery artifact is neither available nor retried.

Expected: rows become ineligible for retry only after durable custody output exists, or the transaction remains retryable and the failure is surfaced. Actual: the database can commit inaccessible credentials while the only supported handoff fails silently.

Minimum effective change: stage durable output before committing eligibility changes, or use a transaction/retry marker that cannot silently strand rows. No new database, queue, secret broker, or recovery platform is required.

Acceptance:
1. An unwritable/full recovery destination leaves rows safely retryable or rolls back the token update.
2. The startup/operator path fails loudly with actionable context.
3. A successful retry produces exactly one valid recovery record per legacy project.
4. Existing non-legacy rows and already-completed migrations remain idempotent.
5. Isolated failure-injection tests cover write, fsync/rename, and restart boundaries.

### F-03 — Legal subject delimiter can be reinterpreted as body evidence

- Tracking: existing [Issue #2](https://github.com/Reese-max/UkePack/issues/2); active [PR #10](https://github.com/Reese-max/UkePack/pull/10).
- Fingerprint: `UkePack + governance git-log parser + subject containing U+001F + fabricated body/KPI acknowledgment + field separator also legal in commit message`.
- Kind: `VALIDATION_GAP`
- Severity: `NOT_ESTABLISHED`
- Decision priority: `P2`
- Triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- Evidence: `SOURCE_CONFIRMED`
- Inspected PR head: `f079c72d063c585c2d23e1d23dd60f3d2fedba57`
- Review evidence: [unresolved thread](https://github.com/Reese-max/UkePack/pull/10#discussion_r4035327818)

PR #10 fixes the original empty-body crash and has a successful [Actions run 35206267245](https://github.com/Reese-max/UkePack/actions/runs/35206267245): checkout, dependency installation, lint, type check, and test steps all completed successfully. That receipt does not cover an adversarial but legal commit subject containing the same `\x1f` byte used as the field delimiter. With `maxsplit=2`, part of the subject can be interpreted as the body, allowing a subject-only commit to appear to contain a numeric KPI acknowledgment.

This does not prove an end-user product failure and is not P1. It does block treating the green PR run as sufficient governance proof.

Minimum effective change: use unambiguous framing/encoding or independently query fields so legal message bytes cannot change field meaning. Preserve the original anti-drift policy.

Acceptance:
1. Subject, body, empty body, multiline content, CRLF, Traditional Chinese, `\x1f`, `\x1e`, and NUL framing edge cases are deterministic.
2. A subject-only message cannot fabricate body-only KPI evidence.
3. Malformed records fail with commit context, not silent acceptance.
4. Existing exemption semantics remain exact and unchanged.
5. A new PR Actions run is green on the corrected head.

## CI and ownership

- PR #6 head has [Actions run 34561148415](https://github.com/Reese-max/UkePack/actions/runs/34561148415), conclusion failure, but the only job reports `steps=null` and no log. The direct cause is **UNKNOWN**; no billing, quota, YAML, or code failure is inferred.
- PR #10 head has a real green job with all expected steps. It remains blocked by the unresolved delimiter review finding.
- PRs [#4](https://github.com/Reese-max/UkePack/pull/4), [#8](https://github.com/Reese-max/UkePack/pull/8), and #10 target the same #2 root cause. PR #8 additionally carries an unrelated generated performance snapshot and an unresolved review thread; this is scope pollution, but was not promoted to a separate product Issue because the duplicate repair should first be consolidated.
- PR #6, #10, their branches, assignees, and review threads are active. All three findings are `SKIPPED_LOCKED`: this audit did not modify Issues/PRs, acquire their ownership, or start implementation.

## Competitive delta (official sources checked 2026-09-19)

| Product/workflow | Confirmed current capability | Product implication |
|---|---|---|
| [Chordify](https://chordify.net/) | Song search, ukulele support, chord diagrams, loop/capo/transpose, mobile app, community edits | It wins immediate catalog/play-along. UkePack should not copy the catalog; it should be better at authorized-source teacher preparation. |
| [Soundslice](https://www.soundslice.com/) | MusicXML/Guitar Pro import, browser notation editor, synced recordings, loop/slow/transpose, teacher sharing across phone/tablet/desktop | It is the strongest adjacent interactive-practice alternative. In-page practice remains a bounded research question, not a reason to bypass #5 or copy a full player. |
| [MuseScore Studio](https://musescore.org/en) | Free/open-source notation, print/playback, MIDI input, MusicXML/MIDI interchange; current site lists Studio 4.7.5 | Maintain MusicXML interoperability and delegate expert notation editing rather than rebuilding a notation suite. |

Classification:
- MUST MATCH: secure project recovery, correct authorization continuity, green reproducible release gate, readable print/share output.
- SHOULD BE BETTER: time from authorized source to teacher-approved three-level pack; no-child-account distribution.
- DIFFERENTIATOR: privacy-minimal, teacher-reviewed printable/audio pack generation.
- DO NOT COPY: broad catalog, full cloud editor, marketplace, all-instrument curriculum, or realtime gamification.

External product claims are `SOURCE_CONFIRMED` descriptions, not independent evidence of learning outcomes, demand, revenue, or UkePack benefit.

## Synthetic board review

This is modelled multi-perspective reasoning, not independent expert consensus.

- CEO: fix custody, choose one parser repair, verify exact-SHA release; defer breadth.
- CPO: the core promise is a usable reviewed pack, so a claim URL that dead-ends is a product failure, not merely an admin inconvenience.
- CTO: make migration retry-safe and parser framing total; do not add identity infrastructure.
- Staff/Principal Engineer: use the existing auth-cookie primitive and transaction/durable-write ordering.
- UX Lead: recovery handoff must continue directly into Preview/Review, with no token-copy ceremony.
- UX Researcher: preserve the five-teacher workshop study; synthetic personas cannot approve interactive-player work.
- Growth: no new acquisition surface is justified while legitimate legacy users can be locked out.
- CFO: avoid LMS/accounts and support-heavy recovery tooling before repeated-use evidence.
- Security/Privacy: project-scoped capability only; no child identity collection.
- QA: green CI is necessary but insufficient when the exact delimiter case is absent.
- SRE: migration partial-failure and restart are mandatory; zero-step failures remain UNKNOWN.
- Accessibility: still needs printer, keyboard, zoom, screen-reader, and mobile runtime evidence.
- Support: surface recovery-manifest failures; silent startup handling creates unresolvable tickets.

Material dissent: a broad teacher account system could solve custody. Rejected because a project-scoped handoff and retry-safe migration are smaller, preserve privacy, and address the proven root causes.

## 50 synthetic personas

The fixed IDs are preserved; no role replacement occurred. A01–F05 are the 30 regression baseline (60%); G01–J05 are the 20 exploration set (40%). Results are simulations against source and CI evidence, not human votes or incidence estimates.

| ID | Background/constraint and goal | Journey / friction | Result and recommendation |
|---|---|---|---|
| A01 | 8-year-old, tablet, parent-assisted; play chorus | Open share → PDF; mobile/print unexecuted | UNKNOWN/P2 — runtime tablet PDF |
| A02 | 10, slow network; short practice | Share → audio loop; no network trace | UNKNOWN/P2 — slow-network smoke |
| A03 | 13, some music skill; choose Level 2 | Compare levels; distinction only static | PARTIAL/P3 — comprehension test |
| A04 | 6, paper-first/small hands; large diagrams | Print pack; physical output absent | UNKNOWN/P1 — printer matrix |
| A05 | 16, laptop; continue in notation editor | Export MusicXML; round-trip not executed | UNKNOWN/P2 — MuseScore round-trip |
| B01 | Low-digital-skill parent; make family pack | Import → level → print; inputs remain technical | PARTIAL/P2 — simplify first run |
| B02 | Musical parent; choose key | Compare recommendation; wording untested | PARTIAL/P3 — explanation test |
| B03 | Privacy-conscious parent; share without account | Expiring link; auth runtime absent | PARTIAL/P1 — two-user share smoke |
| B04 | Printer-dependent parent; avoid clipping | Preview → print; no device evidence | UNKNOWN/P1 — real-printer QA |
| B05 | AI-music parent; use owned source | Declare rights → export; policy varies | PARTIAL/P2 — explicit declaration |
| C01 | Teacher with 12 students; make three levels | One source → review; repeated workflow unvalidated | PARTIAL/RESEARCH — #3 |
| C02 | Community teacher; reuse corrections | Review → template; reuse demand unknown | UNKNOWN/P2 — observe real workflow |
| C03 | Remote teacher; distribute safely | Generate → send → revoke; runtime absent | PARTIAL/P1 — share containment |
| C04 | School teacher upgrading old install; retain projects | Claim → Preview/Review; next request loses auth | FAIL/P1 — F-01/#5 |
| C05 | Expert arranger; override AI | Review → edit/export; depth untested | PARTIAL/P2 — preserve escape hatch |
| D01 | Workshop organizer, 30 learners; print bundles | Pack set → print; batching unvalidated | UNKNOWN/RESEARCH — #3 |
| D02 | Nonprofit organizer; offline/no accounts | Prebuild → print; strong fit, no field evidence | PARTIAL/P2 — paper-first pilot |
| D03 | Release owner; trust master | Compare three parser PRs and CI | FAIL/P2 — select one repair |
| D04 | Copyright reviewer; prevent misuse | Source state → share; enforcement runtime absent | PARTIAL/P1 — license-state smoke |
| D05 | Privacy officer; minimize child data | Inspect migration/claims; project capability fits | PARTIAL/P1 — no account expansion |
| E01 | Dyslexic learner; readable instructions | PDF reading; no user test | UNKNOWN/P2 — readability study |
| E02 | Low-vision grandparent; 200% zoom | Shared page/PDF zoom; untested | UNKNOWN/P2 — zoom/contrast |
| E03 | Motor-impaired teacher; keyboard-only authoring | Import → review → export; browser absent | UNKNOWN/P2 — keyboard audit |
| E04 | Color-vision difference; understand difficulty | Badges/cues; static evidence incomplete | UNKNOWN/P3 — non-color cues |
| E05 | Screen-reader teacher; semantic workflow | Form/errors; AT not executed | UNKNOWN/P2 — screen-reader test |
| F01 | API integrator; automate packs | Legacy claim handoff cannot continue | FAIL/P1 — F-01 |
| F02 | Discord teacher; safe attachments | Bot → PDF; secondary channel unverified | UNKNOWN/P2 — keep de-emphasized |
| F03 | Linux self-hoster; clean setup | Clone → uv → run; not executed here | UNKNOWN/P3 — clean-clone smoke |
| F04 | Render operator; safe upgrade | Migration → manifest; failure ordering unsafe | FAIL/P2 — F-02 |
| F05 | Support volunteer; diagnose failures | Manifest write failure can be swallowed | FAIL/P2 — surface error |
| G01 | Music therapist; adapt public-domain activity | Import → simplify; no clinical claim | PARTIAL/P2 — scope guard |
| G02 | Special-ed teacher; varied pacing | Three levels → assign; fit unvalidated | PARTIAL/RESEARCH — include in #3 |
| G03 | Camp instructor, offline; printable kit | Prebuild → print; print runtime missing | UNKNOWN/P2 — offline pilot |
| G04 | Substitute teacher; five-minute handoff | Guide → print; setup remains dense | PARTIAL/P2 — one-page path |
| G05 | Curriculum designer; audit versions | Compare outputs; provenance need unknown | UNKNOWN/P3 — validate demand |
| H01 | AppSec reviewer; adjacent project denial | Claim one project → probe another | UNKNOWN/P1 — runtime isolation |
| H02 | CI maintainer; legal commit shapes | Subject control byte fabricates body | FAIL/P2 — F-03 |
| H03 | SRE; exact deployed SHA | CI → deploy → smoke; no deploy receipt | UNKNOWN/P1 — evidence chain |
| H04 | Security reviewer; approve release | Green #10 but unresolved parser ambiguity | FAIL/P2 — F-03 |
| H05 | Recovery operator; preserve legacy data | Commit token → manifest failure → restart | FAIL/P2 — F-02 |
| I01 | Malicious enumerator model; cross-project access | IDs/tokens; no live test | UNKNOWN/P0 lineage — two-user matrix |
| I02 | Impatient teacher; finish quickly | Claim landing → ordinary action 401/403 | FAIL/P1 — F-01 |
| I03 | Contributor; deterministic governance gate | Subject-only/control-byte commits | FAIL/P2 — F-03 |
| I04 | Business owner; price product | Compare manual time; WTP absent | UNKNOWN/RESEARCH — #3 interviews |
| I05 | Interrupted returning user; resume old project | Claim URL does not persist credentials | FAIL/P1 — F-01 |
| J01 | Catalog-first consumer; find pop songs | Search catalog | FAIL BY DESIGN — use Chordify |
| J02 | Interactive-practice subscriber; synced playback | MusicXML → player | UNKNOWN/RESEARCH — #9, do not copy yet |
| J03 | MuseScore power user; deep notation editing | Export → expert editor | PARTIAL/P2 — maintain interchange |
| J04 | Workshop buyer; repeatable 20-seat pilot | Pilot → time/quality comparison | UNKNOWN/RESEARCH — #3 |
| J05 | Principal engineer; safe release | Multiple branches, one green but reviewed flaw | FAIL/P2 — consolidate #2 |

No Synthetic Preference Share is used in this delta. The previous simulation remains non-human and provides no priority, revenue, or occurrence evidence.

## Red Team

- Could #5 already be solved by the operator manifest? No: F-01 shows the handed-off project dead-ends after the first GET; F-02 shows the manifest may never become durable.
- Could users manually copy the token forever? That is not the documented supported journey and increases leakage/support burden; the existing bounded cookie mechanism is smaller.
- Could the database token be recovered manually? A database operator might extract it, but that is not the supported file-based recovery contract and does not excuse silent partial failure.
- Does the green #10 run prove the parser is fixed? It proves the tested head passed its suite, not that a legal delimiter byte cannot alter subject/body semantics.
- Should the governance test be removed? No; that weakens a deliberate control instead of repairing framing.
- Should all three parser PRs be merged? No; they share the same root cause and create conflict/scope risk.
- Is Soundslice evidence for building an interactive player? No; it proves an alternative workflow exists, not that UkePack users want or will pay for it.
- Would accounts solve every recovery problem? They would add identity, migration, privacy, support, and authorization scope before demand; the local project-scoped repair is smaller.
- Is any finding a default-branch product regression? No. All three are pre-merge blockers. Default remains NOT CLEAN because existing #2/#5 are unresolved and required runtime evidence is missing.

## NOW / NEXT / LATER / DON'T

NOW:
1. Fix F-01 and F-02 within #5/PR #6 before merge.
2. Fix F-03, select one #2 repair, and obtain a new green Actions receipt.
3. Run exact-SHA legacy-upgrade, claim continuation, adjacent-project denial, and restart/failure-injection tests.

NEXT:
1. Execute printer/mobile/share/accessibility matrix.
2. Continue bounded teacher workshop research #3.
3. Keep #9 as research only; compare read-only inline practice with linking/exporting to Soundslice.

LATER:
- Reusable teacher templates and pack sets only if real studies cross explicit thresholds.
- Version provenance and round-trip receipts.

DON'T:
- No LMS, child accounts, roster/billing, marketplace, transcription model, broad catalog, or all-instrument expansion.
- Do not infer CI root cause from zero-step jobs.
- Do not equate a green unit suite with provider/browser/deployment verification.
- Do not treat Issue numbers, simulated personas, or this report as implementation authorization.

## Regression and write ledger

- #2 governance parser: `PARTIALLY_FIXED / PR_OPEN / STILL_BLOCKED_PRE_MERGE`; PR #10 is green but F-03 remains unresolved.
- #5 legacy custody: `PARTIALLY_FIXED / PR_OPEN / STILL_BLOCKED_PRE_MERGE`; F-01 and F-02 remain unresolved.
- #1 authorization isolation: `CANNOT_VERIFY`; no new deployed two-user receipt.
- New Issues: 0.
- Updated Issues/comments: 0.
- Reopened Issues: 0.
- New research Issues: 0.
- Duplicate avoided: 4 (three findings mapped to #2/#5; PR #8 scope pollution retained in its existing review thread).
- Findings: 3; P1 1, P2 1, severity NOT_ESTABLISHED / decision P2 1.
- Mapping completeness: 3/3.
- Verified Fixed: 0.
- SKIPPED_LOCKED: 3 findings due to active PRs/branches/review ownership.
- Issue write blocked: 0.
- Report write blocked: 0 at preparation time.
- Fixed A01–J05 status: NOT CLEAN, 0/2.
- Runtime pending: legacy migration/claim continuation, adjacent-project isolation, restart/failure injection, public deployment, browser, mobile, printer, screen reader, keyboard, zoom, slow network, and real teacher observation.

This audit-only report is not a product fix and does not invalidate or satisfy product runtime evidence.
