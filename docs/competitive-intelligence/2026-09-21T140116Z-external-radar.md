# External Competitive / New-Product / Workflow Radar — 2026-09-21T14:01:16Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY / 0_NEW_ISSUES**.
- Owner scope: `Reese-max` only. No third-party repository was modified.
- Issue-quality rules re-read from `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected-owner enumeration returned **42 Reese-max-owned repositories / 41 unarchived**; page 2 returned empty. `obsidian-vault` is archived and excluded from the active set. Older inventories were not used as the denominator.
- Fair cursor entering this round: `Reese-max/video-timeline-pipeline`, carried from `2026-09-21T120120Z-external-radar.md`.
- Focal default branch rechecked immediately before write: `main@c8690059cc8c981d8646d55df8dcc303ca8df6f1`.
- Current owner direction remains **INVEST / SIMPLIFY / evidence truth first**: local-first evidence pipeline, fail-closed groundedness, stable occurrence/citation identity and bounded external effects; do not turn the repo into a hosted asset platform, full NLE, collaboration suite or generic provider framework.
- Current active scopes rechecked before deciding: #23 ChatGPT file handoff (default branch has same-day owner changes), #22/PR #24 MiniMax completion/cache admission, #5/PR #21 grounded retrieval/citations, #10/PR #16 bounded visual escalation, #11/PR #15 NLE handoff, #20 provenance, plus #4/#8/#18 safety/accounting work. No active scope was taken over.
- No provider call, paid request, browser/ChatGPT/Drive runtime, NLE import, production-data test, branch, merge, deployment, worker/GOAL, product source/config/CI/secrets/settings change was performed.

## Executive decision

This round found **no new opportunity that passes the Issue gate**. The strongest fresh calibration is about media handoff/lifecycle rather than another model or provider:

> OpenAI's current plugin contract treats ChatGPT file helpers as optional capabilities that must be feature-detected, while the open MCP Apps bridge is the portable UI base. The current `video-timeline-pipeline` implementation is directionally correct to keep a model-visible/server-side fallback instead of assuming every host exposes `window.openai.uploadFile`.

A secondary recovery hypothesis was retained but **not filed**: the new Google Drive handoff caches `drive_ready` based only on local segment identity plus stored Drive IDs/URLs. If the remote Drive item is later trashed/deleted or otherwise unavailable, the same local job can return a stale cached handoff without revalidating remote existence. Google Drive explicitly supports trash/delete, so the state transition is real; however this run did not execute that scenario, #23 is active owner scope, and current code also has a server-side analysis fallback. This remains a bounded `VALIDATION_GAP / NEEDS_EVIDENCE`, not a P1/P2 incident claim.

No provider migration, retention daemon, Drive registry, hosted asset database or new video platform is justified.

---

# Product → market category

| Product | Market / substitutes | Current differentiated job |
|---|---|---|
| `video-timeline-pipeline` | ChatGPT/MCP file handoff, VideoDB/Wowza managed video intelligence, Gemini/TwelveLabs video understanding, Descript/Premiere editing, FFmpeg + local scripts | Public/authorized media → resumable local evidence → transcript/visual timeline → search/Ask → reviewable handoff, with explicit source and cloud boundaries |

# External Signals

## A. Direct host/workflow signal — ChatGPT file APIs are optional extensions, not a universal host contract

**CONFIRMED — OpenAI Plugin UI/reference, current docs checked 2026-09-21; capability changelog dates 2026-03-09 and 2026-03-24.**

Sources:
- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/zh-Hant/plugins/reference
- https://developers.openai.com/zh-Hant/plugins/changelog

OpenAI's current UI guidance says new integrations should prefer the shared MCP Apps bridge for portable UI behavior and use `window.openai` only for ChatGPT-specific extensions. File helpers including `uploadFile`, `selectFiles` and `getFileDownloadUrl` are optional extensions and should be feature-detected. The changelog records non-image uploads on 2026-03-09 and file-library helpers on 2026-03-24.

### User job

A user wants a prepared MP4 segment to become actual model-readable media, not merely a URL/metadata object, while the same MCP tool remains useful when the current ChatGPT surface does not expose a specific browser helper.

### Repo implication

Current default source already follows the important part of this contract:

- the widget initializes the MCP Apps bridge and can call tools through `tools/call`;
- ChatGPT-specific file helpers are feature-detected rather than assumed;
- #23 requires actual `file_id` / `download_url` receipt and explicitly rejects metadata-only summarization;
- when native host upload is unavailable, current code has Drive and server-side analysis fallback paths.

This **confirms existing direction**; it does not justify a new portability framework or another Issue.

### Do not copy

Do not make the whole product depend on ChatGPT-only browser globals. Conversely, do not build a generic host-adapter registry until a second supported host produces a concrete incompatible workflow.

---

## B. Adjacent lifecycle signal — video-intelligence products are making retention explicit

**CONFIRMED — Wowza Video Intelligence Framework 1.1, released 2026-09-07; product post 2026-09-09.**

Sources:
- https://www.wowza.com/docs/release-notes-vif
- https://www.wowza.com/blog/whats-new-in-wowza-video-intelligence-framework-vif

Wowza VIF 1.1 added VOD analysis for uploaded files and, in the same release, job-retention controls. This is a useful workflow pattern: once media analysis starts creating stored intermediate jobs/assets, lifecycle is part of the operator contract rather than invisible infrastructure.

This does **not** establish that Reese-max needs a cleanup scheduler. `video-timeline-pipeline` currently uploads Drive copies only as a fallback, the README explicitly defers automatic cleanup until there is real usage, and no storage-growth/user complaint evidence was found this round.

Transferable principle: if temporary handoff artifacts persist outside the local job directory, show ownership/retention/staleness honestly before building automation around them.

---

## C. Direct/adjacent competitor — managed video infrastructure is expanding toward persistent agent context, but also explicit custody controls

**CONFIRMED current capability — VideoDB, checked 2026-09-21; page does not expose a reliable release date for these exact claims.**

Source: https://www.videodb.io/

VideoDB now positions itself as a unified backend for files/live streams/cameras/screens with temporal indexing, exact-moment retrieval, MCP/agent integration and managed or customer-cloud deployment. Its current security/custody surface advertises configurable zero-data-retention and own-cloud deployment for sensitive workloads.

The useful signal is not “copy VideoDB.” It is the opposite: broad hosted video infrastructure already exists. Reese-max should stay compact/local-first and be more explicit about when bytes leave the local job, what remote copy exists, whether that copy was merely created or actually consumed, and whether it is still known reachable.

Vendor scale/cost/security claims are marketing claims and are not imported as outcome evidence for this repo.

---

## D. Deduplicated recent video-intelligence signals

### Google Gemini Agentic Video — 2026-09-01
Source: https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-agentic-video-in-gemini/

Dynamic scanning/zoom over video, audio and transcript remains relevant to bounded evidence escalation but is already covered by #10/PR #16. Vendor benchmark savings/quality claims are not product evidence for this repo. No duplicate Issue.

### TwelveLabs truncation semantics — 2026-09-10
Source: https://docs.twelvelabs.io/docs/get-started/release-notes

TwelveLabs' explicit failure/partial-output semantics remain relevant to #22/PR #24. Current PR #24 already addresses the same completion-state/cache-admission root cause for MiniMax. No duplicate Issue.

# New Releases / strategy changes

| Date | Signal | Relevance | Decision |
|---|---|---|---|
| 2026-09-07 | Wowza VIF 1.1 adds VOD analysis + job retention controls | stored analysis assets need explicit lifecycle semantics | `ADJACENT IDEA / HOLD` |
| 2026-09-10 | TwelveLabs changes truncated segmentation task state | completion state must not masquerade as complete evidence | deduped to #22/PR #24 |
| 2026-09-01 | Gemini Agentic Video | bounded dynamic visual evidence retrieval | deduped to #10/PR #16 |
| current docs checked 2026-09-21 | OpenAI says MCP Apps is portable base; file helpers are optional ChatGPT extensions | confirms capability detection + non-widget fallback | confirms #23/current implementation; no new Issue |

# Community Pain

No community thread was retained as decision-grade evidence this round. Searches did not produce a recent, well-scoped report that added a distinct root cause beyond the current first-party contracts and repository evidence. No anecdote was converted into prevalence, ROI or severity.

# Repository delta / counterevidence

Current default HEAD `c8690059...` materially changed since the last formal board delta and now includes a same-day ChatGPT handoff path:

1. `prepare_video_for_chatgpt` remains the public-URL download/split boundary.
2. The MCP UI now uses the MCP Apps bridge and feature-detects ChatGPT file helpers.
3. README documents a fallback cascade: native ChatGPT attachment handoff → private Google Drive handoff/connector retrieval → server-side analysis when Drive/connector is unavailable.
4. `drive_storage.py` creates a private Drive folder/file through authenticated Drive API calls; this run found no code that creates `anyone`/public permissions.
5. The Drive cache is local `drive-manifest.json`. Cache reuse checks source fingerprint/local segment hashes plus stored remote IDs/URLs, but does not call Drive to prove those IDs still exist at reuse time.
6. Google Drive officially permits files to be trashed/deleted. Therefore “remote handoff may become stale while local cache remains `drive_ready`” is a valid transition, but **not an executed reproduction in this run**.
7. README already says automatic cleanup is deferred pending actual usage. That is counterevidence against manufacturing a cleanup feature solely because competitors expose retention controls.
8. #23 is open and current default-branch changes directly implement that workflow. #22 also has active PR #24; #5/#10/#11 retain active PRs. This radar does not compete with those scopes.

Google Drive lifecycle reference checked 2026-09-21:
- https://developers.google.com/workspace/drive/api/guides/delete

# Adjacent Ideas

## 1. Drive handoff liveness receipt — HOLD / no Issue

If #23 continues after the current owner implementation settles, test one bounded recovery fixture:

1. upload one prepared segment to an isolated Drive folder;
2. confirm the handoff once;
3. trash/delete that remote file using the same authorized test account;
4. rerun the same local job without changing local segment bytes;
5. observe whether the cached `drive_ready` receipt is surfaced as live even though the connector can no longer fetch it.

Only if reproduced, the smallest fix is to distinguish `cached_unverified` from freshly verified remote readiness, or revalidate the referenced file at the moment a Drive handoff is actually needed. Do not add background polling, a retention DB, a Drive sync service or a generic remote-asset registry.

Classification while unexecuted:
- kind: `VALIDATION_GAP`
- severity: `NOT_ESTABLISHED`
- decision_priority: `MEDIUM`
- triage: `NEEDS_EVIDENCE`
- auto_implementation: `false`
- coordination: `SKIPPED_LOCKED / active #23 default-branch work`

