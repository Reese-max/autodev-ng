# External Competitive / New-Product / Workflow Radar — 2026-09-16T00:09:00Z

## Scope, rules, and evidence boundary

- Owner scope: `Reese-max` only; no third-party repository was modified.
- Issue-quality rule: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality-rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh owner pagination: **42 owned repositories; 39 unarchived**. Archived and excluded: `gemini-deidentifier`, `openab`, `obsidian-vault`.
- Prior fair-rotation cursor: `academic-mcp`; this round processed that product deeply.
- Current `academic-mcp` default branch: `main`; HEAD inspected: `e1665f8417eb1894d0c8dbee678c6a9fc6c54b31`.
- The latest HEAD changes after the deployed product work are audit/docs; product-board audit itself identifies `4eb25de5005d33572095ed566ccf00762011bb50` as the product baseline used before later audit-only commits.
- Working portfolio classification remains 36 product-like + 3 support/compatibility-only unless fresh repo evidence changes it.
- No product source, vendored upstream, CI/config, secrets, permissions/settings, implementation branch, merge, deploy, worker, GOAL, paid API request, or production data was changed.
- This radar does **not** declare portfolio CLEAN.

## Product direction re-read — academic-mcp

The owner-approved product-board direction remains **INVEST / SIMPLIFY**: `academic-mcp` is a private, owner-operated research gateway that preserves exact upstream capabilities (81 tools + 7 prompts) behind one authenticated MCP endpoint while storing papers/indexes locally. The current board explicitly prioritizes recovery proof, host-independent admission checks, and least-privilege confinement before provider breadth, public multi-tenant SaaS, native mobile, collaborative workspaces, billing, or an AI synthesis layer.

Existing active scopes were rechecked:

- #2 / open PR #5 — host-independent verification gate;
- #3 / open PR #6 — recovery/cold-start proof;
- #4 / open PR #7 — home-directory confinement;
- #1 / open PR #8 — canonical identity/research-bundle phase-0 schema research;
- #9 / open PR #10 — progressive tool exposure research.

No active PR scope was edited or used as permission to implement a new feature.

## Executive decision

**1 new research Issue, 0 existing Issues modified:** `Reese-max/academic-mcp#12`.

The highest-value new signal is a narrow research-integrity gap in an **already connected source**, not a reason to add a provider or a ledger. Crossref's production API carries post-publication updates such as retractions, corrections and expressions of concern, while the pinned Crossref parser currently normalizes only bibliographic fields and drops `update-to` / `updated-by` from the returned `Paper.extra` surface.

This is source-confirmed data loss at the normalization boundary, but this round did **not** successfully execute a known-retracted DOI through the actual connected MCP gateway: the attempt was rejected by the tunnel layer because this automation context did not supply an active organization context. Therefore no claim is made that a real Reese-max answer has cited a retracted work, and severity remains `NOT_ESTABLISHED` until the bounded runtime experiment is completed.

## External Signals

### A. Direct competitor — Consensus treats retraction status as a first-class research guardrail

**CONFIRMED — current docs updated during the week of 2026-09-16; checked 2026-09-16 UTC.**

Sources:
- https://help.consensus.app/en/articles/10055108-consensus-research-database
- https://help.consensus.app/en/articles/10046838-responsible-ai-limitations

Consensus states that papers it identifies as retracted are visibly marked with a `RETRACTED` badge and are not used in its AI-generated analyses or summaries.

**Job-to-be-Done:** prevent a researcher from unknowingly treating a post-publication-invalidated paper as ordinary evidence.

**Manual step removed:** the user does not have to separately look up every selected DOI in a publisher/Crossref/Retraction Watch page before interpreting a synthesis.

**Onboarding/distribution:** the guardrail is embedded in the normal search/synthesis surface rather than offered as a separate integrity product.

**Transferable principle:** selected evidence should carry visible post-publication status and provenance before consequential synthesis/citation.

**Do not copy:** automatic exclusion as a universal policy. A retracted paper may still be legitimate evidence in historical, meta-research, publication-integrity, or retraction-analysis tasks. `academic-mcp` should first preserve source assertions truthfully, not silently decide the research question.

### A2. Direct competitor strategy — Consensus expands from search to agent/API distribution

**CONFIRMED — API opened self-serve 2026-08-26; summer strategy recap 2026-09-09; checked 2026-09-16 UTC.**

Sources:
- https://help.consensus.app/en/articles/11954907-consensus-product-changelog
- https://consensus.app/home/blog/what-has-changed-in-consensus-summer-26/
- https://consensus.app/home/api/

