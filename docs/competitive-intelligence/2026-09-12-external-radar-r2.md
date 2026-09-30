# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-12 r2

> Scope: Reese-max owned, unarchived repositories that are reasonably product-like.  
> Primary evidence source for this round: public web outside Reese-max GitHub. GitHub is used for current product truth, duplicate / PR / lock coordination, and issue/report writing.  
> Evidence labels: **CONFIRMED** = first-party/current product or authoritative documentation; **LIKELY** = well-supported but not fully runtime-verified; **COMMUNITY_SIGNAL** = anecdotal user/developer discussion or issue; **UNKNOWN** = insufficient evidence.

## Executive Summary

This round refreshed **37 unarchived product-like Reese-max repositories** and found one high-value cross-portfolio refinement that clears the notification threshold without warranting a duplicate issue:

- **High-value opportunity — Provisional Effect Simulation + Deferred Approval + Actual-vs-Simulated Receipt**, Opportunity Score **91/100**. Cloudflare OS Gatekeepers make side-effect approval asynchronous: an agent can receive a simulated local result, continue planning, and leave the real effect queued for later human approval. The product advantage is meaningful for unattended agents because a single approval no longer stalls the whole run. However, Cloudflare OS issue #151 identifies the key failure mode: simulated state may diverge from real state, especially when a later queued action depends on an earlier simulation. The Reese-max adaptation therefore must treat simulation as a **provisional world**, revalidate current state immediately before execution, preserve dependency lineage, and compare actual vs simulated outcomes. This belongs to existing `autodev-ng #12` rather than a new issue. A research comment was added to #12 after duplicate/PR/lock checks.
- **Major market strategy signal — enterprise agent governance is converging on a control-plane architecture.** Salesforce announced Enterprise AI Harness / AI Control Plane on 2026-09-10; ServiceNow AI Gateway is enforcing runtime MCP access policy; Microsoft Agent 365 and AWS AgentCore already cover agent identity/registry/consent/runtime surfaces. This validates Reese-max's existing separation of principal (#17), environment (#21), external effects (#12), attention (#lobsterpulse #9), cost, evidence, and lifecycle. It does **not** justify a new generic “AI Control Plane” issue or dashboard.
- **Direct competitor signal for `soundbox-offline` — Trove Player expanded to Mac in September 2026**, keeping a local-first/no-account model while adding WebDAV/SMB NAS sources and one-time paid unlock. This suggests a future `NetworkLibrarySource` abstraction, but `soundbox-offline` currently has unresolved recovery/CI assurance blockers; no feature issue was opened.
- **Adjacent workflow signal for presentation products — Adobe Acrobat Productivity Agent (2026-09-09)** turns documents into presentations while claiming source content is preserved and answers remain citation-backed. This strengthens the existing `ppt-studio #3` provenance direction rather than creating another presentation-generation feature.
- **OAuth onboarding signal — AWS AgentCore managed consent portal (2026-09-01)** removes custom callback/onboarding work for agent clients that cannot present OAuth consent flows well. It strongly validates `cf-mcp-server #9`, but that issue is already under active implementation via open PR #13, so this round did not touch it.

No product source, implementation branch, merge, deployment, secret, permission, firewall, or repository setting was changed.

---

## Portfolio → Market Category Refresh

