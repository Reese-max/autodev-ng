# External Competitive / New-Product / Workflow Radar — 2026-09-17T16:02:21Z

## Status

- Focus cursor: `Reese-max/lobsterpulse`.
- Next fair cursor: `Reese-max/ai-flight-radar`.
- Issue Quality v2 blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Current focal default branch / HEAD: `main@ced78980b1e687313b146155e83e7ab51f358b35`.
- Fresh owner pagination: **40 Reese-max-owned repositories; 39 unarchived**. A second page at offset 100 returned empty. `obsidian-vault` is archived and excluded from active product scope. This count is treated as connector-visible inventory for this run, not proof that older inventory differences mean repositories were created/deleted.
- Write scope: this report only. **0 new Issues, 0 Issue updates, 0 PR comments.** No product source/CI/config/secrets/settings change, implementation branch, merge, deploy, worker/GOAL start, paid request, or production-data write.
- Runtime: no Codex/Claude/Gemini provider process or packaged LobsterPulse app was executed. Current runtime gaps remain `NEEDS_RUNTIME_VERIFICATION` where applicable.
- This radar does not declare the portfolio CLEAN.

## Product direction / scope re-read

Latest Product Board direction remains **INVEST / SIMPLIFY**. LobsterPulse is a local desktop observability utility for a solo/power developer running several AI coding CLIs and Reese-max/OpenAB agents. Its core job is to show truthful live state — working, waiting, stale/unknown, failed/completed, quota/status context — without repeatedly switching terminals.

The board explicitly says to finish truthful runtime/distribution/provider/metrics contracts before adding breadth. Cloud accounts, mobile/team collaboration, billing, an IDE extension, broad agent orchestration, another observability dashboard, and a provider-count race remain non-goals.

Current HEAD is still audit/docs-only on top of the merged Codex hook remediation. The relevant product path in `src-tauri/src/hooks_configurator.rs` still installs provider-specific hooks and, for Codex, edits `~/.codex/config.toml` plus `~/.codex/hooks.json`.

Existing scopes remain important:

- #3: Codex hook enablement source fix is merged, but packaged/runtime acceptance remains open.
- #5 / PR #7 and PR #13: provider/K0 truth.
- #6 / PR #8: truthful acquisition/install path.
- #9 / PR #10: decision-only attention queue research.
- #11: expired Prometheus counter migration.
- #12: provider-native OTel simplification research; a 2026-09-16 experiment ended **NARROW** because Claude OTel did not provide an equivalent live `PermissionRequest` start signal for WAITING-state truth.

## Product → market category

| Product | Market category | Direct / adjacent references | Transferable workflow | Do not copy |
|---|---|---|---|---|
| LobsterPulse | local cross-provider coding-agent status / attention monitor | Agent Watch, VS Code/Copilot agent session surfaces, AgentHUD, abtop | hybrid ingestion, read-only session discovery, explicit waiting/attention state, source lifecycle hygiene | cloud control room, mobile remote terminal, enterprise RBAC/billing, IDE-extension race, generic orchestrator |

## External Signals

### A. CONFIRMED — current Codex config names `features.hooks`; LobsterPulse still writes the deprecated alias

**Checked:** 2026-09-17 UTC.  
**First-party sources:**
- https://developers.openai.com/codex/config-reference/
- https://developers.openai.com/codex/config-advanced/
- https://developers.openai.com/codex/changelog/

OpenAI's current Codex Configuration Reference states:

- `features.hooks` enables lifecycle hooks loaded from `hooks.json` or inline `[hooks]` configuration.
- `features.codex_hooks` is a **deprecated alias**.

The current Advanced Configuration still documents `~/.codex/hooks.json` as a valid user-level hooks location. The Codex changelog records Hooks general availability on **2026-05-14**.

Repository evidence on `main@ced78980...`:

- `enable_codex_hooks_feature()` reads and writes `[features].codex_hooks` only.
- if the alias is absent, LobsterPulse creates `features.codex_hooks = true`.
- the surrounding Codex hook JSON path remains the documented `~/.codex/hooks.json` path.

