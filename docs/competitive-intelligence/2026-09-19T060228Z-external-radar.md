# External Competitive / New-Product / Workflow Radar — 2026-09-19T06:02:28Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY / NO_NEW_ACTIONABLE_ISSUE**.
- Owner scope: `Reese-max` only; no third-party repository was modified.
- Issue Quality v2 re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality-rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh owner listing exhausted in one page: **41 currently accessible Reese-max-owned repositories / 40 unarchived**; `obsidian-vault` is the only archived repository returned.
- Fair cursor entering this round: `Reese-max/soundbox-offline`.
- Focal repo: public, owner-controlled, unarchived. Default branch `main`; HEAD re-read this round: `68d8137b77be063cc5ae5468e9e31b81455060a9` (`docs: record soundbox 50-persona round 4`).
- Owner-approved direction remains **INVEST / SIMPLIFY** around a local-first/offline PWA for user-owned audio; no cloud catalog, social feed, subscription, recommendation service, DRM layer, or native rewrite merely to match competitors.
- Existing relevant scopes were re-read before external comparison: #1 whole-library backup/restore remains open and has open PR #2; #3 same-network import has active PR #8; #10 embedded metadata preservation remains open. This round did not take ownership of any of them.
- No browser runtime, mobile device, live LAN transfer, destructive restore, deployment, product source/config/CI/secret/settings change, implementation branch, merge, worker, GOAL, or paid request was started.

## Executive decision

**0 new Issues. 0 existing Issue/PR comments. 0 implementation authorizations.**

The fresh external scan produced useful confirmation, but no new signal crossed the four-gate threshold without duplicating existing work or expanding scope prematurely.

Two current patterns are worth preserving:

1. Recent local-player releases continue to validate the same product job already captured by #10: preserve useful file metadata locally, work offline, and keep backup/recovery understandable.
2. Browser/PWA OS-integration remains uneven. Newer Chromium file-handling reliability improvements make desktop “open with” flows more credible, but MDN still documents file handling as Chromium-desktop-only and Web Share Target as limited availability. This is not enough to overturn the previous decision to avoid a new mobile share/file-handler Issue while #3 is active.

The next highest-value action therefore remains **finish/validate existing integrity and import scopes before adding another ingestion surface**.

## Product → market category

| Product | Market / alternatives | Current differentiated job |
|---|---|---|
| `soundbox-offline` | Kasette, Vibe, Trove, WaveFlow, other local/offline music players and PWA/native file players | User-owned local audio in an installable offline-first PWA, with local playlists/state, explicit import, local backup/restore and no required account/server music library |

## External Signals

### A. Direct competitor — Vibe confirms that large-library UX and simple local backup can stay narrow

**CONFIRMED — public launch v0.6.0 added 2026-08-29; checked 2026-09-19 UTC.**

Source: https://f-droid.org/id/packages/dev.fiedri.vibe/

Vibe positions itself as a 100% offline local player and ships songs/albums/artists/playlists views, playlist CRUD with duplicate filtering, JSON playlist backup/restore, queue/sorting/search/favorites, and reports testing on Android 10/13/14. Its current distribution description also emphasizes virtualized rendering for libraries with thousands of songs.

**User job:** keep a large owned library browsable without introducing an account or cloud index.

**Transferable design:** keep library-scale work bounded and local; simple export formats can be sufficient for narrow state such as playlists.

**Why no Issue:** Soundbox has no current repo/runtime evidence that search/list rendering is failing at scale. Backup correctness is already owned by #1 and is currently more important than scheduled backup, virtualization, or new library views. Competitor capability alone does not establish user pain.

### A2. Direct competitor — Kasette 1.3.2 remains the strongest close match, but is already consumed by #10

**CONFIRMED — v1.3.2 added 2026-09-16; checked 2026-09-19 UTC.**

Source: https://f-droid.org/zh_Hant/packages/com.kasette.app/

Kasette remains 100% offline/client-side, imports MP3/FLAC/M4A/OGG/Opus/WAV/AAC, parses ID3/FLAC tags and embedded artwork, supports playlists/search/background controls and whole-library export/restore, and v1.3.2 removed the Android `INTERNET` permission.

**Decision:** `DUPLICATE`. This exact signal already produced Soundbox #10 on 2026-09-18. No new evidence changes #10's `OPPORTUNITY / NOT_ESTABLISHED / NEEDS_REVIEW / auto_implementation=false` classification or justifies adding cover-art scope.

### B. Adjacent workflow — Trove expands local ownership across native devices and NAS, but that breadth should not be copied

**CONFIRMED current product capability; site says Mac support is available since September 2026, exact launch day not established on the cited page; checked 2026-09-19 UTC.**

Source: https://troveplayer.com/

Trove emphasizes local files, embedded tags/artwork/lyrics, direct Files-app import, optional WebDAV/SMB NAS access, and a one-time Pro unlock instead of subscription. The user job is continuity of an owned library across Apple devices and self-controlled storage.

**Transferable design:** local ownership can coexist with optional user-controlled sources.