| Repository | Market / product category | Current direction / latest relevant truth |
|---|---|---|
| `cf-ai-router` | Multi-provider LLM routing / reliability | Prefer reliability profile, model lifecycle truth, cost/quality routing over adding providers for its own sake. |
| `soundbox-offline` | Local/offline audio library/player | Local-first differentiation remains strong; current audit still has recovery-integrity and authoritative CI-gate gaps, so reliability precedes NAS breadth. |
| `police-exam-archive` | Police-exam archive / practice intelligence | Candidate/attempt provenance and deadline/work queue remain more important than more modes. |
| `skill-foundry` | Agent Skill generation, evaluation, certification, distribution | Goal Autopilot reduces creation effort; next value is certified distribution/install-state truth, already tracked by #4. |
| `prompt-autoresearch` | Prompt optimization / repeated evaluation research | Needs variance-aware evidence and repeatable evaluation rather than single-run winner claims. |
| `lobsterpulse` | Multi-agent/provider observability and operator attention | #9 Decision-only Attention Queue is the right abstraction; raw events should not equal human interruptions. |
| `tick-stock-panel` | Market/stock monitoring panel | Source freshness, coverage and partial-data truth should precede enterprise-finance breadth. |
| `clinical-scribe-worker` | Clinical AI scribe | Section-scoped repair/revision receipts and security boundary remain higher-value than more autonomous mutation. |
| `avatar-vfo` | Avatar / voice-oriented workflow tooling | Keep bounded asset/workflow state and explicit outputs; avoid broad agent-control expansion without product evidence. |
| `adng-memory` | Agent/autodev memory layer | Memory provenance, compaction and exact revision lineage matter more than unbounded retention. |
| `ai-flight-radar` | Flight discovery / fare monitoring / quote truth | Quote/source health, total trip cost and watch-state truth remain core; avoid auto-booking. |
| `taiwan-intel-dashboard` | Taiwan public-intelligence aggregation/dashboard | Evidence provenance, source health, freshness and agent-consumable contracts matter more than generic chat. |
| `note-filler` | Structured note completion / productivity | Candidate-vs-canonical mutation, field provenance and reviewable diffs are the transferable primitives. |
| `cyber-prep-coach` | Cybersecurity exam preparation | Versioned exam blueprint/content and mastery migration are more important than adding quiz modes. |
| `UkePack` | Music / ukulele creative toolkit | Reversible creative assistance and export/handoff remain more strategic than opaque generative replacement. |
| `autodev-ng` | Multi-engine autonomous software-development orchestrator | Existing kernel already separates execution, cost, worktrees, review, evidence and control surfaces; this round adds provisional-effect semantics to #12. |
| `ai-novel-workstation` | Long-form AI writing workstation | Canonical manuscript, candidate revisions, continuity and reversible edits should stay distinct. |
| `herdr-skills` | Multi-agent Skill library / improvement workflow | Correction/demonstration → candidate Skill → evaluation/promotion remains the right lifecycle. |
| `video-timeline-pipeline` | Video transcription/OCR/timeline knowledge extraction | Replayable hashes/cache/source evidence and source ingestion remain core; do not drift into generic video editing. |
| `chatgpt-dual-pipeline` | Multi-model / dual-pipeline AI workflow | Cross-model evidence/review boundaries matter more than another model selector. |
| `claude-mem` | Persistent memory for Claude/agents | Retrieval provenance, lifecycle, privacy and stale-memory handling remain key. |
| `lplrs-judicial-sync` | Legal/judicial source synchronization and evidence | Source identity, freshness, conflicts and provenance remain differentiators. |
| `internship-notes-sites-mirror` | Notes/site publishing mirror | Source-to-published revision traceability and simple export/publish remain core. |
| `MaterialYouNewTab` | Browser new-tab productivity/workspaces | Workspace/session continuity opportunity exists, but avoid turning the product into a full browser/tab manager. |
| `taichung-police-intel` | Police/public-sector intelligence & evidence dashboard | Evidence distribution contracts and publication receipts remain more important than broad generative chat. |
| `ninax-line-hermes` | LINE messaging / agent bridge | Channel identity, send/reply capability boundaries and receipts should remain explicit. |
| `92-duty-scheduler` | Duty roster / staffing scheduler | Proposed-vs-canonical schedule, constraints, approvals and mutation receipts remain core. |
| `voice-actress` | Police/law essay practice and evidence-based evaluation | Rubric revision + answer revision + evidence-linked scoring remain the differentiated direction. |
| `project-doctor-web` | Project diagnosis / maintenance web surface | Keep diagnosis evidence and repair proposals distinct; avoid auto-fixing without runtime verification. |
| `flux-image-gen` | Image generation/editing workstation | #22 Creative Edit Session / Reference Tray is the latest product opportunity; candidate edits must not overwrite canonical art. |
| `neciken-summer-poem` | Creative writing / poetry product | Preserve author intent, revision history and lightweight creative flow; avoid workflow bloat. |
| `minideck` | Lightweight presentation creation | Source-preserving transformations and editable handoff are preferable to feature-heavy collaboration. |
| `police-exam-practice` | Exam practice | Reliable source mapping, attempt state and feedback quality remain more useful than more modes. |
| `ppt-studio` | AI presentation generation/editor | Existing #3 slide/claim provenance is reinforced; P1 auth/CI issues still outrank remote/autonomous breadth. |
| `exam-archive` | Exam archive | Searchability, source identity and stable content indexing remain foundational. |
| `academic-mcp` | Academic research MCP / multi-source retrieval | #1 Canonical Paper Identity + Research Bundle Ledger remains the right answer to multi-source drift/rate limits. |
| `cf-mcp-server` | Cloudflare management MCP | Protocol/auth interoperability, exact-target confirmation and gradual rollout safety remain current priorities; #9 has active PR #13. |

---

# External Signals

## Signal A — Salesforce Enterprise AI Harness / AI Control Plane

**Classification:** CONFIRMED product/strategy signal  
**Date:** 2026-09-10 (US announcement; Japanese official translation published 2026-09-11)  
**Sources:**
- https://www.salesforce.com/news/stories/enterprise-ai-harness/
- https://prtimes.jp/main/html/rd/p/000000399.000041550.html
- Independent rollout/evidence-boundary note: https://kaleidofield.com/news/salesforce-enterprise-ai-harness-control-plane-rollout

### What it solves / JTBD
Enterprises have many agents, models and tools across vendors. The operator needs one place to discover/register them, establish identity/policy, manage lifecycle, evaluate performance, observe outcomes and control cost without forcing every workload into one closed model stack.

### Why users perceive fewer steps / more reliability
Instead of reconstructing agent identity, model, policy and spend from separate systems, the architecture makes these control dimensions first-class and shared. Salesforce explicitly positions the control plane across Salesforce and third-party AI.

