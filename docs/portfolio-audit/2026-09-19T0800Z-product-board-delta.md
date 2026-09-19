# Product Board Delta — voice-actress

- Run: 2026-09-19T08:00:33Z
- Inspected repository: Reese-max/voice-actress
- Default branch: master
- Default-branch HEAD: b20a3f3e58b055ff27acf7cdd302d822841a119c
- Product baseline: de674011cac49d74693685381b4fae4fd9fe9826
- Issue-quality rule blob: 8167e10798071d2276addaff6b201c6b0e904a2a
- Central report base HEAD before write: dfc32dea68333b24409e7526a7dd1c04167f979f
- Inventory receipt: 41 Reese-max-owned repositories, 40 unarchived, 1 archived (obsidian-vault)
- Fairness cursor: voice-actress completed; wrap to 92-duty-scheduler next
- Result: PARTIAL portfolio round; repository delta complete; portfolio NOT CLEAN (0/2)
- Write policy: audit/status only; no product code, CI, settings, deployment, branch, GOAL, worker, merge, or paid-provider action

## Executive decision

Recommendation: INVEST / SIMPLIFY / BLOCK UNSAFE MERGES.

The product should remain a Taiwan public-service and police-exam Shenlun practice tool whose advantage is traceable legal grading, private learner history, and actionable review. It should not expand into a generic LMS, social network, general-purpose AI writing platform, or paid cohort system before identity custody and evidence provenance are correct.

Three actions if only three are funded:

1. Keep Issue #14 at P0 and reject PR #16 until a caller cannot mint another learner's credential.
2. Make invalid/stale credentials recover explicitly and keep learner history visible without a manual reload.
3. Land evidence-linked review only after every highlighted span is non-empty and every claimed article is actually present in the cited source.

Do not treat a merged diff, local test claim, model vote, or review badge as proof that the supported browser/deployment path is fixed.

## Discovery and evidence

The default branch has no product commit after the 2026-09-15 formal audit. Its latest commit b20a3f3 is audit-only, so the prior executed reproduction remains relevant.

Inspected current open issues and all comments for #14 and #6; inspected active PRs #16, #17, and #18, their full discussion timelines, review threads, changed source, and current heads. Historical locks on #14 were both released on 2026-09-15. Issue #6 has no lock marker. Nevertheless, both issue areas have active owner branches and PRs, so issue and PR writes are SKIPPED_LOCKED.

No GitHub Actions workflow run or combined commit status exists for heads fec41fd, cbdc11d, or f6aec3a. PR descriptions report local suites, but there is no machine-verifiable hosted receipt here. Provider, deployed browser, mobile, assistive-technology, and multi-device production paths were not executed in this audit.

## Findings

### F01 — PR #16 lets any caller mint a valid credential for any known learner UUID

- Tracking: Issue #14; PR #16; review thread https://github.com/Reese-max/voice-actress/pull/16#discussion_r4023197846
- Fingerprint: Reese-max/voice-actress + Shenlun device credential + unauthenticated caller supplies another userId + valid HMAC token returned + credential issuance lacks proof of possession
- Classification: BUG / severity=P0 / decision_priority=CRITICAL_PRE_MERGE / triage=NEEDS_REVIEW / auto_implementation=false
- Confidence: CONFIRMED / SOURCE_CONFIRMED; prior default-branch exploit chain also MOCK_EXECUTED
- Inspected PR head: fec41fd5fa1e8d3f5331d117480c6e1dfc8602b6
- Affected role: any learner whose UUID is known from an earlier disclosure, shared device, log, export, or copied local state
- Reachable chain: unauthenticated POST to the device route with victim UUID → deterministic signed token → owner-scoped sessions route accepts token → victim history becomes readable
- Expected: issuing a credential must prove control of an existing credential or use a trusted migration ceremony.
- Actual: the route validates only UUID shape and returns a signed token.
- Existing alternative: keep the legacy endpoint fail-closed and require a one-time owner-authorized recovery or re-authentication.
- Consequence if merged: the proposed P0 fix preserves cross-user access under a different endpoint.
- Minimum effective change: do not sign arbitrary caller identity; bind bootstrap to verified possession or a single-use trusted recovery capability, revoke/expire migration artifacts, and test two clients where B cannot mint or read A.
- Non-goals: no OAuth platform, identity marketplace, database rewrite, or team billing.
- Acceptance:
  1. Anonymous caller cannot mint for an arbitrary UUID.
  2. A valid owner can recover through one bounded flow.
  3. Client B cannot read, grade, generate for, or enumerate client A.
  4. Legacy migration token cannot be replayed after completion.
  5. Same-origin browser test covers bootstrap through session history.
