# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-09 r3

## Executive Summary

This round re-used the 40-repository product→market baseline from `2026-09-09-external-radar-r2.md`, re-scanned recent Reese-max commits and current Issues/PRs, then researched the public web with GitHub deliberately kept as the **secondary/internal evidence source**.

**High-value new opportunity:** `Reese-max/92-duty-scheduler #20` — **PolicySpec / Rule Studio: convert unit scheduling rules into versioned, deterministic, previewable policies with conflict checks and explicit activation.** Opportunity Score: **94/100**.

The key market shift is not merely “AI chat for scheduling.” On **2026-09-04**, XShift announced an expanded Copilot + Autopilot workflow that can ingest pasted staffing plans, extract people/roles/availability/policies, show a confirmation surface, and enforce plain-English rules after validation. Current XShift product pages add `Check It`, rule conflict warnings, priority ordering and an Autopilot action log. Deputy’s current AI scheduling beta independently confirms a more conservative pattern: AI proposes schedule changes after reading existing constraints, but nothing is written until the authorized user confirms; its own docs explicitly warn about inaccurate/incomplete results and complex/large scheduling limits.

For Reese-max, the transferable principle is therefore:

`Human SOP / plain-language rule → CandidatePolicySpec → schema/reference/conflict validation → read-only shadow impact → explicit authorized activation → deterministic evaluator → exact policy version + decision receipt`

**Do not copy:** LLM-in-the-hot-path scheduling, uncontrolled autonomous call-out assignment, labor/payroll features unrelated to the product, or vendor marketing claims about time savings.

---

## Portfolio Discovery / Internal Change Scan

- Scope: **40 visible, unarchived Reese-max repositories** from the connected GitHub account.
- Previous central radar baseline: `docs/competitive-intelligence/2026-09-09-external-radar-r2.md`.
- Recent commit scan after the r2 radar found no broad product-implementation pivot requiring the market map to be rebuilt from scratch; the most visible post-r2 activity was audit/documentation work. `police-exam-practice` received product-board audit documentation rather than a new implementation capability.
- `92-duty-scheduler` current README still describes a semi-automatic scheduling product: Excel roster/timetable import → configure week/duty/exclusions → one-click scheduling → manual adjustment → Excel/LINE/history.
- `92-duty-scheduler/docs/CUSTOMIZATION.md` still requires non-default duty definitions to be encoded in `tenant.config.js.dutyDefs`; advanced weighting/fairness/conflict behavior requires direct edits to `public/app.js` (`isEligible()`, `getAvailable()`, `bucketShuffle()`, `autoSchedule()`).
- `92-duty-scheduler` code search confirms `isEligible()` is already documented as the shared eligibility check / single source of truth for scheduling filters — a strong foundation for a deterministic policy layer.
- Existing competitive Issue #19 owns the fingerprint **empty/conflicted slot → ranked minimal-impact repair plan**. It does **not** own rule authoring/validation/activation lifecycle.
- Open/closed Issue searches for `tenant.config`, `plain English`, PolicySpec-equivalent work and all-state PR search found no duplicate fingerprint before #20 was opened.
- Current 50-persona Round 3 audit keeps **P0 #14 reopened**: anonymous GET can mint a student-scoped credential for a supplied student ID and the POST path accepts that credential. Consequently, #20 is explicitly research/read-only until requester identity / write authorization is repaired and runtime-verified.
- Repository/global search for `github-issue-lock:v1` found only central coordination records, not a competing implementation lock for the #20 fingerprint.

---

# External Signals

## A — Direct competitor / recent product capability

### A1. CONFIRMED — XShift AI expanded Copilot + Autopilot — 2026-09-04

Sources:
- Release distribution dated 2026-09-04: https://natlawreview.com/press-releases/xshift-ai-expands-ai-copilot-and-autopilot-ai-native-employee-shift
- Current official Autopilot, rechecked 2026-09-09: https://www.xshift.ai/autopilot
- Current official Features, rechecked 2026-09-09: https://www.xshift.ai/features
- Current official Pricing, rechecked 2026-09-09: https://www.xshift.ai/pricing

**JTBD:** manager wants to encode operational rules once instead of remembering them every scheduling cycle, and wants to change multiple schedule facts without drilling through many UI forms.

