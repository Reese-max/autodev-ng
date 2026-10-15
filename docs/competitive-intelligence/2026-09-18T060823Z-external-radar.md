# External Competitive Radar — 2026-09-18T06:08:23Z

Status: **COMPLETE**

## Scope / Direction Check

- Rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected inventory: **41 Reese-max-owned repositories / 40 unarchived**. `obsidian-vault` is archived and excluded. This run did not infer existence/non-existence from older inventories.
- Fair-rotation primary repo: `Reese-max/video-timeline-pipeline`
- Current default-branch HEAD rechecked before write: `048794bd62fbc1a956b60fa48ffc4a603c886125` (`main`). The latest HEAD changes are audit/docs; product-board audit identifies product baseline `dc421fef263ccc5b7321910304a9fa910c1a5c5d`.
- Owner-approved posture from the current product-board audit: **INVEST / SIMPLIFY — NOT CLEAN**. Immediate product priorities remain #4 cost-guard transport wiring, #18 accounting-boundary correctness, and #8 safe legacy Instagram budget migration. Full NLE, generative-media suite, hosted asset platform, marketplace, social publishing and unlimited-agent expansion remain out of scope.
- Existing competitive/research work checked before filing: #10 agentic visual evidence escalation, #11 Evidence→NLE handoff, #20 C2PA provenance, plus #4/#5/#6/#7/#8/#18. All-state PR search shows active work including #15, #16, #19, #21 and related bounded fixes; this radar did not alter their scope.

## External Signals

### 1. CONFIRMED — MiniMax exposes completion state that the current adapter discards

Checked 2026-09-18. MiniMax's current OpenAI-compatible Chat Completions documentation shows `choices[].finish_reason` in the response and explicitly states that if generation stops due to `length`, clients should adjust `max_completion_tokens`.

Source: https://platform.minimax.io/docs/api-reference/text-chat-openai

User job affected: convert cloud visual analysis into reusable evidence without silently treating an incomplete provider generation as complete.

Current repo evidence at `048794bd...`:

- `minimax_chat()` reads `choices[0].message.content`, usage and elapsed time, but does not inspect or preserve `finish_reason`.
- `parse_json_object()` falls back to `{ "raw": text }` when JSON cannot be parsed.
- The visual-analysis path adds `timestamp` / `source_image` to that result and writes it to the reusable vision cache without requiring the expected visual schema.
- Cache reuse only asks for `source_image` on this path.
- `knowledge.md` can report visual analysis as executed when an observation exists and its `visual_summary` is not the literal local-only sentinel; a malformed/raw observation with no `visual_summary` satisfies that test.

This is not a claim that a live MiniMax request actually returned `finish_reason=length` in this run. No provider call was made.

### 2. CONFIRMED — TwelveLabs changed truncated segmentation from “ready + partial/empty” to failure

On **2026-09-10**, TwelveLabs changed video segmentation so that hitting max response length or the context window fails the task and returns no result. Previously the task could be `ready` with `finish_reason=length` and an empty or partial segment list. General analysis still returns partial output, but surfaces the truncation warning explicitly.

Source: https://docs.twelvelabs.io/docs/get-started/release-notes

Transferable workflow principle: provider completion state and result payload are separate facts. A partial payload may be useful, but it cannot silently inherit “complete” semantics.

This is adjacent evidence, not proof of MiniMax behavior beyond MiniMax's own contract.

### 3. CONFIRMED — Adobe Premiere 26.5.1 increased generation/credit transparency

Adobe Premiere **26.5.1**, released in September 2026 and documented on **2026-09-16**, lists increased transparency for generation and credit usage associated with the Generative Media Tool. Adobe's Generative Media documentation also shows model-specific credit usage before generation.

Sources:
- https://helpx.adobe.com/premiere/desktop/whats-new/release-notes.html
- https://helpx.adobe.com/premiere/desktop/edit-projects/edit-with-generative-ai/generative-media-tool-faq.html