- Regression state: STILL_REPRODUCIBLE_ON_PR by source path; default branch remains affected; NEEDS_RUNTIME_VERIFICATION after any fix.

### F02 — stale credentials are downgraded to anonymous instead of triggering recovery

- Tracking: Issue #14; PR #16; review thread https://github.com/Reese-max/voice-actress/pull/16#discussion_r4023197854
- Fingerprint: Reese-max/voice-actress + credential rotation + invalid signed cookie + quota/generation path returns anonymous/free semantics + client refresh only on 401
- Classification: BUG / severity=P2 / decision_priority=HIGH_PRE_MERGE / triage=NEEDS_REVIEW / auto_implementation=false
- Confidence: CONFIRMED / SOURCE_CONFIRMED
- Impact: after secret rotation or ephemeral-secret restart, an existing learner can appear anonymous, lose owner-scoped continuity, or become stuck behind anonymous quota behavior.
- Red-team calibration: the repository is free-only, so this is not evidence of paid-tier denial. It remains a significant recovery and completion defect.
- Minimum effective change: distinguish missing credential from invalid credential; return a stable re-auth/recovery signal and make every protected client route handle it consistently.
- Acceptance: stale token returns explicit recovery signal; client obtains a new credential only through the trusted flow; quota, generate, grade, and sessions converge on the same identity outcome; no silent anonymous fallback for an existing profile.
- Runtime need: browser restart and secret-rotation scenario.

### F03 — the first post-deploy history view can render empty until manual reload

- Tracking: Issue #14; PR #16; review thread https://github.com/Reese-max/voice-actress/pull/16#discussion_r4023197860
- Fingerprint: Reese-max/voice-actress + existing local profile without auth cookie + server-rendered Shenlun page + empty sessions + later bootstrap does not refresh page data
- Classification: BUG / severity=P2 / decision_priority=HIGH_PRE_MERGE / triage=NEEDS_REVIEW / auto_implementation=false
- Confidence: CONFIRMED / SOURCE_CONFIRMED
- Impact: a returning learner sees zero progress/history even though data still exists; the workbench may later mint a cookie, but the page does not refetch.
- Minimum effective change: establish verified identity before history fetch or perform one bounded client refresh/refetch after successful bootstrap.
- Acceptance: returning profile recovers history without manual reload; missing and invalid credentials are distinguishable; empty true history remains empty; no cross-user data appears during transition.
- Runtime need: deployed or production-like browser flow with persisted localStorage and cleared cookies.

### F04 — whitespace evidence becomes a zero-length “supported” reference

- Tracking: Issue #6; PR #18; review thread https://github.com/Reese-max/voice-actress/pull/18#discussion_r4034562808
- Fingerprint: Reese-max/voice-actress + criterion evidence quote normalizes empty + indexOf empty succeeds + zero-length reference accepted
- Classification: BUG / severity=P2 / decision_priority=HIGH_PRE_MERGE / triage=NEEDS_REVIEW / auto_implementation=false
- Confidence: CONFIRMED / SOURCE_CONFIRMED
- Impact: criterion feedback can claim evidence exists while highlighting nothing; later session sanitization may disagree, so live review and saved review diverge.
- Minimum effective change: normalize first, reject empty excerpts, and require the same valid-span predicate before candidate creation and persistence.
- Acceptance: whitespace-only evidence is unsupported; all accepted spans have positive length; live and saved review agree; duplicate/non-contiguous evidence keeps stable identity.
- Runtime need: browser highlight and export verification after source-level tests.

### F05 — a nonexistent statute article can be labeled local-cache verified

