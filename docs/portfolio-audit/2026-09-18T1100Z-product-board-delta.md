# Product Board Delta — clinical-scribe-worker — 2026-09-18T11:00Z

Status: COMPLETE FOR SCOPED DELTA / PORTFOLIO PARTIAL  
Mode: audit and triage only; no product implementation, merge, deployment, secret, setting, branch, GOAL, or worker mutation.

## Executive decision

Five new, source-confirmed pre-merge blockers were found across the active fixes for Issue #6 and Issue #10. They are not five new product initiatives: all map to the existing Issues and active review threads, so no duplicate Issue was created and the active owners were not interrupted.

Decision: INVEST / SIMPLIFY.

1. NOW: make the Issue #6 Cloudflare Access fix correct at the real key endpoint, total over malformed input, and safe under signing-key rotation and hostile unknown-kid traffic.
2. NOW: make the Issue #10 provider canary incapable of reporting success after running zero provider calls.
3. NEXT: only after the trust and release gates are real, continue the already-bounded #4 specialty-validation and #7 repair/revision research.
4. DO NOT: expand toward real clinical use, EHR actions, autonomous diagnosis/coding, a secret broker, a generic IAM platform, or a new CI platform.

This is model-based product-board and persona simulation, not independent expert consensus or human-subject evidence.

## Discovery and evidence boundary

- Issue-quality rules: docs/portfolio-audit/2026-09-14-issue-quality-v2.md
- Rules blob SHA: 8167e10798071d2276addaff6b201c6b0e904a2a
- Connected inventory: 41 Reese-max-owned repositories, 40 unarchived; obsidian-vault is archived and excluded.
- Product repository: Reese-max/clinical-scribe-worker
- Default branch/head rechecked: main @ 4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5
- Relevant default-branch product/security baseline: 88bb7469508e8732aaff6f21d048c8677823fc04
- Later default-branch commits are audit documentation; they do not invalidate or repair product evidence.
- Fixed A01–J05 source: docs/audits/50-persona-round-4-2026-09-14.md @ blob edf15a7f028651aceb48a7ba8ef10f36237b169b
- Product boundary: competition prototype, synthetic/non-clinical research only; real patient data/PII and clinical use are forbidden.
- Active candidate heads:
  - PR #13 @ 4eb47f70f42e11d27b2806e6602d411ff170651b
  - PR #14 @ 3c9c66cf92641b5e528a922aec14e0c1f6fd0f04
  - PR #15 @ 1bb5171507fc91fbba53bfaf557ea90226a41ce7
- Issues #6 and #10 comments were read across all pages. Active owner comments, branches, PRs, and unresolved review threads remain. Therefore: SKIPPED_LOCKED; no Issue or PR write.
- Evidence level for all five findings: SOURCE_CONFIRMED. No live Cloudflare Access tenant, deployed Worker, Gemini provider, browser/device, clinician, patient, EHR, PHI, or production data path was exercised. Runtime-sensitive conclusions remain NEEDS_RUNTIME_VERIFICATION.

## Findings and mapping

### F1 — PR #15 uses the wrong Access signing-key endpoint

Fingerprint: clinical-scribe-worker + PR15 cf-access-jwks + legitimate Cloudflare Access assertion + key fetch requests /cdn-cgi/access/jwks and receives non-OK + every legitimate request becomes jwks_fetch_failed/403.

- Tracking: Issue #6; PR #15 discussion https://github.com/Reese-max/clinical-scribe-worker/pull/15#discussion_r4034470537
- Kind/severity/priority: BUG / P2 / HIGH_PRE_MERGE
- Triage: NEEDS_REVIEW; auto_implementation=false
- Affected current roles: synthetic-demo operator, maintainer, Cloudflare deployer, reviewer.
- Expected: retrieve the issuer's signing keys and verify a valid Access token.
- Actual source path: defaultJwksUrl returns /cdn-cgi/access/jwks; non-OK is converted to null and authentication fails closed.
- Independent official contract checked 2026-09-18: Cloudflare publishes keys at https://<team>.cloudflareaccess.com/cdn-cgi/access/certs, recommends JWT validation, and documents signing-key rotation.
- Why P2, not P1/P0: the PR is unmerged and no supported deployed user outage was reproduced; it is nevertheless a direct blocker to the core authenticated path if merged.
- Minimal change: use the official /certs endpoint and add a contract-level fetch test that checks the real path and response shape without requiring a live tenant.
- Acceptance:
  1. Default URL is /cdn-cgi/access/certs.
  2. A representative official keys response yields the selected RSA key.
  3. Non-OK/invalid response remains deterministic fail-closed.
  4. The complete authenticated handler path returns success for a valid controlled assertion and denial for a forged one.
