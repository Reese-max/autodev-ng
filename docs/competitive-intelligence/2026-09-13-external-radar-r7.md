# External Inspiration Radar — 2026-09-13 r7

> Scope: Reese-max owned + unarchived, product-like repositories. Public web is the primary research source; GitHub is used for current product truth, recent work, duplicate/lock checks and issue mapping. This round does not modify product source code, create implementation branches, merge, deploy, change secrets/permissions, or alter repository settings.

## Executive Summary

This round found one high-value, cross-portfolio opportunity and created **`Reese-max/academic-mcp#9` — `[Competitive Inspiration][Research][RESEARCH_REQUIRED] Progressive Tool Exposure + Selection Eval for the 81-tool gateway`** with an Opportunity Score of **94/100**.

The trigger is not a generic claim that “too many tools are bad.” The stronger market shift is that the MCP ecosystem is explicitly separating **canonical capability inventory** from the **small working set visible to the model for the current intent**:

- the official MCP roadmap (2026-08-22) now makes **progressive discovery** an explicit priority and states that a server with ~100 tools creates up-front context/selection costs;
- Amazon Bedrock AgentCore Gateway exposes a semantic tool-search primitive and enables semantic search by default in its gateway CLI flow;
- Cloudflare Code Mode now supports `search → describe → execute`, can suppress direct MCP-tool exposure while retaining the raw catalog, and documents one-/two-tool wrappers for large services;
- Anthropic’s older deferred-tool work remains background evidence, but is no longer the only vendor signal.

This matters immediately to `academic-mcp`: its current product contract intentionally preserves **81 upstream tools + 7 prompts** across arXiv, multi-source search and Semantic Scholar. The correct response is **not** to delete tools or replace them with an opaque `execute_anything` mega-tool. The opportunity is:

`CanonicalToolCatalog → Search/Progressive Exposure → Small Working Set → Existing Authority/Source Semantics → Actual Tool Call → Receipt`

The full 81-tool catalog stays canonical and parity-checked. A new selection eval first measures whether current hosts actually have routing/context problems; only then should an optional progressive surface be considered. Tool retrieval must never be allowed to silently substitute providers—e.g. Semantic Scholar `429` cannot be “solved” by querying Crossref and pretending the citation graph was answered.

Two additional signals are retained without creating Issues:

1. **Sticky** shipped improved multiple-choice distractors on 2026-09-06 and continues to expose voice→flashcard plus spaced review. For `voca`, `LanguageApp`, and education products, the transferable principle is to treat *question quality and misconception plausibility* as a product surface, not merely “generate more questions.” Current repo gaps are not verified, so this remains research-only.
2. **Chrome DevTools MCP v1.7.0** (Chrome 152, 2026-08-25) added deeper heap-snapshot inspection for coding agents, while WebMCP’s Imperative API docs were updated 2026-09-11. This reinforces the portfolio direction that browser products should prefer typed/native browser capabilities and explicit surface authority rather than expanding brittle visual automation. Existing `autodev-ng#28` and browser-tooling work already cover the relevant authority boundary, so no duplicate Issue was opened.

---

# Portfolio Snapshot / Product → Market Category

Current owned + unarchived product-like portfolio baseline: **37 repositories**.

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

Where current source/issue content was not readable or not re-verified in this round, Opportunity Map entries below preserve prior verified product direction and are explicitly not treated as new code-gap claims.

---

# External Signals

## A. Direct competitor / product signals

### A1. CONFIRMED — Scite keeps research-agent expansion inside the user’s existing AI client
**Date:** 2026-09-09  
**Source:** https://scite.ai/blog/citation-surfing-scite-mcp

Scite added `citation_graph` to its MCP so ChatGPT/Claude-style agents can follow references backward and citing work forward instead of relying only on keyword search. Its 2026-09-01 release notes also moved activation toward one-click connections to ChatGPT/Claude.

**JTBD:** stay in the current AI workspace while moving from discovery to literature lineage.

**Time/step advantage:** fewer tab switches and less manual copying of paper identifiers/citation lists.

**Onboarding/distribution:** one-click AI-client activation; MCP as the distribution channel.

**New mode:** citation graph becomes an agent-native primitive rather than a separate research UI.

**Business signal:** Scite uses subscription access; the integration increases the value of an existing paid research corpus rather than charging for MCP itself.

**Limits:** a citation relationship does not prove a claim is correct; access rights and source availability remain separate.

