# External Competitive / New-Product / Workflow Radar — 2026-09-19T02:04:00Z

## Status / scope / evidence boundary

- Run status: **PARTIAL_INVENTORY / COMPLETE_FOCAL_ANALYSIS**.
- Owner scope: `Reese-max` only; no third-party repository was modified.
- Issue Quality v2 re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality-rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fair cursor entering this round: `Reese-max/academic-mcp`.
- Focal repo verified accessible, owner-controlled, private and unarchived. Default branch: `main`; current HEAD re-read immediately before Issue creation: `c61d6fac1ab697748ac738382665d930d5361255`.
- Current repo audit identifies latest product-changing baseline as `4eb25de5005d33572095ed566ccf00762011bb50`; the newer HEAD is audit/docs-only.
- Owner-approved direction remains **INVEST / SIMPLIFY**: private, owner-operated, local-first academic research MCP gateway; preserve heterogeneous upstream semantics, source provenance, truthful degraded-provider behavior and local research storage. Explicit non-priorities remain additional providers merely for breadth, public multi-tenant SaaS, native mobile app, collaborative workspace product, billing/growth features, and opaque AI synthesis.
- Open PR scopes were re-read: #13/#5 for #2 verification gate, #6 for recovery, #7 for home confinement, #8 for #1 canonical paper identity/research bundle, #10 for #9 progressive tool exposure. None was modified.
- **Inventory limitation:** the connected GitHub surface available in this turn supports repository-specific reads/writes but did not expose a permitted owner-repository listing endpoint; an attempted owner listing endpoint was rejected by the connector. Therefore this run does not re-claim fresh full portfolio pagination. The immediately preceding verified radar inventory was **41 accessible Reese-max-owned repositories / 40 unarchived**, but that number is continuity context only, not a fresh enumeration claim for this report. Cursor is preserved rather than treating missing enumeration as repository disappearance.
- No live Crossref request, provider call, paid request, deployment, source/config/CI/secret/settings change, implementation branch, merge, worker or GOAL was started.
- This radar does not declare `academic-mcp` or the portfolio CLEAN.

## Executive decision

**1 new Issue: `Reese-max/academic-mcp#15`. 0 existing Issue/PR comments. 0 implementation authorizations.**

Two external changes matter this round:

1. **Crossref tightened REST API request-type and email-based rate limiting on 2026-07-21.** The current pinned Crossref adapter still identifies every installation with the placeholder `paper-search@example.org`, retries 429 once, then converts request failures into ordinary empty results. The exact DOI path similarly converts non-404 failures into the same absence shape as a real 404. This is a source-confirmed, reachable product defect independent of #12 and #14, so a narrow P2 tracking Issue was created.
2. **Elicit's 2026-09-17 Library release makes persistent collections directly usable by its Research Agent and Projects.** This is a meaningful direct-competitor strategy shift toward durable evidence context rather than one-shot search. It strengthens the already-open #1 ResearchBundle hypothesis, but collaboration/team scope remains explicitly out of product direction and #1 has active PR #8. No scope was added or modified.

The smallest product action remains provider-truth repair, not a new provider framework or research workspace.

## Product → market category

| Product | Market / alternatives | Current differentiated job |
|---|---|---|
| `academic-mcp` | Elicit, Scite, Consensus, Zotero, Crossref/OpenAlex/Semantic Scholar research tooling, MCP research connectors | Private authenticated MCP gateway preserving source-specific scholarly capabilities, exact upstream versions, local papers/indexes and truthful degraded-source state |

## External Signals

### A. Direct competitor — Elicit turns its Library into agent-usable persistent evidence context

**CONFIRMED — released 2026-09-17; checked 2026-09-19 UTC.**

Source: https://elicit.com/blog/library-into-resesearch-hub

Elicit now lets its Research Agent search personal/shared collections, use those papers as sources, save newly found papers to collections, and link collections to Projects so the agent knows which evidence should be prioritized for that work.

