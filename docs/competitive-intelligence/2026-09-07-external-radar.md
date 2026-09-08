# External Competitive / Product Inspiration Radar — 2026-09-07

> Scope: Reese-max non-archived repositories. External web research is the primary signal source; repository evidence is used to judge fit, duplication, and safety. Community discussions are tagged `COMMUNITY_SIGNAL` and are not treated as market-share or efficacy studies.

## Executive Summary

This first recorded external radar found two high-confidence opportunities strong enough to create GitHub Issues:

1. **cyber-prep-coach — local mastery profile + adaptive next-best study task**: the market is moving from static quiz banks toward persistent learner models that explain blind spots and the next action. This fits the existing local-first progress model without requiring a generic AI tutor.
2. **ppt-studio — slide/claim-level source provenance for imported content**: major creative tools are racing toward connectors and context ingestion, while community complaints still center on generic/hallucinated AI deck content. PPT Studio already imports URL/PDF/Markdown/JSON, so source-grounded generation is a stronger differentiator than copying more templates or SaaS collaboration.

A broader cross-portfolio pattern is also clear: **the valuable AI product unit is shifting from “a model that generates” to “a repeatable workflow bound to trusted context, explicit capabilities, evidence, and a review/verification surface.”** Linear, Codex, Canva, Feedly, and Readwise all show variants of this pattern.

## Product → Market Category Map

| Repository | Product / market category | Radar treatment |
|---|---|---|
| gemini-deidentifier | AI interactive-fiction / RPG product (repo identity currently mismatched) | ADJACENT research only |
| exam-archive | Exam archive / public learning reference | MUST MATCH performance / provenance; avoid feature bloat |
| police-exam-practice | Police exam practice | ADJACENT adaptive-learning pattern |
| police-exam-archive | Exam corpus / provenance archive | MUST MATCH source fidelity; keep archive role narrow |
| 92-duty-scheduler | Scheduling / constraint workflow | ADJACENT explainable what-if / rule-composition patterns |
| openab | Current category not confidently resolved this run | UNKNOWN / research required before competitive conclusions |
| UkePack | Music/chord project + practice workflow | SHOULD BE BETTER after authorization boundary |
| ppt-studio | AI presentation workstation | DIFFERENTIATOR candidate: source-grounded deck provenance |
| book5-windows-server-2022 | Learning/course content site | ADJACENT active-recall / source-derived learning aids |
| obsidian-vault | Personal knowledge/content repository | ADJACENT MCP / skills; avoid turning content repo into SaaS |
| voice-actress | Exam / essay grading & coaching | SHOULD BE BETTER with learner-state reuse after reliability fixes |
| taiwan-intel-dashboard | Public/intelligence dashboard | DIFFERENTIATOR via evidence packs and bounded source sets |
| autodev-ng | Multi-agent software delivery orchestrator | MUST MATCH independent proof/review UX; much core infra already exists |
| flux-image-gen | AI image-generation workspace | MUST MATCH safety / provenance / recoverable history before expansion |
| claude-mem | Agent memory / developer context | ADJACENT portable scoped memory + attribution |
| lobsterpulse | Developer-agent hooks / notification tooling | MUST MATCH config preservation; adjacent review-event UX |
| prompt-autoresearch | Prompt / experiment optimization | DIFFERENTIATOR via reproducible experiment/evidence ledger |
| neciken-summer-poem | AI literary-generation workflow | ADJACENT eval packs / editorial checkpoints |
| note-filler | Source-grounded legal/admin note filling | DIFFERENTIATOR via evidence/provenance, not generic generation |
| gooaye | Empty placeholder | N/A until purpose exists |
| lplrs-judicial-sync | Judicial data synchronization | MUST MATCH retention/deletion/source lifecycle |
| adng-memory | Operational memory/state store | N/A as end-user product; contract/recovery first |
| cyber-prep-coach | iPAS exam preparation | DIFFERENTIATOR candidate: local mastery / adaptive today task |
| cf-ai-router | AI provider/router infrastructure | ADJACENT explicit provider capability + cost/risk contracts |
| avatar-vfo | AI avatar/chat | DO NOT EXPAND before auth / tenant isolation |
| project-doctor-web | Clinical teaching/research UI | DO NOT EXPAND agentic actions before safety/runtime gates |
| minideck | Presentation/deck workflow | MUST MATCH safe share/version scope; adjacent provenance |
| chatgpt-dual-pipeline | Internship-notes publication product | SHOULD SIMPLIFY identity/source-of-truth first |
| internship-notes-sites-mirror | Deployment/content mirror | N/A as standalone product; publish contract first |
| taichung-police-intel | Police/public-sector intelligence monitor | DIFFERENTIATOR via bounded source sets, evidence, delta workflows |
| soundbox-offline | Local-first/offline music library | MUST MATCH backup/portability; local-first is the strategic moat |
| skill-foundry | Agent-skill creation / packaging | ADJACENT portable workflow Skills + evaluation contracts |
| video-timeline-pipeline | Video intelligence / knowledge pipeline | DIFFERENTIATOR via reusable Research Packs / Skills on top of existing roadmap |
| ai-novel-workstation | Long-running AI writing workstation | ADJACENT editorial checkpoints/attribution; do not add agents just to add agents |
| clinical-scribe-worker | Clinical scribe / evaluation worker | DO NOT EXPAND before auth/cost/audit-integrity fixes |
| MaterialYouNewTab | Browser new-tab / productivity surface | SHOULD STAY LIGHT; only thin local briefing integrations if justified |
| cf-mcp-server | Cloudflare MCP server | MUST MATCH secure auth/scoped capabilities before new tools |
| tick-stock-panel | Taiwan stock monitoring/simulation | MUST MATCH truthful coverage; ADJACENT visual conditional rules |
| herdr-skills | Multi-agent workflow skills | ADJACENT independent verifier/proof receipts; avoid redundant orchestration |

