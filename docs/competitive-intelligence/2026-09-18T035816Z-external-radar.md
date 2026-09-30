# External Competitor / New Product / Workflow Radar — 2026-09-18T03:58:16Z

Status: COMPLETE (research/reporting only)
Worker: `external-radar`
Primary product this round: `Reese-max/skill-foundry`
Rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`

## Portfolio / scope check

- Fresh connected-owner listing: **41 Reese-max-owned repositories / 40 unarchived**. `obsidian-vault` is archived. The listing fit in one 100-item page; no older inventory was treated as authoritative.
- Fair-rotation cursor entering this round: `Reese-max/skill-foundry`.
- `skill-foundry` default branch: `main`; current HEAD re-read as `21be2b62b72fb3030b50b08a078da2f6569961be` (`docs: record fixed 50-persona audit round 3`). The current product parent is `e865c0057f49b55cab5215aeb884d0992c4e7fef`.
- Owner-approved direction remains `INVEST / SIMPLIFY`: keep Skill Foundry as a narrow **certification / promotion plane** for reusable Agent Skills; do not turn it into a hosted marketplace, generic orchestration runtime, observability suite, workspace SaaS, or second memory/registry product.
- Existing active implementation scopes were not taken over: PR #2 / branch `github-1-runtime-compatibility` for #1; PR #8/#9 and their branches for #6 CI validation. #4 has no implementation branch/PR.

## Product → market category

`skill-foundry` maps to: Agent Skill evaluation/certification, evidence-gated promotion, supply-chain provenance, runtime compatibility, and cross-agent distribution verification. Direct/adjacent products and workflows checked this round include GitHub `gh skill`, Notion team Agent Skills, current public skill/package ecosystems, and agent-supply-chain security research.

## External Signals

### 1. Plugin4Shell makes the #4 exact-install identity boundary materially more important

**CONFIRMED_VENDOR_RESEARCH — AIR Security, published 2026-09-17; checked 2026-09-18**

Source: https://www.air.security/blog-posts/plugin4shell

AIR disclosed a SHA-pinning bypass it calls Plugin4Shell across major coding-agent plugin clients. The important product fact for Skill Foundry is not the exploit brand or vendor count; it is the failure shape:

`requested/pinned source identity != proof of the bytes that were actually materialized`

AIR reports that affected clients could fetch/record a pinned commit but fail to verify the resolved checkout after materialization. It says coordinated disclosure led to fixes in Claude Code 2.1.179 and Codex 0.146.0, while Copilot had no shipped fix at publication and Gemini CLI would not be patched. Those patch/version statements are treated here as **vendor-research claims**, not independent runtime verification by this radar.

**User job / manual break:** after a Skill has passed Foundry evaluation/certification, a maintainer needs to know that the target actually contains the exact revision that was certified. A transport saying “commit X was pinned/installed” can be insufficient if the resulting working tree is different.

**What to transfer:** post-materialization read-back and independent hash recomputation before declaring `INSTALLED_MATCH`; keep client/runtime version identity with the receipt, preferably by reusing #1 TargetRuntimeProfile identity.

**What not to copy:** AIR’s runtime firewall / fleet-governance product, a new marketplace, a new scanner, or broad auto-update control plane. There is no current evidence that Skill Foundry itself has an implemented vulnerable marketplace/update path.

### 2. GitHub is commoditizing Skill discovery/install/update across many agent hosts

**CONFIRMED — current GitHub CLI docs checked 2026-09-18**

- Install: https://cli.github.com/manual/gh_skill_install
- Preview: https://cli.github.com/manual/gh_skill_preview
- Update: https://cli.github.com/manual/gh_skill_update
- List: https://cli.github.com/manual/gh_skill_list

Current `gh skill` supports a wide matrix of coding-agent hosts, project/user scope, source/version metadata, exact tag/commit selection, preview without installation, and update checks. `gh skill update` compares stored local tree metadata to remote state and skips pinned skills unless explicitly unpinned. GitHub’s own Skill docs also warn that Skills are **not verified by GitHub** and may contain malicious instructions/scripts.

**Product signal:** install-path mapping, multi-host projection and basic update/version plumbing are becoming package-manager responsibilities. This strengthens the prior #4 NARROW decision: Foundry should not recreate a cross-agent installer matrix unless the thin verification experiment proves an unmet need.

**Do not infer:** GitHub metadata, pinning, preview, or update state is not equivalent to Foundry certification, runtime compatibility, package-security attestation, or observed installed-byte identity.

### 3. GitHub added skill/customization usage metrics, but usage is not quality evidence

**CONFIRMED — GitHub Changelog, 2026-09-17**

Source: https://github.blog/changelog/2026-09-17-agentic-cli-customizations-now-in-the-usage-metrics-api/

GitHub’s enterprise/org usage metrics now include skills, custom agents, MCP servers, slash commands, and plugins. Reports expose top-used items and distinct-item counts. GitHub explicitly defines these as activity/adoption measures; e.g. MCP interaction count can rise on connection attempts whether successful or failed.

**Transferable idea:** if Skill Foundry ever ingests post-promotion usage data, it must preserve the difference between `invoked/connected` and `successful/high-quality`. Interaction counts can prioritize where to spend evaluation effort, but cannot become certification evidence.

**Decision this round:** `ADJACENT IDEA`, no Issue. Current owner direction explicitly rejects turning Foundry into an observability/analytics suite, and no repo evidence shows a current user workflow blocked by missing usage analytics.

### 4. Notion moved toward an agent-neutral, collaborative skills library

**CONFIRMED — Notion 3.7, 2026-09-15; Notion blog, 2026-09-17**

- https://www.notion.com/releases/2026-09-15
- https://www.notion.com/blog/a-skills-library-for-every-agent

Notion now positions shared Skills as organizational knowledge: one library, permissions/version history, collaborative improvement, download as `SKILL.md` plus approved supporting files, and cross-agent export to Claude Code, Codex, Cursor, Gemini and Grok. Changed Skills are marked so users know to download the latest version.

**User job reduced:** teams no longer need to keep reusable instructions in one person’s chats/docs or manually rediscover which copy is current.

**Transferable signal:** cross-agent distribution and version-awareness are becoming expected workflow infrastructure.

**Do not copy:** Notion’s workspace library, team collaboration surface, mobile app, agent orchestration, or automatic execution. Skill Foundry’s differentiated job remains evidence-bound evaluation/certification, not team knowledge management.

## New Releases / strategy changes

- **2026-09-17 AIR Plugin4Shell:** real-world counterexample to treating a reported SHA pin as proof of materialized content. Highest-value signal this round.
- **2026-09-17 GitHub Copilot metrics:** skills/plugins/MCP/custom-agent activity became a first-class enterprise adoption metric.
- **2026-09-17 Notion skills-library strategy post / 2026-09-15 Notion 3.7:** skills are being productized as shared, agent-neutral organizational knowledge with version-awareness and export.
- **Current GitHub CLI:** broad host support confirms that target-path projection/update/version resolution is increasingly external package-manager infrastructure rather than Foundry’s unique value.

## Community Pain

Community evidence is directional only and is **not** treated as prevalence.

### Skill value depends on repeatability; more Skills is not automatically better

**COMMUNITY_SIGNAL — Reddit, 2026-09-16/17**

https://www.reddit.com/r/claude/comments/1whvzqi/do_you_still_use_skills_in_september_2026/

Recent discussion includes both heavy daily Skill users and users who removed most Skills or prefer ordinary Markdown/docs. Repeated themes: Skills are useful for repeatable processes and lazy-loaded context, but extra layers can be unnecessary when there is no repeatable job or measurable benefit.

This supports Skill Foundry’s existing with/without and negative-transfer philosophy: **do not certify a Skill merely because one can be authored.** No new Issue.

### Maintainers are already testing published Skills on PRs

**COMMUNITY_SIGNAL — Reddit, 2026-09-15**

https://www.reddit.com/r/ClaudeCode/comments/1wgzh4g/we_test_our_published_skills_on_every_pr_curious/

One maintainer describes mapping changed Skills to deterministic eval tasks across multiple coding agents because a Skill can still lint/load while quietly losing intended behavior. This aligns with Foundry’s existing evidence-gated regression/evaluation direction and provides no distinct uncovered root cause.

## Adjacent Ideas

1. **Transport metadata should be treated as a claim, not observation.** A source ref, lockfile, marketplace review, or installer success receipt is useful provenance but cannot replace read-back of the materialized artifact.
2. **Usage telemetry can rank evaluation attention, not quality.** If future integrations expose invocation counts, preserve them as operational/adoption evidence only.
3. **Skills are becoming agent-neutral organizational artifacts.** This increases the value of portable certification identity, but decreases the value of Foundry building its own library/installer UI.
4. **Cross-portfolio candidate:** any Reese-max workflow that later consumes externally distributed Skills/plugins should distinguish `requested identity` from `observed materialized identity`. No other repository received an Issue because this round did not validate an active equivalent distribution path elsewhere.

## Opportunity Map — skill-foundry

### MUST MATCH

- **Exact materialized identity before “installed-certified”.** Future distribution work must independently read target bytes and recompute the Foundry identity. Transport pin/ref/tree metadata alone is insufficient.
- **Separate evidence planes.** #1 runtime compatibility, #3 package security, #4 install identity, and certification/promotion must not silently upgrade one another.

### SHOULD BE BETTER

- Reuse existing transport/package-manager capabilities rather than maintaining target-specific path/update matrices.
- Keep the exact client/runtime identity attached to install verification, reusing #1 where possible rather than creating another registry.

### DIFFERENTIATOR

- Foundry can bind one exact Skill revision to sources, eval set, policy, security state, runtime profile and—if #4 eventually BUILDs—independently observed installed bytes. Neither a generic Skill library nor package manager supplies that complete evidence chain.

### ADJACENT IDEA

- Optional future post-promotion usage/adoption signals for prioritizing re-evaluation, explicitly non-certifying.
- Collaborative suggestions/version history are useful market patterns, but currently belong outside Foundry’s approved narrow product surface.

### DO NOT COPY

- Skill marketplace/rankings/store.
- Team workspace/knowledge-library SaaS.
- Generic usage analytics/observability suite.
- Runtime firewall/fleet-management product.
- Silent auto-update.
- “Pinned/ref recorded” → “installed verified” shortcuts.

## Four-gate decision

### Gate 1 — problem/value

For current main, there is **no implemented #4 distribution path** and no observed Skill Foundry security incident. Therefore Plugin4Shell is not evidence of a current production defect. It is, however, a strong external counterexample supporting the already identified workflow gap: a future target install must independently prove the installed revision.

Current repo evidence already includes exact Skill tree hashes and prior bounded #4 experiments showing post-copy hash equality/drift detection; true `spm`/compatible MCP-client end-to-end installation remains unverified.

### Gate 2 — priority

#4 remains:

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM_HIGH`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- `decision=NARROW`

