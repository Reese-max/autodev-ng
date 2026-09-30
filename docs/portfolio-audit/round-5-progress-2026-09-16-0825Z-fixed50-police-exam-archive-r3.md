# Portfolio 50-Persona Audit — police-exam-archive Round 3

Run ID: `2026-09-16T08:24:30Z-persona-audit-11-police-exam-archive`

Status: **NOT CLEAN — clean streak 0/2**

## Governing rules

- Fixed-50 protocol: `docs/portfolio-audit/2026-09-06-50-persona-audit.md`
  - blob SHA: `6e3499d6ef5be7e123050e1526946f6a40f99263`
- Issue-quality v2: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
  - blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Fixed personas: A01–J05, 50 synthetic simulations. These are not real-user studies or 50 independent votes.

## Portfolio inventory / continuation

The connected account was re-enumerated with complete pagination in this run: **42 accessible Reese-max-owned repositories** on page 1; page 2 was empty. The historical 39-repo snapshot was not treated as complete. Priority NOT-CLEAN rechecks did not establish a new landed product fix or a new qualifying regression before the fair cursor advanced to `police-exam-archive`.

Next fair cursor after this report: `project-doctor-web` (subject to priority P0/P1/regression/fix-landed work taking precedence).

## Repository scope and inspected revision

Repository: `Reese-max/police-exam-archive`

- Default branch: `master`
- Inspected/current HEAD before report write: `a0b5dbb9352b5558dbe62445c6452947dbd2501b`
- Current HEAD commit is the existing audit-only `docs: add 50-persona audit round 1`; its parent/product baseline is `fe497aa9fac7a4e4a411e663edeef6c1c5356577`.
- `master` is protected and requires `Data Quality Check / quality-check`, `CI / test (3.10)`, `(3.11)`, `(3.12)`.
- Existing audit-only PR #67 remains open and was not modified, to avoid taking over an active PR scope.

## Evidence checked

Current source and product surface were re-read at the inspected SHA, including README/product scope, `考古題網站/quiz.html`, `js/search-engine.js`, `js/quiz-engine.js`, current/open/closed Issues, all-state PR searches, prior audits, and current-SHA GitHub Actions receipts.

Actual execution receipts on exact SHA `a0b5dbb...`:

- CI run `33989440607`: **success**, three GitHub-hosted jobs for Python 3.10/3.11/3.12. Jobs executed checkout, dependency install, all tests, full category/115 UI checks, responsive-layout checks, homepage-stat checks, search-index/analytics generation and frontend JS syntax checks.
- Pages run `33989440679`: **success** on the same SHA.

These receipts prove those CI/deployment workflow steps executed. They do **not** prove real-browser reload recovery, image-choice usability, assistive-technology behavior, mobile interaction, or every quiz path.

## New actionable finding

### P2 #69 — active mock exam is not recoverable after reload/interruption

Issue: https://github.com/Reese-max/police-exam-archive/issues/69

Classification:

- kind: `BUG`
- severity: `P2`
- decision priority: `P2`
- triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- confidence: `CONFIRMED / SOURCE_CONFIRMED`
- runtime: `NEEDS_RUNTIME_VERIFICATION`

Stable fingerprint:

`police-exam-archive + quiz.html active exam state + reload/tab interruption before finish + all answers/timer/navigation state is process-memory only and page initializes a fresh setup + no resumable checkpoint for the active exam`

Source facts:

- Setup explicitly supports 10/20/30/50 questions and 30/60/90/120-minute sessions.
- Active state is initialized as in-memory variables: `questions`, `answers`, `flags`, `cur`, `remain`, `elapsed`.
- `buildQuestions()` resets those arrays/counters when a session starts.
- Selection/navigation/timer mutations update only those in-memory values.
- The only localStorage use in this page is the theme preference; no active-session checkpoint/restore path or `beforeunload` recovery path was found.
- Therefore a reload/interruption before `finish()` initializes a fresh page and cannot reconstruct the prior active exam.

