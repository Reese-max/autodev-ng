# Product-board delta — project-doctor-web PR #12 SOAP evidence fidelity blockers

- Run: `2026-09-29T02:00:08Z-product-board`
- Status: `3 ACTIONABLE_PRE_MERGE_FINDINGS / SKIPPED_LOCKED_ACTIVE_PR / NOT_CLEAN`
- Governing rule blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Central base HEAD before write: `99eba2458a82a4fb8e70c25c5a454014b568c659`
- Portfolio inventory: 42 Reese-max-owned repositories; 41 unarchived; archived `obsidian-vault` excluded from mutation.
- Repository: [Reese-max/project-doctor-web](https://github.com/Reese-max/project-doctor-web)
- Default HEAD inspected: `7a9a96b1f22ce80149f23d8ee1ab8ca23b046ce6` (audit-only; no new default product commit)
- Active target: [PR #12](https://github.com/Reese-max/project-doctor-web/pull/12), head `c65a2b0a02d51982f48c119860aacc993372e895`
- Existing tracking: [Issue #9](https://github.com/Reese-max/project-doctor-web/issues/9), `BUG / P1 / NEEDS_RUNTIME_VERIFICATION`

## New evidence

At exact PR head `c65a2b0a02d51982f48c119860aacc993372e895`, `lib/clinical-objective.ts` deterministically rebuilds SOAP Objective and rolling XML memory from operator text. Three unresolved review threads identify distinct acceptance failures:

1. **Plain category headings become contradictory “Not assessed” states** — [thread](https://github.com/Reese-max/project-doctor-web/pull/12#discussion_r4128863104). Inputs such as `Vitals: stable`, `Vital signs stable`, `Consciousness: clear`, or `Eyes: normal` are preserved verbatim but do not match the current aliases, so the generated category line says `Not assessed / 未提供`.
2. **Explicit unassessed states become “Provided”** — [thread](https://github.com/Reese-max/project-doctor-web/pull/12#discussion_r4128863113). Inputs such as `Cardiac: not assessed` or `Lungs: not examined` contain the category token, so the current `observations.some(field.aliases.test)` path marks them `Provided in source data` despite the negative clause.
3. **Model XML entities can be double-escaped in rolling memory** — [thread](https://github.com/Reese-max/project-doctor-web/pull/12#discussion_r4128863120). `serializeTrustedSoap()` escapes every ampersand; a parsed field containing `&lt;` can become `&amp;lt;`, changing a clinical comparison into literal entity text on the first trusted serialization and later turns.

These are pre-merge findings on an active draft. They are not default-branch regressions or evidence of a clinical incident.

| Finding | Kind | Severity | Evidence | Triage | Minimal change |
| --- | --- | --- | --- | --- | --- |
| Category headings omitted | BUG | P2 | SOURCE_CONFIRMED | NEEDS_REVIEW | Add bounded category-heading aliases and regressions |
| Explicit “not assessed” inverted | BUG | P2 | SOURCE_CONFIRMED | NEEDS_REVIEW | Detect explicit unassessed clauses before positive classification |
| XML entity double escaping | BUG | P2 | SOURCE_CONFIRMED | NEEDS_REVIEW | Decode once before first serialization or preserve already encoded entities |

All retain `auto_implementation=false`.

## Impact and scope

Affected users are learners/operators relying on the Live SOAP Objective and subsequent-turn memory. The first two paths present internally contradictory provenance; the third can alter threshold/comparison text across turns. This can reduce documentation fidelity and downstream reasoning quality, satisfying P2. P1 is not established for these three deltas: the original Issue #9 already tracks the higher-risk fabricated-normal contract, while these findings are on an unmerged draft and have no deployed/live-provider reproduction.

The smallest effective scope is confined to `lib/clinical-objective.ts` plus direct unit/route regressions. Do not add a clinical ontology, XML framework, database, new service, or generalized rules engine.

## Red Team

- The PR already fixes multiple earlier findings and local tests/build/typecheck/lint passed; that does not negate the three exact-head deterministic counterexamples.
- No real MiniMax response, deployed browser, or fixed 50-persona rerun exists, so no claim of runtime regression or fix is made.
- The existing PR and Issue own the root workflow. Creating another Issue would duplicate tracking and split ownership.
- A static finding on draft code is a merge gate, not evidence that the current default product newly regressed.

## Ownership and write safety

Issue #9 has complete historical comments and a released lease, but the same-fingerprint branch `devin/issue-9-no-fabricated-pe`, active PR #12, and unresolved review threads establish live ownership. This run did not acquire a target-Issue lock, modify #9, post duplicate PR comments, create a target Issue, or change product code. Classification: `SKIPPED_LOCKED_ACTIVE_PR#12`.

## Board / persona / competitor continuity

This is an incremental pre-merge delta, not a new formal product round. The existing Project Doctor product-board, fixed-persona and competitor reports remain the applicable baseline. No synthetic preference result, competitor feature, or marketing claim is used as severity evidence. The fixed cohort is not rotated; the affected journey remains operator-entered objective data → deterministic SOAP → rolling memory.

Board synthesis: Security/Privacy, QA and clinical-safety views require truthful provenance; CTO/Staff views support the local patch; CEO/CPO reject expansion beyond the three narrow correctness gates. Recommendation remains **INVEST / SIMPLIFY / MAINTAIN**, with no deployment or merge authorization.

## Counts and limits

- New Issues: 0
- Updated target Issues/comments: 0 (`SKIPPED_LOCKED_ACTIVE_PR`)
- New actionable findings: 3
- Default-branch regressions confirmed: 0
- Verified fixes: 0
- Runtime pending: exact-head CI, real MiniMax, deployed browser, fixed 50-persona replay
- Portfolio CLEAN: not claimed; this partial delta does not satisfy two complete A01–J05 rounds.
