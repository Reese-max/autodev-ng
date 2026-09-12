# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-13 r3

Research window: 2026-09-13 06:57 Asia/Taipei run.  
Scope: Reese-max owned + unarchived repositories that remain product-like.  
Primary evidence: public web outside GitHub. GitHub was used for portfolio truth, duplicate/lock/PR checks, and report/Issue writes.

## Executive Decision

**NOTIFY / NEW HIGH-VALUE OPPORTUNITY.**

A new cross-portfolio pattern passed the Issue threshold in `skill-foundry`: **human demonstration should become an evidence source for Candidate generation, not a trusted replay macro or a shortcut around certification.** OpenAI Codex Record & Replay and Anthropic Claude/Cowork Record a Skill independently make “show the workflow once → reusable skill” a mainstream authoring surface. `skill-foundry` already has the stronger downstream half — Candidate isolation, comparison, certification and deterministic promotion — but its current first-mile remains objective/specification driven.

Created:
- `Reese-max/skill-foundry#5` — `[Competitive Inspiration][Research][RESEARCH_REQUIRED][WORKFLOW][PRIVACY] Demonstration-to-Skill Intake：把真人示範轉成可稽核 Candidate，而不是直接信任錄影重播`
- URL: https://github.com/Reese-max/skill-foundry/issues/5
- Opportunity Score: **94/100**

No implementation branch, source change, merge, deploy, secrets/permission/repository-setting mutation was performed.

---

## Portfolio Discovery / Product → Market Category

Current GitHub discovery returned **37 Reese-max owned, unarchived repositories**. The market/category map used in this round is:

| Repository | Product / market category |
|---|---|
| `cf-ai-router` | multi-provider AI gateway, quota/cost-safe routing |
| `soundbox-offline` | local-first/offline audio library and player |
| `police-exam-archive` | official police-exam archive / provenance |
| `skill-foundry` | evidence-gated Agent Skill authoring, evaluation and certification |
| `lobsterpulse` | multi-agent observability / attention management |
| `prompt-autoresearch` | prompt/model experimentation and automated research |
| `tick-stock-panel` | stock/market monitoring panel |
| `clinical-scribe-worker` | clinical scribe / note generation workflow |
| `avatar-vfo` | avatar / VFO content workflow |
| `adng-memory` | durable agent memory lifecycle / provenance / erasure |
| `ai-flight-radar` | flight / fare intelligence and travel decisions |
| `taiwan-intel-dashboard` | Taiwan intelligence aggregation / dashboard |
| `note-filler` | structured form/note completion |
| `cyber-prep-coach` | cybersecurity certification study coach |
| `UkePack` | teacher / children music-learning content pack |
| `autodev-ng` | multi-agent software-engineering orchestration / governance |
| `ai-novel-workstation` | long-form novelist workstation |
| `herdr-skills` | multi-agent reusable skills / workflows |
| `video-timeline-pipeline` | evidence-backed video-edit / NLE handoff pipeline |
| `chatgpt-dual-pipeline` | dual-engine content / publishing pipeline |
| `claude-mem` | Claude-oriented memory/context layer |
| `lplrs-judicial-sync` | judicial-data synchronization and coverage tracking |
| `internship-notes-sites-mirror` | internship-note publishing / mirror / archive |
| `MaterialYouNewTab` | local-first browser new-tab workspace |
| `taichung-police-intel` | Taichung police/government intelligence monitoring |
| `ninax-line-hermes` | LINE / agent workflow integration |
| `92-duty-scheduler` | duty scheduling / absence cover / swap governance |
| `voice-actress` | legal / essay / voice-assisted evidence workflow |
| `project-doctor-web` | medical simulation / case-learning web app |
| `flux-image-gen` | AI image generation / iterative editing |
| `neciken-summer-poem` | local-first Traditional-Chinese literary / contest workstation |
| `minideck` | lightweight presentation / publish surface |
| `police-exam-practice` | police-exam practice system |
| `ppt-studio` | AI presentation studio |
| `exam-archive` | general exam archive / retrieval |
| `academic-mcp` | academic search / evidence / MCP research gateway |
| `cf-mcp-server` | Cloudflare operations MCP gateway / governed tools |

### What changed internally since r2