**Reese-max fit:** `academic-mcp#1` already covers canonical paper identity/evidence bundles. Do not duplicate Scite’s graph; preserve graph observations with source/freshness and combine them with #9’s tool-selection layer.

### A2. CONFIRMED — Sticky treats distractor quality and low-friction capture as core study UX
**Dates:** 2026-09-06 to 2026-09-09  
**Source:** https://www.getsticky.ai/

Sticky’s current product supports note/image/voice→flashcard conversion, spaced review and quiz mode. Its 2026-09-06 release specifically says multiple-choice wrong answers were changed so they no longer obviously reveal the correct answer; 2026-09-09 focused on faster/calmer launch.

**JTBD:** turn messy study material into short daily retrieval-practice sessions without spending time formatting cards.

**Why it feels faster:** camera/voice/text all converge into the same study artifact; review resumes quickly on mobile.

**Onboarding/distribution:** iOS-first, very small surface area rather than many study modes.

**New mode:** quality work is applied to the *negative options* and friction around starting a session, not only to answer generation.

**Pricing/business signal:** the public site emphasizes a compact core product rather than an enterprise workflow.

**Limit:** vendor claims about retention are marketing evidence and are not used as performance proof here.

**Reese-max fit:** for `voca` / `LanguageApp`, consider measurable distractor plausibility, error-reason categories and “resume the next useful review immediately.” Current repository gap is **UNKNOWN**, so no Issue is created.

### A3. CONFIRMED — Chrome DevTools MCP deepens native browser-debug capabilities instead of forcing visual automation
**Date:** 2026-08-25  
**Source:** https://developer.chrome.com/blog/new-in-devtools-152

Chrome DevTools MCP v1.7.0 expanded heap snapshot inspection (`get_heapsnapshot_object_details`) and native V8 context filtering for coding agents. The product direction is continued typed access to browser internals—network, performance, memory, console/state—not merely screenshot→click loops.

**JTBD:** let coding agents debug real browser behavior with machine-readable developer primitives.

**Workflow advantage:** the agent can interrogate the same native state a developer would inspect in DevTools instead of asking the user to copy console/network/memory evidence manually.

**Reese-max fit:** `chrome-devtools-mcp`, `autodev-ng#28`, browser assistants and coding-agent projects should favor typed capability leases + read-back over adding more visual-only automation.

**Do not copy:** do not equate DevTools access with permission to submit, buy, delete or mutate unrelated browser state.

---

## B. Adjacent transferable workflows

### B1. CONFIRMED — AWS makes semantic tool search a gateway primitive
**Source checked:** 2026-09-13  
**Sources:**
- https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-using-mcp-semantic-search.html
- https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-create-api.html

AgentCore Gateway can expose `x_amz_bedrock_agentcore_search`, which accepts a natural-language query and returns relevant tools. Semantic search is enabled by default in the AgentCore CLI gateway setup.

**Transferable workflow:**
`Intent → Tool Search → Candidate Tool Descriptors → Exact Invocation`.

**Why it matters:** discovery becomes a separate step rather than forcing all schemas into every turn.

**Do not copy:** semantic similarity is not authorization and is not proof that two provider-specific tools are interchangeable.

### B2. CONFIRMED — Cloudflare separates catalog, search/describe and execution
**Dates:** 2026-07-22 to 2026-08-26  
**Sources:**
- https://developers.cloudflare.com/changelog/post/2026-07-22-mcp-codemode-updates/
- https://developers.cloudflare.com/agents/model-context-protocol/guides/build-codemode-openapi-mcp-server/
- https://developers.cloudflare.com/agents/model-context-protocol/guides/build-codemode-mcp-server/

Cloudflare Code Mode supports `search()`, `describe()` and `execute()`. Think can disable automatic MCP tool exposure while preserving raw catalog/discovery, and large upstream services can be wrapped behind a small search/execute surface. Protected connector methods can still carry `requiresApproval`.

**Transferable workflow:**
`Canonical Capability Catalog → Search → Describe → Proposed Call → Existing Approval Policy → Execute → Receipt`.

**Key Reese-max adaptation:** keep typed source/effect boundaries visible; do not let a generic code/execute tool become a superuser shortcut.

### B3. CONFIRMED — Gemini Study Notebooks make diagnostics the start of the learning loop
**Date:** 2026-06-25; representative background signal  
**Source:** https://blog.google/innovation-and-ai/products/gemini-app/gemini-study-notebooks/

