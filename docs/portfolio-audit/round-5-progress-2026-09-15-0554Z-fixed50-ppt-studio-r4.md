# Portfolio fixed 50-Persona continuation — 2026-09-15 05:54Z

Run ID: `persona-audit-20260915T054800Z-ppt-studio-r4`

## Governing state

- Fixed-persona protocol: `docs/portfolio-audit/2026-09-06-50-persona-audit.md`, blob `6e3499d6ef5be7e123050e1526946f6a40f99263`.
- Issue Quality v2: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`, blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Central default HEAD observed before this write: `ab68b2135dcca3176c0ba169b8f57482809f31b7`.
- Personas remain the fixed synthetic A01–J05 set; no product-board dynamic/60-40 persona substitution is used.

## Inventory

Connected owner listing was re-enumerated with pagination in this run: page 1 returned **42 Reese-max-owned repositories**; page 2 was empty. Three entries are archived in the current listing (`gemini-deidentifier`, `openab`, `obsidian-vault`). Archived/content/support repositories retain explicit scope/exclusion handling and are not auto-marked CLEAN.

## Fair-rotation increment

The previous fixed-50 cursor pointed to `minideck`.

- `minideck`: **NO_CHANGE**. Current head is audit-only relative to its previously audited product state; open P2 validation finding remains and no landed product fix or new runtime evidence changes the conclusion. No full round and no CLEAN increment.
- `neciken-summer-poem`: **NO_CHANGE**. Recent commits are audit/docs-only; product baseline is unchanged; existing P2 findings and unmerged candidate PR remain. No full round and no CLEAN increment.
- `note-filler`: **NO_CHANGE**. No landed product change since the previous fixed-persona audit. No report spam and no CLEAN increment.
- `ppt-studio`: selected for the next substantive complete fixed-50 rerun.

## `Reese-max/ppt-studio` — Round 4

Inspected default HEAD before repo-report write: `6a0dbddf1f81843dea303db49ba7e528d4ef189c`.
Relevant product baseline remains `da303f7cdc93883b6aed1b414286ef640a6c99ee`; later default commits before this audit were docs/audit-only.

Result: **NOT CLEAN / streak 0 of 2**.

### New independent actionable finding

**P0 #7 — translation can overwrite a newer successful deck edit.**

Stable fingerprint: `ppt-studio + /api/translate/{pid} + translation overlaps another mutation on same presentation + newer edit is overwritten by translation derived from old snapshot + translate route bypasses existing per-presentation lock`.

Source-confirmed causal chain:

1. `/api/translate/{pid}` does not acquire the existing `_get_lock(pid)` mutation lock.
2. `_translate_with_llm()` snapshots slides/version and then awaits `call_llm(...)`.
3. A normal `PUT /api/slide/{pid}/{index}` can complete and persist while translation is awaiting because that route participates in the per-presentation lock but translation does not.
4. When translation resumes, it replaces the entire slide array with output derived from the old snapshot and persists it without verifying the base version.
5. The newer edit can therefore be lost even though both requests report successful state transitions; failure rollback can likewise restore the older snapshot over newer in-memory state.

This is classified **BUG / P0 / CONFIRMED / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false** because the governing protocol explicitly places data loss at P0 and the current supported API paths provide the causal chain. No production incident or paid/provider-backed concurrent execution is claimed.

Tracking Issue: https://github.com/Reese-max/ppt-studio/issues/7
Umbrella created after duplicate check: https://github.com/Reese-max/ppt-studio/issues/6

Smallest fix boundary: reuse the existing per-presentation lock and/or exact base-version check before translation promotion. No new database, queue, collaboration framework, state machine, or broad object model is required by this defect.

Repo Round 4 report commit: `888375c5ab5b8b2f6b1eccc64b0220f6186c9a12`
Report: https://github.com/Reese-max/ppt-studio/blob/888375c5ab5b8b2f6b1eccc64b0220f6186c9a12/docs/audits/50-persona-round-4-2026-09-15-0550Z.md

The report contains the full 50-row A01–J05 matrix and explicitly separates source confirmation from runtime execution.

### Existing blockers / runtime evidence

- Existing remote-auth **P1 #1** remains open; PR #2 and its branch are unmerged and are not current-product evidence.
- Current audit/docs-head Actions run `34798307791` has two jobs (`kpi-baseline`, `lint`) with `runner_id=0`, empty runner name and `steps=[]`. Therefore no checkout/test/lint step executed on that run. This matches a multi-repository zero-step pattern already observed elsewhere; the shared admission/platform cause remains unknown, so this continuation does not invent a ppt-studio-specific root cause or product failure.
- R4-01 was not provider-runtime reproduced. Safe verification can use a deterministic stubbed `call_llm()` await and overlapping local slide update, requiring no external credentials or paid call.

### Issue coordination

Open/closed Issue searches, all-state PR search, current branch listing, prior fixed-50 reports and current product-board audit were checked before creating #7. The active branches/PRs are scoped to #1 Docker/auth remediation; no translate-concurrency implementation branch was found. #7 was created with `auto_implementation=false`; a `github-issue-lock:v1` lease was added/read back for audit linking and released after the repo report was written. No worker, GOAL, merge, deployment, settings change or product-code modification was started by this audit.

## CLEAN accounting

`ppt-studio` cannot accrue a qualifying round: new P0 #7 resets/remains 0/2, P1 #1 remains, current default validation execution is unavailable, and required browser/provider/runtime paths are incomplete.

Portfolio CLEAN is **not** reached. This run does not infer any untouched repository CLEAN from sampling.

## Next cursor

Resume fair product-like discovery at **`voice-actress`**. `obsidian-vault` is archived/content-vault scope and must keep explicit scope handling rather than being counted as an unreviewed product or auto-CLEAN.