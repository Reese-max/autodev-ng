# External Competitive / Product / Workflow Radar — 2026-09-17T22:01:29Z

## Status

- Run status: `COMPLETE_WITH_RUNTIME_GAP`
- Rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Fair-rotation target: `Reese-max/spotify-playlist-organizer-mcp`
- Current default branch: `main`
- Current main HEAD: `9b99f580acaf1e0b6631aa911b9222c262ddc1ec` (audit/docs)
- Latest main product-changing baseline: `a0bad36b6ab80185f01f0632f25c8b27ef09dbb8`
- Active persistence implementation inspected: PR #39 `devin/issue-9@1f29ae5b988e039549de35c9591e0c217297f00e`; PR #20 remains a larger active v0.3 integration scope.
- Fresh connected owner pagination: **40 Reese-max-owned repositories; 39 unarchived**. Connector-visible inventory drift from earlier rounds is not treated as proof of repository creation/deletion.
- Next fair-rotation cursor: `taichung-police-intel`
- This round changed no product source, CI/config, secrets, settings, branch, merge, deploy, worker, GOAL, paid service, or production data.
- **0 new Issues; 0 existing Issues modified; 0 PR comments.** New evidence overlaps an actively owned persistence scope, so it is recorded centrally instead of stealing scope.

## Owner Direction / Scope Check

Latest Product Board on main (`.github/quality-audits/2026-09-15T0512Z-product-board-audit.md`) remains **INVEST / SIMPLIFY**. The north-star is a YouTube-first, local, inspectable control surface that moves from a user-confirmed video identity to a truthful, bounded, recoverable playlist result without exposing credentials or guessing whether a write occurred.

The board explicitly deprioritizes hosted transfer SaaS, social discovery, AI recommendation expansion, native apps, subscriptions and provider breadth until the local YouTube mutation contract is trustworthy.

The previous dedicated external-radar round (`2026-09-16T020208Z-external-radar.md`) already rejected turning capture-at-discovery, social sharing, sync history, recommendation and mobile ideas into additional feature batches. Those decisions remain intact.

Since that round, the repository has accumulated an actively owned v0.3 implementation stack. Relevant open scopes include:

- #9 / PR #39 — durable local Personal Music Library persistence;
- #10 / PR #40 — unified `save_music` / remote canonical dedupe;
- #14 / PR #20 — YouTube ↔ local sync/reconciliation;
- #16 / PR #20 — batch import;
- #17 / PR #20 — portable Library export/backup/restore;
- #24 / PR #20 — manual canonical identity review/merge/split;
- #25 / PR #20 — persistent user classification editing;
- #34 — concurrent-save idempotency research;
- #3 / PR #41 — credential lifecycle hardening.

PR #39 is open and has two unresolved Codex review threads at head `1f29ae5b...`, so persistence is plainly under active ownership. The external radar therefore does not modify #9/#17/PR #39/PR #20.

## Product → Market Category

| Product | Market / alternatives | Current differentiated job |
|---|---|---|
| `spotify-playlist-organizer-mcp` | YouTube Music organizer, Soundiiz, TuneMyMusic, FreeYourMusic, Youmix, local/self-hosted music libraries | YouTube-first, local-first exact-identity save/classify/dedupe/reconcile with explicit effect authority and truthful uncertainty |

## Executive Decision

A new first-party policy signal materially changes how the active Personal Music Library should think about persistence:

> **Durable user-owned curation can remain the product goal, but YouTube API-derived metadata cannot be treated as an indefinitely frozen local truth.**

YouTube's current Developer Policies were updated **2026-09-14 UTC**. Section III.E.4 says most Authorized Data outside specified statistical exceptions, and limited Non-Authorized Data, may be stored no longer than 30 calendar days unless the API Client deletes or refreshes it. Stored API Data must also be kept consistent with current YouTube data. The current compliance guide, also updated 2026-09-14, reiterates that developers should not store user information indefinitely and must honor deletion/authorization-loss obligations.

