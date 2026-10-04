# Product-board reconciliation — octobroker mirror-fork applicability

- Run: `2026-09-22T02:00Z-product-board`
- State: `REJECTED_MISATTRIBUTED / EXCLUSION_REVALIDATED / NOT_CLEAN`
- Owner repository: `Reese-max/octobroker`
- Inspected owner HEAD: `b669101c0ef4a2c03c1ddcb2b99c014fd1947d29`
- Inspected upstream HEAD: `openabdev/octobroker@b669101c0ef4a2c03c1ddcb2b99c014fd1947d29`
- Issue Quality v2 blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Prior applicability decision: `round-5-progress-2026-09-21-2025Z-fixed50-octobroker-openab-exclusions.md@1c6e2e4f214214941984df6187221205e91bd7c7`
- New owner actionable P0/P1/P2: **0**
- Issue/comment mutations: **0**
- Product implementation: **0**
- Verified fixed: **0**
- Portfolio CLEAN: **0/2**

## Why this reconciliation exists

A product-board pass at 2026-09-21T23:00Z identified a technically plausible authorization weakness in the code visible at the Reese-max fork: legacy REST checks `allowed_owners` only for `/repos/{owner}/...`, while non-repository paths are allowed; pooled-token GraphQL queries do not carry a caller/repository policy envelope. The connected GitHub write layer was unavailable during that pass, so no Issue or report was created.

This run restored the connected GitHub path and performed the required pre-write checks instead of converting the temporary candidate directly into a Reese-max Issue.

## Fresh GitHub evidence

### Rules and exact heads

- Issue Quality v2 was re-read from the default branch; blob remains `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Reese-max `main`: `b669101c0ef4a2c03c1ddcb2b99c014fd1947d29`.
- Upstream `openabdev/octobroker/main`: `b669101c0ef4a2c03c1ddcb2b99c014fd1947d29`.
- The fork and upstream remain byte-for-byte aligned at the same release commit.
- README, `src/main.rs`, `docs/DESIGN.md`, `config.example.toml`, CI and E2E workflows were re-read at the inspected owner HEAD.

### All-state dedupe and ownership

- Reese-max fork open Issues: 0.
- Reese-max fork closed Issues: 0.
- Reese-max fork open/closed PRs: 0.
- The target audit path did not exist.
- Branch enumeration returned imported development/release branches, but no PR or owner heartbeat identifies an active Reese-max implementation for this fingerprint.
- Central search found no `github-issue-lock:v1` or owner heartbeat for `Reese-max/octobroker`.
- The authoritative fixed-50 continuation already classifies this repository as an exact mirror-fork exclusion and explicitly says upstream findings are not attributed to Reese-max and no Issue/report is created in the fork.

## Candidate evidence retained, but not attributed

The inspected source still supports this upstream technical signal:

1. legacy REST `is_allowed_path` checks owner only for `/repos/{owner}/...`;
2. non-repository paths such as `/user` are explicitly accepted by tests;
3. GraphQL queries use a pooled PAT without per-caller repository authorization;
4. a broad pooled PAT could therefore return data beyond an operator's `allowed_owners` expectation.

This remains `SOURCE_CONFIRMED / NEEDS_RUNTIME_VERIFICATION` as an upstream signal. It is **not** a Reese-max product finding because there is no owner-specific product delta, adoption decision, deployment evidence, or independent maintenance surface. This audit is not authorized to operate on `openabdev/octobroker`.

## Four gates

1. **Problem validity:** the code path is technically plausible upstream, but the owner-scoped product applicability gate fails.
2. **Severity:** no Reese-max severity is assigned. The previously proposed P1 is withdrawn as owner attribution, not marked fixed.
3. **Minimum scope:** do nothing in the mirror fork. If Reese-max later adopts or diverges, re-evaluate the smallest option: disable/fail-close legacy pooled REST/GraphQL before considering new policy infrastructure.
4. **Research/implementation separation:** no Issue, implementation branch, merge, deploy, worker, GOAL, paid provider action or external upstream write is authorized.

## 50 synthetic persona coverage

The preceding product-board simulation covered 30 regression and 20 exploration cases around operators, pooled-PAT scope, REST/GraphQL callers, App-backed MCP, cache isolation, shared VPC workloads, GHES, repo transfer, GraphQL fragments, OIDC, recovery and accessibility. It remains a model simulation, not user research.

Applicability review across all 50 produces the same result:

- regression cases may expose an upstream code-contract concern;
- none establishes a Reese-max-specific user, deployment, incident or owner-maintained delta;
- persona support cannot override the exact-mirror exclusion;
- the fixed A01–J05 protocol was not replaced and no CLEAN round is earned.

No synthetic preference share, incidence, revenue or priority claim is produced.

## External benchmark disposition

Official references reviewed in the preceding pass—GitHub App installation tokens, GitHub's MCP server/tool allowlists, Actions OIDC, Teleport Machine ID, Infisical machine identities and Vault short-lived credentials—support short-lived, bounded workload credentials. They do not establish that Reese-max has adopted this fork as a product, and therefore do not justify an owner Issue.

- `MUST MATCH`: if adopted, every reachable legacy route must honor the caller/resource boundary.
- `SHOULD BE BETTER`: remain small, self-hosted and GitHub-specific.
- `DIFFERENTIATOR`: agents do not hold long-lived GitHub credentials.
- `DO NOT COPY`: general IAM/secrets platforms, policy DSLs or multi-VCS scope without demand evidence.

## Board views and disagreement

- **CEO/CPO:** do not manufacture owner work from an exact mirror; first decide whether Reese-max owns/adopts the product.
- **CTO/Staff Engineer:** the technical signal is credible, but the smaller current action is exclusion, not a fork-only patch.
- **Security/Privacy:** retain the upstream signal because private-network/read-only assumptions do not prove authorization; do not misattribute it.
- **QA/SRE:** no Actions receipts exist in the fork, but missing evidence is not proof of a Reese-max product failure.
- **Growth/Support/CFO:** no user, deployment or support commitment is evidenced; a new Issue would create maintenance debt without owner scope.
- **Accessibility/Research:** the persona simulation cannot substitute for ownership or runtime evidence.

## Red Team outcome

The decisive counter-evidence is not that the code is safe. It is that:

- the fork equals upstream at the exact SHA;
- prior owner-scoped audits explicitly excluded it;
- there are no Reese-max Issues/PRs, product commits or deployment receipts;
- the user prohibited operating on others' repositories and preserving reasonable prior exclusions is mandatory.

This overturns the proposed Reese-max P1 Issue. The correct disposition is `REJECTED_MISATTRIBUTED`, not `FIXED`, `DUPLICATE` or `CLEAN`.

## NOW / NEXT / LATER / DON'T

- **NOW:** preserve the upstream signal centrally; correct the earlier temporary attribution; advance the fair cursor.
- **NEXT:** `Reese-max/police-exam-archive`, per the authoritative continuation.
- **LATER:** reclassify only if Reese-max adds fork-specific product commits, deploys/adopts it, or records an owner decision to maintain it independently.
- **DON'T:** create an Issue in the mirror, patch product code, contact upstream, or infer deployment from repository visibility.

## Accounting and limitations

- Candidate rejected after Red Team/applicability: 1.
- New/updated/reopened Issues: 0.
- Duplicate Issues avoided: 1 potential misattributed Issue.
- Issue locks: not required because no Issue mutation was appropriate.
- Runtime reproduction: none.
- Deployment/incident evidence: none.
- CLEAN: not established; mirror exclusions do not earn clean rounds.
