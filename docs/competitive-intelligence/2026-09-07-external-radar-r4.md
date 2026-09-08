# External Competitive / Product Inspiration Radar — 2026-09-07 r4

> Scope: current accessible, non-archived Reese-max repositories that can reasonably be treated as products or supporting product infrastructure. External public-web research is the primary signal source. Repository/Issue/PR evidence is used only to judge fit, duplication, readiness, and safety. Community discussions are tagged `COMMUNITY_SIGNAL` and are not treated as market-share or efficacy studies.

## Executive Summary

Round 4 produced two distinct, high-value opportunities strong enough to create GitHub tracking objects:

1. **`cf-mcp-server` — migrate toward MCP 2026-07-28 without breaking legacy clients**. The repository recently repaired major OAuth 2.1/PKCE weaknesses and moved OAuth state into D1, but it still uses the monolithic MCP v1 SDK and a DCR-centric client-registration model. The MCP ecosystem has since moved to the 2026-07-28 stateless/discovery model, deprecated Dynamic Client Registration in favor of Client ID Metadata Documents / pre-registered clients, and moved the official TypeScript SDK v2 to split server/client packages. This is a protocol-compatibility MUST MATCH, not a feature-bloat request. New Issue: `cf-mcp-server #6`.
2. **`cf-ai-router` — research task-specific provider reliability before changing routing**. The current manual router already has the correct hard boundaries: billable nodes fail closed, tools/vision capability is checked deterministically, provider/key cooldown is explicit, and Cloudflare Dynamic Route remains disabled because cost/provider selection is not auditable before dispatch. External gateway work now shows that tool-calling / structured-output reliability can differ by provider endpoint even for the same nominal model. A safe next step is a versioned local `ProviderTaskProfile` + frozen fixtures + shadow ordering, not black-box dynamic routing. New Research Issue: `cf-ai-router #1`.

Several other signals were deliberately **not** converted into new Issues:

- StudyFetch-style calendar/deadline-aware study planning is a useful extension of `cyber-prep-coach #4`, but it shares the same learner-state / next-best-task root cause; opening a new ticket would fragment the design.
- Lexis+ AI Guided Drafting / Protege context carry-forward reinforces `note-filler #3` rather than creating a separate legal-workspace feature.
- New prompt-optimization research on multi-trial statistics and structural optimization is relevant to `prompt-autoresearch`, but the repo already has smoke/dev/holdout separation, evidence logs, budgets, rollback and promotion gates. The remaining question is whether variance-aware repeated evaluation is worth its runtime cost; evidence is not yet strong enough for a new feature Issue.
- `voice-actress` is actively repairing grading provenance and session persistence. Adaptive scheduling/personalization is deferred until the core grade→persist→dashboard path is trustworthy.

The cross-portfolio pattern is becoming clearer: **support claims, routing claims, model claims, source claims, and learner recommendations should all be versioned assertions backed by explicit compatibility/evidence manifests, with stale/inconclusive states rather than optimistic defaults.**

## Product → Market Category Map / Opportunity Map

