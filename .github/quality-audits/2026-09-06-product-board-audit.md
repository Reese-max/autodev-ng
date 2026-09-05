# Reese-max Portfolio Product Board Audit — 2026-09-06

> Evidence level: repository/static evidence + public-market research + synthetic-persona reasoning. This is **not** a claim of 50 real users, live browser testing, provider execution, deployment verification, or neutral third-party market research.

## Executive Summary

- Portfolio inventory: **39 owned, unarchived repositories**.
- Prior evidence-first Round 0 already completed discovery for 39/39 and opened actionable issues; this Product Board round **reuses that evidence** instead of pretending every repository was newly runtime-tested.
- `gooaye` remains an empty repository and is NOT APPLICABLE for product/persona runtime evaluation until a product surface exists.
- Deep market/product-board review in this run prioritized repositories with clear product surfaces, recent activity, and identifiable competitive markets: `autodev-ng`, `92-duty-scheduler`, `cyber-prep-coach`, `ai-novel-workstation`, `video-timeline-pipeline`.
- New actionable issue created after duplicate check: `cyber-prep-coach#3` — add official-spec simulation mode alongside the current 50-question training simulation.
- Existing umbrella issues were updated instead of duplicated where the underlying root cause already existed.
- No repository is marked CLEAN solely from this market/persona pass. Runtime-dependent paths remain `NEEDS_RUNTIME_VERIFICATION` unless CI/execution evidence exists.

## Evidence Rules

- **CONFIRMED**: repository code/docs/CI/issue evidence or dated public source.
- **LIKELY**: reasoned product inference supported by multiple signals.
- **UNKNOWN**: needs runtime, user research, provider/account, or deployment evidence.
- Synthetic Preference Share is not reported as real market share. Where personas are used, results are explicitly synthetic.

## Market / Competitive Review

### 1. autodev-ng

**Position:** local-first multi-agent engineering orchestration and governance layer, not merely another coding CLI.

**Comparable market:** OpenHands-style agent platform/orchestration, Devin managed autonomous engineering, delegated Codex/Claude Code/Copilot workflows.

**CONFIRMED repository differentiators:** multi-engine adapters, Git/worktree ownership, shared claim/cost state, single Merge Captain, reviewer/release receipt gates, Fleet Guardian, bounded GOAL loop, CLI/Discord/Web control surfaces.

**Market gap:** first-success/onboarding and proof of governed long-running execution matter more than adding more engines. Existing umbrella issue already records first-run cognitive load, so no duplicate feature issue was created.

**Board verdict:** `INVEST + SIMPLIFY`.

CEO top 3:
1. Resolve secret/credential P0 before expansion.
2. Make the safe first successful run dramatically easier.
3. Publish repeatable runtime evidence for multi-repo/provider-failure/recovery scenarios.

**Do not copy:** another full cloud control plane merely because competitors offer one; more provider adapters without adoption/runtime evidence.

### 2. 92-duty-scheduler

**Position:** rules-heavy, privacy-friendly, self-deployable duty scheduling for school / military / police / shift organizations.

**Comparable market:** Deputy, When I Work, Sling, Homebase, 7shifts, Shiftboard/other workforce scheduling systems.

**CONFIRMED differentiators:** one-click constraint scheduling, cross-duty swaps, course/availability awareness, Excel round-trip, local tenant configuration, self-owned Cloudflare/D1 deployment, no telemetry, domain-specific constraints.

**Market gap:** mainstream scheduling products increasingly connect schedule + employee self-service + mobile + time/attendance + communications + integrations. This project should not blindly become an HR suite; its strongest moat is high-constraint scheduling, privacy, deployability, and organization-specific Excel compatibility.

**Critical prerequisite:** existing P0 cross-student timetable write authorization issue must be fixed before product expansion.

**Board verdict:** `INVEST`, with safety and domain depth before breadth.

CEO top 3:
1. Fix authorization/data-integrity boundary.
2. Prove deployment/runtime smoke gates and semester-transition correctness.
3. Productize reusable organization templates / constraint packs rather than chase payroll/HR breadth.

### 3. cyber-prep-coach

**Position:** evidence-first iPAS Intermediate cybersecurity exam preparation product, not a generic cyber-lab platform.

**Comparable/adjacent market:** official exam materials and exam-prep tools; broader cyber-learning platforms such as TryHackMe, Hack The Box, Cybrary and SANS/GIAC are indirect competitors for learner time, not feature-for-feature targets.

**CONFIRMED differentiators:** 880-question structured bank, source/right/provenance gates, AI explanation review with hashes, historical-paper traceability, local backup/restore, focused iPAS workflow.

**Confirmed product gap:** README states current core simulation is 50 questions / 60 minutes while official 115 spec is 40 questions per subject / 90 minutes. Current text correctly says the 50-question exam is custom training, but there is no official-spec pacing mode described.