**Workflow reduction:** the September release says “Set it up for me” can ingest a pasted team/staffing plan, extract people/jobs/locations/requirements/unavailability/policies, and show the result before creation. Current Autopilot lets operators state a rule in plain English, run `Check It`, detect name errors/conflicts, and then activate it.

**Onboarding/distribution signal:** no rip-and-replace requirement; official page explicitly markets importing a roster from spreadsheet/CSV and trying XShift alongside an existing tool. That pattern matters more than its chatbot surface.

**Automation/integration signal:** rule priority ordering, continuous enforcement, approval-mode choices, and action logs convert policy from “manager memory” into a first-class object.

**Pricing/business-model signal:** one current plan at $29/month + $1/active user with 21-day trial, all features included. This indicates the vendor considers AI/rule automation core product value rather than a premium module. It is **not evidence** that its claimed time savings are accurate.

**Limitations / evidence boundary:** the 2026-09-04 item is vendor-distributed press material; current product pages are first-party descriptions. They establish shipped/claimed workflow and commercial positioning, not independent effectiveness.

**What to absorb:** paste/import → normalized interpretation → conflict checks → explicit activation → audit log.

**What not to copy:** labor-budget/payroll assumptions, autonomous workforce actions inappropriate to school/police duty scheduling, or “AI always gets it right” framing.

### A2. CONFIRMED — Deputy AI schedule management beta — current 2026 documentation

Source: https://help.deputy.com/hc/en-au/articles/14862592379791-How-to-manage-your-Schedule-with-Deputy-AI-BETA

Deputy AI uses natural language to create/copy/update/delete/fill/replace/publish schedules, but the official docs say it first reviews availability, approved leave, training records, scheduling rules and location access, then proposes a plan. **Nothing updates until confirmation.** It also preserves permission boundaries: the AI cannot perform actions the user could not perform manually.

The same docs explicitly list weaknesses: inaccurate/incomplete/inconsistent responses; best results at roughly ≤150 shifts; multi-action prompts, long ranges, vague requests and complex scheduling logic may fail; it does not automatically optimize against some forecasting/cost goals.

**Transferable principle:** AI should be the authoring/proposal layer; policy truth and authorization remain deterministic and explicit.

---

## B — Adjacent workflow patterns that can migrate into Reese-max products

### B1. CONFIRMED — Reddit ModSandbox: test a rule before deployment — 2026

Source: https://developers.reddit.com/apps/modsandbox

ModSandbox’s workflow is effectively:

`paste AutoMod YAML → execute against recent examples → inspect what would have matched → deploy only after review`

**Transferable principle for 92-duty-scheduler:** a scheduling rule should support shadow impact before it becomes authoritative. “It parsed successfully” is not sufficient; show which assignments become invalid/eligible, whether a duty loses all candidates, and which constraints conflict.

### B2. CONFIRMED — Cedar separates policy validation from authorization runtime — current docs rechecked 2026-09-09

Source: https://docs.cedarpolicy.com/policies/validation.html

Cedar explicitly treats validation as a separate pre-use step, and notes that schema changes can make previously validated policy stale/invalid.

**Transferable principle:** `policy_schema_version`, validate-before-activate, and stale/review on schema change.

### B3. CONFIRMED — Open Policy Agent decision logs / signed bundles — current docs rechecked 2026-09-09

Sources:
- https://www.openpolicyagent.org/docs/management-decision-logs
- https://www.openpolicyagent.org/docs/management-bundles

OPA decision logs retain queried policy/input/bundle metadata and decision identity; policy bundles can be signed for integrity.

**Transferable principle:** schedule history should not only store final assignments; it should retain exact policy version/reason identity sufficient to explain and replay decisions.

---

## C — Emerging tools / technology enabling new product possibilities

### C1. CONFIRMED — Prose2Policy research — published 2026-03

Source: https://machinelearning.apple.com/research/prose2policy

Apple ML Research’s Prose2Policy converts natural-language policy into executable Rego through detection, component extraction, schema validation, lint/compile, test generation and execution.

**Transferable principle:** use the LLM at build/authoring time to synthesize a candidate, then require deterministic compile/validation/tests. Do not make the LLM the runtime decision engine.

### C2. LIKELY / EMERGING DESIGN SIGNAL — natural-language → deterministic contracts

Sources:
- https://sponsio.dev/
- https://aethis.ai/

