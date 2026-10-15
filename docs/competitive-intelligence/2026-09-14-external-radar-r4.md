# External Competitive / Product / Workflow Inspiration Radar — 2026-09-14 r4

> Scope: Reese-max owned, unarchived repositories that are product-like. Public web is the primary market-evidence source; connected GitHub is used for repository purpose/recent-change checks, duplicate/lock coordination, Issue/PR mapping, and this central report.
>
> Portfolio count checked this round: **38 owned + unarchived repositories; 35 treated as product-like.** `adng-memory` and `internship-notes-sites-mirror` remain coordination/support references. Newly observed `spotify-playlist-organizer-mcp` is public but currently empty (`size: 0`), so product status is **UNKNOWN** and it is not scored until it has an inspectable product contract/workflow.
>
> Evidence labels: **CONFIRMED** = first-party product/docs/release information or directly inspectable current repository state; **LIKELY** = reasonable inference that still needs runtime/user validation; **COMMUNITY_SIGNAL** = anecdotal user report only; **UNKNOWN** = insufficient evidence or outcome must be measured.
>
> Safety boundary: no product source code, implementation branch, merge, deploy, secrets, permissions, repository settings, or production runtime configuration were changed in this round.

---

## Executive Summary

This round found a **major professional-video workflow shift** that materially sharpens the direction for `video-timeline-pipeline`:

**Adobe Premiere 26.5 (2026-09-09) now combines transcript→sequence editing (`Paper Edit`) with timeline-context generative video/SFX (`Generative Media Tool`) inside the NLE itself.** The editor can select a timeline range, describe missing media, optionally use current sequence frames as references, choose Adobe Firefly or supported partner models, see the generative-credit cost for the current combination, and receive generated results as editable clips without leaving Premiere.

The important competitive signal is not “Reese-max should add Veo/Kling/Luma.” It is the opposite:

`Evidence / Edit Intent → Typed Handoff → Professional NLE owns model choice + generation UI + paid execution → Generated Clip → Read-back / Approval`

For `video-timeline-pipeline`, this strengthens the existing `#11 Evidence-backed Paper Cut / NLE Handoff` direction. It argues for a future **typed `MediaGapIntent` / `GenerationIntent` in the handoff contract**, not for building another general-purpose AI video generator or duplicating Adobe’s billing/model marketplace.

### GitHub coordination result

**No new Issue and no Issue update were made.**

`video-timeline-pipeline #11` already owns the exact NLE-handoff fingerprint and explicitly covers Premiere 26.5 Paper Edit. More importantly, connected GitHub shows **open PR #15 (`devin/issue-11-research`) referencing #11**, and the Issue already contains a `devin-loop: research/design PR opened` comment. Under the cross-schedule coordination rule, this radar **does not compete for the lock or add comments to the active Issue**. The new Adobe Generative Media evidence is recorded only here for the active implementation/research workflow to consume later.

### Strongest principle this round

`Generation Intent ≠ Model Selection ≠ Paid Generation Authority ≠ Generated Media ≠ Approved Timeline Revision`

This is the same portfolio design pattern seen elsewhere: preserve intent as a typed candidate; let the system that owns the real capability execute it; verify the resulting effect before promoting it into canonical state.

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
| `video-timeline-pipeline` | evidence→video/NLE automation | CutSpec, NLE handoff, capability/read-back, creative approval |
| `ai-novel-workstation` | long-form writing workstation | canonical story state, context routing, resumability, cost |
| `clinical-scribe-worker` | clinical documentation | section-scoped regeneration, revision/undo, clinical truth boundary |
| `MaterialYouNewTab` | browser new-tab/productivity dashboard | local/browser state, command surface, compatibility, privacy |
| `cf-mcp-server` | MCP / SaaS tool server | tool-contract drift, exact effect authority, runtime receipt |
| `tick-stock-panel` | stock/strategy analysis | point-in-time data, deterministic strategy, no live-trade leap |
| `herdr-skills` | agent skills / policy improvement | correction→candidate preference/skill, scoped promotion |
| `ninax-line-hermes` | LINE AI gateway / ordered messaging | revision/redelivery ordering, stale-answer invalidation |
| `ai-flight-radar` | flight intelligence / fare tracking | intent→reviewed WatchSpec→bounded scheduled evaluation |
| `academic-mcp` | scholarly retrieval / research-agent gateway | progressive tool exposure, source identity, research ledger |

