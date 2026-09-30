# External Competitive / Product / Workflow Inspiration Radar — 2026-09-14 r3

> Scope: Reese-max owned, unarchived repositories that are product-like. Public web is the primary market-evidence source; connected GitHub is used for repository purpose/recent-change checks, duplicate/lock coordination, Issue mapping, and this central report.
>
> Portfolio count checked this round: **37 owned + unarchived repositories; 35 treated as product-like.** `adng-memory` and `internship-notes-sites-mirror` remain coordination/support references rather than independent product opportunities.
>
> Evidence labels: **CONFIRMED** = first-party product/docs/release information or directly inspectable current repository state; **LIKELY** = reasonable inference that still needs runtime/user validation; **COMMUNITY_SIGNAL** = anecdotal user report only; **UNKNOWN** = insufficient evidence or outcome must be measured.
>
> Safety boundary: no product source code, implementation branch, merge, deploy, secrets, permissions, repository settings, or production runtime configuration were changed in this round.

---

## Executive Summary

This round found a **cross-vendor strategy shift** that is more important than another standalone feature: autonomy is moving from a single agent-level `ON/OFF` choice toward **stage/transition-scoped work, publish-time constraints, explicit promotion/review boundaries, and separately metered evaluation/guardrail work**.

Three independent first-party signals support the direction:

1. **Mastra Factory Beta — 2026-09-08 (CONFIRMED):** configurable `Intake → Triage → Planning → Build → Review → Done`, each stage manual or automatic, with visible agent session/tool/workspace state. Mastra also publicly describes why full-auto progression created bursty backlog/infrastructure/review pressure and why it introduced stage-level control.
2. **Atlassian governed agent loops — 2026-09-10 (CONFIRMED):** Code Context, Agent Context Controls, Jira Agent Loops, Standards, AI Review and Agent Usage Dashboard are being separated into distinct context/governance/execution/measurement layers. Availability differs by feature: Code Context is open beta; Agent Loops/Standards/AI Review are private early access; Agent Context Controls/Usage Dashboard are planned GA in coming months.
3. **UiPath Agents — 2026-09-07 / 2026-09-09 (CONFIRMED):** publish-time Agent design policies can require minimum score, max temperature, max response tokens, HITL escalation and max iterations. Its LLM-as-Judge guardrail makes a real additional model call per check and **tracks those units separately from the primary Agent usage**.

The strongest Reese-max-wide principle is therefore:

`Workflow Trigger ≠ Agent Work Authority ≠ Candidate Result ≠ Promotion Authority ≠ Verification Cost ≠ Canonical Effect`

### GitHub action this round

**No new Issue was created.**

The new UiPath signal maps directly to the existing `Reese-max/prompt-autoresearch #3` variance-aware repeated-evaluation / stability-gate fingerprint. Its previous `github-issue-lock:v1` lease had already been explicitly released/completed, so this round added an evidence update to #3 rather than opening a duplicate.

Incremental recommendation for #3:

`Primary Candidate Execution Cost ≠ Evaluation/Judge Cost ≠ Recovery/Retry Cost`

Future replicate receipts should keep those resource centers separate and retain `MEASURED | ESTIMATED | UNKNOWN`; judge-budget exhaustion must remain `INCONCLUSIVE`, never become an implicit `ACCEPT`.

### Why no new Stage Autonomy Issue

A prior 2026-09-11 radar already analyzed Mastra Factory and intentionally kept `Review Pressure / WIP Backpressure` as research-list only. Current `autodev-ng` already has bounded intake, exact task/execution identity, project/account locking, concurrency/cost caps, separate reviewer/CI, human merge, and layered completion receipts. More importantly, current open reliability Issues `#13–#16` keep the Windows/full-regression path red. The missing evidence is not “do competitors have stages?”; it is **whether Reese-max telemetry shows a real review/WIP bottleneck that warrants another orchestration abstraction.**

---

## Portfolio → Market Category / Recent Change Check

