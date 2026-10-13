# External Competitive / New-Product / Workflow Radar — 2026-09-19T04:01:46Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY**.
- Owner scope: `Reese-max` only; no third-party repository was modified.
- Issue Quality v2 re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality-rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh owner listing: **41 currently accessible Reese-max-owned repositories / 40 unarchived**. The only repository currently returned as archived is `obsidian-vault`. This report does not infer why older inventory counts differed.
- Fair cursor entering this round: `Reese-max/spotify-playlist-organizer-mcp` (preserved by the prior academic-mcp radar).
- Focal repo: public, owner-controlled, unarchived. Default branch `main`; HEAD re-read immediately before Issue creation: `01f84bd496225c3b96d4a022fa8612320fba45df` (`docs(audit): add fixed 50-persona round 2`). Current audit identifies relevant product baseline as `a0bad36b6ab80185f01f0632f25c8b27ef09dbb8`; later default-branch changes are audit/docs only.
- Owner-approved direction remains **INVEST / SIMPLIFY**: local YouTube-first intent-to-playlist effect broker with exact identity, safe credential lifecycle, truthful receipts and a small personal music library; do not expand into generic transfer SaaS, recommendation feed, hosted accounts, billing, broad UI or provider-count competition before core controls are verified.
- Fixed-50 Round 2 remains **NOT CLEAN / 0 of 2 qualifying rounds**. This radar does not change that state or claim runtime coverage.
- Open PR scopes re-read: #20 (v0.3 local library), #36 (#4 partial-write regression), #37 (#31 sync pagination), #38 (#23 env onboarding), #39 (#9 library persistence), #40 (#10 canonical remote dedupe), #41 (#3/#8 security credential hardening). None was modified.
- #6 full comments/lease history re-read: its runtime-evidence lease is released; current-main bounded timeout/cancellation primitive has isolated local evidence, but stdio closure remains blocked by environment. This round did not modify #6.
- No live YouTube/Spotify provider call, quota exhaustion, OAuth login, production playlist write, deployment, paid request, source/config/CI/secret/settings change, implementation branch, merge, worker or GOAL was started.

## Executive decision

**1 new tracking Issue: `Reese-max/spotify-playlist-organizer-mcp#42`. 0 existing Issue/PR comments. 0 implementation authorizations.**

The highest-value external change is not another playlist feature: YouTube moved `search.list` into its own granular **Search Queries** quota bucket on **2026-06-01**. Current first-party docs state a default allocation of **100 `search.list` calls/day**, separate from the quota used by most other Data API operations, and document quota exhaustion as `403 quotaExceeded`.

That change matters directly to the product's core free-text path. Current `searchVideos()` uses `/search`, while exact YouTube URL/video-ID resolution uses `/videos`. Therefore a user can lose free-text discovery while exact-ID capture and playlist actions remain separately available. Current `YouTubeClient.request()` only gives stable codes to HTTP 429 and 5xx; documented `403 quotaExceeded` is returned as a generic 403 with `code=null`. The provider prose may still mention quota, so this is **not** false success, confirmed outage, or P1/P2 defect evidence. It is a narrow provider-contract maintenance gap with a safe recovery path.

The smallest action is to preserve the provider reason and expose a stable quota state plus exact-ID fallback guidance. Do **not** build a quota dashboard, provider registry, fallback router or auto-request quota increase.

## Product → market category

| Product | Market / alternatives | Current differentiated job |
|---|---|---|
| `spotify-playlist-organizer-mcp` (YouTube-first despite historical name) | Soundiiz, TuneMyMusic, YouTube/YouTube Music, playlist transfer/sync utilities, MCP music tools | Local MCP-native `intent/search or exact link → reviewed exact videoId → explicit preview/apply → truthful YouTube receipt`, with emerging local user-owned library and no hosted account layer |

## External Signals

### A. Direct competitor — Soundiiz increasingly models capability at the action level, not the provider level

**CONFIRMED — support article updated 2026-09-04; checked 2026-09-19 UTC.**

