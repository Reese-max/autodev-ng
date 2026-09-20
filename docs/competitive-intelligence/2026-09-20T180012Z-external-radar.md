# External Competitive / New-Product / Workflow Radar — 2026-09-20T18:00:12Z

## Status / scope / evidence boundary

- Run status: **COMPLETE / NO_NEW_ACTIONABLE_ISSUE**.
- Governing rule re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected owner inventory: full pagination returned **42 Reese-max-owned repositories / 41 unarchived**; page 2 was empty. `obsidian-vault` is the only archived repository and is excluded from active product scope.
- Fair-rotation focal repository: `Reese-max/spotify-playlist-organizer-mcp`, continuing the latest radar cursor from `2026-09-20T160247Z-external-radar.md`.
- Current default branch / HEAD: `main@01f84bd496225c3b96d4a022fa8612320fba45df`. The latest product-changing main baseline remains `a0bad36b6ab80185f01f0632f25c8b27ef09dbb8`; later main commits are audit/docs evidence.
- Owner direction re-read from the current README, Product Board, Issues and prior radars: **INVEST / SIMPLIFY** around a YouTube-first, local-first, exact-identity and truthful-effect workflow. Hosted transfer SaaS, social discovery, provider breadth, recommendation expansion and large platform infrastructure remain non-priorities until the local YouTube mutation/library contract is trustworthy.
- Current active scopes checked before this report include #1/#2/#3/#4/#6/#9–#19/#24–#35/#42 and active PRs #20/#36–#41. In particular, Personal Library, canonical identity, classification, import/export, sync/reconciliation, HTTP/mobile surface and credential/channel identity are under active ownership. This radar does not steal or expand those scopes.
- No product source, CI/config, secrets, permissions/settings, branch, merge/deploy, paid request, implementation worker, or GOAL was started. No live YouTube account mutation was executed.
- Portfolio CLEAN is **not declared**.

## Product → Market Category

`spotify-playlist-organizer-mcp` is currently best treated as:

1. a local-first YouTube / YouTube Music collection and playlist-control MCP;
2. an exact-video / canonical-track organizer with explicit preview/apply and recovery semantics;
3. a developing Personal Music Library whose durable user curation must remain separable from refreshable provider facts;
4. not a hosted cross-service transfer business, social music network, or autonomous recommendation service.

The strongest current differentiation is **inspectable local curation + exact identity + truthful partial/unknown write state**, not basic playlist sorting, catalog breadth, or generic transfer coverage.

## External Signals

### A. CONFIRMED — Dupi 1.3.1 makes local tags/search/dedupe/export a thin browser-local YouTube Music workflow

**Updated 2026-09-11; checked 2026-09-20 UTC.**

Source:
- https://chromewebstore.google.com/detail/dupi-yt-music-playlist-or/aigenoggiahlkplokpmlhojfndombagg

The current Chrome Web Store listing describes Dupi as a YouTube Music playlist organizer with:

- local/browser-only storage;
- tags and filtering;
- real-time search;
- duplicate scanning, including different covers of the same song;
- export/backup to Markdown, CSV and JSON;
- no account/data collection requirement.

**User job:** manage a growing YouTube Music collection without repeatedly scrolling the native playlist UI or losing personal organization when the service UI changes.

**Concrete manual work reduced:** repeated visual scanning for duplicates, remembering personal categories, manually reconstructing a collection for export/backup.

**Transferable pattern:** useful organization can stay thin and local. The product does not need cloud accounts or a remote recommendation service to provide meaningful control.

**Repository mapping / counter-evidence:** these jobs are already materially represented by #11/#12/#13/#17/#24/#25 and active PR #20/#40. Dupi therefore **confirms the existing local-library direction rather than exposing a new gap**. No new tag/search/duplicate/export Issue is justified.

**Do not copy:** browser-extension scope, direct DOM coupling, or “different cover == duplicate” heuristics without the current repo's explicit canonical identity / possible-match review boundary.