## External Signals

### 1. Developer-agent products are moving from “agent count” to grounded context + review

**CONFIRMED — Linear, 2026-06-11**

Linear Coding Sessions let an agent triage, plan, review and ship with Claude Code/Codex while grounding the session in issue details, history, customer requests, discussions and related workspace context.

Source: https://linear.app/changelog/2026-06-11-coding-sessions

**CONFIRMED — Linear Code Intelligence, current 2026 docs**

Connected repositories become planning context: implementation location, architectural patterns, history, constraints and dependencies can be inspected from the product-management surface.

Source: https://linear.app/docs/code-intelligence

**CONFIRMED — OpenAI Codex app, 2026-02-02; Windows update 2026-03-04**

Codex’s desktop product emphasizes parallel agents, scheduled Automations and a review queue. OpenAI explicitly names issue triage, CI summaries, release briefs and bug checks as recurring automation examples.

Source: https://openai.com/index/introducing-the-codex-app/

**Transferable principle:** the differentiator is not “more agents.” It is **full work context + explicit queue/review state + durable evidence + human-resumable handoff**.

### 2. Creative tools are turning external work context directly into finished visual artifacts

**CONFIRMED — Gamma, 2026-08-28**

Gamma added native iOS/Android apps, Slack creation/search/export/comments, expanded API/connectors, engagement/comment APIs, and one-click Google Sheets chart refresh.

Source: https://ideas.gamma.app/changelog/whats-new-in-gamma-august-28

**CONFIRMED — Canva AI 2.0, 2026**

Canva connectors include Slack, Gmail, Drive, Calendar, Notion, Zoom, HubSpot, Microsoft, Atlassian and Linear. Canva gives examples such as Zoom transcript → meeting summary, customer email → sales pitch, Slack activity → newsletter, plus background scheduling.

Source: https://www.canva.com/newsroom/news/canva-create-2026-ai/

**Transferable principle:** “import” is becoming insufficient; users expect **context-aware workflow ingestion with an update path**, not copy/paste.