Source: https://support.soundiiz.com/hc/en-us/articles/8493033465746-Soundiiz-Error-104-Can-t-Delete-Rename-or-Remove-Duplicates-on-Some-Platforms

Soundiiz documents Error 104 as an **action-specific** restriction: a platform may accept a playlist while not allowing delete, rename, duplicate removal or a specific operation under current restrictions. It explicitly tells users that reconnecting, changing devices or upgrading does not turn an unsupported provider action into a supported one. The page uses YouTube/YouTube Music duplicate removal as an example where capability may depend on playlist size/current service restrictions.

**User job:** understand exactly which action is unavailable without concluding that the whole connected service is broken.

**Transferable design:** provider state should be operation-scoped enough to support safe recovery (`SEARCH_UNAVAILABLE` is not the same as `PLAYLIST_WRITE_UNAVAILABLE`). This supports the #42 decision to preserve the `/search` quota failure distinctly while not disabling exact-ID `/videos` or playlist paths.

**Do not copy:** no need for a generic capability registry, dynamic service matrix or cross-platform SaaS status page. The current product has one main provider and can represent this with a small typed error and operation context.

### A2. Direct competitor — Soundiiz still separates YouTube vs YouTube Music matching semantics

**CONFIRMED — updated 2026-08-17; checked 2026-09-19 UTC.**

Source: https://support.soundiiz.com/hc/en-us/articles/360011904480-Differences-between-YouTube-and-YouTube-Music-on-Soundiiz

Soundiiz states that YouTube transfers favor popular videos while YouTube Music matching tries to prefer audio-only catalog results and richer music metadata; both share the same user library for a given Google account.

**User job:** choose whether the desired target is a watchable YouTube video or a music-catalog-style track representation.

**Fit here:** Reese-max's stated use case is YouTube-first personal collection/watch-later behavior. Current product deliberately binds to exact `videoId`, which is safer than automatically copying Soundiiz's audio-only matching heuristic.

**Decision:** `DO NOT COPY` at present. No owner evidence shows that “Official Audio vs Official MV” preference is a current blocker, and active #10/#12 work already owns canonical identity/dedupe questions.

### B. Adjacent workflow — TuneMyMusic makes transfer receipts and unmatched items first-class

**CONFIRMED — current product page checked 2026-09-19 UTC; no reliable feature-launch date on the page.**

Source: https://www.tunemymusic.com/features/transfer

TuneMyMusic exposes a full transfer report and downloadable CSV for unmatched tracks, preserves playlist order, and distinguishes remixes/live/alternate versions in matching. It also supports multiple source forms (platform, shared playlist URL, file and free text).

**User job:** after a batch operation, know which items matched, which did not, and what needs manual attention instead of rerunning the whole transfer blindly.

**Fit here:** PR #20/#16 already own batch-import/resumability/per-item results, while #2/#10/#12 own exact selection/canonical identity. This is useful competitive validation for receipts, but **DUPLICATE / ACTIVE_SCOPE** rather than a new Issue.

**Do not copy:** full cross-provider migration, whole-library SaaS, cloud background processing, “official transfer partner” positioning, subscription billing or AI playlist generation are outside owner-approved scope.

### C. Provider strategy — YouTube split search into a granular daily quota bucket

**CONFIRMED — provider policy changed 2026-06-01; current docs checked 2026-09-19 UTC.**

Primary sources:
- Revision history: https://developers.google.com/youtube/v3/revision_history
- Search method: https://developers.google.com/youtube/v3/docs/search/list
- Quota calculator: https://developers.google.com/youtube/v3/determine_quota_cost
- API errors: https://developers.google.com/youtube/v3/docs/errors
- Overview: https://developers.google.com/youtube/v3/getting-started

Provider facts:

1. Since 2026-06-01, `search.list` and `videos.insert` use their own granular buckets.
2. Current default quota is **100 `search.list` calls/day**, each costing 1 unit in the Search Queries bucket.
3. Most other endpoints share a separate default 10,000-unit daily pool.
4. Quota exhaustion is a documented `403 quotaExceeded` condition.
5. Even invalid requests consume quota, so “retry/search again until something works” is not a free recovery strategy.