### A2. CONFIRMED REPRESENTATIVE PATTERN — Soundiiz treats YouTube and YouTube Music as different matching semantics even though they share a user library

**First-party support article dated 2026-02-19; checked 2026-09-20 UTC.** This is older than the preferred 30–90-day window, but it is retained as a representative stable platform-specific workflow pattern.

Source:
- https://support.soundiiz.com/hc/en-us/articles/360011904480-Differences-between-YouTube-and-YouTube-Music-on-Soundiiz

Soundiiz says it intentionally handles matching differently:

- YouTube destination: match toward popular videos in the YouTube catalog;
- YouTube Music destination: match as closely as possible to audio-only music videos and retrieve music-oriented metadata such as artist name;
- the same Google account exposes a shared user library across YouTube and YouTube Music.

**Why this matters:** `videoId` identity, song identity and preferred presentation source are not the same question. A user can legitimately want one canonical song while preferring an official audio-style source over a popular music video.

**Why it does not become a new Issue:** #12 already owns `CanonicalTrack ↔ TrackSource` with official-video / official-audio / live / lyrics / cover semantics; #24 owns human review/merge/split; PR #40 owns remote canonical dedupe policy for `save_music`. Creating a new “YouTube Music matching engine” would duplicate active work and, because YouTube Music has no equivalent public music-catalog API contract exposed here, could also tempt unsupported scraping or opaque matching.

**Product consequence:** preserve source preference as an explicit, bounded policy only if real user workflow evidence requires it; do not collapse “same song” into “same best video.”

### A3. CONFIRMED — Soundiiz's recent YouTube error guidance emphasizes channel/action-local capability, not provider-wide health

**Support guidance updated 2026-08-23; checked 2026-09-20 UTC.**

Source:
- https://support.soundiiz.com/hc/en-us/articles/36413540316946-Can-t-Create-or-Transfer-a-Playlist-to-YouTube-or-YouTube-Music

The current guidance distinguishes temporary request limits, playlist limits, playlist-creation failures, and the fact that one Google account can contain multiple YouTube channels. A successful test on one channel does not prove the connected channel has the same ability.

**Transferable:** `provider=YouTube` is too coarse as a health statement. Operation + authenticated channel identity + exact error reason is a safer recovery boundary.

**Repository mapping:** this is incremental support for existing #42's capability-local error semantics and active PR #41's channel fingerprint / credential scope work. It does **not** authorize a new provider-health registry or multi-account service. Since #41 is active, no comment or scope modification is made.

### B. CURRENT ADJACENT PRODUCT — TidyWL uses pre-delete export / optional local undo instead of pretending destructive YouTube effects are reversible

**Current product checked 2026-09-20 UTC; no reliable first-party launch date exposed on the page.**

Source:
- https://tidywl.com/

TidyWL provides local search/filter/bulk-delete/reorder/export for YouTube collections and states that free deletions are permanent while its paid tier keeps local deletion information for a 90-day undo path.

**User job:** clean a large list without losing the ability to understand or reconstruct what was removed.

**Transferable:** destructive provider effect and local recovery evidence should be separate. A local snapshot/export can support a later explicit restore attempt without pretending YouTube deletion itself was transactional.

**Repository mapping:** #17 already owns portable backup/restore and #19 owns destructive playlist administration with preview/apply + read-back. The external signal is therefore `SHOULD BE BETTER / DEDUPE`, not a new undo subsystem. Do not build an event store or 90-day deletion service unless a concrete destructive-recovery failure remains after #17/#19 land.

### B2. CURRENT MARKET SIGNAL — Playlisted packages review → smart match → export/import/transfer as one flow

**Current 2026 product; checked 2026-09-20 UTC. No reliable release date was exposed.**

Source:
- https://www.playlisted.app/

Playlisted currently advertises review-before-transfer, CSV export/import, cross-platform transfer and matching based on ISRC + fuzzy title + artist verification.

