# Product Board Delta — 92-duty-scheduler Duty Inbox Phase 0

- Inspected at: 2026-09-19T08:08:14Z
- Repository: Reese-max/92-duty-scheduler
- Default branch: main
- Default HEAD: 4d7d7d4911ffd580630661a2f71079a2c38c6ae1
- Product baseline: 9a916b5ada2b1994d14bccdd780eb70ac564334d
- Candidate PR: #34
- Candidate head: 6b0e70f9934cd36761fd136fbd2ea5301f157c32
- Issue-quality rule blob: 8167e10798071d2276addaff6b201c6b0e904a2a
- Central base before write: b25b73eb0e193a0411282e910b54428353578ed7
- Portfolio inventory: 41 owned; 40 unarchived; obsidian-vault archived
- Cursor: 92-duty-scheduler complete; next academic-mcp
- Result: repository delta complete; portfolio round PARTIAL; CLEAN 0/2

This is audit and triage only. No product code, branch, CI, deployment, secret, setting, production data, GOAL, worker, or paid service was changed.

## Executive decision

INVEST / NARROW / BLOCK PR #34 UNTIL THE CONTRACT IS TRUE.

Duty Inbox is a credible next capability because it reduces LINE/group-chat coordination and manual re-entry while preserving manager approval. The smallest valuable product is not a chat bot or workforce platform: it is a private read-only duty inbox plus a version-bound request that a verified manager can approve into the existing canonical schedule/history path.

If only three actions are funded:

1. Close #14 with real authorization evidence before exposing any self-service endpoint.
2. Make request identity immutable: semester plus exact schedule revision hash must be mandatory and persisted.
3. Enforce actor authorization and expiry inside the state machine before any commit hook can run.

Do not build LINE/LIFF delivery, notifications, payroll, attendance, geofencing, a new scheduler, or a new workflow service in Phase 0.

## Discovery

Default branch has not changed product behavior since 9a916b5; later commits are audit reports. P0 Issue #14 is still open. PR #34 is an unmerged Phase 0 candidate with no Pages Function route and no production mutation wiring. That restraint is valid and materially lowers current exposure.

Inspected:

- README, prior product-board report, fixed A01–J05 Round 4, Issue #22 comments and owner decision.
- All open and closed Issues, all pull requests, PR #34 full diff, six changed files, all comments and four review threads.
- Candidate source, migration, synthetic test file, design document, combined status and Actions receipt.
- Official public product and identity references checked 2026-09-19.

PR #34 has active owner/branch/Issue and unresolved review threads. Issue/PR writes are SKIPPED_LOCKED. No duplicate Issue is needed: all findings are already tracked by exact review threads under #22/#34.

The head has no commit status. Actions run 35251307795 reports check=failure and both deploy jobs skipped; the check job exposes steps=null and no logs. It proves only that hosted validation did not produce a usable receipt, not that the code tests failed. The PR claims local npm check and sqlite validation, but those claims are not independently executable from GitHub evidence in this run.

## Findings

### F01 — schedule content hash is optional and absent from persistence

- Tracking: Issue #22; PR #34; https://github.com/Reese-max/92-duty-scheduler/pull/34#discussion_r4039606027
- Fingerprint: 92-duty-scheduler + Duty Inbox request + same revision number republished with different assignments + omitted base hash + stale guard accepts unrelated content
- kind=BUG
- severity=P1
- decision_priority=HIGH_PRE_MERGE
- evidence=SOURCE_CONFIRMED
- triage=NEEDS_REVIEW
- auto_implementation=false
- Affected role: requester and manager handling a request after a schedule is republished without incrementing the revision number.
- Reachable candidate chain: draftChangeRequest permits no baseRevisionHash; validator accepts it; migration has no base_revision_hash column; isStale compares hash only when both values exist; later manager approval can apply the request to different schedule content.
- Expected: every request is bound to exact canonical schedule content.
- Actual: revision number alone can satisfy the guard despite changed assignments.
- Existing alternative: require the existing PublishedScheduleRevision hash; no new ledger or database service is needed.
- Minimum effective change: require a valid hash at draft and validation, persist it, compare it unconditionally before every transition/finalize, and reject legacy hashless requests.
- Non-goals: no event-sourcing platform, universal registry, cross-repo receipt framework, or silent rebase.
- Acceptance:
  1. Hash is mandatory in schema and DDL.
  2. Same number plus different hash becomes STALE_SCHEDULE.
  3. Hashless persisted rows cannot approve.
  4. Replay on exact number/hash remains idempotent.
  5. Migration behavior for pre-existing rows is explicit.
