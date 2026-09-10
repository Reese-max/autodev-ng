# External Competitive / Product / Workflow Inspiration Radar — 2026-09-11

> Scope: Reese-max owned, unarchived repositories that are product-like. This round uses the public web as the primary market evidence source. GitHub is used for current portfolio mapping, recent-change checks, duplicate/fingerprint checks, coordination, and the central report only.
>
> Evidence labels: **CONFIRMED** = first-party product/docs/release information or directly inspectable current repository state; **LIKELY** = reasonable inference that still needs runtime/user validation; **COMMUNITY_SIGNAL** = anecdotal user report only; **UNKNOWN** = insufficient evidence or outcome must be measured.
>
> Safety / execution boundary: no product source code, implementation branch, merge, deploy, secrets, permissions, firewall, repository settings, or production runtime configuration were changed in this round.

---

## Executive Summary

This round found a **major competitor strategy signal** rather than a new standalone feature fingerprint.

### Major update mapped to an existing Issue

**Meta Muse (2026-09-08)** now ships a consumer-agent architecture with a dedicated Secure VM, a separate Sentinel agent, secretless credential use, per-connected-app capability scope (for example email read vs send), pre-effect confirmation for sensitive actions, and a planned/performed audit trail.

That is strong external confirmation of the exact direction already owned by:

- `Reese-max/autodev-ng #12` — `[Competitive Inspiration][RESEARCH_REQUIRED][SECURITY] 建立跨引擎 Egress Policy / External-Effect Firewall`
- Existing Opportunity Score: **96/100**
- This round action: **updated the existing Issue with the Muse signal; no duplicate Issue created.**

The important transferable principle is not “copy Sentinel.” It is:

`Task Intent → Connector Capability Scope → ExternalEffectSpec → Secretless Credential Handle → Independent Effect Decision → Runtime Enforcement → Planned-vs-Actual Effect Receipt`

Meta’s own product claims are not treated as proof that its protections are effective. Reuters independently reported the launch and also reported internal security/reliability problems and prior launch delay, which reinforces the need for exact runtime evidence rather than security marketing.

### Direct competitor: software factories are discovering review/backpressure is the limiting resource

**Mastra Factory Beta (2026-09-08)** is a direct `autodev-ng` competitor signal. It exposes configurable `Intake → Triage → Planning → Build → Review → Done` stages, with each stage independently manual or automatic. More important than the feature list, Mastra says it originally ran “full automatic” and moved away from it after backlog imports became bursty, caused infrastructure problems, and created too much difficult-to-review work.

That is a strong product lesson for Reese-max: **agent throughput must be bounded by review/attention capacity, not only compute/concurrency capacity.** However, `autodev-ng` already has one-Issue-per-owner-run intake, project/account locking, concurrency caps, cost caps, separate reviewer/CI, human merge, and layered candidate→merged→human-accepted completion. Therefore a new Stage Autonomy Issue would currently be premature and partly duplicative. Keep `Review Pressure / WIP Backpressure` as a research candidate until repository telemetry shows real queue pressure.

### Emerging evaluation pattern: aggregate pass-rate is not enough for agent systems

Red Hat’s 2026-09-03 EvalHub + IBM CLEAR workflow evaluates full traces and clusters recurring failures by frequency, severity, and origin; SPARC can score tool calls separately from reasoning. Red Hat AI 3.5 (announced 2026-09-09) also pushes trace observability, token metering, validated tool-calling models, controlled model rollout, and sandboxed agent templates into the platform layer.

The transferable opportunity is **Trace Failure Clustering** across `autodev-ng`, `skill-foundry`, `herdr-skills`, and `prompt-autoresearch`: not another generic LLM judge, but `exact trace → typed failure → recurrence cluster → evidence-backed candidate improvement`. This overlaps existing reflection/evaluation work, so it remains research-list rather than a new Issue.

### Domain reinforcement: evidence-linked grading remains the right `voice-actress` direction

Current GradeWithAI and CorpusKey product surfaces reinforce criterion-level/line-level evidence, rubric-based grading, review/edit before publication, LMS handoff, and explicit retention controls. This maps cleanly to existing `voice-actress #6` (criterion → exact student-answer evidence + legal-source provenance), so no duplicate was created. A smaller design refinement to remember for #6 is **rubric revision identity**: answer evidence should be tied not only to `answer_revision`, but also the exact rubric/version used to score it.

---

## Portfolio → Market Category / Recent Change Check

The current product-like scope remains **35 unarchived Reese-max repositories**.

