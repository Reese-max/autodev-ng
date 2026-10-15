# External Competitive / Product Radar — 2026-09-17T13:57:31Z

## Status

- Focus cursor: `Reese-max/prompt-autoresearch`
- Next fair cursor: `Reese-max/lobsterpulse`
- Issue Quality v2 blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Focal default branch / HEAD checked: `master@7677bf5aeef443df0cf3edcf96dfa30d82fc1127`
- Fresh accessible inventory: **40 Reese-max-owned repositories; 39 unarchived**. Page 2 returned empty, so this connector-side enumeration was fully paged for this run. Prior 39/38 observations are treated as connection/access inventory drift, not evidence that a repository was deleted or created.
- Write scope this round: this report only. **No product source/CI/config/settings/secrets changes, no implementation branch, no merge/deploy, no worker/GOAL start.**

## Direction / Product Scope

The current product-board direction is **INVEST / SIMPLIFY**: keep Prompt AutoResearch a trustworthy, local-first prompt research and promotion harness for Taiwanese civil-service essay prompts. The moat is the vertical question/rubric corpus, hard risk gates, prompt lineage, and evidence-first promotion workflow. Do not turn it into a hosted multi-tenant eval SaaS, generic agent-observability platform, another general optimizer framework, or mobile app.

Current repository architecture confirms a local-first loop over fixed questions/rubrics: generate prompt candidates, evaluate them, compare evidence, and only then write accepted results into `prompts/current.md`.

## Product → Market Category

| Product | Market category | Direct alternatives / references | Adjacent workflow | This product should not copy |
|---|---|---|---|---|
| Prompt AutoResearch | local-first vertical prompt optimization / evaluation / promotion harness for Taiwan civil-service essay prompts | LangSmith Evaluation, PromptLayer, DSPy, vendor-native prompt/eval tooling | trace/failure → dataset/evaluator → regression loop; human calibration of LLM judges; provider lifecycle hygiene | hosted generic observability, broad multi-tenant RBAC/billing, model-marketplace churn, managed generic agent platform |

## External Signals

### A. CONFIRMED — Anthropic retired the exact Claude model still selectable on default branch

**Provider event:** announced 2025-08-13; retired 2025-10-28.  
**Checked:** 2026-09-17.  
**First-party source:** https://platform.claude.com/docs/en/about-claude/model-deprecations

Anthropic's current deprecation table explicitly lists `claude-3-5-sonnet-20241022` as retired on **2025-10-28**, with `claude-sonnet-4-6` as the recommended replacement. Anthropic also states requests to retired models fail.

Repository evidence on `master@7677bf5...`:

- `app.js` still exposes `claude-3-5-sonnet-20241022` in `ProviderModels.anthropic`.
- `callAnthropicAPI(key, model, ...)` passes the selected `model` directly in the payload to `https://api.anthropic.com/v1/messages`.

**User job affected:** run a prompt experiment/evaluation with the supported Anthropic selector.  
**Observable break:** choosing the only Anthropic option routes a retired model ID into the Messages API.  
**Current workaround:** choose another provider; that does not make the advertised Anthropic path functional.  
**Consequence if untouched:** the Anthropic provider path is a deterministic dead end for any user who selects it, subject to provider account/API availability.

Provisional quality classification if/when the existing provider-lifecycle tracker is safely updated:

```yaml
kind: BUG
severity: P2
evidence: SOURCE_CONFIRMED
decision_priority: HIGH
triage: NEEDS_REVIEW
auto_implementation: false
runtime: NEEDS_RUNTIME_VERIFICATION
```

P2 is based on deterministic completion failure of a selectable provider path, not on assumed usage volume or a claimed production incident. No owner API key was used and no live Anthropic call was made.

### A2. CONFIRMED — the existing Gemini fix is actively owned and still unsettled

Issue #7 already tracks the same underlying component/root pattern: a static provider selector advertises retired/unsupported model IDs and then sends those IDs directly to the provider.

Active ownership exists in both `fix/issue-7-retired-gemini-ids` / PR #8 and `devin/issue-7` / PR #11.

Latest review evidence shows both replacement attempts still have concrete problems:

- PR #8 review: `gemini-3.8-flash` is not a supported Gemini API model ID; a provider-preview state mutation can also pair a newly previewed model with the previously saved provider.
- PR #11 review: `gemini-3.5-flash` / `gemini-3.5-flash-lite` are not exposed Gemini API IDs; persisted retired 1.5 selections can remain in saved state until manually changed.

Therefore this run does **not** edit #7 or either PR. Status: `NEW_EXTERNAL_EVIDENCE + DEDUPE + SKIPPED_LOCKED_ACTIVE_PR#8/#11`.

The Anthropic evidence should be incorporated into the same provider-model-lifecycle root only after active ownership is released and the current branch state is re-read. Renaming the architecture or opening an "Anthropic model registry" issue would not create a new root cause.

### B. CONFIRMED — LangSmith is pushing evaluation toward managed, versioned evaluator lifecycle + human correction