Consensus now distributes its paper search through API/MCP and its Research Agent chains search, DOI lookup, citation graph and other tools. The API is self-serve. Current first-party pricing says additional API calls cost **US$0.05/call** beyond plan credits; its current plan documentation lists 30 API/MCP calls on Free, and larger paid pools on Pro/Deep/Teams.

**Design signal:** commercial research products are monetizing a managed evidence corpus + workflow, not merely individual search endpoints.

**Transfer to academic-mcp:** none as a new provider this round. The owner-approved product direction explicitly says do not add providers or an AI synthesis layer before reliability gates; paying for Consensus would also duplicate capabilities already present in the private gateway.

### B. Adjacent infrastructure — Crossref makes scholarly-record updates a production metadata primitive

**CONFIRMED — production service current; checked 2026-09-16 UTC.**

Sources:
- https://www.crossref.org/documentation/retrieve-metadata/retraction-watch/
- https://www.crossref.org/services/crossmark/
- https://www.crossref.org/documentation/retrieve-metadata/rest-api/

Crossref's production REST records expose post-publication updates. Retraction Watch assertions appear in `update-to` with a source such as `retraction-watch` or `publisher`; the Retraction Watch dataset is updated every working day. Crossmark is explicitly designed to expose the current status of a work including corrections, retractions and updates.

**Job-to-be-Done:** learn whether the scholarly record changed after initial discovery/download.

**Manual step removed:** no separate search is needed when the DOI already exists and the same source already returns the status metadata.

**Transferable principle:** publication identity and publication status are separate dimensions. A stable DOI does not imply an unchanged or valid evidence state.

**Important limitation:** an update assertion is itself sourced metadata; it can change. The product must preserve source/type/date rather than collapse it into an unqualified boolean truth.

### C. Emerging infrastructure transition — old experimental retraction path is now stale by design

**CONFIRMED — Crossref notice dated 2026-05-29; checked 2026-09-16 UTC.**

Sources:
- https://www.crossref.org/labs/retraction-watch
- https://community.crossref.org/t/deprecating-retraction-watch-annotations-in-the-labs-api/15884

Crossref stopped pushing new Crossmark/Retraction Watch updates to the old Labs annotation integration after the production schema became the supported path. Consumers are directed to production Crossref services / the maintained dataset.

**Product possibility:** if `academic-mcp` later exposes status, it should use the existing production Crossref record for a selected DOI, not stand up a new local mirror or depend on stale experimental endpoints.

## New Releases / capability changes

| Date | Product / infrastructure | Change | Implication |
|---|---|---|---|
| 2026-09-09 | Scite MCP | `citation_graph` allows agent-native citation traversal | Already covered by #1's broader research context; no duplicate graph Issue |
| 2026-09-09 | Consensus | Summer recap positions Research Agent as multi-step workspace rather than search-only | Reinforces owner choice not to compete by cloning a full research SaaS |
| 2026-08-26 | Consensus | API becomes self-serve | New provider is technically easier, but still fails current strategic/duplication gate |
| 2026-08-20 | Crossref | Metadata Manager expands support for post-publication updates | Scholarly-record updates are becoming a normal first-class metadata workflow |
| 2026-05-29 | Crossref | Labs retraction annotations stop receiving new updates | Production Crossref status should be preferred over experimental legacy paths |

## Community Pain / caution signals

These are anecdotal and are **not** prevalence statistics.

### Crossref-only versus Retraction Watch-only coverage can differ

**COMMUNITY_SIGNAL — Zotero forum, 2026-03-31; checked 2026-09-16 UTC.**

https://forums.zotero.org/discussion/130655/retracted-articles-solely-identified-by-the-retraction-watch-database-or-also-by-crossref-api

A user documented a paper that appeared retracted via publisher/Crossref but not in Zotero's then-visible Retraction Watch-backed warning path. The useful signal is not that Zotero is unreliable; it is that integrity sources/paths can differ and a single `is_retracted=true` abstraction can hide provenance.

### Retraction feeds can be temporarily stale or corrected

**COMMUNITY_SIGNAL — Zotero forum, 2026-05-14; checked 2026-09-16 UTC.**

https://forums.zotero.org/discussion/131566/retraction-watch-time-lag

Zotero staff confirmed a temporary update backlog and later fixed it. Other forum cases document incorrect upstream flags that were corrected later. These examples support source + observed-at semantics, not a claim about common error rates.

## Repository evidence — why this is a real candidate, but not yet a proven user incident

At `academic-mcp` HEAD `e1665f8417eb1894d0c8dbee678c6a9fc6c54b31`, the pinned Crossref implementation in `vendor/paper/paper_search_mcp/academic_platforms/crossref.py` receives the raw Crossref work object, then `_parse_crossref_item()` creates `Paper.extra` with publisher, container title, volume, issue, page, ISSN, ISBN, Crossref type, member and prefix. It does **not** carry `update-to`, `updated-by`, Crossmark/current-status or equivalent post-publication update fields.