- Tracking: Issue #6; PR #18; review thread https://github.com/Reese-max/voice-actress/pull/18#discussion_r4034562814
- Fingerprint: Reese-max/voice-actress + known statute with unknown article + resolver records articleKnown false + still returns local_cache status
- Classification: BUG / severity=P1 / decision_priority=HIGH_PRE_MERGE / triage=NEEDS_REVIEW / auto_implementation=false
- Confidence: CONFIRMED / SOURCE_CONFIRMED
- Impact: a core legal-grading result can present a fabricated or mistyped article as source-backed. This can materially mislead exam preparation even without a production incident.
- Red-team calibration: law-level cache presence is real, so the fix is not to reject every citation. The defect is the status granularity: statute-known is not article-confirmed.
- Minimum effective change: return article-confirmed only when the requested article exists; otherwise mark unresolved and exclude source-backed language while retaining the model suggestion for review.
- Acceptance: existing article resolves to its exact source span; nonexistent article is unresolved; exports preserve the same status; aliases do not invent article identity; human override is explicit and auditable.
- Runtime need: representative Traditional Chinese law aliases, browser rendering, and export.

## Active PR disposition

- PR #16: BLOCK. It does not resolve Issue #14 and adds two recovery defects. SKIPPED_LOCKED because owner, assignee, branch, PR, and unresolved threads are active.
- PR #17 at cbdc11d758a2d68d4affe84186a7d451c6b22507: no new blocker established. The dependency update may be necessary, but local 583/583, typecheck, and build claims lack a hosted receipt. SKIPPED_LOCKED; CANNOT_VERIFY.
- PR #18: BLOCK until F04 and F05 are addressed. SKIPPED_LOCKED because Issue #6 and its implementation PR are active.
- No new issue was opened. All five findings have exact existing issue/PR review tracking; duplicate avoided 5/5.

## Competitor and alternative-workflow check

Checked 2026-09-19. Product pages are vendor claims unless independently demonstrated.

| Source | Current signal | Status | Product implication |
|---|---|---|---|
| Public.com AI申論批改 https://www.public.com.tw/event/aifeedback/index.html | Immediate AI feedback, core-point analysis, PDF export, limited free use, explicit advisory disclaimer | CONFIRMED product claim | MUST MATCH clear limits and exportable feedback; do not copy unverifiable score certainty |
| Examino https://examino.ai/en/features/ai-essay-grader | Typed/handwritten input, criterion quotes, human approval/override, exports, privacy and pricing | CONFIRMED product claim | SHOULD BE BETTER on Taiwan-law provenance; MUST MATCH exact quoted evidence and reviewer override |
| Yamol https://yamol.tw/ | Large question bank, performance analysis, writing correction/community and paid plans | CONFIRMED current page | DIFFERENTIATOR is private traceable Shenlun review, not community breadth |
| CoGrader https://cograder.com/ai-essay-grader/ | Rubric-oriented AI essay workflow for educators | CONFIRMED product claim | Useful indirect benchmark for rubric UX, not evidence that a classroom LMS is needed |
| Ministry of Examination https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx | Official exam-question search | SOURCE_CONFIRMED official alternative | Reuse official questions/citations where licensing and provenance permit; do not create a parallel source registry without need |

MUST MATCH: visible evidence for each criterion, privacy by default, recoverable learner history, export semantics matching the screen, clear AI limitations.

SHOULD BE BETTER: Taiwan statute/article provenance, source-status granularity, private single-learner continuity, and fail-closed identity migration.

DIFFERENTIATOR: verified law/article evidence plus exact essay span and actionable revision, without forcing a school deployment.

DO NOT COPY: broad LMS administration, public learner profiles, social leaderboards, opaque score guarantees, or feature breadth justified only by competitor presence.

## Product board perspectives

These are model-simulated viewpoints, not independent expert votes.

- CEO: fund identity custody, evidence truth, and one reliable review journey; reject LMS/social/mobile expansion.
- CPO: Issue #14 blocks trust; evidence-linked review is valuable only when unsupported states are visible.
- CTO: a deterministic HMAC is not proof of identity when the signer is public; fix bootstrap semantics before storage architecture.
- Staff/Principal Engineer: reuse the existing owner-scoped session APIs; repair issuance and state transitions instead of adding an identity platform.
- UX Lead: empty history after deployment looks like data loss; recovery needs one clear state and no reload folklore.
- UX Researcher: test returning learners, shared-device learners, and copied-profile scenarios before measuring delight.
- Growth: a credible free first success is more valuable than community loops while privacy is uncertain.
- CFO: avoid new paid providers and storage services; current fixes are local control-flow and provenance work.
- Security/Privacy: PR #16 remains P0 because attacker-controlled subject is signed by the service.
- QA: require two-client negative tests, secret rotation, zero-length spans, nonexistent articles, save/reload, and export parity.
- SRE: ephemeral secret rotation is a supported failure mode until a durable secret receipt exists; invalid token telemetry must not contain learner data.
- Accessibility: highlighted evidence also needs text alternatives and focusable criterion-source linkage; runtime verification remains pending.
- Support: provide a bounded recovery instruction that does not ask users to delete all browser data or expose UUIDs.

