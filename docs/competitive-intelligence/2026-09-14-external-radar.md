# External Competitor / New Product / Workflow Inspiration Radar — 2026-09-14

## Scope and guardrails

- Portfolio inventory re-read from the connected GitHub account: **37 Reese-max-owned, unarchived repositories**. `adng-memory` and `internship-notes-sites-mirror` remain support artifacts, so **35 product-like repositories** are scored in the Opportunity Map.
- Primary evidence for this round is the **public web outside GitHub**. GitHub is used to understand current product intent, recent changes, existing Issues/PRs, duplicate fingerprints, locks, and implementation constraints.
- External vendor claims are treated as product/strategy evidence, not independent effect proof. Community discussion is marked `COMMUNITY_SIGNAL` only.
- No product source code, implementation branch, merge, deployment, secret, permission, or repository setting was changed.
- One duplicate-free high-value Research Issue was created after open/closed Issue, all-state PR, and `github-issue-lock:v1` checks: `Reese-max/prompt-autoresearch#5`.

---

## Executive summary

The strongest new opportunity is **not another prompt-generation feature**. It is a simplification control for `prompt-autoresearch`: replace a purely relative anti-bloat rule with a **quality/safety + complexity/cost Pareto decision** and a dedicated compaction challenger.

Current repository truth already recognizes prompt bloat: `program.md` allows a promoted prompt to grow by no more than 10% in tokens, and the UI has F11 / token-compression concepts. The gap is that a relative `<=10%` rule can still ratchet upward over many successful generations, while “same quality, fewer instructions / lower cost” is not yet a first-class promotion outcome.

The external signal is unusually aligned:

1. Prompt-management products increasingly put **quality, usage, cost and latency on the same prompt-version record**.
2. Current prompt editing products expose **length changes as inspectable candidate diffs**, not silent canonical rewrites.
3. New prompt-optimization research explicitly targets **evolutionary prompt bloat** and uses deterministic selection / Pareto-style constraints rather than “keep adding rules until the score rises”.
4. Community anecdotes add a useful regression hypothesis: an eval win can still be a product loss if output/tool-call cost rises sharply. This is anecdotal, not a market statistic.

**New high-value Issue:** `prompt-autoresearch #5 — [Competitive Inspiration][Research][RESEARCH_REQUIRED][SIMPLIFICATION] Pareto Complexity Budget + Compaction Gate`  
**Opportunity Score: 92/100.**

A second portfolio-level signal is becoming clearer but is already mapped to existing Reese-max work: generic agent harness/runtime functionality is increasingly managed infrastructure. OpenAI’s 2026-09-10 Agents API now manages durable sessions, context compaction, recovery, hosted/partner sandboxes, tool search, programmatic tool calls and subagents. That reinforces the existing Reese-max direction: **do not compete by rebuilding the generic agent loop; compete on domain truth, bounded authority, evidence, deterministic promotion and verified outcomes.** No duplicate Issue was opened because `autodev-ng #21/#12/#17/#28`, `academic-mcp #9`, and related contracts already cover those boundaries.

---

# Product → Market map

