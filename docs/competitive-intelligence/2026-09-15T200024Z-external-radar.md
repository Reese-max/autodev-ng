# External Competitive / New-Product / Workflow Radar — 2026-09-15T20:00:24Z

## Scope, quality rules, and evidence boundary

- Owner scope: `Reese-max` only.
- Issue-quality rule: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality-rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh owner pagination completed: **42 owned repositories; 39 unarchived**. Archived repositories were not treated as active product scope.
- Fair-rotation target inherited from the previous radar: **`lobsterpulse`**.
- Current `lobsterpulse` default-branch HEAD observed: `ced78980b1e687313b146155e83e7ab51f358b35` (latest change is audit/docs; recent product-code baseline includes the Codex hook safety work merged through `e4a2333349fb3ca7892a1c7f576303fc968f3672`).
- Previous central radar: `docs/competitive-intelligence/2026-09-15T175655Z-external-radar.md`.
- No product source, CI/config, secrets, permissions/settings, implementation branch, merge, deploy, worker, GOAL, paid request, or production data was changed.
- No Claude/Codex/Gemini native-OTel runtime experiment was executed in this run. Any provider-native telemetry parity claim remains **NEEDS_RUNTIME_VERIFICATION**.
- This radar does **not** declare the portfolio CLEAN.

## Product direction re-read — LobsterPulse

`MISSION.md` remains the strategy anchor:

> **單一膠囊，統一監控所有 AI coding agent 的真實任務狀態。**

The intended user is a solo/power developer running several AI coding CLIs and Reese-max/OpenAB agents. The core job is to know which agent is working, waiting, idle/stale/dead, current token/quota context, and enough diagnostics to act — without repeatedly switching terminals.

Current non-goals remain important for this radar: no cloud dashboard/SaaS, no mobile/team product, no agent scheduling/routing/orchestration, no IDE-extension race, no provider-count arms race, and no replacement of the CLIs themselves.

The current local-CLI integration is materially invasive enough to deserve simplification research: `hooks_configurator.rs` installs LobsterPulse sidecar hooks by editing each supported provider's settings/configuration. Earlier Codex findings #1/#3 already demonstrated that this configuration-mutation class can produce real reliability/compatibility defects when merging, enabling, removing, or preserving existing user configuration.

LobsterPulse also already has its **own outbound OpenTelemetry path** (`src-tauri/src/telemetry.rs` and the `otel-genai-runtime-emit-2026-q3` work). Therefore this round does **not** propose another generic “add OTel” project. The new question is narrower and directionally opposite: can provider-native telemetry be consumed as an optional observation source so LobsterPulse can delete or reduce some custom hook/config mutation?

## Executive decision

**One new bounded research Issue was created:** `Reese-max/lobsterpulse#12` — **Validate provider-native OTel before expanding custom hook mutation**.

Classification:

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- `runtime=NEEDS_RUNTIME_VERIFICATION`

This is deliberately a **simplification test**, not permission to replace all hooks, build an OTLP collector service, add a telemetry database, or widen the UI.

The strongest external signal is not “OTel exists.” It is that multiple coding-agent providers now expose structured native telemetry, while a direct monitoring competitor uses a **hybrid source strategy** instead of pretending one transport fits every provider. That combination makes one-provider parity testing valuable and makes a portfolio-wide telemetry architecture unjustified.

## External Signals

### A. Direct competitor / platform update — native same-provider status is becoming an OS surface

**CONFIRMED — GitHub Copilot CLI v1.0.83, 2026-09-04. Checked 2026-09-15 UTC.**

Source:
- https://github.com/github/copilot-cli/releases/tag/v1.0.83

GitHub's release notes add Windows 11 taskbar visibility for running Copilot sessions, including live hover status cards. This attacks the same Job-to-be-Done as LobsterPulse at a provider-native level: “tell me whether my coding agent still needs attention without reopening the terminal.”

**Transferable product signal:** the value of a status surface is becoming commoditized inside individual providers. LobsterPulse should not compete by building a better Copilot-only card. Its defensible job is cross-provider truth in one local surface, with consistent `WORKING / WAITING / ENDED / STALE / UNKNOWN` semantics.

**Do not copy:** provider-specific management controls, Copilot-only assumptions, or a second Windows UI surface before the existing capsule/tray workflow is proven trustworthy.