This matters now because active PR #39 intentionally makes a durable SQLite library and persists a mixture of local/user-derived state and YouTube-related identity/metadata. Its schema includes `tracks.title`, `artist`, `album`, `duration_ms`, `track_sources.video_id/url/channel`, playlist name/provider playlist ID, tags/aliases and sync state. Its save path persists `resolved.match.name`, artist/channel, YouTube `videoId`/URL, target playlist name/ID and local category/sync detail.

Not all of those fields necessarily have the same provenance. A `videoId` or title can originate from user input in one path and from YouTube API output in another; tags, categories, aliases and manual merge/split decisions can be local/user-owned. Therefore the correct next step is **not** “TTL the whole database” and not “delete the Personal Library feature.” It is a narrow field/provenance retention decision.

Classification for this signal:

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: HIGH
triage: NEEDS_EVIDENCE
auto_implementation: false
external_policy: CONFIRMED
repo_overlap: ACTIVE_PR_39_AND_PR_20
runtime_verification: NEEDS_RUNTIME_VERIFICATION
write_decision: SKIPPED_LOCKED_ACTIVE_PR
```

No new Issue is created because the evidence directly intersects active persistence/backup implementation. After active ownership clears, re-read current head before deciding whether the narrow retention/provenance change still needs tracking.

## External Signals

### A. Direct platform contract — YouTube API Data has a 30-day refresh/delete boundary

**CONFIRMED — first-party policy, last updated 2026-09-14 UTC; checked 2026-09-17 UTC.**

Sources:
- https://developers.google.com/youtube/terms/developer-policies
- https://developers.google.com/youtube/terms/developer-policies-guide
- https://developers.google.com/youtube/analytics/data_model

Relevant current policy:

- YouTube defines API Data as data/content/information provided to API Clients through YouTube API Services.
- Authorized Data is API Data accessed via user credentials; Non-Authorized Data is API Data accessible without user credentials.
- Certain Authorized statistics may be stored longer, but authorization and deletion status still require periodic verification.
- Other Authorized Data may be stored no longer than 30 calendar days unless deleted or refreshed.
- Limited Non-Authorized Data has the same 30-day delete-or-refresh boundary.
- Stored API Data should be kept consistent with current YouTube API state and the most updated data should be shown to users.
- Revocation/user deletion introduces separate deletion obligations; exact applicability to this local single-owner product should be mapped, not guessed.

**User job affected:** keep a durable personal music library without silently freezing stale provider facts or making the user rebuild local tags/canonical decisions every month.

**Concrete manual failure avoided:** without a provenance boundary, the only simplistic choices would be periodically discarding the entire local library or indefinitely keeping provider-derived metadata. Both are unnecessary if user-owned curation and refreshable provider metadata are separated.

**Transferable design:** `Local/User-Owned Durable State ≠ Provider API Data ≠ Provider Identity ≠ Fresh Provider Presentation`.

**Do not copy/overbuild:** do not create a background crawler, compliance microservice, second database, event-sourcing framework or cloud account system merely to answer which current fields need refresh/delete semantics.

### A2. Direct competitor — Soundiiz makes import review and exact matching inputs explicit

**CONFIRMED — first-party support updated 2026-09-15 / 2026-09-04; checked 2026-09-17 UTC.**

Sources:
- https://support.soundiiz.com/hc/en-us/articles/37958924057234-How-to-Import-a-Playlist-from-a-URL-CSV-File-or-Plain-Text
- https://support.soundiiz.com/hc/en-us/articles/360010006793-What-is-the-CSV-format-to-import-playlists-and-favorites
- https://support.soundiiz.com/hc/en-us/articles/360012968280-How-to-Add-a-Track-to-a-Playlist-or-Import-Favorites-in-Soundiiz

Soundiiz now documents URL/file/plain-text import as one workflow, encourages title+artist with optional album/ISRC instead of guessed values, and asks users to review imported/matched tracks before destination writes.

**User job:** bring an existing list into the organizer without manually entering songs one at a time while still seeing ambiguity before effectful writes.

**Transferable:** explicit input provenance and reviewable matching results are more important than storing every provider response forever.

**Repo mapping:** this is already covered by #16 batch import, #2 selected-video binding and #24 identity review. No new fingerprint.

### B. Adjacent workflow — local/self-hosted libraries emphasize ownership, export and repairable metadata

**CONFIRMED current product positioning; checked 2026-09-17 UTC.**

Sources:
- https://parachord.com/
- https://soundspan.io/
- https://www.youmix.me/
- https://freeyourmusic.com/

The adjacent market repeatedly separates durable personal library intent from individual streaming sources: Parachord markets source translation and standard XSPF ownership; Soundspan unifies local files with provider integrations; Youmix focuses on user tags/playlists around YouTube links; FreeYourMusic highlights rematch and backup when platform matches change.

These are vendor capability/positioning signals, not proof of their contractual compliance or better outcomes.

**Transferable:** durable curation should be centered on user decisions and stable local identity, while service-specific matching/availability stays repairable.

**Do not copy:** hosted cloud backup, social/collaborative surfaces, multi-provider breadth and always-on cross-service mirroring remain outside current direction.

### C. New tool/product pattern — manual matching rules preserve user corrections across later transfers

**CONFIRMED — Soundiiz matching rules updated 2026-08-23; July 2026 changelog published 2026-07-16; checked 2026-09-17 UTC.**

Sources:
- https://support.soundiiz.com/hc/en-us/articles/360012449999-How-to-Create-and-Manage-Matching-Rules-in-Soundiiz
- https://soundiiz.com/blog/july-2026-changelog-audius-smarter-playlist-tools-a-better-mobile-experience/

Soundiiz lets users pin recurring cross-service matches and reuse the correction later. Its July release also emphasizes reviewing/editing those rules and reviewing metadata before scrobbling.

This strongly resembles the active #24/#25 direction: manual identity/classification decisions should outrank future automatic matching. It is useful competitive confirmation, not a new feature gap.

## New Releases / Recent Changes

| Date | Product/source | Change | Product implication |
|---|---|---|---|
| 2026-09-14 | YouTube Developer Policies / compliance guide | Current storage/privacy guidance refreshed; 30-day refresh/delete semantics remain explicit for most API Data | Active local persistence must distinguish durable user state from refreshable provider data |
| 2026-09-15 | Soundiiz import guide | Consolidated URL/file/plain-text import and review-before-destination flow | Supports existing #16/#24; no new Issue |
| 2026-09-11 | Dupi browser extension | Browser-local YouTube Music tagging/search/dedupe/export release 1.3.1 | Confirms demand for thin local organization, but not enough evidence to copy browser-extension scope |
| 2026-08-23 | Soundiiz matching rules | Persistent manual match overrides reused in later transfer/sync | Supports manual identity decisions already in #24 |
| 2026-07-16 | Soundiiz July changelog | Matching Rules page, metadata review, duplicate playlist cleanup | Existing scopes cover these jobs; no new root cause |

## Community Pain

No community anecdote is used to establish incidence or severity this round. The policy/persistence decision is based on first-party YouTube terms plus current repository branch evidence, not Reddit/HN frequency claims.

A market/community signal that “users want to own their library” does not authorize retaining provider API Data indefinitely. Conversely, a provider retention rule does not mean user-authored tags, local aliases or manual canonical decisions must be discarded. Field provenance is the missing decision variable.

## Opportunity Map — `spotify-playlist-organizer-mcp`

### MUST MATCH

- Distinguish provider API Data from user/local curation before durable persistence and backup.
- Refresh/delete YouTube API-derived metadata within the applicable policy boundary rather than silently treating it as timeless local truth.
- Preserve truthful `unavailable/unknown/current` states; temporary provider failures must not rewrite durable user intent.
- Keep explicit user authority for playlist mutations and user-data deletion/revocation semantics.

### SHOULD BE BETTER

- Let the Personal Music Library remain useful when provider metadata expires by keeping user tags, categories, aliases, manual identity decisions and stable local relationships durable.
- Store enough provenance/freshness metadata to know whether a displayed title/channel/provider fact is current without adding a new service.
- Refresh lazily/on-demand where possible instead of creating background infrastructure.

### DIFFERENTIATOR

- Local-first, inspectable separation between `user-owned curation` and `provider-refreshed facts` can be clearer than cloud transfer products that expose only one merged catalog view.
- Existing exact-ID receipts, manual identity overrides and explicit uncertainty provide a strong basis for this separation.

### ADJACENT IDEA

- A backup/export format can distinguish user-owned durable records from provider snapshot fields and mark the latter with source/fetched-at semantics. This should be considered only within #17 after the field matrix is known.

### DO NOT COPY

- Soundiiz/FreeYourMusic hosted multi-account SaaS and continuous cloud sync.
- Browser extension or native mobile app solely because Dupi/Youmix expose those surfaces.
- A central retention registry/framework shared across all Reese-max repos before each provider's actual contract/data flow is proven.
- A blanket “delete the entire DB every 30 days” policy.
- A blanket “all local data is ours forever because it is in SQLite” assumption.

## Cross-Portfolio Ideas

This round strengthens an evidence-backed pattern already seen in Google Maps/Travel Planning work:

`User-Owned Durable Intent ↔ Stable Provider Identifier ↔ Refreshable Provider Metadata ↔ Provider Effect Receipt`

The pattern appears reusable, but this report does **not** open a cross-portfolio framework Issue. Each provider has different terms, data types and exceptions. Reuse should be a small schema/decision vocabulary only when multiple concrete repos need it, not a new service.

## Rejected Ideas / Why

1. **Create a new retention/compliance framework** — rejected; too large for a field-classification question and not owner-authorized.
2. **TTL the whole Personal Music Library at 30 days** — rejected; user/local tags, aliases, classification corrections and manual identity decisions are not automatically YouTube API Data.
3. **Keep every YouTube-derived title/channel/playlist field forever because the database is local** — rejected; local storage does not remove the YouTube API policy boundary.
4. **Delete provider IDs after 30 days** — not established. Exact identifiers can have different provenance and use; classify rather than guess.
5. **Add an always-on refresh daemon** — rejected; first compare no change, documentation, lazy refresh and bounded on-access refresh.
6. **Use scraping to refresh without API quota** — rejected; YouTube policy explicitly disallows undocumented/scraped access routes.
7. **Open another batch-import/matching-rule Issue from Soundiiz** — rejected; #16/#24/#25 already own those user jobs.
8. **Copy FreeYourMusic cloud backup** — rejected; hosted backup is outside local-first scope and does not resolve provider-data retention semantics.

## Four-Gate Decision

### 1. Problem / value

Target user is the owner using a durable local music library. The active persistence branch stores a mixed object containing user/local state and YouTube-related fields and explicitly promises persistence across restart/backups. The first-party YouTube policy establishes that API Data cannot generally be frozen indefinitely: most non-statistical Authorized Data and limited Non-Authorized Data require delete-or-refresh within 30 days, with additional currentness/deletion obligations.

Counterevidence/limits:

- Current **main** does not yet ship the Personal Music Library; the risky persistence path is an active PR, not a deployed main-branch defect.
- Exact field provenance varies by path: URL/video ID/title may be user-supplied, provider-derived or locally normalized.
- No real DB older than 30 days, compliance audit or enforcement event was observed.
- No legal conclusion is claimed beyond the text of the current first-party policy.

Therefore this is a high-priority narrow design/research gate, not a proven P1/P2 production defect.

### 2. Priority

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: HIGH
triage: NEEDS_EVIDENCE
auto_implementation: false
confidence:
  youtube_policy: HIGH
  active_branch_persistence: HIGH
  per_field_policy_mapping: MEDIUM_TO_UNKNOWN
  production_incident: NONE_OBSERVED
```