| Repository | Market / product category | Current strategic constraint / recent truth |
|---|---|---|
| exam-archive | exam source archive / study data | provenance and source integrity matter more than more modes |
| police-exam-practice | police exam practice / learning | prioritize learning loop and source traceability |
| police-exam-archive | police exam archive / provenance | canonical source and dedupe are core |
| 92-duty-scheduler | duty roster / scheduling / LINE self-service | lifecycle correctness and self-service requests already active |
| UkePack | MusicXML → child-friendly ukulele practice pack | privacy/auth/CI and legacy migration are ahead of broad new features |
| ppt-studio | AI presentation editor/export | structured slide-state + render verification already researched |
| voice-actress | grounded legal/evidence QA | counterevidence and source provenance remain differentiators |
| taiwan-intel-dashboard | multi-source intelligence dashboard | canonical evidence → generated task view is preferable to mode sprawl |
| autodev-ng | AI SDLC / agent orchestration / governance | #13–#16 reliability gates remain higher priority than more authority |
| flux-image-gen | AI image generation/editing | provenance/edit intent and cost controls matter more than raw model count |
| claude-mem | persistent coding-agent memory | temporal truth opportunity remains high; repository Issues are disabled |
| lobsterpulse | monitoring / decision attention queue | truthful provider denominator and integration correctness first |
| prompt-autoresearch | prompt optimization / autonomous research | **new #5: cumulative complexity / cost must become selection evidence** |
| neciken-summer-poem | creative writing / contest workflow | preserve author intent, submission constraints and provenance |
| note-filler | structured notes/forms | candidate fill + user-owned values + exception review |
| lplrs-judicial-sync | judicial/public-data sync | reconciliation, source conflicts and evidence receipts |
| cyber-prep-coach | cybersecurity exam coach | market is moving toward hands-on AI-security labs, not passive Q&A only |
| cf-ai-router | model routing / AI cost control | cache economics / usage receipts without expanding paid authority |
| avatar-vfo | role/personality simulation | scoped state and controllable persona evolution |
| project-doctor-web | project diagnostics / project health | exception-first diagnosis + evidence-linked remediation |
| minideck | compact slide/deck creation | keep small surface; structured/editable artifacts over mode growth |
| chatgpt-dual-pipeline | multi-model / dual-pipeline workflow | disagreement and evidence merge are more valuable than another model lane |
| taichung-police-intel | public-sector intelligence monitor | source truth, conflict handling and answer-ready evidence packets |
| soundbox-offline | offline/local media player | local-first, deterministic library state, low operational complexity |
| skill-foundry | skill creation/evaluation/distribution | demo→candidate, package security and runtime compatibility already scoped |
| video-timeline-pipeline | evidence-to-video / NLE automation | target-native apply/read-back after deterministic evidence cut |
| ai-novel-workstation | long-form writing workstation | agent-facing typed story state, not raw filesystem authority |
| clinical-scribe-worker | clinical documentation | P0 auth plus section repair/version receipt before autonomy expansion |
| MaterialYouNewTab | browser new-tab / personalization | privacy/local state and low-friction personalization |
| cf-mcp-server | MCP/SaaS tool server | semantic tool-contract drift and release truth already scoped |
| tick-stock-panel | stock/strategy analysis | P1 generated-Python isolation; no live brokerage scope today |
| herdr-skills | agent skills / policy improvement | correction → candidate → scoped promotion, not instant learning |
| ninax-line-hermes | LINE AI gateway / ordered messaging | delivery/edit/redelivery correctness before more agent behavior |
| ai-flight-radar | flight intelligence / fare tracking | baseline-relative price history + alert provenance beats opaque “deal” labels |
| academic-mcp | scholarly retrieval / research-agent gateway | 81-tool progressive exposure + source identity / entitlement truth |

Support-only coordination artifacts: `adng-memory`, `internship-notes-sites-mirror`.

---

# External Signals

## A. Direct competitor / product capability signals

### A1 — Prompt optimization is becoming a multi-objective product surface
**Status:** `CONFIRMED`  
**Product:** Amazon Bedrock Advanced Prompt Optimization  
**Date:** 2026-05-14 (older than the preferred 90-day window, retained because it is a representative mature product pattern)  
**Sources:**
- https://aws.amazon.com/about-aws/whats-new/2026/05/amazon-bedrock-advanced-prompt-optimization-migration-tool/
- https://aws.amazon.com/blogs/aws/amazon-bedrock-introduces-new-advanced-prompt-optimization-migration-tool/

**JTBD:** optimize or migrate prompts without separately hand-building a benchmark spreadsheet for every model candidate.

**Why fewer steps / more reliable:** original and optimized prompt can be evaluated under explicit examples/ground truth/criteria; the product surfaces evaluation score alongside cost estimate and latency rather than treating quality as the only dimension.

**Onboarding / distribution:** available via Bedrock APIs and console; fits an existing model-operations surface instead of asking teams to adopt an isolated prompt app.

**New pattern:** prompt promotion as a deployable artifact with quality + cost + latency evidence.

**Business-model signal:** optimization is bundled inside the model platform; a standalone Reese-max optimizer should differentiate on reproducible research evidence, domain-specific constraints and provider portability rather than competing on “rewrite my prompt”.

**Limit / do not copy:** Bedrock-specific cost estimates do not equal Reese-max real billing; do not bind the project to one provider or promote the cheapest prompt when quality/safety regresses.

### A2 — Prompt version observability now includes operational economics
**Status:** `CONFIRMED`  
**Product:** PromptLayer  
**Checked:** 2026-09-14  
**Source:** https://www.promptlayer.com/

PromptLayer currently links exact prompt versions to quality, token usage, cost and latency; it supports version history, diffs, release labels, rollback and regression evaluation.

**Portable principle:** a “better prompt” is not just a higher evaluator score. The version receipt should say what changed and what it cost per successful task.

