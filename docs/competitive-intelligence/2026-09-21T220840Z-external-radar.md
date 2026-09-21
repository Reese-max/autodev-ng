# External Competitive / New Product / Workflow Radar — 2026-09-21T22:08:40Z

Status: **COMPLETE / MATERIAL STRATEGY SIGNAL / 0 NEW ISSUES**

## Scope / direction / evidence boundary

- Primary market intelligence source this round: public web outside Reese-max GitHub. GitHub was used for current owner inventory, source truth, dedupe, active-work coordination and report persistence.
- Issue-quality source: `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected-GitHub owner pagination completed: **42 Reese-max-owned repositories / 41 unarchived**; `obsidian-vault` is the only archived repository. Page 2 was empty. Older inventories were not treated as exhaustive.
- Fair-rotation focus inherited from the latest radar: `Reese-max/cf-mcp-server`.
- Current default HEAD rechecked immediately before report write: `main@a3192b6d7be2b21285745b648ce064957b4c2d16` (`docs(audit): add cf-mcp-server product board review`). The Product Board records the product-code baseline beneath audit-only commits as `d35db0e6de04f8b9c1eda28c32cc04da6077643d`.
- Owner-approved direction remains `REPOSITION / SIMPLIFY / MAINTAIN`: this repository is a private approval/audit gateway for high-risk Cloudflare changes; official Cloudflare tooling should carry generic breadth/read-discovery where sufficient.
- Explicit current non-goals remain broad API replication, marketplace/multi-tenant SaaS, generic IAM, second tool registry, autonomous production promotion, custom mobile surface and cross-repository deployment framework.
- Existing open PR work was rechecked; this radar did not take over or comment on any active implementation scope.
- No product source, CI/config, secret, permission/setting, branch, merge, deploy, GOAL/worker, paid service, Cloudflare token, production data or external Cloudflare resource was changed.
- No live Cloudflare credential introspection was attempted. Therefore the permissions of the currently deployed `CF_API_TOKEN` are **UNKNOWN** and are not inferred from source code.

## Current repository evidence

Current `main` establishes two distinct authority layers in source, but only one is directly observable here:

1. Application-side target restriction: `getAllowedProjects()` / `assertProject()` use `ALLOWED_PROJECTS` to restrict named project targets.
2. Cloudflare backend credential: the environment exposes one `CF_API_TOKEN`; common L1/L2/L3 paths pass that same token to Cloudflare APIs. Current source does not itself prove how narrowly that token is scoped in the Cloudflare account.

This matters because the Product Board previously identified `owner-specific authority minimization` as a `SHOULD BE BETTER` property and `exact-version confirmation + audit` as differentiated value. The new external platform capability below changes which layer should own coarse resource authorization.

## Product → market category mapping

- Private MCP operations / privileged agent gateway.
- Cloudflare deployment and resource administration tooling.
- Human-confirmed high-risk agent writes.
- Backend service-account / API-token least privilege.
- Operational audit, recovery and effect receipts.

The radar does not assume a platform feature must be copied. The question is whether the external change removes work or risk that this product should no longer own itself.

# External Signals

## A. Direct platform strategy change — Cloudflare now gives agents and CI resource-scoped Worker roles

**Status:** `CONFIRMED` first-party capability.  
**Published:** 2026-09-15.  
**Checked:** 2026-09-22 (Asia/Taipei).  
**Sources:**
- https://developers.cloudflare.com/changelog/post/2026-09-15-granular-worker-permissions/
- https://developers.cloudflare.com/workers/authorization/workers/
- https://developers.cloudflare.com/workers/authorization/

Cloudflare now lets account-owned API tokens used by agents/CI be scoped to **specified Workers** and assigned one of four Worker roles:

- `Metadata Read-Only`: settings/metrics/logs/traces, no code, no mutation.
- `Content Read-Only`: code + metadata, no mutation.
- `Editor`: update/deploy existing Worker, no delete.
- `Admin`: full management for the selected Worker.

Cloudflare's Developer Platform model now explicitly separates scope from role and supports platform/product/resource levels; API tokens support product-level and, where available, resource-level permissions. Cloudflare also says `wrangler login` OAuth does not currently enforce this granular authorization; an account-owned API token is the route for agent/CI least privilege.

### User job / manual-risk reduction

A trusted operator no longer has to rely only on an application-local allowlist to keep an automation credential away from unrelated Workers. Cloudflare itself can reject access outside the selected Worker(s), and can separately prevent delete while still allowing deploy.

For `cf-mcp-server`, that means the coarse boundary can become:

`Cloudflare credential role/scope -> cf-mcp-server local supported-target allowlist -> per-operation confirmation/effect contract -> audit/receipt`

rather than expecting the local allowlist to carry all project isolation by itself.

### Important limitations / what not to overclaim

- This run does **not** know the current `CF_API_TOKEN` scope. No claim is made that it is account-wide or unsafe.
- Per-Worker roles do not replace every permission used by this repository. Cloudflare documents separate Pages roles; direct D1/KV/R2 management can require their own product/resource permissions; routes/custom domains can require zone permissions.
- A scoped token does not replace `ALLOWED_PROJECTS`, exact target binding, confirmation codes, audit logging, stale-state checks, rollback/recovery semantics or truthful effect receipts.
- Platform support does not establish that every current L1/L2/L3 tool can run under one perfectly minimal token without a compatibility experiment.

### Strategic consequence

This partially commoditizes a previously important part of the positioning: **coarse owner-specific resource authority minimization can now be delegated to Cloudflare itself.** The differentiated layer should move upward to exact operation semantics, human approval, target/evidence binding, and truthful recovery receipts rather than growing a local IAM subsystem.

**Decision:** retain as a high-value positioning / validation signal; do not open an implementation Issue without evidence about the real deployed credential/workflow.

---

## B. Adjacent platform pattern — Cloudflare is extending resource-scoped delegation across Developer Platform / Access surfaces

**Status:** `CONFIRMED` platform pattern.  
**Recent relevant dates:** 2026-08-19 through 2026-09-16.  
**Checked:** 2026-09-22.  
**Sources:**
- https://developers.cloudflare.com/fundamentals/manage-members/scope/
- https://developers.cloudflare.com/changelog/post/2026-08-19-granular-permissions-resource-lists/
- https://developers.cloudflare.com/cloudflare-one/networks/connectors/granular-permissions/

The Worker change is not isolated. Cloudflare's current role-scope documentation has explicit `Specific resources` scope, and resource-scoped listing behavior is appearing in Access/Tunnel/Mesh surfaces. This suggests the platform direction is to move least-privilege delegation into the provider control plane rather than asking each automation product to invent a parallel resource registry.

**Transferable principle:** prefer provider-native resource authorization as the coarse defense-in-depth boundary; keep product-local policy only for the workflow semantics the provider cannot express.

**Do not copy:** no local clone of Cloudflare IAM policy administration, user groups, role editor, token issuance or organization permissions.

---

## C. Existing direct substitute trend — official Cloudflare agent tooling already owns generic API breadth and user-granted scopes

**Status:** `CONFIRMED`; this is mostly a dedupe/calibration signal, not a new gap.  
**Relevant date:** optional OAuth scopes shipped 2026-08-22.  
**Checked:** 2026-09-22.  
**Sources:**
- https://developers.cloudflare.com/changelog/post/2026-08-22-wrangler-mcp-optional-oauth-scopes/
- https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/

Cloudflare's own API MCP lets users limit optional OAuth scopes and exposes the large Cloudflare API through a tiny Code Mode surface. This remains evidence for the Product Board's existing `REPOSITION / SIMPLIFY / MAINTAIN` choice, not a reason to build broader tool coverage.

The prior radar already classified fine-grained **client→MCP OAuth scopes** as `HOLD / DEDUPE` pending a real owner workflow. This round does not reopen that topic. The new Sep-15 signal is different: it is **backend Cloudflare API-token resource/role scoping**.

# New Releases / strategy changes

| Date | Product / change | Confidence | Impact on this product |
|---|---|---|---|
| 2026-09-15 | Cloudflare: per-Worker roles + specified-Worker API tokens for agents/CI | CONFIRMED | Coarse resource least privilege can move upstream into Cloudflare credential policy |
| 2026-09-16 | Cloudflare role-scope docs expanded/current across resource-specific surfaces | CONFIRMED | Reinforces provider-native RBAC direction |
| 2026-08-22 | Cloudflare API MCP / Wrangler optional OAuth scopes | CONFIRMED / already known | Dedupe; does not reopen local fine-grained client scope work |

# Community Pain

A Sep-17 r/CloudFlare discussion called the new per-Worker token scope a major security improvement and several commenters immediately mapped it to scoped GitHub Actions deployments. This is **COMMUNITY_SIGNAL only**: it shows the workflow is legible and valued by some practitioners, but it is not incidence data and is not used to set severity or prove Reese-max pain.

Source: https://www.reddit.com/r/CloudFlare/comments/1wijqqo/this_is_a_big_deal/

# Adjacent Ideas

## 1. Two-layer authority, not a new IAM product

Preferred future operating contract where supported:

`provider-native least-privilege token -> local supported-target allowlist -> exact requested operation -> explicit human confirmation when required -> remote read-back/effect receipt -> local audit receipt`

Each layer answers a different question:

- Provider token: **what Cloudflare resources/actions can this credential ever reach?**
- `ALLOWED_PROJECTS`: **what product targets does this private MCP intentionally support?**
- Confirmation: **did the user authorize this concrete dangerous operation now?**
- Receipt/audit: **what actually happened and what can safely be retried?**

## 2. Permission compatibility matrix as research artifact

If owner evidence later justifies work, the smallest artifact is a tool-family matrix such as:

`tool/path -> Cloudflare product -> minimum documented role/scope -> target resource -> expected deny mode -> runtime evidence`

It should be derived from actual supported tools, not become a generic RBAC registry.

## 3. Fail closed on insufficient provider permission; never fall back wider

A bounded future experiment should verify that a locally allowed target which the scoped Cloudflare token cannot access produces a truthful permission-denied result. It must not silently retry under a broader credential or reinterpret denial as “resource does not exist.”

# Opportunity Map — `cf-mcp-server`

| Bucket | Decision |
|---|---|
| MUST MATCH | Where Cloudflare supports it, prefer backend credentials whose resource/role scope is no broader than the supported automation need; preserve local allowlist and explicit dangerous-action confirmation as separate defenses. |
| SHOULD BE BETTER | Make the required Cloudflare credential authority explicit and testable for a small number of supported tool families; distinguish permission denial from missing resource / provider failure. |
| DIFFERENTIATOR | Exact-target human approval, confirmation binding, state-drift protection, truthful effect/read-back/audit receipts and bounded recovery semantics. |
| ADJACENT IDEA | A small documented permission compatibility matrix and isolated scoped-token verification; no runtime token-management feature yet. |
| DO NOT COPY | Cloudflare IAM/token admin UI, role/group management, generic entitlement registry, token issuance/rotation service, marketplace, broad API catalog or another enterprise policy plane. |

# Four-Gate Decision

## Candidate — verify and prefer provider-native resource-scoped backend authority

Stable candidate fingerprint:

`cf-mcp-server + one backend CF_API_TOKEN used across supported Cloudflare API paths + local ALLOWED_PROJECTS as visible project filter + Cloudflare now supports resource-scoped roles/tokens for agents/CI + actual deployed token scope unknown + no demonstrated incident or user completion failure`

Classification:

- `kind=VALIDATION_GAP`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- runtime status if pursued: `NEEDS_RUNTIME_VERIFICATION`

### Gate 1 — Problem / value

Target user is the owner/small trusted operator using the private Cloudflare gateway. The potential value is smaller blast radius if the MCP layer or an operator action is wrong.

Current source proves a shared backend token exists and local project restrictions exist. It does **not** prove the actual token is broad, that any current call can reach an unintended resource, or that a user has been blocked by the current credential model. Therefore this is not a BUG and does not establish P0/P1/P2/P3 severity.

Contrary evidence matters: the current local allowlist, confirmation model and Cloudflare-side token permissions can coexist; the existing setup may already use a sufficiently narrow token.

### Gate 2 — Priority

Qualitative comparison:

- User Pain: `UNKNOWN`.
- Strategic Fit: `HIGH` because bounded authority is core product positioning.
- External Evidence: `HIGH` for platform capability, `UNKNOWN` for current deployment need.
- Reuse: `MEDIUM`, mostly an operating contract rather than a framework.
- Effort: `LOW-MEDIUM` for a bounded verification; much higher if incorrectly expanded into IAM tooling.
- Security/Privacy/Cost: potentially improves security; no paid dependency or cost claim established.

Decision priority is therefore `MEDIUM`, not P1/P2 and not an implementation mandate.

### Gate 3 — Minimum approach

Do nothing to product code now.

If the owner later authorizes validation, start with one isolated/sacrificial Worker and one account-owned API token scoped only to that Worker with the minimum role required for the chosen harmless/read-only or bounded deployment path. Verify:

1. The intended selected Worker operation succeeds under the documented minimum role.
2. A second locally named but credential-denied Worker fails closed with a truthful permission result.
3. No fallback to a broader token occurs.
4. The tool receipt records provider denial separately from resource absence / local allowlist denial.

Expand the matrix only when another existing tool family needs it. Do not first build a token manager, IAM service, policy database or cross-project authorization framework.

### Gate 4 — Research / implementation separation

This can be a bounded research/validation question:

- **BUILD / adopt operating contract:** supported critical paths work with provider-native scopes and materially reduce backend authority without breaking the owner workflow.
- **NARROW:** only selected Worker paths benefit; keep Pages/D1/KV/R2 under their existing minimum permissions and document the split.
- **REJECT:** granular provider scopes do not cover the required supported paths or add more credential complexity than safety value for this private gateway.

A `BUILD` research outcome would authorize only a next decision, not token creation/rotation, code changes, deployment, merge or permission changes.

**Decision this round: REPORT ONLY / NO NEW ISSUE.** Current deployment need is not established strongly enough for a tracking Issue, and the existing product direction already says not to build generic IAM.

# Issue / PR Mapping and dedupe

- `#19` post-effect audit failure: unchanged; different fingerprint. No comment/update.
- `#15` Tool Contract Manifest: unchanged; different fingerprint. No scope expansion.
- `#6` MCP 2026-07-28 protocol/client authorization migration: unchanged; client-facing protocol/auth work, not backend Cloudflare resource RBAC.
- `#8` gradual deployment: unchanged; no new rollout scope.
- Product Board fine-grained OAuth scopes: remains `LATER / RESEARCH`; this run does not reinterpret backend API-token scoping as client OAuth scope demand.
- Exact Issue searches for `CF_API_TOKEN`, `granular permissions`, `resource scoped token`, and `ALLOWED_PROJECTS` found no same-root open/closed tracking item. A broad PR search surfaced only older OAuth-security work, not this backend-resource-scope fingerprint.
- Active implementation PRs were not commented on or modified.