**Action:** created `#3 [Competitive Gap][P2][FEATURE]` to keep the training simulation and add a clearly separated official-spec simulation mode without inventing unknown scoring rules.

**Board verdict:** `INVEST`.

CEO top 3:
1. Deepen iPAS exam fidelity rather than imitate broad cyber labs.
2. Keep source/provenance as a visible trust advantage.
3. Validate mobile/local-backup/resume and exam-mode comprehension with runtime evidence.

### 4. ai-novel-workstation

**Position:** local-first Traditional-Chinese long-form fiction production workstation.

**Comparable market:** Sudowrite, NovelCrafter, NovelAI, Scrivener/author workspaces.

**CONFIRMED differentiators:** single `production-loop`, story-truth source, checkpoint/resume, fail-closed budget/time/token gates, optional image/comic production, local creative console, static reading site, no automatic deployment.

**Market gap:** competitors emphasize editor-first workflows, story bible/context visibility, long-series continuity and low-friction browser onboarding. The repository already contains substantial workflow capabilities; the current uncertainty is whether nontechnical writers can complete first-book → draft → revise → export without CLI-level mental overhead.

No new P0/P1/P2 issue created: that gap needs runtime/persona evidence before promotion to an implementation issue.

**Board verdict:** `INVEST`.

CEO top 3:
1. Validate first-success in the creative console.
2. Make continuity/story-context state visible and trustworthy to writers.
3. Surface per-book/per-phase cost and checkpoint provenance without adding another workflow engine.

### 5. video-timeline-pipeline

**Position:** local-first evidence/timeline/knowledge pipeline for videos, with RSS/author discovery, transcription, visual analysis, search and knowledge outputs.

**Comparable market:** Descript/Riverside-like transcript/video workspaces, OpusClip-like AI processing, plus local knowledge/RAG tooling. These are adjacent rather than exact substitutes because this repository prioritizes evidence, ingestion, timeline fidelity, batch/RSS monitoring and local knowledge retention rather than video editing/clip creation.

**CONFIRMED differentiators:** resumable multi-layer cache, Groq + MiniMax split pipeline, stable source fingerprints, cost opt-ins, RSS/podcast queue, Facebook/Instagram discovery adapters, local DB/index, evidence-linked output.

**Existing roadmap already covers** notification/digest, scoring, cost/budget, hybrid search/RAG, web dashboard and durable operations. Creating new issues for those themes would be duplicate noise.

**Board verdict:** `INVEST / SIMPLIFY ROADMAP`.

CEO top 3:
1. Deliver one narrow useful intelligence loop end-to-end before expanding all roadmap branches.
2. Preserve local-first/evidence/cost-control differentiation.
3. Prove timestamp fidelity, partial-failure recovery and batch-cost behavior with reproducible canaries.

## Synthetic Persona Board

For each deep-reviewed repository, the 50-persona model was adapted to the target market. Results below are synthetic reasoning, not real user research.

### autodev-ng
- Highest friction cluster: new maintainers/operators facing config + engine + review + cost + bot concepts before first safe success.
- Strongest perceived value: local multi-agent control, evidence gates, model/provider flexibility.
- Switch risk: users preferring zero-ops cloud management may choose Devin/OpenHands Cloud; users requiring local/control may prefer autodev-ng if onboarding is credible.

### 92-duty-scheduler
- Highest risk cluster: students/operators trusting personal timetable writes before authorization is fixed.
- Strongest perceived value: organization-specific constraints + Excel + self-hosted data.
- Switch risk: generic business users may prefer mature workforce suites; police/school users with custom duty rules may prefer this product if safety/runtime trust is proven.

### cyber-prep-coach
- Highest friction cluster: exam-focused personas needing official pacing may not know whether the 50-question simulation is training or formal-spec rehearsal.
- Strongest perceived value: iPAS-specific source provenance and historical-question structure.
- Switch risk: hands-on learners may choose lab platforms; certification-focused iPAS learners have a clearer reason to stay if exam fidelity is complete.

### ai-novel-workstation
- Highest friction cluster: nontechnical authors moving from create to long-run production and revision/recovery.
- Strongest perceived value: local-first, long-form continuity, production checkpoints, optional visual pipeline.
- Switch risk: writers prioritizing polished browser editor UX may choose Sudowrite/NovelCrafter; privacy/control/Traditional-Chinese production users may prefer this workstation.

### video-timeline-pipeline
- Highest friction cluster: operators managing provider cost, partial failures, provenance and batch monitoring.
- Strongest perceived value: evidence-rich local timeline + reusable cache + monitoring ingestion.
- Switch risk: creators wanting editing/clip generation will choose Descript/OpusClip; researchers/operators wanting traceable local knowledge may prefer this pipeline.

## Red Team