This is useful competitive evidence for the *workflow*, but not for implementation quality or licensing. It maps directly to existing #2/#12/#16/#17/#24. The repo should keep exact identities and human review above fuzzy matching rather than add another opaque resolver or cross-provider matrix.

### C. CONFIRMED PLATFORM CHANGE — YouTube Data API continues to evolve metadata, but no new playlist contract currently requires product expansion

**YouTube Data API revision history checked 2026-09-20 UTC.**

Source:
- https://developers.google.com/youtube/v3/revision_history

Recent revisions include:

- **2026-09-14:** larger thumbnail / playlist-image upload limits;
- **2026-09-11:** new higher-resolution thumbnail sizes for several resources;
- **2026-09-01:** `videos.getRating` accepts `youtube.readonly`;
- the previously recorded **2026-06-01** granular quota split for `search.list` / `videos.insert` remains the relevant contract change for this product and is already tracked in #42.

The September changes do not establish a new music-library user problem. No “support 4K thumbnails”, rating integration, or image-upload Issue is warranted.

## New Releases / Market Moves

| Date / state | Product / platform | Signal | Confidence | Radar consequence |
|---|---|---|---|---|
| 2026-09-11 | Dupi 1.3.1 | local tags/search/dedupe/export for YouTube Music | CONFIRMED capability | validates existing local-library direction; dedupe to #11/#12/#13/#17/#24/#25 |
| 2026-09-11 / 09-14 | YouTube Data API | higher-res thumbnails / larger upload image limits | CONFIRMED | no core JTBD impact; reject feature chasing |
| 2026-08-23 | Soundiiz YouTube troubleshooting | action/channel-specific failure semantics | CONFIRMED vendor workflow | incremental support for #42 + PR #41; no new issue |
| current 2026 | TidyWL | local collection management + export / optional undo evidence | CONFIRMED product capability / vendor claim | supports existing #17/#19; no event-store scope |
| current 2026 | Playlisted | review + smart matching + transfer/export | CONFIRMED vendor capability | duplicates identity/import/export scopes; do not expand providers |

## Community Pain

### COMMUNITY_SIGNAL — YouTube Music playlist sorting rollout appears to be absorbing a long-standing basic organizer job, but recent users report inconsistent large-playlist behavior

Recent r/YouTubeMusic threads in August 2026 describe newly available playlist sorting by title / artist / album and also anecdotal cases where large playlists temporarily displayed duplicate or out-of-order entries. These are individual reports, not prevalence measurements and not evidence that YouTube Music has a persistent production defect.

Sources:
- https://www.reddit.com/r/YoutubeMusic/comments/1vcy87o/playlist_not_sorting_properly_and_adding/
- https://www.reddit.com/r/YoutubeMusic/comments/1vfg6ro/received_sort_by_update_and_its_terribly_broken/

**Product consequence:** basic sort-by-title/artist is increasingly table stakes / platform-native, so it should not be treated as a differentiator. The repo's stronger value remains local tags, canonical identity, explicit provenance and recoverable mutations. Do not use these Reddit anecdotes to manufacture a “fix YouTube sorting” feature or to infer failure rates.

## Repository Truth / Counter-evidence

### Current main already has the small safe collection boundary

The current README explicitly supports:

`free text → identify candidates → user confirms exact videoId → preview/apply → exact playlist mutation receipt`

and exact YouTube / YouTube Music links can use the fast path. It also documents `UNKNOWN_AFTER_WRITE` / `PARTIAL_PLAYLIST_CREATED` recovery and states Spotify is an optional legacy provider.

Therefore external products that do bulk transfer, social sharing, recommendation, browser extensions or multi-provider breadth do not establish a missing core capability by themselves.

### Large library / mobile / persistence work is actively owned, not missing in the abstract

Open PRs #20/#39/#40/#41 and their linked Issues already own the major local-library expansion. External evidence that “local tags/search/export are useful” is not a reason to open another architecture Issue while those changes are active.

### Channel identity is being addressed in the credential work