| Repository | Market / product category | Current-state / recent-change signal used this round |
|---|---|---|
| `cf-ai-router` | Multi-provider AI gateway / routing | Model lifecycle/fallback/cost constraints remain the primary competitive lens; no new post-r8 product shift found. |
| `soundbox-offline` | Local-first offline audio PWA | Existing import/local-library workflow remains; Share Target still research-only due platform coverage. |
| `police-exam-archive` | Police exam archive / source corpus | Authority/version integrity + archive→practice handoff remain core. |
| `skill-foundry` | Agent skill evaluation / promotion | Candidate-vs-active, risk-tier validation, behavior receipts; trace-cluster eval is adjacent. |
| `prompt-autoresearch` | Prompt/model experiment research | Reproducible eval, held-out evidence, cost and model behavior drift. |
| `lobsterpulse` | Product / market signal intelligence | Freshness/source/date/dedupe/changed-since-last remain moat. |
| `tick-stock-panel` | Self-hosted quantitative research workstation | Research/backtest/monitoring only; no broker execution. |
| `clinical-scribe-worker` | Clinical drafting / scribe research worker | r8 #7 owns minimal section repair/revision; no new production mutation until auth blocker resolved. |
| `adng-memory` | Agent memory governance | Origin/admission/quarantine/staleness/deletion/poisoning remains core. |
| `avatar-vfo` | Persona / character simulation | Continuity regression and structured-state value validation remain core. |
| `note-filler` | Evidence-backed note augmentation | Claim-level candidate/approval/staleness already owned. |
| `taiwan-intel-dashboard` | Public-source Taiwan intelligence dashboard | Recent change was primarily source/data refresh, not a new product workflow. |
| `cyber-prep-coach` | iPAS cybersecurity exam preparation | Trusted corpus/mastery/explanation calibration before more tutor surface. |
| `UkePack` | Ukulele / music education worksheet generator | Teacher-reviewed MusicXML/chord→practice-pack flow. |
| `autodev-ng` | Multi-engine software-development orchestrator | Current direct market comparison: Mastra Factory. Current repo also has open #13 Windows full-regression CI failure; do not treat default branch as fully green. |
| `ai-novel-workstation` | Local-first AI fiction production workstation | Canonical story state / long-form continuity / cost and resumability. |
| `herdr-skills` | Reflective coding-agent rule/skill system | #6 owns correction→candidate improvement. Trace failure clustering is adjacent. |
| `video-timeline-pipeline` | Evidence-backed video understanding/editing handoff | #11 owns CutSpec/NLE handoff; no destructive autonomous editing. |
| `chatgpt-dual-pipeline` | De-identified internship-notes publishing surface | Historical slug; canonical notes should remain one-way source. |
| `claude-mem` | Coding-agent memory | Memory provenance/authority/poisoning boundaries matter more than raw recall. |
| `lplrs-judicial-sync` | Taiwan judicial corpus sync | Exact authority revision/removal/source spans. |
| `internship-notes-sites-mirror` | Static downstream mirror | Reproducible one-way mirror, not editorial authority. |
| `MaterialYouNewTab` | Browser new-tab / workspace dashboard | Session snapshot/preview/restore remains opportunity; Issues are disabled in repo. |
| `taichung-police-intel` | Public-source local-government/police intelligence | Official-first evidence + read-only distribution. Recent commit is data refresh, not product redesign. |
| `ninax-line-hermes` | LINE AI assistant/workflow adapter | #1 already owns messageEdited/redelivery revision and stale-answer invalidation. |
| `voice-actress` | Taiwan police/legal essay practice | Latest product-board audit says **REPOSITION + SIMPLIFY**; #6 evidence-linked grading is strategic, #7 tracks stale product docs/store truth. |
| `project-doctor-web` | Clinical interview / rolling SOAP teaching app | Structured interview/teaching and deterministic red-flag safeguards. |
| `92-duty-scheduler` | Duty scheduling / roster operations | #22 owns post-publication typed shift-change request lifecycle. |
| `flux-image-gen` | Image generation workflow | Provenance/cost/output receipts; capture provenance already research scope. |
| `neciken-summer-poem` | Literary contest / creative workstation | Contest-source truth, candidate isolation, frozen revisions. |
| `minideck` | AI HTML presentation generator | Generate/revise/version/share with project isolation and rollback. |
| `ppt-studio` | Local presentation authoring / AI deck workstation | Editable deck + claim/source provenance. |
| `police-exam-practice` | Police exam practice | Correct official corpus + adaptive review. |
| `exam-archive` | General exam archive | Provenance/version integrity + archive→practice. |
| `cf-mcp-server` | Cloudflare-hosted MCP infrastructure | Narrow capability tools, auth/effect boundaries, task-level verbs. |

---

## External Signals

### A. Direct competitor — Mastra Factory Beta makes per-stage autonomy and review capacity explicit

**CONFIRMED — 2026-09-08**  
Source: https://mastra.ai/blog/announcing-mastra-factory-beta  
Current Factory surface: https://mastra.ai/factory  
Docs: https://factory.mastra.ai/  
Pricing: https://mastra.ai/pricing

Mastra Factory connects GitHub, Linear and Slack to a configurable software-delivery board. Its default example is `Intake → Triage → Planning → Build → Review → Done`; each step can be manual or automatic, and each work item exposes the agent session, tools and workspace for inspection.

The strongest signal is Mastra’s own failure report: its team initially used full-automatic progression from issue through review, but backlog import became bursty, produced infrastructure problems and generated a large amount of difficult-to-review work. It then moved toward manual mode and made each stage configurable. Mastra also reports examples where incorrect upstream assumptions created downstream PRs that had to be closed.

**Job-to-be-Done:** let a small engineering team automate maintenance without creating a second unmanaged backlog of agent output.

**Why users perceive it as faster/more reliable:** only cheap/high-confidence stages need to run automatically; costly or ambiguous stages stop where human attention has highest leverage. Work needing attention becomes visible instead of getting buried in branches/PRs.

**Onboarding / distribution:** GitHub/Linear/Slack are intake adapters into the same workflow state rather than separate truths. Factory can run locally/cloud and exposes `npm create factory@latest` as the initial distribution path.

**Automation / collaboration pattern:** per-stage autonomy mode; session steering; separate review work item; task may require multiple PRs; merged review card does not automatically equal originating task complete.

**Pricing / business-model signal:** Starter is free; Teams is currently $250/month. Mastra meters observability events, CPU, data egress and memory/retention, and separately charges for persistent 24/7 servers. This makes **attention/observability/retention/always-on runtime** explicit economic resources rather than invisible background costs. Vendor throughput percentages are not used as independent effectiveness evidence.

