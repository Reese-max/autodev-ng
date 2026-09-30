# External Competitive / New Product / Workflow Radar — 2026-09-17T23:58:03Z

## Run scope / evidence contract

- Primary intelligence source this round: public web **outside Reese-max GitHub**. GitHub is used only to establish owner scope, current product reality, duplicate boundaries, active work, and to persist this report.
- Quality gate source: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality gate blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected GitHub inventory pagination completed: **41 Reese-max-owned repositories visible, 40 unarchived**. `obsidian-vault` is archived and excluded. The second repository page was empty; this round does not infer deletion/addition from older inventory counts.
- Fair-rotation focus: `Reese-max/taichung-police-intel`.
- Current default-branch evidence: `main@e1d081bd04824c062c7ee99e7d74f9e478240743` (`docs: record taichung intel 50-persona round 3`). Open PR capability is **not** treated as current default-branch capability.
- Owner-approved direction rechecked from `.kiro/steering/product.md`: evidence-first public information for police policy/council-liaison preparation; exact official evidence locators; no internal duty/110/case/person data, operational command, general chatbot, or inference that an oral answer/resolution proves later implementation; broad source expansion should not outrun the end-to-end user journey.
- Runtime: no local/CI/deployment/provider execution in this radar. External product claims are capability/strategy signals only unless independently supported.

## Inventory / applicability checkpoint

Visible unarchived repositories: `exam-archive`, `police-exam-practice`, `police-exam-archive`, `92-duty-scheduler`, `UkePack`, `ppt-studio`, `voice-actress`, `taiwan-intel-dashboard`, `autodev-ng`, `flux-image-gen`, `claude-mem`, `lobsterpulse`, `prompt-autoresearch`, `neciken-summer-poem`, `note-filler`, `adng-memory`, `cyber-prep-coach`, `cf-ai-router`, `avatar-vfo`, `project-doctor-web`, `minideck`, `chatgpt-dual-pipeline`, `taichung-police-intel`, `soundbox-offline`, `skill-foundry`, `video-timeline-pipeline`, `ai-novel-workstation`, `clinical-scribe-worker`, `MaterialYouNewTab`, `cf-mcp-server`, `tick-stock-panel`, `herdr-skills`, `ninax-line-hermes`, `ai-flight-radar`, `academic-mcp`, `spotify-playlist-organizer-mcp`, `google-maps-personal-mcp`, `travel-planning-mcp`, `octobroker`, `openab`.

This round does not force product defects onto empty/content/reference repositories. Deep review follows the fair cursor rather than restarting from popular repos.

# External Signals

## A. Direct competitor — Quorum turns government-affairs AI from one-shot answers into proactive background work + review hub

**Status:** CONFIRMED product strategy/capability; outcome claims remain vendor claims.  
**Published:** 2026-09-09.  
**Accessed:** 2026-09-18 Asia/Taipei.  
**Sources:**
- https://www.quorum.us/company-news/quorum-launches-quincy-hub-bringing-its-ai-agents-into-one-place/
- https://www.quorum.us/blog/introducing-quincy-hub/
- https://www.quorum.us/products/agents/

Quorum launched **Quincy Hub**, a single command center for five government-affairs agents: Bill Tracker, Campaign Builder, Meeting Prep, CRM, and Policy Comms. Its own product framing explicitly shifts from “ask AI a question” toward background work completed before the user asks, while keeping a place to review agent output and decide what happens next.

### User job / manual-step reduction
- Meeting Prep creates a brief before a scheduled stakeholder meeting instead of requiring a user to manually collect the latest bill/history/context at meeting time.
- CRM prepares interaction records immediately after meetings rather than relying on delayed manual logging.
- Policy Comms watches new organizational publications and prepares outreach drafts for human review rather than requiring copy/paste from a press release into a new drafting workflow.

### Onboarding / distribution / collaboration signal
- Agents live inside an existing government-affairs product rather than a separate agent console.
- The Hub centralizes what agents already did, their context, and the human decision on what happens next.

### What fits GovIntel
- **Not** “add autonomous agents.” The transferable pattern is: `bounded background preparation -> reviewable work item -> human decision -> audited downstream state`.
- This strongly validates the existing `#34 Human Review Inbox`, `#12 Role/Unit Profile`, `#21 latest-information loop`, and `#23 tracked brief/version` direction.
- If GovIntel later adds proactive preparation, the smallest safe path is to land proposals in the existing review/evidence workflow rather than mutate canonical public intelligence or send external actions automatically.

### What not to copy
- Do not copy campaign/outreach sending, CRM writes, stakeholder targeting, or automatically suggested policy positions.
- Do not infer that “agents doing work in the background” grants implementation authority. In GovIntel, background work must remain read-only/proposal-producing unless separately authorized.

