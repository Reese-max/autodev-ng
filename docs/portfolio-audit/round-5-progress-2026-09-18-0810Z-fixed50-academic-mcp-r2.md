# Portfolio Fixed 50-Persona Continuation — 2026-09-18 08:10Z — academic-mcp Round 2

## Governing inputs

- Central default branch re-read this run; latest observed central HEAD before this write: `0f8e14f3ad411ad5b0bb96e26a32b1c57d5fab8b`.
- Fixed protocol: `docs/portfolio-audit/2026-09-06-50-persona-audit.md@6e3499d6ef5be7e123050e1526946f6a40f99263`.
- Issue Quality v2: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md@8167e10798071d2276addaff6b201c6b0e904a2a`.
- Previous fixed50 continuation: `round-5-progress-2026-09-18-0546Z-fixed50-ninax-line-hermes-r2.md`, which persisted the fair order `ai-flight-radar`, then `academic-mcp`.
- Personas remain exactly A01–J05 from the protocol; all are synthetic scenario simulations.

## Fresh owner inventory

GitHub owner inventory was freshly paginated with page size 100. Page 1 currently exposes **41 Reese-max-owned repositories** and page 2 is empty. `obsidian-vault` is archived; the rest of the returned inventory is unarchived. Earlier fixed50 checkpoints observed 42 connector-visible owner repositories, so this run retains an **inventory visibility gap** and does not infer deletion/non-ownership. This independently prevents whole-portfolio CLEAN.

## Fair cursor precheck — ai-flight-radar

The run honored the persisted cursor by checking `Reese-max/ai-flight-radar` first.

- Current default HEAD observed: `6228138337f950cb6399088c4f814f27a518e29e` (`test: update seed-plan contract for the 48-route matrix`).
- This HEAD is newer than the prior full fixed50 Round 2 product baseline `2ad341d548653fe0ba56490136c4e96daee1712e`; intervening product work includes the Fli customization phase and the seed-plan contract update.
- Existing P2 #6 remains open and source-level capacity math is still applicable: 48 routes with a nominal six-hour revisit implies 8 tasks/hour while the documented two runs/hour × max 3 tasks/run design is 6 tasks/hour.
- Existing CI stale-test issue #7 is closed and the current HEAD is the corresponding test-contract update; issue closure alone is not counted as full current-baseline fixed50 revalidation.
- No new independent finding or confirmed regression was established in this precheck.

Because the product baseline changed after the prior full Round 2, this run does **not** label ai-flight-radar `NO_CHANGE`, does not increment any CLEAN streak, and does not pretend the lightweight precheck is a complete 50-persona round. Status is `PARTIAL / REAUDIT_REQUIRED` and the fair cursor remains due for a complete current-baseline re-audit.

## Completed full fixed50 Round 2 — academic-mcp

Target default before report write: `main@e1665f8417eb1894d0c8dbee678c6a9fc6c54b31`.

Latest product-changing baseline remains `4eb25de5005d33572095ed566ccf00762011bb50`; `e1665f...` is the prior Round 1 audit commit. Exact inspected HEAD has zero GitHub Actions workflow runs. Current README/product scope, default tree, current Issues, all open PR scopes, the unified paper-search aggregator, the OpenAlex adapter, Round 1 audit, and relevant runtime/evidence boundaries were re-read.

Repo Round 2 report:

`.github/quality-audits/2026-09-18T0758Z-50-persona-audit-round-2.md`

Report commit:

`c61d6fac1ab697748ac738382665d930d5361255`

The report contains a fresh A01–J05 50/50 matrix and all ten required dimensions. This is not a copied `NO_CHANGE` record.

### New independent actionable finding since Round 1 — existing tracker #14

Tracker: https://github.com/Reese-max/academic-mcp/issues/14

Fingerprint:

`academic-mcp:paper-openalex:provider-request-failure:non-2xx-normalized-to-empty:false-empty-results:v1`

Disposition after fixed50 revalidation:

- `kind=BUG`
- `severity=P2`
- `decision_priority=HIGH`
- `triage=NEEDS_REVIEW`
- `auto_implementation=false`
- `confidence=CONFIRMED`
- evidence `SOURCE_CONFIRMED`
- runtime `NEEDS_RUNTIME_VERIFICATION`

Source chain rechecked on current default product:

1. `search_papers()` treats a source as failed only when the source coroutine raises.
2. The pinned `OpenAlexSearcher.search()` returns the accumulated result list (initially empty) for any non-200 response.
3. It also broadly catches transport/other exceptions, logs them and returns the list instead of propagating a provider failure.
4. The unified supported OpenAlex path can therefore report `source_results.openalex = 0` with no OpenAlex error when the provider/request actually failed.
5. #14 additionally records the reachable request-limit mismatch for `max_results > 100`; no live production incident is asserted here.

The fixed50 audit did not create a duplicate Issue because #14 already carries the same root/fingerprint and a minimal remediation. The smallest fix remains local: preserve provider failure truth, obey the provider page limit by validation/bounded paging, and add focused regression/runtime checks. No database, research ledger, fallback router, paid commitment, or generic provider framework is required.

Affected fixed-persona scenarios include time-pressure/high-stakes search, source-health observability, bad/oversized input, slow network, 429/5xx/transport failure and partial multi-source success: A04, B04, C01, C03, D01, D02, E03, E05, G05, I04, I05, J05.

### Existing academic-mcp blockers retained

- #2: `VALIDATION_GAP / P2 / NEEDS_REVIEW`; PR #5 and newer PR #13 remain open/unmerged implementation scopes, not current default evidence.
- #3: `VALIDATION_GAP / P2 / NEEDS_EVIDENCE / NEEDS_RUNTIME_VERIFICATION`; PR #6 remains unmerged and no off-host restore/unattended cold-start receipt is established.
- #4: source-confirmed P2 least-privilege/security root; PR #7 remains unmerged and target-host namespace verification is still needed.
- #1/#9/#12 remain research/opportunity scopes with product-defect severity not established.

Open PR search was performed before writes. Existing scopes #5/#6/#7/#8/#10/#13 were left untouched. Umbrella #11 comments were fully read; the previous lease was released and no newer competing effective lease existed. The audit acquired and read back a new 90-minute audit-only lease before updating umbrella bookkeeping.

No live provider query, paid request, reboot, production failure injection, secret/settings mutation, branch creation, merge, deployment or worker was started.

## CLEAN / accounting

`academic-mcp` result: **NOT CLEAN — 0/2**.

Round 2 is complete synthetic coverage but not CLEAN-qualified because #2/#3/#4/#14 remain applicable/open and required runtime evidence is incomplete. #14 is a new independent P2 relative to Round 1 and therefore prevents any qualifying streak progression.

This continuation accounting:

- Target Issues newly created: 0.
- Existing tracker with new independent actionable finding accepted into fixed50 state: 1 (`academic-mcp#14`, P2).
- Duplicate Issues avoided: 1.
- Confirmed new regressions: 0.
- Verified fixes: 0.
- Product/CI/config changes by this audit: 0.
- Repo report write: success.
- Whole portfolio CLEAN: no.

## Continuation cursor

Because `ai-flight-radar` has a newer product baseline than its last full fixed50 audit and received only a lightweight precheck here, the fair fixed50 cursor remains **`ai-flight-radar`** for the next complete re-audit. After that full re-audit, resume the persisted portfolio order after `academic-mcp`, subject to higher-priority confirmed P0/P1 regressions or newly landed relevant fixes.