Gemini Study Notebooks begin with a diagnostic quiz, decompose a learning goal into many objectives, label strengths/focus areas/not-started, then choose follow-up lessons and quizzes from the learner’s real-time gaps.

**Transferable workflow:**
`Source/Syllabus → Diagnostic Evidence → Objective State → Next Best Practice → Re-test → Mastery Revision`.

**Fit:** `voca`, `LanguageApp`, `GenAI-Thinking`, `AICOLLEGE-GLSA` and exam-training products can reuse the *state machine*, not Google’s UI. This is not new enough to justify an Issue without a verified repo gap.

---

## C. Emerging technology / new product possibility

### C1. CONFIRMED — MCP officially starts progressive discovery work
**Date:** 2026-08-22  
**Source:** https://blog.modelcontextprotocol.io/posts/mcp-roadmap/

The MCP Core Maintainers explicitly identify scale of tool primitives as a problem: a server with ~100 tools imposes the full surface before the user asks a question and tool selection tends to worsen as catalogs grow. The roadmap starts a progressive-discovery effort so a server can offer a small entry point and reveal more tools as the conversation narrows.

This is the strongest new signal of the round because it changes the design assumption for large MCP servers. **“Server has 81 tools” no longer implies “model should receive 81 full definitions at once.”**

### C2. CONFIRMED — WebMCP moves typed site capabilities into the browser surface
**Last updated:** 2026-09-11  
**Source:** https://developer.chrome.com/docs/ai/webmcp/imperative-api

Chrome’s WebMCP Imperative API lets sites register typed tools with `modelContext` for operations such as form input, navigation and state management. It remains experimental/origin-trial territory; do not treat it as universal production availability.

**Product possibility:** future browser agents can combine:
`Site-declared typed tool → browser surface lease → effect gate → page read-back`
instead of choosing between raw DOM automation and site-specific REST integrations.

**Fit:** research-only for `chatgpt-gemini-extension-lite`, `chrome-devtools-mcp`, `autodev-ng#28`; no new Issue because the authority boundary already exists.

### C3. COMMUNITY_SIGNAL — practitioners are independently building deferred/searchable MCP wrappers
**Dates:** 2026-08-08 and 2026-09-09  
**Sources:**
- https://www.reddit.com/r/mcp/comments/1virmpf/cutting_an_mcp_server_from_85_tools_to_9_and_why/
- https://www.reddit.com/r/mcp/comments/1wb6d0i/built_an_mcp_to_be_king_of_all_my_other_mcps/

One practitioner reports reducing an 85-tool server to a smaller domain surface because deferred host search made thin overlapping tools harder to route; another built a local wrapper that searches tool descriptions rather than loading all MCPs into context. These are anecdotal reports only. They are useful as failure-mode hypotheses—ambiguity, retrieval misses, schema blast radius—not as token/accuracy benchmarks.

---

# New Releases / Recent Moves

| Date | Product / ecosystem | Change | Radar interpretation |
|---|---|---|---|
| 2026-09-11 | Chrome WebMCP docs | Imperative API updated | typed site-declared capabilities are moving closer to browser-native agent workflows |
| 2026-09-09 | Scite | `citation_graph` MCP tool | research agents increasingly navigate evidence relations inside existing AI clients |
| 2026-09-09 | Sticky | faster launch; recent voice/card workflow retained | study UX competition includes start friction and capture modalities |
| 2026-09-06 | Sticky | more plausible MCQ distractors | question-quality negatives matter, not just answer generation |
| 2026-08-26 | Cloudflare | single-tool Code Mode MCP server guide | large catalogs can stay canonical while model-visible surface shrinks |
| 2026-08-25 | Chrome DevTools MCP v1.7.0 | deeper heap/object inspection | browser agent differentiation moves toward native typed evidence |
| 2026-08-22 | MCP Core | progressive discovery added to roadmap | large-tool catalogs become an explicit protocol-level design concern |
| current | AWS AgentCore Gateway | semantic tool search | search-before-invoke is a managed gateway capability |

---

# Community Pain Points

All items below are **COMMUNITY_SIGNAL** only.

