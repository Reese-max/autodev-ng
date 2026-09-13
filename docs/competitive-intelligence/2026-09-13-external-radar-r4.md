# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-13 r4

> Scope: Reese-max owned + unarchived repositories that can reasonably be treated as products.  
> Primary evidence source: public web outside GitHub. GitHub is used to establish current product truth, recent changes, duplicate/PR/coordination state, and Issue mapping.  
> Evidence labels: `CONFIRMED` = primary/official source or directly verified product surface; `LIKELY` = strong but incomplete corroboration; `COMMUNITY_SIGNAL` = anecdotal user/community signal; `UNKNOWN` = insufficient evidence.

## Executive Decision

**NOTIFY.** This round found one high-value, cross-portfolio capability pattern that is materially newer than the current Reese-max control model:

> **Policy-preserving safety transformation / safe retry** — instead of treating every unsafe Agent action as only `ALLOW / ASK / DENY`, a guard may produce a **candidate safer alternative or data-redacted action**, show an exact semantic diff, re-run the same policy, and only then allow explicit/policy-approved execution.

The strongest current direct signal is Harden AIF, launched on Product Hunt on **2026-09-09**, which positions itself in the execution path of coding-agent tool calls and exposes `allow / ask / make safe / block / log`; its public site explicitly describes **block-and-steer with safe retry**, local decision history, and local-first operation. This is reinforced by Operant Semantic Firewall's current `allow / block / redact` inline enforcement model and by AWS Bedrock Guardrails' June 2026 detect-only API, which deliberately separates findings from application-chosen `block / retry / log / redact` outcomes.

This is **not** a request to install Harden or replace the current Reese-max effect controls with an opaque local model. The transferable opportunity is a narrower contract:

`TaskIntent → ProposedAction → GuardFinding → CandidateSafeAlternative / RedactedAction → ExactSemanticDiff → Re-evaluate Same Policy → Explicit/Policy Promotion → Execute → ActualEffectReceipt`

### Opportunity Score — Candidate Safety Transform
- User Pain: 9/10
- Strategic Fit: 10/10
- Novelty: 8/10
- Evidence Strength: 9/10
- Reuse Potential: 10/10
- Implementation Effort controllability: 8/10
- Security / Privacy / Cost Risk controllability: 8/10
- **Portfolio score: 92/100**

### Coordination decision
No new Issue and no comment were created this round. `Reese-max/autodev-ng` already has the same governing surface in **#12 External-Effect Firewall**, and **PR #26 (`devin/issue-12-research`) is currently OPEN** with `EgressPolicy / EgressAttempt / EgressReceipt` contract work. Per `github-issue-lock:v1` / cross-schedule coordination, this round only records the new external evidence and candidate extension in this central radar; it does **not** steal the active work or alter #12/PR #26.

---

## Product → Market Category Map

Current scan scope remains **37** owned + unarchived product-like repositories.

