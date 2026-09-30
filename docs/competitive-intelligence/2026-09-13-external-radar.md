# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-13

> Scope: repositories owned by `Reese-max`, not archived, and reasonably product-like.  
> Evidence discipline: public web outside Reese-max GitHub is the primary research source; connected GitHub is used for current product truth, recent repository state, duplicate/PR/lock coordination, and persistence.  
> Confidence labels: **CONFIRMED** = first-party product/docs/release or current repository evidence; **LIKELY** = strong inference/announcement not fully runtime-verified; **COMMUNITY_SIGNAL** = anecdotal user/practitioner evidence only; **UNKNOWN** = insufficient evidence.  
> Vendor marketing metrics are treated as product/packaging signals, not as Reese-max effectiveness evidence.

## Executive Summary

This round rechecked the active Reese-max portfolio and retained **37 non-archived product-like repositories**. The highest-value new opportunity is not another model/provider integration. It is an interface-lifecycle contract for MCP tools:

**`Approved Server Identity ≠ Approved Tool Contract`**.

Boomi Agentstudio now treats remote MCP tool definitions as mutable managed artifacts: when a server changes a tool, description, or parameters, imported tools become **Stale**, newly discovered/removed tools get separate states, and operators review changes before accepting updates. Vercel previously reached the same architectural conclusion from another direction by converting remote MCP definitions into static code snapshots so tool names/descriptions/argument schemas change only when explicitly updated. A 2026-08-02 longitudinal study of the official MCP registry further supports content-binding: descriptor/description hashes should be revalidated when content moves, because version/history-ranked re-auditing alone under-covers change.

This directly fits `cf-mcp-server`, whose README already states that new tools appear only after server release **and client tool-catalog refresh**, and whose product already distinguishes L1 read, L2 preview/safe-write and L3 dangerous effects. The missing layer is a deterministic server-side artifact that says exactly **what model-visible/schema/effect contract changed between releases** and whether the change is additive, breaking, or authority-expanding.

A new Research issue was therefore created:

- `Reese-max/cf-mcp-server #15` — **Tool Contract Manifest + Drift Gate**
- Opportunity Score: **94/100**
- Stable workflow:  
  `Tool registration source → Canonical ToolContractManifest → ToolContractDiff → CI/release classification → published catalog digest → client refresh/read-back → ToolContractReceipt`

This does **not** replace `cf-mcp-server #6`, which covers MCP 2026-07-28 wire protocol/SDK/CIMD/conformance compatibility. It also does not claim a server-side digest can force ChatGPT/Claude/other clients to reapprove tools. Unsupported client enforcement must remain `UNENFORCED/UNKNOWN`, while L2/L3 runtime confirmation stays independent.

The direct academic-research market also continued to shift. Consensus' 2026-09-09 product summary says it is moving from search toward a persistent research workspace that plans/executes multi-step tasks, while Scite added MCP citation-graph traversal on 2026-09-09 and is packaging a Publisher Gateway where paywalled full text is searchable for discovery but not returned. These are useful signals for `academic-mcp`, but **do not justify a duplicate Research Agent UI**: its current moat is local/self-hosted heterogeneous upstream semantics, truthful partial failure, full text/LaTeX/citations, and the existing #1 canonical identity/research-bundle ledger. The more transferable new pattern is to keep **searchability, entitlement and returned evidence separate**.

**Notification gate: MET.** A high-value cross-portfolio capability was found and formalized as a non-duplicate Research issue.

---

# Portfolio Discovery / Product → Market Category

Current active product-like portfolio remains **37 repositories**.

