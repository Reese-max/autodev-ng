# External Competitive / New-Product / Workflow Radar — 2026-09-20T22:06:21Z

## Status / scope / evidence boundary

- Run status: **COMPLETE**.
- Governing rule re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected owner inventory: full pagination returned **42 Reese-max-owned repositories / 41 unarchived**; page 2 was empty. `obsidian-vault` is the only archived repository and is excluded from active product scope.
- Fair-rotation focal repository: `Reese-max/herdr-skills`, continuing the portfolio sequence after the latest `google-maps-personal-mcp` radar. Historical rotation also used `google-maps-personal-mcp -> herdr-skills -> lobsterpulse`; next fair cursor is therefore **`Reese-max/lobsterpulse`**.
- Current focal default branch / HEAD: `main@9f134e1b0a53ffe72a64a5793ddc7dabe03ed571`. The latest default-branch commit is an audit/docs commit; product code remains the August 31 hardening series.
- Owner/product direction re-read from current README/SKILL contracts and historical radar: these are **two narrow personal Herdr/Codex skills**, not a generic hosted agent platform. `herdr-reflect` owns privacy-preserving evidence-backed learning; `herdr-supervisor` owns policy/evidence/run-state gates over Herdr. Runtime orchestration, package registries, broad marketplaces, and generic agent dashboards are not product goals without concrete owner evidence.
- Existing tracked scopes rechecked: #3 relocation/rebind recovery and #6 correction→candidate research remain distinct; active PR #9 is scoped to #3 and PR #8 to #6. No scope was seized or rewritten by this radar.
- No product source, CI/config, secrets, permissions/settings, implementation branch, merge/deploy, worker/GOAL, paid service, or formal external mutation was started.
- No real Cursor/Copilot/Gemini/non-Codex Herdr session was executed. Any cross-host runtime claim below remains `NEEDS_RUNTIME_VERIFICATION`.
- Portfolio CLEAN is **not declared**.

## Product → market category

`herdr-skills` is best treated as a **thin evidence/policy overlay for Herdr workflows expressed as Agent Skills**:

1. personal/local skill distribution rather than hosted SaaS;
2. machine-checkable completion/effect gating rather than generic orchestration;
3. privacy-preserving local learning rather than transcript-as-memory;
4. `SKILL.md` as a distribution surface, while Herdr runtime/state semantics remain product-specific;
5. primary current host is Codex, with current docs also advertising compatible hosts that discover `~/.agents/skills`.

## External Signals

### A. CONFIRMED — Microsoft is making `SKILL.md` a governed enterprise agent package

**Updated 2026-09-04 / 2026-09-09; checked 2026-09-20 UTC.**

Sources:
- https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/agent-builder-add-skills
- https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/declarative-agent-skills
- https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/skills-overview

Microsoft 365 Copilot Agent Builder / Agents Toolkit now accepts custom skills centered on `SKILL.md`, optionally packaged with scripts/resources. Current documentation describes bounded package/file limits, Preview testing, secure sandbox execution for scripts, sensitivity-label handling, and admin governance. Copilot Studio similarly treats Skills as a distinct reusable layer beside knowledge and tools and can upload or generate skills.

**User job:** reuse a specialized workflow without making it always-on global instruction, while letting the host decide when to activate it and keeping host governance around execution.

**Product implication:** generic `SKILL.md` packaging/discovery is increasingly platform infrastructure. Herdr should not respond by building its own marketplace, package service, sandbox runtime, or enterprise admin plane. Its defensible value remains the evidence/policy semantics inside the skill.

**New compatibility consequence:** because `SKILL.md` is increasingly a multi-host format, a repository claim that a skill can be discovered from a portable path should not leave executable helper instructions tied to a different host-specific directory.

### B. CONFIRMED — GitHub treats Agent Skills as portable packages with host-specific installation, provenance and pinning

**Feature released 2026-04-16; current docs checked 2026-09-20 UTC.** This is older than the preferred 30–90 day window, but the capability is a slowly changing representative platform contract and is directly relevant to current distribution semantics.

Sources:
- https://github.blog/changelog/2026-04-16-manage-agent-skills-with-github-cli/
- https://docs.github.com/en/copilot/concepts/agents/about-agent-skills
- https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills

GitHub's current `gh skill` flow supports multiple agent hosts, installs to the correct host directory, can pin a tag/commit, records source/ref/tree-SHA provenance in frontmatter, and warns that skills are executable instructions that may contain malicious scripts/prompt injection. Current Copilot docs list project/personal locations including `.agents/skills` / `~/.agents/skills`.

**Transferable pattern:** distribution provenance/pinning can be delegated to the surrounding ecosystem. Herdr does not need a new package manager just to know where a skill came from.

**Do not overclaim:** this radar did not install the private Reese-max repository with `gh skill`, did not verify private-repository support for this exact owner/account setup, and does not treat GitHub's security warning as proof that the current two skills are malicious.

### C. CONFIRMED — Cursor and Gemini also consume the portable Agent Skills surface

**Current first-party docs checked 2026-09-20 UTC.**

Sources:
- https://cursor.com/docs/skills
- https://codelabs.developers.google.com/gemini-cli/how-to-create-agent-skills-for-gemini-cli

Cursor documents Agent Skills as an open standard, discovers `~/.agents/skills`, and also recognizes compatibility directories including Codex skill locations. Google's Gemini CLI codelab likewise uses `.agents/skills/<skill>/SKILL.md` for discoverable skills.

This does not establish that Herdr itself runs correctly under those hosts. It establishes only that the repository's advertised alternate discovery path corresponds to real, currently used host behavior.

## New Releases / Market Moves

| Date / state | Product / platform | Signal | Confidence | Radar consequence |
|---|---|---|---|---|
| 2026-09-04 / 09-09 | Microsoft 365 Copilot / Copilot Studio | custom `SKILL.md` packages, scripts/resources, preview, sandbox/governance | CONFIRMED | portability/distribution is becoming host infrastructure; do not build a Herdr marketplace/runtime |
| Current 2026 docs | GitHub Copilot / `gh skill` | open Agent Skills, host-specific install paths, provenance + pinning | CONFIRMED | current `~/.agents/skills` compatibility claim maps to a real supported ecosystem path |
| Current 2026 docs | Cursor | `~/.agents/skills` plus Codex/Claude compatibility directories | CONFIRMED | strengthens need for truthful path/runtime compatibility rather than vague "compatible host" wording |
| Current 2026 codelab | Gemini CLI | `.agents/skills` discoverable skill path | CONFIRMED tutorial capability | additional cross-host signal; not evidence of Herdr runtime compatibility |

## Community Pain

No recent community anecdote was needed to establish the actionable finding in this round. The repository contradiction is directly visible in current source, and cross-host directory support is documented by first-party platforms. No incidence/prevalence claim is made about how many Reese-max users actually hit the secondary host path.

## Repository Truth / Counter-evidence

### Current product is Codex-first

`README.md` starts by calling these "Two personal Codex skills" and instructs Codex users to copy both directories into `$CODEX_HOME/skills/` (normally `~/.codex/skills/`). This is important counter-evidence against inflating the compatibility finding into P2/P1. The core supported workflow remains Codex-oriented and no owner/user runtime evidence currently shows that non-Codex use is frequent or business-critical.

### The same docs nevertheless advertise an alternate portable discovery path

The same README says other compatible hosts may discover `~/.agents/skills/`. `herdr-reflect/SKILL.md` explicitly says to resolve the helper from the **loaded skill directory**, then gives executable examples hard-coded to `$HOME/.codex/skills/herdr-reflect/scripts/herdr_learning.py`. `herdr-supervisor/SKILL.md` similarly advertises a Codex-compatible host while its DONE validator example invokes `$HOME/.codex/skills/herdr-supervisor/scripts/validate_run_state.py`.

Therefore a host that discovers only `~/.agents/skills/...` can load the skill text while the copy-paste helper command points to a directory that need not exist. This is a current source-level contract contradiction.

### Existing tests do not cover the alternate install location

`tests/test_skill_contracts.py` checks frontmatter/versioning, the presence of `$CODEX_HOME/skills` in README, local self-tests and safety contracts, but it does not create a fixture where the skill exists only in `.agents/skills` and then execute the documented helper/validator path.

### Existing Issues/PRs are different fingerprints

