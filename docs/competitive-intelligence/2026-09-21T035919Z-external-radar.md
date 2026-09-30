# External Competitive / New-Product / Workflow Radar — 2026-09-21T03:59:19Z

## Status / scope / evidence boundary

- Run status: **COMPLETE / NO_NEW_ISSUE / MATERIAL_COMPETITOR_STRATEGY_SIGNAL**.
- Governing rule re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected owner inventory: complete pagination returned **42 Reese-max-owned repositories / 41 unarchived**; page 2 was empty. `obsidian-vault` remains the only archived repository and is excluded from active scope.
- Fair-rotation focal repository: `Reese-max/academic-mcp`.
- Current default branch / HEAD before report write: `main@c61d6fac1ab697748ac738382665d930d5361255`. The latest product-changing baseline identified by the current fixed-50 audit remains `4eb25de5005d33572095ed566ccf00762011bb50`; later default-branch changes are audit/docs evidence.
- Owner direction remains **INVEST / SIMPLIFY**: private, owner-operated, local-first academic research MCP; preserve the three pinned upstreams, 81 tools + 7 prompts, local papers/indexes, source-specific semantics, and truthful degraded-provider states. Do not turn it into a public multi-tenant research SaaS, provider-count race, native mobile app, collaborative workspace, billing/growth product, or opaque AI synthesis layer.
- Existing relevant scopes rechecked: #1/PR #8 canonical identity + ResearchBundle research; #2 with PR #5/#13 admission/verification; #3/PR #6 recovery; #4/PR #7 service confinement; #9/PR #10 progressive tool exposure; #12 post-publication status research; #14 OpenAlex false-empty bug; #15 Crossref false-empty bug. No active scope was modified.
- No product source, CI/config, secrets, permissions/settings, branch, merge/deploy, paid request, implementation worker, GOAL, or live provider mutation was started. No runtime provider-success claim is made.
- Portfolio CLEAN is **not declared**.

## Product → market category

`academic-mcp` is private scholarly-research infrastructure: one authenticated MCP endpoint over heterogeneous academic sources, with local persistence and explicit source/error semantics. Its defensible job is not merely “research inside an AI assistant.” That distribution pattern is becoming common. The stronger product boundary is **owner-controlled evidence access with inspectable upstream revisions, local/private artifacts, exact provider semantics, and explicit UNKNOWN/PARTIAL/RATE_LIMITED states**.

## External Signals

### A. CONFIRMED — Consensus is moving from destination search to an assistant-native evidence layer across multiple work surfaces

**Published 2026-09-14 / 2026-09-15; checked 2026-09-21 UTC.**

Sources:
- https://consensus.app/home/blog/consensus-everywhere/
- https://help.consensus.app/en/articles/11954907-consensus-product-changelog
- https://help.consensus.app/en/articles/16951328-how-to-use-consensus-in-microsoft-365-copilot

Consensus says it was built as a destination search product over its scholarly corpus, but research increasingly starts inside AI assistants, so it is deliberately moving the evidence retrieval layer into those surfaces. On 2026-09-14 it described the strategy as “Consensus Everywhere”; on 2026-09-15 it became an official Microsoft Marketplace app for Microsoft 365 Copilot. Its current product changelog also records the self-serve Consensus API becoming generally available on 2026-08-26. Current Copilot documentation says the same Consensus account/usage pool can span Copilot, ChatGPT, Claude and the API.

**User job being solved:** a researcher or knowledge worker should not need to leave the current assistant/document, repeat a query in a separate literature-search destination, manually copy papers back, and then reconstruct citations in the original work surface.

**Market pattern:** `destination search → reusable evidence service → multiple assistant/document hosts`.

**What is transferable to academic-mcp:**
- Research should be reachable where the owner is already reasoning; the current ChatGPT/MCP positioning is therefore directionally validated.
- The research backend and the host UI should remain separable. The same evidence contract can outlive a particular assistant.
- A future host change should not require rewriting provider semantics or losing source truth.

**What should not be copied:**
- No public marketplace listing, Microsoft 365 enterprise distribution, public API product, account system, usage pool, connector catalog, or multi-tenant SaaS is justified by current owner evidence.
- Consensus vendor benchmark claims are product/marketing evidence, not independent proof of better research outcomes, and are not used for severity or ROI.

**Product consequence:** assistant-native distribution is becoming **table stakes rather than a moat**. `academic-mcp` should differentiate on private/local control, pinned upstreams, exact source semantics, truthful degraded states, and owner-verifiable receipts rather than “it works inside ChatGPT.”

Candidate classification:

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

No Issue is created because the current owner workflow already has an assistant surface and there is no observed manual breakpoint requiring a second host. If host portability later becomes a real owner need, the smallest experiment is **no new architecture**: run the same 2–3 representative existing tools through one second supported MCP client and compare source/error semantics. Only a demonstrated incompatibility should justify a compatibility patch.

