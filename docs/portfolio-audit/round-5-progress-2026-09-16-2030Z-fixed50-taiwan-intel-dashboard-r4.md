# Portfolio audit continuation — fixed 50 / Taiwan Intel Dashboard Round 4

Run ID: `2026-09-16T20:25:03Z-taiwan-intel-dashboard-r4-regression`  
Portfolio status: **PARTIAL / NOT CLEAN**  
Fixed-50 protocol blob: `6e3499d6ef5be7e123050e1526946f6a40f99263`  
Issue-quality-v2 blob: `8167e10798071d2276addaff6b201c6b0e904a2a`  
Prior continuation read: `docs/portfolio-audit/round-5-progress-2026-09-16-1742Z-fixed50-incremental.md` (`8ae13078bf0a244f74d3dc248c234c705ce36828`).

## Inventory

Connected GitHub owner enumeration was refreshed this run with page size 100 and returned **42 Reese-max-owned repositories**. Archived repositories remain scope-classified rather than auto-CLEAN; the observed archived set remains `gemini-deidentifier`, `obsidian-vault`, and `openab`. No owner-list pagination gap was observed in the returned inventory.

## Incremental priority checks before cursor work

The run first checked current default-branch change/evidence state for higher-priority recently audited repositories rather than treating audit-only commits as fixes:

- `ppt-studio`: no landed product remediation observed after the P0 translation lost-update finding; later commits are audit/documentation only.
- `voice-actress`: no landed default-branch product remediation observed after the P0 personal-session ownership finding.
- `project-doctor-web`: no landed default-branch product remediation observed after the P1 split-turn emergency-gate finding.
- `police-exam-archive`: no landed product remediation observed for the active mock-exam reload/recovery P2.
- `police-exam-practice`: compatibility-shell state unchanged in substance; exact-head workflow evidence exists, no new distinct P0/P1/P2 established.
- `prompt-autoresearch`: no new distinct current-default finding established; existing tracking retained.
- `skill-foundry`: later fixed-50 Round 3 already covers its current product SHA; remaining runtime evidence prevents CLEAN.
- `soundbox-offline`: product baseline/finding state unchanged in substance; existing blockers retained.
- `spotify-playlist-organizer-mcp`: current product has later changes and pre-existing tracked findings; no new distinct finding created in this run.
- `taichung-police-intel`: latest fixed-50 Round 3 already covers current product state; existing blockers retained.

These checks did not create new qualifying rounds merely because SHAs or reports were re-read.

## `Reese-max/taiwan-intel-dashboard`

Inspected product SHA: `44eb775d3fe9e335b34b3e46be2bbffb42c572eb` (`main`).

Current source/product evidence reviewed included README, package/scripts, manifest producer/consumer, event/map loader, network loader, main UI orchestration, cohort tests, current Issues/comments, branches, open PRs and exact-head Actions query.

### Confirmed regression

Original Issue #38 had been closed as completed after commit `44eb775...`. Re-verification against its own D2 acceptance criteria found the same-cohort contract remains only partially implemented:

- manifest producer records scope paths, hashes and snapshot ID;
- manifest consumer validates only manifest version/snapshot ID;
- event/map loaders still fetch hard-coded paths and do not validate manifest hash/cohort before promotion;
- only network receives the manifest snapshot ID;
- network mismatch guard accepts a response with missing `snapshotId` even when an expected snapshot is known;
- current cohort tests do not execute deployment-between-requests mixed-cohort consumer promotion.

Result: **#38 = REGRESSION / PARTIALLY_FIXED / P2 / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false**.

The original Issue was reopened rather than duplicated:
https://github.com/Reese-max/taiwan-intel-dashboard/issues/38

No production mixed-cohort incident was claimed and no failure injection was performed against production. Exact-head Actions query returned `total_count: 0`; runtime remains `NEEDS_RUNTIME_VERIFICATION`.

### Fixed 50 round

A01–J05 were re-run as 50 synthetic scenarios against current source/evidence. Report commit:

- `8d645bd526ddf93741aaacd2711efa1a8fb8680b`
- https://github.com/Reese-max/taiwan-intel-dashboard/blob/8d645bd526ddf93741aaacd2711efa1a8fb8680b/docs/audits/50-persona-round-4-2026-09-17.md

Coverage: **50/50**. This is a complete synthetic scenario round but **not a qualifying CLEAN round** because a P2 regression was confirmed, current applicable P2 work remains open, and necessary runtime evidence is incomplete. Consecutive qualifying streak remains **0/2**.

A deduplicated fixed-50 umbrella was created because no existing umbrella tracker was found:
https://github.com/Reese-max/taiwan-intel-dashboard/issues/41

Issue #38 and umbrella #41 were written under `github-issue-lock:v1` leases, read back, and released with completion markers. No worker/run/GOAL, product code change, merge, deployment, repository setting change or paid external action was started by this audit.

## Fairness / continuation cursor

The portfolio remains incomplete. This run advanced through the late-alphabet fairness segment and performed the required high-priority regression recheck on `taiwan-intel-dashboard` after a relevant default-branch fix landed.

Next fair discovery/reverification cursor: **`tick-stock-panel`**, followed by `UkePack`, `video-timeline-pipeline`, and `voice-actress` unless a new P0/P1/regression or landed finding fix takes priority first.

## Notification decision

Notification condition is met for this run because #38 is a **newly confirmed regression** after it had been closed as completed. The umbrella creation and ordinary progress are not notification triggers by themselves.