| Repository | Market / product category | Current lens used this round |
|---|---|---|
| `exam-archive` | exam source archive / study data | provenance, revision truth, archive→practice handoff |
| `police-exam-practice` | police exam practice / learning | official corpus, mastery loop, evidence-linked explanation |
| `police-exam-archive` | police exam archive / provenance | source authority, correction trail, canonical archive |
| `92-duty-scheduler` | duty roster / scheduling / LINE self-service | request lifecycle, human approval, published-roster truth |
| `UkePack` | MusicXML→ukulele practice pack | teacher-reviewed source→candidate pack, print/export truth |
| `ppt-studio` | AI presentation editor/export | structured slide state, local patch, render/export verification |
| `voice-actress` | grounded legal/evidence QA | criterion evidence, rubric/source versioning, correction lineage |
| `taiwan-intel-dashboard` | multi-source intelligence dashboard | freshness, provenance, dedupe, changed-since-last |
| `autodev-ng` | AI SDLC / multi-engine agent orchestration | bounded autonomy, review pressure, receipts, reliability first |
| `flux-image-gen` | AI image generation/editing | candidate output, provenance, cost/output receipt |
| `claude-mem` | persistent coding-agent memory | temporal truth/freshness, recall provenance, safe injection |
| `lobsterpulse` | monitoring / decision attention queue | signal freshness, dedupe, priority/attention budget |
| `prompt-autoresearch` | prompt optimization / autonomous research | repeated eval, judge cost, holdout/stability, compaction |
| `neciken-summer-poem` | creative writing / contest workflow | policy provenance, frozen revisions, candidate isolation |
| `note-filler` | structured notes/forms | claim-level candidate, review, staleness, canonical fields |
| `lplrs-judicial-sync` | judicial/public-data sync | authority revision/removal, exact source spans |
| `cyber-prep-coach` | iPAS cybersecurity exam coach | trusted corpus, adaptive review, explanation calibration |
| `cf-ai-router` | model routing / AI cost control | provider truth, failover evidence, fail-closed cost semantics |
| `avatar-vfo` | role/personality simulation | structured state, continuity regression, user isolation |
| `project-doctor-web` | project diagnostics / project health | findings→candidate remediation→review rather than blind mutation |
| `minideck` | compact slide/deck creation | editable artifact, version/share/rollback |
| `chatgpt-dual-pipeline` | multi-model / dual-pipeline workflow | explicit stage handoff, provenance, no duplicate truth |
| `taichung-police-intel` | public-sector intelligence monitor | official-first evidence, freshness, read-only distribution |
| `soundbox-offline` | offline/local media player | offline data plane, local library truth, sync boundaries |
| `skill-foundry` | skill creation/evaluation/distribution | candidate→evaluation→promotion, package/runtime receipts |
| `video-timeline-pipeline` | evidence→video/NLE automation | CutSpec, capability probe, target read-back, creative approval |
| `ai-novel-workstation` | long-form writing workstation | canonical story state, continuity, resumability, cost |
| `clinical-scribe-worker` | clinical documentation | section-scoped regeneration, revision/undo, clinical truth boundary |
| `MaterialYouNewTab` | browser new-tab/productivity dashboard | local/browser state, restore/compatibility, privacy |
| `cf-mcp-server` | MCP / SaaS tool server | tool-contract drift, exact effect authority, runtime receipt |
| `tick-stock-panel` | stock/strategy analysis | point-in-time data, deterministic strategy, no live-trade leap |
| `herdr-skills` | agent skills / policy improvement | correction→candidate preference/skill, scoped promotion |
| `ninax-line-hermes` | LINE AI gateway / ordered messaging | revision/redelivery ordering, stale-answer invalidation |
| `ai-flight-radar` | flight intelligence / fare tracking | intent→reviewed WatchSpec→bounded scheduled evaluation |
| `academic-mcp` | scholarly retrieval / research-agent gateway | progressive tool exposure, source identity, research ledger |

Recent connected-GitHub changes after the previous radar were predominantly audit/report work. No newly landed repository change in this interval overturned the current market mapping. The important implementation constraint remains `autodev-ng #13–#16`: product breadth should not outrun the current regression/recovery gate.

---

# External Signals

## A. Direct competitor — Mastra Factory: autonomy is configurable per stage, and review capacity is the real bottleneck

