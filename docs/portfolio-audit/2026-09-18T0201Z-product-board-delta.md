# Product Board delta — 2026-09-18 02:01Z

## Scope and governing evidence

- Target: `Reese-max/minideck`.
- Default branch: `main@31f7131ae24af9d89287000e8048750e598686a1`.
- Default product baseline: `d3026875d9ef0f0010137639e789359463139a89`; later default commits are audit/documentation only.
- Candidate reviewed: open PR #1, `feature/presentation-studio-mcp-v2@0cb4ebc32fd4b75f2470f92854c6ceed79f0103e`.
- Issue-quality rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md@8167e10798071d2276addaff6b201c6b0e904a2a`.
- Owner inventory was fully paginated in this run: 41 visible owner repositories, 40 unarchived; `obsidian-vault` is archived.
- Evidence class for the finding below: **SOURCE_CONFIRMED**. No production deployment, real account rename, cross-account access, paid provider call, browser session, or D1 migration was executed.

The existing MiniDeck product-board report and fixed 50-persona Round 4 remain the product baseline. They are synthetic model simulations, not human research. Because the default product and runtime receipts have not changed, this run did not repost a full 50-persona report or claim another CLEAN round. MiniDeck remains **NOT CLEAN / 0 of 2**.

## New finding — mutable GitHub login is used as the authorization subject

```yaml
issue_quality_version: 2
kind: BUG
severity: P1
decision_priority: HIGH_PRE_MERGE
evidence: SOURCE_CONFIRMED
triage: NEEDS_REVIEW
auto_implementation: false
runtime: NEEDS_RUNTIME_VERIFICATION
```

Stable fingerprint:

`minideck + Presentation Studio OAuth callback + GitHub username change/reassignment + owner_login used as the stable authorization principal + successor account resolves to the prior owner's namespace`

### Problem and reachable chain

PR #1 exchanges the GitHub OAuth code, requests `GET https://api.github.com/user`, reads only the mutable `login` field, and returns it as `ownerLogin`:

- `workers/presentation-studio-mcp/src/auth.ts:250-261`
- the authorization code and access/refresh token rows persist `owner_login`;
- `authenticateMcpRequest()` returns `{ ownerId: row.owner_login }`;
- project authorization compares that string against `presentation_project_runtime.owner_id` in `src/db.ts:106-126`.

GitHub's current official username-change contract says that a user may change username and that the old username then becomes available for anyone else to claim:
https://docs.github.com/en/account-and-profile/concepts/username-changes

That makes the following chain reachable:

1. User A creates presentations while their GitHub login is `oldname`; project ownership is stored as `oldname`.
2. User A changes their GitHub username. A fresh authorization now returns the new login, so the existing records no longer match and the supported read/revise/approve/export/delete paths become inaccessible.
3. If User B later claims `oldname`, GitHub OAuth for B returns the same string used by the stored authorization boundary.
4. The MCP service issues B a token with `ownerId=oldname`. For a known project UUID, the current owner predicate cannot distinguish B from the original owner and permits project access and write operations.

PR #1 does not expose a general project-list tool, and UUIDs limit blind enumeration. Those facts reduce exploitability but do not repair the identity collision: project IDs can exist in an authorized client's state, logs, support material, or previously exchanged workflow references. The defect therefore affects account continuity and can cross an authorization boundary without requiring a guessed password or compromised GitHub credential.

### Impact and severity calibration

- Original owner: loses access to existing presentation state after an ordinary supported GitHub account rename.
- Successor account using the released login: can be treated as the original principal for any known project ID, including read, revision, approval, export and confirmed deletion paths.
- The impact is a major identity/permission failure, so this is **P1** under the portfolio rubric.
- It is not P0: the candidate is unmerged, production use is unproven, the successor must claim the prior login, and access to existing projects still requires a project UUID.
- No live disclosure, takeover or data loss is claimed.

### Minimal effective correction

Use GitHub's immutable numeric user `id` (namespaced by issuer, for example `github:<id>`) as the authorization subject. Keep `login` only as mutable display metadata.

The minimum safe change is local to the existing OAuth and ownership columns:

1. parse both `id` and `login` from `/user`;
2. persist the immutable subject through authorization codes, tokens and project ownership checks;
3. define a bounded migration for existing `owner_login` rows, quarantining or requiring re-link for unresolved/ambiguous records rather than silently assigning them;
4. do not add a new identity service, OAuth provider matrix, account platform or generalized IAM framework.

### Direct acceptance and regression

- Same GitHub numeric `id` with a changed `login` retains access to the same existing project.
- A different GitHub numeric `id` using the old `login` receives no access to the prior owner's project, even when the project UUID is known.
- Authorization codes, access tokens, refresh tokens and project ownership all use the same issuer-qualified immutable subject.
- Existing rows have an explicit, fail-closed migration/re-link path; unresolved mappings cannot be claimed by matching a login string.
- Contract tests cover rename continuity and released-login reassignment without calling production GitHub or D1.

## Red Team and board disagreement

- **Security/Privacy and CTO:** block PR #1 from production until the principal is immutable; the current `owner_login` name makes the boundary itself unstable.
- **CPO/Support:** prioritize continuity because a normal profile edit must not orphan the user's core work.
- **Staff Engineer:** rejects a broader account subsystem; one immutable provider subject plus display login is sufficient.
- **Growth minority view:** dynamic OAuth onboarding is valuable and should remain, but convenience does not justify an ambiguous subject.
- **Red Team limits:** PKCE, hashed tokens, constant-time bearer checks and owner-scoped project queries are real controls. They protect token interception and ordinary cross-owner access, but do not distinguish two GitHub accounts that successively share the same login string. UUIDs prevent portfolio-wide enumeration, so the finding is not escalated to P0.

## Product and market decision

The 2026-09-12 competitor baseline (Gamma, Pitch, Canva, PowerPoint and manual HTML/PPTX) remains sufficient because this finding is a provider-identity correctness defect, not evidence for a new product feature. No competitor difference is used as severity evidence.

Decision remains **INVEST / SIMPLIFY**:

- NOW: repair the immutable owner boundary in PR #1; preserve existing #9–#14 scopes and finish the default publication boundary #4/#6.
- NEXT: obtain isolated OAuth/D1 regression evidence and exact named-environment deployment receipts.
- LATER: decide whether the large MCP/runner surface belongs in MiniDeck after its trust boundaries are proven.
- DON'T: add collaboration SaaS, analytics, multiple identity providers, a secret broker or a general IAM platform as part of this correction.

## Coordination and tracking

PR #1, its branch, existing #9–#14 follow-up issues and external-fix ownership are active. Under the repository lock/ownership rules this finding is **SKIPPED_LOCKED** for target-repository mutation. This run did not add an Issue, review comment, branch or implementation change and did not compete with the active owner.

This central report is the explicit tracking/blocker for the new fingerprint until the PR owner incorporates it or the ownership scope is released. A later run should deduplicate against this report before creating any Issue.

## Accounting

- New actionable findings: 1.
- P1: 1; P0/P2/P3: 0.
- New/updated/reopened target Issues: 0.
- Duplicate issues avoided: 1 active-PR scope.
- SKIPPED_LOCKED: 1.
- Verified fixes: 0.
- Default-branch regressions: 0.
- Issue/report write blocked: 0.
- Portfolio CLEAN: no.
- Next product-board cursor: `Reese-max/chatgpt-dual-pipeline`.