| Repository | Current product category | r4 classification | r4 decision |
|---|---|---|---|
| gemini-deidentifier | AI RPG / interactive fiction (identity mismatch) | DO NOT COPY / SIMPLIFY | Resolve repo identity #28 before expansion |
| exam-archive | Exam archive / public reference | MUST MATCH | Performance/provenance/reproducible build first |
| police-exam-practice | Police-exam practice | SHOULD BE BETTER | Reuse common learner model later; no duplicate learner engine |
| police-exam-archive | Exam corpus / provenance archive | MUST MATCH | Preserve image-based answer fidelity (#58) |
| 92-duty-scheduler | Constraint-based duty scheduling | DIFFERENTIATOR | #19 repair plans already covers next major workflow gain |
| openab | Unresolved current product identity | UNKNOWN | Research identity before competitive conclusions |
| UkePack | Music/chord practice workflow | MAINTAIN | Do not expand until public-deploy authorization/runtime evidence is stable |
| ppt-studio | AI presentation workstation | DIFFERENTIATOR | #3 source/claim provenance remains the right moat |
| book5-windows-server-2022 | Learning/deck content | SHOULD SIMPLIFY | Landing/build/accessibility contract over new AI features |
| obsidian-vault | Personal knowledge/content repository | ADJACENT IDEA | Skills/MCP interoperability only if it removes a real manual step |
| voice-actress | Exam/essay grading & coaching | DO NOT ADD NOW | #1/#2 + open PRs must stabilize grading provenance/session lifecycle first |
| taiwan-intel-dashboard | Public intelligence dashboard | DO NOT ADD NOW | Keep paused/recovery posture; no feature expansion |
| autodev-ng | Multi-agent delivery orchestrator | SHOULD BE BETTER | Independent verification/review UX; avoid more-agent-for-its-own-sake |
| flux-image-gen | AI image workspace | MUST MATCH | Safety/provenance/recoverable history before broader capability |
| claude-mem | Agent memory/context | ADJACENT IDEA | Portable scoped memory + attribution / freshness |
| lobsterpulse | Agent hooks / notifications | SHOULD BE BETTER | Preserve hook/config integrity; no extra notification breadth yet |
| prompt-autoresearch | Prompt experiment optimizer | SHOULD BE BETTER | Variance-aware repeated eval is research backlog, not a new Issue yet |
| neciken-summer-poem | AI literary production workflow | MUST FIX | Restore green default-branch CI before product expansion |
| note-filler | Source-grounded legal/admin note augmentation | DIFFERENTIATOR | #3 claim-review ledger is reinforced by new legal workflow signals |
| gooaye | Empty placeholder | N/A | Define purpose or archive |
| lplrs-judicial-sync | Judicial data synchronization | MUST MATCH | Takedown/retention semantics #1 dominate |
| adng-memory | Operational memory / snapshot store | MUST MATCH | Contract/recovery/retention first |
| cyber-prep-coach | iPAS exam preparation | DIFFERENTIATOR | #4 learner profile; deadline/calendar awareness should extend it, not split |
| cf-ai-router | AI provider/router infrastructure | RESEARCH_REQUIRED | NEW #1: task reliability profile + shadow deterministic ordering |
| avatar-vfo | AI avatar/chat | DO NOT ADD NOW | Security/release evidence before new agent behavior |
| project-doctor-web | Clinical teaching/research UI | DO NOT ADD NOW | Safety/runtime gates remain more important than agentic features |
| minideck | Presentation/deck workflow | MUST MATCH | Share/version authority and privacy scope first |
| chatgpt-dual-pipeline | Internship-notes publication product | SHOULD SIMPLIFY | Identity/source-of-truth handoff first |
| internship-notes-sites-mirror | Publication mirror | N/A | Keep as mirror, not a second product surface |
| taichung-police-intel | Public-sector/police intelligence monitor | DIFFERENTIATOR | #12 role intelligence profile remains high-value |
| soundbox-offline | Local-first/offline music library | MUST MATCH | Portable backup/restore; do not add cloud sync/recommender yet |
| skill-foundry | Agent-skill creation/certification | DIFFERENTIATOR | #1 runtime compatibility/negative-transfer gate |
| video-timeline-pipeline | Video intelligence / knowledge pipeline | DIFFERENTIATOR | Research Packs + existing roadmap; avoid parallel duplicate infrastructure |
| ai-novel-workstation | Long-running AI writing workstation | DIFFERENTIATOR | #2 Context Manifest/selective story-memory routing |
| clinical-scribe-worker | Clinical scribe/evaluation worker | DO NOT ADD NOW | Auth/quota/audit integrity before capability growth |
| MaterialYouNewTab | New-tab productivity surface | KEEP LIGHT | Only thin, local, low-cost adjacent integrations if strongly justified |
| cf-mcp-server | Cloudflare MCP server | MUST MATCH | NEW #6: 2026-07-28 compatibility + CIMD + conformance |
| tick-stock-panel | Taiwan stock monitoring/simulation | MUST MATCH + RESEARCH | #2 coverage truth first; #5 NL→deterministic rule compiler after that |
| herdr-skills | Multi-agent workflow skills | SHOULD BE BETTER | Portable memory/runtime proof receipts; avoid duplicating Foundry |

## External Signals

### 1. MCP moved from session-centric remote servers to a stateless/discovery-first protocol

**CONFIRMED — MCP 2026-07-28, 2026-07-28**

The official release moves the core protocol toward stateless/sessionless HTTP behavior, adds `server/discover`, standardizes per-request protocol/client metadata, moves Tasks into an extension, deprecates Dynamic Client Registration (DCR) in favor of Client ID Metadata Documents (CIMD), and tightens issuer binding for OAuth client credentials. Legacy HTTP+SSE and older roots/sampling/logging primitives are on a deprecation path.

Sources:
- https://blog.modelcontextprotocol.io/posts/2026-07-28/
- https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/

**CONFIRMED — official TypeScript SDK v2**

The official TypeScript SDK v2 is now the stable line for the 2026-07-28 protocol and uses split `@modelcontextprotocol/server` / `@modelcontextprotocol/client` packages instead of the monolithic v1 package.

Sources:
- https://github.com/modelcontextprotocol/typescript-sdk
- https://github.com/modelcontextprotocol/typescript-sdk/blob/main/packages/server/README.md
- https://github.com/modelcontextprotocol/typescript-sdk/blob/main/ROADMAP.md

**CONFIRMED — MCP roadmap, 2026-08-22**

The roadmap emphasizes agent identity / enterprise-ready security, HTTP-native transport hardening, and agentic messaging primitives. This makes protocol compatibility an ongoing product contract, not a one-time dependency bump.

Source:
- https://blog.modelcontextprotocol.io/posts/mcp-roadmap/

**CONFIRMED — Cloudflare MCP security update, 2026-08**

Cloudflare added pre-registered OAuth-client support to MCP Portals and explicitly calls out DCR deprecation under MCP 2026-07-28, showing that real remote-MCP deployments need a transition strategy across registration modes rather than an abrupt cutover.

Source:
- https://blog.cloudflare.com/mcp-security-updates/

**Transferable principle:** protocol support should be represented as a **versioned compatibility matrix + conformance receipt + real-client smoke**, not a README claim such as “supports MCP.”

### 2. AI gateway routing is moving from nominal model capability to task/provider evidence

**CONFIRMED — OpenRouter Auto Exacto, 2026-03-12**

OpenRouter’s Auto Exacto changes provider ordering for tool-calling requests using provider-level telemetry/benchmarks and throughput rather than simply choosing by price. The important pattern is that tool reliability can be an endpoint/runtime property, not only a model-name property.

Source:
- https://openrouter.ai/blog/announcements/auto-exacto/

**CONFIRMED — OpenRouter τ²-Bench provider run, 2026-09-03**

OpenRouter continues to benchmark tool-use behavior by provider endpoint. The current results also show that quality/routing gains are not uniformly monotonic across every provider/model/time window, which argues against a single permanently “best” endpoint.

Source:
- https://openrouter.helicone.ai/benchmarks/tau2-bench-airline

**CONFIRMED RESEARCH — Switchcraft, 2026-05**

Switchcraft studies routing specifically for agentic tool-calling tasks, reinforcing that a normal-chat benchmark is a weak proxy for tool-schema correctness.

Source:
- https://arxiv.org/abs/2605.07112

**CONFIRMED RESEARCH — SEAR, 2026-03**

SEAR models routing with typed intent/quality/operational metrics. The reusable idea for this portfolio is not its exact algorithm but the notion that routing evidence should be explicit, queryable and versioned.

Source:
- https://arxiv.org/abs/2603.26728

**Transferable principle:** route only after hard policy/capability gates; use evidence profiles to rank eligible candidates; run new ranking in shadow mode before promotion.

### 3. Study planning products are linking learner state to deadlines and calendar constraints

**CONFIRMED PRODUCT DIRECTION — StudyFetch calendar / learning workflow, current 2026**

StudyFetch can derive deadlines/test dates from uploaded course material and generate a study schedule. Its broader product flow connects user materials, quizzes/flashcards/tutor interactions and progress signals.

Sources:
- https://www.studyfetch.com/calendar
- https://www.studyfetch.com/

**COMMUNITY_SIGNAL — anecdotal**

Users describe adapting generated study schedules around full-time work and regenerating when availability changes. This is not efficacy evidence, but it identifies a real workflow: learner recommendations compete with calendar capacity, not only knowledge weakness.

Source:
- https://www.reddit.com/r/studyfetch/comments/1ks4xp0/

**Portfolio implication:** extend `cyber-prep-coach #4` later with an optional `available_minutes / exam_date / due_topics` layer. Do not open a second “study planner” Issue that would compete with the same learner profile.

### 4. Legal AI products are turning evidence + context into reusable drafting workflows

**CONFIRMED — LexisNexis AI drafting plans, 2026-07-21**

LexisNexis describes guided AI legal drafting plans as reusable workflow structures rather than a one-shot prompt. Protege also carries matter/document context across conversations and can bring cited documents into drafting.

Sources:
- https://www.lexisnexis.com/community/insights/legal/b/thought-leadership/posts/ai-legal-drafting-plans-that-transform-attorney-workflows
- https://www.lexisnexis.com/en-us/products/lexis-plus-ai.page

**Portfolio implication:** this strengthens the existing `note-filler #3` direction: source-backed claims should move through a persistent review/accept/reject ledger and reusable evidence context. It does not justify building a generic legal-matter workspace.

### 5. Prompt optimization research is moving toward variance-aware and structural evaluation

**CONFIRMED RESEARCH — AgentAssay, 2026-06**

AgentAssay argues for robust repeated evaluation and statistical handling of stochastic agent outcomes; single-run success can be misleading.

Source:
- https://arxiv.org/abs/2606.17202

**CONFIRMED RESEARCH — FAPO, 2026-08**

FAPO explores optimization beyond surface prompt tokens, including broader reasoning/tool-chain behavior.

Source:
- https://arxiv.org/abs/2608.07187

**CONFIRMED RESEARCH — SPEAR, 2026-03**

SPEAR similarly explores multi-round structural optimization rather than one-shot textual tweaking.

Source:
- https://arxiv.org/abs/2603.18324

**Portfolio implication:** `prompt-autoresearch` already has benchmark/dataset/holdout, budget, evidence log, rollback and promotion boundaries. A variance-aware repeated-trial layer is interesting, but must first prove that added runtime cost changes decisions often enough to justify itself.

## New Releases / Recent Changes Worth Tracking

| Date | Product / ecosystem | Change | Reese-max relevance |
|---|---|---|---|
| 2026-09-03 | OpenRouter τ²-Bench | Fresh provider-level tool-use measurements | `cf-ai-router`: provider/task reliability is measurable but time-varying |
| 2026-08-22 | MCP roadmap | Identity/security/HTTP transport/agentic messaging priorities | `cf-mcp-server`: compatibility must be continuously evidenced |
| 2026-08 | Cloudflare MCP Portals | Pre-registered OAuth clients; explicit DCR deprecation context | `cf-mcp-server`: maintain legacy + forward auth modes |
| 2026-07-28 | MCP | Stateless/discover core, CIMD direction, Tasks extension | `cf-mcp-server`: P1 protocol gap |
| 2026-07-21 | LexisNexis | Guided drafting-plan workflow / persistent context | `note-filler`: reinforces reusable evidence-review workflow |
| 2026-06 | AgentAssay | Repeated/robust agent evaluation | `prompt-autoresearch`: variance-aware research backlog |
| 2026-05 | Switchcraft | Tool-calling-specific routing research | `cf-ai-router`: build task fixtures, not generic quality score |
| current 2026 | StudyFetch | Syllabus/deadline → adaptive study schedule | `cyber-prep-coach`: extend #4 with time-capacity constraints later |

## Community Pain Points

These are `COMMUNITY_SIGNAL` only.

### MCP OAuth / remote-server interoperability

Practitioners continue to report that OAuth discovery order, protected-resource metadata, PKCE/redirect handling and endpoint-vs-downstream OAuth are major interoperability costs. The actionable lesson is not to add a custom auth shortcut; it is to test each supported client/protocol/auth mode and retain explicit receipts.

Representative discussions:
- https://www.reddit.com/r/mcp/comments/1w1hmo8/shipped_oauth_on_our_mcp_server_so_claudeai_and/
- https://www.reddit.com/r/mcp/comments/1vhxudz/dual_oauth_on_the_new_20260728_mcp_spec_endpoint/
- https://www.reddit.com/r/mcp/comments/1qcvlkq/debugging_mcp_oauth_in_2026/

### Study-plan usability

Users value a plan that acknowledges real availability and can be regenerated when work/life constraints change. The failure mode is a technically “personalized” plan that assumes unlimited study time.

Representative discussion:
- https://www.reddit.com/r/studyfetch/comments/1ks4xp0/

## Adjacent Ideas

### A. Compatibility Manifest as a shared portfolio primitive

A common schema can appear in several products without forcing a common runtime implementation:

- MCP: protocol revision / client / auth mode / SDK / conformance;
- Skill Foundry: model / harness / tools / dataset / Skill Lift;
- AI Router: provider / model / task capability / reliability / observed_at;
- Market data: provider / plan / coverage / freshness / capability;
- Research packs: source set / policy / refresh / evidence contract.

Key states should include `SUPPORTED_VERIFIED`, `DEGRADED`, `UNTESTED`, `STALE`, `INCOMPATIBLE`, not a Boolean `supported=true`.

### B. Shadow-before-promotion

Before an adaptive component changes production behavior, calculate its decision in parallel without triggering a second external side effect:

- `cf-ai-router`: current order vs shadow order;
- learner planner: current today-task vs deadline-aware suggested task;
- prompt optimizer: current promotion rule vs variance-aware recommendation;
- intelligence ranking: general vs role-profile projection.

Only promote after replay/fixture evidence demonstrates no trust regression.

### C. Conformance + product smoke as two distinct gates

Protocol/library conformance and actual user/client interoperability should be separate:

1. official/frozen conformance suite;
2. real client / real browser / real provider smoke;
3. evidence receipt with versions/hashes;
4. invalidate on critical dependency change.

This pattern applies beyond MCP to provider routing, presentation exports, Skill runtimes and backup/restore formats.

## Opportunity Map

| Opportunity | Classification | Repo(s) | Score | Action this round |
|---|---|---|---:|---|
| MCP 2026-07-28 dual-protocol + CIMD + conformance migration | MUST MATCH | cf-mcp-server | **96/100** | **NEW Issue #6** |
| Task-specific provider reliability profile + shadow deterministic ordering | RESEARCH_REQUIRED | cf-ai-router | **88/100** | **NEW Research Issue #1** |
| Deadline/calendar-aware next-best study task | SHOULD BE BETTER | cyber-prep-coach | 84/100 | Duplicate/root overlap with #4; extend later, no new Issue |
| Variance-aware multi-trial evaluator / inconclusive state | ADJACENT RESEARCH | prompt-autoresearch | 81/100 | Keep in research backlog; insufficient distinct evidence for Issue |
| Persistent drafting context / guided plan | SHOULD BE BETTER | note-filler | 80/100 | Reinforces #3; duplicate avoided |
| Adaptive study planning in essay grader | LATER / BLOCKED | voice-actress | 74/100 | Defer until grading/session reliability is verified |

Score is a prioritization heuristic across User Pain, Strategic Fit, Novelty, Evidence Strength, Reuse Potential and Implementation Effort with Security/Privacy/Cost risk as a penalty. It is not a market forecast.

## Top 10 Cross-Portfolio Ideas

1. **Versioned compatibility manifests** — support is a scoped, evidenced claim, not a Boolean.
2. **Freshness / invalidation rules** — model, provider, SDK, dataset, source or policy changes should stale old evidence.
3. **Conformance + real-client smoke** — both required before claiming compatibility.
4. **Task-specific fixtures** — tool calling, strict JSON, source verification, grading, learning and export each need their own golden tests.
5. **Deterministic selection/routing with reason receipts** — policy before score, explicit exclusions, stable tie-breaks.
6. **Preview/review before state-changing output** — repairs, rule compilation, evidence acceptance, L3 operations.
7. **Portable local-first state** — backup/restore/rebind/replay as a product capability rather than an operator afterthought.
8. **Shared learner model + real time constraints** — one learner state reused across exam products; deadline-aware planning as a layer, not another silo.
9. **Bounded context/research packs** — source set + task + evidence + cost/network policy + refresh contract.
10. **Shadow mode before adaptive promotion** — compare decisions without creating a second external side effect.

## Ideas Rejected / Deferred

- **Enable black-box dynamic AI routing in `cf-ai-router`** — rejected. It would weaken the repo’s current pre-dispatch cost/audit boundary.
- **Immediately remove DCR from `cf-mcp-server`** — rejected. The standard deprecates it, but real legacy clients may still require it; migrate with measured client compatibility.
- **Add more generic agents to `autodev-ng` / `herdr-skills`** — rejected. The stronger market signal remains context + verification + evidence, not agent count.
- **Cloud account sync / recommendation engine for `soundbox-offline`** — rejected for now. Local-first portability/backup is the trust priority and PR #2 is still incomplete for audio blobs.
- **Create a separate Study Calendar Issue for `cyber-prep-coach`** — duplicate avoided. Deadline/capacity belongs inside the `MasteryProfile / today-task` contract of #4.
- **Create a generic legal matter workspace for `note-filler`** — rejected. The product’s differentiated unit is evidence-backed note augmentation + human claim review, not an all-purpose law-firm SaaS.
- **Add AI personalization to `voice-actress` now** — deferred. Recent PRs are still repairing grading provenance and grade-session persistence; new personalization would magnify unreliable state.
- **Turn prompt-autoresearch into a general agent-architecture optimizer immediately** — rejected. FAPO/SPEAR are research inspiration, not proof that this repo should expand scope.
- **Add agentic medical actions to `project-doctor-web` / `clinical-scribe-worker`** — rejected. Safety/auth/quota/audit integrity remain gating work.

## Issue Mapping

### New Issues created this round

1. `Reese-max/cf-mcp-server #6` — **[Competitive Gap][P1][MCP] 雙協定遷移至 2026-07-28：CIMD、stateless discover 與 conformance gate**
   - https://github.com/Reese-max/cf-mcp-server/issues/6
   - Fingerprint: remote MCP server + v1 monolithic SDK / DCR-centric auth + 2026-07-28 clients/spec + no dual-protocol/conformance contract.

2. `Reese-max/cf-ai-router #1` — **[Research][Competitive Inspiration] 評估任務型 capability/reliability profile 驅動的 deterministic provider ordering**
   - https://github.com/Reese-max/cf-ai-router/issues/1
   - Fingerprint: manual static provider chain + tools/vision request gate + no versioned provider task-reliability evidence for within-chain ordering.

### Existing Issues deliberately reused / not duplicated

- `cyber-prep-coach #4` — local mastery profile + adaptive today task. Study calendar/deadline capacity is an extension of this root.
- `note-filler #3` — claim-level Verify/Accept/Reject review queue. Lexis+ drafting-plan/context signals reinforce it.
- `skill-foundry #1` — target runtime compatibility manifest. r4 MCP/router findings strengthen the same broader “compatibility claim needs evidence” principle.
- `tick-stock-panel #2/#5` — coverage truth first; NL rule compiler research second.
- `ai-novel-workstation #2`, `ppt-studio #3`, `92-duty-scheduler #19`, `taichung-police-intel #12` — remain distinct and active; no duplicate tickets created.

## Recent Repository Changes That Affect Priority

- **`cf-mcp-server`**: commit `db0e81bcf5bfe66c9faefec107fa15a815695523` fixed the root-credential-in-URL issue and moved OAuth clients/codes/rate-limit state to D1, closing #4/#5. Therefore #6 is a forward compatibility gap, not a re-report of those security defects.
- **`voice-actress`**: open PRs #3/#4/#5 are actively adding explicit grading mode/provenance, tolerant legacy-session reading, and grade-v2→session persistence. Product expansion remains blocked until the whole flow has E2E evidence.
- **`soundbox-offline`**: PR #2 adds a versioned metadata/library backup envelope but explicitly does not include audio blobs. Treat portability as ongoing rather than “solved.”
- **`tick-stock-panel`**: PR #4 improves the realtime capability-card wording for Fugle, but backend normalized coverage metadata and fail-closed full-market workflow gating are still part of #2.
- **`taichung-police-intel`**: the scheduled-publication issue #9 is now closed after a reproducer/fix, and follow-up PR work adds verification artifacts / stale-publication alerting. This improves the foundation for #12, but profile ranking still must preserve source-gap/staleness signals.
- **`prompt-autoresearch`**: PR #2 adds a root contract, holdout isolation, offline/no-network path, budget/concurrency and recovery documentation, reducing the need for another broad “evaluation hygiene” Issue.

## Sources

### MCP / remote-agent protocols
- 2026-07-28 — MCP release: https://blog.modelcontextprotocol.io/posts/2026-07-28/
- 2026-07-28 — release candidate: https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/
- 2026-08-22 — MCP roadmap: https://blog.modelcontextprotocol.io/posts/mcp-roadmap/
- Official TypeScript SDK v2: https://github.com/modelcontextprotocol/typescript-sdk
- Official server package README: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/packages/server/README.md
- Cloudflare MCP security updates: https://blog.cloudflare.com/mcp-security-updates/

### AI routing / provider reliability
- 2026-03-12 — OpenRouter Auto Exacto: https://openrouter.ai/blog/announcements/auto-exacto/
- 2026-09-03 — OpenRouter τ²-Bench provider run: https://openrouter.helicone.ai/benchmarks/tau2-bench-airline
- 2026-05 — Switchcraft: https://arxiv.org/abs/2605.07112
- 2026-03 — SEAR: https://arxiv.org/abs/2603.26728

### Learning
- StudyFetch Calendar: https://www.studyfetch.com/calendar
- StudyFetch product: https://www.studyfetch.com/
- Community workflow signal: https://www.reddit.com/r/studyfetch/comments/1ks4xp0/

### Legal drafting workflows
- 2026-07-21 — LexisNexis AI Legal Drafting Plans: https://www.lexisnexis.com/community/insights/legal/b/thought-leadership/posts/ai-legal-drafting-plans-that-transform-attorney-workflows
- Lexis+ AI / Protege: https://www.lexisnexis.com/en-us/products/lexis-plus-ai.page

### Prompt / agent evaluation research
- AgentAssay: https://arxiv.org/abs/2606.17202
- FAPO: https://arxiv.org/abs/2608.07187
- SPEAR: https://arxiv.org/abs/2603.18324

## What Changed Since Last Radar

Compared with r3, the biggest change is **not another end-user feature category**. It is a new infrastructure-level product principle:

> **Compatibility itself is a versioned evidence object.**

r3 established role/runtime profiles for intelligence and Skills. r4 extends that principle to wire protocols and AI providers:

- MCP support must bind protocol revision + SDK + auth registration mode + client + conformance evidence.
- AI-router support/priority must bind provider + model + task type + fixture revision + freshness/confidence evidence.
- A stale or untested claim must degrade explicitly rather than silently remain “supported.”

This produces a more coherent portfolio architecture:

```text
External / canonical truth
        ↓
Versioned capability / compatibility profile
        ↓
Hard policy gate
        ↓
Deterministic selection / ordering
        ↓
Preview / shadow / review
        ↓
Execution
        ↓
Conformance / runtime evidence receipt
        ↓
Freshness / invalidation on critical change
```

Round 4 therefore created only two new tracking objects despite broad external research. That is intentional: the quality bar is distinct root cause + current repository evidence + non-duplicate scope + measurable acceptance criteria, not a quota of new features.