**Quality calibration:** this is not a current BUG under Issue Quality v2 because the provider documentation explicitly says the old key is still an alias. No present supported-flow failure was established. It is a source-confirmed **MAINTENANCE / lifecycle-drift signal**, best treated as `severity=P3`, `decision_priority=LOW-MEDIUM`, `triage=NEEDS_REVIEW`, `auto_implementation=false` if later tracked.

**Minimum future change if this path is touched:** prefer canonical `features.hooks`; safely recognize/migrate an existing boolean alias without duplicating conflicting keys or overwriting user-owned config. Do not create a Codex config registry, migration service, or broad compatibility framework for this alone.

**Why no Issue this run:** #3 is still the authoritative Codex enablement/runtime tracker and the alias remains supported. Expanding its P1 closure gate for a non-failing deprecation would mix severity and delay the non-substitutable packaged-runtime evidence. A separate P3 ticket would add tracking overhead without current task failure. Retain this in radar evidence and re-check if OpenAI announces alias removal or a runtime warning/error becomes observable.

### B. CONFIRMED — Agent Watch's current product reinforces hybrid ingestion, not a universal transport

**Checked:** 2026-09-17 UTC.  
**Source:** https://agent-watch.com/

Agent Watch currently positions itself as one dashboard for Claude Code, Codex and Gemini with live `running / idle / waiting` state, token/cost views, alerts, terminal access and session history. Current public pricing is a 7-day free trial (up to 3 agents), Basic **US$7/month**, and Annual **US$50/year**.

The important design evidence is ingestion heterogeneity:

- Claude: hook telemetry;
- Codex: session/completion events;
- Gemini: OTLP telemetry.

Its pages also show why marketing claims must be interpreted carefully: one section says “no agent modifications / zero config,” while feature/setup copy says the installer configures hooks and the supported-source section explicitly names Claude hook telemetry. This is capability/positioning evidence, not proof of lower setup risk.

**Transferable principle:** a truthful normalized state contract is more important than one universal ingestion mechanism. This supports #12's **NARROW** result rather than reopening an OTel-everywhere architecture.

### C. LIKELY / OPEN-SOURCE SIGNAL — read-only session-store monitors are becoming a real alternative ingestion pattern

**Checked:** 2026-09-17 UTC.  
Representative public sources:
- AgentHUD: https://github.com/neochoon/agenthud
- abtop overview (published 2026-06-11, updated 2026-07-07): https://dudarik.com/en/blog/abtop/

AgentHUD advertises a live TUI that reads on-disk session stores for Claude Code, Codex, Kiro and opencode, merges them into one project/session tree, and exposes human and NDJSON machine feeds. abtop similarly describes a read-only local monitor that discovers session/process/file state without API keys or a sidecar daemon.

This is a useful counterpoint after #12's OTel NARROW result: **“reduce config mutation” does not imply “replace hooks with OTel.”** A third option is read-only observation of provider-owned local state.

However, this does **not** pass the issue gate yet:

- the relevant file/session schemas are not established here as stable first-party public contracts for every provider;
- parsing local session stores may expose prompt/tool content, increasing privacy scope;
- no LobsterPulse fixture proves equivalent live WAITING/completion timing;
- schema churn could create more maintenance than current hooks;
- #12 already establishes that transport replacement must be evaluated against state truth, not architectural neatness.

Keep as `ADJACENT IDEA`: if future evidence shows recurring hook/config breakage, run one bounded, read-only provider fixture comparing session-store state vs current hook truth. Do not build a parser framework or scan arbitrary user directories.

### D. CONFIRMED — VS Code is absorbing more agent-session management into the IDE

**Recent releases:**
- VS Code 1.137 — **2026-09-09**: agent automations preview; GitHub issue/PR work in the Agents window.
- VS Code 1.138 — **2026-09-16**: agent sessions in Dev Containers and better organization of completed sessions.

Sources:
- https://code.visualstudio.com/updates/v1_137
- https://code.visualstudio.com/updates/v1_138

This continues the platform trend already seen in provider-native session/task surfaces: IDEs increasingly own session creation, steering, automation and work-item handling.