## 50 synthetic personas

Synthetic simulation only; not user research, frequency, preference share, revenue, or priority evidence. B01–B30 preserve the regression baseline; X01–X20 are exploratory.

| ID | Background / constraint | Goal and journey | Result / friction | Triage suggestion / evidence |
|---|---|---|---|---|
| B01 | First-time police-exam learner | open prompt → draft → grade | blocked if identity bootstrap is unsafe | P0 F01 source-confirmed |
| B02 | Returning learner, cookies cleared | open history | sees empty history until reload | P2 F03 |
| B03 | Returning learner after secret rotation | continue draft | stale token falls anonymous | P2 F02 |
| B04 | Shared family laptop | keep essays private | arbitrary UUID mint defeats isolation | P0 F01 |
| B05 | Coaching-center computer | switch between learners | identity custody ambiguous | P0 F01 |
| B06 | Learner with slow network | recover session | needs deterministic recovery state | P2 F02/F03 |
| B07 | Mobile Safari learner | review highlights | browser path unverified | NEEDS_RUNTIME_VERIFICATION |
| B08 | Android Chrome learner | save and revisit | storage/cookie transition unverified | NEEDS_RUNTIME_VERIFICATION |
| B09 | Keyboard-only learner | navigate evidence | focus linkage unverified | accessibility backlog |
| B10 | Screen-reader learner | hear criterion and source | visual span alone insufficient | NEEDS_RUNTIME_VERIFICATION |
| B11 | Learner citing exact statute | verify legal basis | valid article should resolve exactly | F05 regression |
| B12 | Learner mistyping article | notice correction | nonexistent article appears cached | P1 F05 |
| B13 | Learner quoting whitespace | review feedback | empty highlight appears supported | P2 F04 |
| B14 | Learner with repeated phrase | identify exact occurrence | stable occurrence mapping required | F04 regression |
| B15 | Learner with non-contiguous evidence | compare support | reference identity must remain stable | F04 regression |
| B16 | Learner saving then reloading | resume review | live/saved sanitizer may diverge | P2 F04 |
| B17 | Learner exporting PDF | share with tutor | export status must match UI | F05 acceptance |
| B18 | Learner editing after grading | preserve prior evidence | needs version clarity | existing #1/#6 scope |
| B19 | Learner with no citation | receive honest uncertainty | must not fabricate local source | F05 |
| B20 | Learner using statute alias | find canonical article | alias must not invent identity | F05 |
| B21 | Privacy-conscious learner | inspect local/private behavior | P0 blocks trust claim | F01 |
| B22 | Learner on public Wi-Fi | use app safely | network not root cause here | red-team reject expansion |
| B23 | Learner with copied browser profile | restore work | possession boundary undefined | F01 |
| B24 | Learner after deployment | open dashboard | should recover without reload | F03 |
| B25 | Learner at quota boundary | grade answer | invalid identity must not masquerade anonymous | F02 |
| B26 | Learner with empty history | start fresh | true empty must remain distinguishable | F03 acceptance |
| B27 | Learner comparing revisions | trace evidence | needs criterion-source continuity | #6 scope |
| B28 | Learner trusting AI score | prepare exam | advisory and provenance required | competitor check |
| B29 | Tutor reviewing exported result | validate feedback | exact article/span status required | F04/F05 |
| B30 | Support agent | recover account safely | must not request/share UUID as secret | F01 |
| X01 | Candidate importing official question | practice authentic prompt | official source is available alternative | narrow research |
| X02 | Handwriting-first candidate | upload photo | OCR not validated and not prerequisite | DEFER |
| X03 | Offline commuter | draft without network | offline full product not established | DEFER |
| X04 | Study-group member | compare peers | privacy risk outweighs social feature | DO NOT |
| X05 | Instructor managing class | assign rubrics | LMS market broad; outside direction | DO NOT |
| X06 | Legal editor | correct statute aliases | bounded alias tests valuable | NEXT after F05 |
| X07 | Examiner calibrating rubric | override AI evidence | explicit human override valuable | #6, NEEDS_REVIEW |
| X08 | Learner with dyslexia | read structured feedback | typography/runtime evidence missing | accessibility experiment |
| X09 | Low-vision learner | zoom highlights | browser verification pending | NEEDS_RUNTIME_VERIFICATION |
| X10 | Learner using vertical writing source | quote text | unsupported representation unknown | evidence backlog |
| X11 | Learner with very long essay | get bounded feedback | performance evidence missing | evidence backlog |
| X12 | Learner citing repealed law | know currency | source freshness not established | narrow research |
| X13 | Learner citing multiple laws | map each criterion | article-level status needed first | F05 |
| X14 | Learner switching devices | resume work | no authorized sync direction | DEFER |
| X15 | Tutor without account | view one export | PDF is smaller alternative | prefer export |
| X16 | Privacy auditor | prove tenant separation | two-client negative receipt required | P0 acceptance |
| X17 | SRE after secret loss | restore service | explicit rotation runbook/test needed | F02 |
| X18 | Maintainer upgrading Next.js | confirm no regression | no hosted receipt | PR #17 CANNOT_VERIFY |
| X19 | Adversarial peer knowing UUID | impersonate victim | succeeds on PR #16 path | P0 F01 |
| X20 | Model generating fake article | appear authoritative | local_cache label amplifies error | P1 F05 |