| Product | Market / primary JTBD | Current radar priority |
|---|---|---|
| `exam-archive` | exam archive/search | Source completeness, version/provenance and retrieval truth. |
| `police-exam-practice` | police-exam practice | Official answer provenance, progress continuity, wrong-answer repair. |
| `police-exam-archive` | Taiwan police-exam archive | Provenance/completeness/search traceability. |
| `92-duty-scheduler` | duty/workforce scheduling | Constraint truth, explainable conflicts, one canonical schedule state. |
| `UkePack` | music/ukulele creative tooling | Reversible candidate→canonical assets; avoid generic AI-suite expansion. |
| `ppt-studio` | presentation generation/studio | Auth/CI reliability + provenance before remote-agent breadth. |
| `voice-actress` | legal/knowledge answer workflow | `Citation exists ≠ citation supports claim`; source-backed reasoning. |
| `taiwan-intel-dashboard` | Taiwan intelligence dashboard | Freshness/coverage/evidence + attention compression. |
| `autodev-ng` | multi-engine autonomous-development control plane | Compose principal/environment/effect/browser/tool contracts rather than add a monolithic control plane. |
| `flux-image-gen` | image generation/edit workflow | Session/reference lineage; candidate/branch/compare/rollback. |
| `claude-mem` | coding-agent memory | Provenance, freshness, activation/supersession; not raw transcript accumulation. |
| `lobsterpulse` | agent/provider operations monitoring | Decision-only attention; do not add raw alert volume. |
| `prompt-autoresearch` | prompt research/evaluation | Independent train/test evidence; avoid self-feedback drift. |
| `neciken-summer-poem` | narrow creative/literary experience | Preserve artistic identity and authorship/version control. |
| `note-filler` | document/note automation | User-owned vs AI-candidate fields, source-backed fill, review. |
| `lplrs-judicial-sync` | judicial-data synchronization | Target-date coverage receipt, no-success alert, backfill/gap truth. |
| `adng-memory` | agent operational memory/state | Staleness/supersession/deletion/activation lifecycle. |
| `cyber-prep-coach` | cybersecurity exam prep | Dataset integrity, official blueprint/version migration, fewer modes. |
| `cf-ai-router` | AI gateway/provider routing | Provider capability/reliability/cost truth; no silent paid fallback. |
| `avatar-vfo` | avatar/visual output | Versioned asset lineage and reversible candidate→canonical flow. |
| `project-doctor-web` | software/project diagnosis | Failure→repro→verification; no false-green diagnosis. |
| `minideck` | lightweight deck generation/share | Publication-boundary and CI truth before feature expansion. |
| `chatgpt-dual-pipeline` | dual-model/reviewer pipeline | Independent evidence/reviewer roles and explicit handoff states. |
| `internship-notes-sites-mirror` | publishing/mirror | Source/freshness sync, stable publishing. |
| `taichung-police-intel` | municipal/police intelligence monitoring | Source coverage/evidence + decision-only attention. |
| `soundbox-offline` | local/offline music player | Recovery/integrity before NAS/network-source breadth. |
| `skill-foundry` | Skill creation/evaluation/certification | Quality/runtime/security + distribution/install receipts. |
| `video-timeline-pipeline` | video intelligence → production handoff | Evidence-backed NLE handoff and target read-back; avoid building an NLE. |
| `ai-novel-workstation` | long-form writing workstation | Typed story reads/candidate patches; CI prerequisite. |
| `clinical-scribe-worker` | clinical drafting/validation | Source-backed draft, user ownership, human review, privacy. |
| `MaterialYouNewTab` | new-tab productivity/workspace | Session Capsule research; local-first + optional permissions. |
| `cf-mcp-server` | MCP/Cloudflare integration | **NEW: Tool Contract Manifest + Drift Gate; protocol compatibility and effect authority remain separate.** |
| `tick-stock-panel` | market/portfolio panel | Coverage/freshness/partial-data truth before broad finance AI. |
| `herdr-skills` | agent Skill orchestration/reuse | Package/security/runtime/distribution evidence; no copied-skill trust shortcut. |
| `ninax-line-hermes` | LINE/agent workflow integration | Purpose-bound external effects, recipients, receipts. |
| `ai-flight-radar` | flight watch/fare intelligence | Quote/source health, total-trip cost, watch/reconfirm; no auto-buy. |
| `academic-mcp` | academic research aggregation/MCP | Canonical paper identity, source-status truth, replayable research bundles; add entitlement/evidence-span semantics before a generic workspace UI. |

---

# External Signals

## A. Direct competitor signal — academic research is becoming a persistent, multi-step workspace

### Consensus — Summer '26 update
**CONFIRMED — 2026-09-09**  
https://consensus.app/home/blog/what-has-changed-in-consensus-summer-26/

