# External Competitive / New Product / Workflow Radar — 2026-09-18T02:12:44Z

## Run scope / evidence contract

- Primary intelligence source this round: public web **outside Reese-max GitHub**. GitHub is used to establish owner scope, current product reality, duplicate boundaries, active work, and to persist this report.
- Quality gate source: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality gate blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Connected GitHub inventory was freshly paginated to exhaustion: **41 Reese-max-owned repositories visible, 40 unarchived**. `obsidian-vault` is archived and excluded. This matches the previous radar's visible count; no repository add/delete inference is made from connector inventory alone.
- Fair-rotation focus carried forward from the previous report: `Reese-max/soundbox-offline`.
- Current default-branch evidence: `main@68d8137b77be063cc5ae5468e9e31b81455060a9` (`docs: record soundbox 50-persona round 4`). Open-PR behavior is not treated as current product capability.
- Owner/product direction rechecked from the current product-board audit and README: mobile-first local/offline player for user-owned audio; no account/server music library; privacy/local ownership and recoverability are the moat; `INVEST / SIMPLIFY`; do not expand into cloud catalog, social, subscriptions, recommendations, DRM, or native-app rewrites merely because competitors have them.
- No local/CI/production/provider execution was performed in this radar. Source-confirmed behavior is kept separate from runtime evidence.

## Inventory / applicability checkpoint

Visible unarchived repositories this round: `exam-archive`, `police-exam-practice`, `police-exam-archive`, `92-duty-scheduler`, `UkePack`, `ppt-studio`, `voice-actress`, `taiwan-intel-dashboard`, `autodev-ng`, `flux-image-gen`, `claude-mem`, `lobsterpulse`, `prompt-autoresearch`, `neciken-summer-poem`, `note-filler`, `adng-memory`, `cyber-prep-coach`, `cf-ai-router`, `avatar-vfo`, `project-doctor-web`, `minideck`, `chatgpt-dual-pipeline`, `taichung-police-intel`, `soundbox-offline`, `skill-foundry`, `video-timeline-pipeline`, `ai-novel-workstation`, `clinical-scribe-worker`, `MaterialYouNewTab`, `cf-mcp-server`, `tick-stock-panel`, `herdr-skills`, `ninax-line-hermes`, `ai-flight-radar`, `academic-mcp`, `spotify-playlist-organizer-mcp`, `google-maps-personal-mcp`, `travel-planning-mcp`, `octobroker`, `openab`.

This round does not turn empty/content/reference repositories into artificial product findings. Fair rotation advances after this report rather than restarting from popular repositories.

# Current product reality — `soundbox-offline`

The current README states that Soundbox imports user-owned MP3/M4A/WAV/OGG audio, stores audio in browser IndexedDB, keeps playlists/player state locally, supports manual title/artist/album editing, search, queue/favorites, Media Session, PWA install, persistent-storage request, and versioned whole-library backup/restore. The product explicitly does **not** require an account or server music library.

Current source gives a more specific import truth:

- `makeTrack(file)` does not inspect embedded audio metadata.
- It strips the extension, splits `Artist - Title` when that filename shape exists, otherwise writes artist as `本機音樂`.
- Album is always initialized to `離線收藏`.
- The UI later lets the user edit title/artist/album manually.
- Cover art is a generated placeholder using artist initials; current source does not parse embedded artwork.

Therefore, a correctly tagged local MP3 can enter Soundbox with its existing artist/album/title data ignored and require manual recreation. This is a current source-confirmed workflow gap, not a claim that real users encounter it at a known frequency.

# External Signals

## A. Direct competitor — Kasette makes tag preservation part of the offline-import contract

**Status:** CONFIRMED product capability; no independent effectiveness claim.  
**Version / date:** Kasette 1.3.2, F-Droid added/updated 2026-09-16.  
**Accessed:** 2026-09-18.  
**Source:** https://f-droid.org/packages/com.kasette.app/

