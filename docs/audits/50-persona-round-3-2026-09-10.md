# AutoDev-NG 50-Persona Audit — Round 3

Date: 2026-09-10
Protocol: `docs/portfolio-audit/2026-09-06-50-persona-audit.md`

> Fixed simulated personas only. This round distinguishes source inspection, checked-in test definitions, GitHub Actions execution, and unverified external/provider runtime. No human usability study is claimed.

## Audited default-branch evidence

Product/default-branch SHA inspected before this audit-report commit: `8103b2129413727dc05471908a4b57d698f22561`.

The same fixed A01–J05 persona set was re-applied across onboarding, core execution/recovery, secrets/configuration, CI/regression safety, failure injection, observability, cost/reliability and trust dimensions.

## New actionable finding

### P2 — current Windows full-regression CI gate is red (#13)

GitHub Actions provides actual execution evidence rather than a source-only inference:

- `d1f5a3229e08177e0df888eb3480a63885d6222a` → CI `34428878217`: **success**.
- `e94916a75d52829c577078849cf9c675cb335464` → CI `34440070661`: **failure**.
- `5b1826dd068101c500a2f9615eb1a71eb5ea76c7` → CI `34454796061`: **failure**.
- product SHA `8143ec4a77afc947b7e77f818a32141b696420e6` → CI `34456050572`: **failure**.
- audited current SHA `8103b2129413727dc05471908a4b57d698f22561` → CI `34469734636`: **failure**.

For the product and audited-current runs, the Windows job actually completed checkout, Node 22 setup, `npm ci`, and `npm run typecheck`, then failed at `npm run test:flaky-regression`. The retained `tests/regressions/*.test.cjs` gate was consequently skipped.

`src/engines/flaky-regression.ts` confirms that this command executes the full Vitest suite twice with a 15-minute per-round timeout; therefore these failures cannot be represented as a green current full regression suite.

The available GitHub connector did not expose the Actions log body needed to identify the exact failed spec/assertion in this round. The audit therefore does not infer a particular failing test from duration and does not claim a user-visible runtime outage. #13 requires preserving the exact failure diagnostics, reproducing/fixing it without weakening the gate, and obtaining two consecutive green current/recent CI runs.

Affected personas/dimensions: H01–H05, I04, I05, J03, J05.

## Post-fix rerun of existing findings

### #4 — CLI help/onboarding

**Positive source evidence, runtime acceptance pending.**

Current `src/cli/entry.ts` handles `--help`, `-h`, and `help` before config assembly/provider startup, sets exit code 0, prints help, and returns. The help now contains a synthetic/mock safe-first-run example and secret-safe guidance. This directly addresses the previous source defect where `--help` was parsed as a command and failed without `--config`.

Because the current default SHA has a red full-regression CI gate, this round does not claim that the exact built `node dist/cli.js --help` acceptance passed on the audited SHA. #4 was updated with the source evidence and remains outside CLEAN accounting pending current-default execution acceptance.

Relevant personas: A01, A02, B02, E03, H05.

### #6 — unresolved configured secrets

**Positive source/test-definition evidence, full test execution pending.**

Current `resolveSecretString()` throws before startup when an explicitly configured env secret is missing/blank, or a configured file secret is missing/unreadable/empty. `tests/config-secrets.test.ts` defines regression cases for missing/empty env, missing/unreadable/empty file, valid env/file references, and the explicit CLI-transport case where an HTTP API key is intentionally unused.

The current Actions job did pass `npm run typecheck`, which includes the secret scanner and TypeScript check, but it later failed in the full two-round Vitest command. This round therefore does not claim the current SHA's complete Vitest suite passed. #6 was updated accordingly.

Relevant personas: B02, C05, D03, H05, I04, I05, J04.

## Runtime / evidence boundaries

Confirmed execution evidence in this round is limited to the cited GitHub Actions runs and their recorded job-step conclusions. No provider, Discord, unattended daemon, multi-worktree, browser control-plane, external deployment, or long-running production workload was executed by this audit. Source files and test definitions are not represented as runtime validation.

## CLEAN gate

**NOT CLEAN — consecutive no-new P0/P1/P2 count: 0/2.**

New P2 #13 resets the consecutive clean-round counter. In addition, #4/#6 still require their current-default acceptance to be reconciled with the red regression gate, and the repository's broader required runtime paths must retain evidence under the portfolio protocol. Do not mark CLEAN until all P0/P1/P2 are resolved or explicitly justified, required runtime paths have evidence, and two consecutive fixed-persona rounds on current/recent code produce no new P0/P1/P2 findings.