The same repo explicitly instructs the agent to report unavailable/rate-limited sources truthfully and already distinguishes Semantic Scholar 429 from an empty citation graph. That makes truthful status preservation a better product fit than an opaque automatic exclusion layer.

A live read-only check against the connected `Academic Research` MCP attempted `paper_get_crossref_paper_by_doi` on a public DOI, but the tunnel returned `401 tunnel_active_organization_required`. This is recorded as an execution-environment limitation for this radar only; it is **not** classified as an academic-mcp product failure.

## Opportunity Map — academic-mcp

### MUST MATCH

- Preserve source identity and failure state; `source unavailable` must never mean `no results`.
- When an already-used scholarly source supplies a consequential post-publication status for a selected DOI, do not silently strip it before the client can inspect it.
- Keep the original 81 upstream tools and their semantics inspectable; integration features must not pretend to be upstream capabilities.
- Keep corrections, expressions of concern, retractions, reinstatements and unknown status distinct.

### SHOULD BE BETTER

- For a paper selected for deeper reading/citation, make a bounded publication-status check possible without forcing the user to leave the research workflow and manually query Crossref.
- Show source + observed time + update type/date rather than a context-free warning icon.
- Prefer on-demand DOI checks over maintaining another background database until real workload proves a need.

### DIFFERENTIATOR

- Private/local paper storage plus explicit upstream provenance and uncertainty.
- Preserve retracted/corrected papers as inspectable evidence when the research task requires them; warn rather than silently rewrite the corpus.
- Separate bibliographic identity from current scholarly-record status and from the scientific truth of the claims.

### ADJACENT IDEA

- If #12 proves useful, an optional selected-paper `status receipt` could later attach to #1's research bundle. It is **not** a reason to expand #1 now, and #1/PR #8 remains active and untouched.

### DO NOT COPY

- Do not automatically delete or universally exclude retracted papers.
- Do not mirror the full Retraction Watch dataset as the MVP.
- Do not introduce a `ResearchIntegrityRegistry` / shared ledger framework.
- Do not add Consensus, another paid provider, or a synthesis agent merely because competitors offer them.
- Do not infer `NOT RETRACTED` from absence of an assertion.
- Do not treat Crossref/Retraction Watch metadata as proof that the scientific content is false or true.

## Four-gate decision — #12

### 1. Problem / value

**User:** owner/researcher using the private gateway.

**Observable repo gap:** post-publication status already present in the existing Crossref source is discarded by the current normalized result.

**Existing alternatives:** user/agent can manually leave the MCP workflow and query publisher/Crossref pages. This is functional but introduces a repeat lookup for each selected paper. Existing #1 proposes a larger future evidence layer but is not required to answer the smaller status question.

**Do-nothing impact:** unknown until runtime shows whether the actual connected client has another reliable path. No current incident is claimed.

### 2. Priority

```yaml
issue_quality_version: 2
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: HIGH
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

The direct competitor signal and research-integrity importance do not manufacture P1/P2 severity without a reproduced user-path impact.

### 3. Minimum solution order

1. **No change:** run known DOI fixtures through the actual connected gateway and see whether equivalent status is already visible.
2. **Reuse:** if an existing current tool/field exposes the assertion reliably, document/use it.
3. **Small compatibility path:** if status is genuinely lost, evaluate one bounded read-only DOI status surface using the existing Crossref production API and source/date/type fields.
4. Only after real usage evidence: consider attaching that receipt to a future research bundle.

Do not start with a local retraction database, sync job, new provider, background scanner or general-purpose integrity framework.

### 4. Research / implementation separation

The issue has explicit BUILD/NARROW/REJECT exits. Creating #12 does not authorize a worker or code change. A `BUILD` research result would authorize only a later product decision about the smallest status surface, not the broader #1 architecture.

## Cross-portfolio ideas

### Identity ≠ current status

A persistent identifier says what object is being discussed; it does not prove the object's current validity/state. This may be reusable in other evidence-heavy products, but no cross-portfolio framework or Issue is justified by this one academic case.

## Rejected / deferred ideas

1. **Add Consensus as provider now — REJECT.** Self-serve API makes it easy, but it duplicates search/synthesis and introduces plan/call costs before reliability gates pass.
2. **Build a full research agent — REJECT by owner direction.** Consensus's expansion does not change `academic-mcp`'s private gateway north star.
3. **Mirror Retraction Watch locally — REJECT as first move.** Selected-DOI production Crossref status is smaller and avoids a sync/freshness system.
4. **Auto-exclude retracted papers — REJECT as universal behavior.** Valid historical/meta-research workflows need to inspect them.
5. **Fold #12 into #1 immediately — DEFER.** #1 has active PR #8 and much broader identity/bundle scope; a current status blind spot should be testable independently.
6. **Expand #9 progressive tool discovery — NO NEW EVIDENCE requiring scope change.** #9 has active PR #10; this round did not touch it.
7. **Treat the tunnel 401 from this automation context as a product regression — REJECT.** The error explicitly concerns missing active organization context in this caller and does not prove the owner deployment is down.

## Issue Mapping / coordination

- **Created:** `Reese-max/academic-mcp#12` — `[Competitive Inspiration][Research][RESEARCH_REQUIRED] Validate post-publication status warnings from existing Crossref metadata`.
- Duplicate search before creation covered open/closed Issue text and all-state PR text for retraction/retracted/Crossmark/update-to/post-publication terminology; no matching fingerprint was found.
- Existing #1 mentions source observations / false-empty handling but is a different root and has active PR #8; it was not modified.
- Existing #9 has active PR #10; it was not modified.
- #2/#3/#4 have active PRs #5/#6/#7; no scope or priority was changed.
- Because this round created a new Issue rather than mutating an existing Issue/shared coordination record, no existing Issue lease was taken. There was no follow-up mutation to #12 after creation.
- New Issues: **1**. Existing Issues updated: **0**. Severity upgrades: **0**. Implementation authorizations: **0**.