**Fit:** `prompt-autoresearch`, `cf-ai-router`, `herdr-skills`.

**Do not copy:** do not build a hosted prompt CMS merely because competitors have one; Reese-max already has file/version/evidence-oriented workflows.

### A3 — Flight products continue to win by eliminating repeated manual checking
**Status:** `LIKELY / CURRENT PRODUCT SURFACE`  
**Products:** Air Savvy / TripManta  
**Checked:** 2026-09-14  
**Sources:**
- https://air-savvy.com/
- https://www.tripmanta.com/

Both products frame the JTBD as “stop re-checking the same route”. Air Savvy records a real start baseline and builds price history; TripManta also supports after-booking monitoring for possible credits.

**Fit:** `ai-flight-radar` should keep focusing on a truthful baseline, change history, threshold semantics and actionability. An opaque AI “cheap/expensive” badge is weaker than “what changed from the fare I actually saw, when, and why did I alert?”

**Do not copy:** no automatic purchase/credit workflow until source reliability, airline rules and explicit effect authorization are proven.

---

# New Releases / Major Strategy Signals

## OpenAI Agents API — managed harnesses are becoming infrastructure
**Status:** `CONFIRMED`  
**Date:** 2026-09-10  
**Source:** https://openai.com/index/introducing-the-agents-api/

Public beta now provides a managed Codex harness with durable sessions, context compaction/recovery, OpenAI-hosted or partner/user environments, tool search, programmatic tool calling and multi-agent/subagent orchestration.

**JTBD:** teams should not have to rebuild session durability, compaction and generic tool orchestration before working on their actual domain agent.

**Product-design signal for Reese-max:** generic harness plumbing is getting commoditized. The portfolio should invest in **domain contracts, canonical state, authority boundaries, verification receipts, reproducible evals and domain-specific UX**.

**Issue mapping:** already covered by `autodev-ng #21` (environment/handoff), #12 (effects), #17 (principal/credentials), #28 (browser lease), and `academic-mcp #9` (progressive tool exposure). **No duplicate Issue.**

**Evidence caution:** customer quotes and vendor-reported benchmark/latency improvements on the launch page are not used as independent proof.

## OpenAI Data agent — canonical data → conversational investigation → shareable interactive view
**Status:** `CONFIRMED`  
**Date:** 2026-09-10  
**Source:** https://openai.com/index/put-data-to-work/

The product connects trusted company data, investigates questions/changes and generates shareable interactive dashboards without requiring the user to write queries.

**Adjacent fit:** `taiwan-intel-dashboard`, `taichung-police-intel`, `project-doctor-web`, `exam-archive`.

**Portable principle:** do not create another copied AI-owned database or another permanent “mode”; generate a task-specific view from canonical data and route accepted mutations back to the same source of truth.

**Do not copy:** for police/legal/public intelligence, conversational convenience cannot weaken citation, freshness, source conflict or access-control requirements.

---

# Adjacent Ideas

## B1 — Regulated AI: “agent prepares; human oversees; accepted rule runs deterministically”
**Status:** `CONFIRMED`  
**Product:** Fund Recs Agentic Platform / AI Ops  
**Date:** 2026-09-10  
**Source:** https://www.fundrecs.com/blog/fund-recs-launches-agentic-platform-and-ai-ops-bringing-ai-agents-into-fund-oversight-controls

Fund Recs launched specialized agents for support, document extraction, template building, exception resolution and control creation. Its official design says agents inherit user permissions and actions are audited; AI-drafted rules can be human-approved and then execute deterministically. Its current product library also exposes confidence-scored document extraction for review.

**JTBD:** reduce expert time spent on preparation, classification and exception triage without surrendering control over regulated outcomes.

**Why it saves work:** humans review the uncertain/important outcome rather than manually transform every document or build every rule from scratch.

**Distribution:** capabilities are embedded into the existing oversight platform and also packaged as AI Ops managed service; this is a strong signal that AI can be sold as “review-ready preparation capacity”, not only end-user chatbot seats.

**Portable principle:** `AI Candidate → provenance/confidence → human review → deterministic promoted rule/action → audit receipt`.

**Fit:** `note-filler`, `clinical-scribe-worker`, `lplrs-judicial-sync`, `project-doctor-web`, `taichung-police-intel`, `92-duty-scheduler`.

**Do not copy:** vendor-reported resolution rates/time savings are marketing/customer evidence, not general effect proof; confidence score alone must never auto-promote clinical/legal/high-impact output.