- Limitation: no production route exists yet; this is a high-impact pre-merge contract defect, not a reported incident.

### F02 — any actor can invoke manager approve or deny

- Tracking: Issue #22; PR #34; https://github.com/Reese-max/92-duty-scheduler/pull/34#discussion_r4039606031
- Fingerprint: 92-duty-scheduler + PENDING_MANAGER request + caller selects MANAGER_APPROVE or MANAGER_DENY + state machine checks state but not manager actor + supplied commit hook executes
- kind=BUG
- severity=P1
- decision_priority=HIGH_PRE_MERGE
- evidence=SOURCE_CONFIRMED
- triage=NEEDS_REVIEW
- auto_implementation=false
- Affected role: every schedule subject if a future route passes a subject-authenticated ctx.actor and exposes transition selection.
- Candidate chain: transition accepts default ctx; MANAGER_APPROVE calls finalize after only state validation; MANAGER_DENY similarly omits authorization; finalize can invoke ctx.commit.
- Expected: manager events require a verified manager claim/authorizer inside the domain boundary.
- Actual: actor is merely recorded in the receipt and may be missing or subject-scoped.
- Existing alternative: inject and require a small isManager/authorizeTransition predicate, reusing the eventual #14 trusted session boundary.
- Minimum effective change: reject missing, subject, peer, or unknown actors for manager events; authorize against semester/team scope; recheck immediately before commit.
- Acceptance:
  1. Subject and missing actors cannot approve or deny.
  2. Verified manager with correct semester/team scope can act.
  3. Wrong-semester manager is rejected.
  4. Unauthorized attempt leaves state and commit count unchanged.
  5. Receipt records the verified manager subject.
- Limitation: no production route currently makes this reachable; do not classify as a live P0 incident.

### F03 — omitted clock disables expiry enforcement

- Tracking: Issue #22; PR #34; https://github.com/Reese-max/92-duty-scheduler/pull/34#discussion_r4039606039
- Fingerprint: 92-duty-scheduler + expired request + transition called without ctx.now + toIso undefined returns null + isExpired false
- kind=BUG
- severity=P2
- decision_priority=HIGH_PRE_MERGE
- evidence=SOURCE_CONFIRMED
- triage=NEEDS_REVIEW
- auto_implementation=false
- Impact: a route forgetting clock injection can accept, deny, cancel, or approve an expired request, reducing recovery and audit reliability.
- Red Team calibration: injectable time is useful for deterministic tests; the defect is treating omitted production time as “never expires.”
- Minimum effective change: default to current time while preserving an injected clock; centralize the effective timestamp.
- Acceptance: expired request fails with and without injected now; boundary instant behavior is fixed; future timestamp remains valid; state/commit do not change on expiry.

### F04 — scoped session is not bound to semester

- Tracking: Issue #22; PR #34; https://github.com/Reese-max/92-duty-scheduler/pull/34#discussion_r4039606043
- Fingerprint: 92-duty-scheduler + valid scoped session + semester rollover reuses numeric subject ID + token lacks semester + new-semester inbox accepts old subject
- kind=BUG
- severity=P2
- decision_priority=HIGH_PRE_MERGE
- evidence=SOURCE_CONFIRMED
- triage=NEEDS_REVIEW
- auto_implementation=false
- Impact: a still-valid token can refer to a different person when internal IDs are semester-local, exposing or later changing another subject's Duty Inbox.
- Minimum effective change: include resolved semester_id in signed claims and verified output; every projection/request/transition must require the same semester.
- Acceptance: old-semester token is rejected after rollover; same numeric ID in another semester cannot read or request; correct token still works; receipt retains semester identity.
- Limitation: no live session endpoint exists, so runtime cross-user access is not claimed.

## Competitive and alternative-workflow check