GitHub commit scan across the 37 repositories found one material late addition after r2 before this research started: `neciken-summer-poem` added a 2026-09-13 product-board audit. It confirms the product’s main near-term risk is not missing creative features, but a trust-boundary contradiction: formal contest export can still succeed after a known AI-policy conflict warning. Existing Issue #4 already owns that fingerprint, with #3 owning rule freshness and #1/PR #2 owning CI. No new source-code product change was found across the remainder of the portfolio in the interval used for this round.

During this radar run, the new `skill-foundry#5` research Issue was created after open/closed Issue, all-state PR, and `github-issue-lock:v1` duplicate checks.

---

# External Signals

## Signal A — Direct competitor shift: workflow demonstration becomes a Skill authoring surface

### A1. OpenAI Codex Record & Replay — CONFIRMED
**Date:** 2026-06-18  
**Sources:**
- https://help.openai.com/en/articles/11391654
- https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan

OpenAI documents Record & Replay for eligible Codex/macOS users: demonstrate a stable repeatable workflow once and turn it into a reusable Skill that can later use Computer Use, browser actions and plugins. Official guidance explicitly warns users to keep secrets and sensitive data out of recordings.

**JTBD:** capture a workflow that is easier to show than fully specify in prose.  
**Why it saves steps:** removes the first translation layer from tacit procedure → long manual prompt/specification.  
**Onboarding/distribution signal:** “teach by doing” is a lower-friction creation surface than editing a Skill package by hand.  
**New product pattern:** recording is an authoring input, while the output is still a reusable Skill artifact.  
**Risk / failure signal:** the recording necessarily observes window content and therefore expands privacy/sensitive-data exposure.  
**Reese-max transfer:** use a demonstration as **untrusted evidence** that seeds a Candidate; do not treat it as production authority.  
**Do not copy:** screen-recording-first product scope, implicit permission carryover, or pixel replay as the canonical workflow.

### A2. Anthropic Claude/Cowork Record a Skill — CONFIRMED
**Date:** 2026-07-21/22  
**Source:** https://support.claude.com/en/articles/12512198-how-to-create-custom-skills

Anthropic’s official flow captures screen/clicks/typing and optional narration, then **proposes a Skill for review before save**. It also warns that the recording captures visible content and recommends closing private files/apps/conversations and avoiding passwords/secrets.

**Transferable principle:** `Demonstration → Proposal → Review → Reusable Artifact`, not `Demonstration → Trusted Automation`.

### A3. Community pain: replaying the screen can be slower than the human workflow — COMMUNITY_SIGNAL
**Date:** 2026-07-31  
**Source:** https://www.reddit.com/r/ClaudeAI/comments/1vbpf4j/why_are_recorded_skills_so_slow/

A Claude user described a roughly two-minute manual Etsy→WordPress workflow taking much longer when replayed through visual browser automation. Replies suggested that repeatable work should preferentially compile to DOM/API/script paths when available. This is anecdotal evidence, not a benchmark, but it directly supports a Foundry differentiator:

> **Learn from the demonstration, then seek the most stable typed/native implementation; do not necessarily replay the demonstration medium.**

This is why `skill-foundry#5` specifies “distill intent, not pixels.”

---

## Signal B — Adjacent workflow pattern: a good automation specification includes approval/context boundaries

### OpenAI Academy workflow mapping — CONFIRMED
**Date:** 2026-07-30  
**Source:** https://academy.openai.com/en/public/clubs/work-users-ynjqu/events/skill-lab-automating-workflows-tko7y70ynu

The workflow lab explicitly maps trigger, context, tools/source material, ownership, approval points and a definition of good output before turning the map into a reusable workflow/Skill/agent brief.

For `skill-foundry`, this is more valuable than copying a recorder UI. A `DemonstrationEvidenceBundle` should distill:
- trigger;
- context/input;
- tool/app/source;
- observed step;
- narrated rationale;
- decision branch;
- human-only / approval point;
- external effect;
- expected evidence/output;
- unknown branch.

It should also preserve evidence class: `OBSERVED / NARRATED / INFERRED / UNKNOWN / USER_EDITED`.

---

## Signal C — Emerging cost semantics: cache-aware token economics is becoming a first-class gateway contract

### C1. Cloudflare AI Gateway custom costs add cache read/write rates — CONFIRMED
**Date:** 2026-09-09  
**Sources:**
- https://developers.cloudflare.com/changelog/product/ai-gateway/
- https://developers.cloudflare.com/ai-gateway/configuration/custom-costs/