## B2 — High-impact domains are exposing AI interfaces but preserving an explicit execution boundary
**Status:** `CONFIRMED`  
**Product:** Scalable Capital Agentic Investing  
**Date:** 2026-08-25  
**Sources:**
- https://de.scalable.capital/en/newsroom/scalable-agentic-investing
- https://help.scalable.capital/en/agentic-investing-aac939f8/how-are-orders-approved-and-protected-when-using-scalabl-d16595b5

Scalable exposes portfolio/search/order functionality through MCP and CLI, but a prepared supported order still requires the user to review order details, estimated costs/disclosures/warnings and explicitly confirm in a separate step; standard account/order checks remain active.

**Fit / lesson for `tick-stock-panel`:** this is evidence that natural-language investment interfaces are moving toward real execution, but it actually strengthens Reese-max’s current boundary: `Analysis ≠ Candidate Order ≠ Human Approval ≠ Brokerage Authority ≠ Executed Trade Receipt`.

**DO NOT COPY now:** `tick-stock-panel` explicitly has no live brokerage order scope and already carries higher-priority generated-Python isolation/release reliability work. No live-trading Issue was created.

---

# Emerging Tools / Research Possibilities

## C1 — ESPO: error-structured optimization targets prompt bloat directly
**Status:** `CONFIRMED_RESEARCH`  
**Date:** 2026-09-03  
**Source:** https://arxiv.org/abs/2609.04197

ESPO identifies a failure mode in evolutionary prompt optimization: iterative fixes can accumulate rules/caveats and grow prompts without commensurate accuracy improvement. It separates Diagnose, diverse Propose strategies and stability-oriented Select.

**Transferable principle:** do not assume every error requires a new sentence. Cluster root failure patterns, allow `ADD / REWRITE / DELETE / MERGE / NO_CHANGE`, and treat compaction as a candidate that must pass the same gates.

**Evidence boundary:** paper benchmark improvements and shortening percentages are not Reese-max KPIs and are not used as effect forecasts.

## C2 — RLMOpt: model-driven search policy with deterministic Pareto/regression harness
**Status:** `CONFIRMED_RESEARCH`  
**Date:** 2026-08-11  
**Source:** https://arxiv.org/abs/2608.10471

RLMOpt allows the language model to inspect failures, generate candidates and allocate search budget, while a deterministic harness handles objective scoring, Pareto selection and regression constraints.

**Transferable principle:** let the Agent propose how to simplify or explore; do not let the same Agent self-certify the winning prompt.

**Fit:** primarily `prompt-autoresearch #5`; conceptually reusable by `skill-foundry` and `herdr-skills` for “candidate improvement vs complexity/cost” decisions.

---

# Community Pain Points

## Prompt quality can improve while operating cost gets worse
**Status:** `COMMUNITY_SIGNAL`  
**Date:** 2026-07-03  
**Source:** https://www.reddit.com/r/PromptEngineering/comments/1umk4j2/one_prompt_change_almost_doubled_our_costs/

A practitioner described a prompt change that looked better in evals while output length/tool chatter increased costs; commenters argued for tracking token/cost per successful task alongside quality.

**Use:** regression hypothesis only. It motivates a `PromptComplexityReceipt` and trade-off fixture.

**Do not infer:** no market-wide cost multiplier or incidence rate is inferred from one Reddit thread.

## Cybersecurity learners increasingly expect hands-on AI-system practice
**Status:** `CONFIRMED_PRODUCT_SURFACE`  
**Checked:** 2026-09-14  
**Source:** https://tryhackme.com/aisecurity

TryHackMe’s current AI Security path emphasizes live model attacks/defense, hands-on scenarios and a certification path rather than lecture-only content.

**Fit:** `cyber-prep-coach` should consider “evidence of skill” artifacts—bounded labs, answer/rationale, remediation and replay—rather than simply adding a generic AI tutor chat. This is Research List only because the current repo gap was not re-proven deeply enough for a new Issue this round.

---

# Opportunity Map