Exit:
- **BUILD_SMALL** only if stale cached readiness is reproduced and causes a failed supported handoff;
- **NARROW** if connector failure already cleanly falls through to server-side analysis without misleading success state;
- **REJECT** if the cache never represents remote liveness or the supported flow always revalidates elsewhere.

## 2. Remote retention notice before cleanup automation — HOLD

Do not build cleanup now. If repeated Drive fallback begins creating operator-visible clutter or sensitive retention concerns, first expose simple metadata such as `created_at`, folder/file IDs, “private Drive copy created”, and a documented manual cleanup path. A background retention daemon is a later option only after real recurrence/volume evidence.

## 3. Keep host portability bounded

The current UI already uses the MCP Apps bridge. If a second host is actually supported later, replay only `prepare → receive/verify bytes → analyze` against that host and record which optional file capability is absent. Do not infer a host matrix from OpenAI documentation alone.

# Opportunity Map — `video-timeline-pipeline`

| Category | Decision | Reason |
|---|---|---|
| **MUST MATCH** | File handoff must prove actual model-readable bytes/refs; metadata-only success is forbidden | #23 + OpenAI file-helper contract |
| **MUST MATCH** | Feature-detect optional host file extensions; preserve a tool path that can complete without custom UI | current OpenAI MCP Apps guidance; current source already moving this way |
| **SHOULD BE BETTER** | Remote handoff state should distinguish “cached reference exists” from “remote object verified reachable” if runtime shows that distinction matters | current Drive cache does not revalidate remote existence |
| **SHOULD BE BETTER** | Make remote custody/retention visible before adding cleanup automation | Wowza retention controls + VideoDB ZDR are design signals, not demand proof |
| **DIFFERENTIATOR** | Local-first, evidence-linked, resumable analysis with explicit fallbacks and provenance rather than one hosted video backend | owner scope and current product shape |
| **ADJACENT IDEA** | one stale-Drive-handoff recovery fixture | `VALIDATION_GAP / NEEDS_EVIDENCE` |
| **DO NOT COPY** | hosted asset platform, live surveillance/camera stack, provider marketplace, universal storage layer | already solved broadly elsewhere; conflicts with simplify/local-first direction |
| **DO NOT COPY** | generic host-adapter framework before a second concrete host requires it | no current user/repo evidence |