### Recent connected-GitHub changes checked

- `autodev-ng` received the previous r3 radar and further portfolio-audit documentation after it.
- `92-duty-scheduler` received a 2026-09-14 Round-4 persona audit commit; the current tracker also contains a new P2 CI-execution finding, so feature breadth should not outrun its release/reliability evidence.
- `video-timeline-pipeline` still has multiple open research/implementation PRs. In particular, **PR #15 references #11 and remains open**, so this radar does not touch #11.
- `flux-image-gen` now already has dedicated competitive Issues for provenance/content credentials and creative edit/reference workflow; those fingerprints are therefore occupied and excluded from new Issue creation here.
- `ai-novel-workstation` already has Context Manifest, Cost Envelope, Agent-facing Story Workspace, and CI-gate work; no new writing-workstation Issue is warranted from this round’s external signals.
- `cyber-prep-coach` already has local mastery/adaptive Today Task and independent explanation-calibration Issues; current education signals map to those existing directions rather than a new feature.
- New `spotify-playlist-organizer-mcp` is empty, so no market-gap claim is made for it.

---

# External Signals

## A. Direct competitor — Adobe Premiere 26.5: transcript editing and generative gap-filling converge inside the timeline

**CONFIRMED — 2026-09-09**

Sources:
- https://helpx.adobe.com/premiere/desktop/whats-new/whats-new.html
- https://helpx.adobe.com/premiere/desktop/edit-projects/edit-with-generative-ai/generative-media-tool-overview.html
- https://helpx.adobe.com/premiere/desktop/edit-projects/edit-with-generative-ai/generate-media-with-generative-media-tool.html
- https://helpx.adobe.com/premiere/desktop/edit-projects/edit-with-generative-ai/generative-media-tool-faq.html

### What changed
Premiere 26.5 ships both:
1. **Paper Edit** — select transcript lines and construct a sequence directly from transcript selections.
2. **Generative Media Tool** — select a range in the timeline and generate video or sound effects from text; video can use sequence frames as references; users can choose Adobe Firefly or supported partner models; results enter the sequence as editable clips.

Adobe’s FAQ further states that generative usage varies by model/settings, the task bar shows the credit cost of the current combination, Adobe credits work across Adobe/partner models without separate partner accounts, and some partner-model access differs by account/plan while business availability for some models remains under additional review.

### 1) Job-to-be-Done
An editor has already identified a missing shot, transition, ambience or sound effect **at a specific timeline location** and wants to fill that gap without leaving the editing context, exporting references, logging into another model provider, then re-importing and realigning the result.

### 2) Why it feels faster / more reliable
- timeline range supplies duration/placement context;
- current sequence frames can become references without manual export/import;
- generated result returns as an editable clip rather than a detached downloaded asset;
- generation history/prompt/reference context can be revisited in the editor;
- credit cost is visible at the point of action rather than discovered only after a provider call.

These are workflow/mechanism claims based on first-party product behavior. No Adobe marketing percentage is treated as proof of time saved or quality.

### 3) Onboarding / distribution signal
Adobe distributes multiple model providers **inside the editor people already use**. The editor remains the canonical workspace; the model provider is a capability behind an action, not a second project system.

### 4) New capability pattern
`Timeline Context + Gap Intent + Optional Reference Frames + Model Choice + Cost Preview → Generated Clip → Continue Editing`

For Reese-max the transferable abstraction is narrower:

`Canonical Evidence/CutSpec → MediaGapIntent → NLE-native execution → generated-clip identity → project read-back → human approval`

### 5) Pricing / business-model signal
The model marketplace is hidden behind one Adobe credit/billing surface. The valuable product signal is **cost preview near the action + one host product owning model brokerage**. Reese-max should not reproduce this marketplace; it should preserve cost class/unknown state in the handoff and let the NLE/provider surface own actual paid execution.