- #3 / PR #9: durable project identity after moving/restoring a checkout.
- #6 / PR #8: repeated correction/steering → candidate improvement research.
- Repository search found no existing issue/PR for `~/.agents/skills` discovery versus hard-coded `~/.codex/skills` helper invocation.
- Repository search found no `github-issue-lock:v1` marker for this fingerprint.

## Adjacent Ideas

### 1. Host-neutral helper resolution — ACTIONABLE SMALL BUG, no framework

Classification:

```yaml
kind: BUG
severity: P3
decision_priority: MEDIUM
triage: NEEDS_REVIEW
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

Stable fingerprint:

`herdr-skills + advertised compatible-host ~/.agents/skills install/discovery path + SKILL.md helper commands hard-code ~/.codex/skills + compatible host installs only to ~/.agents/skills + helper invocation resolves to nonexistent Codex path`

**Why P3, not P2/P1:** current main source proves the secondary supported-path contradiction, but core Codex install still works and there is no measured non-Codex usage/completion-rate impact.

**Minimum choices:**
1. If owner intent is Codex-only, narrow/remove the compatible-host claim. This is the smallest valid fix.
2. If portable host support is intended, resolve helpers from the loaded skill directory (or one explicit host skill-root variable) and test a fixture with only `~/.agents/skills` present.
3. Do not create a host registry, installer service, compatibility database or new state framework.

Tracked as `Reese-max/herdr-skills #10`.

### 2. Use `gh skill` for installation/update provenance — HOLD / OPTIONAL

GitHub now supplies host-specific install, pinning, source/ref/tree-SHA provenance and update checks. This could reduce manual-copy/update ambiguity in the README, but there is no evidence that the owner currently suffers stale manual installations or wants GitHub CLI as a required dependency.