# Four-Gate Decision

## Candidate A — cached Drive handoff can become stale

### Gate 1 — problem / value

Target user: a ChatGPT/MCP user whose host lacks native upload helpers and therefore uses the Drive fallback. Current source can return a locally cached `drive_ready` record when source/local segment hashes match, without checking the remote Drive object. Google documents that Drive objects can be trashed/deleted. The observable potential break is a handoff that looks ready locally but fails when the connector follows the saved reference.

Counterevidence: no runtime reproduction was executed; the current same-day implementation may still be changing; server-side analysis is another fallback; no user incident/frequency is known.

**Result: workflow gap plausible and source-bounded, severity not established.**

### Gate 2 — priority

- kind: `VALIDATION_GAP`
- severity: `NOT_ESTABLISHED`
- decision_priority: `MEDIUM`
- triage: `NEEDS_EVIDENCE`
- auto_implementation: `false`

No P2/P1: no supported-run failure receipt, no known frequency, no data loss, and an alternate server-side path exists.

### Gate 3 — minimum solution

First run one isolated stale-object fixture. If reproduced, prefer a local state-label/revalidation fix at handoff time. Documentation alone may be enough if `drive_ready` is explicitly defined as “reference cached, liveness unverified.” A DB, remote registry, daemon or polling worker is unnecessary.