**CONFIRMED — 2026-09-08**  
Sources:
- https://mastra.ai/blog/announcing-mastra-factory-beta
- https://mastra.ai/factory
- https://factory.mastra.ai/

Mastra Factory connects GitHub, Linear and Slack to a configurable software factory. Its own flow is `Intake → Triage → Planning → Build → Review → Done`; each stage can run manual or auto. A work item exposes the agent session, tool activity and workspace so the human can inspect what happened rather than receiving only a PR at the end.

### Job-to-be-Done
Automate routine software work without producing more agent output than a team can safely inspect, understand and merge.

### Why it saves steps / improves reliability
- upstream investigation/triage/planning can be automated independently instead of forcing the entire lifecycle into one autonomy setting;
- human attention is concentrated at high-leverage checkpoints;
- the same work item retains session/tool/workspace context, reducing manual context reconstruction;
- steering can modify an active worker without opening a disconnected new conversation.

### Onboarding / distribution
Factory is distributed through existing GitHub/Linear/Slack inputs and an installable open-source product rather than requiring a new source-of-truth issue system.

### New capability pattern
`Stage policy + bounded agent session + explicit human checkpoint + observable workspace + downstream promotion`.

### Pricing / business-model signal
Mastra Starter is free with usage allowances; Teams is currently $250/month. Mastra separately meters observability events, CPU, egress and retention, and its broader platform now has explicit token/cost controls and persistent sandbox lifecycle features. The important signal is that **attention, observability, retention and always-on execution all have resource costs**.

### Failure / limitation
Mastra’s own launch post describes incorrect upstream assumptions producing PRs that had to be closed, and earlier full-auto operation creating bursty backlog/review pressure. This is first-party operational evidence from Mastra’s environment, not a universal failure rate.

### Absorb
- measure review/WIP pressure before increasing autonomy;
- allow future per-work-type/per-stage policy only when a real bottleneck is measured;
- keep exact task/execution lineage across manual/auto transitions.

### Do not copy
- a six-column board merely because a competitor has one;
- Linear/Slack integrations without a user Job;
- full-auto stage advancement that can outrun verification;
- Mastra’s claimed PR/issue percentages as Reese-max expected performance.

**Current Reese-max status:** RESEARCH LIST, no new Issue. This signal was already recognized by the 2026-09-11 radar and remains intentionally unpromoted until own telemetry proves a gap.

---

## B. Adjacent transferable workflow — Atlassian: governed loops separate context, execution, standards, review and measurement

**CONFIRMED — 2026-09-10**  
Sources:
- https://www.atlassian.com/blog/jira/governed-agent-loops
- https://www.atlassian.com/software/jira/guides/workflows/overview
- https://support.atlassian.com/jira-software-cloud/docs/use-the-jira-triage-agent-to-categorize-and-route-work-items/

Atlassian is explicitly moving from one-off prompts toward always-on agent loops tied to Jira workflow state. Its product direction separates:
- **Code Context**: shared code/product context;
- **Agent Context Controls**: which agents can operate and what they can see;
- **Agent Loops**: work detection/delegation/execution;
- **Standards**: reusable organization-level quality rules;
- **AI Review**: separate PR review agent;
- **Usage Dashboard / DX measurement**: throughput/quality/adoption/cost measurement.

Availability is not uniform: Code Context is open beta; Agent Loops, Standards and AI Review are private early access; Agent Context Controls and Agent Usage Dashboard are planned GA later. Do not collapse these into “all shipped.”

Jira’s current triage workflow supplies a smaller but highly transferable pattern: the agent can propose changes when a work item reaches a relevant state, while the user can accept/reject/refine before the canonical fields change.

### Job-to-be-Done
Turn a backlog into persistent agent-assisted work without letting a workflow transition silently grant every downstream mutation.

### Why it saves steps / improves reliability
A board/status transition can become the trigger, avoiding copy/paste into a separate agent console, while canonical mutation still has a distinct review/promotion step.

### Onboarding / distribution
The agent lives inside the workflow people already use. The board/status is both the work context and the trigger surface.