- Non-goals: new IAM provider, OAuth migration, identity database.

### F2 — PR #15 can throw on valid JSON primitives instead of denying deterministically

Fingerprint: clinical-scribe-worker + PR15 JWT decoder + base64url JSON null/primitive header or payload + property dereference outside total exception boundary + request handler rejects instead of a controlled 403.

- Tracking: Issue #6; PR #15 discussion https://github.com/Reese-max/clinical-scribe-worker/pull/15#discussion_r4034470552
- Kind/severity/priority: BUG / P2 / HIGH_PRE_MERGE
- Triage: NEEDS_REVIEW; auto_implementation=false
- Expected: every malformed unauthenticated token ends in a bounded denial response.
- Actual: JSON.parse can return null, string, number, or array; header.alg or payload.exp then throws, and the handler has no encompassing catch.
- Minimal change: validate that decoded header and payload are non-null plain objects inside a total verifier error boundary.
- Acceptance:
  1. null, string, number, array, invalid JSON, invalid base64url, and invalid signature all return controlled denial.
  2. No unhandled rejection escapes verify/authenticate/handleFetch.
  3. Valid signed assertions still pass.
  4. Error responses expose no token contents or secrets.
- Non-goals: generalized schema framework or validation service.

### F3 — PR #15 lets arbitrary unknown-kid traffic amplify outbound fetches and evict usable keys

Fingerprint: clinical-scribe-worker + PR15 unknown kid before request rate limiting + clear global JWKS cache and refetch on every attempt + attacker forces network amplification and repeated cache eviction.

- Tracking: Issue #6; PR #15 discussion https://github.com/Reese-max/clinical-scribe-worker/pull/15#discussion_r4034470562
- Kind/severity/priority: BUG / P2 / HIGH_PRE_MERGE
- Triage: NEEDS_REVIEW; auto_implementation=false
- Expected: key rotation is recovered once without turning unauthenticated input into an unbounded refresh primitive.
- Actual: every unknown kid clears the cache and refetches before the repository's normal authenticated request limiter.
- Minimal change: issuer-scoped singleflight refresh with cooldown/negative caching; keep the last usable keys until a valid replacement is obtained.
- Acceptance:
  1. One new kid may trigger at most one bounded refresh per issuer/cooldown window.
  2. Concurrent unknown-kid requests coalesce instead of multiplying fetches.
  3. Failed refresh does not evict still-valid cached keys.
  4. Legitimate rotation succeeds after one refresh; repeated arbitrary kids fail closed without repeated outbound calls.
  5. Tests use controlled clocks/fetch counters and do not call a live tenant.
- Non-goals: distributed cache service, database, WAF project.

### F4 — PR #14 can report a green live canary with zero provider calls

Fingerprint: clinical-scribe-worker + manually triggered provider canary + repository policy forbids GitHub-hosted third-party secrets and GEMINI_API_KEY is absent + live test skipIf + successful workflow can contain zero Gemini evaluations.

- Tracking: Issue #10; PR #14 discussion https://github.com/Reese-max/clinical-scribe-worker/pull/14#discussion_r4032789180
- Kind/severity/priority: VALIDATION_GAP / NOT_ESTABLISHED / P2 decision priority
- Triage: NEEDS_REVIEW; auto_implementation=false
- Repository contract: AGENTS.md permits secrets only through wrangler secret put or Cloudflare Dashboard.
- Expected: a requested live canary either executes its declared provider cases or fails/blockingly reports that it could not.
- Actual: the workflow reads a GitHub repository secret; under the repository's allowed setup it is absent, and the live test skips when the environment value is empty.
- Minimal change: run provider verification through an already-authorized Cloudflare credential boundary, or keep the test local/manual with an explicit preflight. Missing credential must fail the requested canary rather than produce green.
- Acceptance:
  1. Credential source complies with AGENTS.md.
  2. Missing credential makes the canary non-successful with a clear reason.
  3. Success records at least one executed provider case and case/result metadata without secret or PHI.
  4. Ordinary PR/default CI remains non-paid and deterministic.
