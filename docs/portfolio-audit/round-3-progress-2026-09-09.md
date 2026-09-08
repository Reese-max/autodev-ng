# Portfolio 50-Persona Audit — Round 3 Progress (2026-09-09)

Protocol: `docs/portfolio-audit/2026-09-06-50-persona-audit.md`

This tracker continues the same fixed 50 simulated personas and documented severity/stop criteria. Runtime claims require actual execution, CI or deployment evidence; repository/static evidence is not represented as live production validation.

| Repository | Round-3 result | New/regressed P0/P1/P2 | Evidence / next gate |
|---|---|---|---|
| `92-duty-scheduler` | **NOT CLEAN** | **P0 #14 reopened — post-remediation authorization regression** | Current product SHA `9a916b5ada2b1994d14bccdd780eb70ac564334d` adds HMAC-bound student tokens and fail-closed admin auth, but anonymous `GET /api/students/timetable?id=<sid>` now mints/returns a valid student write token for whichever existing ID the caller supplies. The same anonymous caller can POST that token for the victim and pass `verifyStudentToken()`. Existing tests sign tokens directly and do not exercise anonymous GET→POST credential bootstrap. CI run `34052371166` succeeded on the remediation SHA, proving the checked-in test gate passed but not the missed auth path. `production` remains at `ccddd897f160ad39edabea8c47ef86a65d692b0f`, predating the remediation; no deployed exploit/safety claim is made. Repo report commit `3c183d902045014b98ca5e396aef97663f39d9e6`. |

## CLEAN accounting

No repository is newly marked CLEAN in this continuation. `92-duty-scheduler` resets its consecutive no-new-finding streak because P0 #14 is reopened. #15's missing-`ADMIN_TOKEN` helper behavior is positive current static evidence, but #12 remains open and required deployment/mobile/accessibility/runtime evidence is still incomplete.