The security event does **not** justify P0/P1/P2 for the current product because the affected marketplace auto-update path is not current supported Skill Foundry behavior. It does make post-materialization verification a mandatory future BUILD acceptance boundary.

### Gate 3 — minimum solution

Do not build a registry, installer, marketplace, scanner, background updater or runtime firewall.

The only retained minimum candidate is a thin verification bridge:

`certified desired hash + external transport/source identity + client/runtime version ref + observed post-materialization bytes/hash + explicit state`

Only `observed == desired` may become `INSTALLED_MATCH`. If read-back is impossible or transformation cannot be proven, state remains `UNKNOWN/TRANSFORMED/MISMATCH`.

### Gate 4 — research / implementation separation

Next decision-changing experiment remains bounded and benign: one certified synthetic revision, one authorized isolated transport/client version, one target, real read-back/recompute, and a harmless one-byte local mutation to demonstrate drift detection. No malicious payload, no production home/account, no multi-client matrix.

- BUILD: only thin bridge if true end-to-end materialization and independent read-back match.
- NARROW: deterministic transform or partial visibility; preserve UNKNOWN/TRANSFORMED semantics.
- REJECT: no trustworthy read-back without high new authority/service burden.

No implementation authority was granted.

## Issue Mapping

### Updated

`Reese-max/skill-foundry#4` — `[Competitive Inspiration][Research][RESEARCH_REQUIRED] Certified Skill Distribution Bundle + Install Receipt`