### 6) Complaints / limitations
- Partner model availability differs by account/plan; some business-plan support is still being reviewed.
- Cloud generation requires network access and consumes credits.
- **COMMUNITY_SIGNAL only:** a 2026-09-12 Premiere user reported MXF/ProRes problems and a rollback from 26.5 to 26.3.2. This does not establish a release-wide defect rate; it is only a reminder that NLE-version compatibility/read-back must be measured rather than assumed.

Community source:
- https://www.reddit.com/r/premiere/comments/1we01yq/frame_substitution_recursion_attempt_in_premiere/

### 7) Absorb vs do not copy
**Absorb**
- represent an editing gap/creative need as a typed object tied to an exact timeline range;
- preserve reference-frame/source provenance if the host NLE can consume it;
- make paid execution a distinct capability/approval step;
- record resulting generated clip/project identity and read-back status when possible.

**Do not copy**
- do not add Veo/Kling/Luma accounts or a model marketplace to `video-timeline-pipeline`;
- do not let the intelligence pipeline silently trigger paid generation;
- do not consider “asset generated” equivalent to “timeline revision approved”;
- do not claim an NLE adapter supports a feature until an actual import/read-back canary verifies it.

### Opportunity Score
**94/100 — existing #11 fingerprint, active PR #15, central-report only.**

Recommended future extension to #11 after the active owner/PR is ready to consume new evidence:

```text
MediaGapIntent {
  source_cut_spec_hash,
  target_range,
  media_kind: video | sfx | ambience | unknown,
  desired_duration,
  prompt_or_brief,
  reference_occurrence_ids[],
  constraints,
  paid_execution: external_host_required,
  status: suggested | approved_for_handoff | fulfilled | rejected | unknown
}
```

The pipeline should be able to export such intent **without itself making the paid generation call**.

---

## B. Adjacent transferable workflow — Kahoot: AI assistant as authoring surface, canonical product remains the save/host system

**CONFIRMED — help pages updated 2026-09-10 / 2026-09-11**

Sources:
- https://support.kahoot.com/hc/en-us/articles/36769571498397-How-to-create-kahoots-with-ChatGPT
- https://support.kahoot.com/hc/en-us/articles/36770398743581-How-to-connect-ChatGPT-Claude-and-other-AI-Assistants-to-Kahoot-using-the-MCP-Server

Kahoot now lets users create/edit quiz drafts directly from ChatGPT, and documents MCP access from ChatGPT/Claude/other compatible assistants. The user can start from PDFs/articles/study notes/meeting summaries/ideas in the assistant, while Kahoot account/workspace remains the place where the artifact is saved, hosted and managed.

### 1) Job-to-be-Done
Turn material already being discussed with an AI assistant into a structured learning artifact without manually retyping every question inside the destination product.

### 2) Why it saves steps / improves reliability
- the user does not need to move source material into a separate creator one field at a time;
- the assistant can create/edit a structured draft through the product connector;
- canonical saving/hosting still belongs to Kahoot, reducing the chance that a chat transcript becomes the accidental source of truth.

### 3) Onboarding / distribution
Kahoot is distributed **inside the AI client the user already inhabits** rather than forcing every workflow to begin from kahoot.com.

### 4) New capability pattern
`User material in assistant → structured draft → review/edit → canonical product artifact → host/share`

### 5) Pricing/business-model signal
The ChatGPT app is documented as free to ChatGPT users, while an active Kahoot account is required to save/host. The strategic signal is that **distribution surface and canonical product/account can be separated**.

### 6) Limitations / risks
- AI-generated questions still require review; the integration itself is not evidence of factual correctness or pedagogy.
- External assistant access increases scope/auth/provenance questions.
- Existing source-rights and answer-authority contracts must remain authoritative.

### 7) Reese-max transfer
Fits most strongly as an architectural pattern for `cyber-prep-coach`, `police-exam-practice`, `UkePack`, `ppt-studio`, and `ai-novel-workstation`: external AI can prepare a **candidate artifact** while the product keeps validation/promotion/export truth.

It does **not** justify a new Issue this round. Relevant products already have candidate/review/source-provenance or external-agent workspace work; `cyber-prep-coach` in particular must resolve explanation-calibration and official-mode correctness before broadening AI authoring.

