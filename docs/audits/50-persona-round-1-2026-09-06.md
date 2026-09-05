# 50-Persona Audit — Round 1

Date: 2026-09-06
Default branch: `main`
Audited SHA: `11b8be2b84d20c2234142f0542b5f05d31891abc`
Method: fixed 50 simulated personas defined in `docs/portfolio-audit/2026-09-06-50-persona-audit.md`.

> Static/repository analysis only. No claim of long-running daemon, engine-provider, Discord, Web cockpit, multi-worktree, or release runtime validation in this round.

## Result

**NOT CLEAN**

### P0 — committed judge credential material

Tracked in #3. Multiple tracked project config files contain the same non-placeholder `judgeApiKey` value. The value is intentionally not reproduced here. `assemble()` reads these JSON configs directly and top-level `judgeApiKey` is a plain string field, so the repository currently encourages/preserves secret material in versioned configuration.

Affected personas: C05, D03, D05, H05, J04.

### P2 — first-success path carries too much configuration surface

The README is detailed, but the primary example introduces project/backlog/data/worktree paths, engine selection, reviewer/judge settings, cost limits, learnings, and bot fields before a new maintainer has demonstrated a minimal safe `status`/`run-once`. For A01/A02/B01/E03/H05, the difference between required, recommended and optional settings is cognitively expensive.

Suggested acceptance path: a minimal secret-free example config, then `status`, then one mock/dry-run task, then advanced engines/review/bots.

### P2 — top-level secret sources are inconsistent

Some engine adapters explicitly support environment references, while top-level `judgeApiKey` and `telegramBotToken` are read as normal string fields. This asymmetry increases accidental persistence of credentials in `configs/*.json`.

## Fixed 50-persona matrix

| Persona group | Round-1 status | Evidence / reason |
|---|---|---|
| A01–A05 | PARTIAL | Documentation is extensive but first-safe-success path is not isolated. |
| B01–B05 | PARTIAL | B02 can follow CLI detail; B01/B05 face substantial setup surface. |
| C01–C05 | FAIL / partial | C05 fails secret-management expectations. |
| D01–D05 | FAIL / partial | D03/D05 fail credential governance expectations. |
| E01–E05 | PARTIAL | E03/E04 face high configuration burden. |
| F01–F05 | N/A/UNVERIFIED | Primarily developer/operator CLI; no runtime usability evidence. |
| G01–G05 | UNVERIFIED runtime | Web cockpit/accessibility paths were not executed. |
| H01–H05 | FAIL / partial | H05 hits secret/config and onboarding risks; runtime engines not executed. |
| I01–I05 | UNVERIFIED runtime | crash/restart/provider-timeout/partial-failure behavior not re-executed. |
| J01–J05 | FAIL / partial | J04 fails committed-secret boundary; concurrency/long-run not re-executed. |

## Required before CLEAN

1. Resolve #3: rotate/remove committed credential material and harden secret sources.
2. Provide a minimal secret-free first-success configuration/path.
3. Add secret scanning and tests for redaction/no-secret-in-status/evidence/logs.
4. Execute representative daemon, provider failure, multi-worktree and Web/Discord control paths with safe test fixtures.
5. Re-run all fixed 50 personas on the new default-branch SHA.
6. Produce two consecutive rounds with no new P0/P1/P2 findings.

Umbrella audit: #2