**Current repo mapping:**

- `youtube_search_videos` → `/search`.
- free-text `youtube_identify_track` / resolve path → `/search`.
- exact YouTube URL or selected `videoId` → `getVideo()` → `/videos`.
- `request()` currently types only 429 and 5xx; 403 quota reason is not preserved as a stable `code`.
- `safeTool/errorResult` forwards a code only when present, so MCP callers cannot reliably branch on quota exhaustion without parsing provider prose.

**User job:** when free-text discovery is temporarily unavailable due to its own quota bucket, preserve the user's ability to continue with a known exact URL/video ID rather than treating the whole provider as generically unavailable.

**Why this is not P2/P1:** no owner quota incident or daily usage frequency was observed; the current error remains an error rather than being normalized to success. The issue is deterministic recovery semantics under a documented provider constraint.

## New Releases / pricing / provider signals

| Date | Product / provider | Change | Implication |
|---|---|---|---|
| 2026-09-15 | Soundiiz docs | account connection/service-management documentation refreshed | continued emphasis on explicit connected-service state; no need to copy multi-account management |
| 2026-09-04 | Soundiiz | Error 104 explains action-specific unsupported operations | supports operation-scoped capability/error semantics, not whole-provider failure |
| 2026-09-01 | Soundiiz transfer docs | explicit review of matched/unavailable transfer results | validates per-item receipts; already covered by active batch scopes |
| 2026-08-23 | Soundiiz | sync remains one-way, Add vs Replace explicit; Run Now constrained by rate limits and concurrency | validates explicit effect semantics and provider constraints; existing #14/#19 active scopes cover sync/admin work |
| 2026-06-01 | YouTube Data API | granular `search.list` and `videos.insert` quota buckets | creates a distinct current operational state for free-text discovery; #42 tracks minimal recovery semantics |

TuneMyMusic currently lists Premium at **$2/month billed annually** and includes unlimited transfer, cross-platform share, daily auto-sync, backup and AI playlist generation. This is only a current commercial-design signal; it is not evidence that Reese-max should monetize or expand into those jobs.

## Community Pain / evidence gaps

No community anecdote was promoted into frequency evidence this round. The actionable finding does not depend on Reddit/HN incidence: the quota bucket, default limit and 403 reason are provider-contract facts, while current code behavior is source evidence.

Important unknowns remain:

- actual owner `search.list` calls/day;
- whether the current MCP host/user frequently starts from free text vs exact YouTube links;
- whether Google grants this specific project more than the default Search Queries quota;
- live response body shape for this owner's configured project at quota exhaustion;
- how often users would benefit from exact-ID recovery in practice.

Those unknowns justify P3 maintenance rather than a higher defect severity. They do not require live quota exhaustion to test the parser/recovery contract: a deterministic local stub is sufficient for regression coverage.

## Adjacent Ideas

### Preserve capability-local degradation instead of provider-wide health

Small reusable product principle:

`provider + operation + observed outcome → truthful local state`

For this repo that can remain tiny:

- `search.list quota exhausted` → search unavailable / exact-ID path may still be attempted;
- auth forbidden → credential/scope path needs attention;
- 429/5xx → bounded read retry semantics from #6;
- ambiguous write timeout → reconciliation state from #4.

This is **not** a proposal for a cross-portfolio provider-health framework.

### Favor exact identity reuse before spending another discovery request

The granular search bucket increases the value of the already-approved architecture: once a user has selected/captured an exact `videoId`, reuse that identity locally rather than repeatedly searching the catalog for the same song. Active #9/#10/#12 work already moves in that direction, so no new Issue is warranted.

## Opportunity Map