Classification:

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: LOW
triage: NEEDS_EVIDENCE
auto_implementation: false
```

Smallest future experiment: on an isolated clone/account path, determine whether `gh skill` can install the private repo's two skills into the intended Codex user scope while preserving current frontmatter and without exposing private content. No Issue now.

### 3. Enterprise/Microsoft packaging — DO NOT COPY now

Microsoft's sandbox/governance/package model is useful evidence that hosts increasingly own execution policy. It does not create a user job for this personal Herdr repository to add M365 manifests, tenant admin controls, sensitivity-label infrastructure or hosted skill bundles.

## Opportunity Map — `herdr-skills`

### MUST MATCH

- Advertised install/discovery paths and executable helper examples must agree.
- `candidate != active rule != permission`; portable packaging must not weaken the existing Reflect/Supervisor authority boundaries.
- Runtime/provider state is evidence input, not authorization.
- Cross-host claims must remain scoped to behavior actually tested; unknown host/runtime behavior stays UNKNOWN.
- Active #3/#6 scopes remain separate from packaging/path compatibility.

### SHOULD BE BETTER

- Resolve helper scripts relative to the actual loaded skill location when claiming host portability.
- Keep host-specific storage/runtime assumptions explicit rather than hiding them behind a broad "compatible" label.
- Prefer ecosystem provenance/pinning capabilities over inventing another package/update database if update drift becomes a real problem.

### DIFFERENTIATOR

- Evidence-backed Reflect promotion/staleness/conflict semantics.
- Supervisor's machine-checkable run/effect/completion gate over Herdr.
- Local privacy-preserving state and explicit separation of memory, policy and permission.
- Thin policy/evidence overlay rather than another generic agent host.

### ADJACENT IDEA

- Optional documented `gh skill` installation/pinning flow after a private-repo isolated compatibility test.
- A tiny compatibility fixture matrix for the install paths the README actually claims, not a broad host certification platform.

### DO NOT COPY

- Microsoft tenant/admin/governance stack.
- GitHub/Cursor agent marketplace or host runtime.
- Universal package manager / skill registry.
- Automatic unreviewed skill updates.
- Cross-host state migration framework without a demonstrated workflow.
- Claiming Cursor/Gemini/Copilot compatibility merely because they parse `SKILL.md`.

## Cross-portfolio ideas

### 1. Portable artifact syntax is not portable behavior

Across `herdr-skills`, `skill-foundry`, automation skills and other Reese-max agent artifacts, a common file format (`SKILL.md`) only proves that a host can discover/parse the package. It does **not** prove that scripts, filesystem roots, permission models, hooks, tools or runtime evidence have equivalent semantics.

Reusable invariant:

`package discovered -> host/runtime compatibility tested -> behavior claim scoped -> evidence receipt`

not:

`same file extension -> portable behavior`.

This is a design principle, not a proposal for a shared compatibility service.

### 2. Let host ecosystems own commodity install/update provenance

Where GitHub/Copilot/other hosts already expose source SHA, pinning and update provenance, Reese-max projects should first consume or document those primitives before designing another registry. Product code should focus on the domain-specific policy/evidence contract.

Again, this does not justify a portfolio-wide package manager.

## Four-gate decisions

### Candidate A — advertised portable path invokes Codex-only helper location

1. **Problem/value:** current source explicitly advertises `~/.agents/skills` for compatible hosts while executable examples point to `~/.codex/skills`; first-party platform docs confirm `~/.agents/skills` is a real portable discovery location. A user following the advertised path can receive a broken helper command. Core Codex path still works.
2. **Priority:** `BUG / P3 / MEDIUM / NEEDS_REVIEW`; no synthetic score used. P2/P1 rejected because actual non-Codex usage/frequency and runtime impact are unmeasured.
3. **Minimum solution:** choose one: (a) narrow docs to Codex-only; or (b) resolve helpers relative to actual loaded skill root and cover the alternate path with a deterministic fixture. No host registry/package manager/new state machine.
4. **Research/implementation separation:** issue creation tracks the defect but `auto_implementation=false`; a source fix still requires normal owner implementation authorization. Runtime/isolated path verification remains required before claiming a real compatible-host pass.

Decision: **CREATE ISSUE #10**.

### Candidate B — switch installs to `gh skill`

1. **Problem/value:** manual copy can drift, and GitHub provides pinning/provenance/update semantics. No owner evidence shows stale installs are currently a repeated bottleneck.
2. **Priority:** `OPPORTUNITY / NOT_ESTABLISHED / LOW / NEEDS_EVIDENCE`.
3. **Minimum solution:** isolated one-command install/update experiment before any README or dependency change.
4. **Research/implementation separation:** no Issue and no GitHub CLI dependency is added.

Decision: **HOLD**.

### Candidate C — package Herdr for Microsoft 365/Copilot Studio

1. **Problem/value:** Microsoft now consumes `SKILL.md`, but no Herdr user job exists inside that enterprise surface and Herdr local-state/runtime dependencies are not proven compatible.
2. **Priority:** `OPPORTUNITY / NOT_ESTABLISHED / LOW`.
3. **Minimum solution:** none; do not build until there is an actual target workflow.
4. **Research/implementation separation:** external platform adoption is not authorization.

Decision: **REJECT/DEFER**.

## Rejected Ideas / why

1. **Build a universal Agent Skills installer/registry — REJECT.** GitHub/hosts increasingly provide commodity install/update/provenance primitives; no unique Herdr gap requires a new service.
2. **Declare Copilot/Cursor/Gemini support immediately — REJECT.** Discovery of `SKILL.md` does not verify Herdr, Python helper, state-root or authorization behavior.
3. **Move all state from `~/.codex/state` to a new universal directory in #10 — REJECT.** The demonstrated defect is helper path resolution; state-root portability is a separate unknown unless a real fixture proves it blocks the intended host.
4. **Add Microsoft manifests/admin/sensitivity systems — REJECT.** Enterprise-host governance is outside this personal product's current job.
5. **Auto-update skills from upstream — REJECT.** Silent skill changes are themselves a supply-chain risk; no update-frequency pain is established.
6. **Fold #10 into #3 or #6 — REJECT.** Different trigger/root cause/workflow gap; combining would make active scopes larger and less verifiable.
7. **Modify PR #8/#9 — SKIPPED_ACTIVE_SCOPE.** No overlap is required to solve #10.

## Issue Mapping

- **New Issue:** `Reese-max/herdr-skills #10` — `[P3][Compatibility] Make the advertised ~/.agents/skills path executable or narrow support to Codex`.
  - URL: https://github.com/Reese-max/herdr-skills/issues/10
  - Read-back verified open after creation.
  - `auto_implementation=false`; no worker/branch/PR/deploy started.
