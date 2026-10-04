# LobsterPulse Product Board Audit — 2026-10-04

Audit ID: `2026-10-04T141220Z-lobsterpulse`

Status: `PARTIAL / NOT_CLEAN / NO_NEW_ACTIONABLE_FINGERPRINT`

This is an audit and triage artifact only. It does not authorize implementation, merge, deployment, paid services, external writes, product-branch creation, or production-data access. All board and persona views below are model simulations, not independent experts or human research.

## Evidence anchor and scope

- Issue-quality rules: `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`, blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Product inspected: `Reese-max/lobsterpulse@41e09eb922a37323c30878323bfea955712e2a55` (`main`).
- Product direction read: `PRODUCT.md@306e63e416eb532cee27155d969d4405fa48baf6`, `MISSION.md@300dacc360e52a11c3134b2ba3cd13991b6bde9b`.
- Prior fixed-persona baseline read: `docs/audits/50-persona-round-3-2026-09-10.md@07fac38759eeb82c1a54f9c04166c7acef482d20`.
- README: `08322bbf5a9b77d1d2ab571088aa3732a547b90c`; package manifest: `d2b7fa80e2bd902e9a5314ba4dd8c17323ed5bd8`.
- Issues and pull requests were enumerated across all states. Current open product Issues are #3, #5, #6, #9, #11, and #12; open PRs are #7, #8, #10, #13, #16, and #17. Several open PRs are based on older main SHAs and must not be treated as current integration evidence.
- Current default-branch Actions run [#36483810384](https://github.com/Reese-max/lobsterpulse/actions/runs/36483810384) completed successfully on `41e09eb...`. It ran the repository Build matrix; a green build does not prove real Codex activation, installers, live providers, or production deployment.
- GitHub Releases is empty and no deployment receipt was found. This remains covered by Issue [#6](https://github.com/Reese-max/lobsterpulse/issues/6).
- No product source, CI/config, secrets, settings, permissions, or deployment was changed by this audit.

## Incremental discovery

The last committed 50-persona baseline predates the merged Codex work in PRs #14 and #15. Current main now contains structural TOML handling, canonical `[features].hooks` reconciliation, ownership sidecar handling, identity-aware rollback, startup reconciliation, and Linux packaged smoke coverage. PR [#17](https://github.com/Reese-max/lobsterpulse/pull/17) adds Windows/macOS synthetic packaged smokes and passed candidate run #36653638581, but it is still a draft and its event is synthetic rather than emitted by a real Codex CLI. The external-editor pathname replacement race is explicitly still open.

No new repository root cause crossed the four issue-opening gates. Existing Issues already cover every material result below; no duplicate Issue or repeated status comment was created.

## Regression classification

| Tracking | Current classification | Evidence and limit |
|---|---|---|
| [#3](https://github.com/Reese-max/lobsterpulse/issues/3) Codex hooks enablement | `PARTIALLY_FIXED / NEEDS_RUNTIME_VERIFICATION` | Source fix and exact-main Build are present. Linux packaged synthetic smoke exists; PR #17 adds candidate-only Windows/macOS synthetic smokes. Real Codex CLI activation on Windows/macOS and the final external-editor replace window remain unverified. Original P1 is not reasserted as a new incident. |
| [#5](https://github.com/Reese-max/lobsterpulse/issues/5) provider promise/K0 denominator | `STILL_OPEN / NEEDS_RUNTIME_VERIFICATION` | README advertises 13 providers while MISSION contains revised scope/denominator logic. A representative live/stale/disabled/external-provider receipt is still required. |
| [#6](https://github.com/Reese-max/lobsterpulse/issues/6) installation truth | `STILL_OPEN` | No GitHub Release exists. The README still leads to a local build artifact or source build; no clean-machine download/checksum/launch/sidecar acceptance exists. |
| [#11](https://github.com/Reese-max/lobsterpulse/issues/11) Prometheus counter migration | `STILL_OPEN / P2` | README still announces a 2026-07-03 rename deadline that has passed. Draft PR #16 proposes postponement rather than verified completion. |
| [#12](https://github.com/Reese-max/lobsterpulse/issues/12) provider-native OTel | `RESEARCH / NOT_ESTABLISHED` | The bounded one-provider comparison remains appropriate; external competitors show both native telemetry and hybrid ingestion, so a broad migration is not justified. |

No `VERIFIED_FIXED`, confirmed regression, new P0/P1, or new P2 fingerprint is claimed in this round.

## Competitor and substitute evidence

Checked 2026-10-04 UTC. Vendor and project claims are `CONFIRMED` as published functionality, not independent proof of reliability or user outcome.

| Product / workflow | Current evidence | Fit and contrast |
|---|---|---|
| Agent Watch | Current official pages say one dashboard monitors Claude Code, Codex CLI, and Gemini CLI; exposes running/idle/waiting, alerts, token/cost tracking, remote terminals, and a $7/month Basic plan. [Features](https://www.agent-watch.com/features/) · [Pricing/current product](https://agent-watch.com/) | Direct state-monitoring competitor, but remote control, SaaS alerts, and subscription are outside LobsterPulse's local hobby scope. Its explicit waiting/needs-attention state raises the truthfulness bar. |
| Agent Deck | Current official GitHub README describes a TUI session manager for Claude/Gemini/OpenCode/Codex, worktrees, remote SSH sessions, and checksum-verified release deploys. [Repository](https://github.com/asheshgoplani/agent-deck) | Substitute for users whose real job is orchestration. LobsterPulse should not copy worktree/session control; its smaller differentiator is glanceable passive status and quota. Agent Deck's verified distribution is relevant to #6. |
| OpenUsage | Current official site/repository describes a native macOS menu-bar quota tracker, stale-while-revalidate, a local API/CLI, and provider-level usage/limits. [Product](https://www.openusage.ai/) · [Repository](https://github.com/robinebers/openusage) | Direct quota substitute. Explicit freshness and a stable local read contract are transferable; macOS-first positioning is not. |
| Agent Monitor | Current repository describes an always-on-top floating desktop widget that aggregates Claude Code sessions across projects. [Repository](https://github.com/Hoemr/agent-monitor) | Direct form-factor signal. It validates the small always-visible surface but is narrower by provider and does not prove LobsterPulse's 13-provider claims. |
| GitHub Copilot app / CLI | GitHub announced its desktop app GA on 2026-06-17 for macOS, Windows, and Linux. Current CLI releases on 2026-10-01/02 continue to refine session timelines, hooks, and Windows behavior. [GA announcement](https://github.blog/changelog/2026-06-17-github-copilot-app-generally-available/) · [CLI releases](https://github.com/github/copilot-cli/releases) | Native provider UX is the substitute for a cross-provider monitor. LobsterPulse should not duplicate each provider's full client; it must be more truthful and faster at cross-provider glance state. |

### Competitive implications

- `MUST MATCH`: truthful working/waiting/ended state; explicit freshness/degraded state; safe hook/config mutation; an obtainable and verifiable install path.
- `SHOULD BE BETTER`: Windows-first 300px glanceability, local privacy, and a unified state/usage view across local CLIs plus OpenAB without forcing orchestration.
- `DIFFERENTIATOR`: one passive capsule for cross-provider task truth and quota, not a browser control plane or another terminal manager.
- `DO NOT COPY`: remote terminals, mobile approvals, worktree orchestration, SaaS subscriptions, or a broad provider matrix unsupported by runtime evidence.

## Synthetic product board

These are simulated viewpoints and preserve disagreement.

| View | Judgment |
|---|---|
| CEO | If only three things are done: finish #3's real activation/safety evidence; choose and prove release-vs-source-only for #6; reconcile #5/#11 truth contracts. Do not add remote control, mobile, orchestration, or more providers. |
| CPO | The product is strongest as a narrow local status-and-quota instrument. First success is still blocked for non-builders; distribution truth outranks new surfaces. |
| CTO | Main is materially safer, but synthetic sidecar events cannot stand in for provider activation. The external-editor race needs an explicit conflict contract, not more retries. |
| Staff/Principal Engineer | Avoid a generic config transaction framework. A bounded compare-and-conflict path around the two Codex files is the largest acceptable next design; reuse current identity/sidecar machinery. |
| UX Lead / Researcher | The 300px capsule is a real constraint and advantage. Any ambiguity between disabled, unavailable, stale, and zero must be visible without opening diagnostics. |
| Growth | A trustworthy Windows download would create more real adoption value than another feature. Growth claims remain unknown until a release path exists. |
| CFO | Hobby/open-source scope and no-paid-service boundary argue for `MAINTAIN/SIMPLIFY`, not SaaS parity. |
| Security / Privacy | Local-only and no automatic provider enablement remain correct. Remote control and cloud alerts materially expand threat surface and are rejected. |
| QA | Exact-main Build is useful; real Codex CLI activation, installer artifact, provider state fixtures, and clean rollback are still separate gates. |
| SRE | Status must distinguish `UNKNOWN`, `STALE`, `DISABLED`, `DEGRADED`, and actual zero. A green build is not provider health. |
| Accessibility | PRODUCT requires contrast, reduced motion, and non-hover-only information, but this round has no executed UI accessibility evidence. Keep as evidence backlog, not a defect claim. |
| Support | README contains substantial operational detail but still sends ordinary users toward build artifacts. One supported path and one failure-recovery story would reduce support load. |

## 50 synthetic personas

Supplemental model simulation: 30 regression baselines plus 20 exploration personas. It does not replace the fixed A01–J05 audit protocol or count toward CLEAN. `Result` reflects inspected evidence, not prevalence.

| ID | Background / constraint | Goal and journey | Friction / result | Triage / recommendation / evidence |
|---|---|---|---|---|
| R01 | Windows owner, non-Rust user | Download and glance at running agents | No release artifact; journey stops before first success | P2; keep #6; Releases empty and README source-build path |
| R02 | Windows maintainer | Build no-bundle app locally | Supported in docs; CI build passes, local environment not executed here | Maintain; exact-main run #36483810384 |
| R03 | Codex user with `hooks=false` | Enable monitoring | Static reconciliation is on main; real CLI activation remains unproven | Partial; keep #3; main + candidate smoke evidence |
| R04 | Codex user with user-owned `hooks=true` | Enable then remove without clobber | Fixtures and ownership logic cover this | Maintain; repository tests, not real user home |
| R05 | User with malformed TOML | Avoid corrupting config | Fail-closed fixtures exist | Maintain; source/test evidence only |
| R06 | Codex user who has not trusted hooks | Receive events after install | Manual trust is documented; install success alone is insufficient | P1 residual verification; #3 |
| R07 | Windows Known Folder user | Enable in packaged app | Draft PR #17 synthetic smoke passes candidate | Needs default integration + real CLI; #3 |
| R08 | macOS XDG user | Enable in packaged app | Candidate smoke passes, but macOS is non-primary and real CLI is absent | Later; #3, no scope expansion |
| R09 | Linux user | Run packaged smoke | Merged Linux synthetic runtime evidence exists | Partial; synthetic event only |
| R10 | Power user editing Codex config concurrently | Preserve external edit | Final pathname replacement window can overwrite editor replacement | Needs review within #3; no new framework |
| R11 | Owner reading “13 providers” | Know actual coverage | Registered/advertised/live/fresh denominators diverge | P2; #5 |
| R12 | Privacy-sensitive first launch | Avoid automatic config writes | Providers default disabled | Pass static; preserve boundary |
| R13 | User with stale usage file | Know whether zero is real | MISSION has revised scope logic, but runtime display evidence is incomplete | P2; #5 |
| R14 | Quota-focused owner | See remaining limits at a glance | Core purpose is documented; live multi-provider acceptance absent | Needs runtime evidence; #5 |
| R15 | Multitasking developer | Notice waiting agent | Product supports state model, but real cross-provider fixture not rerun here | Maintain baseline; no new issue |
| R16 | OpenAB bot offline | Distinguish offline from zero work | Scope admits external variability; display receipt missing | P2; #5 |
| R17 | Low-digital-confidence Windows user | Install without toolchain | Blocked by distribution path | P2; #6 |
| R18 | Offline-transfer user | Verify and install artifact | No release/checksum contract | P2; #6 |
| R19 | Security-conscious installer | Verify binary checksum | No public binary; candidate workflows do not solve distribution | P2; #6 |
| R20 | 300px desktop owner | Read capsule without expansion | Product principle exists; no executed visual check this round | Evidence backlog, not defect |
| R21 | Low-vision user | Read status with adequate contrast | Requirement exists; no runtime accessibility audit | Needs evidence; do not open without reproduction |
| R22 | Motion-sensitive user | Disable nonessential motion | Requirement exists; no executed UI evidence | Needs evidence; backlog |
| R23 | Mouse-only user | Discover actions without hover-only text | PRODUCT forbids hover-only dependence; not executed | Needs evidence; backlog |
| R24 | Local-privacy user | Keep telemetry on device | Product direction is local and no SaaS | Pass direction; preserve |
| R25 | User with third-party Codex hook | Keep hook through install/remove | Candidate Windows/macOS smokes preserve third-party entry | Partial; PR #17 not main, synthetic |
| R26 | Retry after interrupted install | Recover without clobber | Sidecar/pending identity logic and tests exist | Partial; real interruption acceptance absent |
| R27 | User restarting LobsterPulse | Reconcile enabled provider | Startup reconciliation landed on main | Partial; exact-main Build, no real CLI |
| R28 | KPI reviewer | Recompute numerator/denominator | Historical target and revised scope are hard to reconcile | P2; #5 |
| R29 | Prometheus dashboard owner | Survive counter rename | Announced deadline passed and migration remains open | P2; #11 |
| R30 | 24/7 single owner | Trust long-running status | Build evidence is not longevity/provider evidence | Needs runtime soak evidence; no new issue |
| E01 | Agent Watch user | Remote-control agents | LobsterPulse intentionally does not offer remote control | `DON'T`; respect non-goal |
| E02 | Mobile-first operator | Approve prompts from phone | Outside local desktop scope | `DON'T`; no mobile feature |
| E03 | Agent Deck user | Create worktrees and manage sessions | Orchestration is explicitly excluded | `DON'T`; no session manager |
| E04 | Multi-host developer | View SSH sessions | Remote aggregation expands security/scope | `LATER/DON'T`; no evidence of owner need |
| E05 | OpenUsage user | See quota freshness instantly | Explicit stale state is transferable | `NOW` via #5, reuse existing status contract |
| E06 | Open-source downloader | Install a signed/checksummed build | Competitors publish consumable artifacts | `NOW`; #6, no new packaging platform |
| E07 | Copilot-native user | See one Copilot session in taskbar | Native provider already covers this | Differentiate cross-provider, do not duplicate full client |
| E08 | Claude telemetry experimenter | Use native blocked-on-user spans | Could reduce hook mutation for one provider | Bounded research only; #12 |
| E09 | Codex OTel experimenter | Compare native events with hooks | Configuration may be equally invasive and state may be incomplete | Bounded research; #12, accept REJECT |
| E10 | Gemini telemetry experimenter | Observe tool/session events | Privacy/content logging must be explicit | Later research; #12 |
| E11 | Offline laptop developer | Retain local monitoring | Local architecture fits, distribution still blocks | Maintain local-first; #6 |
| E12 | Team manager | Share a dashboard | Multi-user SaaS is non-goal | `DON'T`; no collaboration surface |
| E13 | Secret-conscious maintainer | Avoid logging provider credentials | Current audit found no need to expand data collection | Maintain minimization |
| E14 | Provider-update maintainer | Detect schema/version drift | Versioned capability/freshness truth is needed | `NOW`; #5 |
| E15 | New-provider contributor | Add another integration | Provider inclusion criteria require real use and metrics | `DON'T` until evidence; no count-driven additions |
| E16 | Hobby maintainer with low capacity | Reduce recurring maintenance | Close truth/distribution debt before features | `SIMPLIFY/MAINTAIN` |
| E17 | Accessibility contributor | Validate narrow dark UI | Valuable but currently unevidenced | Narrow manual/automated audit later; no broad redesign |
| E18 | Local API consumer | Read state from scripts | Metrics/local API can be reused instead of new dashboard | Maintain existing interfaces; avoid platform |
| E19 | Support triager | Explain missing events | Needs one state taxonomy and recovery receipt | #3/#5, docs after behavior |
| E20 | Skeptical owner | Ask what to delete | Delete expired claims and stale deadlines before adding scope | `NOW`; #5/#11/#6 truth cleanup |

Synthetic preference and switching results were not calculated. No simulated vote, percentage, occurrence rate, revenue, or ROI is used as evidence.

## Red Team

| Proposal / claim | Disconfirming evidence | Decision |
|---|---|---|
| “#3 is fixed because main CI is green” | Main CI proves tested source/build paths; real Codex activation and external-editor conflict are not covered. | Reject `VERIFIED_FIXED`; retain partial status. |
| “Merge PR #17 and close #3” | PR #17 uses synthetic sidecar events and no installer; it also documents the unresolved replace window. | Reject automatic closure. |
| “Build a generic config transaction framework” | Only two Codex files and one known conflict class are in scope; framework cost is not justified. | Narrow to explicit conflict contract or retain documented limitation. |
| “Copy Agent Watch remote control” | Product non-goals exclude SaaS/control; threat surface and maintenance rise sharply. | Reject. |
| “Copy Agent Deck worktree orchestration” | LobsterPulse is a monitor, not an orchestrator; `autodev-ng` already owns orchestration elsewhere in the portfolio. | Reject. |
| “Add more providers to compete” | Existing 13-provider truth is not yet runtime-verifiable. | Reject until #5 evidence contract is complete. |
| “No release is only a documentation issue” | Non-builders cannot reach the core task; source-only is viable only if explicitly chosen and documented. | Keep #6 P2. |
| “Native OTel replaces all hooks” | Agent Watch itself advertises hook configuration; current external evidence supports hybrid ingestion, and native schemas differ. | Keep #12 research-only with BUILD/NARROW/REJECT exits. |
| “The expired counter deadline can be ignored” | Published consumers may rely on either old or promised names; silence preserves ambiguity. | Keep #11; choose migrate or explicitly retire/postpone contract. |

## Findings and tracking

| Fingerprint | Decision | Tracking |
|---|---|---|
| Codex feature enablement + real activation + conflict window | Existing root; no duplicate; partially fixed | #3, PR #17 candidate |
| Advertised 13 providers + changing KPI denominator/state semantics | Existing root; no duplicate | #5, PRs #7/#13 |
| Desktop product + no consumable release/source-only decision | Existing root; no duplicate | #6, PR #8 |
| Expired Prometheus counter rename contract | Existing root; no duplicate | #11, PR #16 |
| Native OTel vs custom hook mutation | Bounded research only | #12 |

Actual write counts for this round: new Issues 0; updated Issues/comments 0; reopened 0; research Issues 0; deduplicated findings 5; rejected/kept-as-evidence-backlog 9; severity changes 0; verified fixes 0; report 1. No item passed the issue gate without tracking.

## NOW / NEXT / LATER / DON'T

- `NOW`: #3 real provider activation/conflict decision; #6 release-vs-source-only decision and corresponding acceptance; #5 truthful state/freshness/denominator; #11 migrate or explicitly retire/postpone the expired contract.
- `NEXT`: after those land on main, rerun the same fixed A01–J05 protocol plus the regression subset above, including clean Windows and real provider events.
- `LATER`: one-provider OTel comparison under #12; narrow accessibility evidence pass; longevity/soak evidence.
- `DON'T`: remote terminals, mobile approvals, multi-user SaaS, worktree orchestration, provider-count expansion, or a generic cross-provider framework without evidence.

## Decision memo

**Who is served:** primarily one Windows owner running several AI coding CLIs/OpenAB bots who wants passive, local, always-visible task truth and quota without switching windows.

**Why choose it:** unlike a provider-native client, LobsterPulse can unify state and usage across tools; unlike Agent Watch or Agent Deck, it can stay local, passive, narrow, and non-orchestrating.

**Differentiation:** the 300px capsule plus cross-provider local task truth and quota. The differentiation only holds if status and coverage are more truthful than a marketing provider count.

**Top three priorities:** (1) close or explicitly bound #3 with real activation and a conflict contract; (2) make the product obtainable or truthfully source-only through #6; (3) make state/coverage/migration claims verifiable through #5 and #11.

**Stop doing / delete:** stop treating green CI as runtime acceptance; delete or correct expired dates and unsupported coverage language; do not maintain multiple stale implementation PRs as if they were current evidence.

**Risks and experiments:** external-editor overwrite risk; provider schema drift; stale/zero ambiguity; installer and clean-machine failures. The minimum experiments are a real Codex event on disposable Windows/macOS profiles, a clean Windows acquisition flow, and a live provider state matrix. Each must record exact SHA/version and may end in NARROW or REJECT.

**Portfolio posture:** `MAINTAIN + SIMPLIFY`. Invest only in truth, safe activation, and distribution. Do not reposition into remote orchestration or SaaS. No merge/archive recommendation.

## Portfolio inventory snapshot

Inventory was fully paginated: 45 owned repositories, 44 active and one archived (`obsidian-vault`). Default HEAD changes since the preceding audit baseline occurred only in `clinical-scribe-worker` and `skill-foundry`; all other active HEADs, including `lobsterpulse`, were unchanged.

Active inspected HEADs:

`92-duty-scheduler@4d7d7d49`, `academic-mcp@81452f46`, `adng-memory@dc1c4e7f`, `ai-flight-radar@62281383`, `ai-novel-workstation@267a0b6a`, `autodev-ng@c521ee02`, `avatar-vfo@8c578feb`, `cf-ai-router@74c52130`, `cf-mcp-server@a3192b6d`, `chatgpt-dual-pipeline@1ade604e`, `claude-mem@3ed5439f`, `clinical-scribe-worker@4b883036`, `cyber-prep-coach@ffc7bbbb`, `exam-archive@5d74726e`, `flux-image-gen@dfadcf30`, `google-maps-personal-mcp@e97adace`, `herdr-skills@9f134e1b`, `lobsterpulse@41e09eb9`, `MaterialYouNewTab@7d32f2f4`, `minideck@31f7131a`, `neciken-summer-poem@a6e268b7`, `ninax-line-hermes@b71a827f`, `note-filler@1df674dd`, `octobroker@b669101c`, `openab@50424ed4`, `openab-pty@9e146405`, `police-essay-mcp@97e994f7`, `police-exam-archive@a0b5dbb9`, `police-exam-practice@b97b96db`, `ppt-studio@8ca3b8ca`, `project-doctor-web@f34dd1d7`, `prompt-autoresearch@01dc864c`, `skill-foundry@b20f5ade`, `soundbox-offline@d58d73ad`, `spotify-playlist-organizer-mcp@13aae785`, `studio@0f1b62d3`, `taichung-police-intel@562141e3`, `taiwan-intel-dashboard@df7cee19`, `tick-stock-panel@54c30347`, `travel-planning-app@dd5081df`, `travel-planning-mcp@dbb66acf`, `UkePack@718d021f`, `video-timeline-pipeline@7d892972`, `voice-actress@75cdcea4`.

Archived/excluded by purpose: `obsidian-vault` is archived; no product defect was opened merely because it is a content repository.

## Other default-branch changes in this round

- `clinical-scribe-worker@4b883036...`: test-only coverage for future `iat`; exact-main run [#37206770880](https://github.com/Reese-max/clinical-scribe-worker/actions/runs/37206770880) passed `npm ci` and `npm run check`. Production/runtime authorization remains missing under existing Issue #6; no new root.
- `skill-foundry@b20f5ade...`: compatibility evidence gate landed; exact-current-main run [#37207973827](https://github.com/Reese-max/skill-foundry/actions/runs/37207973827) passed the repository deterministic gate. Existing Issue #1 still requires real Codex and Waza/MiniMax runtime bundles, so it remains `PARTIALLY_FIXED / NEEDS_RUNTIME_VERIFICATION`.
- `tick-stock-panel` Issue #10 received a passing candidate PR #14 at `f7bab02a...`, run [#37202177490](https://github.com/Reese-max/tick-stock-panel/actions/runs/37202177490). Main remains `54c30347...`; candidate evidence is not a verified fix.

## Completion and cursor

This round is `PARTIAL` for portfolio CLEAN: LobsterPulse's fixed audit has not completed two new clean rounds, required runtime evidence is absent, and several tracked P2/P1 gates remain. No notification criterion is met.

Fair-review cursor after this completed deep review: `MaterialYouNewTab`.

