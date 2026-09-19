# External Competitive Radar — 2026-09-19T22:07:00Z

Status: **COMPLETE**

## Scope / Direction Check

- Issue Quality v2: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected GitHub owner inventory was enumerated in this run: **41 Reese-max-owned repositories / 40 unarchived**. `obsidian-vault` is archived and excluded from active-product rotation. No older inventory was assumed to be exhaustive.
- Fair-rotation focal repository: `Reese-max/cf-mcp-server`.
- Current default HEAD checked immediately before write: `main@a3192b6d7be2b21285745b648ce064957b4c2d16` (`docs(audit): add cf-mcp-server product board review`). Current product-code baseline beneath audit-only commits remains `d35db0e6de04f8b9c1eda28c32cc04da6077643d`.
- Owner-approved direction from the 2026-09-18 Product Board remains `REPOSITION / SIMPLIFY / MAINTAIN`: treat this repo as a **private approval/audit gateway for high-risk Cloudflare changes**, while using official Cloudflare MCP/API surfaces for broad discovery/read access where sufficient.
- Explicit non-goals remain: broad API catalog, generic IAM platform, marketplace, multi-tenant SaaS, autonomous production promotion, second tool registry, mobile-native surface, or a new cross-repository control plane.
- Existing active work was not taken over: open PRs #7, #10, #11, #12, #13, #14, #16, #17, #18 remain owned by active branches. This radar did not edit their scope or comments.
- No product source, CI/config, secrets, repository permissions/settings, implementation branch, deployment, GOAL/worker, paid service, or production data was changed.

## Current Repository Evidence

The focal product's safety promise depends on exact-target changes, explicit confirmations, D1 audit logging, and truthful deployment/action receipts.

Current source shows a distinct post-effect failure boundary:

- `src/types.ts::auditLog()` performs an awaited D1 `INSERT INTO audit_log ... .run()` with no post-effect degradation path.
- `src/tools/l2-preview.ts` performs several remote Cloudflare mutations **before** awaiting the audit insert:
  - `deploy_preview`: Pages POST → audit INSERT → return result.
  - `put_kv_value`: KV PUT → audit INSERT → return success.
  - `execute_d1` (non-dry-run): D1 write query → audit INSERT → return result.
  - `upload_r2_object`: R2 PUT → audit INSERT → return success.
  - `create_d1_database`: create database → audit INSERT → return result.
- `src/tools/l3-deploy.ts::confirm_action` atomically consumes a confirmation, performs the external action, then awaits the success audit before returning `Action confirmed and executed`.

Therefore an audit-D1 failure after a successful/accepted Cloudflare API result can make the MCP handler reject before it returns a truthful effect receipt. This is not a hypothetical “missing ledger/framework” finding; it is the ordering/coupling of an already-supported write path.

Contrary evidence / severity brake:

- No production incident, duplicate mutation, D1 quota exhaustion, or account plan is known from this run.
- For confirmed L3 actions, a D1 failure that occurs **before** atomic confirmation consumption already blocks the external effect; the ambiguous window is specifically after the effect and before the success receipt is returned.
- Existing Workers confirmation code already warns operators to inspect remote state after a failed deployment attempt; this proves the product understands ambiguous external outcomes, but the generic post-effect audit-failure case is not handled consistently across the write surface.

## Product → Market Category

1. Private MCP operations gateway / privileged agent control plane.
2. Cloudflare operations and deployment tooling.
3. Human-confirmed agentic write workflows.
4. MCP admission, OAuth, tool exposure and policy controls.
5. Operational audit / effect receipts for agent-triggered changes.

Competitor/platform capability is not treated as a requirement by itself.

## External Signals

### 1. CONFIRMED — D1 now has a documented hard query-failure condition on Workers Free

**Published: 2026-09-01. Checked: 2026-09-20 (Asia/Taipei).**

Source: https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/

Cloudflare now enforces D1 Free-plan daily row-read/row-write limits. When the daily limit is exceeded, D1 queries through both the Workers Binding API and REST API return errors until midnight UTC; stored data remains intact.

This is materially relevant because `cf-mcp-server` uses D1 as the synchronous audit store. It does **not** prove this account is Free or near quota, and it is not evidence of a current outage. It does, however, provide a first-party current failure mode in which audit writes can hard-fail independently of a Cloudflare mutation that has already completed through another API.

Transferable principle: **effect truth and audit-persistence truth must be distinguishable.** An audit write failure must not silently convert “remote effect was accepted/succeeded” into “the effect failed,” nor should it authorize automatic retry.