- Non-goals: duplicate secrets, secret broker, paid always-on canary, telemetry warehouse.

### F5 — PR #13 rejects valid tokens during a signing-key rotation until cache expiry

Fingerprint: clinical-scribe-worker + PR13 cached old Access certs + Cloudflare begins signing with a new kid + no refresh on unknown kid + all otherwise-valid requests receive 403 for up to ten minutes.

- Tracking: Issue #6; PR #13 discussion https://github.com/Reese-max/clinical-scribe-worker/pull/13#discussion_r4022407428
- Kind/severity/priority: BUG / P2 / HIGH_PRE_MERGE
- Triage: NEEDS_REVIEW; auto_implementation=false
- Official contrary evidence: Cloudflare documents regular signing-key rotation and overlapping current/previous keys.
- Minimal change: one issuer-scoped, throttled refresh on unknown kid, then repeat lookup; combine with F3's abuse controls rather than PR #15's unconditional global eviction.
- Acceptance:
  1. Old cached key continues to verify during overlap.
  2. New legitimate kid succeeds after one bounded refresh.
  3. Unknown attacker kids do not cause repeated fetches or evict working keys.
  4. Fetch failure remains fail-closed and preserves diagnostic reason without leaking tokens.
- Non-goals: manual key registry, scheduled database, cross-repo auth service.

## Red Team / contrary evidence

- The default branch still has the original P0 #6 trust-boundary defect; these are candidate-fix blockers, not a claim that a new default-branch regression shipped.
- PR #13 already uses the correct /certs endpoint and has a total verifier try/catch. That contrary evidence narrows F1/F2 to PR #15; it does not eliminate F5.
- PR #15 does attempt key-rotation recovery. The defect is not the absence of a rotation mechanism but its unbounded cache-clear/refetch behavior.
- Fail-closed 403 is correct when verification genuinely fails; it is not correct when the implementation calls a nonexistent endpoint for every legitimate assertion.
- Unit tests with injected JWKS prove local cryptographic branches only. They do not prove the provider endpoint, tenant configuration, deployed Access assertion, or adversarial concurrency path.
- The canary issue is not evidence that Gemini itself fails. It is evidence that the proposed workflow can claim success without provider execution.
- No production deployment of any candidate head, no formal outage, no secret value, no PHI, and no billing incident were observed.
- A larger identity system, secret service, or CI replacement is not required to resolve any finding.

## External competitor and substitute workflow check

Fresh same-day research is linked in docs/competitive-intelligence/2026-09-18T100114Z-external-radar.md and is not recopied as product authority.

| Signal | Date checked/event | Evidence | Product-board use |
|---|---|---|---|
| Suki + MedStar human-factors collaboration | event 2026-09-17; checked 2026-09-18 | CONFIRMED vendor strategy: https://www.suki.ai/press-releases/suki-and-med-star-health-s-national-center-for-human-factors-in-healthcare-partner-to-pioneer-the-science-of-ambient-ai-adoption/ | Human workflow evidence is separate from note correctness; vendor claim is not independent efficacy proof. |
| Science at Suki | event 2026-09-10; checked 2026-09-18 | CONFIRMED vendor research program: https://www.suki.ai/press-releases/suki-launches-science-at-suki-to-set-a-new-standard-for-healthcare-ai/ | Standardized evaluation is strategically relevant, but does not authorize a study platform here. |
| Ophthalmology requirements survey | publication 2026-09-17; checked 2026-09-18 | CONFIRMED independent small regional study: https://link.springer.com/article/10.1007/s00347-026-02531-8 | Reliability/integration/privacy matter; sample limits and current synthetic-only scope prevent generalization. |
| Dragon Copilot 5.0 review surface | current page checked 2026-09-18; page date unknown | CONFIRMED_CURRENT: https://support.microsoft.com/en-us/dragon-copilot/physicians/current/whats-new | Transcript/note/context co-location is already substantially matched; no new UI-gap Issue. |
| Manual synthetic workflow and local controlled tests | current | CONFIRMED substitute | Appropriate now because the product forbids real clinical/PHI use. |