This reinforces the already-established #4 direction: paid/provider work should expose an honest cost/completion boundary. It does **not** establish a new root cause, so no duplicate cost Issue was created.

### 4. CONFIRMED but deduplicated — Gemini agentic video understanding

Google's **2026-09-01** Agentic Video feature dynamically scans/zooms video segments instead of relying only on fixed-FPS ingestion. Vendor benchmark claims are not treated as product evidence.

Source: https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-agentic-video-in-gemini/

This remains covered by #10 / PR #16. No second “agentic video” Issue was opened.

## New Releases

- **TwelveLabs, 2026-09-10:** explicit truncated-segmentation failure semantics and bounded analysis windows.
- **Adobe Premiere 26.5.1, documented 2026-09-16:** improved generation/credit transparency.
- **Google Gemini Agentic Video, 2026-09-01:** dynamic long-video observation; already mapped to #10.

## Community Pain

No new community report was retained as a decision-grade signal this round. Searches did not yield a recent, well-scoped user report that added a new root cause beyond the first-party provider/product evidence above. No anecdote was promoted into severity or demand estimates.

## Adjacent Ideas

1. **Completion receipt before cache admission** — smallest transferable idea. Treat provider completion status as part of the cache admission contract; do not build a general provider framework first.
2. **Partial can remain useful if explicit** — TwelveLabs shows a useful distinction between a complete segmentation result, a partial general-analysis result, and failure. If the product later deliberately supports partial MiniMax output, it should be a visible `PARTIAL/INCOMPLETE` state, not a silent success path.
3. **Show cost at the decision point** — Adobe's model/credit surface supports #4's existing direction, but does not justify adding a new dashboard before the transport guard itself is wired.

## Opportunity Map — video-timeline-pipeline

| Bucket | Decision | Evidence / Reason |
|---|---|---|
| MUST MATCH | Provider completion state must gate reusable evidence/cache admission | MiniMax returns `finish_reason`; current adapter drops it; downstream visual cache/status can promote malformed fallback data. New #22. |
| SHOULD BE BETTER | Keep cost/completion/error semantics visible without replacing local-first pipeline | #4 already owns cost attempt semantics; Adobe 26.5.1 is reinforcing external evidence only. |
| DIFFERENTIATOR | Stable baseline evidence + bounded local escalation + deterministic NLE handoff | Already #10/#11 with active PRs; no scope grab. |
| ADJACENT IDEA | Explicit `PARTIAL` output as a first-class state where partial payloads have real value | Needs task-specific evidence before any broad state-machine work. |
| DO NOT COPY | Full generative video editor, provider-specific all-video agentic replacement, hosted asset suite | Conflicts with owner-approved simplify/local-first scope and adds maintenance/cost without a validated user gap. |

## Four-Gate Decision

### Filed: `video-timeline-pipeline#22`

Fingerprint:

`video-timeline-pipeline + MiniMax HTTP 200 with finish_reason=length/incomplete completion + minimax_chat drops finish status + visual parser fallback is cached using source_image as the only reuse key + downstream processing can label visual analysis as executed`

Classification:

- `kind=BUG`
- `severity=P2`
- `decision_priority=HIGH`
- `triage=NEEDS_REVIEW`
- `auto_implementation=false`
- `runtime=NEEDS_RUNTIME_VERIFICATION`

Why P2 rather than P0/P1: the causal code path and first-party response contract are current and deterministic, and the failure can persist into reusable evidence state. However, this run did not produce a real MiniMax `finish_reason=length` response or observe a user incident/error rate. The single-frame visual prompt is also normally small. Therefore this is not promoted to P1 on speculation.

Minimum solution: preserve/inspect completion metadata in the existing MiniMax adapter, reject or explicitly classify truncated/incomplete completion before cache admission, and validate required visual fields before a cached observation can count as completed. Use fake 200 responses first. Do **not** build a provider registry, new database, new scheduler, or model-routing framework.

