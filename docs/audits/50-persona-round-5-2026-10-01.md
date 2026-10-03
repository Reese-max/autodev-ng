# AutoDev-NG 50-Persona Audit — Round 5

Date: 2026-10-01
Protocol: `docs/portfolio-audit/2026-09-06-50-persona-audit.md`
Default branch: `main`
Audited default-branch SHA: `99eba2458a82a4fb8e70c25c5a454014b568c659`

> Fixed simulated personas only. This round distinguishes source inspection, checked-in test definitions, GitHub Actions execution, and local CLI execution on this audit host (Linux, Node.js v22.19.0). No human usability study is claimed; provider, unattended-daemon, Discord, Telegram, Web cockpit, multi-worktree and release paths are not represented as runtime-passed unless cited.

## Result

**NOT CLEAN — current no-new-P0/P1/P2 streak: 0/2. The original 2/2 claim is invalidated by the correction below.**

The audited default-branch SHA was **unchanged since Round 4** (`99eba245…` remained `main` HEAD). Round 5's local execution and tracker evidence below still document that run, but an independent review on 2026-10-03 found missed P2 findings on that same SHA. The original “no new finding” conclusion was incorrect and does not advance the streak.

CLEAN remains blocked on the other protocol conditions: open tracked P1/P2 issues are still unresolved or unjustified (see "CLEAN accounting"), and the required runtime-evidence set is still incomplete.

## Correction (2026-10-03): independent review

The original Round-5 entry below said there were no new findings and claimed a 2/2 streak. That conclusion is invalidated by an independent review of the exact audited default-branch SHA `99eba2458a82a4fb8e70c25c5a454014b568c659`:

- **Repeated P2 — first-success path friction (A01, A02, B01, E03, H05).** On the audited default branch, the provider-free mock quickstart still appears after the installation and full-configuration steps in README. The mock path exists, but its placement makes first use harder than the audit claimed.
- **P2 — missing persistent labels (G02, E03, F04).** The Web cockpit's `goalInput`, `taskInput`, and `silenceInput` fields relied on placeholders and had no associated `<label>` or `aria-labelledby`. W3C WAI guidance says placeholders do not replace labels: [Forms Instructions](https://www.w3.org/WAI/tutorials/forms/instructions/).

These findings were present on the audited SHA, so the no-new-finding premise failed and the streak resets to **0/2**. This independent pass found no new P0/P1. PR #117's candidate now moves the mock quickstart earlier and adds visible associated labels plus a regression test; exact-head CI and a fresh audit of the merged default branch are still needed before counting a clean round.

## Original Round-5 finding entry (superseded)

The original review recorded no reproducible P0/P1/P2 findings. That statement and the 2/2 streak claim are superseded by the correction above; the execution records below are retained as evidence of the commands run.
## Post-fix rerun of existing findings

### #3 — committed judge credential material (P0, closed)

**Positive current evidence, unchanged.** A tracked-file sweep for credential-shaped material (`gh[pousr]_*`, `xox*`, `AKIA*`, `sk-*`, Telegram bot-token shape, private-key blocks) again found no committed secret; every tracked config under `configs/` references secrets indirectly (`"judgeApiKey": "{env:JUDGE_API_KEY}"`). `npm run typecheck` — which runs `scripts/check-secrets.mjs` — passed on this checkout ("Secret scan passed: no raw credentials detected"), and CI run `36218491349` executed the same command green on the audited SHA. Provider-side validation remains outside this audit's scope.

### #4 — CLI help / first-success path (P2, closed)

**Re-executed acceptance on this audit host.** Against the audited SHA built via `npm run build`:

- `node dist/cli.js --help` → exit 0, prints usage, the synthetic/mock safe-first-run block, and secret-reference guidance, without reading config or starting anything.
- `node dist/cli.js github --help` → exit 0, prints the GitHub subcommand surface.
- The documented first-run path was executed verbatim in a fresh temporary directory (`{"projectPath":"./project","backlogFile":"./project/BACKLOG.md","dataDir":"./data","engine":"mock"}`, empty `BACKLOG.md`, `git init` + initial commit): `status --config config.json` → exit 0 (`daemon 未跑過`); `run-once --config config.json` → `CycleResult: idle`, exit 0. No provider or notifier was contacted.
- Error-path spot checks for I03-class personas: `status --config <missing.json>` → exit 1 with `設定檔不存在: <path>`; bare `node dist/cli.js` → exit 1 with usage. Errors are diagnosed at the boundary with a non-zero exit.

### #6 — unresolved configured secret references (P2, closed)

**Positive source/test evidence plus an executed gate, unchanged.** `src/cli/assemble.ts::resolveSecretString()` still throws before startup when an explicitly configured `{env:VAR}`/`${env:VAR}`/`${VAR}` or `{file:PATH}` secret is missing, unreadable, or empty; `telegramBotToken` resolves through the same function. `tests/config-secrets.test.ts` remains in-tree. `npm run typecheck` passed on this checkout and in the cited CI run.

### #13 — Windows full-regression CI gate (P2, open)