### Gate 4 — research / implementation separation

#23 is active owner scope and same-day default-branch work already owns file handoff. This radar does not comment or take ownership. Keep evidence in the central report until runtime proves a distinct root cause after the current work stabilizes.

**Decision: HOLD / NO ISSUE / SKIPPED_LOCKED.**

## Candidate B — automatic Drive retention/cleanup

### Gate 1

External products expose lifecycle controls, but current inputs are primarily public URLs, Drive is a fallback, and there is no observed storage-growth/privacy incident. README explicitly defers cleanup pending usage.

### Gate 2

`RESEARCH / NOT_ESTABLISHED / LOW / NEEDS_EVIDENCE / auto_implementation=false`.

### Gate 3

Do nothing now. If evidence appears, first add truthful retention/manual cleanup guidance; only then consider bounded cleanup.

### Gate 4

No implementation right and no Issue threshold.

**Decision: REJECT_FOR_NOW / NO ISSUE.**

## Candidate C — replace current analysis with Gemini/VideoDB/Wowza

Existing #10 already evaluates bounded agentic visual escalation, and owner scope rejects hosted-platform breadth. Current providers/workflows are not proven inferior on the owner's tasks.

**Decision: DO NOT COPY / DEDUP.**

# Issue Mapping / Dedupe