### A2. Direct competitor — Agent Watch uses hybrid ingestion rather than one universal adapter

**CONFIRMED product capability / pricing; checked 2026-09-15 UTC.**

Source:
- https://agent-watch.com/

Agent Watch currently markets a unified coding-agent dashboard with live status, token/cost tracking, terminal access and notifications. Current public pricing checked this round is a 7-day trial, Basic at **US$7/month**, and Annual at **US$50/year**. Those prices are design signals only; no Reese-max willingness-to-pay or ROI is inferred.

More important than the dashboard is its source model. Its public supported-source description is hybrid: Claude uses hook telemetry, Codex uses session/completion events, and Gemini uses OTLP telemetry for token/cost/model information.

**Transferable principle:** normalize truth above provider-specific transports. A unified status contract does not require a unified ingestion mechanism.

**Counterevidence to overengineering:** this is direct evidence against immediately “replacing all hooks with OTel.” A current competitor operating in the same market still chooses different source mechanisms per provider.

### B. Adjacent user workflow — multi-session attention remains the actual pain, not telemetry transport itself

**COMMUNITY_SIGNAL — Agent Quest discussion, 2026-08-23.**

Representative discussion:
- https://www.reddit.com/r/vibecoding/comments/1vvzqes/

The discussion describes developers juggling multiple Claude/Codex sessions and valuing visible `working / waiting / finished / error` distinctions plus notifications/sounds. This is anecdotal evidence only; it is not an estimate of how common the problem is.

The relevance to LobsterPulse is narrow: if a new telemetry source cannot preserve attention-relevant state, lower integration maintenance is not enough to justify migration. “Native OTel exists” is not itself user value.

### C. Emerging technical capability — provider-native OpenTelemetry is now rich enough to test as an input

#### Claude Code

**CONFIRMED current first-party capability; checked 2026-09-15 UTC.**

Source:
- https://code.claude.com/docs/en/monitoring-usage

Claude Code can opt in to OTel metrics/logs/traces and exports standard session attributes including `session.id`. Current telemetry documentation includes agent/tool lifecycle events and, critically for LobsterPulse, a `claude_code.tool.blocked_on_user` span with timing and decision/source context. That is a concrete candidate signal for the product's `WAITING` state rather than an inferred heuristic.

Privacy boundaries matter: user prompt content and detailed tool arguments are not required for the minimum research path and must remain disabled; standard identity/session attributes still need inspection before any product decision.

**Why Claude is the first fixture:** the official schema exposes a directly relevant human-blocking state that can be compared against the current hook path. That makes a bounded parity test possible without designing a cross-provider framework.

#### Codex CLI

**CONFIRMED current first-party capability; checked 2026-09-15 UTC.**

Source:
- https://developers.openai.com/codex/config-file/config-advanced/

Codex supports an `[otel]` configuration with OTLP HTTP/gRPC exporters and emits structured events around conversations, API/SSE activity, prompts, tool decisions/results and related metrics. User-prompt logging is disabled by default in the documented configuration.

Important counter-signal: OTel configuration is machine-local rather than project-overridable. Native telemetry may therefore still require setup/config mutation. It cannot be called “zero config” or a guaranteed onboarding improvement until compared against the current LobsterPulse hook path.

#### Gemini CLI

**CONFIRMED current first-party capability; checked 2026-09-15 UTC.**

Source:
- https://google-gemini.github.io/gemini-cli/docs/cli/telemetry.html

Gemini CLI includes OpenTelemetry/OTLP support, session/tool/token telemetry and local-export patterns. Detailed tracing is opt-in, but prompt-content logging behavior must be configured carefully. Any LobsterPulse experiment must force content logging off and remain local-only.

**Cross-provider conclusion:** the three providers expose useful structured telemetry, but their event semantics, defaults, privacy surfaces and setup requirements differ enough that a universal adapter is not yet justified.

## New Releases / current capability changes

