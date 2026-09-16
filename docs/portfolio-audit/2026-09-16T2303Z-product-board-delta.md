# Product Board Delta — Skill Foundry CI Admission

- Audited at: 2026-09-16T23:03Z
- Rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Repository: `Reese-max/skill-foundry`
- Default branch: `main`
- Default HEAD: `21be2b62b72fb3030b50b08a078da2f6569961be` (audit-only)
- Inspected product baseline: `e865c0057f49b55cab5215aeb884d0992c4e7fef`
- Active PR inspected: [#8](https://github.com/Reese-max/skill-foundry/pull/8), head `4ded6b1adfbc9dedebd939c8c4109a9bdf3bce5e`
- Status: PARTIAL portfolio round; not Portfolio CLEAN

## Discovery and delta boundary

The latest default-branch change is the fixed A01–J05 audit report, not product remediation. The last substantive product change remains `e865c005…`, already covered by [fixed 50-persona Round 3](https://github.com/Reese-max/skill-foundry/blob/21be2b62b72fb3030b50b08a078da2f6569961be/docs/audits/50-persona-round-3-2026-09-16.md): 50/50 scenarios, zero new qualifying P0/P1/P2 findings, zero confirmed regressions, CLEAN streak 0/2 because required runtime evidence remains incomplete.

All repository Issues and PRs were rechecked. Existing scopes remain:

- [#6](https://github.com/Reese-max/skill-foundry/issues/6): default-branch deterministic gate receipt, currently `VALIDATION_GAP / severity=NOT_ESTABLISHED / decision_priority=P2`.
- [#1](https://github.com/Reese-max/skill-foundry/issues/1) / [PR #2](https://github.com/Reese-max/skill-foundry/pull/2): target-runtime compatibility; active and unmerged.
- #3–#5: security, distribution and intake research/opportunity scopes.
- [#7](https://github.com/Reese-max/skill-foundry/issues/7): fixed A01–J05 tracker.

## F-01 — PR #8 cannot yet produce the clean-run receipt required by #6

```yaml
kind: VALIDATION_GAP
severity: NOT_ESTABLISHED
decision_priority: P2
triage: NEEDS_REVIEW
auto_implementation: false
evidence: SOURCE_CONFIRMED + GITHUB_RUN_CONFIRMED
runtime_status: NEEDS_RUNTIME_VERIFICATION
tracking: existing_issue_6_and_active_pr_8
```

### Problem, impact and evidence

PR #8 adds one `windows-latest` workflow that sets up Python 3.11 and immediately runs `./ci.ps1`. It does not install repository Python dependencies. The PR head contains neither `requirements.txt` nor `pyproject.toml`; public tests resolve `pymupdf.open`, and the worker uses PyMuPDF on the paper ingestion path.

GitHub did admit and execute the workflow:

- [Actions run 35089831046](https://github.com/Reese-max/skill-foundry/actions/runs/35089831046): `completed / failure`
- Job `deterministic-gates` ID `104773263774`: `completed / failure`
- The unresolved [inline review thread](https://github.com/Reese-max/skill-foundry/pull/8#discussion_r4025439662) identifies the missing dependency installation step.

The connector returned no job steps/log body, so the exact failing stack trace is UNKNOWN. It is SOURCE_CONFIRMED that a clean runner is not given a declared/installable dependency set, and RUN_CONFIRMED that this exact PR head is red. It is LIKELY, not claimed as proven from logs, that missing PyMuPDF is the immediate failure.

Affected users are maintainers and reviewers attempting to obtain the exact-SHA independent admission receipt promised by #6. The current workaround remains a local environment with preinstalled dependencies and uncommitted `.runtime` evidence; it cannot prove clean-environment reproducibility.

Stable fingerprint:

`skill-foundry + PR #8 clean windows runner + workflow invokes full ci.ps1 without declaring/installing PyMuPDF dependency + deterministic-gates run fails + exact-SHA admission receipt remains unavailable`

This is not a default-branch product outage, production incident, provider failure, or P1 user-path regression. It is a P2 decision-priority blocker inside an active fix for an existing validation gap.

### Minimum effective scope

Reuse PR #8 and #6. Add the smallest deterministic dependency declaration/install step needed by the public suite, then obtain:

1. a green PR-head run bound to the corrected SHA;
2. the safe negative-fixture red receipt already required by #6;
3. after merge, a green current/default-branch run;
4. a README/status statement separating hosted deterministic CI from local and live-provider evidence.

Do not create a package manager migration, multi-OS matrix, provider canary, hidden-case upload, CI platform, or new framework merely to resolve this blocker.

### Concurrency decision

PR #8 is an active owner branch with an unresolved review thread. This audit is `SKIPPED_LOCKED` for scope mutation: no Issue/PR comment, label change, branch, merge, or implementation write was performed. The finding is independently preserved here and mapped to #6/PR #8, so no duplicate Issue is warranted.

## Competitive refresh

Official sources rechecked on 2026-09-16 UTC:

| Alternative | Confirmed current signal | Implication |
|---|---|---|
| [OpenAI Skills](https://help.openai.com/en/articles/20001066) | Managed create/upload/install/share, workspace permissions, upload scanning and review states | SHOULD BE BETTER at reconstructable evidence; do not copy the whole managed workspace surface |
| [Agent Skills specification](https://agentskills.io/specification) | Portable `SKILL.md`, explicit compatibility field, scripts should document dependencies, `skills-ref validate` | MUST MATCH dependency/compatibility clarity; keep Foundry as a governance layer over the portable format |
| [Claude Code Skills](https://code.claude.com/docs/en/skills) | Integrated authoring/distribution and evaluation workflow | SHOULD BE BETTER at signed, independent promotion evidence; simplify first success |
| [GitHub Actions Python CI](https://docs.github.com/en/actions/tutorials/build-and-test-code/python) | Separates runtime setup, dependency installation and test execution | MUST MATCH a declared, reproducible install before the gate |
| [DSPy](https://dspy.ai/) | Programmatic optimization/evaluation alternative | DIFFERENTIATOR remains policy-governed promotion, not optimizer breadth |

Classification remains: **MUST MATCH** clean exact-SHA deterministic replay and declared dependencies; **SHOULD BE BETTER** signed aggregate evidence and runtime/policy drift handling; **DIFFERENTIATOR** proposer/evaluator/approver separation; **DO NOT COPY** generic marketplace, hosted agent SaaS, engagement analytics or opaque judge-only scoring.

## Virtual board

- CEO: if only three things are funded, finish #6 with a reproducible clean-run receipt, complete #1 runtime compatibility with real evidence, then calibrate #3 package security. Do not fund marketplace/SaaS/mobile.
- CPO/UX: the main user promise is a trustworthy candidate-to-decision receipt; a permanently red admission workflow weakens first success more than missing features.
- CTO/Principal Engineer: the workflow must install a pinned/minimal dependency set before calling the single repo-owned gate. Avoid duplicating policy in YAML.
- QA/SRE: retain a deliberate red-path receipt, then require PR-head and merged-SHA green receipts. A local PASS does not substitute.
- Security/Privacy: required CI stays secret-free and excludes hidden cases, transcripts and provider credentials.
- CFO/Growth: no paid calls in the mandatory lane; adoption should be driven by portable trust evidence, not feature count.
- Accessibility/Support: expose text PASS/FAIL/BLOCKED and a short remediation; screen-reader/runtime usability remains unverified.

Material disagreement is preserved: a single-owner research tool could accept local-only validation. The counter-position wins for now because the product itself sells evidence-gated promotion; scope is nevertheless constrained to dependency declaration plus receipts, not a new platform.

## Persona continuity

No new default-branch product code landed after the fixed A01–J05 Round 3, so the audit did not rotate away or re-count the fixed baseline. The latest formal product-board cohort remains 30 regression + 20 exploration personas; its synthetic preference allocation is not user research, market share or priority evidence.

This delta adds one journey state without changing the cohort:

- Windows/clean-run maintainer: **FAIL confirmed at PR head** — workflow is admitted but the deterministic job is red.
- Reviewer/security/cost personas: still **PARTIAL/UNKNOWN** until the red-path, green PR and green merged-SHA receipts exist.
- Provider/runtime personas: unchanged; CI does not prove live Agnes, Codex, Waza/MiniMax, hidden-set, accessibility or production behavior.

## Red Team

- A red run alone does not prove missing PyMuPDF is the exact log root because job steps/logs were unavailable.
- `setup-python` installs Python, not arbitrary project dependencies; the current source still lacks an install contract.
- Installing the latest unpinned package ad hoc would trade one validation gap for dependency drift; a minimal declared boundary is preferred.
- Expanding to Linux/macOS is not required to fix the supported Windows path.
- PR #8 also corrects raw-byte hash CRLF behavior with `.gitattributes`; that is a distinct portability improvement and should not be discarded because CI is red.
- No evidence establishes a user outage, bad promotion, secret leak or production incident; P1 is rejected.

## Decision memo and roadmap

Decision: **INVEST / SIMPLIFY**.

- Serve advanced Skill authors and reviewers who need provenance, bounded evaluation and separation of duties.
- Compete on reconstructable promotion evidence, not marketplace breadth.
- NOW: correct PR #8's clean-run dependency boundary and satisfy #6's red/green/exact-SHA receipts.
- NEXT: complete #1 runtime compatibility and #3 narrow package-risk evidence.
- LATER: #4 distribution receipts and #5 privacy-bounded demonstration intake.
- DON'T: marketplace, hosted multi-tenant SaaS, generic orchestration, second registry/memory, paid provider calls on every PR, native app.
- Recommendation is not implementation authorization.

## Closure accounting

- Total findings: 1
- New Issues: 0
- Updated/Reopened Issues: 0
- Existing mapping: F-01 → #6 + active PR #8
- Duplicate avoided: 1
- `SKIPPED_LOCKED`: 1 active PR
- Verified fixed: 0
- P0/P1 product regressions: 0
- Decision priority: P2 1; severity remains NOT_ESTABLISHED
- Issue/report write blocked: 0
- Runtime limitation: exact failure log unavailable; no default-branch green run; no provider, hidden-set, accessibility or production exercise
- Fixed A01–J05 result: unchanged, NOT CLEAN, streak 0/2
- Next fair product-board cursor: `video-timeline-pipeline`