### Transferable principle
`Canonical State Transition → Agent Work Lease → Candidate Output → Accept/Reject/Refine → Canonical Mutation Receipt`

A trigger is not an authorization to apply every suggestion.

### Fits Reese-max
This pattern can transfer to:
- `autodev-ng`: backlog/Issue state triggers work but CI/reviewer/human merge remain separate;
- `92-duty-scheduler`: request lifecycle triggers candidate roster changes, not silent roster mutation;
- `clinical-scribe-worker`: section regeneration is a candidate, not automatic clinical truth;
- `note-filler`: source change triggers candidate field updates, not auto-overwrite;
- `ppt-studio`: selected object/state can trigger local candidate patch, not whole-deck regeneration.

### Do not copy
Do not build a generic Jira/Rovo clone or a second workflow database. Reese-max should keep canonical domain state in the owning product and borrow only the trigger→candidate→promotion contract.

**Opportunity Score: 90/100 — research-list / cross-portfolio pattern.** No new Issue because relevant products already have candidate/review/effect boundaries and the remaining need is product-specific evidence.

---

## C. Emerging governance/evaluation model — UiPath: publish-time Agent constraints + separately metered LLM judge

**CONFIRMED — 2026-09-07 / 2026-09-09**  
Source: https://docs.uipath.com/agents/automation-cloud/latest/release-notes/september-2026

UiPath’s September release creates two useful product primitives.

### 2026-09-09 — Agent design policies GA
Before publish, governance can enforce:
- minimum Agent score;
- maximum temperature range;
- maximum tokens per response;
- human-in-the-loop escalation;
- maximum iterations per Agent execution.

### 2026-09-07 — LLM as Judge guardrail Preview
The judge evaluates prompts/responses/model calls against custom natural-language instructions. Critically, **each check is an actual additional LLM call** and consumes Agent Units/Platform Units on top of the primary Agent use; those units are tracked separately, including inside evaluation runs.

### Job-to-be-Done
Prevent “the evaluation layer itself” from becoming an invisible, unbounded resource sink while still allowing flexible semantic checks.

### Why it saves steps / improves reliability
- teams can apply policy before publish instead of manually reviewing every configuration repeatedly;
- cost owners can distinguish primary workload cost from judge/verification overhead;
- maximum iterations/tokens and HITL become publishable contract properties, not ad hoc prompt conventions.

### New capability pattern
`Primary Work Budget + Verification Budget + Iteration Budget + Publish Policy + Human Escalation`.

### Pricing/business-model signal
The important design signal is not UiPath’s unit price; it is that evaluator calls are **separate billable/metered work**. A judge is not “free because it is safety.”

### Limitation / what not to infer
- LLM-as-Judge is Preview, not proof of objective correctness;
- a minimum score is only as good as its evaluator/dataset;
- publish-time policy does not replace runtime effect containment;
- UiPath units are not converted into Reese-max USD/token estimates.

### Reese-max action
Mapped to existing `Reese-max/prompt-autoresearch #3`; added a new external-evidence comment rather than creating a duplicate.

Recommended future receipt shape:

`PrimaryExecutionUsage + JudgeGuardrailUsage + InvalidRetryUsage + Cohort/Version + EvidenceStatus → Budget-aware evaluation decision`

Budget exhaustion remains `INCONCLUSIVE`, never a reason to lower the acceptance bar.

**Opportunity Score: 93/100 — existing Issue update, not new Issue.**

---

# New Releases / Recent Market Movement

1. **Mastra, 2026-08-25 → 2026-09-11:** Skill Search, token-cost control, token limiting, harness channels, computer use, sandbox lifecycle, remote filesystem, mounts, Factory Beta, filesystem search and filesystem skills arrived in rapid succession. Source: https://mastra.ai/blog . This is a strong `DO NOT COPY` signal for Reese-max: do not rebuild a generic agent platform surface in every product; prefer domain-specific canonical truth + narrow adapters into existing agent ecosystems.
2. **Atlassian, 2026-09-10:** governed agent loops package context, standards, execution, review and measurement as separate layers. Source above.
3. **UiPath, 2026-09-07/09:** LLM-as-Judge Preview plus Agent design policy GA. Source above.