| Repository | Market / Primary product category | Current truth relevant to this round |
|---|---|---|
| cf-ai-router | AI gateway / quota & cost-safe model routing | Existing task-reliability, model-lifecycle, Responses API, and cost fail-closed work already covers most new model-control signals. |
| soundbox-offline | Local-first / offline audio library | Reliability/CI remains ahead of new source breadth such as NAS/cloud sync. |
| police-exam-archive | Official exam archive / provenance | Strong fit for receipt-first provenance; no new external gap above existing archive quality work. |
| skill-foundry | Agent Skill authoring / evaluation / certification | #5 already covers human demonstration → Skill Candidate; Anthropic Smart Reports validates, but does not create a new fingerprint. |
| lobsterpulse | Multi-agent observability / attention | Existing Decision-only Attention Queue remains the right response to alert/agent event noise. |
| prompt-autoresearch | Prompt/model experimentation | Could reuse policy-safe candidate transformations for experiment actions, but no distinct product gap this round. |
| tick-stock-panel | Market monitoring | External provenance pattern remains more important than additional AI summaries. |
| clinical-scribe-worker | Clinical scribe / structured note workflow | Redaction-as-candidate is relevant for sensitive payloads, but must remain domain-validated and cannot silently alter clinical meaning. |
| avatar-vfo | Avatar / VFO content workflow | Candidate-first workflow remains preferable to autonomous publishing. |
| adng-memory | Durable Agent memory / provenance / erasure | #4 already covers activation/staleness/deletion; Claude memory updates validate rather than create a new gap. |
| ai-flight-radar | Flight/fare intelligence | Live quote calibration/build/licensing remain more important than adding more autonomous mutation. |
| taiwan-intel-dashboard | Taiwan intelligence aggregation/dashboard | Basedash-style answer provenance is supportive evidence for existing source-backed summary direction. |
| note-filler | Structured form/note completion | ReviewDecision / export capability work already aligns with user-owned vs AI-owned values; safe redaction is adjacent only. |
| cyber-prep-coach | Cybersecurity study coach | Dataset / blueprint / mastery migration remains the dominant opportunity. |
| UkePack | Teaching / music-learning content | No new high-confidence external product shift this round. |
| autodev-ng | Multi-agent software-engineering orchestration/governance | Main cross-portfolio target for candidate safe transforms; #12/PR #26 active, so report-only. |
| ai-novel-workstation | Long-form novelist workstation | Typed candidate mutation remains stronger than raw filesystem authority. |
| herdr-skills | Multi-agent reusable skills/workflows | #6 already covers repeated correction/friction → candidate improvement; Claude Smart Reports strongly validates it. |
| video-timeline-pipeline | Evidence-backed video edit / NLE handoff | New internal #18 timezone-budget boundary is a current reliability priority; do not expand paid/agent surface first. |
| chatgpt-dual-pipeline | Dual-engine content/publishing | Safe-transform pattern applies to publication candidates, but explicit publish remains separate authority. |
| claude-mem | Claude-oriented memory/context layer | Memory portability/scoping remains relevant; avoid duplicating adng-memory lifecycle control. |
| lplrs-judicial-sync | Judicial-data synchronization/coverage | Coverage receipts and missed-date recovery remain primary. |
| internship-notes-sites-mirror | Publishing / mirror / archive | Provenance and deterministic mirroring matter more than Agent mutation. |
| MaterialYouNewTab | Local-first browser new-tab workspace | Session capsule remains higher-value than adding broad Agent automation. |
| taichung-police-intel | Government/police intelligence monitoring | Existing Evidence MCP / provisional meeting session direction already fits Basedash-style provenance. |
| ninax-line-hermes | LINE / Agent workflow integration | LINE edit/redelivery #1 is current MUST MATCH; Switch room-scoped agent context is research-only adjacent signal. |
| 92-duty-scheduler | Duty scheduling / swap governance | Existing PolicySpec / ranked repair / Duty Inbox already matches current human-reviewed scheduling market. |
| voice-actress | Legal/essay/voice evidence workflow | Citation/evidence verification remains the differentiator; no new Issue needed. |
| project-doctor-web | Medical simulation / case learning | CaseSpec/action ledger and anti-fabrication remain ahead of generic Agent UX features. |
| flux-image-gen | AI image generation / iterative editing | Creative Edit Session #22 remains the correct current product bet. |
| neciken-summer-poem | Traditional-Chinese literary/contest workstation | Contest AI-operation policy/export fail-closed already covers current integrity need. |
| minideck | Lightweight presentation/publish surface | CI reliability remains blocking before adding more Agent-driven publishing. |
| police-exam-practice | Police-exam practice | Provenance, answer quality, and realistic exam flow remain higher-priority. |
| ppt-studio | AI presentation studio | Auth/CI reliability and evidence-backed generation remain ahead of more remote Agent control. |
| exam-archive | General exam archive/retrieval | Archive/source traceability remains dominant; no new market shift. |
| academic-mcp | Academic search/evidence/MCP gateway | Canonical paper identity/research bundle already absorbs most citation-graph/provenance signals. |
| cf-mcp-server | Cloudflare operations MCP / governed tools | Tool Contract Manifest + Drift Gate #15 remains the primary external-governance opportunity; safety transformation may later reuse the same typed effect boundary. |

---

# External Signals

## A. Direct competitor / new-product capability — Harden AIF: block-and-steer instead of binary stop

**Classification: CONFIRMED**  
**Date:** Product Hunt launch 2026-09-09; official product checked 2026-09-13.  
**Sources:**
- https://harden.run/
- https://www.producthunt.com/newsletters/archive/55373-stop-babysitting-your-agent
- https://www.producthunt.com/leaderboard/weekly/2026/37

### What it does
Harden sits in front of supported coding-agent tool calls. Its official product surface exposes a local decision stream including `allow`, `ask`, `make safe`, `block`, and `log`. The free individual tier explicitly includes **block-and-steer with safe retry**, local decision history, no required account, and support for several current coding agents.

### Job-to-be-Done
A developer wants a long-running Agent to keep working without granting blanket authority and without losing the whole run every time one unsafe command appears.

### Why it can save time / steps
The useful design idea is not “a model decides security.” It is that **one unsafe proposed action can be transformed into a reviewable safer candidate** instead of forcing the user to manually restate the task, reconstruct context, and restart the workflow.

### Onboarding / distribution signal
The product meets users inside agents they already use rather than demanding a new IDE. One local setup detects supported Agents; native hooks are used when available and an MCP proxy is a fallback. This is a strong distribution lesson for Reese-max: control layers gain adoption when they wrap existing tools rather than replace them.

### Automation / AI / privacy pattern
- local-first pre-execution checks;
- decision history stays on device;
- policy result can be a transformation path, not only a stop;
- redaction is treated as a separate action class;
- individual plan is free, while shared enterprise controls are the likely monetization layer.

