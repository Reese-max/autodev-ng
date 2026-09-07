# Portfolio 50-Persona Audit — Round 2 Continuation

Date: 2026-09-07
Protocol: `docs/portfolio-audit/2026-09-06-50-persona-audit.md`

> This continuation uses the same fixed 50 simulated personas plus current default-branch repository evidence. It is not a 50-human study. Static evidence is not represented as browser/provider/deployment runtime validation.

## Scope completed in this continuation

Repository-local Round 2 audit state was persisted for:

- `clinical-scribe-worker`
- `UkePack`
- `avatar-vfo`
- `cf-mcp-server`
- `lobsterpulse`

Repositories newly marked CLEAN in this continuation: **0**.

## New actionable findings

| Repository | Severity | Finding | Tracking |
|---|---:|---|---|
| `clinical-scribe-worker` | **P0** | `/api/score/confirm` has no authentication/authorization; caller controls both `score_id` and authoritative-looking `reviewed_by`, allowing a reachable caller to mark another score as human-reviewed with a forged reviewer identity | #2 |
| `avatar-vfo` | **P0** | Round-1 auth remediation still accepts a predictable tracked `AUTH_SECRET` fallback as a master/admin credential and trusts `cf-access-authenticated-user-email` without cryptographic Access proof | #2 |
| `avatar-vfo` | **P1** | The remediation SHA has a failed full CI run and the deploy workflow fails with zero jobs because current workflow YAML is malformed; the `production` branch still predates the remediation | #3 |
| `cf-mcp-server` | **P0** | Replacement OAuth owner-approval flow accepts the root `MCP_AUTH_TOKEN` through the `approval_secret` GET query parameter, exposing a root MCP credential to ordinary URL-handling surfaces | #4 |
| `cf-mcp-server` | **P1** | Dynamic clients, authorization codes, and auth rate counters are stored only in module-level Worker `Map`s, so multi-request OAuth correctness and abuse accounting depend on one warm isolate | #5 |
| `lobsterpulse` | **P1** | After the Round-1 hooks-preservation fix, Codex setup still leaves a valid pre-existing `[features].codex_hooks = false` unchanged because setup tests only whether the raw text contains `codex_hooks`; setup can succeed while core Codex monitoring remains disabled | #3 |

### `clinical-scribe-worker`

Audited product code at default-branch SHA `1b66d6cc0052204c4f9901a47e300c0eaee97db0` before the audit-document commit. `src/index.ts` routes `/api/score/confirm` directly to `handleScoreConfirm()` without an auth gate. `src/score-handler.ts` accepts a positive integer `score_id` and arbitrary non-empty client-supplied `reviewed_by`; `src/audit.ts::confirmScore()` updates `audit_scores.reviewed_by` and `reviewed_at` for that row. Under the portfolio severity definition this is P0 because it is an unauthorized privileged state/audit-integrity mutation.

Issue #2 was created: `[P0][50-persona audit] Require authenticated reviewer identity for score confirmation`.

No live exploit is claimed. GitHub Actions CI run `33989064325` succeeded for the audited SHA, but no deployed 401/403 check, D1 authorization test, or production runtime evidence was established. Existing P1 #1 (unrestricted server-funded Gemini endpoint) also remains unresolved. Repo report: `docs/audits/50-persona-round-2-2026-09-07.md` (report commit `bf66edf3e70d626899863f976e2738518f5be746`).

### `avatar-vfo`

Re-ran the same security/privacy personas after Round-1 P0 #1 was closed by default-branch remediation SHA `a0672ad76d0cccdd09a9ed212831ba8e2cf203ee`.

Two new findings passed the quality gate:

- **P0 #2** — `worker/wrangler.toml` contains a predictable normal-var `AUTH_SECRET` fallback, while `worker/src/auth.ts` accepts that secret itself as the admin bearer and permits admin-selected `X-User-Id`. The same auth function also accepts `cf-access-authenticated-user-email` as authenticated identity without validating `cf-access-jwt-assertion`; the regression test explicitly accepts an email header alone. This is deterministic repository evidence, but there is no claim that the deployed Worker currently lacks a secret override or Access policy.
- **P1 #3** — actual GitHub Actions run `34052964033` on the remediation SHA concluded failure: Worker typecheck/vitest and frontend test/build succeeded, but backend lint failed before mypy/pytest. Deploy workflow run `34052963410` concluded failure with zero jobs, matching malformed current workflow YAML. The `production` branch remains at `b6eb2f0e93377241a07fcc4460c97be8f0e5d7a6`, which predates the auth remediation. This is CI/branch evidence, not proof of the currently deployed Worker version.

Repo report: `docs/audits/50-persona-round-2-2026-09-07.md` (report commit `59fafce69faeb077cb210284237822a833e5bbbe`). Status remains **NOT CLEAN**.

### `cf-mcp-server`

Re-ran the same OAuth/security/integration personas after Round-1 P0 #2 was closed by default-branch remediation SHA `3e025e964f24ba11423edb6df6f6a478f92acf0e`.

Two new findings passed the quality gate:

- **P0 #4** — `/oauth/authorize` accepts `approval_secret` from the GET query string and compares it directly to root `MCP_AUTH_TOKEN`; `/mcp` also accepts that same root token directly. README/tests normalize the query-parameter flow. No claim is made that an actual deployed token has leaked.
- **P1 #5** — dynamic client registrations, one-time authorization codes, and rate-limit counters live only in module-level `Map`s in `src/oauth.ts`. The multi-request OAuth sequence therefore depends on requests reaching the same warm Worker isolate, and the rate limit is not durable/global. No production exchange failure is claimed without runtime evidence.

The old unconditional refresh-token harvesting flaw is no longer current code; PKCE, exact redirect binding, random short-lived codes and short-lived signed access tokens are retained as positive static evidence. Repo report: `docs/audits/50-persona-round-2-2026-09-07.md` (report commit `b5daf030e5ea89dcc51fe4b3cfdb0d2dcffa6f7a`). Status remains **NOT CLEAN**.

### `lobsterpulse`

Re-ran the same Codex setup/recovery personas after Round-1 P0 #1 was closed by merged default-branch remediation SHA `9aa67523e36947beaef77fa3d420e186900e716b`.

The destructive hooks-overwrite path is no longer current: the merged code preserves unrelated hooks and has real-filesystem regression coverage. GitHub Actions Build run `34052981259` succeeded on the merged SHA. However, a new core-path P1 passed the quality gate: `install_codex_hooks()` changes `config.toml` only if raw text does not contain `codex_hooks`. A valid existing `[features]` entry with `codex_hooks = false` is therefore left disabled even though setup writes the hooks and reports success. Comments/strings containing the same token can also suppress the update without establishing the effective TOML value.

Issue #3 was created: `[P1][50-persona audit] Enabling Codex monitoring must turn an existing codex_hooks=false to true`.

This is deterministic current-source evidence. No packaged LobsterPulse installation or live Codex process was executed in this audit turn, so the successful Actions run is not represented as real-user Codex runtime validation. Repo report: `docs/audits/50-persona-round-2-2026-09-07.md` (report commit `ddb2903b7980949dadbf6010820923665cbf3e61`). Status remains **NOT CLEAN**.

## No-new-finding second static pass

### `UkePack`

Audited `master` at `1ceace4afa464360b830f3ae253911c4f77e43d5` before the audit-document commit. No distinct new P0/P1/P2 passed the quality gate beyond existing P0 #1. The predictable project-ID/public-deployment authorization failure remains on current product code; no relevant fix or two-user runtime evidence has landed. Repo report: `docs/audits/50-persona-round-2-2026-09-07.md` (report commit `5e0fd449386683fe2616f0c9b4df1fe6b75ea34e`).

## CLEAN accounting

No repository becomes CLEAN from this continuation. The protocol still requires all P0/P1/P2 resolved or explicitly justified, current/recent execution evidence for required runtime paths, a fixed-persona rerun after relevant fixes, and two consecutive rounds with no new P0/P1/P2.