Consensus now explicitly positions itself as more than a search engine: a research workspace that plans and executes multi-step tasks using semantic/paper search, DOI lookup, citation-graph traversal and related tools. Its current help docs also describe carrying context across follow-up searches and applying academic filters.

**JTBD:** reduce the tab/tool switching between discovery, filtering, citation tracing and synthesis.

**Why users may save time:** the workflow retains research context instead of forcing one independent query at a time.

**Onboarding/distribution:** Consensus is also available through external AI surfaces/connectors, which reduces the need to leave the user's chosen assistant.

**New pattern:** `Research Question → Query Plan → multiple retrieval/citation tools → curated evidence set → follow-up synthesis`.

**Pricing/business signal:** premium research value increasingly comes from workflow continuity and evidence handling, not just access to a larger search index.

**Limits:** vendor claims about corpus size/accuracy are not used as performance evidence here. A workspace can still hide partial-source failure unless status/provenance remains explicit.

**Reese-max transfer:** `academic-mcp` should preserve tool/source semantics and make evidence sets replayable rather than hide all upstreams behind one opaque synthesized answer.

**Do not copy:** no generic all-in-one research UI until the existing reliability/identity ledger is stable.

### Scite — Citation Surfing with MCP
**CONFIRMED — 2026-09-09**  
https://scite.ai/blog/citation-surfing-scite-mcp

Scite added a `citation_graph` MCP tool that lets agents traverse references backward/forward and inspect citation relationships. This strengthens the market expectation that an academic MCP is not only keyword search; it should support **graph-following research workflows**.

This signal is already substantially covered by `academic-mcp #1` and existing Semantic Scholar/arXiv capabilities, so no duplicate Issue is created.

---

## A2. Direct/adjacent academic business-model signal — searchability, entitlement and returned content are becoming separate layers

### Scite Publisher Gateway
**CONFIRMED — current, checked 2026-09-13**  
https://scite.ai/publisher-mcp-gateway

Scite's Publisher Gateway lets AI search publisher content—including protected/paywalled material for discovery—while returning metadata, abstracts, open-access text and a DOI/resolved version rather than protected full text. It also exposes publisher demand telemetry.

**JTBD:** allow agents to discover relevant literature without violating publisher access boundaries.

**New pattern:**
`Searchable Corpus ≠ Entitled Full Text ≠ Returned Evidence`.

**Transfer to `academic-mcp`:** represent `source_access_state` / `entitlement_state` separately from `paper_found`. If a paper can be identified but full text cannot legally/technically be returned, that is a truthful partial result—not a missing paper and not permission to scrape a paywall.

**Do not copy:** do not turn publisher marketing/demand numbers into quality evidence, and do not add rights-bypass automation.

### Scite pricing
**CONFIRMED — current, checked 2026-09-13**  
https://scite.ai/pricing

Current packaging exposes MCP credits directly: Free includes 25 MCP credits/month, Basic is listed at $20/month billed yearly with 250 MCP credits, Pro at $50/month with 2,500 MCP credits plus API and broader datasets.

This is a **packaging signal only**: research MCP usage is being productized as a metered entitlement. It does not imply Reese-max should add per-call billing.

---

# B. Adjacent transferable workflow — Boomi makes MCP tool drift a first-class lifecycle state

### Boomi Agentstudio: Managing MCP tools
**CONFIRMED — official docs, accessed 2026-09-13**  
https://help.boomi.com/docs/Atomsphere/Platform/Managing_MCP_tools  
https://help.boomi.com/docs/Atomsphere/Platform/Connecting_to_an_MCP_server  
https://help.boomi.com/docs/Atomsphere/Platform/Using_the_MCP_registry

Boomi imports remote MCP tool definitions including tool self-documentation and parameters. When a connected server changes tools, server description or parameters, imported tools become **Stale**. Its management UI distinguishes:
- Active
- Stale
- Not Available
- Newly Discovered

Operators can review what changed and save/update; tools are deliberately not silently auto-updated because definition changes may alter agent behavior and require new guardrails/instructions. The server catalog separately exposes server/version/status such as Active/Deprecated.

### Job-to-be-Done
An Agent operator wants to keep using external tools without silently accepting a changed contract after the original review/approval.

### Why it improves reliability
A reconnect/catalog refresh becomes an explicit lifecycle transition instead of silently replacing model-visible descriptions and argument contracts.