Legend: `MUST MATCH` = market baseline; `SHOULD BE BETTER` = Reese-max should exceed baseline; `DIFFERENTIATOR` = portfolio-specific advantage; `ADJACENT IDEA` = transferable idea worth research; `DO NOT COPY` = explicit boundary/simplification.

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| exam-archive | searchable source index | exact source/year/page provenance | exam-source truth graph | generated task views from canonical archive | AI summary that hides source |
| police-exam-practice | resume/practice/error review | evidence-linked explanations | source-aware exam loop | hands-on proof-of-skill receipts | proliferating practice modes |
| police-exam-archive | complete archive navigation | dedupe/version identity | canonical exam identity | conflict/duplicate receipt | mirrored copies without lineage |
| 92-duty-scheduler | request/confirm/status lifecycle | ordered, idempotent, auditable changes | LINE self-service + canonical roster | AI prepares request, human/role rules promote | autonomous roster mutation |
| UkePack | usable generated practice pack | teacher-edit preservation / reproducibility | MusicXML-grounded kid practice | exception-first teacher review | broad AI features before auth/CI |
| ppt-studio | native editable export | object-stable patch + render/read-back | structured state + visual verification | compaction/simplification of slide objects | flatten-to-image “editability” |
| voice-actress | cited grounded answers | counterevidence/conflict states | evidence-first legal QA | support+challenge lanes | answer-confidence without evidence |
| taiwan-intel-dashboard | multi-source search/dashboard | provenance/freshness/conflict truth | public-sector answer-ready evidence | Data-agent generated task views | second AI-owned data store |
| autodev-ng | durable agent orchestration | identity/effect/env/browser separation | verified authority receipts | managed harness as pluggable substrate | rebuilding generic cloud agent runtime |
| flux-image-gen | prompt/edit generation | edit provenance + cost/model receipt | reproducible image mutation intent | candidate patch / before-after receipt | model-count race |
| claude-mem | persistent recall/search | temporal truth + invalidation state | recall receipt / provenance | operational cost of injected memory | “remember more = better” |
| lobsterpulse | monitoring + alerting | truthful denominator / dedupe / attention | decision-only queue | exception-first triage | noisy all-signal feed |
| prompt-autoresearch | version/eval/promotion | **quality+safety+complexity Pareto evidence** | autonomous research with auditable gates | **compaction challenger / delete-merge candidates** | iterative rule append as default |
| neciken-summer-poem | drafting/versioning | contest-rule and authorship provenance | human creative voice preservation | candidate rewrite diff | autonomous final submission |
| note-filler | structured extraction/fill | user-owned field preservation | provenance + review-ready candidate | confidence/exception queue | high-confidence silent overwrite |
| lplrs-judicial-sync | data ingestion/sync | source conflict + deterministic reconciliation | judicial provenance receipt | exception clustering | silent “latest wins” overwrite |
| cyber-prep-coach | curriculum/practice | hands-on attack/defense evidence loop | exam + practical remediation map | bounded live/simulated labs | chat-only tutor as product |
| cf-ai-router | routing/cost visibility | truthful usage/cache economics | fail-closed paid routing | complexity/cost receipt reuse | cheapest-model-only routing |
| avatar-vfo | persistent persona/state | scoped changes + rollback | versioned persona contract | correction→candidate promotion | unbounded self-modifying persona |
| project-doctor-web | diagnostics/recommendations | root-cause evidence + prioritized exception queue | repo-health receipt | Fund Recs-style specialist agents | generic “AI says fix X” list |
| minideck | fast small deck generation | native editability with minimal surface | deliberately compact workflow | shared slide-state contract with ppt-studio | feature parity race with full suites |
| chatgpt-dual-pipeline | multi-model execution | disagreement/evidence reconciliation | explicit cross-model adjudication | Pareto cost/quality selection | adding models without decision logic |
| taichung-police-intel | monitor/summarize official sources | source/date/conflict/read-back | operational answer packet | generated task dashboard from canonical evidence | social signal as official fact |
| soundbox-offline | reliable local playback/library | deterministic offline state/import | zero-cloud privacy | local receipts/history | cloud/AI dependency for basic use |
| skill-foundry | build/eval/package skills | provenance/security/runtime compatibility | demo→candidate→validated promotion | Pareto complexity for skill instructions | record-and-replay = certified skill |
| video-timeline-pipeline | export to NLE | target capability probe + native read-back | evidence-to-edit receipt | managed tool targets instead of own editor | rebuilding a full NLE |
| ai-novel-workstation | story context/edit tools | canonical truth + stale-base gate | agent workspace contract | compaction of context without story-truth loss | raw filesystem authority |
| clinical-scribe-worker | structured clinical note workflows | auth + section-scoped repair/version receipt | human-approved canonical note | confidence → review queue | confidence-only auto-finalization |
| MaterialYouNewTab | personalization | local/privacy-aware state | lightweight Material You UX | typed preferences / import-export | agent/browser authority creep |
| cf-mcp-server | stable tool catalog | semantic drift diff / release read-back | tool-contract manifest | managed harness consumers | “same server = same authority” |
| tick-stock-panel | analysis/screener/backtest | deterministic StrategyDef + isolated custom code | inspectable strategy semantics | agent prepares order-like candidate only as future research | live MCP trading now |
| herdr-skills | improve reusable agent policies | correction evidence + scoped promotion | multi-engine review before canonicalization | complexity/Pareto receipt | single correction becomes global rule |
| ninax-line-hermes | LINE assistant/gateway | ordered redelivery/edit correctness | messaging receipt + deterministic delivery state | specialist-agent prep | more autonomy before transport correctness |
| ai-flight-radar | fare tracking/alerts | baseline/time/source semantics | actionable “what changed” receipt | post-booking monitoring research | opaque “AI deal” score |
| academic-mcp | research retrieval/tool gateway | source identity + progressive tool exposure | evidence bundle / entitlement truth | support+counterevidence search | semantic-similar provider substitution |