1. **Thin-tool collisions under deferred search.** A 2026-08-08 MCP practitioner described many narrowly named tools matching the same query once the host started retrieving tools rather than loading everything. Design implication: evaluate routing, do not optimize only tool count.
2. **Context/tool sprawl across many MCPs.** A 2026-09-09 practitioner built a local BM25/trigram wrapper because connected MCP definitions consumed scarce local-model context. Design implication: local deterministic retrieval is worth benchmarking before adding a cloud vector service.
3. **Host behavior is not stable across clients/models.** OpenAI developer-community reports during 2026 describe tools/apps disappearing or multi-step tool flows behaving differently across models/sessions. This is anecdotal and should be treated as a reason to record client/model/version/date in runtime receipts, not as proof of a current `academic-mcp` bug.

---

# Adjacent Ideas

1. **Capability Working Set:** maintain a canonical complete catalog while exposing only a task-relevant subset to the model.
2. **Tool Selection Eval:** score Top-1/Top-3 expected tool selection, wrong-provider substitution and ambiguity detection as first-class regression metrics.
3. **Discovery ≠ Authority:** retrieval ranks candidates; existing effect/source/auth gates still decide what can execute.
4. **Provider Semantics Receipt:** if a requested provider is rate-limited, report partial/unknown; do not silently switch sources and pretend semantic equivalence.
5. **Misconception-quality Eval:** for study products, test whether distractors are plausible but unambiguously wrong rather than obviously fake.
6. **Browser-native Capability Preference:** use DevTools/WebMCP/native typed state when available; retain human takeover/effect gates for consequential mutations.
7. **Diagnostic Learning State:** use evidence from quizzes to update objective-level mastery instead of merely generating more content.

---

# Opportunity Scores

| Candidate | Score | Disposition |
|---|---:|---|
| Progressive Tool Exposure + Selection Eval | **94** | **NEW `academic-mcp#9`** |
| MCP Tool Contract Refresh / Diff / Reapproval | 95 | existing `cf-mcp-server#15`; no duplicate |
| Agent layered authority envelope | 93 | existing `autodev-ng#12/#17/#21/#28`; no duplicate |
| Canonical Paper Identity + Research Bundle | 93 | existing `academic-mcp#1`, active PR #8 |
| Demonstration → Candidate Skill | 94 | existing `skill-foundry#5`; no duplicate |
| Structured Slide State + Render Verification | 92 | existing `ppt-studio#5`; no duplicate |
| Browser Capability Lease + Human Takeover | 92 | existing `autodev-ng#28`; new WebMCP/DevTools signals reinforce only |
| Diagnostic Learning Objective Graph | 88 | research list; repo gaps not re-verified |
| Study Distractor Quality / Error Model | 86 | research list; direct Sticky signal but no verified duplicate-safe gap |
| WebMCP site-native tool bridge | 84 | research list; experimental browser support and existing authority work |

---

# Opportunity Map — all 37 products