### Onboarding/distribution
The pattern sits at the connection/catalog layer, so developers do not need to manually diff raw JSON every time.

### Automation/integration/provenance pattern
`Server source → imported ToolContract → drift detection → Stale → Review diff → Accept → Active`.

### Pricing/business model signal
This is enterprise governance value: managing third-party Agent capabilities is becoming part of the platform control plane rather than an implementation detail.

### Limitations / what not to copy
Boomi's consumer-side lifecycle cannot be assumed available in ChatGPT/Claude/other clients. Reese-max should not pretend it can enforce reapproval remotely. Also, a trivial wording/format change should not necessarily block a production server: canonicalization and change classes are needed.

### Reese-max fit
This is a direct fit for `cf-mcp-server`: its own release pipeline can create a **ToolContractManifest + deterministic diff** and publish a digest even when the client does not support stale-state governance.

---

# C. Emerging technical possibility / risk — content-bound MCP contracts instead of version-only trust

## Registry Descriptions Go Stale Unevenly
**CONFIRMED research — 2026-08-02**  
https://arxiv.org/abs/2608.00997

The paper reconstructs 120 observations of the official MCP registry over 88.6 days, covering 19,099 distinct servers. Its policy conclusion is narrower and useful: prioritizing re-audits only by previous drift under-covers changes; **content-binding—revalidate when a description hash moves—plus a periodic full sweep** is more appropriate for keeping description-level audits current.

These percentages are **corpus-specific** and are not presented as the prevalence of production compromise.

## Vercel static MCP tool snapshots
**CONFIRMED representative pattern — 2025-09-17 (older but still relevant)**  
https://vercel.com/blog/generate-static-ai-sdk-tools-from-mcp-servers-with-mcp-to-ai-sdk

Vercel's `mcp-to-ai-sdk` rationale is that remote MCP tool names, descriptions and argument schemas enter the Agent prompt and can change unexpectedly. Generating static definitions brings updates under explicit code review/versioning.

**Transferable principle:** treat the model-visible tool interface as a supply-chain artifact, not transient documentation.

## Community signal — MCP schema/description drift
**COMMUNITY_SIGNAL — 2026-09-09 and 2026-09-12; anecdotal, not statistical**  
https://www.reddit.com/r/mcp/comments/1wbcr8q/mcp_tools_can_change_their_descriptionschema/  
https://www.reddit.com/r/mcp/comments/1wedhkt/every_mcp_rugpull_check_i_have_seen_including_my/

Practitioners describe fingerprinting canonicalized `tools/list`, reapproval after schema/description changes and the limitation that a first connection has no prior baseline. This informs threat-model/test cases only; it is not treated as proof of widespread incidents.

---

# New Releases / Recent Changes

| Date | Product / source | Change | Confidence | Reese-max implication |
|---|---|---|---|---|
| 2026-09-09 | Consensus | Summer '26 summary: Research Agent + workspace/multi-step research positioning | CONFIRMED | `academic-mcp`: replayable evidence/workflow matters more than another single search tool. |
| 2026-09-09 | Scite | MCP `citation_graph` for citation surfing | CONFIRMED | Existing paper-identity/bundle work should retain graph provenance; no duplicate feature. |
| current, checked 2026-09-13 | Scite Publisher Gateway | Search protected corpus while withholding protected full text | CONFIRMED | Separate discoverability/access/returned evidence. |
| current, checked 2026-09-13 | Boomi Agentstudio | MCP tool Stale/New/Removed lifecycle and manual review | CONFIRMED | High-value Tool Contract Manifest / drift-gate pattern. |
| 2026-08-02 | MCP registry study | Longitudinal descriptor/description drift measurement | CONFIRMED, corpus-specific | Content hash/revalidation rather than version-only trust. |

---

# Community Pain Points