### B. CONFIRMED / DUPLICATE — Elicit is also pulling persistent research context into agent workflows

**Published 2026-09-17; already captured in the previous academic-mcp radar.**

Source:
- https://elicit.com/blog/tag/features

Elicit’s current product direction lets its Research Agent work from persistent Library collections and shared evidence. This reinforces the distinction between transient chat and durable research state, but that signal already maps to #1/PR #8. Because #1 has active research scope, this run records **SKIPPED_ACTIVE_SCOPE** and does not comment, rewrite or expand the Issue.

### C. CONFIRMED — Zotero 10 makes local, user-authorized write handoff practical without a cloud integration layer

**Zotero 10 released 2026-08-17; documentation checked 2026-09-21 UTC.**

Sources:
- https://www.zotero.org/blog/zotero-10/
- https://www.zotero.org/support/changelog
- https://www.zotero.org/support/dev/web_api/v3/local_api

Zotero 10 adds write support to the local API. A local tool can write items/collections/searches through `localhost`, but writes require a user-granted local API key and a `Zotero-Server-ID` precondition; Zotero documents `401/403/412/428/429` boundaries rather than treating writes as ambient authority. Changes become ordinary local Zotero changes and sync later only if the user’s library is configured to sync.

**Adjacent workflow idea:** if a future owner workflow repeatedly copies selected papers from `academic-mcp` into Zotero, a bounded handoff could write only explicitly selected canonical metadata into the user’s local library after Zotero’s own authorization prompt.

**Why this is not an Issue now:** no current repository evidence, owner instruction, or telemetry establishes that Zotero handoff is a recurring manual breakpoint. Existing #1 already researches canonical paper identity; adding a Zotero integration before identity/reliability work settles would turn a possible handoff into premature scope.

Classification: `ADJACENT_IDEA / HOLD / severity=NOT_ESTABLISHED / auto_implementation=false`.

Smallest future test, only if real friction appears: one explicit selected-paper export/write in an isolated local Zotero profile, preserving Zotero’s authorization and version preconditions. Do not build sync, background mirroring, a connector registry, or cloud credentials.

### D. CONFIRMED NEGATIVE FINDING — Crossref’s 2026 cursor changes do not affect the current academic-mcp Crossref query path

**Crossref announced the cursor changes 2026-08-10 and deployed them 2026-08-24; checked 2026-09-21 UTC.**

Source:
- https://community.crossref.org/t/changes-to-cursors-filtering-and-sorting-in-the-rest-api/16246

Crossref now requires original request parameters on follow-up cursor requests, returns a new `next-cursor` on each page, warns that cursor result sets are not stable while metadata changes, and restricts some cursor+sort combinations.

Current `academic-mcp` source does **not use cursor pagination** in `CrossRefSearcher.search()`: it performs one `/works` request with `rows=min(max_results, 1000)` and optional filter/sort/order parameters. Therefore opening a cursor-migration Issue would be a false positive. The existing #15 remains the real Crossref defect fingerprint: provider/request failure can collapse to an ordinary empty result, and the adapter uses a placeholder `mailto` identity.

Decision: `DO NOT CREATE / NOT_APPLICABLE_TO_CURRENT_PATH`.

### E. CONFIRMED NEGATIVE FINDING — OpenAlex’s July type-classification overhaul does not currently change academic-mcp’s category field

**Published 2026-07-15; checked 2026-09-21 UTC.**

Source:
- https://blog.openalex.org/an-overhaul-of-type-classification/

OpenAlex replaced its work-type classifier and reported 49.6 million works changing `type` on the first production run. Current `academic-mcp` `OpenAlexSearcher` does not map `type` into the returned categories; it derives categories from `concepts`. Therefore this market/provider change does not establish a current classification regression in this repository.

The existing #14 remains independent and narrower: non-200/transport failure can be normalized into false-empty search results, and current request sizing can exceed the provider’s supported page contract. Do not expand #14 with unrelated taxonomy migration work.

Decision: `DO NOT CREATE / NO_CURRENT_CAUSAL_PATH`.

## Community Pain

No new community report passed the promotion threshold in this round. The previously recorded ChatGPT custom-MCP disappearance report remains anecdotal and host-side until reproduced by the owner; it is not repeated as a new `academic-mcp` defect. No prevalence claim is made from forums or social discussion.

## New Releases / Market Moves