| Category | Decision | Rationale |
|---|---|---|
| **MUST MATCH** | Truthful provider/action failure state | A quota-limited `/search` must not be confused with auth or whole-provider failure; #42 is the narrow gap |
| **MUST MATCH** | Exact reviewed identity + explicit write receipts | Already core direction and existing #2/#4/#10/#12 scopes |
| **SHOULD BE BETTER** | Recovery that uses an already-known exact URL/videoId before another search | Low-cost, aligned with local-first identity; no automatic candidate substitution |
| **SHOULD BE BETTER** | Per-item batch result/unmatched state | Competitive validation from TuneMyMusic/Soundiiz; already active #16/#20 scope |
| **DIFFERENTIATOR** | Local MCP-native single-song capture with user-owned library and no hosted music account | Keep; competitors optimize broad transfer/sync SaaS |
| **ADJACENT IDEA** | Operation-level capability hints in receipts | Useful when backed by observed provider errors; implement locally, not as registry |
| **DO NOT COPY** | Full multi-provider transfer/sync SaaS | Outside owner direction and creates auth/policy/maintenance breadth |
| **DO NOT COPY** | AI playlist/recommendation expansion before core evidence gates | #18 remains P3 research; no new evidence overrides sequencing |
| **DO NOT COPY** | Quota dashboard/service/background poller | Overengineering for one provider-specific documented state |

## Four-gate decision — granular YouTube search quota recovery

### 1. Problem / value

Target user starts from song title/free text and expects the MCP to return candidates, bind a selected exact `videoId`, then save safely.

Current supported path:

`free text → searchVideos() → /search → Search Queries bucket`

Current deterministic failure path:

`search bucket exhausted → Google 403 quotaExceeded → request() throws YouTubeApiError(status=403, code=null) → MCP error has status/message but no stable quota code → client must parse prose / may treat provider generically unavailable`.

Counterevidence checked:

- the provider message itself may already mention quota;
- 403 is not auto-retried, so there is no retry storm in current code;
- exact URLs/video IDs take `/videos`, so the entire provider is not necessarily unusable;
- no owner incident or quota-exhaustion frequency was observed.

Therefore this is a narrow maintenance/recovery gap, not a high-severity outage claim.

### 2. Priority

```yaml
kind: MAINTENANCE
severity: P3
decision_priority: MEDIUM
triage: NEEDS_REVIEW
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

P2 is intentionally rejected because there is no evidence that the owner currently reaches the limit frequently or that a broad core workflow is lost without recovery. P1/P0 are unsupported.

### 3. Minimum solution

1. Preserve the documented YouTube error reason before flattening to generic status.
2. Map `403 + quotaExceeded` to a stable non-secret quota state; keep ordinary forbidden/auth failures separate.
3. On free-text search failure, surface exact URL/video ID as the first bounded fallback; do not silently pick a provider/candidate.
4. Reuse existing timeout/retry/error plumbing; do not add persistence or a service.

Why smaller options are insufficient:

- documentation-only leaves MCP callers without a machine-readable state;
- changing only wording still requires client prose parsing;
- increasing quota does not solve truthful degraded-state handling and creates operational/possibly paid/admin burden.

### 4. Research / implementation separation

#42 is a tracking/maintenance Issue only. `auto_implementation=false`; it authorizes no worker, branch, merge, deployment, provider call, Cloud Console change or quota request.

The acceptance path can be deterministic and non-destructive: local stub `/search` returns 403 with `quotaExceeded`; assert typed MCP error and zero retry; then call exact-ID `/videos` fixture and assert no `/search` request. A real quota exhaustion event is not required to validate parser/control flow.

## Rejected Ideas / negative findings

1. **Add automatic provider fallback (Spotify/other catalog) when YouTube search quota is exhausted — REJECT.** It hides provider truth, reintroduces policy/provider breadth and can change identity.
2. **Build a quota dashboard/ledger — REJECT.** Current need is one typed provider state + fallback; no user evidence requires longitudinal quota analytics.
3. **Automatically request or purchase more quota — REJECT.** Admin/approval/cost action is outside this radar and unnecessary for the correctness gap.
4. **Merge #42 into #6 — REJECT.** #6's root cause/closure is bounded deadline/cancellation and finite 429/5xx retry; #42 is a new provider contract (`403 quotaExceeded` + granular search bucket + exact-ID recovery). It should reuse #6 plumbing without changing #6's closure gate.
5. **Open a YouTube-Music audio-only matching feature because Soundiiz does it — REJECT/DEFER.** No owner/user evidence shows that target-version preference is the current blocker; exact video selection is already safer and #10/#12 own identity policy.
6. **Open an unmatched-report feature because TuneMyMusic has one — DUPLICATE / ACTIVE_SCOPE.** #16/#20 already include per-item batch results/resumability and active implementation work.
7. **Expand to Soundiiz-style cross-service sync — REJECT.** Directly outside owner-approved product shape.

## Cross-portfolio ideas

### Provider failure should preserve the actionable capability boundary

Reusable evidence principle:

`provider reachable` is too coarse. A product often needs only enough state to distinguish whether the user's **next safe action** is still possible.

For this repo, `SEARCH_QUOTA_EXHAUSTED` should not imply that exact-ID lookup or playlist writes are confirmed unavailable. The same principle may apply elsewhere, but this report does not create a shared registry/framework or cross-repo implementation mandate.

## Issue Mapping

### Created and read back

- `Reese-max/spotify-playlist-organizer-mcp#42` — **[P3][MAINTENANCE] Surface YouTube search quota exhaustion and preserve exact-ID fallback**
- URL: https://github.com/Reese-max/spotify-playlist-organizer-mcp/issues/42
- state read back: `open`
- fingerprint: `spotify-playlist-organizer-mcp + YouTube free-text identification + search.list granular Search Queries bucket exhausted + provider returns 403 quotaExceeded + adapter emits generic 403 with no stable quota code/fallback:v1`
- classification: `MAINTENANCE / P3 / MEDIUM / NEEDS_REVIEW / auto_implementation=false / NEEDS_RUNTIME_VERIFICATION`