Sponsio and Aethis currently market the same broad architecture: policy is authored/compiled with AI assistance, then runtime decisions use deterministic state machines/constraint logic with no LLM hot-path call. These are product/vendor claims rather than independent proof, so this round uses them only as **design-direction signals**.

### C3. CONFIRMED — NVIDIA PAIR — 2026-09-03

Sources:
- NVIDIA technical blog, 2026-09-03: https://developer.nvidia.com/blog/nvidia-pair-virtual-inference-router-expands-available-compute-on-your-local-network/
- NVIDIA product page / docs: https://www.nvidia.com/it-it/ai-on-rtx/personal-ai-router/

PAIR exposes Ollama/OpenAI-compatible local endpoints and routes independent inference requests across paired Windows/Linux/macOS systems with secure pairing/mTLS and load-aware routing. It does **not** pool VRAM or split one inference request across machines.

**Portfolio implication:** `cf-ai-router`, `autodev-ng`, `herdr-skills`, `ai-novel-workstation` and local-first agent workflows can eventually treat “local compute pool” as another provider class. No issue was created this round because provider abstraction / runtime routing ownership must first be checked per repository; PAIR is a research signal, not a reason to add a second router blindly.

### C4. CONFIRMED — Nowledge Mem 0.10.78 / upcoming 0.10.80 — 2026-09-05 onward

Source: https://mem.nowledge.co/es/changelog

Recent Mem releases emphasize setup using subscriptions users already pay for, verified tool connection, conversation sync health + last successful sync, attachment-preserving imports, retry-safe mobile sharing, and an upcoming “Pick Up Where You Left Off” capability that resumes coding sessions in their original tool.

**Portfolio implication:** memory products should surface **sync/connection health and origin-tool resume identity**, not merely store more history. Because `claude-mem` is upstream-derived and `adng-memory` explicitly says it is an operational store rather than a product writer, no new Issue was opened without a clearer ownership boundary.

### C5. CONFIRMED — Oracle Clinical AI Agent expanded workflow — 2026-08-19

Source: https://www.oracle.com/news/announcement/oracle-health-expands-clinical-ai-agent-with-coding-dictation-chart-review-2026-08-19/

Oracle added coding, clinician-controlled dictation and chart review; clinicians review/confirm coding suggestions and remain responsible for editing/signing documentation.

A current Ambient Scribe product/App Store workflow also packages audio, photos, document scans, video, team sharing and EHR handoff around an encounter clipboard:
- https://www.ambient-scribe.com/
- https://apps.apple.com/tw/app/ambient-scribe/id6499293312

**Portfolio implication:** `clinical-scribe-worker` has a credible adjacent path toward a provenance-preserving encounter artifact container rather than “more autonomous diagnosis.” However, current repo P0 reviewer-identity/security work and #4 specialty validation are higher priority; no new Issue was opened in this round.

---

# New Releases

| Date | Product / ecosystem | Signal | Evidence class | Reese-max relevance |
|---|---|---|---|---|
| 2026-09-04 | XShift AI | Copilot edits existing shifts + multi-step actions; pasted-text setup; Autopilot plain-language policy enforcement | CONFIRMED capability / vendor source; effectiveness unverified | Direct gap for 92-duty-scheduler onboarding/rule lifecycle |
| current, rechecked 2026-09-09 | Deputy AI scheduling beta | NL schedule changes gated by existing rules, permissions and explicit confirmation; documented complexity limits | CONFIRMED official docs | Strong anti-pattern guardrail: AI proposes, deterministic product owns authority |
| 2026-09-05 | Nowledge Mem 0.10.78 | provider/subscription-first setup, verified connector, attachment-preserving imports | CONFIRMED changelog | Memory/onboarding/sync-health pattern |
| upcoming after 2026-09-05 | Nowledge Mem 0.10.80 | original-tool session resume + sync-health/last-success state | CONFIRMED roadmap/changelog, not yet treated as shipped | Cross-agent continuity research |
| 2026-09-03 | NVIDIA PAIR beta | local multi-device inference routing via compatible local endpoints | CONFIRMED NVIDIA | New provider topology for local-first agent portfolio |
| 2026-08-19 | Oracle Clinical AI Agent | coding + dictation + chart review with clinician confirmation | CONFIRMED Oracle | clinical-scribe adjacent workflow; no autonomy expansion |

---

# Community Pain Points

Community sources are **anecdotal evidence only**.