Cloudflare now supports `per_cache_read_token` and `per_cache_write_token` in custom costs and normalizes provider differences where cache tokens may be included inside input tokens or reported separately. It explicitly prevents double-counting.

### C2. OpenRouter ties caching to sticky provider routing — CONFIRMED
**Date:** 2026-07-21  
**Source:** https://openrouter.ai/blog/tutorials/prompt-caching-sticky-routing/

OpenRouter describes cache read/write pricing as provider-specific and explains that moving follow-up turns between provider endpoints can lose the warm cache. A stable session/provider relationship can therefore be a cost dimension, not just a latency optimization.

### C3. Gemini context caching exposes cache-hit usage separately — CONFIRMED
**Current docs checked 2026-09-13**  
**Source:** https://ai.google.dev/gemini-api/docs/caching

Gemini exposes total cached-token usage and supports implicit caching on newer models, further confirming that `input_tokens` alone is no longer a sufficient normalized cost unit across providers.

### C4. Community signal: multi-provider routing can undermine cache economics — COMMUNITY_SIGNAL
**Date:** 2026-06-21  
**Source:** https://www.reddit.com/r/openrouter/comments/1ubx4qz/openrouter_adhering_to_kvcache_costs/

A user discussion reported higher-than-expected cost when requests did not benefit from cache pricing under multi-provider routing. This is anecdotal and not used as cost-saving proof.

**Reese-max implication for `cf-ai-router`:** research a provider-neutral usage vector such as:

`fresh_input + cache_read + cache_write + output + storage/other_metered_units`

rather than treating every input token as cost-equivalent. However this does **not** justify weakening the current zero-surprise-cost gate or enabling Cloudflare Dynamic Route. Current `cf-ai-router` intentionally fail-closes dynamic routing because provider/model cost is not known before dispatch, and current paid nodes remain blocked. This candidate scores **87/100** and stays on the research list rather than becoming a Feature Issue this round.

---

## Signal D — AI-use rules are becoming operation-scoped, not just “allowed / forbidden”

Recent contest/publishing policies continue to diverge:

- Protopian Prize: AI-generated text, including AI translation, is ineligible and entrant self-attestation is required. Current rules: https://protopianprize.com/contest-rules
- Future Youth Records 2026 songwriting contest: disclosure/authorship evidence and the ability to request drafts/stems/demos are part of the policy contract. https://www.futureyouthrecords.org/fyr360-songwriting-contest-rules
- Other live 2026 contests in this radar window range from AI-required/co-developed entries to AI-assisted-only or AI-prohibited entries.

**Classification:** CONFIRMED policy-divergence signal; no general claim about the proportion of contests.

This strengthens a nuance already adjacent to `neciken-summer-poem#4`: future contest policy should ultimately describe **which operation** is permitted — brainstorming, grammar, translation, revision, authored prose, cover/image, disclosure — rather than only a global boolean/tri-state. However #4 already owns policy + provenance formal-readiness, #3 owns rule freshness, and the repository has trust-boundary work ahead of new feature breadth. No new Issue was created and no active work was disturbed.

---

# New Releases / Fresh Market Moves

| Date | Product | Release / change | Classification | Reese-max read-through |
|---|---|---|---|---|
| 2026-09-09 | Cloudflare AI Gateway | cache-read / cache-write custom-cost rates | CONFIRMED | `cf-ai-router`: cost normalization must eventually distinguish cached vs fresh input |
| 2026-09-04 | Skills & Agents | approval checkpoints + scoped assistant/connectors index | CONFIRMED_VENDOR | supports explicit approval and capability visibility, already covered by existing Reese-max governance directions |
| 2026-07-30 | OpenAI Academy | workflow mapping lab | CONFIRMED | demonstration distillation should recover trigger/context/tools/owner/approval/output |
| 2026-07-21/22 | Claude Cowork | Record a Skill | CONFIRMED | direct `skill-foundry` authoring-surface opportunity |
| 2026-06-18 | Codex | Record & Replay | CONFIRMED | independent validation that “show, then save a Skill” is becoming a product primitive |

No Product Hunt / Hacker News item found in this pass exceeded these official-source signals after duplicate and strategic-fit filtering.

---

# Community Pain Points