**Issue decision:** `DEDUPE` — no new root cause. Existing #34 already owns centralized reviewable human decisions; #12/#21/#23 own reusable context, recency, and tracked handoff. No Issue/comment update because the new evidence validates the existing direction without changing its acceptance boundary or priority.

---

## A2. Adjacent intelligence competitor — Dataminr moves from alerting to autonomous corroboration/context/prediction

**Status:** CONFIRMED product launch; accuracy/effectiveness remains vendor claim.  
**Published:** 2026-09-14.  
**Accessed:** 2026-09-18 Asia/Taipei.  
**Sources:**
- https://www.dataminr.com/press/announcement/dataminr-advanced-for-corporate-security/
- https://www.dataminr.com/press/announcement/dataminr-and-crisis24-deliver-new-intelligence-and-agentic-ai-in-crisis24-horizon/

Dataminr announced Agentic Corroboration, Agentic Context, and Near-Term Predictive Intelligence, describing a shift from detecting events to automatically corroborating them, supplying context, and predicting what may happen next. The launch also integrates Dataminr intelligence into Crisis24 Horizon alongside human-verified analysis and response workflows.

### User job / manual-step reduction
- Corroboration reduces manual cross-source searching after the first signal.
- Context reduces the need to separately retrieve historical event/background records.
- Integrated workflow reduces switching between detection, analysis, and response products.

### What fits GovIntel
- `signal -> corroboration -> exact evidence -> human-usable brief` is relevant and is already better matched by #24 PublicEvent fusion, #32 Answer Evidence Gate, #21 currentness/correction, and #35 lane-aware health than by creating a new “agent fleet.”
- Corroboration should remain source-aware: multiple retrieval paths to the same original source are not independent evidence.

### What not to copy
- **DO NOT COPY:** predictive threat/operational intelligence or automatic action into a police-policy public-information product. It conflicts with the owner-approved non-operational scope and has no validated user need in this repository.
- Do not treat Dataminr’s vendor performance claims as evidence that GovIntel would improve accuracy or response time.

**Issue decision:** no new Issue. Corroboration maps to existing #24/#32/#21; prediction is explicitly rejected for product-scope reasons.

---

## B. Adjacent workflow — local-government meeting products keep authority review close to the generated draft

### Govably
**Status:** CONFIRMED current product capability; page publication date not shown.  
**Accessed:** 2026-09-18 Asia/Taipei.  
**Source:** https://govably.ai/

Govably generates council/board minutes but frames the workflow as “AI writes; clerk checks,” ties motions/votes back to the recording, and asks humans to confirm speaker assignments and official meeting records.

### CivicWork / CivicAide
**Status:** CONFIRMED current product capability; page publication date not shown.  
**Accessed:** 2026-09-18 Asia/Taipei.  
**Source:** https://www.civicwork.ai/

CivicAide emphasizes pre-meeting council briefs from official packets, claim-level citations, “developments not documents,” and staying silent when there is no material change.

### Transferable pattern
- AI output should remain a navigation/review layer over official records.
- Material-change filtering and “silence when nothing material changed” is more useful than flooding users with a new summary for every document.
- Draft generation and official-record authority should remain distinct states.

### Mapping
This is **not a new gap** for GovIntel. The same boundary is already explicit in #13 live provisional meeting reconciliation, #21 material correction/currentness, #32 claim-level Answer Evidence Gate, #33 material-change evaluation, and #48 document-version-to-trusted-facts work.

**Issue decision:** `DEDUPE`, no write.

---

## C. Distribution signal — authoritative policy intelligence keeps moving into existing AI clients, but MCP adoption is not universal

### FiscalNote PolicyNote MCP
**Status:** CONFIRMED product distribution.  
**Published:** 2026-08-13 Claude Connector listing; earlier 2026-03/05 API/MCP expansion.  
**Sources:**
- https://investors.fiscalnote.com/news/news-details/2026/FiscalNote-Launches-PolicyNote-MCP-in-Anthropics-Claude-Connectors-Directory-Expanding-Access-to-Its-Policy-Intelligence-Amid-Accelerating-Enterprise-Adoption/default.aspx
- https://fiscalnote.com/newsroom/policynote-api-enhancements-annoucement

FiscalNote continues to position trusted policy intelligence as infrastructure embedded into ChatGPT/Claude/enterprise workflows rather than only a destination dashboard.

### Community counter-signal
**Status:** COMMUNITY_SIGNAL only, not prevalence evidence.  
**Published:** 2026-08-25.  
**Source:** https://www.reddit.com/r/civictech/comments/1vyblq4/