MUST MATCH: fail-closed authenticated boundary and honest execution receipts.  
SHOULD BE BETTER: evidence-first promotion from synthetic content safety to repair/review burden only after authorization.  
DIFFERENTIATOR: narrow, source-aware synthetic validation instead of premature clinical platform breadth.  
DO NOT COPY: EHR push, autonomous clinical actions, telemetry warehouse, human-subject study platform, local-ASR rewrite solely because competitors have them.

## Product-market 50 synthetic personas

Separate from the fixed A01–J05 audit. This cohort is a model simulation: 30 regression personas (R01–R30) preserve the prior product boundary, and 20 exploration personas (X01–X20) probe the candidate fixes. No row is a real person, vote, incidence rate, or revenue evidence.

| ID | Background / constraint | Goal and task journey | Friction / outcome | Classification / recommendation / evidence |
|---|---|---|---|---|
| R01 | Student clinician, synthetic cases only | Open demo, type synthetic transcript, review SOAP | Blocked if legitimate Access tokens all 403 | P2 candidate blocker; F1 SOURCE_CONFIRMED |
| R02 | Medical educator, no PHI | Run classroom synthetic scenario | Needs deterministic login and safe disclaimer | Preserve scope; F1/F2 |
| R03 | Research assistant | Compare synthetic transcript to note | Wants source fidelity, not clinical claims | #4 later; no new Issue |
| R04 | Competition judge | Verify first success in minutes | Auth outage would hide entire prototype | P2 pre-merge; F1 |
| R05 | Security reviewer | Submit forged and malformed assertions | Primitive JSON may escape as handler rejection | P2; F2 |
| R06 | Cloudflare deployer | Configure team domain and audience | Official keys path must work | P2; F1 + Cloudflare docs |
| R07 | Maintainer new to repo | Follow README and tests | Mocked keys can mask endpoint mismatch | Add contract test; F1 |
| R08 | CI maintainer | Run non-paid gate | Needs typecheck plus security suite | Existing #10; no duplicate |
| R09 | Provider evaluator | Deliberately trigger Gemini canary | Green may mean all cases skipped | Validation gap; F4 |
| R10 | Privacy lead | Ensure no PHI or secret exposure | Proposed fixes need neither | Maintain current boundary |
| R11 | Accessibility tester | Keyboard-only synthetic review | No new runtime evidence this delta | NEEDS_RUNTIME_VERIFICATION |
| R12 | Narrow-screen user | Review transcript and note | No browser run this delta | Evidence backlog, not Issue |
| R13 | Slow-network tester | Authenticate with delayed cert fetch | Timeout must fail boundedly | F1/F3; controlled test first |
| R14 | SRE | Observe auth failure cause | Need stable reason without token leakage | F2/F5 acceptance |
| R15 | Incident responder | Recover during key rotation | PR13 can deny until TTL | P2; F5 |
| R16 | Cost-sensitive maintainer | Avoid paid background canaries | Ordinary CI must remain provider-free | F4 scope guard |
| R17 | Compliance reviewer | Check secret-placement policy | GitHub secret conflicts with AGENTS | F4 SOURCE_CONFIRMED |
| R18 | Third-party contributor | Open PR without secrets | Must get deterministic non-provider checks | Existing #10 direction |
| R19 | Offline reviewer | Inspect source and artifacts | Cannot validate tenant endpoint runtime | Limitation recorded |
| R20 | Demo facilitator | Retry after login failure | Wrong endpoint offers no user recovery | F1 |
| R21 | Synthetic case author | Reuse controlled fixtures | No relevance to auth-fix expansion | Keep #4 separate |
| R22 | Note-quality evaluator | Check omissions/misattribution | Existing #4 already owns it | SKIPPED_LOCKED |
| R23 | Repair evaluator | Accept/reject/restore section edits | Existing #7 owns it | SKIPPED_LOCKED |
| R24 | Product owner | Choose only three priorities | #6 correctness, #10 truth, then #4/#7 | INVEST/SIMPLIFY |
| R25 | Support operator | Explain a 403 | Endpoint/rotation reasons must be distinguishable | F1/F5 |
| R26 | QA engineer | Build negative-token matrix | Primitive JSON and rotation cases absent | F2/F5 |
| R27 | Release manager | Require trustworthy gate | Zero-step or skipped canary cannot count | F4, Actions limitation |
| R28 | Security-conscious judge | Test least privilege | No new secret store or broad token | Non-goal confirmed |
| R29 | Long-session user | Stay authenticated across rotation | PR13 may interrupt session requests | F5 |
| R30 | Repository auditor | Trace SHA, run, source | All five map to existing Issues/threads | Mapping 5/5 |
| X01 | Adversarial caller | Send arbitrary kid repeatedly | PR15 performs repeated outbound refresh | P2; F3 |
| X02 | Concurrent adversarial caller | Burst many distinct kids | No singleflight/cooldown | P2; F3 |
| X03 | Rotation-edge tester | New legitimate kid after cache fill | PR13 fails until expiry | P2; F5 |
| X04 | Cache-failure tester | Refresh returns 5xx | Working keys should not be discarded | Add F3 acceptance |
| X05 | Malformed-token tester | Header JSON is null | Dereference throws | P2; F2 |
| X06 | Malformed-token tester | Payload JSON is string | Claim dereference throws | P2; F2 |
| X07 | Encoding tester | Invalid base64url padding | Must return controlled denial | F2 acceptance |
| X08 | Tenant-contract tester | Fetch official Access certs response | PR15 path is wrong | P2; F1 |
| X09 | Canary operator without GitHub secret | Click workflow dispatch | Test can skip and appear green | F4 |
| X10 | Policy-compliant operator | Keep key only in Cloudflare | Current PR14 cannot consume it | F4 |
| X11 | Audit evidence consumer | Read successful canary receipt | Needs executed-case count, not job color | F4 acceptance |
| X12 | Attacker under auth boundary | Avoid post-auth limiter | Refresh happens before limiter | F3 |
| X13 | Multi-issuer future maintainer | Preserve issuer separation | Global clear is over-broad | Use issuer-scoped cache |
| X14 | Network partition tester | Cert endpoint times out | Must fail closed without cascade | F1/F3 |
| X15 | Cloudflare key-rotation operator | Rotate manually for test | Refresh must be bounded and recover | F5 + official docs |
| X16 | Security approver | Review two competing fixes | PR13 and PR15 solve different subsets | Narrow, do not merge claims |
| X17 | Mobile demo observer | Watch authenticated flow | No device/deploy evidence | NEEDS_RUNTIME_VERIFICATION |
| X18 | Clinician-adjacent researcher | Ask for real workflow study | Current intended use forbids it | DEFERRED; no Issue |
| X19 | Procurement reviewer | Ask for ROI/adoption claims | No real-user or cost evidence | UNKNOWN; do not quantify |
| X20 | Red-team lead | Try to disprove all five | Contrary evidence narrows but does not eliminate them | Retain 5 findings |