1. **Tool definition drift after initial approval** — users describe the same server/config returning changed descriptions, schemas or additional tools. **COMMUNITY_SIGNAL**, not population statistics.
2. **Trust-on-first-use blind spot** — drift comparison does not protect the very first observed tool catalog; baseline provenance still matters. **COMMUNITY_SIGNAL**.
3. **Catalog bloat / ambiguous tool selection** — community reports that large flat tool surfaces can degrade routing and increase blast radius when one schema is malformed. **COMMUNITY_SIGNAL**; worth using only as a prompt to keep tools domain-dense, not as a universal threshold.
4. **Academic access ambiguity** — market products increasingly distinguish finding a paper from being entitled to its full text. Reese-max should keep `FOUND`, `ACCESSIBLE_FULL_TEXT`, `ABSTRACT_ONLY`, `RATE_LIMITED`, `UNAVAILABLE` separate rather than collapsing all failure states.

---

# Adjacent Ideas

## 1. `ToolContractManifest` as a reusable artifact
Potential reuse after proving it in `cf-mcp-server`:
- `academic-mcp`: 81-tool upstream gateway and vendored/upstream schema changes.
- `ai-novel-workstation`: typed story tool contract changes.
- `taichung-police-intel`: evidence-MCP tool surface.
- `autodev-ng`: client-side tool approval/fingerprint in execution receipts.
- `skill-foundry`: target runtime/tool compatibility evidence.

**Rule:** do not prematurely build a shared framework; prove the manifest/diff/release gate in one server first.

## 2. Academic `EvidenceAccessState`
Candidate state model:
`IDENTIFIED → METADATA_ONLY | ABSTRACT_AVAILABLE | OPEN_FULL_TEXT | ENTITLED_FULL_TEXT | RATE_LIMITED | UNAVAILABLE | UNKNOWN`.

This can prevent “paper exists” from being conflated with “we can quote or supply its full text.”

## 3. Research bundle as persistent workspace without a second database
Consensus' workspace move validates `academic-mcp #1`'s research-bundle ledger direction. The transferable part is durable query/evidence state; the part to reject is a generic collaborative UI before reliability, identity and provenance gates are complete.

---

# Opportunity Scores

| Candidate | Score | Disposition | Rationale |
|---|---:|---|---|
| `cf-mcp-server` Tool Contract Manifest + Drift Gate | **94** | **ISSUE CREATED: #15** | Strong official adjacent pattern, direct repo fit, high cross-portfolio reuse, non-duplicate of protocol #6. |
| `academic-mcp` EvidenceAccessState + exact evidence-span semantics | **89** | Research list | Strong product signal from Scite/Consensus, but should extend #1/reliability work rather than create a second platform now. |
| Cross-portfolio client-side tool reapproval/pinning | **88** | Defer | Valuable, but first prove server-side manifest truth; enforcement differs by client. |
| `academic-mcp` full “Research Agent workspace” clone | **76** | Reject/defer | High market relevance but duplicates external products and expands UI/synthesis before current reliability/identity work. |
| Generic MCP marketplace/catalog | **69** | Reject | Weak differentiation; high maintenance/trust cost; conflicts with current product focus. |

---

