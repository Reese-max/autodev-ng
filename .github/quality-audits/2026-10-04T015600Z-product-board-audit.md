# Product Board Audit — 2026-10-04T01:56:00Z

- Status: **PARTIAL / NOT CLEAN**
- Audit window: 2026-10-03T23:01:00Z–2026-10-04T01:56:00Z
- Rules blob SHA: 8167e10798071d2276addaff6b201c6b0e904a2a
- Inventory: 45 owned repositories; 44 active, 1 archived
- Default-branch product changes: 4 repositories
- Existing Issues with activity: 11
- Product PRs with activity: 9
- Deep-read cursor completed: soundbox-offline
- Next deep-read cursor: police-exam-archive
- Scope: audit and triage only; no product implementation, issue takeover, merge, deployment, settings, secrets, paid action, worker, or GOAL was started.

## Executive decision

A new P2 candidate was confirmed on the active 92-duty-scheduler PR #42 at head be3343370bc268c8145ff9270134129e18ff84a7. The candidate correctly keeps the old exclusion set visible while an empty backend update is pending and locks exclusion editing, but exclusion-dependent scheduling actions remain enabled. If the administrator starts auto-scheduling, simulation, fill-empty, or manual assignment before the clear request succeeds, eligibility still reads the old S.excluded set. The request can then succeed, leaving a schedule that silently excludes people the administrator just cleared.

This is SOURCE_CONFIRMED, not an executed browser/D1 reproduction and not a default-branch regression. Issue #35, PR #42, multiple issue-35 branches, and a fresh unresolved review thread already own the scope. Disposition: SKIPPED_LOCKED_ACTIVE_PR. No duplicate Issue, lock marker, or comment was added.

Smallest correction: while exclusionEditPending() is true, block or await only actions that consume exclusion eligibility; after the existing update settles, run them against the acknowledged set. Do not introduce a global workflow engine, database version protocol, or generalized scheduler transaction layer.

## Discovery and evidence

| Check | Result |
|---|---|
| Rules | Read successfully; blob SHA unchanged |
| Inventory | Fully enumerated: 44 active, obsidian-vault archived |
| Default HEADs | All 44 active repositories re-read; four product merges identified |
| Issue/PR state | All changed Issues/PRs in the window inspected; relevant comments read across all pages |
| CI/deploy | Candidate and merge-related run/job evidence inspected where available |
| Runtime | No production/student data read, D1 mutation, browser session, provider call, merge, or deployment |
| CLEAN | Not eligible: fixed A01–J05 stop conditions, two qualified complete rounds, and required runtime evidence are not all satisfied |

## Finding PB-20261004-01