**Writes:** 0 new Issues; 0 Issue modifications/comments; 0 PR modifications/comments; 0 implementation authorization. No issue lock was required because no existing Issue/shared tracking item was modified. This report uses a unique filename and does not overwrite prior radar history.

# Cross-portfolio Ideas

One principle is worth retaining without opening a cross-repository framework:

> When a provider offers native resource-scoped credentials, use that as the coarse external authority boundary and keep application policy focused on workflow semantics the provider cannot express.

This may apply to other Reese-max products only if they actually use provider credentials with broader-than-needed resource reach. Do not create portfolio-wide work from this one platform signal.

# Rejected Ideas

- **Create a Cloudflare IAM/token manager inside cf-mcp-server — REJECT.** The platform now owns this better and the owner direction explicitly rejects generic IAM.
- **Replace `ALLOWED_PROJECTS` with Cloudflare roles — REJECT.** They solve different layers; local product scope is still useful and some tools span different Cloudflare products/permissions.
- **Open a P1/P2 security bug because one `CF_API_TOKEN` exists — REJECT.** Token scope is unknown; shared variable/source use is not evidence of excessive deployed authority or an exploitable bypass.
- **Split into one secret/token per tool immediately — REJECT.** No validated need; this would multiply secret-management and operational burden before a compatibility experiment.
- **Reopen fine-grained MCP OAuth scopes — REJECT / DEDUPE.** Existing Product Board already treats it as research-later; backend token scope is a separate concern.
- **Expand official Cloudflare API breadth locally — REJECT.** Official MCP/Code Mode already owns breadth; local differentiation remains approval/recovery truth.