- **0 new Issues.**
- **0 Issue comments/updates.**
- **0 PR comments/updates.**
- #23 — current ChatGPT file handoff; same-day default-branch implementation. New host-contract evidence confirms capability detection/fail-closed direction; no comment because active scope.
- #22 / PR #24 — truncated MiniMax completion/cache admission; TwelveLabs signal remains deduplicated.
- #10 / PR #16 — bounded visual evidence escalation; Gemini agentic video remains deduplicated.
- #11 / PR #15 — NLE handoff; unchanged.
- #5 / PR #21 — grounded retrieval/citations; active scope, unchanged.
- #20 — C2PA source provenance; unchanged.
- #4/#8/#18 and related PRs — cost/accounting/safety scope untouched.

No historical Issue was reopened, closed or reprioritized solely from market signals. No synthetic score was treated as implementation authorization.

# Rejected Ideas

- **Build a Google Drive cleanup scheduler now** — rejected: no volume/retention pain evidence; README intentionally defers it.
- **Create a remote-asset registry / handoff database** — rejected: one bounded liveness check/state label can answer the current recovery question.
- **Make ChatGPT file-library storage mandatory** — rejected: official docs say file-library/file helpers are optional and availability varies.
- **Switch to VideoDB/Wowza for hosted video state** — rejected: violates local-first/simplify posture and adds custody/cost surface without task-specific proof.
- **Make Gemini agentic video the new default** — dedup/rejected for now: #10 already requires frozen evaluation and bounded escalation, not provider replacement.

# Cross-portfolio ideas

One reusable principle is retained without a cross-repo Issue: **external-reference creation, external-reference liveness, content consumption and cleanup are four distinct states**. Reuse only when another repo has a concrete remote-file handoff and user-visible state; do not create a central lifecycle framework from this one workflow.

# Sources

Checked 2026-09-21 unless event date is stated:

1. OpenAI — Add a UI to your MCP server: https://developers.openai.com/plugins/build/chatgpt-ui
2. OpenAI — Plugin reference / File APIs: https://developers.openai.com/zh-Hant/plugins/reference
3. OpenAI — Plugin UI changelog: https://developers.openai.com/zh-Hant/plugins/changelog
4. Wowza VIF release notes — 2026-09-07: https://www.wowza.com/docs/release-notes-vif
5. Wowza VIF 1.1 product post — 2026-09-09: https://www.wowza.com/blog/whats-new-in-wowza-video-intelligence-framework-vif
6. VideoDB current platform/security surface: https://www.videodb.io/
7. Google Drive trash/delete lifecycle: https://developers.google.com/workspace/drive/api/guides/delete
8. Google Gemini Agentic Video — 2026-09-01: https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-agentic-video-in-gemini/
9. TwelveLabs release notes — 2026-09-10 truncation semantics: https://docs.twelvelabs.io/docs/get-started/release-notes
10. Repo default source at focal HEAD: `Reese-max/video-timeline-pipeline@c8690059cc8c981d8646d55df8dcc303ca8df6f1`.

# What Changed

1. Reconciled a materially changed default branch: ChatGPT file handoff, MCP Apps bridge, private Drive fallback and server-side analysis now exist on main.
2. First-party OpenAI docs confirm that optional file helpers must be capability-detected; current architecture is directionally aligned, so no portability Issue was manufactured.
3. External video products increasingly expose explicit retention/custody controls, but current repo/user evidence is insufficient for a cleanup feature.
4. Retained one bounded recovery hypothesis around stale cached Drive references; classified it as `VALIDATION_GAP / NOT_ESTABLISHED`, not a product defect claim.
5. No Issue/PR scope was grabbed; no implementation authorization was created.

# Completion / gaps / cursor

- Radar status: **COMPLETE** for the selected repo and this rotation step.
- Runtime gap: Drive stale-reference scenario was not executed; if revisited, use one isolated Drive fixture and no production/private media.
- Runtime gap: no ChatGPT host, Drive connector, MiniMax, Gemini, TwelveLabs, VideoDB or Wowza canary was run this round.
- Portfolio CLEAN: **not declared**.
- Notification threshold: **not met** — signals confirm/adapt existing active work and add only a bounded validation hypothesis; no new high-value opportunity, major strategy reversal requiring action, validated cross-project capability or evidence overturning owner direction was found.
- Next fair-rotation cursor: **`Reese-max/ai-novel-workstation`**.