Why smaller alternatives fail: documentation/log warnings do not prevent the current malformed/raw cache entry from being reused and reported as analyzed.

Issue: https://github.com/Reese-max/video-timeline-pipeline/issues/22

## Issue Mapping / Dedupe

- **#22 created** — distinct completion-state/cache-admission root cause; no matching `finish_reason` Issue/PR/branch found immediately before write.
- #4 — cost/attempt guard. New external Adobe evidence reinforces, but no new root cause; unchanged.
- #5 / PR #21 — retrieval/grounded citations; active scope, unchanged.
- #10 / PR #16 — agentic/local bounded visual escalation; Gemini signal deduped here.
- #11 / PR #15 — NLE handoff; active scope, unchanged.
- #20 — C2PA source provenance research; unrelated fingerprint, unchanged.
- #8 / PR #14 and #18 / PR #19 — current owner-priority fixes; untouched.

No Issue was closed, reprioritized through synthetic scoring, or treated as implementation authorization.

## Rejected Ideas

- **Replace MiniMax with TwelveLabs/Gemini** — rejected; external provider behavior is evidence for a completion contract, not a migration decision.
- **Create a universal ProviderResult state machine** — rejected as premature. A local adapter/cache fix is smaller and sufficient for the current root cause.
- **Copy Premiere Generative Media / multi-model generation into this repo** — rejected by owner scope and product positioning.
- **Make agentic video the default ingest** — rejected; #10 explicitly keeps stable baseline ingest and requires bounded runtime evaluation before any provider option.
- **Treat `finish_reason=stop` as factual correctness** — rejected; completion state only answers whether generation completed, not whether content is true or well-grounded.

## Cross-portfolio Ideas

One reusable design principle is retained without opening cross-repo Issues: **transport success, generation completion, schema validity and factual/evidence validity are separate states**. Reuse only where another repo has a concrete provider-output path and repo evidence; do not create a central framework from this single case.

## What Changed

1. Fresh external provider documentation exposed a current, repo-specific completion-state mismatch not represented by existing Issues.
2. Created and read back `video-timeline-pipeline#22`; it is open and contains the source/date, repo SHA, classification, minimum fix, non-goals, acceptance checks and runtime boundary.
3. Existing competitive ideas (Gemini agentic video, Paper Edit/NLE handoff, C2PA, cost transparency) were deduplicated rather than expanded.
4. No product source, CI/config, secrets, settings, branch, deployment, worker, GOAL or paid provider call was modified/started.

## Sources

- MiniMax Chat Completions API — checked 2026-09-18: https://platform.minimax.io/docs/api-reference/text-chat-openai
- TwelveLabs release notes — event 2026-09-10, checked 2026-09-18: https://docs.twelvelabs.io/docs/get-started/release-notes
- Adobe Premiere release notes — last updated 2026-09-16: https://helpx.adobe.com/premiere/desktop/whats-new/release-notes.html
- Adobe Generative Media FAQ — checked 2026-09-18: https://helpx.adobe.com/premiere/desktop/edit-projects/edit-with-generative-ai/generative-media-tool-faq.html
- Google Agentic Video — 2026-09-01: https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-agentic-video-in-gemini/
- Repo source at current HEAD: https://github.com/Reese-max/video-timeline-pipeline/blob/048794bd62fbc1a956b60fa48ffc4a603c886125/pipeline.py
- Product-board audit at `c84ccdcf3ea4956ac0b05e22ac27da8040965be5` in `docs/audits/`.

## Completion / Gaps / Cursor

- Radar status: **COMPLETE** for the selected repo and this rotation step.
- Runtime gap: no real MiniMax truncation canary; #22 remains `NEEDS_RUNTIME_VERIFICATION`. Fake-response verification is sufficient for the first implementation step; a paid/live canary needs separate authorization.
- No portfolio CLEAN claim was made.
- Next fair-rotation cursor: `Reese-max/ai-novel-workstation`.