### Existing scopes deliberately not modified

- #6 — bounded request timeout/cancel + 429/5xx read retry; full comments/lease history re-read, no active lease remains, but no scope expansion performed.
- #2 — selected-video binding / identity review, separate root.
- #4 — partial/unknown write truth and reconciliation, separate root.
- #9/#10/#12/#14/#16/#19 and PR #20/#39/#40 — local library, canonical identity, sync/batch/admin work; external transfer/report signals are deduped to those active scopes.
- #18 — recommendations remain P3 research; no new research authority granted.
- PR #36/#37/#38/#41 — active adjacent reliability/security changes left untouched.

## Sources

Primary external sources checked this round:

1. YouTube Data API Revision History — 2026-06-01 granular quota transition; checked 2026-09-19: https://developers.google.com/youtube/v3/revision_history
2. YouTube Data API `search.list` — current Search Queries quota impact/default; checked 2026-09-19: https://developers.google.com/youtube/v3/docs/search/list
3. YouTube Data API Quota Calculator — current default 100 search calls/day and other buckets; checked 2026-09-19: https://developers.google.com/youtube/v3/determine_quota_cost
4. YouTube Data API Errors — `403 quotaExceeded`; checked 2026-09-19: https://developers.google.com/youtube/v3/docs/errors
5. YouTube Data API Overview — current default allocations / quota extension; checked 2026-09-19: https://developers.google.com/youtube/v3/getting-started
6. Soundiiz Error 104 — updated 2026-09-04: https://support.soundiiz.com/hc/en-us/articles/8493033465746-Soundiiz-Error-104-Can-t-Delete-Rename-or-Remove-Duplicates-on-Some-Platforms
7. Soundiiz YouTube vs YouTube Music — updated 2026-08-17: https://support.soundiiz.com/hc/en-us/articles/360011904480-Differences-between-YouTube-and-YouTube-Music-on-Soundiiz
8. Soundiiz Sync semantics — updated 2026-08-23: https://support.soundiiz.com/hc/en-us/articles/360010006193-How-Soundiiz-Playlist-Sync-Works-Direction-Add-vs-Replace-and-Frequency
9. Soundiiz Run Now limits — updated 2026-08-23: https://support.soundiiz.com/hc/en-us/articles/4406331379602-About-Run-now-button-and-running-a-Sync-immediately
10. Soundiiz import sources — updated 2026-09-15: https://support.soundiiz.com/hc/en-us/articles/37958924057234-How-to-Import-a-Playlist-from-a-URL-CSV-File-or-Plain-Text
11. TuneMyMusic transfer workflow / reports — current, checked 2026-09-19: https://www.tunemymusic.com/features/transfer
12. TuneMyMusic plans — current, checked 2026-09-19: https://www.tunemymusic.com/plans