| Date / checked date | Product | Change | LobsterPulse implication |
|---|---|---|---|
| 2026-09-04 | GitHub Copilot CLI v1.0.83 | Windows 11 taskbar live session status cards | Same-provider glanceability is becoming native; compete on cross-provider truth |
| checked 2026-09-15 | Agent Watch | Unified monitor uses hybrid Claude hooks / Codex events / Gemini OTLP; current Basic US$7/mo, Annual US$50/yr | Do not force one ingestion transport |
| checked 2026-09-15 | Claude Code | Native OTel includes session/tool events and a blocked-on-user span | First bounded parity-test candidate |
| checked 2026-09-15 | Codex CLI | `[otel]` OTLP events/metrics with machine-local config | Native OTel may not reduce setup mutation; verify |
| checked 2026-09-15 | Gemini CLI | Native OTel/OTLP session/tool/token telemetry | Useful source, but prompt/privacy configuration must be explicit |
| 2026-08-30 | AgentLens | Extension listing advertises local OTel ingestion across several coding agents | **LIKELY/vendor signal** only; not independent effectiveness evidence |

## Community Pain

The strongest recent community item found this round is the 2026-08-23 Agent Quest discussion above. It supports the concrete user job — many simultaneous sessions become hard to distinguish and revisit — but does not establish adoption rate, productivity gain or a universal preference for notifications.

No new community evidence was strong enough to justify a separate Issue. In particular, “agent dashboard fatigue” anecdotes are already represented by #9's attention-queue research and should not be reposted into another feature ticket.

## Adjacent Ideas

### 1. Provider-native telemetry as a replaceable source adapter

Desired shape, if the research succeeds:

`provider-native signal -> thin source adapter -> existing LobsterPulse state semantics -> capsule / metrics / attention research`

not:

`provider-native signal -> new telemetry platform -> new database -> new dashboard -> new policy engine`.

The transport is implementation detail. The stable product contract is truthful state.

### 2. Hybrid transport is a feature, not architectural impurity

If Claude native traces can replace some hook events but Codex/Gemini cannot provide equally timely attention state, keeping mixed sources is acceptable. Product correctness should be measured per state field (`WAITING`, freshness, session identity, completion) rather than by transport uniformity.

### 3. OS-native status surfaces are adjacent, not a new priority

Copilot's Windows taskbar cards validate zero-switch monitoring, but LobsterPulse already has a compact capsule/tray and #9/PR #10 is actively researching attention compression. A new taskbar card Issue would be premature duplication unless a real user path shows the current surface causes extra switching.

## Opportunity Map — LobsterPulse

### MUST MATCH

- Truthful provider/session state with explicit `UNKNOWN / STALE / NOT_MONITORED` rather than inference from missing events.
- Preserve user-owned provider configuration when enabling/disabling monitoring.
- One truthful acquisition/runtime path before claiming broad desktop adoption.
- Privacy-safe local telemetry defaults; prompt/tool content must not become a monitoring prerequisite.
- Runtime evidence must distinguish “schema exists” from “the packaged app received the right event at the right time.”

### SHOULD BE BETTER

- Reduce custom configuration mutation where a provider already emits trustworthy structured state.
- Hide source-transport differences behind one stable status contract.
- Prefer local/native provider IDs and timestamps over reconstructed text heuristics where available.
- Keep attention surfaces compact and state-oriented instead of adding provider-specific dashboards.

### DIFFERENTIATOR

- Windows-first local cross-provider visibility across personalized OpenAB + local CLI workflows.
- One capsule/one state vocabulary across providers whose own native surfaces are siloed.
- Existing local Prometheus/OTel evidence surfaces without requiring a cloud account.
- Ability to combine provider truth with local attention policy without becoming an orchestrator.

### ADJACENT IDEA

- Thin optional provider-native source adapter, only after #12 proves one real provider path.
- Windows taskbar integration as a later surface experiment only if the capsule/tray still leaves measurable switching friction.

### DO NOT COPY

- Cloud/team remote terminal product.
- Mobile/SaaS/account sync.
- A universal OTel-only architecture.
- Auto-enable content-rich telemetry or identity collection.
- Provider-count competition.
- Another telemetry collector/database/registry merely because standards exist.
- Agent control/orchestration actions from the monitor.

## Four-gate decision — provider-native OTel input

### 1. Problem / value

**Observable repository problem:** monitoring currently edits provider configuration to install LobsterPulse hooks. #1/#3 prove this mutation class has already caused real compatibility/core-task risk on Codex. The current implementation still maintains provider-specific hook matrices for all four local CLIs.