### Limits / failure points
- Official benchmark numbers are vendor evidence only and are **not used here as proof of effectiveness**.
- Current full local-model requirements are substantial (official site lists macOS Apple Silicon for the full local model, 16 GB minimum memory, 24 GB recommended, ~15 GB disk; Windows is not supported at the moment).
- A model-generated “safe retry” can itself change task semantics. A transformation such as production → staging must never be silently treated as equivalent intent.

### What Reese-max should absorb
A typed **Candidate Safety Transform** contract with exact semantic diff, re-evaluation, and truthful receipt.

### What Reese-max should not copy
Do not make one local LLM a universal security authority; do not silently rewrite target/resource/action; do not claim a transformed action is “safe” merely because a monitor generated it.

---

## B. Adjacent transferable workflow — Operant Semantic Firewall: redact, don’t necessarily kill the workflow

**Classification: CONFIRMED product surface; efficacy UNKNOWN without independent runtime evidence**  
**Date:** current product checked 2026-09-13.  
**Source:** https://www.operant.ai/platform/semantic-firewall

Operant positions its Semantic Firewall as an inline, intent-aware boundary that can `allow / block / redact` Agent actions before execution. The most transferable design signal is **redaction as an explicit policy outcome**: remove the sensitive portion while allowing the permitted part of the workflow to continue.

For Reese-max this is relevant to:
- `autodev-ng`: sanitize external-effect payload candidates;
- `clinical-scribe-worker` / `note-filler`: candidate data minimization before outbound calls, but never silently alter clinically meaningful content;
- `cf-mcp-server`: tool payload classification before remote Cloudflare mutation;
- `ninax-line-hermes`: outbound-message payload checks where privacy rules apply.

The correct Reese-max abstraction should separate:
`PII/secret finding → proposed redaction → visible field/class diff → domain validity check → external-effect policy → send receipt`.

A redaction is **not** valid just because sensitive text disappeared. If the payload loses necessary identifiers, evidence, or meaning, the system must return `NEEDS_REVIEW / CANNOT_REDACT_SAFELY`.

---

## C. Emerging technical possibility — Guardrail findings become a policy input, not the execution authority

**Classification: CONFIRMED**  
**Date:** 2026-06-16.  
**Sources:**
- https://aws.amazon.com/about-aws/whats-new/2026/06/amazon-bedrock-guardrails-api-ai/
- https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-use-invoke-guardrail-checks.html

AWS Bedrock `InvokeGuardrailChecks` is deliberately **detect-only**. It returns safeguard findings/scores and leaves the application responsible for whether to block, redact, warn, retry, or log. This separation maps cleanly to Reese-max's existing principle that models/classifiers can provide evidence, but runtime policy owns authority.

Transferable contract:
`DetectorFinding ≠ PolicyDecision ≠ CandidateTransform ≠ Execution ≠ VerifiedOutcome`.

This makes a Candidate Safety Transform feasible without letting a security model promote its own rewrite.

---

## D. Emerging research — evaluate → rewrite → re-evaluate can outperform pure block/retry in some benchmark settings, but has utility trade-offs

**Classification: CONFIRMED RESEARCH; not product effectiveness evidence**  
**Date:** arXiv 2026-05-28.  
**Source:** https://arxiv.org/abs/2607.16215

RAIL Guard studies a closed-loop `evaluate → rewrite → re-evaluate` pipeline and explicitly distinguishes fixable failures from structural failures. Its published benchmark results are tied to the paper's own models/data/protocol and must not be generalized to Reese-max. The useful principle is narrower: **some safety failures may be remediable, while others must remain hard stops**.

Implication for a future #12 extension:
- `REDACTABLE_DATA` or bounded argument narrowing may be remediable;
- authority expansion, destructive production mutations, unknown destination, missing identity/credential provenance, and irreversible effects should remain structural / hard-stop classes.

---

## E. Direct adjacent launch — Claude Smart Reports turns recurring friction into shared-Skill candidates

**Classification: CONFIRMED**  
**Date:** 2026-09-10.  
**Sources:**
- https://support.claude.com/en/articles/12138966-release-notes
- https://support.claude.com/en/articles/16893491-get-started-with-smart-reports

Claude Enterprise Smart Reports analyzes sampled team transcripts for work performed, cost, friction, and repeated patterns worth packaging as shared skills. It is an opt-in admin feature and the help documentation explicitly limits its use as an employee-performance tool.

This is a strong market validation for **existing** Reese-max work, not a new fingerprint:
- `herdr-skills #6` already defines repeated correction / steering / friction → sanitized signal → candidate Rule/Skill → exact evidence preview → existing promotion gate;
- `skill-foundry #5` already defines Demonstration → Candidate Skill → quality/security/runtime gates.

**No new Issue.** Adding one would duplicate current direction.

Important pricing/business signal: Smart Reports is an Enterprise beta, currently limited to up to 10 reports/month per organization during beta. Anthropic is treating workflow-mining/optimization as an enterprise governance surface, not a generic chat feature.