- Repository: [Reese-max/92-duty-scheduler](https://github.com/Reese-max/92-duty-scheduler)
- Existing Issue: [#35](https://github.com/Reese-max/92-duty-scheduler/issues/35)
- Active candidate: [PR #42](https://github.com/Reese-max/92-duty-scheduler/pull/42)
- Independent tracking evidence: [review thread](https://github.com/Reese-max/92-duty-scheduler/pull/42#discussion_r4175757969)
- Candidate head: be3343370bc268c8145ff9270134129e18ff84a7
- Default head: 4d7d7d4911ffd580630661a2f71079a2c38c6ae1
- Fingerprint: 92-duty-scheduler + pending clear-all + exclusion-dependent schedule action + stale S.excluded read + clear later succeeds
- Kind: BUG
- Severity: P2
- Decision priority: NOW
- Triage: NEEDS_REVIEW
- Auto implementation: false
- Confidence: CONFIRMED
- Evidence: SOURCE_CONFIRMED
- Runtime: NEEDS_RUNTIME_VERIFICATION
- Tracking: SKIPPED_LOCKED_ACTIVE_PR

### Reachable failure

1. Backend mode has one or more excluded students.
2. Administrator presses Clear All.
3. PR #42 sets exclusionClearPending, but retains the old set until API.updateExclusions(empty) acknowledges.
4. Search/add/delete/import controls are blocked; auto schedule, simulation, fill-empty, and assignment paths remain reachable.
5. Those paths call isEligible(), whose first check is S.excluded.has(student.id).
6. A schedule created during the delay therefore excludes the old IDs.
7. The clear request then succeeds and the UI/backend move to an empty exclusion set, but the already-produced schedule reflects stale eligibility.

Impact: the operator receives a schedule inconsistent with the acknowledged exclusion state and may need to discover and rerun the schedule manually. This affects a core weekly scheduling flow and recoverability, supporting P2. It is not P1 because no production incident, unrecoverable write, authorization breach, or executed impact is established.

### Minimal effective scope

1. Guard auto-schedule, simulation, fill-empty, reschedule/manual candidate selection, and any other path that invokes exclusion-aware eligibility while exclusionEditPending() is true.
2. Either show the existing retryable “sync in progress” state or await exclusionSync before taking the eligibility snapshot.
3. On success, generate from the acknowledged empty set; on failure, retain the old set and do not create a schedule under the unconfirmed user intent.
4. Keep offline/local clear immediate.
5. Add a deferred updateExclusions test covering clear pending → scheduling attempt → success and failure.

Non-goals: global app freeze, database transaction redesign, new availability service, worker orchestration, generalized command queue, or merge/deploy authorization.

### Verification state

- PR #42 exact-head [CI & Deploy run 36486792834](https://github.com/Reese-max/92-duty-scheduler/actions/runs/36486792834) ran npm ci and npm run check successfully; its preview job also succeeded and production was skipped.
- The fresh review finding was made against the same head after that run. Existing tests do not prove scheduling is blocked while clear-all is pending.
- Preview success is not isolated D1 add → clear → state readback proof.
- Default branch still contains the original clear-all defect; this new finding is candidate-only.
- Status: CANNOT_VERIFY / NEEDS_RUNTIME_VERIFICATION.

## Landed-change regression review

| Repository | New default HEAD | Evidence | Classification |
|---|---|---|---|
| police-essay-mcp | 97e994f72c0055b5d2a6d520d029b0bd18621f17 | Key server/storage blobs match the tested PR head; candidate CI succeeded. No remote MCP client artifact readback was executed after landing. | PARTIALLY_FIXED / NEEDS_RUNTIME_VERIFICATION |
| travel-planning-mcp | dbb66acf1456f41e7e8a49e5b86603b3f0159aef | Import-preview adapter blob matches candidate; candidate CI and TRIP integration passed. Feature remains explicitly read-only/non-persisting. | SOURCE_VERIFIED; runtime/provider evidence pending |
| soundbox-offline | d58d73ad6a8e5c512991ed7d74f5f3b13262cf7d | Lockfile and rendered-HTML test blobs match candidate; exact-head CI and deploy prerequisite passed. Preview deploy failed at Deploy Preview; production skipped. | PARTIALLY_FIXED / deployment verification blocked |
| google-maps-personal-mcp | e97adace1b85347724249d6259976d483f89a181 | Profile-lease and app blobs match candidate; exact candidate CI reports 48 tests passed. No live Chrome/Google Maps write replay. | PARTIALLY_FIXED / NEEDS_RUNTIME_VERIFICATION |

No merge or green test alone is treated as VERIFIED_FIXED.

## External competitor matrix

Official product/help pages checked 2026-10-04 UTC. These are product claims and workflow references, not proof of this repository defect or independent effectiveness evidence.

| Product | Supported task and first success | Conflict/exception behavior | Mobile/API/pricing evidence | Direction |
|---|---|---|---|---|
| [Deputy scheduling](https://help.deputy.com/hc/en-au/articles/4688731978639-Creating-shifts-on-your-schedule) | Manager creates and publishes shifts | Recommendations consider availability/leave, training, location permission, fatigue, and conflicting shifts; overrides warn users | Web/mobile product; [official pricing](https://www.deputy.com/pricing) varies by plan/business size | MUST MATCH: acknowledged eligibility state before generation |
| [When I Work availability](https://help.wheniwork.com/articles/interpreting-availability-on-the-schedule-computer/) | Manager sees availability and time off while building schedule | Conflicts are surfaced for time off, unavailability, or overlapping shift; help article updated 2026-03-16 | Web/mobile; [official pricing](https://wheniwork.com/pricing) is per-user/plan | SHOULD BE BETTER: bounded fail-closed pending state |
| [Sling](https://support.getsling.com/en/articles/1246075-unavailability-versus-time-off) | Employee records unavailability/time off; manager schedules around it | Separates recurring unavailability from time-off requests | Desktop/mobile; [pricing](https://getsling.com/pricing/) includes a free tier up to 30 users per current page | DIFFERENTIATOR: simple local/offline path with inspectable rules |
| Spreadsheet/manual checklist | Operator waits for confirmation and rebuilds schedule manually | Human procedure can serialize changes, but has no automatic invariant | Low cost, weak audit/recovery | DO NOT COPY: silent stale-state reliance |

Portable lesson: exclusion/availability state and schedule generation need one acknowledged ordering boundary. Competitor feature breadth, AI scheduling, payroll, messaging, or pricing does not justify expanding this fix.

## Simulated product board

These are model-generated viewpoints, not independent expert votes.

| View | Position |
|---|---|
| CEO | If only three things: close the pending-clear scheduling race; obtain isolated D1/browser proof; reconcile duplicate Issue #35 candidates. Do not build a workforce platform. |
| CPO | The user intent is “these people are eligible again”; schedule generation must not outrun that confirmation. |
| CTO | Reuse exclusionEditPending/exclusionSync. A narrow guard or await is sufficient. |
| Staff/Principal Engineer | Keep one root and one candidate; cover every eligibility consumer, not every UI control. |
| UX Lead / Researcher | Disable affected actions with explicit “排除名單同步中” feedback; do not leave buttons apparently functional. |
| Growth | Correct weekly output outweighs adding AI or collaboration features; no acquisition claim is supported. |
| CFO | Low-scope reliability fix is justified; no paid service or infrastructure purchase. |
| Security / Privacy | Use synthetic IDs for runtime proof; do not inspect formal student records. |
| QA | Add deferred success/failure tests and one isolated preview D1 readback; current green CI predates the new assertion. |
| SRE | Preview deploy success does not prove the data transaction or browser ordering. |
| Accessibility | Disabled/blocked actions need an announced reason and restored focus/state after completion. |
| Support | The support symptom is “I cleared exclusions but the schedule still omitted them”; one deterministic recovery path is needed. |

Disagreement retained: UX favors disabling affected actions; Engineering may prefer awaiting the barrier. Both are acceptable if the user receives visible pending feedback and the eligibility snapshot is taken only after settlement.

## 50 synthetic personas

This is a simulation, not user research, prevalence, revenue, ROI, or priority evidence. R01–R30 are regression baselines; E01–E20 are exploration cases. They do not replace fixed A01–J05 roles or CLEAN rounds.

| ID | Background / constraint | Task and journey | Simulated outcome | Class / recommendation / evidence |
|---|---|---|---|---|
| R01 | Weekly scheduler, fast network | Clear exclusions, then auto-schedule | Request settles before next action | PASS baseline / inference |
| R02 | Weekly scheduler, slow D1 | Clear then auto-schedule immediately | Old exclusions shape new schedule | P2 / source-confirmed |
| R03 | Scheduler testing options | Clear then simulate immediately | Simulation uses stale set | P2 / source-confirmed |
| R04 | Scheduler with partial table | Clear then fill empty slots | Fill uses stale eligibility | P2 / source-confirmed |
| R05 | Manual assigner | Clear then open candidate list | Candidates can reflect old exclusion | P2 / source-confirmed |
| R06 | Scheduler, failed clear | Start schedule before rejection | Output is created under unconfirmed intent | P2 / source-confirmed |
| R07 | Offline-only operator | Clear local set | No async backend window | PASS / source inference |
| R08 | Admin reloads after success | Clear and refresh | Candidate intends empty readback | PARTIAL / runtime pending |
| R09 | Admin adds exclusion during clear | Try search/add | Candidate blocks edit | PASS candidate / static |
| R10 | Admin deletes one during clear | Try tag delete | Candidate blocks edit | PASS candidate / static |
| R11 | Admin imports backup during clear | Attempt import | Candidate blocks/serializes import | PASS candidate / static |
| R12 | Admin clears during backup import | Attempt overlapping clear | Candidate rejects overlap | PASS candidate / static |
| R13 | Leave operator | Confirm leave during clear | Candidate now guards this path | PASS candidate / static |
| R14 | Template user | Apply template that changes exclusions | Separate unsynced path already noted | EXISTING GAP / no new issue |
| R15 | High-latency campus network | Wait several seconds | Exposure window increases; frequency unknown | P2 context / inference |
| R16 | Keyboard-only operator | Trigger clear, tab to auto-schedule | Reachable stale action | P2 / static |
| R17 | Screen-reader operator | Hear clear control then navigate | Pending reason may be unannounced | ACCESSIBILITY GAP / runtime |
| R18 | Mobile browser operator | Tap actions rapidly | Mobile behavior not executed | UNKNOWN / browser proof |
| R19 | Two administrators | Concurrent exclusion/schedule work | Cross-client ordering not established | RESEARCH backlog |
| R20 | Operator retries failed clear | Retry then schedule | Needs visible recovery and barrier | P2 acceptance |
| R21 | Preview tester | Add synthetic IDs, clear, reload | Required D1 proof absent | VALIDATION_GAP |
| R22 | Production operator | Use current default | Original clear-all bug remains | STILL_REPRODUCIBLE source |
| R23 | Reviewer | Inspect exact PR head | New P2 thread exists | TRACKED / active PR |
| R24 | Maintainer choosing PR #53 | Minimal clear fix | Earlier writes may race | REJECT as sole candidate |
| R25 | Maintainer choosing PR #42 | Serialized writes/import | Strongest candidate, new action guard needed | NARROW |
| R26 | Authenticated admin | Read state | Auth boundary not changed here | OUT OF SCOPE |
| R27 | Student user | View own timetable | No clear-all access intended | UNAFFECTED |
| R28 | Privacy reviewer | Verify with synthetic roster | No formal student data needed | Guardrail |
| R29 | CI reviewer | Read run 36486792834 | Existing checks pass | Not sufficient for new case |
| R30 | Semester reset operator | Reset during sync | Candidate guard exists | PASS candidate / static |
| E01 | UX designer | Disable affected buttons | Clear mental model, needs reason text | NARROW option |
| E02 | Engineer | Await exclusionSync in handlers | Preserves action intent | NARROW option |
| E03 | Engineer | Add global app transaction manager | Larger than demonstrated root | REJECT |
| E04 | Product owner | Add employee self-service leave | Not needed for this defect | LATER research |
| E05 | Scheduler | Cancel pending clear | Cancellation not supported/required | NOT_ESTABLISHED |
| E06 | Scheduler | Queue auto-schedule after clear | Could await then execute | NEEDS_REVIEW |
| E07 | Scheduler | Modify duties while clear pending | Independent config path may remain available | Test adjacency |
| E08 | Operator | Generate empty schedule only | Does not yet consume eligibility | Avoid over-blocking |
| E09 | Operator | Confirm simulation after clear changes | Existing result may be stale | Test/guard adoption |
| E10 | Operator | Reschedule one duty during pending clear | Eligibility consumer | Include acceptance |
| E11 | Operator | Undo schedule after stale generation | Recovery exists but should not be required | P2 impact |
| E12 | Support agent | Reproduce with deferred promise | Deterministic without D1 | BUILD test |
| E13 | QA engineer | Run isolated preview D1 | Validates add-clear-readback | BUILD evidence |
| E14 | SRE | Inspect preview deployment | Deployment success alone insufficient | Guardrail |
| E15 | Accessibility tester | Check aria-live pending notice | Current evidence unknown | NEEDS_EVIDENCE |
| E16 | Security tester | Use synthetic identities | Safe, bounded runtime | BUILD |
| E17 | CFO | Compare paid workforce suites | Feature parity not justified | DON’T |
| E18 | Growth lead | Add AI auto-scheduling | No demand/effect evidence | DON’T |
| E19 | Maintainer | Consolidate duplicate branches | Reduce review/merge risk | NOW process |
| E20 | Owner | Decide disable versus await | Both valid if invariant holds | NEEDS_REVIEW |

Synthetic switching/preference share was not calculated.

## Red Team

| Counter-hypothesis | Result |
|---|---|
| The user can wait for the clear request | Workaround exists, but enabled scheduling actions invite a reachable conflicting path; finding stands. |
| Old exclusions are intentionally retained until success | Correct for rollback, but any schedule produced before success becomes stale immediately after success. |
| Existing pending flag solves this | Rejected: it guards exclusion edits/import, not eligibility-consuming schedule actions. |
| Disable the whole application | Rejected as overbroad; only eligibility consumers need the barrier. |
| Add a transaction/versioning framework | Rejected; existing promise and flag are sufficient for the demonstrated root. |
| Existing CI proves the case | Rejected; the successful run predates and does not assert this interaction. |
| Preview deployment proves D1 correctness | Rejected; no synthetic add-clear-readback job is recorded. |
| This is P1 | Rejected; recoverable output inconsistency, candidate-only status, and no production incident support P2. |
| Open a second Issue | Rejected; Issue #35, PR #42, review thread, and active branches already own the same clear-all state transition. |
| Merge status equals fix | Rejected; PR #42 is unmerged and default still has the original defect. |

## NOW / NEXT / LATER / DON’T

### NOW

1. Guard or await exclusion-dependent scheduling while clear-all is pending.
2. Add deferred success/failure interaction tests on the same candidate.
3. Reconcile duplicate Issue #35 candidates; retain one bounded implementation path.

### NEXT

- Execute isolated synthetic Pages Functions/D1 add → clear → state readback.
- After landing, replay auto-schedule, simulation, fill-empty, manual/reschedule, failure recovery, and offline mode on the default SHA.
- Recheck accessibility feedback and focus restoration.

### LATER

- Validate whether week-bounded versus semester-bounded exclusions need separate semantics using real owner requirements.
- Consider self-service availability only as a separately authorized research question.

### DON’T

- Do not build payroll, chat, AI optimization, a generalized transaction engine, or employee portal from this bug.
- Do not infer frequency or harm from synthetic personas.
- Do not auto-implement, merge, deploy, or use formal student data.

## Decision memo

- **Served users:** authenticated weekly duty schedulers maintaining leave/public-duty exclusions and generating schedules.
- **Why this choice:** correctness depends on one acknowledged eligibility state; this is smaller and more valuable than feature expansion.
- **Differentiation:** transparent, bounded local/offline behavior and inspectable eligibility rules.
- **Top three priorities:** close the pending race; prove isolated D1/browser behavior; consolidate duplicate candidates.
- **Not doing:** no platform rewrite, employee marketplace, paid integration, or unsupported AI.
- **Risk/experiment:** deferred-promise interaction test plus synthetic preview D1 run; success means no schedule can use a superseded exclusion snapshot.
- **Recommendation:** 92-duty-scheduler = MAINTAIN / SIMPLIFY. No portfolio merge, pause, archive, or infrastructure program is authorized.

## Portfolio ranking and overlap

The full inventory was rechecked before ranking. Existing evidenced P1 safety/service blockers remain above this P2. Within 92-duty-scheduler, the immediate priority is candidate reconciliation around Issue #35; abstract shared infrastructure is not justified. The four landed changes are tracked as partial until their original runtime success conditions are replayed on default.

## Accounting

- New actionable findings: 1
- New Issues: 0
- Issues updated/reopened: 0
- PR comments added by this audit: 0
- Prospective duplicate rejected: 1
- Active/locked scope skipped: 1
- Landed changes reclassified PARTIALLY_FIXED/runtime pending: 3
- Read-only feature landing reviewed: 1
- Verified fixed: 0
- Product implementation writes: 0
- Audit writes: this report only
- Portfolio CLEAN: NO

## Inventory snapshot

| Repository | Default HEAD | Disposition |
|---|---|---|
| cf-ai-router | 74c52130046a | active |
| soundbox-offline | d58d73ad6a8e | active |
| police-exam-archive | a0b5dbb9352b | active |
| skill-foundry | d283b5b8af94 | active |
| prompt-autoresearch | 01dc864c04a0 | active |
| lobsterpulse | 41e09eb922a3 | active |
| google-maps-personal-mcp | e97adace1b85 | active |
| tick-stock-panel | 54c303476e5d | active |
| clinical-scribe-worker | 5fb1bc6d5eef | active |
| ai-flight-radar | 6228138337f9 | active |
| openab | 50424ed46177 | active |
| adng-memory | dc1c4e7f0531 | active |
| avatar-vfo | 8c578febb49a | active |
| taiwan-intel-dashboard | df7cee191aa5 | active |
| note-filler | 1df674dd32d6 | active |
| cyber-prep-coach | ffc7bbbb2837 | active |
| UkePack | 718d021f0147 | active |
| autodev-ng | c521ee021db6 | active |
| ai-novel-workstation | 267a0b6a9856 | active |
| police-essay-mcp | 97e994f72c00 | active |
| herdr-skills | 9f134e1b0a53 | active |
| chatgpt-dual-pipeline | 1ade604e9ed0 | active |
| video-timeline-pipeline | 7d8929728fc7 | active |
| claude-mem | 3ed5439ff683 | active |
| travel-planning-app | dd5081dfee74 | active |
| MaterialYouNewTab | 7d32f2f460cc | active |
| taichung-police-intel | 562141e396c6 | active |
| travel-planning-mcp | dbb66acf1456 | active |
| octobroker | b669101c0ef4 | active |
| ninax-line-hermes | b71a827f577c | active |
| 92-duty-scheduler | 4d7d7d4911ff | active |
| voice-actress | 75cdcea43ca4 | active |
| project-doctor-web | f34dd1d7b011 | active |
| openab-pty | 9e1464058335 | active |
| flux-image-gen | dfadcf30ca1d | active |
| neciken-summer-poem | a6e268b7cbff | active |
| minideck | 31f7131ae24a | active |
| studio | 0f1b62d3c543 | active |
| police-exam-practice | b97b96dbda2d | active |
| ppt-studio | 8ca3b8ca9b32 | active |
| exam-archive | 5d74726eed8f | active |
| spotify-playlist-organizer-mcp | 13aae7852901 | active |
| academic-mcp | 81452f469695 | active |
| cf-mcp-server | a3192b6d7be2 | active |
| obsidian-vault | — | archived; excluded from product defect creation |

## Limitations and remaining work

This round completed full inventory and the change-driven window, plus the soundbox-offline fairness cursor. It was not a complete fixed A01–J05 qualification round. The new finding is static source evidence; no authorized browser/D1 interaction was executed. Hosted runs prove only their recorded commands. Public competitor pages are first-party product claims, not independent outcome studies. The next fairness cursor is police-exam-archive.
