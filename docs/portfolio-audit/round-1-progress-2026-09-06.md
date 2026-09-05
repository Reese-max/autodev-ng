# Portfolio 50-Persona Audit — Round 1 Progress

Date: 2026-09-06
Protocol: `docs/portfolio-audit/2026-09-06-50-persona-audit.md`

This progress note records repository/static evidence only. Runtime paths are never marked passed without execution/CI/deployment evidence.

## Processed in this round

| Repository | Status | Highest finding | Tracking |
|---|---|---|---|
| `92-duty-scheduler` | NOT CLEAN | **P0** unauthenticated cross-student timetable write | repo #13 umbrella, #14 P0; repo report committed |
| `project-doctor-web` | NOT CLEAN | **P1** malformed required clinical structure can fail open as a normal turn; existing P1 red-flag/rate-limit findings remain | repo #3 umbrella, #4 new P1, existing #1/#2; repo report committed |
| `autodev-ng` | NOT CLEAN | **P0** credential-like judge secret material committed in tracked configs | repo #2 umbrella, #3 P0; repo report committed |
| `adng-memory` | NOT CLEAN | **P2** missing root data lifecycle/retention/recovery contract (existing #1) | repo #2 umbrella; repo report committed |
| `ai-novel-workstation` | NOT CLEAN | no new reproducible P0/P1/P2 static defect confirmed; runtime gates still outstanding | repo #1 umbrella; repo report committed |

## New high-priority actions

### 1. `92-duty-scheduler`: authorization boundary

Current student timetable POST accepts a caller-selected student ID and writes that student's timetable without proving student ownership or admin authorization. Treat this as P0 until fixed and regression-tested. No live exploitation was performed.

### 2. `autodev-ng`: secret rotation/removal

Tracked configuration contains a non-placeholder credential-like value. The value is deliberately not reproduced in reports or issues. Treat it as exposed: rotate/revoke, remove real values from tracked configs/history as appropriate, add secret-safe references and automated secret scanning.

### 3. `project-doctor-web`: structured clinical output must fail closed

The model response parser can return success with missing clinical/SOAP structure, allowing malformed provider output to be presented as a normal turn. Require server-side contract validation, preserve prior valid state on failure, and add deterministic tests. Existing emergency red-flag and durable abuse-control P1 issues remain open.

## CLEAN accounting

No repository processed above is CLEAN. `ai-novel-workstation` had no new P0/P1/P2 static defect in this pass, but CLEAN still requires required runtime evidence plus a second consecutive fixed-50-persona round with no new P0/P1/P2 findings.

The remaining portfolio repositories are still pending discovery/deep rounds and must be processed under the same protocol.