**Positive current-default evidence, plus new off-Windows verification on this branch.** CI run `36218491349` on the audited SHA remains green on `windows-latest`/Node 22 with all recorded job steps succeeded (`npm ci`, `npm run typecheck`, `npm run test:flaky-regression`, retained `tests/regressions/*.test.cjs`).

New this round: the same default-branch suite was executed on this Linux audit host. At the bare audited SHA, `npm test` (`vitest run`) reports 12 failures concentrated in Windows-bound specifications (`powershell.exe`/`taskkill` expectations, `isPidAlive` semantics, exit-9009 handling). This PR therefore carries the cross-platform gating already written for #13 (ported from unmerged PR #111): Windows-semantics specs use `test.skipIf(process.platform !== 'win32')`, `dist/`-dependent specs use a `RUNTIME_BUILT` presence gate, and POSIX zombie-reaping assertions use bounded `vi.waitFor` instead of single-point timing. With the gating, the suite on this host reports **204 files / 2007 passed / 8 platform-skipped**, and the Windows gate assertions are unchanged. #13's own acceptance (two consecutive green current/recent runs) remains owned by that issue and is not closed by this report.

## Observations (below the P2 bar)

- Tracked configs still embed host-specific absolute paths (`C:/Users/Administrator/...`) in `verifyCommand`/`prepareCommand`/`anysearchScript`/`botTokenFile` fields. README already directs maintainers to treat `configs/` as local deployment material; carried as the same P3 maintainability note for H05-class takeovers, not a new defect.
- `npm audit --omit=dev` reports 3 production dependency vulnerabilities (2 moderate, 1 high) via the `discord.js`→`undici` chain; round-4's 10-vulnerability count included the dev toolchain. P3 hygiene note; no exploit path is claimed.
- On non-Windows hosts the audited-SHA suite is not verifiable without the gating above (12 platform-bound failures). Recorded here as the off-Windows evidence boundary this PR removes; it is not counted as a new product defect.

## Fixed 50-persona matrix

| Persona group | Round-5 status | Evidence / reason |
|---|---|---|
| A01–A05 | PASS (static + local exec) | First-success path re-executed live; `--help` and `github --help` exit 0 with the isolated safe-start block. |
| B01–B05 | PASS (static + local exec) | B02's onboarding failure and secret-diagnosability gap both re-verified repaired; error-path exits confirmed non-zero. |
| C01–C05 | PASS (static) | C05 secret governance still enforced by fail-fast resolution, scanner in `typecheck`, and the status-payload allowlist. |
| D01–D05 | PASS (static) | D03/D05 credential governance verified; no committed secret material. |
| E01–E05 | PASS (static + local exec) | E03's four-field secret-free minimal path re-executed end-to-end. |
| F01–F05 | UNVERIFIED runtime | Developer/operator CLI; no dedicated accessibility runtime execution this round. |
| G01–G05 | UNVERIFIED runtime | Web cockpit/browser accessibility paths not executed. |
| H01–H05 | PASS (static + CI + local suite) | H01–H03 covered by green Windows CI on the audited SHA; the full suite now also verifies green on this Linux host via the carried platform gating; H05 takeover path verified. |
| I01–I05 | PARTIAL (suite + error spot-checks) | Failure-injection behaviors covered by the green two-round regression suite on Windows CI; missing-config/no-args exits re-executed. No new live fault-injection run. |
| J01–J05 | PASS (static) | J04 credential boundary holds; concurrency/long-run remain suite-gated, not live-run. |

## Runtime / evidence boundaries

Confirmed execution evidence this round: (a) local execution on this host (Linux, Node.js v22.19.0) of `npm run build`, `npm run typecheck`, `npm test`, `node dist/cli.js --help`, `node dist/cli.js github --help`, `status`, `run-once`, missing-config and no-args error paths against a synthetic mock config; (b) GitHub Actions run `36218491349` and its recorded job steps on the audited SHA; (c) GitHub issue state read on 2026-10-01. The Linux suite-green result applies to this branch's tree (audited SHA + platform gating), not to the bare audited SHA, which retains 12 Windows-bound failures off-Windows. Not executed: provider calls, unattended daemon, Discord/Telegram delivery, Web cockpit browser session, multi-worktree stress, release/deploy, or recovery drills.

## CLEAN accounting

`autodev-ng` remains **NOT CLEAN**:

1. Streak condition met: two consecutive rounds (4 and 5) produced no new P0/P1/P2 findings on the audited SHA.
2. The all-resolved condition fails: open tracked issues still carry P1/P2 severity tags — P1: #14, #39, #40; P2: #13, #15, #16, #30, #32, #33, #36, #42, #43, #44, #45, #47, #48, #49, #80. (#15 is included this round; its `[P2]` title tag was omitted from round-4's enumeration. Non-severity-tagged issues — #11, #12, #17, #21, #28, #31, #34, #35, #37, #38, #46, #51, #52, #55 — are outside the P0/P1/P2 gate.)
3. Provider/daemon/notification/Web/multi-worktree/recovery runtime evidence remains incomplete under the portfolio protocol.

Next round repeats the fixed 50 personas on the then-current default SHA. `CLEAN` requires the no-new-finding streak to hold **and** resolution or explicit `not_planned` justification for all open P0/P1/P2 issues, **and** the required runtime-evidence set.

Umbrella audit: #2