A civic-data builder reported that MCP was powerful for agent use but that many intended users did not know what MCP was or were unwilling to connect a random MCP endpoint.

### Product implication
This strengthens the already-approved #15 decision that Evidence MCP is an **opt-in companion**, not a replacement for the public Web/static publication. It argues against spending on MCP-only onboarding before the evidence/query workflow is proven useful in the product itself.

**Issue decision:** no new Issue; this is evidence for an existing non-goal and distribution boundary.

# New Releases / fresh changes

1. **2026-09-14 — Dataminr Advanced:** Agentic Corroboration, Agentic Context, and Near-Term Predictive Intelligence launched for corporate security; Dataminr says the same paradigm had been introduced Aug. 26 for defense/government.
2. **2026-09-09 — Quorum Quincy Hub:** five government-affairs agents placed in one review/context/management hub; direct strategy shift toward proactive background agent work.
3. **2026-08-13 — FiscalNote PolicyNote MCP:** listed in Anthropic Claude Connectors Directory, extending earlier ChatGPT/API distribution.

# Community Pain

- **Meeting transcript authority (known, not new):** civic-tech builders continue to emphasize that transcription is less difficult than distinguishing discussion, motions/votes, adopted actions, and exact timestamps. This fingerprint is already captured in #13 and must not be reopened as a new feature under a different name.
- **MCP onboarding friction (COMMUNITY_SIGNAL):** some non-technical civic-data users may prefer the product UI over connecting an unfamiliar endpoint. This supports retaining Web as a first-class surface; it is not evidence that MCP generally fails adoption.

# Adjacent Ideas

## 1. “Prepared work, not autonomous truth”
If future GovIntel automation prepares a brief before a council meeting, the smallest product rule should be:

`official/public evidence -> bounded preparation -> Review Inbox -> human accept/dismiss -> versioned handoff`

Not:

`source update -> autonomous AI conclusion -> canonical truth / external action`.

This is an **ADJACENT IDEA** because current #34/#21/#23 already define the parts; no new Issue is warranted until the current end-to-end candidate lands and real user evidence shows a remaining preparation bottleneck.

## 2. Review queue as the coordination surface for future agents
Quorum’s hub suggests an interface principle: if multiple background helpers ever exist, the user should not have to inspect each agent separately. Existing #34 can be the convergence point for `NEEDS_REVIEW / CONFLICT / UNVERIFIED / SPLIT_REQUIRED` rather than creating an “agent dashboard.”

## 3. Keep evidence and action authority separate
Dataminr/Crisis24 integration demonstrates the market value of linking intelligence to response workflows, but GovIntel should preserve a harder boundary: evidence may recommend *what needs review*; it does not acquire police operational/action authority.

# Opportunity Map — `taichung-police-intel`

| Category | Decision this round |
|---|---|
| MUST MATCH | Exact official evidence locator; source health/freshness/gap semantics; discussion/draft/provisional must not be silently promoted to official/final truth. |
| SHOULD BE BETTER | Any future proactive preparation should produce bounded, reviewable work with version/audit evidence rather than invisible background mutation. Existing #34 is the correct owning surface. |
| DIFFERENTIATOR | Public-only evidence-first intelligence, source failure ≠ zero events, document-version/currentness traceability, and explicit separation of provisional/live navigation from formal evidence. |
| ADJACENT IDEA | Pre-meeting background preparation that stages drafts into #34, after current integration/runtime gaps are resolved and only if user evidence supports the JTBD. |
| DO NOT COPY | Predictive policing/threat prediction, operational response triggers, automatic stakeholder outreach, auto-suggested political positions, or generic autonomous agent fleets. |

# Cross-portfolio ideas

1. **Reviewable automation contract:** `proposal + source/evidence + version + reason + human decision + receipt` is reusable across products that generate consequential drafts, but this round does **not** open a cross-project framework issue. Reuse should emerge only after at least two products show the same validated workflow need.
2. **Destination UI + embedded AI distribution:** maintain both when each solves a different job. Do not replace a user-verifiable Web/product surface merely because MCP/agent distribution is growing.

# Rejected Ideas

- **New “Agent Command Center” Issue** — rejected. #34 already owns the human decision queue; a renamed architecture would duplicate the root workflow.
- **Proactive Meeting Prep Agent now** — rejected for now. Current repository still has active integration, publication, source-policy, query, evidence-gate, live-session and runtime-verification work. No observed user evidence proves another background agent is the next bottleneck.
- **Dataminr-style predictive intelligence** — rejected on product-scope/safety fit, not merely priority. This repository is public policy/council intelligence, not predictive policing or operational response.
- **MCP-only product pivot** — rejected. #15 already defines MCP as a read-only companion and the community signal gives no basis to demote the Web surface.
- **New motion/vote schema Issue from Govably** — rejected as duplicate/over-expansion. #13 already records the transcript→agenda/action/minutes authority problem and explicitly prevents discussion from being written as decision before reconciliation.