# Sources

First-party / official:

1. Cloudflare — Grant teammates and agents access to specific Workers, **2026-09-15**: https://developers.cloudflare.com/changelog/post/2026-09-15-granular-worker-permissions/
2. Cloudflare — Workers roles and permissions, last updated **2026-09-15**: https://developers.cloudflare.com/workers/authorization/workers/
3. Cloudflare — Roles and permissions, last updated **2026-09-15**: https://developers.cloudflare.com/workers/authorization/
4. Cloudflare — Role scopes, last updated **2026-09-16**: https://developers.cloudflare.com/fundamentals/manage-members/scope/
5. Cloudflare — Access resource lists support resource-scoped roles, **2026-08-19**: https://developers.cloudflare.com/changelog/post/2026-08-19-granular-permissions-resource-lists/
6. Cloudflare — Choose OAuth scopes for Wrangler and Cloudflare API MCP, **2026-08-22**: https://developers.cloudflare.com/changelog/post/2026-08-22-wrangler-mcp-optional-oauth-scopes/
7. Cloudflare — Cloudflare's own MCP servers, checked **2026-09-22**: https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/

Community signal (not prevalence evidence):

8. Reddit r/CloudFlare discussion, **2026-09-17**: https://www.reddit.com/r/CloudFlare/comments/1wijqqo/this_is_a_big_deal/