- Stable root cause remains the same; **no new Issue** was created.
- Lock comment: https://github.com/Reese-max/skill-foundry/issues/4#issuecomment-5724975997
- New external-evidence calibration: https://github.com/Reese-max/skill-foundry/issues/4#issuecomment-5724982477
- Release marker: https://github.com/Reese-max/skill-foundry/issues/4#issuecomment-5724984994
- Scope remains NARROW; new evidence makes post-materialization read-back plus client/runtime identity mandatory for any future BUILD decision.

### Not modified

- #1 / PR #2 runtime compatibility: active implementation scope.
- #3 package security: related but distinct; package scan is not installed-byte identity.
- #6 / PR #8/#9 CI validation: active implementation scopes.
- No other Issue, PR, branch, source, CI/config, permission or setting was changed.

## Rejected Ideas and reasons

1. **Create a new Plugin4Shell P1/P2 bug in Skill Foundry** — REJECT. Current main has no implicated marketplace auto-update/distribution implementation; external affected-agent evidence does not prove current product failure.
2. **Build a custom cross-agent installer now** — REJECT. `gh skill` and other package managers already absorb host/path/update work; prior #4 research already NARROWed this.
3. **Build a runtime security firewall / fleet inventory** — REJECT. Outside owner-approved Foundry scope and duplicates specialized security products.
4. **Treat interaction counts as Skill quality** — REJECT. GitHub defines these as usage/activity metrics, including some failed connection attempts; not certification evidence.
5. **Copy Notion’s Skills Library / collaboration UI** — REJECT. Useful market signal but explicitly outside Foundry’s narrow certification/promotion role.
6. **Auto-update certified Skills to “keep everyone current”** — REJECT. Conflicts with exact revision/certification identity and increases silent supply-chain risk.