### 2. CONFIRMED — Cloudflare is absorbing generic MCP tool exposure / aggregation into MCP server portals

**Current documentation published/updated: 2026-09-19. Checked: 2026-09-20.**

Source: https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/

Current MCP server portal documentation supports:

- per-tool/per-prompt enable/disable;
- an allowlist pattern with `default_disabled=true` and explicit enabled tools;
- per-session server toggling and OAuth state;
- context minimization and search/execute proxy modes;
- Code Mode that replaces large upstream tool catalogs with a small execution surface.

This reinforces the existing Product Board direction: `cf-mcp-server` should not become a generic MCP registry, broad discovery layer or marketplace. The differentiated local value remains owner-specific exact-target approval, recovery truth, confirmation binding, allowlists and action receipts.

What not to copy: portal/session management, generic tool aggregation, registry UX, and Code Mode do not need to be recreated in this private server.

### 3. CONFIRMED — Cloudflare API MCP / Wrangler now expose optional OAuth scopes

**Published: 2026-08-22. Checked: 2026-09-20.**

Source: https://developers.cloudflare.com/changelog/post/2026-08-22-wrangler-mcp-optional-oauth-scopes/

Users can decline optional scopes while keeping required scopes, and a tool that needs a declined permission requires reauthorization.

This is a strong least-privilege market pattern, but **not a new Issue here**. The 2026-09-18 Product Board already placed fine-grained OAuth scopes in `LATER`, conditional on a real owner workflow demonstrating that the current single `scope=mcp` contract is insufficient. No new owner pain or authorization requirement was observed this run.

### 4. CONFIRMED — Cloudflare Gateway can detect and policy-gate MCP traffic

**Published: 2026-08-12. Checked: 2026-09-20.**

Source: https://developers.cloudflare.com/changelog/post/2026-08-12-mcp-detection-and-dashboard/

Gateway can detect MCP traffic and define policies such as blocking MCP traffic that does not arrive through an approved MCP portal.

Transferable implication: network/enterprise admission policy can increasingly live outside this repository. This is further evidence against expanding `cf-mcp-server` into a generic enterprise IAM/policy platform.

## New Releases / Market Moves

| Date | Product / platform | Signal | Confidence | Radar consequence |
|---|---|---|---|---|
| 2026-09-01 | Cloudflare D1 | Free-plan daily query limits now cause hard query errors until reset | CONFIRMED | Exposes a concrete audit-store failure mode relevant to post-effect receipt truth |
| Current docs 2026-09-19 | Cloudflare MCP server portals | Tool allowlisting, server/session controls, context optimization and Code Mode are platform-managed | CONFIRMED | Reinforces `REPOSITION / SIMPLIFY`; do not rebuild generic MCP aggregation |
| 2026-08-22 | Cloudflare API MCP / Wrangler | Optional OAuth scopes selectable at authorization | CONFIRMED | Keep as existing LATER least-privilege signal; no duplicate Issue |
| 2026-08-12 | Cloudflare Gateway | MCP protocol detection and policy selector | CONFIRMED | Generic network admission belongs upstream when needed |
| 2026-08-25 | Cloudflare MCP portals | MCP `2026-07-28` support | CONFIRMED / dedupe | Already covered by Issue #6 / PR #17; no new scope |

## Community Pain

No community signal was retained this round. First-party Cloudflare documentation plus deterministic repository evidence were sufficient, and available community anecdotes would not improve the priority decision or establish incidence.

## Adjacent Ideas

### A. Outcome receipts should separate effect status from audit status

Useful minimal shape for write tools:

- `effect_status = VERIFIED | ACCEPTED | FAILED | UNKNOWN`
- `audit_status = PERSISTED | UNAVAILABLE`
- explicit safe target identity / read-back evidence when already available
- explicit `DO_NOT_BLINDLY_RETRY` when the external effect may already have happened

This is an **implementation shape for the concrete bug**, not a mandate to build a shared receipt framework across repositories.

### B. Use official MCP portal / Gateway controls instead of adding generic policy layers

If a future deployment needs broader user/tool admission, official portal allowlists and Gateway policy are lower-ownership substitutes. They do not replace this repo's owner-specific confirmation/effect contract, but they reduce justification for generic IAM expansion.

### C. Optional scopes remain a research backlog item, not a blocker

The official Cloudflare API MCP demonstrates the pattern, but current owner use is a private trusted gateway and the Product Board explicitly requires a concrete least-privilege workflow before changing the scope model.

## Opportunity Map — `cf-mcp-server`