### Onboarding / distribution pattern
The Harness is intended to be open/composable and headless through MCP, APIs, Skills and plug-ins, reaching existing surfaces such as Claude, Slack, Teams and Agentforce rather than requiring a single Salesforce-only user interface.

### New capability pattern
`Context + Agency + Action + Governance + Security + Models + Control Plane`, with intelligent model routing by accuracy/performance/cost/business requirements.

### Pricing / business-model signal
Salesforce says many underlying technologies exist today but new unified capabilities/experience roll out beginning early FY28; packaging/pricing will be shared closer to GA. This is therefore a **strategy/product-architecture signal**, not proof that the full cross-vendor control plane is deployed and working today.

### Limitations / complaints
No independent cross-vendor runtime result is available from the announcement. The correct evidence label for the complete unified experience is not “production-proven.”

### Reese-max absorption
**Absorb:** the separation of registry, identity, lifecycle, performance, cost and policy as composable contracts. This validates `autodev-ng #17/#21/#12`, `lobsterpulse #9`, existing cost receipts and evidence chains.

**Do not copy:** do not create a large generic “AI Control Plane” UI just because the market uses that label. `autodev-ng` already has CLI/Discord/Web surfaces and multiple primitives; a new dashboard would duplicate state unless it reads canonical contracts.

---

## Signal B — Cloudflare OS Gatekeepers: capability-bound effects + asynchronous human approval

**Classification:** CONFIRMED architecture/workflow signal; limitation is COMMUNITY_SIGNAL  
**Date:** 2026-08-05; limitation issue opened 2026-08-11  
**Sources:**
- https://blog.cloudflare.com/cloudflare-os/
- https://github.com/cloudflare/cloudflare-os/blob/main/README.md
- https://github.com/cloudflare/cloudflare-os/issues/151

### What it solves / JTBD
An agent needs controlled access to real systems without receiving broad API keys and without stopping at every side-effect approval. Cloudflare OS starts agents/apps with no access, gives typed capability bindings, isolates credentials, disables global outbound network access for server code, and routes external resources/effects through service-specific Gatekeepers.

### Why it saves steps
The README describes an unusual HITL workflow: when an effect requires approval, a Gatekeeper can **simulate the outcome locally**, let the agent proceed with simulated reads, queue more actions, and let the user approve/reject later in bulk or individually. This directly targets the unattended-agent failure mode where a run stalls on the first approval and tempts users to enable blanket auto-approval.

### Onboarding / distribution
Cloudflare OS is open source and designed to be customized around an organization. Gatekeepers wrap individual external systems; MCP Server Portals can connect existing MCP servers.

### Automation / AI / integration / provenance pattern
- Typed capability rather than raw credential.
- Service-specific policy mediation.
- Observation lineage: policy can depend on what sensitive resources the agent has already read.
- Deferred human decision without immediate real-world effect.

### Limitations / failure point
Cloudflare OS issue #151 asks whether simulated outcomes are independently verified before bulk approval. A wrong early simulation can make later dependent actions reason over a false world; bulk approval may then approve a chain of assumptions. This issue is anecdotal/community evidence, not a measured failure rate, but the design risk is concrete.

### Reese-max absorption
**High-value same-fingerprint refinement for `autodev-ng #12`:**

`ExternalEffectSpec → ASK → ProvisionalEffectSimulation → ProvisionalWorld → DeferredApprovalQueue → Revalidate Current State → Execute Exact Effect → ActualEffectReceipt → Simulated-vs-Actual Diff`

The critical rule is **simulation never becomes canonical execution evidence**. Dependent work must carry `PROVISIONAL_DEPENDENCY`; approval must re-read target state and fail stale when exact assumptions drift.

**Do not copy:** do not bulk execute a simulated dependency chain without per-effect revalidation; do not let parent approval imply child approval; do not let simulator output widen credentials/destinations.

### Issue action
Updated existing `autodev-ng #12` with this research refinement. No new issue was created.

---

## Signal C — ServiceNow AI Gateway runtime MCP governance

**Classification:** CONFIRMED vendor product/current docs; launch-post wording included a planning caveat  
**Date:** 2026-09-10 relaunch window; FAQ current 2026-09-11  
**Sources:**
- https://www.servicenow.com/community/ai-control-tower-blog/ai-gateway-is-back-what-s-coming-on-september-10th-2026/ba-p/3591141
- https://www.servicenow.com/community/ai-control-tower-articles/ai-gateway-faq/ta-p/3587429
- https://newsroom.servicenow.com/press-releases/details/2026/ServiceNow-expands-AI-Control-Tower-to-discover-observe-govern-secure-and-measure-AI-deployed-across-any-system-in-the-enterprise/

### What it solves / JTBD
When many agents and MCP servers proliferate, configuration-time approval is insufficient. Operators need a runtime point that can verify identity, issue scoped tokens, pause tools/servers, block sensitive data and observe success/latency/attempts per tool/client.

### New pattern
`Governed catalog/intake → runtime OAuth/identity → per-call policy → sensitive-data gate → observation → instant pause`.