1. **Recorded-skill execution latency / browser occupation** — COMMUNITY_SIGNAL. Visual step-by-step replay may be slower than the original human process; repeated deterministic workflows often deserve API/DOM/CLI compilation instead of screenshot loops. Source: https://www.reddit.com/r/ClaudeAI/comments/1vbpf4j/why_are_recorded_skills_so_slow/
2. **Rollout/platform friction** — COMMUNITY_SIGNAL. Users report Record a Skill availability differences, especially Mac vs Windows / phased availability. Source: https://www.reddit.com/r/Anthropic/comments/1vcp51d/claude_learn_a_skill_in_germany/
3. **Cache/routing cost confusion** — COMMUNITY_SIGNAL. Users can misunderstand whether multi-provider requests actually receive cache pricing. Source: https://www.reddit.com/r/openrouter/comments/1ubx4qz/openrouter_adhering_to_kvcache_costs/

No community report is treated as a prevalence estimate or correctness benchmark.

---

# Adjacent Ideas

## 1. Demonstration Compiler, not Demonstration Replayer
`Human demo → evidence → task/decision model → native tool candidates → Candidate Skill → certification`.

This can later benefit `herdr-skills`, `autodev-ng`, browser workflows and operations automation without making screen automation the shared runtime.

## 2. Human edits become ownership boundaries
When a person fixes the distilled workflow, mark that field/step `USER_EDITED`; future re-imports produce a diff instead of silently overwriting it. This aligns with the portfolio-wide pattern of canonical state vs AI candidate state.

## 3. Cache-aware cost vector
For routers/agent budgets, separate fresh input, cache-read, cache-write, output and provider-specific metered dimensions. A total dollar number remains a receipt, while preflight authority remains its own gate.

## 4. Operation-scoped policy
Policies should attach to actions/content types rather than only product-wide “AI allowed” flags: `BRAINSTORM / TRANSLATE / EDIT / GENERATE_TEXT / GENERATE_MEDIA / DISCLOSE / SUBMIT`.

---

# Opportunity Scores

Scoring uses User Pain, Strategic Fit, Novelty, Evidence Strength, Reuse Potential, Implementation Effort, and Security/Privacy/Cost Risk. Higher overall score means better research opportunity after risk/effort adjustment; it is not a promise of ROI.

| Candidate | Score | Decision |
|---|---:|---|
| `skill-foundry` Demonstration-to-Skill Intake / `DemonstrationEvidenceBundle` | **94** | **CREATE RESEARCH ISSUE #5** |
| `neciken-summer-poem` operation-scoped AI-use policy + per-operation provenance | 89 | fold into existing #4/#3 research; no new Issue |
| `cf-ai-router` cache-aware normalized usage/cost vector | 87 | research list only; current cost fail-closed model remains correct |
| cross-portfolio demonstration → native tool compiler | 86 | validate inside skill-foundry #5 before abstraction |
| `MaterialYouNewTab` encrypted selective sync / local-first workspace validation | 78 | repeated market signal; no Issue |
| generic “add AI assistant to every product” | 42 | reject; increases mode sprawl and duplicates existing workflows |

---

# Opportunity Map — All 37 Products

