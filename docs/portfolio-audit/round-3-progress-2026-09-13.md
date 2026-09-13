# Portfolio 50-Persona Audit — 2026-09-13 Continuation

Protocol: `docs/portfolio-audit/2026-09-06-50-persona-audit.md`

This file continues the fixed A01–J05 portfolio audit from the prior dated progress trackers. Runtime claims are limited to actual execution/CI/deployment evidence.

## `Reese-max/neciken-summer-poem`

Status: **NOT CLEAN — clean streak 0/2**

Audit report: `docs/audits/50-persona-round-2-2026-09-13.md` in the repository.

### P2 #1 remains open — default-branch CI does not reach pytest

Current audited default product state was `master` at `45c9e933bd5382a783495ffa5231f13211822674` before this round's report commit. GitHub Actions run `33989318277` actually executed checkout, Python setup and install, then failed at `python -m ruff check .`; pytest was skipped.

Candidate PR #2 remains open/unmerged. Its local Ruff/pytest results are candidate evidence only; remote PR run `34133831547` had `runner_id=0` and `steps=[]`, so it is not code-level runtime evidence.

### P2 #3 formally enters the fixed-persona CLEAN gate — contest-rule freshness is not enforced before export

Existing Issue #3 already describes the same stable fingerprint and is reused rather than duplicated.

Current-default evidence shows:
- contest discovery stores point-in-time `來源快照` values;
- promoted profiles still contain snapshots such as `查核日: 2026-07-25`;
- `contest.require_export_allowed()` delegates to `require_generation_allowed()` rather than revalidating the official contest source;
- there is no `source_content_hash` / versioned rule-drift receipt implementation on current default.

A previously promoted contest profile can therefore reach contest-targeted export without machine-verifiable proof that deadline, AI policy, eligibility, word/file format, fee or submission channel remain current. This is classified P2 because it is a significant trust/recoverability defect, while there is no evidence in this round of an actual rejected submission or irreversible loss.

Issue #3 now contains the fixed-persona linkage and runtime boundary. No live contest submission or online freshness validation was claimed.

### CLEAN decision

Not eligible to count a clean round. #1 and #3 remain unresolved, required runtime paths are incomplete, and the same fixed 50-persona scenarios must be rerun after relevant fixes land. Consecutive clean rounds remain **0/2**.

## `Reese-max/video-timeline-pipeline`

Status: **NOT CLEAN — clean streak 0/2**

Audit report: `docs/audits/50-persona-round-3-2026-09-13.md` in the repository.