---

## F. New collaboration workflow — Switch puts named Agents into existing team rooms

**Classification: CONFIRMED product surface; outcome claims are vendor anecdote**  
**Dates:** introduction 2026-08-26; Product Hunt launch recognition 2026-09-08; checked 2026-09-13.  
**Sources:**
- https://www.flintai.dev/products/switch
- https://www.flintai.dev/blog-posts/introducing-switch
- https://www.producthunt.com/products/switch-11

Switch connects Claude Code, Codex and other Agents into Slack/Teams/Discord/Telegram as named participants. Context, history, participants and rules live at the **room** level rather than inside one Agent session.

Transferable signal for `ninax-line-hermes` and `autodev-ng`:
- onboarding is “bring existing agents to existing collaboration rooms,” not “move everyone to a new Agent UI”;
- a room can become the scope boundary for context and rules;
- swapping an Agent should not erase the work history.

Research gap before a Reese-max Issue: `ninax-line-hermes` currently has a concrete P1 around LINE `messageEdited` / redelivery / stale work. Room-scoped multi-Agent collaboration is interesting, but there is not yet enough repository-specific evidence that it is a higher-value next move than making current LINE semantics correct. Keep on research list only.

---

## G. Provenance pattern — Basedash AI Sources keeps evidence one click behind the answer

**Classification: CONFIRMED**  
**Date:** 2026-09-02 launch; current changelog checked 2026-09-13.  
**Sources:**
- https://www.basedash.com/blog/introducing-basedash-ai-sources
- https://www.basedash.com/changelog

Basedash exposes tables, definitions, charts, data connections, web pages, exact SQL and returned rows that actually contributed to an AI answer. It also visually separates read/analysis provenance from mutating actions.

This does **not** justify a new dashboard feature by itself. It validates the current Reese-max evidence direction for:
- `taiwan-intel-dashboard`;
- `taichung-police-intel`;
- `academic-mcp`;
- `voice-actress`;
- `police-exam-archive`.

The strongest transferable UI principle is: **answer first, provenance collapsed but immediately inspectable; mutations remain visually distinct from evidence.**

---

# New Releases / Market Changes Worth Tracking

1. **2026-09-10 — Anthropic Claude Smart Reports (beta):** workflow/cost/friction mining and repeated-pattern → shared Skill suggestions. `CONFIRMED`.
2. **2026-09-09 — Harden AIF:** free local developer security layer with pre-execution checks, block-and-steer, safe retry, local decision store. `CONFIRMED product surface`; benchmark efficacy remains vendor-claimed.
3. **2026-09-09 — Noodle Seed new launch:** governed runtime for exposing product workflows to external Agents, including identity/permissions/secrets/audit/operations. Useful market validation for existing `cf-mcp-server` / `autodev-ng` typed-contract work; no new Issue this round.
4. **2026-09-08 — Switch Product Hunt launch:** named Agents in team chat rooms with room-scoped history/rules. `CONFIRMED`.
5. **2026-09-02 — Basedash AI Sources:** exact source/query provenance behind AI answers. `CONFIRMED`.
6. **Current 2026-09 — Operant Semantic Firewall:** inline `allow/block/redact` direction shows enterprise Agent security moving beyond pure binary blocking. `CONFIRMED product surface`; efficacy remains unverified here.

---

# Community Pain Points

## 1. “Allow / deny” alone is too coarse for real tool workflows

**Classification: COMMUNITY_SIGNAL**  
**Date:** Reddit discussion 2026-06-24 with follow-up 2026-09-01.  
**Source:** https://www.reddit.com/r/AI_Agents/comments/1ue7gdb/should_ai_agent_tool_calls_be_checked_before_they/

A small community discussion argues for a normalized action object and outcomes such as `allow with caps`, `dry-run`, `escalate`, or `deny`, with enforcement outside the model. This is anecdotal and low-volume; it is not a market statistic. It nevertheless supports the same structural gap seen in Harden/AWS/Operant: runtime policy needs more expressive outcomes than “yes/no.”

## 2. Irreversible customer/prod writes remain the hard boundary

**Classification: COMMUNITY_SIGNAL**  
**Date:** 2026-06-25.  
**Source:** https://www.reddit.com/r/AI_Agents/comments/1ufb1cx/whats_the_one_action_youve_decided_your_agent/

Users describe banning autonomous customer-visible messages and production migrations, and emphasize target/resource-level enforcement rather than tool-name-only rules. This is anecdotal but reinforces a critical constraint: **Candidate Safe Transform must not become a loophole around human approval for irreversible effects.**

## 3. Multi-repo / multi-agent context fragmentation persists

Current community discussions continue to describe “disconnected brains,” handoff documents, project-scoped memory and context loss across many repositories. This reinforces `adng-memory #4`, `autodev-ng` environment/principal work, and room-scoped context research; it does not justify a second memory system.

---

# Adjacent Ideas

## 1. Candidate Safety Transform — high value, existing control surface