- Existing Issue edits/comments: **0**.
- PR edits/comments: **0**.
- Existing #3/#6 and PR #8/#9 remain untouched.
- Locks: no existing Issue/shared candidate was mutated. New Issue was created only after repeat duplicate/coordination search found no matching fingerprint; no post-create body/comment mutation was performed.

## Sources

Primary public sources checked this round:

1. Microsoft Agent Builder — Add custom skills; updated 2026-09-04: https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/agent-builder-add-skills
2. Microsoft custom skills in declarative agents — current preview/security/governance docs: https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/declarative-agent-skills
3. Microsoft Copilot Studio Skills overview; updated 2026-09-09: https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/skills-overview
4. GitHub Changelog — `gh skill`, 2026-04-16: https://github.blog/changelog/2026-04-16-manage-agent-skills-with-github-cli/
5. GitHub Docs — About Agent Skills, current checked 2026-09-20: https://docs.github.com/en/copilot/concepts/agents/about-agent-skills
6. GitHub Docs — install/update/publish skills, current checked 2026-09-20: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills
7. Cursor Docs — Agent Skills, current checked 2026-09-20: https://cursor.com/docs/skills
8. Google Codelab — Gemini CLI Agent Skills, current checked 2026-09-20: https://codelabs.developers.google.com/gemini-cli/how-to-create-agent-skills-for-gemini-cli

Repository evidence:

- `Reese-max/herdr-skills@9f134e1b0a53ffe72a64a5793ddc7dabe03ed571`
- `README.md`
- `herdr-reflect/SKILL.md`
- `herdr-supervisor/SKILL.md`
- `tests/test_skill_contracts.py`
- existing Issues #2/#3/#6; all-state PR list including active #8/#9
- prior Herdr external radar `docs/competitive-intelligence/2026-09-15T175655Z-external-radar.md`

## What Changed

1. Fair rotation advanced from `google-maps-personal-mcp` to **`herdr-skills`**; next cursor = **`lobsterpulse`**.
2. Fresh owner inventory remains **42 owned / 41 unarchived**, with second page empty.
3. September Microsoft updates further establish `SKILL.md` as a governed multi-host agent package, while current GitHub/Cursor/Gemini docs confirm `.agents/skills` is a real portability surface.
4. Current `herdr-skills` source contains a distinct compatibility contradiction: it advertises alternate `.agents/skills` discovery but executable helper/validator examples are hard-coded to `.codex/skills`.
5. New **P3 BUG #10** created with a deliberately small choice: either narrow the claim to Codex or make helper resolution follow the actual loaded skill root. No universal compatibility framework was proposed.
6. Existing #3/#6 and active PR #8/#9 were left untouched.

## Severity / scope calibration

- #10 is **P3**, not P2/P1: source-level contradiction is confirmed, but primary Codex flow remains intact and no real non-Codex user/runtime failure or frequency has been measured.
- Microsoft/GitHub/Cursor platform capability is not independent proof that Herdr works under those hosts.
- `SKILL.md` portability is packaging evidence, not runtime/permission equivalence.
- Existing #6's historical `P1 Research` wording remains research urgency, not proof of a current P1 defect under Issue Quality v2.
- No opportunity score or synthetic persona count was used to escalate priority.

## Completion / gaps / cursor

Completed:
- Issue Quality v2 re-read and rules SHA recorded.
- Fresh full owner pagination, page 2 empty.
- Focal current HEAD, README/SKILL/test contracts, open/closed Issues, all-state PRs, historical Herdr radar and duplicate/lock search checked.
- Public web exploration completed with recent Microsoft first-party changes plus current GitHub/Cursor/Gemini host contracts.
- New Issue #10 created and read back successfully.

Not completed / explicitly unknown:
- no real non-Codex Herdr execution;
- no isolated `.agents/skills` fixture was run by this radar;
- no private-repo `gh skill install` experiment;
- no owner usage telemetry establishing cross-host frequency;
- no runtime evidence that `~/.codex/state` is itself a portability blocker;
- no product source modification or implementation authorization.

**Next fair cursor: `Reese-max/lobsterpulse`.**
