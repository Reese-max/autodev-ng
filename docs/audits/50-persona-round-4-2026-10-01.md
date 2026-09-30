# AutoDev-NG 50-Persona Audit — Round 4

Date: 2026-10-01
Protocol: `docs/portfolio-audit/2026-09-06-50-persona-audit.md`
Default branch: `main`
Audited default-branch SHA: `99eba2458a82a4fb8e70c25c5a454014b568c659`

> Fixed simulated personas only. This round distinguishes source inspection, checked-in test definitions, GitHub Actions execution, and local CLI execution on this audit host (Linux, Node.js v22.19.0). No human usability study is claimed; provider, unattended-daemon, Discord, Telegram, Web cockpit, multi-worktree and release paths are not represented as runtime-passed unless cited.

## Result

**NOT CLEAN — consecutive no-new-P0/P1/P2 streak: 1/2.**

The same fixed A01–J05 persona set and the same P0/P1/P2/CLEAN rules were re-applied to the audited SHA across onboarding, core execution/recovery, secrets/configuration, CI/regression safety, failure injection, observability, cost/reliability, and trust dimensions. **No new P0/P1/P2 finding was confirmed this round**, advancing the streak from 0/2 to 1/2.

CLEAN remains blocked independently of the streak: open tracked P1/P2 issues from the audit/repair programs (including #13, #14, #16, #30, #32, #33, #36, #39, #40, #42–#49, #80) mean the all-P0/P1/P2-resolved-or-justified condition does not yet hold.

## New findings

None. The re-run produced no new reproducible P0/P1/P2 defect on the audited SHA. Two below-bar observations are recorded under "Observations" and are not counted as findings.

## Post-fix rerun of existing findings

### #3 — committed judge credential material (P0, closed)

**Positive current evidence, unchanged.** Every tracked config under `configs/` now references secrets indirectly — e.g. `configs/autodev-self.json` carries `"judgeApiKey": "{env:JUDGE_API_KEY}"`. A tracked-file sweep for credential-shaped material (`gh[pousr]_*`, `xox*`, `AKIA*`, `sk-*`, Telegram bot-token shape, private-key blocks) found no committed secret; the only matcher hits are the detection regex inside `src/autopilot/report-research.ts` and intentionally fake fixtures such as `sk-fake-m3-key-for-test` in `tests/cli.test.ts`. `npm run typecheck` — which runs `scripts/check-secrets.mjs` — passed on this checkout, and CI run `36218491349` executed the same command green on the audited SHA. `docs/security/CREDENTIAL_ROTATION.md` continues to record provider-side revocation/rotation. Provider-side validation remains outside this audit's scope.

### #4 — CLI help / first-success path (P2, closed)

**Executed acceptance on this audit host.** Against the audited SHA built via `npm ci && npm run build`:

- `node dist/cli.js --help` → exit 0, prints usage, the self-contained synthetic/mock safe-first-run block, and secret-reference guidance, without reading any config or starting anything.
- The documented first-run path was executed verbatim in a fresh temporary directory (`{"projectPath":"./project","backlogFile":"./project/BACKLOG.md","dataDir":"./data","engine":"mock"}`, empty `BACKLOG.md`, `git init` + initial commit): `status --config config.json` → exit 0; `run-once --config config.json` → `CycleResult: idle`, exit 0. No provider or notifier was contacted.

`src/cli/entry.ts` handles `--help`/`-h`/`help` before config assembly and sets exit 0. README `快速開始` now documents this secret-free minimal path as a dedicated block — a four-field mock config (`projectPath`, `backlogFile`, `dataDir`, `engine:"mock"`) clearly separated from the full field reference and optional bot/review/cost settings — resolving the Round-1 first-success-overload P2 for A01/A02/B01/E03/H05. Windows parity is carried by the green cited CI run rather than re-executed here.

### #6 — unresolved configured secret references (P2, closed)

**Positive source/test evidence plus an executed gate.** `resolveSecretString()` throws before startup when an explicitly configured `{env:VAR}`/`${env:VAR}`/`${VAR}` or `{file:PATH}` secret is missing, unreadable, or empty; `tests/config-secrets.test.ts` covers missing/blank env, missing/unreadable/empty file, valid references, and the intentional CLI-transport exception. `telegramBotToken` resolves through the same function, closing the Round-1 secret-source-inconsistency P2. `npm run typecheck` passed on this checkout and in the cited CI run.

### #13 — Windows full-regression CI gate (P2, open)

**Positive current-default evidence.** CI run `36218491349` on the audited SHA `99eba245…` completed green on `windows-latest`/Node 22: `npm ci`, `npm run typecheck`, `npm run test:flaky-regression` (the two-round full Vitest gate), and the retained `tests/regressions/*.test.cjs` step all succeeded. Surrounding product-code runs in the same window are also green. #13's own acceptance (two consecutive green current/recent runs; related off-Windows hardening tracked in #111) is owned by that issue and is not closed by this report.

## Observations (below the P2 bar)

- Tracked configs embed host-specific absolute paths (`C:/Users/Administrator/...`) in fields such as `verifyCommand`/`prepareCommand`/`anysearchScript`/`botTokenFile`. README already directs maintainers to treat `configs/` as local deployment paths that must be reviewed before use; recorded as a P3 maintainability note for H05-class takeovers, not a new reproducible defect.
- `npm ci` reports 10 dependency vulnerabilities (7 moderate, 3 high) in the dev toolchain. P3 hygiene note; no exploit path is claimed.

## Fixed 50-persona matrix

| Persona group | Round-4 status | Evidence / reason |
|---|---|---|
| A01–A05 | PASS (static + local exec) | First-success path executed live; `--help` exits 0 with the isolated safe-start block. |
| B01–B05 | PASS (static + local exec) | B02's onboarding failure and secret-diagnosability gap both verified repaired. |
| C01–C05 | PASS (static) | C05 secret governance now enforced by fail-fast resolution, scanner in `typecheck`, and the status-payload allowlist. |
| D01–D05 | PASS (static) | D03/D05 credential governance verified; no committed secret material. |
| E01–E05 | PASS (static + local exec) | E03's configuration burden reduced to a four-field secret-free minimal path. |
| F01–F05 | UNVERIFIED runtime | Developer/operator CLI; no dedicated accessibility runtime execution this round. |
| G01–G05 | UNVERIFIED runtime | Web cockpit/browser accessibility paths not executed. |
| H01–H05 | PASS (static + CI) | H05 takeover path verified; Windows/Node-22 CI green on the audited SHA covers H01–H03. |
| I01–I05 | PARTIAL (suite) | Failure-injection behaviors are covered by the green two-round regression suite; no new live fault-injection run. |
| J01–J05 | PASS (static) | J04 credential boundary holds; concurrency/long-run remain suite-gated, not live-run. |

## Runtime / evidence boundaries

Confirmed execution evidence this round: (a) local execution on this host (Linux, Node.js v22.19.0) of `node dist/cli.js --help`, `status`, and `run-once` against a synthetic mock config; (b) GitHub Actions run `36218491349` and its recorded job steps on the audited SHA; (c) `npm run typecheck` on this checkout. Not executed: provider calls, unattended daemon, Discord/Telegram delivery, Web cockpit browser session, multi-worktree stress, release/deploy, or recovery drills.

## CLEAN accounting

`autodev-ng` remains **NOT CLEAN**:

1. Streak is now 1/2 consecutive rounds with no new P0/P1/P2; one more clean round is required.
2. The all-resolved condition fails while #13 and other open tracked P1/P2 issues remain open or unjustified.
3. Provider/daemon/notification/Web/multi-worktree/recovery runtime evidence remains incomplete under the portfolio protocol.

Next round repeats the fixed 50 personas on the then-current default SHA. `CLEAN` requires the second consecutive no-new-finding round plus resolution or explicit `not_planned` justification for all open P0/P1/P2 issues.

Umbrella audit: #2