| Bucket | Decision | Evidence / reason |
|---|---|---|
| MUST MATCH | Truthful post-effect outcome even when the audit datastore fails | Current write-path ordering + current D1 documented failure mode; core recovery/safety contract |
| MUST MATCH | Exact target / one-time confirmation / allowlist / no blind retry | Existing differentiated product contract; do not regress |
| SHOULD BE BETTER | Explicit `effect_status` vs `audit_status` in degraded cases | Smaller and safer than generic retry/queue machinery |
| DIFFERENTIATOR | Private high-risk Cloudflare approval/audit gateway with operator-readable receipts | Product Board-approved positioning; official Cloudflare tooling covers generic breadth |
| ADJACENT IDEA | Tool exposure / optional scope restriction via official portal/Cloudflare OAuth | Useful substitute/integration pattern, but no local need justifies internal duplication now |
| DO NOT COPY | Broad API catalog, portal/session registry, generic IAM, Code Mode implementation, marketplace, autonomous promotion | Platform-owned or outside approved scope |

## Four-Gate Decision

### Candidate: post-effect audit failure hides a successful mutation

Fingerprint:

`cf-mcp-server + Cloudflare write succeeds + post-effect D1 audit INSERT fails + tool call rejects before returning a truthful receipt + operator cannot distinguish succeeded-vs-failed and may retry`

Classification:

- `kind=BUG`
- `severity=P2`
- `decision_priority=HIGH`
- `evidence=SOURCE_CONFIRMED`
- `triage=NEEDS_REVIEW`
- `auto_implementation=false`
- runtime status: `NEEDS_RUNTIME_VERIFICATION`

### Gate 1 — Problem / value

Target user: owner/small trusted operator performing supported Cloudflare writes through the MCP gateway.

Observable break: several supported mutation handlers perform the external effect and only afterwards await a D1 audit INSERT. If that INSERT fails, the caller can receive a failed tool call despite the effect having happened. The concrete user cost is recovery ambiguity and risk of manual/agent retry.

Existing capability is not sufficient: confirmation replay protection protects repeated confirmation codes, but it does not give the caller truthful outcome when the post-effect audit persistence fails. Read-only audit history also cannot reconstruct an event that failed to persist.

Contrary evidence: no real incident or quota exhaustion was observed; current account plan is unknown. This prevents P1 inflation.

### Gate 2 — Priority

P2 is established from source because a reachable supported write path can materially impair recovery/completion semantics. P1 is not established: no production incident, widespread unavailability or demonstrated current quota condition exists.

`decision_priority=HIGH` because the bug conflicts directly with the approved private-safety-gateway positioning, but that does not grant implementation authority.

### Gate 3 — Minimum approach

Do not silently make audit logging best-effort and do not add a queue/outbox/second database.

Minimum effective change:

1. Preserve fail-closed behavior for required **pre-effect** D1 state/confirmation writes.
2. After the remote effect has already returned, catch audit persistence failure separately.
3. Return a structured degraded receipt that truthfully reports what is known about the effect plus `audit_status=UNAVAILABLE` and tells the caller not to blindly retry.
4. Keep one-time confirmations consumed after an external effect; audit failure must not re-open authority.
5. Reuse existing remote read-back when a tool already has it; otherwise distinguish ACCEPTED from VERIFIED.

Why smaller alternatives are insufficient: documentation alone cannot prevent an agent/tool caller from receiving a generic failure after a successful mutation. Why larger alternatives are unnecessary: the root cause is result coupling, not absence of an event platform.

### Gate 4 — Research / implementation separation

This is a BUG, not a speculative feature. A deterministic source path is sufficient to open tracking, but implementation remains `NEEDS_REVIEW / auto_implementation=false`.

Closure requires bounded evidence:

- local/test-double scenario where remote effect returns success and the post-effect audit insert throws;
- exactly one remote mutation occurs;
- caller receives a degraded truthful receipt, not a generic action failure;
- pre-effect audit/confirmation failure still performs zero external effect;
- confirmed-action code remains consumed after effect;
- no secrets leak.

A harmless isolated end-to-end fault-injection test is sufficient for runtime verification. Do **not** deliberately exhaust a production D1 quota.

Result: **NEW ISSUE CREATED — `Reese-max/cf-mcp-server#19`.**

## Rejected / Deduplicated Ideas