Synthetic preference share: not produced. No simulated vote is used for severity or priority.

## Fixed A01–J05 continuity

The fixed cohort remains distinct and was not rotated away. This delta re-evaluated only paths touched by the candidate fixes:

- Auth/trust personas C03, C05, D03, D05, H04, I04, J02, J04, J05 remain blocked because #6 is not fixed on default and candidate heads have unresolved blockers.
- Release/CI personas H03, H05, I05, J04, J05 remain blocked by #10 and the canary truth gap.
- Key-rotation/recovery personas C05, I04, I05, J03 gain the new F3/F5 scenarios.
- Accessibility/device personas F01–F05 and G01–G05 have no new runtime evidence and are not marked passed.
- Result remains NOT CLEAN, streak 0/2. A PR, review badge, local test claim, or audit commit cannot start the CLEAN streak.

## Product-board perspectives and disagreement

- CEO: only three things—#6 correct auth, #10 truthful gates, then #4/#7 evidence. Declines clinical expansion.
- CPO: agrees on trust first; wants the synthetic-only promise visible in every demo and study decision.
- CTO: prefers one well-tested issuer-scoped key cache over parallel implementations.
- Staff/Principal Engineer: combines rotation recovery with cooldown/singleflight; rejects global cache clearing.
- UX Lead: login failure needs actionable status, but refuses a UI project before verifier correctness.
- UX Researcher: external human-factors evidence is strategically useful; current real-user study is out of scope.
- Growth: argues a working demo matters for adoption; accepts that reliability beats more features.
- CFO: keeps provider canary opt-in and bounded; no claimed ROI or savings.
- Security/Privacy: blocks merge on endpoint, total parsing, refresh abuse, and secret-policy findings.
- QA: requires contract, malformed-input, rotation, concurrency, and missing-credential negative tests.
- SRE: requires bounded failure, non-amplifying refresh, and receipts that distinguish skip from execution.
- Accessibility: objects to any success claim without browser/keyboard/screen-reader evidence.
- Support: needs stable diagnostic categories and recovery instructions.
- Disagreement retained: Growth/UX would improve onboarding/status now; Security/QA/SRE rank verifier and gate integrity first. Decision: correctness first, small diagnostic improvements only inside the same fix.