1. `COMMUNITY_SIGNAL` — 2026-08-18 r/managers: a seven-person 24/7 schedule already combines weekday/weekend rotations, solo-work qualification limits and different shift patterns. This demonstrates combinatorial operator burden, not a statistical prevalence rate.
   - https://www.reddit.com/r/managers/comments/1vs22mz/making_a_schedule_for_my_employees_feels_like/
2. `COMMUNITY_SIGNAL` — 2026-07-23 r/managers: an ~80-person team changes policy during holiday periods and discusses manager-assigned vs shift-bidding rules. This supports policy-lifecycle/seasonality as a design problem, not a claim about market size.
   - https://www.reddit.com/r/managers/comments/1v498fj/those_managing_workforce_scheduling_what_policies/
3. `COMMUNITY_SIGNAL` — 2026-08-29 r/smallbusiness: users still ask when Sheets/Calendar become operationally painful. This supports migration/onboarding from existing artifacts rather than forcing blank-slate setup.
   - https://www.reddit.com/r/smallbusiness/comments/1w1k9c4/when_did_google_sheets_stop_being_enough_for_your/

---

# Adjacent Ideas

1. **Policy Shadow Mode** — borrow from rule-testing/moderation systems: replay a proposed rule against recent/synthetic schedule facts before activation.
2. **Version-bound Decision Receipt** — every schedule/repair result knows exact policy set + reason code, analogous to policy decision logs.
3. **Schema Drift Gate** — changing supported rule semantics invalidates older policy validation.
4. **Origin-preserving Session Resume** — use exact tool/session identity when reopening agent work, inspired by Mem; do not reconstruct from lossy summaries alone.
5. **Local Compute Pool Provider** — PAIR-like endpoint can become a provider behind existing routers, not a new orchestration layer.
6. **Encounter Clipboard** — multimodal clinical artifacts remain grouped around one encounter and feed reviewed output; do not expand clinical autonomy.

---

# Opportunity Map — 40-repository portfolio

Legend: **MUST MATCH / SHOULD BE BETTER / DIFFERENTIATOR / ADJACENT IDEA / DO NOT COPY**. Repositories whose own README defines them as infrastructure/non-product are recorded but not force-fit into feature quotas.