## Sources

First-party / primary:

1. Consensus research database / retraction handling — checked 2026-09-16: https://help.consensus.app/en/articles/10055108-consensus-research-database
2. Consensus responsible AI / retracted research — checked 2026-09-16: https://help.consensus.app/en/articles/10046838-responsible-ai-limitations
3. Consensus changelog — API self-serve 2026-08-26: https://help.consensus.app/en/articles/11954907-consensus-product-changelog
4. Consensus summer 2026 product recap — 2026-09-09: https://consensus.app/home/blog/what-has-changed-in-consensus-summer-26/
5. Consensus API pricing — checked 2026-09-16: https://consensus.app/home/api/
6. Crossref Retraction Watch production docs — checked 2026-09-16: https://www.crossref.org/documentation/retrieve-metadata/retraction-watch/
7. Crossref Crossmark — checked 2026-09-16: https://www.crossref.org/services/crossmark/
8. Crossref REST API — checked 2026-09-16: https://www.crossref.org/documentation/retrieve-metadata/rest-api/
9. Crossref Labs deprecation notice — updated 2026-05-29: https://www.crossref.org/labs/retraction-watch
10. Crossref community deprecation announcement — 2026-05-29: https://community.crossref.org/t/deprecating-retraction-watch-annotations-in-the-labs-api/15884
11. Crossref Metadata Manager / post-publication updates — 2026-08-20, listed on https://www.crossref.org/blog
12. Scite citation graph MCP — 2026-09-09: https://scite.ai/blog/citation-surfing-scite-mcp

Community / anecdotal:

13. Zotero forum — Crossref-only vs Retraction Watch status, 2026-03-31: https://forums.zotero.org/discussion/130655/retracted-articles-solely-identified-by-the-retraction-watch-database-or-also-by-crossref-api
14. Zotero forum — temporary retraction update lag, 2026-05-14: https://forums.zotero.org/discussion/131566/retraction-watch-time-lag

## What changed since last radar

- Fair rotation moved from `ai-flight-radar` to `academic-mcp`.
- New repo-level finding: the existing Crossref normalization path does not preserve production Crossref post-publication update fields.
- New external direct-competitor evidence: Consensus now makes retraction handling a visible search/synthesis guardrail while also broadening API/MCP distribution.
- A narrow research Issue (#12) was created to verify the actual gateway/client behavior before any product change.
- No broader ledger, provider, synthesis, or tool-discovery scope was authorized.

## Completion, gaps, and next cursor

Completed:

- fresh Reese-max repository pagination/inventory;
- Issue Quality v2 blob verification;
- academic-mcp product-board / owner direction re-read;
- current HEAD and recent-change check;
- existing Issue and all-state PR duplicate/active-scope review;
- public-web direct competitor + adjacent infrastructure + emerging transition research;
- source-level Crossref parser inspection;
- one bounded actual gateway call attempt;
- #12 creation and read-back confirmation;
- this unique report write.

Gaps / `PARTIAL` elements:

- actual connected gateway DOI result could not be observed because the caller's tunnel request lacked active organization context;
- no three-fixture runtime comparison has been executed;
- no real user incident or frequency measurement exists;
- Crossref/Retraction Watch coverage and correctness are source-specific and must not be treated as perfect ground truth;
- no owner-approved implementation is implied.

**Next fair-rotation cursor: `spotify-playlist-organizer-mcp`.**