Suggested outcome taxonomy:
- `ALLOW_UNCHANGED`
- `BLOCK`
- `ASK`
- `REDACT_DATA_CANDIDATE`
- `NARROW_SCOPE_CANDIDATE`
- `SAFE_ALTERNATIVE_CANDIDATE`
- `DRY_RUN_ONLY`
- `LOG_ONLY`
- `UNKNOWN`

Rules:
1. transformed action is a **candidate**, not an executed action;
2. before/after action semantics must be machine-readable and human-readable;
3. authority, target, environment, destination and effect class cannot expand;
4. transformed action must pass the **same** #12 effect policy again;
5. deterministic transforms are preferable for secrets/PII classes where possible;
6. LLM-generated alternatives cannot self-approve;
7. high-impact / irreversible classes remain `ASK/BLOCK`, not “make safe automatically”;
8. final receipt records original proposal, policy findings, transform revision/hash, execution result and target read-back where possible.

## 2. Friction → Candidate Improvement, not friction → automatic policy

Anthropic Smart Reports validates the product value of identifying repeated friction. `herdr-skills #6` already has the safer Reese-max version: sanitized signals, recurrence/conflict evidence, candidate exact diff, and a separate promotion gate. No new Issue.

## 3. Room-scoped context as a collaboration primitive

Switch suggests a useful boundary:
`RoomIdentity → Participants → Context/History → RoomRules → AgentLease → Action/MessageReceipt`.

Potential future fit: `ninax-line-hermes` after current LINE event lifecycle is reliable; `autodev-ng` for user-facing coordination surfaces. Keep research-only.

## 4. Evidence collapsed behind outcome

Basedash suggests a reusable UX primitive:
`Answer/Decision → compact receipt → expand exact source/query/tool evidence`.

This can reduce UI noise in intelligence/research products without hiding provenance.

---

# Opportunity Scores

| Candidate | User Pain | Strategic Fit | Novelty | Evidence | Reuse | Effort control | Risk control | Score | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Candidate Safety Transform / safe retry under #12 | 9 | 10 | 8 | 9 | 10 | 8 | 8 | **92** | Keep in central report only; #12 / PR #26 active |
| Repeated friction → Skill candidate analytics | 9 | 10 | 7 | 10 | 10 | 8 | 8 | **91** | Already covered by herdr-skills #6 + skill-foundry #5 |
| Room-scoped Agent collaboration for messaging | 8 | 8 | 8 | 8 | 8 | 7 | 7 | **84** | Research list only; no Issue yet |
| Basedash-style exact provenance drawer | 8 | 9 | 6 | 10 | 9 | 8 | 9 | **86** | Validate existing provenance work; no duplicate feature |
| Claude cross-surface memory controls | 8 | 8 | 6 | 10 | 8 | 7 | 8 | **83** | Existing adng-memory #4; no new Issue |
| “Install Harden as portfolio-wide security dependency” | 6 | 4 | 4 | 6 | 5 | 3 | 4 | **49** | Reject |

---

