# External Competitive / New-Product / Workflow Radar — 2026-09-20T16:02:47Z

## Status / scope / evidence boundary

- Run status: **COMPLETE / NO_NEW_ACTIONABLE_ISSUE**.
- Governing rule re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected owner inventory: full pagination returned **42 Reese-max-owned repositories / 41 unarchived**; page 2 was empty. `obsidian-vault` is the only archived repository and is excluded from active scope.
- Fair-rotation focal repository: `Reese-max/academic-mcp`, continuing the previous radar cursor.
- Current default branch / HEAD: `main@c61d6fac1ab697748ac738382665d930d5361255`. Current repo audit identifies the latest product-changing baseline as `4eb25de5005d33572095ed566ccf00762011bb50`; newer commits are audit/docs evidence.
- Owner direction remains **INVEST / SIMPLIFY**: private, owner-operated, local-first academic MCP gateway preserving the three pinned upstreams, 81 tools + 7 prompts, local papers/indexes, source-specific semantics, and truthful degraded-provider state. Explicit non-priorities remain provider breadth for its own sake, public multi-tenant SaaS, native mobile product work, collaborative workspace scope, billing/growth features, and opaque AI synthesis.
- Existing scopes checked before this report: #1/PR #8 ResearchBundle/identity, #2 with PR #5/#13 verification gate, #3/PR #6 recovery, #4/PR #7 service confinement, #9/PR #10 progressive exposure, #12 post-publication status research, #14 OpenAlex false-empty bug, #15 Crossref false-empty bug. No active scope was modified.
- No product source, CI/config, secrets, permissions/settings, branch, merge/deploy, paid request, implementation worker, or GOAL was started. No live provider request was needed for the conclusions below.
- Portfolio CLEAN is **not declared**.

## Product → market category

`academic-mcp` is a private scholarly-research infrastructure product: one authenticated MCP entry point over heterogeneous academic providers, with local persistence and explicit source/error semantics. Its defensible job is not hosted literature-search breadth; it is **inspectable research access whose server, tunnel, host registration, source result, and local evidence can be distinguished rather than flattened into one opaque success flag**.

## External Signals

### A. CONFIRMED — OpenAI is moving local MCP integrations onto `tunnel_id`; current architecture is already aligned

**Current official documentation, checked 2026-09-20 UTC; policy cutoff stated by OpenAI: models released after 2026-09-01.**

Sources:
- https://developers.openai.com/zh-Hant/api/docs/guides/tools-connectors-mcp
- https://developers.openai.com/de-DE/api/docs/guides/secure-mcp-tunnels

OpenAI now documents `connector_id` as legacy for models released after 2026-09-01. Remote MCP servers use `server_url`; local/private MCP servers reachable through Secure MCP Tunnel use `tunnel_id`. The Secure MCP Tunnel guide explicitly says not to pass the OpenAI-hosted tunnel endpoint as `server_url`.

Repository truth: `academic-mcp` already runs the official tunnel client as a separate service, and deployment evidence records a real tunnel plus ChatGPT tool registration. No repo use of `connector_id` was found. Therefore this is **positive compatibility evidence**, not a migration defect.

**Decision:** MUST MATCH / already aligned. Do not create a “connector migration” Issue and do not replace the private local gateway with a public remote server just because the platform contract changed.

### A2. CONFIRMED — ChatGPT MCP app tool definitions are a frozen host snapshot until reviewed/refreshed

**Current official ChatGPT developer-mode/MCP-app documentation, checked 2026-09-20 UTC.**

Source:
- https://help.openai.com/articles/12584461-developer-mode-apps-and-full-mcp-connectors-in-chatgpt-beta

OpenAI documents that after an MCP app is approved, ChatGPT uses a frozen snapshot of the available tools/inputs. Later server changes are not automatically activated; incompatible tool-definition changes can make calls fail until an administrator/owner reviews and publishes the updated actions. The same page states that there is no automatic user/admin prompt when such a refresh is needed.

