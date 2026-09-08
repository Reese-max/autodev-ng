# 50-Persona Audit — Round 2

Date: 2026-09-08
Protocol: `docs/portfolio-audit/2026-09-06-50-persona-audit.md`
Default branch: `main`
Audited default-branch SHA: `8b310747e1c5d913e3c65022a6e6eb1670d8b013`
Recent product-code CI evidence SHA: `f925ba280c62d040ff783e82dd7569b1708b500b`
Method: same fixed 50 simulated personas and the same P0/P1/P2/CLEAN rules as Round 1.

> Persona results below are model simulation plus repository/CI evidence, not 50-human testing. Provider, daemon, Discord, Telegram, Web cockpit, multi-worktree and release paths are not represented as runtime-passed unless actual execution evidence is cited.

## Result

**NOT CLEAN**

Round-1 P0 #3 has landed remediation and remains closed, but Round 2 found a new P2 (#6), while the existing onboarding P2 #4 is still present on the default branch. No two-round CLEAN streak can start.

## Re-run of Round-1 security personas

### Positive current evidence for closed P0 #3

The committed-credential finding is no longer present in current tracked configs: `configs/autodev-self.json` and other tracked configs use `"judgeApiKey": "{env:JUDGE_API_KEY}"`. `docs/security/CREDENTIAL_ROTATION.md` records that the previously exposed provider credential was revoked/rotated and explains the decision not to rewrite private-repository history. `scripts/check-secrets.mjs` is wired into `npm run typecheck`, and `web/server.mjs` uses an allowlist status payload rather than spreading configuration.

This is repository evidence plus the project's rotation record. This audit did not attempt to use either the old or replacement credential and does not independently prove provider-side revocation.

### New P2 #6 — unresolved configured secret references silently become empty

Affected personas: **B02, C05, D03, H05, I04, I05, J04**.

`resolveSecretString()` converts a missing `{env:VAR}` to `''` and catches any `{file:PATH}` read failure as `''`. `expandConfigPaths()` then stores that empty value as `cfg.judgeApiKey`; the current test explicitly expects a missing env reference to return an empty string. Judge/review/autopilot request code interpolates the effective value into `Authorization: Bearer ${opts.apiKey}`. The same resolver is used for `telegramBotToken`, where an empty result causes terminal-notification wiring to be omitted by the `telegramConfigured` check.

Therefore a typo, missing environment variable, missing/unreadable secret file or empty secret can survive config parsing and fail later/farther from the root cause, or silently disable an integration. No provider or Telegram runtime failure is claimed; the source/config behavior is deterministic.

Tracking: **#6 — `[P2][50-persona] Fail fast when configured secret references cannot be resolved`**.

## Onboarding re-run

### Existing P2 #4 remains current-default behavior

Affected personas: **A01, A02, B02, E03, H05**.

The existing issue includes two identical host executions of `node dist/cli.js --help` with exit code 1. Current `src/cli/entry.ts::runCli()` still has no help branch: `--help` becomes the command, no `--config` is present, usage is printed as an error and exit code is set to 1. This confirms the defect statically on current default-branch source.

PR #5 proposes a help/offline-onboarding remediation but is open and not merged, so it is not counted as landed. Re-run the exact CLI check and the same onboarding personas only after the fix is merged to the default branch.

## CI / execution evidence

GitHub Actions run `34115182152` on SHA `f925ba280c62d040ff783e82dd7569b1708b500b` completed successfully on Windows. Its job actually executed `npm ci`, `npm run typecheck` and `npm run test:flaky-regression`; the latter runs the full Vitest suite twice. A compare from that SHA to the audited head shows only documentation changes (`docs/competitive-intelligence/*` and the portfolio tracker), so this is recent product-code CI evidence.

The latest exact-head run `34146387834` on `8b310747e1c5d913e3c65022a6e6eb1670d8b013` concluded failure before any job steps were recorded. That is not treated as a product test failure or a runtime pass; it simply means the exact documentation head lacks a completed CI execution path in this round.

No actual provider call, long-running daemon, Discord/Telegram delivery, Web cockpit browser run, cross-platform CLI run outside the cited host observation, multi-worktree stress run, release/deploy or recovery drill was executed by this audit.

## Fixed 50-persona matrix

| Persona group | Round-2 status | Evidence / reason |
|---|---|---|
| A01–A05 | PARTIAL / P2 | `--help`/first-success path still fails normal CLI-help expectations; PR #5 not merged. |
| B01–B05 | PARTIAL / P2 | B02 hits both onboarding failure and broken-secret-reference diagnosability. |
| C01–C05 | PARTIAL / P2 | C05 sees improved secret storage, but unresolved explicit secret references fail too late. |
| D01–D05 | PARTIAL / P2 | D03 cannot rely on configured secret references failing closed at preflight. |
| E01–E05 | PARTIAL / P2 | E03 onboarding remains unnecessarily error-oriented. |
| F01–F05 | UNVERIFIED runtime | Developer/operator CLI; no dedicated accessibility/runtime execution in this round. |
| G01–G05 | UNVERIFIED runtime | Web cockpit/browser accessibility paths not executed. |
| H01–H05 | PARTIAL / P2 | H05 onboarding and missing-secret recovery are still actionable gaps. |
| I01–I05 | PARTIAL / P2 | I04/I05 unresolved secret/integration failure is not surfaced at configuration time; broader failure injection not executed. |
| J01–J05 | PARTIAL / P2 | J04 credential persistence is improved, but explicit secret-reference integrity is not fail-fast. |

## CLEAN accounting

`autodev-ng` remains **NOT CLEAN** because:

1. P2 #4 is open on current default-branch behavior.
2. New P2 #6 was created in this round.
3. Required provider/daemon/notification/Web/multi-worktree/recovery runtime paths do not have complete current/recent evidence for CLEAN qualification.
4. A new P2 resets the two-consecutive-round no-new-P0/P1/P2 requirement.

After #4/#6 fixes land, rerun the same persona IDs and exact reproduction paths on the merged default branch; only then can a no-new-finding streak begin.