Legend: entries are product-direction hypotheses. `UNKNOWN` means this round did not re-verify a source-code gap.

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| 92-duty-scheduler | reliable canonical roster + post-publish state | exception/self-service handling | auditable rule/approval receipts | diagnostic queue for unresolved requests | chat-owned shadow roster |
| AICOLLEGE-GLSA | source-grounded learning/research state | objective-level progress evidence | reusable learning-evidence graph | diagnostic→next-best lesson loop | endless generated content without mastery state |
| AIOS | scoped capability/identity boundaries | capability discovery + receipts | composable authority contracts | progressive capability working set | one global `agent_trusted` flag |
| GenAI-Thinking | explainable learning artifacts | diagnose misconceptions, not just score | revision/evidence trail for reasoning exercises | plausible-distractor eval | gamification without learning evidence |
| LanguageApp | mobile/offline continuity + review state | rapid capture→practice loop | misconception/error taxonomy | voice→candidate cards | clone every flashcard mode |
| ScriptVault | stable canonical archive + provenance | search/retrieval without duplicate copies | versioned artifact lineage | capability-aware retrieval | AI overwriting canonical scripts silently |
| academic-mcp | truthful source/error semantics + full canonical catalog | **progressive tool exposure + routing eval** | private cross-source evidence receipts | tool working set + canonical paper ledger | replacing 81 tools with unrestricted mega-tool |
| ai-novel-workstation | canonical manuscript + continuity truth | typed external-agent candidate patches | exact-base promotion/receipt | progressive story-tool exposure | raw filesystem authority |
| autodev-ng | principal/environment/effect separation | searchable capability catalog where large | cross-engine evidence/approval receipts | progressive tool working sets | monolithic AI control-plane boolean |
| cf-ai-router | truthful provider/cost receipts | cache-aware exact usage accounting | fail-closed economic routing | capability discovery for provider functions | routing to unknown-cost provider silently |
| cf-mcp-server | OAuth/effect gates + tool-contract drift | discoverable small working sets for large catalogs | manifest/diff/authority separation | progressive discovery after #15 | generic execute tool bypassing L1/L2/L3 |
| chatgpt-gemini-extension-lite | explicit browser/app scope | typed/native browser capabilities | client-side minimal-permission bridge | WebMCP capability intake | broad page/credential access by default |
| chrome-devtools-mcp | native browser debugging evidence | current DevTools/WebMCP compatibility | browser-state receipts | capability category loading | screenshot-only debugging when typed state exists |
| clinical-scribe-worker | provenance + manual-edit preservation | section-scoped candidate repair | ownership boundaries for clinician text | redaction transform with semantic check | regenerate entire note over user edits |
| eson-anh-intelligence | source/date/confidence provenance | support + challenge evidence | evidence conflict receipts | counterevidence lane | model disagreement as truth |
| flux-image-gen | candidate revisions + moderation | spatial intent/drift verification | lineage + compare/promotion | typed edit regions | flattening every revision into final-only image |
| herdr-skills | candidate/promotion separation | measure steering/correction reuse | policy provenance | tool-selection eval as skill test | auto-promote repeated instruction |
| kindle-to-ebook | valid export | accessibility/reading-system conformance | conformance receipt | EPUB 3.4/A11y 1.2 | “file generated” = “ebook correct” |
| koxygen-ai-poster | editable structured artifact | object-level candidate edits | render + structure verification | slide-style stable object graph | final raster as canonical source |
| lplrs-judicial-sync | date coverage and missing-day accounting | recoverability/irrecoverable-gap receipt | source-date completeness proof | evidence bundle identity | schedule success = data coverage |
| mens-psychology-radar | dated multi-source provenance | counterevidence and uncertainty | contested-claim state | evidence conflict sets | anecdotal community post as statistic |
| nanobanana-linebot | ordered messaging + source identity | canonical task/result state | messaging-to-typed-workflow handoff | structured request intake | conversation as sole database |
| ninax-line-hermes | redelivery/edit/order correctness | typed intent→canonical operation | exact message lifecycle receipt | tool working-set per intent | adding agent autonomy before transport correctness |
| note-filler | user-owned field preservation | field-level candidate changes | provenance per field | diagnostic missing-field intake | AI overwriting manual values |
| ppt-studio | native editable export + render fidelity | object/slot-level candidate patches | structure/render dual verification | progressive presentation tool surface | regeneration of whole deck for tiny edits |
| rental-system | canonical tenant/request state | conversation→structured request | exact status/activity receipt | DoorLoop-style maintenance intake | AI inventing lease/payment facts |
| run-ai-coding-agents | isolated execution + receipts | discover only task-relevant tools | environment/principal/effect decomposition | progressive tool catalogs | full global tool/secret surface |
| skill-foundry | candidate→eval→promotion | learned demo + runtime/tool-selection eval | provenance across quality/security/compatibility | capability search skill tests | one-demo = certified skill |
| soundbox-offline | offline/local reliability | source/cache integrity | local-first media ownership | network library source after blockers | cloud dependence for core playback |
| taichung-police-intel | official-source provenance + freshness | counterevidence/conflict state | operational evidence bundles | claim challenge lane | social signal as confirmed fact |
| taiwan-intel-dashboard | source/date/confidence + dedupe | evidence conflict/read-back | cross-source canonical event state | counterevidence lane | summary without source lineage |
| tick-stock-panel | deterministic strategy representation + isolation | evidence-backed run receipts | NL→typed strategy without arbitrary Python | tool search for analytic capabilities | in-process generated Python expansion |
| tw-heritage-wallpaper | source/rights metadata | offline/resilient asset handling | cultural-source provenance | structured artifact metadata | unclear-rights scraping |
| video-timeline-pipeline | deterministic source/timecode lineage | target-native capability probe/read-back | evidence→candidate cut→verified target state | NLE tool discovery by capability | MCP connected = edit applied correctly |
| voca | spaced review + progress continuity | misconception/distractor quality | adaptive error taxonomy | voice/photo→candidate cards | mode sprawl or obvious wrong options |
| voice-actress | citation exists/supports-claim separation | support + challenge evidence | legal-source answer-span verification | counterevidence lane | citation checker = legal correctness |
| yt-infographic-worker | source→claim→visual provenance | editable structured output + render check | verified infographic handoff | object graph / progressive media tools | flattening provenance into an image only |