**User job:** after an upstream refresh or gateway schema change, know whether “the server exposes 81 correct tools” and “ChatGPT is currently using those same definitions” are both true.

**Repository evidence:** current deployment verification proves direct gateway parity and records a historical ChatGPT registration of 81 tools, but the repo does not contain a host-snapshot refresh/review procedure. `scripts/check.py` can prove current server parity; it cannot prove the connected ChatGPT app has re-approved that exact schema revision.

This is a real platform contract but **not a current product failure**: no tool-schema drift between the approved ChatGPT app and the current server was observed in this run, and the current product-changing baseline is unchanged. #2/PR #13 already owns the portable admission-gate scope and explicitly separates ChatGPT/live-host checks from offline CI.

Candidate classification retained centrally only:

```yaml
kind: VALIDATION_GAP
severity: P3
decision_priority: MEDIUM
evidence: NEEDS_EVIDENCE
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

**Smallest future check, only when a tool schema actually changes:** refresh/review the ChatGPT app tool snapshot, record the server manifest/tool-schema hash + host review timestamp, then rerun the existing representative ChatGPT calls. No schema registry, host-sync daemon, database, or new deployment service is justified.

### A3. CONFIRMED — current ChatGPT custom MCP apps are web-only; “mobile not yet tested” is not an actionable validation gap today

The same OpenAI help page currently states that MCP apps are available on the web, not mobile. `academic-mcp/DEPLOYMENT.md` currently lists “手機原生 App 尚未實測” as a remaining limitation.

**Calibration:** treat this as `UNSUPPORTED_BY_CURRENT_HOST`, not `NEEDS_MOBILE_RUNTIME_VERIFICATION`. The product board already says native mobile is not a priority, so no Issue is needed and no mobile test should be scheduled merely to close an impossible current host path. Re-evaluate only when OpenAI documents mobile support.

This is a useful scope reduction rather than a feature request.

### B. CONFIRMED — Crossref is keeping its Data Citations endpoint in beta for another six months

**Published 2026-09-18; checked 2026-09-20 UTC.**

Sources:
- https://community.crossref.org/t/continuing-the-data-citations-api-endpoint-in-beta-format/16404
- https://www.crossref.org/documentation/retrieve-metadata/data-citations

Crossref says the standalone Data Citations API will remain beta for another six months. It exposes deposited links between research works and datasets, currently with beta stability/format caveats and a documented delay before newly deposited relationships appear.

**Portable idea:** papers and datasets can be separate evidence objects connected by a source observation; reproducibility work increasingly treats dataset linkage as first-class provenance.

**Why this does not become an Issue:** current owner direction explicitly rejects adding providers/capabilities merely for breadth, there is no observed owner workflow requiring dataset-citation traversal, and #1 already owns the broader evidence-identity/revision research. Adding a beta endpoint now would create a new provider surface before the existing reliability gates are complete.

Classification: `ADJACENT_IDEA / HOLD`.

### C. DUPLICATE CONFIRMED SIGNALS — no scope change

- Elicit, 2026-09-17: Library became a shared research hub whose Research Agent can use/save collection evidence. Already recorded in the 2026-09-19 academic-mcp radar and maps to #1/PR #8; team/collaboration scope remains DO NOT COPY. https://elicit.com/blog/library-into-resesearch-hub
- Scite, 2026-09-09: MCP `citation_graph` supports forward/backward citation traversal. Already recorded and maps to #1; current Semantic Scholar capabilities mean there is no reason to build a second citation graph. https://scite.ai/blog/citation-surfing-scite-mcp
- Crossref, 2026-07-21 current rate-limit contract: already the external trigger/support for #15. No new severity or implementation authorization is created in this round.

## Community Pain

### COMMUNITY_SIGNAL — custom MCP availability can disappear across ChatGPT conversation turns

Recent OpenAI Developer Community reports (2026-08-25 through 2026-09-12) describe custom MCP tools becoming unavailable in normal ChatGPT conversations after successful calls, while the MCP server itself received the earlier calls successfully:

- https://community.openai.com/t/custom-mcp-connector-disappears-after-successful-invocation-in-chrome-web-chat-and-desktop-chat-no-second-request-reaches-mcp-server/1392606

This is not used as prevalence or as proof of an `academic-mcp` defect. OpenAI's current app documentation also makes clear that app selection/tool exposure is host-managed and per-message behavior can differ from server availability. No current OpenAI status incident was found for this exact 2026 multi-turn report.

**If the owner later reproduces this with Academic Research:** record server/tunnel health separately from ChatGPT host exposure before changing the MCP server. A host-side disappearance should not be “fixed” by adding retries/provider routing to the gateway.

## New Releases / Market Moves

| Date / state | Product / platform | Signal | Confidence | Consequence |
|---|---|---|---|---|
| Current docs; post-2026-09-01 model rule | OpenAI MCP | `connector_id` legacy; local MCP uses Secure MCP Tunnel / `tunnel_id` | CONFIRMED | Current architecture already aligned; no migration Issue |
| Current docs | ChatGPT MCP apps | Approved tool/action definitions are frozen until reviewed/refreshed after server changes | CONFIRMED | Keep host-registration truth separate from server parity; future schema-change smoke only |
| Current docs | ChatGPT MCP apps | Custom MCP app support is web-only, not mobile | CONFIRMED | Reclassify mobile smoke from unknown to unsupported-by-host; do not spend effort now |
| 2026-09-18 | Crossref | Data Citations endpoint remains beta another six months | CONFIRMED | Adjacent provenance idea only; no new provider surface |
| 2026-09-17 | Elicit | Agent can work from persistent Library collections | CONFIRMED / already covered | Duplicate support for #1; no scope change |

## Opportunity Map — `academic-mcp`

### MUST MATCH

- Preserve the distinction between **server parity**, **tunnel health**, **ChatGPT host registration/snapshot**, and **actual provider result**.
- Provider failure must remain different from confirmed absence (#14/#15).
- A future tool-schema change must not be called “deployed to ChatGPT” from server-side parity alone.

### SHOULD BE BETTER

- When the gateway is deliberately refreshed, leave one bounded host receipt tying the approved app/tool snapshot to the exact server revision.
- Use external host capability facts to remove impossible validation work rather than accumulate perpetual “not tested” checkboxes.

### DIFFERENTIATOR

- Local/private research data and explicit upstream revisions.
- Source-specific degraded states rather than opaque synthesis.
- Exact heterogeneous tool semantics preserved behind one owner-controlled entry point.

### ADJACENT IDEA

- Dataset citations as an optional evidence relationship if a real owner workflow later demands it; do not add the beta Crossref endpoint preemptively.

### DO NOT COPY

- Elicit shared-team workspace scope.
- Scite licensed citation-classification/full-text product.
- Another provider merely for catalog breadth.
- Mobile-native work while the current ChatGPT MCP host does not support mobile apps.
- A host-snapshot registry/daemon before one actual schema-refresh problem is observed.

## Four-gate decisions

### Candidate: host tool-snapshot freshness

1. **Problem/value:** official platform docs establish a possible drift boundary after server tool-schema changes; repo server parity does not prove host snapshot freshness. No current drift/failure was observed.
2. **Priority:** `VALIDATION_GAP / P3 / MEDIUM / NEEDS_EVIDENCE`; no P2/P1 because there is no current failed supported path or measured frequency.
3. **Smallest solution:** when a schema changes, manually review/refresh the app and run existing representative calls, recording one revision-bound receipt. Documentation/checklist first; no new service/database.
4. **Research/implementation separation:** no Issue created now because the trigger has not occurred and #2/PR #13 is active. If a future schema change produces mismatch, create/update the smallest deployment-validation tracking item then.

### Candidate: Crossref Data Citations API

1. No observed current user job gap.
2. `OPPORTUNITY / NOT_ESTABLISHED / LOW-MEDIUM / NEEDS_EVIDENCE`.
3. Do nothing now; if future research genuinely needs datasets, first test one public DOI→dataset relationship manually against existing workflows.
4. Beta endpoint availability does not grant implementation authority.

## Rejected Ideas / negative findings

1. **Open “migrate off connector_id” Issue — REJECT.** Current repository is already tunnel-based and no `connector_id` usage was found.
2. **Create a mobile runtime-validation Issue — REJECT.** Current host documentation says custom MCP apps are web-only; this is unsupported rather than untested.
3. **Create a host-tool-registry service — REJECT.** A manual refresh receipt on actual schema changes is smaller and sufficient until evidence says otherwise.
4. **Add Crossref Data Citations provider now — REJECT/DEFER.** New beta breadth without a validated owner workflow conflicts with current product direction.
5. **Turn the community multi-turn ChatGPT report into an academic-mcp bug — REJECT.** No owner reproduction or first-party incident evidence; host/client behavior must be separated from server health.
6. **Rewrite #1/#2/#9 with fresh market evidence — SKIPPED_ACTIVE_SCOPE.** Existing PRs #8/#13/#10 are active; new evidence is preserved here without stealing scope.

## Issue Mapping

- New Issues: **0**.
- Existing Issue comments/edits: **0**.
- PR comments/edits: **0**.
- Implementation authorizations: **0**.
- Locks: none required because no Issue/shared-state mutation was attempted.
- Existing relevant scopes remain #1/#2/#3/#4/#9/#12/#14/#15.

## Sources

Primary public sources checked this round:

1. OpenAI, MCP servers/tools and connector migration — current docs checked 2026-09-20: https://developers.openai.com/zh-Hant/api/docs/guides/tools-connectors-mcp
2. OpenAI, Secure MCP Tunnels — current docs checked 2026-09-20: https://developers.openai.com/de-DE/api/docs/guides/secure-mcp-tunnels
3. OpenAI Help, Developer mode / MCP apps — current docs checked 2026-09-20: https://help.openai.com/articles/12584461-developer-mode-apps-and-full-mcp-connectors-in-chatgpt-beta
4. Crossref, Data Citations beta continuation — 2026-09-18: https://community.crossref.org/t/continuing-the-data-citations-api-endpoint-in-beta-format/16404
5. Crossref, Data Citations documentation — current docs checked 2026-09-20: https://www.crossref.org/documentation/retrieve-metadata/data-citations
6. Elicit Library shared research hub — 2026-09-17: https://elicit.com/blog/library-into-resesearch-hub
7. Scite citation surfing / `citation_graph` — 2026-09-09: https://scite.ai/blog/citation-surfing-scite-mcp
8. OpenAI Developer Community multi-turn custom MCP report — Aug/Sep 2026: https://community.openai.com/t/custom-mcp-connector-disappears-after-successful-invocation-in-chrome-web-chat-and-desktop-chat-no-second-request-reaches-mcp-server/1392606

## What Changed

- **No new actionable product fingerprint passed Issue creation gates.**
- New first-party platform evidence clarifies a deployment boundary: a correct/current server tool catalog is not automatically the same as ChatGPT's approved tool snapshot after future schema changes.
- New first-party platform evidence also removes a false validation obligation: current custom MCP app mobile support is absent, so mobile is `UNSUPPORTED_BY_HOST`, not a current product validation gap.
- The repository's existing Secure MCP Tunnel approach is aligned with OpenAI's current post-2026-09-01 MCP connection direction.
- Crossref Data Citations remains an adjacent evidence/provenance possibility but does not justify adding a beta provider.
- Severity upgrades: **0**. Issue scope expansions: **0**. Implementation authorizations: **0**.

## Completion / gaps / cursor

- Fresh inventory pagination completed: 42 owned / 41 unarchived; page 2 empty.
- Focal repo direction, HEAD, existing Issues/PRs and prior academic-mcp radar were rechecked.
- External direct competitor / platform / scholarly-infrastructure sources were rechecked with first-party sources prioritized.
- No runtime provider call was executed; no runtime success/failure is claimed.
- Next fair-rotation cursor: `Reese-max/spotify-playlist-organizer-mcp`.