Impact is recoverability, not a total outage: uninterrupted exams remain usable, but a supported session can last up to 120 minutes and a recoverable interruption can discard all answers, flags, position and timing state. No user-frequency percentage and no production incident are claimed.

Minimum effective repair: a small local active-session checkpoint with resume/discard and safe corrupt/stale handling. Documentation alone is insufficient; a warning alone does not restore an interrupted session. No login, cloud sync, database, adaptive scheduler, attempt ledger, generalized state machine, paid service, or cross-device system is required.

This is distinct from #60, whose fingerprint is completed per-question learner history/adaptive review. #69 is only about recovering one currently active mock exam.

## Existing findings / dedupe

- #58 `[P2][50-persona audit] Preserve and render the 4 image-based answer choices` remains open; PR #59 is not merged and cannot be treated as current product evidence.
- #61 `[P2][RELIABILITY][DOCUMENTATION] Keep dataset quality denominators in sync with the current corpus` remains open.
- #60 is an opportunity/learning-workflow proposal around completed per-question attempt history and deadline-aware review; it was checked as a possible duplicate and is **not** the same root cause as #69.
- New fixed-50 umbrella #68 was created after duplicate search because no existing umbrella tracker was found: https://github.com/Reese-max/police-exam-archive/issues/68

## Rejected / not-promoted candidates

1. `js/quiz-engine.js::prepareQuiz(..., 9999)` was **not** promoted. The supported current `quiz.html` uses its own inline path with a larger pool and no current page reference to `quiz-engine.js` was established. Treating the apparently unreferenced helper as a reachable product defect would overstate evidence.
2. Custom radio controls re-render after selection and may create keyboard-focus friction. The source suggests a possible accessibility gap, but no real-browser/AT reproduction in this run established P2 impact. It remains a runtime-validation candidate, not a new actionable P2.
3. Existing open opportunities were not converted into bugs merely because the fixed personas would benefit from them.

## Fixed A01–J05 matrix

Evidence labels below distinguish source simulation from actual execution. `CI_EXECUTED` refers only to the exact-SHA Actions evidence above; `NEEDS_RUNTIME` means the relevant browser/device/provider behavior was not executed in this round.