Repository evidence:

- Current `main@a3192b6d7be2b21285745b648ce064957b4c2d16`.
- `.github/quality-audits/2026-09-18T1700Z-product-board-audit.md`.
- `src/types.ts` (`CF_API_TOKEN`, `ALLOWED_PROJECTS`, common Cloudflare API helper).
- L1/L2/L3 source search showing the backend token is used by current Cloudflare API paths.
- Current all-state Issues and open PRs, with no same-root backend resource-scope item found.
- Previous `docs/competitive-intelligence/2026-09-19T220700Z-external-radar.md` for the already-rejected optional OAuth-scope duplicate boundary and #19.

# What Changed

1. **New external strategy evidence:** Cloudflare added agent/CI API-token roles scoped to specific Workers on 2026-09-15. Stored prior radar search did not contain this specific granular-Worker permission signal.
2. **Positioning refinement:** coarse resource least privilege is now increasingly provider-native; `cf-mcp-server` should not treat that layer as a reason to grow local IAM. Its more defensible value is exact-operation approval, target binding, recovery truth and audit/effect receipts.
3. **No established defect:** deployed token scope remains unknown. No P0/P1/P2/P3 defect, user outage, unauthorized reach or real workflow break is claimed.
4. **No new Issue:** the smallest next step is evidence gathering, not implementation.
5. Inventory remained **42 owned / 41 unarchived** in the fresh pagination used for this round.

# Completion / gaps / fair cursor

- Rules blob SHA confirmed: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh owner pagination completed: 42 owned / 41 unarchived; second page empty.
- Focal HEAD rechecked before report write: `a3192b6d7be2b21285745b648ce064957b4c2d16`.
- No Cloudflare secret/token scope was inspected; actual backend credential least-privilege status remains `UNKNOWN`.
- No runtime, CI, deployment or provider mutation was executed; any scoped-token compatibility claim remains `NEEDS_RUNTIME_VERIFICATION`.
- No Issue/PR/comment/write outside this unique radar report.
- This radar does not declare `cf-mcp-server` or the portfolio CLEAN.
- Next fair-rotation target: **`Reese-max/tick-stock-panel`**.