# Opportunity Map — all 37 products

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| `exam-archive` | Official source/version truth | Search + source traceability | Taiwan exam-specific provenance | Evidence access-state vocabulary | Generic AI answer layer without source truth |
| `police-exam-practice` | Official answer provenance | Resume/progress/error repair | Exam-specific mastery | Blueprint version migration receipts | More practice modes for their own sake |
| `police-exam-archive` | Completeness/source date | Retrieval provenance | Police-exam canonical archive | Evidence bundle export | Opaque summaries replacing originals |
| `92-duty-scheduler` | Constraint-valid schedule | Explain conflicts + revision diff | Canonical schedule state | Generated task views over same schedule | AI-owned duplicate schedule database |
| `UkePack` | Reversible edits | Candidate compare/rollback | Narrow music workflow | Typed creative operations | Generic creative-suite sprawl |
| `ppt-studio` | Auth/CI/source truth | Claim→evidence→slide provenance | Structured deck pipeline | Typed external editor handoff | Remote agent breadth before fail-closed auth |
| `voice-actress` | Citation/source existence | Citation-support verification | Legal source-backed reasoning | Evidence-span receipt | “citation present = answer correct” |
| `taiwan-intel-dashboard` | Freshness/coverage status | Decision-only attention | Taiwan public-source fusion | Evidence-access states | Raw feed/alert volume as value |
| `autodev-ng` | Principal/environment/effect truth | Tool-contract fingerprints in receipts | Composable agent contracts | Consumer-side MCP contract pinning | One monolithic AI control plane |
| `flux-image-gen` | Version lineage | Session/reference continuity | Candidate branch/compare | Typed external creative target | More models before workflow truth |
| `claude-mem` | Provenance/freshness | Supersession/activation | Inspectable coding memory | Contract fingerprint for tool-created memories | Raw transcript hoarding |
| `lobsterpulse` | State freshness | Correlate/dedupe/attention queue | Decision-only monitoring | Tool-contract drift as actionable signal | AI summary on every event |
| `prompt-autoresearch` | Independent eval | Train/test separation | Evidence-backed prompt optimization | Tool-contract pin during experiments | Recursive self-feedback as quality proof |
| `neciken-summer-poem` | Authorship/version truth | Minimal reversible edits | Deliberate literary identity | Candidate branch | Generic AI writing workspace |
| `note-filler` | Field/source provenance | User-owned fields never overwritten | Reviewable candidate fill | EvidenceAccessState for source docs | Silent auto-fill of uncertain fields |
| `lplrs-judicial-sync` | Target-date coverage | Missing-window/gap receipt | Judicial-date semantics | Source schema manifest | Schedule-run green = data complete |
| `adng-memory` | Lifecycle/freshness | Supersession/deletion receipts | Agent operational memory | Tool contract as memory provenance | Append-only memory without invalidation |
| `cyber-prep-coach` | Dataset integrity | Official exam-version migration | Exam-focused adaptive repair | Evidence bundles per topic | Mode explosion |
| `cf-ai-router` | Provider capability/cost truth | Explicit failover reason/receipt | No silent paid fallback | Provider contract manifest | “model available = equivalent capability” |
| `avatar-vfo` | Asset lineage | Candidate promotion/rollback | Reversible avatar workflow | External editable-target handoff | Flattened output as only artifact |
| `project-doctor-web` | Reproducible diagnosis | Verification read-back | Failure→evidence→repair | Tool schema compatibility gate | UI green without runtime proof |
| `minideck` | Draft/published truth | CI actually runs | Small deterministic deck surface | Provenance-preserving external target | Feature expansion before publication gate |
| `chatgpt-dual-pipeline` | Independent roles | Handoff/evidence receipts | Reviewer separation | Pin tool-contract version per stage | Two models agreeing = correctness |
| `internship-notes-sites-mirror` | Source/freshness sync | Drift detection | Stable mirror/publish | Manifest of source→published revision | Silent stale mirror |
| `taichung-police-intel` | Coverage/source provenance | Attention compression | Municipal/police evidence model | Evidence MCP contract digest | New control surface duplicating existing workflow |
| `soundbox-offline` | Recovery/integrity | Offline truth | Local-first playback | Network-source receipt later | NAS breadth before recovery gate |
| `skill-foundry` | Eval/runtime/security separation | Install/read-back/drift | Certified skill pipeline | Tool contract as runtime compatibility evidence | “format valid = safe/installed” |
| `video-timeline-pipeline` | Evidence→timecode truth | Target capability/read-back | NLE handoff without rebuilding NLE | Typed editor tool manifest | Free-form destructive NLE authority |
| `ai-novel-workstation` | Canonical story state | Exact-base candidate patches | Typed agent story workspace | Tool contract version for external agents | Raw filesystem authority |
| `clinical-scribe-worker` | Source/privacy/human review | User-owned vs AI-candidate | Clinical evidence draft | Access/entitlement state for records | Autonomous finalization |
| `MaterialYouNewTab` | Local-first/optional permissions | Session restore truth | Minimal-permission workspace | Browser capability/session receipt | Broad history/all-URLs permissions by default |
| `cf-mcp-server` | Protocol/auth/effect truth | **Tool contract manifest + drift classification** | L1/L2/L3 semantic contract tied to release evidence | Client reapproval/pinning where supported | Auto-trust latest catalog / semver-only trust |
| `tick-stock-panel` | Coverage/freshness/partial truth | Source/entitlement status | Truthful market panel | Research-style EvidenceAccessState | Broad AI advice before data coverage |
| `herdr-skills` | Runtime/security/package truth | Installed-revision/read-back | Multi-agent skill orchestration | Tool-contract fingerprints | Copied skill = trusted capability |
| `ninax-line-hermes` | Recipient/effect truth | Exact send receipt | Purpose-bound messaging | Tool schema authority diff | “connected account = permission to send anything” |
| `ai-flight-radar` | Quote/source freshness | Reconfirm + total-trip cost | Evidence-backed watch | Entitlement/access status per source | Auto-buy / unsupported repricing assumptions |
| `academic-mcp` | Canonical paper identity + truthful source status | **EvidenceAccessState + exact evidence span** | Local/self-hosted heterogeneous upstream semantics | Research workspace/bundle continuity | Opaque all-in-one synthesis or paywall bypass |