### 3. Intelligence/knowledge tools are productizing bounded source sets and reusable AI workflows

**CONFIRMED — Feedly, 2026-04-01**

Feedly Ask AI/Analyze can attach multiple AI Feeds, Boards and team feeds as sources and use embedded RAG.

Source: https://feedly.com/changelog/add-specific-context-to-your-market-intelligence-queries

**CONFIRMED — Readwise, 2026-03-20**

Readwise launched MCP, CLI and predefined AI Skills. MCP/CLI expose a user’s saved corpus to agents; Skills package repeated workflows such as inbox triage, feed catchup, contextual book review and quiz mode.

Sources:
- https://docs.readwise.io/changelog
- https://readwise.io/mcp
- https://readwise.io/cli

**Transferable principle:** package **source set + task instructions + output/evidence contract** as a reusable unit. This maps especially well to `video-timeline-pipeline`, `taichung-police-intel`, `note-filler` and `skill-foundry`.

### 4. Adaptive learning products are centering the persistent learner model

**CONFIRMED PRODUCT CLAIM — AskSia AI, launch 2026-05-05**

AskSia markets a private knowledge graph built from the learner’s own materials, with past mistakes, likely exam blind spots and explicit “what to focus on next.”

Source: https://www.producthunt.com/products/asksia-ai

**CONFIRMED PRODUCT CLAIM — Paradigm, launch 2026-07-16**

Paradigm’s core proposition is a personalized learning path that evolves with progress.

Source: https://www.producthunt.com/products/paradigm-3

These pages establish product direction, **not learning-effect efficacy**.

**Transferable principle:** exam products should evolve from “question picker” toward an **explainable learner-state model + next-best-study action**, while keeping deterministic fallback and avoiding fake predictive precision.

## New Releases / Recent Changes Worth Tracking

| Date | Product | Change | Reese-max relevance |
|---|---|---|---|
| 2026-08-28 | Gamma | Mobile apps, Slack workflow, richer API/connectors, Sheets-linked charts | ppt-studio: workflow ingestion + updateable data, not just generation |
| 2026-07-16 | Paradigm | Adaptive learning-path launch | cyber-prep / police-exam-practice: learner model / next action |
| 2026-06-11 | Linear | Coding Sessions with workspace context | autodev-ng/herdr: review/context UX, not redundant agent count |
| 2026-04-01 | Feedly | Multi-source Ask AI + embedded RAG | video/intel: bounded source sets / research packs |
| 2026-03-20 | Readwise | MCP + CLI + reusable AI Skills | skill-foundry/video/notes: portable workflow contracts |
| 2026-03-04 | Codex | Windows app availability after Feb launch | autodev-ng: review queue/automation UX is becoming expected |

## Community Pain Points

These are anecdotal signals only.

### AI presentations: speed is useful, but generic content and fragile editing remain pain points

- **COMMUNITY_SIGNAL — 2026-03-18:** a Reddit user reported that even after providing documents/links, several AI presentation tools still produced generic/surface-level content and wrong emphasis. https://www.reddit.com/r/aiToolForBusiness/comments/1rx1k04/has_anyone_actually_found_any_ai_presentation/
- **COMMUNITY_SIGNAL — 2026-08-04:** users discussed wanting editable output and workflows starting from PDFs, blogs, YouTube and meeting notes rather than locked/generic AI canvases. https://www.reddit.com/r/AIToolsAndTips/comments/1vf3mi7/finally_found_an_ai_presentation_maker_that/
- **COMMUNITY_SIGNAL — 2026-08-27:** a small-team anecdote comparing Canva/Gamma highlighted Gamma first-draft speed but complained about PPTX export fidelity, precise placement and repeated layouts. https://www.reddit.com/r/SaaS/comments/1vzyp14/i_ran_canva_and_gamma_side_by_side_for_a_quarter/