---

# Top 10 Cross-Portfolio Ideas

1. **Canonical Capability Catalog → Progressive Working Set → Existing Authority → Receipt.** New highest-value reusable primitive this round.
2. **Tool Selection Eval as a release gate.** Test expected tool routing, ambiguity and provider substitution, not only final answer quality.
3. **Identity / Contract / Exposure / Authority are separate states.** A tool can exist without being visible; be visible without being authorized; be authorized without a verified outcome.
4. **Counterevidence Lane.** Evidence-heavy products should optionally search for challenge/contradiction, but independent sources—not agent disagreement—decide truth state.
5. **Candidate Safety Transform.** Safer rewrites remain candidates and must pass the same policy before execution.
6. **User-owned vs AI-owned fields/objects.** Manual edits should become explicit ownership boundaries.
7. **Canonical Data → Generated Task View → Validated Mutation → Same Canonical Data.** Use generative UI to reduce mode sprawl instead of creating shadow databases.
8. **Structured artifact + rendered-state verification.** Relevant to slides, posters, ebooks, video and generated documents.
9. **Diagnostic state → next-best action.** Study/training products should choose practice from observed gaps rather than generate infinite material.
10. **Native typed capability over visual imitation.** Prefer DevTools/WebMCP/API/NLE-native operations when available; visual/browser automation becomes fallback, not default.

---

# Ideas Rejected / Deferred

1. **Replace `academic-mcp`’s 81 tools with one unrestricted code/execute tool — REJECT.** It destroys explicit schemas/source boundaries and can enlarge authority.
2. **Delete thin academic tools solely because a Reddit user reduced 85→9 — REJECT.** Anecdotal evidence; first measure actual Reese-max routing errors.
3. **Add a cloud vector DB just for tool search — DEFER.** Local deterministic lexical/embedding approaches should be benchmarked first for this private gateway.
4. **Assume ChatGPT currently receives all 81 schemas every turn — REJECT as unverified.** Host-managed tool filtering is opaque and can change; runtime measurement is required.
5. **Treat arXiv/Crossref as fallback answers for Semantic Scholar citation queries — REJECT.** Source capabilities are not semantically interchangeable.
6. **Clone Sticky’s full flashcard product into `voca`/`LanguageApp` — REJECT.** Only the distractor-quality and low-friction-capture principles are retained until current gaps are verified.
7. **Build a new browser super-agent because WebMCP exists — REJECT.** Existing browser-capability/effect primitives already cover the useful boundary, and WebMCP is still experimental.
8. **Create another citation-graph product beside `academic-mcp#1` — REJECT.** Existing upstream tools already provide graph capability; provenance/identity and discovery are the differentiators.

---

# Issue / PR Mapping

| Product | Existing/new work | This round |
|---|---|---|
| academic-mcp | **NEW #9 Progressive Tool Exposure + Selection Eval** | created after duplicate search; research-only |
| academic-mcp | #1 Canonical Paper Identity + Research Bundle; PR #8 | active; untouched |
| academic-mcp | #2 host-independent integrity gate; PR #5 | active; #9 production changes depend on an equivalent verified gate |
| academic-mcp | #3 recovery; PR #6 | active; unrelated, untouched |
| academic-mcp | #4 service home isolation; PR #7 | active; unrelated, untouched |
| cf-mcp-server | #15 Tool Contract Manifest + Drift Gate | complementary; no duplicate |
| autodev-ng | #12/#17/#21/#28 | progressive discovery must not collapse existing authority boundaries |
| skill-foundry | #5 Demonstration-to-Skill | potential later consumer of tool-selection eval; no new Issue |
| ppt-studio | #5 Structured Slide State + Render Verification | no new Issue |

No product source code, implementation branch, merge, deploy, secret, permission or repository setting was changed.

---

# Sources