**User job:** stop rediscovering and manually re-copying the same evidence between research sessions/projects; keep the evidence set visible to both researcher and agent.

**Portable pattern:** `explicit evidence set → agent works from it → new candidates can be saved → project declares relevant evidence context`.

**What fits here:** this is new external support for #1's distinction between candidate/included papers, source observations and versioned ResearchBundle state. The valuable part is durable, explicit evidence context—not Elicit's team product.

**What not to copy:** shared teams, collaborative permissions, hosted organization workspace, generic systematic-review SaaS or opaque synthesis. Those are outside owner-approved scope.

**Coordination:** #1 has active PR #8, so this signal is recorded centrally only: `SKIPPED_LOCKED_ACTIVE_PR#8`. No Issue comment/scope edit was made.

### A2. Direct competitor — Scite continues moving from search toward graph traversal inside MCP

**CONFIRMED — released 2026-09-09; checked 2026-09-19 UTC.**

Source: https://scite.ai/blog/citation-surfing-scite-mcp

Scite MCP added `citation_graph`, allowing an agent to start from a paper and traverse references/citing papers, optionally carrying Smart Citation context when available.

**User job:** follow literature relationships without manually copying identifiers between separate search pages/tools.

**Transfer:** `academic-mcp` already has Semantic Scholar citation capabilities; the useful competitive signal is not to clone Scite's classifier or graph. It further supports preserving stable paper identity + exact source observation across multi-step traversal, already #1.

**Do not copy:** Smart Citation classifications without equivalent corpus/licensing/classifier evidence; do not create a second citation graph merely for parity.

### B. Adjacent scholarly infrastructure — Crossref metadata itself is becoming more connected and mutable

**CONFIRMED — released 2026-09-15; checked 2026-09-19 UTC.**

Source: https://www.crossref.org/blog/improving-how-funding-connects-to-research-outputs/

Crossref began matching deposited funder names lacking identifiers to ROR IDs as part of its Research Nexus work.

**Portable pattern:** scholarly metadata can improve after original deposit; a later provider observation may be richer/different without the underlying paper identity changing.

**Implication:** this supports #1's `observed_at/source/revision` direction and argues against treating a normalized paper object as timeless canonical metadata. It does **not** justify a funder/ROR feature Issue: no current user workflow gap was established, and #1 already carries the observation/revision concept.

### C. Current provider contract — Crossref rate limits now make source-outcome truth more important

**CONFIRMED — effective 2026-07-21; checked 2026-09-19 UTC.**

Primary source: https://community.crossref.org/t/refining-rest-api-limits-for-improved-stability-and-reliability/16137

Crossref states:

- single-record requests keep higher limits;
- list/query requests are limited to **1 request/s public** and **3 requests/s polite**;
- HTTP 429 means rate limiting and clients should pause/back off;
- polite-pool limiting can be keyed by supplied email address;
- users sharing a default email address can be rate-limited together;
- repeated invalid addresses can lead to blocking if Crossref cannot contact the caller.

Current general access documentation likewise requires truthful response handling and recommends a valid `mailto`/User-Agent:
https://www.crossref.org/documentation/retrieve-metadata/rest-api/access-and-authentication/

Current pinned adapter source at focal HEAD:

- `CrossRefSearcher.USER_AGENT` includes `paper-search@example.org`;
- list search sends `mailto=paper-search@example.org`;
- one 429 triggers a fixed two-second retry;
- any remaining `requests.RequestException` is caught and returned as `[]`;
- the unified `search_papers()` only records `errors[source]` when a source coroutine actually raises;
- therefore a Crossref 429/403/5xx/timeout can become `source_results.crossref = 0` with no Crossref error;
- exact DOI lookup returns `None` both for real 404 and non-404 request failures, and the MCP wrapper converts either to `{}`.

This is the new #15 fingerprint:

`academic-mcp:paper-crossref:provider-request-failure:requestexception-normalized-to-empty:false-empty-results:v1`

## New Releases / capability changes