**Failure / limitation:** Mastra itself says full auto created review/infrastructure overload and that bad triage assumptions generated waste. This is first-party operational evidence, but still their environment, not a universal rate.

**Absorb into Reese-max:** add a measurable concept of **review pressure / attention budget** before increasing autonomy; support per-work-type policy (`bugfix auto`, `feature planning manual`) only if telemetry proves value. Reuse exact task/execution identity and existing completion receipts.

**Do not copy:** Slack/Linear just because Factory supports them; a six-stage visual board if existing GitHub/Discord/Web already expresses state; vendor-specific knowledge graph; automatic stage advancement that can outrun verification capacity.

#### Candidate — Review Pressure / WIP Backpressure

Opportunity Score: **89/100 (research-list; no new Issue)**

- User Pain: 9/10
- Strategic Fit: 10/10
- Novelty: 7/10
- Evidence Strength: 9/10
- Reuse Potential: 9/10
- Implementation Effort controllability: 8/10
- Security/Privacy/Cost Risk controllability: 8/10

Reason not filed: `autodev-ng` already has one-Issue-per-owner-run, concurrency/cost caps, locks, separate reviewer/CI, human merge and layered completion. The missing question is whether review pressure is a **real observed bottleneck** in Reese-max, not whether Mastra has a stage switch. Measure first.

---

### B. Adjacent product — Meta Muse makes independent effect control a consumer-agent product contract

**CONFIRMED — 2026-09-08, Meta first-party**  
Source: https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/

Meta describes Muse as a long-running personal agent running inside a dedicated Muse Secure VM. The product-level security pattern includes:

- a **separate Sentinel agent**, system-level separated from Muse;
- Internet actions gated through Sentinel, with user permission where needed;
- credentials held in secure storage so the agent can use them without seeing raw passwords/payment details;
- per-connected-app scope, including distinctions such as email read versus send;
- explicit confirmation before sensitive effects such as email sends or purchases;
- audit trail of both actions already performed and actions planned.

**CONFIRMED — independent cross-check, Reuters, 2026-09-08**  
Source: https://www.reuters.com/business/meta-launches-ai-agent-that-can-access-other-apps-send-emails-make-payments-2026-09-08/

Reuters independently reports the launch and the autonomous safety-agent/app-access model, but also reports internal security/reliability issues, user frustrations and private-data exposure found in testing, as well as an earlier launch delay for additional security work. Therefore the correct lesson is not “Muse is secure”; the lesson is that **the market is making independent effect governance, secret handling and connector scope first-class UX, while runtime efficacy remains something to prove**.

**Job-to-be-Done:** allow an agent to act across real services without giving the reasoning model blanket authority or raw credentials.

**Why it saves time / increases reliability:** users can grant the smallest useful capability once (for example read email) while keeping higher-risk effects separately confirmable; the agent can continue long work without repeatedly asking for secrets.

**Onboarding / distribution:** app/WhatsApp conversation hides infrastructure complexity; connection permissions are a user-facing capability model rather than an engineering config file.

**Automation / integration / provenance pattern:** `connector scope + secretless handle + independent effect decision + user confirmation + planned/performed audit`.

**Pricing / business signal:** Meta says Muse is free for most use, with paid subscriptions for heavier use; Reuters reports $20 and $100 tiers. Broad agent execution is being packaged as a consumer service, so safety friction itself must be understandable to non-engineers.

**Failure / limitation:** an LLM-based Sentinel is not automatically hard containment; Meta’s own architecture announcement plus Reuters’ reported test issues make external verification important.

**Absorb:** strengthen existing `autodev-ng #12` with `connectorCapability`, `credentialVisibility`, exact confirmation binding, and planned-vs-actual effect receipts; reuse the primitive in `cf-mcp-server`, `ninax-line-hermes`, `92-duty-scheduler`, `skill-foundry`, `herdr-skills`.

**Do not copy:** a broad consumer-app/payment surface, or the assumption that a second model’s `ALLOW` verdict equals OS/network enforcement.

#### Issue action

**Updated existing `Reese-max/autodev-ng #12`; did not create a duplicate.**  
Stable fingerprint remains: cross-engine runtime egress/effect enforcement with explicit destination/method/data/credential semantics and runtime evidence.

Incremental sub-pattern score: **94/100** for `Secretless Capability Delegation + Planned/Actual Effect Receipt`, but it belongs inside #12.

---

### C. Emerging infrastructure — trace-level agent evaluation turns failure origin into a product primitive

**CONFIRMED — Red Hat Developer, 2026-09-03**  
Source: https://developers.redhat.com/articles/2026/09/03/evaluate-ai-agents-ibm-clear-evalhub-openshift-ai

The EvalHub + IBM CLEAR workflow ingests MLflow traces and evaluates individual interactions, then clusters recurring failure patterns by frequency, severity and origin. SPARC can split tool calls into separate evaluation rows so teams can distinguish bad reasoning from bad tool choice/arguments instead of hiding both under one aggregate score.

**CONFIRMED — Red Hat AI 3.5 announcement, 2026-09-09**  
Source: https://www.redhat.com/en/about/press-releases/red-hat-puts-safety-and-observability-core-enterprise-ai-red-hat-ai-35

Red Hat AI 3.5 adds/expands safety scores, validated tool-calling model tags, MLflow agent tracing, per-user token showback, controlled model rollout, VM isolation and sandboxed agent templates.

**Job-to-be-Done:** when a multi-step agent fails, identify the repeated root pattern and exact step/tool origin without manually reading every trace.

**Why it saves time:** turns raw logs into ranked recurring failure classes and isolates reasoning versus tool-call defects.