---

# Opportunity Scores — retained candidates

| Rank | Candidate | Primary products | Score | Disposition |
|---:|---|---|---:|---|
| 1 | Prompt Complexity Budget + Compaction Challenger | prompt-autoresearch; reusable in skill-foundry/herdr-skills | **92** | **Created `prompt-autoresearch #5`** |
| 2 | Exception-first AI preparation → deterministic approved rule | note-filler, clinical-scribe-worker, lplrs-judicial-sync, project-doctor-web | 89 | Research list; existing product-specific Issues cover much of the lifecycle |
| 3 | Treat managed agent harness as replaceable infrastructure | autodev-ng + all agent products | 89 | Architectural principle; existing #21/#12/#17/#28, no duplicate |
| 4 | Canonical data → generated interactive task view → same canonical data | taiwan-intel-dashboard, taichung-police-intel, project-doctor-web | 87 | Research list; avoid another permanent mode |
| 5 | Agentic investing boundary: analysis→candidate→explicit confirm→receipt | tick-stock-panel | 86 | **Do-not-copy-now / future boundary pattern** |
| 6 | Baseline-relative fare alert + post-booking monitoring | ai-flight-radar | 84 | Research list; current source/reliability gap should be re-read before Issue |
| 7 | Hands-on AI-security proof artifacts | cyber-prep-coach | 82 | Research list; repo-specific gap not sufficiently revalidated this round |
| 8 | Temporal Memory Truth + Recall Receipt | claude-mem | 93 prior | Carry forward; Issues disabled in repo |
| 9 | Tool Contract Manifest + Drift Gate | cf-mcp-server | 94 prior | Existing #15 |
| 10 | Progressive Tool Exposure + Selection Eval | academic-mcp | 94 prior | Existing #9 |

Scores are heuristic decision support, not a statistically calibrated metric.

---

# Top 10 Cross-Portfolio Ideas

1. **Quality is not one-dimensional.** Every autonomously promoted artifact should eventually be able to state quality/safety plus operational complexity/cost evidence where relevant.
2. **Create deletion lanes, not only feature lanes.** Prompt/skill/policy optimizers should generate `DELETE / MERGE / REWRITE / NO_CHANGE` candidates, not default to additive patches.
3. **Managed harnesses are replaceable infrastructure.** Keep domain truth, policy, evidence and receipts portable across OpenAI/other runtimes rather than coupling products to one harness.
4. **Agent prepares; deterministic system executes after promotion.** Strong pattern for regulated forms, clinical notes, judicial sync, roster requests and operational controls.
5. **Exception-first UX.** Route uncertain/conflicted/high-impact items to a compact queue instead of forcing users to inspect every successful automatic result.
6. **Generated views should not create shadow truth.** Dashboards, reports and mini-apps derive from canonical evidence and accepted changes return to the same truth store.
7. **High-impact natural-language actions need explicit effect boundaries.** Scalable’s order-confirmation pattern reinforces the existing Reese-max separation of proposal, approval, authority and outcome receipt.
8. **Cost per successful task beats prompt-size vanity metrics.** Short input can cause more retries/output/tool calls; complexity receipts must measure the whole evaluated workflow when possible.
9. **Progressive exposure and compaction are the same portfolio-level instinct:** only inject the capability/context needed now, but preserve the complete canonical capability/state outside the model-visible working set.
10. **Vendor performance claims are inputs to hypotheses, not acceptance criteria.** Convert claims into local fixtures/canaries before product promotion.

---

# Ideas Rejected / Deferred

