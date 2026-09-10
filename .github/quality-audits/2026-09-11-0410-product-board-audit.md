# autodev-ng Product Board Audit — 2026-09-11 04:10 Asia/Taipei

> This report is a repository/static and GitHub Actions evidence audit. All personas and preference shares are synthetic simulations, not human research, customer interviews, market share, production traffic, or clinical/legal evidence. Runtime claims are made only where a cited execution receipt exists.

## Executive Summary

**Decision: INVEST / SIMPLIFY, with the release gate blocked until reliability is restored.** `autodev-ng` should become an owner-controlled, evidence-gated orchestration layer for heterogeneous coding agents: one place to intake work, enforce cost/security policy, isolate execution, preserve verification receipts, and return reviewable GitHub artifacts without auto-merging. Its moat is not the number of supported models; it is deterministic policy, multi-engine portability, auditable state transitions, and portfolio-wide operational memory.

The latest retrievable failing Windows run, [CI 34469734636](https://github.com/Reese-max/autodev-ng/actions/runs/34469734636), reached `npm ci` and `npm run typecheck`, then failed the full two-round regression step. The job log identifies **three distinct roots**, not one generic flaky timeout:

1. an active free-only OpenCode configuration violates the runtime admission policy;
2. three autopilot completion tests crash because their fixture omits `deps.store`;
3. a verified GitHub repair follow-up becomes `blocked` with only a generic `failed` detail.

All three passed the Quality Gate and received GitHub tracking objects: [#14](https://github.com/Reese-max/autodev-ng/issues/14), [#15](https://github.com/Reese-max/autodev-ng/issues/15), and research [#16](https://github.com/Reese-max/autodev-ng/issues/16). The existing umbrella [#13](https://github.com/Reese-max/autodev-ng/issues/13) was updated with exact logs and root mapping. No product source, workflow, PR, merge, deployment, secret, permission, or repository setting was changed.

CEO three-resource answer:

1. restore a single executable configuration/admission contract (#14);
2. restore trustworthy completion and repair-loop regression evidence (#15, #16);
3. expose precise state/recovery receipts before adding more engines or autonomy.

Do **not** add another model adapter, auto-merge, a cloud marketplace, or a second control plane while the full regression gate is red.

## Project Discovery

### Product and maturity

| Question | Assessment | Evidence class |
|---|---|---|
| Product type | Local-first, multi-project coding-agent orchestrator with CLI, Discord, web, supervisor, GitHub intake/repair, GOAL autopilot, verification and receipts | CONFIRMED — README and source tree |
| Target users | Owner-operators and advanced maintainers coordinating multiple repositories and model/tool backends | CONFIRMED for intended positioning; real adoption UNKNOWN |
| Core job | Turn authorized backlog/Issue work into isolated, verified, reviewable candidates while preserving cost and safety controls | CONFIRMED — README, `src/github/*`, scheduler/verifier contracts |
| Maturity | High-complexity private alpha/operations tool; broad feature surface, substantial tests, but current blocking CI regression | LIKELY from repository; release readiness NOT CONFIRMED |
| Primary value | Engine portability plus evidence-gated autonomy and explicit human merge | CONFIRMED in code/docs |
| Largest weakness | Configuration, test-fixture and repair-state contracts have drifted across layers, breaking the release gate | CONFIRMED by Actions log |

### Repository and coordination evidence

- Default branch inspected at `42fbd918e3d3bd664eeec239b900e1a87ecf7b85`.
- Open PRs immediately before write: **0**.
- Branches named `github-13`, `github-14`, `github-15`, or `github-16`: **0**. Historical branches exist, including `autodev/issue-7`; they were not touched.
- Issue comments were read before claiming; #13–#16 contained no competing unexpired lock. The product-board lock was written and read back on all four Issues.
- Tracked GitHub search found implementation/docs for `scan`, `sync`, `run`, `status`, `owner-sync`, `owner-run`, and `owner-status`, but host `dataDir/status.json`, heartbeats, locks and GOAL runtime state are untracked and unavailable through the connected GitHub surface. Therefore live fleet/daemon state is UNKNOWN.
- Current head has no workflow/status receipt available through the connector. The newest usable execution evidence remains run 34469734636; the report does not call current `main` green.

### Confirmed CI reproduction

Run 34469734636 / job `102846569277`:

- `npm ci`: PASS
- `npm run typecheck`: PASS
- `npm run test:flaky-regression`: FAIL
- retained GitHub regression tests: SKIPPED after the blocking failure
- 201 test files: 3 failed, 198 passed
- 1,977 tests: 5 failed, 1,972 passed
- duration: 615.39 seconds

Failures:

- `tests/autopilot-completion.test.ts`: three `TypeError` failures at `src/autopilot/session.ts:113`, reading `deps.store.read()` from a fixture without `store`.
- `tests/cli.test.ts`: active-config registry construction throws `free-policy: explicit openrouter/provider/model:free and controlled CLI arguments required`.
- `tests/github-repair.test.ts`: expected `4: published`, received `4: blocked`; the stored detail exposed to the assertion is only `failed`.

## Competitive Intelligence

Sources were checked on 2026-09-11. Product capability claims come from official documentation:

- [OpenAI Codex app](https://openai.com/index/introducing-the-codex-app/) — parallel threads, isolated worktrees, reviewable diffs, skills, automations, configurable sandboxing; published 2026-02-02 and updated for Windows 2026-03-04.
- [GitHub Copilot cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent) — repository research/planning, Actions-powered ephemeral environment, branch/PR workflow, logs, custom agents/hooks/skills; checked 2026-09-11.
- [Jules task/repository management](https://jules.google/docs/tasks-repos) and [Jules CLI](https://jules.google/docs/cli/reference/) — per-task VM/logs, parallel tasks, pause/resume, remote sessions and diff review; checked 2026-09-11.
- [OpenHands Docker sandbox](https://docs.openhands.dev/openhands/usage/sandboxes/docker) — local/self-hosted open-source option emphasizing isolation and reproducibility; checked 2026-09-11.

### Capability matrix

| Dimension | autodev-ng | Codex | Copilot cloud agent | Jules | OpenHands | Strategic classification |
|---|---|---|---|---|---|---|
| Target user | Single owner / advanced fleet operator | Individual/team knowledge workers | GitHub developers/teams | GitHub developers | Developers/self-hosters | DIFFERENTIATOR: owner-operated fleet |
| Value proposition | Heterogeneous engines + local policy + evidence receipts | Capable multi-agent work command center | Native GitHub delegation | Managed remote coding tasks | Open/self-hosted agent runtime | SHOULD BE BETTER: trustworthy local operations |
| Onboarding | Config-heavy, Windows-oriented | App/CLI/IDE account flow | GitHub-native assignment | Google/GitHub remote setup | Docker/self-host setup | MUST MATCH: valid, actionable preflight |
| Isolation | Worktrees, locks, engine-specific boundaries | Native sandbox + worktrees | Per-task Actions environment | Per-task VM | Docker/remote/process sandboxes | MUST MATCH; prove, do not merely document |
| Parallelism | Risk/ownership-gated local lanes | Multiple agents/threads | Multiple tasks; one branch/PR per task | Multiple tasks/parallel sessions | Multi-sandbox | SHOULD BE BETTER: review-pressure-aware WIP |
| Verification | CI, reviewer, regression, acceptance, receipts | Reviewable diff and user validation | Tests/linters/logs/PR | Tests, plan, task logs | Configurable runtime/testing | DIFFERENTIATOR, currently impaired by red CI |
| Human control | CLI/Discord/Web, pause/resume, human merge | Thread steering/review | Comments, agents panel, review | pause/resume, plan approval | UI/CLI | MUST MATCH: precise state and recovery reason |
| Engine portability | Many adapters and routing policies | OpenAI models | Supported Copilot models | Gemini stack | Broad model/provider configs | DIFFERENTIATOR; stop adding breadth now |
| Cost control | Per-engine accounting, caps, free-only policy | Subscription/credits | Actions + AI credits | Plan limits | Operator-selected provider | SHOULD BE BETTER: executable policy/config contract |
| Integrations/API | GitHub, Discord, Web, supervisor | Skills/apps/CLI | GitHub, MCP, hooks, external integrations | CLI/GitHub | APIs/plugins/sandboxes | DO NOT COPY enterprise integration breadth |
| Mobile | Discord remote control | Cross-device product surfaces | GitHub/integrations | Web task controls | Not core | LATER; no native app |
| Reliability | Extensive suite, current CI red | Managed vendor runtime | Managed GitHub environment | Managed per-task VM | Operator-managed | NOW: restore blocking gates |
| Security/privacy | Local-first, locks, secret refs, human merge | Configurable sandbox | Ephemeral Actions and policy | Authorized repos/VMs | Docker/self-host options | MUST MATCH: deny by default with evidence |
| Pricing | Self-operated + provider costs | Subscription/credits | Paid plans + Actions/credits | Google plan limits | Open source + infra/provider cost | DIFFERENTIATOR only if free-only claims are true |
| Distribution/community | Private repository | Closed commercial | Closed GitHub product | Closed managed product | Open source/community | DO NOT COPY marketplace/community scope yet |
| Documentation | Extensive, complex | Polished product docs | Extensive GitHub docs | Product docs/CLI refs | Open docs | SIMPLIFY: task-oriented operator contract |

### Competitive gaps

- **MUST MATCH:** an accepted configuration must be executable in the supported environment; current #14 fails this.
- **MUST MATCH:** blocking verification must reach its intended safety assertions; current #15 does not.
- **SHOULD BE BETTER:** a blocked repair must name its first failing gate and safe recovery path; #16 currently exposes only `failed`.
- **DIFFERENTIATOR:** keep exact commit-bound verification, independent review, cost policy, issue fingerprinting and human merge.
- **DO NOT COPY:** cloud-only UI polish, enterprise policy breadth, marketplace distribution, native mobile, or vendor-specific pricing models without owner demand.

## Virtual Executive Board

| Role | Question / opportunity | Priority | Cross-review |
|---|---|---|---|
| CEO | Is engine breadth producing more value than operational confidence? | Stop breadth; restore contracts | Three resources go to #14–#16; no auto-merge |
| CPO | Can an operator understand why a job stopped and what to do next? | Specific state/recovery UX | #16 is product trust, not only logging |
| CTO | Where did contracts drift across schema, constructor, fixture and state machine? | One source of truth | Typed factories and policy validation before runtime |
| Staff/Principal Engineer | Can invariants be expressed once and reused by config validation and runtime? | Remove duplicated admission assumptions | Avoid broad rewrite; pin narrow invariants |
| UX Lead | Does `failed` help the operator recover? | Actionable terminal states | Present first failing gate, evidence and next safe action |
| UX Researcher | Which control surface is truly used under failure? | Instrument before redesign | UNKNOWN; do not infer from synthetic personas |
| Growth Lead | Is distribution the bottleneck? | No | Reliability and trust dominate acquisition features |
| CFO/Business Analyst | Is “free-only” economically enforceable? | Keep fail-closed; verify provider/model | Never loosen policy to make CI green |
| Security/Privacy Lead | Do recovery changes preserve approval, ancestry, fingerprint and human merge? | Non-negotiable | #16 research must prove no bypass |
| QA Lead | Are critical tests failing at their intended assertion? | Restore target and full-suite gates | #15 must run isolated and twice in suite |
| SRE Lead | Is current head healthy? | UNKNOWN until a receipt exists | Require two consecutive green Actions runs |
| Accessibility Specialist | Are CLI/web/Discord states perceivable and operable? | Runtime audit later | No accessibility defect claimed without testing |
| Customer Support Lead | Can support resolve config failures without reading source? | File/engine/rule diagnostics | Never print secret values |

Minority opinions retained:

- Retire a stale configuration rather than adding compatibility code.
- If safe same-PR revision is too complex, explicitly require a new human-authorized Issue instead of silently blocking.
- Do not rebuild the test framework; a typed minimal fixture may be enough.

## 50 Synthetic Personas

Thirty baseline personas (60%) preserve regression continuity; twenty rotating personas (40%) explore new failure modes. Every row is a synthetic journey, not a real user result.

| ID | Segment/background | Goal & expectation | Task / journey | Friction | Result / comment | Sev. | Suggestion |
|---|---|---|---|---|---|---|---|
| B01 | Owner, Windows, expert | Start fleet safely | Load active configs → status | note-filler default rejected late | FAIL; tracked config is not runnable | P1 | Preflight all active configs |
| B02 | First-time maintainer | Understand safe start | README → install → help | many modes/configs | PARTIAL; docs exist but cognitive load high | P2 | One golden-path config |
| B03 | CI maintainer | Trust release gate | Inspect Actions → failed step | umbrella Issue lacked specs before log retrieval | PARTIAL | P2 | Preserve exact failed specs |
| B04 | Cost-sensitive operator | Guarantee free-only | Select free route → run | provider namespace violates policy | FAIL; correct fail-closed, wrong config | P1 | Align config and admission |
| B05 | Security reviewer | No implicit paid egress | Audit model/args | policy is strict but distributed | PARTIAL | P1 | Shared validator and receipt |
| B06 | Autopilot user | Verified completion only | Goal → supplement reject | fixture crashes before safety assertion | FAIL (test evidence) | P2 | Complete typed fixture |
| B07 | QA engineer | Reproduce CI locally | Run target completion tests | undefined store | FAIL, diagnostic is precise | P2 | Minimal faithful store |
| B08 | PR reviewer | Request follow-up fix | Feedback → queued revision | second run becomes blocked | FAIL | P2 | First-gate transition receipt |
| B09 | Recovery operator | Resume safely | Inspect state detail | detail only says `failed` | FAIL | P2 | Specific safe recovery action |
| B10 | Portfolio owner | Avoid duplicate work | Issue → fingerprint → branch | locks and fingerprints exist | SUCCESS statically | P3 | Keep current boundary |
| B11 | Offline operator | Run without cloud control plane | CLI/local data | many providers still external | PARTIAL | P3 | Clearly mark offline-capable paths |
| B12 | Low-bandwidth user | Monitor via text | Discord status | runtime not available in audit | UNKNOWN | P3 | Measure actual delivery reliability |
| B13 | Keyboard-only operator | Use Web control | Open dashboard → controls | no runtime accessibility test | UNKNOWN | P2 | Later keyboard/AT verification |
| B14 | Screen-reader maintainer | Read failure reason | CI/CLI status | terse generic detail in repair path | LIKELY friction | P2 | Structured and announced state |
| B15 | New Node maintainer | Build on supported stack | Node 22 → npm ci | installation passes in CI | SUCCESS | P3 | Retain pinned environment |
| B16 | Test author | Add dependency safely | Extend Deps → compile fixtures | force-cast hid missing store | FAIL | P2 | Typed test factory |
| B17 | Engine integrator | Add adapter without breaking fleet | Registry → config matrix | breadth increases drift risk | PARTIAL | P2 | Admission contract tests first |
| B18 | Free-model operator | Swap rotating free model | Edit config → preflight | model lifecycle volatile | LIKELY | P2 | Explicit verified model registry |
| B19 | Finance owner | Review daily cost | Status → receipts | repository evidence only | UNKNOWN runtime | P2 | Commit-bound cost receipt |
| B20 | Incident responder | Locate regression | Actions → job log | exact specs retrievable | SUCCESS after investigation | P2 | Surface automatically |
| B21 | Privacy reviewer | Ensure no secrets in diagnostics | Trigger config error | desired detail could leak values | RISK | P1 | Print field/rule, never secret |
| B22 | Solo developer | Delegate small fix | Issue → agent → PR | core loop test red | FAIL release confidence | P1 | Restore gate before use |
| B23 | Multi-repo maintainer | Run one issue per repo | owner-run → child runner | host state unobservable here | UNKNOWN | P2 | Export sanitized status receipt |
| B24 | Reviewer on mobile | Check progress | GitHub Issue comments | issue mapping is reviewable | SUCCESS | P3 | Keep URLs/receipts concise |
| B25 | Windows-only admin | Diagnose process failures | CI/host scripts | CI matches supported OS | SUCCESS baseline | P3 | Preserve Windows gate |
| B26 | Cross-platform contributor | Run tests on Linux/macOS | local suite | official gate is Windows-centric | UNKNOWN | P3 | Document supported matrix, do not overpromise |
| B27 | Reliability lead | Demand two green runs | Fix → CI twice | zero post-fix runs | FAIL acceptance | P2 | Keep two-run criterion |
| B28 | Compliance reviewer | Trace artifact to authorization | Issue → fingerprint → commit | design exists | SUCCESS statically | P2 | Preserve immutable mapping |
| B29 | Support engineer | Explain blocked state | Read state history | generic `failed` insufficient | FAIL | P2 | State, gate, evidence, next action |
| B30 | Product manager | Prioritize roadmap | Compare defects vs features | many feature ideas compete | PARTIAL | P2 | Reliability-first roadmap |
| X31 | Rotating: adversarial issue author | Forge control tags | Issue body → backlog encoding | code encodes `<` and `[` | SUCCESS statically | P1 | Retain regression |
| X32 | Rotating: branch competitor | Race same Issue | Existing branch/PR → runner | no github-14/15/16 branch found | SUCCESS this audit | P1 | Recheck immediately before work |
| X33 | Rotating: stale lock owner | Reclaim expired work | Read comments/heartbeat | host heartbeat unavailable | UNKNOWN | P2 | Cross-surface lease receipt |
| X34 | Rotating: provider outage | Preserve no-charge state | Preflight fails | free model status volatile | LIKELY | P2 | Quarantine + alternative with receipt |
| X35 | Rotating: model rename | Update free route | Config change → validation | tracked config can drift | FAIL current contract | P1 | Versioned provider capability |
| X36 | Rotating: reviewer edits PR | Preserve reviewer work | Follow-up push | ancestry/head checks exist | SUCCESS design, failing E2E | P2 | Diagnose #16 without force push |
| X37 | Rotating: slow test suite | Distinguish timeout vs assertion | Full suite twice | run took 615s but returned assertions | SUCCESS diagnosis | P2 | Preserve structured summaries |
| X38 | Rotating: flaky Windows FS | Repeat suite | Round 1/2 | current job exits on first failed round | PARTIAL | P2 | Record round and fixture state |
| X39 | Rotating: disk-constrained host | Run many worktrees | claim → checkout → evidence | runtime capacity unknown | UNKNOWN | P2 | Measure before new cleanup features |
| X40 | Rotating: non-technical owner | Accept candidate | GitHub → review → merge | product assumes expert operations | LIKELY | P2 | Narrow owner-facing decision memo |
| X41 | Rotating: audit-model unavailable | Prevent false achieved | supplement exception | intended test currently crashes earlier | FAIL evidence | P1 | Fix fixture and retain fail-closed outcome |
| X42 | Rotating: learning store unavailable | Preserve task result | reflection throws | intended assertion not reached | FAIL evidence | P2 | Restore test path |
| X43 | Rotating: pending review | Avoid duplicate discovery | session start → store read | new check lacks direct fixture coverage | RISK | P2 | Add pending-review regression |
| X44 | Rotating: config retired | Exclude safely | rename `.retired` → fleet test | convention exists | SUCCESS design | P3 | Document lifecycle state |
| X45 | Rotating: unknown paid route | Enforce budget | missing proof → run | policy blocks by design | SUCCESS principle | P1 | Keep fail-closed |
| X46 | Rotating: open-source self-hoster | Compare OpenHands | Docker setup → agent | autodev has richer policy but harder setup | SWITCH risk | P2 | Simplify golden path |
| X47 | Rotating: GitHub-native team | Compare Copilot | Assign Issue → Actions → PR | Copilot has lower onboarding friction | SWITCH risk | P2 | Compete on evidence/portability, not UI breadth |
| X48 | Rotating: cloud parallel user | Compare Jules/Codex | launch multiple tasks | managed products provide clearer task surfaces | SWITCH risk | P2 | Improve status/recovery semantics |
| X49 | Rotating: accessibility specialist | Review web/Discord | keyboard/AT journey | no runtime evidence | UNKNOWN | P2 | Separate accessibility study later |
| X50 | Rotating: deletion-first architect | Reduce surface | inspect adapters/configs/modes | unsupported/stale active config costs trust | OPPORTUNITY | P1 | Retire before adding |

## Competitor Switching Test

Synthetic scenario choices across the same 50 personas:

| Choice | Personas | Synthetic preference share | Primary reason |
|---|---:|---:|---|
| `autodev-ng` | 15 | 30% | local ownership, heterogeneous engines, evidence/merge controls |
| GitHub Copilot cloud agent | 11 | 22% | lowest-friction GitHub-native delegation and visible PR flow |
| Codex | 10 | 20% | capable parallel agents, worktrees, review surface and skills |
| Jules | 7 | 14% | managed per-task VMs, logs, pause/resume and remote CLI |
| OpenHands | 5 | 10% | open/self-hosted Docker isolation |
| Manual scripts | 2 | 4% | minimal surface and predictable local control |

This is a simulation, not market share or survey data. `autodev-ng` wins among expert owner-operators; it loses newcomers and teams that value managed setup/status over engine portability.

## Red Team

- **Selection bias:** personas overweight the repository's intended expert operators; preference share likely overstates broader-market appeal.
- **Competitor mismatch:** Codex, Copilot and Jules are managed products; OpenHands is a closer self-hosted substitute. Matrix differences partly reflect category, not execution quality.
- **CI-to-runtime leap:** failing tests prove a red release gate, not necessarily a live daemon outage. The report keeps runtime UNKNOWN.
- **Over-engineering risk:** centralizing every contract into a new framework could create more drift. Prefer narrow typed factories and shared validators.
- **Feature bloat:** another adapter, native app, marketplace, enterprise RBAC or auto-merge would increase failure surface before trust recovers.
- **Confirmation bias:** strict policies are valuable only if active configs can satisfy them; a fail-closed rule plus an impossible config is not a successful user outcome.
- **Simplification alternative:** retire obsolete configs/engines and explicitly disallow follow-up revision if safe support is not worth its complexity.
- **Do not copy:** managed vendors' breadth, pricing, UI or cloud topology is not automatically appropriate for a local owner-operated tool.

## Findings and Quality Gate

| ID | Finding | Type / priority | Evidence | Distinct / actionable / AC | Mapping |
|---|---|---|---|---|---|
| F1 | Active free-only OpenCode config is rejected by current admission policy | BUG / RELIABILITY / P1 | CI + config + registry + constructor, HIGH | PASS / PASS / explicit | NEW [#14](https://github.com/Reese-max/autodev-ng/issues/14) |
| F2 | Completion fixture omits `store`, disabling three safety assertions | RELIABILITY / TECH_DEBT / P2 | CI + source + test fixture, HIGH | PASS / PASS / explicit | NEW [#15](https://github.com/Reese-max/autodev-ng/issues/15) |
| F3 | Verified repair follow-up becomes opaque `blocked` | RESEARCH_REQUIRED / RELIABILITY / P2 | E2E CI, root LOW | PASS / research-actionable / exit criteria | RESEARCH [#16](https://github.com/Reese-max/autodev-ng/issues/16) |

Existing #13 is the regression umbrella, not a fourth root finding. It was updated with the exact job log and mappings. Quality Gate mapping completeness: **3/3 PASS**.

Scoring scale 1–5 (higher effort is harder):

| ID | User impact | Strategic value | Competitive gap | Risk reduction | Confidence | Effort |
|---|---:|---:|---:|---:|---:|---:|
| F1 | 5 | 5 | 4 | 5 | 5 | 2 |
| F2 | 3 | 4 | 3 | 4 | 5 | 1 |
| F3 | 4 | 5 | 4 | 5 | 3 | 3 |

## Rejected Findings

1. “Current production fleet is down” — rejected: host runtime status unavailable.
2. “The full suite merely timed out” — rejected: the job returned five explicit assertion/errors.
3. “Loosen free-only policy to accept the current model” — rejected: violates cost-safety intent without proof.
4. “Rewrite the entire test harness” — rejected: minimal typed fixture can satisfy F2.
5. “Auto-retry/force-push the blocked repair” — rejected: risks reviewer edits and evidence integrity.
6. “Auto-merge after green CI” — rejected: human merge is a deliberate boundary.
7. “Add another engine/provider now” — rejected: feature bloat while contracts are red.
8. “Build a native mobile app” — rejected: Discord/GitHub surfaces exist; no demand evidence.
9. “Copy Copilot/Jules cloud environment wholesale” — rejected: category mismatch and operating cost.
10. “Claim an accessibility defect” — rejected: no keyboard/screen-reader runtime test.
11. “Close #13 because exact specs were found” — rejected: fixes and two green runs are absent.
12. “Create new Issues for already tracked secrets, steering or egress work” — rejected as duplicate of #3/#6, #11 and #12.

## Duplicate Avoided

- Generic red-CI umbrella retained in #13; no duplicate umbrella Issue.
- Secret exposure/remediation remains #3/#6.
- In-flight steer versus next-turn queue remains #11.
- Egress firewall research remains #12.
- CLI help/onboarding remains #4.
- Exact failure rows were grouped by root, not by five persona symptoms.
- No separate Issue for “current head has no receipt”; it is a verification limitation within #13.
- No separate Issue for Actions deprecation warning; no evidence it caused the failure.

## Roadmap

### NOW — REMOVE / SIMPLIFY / FIX

1. #14: align or retire the active free-only config while preserving fail-closed admission.
2. #15: restore typed completion fixtures and pending-review coverage.
3. #16: identify the first failing repair revision gate and make the stop recoverable.
4. Keep #13 open until the above roots are resolved and two consecutive current/recent CI runs pass.

### NEXT — IMPROVE

- Emit sanitized config preflight receipts naming file, engine tag, model identity and violated rule.
- Export sanitized owner/fleet status receipts so external audits can distinguish host state from repository state.
- Measure review pressure and blocked-state recovery time before changing concurrency.

### LATER — ADD only with evidence

- Cross-platform CI matrix if non-Windows contributors become an actual target.
- Accessibility study of Web and Discord control surfaces.
- Review-capacity/WIP backpressure after telemetry proves queue pressure.

### DON'T

- More adapters before the active-config matrix is green.
- Auto-merge or bypass of reviewer/ancestry/fingerprint/acceptance gates.
- Enterprise marketplace/RBAC, native mobile, or managed cloud parity.
- Treat synthetic preference share as demand evidence.

## Regression

| Tracker | Status | Evidence |
|---|---|---|
| #13 Windows full regression | STILL REPRODUCIBLE on latest available failing run | Run 34469734636; no newer head receipt |
| #14 config/admission | NEW / CONFIRMED | failing active-config test and current source/config |
| #15 completion fixture | NEW / CONFIRMED | three exact TypeErrors |
| #16 repair follow-up | NEW RESEARCH / CONFIRMED symptom | exact E2E assertion; first failing gate unknown |
| Verified fixed | 0 | no acceptance criteria plus two green runs |

Runtime pending:

- host `owner-status`, daemon heartbeat, locks and affected note-filler runtime;
- post-fix Windows CI twice;
- a live-but-synthetic repair follow-up against an isolated test repository only if separately authorized;
- Web/Discord usability and accessibility.

## Difference From Previous Round

Previous #13 evidence knew the failing workflow step but not the exact specs. This round retrieved the job log, identified five failing tests across three independent roots, created three root tracking objects, and updated #13. It did not claim a current production outage or a fix.

## Decision Memo

- **What this product should become:** the dependable local control plane for Reese-max's coding-agent portfolio, with exact authorization, cost, isolation, verification and delivery receipts.
- **Who it should serve:** one advanced owner/operator first; later, maintainers who accept an explicit local operations model.
- **Why users would choose it:** engine independence, self-hosted control, portfolio orchestration, strict verification and human merge.
- **Why users choose competitors:** easier setup, managed environments, clearer task status, polished review surfaces and less operational burden.
- **Biggest competitive gaps:** runnable configuration contract, precise blocked-state recovery, consistently green regression evidence.
- **Potential moat:** cross-engine policy and commit-bound evidence rather than model quality alone.
- **Top strategic/engineering/UX priorities:** #14, #15, #16; then sanitized status receipts.
- **What NOT to build:** new adapters, cloud marketplace, auto-merge, native app, broad enterprise features.
- **Features worth removing:** retire inactive/incompatible configs and engine variants; remove unsafe partial dependency casts in critical fixtures.
- **Biggest risks:** silent policy/config drift, opaque state transitions, false confidence from broad but red tests, and operator overload.
- **Next experiments:** time-box #16 instrumentation; run #15 isolated and in two full rounds; validate #14 against a synthetic no-secret preflight; measure operator time-to-recovery from a blocked state.
- **Decision:** **INVEST / SIMPLIFY**. The strategic fit is high, but reliability—not feature breadth—is the investment gate.

## Portfolio CEO Review

This round deeply re-audited only `autodev-ng`; other repository rankings reuse existing portfolio evidence and are not fresh runtime verdicts.

| Portfolio layer | Recommendation |
|---|---|
| Agent orchestration | Keep `autodev-ng` as the single scheduler/verification/delivery control plane |
| AI gateway | Reuse `cf-ai-router` only through an explicit cost/egress contract; do not embed routing again in each product |
| Skills | Let `skill-foundry` certify/promote skills and `herdr-skills` supply candidates; avoid a second skill registry in autodev-ng |
| Memory | Clarify boundary between `adng-memory` and built-in lessons/ROI before adding another store |
| MCP | Treat `cf-mcp-server` as an integration boundary, not a duplicate orchestration plane |
| Product repos | Keep one Issue/branch/PR ownership lease and one human merge boundary across workers |

Portfolio ranking by current strategic leverage (not a new full audit):

1. `autodev-ng` — INVEST / SIMPLIFY; highest portfolio leverage, currently gate-red.
2. `police-exam-archive` — INVEST; strongest domain/data asset, continue evidence quality.
3. `taiwan-intel-dashboard` — INVEST after reliability/operational truth fixes.
4. `cf-ai-router` — MAINTAIN / RESEARCH; useful shared gateway if cost policy stays explicit.
5. `skill-foundry` + `herdr-skills` — clarify merge/composition boundary before expansion.

## Mandatory Verification

- Total Findings: **3**
- New Issues Created: **3** — `autodev-ng` #14, #15, #16
- Updated Existing Issues: **1** — #13
- Reopened Issues: **0**
- Research Issues: **1** — #16
- Duplicate Avoided: **8** groups
- Issue Write Blocked: **0**
- Rejected Findings: **12**, with reasons above
- Verified Fixed: **0**
- Priority distribution: **P0 0 / P1 1 / P2 2 / P3 0 / STRATEGIC 0**
- Highest Priority: **#14**, then #15 and #16
- SKIPPED_LOCKED: **0 for #13–#16**; all four locks were written and read back, with no competing marker or matching issue branch/PR
- Quality Gate mapping: **3/3 PASS** — every accepted root finding maps to NEW or RESEARCH; #13 is the updated regression umbrella