### 3. Minimum solution

Before inventing infrastructure, compare these options in order:

1. **No code / explicit boundary documentation** — identify which existing fields are user-owned/local vs YouTube API-derived and whether current storage already refreshes them.
2. **Small provenance + freshness fields** — only where a persisted provider field actually needs it; e.g. `source`, `provider_fetched_at` / `provider_refreshed_at`, with a field-level retention matrix.
3. **Lazy/on-access refresh** — when a stale provider field is about to be shown or used for a provider decision, refresh it through the existing YouTube client; preserve user tags/manual identity even if provider content is missing.
4. **Deletion/revocation path** — reuse existing local reset/revoke capabilities if they can satisfy the actual applicable user-data obligation; add only the smallest missing user-facing path.

A background daemon, event store, second database or remote compliance service is not justified unless the narrow experiment proves lazy refresh is insufficient.

### 4. Research / implementation separation

The bounded research question is:

> For every field persisted by the active Personal Music Library/save/backup path, what is its actual provenance (`USER_SUPPLIED | LOCAL_DERIVED | YOUTUBE_AUTHORIZED_API_DATA | YOUTUBE_NON_AUTHORIZED_API_DATA`), current refresh/delete requirement, and minimum safe persistence behavior?

Minimum experiment/evidence:

- Enumerate current PR #39/#20 persisted fields and the exact call/path that supplies each field.
- Use synthetic/local fixtures only to verify provenance markers and stale-field behavior; no production mutation is required.
- If live verification is authorized later, use a disposable/private playlist to confirm read-back/refresh semantics and record SHA, commands, date and result.
- `BUILD`: field matrix shows provider data is durably stored past its valid boundary and a small provenance/freshness/lazy-refresh patch fixes it.
- `NARROW`: only a few provider fields need refresh while most current library state is user/local; patch only those fields.
- `REJECT`: current implementation is changed by the active PR owner such that no provider API Data is durably retained outside allowed/refreshable boundaries.

