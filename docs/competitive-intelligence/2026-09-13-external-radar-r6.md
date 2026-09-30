# External Inspiration Radar — 2026-09-13 r6

> Scope: Reese-max owned + unarchived, product-like repositories. Web-first research; GitHub is used for current product truth, dedupe, issue/PR mapping and coordination. This round does not modify product source code, create implementation branches, merge, deploy, change secrets/permissions, or alter repository settings.

## Executive Summary

This round did **not** create a new feature Issue. The strongest new external evidence maps cleanly to existing fingerprints, so the correct action was to update the original research surface rather than inflate the backlog.

The most important market change is the convergence of consumer/enterprise agents on **layered authority instead of one global “agent permission”**. Meta launched Muse on 2026-09-08 with a dedicated persistent VM/browser, a credential store the agent cannot read, per-app/per-action permissions, approval before critical actions, and an activity trail. Reuters independently reported the launch and also reported internal security/reliability problems and private-data exposure during testing, so the architecture is a strong product signal but not evidence that the security problem is solved. This validates the existing `autodev-ng` decomposition across External Effect (#12), Agent Principal/Credential Lease (#17), Environment (#21) and Browser Capability Lease/Human Takeover (#28); opening a new “AI control plane” issue would be duplicate work.

A second major validation arrived from OpenAI's current ChatGPT MCP/app administration workflow. Enterprise/Edu admins can refresh a published MCP app to discover new or changed actions; **new actions are disabled by default and changes to existing actions are shown as a diff instead of silently inheriting trust**. This is almost the exact consumer-side counterpart to `cf-mcp-server#15 Tool Contract Manifest + Drift Gate`. No duplicate Issue was created; #15 was updated with the new evidence.

Other useful signals remain research-only this round: DoorLoop's August tenant AI converts conversation into structured maintenance requests and keeps request history; W3C's EPUB 3.4 / EPUB Accessibility 1.2 candidate standards create a new conformance opportunity for ebook tooling; Scite's 2026-09-09 `citation_graph` makes backward/forward citation exploration agent-native; OpenMarket's research preview experiments with competitors challenging claims and independent truth agents checking evidence. These are relevant, but current repository evidence or existing issue coverage is not strong enough to justify another implementation Issue in this round.

## Portfolio Snapshot / Product → Market Category

Current owned + unarchived product-like portfolio count: **37 repositories**.

| Repository | Market / product category |
|---|---|
| 92-duty-scheduler | duty roster / scheduling |
| AICOLLEGE-GLSA | academic program / research platform |
| AIOS | AI OS / agent platform |
| GenAI-Thinking | GenAI education / prompt reasoning |
| LanguageApp | language-learning app |
| ScriptVault | script/content archive |
| academic-mcp | scholarly retrieval / research agent |
| ai-novel-workstation | long-form writing workstation |
| autodev-ng | AI SDLC / coding-agent orchestrator |
| cf-ai-router | model routing / AI cost control |
| cf-mcp-server | MCP server / SaaS back-office tools |
| chatgpt-gemini-extension-lite | browser AI assistant |
| chrome-devtools-mcp | browser developer tooling / MCP |
| clinical-scribe-worker | clinical documentation assistant |
| eson-anh-intelligence | health/market intelligence |
| flux-image-gen | AI image generation/editing |
| herdr-skills | agent skill/policy runtime |
| kindle-to-ebook | document / ebook conversion |
| koxygen-ai-poster | AI poster design |
| lplrs-judicial-sync | legal/public-data synchronization |
| mens-psychology-radar | trend/behavior intelligence |
| nanobanana-linebot | messaging AI assistant |
| ninax-line-hermes | LINE AI gateway / order-preserving messaging |
| note-filler | structured form/note capture |
| ppt-studio | AI presentation editor/export |
| rental-system | rental property operations |
| run-ai-coding-agents | agent execution/orchestration |
| skill-foundry | skill creation/evaluation/distribution |
| soundbox-offline | offline/local media player |
| taichung-police-intel | public-sector evidence intelligence |
| taiwan-intel-dashboard | multi-source intelligence dashboard |
| tick-stock-panel | market strategy / stock analysis |
| tw-heritage-wallpaper | culture/media product |
| video-timeline-pipeline | evidence-to-video editing automation |
| voca | vocabulary learning |
| voice-actress | legal evidence QA / grounded answer system |
| yt-infographic-worker | video-to-infographic automation |

Some repositories are not content-readable through the current GitHub connection even though repository metadata is visible. For those products, this round preserves the previously verified category/opportunity baseline and does **not** claim a new source-code gap without current evidence.

---

# External Signals

## A. Direct competitor / platform signals

### A1. CONFIRMED — Meta Muse turns agent authority into layered product controls
**Date:** 2026-09-08  
**Sources:**
- https://ai.meta.com/muse/
- https://www.reuters.com/business/meta-launches-ai-agent-that-can-access-other-apps-send-emails-make-payments-2026-09-08/

Muse uses a persistent dedicated VM/browser, connected apps, a credential store the agent cannot read, approval before critical actions such as sending mail or purchases, app/action permissions and an audit trail. Meta also says a protective layer mediates information sharing. Reuters independently confirms the launch, free + paid tiers, and reports that internal testing found security/reliability flaws and private-data exposure.

**JTBD:** let an agent complete multi-step personal tasks without handing it every credential and irreversible action by default.

**Why users may perceive it as better:** the user can delegate broad goals while keeping sensitive effects gated; credentials do not have to be copied into prompts or agent-visible storage.

**Onboarding/distribution:** dedicated app + WhatsApp; free usage cap with paid tiers.

**Transferable pattern:**
`Owner → Isolated Environment → Credential Binding → App/Surface Capability → Proposed Effect → Confirmation/Policy → Receipt`.

**Fits Reese-max:** validates existing `autodev-ng #12/#17/#21/#28` separation.

**Do not copy:** do not build another general consumer super-agent, central password vault, payment stack, or infer security effectiveness from vendor claims. Reuters' reported flaws are a warning that architecture labels are not runtime proof.

### A2. CONFIRMED — ChatGPT MCP/app refresh now treats new/changed actions as reviewable contract drift
**Source checked:** 2026-09-13  
**Source:** https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt

For Enterprise/Edu, a published app can be refreshed for new or updated actions; updates are not automatically enabled, new actions are disabled by default, and changes to existing actions are shown as a diff. Admins can separately control action access. Write/modify actions may still ask for confirmation.

**JTBD:** an administrator who approved a server/app yesterday must not implicitly approve arbitrary future action definitions.

**Why more reliable:** catalog refresh, contract review and runtime action permission are separate events.

**Transferable pattern:**
`Server Identity → Tool/Action Contract Snapshot → Drift Diff → Review/Enablement → Runtime Effect Gate`.

**Fits Reese-max:** exact fingerprint of `cf-mcp-server#15`; this round updated the existing Issue rather than creating another one.

**Do not copy:** server-side manifest truth cannot guarantee third-party client enforcement. Unsupported clients must remain `UNENFORCED/UNKNOWN`.

### A3. CONFIRMED — DoorLoop turns tenant chat into a structured maintenance/request lifecycle
**Dates:** 2026-08-04 to 2026-08-06  
**Sources:**
- https://support.doorloop.com/en/articles/12109510-doorloop-ai-assistant-how-the-tenant-uses-the-ai-assistant-in-the-tenant-portal
- https://support.doorloop.com/en/articles/12312822-doorloop-ai-assistant-chat-with-the-ai-assistant
- https://support.doorloop.com/en/articles/9389061-post-an-update-to-a-tenant-request-maintenance-request-and-notify-tenants

DoorLoop's tenant assistant can answer lease/rent questions, troubleshoot maintenance issues, ask follow-up questions, then create a detailed maintenance request when needed. Tenants can see request status; updates are recorded in the request Activity Feed. The AI add-on is packaged for Pro/Premium tiers.

**JTBD:** avoid `tenant message → staff asks missing questions → staff manually creates task → tenant asks status` loops.

**Workflow signal:** `Conversation → Required-field collection → Structured Request → Canonical Status → Activity Feed`.

**Potential fit:** `rental-system` could benefit if it currently has external chat/manual reconciliation, but current repo content could not be verified in this run. **Current-gap status: UNKNOWN; research list only.**

**Do not copy:** do not force all requests through AI, do not let an assistant invent lease/payment facts, and do not create a second maintenance truth beside the canonical task/request record.

### A4. CONFIRMED — Scite adds citation-graph traversal to MCP
**Date:** 2026-09-09  
**Source:** https://scite.ai/blog/citation-surfing-scite-mcp

Scite's MCP now exposes `citation_graph`, allowing agents to move backward through references and forward through citing work, including questions about later criticism or shared foundations.

**JTBD:** move beyond keyword search into evidence lineage and debate discovery.

**Fit:** `academic-mcp` already has citation-graph capable upstream tools and `#1 Canonical Paper Identity + Research Bundle Ledger`; therefore building a second graph product is unnecessary. The useful signal is to keep edge observations, freshness/source state and candidate/included evidence separate.

---

## B. Adjacent transferable workflow

### B1. CONFIRMED / EARLY PRODUCT SIGNAL — OpenMarket makes claims compete against counterclaims and independent verification
**Date:** 2026-09-08  
**Source:** https://www.producthunt.com/products/openmarket/awards

OpenMarket is explicitly a **research preview**. Its product model has seller agents make claims, rival agents challenge them and independent truth agents verify evidence before the buyer sees the result.

**Transferable principle:** evidence-heavy products should not only search for support. A useful optional research mode is:

`Claim Candidate → Support Search + Challenge Search → Evidence Conflict Set → RESOLVED / CONTESTED / UNRESOLVED Receipt`.

**Potential reuse:** `academic-mcp`, `voice-actress`, `taiwan-intel-dashboard`, `taichung-police-intel`, `eson-anh-intelligence`, `mens-psychology-radar`.

**Why no Issue now:** evidence is still one early research-preview product, while several Reese-max products already have source/provenance or citation-support primitives. More independent product/runtime evidence is needed before adding a cross-portfolio “debate engine.”

**Do not copy:** multi-agent disagreement is not evidence by itself; a challenger model cannot substitute for independent sources.

### B2. CONFIRMED — W3C EPUB 3.4 + EPUB Accessibility 1.2 create a conformance lifecycle, not just a conversion format
**Dates:** Candidate Recommendation Snapshot 2026-07-21; Accessibility 1.2 current draft 2026-08-18  
**Sources:**
- https://www.w3.org/news/2026/w3c-invites-implementations-of-epub-3-4-epub-reading-systems-3-4-and-epub-accessibility-1-2/
- https://www.w3.org/TR/epub-a11y-12/

EPUB Accessibility 1.2 specifies content conformance plus accessibility metadata/discoverability requirements. W3C explicitly requests implementation experience before the Recommendation advances.

**Transferable pattern for conversion tooling:**
`Source Document → EPUB Candidate → Structural Validation → Accessibility/Metadata Conformance → Render/Reading-System Checks → Conformance Receipt`.

**Potential fit:** `kindle-to-ebook`, but current repository content/issue state could not be read in this run. Keep as research-only until current gap and duplicate status can be verified.

---

## C. Emerging technology / new product possibility

### C1. CONFIRMED — Official MCP Ruby SDK reaches stable 1.0 with conformance coverage
**Date:** 2026-07-27  
**Source:** https://blog.modelcontextprotocol.io/posts/ruby-sdk-1-0/

The official Ruby MCP SDK reached 1.0, declares a stable public API, implements the 2025-06-18 and 2025-11-25 protocol revisions and reports full server/client conformance scenarios for its tier.

**Product signal:** MCP is moving from experimental adapters to versioned SDK/conformance ecosystems. This increases the importance of Reese-max's existing separation between **protocol conformance** (`cf-mcp-server#6`) and **semantic tool-contract stability** (`#15`). Passing protocol conformance does not prove a tool retained the same authority or meaning.

### C2. CONFIRMED — Scite Smart Citation states remain a useful counterexample to “citation exists = evidence supports claim”
**Source checked:** 2026-09-13  
**Source:** https://scite.ai/accessibility/conformance-report

Scite describes supporting / contrasting / mentioning citation classifications as core product features. For Reese-max this remains a design signal, not a classifier to copy blindly: legal/research products should keep `source exists`, `source supports claim`, `source conflicts`, and `unknown` as separate evidence states.

---

# New Releases / Recent Moves

| Date | Product / ecosystem | Change | Radar interpretation |
|---|---|---|---|
| 2026-09-09 | Scite MCP | `citation_graph` | research agents increasingly traverse evidence relationships, not only search |
| 2026-09-08 | Meta Muse | persistent personal agent + secure VM + approvals + app permissions | layered agent authority is becoming a consumer product surface |
| 2026-09-08 | OpenMarket | research-preview adversarial marketplace | “actively search for counterevidence” is becoming a product workflow |
| 2026-08-18 | W3C | EPUB Accessibility 1.2 CR Draft | ebook conversion should expose conformance state, not only file creation |
| 2026-08-04–06 | DoorLoop | tenant AI assistant/request workflow | chat can be a thin intake surface into canonical operations |
| 2026-07-27 | MCP | official Ruby SDK 1.0 | protocol ecosystem is stabilizing; semantic contract drift matters more |

---

# Community Pain Points

These are **COMMUNITY_SIGNAL only**, not prevalence or effectiveness statistics.

1. **Permission fatigue in browser agents.** A 2026-09-07 Claude Code discussion describes a write-heavy browser task repeatedly asking for confirmation. The useful design signal is not “disable approvals”; it is to batch candidate work, separate reversible preparation from irreversible submission, and prefer typed/API actions for repetitive writes where available.  
   Source: https://www.reddit.com/r/ClaudeCode/comments/1w9lbqp/claude_extension_is_asking_for_approval_even_in/

2. **MCP tool/schema drift after approval.** A 2026-09-09 r/mcp post demonstrates the practitioner fear that `tools/list` can change descriptions/schema/new tools without an obvious trust reset. This remains anecdotal, but it aligns with OpenAI's current action-refresh/diff behavior and Boomi/Vercel patterns already captured by `cf-mcp-server#15`.  
   Source: https://www.reddit.com/r/mcp/comments/1wbcr8q/mcp_tools_can_change_their_descriptionschema/

3. **Headless agents + approval gates can hang or encourage unsafe bypass.** A 2026-09-11 workflow discussion proposes remote human approval instead of `--dangerously-skip-permissions`. The signal reinforces the existing `autodev-ng` attention/approval queue direction rather than just increasing autonomy.  
   Source: https://www.reddit.com/r/ClaudeWorkflows/comments/1wd25al/workflow_remote_human_approval_for_headless/

---

# Adjacent Ideas

1. **Counterevidence Lane:** optional support/challenge evidence collection before a claim is promoted. Do not turn model disagreement into truth.
2. **Canonical Request Intake:** chat/mobile/LINE/browser input should create a typed request/task with exact state and provenance, not a second conversation-owned truth.
3. **Conformance Receipt:** conversions and exports should report standard/accessibility/runtime conformance separately from “file generated successfully.”
4. **Tool Contract Reapproval:** identity, protocol compatibility, semantic contract and runtime effect authority remain four different states.
5. **Layered Agent Envelope:** isolate environment, credentials, surface lease and external effect instead of a global `agent=trusted` boolean.

---

# Opportunity Scores

Scores are portfolio heuristics; they do not imply implementation commitment.

| Candidate | Score | Disposition |
|---|---:|---|
| MCP Tool Contract Refresh / Diff / Reapproval | 95 | **existing `cf-mcp-server#15`; updated original Issue** |
| Agent layered authority envelope (environment + secretless credential + effect approval + audit) | 93 | existing `autodev-ng#12/#17/#21/#28`; central report only |
| Clinical section-scoped repair / revision lifecycle | 92 | already exists as `clinical-scribe-worker#7`; no duplicate |
| Duty Inbox / self-service post-publish exceptions | 92 | already exists as `92-duty-scheduler#22`; no duplicate |
| PPT structured object state + render verification | 92 | already `ppt-studio#5` |
| Video evidence CutSpec → target-native NLE apply/read-back | 93 | existing `video-timeline-pipeline#11` / active PR; no interference |
| Tenant conversation → structured request/task lifecycle | 88 | research only; `rental-system` current gap unverifiable this round |
| EPUB 3.4/A11y 1.2 conformance receipt | 87 | research only; `kindle-to-ebook` current gap unverifiable this round |
| Counterevidence / claim-challenge lane | 86 | cross-portfolio research list only |
| Cache-aware cost receipt | 87 | existing `cf-ai-router` research list; no new evidence demanding Issue |

---

# Opportunity Map — all 37 products

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| 92-duty-scheduler | coverage + deterministic constraints | post-publish exception/request visibility | exact schedule/policy/change receipts | Duty Inbox / thin LINE entry | opaque AI autopilot |
| AICOLLEGE-GLSA | learning/research provenance | continuation + artifact state | verifiable lineage | research-agent workspace | unsupported outcome claims |
| AIOS | explicit capability boundaries | context/permission isolation | effect/principal/environment receipts | layered agent envelope | global “trusted agent” switch |
| GenAI-Thinking | source fidelity | reusable prompt/skill models | traceable claim/evidence | skills + counterevidence exercises | fake chain-of-thought UX |
| LanguageApp | mastery tracking | session continuation | evidence-backed progress | generated study/task views | exploitative streak mechanics |
| ScriptVault | retrieval + metadata | reusable templates | source-bound archive | inspectable citations | provenance-free summarization |
| academic-mcp | paper identity + source truth | entitlement/freshness/conflict states | canonical research ledger | optional counterevidence lane | found paper = full-text truth |
| ai-novel-workstation | canonical manuscript truth | typed external-agent access | candidate story mutations + receipts | story-agent workspace | raw filesystem authority |
| autodev-ng | receipt-first orchestration | long-running approval/attention flow | principal/env/effect/browser boundaries | layered agent envelope | blanket auto-approve |
| cf-ai-router | deterministic auditable spend | cache-aware cost economics | fail-closed cost receipt | sticky/cache routing evidence | unauditable paid fallback |
| cf-mcp-server | truthful tool/effect contract | manifest + exact drift review | semantic contract gate distinct from protocol | client refresh/read-back | silent tool schema updates |
| chatgpt-gemini-extension-lite | page privacy + explicit scope | per-tab/per-action context | least-privilege browser surface | browser capability lease | whole-profile ambient access |
| chrome-devtools-mcp | deterministic devtools ops | contract/version observability | protocol/tool receipts | browser surface leasing | ambient credential access |
| clinical-scribe-worker | clinical provenance + human review | section repair/manual-edit preservation | validation + revision receipt | user-owned section locks | AI overwrite of reviewed text |
| eson-anh-intelligence | evidence freshness | source disagreement visibility | dated source lineage | counterevidence lane | certainty inflation |
| flux-image-gen | reference/session lineage | spatial/local edits | branch/rollback/compare | reference tray | destructive iterative overwrite |
| herdr-skills | corrections as evidence | candidate safe transformations | explicit promotion | usage-derived candidate rules | automatic policy mutation |
| kindle-to-ebook | deterministic conversion | standard/accessibility conformance visibility | conversion + conformance receipt | EPUB 3.4/A11y 1.2 | unverified AI rewriting |
| koxygen-ai-poster | editable artifact | object-aware local edits | structured design state | layered object model | image-only flattened output |
| lplrs-judicial-sync | target-date coverage | missing-success alert/backfill | coverage receipt | source revision provenance | schedule = coverage assumption |
| mens-psychology-radar | recency + source labels | explicit conflicting evidence | confidence/source states | claim-challenge lane | anecdotes as statistics |
| nanobanana-linebot | response correctness | idempotency/replay | conversation/action receipt | room-context handoff | opaque retry loops |
| ninax-line-hermes | ordering/redelivery truth | channel-aware context | exact message state receipts | agent room bridge | session-only memory |
| note-filler | user-owned fields | confidence/blank state | field-level provenance | AI fill + locks | overwrite uncertain values |
| ppt-studio | native editability | structured slide/object state | object patch + render/export receipt | generated task/presentation views | raster slide generation |
| rental-system | operational source of truth | tenant request → canonical task trace | workflow/request receipt | tenant assistant as thin intake | generic chatbot beside core records |
| run-ai-coding-agents | explicit execution boundaries | principal/env/effect evidence | programmable safe orchestration | capability leases | ambient shared credentials |
| skill-foundry | governed candidate→promotion | demonstration intake | evidence provenance | demo→candidate skill | demo = certified skill |
| soundbox-offline | reliable local playback | optional network/NAS source | offline-first ownership | WebDAV/SMB source adapter | subscription/streaming sprawl |
| taichung-police-intel | source/time provenance | contradiction visibility | evidence chain | counterevidence lane | untraceable synthesis |
| taiwan-intel-dashboard | canonical metric/source | generated task-specific views | evidence-backed dashboard | canonical data → generated UI | duplicate AI datastore |
| tick-stock-panel | reproducible strategies + isolation | NL→deterministic strategy | auditable execution | isolated custom runner | in-process generated code exec |
| tw-heritage-wallpaper | provenance/media quality | source metadata | source-honest cultural artifact | editorial workflow | unattributed generation |
| video-timeline-pipeline | deterministic CutSpec | target-native NLE apply/read-back | evidence-backed mutation receipt | MCP-native NLE targets | rebuilding a full NLE |
| voca | mastery/review logic | session continuity | explicit mastery evidence | generated study views | notification spam |
| voice-actress | citation→support verification | authority relevance/conflict | exact evidence spans + source state | counterevidence lane | citation exists = supports claim |
| yt-infographic-worker | video evidence lineage | editable structured output | transcript→claim→visual trace | slide/poster object model | irreversible screenshot-style output |

---

# Top 10 Cross-Portfolio Ideas

1. **Tool Contract Drift Gate** — content-bound tool/action manifests, exact diffs, explicit reapproval where supported.
2. **Layered Agent Authority Envelope** — principal, environment, credentials, surface capability and external effect remain independent.
3. **Candidate → Diff → Promotion → Receipt** — common mutation lifecycle across text, schedule, slide, image, code and research artifacts.
4. **Counterevidence Lane** — actively search for conflicting evidence before promoting high-impact claims.
5. **Canonical Request Inbox** — external chat/mobile inputs become typed requests tied to exact canonical revisions.
6. **Conformance Receipt** — generated/exported artifacts need standard/runtime/accessibility status, not only success booleans.
7. **User-Owned State** — manual edits/locked fields remain protected from later AI regeneration unless explicitly rebased.
8. **Cost Component Receipt** — fresh input/cache read/cache write/output/provider units should be distinguishable where billing semantics differ.
9. **Structured Artifact + Render/Runtime Verification** — editable internal state and real-world rendered/applied state both matter.
10. **Unknown Is a State** — rate-limited, inaccessible, unenforced, unverified and permission-unknown must never be normalized to success/empty/allowed.

---

# Ideas Rejected / Deferred

1. **Build another general “AI Control Plane.”** Rejected: `autodev-ng` already decomposes the important primitives; a dashboard-first clone would add surface area without new truth.
2. **Create a new Issue for OpenAI MCP action refresh.** Rejected as duplicate: exact fingerprint already belongs to `cf-mcp-server#15`; original Issue updated instead.
3. **Generic rental chatbot.** Deferred: DoorLoop is a useful signal, but current `rental-system` implementation/gap could not be inspected through the connection this round.
4. **Multi-agent debate engine from OpenMarket.** Deferred: early research-preview signal; disagreement between agents is not independent evidence.
5. **EPUB accessibility implementation Issue.** Deferred: W3C signal is strong, but current `kindle-to-ebook` source/issues were not readable, so duplicate/current-gap verification is incomplete.
6. **Copy Meta's secure VM/payment stack.** Rejected: too broad; Reese-max benefits from the authority primitives, not a consumer super-agent clone.
7. **Automatically enable newly discovered MCP tools.** Rejected: directly contradicts the strongest current market governance signal.
8. **Treat protocol conformance as semantic safety.** Rejected: MCP SDK conformance and tool contract/effect authority are distinct.
9. **Add another citation-graph implementation to academic-mcp.** Rejected: current upstream already offers graph capability; identity/freshness/bundle truth is the higher-value gap.
10. **Use vendor time-saved / security claims as success metrics.** Rejected: only first-party product behavior plus independent/runtime evidence can support effectiveness claims.

---

# Issue Mapping / Coordination

## Updated this round
- `Reese-max/cf-mcp-server#15` — **updated with OpenAI MCP action-refresh/diff evidence**. No matching implementation PR or `github-issue-lock:v1` fingerprint was found before the evidence update. No source code/branch was created.

## Existing Issues that already own new signals
- `autodev-ng#12` — external-effect policy / effect receipt.
- `autodev-ng#17` — agent principal / credential lease identity.
- `autodev-ng#21` — execution environment authority boundary.
- `autodev-ng#28` — browser capability lease + human takeover.
- `clinical-scribe-worker#7` — section-scoped repair + note revision receipt; new since previous radar, no duplicate.
- `clinical-scribe-worker#6` — P0 cryptographic Cloudflare Access JWT verification; remains a hard blocker for new production mutation surfaces.
- `92-duty-scheduler#20` — PolicySpec / Rule Studio.
- `92-duty-scheduler#22` — Duty Inbox / LINE self-service post-publish exceptions; new since previous radar, no duplicate.
- `ppt-studio#5` — structured slide state + render verification.
- `video-timeline-pipeline#11` — evidence-backed NLE handoff; active work exists, so external radar does not touch it.
- `academic-mcp#1` — Canonical Paper Identity + Research Bundle Ledger; already records Scite citation graph as a signal and explicitly rejects blindly copying Smart Citation classification.
- `skill-foundry#5` — Demonstration-to-Skill Intake; existing lock/owner work must not be stolen.

## No Issue created
No candidate cleared all of: high score, independent evidence, current repository gap verification, no duplicate, no competing active work.

---

# Sources

## CONFIRMED
- Meta Muse — 2026-09-08: https://ai.meta.com/muse/
- Reuters on Muse launch / reported limitations — 2026-09-08: https://www.reuters.com/business/meta-launches-ai-agent-that-can-access-other-apps-send-emails-make-payments-2026-09-08/
- OpenAI Developer mode and MCP apps — checked 2026-09-13: https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt
- Scite Citation Surfing / `citation_graph` — 2026-09-09: https://scite.ai/blog/citation-surfing-scite-mcp
- DoorLoop tenant AI assistant — 2026-08-04: https://support.doorloop.com/en/articles/12109510-doorloop-ai-assistant-how-the-tenant-uses-the-ai-assistant-in-the-tenant-portal
- DoorLoop general AI assistant — 2026-08-06: https://support.doorloop.com/en/articles/12312822-doorloop-ai-assistant-chat-with-the-ai-assistant
- DoorLoop request activity updates — 2026-08-05: https://support.doorloop.com/en/articles/9389061-post-an-update-to-a-tenant-request-maintenance-request-and-notify-tenants
- W3C EPUB 3.4 / Reading Systems 3.4 / Accessibility 1.2 CR invitation — 2026-07-21: https://www.w3.org/news/2026/w3c-invites-implementations-of-epub-3-4-epub-reading-systems-3-4-and-epub-accessibility-1-2/
- EPUB Accessibility 1.2 CR Draft — 2026-08-18: https://www.w3.org/TR/epub-a11y-12/
- Official MCP Ruby SDK 1.0 — 2026-07-27: https://blog.modelcontextprotocol.io/posts/ruby-sdk-1-0/
- Scite current product/conformance description — July 2026 report: https://scite.ai/accessibility/conformance-report

## CONFIRMED / EARLY PRODUCT SIGNAL
- OpenMarket research preview / Product Hunt launch — 2026-09-08: https://www.producthunt.com/products/openmarket/awards

## COMMUNITY_SIGNAL only
- Claude Code repeated browser approval — 2026-09-07: https://www.reddit.com/r/ClaudeCode/comments/1w9lbqp/claude_extension_is_asking_for_approval_even_in/
- MCP description/schema drift discussion — 2026-09-09: https://www.reddit.com/r/mcp/comments/1wbcr8q/mcp_tools_can_change_their_descriptionschema/
- Remote approval for headless agent runs — 2026-09-11: https://www.reddit.com/r/ClaudeWorkflows/comments/1wd25al/workflow_remote_human_approval_for_headless/

---

# What Changed Since Last Radar (r5 → r6)

1. **Major external strategy change:** Meta Muse is now a shipped consumer agent with a dedicated VM/browser, secretless credential handling from the agent's perspective, per-action approvals and audit history. This validates—not replaces—the existing layered `autodev-ng` safety architecture.
2. **Strong direct validation of `cf-mcp-server#15`:** OpenAI's current MCP/app workflow now explicitly refreshes action catalogs with new actions disabled by default and changed actions shown as diffs. #15 was updated; no duplicate Issue created.
3. **`clinical-scribe-worker#7` now exists:** section-scoped regeneration/revision/undo/manual-edit preservation is already owned by a new research Issue. #6 P0 auth remains a production blocker.
4. **`92-duty-scheduler#22` now exists:** post-publish Duty Inbox / LINE self-service exception workflow is already owned and blocked appropriately on #14 authorization correctness.
5. **`ai-novel-workstation#5` CI blocker is now closed**, reducing a prior dependency, but this round does not use that change to widen mutation authority automatically.
6. **DoorLoop adds a strong property-operations workflow signal**, but `rental-system` current source/gap could not be verified through the connection; research-only.
7. **W3C EPUB Accessibility 1.2 creates a real near-term standards signal** for conversion tooling, but `kindle-to-ebook` current gap/duplicate status is not verifiable this round; research-only.
8. **No product source code, implementation branch, merge, deployment, secret, permission or repository setting was changed.**

## Portfolio principle added this round

**`Server/App Identity ≠ Current Tool Contract ≠ Enabled Action ≠ Runtime Effect Authority ≠ Verified Outcome`**

And for end-user agents:

**`Agent Goal ≠ Environment Authority ≠ Credential Visibility ≠ Surface Capability ≠ Permission to Cause an External Effect`**