| Date | Product / provider | Change | Radar implication |
|---|---|---|---|
| 2026-09-17 | Elicit Library | Research Agent can search/use/save Library collections; Projects can link evidence collections | Strong new support for durable bounded evidence context; maps to #1, not team collaboration |
| 2026-09-15 | Crossref | Automatic matching of funder names to ROR IDs begins | Provider metadata can evolve; preserve source/observed-at/revision rather than timeless canonical fields |
| 2026-09-09 | Scite MCP | Added `citation_graph` traversal | Traversal is becoming agent-native; preserve identity/provenance rather than cloning graph/classifier |
| 2026-07-21 | Crossref REST | Request-type and email-address-based rate limiting activated | Current placeholder email + false-empty error normalization is now a concrete compatibility/reliability concern |

## Community Pain

No Reddit/Hacker News anecdote was required to establish #15, and no community claim is used as prevalence, ROI or severity evidence this round.

The strongest evidence is first-party provider contract plus current pinned source. This avoids turning isolated research-tool complaints into a product roadmap.

## Opportunity Map — `academic-mcp`

### MUST MATCH

- `provider failure != confirmed empty result`.
- Exact DOI `not found` must stay distinguishable from provider/transport failure.
- Source-specific requests must not be silently answered by another provider.
- Preserve exact source, observation time and provider-specific semantics when evidence is reused.
- Keep current request identification/rate behavior compatible with provider contract without committing user credentials.

### SHOULD BE BETTER

- A single-owner local gateway should make degraded-provider state more inspectable than opaque hosted research answers.
- Persistent research context, if #1 proves it useful, should reuse existing source observations and local storage rather than create a collaborative workspace.
- Metadata refresh should make changed provider observations visible rather than silently overwrite what the user previously saw.

### DIFFERENTIATOR

- Preserve heterogeneous source semantics and exact upstream versions instead of flattening everything into one synthesized answer.
- Local/private paper and index storage with inspectable source evidence.
- Explicit degraded states such as rate-limited/partial/error rather than fabricated completeness.

### ADJACENT IDEA

- Reuse Elicit's concept of a bounded evidence context only as a single-owner, local ResearchBundle if #1's experiment passes.
- Preserve Crossref metadata enrichments as new observations/revisions rather than inventing separate ROR infrastructure.

### DO NOT COPY

- Elicit team/shared-workspace product.
- Scite Smart Citation classification or licensed full-text corpus.
- Another citation graph when current Semantic Scholar capabilities already cover the job.
- A generic provider registry, retry service, health database or fallback router just to fix Crossref failure semantics.
- Paid Crossref Metadata Plus as a prerequisite.
- Automatic fallback from Crossref to OpenAlex/arXiv that hides which source actually failed.

## Four-gate decision — Crossref false-empty provider failure

### 1. Problem / value

Target user is the owner searching scholarly metadata or resolving a DOI through the private gateway.

Observable current path:

`Crossref query/DOI request → 429/403/5xx/timeout → adapter catches RequestException → []/None → MCP wrapper returns ordinary absence → unified search records no source error`.

This changes a source-state fact, not just presentation. A user can reasonably interpret `0 Crossref results` or `{}` for a DOI as evidence of absence when the provider actually failed.

Counterevidence was checked: Crossref says most users should not notice the July limit changes, and no owner production incident was observed. Therefore the claim is bounded to a reachable source-confirmed defect, not a Crossref outage or high-frequency incident.

### 2. Priority