**Onboarding/distribution:** platform-integrated eval/trace UI and templates lower setup burden for enterprise users, but Reese-max does not need OpenShift to absorb the pattern.

**Automation / observability pattern:** `Trace → Span/Tool classification → Critique → Recurrence cluster → Frequency/Severity/Origin → Candidate remediation`.

**Pricing/business signal:** token showback and resource dashboards treat inference cost as part of operational UX. This reinforces Reese-max’s existing cost receipts rather than suggesting a new billing system.

**Failure / limitation:** CLEAR uses LLM-as-judge; judge-model drift and cost can distort results. SPARC is explicitly more expensive/slower than standard analysis. Product claims do not prove its rankings are correct for Reese-max traces.

**Absorb:** for `autodev-ng`, `skill-foundry`, `herdr-skills`, `prompt-autoresearch`, evaluate exact trace spans and cluster recurring failure fingerprints; only then propose rule/skill/prompt changes.

**Do not copy:** OpenShift/enterprise platform dependencies, one aggregate score as a release truth, or automatic rule promotion from an LLM critique.

#### Candidate — Trace Failure Clustering

Opportunity Score: **88/100 (research-list)**. It overlaps `herdr-skills #6`, `skill-foundry` evaluation work and `autodev-ng` evidence/reflect pipelines; the next step is to test whether existing event/evidence records contain enough normalized span identity before filing anything new.

---

### A2. Direct domain competitor — grading products reinforce evidence-linked feedback and rubric identity

**CONFIRMED — current product pages observed 2026-09-11**

- GradeWithAI writing/assignment graders: https://www.gradewithai.com/grading/writing-grader and https://www.gradewithai.com/grading/assignment-grader
- GradeWithAI pricing: https://www.gradewithai.com/pricing
- CorpusKey AI grading: https://corpuskey.com/ai-grading

GradeWithAI positions grading around user-provided rubrics, line-level/quoted evidence, integrations, handwritten inputs and teacher review; its current Free tier is 25 AI requests/month and Pro is $20/month. CorpusKey similarly exposes per-criterion scores/feedback, review/edit/publish and direct LMS export, plus user-controlled deletion.

**JTBD:** understand why a score was assigned and return usable feedback without manually copying evidence or results between systems.

**Why fewer steps:** criterion→quote/location reduces searching through the whole answer; direct export removes repeated copy/paste.

**Onboarding/distribution:** free trial/no-card and LMS connectors reduce initial switching cost.

**Capability/provenance pattern:** rubric is the scoring contract; evidence should point to the exact student text and remain reviewable before publication.

**Pricing/business signal:** evidence/review is in the core grading workflow, not positioned only as an enterprise add-on. Vendor “hours saved” and “5× faster” claims are marketing claims and are not used as effect evidence.

**Failure/limit:** citation/highlight presence does not prove score validity; AI-detection claims are not relevant to Reese-max’s core police-exam JTBD.

**Absorb:** existing `voice-actress #6` remains the right home. Add `rubric_revision/hash` beside `answer_revision` so an old criterion-evidence receipt cannot silently survive a rubric change.

**Do not copy:** LMS, class roster, school admin, AI-detection surface, generic K-12 breadth.

No new Issue: the fingerprint is already `voice-actress #6`.

---

### B2. Adjacent long-form workflow — CoAuthor keeps a running claim ledger and blocks bad replacement

**CONFIRMED — September 2026 release page, observed 2026-09-11**  
Source: https://coauthor.ai/releases

CoAuthor’s September release describes a running record of claims/examples/statistics to reduce repetition across later chapters, evidence-linked fact checks, a Finish pass that identifies repeated sections, manuscript import preview, and a guard that catches empty/cut-off/garbled AI output before it replaces existing text.

**Transferable signal:** long-form systems benefit from a **typed ledger of already-used commitments and a candidate-before-replace invariant**. This reinforces existing `ai-novel-workstation`, `neciken-summer-poem` and candidate/revision primitives.

**Do not copy:** its nonfiction fact-check claims as an equivalent truth model for fiction; fiction needs separate `canon fact / unresolved thread / deliberate repetition / motif` semantics.

This stays an adjacent idea; current Reese-max story-state work already overlaps strongly.

---

## New Releases / Recent Product Moves

| Date | Product / source | Market signal | Evidence |
|---|---|---|---|
| 2026-09-09 | Red Hat AI 3.5 | Safety/eval/tool-calling validation/tracing/token showback/controlled rollout move into platform ops | **CONFIRMED** |
| 2026-09-08 | Meta Muse | Secure VM + separate effect guard + secretless credential use + connector scope + audit trail | **CONFIRMED**, efficacy not independently proven |
| 2026-09-08 | Mastra Factory Beta | Configurable software-factory stages; first-party report that full-auto caused burst/review overload | **CONFIRMED** |
| 2026-09-08 | Mastra Factory contribution workflow | Detailed issue reproduction increasingly valued over low-information PR creation | **CONFIRMED** product strategy |
| 2026-09-03 | Red Hat EvalHub + IBM CLEAR tutorial | Step/tool-level trace evaluation and recurring failure clustering | **CONFIRMED** |
| Sep 2026 | CoAuthor | Claim ledger, repetition scan, evidence-linked fact checks, candidate replacement guards | **CONFIRMED current release page** |
| Observed 2026-09-11 | GradeWithAI | Rubric + line-level evidence + integrations; Free/Pro packaging | **CONFIRMED current product surface** |
| Observed 2026-09-11 | CorpusKey | Per-criterion review/edit/publish + direct export + retention control | **CONFIRMED current product surface** |

---

## Community Pain Points

These are **anecdotal signals only**, not market incidence statistics.