A `BUILD` result would only authorize a separate next decision after owner review; it does not authorize the radar to modify PR #39/#20.

## Issue / PR Mapping and Coordination

### New external evidence, no write to active scope

- #9 / PR #39 — persistence schema and save path directly overlap the evidence. PR #39 is open at `1f29ae5b...` and has unresolved review threads. Status: `NEW_EXTERNAL_EVIDENCE + DEDUPE + SKIPPED_LOCKED_ACTIVE_PR#39`.
- #17 / PR #20 — export/backup would need the same provider-vs-user data distinction. Status: `DEDUPE + SKIPPED_LOCKED_ACTIVE_PR#20`.
- #14 / PR #20 — reconciliation/currentness semantics are related but do not own legal retention. No scope expansion.
- #24/#25 / PR #20 — manual identity/classification decisions are examples of durable user-owned state; no new Issue.
- #1 — Spotify policy/model-visibility research remains separate; Spotify is legacy and this round does not reopen it.

### Why no new Issue

The fingerprint would be:

`spotify-playlist-organizer-mcp + active Personal Music Library persistence/backup + mixed user-owned and YouTube API-derived fields + durable local retention without field provenance/freshness boundary + provider policy requires refresh/delete for applicable API Data`

That fingerprint intersects active PR #39/#20 exactly. Opening another Issue during active ownership would create duplicate planning and risk broadening the implementation while two current PRs are already under review. The evidence is preserved here for the owner/next round to re-evaluate after those PRs settle.

