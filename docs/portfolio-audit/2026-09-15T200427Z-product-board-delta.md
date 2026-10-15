# Portfolio product-board delta — 2026-09-15T20:04:27Z

## Scope and rule version

- Owner scope: `Reese-max` only.
- Quality rule re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality-rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh fully paginated inventory: 42 owned repositories; 39 unarchived; page 2 empty.
- Delta boundary: the last product-board report commit `3097a14e3fbe45ad3e4cd870fd89e516b4416b90` in `google-maps-personal-mcp`.
- This pass changed no product code, CI/config, secrets, permissions/settings, branches, deployment, paid service, provider state, user data, GOAL or implementation worker.

## Portfolio delta triage

Across all 39 unarchived repositories, the default-branch commit comparison after 2026-09-15T17:09:10Z found no new product-code commit. The only new default-branch commits were four `autodev-ng` audit/cursor artifacts:

- `ca91e4c` — user-feedback cursor;
- `e60e362` and `adbf073` — fixed-persona incremental audit/correction;
- `0c2cff9` — external competitive radar.

The all-repository updated Issue/PR check found no new product implementation or regression state requiring a product-board Issue mutation. The only newly visible Issue was `google-maps-personal-mcp #4`, already mapped and reported by the preceding product-board round. No repeat comment or duplicate Issue was created.

## Fair-rotation target: herdr-skills

- Default branch: `main`.
- Current HEAD: `9f134e1b0a53ffe72a64a5793ddc7dabe03ed571` (fixed-persona audit-only).
- Current product baseline: `ec91e1c61a288eca74c658d6e534604b6e45a5ee`.
- No product commit has landed since 2026-08-31.
- Branches re-read: `main`, three audit branches, `fix/issue-3-rebind-project-alias`, and `devin/issue-6-correction-candidates`.
- Current HEAD has no returned Actions run and no commit-status receipt. This is not evidence that tests pass or fail.
- Core evidence re-read: README, both Skill policies, Reflect and Supervisor validators, contract tests, and the fixed-persona Round 1 report.
- All Issue comments for #2/#3/#6 and all discussion/review threads for open PRs #1/#5/#7/#8 were read before this write.

### Existing findings and active ownership

1. **#3 / PR #5 — project relocation/rebind**
   - The product defect remains open on default branch.
   - PR #5 adds a local alias/rebind path and an in-process round-trip was previously reported.
   - Its own PR description leaves deterministic rebind tests, ambiguity handling and Windows↔POSIX guidance incomplete.
   - It has an active implementation branch and ownership history. Status: `SKIPPED_LOCKED_ACTIVE_PR#5`; not `VERIFIED_FIXED`.

2. **#6 / PR #8 — correction-to-candidate research**
   - This is research, not an established P1 product defect and not implementation authorization.
   - PR #8 remains active and has three unresolved review threads: one P1 privacy boundary conflict (exact diffs in `STRUCTURED_ONLY`) and two P2 document/schema problems (invalid JSONC example and missing schema discriminator).
   - Those review findings are already directly tracked in the PR discussion. Status: `SKIPPED_LOCKED_ACTIVE_PR#8`; no Issue scope rewrite or duplicate comment.

3. **PR #7 — existing product-board report**
   - The draft already contains discovery, current competitors, 13 board perspectives, 30 regression + 20 exploratory personas, switching simulation, Red Team, roadmap and decision memo.
   - Product behavior and runtime evidence have not changed since it was authored. Reposting the same report would add no decision value.

4. **PR #1 — superseded fixed-persona audit branch**
   - A later Round 1 report was merged via PR #4. PR #1 remains open with an unresolved review about protocol revision pinning.
   - No product scope is changed here; stale branch cleanup is an owner decision, not an audit fix.

### Fresh external strategy signal

The immediately preceding external radar is preserved at
`docs/competitive-intelligence/2026-09-15T175655Z-external-radar.md` on `autodev-ng@0c2cff9`.

Its 2026-09-15 first-party review found that OpenAI's Agents API now offers managed sessions, subagents and artifacts, while Claude Code separates memory/instructions/skills/hooks and Temporal continues to offer durable execution. These are strategy signals to keep `herdr-supervisor` thin and provider-neutral, not evidence that a new runtime adapter, hosted orchestrator, database or dashboard is needed.

The exact correction-memory fingerprint remains owned by #6/PR #8, so the external evidence was correctly recorded centrally as `SKIPPED_LOCKED` rather than used to expand that PR.

## Product-board and 50-persona check

The existing 30-persona regression baseline and 20-persona exploration cohort remain the maintained Product Board set. This pass checked the unchanged product baseline and current active PR/review state against the same core journeys:

- project move/restore remains covered by #3;
- correction recurrence/privacy/promotion remains covered by #6;
- root response versus settled child/effect completion remains addressed by current Supervisor policy;
- provider-native session/subagent primitives do not establish a missing supported Herdr workflow;
- no additional supported-path P0/P1/P2 failure was established.

Synthetic preferences and simulated board disagreement are not rerun as numerical evidence because neither product behavior nor external execution evidence changed. This Product Board check is separate from fixed `A01–J05`; Round 1 remains NOT CLEAN and 0/2.

## Red Team

- The current Supervisor may already contain the relevant run/effect/lease invariants; provider session APIs do not prove a gap.
- A read-only provider fact binding would be smaller than a hosted orchestration layer if a real Herdr backend later requires it.
- Community reports about runaway/stale subagents are anecdotal and cannot establish a Herdr defect or incidence.
- #6's privacy concern is an active PR review finding, not a reason for this audit to seize its scope.
- PR #5's presence and an in-process exercise do not make the default-branch relocation scenario fixed.
- Lack of current-HEAD Actions/status prevents CLEAN but does not prove product failure.
- A compact existing state artifact may be sufficient; no dashboard, registry, memory SaaS, marketplace or provider migration is justified.
- External runtime/provider status cannot grant permission or replace acceptance/authorization evidence.

## Decision memo

Maintain **INVEST / SIMPLIFY**:

1. Complete #3 with the original move/restore, ambiguity, interruption and cross-platform evidence before claiming recovery fixed.
2. Resolve PR #8's privacy/schema review within its current research owner; preserve `candidate != active rule != permission`.
3. Keep Supervisor as a provider-neutral evidence/authorization layer; consider provider adapters only after a real supported Herdr workflow shows a missing runtime fact.

Do not build another hosted orchestrator, session database, agent dashboard, transcript-mining SaaS, marketplace, automatic policy writer or provider-specific mandatory runtime.

## Quality-gate accounting

- New actionable findings: 0
- New Issues: 0
- Updated/reopened Issues: 0
- Research Issues changed: 0
- Duplicate/active-scope avoided: 4 (#3/PR #5, #6/PR #8, report PR #7, fixed-audit PR #1)
- `SKIPPED_LOCKED`: 2 active product/research scopes (#3, #6)
- Rejected/deferred opportunity groups: 8
- Scope narrowed: 1 (provider platform signal -> no current adapter work)
- Severity correction: 0
- Verified fixed: 0
- Issue write blocked: 0
- Report write blocked: 0 at authoring time
- Portfolio CLEAN: not claimed

## Fair-rotation cursor

Completed target: `herdr-skills`.

Next cold-rotation target: **`lobsterpulse`**.

Before any later shared write, re-read the current default-branch HEAD, all Issue comments, open PRs/branches, current audit/roadmap decisions, and available CI/deployment evidence. Do not treat audit-only commits as product remediation and do not repeat prior reports without a material evidence delta.