**Counterevidence:** hooks provide rich attention semantics today, and Agent Watch itself uses hybrid ingestion. No current evidence says OTel is more complete or less invasive for every provider.

**If nothing changes:** the product may simply keep hooks; that is acceptable if they remain the most truthful source. The opportunity is maintenance/risk reduction, not mandatory feature parity with an external standard.

### 2. Priority / evidence

- kind: `RESEARCH`
- severity: `NOT_ESTABLISHED`
- decision priority: `MEDIUM`
- triage: `NEEDS_EVIDENCE`
- auto implementation: `false`

Qualitative Opportunity Score:

- **User Pain: MEDIUM.** Config mutation has proven risk, but frequency of current user harm is unknown.
- **Strategic Fit: HIGH.** Directly supports trustworthy low-friction monitoring and simplification.
- **Novelty: MEDIUM.** OTel is not novel; using provider-native streams to delete custom hook maintenance is the current decision.
- **Evidence Strength: HIGH for capability / MEDIUM for parity.** First-party schemas exist; no LobsterPulse runtime comparison has been executed.
- **Reuse Potential: MEDIUM-HIGH.** The principle may help other local monitors, but no shared framework is justified.
- **Effort: LOW for research / UNKNOWN for productization.** One provider fixture and off-the-shelf local collector are enough to answer the first question.
- **Security/Privacy/Cost risk: MEDIUM.** Local-only fixture is cheap, but content/identity attributes and schema drift require fail-visible handling.

### 3. Minimum solution

Compare in order:

1. **No code change:** retain hooks if native telemetry cannot preserve state truth.
2. **Documentation only:** if native telemetry is useful only for diagnostics/usage, document the boundary and stop.
3. **Reuse:** off-the-shelf local OTLP sink + existing LobsterPulse state contract.
4. **One-provider experiment:** Claude session start -> prompt -> tool -> explicit permission wait -> accept/reject -> completion/exit.
5. Only after successful parity evidence consider one thin optional adapter.

No collector service, database, universal adapter framework, new UI or provider migration is part of the research.

### 4. Research / implementation separation

Exit conditions recorded in #12:

- **BUILD:** one provider-native path reproduces minimum state truth with acceptable ordering/latency/correlation, deletes at least one custom mutation class and preserves privacy. BUILD authorizes only a later decision about a thin adapter; it does not authorize implementation here.
- **NARROW:** use native OTel only for usage/diagnostics/session correlation while hooks remain the attention source.
- **REJECT:** native telemetry is too coarse/late, equally invasive, privacy-heavier or less truthful.

## Rejected / deferred ideas

- **Replace all hooks with OTel now — REJECT.** Provider schemas/defaults differ and direct competitor evidence is hybrid.
- **Build a local OTLP collector product — REJECT.** Use an off-the-shelf sink for research; no user job requires a new collector.
- **Open another “attention inbox” Issue — SKIPPED_LOCKED.** Existing #9 has active PR #10 on the same attention-queue fingerprint.
- **Add Copilot-style Windows taskbar cards now — DEFER.** Useful market signal, but no repo/user evidence says the existing capsule/tray is the current bottleneck.
- **Cloud/team/mobile dashboard — REJECT by owner scope.** Contradicts the current North Star/non-goals.
- **Add more providers before truth/install/runtime work — REJECT NOW.** #3/#5/#6 remain more fundamental to the supported journey.

## Issue Mapping / coordination

### New

- `Reese-max/lobsterpulse#12` — **[Research][RESEARCH_REQUIRED] Validate provider-native OTel before expanding custom hook mutation**.
  - New fingerprint: `lobsterpulse + local provider monitoring source + provider exposes native structured telemetry + LobsterPulse currently mutates provider config/install hooks + question whether one native stream can preserve minimum state truth while deleting mutation surface`.
  - Fresh open/closed Issue search immediately before creation found no `OTLP`, `OpenTelemetry`, or `provider-native` tracking for this root question.
  - All-state PR search found no matching OTel-input PR/branch.
  - This is distinct from the existing outbound OTel roadmap and from #9 attention policy.

### Existing work left unchanged