**Do not copy:** native SwiftUI rewrite, Apple Watch, NAS/WebDAV/SMB product breadth, lossless/exotic codec expansion, lyrics/equalizer and paid entitlement are not supported by current Soundbox user evidence. Same-network transfer is already isolated in #3/PR #8 and should be proven there first.

### C. Browser/platform signal — Chromium file handling is getting more reliable, but support is still too uneven for a new mobile ingestion commitment

**CONFIRMED — Chrome 146 release-note behavior; checked 2026-09-19 UTC.**

Primary source: https://developer.chrome.com/release-notes/146

Chrome 146 changed PWA file handling so `LaunchParams.targetURL` is populated when files open into an existing PWA window and stopped re-queuing the same `LaunchParams` after reload. These are useful reliability improvements for OS-level “open with” workflows.

Compatibility boundary:
- MDN file-handling guide: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Associate_files_with_your_PWA
- MDN Web Share Target: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target

MDN still documents PWA file handling as Chromium-based desktop only, while `share_target` remains limited/experimental and not Baseline across widely used browsers.

**User job:** get an audio file into the player directly from the operating system without first opening Soundbox and browsing a picker.

**Decision:** `ADJACENT IDEA / HOLD`. Current default branch has no `file_handlers` or `share_target` configuration, but absence is not itself a validated defect. Mobile-first coverage remains uneven, and #3/PR #8 is already the active import-expansion lane. No new Issue.

## New Releases / market signals

| Date | Product/platform | Signal | Decision |
|---|---|---|---|
| 2026-09-16 | Kasette 1.3.2 | removed Android INTERNET permission; continued offline metadata parsing + backup | already captured by #10; no duplicate |
| 2026-08-29 | Vibe 0.6.0 | public launch of minimalist 100% offline local player with playlist JSON backup and Android runtime testing | useful parity/scale signal; no proven Soundbox gap |
| 2026-09 (exact day not established) | Trove | site states Mac support joined its iPhone/iPad/Watch local-library product | validates owned-library continuity; native/NAS breadth is out of scope |
| Chrome 146 | Chromium PWA file handling | more reliable launch URL and no duplicate file re-delivery on reload | desktop-adjacent only; does not overturn cross-browser/mobile constraints |

No pricing change was promoted into a product decision. Trove's current one-time Pro pricing is a commercial-design signal only, not evidence Soundbox should add billing.

## Community Pain

No new Reddit/Hacker News anecdote was promoted into prevalence or severity evidence this round. The previous community-style ideas around local-file portability and metadata ownership remain directional only; they do not establish a current Soundbox blocker.

## Adjacent Ideas

### 1. Direct OS file-open/share entry point

Potential workflow reduction:

`Files app / OS → Soundbox` instead of `open Soundbox → Import → browse file`.

This remains useful to revisit later, but the minimum safe experiment should be platform-gated and must prove actual Android/iOS/desktop coverage before product scope changes. It should not be combined with #3's LAN transport or #10's metadata parsing.

### 2. Large-library rendering

Vibe's current positioning suggests virtualization is a practical technique for thousands of songs. Soundbox should only adopt it after measurement shows current rendering/search latency or memory is a user-visible problem. No speculative “performance framework” is warranted.

### 3. Backup breadth

WaveFlow/Kasette/Vibe continue to make export/backup a visible local-first feature. Soundbox already treats recoverability as core; the current priority is correctness of #1, not auto-backup schedules or additional archive formats.

## Opportunity Map

| Category | Decision | Rationale |
|---|---|---|
| **MUST MATCH** | Reliable local import/playback and truthful backup/restore | core owner direction; #1 remains higher priority than new feature breadth |
| **SHOULD BE BETTER** | Preserve existing title/artist/album metadata on import | #10 already owns the narrow gap; Kasette remains supporting evidence |
| **SHOULD BE BETTER** | Keep large libraries usable if measurement proves a problem | Vibe validates technique, not a current Soundbox defect |
| **DIFFERENTIATOR** | Installable local-first PWA with no required account/server library | retain; do not trade this away for broad cloud/NAS/service breadth |
| **ADJACENT IDEA** | OS-level file open/share entry | potentially removes manual picker steps, but browser/mobile support is uneven |
| **ADJACENT IDEA** | Bounded same-network transfer | already #3/PR #8; no competing scope created |
| **DO NOT COPY** | Native multi-platform rewrite / watch app / NAS stack | high maintenance and outside approved product scale |
| **DO NOT COPY** | Scheduled backup, new archive service or sync layer before #1 integrity is correct | would automate an unproven recovery path |
| **DO NOT COPY** | Fuzzy search/virtualization merely because competitors have it | no current user pain or runtime evidence |

## Four-gate assessment

### Candidate: OS-level direct file open/share