## REJECT NOW — “Just replace the 10% prompt-growth rule with a hard shorter-is-better limit”
Reason: shorter prompts can lose essential legal/safety constraints or cause more retries/output. #5 requires Pareto/trade-off evidence, not shortest-wins.

## REJECT NOW — Live brokerage execution in `tick-stock-panel`
External signal: Scalable demonstrates that MCP/CLI-to-trade is product-real. Internal truth: Reese-max has no live brokerage scope today and has higher-priority custom/generated Python isolation/release issues. Copying the capability would expand financial effect authority before runtime isolation is trustworthy.

## REJECT — New “generic cloud agent platform” feature in `autodev-ng`
OpenAI Agents API and similar managed runtimes reduce the strategic value of rebuilding durable sessions/compaction/subagent plumbing. Reese-max should maintain portable domain/effect/environment contracts, not duplicate commodity infrastructure.

## REJECT — Auto-accept every high-confidence AI extraction
Fund Recs’ confidence/review pattern is useful for prioritization, but healthcare/legal/public-sector products need domain validation and human/policy promotion. Confidence is not truth or authority.

## DEFER — AI-security live lab product expansion in `cyber-prep-coach`
The market signal is strong, but this round did not re-establish the exact current repository gap and prerequisite reliability work deeply enough for a high-confidence Issue.

## DEFER — Post-booking flight-credit automation
Useful adjacent signal from current fare-monitoring products, but airline eligibility, source quality, account effect authority and duplicate-action semantics require a separate evidence pass.

---

# Issue / PR Mapping

## New

### `Reese-max/prompt-autoresearch #5`
**Title:** `[Competitive Inspiration][Research][RESEARCH_REQUIRED][SIMPLIFICATION] 以 Pareto Complexity Budget + Compaction Gate 取代可累積的提示詞膨脹`

**Why not duplicate:** before creation, open/closed Issues were searched for `bloat`, `Pareto`, `compaction`; all-state PR search was checked for prompt length/cost/compact terms. No same fingerprint existed. `github-issue-lock:v1` evidence found existing locks around #3/#4 work, not this fingerprint.

**Dependencies / coordination:**
- #4 remains the P1 required CI / best-version evidence blocker. #5 may research schema/synthetic/historical replay but may not change production promotion semantics until #4 is trustworthy.
- #3 owns stochastic/repeated evaluation and holdout stability. #5 consumes future stability evidence rather than inventing a second noise estimator.
- PR #2 is repository-contract/offline validation work and is not expanded.

## Existing — no duplicate created

- `autodev-ng #12/#17/#21/#28`: effect firewall, principal/credential, environment/handoff, browser capability.
- `academic-mcp #9`: progressive tool exposure / selection eval.
- `cf-mcp-server #15`: tool-contract manifest / semantic drift gate.
- `skill-foundry #5`: demonstration-to-skill intake.
- `ppt-studio #5`: structured slide state + render verification.
- `ai-novel-workstation #6`: agent-facing story workspace contract.
- `video-timeline-pipeline #11`: evidence-backed cut / NLE handoff.
- `clinical-scribe-worker #7`: section-scoped repair / revision receipt.
- `tick-stock-panel #5/#6/#7`: deterministic strategy research, generated/custom Python isolation, Docker/release gate.
- `lobsterpulse #9`: decision-only attention queue.

No Issue was modified where another workflow could be actively working on the same fingerprint.

---

# Sources