Repository evidence:

- `Reese-max/spotify-playlist-organizer-mcp@01f84bd496225c3b96d4a022fa8612320fba45df`
- relevant product baseline `a0bad36b6ab80185f01f0632f25c8b27ef09dbb8`
- current `src/youtube.js` and `src/server.js` on default branch
- Product Board: `.github/quality-audits/2026-09-14-1610-product-board-audit.md`
- Fixed-50 Round 2: `.github/quality-audits/2026-09-18T0207Z-50-persona-audit-round-2.md`
- Issue Quality v2: `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md@8167e10798071d2276addaff6b201c6b0e904a2a`

## What Changed

- Fresh owner inventory is again available in this run: **41 accessible Reese-max-owned / 40 unarchived**. This supersedes the prior radar's PARTIAL_INVENTORY limitation, without speculating about why older counts differ.
- Established a new provider-contract fact relevant to current core flow: YouTube free-text search has a separate default 100/day Search Queries bucket, while exact-ID lookup uses another method/bucket.
- Confirmed current code does not preserve documented `403 quotaExceeded` as a stable error code even though 429/5xx are typed.
- Created/read back #42 at P3 maintenance severity; no higher severity or incident rate was fabricated.
- Soundiiz's recent action-level capability messaging supports local capability-scoped degradation, but does not justify a registry/framework.
- TuneMyMusic/Soundiiz transfer/report patterns were deduped to existing active library/batch/identity scopes.
- No active PR scope was modified; no implementation authority was granted.

## Classification / scope calibration

- #42: `MAINTENANCE / P3 / MEDIUM / NEEDS_REVIEW / auto_implementation=false / NEEDS_RUNTIME_VERIFICATION`.
- The default 100/day quota is a current provider default, not proof this owner's project has exactly that limit; Google documents that quotas can differ/change.
- `403 quotaExceeded` reachability is provider-contract evidence; owner incidence remains UNKNOWN.
- The current generic error is not called false success: it still reports an error/status and may include provider prose. The gap is stable machine-readable classification + bounded recovery.
- No new recommendation, audio-only matching, cross-provider transfer or quota-service scope is authorized.

## Completion / gaps / cursor

Completed:

- re-read Issue Quality v2 and recorded current blob SHA;
- completed fresh owner repository enumeration and archive check;
- re-read owner-approved product direction, README/tool surface, current default HEAD and fixed-50 Round 2;
- re-read all-state active PR scopes and #6's full comment/lock history;
- searched open/closed Issue space for quota/search-list/403 overlap immediately before new-Issue creation;
- searched branches for quota-specific implementation ownership (none found);
- performed external direct-competitor, adjacent workflow and provider-contract research using public non-GitHub sources, prioritizing first-party provider docs for the technical claim;
- created #42 only after dedupe, read it back open, and did not alter active scopes;
- wrote this unique central report.

Gaps:

- no live `quotaExceeded` response from the owner's project was induced or observed;
- no owner `search.list` daily usage telemetry or current project-specific quota value was read from Google Cloud;
- no real OAuth/provider mutation/mobile runtime was exercised;
- active PRs may change adjacent client paths before #42 is ever implemented, so its repo SHA must be revalidated first.

Fairness: rather than immediately cycling back to recently covered `google-maps-personal-mcp`, advance to a colder unarchived product surface from the fresh inventory. **Next cursor: `Reese-max/soundbox-offline`.**