1. **COMMUNITY_SIGNAL — 2026-09-06:** a recent r/ClaudeCode discussion argues that spawning many agents is now easy, while defining durable workflows/phases/gates above interchangeable runtimes is the harder problem. This reinforces `autodev-ng`’s orchestrator-vs-engine separation, but does not prove a particular workflow framework is better.  
   https://www.reddit.com/r/ClaudeCode/comments/1w9233g/running_10_coding_agents_isnt_the_hard_problem/

2. **COMMUNITY_SIGNAL — 2026-06-18:** one r/ClaudeCode user reports that faster AI-authored PR creation shifted the bottleneck into review/context reconstruction; their preferred first-pass UI groups risky changes and drafts comments while leaving publish authority to the human reviewer. This is older than the preferred 30–90 day window but directly matches Mastra’s newer first-party “difficult-to-review work” signal.  
   https://www.reddit.com/r/ClaudeCode/comments/1u93fnp/ai_made_writing_prs_faster_reviewing_them_is_now/

3. **COMMUNITY_SIGNAL — 2026-09-03:** a recent discussion describes an organization where work items produce agent PRs, another bot reviews, and final human approval remains; replies also note that humans still find duplication/suboptimal solutions. This supports “automation moves the human role toward acceptance/design” but not a quantified productivity gain.  
   https://www.reddit.com/r/accelerate/comments/1w6a0gh/september_2026_we_have_entered_the_agentic_coding/

4. **UNKNOWN — Reese-max’s actual review-pressure threshold.** External evidence says review becomes a bottleneck when generation throughput rises, but current `autodev-ng` already rate-limits intake and requires CI/reviewer/human merge. We need local telemetry such as `ready candidates awaiting human review`, `age of oldest review`, and `generated work closed/rejected` before deciding whether another stage-control feature is justified.

5. **UNKNOWN — whether a separate model guard materially reduces unsafe effects for Reese-max.** Meta’s Sentinel is a product architecture signal. #12 should still require deterministic/runtime enforcement evidence; LLM approval accuracy is not assumed.

---

## Adjacent Ideas

### 1. Secretless Capability Delegation
Use provider/browser/OS credential brokers as opaque handles so an agent can perform a specifically approved capability without seeing the raw credential. Store only binding metadata in receipts. Highest fit: `autodev-ng #12`, `cf-mcp-server`, `ninax-line-hermes`.

### 2. Planned-vs-Actual Effect Receipt
Before an external mutation, persist normalized intended destination/capability/effect hash; after runtime, record observable actual disposition. Drift invalidates confirmation. Highest fit: `autodev-ng #12`, `92-duty-scheduler #22`, `clinical-scribe-worker` future externally reachable actions.

### 3. Review Pressure / Attention Budget
Treat reviewer capacity as a bounded resource like cost/concurrency. Start with observability, not a new workflow mode: queue size, age, rejection/rework rate, current reviewer availability. Highest fit: `autodev-ng`.

### 4. Trace Failure Clustering
Cluster recurring tool/reasoning failures across exact execution receipts before proposing rules. Highest fit: `autodev-ng`, `herdr-skills #6`, `skill-foundry`, `prompt-autoresearch`.

### 5. Rubric Revision Identity
Evidence-linked grading should bind to both answer revision and rubric revision. A rubric change makes prior scoring comparisons stale or requires migration. Highest fit: `voice-actress #6`, `cyber-prep-coach` explanation/rubric work.

### 6. Typed Long-form Commitment Ledger
Track `canon fact / claim / statistic / unresolved thread / deliberate motif / already-used example` separately, then run duplicate/contradiction checks without treating every repetition as an error. Highest fit: `ai-novel-workstation`, `neciken-summer-poem`.

---

## Opportunity Score Summary

| Candidate | User Pain | Strategic Fit | Novelty | Evidence | Reuse | Effort controllability | Risk controllability | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Secretless Capability Delegation + planned/actual effect receipt | 10 | 10 | 8 | 10 | 10 | 8 | 8 | **UPDATE existing `autodev-ng #12`** |
| Review Pressure / WIP Backpressure | 9 | 10 | 7 | 9 | 9 | 8 | 8 | Research-list; measure Reese-max queue pressure first |
| Trace Failure Clustering | 8 | 9 | 8 | 9 | 10 | 7 | 8 | Research-list; overlaps reflect/Skill Foundry |
| Rubric Revision Identity | 8 | 9 | 6 | 8 | 8 | 9 | 9 | Fold into `voice-actress #6` when implemented |
| Typed Long-form Commitment Ledger | 7 | 8 | 7 | 7 | 8 | 7 | 9 | Adjacent research only |

Scores are portfolio heuristics for prioritization, not market statistics.

---