| Date | Product / platform | Signal | Confidence | Consequence for academic-mcp |
|---|---|---|---|---|
| 2026-09-15 | Consensus / Microsoft 365 Copilot | Official Marketplace app embeds scholarly search/evidence in Copilot work surfaces | CONFIRMED | Assistant-native distribution is becoming table stakes; do not turn this into a host-matrix project |
| 2026-09-14 | Consensus Everywhere | Strategy shifts from destination search toward evidence wherever the question occurs | CONFIRMED | Preserve host-independent evidence semantics; differentiation moves to privacy/provenance/source truth |
| 2026-08-26 | Consensus API | Self-serve API available broadly | CONFIRMED | API/distribution breadth is not itself a moat and does not justify public API scope |
| 2026-08-17 | Zotero 10 | Local API gains user-authorized write support | CONFIRMED | Possible future explicit local handoff; HOLD until actual copy/paste friction is observed |
| 2026-08-24 | Crossref REST API | Cursor behavior changed | CONFIRMED | Not applicable to current single-page Crossref adapter |
| 2026-07-15 | OpenAlex | Work type classifier overhaul | CONFIRMED | No current causal path because adapter categories come from concepts, not type |

## Opportunity Map — `academic-mcp`

### MUST MATCH

- Keep **provider failure distinct from confirmed absence** (#14/#15).
- Keep server/tool parity, tunnel/host availability, provider result, and local evidence state as separate facts.
- Preserve source identifiers/provenance rather than collapsing all scholarly results into one opaque answer.

### SHOULD BE BETTER

- Make the private/local advantage inspectable: exact pinned upstream revision, source-specific error state, local artifact availability, and bounded receipts should be clearer than a generic hosted “research app” success state.
- Treat the assistant as a replaceable presentation/execution host, not as the canonical research record.

### DIFFERENTIATOR

- Owner-controlled local papers/indexes plus a private gateway.
- Exact heterogeneous upstream semantics instead of a single opaque synthesis API.
- Explicit degraded states (`PARTIAL`, `RATE_LIMITED`, `ERROR`, `UNKNOWN`) and reproducible source/version evidence.

### ADJACENT IDEA

- Explicit local reference-manager handoff to Zotero 10, only after a real owner copy/paste breakpoint is observed and only with Zotero’s own user authorization/version preconditions.

### DO NOT COPY

- Public assistant marketplace distribution merely for reach.
- Microsoft/enterprise deployment surface, multi-user accounts, shared usage plans, billing or connector catalog.
- Opaque AI synthesis as the product center.
- Another provider only to increase tool count.
- A general sync daemon between the private research store and Zotero.

## Four-gate decisions

### Candidate 1 — second-host / host-portability support

1. **Problem/value:** Consensus proves multi-host distribution is strategically important in the market, but `academic-mcp` has no observed owner breakpoint requiring a second host. Historical ChatGPT use already satisfies the approved current workflow.
2. **Priority:** `OPPORTUNITY / NOT_ESTABLISHED / MEDIUM / NEEDS_EVIDENCE`; no P3/P2/P1 product defect is established.
3. **Smallest solution:** do nothing now. If owner need emerges, replay 2–3 representative existing tools through one second supported MCP client and compare tool schema, provider errors and provenance before changing code.
4. **Research/implementation separation:** no Issue and no implementation authorization. A successful compatibility experiment would support a later decision, not approve a host abstraction framework.

### Candidate 2 — Zotero local write handoff

1. **Problem/value:** technically possible now, but no current high-frequency copy/paste breakpoint is evidenced.
2. **Priority:** `OPPORTUNITY / NOT_ESTABLISHED / LOW_MEDIUM / NEEDS_EVIDENCE`.
3. **Smallest solution:** one explicit selected-paper handoff in an isolated local profile if the workflow is later observed. No background sync or cloud account work.
4. **Research/implementation separation:** HOLD centrally; #1 identity research is active and must not be expanded by this radar.

### Candidate 3 — Crossref cursor migration

1. **Problem/value:** no current failure path because the adapter does not use cursors.
2. **Priority:** `NOT_APPLICABLE`; do not manufacture severity.
3. **Smallest solution:** none.
4. **Decision:** REJECT until the adapter actually adopts multi-page cursor retrieval.

### Candidate 4 — OpenAlex type-classification migration

1. **Problem/value:** provider changed `type`, but current returned categories use `concepts`; no causal regression established.
2. **Priority:** `NOT_ESTABLISHED / DO_NOT_CREATE`.
3. **Smallest solution:** none. If future upstream migration replaces `concepts`, re-check then.
4. **Decision:** REJECT as a current Issue; keep #14 focused on false-empty provider failure semantics.

## Cross-portfolio ideas

One primitive is worth retaining without creating a framework: **host-independent evidence contract → host-specific thin presentation/invocation surface**. It may later help other Reese-max MCP products, but each repo must independently demonstrate a real host portability need. This report does not authorize a cross-repo compatibility layer.

## Rejected Ideas / negative findings

1. **Create “support Copilot/Claude/Everywhere” Issue — REJECT.** Competitor distribution strategy is not owner user-pain evidence.
2. **Publish academic-mcp as a public API/Marketplace app — REJECT.** Conflicts with private single-owner direction and adds auth/privacy/support obligations.
3. **Add Zotero sync service — REJECT.** Local explicit write is a much smaller possible handoff, and even that lacks current user evidence.
4. **Create Crossref cursor migration bug — REJECT.** Current source does not use cursors.
5. **Expand #14 with OpenAlex type migration — REJECT.** Current parser does not use `type` for categories; unrelated root cause.
6. **Update #1 because Elicit again validates durable research state — SKIPPED_ACTIVE_SCOPE.** #1/PR #8 already owns that research fingerprint.
7. **Treat Consensus precision/quality marketing benchmarks as independent evidence — REJECT.** Vendor benchmark is not product-runtime or owner-outcome evidence.

## Issue Mapping

- New Issues: **0**.
- Existing Issue comments/edits: **0**.
- PR comments/edits: **0**.
- Implementation authorizations: **0**.
- Locks: **0** — no Issue/shared-state mutation required a lease.
- Relevant current scopes remain #1/#2/#3/#4/#9/#12/#14/#15; active PRs remain #5/#6/#7/#8/#10/#13.

## Sources

Primary external sources checked in this round:

1. Consensus, **Consensus Everywhere**, published 2026-09-14 — https://consensus.app/home/blog/consensus-everywhere/
2. Consensus Product Changelog, current page checked 2026-09-21; entries 2026-09-15 and 2026-08-26 — https://help.consensus.app/en/articles/11954907-consensus-product-changelog
3. Consensus in Microsoft 365 Copilot, current help checked 2026-09-21 — https://help.consensus.app/en/articles/16951328-how-to-use-consensus-in-microsoft-365-copilot
4. Zotero 10 announcement, published 2026-08-17 — https://www.zotero.org/blog/zotero-10/
5. Zotero changelog, checked 2026-09-21 — https://www.zotero.org/support/changelog
6. Zotero Local API, checked 2026-09-21 — https://www.zotero.org/support/dev/web_api/v3/local_api
7. Crossref, **Changes to cursors, filtering, and sorting in the REST API**, announced 2026-08-10 / deployed 2026-08-24 — https://community.crossref.org/t/changes-to-cursors-filtering-and-sorting-in-the-rest-api/16246
8. OpenAlex, **An Overhaul of Type Classification**, published 2026-07-15 — https://blog.openalex.org/an-overhaul-of-type-classification/
9. Elicit feature release stream, current page checked 2026-09-21; durable-library signal was already captured in the prior radar — https://elicit.com/blog/tag/features

Repository/source evidence rechecked from connected GitHub, including current `CrossRefSearcher`, `OpenAlexSearcher`, current Issue/PR set, product-board direction, and fixed-50 Round 2. GitHub content is product evidence, not the primary competitive-intelligence source for this round.

## What Changed

- **1 material competitor strategy signal:** Consensus is explicitly moving from destination research search into a multi-assistant/multi-work-surface evidence layer (ChatGPT/Claude/Copilot/API direction).
- This **does not create a product defect or new Issue**. It changes positioning: “works inside an AI assistant” is increasingly table stakes, while `academic-mcp`’s stronger differentiators are private/local ownership, pinned heterogeneous upstreams, source truth and inspectable degraded states.
- **1 adjacent enabling technology:** Zotero 10 local write support makes an explicit local reference-manager handoff feasible, but no owner workflow evidence passes the Issue gate.
- **2 false-positive candidates rejected:** Crossref cursor migration and OpenAlex type-classification migration are not on current source paths that would establish defects.
- Severity upgrades: **0**. Scope expansions: **0**. New implementation authority: **0**.

## Severity / scope calibration

- #14 and #15 remain the high-value current product concerns because their false-empty paths can convert provider failure into misleading absence. No external market signal in this run changes their P2 classification or grants implementation authority.
- #1/#9/#12 remain research/opportunity with severity `NOT_ESTABLISHED`; competitor convergence does not turn them into defects.
- Active PRs are implementation/research candidates, not current default-branch proof. No PR was modified or treated as merged evidence.

## Completion / gaps / cursor

- Fresh owner inventory pagination completed: 42 owned / 41 unarchived; page 2 empty.
- Issue Quality v2 re-read and blob SHA retained.
- Current focal repo direction, default HEAD, product baseline, open Issues and all-state/open PR scopes were rechecked.
- External direct competitor, reference-manager, provider/platform and adjacent workflow signals were checked primarily from first-party public sources.
- No live provider query, real-user experiment, second-host MCP compatibility test, Zotero write, or runtime reproduction was executed; those remain explicit evidence gaps rather than inferred failures.
- Next fair-rotation cursor: `Reese-max/spotify-playlist-organizer-mcp`.