1. **Competitor bias:** vendor-authored comparisons were used only to discover market dimensions, not as neutral product rankings.
2. **Persona bias:** synthetic personas cannot establish actual conversion, retention, willingness-to-pay, or satisfaction.
3. **Feature-bloat risk:** do not turn `92-duty-scheduler` into full HR/payroll, `cyber-prep-coach` into a generic cyber lab, or `video-timeline-pipeline` into a full video editor solely because adjacent competitors offer those capabilities.
4. **Over-engineering risk:** `autodev-ng` and `video-timeline-pipeline` already have broad roadmaps; priority should be smaller verified end-to-end loops.
5. **Safety sequencing:** existing P0/P1 auth, secret, medical, provenance and deletion issues outrank strategic polish.

## Portfolio CEO Review

### INVEST
- `autodev-ng` — strong platform-level differentiation if safety/onboarding/runtime evidence improve.
- `92-duty-scheduler` — distinctive domain constraints and self-deployability; fix auth first.
- `cyber-prep-coach` — strong focused exam/product trust story.
- `ai-novel-workstation` — substantial production workflow and local-first differentiation.
- `video-timeline-pipeline` — strong local evidence/knowledge pipeline; roadmap should converge around a narrower shipped loop.
- `taichung-police-intel` — specialized evidence-first operational intelligence direction; continue runtime/freshness validation.

### MAINTAIN / VALIDATE
- `MaterialYouNewTab`, `skill-foundry`, `herdr-skills`, `cf-ai-router`, `cf-mcp-server`, `claude-mem`, `lobsterpulse`, `flux-image-gen`, `ppt-studio`, `minideck`, `soundbox-offline`, `UkePack`, `tick-stock-panel`, `note-filler`, `prompt-autoresearch`, `adng-memory`, `obsidian-vault` — retain only with clear owner/use case and runtime evidence; avoid expanding overlapping orchestration/control-plane concepts without portfolio reuse.

### REPOSITION / SIMPLIFY
- `gemini-deidentifier` — repository identity mismatch already tracked; resolve naming/product identity.
- `chatgpt-dual-pipeline` — repository/product source-of-truth identity mismatch already tracked.
- `exam-archive` / `police-exam-archive` / `police-exam-practice` — rationalize canonical exam-data vs practice-app responsibilities; compatibility/redirect repository should stay intentionally thin.
- `taiwan-intel-dashboard` — currently paused; maintain restoration contract rather than parallel active development with `taichung-police-intel` unless scopes are explicitly different.
- `internship-notes-sites-mirror` — treat as mirror/publishing infrastructure, not an independent product roadmap.

### PAUSE / ARCHIVE CANDIDATE
- `gooaye` — empty repository; define purpose or archive.

## Shared Platform Opportunities

Potential reusable layers to evaluate before building duplicates:
- provider / model credential references and cost accounting (`autodev-ng`, `cf-ai-router`, `video-timeline-pipeline`, `ai-novel-workstation`);
- audit/evidence schema and runtime receipts;
- shared design primitives for small internal/public tools;
- auth/abuse protection patterns for Cloudflare worker/pages projects;
- common backup/restore and provenance UI patterns;
- common agent governance concepts across `autodev-ng`, `herdr-skills`, `skill-foundry`, `claude-mem`.

These are opportunities, **not** instructions to merge code immediately. A shared layer is justified only after two or more repositories have the same stable contract.

## Issue Summary for This Product-Board Pass

- New issue: `cyber-prep-coach#3` — official-spec simulation mode vs custom training simulation.
- Updated existing umbrella: `autodev-ng#2` — added market/board positioning; no duplicate “more agents” issue.
- Updated existing umbrella: `ai-novel-workstation#1` — added market/board positioning; runtime evidence required before new feature issue.
- Existing `92-duty-scheduler#13/#14` remain priority because product expansion is blocked by authorization/runtime trust.
- Existing `video-timeline-pipeline#2–#7` already cover the major planned intelligence-product expansion; no duplicate issue created.

## NOW / NEXT / LATER / DON'T

### NOW
- Resolve P0/P1 safety/auth/secret/provenance defects already open.
- `cyber-prep-coach`: implement/validate official-spec simulation separation (#3).
- Produce runtime evidence for the top product paths rather than more static claims.

### NEXT
- Consolidate shared operational patterns where contracts are proven stable across repositories.
- Run real task-based usability tests for top INVEST products.
- Establish per-product success metrics beyond test counts (task completion, recovery success, freshness, provenance comprehension, cost predictability).

### LATER
- Broader growth features, collaboration, billing, cloud multi-user layers only after product-level retention/use evidence exists.

### DON'T
- Copy adjacent competitors feature-for-feature.
- Treat synthetic persona preference as market share.
- Mark runtime paths passed from static code review.
- Expand low-value repos merely to keep them active.

## Decision

Portfolio recommendation: **FOCUS + INVEST SELECTIVELY**. The strongest opportunity is not increasing repository count; it is turning a small set of differentiated projects into reliably testable products and extracting only the proven common infrastructure afterward.