## Actions and CI receipts

- PR #15: CI run 35195907931 failed; job 105118957844 has steps=null. Deploy run 35195907968 failed; job 105118958267 has steps=null and deploy jobs were skipped.
- PR #14: Deploy run 35178095482 and CI run 35178095504 failed; executing check jobs have steps=null.
- PR #13: CI run 35054307739 and Deploy run 35054307637 failed; check jobs have steps=null and deploy jobs were skipped.
- These are real admission/result records only. They do not prove TypeScript, tests, product code, Cloudflare, or Gemini failed or passed. Billing, quota, runner, and YAML root causes are not guessed.
- PR bodies contain local test claims, but this audit did not independently execute those environments and does not elevate them to independent validation.

## Dedupe, locks, and write decision

- Issue #6 owns F1, F2, F3, and F5.
- Issue #10 owns F4.
- Exact findings already have unresolved, non-outdated review threads on active PRs.
- Active branches: devin/issue-6-cf-access-jwt, devin/issue-6, fix/issue-6-jwt-signature, devin/issue-10-ci-gate, devin/issue-10.
- Historical lock markers were read; old leases are released/expired, but current owner/branches/PRs make ownership unambiguous.
- Outcome: SKIPPED_LOCKED for PRs #13/#14/#15; no lock claim, Issue comment, scope rewrite, reaction, resolution, implementation, merge, or deployment.
- Central report is the evidence sink so findings are traceable without racing the implementers.

## Decision memo

Who we serve now: maintainers, evaluators, educators, and researchers using synthetic/non-clinical material—not clinicians making care decisions.

Why choose this product: a narrow evidence-first prototype can make transcript-to-note safety and repair behavior inspectable without pretending to be an EHR or clinical authority.

Differentiation: strict intended-use boundary plus source/omission/repair evidence, provided the authentication and release evidence are honest.

Top priorities:
1. Correct, resilient, abuse-bounded Cloudflare Access verification (#6).
2. Executing, truthful non-provider and opt-in provider validation (#10).
3. Bounded specialty-content and repair/revision research (#4/#7).

Not doing/deleting: no real-PHI use, autonomous diagnosis/coding/orders, EHR push, generic IAM/secret/CI platform, blanket telemetry, or competitor-feature parity project.

Risks/experiments: controlled endpoint-contract fixture, malformed-token property cases, concurrent unknown-kid fetch counter, rotation fixture, and missing-credential canary preflight. BUILD/NARROW/REJECT applies only to later #4/#7 research; these five bugs/gaps stay NEEDS_REVIEW until owner scope and runtime receipts are available.

Portfolio recommendation: INVEST in trust boundary; SIMPLIFY candidate fixes; MAINTAIN synthetic-only positioning. No MERGE/PAUSE/ARCHIVE recommendation from this scoped delta.

## Accounting and cursor

- Total findings: 5
- BUG / P2 / HIGH_PRE_MERGE: 4
- VALIDATION_GAP / severity NOT_ESTABLISHED / decision priority P2: 1
- New Issues: 0
- Updated/reopened Issues: 0
- Duplicate avoided / existing tracking used: 5
- Finding mapping: 5/5 PASS
- SKIPPED_LOCKED active PRs: 3
- Scope narrowed: 5
- Verified fixed: 0
- Issue write blocked: 0
- Report write blocked: 0 at draft time
- Portfolio CLEAN: not claimed
- Next product-board fair-rotation cursor: Reese-max/MaterialYouNewTab