| Persona | Core scenario / success condition | Observation at inspected SHA | Evidence / result |
|---|---|---|---|
| A01 | first-time mobile candidate starts a quiz | setup exposes range, count and time; mobile browser interaction not rerun | SOURCE_CONFIRMED; NEEDS_RUNTIME |
| A02 | non-CLI student understands browser start path | web setup is self-contained; no CLI required for learner path | SOURCE_CONFIRMED |
| A03 | technical student uses filters and current corpus | category/year/subject filtering is present | SOURCE_CONFIRMED |
| A04 | time-pressured candidate completes a long core quiz | interruption loses active work; image-choice incompleteness also remains | **P2 #69; P2 #58** |
| A05 | visual learner understands question content | four image-dependent choices remain unresolved on default | **P2 #58** |
| B01 | office novice starts without tooling | web controls expose direct setup/start flow | SOURCE_CONFIRMED; NEEDS_RUNTIME |
| B02 | junior engineer diagnoses failures | exact-SHA CI actually ran and succeeded; browser recovery not covered | CI_EXECUTED; NEEDS_RUNTIME |
| B03 | designer expects reversible mistakes | submit warns on unanswered; active-session interruption has no restore | **P2 #69** |
| B04 | research assistant trusts/exportable corpus scope | public quality denominators still have known drift | **P2 #61** |
| B05 | shift worker uses fragmented/mobile time | active mock exam cannot resume after interruption | **P2 #69** |
| C01 | police/public user requires correctness/provenance | corpus checks execute, but image fidelity and denominator trust gaps remain | CI_EXECUTED; **#58/#61** |
| C02 | teacher uses low-learning-cost web flow | direct quiz setup exists; no new multi-user defect established | SOURCE_CONFIRMED; NEEDS_RUNTIME |
| C03 | high-risk user needs source/error boundaries | official-corpus checks run; public denominator scope is inconsistent | **P2 #61** |
| C04 | creator needs long workflow not to disappear | active quiz state is memory-only | **P2 #69** |
| C05 | SRE needs observable/fail-safe execution | CI receipts are real; browser interruption path is not governed | CI_EXECUTED; NEEDS_RUNTIME |
| D01 | manager reads trustworthy summary | existing corpus denominator mismatch remains | **P2 #61** |
| D02 | PM traces status/issues | #58/#61/#69 plus umbrella #68 provide traceability | SOURCE_CONFIRMED |
| D03 | IT admin checks deployment/backup boundary | Pages workflow succeeded; learner active-state recovery absent | CI/DEPLOY_WORKFLOW_EXECUTED; NEEDS_RUNTIME |
| D04 | cost-sensitive user avoids surprise spend | learner surface is static/local; no new paid-provider path identified | SOURCE_CONFIRMED |
| D05 | audit role needs provenance and data truth | denominator scope inconsistency remains actionable | **P2 #61** |
| E01 | older office user completes setup | controls are visible/source-readable; usability not browser-tested | SOURCE_CONFIRMED; NEEDS_RUNTIME |
| E02 | desktop/large-text user operates quiz | responsive static checks ran; 200%/real-browser behavior not executed | CI_EXECUTED; NEEDS_RUNTIME |
| E03 | low-digital user recovers from accidental interruption | no active-session restore/discard recovery | **P2 #69** |
| E04 | spreadsheet-familiar user avoids cloud tooling | static learner path does not require cloud admin tooling | SOURCE_CONFIRMED |
| E05 | long-duration user completes 90/120-minute session | supported long sessions amplify interruption loss | **P2 #69** |
| F01 | older first-time user finds clear primary controls | start/navigation controls exist; no physical usability session | SOURCE_CONFIRMED; NEEDS_RUNTIME |
| F02 | low-vision user uses contrast/zoom | theme/responsive source exists; real 200% zoom not executed | SOURCE_CONFIRMED; NEEDS_RUNTIME |
| F03 | low-precision user operates touch targets | button/choice controls exist; touch-target runtime not executed | SOURCE_CONFIRMED; NEEDS_RUNTIME |
| F04 | memory-sensitive user relies on persistent state | active state disappears on reload/interruption | **P2 #69** |
| F05 | assisted setup then independent daily use | learner path is browser-local; recovery still missing | SOURCE_CONFIRMED; NEEDS_RUNTIME |
| G01 | keyboard-only answers/navigates | choices have radio role/tabindex and Enter/Space handlers; focus after re-render not executed | SOURCE_CONFIRMED; NEEDS_RUNTIME (not promoted) |
| G02 | screen reader understands complete questions | image-choice content remains incomplete; custom-radio AT runtime not rerun | **P2 #58**; NEEDS_RUNTIME |
| G03 | color-limited user distinguishes state | textual labels exist, but complete non-color behavior not browser/AT tested | SOURCE_CONFIRMED; NEEDS_RUNTIME |
| G04 | 200% zoom/narrow viewport completes quiz | CI responsive checks executed; actual zoom/browser path not executed | CI_EXECUTED; NEEDS_RUNTIME |
| G05 | slow/high-latency user survives disruption | local/static flow helps after load, but interruption cannot resume; image assets remain blocker for #58 | **P2 #69/#58** |
| H01 | Windows maintainer validates project | CI is Linux-hosted; no Windows-specific product defect established | CI_EXECUTED; NEEDS_RUNTIME where OS-specific |
| H02 | macOS maintainer validates project | no macOS-specific defect established | CI_EXECUTED; NEEDS_RUNTIME where OS-specific |
| H03 | Linux/CI noninteractive validation | exact-SHA 3-version CI jobs executed successfully | **CI_EXECUTED** |
| H04 | self-host/Pages deployer checks deploy | exact-SHA Pages workflow executed successfully | **DEPLOY_WORKFLOW_EXECUTED** |
| H05 | first-time maintainer finds single truth | known public corpus denominator drift remains | **P2 #61** |
| I01 | repeated click/re-submit does not corrupt quiz | no distinct current-source P0/P1/P2 chain established | SOURCE_SIMULATION; NEEDS_RUNTIME |
| I02 | close/reload then recover | active exam cannot be reconstructed | **P2 #69** |
| I03 | invalid input fails safely | setup uses constrained selects/buttons; no new severe chain found | SOURCE_SIMULATION; NEEDS_RUNTIME |
| I04 | timeout/429/5xx path | core quiz is local after assets load; network-failure browser path not executed | NEEDS_RUNTIME |
| I05 | partial success then retry | unanswered submit warning exists; interruption recovery remains absent | **P2 #69** for interruption; NEEDS_RUNTIME |
| J01 | large dataset remains usable | current corpus CI/search-index checks execute; real large-device perf not executed | CI_EXECUTED; NEEDS_RUNTIME |
| J02 | concurrent/multi-user behavior | static local learner state has no shared server-side session in this flow; no new defect established | SOURCE_SIMULATION |
| J03 | long-running 120-minute task survives resource/interruption | active state remains memory-only | **P2 #69** |
| J04 | privacy-sensitive user avoids unintended sharing | active quiz state is local memory; no new server data-sharing path found | SOURCE_CONFIRMED |
| J05 | expert uses shortest/trustworthy path | existing image/provenance gaps still apply; no new shortcut-specific defect | **P2 #58/#61** |