**Product implication:** PPT Studio already has rich manual editing. Chasing generation speed/layout count is less differentiated than making **imported claims auditable, exports stable, and AI edits reversible**.

### Coding agents: verification is becoming the bottleneck

- **COMMUNITY_SIGNAL — 2026-08-26:** a DevSecOps/AI-coding discussion described passing unit tests while integration state transitions still failed, leading the team to add a sandbox failure-scenario gate before shipping. https://www.reddit.com/r/devsecops/comments/1vzbpln/coding_agents_shifted_the_bottleneck_to/
- **COMMUNITY_SIGNAL — 2026-04-11:** a ClaudeAI user reported multiple AI “test” agents agreeing on fictional selectors/structures, illustrating self-verification risk. https://www.reddit.com/r/ClaudeAI/comments/1si5xt2/do_not_trust_ai_to_test_ai/
- **COMMUNITY_SIGNAL — 2026-08-22:** a Codex workflow post emphasized contract freeze, persistent workstream ownership, integration, and evidence-based acceptance. https://www.reddit.com/r/codex/comments/1vv78du/i_packaged_my_contractfirst_codex_workflow_into/

**Product implication:** autodev-ng already has strong receipts, review gates, ownership and merge semantics. External evidence supports investing in **independent verification UX and failure-scenario contracts**, not simply increasing parallel worker count.

## Adjacent Ideas

### A. Research Packs / Skills

Reusable object containing:
- bounded source set;
- query / task template;
- evidence requirements;
- output format;
- cost/network policy;
- refresh/delta policy.

Best fits: `video-timeline-pipeline`, `taichung-police-intel`, `note-filler`, `skill-foundry`.

This is inspired by Readwise Skills and Feedly source-attached Ask/Analyze, but should reuse each repository’s existing source/provenance model rather than creating a new generic platform.

### B. Context connectors with explicit capability contracts

Connectors should declare:
- read/write scope;
- data class;
- freshness;
- auth mode;
- network/cost side effects;
- supported operations;
- export/provenance behavior.

Best fits: `ppt-studio`, `video-timeline-pipeline`, `cf-ai-router`, `autodev-ng`.

Do not copy Canva’s breadth. Build only connectors that remove a currently observed copy/paste step.

### C. AI edit attribution + checkpointed evidence

Linear and Codex reinforce a broader UX expectation: agent work should be distinguishable from human work and resumable/reviewable. Reuse this idea in content products:
- ppt-studio: source-backed vs model-only fields;
- note-filler: original/source-backed/AI-researched states;
- ai-novel-workstation: editorial checkpoints and agent-attributed revisions.

## Opportunity Map

### High-value / actionable now

| Opportunity | Classification | Main repo(s) | Score* | Action |
|---|---|---|---:|---|
| Slide/claim-level source provenance for imported decks | DIFFERENTIATOR | ppt-studio | 92/100 | NEW Issue #3 created |
| Local mastery profile + explainable adaptive “today task” | DIFFERENTIATOR | cyber-prep-coach | 90/100 | NEW Issue #4 created |
| Reusable Research Packs / Skills | ADJACENT IDEA | video-timeline-pipeline, taichung-police-intel, note-filler, skill-foundry | 86/100 | Map to existing roadmaps first; no duplicate Issue this run |
| Independent failure-scenario proof gate / review queue UX | SHOULD BE BETTER | autodev-ng, herdr-skills | 82/100 | Core capability largely exists; keep as UX/eval direction, no new Issue |
| Explicit connector capability contract | SHOULD BE BETTER | cf-ai-router, ppt-studio, video-timeline-pipeline | 80/100 | Research before implementation; avoid connector sprawl |

\* Score combines User Pain, Strategic Fit, Novelty, Evidence Strength, Reuse Potential and Implementation Effort, with Security/Privacy/Cost risk as a penalty. It is a prioritization heuristic, not a market forecast.

### Medium / later