This is an incremental portfolio map: it preserves active high-priority truths from earlier radars and updates them with this run’s external signals. `DO NOT COPY` is deliberately included so the radar can recommend subtraction / restraint, not only feature addition.

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| `cf-ai-router` | truthful provider/cost/fallback receipts | cache-aware cost semantics without weakening preflight gate | zero-surprise-cost deterministic routing | normalized fresh/cache/output usage vector | black-box dynamic routing before provider/cost is known |
| `soundbox-offline` | playback/library recovery correctness | offline/source integrity | local-first media ownership | later NAS/network-source capsules after reliability gate | cloud account/subscription before local recovery is proven |
| `police-exam-archive` | official-source provenance | versioned source freshness | Taiwan police-exam traceability | evidence receipts reusable by practice apps | unsourced AI explanations as archive truth |
| `skill-foundry` | Candidate isolation + explicit promotion | **human demonstration as evidence intake** | certify a proposed Skill instead of trusting its authoring method | demo → typed workflow → native tools | direct pixel replay / recording = certification |
| `lobsterpulse` | agent state truth | decision-only attention queue | bounded pre-investigation + receipts | surface stale demo/certification decisions | alert every event with AI summary |
| `prompt-autoresearch` | experiment reproducibility | exact model/prompt/data fingerprints | automated research with replayable evidence | cache-cost vector in experiment ledger | leaderboard claims without frozen evaluation |
| `tick-stock-panel` | timestamp/source freshness | anomaly/context explainability | focused local market panel | decision receipts / watch conditions | opaque trading advice or pseudo-certainty |
| `clinical-scribe-worker` | provenance + clinician review | user-owned field protection | bounded note candidate rather than autonomous chart truth | operation ownership (`AI_OWNED/USER_OWNED`) | silent overwrites / unsupported medical assertions |
| `avatar-vfo` | asset/model lineage | reusable candidate/edit context | evidence-linked creative pipeline | demonstration capture for repetitive production setup | UI replay as canonical production recipe |
| `adng-memory` | provenance/retention/erasure | stale/conflict handling | truth-preserving durable agent memory | user-owned memory patches | “remember everything” collection |
| `ai-flight-radar` | fare/source/date truth | booked-itinerary reprice evidence | Taiwan-origin actionable flight intelligence | rule-aware post-booking watch | auto-rebook without fare-rule proof |
| `taiwan-intel-dashboard` | source/time provenance | cross-source dedupe | Taiwan public-intel synthesis | typed generated task views | more panels without decision value |
| `note-filler` | source-field evidence | preserve user-edited values | candidate fill + receipt | learn form procedure from demonstration, then compile to typed fields | blind overwrite / screenshot macro filling |
| `cyber-prep-coach` | official blueprint/source versions | progress migration across blueprint changes | evidence-linked mastery | operation-scoped content update receipts | more practice modes without exam-contract clarity |
| `UkePack` | correct lesson/media packaging | teacher-ready reuse | small focused teaching artifact | demonstrate a lesson-prep workflow → reusable pack recipe | generic social/marketplace layer |
| `autodev-ng` | principal/environment/effect/cost/receipt separation | consume certified Skills with explicit capability scope | auditable multi-agent orchestration | demonstration-generated workflow Candidate imported through Foundry | one giant AI control-plane abstraction |
| `ai-novel-workstation` | canonical manuscript truth | typed external-agent reads/candidate patches | local story-state + continuity gates | demonstration-derived editorial procedure as Candidate Skill | raw filesystem mutation by external AI |
| `herdr-skills` | skill identity/version | portable certified skill intake | multi-agent reusable procedures | consume Foundry demonstration-derived candidates after certification | unreviewed recorded skills copied directly into runtime |
| `video-timeline-pipeline` | evidence→timecode→cut truth | target-native read-back | evidence-backed NLE handoff | demonstrate rough-cut procedure to extract decision policy | build a full NLE / trust timeline mutation without verification |
| `chatgpt-dual-pipeline` | exact stage/provenance receipts | clearer ownership between engines | dual-engine cross-check | workflow demonstration as training evidence | hidden engine switches / redundant modes |
| `claude-mem` | memory provenance and deletion | conflict/staleness visibility | memory bounded to exact source | capture repeat-workflow preferences separately from factual memory | storing screen recordings as “memory” by default |
| `lplrs-judicial-sync` | target-date coverage truth | missed-run/backfill receipts | exact judicial-source coverage | scheduler coverage dashboards | infer success from scheduled trigger alone |
| `internship-notes-sites-mirror` | mirror/source integrity | freshness + broken-link detection | durable internship knowledge mirror | reproducible publish recipe | adding AI rewriting that obscures source history |
| `MaterialYouNewTab` | local privacy + fast startup | workspace/session restoration | Material You + local-first workspace | selective encrypted sync if needed | account-first cloud workspace / oversized tab manager |
| `taichung-police-intel` | official source/provenance | decision-oriented dedupe | Taichung police/public-sector intelligence | generated task views from canonical evidence | scrape volume as value; unsourced summaries |
| `ninax-line-hermes` | message/action receipts | explicit human approval for effects | bounded LINE-agent workflows | demonstrate common operator workflow, compile to typed action plan | replay chat UI if API/action surface exists |
| `92-duty-scheduler` | rule-compliant assignment | absence/swap reconciliation | explainable duty decisions | user-owned edits + generated task view | autonomous schedule changes without exact rule receipt |
| `voice-actress` | citation exists/supports-claim separation | source spans + reasoning verification | evidence-backed legal/essay assistance | demonstrated answer-review rubric as candidate workflow | generic citation checker with false confidence |
| `project-doctor-web` | case truth / educational boundary | deterministic progression | focused medical simulation | demonstrated instructor debrief rubric | clinical decision claims / unrestricted medical agent |
| `flux-image-gen` | revision/reference lineage | Creative Edit Session | local, branchable candidate artwork | demonstrate repeatable editing intent, preserve clean parent | latest-image overwrite / uncontrolled iterative drift |
| `neciken-summer-poem` | formal success must equal policy/provenance eligibility | operation-scoped AI policy + fresh rule receipt | safe practice vs formal submission boundary | `AIUsePolicySpec` by action/content type | auto-submission / warning-only formal eligibility |
| `minideck` | export/publish fidelity | canonical deck provenance | lightweight presentation path | source→claim→layout candidate receipt | full design suite / hosted collaboration breadth |
| `police-exam-practice` | official answer/source correctness | resume/mastery/version handling | focused police-exam practice | generated study view over canonical question bank | mode proliferation / unsupported AI answer keys |
| `ppt-studio` | fail-closed remote auth + green CI first | evidence-linked editable deck | source→claim→layout provenance | demonstration-captured house style after trust gates | remote-agent breadth before security/CI |
| `exam-archive` | source identity and retrieval | dedupe/version indexing | durable exam corpus | shared provenance primitives with practice systems | generated content mixed into archive without labeling |
| `academic-mcp` | canonical paper identity + entitlement truth | research-bundle provenance | multi-source academic evidence gateway | demo-derived research procedure after source truth | “paper found = full text available” |
| `cf-mcp-server` | tool contract/authority/read-back truth | contract drift review | governed Cloudflare ops tools | demo-generated operational recipe only after typed-tool mapping | recorded browser/console macros as admin authority |