## Opportunity Map — All 35 Product Repositories

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| `cf-ai-router` | stable aliases, failover, capability/cost truth | lifecycle canary + explicit provider evidence | zero-surprise billable gate and exact routing receipt | trace-failure clustering by provider/model/tool use | silent paid fallback or vendor-everything gateway |
| `soundbox-offline` | offline playback/import/backup | one canonical import lifecycle across adapters | local-first no-account portable library | OS Share Target as explicit candidate import | continuous background scraping/cloud account requirement |
| `police-exam-archive` | authoritative source/version identity | source drift/change monitoring | reproducible exam corpus | authority receipt shared to practice products | fabricated/mixed unofficial questions presented as official |
| `skill-foundry` | candidate≠active, reproducible eval | risk-tier + trace-origin failure clustering | promotion by behavior evidence/receipt | candidate improvement from repeated trace clusters | install/popularity as trust or auto-promotion |
| `prompt-autoresearch` | fixed datasets/model/prompt fingerprints | judge drift and trace-level diagnosis | reproducible held-out/cost-aware experiments | SPARC-like tool-vs-reasoning separation | optimize only aggregate score or train on test feedback |
| `lobsterpulse` | fresh source/date/dedupe/change detection | stronger source provenance and market category normalization | cross-source “what changed” evidence | use product pricing/release deltas as structured signals | notification spam / scraped marketing as proof |
| `tick-stock-panel` | reproducible research/backtest data | scenario robustness / guided first run | self-host research without trading authority | trace failure clustering for research agents | broker execution, auto-trading or outcome guarantees |
| `clinical-scribe-worker` | source/section integrity, auth, validation | minimal section repair/revision (#7) | repairable clinical draft with exact evidence | planned-vs-actual receipt only for future approved integrations | auto-finalize/EHR write before auth/validation maturity |
| `adng-memory` | provenance/admission/quarantine/stale/delete | multi-record poisoning + origin preservation | memory context without authorization | secretless references instead of memory-stored secrets | “remembered” instruction becoming capability authority |
| `avatar-vfo` | persona continuity and source-state identity | long-horizon ablation/regression | explainable structured persona state if evidence supports value | typed narrative/event memory separate from state | adding more psychological metrics without measured increment |
| `note-filler` | immutable original + sourced candidates | claim-level review/staleness | exact source-backed augmentation | planned/actual receipt for approved export only | AI-generated unsourced text becoming canonical |
| `taiwan-intel-dashboard` | official-source freshness/truth state | source failures/unknown state highly visible | Taiwan-specific cross-agency intelligence synthesis | read-only evidence connector into user’s existing AI tools | distribution surface outrunning source-truth repair |
| `cyber-prep-coach` | official question/answer provenance | independently calibrated explanations/mastery | explainable evidence-backed next task | rubric/version identity for scoring/explanations | broad tutor modes, fabricated readiness or deadline certainty |
| `UkePack` | correct notation/chords/export | teacher review and deterministic layout | simplified classroom practice pack | candidate-diff for arrangement edits | generic music DAW/social platform scope |
| `autodev-ng` | exact task/engine/CI/reviewer/effect truth | review-pressure metrics + egress/credential coverage | cross-engine evidence-first orchestration | secretless capability delegation + trace failure clusters | full-auto throughput without review backpressure; Slack/Linear feature chase |
| `ai-novel-workstation` | canonical story state/revision | continuity, resumability, cost/model drift | local-first long-running production state | typed commitment/unresolved-thread ledger | generic fact checker treating fiction canon as external fact |
| `herdr-skills` | candidate rule vs active policy | correction/trace cluster → validated candidate | reflection that cannot self-grant authority | tool-vs-reasoning error clustering | every correction becoming permanent prompt rule |
| `video-timeline-pipeline` | exact source/timestamp/revision | CutSpec/NLE handoff and stale-source handling | evidence-backed editable rough-cut intent | planned/actual handoff receipt across NLE import | destructive autonomous edit or transcript timestamps as frame truth |
| `chatgpt-dual-pipeline` | one canonical notes source | deterministic generated mirror | privacy/de-identification publishing boundary | source revision receipt | second editable truth in mirror |
| `claude-mem` | origin-aware session memory | poisoning/admission and retrieval-time policy | useful recall without authorization laundering | secretless opaque refs rather than credential text in memory | whole-session trusted replay or stored secrets |
| `lplrs-judicial-sync` | exact authority revision/removal | source spans and downstream stale state (#3) | body-free authority receipt | traversable legal relationships only with canonical semantics | infer “good law” from source existence/hash |
| `internship-notes-sites-mirror` | reproducible one-way sync | visible source/revision mismatch | stable public mirror | deployment receipt | editorial changes directly in downstream mirror |
| `MaterialYouNewTab` | fast/privacy-safe workspace dashboard | capture preview/diff/restore | local workspace session snapshot | OS/browser explicit share/import | silent continuous tab monitoring or broad page-content permissions |
| `taichung-police-intel` | official-first fresh evidence | changed-since-last and source status | local-government/police evidence synthesis | read-only in-context connector | generic cloud computer/write-enabled research agent |
| `ninax-line-hermes` | webhook revision/dedupe/current-head (#1) | exact channel/effect capability | source-verified video answer with stale-delivery gate | connector read/send capability scope + effect receipt | treating LINE message as authority or exactly-once delivery |
| `voice-actress` | truthful current product/store/pricing + reliable grade persistence | criterion→answer span + verified legal source (#6) | Taiwan police/legal rubric feedback | bind grading receipt to `answer_revision + rubric_revision` | LMS/social/generic TTS/paywall/every integration |
| `project-doctor-web` | structured interview state and red flags | explicit source/model/output provenance | teaching-oriented rolling SOAP with deterministic safeguards | candidate repair scope for a single section | clinical diagnosis/autonomous action claims |
| `92-duty-scheduler` | canonical schedule/policy/identity | typed post-publication change lifecycle (#22) | exact request→approval→schedule receipt | secretless LINE identity/session + capability scope | WFM/payroll/chat suite or LINE as second schedule DB |
| `flux-image-gen` | model/cost/input/output provenance | source evidence and reproducible edit identity | generation receipt with explicit uncertainty | credential/source handle without embedding sensitive source data | authenticity guarantees from provenance alone |
| `neciken-summer-poem` | contest rule/source correctness | candidate compare/freeze and revision lineage | evidence-aware literary submission workstation | typed motif/repetition/commitment ledger | autonomous self-evolution bypassing contest/AI policy |
| `minideck` | editable/versioned/shareable deck | revision diff/project isolation | compact HTML deck lifecycle | claim/source receipts + planned export handoff | public historical drafts/tokens or silent overwrite |
| `ppt-studio` | editable/exportable deck | claim/source provenance (#3) | evidence-backed local presentation authoring | spreadsheet/office handoff with candidate preview | polished unverified statements presented as facts |
| `police-exam-practice` | correct official Q/A | adaptive review with stable scoring contract | exam-specific local practice | rubric/version identity for mastery changes | fabricated questions/official score claims |
| `exam-archive` | provenance/version integrity | change monitoring and structured index | reproducible archive → practice handoff | authority receipts consumed by multiple study apps | scraping without source/right-state clarity |
| `cf-mcp-server` | auth, narrow tools, effect boundaries | per-tool connector capability/read-write scope | task-level curated verbs with exact receipts | secretless credential handles + relationship traversal where canonical | huge write-capable tool surface or credentials in model context |

---

## Top 10 Cross-Portfolio Ideas

1. **Independent Effect Guard** — the same reasoning agent should not be the only authority deciding whether its external effect is permitted.
2. **Secretless Capability Delegation** — let a tool use an opaque credential handle for one bounded capability without exposing the raw secret to model/prompt/memory/logs.
3. **Planned-vs-Actual Effect Receipt** — bind confirmation to exact intended effect and compare with runtime-observed result; drift makes approval stale.
4. **Review Pressure / Attention Budget** — agent output throughput must not outrun human/independent-review capacity; measure WIP age and rework before increasing autonomy.
5. **Trace Failure Clustering** — classify exact reasoning/tool spans and rank recurring failure fingerprints before changing prompts/rules.
6. **Candidate Patch Contract** — AI mutation remains a candidate until exact diff/evidence/validation allows promotion.
7. **Minimal Repair Scope** — preserve unrelated reviewed state when only one section/object needs correction.
8. **Rubric / Policy Revision Identity** — decisions must bind to the exact rubric/policy version; changing the contract invalidates old approvals/comparisons.
9. **Stale-on-Drift** — model/source/prompt/policy/runtime changes invalidate old candidate confidence instead of silently rebasing.
10. **DELETE / MERGE before ADD** — prefer consolidating duplicate state machines/integrations over accumulating more modes and channels.

---

## Ideas Rejected / Deferred

1. **New `autodev-ng` Muse/Sentinel Issue — REJECT as duplicate.** Existing #12 already owns independent semantic permission vs hard runtime egress/effect containment. Muse adds connector-scope/secretless/audit evidence, so #12 was updated instead.
2. **New `autodev-ng` six-stage Factory board — DEFER.** Existing GitHub issue intake, scheduler, reviewer, merge queue, delivery console and layered acceptance already express most lifecycle semantics. Only add stage UX if local telemetry proves a usability gap.
3. **New `autodev-ng` automatic stage mode — DEFER.** Mastra’s strongest lesson is actually that full-auto can overproduce review work. First measure review-pressure/WIP age; do not feature-chase a switch.
4. **New `voice-actress` grading-evidence Issue — REJECT as duplicate.** GradeWithAI/CorpusKey reinforce #6. Add rubric revision identity inside that implementation/research instead of creating another feature surface.
5. **New `herdr-skills` trace-learning Issue — REJECT as overlapping #6.** CLEAR/SPARC can supply additional candidate evidence, but correction/feedback-to-candidate promotion remains the same lifecycle.
6. **Copy Red Hat/OpenShift AI stack — DO NOT COPY.** Reese-max can reuse trace/error-cluster concepts without Kubernetes/OpenShift/GPU platform dependencies.
7. **Copy Meta Muse payment/email/app breadth — DO NOT COPY.** Absorb capability/credential/effect contracts, not the consumer super-agent scope.
8. **Copy Mastra Slack/Linear integrations — DO NOT COPY yet.** GitHub/Discord/Web already cover current Reese-max workflows; another channel creates integration/identity state without demonstrated user pain.
9. **Treat a separate LLM Sentinel as hard security — DO NOT COPY.** It is at most a semantic guard until runtime evidence proves an independent blocking boundary.
10. **Auto-promote rules from trace critiques — DO NOT COPY.** LLM eval itself can be wrong/drift; critiques are candidate evidence, not policy authority.

---

## Issue Mapping

| Product | Signal | Existing / new mapping | Action this round |
|---|---|---|---|
| `autodev-ng` | Meta Muse Secure VM / Sentinel / secretless credential / read-vs-send scope / planned+performed audit | **Existing #12** | Added incremental competitive-research comment; no duplicate Issue. |
| `autodev-ng` | Mastra Factory configurable stages + full-auto review overload | No single existing exact fingerprint; partially covered by scheduler/cost/reviewer/merge/delivery | Research-list only; measure review pressure before filing. |
| `autodev-ng` | Mastra Signals steering | Existing #11 STEER vs QUEUE | Reinforcement only; no duplicate. |
| `autodev-ng` | Red Hat trace/tool eval | Existing evidence/reflect + adjacent `herdr-skills #6` / `skill-foundry` | Research-list only. |
| `voice-actress` | GradeWithAI/CorpusKey rubric evidence + review | Existing #6 | Reinforces evidence-linked grading; add rubric revision identity later. |
| `voice-actress` | Repo/docs/store truth mismatch | Existing #7 from current product-board audit | No radar duplicate. |
| `ai-novel-workstation` | CoAuthor claim/repetition ledger | Existing canonical story-state direction | Adjacent research only. |
| `herdr-skills` | CLEAR recurring trace failure clusters | Existing #6 correction→candidate pipeline | No duplicate. |
| `skill-foundry` | CLEAR/SPARC tool-call evaluation | Existing skill evaluation/promotion scope | Research-list; no new Issue. |
| `cf-mcp-server` | Meta connector capability/secretless access pattern | Existing auth/effect-boundary direction | Cross-portfolio design principle only. |

### Duplicate / Coordination gate for `autodev-ng #12`

Before the update this round:

- searched current open/closed `autodev-ng` Issues for Muse/Sentinel/egress/credential/effect concepts;
- searched all-state PRs for Muse/Sentinel/egress/credential-scope concepts;
- fetched #12 and its existing comments;
- searched `github-issue-lock:v1` markers in `autodev-ng` issue comments;
- confirmed no active lock/fingerprint claiming this new Muse evidence separately.

The update is a comment on the existing stable fingerprint, not a new implementation claim or competing work lock.

---

## Sources

### Direct competitor / software factory
- **CONFIRMED — 2026-09-08** Mastra Factory Beta: https://mastra.ai/blog/announcing-mastra-factory-beta
- **CONFIRMED — current 2026-09-11** Mastra Factory product: https://mastra.ai/factory
- **CONFIRMED — current 2026-09-11** Mastra Factory docs: https://factory.mastra.ai/
- **CONFIRMED — current 2026-09-11** Mastra pricing: https://mastra.ai/pricing

### Adjacent agent security / capability
- **CONFIRMED — 2026-09-08** Meta Muse launch: https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/
- **CONFIRMED independent reporting — 2026-09-08** Reuters, Muse/security/reliability: https://www.reuters.com/business/meta-launches-ai-agent-that-can-access-other-apps-send-emails-make-payments-2026-09-08/

### Emerging agent evaluation / platform
- **CONFIRMED — 2026-09-03** Red Hat Developer, EvalHub + IBM CLEAR: https://developers.redhat.com/articles/2026/09/03/evaluate-ai-agents-ibm-clear-evalhub-openshift-ai
- **CONFIRMED — 2026-09-09** Red Hat AI 3.5: https://www.redhat.com/en/about/press-releases/red-hat-puts-safety-and-observability-core-enterprise-ai-red-hat-ai-35

### Grading / evidence workflow
- **CONFIRMED current page observed 2026-09-11** GradeWithAI writing grader: https://www.gradewithai.com/grading/writing-grader
- **CONFIRMED current page observed 2026-09-11** GradeWithAI assignment grader: https://www.gradewithai.com/grading/assignment-grader
- **CONFIRMED current page observed 2026-09-11** GradeWithAI pricing: https://www.gradewithai.com/pricing
- **CONFIRMED current page observed 2026-09-11** CorpusKey AI grading: https://corpuskey.com/ai-grading

### Long-form adjacent workflow
- **CONFIRMED — September 2026 release page observed 2026-09-11** CoAuthor releases: https://coauthor.ai/releases

### Community signals — anecdotal only
- **COMMUNITY_SIGNAL — 2026-09-06** https://www.reddit.com/r/ClaudeCode/comments/1w9233g/running_10_coding_agents_isnt_the_hard_problem/
- **COMMUNITY_SIGNAL — 2026-06-18** https://www.reddit.com/r/ClaudeCode/comments/1u93fnp/ai_made_writing_prs_faster_reviewing_them_is_now/
- **COMMUNITY_SIGNAL — 2026-09-03** https://www.reddit.com/r/accelerate/comments/1w6a0gh/september_2026_we_have_entered_the_agentic_coding/

---

## What Changed Since Last Radar

1. **Major competitor strategy change:** Meta Muse (2026-09-08) makes dedicated VM isolation, a system-separated effect guard, secretless credential use, per-app read/write capability scope and planned/performed audit trail a consumer-facing agent contract. This is new external evidence since r8.
2. **Existing high-value Issue strengthened, not duplicated:** `autodev-ng #12` was updated with Muse-derived `connectorCapability`, `credentialVisibility`, confirmation-binding and planned-vs-actual receipt acceptance ideas.
3. **New direct software-factory lesson:** Mastra Factory Beta publicly documents a move away from full-auto because backlog bursts created infra and review overload. This elevates **human review capacity / attention budget** as a first-class orchestration resource.
4. **No premature Stage Autonomy Issue:** current `autodev-ng` already has intake limits, locks, concurrency/cost caps, reviewer/CI, human merge and layered acceptance; we need local WIP/review-pressure telemetry before adding another workflow mode.
5. **New emerging eval signal:** Red Hat’s current CLEAR/EvalHub workflow makes recurring trace-failure clustering and tool-vs-reasoning separation a reusable agent-evaluation pattern. Kept in research because it overlaps existing reflection/Skill Foundry primitives.
6. **`voice-actress` current repo strategy sharpened after r8:** latest product-board audit explicitly says **REPOSITION + SIMPLIFY** around Taiwan police/legal essay practice. GradeWithAI/CorpusKey evidence reinforces existing #6 rather than adding LMS/generic grading scope.
7. **A small but important grading refinement surfaced:** criterion evidence should bind to **both answer revision and rubric revision**; changing the scoring contract must not leave old evidence looking current.
8. **Recent `taichung-police-intel` changes are primarily data/source refresh**, so this radar does not manufacture a product feature from data churn.
9. **Current `autodev-ng` CI is not treated as green:** open #13 records repeated Windows `test:flaky-regression` failures on recent default-branch runs; this report commit is intelligence documentation only and is not a release-health claim.
10. **No new product source, implementation branch, merge, deploy, secret, permission, repository setting or production runtime state was changed.** Only the existing #12 research Issue was updated and this central intelligence report was added.