Kasette is unusually close to Soundbox's owner-approved job: a client-side local music player with no account, no server and no analytics. Its current listing explicitly includes:

- local MP3/FLAC/M4A/OGG/Opus/WAV/AAC import;
- client-side ID3/FLAC tag and embedded cover-art parsing;
- title/artist/album search;
- playlists and background/lock-screen controls;
- whole-library export/restore;
- PWA and Android packaging.

The 1.3.2 release specifically removes the Android INTERNET permission and states that the app makes no network requests. This matters as a design signal: metadata fidelity does **not** require cloud lookup or an account; a local-first player can preserve data the user's file already contains.

### User job / manual-step reduction

For a user with an already-tagged collection, embedded metadata parsing removes the sequence:

`import file -> title/artist/album becomes filename-derived/default -> inspect track -> retype metadata -> repeat`.

The transferable product rule is **preserve user-owned metadata before inventing defaults**.

### What not to copy

- Do not create a native Android wrapper merely because Kasette has one.
- Do not expand Soundbox's accepted media-format contract to FLAC/Opus/AAC just to match a competitor.
- Do not copy themes or other cosmetic features into this root-cause issue.
- Do not infer that Kasette's existence proves a particular adoption or retention gain.

**Issue decision:** passes the product/value and minimum-solution gates as a bounded `OPPORTUNITY`; created #10. Severity remains `NOT_ESTABLISHED`, decision priority `MEDIUM`, `triage=NEEDS_REVIEW`, `auto_implementation=false`.

---

## B. Technical feasibility signal — browser-side embedded artwork/tag access does not require upload

**Status:** CONFIRMED current product/tool capability; vendor statement, not Soundbox runtime evidence.  
**Accessed:** 2026-09-18.  
**Source:** https://troveplayer.com/tools/extract-album-art

Trove exposes a browser tool that reads embedded artwork from MP3/FLAC/M4A/OGG and states that processing stays in the browser without a backend upload. This is useful only as feasibility/context evidence: a browser-local parser is compatible with Soundbox's privacy direction.

It does **not** justify importing Trove's NAS, WebDAV/SMB, lyrics, Apple-platform native client, or paid-feature model.

---

## C. Adjacent direct-import workflow — Anywhere reduces Files/app switching

**Status:** CONFIRMED product release capability.  
**Release:** Anywhere Music Player 2026.9.2 on 2026-09-09; the same capability remains in 2026.9.3.  
**Accessed:** 2026-09-18.  
**Source:** https://apps.apple.com/gb/app/anywhere-music-player/id1669824656

Anywhere's September release adds the ability to open audio files directly in the player from Files and other apps. This is not the same root cause as tag preservation, but it highlights a second import-friction pattern: local music users value eliminating intermediate copy/open/import steps.

Soundbox's current web app manifest does not define a `share_target`. The Web Share Target API can let an installed PWA receive files from another app, but current platform documentation marks it limited/experimental and web.dev describes the receive-target path as currently available on Android WebAPK/ChromeOS.

Sources:
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target
- https://web.dev/learn/pwa/os-integration