**Opportunity Score: 88/100 — cross-portfolio research pattern, no new Issue.**

---

## C. Emerging technology — Chrome WebMCP: webpages can expose structured tools to browser agents instead of relying on pixel/DOM actuation

**CONFIRMED experimental platform direction — docs updated through 2026-09-11; API remains Origin Trial / experimental**

Sources:
- https://developer.chrome.com/docs/ai/webmcp
- https://developer.chrome.com/docs/ai/webmcp/imperative-api
- https://developer.chrome.com/docs/ai/webmcp/secure-tools
- https://developer.chrome.com/docs/ai/webmcp/evals

Chrome’s WebMCP proposal lets a web page register structured tools with schemas and page state so browser agents can call explicit functions instead of inferring controls from DOM/pixels. The Imperative API documentation was updated on **2026-09-11**. Chrome’s security guidance explicitly calls out prompt injection and recommends `readOnlyHint`, `consequentialHint`, `untrustedContentHint`, origin exposure controls, strict validation and evaluation testing.

### 1) Job-to-be-Done
Allow an agent to invoke a site’s real domain action reliably—search, fill a structured form, change state, run diagnostics—without fragile click/DOM guesswork.

### 2) Why it may save steps / improve reliability
A typed tool exposes semantic intent and input schema directly. This removes several perception/actuation steps and can give the application explicit validation/error handling.

This is a platform-design claim; reliability improvement for Reese-max remains **UNKNOWN until tested**.

### 3) Onboarding / distribution
The agent discovers tools when visiting the web app. No separate server may be required for some local browser workflows, but client/browser support remains experimental and discoverability currently depends on visiting the site.

### 4) New capability pattern
`Human-first UI + structured agent tool surface + shared application state + explicit sensitive-action hints`

### 5) Pricing/business model
The browser API itself is not a SaaS billing product. Its strategic value is reducing the need to build and host a second remote automation API for every local UI action.

### 6) Limitations / failure modes
- Origin Trial / active discussion: API shape can change.
- Prompt injection remains a first-class threat; the Chrome docs explicitly say model-layer safety cannot guarantee protection.
- Sensitive read-only tools can still leak user data.
- Cross-origin exposure and extension host permissions require deliberate scoping.
- Headless workflows are not the primary design target.

### 7) Reese-max transfer
The most obvious future test bed is `MaterialYouNewTab`, because it already has a command palette, tasks, scratchpad, workspaces, Pomodoro and local-first browser state. A tiny read-only/low-risk experimental adapter could eventually expose actions such as `list_workspaces`, `get_focus_status`, `start_focus_session` or `create_scratchpad_candidate`.

However, **do not create an Issue yet**: current docs focus on web applications/agent extensions, and compatibility with a `chrome-extension://` new-tab document plus the exact permission/origin-trial constraints needs a real spike. The product also stores personal notes/tasks locally, so exposing broad reads/writes before that security proof would be irresponsible.

**Opportunity Score: 82/100 — research list only; status LIKELY/UNKNOWN for Reese-max extension-page applicability.**

---

# New Releases / Recent Market Movement

1. **Adobe Premiere 26.5 — 2026-09-09:** Generative Media Tool + Paper Edit place both transcript-driven assembly and AI video/SFX generation inside the professional timeline. This is the strongest new strategy signal in this round.
2. **Kahoot AI assistant integration — support docs updated 2026-09-10/11:** ChatGPT app plus MCP server separate the assistant authoring surface from Kahoot’s canonical save/host surface.
3. **Chrome WebMCP Imperative API docs — updated 2026-09-11:** structured browser-agent tool invocation continues to mature, but remains experimental and security-sensitive.
4. **Descript current AI video surface — checked 2026-09-14:** Descript similarly mixes generated B-roll/scenes with recorded media inside the same editable project. This independently reinforces the “generation belongs inside the editing context” trend, while not changing the Reese-max recommendation to remain a handoff/evidence product rather than a full editor.

Descript sources:
- https://www.descript.com/ai-video
- https://www.descript.com/tools/generative-video-b-roll

---

# Community Pain Points

All items below are **COMMUNITY_SIGNAL**, not statistics:

1. A Premiere 26.5 user reported MXF/ProRes instability and rollback to 26.3.2 after upgrading. Product implication: NLE adapter/version support requires exact runtime receipts; never infer compatibility from release notes alone.
2. Existing creator discussions continue to show discomfort around generative-credit consumption and version stability. Product implication: keep paid generation and canonical edit promotion separate, and expose `UNKNOWN` when actual billing/runtime behavior is not measured.
3. No new community signal this round was strong enough to override the first-party evidence or justify a standalone feature.

---

# Adjacent Ideas

## 1. MediaGapIntent / GenerationIntent as handoff metadata
For video evidence workflows, a “missing shot/SFX here” request can be a versioned candidate object without requiring this product to own a generator.

## 2. Capability delegated to the host that owns context
Premiere is best positioned to know sequence duration/settings/reference frames; Kahoot is best positioned to validate/save/host a kahoot; a browser app is best positioned to validate its own state transitions. Reese-max should pass **intent + evidence**, not duplicate every downstream execution engine.

## 3. External AI as a distribution surface, not source of truth
Kahoot demonstrates that ChatGPT/Claude can be the conversational entry point while the domain product remains canonical. This reinforces `ai-novel-workstation #6`, the portfolio’s MCP tool-contract work, and candidate/promotion boundaries.

## 4. Browser-native structured tool surfaces
WebMCP may eventually reduce brittle screen/DOM automation for local-first browser apps, but should begin read-only and be evaluated as an interoperability experiment rather than a new product pillar.

## 5. Pre-action cost visibility
Adobe showing generative credits before generation reinforces the portfolio pattern already present in `ai-novel-workstation #4`, `video-timeline-pipeline` cost guards, `cf-ai-router`, and `prompt-autoresearch`: cost is a property of an effect proposal, not merely an after-the-fact report.

---

# Opportunity Scores

| Candidate | User Pain | Strategic Fit | Novelty | Evidence | Reuse | Effort/control | Risk/control | Score | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| NLE-native `MediaGapIntent` / GenerationIntent handoff | 9 | 10 | 8 | 10 | 8 | 8 | 8 | **94** | Existing #11 fingerprint; PR #15 active; central report only |
| External AI authoring → candidate domain artifact → canonical product | 9 | 9 | 7 | 9 | 10 | 8 | 8 | **88** | Cross-portfolio research pattern; no new Issue |
| WebMCP adapter for local browser-product commands | 7 | 8 | 9 | 8 | 8 | 7 | 6 | **82** | Experimental research list only |
| General-purpose multi-model video generation inside `video-timeline-pipeline` | 6 | 3 | 4 | 10 | 4 | 2 | 3 | **48** | Reject / DO NOT COPY |
| New quiz-generation AI inside `cyber-prep-coach` | 5 | 5 | 3 | 8 | 5 | 6 | 4 | **55** | Reject now; existing calibration/mastery work higher value |

Scoring remains heuristic. No candidate is promoted merely because of a numeric threshold; repo evidence, duplicate status, active work and runtime safety govern the final decision.

---