**Recent signal:** 2026-09-07 overview; 2026-08-18 Tuned Evaluators.  
Sources:
- https://www.langchain.com/resources/what-is-langsmith
- https://www.langchain.com/blog/introducing-langsmith-tuned-evaluators-starting-with-perceived-error
- https://www.langchain.com/langsmith/evaluation

LangSmith's current workflow joins offline pre-release evals, production traces, human/expert feedback, and regression improvement. Tuned Evaluators add managed versioning/model maintenance for specific evaluator objectives, while the broader evaluation product explicitly supports routing samples to domain experts and calibrating LLM-as-judge against human corrections.

**Transferable principle:** evaluator identity/version and disagreement evidence matter; repeated failures should become targeted regression examples rather than automatically growing the prompt.

**Do not copy:** hosted trace ingestion, managed evaluator infrastructure, generic multi-team annotation queues, or a production-observability platform. For this repo, existing #6 (blind legal-anchor / judge-validity audit) and #5 (compaction/failure-pattern diagnosis) already cover the relevant decisions.

### C. CONFIRMED — PromptLayer treats prompt versions like deployable artifacts with eval/cost/latency evidence

**Checked:** 2026-09-17.  
Source: https://www.promptlayer.com/

PromptLayer currently supports scheduled / CI regression evaluation, historical backtests, exact prompt versioning, and grouping token/cost/latency by prompt/model/provider/workflow.

This reinforces existing #5's complexity/cost receipt and #4's evidence-contract direction. It does **not** establish a new need for a hosted control plane.

### C2. CONFIRMED — DSPy continues to move toward program-level optimization, not just prompt text

**Checked:** 2026-09-17.  
Source: https://dspy.ai/

DSPy currently advertises 3.4.0b1 with faster GEPA and MCP v2 compatibility and continues to frame optimization as structured LM programs rather than manual prompt text.

This is a market-direction signal only. The Product Board explicitly rejects turning Prompt AutoResearch into another generic optimizer framework, so there is no issue from this signal.

## New Releases / Model-Lifecycle Checks

- **Anthropic:** exact current selector `claude-3-5-sonnet-20241022` is retired — actionable compatibility evidence, but deduped into active #7 root.
- **OpenAI:** current OpenAI catalog still lists GPT-4o / GPT-4o mini families; newer GPT-5.6 exists, but "newer" alone is not evidence that the currently selectable OpenAI path is broken or should be migrated. **NO ISSUE.**
- **MiniMax:** MiniMax M3 is newer (released 2026-06-01), while MiniMax's current site still lists M2.7 among supported model families. The repo's M2.7 selection is therefore not treated as broken merely because M3 exists. **NO ISSUE.**

## Community Pain

No community-only claim met the issue gate this round. The actionable compatibility finding is supported directly by provider documentation and repository source, so Reddit/HN anecdotes are unnecessary for establishing it.

## Adjacent Ideas

1. **Failure → regression fixture, not automatic prompt clause.** LangSmith's improvement loop and PromptLayer's backtesting reinforce the existing #5 direction: cluster recurring failures, turn validated patterns into fixtures/evaluator checks, and only then decide `ADD / REWRITE / DELETE / MERGE / NO_CHANGE`.
2. **Evaluator lifecycle receipts.** For #6, record evaluator/model/rubric/dataset identity and human/deterministic anchor disagreement. Do not build a judge registry until the narrow blind-anchor experiment proves it is needed.
3. **Provider model support should be verified at change time.** The current Gemini PR reviews demonstrate that a hard-coded allowlist copied from an assumption can reproduce the same defect. The smallest safe fix is verified supported IDs + stale persisted-selection normalization + bounded provider smoke when explicitly authorized, not an auto-updating model registry.

## Opportunity Map — `prompt-autoresearch`