---

# Top 10 Cross-Portfolio Ideas

1. **DemonstrationEvidenceBundle** — human demonstration becomes versioned evidence, not execution authority.
2. **Demonstration → Native Tool Compilation** — use UI demonstration to infer intent, then prefer API/MCP/CLI/domain tools over pixel replay when possible.
3. **Evidence class per inferred rule** — `OBSERVED / NARRATED / INFERRED / UNKNOWN / USER_EDITED`.
4. **Human Edit Ownership** — user corrections cannot be silently overwritten by later AI re-distillation.
5. **Training Evidence ≠ Holdout Evidence** — a demo cannot generate its own test and then certify itself.
6. **Cache-aware UsageCostVector** — normalize fresh input, cache read/write, output and other metered units.
7. **Operation-scoped policy** — permissions and AI-use rules attach to exact action types, not broad booleans.
8. **Privacy/Egress Preview before semantic processing** — especially for screen/audio/file capture.
9. **Candidate → Gate → Promotion** as the common mutation model across content, workflow, Skill and automation products.
10. **Receipts over success strings** — exact source/hash/policy/runtime evidence must answer what was actually observed or changed.

---

# Ideas Rejected / Deferred

## Reject for now — Build a cross-platform screen recorder inside `skill-foundry`
Reason: the strategic value is the **evidence-to-certified-Skill bridge**, not owning capture UX. Start with importing an explicit local recording/transcript/action trace. A recorder adds OS permissions, privacy surface, media processing and maintenance before value is proven.

## Reject — Replay mouse coordinates / screenshots as the Skill
Reason: UI drift and community latency signal; it also confuses the observation medium with the intended procedure.

## Reject — Automatically grant tools/credentials observed during a demo
Reason: demonstration of authority is not delegation of authority.

## Defer — `cf-ai-router` dynamic cost-aware routing based on cache economics
Reason: cache economics are now real, but current product promise is zero-surprise cost and Dynamic Route is intentionally disabled when provider/model cost cannot be verified pre-dispatch. First research a normalized usage receipt; do not weaken the gate.

## Defer — `neciken-summer-poem` new contest automation features
Reason: #4 policy/provenance and #3 rule freshness are higher priority. The new external evidence refines policy shape but does not justify more submission automation.

## Reject — Generic AI assistant / chat box across portfolio
Reason: duplicates existing interaction surfaces and increases mode sprawl without removing a concrete manual handoff.

---

# Issue / PR Mapping