Coverage: **50/50 fixed personas re-reviewed**. This is a synthetic source/evidence review, not 50 real-user tests.

## Ten-dimension summary

1. First understanding: source path exists; real first-use browser study not rerun.
2. Core task: source and exact-SHA CI support the static application, but open #58 can make affected questions incomplete.
3. Error recovery: **new P2 #69** for interruption/reload loss.
4. Data safety: no new cross-user/private-data path established in this static learner flow.
5. Observability: timer/progress/unanswered warning exist; interrupted state has no recovery indicator because no checkpoint exists.
6. Accessibility/device: #58 remains; keyboard/AT/200% zoom/mobile require real runtime evidence.
7. Performance/cost: no new P0/P1/P2 established; real large-corpus browser performance remains runtime-only.
8. Maintainability: #61 remains; exact-SHA CI executes current tests/build checks.
9. Failure injection: interruption is source-confirmed as unrecoverable; network/browser/provider failure paths were not destructively exercised.
10. Trust: official-source/data checks are strong, but #58/#61 still prevent CLEAN.

## Writes and coordination

- Created umbrella #68 after duplicate search.
- Created actionable P2 #69 after issue/PR/audit/branch dedupe.
- Added `github-issue-lock:v1` audit leases to #68 and #69 and read them back; no competing valid marker was present.
- No product source, CI, settings, branch, PR, merge, deployment, secret, paid provider or worker was changed/started.
- Repo-local `master` is protected. Existing audit PR #67 was deliberately not repurposed; this unique central report is the durable record for this run.

## CLEAN decision

**NOT CLEAN, 0/2.** New P2 #69 resets/keeps the streak at zero. Existing #58 and #61 also remain open. Required browser/device/accessibility evidence is incomplete. The exact-SHA CI/Pages successes are retained as valid evidence only for the paths they actually executed.

A future fix to #69 must land on the default branch and be verified with the same interruption persona/trigger and an actual browser reload/reopen path before it can be marked `VERIFIED_FIXED`. Issue closure, PR merge, or source diff alone is insufficient.