**Issue decision:** `ADJACENT IDEA / NEEDS_EVIDENCE`, no Issue. Platform support is too uneven to claim a portfolio-level or cross-device product gap, and Soundbox already has active import work (#3/PR #8). Do not turn a native-app release into an immediate PWA parity requirement.

---

## D. Direct-category strategy — WaveFlow keeps ownership/local state first, enrichments optional

**Status:** CONFIRMED current product capability; vendor claims are not outcome measurements.  
**Current release shown:** v1.7.0.  
**Accessed:** 2026-09-18.  
**Source:** https://waveflow.app/

WaveFlow continues to position local ownership as the base product: no subscription, no DRM, no tracking, no cloud, local SQLite and exportable backup. It can optionally add online enrichment, but it explicitly describes a global offline mode that disables those integrations.

For Soundbox, the useful signal is not “add Deezer/Last.fm/lyrics.” It is the opposite: **core library truth should work entirely from the user's files; optional network enrichment is a different layer and should not be required to make imports intelligible.** This supports the minimal #10 scope of reading existing local tags before considering any network metadata service.

**Issue decision:** supports #10's local-only constraint; no additional Issue.

---

## E. Browser/network platform change relevant to active LAN import research

**Status:** CONFIRMED browser-platform behavior.  
**Chrome stable:** Chrome 147, 2026-04-07.  
**Accessed:** 2026-09-18.  
**Source:** https://developer.chrome.com/release-notes/147

Chrome 147 expanded Local Network Access restrictions to WebSocket and WebTransport local-address connections, adding permission prompts; WebTransport restrictions require secure contexts and enterprise policies can affect WebSocket access.

This is relevant because Issue #3's architecture research explicitly contemplated direct HTTPS/WebRTC/WebTransport or signaling/relay choices. However, current PR #8 is already active and its review has unresolved findings, including a placeholder/non-integrated pairing path, original-offer expiry not being enforced, and manifest/descriptor bounds problems. The external LNA evidence therefore does **not** authorize scope expansion or a new transport framework.

**Issue decision:** `DEDUPE + SKIPPED_LOCKED_ACTIVE_PR#8`. Keep the existing requirement for real browser/device runtime verification. No Issue/PR comment write this round.

# New Releases / fresh changes

1. **2026-09-16 — Kasette 1.3.2:** removed Android INTERNET permission; current feature set includes client-side tags/artwork, library backup, PWA/native Android, and fully offline local import.
2. **2026-09-09 / current 2026.9.3 — Anywhere Music Player:** recent release allows audio files to be opened directly in the player from Files/other apps, reinforcing import-friction reduction as a current local-player design axis.
3. **Current v1.7.0 — WaveFlow:** continues a no-account/no-cloud local library position with optional enrichments kept separable from core offline state.

# Community Pain

**COMMUNITY_SIGNAL only; not prevalence evidence.** Recent Reddit discussion on 2026-09-13 reports local-file cover art failing to appear in Spotify, with one user tracing a case to heavy embedded artwork. A separate 2026-09-11 Apple Music thread documents wrong/missing artwork in local-library sync workflows. These are ecosystem-specific anecdotes, not evidence that Soundbox has the same defect.

Sources:
- https://www.reddit.com/r/truespotify/comments/1wf6c7w/local_files_cover_art/
- https://www.reddit.com/r/AppleMusic/comments/1wdmg4z/workaround_wrong_missing_album_artwork_when/

Transferable caution: embedded metadata/art can be large or malformed, so a future parser should be bounded and fail back to normal import rather than make metadata decoding a prerequisite for playback. This is why #10 includes a malformed/oversized metadata fixture but deliberately keeps artwork out of the MVP acceptance criteria.

# Adjacent Ideas

## 1. Preserve, then infer

Canonical import should follow a simple precedence contract:

`existing user-owned file metadata -> safe local parsing -> current filename/default fallback -> later explicit user edit`

This avoids both cloud dependency and unnecessary data loss.

## 2. System-share import as a later mobile convenience

On supporting installed-PWA platforms, `share_target` could eventually reduce `Files -> open Soundbox -> pick the same file again` friction. It should be evaluated only after the current importer and LAN work are stable, and only with explicit platform support/fallback. No new Issue this round.

## 3. User edits remain more authoritative than later re-parsing

If an imported track is manually corrected, backup/restore/relink or future re-import logic must not silently replace that edit with file tags. The product already treats user-created local state as important enough to back up; metadata parsing should preserve that authority boundary.

# Opportunity Map — `soundbox-offline`

| Category | Decision this round |
|---|---|
| MUST MATCH | Reliable local import/playback, source data integrity, offline storage, backup/restore, and clear failure/storage boundaries. |
| SHOULD BE BETTER | Preserve title/artist/album already contained in the user's file before requiring manual correction; keep fallback deterministic and offline. |
| DIFFERENTIATOR | No-account/no-server local ownership plus recoverability; LAN transfer only if browser/runtime/security truth is proven. |
| ADJACENT IDEA | Installed-PWA share target for supported Android/ChromeOS paths; embedded artwork only after text-tag parsing proves value and bounded memory/storage behavior. |
| DO NOT COPY | Native-app rewrite, cloud catalog/enrichment dependency, streaming service, social layer, AI recommendations, subscriptions, or broader format support solely for parity. |

# Cross-portfolio ideas

1. **Preserve user-owned source truth before enrichment.** The same product rule is reusable outside music: when input already contains structured metadata, preserve it and record its provenance before generating defaults or calling a provider. This round does not create a cross-project framework/registry Issue.
2. **Offline/local proof should remain observable.** Kasette's removal of INTERNET permission is a strong distribution/trust signal, but Soundbox is a PWA/Cloudflare-hosted shell and cannot simply copy an Android permission model. If network-proof becomes a user requirement, the smallest validation is runtime network inspection around import/playback, not a new privacy subsystem.

# Rejected Ideas

- **Copy Kasette's Android wrapper** — rejected; owner direction explicitly favors PWA/local-first rather than native rewrite.
- **Cloud metadata lookup (MusicBrainz/Apple/Spotify/Deezer) for #10** — rejected; the user's files already contain the candidate truth and cloud lookup adds privacy, availability, cost and matching ambiguity.
- **Embedded artwork in #10 MVP** — rejected as required scope. Artwork increases storage/memory/backup responsibilities; first fix the title/artist/album manual-reentry gap.
- **Full media-scanner/tag-editor subsystem** — rejected; a bounded importer parser is smaller and directly addresses the current root cause.
- **New Share Target Issue now** — rejected; support is limited, current import work is active, and no observed Soundbox user evidence establishes this as the next bottleneck.
- **Expand Issue #3 because Chrome LNA changed** — rejected. The external browser constraint validates the existing runtime-research boundary; it does not warrant a second networking Issue while PR #8 is active.
- **AI recommendations / smart mixes** — rejected. Competitors may offer them, but they do not solve the verified Soundbox import/recovery job and conflict with `INVEST / SIMPLIFY` priorities.

# Issue Mapping / dedupe

| Signal | Existing/new owner | Result |
|---|---|---|
| Tagged local file loses embedded title/artist/album on canonical import | **NEW #10** | Created; `OPPORTUNITY / NOT_ESTABLISHED / MEDIUM / NEEDS_REVIEW / auto_implementation=false` |
| Kasette embedded artwork | #10 adjacent/non-goal | Report only; not required MVP |
| Anywhere direct open from Files/other apps + Web Share Target | none | ADJACENT IDEA; insufficient cross-platform/user evidence; no Issue |
| Chrome LNA constraints on contemplated LAN transports | #3 / PR #8 | DEDUPE + SKIPPED_LOCKED_ACTIVE_PR; no write |
| WaveFlow optional enrichments | #10 local-only design boundary | Supports minimal scope; no separate Issue |

**Writes this round:** 1 new Issue (`Reese-max/soundbox-offline#10`); 0 existing Issue modifications; 0 PR comments; 0 implementation authorization.

Issue #10 was immediately fetched after creation to verify its real number, URL, state, metadata and body. No lock was needed to rewrite an existing Issue because no existing Issue was modified.

# Current GitHub coordination state

- `#3` has open PR #8 (`devin/issue-3`, head `c5c94cc183b40b859fe1a2c314a12ff2d6a8fd67`) with unresolved review findings. The external radar does not touch its scope.
- `#4` has open PR #6 (`feature/issue-4-ci-regression-gate`) and still needs GitHub-hosted runtime evidence for its acceptance path.
- `#5` has active patch PRs including #9; deployment/runtime exposure remains a separate verification question.
- PR claims and local tests are not treated as merged/default-branch capability.
- #10 is deliberately not READY_FOR_IMPLEMENTATION. The Issue exists to preserve a bounded decision/opportunity, not to start a worker.

# Sources

External / public web:

1. Kasette F-Droid, version 1.3.2, updated 2026-09-16: https://f-droid.org/packages/com.kasette.app/
2. Trove browser-side album-art extraction: https://troveplayer.com/tools/extract-album-art
3. Anywhere Music Player App Store version history, 2026.9.2/2026.9.3: https://apps.apple.com/gb/app/anywhere-music-player/id1669824656
4. WaveFlow current product: https://waveflow.app/
5. MDN `share_target`: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target
6. web.dev PWA OS integration / Web Share Target: https://web.dev/learn/pwa/os-integration
7. Chrome 147 release notes / LNA: https://developer.chrome.com/release-notes/147
8. Reddit local-files artwork community signal, 2026-09-13: https://www.reddit.com/r/truespotify/comments/1wf6c7w/local_files_cover_art/
9. Reddit Apple local-sync artwork community signal, 2026-09-11: https://www.reddit.com/r/AppleMusic/comments/1wdmg4z/workaround_wrong_missing_album_artwork_when/

GitHub evidence used only for product truth/coordination:

- `Reese-max/soundbox-offline@68d8137b77be063cc5ae5468e9e31b81455060a9`
- `README.md`
- `app/page.tsx`
- `public/manifest.webmanifest`
- current product-board audit
- Issues #1/#3/#4/#5 and new #10
- open PRs #6/#8/#9 and PR #8 review timeline

# What Changed

1. **New externally corroborated product opportunity:** a freshly released, closely matched offline/PWA competitor makes client-side embedded tag parsing a first-class import capability, while Soundbox current source demonstrably throws that data away in favor of filename/default guesses.
2. **New Issue #10 created:** the work is deliberately narrowed to local `title / artist / album` preservation with fallback; no cloud metadata, artwork requirement, new DB, native wrapper, or recommendation system.
3. **No severity inflation:** this is not a proven P2/P1 defect. User frequency and runtime performance are not established; severity stays `NOT_ESTABLISHED` and implementation eligibility `NEEDS_REVIEW`.
4. **Active networking work remains untouched:** Chrome LNA evidence validates the need for #3 runtime research but does not justify rewriting PR #8 or opening another transport Issue.
5. **No runtime claim:** no tagged-file import was executed on a real phone/PWA in this radar.

# Classification / scope calibration

### #10

```yaml
issue_quality_version: 2
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
evidence: SOURCE_CONFIRMED
triage: NEEDS_REVIEW
auto_implementation: false
repo_sha: 68d8137b77be063cc5ae5468e9e31b81455060a9
runtime: NEEDS_RUNTIME_VERIFICATION
```

Why this is not `BUG/P2`: the current app still supports importing, manual editing and playback; no supported contract says embedded tags must be preserved, and no measured completion-rate/user-impact data was available. The opportunity is nevertheless concrete because the source path creates a directly observable manual step and a current direct competitor demonstrates the same local-only workflow without cloud dependence.

# Completion / gaps / cursor

- Inventory pagination: COMPLETE for the currently connected Reese-max installation view (41 visible owned / 40 unarchived).
- Quality-gate read: COMPLETE; SHA recorded.
- Current product/default-branch read: COMPLETE for the focus repository.
- Issue/PR/dedupe search: COMPLETE for the focus fingerprint; no open/closed duplicate found before creation.
- External exploration: COMPLETE for this round with a fresh direct competitor, adjacent native workflow, browser-platform path, current local-first peer, and community counterexamples.
- Runtime/device verification: NOT PERFORMED; #10 remains `NEEDS_RUNTIME_VERIFICATION`.
- PR #8 LAN transfer behavior: active/unmerged and source-reviewed; not reclassified as default-branch capability.
- Next fair-rotation cursor: **`Reese-max/skill-foundry`**.

This radar does not declare the repository or portfolio CLEAN.