- **92-duty-scheduler — explainable “why this assignment conflicts” + what-if alternatives**: ADJACENT IDEA. Strong workflow value, but auth/integrity issues remain higher priority.
- **tick-stock-panel — visual multi-condition signal recipes**: ADJACENT IDEA from conditional-alert products, but truthful provider coverage and data freshness remain MUST MATCH first.
- **voice-actress / police-exam-practice — learner-state reuse**: SHOULD BE BETTER; consider reusing cyber-prep mastery primitives once proven instead of reimplementing independently.
- **MaterialYouNewTab — thin local briefing surface**: ADJACENT IDEA only; keep performance/lightweight identity dominant.
- **soundbox-offline — portable local library bundle**: MUST MATCH via existing backup finding; do not add cloud account sync unless demanded.

### DO NOT COPY / defer

- Full multi-agent “teams” in every repository. `autodev-ng` already owns orchestration; duplicating it increases coordination and verification risk.
- Gamma/Canva-style broad real-time collaboration and engagement analytics in `ppt-studio` before there is evidence the product should become a multi-user SaaS.
- Agentic clinical actions, autonomous coding/billing suggestions, or EHR-style workflow expansion in `clinical-scribe-worker` / `project-doctor-web` before current safety/auth/runtime gates are resolved.
- Live brokerage execution in `tick-stock-panel`; current product boundary explicitly separates simulation from real trading.
- Automatic cloud synchronization in local-first products merely because competitors are cloud-first.

## Top 10 Cross-Portfolio Ideas

1. **Evidence-first generated artifacts** — provenance, content hashes, support kinds, stale detection for decks/notes/intel.
2. **Persistent learner state** — one reusable local mastery primitive for cyber-prep, police-exam-practice and possibly voice-actress.
3. **Research Packs / Skills** — source set + workflow + output/evidence contract for video/intelligence/note pipelines.
4. **Connector capability metadata** — scope/freshness/cost/auth/read-write contract before adding integrations.
5. **Independent verification queue** — a distinct verifier/failure-scenario lane rather than builder self-certification.
6. **Agent attribution + checkpoints** — visibly distinguish AI edits, human edits and source-backed facts; make rollback cheap.
7. **External-signal → issue triage** — group community/competitive evidence by stable problem fingerprint instead of creating feature spam.
8. **Explainable rule composition** — scheduling/finance/notification workflows should expose deterministic why/what-if logic.
9. **Local-first portability contract** — backup/rebuild/migration should be a shared product primitive, not an afterthought.
10. **Thin mobile companion, not full mobile duplication** — only for high-frequency status/review actions; Gamma’s mobile expansion is a signal, not a mandate.

## Ideas Rejected

| Idea | Rejection reason |
|---|---|
| Copy Gamma engagement analytics into ppt-studio now | Weak fit for current local workstation; collaboration scope not established |
| Add every Canva connector | Feature bloat and broad auth/privacy surface; only integrate proven copy/paste bottlenecks |
| Add more agents to autodev-ng | External signals say verification/context are bottlenecks; repo already has 10 adapters and concurrency |
| Add generic AI tutor/chat to cyber-prep | Dilutes iPAS-specific moat; mastery/next-action can be deterministic and local |
| Add cloud account sync to soundbox/cyber-prep by default | Conflicts with local-first trust boundary unless user need is evidenced |
| Expand clinical tools into automated actions | Current safety/auth findings make expansion premature |
| Turn exam archive repos into full learning apps | Maintain corpus/source-of-truth role; adaptive behavior belongs in practice products |

## Issue Mapping

### New Issues Created

- `Reese-max/cyber-prep-coach#4` — **[Competitive Inspiration][FEATURE] 建立本機 mastery profile 與自適應今日任務**
  - https://github.com/Reese-max/cyber-prep-coach/issues/4
  - Duplicate checks: `mastery` code search = none; adaptive/mastery Issues = none; matching PR search = none.