# Opportunity Map — 37 Products

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| cf-ai-router | Cost fail-closed, lifecycle truth, protocol support truth | Cache/read-write cost receipts and provider task profiles | Deterministic quota-first routing with auditable reasons | Model-roster governance UI later | Black-box dynamic routing that can silently spend |
| soundbox-offline | Local/offline integrity and regression CI | Recovery, source import reliability | Truthful local ownership without mandatory cloud | NAS/WebDAV only after reliability gates | Subscription-first cloud music catalog |
| police-exam-archive | Exact source/year/page provenance | Faster visual/figure access | Official-source archive with traceable transformations | Collapsed provenance drawer | AI answers detached from source pages |
| skill-foundry | Candidate ≠ certified Skill; explicit promotion | Demonstration intake with privacy/evidence separation | Evidence-gated Skill supply chain | Smart-report friction clusters as upstream candidates | Auto-install Skill from one observed pattern |
| lobsterpulse | Human attention only for actionable state | Correlate/dedupe before notification | Decision-only attention with receipts | Safe-transform outcome as attention candidate | AI summary on every raw event |
| prompt-autoresearch | Reproducible experiment inputs/results | Separate candidate prompt changes from active config | Evidence-backed model/prompt research | Safety-transform fixtures as a benchmark dimension | Autonomous production prompt mutation |
| tick-stock-panel | Freshness and market-data provenance | Explain which source/time drove a signal | Decision support without fabricating live certainty | Basedash-style source drawer | Unverified AI market calls |
| clinical-scribe-worker | Privacy, exact source distinction, human review | Field-level redaction/repair candidates | Domain-scoped candidate note with revision receipt | Policy-safe outbound payload minimization | Silent redaction that changes clinical meaning |
| avatar-vfo | Candidate/review before publication | Clear source/model/version lineage | Repeatable content pipeline with bounded autonomy | Safe rewrite for policy-sensitive text candidates | Automatic public posting on model judgement |
| adng-memory | Activation/staleness/deletion contract | Cross-session topic ownership and tombstone propagation | Memory with provenance + temporal truth | Team friction analytics only as sanitized signals | “Remembered” = authorized or always correct |
| ai-flight-radar | Live quote truth and time/source calibration | Post-booking/reprice evidence when fare rules are known | Taiwan-origin decision support | Provenance drawer for fare evidence | US fare-credit assumptions copied globally |
| taiwan-intel-dashboard | Source freshness and claim evidence | Exact page/query/source behind summary | Taiwan-specific intelligence with auditable provenance | Basedash-style compact Sources panel | Generic uncited AI dashboard prose |
| note-filler | User-owned edits never silently overwritten | Typed ReviewDecision / export capability | Canonical structured data with candidate fill | Redaction candidate before external processing | Autofill unknown fields with guesses |
| cyber-prep-coach | Exam blueprint/version truth | Progress migration with explicit receipt | Evidence-backed mastery across dataset versions | Smart study views generated from canonical data | Mode sprawl / duplicate databases |
| UkePack | Stable teaching assets and export | Easier reusable lesson assembly | Teacher-first child-safe content pack | Demo-to-template intake | Generic AI content without pedagogical review |
| autodev-ng | Identity/environment/effect/cost/receipt separation | Candidate Safety Transform with exact semantic diff | Multi-agent control plane with bounded authority | Smart friction mining → Skill candidates | Opaque security model self-authorizing actions |
| ai-novel-workstation | Canonical story state + candidate mutation | Typed Agent reads and exact-base patching | Long-form continuity with promotion receipt | Demonstration of author workflow → candidate Skill | Raw filesystem write from external Agent |
| herdr-skills | Correction evidence ≠ active rule | Privacy-preserving recurrence clustering | Correction → candidate rule/check/Skill → validation | Claude Smart Reports-style usage insights | Automatic permanent rule from one frustration |
| video-timeline-pipeline | Cost/timezone correctness and evidence-backed cut specs | Deterministic NLE apply/read-back | Evidence → candidate edit → target-native mutation receipt | Safe action transforms for non-destructive NLE steps | More paid Agent breadth before #18 reliability fix |
| chatgpt-dual-pipeline | Candidate vs published artifact separation | Cross-engine provenance/compare | Dual-engine review before publication | Redacted external payload candidate | Publish because both models agree |
| claude-mem | Memory scope/ownership truth | Clear staleness and transfer semantics | Small explicit Claude context layer | User-editable memory topics | Duplicate a second opaque memory DB |
| lplrs-judicial-sync | Target-date coverage truth | Missed-run alarm/backfill accounting | Judicial data coverage receipt | Compact “coverage evidence” drawer | Treat schedule trigger as successful ingestion |
| internship-notes-sites-mirror | Deterministic mirror/source link | Update/diff receipts | Durable public notes mirror | Provenance panel | AI rewrite without preserving original evidence |
| MaterialYouNewTab | Local-first permissions | Workspace session restore with truthful URL-only receipt | Minimal-permission new-tab workspace | Room/context handoff concept for browser work | Full invasive browser Agent by default |
| taichung-police-intel | Source/date/evidence and live/provisional distinction | Read-only Evidence MCP | Operational intelligence with auditable claim chain | Basedash-style query/source drawer | Black-box summary without exact evidence |
| ninax-line-hermes | LINE edit/redelivery/current-revision semantics | Stale-job suppression and delivery receipt | Verified video/research reply inside LINE | Switch-style room-scoped Agent context after P1 | Multi-agent room expansion before webhook truth |
| 92-duty-scheduler | PolicySpec and human-reviewed schedule mutation | Minimal-impact ranked repair | Constraint-aware swaps with exact before/after | Candidate safe transform for low-risk repair only | Autonomous live roster mutation |
| voice-actress | Citation exists/supports claim/reasoning separated | Exact evidence spans and canonical law source | Legal/essay assistance with verifiable authority | Collapsed source drawer | Citation checker that only verifies URL existence |
| project-doctor-web | Observed vs inferred case evidence | Action ledger and rubric receipt | Medical simulation without fabricated normals | Safe candidate correction after rubric finding | Hallucinated patient state to make case flow easier |
| flux-image-gen | Candidate revision/branch/rollback | Reference tray + Creative Edit Session | Iterative edit lineage with explicit promotion | Spatial edit intent + drift check later | “Latest generated image” silently becomes canonical |
| neciken-summer-poem | Contest AI-operation policy and export fail-closed | Provenance of assisted edits | Local-first Traditional-Chinese literary workflow | Demonstration-to-style checklist | Hide AI involvement or auto-submit |
| minideck | Working CI/build before more surfaces | Simple provenance/export stability | Lightweight deck creation | Evidence drawer if AI generation grows | Remote Agent publishing before CI truth |
| police-exam-practice | Official answer/source integrity | Exam-like continuation, wrong-answer evidence | Police-specific prep with traceable questions | Generated task views from canonical question bank | More modes than users can understand |
| ppt-studio | Auth/CI fail-closed | Source→claim→layout provenance | AI deck creation with evidence and editable output | Basedash-style compact source trail | Expand remote authority before auth/CI repair |
| exam-archive | Source/year/page indexing | Figure/image inline access | General exam archive with deterministic provenance | Compact source inspector | Synthetic answers mixed with official source truth |
| academic-mcp | Canonical paper identity and entitlement/source state | Research bundle ledger + citation graph | Evidence-first academic Agent gateway | Answer provenance drawer | “Paper found” = “full text available/authorized” |
| cf-mcp-server | Tool contract drift, typed effect levels, confirmation | Manifest/digest + payload safety classification | Governed Cloudflare MCP with truthful capability receipts | Candidate redaction/narrowing before low-risk writes | Remote tool schema/effect change silently trusted |