| Classification | Date | Source | URL | Used for |
|---|---|---|---|---|
| CONFIRMED | 2026-09-10 | OpenAI — Agents API | https://openai.com/index/introducing-the-agents-api/ | managed harness / tool search / sandbox strategy |
| CONFIRMED | 2026-09-10 | OpenAI — Data agent | https://openai.com/index/put-data-to-work/ | canonical data → interactive analysis view |
| CONFIRMED | 2026-09-10 | Fund Recs Agentic Platform | https://www.fundrecs.com/blog/fund-recs-launches-agentic-platform-and-ai-ops-bringing-ai-agents-into-fund-oversight-controls | specialist agents, inherited permission, audit, human approval, deterministic rules |
| CONFIRMED | checked 2026-09-14 | Fund Recs product library | https://www.fundrecs.com/ | confidence-scored extraction / exception review |
| CONFIRMED | 2026-08-25 | Scalable Agentic Investing | https://de.scalable.capital/en/newsroom/scalable-agentic-investing | explicit AI→financial-effect boundary |
| CONFIRMED | checked 2026-09-14 | Scalable order approval FAQ | https://help.scalable.capital/en/agentic-investing-aac939f8/how-are-orders-approved-and-protected-when-using-scalabl-d16595b5 | separate review/confirm before order submit |
| CONFIRMED | 2026-05-14 | AWS Advanced Prompt Optimization | https://aws.amazon.com/about-aws/whats-new/2026/05/amazon-bedrock-advanced-prompt-optimization-migration-tool/ | prompt quality + cost + latency comparison |
| CONFIRMED | checked 2026-09-14 | PromptLayer | https://www.promptlayer.com/ | prompt-version quality/usage/cost/latency |
| CONFIRMED | checked 2026-09-14 | LangSmith Prompt Canvas | https://docs.langchain.com/langsmith/write-prompt-with-ai | length edit as inspectable candidate diff |
| CONFIRMED | 2026-08-25 | LangSmith Engine | https://www.langchain.com/blog/new-in-langsmith-engine-2x-better-issue-detection | trace diagnosis → proposed fix → regression monitoring pattern; vendor benchmark claims not reused |
| CONFIRMED_RESEARCH | 2026-09-03 | ESPO | https://arxiv.org/abs/2609.04197 | evolutionary prompt bloat / diagnose-propose-select |
| CONFIRMED_RESEARCH | 2026-08-11 | RLMOpt | https://arxiv.org/abs/2608.10471 | deterministic Pareto/regression selection |
| COMMUNITY_SIGNAL | 2026-07-03 | Reddit PromptEngineering | https://www.reddit.com/r/PromptEngineering/comments/1umk4j2/one_prompt_change_almost_doubled_our_costs/ | cost-regression hypothesis only |
| CONFIRMED_PRODUCT_SURFACE | checked 2026-09-14 | TryHackMe AI Security | https://tryhackme.com/aisecurity | hands-on cyber learning pattern |
| LIKELY / CURRENT | checked 2026-09-14 | Air Savvy | https://air-savvy.com/ | baseline/history fare tracking |
| LIKELY / CURRENT | checked 2026-09-14 | TripManta | https://www.tripmanta.com/ | repeated-check elimination / post-booking monitor |

---

# What Changed Since Last Radar

Compared with `2026-09-13-external-radar-r8.md`:

1. **New high-value opportunity:** `prompt-autoresearch` anti-bloat design was re-read against current repository truth. The project already has a 10% relative token-growth limit and F11 compression concepts, so the opportunity was narrowed from “add a length guard” to **replace cumulative ratcheting with a Pareto Complexity Budget + Compaction Challenger**.
2. **New Issue created:** `prompt-autoresearch #5`, 92/100, Research-only and explicitly blocked from production promotion changes by #4; coordinated with #3.
3. **New research evidence:** ESPO (2026-09-03) and RLMOpt (2026-08-11) make deletion/merge/compaction and deterministic multi-objective selection more concrete.
4. **New product triangulation:** PromptLayer/AWS/LangSmith collectively show a mature pattern of prompt versioning + cost/latency evidence + inspectable candidate diff.
5. **Major platform strategy reinforced:** OpenAI Agents API public beta (2026-09-10) strengthens the prior decision not to rebuild generic orchestration/runtime plumbing; no duplicate `autodev-ng` Issue.
6. **Regulated-workflow adjacent signal strengthened:** Fund Recs’ 2026-09-10 launch shows specialist agents that prepare work, inherit permissions, emit audit trails and hand approved rules to deterministic execution.
7. **High-impact action boundary sharpened:** Scalable Agentic Investing (2026-08-25) demonstrates real AI-connected trade execution with separate explicit confirmation, but `tick-stock-panel` remains intentionally analysis-only until existing isolation/reliability prerequisites are solved.
8. **Portfolio inventory remains stable:** 37 owned+unarchived repositories, 35 treated as product-like for scoring; no stale/nonexistent product was added to the map.

---

# Portfolio principle added this round

> **Higher eval score ≠ better deployable artifact.**
>
> For prompts, skills, policies and other autonomously evolved instructions, Reese-max should move toward:
>
> **`Candidate → Quality/Safety Evidence + Complexity/Cost Evidence → Stability Gate → Pareto/Trade-off Decision → Explicit Promotion → Runtime Receipt`**
>
> Equally important, every optimizer needs a legal path to say **DELETE, MERGE, REWRITE or NO_CHANGE**. Autonomous improvement that can only add instructions will eventually turn product knowledge into accumulated historical patches rather than a maintainable system.