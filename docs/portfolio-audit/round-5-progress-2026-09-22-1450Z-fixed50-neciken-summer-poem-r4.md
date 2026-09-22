# Fixed 50-Persona portfolio continuation — neciken-summer-poem Round 4

- Run: `2026-09-22T14:43:14Z-fixed50-persona-audit`
- Target: `Reese-max/neciken-summer-poem`
- State: **NEW_ACTIONABLE / NOT_CLEAN / 0/2**
- Fixed A01–J05 spec blob: `6e3499d6ef5be7e123050e1526946f6a40f99263`
- Issue Quality v2 blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Central `autodev-ng/main` immediately before this write: `82e43d00b158ed05fb4958110fda176933d6adaf`

## Fresh inventory

Connected owner pagination was repeated: page 1 now exposes **42 Reese-max-owned repositories**, page 2 is empty, and `obsidian-vault` is archived. This resolves the prior 41-vs-42 visibility gap for this run; 41 repositories are unarchived. Inventory completeness no longer blocks this run by itself, but the portfolio remains NOT CLEAN because multiple applicable repositories retain unresolved findings/runtime gaps.

## Target baseline / report

- default branch: `master`
- inspected pre-report HEAD: `3ded12546eef1a9f0140a0e826be9419b438f4db`
- last product-facing baseline remains `3572303c0ddc598a8f4c9272b884ca91d47e1480`
- Round-4 audit-only commit: `6911b59273349f07a40d874802191191ee4e1a7e`
- report: https://github.com/Reese-max/neciken-summer-poem/blob/6911b59273349f07a40d874802191191ee4e1a7e/docs/audits/50-persona-round-4-2026-09-22-1443Z.md

The inspected HEAD was itself audit-only and no product source changed after the previously established product baseline. Round 4 nevertheless performed a fresh source/issue/PR/Actions review and a new fixed A01–J05 50-row assessment; it is not a copied NO_CHANGE round.

Exact inspected-HEAD Actions run `35458471556` is `completed/failure`, but job `105937885608` has `runner_id=0` and `steps=[]`. It did not execute checkout/Ruff/pytest and is not evidence for or against the new product defect.

## New actionable finding

Created and read back:

- **#8 — P1 BUG — Preserve discovered AI policy when promoting contest profiles**
- Issue: https://github.com/Reese-max/neciken-summer-poem/issues/8
- Classification: `BUG / P1 / CONFIRMED / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`
- Fingerprint: `neciken-summer-poem + contest discovery draft/promotion + extracted AI policy is 禁止 or 未明示 + draft profile records 允許 + build_ai_draft hard-codes allowed and promotion does not compare against source evidence`

Source chain at the inspected default SHA:

1. `candidate_status()` allows a candidate with `AI使用.模式 = 禁止` or `未明示` to remain draftable when other evidence is sufficient: https://github.com/Reese-max/neciken-summer-poem/blob/3ded12546eef1a9f0140a0e826be9419b438f4db/contest_discovery.py#L474-L497
2. `build_ai_draft()` then hard-codes the draft to `AI使用.模式 = 允許`: https://github.com/Reese-max/neciken-summer-poem/blob/3ded12546eef1a9f0140a0e826be9419b438f4db/contest_discovery.py#L654-L679
3. `_draft_issues()` validates only enum legality and `promote_draft()` can save that draft without matching it against `evidence.json`: https://github.com/Reese-max/neciken-summer-poem/blob/3ded12546eef1a9f0140a0e826be9419b438f4db/contest_discovery.py#L710-L770
4. Open PR #6 head `ab9150df0f943f42e2505808314c2649ed8b74fa` still contains the same hard-coded allowed mode, so that active Rule-Drift candidate does not already fix #8.

P1 is retained rather than P0: the supported contest-discovery → draft → explicit promote path can persist a formal profile that is more permissive than deterministic official-source evidence, materially breaking the contest policy trust boundary before #4 can make a downstream decision. This run did not establish an actual invalid submission, user incident, data loss, account/permission compromise, or portfolio-wide outage.

Minimum correction is deliberately narrow: preserve `candidate["AI使用"]["模式"]` in the draft and reject promotion if draft policy differs from stored deterministic evidence. No database, queue, new policy service or broad framework is justified.

## Dedupe / coordination

Open/closed issue search, current all-state PRs and comments were reread before the write. #8 is not a duplicate of:

- #3: source freshness / Rule-Drift revalidation;
- #4: final readiness/export behavior when the profile itself records a restrictive policy;
- #1: default-branch CI execution gap.

Active PR #6 modifies the same discovery component. #8 therefore remains `NEEDS_REVIEW`, `auto_implementation=false`; this audit did not alter PR #6, create an implementation branch, merge/deploy, or start a worker/GOAL. PR #2/#7 (#1) and PR #5 (#4) also remain open/unmerged.

A second public-URL DNS/redirect safety candidate was reviewed. Current source accepts non-literal hostnames without DNS resolution and uses default `urllib` redirects, but this run did not establish the required supported-path user-impact chain with an isolated reproduction; literal private final URLs are rejected after fetch and the entrypoint is owner-invoked local discovery. It stays `NOT_ESTABLISHED / NEEDS_EVIDENCE`, with no Issue created from speculation.

## Fixed-50 / runtime accounting

Round 4 contains a newly rechecked 50-row A01–J05 matrix and all ten required dimensions. New #8 maps especially to A04, B04–B05, C01/C03, D02/D05, E03, G02, I03 and J05. Existing #1/#3/#4 remain mapped separately.

No real contest submission, external provider call for reproduction, network/DNS attack, browser accessibility session, destructive failure injection, product source/config/CI/settings change, implementation branch, merge/deploy, paid commitment, worker or GOAL was started.

Safe runtime follow-up for #8: use a temporary discovery root, a synthetic page fixture that deterministically yields each of `禁止 / 未明示 / 允許`, a stub draft builder/provider response, then exercise `inspect → draft → promote` and assert policy equality plus mismatch rejection. Until such execution evidence exists, #8 remains `SOURCE_CONFIRMED / NEEDS_RUNTIME_VERIFICATION`.

## CLEAN / continuation

- new independent actionable P0/P1/P2 findings: **1** (#8 P1)
- confirmed new regressions: **0**
- reopened findings: **0**
- landed fixes verified: **0**
- qualifying CLEAN rounds added: **0**
- `neciken-summer-poem`: **NOT CLEAN, 0/2**
- portfolio: **NOT CLEAN**

The new P1 holds/resets the target CLEAN streak at zero. Audit-only commits do not count as product changes.

Next fair fixed-50 cursor: **`Reese-max/note-filler`**, unless a newly landed P0/P1 fix or confirmed regression pre-empts the rotation.