- `Reese-max/ppt-studio#3` — **[Competitive Inspiration][DIFFERENTIATOR] 讓外部內容生成的投影片保留逐頁來源與 claim provenance**
  - https://github.com/Reese-max/ppt-studio/issues/3
  - Duplicate checks: `citation` code search = none; existing Issues only unrelated deployment/auth finding; matching PR search = none.

### Existing Issues / Roadmaps That Already Cover External Patterns

- `video-timeline-pipeline#5/#7`: hybrid retrieval, citations, Ask, delta/entity/action roadmap already cover much of the Feedly/Readwise direction. Do not create a duplicate “RAG” Issue; consider Research Packs as a packaging layer later.
- `tick-stock-panel#2`: provider-aware market coverage already captures a key “capability contract” principle.
- `autodev-ng`: current README already documents atomic claim, cost reservations, reviewers, release receipts, worktree isolation and bounded concurrency; external agent-review signals validate the direction rather than justify a redundant feature Issue.

## Sources

### Official / first-party product sources
- Gamma changelog — 2026-08-28: https://ideas.gamma.app/changelog/whats-new-in-gamma-august-28
- Canva AI 2.0 — 2026: https://www.canva.com/newsroom/news/canva-create-2026-ai/
- Linear Coding Sessions — 2026-06-11: https://linear.app/changelog/2026-06-11-coding-sessions
- Linear Code Intelligence docs: https://linear.app/docs/code-intelligence
- OpenAI Codex app — 2026-02-02, Windows update 2026-03-04: https://openai.com/index/introducing-the-codex-app/
- Feedly multi-source Ask AI / RAG — 2026-04-01: https://feedly.com/changelog/add-specific-context-to-your-market-intelligence-queries
- Readwise changelog — 2026-03-20: https://docs.readwise.io/changelog
- Readwise MCP: https://readwise.io/mcp
- Readwise CLI: https://readwise.io/cli

### Product-launch signals (claims, not independent efficacy studies)
- AskSia AI — 2026-05-05: https://www.producthunt.com/products/asksia-ai
- Paradigm — 2026-07-16: https://www.producthunt.com/products/paradigm-3

### Community signals (anecdotal)
- AI presentation generic/shallow output — 2026-03-18: https://www.reddit.com/r/aiToolForBusiness/comments/1rx1k04/has_anyone_actually_found_any_ai_presentation/
- AI presentations from existing sources / editable output — 2026-08-04: https://www.reddit.com/r/AIToolsAndTips/comments/1vf3mi7/finally_found_an_ai_presentation_maker_that/
- Canva/Gamma workflow comparison — 2026-08-27: https://www.reddit.com/r/SaaS/comments/1vzyp14/i_ran_canva_and_gamma_side_by_side_for_a_quarter/
- Coding-agent verification bottleneck — 2026-08-26: https://www.reddit.com/r/devsecops/comments/1vzbpln/coding_agents_shifted_the_bottleneck_to/
- AI self-testing failure anecdote — 2026-04-11: https://www.reddit.com/r/ClaudeAI/comments/1si5xt2/do_not_trust_ai_to_test_ai/
- Contract-first Codex workflow — 2026-08-22: https://www.reddit.com/r/codex/comments/1vv78du/i_packaged_my_contractfirst_codex_workflow_into/

## What Changed Since Last Radar

This is the first radar report found at this canonical path, so it establishes the baseline rather than claiming a delta against a prior radar.

New baseline conclusions:
- Two high-value product opportunities were promoted to GitHub Issues after repo/code/Issue/PR duplicate checks.
- “More agents” is explicitly downgraded as a cross-portfolio strategy; context, proof, review and capability boundaries rank higher.
- Creative-product research shifts `ppt-studio` differentiation toward source-grounded professional output rather than template count.
- Learning-product research shifts `cyber-prep-coach` differentiation toward explainable local learner state rather than generic AI tutoring.
- Feedly/Readwise patterns introduce a reusable `Research Pack / Skill` concept for future video/intelligence/note workflows, but existing roadmaps should be extended rather than duplicated.