1. **Problem/value:** plausible manual step reduction, but no current user evidence shows the existing import picker is a material completion blocker. Current source absence of `file_handlers/share_target` is not value evidence.
2. **Priority:** `kind=OPPORTUNITY`, `severity=NOT_ESTABLISHED`, `decision_priority=LOW`, `triage=NEEDS_EVIDENCE`, `auto_implementation=false` if ever tracked; not enough evidence to create an Issue now.
3. **Minimum solution:** first do a no-product-change compatibility matrix against current mobile/desktop targets. Only if coverage is useful should a tiny manifest/handler experiment be considered. Do not build an import router or native wrapper.
4. **Research/implementation separation:** current result is `HOLD`. Browser documentation is not runtime proof for Soundbox's target devices.

### Candidate: large-library virtualization

1. No observed latency/memory threshold failure on current Soundbox.
2. `NOT_ESTABLISHED`; competitor use is not severity evidence.
3. Measure representative library sizes before changing rendering.
4. Result: `REJECT_FOR_NOW` as an Issue; retain as a future measurement trigger.

## Rejected Ideas / negative findings

1. **Create another embedded-metadata Issue — REJECT / DUPLICATE.** #10 already has the same root-cause fingerprint.
2. **Add cover-art parsing to #10 immediately — REJECT.** It expands IndexedDB/backup/Media Session/memory responsibility without proving the text-metadata job first.
3. **Open a PWA share/file-handler feature Issue now — REJECT FOR NOW.** Browser support remains uneven and user pain is unproven.
4. **Build native Android/iOS/Desktop wrappers because competitors do — REJECT.** Owner direction is PWA-first/local-first simplification.
5. **Add scheduled/automatic backups because WaveFlow exposes them — REJECT FOR NOW.** #1 still has integrity work and an open PR; correctness precedes automation.
6. **Add fuzzy search or virtualization because Vibe advertises it — REJECT FOR NOW.** No measurement shows a current problem.
7. **Broaden #3 while PR #8 is active — SKIPPED_ACTIVE_SCOPE.** PR #8 already owns same-network import and still has unresolved review findings; no external signal grants authority to widen it.

## Issue Mapping

| External signal | Existing owner scope | Action this round |
|---|---|---|
| Kasette local tag parsing | #10 | `DEDUP`; no comment because no materially new evidence/status |
| whole-library/local backup trend | #1 + open PR #2 | no scope expansion; data-integrity correctness remains first |
| direct device/network import | #3 + active PR #8 | `SKIPPED_ACTIVE_SCOPE`; no comment/lock contention |
| Chromium file handling | none | central report only; insufficient cross-browser/mobile/user evidence for Issue |
| Vibe large-library rendering | none | central report only; measurement trigger, not a defect |
| Trove native/NAS breadth | none | `DO NOT COPY` under approved scope |

No Issue lock marker was needed because no Issue/comment/shared mutable tracking state was changed. The report uses a unique new path and does not overwrite history.

## Sources

Checked 2026-09-19 UTC unless otherwise noted:

- Vibe / F-Droid: https://f-droid.org/id/packages/dev.fiedri.vibe/
- Kasette / F-Droid: https://f-droid.org/zh_Hant/packages/com.kasette.app/
- Trove Player: https://troveplayer.com/
- WaveFlow: https://waveflow.app/
- Chrome 146 release notes: https://developer.chrome.com/release-notes/146
- MDN — Associate files with your PWA: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Associate_files_with_your_PWA
- MDN — `share_target`: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target

## What Changed

- Reconfirmed fresh owner inventory: 41 accessible owned repos / 40 unarchived.
- Revalidated `soundbox-offline` at `main@68d8137b77be063cc5ae5468e9e31b81455060a9`.
- Confirmed #10 remains open with no comments and no evidence that its classification should change.
- Confirmed #1 still has open PR #2 and #3 has active PR #8; no competing scope was created.
- Added current direct-competitor evidence from Vibe and current browser file-handling compatibility evidence.
- No external evidence overturned owner direction, established a new P0/P1/P2 defect, or justified a new bounded research Issue.

## Classification / scope calibration

- #10 remains `OPPORTUNITY / NOT_ESTABLISHED / MEDIUM / NEEDS_REVIEW / auto_implementation=false / NEEDS_RUNTIME_VERIFICATION`.
- OS-level direct file-open/share remains central-notes-only `OPPORTUNITY / NOT_ESTABLISHED / LOW / NEEDS_EVIDENCE`.
- Large-library virtualization remains `NOT_ESTABLISHED`; no Issue without measured current pain.
- Existing #1/#3 implementation/research scopes were not reclassified from external marketing claims.

## Completion / gaps / cursor

Completed:
- fresh full owner inventory;
- rules/direction/default-branch refresh;
- existing Issue/PR dedupe around the focal repo;
- A direct competitor, B adjacent workflow and C browser/platform scan using public web sources;
- four-gate review and opportunity map;
- unique central report write.

Gaps / non-claims:
- no mobile PWA runtime or OS share/file-handler test was run;
- no large-library performance benchmark was run;
- no real tagged-file import was run for #10;
- no destructive/real restore was run for #1;
- no browser-to-browser LAN transfer was run for PR #8;
- competitor product claims are design signals, not independent performance measurements.

**Next fair cursor: `Reese-max/skill-foundry`.**