## CONFIRMED
- 2026-09-13 checked — AWS AgentCore Gateway semantic tool search: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-using-mcp-semantic-search.html
- 2026-09-13 checked — AWS Gateway creation / semantic search configuration: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-create-api.html
- 2026-09-11 update — Chrome WebMCP Imperative API: https://developer.chrome.com/docs/ai/webmcp/imperative-api
- 2026-09-09 — Scite Citation Surfing / `citation_graph`: https://scite.ai/blog/citation-surfing-scite-mcp
- 2026-09-01 — Scite August release notes: https://scite.ai/blog/august-2026-release-notes
- 2026-09-09 / 2026-09-06 — Sticky product + recent shipped changes: https://www.getsticky.ai/
- 2026-08-26 — Cloudflare single-tool Code Mode MCP server guide: https://developers.cloudflare.com/agents/model-context-protocol/guides/build-codemode-mcp-server/
- 2026-08-25 — Chrome DevTools 152 / MCP v1.7.0: https://developer.chrome.com/blog/new-in-devtools-152
- 2026-08-22 — official MCP roadmap / progressive discovery: https://blog.modelcontextprotocol.io/posts/mcp-roadmap/
- 2026-07-27 — Cloudflare search+execute OpenAPI MCP: https://developers.cloudflare.com/agents/model-context-protocol/guides/build-codemode-openapi-mcp-server/
- 2026-07-22 — Cloudflare Code Mode exposure controls/search/describe/execute: https://developers.cloudflare.com/changelog/post/2026-07-22-mcp-codemode-updates/
- 2026-06-25 — Gemini Study Notebooks: https://blog.google/innovation-and-ai/products/gemini-app/gemini-study-notebooks/
- 2025-11-24 background — Anthropic advanced tool use: https://www.anthropic.com/engineering/advanced-tool-use
- 2025-11-04 background — Anthropic code execution with MCP: https://www.anthropic.com/engineering/code-execution-with-mcp

## COMMUNITY_SIGNAL
- 2026-08-08 — practitioner 85→9 MCP tool redesign: https://www.reddit.com/r/mcp/comments/1virmpf/cutting_an_mcp_server_from_85_tools_to_9_and_why/
- 2026-09-09 — practitioner searchable MCP wrapper: https://www.reddit.com/r/mcp/comments/1wb6d0i/built_an_mcp_to_be_king_of_all_my_other_mcps/

## GitHub product truth / coordination
- https://github.com/Reese-max/academic-mcp/blob/main/README.md
- https://github.com/Reese-max/academic-mcp/issues/1
- https://github.com/Reese-max/academic-mcp/issues/2
- https://github.com/Reese-max/academic-mcp/issues/3
- https://github.com/Reese-max/academic-mcp/issues/4
- https://github.com/Reese-max/academic-mcp/issues/9
- https://github.com/Reese-max/academic-mcp/pull/5
- https://github.com/Reese-max/academic-mcp/pull/6
- https://github.com/Reese-max/academic-mcp/pull/7
- https://github.com/Reese-max/academic-mcp/pull/8

---

# What Changed Since Last Radar (r6 → r7)

1. **New high-value Issue created:** `academic-mcp#9` Progressive Tool Exposure + Selection Eval, score 94/100.
2. **New market/protocol conclusion:** MCP itself now treats progressive discovery as a first-class scale problem, not merely a third-party optimization.
3. **New cross-vendor validation:** AWS semantic tool search + Cloudflare search/describe/execute independently support search-before-invoke architectures.
4. **Important correction to portfolio assumptions:** preserving a full canonical tool catalog does **not** require exposing the full catalog to the model in every turn. The two contracts should be separate.
5. **No claim of current failure:** this round does not assert that ChatGPT presently injects all 81 academic schemas or that tool routing is broken. #9 starts with measurement/evals precisely because host behavior is opaque.
6. **New direct-product study signal:** Sticky’s recent distractor-quality work reinforces misconception-quality as a study-product metric, but no Reese-max repo gap was verified, so no Issue.
7. **Browser-native trend reinforced:** Chrome DevTools MCP and WebMCP continue expanding typed browser capabilities; existing browser authority/effect Issues remain sufficient.

## New Portfolio Principle

**`Canonical Capability ≠ Model-visible Capability ≠ Selected Tool ≠ Authorized Tool ≠ Successful Call ≠ Verified Result`**

The highest-value next step is not to make Reese-max agents know fewer things. It is to make capability breadth **discoverable on demand**, while keeping exact semantics, source identity, authorization and runtime verification visible at every stage.
