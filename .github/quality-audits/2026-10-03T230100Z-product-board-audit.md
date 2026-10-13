# Product Board Audit — 2026-10-03T23:01:00Z

- Status: **PARTIAL / NOT CLEAN**
- Audit window: 2026-10-03T20:01:00Z–2026-10-03T23:01:00Z
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Portfolio inventory: 45 owner repositories; 44 active, 1 archived
- Product default-branch changes in window: 0
- Issues updated in window: 0
- Pull requests updated in window: 6
- Deep-read fairness cursor after this round: `soundbox-offline`
- Scope: audit and triage only. No product code, workflow, settings, secrets, implementation branch, merge, deployment, paid action, worker, or GOAL was started.

## Executive decision

A new, actionable P2 candidate was confirmed in the active `project-doctor-web` PR #31 at head `b7c216ffc0de4232b7190102d358ec0372729cec`: while a provider turn is pending, the patient-reply and objective inputs remain editable, but a successful response later clears both fields unconditionally. A user who types the next answer or edits the clinical objective during the wait can silently lose that text.

This is **SOURCE_CONFIRMED**, not an executed browser reproduction and not a default-branch regression. The active PR and an unresolved inline review already own the scope, so this audit records `SKIPPED_LOCKED_ACTIVE_PR` and does not add a duplicate issue or comment.

Recommended smallest correction: preserve the submitted snapshot. Clear the submitted value before awaiting the provider, or clear after success only when the current field still equals the submitted value. Apply the same rule to reply and objective, and add one deferred-provider component test proving text typed during the wait survives. Do not introduce a draft database, new state machine, or cross-session persistence framework.

## Discovery evidence

### Incremental scan

| Evidence | Result |
|---|---|
| Rules | Read successfully; blob unchanged at `8167e10798071d2276addaff6b201c6b0e904a2a` |
| Inventory | Fully paginated: 45 owned repositories, 44 active, 1 archived |
| Default branches | All 44 active HEADs inspected; no commit landed after 20:01Z |
| Issues | All-state update search for the window returned 0 |
| Pull requests | 6 updated PRs were read with metadata, patches, comments/reviews, and available checks |
| CI/deploy | No exact-head GitHub Actions run/status found for `project-doctor-web` PR #31 |
| Runtime | No authorized browser/provider execution performed; affected finding remains `NEEDS_RUNTIME_VERIFICATION` |
| CLEAN | Not claimed; the fixed A01–J05 stop conditions, two complete qualified rounds, and required runtime evidence are not satisfied |

### Updated pull requests inspected

| Repository / PR | Head | Finding |
|---|---|---|
| `police-exam-practice#7` | `7effc4ba08f8` | Existing no-JS recovery work; exact-head CI passed, browser runtime gap remains |
| `taichung-police-intel#112` | `3691935…` | One read-only canary; candidate remains PARTIAL and not promotion eligible |
| `project-doctor-web#31` | `b7c216ffc0de` | **New P2 candidate:** edits made during pending provider turn can be erased |
| `cyber-prep-coach#20` | `707361d…` | Dependency floor corrected; unrelated missing review-pack still fails full check |
| `autodev-ng#64` | `11f63b…` | Existing global-budget work; runtime/accounting gaps remain |
| `autodev-ng#139` | audit-only | Prior central audit report; not a product correction |

## Finding PB-20261003-01