---

# Top 10 Cross-Portfolio Ideas

1. **Tool Contract Manifest + Drift Gate** — model-visible/schema/effect interface changes become reviewable release artifacts.
2. **Purpose-bound External Effect** — task intent does not automatically grant alternate write surfaces.
3. **Execution Environment Contract** — portable task intent, explicit environment mismatch/read-back.
4. **Browser Capability Lease** — reachability, tab control and external-effect authority remain separate.
5. **Decision-only Attention Queue** — raw events are not automatically human work.
6. **Certified Artifact Distribution Receipt** — valid/certified does not mean installed/active/current.
7. **Candidate → Target Mutation → Read-back** — applied operation must be verified at the canonical downstream target.
8. **Generated Output → Editable Session/Revision** — outputs should become controlled next-step inputs, not dead-end files.
9. **EvidenceAccessState / Claim→Evidence Span** — identification, access and support are independent truths.
10. **Coverage / Gap Receipts** — scheduled or connected does not mean the expected data/time window is complete.

---

# Ideas Rejected / Deferred

- **Generic MCP marketplace/catalog** — weak differentiation and creates a new curation/security burden.
- **Auto-accept latest MCP tools** — directly contradicts the external stale-tool pattern and content-binding evidence.
- **Semver-only trust** — tool content can move independently of the version label; version remains metadata, not the integrity boundary.
- **Block every wording change** — too noisy. Canonicalization/change classes are required.
- **Treat ToolContractManifest as runtime authorization** — rejected. Detection/review does not replace L2/L3 effect enforcement.
- **Copy Consensus/Scite as an all-in-one research SaaS** — `academic-mcp` should strengthen local/replayable/source-truth contracts first.
- **Paywall scraping/bypass** — searchability and entitlement must stay separate.
- **Add more academic providers before P1 reliability/identity work** — deferred.
- **Centralize every product into one shared contract framework now** — premature abstraction; prove the pattern in `cf-mcp-server` first.

---

# Issue / PR Mapping

## New
- **`Reese-max/cf-mcp-server #15`** — `[Competitive Inspiration][Research][RESEARCH_REQUIRED][MCP][CONTRACT] Tool Contract Manifest + Drift Gate` — **created this round**.

## Existing relevant work, no duplicate created
- `cf-mcp-server #6` — MCP 2026-07-28 protocol/SDK/CIMD/discovery/conformance migration. **Distinct:** wire/protocol compatibility vs semantic tool-contract evolution.
- `cf-mcp-server #7–#11` — provider boundary, staged deployment, browser approval, identity/auth work. Existing priorities remain.
- `cf-mcp-server PR #14` — canary deployment / health-gated promotion; open and distinct from #15.
- `academic-mcp #1` — Canonical Paper Identity + Research Bundle Ledger; absorbs much of the Consensus/Scite workflow signal.
- `academic-mcp #2` — host-independent integrity/integration gate.
- `academic-mcp #3` — recovery/unattended cold start.
- `academic-mcp #4` — home/privacy isolation.
- `skill-foundry #4` — Certified Skill Distribution + Install Receipt; adjacent but different artifact layer.
- `autodev-ng #12/#17/#21/#28` — effect, principal, environment and browser capability contracts; no duplicate “MCP control plane” issue.

### Duplicate / lock coordination
Before #15 was created, searches covered open/closed Issues and all-state PRs for MCP schema/tool/catalog/contract drift fingerprints. No identical Issue/PR was found, and no matching `github-issue-lock:v1` active fingerprint was found. This round did not modify any active implementation PR, branch, product source, deployment, secrets, permissions or repository settings.