## Sources

Checked 2026-09-18 unless otherwise stated.

1. AIR Security — Plugin4Shell (published 2026-09-17): https://www.air.security/blog-posts/plugin4shell
2. AIR Security — The Circus of Skills (published 2026-06-24): https://www.air.security/blog-posts/the-circus-of-skills
3. GitHub Changelog — Agentic CLI customizations in usage metrics API (2026-09-17): https://github.blog/changelog/2026-09-17-agentic-cli-customizations-now-in-the-usage-metrics-api/
4. GitHub CLI — `gh skill install`: https://cli.github.com/manual/gh_skill_install
5. GitHub CLI — `gh skill preview`: https://cli.github.com/manual/gh_skill_preview
6. GitHub CLI — `gh skill update`: https://cli.github.com/manual/gh_skill_update
7. GitHub CLI — `gh skill list`: https://cli.github.com/manual/gh_skill_list
8. Notion 3.7 (2026-09-15): https://www.notion.com/releases/2026-09-15
9. Notion — A skills library for every agent (2026-09-17): https://www.notion.com/blog/a-skills-library-for-every-agent
10. Reddit community signal (2026-09-16/17): https://www.reddit.com/r/claude/comments/1whvzqi/do_you_still_use_skills_in_september_2026/
11. Reddit community signal (2026-09-15): https://www.reddit.com/r/ClaudeCode/comments/1wgzh4g/we_test_our_published_skills_on_every_pr_curious/

## What Changed

- Fresh external evidence provided a real-world counterexample to “SHA pin recorded = exact content installed.”
- Existing #4 was updated under a 90-minute external-radar lease, read back, and released. No new Issue was created.
- The #4 decision did **not** move from NARROW to BUILD and severity did not change. The acceptance boundary was sharpened: independent post-materialization read-back is mandatory, and client/runtime identity should be linked using existing #1 evidence where possible.
- GitHub’s 2026-09-17 customization metrics and Notion’s 2026-09-17 skills-library strategy were retained as market signals but rejected as reasons to build analytics/workspace products.

## Runtime / evidence limits

- No real `spm`, `gh skill install`, marketplace plugin update, MCP Skill client, provider API, cloud authorization, malicious fixture, deployment or production action was executed this round.
- AIR’s affected/fixed version statements are preserved as vendor-research evidence; this radar did not independently reproduce Plugin4Shell or verify each vendor patch.
- README/static source/previous experiments are not relabeled as current real target-runtime proof.
- `NEEDS_RUNTIME_VERIFICATION` remains for #4’s true transport/client/read-back path.
- Radar does not declare portfolio CLEAN.

## Completion / gaps / cursor

- External exploration completed across direct Skill distribution, adjacent team workflow, current adoption/usage telemetry, supply-chain security and community practice.
- New Issues: **0**.
- Existing Issues updated: **1 (#4, evidence/scope calibration only)**.
- Product source / CI / config / secrets / permissions / settings / implementation branches / merge / deployment / workers / GOALs / paid calls / production data changes: **0**.
- Inventory: **41 owned / 40 unarchived**, unchanged from the previous connected listing.
- Fair-rotation next cursor: **`Reese-max/video-timeline-pipeline`**.