### MUST MATCH
- Selectable provider model IDs must exist and remain usable at the provider endpoint they are sent to.
- Removing a retired ID must also account for persisted stale selections; hidden saved state cannot keep calling a removed model.
- Evidence/promotion gates must remain fail-closed (#4) and provider replacement must not weaken them.

### SHOULD BE BETTER
- Provider compatibility changes should cite a first-party lifecycle source and include a minimal regression that does not merely repeat an invented hard-coded model list.
- A bounded live smoke, when explicitly authorized, should verify the replacement endpoint; unit/UI tests alone do not prove provider runtime.

### DIFFERENTIATOR
- Taiwan civil-service legal essay corpus.
- Local-first evidence lineage and hard legal/risk gates.
- Explicit champion promotion / rollback rather than opaque managed optimization.

### ADJACENT IDEA
- Turn repeated failure evidence into regression fixtures/evaluator candidates before mutating prompt text.
- Human / deterministic legal anchor calibration for judge validity (#6).

### DO NOT COPY
- Hosted generic observability / trace warehouse.
- Broad provider marketplace or auto-migration framework.
- Automatic migration to every newest model because it is newer.
- Managed generic evaluator service, multi-tenant annotation SaaS, mobile app.

## Four-Gate Decision Review

### Candidate: retired Anthropic selector

1. **Problem/value:** source-confirmed reachable path; target user explicitly selects Anthropic and cannot complete an experiment because the only advertised model is retired. Existing alternatives exist (other providers), but they do not satisfy the selected-provider workflow.
2. **Priority:** BUG / P2 provisional; no usage frequency or production incident is claimed. Runtime is not executed.
3. **Minimum solution:** after active #7 work is released, re-read HEAD and unify the provider-selector fix around only first-party-confirmed supported IDs + stale saved-selection normalization. Do not create a registry/service.
4. **Research/implementation separation:** no new research architecture is needed to establish retirement, but this radar does not authorize implementation. Existing #7 ownership is active, so the only write is this central evidence report.

## Issue / PR Mapping

| Item | Mapping | Action this run |
|---|---|---|
| Anthropic `claude-3-5-sonnet-20241022` retired | Same actual root as #7: static selectable provider model lifecycle drift → direct provider request failure | **DEDUPE / SKIPPED_LOCKED_ACTIVE_PR#8/#11**; central report only |
| #7 Gemini lifecycle bug | PR #8 + PR #11 active; reviews still contain P1/P2 findings | No comment/scope rewrite/lock theft |
| #4 evidence contract | PR #9 + PR #10 active | No interference |
| #5 complexity/compaction | External signals reinforce existing scope | No new issue/update |
| #6 judge validity | LangSmith human-calibration signal reinforces existing scope | No new issue/update |

## Rejected Ideas

- **"Upgrade OpenAI to GPT-5.6 now" — REJECT as issue.** Newer models exist, but current OpenAI selector was not shown to be retired/broken. A product migration needs measured domain quality/cost/compatibility evidence.
- **"Upgrade MiniMax M2.7 to M3 now" — REJECT as issue.** M3 is newer, but MiniMax still lists M2.7 as supported. Newness is not a defect.
- **"Build a provider model registry / auto-updater" — REJECT for now.** Two stale selectors show a lifecycle-maintenance problem, but a static verified replacement + persisted-state normalization is much smaller. A registry/service would add maintenance and provider coupling without evidence it is required.
- **"Copy LangSmith Tuned Evaluators" — REJECT.** Managed evaluator infrastructure conflicts with the approved local-first vertical scope; reuse only the lifecycle/human-calibration principle in #6.
- **"Create another Anthropic-specific issue while #7 is active" — REJECT.** Same component/trigger/symptom/root pattern, and active branches/PRs exist. Keep new evidence in this report until ownership is released.

## Sources

### First-party / authoritative
- Anthropic model deprecations, current page; Claude 3.5 Sonnet 20241022 retired 2025-10-28: https://platform.claude.com/docs/en/about-claude/model-deprecations
- LangSmith overview, published 2026-09-07: https://www.langchain.com/resources/what-is-langsmith
- LangSmith Tuned Evaluators, published 2026-08-18: https://www.langchain.com/blog/introducing-langsmith-tuned-evaluators-starting-with-perceived-error
- LangSmith Evaluation product: https://www.langchain.com/langsmith/evaluation
- PromptLayer current product: https://www.promptlayer.com/
- DSPy current product/docs: https://dspy.ai/
- OpenAI current model catalog: https://platform.openai.com/docs/models
- MiniMax M3 release, 2026-06-01: https://www.minimax.io/blog/minimax-m3
- MiniMax current product/model site: https://www.minimax.io/

### Repository evidence
- `prompt-autoresearch` Product Board: `.github/quality-audits/2026-09-12-0410-product-board-audit.md`
- Architecture: `docs/architecture-overview.md`
- Current provider selector/request path: `app.js`
- Existing provider-lifecycle tracking: Issue #7
- Active Gemini fix attempts: PR #8 and PR #11
- Required evidence repair: Issue #4 / PR #9 / PR #10

## What Changed

1. Fresh full connector inventory now returns **40 owned / 39 unarchived**, versus a recent 39/38 observation; recorded as access/inventory drift only.
2. Fair cursor reached `prompt-autoresearch`; default product HEAD remains `7677bf5...` while several corrective PRs are active.
3. New first-party evidence broadens the provider-lifecycle defect beyond Gemini: the current default Anthropic option is also retired and is sent verbatim to Anthropic Messages API.
4. Existing #7 has two active implementation attempts and both currently have review findings, so this run intentionally avoided issue/PR modification and did not compete for ownership.
5. Recent market direction from LangSmith continues to emphasize evaluator versioning, human correction, and failure-to-regression loops. This reinforces #5/#6 rather than creating a new architecture issue.
6. No portfolio CLEAN claim is made. No live provider call was executed; Anthropic runtime remains `NEEDS_RUNTIME_VERIFICATION` even though lifecycle incompatibility is source-confirmed.

## Completion / Gaps / Cursor

- External web exploration: complete for this focal product pass (direct competitor + adjacent workflow + provider lifecycle).
- Issue gate result: **0 new Issues; 0 Issue updates; 0 PR comments.**
- High-value retained signal: **1 source-confirmed provider compatibility expansion (Anthropic) deduped into active #7 root.**
- Runtime gap: no paid/provider calls, no production/deployment evidence.
- Next fair cursor: `lobsterpulse`.