# Opportunity Map — Full Product Portfolio

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| `exam-archive` | stable source IDs + revision metadata | correction/removal history | archive→practice provenance chain | candidate question-pack handoff | AI-generated source facts without official evidence |
| `police-exam-practice` | reliable session/resume | explainable weakness/review queue | official-source-linked rationale | external-AI candidate quiz import after validation | generic quiz generator before source correctness |
| `police-exam-archive` | source manifest + hash/revision | changed/withdrawn-source visibility | canonical exam archive | archive→practice typed handoff | replacing official docs with summaries |
| `92-duty-scheduler` | published roster truth + request status | conflict reasons + minimal-change proposals | policy-aware human-approved repair | assistant entry surface over existing Duty Inbox | auto-publish schedule edits |
| `UkePack` | deterministic MusicXML import/export | teacher-review diff | source→practice artifact lineage | assistant-generated candidate annotations | AI rewriting musical truth without teacher gate |
| `ppt-studio` | native editable export | object-level patch + render verification | structured slide state + verified export | external AI candidate patch | flat-image “editable” deck generation |
| `voice-actress` | exact citations/source versions | contradiction/counterevidence visibility | claim/rubric provenance | assistant entry point over canonical evidence | uncited fluent answers |
| `taiwan-intel-dashboard` | freshness + source link | changed-since-last + conflict handling | multi-source provenance | read-only structured agent query surface | agent write access to source truth |
| `autodev-ng` | bounded tasks/locks/receipts | review-pressure telemetry | verified multi-engine outcome | host-specific tool/effect delegation | rebuilding every generic agent runtime feature |
| `flux-image-gen` | generation history/version | provenance/content-credential preservation | local-first candidate/reference workflow | typed asset handoff to downstream editors | another generic model marketplace |
| `claude-mem` | source-linked recall | temporal truth/freshness states | safe injection + RecallReceipt | WebMCP/browser-state memory only after privacy proof | “remember more” without staleness |
| `lobsterpulse` | freshness/dedupe | attention budget + changed-since-last | decision-oriented queue | structured read-only alert tools | another generic news feed |
| `prompt-autoresearch` | holdout/stability | separate judge/resource receipts | compaction/Pareto promotion | host-provided evaluator capability | score-only optimization |
| `neciken-summer-poem` | frozen revisions | policy/version provenance | contest-safe candidate isolation | AI assistant as drafting surface, canonical file remains local | silent canonical rewrite |
| `note-filler` | source-linked fields | stale/conflict detection | claim-level candidate patch | assistant creates candidate structured form | auto-overwrite from generated text |
| `lplrs-judicial-sync` | authority revision/removal | exact source span/version | fail-closed legal sync | read-only agent lookup surface | LLM replacing source retrieval |
| `cyber-prep-coach` | trusted 880-question corpus | mastery/adaptive Today Task | calibrated explanation provenance | external assistant may prepare candidate study material later | new AI quiz generator before #6 calibration |
| `cf-ai-router` | exact provider/model/cost truth | cache/cost/failover receipts | fail-closed routing | host capability quote before paid action | hidden reroute that changes semantics |
| `avatar-vfo` | structured persona state | continuity regression | bounded role-state evolution | external assistant candidate scene/action | unlimited memory/authority inheritance |
| `project-doctor-web` | reproducible diagnostics | exact finding→candidate remediation | reviewable remediation receipt | WebMCP diagnostics tool is a future fit | one-click destructive “fix all” |
| `minideck` | editable artifact | version/diff/rollback | compact structured deck | assistant candidate content → canonical deck | rasterized AI slides |
| `chatgpt-dual-pipeline` | explicit handoff identity | no duplicated truth | stage receipts | structured browser/tool handoff | hidden model substitution |
| `taichung-police-intel` | official-first evidence | freshness/conflict/priority | read-only public-sector brief | read-only agent query/export | autonomous external mutation |
| `soundbox-offline` | robust offline playback/library | full offline data plane | local library truth | local command tools if browser/runtime supports safely | cloud dependency for basic playback |
| `skill-foundry` | candidate/eval/promotion | runtime compatibility + security | demonstrated workflow→certified Skill | structured host-tool capabilities as Skill targets | recording→auto-trusted execution |
| `video-timeline-pipeline` | exact time/source provenance | CutSpec + NLE import/read-back | evidence→professional-editor handoff | **MediaGapIntent → NLE-native generation** | building a full generative-video/NLE platform |
| `ai-novel-workstation` | canonical story truth | Context Manifest + cost envelope | long-form reproducible production | external assistant candidate edits via #6 | generic chat UI / raw FS write |
| `clinical-scribe-worker` | section/revision truth | regenerate-without-overwrite | clinical candidate/undo lineage | external assistant prepares candidate only | autonomous chart mutation |
| `MaterialYouNewTab` | local-first privacy/backup | browser-version compatibility | TW-first workspace/focus dashboard | **WebMCP read-only/low-risk command spike** | broad task/note exposure to arbitrary agents |
| `cf-mcp-server` | tool contract/diff | runtime read-back + effect receipts | explicit authority classes | WebMCP/MCP semantic convergence research | server identity = tool authority |
| `tick-stock-panel` | point-in-time market data | deterministic strategy specs | explainable analysis without trade leap | assistant can propose StrategyDef | live trading merely because competitors can |
| `herdr-skills` | correction evidence | scoped/versioned promotion | candidate skill/policy improvement | structured UI/tool targets | one correction→global permanent policy |
| `ninax-line-hermes` | ordered delivery/revision | stale-answer invalidation | LINE-native reliable gateway | canonical product actions surfaced as narrow tools | agent authority inferred from chat access |
| `ai-flight-radar` | source/freshness truth | reviewed WatchSpec + alert receipt | durable intent tracking | browser/assistant entry to WatchSpec candidate | silent scheduled tracking from parsed text |
| `academic-mcp` | source/provider identity | progressive tool exposure | research ledger + source semantics | external client as distribution surface | semantic tool match overriding requested provider |

