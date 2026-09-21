# External Competitive / New-Product / Workflow Radar — 2026-09-21T10:00:13Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / NO_MATERIAL_NOTIFICATION / ZERO_NEW_ISSUES**.
- Primary intelligence source this round was the public web outside Reese-max GitHub. GitHub was used for owner scope, current product truth, duplicate/ownership checks, and this durable report.
- Governing rule re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`; blob SHA **`8167e10798071d2276addaff6b201c6b0e904a2a`**.
- Fresh connected inventory was paginated to exhaustion: **42 Reese-max-owned repositories / 41 unarchived**; page 2 returned empty. `obsidian-vault` is archived and excluded from product rotation.
- Fair cursor entering this round: `Reese-max/soundbox-offline`.
- Focal default branch remains `main@68d8137b77be063cc5ae5468e9e31b81455060a9`; latest default commit is audit/docs only. The last substantive product commit remains `44c22cc8d41f5944e0df811c96aa162d49db44e2`.
- Owner direction rechecked from current board/audit material: **INVEST / SIMPLIFY**. Protect offline/local ownership, import fidelity, recovery truth and validation before expansion. The owner-authored board explicitly rejects cloud catalog/storage, social/community, AI recommendations, subscriptions, DRM and native rewrites as default next work.
- No browser/device/IndexedDB, provider, CI, Cloudflare, production, paid, destructive, source/config/secret/settings or deployment execution was performed. Source evidence is not represented as runtime evidence.

## Executive decision

**0 new Issues; 0 Issue/PR comments; 0 scope rewrites; 0 implementation authorizations.**

The fresh external material shows that local/offline music players are increasingly adding **local personalization** (deterministic Daily Mix/smart rules or on-device AI playlists), and a recent community thread asks specifically for “forgotten favourites.” However, this does **not** overturn the existing owner decision against recommendation/AI expansion: there is still no Soundbox-specific user evidence, completion-rate impact or supported-workflow failure showing this should outrank current trust/import/recovery work.

A very small future research hypothesis is retained in this central report only: because current Soundbox already stores `favorite` and `lastPlayedAt`, it could test **deterministic resurfacing of liked tracks not played recently** without a model, new provider, new database or recommendation framework. The hypothesis remains unapproved and does not receive implementation authority.

## Current product / coordination reality

Current source confirms:

- Soundbox is a mobile-first PWA for user-owned local audio, with no required login/server music library.
- `Track` already contains `favorite` and optional `lastPlayedAt`; `markPlayed()` persists `lastPlayedAt = Date.now()`; the Recent view sorts by this value.
- `makeTrack(file)` still derives title/artist from filename and defaults album to `離線收藏`; embedded tag preservation is already tracked by **#10**, so this round does not duplicate it.
- open **PR #8** owns #3 LAN/browser import work and has unresolved review findings around non-integrated placeholder WebRTC behavior, offer expiry, manifest-count bounds and incoming descriptor bounds. That scope is **SKIPPED_LOCKED / ACTIVE_SCOPE**.
- #4/#5 also have active implementation PRs. No competitive signal is used to widen those scopes.

## External Signals

### A. Direct category — Prismatic Music 2.0 adds on-device local-library AI playlists

**CONFIRMED first-party release. Released 2026-09-12; checked 2026-09-21.**

Source: https://www.prismatic.fm/music/press

Prismatic Music 2.0 remains an offline player for user-owned files with no required streaming catalog/account. Version 2.0 adds two relevant capabilities:

- `Conductor`: on-device song analysis for sections/beats/key/energy;
- **AI playlists from the user’s own local library**, gated by supported Apple Intelligence/iOS 27 devices and Pro.

User job: turn a large owned library into a useful mix without searching/selecting every track manually.

Transferable signal: privacy-preserving personalization can be built from local-library truth instead of a cloud catalog.

Do not copy: Apple-Intelligence dependency, paid AI feature gating, a new analysis engine, semantic prompt-to-playlist pipeline or visualizer platform are not justified by current Soundbox evidence.

**Decision:** `ADJACENT IDEA / NEEDS_EVIDENCE`; no Issue.

### B. Direct category — WaveFlow makes local personalization deterministic

**CONFIRMED current first-party capability; checked 2026-09-21.**

Source: https://waveflow.app/

WaveFlow’s current v1.7.0 surface includes:

- three deterministic Daily Mixes generated from the last 90 days of listening;
- rule-based smart playlists using genre/BPM/year/rating/format/likes;
- listening history/stats kept locally;
- no required account/subscription/cloud for the local library.

The useful product pattern is narrower than “copy recommendations”: **use existing first-party listening state to reduce manual rediscovery**, while keeping the algorithm local, inspectable and deterministic.

This is still not Soundbox product-specific value proof. It is a design pattern, not a P1/P2 defect and not implementation approval.

### C. Community pain — “forgotten favourites” in a local library

**COMMUNITY_SIGNAL only; not prevalence evidence. Thread dated 2026-09-13, relevant follow-up 2026-09-20; checked 2026-09-21.**

Source: https://www.reddit.com/r/androidapps/comments/1wfcsce/offline_music_player/

A user looking for an offline player explicitly requested YT-Music/Spotify-like “forgotten favourite” behavior. In a later exchange, another developer proposed resurfacing tracks played frequently in the past but not for months; the original poster confirmed that this is the desired experience.

This is useful qualitative evidence that rediscovery can solve a real local-library job, but it is one anecdotal thread. It cannot establish Soundbox frequency, severity, retention impact or ROI.

## New Releases

- **2026-09-12 — Prismatic Music 2.0.0:** on-device Conductor analysis and AI playlists for songs the user owns.
- **Current v1.7.0 — WaveFlow:** deterministic 90-day Daily Mixes and rule-based smart playlists remain part of its local-first product surface.

No fresh external release found this round creates a stronger current obligation than Soundbox’s already-tracked import fidelity, integrity, CI/runtime truth or bounded LAN import work.

## Adjacent Ideas

### Deterministic “forgotten favourites” experiment — hold, do not build

A future bounded question, only if owner/user evidence appears:

> Does showing a small list of **liked tracks whose `lastPlayedAt` is older than a chosen threshold** materially reduce manual library browsing for Soundbox users?

Smallest experiment order:

1. **No product change first:** use a fixed fixture/current state shape (`favorite`, `lastPlayedAt`) to generate a candidate list and check whether the result is understandable/useful.
2. If tested in product later, expose it as a transparent local filter/list, not an opaque recommendation engine.
3. Do not add play-count collection, embeddings, LLM calls, cloud metadata, model training or a new persistence schema unless a later separate question demonstrates necessity.
4. Exit with `BUILD`, `NARROW`, or `REJECT`; `BUILD` would still require a separately reviewed minimal delivery authorization.

Current classification:

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: LOW_MEDIUM
evidence: NEEDS_EVIDENCE
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

## Opportunity Map — `soundbox-offline`

| Category | Current decision |
|---|---|
| **MUST MATCH** | Local import/playback, storage integrity, backup/recovery truth, bounded failures, trustworthy validation. |
| **SHOULD BE BETTER** | Preserve file-owned title/artist/album before filename/default inference — already #10, no duplicate. |
| **DIFFERENTIATOR** | No-account/no-server ownership plus honest recoverability; LAN transfer only if #3’s real browser/device path is proven. |
| **ADJACENT IDEA** | Transparent deterministic rediscovery using already-held `favorite + lastPlayedAt`; evidence question only. |
| **DO NOT COPY** | AI/LLM recommendation stack, cloud listening profile, semantic embedding DB, subscription feature matrix, social discovery, native rewrite, large analytics dashboard. |

## Four-gate review — local rediscovery candidate

### 1. Problem / value

External products and one fresh community discussion show the job exists in the category. Current Soundbox can technically express a minimal “liked but not recent” condition using data it already stores. However, there is **no current Soundbox user observation, telemetry, support request or runtime study** showing that rediscovery is a frequent/core blocker. Existing library search, favourites and Recent are credible alternatives.

**Gate: value hypothesis only; insufficient for an Issue.**

### 2. Priority

`RESEARCH / severity=NOT_ESTABLISHED / decision_priority=LOW_MEDIUM / NEEDS_EVIDENCE`.

It is not P2 merely because competitors ship personalization. No completion/recovery/maintenance impact is established, and it does not outrank current integrity/import/validation work.

### 3. Minimum solution

Before any feature, test a deterministic query over existing fields. If value is later demonstrated, the minimum UI is a small explainable list/filter. A model, recommendation service, play-history warehouse, new database, profile graph or cross-device sync is not the minimum solution.

### 4. Research / implementation separation

No Issue is created. No BUILD decision exists. The hypothesis stays only in this report. The prior owner rejection of broad AI recommendations remains in force because the new evidence does not invalidate its original reason: **unproven Soundbox-specific value versus higher-priority trust work**.

## Cross-portfolio idea

**Prefer deterministic value extraction from already-owned first-party state before adding AI.** When a product already has explicit user signals and recency, a transparent local rule can test the job before creating an AI pipeline. This is a reusable decision principle only; no shared framework/registry Issue is warranted.

## Rejected / deferred ideas

- **Prismatic-style prompt-to-playlist AI:** rejected for now; new model/device/paywall dependencies with no Soundbox-specific need.
- **WaveFlow-scale Daily Mix / mood-radio system:** deferred; more state/analysis and product surface than required to test rediscovery value.
- **Add play counts solely to support “played 20 times” logic:** rejected as first step; existing `favorite + lastPlayedAt` is a smaller hypothesis test.
- **Recommendation framework / embeddings / local ML model:** rejected; architecture before value evidence.
- **New Share Target work:** unchanged from the 2026-09-18 radar; platform and user evidence remain insufficient and #3 import work is active.
- **Expand LAN/network work from competitor signals:** rejected; PR #8 already owns that root workflow and is active with unresolved review findings.
- **Duplicate tag/artwork Issue:** rejected; text tag preservation already maps to #10, and artwork remains outside #10’s minimum MVP.

## Issue Mapping / coordination

| Signal / fingerprint | Mapping | Decision |
|---|---|---|
| Embedded title/artist/album ignored on import | #10 | Existing `OPPORTUNITY`; no new evidence requiring comment/scope change |
| LAN/browser direct import | #3 / active PR #8 | `SKIPPED_LOCKED`; no competitive scope expansion |
| CI regression gate | #4 / active PR #6 | No change |
| RSC security patch | #5 / active PRs #7/#9 | No change |
| Deterministic forgotten-favourites rediscovery | none | Central research hypothesis only; Gate 1 insufficient for Issue |

No Issue lock was acquired because no existing Issue or shared tracking state was modified. No PR/Issue comment was written.

## Sources

Public web, checked 2026-09-21:

- Prismatic Music press kit / 2.0: https://www.prismatic.fm/music/press
- Prismatic current product surface: https://www.prismatic.fm/
- WaveFlow current product surface: https://waveflow.app/
- Reddit community thread: https://www.reddit.com/r/androidapps/comments/1wfcsce/offline_music_player/

GitHub evidence used only for current owner/product truth and coordination:

- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-16T1958Z-product-board-delta.md`
- `Reese-max/autodev-ng/docs/competitive-intelligence/2026-09-18T021244Z-external-radar.md`
- `Reese-max/soundbox-offline` current README/source/Issues/all-state PR surface

## What Changed / accounting

- Current owner inventory: **42 owned / 41 unarchived**, fully paginated; no reliance on the older 41/40 snapshot.
- Default Soundbox product code: **no new default-branch product change** since the prior Soundbox radar.
- Fresh retained external signal: Prismatic 2.0 local-library AI playlists + current WaveFlow deterministic local mixes + one recent “forgotten favourites” community signal.
- Prior rejection of broad AI recommendations: **not overturned**.
- New Issues: **0**.
- Existing Issue updates/comments: **0**.
- PR comments/scope changes: **0**.
- Implementation authorizations: **0**.
- Runtime validations: **0**; any unexecuted path remains `NEEDS_RUNTIME_VERIFICATION` where applicable.
- Portfolio CLEAN: **not declared**.
- Notification threshold: **not met**; these signals are useful research context but do not yet establish a high-value Soundbox opportunity or direction reversal.
- Next fair cursor: **`Reese-max/skill-foundry`**.