---

# Top 10 Cross-Portfolio Ideas

1. **Candidate Safety Transform** — unsafe proposal may become a candidate safer action, never a silent rewrite. `NEW HIGH-VALUE SIGNAL`.
2. **Exact Semantic Diff for Agent actions** — compare target, effect class, destination, environment, data classes, scope, and authority before/after transform.
3. **Detector ≠ Decision ≠ Execution** — safety model findings are evidence; deterministic/runtime policy owns authority.
4. **Friction telemetry → Candidate Improvement** — repeated correction/steering can propose rules/skills but must pass existing promotion gates.
5. **Room-scoped context** — context/rules/history live in a collaboration room rather than one model session; research-only until specific product value is proven.
6. **Evidence one click behind the answer** — keep provenance inspectable without flooding primary UI.
7. **Read and mutate must look different** — analysis provenance should never visually blend with external-effect actions.
8. **User-owned values remain immutable to AI without explicit handback** — especially forms, schedules, clinical notes and manually corrected fields.
9. **Transform receipt** — record original action, finding, candidate transform, policy revision, approval identity, actual effect, and read-back.
10. **Structural vs fixable failures** — authority expansion / irreversible prod effects stay hard stops; only bounded data/scope defects are transform candidates.

---

# Ideas Rejected / Deferred

1. **Install Harden across the portfolio now — REJECT.** Valuable product signal, but platform/runtime requirements and opaque-model dependence are not justified; Reese-max already has stronger typed authority primitives in progress.
2. **Let an LLM silently rewrite unsafe tool calls — REJECT.** A safer-looking command can change objective, resource, environment or blast radius.
3. **Treat production→staging substitution as semantically equivalent — REJECT.** It may be a useful suggestion but it is not the same user intent/effect.
4. **Auto-redact any detected sensitive content — REJECT.** Clinical/legal/operational payloads may become invalid or misleading after redaction.
5. **Create a new Smart Reports / friction mining Issue — REJECT as duplicate.** `herdr-skills #6` + `skill-foundry #5` already cover the safe Reese-max version.
6. **Create a second memory Issue from Claude cross-chat/Cowork memory — REJECT as duplicate.** `adng-memory #4` already owns activation/staleness/deletion semantics.
7. **Create a Switch/room collaboration feature immediately in ninax-line-hermes — DEFER.** Current P1 LINE edit/redelivery correctness is more foundational.
8. **Create Basedash-like Sources UI as a standalone feature everywhere — DEFER.** Use it as UX guidance inside existing provenance work rather than multiplying surfaces.
9. **Use vendor benchmark percentages as acceptance targets — REJECT.** External benchmarks are not Reese-max runtime evidence.
10. **Expand video Agent capabilities before fixing timezone budget semantics — REJECT for sequencing.** Current `video-timeline-pipeline #18` proves a cost-safety contract gap that should stay ahead of breadth.

---

# Issue / PR Mapping and Coordination

| External signal | Reese-max mapping | Action this round |
|---|---|---|
| Harden safe retry / Operant redaction / AWS detect-only checks | `autodev-ng #12` External-Effect Firewall | **Central report only** because PR #26 is OPEN and actively handles #12 contract/evidence. No comment, no lock claim. |
| Repeated friction → shared Skill | `herdr-skills #6`, `skill-foundry #5` | Existing fingerprint. No duplicate Issue. |
| Claude memory across chat/Cowork | `adng-memory #4` | Existing activation/staleness/deletion fingerprint. No duplicate Issue. |
| Switch room-scoped Agent collaboration | `ninax-line-hermes` / `autodev-ng` research list | No Issue until repository-specific user pain/evidence beats current reliability work. |
| Basedash AI Sources | `taiwan-intel-dashboard`, `taichung-police-intel`, `academic-mcp`, `voice-actress` | Validation / UX inspiration only. |
| Noodle Seed governed external-Agent runtime | `cf-mcp-server #15`, `autodev-ng #12/#17/#21/#28` | Existing governance decomposition is sufficient; no “AI control plane” Issue. |
| Current budget truth | `video-timeline-pipeline #18` | Existing P2 created 2026-09-13; do not dilute with new feature work. |