| Repository | Market category | Opportunity Map (current round) |
|---|---|---|
| gemini-deidentifier | AI RPG / interactive world | MUST: persistent consequence truth; BETTER: deterministic replay; DIFF: auditable world-state ledger; ADJ: policy/receipt model; DNC: LLM as canonical state |
| exam-archive | exam archive / study | MUST: trustworthy source indexing; BETTER: handoff into active practice; DIFF: provenance; ADJ: external AI source surface; DNC: duplicate active practice product |
| police-exam-practice | police exam practice / legacy parallel surface | MUST: preserve access if still used; BETTER: migrate to canonical archive; DIFF: none until divergence resolved; ADJ: shared attempt schema; DNC: separate learner truth |
| police-exam-archive | official-question exam study | MUST: source traceability + attempts; BETTER: deadline-aware review; DIFF: official-question evidence ledger; ADJ: external AI connector over canonical data; DNC: generic AI-generated question flood |
| 92-duty-scheduler | school/police/shift scheduling | MUST: deterministic constraints + auth; BETTER: rule authoring without JS; DIFF: PolicySpec + shadow preview + reason receipt; ADJ: AI candidate compiler; DNC: black-box/autonomous personnel decisions |
| openab | remote ACP coding-agent control plane | MUST: capability-scoped permissions; BETTER: Discord human approval receipts; DIFF: exact ACP action broker; ADJ: policy-as-code compiler; DNC: trust-all-tools |
| UkePack | music / ukulele learning | MUST: usable practice core; BETTER: in-flow tools; DIFF: guided local practice; ADJ: integrated tuner/metronome; DNC: unrelated full LMS sprawl |
| ppt-studio | AI presentation production | MUST: source-grounded deck creation; BETTER: source-in-place import; DIFF: provenance/evidence; ADJ: Slack/file-to-deck; DNC: opaque content generation |
| book5-windows-server-2022 | technical courseware | MUST: version/lifecycle truth; BETTER: 2022↔2025 delta; DIFF: claim-level applicability; ADJ: source drift monitor; DNC: blanket 2025 rewrite |
| obsidian-vault | knowledge / notes workspace | MUST: durable local knowledge; BETTER: origin/sync status; DIFF: provenance-first notes; ADJ: session resume links; DNC: forced cloud account |
| voice-actress | exam essay grading / feedback | MUST: rubric correctness; BETTER: evidence-linked feedback; DIFF: answer-span + law/source verification lifecycle; ADJ: stale evidence invalidation; DNC: unsupported authoritative grading |
| taiwan-intel-dashboard | intelligence monitoring dashboard | MUST: source freshness; BETTER: cross-source reconciliation; DIFF: provenance receipts; ADJ: policy/claim drift; DNC: community rumor as fact |
| autodev-ng | multi-agent automation/orchestration | MUST: safe execution boundaries; BETTER: STEER vs QUEUE; DIFF: exact execution receipts; ADJ: PAIR/local compute provider; DNC: unbounded remote control |
| flux-image-gen | AI image generation/edit | MUST: generation/edit usability; BETTER: provenance preservation; DIFF: verifiable receipt (#18 already owns); ADJ: local compute backends; DNC: badge-as-truth |
| claude-mem | persistent agent memory / upstream-derived | MUST: continuity + privacy; BETTER: sync health/origin resume; DIFF: only if Reese-max owns delta; ADJ: Mem connection-health model; DNC: fork feature race without ownership |
| lobsterpulse | AI provider observability | MUST: provider metrics; BETTER: cross-provider traces; DIFF: reusable runtime evidence; ADJ: local-provider/PAIR metrics; DNC: duplicate OTel work already tracked |
| prompt-autoresearch | prompt optimization / research | MUST: reproducible evals; BETTER: experiment receipts; DIFF: promote only evidence-backed candidates; ADJ: policy candidate testing; DNC: auto-promote on one score |
| neciken-summer-poem | AI writing / contest workflow | MUST: submission rule truth; BETTER: pre-submit revalidation; DIFF: rule-drift receipt; ADJ: PolicySpec schema pattern; DNC: assume old contest rules still valid |
| note-filler | document / note automation | MUST: source fidelity; BETTER: evidence-linked fields; DIFF: field-level provenance; ADJ: encounter/clipboard-style artifact grouping; DNC: silent unsupported completion |
| gooaye | project automation / app workflow | MUST: preserve existing authoritative state; BETTER: explicit workflow receipts; DIFF: TBD after stronger external category match; ADJ: policy/approval primitives; DNC: quota-driven feature additions |
| lplrs-judicial-sync | judicial/legal data sync | MUST: authoritative source + freshness; BETTER: drift/reconciliation; DIFF: source-version receipt; ADJ: rule/version lifecycle; DNC: stale legal text as current truth |
| adng-memory | operational patrol state store (README says non-product) | MUST: ownership/recovery contract; BETTER: health evidence; DIFF: operational provenance; ADJ: sync-health vocabulary; DNC: product-feature expansion inside evidence store |
| cyber-prep-coach | cybersecurity learning coach | MUST: learner state; BETTER: mastery/next-best action; DIFF: evidence-grounded coaching; ADJ: shared attempt ledger; DNC: second incompatible learner model |
| cf-ai-router | AI provider/router | MUST: capability routing; BETTER: runtime/provider health; DIFF: evidence-aware routing; ADJ: PAIR as optional local provider; DNC: another orchestration plane |
| avatar-vfo | AI avatar / companion workspace | MUST: identity/privacy; BETTER: editable bounded memory; DIFF: user-visible memory provenance; ADJ: origin/sync health; DNC: hidden unlimited memory |
| project-doctor-web | project audit / diagnostics | MUST: actionable diagnostics; BETTER: evidence-linked fixes; DIFF: cross-project quality receipt; ADJ: policy shadow tests; DNC: score-only “health” without evidence |
| minideck | presentation / deck creation | MUST: published-head correctness; BETTER: preview/publish lifecycle; DIFF: draft vs authoritative published version; ADJ: source-in-place generation; DNC: current draft auto-public |
| chatgpt-dual-pipeline | dual-model/agent pipeline | MUST: stage identity; BETTER: handoff receipts; DIFF: disagreement/evidence routing; ADJ: local provider pool; DNC: hidden model substitution |
| internship-notes-sites-mirror | internship notes / publishing | MUST: faithful source presentation; BETTER: versioned updates; DIFF: educational structure; ADJ: source-drift verification; DNC: unnecessary AI rewrite layers |
| taichung-police-intel | local public-sector intelligence monitoring | MUST: current official sources; BETTER: duplicate/revision detection; DIFF: source-evidence timeline; ADJ: claim drift lifecycle; DNC: anecdote as confirmed intelligence |
| soundbox-offline | offline audio/soundboard | MUST: reliable offline playback; BETTER: fast local UX; DIFF: privacy/no-network; ADJ: local-first distribution; DNC: cloud dependency without clear value |
| skill-foundry | agent skill evaluation/promotion | MUST: exact artifact + quality/security gates; BETTER: package security attestation; DIFF: separated certification dimensions; ADJ: policy compiler for declared capabilities; DNC: hash=security assumption |
| video-timeline-pipeline | video understanding/timeline | MUST: deterministic baseline evidence; BETTER: bounded local escalation; DIFF: selection manifests/receipts; ADJ: local inference pool; DNC: agentic mode for every query |
| ai-novel-workstation | long-form AI writing | MUST: resumable production; BETTER: cost envelope; DIFF: budget/provenance receipts; ADJ: local inference pool; DNC: unbounded model loops |
| clinical-scribe-worker | clinical documentation / AI | MUST: auth, clinician review, validation; BETTER: specialty/evidence scope; DIFF: safety receipts; ADJ: encounter clipboard; DNC: autonomous medical action |
| MaterialYouNewTab | browser new-tab / productivity | MUST: local-first fast UX; BETTER: permission-minimal capture; DIFF: opt-in collaboration without account-first migration; ADJ: current-page → task/scratchpad; DNC: broad browsing permissions by default |
| cf-mcp-server | Cloudflare operations MCP | MUST: exact-target confirmation; BETTER: staged rollout/health evidence; DIFF: deployment receipts; ADJ: policy-bound capabilities; DNC: unbounded admin automation |
| tick-stock-panel | market/stock panel | MUST: source/time freshness; BETTER: data provenance/latency state; DIFF: clear stale/market-state UX; ADJ: alert receipts; DNC: unsupported investment claims |
| herdr-skills | multi-agent workflow/skills | MUST: predictable routing; BETTER: capability/approval declarations; DIFF: reusable council/route primitives; ADJ: local compute provider; DNC: marketplace sprawl without certification |
| ninax-line-hermes | messaging ↔ agent bridge | MUST: message/action identity; BETTER: revision + approval safety; DIFF: bounded messaging control plane; ADJ: policy capability broker; DNC: silent external-send automation |

---

# Opportunity Score — new candidates

## 1. 92-duty-scheduler PolicySpec / Rule Studio — **94/100 — FILED as #20**

- User Pain: 9/10
- Strategic Fit: 10/10
- Novelty: 9/10
- Evidence Strength: 9/10
- Reuse Potential: 10/10
- Implementation Effort: 6/10 (moderate; MVP can wrap existing semantics)
- Security/Privacy/Cost Risk: 6/10 (requires #14 gating; AI adapter optional)

Why it clears the issue threshold: current repo evidence shows manual JS configuration; two direct competitor signals independently validate natural-language scheduling surfaces but also expose confirmation/complexity constraints; adjacent policy systems provide a safer deterministic architecture; #19 does not duplicate the lifecycle.

## 2. `cf-ai-router` / agent portfolio — PAIR-compatible local provider — 86/100 — RESEARCH LIST ONLY

High reuse and fresh 2026-09-03 signal, but first confirm existing provider/router abstractions and whether adding PAIR would be a simple backend adapter or duplicate router. No Issue this round.

## 3. `clinical-scribe-worker` encounter clipboard — 84/100 — RESEARCH LIST ONLY

Strong external workflow evidence (Oracle + Ambient Scribe), but current P0 reviewer identity/security and #4 specialty validation should be resolved before adding multimodal PHI surfaces. No Issue.

## 4. memory products: sync health + exact origin-tool resume — 83/100 — RESEARCH LIST ONLY

Fresh Nowledge Mem signal. Ownership boundary is unclear because `claude-mem` is upstream-derived and `adng-memory` explicitly has no writer implementation. No Issue.

---

# Top 10 Cross-Portfolio Ideas

1. **Candidate → Validate → Preview → Explicit Activate → Receipt** as a generic lifecycle for rules, prompts, skills, deployments and schedules.
2. **Policy/Rule version identity** stored with every authoritative outcome; no “current config” reconstruction after the fact.
3. **Shadow impact testing** before changing a live workflow, inspired by ModSandbox.
4. **Reason-coded deterministic decisions** instead of boolean-only eligibility; enables repair, audit and UI explanation from one truth source.
5. **Schema drift invalidation**: previously valid rules/claims become STALE when their semantic schema changes.
6. **Natural language as authoring, not authority**: LLM produces candidate structured policy; deterministic system owns action semantics.
7. **Permission parity**: AI cannot do an action the authenticated human could not do directly — transferable from Deputy/OpenAB work.
8. **Local compute as provider topology**: PAIR-like routers sit behind existing provider interfaces rather than replacing orchestration.
9. **Sync/connection health as first-class state** for memory/connectors, including last successful sync and exact origin resume.
10. **Artifact container before autonomy** in clinical/document workflows: group source artifacts + provenance + reviewed output before adding autonomous actions.

---

# Ideas Rejected / Deferred

1. **92-duty-scheduler: copy XShift full Autopilot / automatic call-out handling** — REJECTED for now. Wrong domain assumptions and current #14 P0 authorization boundary make automatic personnel mutation unsafe.
2. **92-duty-scheduler: LLM evaluates eligibility directly** — REJECTED. Violates deterministic/replayable scheduling truth and makes disagreements impossible to audit.
3. **92-duty-scheduler: add payroll/labor-cost modules because competitors have them** — REJECTED. Weak strategic fit for school/police duty use.
4. **clinical-scribe-worker multimodal upload Issue** — DEFERRED. New PHI surfaces should not outrun current security/validation priorities.
5. **flux-image-gen C2PA/provenance new Issue** — REJECTED AS DUPLICATE. Existing #18 already owns this fingerprint.
6. **claude-mem “copy Nowledge Mem” Issue** — DEFERRED. Upstream-derived ownership needs clarity; avoid maintaining fork-only product surface without strategy.
7. **adng-memory session-resume feature** — REJECTED AS WRONG REPO. Its README says it is an operational state store with no writer implementation.
8. **PAIR integration immediately across every agent repo** — REJECTED. One router/provider adapter should own it; do not duplicate infrastructure.
9. **Generic “AI copilot” for every product** — REJECTED. This round’s evidence favors bounded candidate/preview/approval mechanics, not chat UI proliferation.
10. **Any quota-driven feature count** — REJECTED. Only #20 cleared evidence + fit + duplicate threshold.

---

# Issue Mapping / Coordination

| Repository | Existing / new issue | Relationship | Action this round |
|---|---|---|---|
| 92-duty-scheduler | #20 PolicySpec / Rule Studio | New unique fingerprint | **CREATED** |
| 92-duty-scheduler | #19 minimal-impact RepairPlan | Consumer of future shared reason/evaluator; not duplicate | Read only |
| 92-duty-scheduler | #14 P0 student timetable authorization | Hard dependency before any new rule activation/write surface | Read only; #20 explicitly gated |
| flux-image-gen | #18 provenance/C2PA | Owns fresh Adobe provenance signals | No duplicate |
| clinical-scribe-worker | #4 specialty validation | Higher-priority safety/evidence foundation | No new feature issue |
| openab | r2 permission-broker opportunity | Issues disabled / central-radar-only direction | No settings change |
| skill-foundry | #3 package security attestation | Existing package-security owner | No duplicate |
| cf-mcp-server | #8 gradual deployment | Existing staged promotion owner | No duplicate |
| autodev-ng | #11 STEER vs QUEUE | Existing control-plane owner | No duplicate |

`github-issue-lock:v1`: no matching implementation lock was found for the new #20 fingerprint. This radar did not create an implementation branch, merge, deploy, change secrets/permissions/repository settings, or claim a code implementation lock.

---

# Sources

## Direct scheduling / workforce products
- **2026-09-04** — XShift AI release distribution: https://natlawreview.com/press-releases/xshift-ai-expands-ai-copilot-and-autopilot-ai-native-employee-shift
- **rechecked 2026-09-09** — XShift Autopilot: https://www.xshift.ai/autopilot
- **rechecked 2026-09-09** — XShift Features: https://www.xshift.ai/features
- **rechecked 2026-09-09** — XShift Pricing: https://www.xshift.ai/pricing
- **current 2026 beta, rechecked 2026-09-09** — Deputy AI scheduling docs: https://help.deputy.com/hc/en-au/articles/14862592379791-How-to-manage-your-Schedule-with-Deputy-AI-BETA
- **2026-09 current changelog** — Deputy What’s New: https://whatsnew.deputy.com/date/2026/9

## Adjacent policy / rule systems
- **2026** — Reddit ModSandbox: https://developers.reddit.com/apps/modsandbox
- **current docs, rechecked 2026-09-09** — Cedar validation: https://docs.cedarpolicy.com/policies/validation.html
- **current docs, rechecked 2026-09-09** — OPA decision logs: https://www.openpolicyagent.org/docs/management-decision-logs
- **current docs, rechecked 2026-09-09** — OPA bundles/signing: https://www.openpolicyagent.org/docs/management-bundles
- **2026-03** — Apple ML Research / Prose2Policy: https://machinelearning.apple.com/research/prose2policy
- **current early/emerging product signal** — Sponsio: https://sponsio.dev/
- **current early-access/emerging product signal** — Aethis: https://aethis.ai/

## New tooling / adjacent product releases
- **2026-09-03** — NVIDIA PAIR technical blog: https://developer.nvidia.com/blog/nvidia-pair-virtual-inference-router-expands-available-compute-on-your-local-network/
- **current** — NVIDIA PAIR product page: https://www.nvidia.com/it-it/ai-on-rtx/personal-ai-router/
- **2026-09-05 latest release + next release notes** — Nowledge Mem changelog: https://mem.nowledge.co/es/changelog
- **2026-08-19** — Oracle Health Clinical AI Agent: https://www.oracle.com/news/announcement/oracle-health-expands-clinical-ai-agent-with-coding-dictation-chart-review-2026-08-19/
- **current** — Ambient Scribe: https://www.ambient-scribe.com/
- **2026-07 App Store listing/update surfaced in current search** — Ambient Scribe iOS: https://apps.apple.com/tw/app/ambient-scribe/id6499293312

## Community signals — anecdotal only
- **2026-08-18** — r/managers scheduling constraints: https://www.reddit.com/r/managers/comments/1vs22mz/making_a_schedule_for_my_employees_feels_like/
- **2026-07-23** — r/managers shift-bidding policies: https://www.reddit.com/r/managers/comments/1v498fj/those_managing_workforce_scheduling_what_policies/
- **2026-08-29** — r/smallbusiness Sheets/Calendar workflow friction: https://www.reddit.com/r/smallbusiness/comments/1w1k9c4/when_did_google_sheets_stop_being_enough_for_your/

---

# What Changed Since Last Radar (r2)

1. **New high-value portfolio opportunity discovered and filed:** `92-duty-scheduler #20` PolicySpec / Rule Studio, Score 94/100.
2. **New direct competitor evidence:** XShift’s 2026-09-04 release makes pasted-text onboarding + plain-English persistent rules + conflict checks + confirmation/action logs a current scheduling-market capability, not a speculative concept.
3. **Independent direct-competitor constraint:** Deputy AI’s current beta documentation explicitly preserves existing rules/permissions and human confirmation and documents complexity/scale limits. This materially changes the safe interpretation of the market signal: **copy the authoring/preview workflow, not LLM authority.**
4. **New adjacent architecture:** ModSandbox + Cedar/OPA + Prose2Policy converge on validate/test/version/decision-evidence before rule activation.
5. **New emerging provider topology:** NVIDIA PAIR (2026-09-03) creates a credible local multi-device provider class, but no repo-specific issue yet.
6. **Fresh memory signal:** Nowledge Mem’s 2026-09-05+ releases emphasize verified connector setup, sync health and exact origin-tool resume; held as research because Reese-max ownership boundaries differ across memory repos.
7. **Fresh clinical workflow signal:** Oracle’s 2026-08-19 coding/dictation/chart-review expansion and multimodal clipboard patterns were recorded, but did not outrank existing `clinical-scribe-worker` safety/validation work.
8. **No feature quota:** C2PA, clinical multimodal, PAIR-everywhere, memory-fork features and generic AI copilot ideas were explicitly rejected/deferred rather than filed.

## New Cross-Portfolio Principle

> **Natural language is a convenient way to express intent; it should not silently become authority.**
>
> The stronger reusable product pattern is: **intent → typed candidate → deterministic validation → impact preview → authorized promotion → exact-version enforcement → receipt.**