**Impact on LobsterPulse:** this strengthens, rather than overturns, the approved boundary. Competing as another IDE control surface would collide with a platform that already owns workspace context and PR/issue workflow. LobsterPulse should defend the out-of-band job the IDE cannot monopolize: a compact local cross-provider truth/attention surface spanning OpenAB and several CLIs.

No Issue is warranted because the owner direction already rejects the IDE-extension/orchestrator race, and #9 already owns attention compression.

## New Releases / current capability changes

| Date | Product | Change | LobsterPulse implication |
|---|---|---|---|
| 2026-09-16 | VS Code 1.138 | agents in Dev Containers; completed-session organization | Same-provider/session management is moving into the IDE; defend cross-provider out-of-band glanceability |
| 2026-09-09 | VS Code 1.137 | recurring agent automations; issues/PRs in Agents window | Do not expand LobsterPulse into task orchestration or IDE work management |
| checked 2026-09-17 | Codex docs | `features.hooks` canonical; `features.codex_hooks` deprecated alias | current LobsterPulse key is lifecycle debt, not yet a current failure |
| checked 2026-09-17 | Agent Watch | live cross-agent dashboard remains hybrid hook/event/OTLP | transport uniformity is not required for product truth |
| checked 2026-09-17 | AgentHUD / abtop | read-only local session/process-store monitoring pattern | possible future simplification experiment; stability/privacy unproven |

## Community Pain

No community-only anecdote passed the Issue gate. Current actionable product decisions are better supported by first-party Codex/VS Code documentation, current repository source, and existing #12 experiment evidence.

No productivity percentage, adoption frequency, ROI, or “zero-config” effectiveness is inferred from vendor/community claims.

## Adjacent Ideas

1. **Canonical-key hygiene at config-mutation boundaries.** When upstream exposes a canonical replacement for a deprecated config key, prefer the canonical key on future writes and preserve existing user values during migration. Do not add a registry for one alias.
2. **Read-only observation before another mutation path.** If hook maintenance becomes a repeated current pain, compare one provider's session-store signals against current hooks before installing a second sidecar/config mechanism.
3. **State truth above transport.** Continue to treat `WORKING / WAITING / COMPLETED-or-ended / STALE / UNKNOWN` and freshness as the product contract; hook, event, OTLP, or local session-store ingestion can differ per provider.
4. **Stay outside the IDE control-room race.** IDE platforms increasingly own session steering and work-item automation; LobsterPulse's differentiated surface is the small, provider-agnostic local attention signal.

## Opportunity Map — LobsterPulse

### MUST MATCH

- Current canonical provider configuration names when LobsterPulse writes user-owned config.
- Preserve unrelated settings and fail closed on malformed/ambiguous config.
- Truthful `WAITING / WORKING / STALE / UNKNOWN / ENDED` semantics; do not infer success from silence.
- One obtainable/runtime-verifiable product path before broad adoption claims.
- Explicit freshness/provider capability truth.

### SHOULD BE BETTER

- Reduce custom config mutation only where an alternative source preserves equal-or-better state truth and privacy.
- Normalize above provider-specific transports rather than force hook/OTel/session-store uniformity.
- Keep attention surfaces outside the terminal/IDE and low-glance.

### DIFFERENTIATOR

- Local Windows/OpenAB + multiple coding CLI state in one Traditional-Chinese capsule.
- Cross-provider state vocabulary across otherwise siloed native products.
- Local metrics/evidence surfaces without requiring a cloud control plane.

### ADJACENT IDEA

- One-provider read-only session-store parity experiment, but only if new evidence shows current hook/config maintenance remains materially costly after #1/#3.
- Canonical Codex feature-key migration during a future approved touch of the same config boundary.

### DO NOT COPY

- VS Code/Copilot work-item orchestration, IDE extension or built-in terminal replacement.
- Agent Watch cloud/team/mobile control room, remote terminal, RBAC/billing.
- Universal OTel-only ingestion.
- Arbitrary home-directory/log scanning or content collection to avoid hooks.
- New databases/registries/daemons merely to unify provider transport.