| Product | Existing work | This round |
|---|---|---|
| `skill-foundry` | #1 runtime compatibility; PR #2 open and mergeable for #1; #3 package security attestation | **created #5 Demonstration-to-Skill Intake**; no lock/PR overlap found |
| `cf-ai-router` | #1 task reliability routing; #2 Responses API; #4 model lifecycle; #5 Workers AI billing fail-closed | cache-aware cost vector kept in research list; no duplicate Issue created |
| `neciken-summer-poem` | #1 CI, #3 rule drift, #4 policy+provenance formal gate | operation-scoped AI-use nuance recorded centrally; no duplicate Issue / no active work disturbed |
| `autodev-ng` | existing effect/principal/environment/browser/contract research Issues from prior radars | no new control-plane meta-Issue |
| all other products | prior Opportunity Maps retained | no new Issue met the evidence + novelty + non-duplicate threshold |

Cross-schedule rule was preserved: no implementation lock was taken. The open `skill-foundry` PR #2 targets Issue #1 and does not share the new #5 fingerprint.

---

# Sources

## Official / primary
- OpenAI Business Release Notes — Record & Replay, 2026-06-18: https://help.openai.com/en/articles/11391654
- OpenAI Codex plan/help — Record & Replay current description: https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
- OpenAI Academy — Skill Lab: Automating workflows, 2026-07-30: https://academy.openai.com/en/public/clubs/work-users-ynjqu/events/skill-lab-automating-workflows-tko7y70ynu
- Anthropic Help Center — How to create custom skills / Record a Skill, 2026-07-22: https://support.claude.com/en/articles/12512198-how-to-create-custom-skills
- Cloudflare AI Gateway changelog, cache-token custom cost, 2026-09-09: https://developers.cloudflare.com/changelog/product/ai-gateway/
- Cloudflare AI Gateway custom costs: https://developers.cloudflare.com/ai-gateway/configuration/custom-costs/
- OpenRouter prompt caching + sticky routing, 2026-07-21: https://openrouter.ai/blog/tutorials/prompt-caching-sticky-routing/
- Google Gemini context caching: https://ai.google.dev/gemini-api/docs/caching
- Protopian Prize contest rules: https://protopianprize.com/contest-rules
- Future Youth Records FYR360 contest rules: https://www.futureyouthrecords.org/fyr360-songwriting-contest-rules

## Community / anecdotal only
- Claude recorded-skill latency discussion, 2026-07-31: https://www.reddit.com/r/ClaudeAI/comments/1vbpf4j/why_are_recorded_skills_so_slow/
- Claude Record a Skill platform/availability discussion: https://www.reddit.com/r/Anthropic/comments/1vcp51d/claude_learn_a_skill_in_germany/
- OpenRouter KV-cache cost discussion, 2026-06-21: https://www.reddit.com/r/openrouter/comments/1ubx4qz/openrouter_adhering_to_kvcache_costs/

## Implementation-pattern discovery only
- adilei/skill-recorder: https://github.com/adilei/skill-recorder

---

# What Changed Since Last Radar

1. **New high-value fingerprint found:** `skill-foundry` had no first-class human-demonstration intake even though OpenAI and Anthropic now both expose demonstration-to-Skill authoring surfaces.
2. **New Issue created:** `skill-foundry#5`, but intentionally scoped to evidence intake/distillation and existing certification, not a recorder implementation.
3. **New product principle:** `Demonstration ≠ Specification ≠ Certified Skill`.
4. **New direct design constraint from community evidence:** repeated deterministic workflows should preferably compile to native API/DOM/CLI tools rather than blindly replaying slow visual steps.
5. **New gateway economics signal:** Cloudflare’s 2026-09-09 cache read/write cost model strengthens the case for a cache-aware normalized usage ledger, but does not overturn `cf-ai-router`’s current cost fail-closed direction.
6. **New internal truth after r2:** `neciken-summer-poem` product-board audit reaffirms INVEST/SIMPLIFY and prioritizes #4/#3/#1 over more creative feature breadth.
7. No source-code implementation branch, merge, deploy, secret/permission change, or repository-setting change was made by this radar.

## Portfolio Principle Added This Round

**`Demonstration ≠ Specification ≠ Certified Skill ≠ Runtime Authority`**

A useful system should let a person *show* what they do, but then separate what was actually observed, what was narrated, what AI inferred, what the human corrected, what tools are truly authorized, and what later passed independent evaluation. The competitive opportunity is not merely recording the human — it is converting tacit work into a **reviewable, testable, privacy-bounded, promotable artifact** without pretending that one successful demonstration proves general automation.