---

# Top 10 Cross-Portfolio Ideas

1. **Intent Handoff Object** — preserve a user/agent intent as a typed, versioned object before any external capability executes it.
2. **Host-owned Execution** — when the destination app already owns timeline/project/account context, delegate the effect there instead of cloning its runtime.
3. **Read-back Receipt** — import/generation/save success is not enough; verify the destination’s actual state after the action.
4. **Paid Effect Preflight** — show `MEASURED / ESTIMATED / UNKNOWN` cost/budget status before a paid external action.
5. **Distribution Surface ≠ Canonical Product** — ChatGPT/Claude/browser agent can be the interaction surface while domain truth remains in the product.
6. **Candidate-first External AI** — external assistants propose structured candidates; product-specific validators/promotion remain authoritative.
7. **Structured Browser Tools** — investigate WebMCP for low-risk browser-native actions where it reduces DOM/pixel fragility.
8. **Untrusted Output Annotation** — browser/MCP outputs sourced from users/web content should carry explicit untrusted provenance into agents.
9. **Capability Versioning** — NLE/browser/tool support must be tied to exact runtime/version evidence, not only documentation.
10. **Delete Duplicate Execution Engines** — do not add an internal editor/model marketplace/quiz generator merely because an integration can call one; keep the narrow product moat.

---

# Ideas Rejected / Deferred

## Reject now — build an Adobe-like model marketplace in `video-timeline-pipeline`
Adobe already owns editor context, model agreements, credits, generation history and UI. Duplicating this adds provider/billing/privacy/safety complexity while weakening the project’s evidence→handoff differentiation.

## Reject now — automatic generative fill from an AI-selected gap
A model suggesting “insert B-roll here” does not authorize paid generation or timeline mutation. The appropriate first artifact is `MediaGapIntent`, not a provider call.

## Defer — WebMCP write tools for `MaterialYouNewTab`
The API is experimental; extension-page applicability needs a real compatibility spike, and local tasks/notes are sensitive. Start with no Issue and no broad write surface.

## Reject now — another quiz-generation feature in `cyber-prep-coach`
Kahoot proves distribution demand, not correctness. `cyber-prep-coach #6` independent explanation calibration and #4 mastery/next-action are stronger product priorities.

## Reject — new content-credential Issue for `flux-image-gen`
Already owned by existing provenance/content-credentials work. Duplicate avoided.

## Reject — new external-story-agent Issue for `ai-novel-workstation`
Already owned by #6 Agent-facing Story Workspace Contract. Duplicate avoided.

## Defer — score new empty `spotify-playlist-organizer-mcp`
No product implementation/README/workflow exists yet. Market fit and competitive gap are UNKNOWN.

---

# Issue / PR Mapping

| Product | Existing item | This round |
|---|---|---|
| `video-timeline-pipeline` | Issue #11 Paper Cut / NLE Handoff; open PR #15 `devin/issue-11-research` | **No comment/update due active work.** New Adobe Generative Media evidence recorded only in central radar. |
| `flux-image-gen` | existing provenance/content-credentials Issue + creative-edit/reference Issue | No duplicate Issue. |
| `92-duty-scheduler` | #20 PolicySpec/Rule Studio already includes XShift signal; new CI finding exists | No duplicate feature work. |
| `cyber-prep-coach` | #4 mastery/adaptive Today Task; #6 independent explanation calibration | Kahoot/AI-learning signals stay research/validation input only. |
| `ai-novel-workstation` | #2 Context Manifest; #4 Cost Envelope; #6 external Story Workspace; #5 CI gate | No new Issue. |
| `MaterialYouNewTab` | no current Issue | WebMCP stays research list until extension-page/runtime/security compatibility is proven. |
| `cf-mcp-server` | #15 tool-contract drift | WebMCP is adjacent protocol research only; no overlap-expanded Issue. |