### Active coordination facts
- `autodev-ng PR #26` is **OPEN**, branch `devin/issue-12-research`, and explicitly references #12 with EgressPolicy/EgressAttempt/EgressReceipt research. This run did not touch it.
- `video-timeline-pipeline #18` is currently open and documents `COST_TIMEZONE` being ignored by UTC-derived period IDs; no real charge is claimed. This is a reliability sequencing constraint, not an external inspiration Issue.

---

# Sources

## CONFIRMED — official / primary product sources
1. **Harden AIF** — checked 2026-09-13 — https://harden.run/
2. **Product Hunt weekly Sep 7–13, 2026** — Harden/Switch/Mastra ranking — https://www.producthunt.com/leaderboard/weekly/2026/37
3. **Product Hunt newsletter, 2026-09-09** — Harden editorial launch description — https://www.producthunt.com/newsletters/archive/55373-stop-babysitting-your-agent
4. **Operant Semantic Firewall** — checked 2026-09-13 — https://www.operant.ai/platform/semantic-firewall
5. **AWS InvokeGuardrailChecks announcement, 2026-06-16** — https://aws.amazon.com/about-aws/whats-new/2026/06/amazon-bedrock-guardrails-api-ai/
6. **AWS InvokeGuardrailChecks docs** — checked 2026-09-13 — https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-use-invoke-guardrail-checks.html
7. **Claude release notes, Smart Reports 2026-09-10** — https://support.claude.com/en/articles/12138966-release-notes
8. **Claude Smart Reports guide** — checked 2026-09-13 — https://support.claude.com/en/articles/16893491-get-started-with-smart-reports
9. **Switch product** — checked 2026-09-13 — https://www.flintai.dev/products/switch
10. **Switch introduction, 2026-08-26** — https://www.flintai.dev/blog-posts/introducing-switch
11. **Switch Product Hunt** — launch 2026-09-08 — https://www.producthunt.com/products/switch-11
12. **Basedash AI Sources, 2026-09-02** — https://www.basedash.com/blog/introducing-basedash-ai-sources
13. **Basedash changelog** — checked 2026-09-13 — https://www.basedash.com/changelog

## CONFIRMED RESEARCH
14. **RAIL Guard** — arXiv, submitted 2026-05-28 — https://arxiv.org/abs/2607.16215

## COMMUNITY_SIGNAL — anecdotal only
15. **AI_Agents: pre-tool policy discussion** — 2026-06-24 / follow-up 2026-09-01 — https://www.reddit.com/r/AI_Agents/comments/1ue7gdb/should_ai_agent_tool_calls_be_checked_before_they/
16. **AI_Agents: irreversible actions / human approval** — 2026-06-25 — https://www.reddit.com/r/AI_Agents/comments/1ufb1cx/whats_the_one_action_youve_decided_your_agent/

---

# What Changed Since Last Radar (r3 → r4)

1. **New market pattern:** the strongest new external signal is no longer merely “pre-execution allow/deny.” Harden + Operant + AWS collectively show a move toward **inline remediation outcomes** such as redaction, retry, or candidate safer action.
2. **New cross-portfolio proposal:** add a future **Candidate Safety Transform** layer to the existing Reese-max effect-policy architecture, but keep it candidate-first and re-evaluate under the exact same policy.
3. **No new Issue was created:** `autodev-ng #12` is already the correct owner and **PR #26 is actively processing it**, so this run obeyed coordination rules and did not comment/lock/branch.
4. **Smart Reports is strong validation, not a new gap:** Anthropic launched Smart Reports on 2026-09-10, but Reese-max already has `herdr-skills #6` and `skill-foundry #5` for safer candidate-first workflow mining.
5. **New product-distribution signal:** Switch reinforces “bring Agents into the collaboration surface people already use” and room-scoped context; kept research-only for `ninax-line-hermes` pending current P1 reliability work.
6. **New provenance UX validation:** Basedash AI Sources strengthens the pattern “answer first, exact evidence one click away; mutations remain distinct.” Existing intelligence/research products already have the right underlying primitives.
7. **New internal sequencing constraint since r3:** `video-timeline-pipeline #18` identifies an open timezone-budget boundary bug. This argues against expanding paid/Agent execution breadth until the cost-period contract is fixed and verified.

---

## Portfolio Principle Added This Round

**`Unsafe Proposal ≠ Safe Rewrite ≠ Approved Action ≠ Executed Effect ≠ Verified Outcome`**

A future Reese-max safety layer should be able to help an Agent recover from a bounded unsafe proposal **without** turning the remediation model into a new source of authority. The safest reusable primitive is:

`Finding → Candidate Transform → Exact Diff → Same Policy Re-check → Explicit/Deterministic Promotion → Effect → Read-back / Receipt`.