## Four-gate decision review

### Candidate 1 — migrate deprecated `features.codex_hooks`

1. **Problem/value:** repository writes a source-confirmed deprecated alias, but upstream still supports it. No present task failure is established.
2. **Priority:** `MAINTENANCE`, provisional `P3`, LOW-MEDIUM decision priority. Not P1/P2; deprecation is not removal.
3. **Minimum:** when the config path is next legitimately touched, use `features.hooks` and preserve/migrate a valid alias safely. No registry/service.
4. **Issue gate:** **DEFER / CENTRAL REPORT ONLY** until alias removal, runtime warning/error, or another approved config change makes the migration necessary. Do not block #3's packaged-runtime verification on this maintenance item.

### Candidate 2 — local session-store observation as hook replacement

1. **Problem/value:** prior #1/#3 prove config mutation can be risky; #12 proved OTel does not replace live Claude WAITING state. Open-source monitors show another implementation pattern.
2. **Priority:** `RESEARCH / NOT_ESTABLISHED`; evidence is product/community implementation evidence, not a stable first-party schema/parity guarantee.
3. **Minimum:** if triggered by fresh recurring hook-maintenance evidence, one read-only provider fixture, explicit path allowlist, synthetic session, no prompt-content collection, state/timing comparison against existing hooks.
4. **Issue gate:** **REJECT AS NEW ISSUE THIS ROUND**. It is another solution candidate for the same simplification problem, with no new current user failure and material privacy/schema uncertainty.

### Candidate 3 — IDE-style agent control/session management

1. **Problem/value:** major platforms are adding it, but no current LobsterPulse user workflow requires an IDE control plane.
2. **Priority:** `OPPORTUNITY / NOT_ESTABLISHED`, strategic fit LOW under approved scope.
3. **Minimum:** no change; retain link-outs/context identifiers if already available rather than embed an editor/work-item manager.
4. **Issue gate:** **REJECT**. Owner direction and existing #9 attention research already cover the useful boundary.

## Issue / PR Mapping

| Signal | Existing mapping | Action this run |
|---|---|---|
| Codex canonical `features.hooks`, deprecated alias | #3 owns Codex enablement/runtime evidence; merged PR #4 introduced current structured alias handling | Central report only; do not inflate P1 closure with P3 maintenance |
| Reduce config mutation via provider-native sources | #12 completed NARROW for Claude OTel | No new issue; read-only session stores kept as adjacent alternative, not architecture approval |
| Human attention compression | #9 / PR #10 | No duplicate issue or scope change |
| Provider truth | #5 / PR #7 / PR #13 | No interference |
| Install truth | #6 / PR #8 | No interference |
| Metrics migration | #11 | No interference |

No valid current `github-issue-lock:v1` blocks a write because no Issue or shared mutable tracking object was modified this run. Historical #3/#12 leases inspected were released; no lock was taken because no issue write was necessary.

## Rejected Ideas

- **Open a P1/P2 “Codex hooks broken” issue for `codex_hooks` deprecation — REJECT.** Alias is explicitly still supported; no current failure.
- **Add the canonical-key migration as a blocking #3 acceptance criterion — REJECT.** It would conflate a current runtime-evidence gate with lower-severity lifecycle maintenance.
- **Build an auto-migrating provider config framework — REJECT.** One deprecated key does not justify a framework.
- **Replace hooks with local file parsing now — REJECT.** Open-source examples prove feasibility patterns, not stable provider contracts or equivalent live state; privacy/schema costs are unmeasured.
- **Reopen OTel-everywhere — REJECT.** #12 already produced NARROW evidence for the core live WAITING requirement.
- **Build an IDE / remote control / mobile terminal — REJECT by approved product direction.** Recent VS Code/Agent Watch changes make that competitive field more crowded, not more strategically attractive.

## Sources

### First-party / primary