---

# Sources

| Status | Date | Source | URL | Used for |
|---|---|---|---|---|
| CONFIRMED | 2026-09-09 | Consensus — What's Changed in Consensus (Summer '26) | https://consensus.app/home/blog/what-has-changed-in-consensus-summer-26/ | Direct academic competitor / workspace strategy |
| CONFIRMED | 2026-05-12, current docs checked 2026-09-13 | Consensus Research Agent docs | https://help.consensus.app/en/articles/12641232-research-agent | Multi-step research workflow |
| CONFIRMED | 2026-09-09 | Scite — Citation Surfing with Scite MCP | https://scite.ai/blog/citation-surfing-scite-mcp | Citation graph tool |
| CONFIRMED | checked 2026-09-13 | Scite Publisher Gateway | https://scite.ai/publisher-mcp-gateway | Searchability vs entitlement/content |
| CONFIRMED | checked 2026-09-13 | Scite Pricing | https://scite.ai/pricing | Packaging / MCP credit signal only |
| CONFIRMED | checked 2026-09-13 | Boomi — Managing MCP tools | https://help.boomi.com/docs/Atomsphere/Platform/Managing_MCP_tools | Stale/active/new/removed tool lifecycle |
| CONFIRMED | checked 2026-09-13 | Boomi — Connecting to an MCP server | https://help.boomi.com/docs/Atomsphere/Platform/Connecting_to_an_MCP_server | Imported self-documenting tools + stale review |
| CONFIRMED | checked 2026-09-13 | Boomi — MCP Server Catalog | https://help.boomi.com/docs/Atomsphere/Platform/Using_the_MCP_registry | Version/status/catalog governance |
| CONFIRMED | 2025-09-17 | Vercel — `mcp-to-ai-sdk` | https://vercel.com/blog/generate-static-ai-sdk-tools-from-mcp-servers-with-mcp-to-ai-sdk | Static/pinned tool-contract pattern |
| CONFIRMED, corpus-specific | 2026-08-02 | arXiv 2608.00997 | https://arxiv.org/abs/2608.00997 | Longitudinal MCP descriptor/description drift |
| COMMUNITY_SIGNAL | 2026-09-09 | Reddit r/mcp — schema/description drift thread | https://www.reddit.com/r/mcp/comments/1wbcr8q/mcp_tools_can_change_their_descriptionschema/ | Practitioner pain/test cases only |
| COMMUNITY_SIGNAL | 2026-09-12 | Reddit r/mcp — first-list baseline blind spot | https://www.reddit.com/r/mcp/comments/1wedhkt/every_mcp_rugpull_check_i_have_seen_including_my/ | TOFU limitation/test case only |

---

# What Changed Since Last Radar (2026-09-12 r8 → 2026-09-13)

1. **New high-value opportunity formalized:** `cf-mcp-server #15` Tool Contract Manifest + Drift Gate (**94/100**).
2. **New portfolio principle:** `Approved Server Identity ≠ Approved Tool Contract ≠ Runtime Effect Authority`.
3. **MCP lifecycle evidence strengthened:** Boomi provides a current enterprise example of `Stale → Review → Active` rather than silent tool updates.
4. **Content-binding evidence strengthened:** 2026-08 registry measurement supports revalidation on descriptor/description hash movement plus periodic broad sweep rather than history-only prioritization.
5. **Academic research strategy refreshed:** Consensus' 2026-09-09 workspace positioning and Scite's 2026-09-09 citation graph reinforce `academic-mcp #1`; no duplicate research-workspace Issue created.
6. **New academic data-rights pattern retained:** `Paper Identified ≠ Full Text Entitled ≠ Evidence Returned` from Scite Publisher Gateway.
7. **No source code / implementation branch / merge / deploy / secret / permission / repository-setting changes were made.**

## Portfolio principle for this round

**`Connected ≠ Stable Contract; Stable Contract ≠ Authorized Effect; Paper Found ≠ Full Text Entitled.`**

The practical next layer is:

`Identity → Content-bound Contract → Diff/Review → Runtime Authority → Actual Effect → Read-back / Receipt`.
