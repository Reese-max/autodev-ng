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

## Portfolio stop condition

**Not reached.** Continue with repositories that are not CLEAN under the same protocol.