- #3 — Codex enablement runtime proof remains separate and higher-priority product reliability work.
- #5 — provider truth/denominator remains upstream status semantics work.
- #6 — truthful install/distribution path remains separate.
- #9 / PR #10 — attention queue research is active. **SKIPPED_LOCKED** for this radar; no scope/comment change.
- #11 — Prometheus counter migration remains separate maintenance/reliability work.

Because #12 was a new Issue after fresh dedup rather than a rewrite of an existing Issue, no existing-Issue scope lock was taken. No claim is made that `auto_implementation=false` technically blocks external workers; it is a producer-side tracking state only.

## Cross-portfolio ideas

### 1. Prefer native evidence surfaces before writing another integration hook

Applicable to local tools such as LobsterPulse and potentially other Reese-max provider clients:

`provider-native evidence -> verify coverage/privacy -> reuse if sufficient -> custom hook only for missing state`

This is not permission for a portfolio OTel framework. Reuse should happen only where two projects independently demonstrate the same missing fact and compatible semantics.

### 2. Normalize product truth, not transport

A mixed set of hooks, OTLP, local files and provider APIs can still support one product if every adapter maps to explicit fields with freshness/provenance and keeps unknowns visible. Transport uniformity is not a user outcome.

## Sources

### First-party / primary

- GitHub Copilot CLI v1.0.83 release — 2026-09-04: https://github.com/github/copilot-cli/releases/tag/v1.0.83
- Claude Code monitoring / OpenTelemetry — checked 2026-09-15 UTC: https://code.claude.com/docs/en/monitoring-usage
- Codex advanced configuration / OpenTelemetry — checked 2026-09-15 UTC: https://developers.openai.com/codex/config-file/config-advanced/
- Gemini CLI telemetry / OpenTelemetry — checked 2026-09-15 UTC: https://google-gemini.github.io/gemini-cli/docs/cli/telemetry.html

### Product / competitor sources

- Agent Watch — current product, source mapping and pricing checked 2026-09-15 UTC: https://agent-watch.com/
- AgentLens extension listing — version/update signal, 2026-08-30; vendor listing only: https://vscodeextensions.com/extensions/agentlens-agentlens-dashboard

### Community signals

- Agent Quest multi-session discussion — 2026-08-23; anecdotal only: https://www.reddit.com/r/vibecoding/comments/1vvzqes/

## What changed since the previous radar

1. Fair rotation moved from `herdr-skills` to `lobsterpulse`.
2. Fresh owner pagination still finds 42 owned / 39 unarchived repositories; this run did not rely on a stale portfolio list.
3. Prior LobsterPulse radars already rejected a duplicate generic “add OTel” Issue. This round found a **different decision**: provider-native OTel may be an input that reduces custom hook/config mutation.
4. Claude's current documented blocked-on-user span makes the first parity experiment specific and falsifiable instead of architectural speculation.
5. Codex's machine-local OTel setting and Agent Watch's hybrid source design are explicit counterevidence against universal replacement.
6. Copilot's 2026-09-04 Windows taskbar session cards reinforce that same-provider glanceability is becoming platform-native; LobsterPulse should defend cross-provider truth rather than another provider-specific UI.
7. One new bounded research Issue (#12) was created; no existing Issue was rewritten.
8. No runtime experiment was performed, so no claim is made that native OTel is better, faster, safer or lower-maintenance in LobsterPulse.

## Completion, gaps, and next cursor

Completed this round:

- fresh owner pagination and unarchived scope check;
- quality-rule SHA verification;
- LobsterPulse North Star/non-goal/current code re-read;
- open/closed Issue and all-state PR dedup for the new fingerprint;
- public-web scan across direct competitor, adjacent workflow/community and emerging provider-native telemetry;
- current Agent Watch pricing/capability check;
- creation and read-back of #12.

Known gaps:

- no real Claude/Codex/Gemini OTLP fixture was executed;
- no latency/order/state-parity data exists yet;
- no real-user frequency, adoption, time-saved or ROI data exists;
- vendor product statements are treated as capability evidence, not performance validation;
- #9/PR #10 remains active and was not modified.

**Next fair-rotation cursor: `ai-flight-radar`**, selected as a comparatively cold product target relative to the recent deep-target sequence. Re-check fresh repository pagination and radar history before using it as authoritative scope in the next run.