Current default product SHA before the audit report commit was `dc421fef263ccc5b7321910304a9fa910c1a5c5d`. Three product commits landed after the prior persona round: notification delivery (#2), scoring (#3), and cost tracking/budget/provider health (#4), so the same fixed personas were rerun against the changed cost-safety surface.

### New P2 #18 — `COST_TIMEZONE` is read but ignored by budget period calculation

Current `cost_tracker.py::_current_period_id()` reads `COST_TIMEZONE` (default `Asia/Taipei`) but constructs `now` in UTC and formats the UTC date directly. The configured IANA timezone is therefore not applied to daily/monthly accounting periods.

That makes an Asia/Taipei daily hard-stop reset at 08:00 local time instead of local midnight. A single configured local day is split across two UTC buckets; spend/reservations immediately before and after 08:00 can be admitted against different daily buckets although they belong to the same local calendar day.

Current cost tests cover reservation arithmetic and direct budget rejection, but do not freeze time or exercise timezone/local-midnight/DST boundaries. This is P2 rather than P0/P1 because budgeting is opt-in and this round has no evidence of a real provider overcharge; once enabled, however, the period boundary is part of the safety contract.

Tracked as Issue #18: `[P2][50-persona audit] Honor COST_TIMEZONE for daily budget boundaries`.

Affected personas: D04, H03, H05, I05, J04.

### Existing P2 #8 remains reproducible

Bright Data Instagram discovery remains cloud-opt-in but unbounded by default: README still states `--instagram-max-items` is optional/no-limit by default, and current source accepts `max_items=None`. The new general cost tracker does not satisfy #8's requirement that provider-consuming Instagram discovery have a finite provider-work bound before a request can start.

### Runtime boundary

GitHub Actions currently returns `total_count: 0` for `main`. No current-SHA GitHub CI pass, provider canary, real billing enforcement, email delivery, interrupted-resume, or concurrency execution is claimed. Checked-in tests are source evidence only until actually executed.

### CLEAN decision

Round 3 adds new P2 #18 and #8 remains open. `video-timeline-pipeline` stays **NOT CLEAN**, and the consecutive no-new-P0/P1/P2 count is reset to **0/2**. After fixes land, rerun the same fixed personas and retain actual execution evidence for budget/provider/recovery paths.

## `Reese-max/tick-stock-panel`

Status: **NOT CLEAN — clean streak 0/2**

Audit report: `docs/audits/50-persona-round-4-2026-09-13.md`, commit `7257be29f002a4e951d616f8a5eb2b1a8aa7f2a9`.

Audit-start default branch was `main` at `f2190a97339637fe7e0e0376fc5a22b241426e4c`. Since the prior fixed-persona Round 3, no product-code remediation landed for the existing coverage-gating finding; the intervening changes are audit/documentation updates.

### P1 #6 formally enters the fixed-persona CLEAN gate — untrusted strategy Python executes in the service process

The current strategy validator explicitly states that its AST allowlist is not a real sandbox and that real isolation requires a restricted subprocess. `StrategyEngine._load_file()` re-runs the AST check but then imports the strategy and calls `spec.loader.exec_module(mod)` in the service process before reading `META`.

Existing Issue #6 already tracks the same stable fingerprint and was updated with A01–J05 linkage rather than duplicated. This is source-level evidence of an inadequate containment boundary; this audit does **not** claim an exploit, secret read, filesystem escape, outbound network action, timeout/OOM incident, or production compromise. Closure still requires the adversarial matrix to execute in the actual Docker/self-host runtime and demonstrate filesystem/environment/network/process denial, resource bounds, isolation-unavailable fail-closed behavior and parent-process survival.

Representative fixed personas affected: C05, D03, H03, H05, I03, I04, I05, J03, J04, J05.

### New P2 #7 — current default-branch Docker/release jobs fail before runner execution

The checked-in `.github/workflows/docker.yml` declares checkout → QEMU → Buildx → GHCR login → metadata → multi-architecture Docker build/push for `main` pushes.

A known executed success exists: run `34102027415` on `565ccdfee6c2fb0c079cd4192edb9cb31c9157f4` received a GitHub-hosted runner and completed the declared build/push steps.

The subsequent audited sequence has lost that execution receipt:
- run `34291339683` on `36435398062cae2ae496a74228a98dab5d82cc8b`: `failure`, `runner_id=0`, empty runner name, `steps=[]`;
- run `34732649615` on audit-start SHA `f2190a97339637fe7e0e0376fc5a22b241426e4c`: `failure`, `runner_id=0`, empty runner name, `steps=[]`;
- the Round-4 report commit `7257be29f002a4e951d616f8a5eb2b1a8aa7f2a9` triggered run `34741276880`, which again failed with `runner_id=0`, empty runner name and `steps=[]`.

Because all three failures occur before any declared workflow step executes, no application, Dockerfile, GHCR, dependency, or test failure is inferred. The actual GitHub-side admission/platform reason remains unknown. New Issue #7 requires preserving that real reason, restoring an actually executing gate, retaining execution receipts, and obtaining two consecutive current/recent successful default-branch executions before this blocker can be cleared.

Representative fixed personas affected: C05, D03, H03, H05, I05, J05.

### Existing P2 #2 remains unresolved

Round 3 established that provider coverage metadata (`coverage`, `partial`, `empty_universe`, universe size, `as_of`) is materially improved but not proven as a server-enforced screening precondition. No product-code change landed after that finding, so the same coverage-gating fingerprint remains open under Issue #2.

### Runtime boundary

Actual runtime evidence in this continuation is limited to GitHub Actions run/job metadata. It proves one historical Docker build/push execution and three later zero-step admission failures. It does not prove current application tests, screener coverage enforcement, live provider behavior, browser/accessibility/mobile behavior, custom-strategy sandboxing, or current image runtime health.

The current Docker workflow itself contains no application regression-test step. Even after Actions execution is restored, a green image build is packaging/release evidence unless a separate authoritative application test gate is executed and retained.

### CLEAN decision

Round 4 formally adds P1 #6 to the fixed-persona gate and adds new P2 #7, while P2 #2 remains open. `tick-stock-panel` stays **NOT CLEAN** and its consecutive no-new-P0/P1/P2 streak remains **0/2**. After the relevant fixes land, rerun the same A01–J05 scenarios with required runtime receipts before beginning CLEAN counting.

## Portfolio stop condition

**Not reached.** Continue with repositories that are not CLEAN under the same protocol.