### Limitations
The ServiceNow launch preview explicitly says planned capabilities may change; current FAQ/docs improve confidence but vendor claims are not independent efficacy benchmarks. Also AI Gateway scope is MCP traffic, not every possible agent effect channel.

### Reese-max absorption
This validates #12's insistence on per-origin coverage and `UNKNOWN/UNENFORCED` rather than pretending one gateway covers subprocesses/browser/local tools it cannot see. It also supports #17's principal/identity contract.

**Do not copy:** central policy state is not proof that every path is mediated at runtime.

---

## Signal D — AWS AgentCore Identity managed consent portal

**Classification:** CONFIRMED  
**Date:** 2026-09-01  
**Source:** https://aws.amazon.com/about-aws/whats-new/2026/09/amazon-bedrock-agentcore/

### JTBD / friction removed
Agent IDE clients often cannot natively present OAuth consent URLs or bind the post-consent session correctly. Developers previously had to build/host callback infrastructure; AgentCore now gives each Gateway a managed hosted consent portal and credential-provider list, while end users can see connection status themselves.

### Reese-max mapping
This strongly validates the product direction of `cf-mcp-server #9`: a browser-usable owner-approval surface is not incidental UI; it is a distinct authorization product surface for agent clients.

### Coordination decision
`cf-mcp-server #9` is already actively implemented by open **PR #13** (`feat(oauth): browser-usable owner approval for /oauth/authorize`), with local browser E2E reported and deployed browser evidence still pending. This radar therefore **does not update or compete with #9**; the AWS signal is recorded only in the central radar.

**Do not copy:** a hosted portal should not become a place where root credentials are embedded in URLs, and “connected” must not mean every downstream scope is authorized.

---

## Signal E — Trove Player local-first Mac/NAS expansion

**Classification:** CONFIRMED direct competitor  
**Date:** Mac availability since September 2026 (current FAQ)  
**Sources:**
- https://troveplayer.com/
- https://troveplayer.com/faq

### JTBD
People with music on-device or on a home NAS want the library to remain theirs while still appearing consistently across Mac/iPhone/iPad/Apple Watch. They do not want to upload the catalog into another cloud account just to browse/play it.

### Why it reduces steps
Trove treats local folders, Files, Wi-Fi import, WebDAV and SMB as first-class sources. The user points the player at existing storage; it scans metadata in place rather than forcing manual copy/import for every listening session.

### Onboarding / distribution
One App Store listing spans Apple devices; there is no account. The Mac version is shipped from the same listing and a single purchase unlocks Pro across devices using the Apple account.

### Business-model signal
Free local playback + **US$9.99 one-time Pro** for network sources/advanced capability; no subscription. There is also a higher voluntary supporter tier. This reinforces a local-first ownership/value story rather than SaaS lock-in.

### Limitations / what not to copy
Trove's platform scope is Apple-native; `soundbox-offline` should not abandon its web/local simplicity to mimic a native Apple suite. SMB/WebDAV add auth/cache/freshness/failure semantics and should not be rushed while recovery integrity is unresolved.

### Reese-max absorption
Future research candidate:

`NetworkLibrarySource(SMB/WebDAV/Files) → Browse/Select Folder → Source Observation → Cache/Offline Pin Policy → Playback → SourceReceipt`

Opportunity Score **86/100**, but **not eligible for feature Issue now** because `soundbox-offline` still has unresolved recovery-integrity P0 and a CI-gate gap where `npm test` is not the authoritative default gate.

---

## Signal F — Adobe Acrobat Productivity Agent: source-preserving transformation

**Classification:** CONFIRMED adjacent workflow  
**Date:** 2026-09-09  
**Source:** https://news.adobe.com/news/2026/09/adobe-productivity-agent-in-acrobat-now-transforms-complex-documents

### JTBD
A user has a real source document and wants a presentation/report/visual output without retyping content or losing the ability to verify what the output came from.

### Workflow pattern
Acrobat can turn documents into visual reports/slides and `Stylize` can reflow source information into Adobe Express templates while Adobe says it preserves source content. The announcement also emphasizes clickable citations on AI answers and shared enterprise repositories.

### Reese-max absorption
This reinforces `ppt-studio #3` rather than suggesting another generic “generate presentation” feature. The transferable pattern is:

`Versioned Source → Evidence/Claim Map → Layout Transformation Candidate → Diff/Review → Canonical Deck → Export with Provenance`

### What not to copy
Do not interpret “source preserved” marketing language as proof of claim-level semantic correctness. Reese-max should keep explicit evidence status (`direct/paraphrase/derived/inference/unresolved`) and invalidate citations after edits when support no longer holds.

---

# New Releases / Recent Product Moves