The recent Soundiiz warning that a Google account may have multiple YouTube channels is relevant, but PR #41 explicitly adds a non-secret channel/account fingerprint during auth/status. Until that active implementation is reviewed/landed/rejected, a second “channel registry” Issue would be scope theft and duplication.

## Opportunity Map — `spotify-playlist-organizer-mcp`

### MUST MATCH

- exact authenticated channel / operation / error semantics for provider effects;
- exact source identity and truthful unknown/partial state;
- user review before low-confidence matching causes writes;
- explicit local-vs-provider provenance for durable library state.

### SHOULD BE BETTER

- preserve user-owned tags, classifications, manual identity decisions and backup/export even when provider facts are refreshed or unavailable;
- make canonical song identity distinct from preferred YouTube source representation;
- for destructive playlist maintenance, offer clear preflight evidence and reuse backup/export rather than promise impossible transactional undo.

### DIFFERENTIATOR

- local-first and inspectable curation with exact receipts and human-overridable canonical identity;
- fail-closed / truthful recovery semantics instead of provider-wide “connected / broken” status;
- no cloud account or opaque recommendation requirement for the core organizer job.

### ADJACENT IDEA

- source preference policy such as `prefer official audio when available` may be useful after canonical identity is stable, but only if real owner workflow shows repeated manual source replacement. For now: `RESEARCH / NOT_ESTABLISHED / NEEDS_EVIDENCE`, no Issue.

### DO NOT COPY

- hosted multi-provider transfer SaaS / subscription packaging;
- DOM-scraping or undocumented YouTube Music endpoints to imitate catalog-specific matching;
- social discovery / public playlist community;
- recommendation expansion before #18 has bounded evidence;
- a new undo/event-sourcing service for playlist deletion;
- basic sort UI as a strategic differentiator.

## Cross-Portfolio Ideas

No new cross-portfolio framework is justified this round.

The reusable pattern remains small and evidence-backed:

`User-Owned Durable Curation ≠ Provider Source Identity ≠ Provider-Fresh Metadata ≠ Effect Authority ≠ Verified Effect Receipt`

It may recur in travel/maps/other provider-backed MCPs, but this round does not create a shared registry/service because each provider has different policy and effect contracts.

## Rejected Ideas / Why

1. **Open a Dupi-inspired tags/search/export feature batch** — rejected; already covered by active library scopes.
2. **Add YouTube Music-specific undocumented scraping/resolution** — rejected; provider/policy risk and duplicates canonical identity research.
3. **Build multi-account/channel registry now** — rejected; active PR #41 already introduces channel fingerprinting; first validate the smaller credential boundary.
4. **Add a generic provider health framework** — rejected; #42 demonstrates operation-local errors are more accurate; use typed local states first.
5. **Add 90-day deletion event store** — rejected; #17 backup + #19 preview/read-back are smaller existing primitives.
6. **Build cross-provider transfer because Playlisted/Soundiiz do it** — rejected; violates current direction and duplicates existing import/identity jobs without owner evidence.
7. **Prioritize title/artist playlist sorting** — rejected as strategic expansion; platform-native sorting is rolling out and local query/tag work is already under active scope.
8. **Open thumbnail/rating feature issues from September YouTube API revisions** — rejected; no supported user-job impact.

## Four-Gate Decision

### 1. Problem / value

No new external signal crossed from “market pattern” to a distinct current user problem that is not already owned by an existing Issue/PR.

The most interesting candidate is **preferred source semantics** (`same canonical song` but user may prefer official audio vs popular video). However:

- #12/#24/#40 already model the identity/source boundary;
- there is no real owner evidence that the current exact-source flow repeatedly selects an unacceptable source after the user confirms it;
- Soundiiz's implementation does not establish that its YouTube Music-specific matching path is available or policy-compatible for this repository;
- a source-preference field can be added later as a local policy if/when the need is observed, without a new engine.

### 2. Priority

Retained centrally only:

```yaml
candidate: preferred-youtube-source-policy
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: LOW_TO_MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

No P0/P1/P2 defect is established by external feature parity, lack of a feature, or community anecdotes.

### 3. Minimum solution

If future workflow evidence shows repeated manual replacement of the selected source, compare in this order:

1. no change — existing exact-video confirmation may be sufficient;
2. documentation / caller preference — ask user to choose the desired candidate explicitly;
3. reuse #12 source type + one optional preference at the selection boundary;
4. only then consider richer matching metadata.

Do not create a new provider, catalog database, scraper, embedding matcher or recommendation service to answer this question.

### 4. Research / implementation separation

No research candidate receives implementation authority in this report. Any future source-preference experiment must be bounded, fixture-driven and end in `BUILD / NARROW / REJECT`. A BUILD result would still require owner-approved product scope and a minimal delivery/acceptance contract.

## Issue Mapping / Coordination

- **New Issues:** 0.
- **Existing Issue edits/comments:** 0.
- **PR edits/comments:** 0.
- **Locks acquired:** none; no Issue/shared-state mutation was attempted.
- Dupi tags/search/export → #11/#13/#17 and #12/#24 for identity; active PR #20.
- Soundiiz YouTube vs YouTube Music source semantics → #12/#24/#40; no duplicate Issue.
- Soundiiz channel/action failure semantics → #42 + PR #41; active scope, no comment.
- TidyWL pre-delete recovery pattern → #17/#19; no event-store Issue.
- Playlisted matching/import/export → #2/#12/#16/#17/#24; no provider-expansion Issue.
- YouTube API Sep revisions → no current JTBD mapping.

## Sources

Checked 2026-09-20 UTC unless otherwise stated.

### First-party / direct product

- YouTube Data API Revision History — https://developers.google.com/youtube/v3/revision_history
- YouTube Data API quota calculator — https://developers.google.com/youtube/v3/determine_quota_cost
- YouTube `playlistItems.insert` — https://developers.google.com/youtube/v3/docs/playlistItems/insert
- Soundiiz: Differences between YouTube and YouTube Music — https://support.soundiiz.com/hc/en-us/articles/360011904480-Differences-between-YouTube-and-YouTube-Music-on-Soundiiz
- Soundiiz: Can't Create or Transfer a Playlist to YouTube / YouTube Music — https://support.soundiiz.com/hc/en-us/articles/36413540316946-Can-t-Create-or-Transfer-a-Playlist-to-YouTube-or-YouTube-Music
- Dupi Chrome Web Store listing — https://chromewebstore.google.com/detail/dupi-yt-music-playlist-or/aigenoggiahlkplokpmlhojfndombagg
- TidyWL — https://tidywl.com/
- Playlisted — https://www.playlisted.app/

### Community signal only

- Reddit r/YouTubeMusic — https://www.reddit.com/r/YoutubeMusic/comments/1vcy87o/playlist_not_sorting_properly_and_adding/
- Reddit r/YouTubeMusic — https://www.reddit.com/r/YoutubeMusic/comments/1vfg6ro/received_sort_by_update_and_its_terribly_broken/

## What Changed / Completion / Gaps / Cursor

Relative to the previous dedicated spotify-playlist-organizer radar:

- Recent Dupi 1.3.1 adds another concrete external confirmation that local tags/search/dedupe/export are useful, but those capabilities are already actively owned.
- Soundiiz's YouTube-vs-YouTube-Music matching distinction sharpens the conceptual split between canonical song identity and preferred source representation; this remains a low-confidence bounded research candidate, not a new feature authorization.
- Recent Soundiiz troubleshooting strengthens operation/channel-local error semantics already represented by #42 + PR #41.
- Current adjacent products strengthen “backup/evidence before destructive effect” without justifying a new undo framework.
- September YouTube API revisions were checked; none create a new core user problem beyond the already-tracked granular quota change.
- No runtime provider test was executed; no provider reliability/frequency claim is made.
- No actionable new fingerprint passed all four gates.
- Next fair-rotation cursor: `Reese-max/google-maps-personal-mcp`.