---

# Community Pain Points

No fresh Reddit/Hacker News thread found in this run met the relevance + recency + source-quality threshold strongly enough to add a new product claim. This round therefore does **not manufacture a COMMUNITY_SIGNAL** to satisfy a quota.

The strongest negative evidence is instead first-party operational evidence from Mastra itself: unrestricted/full-auto progression can create review/infrastructure backpressure and amplify incorrect upstream assumptions into downstream PRs. That evidence is still scoped to Mastra’s environment and is not treated as a market failure rate.

---

# Adjacent Ideas

### 1. Transition-triggered Agent Work Lease
Use canonical workflow state as a trigger, but issue a bounded work lease rather than mutation authority.

`State transition → bounded agent task → candidate → review/promotion → receipt`

High transfer potential: `92-duty-scheduler`, `clinical-scribe-worker`, `note-filler`, `ppt-studio`, `project-doctor-web`, `autodev-ng`.

### 2. Separate Verification Resource Center
Do not hide judge/evaluator spend inside primary model spend.

`Generation/Execution → Verification/Judge → Retry/Recovery`

Each can have different budget, freshness and evidence semantics. Direct target now: `prompt-autoresearch #3`; future consumers: `skill-foundry`, `herdr-skills`, `autodev-ng`.

### 3. Review-pressure telemetry before more autonomy
Measure:
- candidate/PR queue age;
- human review latency;
- reviewer retry count;
- generated-but-closed/rejected ratio;
- WIP per owner/project;
- verification backlog versus worker backlog.

Do not invent an “attention scheduler” until current telemetry proves review is the limiting resource.

### 4. Embedded distribution beats another standalone Agent UI
Mastra and Atlassian both reinforce a broader distribution pattern: bring bounded Agent capability into GitHub/Jira/Slack/workflow surfaces rather than require users to maintain another independent task truth. For Reese-max, this supports narrow MCP/CLI/LINE/Discord/plugin integration around canonical product state instead of creating generic agent dashboards everywhere.

### 5. On-demand capability exposure
Mastra Skill Search and existing `academic-mcp #9` point in the same direction: keep the canonical capability catalog large if necessary, but expose only the working set relevant to the current task/context.

---

# Opportunity Scores

| Candidate | User Pain | Strategic Fit | Novelty | Evidence | Reuse | Effort control | Risk control | Score / action |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Separate Evaluation/Judge Cost Receipt | 9 | 10 | 8 | 10 | 10 | 9 | 9 | **93 — update `prompt-autoresearch #3`** |
| Transition-triggered Agent Work Lease | 9 | 10 | 8 | 10 | 10 | 8 | 8 | **90 — research list** |
| Review Pressure / WIP Backpressure telemetry | 9 | 10 | 7 | 9 | 9 | 9 | 9 | **90 — research list; measure first** |
| Stage-specific autonomy policy | 8 | 10 | 7 | 10 | 9 | 7 | 8 | **88 — no Issue; partly matched today** |
| Cross-product Agent Usage/Outcome dashboard | 7 | 8 | 6 | 9 | 9 | 6 | 8 | **80 — reject for now; risks observability sprawl** |

Scoring remains a portfolio heuristic, not a statistical forecast.

---