| Date | Product | Release / change | Evidence |
|---|---|---|---|
| 2026-09-10 | Salesforce | Enterprise AI Harness + cross-vendor AI Control Plane announced | CONFIRMED |
| 2026-09-10/11 | ServiceNow | AI Gateway runtime MCP governance relaunch/current FAQ | CONFIRMED vendor product/docs; launch preview carried change caveat |
| 2026-09-09 | Adobe Acrobat | Productivity Agent transforms source documents into presentations/visuals; Stylize source-preserving reflow | CONFIRMED |
| 2026-09-01 | AWS AgentCore Identity | Managed consent portal for agent tool OAuth | CONFIRMED |
| Sep 2026 | Trove Player | Mac version joins iOS/iPad/Watch; same listing and one-time Pro; SMB/WebDAV | CONFIRMED current product/FAQ |
| 2026-08-05 | Cloudflare OS | Gatekeepers, typed capabilities, observation-aware policy and async effect approval simulation | CONFIRMED |

---

# Community Pain Points

These are **anecdotal signals only**, not statistical claims.

1. **Simulation divergence / bulk-approval risk — Cloudflare OS #151 (2026-08-11).** A developer asks whether simulated Gatekeeper results are independently checked before users bulk approve a chain of actions. Product implication: async HITL needs stale-state/revalidation and actual-vs-simulated receipts.
2. **“Control plane” can become a dashboard over black boxes.** Recent practitioner discussion around agent control planes repeatedly warns that without standard identity/instrumentation/runtime mediation, a centralized UI may show labels without proving actual authority or effects. Product implication: Reese-max should keep canonical typed contracts and evidence first, UI second.
3. **Local/NAS music friction.** User discussions around local music players regularly ask for WebDAV/SMB, folder recursion, queue/search/filter behavior and affordable ownership. Product implication: network sources are plausible for `soundbox-offline`, but reliability and recovery still outrank breadth.

---

# Adjacent Ideas

## 1. Provisional World / Deferred Decision Queue
Reuse across `autodev-ng`, `lobsterpulse`, schedulers and messaging products when an operation needs human approval but unrelated work can continue.

**Rule:** provisional state is typed and non-canonical; actual execution revalidates and emits its own receipt.

## 2. Observation-aware outbound policy
Cloudflare OS records what an agent has seen and uses that observation history when deciding whether later sharing/outbound writes are allowed. This is a high-potential research direction for #12:

`ObservedSensitiveResource → DataClass/Lineage → ExternalEffectSpec → Destination/Recipient Policy`

Do not implement full dynamic information-flow control without a bounded research harness. Unknown lineage must not be silently treated as public.

## 3. Dedicated consent surface for agent clients
AWS reinforces the idea that OAuth consent is its own user workflow. This maps to `cf-mcp-server #9`, but the current active PR owns the implementation.

## 4. Network library as source, not import job
Trove suggests a clean abstraction for local-first media: a remote folder/NAS is a first-class read source with cache/offline policy, not an ad-hoc series of file copies.

## 5. Source-preserving transformation
Adobe's document→presentation workflow strengthens a pattern already useful across `ppt-studio`, `minideck`, `academic-mcp`, intelligence dashboards and exam material pipelines: transformations should retain versioned source identity and indicate where semantic support has changed.

---

# Opportunity Scores

Scoring dimensions: User Pain, Strategic Fit, Novelty, Evidence Strength, Reuse Potential, Implementation Effort controllability, Security/Privacy/Cost Risk controllability.

| Candidate | Score | Disposition |
|---|---:|---|
| Provisional Effect Simulation + Deferred Approval + Actual-vs-Simulated Receipt | **91/100** | **UPDATE existing `autodev-ng #12`**; no duplicate issue |
| Cross-vendor Agent Control Contract Composition (registry/principal/env/effect/cost/attention) | **90/100** | Research synthesis only; already distributed across #17/#21/#12/lobsterpulse #9 |
| Observation-aware outbound policy / data lineage affecting effect policy | **89/100** | Research list under #12; no broad IFC implementation yet |
| Agent-client hosted OAuth consent surface | **88/100** | Existing `cf-mcp-server #9`; active PR #13, central report only |
| Source-preserving document→deck transformation with evidence invalidation | **87/100** | Existing `ppt-studio #3`; no new issue |
| `soundbox-offline` NetworkLibrarySource (SMB/WebDAV) + cache/offline receipt | **86/100** | Research list; blocked by recovery/CI reliability priorities |
| Generic “AI Control Plane dashboard” | **77/100** | **REJECT as standalone feature**; risks duplicating canonical state and vendor branding |

---