1. **Build an audit queue/outbox/event-sourcing layer now — REJECT.** No evidence yet that a durable secondary pipeline is required; it adds state, recovery and operational ownership beyond the concrete bug.
2. **Add generic retry middleware around mutations — REJECT.** Retrying after an ambiguous external outcome can duplicate/destructively repeat effects.
3. **Add fine-grained OAuth scopes now — HOLD / DEDUPE.** External Cloudflare capability is real, but the Product Board already requires a real least-privilege workflow before doing this.
4. **Implement MCP portal/Code Mode locally — REJECT.** Official Cloudflare platform already provides aggregation/context optimization; it is opposite to the approved private-gateway positioning.
5. **Open another MCP 2026-07-28 Issue — DEDUPE.** Issue #6 / PR #17 already own that fingerprint.
6. **Open another gradual deployment Issue — DEDUPE / SKIPPED_LOCKED.** Issue #8 with PR #12/#14 is active.
7. **Expand Tool Contract Manifest — DEDUPE / SKIPPED_LOCKED.** Issue #15 / PR #16 already owns that research fingerprint.

## Issue / PR Mapping

- **NEW:** `cf-mcp-server#19` — `[BUG][P2][AUDIT] Post-effect D1 audit failure can hide a successful Cloudflare mutation`
  - `SOURCE_CONFIRMED`
  - `NEEDS_REVIEW`
  - `auto_implementation=false`
  - `NEEDS_RUNTIME_VERIFICATION`
  - URL: https://github.com/Reese-max/cf-mcp-server/issues/19
- Existing #5, #6, #8, #9, #15 were not rewritten.
- Active PRs #7, #10, #11, #12, #13, #14, #16, #17, #18 were not commented on or modified.
- No lock was taken on an existing Issue because this was a new, de-duplicated fingerprint and no matching branch/PR/lease was found.

## Cross-portfolio Ideas

One reusable principle is worth retaining centrally, but **not** opening cross-repo work without local evidence:

> For an externally mutating tool, `remote effect truth`, `verification/read-back truth`, and `local audit persistence truth` are separate states. A failure in the last layer must not rewrite the first two.

Future portfolio audits can check this fingerprint only where a repository actually performs external writes followed by local receipt/audit persistence. Do not create a generic framework first.

## Sources

### External / first-party

1. Cloudflare D1 changelog — D1 enforces Free-plan daily query limits, 2026-09-01: https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/
2. Cloudflare MCP server portals — current documentation checked 2026-09-20: https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/
3. Cloudflare API MCP / Wrangler optional OAuth scopes, 2026-08-22: https://developers.cloudflare.com/changelog/post/2026-08-22-wrangler-mcp-optional-oauth-scopes/
4. Cloudflare Gateway MCP detection/policy, 2026-08-12: https://developers.cloudflare.com/changelog/post/2026-08-12-mcp-detection-and-dashboard/
5. Cloudflare MCP portals support MCP 2026-07-28, 2026-08-25: https://developers.cloudflare.com/changelog/product-group/cloudflare-one/

### Repository evidence

- `cf-mcp-server/main@a3192b6d7be2b21285745b648ce064957b4c2d16`
- product-code baseline `d35db0e6de04f8b9c1eda28c32cc04da6077643d`
- `src/types.ts`
- `src/tools/l2-preview.ts`
- `src/tools/l3-deploy.ts`
- `README.md`
- `.github/quality-audits/2026-09-18T1700Z-product-board-audit.md`
- all-state Issues / PRs and branch list inspected before write

## What Changed This Round

- **1 new source-confirmed P2 BUG** opened: #19.
- **0 existing Issues modified/comments added.**
- **0 PR comments or scope changes.**
- **0 product-code / CI / config / secret / permission changes.**
- **0 implementation authorization.**
- Fresh external evidence clarified that D1 audit persistence is itself a failure domain; this does not overturn the product strategy, but it exposes a missing truthful-degradation path in a core differentiated safety property.
- Cloudflare's continued expansion of MCP portals, optional OAuth scopes and Gateway policy **strengthens**, rather than reverses, the existing `REPOSITION / SIMPLIFY / MAINTAIN` decision.

## Completion / Gaps / Cursor

- Fresh inventory: **41 owned / 40 unarchived**.
- Rules blob SHA confirmed: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Focal default HEAD confirmed before report write: `a3192b6d7be2b21285745b648ce064957b4c2d16`.
- No actual D1 quota exhaustion, production mutation, live OAuth grant, live canary, or destructive action was executed. #19 remains `NEEDS_RUNTIME_VERIFICATION`.
- Account plan/free-tier status is **UNKNOWN** and was not inferred from the external D1 changelog.
- This radar does **not** declare `cf-mcp-server` or the portfolio CLEAN.
- Next fair-rotation target: `Reese-max/tick-stock-panel`.