- Repository: [Reese-max/project-doctor-web](https://github.com/Reese-max/project-doctor-web)
- Active implementation surface: [PR #31](https://github.com/Reese-max/project-doctor-web/pull/31)
- Existing tracking context: [Issue #19](https://github.com/Reese-max/project-doctor-web/issues/19)
- Independent corroboration: [unresolved review thread](https://github.com/Reese-max/project-doctor-web/pull/31#discussion_r4175055165)
- Fingerprint: `project-doctor-web/ui/pending-provider/typed-next-input/unconditional-success-clear/v1`
- Kind: `BUG`
- Severity: `P2`
- Decision priority: `NOW`
- Triage: `NEEDS_REVIEW`
- Auto implementation: `false`
- Evidence status: `CONFIRMED / SOURCE_CONFIRMED`
- Runtime status: `NEEDS_RUNTIME_VERIFICATION`
- Tracking disposition: `SKIPPED_LOCKED_ACTIVE_PR`

### Who is affected and reachable failure

Patients or clinicians using the supported browser interview can type a next response or refine the objective while the current provider request is slow. The two text inputs remain enabled during `loading`. The handlers capture the submitted values, await `session.sendReply(...)`, and on success unconditionally execute `setReply("")` and `setObjective("")`; `injectObjective()` likewise clears the objective after its await. Text entered after the request begins is therefore erased when the earlier request succeeds.

Consequence: lost patient wording or clinical objective text, forced re-entry, and reduced confidence in a clinical interview flow. This is P2 rather than P1 because the loss is recoverable by retyping, no default-branch regression is established, and no production incident/runtime reproduction is available.

### Minimal effective scope

1. Preserve the exact submitted reply and objective snapshots.
2. Clear before the await, or conditionally clear only if the current value still equals the submitted snapshot.
3. Apply the rule consistently to both `sendPatientReply()` and `injectObjective()`.
4. Add a deferred-provider component test: submit, type/edit while pending, resolve success, and assert the new values remain.
5. Keep provider-call serialization and emergency-latch semantics unchanged.

Non-goals: draft persistence, offline storage, autosave, new database, new state-machine framework, broader clinical workflow redesign, or automatic implementation authorization.

### Regression and verification state

- Candidate head only; default branch remains `f34dd1d7b0112705fa2a1ada5349028b41e6c8b7`.
- No exact-head hosted Actions evidence was found.
- PR body reports local Node 22 tests, but local unit/component success is not browser/provider runtime evidence.
- Status: `CANNOT_VERIFY / NEEDS_RUNTIME_VERIFICATION`; this audit does not call the emergency-latch change fixed or regressed.

## External product comparison

Sources were checked on 2026-10-03 UTC. Product claims are `CONFIRMED` only as public vendor or public-service documentation, not independent outcome evidence.

| Product / source | Position and first success | Relevant capability | Pricing / distribution | Direction |
|---|---|---|---|---|
| [Ada](https://ada.com/help/how-do-i-start-a-symptom-assessment/) ([2026 simplification](https://ada.com/editorial/why-ada-is-simplifying-its-products/)) | Consumer guided symptom assessment in app/web | Structured question flow and result guidance; January 22, 2026 product simplification announcement | Consumer app is publicly accessible; enterprise detail/pricing not established here | **MUST MATCH:** do not lose an answer during a guided interview |
| [Symptomate](https://symptomate.com/) / [Infermedica API](https://developer.infermedica.com/docs/create-a-simple-symptom-checker) | Consumer checker plus embeddable/API workflow | Guided interview, evidence exchange, and `should_stop` control | Public API/docs; current commercial pricing UNKNOWN | **SHOULD BE BETTER:** explicit pending state without destructive input clearing |
| [Buoy Health](https://www.buoyhealth.com/multi-symptom-checker) / [API](https://www.buoyhealth.com/api) | Chat-style symptom checking and partner integration | Conversational assessment and API surface | Public consumer/API presence; pricing UNKNOWN | **DIFFERENTIATOR:** transparent safety latch and inspectable local session behavior |
| [NHS 111](https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-use-111/) / [Pathways](https://digital.nhs.uk/services/nhs-pathways) | Public urgent-care triage | Regulated disposition and emergency escalation | Public-service distribution | **DO NOT COPY:** regulated-service breadth or authority unsupported by this product |

The competitive implication is narrow: reliable preservation of user-entered clinical text is table stakes. Competitor breadth, branding, pricing, or regulatory posture does not justify a larger engineering program.

## Simulated product board

These are model-generated viewpoints, not independent expert votes.

| View | Position |
|---|---|
| CEO | If only three things: preserve typed clinical text; finish runtime proof for the emergency latch; clarify candidate-vs-default status. Do not expand into a regulated triage platform. |
| CPO | Treat silent text loss as NOW/P2; keep the fix local and measurable. |
| CTO | Prefer snapshot-aware state updates over a new state machine. Require a deterministic deferred-promise test. |
| Staff/Principal Engineer | Same root cause spans reply and objective, so one bounded change is appropriate; avoid splitting duplicate issues. |
| UX Lead / Researcher | The dangerous moment is a slow response that invites users to type ahead. Preserve work and show a stable pending state. |
| Growth | Reliability is more valuable than adding another intake feature; no acquisition claim is supported. |
| CFO | Low-scope correction is justified; no paid service or new platform commitment. |
| Security / Privacy | Do not solve with unreviewed persistent storage of clinical text. |
| QA | Source proof is sufficient for triage, not closure; add a deferred-provider test and browser verification. |
| SRE | No production telemetry or hosted exact-head run exists; do not claim incident frequency or recovery rate. |
| Accessibility | Keyboard and assistive-technology users may type during waits; focus must not conceal value loss. Runtime proof remains pending. |
| Support | Silent erasure is difficult to explain and reproduce; the smallest supportable behavior is “new text remains.” |

**Disagreement retained:** UX could disable inputs while loading, while Engineering favors preserving typed-ahead work. Disabling is simpler but increases wait friction and still needs accessible pending feedback. The board recommends preservation, while allowing disabling only if product ownership explicitly selects that behavior.

## 50 synthetic personas

This is a structured simulation, not user research, prevalence, conversion, revenue, or priority evidence. R01–R30 are regression baselines; E01–E20 are exploration cases. These do not replace fixed A01–J05 audits or CLEAN rounds.

| ID | Background / constraint | Task / journey | Simulated friction and outcome | Class / recommendation / evidence |
|---|---|---|---|---|
| R01 | Adult, desktop, fast network | Complete routine interview | Single reply completes normally | PASS baseline; retain / static |
| R02 | Adult, slow provider | Type next reply during wait | New reply is cleared on success | P2; preserve draft / source-confirmed |
| R03 | Clinician, slow provider | Refine objective during wait | Objective edit is cleared | P2; same root / source-confirmed |
| R04 | Patient, cautious typer | Wait for every response | No typed-ahead loss | PASS; no issue / inference |
| R05 | Keyboard-only | Submit and continue typing | Value may disappear after focus remains | P2; runtime test / source-confirmed |
| R06 | Screen-reader user | Hear pending state then edit | Announcement behavior unknown; clear risk remains | GAP; runtime evidence |
| R07 | Mobile user | Slow connection, type ahead | Browser/mobile behavior not executed | UNKNOWN; mobile runtime |
| R08 | Caregiver proxy | Enter long patient narrative | Re-entry cost high if typed ahead | P2 impact support / inference |
| R09 | Non-native speaker | Compose next answer carefully | Silent clear may lose translated wording | P2 impact support / inference |
| R10 | Clinician, concise objective | Inject objective once | No later edit means normal clear | PASS baseline / static |
| R11 | Clinician, evolving objective | Edit while provider pending | Later edit erased | P2; preserve snapshot / source-confirmed |
| R12 | Patient triggers emergency term | Send urgent phrase | Candidate latch should stop normal flow | PARTIAL; browser/provider proof needed |
| R13 | Patient after emergency latch | Try another reply | Candidate code blocks provider calls | PARTIAL; exact-head runtime needed |
| R14 | Clinician after emergency latch | Reset interview | Epoch invalidation exists in source | LIKELY; runtime proof needed |
| R15 | Patient with provider error | Submit then await rejection | Handler retains prior values on error path | LIKELY recoverable / static |
| R16 | Patient with late success | Reset before response returns | Epoch logic aims to ignore stale response | PARTIAL; deferred runtime test |
| R17 | Patient double-clicks submit | Attempt duplicate turn | Button is disabled during loading | LIKELY protected / static |
| R18 | Fast typist | Press Enter then type immediately | Reachable typed-ahead loss | P2 / source-confirmed |
| R19 | Mouse user | Click submit and pause | No new text to erase | PASS baseline / inference |
| R20 | Clinician copies objective | Paste replacement during wait | Replacement can be erased | P2 / source-confirmed |
| R21 | Patient, long session | Many sequential turns | No cross-turn persistence claim | UNKNOWN; do not expand |
| R22 | Patient refreshes page | Recover draft | Persistence unsupported | NOT_ESTABLISHED; do not open |
| R23 | Privacy-sensitive patient | Avoid stored history | In-memory bounded approach preferred | Guardrail; no persistence |
| R24 | Low-bandwidth user | Provider latency | Longer exposure to typed-ahead loss | P2 context / inference |
| R25 | Patient using IME | Compose next answer pending | Composition/runtime interaction unknown | GAP; browser test |
| R26 | Clinician uses objective only | Inject then wait | Submitted value intentionally clears | PASS baseline / static |
| R27 | Clinician edits objective post-submit | Continue documentation | New text erased | P2 / source-confirmed |
| R28 | Patient gets blocked response | Retry after error | Error recovery not fully executed | UNKNOWN; runtime |
| R29 | QA tester | Defer provider promise | Existing suite lacks typed-during-wait assertion | VALIDATION_GAP; add one test |
| R30 | Support investigator | Reproduce silent clear | Deterministic deferred promise is smallest repro | P2 tracking / source-confirmed |
| E01 | Tablet user | Rotate while pending | State preservation across rotation unknown | EVIDENCE backlog; no issue |
| E02 | Voice-input user | Dictate next response while pending | Possible clear; browser support unknown | EVIDENCE backlog |
| E03 | Switch-device user | Continue elsewhere | Unsupported multi-device expectation | DON’T; no issue |
| E04 | Offline user | Complete assessment offline | Not an established product promise | DON’T; no issue |
| E05 | Clinician pastes structured note | Edit during latency | Same P2 root; no separate issue | DEDUPE / source-confirmed |
| E06 | Patient uses browser back | Return to prior step | Journey not established | UNKNOWN; no issue |
| E07 | High-latency region | Repeated slow turns | Increased exposure, frequency unknown | P2 context; no fake rate |
| E08 | User cancels request | Expect text retained | Cancellation flow not established | RESEARCH only if authorized |
| E09 | User changes objective twice | Continue typing during pending | Latest value should remain | P2 acceptance refinement |
| E10 | User submits blank reply | Validation behavior | Existing path not the new root | OUT OF SCOPE |
| E11 | User pastes sensitive data | Pending preservation | Keep only current in-memory value | Privacy guardrail |
| E12 | Shared workstation | Finish and reset | Reset invalidation is candidate-only | PARTIAL; runtime |
| E13 | Clinician reviews transcript | Check prior submitted answer | Transcript behavior not runtime-tested | UNKNOWN; no new issue |
| E14 | User with motor impairment | Slow entry overlaps response | Silent clear has disproportionate re-entry cost | P2 impact / inference |
| E15 | Screen magnifier user | Track pending control | Visual feedback unknown | ACCESSIBILITY backlog |
| E16 | Automated browser test | Type during deferred provider | Should retain current state | Acceptance test / planned |
| E17 | Provider returns instantly | Submit then no interval | Race hard to observe | PASS baseline / inference |
| E18 | Provider returns after 30s | Type full next answer | Entire next answer can be erased | P2 stress case / inference |
| E19 | Product owner | Choose disable vs preserve | Preserve reduces lost work; disable is fallback | NEEDS_REVIEW |
| E20 | Compliance reviewer | Evaluate clinical claims | Product is not validated as regulated triage | DON’T overclaim |

Synthetic switching/preference share was not calculated; model votes are not user counts.

## Red Team

| Counter-hypothesis | Result |
|---|---|
| Users can simply wait and not type | True workaround, but the enabled controls invite typing and the product silently discards it; finding stands. |
| Disable all inputs during loading | Smaller code surface but worse latency UX; acceptable only with explicit product choice and accessible pending feedback. |
| This needs autosave/persistence | Rejected. Conditional state clearing solves the demonstrated root without storing clinical text. |
| Only the reply is affected | Rejected. Objective updates use the same capture-await-unconditional-clear pattern. |
| Existing component tests cover it | Rejected. Current tests enter values before request; they do not mutate fields while a deferred request is pending. |
| PR #31 already fixes it | Rejected at inspected head; the unresolved review points to the same behavior. |
| This is a default-branch regression | Rejected. The behavior was inspected on candidate head; default did not change in the window. |
| Local green tests prove browser/provider success | Rejected. No exact-head hosted Actions or executed browser/provider evidence was found. |
| Severity should be P1 | Rejected. Recoverable re-entry, candidate-only status, and lack of incident evidence support P2. |
| A separate issue is needed now | Rejected. Active PR ownership and an unresolved inline thread already track the exact root. |

## Priority and decision memo

### NOW

1. In PR #31, preserve reply/objective text entered after a request starts.
2. Add the deferred-provider component regression test.
3. Obtain authorized exact-head browser/provider verification for the emergency latch and pending-input behavior.

### NEXT

- Resolve the existing review thread with proof on the same head.
- Verify keyboard, IME, and screen-reader pending-state behavior without broad accessibility redesign.
- Recheck default branch only after the candidate lands; a merge or green diff alone will not equal verification.

### LATER

- Consider explicit pending copy or input disabling only after measuring usability in the supported browser.
- Research cancellation behavior only if product ownership establishes it as a supported task.

### DON’T

- Do not build clinical-text persistence, a new database/state machine, multi-device sync, regulated triage claims, or a portfolio-wide framework from this finding.
- Do not infer frequency, patient harm rate, ROI, or preference share from synthetic personas.
- Do not start implementation automatically; issue/PR presence is not authorization.

### Decision memo

- **Who is served:** patients and clinicians completing a browser-based simulated interview, especially on slower provider responses or assistive input paths.
- **Choice and competitive reason:** prioritize reliable preservation of entered clinical text. Guided interview products make continuity table stakes; breadth is not the gap.
- **Differentiation:** bounded, inspectable safety behavior and explicit evidence status, not unverified medical authority.
- **Top three priorities:** preserve pending edits; verify the emergency latch on exact head; make candidate/default/runtime status explicit.
- **Not doing/removing:** no new persistence platform, no extra product modes, no synthetic “vote” justification, no duplicate issue.
- **Risk/experiment:** deterministic deferred-provider test plus authorized browser run; BUILD/NARROW/REJECT applies only to later optional UX research.
- **Portfolio recommendation:** `MAINTAIN / SIMPLIFY` for `project-doctor-web`; no portfolio-wide investment, merge, pause, or archive action is authorized.

## Tracking and accounting

- New actionable findings: 1
- New issues: 0
- Issues updated/reopened: 0
- PR comments added by this audit: 0
- Duplicates rejected: 1 prospective duplicate
- Locked/active scopes skipped: 1 (`project-doctor-web#31`)
- Severity corrections: 0
- Scope reductions: 1 (explicitly rejected persistence/state-machine expansion)
- Verified fixes: 0
- Runtime pending: 1 new finding plus previously tracked candidate gaps
- Product implementation writes: 0
- Audit writes: this report only
- Portfolio CLEAN: **NO**

## Inventory snapshot

| Repository | HEAD | Disposition |
|---|---|---|
| cf-ai-router | `74c52130046a` | active |
| soundbox-offline | `2d6b46d32453` | active; next deep-read cursor |
| police-exam-archive | `a0b5dbb9352b` | active |
| skill-foundry | `d283b5b8af94` | active |
| google-maps-personal-mcp | `800bc3b5adc3` | active |
| prompt-autoresearch | `01dc864c04a0` | active |
| lobsterpulse | `41e09eb922a3` | active |
| tick-stock-panel | `54c303476e5d` | active |
| clinical-scribe-worker | `5fb1bc6d5eef` | active |
| ai-flight-radar | `6228138337f9` | active |
| openab | `50424ed46177` | active |
| adng-memory | `dc1c4e7f0531` | active |
| avatar-vfo | `8c578febb49a` | active |
| taiwan-intel-dashboard | `df7cee191aa5` | active |
| note-filler | `1df674dd32d6` | active |
| cyber-prep-coach | `ffc7bbbb2837` | active |
| UkePack | `718d021f0147` | active |
| autodev-ng | `c521ee021db6` | active |
| ai-novel-workstation | `267a0b6a9856` | active |
| police-essay-mcp | `500f632995c5` | active |
| herdr-skills | `9f134e1b0a53` | active |
| chatgpt-dual-pipeline | `1ade604e9ed0` | active |
| video-timeline-pipeline | `7d8929728fc7` | active |
| claude-mem | `3ed5439ff683` | active |
| travel-planning-app | `dd5081dfee74` | active |
| MaterialYouNewTab | `7d32f2f460cc` | active |
| taichung-police-intel | `562141e396c6` | active |
| travel-planning-mcp | `a627d888b891` | active |
| octobroker | `b669101c0ef4` | active |
| ninax-line-hermes | `b71a827f577c` | active |
| 92-duty-scheduler | `4d7d7d4911ff` | active |
| voice-actress | `75cdcea43ca4` | active |
| project-doctor-web | `f34dd1d7b011` | active; candidate PR head separately inspected |
| openab-pty | `9e1464058335` | active |
| flux-image-gen | `dfadcf30ca1d` | active |
| neciken-summer-poem | `a6e268b7cbff` | active |
| minideck | `31f7131ae24a` | active |
| studio | `0f1b62d3c543` | active |
| police-exam-practice | `b97b96dbda2d` | active |
| ppt-studio | `8ca3b8ca9b32` | active |
| exam-archive | `5d74726eed8f` | active |
| spotify-playlist-organizer-mcp | `13aae7852901` | active |
| academic-mcp | `81452f469695` | active |
| cf-mcp-server | `a3192b6d7be2` | active |
| obsidian-vault | — | archived; excluded from product defect creation |

## Limitations and remaining work

This round is complete for the change-driven window and full inventory snapshot, but not a full fixed A01–J05 qualification round. No authorized browser/provider runtime was executed, exact-head hosted CI was absent for the new candidate, and public competitor pages provide product claims rather than independent effectiveness evidence. The next fair deep-read target is `soundbox-offline`; default-branch changes, active leases, ownership, and runtime evidence must be rechecked before any future write.