No repository source code, implementation branch, PR, deployment, permission, secret or setting was modified.

---

# Sources

## CONFIRMED — first-party
- Adobe Premiere What’s New, updated 2026-09-09: https://helpx.adobe.com/premiere/desktop/whats-new/whats-new.html
- Adobe Generative Media Tool overview, updated 2026-09-09: https://helpx.adobe.com/premiere/desktop/edit-projects/edit-with-generative-ai/generative-media-tool-overview.html
- Adobe Generate media workflow, updated 2026-09-09: https://helpx.adobe.com/premiere/desktop/edit-projects/edit-with-generative-ai/generate-media-with-generative-media-tool.html
- Adobe Generative Media FAQ / model-credit-access semantics, current 2026-09: https://helpx.adobe.com/premiere/desktop/edit-projects/edit-with-generative-ai/generative-media-tool-faq.html
- Kahoot ChatGPT creator help, updated 2026-09-11: https://support.kahoot.com/hc/en-us/articles/36769571498397-How-to-create-kahoots-with-ChatGPT
- Kahoot MCP assistant integration, updated 2026-09-10: https://support.kahoot.com/hc/en-us/articles/36770398743581-How-to-connect-ChatGPT-Claude-and-other-AI-Assistants-to-Kahoot-using-the-MCP-Server
- Chrome WebMCP overview: https://developer.chrome.com/docs/ai/webmcp
- Chrome WebMCP Imperative API, updated 2026-09-11: https://developer.chrome.com/docs/ai/webmcp/imperative-api
- Chrome WebMCP tool security, updated 2026-09-01: https://developer.chrome.com/docs/ai/webmcp/secure-tools
- Chrome WebMCP eval guidance: https://developer.chrome.com/docs/ai/webmcp/evals
- Descript AI Video / generative B-roll, checked 2026-09-14: https://www.descript.com/ai-video and https://www.descript.com/tools/generative-video-b-roll

## COMMUNITY_SIGNAL
- Premiere 26.5 MXF/ProRes rollback report, 2026-09-12: https://www.reddit.com/r/premiere/comments/1we01yq/frame_substitution_recursion_attempt_in_premiere/

No community anecdote is treated as prevalence, reliability or performance statistics.

---

# What Changed Since Last Radar (r3 → r4)

1. **New strongest market signal:** Adobe Premiere 26.5’s Generative Media Tool turns the professional NLE into both the transcript-edit and generative-fill execution host. This substantially strengthens the “handoff, don’t clone the editor” product strategy for `video-timeline-pipeline`.
2. **No new Issue by design:** the exact video-handoff fingerprint is already #11 and open PR #15 is actively working it. Cross-schedule rule therefore forces central-report-only treatment.
3. **New transferable adjacent signal:** Kahoot demonstrates AI assistant/MCP distribution with canonical save/host still owned by the domain product.
4. **New emerging-tech watch:** WebMCP’s Imperative API docs were updated 2026-09-11; structured browser-agent tools are maturing but remain experimental and high-sensitivity for local user data.
5. **Portfolio count changed:** 38 owned+unarchived repos are visible because `spotify-playlist-organizer-mcp` now exists, but it is empty and not yet counted as product-like; scored product count remains 35.
6. **Reliability priority remains:** recent GitHub work includes persona/CI audit findings and multiple open implementation PRs. External trend pressure should not override runtime/CI correctness gates.

---

## Portfolio Principle Added This Round

**`Intent belongs upstream; execution belongs to the capability owner; truth belongs to the canonical product; completion belongs to a verified receipt.`**

For creative workflows specifically:

**`Generation Intent ≠ Model Selection ≠ Paid Generation Authority ≠ Generated Media ≠ Approved Timeline Revision`.**