## Sources

Primary public sources checked this round:

1. YouTube API Services Developer Policies — last updated 2026-09-14 UTC — https://developers.google.com/youtube/terms/developer-policies
2. YouTube compliance guide — last updated 2026-09-14 UTC — https://developers.google.com/youtube/terms/developer-policies-guide
3. YouTube Analytics Data Model — current, explicitly restates 30-day delete/refresh for stored Data API resource metadata — https://developers.google.com/youtube/analytics/data_model
4. YouTube Data API revision history — current, September 14/11/1 2026 updates — https://developers.google.com/youtube/v3/revision_history
5. Soundiiz import workflow — updated 2026-09-15 — https://support.soundiiz.com/hc/en-us/articles/37958924057234-How-to-Import-a-Playlist-from-a-URL-CSV-File-or-Plain-Text
6. Soundiiz CSV format — updated 2026-09-04 — https://support.soundiiz.com/hc/en-us/articles/360010006793-What-is-the-CSV-format-to-import-playlists-and-favorites
7. Soundiiz add/import workflow — updated 2026-08-22 — https://support.soundiiz.com/hc/en-us/articles/360012968280-How-to-Add-a-Track-to-a-Playlist-or-Import-Favorites-in-Soundiiz
8. Soundiiz matching rules — updated 2026-08-23 — https://support.soundiiz.com/hc/en-us/articles/360012449999-How-to-Create-and-Manage-Matching-Rules-in-Soundiiz
9. Soundiiz July 2026 changelog — published 2026-07-16 — https://soundiiz.com/blog/july-2026-changelog-audius-smarter-playlist-tools-a-better-mobile-experience/
10. TuneMyMusic transfer — current — https://www.tunemymusic.com/features/transfer
11. FreeYourMusic — current — https://freeyourmusic.com/
12. Parachord — current beta — https://parachord.com/
13. Soundspan — current — https://soundspan.io/
14. Youmix — current — https://www.youmix.me/
15. Dupi Chrome Web Store — version 1.3.1 updated 2026-09-11 — https://chromewebstore.google.com/detail/dupi-yt-music-playlist-or/aigenoggiahlkplokpmlhojfndombagg