# Opportunity Map — All 37 Products

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| `cf-ai-router` | Honest provider/model availability | Evidence-backed retry/fallback/freshness | Reliability + lifecycle truth across providers | Control-plane model/cost routing signal | Add providers without health/lifecycle evidence |
| `soundbox-offline` | Stable local/offline playback and recovery | Import/source integrity + authoritative CI | No-account/local-first ownership | SMB/WebDAV `NetworkLibrarySource` after blockers | Native-platform sprawl or cloud account requirement |
| `police-exam-archive` | Source-linked exam archive | Attempt/deadline/history truth | Public-exam provenance + focused workflow | Versioned blueprint migration | More modes without content/source quality |
| `skill-foundry` | Reproducible Skill validation | Installed-state read-back and drift detection | Certification + distribution receipt | Control-plane skill inventory | Marketplace before runtime compatibility truth |
| `prompt-autoresearch` | Repeatable evaluation | Variance/confidence-aware comparisons | Evidence-first prompt research | Cross-model eval harness | Single-run “winner” promotion |
| `lobsterpulse` | Accurate provider/session status | Decision-only attention compression | Correlated human decision queue | Deferred effect approvals from #12 | AI summary on every raw event |
| `tick-stock-panel` | Accurate source/freshness state | Partial/coverage truth and stale handling | Lightweight evidence-backed monitoring | Governed source entitlements | Enterprise finance breadth before data truth |
| `clinical-scribe-worker` | Reviewable note revisions | Section-scoped repair with stale-input handling | Minimal repair blast radius + receipts | Observation-aware PHI effect policy | Autonomous external writes / silent overwrite |
| `avatar-vfo` | Reproducible asset/output state | Clear candidate/canonical workflow | Lightweight controlled avatar/voice workflow | Reversible session edits | Generic agent platform expansion |
| `adng-memory` | Deterministic retrieval and scope | Memory revision/provenance/expiry | Evidence-linked operational memory | Observation lineage feeding policies | Infinite retention or unscoped prompt injection |
| `ai-flight-radar` | Quote/source freshness and total trip truth | Typed watch state + reconfirm before booking | Transparent fare intelligence | Post-booking reprice candidate research | Auto-purchase / stale price claims |
| `taiwan-intel-dashboard` | Verifiable source/date/evidence | Freshness/coverage/source-health | Taiwan public-intelligence evidence graph | Headless evidence distribution | Generic chat without traceability |
| `note-filler` | Correct structured field mapping | Candidate-vs-canonical diffs | Provenance-aware structured completion | Reusable source-preserving transform | Silent field overwrite |
| `cyber-prep-coach` | Correct exam content/version | Progress migration across blueprint revisions | Mastery tied to source/version | Exam-version lifecycle | Mode proliferation |
| `UkePack` | Editable/exportable creative output | Reversible candidate revisions | Human-led music workflow | Session/reference tray pattern | Replace author intent with opaque generation |
| `autodev-ng` | Reliable task/engine/worktree/review/cost truth | Cross-engine principal/env/effect evidence | Composable agent control contracts | Provisional effect world + deferred approval | New generic control-plane UI duplicating state |
| `ai-novel-workstation` | Canonical manuscript continuity | Branch/revision/character-state consistency | Long-form continuity + reversible edits | Provisional creative branch workflows | Auto-promote generated text |
| `herdr-skills` | Reusable/evaluable Skill state | Correction→candidate→test→promotion | Multi-agent learning without silent activation | Demonstration capture + certified distribution | Learned rule gaining permissions |
| `video-timeline-pipeline` | Timestamp/source-faithful transcript/OCR | Replay/cache/freshness and partial failure truth | Multi-modal video→knowledge provenance | More governed source adapters | Turn into generic video editor |
| `chatgpt-dual-pipeline` | Clear model/run attribution | Independent-review evidence | Dual-model disagreement/verification workflow | Principal/runtime lineage | “Two models” treated as independent if credentials/runtime are shared |
| `claude-mem` | Useful scoped memory retrieval | Stale/contradictory memory handling | Provenance-aware long-term memory | Policy based on observed information classes | Dump entire history into every prompt |
| `lplrs-judicial-sync` | Exact legal/judicial source identity | Conflict/freshness/version receipts | Legal evidence synchronization | Research-bundle identity pattern | Flatten UNKNOWN/partial into authoritative answer |
| `internship-notes-sites-mirror` | Reliable source→site publish | Revision/read-back verification | Simple traceable publishing mirror | Source-preserving transformation | CMS feature bloat |
| `MaterialYouNewTab` | Fast, private new-tab/workspace core | Workspace/session restore truth | Local-first personal workspace | URL-only Session Capsule | Full browser/tab manager or broad history permission by default |
| `taichung-police-intel` | Current verified events/source health | Evidence publication/read-back | Police briefing with explicit provenance | WebMCP/headless evidence contract | Autonomous actions outside intelligence scope |
| `ninax-line-hermes` | Correct LINE message identity/delivery | Typed read/reply/send capability | Channel-specific receipts + bounded agent bridge | Deferred reply candidates | “Connected LINE” = unrestricted send/delete |
| `92-duty-scheduler` | Constraint-valid schedules | Candidate/approval/canonical mutation | Explainable schedule changes + receipts | Deferred approval queue for swap proposals | Agent directly mutating canonical roster without approval |
| `voice-actress` | Rubric/source-linked scoring | Answer revision + rubric revision binding | Police/law essay evidence scoring | Source-preserving feedback transformation | Generic LMS breadth |
| `project-doctor-web` | Evidence-backed diagnosis | Candidate repair plans + runtime verification | Project health truth | Decision-only attention for actionable findings | Auto-fix based only on static diagnosis |
| `flux-image-gen` | Reliable generation/edit/history | Creative Edit Session + Reference Tray (#22) | Reference roles + revision lineage | Branch/compare/rollback | Repeated edit overwriting clean parent |
| `neciken-summer-poem` | Simple authoring/revision | Preserve user voice and revisions | Lightweight literary workflow | Candidate alternative lines | Agent-workflow bloat |
| `minideck` | Editable presentation output | Source-preserving transformations | Lightweight deck creation | Evidence drawer where source-backed | Enterprise collaboration suite cloning |
| `police-exam-practice` | Correct questions/answers/sources | Attempt state + explanations | Focused police-exam practice | Blueprint/version receipts | 15-mode home screen |
| `ppt-studio` | Secure local editing/import/export | Claim/slide provenance (#3) + fix P1 auth/CI first | Evidence-backed editable decks | Adobe-like source-preserving layout transforms | Remote agent/collab expansion before auth gate is clean |
| `exam-archive` | Stable searchable source archive | Canonical identity/versioning | Minimal exam corpus truth | Shared archive identity across practice apps | AI generation without source labels |
| `academic-mcp` | Multi-source academic retrieval | Canonical identity, partial/rate-limit truth (#1) | Replayable Research Bundle Ledger | Observation-aware research provenance | Flatten source disagreement / 429 into “no result” |
| `cf-mcp-server` | Exact auth, MCP compatibility, audit/confirmation | Runtime browser OAuth + gradual rollout verification | Evidence-bound Cloudflare operations | Managed consent surface pattern | Duplicate #9 while PR #13 active; central gateway assumed to cover every effect |

---

# Top 10 Cross-Portfolio Ideas

1. **Provisional Effect / Deferred Approval / Actual-vs-Simulated Receipt** — new this round; update #12.
2. **Composable control contracts instead of a monolithic “control plane”:** Principal (#17) + Environment (#21) + External Effect (#12) + Attention (`lobsterpulse #9`) + cost/evidence/lifecycle.
3. **Observation-aware effect policy:** what an agent has read can change what it may later disclose/share/write; research carefully, do not pretend UNKNOWN lineage is public.
4. **Decision-only operator queues:** raw events/effects should be compressed into actual decisions, with receipts for ACK/SNOOZE/RESOLVE/APPROVE/REJECT.
5. **Dedicated OAuth consent surface for agent clients:** treat consent/onboarding as a first-class workflow distinct from root credentials and tool invocation.
6. **Source-preserving transformations:** source identity/evidence should survive document→deck/note/report transformations and invalidate when edits break support.
7. **Certified Artifact → Install/Read-back/Drift Receipt:** keep skill/plugin/runtime distribution state separate from portable file format.
8. **First-class source adapters instead of repeated import/copy:** media/research/intel tools can browse source systems while cache/offline policy stays explicit.
9. **Canonical identity + source-specific observations:** preserve partial/rate-limited/stale/unknown rather than collapsing to one confident result.
10. **Restore/apply receipts:** restoring a workspace/session/source should report what was actually restored vs only reopened/referenced.

---

# Ideas Rejected / Deferred

1. **Create a new `autodev-ng` “AI Control Plane” feature/dashboard** — rejected. Salesforce/ServiceNow/Microsoft market language validates the category, but Reese-max already has the underlying primitives and three control surfaces. A new UI would risk a second source of truth.
2. **Treat Cloudflare Gatekeeper simulation as execution evidence** — rejected. Simulation stays provisional until current-state revalidation + actual receipt.
3. **Batch approve all dependent effects after validating only the first effect** — rejected. Every effect/dependency must remain individually bound and revalidated.
4. **Implement full dynamic information-flow control immediately** — deferred. Observation-aware policy is valuable but needs bounded data classes, privacy constraints and runtime proof.
5. **Open a new `cf-mcp-server` managed-consent Issue** — rejected as duplicate/competing work. #9 has active PR #13.
6. **Add SMB/WebDAV to `soundbox-offline` immediately** — deferred until recovery-integrity P0 and authoritative CI/test gate are resolved.
7. **Add remote presentation collaboration/agent execution to `ppt-studio` now** — rejected while P1 auth/CI boundary remains unresolved. Adobe signal strengthens provenance, not remote breadth.
8. **Copy Salesforce pricing/enterprise governance breadth** — rejected. Packaging for new Harness capabilities is not yet final, and Reese-max products are mostly focused/personal workflows.
9. **Copy Trove's Apple-only product shape** — rejected. Transfer the source/cache/ownership principle, not platform lock-in.
10. **Create issues to meet a quota** — rejected; this round deliberately updated one existing high-value fingerprint and kept lower-confidence ideas in research/deferred lists.

---

# Issue Mapping / Cross-Schedule Coordination

| Product / Issue | This round | Coordination reason |
|---|---|---|
| `autodev-ng #12` Egress / External-Effect Firewall | **UPDATED** with Provisional Effect Simulation + Deferred Approval + Actual-vs-Simulated Receipt research | Same stable effect-control fingerprint; no matching Issue/PR found; issue comments contained no active `github-issue-lock:v1` claim |
| `autodev-ng #17` Principal/Credential Lease | Evidence strengthened only | Salesforce/ServiceNow market convergence validates identity/lifecycle separation; no new Issue |
| `autodev-ng #21` Execution Environment Handoff | Evidence strengthened only | Control planes increasingly span heterogeneous execution surfaces; no new Issue |
| `lobsterpulse #9` Decision-only Attention Queue | Evidence strengthened only | Deferred approvals can feed decision queue; effect policy stays owned by #12 |
| `cf-mcp-server #9` Browser OAuth owner approval | **CENTRAL REPORT ONLY** | Active PR #13 already implements browser-usable approval; do not compete or steal work |
| `soundbox-offline #1/#4` + existing import work | Research/deferred only | Current audit still NOT CLEAN; recovery/CI truth precedes NAS feature |
| `ppt-studio #3` Claim provenance | Evidence strengthened only | Adobe source-preserving transform validates direction; auth/CI blocker remains higher priority |
| `skill-foundry #4` Distribution/install receipt | No change | Salesforce control-plane “capability registry” signal is not enough to duplicate its scope |
| `academic-mcp #1` Research Bundle Ledger | No change | Source-specific observation/provenance direction remains aligned |
| `flux-image-gen #22` Creative Edit Session | No change | No stronger non-duplicate image workflow signal than prior round |

### Duplicate / lock checks performed for the high-value candidate
- Searched `autodev-ng`, `lobsterpulse`, and `cf-mcp-server` Issues for `simulation approval effect egress provisional deferred`: no matching Issue.
- Searched all-state `autodev-ng` PRs for the same fingerprint: no matching PR.
- Read existing `autodev-ng #12` comments; no active `github-issue-lock:v1` claim was present.
- Therefore updating #12 was appropriate; a new Issue would have been duplication.

---

# Sources

## CONFIRMED / first-party or current product
1. Salesforce Enterprise AI Harness / AI Control Plane — US announcement 2026-09-10; official translation 2026-09-11  
   https://www.salesforce.com/news/stories/enterprise-ai-harness/  
   https://prtimes.jp/main/html/rd/p/000000399.000041550.html
2. Cloudflare OS — 2026-08-05  
   https://blog.cloudflare.com/cloudflare-os/  
   https://github.com/cloudflare/cloudflare-os/blob/main/README.md
3. ServiceNow AI Gateway / AI Control Tower — 2026-09-10/11 current launch/docs  
   https://www.servicenow.com/community/ai-control-tower-blog/ai-gateway-is-back-what-s-coming-on-september-10th-2026/ba-p/3591141  
   https://www.servicenow.com/community/ai-control-tower-articles/ai-gateway-faq/ta-p/3587429
4. AWS AgentCore Identity managed consent portal — 2026-09-01  
   https://aws.amazon.com/about-aws/whats-new/2026/09/amazon-bedrock-agentcore/
5. Adobe Acrobat Productivity Agent — 2026-09-09  
   https://news.adobe.com/news/2026/09/adobe-productivity-agent-in-acrobat-now-transforms-complex-documents
6. Trove Player current product / FAQ — Mac since September 2026  
   https://troveplayer.com/  
   https://troveplayer.com/faq

## Independent / evidence-boundary cross-check
7. Salesforce rollout caveat — 2026-09-11  
   https://kaleidofield.com/news/salesforce-enterprise-ai-harness-control-plane-rollout

## COMMUNITY_SIGNAL
8. Cloudflare OS async-approval simulation verification question — opened 2026-08-11  
   https://github.com/cloudflare/cloudflare-os/issues/151

---

# What Changed Since Last Radar

Previous `2026-09-12-external-radar.md` centered on `flux-image-gen #22` Creative Edit Session / Reference Tray and the broader principle that generated output should become a traceable, reversible next-step input.

This r2 changes the portfolio picture in four ways:

1. **Agent governance architecture is converging across major vendors.** Salesforce's 2026-09-10 Harness/Control Plane and ServiceNow's current AI Gateway reinforce the Reese-max strategy of keeping identity, execution environment, effect policy, attention, cost and evidence as separate canonical contracts rather than hiding them inside a single agent UI.
2. **The most useful new workflow is not another permission dialog, but asynchronous safe progress.** Cloudflare OS Gatekeepers show a product path between “block the run at every effect” and “dangerously auto-approve everything.” Reese-max's improvement is stricter: a simulated effect creates only a provisional world, and actual execution requires current-state revalidation plus a real receipt.
3. **OAuth onboarding is becoming a dedicated agent product surface.** AWS AgentCore's managed consent portal validates `cf-mcp-server #9`; because #9 already has active PR #13, this radar intentionally did not touch it.
4. **Local-first product competition is expanding beyond single-device import.** Trove's September Mac release plus SMB/WebDAV and one-time pricing provides a credible future direction for `soundbox-offline`, but the existing recovery/CI blockers still take precedence.

No new Issue was created this round. One existing high-value Issue (#12) was updated because the external signal maps to the same stable fingerprint and passed duplicate/PR/lock checks.