# Issue Mapping / dedupe

| Signal | Existing owner | Result |
|---|---|---|
| Quorum proactive background work + central review hub | #34, #12, #21, #23 | DEDUPE; report only |
| Dataminr corroboration/context | #24, #32, #21, #35 | DEDUPE; report only |
| Dataminr prediction/action | owner non-goals | REJECT |
| Govably/CivicAide human review + source-cited meeting prep | #13, #21, #32, #33, #48 | DEDUPE; report only |
| FiscalNote MCP distribution | #15, #29 | DEDUPE; report only |
| Community MCP onboarding friction | #15 Web-companion boundary | SUPPORTS EXISTING NON-GOAL |

**Writes:** 0 new Issues; 0 Issue modifications; 0 PR comments; 0 implementation authorization. No issue lock required because no existing issue was modified.

# Current GitHub coordination state

- Multiple relevant scopes have active PR ownership, including #47 integration (`PR #55`), #32 evidence gate (`PR #53` plus older #44), #30 query store (`PR #54` plus older #40), #49 source policy (`PR #52`), #13 live reconciliation (`PR #51`), #24 event fusion (`PR #43`), #35 health (`PR #45`), and #20 publication checkpoint (`PR #26`).
- Their PR-reported local/CI evidence is not treated as merged/default-branch or production verification.
- This radar therefore avoids expanding their scope or converting external inspiration into an implementation mandate.

# Sources

First-party / product sources:
- Quorum Quincy Hub — 2026-09-09: https://www.quorum.us/company-news/quorum-launches-quincy-hub-bringing-its-ai-agents-into-one-place/
- Quorum Quincy Hub product blog — 2026-09-09: https://www.quorum.us/blog/introducing-quincy-hub/
- Quorum Agents: https://www.quorum.us/products/agents/
- Dataminr Advanced — 2026-09-14: https://www.dataminr.com/press/announcement/dataminr-advanced-for-corporate-security/
- Dataminr + Crisis24 — 2026-09-14: https://www.dataminr.com/press/announcement/dataminr-and-crisis24-deliver-new-intelligence-and-agentic-ai-in-crisis24-horizon/
- FiscalNote Claude connector — 2026-08-13: https://investors.fiscalnote.com/news/news-details/2026/FiscalNote-Launches-PolicyNote-MCP-in-Anthropics-Claude-Connectors-Directory-Expanding-Access-to-Its-Policy-Intelligence-Amid-Accelerating-Enterprise-Adoption/default.aspx
- FiscalNote API/MCP — 2026-03-04: https://fiscalnote.com/newsroom/policynote-api-enhancements-annoucement
- Govably current page (date not shown; accessed 2026-09-18): https://govably.ai/
- CivicWork/CivicAide current page (date not shown; accessed 2026-09-18): https://www.civicwork.ai/

Community sources:
- MCP/onboarding civic-data discussion — 2026-08-25: https://www.reddit.com/r/civictech/comments/1vyblq4/
- City-council transcript authority discussion — 2026-06-23: https://www.reddit.com/r/civictech/comments/1udw817/city_council_transcriber/

# What Changed

- **New direct-competitor strategy evidence:** Quorum now explicitly markets proactive government-affairs agents whose output is centrally reviewed and managed in Quincy Hub. This is a stronger, fresher signal than prior “AI search/chat” positioning.
- **New adjacent strategy evidence:** Dataminr publicly describes a full shift from real-time alerting toward agentic corroboration/context/prediction. Only the corroboration/context pattern fits GovIntel; predictive/operational scope does not.
- **No new validated root cause:** both signals map to existing GovIntel Issues and non-goals. Creating another Issue would add architecture without new user/problem evidence.
- **Priority calibration:** no P0/P1/P2 defect was newly established. Quorum-style proactive preparation remains `kind=OPPORTUNITY`, `severity=NOT_ESTABLISHED`, `decision_priority=LOW-MEDIUM`, `triage=NEEDS_EVIDENCE`, `auto_implementation=false` until current integration lands and real user evidence shows a preparation bottleneck.

# Completion / gaps / cursor

- External A/B/C exploration: completed for this round.
- Current owner direction/default-branch/open issue/open PR/historical radar dedupe: completed.
- Fresh full repository pagination: completed, 41 visible / 40 unarchived.
- Runtime/user/deployment validation: **not performed**; opportunities remain evidence/strategy observations only.
- No issue-write race because no Issue/PR was modified.
- Next fair-rotation cursor: **`soundbox-offline`**.