Repository evidence:

- `Reese-max/spotify-playlist-organizer-mcp@main` HEAD `9b99f580acaf1e0b6631aa911b9222c262ddc1ec`
- latest product baseline `a0bad36b6ab80185f01f0632f25c8b27ef09dbb8`
- PR #39 `devin/issue-9@1f29ae5b988e039549de35c9591e0c217297f00e`
- PR #39 `src/library.js` schema blob `abce03192bda0a85d84c3907e807c94bee62a438`
- PR #20 active v0.3 integration scope and review threads
- latest Product Board `.github/quality-audits/2026-09-15T0512Z-product-board-audit.md`
- prior dedicated radar `docs/competitive-intelligence/2026-09-16T020208Z-external-radar.md`

## What Changed

- New high-confidence first-party policy evidence was applied to the now-active durable Personal Music Library implementation, not just to the old YouTube save-only main branch.
- The design boundary is narrowed from “persistent local library” to “persistent user-owned curation + refreshable/deletable provider API facts.”
- Soundiiz/FreeYourMusic/adjacent signals confirm that durable user corrections, rematching and export are useful, but they do not override provider terms.
- No new feature batch was created because import, identity review, classification editing, backup and mobile surfaces already have active owners.
- No Issue/PR was modified because the relevant persistence implementation is actively owned and reviewed.

## Classification / Scope Calibration

- Do not classify this as a current `main` production bug; main has not merged the durable Personal Music Library.
- Do not treat the 30-day policy as requiring deletion of every local field. Provenance determines which fields are YouTube API Data.
- Do not use competitor persistence/backup features as proof of provider-policy permission.
- Do not claim a compliance violation, enforcement incident, user harm frequency or legal conclusion not established by the evidence.
- Do not let a `RESEARCH` decision auto-authorize implementation.
- Do not declare this repo or portfolio CLEAN.

## Completion / Gaps / Cursor

Completed:

- Quality v2 read; rules blob SHA recorded.
- Fresh connected owner inventory enumerated.
- Current main HEAD/product baseline, latest Product Board, prior dedicated radar, open Issues and active PRs reviewed.
- PR #39 comments/review threads inspected; active ownership confirmed.
- Current first-party YouTube policy/compliance docs checked, including update date and storage/currentness language.
- Direct competitor and adjacent workflow signals checked and deduped against existing scopes.
- Central report written as a unique file; no product/Issue/PR implementation write was performed.

Gaps:

- No live YouTube API call or >30-day database was exercised.
- Exact field-by-field provenance across all PR #20 paths remains to be mapped after/with the active owner.
- Actual API project agreement/compliance-audit status was not available and is not inferred.
- No user incidence/ROI claim is made.

Next fair-rotation cursor: `taichung-police-intel`.
