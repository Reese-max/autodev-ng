# Portfolio 50-Persona Audit — Round 2 Progress

Date: 2026-09-06
Protocol: `docs/portfolio-audit/2026-09-06-50-persona-audit.md`

> This continuation uses the same fixed 50 simulated personas plus current default-branch repository evidence. It is not a 50-human study. Static evidence is not represented as browser/provider/deployment runtime validation.

## Scope completed in this continuation

Deepened Round 2 review for 8 repositories that were previously `RUNTIME-PENDING` / `STATIC-PASS`:

- `cf-ai-router`
- `cyber-prep-coach`
- `minideck`
- `video-timeline-pipeline`
- `ppt-studio`
- `soundbox-offline`
- `MaterialYouNewTab`
- `claude-mem`

Repositories newly marked CLEAN in this continuation: **0**.

## New actionable findings

| Repository | Severity | Finding | Tracking |
|---|---:|---|---|
| `minideck` | P2 | Normal `/p/<projectId>` sharing also gives the recipient the project ID needed to anonymously retrieve historical `?version=N` decks, so redacted/removed draft content can remain visible | #2 |
| `video-timeline-pipeline` | P2 | Bright Data Instagram discovery requires cloud opt-in but `--instagram-max-items` defaults to unbounded and the documented date filter is local, leaving provider work/cost without a finite default ceiling | #8 |
| `ppt-studio` | P1 | Manual mode is loopback-only, but documented Docker Compose publishes the unauthenticated full FastAPI API on host interfaces while injecting server-side AI provider keys | #1 |
| `soundbox-offline` | P2 | IndexedDB is the only product-side copy of the local music library state, but there is no whole-library versioned backup/restore path | #1 |
| `claude-mem` | P2 | One-command install can auto-install Bun/uv by piping mutable remote installer scripts directly into PowerShell/bash without pin/checksum/explicit trust confirmation | **ISSUE_WRITE_BLOCKED** — Issues disabled (HTTP 410) |

## Successfully created Issues

1. `Reese-max/minideck#2` — `[P2][50-persona audit] Do not expose historical deck versions through a shared project ID`
2. `Reese-max/video-timeline-pipeline#8` — `[P2][50-persona audit] Bound Bright Data Instagram discovery cost instead of defaulting to an unlimited result set`
3. `Reese-max/ppt-studio#1` — `[P1][50-persona audit] Keep Docker Compose local-only or require authentication before exposing the full API`
4. `Reese-max/soundbox-offline#1` — `[P2][50-persona audit] Add whole-library backup and restore for IndexedDB-only music state`

## Issue write blocked

`Reese-max/claude-mem`: attempted to create `[P2][50-persona audit] Avoid silently executing mutable remote installer scripts for Bun and uv`; GitHub returned HTTP 410 `Issues has been disabled in this repository.` No Issue number/URL exists, so it is not counted as created.

## No-new-finding second static passes

### `cf-ai-router`

No distinct new P0/P1/P2 passed the static quality gate. Client/admin secrets remain separated and fail closed; production D1 rate limiting fails closed and uses atomic UPSERT counters. Still NOT CLEAN because current real-provider fallback/quota, production-D1 failure, deployment/migration/rollback and concurrency evidence remain pending.

### `cyber-prep-coach`

No distinct new P0/P1/P2 passed the static quality gate. Retained legacy D1 APIs remain bound to server-side ChatGPT identity/account namespace and server-side admin lookup. Still NOT CLEAN because scoring/resume/recovery/accessibility/release-rights and clean release-gate browser/runtime evidence remain pending.

### `MaterialYouNewTab`

No distinct new P0/P1/P2 passed the static quality gate. Chromium MV3 uses optional `bookmarks`/`favicon` permissions and optional Google-only host access rather than broad host permissions. Still NOT CLEAN because actual Chromium/Firefox loading, accessibility/zoom and corrupt/partial backup restore runtime evidence remain pending.

## CLEAN accounting

No repository becomes CLEAN from a second static pass alone. The protocol still requires all P0/P1/P2 resolved or explicitly justified, required current/recent execution evidence, the fixed personas rerun after fixes, and two consecutive rounds without new P0/P1/P2.