# Opportunity Map — 35 Product Repositories

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| `exam-archive` | exact official source/version | correction/freshness visibility | canonical evidence archive | archive→practice typed handoff | AI-filled missing source facts |
| `police-exam-practice` | reliable question/answer source | mastery + misconception review | police-exam-specific provenance | transition from weak topic→bounded review task | generic chatbot modes |
| `police-exam-archive` | official-source identity | revision/removal trail | audit-ready archive | source change→candidate downstream refresh | scrape-first opaque corpus |
| `92-duty-scheduler` | published roster truth | typed request/revision lifecycle | LINE self-service with receipts | status transition→candidate shift change | agent auto-changing published roster |
| `UkePack` | editable teacher output | deterministic print/export | MusicXML/chord→teaching artifact | teacher correction→versioned candidate template | black-box auto-curriculum |
| `ppt-studio` | native editable artifact | object-local patch + render verification | structured slide state | workflow transition/selection→candidate patch | whole-deck regeneration for tiny edits |
| `voice-actress` | rubric/source grounding | exact rubric + answer revision identity | criterion-level evidence | evidence conflict lane | unsupported scoring rationale |
| `taiwan-intel-dashboard` | source/date/freshness | change detection + provenance | official-first intelligence view | signal→attention queue | generic autonomous action layer |
| `autodev-ng` | exact task/execution/review receipts | measured review pressure and bounded stage policy | multi-engine evidence-first orchestration | stage work lease + WIP telemetry | new generic board/platform before reliability gate green |
| `flux-image-gen` | output/provenance receipt | cost + generation settings lineage | reproducible candidate history | human-selected candidate promotion | autonomous publishing |
| `claude-mem` | source-linked recall | temporal truth/stale state | memory evidence ≠ current authority | recall receipt + validity window | “remember more” as sole metric |
| `lobsterpulse` | source/date/dedupe | attention ranking + changed-since-last | decision queue rather than feed | review-pressure/attention-budget telemetry | engagement-driven endless feed |
| `prompt-autoresearch` | reproducible eval/holdout | variance + judge-cost + compaction evidence | autonomous improvement with hard gates | separate verification budget receipt | optimizing to one score / hidden cost |
| `neciken-summer-poem` | contest rule/source truth | revision freeze + provenance | creative candidate isolation | policy-change invalidation receipt | auto-submit without final human review |
| `note-filler` | canonical fields/evidence | stale-source and manual-edit preservation | claim-level candidate approval | source/state transition→candidate update | silent overwrite |
| `lplrs-judicial-sync` | authority revision truth | removal/correction semantics | legal-source spans + sync receipt | changed authority→bounded reindex candidate | evergreen assumption |
| `cyber-prep-coach` | official corpus/mastery | calibrated explanations/distractors | iPAS-specific study loop | weak-skill→bounded practice plan | offensive lab platform scope creep |
| `cf-ai-router` | truthful provider/model capability | cost/cache/fallback receipts | fail-closed unknown/billable routing | evaluator traffic as distinct class later | dynamic routing when cost unknowable pre-dispatch |
| `avatar-vfo` | persona/state consistency | continuity regression | structured simulation state | correction→candidate state rule | unlimited self-modifying persona memory |
| `project-doctor-web` | evidence-backed finding | candidate remediation + review | health diagnosis separated from mutation | state transition→bounded repair task | one-click broad fixes |
| `minideck` | editable/versioned artifact | publish-head verification | compact generation + rollback | object-level patch contract | flattened export as canonical truth |
| `chatgpt-dual-pipeline` | explicit stage/source lineage | deterministic handoff | complementary model roles | per-stage budget/verification receipt | duplicate canonical truth per model |
| `taichung-police-intel` | official-first source truth | freshness/dedupe | public-sector operational brief | attention queue / changed-since-last | autonomous government-side effects |
| `soundbox-offline` | reliable offline playback/library | full offline data plane | local-first operation | offline queue/state receipt | online UI with downloads as fake offline mode |
| `skill-foundry` | candidate/eval/promotion separation | runtime + package verification | evidence-backed skill promotion | evaluator cost as separate resource center | learned skill auto-activation |
| `video-timeline-pipeline` | evidence-to-timecode truth | target capability/read-back | CutSpec→native NLE handoff | stage lease for prepare/apply/review | building a full NLE |
| `ai-novel-workstation` | canonical story state | long-run continuity/resume | local-first fiction production | stage-scoped research/draft/revision | generic agent factory UI |
| `clinical-scribe-worker` | clinical source/section truth | manual-edit preservation + undo | scoped regeneration | note-state transition→candidate section patch | autonomous final clinical sign-off |
| `MaterialYouNewTab` | browser/local state reliability | runtime-channel compatibility | personal workspace surface | compatibility fixture per Chrome channel | cloud sync/auth breadth without need |
| `cf-mcp-server` | exact tool/effect contract | drift detection + reapproval | Cloudflare actions with explicit effect boundary | working-set exposure / contract receipt | server identity == permanent authority |
| `tick-stock-panel` | point-in-time data/backtest truth | deterministic StrategyDef | research-only safe strategy workstation | NL intent→reviewed deterministic spec | live brokerage execution because competitors do it |
| `herdr-skills` | correction→candidate separation | scoped/versioned promotion | reflective improvement with evidence | judge cost / evaluation receipt | immediate learning from one correction |
| `ninax-line-hermes` | message order/revision truth | redelivery/stale-answer handling | LINE-native bounded assistant | transition-triggered candidate reply/action | treating webhook delivery as exactly-once truth |
| `ai-flight-radar` | live-source fidelity before scheduler | reviewed durable WatchSpec | evidence-backed fare intelligence | intent→WatchSpec promotion (existing #4) | silent scheduled scraping without source calibration |
| `academic-mcp` | exact source/provider identity | progressive tool exposure | 81-tool research gateway with provenance | on-demand tool/skill working set | semantic tool substitution that changes requested source |

---

# Top 10 Cross-Portfolio Ideas

1. **Separate Execution / Judge / Recovery budgets** — `prompt-autoresearch`, `skill-foundry`, `herdr-skills`, `autodev-ng`. Existing #3 updated this round.
2. **Transition-triggered Work Lease** — use state changes to start bounded work without granting mutation authority.
3. **Review Pressure / WIP Backpressure telemetry** — measure human attention bottlenecks before increasing worker concurrency/autonomy.
4. **Candidate → explicit promotion as common mutation contract** — especially scheduling, clinical notes, forms, slide edits and workflow triage.
5. **On-demand capability working sets** — large canonical tool/skill catalog, small model-visible set; already concretely owned by `academic-mcp #9`.
6. **Tool-contract drift + reapproval** — existing `cf-mcp-server #15`; server identity is not current tool authority.
7. **Temporal truth for memory** — remembered evidence must be freshness/validity aware before injection; `claude-mem` remains high-value research but repo Issues are disabled.
8. **Structured artifact patch + render/read-back verification** — `ppt-studio`, `minideck`, `video-timeline-pipeline`, forms.
9. **Intent → reviewed durable watcher** — existing `ai-flight-radar #4`; transferable to intelligence alerts/subscriptions where source quality is verified first.
10. **Embedded capability distribution instead of standalone Agent UI** — prefer MCP/CLI/LINE/Discord/workflow adapters around canonical domain truth.

---

# Ideas Rejected / Deferred

### REJECT NOW — new generic “Stage Autonomy Board” in `autodev-ng`
Reason: already evaluated in the 2026-09-11 radar; current product has many of the necessary control boundaries, no own telemetry yet proves review pressure is the bottleneck, and `#13–#16` keep reliability red.

### REJECT NOW — one cross-portfolio Agent Usage Dashboard
Reason: risks central-observability sprawl and privacy/cost telemetry coupling. First establish product-level typed receipts; aggregate only when a concrete operational Job exists.

### REJECT NOW — a new “LLM Judge Billing Framework” Issue
Reason: duplicate/over-abstraction. `prompt-autoresearch #3` already owns budget-aware repeated evaluation; `cf-ai-router` already owns provider/cost truth. Update the existing evaluation receipt instead.

### REJECT NOW — rebuild Jira/Rovo/Mastra as a Reese-max platform
Reason: the portfolio advantage is domain-specific canonical truth + verification, not generic workflow SaaS breadth.

### DEFER — automatic stage advancement based only on model confidence/score
Reason: scores are evaluator-dependent and can drift. Require deterministic/hard gates where available and explicit UNKNOWN/INCONCLUSIVE semantics.

### DEFER — more production Agent autonomy in `autodev-ng`
Reason: open `#13–#16` reliability evidence remains the higher-priority constraint.

---

# Issue Mapping / Duplicate / Lock Coordination

| Signal / candidate | Canonical mapping | Action this round |
|---|---|---|
| UiPath separately metered LLM judge + publish policy | `Reese-max/prompt-autoresearch #3` | **Updated existing Issue with external evidence; no duplicate.** Prior lock was explicitly released/completed. |
| Mastra stage autonomy / review pressure | central radar research-list | No new Issue; prior 2026-09-11 radar intentionally deferred. |
| Atlassian transition/loop governance | cross-portfolio candidate/review pattern | Central radar only; no product-specific new gap proven. |
| Agent usage dashboard | none | Rejected/deferred; avoid premature central telemetry product. |
| On-demand skills/tool exposure | `academic-mcp #9` and existing product-specific work | No duplicate. |

No product implementation branch, merge or deploy was created. No active same-fingerprint `github-issue-lock:v1` was taken over.

---

# Sources

## CONFIRMED first-party / product documentation
1. **Mastra — Announcing Mastra Factory Beta — 2026-09-08**  
   https://mastra.ai/blog/announcing-mastra-factory-beta
2. **Mastra Factory product surface — checked 2026-09-14**  
   https://mastra.ai/factory
3. **Mastra Factory docs — checked 2026-09-14**  
   https://factory.mastra.ai/
4. **Mastra blog / recent product release sequence — checked 2026-09-14**  
   https://mastra.ai/blog
5. **Atlassian — We’re bringing governed agent loops to the AI-Native SDLC — 2026-09-10**  
   https://www.atlassian.com/blog/jira/governed-agent-loops
6. **Atlassian Jira workflows overview — checked 2026-09-14**  
   https://www.atlassian.com/software/jira/guides/workflows/overview
7. **Atlassian Jira triage agent — checked 2026-09-14**  
   https://support.atlassian.com/jira-software-cloud/docs/use-the-jira-triage-agent-to-categorize-and-route-work-items/
8. **UiPath Agents September 2026 release notes — 2026-09-07 / 2026-09-09**  
   https://docs.uipath.com/agents/automation-cloud/latest/release-notes/september-2026

## GitHub current-state / coordination
- `Reese-max/autodev-ng` README / current open issues (`#11`, `#12`, `#13–#17`, `#21`, `#28`) inspected through the connected GitHub surface.
- `Reese-max/prompt-autoresearch #3` current body/comments inspected; old issue-lock lease is explicitly released. New 2026-09-14 external-evidence comment added.
- Previous radar `docs/competitive-intelligence/2026-09-11-external-radar.md` re-read to avoid rediscovering Mastra Stage Autonomy as a “new” opportunity.
- Previous radar `docs/competitive-intelligence/2026-09-14-external-radar-r2.md` used as the immediate changed-since-last baseline.

---

# What Changed Since Last Radar (2026-09-14 r2 → r3)

1. **NEW high-value external signal:** UiPath now makes evaluation/guardrail calls an explicitly separate metered resource and combines this with publish-time constraints on score/tokens/iterations/HITL.
2. **NEW cross-vendor strategy confirmation:** Atlassian’s 2026-09-10 governed-agent-loop architecture separates context, execution, standards, review and measurement rather than treating “the Agent” as one permission blob.
3. **REVALIDATED, not rediscovered:** Mastra Factory’s stage-level manual/auto controls and review-backpressure lesson were already captured in the 2026-09-11 radar; this round did not create a duplicate Stage Autonomy Issue.
4. **GitHub action:** updated `prompt-autoresearch #3` with the new UiPath evidence and explicit `Primary Execution ≠ Judge ≠ Recovery` cost separation.
5. **No new product Issue** because no new fingerprint crossed the nonduplication + repository-gap threshold.
6. **No change to r2 decisions:** `ai-flight-radar #4` remains the canonical intent→WatchSpec opportunity; Plexamp offline-data-plane and Chrome two-week compatibility cadence remain research-list items.
7. **Portfolio direction refined:** autonomy policy should be modeled as a set of bounded stage/transition/cost/effect contracts, not one global autonomy slider.

---

## Portfolio Principle Added This Round

**`Triggered ≠ Authorized; Evaluated ≠ Free; Reviewed ≠ Promoted; Agent Connected ≠ Canonical State Changed.`**

The next useful Reese-max improvements should make these boundaries observable and testable before adding more autonomous throughput.