```yaml
kind: BUG
severity: P2
decision_priority: HIGH
triage: NEEDS_REVIEW
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

P2 is justified because false absence can materially change research completeness/DOI verification in a supported source-specific path. P1 is not justified: Crossref is one of several sources and no current owner incident or total core-workflow failure was observed.

### 3. Minimum solution

Smallest safe order:

1. Preserve genuine Crossref 404 as `NOT_FOUND`/equivalent source truth.
2. Propagate bounded non-404 provider/transport failures so `search_papers()` can expose `errors.crossref` (or equivalent) instead of confirmed zero.
3. Make Crossref contact identity owner-configurable through existing private config, or deliberately use public-pool semantics; do not commit a personal email/token.
4. Keep retry bounded and provider-local.

Documentation-only, changing only the email, or changing only retry delay are insufficient because none prevents non-404 failures from being normalized to absence.

No database, state machine, provider framework, fallback router or paid plan is needed.

### 4. Research / implementation separation

#15 is BUG tracking only. It does not authorize a worker, branch, merge, deployment, provider purchase or secret write. Runtime verification still requires one authorized non-destructive Crossref search and one DOI lookup after any future fix, plus bounded fixture failures.

## Rejected Ideas / negative findings

1. **Add Elicit-style collaboration — REJECT.** Directly outside owner direction; #1's evidence context can remain local/single-owner.
2. **Create a new research workspace/database — REJECT.** #1/PR #8 already explores the smallest typed evidence state; no new root exists.
3. **Add Crossref retry infrastructure/service — REJECT.** A local adapter truth fix is sufficient.
4. **Automatically fall back Crossref → another provider — REJECT.** That would erase source-specific failure truth.
5. **Open a funder/ROR feature Issue because Crossref now enriches ROR — REJECT/DEFER.** No supported user job currently requires it; the useful lesson is observation freshness/revision.
6. **Open a ChemRxiv outage Issue from the vendored `ChemRxivSearcher` invalid `from-publisher:chemrxiv` filter — REJECT as product defect in this round.** Current MCP server import/`ALL_SOURCES` does not expose ChemRxiv, so the stale adapter was not shown reachable through the shipped 81-tool product surface. Dead/unwired vendored code is not automatically a user-facing defect.
7. **Merge #15 into #14 — REJECT.** Both share a false-empty symptom, but #14 includes an OpenAlex-specific page-limit/API-key trigger while #15 is an independently reachable Crossref adapter path (including DOI lookup) and remains reproducible even after an OpenAlex fix.
8. **Rewrite #1 with new Elicit evidence — SKIPPED_LOCKED_ACTIVE_PR#8.** Preserve active implementer scope; new evidence lives in this central report.

## Cross-portfolio ideas

### Source absence must be an evidence claim, not a default value

Reusable principle:

`provider request → provider outcome → normalized result`

must preserve at least the conceptual distinction between:

`FOUND / CONFIRMED_EMPTY / NOT_FOUND / RATE_LIMITED / UPSTREAM_ERROR / UNKNOWN`.

This is evidence-backed in both current OpenAlex (#14) and Crossref (#15) paths, but this report does **not** authorize or open a cross-portfolio provider-state framework. Each repository should use the smallest local representation needed for its actual workflow.

## Issue Mapping

### Created and read back

- `Reese-max/academic-mcp#15` — **[P2][RELIABILITY] Preserve Crossref provider failures instead of reporting false-empty results**
- URL: https://github.com/Reese-max/academic-mcp/issues/15
- fingerprint: `academic-mcp:paper-crossref:provider-request-failure:requestexception-normalized-to-empty:false-empty-results:v1`
- state read back: `open`
- classification: `BUG / P2 / HIGH / NEEDS_REVIEW / auto_implementation=false / NEEDS_RUNTIME_VERIFICATION`

### Existing scopes deliberately not modified

- #1 / PR #8 — Elicit Sep-17 and Crossref Sep-15 evidence support durable source-observation/revision concepts; active scope left untouched.
- #12 — post-publication update/retraction field loss is a separate research fingerprint.
- #14 — OpenAlex request-contract/false-empty bug remains separate.
- #2/#3/#4/#9 and PRs #5/#6/#7/#10/#13 — no scope overlap with #15.

## Sources

Primary public sources checked this round:

1. Elicit, “Turn your Elicit Library into a shared research hub,” 2026-09-17 — https://elicit.com/blog/library-into-resesearch-hub
2. Scite, “Citation Surfing with Scite MCP,” 2026-09-09 — https://scite.ai/blog/citation-surfing-scite-mcp
3. Crossref, “Improving how funding connects to research outputs,” 2026-09-15 — https://www.crossref.org/blog/improving-how-funding-connects-to-research-outputs/
4. Crossref community / Interfaces for Machines, “Refining REST API limits for improved stability and reliability,” 2026-07-21 — https://community.crossref.org/t/refining-rest-api-limits-for-improved-stability-and-reliability/16137
5. Crossref REST API access/authentication docs, checked 2026-09-19 — https://www.crossref.org/documentation/retrieve-metadata/rest-api/access-and-authentication/
6. Crossref REST API filters docs, checked 2026-09-19 — https://www.crossref.org/documentation/retrieve-metadata/rest-api/rest-api-filters/

Repository evidence:

- `Reese-max/academic-mcp@c61d6fac1ab697748ac738382665d930d5361255`
- current Crossref adapter blob: `a63a49a4d908c36f02943ab399a31b01fa9240b1`
- current paper MCP server blob: `a6815e3533217c771a20f4d971c160a9716b7f26`
- Product Board audit: `.github/quality-audits/2026-09-11-1010-product-board-audit.md`
- Fixed-50 Round 2: `.github/quality-audits/2026-09-18T0758Z-50-persona-audit-round-2.md`
- Issue Quality v2: `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md@8167e10798071d2276addaff6b201c6b0e904a2a`

## What Changed

- New actionable repo+provider evidence established Crossref false-empty / false-not-found behavior under non-404 request failures.
- Created and read back #15 after duplicate search across current Issues and active PR scopes.
- July 2026 Crossref rate-policy changes make the adapter's shared placeholder `mailto` materially more relevant, but no outage/frequency claim was invented.
- Elicit's Sep-17 shared research hub is a meaningful competitor strategy shift; only the bounded evidence-context concept maps to product direction, and it was deduped to #1/PR #8.
- Crossref's Sep-15 ROR enrichment supports observation revision/freshness semantics, not a new ROR feature.
- A tempting ChemRxiv vendored-code finding was rejected because the stale adapter is not wired into the current server/tool surface.
- No product source/config/CI/secrets/settings/branch/merge/deploy/worker/GOAL/paid action occurred.

## Classification / scope calibration

- #15: `BUG / P2 / HIGH / NEEDS_REVIEW / auto_implementation=false / NEEDS_RUNTIME_VERIFICATION`.
- #1 remains `RESEARCH / severity NOT_ESTABLISHED`; Elicit's release does not convert a research hypothesis into implementation authority.
- Hard-coded Crossref placeholder mail is treated as current compatibility/rate-limit risk, not proof of owner throttling.
- Provider docs/source establish reachability, not production incidence; no live Crossref request was executed.
- Inventory is `PARTIAL` this round because owner-wide repository enumeration could not be re-executed with the exposed connector action; no repo disappearance/creation is inferred.

## Completion / gaps / cursor

Completed:

- re-read Issue Quality v2 and recorded SHA;
- re-read owner-approved academic-mcp direction/product scope;
- rechecked current focal HEAD and fixed-50 audit;
- rechecked open active PR scopes;
- searched current Issues for Crossref false-empty/mailto overlap before writing;
- performed external direct-competitor, adjacent workflow and provider-contract research using non-GitHub primary sources;
- created #15 and read it back as open;
- wrote a unique central radar report without modifying product code or active PRs.

Gaps:

- full current Reese-max owner-repository pagination could not be repeated with the connector functions exposed in this turn; last verified 41/40 inventory is not promoted to fresh evidence;
- no actual Crossref 429/403/5xx/timeout or normal live query was executed;
- no current owner incident/frequency is known;
- #1 evidence-context value remains research, not user-validated implementation demand.

Fair rotation: historical academic-mcp radar used `spotify-playlist-organizer-mcp` as its next cursor, and no fresh inventory evidence in this run justifies skipping it. **Next cursor: `Reese-max/spotify-playlist-organizer-mcp`.**