Synthetic switching conclusion: exact evidence and privacy could justify choosing voice-actress over generic essay graders, but F01 and F05 would reverse that simulated preference. This is not a real vote.

## Red Team

- “Owner-scoped session queries fix the leak” is disproved: authorization is only as strong as credential issuance; PR #16 signs arbitrary caller subjects.
- “The HMAC token is unforgeable” is true cryptographically but irrelevant when the service signs any requested UUID.
- “All returning users lose data” is not established: F03 is a visibility/recovery defect, not confirmed deletion.
- “Stale token blocks paying customers” is unsupported because the current product is free-only; severity stays P2.
- “Any cached statute proves the cited article” is false; law-level presence and article-level confirmation are different facts.
- “Whitespace evidence is harmless” is false because it changes support status and can diverge after persistence.
- “A new identity database is required” is not established; a bounded verified migration capability is smaller.
- “A full provenance ledger is required” is not established; exact span validation and honest article status are sufficient first steps.
- “PR #17 is broken because no Actions run exists” is not established; absence prevents verification but is not a product failure.
- “Competitors have handwriting/LMS/community, so this product must add them” is rejected; their breadth is not evidence of user value here.

## NOW / NEXT / LATER / DON'T

NOW:
- Resolve F01 before merging PR #16; keep Issue #14 P0.
- Resolve F04/F05 before merging PR #18.
- Preserve current owner activity; do not seize scope or start an implementation worker.

NEXT:
- Execute two-client browser isolation, stale-secret recovery, first-visit history, valid/invalid article, highlight, save/reload, and export parity.
- Obtain machine-verifiable CI or other reproducible receipt tied to the exact heads.
- Recheck PR #17 on its final merged SHA without conflating dependency diff with runtime proof.

LATER:
- Bounded handwriting, official-question import, repealed-law freshness, accessibility, and long-essay experiments after trust gates pass.

DON'T:
- Generic LMS, public profiles, leaderboards, social graph, new identity platform, provenance platform, paid provider, or mobile app expansion.
- Do not mark Issue #14 fixed from a PR badge or code review alone.

## Fixed A01–J05 and CLEAN

The fixed persona audit is separate from the 50 synthetic product personas above. The prior P0 remains open and PR #16 still contains the reachable identity chain. Necessary runtime receipts are absent. Therefore no full qualifying round was completed, CLEAN remains 0/2, and Portfolio CLEAN is not claimed.

## Write and tracking ledger

- New findings: 5
- P0: 1; P1: 1; P2: 3
- New issues: 0
- Updated/reopened issues: 0
- Existing mappings: 5/5
- Duplicate avoided: 5
- SKIPPED_LOCKED: Issue #14 / PR #16 and Issue #6 / PR #18
- Verified fixed: 0
- Cannot verify: PR #17 and all deployed/browser/provider/accessibility paths
- Issue write blocked: 0
- Report write blocked: 0 at preparation time
- Product implementation: 0

This report is an audit-only artifact. It is not authorization to implement, merge, deploy, purchase, mutate production data, or write outside the approved audit surface.