- OpenAI Codex Configuration Reference, checked 2026-09-17: https://developers.openai.com/codex/config-reference/
- OpenAI Codex Advanced Configuration, checked 2026-09-17: https://developers.openai.com/codex/config-advanced/
- OpenAI Codex changelog; Hooks GA 2026-05-14: https://developers.openai.com/codex/changelog/
- VS Code 1.137, released 2026-09-09: https://code.visualstudio.com/updates/v1_137
- VS Code 1.138, released 2026-09-16: https://code.visualstudio.com/updates/v1_138
- Agent Watch current product/pricing/source descriptions, checked 2026-09-17: https://agent-watch.com/

### Secondary / community/open-source pattern evidence

- AgentHUD current public project page, checked 2026-09-17: https://github.com/neochoon/agenthud
- abtop article, published 2026-06-11 / updated 2026-07-07: https://dudarik.com/en/blog/abtop/

### Repository evidence

- `lobsterpulse` current HEAD: `ced78980b1e687313b146155e83e7ab51f358b35`.
- Product Board: `.github/quality-audits/2026-09-14-0410-product-board-audit.md`.
- Current config mutation path: `src-tauri/src/hooks_configurator.rs`.
- Existing runtime tracker: Issue #3 / merged PR #4.
- Existing attention tracker: Issue #9 / PR #10.
- Existing ingestion-simplification research: Issue #12 and its 2026-09-16 NARROW result.
- Previous LobsterPulse radar: `docs/competitive-intelligence/2026-09-15T200024Z-external-radar.md`.

## What Changed

1. Fresh full owner pagination is **40 owned / 39 unarchived** with an empty second page; inventory differences from older runs remain treated as connector visibility drift.
2. LobsterPulse product HEAD remains `ced78980...`; no new product-code commit changed the conclusions since the prior deep pass.
3. New first-party compatibility evidence shows the Codex key that LobsterPulse writes is now documented as a deprecated alias, while the canonical key is `features.hooks`.
4. The evidence is intentionally calibrated to P3 maintenance rather than inflated to a current defect because the alias remains supported.
5. #12 has since produced a NARROW result: Claude provider-native OTel does not replace live WAITING attention truth under the tested/documented event timing model.
6. Read-only session-store monitors provide a plausible alternative simplification pattern, but not enough first-party stability/privacy/parity evidence to justify a new Issue.
7. VS Code 1.137/1.138 continue moving agent automation/session management into the IDE. This reinforces the existing DO NOT COPY boundary rather than creating an IDE feature request.
8. No new issue, issue update, PR comment, runtime claim, CLEAN claim, implementation, merge or deploy was produced.

## Classification / scope calibration

- Codex deprecated alias: `MAINTENANCE / P3 (provisional) / SOURCE_CONFIRMED / LOW-MEDIUM decision priority / CENTRAL_REPORT_ONLY`.
- Session-store ingestion alternative: `RESEARCH / NOT_ESTABLISHED / COMMUNITY+OPEN_SOURCE_SIGNAL / NEEDS_EVIDENCE / no issue`.
- VS Code IDE-control expansion: `OPPORTUNITY / NOT_ESTABLISHED / strategic-fit LOW for LobsterPulse / REJECT under current scope`.
- Existing #12 remains `RESEARCH / NOT_ESTABLISHED` with a **NARROW** result; no implementation authorization follows from it.

## Completion / gaps / cursor

Completed:
- fresh owner pagination and unarchived filter;
- issue-quality blob verification;
- latest Product Board/default HEAD/README/config path review;
- existing Issues, PRs, branches and historical LobsterPulse radar review;
- historical lock/release check for the relevant Codex/OTel scopes;
- external direct-competitor, adjacent-workflow and recent platform-release exploration;
- four-gate issue review and dedupe.

Gaps retained honestly:
- no packaged LobsterPulse runtime this run;
- no current Codex warning/error was executed for deprecated alias usage;
- no provider session-store parity/privacy experiment;
- no real-user frequency/adoption/attention-time evidence;
- vendor statements are capability/positioning evidence, not independent outcome measurement.

**Next fair-rotation cursor: `Reese-max/ai-flight-radar`.** Re-check fresh inventory and recent radar history before treating this as authoritative scope in the next run.