| Source | Current public capability | Evidence status | Implication |
|---|---|---|---|
| Microsoft Teams Shifts https://support.microsoft.com/en-us/teams/shifts/get-started-in-shifts | Workers can view shifts, request open shifts, swap/offer shifts; managers approve or deny requests across desktop/web/mobile | CONFIRMED official documentation checked 2026-09-19 | MUST MATCH explicit manager authority and published-schedule semantics; DO NOT COPY the full Teams surface |
| LINE Login ID token https://developers.line.biz/en/docs/line-login/verify-id-token/ | Official guidance requires signature/server validation and exposes issuer, subject, audience, expiry, issued-at and optional nonce | CONFIRMED official documentation checked 2026-09-19 | MUST MATCH server verification, aud/exp/iss; add local semester scope after verified external identity |
| Existing spreadsheet + LINE group | Members message a change; admin manually checks and re-enters it | CONFIRMED repository problem statement; operational frequency UNKNOWN | SMALLER ALTERNATIVE for low volume; product must prove less coordination error before expanding |
| Existing admin-only repair flow (#19) | Manager handles cannot-work exceptions through explainable repair planning | LIKELY from approved roadmap; not yet runtime verified | REUSE for final replacement selection; do not put a second solver into Duty Inbox |

MUST MATCH: exact published revision, verified actor, manager approval, expiry, idempotent replay, and a visible responsibility state.

SHOULD BE BETTER: Taiwan unit terminology, minimal self-hosting, Excel/LINE handoff, privacy-preserving personal projection, and no workforce-surveillance features.

DIFFERENTIATOR: deterministic, reviewable requests against the exact canonical roster rather than a generic chat or HR workflow.

DO NOT COPY: payroll, time clock, attendance tracking, geofencing, broad chat, cross-company marketplace, or native app breadth.

## Product-board perspectives

These are model-simulated perspectives, not independent expert votes.

- CEO: keep the idea, but ship only read-only inbox after #14; manager-authorized mutation is later.
- CPO: the user problem is coordination/re-entry, not lack of another scheduler or chatbot.
- CTO: the state machine must own authorization, expiry, semester and revision identity; route-level promises are insufficient.
- Staff/Principal Engineer: reuse current canonical schedule, history, undo and eligibility evaluator; avoid a parallel source of truth.
- UX Lead: show who still owns the duty, why a request is stale/expired, and what manager action remains.
- UX Researcher: first test whether five real unit scenarios reduce manual steps; synthetic completeness does not prove adoption.
- Growth: LINE is distribution convenience, not the product moat; wait for identity and value evidence.
- CFO: Phase 0 pure functions are low-cost; a notification platform and managed WFM integrations are not justified.
- Security/Privacy: manager authorization and semester-bound sessions are hard gates; candidate disclosure stays minimal.
- QA: add negative actor, missing clock, same revision/different hash, semester rollover, replay and failed-commit tests.
- SRE: no hosted receipt exists; zero-step failure cannot be attributed to tests, billing, YAML, or runner cause.
- Accessibility: status cannot rely on color; request/approval states and errors need announced text and keyboard flow.
- Support: stale, expired and denied must produce different recovery instructions, without exposing raw tokens or whole schedules.

## 50 synthetic personas — 30 regression / 20 exploration

Synthetic simulation only. It is not user research, preference share, incident frequency, revenue, or priority evidence. The A01–F05 regression IDs are preserved from the prior product-board baseline; G01–J05 explore the new Duty Inbox direction.

| ID | Mode | Background / constraint | Goal / journey | Delta result and friction | Triage / evidence |
|---|---|---|---|---|---|
| A01 | Regression | Unit admin, desktop | start semester → publish | calendar invariant still blocked on default | existing #21 |
| A02 | Regression | Training officer, campus Wi-Fi | import → preview | must still cross-check schedule truth | existing #21 |
| A03 | Regression | Low-digital supervisor | review → sign | plausible wrong dates remain possible | existing #21 |
| A04 | Regression | Mobile assistant | export → LINE | wrong canonical date propagates | existing #21 |
| A05 | Regression | Clerk reusing template | copy config → week 1 | invalid example/default remains a trap | existing #21 |
| B01 | Regression | Android student | view exact duty | public timetable auth root remains P0 | existing #14 |
| B02 | Regression | iPhone student | compare swap opportunity | Duty Inbox not wired; current manual path | UNKNOWN runtime |
| B03 | Regression | Student printing roster | viewer → print | publication truth still prerequisite | existing #21 |
| B04 | Regression | Class leader | answer peer query | should not gain whole-team data by default | F04/privacy guard |
| B05 | Regression | First-time phone user | find next duty | needs authoritative publication metadata | existing #21 |
| C01 | Regression | Security admin | verify deployment | #14 open; no self-service route allowed | P0 gate |
| C02 | Regression | Privacy officer | inspect personal projection | Phase 0 projection is narrow; session scope incomplete | P2 F04 |
| C03 | Regression | IT support | diagnose stale request | exact hash absent from persistence | P1 F01 |
| C04 | Regression | DevOps Linux | run CI → release | Actions check has no usable steps/log | CANNOT_VERIFY |
| C05 | Regression | SRE | fail closed | missing manager authorizer can reach commit hook | P1 F02 |
| D01 | Regression | Paper-first commander | approve roster | manager identity must be explicit | P1 F02 |
| D02 | Regression | Budget owner | avoid SaaS | pure-function Phase 0 preserves low cost | success signal only |
| D03 | Regression | Compliance lead | trace request → receipt | exact base hash not durable | P1 F01 |
| D04 | Regression | Fairness analyst | compare before/after | hashless request can apply to other content | P1 F01 |
| D05 | Regression | Offline auditor | replay decision | clock omission accepts expired request | P2 F03 |
| E01 | Regression | Scheduler Mac | handle late change | manager-only existing flow remains safer | keep smaller alternative |
| E02 | Regression | Scheduler Windows | undo safely | reuse current history/undo; no second store | non-goal |
| E03 | Regression | Instructor | recheck eligibility | injected evaluator direction is sound | keep + negative tests |
| E04 | Regression | Tablet admin | compare revisions | number alone is insufficient identity | P1 F01 |
| E05 | Regression | Manager large monitor | approve request | subject can invoke manager event in module | P1 F02 |
| F01 | Regression | Linux maintainer | execute tests | local claim only; hosted receipt absent | validation gap |
| F02 | Regression | Windows maintainer | customize tenant | semester must enter token contract | P2 F04 |
| F03 | Regression | CLI integrator | submit request | omitted now disables expiry | P2 F03 |
| F04 | Regression | API/MCP consumer | automate safely | machine API must reject wrong actor/hash | F01/F02 |
| F05 | Regression | Recovery operator | restore semester | old token can cross semester boundary | P2 F04 |
| G01 | Explore | Low-vision member, zoom | read request state | accessible runtime not tested | NEEDS_RUNTIME |
| G02 | Explore | Screen-reader member | hear duty/responsibility | state announcements not implemented | NEEDS_RUNTIME |
| G03 | Explore | Keyboard-only member | create/cancel request | route/UI absent by design | DEFER until #14 |
| G04 | Explore | Color-vision deficiency | distinguish stale/expired | require text/icon, not color | UX acceptance |
| G05 | Explore | Cognitive-load sensitive | know “am I still responsible?” | responsibility flag is promising | narrow experiment |
| H01 | Explore | Remote unit, slow network | open personal inbox | read-only small payload is plausible | runtime unknown |
| H02 | Explore | Intermittent mobile | retry submit | content-derived idempotency useful if hash mandatory | F01 gate |
| H03 | Explore | Air-gapped operator | use export/manual approval | spreadsheet alternative remains viable | do not overbuild |
| H04 | Explore | Cross-timezone trainer | test expiry | injected/default clock semantics inconsistent | P2 F03 |
| H05 | Explore | DST contributor | boundary expiry | no matrix receipt | evidence backlog |
| I01 | Explore | Semester rollover owner | switch term safely | session lacks semester | P2 F04 |
| I02 | Explore | Backup custodian | restore requests | hashless legacy migration undefined | P1 F01 |
| I03 | Explore | Substitute manager | approve urgent change | manager role proof absent | P1 F02 |
| I04 | Explore | Incident commander | audit wrong assignment | before/after receipt cannot cure unauthorized approve | P1 F02 |
| I05 | Explore | Support volunteer | explain rejected request | error taxonomy useful, runtime copy absent | NEXT |
| J01 | Explore | LINE-first member | authenticate via LIFF | verified ID token direction valid; semester missing | P2 F04 |
| J02 | Explore | Privacy-sensitive student | see only own duties | projection intent valid; runtime isolation unproved | NEEDS_RUNTIME |
| J03 | Explore | 200-person unit | high request volume | scale not yet evidenced; no platform needed | evidence backlog |
| J04 | Explore | External API consumer | sync approved change | exact revision and manager proof mandatory | F01/F02 |
| J05 | Explore | Product owner | choose roadmap | Duty Inbox after #14/#21, before LINE breadth | INVEST/NARROW |

Synthetic switching test: personas prefer this concept over generic workforce tools only when local rules, low cost, private personal views and exact review receipts hold. F01/F02/F04 would reverse that simulated preference. This is not a real vote.

## Red Team

- “Phase 0 has no route, so defects do not matter” is partly true for current exposure but false for merge quality: the module advertises a security contract and would be reused by future routes.
- “Manager auth can be added at the route” is insufficient; any alternate caller or test hook can bypass a promise outside the state machine.
- “Revision number is enough” is disproved by same-number republish or restored content; the PR already computes hashes, so mandatory use is the smaller fix.
- “The migration can omit hash until later” is rejected because persisting a weaker request makes future migration and replay ambiguous.
- “Injected clock must always be supplied” is not enforced by the API; current default ctx={} contradicts that assumption.
- “Student IDs are globally unique” is not established and conflicts with semester-scoped tables/current token precedent; bind semester explicitly.
- “Actions failure means the new tests failed” is UNKNOWN because steps/logs are absent.
- “Local 11 tests prove the contract” is false: tests use a manager-looking string, always inject now, do not test missing hash, and contain no semester session case.
- “Microsoft/LINE breadth proves demand” is false; those official capabilities are design references, not evidence that this unit needs full parity.
- “A new workflow database/service is necessary” is false; existing D1 plus canonical history/undo can support a narrow flow.
- “LINE must launch with the inbox” is false; web-first read-only validation is the smaller experiment.
- “P0 #14 is solved by this identity contract” is false; PR #34 intentionally has no production bootstrap and cannot close #14.

## NOW / NEXT / LATER / DON'T

NOW:
- Keep #14 P0 open and do not expose Duty Inbox routes.
- Correct F01–F04 in PR #34 before considering its domain contract reusable.
- Restore an actually executing CI receipt under existing #29 ownership.

NEXT:
- Read-only personal inbox using verified, semester-scoped identity.
- One bounded synthetic and isolated-browser journey: publish → personal view → request → verified manager review → exact revision apply → history/undo.
- Five unit-admin interviews or observed tasks to decide BUILD / NARROW / REJECT for write workflow.

LATER:
- Optional LINE/LIFF thin adapter only after web value, identity and privacy are proven.
- Accessibility, slow-network, expiry-boundary and semester-rollover runtime matrices.

DON'T:
- Chat bot, payroll, time clock, attendance, geofencing, native app, new solver, new auth platform, notification service, generalized state-machine framework, or automatic peer mutation.

## Fixed A01–J05 and CLEAN

The fixed A01–J05 audit remains separate from the 50 product personas above. Default-branch P0 #14 remains open and reproducible by the prior source evidence; #21 and #29 remain open; PR #34 is unmerged and its failed Actions run has no usable steps/logs. No complete qualifying round occurred. CLEAN remains 0/2.

## Tracking and write ledger

- New findings: 4
- P1: 2
- P2: 2
- New Issues: 0
- Updated/reopened Issues: 0
- Existing mappings: 4/4 to Issue #22 / PR #34 review threads
- Duplicate avoided: 4
- SKIPPED_LOCKED: Issue #22 and PR #34
- Verified fixed: 0
- Product implementations: 0
- Hosted validation: CANNOT_VERIFY
- Runtime verification: not performed
- Issue write blocked: 0
- Report write blocked: 0 at preparation time

This audit is not implementation, merge, deployment, payment, production-data mutation, or external-write authorization.
